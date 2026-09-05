import {
  boot, $, el, theme, clock, mmss, hhmm, atTime,
  hexToLab, labToHex, meanLab, dE, score, fmt, human, inline, ival, sigfig
} from './common.js';

const { sb } = await boot();
theme($('#themehost'));

const { data: roomRows } = await sb.from('rooms').select('*').order('side');
const A = (roomRows || []).find(r => r.side === 'a') || { side: 'a', number: '?', name: 'A', code: '' };
const B = (roomRows || []).find(r => r.side === 'b') || { side: 'b', number: '?', name: 'B', code: '' };
const S = {
  side: localStorage.getItem('est.side') || 'a',
  set: null, players: [], subs: [], lastId: 0, nQ: 0, instr: [],
  qs: [], ans: null, pick: null,
  now: null, readySent: false, waitFrom: 0
};
S.now = await clock(sb);

const show = id => ['gate', 'pre', 'live'].forEach(k => ($('#' + k).hidden = k !== id));
const mine = () => (S.side === 'a' ? A : B);

let toastT;
/** kind: 'ok' (green) or 'bad' (red) */
const toast = (msg, kind = 'bad') => {
  const t = $('#toast');
  t.textContent = msg || '';
  t.className = 'tag toast ' + (msg ? kind : '');
  clearTimeout(toastT);
  if (msg) toastT = setTimeout(() => { t.textContent = ''; t.className = 'tag toast'; }, 4000);
};

/* ---------------- side picker ---------------- */
const sides = $('#sides');
[A, B].forEach(r => {
  const b = el('button', null, `${r.number} · ${r.name}`);
  b.onclick = () => { S.side = r.side; localStorage.setItem('est.side', r.side); paintSides(); };
  sides.append(b);
});
const paintSides = () => [...sides.children]
  .forEach((b, i) => b.setAttribute('aria-pressed', [A, B][i].side === S.side));
paintSides();

/* ---------------- gate ---------------- */
$('#ge').value = localStorage.getItem('est.email') || 'host@estimathon.local';
$('#gb').onclick = async () => {
  $('#gerr').textContent = '';
  const email = $('#ge').value.trim();
  const { error } = await sb.auth.signInWithPassword({ email, password: $('#gp').value });
  if (error) return $('#gerr').textContent = 'Wrong key.';
  const { data: ok } = await sb.rpc('is_admin');
  if (!ok) { await sb.auth.signOut(); return $('#gerr').textContent = 'Not a host.'; }
  localStorage.setItem('est.email', email);
  start();
};

(async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return show('gate');
  const { data: ok } = await sb.rpc('is_admin');
  if (!ok) { await sb.auth.signOut(); return show('gate'); }
  start();
})();

/* ---------------- bootstrap ---------------- */
async function start() {
  await pull();
  await rollStaleDate();

  const r = mine();
  $('#wroom').textContent = r.number;
  $('#wname').textContent = r.name;
  $('#wcode').textContent = r.code;
  $('#who').hidden = false;
  $('#brand').hidden = true;
  $('#resetb').hidden = false;
  $('#wipeb').hidden = false;

  $('#mycode').textContent = r.code;
  $('#striplink').textContent = S.set.join_url;
  $('#stripcode').textContent = r.code;
  $('#lblA').textContent = A.name;
  $('#lblB').textContent = B.name;
  $('#nlblA').textContent = A.name;
  $('#nlblB').textContent = B.name;
  $('#avgAl').textContent = A.name;
  $('#avgBl').textContent = B.name;
  fillTimes();

  const { data: ins } = await sb.from('instructions').select('*').order('idx');
  S.instr = ins || [];

  await poll();
  drawInstructions();
  setInterval(poll, 2000);
  setInterval(tick, 250);
  tick();
}

/** setup.sql anchors times to the day it ran; move them to today if stale. */
async function rollStaleDate() {
  if (S.set.started_at) return;
  const start = new Date(S.set.start_at);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (start >= today) return;
  await sb.rpc('set_times', {
    p_start: atTime(hhmm(start)).toISOString(),
    p_end: windowEnd(hhmm(start), hhmm(new Date(S.set.end_at))).toISOString(),
    p_hide: S.set.hide_seconds,
    p_resubmits: S.set.resubmits
  });
  await pull();
}

/** End time is today's, rolled past midnight if it lands before the start. */
function windowEnd(startHM, endHM) {
  const a = atTime(startHM), b = atTime(endHM);
  if (b <= a) b.setDate(b.getDate() + 1);
  return b;
}

const fillTimes = () => {
  $('#t1').value = hhmm(new Date(S.set.start_at));
  $('#t2').value = hhmm(new Date(S.set.end_at));
  $('#t3').value = Math.round(S.set.hide_seconds / 60);
};

/** Blind window in MILLISECONDS, to match `left`. Never the whole contest. */
const blindMs = () => {
  const durMs = new Date(S.set.end_at) - new Date(S.set.start_at);
  return Math.min(S.set.hide_seconds * 1000, Math.floor(durMs / 2));
};

const pull = async () => { const { data } = await sb.from('settings').select('*').single(); S.set = data; };

/* ---------------- polling ---------------- */
let pollN = 0;

async function poll() {
  const needCount = S.nQ === 0 || pollN % 15 === 0;
  pollN++;

  const jobs = [
    pull(),
    sb.from('players').select('*'),
    sb.from('submissions').select('*').gt('id', S.lastId).order('id')
  ];
  if (needCount) jobs.push(sb.from('questions').select('idx', { count: 'exact', head: true }));

  const [, pl, sub, qc] = await Promise.all(jobs);
  if (pl.data) S.players = pl.data;
  if (sub.data && sub.data.length) {
    S.subs.push(...sub.data);
    S.lastId = sub.data.at(-1).id;
  }
  if (qc) S.nQ = qc.count || 0;
  render();
}

/* ---------------- instructions ---------------- */
const fillTokens = t => {
  const r = mine();
  return t
    .replace(/\{room\}/g, `${r.number} · ${r.name}`)
    .replace(/\{code\}/g, r.code)
    .replace(/\{questions\}/g, S.nQ)
    .replace(/\{resubmits\}/g, S.set.resubmits);
};

function drawInstructions() {
  const box = $('#instr');
  if (!S.instr.length) { box.hidden = true; return; }
  box.replaceChildren();
  const root = el('ul');
  let sub = null;
  S.instr.forEach(item => {
    const li = el('li');
    inline(fillTokens(item.text)).forEach(n => li.append(n));
    if (item.depth > 0) {
      if (!sub) { sub = el('ul'); (root.lastElementChild || root).append(sub); }
      sub.append(li);
    } else {
      sub = null;
      root.append(li);
    }
  });
  box.append(root);
  box.hidden = false;
}

/* ---------------- controls ---------------- */
const stopArming = () => {
  if (pinger) { clearInterval(pinger); pinger = null; }
  S.readySent = false;
  S.waitFrom = 0;
};

$('#savet').onclick = async () => {
  $('#perr').textContent = '';
  const { error } = await sb.rpc('set_times', {
    p_start: atTime($('#t1').value).toISOString(),
    p_end: windowEnd($('#t1').value, $('#t2').value).toISOString(),
    p_hide: Math.max(0, Number($('#t3').value)) * 60,
    p_resubmits: S.set.resubmits
  });
  if (error) return $('#perr').textContent = error.message;
  stopArming();
  await pull();
  fillTimes();
  toast('Saved', 'ok');
};

$('#forceb').onclick = async () => {
  const { data, error } = await sb.rpc('force_start');
  if (error) return toast(error.message);
  if (data) S.set = data;
};

$('#endb').onclick = async () => {
  const { data, error } = await sb.rpc('end_now');
  if (error) return toast(error.message);
  if (data) S.set = data;
  tick();
  toast('Ended', 'ok');
};

$('#resetb').onclick = async () => {
  const { data, error } = await sb.rpc('reset_contest');
  if (error) return toast(error.message);
  S.subs = []; S.lastId = 0;
  stopArming();
  S.set = data || S.set;
  if (!data) await pull();
  fillTimes();
  tick();
  toast('Reset', 'ok');
};

let wipeArmed;
const disarmWipe = () => {
  wipeArmed = null;
  $('#wipeb').textContent = 'Wipe';
  $('#wipeb').classList.remove('arm');
};
$('#wipeb').onclick = async () => {
  if (!wipeArmed) {
    wipeArmed = setTimeout(disarmWipe, 4000);
    $('#wipeb').textContent = 'Confirm';
    $('#wipeb').classList.add('arm');
    return;
  }
  clearTimeout(wipeArmed);
  disarmWipe();
  const { error } = await sb.rpc('wipe_players');
  if (error) return toast(error.message);
  S.players = []; S.subs = []; S.lastId = 0;
  stopArming();
  await pull();
  fillTimes(); tick(); render();
  toast('Wiped', 'ok');
};

async function maybeReady() {
  if (S.readySent || S.set.started_at) return;
  S.readySent = true;
  S.waitFrom = Date.now();
  const { data, error } = await sb.rpc('host_ready', { p_side: S.side });
  if (error) return toast(error.message);
  if (data) S.set = data;
}

let pinger;
function pingLoop() {
  if (pinger) return;
  pinger = setInterval(async () => {
    if (!S.set || S.set.started_at || new Date(S.set.start_at).getTime() > S.now()) {
      stopArming();
      return;
    }
    const { data } = await sb.rpc('host_ready', { p_side: S.side });
    if (data) S.set = data;
  }, 1000);
}

/* ---------------- clock / phases ---------------- */
const endsAt = () => {
  const full = new Date(S.set.started_at).getTime()
    + (new Date(S.set.end_at) - new Date(S.set.start_at));
  return S.set.ended_at ? Math.min(full, new Date(S.set.ended_at).getTime()) : full;
};

function tick() {
  if (!S.set) return;
  const now = S.now();

  if (!S.set.started_at) {
    show('pre');
    $('#endb').hidden = true;
    $('#pubb').hidden = true;
    const d = new Date(S.set.start_at).getTime() - now;
    $('#preclk').textContent = d > 0 ? mmss(d) : '0:00';
    $('#prewin').textContent =
      `${hhmm(new Date(S.set.start_at))} \u2192 ${hhmm(new Date(S.set.end_at))}`;
    $('#cA').textContent = S.players.filter(p => p.side === 'a').length;
    $('#cB').textContent = S.players.filter(p => p.side === 'b').length;

    if (d > 0) {
      // start pushed into the future (fresh config, or a reset) — stand down
      stopArming();
      $('#ready').textContent = '';
      $('#forceb').hidden = true;
      $('#acts').hidden = true;
    } else {
      maybeReady();
      pingLoop();
      const me = S.side === 'a' ? S.set.ready_a : S.set.ready_b;
      const other = S.side === 'a' ? S.set.ready_b : S.set.ready_a;
      $('#ready').textContent = me && !other ? 'Waiting for host…' : '';
      $('#forceb').hidden = !(S.waitFrom && Date.now() - S.waitFrom > 10000 && !other);
      $('#acts').hidden = $('#forceb').hidden && !$('#ready').textContent;
    }
    return;
  }

  show('live');
  const left = endsAt() - now;
  const blind = left > 0 && left <= blindMs();
  const over = left <= 0;
  $('#clk').hidden = over;
  $('#clk').textContent = mmss(left);
  $('#window').textContent =
    `${hhmm(new Date(S.set.started_at))} \u2192 ${hhmm(new Date(endsAt()))}`;
  $('#endb').hidden = over;
  $('#pubb').hidden = !over;
  $('#lb').hidden = blind;
  $('#tug').hidden = blind;
  $('#blindmsg').hidden = !blind;
  $('#strip').hidden = over;
  $('#phase').textContent = '';
  $('#winner').hidden = !over;
  $('#colors').hidden = !over;
}

/* ---------------- question panel ---------------- */
const isOver = () => S.set && S.set.started_at && S.now() >= endsAt();

let keyP = null;
function loadKey() {
  if (keyP) return keyP;
  keyP = (async () => {
    const [{ data: qs }, { data: an }] = await Promise.all([
      sb.from('questions').select('*').order('idx'),
      sb.from('answers').select('*')
    ]);
    S.qs = qs || [];
    S.ans = {};
    (an || []).forEach(a => (S.ans[a.idx] = a.value));
  })();
  return keyP;
}

function fillCell(cell, share) {
  const pot = share.a + share.b;
  if (pot <= 0) { cell.classList.add('empty'); return; }
  const pct = 100 * share.a / pot;
  const fa = el('i', 'fa'), fb = el('i', 'fb');
  fa.style.width = pct + '%';
  fb.style.width = (100 - pct) + '%';
  cell.append(fa, fb);
}

function drawPanel() {
  const { byQ } = score(S.players, S.subs, S.nQ);
  const box = $('#panel');
  box.replaceChildren();
  for (let i = 0; i < S.nQ; i++) {
    const cell = el('button', 'qcell');
    fillCell(cell, byQ[i] || { a: 0, b: 0 });
    cell.append(el('span', 'qn', String(i + 1)));
    if (S.pick === i) cell.classList.add('on');
    cell.onclick = () => { S.pick = i; drawPanel(); showQ(i); };
    box.append(cell);
  }
  $('#qwrap').hidden = false;
}

function chips(pairs) {
  const row = el('div', 'qchips');
  pairs.forEach(([k, v]) => {
    const c = el('span', 'tag');
    c.append(document.createTextNode(k + ' '));
    c.append(el('b', null, v));
    row.append(c);
  });
  return row;
}

function drawStats() {
  const total = S.subs.length;
  const good = S.subs.filter(s => s.correct).length;
  const distinct = new Set(S.subs.map(s => s.player_id + '|' + s.idx)).size;
  const box = $('#stats');
  box.replaceChildren(chips([
    ['Players', String(S.players.length)],
    ['Submissions', String(total)],
    ['Correct', total ? `${Math.round(100 * good / total)}%` : '—'],
    ['Resubmits', String(total - distinct)]
  ]));
}

/** All per-question numbers in one place. */
function qStats(i) {
  const all = S.subs.filter(s => s.idx === i);
  const latest = new Map();
  all.forEach(s => {
    const cur = latest.get(s.player_id);
    if (!cur || s.id > cur.id) latest.set(s.player_id, s);
  });
  const right = [...latest.values()].filter(s => s.correct)
    .sort((x, y) => Math.log(x.hi / x.lo) - Math.log(y.hi / y.lo));
  const good = all.filter(s => s.correct).length;
  const t0 = new Date(S.set.started_at).getTime();
  const firstOk = all.filter(s => s.correct)
    .map(s => new Date(s.created_at).getTime()).sort((x, y) => x - y)[0];
  // median geometric midpoint of everyone's final interval, in log space
  const lmid = [...latest.values()]
    .map(s => (Math.log(s.lo) + Math.log(s.hi)) / 2).sort((x, y) => x - y);
  const n = lmid.length;
  const median = n
    ? Math.exp(n % 2 ? lmid[(n - 1) / 2] : (lmid[n / 2 - 1] + lmid[n / 2]) / 2)
    : null;

  return {
    right, good, bad: all.length - good, tries: all.length,
    attempted: latest.size, first: firstOk ? firstOk - t0 : null, median
  };
}

function showQ(i) {
  const q = S.qs[i];
  const box = $('#qshow');
  box.replaceChildren();
  if (!q) return;

  const head = el('p', 'qhead');
  head.append(document.createTextNode(`${i + 1}. ${q.prompt} `));
  const a = el('b');
  a.innerHTML = human(S.ans[i]) + (q.unit ? ` ${q.unit}` : '');
  head.append(a);
  box.append(head);

  const st = qStats(i);
  box.append(chips([
    ['Players', `${st.right.length}/${st.attempted}`],
    ['Submissions', `${st.good}/${st.tries}`],
    ['First', st.first === null ? '—' : mmss(st.first)],
    ['Median', st.median === null ? '—' : human(sigfig(st.median))]
  ]));

  const who = new Map(S.players.map(p => [p.id, p]));
  st.right.slice(0, 5)
    .forEach((sub, k) => {
      const p = who.get(sub.player_id) || {};
      const row = el('div', 'qrow ' + (p.side || ''));
      row.append(el('span', 'rk', String(k + 1)));
      const sw = el('span', 'sw');
      sw.style.background = p.fav || 'transparent';
      row.append(sw, el('span', 'nm', p.username || '?'));
      const iv = el('span', 'iv');
      iv.innerHTML = ival(sub.lo, sub.hi);
      row.append(iv);
      box.append(row);
    });
}

/* ---------------- publish the public recap ---------------- */
const schoolYear = () => {
  const d = new Date();
  const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}\u2013${String((y + 1) % 100).padStart(2, '0')}`;
};

function snapshot() {
  const { rows, N, byQ, teamA, teamB } = score(S.players, S.subs, S.nQ);
  const who = new Map(S.players.map(p => [p.id, p]));

  const labs = side => rows.filter(r => r.side === side).map(r => hexToLab(r.fav));
  const labA = labs('a'), labB = labs('b');
  const mA = meanLab(labA), mB = meanLab(labB), mAll = meanLab([...labA, ...labB]);

  const total = S.subs.length;
  const good = S.subs.filter(s => s.correct).length;
  const distinct = new Set(S.subs.map(s => s.player_id + '|' + s.idx)).size;

  return {
    year: schoolYear(),
    finished: new Date(endsAt()).toISOString(),
    rooms: { a: { name: A.name, number: A.number }, b: { name: B.name, number: B.number } },
    winner: teamA > teamB ? 'a' : teamB > teamA ? 'b' : null,
    teams: { a: teamA, b: teamB, n: N },
    totals: {
      players: S.players.length,
      submissions: total,
      correct: good,
      resubmits: total - distinct
    },
    colors: {
      a: mA ? labToHex(mA) : null,
      b: mB ? labToHex(mB) : null,
      all: mAll ? labToHex(mAll) : null,
      closest: mAll ? rows.map(r => ({ username: r.username, guess: r.guess, d: dE(hexToLab(r.guess), mAll) }))
        .sort((x, y) => x.d - y.d).slice(0, 5) : []
    },
    board: rows.map(r => ({ username: r.username, side: r.side, fav: r.fav, score: r.score })),
    questions: S.qs.map((q, i) => {
      const st = qStats(i);
      return {
        n: i + 1, prompt: q.prompt, unit: q.unit || '', answer: S.ans[i],
        share: byQ[i] || { a: 0, b: 0 },
        right: st.right.length, attempted: st.attempted,
        good: st.good, tries: st.tries, first: st.first, median: st.median,
        top: st.right.slice(0, 5).map(sub => {
          const p = who.get(sub.player_id) || {};
          return { username: p.username || '?', side: p.side || null, fav: p.fav || null, lo: sub.lo, hi: sub.hi };
        })
      };
    })
  };
}

let published = false;
async function publish(manual) {
  if (published && !manual) return;
  if (!S.nQ || !S.qs.length) {
    if (manual) toast('Still loading.');
    return;
  }
  published = true;
  const { data, error } = await sb.rpc('publish_results', { p: snapshot() });
  if (error) { published = false; return toast(error.message); }
  if (data === false) { published = false; return toast('Not allowed yet.'); }
  toast('Published', 'ok');
}
$('#pubb').onclick = () => publish(true);

/* ---------------- render ---------------- */
function render() {
  if (!S.set || !S.set.started_at) return;
  const { rows, N, teamA, teamB } = score(S.players, S.subs, S.nQ);

  $('#nA').textContent = rows.filter(r => r.side === 'a').length;
  $('#nB').textContent = rows.filter(r => r.side === 'b').length;
  $('#nbadge').textContent = N ? `top ${N}` : '';

  $('#tA').textContent = `${A.name} ${fmt(teamA)}`;
  $('#tB').textContent = `${B.name} ${fmt(teamB)}`;
  const pot = teamA + teamB;
  const pctA = pot > 0 ? 100 * teamA / pot : 50;
  $('#fa').style.width = `${pctA}%`;
  $('#fb').style.left = `${pctA}%`;

  const box = $('#lb');
  box.replaceChildren();
  rows.forEach((r, i) => {
    const row = el('div', 'row ' + r.side);
    row.append(el('span', 'rk', String(i + 1)));
    const sw = el('span', 'sw'); sw.style.background = r.fav; row.append(sw);
    row.append(el('span', 'nm', r.username), el('span', 'sc', fmt(r.score)));
    box.append(row);
  });

  const winSide = teamA > teamB ? 'a' : teamB > teamA ? 'b' : null;
  const winRoom = winSide === 'a' ? A : winSide === 'b' ? B : null;
  if (winRoom) {
    const favs = rows.filter(r => r.side === winSide).map(r => hexToLab(r.fav));
    const m = meanLab(favs);
    $('#wsw').style.background = m ? labToHex(m) : 'transparent';
    $('#winname').replaceChildren(
      document.createTextNode('Congratulations '),
      el('span', winSide === 'a' ? 'roomA' : 'roomB', winRoom.name)
    );
    $('#winsub').textContent = fmt(Math.max(teamA, teamB));
  } else {
    $('#winname').textContent = 'Tie';
    $('#winsub').textContent = '';
  }

  paintColors(rows);

  if (isOver()) loadKey().then(() => { drawPanel(); drawStats(); publish(); });
  else { $('#qwrap').hidden = true; S.pick = null; }
}

function paintColors(rows) {
  const labs = side => rows.filter(r => r.side === side).map(r => hexToLab(r.fav));
  const labA = labs('a'), labB = labs('b');

  const fill = (bigId, rowId, list) => {
    const m = meanLab(list);
    $('#' + bigId).style.background = m ? labToHex(m) : 'transparent';
    const host = $('#' + rowId);
    host.replaceChildren();
    list.forEach(l => {
      const s = el('span', 'sw');
      s.style.background = labToHex(l);
      host.append(s);
    });
  };

  fill('bigA', 'dotsA', labA);
  fill('bigB', 'dotsB', labB);

  const truth = meanLab([...labA, ...labB]);
  $('#bigAll').style.background = truth ? labToHex(truth) : 'transparent';

  const box = $('#close');
  box.replaceChildren();
  if (!truth) return;
  rows.map(r => ({ r, d: dE(hexToLab(r.guess), truth) }))
    .sort((x, y) => x.d - y.d)
    .slice(0, 5)
    .forEach(({ r, d }) => {
      const c = el('div', 'chip');
      const s = el('span', 'sw'); s.style.background = r.guess;
      c.append(s, el('span', null, r.username),
               el('span', 'rm ' + r.side, r.side === 'a' ? A.name : B.name),
               el('span', 'tag', d.toFixed(1)));
      box.append(c);
    });
}
