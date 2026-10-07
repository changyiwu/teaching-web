/* ==========================================================================
   3-3-1（第三冊 3-1）利用提公因式與乘法公式做因式分解 — 互動 Canvas 與隨堂評量
   畫風：蒙德里安色塊拼板工作室（小格、阿方）。粗框線分割的紅、藍、黃色塊，
   就是代數磚：紅色大方塊是 x²（或 a²），藍色長條是 x（或 ab），黃色小方塊是 1
   （或 b²）。幾塊色塊拼成一個長方形，長和寬就是因式。
   玫瑰 MD_ROSE 是錯誤、扣掉或不成立，翡翠綠 MD_JADE 是成立的結果。

   共用工具在 ../math-canvas.js（T／IT／VF／FR／PW／GRP／SEQ／measure／drawExpr／
   drawStepRows／drawPanel／wbrEq／textCenter／textLeft／bindPickGroup…），
   本檔只放本節的色票、多項式工具與 11 個互動。

   ⚠️ 多項式工具（mdParse／py*／rq*／rp*／rpLongDiv／drawLongDiv）由 3-1-3 的
   qlParse／py*／rq*／rp* 搬來（各頁各自載入，不會撞名），只把 qlParse 擴充成
   也認得方括號 [ ]。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initDivCanvas();
  initProdCanvas();
  initFactorCanvas();
  initCoefCanvas();
  initCommonCanvas();
  initExtractCanvas();
  initFlipCanvas();
  initDiffSqCanvas();
  initBracketCanvas();
  initSumSqCanvas();
  initDiffSq2Canvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具（MD_ = Mondrian；共用檔沒有這個前綴）
   ========================================================================== */

const MD_RED = '#fca5a5';     // x²、a² 的紅色大方塊
const MD_BLUE = '#93c5fd';    // x、ab 的藍色長條；除式
const MD_YELLOW = '#fde047';  // 1、b² 的黃色小方塊
const MD_FRAME = '#e2e8f0';   // 蒙德里安的粗框線（深色底上改用淺色）
const MD_ROSE = '#fb7185';    // 錯誤、扣掉、不成立
const MD_JADE = '#6ee7b7';    // 成立的結果
const MD_CREAM = '#fef3c7';   // 深色底板上的算式字色

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const MD_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9', '#fca5a5', '#f0abfc'];

function elById(id) {
  return document.getElementById(id);
}

function iv(el) {
  return parseInt(el.value, 10);
}

// canvas 上的減號換成數學減號 −，投影時比連字號清楚
function mn(s) {
  return String(s).replace(/-/g, '−');
}

// 係數不可為 0 的滑桿：拖過 0 時直接跳到另一邊
function nzSlider(el) {
  if (!el) return;
  let last = iv(el) || 1;
  el.addEventListener('input', () => {
    let v = iv(el);
    if (v === 0) { v = last > 0 ? -1 : 1; el.value = v; }
    last = v;
  });
}

/* --------------------------------------------------------------------------
   算式字串 → canvas 元件（3-1-3 的 qlParse，多認得方括號）
   原始字串一律用 ASCII 寫：「3x^2 - 5x + 4」「(x - 3)[(2x + 1) - (x + 2)]」。
     - 小寫英文字母走斜體
     - ^n 接在數字、字母或括號後面就是乘方
     - canvas 上的 - 換成數學減號 −
     - · 是乘號：canvas 上畫成 ×（細小的 · 投影時看不見），LaTeX 那邊用 tx() 換成 \cdot
   -------------------------------------------------------------------------- */
function mdParse(str, color) {
  const out = [];
  let buf = '';
  const flush = () => {
    if (buf) { out.push(T(buf.replace(/-/g, '−').replace(/·/g, ' × '), color)); buf = ''; }
  };
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(' || ch === '[') {
      let d = 1, j = i + 1;
      while (j < str.length) {
        if (str[j] === '(' || str[j] === '[') d++;
        else if (str[j] === ')' || str[j] === ']') { d--; if (d === 0) break; }
        j++;
      }
      flush();
      out.push(GRP([SEQ(mdParse(str.slice(i + 1, j), color), color, 1)], ch === '[' ? '[]' : '()', color));
      i = j;
      continue;
    }
    if (ch === '^') {
      let e = '';
      while (i + 1 < str.length && /[0-9]/.test(str[i + 1])) e += str[++i];
      const m = buf.match(/[0-9.]+$/);
      if (m) {
        buf = buf.slice(0, buf.length - m[0].length);
        flush();
        out.push(PW(T(m[0], color), e, false, color));
      } else {
        flush();
        const last = out.pop();
        if (last && last.t === 'grp') out.push(PW(last.items[0], e, true, color));
        else out.push(PW(last, e, false, color));
      }
      continue;
    }
    if (/[a-z]/.test(ch)) {
      flush();
      out.push(IT(ch, color));
      continue;
    }
    buf += ch;
  }
  flush();
  return out;
}

function mdInk(s, color) {
  return SEQ(mdParse(String(s), color), color, 1);
}

// 同一條字串給 MathJax：· 換成 \cdot
function tx(s) {
  return String(s).replace(/·/g, ' \\cdot ');
}

// 一塊蒙德里安色塊：半透明填色、淺色粗框
function mdBlock(ctx, x, y, w, h, color, opts) {
  const o = opts || {};
  if (w <= 0 || h <= 0) return;
  ctx.save();
  ctx.globalAlpha = o.alpha == null ? 0.28 : o.alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = o.frameAlpha == null ? 0.9 : o.frameAlpha;
  ctx.strokeStyle = o.frame || MD_FRAME;
  ctx.lineWidth = o.lw || 3;
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

// 被扣掉的部分：斜線網底
function mdHatch(ctx, x, y, w, h, color, cross) {
  if (w <= 0 || h <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.4;
  for (let t = -h; t < w; t += 9) {
    ctx.beginPath(); ctx.moveTo(x + t, y + h); ctx.lineTo(x + t + h, y); ctx.stroke();
    if (cross) { ctx.beginPath(); ctx.moveTo(x + t, y); ctx.lineTo(x + t + h, y + h); ctx.stroke(); }
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function mdLine(ctx, x1, y1, x2, y2, color, width, dash) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 2;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

// 墊一塊深色底再畫算式：線條穿過文字時仍讀得到
function labelBox(ctx, items, cx, cy, size, color) {
  const w = exprWidth(ctx, items, size, 6) + 16;
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  roundRect(ctx, cx - w / 2, cy - size * 0.85, w, size * 1.7, 8);
  ctx.fill();
  ctx.restore();
  drawExpr(ctx, items, cx, cy, size, color, { gap: 6 });
}

// 置中的一行算式（中文字與算式元件混排）
function exLine(ctx, items, y, size, color) {
  return drawExpr(ctx, items, ctx.canvas.width / 2, y, size || 17, color || INK, { maxW: ctx.canvas.width - 60, gap: 6 });
}

/* --------------------------------------------------------------------------
   整數係數多項式：以係數陣列表示，索引就是次數。[4, -5, 3] 代表 3x² − 5x + 4。
   字串一律是 ASCII（x^2），同一條字串可以直接當 LaTeX，也可以給 mdInk。
   -------------------------------------------------------------------------- */

// 係數的絕對值 a 與次數 d → 「3x^2」「x」「5」（係數 1 不寫）
function pyBody(a, d) {
  if (d === 0) return numStr(a);
  const k = (a === 1) ? '' : numStr(a);
  return d === 1 ? k + 'x' : k + 'x^' + d;
}

// [[係數, 次數], ...] 照給定順序排成一條式子；係數 0 的略過
function pyJoin(list) {
  let s = '';
  list.forEach(([c, d]) => {
    if (c === 0) return;
    const body = pyBody(Math.abs(c), d);
    if (!s) s = (c < 0 ? '-' : '') + body;
    else s += (c < 0 ? ' - ' : ' + ') + body;
  });
  return s || '0';
}

function pyStr(p) {
  const list = [];
  for (let d = p.length - 1; d >= 0; d--) if (p[d]) list.push([p[d], d]);
  return pyJoin(list);
}

function pyMono(c, d) {
  return pyJoin([[c, d]]);
}

function pyMul(p, q) {
  const r = [];
  for (let i = 0; i < p.length + q.length - 1; i++) r.push(0);
  p.forEach((a, i) => q.forEach((b, j) => { r[i + j] += a * b; }));
  return r;
}

// 一次式 px + q
function linStr(p, q) {
  return pyStr([q, p]);
}

// 有加減號的才是「多項式」，當因式寫出來時要加括號
function isPolyStr(s) {
  return /\s[+-]\s/.test(String(s));
}

function wrapP(s) {
  return isPolyStr(s) ? '(' + s + ')' : s;
}

// 當成乘數寫進算式時，負的單項式、或含加減的多項式要加括號
function par(s) {
  const t = String(s);
  if (t.charAt(0) === '-' || isPolyStr(t)) return '(' + t + ')';
  return t;
}

// 兩個因式相乘：單項式寫在前面、不加括號；多項式加括號
function prod2(a, b) {
  const pa = isPolyStr(a), pb = isPolyStr(b);
  if (b === '1') return a;
  if (pa && pb) return '(' + a + ')(' + b + ')';
  if (pa) return b + '(' + a + ')';
  if (pb) return a + '(' + b + ')';
  return a + '·' + par(b);
}

/* --------------------------------------------------------------------------
   分數係數：{ n, d }，d 恆為正、已約分（3-1-3 搬來）。除式的首項係數不是 1
   時，長除法的商式會出現分數係數。
   -------------------------------------------------------------------------- */
function rq(n, d) {
  if (d === undefined) d = 1;
  if (d < 0) { n = -n; d = -d; }
  if (n === 0) return { n: 0, d: 1 };
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

const RQ0 = rq(0);

function rqSub(a, b) { return rq(a.n * b.d - b.n * a.d, a.d * b.d); }
function rqMul(a, b) { return rq(a.n * b.n, a.d * b.d); }
function rqDiv(a, b) { return rq(a.n * b.d, a.d * b.n); }

function rpOf(arr) {
  return arr.map(v => (typeof v === 'number' ? rq(v) : v));
}

function rpDeg(p) {
  for (let d = p.length - 1; d >= 0; d--) if (p[d] && p[d].n !== 0) return d;
  return -1;
}

function rpAbsTex(c, showOne) {
  const n = Math.abs(c.n);
  if (c.d === 1) return (n === 1 && !showOne) ? '' : String(n);
  return `\\frac{${n}}{${c.d}}`;
}

function rpTermTex(c, deg, first) {
  const body = rpAbsTex(c, deg === 0) + (deg === 0 ? '' : (deg === 1 ? 'x' : 'x^' + deg));
  if (first) return (c.n < 0 ? '-' : '') + body;
  return (c.n < 0 ? ' - ' : ' + ') + body;
}

function rpTex(p) {
  let s = '';
  for (let d = p.length - 1; d >= 0; d--) {
    if (!p[d] || p[d].n === 0) continue;
    s += rpTermTex(p[d], d, s === '');
  }
  return s || '0';
}

function xPow(deg, color) {
  return deg === 1 ? IT('x', color) : PW(IT('x', color), deg, false, color);
}

// 一項的 canvas 元件；cell 為 true 時（直式格子）正負號後只留半個空白
function rTermItem(c, deg, first, color, cell) {
  const parts = [];
  const neg = c.n < 0;
  if (!first) parts.push(T(cell ? (neg ? '− ' : '+ ') : (neg ? ' − ' : ' + '), color));
  else if (neg) parts.push(T('−', color));
  const n = Math.abs(c.n);
  if (c.n === 0) parts.push(T('0', color));
  else if (c.d !== 1) parts.push(FR(n, c.d, color));
  else if (!(n === 1 && deg > 0)) parts.push(T(String(n), color));
  if (deg > 0) parts.push(xPow(deg, color));
  return SEQ(parts, color, 1);
}

function rpItems(p, color) {
  const items = [];
  for (let d = p.length - 1; d >= 0; d--) {
    if (!p[d] || p[d].n === 0) continue;
    items.push(rTermItem(p[d], d, items.length === 0, color));
  }
  if (!items.length) items.push(T('0', color));
  return SEQ(items, color, 1);
}

// 長除法：回傳每一步的商項、乘回去的那一列、相減後的餘式
function rpLongDiv(P, D) {
  const dD = rpDeg(D);
  let rem = P.slice();
  const steps = [];
  const Q = [];
  let guard = 0;
  while (rpDeg(rem) >= dD && guard++ < 8) {
    const dr = rpDeg(rem);
    const k = dr - dD;
    const t = rqDiv(rem[dr], D[dD]);
    const prod = [];
    for (let i = 0; i <= dr; i++) prod.push(RQ0);
    for (let i = 0; i <= dD; i++) prod[i + k] = rqMul(t, D[i] || RQ0);
    const next = [];
    for (let i = 0; i < rem.length; i++) next.push(rqSub(rem[i] || RQ0, prod[i] || RQ0));
    next[dr] = RQ0;
    Q[k] = t;
    steps.push({ k, t, prod, rem: next, top: dr });
    rem = next;
  }
  for (let i = 0; i < Q.length; i++) if (!Q[i]) Q[i] = RQ0;
  return { steps, Q: Q.length ? Q : [RQ0], R: rem };
}

// 除式是一次式時，餘式是常數；回傳它的 { n, d }
function remOf(L) {
  return (L.R && L.R[0]) ? L.R[0] : RQ0;
}

/**
 * 在畫布上畫一個長除法直式（3-1-3 搬來）。欄位依次數對齊。
 * cfg：{ top, rowH, colL, colR, size, col: { P, D, Q, R, prod }, labels }
 * shown：已經做完的步數（0 = 只寫出題目）
 */
function drawLongDiv(ctx, P, D, L, shown, cfg) {
  const degP = rpDeg(P);
  const nCol = degP + 1;
  const cw = (cfg.colR - cfg.colL) / nCol;
  const cx = deg => cfg.colL + cw * (degP - deg + 0.5);
  const size = cfg.size || 19;
  // 有分數係數時直式分數比一列高，列距要拉開
  const hasFrac = P.concat(D).some(c => c && c.d !== 1)
    || L.steps.some(s => s.t.d !== 1 || s.prod.concat(s.rem).some(c => c && c.d !== 1));
  const rowH = hasFrac ? Math.max(cfg.rowH, 48) : cfg.rowH;
  const yQ = cfg.top, yP = cfg.top + rowH;
  const col = cfg.col;

  function row(p, hi, lo, y, color) {
    let started = false;
    for (let d = hi; d >= lo; d--) {
      const c = p[d] || RQ0;
      if (c.n === 0 && !started) continue;
      const cc = c.n === 0 ? DIM : color;
      drawExpr(ctx, [rTermItem(c, d, !started, cc, true)], cx(d), y, size, cc, { maxW: cw - 4 });
      started = true;
    }
    if (!started) drawExpr(ctx, [T('0', color)], cx(lo), y, size, color);
  }

  if (shown > 0) {
    const i = shown - 1;
    const y1 = yP + rowH * (2 * i + 1) - rowH / 2 + 2;
    drawPanel(ctx, 12, y1, cfg.colR - 4, rowH * 2 - 4, col.Q, 0.07);
  }

  const dItems = [rpItems(D, col.D)];
  const dw = exprWidth(ctx, dItems, size, 6);
  drawExpr(ctx, dItems, 0, yP, size, col.D, { left: cfg.colL - 18 - dw });
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(cfg.colL - 12, yP + rowH / 2 - 2);
  ctx.quadraticCurveTo(cfg.colL - 2, yP, cfg.colL - 12, yP - rowH / 2 + 2);
  ctx.lineTo(cfg.colR, yP - rowH / 2 + 2);
  ctx.stroke();
  ctx.restore();

  row(P, degP, 0, yP, col.P);

  let qFirst = true;
  for (let i = 0; i < shown; i++) {
    const s = L.steps[i];
    drawExpr(ctx, [rTermItem(s.t, s.k, qFirst, col.Q, true)], cx(s.k), yQ, size, col.Q, { maxW: cw - 4 });
    qFirst = false;
  }

  let lowD = 0;
  while (lowD < D.length && (!D[lowD] || D[lowD].n === 0)) lowD++;

  let yLast = yP;
  for (let i = 0; i < shown; i++) {
    const s = L.steps[i];
    const yPr = yP + rowH * (2 * i + 1);
    const yRm = yPr + rowH;
    row(s.prod, s.top, s.k + lowD, yPr, col.prod);
    mdLine(ctx, cx(s.top) - cw / 2 + 4, yPr + rowH / 2, cfg.colR, yPr + rowH / 2, INK, 1.6);
    const isLast = (i === L.steps.length - 1);
    row(s.rem, s.top - 1, 0, yRm, isLast ? col.R : col.P);
    drawExpr(ctx, [rTermItem(s.t, s.k, true, MUTED), T(' × 除式', MUTED)], 0, yPr, 13, MUTED,
      { left: 18, maxW: cfg.colL - 40, gap: 2 });
    textLeft(ctx, '上減下', 18, yRm, MUTED, f(700, 13));
    yLast = yRm;
  }
  return { yLast, cx, cw, rowH };
}

const LD_COL = { P: MD_CREAM, D: MD_BLUE, Q: '#a5f3fc', R: MD_ROSE, prod: '#cbd5e1' };

// 步驟按鈕：上一步／下一步／全部顯示
function bindSteps(prefix, getN, state, draw) {
  const prev = elById(prefix + '-prev'), next = elById(prefix + '-next'), all = elById(prefix + '-all');
  if (prev) prev.addEventListener('click', () => { state.step -= 1; draw(); });
  if (next) next.addEventListener('click', () => { state.step += 1; draw(); });
  if (all) all.addEventListener('click', () => { state.step = getN(); draw(); });
}

function syncSteps(prefix, step, n) {
  const prev = elById(prefix + '-prev'), next = elById(prefix + '-next'), all = elById(prefix + '-all');
  const counter = elById(prefix + '-step');
  if (counter) counter.textContent = `${step} / ${n}`;
  if (prev) prev.disabled = (step <= 1);
  if (next) next.disabled = (step >= n);
  if (all) all.disabled = (step >= n);
}

function ldLegend(ctx, y) {
  const items = [['被除式', LD_COL.P], ['除式', LD_COL.D], ['商式', LD_COL.Q], ['餘式', LD_COL.R]];
  let x = 60;
  items.forEach(([s, c]) => {
    ctx.save();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    textLeft(ctx, s, x + 12, y, c, f(800, 14));
    x += 112;
  });
}

// 一排色塊與運算符號：parts = [{ item, color, label, labelColor } | { op }]
function blockRow(ctx, parts, cy, size) {
  const h = 58;
  const ws = parts.map(p => (p.op != null
    ? Math.max(26, measure(ctx, T(p.op), size).w + 14)
    : Math.max(64, measure(ctx, p.item, size).w + 30)));
  const total = ws.reduce((s, w) => s + w, 0) + 8 * (parts.length - 1);
  const scale = Math.min(1, (ctx.canvas.width - 40) / total);
  let x = ctx.canvas.width / 2 - total * scale / 2;
  const rects = [];
  parts.forEach((p, i) => {
    const w = ws[i] * scale;
    if (p.op != null) {
      textCenter(ctx, p.op, x + w / 2, cy, INK, f(800, size + 2));
    } else {
      mdBlock(ctx, x, cy - h / 2, w, h, p.color, { alpha: 0.2, lw: 3.5 });
      drawExpr(ctx, [p.item], x + w / 2, cy, size, p.color, { maxW: w - 10 });
      if (p.label) textCenter(ctx, p.label, x + w / 2, cy + h / 2 + 18, p.labelColor || p.color, f(800, 14));
      rects.push({ x, w });
    }
    x += w + 8 * scale;
  });
  return rects;
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第三冊 3-1 的 22 題正解
  // 正解字母分布：A 5 題、B 6 題、C 6 題、D 5 題（開發約束 36）
  const answers = {
    '3-1-1': 'D',    // 2x² + 3x − 5 = (2x + 5)(x − 1)
    '3-1-2': 'B',    // (3x² − 5x + 4) ÷ (x − 2) 餘 6
    '3-1-3': 'C',    // 3x² − 7x − 6 = (3x + 2)(x − 3)
    '3-1-4': 'A',    // 2x² + 5x − 3 = (2x − 1)(x + 3)，2x + 1 不是因式
    '3-1-5': 'B',    // 6x² − 5x − 4 = (3x − 4)(2x + 1)
    '3-1-6': 'C',    // 3x² + 2x − 8 = (3x − 4)(x + 2) 才是因式分解
    '3-1-7': 'D',    // 4x² + 9x − 9 = (4x − 3)(x + 3)
    '3-1-8': 'A',    // (2x + 5)(x − 2) = 2x² + x − 10，a + b = 3
    '3-1-9': 'C',    // x³ 不是 8x² 和 −12x³ 的公因式
    '3-1-10': 'B',   // (x + 2)(3x − 1) 與 (3x − 1)² 的公因式 3x − 1
    '3-1-11': 'C',   // 9x² − x = x(9x − 1)
    '3-1-12': 'D',   // 2(2x − 1)² + 3(2x − 1) = (2x − 1)(4x + 1)
    '3-1-13': 'B',   // (x − 6)(3x + 1) + (6 − x)(x − 4) = (x − 6)(2x + 5)
    '3-1-14': 'A',   // (2x + 3)(x − 7) − (7 − x)² = (x − 7)(x + 10)
    '3-1-15': 'C',   // 64x² − 49y² = (8x + 7y)(8x − 7y)
    '3-1-16': 'D',   // 121 − 25x² = (11 + 5x)(11 − 5x)
    '3-1-17': 'A',   // (3x − 2)² − 36 = (3x + 4)(3x − 8)
    '3-1-18': 'B',   // 36 − (3x + 1)² = (3x + 7)(5 − 3x)
    '3-1-19': 'A',   // 81x² + 36x + 4 = (9x + 2)²
    '3-1-20': 'D',   // 4x² + kx + 49 是和的平方：k = 28
    '3-1-21': 'C',   // 49x² − 42x + 9 = (7x − 3)²
    '3-1-22': 'B'    // 25x² − 30x + 9 = (5x − 3)²
  };

  quizCards.forEach(card => {
    const quizId = card.getAttribute('data-quiz');
    const radios = card.querySelectorAll('input[type="radio"]');
    const btn = card.querySelector('.btn-check-ans');
    const explanation = card.querySelector('.explanation-box');
    const expTitle = card.querySelector('.explanation-title');
    const optionLabels = card.querySelectorAll('.option-label');

    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        btn.removeAttribute('disabled');
        optionLabels.forEach(lbl => lbl.classList.remove('selected'));
        radio.closest('.option-label').classList.add('selected');
      });
    });

    btn.addEventListener('click', () => {
      const selectedRadio = card.querySelector('input[type="radio"]:checked');
      if (!selectedRadio) return;

      const userAns = selectedRadio.value;
      const correctAns = answers[quizId];
      const isCorrect = userAns === correctAns;

      radios.forEach(r => r.setAttribute('disabled', true));
      btn.setAttribute('disabled', true);
      btn.textContent = '已完成作答';

      optionLabels.forEach(lbl => {
        const rad = lbl.querySelector('input[type="radio"]');
        if (rad.value === correctAns) {
          lbl.classList.add('correct');
        } else if (rad.checked) {
          lbl.classList.add('incorrect');
        }
      });

      explanation.style.display = 'block';
      if (isCorrect) {
        explanation.className = 'explanation-box correct-feedback';
        expTitle.innerHTML = `<i class="fa-solid fa-circle-check"></i> 回答正確！`;
      } else {
        explanation.className = 'explanation-box incorrect-feedback';
        expTitle.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> 回答錯誤！正確答案是 (${correctAns})`;
      }
      typeset([explanation]);
    });
  });
}

/* ==========================================================================
   重點 1：因式與倍式——用長除法看餘式是不是 0
   ========================================================================== */
function initDivCanvas() {
  const cv = elById('canvas-div');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sb = elById('dv-b'), sc = elById('dv-c'), sq = elById('dv-q');
  const vb = elById('dv-vb'), vc = elById('dv-vc'), vq = elById('dv-vq');
  const out = elById('dv-formula');
  const fb = elById('dv-feedback');
  const C = MD_TONE[0];
  const st = { step: 99 };
  let L = null;

  function draw() {
    const b = iv(sb), c = iv(sc), q = iv(sq);
    vb.textContent = b; vc.textContent = c; vq.textContent = q;
    const P = rpOf([c, b, 1]), D = rpOf([q, 1]);
    L = rpLongDiv(P, D);
    const n = L.steps.length;
    st.step = clamp(st.step, 1, n);
    syncSteps('dv', st.step, n);
    const done = (st.step === n);
    const pS = pyStr([c, b, 1]), dS = linStr(1, q), qS = rpTex(L.Q);
    const r = remOf(L).n;   // 除式的首項係數是 1，餘式一定是整數

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '長除法：餘式是不是 0？', C);
    const res = drawLongDiv(ctx, P, D, L, st.step, { top: 66, rowH: 38, colL: 170, colR: 520, size: 19, col: LD_COL });

    const y0 = res.yLast + 30;
    if (!done) {
      textCenter(ctx, '還沒除完：按「下一步」繼續', cv.width / 2, y0 + 50, MUTED, f(700, 15));
    } else if (r === 0) {
      drawPanel(ctx, 18, y0, cv.width - 36, 112, MD_JADE, 0.08);
      exLine(ctx, [T('餘式是 0：', MD_JADE), mdInk(dS, LD_COL.D), T('是', INK), mdInk(pS, LD_COL.P), T('的因式', MD_JADE)], y0 + 24);
      exLine(ctx, [mdInk(pS, LD_COL.P), T('是', INK), mdInk(dS, LD_COL.D), T('的倍式', MD_JADE)], y0 + 56);
      exLine(ctx, [mdInk(`${pS} = ${prod2(dS, qS)}`, INK)], y0 + 88);
    } else {
      drawPanel(ctx, 18, y0, cv.width - 36, 112, MD_ROSE, 0.08);
      exLine(ctx, [T(`餘式是 ${mn(r)}，不是 0`, MD_ROSE)], y0 + 24);
      exLine(ctx, [mdInk(dS, LD_COL.D), T('不是', MD_ROSE), mdInk(pS, LD_COL.P), T('的因式', INK)], y0 + 56);
      exLine(ctx, [T(`把常數項 ${mn(c)} 改成 ${mn(c - r)}，就能整除`, MUTED)], y0 + 88);
    }
    ldLegend(ctx, cv.height - 18);

    out.innerHTML = `\\((${pS})\\)<wbr>\\({}\\div ${par(dS)}\\)`;
    fb.innerHTML = wrapFeedback(!done
      ? `第 ${st.step} 步：用剩下式子的最高次項除以除式的最高次項 \\(x\\)，得到商的下一項。`
      : (r === 0
        ? `餘式為 \\(0\\)：\\(${dS}\\) <b>是</b> \\(${pS}\\) 的因式，\\(${pS}\\) 是 \\(${dS}\\) 的倍式。`
        : `餘式為 \\(${r}\\)，不是 \\(0\\)：\\(${dS}\\) <b>不是</b> \\(${pS}\\) 的因式。`));
    typeset([out, fb]);
  }

  [sb, sc, sq].forEach(s => s.addEventListener('input', () => { st.step = 99; draw(); }));
  bindSteps('dv', () => (L ? L.steps.length : 1), st, draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：從乘積讀因式與倍式——A = B × C
   ========================================================================== */
const PD_CANDS = {
  b: (m, n) => [m, 1],
  c: (m, n) => [n, 1],
  neg: (m, n) => [-m, -1],
  self: (m, n) => [m * n, m + n, 1],
  flip: (m, n) => [-m, 1],
  sum: (m, n) => [m + n, 1]
};

function initProdCanvas() {
  const cv = elById('canvas-prod');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sm = elById('pd-m'), sn = elById('pd-n');
  const vm = elById('pd-vm'), vn = elById('pd-vn');
  const cG = elById('pd-cand-group');
  const out = elById('pd-formula');
  const fb = elById('pd-feedback');
  const C = MD_TONE[1];
  let cand = 'b';

  function draw() {
    const m = iv(sm), n = iv(sn);
    vm.textContent = m; vn.textContent = n;
    const A = [m * n, m + n, 1];
    const aS = pyStr(A), fS = prod2(linStr(1, m), linStr(1, n));
    const B = PD_CANDS[cand](m, n);
    const bS = pyStr(B);
    const L = rpLongDiv(rpOf(A), rpOf(B));
    const ok = rpDeg(L.R) < 0;
    const qS = rpTex(L.Q);
    const r = remOf(L).n;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '從乘積讀出因式與倍式', C);
    drawPanel(ctx, 18, 48, cv.width - 36, 50, C, 0.06);
    exLine(ctx, [T('A =', INK), mdInk(`${fS} = ${aS}`, MD_RED)], 73, 20);

    if (ok) {
      blockRow(ctx, [
        { item: mdInk(aS, MD_RED), color: MD_RED, label: '倍式' },
        { op: '=' },
        { item: mdInk(bS, MD_BLUE), color: MD_BLUE, label: '因式' },
        { op: '×' },
        { item: mdInk(qS, MD_YELLOW), color: MD_YELLOW, label: '因式' }
      ], 168, 19);
    } else {
      blockRow(ctx, [
        { item: mdInk(aS, MD_RED), color: MD_RED },
        { op: '÷' },
        { item: mdInk(bS, MD_BLUE), color: MD_BLUE, label: '不是因式', labelColor: MD_ROSE },
        { op: '=' },
        { item: mdInk(qS, MD_YELLOW), color: MD_YELLOW, label: '商式', labelColor: MUTED },
        { op: `餘 ${mn(r)}` }
      ], 168, 19);
    }

    const y0 = 262;
    if (ok) {
      drawPanel(ctx, 18, y0, cv.width - 36, 130, MD_JADE, 0.08);
      exLine(ctx, [T('A ÷', INK), mdInk(wrapP(bS), MD_BLUE), T('的餘式是 0：', INK), mdInk(bS, MD_BLUE), T('是 A 的因式', MD_JADE)], y0 + 26);
      exLine(ctx, [T('反過來說，A 是', INK), mdInk(bS, MD_BLUE), T('的倍式', MD_JADE)], y0 + 60);
      const notes = {
        b: '乘號兩邊的式子，都是 A 的因式',
        c: '乘號兩邊的式子，都是 A 的因式',
        neg: '兩個因式同時變號，乘積不變',
        self: 'A = A × 1：A 是自己的因式，也是自己的倍式',
        flip: '這組 m、n 剛好讓它整除，換一組就不一定了',
        sum: '這組 m、n 剛好讓它整除，換一組就不一定了'
      };
      exLine(ctx, [T(notes[cand], MD_CREAM)], y0 + 96, 16);
    } else {
      drawPanel(ctx, 18, y0, cv.width - 36, 130, MD_ROSE, 0.08);
      exLine(ctx, [T('A ÷', INK), mdInk(wrapP(bS), MD_BLUE), T(`的餘式是 ${mn(r)}，不是 0`, MD_ROSE)], y0 + 26);
      exLine(ctx, [mdInk(bS, MD_BLUE), T('不是 A 的因式，A 也不是它的倍式', INK)], y0 + 60);
      const hints = {
        flip: 'x − m 和 x + m 只差一個正負號，不能混用',
        sum: '把兩個因式「加」起來，不會是因式'
      };
      exLine(ctx, [T(hints[cand] || '餘式不是 0 就不是因式', MD_CREAM)], y0 + 96, 16);
    }
    textCenter(ctx, '口訣：A = B × C，B、C 是 A 的因式，A 是 B、C 的倍式', cv.width / 2, cv.height - 22, MUTED, f(700, 14));

    out.innerHTML = wbrEq(tx(`A = ${fS} = ${aS}`));
    fb.innerHTML = wrapFeedback(ok
      ? (cand === 'self'
        ? `\\(A = A \\times 1\\)：每個多項式都是自己的因式，也是自己的倍式。`
        : `${wbrEq(tx(`${aS} = ${prod2(bS, qS)}`))}，所以 \\(${bS}\\) <b>是</b>因式。`)
      : `\\(A \\div ${par(bS)}\\) 的餘式是 \\(${r}\\)，所以 \\(${bS}\\) <b>不是</b>因式。`);
    typeset([out, fb]);
  }

  [sm, sn].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(cG, 'data-pd-cand', v => { cand = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：因式分解——用除法找出一個因式，寫成兩個一次式的乘積
   ========================================================================== */
const FC_SETS = {
  r1: [-15, 1, 6],   // 6x² + x − 15 = (2x − 3)(3x + 5)
  r2: [-5, -8, 4],   // 4x² − 8x − 5 = (2x − 5)(2x + 1)
  r3: [8, 14, 3]     // 3x² + 14x + 8 = (3x + 2)(x + 4)
};

function initFactorCanvas() {
  const cv = elById('canvas-fac');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = elById('fc-p'), sq = elById('fc-q');
  const vp = elById('fc-vp'), vq = elById('fc-vq');
  const pG = elById('fc-poly-group');
  const out = elById('fc-formula');
  const fb = elById('fc-feedback');
  const C = MD_TONE[2];
  const st = { step: 99 };
  let key = 'r1';
  let L = null;

  function draw() {
    const p = iv(sp), q = iv(sq);
    vp.textContent = p; vq.textContent = q;
    const Pa = FC_SETS[key];
    const P = rpOf(Pa), D = rpOf([q, p]);
    L = rpLongDiv(P, D);
    const n = L.steps.length;
    st.step = clamp(st.step, 1, n);
    syncSteps('fc', st.step, n);
    const done = (st.step === n);
    const ok = rpDeg(L.R) < 0;
    const intQ = L.Q.every(c => c.d === 1);
    const pS = pyStr(Pa), dS = linStr(p, q), qT = rpTex(L.Q);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '試一個除式：能整除，就分解得出來', C);
    const res = drawLongDiv(ctx, P, D, L, st.step, { top: 64, rowH: 38, colL: 180, colR: 520, size: 19, col: LD_COL });

    const y0 = Math.max(res.yLast + 30, 300);
    const eqItems = [rpItems(P, LD_COL.P), T('=', INK), GRP([rpItems(D, LD_COL.D)], '()', LD_COL.D), GRP([rpItems(L.Q, LD_COL.Q)], '()', LD_COL.Q)];
    if (!done) {
      textCenter(ctx, '還沒除完：按「下一步」繼續', cv.width / 2, y0 + 50, MUTED, f(700, 15));
    } else if (ok && intQ) {
      drawPanel(ctx, 18, y0, cv.width - 36, 130, MD_JADE, 0.08);
      exLine(ctx, [T('餘式是 0：能整除，因式分解成', MD_JADE)], y0 + 24);
      exLine(ctx, eqItems, y0 + 64, 21);
      exLine(ctx, [T('寫成兩個一次式的乘積就停，不要再乘開', MD_CREAM)], y0 + 104, 15);
    } else if (ok) {
      drawPanel(ctx, 18, y0, cv.width - 36, 130, MD_YELLOW, 0.08);
      exLine(ctx, [T('餘式是 0：能整除，所以它也是因式', MD_YELLOW)], y0 + 24);
      exLine(ctx, eqItems, y0 + 64, 20);
      exLine(ctx, [T('但商式有分數係數；把除式約成最簡，才得到整係數的分解', MD_CREAM)], y0 + 106, 14.5);
    } else {
      drawPanel(ctx, 18, y0, cv.width - 36, 130, MD_ROSE, 0.08);
      exLine(ctx, [T('餘式是', MD_ROSE), rpItems(L.R, MD_ROSE), T('，不是 0', MD_ROSE)], y0 + 28);
      exLine(ctx, [mdInk(dS, LD_COL.D), T('不是因式，這條路分解不出來', INK)], y0 + 66);
      exLine(ctx, [T('調整 p、q，換一個除式再試', MD_CREAM)], y0 + 102, 15);
    }

    out.innerHTML = `\\((${pS})\\)<wbr>\\({}\\div ${par(dS)}\\)`;
    fb.innerHTML = wrapFeedback(!done
      ? `第 ${st.step} 步：長除法還在進行，按「下一步」看完。`
      : (ok && intQ
        ? `能整除：${wbrEq(`${pS} = (${dS})(${qT})`)}。這就是<b>因式分解</b>，乘開又會回到原式，所以寫到這裡就停。`
        : (ok
          ? `能整除，\\(${dS}\\) 是因式；但商式 \\(${qT}\\) 有分數係數。`
          : `餘式不是 \\(0\\)：\\(${dS}\\) 不是 \\(${pS}\\) 的因式。`)));
    typeset([out, fb]);
  }

  [sp, sq].forEach(s => s.addEventListener('input', () => { st.step = 99; draw(); }));
  bindPickGroup(pG, 'data-fc-poly', v => { key = v; st.step = 99; draw(); });
  bindSteps('fc', () => (L ? L.steps.length : 1), st, draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：已知一個因式，求未知係數——比較係數或用除法
   ========================================================================== */
const CF_SETS = {
  k1: { P: [-4, 11, 3], p: 3, q: -1 },   // 3x² + 11x − 4 = (3x − 1)(x + 4)
  k2: { P: [6, -7, 2], p: 2, q: -3 },    // 2x² − 7x + 6 = (2x − 3)(x − 2)
  k3: { P: [-6, 13, 5], p: 5, q: -2 }    // 5x² + 13x − 6 = (5x − 2)(x + 3)
};

function initCoefCanvas() {
  const cv = elById('canvas-coef');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sm = elById('cf-m'), vm = elById('cf-vm');
  const kG = elById('cf-prob-group'), mG = elById('cf-mode-group');
  const out = elById('cf-formula');
  const fb = elById('cf-feedback');
  const C = MD_TONE[3];
  let key = 'k1', mode = 'cmp';

  function draw() {
    const g = iv(sm);
    vm.textContent = g;
    const S = CF_SETS[key];
    const P = S.P, p = S.p, q = S.q;
    const mt = P[0] / q;
    const pS = pyStr(P), dS = linStr(p, q);
    const G = pyMul([q, p], [g, 1]);
    const match = [G[2] === P[2], G[1] === P[1], G[0] === P[0]];
    const all = match.every(Boolean);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'cmp' ? '比較係數：m 是多少？' : '用除法：商式就是 x + m', C);
    drawPanel(ctx, 18, 46, cv.width - 36, 48, C, 0.06);
    exLine(ctx, [mdInk(`${pS} = (${dS})(x + m)`, MD_CREAM)], 70, 20);

    if (mode === 'cmp') {
      const qa = Math.abs(q);
      const xTerm = `(${p}m ${q < 0 ? '-' : '+'} ${qa})x`;
      const cTerm = `${q < 0 ? '-' : '+'} ${qa === 1 ? '' : qa}m`;
      exLine(ctx, [T('右邊展開：', MUTED), mdInk(`${pyMono(p, 2)} + ${xTerm} ${cTerm}`, INK)], 122, 18);

      // 係數對照表（蒙德里安格線）
      const cols = [150, 285, 420], tx0 = 30, tx1 = 510;
      const rowsY = [166, 212, 258];
      ctx.save();
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(tx0, 146, tx1 - tx0, 152);
      [188, 236].forEach(y => mdLine(ctx, tx0, y, tx1, y, 'rgba(226, 232, 240, 0.4)', 2));
      [100, 218, 352].forEach(x => mdLine(ctx, x, 146, x, 298, 'rgba(226, 232, 240, 0.4)', 2));
      ctx.restore();
      textCenter(ctx, '係數', 65, rowsY[0], MUTED, f(800, 14));
      textCenter(ctx, '原式', 65, rowsY[1], MD_CREAM, f(800, 14));
      textCenter(ctx, `m = ${mn(g)}`, 65, rowsY[2], C, f(800, 14));
      drawExpr(ctx, [mdInk('x^2 項', MUTED)], cols[0], rowsY[0], 15, MUTED);
      drawExpr(ctx, [mdInk('x 項', MUTED)], cols[1], rowsY[0], 15, MUTED);
      textCenter(ctx, '常數項', cols[2], rowsY[0], MUTED, f(800, 15));
      [P[2], P[1], P[0]].forEach((v, i) => textCenter(ctx, mn(v), cols[i], rowsY[1], MD_CREAM, f(800, 19)));
      [G[2], G[1], G[0]].forEach((v, i) => {
        const col = match[i] ? MD_JADE : MD_ROSE;
        textCenter(ctx, `${mn(v)} ${match[i] ? '✓' : '✗'}`, cols[i], rowsY[2], col, f(800, 19));
      });

      const y0 = 318;
      if (all) {
        drawPanel(ctx, 18, y0, cv.width - 36, 110, MD_JADE, 0.08);
        exLine(ctx, [T(`三項係數都一樣：m = ${mn(g)} ✓`, MD_JADE)], y0 + 30, 18);
        exLine(ctx, [mdInk(`(${dS})(${linStr(1, g)}) = ${pS}`, INK)], y0 + 74, 19);
      } else {
        drawPanel(ctx, 18, y0, cv.width - 36, 110, MD_ROSE, 0.08);
        exLine(ctx, [T('還有係數不一樣，調 m 再試', MD_ROSE)], y0 + 26, 17);
        exLine(ctx, [T('常數項：', MUTED), mdInk(`${q === -1 ? '-' : q}m = ${P[0]}`, INK), T('　x 項：', MUTED), mdInk(`${p}m ${q < 0 ? '-' : '+'} ${qa} = ${P[1]}`, INK)], y0 + 62, 17);
        exLine(ctx, [T('兩個條件都要成立', MUTED)], y0 + 92, 14);
      }
      out.innerHTML = wbrEq(tx(`${prod2(dS, linStr(1, g))} = ${pyStr(G)}`));
      fb.innerHTML = wrapFeedback(all
        ? `\\(m = ${g}\\) 時三項係數都對上：${wbrEq(`(${dS})(${linStr(1, g)}) = ${pS}`)}。`
        : `比較係數：\\(x^2\\) 項一定相同，再看 \\(x\\) 項與常數項。現在 ${match[1] ? '' : '<b>x 項</b>'}${!match[1] && !match[2] ? '、' : ''}${match[2] ? '' : '<b>常數項</b>'}不一樣。`);
    } else {
      const P2 = rpOf(P), D2 = rpOf([q, p]);
      const L = rpLongDiv(P2, D2);
      const res = drawLongDiv(ctx, P2, D2, L, L.steps.length, { top: 128, rowH: 36, colL: 180, colR: 520, size: 18, col: LD_COL });
      const y0 = res.yLast + 26;
      const hit = (g === mt);
      drawPanel(ctx, 18, y0, cv.width - 36, 104, hit ? MD_JADE : MD_ROSE, 0.08);
      exLine(ctx, [T('商式是', INK), mdInk(linStr(1, mt), LD_COL.Q), T('，和 x + m 比較：', INK), T(`m = ${mn(mt)}`, MD_JADE)], y0 + 30, 18);
      exLine(ctx, [T(`你猜的 m = ${mn(g)}　`, INK), T(hit ? '✓ 猜對了' : '✗ 拉動滑桿改成它', hit ? MD_JADE : MD_ROSE)], y0 + 70, 17);
      out.innerHTML = `\\((${pS})\\)<wbr>\\({}\\div (${dS})\\)<wbr>\\({}= ${linStr(1, mt)}\\)`;
      fb.innerHTML = wrapFeedback(`能整除，商式是 \\(${linStr(1, mt)}\\)，所以 \\(m = ${mt}\\)。兩種方法答案一樣，挑順手的用。`);
    }
    typeset([out, fb]);
  }

  sm.addEventListener('input', draw);
  bindPickGroup(kG, 'data-cf-prob', v => { key = v; draw(); });
  bindPickGroup(mG, 'data-cf-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：公因式——拆成乘法積木，找兩邊都有的
   ========================================================================== */
const CM_SETS = {
  p1: { a: '6x^2', b: '-9x', A: ['2', '3', 'x', 'x'], B: ['-1', '3', '3', 'x'], g: '3x', ex: ['x', '3x', '-x', '-3x'] },
  p2: { a: '4x^3', b: '10x^2', A: ['2', '2', 'x', 'x', 'x'], B: ['2', '5', 'x', 'x'], g: '2x^2', ex: ['x', '2x', 'x^2', '2x^2', '-2x^2'] },
  p3: { a: '(2x - 1)(x + 3)', b: '(2x - 1)(x - 4)', A: ['2x - 1', 'x + 3'], B: ['2x - 1', 'x - 4'], g: '2x - 1', ex: ['2x - 1', '-2x + 1'] },
  p4: { a: 'x(x + 2)^2', b: 'x^2(x + 2)', A: ['x', 'x + 2', 'x + 2'], B: ['x', 'x', 'x + 2'], g: 'x(x + 2)', ex: ['x', 'x + 2', 'x(x + 2)', '-x(x + 2)'] },
  p5: { a: '(x - 5)^2', b: '3(x - 5)', A: ['x - 5', 'x - 5'], B: ['3', 'x - 5'], g: 'x - 5', ex: ['x - 5', '-x + 5'] }
};

function cmColor(s) {
  if (s === 'x') return MD_RED;
  if (s === '-1') return MUTED;
  if (/^-?\d+$/.test(s)) return MD_YELLOW;
  return MD_BLUE;
}

function initCommonCanvas() {
  const cv = elById('canvas-com');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sG = elById('cm-pair-group'), vG = elById('cm-view-group');
  const out = elById('cm-formula');
  const fb = elById('cm-feedback');
  const C = MD_TONE[4];
  let key = 'p1', view = 'split';

  function rowRects(list, cy) {
    const size = 19, h = 48;
    const ws = list.map(s => Math.max(46, measure(ctx, mdInk(s), size).w + 26));
    const total = ws.reduce((a, w) => a + w, 0) + 12 * (list.length - 1);
    let x = cv.width / 2 - total / 2;
    return list.map((s, i) => {
      const r = { s, x, y: cy - h / 2, w: ws[i], h };
      x += ws[i] + 12;
      return r;
    });
  }

  function draw() {
    const S = CM_SETS[key];
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '拆成乘法積木，找兩邊都有的', C);

    const RA = rowRects(S.A, 106), RB = rowRects(S.B, 222);
    // 配對：A 的每塊積木去 B 找一塊一樣、還沒用過的
    const usedB = RB.map(() => false);
    const pairs = [];
    RA.forEach((ra, i) => {
      const j = RB.findIndex((rb, k) => !usedB[k] && rb.s === ra.s);
      if (j >= 0) { usedB[j] = true; pairs.push([i, j]); }
    });
    const hitA = RA.map((_, i) => pairs.some(p => p[0] === i));
    const hitB = RB.map((_, j) => pairs.some(p => p[1] === j));
    const show = (view !== 'split');

    if (show) {
      pairs.forEach(([i, j]) => {
        const a = RA[i], b = RB[j];
        mdLine(ctx, a.x + a.w / 2, a.y + a.h, b.x + b.w / 2, b.y, MD_JADE, 2.5, [6, 4]);
      });
    }
    // 配對虛線會穿過 B 那一行字，字要墊底色
    labelBox(ctx, [T('A =', INK), mdInk(S.a, MD_CREAM), T('拆成：', MUTED)], cv.width / 2, 62, 17, INK);
    labelBox(ctx, [T('B =', INK), mdInk(S.b, MD_CREAM), T('拆成：', MUTED)], cv.width / 2, 178, 17, INK);
    [[RA, hitA], [RB, hitB]].forEach(([R, hit]) => {
      R.forEach((r, i) => {
        const col = cmColor(r.s);
        const lit = show && hit[i];
        mdBlock(ctx, r.x, r.y, r.w, r.h, col, { alpha: lit ? 0.36 : 0.16, frame: lit ? MD_JADE : MD_FRAME, lw: lit ? 4 : 2.5, frameAlpha: lit ? 1 : 0.6 });
        drawExpr(ctx, [mdInk(r.s, col)], r.x + r.w / 2, r.y + r.h / 2, 19, col, { maxW: r.w - 8 });
      });
    });

    const y0 = 272;
    drawPanel(ctx, 18, y0, cv.width - 36, 150, C, 0.06);
    const common = pairs.map(p => S.A[p[0]]);
    if (view === 'split') {
      exLine(ctx, [T('把兩個式子都拆成「乘法積木」', INK)], y0 + 30, 17);
      exLine(ctx, [T('數字拆成質因數、', MUTED), mdInk('x^2', MUTED), T('拆成 x · x、平方拆成兩個括號', MUTED)], y0 + 66, 15);
      exLine(ctx, [T('按「找共同」，看哪些積木兩邊都有', MD_CREAM)], y0 + 104, 15);
    } else if (view === 'match') {
      const items = [T('兩邊都有的積木：', INK)];
      common.forEach((s, i) => { if (i) items.push(T('、', INK)); items.push(mdInk(s, cmColor(s))); });
      exLine(ctx, items, y0 + 30, 18);
      exLine(ctx, [T('乘起來：', INK), mdInk(S.g, MD_JADE), T('是 A 和 B 的公因式', MD_JADE)], y0 + 70, 18);
      exLine(ctx, [T('它能整除 A，也能整除 B', MUTED)], y0 + 108, 15);
    } else {
      const items = [T('公因式不只一個，例如：', INK)];
      S.ex.forEach((s, i) => { if (i) items.push(T('、', INK)); items.push(mdInk(s, MD_CREAM)); });
      exLine(ctx, items, y0 + 30, 17);
      exLine(ctx, [T('共同積木全部乘起來，得到最大的：', INK), mdInk(S.g, MD_JADE)], y0 + 70, 18);
      exLine(ctx, [T('提公因式時，通常提出這個最大的', MUTED)], y0 + 108, 15);
    }

    out.innerHTML = `\\(A = ${S.a}\\)，<wbr>\\(B = ${S.b}\\)` + (view === 'split' ? '' : `，<wbr>公因式 \\(${S.g}\\)`);
    fb.innerHTML = wrapFeedback(view === 'split'
      ? `先把 \\(A\\)、\\(B\\) 都寫成乘法：這樣才看得出它們「共同」有哪些因式。`
      : (view === 'match'
        ? `兩邊都有的積木乘起來是 \\(${S.g}\\)，它同時是 \\(A\\) 和 \\(B\\) 的因式，叫做<b>公因式</b>。`
        : `${S.ex.map(s => `\\(${s}\\)`).join('、')} 都是公因式；提公因式時通常提出最大的 \\(${S.g}\\)。`));
    typeset([out, fb]);
  }

  bindPickGroup(sG, 'data-cm-pair', v => { key = v; draw(); });
  bindPickGroup(vG, 'data-cm-view', v => { view = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：提公因式——A·B + A·C = A(B + C)
   ========================================================================== */
function initExtractCanvas() {
  const cv = elById('canvas-ext');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('ex-a'), sb = elById('ex-b'), sk = elById('ex-k'), sp = elById('ex-p'), sm = elById('ex-m');
  const va = elById('ex-va'), vb = elById('ex-vb'), vk = elById('ex-vk'), vp = elById('ex-vp'), vm = elById('ex-vm');
  const mG = elById('ex-mode-group'), tG = elById('ex-take-group');
  const monoRows = ['ex-row-a', 'ex-row-b', 'ex-row-take'].map(elById);
  const polyRows = ['ex-row-k', 'ex-row-p', 'ex-row-m'].map(elById);
  const out = elById('ex-formula');
  const fb = elById('ex-feedback');
  const C = MD_TONE[5];
  let mode = 'mono', take = 'g';
  [sa, sb, sp, sm].forEach(nzSlider);

  // 面積模型：高是公因式，兩塊的寬是提出後剩下的
  function areaModel(cS, a1, q1, a2, q2) {
    const x0 = 132, x1 = 506, y0 = 64, y1 = 146;
    const xm = x0 + (x1 - x0) * 0.56;
    mdBlock(ctx, x0, y0, xm - x0, y1 - y0, MD_RED, { alpha: 0.24, lw: 3.5 });
    mdBlock(ctx, xm, y0, x1 - xm, y1 - y0, MD_BLUE, { alpha: 0.24, lw: 3.5 });
    drawExpr(ctx, [T('面積', MUTED), mdInk(a1, MUTED)], (x0 + xm) / 2, y0 + 20, 14, MUTED, { maxW: xm - x0 - 10 });
    drawExpr(ctx, [T('面積', MUTED), mdInk(a2, MUTED)], (xm + x1) / 2, y0 + 20, 14, MUTED, { maxW: x1 - xm - 10 });
    drawExpr(ctx, [mdInk(q1, MD_RED)], (x0 + xm) / 2, y0 + 54, 21, MD_RED, { maxW: xm - x0 - 10 });
    drawExpr(ctx, [mdInk(q2, MD_BLUE)], (xm + x1) / 2, y0 + 54, 21, MD_BLUE, { maxW: x1 - xm - 10 });
    mdBlock(ctx, 22, y0, 100, y1 - y0, MD_YELLOW, { alpha: 0.22, lw: 3.5 });
    textCenter(ctx, '公因式', 72, y0 + 20, MUTED, f(700, 13));
    drawExpr(ctx, [mdInk(cS, MD_YELLOW)], 72, y0 + 54, 20, MD_YELLOW, { maxW: 90 });
  }

  function draw() {
    monoRows.forEach(r => { r.style.display = mode === 'mono' ? '' : 'none'; });
    polyRows.forEach(r => { r.style.display = mode === 'poly' ? '' : 'none'; });
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '提公因式：分配律倒過來用', C);
    let rows, pS, finalS, note = null, noteCol = MD_CREAM;

    if (mode === 'mono') {
      const a = iv(sa), b = iv(sb);
      va.textContent = a; vb.textContent = b;
      const g = gcd(a, b), s = a < 0 ? -1 : 1;
      const G = take === 'x' ? 1 : s * g;
      const cS = pyMono(G, 1);
      const q1 = a / G, q2 = b / G;
      const t1 = pyMono(q1, 1), t2 = String(q2);
      pS = pyStr([0, b, a]);
      const inner = pyStr([q2, q1]);
      finalS = prod2(cS, inner);
      areaModel(cS, pyMono(a, 2), t1, pyMono(b, 1), t2);
      rows = [
        { name: '① 拆成乘積', hint: '每一項都寫成「公因式 × 剩下的」', items: [mdInk(`${pS} = ${cS}·${par(t1)} + ${par(cS)}·${par(t2)}`, INK)] },
        { name: '② 提出公因式', hint: '兩項都有的部分，提到括號外', items: [mdInk(`= ${finalS}`, MD_CREAM)] }
      ];
      // 最後提出的公因式（只提 x、但還能再提時，以再提之後的為準）
      const Gf = (take === 'x' && g > 1) ? s * g : G;
      if (take === 'x' && g > 1) {
        const G2 = Gf;
        const f2 = prod2(pyMono(G2, 1), pyStr([b / G2, a / G2]));
        rows.push({ name: '③ 還能再提', hint: `括號裡兩項還有公因數 ${g}`, items: [mdInk(`= ${f2}`, MD_JADE)] });
        finalS = f2;
        note = `只提出 x 也算分解，但括號裡還有公因數 ${g}，通常提出最大的 ${mn(pyMono(G2, 1))}`;
      } else {
        rows.push({ name: '③ 檢查', hint: '括號裡兩項沒有公因式了', items: [T('提完了 ✓', MD_JADE)] });
      }
      if (Math.abs(b / Gf) === 1) {
        note = `${mn(pyMono(b, 1))} 整個被提走，括號裡留下 ${mn(b / Gf)}，不是 0`;
        noteCol = MD_ROSE;
      }
    } else {
      const k = iv(sk), p = iv(sp), m = iv(sm);
      vk.textContent = k; vp.textContent = p; vm.textContent = m;
      const u = linStr(1, p);
      const ma = Math.abs(m);
      pS = `${k === 1 ? '' : k}(${u})^2 ${m < 0 ? '-' : '+'} ${ma === 1 ? '' : ma}(${u})`;
      const c0 = k * p + m;
      const inner = linStr(k, c0);
      finalS = prod2(u, inner);
      areaModel(u, `${k === 1 ? '' : k}(${u})^2`, `${k === 1 ? '' : k}(${u})`, `${m < 0 ? '-' : ''}${ma === 1 ? '' : ma}(${u})`, String(m));
      rows = [
        { name: '① 找公因式', hint: '兩項都有同一個括號', items: [mdInk(pS, INK)] },
        { name: '② 提出括號', hint: '第一項剩下 k 個括號，第二項剩下 m', items: [mdInk(`= (${u})[${k === 1 ? '' : k}(${u}) ${m < 0 ? '-' : '+'} ${ma}]`, MD_CREAM)] },
        { name: '③ 去括號合併', hint: '方括號裡整理成一次式', items: [mdInk(`= ${finalS}`, MD_JADE)] }
      ];
      const g2 = c0 === 0 ? 1 : gcd(k, c0);
      if (g2 > 1) note = `括號裡還有公因數 ${g2}：也可以寫成 ${mn(g2)}(${mn(u)})(${mn(linStr(k / g2, c0 / g2))})`;
      if (ma === 1) { note = `第二項整個被提走，方括號裡留下 ${mn(m)}，不是 0`; noteCol = MD_ROSE; }
    }

    drawStepRows(ctx, rows, rows.length, { top: 198, gap: 66, labX: 22, eqX: 176, size: 20, color: C });
    if (note) {
      drawPanel(ctx, 18, cv.height - 52, cv.width - 36, 40, noteCol, 0.08);
      textCenter(ctx, note, cv.width / 2, cv.height - 32, noteCol, f(700, 14));
    }

    out.innerHTML = wbrEq(tx(`${pS} = ${finalS}`));
    fb.innerHTML = wrapFeedback(mode === 'mono'
      ? `兩項都有的公因式提到括號外：${wbrEq(tx(`${pS} = ${finalS}`))}。提完要檢查括號裡還有沒有公因式。`
      : `把整個括號 \\((${linStr(1, iv(sp))})\\) 當成公因式提出來，方括號裡再去括號合併。`);
    typeset([out, fb]);
  }

  [sa, sb, sk, sp, sm].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-ex-mode', v => { mode = v; draw(); });
  bindPickGroup(tG, 'data-ex-take', v => { take = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：變號提公因式——(a − x) = −(x − a)、(a − x)² = (x − a)²
   ========================================================================== */
function initFlipCanvas() {
  const cv = elById('canvas-flip');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('fl-a'), sp = elById('fl-p'), sb = elById('fl-b'), sc = elById('fl-c');
  const va = elById('fl-va'), vp = elById('fl-vp'), vb = elById('fl-vb'), vc = elById('fl-vc');
  const rowC = elById('fl-row-c');
  const mG = elById('fl-mode-group'), gG = elById('fl-sign-group');
  const out = elById('fl-formula');
  const fb = elById('fl-feedback');
  const C = MD_TONE[6];
  let mode = 'one', sign = 1;

  function draw() {
    rowC.style.display = mode === 'one' ? '' : 'none';
    const a = iv(sa), p = iv(sp), b = iv(sb), c = iv(sc);
    va.textContent = a; vp.textContent = p; vb.textContent = b; vc.textContent = c;
    const u = `x - ${a}`, ua = `${a} - x`;
    const lin1 = linStr(p, b);
    const first = prod2(u, lin1);
    const op = sign > 0 ? '+' : '-', opN = sign > 0 ? '-' : '+';
    let expr, step1, step2, ix, ic;
    if (mode === 'one') {
      const lin2 = linStr(1, c);
      expr = `${first} ${op} ${prod2(ua, lin2)}`;
      step1 = `${first} ${opN} ${prod2(u, lin2)}`;
      step2 = `(${u})[${wrapP(lin1)} ${opN} ${wrapP(lin2)}]`;
      ix = p - sign; ic = b - sign * c;
    } else {
      expr = `${first} ${op} (${ua})^2`;
      step1 = `${first} ${op} (${u})^2`;
      step2 = `(${u})[${wrapP(lin1)} ${op} (${u})]`;
      ix = p + sign; ic = b - sign * a;
    }
    let result, note = null, noteCol = MD_CREAM;
    if (ix === 0 && ic === 0) {
      result = '0';
      note = '兩項剛好互相抵消，整個式子等於 0';
    } else if (ix === 0) {
      result = ic === 1 ? u : (ic === -1 ? `-(${u})` : `${ic}(${u})`);
      note = '方括號裡的 x 消掉了，只剩常數';
    } else {
      result = prod2(u, linStr(ix, ic));
      const g = ic === 0 ? Math.abs(ix) : gcd(ix, ic);
      if (g > 1) note = `方括號裡還有公因數 ${g}，也可以再提出來`;
    }

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '先變號，才看得到公因式', C);
    // 翻牌：左邊是原本的寫法，右邊是變號後的寫法
    const left = mode === 'one' ? `(${ua})` : `(${ua})^2`;
    const right = mode === 'one' ? `-(${u})` : `(${u})^2`;
    mdBlock(ctx, 70, 54, 160, 66, MD_ROSE, { alpha: 0.18, lw: 3.5 });
    mdBlock(ctx, 310, 54, 160, 66, MD_JADE, { alpha: 0.18, lw: 3.5 });
    drawExpr(ctx, [mdInk(left, MD_ROSE)], 150, 87, 22, MD_ROSE, { maxW: 150 });
    drawExpr(ctx, [mdInk(right, MD_JADE)], 390, 87, 22, MD_JADE, { maxW: 150 });
    drawArrow(ctx, 242, 87, 298, 87, INK, 2.5);
    textCenter(ctx, '翻面', 270, 70, MUTED, f(700, 13));
    textCenter(ctx, mode === 'one' ? '括號裡兩項都變號，括號前要多一個負號' : '平方之後，負號不見了：兩者完全相等', cv.width / 2, 142, MD_CREAM, f(700, 14.5));

    const rows = [
      { name: '原式', hint: '兩項的括號長得不一樣', items: [mdInk(expr, INK)] },
      { name: '① 變號', hint: mode === 'one' ? '前面的加減號要跟著反過來' : '平方的括號直接換掉', items: [mdInk(`= ${step1}`, MD_CREAM)] },
      { name: '② 提公因式', hint: '兩項都有同一個括號', items: [mdInk(`= ${step2}`, MD_CREAM)] },
      { name: '③ 合併', hint: '方括號裡去括號、合併', items: [mdInk(`= ${result}`, MD_JADE)] }
    ];
    drawStepRows(ctx, rows, rows.length, { top: 192, gap: 62, labX: 22, eqX: 150, size: 19, color: C });
    if (note) {
      drawPanel(ctx, 18, cv.height - 50, cv.width - 36, 38, noteCol, 0.08);
      textCenter(ctx, note, cv.width / 2, cv.height - 31, noteCol, f(700, 14));
    }

    out.innerHTML = wbrEq(tx(`${expr} = ${result}`));
    fb.innerHTML = wrapFeedback(mode === 'one'
      ? `\\(${ua}\\) 換成 \\(-(${u})\\)，前面的「\\(${op}\\)」就變成「\\(${opN}\\)」，兩項才有公因式 \\(${u}\\)。`
      : `\\((${ua})^2 = (${u})^2\\)：平方後正負號不見，前面的「\\(${op}\\)」不變。`);
    typeset([out, fb]);
  }

  [sa, sp, sb, sc].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-fl-mode', v => { mode = v; draw(); });
  bindPickGroup(gG, 'data-fl-sign', v => { sign = (v === 'plus') ? 1 : -1; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：平方差公式——挖掉一角的正方形，剪開拼成長方形
   ========================================================================== */
function initDiffSqCanvas() {
  const cv = elById('canvas-dsq');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = elById('ds-k'), sn = elById('ds-n');
  const vk = elById('ds-vk'), vn = elById('ds-vn');
  const vG = elById('ds-var-group');
  const out = elById('ds-formula');
  const fb = elById('ds-feedback');
  const C = MD_TONE[7];
  const st = { step: 99 };
  let vy = 'num';

  function draw() {
    const k = iv(sk), n = iv(sn);
    vk.textContent = k; vn.textContent = n;
    st.step = clamp(st.step, 1, 4);
    syncSteps('ds', st.step, 4);
    const s = st.step;
    const aS = pyMono(k, 1);
    const bS = vy === 'y' ? (n === 1 ? 'y' : `${n}y`) : String(n);
    const aSq = pyMono(k * k, 2);
    const bSq = vy === 'y' ? (n === 1 ? 'y^2' : `${n * n}y^2`) : String(n * n);
    const res = `(${aS} + ${bS})(${aS} - ${bS})`;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '平方差：挖掉一角，剪開拼成長方形', C);
    const S = 180, Bp = Math.round(S * (0.2 + 0.05 * n)), X0 = 40, Y0 = 66;
    const A = S - Bp;
    if (s === 1) {
      mdBlock(ctx, X0, Y0, S, S, MD_RED, { alpha: 0.3, lw: 3.5 });
      drawExpr(ctx, [mdInk('a^2', MD_RED)], X0 + S / 2, Y0 + S / 2, 26, MD_RED);
    } else if (s === 2) {
      mdBlock(ctx, X0, Y0, S, A, MD_RED, { alpha: 0.3, lw: 3 });
      mdBlock(ctx, X0, Y0 + A, A, Bp, MD_RED, { alpha: 0.3, lw: 3 });
      mdHatch(ctx, X0 + A, Y0 + A, Bp, Bp, MD_YELLOW);
      drawExpr(ctx, [mdInk('b^2', MD_YELLOW)], X0 + A + Bp / 2, Y0 + A + Bp / 2, 17, MD_YELLOW);
      drawExpr(ctx, [mdInk('a^2 - b^2', MD_RED)], X0 + S / 2, Y0 + A / 2, 20, MD_RED);
    } else {
      const fade = (s === 4) ? 0.12 : 0.3;
      mdBlock(ctx, X0, Y0, S, A, MD_RED, { alpha: fade, lw: 3, frameAlpha: s === 4 ? 0.35 : 0.9 });
      mdBlock(ctx, X0, Y0 + A, A, Bp, MD_BLUE, { alpha: fade, lw: 3, frameAlpha: s === 4 ? 0.35 : 0.9 });
      if (s === 3) {
        drawExpr(ctx, [mdInk('a', MD_RED), T('×', MD_RED), mdInk('(a - b)', MD_RED)], X0 + S / 2, Y0 + A / 2, 16, MD_RED, { maxW: S - 10 });
        drawExpr(ctx, [mdInk('(a - b)', MD_BLUE), T('×', MD_BLUE), mdInk('b', MD_BLUE)], X0 + A / 2, Y0 + A + Bp / 2, 14, MD_BLUE, { maxW: A - 6 });
        mdLine(ctx, X0 - 6, Y0 + A, X0 + A + 6, Y0 + A, MD_ROSE, 2.5, [7, 5]);
        textLeft(ctx, '✂ 沿虛線剪開', X0, Y0 + S + 18, MD_ROSE, f(700, 13));
      }
    }
    // 邊長標示
    if (s <= 2) {
      textCenter(ctx, 'a', X0 + S / 2, Y0 - 12, MD_RED, fi(800, 16));
      textCenter(ctx, 'a', X0 - 14, Y0 + S / 2, MD_RED, fi(800, 16));
      if (s === 2) textCenter(ctx, 'b', X0 + A + Bp / 2, Y0 + S + 14, MD_YELLOW, fi(800, 15));
    }
    if (s === 4) {
      // 右下那塊轉 90° 接到上面那塊的右邊：寬 a + b、高 a − b
      const RX = 40, RY = 300;
      mdBlock(ctx, RX, RY, S, A, MD_RED, { alpha: 0.3, lw: 3 });
      mdBlock(ctx, RX + S, RY, Bp, A, MD_BLUE, { alpha: 0.3, lw: 3 });
      drawArrow(ctx, X0 + A / 2, Y0 + S + 6, RX + S + Bp / 2, RY - 6, MD_BLUE, 2);
      textCenter(ctx, 'a + b', RX + (S + Bp) / 2, RY + A + 16, MD_CREAM, fi(800, 16));
      textCenter(ctx, 'a − b', RX + S + Bp + 32, RY + A / 2, MD_CREAM, fi(800, 16));
      labelBox(ctx, [mdInk('(a + b)(a - b)', MD_JADE)], RX + (S + Bp) / 2, RY + A / 2, 17, MD_JADE);
    }

    // 右側：這一步在做什麼
    const TX = 262;
    const lines = [
      [[T('a =', MUTED), mdInk(aS, MD_RED), T('，', MUTED), mdInk(`a^2 = ${aSq}`, MD_RED)]],
      [[T('b =', MUTED), mdInk(bS, MD_YELLOW), T('，', MUTED), mdInk(`b^2 = ${bSq}`, MD_YELLOW)], [T('剩下', MUTED), mdInk(`a^2 - b^2`, INK)]],
      [[T('L 形剪成兩個長方形', MUTED)], [T('下面那塊轉 90° 接到右邊', MUTED)]],
      [[T('拼成長方形：寬', MUTED), mdInk('a + b', INK), T('、高', MUTED), mdInk('a - b', INK)]]
    ];
    let ty = 84;
    for (let i = 0; i < s; i++) {
      lines[i].forEach(ln => {
        drawExpr(ctx, ln, 0, ty, 15, INK, { left: TX, maxW: cv.width - TX - 14, gap: 4 });
        ty += 28;
      });
      ty += 8;
    }
    // 第 4 步的長方形佔掉左下，算式框改放到最底下整排
    if (s === 4) {
      drawPanel(ctx, 18, cv.height - 62, cv.width - 36, 50, MD_JADE, 0.08);
      exLine(ctx, [mdInk(`${aSq} - ${bSq} = ${res}`, MD_JADE)], cv.height - 37, 21);
    } else {
      drawPanel(ctx, TX - 10, 304, cv.width - TX - 8, 56, C, 0.08);
      drawExpr(ctx, [mdInk(`${aSq} - ${bSq}`, INK)], (TX - 10 + cv.width - 18) / 2, 330, 19, INK, { maxW: cv.width - TX - 24 });
    }

    out.innerHTML = wbrEq(`${aSq} - ${bSq} = (${aS})^2 - ${vy === 'y' && n !== 1 ? `(${bS})` : bS}^2 = ${res}`);
    fb.innerHTML = wrapFeedback(s < 4
      ? `第 ${s} 步：${['先畫邊長 \\(a\\) 的正方形', '挖掉邊長 \\(b\\) 的一角，剩下 \\(a^2 - b^2\\)', '剩下的 L 形剪成兩個長方形'][s - 1]}。`
      : `面積不變：\\(a^2 - b^2 = (a + b)(a - b)\\)。這裡 \\(a = ${aS}\\)、\\(b = ${bS}\\)。`);
    typeset([out, fb]);
  }

  [sk, sn].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(vG, 'data-ds-var', v => { vy = v; draw(); });
  bindSteps('ds', () => 4, st, draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：平方差公式——整組括號看成 a
   ========================================================================== */
function initBracketCanvas() {
  const cv = elById('canvas-brk');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = elById('bk-p'), sq = elById('bk-q'), sn = elById('bk-n');
  const vp = elById('bk-vp'), vq = elById('bk-vq'), vn = elById('bk-vn');
  const mG = elById('bk-mode-group');
  const out = elById('bk-formula');
  const fb = elById('bk-feedback');
  const C = MD_TONE[8];
  let mode = 'minus';

  function draw() {
    const p = iv(sp), q = iv(sq), n = iv(sn);
    vp.textContent = p; vq.textContent = q; vn.textContent = n;
    const u = linStr(p, q);
    let rows, expr, result, alt = null;
    if (mode === 'minus') {
      expr = `(${u})^2 - ${n * n}`;
      const f1 = linStr(p, q + n), f2 = linStr(p, q - n);
      result = prod2(f1, f2);
      rows = [
        { name: '① 寫成 a² − b²', hint: `${n * n} 寫成 ${n} 的平方`, items: [mdInk(`${expr} = (${u})^2 - ${n}^2`, INK)] },
        { name: '② 套公式', hint: 'a 是整組括號、b 是數字', items: [mdInk(`= [(${u}) + ${n}][(${u}) - ${n}]`, MD_CREAM)] },
        { name: '③ 去括號', hint: '括號前是加號，直接拿掉', items: [mdInk(`= (${pyJoin([[p, 1], [q, 0], [n, 0]])})(${pyJoin([[p, 1], [q, 0], [-n, 0]])})`, MD_CREAM)] },
        { name: '④ 合併', hint: '常數合併', items: [mdInk(`= ${result}`, MD_JADE)] }
      ];
    } else {
      expr = `${n * n} - (${u})^2`;
      const f1 = linStr(p, n + q), f2 = linStr(-p, n - q);
      result = prod2(f1, f2);
      alt = '-' + prod2(linStr(p, q + n), linStr(p, q - n));
      rows = [
        { name: '① 寫成 a² − b²', hint: '這次數字在前，a 是數字', items: [mdInk(`${expr} = ${n}^2 - (${u})^2`, INK)] },
        { name: '② 套公式', hint: 'b 是整組括號', items: [mdInk(`= [${n} + (${u})][${n} - (${u})]`, MD_CREAM)] },
        { name: '③ 去括號', hint: '減一整組：括號裡每一項都變號', items: [mdInk(`= (${pyJoin([[n, 0], [p, 1], [q, 0]])})(${pyJoin([[n, 0], [-p, 1], [-q, 0]])})`, MD_ROSE)] },
        { name: '④ 合併', hint: '常數合併', items: [mdInk(`= ${result}`, MD_JADE)] }
      ];
    }

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '整組括號當成一個 a', C);
    // 上方：a、b 各是什麼
    const aIs = mode === 'minus' ? `(${u})` : String(n), bIs = mode === 'minus' ? String(n) : `(${u})`;
    mdBlock(ctx, 60, 50, 190, 58, MD_RED, { alpha: 0.2, lw: 3.5 });
    mdBlock(ctx, 290, 50, 190, 58, MD_YELLOW, { alpha: 0.2, lw: 3.5 });
    drawExpr(ctx, [IT('a', MD_RED), T('=', MD_RED), mdInk(aIs, MD_RED)], 155, 79, 20, MD_RED, { maxW: 180 });
    drawExpr(ctx, [IT('b', MD_YELLOW), T('=', MD_YELLOW), mdInk(bIs, MD_YELLOW)], 385, 79, 20, MD_YELLOW, { maxW: 180 });
    exLine(ctx, [mdInk('a^2 - b^2 = (a + b)(a - b)', MD_CREAM)], 136, 18);

    drawStepRows(ctx, rows, rows.length, { top: 192, gap: 64, labX: 22, eqX: 172, size: 19, color: C });
    let note = null;
    if (alt) note = `也可以把負號提到最前面：${mn(alt).replace(/\^2/g, '²')}`;
    else {
      const gs = [[p, q + n], [p, q - n]].map(([x, c]) => (c === 0 ? Math.abs(x) : gcd(x, c)));
      if (gs.some(g => g > 1)) note = '某個因式的係數還有公因數，可以再提出來';
    }
    if (note) {
      drawPanel(ctx, 18, cv.height - 50, cv.width - 36, 38, MD_CREAM, 0.06);
      textCenter(ctx, note, cv.width / 2, cv.height - 31, MD_CREAM, f(700, 14));
    }

    out.innerHTML = wbrEq(tx(`${expr} = ${result}`));
    fb.innerHTML = wrapFeedback(mode === 'minus'
      ? `把 \\((${u})\\) 整組看成 \\(a\\)、\\(${n}\\) 看成 \\(b\\)，套平方差公式後再去括號。`
      : `\\(${n}\\) 是 \\(a\\)、整組 \\((${u})\\) 是 \\(b\\)；<b>減一整組</b>時括號裡的每一項都要變號。`);
    typeset([out, fb]);
  }

  [sp, sq, sn].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-bk-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：和的平方公式——紅、藍、黃色塊能不能拼成一個正方形
   ========================================================================== */
function initSumSqCanvas() {
  const cv = elById('canvas-ssq');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = elById('ss-k'), sn = elById('ss-n'), sb = elById('ss-b');
  const vk = elById('ss-vk'), vn = elById('ss-vn'), vb = elById('ss-vb');
  const out = elById('ss-formula');
  const fb = elById('ss-feedback');
  const C = MD_TONE[9];

  function draw() {
    const k = iv(sk), n = iv(sn), b = iv(sb);
    vk.textContent = k; vn.textContent = n; vb.textContent = b;
    const need = 2 * k * n;
    const ok = (b === need);
    const pS = pyStr([n * n, b, k * k]);
    const aS = pyMono(k, 1);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, ok ? '拼得成正方形：完全平方式' : '拼拼看：長條的數量對不對？', C);
    const U = 16, X = Math.min(78, Math.floor((300 - n * U) / k));
    const x0 = 30, y0 = 60, kx = k * X;
    // 紅色 x² 方塊
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) mdBlock(ctx, x0 + i * X, y0 + j * X, X, X, MD_RED, { alpha: 0.32, lw: 2.5 });
    // 藍色 x 長條的位置：右邊一欄直放、下面一列橫放
    const slots = [];
    for (let r = 0; r < k; r++) for (let c = 0; c < n; c++) slots.push([x0 + kx + c * U, y0 + r * X, U, X]);
    for (let r = 0; r < k; r++) for (let c = 0; c < n; c++) slots.push([x0 + r * X, y0 + kx + c * U, X, U]);
    slots.forEach((sl, i) => {
      if (i < b) mdBlock(ctx, sl[0], sl[1], sl[2], sl[3], MD_BLUE, { alpha: 0.38, lw: 1.6 });
      else mdBlock(ctx, sl[0], sl[1], sl[2], sl[3], MD_ROSE, { alpha: 0, lw: 1.4, dash: [4, 3], frame: MD_ROSE });
    });
    // 黃色 1 方塊
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) mdBlock(ctx, x0 + kx + i * U, y0 + kx + j * U, U, U, MD_YELLOW, { alpha: 0.42, lw: 1.4 });
    if (ok) {
      ctx.save();
      ctx.strokeStyle = MD_JADE;
      ctx.lineWidth = 3.5;
      ctx.strokeRect(x0 - 3, y0 - 3, kx + n * U + 6, kx + n * U + 6);
      ctx.restore();
    }

    // 右側：數量與多出來的長條
    const RX = 350;
    textLeft(ctx, `紅色 x² 方塊：${k * k} 個`, RX, 74, MD_RED, f(800, 14));
    textLeft(ctx, `藍色 x 長條：${b} 條`, RX, 100, MD_BLUE, f(800, 14));
    textLeft(ctx, `黃色 1 方塊：${n * n} 個`, RX, 126, MD_YELLOW, f(800, 14));
    textLeft(ctx, `拼成正方形要 ${need} 條長條`, RX, 158, MUTED, f(700, 13.5));
    if (b < need) textLeft(ctx, `還缺 ${need - b} 條（紅虛線）`, RX, 184, MD_ROSE, f(800, 14));
    if (b > need) {
      const extra = b - need;
      textLeft(ctx, `多出 ${extra} 條，放不進去`, RX, 184, MD_ROSE, f(800, 14));
      const w = Math.min(46, X * 0.6), h = 10;
      for (let i = 0; i < extra; i++) {
        const c = i % 3, r = Math.floor(i / 3);
        mdBlock(ctx, RX + c * (w + 6), 202 + r * (h + 6), w, h, MD_BLUE, { alpha: 0.38, lw: 1.4 });
      }
    }

    const y1 = 384;
    drawPanel(ctx, 18, y1, cv.width - 36, 126, ok ? MD_JADE : C, 0.07);
    const sq = k === 1 ? 'x^2' : `(${aS})^2`;
    exLine(ctx, [T('首項', MUTED), mdInk(`${pyMono(k * k, 2)} = ${sq}`, MD_RED), T('　末項', MUTED), mdInk(`${n * n} = ${n}^2`, MD_YELLOW), T('✓', MD_JADE)], y1 + 24, 17);
    exLine(ctx, [T('中間項要是', MUTED), mdInk(`2·${aS}·${n} = ${need}x`, INK), T('，題目是', MUTED), mdInk(`${b === 0 ? '0' : pyMono(b, 1)}`, MD_BLUE), T(ok ? '✓' : '✗', ok ? MD_JADE : MD_ROSE)], y1 + 58, 17);
    exLine(ctx, ok
      ? [mdInk(`${pS} = (${aS} + ${n})^2`, MD_JADE)]
      : [T('中間項不對，拼不成正方形，不能用和的平方公式', MD_ROSE)], y1 + 96, ok ? 21 : 16);

    out.innerHTML = ok ? wbrEq(`${pS} = (${aS} + ${n})^2`) : `\\(${pS}\\)`;
    fb.innerHTML = wrapFeedback(ok
      ? `首項是 \\((${aS})^2\\)、末項是 \\(${n}^2\\)，中間項剛好是 \\(2 \\times ${aS} \\times ${n}\\)：<b>和的平方</b>。`
      : `首末兩項都是平方，但中間項要是 \\(${need}x\\) 才拼得成正方形；現在是 \\(${b === 0 ? '0' : pyMono(b, 1)}\\)。`);
    typeset([out, fb]);
  }

  [sk, sn, sb].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 11：差的平方公式——扣掉兩條長條，角落扣了兩次要補回
   ========================================================================== */
function initDiffSq2Canvas() {
  const cv = elById('canvas-dsq2');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = elById('dq-k'), sn = elById('dq-n');
  const vk = elById('dq-vk'), vn = elById('dq-vn');
  const out = elById('dq-formula');
  const fb = elById('dq-feedback');
  const C = MD_TONE[10];
  const st = { step: 99 };

  function draw() {
    const k = iv(sk), n = iv(sn);
    vk.textContent = k; vn.textContent = n;
    st.step = clamp(st.step, 1, 4);
    syncSteps('dq', st.step, 4);
    const s = st.step;
    const aS = pyMono(k, 1), aSq = pyMono(k * k, 2), ab = pyMono(k * n, 1);
    const pS = pyStr([n * n, -2 * k * n, k * k]);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '差的平方：扣兩條，再補回一角', C);
    const S = 220, Bp = Math.round(S * (0.15 + 0.07 * n)), X0 = 40, Y0 = 62, A = S - Bp;
    // 留下來的 (a − b)²
    mdBlock(ctx, X0, Y0, A, A, MD_RED, { alpha: 0.3, lw: 3 });
    if (s === 1) {
      mdBlock(ctx, X0, Y0, S, S, MD_RED, { alpha: 0.3, lw: 3.5 });
      drawExpr(ctx, [mdInk('a^2', MD_RED)], X0 + S / 2, Y0 + S / 2, 26, MD_RED);
    } else {
      // 右邊那條 a × b
      mdHatch(ctx, X0 + A, Y0, Bp, A, MD_BLUE);
      if (s >= 3) mdHatch(ctx, X0, Y0 + A, A, Bp, MD_BLUE);
      else mdBlock(ctx, X0, Y0 + A, A, Bp, MD_RED, { alpha: 0.3, lw: 3 });
      // 右下角：第 2 步扣一次、第 3 步扣兩次、第 4 步補回
      if (s === 2) mdHatch(ctx, X0 + A, Y0 + A, Bp, Bp, MD_BLUE);
      if (s === 3) mdHatch(ctx, X0 + A, Y0 + A, Bp, Bp, MD_ROSE, true);
      if (s === 4) {
        mdHatch(ctx, X0, Y0 + A, A, Bp, MD_BLUE);
        mdBlock(ctx, X0 + A, Y0 + A, Bp, Bp, MD_YELLOW, { alpha: 0.4, lw: 3 });
        drawExpr(ctx, [T('+', MD_YELLOW), mdInk('b^2', MD_YELLOW)], X0 + A + Bp / 2, Y0 + A + Bp / 2, 15, MD_YELLOW, { maxW: Bp - 4 });
      }
      drawExpr(ctx, [mdInk(s === 4 ? '(a - b)^2' : 'a^2', MD_RED)], X0 + A / 2, Y0 + A / 2, 20, MD_RED, { maxW: A - 8 });
      textCenter(ctx, '−ab', X0 + A + Bp / 2, Y0 + A / 2, MD_BLUE, f(800, 15));
      if (s >= 3) textCenter(ctx, '−ab', X0 + A / 2, Y0 + A + Bp / 2, MD_BLUE, f(800, 15));
      if (s === 3) textCenter(ctx, '扣兩次', X0 + A + Bp / 2, Y0 + S + 16, MD_ROSE, f(800, 13));
      textCenter(ctx, 'b', X0 + A + Bp / 2, Y0 - 12, MD_BLUE, fi(800, 15));
    }
    textCenter(ctx, 'a', X0 - 14, Y0 + S / 2, MD_RED, fi(800, 16));
    if (s === 1) textCenter(ctx, 'a', X0 + S / 2, Y0 - 12, MD_RED, fi(800, 16));
    else textCenter(ctx, 'a − b', X0 + A / 2, Y0 - 12, MD_RED, fi(800, 15));

    const TX = 284;
    const lines = [
      [T('大正方形', MUTED), mdInk('a^2', MD_RED)],
      [T('扣掉右邊一條', MUTED), mdInk('ab', MD_BLUE)],
      [T('再扣下面一條', MUTED), mdInk('ab', MD_BLUE), T('：角落扣了兩次', MD_ROSE)],
      [T('補回角落', MUTED), mdInk('b^2', MD_YELLOW)]
    ];
    for (let i = 0; i < s; i++) drawExpr(ctx, lines[i], 0, 82 + i * 34, 15, INK, { left: TX, maxW: cv.width - TX - 12, gap: 4 });
    const formula = ['a^2', 'a^2 - ab', 'a^2 - 2ab', 'a^2 - 2ab + b^2 = (a - b)^2'][s - 1];
    drawExpr(ctx, [mdInk(formula, s === 4 ? MD_JADE : INK)], 0, 232, 16, INK, { left: TX, maxW: cv.width - TX - 12, gap: 4 });

    const y1 = 310;
    drawPanel(ctx, 18, y1, cv.width - 36, 112, s === 4 ? MD_JADE : C, 0.07);
    exLine(ctx, [T('a =', MUTED), mdInk(aS, MD_RED), T('、b =', MUTED), mdInk(String(n), MD_BLUE), T('、ab =', MUTED), mdInk(ab, MD_BLUE)], y1 + 26, 17);
    exLine(ctx, [mdInk(s === 4 ? `${pS} = (${aS} - ${n})^2` : pS, s === 4 ? MD_JADE : INK)], y1 + 62, 20);
    exLine(ctx, [T('提醒：', MD_ROSE), mdInk('(a - b)^2', INK), T('不等於', MD_ROSE), mdInk('a^2 - b^2', INK), T('，中間的 −2ab 不能忘', MD_ROSE)], y1 + 96, 14.5);

    out.innerHTML = wbrEq(`${pS} = (${aS})^2 - 2 \\cdot ${aS} \\cdot ${n} + ${n}^2 = (${aS} - ${n})^2`);
    fb.innerHTML = wrapFeedback(s < 4
      ? `第 ${s} 步：${['邊長 \\(a\\) 的正方形', '扣掉一條 \\(ab\\)', '再扣一條 \\(ab\\)，右下角被扣了兩次'][s - 1]}。`
      : `補回多扣的 \\(b^2\\)：\\(a^2 - 2ab + b^2 = (a - b)^2\\)。中間項是<b>負的</b>，所以是差的平方。`);
    typeset([out, fb]);
  }

  [sk, sn].forEach(s => s.addEventListener('input', draw));
  bindSteps('dq', () => 4, st, draw);
  drawWithFonts(draw);
}
