document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quiz System
  initQuizSystem();

  // Initialize Canvas Simulations
  initBoardCanvas();
  initShorthandCanvas();
  initOrderCanvas();
  initSubCanvas();
  initSortCanvas();
  initSimplifyCanvas();
});

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // Correct answers mapping for Section 3-1 (12 Quizzes)
  const answers = {
    '3-1-1-1': 'B', // 貴 12 元是 x+12，不是 12x
    '3-1-1-2': 'D', // 未知不等於「不能是某個數」
    '3-1-2-1': 'C', // -9b+4.5，加號不可省
    '3-1-2-2': 'D', // 乘倒數 -4/7，負號留著
    '3-1-3-1': 'D', // 每人都折，要用括號 9(c-5)
    '3-1-3-2': 'A', // 3 倍還少 18 是 3y-18
    '3-1-4-1': 'B', // (-5)x(-0.4) = 2
    '3-1-4-2': 'C', // 20 - 8/3 x 3/4 = 18
    '3-1-5-1': 'B', // 係數 -5/2，常數項 7
    '3-1-5-2': 'D', // (-8x)x(-5/4) = 10x
    '3-1-6-1': 'C', // -8x+12-5x+5 = -13x+17
    '3-1-6-2': 'B'  // 9x+6x-15 = 15x-15
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
   2. 本節配色與飲料杯繪圖（通用繪圖工具在 ../math-canvas.js）
   ========================================================================== */

// 手搖飲黑板菜單配色：奶茶金、抹茶綠、莓果粉、天藍、葡萄紫、黑糖焦橘
const C_GOLD = '#fcd34d';
const C_MATCHA = '#6ee7b7';
const C_BERRY = '#f9a8d4';
const C_SKY = '#7dd3fc';
const C_GRAPE = '#e9d5ff';
const C_CARAMEL = '#fdba74';

// 一個手搖杯：梯形杯身 + 杯蓋 + 吸管
function drawCup(ctx, cx, topY, w, h, color, filled) {
  const halfTop = w / 2;
  const halfBot = w * 0.38;
  const bodyTop = topY + h * 0.13;
  const bodyBot = topY + h;

  ctx.save();
  // 杯身
  ctx.beginPath();
  ctx.moveTo(cx - halfTop, bodyTop);
  ctx.lineTo(cx + halfTop, bodyTop);
  ctx.lineTo(cx + halfBot, bodyBot);
  ctx.lineTo(cx - halfBot, bodyBot);
  ctx.closePath();
  ctx.fillStyle = filled ? 'rgba(252, 211, 77, 0.16)' : 'rgba(255,255,255,0.04)';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 珍珠（杯底幾顆）
  ctx.fillStyle = 'rgba(120, 72, 40, 0.75)';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(cx + i * (w * 0.20), bodyBot - h * 0.12, w * 0.075, 0, Math.PI * 2);
    ctx.fill();
  }

  // 杯蓋
  ctx.beginPath();
  roundRect(ctx, cx - halfTop - 2, topY + h * 0.04, w + 4, h * 0.11, 3);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.fill();
  ctx.globalAlpha = 1;

  // 吸管
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.10, topY + h * 0.06);
  ctx.lineTo(cx + w * 0.26, topY - h * 0.22);
  ctx.stroke();
  ctx.restore();
}

/* ==========================================================================
   重點 1：牌價未定的價目板
   ========================================================================== */
function initBoardCanvas() {
  const canvas = document.getElementById('canvas-board');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const nSlider = document.getElementById('bd-n-slider');
  const nVal = document.getElementById('bd-n-val');
  const formulaEl = document.getElementById('bd-formula');
  const feedbackEl = document.getElementById('bd-feedback');

  let n = 3;
  let price = 0; // 0 表示牌價尚未公布

  function draw() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    drawTitle(ctx, price === 0 ? '一杯 x 元，買 n 杯要多少錢？' : `一杯 ${price} 元，買 ${n} 杯要多少錢？`, C_GOLD);

    // 杯子排
    const cupW = Math.min(56, (W - 60) / n - 10);
    const gap = 12;
    const totalW = n * cupW + (n - 1) * gap;
    let cx = (W - totalW) / 2 + cupW / 2;
    for (let i = 0; i < n; i++) {
      drawCup(ctx, cx, 56, cupW, 74, C_GOLD, price > 0);
      ctx.fillStyle = price > 0 ? C_GOLD : INK;
      ctx.font = price > 0 ? f(700, 15) : fi(700, 18);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(price > 0 ? `${price}元` : 'x', cx, 150);
      cx += cupW + gap;
    }
    ctx.textAlign = 'left';

    // 連加式
    const addItems = [];
    for (let i = 0; i < n; i++) {
      if (i) addItems.push(T('+', MUTED));
      addItems.push(IT('x', INK));
    }
    drawNote(ctx, '一杯一杯加起來', 178, DIM, 13);
    drawExpr(ctx, addItems, W / 2, 202, 22, INK, { gap: 7 });

    drawArrow(ctx, W / 2, 218, W / 2, 236, MUTED, 2);

    // 收攏成 nx
    drawPanel(ctx, 40, 244, W - 80, 46, C_GOLD, 0.10);
    drawExpr(ctx, [
      T(String(n), C_GOLD), T('×', MUTED), IT('x', C_GOLD),
      T('=', MUTED), xItems(n, C_GOLD)
    ], W / 2, 267, 26, C_GOLD, { gap: 9 });

    if (price === 0) {
      drawNote(ctx, '牌價還沒公布，x 可以是任何數', 312, INK, 14);
      drawNote(ctx, '式子 ' + coefTex(n) + 'x 已經把「幾杯就是幾個 x」的關係記下來了', 336, MUTED, 13);
    } else {
      const total = n * price;
      drawNote(ctx, `把 x = ${price} 代進去`, 310, MUTED, 13);
      drawExpr(ctx, [
        xItems(n, C_MATCHA), T('=', MUTED),
        T(String(n), C_MATCHA), T('×', MUTED), GRP([T(String(price), C_MATCHA)], '()', C_MATCHA),
        T('=', MUTED), T(String(total), OK_COLOR)
      ], W / 2, 340, 24, C_MATCHA, { gap: 8 });
    }
  }

  function update() {
    n = parseInt(nSlider.value, 10);
    nVal.textContent = n;
    draw();

    if (price === 0) {
      formulaEl.innerHTML = `\\( ${n} \\times x = ${coefTex(n)}x \\)`;
      feedbackEl.innerHTML = wrapFeedback(
        `一杯 <strong style="color:${C_GOLD}">x</strong> 元，買 <strong>${n}</strong> 杯就是 <strong>${n} 個 x 相加</strong>，簡記成 \\(${coefTex(n)}x\\)。<br>` +
        `牌價還沒公布也沒關係——<strong style="color:${C_GOLD}">代數式記的是關係，不是答案</strong>。`
      );
    } else {
      const total = n * price;
      formulaEl.innerHTML = `\\( ${coefTex(n)}x = ${n} \\times ${price} = ${total} \\)`;
      feedbackEl.innerHTML = wrapFeedback(
        `牌價公布為 <strong>${price}</strong> 元，把 \\(x = ${price}\\) 代入 \\(${coefTex(n)}x\\)，得 <strong style="color:${OK_COLOR}">${total}</strong> 元。<br>` +
        `式子 \\(${coefTex(n)}x\\) <strong>一個字都沒有改</strong>，換的只是 \\(x\\) 代表的數。`
      );
    }
    typeset([formulaEl, feedbackEl]);
  }

  nSlider.addEventListener('input', update);
  bindPickGroup(document.getElementById('bd-price-group'), 'data-price', v => {
    price = parseInt(v, 10);
    update();
  });
  update();
}

/* ==========================================================================
   重點 2：簡記工作台
   ========================================================================== */
function initShorthandCanvas() {
  const canvas = document.getElementById('canvas-short');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const formulaEl = document.getElementById('sh-formula');
  const feedbackEl = document.getElementById('sh-feedback');
  const stepEl = document.getElementById('sh-step');
  const prevBtn = document.getElementById('sh-prev');
  const nextBtn = document.getElementById('sh-next');

  const CASES = [
    {
      title: '乘法簡記：3 × x',
      steps: [
        { items: [T('3'), T('×', MUTED), IT('x')], tex: '3 \\times x', note: '原式。數字 3 與文字符號 x 之間夾著一個乘號。' },
        { items: [T('3'), T('·', MUTED), IT('x')], tex: '3 \\cdot x', note: '乘號 × 和字母 x 太像，先改寫成一個小點。' },
        { items: [SEQ([T('3'), IT('x')], null, 1)], tex: '3x', note: '點也可以省略，直接把數字寫在文字符號前面，簡記為 3x。' }
      ]
    },
    {
      title: '乘法簡記：x × 3',
      steps: [
        { items: [IT('x'), T('×', MUTED), T('3')], tex: 'x \\times 3', note: '原式。這次數字寫在後面。' },
        { items: [T('3'), T('×', MUTED), IT('x')], tex: '3 \\times x', note: 'x 代表一個數，用乘法交換律把數字換到前面。' },
        { items: [SEQ([T('3'), IT('x')], null, 1)], tex: '3x', note: '省略乘號得 3x。習慣上不寫成 x3——數字一律寫在前面。' }
      ]
    },
    {
      title: '係數是 −1：(−1) × y',
      steps: [
        { items: [GRP([T('-1')], '()'), T('×', MUTED), IT('y')], tex: '(-1) \\times y', note: '原式。括號裡的 −1 是一個負數。' },
        { items: [GRP([T('-1')], '()'), T('·', MUTED), IT('y')], tex: '(-1) \\cdot y', note: '乘號改成點，寫成 (−1)y。' },
        { items: [SEQ([T('-'), GRP([SEQ([T('1'), IT('y')], null, 1)], '()')], null, 2)], tex: '-(1y)', note: 'y 代表一個數，仿照數的運算規則，負號可以提到最外面。' },
        { items: [SEQ([T('-'), IT('y')], null, 1)], tex: '-y', note: '1 乘任何數都等於該數，所以 1y 就是 y，簡記為 −y。' }
      ]
    },
    {
      title: '除法簡記：x ÷ 5',
      steps: [
        { items: [IT('x'), T('÷', MUTED), T('5')], tex: 'x \\div 5', note: '原式。被除數是文字符號 x。' },
        { items: [IT('x'), T('×', MUTED), FR(1, 5)], tex: 'x \\times \\frac{1}{5}', note: '除以一個不為 0 的數，就是乘以它的倒數。5 的倒數是 1/5。' },
        { items: [VF(IT('x'), T('5'))], tex: '\\frac{x}{5}', note: 'x 乘以 1/5 就是 x 的五分之一，寫成分數 x/5，x 留在分子。' }
      ]
    },
    {
      title: '除以負數：x ÷ (−5)',
      steps: [
        { items: [IT('x'), T('÷', MUTED), GRP([T('-5')], '()')], tex: 'x \\div (-5)', note: '原式。除數是負數 −5。' },
        { items: [IT('x'), T('×', MUTED), VF(T('1'), T('-5'))], tex: 'x \\times \\frac{1}{-5}', note: '−5 的倒數是 1/(−5)，一樣是乘倒數。' },
        { items: [VF(IT('x'), T('-5'))], tex: '\\frac{x}{-5}', note: '寫成分數，負號目前在分母。' },
        { items: [SEQ([T('-'), VF(IT('x'), T('5'))], null, 2)], tex: '-\\frac{x}{5}', note: '負號可以提到分數前面，也可以寫成 −(1/5)x。三種寫法值都相同。' }
      ]
    },
    {
      title: '除以分數：x ÷ (2/3)',
      steps: [
        { items: [IT('x'), T('÷', MUTED), FR(2, 3)], tex: 'x \\div \\frac{2}{3}', note: '原式。除數是一個分數。' },
        { items: [IT('x'), T('·', MUTED), FR(3, 2)], tex: 'x \\cdot \\frac{3}{2}', note: '分數的倒數就是分子分母對調，2/3 的倒數是 3/2。' },
        { items: [SEQ([FR(3, 2), IT('x')], null, 2)], tex: '\\frac{3}{2}x', note: '把係數寫在前面，得 (3/2)x。' },
        { items: [VF(SEQ([T('3'), IT('x')], null, 1), T('2'))], tex: '\\frac{3x}{2}', note: '也可以把 x 併進分子寫成 3x/2，兩種寫法完全相同。' }
      ]
    }
  ];

  let ci = 0, si = 0;

  function draw() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const cs = CASES[ci];
    drawTitle(ctx, cs.title, C_MATCHA);

    const total = cs.steps.length;
    const top = 78;
    const gapY = Math.min(60, (300 - top) / Math.max(1, total - 1));

    for (let i = 0; i <= si; i++) {
      const isCur = (i === si);
      const y = top + i * gapY;
      if (isCur) drawPanel(ctx, 40, y - 24, W - 80, 48, C_MATCHA, 0.10);
      const color = isCur ? C_MATCHA : DIM;
      const size = isCur ? 27 : 22;
      const items = (i === 0) ? cs.steps[i].items : [T('=', isCur ? MUTED : DIM)].concat(cs.steps[i].items);
      drawExpr(ctx, items, W / 2, y, size, color, { gap: 8, maxW: W - 100 });
    }

    // 底部說明
    const note = cs.steps[si].note;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    roundRect(ctx, 24, 322, W - 48, 42, 10);
    ctx.fill();
    ctx.restore();
    wrapText(ctx, note, W / 2, 336, W - 70, 17, INK, 13.5);
  }

  function update() {
    const cs = CASES[ci];
    si = clamp(si, 0, cs.steps.length - 1);
    stepEl.textContent = `${si + 1} / ${cs.steps.length}`;
    prevBtn.disabled = (si === 0);
    nextBtn.disabled = (si === cs.steps.length - 1);
    draw();

    formulaEl.innerHTML = `\\( ${cs.steps[si].tex} \\)`;
    const last = cs.steps[cs.steps.length - 1];
    feedbackEl.innerHTML = wrapFeedback(
      `${cs.steps[si].note}<br>` +
      (si === cs.steps.length - 1
        ? `<strong style="color:${OK_COLOR}">簡記完成：</strong>\\( ${cs.steps[0].tex} = ${last.tex} \\)`
        : `<span style="color:${MUTED}">按「下一步」看它怎麼變乾淨。</span>`)
    );
    typeset([formulaEl, feedbackEl]);
  }

  prevBtn.addEventListener('click', () => { si--; update(); });
  nextBtn.addEventListener('click', () => { si++; update(); });
  bindPickGroup(document.getElementById('sh-case-group'), 'data-case', v => {
    ci = parseInt(v, 10);
    si = 0;
    update();
  });
  update();
}

/* ==========================================================================
   重點 3：點單列式器
   ========================================================================== */
function initOrderCanvas() {
  const canvas = document.getElementById('canvas-order');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const nSlider = document.getElementById('od-n-slider');
  const mSlider = document.getElementById('od-m-slider');
  const nVal = document.getElementById('od-n-val');
  const mVal = document.getElementById('od-m-val');
  const formulaEl = document.getElementById('od-formula');
  const feedbackEl = document.getElementById('od-feedback');

  let n = 3, m = 10, cup = 0;

  function perCupTex() {
    let s = 'x';
    if (m > 0) s += ` + ${m}`;
    if (cup) s += ' - 5';
    return s;
  }

  function draw() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '一張訂單，一條代數式', C_BERRY);

    // 左側：收據
    const rx = 24, ry = 54, rw = 176, rh = 268;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, rx, ry, rw, rh, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C_BERRY;
    ctx.font = f(800, 15);
    ctx.fillText('點 單', rx + rw / 2, ry + 22);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(rx + 12, ry + 38);
    ctx.lineTo(rx + rw - 12, ry + 38);
    ctx.stroke();

    ctx.textAlign = 'left';
    let ly = ry + 62;
    ctx.font = f(600, 14);
    ctx.fillStyle = INK;
    ctx.fillText(`紅茶 × ${n} 杯`, rx + 16, ly);
    ctx.textAlign = 'right';
    ctx.font = fi(700, 15);
    ctx.fillText('x', rx + rw - 18, ly);
    ctx.textAlign = 'left';

    ly += 30;
    ctx.font = f(600, 14);
    ctx.fillStyle = m > 0 ? INK : DIM;
    ctx.fillText('每杯加料', rx + 16, ly);
    ctx.textAlign = 'right';
    ctx.font = f(700, 15);
    ctx.fillStyle = m > 0 ? C_GOLD : DIM;
    ctx.fillText(m > 0 ? `+${m}` : '—', rx + rw - 18, ly);
    ctx.textAlign = 'left';

    ly += 30;
    ctx.font = f(600, 14);
    ctx.fillStyle = cup ? INK : DIM;
    ctx.fillText('自備環保杯', rx + 16, ly);
    ctx.textAlign = 'right';
    ctx.font = f(700, 15);
    ctx.fillStyle = cup ? C_MATCHA : DIM;
    ctx.fillText(cup ? '−5' : '—', rx + rw - 18, ly);
    ctx.textAlign = 'left';

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(rx + 12, ly + 20);
    ctx.lineTo(rx + rw - 12, ly + 20);
    ctx.stroke();

    // 收據上的杯子小圖
    const cupsY = ly + 40;
    const cw = Math.min(30, (rw - 40) / n - 4);
    let ccx = rx + rw / 2 - (n * (cw + 4) - 4) / 2 + cw / 2;
    for (let i = 0; i < n; i++) {
      drawCup(ctx, ccx, cupsY, cw, cw * 1.25, C_BERRY, true);
      ccx += cw + 4;
    }

    ctx.textAlign = 'center';
    ctx.font = f(700, 13);
    ctx.fillStyle = MUTED;
    ctx.fillText('每一杯都一樣', rx + rw / 2, ry + rh - 22);
    ctx.textAlign = 'left';

    // 右側：列式三步
    const bx = 216, bw = W - bx - 20;
    const k = m - (cup ? 5 : 0);

    drawPanel(ctx, bx, 60, bw, 78, C_BERRY, 0.08);
    drawNote2(ctx, '一杯要付', bx + 14, 78, MUTED, 13);
    const perItems = [IT('x', C_BERRY)];
    if (m > 0) { perItems.push(T('+', MUTED)); perItems.push(T(String(m), C_GOLD)); }
    if (cup) { perItems.push(T('-', MUTED)); perItems.push(T('5', C_MATCHA)); }
    if (m > 0 || cup) {
      perItems.push(T('=', MUTED));
      if (k === 0) perItems.push(IT('x', C_BERRY));
      else perItems.push(SEQ([IT('x', C_BERRY), T(k > 0 ? '+' : '-', MUTED), T(String(Math.abs(k)), C_BERRY)], null, 5));
    }
    drawExpr(ctx, perItems, bx + bw / 2, 112, 22, C_BERRY, { gap: 7, maxW: bw - 20 });

    const needParen = (k !== 0) && (n > 1);
    drawPanel(ctx, bx, 150, bw, 78, C_BERRY, 0.08);
    drawNote2(ctx, `${n} 杯合計`, bx + 14, 168, MUTED, 13);
    const inner = (k === 0)
      ? [IT('x', C_BERRY)]
      : [SEQ([IT('x', C_BERRY), T(k > 0 ? '+' : '-', MUTED), T(String(Math.abs(k)), C_BERRY)])];
    const totItems = (n === 1)
      ? inner.slice()
      : (needParen
        ? [T(String(n), C_GOLD), GRP(inner, '()', C_BERRY)]
        : [SEQ([T(String(n), C_GOLD), IT('x', C_BERRY)], null, 1)]);
    drawExpr(ctx, totItems, bx + bw / 2, 202, 25, C_BERRY, { gap: 6, maxW: bw - 20 });

    drawPanel(ctx, bx, 240, bw, 82, C_MATCHA, 0.08);
    drawNote2(ctx, '用分配律展開', bx + 14, 258, MUTED, 13);
    const nk = n * k;
    const expItems = [xItems(n, C_MATCHA)];
    if (nk !== 0) {
      expItems.push(T(nk > 0 ? '+' : '-', MUTED));
      expItems.push(T(String(Math.abs(nk)), C_MATCHA));
    }
    drawExpr(ctx, expItems, bx + bw / 2, 294, 25, C_MATCHA, { gap: 7, maxW: bw - 20 });

    const tip = (n > 1 && k !== 0)
      ? '「每一杯都…」要先用括號把一杯包起來，再乘杯數'
      : (k === 0 ? '加料費和折扣剛好抵銷，一杯就是 x 元' : '只有一杯，不需要括號');
    wrapText(ctx, tip, W / 2, 344, W - 60, 17, MUTED, 13.5);
  }

  function update() {
    n = parseInt(nSlider.value, 10);
    m = parseInt(mSlider.value, 10);
    nVal.textContent = n;
    mVal.textContent = m;
    draw();

    const k = m - (cup ? 5 : 0);
    const per = perCupTex();
    const perSimp = (k === 0) ? 'x' : `x ${k > 0 ? '+' : '-'} ${Math.abs(k)}`;
    const nk = n * k;
    const nx = `${coefTex(n)}x`;
    const expanded = (nk === 0) ? nx : `${nx} ${nk > 0 ? '+' : '-'} ${Math.abs(nk)}`;
    const grouped = (n === 1) ? perSimp : (k === 0 ? nx : `${n}(${perSimp})`);

    formulaEl.innerHTML = `\\( ${grouped} = ${expanded} \\)`;
    feedbackEl.innerHTML = wrapFeedback(
      `一杯要付 \\( ${per} ${k !== 0 || m > 0 || cup ? '= ' + perSimp : ''} \\) 元，` +
      `${n} 杯就是 \\( ${grouped} \\) 元，展開後是 \\( ${expanded} \\) 元。<br>` +
      (n > 1 && k !== 0
        ? `<strong style="color:${C_BERRY}">括號不能省</strong>：\\( ${nx} ${k > 0 ? '+' : '-'} ${Math.abs(k)} \\) 只加（折）了一次，少算了 ${n - 1} 杯的份。`
        : (k === 0
          ? `加料 ${m} 元、折 ${cup ? 5 : 0} 元剛好抵銷，一杯就是原價 \\(x\\) 元。`
          : `只有一杯時括號可有可無，但<strong>多杯就一定要括起來</strong>。`))
    );
    typeset([formulaEl, feedbackEl]);
  }

  nSlider.addEventListener('input', update);
  mSlider.addEventListener('input', update);
  bindPickGroup(document.getElementById('od-cup-group'), 'data-cup', v => {
    cup = parseInt(v, 10);
    update();
  });
  update();
}

/* ==========================================================================
   重點 4：代入結帳機
   ========================================================================== */
function initSubCanvas() {
  const canvas = document.getElementById('canvas-sub');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const xSlider = document.getElementById('sb-x-slider');
  const xVal = document.getElementById('sb-x-val');
  const formulaEl = document.getElementById('sb-formula');
  const feedbackEl = document.getElementById('sb-feedback');

  // 滑桿走半格，讓 x 可以是 −6 到 6 的 0.5 倍數
  const CASES = [
    {
      tex: '-4x',
      items: () => [xItems(-4)],
      // 回傳 { subItems, midItems, value, valueTex }
      calc: (x) => {
        const v = -4 * x;
        return {
          sub: [T('-4'), T('×', MUTED), GRP([T(numStr(x))], '()', C_SKY)],
          subTex: `(-4) \\times (${numStr(x)})`,
          mid: null,
          val: numStr(v),
          valTex: numStr(v)
        };
      }
    },
    {
      tex: '2x - 7',
      items: () => [xItems(2), T('-', MUTED), T('7')],
      calc: (x) => {
        const p = 2 * x;
        const v = p - 7;
        return {
          sub: [T('2'), T('×', MUTED), GRP([T(numStr(x))], '()', C_SKY), T('-', MUTED), T('7')],
          subTex: `2 \\times (${numStr(x)}) - 7`,
          mid: [T(numStr(p)), T('-', MUTED), T('7')],
          midTex: `${numStr(p)} - 7`,
          val: numStr(v),
          valTex: numStr(v)
        };
      }
    },
    {
      tex: '15 - \\frac{2}{3}x',
      items: () => [T('15'), T('-', MUTED), SEQ([FR(2, 3), IT('x')], null, 2)],
      calc: (x) => {
        // x = h/2，(2/3)x = h/3，用分數保持精確
        const h = Math.round(x * 2);
        let pn = h, pd = 3;
        const rp = reduce(pn, pd);
        pn = rp[0]; pd = rp[1];
        let vn = 15 * pd - pn, vd = pd;
        const rv = reduce(vn, vd);
        vn = rv[0]; vd = rv[1];
        const pAbs = (pd === 1) ? T(String(Math.abs(pn))) : FR(Math.abs(pn), pd);
        // 減去一個負數時要把它括起來，否則畫面上會出現兩個相連的減號
        const pItem = (pn < 0) ? GRP([SEQ([T('-'), pAbs], null, 2)], '()') : pAbs;
        const vItem = (vd === 1) ? T(String(vn)) : (vn < 0 ? SEQ([T('-'), FR(-vn, vd)], null, 2) : FR(vn, vd));
        return {
          sub: [T('15'), T('-', MUTED), FR(2, 3), T('×', MUTED), GRP([T(numStr(x))], '()', C_SKY)],
          subTex: `15 - \\frac{2}{3} \\times (${numStr(x)})`,
          mid: [T('15'), T('-', MUTED), pItem],
          midTex: (pn < 0) ? `15 - \\left(${texFrac(pn, pd)}\\right)` : `15 - ${texFrac(pn, pd)}`,
          val: null,
          valItem: vItem,
          valTex: texFrac(vn, vd)
        };
      }
    }
  ];

  let ci = 0;
  let x = 3;

  function draw() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '把 x 代表的數代進式子裡', C_SKY);

    const cs = CASES[ci];
    const r = cs.calc(x);

    drawNote(ctx, '代數式', 50, DIM, 13);
    drawExpr(ctx, cs.items(), W / 2, 88, 28, INK, { gap: 8 });

    drawNote(ctx, `x = ${numStr(x)} 代入（負數要加括號）`, 128, MUTED, 13);
    drawPanel(ctx, 40, 144, W - 80, 50, C_SKY, 0.08);
    drawExpr(ctx, r.sub, W / 2, 169, 26, C_SKY, { gap: 8, maxW: W - 100 });

    let y = 214;
    if (r.mid) {
      drawExpr(ctx, [T('=', MUTED)].concat(r.mid), W / 2, y + 14, 24, INK, { gap: 8, maxW: W - 100 });
      y += 48;
    }

    drawPanel(ctx, 130, y + 4, W - 260, 54, OK_COLOR, 0.12);
    const valItem = r.valItem ? [r.valItem] : [T(r.val)];
    drawExpr(ctx, [T('=', MUTED)].concat(valItem), W / 2, y + 31, 30, OK_COLOR, { gap: 10 });

    const tip = x < 0
      ? 'x 是負數，要加括號隔開——運算符號與性質符號不能相鄰'
      : (Math.abs(x * 2) % 2 === 1 ? 'x 是正的小數，不必加括號，照樣先乘除後加減' : '代入之後就是單純的數的運算');
    wrapText(ctx, tip, W / 2, 352, W - 60, 17, MUTED, 13.5);
  }

  function update() {
    x = parseInt(xSlider.value, 10) / 2;
    xVal.textContent = numStr(x);
    draw();

    const cs = CASES[ci];
    const r = cs.calc(x);
    formulaEl.innerHTML = `\\( ${cs.tex} = ${r.valTex} \\)`;
    feedbackEl.innerHTML = wrapFeedback(
      `把 \\( x = ${numStr(x)} \\) 代入 \\( ${cs.tex} \\)：<br>` +
      `\\( ${cs.tex} = ${r.subTex} ${r.midTex ? '= ' + r.midTex : ''} = ${r.valTex} \\)<br>` +
      (x < 0
        ? `<strong style="color:${C_SKY}">代入負數要加括號</strong>——乘號是運算符號、負號是性質符號，兩者不能直接相鄰。`
        : `同一條式子，換一個 \\(x\\) 就換一個值——這正是代數式好用的地方。`)
    );
    typeset([formulaEl, feedbackEl]);
  }

  xSlider.addEventListener('input', update);
  bindPickGroup(document.getElementById('sb-case-group'), 'data-case', v => {
    ci = parseInt(v, 10);
    update();
  });
  update();
}

/* ==========================================================================
   重點 5：同類項分類吧檯
   ========================================================================== */
function initSortCanvas() {
  const canvas = document.getElementById('canvas-sort');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const formulaEl = document.getElementById('st-formula');
  const feedbackEl = document.getElementById('st-feedback');
  const resetBtn = document.getElementById('st-reset');
  const autoBtn = document.getElementById('st-auto');

  // kind: 'x' 表示 x 項，'c' 表示常數項
  const CASES = [
    { tex: '3x + 5 + 2x + 7', terms: [{ label: '3x', kind: 'x', v: 3 }, { label: '+5', kind: 'c', v: 5 }, { label: '+2x', kind: 'x', v: 2 }, { label: '+7', kind: 'c', v: 7 }] },
    { tex: '6x - 8 - 4x - 5', terms: [{ label: '6x', kind: 'x', v: 6 }, { label: '−8', kind: 'c', v: -8 }, { label: '−4x', kind: 'x', v: -4 }, { label: '−5', kind: 'c', v: -5 }] },
    { tex: '-6x + 9 + 5x + 1', terms: [{ label: '−6x', kind: 'x', v: -6 }, { label: '+9', kind: 'c', v: 9 }, { label: '+5x', kind: 'x', v: 5 }, { label: '+1', kind: 'c', v: 1 }] }
  ];

  let ci = 0;
  let placed = [];   // 每一項：null 未分類 / 'x' / 'c'
  let selected = -1; // 目前選取的項
  let wrongBin = null;
  let wrongUntil = 0;

  const CHIP_W = 92, CHIP_H = 42;
  const BIN = {
    x: { x: 30, y: 176, w: 224, h: 116, title: 'x 項籃', color: C_GRAPE },
    c: { x: 286, y: 176, w: 224, h: 116, title: '常數籃', color: C_GOLD }
  };

  function reset() {
    placed = CASES[ci].terms.map(() => null);
    selected = -1;
    wrongBin = null;
  }

  function chipRect(i) {
    const n = CASES[ci].terms.length;
    const gap = 12;
    const totalW = n * CHIP_W + (n - 1) * gap;
    const x0 = (canvas.width - totalW) / 2;
    return { x: x0 + i * (CHIP_W + gap), y: 62, w: CHIP_W, h: CHIP_H };
  }

  function binChipRect(kind, order) {
    const b = BIN[kind];
    const w = 88, h = 36;
    const perRow = 2;
    const col = order % perRow, row = Math.floor(order / perRow);
    const x0 = b.x + (b.w - (perRow * w + (perRow - 1) * 10)) / 2;
    return { x: x0 + col * (w + 10), y: b.y + 34 + row * (h + 8), w, h };
  }

  function draw() {
    const W = canvas.width, H = canvas.height;
    const cs = CASES[ci];
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '把每一項送進正確的籃子', C_GRAPE);

    // 未分類的項
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    cs.terms.forEach((t, i) => {
      if (placed[i]) return;
      const r = chipRect(i);
      const isSel = (selected === i);
      ctx.save();
      ctx.fillStyle = isSel ? 'rgba(233, 213, 255, 0.22)' : 'rgba(255,255,255,0.05)';
      roundRect(ctx, r.x, r.y, r.w, r.h, 11);
      ctx.fill();
      ctx.strokeStyle = isSel ? C_GRAPE : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = isSel ? 2.6 : 1.6;
      ctx.stroke();
      ctx.restore();
      drawTermLabel(ctx, t.label, r.x + r.w / 2, r.y + r.h / 2, 21, isSel ? '#ffffff' : INK);
    });

    const allPlaced = placed.every(p => p !== null);
    if (!allPlaced) {
      drawNote(ctx, selected < 0 ? '① 先點一項　② 再點下面的籃子' : '再點一個籃子，把它放進去', 132, MUTED, 13.5);
    } else {
      drawNote(ctx, '全部歸位！同類項可以合併了', 132, OK_COLOR, 14);
    }

    // 兩個籃子
    ['x', 'c'].forEach(kind => {
      const b = BIN[kind];
      const isWrong = (wrongBin === kind && Date.now() < wrongUntil);
      ctx.save();
      ctx.fillStyle = isWrong ? 'rgba(251, 113, 133, 0.16)' : 'rgba(255,255,255,0.03)';
      roundRect(ctx, b.x, b.y, b.w, b.h, 14);
      ctx.fill();
      ctx.setLineDash([7, 5]);
      ctx.strokeStyle = isWrong ? NO_COLOR : b.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = isWrong ? NO_COLOR : b.color;
      ctx.font = f(800, 15);
      ctx.textAlign = 'center';
      ctx.fillText(b.title, b.x + b.w / 2, b.y + 17);

      let order = 0;
      cs.terms.forEach((t, i) => {
        if (placed[i] !== kind) return;
        const r = binChipRect(kind, order++);
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        roundRect(ctx, r.x, r.y, r.w, r.h, 9);
        ctx.fill();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
        drawTermLabel(ctx, t.label, r.x + r.w / 2, r.y + r.h / 2, 18, b.color);
      });
    });

    // 合併結果
    const xs = cs.terms.filter((t, i) => placed[i] === 'x');
    const csx = cs.terms.filter((t, i) => placed[i] === 'c');
    const xSum = xs.reduce((a, t) => a + t.v, 0);
    const cSum = csx.reduce((a, t) => a + t.v, 0);

    ctx.textAlign = 'center';
    ctx.font = f(600, 13);
    ctx.fillStyle = MUTED;
    ctx.fillText('合併', canvas.width / 2, 306);
    ctx.textAlign = 'left';

    const line = [];
    if (xs.length) {
      xs.forEach((t, i) => {
        if (i) line.push(T(t.v < 0 ? '-' : '+', MUTED));
        line.push(xItems(i === 0 ? t.v : Math.abs(t.v), C_GRAPE));
      });
      line.push(T('=', MUTED));
      line.push(xItems(xSum, C_GRAPE));
    }
    if (csx.length) {
      if (line.length) line.push(T('，', MUTED));
      csx.forEach((t, i) => {
        if (i) line.push(T(t.v < 0 ? '-' : '+', MUTED));
        line.push(T(String(i === 0 ? t.v : Math.abs(t.v)), C_GOLD));
      });
      line.push(T('=', MUTED));
      line.push(T(String(cSum), C_GOLD));
    }
    if (line.length) {
      drawExpr(ctx, line, canvas.width / 2, 330, 20, INK, { gap: 6, maxW: canvas.width - 40 });
    } else {
      drawNote(ctx, '還沒有任何項被分類', 330, DIM, 14);
    }

    if (allPlaced) {
      const res = [];
      res.push(xItems(xSum, OK_COLOR));
      if (cSum !== 0) {
        res.push(T(cSum > 0 ? '+' : '-', MUTED));
        res.push(T(String(Math.abs(cSum)), OK_COLOR));
      }
      drawPanel(ctx, 150, 344, canvas.width - 300, 32, OK_COLOR, 0.12);
      drawExpr(ctx, res, canvas.width / 2, 360, 21, OK_COLOR, { gap: 6 });
    }
  }

  // 項的標籤裡的 x 要斜體，數字要正體
  function drawTermLabel(ctx, label, cx, cy, size, color) {
    const hasX = label.indexOf('x') >= 0;
    if (!hasX) {
      ctx.fillStyle = color;
      ctx.font = f(800, size);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, cy);
      ctx.textAlign = 'left';
      return;
    }
    const num = label.replace('x', '');
    ctx.font = f(800, size);
    const nw = ctx.measureText(num).width;
    ctx.font = fi(800, size);
    const xw = ctx.measureText('x').width;
    let sx = cx - (nw + xw + 1) / 2;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = f(800, size);
    ctx.fillText(num, sx, cy);
    ctx.font = fi(800, size);
    ctx.fillText('x', sx + nw + 1, cy);
  }

  function hitChip(p) {
    const cs = CASES[ci];
    for (let i = 0; i < cs.terms.length; i++) {
      if (placed[i]) continue;
      const r = chipRect(i);
      if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return i;
    }
    return -1;
  }

  function hitBin(p) {
    for (const kind of ['x', 'c']) {
      const b = BIN[kind];
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return kind;
    }
    return null;
  }

  function onTap(e) {
    const p = canvasPos(canvas, e);
    const ci2 = hitChip(p);
    if (ci2 >= 0) {
      selected = (selected === ci2) ? -1 : ci2;
      wrongBin = null;
      update();
      return;
    }
    const bin = hitBin(p);
    if (bin && selected >= 0) {
      const term = CASES[ci].terms[selected];
      if (term.kind === bin) {
        placed[selected] = bin;
        selected = -1;
        wrongBin = null;
      } else {
        wrongBin = bin;
        wrongUntil = Date.now() + 1200;
        setTimeout(() => { wrongBin = null; draw(); }, 1200);
      }
      update();
    }
  }

  function update() {
    draw();
    const cs = CASES[ci];
    const allPlaced = placed.every(p => p !== null);
    const xSum = cs.terms.filter((t, i) => placed[i] === 'x').reduce((a, t) => a + t.v, 0);
    const cSum = cs.terms.filter((t, i) => placed[i] === 'c').reduce((a, t) => a + t.v, 0);
    const resTex = `${coefTex(xSum)}x${cSum === 0 ? '' : (cSum > 0 ? ' + ' + cSum : ' - ' + (-cSum))}`;

    formulaEl.innerHTML = allPlaced
      ? `\\( ${cs.tex} = ${resTex} \\)`
      : `\\( ${cs.tex} \\)`;

    if (wrongBin) {
      const term = CASES[ci].terms[selected];
      feedbackEl.innerHTML = wrapFeedback(
        `<strong style="color:${NO_COLOR}">放錯籃子了。</strong>` +
        (term && term.kind === 'x'
          ? `\\( ${term.label.replace(/−/g, '-')} \\) 帶有文字符號 \\(x\\)，是 <strong>x 項</strong>。`
          : `這一項<strong>沒有文字符號</strong>，是常數項。`) +
        `<br>同類項的條件是<strong>文字符號與次數都相同</strong>。`
      );
    } else if (allPlaced) {
      feedbackEl.innerHTML = wrapFeedback(
        `x 項合併：係數相加 \\( ${coefTex(xSum)}x \\)；常數項合併：\\( ${cSum} \\)。<br>` +
        `所以 \\( ${cs.tex} = ${resTex} \\)。<br>` +
        `<strong style="color:${OK_COLOR}">兩類不能再併</strong>——\\( ${coefTex(xSum)}x \\) 與 \\( ${cSum} \\) 不是同類項，這已經是最簡的樣子。`
      );
    } else if (selected >= 0) {
      feedbackEl.innerHTML = wrapFeedback(
        `已選取 <strong style="color:${C_GRAPE}">${cs.terms[selected].label}</strong>。` +
        `它<strong>有沒有帶 \\(x\\)</strong>？帶 \\(x\\) 的放左邊，純數字放右邊。`
      );
    } else {
      feedbackEl.innerHTML = wrapFeedback(
        `式子 \\( ${cs.tex} \\) 共有 <strong>${cs.terms.length} 項</strong>（用加號隔開的每一部分）。<br>` +
        `先點一項，再點籃子。<strong style="color:${C_GRAPE}">搬動時正負號要跟著一起搬</strong>。`
      );
    }
    typeset([formulaEl, feedbackEl]);
  }

  canvas.addEventListener('click', onTap);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); onTap(e); }, { passive: false });

  resetBtn.addEventListener('click', () => { reset(); update(); });
  autoBtn.addEventListener('click', () => {
    placed = CASES[ci].terms.map(t => t.kind);
    selected = -1;
    wrongBin = null;
    update();
  });
  bindPickGroup(document.getElementById('st-case-group'), 'data-case', v => {
    ci = parseInt(v, 10);
    reset();
    update();
  });

  reset();
  update();
}

/* ==========================================================================
   重點 6：化簡推導器
   ========================================================================== */
function initSimplifyCanvas() {
  const canvas = document.getElementById('canvas-simplify');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const formulaEl = document.getElementById('sp-formula');
  const feedbackEl = document.getElementById('sp-feedback');
  const stepEl = document.getElementById('sp-step');
  const prevBtn = document.getElementById('sp-prev');
  const nextBtn = document.getElementById('sp-next');

  const X = (n, color) => xItems(n, color);

  const CASES = [
    {
      title: '合併同類項：3x + 5 + 2x + 7',
      steps: [
        { items: [X(3), T('+', MUTED), T('5'), T('+', MUTED), X(2), T('+', MUTED), T('7')], tex: '3x + 5 + 2x + 7', note: '原式共有四項：3x、5、2x、7。' },
        { items: [X(3), T('+', MUTED), X(2), T('+', MUTED), T('5'), T('+', MUTED), T('7')], tex: '3x + 2x + 5 + 7', note: '把同類項排在一起。搬動時每一項的正負號要跟著搬。' },
        { items: [GRP([T('3'), T('+', MUTED), T('2')], '()'), IT('x'), T('+', MUTED), GRP([T('5'), T('+', MUTED), T('7')], '()')], tex: '(3+2)x + (5+7)', note: '用分配律把 x 提出來：係數相加，文字符號不變。' },
        { items: [X(5, C_CARAMEL), T('+', MUTED), T('12', C_CARAMEL)], tex: '5x + 12', note: '5x 與 12 不是同類項，不能再合併，這就是最簡的樣子。' }
      ]
    },
    {
      title: '分配律：−2(3x − 5) + 3(−x − 1)',
      steps: [
        { items: [T('-2'), GRP([X(3), T('-', MUTED), T('5')], '()'), T('+', MUTED), T('3'), GRP([SEQ([T('-'), IT('x')]), T('-', MUTED), T('1')], '()')], tex: '-2(3x-5) + 3(-x-1)', note: '原式有兩個括號，前面各有一個數。' },
        { items: [X(-6), T('+', MUTED), T('10'), T('-', MUTED), X(3), T('-', MUTED), T('3')], tex: '-6x + 10 - 3x - 3', note: '分配律：括號裡每一項都要乘到。−2×3x=−6x、−2×(−5)=+10；3×(−x)=−3x、3×(−1)=−3。' },
        { items: [X(-6), T('-', MUTED), X(3), T('+', MUTED), T('10'), T('-', MUTED), T('3')], tex: '-6x - 3x + 10 - 3', note: '同類項排在一起。' },
        { items: [X(-9, C_CARAMEL), T('+', MUTED), T('7', C_CARAMEL)], tex: '-9x + 7', note: '−6x 與 −3x 都是負的，係數相加得 −9x；常數 10−3=7。' }
      ]
    },
    {
      title: '多層括號：11x − 2[3x − (5x − 4)]',
      steps: [
        { items: [X(11), T('-', MUTED), T('2'), GRP([X(3), T('-', MUTED), GRP([X(5), T('-', MUTED), T('4')], '()')], '[]')], tex: '11x - 2[3x-(5x-4)]', note: '有中括號與小括號，要由內而外拆。' },
        { items: [X(11), T('-', MUTED), T('2'), GRP([X(3), T('-', MUTED), X(5), T('+', MUTED), T('4')], '[]')], tex: '11x - 2[3x-5x+4]', note: '先拆小括號。前面是減號，裡面每一項都變號：5x→−5x、−4→+4。' },
        { items: [X(11), T('-', MUTED), T('2'), GRP([X(-2), T('+', MUTED), T('4')], '[]')], tex: '11x - 2[-2x+4]', note: '中括號裡先合併同類項：3x−5x=−2x。' },
        { items: [X(11), T('+', MUTED), X(4), T('-', MUTED), T('8')], tex: '11x + 4x - 8', note: '把 −2 乘進中括號：−2×(−2x)=+4x、−2×4=−8。' },
        { items: [X(15, C_CARAMEL), T('-', MUTED), T('8', C_CARAMEL)], tex: '15x - 8', note: '合併 11x+4x=15x，得最簡結果。' }
      ]
    },
    {
      title: '分數形式：(x−3)/6 − (x−1)/10',
      compact: true,
      steps: [
        { items: [VF(SEQ([IT('x'), T('-', MUTED), T('3')]), T('6')), T('-', MUTED), VF(SEQ([IT('x'), T('-', MUTED), T('1')]), T('10'))], tex: '\\frac{x-3}{6} - \\frac{x-1}{10}', note: '兩個分數的分母不同，要先通分。6 與 10 的最小公倍數是 30。' },
        { items: [VF(SEQ([SEQ([T('5'), GRP([IT('x'), T('-', MUTED), T('3')], '()')], null, 1), T('-', MUTED), SEQ([T('3'), GRP([IT('x'), T('-', MUTED), T('1')], '()')], null, 1)]), T('30'))], tex: '\\frac{5(x-3)-3(x-1)}{30}', note: '通分後分子要加括號——分數線本來就有括號的效果，整個分子都要乘。' },
        { items: [VF(SEQ([X(5), T('-', MUTED), T('15'), T('-', MUTED), X(3), T('+', MUTED), T('3')]), T('30'))], tex: '\\frac{5x-15-3x+3}{30}', note: '展開。注意 −3(x−1) = −3x+3，那個 +3 最容易漏。' },
        { items: [VF(SEQ([X(2), T('-', MUTED), T('12')]), T('30'))], tex: '\\frac{2x-12}{30}', note: '分子合併同類項：5x−3x=2x、−15+3=−12。' },
        { items: [VF(SEQ([IT('x', C_CARAMEL), T('-', MUTED), T('6', C_CARAMEL)]), T('15', C_CARAMEL))], tex: '\\frac{x-6}{15}', note: '分子分母同除以 2 約分。也可以寫成 x/15 − 2/5，兩者相等。' }
      ]
    }
  ];

  let ci = 0, si = 0;

  function draw() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const cs = CASES[ci];
    drawTitle(ctx, cs.title, C_CARAMEL);

    const total = cs.steps.length;
    const top = cs.compact ? 70 : 74;
    // 分數會往上下各長出半個分式，最後一行不能貼到底部說明
    const bottom = cs.compact ? 274 : 300;
    const gapY = (total > 1) ? Math.min(58, (bottom - top) / (total - 1)) : 0;

    for (let i = 0; i <= si; i++) {
      const isCur = (i === si);
      const y = top + i * gapY;
      if (isCur) drawPanel(ctx, 24, y - (cs.compact ? 24 : 25), W - 48, cs.compact ? 48 : 50, C_CARAMEL, 0.10);
      const color = isCur ? C_CARAMEL : DIM;
      const size = isCur ? (cs.compact ? 21 : 25) : (cs.compact ? 17 : 20);
      const items = (i === 0) ? cs.steps[i].items : [T('=', isCur ? MUTED : DIM)].concat(cs.steps[i].items);
      drawExpr(ctx, items, W / 2, y, size, color, { gap: 7, maxW: W - 60 });
    }

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    roundRect(ctx, 20, 318, W - 40, 48, 10);
    ctx.fill();
    ctx.restore();
    wrapText(ctx, cs.steps[si].note, W / 2, 332, W - 60, 17, INK, 13);
  }

  function update() {
    const cs = CASES[ci];
    si = clamp(si, 0, cs.steps.length - 1);
    stepEl.textContent = `${si + 1} / ${cs.steps.length}`;
    prevBtn.disabled = (si === 0);
    nextBtn.disabled = (si === cs.steps.length - 1);
    draw();

    formulaEl.innerHTML = `\\( ${cs.steps[si].tex} \\)`;
    const last = cs.steps[cs.steps.length - 1];
    feedbackEl.innerHTML = wrapFeedback(
      `${cs.steps[si].note}<br>` +
      (si === cs.steps.length - 1
        ? `<strong style="color:${OK_COLOR}">化簡完成：</strong>\\( ${cs.steps[0].tex} = ${last.tex} \\)`
        : `<span style="color:${MUTED}">按「下一步」繼續。</span>`)
    );
    typeset([formulaEl, feedbackEl]);
  }

  prevBtn.addEventListener('click', () => { si--; update(); });
  nextBtn.addEventListener('click', () => { si++; update(); });
  bindPickGroup(document.getElementById('sp-case-group'), 'data-case', v => {
    ci = parseInt(v, 10);
    si = 0;
    update();
  });
  update();
}
