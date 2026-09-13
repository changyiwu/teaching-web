/* ==========================================================================
   4-2 解一元一次不等式 — 互動 Canvas 與隨堂評量
   畫風：復古遊樂園海報（網版印刷，番茄紅／薄荷綠／芥末黃／深海軍藍），沿用 4-1

   共用工具在 ../math-canvas.js（T／IT／VF／FR／SEQ／drawExpr／drawStepRows／
   drawPanel／drawChip／drawEqPanel／reduce／texFrac／wbrRel／numLine 系列／
   textCenter／textLeft／dashLine／drawDot…），
   本檔只放本節專屬的色票、有理數與算式小工具，以及 11 個互動。

   ⚠️ 本節所有 LaTeX 的不等號一律寫 \lt、\gt、\le、\ge：寫成 < 的話，
   innerHTML 會把「<x」這類字串當成標籤開頭，整段算式直接消失。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initShiftCanvas();
  initScaleCanvas({ id: 'canvas-mul', pre: 'mu', neg: false, tone: 1 });
  initScaleCanvas({ id: 'canvas-neg', pre: 'ng', neg: true, tone: 2 });
  initMoveCanvas();
  initBothCanvas();
  initParenCanvas();
  initFracCanvas();
  initIntCanvas();
  initMenuCanvas();
  initTierCanvas();
  initCupCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具
   ========================================================================== */

// 遊樂園海報的四個印刷色（SV_ = Solve；共用檔與 4-1 都沒有這個前綴的符號）
const SV_TOMATO = '#fb7185';
const SV_MINT = '#5eead4';
const SV_MUSTARD = '#fcd34d';
const SV_NAVY = '#93c5fd';
// 算式卡片上的字色（淺奶油色，在深色底板上最清楚）
const SV_CREAM = '#fef3c7';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const SV_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9'];

// 四個不等號：up 為 true 是「大於」那一族，eq 為 true 是含等號，flip 是變號之後的樣子
const SV_SIGN = {
  gt: { ch: '>', tex: '\\gt', read: '大於', eq: false, up: true, flip: 'lt' },
  ge: { ch: '≥', tex: '\\ge', read: '大於或等於', eq: true, up: true, flip: 'le' },
  lt: { ch: '<', tex: '\\lt', read: '小於', eq: false, up: false, flip: 'gt' },
  le: { ch: '≤', tex: '\\le', read: '小於或等於', eq: true, up: false, flip: 'ge' }
};

/* --------------------------------------------------------------------------
   有理數：一律用 [分子, 分母]（分母為正、已約分），避免 0.1 這類浮點誤差
   -------------------------------------------------------------------------- */
function svVal(q) {
  return q[0] / q[1];
}

// 兩個有理數比大小：回傳 1、0、-1
function svCmp(p, q) {
  return Math.sign(p[0] * q[1] - q[0] * p[1]);
}

// MathJax 用的分數字串（reduce 過，才不會印出沒約分的分數）
function svTex(q) {
  const r = reduce(q[0], q[1]);
  return texFrac(r[0], r[1]);
}

// canvas 上的分數元件：負號提到分數前面
function svItem(q, color) {
  const r = reduce(q[0], q[1]);
  if (r[1] === 1) return T(String(r[0]), color);
  const fr = FR(Math.abs(r[0]), r[1], color);
  return r[0] < 0 ? SEQ([T('-', color), fr], color, 2) : fr;
}

// 帶分數的文字（標在數線下方時用）：-11/3 → -3⅔ 寫成「-3 又 2/3」
function svMixed(q) {
  const r = reduce(q[0], q[1]);
  if (r[1] === 1) return String(r[0]);
  const s = r[0] < 0 ? '-' : '';
  const n = Math.abs(r[0]);
  const w = Math.floor(n / r[1]);
  return w === 0 ? `${s}${n}/${r[1]}` : `${s}${w} 又 ${n % r[1]}/${r[1]}`;
}

/* --------------------------------------------------------------------------
   算式字串
   -------------------------------------------------------------------------- */

// 線性式：[[係數, 'x' 或 ''], ...] → 「3x - 7」。係數 0 的項略過，±1 不寫 1。
// 產生的字串只含數字、x、+、-，canvas（svInk）與 LaTeX 都能直接用
function svLin(terms) {
  let s = '';
  terms.forEach(([c, v]) => {
    if (c === 0) return;
    const a = Math.abs(c);
    const body = v ? (a === 1 ? v : `${a}${v}`) : String(a);
    if (!s) s = (c < 0 ? '-' : '') + body;
    else s += (c < 0 ? ' - ' : ' + ') + body;
  });
  return s || '0';
}

// 需要括號的位置（乘號後面、減號後面）：負數加括號
function svPar(v) {
  return v < 0 ? `(${v})` : String(v);
}

// 算式字串 → canvas 元件：單一小寫英文字母走斜體，其餘照原樣
function svInk(s, color) {
  const parts = [];
  let buf = '';
  for (const ch of String(s)) {
    if (/[a-z]/.test(ch)) {
      if (buf) { parts.push(T(buf, color)); buf = ''; }
      parts.push(IT(ch, color));
    } else {
      buf += ch;
    }
  }
  if (buf) parts.push(T(buf, color));
  return SEQ(parts, color, 1);
}

// 一組按鈕的 active 狀態由程式設定（切換模式時把按鈕歸位）
function svSetActive(groupEl, attr, value) {
  if (!groupEl) return;
  groupEl.querySelectorAll('.pick-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute(attr) === String(value));
  });
}

/**
 * 在數線上畫出 x 〈key〉 q 的解（q 是有理數）。數線以解的端點為中心，左右各 half 格。
 * 端點不是整數時，在數線下方補寫分數，並標出它落在哪兩個整數之間。
 * 回傳 numLine 的 { px, left, right }
 */
function svSolLine(ctx, y, q, key, color, style, opts) {
  const o = opts || {};
  const v = svVal(q);
  const c = Math.round(v);
  const half = o.half || 6;
  const L = numLine(ctx, { x0: o.x0 || 50, x1: o.x1 || 474, y: y, min: c - half, max: c + half, font: f(700, 13) });
  const S = SV_SIGN[key];
  numLineRay(ctx, L, y, L.px(v), S.up, color, style || 'line');
  numLineEnd(ctx, L.px(v), y, S.eq, color);
  if (q[1] !== 1) {
    drawExpr(ctx, [svItem(q, color)], L.px(v), y + 52, 16, color, { maxW: 90 });
  }
  return L;
}

// 「v 〈key〉 k」成不成立（兩邊都是有理數）
function svHolds(v, key, k) {
  const d = svCmp(v, k);
  const S = SV_SIGN[key];
  if (d === 0) return S.eq;
  return S.up ? d > 0 : d < 0;
}

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第二冊 4-2 的 22 題正解
  // 正解字母分布：A 6 題、B 5 題、C 6 題、D 5 題（開發約束 36）
  const answers = {
    '4-2-1': 'B',    // a < b ⇒ a + 3 < b + 3
    '4-2-2': 'C',    // x + 9 ≥ 4 ⇒ x ≥ -5
    '4-2-3': 'A',    // 5x > -15 ⇒ x > -3
    '4-2-4': 'A',    // (3/4)x > 9 ⇒ x > 12
    '4-2-5': 'D',    // m < n ⇒ m ÷ (-3) > n ÷ (-3)
    '4-2-6': 'D',    // -6x ≥ 15 ⇒ x ≤ -5/2
    '4-2-7': 'B',    // -7x + 12 < 40 ⇒ x > -4
    '4-2-8': 'C',    // 第 ③ 步除以 -4 忘了變號
    '4-2-9': 'C',    // 3x - 11 ≤ 7x + 5 ⇒ x ≥ -4
    '4-2-10': 'C',   // 20 > 5x ⇒ 4 > x，做法正確
    '4-2-11': 'A',   // 6(2 - x) < 3x - 6 ⇒ x > 2
    '4-2-12': 'D',   // -3(x - 5) ≥ 21 - x ⇒ x ≤ -3
    '4-2-13': 'C',   // (2x-1)/3 - 1 > (x+4)/2 ⇒ x > 20
    '4-2-14': 'B',   // x ≤ -11/3：實心，-4 與 -3 之間，往左
    '4-2-15': 'A',   // 120 + 35x ≤ 500 ⇒ 最多 10 枚
    '4-2-16': 'B',   // 6x - 13 > 71 ⇒ x > 14 ⇒ 最小 15
    '4-2-17': 'D',   // x ≤ 60，扣掉奶茶，共 4 種
    '4-2-18': 'A',   // (85 + 95 + x) × 0.75 ≤ 240
    '4-2-19': 'B',   // 36x > 960 ⇒ 至少 27 本
    '4-2-20': 'C',   // 280 × 0.85x > 280 × 0.7 × 50
    '4-2-21': 'A',   // 31.25 < x < 50
    '4-2-22': 'D'    // 30 < x < 45，30 不可能
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
   重點 1：纜車平移台——兩點一起平移，左右順序不變；再用它解 x + p 〈〉 q
   ========================================================================== */
function initShiftCanvas() {
  const cv = document.getElementById('canvas-shift');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const modeG = document.getElementById('sh-mode-group');
  const signRow = document.getElementById('sh-sign-row');
  const signG = document.getElementById('sh-sign-group');
  const cRow = document.getElementById('sh-c-row');
  const aS = document.getElementById('sh-a-slider');
  const bS = document.getElementById('sh-b-slider');
  const cS = document.getElementById('sh-c-slider');
  const aV = document.getElementById('sh-a-val');
  const bV = document.getElementById('sh-b-val');
  const cV = document.getElementById('sh-c-val');
  const aN = document.getElementById('sh-a-name');
  const bN = document.getElementById('sh-b-name');
  const out = document.getElementById('sh-formula');
  const fb = document.getElementById('sh-feedback');
  const C = SV_TONE[0];
  let mode = 'pair', key = 'gt';

  const CFG = {
    pair: { a: ['第一個數 a', -5, 5, 3], b: ['第二個數 b', -5, 5, -1] },
    solve: { a: ['x + p 的 p', -8, 8, 6], b: ['右邊的數 q', -6, 6, 5] }
  };
  const REL = {
    1: { ch: '>', tex: '\\gt', side: '右' },
    '-1': { ch: '<', tex: '\\lt', side: '左' },
    0: { ch: '=', tex: '=', side: '' }
  };

  function loadMode() {
    const cfg = CFG[mode];
    [[aS, aN, cfg.a], [bS, bN, cfg.b]].forEach(([s, n, d]) => {
      n.textContent = d[0];
      s.min = d[1];
      s.max = d[2];
      s.value = d[3];
    });
    signRow.hidden = (mode !== 'solve');
    cRow.hidden = (mode !== 'pair');
  }

  // 數線上的點與它的標籤；near 為 true 時標籤抬高一層，避免和另一點的標籤疊在一起
  function point(L, y, v, label, color, near) {
    drawDot(ctx, L.px(v), y, color, 7);
    textCenter(ctx, label, L.px(v), y - (near ? 38 : 20), color, f(800, 14));
  }

  function drawPair() {
    const a = parseInt(aS.value, 10);
    const b = parseInt(bS.value, 10);
    const c = parseInt(cS.value, 10);
    aV.textContent = a;
    bV.textContent = b;
    cV.textContent = c;
    const R = REL[Math.sign(a - b)];
    const op = c >= 0 ? '+' : '-';
    const ac = Math.abs(c);
    const near = Math.abs(a - b) <= 1;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, c === 0 ? '兩邊同加 0：兩個點都沒有動' : `兩個點一起往${c > 0 ? '右' : '左'}移 ${ac} 格`, C);

    const y1 = 108, y2 = 232;
    textLeft(ctx, '原本', 16, y1 - 52, MUTED, f(700, 13));
    textLeft(ctx, c >= 0 ? `同加 ${c} 之後` : `同減 ${ac} 之後`, 16, y2 - 52, MUTED, f(700, 13));
    const L1 = numLine(ctx, { x0: 60, x1: 480, y: y1, min: -10, max: 10, labelEvery: 2, font: f(700, 12) });
    const L2 = numLine(ctx, { x0: 60, x1: 480, y: y2, min: -10, max: 10, labelEvery: 2, font: f(700, 12) });
    dashLine(ctx, L1.px(a), y1 + 26, L2.px(a + c), y2 - 12, SV_TOMATO);
    dashLine(ctx, L1.px(b), y1 + 26, L2.px(b + c), y2 - 12, SV_NAVY);
    if (a === b) {
      point(L1, y1, a, 'a = b', SV_MUSTARD, false);
      point(L2, y2, a + c, c === 0 ? 'a = b' : `a ${op} ${ac} = b ${op} ${ac}`, SV_MUSTARD, false);
    } else {
      point(L1, y1, a, 'a', SV_TOMATO, false);
      point(L1, y1, b, 'b', SV_NAVY, near);
      point(L2, y2, a + c, c === 0 ? 'a' : `a ${op} ${ac}`, SV_TOMATO, false);
      point(L2, y2, b + c, c === 0 ? 'b' : `b ${op} ${ac}`, SV_NAVY, near);
    }

    const rows = [
      { name: '① 原本', hint: R.side ? `a 在 b 的${R.side}邊` : '兩個數一樣大',
        items: [T(`${a} ${R.ch} ${b}`, INK)] },
      { name: c >= 0 ? `② 兩邊同加 ${c}` : `② 兩邊同減 ${ac}`, hint: '兩個點移動的格數一樣',
        items: [T(`${a} ${op} ${ac}   ${R.ch}   ${b} ${op} ${ac}`, INK)] },
      { name: '③ 算出來', hint: R.side ? '不等號方向不變' : '仍然一樣大',
        items: [T(`${a + c} ${R.ch} ${b + c}`, SV_MUSTARD)], color: SV_MUSTARD }
    ];
    drawStepRows(ctx, rows, 3, { top: 306, gap: 54, labX: 22, eqX: 200, size: 22, color: C });
    textCenter(ctx, R.side ? `平移之後，a 仍然在 b 的${R.side}邊：方向不變` : '一樣大的兩個數，同加同減之後還是一樣大',
      270, 460, INK, f(700, 14.5));

    out.innerHTML = wbrRel(`${a} ${R.tex} ${b}`) + ' → ' + wbrRel(`${a + c} ${R.tex} ${b + c}`);
    let msg;
    if (a === b) {
      msg = `\\(a\\) 和 \\(b\\) 一樣大，兩個點重疊在一起。把它們調成不一樣大，再看平移前後誰在右邊。`;
    } else if (c === 0) {
      msg = `加 \\(0\\) 等於沒有動。把 \\(c\\) 調成正數（往右）或負數（往左）試試看。`;
    } else {
      msg = `兩個點都${c > 0 ? '往右' : '往左'}移了 \\(${ac}\\) 格，距離沒變，<b style="color:${C}">誰在右邊也沒變</b>，所以 \\(${a} ${op} ${ac} ${R.tex} ${b} ${op} ${ac}\\)，不等號方向不變。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  function drawSolve() {
    const p = parseInt(aS.value, 10);
    const q = parseInt(bS.value, 10);
    aV.textContent = p;
    bV.textContent = q;
    const S = SV_SIGN[key];
    const r = q - p;
    const lhs = svLin([[1, 'x'], [p, '']]);
    const ap = Math.abs(p);
    const op = p > 0 ? '-' : '+';

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, p === 0 ? 'x 已經單獨在一邊了' : `兩邊同${p > 0 ? '減' : '加'} ${ap}，把 x 單獨留下來`, C);
    drawEqPanel(ctx, [svInk(`${lhs} ${S.ch} ${q}`, SV_CREAM)], 82, C, { h: 30, size: 30 });

    let rows;
    if (p === 0) {
      rows = [
        { name: '① 原式', hint: 'x 旁邊沒有常數項', items: [svInk(`x ${S.ch} ${q}`, INK)] },
        { name: '② 解', hint: '不必移動任何一項', items: [svInk(`x ${S.ch} ${r}`, SV_MUSTARD)], color: SV_MUSTARD }
      ];
    } else {
      rows = [
        { name: '① 原式', hint: `x 旁邊有 ${p > 0 ? '+' : '-'}${ap}`, items: [svInk(`${lhs} ${S.ch} ${q}`, INK)] },
        { name: `② 兩邊同${p > 0 ? '減' : '加'} ${ap}`, hint: '加減不會改變方向',
          items: [svInk(`${lhs} ${op} ${ap} ${S.ch} ${q} ${op} ${ap}`, INK)] },
        { name: '③ 化簡', hint: `x ${S.read} ${r}`, items: [svInk(`x ${S.ch} ${r}`, SV_MUSTARD)], color: SV_MUSTARD }
      ];
    }
    drawStepRows(ctx, rows, rows.length, { top: 156, gap: 58, labX: 22, eqX: 196, size: 22, color: C });

    svSolLine(ctx, 378, [r, 1], key, C, 'line');
    textCenter(ctx, `比 ${r} ${S.up ? '大' : '小'}的數${S.eq ? `和 ${r} 本身` : ''}都是解`, 270, 456, INK, f(700, 14.5));

    const t = r + (S.up ? 1 : -1);
    out.innerHTML = wbrRel(`${lhs} ${S.tex} ${q}`) + '，' + wbrRel(`x ${S.tex} ${r}`);
    const msg = (p === 0
      ? `\\(x\\) 旁邊沒有常數，解直接就是 \\(x ${S.tex} ${r}\\)。`
      : `兩邊同${p > 0 ? '減' : '加'} \\(${ap}\\)，<b style="color:${C}">方向不變</b>，得 \\(x ${S.tex} ${r}\\)。`)
      + `驗算：\\(x = ${t}\\) 時左邊是 \\(${t + p}\\)，\\(${t + p} ${S.tex} ${q}\\) 成立。`;
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  function draw() {
    if (mode === 'pair') drawPair();
    else drawSolve();
  }

  bindPickGroup(modeG, 'data-sh-mode', v => { mode = v; loadMode(); draw(); });
  bindPickGroup(signG, 'data-sh-sign', v => { key = v; draw(); });
  [aS, bS, cS].forEach(s => s.addEventListener('input', draw));
  loadMode();
  draw();
}

/* ==========================================================================
   重點 2、3：倍數放大鏡——兩邊同乘除正數順序不變，負數則左右交換
   同一個引擎，opts.neg 決定按鈕是正數組還是負數組
   ========================================================================== */
const SV_SCALE_K = {
  '2': { f: [2, 1], verb: '乘以', op: '×', tex: '\\times', show: '2' },
  '3': { f: [3, 1], verb: '乘以', op: '×', tex: '\\times', show: '3' },
  '/2': { f: [1, 2], verb: '除以', op: '÷', tex: '\\div', show: '2' },
  '/4': { f: [1, 4], verb: '除以', op: '÷', tex: '\\div', show: '4' },
  '-1': { f: [-1, 1], verb: '乘以', op: '×', tex: '\\times', show: '(-1)' },
  '-2': { f: [-2, 1], verb: '乘以', op: '×', tex: '\\times', show: '(-2)' },
  '-3': { f: [-3, 1], verb: '乘以', op: '×', tex: '\\times', show: '(-3)' },
  '/-2': { f: [-1, 2], verb: '除以', op: '÷', tex: '\\div', show: '(-2)' }
};

function initScaleCanvas(o) {
  const cv = document.getElementById(o.id);
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const pre = o.pre;
  const aS = document.getElementById(`${pre}-a-slider`);
  const bS = document.getElementById(`${pre}-b-slider`);
  const aV = document.getElementById(`${pre}-a-val`);
  const bV = document.getElementById(`${pre}-b-val`);
  const group = document.getElementById(`${pre}-k-group`);
  const out = document.getElementById(`${pre}-formula`);
  const fb = document.getElementById(`${pre}-feedback`);
  const C = SV_TONE[o.tone];
  let kk = o.neg ? '-1' : '2';

  const CH = { 1: '>', '-1': '<', 0: '=' };
  const TX = { 1: '\\gt', '-1': '\\lt', 0: '=' };

  // 數線上的點：標籤是分數元件，分數比較高，標籤中心抬高一點。
  // 兩點很近時由 dx 把兩個標籤往左右推開，不然 3/2 和 1 會疊成「13/2」
  function point(L, y, q, color, label, dx) {
    const v = svVal(q);
    drawDot(ctx, L.px(v), y, color, 7);
    const lift = q[1] === 1 ? 20 : 30;
    const items = label ? [T(label, color)] : [svItem(q, color)];
    drawExpr(ctx, items, clamp(L.px(v) + (dx || 0), 30, 510), y - lift, 15, color, { maxW: 90 });
  }

  function draw() {
    const a = parseInt(aS.value, 10);
    const b = parseInt(bS.value, 10);
    aV.textContent = a;
    bV.textContent = b;
    const K = SV_SCALE_K[kk];
    const A = reduce(a * K.f[0], K.f[1]);
    const B = reduce(b * K.f[0], K.f[1]);
    const r0 = Math.sign(a - b);
    const r1 = svCmp(A, B);
    const flipped = (r0 !== 0 && r0 !== r1);
    const negK = K.f[0] < 0;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `兩邊同${K.verb} ${K.show}，左右順序會交換嗎？`, C);

    const y1 = 110, y2 = 236;
    textLeft(ctx, '原本', 16, y1 - 56, MUTED, f(700, 13));
    textLeft(ctx, `同${K.verb} ${K.show} 之後`, 16, y2 - 62, MUTED, f(700, 13));
    const L1 = numLine(ctx, { x0: 60, x1: 480, y: y1, min: -12, max: 12, labelEvery: 3, font: f(700, 12) });
    const L2 = numLine(ctx, { x0: 60, x1: 480, y: y2, min: -12, max: 12, labelEvery: 3, font: f(700, 12) });
    dashLine(ctx, L1.px(a), y1 + 26, L2.px(svVal(A)), y2 - 12, SV_TOMATO);
    dashLine(ctx, L1.px(b), y1 + 26, L2.px(svVal(B)), y2 - 12, SV_NAVY);

    if (a === b) {
      point(L1, y1, [a, 1], SV_MUSTARD, 'a = b', 0);
      point(L2, y2, A, SV_MUSTARD, null, 0);
    } else {
      const s1 = Math.abs(a - b) <= 1 ? 12 : 0;
      const s2 = Math.abs(svVal(A) - svVal(B)) <= 1.6 ? 18 : 0;
      point(L1, y1, [a, 1], SV_TOMATO, 'a', a < b ? -s1 : s1);
      point(L1, y1, [b, 1], SV_NAVY, 'b', b < a ? -s1 : s1);
      point(L2, y2, A, SV_TOMATO, null, svCmp(A, B) < 0 ? -s2 : s2);
      point(L2, y2, B, SV_NAVY, null, svCmp(B, A) < 0 ? -s2 : s2);
    }

    const rows = [
      { name: '① 原本', hint: r0 === 0 ? '兩個數一樣大' : `a 在 b 的${r0 > 0 ? '右' : '左'}邊`,
        items: [T(`${a} ${CH[r0]} ${b}`, INK)] },
      { name: `② 兩邊同${K.verb} ${K.show}`, hint: negK ? '乘除的數是負數' : '乘除的數是正數',
        items: [T(`${a} ${K.op} ${K.show}   ?   ${b} ${K.op} ${K.show}`, INK)] },
      { name: '③ 算出來', hint: '把兩邊各自算好',
        items: [svItem(A, SV_MUSTARD), T(CH[r1], SV_MUSTARD), svItem(B, SV_MUSTARD)], color: SV_MUSTARD },
      { name: '④ 不等號的方向', hint: r0 === 0 ? '相等仍然相等' : (flipped ? '虛線交叉，順序交換' : '虛線沒有交叉'),
        items: [T(r0 === 0 ? '還是「=」' : (flipped ? `改變：「${CH[r0]}」變「${CH[r1]}」` : `不變：仍然是「${CH[r0]}」`),
          flipped ? SV_TOMATO : SV_MINT)], color: flipped ? SV_TOMATO : SV_MINT }
    ];
    drawStepRows(ctx, rows, 4, { top: 300, gap: 50, labX: 22, eqX: 200, size: 21, color: C });

    out.innerHTML = wbrRel(`${a} ${TX[r0]} ${b}`) + ' → ' + wbrRel(`${svTex(A)} ${TX[r1]} ${svTex(B)}`)
      + (r0 === 0 ? '' : (flipped ? '（方向改變）' : '（方向不變）'));

    let msg;
    if (r0 === 0) {
      msg = `\\(a\\) 和 \\(b\\) 一樣大，${K.verb}任何數之後還是一樣大。把兩個數調成不一樣大再看。`;
    } else if (flipped) {
      msg = `兩條虛線<b style="color:${C}">交叉</b>了：${K.verb}負數會把點翻到 \\(0\\) 的另一邊，原本在右邊的跑到左邊，所以「\\(${TX[r0]}\\)」要改成「\\(${TX[r1]}\\)」。`;
    } else {
      msg = `兩條虛線沒有交叉：${K.verb}正數只是把兩點一起放大或縮小，<b style="color:${C}">左右順序不變</b>，「\\(${TX[r0]}\\)」照舊。`;
    }
    if (r0 !== 0 && (a === 0 || b === 0)) msg += `（\\(0\\) ${K.verb}任何數都還是 \\(0\\)，留在原地。）`;
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(group, `data-${pre}-k`, v => { kk = v; draw(); });
  [aS, bS].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* --------------------------------------------------------------------------
   重點 4～6 共用：解完之後找一個整數驗算
   -------------------------------------------------------------------------- */

// x 〈key〉 k 的解裡，離端點最近的一個整數
function svInsideInt(k, key) {
  const v = svVal(k);
  const S = SV_SIGN[key];
  if (S.up) return (k[1] === 1 && S.eq) ? k[0] : Math.floor(v) + 1;
  return (k[1] === 1 && S.eq) ? k[0] : Math.ceil(v) - 1;
}

// 係數擋下來的情形：畫一塊說明，數值列與回饋一起改寫
function svBlock(ctx, cv, C, title, lines, out, fb, outHtml, fbHtml) {
  ctx.clearRect(0, 0, cv.width, cv.height);
  drawTitle(ctx, title, C);
  drawPanel(ctx, 14, 120, 512, 200, NO_COLOR, 0.1);
  lines.forEach((ln, i) => {
    wrapText(ctx, ln, 270, 170 + i * 56, 470, 20, i === 0 ? NO_COLOR : INK, i === 0 ? 17 : 14.5);
  });
  out.innerHTML = outHtml;
  fb.innerHTML = wrapFeedback(fbHtml);
  typeset([out, fb]);
}

/* ==========================================================================
   重點 4：移項工作台——常數移過去、化簡、係數移過去（負數要變號）
   ========================================================================== */
function initMoveCanvas() {
  const cv = document.getElementById('canvas-move');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const aS = document.getElementById('mv-a-slider');
  const bS = document.getElementById('mv-b-slider');
  const cS = document.getElementById('mv-c-slider');
  const aV = document.getElementById('mv-a-val');
  const bV = document.getElementById('mv-b-val');
  const cV = document.getElementById('mv-c-val');
  const signG = document.getElementById('mv-sign-group');
  const out = document.getElementById('mv-formula');
  const fb = document.getElementById('mv-feedback');
  const C = SV_TONE[3];
  let key = 'ge';

  function draw() {
    const a = parseInt(aS.value, 10);
    const b = parseInt(bS.value, 10);
    const c = parseInt(cS.value, 10);
    aV.textContent = a;
    bV.textContent = b;
    cV.textContent = c;
    const S = SV_SIGN[key];

    if (a === 0) {
      svBlock(ctx, cv, C, '係數 a 是 0',
        ['x 的係數是 0，式子裡已經沒有 x', '這就不是一元一次不等式了。把 a 調成不是 0 的數再看。'],
        out, fb, '\\(a = 0\\)：式子裡沒有 \\(x\\)',
        `\\(a = 0\\) 時 \\(0x = 0\\)，未知數消失了，<b style="color:${C}">不是一元一次不等式</b>。把 \\(a\\) 調開再看。`);
      return;
    }

    const lhs = svLin([[a, 'x'], [b, '']]);
    const ax = svLin([[a, 'x']]);
    const r = c - b;
    const neg = a < 0;
    const key2 = neg ? S.flip : key;
    const S2 = SV_SIGN[key2];
    const k = reduce(r, a);
    const bs = b > 0 ? '+' : '-';
    const bo = b > 0 ? '-' : '+';
    const ab = Math.abs(b);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, neg ? '係數是負數：最後一步要變號' : '係數是正數：每一步都不必變號', C);
    drawEqPanel(ctx, [svInk(`${lhs} ${S.ch} ${c}`, SV_CREAM)], 80, C, { h: 30, size: 30 });

    const rows = [{ name: '① 原式', hint: '先把常數項移到右邊', items: [svInk(`${lhs} ${S.ch} ${c}`, INK)] }];
    if (b !== 0) {
      rows.push({ name: `② 移項：${bs}${ab} 變 ${bo}${ab}`, hint: '加減移過去，方向不變',
        items: [svInk(`${ax} ${S.ch} ${c} ${bo} ${ab}`, INK)] });
      rows.push({ name: '③ 化簡', hint: `${c} ${bo} ${ab} = ${r}`, items: [svInk(`${ax} ${S.ch} ${r}`, INK)] });
    } else {
      rows.push({ name: '② 沒有常數項', hint: '不必移，直接處理係數', items: [svInk(`${ax} ${S.ch} ${r}`, INK)] });
    }
    if (a === 1) {
      rows.push({ name: '④ 係數是 1', hint: 'x 已經單獨在一邊', items: [svInk(`x ${S.ch} ${r}`, SV_MUSTARD)], color: SV_MUSTARD });
    } else {
      const col = neg ? SV_TOMATO : INK;
      rows.push({ name: `④ ×${svPar(a)} 移過去變 ÷${svPar(a)}`, hint: neg ? `除以負數，「${S.ch}」變「${S2.ch}」` : '除以正數，方向不變',
        items: [svInk(`x ${S2.ch} ${r} ÷ ${svPar(a)}`, col)], color: neg ? SV_TOMATO : undefined });
      rows.push({ name: '⑤ 解', hint: `x ${S2.read} ${svMixed(k)}`,
        items: [IT('x', SV_MUSTARD), T(S2.ch, SV_MUSTARD), svItem(k, SV_MUSTARD)], color: SV_MUSTARD });
    }
    rows.forEach((row, i) => { row.name = row.name.replace(/^[①②③④⑤]/, '①②③④⑤'[i]); });
    drawStepRows(ctx, rows, rows.length, { top: 148, gap: 50, labX: 22, eqX: 212, size: 21, color: C });

    svSolLine(ctx, 424, k, key2, C, 'line');

    const t = svInsideInt(k, key2);
    const lv = a * t + b;
    out.innerHTML = wbrRel(`${lhs} ${S.tex} ${c}`) + '，' + wbrRel(`x ${S2.tex} ${svTex(k)}`);
    let msg = neg
      ? `最後把 \\(\\times ${svPar(a)}\\) 移過去，除的是<b style="color:${C}">負數</b>，「\\(${S.tex}\\)」要變成「\\(${S2.tex}\\)」。`
      : (a === 1 ? '係數是 \\(1\\)，移完常數項就解好了。' : `最後除以正數 \\(${a}\\)，方向不變。`);
    msg += `驗算：\\(x = ${t}\\) 時左邊是 \\(${lv}\\)，\\(${lv} ${S.tex} ${c}\\) 成立。`;
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(signG, 'data-mv-sign', v => { key = v; draw(); });
  [aS, bS, cS].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 5：左右搬家台——x 移到左邊或右邊，一條要變號一條不用，解相同
   ========================================================================== */
function initBothCanvas() {
  const cv = document.getElementById('canvas-both');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const S_ = {};
  ['p', 'q', 'r', 't'].forEach(n => {
    S_[n] = { s: document.getElementById(`bo-${n}-slider`), v: document.getElementById(`bo-${n}-val`) };
  });
  const sideG = document.getElementById('bo-side-group');
  const signG = document.getElementById('bo-sign-group');
  const out = document.getElementById('bo-formula');
  const fb = document.getElementById('bo-feedback');
  const C = SV_TONE[4];
  let side = 'left', key = 'gt';

  function draw() {
    const val = {};
    ['p', 'q', 'r', 't'].forEach(n => { val[n] = parseInt(S_[n].s.value, 10); S_[n].v.textContent = val[n]; });
    const { p, q, r, t } = val;
    const S = SV_SIGN[key];
    const L = svLin([[p, 'x'], [q, '']]);
    const R = svLin([[r, 'x'], [t, '']]);

    if (p === r) {
      const always = svHolds([q, 1], key, [t, 1]);
      svBlock(ctx, cv, C, '兩邊 x 的係數一樣',
        ['移項之後 x 會整個消失', `剩下 ${q} ${S.ch} ${t}，${always ? '永遠成立（每個數都是解）' : '永遠不成立（沒有解）'}。這不是一元一次不等式，把 p 或 r 調開。`],
        out, fb, wbrRel(`${L} ${S.tex} ${R}`) + '：\\(x\\) 消失',
        `左右兩邊都是 \\(${svLin([[p, 'x']])}\\)，移項後 \\(x\\) 抵消，<b style="color:${C}">不是一元一次不等式</b>。把 \\(p\\) 或 \\(r\\) 調成不一樣再看。`);
      return;
    }

    // 兩條路線各自算一次，最後的解必須相同
    const cxL = p - r, ccL = t - q;
    const keyL = cxL < 0 ? S.flip : key;
    const kL = reduce(ccL, cxL);
    const cxR = r - p, ccR = q - t;
    const keyR = cxR < 0 ? S.flip : key;          // 得到「k 〈keyR〉 x」
    const keyAns = SV_SIGN[keyR].flip;            // 兩邊對調，讀成 x 在左
    const kR = reduce(ccR, cxR);
    const SA = SV_SIGN[keyL];

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, side === 'left' ? 'x 項移到左邊、常數移到右邊' : 'x 項移到右邊、常數移到左邊', C);
    drawEqPanel(ctx, [svInk(`${L} ${S.ch} ${R}`, SV_CREAM)], 80, C, { h: 30, size: 30 });

    const rows = [{ name: '① 原式', hint: side === 'left' ? '把 x 都搬到左邊' : '把 x 都搬到右邊', items: [svInk(`${L} ${S.ch} ${R}`, INK)] }];
    if (side === 'left') {
      const negL = cxL < 0;
      rows.push({ name: '② 移項', hint: '移過去的項要變號', items: [svInk(`${svLin([[p, 'x'], [-r, 'x']])} ${S.ch} ${svLin([[t, ''], [-q, '']])}`, INK)] });
      rows.push({ name: '③ 化簡', hint: `x 的係數是 ${cxL}`, items: [svInk(`${svLin([[cxL, 'x']])} ${S.ch} ${ccL}`, INK)] });
      if (cxL !== 1) {
        rows.push({ name: `④ 兩邊同除以 ${svPar(cxL)}`, hint: negL ? `除以負數，「${S.ch}」變「${SA.ch}」` : '除以正數，方向不變',
          items: [IT('x', SV_MUSTARD), T(SA.ch, SV_MUSTARD), svItem(kL, SV_MUSTARD)], color: negL ? SV_TOMATO : SV_MUSTARD });
      }
    } else {
      const SR = SV_SIGN[keyR];
      const negR = cxR < 0;
      rows.push({ name: '② 移項', hint: '移過去的項要變號', items: [svInk(`${svLin([[q, ''], [-t, '']])} ${S.ch} ${svLin([[r, 'x'], [-p, 'x']])}`, INK)] });
      rows.push({ name: '③ 化簡', hint: `x 的係數是 ${cxR}`, items: [svInk(`${ccR} ${S.ch} ${svLin([[cxR, 'x']])}`, INK)] });
      if (cxR !== 1) {
        rows.push({ name: `④ 兩邊同除以 ${svPar(cxR)}`, hint: negR ? `除以負數，「${S.ch}」變「${SR.ch}」` : '除以正數，方向不變',
          items: [svItem(kR, INK), T(SR.ch, INK), IT('x', INK)], color: negR ? SV_TOMATO : undefined });
      }
      rows.push({ name: `${cxR !== 1 ? '⑤' : '④'} 讀成 x 在左邊`, hint: '兩邊對調，開口跟著轉',
        items: [IT('x', SV_MUSTARD), T(SV_SIGN[keyAns].ch, SV_MUSTARD), svItem(kR, SV_MUSTARD)], color: SV_MUSTARD });
    }
    drawStepRows(ctx, rows, rows.length, { top: 146, gap: 48, labX: 22, eqX: 200, size: 21, color: C });

    const flipL = cxL < 0, flipR = cxR < 0;
    const other = side === 'left' ? flipR : flipL;
    textCenter(ctx, `換成移到${side === 'left' ? '右' : '左'}邊：${other ? '要變號' : '不必變號'}，解一樣是 x ${SA.ch} ${svMixed(kL)}`,
      270, 392, MUTED, f(700, 14));
    svSolLine(ctx, 436, kL, keyL, C, 'line');

    out.innerHTML = wbrRel(`${L} ${S.tex} ${R}`) + '，' + wbrRel(`x ${SA.tex} ${svTex(kL)}`);
    const mine = side === 'left' ? flipL : flipR;
    let msg = `移到${side === 'left' ? '左' : '右'}邊時，x 的係數是 \\(${side === 'left' ? cxL : cxR}\\)，${mine ? '<b style="color:' + C + '">除以負數要變號</b>' : '除以正數不必變號'}；`;
    msg += `移到${side === 'left' ? '右' : '左'}邊則${other ? '要' : '不必'}變號。<b style="color:${C}">兩條路線的解相同</b>：\\(x ${SA.tex} ${svTex(kL)}\\)。`;
    if (side === 'right') msg += `（\\(${svTex(kR)} ${SV_SIGN[keyR].tex} x\\) 就是 \\(x ${SV_SIGN[keyAns].tex} ${svTex(kR)}\\)。）`;
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(sideG, 'data-bo-side', v => { side = v; draw(); });
  bindPickGroup(signG, 'data-bo-sign', v => { key = v; draw(); });
  ['p', 'q', 'r', 't'].forEach(n => S_[n].s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 6：拆括號檢查站——正確乘開與「只乘第一項」的解比一比，代入一個數分辨對錯
   ========================================================================== */
function initParenCanvas() {
  const cv = document.getElementById('canvas-paren');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const S_ = {};
  ['m', 'n', 'p', 'q'].forEach(n => {
    S_[n] = { s: document.getElementById(`pa-${n}-slider`), v: document.getElementById(`pa-${n}-val`) };
  });
  const methodG = document.getElementById('pa-method-group');
  const signG = document.getElementById('pa-sign-group');
  const out = document.getElementById('pa-formula');
  const fb = document.getElementById('pa-feedback');
  const C = SV_TONE[5];
  let method = 'right', key = 'gt';

  // x 〈key〉 k 包不包含整數 t
  function inSol(t, key2, k) {
    return svHolds([t, 1], key2, k);
  }

  function draw() {
    const val = {};
    ['m', 'n', 'p', 'q'].forEach(n => { val[n] = parseInt(S_[n].s.value, 10); S_[n].v.textContent = val[n]; });
    const { m, n, p, q } = val;
    const S = SV_SIGN[key];
    const R = svLin([[p, 'x'], [q, '']]);
    const mStr = m === 1 ? '' : (m === -1 ? '-' : String(m));
    const L = `${mStr}(${svLin([[1, 'x'], [n, '']])})`;
    const Ltex = `${mStr}\\left(${svLin([[1, 'x'], [n, '']])}\\right)`;

    if (m === 0) {
      svBlock(ctx, cv, C, '括號外的數是 0',
        ['0 乘任何數都是 0，括號整個不見了', '把 m 調成不是 0 的數再看。'],
        out, fb, '\\(m = 0\\)：括號消失', `\\(m = 0\\) 時左邊整個是 \\(0\\)，看不出去括號的步驟。把 \\(m\\) 調開再看。`);
      return;
    }
    const cx = m - p;
    if (cx === 0) {
      svBlock(ctx, cv, C, '移項之後 x 消失了',
        [`左邊乘開是 ${m}x、右邊也是 ${p}x`, '兩邊的 x 抵消，不是一元一次不等式。把 m 或 p 調開。'],
        out, fb, wbrRel(`${Ltex} ${S.tex} ${R}`) + '：\\(x\\) 消失',
        `乘開後兩邊 \\(x\\) 的係數都是 \\(${m}\\)，移項後抵消，<b style="color:${C}">不是一元一次不等式</b>。`);
      return;
    }

    const cstR = m * n;
    const cst = method === 'right' ? cstR : n;
    const key2 = cx < 0 ? S.flip : key;
    const S2 = SV_SIGN[key2];
    const kR = reduce(q - cstR, cx);
    const k = reduce(q - cst, cx);
    const wrong = method === 'wrong';
    const same = wrong && cst === cstR;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, wrong ? '只乘第一項：看看錯在哪裡' : '括號外的數，乘到括號裡的每一項', C);
    drawEqPanel(ctx, [svInk(`${L} ${S.ch} ${R}`, SV_CREAM)], 80, C, { h: 30, size: 30 });

    const rows = [
      { name: '① 原式', hint: '先把括號乘開', items: [svInk(`${L} ${S.ch} ${R}`, INK)] },
      { name: '② 乘開', hint: wrong ? `常數 ${n} 沒有乘到 ${m}（錯）` : `${m} × x、${m} × ${svPar(n)} = ${cstR}`,
        items: [svInk(`${svLin([[m, 'x'], [cst, '']])} ${S.ch} ${R}`, wrong && !same ? SV_TOMATO : INK)], color: wrong && !same ? SV_TOMATO : undefined },
      { name: '③ 移項', hint: 'x 移到左邊、常數移到右邊', items: [svInk(`${svLin([[m, 'x'], [-p, 'x']])} ${S.ch} ${svLin([[q, ''], [-cst, '']])}`, INK)] },
      { name: '④ 化簡', hint: `x 的係數是 ${cx}`, items: [svInk(`${svLin([[cx, 'x']])} ${S.ch} ${q - cst}`, INK)] },
      { name: cx === 1 ? '⑤ 係數是 1' : `⑤ 兩邊同除以 ${svPar(cx)}`, hint: cx < 0 ? `除以負數，「${S.ch}」變「${S2.ch}」` : '除以正數，方向不變',
        items: [IT('x', SV_MUSTARD), T(S2.ch, SV_MUSTARD), svItem(k, SV_MUSTARD)], color: wrong && !same ? SV_TOMATO : SV_MUSTARD }
    ];
    drawStepRows(ctx, rows, 5, { top: 146, gap: 46, labX: 22, eqX: 212, size: 20, color: C });

    // 數線：正確的解畫在線上；錯誤模式另外把錯誤的解畫在上方，兩者一起看
    const y = 412;
    const vR = svVal(kR), vW = svVal(k);
    const lo = Math.min(vR, vW), hi = Math.max(vR, vW);
    const span = Math.max(12, Math.ceil(hi) - Math.floor(lo) + 4);
    const every = span <= 14 ? 1 : (span <= 28 ? 2 : 5);
    const mid = Math.round((lo + hi) / 2);
    const min = Math.floor((mid - span / 2) / every) * every;
    const max = min + Math.ceil(span / every) * every;
    const Lx = numLine(ctx, { x0: 50, x1: 474, y: y, min: min, max: max, labelEvery: every, font: f(700, 12.5) });
    numLineRay(ctx, Lx, y, Lx.px(vR), S2.up, C, 'line');
    numLineEnd(ctx, Lx.px(vR), y, S2.eq, C);
    if (kR[1] !== 1) drawExpr(ctx, [svItem(kR, C)], clamp(Lx.px(vR), 40, 500), y + 52, 16, C, { maxW: 90 });
    // 「正確的解」標在端點的另一側，才不會和分數標籤疊在一起
    textLeft(ctx, '正確的解', Lx.px(vR) < 270 ? 420 : 16, y + 44, C, f(800, 13));
    if (wrong && !same) {
      const yw = y - 34;
      numLineRay(ctx, Lx, yw, Lx.px(vW), S2.up, SV_TOMATO, 'line');
      numLineEnd(ctx, Lx.px(vW), yw, S2.eq, SV_TOMATO);
      textLeft(ctx, '錯誤的解', 16, yw - 18, SV_TOMATO, f(800, 13));
    }

    let test = null;
    if (wrong && !same) {
      for (let tt = Math.floor(lo) - 1; tt <= Math.ceil(hi) + 1; tt++) {
        if (inSol(tt, key2, kR) !== inSol(tt, key2, k)) { test = tt; break; }
      }
    } else {
      test = svInsideInt(kR, key2);
    }
    let checkLine = '';
    let checkTex = '';
    if (test !== null) {
      const lv = m * (test + n), rv = p * test + q;
      const holds = svHolds([lv, 1], key, [rv, 1]);
      const col = holds ? OK_COLOR : NO_COLOR;
      checkLine = `代入 x = ${test}：左邊 ${lv}、右邊 ${rv}，原式${holds ? '成立' : '不成立'}`;
      textCenter(ctx, checkLine, 270, 500, col, f(800, 14.5));
      if (wrong && !same) {
        textCenter(ctx, `${test} ${holds ? '是' : '不是'}解：${holds ? '正確的解包含它，錯誤的解卻漏掉了' : '錯誤的解卻把它算進去了'}`, 270, 524, INK, f(700, 13.5));
      }
      checkTex = `代入 \\(x = ${test}\\)：左邊 \\(${lv}\\)、右邊 \\(${rv}\\)，\\(${lv} ${S.tex} ${rv}\\) ${holds ? '成立' : '不成立'}。`;
    }

    out.innerHTML = wbrRel(`${Ltex} ${S.tex} ${R}`) + '，' + wbrRel(`x ${S2.tex} ${svTex(k)}`) + (wrong && !same ? '（錯誤）' : '');
    let msg;
    if (same) {
      msg = `這組數字剛好看不出差別：${n === 0 ? '括號裡沒有常數' : '括號外是 \\(1\\)'}，只乘第一項也不會出錯。把 \\(n\\) 或 \\(m\\) 換一個數再比。`;
    } else if (wrong) {
      msg = `只乘了 \\(x\\) 會寫成 \\(${svLin([[m, 'x'], [n, '']])}\\)，正確的是 \\(${svLin([[m, 'x'], [cstR, '']])}\\)。錯誤的解是 \\(x ${S2.tex} ${svTex(k)}\\)，正確的是 \\(x ${S2.tex} ${svTex(kR)}\\)。${checkTex}`;
    } else {
      msg = `\\(${m}\\) 要乘到 \\(x\\) 和 \\(${n}\\) 兩項：\\(${m} \\times ${svPar(n)} = ${cstR}\\)。${cx < 0 ? '最後除以負數，<b style="color:' + C + '">記得變號</b>。' : ''}${checkTex}`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(methodG, 'data-pa-method', v => { method = v; draw(); });
  bindPickGroup(signG, 'data-pa-sign', v => { key = v; draw(); });
  ['m', 'n', 'p', 'q'].forEach(n => S_[n].s.addEventListener('input', draw));
  draw();
}

/* --------------------------------------------------------------------------
   重點 7：正確的解與錯誤的解畫在同一條數線上（錯誤的畫在上方一層）
   -------------------------------------------------------------------------- */
function svDualLine(ctx, y, kR, kW, key2, C, style, showWrong) {
  const S2 = SV_SIGN[key2];
  const vR = svVal(kR), vW = svVal(kW);
  const lo = showWrong ? Math.min(vR, vW) : vR;
  const hi = showWrong ? Math.max(vR, vW) : vR;
  const span = Math.max(12, Math.ceil(hi) - Math.floor(lo) + 4);
  const every = span <= 14 ? 1 : (span <= 28 ? 2 : 5);
  const mid = Math.round((lo + hi) / 2);
  const min = Math.floor((mid - span / 2) / every) * every;
  const max = min + Math.ceil(span / every) * every;
  const L = numLine(ctx, { x0: 50, x1: 474, y: y, min: min, max: max, labelEvery: every, font: f(700, 12.5) });
  numLineRay(ctx, L, y, L.px(vR), S2.up, C, style);
  numLineEnd(ctx, L.px(vR), y, S2.eq, C);
  if (kR[1] !== 1) drawExpr(ctx, [svItem(kR, C)], clamp(L.px(vR), 40, 500), y + 52, 16, C, { maxW: 90 });
  if (showWrong) {
    // 錯誤的解一律用直線畫在上方；折線畫法本身會往上抬，錯誤的解要再讓高一點
    const yw = y - (style === 'fold' ? 54 : 34);
    numLineRay(ctx, L, yw, L.px(vW), S2.up, SV_TOMATO, 'line');
    numLineEnd(ctx, L.px(vW), yw, S2.eq, SV_TOMATO);
    textLeft(ctx, '錯誤的解', S2.up ? 16 : 420, yw - 18, SV_TOMATO, f(800, 13));
  }
  return L;
}

function svLcm(a, b) {
  return a / gcd(a, b) * b;
}

/* ==========================================================================
   重點 7：去分母畫解台——同乘最小公倍數（常數項也要乘），解完畫到數線上
   左邊 (x + a)/m + c，右邊 (2x + b)/n
   ========================================================================== */
function initFracCanvas() {
  const cv = document.getElementById('canvas-frac');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const aS = document.getElementById('fr-a-slider');
  const bS = document.getElementById('fr-b-slider');
  const cS = document.getElementById('fr-c-slider');
  const aV = document.getElementById('fr-a-val');
  const bV = document.getElementById('fr-b-val');
  const cV = document.getElementById('fr-c-val');
  const mG = document.getElementById('fr-m-group');
  const nG = document.getElementById('fr-n-group');
  const signG = document.getElementById('fr-sign-group');
  const methodG = document.getElementById('fr-method-group');
  const styleG = document.getElementById('fr-style-group');
  const out = document.getElementById('fr-formula');
  const fb = document.getElementById('fr-feedback');
  const C = SV_TONE[6];
  let m = 2, n = 3, key = 'le', method = 'right', style = 'line';

  function draw() {
    const a = parseInt(aS.value, 10);
    const b = parseInt(bS.value, 10);
    const c = parseInt(cS.value, 10);
    aV.textContent = a;
    bV.textContent = b;
    cV.textContent = c;
    const S = SV_SIGN[key];
    const Lcm = svLcm(m, n);
    const u = Lcm / m, w = Lcm / n;
    const numL = svLin([[1, 'x'], [a, '']]);
    const numR = svLin([[2, 'x'], [b, '']]);
    const cTex = c === 0 ? '' : ` ${c > 0 ? '+' : '-'} ${Math.abs(c)}`;
    const origTex = `\\frac{${numL}}{${m}}${cTex} ${S.tex} \\frac{${numR}}{${n}}`;
    const cx = u - 2 * w;

    if (cx === 0) {
      svBlock(ctx, cv, C, `分母 ${m} 和 ${n}：x 會消失`,
        [`同乘 ${Lcm} 之後，左邊是 ${u}x、右邊是 ${2 * w}x`, '移項後 x 抵消，不是一元一次不等式。換一組分母再看。'],
        out, fb, wbrRel(origTex) + '：\\(x\\) 消失',
        `同乘 \\(${Lcm}\\) 後兩邊 \\(x\\) 的係數都是 \\(${u}\\)，移項後抵消。<b style="color:${C}">換一組分母</b>再看。`);
      return;
    }

    const wrong = method === 'wrong';
    const cstR = Lcm * c;
    const cst = wrong ? c : cstR;
    const same = wrong && c === 0;
    const ccR = w * b - u * a - cstR;
    const cc = w * b - u * a - cst;
    const key2 = cx < 0 ? S.flip : key;
    const S2 = SV_SIGN[key2];
    const kR = reduce(ccR, cx);
    const k = reduce(cc, cx);
    const bad = wrong && !same;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `分母 ${m} 和 ${n} 的最小公倍數是 ${Lcm}`, C);
    const eqItems = [VF(svInk(numL, SV_CREAM), T(String(m), SV_CREAM), SV_CREAM)];
    if (c !== 0) eqItems.push(T(`${c > 0 ? '+' : '-'} ${Math.abs(c)}`, SV_CREAM));
    eqItems.push(T(S.ch, SV_CREAM), VF(svInk(numR, SV_CREAM), T(String(n), SV_CREAM), SV_CREAM));
    drawEqPanel(ctx, eqItems, 88, C, { h: 40, size: 26 });

    const uStr = u === 1 ? '' : String(u);
    const wStr = w === 1 ? '' : String(w);
    const cPart = c === 0 ? '' : ` ${cst > 0 ? '+' : '-'} ${Math.abs(cst)}`;
    const rows = [
      { name: `① 兩邊同乘 ${Lcm}`, hint: bad ? `常數 ${c} 忘了乘 ${Lcm}（錯）` : `${Lcm} 是正數，方向不變；每一項都乘`,
        items: [svInk(`${uStr}(${numL})${cPart} ${S.ch} ${wStr}(${numR})`, bad ? SV_TOMATO : INK)], color: bad ? SV_TOMATO : undefined },
      { name: '② 乘開', hint: '分子有兩項，括號裡都要乘', items: [svInk(`${svLin([[u, 'x'], [u * a, ''], [cst, '']])} ${S.ch} ${svLin([[2 * w, 'x'], [w * b, '']])}`, INK)] },
      { name: '③ 移項、化簡', hint: `x 的係數是 ${cx}`, items: [svInk(`${svLin([[cx, 'x']])} ${S.ch} ${cc}`, INK)] },
      { name: cx === 1 ? '④ 係數是 1' : `④ 兩邊同除以 ${svPar(cx)}`, hint: cx < 0 ? `除以負數，「${S.ch}」變「${S2.ch}」` : '除以正數，方向不變',
        items: [IT('x', SV_MUSTARD), T(S2.ch, SV_MUSTARD), svItem(k, SV_MUSTARD)], color: bad ? SV_TOMATO : SV_MUSTARD }
    ];
    drawStepRows(ctx, rows, 4, { top: 162, gap: 50, labX: 22, eqX: 206, size: 20, color: C });

    const y = 424;
    svDualLine(ctx, y, kR, k, key2, C, style, bad);

    // 代入一個數：錯誤模式挑「兩個解一個包含、一個不包含」的整數
    let t = null;
    if (bad) {
      const lo = Math.min(svVal(kR), svVal(k)), hi = Math.max(svVal(kR), svVal(k));
      for (let tt = Math.floor(lo) - 1; tt <= Math.ceil(hi) + 1; tt++) {
        if (svHolds([tt, 1], key2, kR) !== svHolds([tt, 1], key2, k)) { t = tt; break; }
      }
    } else {
      t = svInsideInt(kR, key2);
    }
    let checkTex = '';
    if (t !== null) {
      const lq = reduce(t + a + c * m, m);
      const rq = reduce(2 * t + b, n);
      const holds = svHolds(lq, key, rq);
      textCenter(ctx, `代入 x = ${t}：左邊 ${svMixed(lq)}、右邊 ${svMixed(rq)}，原式${holds ? '成立' : '不成立'}`,
        270, 514, holds ? OK_COLOR : NO_COLOR, f(800, 14));
      if (bad) textCenter(ctx, `${t} ${holds ? '是解，錯誤的解卻漏掉它' : '不是解，錯誤的解卻包含它'}`, 270, 538, INK, f(700, 13.5));
      checkTex = `代入 \\(x = ${t}\\)：左邊 \\(${svTex(lq)}\\)、右邊 \\(${svTex(rq)}\\)，原式${holds ? '成立' : '不成立'}。`;
    }

    out.innerHTML = wbrRel(origTex) + '，' + wbrRel(`x ${S2.tex} ${svTex(k)}`) + (bad ? '（錯誤）' : '');
    let msg;
    if (same) {
      msg = `\\(c = 0\\) 時沒有常數項，忘不忘記乘都一樣。把 \\(c\\) 調成不是 \\(0\\)，再比較正確與錯誤的解。`;
    } else if (bad) {
      msg = `常數項 \\(${c}\\) 沒有乘 \\(${Lcm}\\)，解變成 \\(x ${S2.tex} ${svTex(k)}\\)；正確的是 \\(x ${S2.tex} ${svTex(kR)}\\)。${checkTex}`;
    } else {
      msg = `同乘 \\(${Lcm}\\)（正數）不變號，<b style="color:${C}">常數項 ${c === 0 ? '' : '\\(' + c + '\\) '}也要乘</b>。${cx < 0 ? '最後除以負數要變號。' : ''}端點${S2.eq ? '實心' : '空心'}、往${S2.up ? '右' : '左'}。${checkTex}`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(mG, 'data-fr-m', v => { m = parseInt(v, 10); draw(); });
  bindPickGroup(nG, 'data-fr-n', v => { n = parseInt(v, 10); draw(); });
  bindPickGroup(signG, 'data-fr-sign', v => { key = v; draw(); });
  bindPickGroup(methodG, 'data-fr-method', v => { method = v; draw(); });
  bindPickGroup(styleG, 'data-fr-style', v => { style = v; draw(); });
  [aS, bS, cS].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 8：整數挑選器——「至少」取最小整數、「最多」取最大整數，和四捨五入比一比
   ========================================================================== */
function initIntCanvas() {
  const cv = document.getElementById('canvas-int');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const kS = document.getElementById('it-k-slider');
  const kV = document.getElementById('it-k-val');
  const signG = document.getElementById('it-sign-group');
  const out = document.getElementById('it-formula');
  const fb = document.getElementById('it-feedback');
  const C = SV_TONE[7];
  let key = 'ge';

  function draw() {
    const raw = parseInt(kS.value, 10);
    const k = reduce(raw, 4);
    const kv = raw / 4;
    const ks = numStr(kv);
    kV.textContent = ks;
    const S = SV_SIGN[key];
    const ask = S.up ? '至少' : '最多';
    const ext = S.up ? '最小' : '最大';
    const ans = svInsideInt(k, key);
    const rnd = Math.round(kv);
    const rndOk = svHolds([rnd, 1], key, k);
    const isInt = (k[1] === 1);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `解是 x ${S.ch} ${ks}，題目問「${ask}」`, C);

    const y = 150;
    const c0 = Math.floor(kv);
    const L = numLine(ctx, { x0: 60, x1: 470, y: y, min: c0 - 4, max: c0 + 5, font: f(700, 14) });
    numLineRay(ctx, L, y, L.px(kv), S.up, C, 'line');
    numLineEnd(ctx, L.px(kv), y, S.eq, C);
    if (!isInt) textCenter(ctx, ks, L.px(kv), y + 42, C, f(900, 15));

    // 每一個整數：是解就填滿，不是解畫空圈
    for (let t = c0 - 4; t <= c0 + 5; t++) {
      const ok = svHolds([t, 1], key, k);
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = ok ? OK_COLOR : DIM;
      ctx.fillStyle = ok ? OK_COLOR : 'rgba(15,23,42,0.6)';
      ctx.beginPath();
      ctx.arc(L.px(t), y - 30, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.strokeStyle = SV_MUSTARD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(L.px(ans), y - 30, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    textCenter(ctx, `${ask} ${ans}`, clamp(L.px(ans), 50, 490), y - 60, SV_MUSTARD, f(900, 15));
    // 四捨五入的結果：數線下方的小三角形
    const rc = rndOk ? OK_COLOR : NO_COLOR;
    ctx.save();
    ctx.fillStyle = rc;
    ctx.beginPath();
    ctx.moveTo(L.px(rnd), y + 58);
    ctx.lineTo(L.px(rnd) - 7, y + 70);
    ctx.lineTo(L.px(rnd) + 7, y + 70);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    textCenter(ctx, `四捨五入 ${rnd}`, clamp(L.px(rnd), 60, 480), y + 84, rc, f(800, 13));

    const list = S.up ? `${ans}、${ans + 1}、${ans + 2}、⋯` : `⋯、${ans - 2}、${ans - 1}、${ans}`;
    let rndText, rndCol;
    if (rnd === ans) { rndText = `剛好也是 ${ans}，但這是巧合`; rndCol = SV_MUSTARD; }
    else if (!rndOk) { rndText = `${rnd} 根本不是解`; rndCol = NO_COLOR; }
    else { rndText = `${rnd} 是解，但不是${ext}的`; rndCol = NO_COLOR; }
    const rows = [
      { name: '① 解出來', hint: `題目問「${ask}」`, items: [svInk(`x ${S.ch} ${ks}`, INK)] },
      { name: `② 符合的整數`, hint: `由${S.up ? '小到大' : '大到小'}列出來`, items: [T(list, INK)] },
      { name: `③ 取${ext}的整數`, hint: isInt ? (S.eq ? `${ks} 本身包含在解內` : `${ks} 本身不包含`) : `${ks} 不是整數`,
        items: [T(`${ask} ${ans}`, SV_MUSTARD)], color: SV_MUSTARD },
      { name: '④ 和四捨五入比', hint: `四捨五入得 ${rnd}`, items: [T(rndText, rndCol)], color: rndCol }
    ];
    drawStepRows(ctx, rows, 4, { top: 272, gap: 48, labX: 22, eqX: 200, size: 19, color: C });
    textCenter(ctx, S.up ? `例：至少要存幾天才夠買票 → ${ans} 天` : `例：最多可以買幾枚代幣 → ${ans} 枚`, 270, 462, INK, f(700, 14.5));

    out.innerHTML = wbrRel(`x ${S.tex} ${ks}`) + `，${ask} \\(${ans}\\)`;
    let msg = `解是 \\(x ${S.tex} ${ks}\\)，符合的整數裡${ext}的是 <b style="color:${C}">\\(${ans}\\)</b>。`;
    if (isInt) msg += S.eq ? `端點 \\(${ks}\\) 有等號，本身就算。` : `端點 \\(${ks}\\) 沒有等號，本身不算，要${S.up ? '往上' : '往下'}找下一個整數。`;
    else if (rnd !== ans) msg += `四捨五入得 \\(${rnd}\\)，${rndOk ? `雖然是解，卻不是${ext}的` : '<b style="color:' + C + '">它根本不是解</b>'}——取整數不能四捨五入。`;
    else msg += `這次四捨五入剛好也是 \\(${ans}\\)，把端點調成 \\(${numStr(c0 + (S.up ? 0.25 : 0.75))}\\) 試試看就不一樣了。`;
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(signG, 'data-it-sign', v => { key = v; draw(); });
  kS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 9：點心站價目表——(已買 + x) × 折扣 ≤ 預算，解完回到表上逐項篩選
   ========================================================================== */
const SV_MENU = [['雞蛋糕', 40], ['熱狗', 55], ['玉米杯', 60], ['薯條', 65], ['可麗餅', 75], ['霜淇淋', 80]];
const SV_DISC_NAME = { 10: '不打折', 9: '九折', 8: '八折' };

function initMenuCanvas() {
  const cv = document.getElementById('canvas-menu');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const boughtG = document.getElementById('mn-bought-group');
  const discG = document.getElementById('mn-disc-group');
  const ruleG = document.getElementById('mn-rule-group');
  const bS = document.getElementById('mn-b-slider');
  const bV = document.getElementById('mn-b-val');
  const out = document.getElementById('mn-formula');
  const fb = document.getElementById('mn-feedback');
  const C = SV_TONE[8];
  const bought = new Set([1, 4]);
  let disc = 9, rule = 'diff';

  function draw() {
    const B = parseInt(bS.value, 10);
    bV.textContent = B;
    const list = SV_MENU.map((it, i) => i).filter(i => bought.has(i));
    const sum = list.reduce((s, i) => s + SV_MENU[i][1], 0);
    const dStr = numStr(disc / 10);
    // (sum + x) × disc/10 ≤ B  ⇔  x ≤ (10B − disc·sum) / disc
    const lim = reduce(10 * B - disc * sum, disc);
    const status = SV_MENU.map(([, price], i) => {
      if (rule === 'diff' && bought.has(i)) return 'had';
      return (sum + price) * disc <= 10 * B ? 'ok' : 'over';
    });
    const okNames = SV_MENU.filter((it, i) => status[i] === 'ok').map(it => it[0]);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, list.length ? `已經買了 ${list.length} 份，第 ${list.length + 1} 份可以選什麼？` : '還沒買，第 1 份可以選什麼？', C);

    // 價目表
    drawPanel(ctx, 14, 46, 512, 290, SV_MUSTARD, 0.06);
    textLeft(ctx, `園區點心站（今日${SV_DISC_NAME[disc]}）`, 30, 66, SV_MUSTARD, f(800, 14));
    SV_MENU.forEach(([name, price], i) => {
      const cy = 102 + i * 40;
      const st = status[i];
      const col = st === 'ok' ? OK_COLOR : (st === 'had' ? MUTED : NO_COLOR);
      textLeft(ctx, name, 36, cy, bought.has(i) ? SV_CREAM : INK, f(700, 16));
      textLeft(ctx, `${price} 元`, 170, cy, INK, f(700, 16));
      if (bought.has(i)) textLeft(ctx, '（已買）', 250, cy, SV_MUSTARD, f(700, 14));
      drawChip(ctx, 400, cy - 14, 110, 28, st === 'ok' ? '可以選' : (st === 'had' ? '買過了' : '太貴'), col, 'rgba(15,23,42,0.55)');
    });

    const sumExpr = list.map(i => SV_MENU[i][1]).join(' + ');
    const inner = list.length ? `${sumExpr} + x` : 'x';
    const lhs = disc === 10 ? inner : (list.length ? `(${inner}) × ${dStr}` : `x × ${dStr}`);
    const lhsTex = disc === 10 ? inner : (list.length ? `(${inner}) \\times ${dStr}` : `x \\times ${dStr}`);
    const limItems = [IT('x', SV_MUSTARD), T('≤', SV_MUSTARD), svItem(lim, SV_MUSTARD)];
    if (lim[1] !== 1) limItems.push(T(`≈ ${numStr(svVal(lim))}`, MUTED));
    const rows = [
      { name: '① 列式', hint: '「不超過」包含等於，用 ≤', items: [svInk(`${lhs} ≤ ${B}`, INK)] },
      { name: '② 解出上限', hint: disc === 10 ? '常數移到右邊' : `兩邊同除以 ${dStr}（正數）`, items: limItems },
      { name: '③ 回到價目表', hint: rule === 'diff' ? '扣掉已經買過的' : '買過的也可以再買',
        items: [T(okNames.length === SV_MENU.length ? `六種都可以選：共 ${okNames.length} 種`
          : (okNames.length ? `${okNames.join('、')}：共 ${okNames.length} 種` : '一種都買不起'), okNames.length ? SV_MUSTARD : NO_COLOR)],
        color: SV_MUSTARD }
    ];
    drawStepRows(ctx, rows, 3, { top: 380, gap: 56, labX: 22, eqX: 196, size: 19, color: C });

    // 括號裡的加項也要能斷行：wbrRel 只在不等號前斷開，買了四、五份時整段括號在 414px 放不下
    const prices = list.map(i => SV_MENU[i][1]);
    let lhsHtml;
    if (!prices.length) {
      lhsHtml = `\\( x ${disc === 10 ? '' : `\\times ${dStr}`} \\)`;
    } else {
      const open = disc === 10 ? '' : '(';
      const close = disc === 10 ? '' : `) \\times ${dStr}`;
      lhsHtml = `\\( ${open}${prices[0]} \\)`
        + prices.slice(1).map(v => `<wbr>\\( {}+ ${v} \\)`).join('')
        + `<wbr>\\( {}+ x${close} \\)`;
    }
    out.innerHTML = lhsHtml + `<wbr>\\( {}\\le ${B} \\)` + '，' + wbrRel(`x \\le ${svTex(lim)}`) + `，共 ${okNames.length} 種`;
    let msg;
    const edge = SV_MENU.findIndex(([, price]) => (sum + price) * disc === 10 * B);
    if (svVal(lim) < SV_MENU[0][1]) {
      msg = `上限只有 \\(${svTex(lim)}\\) 元，比最便宜的 \\(40\\) 元還少，<b style="color:${C}">一種都買不起</b>。把預算調高或少買一份。`;
    } else {
      msg = `價錢不超過 \\(${svTex(lim)}\\) 元的品項都買得起${rule === 'diff' && list.length ? '，但已經買過的要扣掉' : ''}，共 <b style="color:${C}">\\(${okNames.length}\\)</b> 種。`;
      if (edge >= 0 && status[edge] === 'ok') msg += `${SV_MENU[edge][0]}剛好花到 \\(${B}\\) 元——「不超過」包含剛好等於，<b style="color:${C}">可以選</b>。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  boughtG.querySelectorAll('.pick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.getAttribute('data-mn-item'), 10);
      if (bought.has(i)) bought.delete(i);
      else bought.add(i);
      btn.classList.toggle('active', bought.has(i));
      draw();
    });
  });
  bindPickGroup(discG, 'data-mn-disc', v => { disc = parseInt(v, 10); draw(); });
  bindPickGroup(ruleG, 'data-mn-rule', v => { rule = v; draw(); });
  bS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 10：門檻比價台——原本數量的總價 > 門檻數量的總價，至少取最小整數
   ========================================================================== */
const SV_OFF_NAME = { 90: '九折', 85: '八五折', 80: '八折', 75: '七五折', 70: '七折', 60: '六折' };
const SV_TIER_LOW = 10;

function initTierCanvas() {
  const cv = document.getElementById('canvas-tier');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const d1G = document.getElementById('tr-d1-group');
  const d2G = document.getElementById('tr-d2-group');
  const nG = document.getElementById('tr-n-group');
  const pS = document.getElementById('tr-p-slider');
  const xS = document.getElementById('tr-x-slider');
  const pV = document.getElementById('tr-p-val');
  const xV = document.getElementById('tr-x-val');
  const out = document.getElementById('tr-formula');
  const fb = document.getElementById('tr-feedback');
  const C = SV_TONE[9];
  let d1 = 90, d2 = 70, N = 20;

  function bar(y, label, val, maxV, color) {
    textLeft(ctx, label, 22, y, color, f(800, 14));
    const x0 = 196, W = 250;
    const w = Math.max(3, W * val / maxV);
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.55;
    roundRect(ctx, x0, y - 12, w, 24, 6);
    ctx.fill();
    ctx.restore();
    textLeft(ctx, `${numStr(val)} 元`, Math.min(x0 + w + 8, 460), y, color, f(800, 14));
  }

  function draw() {
    const p = parseInt(pS.value, 10);
    const x = parseInt(xS.value, 10);
    pV.textContent = p;
    xV.textContent = x;
    const s1 = numStr(d1 / 100), s2 = numStr(d2 / 100);
    const cost1 = p * d1 * x / 100;
    const cost2 = p * d2 * N / 100;
    const k = reduce(d2 * N, d1);                  // d1·x > d2·N ⇔ x > k
    let ans = Math.max(svInsideInt(k, 'gt'), SV_TIER_LOW);
    const none = ans > N - 1;
    const cmp = Math.sign(d1 * x - d2 * N);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `原本買 ${x} 個，還是直接買 ${N} 個？`, C);
    const maxV = Math.max(p * d1 * (N - 1), p * d2 * N) / 100 * 1.02;
    bar(66, `買 ${x} 個（${SV_OFF_NAME[d1]}）`, cost1, maxV, SV_TOMATO);
    bar(102, `買 ${N} 個（${SV_OFF_NAME[d2]}）`, cost2, maxV, SV_NAVY);
    const verdict = cmp > 0 ? `直接買 ${N} 個反而便宜` : (cmp === 0 ? '兩種剛好一樣貴，不算「反而便宜」' : `買 ${x} 個比較便宜`);
    const vcol = cmp > 0 ? OK_COLOR : (cmp === 0 ? SV_MUSTARD : NO_COLOR);
    drawChip(ctx, 100, 128, 340, 30, verdict, vcol, 'rgba(15,23,42,0.55)');

    // 範圍內的每一個數量：綠色是「買 N 個反而便宜」
    const cnt = N - SV_TIER_LOW;
    const cw = 470 / cnt;
    textLeft(ctx, `原本想買 ${SV_TIER_LOW}～${N - 1} 個：綠色的數量改買 ${N} 個比較划算`, 22, 184, MUTED, f(700, 13));
    for (let i = 0; i < cnt; i++) {
      const q = SV_TIER_LOW + i;
      const c = Math.sign(d1 * q - d2 * N);
      ctx.save();
      ctx.fillStyle = c > 0 ? OK_COLOR : (c === 0 ? SV_MUSTARD : 'rgba(148,163,184,0.25)');
      ctx.globalAlpha = c > 0 ? 0.75 : 1;
      roundRect(ctx, 34 + i * cw + 1, 200, cw - 2, 24, 4);
      ctx.fill();
      ctx.restore();
      if (q % 5 === 0) textCenter(ctx, String(q), 34 + i * cw + cw / 2, 236, MUTED, f(700, 12));
    }
    ctx.save();
    ctx.strokeStyle = SV_MUSTARD;
    ctx.lineWidth = 3;
    roundRect(ctx, 34 + (x - SV_TIER_LOW) * cw - 1, 197, cw + 2, 30, 5);
    ctx.stroke();
    ctx.restore();

    const kItems = [IT('x', SV_MUSTARD), T('>', SV_MUSTARD), svItem(k, SV_MUSTARD)];
    if (k[1] !== 1) kItems.push(T(`≈ ${numStr(svVal(k))}`, MUTED));
    const rows = [
      { name: `① 原本買 x 個`, hint: `${SV_TIER_LOW} 個以上打${SV_OFF_NAME[d1]}`, items: [svInk(`${p} × ${s1} × x`, INK)] },
      { name: `② 直接買 ${N} 個`, hint: `${N} 個以上打${SV_OFF_NAME[d2]}`, items: [T(`${p} × ${s2} × ${N} = ${numStr(cost2)}`, INK)] },
      { name: '③ 反而便宜', hint: '原本的比較貴，不含相等', items: [svInk(`${p} × ${s1} × x > ${numStr(cost2)}`, INK)] },
      { name: '④ 解', hint: `兩邊同除以 ${numStr(p * d1 / 100)}（正數）`, items: kItems },
      { name: '⑤ 至少', hint: `整數，而且在 ${SV_TIER_LOW}～${N - 1} 之間`,
        items: [T(none ? '範圍內沒有這樣的數量' : `至少 ${ans} 個`, none ? NO_COLOR : SV_MUSTARD)], color: SV_MUSTARD }
    ];
    drawStepRows(ctx, rows, 5, { top: 276, gap: 48, labX: 22, eqX: 196, size: 19, color: C });

    out.innerHTML = wbrRel(`${p} \\times ${s1} \\times x \\gt ${p} \\times ${s2} \\times ${N}`) + '，' + wbrRel(`x \\gt ${svTex(k)}`)
      + (none ? '' : `，至少 \\(${ans}\\) 個`);
    let msg;
    if (cmp === 0) {
      msg = `買 \\(${x}\\) 個和買 \\(${N}\\) 個剛好都是 \\(${numStr(cost1)}\\) 元，<b style="color:${C}">一樣貴不算「反而便宜」</b>，所以不等式不含等號，答案要再往上一個。`;
    } else {
      msg = `單價 \\(${p}\\) 元在兩邊都有，兩邊同除掉也不影響答案。從 <b style="color:${C}">\\(${ans}\\) 個</b>開始，直接買 \\(${N}\\) 個比較便宜。`;
      msg += cmp > 0 ? `現在的 \\(${x}\\) 個就是這種情形。` : `現在的 \\(${x}\\) 個還是原本比較便宜。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(d1G, 'data-tr-d1', v => { d1 = parseInt(v, 10); draw(); });
  bindPickGroup(d2G, 'data-tr-d2', v => { d2 = parseInt(v, 10); draw(); });
  bindPickGroup(nG, 'data-tr-n', v => {
    N = parseInt(v, 10);
    xS.max = N - 1;
    if (parseInt(xS.value, 10) > N - 1) xS.value = N - 1;
    draw();
  });
  [pS, xS].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 11：彈珠量杯——放 n1 顆沒滿、放 n2 顆溢出，兩個條件夾出範圍
   ========================================================================== */
function initCupCanvas() {
  const cv = document.getElementById('canvas-cup');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const n1G = document.getElementById('cp-n1-group');
  const addG = document.getElementById('cp-add-group');
  const sS = document.getElementById('cp-s-slider');
  const xS = document.getElementById('cp-x-slider');
  const sV = document.getElementById('cp-s-val');
  const xV = document.getElementById('cp-x-val');
  const out = document.getElementById('cp-formula');
  const fb = document.getElementById('cp-feedback');
  const C = SV_TONE[10];
  let n1 = 4, add = 2;

  // 一個杯子：底部固定的水，上方的空間代表「還能裝 S」，彈珠讓水位上升
  function cup(cx, count, vol, S, title) {
    const top = 74, bot = 236, w = 116, water0 = 52;
    const room = bot - water0 - top;              // 代表 S 的高度
    const rise = Math.min(1, vol / S) * room;
    const over = vol > S;
    ctx.save();
    ctx.fillStyle = 'rgba(103, 232, 249, 0.28)';
    ctx.fillRect(cx - w / 2 + 3, bot - water0 - rise, w - 6, water0 + rise);
    if (over) {
      ctx.fillStyle = 'rgba(103, 232, 249, 0.55)';
      [[-1, 18], [1, 30], [-1, 44], [1, 12]].forEach(([s, dy]) => {
        ctx.beginPath();
        ctx.ellipse(cx + s * (w / 2 + 10), top + dy, 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    // 彈珠：每排 4 顆
    for (let i = 0; i < count; i++) {
      const r = i % 4, row = Math.floor(i / 4);
      ctx.fillStyle = [SV_TOMATO, SV_MUSTARD, SV_NAVY, SV_MINT][i % 4];
      ctx.beginPath();
      ctx.arc(cx - 39 + r * 26, bot - 14 - row * 24, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, top);
    ctx.lineTo(cx - w / 2, bot);
    ctx.lineTo(cx + w / 2, bot);
    ctx.lineTo(cx + w / 2, top);
    ctx.stroke();
    dashLine(ctx, cx - w / 2, bot - water0, cx + w / 2, bot - water0, MUTED, [4, 4]);
    ctx.restore();
    textCenter(ctx, title, cx, top - 16, INK, f(800, 14));
  }

  function draw() {
    const S = parseInt(sS.value, 10);
    const x = parseInt(xS.value, 10);
    sV.textContent = S;
    xV.textContent = x;
    const n2 = n1 + add;
    const v1 = n1 * x, v2 = n2 * x;
    const ok1 = v1 < S, ok2 = v2 > S;
    const lo = reduce(S, n2), hi = reduce(S, n1);
    const inside = ok1 && ok2;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `猜一顆 ${x} 立方公分：兩個條件都成立嗎？`, C);
    cup(140, n1, v1, S, `放 ${n1} 顆：共 ${v1}`);
    cup(400, n2, v2, S, `放 ${n2} 顆：共 ${v2}`);
    const t1 = v1 < S ? '沒滿 ✔' : (v1 === S ? '剛好滿 ✘' : '已經溢出 ✘');
    const t2 = v2 > S ? '溢出 ✔' : (v2 === S ? '剛好滿，沒溢出 ✘' : '沒溢出 ✘');
    drawChip(ctx, 60, 246, 160, 28, t1, ok1 ? OK_COLOR : NO_COLOR, 'rgba(15,23,42,0.55)');
    drawChip(ctx, 310, 246, 180, 28, t2, ok2 ? OK_COLOR : NO_COLOR, 'rgba(15,23,42,0.55)');
    textCenter(ctx, `虛線以上還能裝 ${S} 毫升`, 270, 290, MUTED, f(700, 13));

    const rows = [
      { name: `① 放 ${n1} 顆沒滿`, hint: `${n1}x < ${S}`, items: [IT('x', INK), T('<', INK), svItem(hi, INK)] },
      { name: `② 放 ${n2} 顆溢出`, hint: `${n2}x > ${S}`, items: [IT('x', INK), T('>', INK), svItem(lo, INK)] },
      { name: '③ 兩個同時成立', hint: '夾在中間，兩端都不含',
        items: [svItem(lo, SV_MUSTARD), T('<', SV_MUSTARD), IT('x', SV_MUSTARD), T('<', SV_MUSTARD), svItem(hi, SV_MUSTARD)], color: SV_MUSTARD }
    ];
    drawStepRows(ctx, rows, 3, { top: 330, gap: 50, labX: 22, eqX: 196, size: 20, color: C });

    const vlo = svVal(lo), vhi = svVal(hi);
    const min = Math.floor((Math.min(vlo, x) - 4) / 5) * 5;
    const max = Math.ceil((Math.max(vhi, x) + 4) / 5) * 5;
    const every = (max - min) > 40 ? 10 : 5;
    const y = 505;
    const L = numLine(ctx, { x0: 50, x1: 474, y: y, min: min, max: max, tick: 5, labelEvery: every, font: f(700, 12.5) });
    numLineSeg(ctx, y, L.px(vlo), L.px(vhi), C, 'line');
    numLineEnd(ctx, L.px(vlo), y, false, C);
    numLineEnd(ctx, L.px(vhi), y, false, C);
    const mc = inside ? OK_COLOR : NO_COLOR;
    ctx.save();
    ctx.fillStyle = mc;
    ctx.beginPath();
    ctx.moveTo(L.px(x), y - 12);
    ctx.lineTo(L.px(x) - 7, y - 25);
    ctx.lineTo(L.px(x) + 7, y - 25);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    textCenter(ctx, `x = ${x}`, clamp(L.px(x), 40, 500), y - 36, mc, f(800, 13));

    out.innerHTML = wbrRel(`${n1}x \\lt ${S}`) + '，' + wbrRel(`${n2}x \\gt ${S}`) + '，' + wbrRel(`${svTex(lo)} \\lt x \\lt ${svTex(hi)}`);
    let msg;
    if (inside) {
      msg = `\\(${n1} \\times ${x} = ${v1} \\lt ${S}\\) 沒滿，\\(${n2} \\times ${x} = ${v2} \\gt ${S}\\) 溢出，<b style="color:${C}">兩個都成立</b>，所以 \\(${x}\\) 在範圍裡。`;
    } else if (v1 === S || v2 === S) {
      msg = `放 \\(${v1 === S ? n1 : n2}\\) 顆剛好是 \\(${S}\\)，<b style="color:${C}">剛好滿</b>——既不是「沒滿」也不是「溢出」，所以範圍的兩端都不含等號。`;
    } else if (!ok1) {
      msg = `放 \\(${n1}\\) 顆就有 \\(${v1}\\)，已經超過 \\(${S}\\)，和「水沒有滿」矛盾。彈珠要比 \\(${svTex(hi)}\\) 小。`;
    } else {
      msg = `放 \\(${n2}\\) 顆只有 \\(${v2}\\)，還不到 \\(${S}\\)，和「水溢出」矛盾。彈珠要比 \\(${svTex(lo)}\\) 大。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(n1G, 'data-cp-n1', v => { n1 = parseInt(v, 10); draw(); });
  bindPickGroup(addG, 'data-cp-add', v => { add = parseInt(v, 10); draw(); });
  [sS, xS].forEach(s => s.addEventListener('input', draw));
  draw();
}
