// Estimathon — shared helpers
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export async function boot() {
  const meta = await (await fetch('meta.json', { cache: 'no-store' })).json();
  const sb = createClient(meta.supabase.url, meta.supabase.anon, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  return { meta, sb };
}

export const $ = (s, r = document) => r.querySelector(s);
export const el = (tag, cls, txt) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt !== undefined) n.textContent = txt;
  return n;
};

/* ---------- theme ---------- */
export function theme(host) {
  const root = document.documentElement;
  const bar = el('div', 'theme');
  const set = t => {
    root.dataset.theme = t;
    localStorage.setItem('est.theme', t);
    [...bar.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.t === t));
  };
  [['light', 'Light'], ['dark', 'Dark']].forEach(([t, label]) => {
    const b = el('button', null, label);
    b.dataset.t = t;
    b.onclick = () => set(t);
    bar.append(b);
  });
  (host || document.body).append(bar);
  set(localStorage.getItem('est.theme')
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
}

/* ---------- numbers ---------- */
const THIN = '\u2009';

export function cleanNum(s) {
  s = String(s).replace(/[^\d.]/g, '');
  const p = s.split('.');
  return p.length > 1 ? p[0] + '.' + p.slice(1).join('') : s;
}

export function group(raw) {
  let [i, f] = raw.split('.');
  i = (i || '').replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
  if (f === undefined) return i;
  return i + '.' + f.replace(/(\d{3})(?=\d)/g, '$1' + THIN);
}

export function sci(v) {
  if (!isFinite(v) || v <= 0) return '';
  const e = Math.floor(Math.log10(v));
  const m = v / Math.pow(10, e);
  return `${m.toFixed(3)}\u00d710<sup>${e}</sup>`;
}

/** Round to n significant figures. Keeps huge and tiny values finite. */
export function sigfig(v, n = 4) {
  if (!isFinite(v) || v === 0) return v;
  const e = Math.floor(Math.log10(Math.abs(v)));
  const p = Math.pow(10, e - n + 1);
  return Math.round(v / p) * p;
}

/** Human-readable positive number: grouped digits, or scientific when huge. */
export function human(v) {
  if (!isFinite(v) || v <= 0) return '';
  return (v >= 1e12 || v < 1e-4) ? sci(v) : group(String(v));
}

export function fmt(v, d = 1) {
  if (!isFinite(v)) return '0';
  return group(v.toFixed(d));
}

/** Wire a text field so digits auto-group and a scientific preview follows. */
export function numField(input, preview) {
  const redraw = () => {
    const before = input.value.slice(0, input.selectionStart ?? input.value.length);
    const keep = (before.match(/[\d.]/g) || []).length;
    const raw = cleanNum(input.value);
    input.value = group(raw);
    let seen = 0, i = 0;
    for (; i < input.value.length && seen < keep; i++) if (/[\d.]/.test(input.value[i])) seen++;
    try { input.setSelectionRange(i, i); } catch {}
    const v = parseFloat(raw);
    preview.innerHTML = raw && isFinite(v) && v > 0 ? sci(v) : '';
    input.dataset.raw = raw;
  };
  input.addEventListener('input', redraw);
  input.setValue = v => { input.value = v == null ? '' : group(cleanNum(String(v))); redraw(); };
  input.getValue = () => parseFloat(cleanNum(input.value));
  return redraw;
}

/* ---------- CIELAB ---------- */
const lin = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const unlin = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const WX = 0.95047, WY = 1, WZ = 1.08883;

export function hexToLab(hex) {
  const n = parseInt(hex.slice(1), 16);
  const R = lin(((n >> 16) & 255) / 255), G = lin(((n >> 8) & 255) / 255), B = lin((n & 255) / 255);
  const X = R * .4124564 + G * .3575761 + B * .1804375;
  const Y = R * .2126729 + G * .7151522 + B * .0721750;
  const Z = R * .0193339 + G * .1191920 + B * .9503041;
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(X / WX), fy = f(Y / WY), fz = f(Z / WZ);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function labToHex([L, a, b]) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const g = t => (t * t * t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787);
  const X = WX * g(fx), Y = WY * g(fy), Z = WZ * g(fz);
  const R = X * 3.2404542 + Y * -1.5371385 + Z * -0.4985314;
  const G = X * -0.9692660 + Y * 1.8760108 + Z * 0.0415560;
  const B = X * 0.0556434 + Y * -0.2040259 + Z * 1.0572252;
  const h = c => Math.round(Math.min(1, Math.max(0, unlin(c))) * 255).toString(16).padStart(2, '0');
  return '#' + h(R) + h(G) + h(B);
}

export const meanLab = labs => labs.length
  ? [0, 1, 2].map(k => labs.reduce((s, l) => s + l[k], 0) / labs.length)
  : null;

export const dE = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

/* ---------- clock synced to Postgres ---------- */
export async function clock(sb) {
  let skew = 0;
  const sync = async () => {
    const t0 = Date.now();
    const { data } = await sb.rpc('server_now');
    if (data) skew = new Date(data).getTime() - (t0 + Date.now()) / 2;
  };
  await sync();
  setInterval(sync, 60000);
  return () => Date.now() + skew;
}

export const mmss = ms => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export const hhmm = d => d.toTimeString().slice(0, 5);

/** Date -> "YYYY-MM-DDTHH:MM" in local time, the datetime-local field format. */
/** "12:23" -> a Date today at that time. Times are always today's. */
export function atTime(hm) {
  const [h, m] = String(hm).split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

export function localISO(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ---------- tiny inline markup ---------- */
const MD = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;

/** `code`, **bold**, *italic*. Returns DOM nodes, never raw HTML. */
export function inline(text) {
  return String(text).split(MD).filter(c => c !== '').map(c => {
    if (c.startsWith('`') && c.endsWith('`')) return el('code', 'mono', c.slice(1, -1));
    if (c.startsWith('**') && c.endsWith('**')) return el('strong', null, c.slice(2, -2));
    if (c.startsWith('*') && c.endsWith('*')) return el('em', null, c.slice(1, -1));
    return document.createTextNode(c);
  });
}

/* ---------- scoring ---------- */
/**
 * score = (r² / R) · (1 + ln(1 + W)) + c
 *   r  rank by geometric width among correct intervals (widest 1, narrowest R, ties take the lower)
 *   R  number of correct intervals on that question
 *   W  incorrect submissions on that question by everyone but you
 *   c  centring bonus in [0,1], graded server-side
 */
export function score(players, subs, nQ) {
  const latest = new Map();          // pid|idx -> submission
  const wrongTotal = new Array(nQ).fill(0);
  const wrongMine = new Map();       // pid|idx -> count

  for (const s of subs) {
    const k = s.player_id + '|' + s.idx;
    const cur = latest.get(k);
    if (!cur || s.id > cur.id) latest.set(k, s);
    if (!s.correct) {
      wrongTotal[s.idx] = (wrongTotal[s.idx] || 0) + 1;
      wrongMine.set(k, (wrongMine.get(k) || 0) + 1);
    }
  }

  const total = new Map(players.map(p => [p.id, 0]));
  const perQ = new Map(players.map(p => [p.id, new Array(nQ).fill(null)]));
  const byQ = Array.from({ length: nQ }, () => ({ a: 0, b: 0 }));

  for (let q = 0; q < nQ; q++) {
    const good = [];
    for (const p of players) {
      const s = latest.get(p.id + '|' + q);
      if (s) perQ.get(p.id)[q] = s.correct;
      if (s && s.correct) good.push({ p, s, w: Math.log(s.hi / s.lo) });
    }
    const R = good.length;
    if (!R) continue;
    for (const g of good) {
      const r = 1 + good.filter(o => o.w > g.w + 1e-12).length;
      const W = (wrongTotal[q] || 0) - (wrongMine.get(g.p.id + '|' + q) || 0);
      const pts = (r * r / R) * (1 + Math.log(1 + W)) + g.s.center;
      total.set(g.p.id, total.get(g.p.id) + pts);
      if (g.p.side === 'a' || g.p.side === 'b') byQ[q][g.p.side] += pts;
    }
  }

  const rows = players.map(p => ({
    ...p,
    score: total.get(p.id) || 0,
    marks: perQ.get(p.id),
    done: perQ.get(p.id).filter(v => v !== null).length
  })).sort((x, y) => y.score - x.score || x.username.localeCompare(y.username));

  const bySide = s => rows.filter(r => r.side === s);
  const cntA = bySide('a').length, cntB = bySide('b').length;
  const N = Math.min(cntA, cntB);
  const team = s => bySide(s).slice(0, N).reduce((t, r) => t + r.score, 0);

  return { rows, N, cntA, cntB, byQ, teamA: team('a'), teamB: team('b') };
}

/** Interval in closed-interval notation, as HTML. */
export const ival = (lo, hi) => `[${human(lo)}, ${human(hi)}]`;

/**
 * Which room owns the narrowest correct interval on each question.
 * Returns 'a' | 'b' | 'tie' | null (nobody correct) per index.
 */
export function bestSides(players, subs, nQ) {
  const sideOf = new Map(players.map(p => [p.id, p.side]));
  const latest = new Map();
  for (const s of subs) {
    const k = s.player_id + '|' + s.idx;
    const cur = latest.get(k);
    if (!cur || s.id > cur.id) latest.set(k, s);
  }
  const out = new Array(nQ).fill(null);
  const best = new Array(nQ).fill(Infinity);
  for (const s of latest.values()) {
    if (!s.correct || s.idx >= nQ) continue;
    const w = Math.log(s.hi / s.lo);
    const side = sideOf.get(s.player_id) || null;
    if (w < best[s.idx] - 1e-12) { best[s.idx] = w; out[s.idx] = side; }
    else if (Math.abs(w - best[s.idx]) <= 1e-12 && out[s.idx] && side && out[s.idx] !== side) {
      out[s.idx] = 'tie';
    }
  }
  return out;
}
