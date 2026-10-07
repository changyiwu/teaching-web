/* ==========================================================================
   3-4-2（第三冊 4-2）配方法與公式解 — 互動 Canvas 與隨堂評量
   畫風：木刻版畫風柑橘觀光果園（小柚、阿圃），第 4 章三節共用。
   配色沿用 3-4-1：柑橘橘 OC_ORANGE 是 x² 那一塊、天空藍 OC_SKY 是 x 項、
   葉綠 OC_LEAF 是要補上的那一塊；玫瑰 OC_ROSE 是錯、翡翠綠 OC_JADE 是對。

   共用工具在 ../math-canvas.js（T／IT／SEQ／GRP／PW／FR／VF／RT／measure／
   drawExpr／drawPanel／drawTitle／drawStepRows／wbrEq／numLine…），本檔只放
   本節的色票、有理數與根式小工具，以及 11 個互動。

   ⚠️ 根式一律用「整數運算＋化成最簡根式」處理（sqSplit／rootsOf），不用浮點數
   判斷化簡；浮點數只拿來印近似值。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initSqrtCanvas();
  initShiftCanvas();
  initSquareCanvas();
  initCs1Canvas();
  initBigCanvas();
  initCsaCanvas();
  initSignCanvas();
  initFormulaCanvas();
  initDiscCanvas();
  initNegaCanvas();
  initParamCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具（OC_ = Orchard；共用檔沒有這個前綴）
   ========================================================================== */

const OC_ORANGE = '#fdba74';  // 柑橘：x² 那一塊
const OC_LEAF = '#86efac';    // 葉綠：配方要補上的那一塊
const OC_SKY = '#93c5fd';     // x 項
const OC_CREAM = '#fef3c7';   // 深色底板上的算式字色
const OC_ROSE = '#fb7185';    // 錯誤、無解
const OC_JADE = '#6ee7b7';    // 正確、成立

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const OC_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
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

// 滑桿跳過 0（係數不能是 0 的那幾支）；要在 draw 的監聽器之前綁
function skipZero(el) {
  let last = iv(el) || 1;
  el.addEventListener('input', () => {
    let v = iv(el);
    if (v === 0) { v = last > 0 ? -1 : 1; el.value = v; }
    last = v;
  });
}

/* --------------------------------------------------------------------------
   算式字串 → canvas 元件（3-4-1 的 ocParse）
   原始字串一律用 ASCII 寫：「3x^2 - 5x + 4」「(-3)^2」「4·2·(-1)」。
   -------------------------------------------------------------------------- */
function ocParse(str, color) {
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
      out.push(GRP([SEQ(ocParse(str.slice(i + 1, j), color), color, 1)], ch === '[' ? '[]' : '()', color));
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

function ocInk(s, color) {
  return SEQ(ocParse(String(s), color), color, 1);
}

// 置中的一行（中文字與算式元件混排）
function exLine(ctx, items, y, size, color) {
  return drawExpr(ctx, items, ctx.canvas.width / 2, y, size || 17, color || INK, { maxW: ctx.canvas.width - 60, gap: 6 });
}

function ocLine(ctx, x1, y1, x2, y2, color, width, dash) {
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

// 一格木框：半透明填色、淺色框
function ocBox(ctx, x, y, w, h, color, alpha, dash) {
  ctx.save();
  ctx.globalAlpha = alpha == null ? 0.2 : alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  if (dash) ctx.setLineDash(dash);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

// 代入用：負數平方要加括號 (−3)²，負數相乘也加括號
function sqS(v) {
  return v < 0 ? `(${v})^2` : `${v}^2`;
}

function pS(v) {
  return v < 0 ? `(${v})` : String(v);
}

// 一列推導（drawStepRows 的列）
function row(name, hint, items, color) {
  return { name, hint, items, color };
}

// 近似值：四捨五入到小數第 2 位，保留尾巴的 0
function ap(v) {
  const r = Math.round(v * 100) / 100;
  return mn((Math.abs(r) < 0.005 ? 0 : r).toFixed(2));
}

/* --------------------------------------------------------------------------
   有理數：一律以化成最簡的 [分子, 分母] 表示，分母為正
   -------------------------------------------------------------------------- */

// texFrac 不化簡（AGENTS.md〈工作約定〉），本頁的分數一律先 reduce
function fTex(n, d) {
  const r = reduce(n, d);
  return texFrac(r[0], r[1]);
}

function rTex(r) {
  return fTex(r[0], r[1]);
}

function rAdd(p, q) {
  return reduce(p[0] * q[1] + q[0] * p[1], p[1] * q[1]);
}

function rMul(p, q) {
  return reduce(p[0] * q[0], p[1] * q[1]);
}

function rNeg(p) {
  return [-p[0], p[1]];
}

function rAbs(p) {
  return [Math.abs(p[0]), p[1]];
}

function sameR(p, q) {
  return p[0] * q[1] === q[0] * p[1];
}

// canvas 上的分數或整數（負號提到分數前面）
function rIt(r, color) {
  const [a, b] = reduce(r[0], r[1]);
  if (b === 1) return T(mn(a), color);
  if (a < 0) return SEQ([T('−', color), FR(-a, b, color)], color, 2);
  return FR(a, b, color);
}

function xIs(r, color) {
  return SEQ([IT('x', color), T('=', color), rIt(r, color)], color, 6);
}

/* --------------------------------------------------------------------------
   有理係數的 x 多項式：[[係數(有理數), 次數], ...]，照給定順序排
   -------------------------------------------------------------------------- */
function rpTex(list) {
  let s = '';
  list.forEach(([q, d]) => {
    if (q[0] === 0) return;
    const a = rAbs(q);
    const one = a[0] === 1 && a[1] === 1;
    const body = d === 0 ? rTex(a) : (one ? '' : rTex(a)) + (d === 1 ? 'x' : 'x^2');
    if (!s) s = (q[0] < 0 ? '-' : '') + body;
    else s += (q[0] < 0 ? ' - ' : ' + ') + body;
  });
  return s || '0';
}

function rpItems(list, color) {
  const out = [];
  list.forEach(([q, d]) => {
    if (q[0] === 0) return;
    const a = rAbs(q);
    const one = a[0] === 1 && a[1] === 1;
    const parts = [];
    if (d === 0) parts.push(rIt(a, color));
    else {
      if (!one) parts.push(rIt(a, color));
      parts.push(d === 1 ? IT('x', color) : PW(IT('x', color), '2', false, color));
    }
    const body = parts.length === 1 ? parts[0] : SEQ(parts, color, 1);
    if (!out.length) out.push(q[0] < 0 ? SEQ([T('−', color), body], color, 2) : body);
    else { out.push(T(q[0] < 0 ? '−' : '+', color)); out.push(body); }
  });
  if (!out.length) out.push(T('0', color));
  return out;
}

const ONE = [1, 1];

// 整數係數的 ax² + bx + c
function quadTex(a, b, c) {
  return rpTex([[[a, 1], 2], [[b, 1], 1], [[c, 1], 0]]);
}

function quadItems(a, b, c, color) {
  return rpItems([[[a, 1], 2], [[b, 1], 1], [[c, 1], 0]], color);
}

// (x + h)²（h 為有理數，0 時只寫 x²）
function sqTex(h) {
  if (h[0] === 0) return 'x^2';
  return `\\left(x ${h[0] < 0 ? '-' : '+'} ${rTex(rAbs(h))}\\right)^2`;
}

function xPlus(h, color) {
  if (h[0] === 0) return IT('x', color);
  return SEQ([IT('x', color), T(h[0] < 0 ? '−' : '+', color), rIt(rAbs(h), color)], color, 6);
}

function sqItem(h, color) {
  if (h[0] === 0) return PW(IT('x', color), '2', false, color);
  return PW(xPlus(h, color), '2', true, color);
}

// 補上的那一塊 (一半)²：整數寫 3²，分數寫 (5/2)²
function halfSqTex(half) {
  return half[1] === 1 ? `${half[0]}^2` : `\\left(${rTex(half)}\\right)^2`;
}

function halfSqItem(half, color) {
  return PW(rIt(half, color), '2', half[1] !== 1, color);
}

/* --------------------------------------------------------------------------
   根式：n = k²·r（r 不含平方因數）
   -------------------------------------------------------------------------- */
function sqSplit(n) {
  let k = 1, r = n;
  for (let p = 2; p * p <= r; p++) {
    while (r % (p * p) === 0) { r /= p * p; k *= p; }
  }
  return [k, r];
}

// √K（K 為正的有理數）化成 q√r：√(n/d) = √(nd)/d
function sqrtR(K) {
  const [k, r] = sqSplit(K[0] * K[1]);
  return { q: reduce(k, K[1]), r };
}

// q√r 的 LaTeX 與 canvas 元件（r = 1 時就是有理數 q）
function surdTex(S) {
  if (S.r === 1) return rTex(S.q);
  const [n, d] = S.q;
  const top = `${n === 1 ? '' : n}\\sqrt{${S.r}}`;
  return d === 1 ? top : `\\frac{${top}}{${d}}`;
}

function surdCore(Q, r, color) {
  return Q === 1 ? RT(T(r, color), color) : SEQ([T(Q, color), RT(T(r, color), color)], color, 1);
}

function surdItem(S, color) {
  if (S.r === 1) return rIt(S.q, color);
  const [n, d] = S.q;
  const top = surdCore(n, S.r, color);
  return d === 1 ? top : VF(top, T(d, color), color);
}

// 平方根要不要多寫一步「= 化簡後」：√K 本身就是最簡時不必
function surdNeedsStep(K) {
  return !(K[1] === 1 && sqSplit(K[0])[0] === 1);
}

// 「±√K」的原始寫法（K 是分數時寫成 √(分數)）
function rawRootItem(K, color) {
  return RT(rIt(K, color), color);
}

function rawRootTex(K) {
  return `\\sqrt{${rTex(K)}}`;
}

/* --------------------------------------------------------------------------
   ax² + bx + c = 0（整數係數）的解，一律化成最簡：
     none   無解          double 重根 r1
     rat2   兩個有理根 r1 > r2
     irr    (P ± Q√R) / Dn，Dn > 0、三者互質
   v1 ≥ v2 是近似值。
   -------------------------------------------------------------------------- */
function rootsOf(a, b, c) {
  const D = b * b - 4 * a * c;
  const res = { a, b, c, D };
  if (D < 0) { res.kind = 'none'; return res; }
  if (D === 0) {
    res.kind = 'double';
    res.r1 = res.r2 = reduce(-b, 2 * a);
    res.v1 = res.v2 = -b / (2 * a);
    return res;
  }
  const [k, r] = sqSplit(D);
  const m = -b / (2 * a), s = Math.sqrt(D) / Math.abs(2 * a);
  res.v1 = m + s; res.v2 = m - s;
  if (r === 1) {
    let r1 = reduce(-b + k, 2 * a), r2 = reduce(-b - k, 2 * a);
    if (r1[0] / r1[1] < r2[0] / r2[1]) { const t = r1; r1 = r2; r2 = t; }
    res.kind = 'rat2'; res.r1 = r1; res.r2 = r2;
    return res;
  }
  let P = -b, Q = k, Dn = 2 * a;
  const g = gcd(gcd(P, Q), Dn);
  P /= g; Q /= g; Dn /= g;
  if (Dn < 0) { P = -P; Dn = -Dn; }
  Object.assign(res, { kind: 'irr', P, Q, R: r, Dn });
  return res;
}

function pmNumTex(P, Q, R) {
  const s = `${Q === 1 ? '' : Q}\\sqrt{${R}}`;
  return P === 0 ? `\\pm ${s}` : `${P} \\pm ${s}`;
}

function pmTex(P, Q, R, Dn) {
  if (Dn === 1) return pmNumTex(P, Q, R);
  if (P === 0) return `\\pm \\frac{${Q === 1 ? '' : Q}\\sqrt{${R}}}{${Dn}}`;
  return `\\frac{${pmNumTex(P, Q, R)}}{${Dn}}`;
}

function pmNumItem(P, Q, R, color) {
  const parts = [];
  if (P !== 0) parts.push(T(mn(P), color));
  parts.push(T('±', color));
  parts.push(surdCore(Q, R, color));
  return SEQ(parts, color, 5);
}

function pmItem(P, Q, R, Dn, color) {
  if (Dn === 1) return pmNumItem(P, Q, R, color);
  if (P === 0) return SEQ([T('±', color), VF(surdCore(Q, R, color), T(Dn, color), color)], color, 4);
  return VF(pmNumItem(P, Q, R, color), T(Dn, color), color);
}

// 「x = …」的 HTML（給數值列）
function rootsHtml(res) {
  if (res.kind === 'none') return '無解';
  if (res.kind === 'double') return `\\(x = ${rTex(res.r1)}\\)（重根）`;
  if (res.kind === 'rat2') return `\\(x = ${rTex(res.r1)}\\) 或 \\(x = ${rTex(res.r2)}\\)`;
  return `\\(x = ${pmTex(res.P, res.Q, res.R, res.Dn)}\\)`;
}

function rootsItems(res, color) {
  if (res.kind === 'none') return [T('無解', color || OC_ROSE)];
  if (res.kind === 'double') return [xIs(res.r1, color), T('（重根）', color)];
  if (res.kind === 'rat2') return [xIs(res.r1, color), T('或', MUTED), xIs(res.r2, color)];
  return [IT('x', color), T('=', color), pmItem(res.P, res.Q, res.R, res.Dn, color)];
}

// 「兩個解約為 …」
function approxText(res) {
  if (res.kind === 'none') return '';
  if (res.kind === 'double') return `重根 x ≈ ${ap(res.v1)}`;
  return `x ≈ ${ap(res.v1)} 或 x ≈ ${ap(res.v2)}`;
}

/* --------------------------------------------------------------------------
   配方法的推導列：x² + Bx + C = 0（B、C 為有理數）
   回傳從「移項」開始的列，以及配完的 h（x + h）與 K（右邊）。
   最後一列是「x = −h ± √K」這種還沒合併的寫法；要不要再化簡交給呼叫端。
   -------------------------------------------------------------------------- */
function csRows(B, C, color) {
  const rows = [];
  const h = reduce(B[0], B[1] * 2);
  const half = rAbs(h);
  const mC = rNeg(C);
  const K = rAdd(mC, rMul(h, h));
  const left = rpItems([[ONE, 2], [B, 1]], color);

  rows.push(row('移項', '常數項移到右邊', [...left, T('=', color), ...rpItems([[mC, 0]], color)]));
  if (B[0] !== 0) {
    const right = mC[0] === 0 ? [halfSqItem(half, color)]
      : [...rpItems([[mC, 0]], color), T('+', color), halfSqItem(half, color)];
    rows.push(row('兩邊同加', `x 項係數的一半，再平方`, [...left, T('+', color), halfSqItem(half, color), T('=', color), ...right]));
    rows.push(row('配成完全平方', '左邊是 (x + 一半)²', [sqItem(h, color), T('=', color), rIt(K, color)]));
  }
  const lhs = xPlus(h, color);
  if (K[0] < 0) {
    rows.push(row('開平方？', '平方不會是負數', [T('找不到 x：方程式無解', OC_ROSE)], OC_ROSE));
  } else if (K[0] === 0) {
    rows.push(row('開平方', '右邊是 0', [lhs, T('=', color), T('0', color)]));
    rows.push(row('解', '兩個解相同', [xIs(rNeg(h), color), T('（重根）', color)]));
  } else {
    const S = sqrtR(K);
    const items = [lhs, T('=', color), T('±', color), rawRootItem(K, color)];
    if (surdNeedsStep(K)) items.push(T('=', color), T('±', color), surdItem(S, color));
    rows.push(row('開平方', '正、負兩個平方根', items));
    if (h[0] !== 0) {
      const negH = rNeg(h);
      rows.push(row('移項', '解出 x', [IT('x', color), T('=', color), rIt(negH, color), T('±', color), surdItem(S, color)]));
    }
  }
  return { rows, h, K };
}

// 最後要不要多一列「答（化成最簡）」：x = −h ± S 本身已是最簡時就不必
function needAnswerRow(cs) {
  if (cs.K[0] <= 0) return false;
  const S = sqrtR(cs.K);
  if (S.r === 1) return true;
  return !(cs.h[1] === 1 && S.q[1] === 1);
}

// 配方的關鍵式 (x + h)² = K 的 LaTeX
function csKeyTex(B, C) {
  const h = reduce(B[0], B[1] * 2);
  const K = rAdd(rNeg(C), rMul(h, h));
  return `${sqTex(h)} = ${rTex(K)}`;
}

/* --------------------------------------------------------------------------
   步驟按鈕：上一步／下一步／全部顯示
   -------------------------------------------------------------------------- */
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

// 數線上的一個解：實心圓點加近似值標籤
function rootDot(ctx, x, y, color, label, hollow) {
  numLineEnd(ctx, x, y, !hollow, color);
  if (label) textCenter(ctx, label, x, y + 38, color, f(800, 14));
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第三冊 4-2 的 22 題正解
  // 正解字母分布：A 6 題、B 6 題、C 5 題、D 5 題（開發約束 36）
  const answers = {
    '4-2-1': 'B',    // (x − 4)² = 49 → 11 和 −3
    '4-2-2': 'D',    // x² = 50 → ±5√2
    '4-2-3': 'A',    // (3x + 1)² − 5 = 15 → (−1 ± 2√5)/3
    '4-2-4': 'C',    // (4x − 7)² + 3 = 27 → (7 ± 2√6)/4
    '4-2-5': 'C',    // x² − 14x + 49 = (x − 7)²
    '4-2-6': 'A',    // x² + kx + 64 是完全平方式 → k = ±16
    '4-2-7': 'B',    // x² − 10x + 7 = 0 → 5 ± 3√2
    '4-2-8': 'A',    // x² − 9x + 4 = 0：第二步加錯，正解 (9 ± √65)/2
    '4-2-9': 'B',    // x² − 14x − 1551 = 0 → 47 和 −33
    '4-2-10': 'D',   // x² + 10x − 3339 = 0 的解：53
    '4-2-11': 'D',   // 2x² − 12x + 5 = 0 → (6 ± √26)/2
    '4-2-12': 'C',   // 5x² + 20x − 3 = 0：第一步常數項沒除以 5
    '4-2-13': 'C',   // 甲兩相異的解、乙無解
    '4-2-14': 'A',   // 2x² − 28x + 98 = 0 → 7（重根）
    '4-2-15': 'D',   // 2x² − 7x − 3 = 0 → (7 ± √73)/4
    '4-2-16': 'B',   // x² + 7x − 2 = 0：c 的負號漏掉，正解 (−7 ± √57)/2
    '4-2-17': 'C',   // 9x² − 30x + 25 = 0 有重根
    '4-2-18': 'D',   // 5x² + 9x + 6 = 0 無解
    '4-2-19': 'B',   // −3x² + 8x + 2 = 0 → (4 ± √22)/3
    '4-2-20': 'A',   // −4x² + x + 7 = 0：分母應為 −8，正解 (1 ± √113)/8
    '4-2-21': 'A',   // x² − 12x + (2m + 4) = 0 有重根 → m = 16、x = 6
    '4-2-22': 'B'    // mx² − 6x + 1 = 0 無解 → m 的最小整數 10
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
   重點 1：平方根概念——(x + a)² = k，x + a 是 k 的平方根（有正有負）
   ========================================================================== */
function initSqrtCanvas() {
  const cv = elById('canvas-sqrt');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('sq-a'), sk = elById('sq-k');
  const va = elById('sq-va'), vk = elById('sq-vk');
  const g = elById('sq-mode-group');
  const out = elById('sq-formula');
  const fb = elById('sq-feedback');
  const C = OC_TONE[0];
  let mode = 'pm';

  function draw() {
    const a = iv(sa), k = iv(sk);
    va.textContent = a; vk.textContent = k;
    const h = [a, 1], K = [k, 1];
    const S = sqrtR(K);
    const res = rootsOf(1, 2 * a, a * a - k);
    const wrong = mode === 'plus';
    const W = cv.width;

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '開平方：x + a 是 k 的平方根，有正也有負', C);
    drawPanel(ctx, 18, 44, W - 36, 54, C, 0.06);
    exLine(ctx, [sqItem(h, OC_CREAM), T('=', OC_CREAM), T(k, OC_CREAM)], 71, 24);

    const rootSide = wrong ? [] : [T('±', INK)];
    const r2 = [xPlus(h), T('='), ...rootSide, rawRootItem(K)];
    if (surdNeedsStep(K)) r2.push(T('='), ...(wrong ? [] : [T('±')]), surdItem(S));
    const rows = [row('開平方', wrong ? '只取正的平方根' : '正、負兩個平方根', r2, wrong ? OC_ROSE : undefined)];
    if (wrong) {
      const v = rAdd(rNeg(h), S.r === 1 ? S.q : [0, 1]);
      rows.push(row('解', '只剩一個', S.r === 1 ? [xIs(v)] : [IT('x'), T('='), ...(a ? [T(mn(-a)), T('+')] : []), surdItem(S)], OC_ROSE));
    } else if (S.r === 1) {
      rows.push(row('移項', '兩個值分開算', [IT('x'), T('='), T(mn(-a)), T('±'), surdItem(S)]));
      rows.push(row('解', '', rootsItems(res)));
    } else {
      rows.push(row('解', a ? '把 a 移到右邊' : '', [IT('x'), T('='), ...(a ? [T(mn(-a))] : []), T('±'), surdItem(S)]));
    }
    drawStepRows(ctx, rows, rows.length, { top: 132, gap: 50, eqX: 172, color: C, size: 20 });

    // 數線：兩個解對稱地落在 −a 的兩側，各離 −a 有 √k 那麼遠
    const L = numLine(ctx, { x0: 48, x1: W - 52, y: 330, min: -12, max: 12, tick: 1, labelEvery: 2, font: f(700, 12) });
    const cx = L.px(-a), s = Math.sqrt(k);
    const x1 = L.px(-a + s), x2 = L.px(-a - s);
    ocLine(ctx, cx, 278, cx, 322, OC_ORANGE, 2, [5, 4]);
    textCenter(ctx, `中心 ${mn(-a)}`, cx, 266, OC_ORANGE, f(800, 13));
    ocLine(ctx, cx, 300, x1, 300, OC_JADE, 3);
    textCenter(ctx, `√${k}`, (cx + x1) / 2, 288, OC_JADE, f(800, 13));
    if (wrong) {
      ocLine(ctx, cx, 300, x2, 300, OC_ROSE, 2, [4, 4]);
      rootDot(ctx, x1, 330, OC_JADE, ap(res.v1));
      rootDot(ctx, x2, 330, OC_ROSE, '漏掉了', true);
    } else {
      ocLine(ctx, cx, 300, x2, 300, OC_JADE, 3);
      textCenter(ctx, `√${k}`, (cx + x2) / 2, 288, OC_JADE, f(800, 13));
      rootDot(ctx, x1, 330, OC_JADE, ap(res.v1));
      rootDot(ctx, x2, 330, OC_JADE, ap(res.v2));
    }

    const y = 396;
    drawPanel(ctx, 18, y, W - 36, 62, wrong ? OC_ROSE : OC_JADE, 0.08);
    if (wrong) {
      exLine(ctx, [T('負的那個平方根也成立：', OC_ROSE), xPlus(h, OC_ROSE), T('=', OC_ROSE), T('−', OC_ROSE), surdItem(S, OC_ROSE)], y + 31, 17);
    } else {
      exLine(ctx, [T('兩個解：', OC_JADE), ...rootsItems(res, OC_JADE)], y + 31, 19);
    }

    out.innerHTML = `${wbrEq(`${sqTex(h)} = ${k}`)}，${rootsHtml(res)}`;
    fb.innerHTML = wrapFeedback(wrong
      ? `只取正號，就漏掉了另一個解 \\(x = ${res.kind === 'rat2' ? rTex(res.r2) : `${a ? -a + ' - ' : '-'}${surdTex(S)}`}\\)。\\(${k}\\) 的平方根有 \\(\\pm${surdTex(S)}\\) 兩個，兩個代回去都成立。`
      : `\\(${a ? `x ${a < 0 ? '-' : '+'} ${Math.abs(a)}` : 'x'}\\) 是 \\(${k}\\) 的平方根，有正、負兩個，所以有兩個解；在數線上它們對稱地落在 \\(${-a}\\) 的兩側。`);
    typeset([out, fb]);
  }

  [sa, sk].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-sq-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：先移項，再開平方——(mx + n)² + t = R
   ========================================================================== */
function initShiftCanvas() {
  const cv = elById('canvas-shift');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sm = elById('sh-m'), sn = elById('sh-n'), st = elById('sh-t'), sr = elById('sh-r');
  const vm = elById('sh-vm'), vn = elById('sh-vn'), vt = elById('sh-vt'), vr = elById('sh-vr');
  const out = elById('sh-formula');
  const fb = elById('sh-feedback');
  const C = OC_TONE[1];
  skipZero(sn);

  function draw() {
    const m = iv(sm), n = iv(sn), t = iv(st), R = iv(sr);
    vm.textContent = m; vn.textContent = n; vt.textContent = t; vr.textContent = R;
    const k = R - t;
    const res = rootsOf(m * m, 2 * m * n, n * n - k);
    const inner = rpTex([[[m, 1], 1], [[n, 1], 0]]);
    const innerIt = () => SEQ(rpItems([[[m, 1], 1], [[n, 1], 0]]), undefined, 6);
    const sqIt = () => PW(innerIt(), '2', true);
    const W = cv.width;

    const orig = [sqIt()];
    if (t) orig.push(T(t < 0 ? '−' : '+'), T(Math.abs(t)));
    orig.push(T('='), T(mn(R)));
    const rows = [row('原式', '平方的那一組先留在左邊', orig)];
    if (t) rows.push(row('移項', `把 ${mn(t)} 移到右邊`, [sqIt(), T('='), T(mn(k))]));

    if (k < 0) {
      rows.push(row('開平方？', '平方不會是負數', [T('找不到 x：方程式無解', OC_ROSE)], OC_ROSE));
    } else if (k === 0) {
      rows.push(row('開平方', '右邊是 0', [innerIt(), T('='), T('0')]));
      rows.push(row('解', '兩個解相同', rootsItems(res)));
    } else {
      const K = [k, 1], S = sqrtR(K);
      const r3 = [innerIt(), T('='), T('±'), rawRootItem(K)];
      if (surdNeedsStep(K)) r3.push(T('='), T('±'), surdItem(S));
      rows.push(row('開平方', `${mn(inner)} 是 ${k} 的平方根`, r3));
      const mx = m === 1 ? IT('x') : SEQ([T(m), IT('x')], undefined, 1);
      const rhs = n ? [T(mn(-n)), T('±'), surdItem(S)] : [T('±'), surdItem(S)];
      if (n) rows.push(row('移項', `把 ${mn(n)} 移到右邊`, [mx, T('='), ...rhs]));
      // 同除以 m 之後若已是最簡（分子分母互質），就不再多一列「化簡」
      const g0 = S.r === 1 ? 0 : gcd(gcd(n, S.q[0]), m);
      if (m > 1) {
        const top = SEQ(rhs, undefined, 5);
        rows.push(row(`同除以 ${m}`, '右邊整個除以係數', [IT('x'), T('='), VF(top, T(m))]));
      }
      if (S.r === 1 || (m > 1 && g0 !== 1)) rows.push(row('化簡', '', rootsItems(res)));
    }
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '先把平方那一組單獨留在左邊，再開平方', C);
    drawStepRows(ctx, rows, rows.length, { top: 72, gap: 56, eqX: 172, color: C, size: 20 });

    const y = 392;
    const ok = k >= 0;
    drawPanel(ctx, 18, y, W - 36, 66, ok ? OC_JADE : OC_ROSE, 0.08);
    if (k > 0) {
      exLine(ctx, [T('兩個解', OC_JADE), T(approxText(res), MUTED)], y + 33, 17);
    } else if (k === 0) {
      exLine(ctx, [T('右邊是 0：兩個解相同（重根）', OC_JADE)], y + 33, 17);
    } else {
      exLine(ctx, [T(`移項後右邊是 ${mn(k)}，任何數的平方都不是負數`, OC_ROSE)], y + 33, 17);
    }

    out.innerHTML = `${wbrEq(`\\left(${inner}\\right)^2 = ${k}`)}，${rootsHtml(res)}`;
    let note;
    if (k < 0) note = `移項後右邊是 \\(${k}\\)，平方不可能是負數，所以無解。`;
    else if (k === 0) note = `移項後右邊是 \\(0\\)，只有 \\(${inner} = 0\\) 一種可能，兩個解相同。`;
    else if (m > 1) note = `最後要把右邊<b>整個</b>除以 \\(${m}\\)：\\(${n ? -n : ''}\\) 和 \\(\\pm${surdTex(sqrtR([k, 1]))}\\) 都要除，不能只除前面那一項。`;
    else note = `先移項讓平方那一組單獨在左邊，右邊是正數 \\(${k}\\)，開平方得到兩個解。`;
    fb.innerHTML = wrapFeedback(note);
    typeset([out, fb]);
  }

  [sm, sn, st, sr].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：完全平方式與配方——x² ± px 加上 (p/2)²
   ========================================================================== */
function initSquareCanvas() {
  const cv = elById('canvas-square');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = elById('sqr-p'), vp = elById('sqr-vp');
  const out = elById('sqr-formula');
  const fb = elById('sqr-feedback');
  const C = OC_TONE[2];
  skipZero(sp);

  function draw() {
    const p = iv(sp);
    vp.textContent = p;
    const h = reduce(p, 2), half = rAbs(h), hh = rMul(h, h);
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, p > 0 ? '和的平方：把缺的那一角補上' : '差的平方：多減的那一角要加回來', C);

    // 面積圖：邊長 x 畫成 170px，1 單位 12px
    const x0 = 44, y0 = 74, X = 170, u = 12, w = half[0] / half[1] * u;
    ctx.save();
    if (p > 0) {
      ocBox(ctx, x0, y0, X, X, OC_ORANGE, 0.22);
      ocBox(ctx, x0 + X, y0, w, X, OC_SKY, 0.22);
      ocBox(ctx, x0, y0 + X, X, w, OC_SKY, 0.22);
      ocBox(ctx, x0 + X, y0 + X, w, w, OC_LEAF, 0.35, [5, 4]);
      ocLine(ctx, x0, y0 - 1, x0 + X + w, y0 - 1, OC_JADE, 1);
      textCenter(ctx, 'x²', x0 + X / 2, y0 + X / 2, OC_ORANGE, fi(800, 24));
      textCenter(ctx, 'x', x0 + X / 2, y0 - 14, MUTED, fi(800, 15));
      textCenter(ctx, 'x', x0 - 14, y0 + X / 2, MUTED, fi(800, 15));
      drawExpr(ctx, [rIt(half, OC_SKY)], x0 + X + w / 2, y0 - 16, 13, OC_SKY, { maxW: 60 });
      drawExpr(ctx, [rIt(half, OC_SKY)], x0 + X + w + 22, y0 + X + w / 2, 13, OC_SKY, { maxW: 60 });
      drawExpr(ctx, [T('補', OC_LEAF)], x0 + X + w / 2, y0 + X + w + 20, 15, OC_LEAF, {});
    } else {
      ocBox(ctx, x0, y0, X, X, OC_ORANGE, 0.12);
      ocBox(ctx, x0, y0, X - w, X - w, OC_JADE, 0.18);
      ocBox(ctx, x0 + X - w, y0, w, X, OC_ROSE, 0.22);
      ocBox(ctx, x0, y0 + X - w, X, w, OC_ROSE, 0.22);
      ocBox(ctx, x0 + X - w, y0 + X - w, w, w, OC_LEAF, 0.45, [5, 4]);
      textCenter(ctx, 'x', x0 + X / 2, y0 - 14, MUTED, fi(800, 15));
      textCenter(ctx, 'x', x0 - 14, y0 + X / 2, MUTED, fi(800, 15));
      drawExpr(ctx, [sqItem(h, OC_JADE)], x0 + (X - w) / 2, y0 + (X - w) / 2, 16, OC_JADE, { maxW: X - w - 6 });
      drawExpr(ctx, [rIt(half, OC_ROSE)], x0 + X - w / 2, y0 - 16, 13, OC_ROSE, { maxW: 60 });
      drawExpr(ctx, [T('減了兩次', OC_LEAF)], x0 + X / 2 + 20, y0 + X + 20, 14, OC_LEAF, {});
    }
    ctx.restore();

    // 右欄：係數 → 一半 → 平方
    const rx = 320;
    textLeft(ctx, 'x 項係數', rx, 84, MUTED, f(700, 14));
    drawExpr(ctx, [T(mn(p), OC_SKY)], 0, 112, 24, OC_SKY, { left: rx });
    textLeft(ctx, '取一半', rx, 150, MUTED, f(700, 14));
    drawExpr(ctx, [rIt(h, OC_SKY)], 0, 190, 24, OC_SKY, { left: rx });
    textLeft(ctx, '再平方（要補的）', rx, 236, MUTED, f(700, 14));
    drawExpr(ctx, [halfSqItem(half, OC_LEAF), T('=', OC_LEAF), rIt(hh, OC_LEAF)], 0, 282, 22, OC_LEAF, { left: rx, maxW: W - rx - 16 });

    const y = 342;
    drawPanel(ctx, 18, y, W - 36, 120, C, 0.07);
    exLine(ctx, [...rpItems([[ONE, 2], [[p, 1], 1]], OC_CREAM), T('+', OC_LEAF), halfSqItem(half, OC_LEAF), T('=', OC_CREAM), sqItem(h, OC_CREAM)], y + 36, 22);
    exLine(ctx, [T('□ =', MUTED), rIt(hh, OC_LEAF), T('　　★ =', MUTED), rIt(half, OC_SKY)], y + 88, 19);

    out.innerHTML = wbrEq(`x^2 ${p < 0 ? '-' : '+'} ${Math.abs(p) === 1 ? '' : Math.abs(p)}x + ${rTex(hh)} = ${sqTex(h)}`);
    fb.innerHTML = wrapFeedback(p > 0
      ? `\\(x^2 + ${p === 1 ? '' : p}x\\) 是 \\(x^2\\) 加上兩條 \\(${rTex(half)} \\times x\\) 的長條，缺一角 \\(${halfSqTex(half)} = ${rTex(hh)}\\)，補上就成了邊長 \\(x + ${rTex(half)}\\) 的正方形。`
      : `從 \\(x^2\\) 減掉兩條 \\(${rTex(half)} \\times x\\) 的長條，角落那一塊被減了兩次，要加回 \\(${rTex(hh)}\\)，剩下邊長 \\(x - ${rTex(half)}\\) 的正方形。不論正負，補的數都是正的。`);
    typeset([out, fb]);
  }

  sp.addEventListener('input', draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：配方法解 x² + bx + c = 0（x² 係數為 1），逐步呈現
   ========================================================================== */
function initCs1Canvas() {
  const cv = elById('canvas-cs1');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sb = elById('c1-b'), sc = elById('c1-c');
  const vb = elById('c1-vb'), vc = elById('c1-vc');
  const out = elById('c1-formula');
  const fb = elById('c1-feedback');
  const C = OC_TONE[3];
  const state = { step: 1 };
  let nRows = 1;
  skipZero(sb);

  function draw() {
    const b = iv(sb), c = iv(sc);
    vb.textContent = b; vc.textContent = c;
    const res = rootsOf(1, b, c);
    const cs = csRows([b, 1], [c, 1]);
    const rows = [row('原式', 'x² 的係數是 1', [...quadItems(1, b, c), T('='), T('0')]), ...cs.rows];
    if (needAnswerRow(cs)) rows.push(row('答', '化成最簡', rootsItems(res)));
    nRows = rows.length;
    state.step = clamp(state.step, 1, nRows);
    syncSteps('c1', state.step, nRows);

    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '配方法：移項 → 補一角 → 配方 → 開平方', C);
    drawStepRows(ctx, rows, state.step, { top: 72, gap: 58, eqX: 172, color: C, size: 20 });

    const y = cv.height - 60;
    if (state.step >= nRows) {
      const ok = cs.K[0] >= 0;
      drawPanel(ctx, 18, y, W - 36, 50, ok ? OC_JADE : OC_ROSE, 0.08);
      exLine(ctx, [T(ok ? (res.kind === 'double' ? '兩個解相同（重根）' : approxText(res)) : '配方後右邊是負數：無解', ok ? OC_JADE : OC_ROSE)], y + 25, 16);
    } else {
      exLine(ctx, [T('按「下一步」看下一行', DIM)], y + 25, 15);
    }

    out.innerHTML = `${wbrEq(csKeyTex([b, 1], [c, 1]))}，${rootsHtml(res)}`;
    const half = rAbs(reduce(b, 2));
    fb.innerHTML = wrapFeedback(`\\(x\\) 項係數是 \\(${b}\\)，一半是 \\(${rTex(reduce(b, 2))}\\)，兩邊同加 \\(${halfSqTex(half)}\\)，左邊就配成 \\(${sqTex(reduce(b, 2))}\\)。${b % 2 ? '係數是奇數，一半是分數，右邊記得通分。' : ''}`);
    typeset([out, fb]);
  }

  [sb, sc].forEach(s => s.addEventListener('input', draw));
  bindSteps('c1', () => nRows, state, draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：常數項很大——配方比十字交乘快
   ========================================================================== */
function initBigCanvas() {
  const cv = elById('canvas-big');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sh = elById('bg-h'), ss = elById('bg-s');
  const vh = elById('bg-vh'), vs = elById('bg-vs');
  const out = elById('bg-formula');
  const fb = elById('bg-feedback');
  const C = OC_TONE[4];
  skipZero(sh);

  function draw() {
    const h = iv(sh), s = iv(ss);
    vh.textContent = h; vs.textContent = s;
    const N = s * s - h * h;
    const b = 2 * h;
    const r1 = -h + s, r2 = -h - s;
    const W = cv.width;

    const rows = [
      row('移項', '', [...quadItems(1, b, 0), T('='), T(N)]),
      row('兩邊同加', `${Math.abs(h)}²`, [...quadItems(1, b, 0), T('+'), PW(T(Math.abs(h)), '2', false), T('='), T(N), T('+'), PW(T(Math.abs(h)), '2', false)]),
      row('配成完全平方', '右邊剛好是平方數', [sqItem([h, 1]), T('='), T(s * s), T('='), PW(T(s), '2', false)]),
      row('開平方', '', [xPlus([h, 1]), T('='), T('±'), T(s)]),
      row('解', '', [xIs([r1, 1]), T('或', MUTED), xIs([r2, 1])])
    ];

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '常數項很大時，配方法只要五行', C);
    drawPanel(ctx, 18, 42, W - 36, 50, C, 0.06);
    exLine(ctx, [...quadItems(1, b, -N, OC_CREAM), T('=', OC_CREAM), T('0', OC_CREAM)], 67, 22);
    drawStepRows(ctx, rows, rows.length, { top: 124, gap: 46, eqX: 172, color: C, size: 19 });

    // 十字交乘要試的因數對：d × (N / d)，d ≤ √N
    const pairs = [];
    for (let d = 1; d * d <= N; d++) if (N % d === 0) pairs.push([d, N / d]);
    const hit = pairs.findIndex(([p, q]) => (p === Math.abs(r1) && q === Math.abs(r2)) || (p === Math.abs(r2) && q === Math.abs(r1)));
    const y = 352;
    drawPanel(ctx, 18, y, W - 36, 136, OC_ORANGE, 0.06);
    textLeft(ctx, `改用十字交乘：要從 ${N} 的 ${pairs.length} 組因數對裡，`, 32, y + 22, OC_ORANGE, f(800, 14));
    textLeft(ctx, `找出「相差 ${Math.abs(b)}」的那一組`, 32, y + 42, OC_ORANGE, f(800, 14));
    const show = pairs.slice(-6);
    const cw = 78, gx = (W - show.length * cw) / 2;
    show.forEach(([p, q], i) => {
      const idx = pairs.length - show.length + i;
      const on = idx === hit;
      const x = gx + i * cw;
      ctx.save();
      roundRect(ctx, x + 3, y + 60, cw - 6, 34, 8);
      ctx.fillStyle = on ? 'rgba(110,231,183,0.18)' : 'rgba(255,255,255,0.04)';
      ctx.fill();
      ctx.strokeStyle = on ? OC_JADE : 'rgba(226,232,240,0.25)';
      ctx.lineWidth = on ? 2.5 : 1;
      ctx.stroke();
      ctx.restore();
      textCenter(ctx, `${p}×${q}`, x + cw / 2, y + 77, on ? OC_JADE : MUTED, f(on ? 800 : 600, 13));
    });
    const more = pairs.length - show.length;
    textCenter(ctx, more > 0 ? `前面還有 ${more} 組；要的那組（${Math.abs(r1)} 與 ${Math.abs(r2)}）在最後面` : `要的那組是 ${Math.abs(r1)} 與 ${Math.abs(r2)}`, W / 2, y + 116, MUTED, f(700, 13));

    out.innerHTML = `${wbrEq(`${quadTex(1, b, -N)} = 0`)}，\\(x = ${r1}\\) 或 \\(x = ${r2}\\)`;
    fb.innerHTML = wrapFeedback(`\\(${N} + ${Math.abs(h)}^2 = ${s * s} = ${s}^2\\) 是完全平方數，配方後一開平方就得到整數解。` + (pairs.length > 3
      ? `十字交乘卻要在 ${pairs.length} 組因數對裡慢慢找。`
      : `這一題 \\(${N}\\) 的因數對只有 ${pairs.length} 組，十字交乘也不難；因數對一多，配方法就快得多。`));
    typeset([out, fb]);
  }

  [sh, ss].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：x² 係數不為 1——先同除以 a，再配方
   ========================================================================== */
function initCsaCanvas() {
  const cv = elById('canvas-csa');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sb = elById('ca-b'), sc = elById('ca-c');
  const vb = elById('ca-vb'), vc = elById('ca-vc');
  const ga = elById('ca-a-group'), gm = elById('ca-mode-group');
  const out = elById('ca-formula');
  const fb = elById('ca-feedback');
  const C = OC_TONE[5];
  let a = 3, mode = 'right';
  skipZero(sb);

  function draw() {
    const b = iv(sb), c = iv(sc);
    vb.textContent = b; vc.textContent = c;
    const res = rootsOf(a, b, c);
    const B = reduce(b, a), Cc = reduce(c, a);
    const W = cv.width;
    let rows;
    const orig = row('原式', `x² 的係數是 ${mn(a)}`, [...quadItems(a, b, c), T('='), T('0')]);
    if (mode === 'right') {
      const cs = csRows(B, Cc);
      rows = [orig, row(`同除以 ${mn(a)}`, '讓 x² 的係數變成 1', [...rpItems([[ONE, 2], [B, 1], [Cc, 0]]), T('='), T('0')]), ...cs.rows];
      if (needAnswerRow(cs)) rows.push(row('答', '化成最簡', rootsItems(res)));
    } else {
      const half = rAbs(reduce(b, 2));
      const hb = reduce(b, 2);
      rows = [
        orig,
        row('移項', '沒有先除以 a', [...quadItems(a, b, 0), T('='), T(mn(-c))], OC_ROSE),
        row('兩邊同加', 'b 的一半再平方', [...quadItems(a, b, 0), T('+'), halfSqItem(half), T('='), ...(c ? [T(mn(-c)), T('+')] : []), halfSqItem(half)], OC_ROSE),
        row('檢查', '展開看看', [sqItem(hb), T('='), ...rpItems([[ONE, 2], [[b, 1], 1], [rMul(hb, hb), 0]])]),
        row('配不成', `左邊是 ${mn(a)}x²，不是 x²`, [T('左邊不是完全平方式', OC_ROSE)], OC_ROSE)
      ];
    }
    const n = rows.length;
    const gap = Math.min(58, (cv.height - 72 - 80) / (n - 1));

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'right' ? '先同除以 x² 的係數，再配方' : '錯誤示範：直接配方會怎樣？', mode === 'right' ? C : OC_ROSE);
    drawStepRows(ctx, rows, n, { top: 72, gap, eqX: 172, color: C, size: 18 });

    const y = cv.height - 58;
    if (mode === 'right') {
      const ok = res.kind !== 'none';
      drawPanel(ctx, 18, y, W - 36, 48, ok ? OC_JADE : OC_ROSE, 0.08);
      exLine(ctx, [T(ok ? (res.kind === 'double' ? '兩個解相同（重根）' : approxText(res)) : '配方後右邊是負數：無解', ok ? OC_JADE : OC_ROSE)], y + 24, 16);
    } else {
      drawPanel(ctx, 18, y, W - 36, 48, OC_ROSE, 0.08);
      exLine(ctx, [T(`(x + 一半)² 展開的開頭是 x²，所以要先把 ${mn(a)}x² 除成 x²`, OC_ROSE)], y + 24, 15);
    }

    out.innerHTML = mode === 'right'
      ? `${wbrEq(`${rpTex([[ONE, 2], [B, 1], [Cc, 0]])} = 0`)}，${rootsHtml(res)}`
      : `${wbrEq(`${quadTex(a, b, c)} = 0`)}：沒有先同除以 \\(${a}\\)，配不成完全平方式`;
    fb.innerHTML = wrapFeedback(mode === 'right'
      ? `等號兩邊同除以 \\(${a}\\)，<b>每一項都要除</b>，常數項變成 \\(${rTex(Cc)}\\)。之後就和 \\(x^2\\) 係數是 \\(1\\) 的配方法完全一樣。${a < 0 ? '除以負數，每一項都會變號。' : ''}`
      : `\\(${sqTex(reduce(b, 2))}\\) 展開是 \\(${rpTex([[ONE, 2], [[b, 1], 1], [rMul(reduce(b, 2), reduce(b, 2)), 0]])}\\)，開頭是 \\(x^2\\)；左邊卻是 \\(${a}x^2\\)，兩者不相等。`);
    typeset([out, fb]);
  }

  [sb, sc].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(ga, 'data-ca-a', v => { a = parseInt(v, 10); draw(); });
  bindPickGroup(gm, 'data-ca-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：配方後 (x + h)² = k——k > 0 兩解、k = 0 重根、k < 0 無解
   ========================================================================== */
function initSignCanvas() {
  const cv = elById('canvas-sign');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sh = elById('sg-h'), sk = elById('sg-k');
  const vh = elById('sg-vh'), vk = elById('sg-vk');
  const out = elById('sg-formula');
  const fb = elById('sg-feedback');
  const C = OC_TONE[6];

  function draw() {
    const h = iv(sh), k = iv(sk);
    vh.textContent = h; vk.textContent = k;
    const res = rootsOf(1, 2 * h, h * h - k);
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '平方的值，有沒有可能等於右邊的 k？', C);
    drawPanel(ctx, 18, 44, W - 36, 52, C, 0.06);
    exLine(ctx, [sqItem([h, 1], OC_CREAM), T('=', OC_CREAM), T(mn(k), OC_CREAM)], 70, 24);

    // 上：平方的值只會落在 0 和右邊
    textLeft(ctx, '① 左邊 (x + h)² 的值可以是多少？', 26, 120, C, f(800, 14));
    const L1 = numLine(ctx, { x0: 48, x1: W - 52, y: 172, min: -9, max: 9, tick: 1, labelEvery: 3, font: f(700, 12) });
    ctx.save();
    ctx.fillStyle = 'rgba(251,113,133,0.16)';
    ctx.fillRect(L1.px(-9) - 18, 150, L1.px(0) - L1.px(-9) + 18, 22);
    ctx.restore();
    textCenter(ctx, '平方不會落在這裡', (L1.px(-9) + L1.px(0)) / 2, 204, OC_ROSE, f(800, 13));
    numLineEnd(ctx, L1.px(0), 172, true, OC_JADE);
    numLineRay(ctx, L1, 172, L1.px(0), true, OC_JADE);
    const kx = L1.px(k);
    ctx.save();
    ctx.fillStyle = k < 0 ? OC_ROSE : OC_CREAM;
    ctx.beginPath();
    ctx.moveTo(kx, 150);
    ctx.lineTo(kx - 8, 136);
    ctx.lineTo(kx + 8, 136);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    textCenter(ctx, `k = ${mn(k)}`, kx, 124, k < 0 ? OC_ROSE : OC_CREAM, f(800, 13));

    // 下：x 的解
    textLeft(ctx, '② 能讓等號成立的 x', 26, 238, C, f(800, 14));
    const L2 = numLine(ctx, { x0: 48, x1: W - 52, y: 296, min: -9, max: 9, tick: 1, labelEvery: 3, font: f(700, 12) });
    const cx = L2.px(-h);
    ocLine(ctx, cx, 262, cx, 290, OC_ORANGE, 2, [5, 4]);
    textCenter(ctx, `−h = ${mn(-h)}`, cx, 252, OC_ORANGE, f(800, 12));
    if (k > 0) {
      rootDot(ctx, L2.px(res.v1), 296, OC_JADE, ap(res.v1));
      rootDot(ctx, L2.px(res.v2), 296, OC_JADE, ap(res.v2));
    } else if (k === 0) {
      rootDot(ctx, cx, 296, OC_JADE, '重根');
    } else {
      textCenter(ctx, '一個點都找不到', W / 2, 336, OC_ROSE, f(800, 15));
    }

    const y = 372;
    const col = k < 0 ? OC_ROSE : OC_JADE;
    drawPanel(ctx, 18, y, W - 36, 86, col, 0.08);
    const verdict = k > 0 ? 'k > 0：兩個相異的解' : (k === 0 ? 'k = 0：兩個解相同（重根）' : 'k < 0：無解');
    exLine(ctx, [T(verdict, col)], y + 28, 19);
    exLine(ctx, k < 0 ? [T('任何數的平方都不是負數', MUTED)] : rootsItems(res, col), y + 62, 18);

    out.innerHTML = `${wbrEq(`${sqTex([h, 1])} = ${k}`)}，${rootsHtml(res)}`;
    fb.innerHTML = wrapFeedback(k > 0
      ? `\\(k = ${k}\\) 是正數，有正、負兩個平方根，所以有兩個相異的解。`
      : (k === 0
        ? `只有 \\(0^2 = 0\\)，所以 \\(x + ${h < 0 ? `(${h})` : h} = 0\\)，兩個解都是 \\(${-h}\\)，稱為重根。`
        : `任何數的平方都不是負數，左邊永遠到不了 \\(${k}\\)，所以方程式無解。`));
    typeset([out, fb]);
  }

  [sh, sk].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：公式解——讀出 a、b、c（含正負號），代入 x = (−b ± √(b² − 4ac)) / 2a
   ========================================================================== */
// (−b ± √D) / 2a 的原始代入式：−(b) 照抄，分母寫 2 × a
function subFormulaItem(a, b, D, den, color) {
  const top = [];
  if (b < 0) top.push(T('−', color), GRP([T(mn(b), color)], '()', color));
  else top.push(T(b === 0 ? '0' : '−' + b, color));
  top.push(T('±', color));
  top.push(RT(T(D, color), color));
  return VF(SEQ(top, color, 4), T(den, color), color);
}

function discItems(a, b, c, color) {
  return [ocInk(`${sqS(b)} - 4·${pS(a)}·${pS(c)}`, color), T('=', color), T(mn(b * b - 4 * a * c), color)];
}

function initFormulaCanvas() {
  const cv = elById('canvas-formula');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('fm-a'), sb = elById('fm-b'), sc = elById('fm-c');
  const va = elById('fm-va'), vb = elById('fm-vb'), vc = elById('fm-vc');
  const g = elById('fm-mode-group');
  const out = elById('fm-formula');
  const fb = elById('fm-feedback');
  const C = OC_TONE[7];
  let mode = 'ok';

  function draw() {
    const a = iv(sa), b = iv(sb), c = iv(sc);
    va.textContent = a; vb.textContent = b; vc.textContent = c;
    const res = rootsOf(a, b, c);
    const D = res.D;
    const W = cv.width;

    // 錯誤示範能不能發生
    let wrongNA = '';
    if (mode === 'sign' && c >= 0) wrongNA = 'c 不是負數，這個錯誤不會發生：把 c 調成負數試試';
    if (mode === 'den' && a === 1) wrongNA = 'a = 1 時分母剛好是 2，看不出差別：把 a 調大試試';
    const wrong = mode !== 'ok' && !wrongNA;

    const rows = [row('讀出 a、b、c', '連同正負號', [T(`a = ${mn(a)}，b = ${mn(b)}，c = ${mn(c)}`)])];
    let wres = null;
    if (wrong && mode === 'sign') {
      const cw = Math.abs(c);
      rows.push(row('判別式', '把 c 寫成正的', [ocInk(`${sqS(b)} - 4·${a}·${cw}`), T('='), T(mn(b * b - 4 * a * cw))], OC_ROSE));
      wres = rootsOf(a, b, cw);
      if (wres.D >= 0) rows.push(row('代入公式', '', [IT('x'), T('='), subFormulaItem(a, b, wres.D, `2 × ${a}`)], OC_ROSE));
      rows.push(row('得到', '錯的答案', rootsItems(wres, OC_ROSE), OC_ROSE));
    } else if (wrong && mode === 'den') {
      rows.push(row('判別式', '', discItems(a, b, c)));
      wres = rootsOf(1, b, a * c);   // (−b ± √D) / 2 恰好是 x² + bx + ac = 0 的解
      if (D >= 0) rows.push(row('代入公式', '分母只寫 2', [IT('x'), T('='), subFormulaItem(a, b, D, '2')], OC_ROSE));
      rows.push(row('得到', '錯的答案', D >= 0 ? rootsItems(wres, OC_ROSE) : [T('判別式小於 0，這組本來就無解', MUTED)], OC_ROSE));
    } else {
      rows.push(row('判別式', 'b² − 4ac', discItems(a, b, c)));
      if (D > 0) {
        rows.push(row('代入公式', '', [IT('x'), T('='), subFormulaItem(a, b, D, `2 × ${a}`)]));
        rows.push(row('化簡', '', rootsItems(res)));
      } else if (D === 0) {
        rows.push(row('判別式 = 0', '± 0 只剩一個', [IT('x'), T('='), VF(T(mn(-b)), T(`2 × ${a}`)), T('='), rIt(res.r1)]));
        rows.push(row('答', '', rootsItems(res)));
      } else {
        rows.push(row('判別式 < 0', '根號裡是負數', [T('方程式無解', OC_ROSE)], OC_ROSE));
      }
    }

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'ok' ? '公式解：先讀出 a、b、c，再代入' : '錯誤示範：代錯一個數，答案就不對', mode === 'ok' ? C : OC_ROSE);
    drawPanel(ctx, 18, 42, W - 36, 50, C, 0.06);
    exLine(ctx, [...quadItems(a, b, c, OC_CREAM), T('=', OC_CREAM), T('0', OC_CREAM)], 67, 22);
    drawStepRows(ctx, rows, rows.length, { top: 128, gap: 62, eqX: 172, color: C, size: 19 });

    const y = 392;
    if (wrongNA) {
      drawPanel(ctx, 18, y, W - 36, 66, MUTED, 0.06);
      exLine(ctx, [T(wrongNA, MUTED)], y + 33, 15);
    } else if (wrong && wres && wres.kind !== 'none') {
      const v = wres.v1, val = a * v * v + b * v + c;
      drawPanel(ctx, 18, y - 8, W - 36, 82, OC_ROSE, 0.08);
      exLine(ctx, [T(`代回原式：x ≈ ${ap(v)} 時，左邊 ≈ ${ap(val)}，不是 0`, OC_ROSE)], y + 12, 15);
      exLine(ctx, [T('正解：', OC_JADE), ...rootsItems(res, OC_JADE)], y + 48, 15);
    } else if (wrong) {
      drawPanel(ctx, 18, y, W - 36, 66, OC_ROSE, 0.08);
      exLine(ctx, [T('正解：', OC_JADE), ...rootsItems(res, OC_JADE)], y + 33, 16);
    } else {
      const ok = res.kind !== 'none';
      drawPanel(ctx, 18, y, W - 36, 66, ok ? OC_JADE : OC_ROSE, 0.08);
      exLine(ctx, [T(ok ? (res.kind === 'double' ? '兩個解相同（重根）' : approxText(res)) : 'b² − 4ac < 0：無解', ok ? OC_JADE : OC_ROSE)], y + 33, 16);
    }

    out.innerHTML = `${wbrEq(`${quadTex(a, b, c)} = 0`)}，\\(b^2 - 4ac = ${D}\\)，${rootsHtml(res)}`;
    let note;
    if (wrongNA) note = wrongNA.replace(/a = 1/, '\\(a = 1\\)');
    else if (mode === 'sign') note = `\\(c = ${c}\\) 是負數，\\(-4 \\times ${a} \\times (${c})\\) 是<b>加</b> \\(${-4 * a * c}\\)；把負號漏掉，判別式就從 \\(${D}\\) 變成 \\(${b * b - 4 * a * Math.abs(c)}\\)。`;
    else if (mode === 'den') note = `分母是 \\(2a = ${2 * a}\\)，不是 \\(2\\)。分母只寫 \\(2\\)，等於把答案放大成 \\(${a}\\) 倍。`;
    else if (D > 0) note = `判別式 \\(${D} > 0\\)，代入公式得兩個解。` + (b < 0 ? `\\(b = ${b}\\) 是負數，\\(-b\\) 要寫成 \\(-(${b}) = ${-b}\\)。` : `分母是 \\(2a = ${2 * a}\\)。`);
    else if (D === 0) note = '判別式等於 \\(0\\)，\\(\\pm\\sqrt{0}\\) 只剩一個值，兩個解相同。';
    else note = '判別式小於 \\(0\\)，根號裡是負數，方程式無解。';
    fb.innerHTML = wrapFeedback(note);
    typeset([out, fb]);
  }

  [sa, sb, sc].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-fm-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：判別式 b² − 4ac 判斷解的情形
   ========================================================================== */
function initDiscCanvas() {
  const cv = elById('canvas-disc');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('ds-a'), sb = elById('ds-b'), sc = elById('ds-c');
  const va = elById('ds-va'), vb = elById('ds-vb'), vc = elById('ds-vc');
  const out = elById('ds-formula');
  const fb = elById('ds-feedback');
  const C = OC_TONE[8];

  function draw() {
    const a = iv(sa), b = iv(sb), c = iv(sc);
    va.textContent = a; vb.textContent = b; vc.textContent = c;
    const res = rootsOf(a, b, c);
    const D = res.D;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '不用解出來，先看判別式的正負', C);
    drawPanel(ctx, 18, 42, W - 36, 50, C, 0.06);
    exLine(ctx, [...quadItems(a, b, c, OC_CREAM), T('=', OC_CREAM), T('0', OC_CREAM)], 67, 22);
    exLine(ctx, [T('b² − 4ac =', MUTED), ...discItems(a, b, c)], 124, 20);

    // 判別式的刻度尺（超出範圍的值釘在兩端）
    const x0 = 50, x1 = W - 50, yb = 196, lo = -80, hi = 80;
    const X = v => x0 + (clamp(v, lo, hi) - lo) / (hi - lo) * (x1 - x0);
    ctx.save();
    ctx.fillStyle = 'rgba(251,113,133,0.20)';
    ctx.fillRect(x0, yb - 10, X(0) - x0, 20);
    ctx.fillStyle = 'rgba(110,231,183,0.20)';
    ctx.fillRect(X(0), yb - 10, x1 - X(0), 20);
    ctx.restore();
    ocLine(ctx, X(0), yb - 20, X(0), yb + 20, OC_CREAM, 3);
    textCenter(ctx, '0', X(0), yb + 32, OC_CREAM, f(800, 14));
    textCenter(ctx, '負數', (x0 + X(0)) / 2, yb + 32, OC_ROSE, f(700, 13));
    textCenter(ctx, '正數', (X(0) + x1) / 2, yb + 32, OC_JADE, f(700, 13));
    const mx = X(D);
    ctx.save();
    ctx.fillStyle = OC_CREAM;
    ctx.beginPath();
    ctx.moveTo(mx, yb - 12);
    ctx.lineTo(mx - 9, yb - 28);
    ctx.lineTo(mx + 9, yb - 28);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    textCenter(ctx, (D > hi || D < lo ? '超出：' : '') + mn(D), mx, yb - 40, OC_CREAM, f(800, 14));

    // 三種情形
    const kinds = [
      { on: D > 0, t1: 'b² − 4ac > 0', t2: '兩個相異的根', col: OC_JADE },
      { on: D === 0, t1: 'b² − 4ac = 0', t2: '兩根相等（重根）', col: OC_SKY },
      { on: D < 0, t1: 'b² − 4ac < 0', t2: '無解', col: OC_ROSE }
    ];
    const cw = (W - 48) / 3;
    kinds.forEach((k, i) => {
      const x = 24 + i * cw;
      ctx.save();
      roundRect(ctx, x + 4, 262, cw - 8, 76, 10);
      ctx.fillStyle = k.on ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)';
      ctx.fill();
      ctx.strokeStyle = k.on ? k.col : 'rgba(226,232,240,0.18)';
      ctx.lineWidth = k.on ? 3 : 1;
      ctx.stroke();
      ctx.restore();
      textCenter(ctx, k.t1, x + cw / 2, 288, k.on ? k.col : DIM, f(800, 14));
      textCenter(ctx, k.t2, x + cw / 2, 316, k.on ? k.col : DIM, f(800, 15));
    });

    const y = 360;
    const col = D > 0 ? OC_JADE : (D === 0 ? OC_SKY : OC_ROSE);
    drawPanel(ctx, 18, y, W - 36, 96, col, 0.08);
    exLine(ctx, [T('真的解出來對照：', MUTED)], y + 24, 14);
    exLine(ctx, rootsItems(res, col), y + 62, 19);

    out.innerHTML = `\\(b^2 - 4ac = ${D}\\)，${D > 0 ? '兩個相異的根' : (D === 0 ? '兩根相等（重根）' : '無解')}`;
    fb.innerHTML = wrapFeedback(D > 0
      ? `判別式 \\(${D} > 0\\)：\\(\\pm\\sqrt{${D}}\\) 是兩個不同的值，所以有兩個相異的根。`
      : (D === 0
        ? '判別式 \\(= 0\\)：\\(\\pm\\sqrt{0}\\) 都是 \\(0\\)，兩個根相等，就是重根。'
        : `判別式 \\(${D} < 0\\)：沒有任何數的平方是負數，\\(\\sqrt{${D}}\\) 不存在，方程式無解。`));
    typeset([out, fb]);
  }

  [sa, sb, sc].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：x² 係數為負數——先乘以 −1，或直接代入公式，答案相同
   ========================================================================== */
function initNegaCanvas() {
  const cv = elById('canvas-nega');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('ng-a'), sb = elById('ng-b'), sc = elById('ng-c');
  const va = elById('ng-va'), vb = elById('ng-vb'), vc = elById('ng-vc');
  const out = elById('ng-formula');
  const fb = elById('ng-feedback');
  const C = OC_TONE[9];

  function column(x, title, A, B, Cc, col) {
    const res = rootsOf(A, B, Cc);
    const w = 238;
    drawPanel(ctx, x, 104, w, 296, col, 0.06);
    textCenter(ctx, title, x + w / 2, 126, col, f(800, 15));
    const opt = { left: x + 12, maxW: w - 24, gap: 5 };
    drawExpr(ctx, [...quadItems(A, B, Cc), T('='), T('0')], 0, 170, 18, INK, opt);
    textLeft(ctx, `a = ${mn(A)}，b = ${mn(B)}，c = ${mn(Cc)}`, x + 12, 210, MUTED, f(700, 15));
    drawExpr(ctx, [T('b² − 4ac ='), T(mn(res.D))], 0, 244, 17, INK, opt);
    if (res.D > 0) {
      drawExpr(ctx, [IT('x'), T('='), subFormulaItem(A, B, res.D, mn(2 * A))], 0, 296, 18, INK, opt);
      drawExpr(ctx, rootsItems(res, col), 0, 360, 18, col, opt);
    } else if (res.D === 0) {
      drawExpr(ctx, [IT('x'), T('='), VF(T(mn(-B)), T(mn(2 * A)))], 0, 296, 18, INK, opt);
      drawExpr(ctx, rootsItems(res, col), 0, 360, 18, col, opt);
    } else {
      drawExpr(ctx, [T('判別式 < 0：無解', OC_ROSE)], 0, 310, 17, OC_ROSE, opt);
    }
    return res;
  }

  function draw() {
    const a = iv(sa), b = iv(sb), c = iv(sc);
    va.textContent = a; vb.textContent = b; vc.textContent = c;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, 'a 是負數：兩種做法比一比', C);
    drawPanel(ctx, 18, 42, W - 36, 50, C, 0.06);
    exLine(ctx, [...quadItems(a, b, c, OC_CREAM), T('=', OC_CREAM), T('0', OC_CREAM)], 67, 22);
    const r1 = column(24, '方法一：先同乘以 −1', -a, -b, -c, OC_SKY);
    const r2 = column(W - 24 - 238, '方法二：直接代入', a, b, c, OC_ORANGE);

    const y = 414;
    drawPanel(ctx, 18, y, W - 36, 46, OC_JADE, 0.08);
    exLine(ctx, [T(r1.kind === 'none' ? '兩種做法都判斷為無解' : '兩種做法化簡後，答案完全相同', OC_JADE)], y + 23, 16);

    out.innerHTML = `${wbrEq(`${quadTex(a, b, c)} = 0`)}，${rootsHtml(r2)}`;
    fb.innerHTML = wrapFeedback(r2.D > 0
      ? `直接代入時分母是 \\(2a = ${2 * a}\\)，是負數；分子、分母同乘以 \\(-1\\) 化簡，就和先同乘以 \\(-1\\) 的答案一樣。判別式兩邊也相同：\\(${r2.D}\\)。`
      : (r2.D === 0 ? '判別式為 \\(0\\)，兩種做法都得到同一個重根。' : `判別式 \\(${r2.D} < 0\\)，兩種做法都無解。`));
    typeset([out, fb]);
  }

  [sa, sb, sc].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 11：已知解的情形，反求係數——x² + bx + m = 0
   ========================================================================== */
function initParamCanvas() {
  const cv = elById('canvas-param');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sb = elById('pm-b'), sm = elById('pm-m');
  const vb = elById('pm-vb'), vm = elById('pm-vm');
  const g = elById('pm-cond-group');
  const out = elById('pm-formula');
  const fb = elById('pm-feedback');
  const C = OC_TONE[10];
  let cond = 'two';
  skipZero(sb);

  function draw() {
    const b = iv(sb), m = iv(sm);
    vb.textContent = b; vm.textContent = m;
    const bd = reduce(b * b, 4);   // 臨界值 b²/4
    const W = cv.width;
    const rel = { two: '>', double: '=', none: '<' }[cond];
    const mRel = { two: '<', double: '=', none: '>' }[cond];
    const name = { two: '兩個相異的根', double: '重根', none: '無解' }[cond];

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `要「${name}」，m 要滿足什麼條件？`, C);
    drawPanel(ctx, 18, 42, W - 36, 50, C, 0.06);
    exLine(ctx, [...rpItems([[ONE, 2], [[b, 1], 1]], OC_CREAM), T('+', OC_CREAM), IT('m', OC_CREAM), T('=', OC_CREAM), T('0', OC_CREAM)], 67, 22);

    const rows = [
      row('判別式', '', [ocInk(`${sqS(b)} - 4·1·m`), T(rel), T('0')]),
      row('整理', '', [T(b * b), T('−'), SEQ([T(4), IT('m')], undefined, 1), T(rel), T('0')]),
      row('解出 m', '', [IT('m'), T(mRel), FR(b * b, 4), ...(bd[1] === 4 ? [] : [T('='), rIt(bd)])])
    ];
    drawStepRows(ctx, rows, rows.length, { top: 124, gap: 48, eqX: 172, color: C, size: 19 });

    // m 的數線
    const L = numLine(ctx, { x0: 48, x1: W - 52, y: 306, min: -4, max: 20, tick: 1, labelEvery: 4, font: f(700, 12) });
    const bx = L.px(bd[0] / bd[1]);
    if (cond === 'two') numLineRay(ctx, L, 306, bx, false, OC_SKY);
    if (cond === 'none') numLineRay(ctx, L, 306, bx, true, OC_SKY);
    numLineEnd(ctx, bx, 306, cond === 'double', OC_SKY);
    drawExpr(ctx, [rIt(bd, OC_SKY)], bx, 274, 15, OC_SKY, { maxW: 60 });

    // 目前的 m 實際是什麼情形
    const D = b * b - 4 * m;
    const ok = cond === 'two' ? D > 0 : (cond === 'double' ? D === 0 : D < 0);
    const mx = L.px(m);
    ctx.save();
    ctx.fillStyle = ok ? OC_JADE : OC_ROSE;
    ctx.beginPath();
    ctx.moveTo(mx, 322);
    ctx.lineTo(mx - 8, 338);
    ctx.lineTo(mx + 8, 338);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    textCenter(ctx, `m = ${mn(m)}`, mx, 350, ok ? OC_JADE : OC_ROSE, f(800, 13));

    let ext;
    if (cond === 'two') ext = `m 的最大整數是 ${Math.ceil(bd[0] / bd[1]) - 1}`;
    else if (cond === 'none') ext = `m 的最小整數是 ${Math.floor(bd[0] / bd[1]) + 1}`;
    else ext = bd[1] === 1 ? `m = ${bd[0]} 時，重根是 x = ${mn(-b / 2)}` : 'b 是奇數，m 不是整數，滑桿調不到';

    const y = 376;
    drawPanel(ctx, 18, y, W - 36, 86, ok ? OC_JADE : OC_ROSE, 0.08);
    const actual = D > 0 ? '兩個相異的根' : (D === 0 ? '重根' : '無解');
    exLine(ctx, [T(`目前 m = ${mn(m)}：b² − 4m = ${mn(D)}，${actual}`, ok ? OC_JADE : OC_ROSE), T(ok ? '✓' : '✗', ok ? OC_JADE : OC_ROSE)], y + 28, 16);
    exLine(ctx, [T(ext, MUTED)], y + 60, 15);

    const relTex = { two: '\\gt', double: '=', none: '\\lt' }[cond];
    const mRelTex = { two: '\\lt', double: '=', none: '\\gt' }[cond];
    out.innerHTML = `${wbrRel(`${b * b} - 4m ${relTex} 0`)}，${wbrRel(`m ${mRelTex} ${rTex(bd)}`)}`;
    fb.innerHTML = wrapFeedback(`要${name}，判別式 \\(b^2 - 4ac ${relTex} 0\\)；這裡 \\(a = 1\\)、\\(b = ${b}\\)、\\(c = m\\)，代入後解出 \\(m ${mRelTex} ${rTex(bd)}\\)。${cond === 'double' ? '「有重根」是等式，只有一個值。' : '「兩個相異的根」「無解」是不等式，答案是一個範圍。'}`);
    typeset([out, fb]);
  }

  [sb, sm].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-pm-cond', v => { cond = v; draw(); });
  drawWithFonts(draw);
}
