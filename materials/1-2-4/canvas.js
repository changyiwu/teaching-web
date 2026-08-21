document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quiz System
  initQuizSystem();

  // Initialize Canvas Simulations
  initPowerCanvas();
  initTrendCanvas();
  initOrderCanvas();
  initExpandCanvas();
  initDeriveCanvas();
  initZeroCanvas();
});

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // Correct answers mapping for Section 2-4 (12 Quizzes)
  const answers = {
    '2-4-1-1': 'C', // 負底數奇次方，負號留下：-5^7/6^7
    '2-4-1-2': 'B', // -2^4 = -16 最小（負號沒被括號括進去）
    '2-4-2-1': 'D', // 0.85 < 1，指數越大反而越小
    '2-4-2-2': 'A', // 用 1 當中間人
    '2-4-3-1': 'D', // 1/9 x (-27/8) = -3/8
    '2-4-3-2': 'A', // [9 x 1/9 - 1/2] / (1/4) = 2
    '2-4-4-1': 'D', // 沒寫的指數是 1，9-1 = 8
    '2-4-4-2': 'C', // 底數與指數都不同，兩條律都套不上
    '2-4-5-1': 'C', // 乘方的乘方，指數相乘 4x3 = 12
    '2-4-5-2': 'D', // 指數相同先合併底數，(-3/2)^6 = 729/64
    '2-4-6-1': 'A', // 1 - 1 + 1x3 = 3
    '2-4-6-2': 'B'  // (-2)^7 / (-2)^4 = (-2)^3 = -8
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
    });
  });
}

/* ==========================================================================
   2. Helper functions
   ========================================================================== */
const FONT = '"Outfit", "Noto Sans TC", sans-serif';

// 和紙摺紙工房配色：靛藍、朱橘、松綠、藤紫、金茶、天青
const C_INDIGO = '#a5b4fc';
const C_ORANGE = '#fdba74';
const C_GREEN = '#6ee7b7';
const C_PURPLE = '#e9d5ff';
const C_GOLD = '#fde047';
const C_CYAN = '#67e8f9';

const OK_COLOR = '#34d399';
const NO_COLOR = '#fb7185';
const MUTED = '#94a3b8';
const INK = '#cbd5e1';
const DIM = '#64748b';

// canvas 上自己畫的指數要留的字距（agents.md 開發約束 11）
const POW_KERN = 0.17;

function f(weight, size) {
  return `${weight} ${size}px ${FONT}`;
}

function wrapFeedback(html) {
  return `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;">${html}</div>`;
}

function typeset(nodes) {
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise(nodes).catch(err => console.log(err));
  }
}

// 圓角矩形（部分舊版瀏覽器沒有 ctx.roundRect）
function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = a % b; a = b; b = t; }
  return a || 1;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 化成最簡分數，負號固定放到分子上
function reduce(n, d) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  return [n / g, d / g];
}

// 產生 MathJax 用的分數字串；分母為 1 時直接寫整數
function texFrac(n, d) {
  if (d < 0) { n = -n; d = -d; }
  if (d === 1) return String(n);
  if (n < 0) return `-\\frac{${-n}}{${d}}`;
  return `\\frac{${n}}{${d}}`;
}

/* --------------------------------------------------------------------------
   Canvas 上的算式排版：三種基本元件遞迴組合
     T(s)              一段文字
     VF(top, bot)      直式分數（上下兩個元件加一條橫線）
     PW(base, exp, p)  乘方（base 加右上角的指數，p 為 true 時加括號）
   FR(n, d) 是 VF(T(n), T(d)) 的簡寫。
   -------------------------------------------------------------------------- */
const T = (s, color) => ({ t: 'txt', s: String(s), color });
const VF = (top, bot, color) => ({ t: 'vfrac', top, bot, color });
const FR = (n, d, color) => VF(T(n), T(d), color);
const PW = (base, exp, paren, color) => ({ t: 'pow', base, exp: String(exp), paren, color });
// GRP：把一整串元件包在會跟著長高的括號裡（'()' 或 '[]'）
const GRP = (items, kind, color) => ({ t: 'grp', items, kind: kind || '()', color });

function measure(ctx, it, size) {
  if (it.t === 'vfrac') {
    const cs = size * 0.88;
    const mt = measure(ctx, it.top, cs);
    const mb = measure(ctx, it.bot, cs);
    return {
      w: Math.max(mt.w, mb.w) + 14,
      h: mt.h + mb.h + 12,
      top: mt, bot: mb, cs
    };
  }
  if (it.t === 'grp') {
    let iw = 0, ih = size * 1.12;
    it.items.forEach((sub, i) => {
      const ms = measure(ctx, sub, size);
      if (i) iw += 8;
      iw += ms.w;
      ih = Math.max(ih, ms.h);
    });
    const pw = Math.max(size * 0.34, ih * 0.18);
    return { w: iw + pw * 2 + 6, h: ih, innerW: iw, parenW: pw };
  }
  if (it.t === 'pow') {
    const mb = measure(ctx, it.base, size);
    const pw = it.paren ? Math.max(size * 0.30, mb.h * 0.17) : 0;
    ctx.font = f(800, size * 0.64);
    const ew = ctx.measureText(it.exp).width;
    return {
      w: mb.w + pw * 2 + size * POW_KERN + ew,
      h: mb.h + size * 0.42,
      base: mb, parenW: pw, expW: ew
    };
  }
  ctx.font = f(700, size);
  return { w: ctx.measureText(it.s).width, h: size * 1.12 };
}

// 括號：用二次貝茲曲線描，才框得住高度不一的分數
function drawParen(ctx, cx, cy, h, open, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.8, h * 0.045);
  ctx.lineCap = 'round';
  const w = h * 0.20;
  const s = open ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(cx + s * w / 2, cy - h / 2);
  ctx.quadraticCurveTo(cx - s * w * 0.9, cy, cx + s * w / 2, cy + h / 2);
  ctx.stroke();
  ctx.restore();
}

// 方括號：直線加上下勾
function drawBracket(ctx, cx, cy, h, open, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.8, h * 0.045);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const w = h * 0.16;
  const s = open ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(cx + s * w / 2, cy - h / 2);
  ctx.lineTo(cx - s * w / 2, cy - h / 2);
  ctx.lineTo(cx - s * w / 2, cy + h / 2);
  ctx.lineTo(cx + s * w / 2, cy + h / 2);
  ctx.stroke();
  ctx.restore();
}

// 以 (x, cy) 為左側中線畫出一個元件，回傳寬度
function drawIt(ctx, it, x, cy, size, fallback) {
  const m = measure(ctx, it, size);
  const color = it.color || fallback;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  if (it.t === 'vfrac') {
    const cx = x + m.w / 2;
    drawIt(ctx, it.top, cx - m.top.w / 2, cy - m.top.h / 2 - 6, m.cs, color);
    drawIt(ctx, it.bot, cx - m.bot.w / 2, cy + m.bot.h / 2 + 6, m.cs, color);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, size / 13);
    ctx.beginPath();
    ctx.moveTo(x + 3, cy);
    ctx.lineTo(x + m.w - 3, cy);
    ctx.stroke();
    return m.w;
  }

  if (it.t === 'grp') {
    const bh = Math.max(m.h * 1.08, size * 1.3);
    const drawB = it.kind === '[]' ? drawBracket : drawParen;
    drawB(ctx, x + m.parenW / 2, cy, bh, true, color);
    let ix = x + m.parenW + 3;
    it.items.forEach((sub, i) => {
      if (i) ix += 8;
      ix += drawIt(ctx, sub, ix, cy, size, color);
    });
    drawB(ctx, ix + 3 + m.parenW / 2, cy, bh, false, color);
    return m.w;
  }

  if (it.t === 'pow') {
    const bh = Math.max(m.base.h * 1.06, size * 1.25);
    let bx = x;
    if (it.paren) {
      drawParen(ctx, x + m.parenW / 2, cy, bh, true, color);
      bx = x + m.parenW;
    }
    drawIt(ctx, it.base, bx, cy, size, color);
    let ex = bx + m.base.w;
    if (it.paren) {
      drawParen(ctx, ex + m.parenW / 2, cy, bh, false, color);
      ex += m.parenW;
    }
    ctx.font = f(800, size * 0.64);
    ctx.fillStyle = it.expColor || color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(it.exp, ex + size * POW_KERN, cy - bh * 0.30);
    ctx.textBaseline = 'middle';
    return m.w;
  }

  ctx.font = f(700, size);
  ctx.fillText(it.s, x, cy);
  return m.w;
}

function exprWidth(ctx, items, size, gap) {
  let w = 0;
  items.forEach((it, i) => {
    if (i) w += gap;
    w += measure(ctx, it, size).w;
  });
  return w;
}

// 置中畫出一整條算式；太寬時自動縮小字級，確保不會超出畫布
function drawExpr(ctx, items, cx, cy, size, fallback, opts) {
  const o = opts || {};
  const gap = o.gap == null ? 8 : o.gap;
  const maxW = o.maxW == null ? ctx.canvas.width - 24 : o.maxW;
  let s = size;
  let total = exprWidth(ctx, items, s, gap);
  while (total > maxW && s > 9) {
    s -= 1;
    total = exprWidth(ctx, items, s, gap);
  }
  let x = (o.left != null) ? o.left : cx - total / 2;
  items.forEach((it, i) => {
    if (i) x += gap;
    x += drawIt(ctx, it, x, cy, s, fallback);
  });
  return { w: total, size: s };
}

// 判定用的小徽章
function drawChip(ctx, x, y, w, h, label, color, bg) {
  ctx.fillStyle = bg || 'rgba(255,255,255,0.05)';
  roundRect(ctx, x, y, w, h, 9);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = f(800, 15);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.textAlign = 'left';
}

function drawTitle(ctx, text, color) {
  ctx.fillStyle = color;
  ctx.font = f(800, 17);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, ctx.canvas.width / 2, 26);
  ctx.textAlign = 'left';
}

function drawNote(ctx, text, y, color, size) {
  ctx.fillStyle = color || MUTED;
  ctx.font = f(600, size || 14);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, ctx.canvas.width / 2, y);
  ctx.textAlign = 'left';
}

// 帶箭頭的直線
function drawArrow(ctx, x1, y1, x2, y2, color, width) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width || 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hs = 7;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - hs * Math.cos(ang - 0.4), y2 - hs * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - hs * Math.cos(ang + 0.4), y2 - hs * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 連乘字串：n 個 s 用 × 串起來，太長時省略中間
function repeatStr(s, n) {
  if (n <= 4) return Array(n).fill(s).join('×');
  return `${s}×${s}×…×${s}`;
}

// 整數次方，回傳精確整數（本頁的指數都很小，不會超出安全範圍）
function ipow(base, e) {
  let r = 1;
  for (let i = 0; i < e; i++) r *= base;
  return r;
}

/* ==========================================================================
   重點 1：乘方展開機
   ========================================================================== */
function initPowerCanvas() {
  const canvas = document.getElementById('canvas-power');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const bS = document.getElementById('pw-b-slider');
  const aS = document.getElementById('pw-a-slider');
  const nS = document.getElementById('pw-n-slider');
  const bV = document.getElementById('pw-b-val');
  const aV = document.getElementById('pw-a-val');
  const nV = document.getElementById('pw-n-val');
  const formula = document.getElementById('pw-formula');
  const feedback = document.getElementById('pw-feedback');

  function draw() {
    const b = parseInt(bS.value, 10);
    const a = parseInt(aS.value, 10);
    const n = parseInt(nS.value, 10);
    bV.textContent = b;
    aV.textContent = a;
    nV.textContent = n;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTitle(ctx, '把分數的乘方展開成連乘', C_INDIGO);

    const bStr = b < 0 ? `(${b})` : String(b);
    const bn = ipow(b, n);
    const an = ipow(a, n);
    const [rn, rd] = reduce(bn, an);
    const isNeg = bn < 0;
    const evenExp = n % 2 === 0;

    // 第 1 行：原式 = 連乘展開
    const left = [PW(b < 0 ? VF(T(`-${-b}`), T(a)) : FR(b, a), n, true, C_INDIGO)];
    const chain = [];
    // 負分數的每一項都要加括號，否則「- 2/3 × - 2/3」會看成減法
    const per = b < 0
      ? [GRP([T('-', C_INDIGO), FR(-b, a, C_INDIGO)], '()', C_INDIGO)]
      : [FR(b, a, C_INDIGO)];
    const shown = Math.min(n, 4);
    for (let i = 0; i < shown; i++) {
      if (i) chain.push(T('×', MUTED));
      per.forEach(p => chain.push(p));
    }
    if (n > shown) { chain.push(T('×', MUTED)); chain.push(T('…', MUTED)); }
    drawExpr(ctx, left.concat([T('=', MUTED)], chain), canvas.width / 2, 82, 21, C_INDIGO);
    ctx.fillStyle = DIM;
    ctx.font = f(600, 12);
    ctx.textAlign = 'center';
    ctx.fillText(`共 ${n} 個 ${b < 0 ? '(' + b + '/' + a + ')' : b + '/' + a}`, canvas.width / 2, 122);
    ctx.textAlign = 'left';

    // 第 2 行：分子分母各自連乘
    drawExpr(ctx, [
      T('=', MUTED),
      VF(T(repeatStr(bStr, n), C_ORANGE), T(repeatStr(String(a), n), C_CYAN))
    ], canvas.width / 2, 168, 20, INK);

    // 第 3 行：收攏成 b^n / a^n，再化成值
    const row3 = [
      T('=', MUTED),
      VF(PW(T(bStr, C_ORANGE), n, false, C_ORANGE), PW(T(a, C_CYAN), n, false, C_CYAN)),
      T('=', MUTED),
      VF(T(bn, isNeg ? NO_COLOR : OK_COLOR), T(an, isNeg ? NO_COLOR : OK_COLOR))
    ];
    if (rd !== an || rn !== bn) {
      row3.push(T('=', MUTED));
      row3.push(rd === 1 ? T(rn, C_GOLD) : VF(T(rn, C_GOLD), T(rd, C_GOLD)));
    }
    drawExpr(ctx, row3, canvas.width / 2, 248, 20, INK);

    // 符號燈號
    const y = 312;
    drawChip(ctx, 26, y, 130, 38, b < 0 ? '底數為負' : '底數為正',
      b < 0 ? NO_COLOR : OK_COLOR,
      b < 0 ? 'rgba(251,113,133,0.12)' : 'rgba(52,211,153,0.12)');
    drawChip(ctx, 176, y, 130, 38, `指數 ${n} 是${evenExp ? '偶數' : '奇數'}`, C_GOLD, 'rgba(253,224,71,0.10)');
    drawArrow(ctx, 314, y + 19, 344, y + 19, MUTED, 2);
    drawChip(ctx, 352, y, 162, 38, isNeg ? '結果為負' : '結果為正',
      isNeg ? NO_COLOR : OK_COLOR,
      isNeg ? 'rgba(251,113,133,0.12)' : 'rgba(52,211,153,0.12)');

    ctx.fillStyle = DIM;
    ctx.font = f(600, 12);
    ctx.textAlign = 'center';
    ctx.fillText('底數為負時：偶數次方 → 正、奇數次方 → 負', canvas.width / 2, 366);
    ctx.textAlign = 'left';

    // 面板
    const texBase = b < 0 ? `-\\frac{${-b}}{${a}}` : `\\frac{${b}}{${a}}`;
    formula.innerHTML = `\\( \\left( ${texBase} \\right)^{${n}} = ${texFrac(rn, rd)} \\)`;

    let msg;
    if (b === 0) {
      msg = `底數是 \\(0\\)，\\(0^{${n}} = 0\\)。注意指數律的前提是<strong>底數不為 \\(0\\)</strong>。`;
    } else if (b < 0) {
      msg = evenExp
        ? `底數 \\(${texBase}\\) 是<strong>負</strong>的，指數 \\(${n}\\) 是<strong>偶數</strong>，\\(${n}\\) 個負號兩兩抵銷，結果為<strong style="color:${OK_COLOR}">正</strong>。`
        : `底數 \\(${texBase}\\) 是<strong>負</strong>的，指數 \\(${n}\\) 是<strong>奇數</strong>，抵銷後還剩一個負號，結果為<strong style="color:${NO_COLOR}">負</strong>。`;
    } else {
      msg = `底數是<strong>正</strong>的，不論指數奇偶，結果都是<strong style="color:${OK_COLOR}">正</strong>的。`;
    }
    feedback.innerHTML = wrapFeedback(
      `\\( \\left( \\frac{b}{a} \\right)^{n} = \\frac{b^{n}}{a^{n}} \\)：分子分母<strong>各自</strong>乘方。<br>${msg}`
    );
    typeset([formula, feedback]);
  }

  [bS, aS, nS].forEach(s => s.addEventListener('input', draw));
  draw();
  if (window.MathJax && MathJax.startup && MathJax.startup.promise) {
    MathJax.startup.promise.then(draw);
  }
}

/* ==========================================================================
   重點 2：浸染濃度尺（a^n 的走勢）
   ========================================================================== */
function initTrendCanvas() {
  const canvas = document.getElementById('canvas-trend');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const aS = document.getElementById('tr-a-slider');
  const nS = document.getElementById('tr-n-slider');
  const aV = document.getElementById('tr-a-val');
  const nV = document.getElementById('tr-n-val');
  const formula = document.getElementById('tr-formula');
  const feedback = document.getElementById('tr-feedback');

  function fmt(v) {
    if (v >= 100) return v.toFixed(0);
    if (v >= 10) return v.toFixed(1);
    if (v >= 1) return v.toFixed(2);
    if (v >= 0.01) return v.toFixed(3);
    return v.toExponential(1);
  }

  function draw() {
    const ai = parseInt(aS.value, 10);
    const a = ai / 100;
    const N = parseInt(nS.value, 10);
    aV.textContent = a.toFixed(2);
    nV.textContent = N;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTitle(ctx, `底數 a = ${a.toFixed(2)} 的乘方走勢`, C_ORANGE);

    const same0 = Math.abs(a - 1) < 1e-9;
    const grow = a > 1;

    /* 柱高與數值成「正比例」：柱底一律是 0，柱高 = 值 / 縱軸上限。
       先前用的是對數尺度，等距的階梯看起來漂亮，但柱子的長度比例是錯的
       （a^2 看起來只比 a^1 長一點，實際上是它的 a 倍）。比大小是這一節的
       主題，長度比例必須誠實。 */
    const left = 46, right = canvas.width - 18;
    const top = 62, base = 296;              // base = 數值 0 的位置
    const vmax = Math.max(1, Math.pow(a, N)) * 1.14;
    const yOf = v => base - (v / vmax) * (base - top);

    // 縱軸
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(left - 14, top - 6);
    ctx.lineTo(left - 14, base);
    ctx.lineTo(right, base);
    ctx.stroke();
    ctx.fillStyle = MUTED;
    ctx.font = f(700, 12);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('0', left - 20, base);

    // y = 1 的參考線
    const y1 = yOf(1);
    ctx.save();
    ctx.strokeStyle = 'rgba(253,224,71,0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(left - 14, y1);
    ctx.lineTo(right, y1);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = C_GOLD;
    ctx.font = f(800, 14);
    ctx.textAlign = 'right';
    ctx.fillText('1', left - 20, y1);
    ctx.textAlign = 'left';

    const slotW = (right - left) / N;
    const barW = Math.min(42, slotW * 0.58);

    for (let k = 1; k <= N; k++) {
      const v = Math.pow(a, k);
      const cx = left + slotW * (k - 0.5);
      const yTop = yOf(v);
      const h = Math.max(base - yTop, 1.5);   // 值極小時仍留 1.5px，才看得出它還在
      const color = same0 ? MUTED : (grow ? C_ORANGE : C_INDIGO);

      ctx.save();
      ctx.globalAlpha = 0.24 + 0.5 * (k / N);
      ctx.fillStyle = color;
      roundRect(ctx, cx - barW / 2, base - h, barW, h, 4);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      roundRect(ctx, cx - barW / 2, base - h, barW, h, 4);
      ctx.stroke();

      // 數值標在柱頂上方
      ctx.fillStyle = color;
      ctx.font = f(800, 12);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(fmt(v), cx, base - h - 5);

      // a^k 標在軸下
      ctx.fillStyle = INK;
      ctx.textBaseline = 'middle';
      drawExpr(ctx, [PW(T('a', INK), k, false, INK)], cx, base + 20, 15, INK, { maxW: slotW });
      ctx.textAlign = 'left';
    }

    // 結論條
    const label = same0 ? 'a = 1：每一次方都是 1'
      : (grow ? 'a > 1：越乘越大，全部大於 1' : 'a < 1：越乘越小，全部小於 1');
    drawChip(ctx, 70, 334, 400, 36, label,
      same0 ? MUTED : (grow ? C_ORANGE : C_INDIGO),
      same0 ? 'rgba(148,163,184,0.10)' : (grow ? 'rgba(253,186,116,0.12)' : 'rgba(165,180,252,0.12)'));

    // 面板
    const [fn, fd] = reduce(ai, 100);
    const fracTex = fd === 1 ? String(fn) : `\\frac{${fn}}{${fd}}`;
    formula.innerHTML = `\\( a = ${a.toFixed(2)} = ${fracTex} \\)，\\( a^{${N}} = ${fmt(Math.pow(a, N))} \\)`;

    let msg;
    if (same0) {
      msg = `\\(1\\) 乘幾次都還是 \\(1\\)，這是唯一不會變的底數。`;
    } else if (grow) {
      msg = `因為 \\(a > 1\\)，每多乘一次 \\(a\\) 就會<strong style="color:${C_ORANGE}">變大</strong>，所以 \\(a^{1} < a^{2} < \\cdots < a^{${N}}\\)，而且每一項都大於 \\(1\\)。`;
    } else {
      msg = `因為 \\(a < 1\\)，每多乘一次 \\(a\\) 就會<strong style="color:${C_INDIGO}">變小</strong>，所以 \\(a^{1} > a^{2} > \\cdots > a^{${N}}\\)，而且每一項都小於 \\(1\\)。`;
    }
    feedback.innerHTML = wrapFeedback(
      `${msg}<br>柱子的<strong>長度與數值成正比</strong>，所以 \\(a\\) 稍微離開 \\(1\\)，乘幾次之後差距就拉得很開。`
    );
    typeset([formula, feedback]);
  }

  [aS, nS].forEach(s => s.addEventListener('input', draw));
  draw();
  if (window.MathJax && MathJax.startup && MathJax.startup.promise) {
    MathJax.startup.promise.then(draw);
  }
}

/* ==========================================================================
   重點 3：運算順序工作檯（點選題目 + 上一步／下一步）
   ========================================================================== */
function initOrderCanvas() {
  const canvas = document.getElementById('canvas-order');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const qGroup = document.getElementById('od-q-group');
  const prevBtn = document.getElementById('od-prev');
  const nextBtn = document.getElementById('od-next');
  const resetBtn = document.getElementById('od-reset');
  const sV = document.getElementById('od-s-val');
  const formula = document.getElementById('od-formula');
  const feedback = document.getElementById('od-feedback');

  const H = C_GREEN;

  const QUESTIONS = [
    {
      title: '題目一：兩個負分數的乘方相乘',
      tex: '\\left(-\\frac{1}{2}\\right)^{3} \\times \\left(-\\frac{2}{3}\\right)^{2}',
      steps: [
        {
          note: '原式：先看清楚有兩個乘方要算',
          items: () => [
            PW(VF(T('-1'), T('2')), 3, true), T('×', MUTED), PW(VF(T('-2'), T('3')), 2, true)
          ]
        },
        {
          note: '第 1 步：先算乘方。奇次方留負號、偶次方變正',
          items: () => [
            T('=', MUTED), GRP([T('-', NO_COLOR), FR(1, 8, NO_COLOR)], '()', NO_COLOR),
            T('×', MUTED), FR(4, 9, OK_COLOR)
          ]
        },
        {
          note: '第 2 步：分子乘分子、分母乘分母；一正一負得負',
          items: () => [T('=', MUTED), T('-', NO_COLOR), FR(4, 72, NO_COLOR)]
        },
        {
          note: '第 3 步：約分，分子分母同除以 4',
          items: () => [T('=', MUTED), T('-', C_GOLD), FR(1, 18, C_GOLD)]
        }
      ]
    },
    {
      title: '題目二：乘方之後再相除',
      tex: '\\left(-\\frac{3}{2}\\right)^{4} \\div \\left(\\frac{3}{4}\\right)^{2}',
      steps: [
        {
          note: '原式：除法也要先把兩邊的乘方算出來',
          items: () => [
            PW(VF(T('-3'), T('2')), 4, true), T('÷', MUTED), PW(FR(3, 4), 2, true)
          ]
        },
        {
          note: '第 1 步：先算乘方。4 是偶數，負號全部抵銷',
          items: () => [T('=', MUTED), FR(81, 16, OK_COLOR), T('÷', MUTED), FR(9, 16, C_CYAN)]
        },
        {
          note: '第 2 步：除以一個分數＝乘以它的倒數',
          items: () => [T('=', MUTED), FR(81, 16, OK_COLOR), T('×', MUTED), FR(16, 9, C_CYAN)]
        },
        {
          note: '第 3 步：先約分再乘，16 和 16 抵銷、81 除以 9 得 9',
          items: () => [T('=', MUTED), T('9', C_GOLD)]
        }
      ]
    },
    {
      title: '題目三：中括號＋乘方的綜合式',
      tex: '\\left[ 4 \\times \\left(-\\frac{1}{2}\\right)^{2} + \\frac{3}{2} \\right] \\div \\left(-\\frac{1}{2}\\right)^{3}',
      steps: [
        {
          note: '原式：括號內外各有一個乘方',
          items: () => [
            GRP([T('4', INK), T('×', MUTED), PW(VF(T('-1'), T('2')), 2, true),
              T('+', MUTED), FR(3, 2)], '[]', INK),
            T('÷', MUTED), PW(VF(T('-1'), T('2')), 3, true)
          ]
        },
        {
          note: '第 1 步：先算乘方——括號內外的一起算掉',
          items: () => [
            T('=', MUTED),
            GRP([T('4', INK), T('×', MUTED), FR(1, 4, OK_COLOR), T('+', MUTED), FR(3, 2)], '()', INK),
            T('÷', MUTED), GRP([T('-', NO_COLOR), FR(1, 8, NO_COLOR)], '()', NO_COLOR)
          ]
        },
        {
          note: '第 2 步：括號內先乘除，4 × 1/4 = 1',
          items: () => [
            T('=', MUTED),
            GRP([T('1', C_GREEN), T('+', MUTED), FR(3, 2)], '()', INK),
            T('÷', MUTED), GRP([T('-', NO_COLOR), FR(1, 8, NO_COLOR)], '()', NO_COLOR)
          ]
        },
        {
          note: '第 3 步：括號內再算加法，通分後得 5/2',
          items: () => [
            T('=', MUTED), FR(5, 2, C_GREEN), T('÷', MUTED),
            GRP([T('-', NO_COLOR), FR(1, 8, NO_COLOR)], '()', NO_COLOR)
          ]
        },
        {
          note: '第 4 步：除法改乘倒數，5/2 × (-8) = -20',
          items: () => [T('=', MUTED), T('-20', C_GOLD)]
        }
      ]
    }
  ];

  let qi = 0;
  let step = 1;

  function draw() {
    const q = QUESTIONS[qi];
    const maxStep = q.steps.length;
    step = clamp(step, 1, maxStep);

    sV.textContent = `${step} / ${maxStep}`;
    prevBtn.disabled = step <= 1;
    nextBtn.disabled = step >= maxStep;
    [...qGroup.querySelectorAll('.pick-btn')].forEach((b, i) => {
      b.classList.toggle('active', i === qi);
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTitle(ctx, q.title, H);

    const startY = 76;
    const gapY = maxStep >= 5 ? 56 : 66;

    for (let i = 0; i < step; i++) {
      const cy = startY + gapY * i;
      const isCur = i === step - 1;

      if (isCur) {
        ctx.save();
        ctx.fillStyle = 'rgba(110,231,183,0.10)';
        roundRect(ctx, 14, cy - gapY / 2 + 4, canvas.width - 28, gapY - 8, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(110,231,183,0.55)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      }

      /* 已走過的步驟要留得住：先前用 globalAlpha 0.42 + DIM 兩層一起壓暗，
         投影下幾乎讀不到。改成只降一點透明度，顏色仍用 INK。 */
      ctx.save();
      if (!isCur) ctx.globalAlpha = 0.78;
      drawExpr(ctx, q.steps[i].items(), canvas.width / 2, cy, isCur ? 21 : 19,
        INK, { maxW: canvas.width - 44 });
      ctx.restore();
    }

    // 當前步驟的說明
    const noteY = Math.min(startY + gapY * maxStep + 6, canvas.height - 42);
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    roundRect(ctx, 20, noteY, canvas.width - 40, 34, 9);
    ctx.fill();
    ctx.restore();
    drawNote(ctx, q.steps[step - 1].note, noteY + 17, H, 14);

    formula.innerHTML = `\\( ${q.tex} \\)`;
    feedback.innerHTML = wrapFeedback(
      `目前在<strong style="color:${H}">第 ${step} / ${maxStep} 步</strong>：${q.steps[step - 1].note.replace(/^第 \d+ 步：|^原式：/, '')}<br>` +
      `運算順序：<strong>乘方</strong> \\(\\to\\) 括號 \\(\\to\\) 乘除 \\(\\to\\) 加減。`
    );
    typeset([formula, feedback]);
  }

  qGroup.addEventListener('click', e => {
    const btn = e.target.closest('.pick-btn');
    if (!btn) return;
    qi = parseInt(btn.dataset.q, 10) - 1;
    step = 1;
    draw();
  });
  prevBtn.addEventListener('click', () => { step -= 1; draw(); });
  nextBtn.addEventListener('click', () => { step += 1; draw(); });
  resetBtn.addEventListener('click', () => { step = 1; draw(); });

  draw();
  if (window.MathJax && MathJax.startup && MathJax.startup.promise) {
    MathJax.startup.promise.then(draw);
  }
}

/* ==========================================================================
   重點 4：連乘展開對照器（同底數相乘除）
   ========================================================================== */
function initExpandCanvas() {
  const canvas = document.getElementById('canvas-expand');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const opGroup = document.getElementById('ex-op-group');
  const aS = document.getElementById('ex-a-slider');
  const mS = document.getElementById('ex-m-slider');
  const nS = document.getElementById('ex-n-slider');
  const aV = document.getElementById('ex-a-val');
  const mV = document.getElementById('ex-m-val');
  const nV = document.getElementById('ex-n-val');
  const formula = document.getElementById('ex-formula');
  const feedback = document.getElementById('ex-feedback');

  let op = 'mul';

  // 一格「底數磚」
  function tile(x, y, w, h, label, color, struck) {
    ctx.save();
    ctx.fillStyle = struck ? 'rgba(148,163,184,0.10)' : 'rgba(255,255,255,0.06)';
    roundRect(ctx, x, y, w, h, 5);
    ctx.fill();
    ctx.strokeStyle = struck ? DIM : color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = struck ? DIM : color;
    ctx.font = f(800, Math.min(15, w * 0.42));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2);
    if (struck) {
      ctx.strokeStyle = NO_COLOR;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x + 3, y + h - 3);
      ctx.lineTo(x + w - 3, y + 3);
      ctx.stroke();
    }
    ctx.restore();
    ctx.textAlign = 'left';
  }

  // 畫一排磚，回傳 [起點x, 終點x]
  function tileRow(cx, cy, count, label, color, tw, gap, struckFrom) {
    const total = count * tw + (count - 1) * gap;
    let x = cx - total / 2;
    const x0 = x;
    for (let i = 0; i < count; i++) {
      tile(x, cy - 14, tw, 28, label, color, struckFrom != null && i < struckFrom);
      x += tw + gap;
    }
    return [x0, x0 + total];
  }

  function draw() {
    const a = parseInt(aS.value, 10);
    const m = parseInt(mS.value, 10);
    const n = parseInt(nS.value, 10);
    aV.textContent = a;
    mV.textContent = m;
    nV.textContent = n;
    [...opGroup.querySelectorAll('.pick-btn')].forEach(b => {
      b.classList.toggle('active', b.dataset.op === op);
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const isMul = op === 'mul';
    drawTitle(ctx, isMul ? '兩排接起來，數總共有幾個' : '上下一對一約掉，數剩下幾個',
      isMul ? C_PURPLE : C_CYAN);

    if (a === 0) {
      drawNote(ctx, '底數不可以是 0', 170, NO_COLOR, 22);
      drawNote(ctx, '指數律的前提是 a ≠ 0，否則除法會出現除以 0', 208, MUTED, 15);
      formula.innerHTML = `底數必須不為 \\(0\\)`;
      feedback.innerHTML = wrapFeedback(`四條指數律都要求<strong style="color:${NO_COLOR}">底數不為 \\(0\\)</strong>。把底數調成其他值再看一次。`);
      typeset([formula, feedback]);
      return;
    }

    const aStr = a < 0 ? `(${a})` : String(a);
    const resExp = isMul ? m + n : m - n;

    // 第 1 行：符號式
    drawExpr(ctx, [
      PW(T(aStr, C_PURPLE), m, false, C_PURPLE),
      T(isMul ? '×' : '÷', MUTED),
      PW(T(aStr, C_CYAN), n, false, C_CYAN)
    ], canvas.width / 2, 62, 24, INK);

    const tw = Math.min(40, (canvas.width - 90) / Math.max(m + n, 1) - 5);
    const gap = 5;

    if (isMul) {
      // 第 2 行：兩排分開
      const totalM = m * tw + (m - 1) * gap;
      const totalN = n * tw + (n - 1) * gap;
      const midGap = 26;
      const all = totalM + midGap + totalN;
      let x = (canvas.width - all) / 2;
      for (let i = 0; i < m; i++) { tile(x, 108, tw, 28, aStr, C_PURPLE, false); x += tw + gap; }
      ctx.fillStyle = MUTED;
      ctx.font = f(800, 18);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('×', x - gap + midGap / 2, 122);
      x += midGap - gap;
      for (let i = 0; i < n; i++) { tile(x, 108, tw, 28, aStr, C_CYAN, false); x += tw + gap; }
      ctx.textAlign = 'left';

      ctx.fillStyle = DIM;
      ctx.font = f(700, 12);
      ctx.textAlign = 'center';
      ctx.fillText(`${m} 個`, (canvas.width - all) / 2 + totalM / 2, 154);
      ctx.fillText(`${n} 個`, (canvas.width + all) / 2 - totalN / 2, 154);
      ctx.textAlign = 'left';

      drawArrow(ctx, canvas.width / 2, 168, canvas.width / 2, 190, MUTED, 2);

      // 第 3 行：接成一排
      const [x0, x1] = tileRow(canvas.width / 2, 218, m + n, aStr, C_GOLD, tw, gap);
      ctx.strokeStyle = 'rgba(253,224,71,0.5)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x0 - 6, 240); ctx.lineTo(x0 - 6, 246);
      ctx.lineTo(x1 + 6, 246); ctx.lineTo(x1 + 6, 240);
      ctx.stroke();
      drawNote(ctx, `一共 ${m} + ${n} = ${m + n} 個 ${aStr} 相乘`, 262, C_GOLD, 14);

      drawExpr(ctx, [
        T('=', MUTED), PW(T(aStr, INK), `${m}+${n}`, false, INK),
        T('=', MUTED), PW(T(aStr, C_GOLD), resExp, false, C_GOLD)
      ], canvas.width / 2, 300, 23, INK);
    } else {
      // 除法：畫成上下兩排的分數，成對約掉
      const pair = Math.min(m, n);
      const cx = canvas.width / 2;
      tileRow(cx, 116, m, aStr, C_PURPLE, tw, gap, pair);
      const barW = Math.max(m, n) * tw + (Math.max(m, n) - 1) * gap + 20;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx - barW / 2, 150);
      ctx.lineTo(cx + barW / 2, 150);
      ctx.stroke();
      tileRow(cx, 184, n, aStr, C_CYAN, tw, gap, pair);

      ctx.fillStyle = NO_COLOR;
      ctx.font = f(700, 13);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`約掉 ${pair} 對`, cx, 216);
      ctx.textAlign = 'left';

      drawArrow(ctx, cx, 228, cx, 248, MUTED, 2);

      if (resExp > 0) {
        tileRow(cx, 274, resExp, aStr, C_GOLD, tw, gap);
        drawNote(ctx, `剩下 ${m} - ${n} = ${resExp} 個 ${aStr} 相乘`, 306, C_GOLD, 14);
        drawExpr(ctx, [
          T('=', MUTED), PW(T(aStr, INK), `${m}-${n}`, false, INK),
          T('=', MUTED), PW(T(aStr, C_GOLD), resExp, false, C_GOLD)
        ], cx, 342, 22, INK);
      } else if (resExp === 0) {
        drawNote(ctx, '上下剛好全部約光，結果是 1', 276, C_GOLD, 16);
        drawExpr(ctx, [
          T('=', MUTED), PW(T(aStr, INK), `${m}-${n}`, false, INK),
          T('=', MUTED), PW(T(aStr, C_GOLD), 0, false, C_GOLD),
          T('=', MUTED), T('1', OK_COLOR)
        ], cx, 312, 22, INK);
        drawNote(ctx, '這正是重點 6 要處理的情況', 346, MUTED, 13);
      } else {
        drawNote(ctx, `分母還多出 ${n - m} 個約不掉`, 276, NO_COLOR, 16);
        drawNote(ctx, '這一節的除法規定 m > n，指數不夠減就先不討論', 306, MUTED, 14);
      }
    }

    // 值（太大就不顯示）
    if (resExp > 0 && resExp <= 12) {
      const val = ipow(a, resExp);
      if (Math.abs(val) <= 1e7 && isMul) {
        drawExpr(ctx, [PW(T(aStr, DIM), resExp, false, DIM), T('=', DIM), T(val, DIM)],
          canvas.width / 2, 340, 15, DIM);
      }
    }

    // 面板
    formula.innerHTML = isMul
      ? `\\( ${aStr}^{${m}} \\times ${aStr}^{${n}} = ${aStr}^{${m}+${n}} = ${aStr}^{${m + n}} \\)`
      : `\\( ${aStr}^{${m}} \\div ${aStr}^{${n}} = ${aStr}^{${m}-${n}} = ${aStr}^{${m - n}} \\)`;

    let msg;
    if (isMul) {
      msg = `左邊 \\(${m}\\) 個、右邊 \\(${n}\\) 個，接成一排就是 \\(${m + n}\\) 個 \\(${aStr}\\) 相乘，所以<strong>指數相加</strong>。`;
    } else if (m > n) {
      msg = `上下各約掉 \\(${n}\\) 個之後，分子還剩 \\(${m - n}\\) 個，所以<strong>指數相減</strong>。`;
    } else if (m === n) {
      msg = `上下數量相同，全部約光得到 \\(1\\)；但照指數律算是 \\(${aStr}^{0}\\)——這就是 \\(a^0 = 1\\) 的由來。`;
    } else {
      msg = `目前 \\(m < n\\)，約完之後多出來的在分母，超出這一節「\\(m > n\\)」的範圍。`;
    }
    feedback.innerHTML = wrapFeedback(
      `${msg}<br><strong>底數必須完全相同</strong>，才數得成同一種磚，指數也才可以相加減。`
    );
    typeset([formula, feedback]);
  }

  opGroup.addEventListener('click', e => {
    const btn = e.target.closest('.pick-btn');
    if (!btn) return;
    op = btn.dataset.op;
    draw();
  });
  [aS, mS, nS].forEach(s => s.addEventListener('input', draw));
  draw();
  if (window.MathJax && MathJax.startup && MathJax.startup.promise) {
    MathJax.startup.promise.then(draw);
  }
}

/* ==========================================================================
   重點 5：展開推導器（乘方的乘方 / 兩數相乘 / 兩數相除）
   ========================================================================== */
function initDeriveCanvas() {
  const canvas = document.getElementById('canvas-derive');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const modeGroup = document.getElementById('dv-mode-group');
  const mS = document.getElementById('dv-m-slider');
  const nS = document.getElementById('dv-n-slider');
  const mV = document.getElementById('dv-m-val');
  const nV = document.getElementById('dv-n-val');
  const formula = document.getElementById('dv-formula');
  const feedback = document.getElementById('dv-feedback');

  let mode = 'pow';

  // 把 count 個 label 用 × 串成一列元件
  function chain(count, label, color, max) {
    const out = [];
    const shown = Math.min(count, max || 5);
    for (let i = 0; i < shown; i++) {
      if (i) out.push(T('×', MUTED));
      out.push(T(label, color));
    }
    if (count > shown) { out.push(T('×', MUTED)); out.push(T('…', MUTED)); }
    return out;
  }

  function draw() {
    const m = parseInt(mS.value, 10);
    const n = parseInt(nS.value, 10);
    mV.textContent = m;
    nV.textContent = mode === 'pow' ? n : '—（本模式不用）';
    nS.disabled = mode !== 'pow';
    [...modeGroup.querySelectorAll('.pick-btn')].forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rowY = [70, 132, 200, 268];
    const stepLabel = ['原式', '第 1 層：展開外層', '第 2 層：再展開內層', '收攏'];

    function labelRow(i, text) {
      ctx.fillStyle = DIM;
      ctx.font = f(700, 11);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 16, rowY[i] - 26);
      ctx.textAlign = 'left';
    }

    if (mode === 'pow') {
      drawTitle(ctx, `把 a 的 ${m} 次方當成一個整體，連乘 ${n} 次`, C_GOLD);

      labelRow(0, stepLabel[0]);
      drawExpr(ctx, [PW(PW(T('a', C_INDIGO), m, false, C_INDIGO), n, true, C_GOLD)],
        canvas.width / 2, rowY[0], 24, INK);

      labelRow(1, stepLabel[1]);
      const outer = [];
      const shownN = Math.min(n, 4);
      for (let i = 0; i < shownN; i++) {
        if (i) outer.push(T('×', MUTED));
        outer.push(PW(T('a', C_INDIGO), m, false, C_INDIGO));
      }
      if (n > shownN) { outer.push(T('×', MUTED)); outer.push(T('…', MUTED)); }
      drawExpr(ctx, [T('=', MUTED)].concat(outer), canvas.width / 2, rowY[1], 21, INK);
      ctx.fillStyle = DIM;
      ctx.font = f(600, 12);
      ctx.textAlign = 'center';
      ctx.fillText(`${n} 個 a 的 ${m} 次方`, canvas.width / 2, rowY[1] + 30);
      ctx.textAlign = 'left';

      labelRow(2, stepLabel[2]);
      const inner = [T('=', MUTED)];
      const shownN2 = Math.min(n, 3);
      for (let i = 0; i < shownN2; i++) {
        if (i) inner.push(T('×', MUTED));
        inner.push(GRP(chain(m, 'a', C_INDIGO, 3), '()', C_GOLD));
      }
      if (n > shownN2) { inner.push(T('×', MUTED)); inner.push(T('…', MUTED)); }
      drawExpr(ctx, inner, canvas.width / 2, rowY[2], 18, INK);
      ctx.fillStyle = C_GOLD;
      ctx.font = f(700, 13);
      ctx.textAlign = 'center';
      ctx.fillText(`每一組 ${m} 個，共 ${n} 組 → ${m} × ${n} = ${m * n} 個 a`, canvas.width / 2, rowY[2] + 34);
      ctx.textAlign = 'left';

      labelRow(3, stepLabel[3]);
      drawExpr(ctx, [
        T('=', MUTED), PW(T('a', INK), `${m}×${n}`, false, INK),
        T('=', MUTED), PW(T('a', C_GOLD), m * n, false, C_GOLD)
      ], canvas.width / 2, rowY[3] + 8, 24, INK);

      drawExpr(ctx, [
        T('對照：', MUTED),
        PW(T('a', MUTED), m, false, MUTED), T('×', MUTED), PW(T('a', MUTED), n, false, MUTED),
        T('=', MUTED), PW(T('a', MUTED), m + n, false, MUTED),
        T('是指數相加，不一樣', MUTED)
      ], canvas.width / 2, 350, 14, MUTED);

      formula.innerHTML = `\\( \\left(a^{${m}}\\right)^{${n}} = a^{${m} \\times ${n}} = a^{${m * n}} \\)`;
      feedback.innerHTML = wrapFeedback(
        `外層的 \\(${n}\\) 次方是把整個 \\(a^{${m}}\\) 連乘 \\(${n}\\) 次，` +
        `每一組裡有 \\(${m}\\) 個 \\(a\\)，全部攤開就是 \\(${m} \\times ${n} = ${m * n}\\) 個。<br>` +
        `所以是<strong style="color:${C_GOLD}">指數相乘</strong>，不要和 \\(a^m \\times a^n\\)（指數相加）搞混。`
      );
    } else {
      const isMul = mode === 'mul';
      const opTxt = isMul ? '×' : '÷';
      drawTitle(ctx, isMul ? `${m} 組「a 乘 b」，重排成 a 一堆、b 一堆`
        : `${m} 組「a 除以 b」，分子分母各自收攏`, C_GOLD);

      labelRow(0, stepLabel[0]);
      drawExpr(ctx, [PW(T(`a ${opTxt} b`, C_GOLD), m, true, C_GOLD)],
        canvas.width / 2, rowY[0], 24, INK);

      labelRow(1, '第 1 層：展開成 m 組');
      const grp = [T('=', MUTED)];
      const shown = Math.min(m, 4);
      for (let i = 0; i < shown; i++) {
        if (i) grp.push(T('×', MUTED));
        grp.push(GRP([T('a', C_INDIGO), T(opTxt, MUTED), T('b', C_ORANGE)], '()', C_GOLD));
      }
      if (m > shown) { grp.push(T('×', MUTED)); grp.push(T('…', MUTED)); }
      drawExpr(ctx, grp, canvas.width / 2, rowY[1], 19, INK);
      ctx.fillStyle = DIM;
      ctx.font = f(600, 12);
      ctx.textAlign = 'center';
      ctx.fillText(`${m} 組`, canvas.width / 2, rowY[1] + 30);
      ctx.textAlign = 'left';

      labelRow(2, '第 2 層：把同一個字母收在一起');
      if (isMul) {
        drawExpr(ctx, [T('=', MUTED)]
          .concat(chain(m, 'a', C_INDIGO, 4))
          .concat([T('×', MUTED)])
          .concat(chain(m, 'b', C_ORANGE, 4)),
          canvas.width / 2, rowY[2], 18, INK);
      } else {
        drawExpr(ctx, [
          T('=', MUTED),
          VF(chainToTxt(m, 'a'), chainToTxt(m, 'b'))
        ], canvas.width / 2, rowY[2] + 4, 17, INK);
      }
      ctx.fillStyle = C_GOLD;
      ctx.font = f(700, 13);
      ctx.textAlign = 'center';
      ctx.fillText(`a 有 ${m} 個、b 也有 ${m} 個`, canvas.width / 2, rowY[2] + 40);
      ctx.textAlign = 'left';

      labelRow(3, stepLabel[3]);
      drawExpr(ctx, [
        T('=', MUTED), PW(T('a', C_INDIGO), m, false, C_INDIGO),
        T(opTxt, MUTED), PW(T('b', C_ORANGE), m, false, C_ORANGE)
      ], canvas.width / 2, rowY[3] + 8, 24, INK);

      const ex = isMul
        ? [T('例：', MUTED), PW(T('2 × 3', MUTED), m, true, MUTED), T('=', MUTED),
           PW(T('2', MUTED), m, false, MUTED), T('×', MUTED), PW(T('3', MUTED), m, false, MUTED),
           T('=', MUTED), T(ipow(6, m), MUTED)]
        : [T('例：', MUTED), PW(T('6 ÷ 3', MUTED), m, true, MUTED), T('=', MUTED),
           PW(T('6', MUTED), m, false, MUTED), T('÷', MUTED), PW(T('3', MUTED), m, false, MUTED),
           T('=', MUTED), T(ipow(2, m), MUTED)];
      drawExpr(ctx, ex, canvas.width / 2, 350, 14, MUTED);

      formula.innerHTML = isMul
        ? `\\( (a \\times b)^{${m}} = a^{${m}} \\times b^{${m}} \\)`
        : `\\( (a \\div b)^{${m}} = a^{${m}} \\div b^{${m}} \\)`;
      feedback.innerHTML = wrapFeedback(
        `展開後 \\(a\\) 和 \\(b\\) 各出現 \\(${m}\\) 次，把同一個字母收在一起就得到 ` +
        (isMul ? `\\(a^{${m}} \\times b^{${m}}\\)` : `\\(a^{${m}} \\div b^{${m}}\\)`) + `。<br>` +
        `<strong>乘法與除法都成立</strong>；但<strong style="color:${NO_COLOR}">加減不成立</strong>：\\((a+b)^m \\neq a^m + b^m\\)。`
      );
    }

    typeset([formula, feedback]);
  }

  // 除法模式的分子分母要當成單一字串畫，才排得進分數線
  function chainToTxt(count, label) {
    const shown = Math.min(count, 4);
    let s = Array(shown).fill(label).join('×');
    if (count > shown) s += '×…×' + label;
    return T(s, label === 'a' ? C_INDIGO : C_ORANGE);
  }

  modeGroup.addEventListener('click', e => {
    const btn = e.target.closest('.pick-btn');
    if (!btn) return;
    mode = btn.dataset.mode;
    draw();
  });
  [mS, nS].forEach(s => s.addEventListener('input', draw));
  draw();
  if (window.MathJax && MathJax.startup && MathJax.startup.promise) {
    MathJax.startup.promise.then(draw);
  }
}

/* ==========================================================================
   重點 6：指數階梯（a^0 = 1 的由來）
   ========================================================================== */
function initZeroCanvas() {
  const canvas = document.getElementById('canvas-zero');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const aS = document.getElementById('ze-a-slider');
  const stepS = document.getElementById('ze-step-slider');
  const aV = document.getElementById('ze-a-val');
  const stepV = document.getElementById('ze-step-val');
  const formula = document.getElementById('ze-formula');
  const feedback = document.getElementById('ze-feedback');

  function draw() {
    const a = parseInt(aS.value, 10);
    const step = clamp(parseInt(stepS.value, 10), 0, 4);
    aV.textContent = a;
    stepV.textContent = `${step} / 4`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTitle(ctx, '每往下一階就除以一次 a', C_CYAN);

    if (a === 0) {
      drawNote(ctx, '底數不可以是 0', 170, NO_COLOR, 22);
      drawNote(ctx, '零次方的規定寫得很清楚：a 必須是「不為 0 的數」', 210, MUTED, 15);
      drawNote(ctx, '因為 0⁰ 沒有辦法用 0^m ÷ 0^m 定義（會除以 0）', 238, DIM, 14);
      formula.innerHTML = `\\( 0^0 \\) 沒有定義`;
      feedback.innerHTML = wrapFeedback(
        `\\(a^0 = 1\\) 的規定只對<strong style="color:${NO_COLOR}">不為 \\(0\\) 的 \\(a\\)</strong> 成立。把底數調成其他值再看一次。`
      );
      typeset([formula, feedback]);
      return;
    }

    const aStr = a < 0 ? `(${a})` : String(a);
    const tw = 92, th = 32;
    const x0 = 26, y0 = 58, dx = (canvas.width - 2 * x0 - tw) / 4, dy = 37;

    for (let i = 0; i <= 4; i++) {
      const e = 4 - i;
      const x = x0 + dx * i;
      const y = y0 + dy * i;
      const active = i <= step;
      const isZero = e === 0;

      // 階梯的踢面
      if (i > 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x0 + dx * (i - 1) + tw, y0 + dy * (i - 1) + th / 2);
        ctx.lineTo(x, y0 + dy * (i - 1) + th / 2);
        ctx.lineTo(x, y + th / 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.globalAlpha = active ? 1 : 0.3;
      const col = isZero && active ? C_GOLD : C_CYAN;
      ctx.fillStyle = isZero && active ? 'rgba(253,224,71,0.16)' : 'rgba(103,232,249,0.10)';
      roundRect(ctx, x, y, tw, th, 8);
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = isZero && active ? 2.4 : 1.6;
      ctx.stroke();
      ctx.restore();

      // 踏板上的 a^e
      ctx.save();
      ctx.globalAlpha = active ? 1 : 0.35;
      const label = [PW(T(aStr, isZero && active ? C_GOLD : C_CYAN), e, false)];
      drawExpr(ctx, label, x + tw * 0.34, y + th / 2, 17,
        isZero && active ? C_GOLD : C_CYAN, { maxW: tw });
      ctx.restore();

      // 值
      const val = ipow(a, e);
      ctx.save();
      ctx.globalAlpha = active ? 1 : 0.3;
      ctx.fillStyle = isZero && active ? C_GOLD : INK;
      ctx.font = f(800, 14);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`= ${val}`, x + tw / 2, y + th + 15);
      ctx.restore();
      ctx.textAlign = 'left';

      // 每一階之間的 ÷a
      if (i < 4) {
        ctx.save();
        ctx.globalAlpha = i < step ? 1 : 0.28;
        ctx.fillStyle = C_ORANGE;
        ctx.font = f(800, 13);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`÷ ${aStr}`, x + tw + dx / 2 - 6, y + dy / 2 + 4);
        ctx.restore();
        ctx.textAlign = 'left';
      }
    }

    // 兩種算法的對照（第一行有分數，行距要留得比純文字大）
    const y2 = 266;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    roundRect(ctx, 18, y2, canvas.width - 36, 106, 10);
    ctx.fill();
    ctx.strokeStyle = step >= 4 ? 'rgba(253,224,71,0.5)' : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = step >= 4 ? 1 : 0.4;
    drawExpr(ctx, [
      T('約分：', MUTED),
      PW(T(aStr, C_CYAN), 4, false, C_CYAN), T('÷', MUTED), PW(T(aStr, C_CYAN), 4, false, C_CYAN),
      T('=', MUTED), VF(T(repeatStr(aStr, 4), C_INDIGO), T(repeatStr(aStr, 4), C_INDIGO)),
      T('=', MUTED), T('1', OK_COLOR)
    ], canvas.width / 2, y2 + 27, 15, INK, { maxW: canvas.width - 52 });
    drawExpr(ctx, [
      T('指數律：', MUTED),
      PW(T(aStr, C_CYAN), 4, false, C_CYAN), T('÷', MUTED), PW(T(aStr, C_CYAN), 4, false, C_CYAN),
      T('=', MUTED), PW(T(aStr, C_GOLD), '4-4', false, C_GOLD),
      T('=', MUTED), PW(T(aStr, C_GOLD), 0, false, C_GOLD)
    ], canvas.width / 2, y2 + 62, 15, INK, { maxW: canvas.width - 52 });
    drawExpr(ctx, [
      T('兩種算法要一致，所以規定', C_GOLD),
      PW(T(aStr, C_GOLD), 0, false, C_GOLD), T('=', C_GOLD), T('1', OK_COLOR)
    ], canvas.width / 2, y2 + 90, 15, C_GOLD, { maxW: canvas.width - 52 });
    ctx.restore();

    // 面板
    const cur = 4 - step;
    formula.innerHTML = `\\( ${aStr}^{${cur}} = ${ipow(a, cur)} \\)`;

    let msg;
    if (step < 4) {
      msg = `現在站在 \\(${aStr}^{${cur}}\\)，值是 \\(${ipow(a, cur)}\\)。再往下一階就是除以一次 \\(${aStr}\\)，` +
        `得到 \\(${aStr}^{${cur - 1}} = ${ipow(a, cur - 1)}\\)。`;
    } else {
      msg = `走到最後一階 \\(${aStr}^{0}\\)。從 \\(${aStr}^{1} = ${a}\\) 再除以一次 \\(${aStr}\\)，` +
        `結果自然就是 <strong style="color:${C_GOLD}">\\(1\\)</strong>——這就是為什麼規定 \\(a^0 = 1\\)。`;
    }
    feedback.innerHTML = wrapFeedback(
      `${msg}<br>下面兩行是同一個算式的兩種算法，要讓它們一致，就只能規定 \\(a^0 = 1\\)（\\(a \\neq 0\\)）。`
    );
    typeset([formula, feedback]);
  }

  [aS, stepS].forEach(s => s.addEventListener('input', draw));
  draw();
  if (window.MathJax && MathJax.startup && MathJax.startup.promise) {
    MathJax.startup.promise.then(draw);
  }
}
