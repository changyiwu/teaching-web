/* ==========================================================================
   3-1-3（第三冊 1-3）多項式的乘除運算 — 互動 Canvas 與隨堂評量
   畫風：沿用 3-1-1、3-1-2 的拼布手作工坊。三種布塊對應多項式的三種項：
   大方布 x² 用玫瑰紅、長條 x 用芥末黃、小方布 1 用薄荷綠，三次項另用丹寧藍。

   共用工具在 ../math-canvas.js（T／IT／VF／FR／PW／GRP／SEQ／measure／drawExpr／
   drawStepRows／drawEqPanel／drawPanel／wbrEq／textCenter／textLeft／
   bindPickGroup…），本檔只放本節的色票、多項式工具與 13 個互動。

   ⚠️ qlParse／qlInk／qlPatch／py* 與 3-1-2 的同名函式逐字相同（各頁各自載入，
   不會撞名）。本節另外加了分數係數（rq*）與長除法（rpLongDiv／drawLongDiv）。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initMonoCanvas();
  initDistCanvas();
  initGridCanvas();
  initVmulCanvas();
  initFormulaCanvas();
  initMdivCanvas();
  initLdiv1Canvas();
  initLdiv2Canvas();
  initLdiv3Canvas();
  initBuildCanvas();
  initFindCanvas();
  initMixCanvas();
  initAppCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具（QL_ = Quilt、PY_ = Polynomial；共用檔沒有這兩個前綴）
   ========================================================================== */

const QL_ROSE = '#fb7185';     // x² 的大方布
const QL_TEAL = '#5eead4';     // 1 的小方布
const QL_MUSTARD = '#fcd34d';  // x 的長條
const QL_DENIM = '#93c5fd';    // x³ 項
const QL_CREAM = '#fef3c7';    // 深色底板上的算式字色

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const QL_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9', '#fca5a5', '#f0abfc'];

// 依次數上色：常數、x、x²、x³
const PY_DEG_COL = [QL_TEAL, QL_MUSTARD, QL_ROSE, QL_DENIM];
const PY_VAR = ['', 'x', 'x^2', 'x^3'];
const PY_CN = ['零', '一', '二', '三'];

function elById(id) {
  return document.getElementById(id);
}

function iv(el) {
  return parseInt(el.value, 10);
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
   算式字串 → canvas 元件（與 3-1-2 相同）
   原始字串一律用 ASCII 寫：「3x^2 - 5x + 4」。
     - 小寫英文字母走斜體
     - ^n 接在數字、字母或括號後面就是乘方
     - canvas 上的 - 換成數學減號 −，比連字號長、投影時才看得清楚
   -------------------------------------------------------------------------- */
function qlParse(str, color) {
  const out = [];
  let buf = '';
  const flush = () => {
    if (buf) { out.push(T(buf.replace(/-/g, '−'), color)); buf = ''; }
  };
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(') {
      let d = 1, j = i + 1;
      while (j < str.length) {
        if (str[j] === '(') d++;
        else if (str[j] === ')') { d--; if (d === 0) break; }
        j++;
      }
      flush();
      out.push(GRP([SEQ(qlParse(str.slice(i + 1, j), color), color, 1)], '()', color));
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

function qlInk(s, color) {
  return SEQ(qlParse(String(s), color), color, 1);
}

// 一塊布：半透明填色、實線外框，夠大時再加一圈虛線縫線
function qlPatch(ctx, x, y, w, h, color, opts) {
  const o = opts || {};
  if (w <= 0 || h <= 0) return;
  ctx.save();
  ctx.globalAlpha = o.alpha == null ? 0.30 : o.alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.strokeRect(x, y, w, h);
  if (w > 18 && h > 18 && o.stitch !== false) {
    ctx.setLineDash([4, 4]);
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
  }
  ctx.restore();
}

function qlLine(ctx, x1, y1, x2, y2, color, width, dash) {
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

/* --------------------------------------------------------------------------
   整數係數多項式：以係數陣列表示，索引就是次數。[4, -5, 3] 代表 3x² − 5x + 4。
   字串一律是 ASCII（x^2），同一條字串可以直接當 LaTeX，也可以給 qlInk。
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

// 依次數排出 [[係數, 次數], ...]；asc 為 true 時升冪
function pyList(p, asc) {
  const out = [];
  for (let d = p.length - 1; d >= 0; d--) if (p[d]) out.push([p[d], d]);
  return asc ? out.reverse() : out;
}

function pyStr(p, asc) {
  return pyJoin(pyList(p, asc));
}

// 最高次項的次數；零多項式回 -1
function pyDeg(p) {
  for (let d = p.length - 1; d >= 0; d--) if (p[d]) return d;
  return -1;
}

function pyAdd(p, q) {
  const n = Math.max(p.length, q.length);
  const r = [];
  for (let i = 0; i < n; i++) r.push((p[i] || 0) + (q[i] || 0));
  return r;
}

function pyNeg(p) {
  return p.map(c => (c === 0 ? 0 : -c));
}

function pyMul(p, q) {
  const r = [];
  for (let i = 0; i < p.length + q.length - 1; i++) r.push(0);
  p.forEach((a, i) => q.forEach((b, j) => { r[i + j] += a * b; }));
  return r;
}

// 單項式 c·x^d 的字串
function pyMono(c, d) {
  return pyJoin([[c, d]]);
}

// 直式格子裡的一格：首欄不寫「+」，係數 0 也寫出來（0x^2、0x、0）
function pyCell(c, d, first) {
  const body = c === 0 ? (d === 0 ? '0' : '0' + (d === 1 ? 'x' : 'x^' + d)) : pyBody(Math.abs(c), d);
  if (first) return (c < 0 ? '-' : '') + body;
  return (c < 0 ? '- ' : '+ ') + body;
}

// 當成因數寫進算式時，負的單項式、或含加減的多項式要加括號
function par(s) {
  const t = String(s);
  if (t.charAt(0) === '-' || /\s[+-]\s/.test(t)) return '(' + t + ')';
  return t;
}

// 數字當因數時，負數加括號
function pn(v) {
  return v < 0 ? '(' + v + ')' : String(v);
}

// 「x² 項」「常數項」這類標籤的 qlInk 字串
function pyTermName(d) {
  return d === 0 ? '常數項' : PY_VAR[d] + ' 項';
}

function pyKindName(d) {
  if (d < 0) return '0';
  if (d === 0) return '常數';
  return PY_CN[d] + '次式';
}

/* --------------------------------------------------------------------------
   分數係數：{ n, d }，d 恆為正、已約分。除法會產生分數係數（課本例 7）。
   -------------------------------------------------------------------------- */
function rq(n, d) {
  if (d === undefined) d = 1;
  if (d < 0) { n = -n; d = -d; }
  if (n === 0) return { n: 0, d: 1 };
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

const RQ0 = rq(0);

function rqAdd(a, b) { return rq(a.n * b.d + b.n * a.d, a.d * b.d); }
function rqSub(a, b) { return rq(a.n * b.d - b.n * a.d, a.d * b.d); }
function rqMul(a, b) { return rq(a.n * b.n, a.d * b.d); }
function rqDiv(a, b) { return rq(a.n * b.d, a.d * b.n); }

function rqTex(c) {
  const n = Math.abs(c.n);
  const body = c.d === 1 ? String(n) : `\\frac{${n}}{${c.d}}`;
  return (c.n < 0 ? '-' : '') + body;
}

// 整數陣列 → 分數係數陣列
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

/**
 * 在畫布上畫一個長除法直式。欄位依次數對齊：商的 x 項寫在被除式 x 項的正上方。
 * cfg：{ top, rowH, colL, colR, size, col: { P, D, Q, R, prod }, labels }
 * shown：已經做完的步數（0 = 只寫出題目）
 */
function drawLongDiv(ctx, P, D, L, shown, cfg) {
  const degP = rpDeg(P);
  const nCol = degP + 1;
  const cw = (cfg.colR - cfg.colL) / nCol;
  const cx = deg => cfg.colL + cw * (degP - deg + 0.5);
  const size = cfg.size || 19;
  // 有分數係數時直式分數比一列高，列距要拉開，上下兩列的分數才不會疊在一起
  const hasFrac = P.concat(D).some(c => c && c.d !== 1)
    || L.steps.some(s => s.t.d !== 1 || s.prod.concat(s.rem).some(c => c && c.d !== 1));
  const rowH = hasFrac ? Math.max(cfg.rowH, 50) : cfg.rowH;
  const yQ = cfg.top, yP = cfg.top + rowH;
  const col = cfg.col;

  // 一列多項式：從 hi 次寫到 lo 次；領頭的 0 略過，夾在中間的 0 用暗色寫出來
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

  // 進行中的那一步打底
  if (shown > 0 && cfg.highlight !== false) {
    const i = shown - 1;
    const y1 = yP + rowH * (2 * i + 1) - rowH / 2 + 2;
    drawPanel(ctx, 12, y1, cfg.colR - 4, rowH * 2 - 4, col.Q, 0.07);
  }

  // 除式與除號
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

  // 被除式（缺項補 0，暗色）
  row(P, degP, 0, yP, col.P);

  // 商式：做完幾步就寫出幾項
  let qFirst = true;
  for (let i = 0; i < shown; i++) {
    const s = L.steps[i];
    drawExpr(ctx, [rTermItem(s.t, s.k, qFirst, col.Q, true)], cx(s.k), yQ, size, col.Q, { maxW: cw - 4 });
    qFirst = false;
  }

  // 除式最低的非零次數：除式是 kx 這種單項式時，乘回去的列不必在尾巴補 0
  let lowD = 0;
  while (lowD < D.length && (!D[lowD] || D[lowD].n === 0)) lowD++;

  let yLast = yP;
  for (let i = 0; i < shown; i++) {
    const s = L.steps[i];
    const yPr = yP + rowH * (2 * i + 1);
    const yRm = yPr + rowH;
    row(s.prod, s.top, s.k + lowD, yPr, col.prod);
    qlLine(ctx, cx(s.top) - cw / 2 + 4, yPr + rowH / 2, cfg.colR, yPr + rowH / 2, INK, 1.6);
    const isLast = (i === L.steps.length - 1);
    row(s.rem, s.top - 1, 0, yRm, isLast ? col.R : col.P);
    if (cfg.labels !== false) {
      drawExpr(ctx, [rTermItem(s.t, s.k, true, MUTED), T(' × 除式', MUTED)], 0, yPr, 13, MUTED,
        { left: 18, maxW: cfg.colL - 40, gap: 2 });
      textLeft(ctx, '上減下', 18, yRm, MUTED, f(700, 13));
    }
    yLast = yRm;
  }
  return { yLast, cx, cw, rowH };
}

/* ==========================================================================
   Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第三冊 1-3 的 26 題正解
  // 正解字母分布：A 7 題、B 7 題、C 6 題、D 6 題（開發約束 36）
  const answers = {
    '1-3-1': 'C',    // (−6x)·7x² = −42x³
    '1-3-2': 'A',    // 8x·x² = 8x³
    '1-3-3': 'B',    // −5x(6x² − 2x + 7) = −30x³ + 10x² − 35x
    '1-3-4': 'D',    // (7x − 8)(−3x) = −21x² + 24x
    '1-3-5': 'A',    // (3x − 7)(−2x + 6) = −6x² + 32x − 42
    '1-3-6': 'C',    // (x² − 6x + 7)(4x − 1) 的 x² 項係數 −25
    '1-3-7': 'B',    // (4x² − 3)(−x + 2) = −4x³ + 8x² + 3x − 6
    '1-3-8': 'D',    // (6x² + 5)(x − 8) 的 x 項係數 5
    '1-3-9': 'C',    // (7x − 3)² = 49x² − 42x + 9
    '1-3-10': 'A',   // (4x − 9)² = (9 − 4x)²
    '1-3-11': 'D',   // (−28x³) ÷ 7x = −4x²
    '1-3-12': 'B',   // 20x² ÷ (−15x²) = −4/3
    '1-3-13': 'A',   // (18x² + 12x − 7) ÷ 6x：商 3x + 2、餘 −7
    '1-3-14': 'C',   // (10x² + 7x) ÷ 5x² 的餘式 7x
    '1-3-15': 'B',   // (2x² + 9x − 4) ÷ (x + 4)：商 2x + 1、餘 −8
    '1-3-16': 'D',   // 6x² + 7x + m 被 2x + 3 整除 ⇒ m = −3
    '1-3-17': 'A',   // (10x² − 3x + 7) ÷ (2x² + x − 1)：商 5、餘 −8x + 12
    '1-3-18': 'D',   // 除以二次式，餘式不可能是二次式
    '1-3-19': 'C',   // A = (2x² + 3)(x − 7) − 7
    '1-3-20': 'B',   // (F + G) ÷ G：商 Q + 1、餘 R
    '1-3-21': 'A',   // B = (P − R) ÷ Q = 4x − 3
    '1-3-22': 'C',   // B = [(6x² + 5x − 1) − (x + 5)] ÷ 2 = 3x² + 2x − 3
    '1-3-23': 'B',   // (x + 5)² − 2(x + 3)(x − 1) = −x² + 6x + 31
    '1-3-24': 'B',   // 第 ② 步減號後沒有每一項變號
    '1-3-25': 'A',   // 13x² + 9x + 2
    '1-3-26': 'D'    // 梯形的高 x + 3
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
   重點 1：單項式乘法——係數一組、x 一組
   ========================================================================== */
// n 個 x 用「·」連起來的元件
function xChain(n, color) {
  const items = [];
  for (let i = 0; i < n; i++) {
    if (i) items.push(T('·', color));
    items.push(IT('x', color));
  }
  return items;
}

function initMonoCanvas() {
  const cv = elById('canvas-mono');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('mo-a'), sm = elById('mo-m'), sb = elById('mo-b'), sn = elById('mo-n');
  const va = elById('mo-va'), vm = elById('mo-vm'), vb = elById('mo-vb'), vn = elById('mo-vn');
  const rowB = elById('mo-row-b'), rowN = elById('mo-row-n');
  const mG = elById('mo-mode-group');
  const out = elById('mo-formula');
  const fb = elById('mo-feedback');
  const C = QL_TONE[0];
  const CA = QL_ROSE, CB = QL_TEAL;
  let mode = 'mul';
  nzSlider(sa);
  nzSlider(sb);

  function draw() {
    const a = iv(sa), m = iv(sm);
    let b = iv(sb), n = iv(sn);
    va.textContent = a; vm.textContent = m; vb.textContent = b; vn.textContent = n;
    const sq = (mode === 'sq');
    rowB.style.display = sq ? 'none' : '';
    rowN.style.display = sq ? 'none' : '';
    if (sq) { b = a; n = m; }
    const A = pyMono(a, m), B = pyMono(b, n);
    const ab = a * b, dd = m + n;
    const prod = pyMono(ab, dd);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, sq ? '單項式的平方：自己乘自己' : '單項式乘法：係數一組、x 一組', C);

    const headItems = sq
      ? [PW(qlInk(A, QL_CREAM), 2, true, QL_CREAM)]
      : [GRP([qlInk(A, CA)], '()', CA), T('·', QL_CREAM), GRP([qlInk(B, CB)], '()', CB)];
    drawEqPanel(ctx, headItems.concat([T('=', QL_CREAM), T('?', C)]), 84, C, { h: 32, size: 28 });

    const coefA = T(pn(a).replace("-", "−"), CA), coefB = T(pn(b).replace("-", "−"), sq ? CA : CB);
    const xsA = xChain(m, CA), xsB = xChain(n, sq ? CA : CB);
    const rows = [];
    if (sq) {
      rows.push({ name: '① 平方', hint: '就是自己乘自己',
        items: [GRP([qlInk(A, CA)], '()', CA), T('·', INK), GRP([qlInk(A, CA)], '()', CA)] });
    } else {
      rows.push({ name: '① 拆開', hint: '每個 x 都寫出來',
        items: [SEQ([coefA, T('·', INK)].concat(xsA, [T('·', INK), coefB, T('·', INK)], xsB), INK, 3)] });
    }
    rows.push({ name: '② 分兩組', hint: '係數一組、x 一組',
      items: [GRP([SEQ([T(pn(a).replace("-", "−"), CA), T('·', INK), T(pn(b).replace("-", "−"), sq ? CA : CB)], INK, 3)], '()', INK),
        T('·', INK),
        GRP([SEQ(xsA.concat([T('·', INK)], xsB), INK, 3)], '()', INK)] });
    rows.push({ name: '③ 各自算', hint: '係數相乘、次數相加',
      items: [T(String(ab).replace('-', '−'), C), T('·', INK), PW(IT('x', C), `${m}+${n}`, false, C)] });
    rows.push({ name: '④ 結果', hint: '係數寫在前面', items: [qlInk(prod, C)], color: C });
    drawStepRows(ctx, rows, 4, { top: 156, gap: 56, labX: 22, eqX: 150, size: 21, color: C });

    // x 的個數
    const total = m + n;
    const bw = 30, bg = 6;
    const x0 = 270 - (total * bw + (total - 1) * bg) / 2;
    for (let i = 0; i < total; i++) {
      const colr = i < m ? CA : (sq ? CA : CB);
      qlPatch(ctx, x0 + i * (bw + bg), 352, bw, bw, colr, { alpha: 0.22, stitch: false });
      textCenter(ctx, 'x', x0 + i * (bw + bg) + bw / 2, 367, colr, fi(700, 18));
    }
    textCenter(ctx, `x 一共乘了 ${m} + ${n} = ${total} 次，所以是 x 的 ${total} 次方`, 270, 404, INK, f(700, 14));

    // 常見錯法：真的算一次，跟正確答案相同時就不列
    const wrongs = [];
    if (sq) {
      if (a !== ab) wrongs.push(`係數沒有平方：寫成 ${pyMono(a, 2 * m)}`);
      if (a < 0) wrongs.push(`負號沒有一起平方：寫成 ${pyMono(-ab, 2 * m)}`);
    } else {
      if (a + b !== ab) wrongs.push(`係數相加：寫成 ${pyMono(a + b, dd)}`);
      if (m * n !== m + n) wrongs.push(`次數相乘：寫成 ${pyMono(ab, m * n)}`);
    }
    if (wrongs.length) {
      wrongs.forEach((w, i) => drawExpr(ctx, [qlInk('別' + w, MUTED)], 270, 436 + i * 26, 14, MUTED, { maxW: 500 }));
    } else {
      drawExpr(ctx, [qlInk('這一組剛好不容易錯，換一組數字看看常見的錯法', MUTED)], 270, 444, 14, MUTED, { maxW: 500 });
    }

    const texHead = sq ? `(${A})^2` : `${par(A)} \\cdot ${par(B)}`;
    out.innerHTML = wbrEq(`${texHead} = ${prod}`);
    fb.innerHTML = wrapFeedback(sq
      ? `\\((${A})^2 = (${A})(${A})\\)：係數 \\(${pn(a)} \\times ${pn(a)} = ${ab}\\)，次數 \\(${m} + ${m} = ${dd}\\)。`
      : `係數 \\(${pn(a)} \\times ${pn(b)} = ${ab}\\)，次數 \\(${m} + ${n} = ${dd}\\)，乘積是 <b style="color:${C}">\\(${prod}\\)</b>。`);
    typeset([out, fb]);
  }

  [sa, sm, sb, sn].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-mo-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：分配律射線——單項式要乘到括號裡的每一項
   ========================================================================== */
function initDistCanvas() {
  const cv = elById('canvas-dist');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = elById('di-k');
  const S = [0, 1, 2].map(d => elById('di-p' + d));
  const vk = elById('di-vk');
  const V = [0, 1, 2].map(d => elById('di-v' + d));
  const mG = elById('di-mode-group');
  const out = elById('di-formula');
  const fb = elById('di-feedback');
  const C = QL_TONE[1];
  let mode = 'ok';
  nzSlider(sk);

  function draw() {
    const k = iv(sk);
    const P = S.map(s => iv(s));
    vk.textContent = k;
    V.forEach((el, d) => { el.textContent = P[d]; });
    const M = pyMono(k, 1);
    const terms = pyList(P);
    const head = `${M}(${pyStr(P)})`;
    const prods = terms.map(([c, d]) => [k * c, d + 1]);
    const result = pyJoin(prods);
    const first = (mode === 'first');

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, first ? '錯誤示範：只乘了第一項' : '分配律：單項式要乘到每一項', C);
    drawEqPanel(ctx, [qlInk(head, QL_CREAM)], 80, C, { h: 30, size: 26 });

    if (!terms.length) {
      textCenter(ctx, '括號裡是 0，乘積也是 0', 270, 250, MUTED, f(800, 17));
      out.innerHTML = `\\(${head} = 0\\)`;
      fb.innerHTML = wrapFeedback('把括號裡的係數調成不是 \\(0\\)，再看分配律怎麼作用。');
      typeset([out, fb]);
      return;
    }

    const yMid = 150 + (terms.length - 1) * 32;
    drawPanel(ctx, 24, yMid - 24, 96, 48, QL_MUSTARD, 0.12);
    drawExpr(ctx, [qlInk(M, QL_MUSTARD)], 72, yMid, 24, QL_MUSTARD);

    terms.forEach(([c, d], i) => {
      const y = 150 + i * 64;
      const missed = first && i > 0;
      const lineCol = missed ? NO_COLOR : C;
      ctx.save();
      ctx.globalAlpha = missed ? 0.45 : 1;
      if (missed) {
        qlLine(ctx, 122, yMid, 186, y, lineCol, 2, [5, 5]);
      } else {
        drawArrow(ctx, 122, yMid, 184, y, lineCol, 2.4);
      }
      ctx.restore();
      const tStr = pyMono(c, d);
      drawPanel(ctx, 190, y - 22, 96, 44, PY_DEG_COL[d], 0.10);
      drawExpr(ctx, [qlInk(tStr, PY_DEG_COL[d])], 238, y, 21, PY_DEG_COL[d], { maxW: 88 });
      if (missed) {
        drawExpr(ctx, [qlInk(`沒有乘，照抄 ${tStr}`, NO_COLOR)], 0, y, 17, NO_COLOR, { left: 300, maxW: 226 });
      } else {
        const s = `${par(M)}·${par(tStr)} = ${pyMono(k * c, d + 1)}`;
        drawExpr(ctx, [qlInk(s, INK)], 0, y, 18, INK, { left: 300, maxW: 226 });
      }
    });

    if (first) {
      const wrong = pyJoin([prods[0]].concat(terms.slice(1)));
      textLeft(ctx, '錯的結果', 24, 362, NO_COLOR, f(800, 14));
      drawExpr(ctx, [qlInk(wrong, NO_COLOR)], 0, 362, 20, NO_COLOR, { left: 120, maxW: 400 });
      textLeft(ctx, '正確結果', 24, 404, OK_COLOR, f(800, 14));
      drawExpr(ctx, [qlInk(result, OK_COLOR)], 0, 404, 20, OK_COLOR, { left: 120, maxW: 400 });
      textCenter(ctx, terms.length === 1
        ? '括號裡只有一項，這一組看不出差別；多調出幾項再比一比'
        : '括號裡的每一項都要乘到，連同正負號', 270, 452, INK, f(700, 14));
    } else {
      textLeft(ctx, '全部相加', 24, 372, C, f(800, 14));
      drawEqPanel(ctx, [qlInk(`${head} = ${result}`, C)], 410, C, { h: 26, size: 21 });
      textCenter(ctx, `括號裡有 ${terms.length} 項，就要乘 ${terms.length} 次`, 270, 458, MUTED, f(700, 14));
    }

    out.innerHTML = wbrEq(`${head} = ${result}`);
    fb.innerHTML = wrapFeedback(first && terms.length > 1
      ? `只乘第一項會得到 \\(${pyJoin([prods[0]].concat(terms.slice(1)))}\\)，後面幾項都漏乘了。`
      : `\\(${par(M)}\\) 乘到括號裡的每一項，結果是 <b style="color:${C}">\\(${result}\\)</b>。`);
    typeset([out, fb]);
  }

  [sk].concat(S).forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-di-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：乘法格子——每一項乘每一項，同顏色的合併
   ========================================================================== */
function initGridCanvas() {
  const cv = elById('canvas-grid');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa1 = elById('gr-a1'), sa0 = elById('gr-a0');
  const sb2 = elById('gr-b2'), sb1 = elById('gr-b1'), sb0 = elById('gr-b0');
  const vals = ['a1', 'a0', 'b2', 'b1', 'b0'].map(k => elById('gr-v' + k));
  const rowB2 = elById('gr-row-b2');
  const mG = elById('gr-mode-group');
  const out = elById('gr-formula');
  const fb = elById('gr-feedback');
  const C = QL_TONE[2];
  let mode = 'quad';
  nzSlider(sa1);
  nzSlider(sb2);

  function draw() {
    const quad = (mode === 'quad');
    rowB2.style.display = quad ? '' : 'none';
    const a1 = iv(sa1), a0 = iv(sa0), b2 = quad ? iv(sb2) : 0, b1 = iv(sb1), b0 = iv(sb0);
    [a1, a0, iv(sb2), b1, b0].forEach((v, i) => { vals[i].textContent = v; });
    const A = [a0, a1], B = quad ? [b0, b1, b2] : [b0, b1];
    const R = pyMul(A, B);
    const sA = pyStr(A), sB = pyStr(B);
    const head = `(${sA})(${sB})`;
    const rowDeg = [1, 0];
    const colDeg = quad ? [2, 1, 0] : [1, 0];

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '乘法格子：每一項乘每一項', C);

    const gx = 120, gy = 50, hh = 38, rh = 54;
    const cw = (520 - gx) / colDeg.length;
    textCenter(ctx, '×', gx - 40, gy + hh / 2, MUTED, f(800, 20));
    colDeg.forEach((d, j) => {
      const c = B[d];
      drawExpr(ctx, [qlInk(pyCell(c, d, j === 0), c === 0 ? DIM : QL_CREAM)], gx + cw * (j + 0.5), gy + hh / 2, 19, QL_CREAM, { maxW: cw - 8 });
    });
    rowDeg.forEach((d, i) => {
      const c = A[d];
      drawExpr(ctx, [qlInk(pyCell(c, d, i === 0), c === 0 ? DIM : QL_CREAM)], gx - 40, gy + hh + rh * (i + 0.5), 19, QL_CREAM, { maxW: 70 });
      colDeg.forEach((e, j) => {
        const v = c * B[e];
        const deg = d + e;
        const x = gx + cw * j, y = gy + hh + rh * i;
        qlPatch(ctx, x + 3, y + 3, cw - 6, rh - 6, v === 0 ? DIM : PY_DEG_COL[deg], { alpha: v === 0 ? 0.05 : 0.16, stitch: false });
        drawExpr(ctx, [qlInk(pyCell(v, deg, true), v === 0 ? DIM : PY_DEG_COL[deg])], x + cw / 2, y + rh / 2, 19, INK, { maxW: cw - 12 });
      });
    });

    // 依次數合併：同顏色的格子加在一起
    const dTop = 1 + colDeg[0];
    let y = 228;
    let cells = 0;
    for (let deg = dTop; deg >= 0; deg--) {
      const parts = [];
      rowDeg.forEach(d => colDeg.forEach(e => {
        if (d + e === deg && A[d] * B[e] !== 0) parts.push(A[d] * B[e]);
      }));
      cells += parts.length;
      if (!parts.length) continue;
      const sum = parts.reduce((s, v) => s + v, 0);
      const lhs = parts.map(v => par(pyMono(v, deg))).join(' + ');
      const s = parts.length > 1 ? `${lhs} = ${pyMono(sum, deg)}` : lhs;
      drawExpr(ctx, [qlInk(pyTermName(deg), PY_DEG_COL[deg])], 0, y, 15, PY_DEG_COL[deg], { left: 30 });
      drawExpr(ctx, [qlInk(s, INK)], 0, y, 17, INK, { left: 110, maxW: 410 });
      y += 30;
    }

    drawEqPanel(ctx, [qlInk(`${head} = ${pyStr(R)}`, C)], 382, C, { h: 26, size: 21 });

    const dA = pyDeg(A), dB = pyDeg(B), dR = pyDeg(R);
    let note;
    if (dB < 0) note = '第二個多項式是 0，乘積也是 0';
    else note = `${pyKindName(dA)} × ${pyKindName(dB)} → ${pyKindName(dR)}：次數 ${dA} + ${dB} = ${dR}`;
    textCenter(ctx, note, 270, 432, INK, f(800, 15));
    const nTerms = pyList(R).length;
    textCenter(ctx, `乘開有 ${cells} 項，合併同類項後剩 ${nTerms} 項`, 270, 462, MUTED, f(700, 13.5));

    out.innerHTML = wbrEq(`${head} = ${pyStr(R)}`);
    fb.innerHTML = wrapFeedback(`格子裡<b style="color:${C}">同顏色的是同類項</b>（次數相同），把它們加起來就合併完成。`);
    typeset([out, fb]);
  }

  [sa1, sa0, sb2, sb1, sb0].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-gr-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：直式乘法台——同類項對齊，缺項補 0
   ========================================================================== */
const VM_SETS = {
  p1: { A: [-2, 0, 3], B: [5, 2] },       // (3x² − 2)(2x + 5)
  p2: { A: [-3, 4, 1], B: [-1, 2] },      // (x² + 4x − 3)(2x − 1)
  p3: { A: [0, 1, 4], B: [3, -1] },       // (4x² + x)(−x + 3)
  p4: { A: [-6, 0, 1], B: [-3, 2] }       // (x² − 6)(2x − 3)
};

function initVmulCanvas() {
  const cv = elById('canvas-vmul');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const pG = elById('vm-p-group');
  const methG = elById('vm-m-group');
  const padG = elById('vm-pad-group');
  const out = elById('vm-formula');
  const fb = elById('vm-feedback');
  const C = QL_TONE[3];
  let set = 'p1', meth = 'high', pad = 'pad';

  const L = 110, Rr = 520, NC = 4;
  const cw = (Rr - L) / NC;
  const colX = c => L + cw * (NC - 1 - c + 0.5);   // c = 0 是最右邊（常數欄）

  function draw() {
    const { A, B } = VM_SETS[set];
    const R = pyMul(A, B);
    const dA = pyDeg(A);
    const bTerms = pyList(B);                       // 由高次到低次
    const order = meth === 'high' ? bTerms : bTerms.slice().reverse();
    const head = `(${pyStr(A)})(${pyStr(B)})`;
    const padOn = (pad === 'pad');

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, padOn ? '直式乘法：同類項上下對齊' : '不補 0、直接靠右排會怎樣？', C);

    for (let c = 0; c < NC; c++) {
      drawExpr(ctx, [qlInk(pyTermName(c), padOn ? PY_DEG_COL[c] : DIM)], colX(c), 60, 13.5, MUTED);
    }

    // 要放進格子的項：{ c, d, col }
    function placed(p, minDeg, shiftRank) {
      const items = [];
      if (padOn) {
        for (let d = pyDeg(p); d >= minDeg; d--) items.push({ c: p[d] || 0, d, col: d });
      } else {
        const ts = pyList(p);
        ts.forEach(([c, d], i) => items.push({ c, d, col: shiftRank + ts.length - 1 - i }));
      }
      return items;
    }
    function drawRow(items, y, color, opts) {
      const o = opts || {};
      items.forEach((it, i) => {
        const col = it.c === 0 ? DIM : (o.bad && o.bad[it.col] ? NO_COLOR : color);
        drawExpr(ctx, [qlInk(pyCell(it.c, it.d, i === 0), col)], colX(it.col), y, 18, col, { maxW: cw - 4 });
        if (it.c === 0 && o.tag) textCenter(ctx, '補 0', colX(it.col), y + 19, QL_ROSE, f(700, 11));
      });
    }

    const yA = 96, yB = 136, yL1 = 158;
    drawRow(placed(A, 0, 0), yA, QL_CREAM, { tag: true });
    drawRow(placed(B, 0, 0), yB, QL_CREAM, { tag: true });
    textCenter(ctx, '×)', 70, yB, INK, f(800, 18));
    qlLine(ctx, 50, yL1, 522, yL1, INK, 2);

    // 部分積：A 乘上 B 的每一項
    const rowsPl = [];
    order.forEach(([bc, bd]) => {
      const part = [];
      for (let i = 0; i < bd; i++) part.push(0);
      A.forEach(v => part.push(v * bc));
      const rank = pyList(B).length - 1 - bTerms.findIndex(t => t[1] === bd);
      rowsPl.push({ bc, bd, items: placed(part, bd, rank) });
    });

    // 不補 0 時，檢查每一欄是不是同類項
    const colMap = {};
    rowsPl.forEach(r => r.items.forEach(it => {
      if (it.c === 0) return;
      (colMap[it.col] = colMap[it.col] || []).push(it);
    }));
    const bad = {};
    Object.keys(colMap).forEach(k => {
      const ds = colMap[k].map(it => it.d);
      if (ds.some(d => d !== ds[0])) bad[k] = true;
    });

    const yP0 = 186, rG = 38;
    rowsPl.forEach((r, i) => {
      const y = yP0 + i * rG;
      drawRow(r.items, y, QL_CREAM, { bad: padOn ? null : bad });
      drawExpr(ctx, [qlInk(`× ${par(pyMono(r.bc, r.bd))}`, MUTED)], 0, y, 14, MUTED, { left: 14, maxW: 80 });
    });
    const yL2 = yP0 + rowsPl.length * rG - 16;
    qlLine(ctx, 50, yL2, 522, yL2, INK, 2);
    const yS = yL2 + 28;

    let badCount = Object.keys(bad).length;
    if (padOn) {
      let firstDone = false;
      for (let d = 3; d >= 0; d--) {
        const v = R[d] || 0;
        if (v === 0) continue;
        drawExpr(ctx, [qlInk(pyCell(v, d, !firstDone), C)], colX(d), yS, 20, C, { maxW: cw - 4 });
        firstDone = true;
      }
    } else {
      Object.keys(colMap).sort((a, b) => b - a).forEach((k, i) => {
        if (bad[k]) {
          textCenter(ctx, '?', colX(+k), yS, NO_COLOR, f(800, 22));
          return;
        }
        const s = colMap[k].reduce((t, it) => t + it.c, 0);
        drawExpr(ctx, [qlInk(pyCell(s, colMap[k][0].d, i === 0), s === 0 ? DIM : C)], colX(+k), yS, 20, C, { maxW: cw - 4 });
      });
    }

    textLeft(ctx, '橫式驗算', 22, 334, C, f(800, 14));
    drawExpr(ctx, [qlInk(`${head} = ${pyStr(R)}`, INK)], 0, 334, 17, INK, { left: 110, maxW: 412 });
    const mStr = order.map(t => par(pyMono(t[0], t[1]))).join('，再乘 ');
    textLeft(ctx, '順序', 22, 374, C, f(800, 14));
    drawExpr(ctx, [qlInk(`${meth === 'high' ? '由最高次項開始' : '由常數項開始'}：先乘 ${mStr}`, INK)], 0, 374, 15, INK, { left: 110, maxW: 412 });

    let note;
    if (padOn) note = '每一列都對齊次數，同類項在同一欄，逐欄相加';
    else if (badCount) note = `有 ${badCount} 欄上下的次數不同，擠在一起加不下去`;
    else note = '這一題沒有缺項，不補 0 也對得齊';
    textCenter(ctx, note, 270, 420, padOn ? INK : (badCount ? NO_COLOR : QL_MUSTARD), f(800, 15));
    textCenter(ctx, '兩種順序算出來一樣；缺項的位置補 0（或留空位）', 270, 456, MUTED, f(700, 13.5));

    out.innerHTML = wbrEq(`${head} = ${pyStr(R)}`);
    fb.innerHTML = wrapFeedback(padOn
      ? `被乘式寫成 \\(${placed(A, 0, 0).map((it, i) => pyCell(it.c, it.d, i === 0)).join(' ')}\\)，缺項補 \\(0\\)，乘出來的每一列才會對齊。`
      : (badCount
        ? `沒有補 \\(0\\)，有 <b style="color:${NO_COLOR}">${badCount} 欄</b>放了不同次數的項，加不下去。`
        : '這一題被乘式沒有缺項，所以靠右排也剛好對齊；換有缺項的題目比較看看。'));
    typeset([out, fb]);
  }

  bindPickGroup(pG, 'data-vm-p', v => { set = v; draw(); });
  bindPickGroup(methG, 'data-vm-m', v => { meth = v; draw(); });
  bindPickGroup(padG, 'data-vm-pad', v => { pad = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：公式代換機——把 px 看成 a、q 看成 b
   ========================================================================== */
function initFormulaCanvas() {
  const cv = elById('canvas-formula');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = elById('fm-p'), sq = elById('fm-q');
  const vp = elById('fm-vp'), vq = elById('fm-vq');
  const fG = elById('fm-f-group');
  const out = elById('fm-formula');
  const fb = elById('fm-feedback');
  const C = QL_TONE[4];
  const CA = QL_ROSE, CB = QL_TEAL;
  let type = 'sum';

  function draw() {
    const p = iv(sp), q = iv(sq);
    vp.textContent = p; vq.textContent = q;
    const a = pyMono(p, 1), b = String(q);
    const pp = p * p, pq2 = 2 * p * q, qq = q * q;
    let head, general, sub, mid, res, title, aFirst = true;
    if (type === 'sum') {
      title = '和的平方公式';
      general = '(a + b)^2 = a^2 + 2ab + b^2';
      head = `(${a} + ${b})^2`;
      sub = [PW(GRP([qlInk(a, CA)], '()', CA), 2, false, CA), T('+', INK), T('2·', INK), GRP([qlInk(a, CA)], '()', CA), T('·', INK), T(b, CB), T('+', INK), PW(T(b, CB), 2, false, CB)];
      mid = `${pp}x^2 + ${pq2}x + ${qq}`;
      res = pyJoin([[pp, 2], [pq2, 1], [qq, 0]]);
    } else if (type === 'diff') {
      title = '差的平方公式';
      general = '(a - b)^2 = a^2 - 2ab + b^2';
      head = `(${a} - ${b})^2`;
      sub = [PW(GRP([qlInk(a, CA)], '()', CA), 2, false, CA), T('−', INK), T('2·', INK), GRP([qlInk(a, CA)], '()', CA), T('·', INK), T(b, CB), T('+', INK), PW(T(b, CB), 2, false, CB)];
      mid = `${pp}x^2 - ${pq2}x + ${qq}`;
      res = pyJoin([[pp, 2], [-pq2, 1], [qq, 0]]);
    } else if (type === 'rev') {
      title = '差的平方公式（數字在前）';
      general = '(a - b)^2 = a^2 - 2ab + b^2';
      head = `(${b} - ${a})^2`;
      aFirst = false;
      sub = [PW(T(b, CB), 2, false, CB), T('−', INK), T('2·', INK), T(b, CB), T('·', INK), GRP([qlInk(a, CA)], '()', CA), T('+', INK), PW(GRP([qlInk(a, CA)], '()', CA), 2, false, CA)];
      mid = `${qq} - ${pq2}x + ${pp}x^2`;
      res = pyJoin([[pp, 2], [-pq2, 1], [qq, 0]]);
    } else {
      title = '平方差公式';
      general = '(a + b)(a - b) = a^2 - b^2';
      head = `(${a} + ${b})(${a} - ${b})`;
      sub = [PW(GRP([qlInk(a, CA)], '()', CA), 2, false, CA), T('−', INK), PW(T(b, CB), 2, false, CB)];
      mid = `${pp}x^2 - ${qq}`;
      res = pyJoin([[pp, 2], [-qq, 0]]);
    }

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '公式代換機：' + title, C);
    drawExpr(ctx, [qlInk(general, MUTED)], 270, 62, 18, MUTED);

    // a、b 各是什麼
    drawPanel(ctx, 70, 86, 180, 40, CA, 0.12);
    drawExpr(ctx, [T('a', CA), T('=', INK), qlInk(a, CA)], 160, 106, 21, CA);
    drawPanel(ctx, 290, 86, 180, 40, CB, 0.12);
    drawExpr(ctx, [T('b', CB), T('=', INK), T(b, CB)], 380, 106, 21, CB);

    const rows = [
      { name: '① 原式', hint: aFirst ? '先找出 a 和 b' : '數字在前也一樣是 a − b 的形式', items: [qlInk(head, INK)] },
      { name: '② 代進公式', hint: '整個 a 要加括號再平方', items: sub },
      { name: '③ 逐項計算', hint: aFirst ? '(px)² 是 p² 乘 x²' : '照原本的順序算出每一項', items: [qlInk(mid, INK)] },
      { name: '④ 降冪排列', hint: '答案習慣寫成降冪', items: [qlInk(res, C)], color: C }
    ];
    drawStepRows(ctx, rows, 4, { top: 160, gap: 54, labX: 22, eqX: 170, size: 20, color: C });

    // 常見錯法：真的算一次，跟正確答案相同的不列
    const wrongs = [];
    if (type === 'sum' || type === 'diff') {
      const s = type === 'sum' ? 1 : -1;
      wrongs.push(`漏了中間項：${pyJoin([[pp, 2], [qq, 0]])}`);
      if (p !== pp) wrongs.push(`係數沒有平方：${pyJoin([[p, 2], [s * pq2, 1], [qq, 0]])}`);
      wrongs.push(`中間項沒乘 2：${pyJoin([[pp, 2], [s * p * q, 1], [qq, 0]])}`);
    } else if (type === 'rev') {
      wrongs.push(`和 (${a} - ${b})^2 相等：差一個負號，平方之後就一樣`);
      if (p !== pp) wrongs.push(`係數沒有平方：${pyJoin([[p, 2], [-pq2, 1], [qq, 0]])}`);
    } else {
      wrongs.push(`不是 ${pyJoin([[pp, 2], [qq, 0]])}：中間的 x 項一正一負剛好抵消，常數是負的`);
      if (p !== pp) wrongs.push(`係數沒有平方：${pyJoin([[p, 2], [-qq, 0]])}`);
    }
    textLeft(ctx, type === 'rev' ? '注意' : '別寫成', 22, 392, NO_COLOR, f(800, 14));
    wrongs.slice(0, 3).forEach((w, i) => {
      drawExpr(ctx, [qlInk(w, MUTED)], 0, 392 + i * 28, 15, MUTED, { left: 100, maxW: 424 });
    });

    out.innerHTML = wbrEq(`${head} = ${res}`);
    fb.innerHTML = wrapFeedback(`把 \\(${a}\\) 看成 \\(a\\)、\\(${b}\\) 看成 \\(b\\)，代進公式得 <b style="color:${C}">\\(${res}\\)</b>。`);
    typeset([out, fb]);
  }

  [sp, sq].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(fG, 'data-fm-f', v => { type = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：單項式除法——寫成分數，約掉相同的 x
   ========================================================================== */
function initMdivCanvas() {
  const cv = elById('canvas-mdiv');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('md-a'), sm = elById('md-m'), sb = elById('md-b'), sn = elById('md-n');
  const va = elById('md-va'), vm = elById('md-vm'), vb = elById('md-vb'), vn = elById('md-vn');
  const out = elById('md-formula');
  const fb = elById('md-feedback');
  const C = QL_TONE[5];
  nzSlider(sa);
  nzSlider(sb);

  // 一排 token：係數、·、x、·、x…；回傳每個 token 的位置，方便畫刪除線
  function tokens(coef, nx, color) {
    const tk = [{ s: String(coef).replace('-', '−'), it: false }];
    for (let i = 0; i < nx; i++) { tk.push({ s: '·', it: false }); tk.push({ s: 'x', it: true, xi: i }); }
    return tk;
  }
  function layout(tk, size) {
    let w = 0;
    tk.forEach((t, i) => {
      ctx.font = t.it ? fi(700, size) : f(700, size);
      t.w = ctx.measureText(t.s).width;
      if (i) w += 5;
      t.x = w;
      w += t.w;
    });
    return w;
  }
  function drawTokens(tk, x0, y, size, color, cut) {
    tk.forEach(t => {
      ctx.font = t.it ? fi(700, size) : f(700, size);
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.s, x0 + t.x, y);
      if (t.it && t.xi < cut) {
        qlLine(ctx, x0 + t.x - 3, y + size * 0.42, x0 + t.x + t.w + 3, y - size * 0.42, QL_ROSE, 2.4);
      }
    });
  }

  function draw() {
    const a = iv(sa), m = iv(sm), b = iv(sb);
    sn.max = String(m);
    if (iv(sn) > m) sn.value = String(m);
    const n = iv(sn);
    va.textContent = a; vm.textContent = m; vb.textContent = b; vn.textContent = n;
    const r = rq(a, b);
    const e = m - n;
    const A = pyMono(a, m), B = pyMono(b, n);
    const resTex = rpTermTex(r, e, true);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '單項式除法：寫成分數，約掉相同的 x', C);

    const size = 26;
    const top = tokens(a, m), bot = tokens(b, n);
    const wt = layout(top, size), wb = layout(bot, size);
    const W = Math.max(wt, wb);
    const yBar = 116;
    drawPanel(ctx, 270 - W / 2 - 30, yBar - 62, W + 60, 124, C, 0.06);
    drawTokens(top, 270 - wt / 2, yBar - 28, size, QL_CREAM, n);
    drawTokens(bot, 270 - wb / 2, yBar + 28, size, QL_CREAM, n);
    qlLine(ctx, 270 - W / 2 - 10, yBar, 270 + W / 2 + 10, yBar, QL_CREAM, 2.4);
    textLeft(ctx, `上下各約掉 ${n} 個 x`, 270 + W / 2 + 40, yBar, QL_ROSE, f(800, 13.5));

    const coefItems = r.d === 1 ? [T(String(r.n).replace('-', '−'), C)]
      : [SEQ(r.n < 0 ? [T('−', C), FR(-r.n, r.d, C)] : [FR(r.n, r.d, C)], C, 1)];
    const xPart = e === 0 ? [T('1', C)] : [xPow(e, C)];
    const rows = [
      { name: '① 係數相除', hint: '可以約分就約分', items: [T(`${a} ÷ ${pn(b)}`.replace(/-/g, '−'), INK), T('=', INK)].concat(coefItems) },
      { name: '② x 相除', hint: '次數相減', items: [xPow(m, INK), T('÷', INK), xPow(n, INK), T('=', INK), e === 0 ? T('1', C) : PW(IT('x', C), `${m}−${n}`, false, C)] },
      { name: '③ 商', hint: '係數寫在前面', items: [rTermItem(r, e, true, C)], color: C },
      { name: '④ 驗算', hint: '商 × 除式 = 被除式',
        items: [GRP([rTermItem(r, e, true, OK_COLOR)], '()', OK_COLOR), T('·', INK), GRP([qlInk(B, INK)], '()', INK), T('=', INK), qlInk(A, OK_COLOR)] }
    ];
    drawStepRows(ctx, rows, 4, { top: 218, gap: 56, labX: 22, eqX: 160, size: 20, color: C });
    textCenter(ctx, e === 0 ? 'x 全部約掉了，商是一個常數' : '係數與 x 分開算：係數相除、x 的次數相減', 270, 454, MUTED, f(700, 14));

    out.innerHTML = wbrEq(`${A} \\div ${par(B)} = ${resTex}`);
    fb.innerHTML = wrapFeedback(`係數 \\(${a} \\div ${pn(b)} = ${rqTex(r)}\\)，次數 \\(${m} - ${n} = ${e}\\)，商是 <b style="color:${C}">\\(${resTex}\\)</b>。`);
    typeset([out, fb]);
  }

  [sa, sm, sb, sn].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7～9：長除法慢動作（共用一個步驟控制器）
   ========================================================================== */
const LD_COL = { P: QL_CREAM, D: QL_MUSTARD, Q: '#a5f3fc', R: QL_ROSE, prod: '#cbd5e1' };

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

// 重點 7：多項式 ÷ 單項式
function initLdiv1Canvas() {
  const cv = elById('canvas-ldiv1');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const S = [0, 1, 2].map(d => elById('d1-a' + d));
  const V = [0, 1, 2].map(d => elById('d1-v' + d));
  const sk = elById('d1-k'), vk = elById('d1-vk');
  const dG = elById('d1-deg-group');
  const out = elById('d1-formula');
  const fb = elById('d1-feedback');
  const C = QL_TONE[6];
  const st = { step: 99, deg: 1 };
  nzSlider(S[2]);
  nzSlider(sk);

  let L = null;
  function draw() {
    const a = S.map(s => iv(s));
    V.forEach((el, d) => { el.textContent = a[d]; });
    const k = iv(sk);
    vk.textContent = k;
    const P = rpOf(a);
    const D = rpOf(st.deg === 1 ? [0, k] : [0, 0, k]);
    L = rpLongDiv(P, D);
    const n = L.steps.length;
    st.step = clamp(st.step, 1, n);
    syncSteps('d1', st.step, n);
    const done = (st.step === n);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '長除法：多項式 ÷ 單項式', C);
    const res = drawLongDiv(ctx, P, D, L, st.step, { top: 70, rowH: 38, colL: 150, colR: 520, size: 19, col: LD_COL });

    const qT = rpTex(L.Q), rT = rpTex(L.R);
    const dR = rpDeg(L.R);
    const s0 = L.steps[st.step - 1];
    const y0 = res.yLast + (res.rowH > 40 ? 54 : 44);
    if (done) {
      drawExpr(ctx, [T('商式', LD_COL.Q), T('=', INK), rpItems(L.Q, LD_COL.Q), T('，', INK), T('餘式', LD_COL.R), T('=', INK), rpItems(L.R, LD_COL.R)], 270, y0, 19, INK, { maxW: 500 });
      const why = dR < 0
        ? '餘式是 0：除式可以整除被除式'
        : `停：餘式的次數 ${dR} 比除式的次數 ${st.deg} 小`;
      textCenter(ctx, why, 270, y0 + 38, dR < 0 ? OK_COLOR : QL_MUSTARD, f(800, 15));
    } else {
      textCenter(ctx, `還沒完：剩下的式子次數 ${rpDeg(s0.rem)}，不比除式的次數 ${st.deg} 小，繼續除`, 270, y0, QL_MUSTARD, f(800, 14.5));
    }
    ldLegend(ctx, 456);

    out.innerHTML = `\\((${rpTex(P)})\\)<wbr>\\({}\\div ${par(rpTex(D))}\\)`;
    fb.innerHTML = wrapFeedback(done
      ? `商式 <b style="color:${LD_COL.Q}">\\(${qT}\\)</b>，餘式 <b style="color:${LD_COL.R}">\\(${rT}\\)</b>。${dR < 0 ? '餘式為 \\(0\\)，叫做<b>整除</b>。' : '餘式的次數比除式小，除法才算完成。'}`
      : `第 ${st.step} 步：用剩下式子的最高次項除以除式的最高次項，得到商的下一項。`);
    typeset([out, fb]);
  }

  S.concat([sk]).forEach(s => s.addEventListener('input', () => { st.step = 99; draw(); }));
  bindPickGroup(dG, 'data-d1-deg', v => { st.deg = parseInt(v, 10); st.step = 99; draw(); });
  bindSteps('d1', () => (L ? L.steps.length : 1), st, draw);
  drawWithFonts(draw);
}

// 重點 8：多項式 ÷ 一次式
function initLdiv2Canvas() {
  const cv = elById('canvas-ldiv2');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const S = [0, 1, 2].map(d => elById('d2-a' + d));
  const V = [0, 1, 2].map(d => elById('d2-v' + d));
  const sp = elById('d2-p'), sq = elById('d2-q');
  const vp = elById('d2-vp'), vq = elById('d2-vq');
  const out = elById('d2-formula');
  const fb = elById('d2-feedback');
  const C = QL_TONE[7];
  const st = { step: 99 };
  nzSlider(S[2]);

  let L = null;
  function draw() {
    const a = S.map(s => iv(s));
    V.forEach((el, d) => { el.textContent = a[d]; });
    const p = iv(sp), q = iv(sq);
    vp.textContent = p; vq.textContent = q;
    const P = rpOf(a), D = rpOf([q, p]);
    L = rpLongDiv(P, D);
    const n = L.steps.length;
    st.step = clamp(st.step, 1, n);
    syncSteps('d2', st.step, n);
    const done = (st.step === n);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '長除法：多項式 ÷ 一次式', C);
    const res = drawLongDiv(ctx, P, D, L, st.step, { top: 66, rowH: 37, colL: 150, colR: 520, size: 19, col: LD_COL });

    const y0 = res.yLast + (res.rowH > 40 ? 54 : 40);
    const Rc = L.R[0] || RQ0;
    if (done) {
      drawExpr(ctx, [T('商式', LD_COL.Q), T('=', INK), rpItems(L.Q, LD_COL.Q), T('，', INK), T('餘式', LD_COL.R), T('=', INK), rpItems(L.R, LD_COL.R)], 270, y0, 19, INK, { maxW: 500 });
      if (Rc.n === 0) {
        textCenter(ctx, '餘式是 0：除式整除被除式', 270, y0 + 36, OK_COLOR, f(800, 15));
      } else {
        const fix = rqSub(rq(a[0]), Rc);
        drawExpr(ctx, [T('想要整除？常數項要改成', QL_MUSTARD), rTermItem(fix, 0, true, QL_MUSTARD)], 270, y0 + 36, 15, QL_MUSTARD, { maxW: 500, gap: 6 });
      }
    } else {
      textCenter(ctx, '相減時，下面那一列的每一項都要變號', 270, y0, QL_MUSTARD, f(800, 14.5));
    }
    if (a[1] === 0) textCenter(ctx, '被除式缺 x 項，直式要補 0x', 270, 436, QL_ROSE, f(800, 14));
    ldLegend(ctx, 460);

    out.innerHTML = `\\((${rpTex(P)})\\)<wbr>\\({}\\div (${rpTex(D)})\\)`;
    let msg;
    if (!done) msg = `第 ${st.step} 步：最高次項相除得商的一項，乘回去寫在下面，再<b>上減下</b>。`;
    else if (Rc.n === 0) msg = `商式 \\(${rpTex(L.Q)}\\)，餘式 \\(0\\)：\\(${rpTex(D)}\\) <b style="color:${OK_COLOR}">整除</b>被除式。`;
    else msg = `商式 \\(${rpTex(L.Q)}\\)，餘式 \\(${rpTex(L.R)}\\)。餘式是常數，次數比一次式小，停止。`;
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  S.concat([sp, sq]).forEach(s => s.addEventListener('input', () => { st.step = 99; draw(); }));
  bindSteps('d2', () => (L ? L.steps.length : 1), st, draw);
  drawWithFonts(draw);
}

// 重點 9：二次式 ÷ 二次式
function initLdiv3Canvas() {
  const cv = elById('canvas-ldiv3');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const SA = [0, 1, 2].map(d => elById('d3-a' + d));
  const SB = [0, 1, 2].map(d => elById('d3-b' + d));
  const VA = [0, 1, 2].map(d => elById('d3-va' + d));
  const VB = [0, 1, 2].map(d => elById('d3-vb' + d));
  const out = elById('d3-formula');
  const fb = elById('d3-feedback');
  const C = QL_TONE[8];
  nzSlider(SA[2]);
  nzSlider(SB[2]);

  function draw() {
    const a = SA.map(s => iv(s)), b = SB.map(s => iv(s));
    VA.forEach((el, d) => { el.textContent = a[d]; });
    VB.forEach((el, d) => { el.textContent = b[d]; });
    const P = rpOf(a), D = rpOf(b);
    const L = rpLongDiv(P, D);
    const q = L.Q[0];
    const dR = rpDeg(L.R);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '二次式 ÷ 二次式：除一次就停', C);
    const res = drawLongDiv(ctx, P, D, L, L.steps.length, { top: 70, rowH: 40, colL: 196, colR: 520, size: 19, col: LD_COL, highlight: false });
    const yB = res.yLast + 50;

    const lines = [
      { k: '商式', items: [T(`${a[2]} ÷ ${pn(b[2])}`.replace(/-/g, '−'), INK), T('=', INK), rTermItem(q, 0, true, LD_COL.Q)], why: '最高次項的係數相除，商是常數' },
      { k: '餘式', items: [rpItems(L.R, LD_COL.R)], why: dR < 0 ? '餘式是 0：整除' : `次數 ${dR} 比除式的次數 2 小，停止` }
    ];
    lines.forEach((ln, i) => {
      const y = yB + i * 52;
      drawPanel(ctx, 18, y - 22, 504, 44, i ? LD_COL.R : LD_COL.Q, 0.06);
      textLeft(ctx, ln.k, 30, y, i ? LD_COL.R : LD_COL.Q, f(800, 15));
      drawExpr(ctx, ln.items, 0, y, 19, INK, { left: 84, maxW: 200 });
      textLeft(ctx, ln.why, 296, y, MUTED, f(700, 13));
    });
    let note;
    if (b[1] === 0 && b[0] !== 0) note = '除式缺 x 項，直式也要補 0x';
    else if (q.d !== 1) note = '商式與餘式的係數可以是分數';
    else note = '餘式最多是一次式：一次式、常數或 0';
    textCenter(ctx, note, 270, yB + 110, QL_MUSTARD, f(800, 14.5));
    textCenter(ctx, '被除式與除式都是二次，只能商一個常數', 270, yB + 140, MUTED, f(700, 13.5));
    ldLegend(ctx, 456);

    out.innerHTML = `\\((${rpTex(P)})\\)<wbr>\\({}\\div (${rpTex(D)})\\)`;
    fb.innerHTML = wrapFeedback(`商式 \\(${rqTex(q)}\\)，餘式 \\(${rpTex(L.R)}\\)。${dR < 0 ? '餘式為 \\(0\\)，整除。' : '餘式的次數比除式小，除法完成。'}`);
    typeset([out, fb]);
  }

  SA.concat(SB).forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：被除式組裝台——被除式 = 商式 × 除式 + 餘式
   ========================================================================== */
function initBuildCanvas() {
  const cv = elById('canvas-build');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sd = elById('bd-d');
  const sq2 = elById('bd-q2'), sq1 = elById('bd-q1'), sq0 = elById('bd-q0');
  const sr1 = elById('bd-r1'), sr0 = elById('bd-r0');
  const vals = ['d', 'q2', 'q1', 'q0', 'r1', 'r0'].map(k => elById('bd-v' + k));
  const rowQ2 = elById('bd-row-q2'), rowR1 = elById('bd-row-r1');
  const mG = elById('bd-mode-group');
  const out = elById('bd-formula');
  const fb = elById('bd-feedback');
  const C = QL_TONE[9];
  let mode = 'lin';

  function draw() {
    const lin = (mode === 'lin');
    rowQ2.style.display = lin ? '' : 'none';
    rowR1.style.display = lin ? 'none' : '';
    const d = iv(sd), q2 = iv(sq2), q1 = iv(sq1), q0 = iv(sq0), r1 = iv(sr1), r0 = iv(sr0);
    [d, q2, q1, q0, r1, r0].forEach((v, i) => { vals[i].textContent = v; });
    const D = lin ? [d, 1] : [d, 0, 1];
    const Q = lin ? [q0, q1, q2] : [q0, q1];
    const Rm = lin ? [r0] : [r0, r1];
    const prod = pyMul(Q, D);
    const Pn = pyAdd(prod, Rm);
    const sD = pyStr(D), sQ = pyStr(Q), sR = pyStr(Rm), sP = pyStr(Pn);

    // 乘開還沒合併的樣子
    const pairs = [];
    pyList(Q).forEach(([a, i]) => pyList(D).forEach(([b, j]) => pairs.push([a * b, i + j])));
    const expanded = pairs.length ? pyJoin(pairs.concat(pyList(Rm))) : sR;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '被除式組裝台：商式 × 除式 + 餘式', C);

    // 示意：一塊「商式 × 除式」的長方形布，旁邊接一小塊餘式
    qlPatch(ctx, 70, 52, 280, 70, LD_COL.Q, { alpha: 0.12 });
    drawExpr(ctx, [T('商式 × 除式', LD_COL.Q)], 210, 87, 17, LD_COL.Q);
    qlPatch(ctx, 360, 82, 60, 40, LD_COL.R, { alpha: 0.18, stitch: false });
    textCenter(ctx, '餘式', 390, 102, LD_COL.R, f(800, 14));
    textLeft(ctx, '合起來就是被除式', 432, 102, MUTED, f(700, 12.5));

    const rows = [
      { name: '① 關係', hint: '和整數除法一樣', items: [T('被除式 = 商式 × 除式 + 餘式', INK)] },
      { name: '② 代入', hint: '商式、除式加括號', items: [qlInk(`(${sQ})(${sD}) + ${par(sR)}`, INK)] },
      { name: '③ 乘開', hint: '每一項乘每一項', items: [qlInk(expanded, INK)] },
      { name: '④ 合併', hint: '得到被除式', items: [qlInk(sP, C)], color: C }
    ];
    drawStepRows(ctx, rows, 4, { top: 166, gap: 60, labX: 22, eqX: 150, size: 19, color: C });

    // 驗算：真的把組出來的被除式除回去
    const L = rpLongDiv(rpOf(Pn), rpOf(D));
    const okQ = rpTex(L.Q) === rpTex(rpOf(Q)), okR = rpTex(L.R) === rpTex(rpOf(Rm));
    const ok = okQ && okR;
    drawExpr(ctx, [T('驗算：被除式 ÷ 除式 → 商式', INK), rpItems(L.Q, ok ? OK_COLOR : NO_COLOR), T('，餘式', INK), rpItems(L.R, ok ? OK_COLOR : NO_COLOR)], 270, 412, 15, INK, { maxW: 504, gap: 5 });
    textCenter(ctx, lin ? '除式是一次式，餘式只能是常數' : '除式是二次式，餘式可以是一次式',
      270, 452, MUTED, f(700, 13.5));

    out.innerHTML = wbrEq(`(${sQ})(${sD}) + ${par(sR)} = ${sP}`);
    fb.innerHTML = wrapFeedback(`被除式 <b style="color:${C}">\\(${sP}\\)</b>。把它除以 \\(${sD}\\)，商式正好是 \\(${sQ}\\)、餘式是 \\(${sR}\\)。`);
    typeset([out, fb]);
  }

  [sd, sq2, sq1, sq0, sr1, sr0].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-bd-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 11：除式偵探——拿掉餘式，剩下的排成長方形
   ========================================================================== */
const FD_SETS = {
  p1: { Q: [2, 1], B: [3, 2], r: 1 },    // 商 x + 2，除式 2x + 3，餘 1
  p2: { Q: [1, 2], B: [4, 1], r: 3 },    // 商 2x + 1，除式 x + 4，餘 3
  p3: { Q: [1, 1], B: [2, 3], r: 2 }     // 商 x + 1，除式 3x + 2，餘 2
};

function initFindCanvas() {
  const cv = elById('canvas-find');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const pG = elById('fd-p-group');
  const out = elById('fd-formula');
  const fb = elById('fd-feedback');
  const C = QL_TONE[10];
  const st = { step: 1, set: 'p1' };
  const NSTEP = 4;
  const X = 58, U = 18;   // 長條的長 = 大方布的邊 = X；小方布的邊 = 長條的寬 = U

  function draw() {
    const { Q, B, r } = FD_SETS[st.set];
    st.step = clamp(st.step, 1, NSTEP);
    syncSteps('fd', st.step, NSTEP);
    const P = pyAdd(pyMul(Q, B), [r]);
    const Pr = pyMul(Q, B);
    const sP = pyStr(P), sQ = pyStr(Q), sB = pyStr(B);
    const big = P[2], strips = P[1], small = P[0];

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '除式偵探：被除式的布，拼成一邊是商式的長方形', C);
    drawExpr(ctx, [qlInk(`被除式 ${sP}，商式 ${sQ}，餘式 ${r}`, INK)], 270, 58, 16, INK, { maxW: 504 });

    // 右側：餘式區
    const restX = 420, restY = 88;
    if (st.step >= 2) {
      qlPatch(ctx, restX - 10, restY - 6, 120, 80, LD_COL.R, { alpha: 0.05, dash: [5, 5], stitch: false });
      textCenter(ctx, `餘式：${r} 塊`, restX + 50, restY + 8, LD_COL.R, f(800, 13.5));
      for (let i = 0; i < r; i++) qlPatch(ctx, restX + 6 + i * (U + 8), restY + 32, U, U, QL_TEAL, { stitch: false });
    }

    if (st.step <= 2) {
      // 一堆原料：大方布一排、長條一排（直放）、小方布一排
      let x = 30;
      for (let i = 0; i < big; i++) { qlPatch(ctx, x, 92, X, X, QL_ROSE); x += X + 10; }
      x = 30;
      for (let i = 0; i < strips; i++) { qlPatch(ctx, x, 168, U, X, QL_MUSTARD, { stitch: false }); x += U + 10; }
      const shownSmall = st.step >= 2 ? small - r : small;
      x = 30;
      for (let i = 0; i < shownSmall; i++) { qlPatch(ctx, x, 244, U, U, QL_TEAL, { stitch: false }); x += U + 10; }
      if (st.step === 1) {
        for (let i = 0; i < r; i++) {
          ctx.save();
          ctx.strokeStyle = LD_COL.R;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.strokeRect(30 + (small - r + i) * (U + 10) - 3, 241, U + 6, U + 6);
          ctx.restore();
        }
      }
      textLeft(ctx, `大方布 ${big} 塊、長條 ${strips} 條、小方布 ${st.step >= 2 ? small - r : small} 塊`, 30, 296, INK, f(700, 14));
    } else {
      // 排成長方形：高 = 商式（已知），寬 = 除式（要找的）
      const [q0, q1] = Q, [b0, b1] = B;
      const ox = 80, oy = 96;
      const H = q1 * X + q0 * U, W = b1 * X + b0 * U;
      for (let i = 0; i < q1 + q0; i++) {
        const y = oy + (i < q1 ? i * X : q1 * X + (i - q1) * U);
        const h = i < q1 ? X : U;
        for (let j = 0; j < b1 + b0; j++) {
          const x = ox + (j < b1 ? j * X : b1 * X + (j - b1) * U);
          const w = j < b1 ? X : U;
          const colr = (h === X && w === X) ? QL_ROSE : (h === U && w === U ? QL_TEAL : QL_MUSTARD);
          qlPatch(ctx, x, y, w, h, colr, { stitch: h === X && w === X });
        }
      }
      // 左邊：商式（已知）
      ctx.save();
      ctx.translate(ox - 22, oy + H / 2);
      ctx.rotate(-Math.PI / 2);
      drawExpr(ctx, [qlInk(sQ, LD_COL.Q)], 0, 0, 17, LD_COL.Q);
      ctx.restore();
      textLeft(ctx, '商式', 18, oy - 12, LD_COL.Q, f(800, 13));
      // 上邊：除式（第 4 步才揭曉）
      if (st.step >= 4) drawExpr(ctx, [qlInk(sB, LD_COL.D)], ox + W / 2, oy - 16, 19, LD_COL.D);
      else textCenter(ctx, '?', ox + W / 2, oy - 16, LD_COL.D, f(800, 22));
    }

    const labels = ['① 已知的布塊：就是被除式', '② 先拿掉餘式那幾塊', '③ 剩下的排成一邊是商式的長方形', '④ 另一邊就是除式'];
    textCenter(ctx, labels[st.step - 1], 270, 338, C, f(800, 16));
    const rows = [
      `除式 = (${sP} - ${r}) ÷ (${sQ})`,
      `= (${pyStr(Pr)}) ÷ (${sQ})`,
      `= ${sB}`
    ];
    const showRows = st.step >= 4 ? 3 : (st.step >= 2 ? 2 : 1);
    for (let i = 0; i < showRows; i++) {
      drawExpr(ctx, [qlInk(rows[i], i === 2 ? C : INK)], 0, 378 + i * 30, 17, INK, { left: 70, maxW: 450 });
    }

    // wbrEq 不會在 ÷ 前斷開，這裡自己接段
    out.innerHTML = st.step >= 4
      ? `\\([(${sP}) - ${r}]\\)<wbr>\\({}\\div (${sQ})\\)<wbr>\\({}= ${sB}\\)`
      : '除式 ＝（被除式 − 餘式）÷ 商式';
    fb.innerHTML = wrapFeedback(st.step >= 4
      ? `除式是 <b style="color:${LD_COL.D}">\\(${sB}\\)</b>。驗算：${wbrEq(`(${sQ})(${sB}) + ${r} = ${sP}`)}。`
      : (st.step === 1 ? '餘式是拼不進長方形的那幾塊，要先拿掉。' : '按「下一步」把剩下的布排成長方形。'));
    typeset([out, fb]);
  }

  bindPickGroup(pG, 'data-fd-p', v => { st.set = v; st.step = 1; draw(); });
  bindSteps('fd', () => NSTEP, st, draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 12：四則運算步驟機——先乘方、再乘法、減號後整組變號
   ========================================================================== */
const MX_SETS = {
  p1: [
    { name: '① 原式', hint: '先找乘方與乘法', s: '3(x + 2)^2 - (x - 1)(x + 5)',
      why: '有一個平方、兩個乘法，最後才是中間的減法' },
    { name: '② 先算乘方', hint: '用和的平方公式', s: '3(x^2 + 4x + 4) - (x - 1)(x + 5)',
      why: '(x + 2)^2 = x^2 + 4x + 4' },
    { name: '③ 再算乘法', hint: '乘開後整組加括號', s: '(3x^2 + 12x + 12) - (x^2 + 4x - 5)',
      why: '減號後面的乘積 x^2 + 4x - 5 要整組放進括號' },
    { name: '④ 去括號', hint: '減號後每一項都變號', s: '3x^2 + 12x + 12 - x^2 - 4x + 5', color: QL_ROSE,
      why: 'x^2 變 -x^2、4x 變 -4x、-5 變 +5' },
    { name: '⑤ 合併同類項', hint: '答案寫成降冪', s: '2x^2 + 8x + 17',
      why: '3x^2 - x^2 = 2x^2，12x - 4x = 8x，12 + 5 = 17' }
  ],
  p2: [
    { name: '① 原式', hint: '先找乘方與乘法', s: '(2x - 1)(x + 3) - 2(x - 2)^2',
      why: '減號後面是「2 乘 (x - 2) 的平方」，要先算完' },
    { name: '② 先算乘方', hint: '用差的平方公式', s: '(2x - 1)(x + 3) - 2(x^2 - 4x + 4)',
      why: '(x - 2)^2 = x^2 - 4x + 4' },
    { name: '③ 再算乘法', hint: '乘開後整組加括號', s: '(2x^2 + 5x - 3) - (2x^2 - 8x + 8)',
      why: '2(x^2 - 4x + 4) = 2x^2 - 8x + 8，整組放進括號' },
    { name: '④ 去括號', hint: '減號後每一項都變號', s: '2x^2 + 5x - 3 - 2x^2 + 8x - 8', color: QL_ROSE,
      why: '2x^2 變 -2x^2、-8x 變 +8x、8 變 -8' },
    { name: '⑤ 合併同類項', hint: 'x^2 項抵消了', s: '13x - 11',
      why: '2x^2 - 2x^2 = 0，5x + 8x = 13x，-3 - 8 = -11' }
  ],
  p3: [
    { name: '① 原式', hint: '先找乘方與乘法', s: '(x + 4)(x - 4) - (3x - 1)^2 + 6x',
      why: '一個平方差、一個平方，最後一項 6x 留到最後' },
    { name: '② 先算乘方', hint: '用差的平方公式', s: '(x + 4)(x - 4) - (9x^2 - 6x + 1) + 6x',
      why: '(3x - 1)^2 = 9x^2 - 6x + 1，平方的結果直接放進括號' },
    { name: '③ 再算乘法', hint: '用平方差公式', s: '(x^2 - 16) - (9x^2 - 6x + 1) + 6x',
      why: '(x + 4)(x - 4) = x^2 - 16' },
    { name: '④ 去括號', hint: '減號後每一項都變號', s: 'x^2 - 16 - 9x^2 + 6x - 1 + 6x', color: QL_ROSE,
      why: '9x^2 變 -9x^2、-6x 變 +6x、1 變 -1' },
    { name: '⑤ 合併同類項', hint: '答案寫成降冪', s: '-8x^2 + 12x - 17',
      why: 'x^2 - 9x^2 = -8x^2，6x + 6x = 12x，-16 - 1 = -17' }
  ]
};

function initMixCanvas() {
  const cv = elById('canvas-mix');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const pG = elById('mx-p-group');
  const out = elById('mx-formula');
  const fb = elById('mx-feedback');
  const C = QL_TONE[11];
  const st = { step: 1, set: 'p1' };

  function draw() {
    const steps = MX_SETS[st.set];
    const n = steps.length;
    st.step = clamp(st.step, 1, n);
    syncSteps('mx', st.step, n);
    const cur = steps[st.step - 1];

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '四則運算步驟機：先乘方、再乘除、後加減', C);
    const rows = steps.map((s, i) => ({
      name: s.name, hint: s.hint,
      items: [qlInk(s.s, i === n - 1 ? C : (s.color || INK))],
      color: s.color
    }));
    drawStepRows(ctx, rows, st.step, { top: 74, gap: 74, labX: 22, eqX: 160, size: 19, color: C });
    drawExpr(ctx, [qlInk(cur.why, cur.color || QL_CREAM)], 270, 450, 15, INK, { maxW: 500 });

    out.innerHTML = wbrEq(cur.s);
    fb.innerHTML = wrapFeedback(st.step === n
      ? `答案是 \\(${cur.s}\\)。順序是<b style="color:${C}">先乘方、再乘法，乘積整組加括號，最後去括號合併</b>。`
      : `第 ${st.step} 步：${cur.hint}。按「下一步」繼續。`);
    typeset([out, fb]);
  }

  bindPickGroup(pG, 'data-mx-p', v => { st.set = v; st.step = 1; draw(); });
  bindSteps('mx', () => MX_SETS[st.set].length, st, draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 13：拼布工作台應用——面積、平移小路、梯形求高
   ========================================================================== */
function initAppCanvas() {
  const cv = elById('canvas-app');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sx = elById('ap-x'), vx = elById('ap-vx');
  const mG = elById('ap-mode-group');
  const moveRow = elById('ap-row-move');
  const moveG = elById('ap-move-group');
  const out = elById('ap-formula');
  const fb = elById('ap-feedback');
  const C = QL_TONE[12];
  let mode = 'frame', moved = 'before';

  const ev = (p, x) => p.reduce((s, c, i) => s + c * Math.pow(x, i), 0);

  function draw() {
    const x = iv(sx);
    vx.textContent = x;
    moveRow.style.display = mode === 'road' ? '' : 'none';

    ctx.clearRect(0, 0, cv.width, cv.height);
    let rows, texOut, msg, check;

    if (mode === 'frame') {
      const OL = [4, 3], OW = [5, 2], IL = [2, 1], IW = [1, 1];
      const Lv = ev(OL, x), Wv = ev(OW, x), lv = ev(IL, x), wv = ev(IW, x);
      drawTitle(ctx, '桌巾挖掉中間一塊：大長方形 − 小長方形', C);
      const s = Math.min(250 / Lv, 170 / Wv);
      const ox = 40, oy = 64;
      qlPatch(ctx, ox, oy, Lv * s, Wv * s, QL_ROSE, { alpha: 0.22 });
      const ix = ox + (Lv - lv) * s / 2, iy = oy + (Wv - wv) * s / 2;
      ctx.clearRect(ix, iy, lv * s, wv * s);
      qlPatch(ctx, ix, iy, lv * s, wv * s, DIM, { alpha: 0.05, dash: [5, 4], stitch: false });
      drawExpr(ctx, [qlInk('3x + 4', QL_ROSE)], ox + Lv * s / 2, oy - 14, 15, QL_ROSE);
      ctx.save(); ctx.translate(ox + Lv * s + 16, oy + Wv * s / 2); ctx.rotate(Math.PI / 2);
      drawExpr(ctx, [qlInk('2x + 5', QL_ROSE)], 0, 0, 15, QL_ROSE); ctx.restore();
      textCenter(ctx, '挖掉', ix + lv * s / 2, iy + wv * s / 2 - 9, MUTED, f(700, 12));
      drawExpr(ctx, [qlInk('(x + 2)(x + 1)', MUTED)], ix + lv * s / 2, iy + wv * s / 2 + 10, 12, MUTED, { maxW: Math.max(40, lv * s - 6) });
      const area = pyAdd(pyMul(OL, OW), pyNeg(pyMul(IL, IW)));
      check = [`大：${Lv} × ${Wv} = ${Lv * Wv}`, `小：${lv} × ${wv} = ${lv * wv}`, `剩：${Lv * Wv - lv * wv}`, `代入公式：${ev(area, x)}`];
      rows = [
        { name: '① 大減小', hint: '面積 = 長 × 寬', items: [qlInk('(3x + 4)(2x + 5) - (x + 2)(x + 1)', INK)] },
        { name: '② 各自乘開', hint: '小的那塊整組加括號', items: [qlInk(`(${pyStr(pyMul(OL, OW))}) - (${pyStr(pyMul(IL, IW))})`, INK)] },
        { name: '③ 去括號合併', hint: '減號後每一項變號', items: [qlInk(pyStr(area), C)], color: C }
      ];
      texOut = `(3x + 4)(2x + 5) - (x + 2)(x + 1) = ${pyStr(area)}`;
      msg = `剩下的面積是 \\(${pyStr(area)}\\)；\\(x = ${x}\\) 時是 \\(${ev(area, x)}\\)，和直接算的一樣。`;
    } else if (mode === 'road') {
      const FL = [5, 4], FW = [2, 3];
      const Lv = ev(FL, x), Wv = ev(FW, x);
      drawTitle(ctx, '十字小路：把小路推到邊上再算', C);
      const s = Math.min(250 / Lv, 170 / Wv);
      const ox = 40, oy = 64, rw = x * s;
      if (moved === 'before') {
        qlPatch(ctx, ox, oy, Lv * s, Wv * s, OK_COLOR, { alpha: 0.22 });
        const rx = ox + Lv * s * 0.42, ry = oy + Wv * s * 0.55;
        ctx.fillStyle = 'rgba(253, 230, 138, 0.55)';
        ctx.fillRect(rx, oy, rw, Wv * s);
        ctx.fillRect(ox, ry, Lv * s, rw);
        textCenter(ctx, '小路寬 x', rx + rw / 2, oy + 14, '#78350f', f(800, 11));
      } else {
        qlPatch(ctx, ox, oy, (Lv - x) * s, (Wv - x) * s, OK_COLOR, { alpha: 0.22 });
        ctx.fillStyle = 'rgba(253, 230, 138, 0.55)';
        ctx.fillRect(ox + (Lv - x) * s, oy, rw, Wv * s);
        ctx.fillRect(ox, oy + (Wv - x) * s, (Lv - x) * s, rw);
        drawExpr(ctx, [qlInk('3x + 5', OK_COLOR)], ox + (Lv - x) * s / 2, oy + (Wv - x) * s / 2 - 10, 14, OK_COLOR);
        drawExpr(ctx, [qlInk('× (2x + 2)', OK_COLOR)], ox + (Lv - x) * s / 2, oy + (Wv - x) * s / 2 + 12, 14, OK_COLOR);
      }
      drawExpr(ctx, [qlInk('4x + 5', QL_CREAM)], ox + Lv * s / 2, oy - 14, 15, QL_CREAM);
      ctx.save(); ctx.translate(ox + Lv * s + 16, oy + Wv * s / 2); ctx.rotate(Math.PI / 2);
      drawExpr(ctx, [qlInk('3x + 2', QL_CREAM)], 0, 0, 15, QL_CREAM); ctx.restore();
      const area = pyMul([5, 3], [2, 2]);
      const roads = x * Wv + x * Lv - x * x;
      check = [`整塊：${Lv} × ${Wv} = ${Lv * Wv}`, `小路：${roads}`, `剩：${Lv * Wv - roads}`, `代入公式：${ev(area, x)}`];
      rows = [
        { name: '① 推到邊上', hint: '長、寬各少一條路寬', items: [qlInk('(4x + 5 - x)(3x + 2 - x)', INK)] },
        { name: '② 化簡', hint: '括號裡先合併', items: [qlInk('(3x + 5)(2x + 2)', INK)] },
        { name: '③ 乘開', hint: '每一項乘每一項', items: [qlInk(pyStr(area), C)], color: C }
      ];
      texOut = `(3x + 5)(2x + 2) = ${pyStr(area)}`;
      msg = moved === 'before'
        ? '按「推到邊上」：小路搬到邊上，剩下的稻田拼成一整塊長方形。'
        : `剩下的面積是 \\(${pyStr(area)}\\)；\\(x = ${x}\\) 時是 \\(${ev(area, x)}\\)。`;
    } else {
      const TOP = [2, 1], BOT = [4, 3], H = [1, 2];
      const tv = ev(TOP, x), bv = ev(BOT, x), hv = ev(H, x);
      drawTitle(ctx, '梯形求高：高 = 面積 × 2 ÷ (上底 + 下底)', C);
      const s = Math.min(260 / bv, 160 / hv);
      const ox = 40, by = 64 + hv * s;
      const tx = ox + (bv - tv) * s / 2;
      ctx.save();
      ctx.fillStyle = 'rgba(165, 180, 252, 0.22)';
      ctx.strokeStyle = '#a5b4fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox, by);
      ctx.lineTo(ox + bv * s, by);
      ctx.lineTo(tx + tv * s, by - hv * s);
      ctx.lineTo(tx, by - hv * s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      qlLine(ctx, tx, by - hv * s, tx, by, LD_COL.Q, 2, [5, 4]);
      drawExpr(ctx, [qlInk('x + 2', QL_CREAM)], tx + tv * s / 2, by - hv * s - 14, 14, QL_CREAM);
      drawExpr(ctx, [qlInk('3x + 4', QL_CREAM)], ox + bv * s / 2, by + 16, 14, QL_CREAM);
      textLeft(ctx, '高 ?', tx + 6, by - hv * s / 2, LD_COL.Q, f(800, 13));
      const area2 = [6, 16, 8];   // 面積 × 2 = 8x² + 16x + 6
      check = [`上底 ${tv}、下底 ${bv}`, `面積 ${ev([3, 8, 4], x)}`, `高 = ${ev([3, 8, 4], x)} × 2 ÷ ${tv + bv}`, `= ${hv}`];
      rows = [
        { name: '① 公式', hint: '面積 × 2 ÷ (上底 + 下底)', items: [qlInk('(4x^2 + 8x + 3) × 2 ÷ [(x + 2) + (3x + 4)]', INK)] },
        { name: '② 整理', hint: '上底加下底先合併', items: [qlInk(`(${pyStr(area2)}) ÷ (4x + 6)`, INK)] },
        { name: '③ 長除法', hint: '剛好整除', items: [qlInk('2x + 1', C)], color: C }
      ];
      texOut = null;
      out.innerHTML = '\\((4x^2 + 8x + 3) \\times 2\\)<wbr>\\({}\\div (4x + 6)\\)<wbr>\\({}= 2x + 1\\)';
      msg = `面積 \\(4x^2 + 8x + 3\\) 的梯形，高是 \\(2x + 1\\)；\\(x = ${x}\\) 時高是 \\(${hv}\\)。`;
    }

    // 右上：代入數字驗算
    drawPanel(ctx, 330, 52, 194, 132, C, 0.06);
    textLeft(ctx, `代入 x = ${x} 驗算`, 344, 70, C, f(800, 13.5));
    check.forEach((t, i) => textLeft(ctx, t, 344, 96 + i * 24, i === check.length - 1 ? OK_COLOR : INK, f(700, 13)));

    drawStepRows(ctx, rows, rows.length, { top: 286, gap: 62, labX: 22, eqX: 150, size: 18, color: C });

    if (texOut) out.innerHTML = wbrEq(texOut);
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  sx.addEventListener('input', draw);
  bindPickGroup(mG, 'data-ap-mode', v => { mode = v; draw(); });
  bindPickGroup(moveG, 'data-ap-move', v => { moved = v; draw(); });
  drawWithFonts(draw);
}
