/* ==========================================================================
   4-1 認識一元一次不等式 — 互動 Canvas 與隨堂評量
   畫風：復古遊樂園海報（網版印刷，番茄紅／薄荷綠／芥末黃／深海軍藍）

   共用工具在 ../math-canvas.js（T／IT／VF／FR／SEQ／drawExpr／drawStepRows／
   drawPanel／drawChip／drawEqPanel／axisArrow／wrapFeedback／numStr／
   wbrRel／numLine 系列／textCenter／textLeft…），
   本檔只放本節專屬的色票、不等號工具，以及 8 個互動。

   ⚠️ 本節所有 LaTeX 的不等號一律寫 \lt、\gt、\le、\ge：寫成 < 的話，
   innerHTML 會把「<x」這類字串當成標籤開頭，整段算式直接消失。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initGateCanvas();
  initDefCanvas();
  initWordCanvas();
  initBudgetCanvas();
  initRangeCanvas();
  initSubCanvas();
  initRayCanvas();
  initSegCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具
   ========================================================================== */

// 遊樂園海報的四個印刷色（IQ_ = Inequality；共用檔沒有這個前綴的符號）
const IQ_TOMATO = '#fb7185';
const IQ_MINT = '#5eead4';
const IQ_MUSTARD = '#fcd34d';
const IQ_NAVY = '#93c5fd';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const IQ_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af',
                 '#6ee7b7', '#d8b4fe', '#fdba74', '#f9a8d4'];

// 四個不等號：up 為 true 是「大於」那一族，eq 為 true 是含等號
const IQ_SIGN = {
  gt: { ch: '>', tex: '\\gt', read: '大於', eq: false, up: true },
  ge: { ch: '≥', tex: '\\ge', read: '大於或等於', eq: true, up: true },
  lt: { ch: '<', tex: '\\lt', read: '小於', eq: false, up: false },
  le: { ch: '≤', tex: '\\le', read: '小於或等於', eq: true, up: false }
};

// 「v 〈不等號〉 a」成不成立。本節的數都是整數或 0.5 的倍數，先四捨五入到千分位再比
function iqHolds(v, key, a) {
  const d = Math.round((v - a) * 1000) / 1000;
  const s = IQ_SIGN[key];
  if (d === 0) return s.eq;
  return s.up ? d > 0 : d < 0;
}

// 需要括號的位置（乘號後面、減號後面）：負數加括號
function iqPar(v) {
  return v < 0 ? `(${numStr(v)})` : numStr(v);
}

// 算式字串 → canvas 元件：單一小寫英文字母（x、y、a）走斜體，其餘照原樣
function iqInk(s, color) {
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

// 一組互斥按鈕的 active 狀態，改由程式切換（切換情境時要把按鈕歸位）
function iqSetActive(groupEl, attr, value) {
  if (!groupEl) return;
  groupEl.querySelectorAll('.pick-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute(attr) === String(value));
  });
}

/* --------------------------------------------------------------------------
   數線工具：numLine／numLineEnd／numLineRay／numLineSeg 在 ../math-canvas.js
   -------------------------------------------------------------------------- */

// 試驗點：數線下方的向上三角形與標籤
function iqProbe(ctx, x, y, label, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 8, y + 13);
  ctx.lineTo(x + 8, y + 13);
  ctx.closePath();
  ctx.fill();
  ctx.font = f(800, 13.5);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(label, clamp(x, 40, 500), y + 16);
  ctx.restore();
}

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第二冊 4-1 的 16 題正解
  // 正解字母分布：A 4 題、B 4 題、C 4 題、D 4 題（開發約束 36）
  const answers = {
    '4-1-1': 'B',    // x ≥ 125：只有剛好 125 公分的可以
    '4-1-2': 'D',    // -4 ≥ -3 不成立
    '4-1-3': 'C',    // 3y - 1 ≤ 8 是一元一次不等式
    '4-1-4': 'D',    // m/4 - 1 > 2 是一元一次不等式
    '4-1-5': 'B',    // 不少於 → ≥
    '4-1-6': 'C',    // 「不到」不含等號
    '4-1-7': 'D',    // 400 - 3x ≥ 85
    '4-1-8': 'A',    // 還可以找錢：4x < 1000
    '4-1-9': 'C',    // 95 ≤ h ≤ 135
    '4-1-10': 'A',   // -5 < 3x + 1 ≤ 10
    '4-1-11': 'B',   // 4x - 9 ≥ 5 的解：3.5 和 6
    '4-1-12': 'C',   // x = -2 代入 -4x - 3 ≥ 5：5 ≥ 5 成立
    '4-1-13': 'A',   // x ≤ 17/3：實心，5 與 6 之間，向左
    '4-1-14': 'D',   // 空心 -6、向右：x > -6
    '4-1-15': 'B',   // 空心 -7、實心 -2：-7 < x ≤ -2
    '4-1-16': 'A'    // -13/4 ≤ x < 6 的正整數解 1～5，共 5 個
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
   重點 1：身高量測門——≥ 是「> 或 =」，有一個成立就算
   ========================================================================== */
function initGateCanvas() {
  const cv = document.getElementById('canvas-gate');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const aS = document.getElementById('hg-a-slider');
  const hS = document.getElementById('hg-h-slider');
  const aV = document.getElementById('hg-a-val');
  const hV = document.getElementById('hg-h-val');
  const out = document.getElementById('hg-formula');
  const fb = document.getElementById('hg-feedback');
  const group = document.getElementById('hg-sign-group');
  const C = IQ_TONE[0];
  let key = 'ge';

  const RULE = {
    ge: a => `規定：身高 ${a} 公分以上（含）才能搭乘`,
    gt: a => `規定：身高超過 ${a} 公分才能搭乘`,
    le: a => `規定：身高 ${a} 公分以下（含）才能搭乘`,
    lt: a => `規定：身高未滿 ${a} 公分才能搭乘`
  };

  // 左側的量身高立牌：115～165 公分
  const V0 = 115, V1 = 165, BASE = 350, PXU = 5.2;
  const ry = v => BASE - (v - V0) * PXU;

  function board(a, h) {
    drawPanel(ctx, 14, ry(V1) - 18, 186, BASE - ry(V1) + 24, IQ_NAVY, 0.06);
    ctx.save();
    // 刻度尺
    ctx.strokeStyle = MUTED;
    ctx.fillStyle = MUTED;
    ctx.lineWidth = 1.5;
    ctx.font = f(700, 12.5);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.beginPath();
    ctx.moveTo(62, ry(V0));
    ctx.lineTo(62, ry(V1));
    ctx.stroke();
    for (let v = V0; v <= V1; v += 5) {
      const w = (v % 10 === 0) ? 10 : 5;
      ctx.beginPath();
      ctx.moveTo(62 - w, ry(v));
      ctx.lineTo(62, ry(v));
      ctx.stroke();
      if (v % 10 === 0) ctx.fillText(String(v), 48, ry(v));
    }
    // 小朋友：頭頂剛好落在身高 h 的刻度上
    const top = ry(h), cx = 104;
    ctx.fillStyle = IQ_MINT;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(cx, top + 13, 13, 0, Math.PI * 2);
    ctx.fill();
    roundRect(ctx, cx - 19, top + 30, 38, BASE - top - 30, 10);
    ctx.fill();
    ctx.globalAlpha = 1;
    // 規定的橫桿
    ctx.strokeStyle = IQ_TOMATO;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(62, ry(a));
    ctx.lineTo(190, ry(a));
    ctx.stroke();
    ctx.fillStyle = IQ_TOMATO;
    ctx.font = f(800, 13);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`規定 ${a}`, 132, ry(a) - 5);
    ctx.restore();
    textCenter(ctx, `x = ${h} 公分`, 104, BASE + 20, IQ_MINT, f(800, 14));
  }

  function stepBox(y, title, items, ok) {
    const x = 212, w = 314, hgt = 92;
    const col = (ok == null) ? MUTED : (ok ? OK_COLOR : NO_COLOR);
    drawPanel(ctx, x, y, w, hgt, col, 0.07);
    textLeft(ctx, title, x + 12, y + 20, C, f(800, 13.5));
    drawExpr(ctx, items, 0, y + 58, 22, INK, { left: x + 14, maxW: 196, gap: 6 });
    if (ok != null) {
      drawChip(ctx, x + w - 90, y + 43, 78, 30, ok ? '成立' : '不成立', col, 'rgba(15,23,42,0.55)');
    }
  }

  function draw() {
    const a = parseInt(aS.value, 10);
    const h = parseInt(hS.value, 10);
    aV.textContent = a;
    hV.textContent = h;
    const S = IQ_SIGN[key];
    const ok = iqHolds(h, key, a);
    const strict = S.up ? h > a : h < a;
    const equal = (h === a);
    const sCh = S.up ? '>' : '<';

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `x = ${h} 時，x ${S.ch} ${a} 成立嗎？`, C);
    board(a, h);

    stepBox(48, `① 比 ${a} ${S.up ? '大' : '小'}嗎？（${sCh}）`, [T(`${h} ${sCh} ${a}`, INK)], strict);
    if (S.eq) {
      stepBox(150, `② 剛好等於 ${a} 嗎？（=）`, [T(`${h} = ${a}`, INK)], equal);
      stepBox(252, `③ ${S.ch} 是「${sCh} 或 =」，一個成立就算`, [T(`${h} ${S.ch} ${a}`, C)], ok);
    } else {
      stepBox(150, `② ${S.ch} 不包含等於`, [T(equal ? `剛好 ${a} 也不算` : '等號不必檢查', MUTED)], null);
      stepBox(252, `③ 只看「${sCh}」這一個`, [T(`${h} ${S.ch} ${a}`, C)], ok);
    }

    const col = ok ? OK_COLOR : NO_COLOR;
    drawPanel(ctx, 14, 384, 512, 84, col, 0.08);
    textCenter(ctx, RULE[key](a), 270, 406, INK, f(700, 14.5));
    drawExpr(ctx, [IT('x', C), T(`${S.ch} ${a}`, C), T('→', MUTED),
      T(`${h} 公分${ok ? '可以搭乘' : '不能搭乘'}`, col)], 270, 444, 22, INK, { maxW: 490, gap: 8 });

    out.innerHTML = wbrRel(`x = ${h}`) + '，' + wbrRel(`${h} ${S.tex} ${a}`) + (ok ? ' 成立' : ' 不成立');

    let msg;
    if (equal && S.eq) {
      msg = `剛好 \\(${a}\\)：「\\(${sCh}\\)」不成立，但「\\(=\\)」成立。\\(${S.tex}\\) 的意思是「\\(${sCh}\\) 或 \\(=\\)」，<b style="color:${C}">只要有一個成立就算成立</b>，所以剛好 \\(${a}\\) 公分也能搭乘。`;
    } else if (equal) {
      msg = `剛好 \\(${a}\\)：\\(${S.tex}\\) 只有「${S.read}」，<b style="color:${C}">不包含等於</b>，所以剛好 \\(${a}\\) 公分不能搭乘。換成 \\(${S.up ? '\\ge' : '\\le'}\\) 比比看。`;
    } else if (ok) {
      msg = `\\(${h} ${S.tex} ${a}\\) 成立，可以搭乘。把身高調到<b style="color:${C}">剛好 \\(${a}\\)</b>，再切換有等號、沒等號的不等號，看結果會不會變。`;
    } else {
      msg = `\\(${h} ${S.tex} ${a}\\) 不成立，不能搭乘。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(group, 'data-hg-sign', v => { key = v; draw(); });
  [aS, hS].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 2：三道檢查閘門——有不等號、只有一種未知數、次數是 1
   ========================================================================== */
// g1／g2／g3：1 通過、0 不通過、-1 不必看
const IQ_DEF_CARDS = [
  { tex: '4x - 7 \\ge 9', items: c => [iqInk('4x - 7 ≥ 9', c)],
    g: [[1, '有「≥」'], [1, '只有 x 一種'], [1, 'x 的次數是 1']], yes: true,
    note: '三道都通過，是一元一次不等式。' },
  { tex: 'x + y \\lt 6', items: c => [iqInk('x + y < 6', c)],
    g: [[1, '有「<」'], [0, '有 x、y 兩種未知數'], [1, 'x、y 的次數都是 1']], yes: false,
    note: '有 x、y 兩種未知數，是「二元」一次不等式。' },
  { tex: '3x^2 \\le 12', items: c => [iqInk('3x² ≤ 12', c)],
    g: [[1, '有「≤」'], [1, '只有 x 一種'], [0, 'x² 是 x 的 2 次方']], yes: false,
    note: 'x 的次數是 2，是「一元二次」不等式，國中不會學到。' },
  { tex: '2x + 5 = 11', items: c => [iqInk('2x + 5 = 11', c)],
    g: [[0, '只有等號「=」'], [1, '只有 x 一種'], [1, 'x 的次數是 1']], yes: false,
    note: '沒有不等號，這是第一冊學過的一元一次「方程式」。' },
  { tex: '-8 \\lt 3', items: c => [iqInk('-8 < 3', c)],
    g: [[1, '有「<」'], [0, '一個未知數都沒有'], [-1, '沒有未知數，談不上次數']], yes: false,
    note: '它是不等式（而且成立），但沒有未知數，不是一元一次不等式。' },
  { tex: '\\frac{x}{2} + 1 \\gt x', items: c => [VF(IT('x', c), T('2', c), c), T('+ 1 >', c), IT('x', c)],
    g: [[1, '有「>」'], [1, 'x 出現兩次，仍然只有 x 一種'], [1, 'x/2 就是 ½ 乘以 x，次數是 1']], yes: true,
    note: '未知數出現兩次、係數是分數，都不影響：三道都通過。' },
  { tex: '5(y - 2) \\ge 0', items: c => [iqInk('5(y - 2) ≥ 0', c)],
    g: [[1, '有「≥」'], [1, '只有 y 一種'], [1, '展開是 5y - 10，次數是 1']], yes: true,
    note: '括號展開後仍是一次，三道都通過。' },
  { tex: 'a \\le -\\frac{3}{4}', items: c => [IT('a', c), T('≤', c), SEQ([T('-', c), FR(3, 4, c)], c, 2)],
    g: [[1, '有「≤」'], [1, '只有 a 一種（不一定要叫 x）'], [1, 'a 的次數是 1']], yes: true,
    note: '未知數用哪個字母都可以，三道都通過。' }
];

function initDefCanvas() {
  const cv = document.getElementById('canvas-def');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const group = document.getElementById('df-card-group');
  const out = document.getElementById('df-formula');
  const fb = document.getElementById('df-feedback');
  const C = IQ_TONE[1];
  let ci = 0;

  const Q = ['有不等號嗎？', '只有一種未知數嗎？（一元）', '未知數的次數是 1 嗎？（一次）'];

  function gate(y, n, q, st, text) {
    const col = st === 1 ? OK_COLOR : (st === 0 ? NO_COLOR : MUTED);
    drawPanel(ctx, 14, y, 512, 74, col, 0.07);
    ctx.save();
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.9;
    roundRect(ctx, 28, y + 17, 40, 40, 10);
    ctx.fill();
    ctx.restore();
    textCenter(ctx, String(n), 48, y + 37, '#0f172a', f(900, 20));
    textLeft(ctx, q, 84, y + 25, C, f(800, 15));
    textLeft(ctx, text, 84, y + 52, INK, f(600, 14));
    drawChip(ctx, 424, y + 22, 90, 30, st === 1 ? '通過' : (st === 0 ? '不通過' : '不必看'), col, 'rgba(15,23,42,0.55)');
  }

  function draw() {
    const cd = IQ_DEF_CARDS[ci];
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '三道檢查：它是一元一次不等式嗎？', C);
    drawEqPanel(ctx, cd.items(IQ_CREAM_INK), 88, C, { h: 34, size: 32 });

    cd.g.forEach((g, i) => gate(142 + i * 84, i + 1, Q[i], g[0], g[1]));

    const col = cd.yes ? OK_COLOR : NO_COLOR;
    drawPanel(ctx, 14, 400, 512, 60, col, 0.12);
    textCenter(ctx, cd.yes ? '✔ 是一元一次不等式' : '✘ 不是一元一次不等式', 270, 419, col, f(900, 17));
    textCenter(ctx, cd.note, 270, 444, INK, f(600, 13.5));

    out.innerHTML = `\\(${cd.tex}\\)` + (cd.yes ? ' 是一元一次不等式' : ' 不是一元一次不等式');
    fb.innerHTML = wrapFeedback(cd.note + (cd.yes
      ? `三道檢查缺一不可：<b style="color:${C}">有不等號、只有一種未知數、次數是 1</b>。`
      : `只要有一道沒通過，就不是一元一次不等式。`));
    typeset([out, fb]);
  }

  bindPickGroup(group, 'data-df-card', v => { ci = parseInt(v, 10); draw(); });
  draw();
}

// 算式卡片上的字色（淺奶油色，在深色底板上最清楚）
const IQ_CREAM_INK = '#fef3c7';

/* ==========================================================================
   重點 3：字詞翻譯台——先問「哪一邊」，再問「剛好等於算不算」
   ========================================================================== */
const IQ_WORDS = [
  { w: '超過', key: 'gt', why: '要比 A 大；剛好 A 還沒有超過' },
  { w: '高於', key: 'gt', why: '要比 A 高；剛好 A 不算高於' },
  { w: '未滿', key: 'lt', why: '要比 A 小；剛好 A 就已經「滿」了' },
  { w: '不足', key: 'lt', why: '要比 A 少；剛好 A 已經足夠' },
  { w: '至少', key: 'ge', why: '最少是 A，比 A 多也可以' },
  { w: '不低於', key: 'ge', why: '「不低於」＝高於或剛好等於 A' },
  { w: '以上（含）', key: 'ge', why: '括號寫明「含」，A 本身也算' },
  { w: '至多', key: 'le', why: '最多是 A，比 A 少也可以' },
  { w: '不超過', key: 'le', why: '「不超過」＝低於或剛好等於 A' },
  { w: '以下（含）', key: 'le', why: '括號寫明「含」，A 本身也算' }
];

function iqWordSentence(wd, a) {
  if (wd.w.indexOf('（含）') >= 0) return ['x 在 ', `${a} `, wd.w, ''];
  if (wd.w === '至少' || wd.w === '至多') return ['x ', '', wd.w, ` 是 ${a}`];
  return ['x ', '', wd.w, ` ${a}`];
}

function initWordCanvas() {
  const cv = document.getElementById('canvas-word');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const group = document.getElementById('wd-word-group');
  const aS = document.getElementById('wd-a-slider');
  const aV = document.getElementById('wd-a-val');
  const out = document.getElementById('wd-formula');
  const fb = document.getElementById('wd-feedback');
  const C = IQ_TONE[2];
  let wi = 0;

  function draw() {
    const a = parseInt(aS.value, 10);
    aV.textContent = a;
    const wd = IQ_WORDS[wi];
    const S = IQ_SIGN[wd.key];
    const sp = iqWordSentence(wd, a);
    const sentence = sp.join('');
    const why = wd.why.replace(/A/g, String(a));

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `「${sentence}」要用哪一個不等號？`, C);
    drawPanel(ctx, 14, 50, 512, 56, C, 0.07);
    drawExpr(ctx, [SEQ([iqInk(sp[0] + sp[1], INK), T(sp[2], C), T(sp[3], INK)], INK, 0)], 270, 78, 24, INK, { maxW: 480 });

    // 數線：a 左右各 4 格，並試 a − 1、a、a + 1 三個數
    const y = 184;
    const L = numLine(ctx, { x0: 60, x1: 470, y: y, min: a - 4, max: a + 4 });
    numLineRay(ctx, L, y, L.px(a), S.up, C, 'line');
    numLineEnd(ctx, L.px(a), y, S.eq, C);
    [a - 1, a, a + 1].forEach(v => {
      const ok = iqHolds(v, wd.key, a);
      const col = ok ? OK_COLOR : NO_COLOR;
      ctx.save();
      ctx.fillStyle = 'rgba(15,23,42,0.75)';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(L.px(v), y - 42, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      textCenter(ctx, ok ? '✔' : '✘', L.px(v), y - 42, col, f(900, 15));
    });

    drawStepRows(ctx, [
      { name: '① 哪一邊符合？', hint: `試 ${a - 1} 和 ${a + 1}`,
        items: [T(S.up ? `比 ${a} 大的數` : `比 ${a} 小的數`, C)], color: C },
      { name: `② 剛好 ${a} 算嗎？`, hint: S.eq ? `包含 ${a} 本身` : `不包含 ${a} 本身`,
        items: [T(S.eq ? `算，要包含 ${a}` : `不算，不含 ${a}`, C)], color: C },
      { name: '③ 寫成不等式', hint: `${S.up ? '大於' : '小於'}${S.eq ? '＋含等號' : '，不含等號'}`,
        items: [IT('x', IQ_MUSTARD), T(`${S.ch} ${a}`, IQ_MUSTARD)], color: IQ_MUSTARD }
    ], 3, { top: 282, gap: 56, labX: 22, eqX: 200, size: 21, color: C });

    wrapText(ctx, `「${wd.w}」：${why}`, 270, 450, 490, 18, INK, 14);

    out.innerHTML = `「${sentence}」：` + wbrRel(`x ${S.tex} ${a}`);
    fb.innerHTML = wrapFeedback(
      `「${wd.w}」寫成 \\(${S.tex}\\)。先看<b style="color:${C}">方向</b>：符合的數比 \\(${a}\\) ${S.up ? '大' : '小'}；再看<b style="color:${C}">端點</b>：剛好 \\(${a}\\) ${S.eq ? '也算，所以要有等號' : '不算，所以不能有等號'}。`
    );
    typeset([out, fb]);
  }

  bindPickGroup(group, 'data-wd-word', v => { wi = parseInt(v, 10); draw(); });
  aS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 4：園區預算台——把兩個要比的量寫出來，再由關鍵詞決定不等號
   ========================================================================== */
const IQ_BUDGET = [
  { name: '錢不夠', key: 'gt', kw: '錢不夠', xName: '每份熱狗 x 元',
    p: { label: '買幾份', min: 2, max: 5, step: 1, val: 3 },
    q: { label: '帶了多少元', min: 100, max: 300, step: 10, val: 200 },
    x: { label: '試一個價錢 x（元）', min: 20, max: 120, step: 5, val: 60 } },
  { name: '錢足夠', key: 'ge', kw: '足夠', xName: '原有 x 元',
    p: { label: '哥哥給幾元', min: 50, max: 200, step: 10, val: 120 },
    q: { label: '通票幾元', min: 300, max: 500, step: 20, val: 400 },
    x: { label: '試一個 x（元）', min: 150, max: 450, step: 10, val: 260 } },
  { name: '還可以找錢', key: 'lt', kw: '還可以找錢', xName: '每杯汽水 x 元',
    p: { label: '買幾杯', min: 2, max: 5, step: 1, val: 4 },
    q: { label: '付了多少元', min: 100, max: 300, step: 10, val: 150 },
    x: { label: '試一個價錢 x（元）', min: 10, max: 100, step: 5, val: 30 } },
  { name: '平均超過', key: 'gt', kw: '平均超過 80 分', xName: '第三局 x 分',
    p: { label: '第一局得分', min: 60, max: 90, step: 2, val: 74 },
    q: { label: '第二局得分', min: 60, max: 90, step: 2, val: 86 },
    x: { label: '試一個 x（分）', min: 50, max: 100, step: 1, val: 82 } }
];

function initBudgetCanvas() {
  const cv = document.getElementById('canvas-budget');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const group = document.getElementById('bg-case-group');
  const S_ = {};
  ['p', 'q', 'x'].forEach(k => {
    S_[k] = {
      s: document.getElementById(`bg-${k}-slider`),
      v: document.getElementById(`bg-${k}-val`),
      n: document.getElementById(`bg-${k}-name`)
    };
  });
  const out = document.getElementById('bg-formula');
  const fb = document.getElementById('bg-feedback');
  const C = IQ_TONE[3];
  let ci = 0;

  function loadCase() {
    const cs = IQ_BUDGET[ci];
    ['p', 'q', 'x'].forEach(k => {
      const d = cs[k], el = S_[k];
      el.s.min = d.min;
      el.s.max = d.max;
      el.s.step = d.step;
      el.s.value = d.val;
      el.n.textContent = d.label;
    });
  }

  // 一條長條：標籤、長度、數值
  function bar(y, label, val, maxV, color) {
    const x0 = 150, W = 330;
    textLeft(ctx, label, 22, y, color, f(800, 14));
    const w = Math.max(3, W * val / maxV);
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.55;
    roundRect(ctx, x0, y - 12, w, 24, 6);
    ctx.fill();
    ctx.restore();
    textLeft(ctx, numStr(val), Math.min(x0 + w + 8, 488), y, color, f(800, 15));
  }

  function draw() {
    const cs = IQ_BUDGET[ci];
    const p = parseInt(S_.p.s.value, 10);
    const q = parseInt(S_.q.s.value, 10);
    const x = parseInt(S_.x.s.value, 10);
    S_.p.v.textContent = p;
    S_.q.v.textContent = q;
    S_.x.v.textContent = x;
    const S = IQ_SIGN[cs.key];

    let story, compare, rel, ineqItems, ineqTex, lv, rv, lName, rName, lNum, rNum;
    if (ci === 0) {
      story = `帶了 ${q} 元，想買 ${p} 份每份 x 元的熱狗，付錢時發現錢不夠。`;
      compare = [iqInk(`需要 ${p}x 元`, INK), T('、', MUTED), T(`帶了 ${q} 元`, INK)];
      rel = '需要的錢 > 帶的錢';
      ineqItems = [iqInk(`${p}x > ${q}`, IQ_MUSTARD)];
      ineqTex = `${p}x \\gt ${q}`;
      lNum = p * x; rNum = q; lName = `需要 ${p}x`; rName = '帶的錢';
    } else if (ci === 1) {
      story = `身上原有 x 元，哥哥再給 ${p} 元，就足夠買一張 ${q} 元的遊園通票。`;
      compare = [iqInk(`共有 (x + ${p}) 元`, INK), T('、', MUTED), T(`通票 ${q} 元`, INK)];
      rel = '有的錢 ≥ 通票價錢';
      ineqItems = [iqInk(`x + ${p} ≥ ${q}`, IQ_MUSTARD)];
      ineqTex = `x + ${p} \\ge ${q}`;
      lNum = x + p; rNum = q; lName = `有 x + ${p}`; rName = '通票';
    } else if (ci === 2) {
      story = `用 ${q} 元買 ${p} 杯每杯 x 元的汽水，還可以找錢。`;
      compare = [iqInk(`花掉 ${p}x 元`, INK), T('、', MUTED), T(`付了 ${q} 元`, INK)];
      rel = '花掉的錢 < 付的錢';
      ineqItems = [iqInk(`${p}x < ${q}`, IQ_MUSTARD)];
      ineqTex = `${p}x \\lt ${q}`;
      lNum = p * x; rNum = q; lName = `花掉 ${p}x`; rName = '付的錢';
    } else {
      story = `射水槍遊戲玩三局，前兩局得 ${p} 分和 ${q} 分，第三局得 x 分，三局平均超過 80 分。`;
      compare = [T('三局平均', INK), VF(iqInk(`${p} + ${q} + x`, INK), T('3', INK), INK), T('、', MUTED), T('80 分', INK)];
      rel = '三局平均 > 80';
      ineqItems = [VF(iqInk(`${p} + ${q} + x`, IQ_MUSTARD), T('3', IQ_MUSTARD), IQ_MUSTARD), T('> 80', IQ_MUSTARD)];
      ineqTex = `\\frac{${p} + ${q} + x}{3} \\gt 80`;
      // 平均與 80 比，等價於總分與 240 比（避免小數誤差）
      lNum = p + q + x; rNum = 240; lName = '三局總分'; rName = '80 × 3';
    }
    lv = lNum; rv = rNum;
    const ok = iqHolds(lv, cs.key, rv);
    const equal = (lv === rv);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `情境「${cs.name}」寫成不等式`, C);
    wrapText(ctx, story, 270, 64, 500, 19, INK, 14.5);

    drawStepRows(ctx, [
      { name: '① 設未知數', hint: '題目裡的 x 是什麼', items: [iqInk(cs.xName, INK)], color: C },
      { name: '② 要比的兩個量', hint: '都寫成含 x 的式子', items: compare, color: C },
      { name: '③ 關鍵詞', hint: `「${cs.kw}」`, items: [T(rel, C)], color: C },
      { name: '④ 列出不等式', hint: '不需化簡', items: ineqItems, color: IQ_MUSTARD }
    ], 4, { top: 124, gap: 52, labX: 22, eqX: 190, size: 19, color: C });

    // 試一個數：兩條長條比長短
    const col = ok ? OK_COLOR : NO_COLOR;
    drawPanel(ctx, 14, 330, 512, 160, col, 0.06);
    textLeft(ctx, ci === 3 ? `試一個：第三局 x = ${x} 分` : `試一個：x = ${x}`, 26, 352, IQ_MUSTARD, f(800, 14.5));
    const maxV = Math.max(lv, rv) * 1.12;
    bar(388, lName, lv, maxV, IQ_TOMATO);
    bar(422, rName, rv, maxV, IQ_NAVY);
    const sitText = ci === 3
      ? (ok ? '平均真的超過 80 分' : '平均沒有超過 80 分')
      : (ci === 0 ? (ok ? '錢真的不夠' : '錢其實夠用')
        : (ci === 1 ? (ok ? '錢真的足夠' : '錢還不夠')
          : (ok ? '真的可以找錢' : '沒有錢可以找')));
    drawChip(ctx, 26, 450, 200, 30, `情境：${sitText}`, col, 'rgba(15,23,42,0.55)');
    drawChip(ctx, 240, 450, 274, 30, `不等式${ok ? '成立' : '不成立'}（兩者一致）`, col, 'rgba(15,23,42,0.55)');

    out.innerHTML = wbrRel(ineqTex) + `；\\(x = ${x}\\) 時${ok ? '成立' : '不成立'}`;

    let msg;
    if (equal) {
      const EQ = [
        `\\(x = ${x}\\) 時需要剛好 \\(${q}\\) 元——錢剛好夠，<b style="color:${C}">不算「不夠」</b>，所以用 \\(\\gt\\)，不能用 \\(\\ge\\)。`,
        `\\(x = ${x}\\) 時剛好 \\(${q}\\) 元，買得起——<b style="color:${C}">「足夠」包含剛好</b>，所以用 \\(\\ge\\)。`,
        `\\(x = ${x}\\) 時剛好花完 \\(${q}\\) 元，<b style="color:${C}">沒有錢可以找</b>，所以用 \\(\\lt\\)，不能用 \\(\\le\\)。`,
        `三局總分剛好 \\(240\\)，平均剛好 \\(80\\) 分，<b style="color:${C}">沒有「超過」</b>，所以用 \\(\\gt\\)。`
      ];
      msg = EQ[ci];
    } else {
      msg = `\\(x = ${x}\\) 時，${lName} 是 \\(${numStr(lv)}\\)、${rName} 是 \\(${numStr(rv)}\\)：情境${ok ? '成立' : '不成立'}，不等式也${ok ? '成立' : '不成立'}。把 \\(x\\) 調到兩條長條<b style="color:${C}">一樣長</b>，看看關鍵詞到底包不包含等於。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(group, 'data-bg-case', v => { ci = parseInt(v, 10); loadCase(); draw(); });
  ['p', 'q', 'x'].forEach(k => S_[k].s.addEventListener('input', draw));
  loadCase();
  draw();
}

/* ==========================================================================
   重點 5：上下限看板——兩端各自決定含不含等號，兩個條件同時成立
   ========================================================================== */
function initRangeCanvas() {
  const cv = document.getElementById('canvas-range');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const aS = document.getElementById('rg-a-slider');
  const bS = document.getElementById('rg-b-slider');
  const xS = document.getElementById('rg-x-slider');
  const aV = document.getElementById('rg-a-val');
  const bV = document.getElementById('rg-b-val');
  const xV = document.getElementById('rg-x-val');
  const loG = document.getElementById('rg-lo-group');
  const hiG = document.getElementById('rg-hi-group');
  const out = document.getElementById('rg-formula');
  const fb = document.getElementById('rg-feedback');
  const C = IQ_TONE[4];
  let lo = 1, hi = 0;

  function draw() {
    const a = parseInt(aS.value, 10);
    const b = parseInt(bS.value, 10);
    const x = parseInt(xS.value, 10);
    aV.textContent = a;
    bV.textContent = b;
    xV.textContent = x;
    const k1 = lo ? 'le' : 'lt';   // a ? x
    const k2 = hi ? 'le' : 'lt';   // x ? b
    const s1 = IQ_SIGN[k1], s2 = IQ_SIGN[k2];
    const loText = lo ? `${a} 公分以上（含）` : `超過 ${a} 公分`;
    const hiText = hi ? `${b} 公分以下（含）` : `未滿 ${b} 公分`;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '上下限看板：兩個條件要同時成立', C);
    drawPanel(ctx, 14, 48, 512, 50, C, 0.07);
    textCenter(ctx, `規定：身高 ${loText}，而且${hiText}`, 270, 73, INK, f(700, 15.5));

    if (a >= b) {
      drawPanel(ctx, 14, 130, 512, 130, NO_COLOR, 0.1);
      textCenter(ctx, '下限不小於上限，這個範圍不成立', 270, 170, NO_COLOR, f(900, 18));
      wrapText(ctx, `沒有任何身高能同時「${lo ? '至少' : '超過'} ${a}」又「${hi ? '至多' : '未滿'} ${b}」。把上限調高，或把下限調低。`, 270, 220, 470, 20, INK, 14.5);
      out.innerHTML = `下限 \\(${a}\\)、上限 \\(${b}\\)：範圍不成立`;
      fb.innerHTML = wrapFeedback(`下限 \\(${a}\\) 公分不小於上限 \\(${b}\\) 公分，兩個條件不可能同時成立。<b style="color:${C}">把上限調到比下限高</b>再看。`);
      typeset([out, fb]);
      return;
    }

    drawStepRows(ctx, [
      { name: '① 下限', hint: lo ? '「以上（含）」要有等號' : '「超過」不含等號',
        items: [T(`${a} ${s1.ch}`, C), IT('x', C)], color: C },
      { name: '② 上限', hint: hi ? '「以下（含）」要有等號' : '「未滿」不含等號',
        items: [IT('x', C), T(`${s2.ch} ${b}`, C)], color: C },
      { name: '③ 連寫成一條', hint: '兩個不等號方向相同',
        items: [T(`${a} ${s1.ch}`, IQ_MUSTARD), IT('x', IQ_MUSTARD), T(`${s2.ch} ${b}`, IQ_MUSTARD)], color: IQ_MUSTARD }
    ], 3, { top: 132, gap: 54, labX: 22, eqX: 200, size: 22, color: C });

    // 身高尺：95～165 公分
    const y = 330;
    const L = numLine(ctx, { x0: 44, x1: 474, y: y, min: 95, max: 165, tick: 5, labelEvery: 10, font: f(700, 12.5) });
    numLineSeg(ctx, y, L.px(a), L.px(b), C, 'line');
    numLineEnd(ctx, L.px(a), y, !!lo, C);
    numLineEnd(ctx, L.px(b), y, !!hi, C);
    const ok1 = iqHolds(x, k1 === 'le' ? 'ge' : 'gt', a);
    const ok2 = iqHolds(x, k2, b);
    const ok = ok1 && ok2;
    const col = ok ? OK_COLOR : NO_COLOR;
    ctx.save();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(L.px(x), y - 10);
    ctx.lineTo(L.px(x) - 8, y - 24);
    ctx.lineTo(L.px(x) + 8, y - 24);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    textCenter(ctx, `x = ${x}`, clamp(L.px(x), 40, 500), y - 36, col, f(800, 13.5));

    drawPanel(ctx, 14, 382, 512, 90, col, 0.07);
    const c1 = ok1 ? OK_COLOR : NO_COLOR, c2 = ok2 ? OK_COLOR : NO_COLOR;
    drawChip(ctx, 26, 398, 150, 30, `${a} ${s1.ch} ${x}  ${ok1 ? '✔' : '✘'}`, c1, 'rgba(15,23,42,0.55)');
    textCenter(ctx, '而且', 200, 413, MUTED, f(800, 14));
    drawChip(ctx, 224, 398, 150, 30, `${x} ${s2.ch} ${b}  ${ok2 ? '✔' : '✘'}`, c2, 'rgba(15,23,42,0.55)');
    drawChip(ctx, 390, 398, 124, 30, ok ? '符合規定' : '不符合', col, 'rgba(15,23,42,0.55)');
    textCenter(ctx, ok ? '兩個都成立，才算符合' : '只要有一個不成立，就不符合', 270, 452, INK, f(600, 14));

    out.innerHTML = wbrRel(`${a} ${s1.tex} x ${s2.tex} ${b}`) + `；\\(x = ${x}\\) ${ok ? '符合' : '不符合'}`;

    let msg;
    if (x === a || x === b) {
      const atLo = (x === a);
      const inc = atLo ? lo : hi;
      msg = `剛好在${atLo ? '下限' : '上限'} \\(${x}\\)：${atLo ? (lo ? '「以上（含）」' : '「超過」') : (hi ? '「以下（含）」' : '「未滿」')}${inc ? '包含它，要用 \\(\\le\\)' : '不包含它，要用 \\(\\lt\\)'}。<b style="color:${C}">兩端各自判斷</b>，不一定相同。`;
    } else if (ok) {
      msg = `\\(${a} ${s1.tex} ${x}\\) 與 \\(${x} ${s2.tex} ${b}\\) <b style="color:${C}">兩個都成立</b>，才符合規定。`;
    } else {
      msg = `\\(${a} ${s1.tex} ${x}\\) ${ok1 ? '成立' : '不成立'}，\\(${x} ${s2.tex} ${b}\\) ${ok2 ? '成立' : '不成立'}——<b style="color:${C}">只要有一個不成立就不符合</b>。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(loG, 'data-rg-lo', v => { lo = parseInt(v, 10); draw(); });
  bindPickGroup(hiG, 'data-rg-hi', v => { hi = parseInt(v, 10); draw(); });
  [aS, bS, xS].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 6：代入檢驗機——代入、算左邊、和右邊比；試過的數留在數線上
   ========================================================================== */
const IQ_SUB = [
  { tex: '2x + 1 \\gt 6', ink: '2x + 1 > 6', key: 'gt', r: 6, a: 2, b: 1,
    s: v => `2 × ${iqPar(v)} + 1`, t: v => `2 \\times ${iqPar(v)} + 1` },
  { tex: '5 - x \\ge 2', ink: '5 - x ≥ 2', key: 'ge', r: 2, a: -1, b: 5,
    s: v => `5 - ${iqPar(v)}`, t: v => `5 - ${iqPar(v)}` },
  { tex: '3x - 4 \\le 5', ink: '3x - 4 ≤ 5', key: 'le', r: 5, a: 3, b: -4,
    s: v => `3 × ${iqPar(v)} - 4`, t: v => `3 \\times ${iqPar(v)} - 4` },
  { tex: '-2x + 3 \\lt 0', ink: '-2x + 3 < 0', key: 'lt', r: 0, a: -2, b: 3,
    s: v => `-2 × ${iqPar(v)} + 3`, t: v => `-2 \\times ${iqPar(v)} + 3` }
];

function initSubCanvas() {
  const cv = document.getElementById('canvas-sub');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const group = document.getElementById('sb-case-group');
  const xS = document.getElementById('sb-x-slider');
  const xV = document.getElementById('sb-x-val');
  const clearBtn = document.getElementById('sb-clear');
  const out = document.getElementById('sb-formula');
  const fb = document.getElementById('sb-feedback');
  const C = IQ_TONE[5];
  let ci = 0;
  const history = IQ_SUB.map(() => new Map());

  function draw() {
    const cs = IQ_SUB[ci];
    const S = IQ_SIGN[cs.key];
    const x = parseInt(xS.value, 10) / 2;
    const xs = numStr(x);
    xV.textContent = xs;
    const lv = cs.a * x + cs.b;
    const ok = iqHolds(lv, cs.key, cs.r);
    const equal = (Math.round(lv * 1000) === cs.r * 1000);
    history[ci].set(x, ok);
    const col = ok ? OK_COLOR : NO_COLOR;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `代入檢驗：x = ${xs} 是不是解？`, C);
    drawEqPanel(ctx, [iqInk(cs.ink, IQ_CREAM_INK)], 80, C, { h: 30, size: 28 });

    drawStepRows(ctx, [
      { name: '① 代入', hint: '把 x 換成這個數，負數加括號', items: [T(cs.s(x), INK)], color: C },
      { name: '② 算出左邊', hint: '先乘除，後加減', items: [T(`= ${numStr(lv)}`, INK)], color: C },
      { name: '③ 和右邊比', hint: `${S.read} ${cs.r} 嗎？`, items: [T(`${numStr(lv)} ${S.ch} ${cs.r}`, col)], color: col },
      { name: '④ 結論', hint: equal ? '剛好相等：看有沒有等號' : (ok ? '不等式成立' : '不等式不成立'),
        items: [T(ok ? `成立，x = ${xs} 是解` : `不成立，x = ${xs} 不是解`, col)], color: col }
    ], 4, { top: 146, gap: 52, labX: 22, eqX: 200, size: 20, color: C });

    // 試過的數
    const y = 384;
    const L = numLine(ctx, { x0: 50, x1: 470, y: y, min: -4, max: 8, font: f(700, 12.5) });
    history[ci].forEach((good, v) => {
      ctx.save();
      ctx.fillStyle = good ? OK_COLOR : NO_COLOR;
      ctx.beginPath();
      ctx.arc(L.px(v), y - 16, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.save();
    ctx.strokeStyle = IQ_MUSTARD;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(L.px(x), y - 16, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    let good = 0, bad = 0;
    history[ci].forEach(g => { if (g) good++; else bad++; });
    textCenter(ctx, `已經試了 ${good + bad} 個數：${good} 個是解、${bad} 個不是（綠點是解）`, 270, 440, INK, f(700, 14));
    textCenter(ctx, '解通常不只一個，小數也可能是解', 270, 464, MUTED, f(600, 13));

    out.innerHTML = wbrRel(`${cs.t(x)} = ${numStr(lv)}`) + '，' + wbrRel(`${numStr(lv)} ${S.tex} ${cs.r}`) + (ok ? ' 成立' : ' 不成立');

    let msg;
    if (equal) {
      msg = `左邊算出來<b style="color:${C}">剛好等於</b>右邊的 \\(${cs.r}\\)。\\(${S.tex}\\) ${S.eq ? '包含等號，所以<b style="color:' + C + '">成立</b>' : '不包含等號，所以<b style="color:' + C + '">不成立</b>'}——剛好相等時，一定要看不等號有沒有等號。`;
    } else if (ok) {
      msg = `\\(x = ${xs}\\) 代入後不等式成立，是解。繼續拉滑桿多試幾個：<b style="color:${C}">解通常不只一個</b>。`;
    } else {
      msg = `\\(x = ${xs}\\) 代入後不等式不成立，不是解。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(group, 'data-sb-case', v => { ci = parseInt(v, 10); draw(); });
  xS.addEventListener('input', draw);
  clearBtn.addEventListener('click', () => { history[ci].clear(); draw(); });
  draw();
}

/* ==========================================================================
   重點 7：數線畫解台（單一不等號）——端點空心或實心、往哪一邊畫
   ========================================================================== */
function initRayCanvas() {
  const cv = document.getElementById('canvas-ray');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const signG = document.getElementById('ry-sign-group');
  const styleG = document.getElementById('ry-style-group');
  const aS = document.getElementById('ry-a-slider');
  const tS = document.getElementById('ry-t-slider');
  const aV = document.getElementById('ry-a-val');
  const tV = document.getElementById('ry-t-val');
  const out = document.getElementById('ry-formula');
  const fb = document.getElementById('ry-feedback');
  const C = IQ_TONE[6];
  let key = 'ge', style = 'line';

  function draw() {
    const S = IQ_SIGN[key];
    const a = parseInt(aS.value, 10) / 2;
    const t = parseInt(tS.value, 10) / 2;
    const as = numStr(a), ts = numStr(t);
    aV.textContent = as;
    tV.textContent = ts;
    const ok = iqHolds(t, key, a);
    const col = ok ? OK_COLOR : NO_COLOR;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `在數線上畫出 x ${S.ch} ${as} 的解`, C);
    drawEqPanel(ctx, [IT('x', IQ_CREAM_INK), T(`${S.ch} ${as}`, IQ_CREAM_INK)], 76, C, { h: 30, size: 30 });

    const y = 172;
    const L = numLine(ctx, { x0: 50, x1: 474, y: y, min: -6, max: 6 });
    numLineRay(ctx, L, y, L.px(a), S.up, C, style);
    numLineEnd(ctx, L.px(a), y, S.eq, C);
    // 端點不是整數時，數線上沒有現成的刻度數字，補寫在下方
    if (!Number.isInteger(a)) textCenter(ctx, as, L.px(a), y + 42, C, f(900, 15));
    iqProbe(ctx, L.px(t), y + 58, `試 x = ${ts}`, IQ_MUSTARD);

    drawStepRows(ctx, [
      { name: '① 端點畫什麼', hint: S.eq ? `有等號：${as} 包含在解內` : `沒有等號：${as} 不包含在解內`,
        items: [T(S.eq ? '實心圓點 ●' : '空心圓圈 ○', C)], color: C },
      { name: '② 往哪一邊畫', hint: S.up ? `比 ${as} 大的數都在右邊` : `比 ${as} 小的數都在左邊`,
        items: [T(S.up ? '往右畫到盡頭 →' : '← 往左畫到盡頭', C)], color: C },
      { name: `③ 檢查 x = ${ts}`, hint: ok ? '這一點在畫出的解上' : '這一點不在畫出的解上',
        items: [T(`${ts} ${S.ch} ${as}`, col), T(ok ? '成立' : '不成立', col)], color: col }
    ], 3, { top: 296, gap: 56, labX: 22, eqX: 212, size: 21, color: C });

    const styleName = style === 'fold' ? '折線畫法' : '直線畫法';
    textCenter(ctx, `目前是${styleName}：兩種畫法表示的解完全相同`, 270, 452, MUTED, f(600, 13.5));

    out.innerHTML = wbrRel(`x ${S.tex} ${as}`) + `：端點${S.eq ? '實心' : '空心'}，往${S.up ? '右' : '左'}`;

    let msg;
    if (t === a) {
      msg = `試驗點剛好在端點 \\(${as}\\) 上：${S.eq ? '實心圓點代表<b style="color:' + C + '">包含</b>，所以成立' : '空心圓圈代表<b style="color:' + C + '">不包含</b>，所以不成立'}。`;
    } else {
      msg = `\\(${ts} ${S.tex} ${as}\\) ${ok ? '成立' : '不成立'}，所以 \\(${ts}\\) ${ok ? '落在' : '不在'}畫出來的線上。<b style="color:${C}">圖上的每一點都是解，線以外的點都不是</b>。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(signG, 'data-ry-sign', v => { key = v; draw(); });
  bindPickGroup(styleG, 'data-ry-style', v => { style = v; draw(); });
  [aS, tS].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 8：區間與整數點——兩端各自判斷，再數線段上的整數
   ========================================================================== */
function initSegCanvas() {
  const cv = document.getElementById('canvas-seg');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const aS = document.getElementById('sm-a-slider');
  const bS = document.getElementById('sm-b-slider');
  const aV = document.getElementById('sm-a-val');
  const bV = document.getElementById('sm-b-val');
  const loG = document.getElementById('sm-lo-group');
  const hiG = document.getElementById('sm-hi-group');
  const styleG = document.getElementById('sm-style-group');
  const filterG = document.getElementById('sm-filter-group');
  const out = document.getElementById('sm-formula');
  const fb = document.getElementById('sm-feedback');
  const C = IQ_TONE[7];
  let lo = 0, hi = 1, style = 'line', filter = 'all';

  const FILTER = {
    all: { name: '整數解', hint: '端點實心要算、空心不算', test: () => true },
    pos: { name: '正整數解', hint: '0 不是正整數', test: v => v > 0 },
    neg: { name: '負整數解', hint: '0 不是負整數', test: v => v < 0 }
  };

  function draw() {
    const a = parseInt(aS.value, 10);
    const b = parseInt(bS.value, 10);
    aV.textContent = a;
    bV.textContent = b;
    const k1 = lo ? 'le' : 'lt';
    const k2 = hi ? 'le' : 'lt';
    const s1 = IQ_SIGN[k1], s2 = IQ_SIGN[k2];
    const F = FILTER[filter];

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '兩個不等號：畫出線段，再數整數點', C);

    if (a >= b) {
      drawPanel(ctx, 14, 60, 512, 150, NO_COLOR, 0.1);
      textCenter(ctx, `左端 ${a} 不小於右端 ${b}，範圍不成立`, 270, 110, NO_COLOR, f(900, 18));
      wrapText(ctx, '連寫的不等式要把小的數寫在左邊，中間才夾得住 x。把右端調大，或把左端調小。', 270, 160, 470, 20, INK, 14.5);
      out.innerHTML = `左端 \\(${a}\\)、右端 \\(${b}\\)：範圍不成立`;
      fb.innerHTML = wrapFeedback(`左端 \\(${a}\\) 不小於右端 \\(${b}\\)，沒有任何數能同時比 \\(${a}\\) 大、又比 \\(${b}\\) 小。<b style="color:${C}">把右端調到比左端大</b>再看。`);
      typeset([out, fb]);
      return;
    }

    drawEqPanel(ctx, [T(`${a} ${s1.ch}`, IQ_CREAM_INK), IT('x', IQ_CREAM_INK), T(`${s2.ch} ${b}`, IQ_CREAM_INK)], 76, C, { h: 30, size: 30 });

    const y = 190;
    const L = numLine(ctx, { x0: 50, x1: 474, y: y, min: -6, max: 6 });

    // 範圍內、而且符合篩選的整數
    const list = [];
    for (let v = a; v <= b; v++) {
      if (v === a && !lo) continue;
      if (v === b && !hi) continue;
      if (F.test(v)) list.push(v);
    }
    list.forEach(v => {
      ctx.save();
      ctx.fillStyle = IQ_MUSTARD;
      ctx.globalAlpha = 0.92;
      roundRect(ctx, L.px(v) - 13, y + 6, 26, 22, 6);
      ctx.fill();
      ctx.restore();
      textCenter(ctx, String(v), L.px(v), y + 17, '#1f2937', f(900, 14));
    });

    numLineSeg(ctx, y, L.px(a), L.px(b), C, style);
    numLineEnd(ctx, L.px(a), y, !!lo, C);
    numLineEnd(ctx, L.px(b), y, !!hi, C);

    const listStr = list.length ? list.join(', ') : '沒有';
    drawStepRows(ctx, [
      { name: `① 左端 ${a}`, hint: lo ? '有等號：實心，要算進去' : '沒有等號：空心，不算',
        items: [T(lo ? `● ${a} 要算` : `○ ${a} 不算`, C)], color: C },
      { name: `② 右端 ${b}`, hint: hi ? '有等號：實心，要算進去' : '沒有等號：空心，不算',
        items: [T(hi ? `● ${b} 要算` : `○ ${b} 不算`, C)], color: C },
      { name: `③ ${F.name}`, hint: F.hint,
        items: [T(listStr, IQ_MUSTARD), T(`共 ${list.length} 個`, C)], color: IQ_MUSTARD }
    ], 3, { top: 272, gap: 58, labX: 22, eqX: 200, size: 20, color: C });

    const styleName = style === 'fold' ? 'ㄇ字形畫法' : '直線畫法';
    textCenter(ctx, `目前是${styleName}：只畫兩個端點之間的一段，不延伸到盡頭`, 270, 440, MUTED, f(600, 13.5));

    out.innerHTML = wbrRel(`${a} ${s1.tex} x ${s2.tex} ${b}`) + `；${F.name}共 ${list.length} 個`;

    const full = b - a + 1;
    let msg = `\\(${a}\\) 到 \\(${b}\\) 之間（兩端都算）有 \\(${full}\\) 個整數；`;
    msg += (lo && hi) ? '兩端都實心，一個都不扣。'
      : ((!lo && !hi) ? '兩端都空心，<b style="color:' + C + '">扣掉 \\(2\\) 個</b>。' : '有一端空心，<b style="color:' + C + '">扣掉 \\(1\\) 個</b>。');
    if (filter !== 'all') msg += `再只留${filter === 'pos' ? '正' : '負'}整數（\\(0\\) 不算），剩 \\(${list.length}\\) 個。`;
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(loG, 'data-sm-lo', v => { lo = parseInt(v, 10); draw(); });
  bindPickGroup(hiG, 'data-sm-hi', v => { hi = parseInt(v, 10); draw(); });
  bindPickGroup(styleG, 'data-sm-style', v => { style = v; draw(); });
  bindPickGroup(filterG, 'data-sm-filter', v => { filter = v; draw(); });
  [aS, bS].forEach(s => s.addEventListener('input', draw));
  draw();
}
