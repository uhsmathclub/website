import { boot, $, el, theme, numField, clock, human, score, fmt, ival, inline } from './common.js';

const { sb } = await boot();
theme($('#themehost'));

const S = { rooms: [], room: null, me: null, qs: [], subs: [], cur: 0, set: null, now: null, favSet: false };
S.now = await clock(sb);

const show = id => ['join', 'lobby', 'game', 'done']
  .forEach(k => ($('#' + k).hidden = k !== id));

const endsAt = () => {
  const full = new Date(S.set.started_at).getTime()
    + (new Date(S.set.end_at) - new Date(S.set.start_at));
  return S.set.ended_at ? Math.min(full, new Date(S.set.ended_at).getTime()) : full;
};
const started = () => S.set && S.set.started_at;
const over = () => started() && S.now() >= endsAt();

const pull = async () => { const { data } = await sb.from('settings').select('*').single(); S.set = data; };

/* ---------------- boot ---------------- */
const { data: rooms } = await sb.from('rooms').select('*').order('side');
S.rooms = rooms || [];
S.room = S.rooms[0];

const picker = $('#rooms');
S.rooms.forEach(r => {
  const b = el('button', null, `${r.number} · ${r.name}`);
  b.onclick = () => { S.room = r; paintRooms(); };
  picker.append(b);
});
const paintRooms = () => [...picker.children]
  .forEach((b, i) => b.setAttribute('aria-pressed', S.rooms[i] === S.room));
paintRooms();

const emailFor = (u, r) => `${u}.${r.number}@example.com`;
const passFor = (u, r) => `est-${r.code}-${u}`;

$('#fav').addEventListener('input', () => {
  S.favSet = true;
  $('#fav').classList.remove('needs');
});

/* name field accepts nothing but lowercase letters */
$('#u').addEventListener('input', e => {
  e.target.value = e.target.value.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10);
});

/* ---------------- join ---------------- */
$('#joinb').onclick = async () => {
  const err = $('#joine');
  err.textContent = '';
  const u = $('#u').value.trim().toLowerCase();
  const r = S.room;
  if (!u) return err.textContent = 'Required.';
  if (!/^[a-z]{1,10}$/.test(u)) return err.textContent = 'Letters only.';
  if (!S.favSet) return err.textContent = 'Pick a colour.';
  if (!$('#code').value.trim()) return err.textContent = 'Required.';
  if ($('#code').value.trim().toLowerCase() !== r.code.toLowerCase()) return err.textContent = 'Wrong code.';

  $('#joinb').disabled = true;
  const email = emailFor(u, r), password = passFor(u, r);

  let { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    // name is unique across both rooms, so check before making an account
    const { data: free } = await sb.rpc('name_free', { p_name: u });
    if (free === false) {
      $('#joinb').disabled = false;
      return err.textContent = 'Name taken.';
    }
  }
  if (error) ({ data, error } = await sb.auth.signUp({ email, password }));
  if (error || !data.session) {
    $('#joinb').disabled = false;
    return err.textContent = 'Name taken.';
  }

  const { data: row } = await sb.from('players').select('*').eq('id', data.user.id).maybeSingle();
  if (row) S.me = row;
  else {
    const ins = {
      id: data.user.id, username: u, room: r.number, side: r.side,
      fav: $('#fav').value, guess: $('#guess').value
    };
    const { error: e2 } = await sb.from('players').insert(ins);
    if (e2) {
      await sb.auth.signOut();          // do not strand a login with no player
      $('#joinb').disabled = false;
      return err.textContent = 'Name taken.';
    }
    S.me = ins;
  }
  await enter();
};

/* ---------------- entry ---------------- */
async function init() {
  await pull();
  const { data: { session } } = await sb.auth.getSession();
  let row = null;
  if (session) {
    ({ data: row } = await sb.from('players').select('*').eq('id', session.user.id).maybeSingle());
  }
  S.me = row;
  if (over() && !row) return winnerOnly();
  if (!row) return show('join');
  await enter();
}

function badge() {
  const r = S.rooms.find(x => x.side === S.me.side);
  $('#msw').style.background = S.me.fav;
  $('#mname').textContent = S.me.username;
  $('#mroom').textContent = `${S.me.room} · ${r ? r.name : ''}`;
  $('#me').hidden = false;
  $('#brand').hidden = true;
}

async function enter() {
  badge();
  loadHelp();
  $('#honor').hidden = false;
  const [{ data: qs }, { data: subs }] = await Promise.all([
    sb.from('questions').select('*').order('idx'),
    sb.from('submissions').select('*').eq('player_id', S.me.id).order('id')
  ]);
  S.qs = qs || [];
  S.subs = subs || [];
  if (over()) { begin(); $('#honor').hidden = true; $('#warn').hidden = true; return showFinal(); }
  show('lobby');
  lobbyTick();
  if (started()) begin();
}

let lobbyTimer;
function lobbyTick() {
  clearInterval(lobbyTimer);
  lobbyTimer = setInterval(async () => {
    await pull();
    if (started()) { clearInterval(lobbyTimer); begin(); }
  }, 2000);
}

$('#startb').onclick = async () => {
  await pull();
  if (started()) return begin();
  $('#lmsg').textContent = 'Not yet.';
  $('#startb').classList.remove('nudge');
  void $('#startb').offsetWidth;
  $('#startb').classList.add('nudge');
};

/* ---------------- game ---------------- */
const lo = $('#lo'), hi = $('#hi');
numField(lo, $('#lop'));
numField(hi, $('#hip'));

const TICK = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.6"
  stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5 6.3 12 13 4.5"/></svg>`;
const CROSS = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.6"
  stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>`;

const latestFor = i => S.subs.filter(s => s.idx === i).at(-1);
const usedResubs = () => S.subs.length - new Set(S.subs.map(s => s.idx)).size;

function paintDots() {
  const box = $('#dots');
  box.replaceChildren();
  S.qs.forEach((q, i) => {
    const d = el('button', 'dot');
    const s = latestFor(i);
    if (s) { d.classList.add(s.correct ? 'right' : 'wrong'); d.innerHTML = s.correct ? TICK : CROSS; }
    if (i === S.cur) d.classList.add('here');
    d.setAttribute('aria-label', String(i + 1));
    d.onclick = () => goto(i);
    box.append(d);
  });
}

/** Every attempt stays listed; the last one is the one that scores. */
function renderHist(freshId) {
  const box = $('#hist');
  const list = S.subs.filter(s => s.idx === S.cur);
  box.replaceChildren();
  [...list].reverse().forEach((s, i) => {
    const row = el('div', 'hrow');
    if (i === 0) row.classList.add('latest');
    if (freshId && s.id === freshId) row.classList.add('fresh');
    row.append(el('span', 'mark ' + (s.correct ? 'ok' : 'no'), s.correct ? '\u2713' : '\u2717'));
    const span = el('span');
    span.innerHTML = ival(s.lo, s.hi);
    row.append(span);
    box.append(row);
  });
  return list.length;
}

const drawHist = fresh => { $('#hist').hidden = !renderHist(fresh); };

lo.addEventListener('input', () => drawHist());
hi.addEventListener('input', () => drawHist());

function goto(i) {
  if (!S.qs.length) return;
  S.cur = (i + S.qs.length) % S.qs.length;
  const q = S.qs[S.cur];
  const unit = q.unit ? ` · ${q.unit}` : '';
  $('#qnum').textContent = `${S.cur + 1} / ${S.qs.length}`;
  $('#qtext').textContent = q.prompt;
  $('#lolbl').textContent = 'Low' + unit;
  $('#hilbl').textContent = 'High' + unit;
  const s = latestFor(S.cur);
  lo.setValue(s ? s.lo : '');
  hi.setValue(s ? s.hi : '');
  $('#gerr').textContent = '';
  drawHist();
  paintDots();
  paintRes();
}

function paintRes() {
  const left = S.set.resubmits - usedResubs();
  const again = !!latestFor(S.cur);
  $('#res').textContent = `\u21bb ${left}`;
  $('#sub').disabled = again && left <= 0;
  $('#sub').textContent = again ? 'Resubmit' : 'Submit';
}

$('#prevb').onclick = () => goto(S.cur - 1);
$('#nextb').onclick = () => goto(S.cur + 1);

$('#sub').onclick = async () => {
  const a = lo.getValue(), b = hi.getValue();
  const err = $('#gerr'); err.textContent = '';
  if (!(a > 0) || !(b > 0)) return err.textContent = 'Positive numbers only.';
  if (b <= a) return err.textContent = 'High must exceed low.';
  if (a > 1e60 || b > 1e60) return err.textContent = 'Keep under 10^60.';
  $('#sub').disabled = true;
  const { data, error } = await sb.rpc('submit', { p_idx: S.cur, p_lo: a, p_hi: b });
  $('#sub').disabled = false;
  if (error) { err.textContent = 'Try again.'; return; }
  if (!data.ok) {
    err.textContent = ({
      over: 'Time is up.', early: 'Not yet.', resubmits: 'No resubmits left.',
      bounds: 'Check your bounds.', auth: 'Sign in again.', question: 'Unknown question.'
    })[data.why] || 'Try again.';
    return;
  }
  const fresh = Date.now();
  S.subs.push({ idx: S.cur, lo: a, hi: b, correct: data.correct, id: fresh });
  // cleared so a stray second click cannot resubmit the same interval
  lo.setValue('');
  hi.setValue('');
  drawHist(fresh);
  paintDots();
  paintRes();
};

function begin() {
  if (!$('#game').hidden) return;
  show('game');
  $('#archlink').hidden = !over();
  const firstOpen = S.qs.findIndex((_, i) => !latestFor(i));
  goto(firstOpen === -1 ? 0 : firstOpen);
  watchFocus();
}

/* ---------------- after the end ---------------- */
async function finals() {
  const { data, error } = await sb.rpc('final_data');
  if (error || !data) return null;
  const s = score(data.players, data.subs, data.nq);
  const side = s.teamA > s.teamB ? 'a' : s.teamB > s.teamA ? 'b' : null;
  return { ...s, players: data.players, subs: data.subs,
           room: S.rooms.find(r => r.side === side) };
}

function showWinner(room) {
  if (!room) return;
  const tint = room.side === 'a' ? '--a' : '--b';
  $('#fsw').style.background = getComputedStyle(document.documentElement).getPropertyValue(tint);
  $('#fname').textContent = room.name;
  $('#foot').hidden = false;
}

/* questions stay browsable; standing goes in the top bar */
async function showFinal() {
  const f = await finals();
  if (!f) return;
  showWinner(f.room);
  drawPanel(f.byQ || []);
  const i = f.rows.findIndex(r => r.id === S.me.id);
  if (i < 0) return;
  $('#rankp').textContent = `${i + 1} / ${f.rows.length}`;
  $('#scorep').textContent = fmt(f.rows[i].score);
  $('#rankp').hidden = false;
  $('#scorep').hidden = false;
}

/* one cell per question, tinted by whichever room went narrowest */
function drawPanel(byQ) {
  const box = $('#panel');
  box.replaceChildren();
  S.qs.forEach((q, i) => {
    const cell = el('button', 'qcell');
    const share = byQ[i] || { a: 0, b: 0 };
    const pot = share.a + share.b;
    if (pot <= 0) cell.classList.add('empty');
    else {
      const pct = 100 * share.a / pot;
      const fa = el('i', 'fa'), fb = el('i', 'fb');
      fa.style.width = pct + '%';
      fb.style.width = (100 - pct) + '%';
      cell.append(fa, fb);
    }
    cell.append(el('span', 'qn', String(i + 1)));
    if (i === S.cur) cell.classList.add('on');
    cell.onclick = () => {
      goto(i);
      drawPanel(byQ);
      scrollTo({ top: 0, behavior: 'smooth' });
    };
    box.append(cell);
  });
  box.hidden = false;
}

/* no stored login: nothing to review, so just name the winner */
async function winnerOnly() {
  show('done');
  const f = await finals();
  if (f && f.room) {
    $('#dtitle').textContent = f.room.name;
    $('#dsub').textContent = 'Winner';
  }
}

/* ---------------- help sheet ---------------- */
async function loadHelp() {
  const { data } = await sb.from('instructions').select('*').eq('scope', 'play').order('idx');
  const rows = data || [];
  if (!rows.length) return;
  const box = $('#helplist');
  const root = el('ul');
  let sub = null;
  rows.forEach(item => {
    const li = el('li');
    inline(item.text).forEach(n => li.append(n));
    if (item.depth > 0) {
      if (!sub) { sub = el('ul'); (root.lastElementChild || root).append(sub); }
      sub.append(li);
    } else { sub = null; root.append(li); }
  });
  box.replaceChildren(root);
  $('#helpb').hidden = false;
}
$('#helpb').onclick = () => ($('#help').hidden = false);
$('#helpx').onclick = () => ($('#help').hidden = true);
$('#help').onclick = e => { if (e.target === $('#help')) $('#help').hidden = true; };
addEventListener('keydown', e => { if (e.key === 'Escape') $('#help').hidden = true; });

/* ---------------- local nudge (never reported) ---------------- */
function watchFocus() {
  let last = 0, hideT;
  const flag = () => {
    if (Date.now() - last < 1500) return;
    last = Date.now();
    $('#warn').hidden = false;
    clearTimeout(hideT);
    hideT = setTimeout(() => ($('#warn').hidden = true), 6000);
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) flag(); });
  addEventListener('blur', flag);
  let w = innerWidth, h = innerHeight, t;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (Math.abs(innerWidth - w) > 30 || Math.abs(innerHeight - h) > 30) flag();
      w = innerWidth; h = innerHeight;
    }, 400);
  });
}

init();
