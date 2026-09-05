import { boot, $, el, theme, human, fmt, mmss, ival, sigfig } from './common.js';

/* ------------------------------------------------------------------
 * Past winners. Add one line per year — this lives in the source, not
 * the database, so it survives any reset of the Supabase project.
 * ---------------------------------------------------------------- */
const ARCHIVE = [
  { year: '2026\u201327', winner: 'Upperclassmen', note: '' }
];

const { sb } = await boot();
theme($('#themehost'));

drawArchive();

const { data: row } = await sb.from('results').select('*').maybeSingle();
if (!row) {
  $('#pending').hidden = false;
} else {
  render(row.payload);
  $('#recap').hidden = false;
}

function drawArchive() {
  const t = $('#arch');
  const head = el('tr');
  head.append(el('th', null, 'Year'), el('th', null, 'Winner'));
  t.append(head);
  ARCHIVE.forEach(a => {
    const tr = el('tr');
    tr.append(el('td', null, a.year), el('td', null, a.winner));
    t.append(tr);
  });
}

function render(d) {
  $('#year').textContent = d.year || '';

  const room = d.winner ? d.rooms[d.winner] : null;
  if (room) {
    $('#wname').replaceChildren(
      document.createTextNode('Congratulations '),
      el('span', 'room' + d.winner.toUpperCase(), room.name)
    );
  } else {
    $('#wname').textContent = 'Tie';
  }
  $('#wsub').replaceChildren(
    el('span', 'roomA', d.rooms.a.name), document.createTextNode(' ' + fmt(d.teams.a) + ' · '),
    el('span', 'roomB', d.rooms.b.name), document.createTextNode(' ' + fmt(d.teams.b))
  );
  $('#wsw').style.background = d.winner
    ? (d.colors[d.winner] || `var(--${d.winner})`)
    : 'transparent';

  const t = d.totals;
  $('#totals').replaceChildren(...[
    ['Players', String(t.players)],
    ['Submissions', String(t.submissions)],
    ['Correct', t.submissions ? `${Math.round(100 * t.correct / t.submissions)}%` : '—'],
    ['Resubmits', String(t.resubmits)]
  ].map(([k, v]) => {
    const c = el('span', 'tag');
    c.append(document.createTextNode(k + ' '), el('b', null, v));
    return c;
  }));

  const list = $('#qlist');
  d.questions.forEach(q => {
    const box = el('div', 'q');

    const top = el('div', 'qtop');
    const cell = el('span', 'qcell mini');
    const share = q.share || { a: 0, b: 0 };
    const pot = share.a + share.b;
    if (pot <= 0) cell.classList.add('empty');
    else {
      const pct = 100 * share.a / pot;
      const fa = el('i', 'fa'), fb = el('i', 'fb');
      fa.style.width = pct + '%';
      fb.style.width = (100 - pct) + '%';
      cell.append(fa, fb);
    }
    cell.append(el('span', 'qn', String(q.n)));

    const stats = el('div', 'chips');
    [['Players', `${q.right}/${q.attempted}`],
     ['Submissions', `${q.good}/${q.tries}`],
     ['First', q.first === null ? '—' : mmss(q.first)],
     ['Median', q.median == null ? '—' : human(sigfig(q.median))]].forEach(([k, v]) => {
      const c = el('span', 'tag');
      c.append(document.createTextNode(k + ' '), el('b', null, v));
      stats.append(c);
    });
    top.append(cell, stats);
    box.append(top);

    const line = el('p', 'qtext');
    line.append(document.createTextNode(q.prompt + ' '));
    const ans = el('b');
    ans.innerHTML = human(q.answer) + (q.unit ? ` ${q.unit}` : '');
    line.append(ans);
    box.append(line);

    q.top.forEach((s, i) => {
      const r = el('div', 'qrow ' + (s.side || ''));
      r.append(el('span', 'rk', String(i + 1)));
      const sw = el('span', 'sw');
      sw.style.background = s.fav || 'transparent';
      r.append(sw, el('span', 'nm', s.username));
      const iv = el('span', 'iv');
      iv.innerHTML = ival(s.lo, s.hi);
      r.append(iv);
      box.append(r);
    });

    list.append(box);
  });

  const board = $('#board');
  d.board.forEach((p, i) => {
    const r = el('div', 'brow ' + (p.side || ''));
    r.append(el('span', 'rk', String(i + 1)));
    const sw = el('span', 'sw');
    sw.style.background = p.fav;
    r.append(sw, el('span', 'nm', p.username), el('span', 'sc', fmt(p.score)));
    board.append(r);
  });

  const c = d.colors;
  const groups = [[d.rooms.a.name, c.a, 'roomA'], [d.rooms.b.name, c.b, 'roomB'], ['Average', c.all, '']];
  const box = $('#colors');
  groups.forEach(([label, hex, cls]) => {
    const g = el('div', 'cgroup');
    const big = el('div', 'cbig');
    big.style.background = hex || 'transparent';
    g.append(el('p', 'tag ' + cls, label), big);
    box.append(g);
  });
  if (c.closest && c.closest.length) {
    const g = el('div', 'cgroup');
    g.append(el('p', 'tag', 'Closest guesses'));
    c.closest.forEach(x => {
      const r = el('div', 'qrow');
      const sw = el('span', 'sw');
      sw.style.background = x.guess;
      const room = x.side === 'a' ? d.rooms.a.name : x.side === 'b' ? d.rooms.b.name : '';
      r.append(sw, el('span', 'nm', x.username),
               el('span', 'rm room' + (x.side || '').toUpperCase(), room),
               el('span', 'iv', x.d.toFixed(1)));
      g.append(r);
    });
    box.append(g);
  }
}
