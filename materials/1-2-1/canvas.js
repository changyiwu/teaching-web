document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quiz System
  initQuizSystem();

  // Initialize Canvas Simulations
  initFactorCanvas();
  initTailCanvas();
  initDigitSumCanvas();
  initElevenCanvas();
  initSieveCanvas();
  initFactorizeCanvas();
});

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // Correct answers mapping for Section 2-1 (12 Quizzes)
  const answers = {
    '2-1-1-1': 'C', // 40 的因數共 8 個
    '2-1-1-2': 'B', // 1、2、a、b、10、M => M = 2x10 = 20，a=4、b=5，a+b=9
    '2-1-2-1': 'D', // 五位數 4372□ 同為 2 與 5 的倍數 => 0
    '2-1-2-2': 'B', // 六位數 7218□4 是 4 的倍數 => □4 為 4 的倍數 => 0、2、4、6、8
    '2-1-3-1': 'A', // 4653 各位數字和 18 => 同為 3 與 9 的倍數
    '2-1-3-2': 'C', // 5□2073 是 9 的倍數 => 數字和 17+□ => □ = 1
    '2-1-4-1': 'B', // 8129 => (9+1)-(2+8) = 0，是 11 的倍數
    '2-1-4-2': 'D', // 8□3157 是 11 的倍數 => □ = 8
    '2-1-5-1': 'C', // 51 = 3x17 是合數
    '2-1-5-2': 'A', // 1 到 100 的質數共 25 個
    '2-1-6-1': 'B', // 264 = 2^3 x 3 x 11
    '2-1-6-2': 'D'  // 2^2 x 3^2 x 5 的正因數個數 = 3x3x2 = 18
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
  const rad = Math.min(r, w / 2, h / 2);
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

// 判定結果的配色：成立＝薄荷綠，不成立＝珊瑚紅
const OK_COLOR = '#34d399';
const NO_COLOR = '#fb7185';

function divisorsOf(n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) out.push(i);
  }
  return out;
}

function factorPairs(n) {
  const out = [];
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) out.push([i, n / i]);
  }
  return out;
}

function primeFactorSteps(n) {
  const steps = [];
  let cur = n;
  let p = 2;
  while (cur > 1) {
    if (cur % p === 0) {
      steps.push({ divisor: p, before: cur, after: cur / p });
      cur = cur / p;
    } else {
      p = p === 2 ? 3 : p + 2;
    }
  }
  return steps;
}

// 畫一顆結果標籤（✓／✗ 加說明）
function drawVerdictChip(ctx, x, y, w, h, label, ok, note) {
  const color = ok ? OK_COLOR : NO_COLOR;
  ctx.fillStyle = ok ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.12)';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = f(800, 17);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${ok ? '✓' : '✗'} ${label}`, x + w / 2, y + (note ? h / 2 - 11 : h / 2));
  if (note) {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = f(500, 12);
    ctx.fillText(note, x + w / 2, y + h / 2 + 12);
  }
}

/* ==========================================================================
   3. 重點 1：因數配對探索器
   ========================================================================== */
function initFactorCanvas() {
  const canvas = document.getElementById('canvas-factor');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const slider = document.getElementById('fac-n-slider');
  const nVal = document.getElementById('fac-n-val');
  const formula = document.getElementById('fac-formula');
  const feedback = document.getElementById('fac-feedback');

  function draw() {
    const n = parseInt(slider.value, 10);
    const pairs = factorPairs(n);
    const divs = divisorsOf(n);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- 標題：n 的因數配對 ---
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fda4af';
    ctx.font = f(700, 15);
    ctx.fillText('把 n 拆成兩個正整數相乘，配對出來的就是因數', canvas.width / 2, 20);

    // --- 配對清單（最多 8 組）---
    // 4 組以內排單欄置中，超過才分兩欄；固定兩欄會讓組數少的時候右半邊空一大塊
    const shown = pairs.slice(0, 8);
    const colW = 250;
    const cols = shown.length <= 4 ? 1 : 2;
    const rows = Math.ceil(shown.length / cols);
    const startX = (canvas.width - colW * cols - 20 * (cols - 1)) / 2;
    const rowH = 30;
    const topY = 44;

    shown.forEach((pair, i) => {
      const col = Math.floor(i / rows);
      const row = i % rows;
      const bx = startX + col * (colW + 20);
      const by = topY + row * rowH;

      ctx.fillStyle = 'rgba(244, 63, 94, 0.10)';
      roundRect(ctx, bx, by, colW, rowH - 6, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = f(700, 17);
      ctx.textAlign = 'center';
      ctx.fillText(`${n} = ${pair[0]} × ${pair[1]}`, bx + colW / 2, by + (rowH - 6) / 2);
    });

    if (pairs.length > 8) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = f(500, 12);
      ctx.fillText(`（另有 ${pairs.length - 8} 組配對未顯示）`, canvas.width / 2, topY + rows * rowH + 2);
    }

    // --- 因數數線（跟著配對表的實際列數往上移）---
    const lineY = topY + rows * rowH + 62;
    const padX = 26;
    const usable = canvas.width - padX * 2;

    ctx.fillStyle = '#94a3b8';
    ctx.font = f(600, 13);
    ctx.textAlign = 'left';
    ctx.fillText('1 到 n 之中，紅點就是因數：', padX, lineY - 32);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padX, lineY);
    ctx.lineTo(canvas.width - padX, lineY);
    ctx.stroke();

    for (let k = 1; k <= n; k++) {
      const x = padX + (usable * (k - 0.5)) / n;
      const isDiv = n % k === 0;
      ctx.beginPath();
      ctx.arc(x, lineY, isDiv ? 5 : 2, 0, Math.PI * 2);
      ctx.fillStyle = isDiv ? '#f43f5e' : 'rgba(255, 255, 255, 0.22)';
      ctx.fill();
    }

    // 因數的數字標籤（太擠就只標頭尾）
    ctx.textAlign = 'center';
    ctx.font = f(700, 12);
    ctx.fillStyle = '#fda4af';
    // 小的因數在數線左端會擠成一團，量測實際間距，太近就跳過（最後一個一定標）
    let lastLabelX = -999;
    divs.forEach((d, i) => {
      const x = padX + (usable * (d - 0.5)) / n;
      if (x - lastLabelX < 22 && i !== divs.length - 1) return;
      ctx.fillText(String(d), x, lineY + 18);
      lastLabelX = x;
    });

    // --- 結論條 ---
    const isPrime = divs.length === 2;
    const barY = lineY + 50;
    ctx.fillStyle = isPrime ? 'rgba(52, 211, 153, 0.12)' : 'rgba(244, 63, 94, 0.10)';
    roundRect(ctx, padX, barY, canvas.width - padX * 2, 36, 10);
    ctx.fill();
    ctx.strokeStyle = isPrime ? 'rgba(52, 211, 153, 0.45)' : 'rgba(244, 63, 94, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isPrime ? OK_COLOR : '#fda4af';
    ctx.font = f(700, 15);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `${n} 共有 ${divs.length} 個正因數　${n === 1 ? '（1 既不是質數也不是合數）' : isPrime ? '→ 只有 1 和自己，是質數' : '→ 還有別的因數，是合數'}`,
      canvas.width / 2,
      barY + 18
    );

    // --- 面板文字 ---
    nVal.textContent = n;
    formula.innerHTML = `\\( ${n} \\) 的因數：\\( ${divs.join(',\\; ')} \\)`;
    feedback.innerHTML = wrapFeedback(
      `每一組 \\( a \\times b = ${n} \\) 都同時生出<strong>兩個</strong>因數，所以因數總是<strong>成對</strong>出現` +
        `${pairs.length && pairs[pairs.length - 1][0] === pairs[pairs.length - 1][1] ? `（${n} 是完全平方數，中間那組 \\( ${pairs[pairs.length - 1][0]} \\times ${pairs[pairs.length - 1][0]} \\) 只算一個）` : ''}。`
    );
    typeset([formula, feedback]);
  }

  slider.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   4. 重點 2：末兩位放大鏡（2、5、4 的倍數）
   ========================================================================== */
function initTailCanvas() {
  const canvas = document.getElementById('canvas-tail');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const frontSlider = document.getElementById('tail-front-slider');
  const lastSlider = document.getElementById('tail-last-slider');
  const frontVal = document.getElementById('tail-front-val');
  const lastVal = document.getElementById('tail-last-val');
  const formula = document.getElementById('tail-formula');
  const feedback = document.getElementById('tail-feedback');

  function draw() {
    const front = parseInt(frontSlider.value, 10);
    const last = parseInt(lastSlider.value, 10);
    const n = front * 100 + last;
    const lastStr = String(last).padStart(2, '0');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- 拆解式 ---
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8fafc';
    ctx.font = f(800, 26);
    ctx.fillText(`${n} = ${front} × 100 + ${lastStr}`, canvas.width / 2, 30);

    // --- 兩段長條 ---
    const padX = 26;
    const barY = 62;
    const barH = 58;
    const total = canvas.width - padX * 2;
    const leftW = Math.round(total * 0.62);
    const rightW = total - leftW - 10;

    ctx.fillStyle = 'rgba(6, 182, 212, 0.14)';
    roundRect(ctx, padX, barY, leftW, barH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#67e8f9';
    ctx.font = f(800, 18);
    ctx.fillText(`${front} × 100`, padX + leftW / 2, barY + 22);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = f(500, 12);
    ctx.fillText('整百的部分：一定是 2、5、4 的倍數', padX + leftW / 2, barY + 42);

    ctx.fillStyle = 'rgba(251, 191, 36, 0.16)';
    roundRect(ctx, padX + leftW + 10, barY, rightW, barH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.font = f(800, 22);
    ctx.fillText(lastStr, padX + leftW + 10 + rightW / 2, barY + 22);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = f(500, 12);
    ctx.fillText('末兩位：勝負在這裡', padX + leftW + 10 + rightW / 2, barY + 42);

    // --- 說明 ---
    ctx.fillStyle = '#94a3b8';
    ctx.font = f(500, 13);
    ctx.fillText('左邊那一段永遠整除得盡，所以只要檢查右邊這一小段就好', canvas.width / 2, barY + barH + 20);

    // --- 三個判定 ---
    const chipY = 162;
    const chipW = 156;
    const gap = 12;
    const startX = (canvas.width - chipW * 3 - gap * 2) / 2;
    const unit = last % 10;

    drawVerdictChip(ctx, startX, chipY, chipW, 56, '2 的倍數', n % 2 === 0, `個位是 ${unit}`);
    drawVerdictChip(ctx, startX + chipW + gap, chipY, chipW, 56, '5 的倍數', n % 5 === 0, `個位是 ${unit}`);
    drawVerdictChip(ctx, startX + (chipW + gap) * 2, chipY, chipW, 56, '4 的倍數', n % 4 === 0, `末兩位 ${lastStr}`);

    // --- 4 的倍數算式 ---
    const q = Math.floor(last / 4);
    const r = last % 4;
    ctx.fillStyle = r === 0 ? OK_COLOR : NO_COLOR;
    ctx.font = f(700, 17);
    ctx.fillText(
      r === 0 ? `${lastStr} ÷ 4 = ${q}　整除 → ${n} 是 4 的倍數` : `${lastStr} ÷ 4 = ${q} ⋯ ${r}　除不盡 → ${n} 不是 4 的倍數`,
      canvas.width / 2,
      248
    );

    // --- 面板文字 ---
    frontVal.textContent = front;
    lastVal.textContent = lastStr;
    formula.innerHTML = `\\( ${n} = ${front} \\times 100 + ${lastStr} \\)`;
    feedback.innerHTML = wrapFeedback(
      `\\( ${front} \\times 100 = ${front} \\times 25 \\times 4 \\)，一定是 <strong>4 的倍數</strong>；` +
        `所以 \\( ${n} \\) 是不是 4 的倍數，<strong>只看末兩位 ${lastStr}</strong>。`
    );
    typeset([formula, feedback]);
  }

  frontSlider.addEventListener('input', draw);
  lastSlider.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   5. 重點 3：數字和分堆（3、9 的倍數）
   ========================================================================== */
function initDigitSumCanvas() {
  const canvas = document.getElementById('canvas-digitsum');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const hSlider = document.getElementById('ds-h-slider');
  const tSlider = document.getElementById('ds-t-slider');
  const uSlider = document.getElementById('ds-u-slider');
  const hVal = document.getElementById('ds-h-val');
  const tVal = document.getElementById('ds-t-val');
  const uVal = document.getElementById('ds-u-val');
  const formula = document.getElementById('ds-formula');
  const feedback = document.getElementById('ds-feedback');

  function draw() {
    const h = parseInt(hSlider.value, 10);
    const t = parseInt(tSlider.value, 10);
    const u = parseInt(uSlider.value, 10);
    const n = h * 100 + t * 10 + u;
    const sum = h + t + u;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // --- 拆解式 ---
    ctx.fillStyle = '#f8fafc';
    ctx.font = f(800, 24);
    ctx.fillText(`${n} = ${h}×99 + ${t}×9 + (${h}+${t}+${u})`, canvas.width / 2, 28);

    ctx.fillStyle = '#94a3b8';
    ctx.font = f(500, 13);
    ctx.fillText('99 和 9 都是 3 與 9 的倍數，前面兩堆一定分得完', canvas.width / 2, 54);

    // --- 兩堆示意 ---
    const padX = 26;
    const boxY = 74;
    const boxH = 50;
    const total = canvas.width - padX * 2;
    const leftW = Math.round(total * 0.58);
    const rightW = total - leftW - 10;

    ctx.fillStyle = 'rgba(139, 92, 246, 0.14)';
    roundRect(ctx, padX, boxY, leftW, boxH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#d8b4fe';
    ctx.font = f(800, 17);
    ctx.fillText(`${h}×99 + ${t}×9 = ${h * 99 + t * 9}`, padX + leftW / 2, boxY + 19);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = f(500, 12);
    ctx.fillText('整除堆：3 與 9 都分得完', padX + leftW / 2, boxY + 37);

    ctx.fillStyle = 'rgba(251, 191, 36, 0.16)';
    roundRect(ctx, padX + leftW + 10, boxY, rightW, boxH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.stroke();
    ctx.fillStyle = '#fde047';
    ctx.font = f(800, 20);
    ctx.fillText(`剩 ${sum} 顆`, padX + leftW + 10 + rightW / 2, boxY + 19);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = f(500, 12);
    ctx.fillText('就是各位數字和', padX + leftW + 10 + rightW / 2, boxY + 37);

    // --- 剩下的顆粒，每 3 顆一組排開 ---
    const cell = 22;
    const perRow = 9;
    const rows = Math.max(1, Math.ceil(sum / perRow));
    const gridW = perRow * cell;
    const gx = (canvas.width - gridW) / 2;
    const gy = 142;

    ctx.textAlign = 'center';
    for (let i = 0; i < sum; i++) {
      const r = Math.floor(i / perRow);
      const c = i % perRow;
      const x = gx + c * cell;
      const y = gy + r * cell;
      // 每 3 顆換一次深淺，方便看出能不能三個三個分完
      const groupOfThree = Math.floor(i / 3) % 2 === 0;
      ctx.fillStyle = groupOfThree ? 'rgba(251, 191, 36, 0.85)' : 'rgba(251, 191, 36, 0.45)';
      roundRect(ctx, x + 3, y + 3, cell - 6, cell - 6, 4);
      ctx.fill();
    }
    if (sum === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = f(600, 14);
      ctx.fillText('（數字和為 0）', canvas.width / 2, gy + 11);
    }

    // --- 兩個判定 ---
    const chipY = gy + rows * cell + 14;
    const chipW = 190;
    const gap = 16;
    const startX = (canvas.width - chipW * 2 - gap) / 2;
    drawVerdictChip(ctx, startX, chipY, chipW, 54, '3 的倍數', sum % 3 === 0 && n > 0, `數字和 ${sum} ÷ 3 ${sum % 3 === 0 ? '整除' : `餘 ${sum % 3}`}`);
    drawVerdictChip(ctx, startX + chipW + gap, chipY, chipW, 54, '9 的倍數', sum % 9 === 0 && n > 0, `數字和 ${sum} ÷ 9 ${sum % 9 === 0 ? '整除' : `餘 ${sum % 9}`}`);

    // --- 面板文字 ---
    hVal.textContent = h;
    tVal.textContent = t;
    uVal.textContent = u;
    formula.innerHTML = `\\( ${n} \\)　各位數字和 \\( = ${h} + ${t} + ${u} = ${sum} \\)`;
    feedback.innerHTML = wrapFeedback(
      sum % 9 === 0 && n > 0
        ? `數字和 \\( ${sum} \\) 是 9 的倍數，也一定是 3 的倍數 → \\( ${n} \\) <strong>同時是 3 和 9 的倍數</strong>。`
        : sum % 3 === 0 && n > 0
        ? `數字和 \\( ${sum} \\) 是 3 的倍數但不是 9 的倍數 → \\( ${n} \\) 是 3 的倍數，<strong>但不是 9 的倍數</strong>。`
        : `數字和 \\( ${sum} \\) 連 3 都除不盡 → \\( ${n} \\) <strong>既不是 3 也不是 9 的倍數</strong>。`
    );
    typeset([formula, feedback]);
  }

  [hSlider, tSlider, uSlider].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   6. 重點 4：奇偶位交錯（11 的倍數）
   ========================================================================== */
function initElevenCanvas() {
  const canvas = document.getElementById('canvas-eleven');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const frontSlider = document.getElementById('el-front-slider');
  const backSlider = document.getElementById('el-back-slider');
  const frontVal = document.getElementById('el-front-val');
  const backVal = document.getElementById('el-back-val');
  const formula = document.getElementById('el-formula');
  const feedback = document.getElementById('el-feedback');

  function draw() {
    const front = parseInt(frontSlider.value, 10);
    const back = parseInt(backSlider.value, 10);
    const n = front * 100 + back;
    const digits = String(n).padStart(4, '0').split('').map(Number); // 由左到右

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#94a3b8';
    ctx.font = f(500, 13);
    ctx.fillText('從個位開始往左，一位「奇數位」、一位「偶數位」交錯分組', canvas.width / 2, 20);

    // --- 四個位數方塊 ---
    const boxW = 76;
    const boxH = 76;
    const gap = 14;
    const startX = (canvas.width - boxW * 4 - gap * 3) / 2;
    const boxY = 44;

    let oddSum = 0;
    let evenSum = 0;

    digits.forEach((d, i) => {
      // i = 0 是最左邊；由右邊數過來的位次 = 4 - i
      const posFromRight = 4 - i;
      const isOddPos = posFromRight % 2 === 1; // 個位、百位 → 奇數位
      if (isOddPos) oddSum += d;
      else evenSum += d;

      const x = startX + i * (boxW + gap);
      const color = isOddPos ? '#38bdf8' : '#fb923c';
      ctx.fillStyle = isOddPos ? 'rgba(56, 189, 248, 0.14)' : 'rgba(251, 146, 60, 0.14)';
      roundRect(ctx, x, boxY, boxW, boxH, 12);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = f(800, 34);
      ctx.fillText(String(d), x + boxW / 2, boxY + 34);

      ctx.fillStyle = color;
      ctx.font = f(700, 12);
      ctx.fillText(isOddPos ? '奇數位' : '偶數位', x + boxW / 2, boxY + 62);

      // 位次標籤
      ctx.fillStyle = '#64748b';
      ctx.font = f(500, 11);
      ctx.fillText(`第 ${posFromRight} 位`, x + boxW / 2, boxY + boxH + 14);
    });

    // --- 兩個和 ---
    const sumY = 158;
    ctx.font = f(800, 18);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`奇數位和 = ${oddSum}`, canvas.width / 2 - 120, sumY);
    ctx.fillStyle = '#fb923c';
    ctx.fillText(`偶數位和 = ${evenSum}`, canvas.width / 2 + 120, sumY);
    ctx.fillStyle = '#f8fafc';
    ctx.font = f(800, 22);
    ctx.fillText('－', canvas.width / 2, sumY);

    // --- 差 ---
    const diff = oddSum - evenSum;
    const ok = diff % 11 === 0;
    ctx.fillStyle = '#f8fafc';
    ctx.font = f(800, 22);
    ctx.fillText(`差 = ${oddSum} − ${evenSum} = ${diff}`, canvas.width / 2, 194);

    drawVerdictChip(
      ctx,
      (canvas.width - 340) / 2,
      216,
      340,
      54,
      `${n} 是 11 的倍數`,
      ok,
      diff === 0 ? '差為 0，符合條件' : ok ? `差 ${diff} 是 11 的倍數` : `差 ${diff} 不是 0，也不是 11 的倍數`
    );

    // --- 面板文字 ---
    frontVal.textContent = front;
    backVal.textContent = String(back).padStart(2, '0');
    formula.innerHTML = `\\( ${n} \\)：奇數位和 \\( ${oddSum} \\)，偶數位和 \\( ${evenSum} \\)`;
    feedback.innerHTML = wrapFeedback(
      ok
        ? `\\( ${oddSum} - ${evenSum} = ${diff} \\)，是 0 或 11 的倍數 → \\( ${n} \\) <strong>是 11 的倍數</strong>（驗算：\\( ${n} \\div 11 = ${n / 11} \\)）。`
        : `\\( ${oddSum} - ${evenSum} = ${diff} \\)，不是 0 也不是 11 的倍數 → \\( ${n} \\) <strong>不是 11 的倍數</strong>。`
    );
    typeset([formula, feedback]);
  }

  frontSlider.addEventListener('input', draw);
  backSlider.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   7. 重點 5：埃拉托賽尼篩子
   ========================================================================== */
function initSieveCanvas() {
  const canvas = document.getElementById('canvas-sieve');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const stage = document.getElementById('sieve-stage');
  const prevBtn = document.getElementById('sieve-prev');
  const nextBtn = document.getElementById('sieve-next');
  const resetBtn = document.getElementById('sieve-reset');
  const stepBtns = Array.from(document.querySelectorAll('.step-choice-btn[data-sieve-step]'));
  const feedback = document.getElementById('sieve-feedback');

  const STEPS = [
    { title: '起點：1 到 100 全部保留', note: '先把 1 到 100 全部排好，等一下逐步刪掉不是質數的數。' },
    { title: '步驟 ①：刪去 1', note: '1 只有一個因數（就是 1 自己），不是質數也不是合數，先刪掉。' },
    { title: '步驟 ②：圈出 2，刪去其他 2 的倍數', note: '2 只有 1 和 2 兩個因數，是質數；其他偶數都被 2 整除，通通刪掉。' },
    { title: '步驟 ③：圈出 3，刪去其他 3 的倍數', note: '3 沒有被刪掉，代表它是質數；再把 3 的倍數刪光。' },
    { title: '步驟 ④：圈出 5，刪去其他 5 的倍數', note: '4 已經在刪 2 的倍數時消失了，所以下一個活著的是 5。' },
    { title: '步驟 ⑤：圈出 7，刪去其他 7 的倍數', note: '刪完 7 的倍數後，11、13 的倍數其實早就被刪光了，不必再做。' },
    { title: '完成：剩下的 25 個都是質數', note: '1 到 100 之間共有 25 個質數。只要刪掉 2、3、5、7 的倍數就篩得乾淨。' }
  ];
  const PRIMES = [2, 3, 5, 7];

  let step = 0;

  // 回傳每個數在目前步驟的狀態：'alive' | 'circled' | 'removed'
  function stateOf(k) {
    if (step >= 1 && k === 1) return 'removed';
    for (let i = 0; i < PRIMES.length; i++) {
      const p = PRIMES[i];
      // 第 2 步處理 2、第 3 步處理 3、第 4 步處理 5、第 5 步處理 7
      if (step >= i + 2) {
        if (k === p) return 'circled';
        if (k % p === 0) return 'removed';
      }
    }
    return 'alive';
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cell = 50;
    const gridW = cell * 10;
    const ox = (canvas.width - gridW) / 2;
    const oy = 12;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let removed = 0;
    let circled = 0;

    for (let k = 1; k <= 100; k++) {
      const idx = k - 1;
      const cx = ox + (idx % 10) * cell;
      const cy = oy + Math.floor(idx / 10) * cell;
      const st = stateOf(k);

      if (st === 'removed') removed++;
      if (st === 'circled') circled++;

      // 底
      ctx.fillStyle = st === 'removed' ? 'rgba(255,255,255,0.02)' : st === 'circled' ? 'rgba(236, 72, 153, 0.20)' : 'rgba(255,255,255,0.05)';
      roundRect(ctx, cx + 3, cy + 3, cell - 6, cell - 6, 8);
      ctx.fill();
      ctx.strokeStyle = st === 'circled' ? '#ec4899' : 'rgba(255,255,255,0.08)';
      ctx.lineWidth = st === 'circled' ? 2 : 1;
      ctx.stroke();

      // 數字
      ctx.fillStyle = st === 'removed' ? 'rgba(148,163,184,0.35)' : st === 'circled' ? '#fbcfe8' : '#f8fafc';
      // 投影時整頁會縮到約 0.7 倍，百數表的數字要比其他 canvas 再大一點才讀得到
      ctx.font = f(st === 'alive' || st === 'circled' ? 700 : 500, 20);
      ctx.fillText(String(k), cx + cell / 2, cy + cell / 2);

      // 刪除線
      if (st === 'removed') {
        ctx.strokeStyle = 'rgba(248, 113, 113, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + 11, cy + 11);
        ctx.lineTo(cx + cell - 11, cy + cell - 11);
        ctx.stroke();
      }
    }

    const alive = 100 - removed;

    // --- 底部統計 ---
    const barY = oy + cell * 10 + 10;
    ctx.fillStyle = 'rgba(236, 72, 153, 0.10)';
    roundRect(ctx, ox, barY, gridW, 34, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#f472b6';
    ctx.font = f(700, 15);
    ctx.fillText(`已刪去 ${removed} 個　剩下 ${alive} 個　其中已確認的質數 ${circled} 個`, canvas.width / 2, barY + 17);

    // --- 文字面板 ---
    stage.innerHTML = STEPS.map((s, i) => `<div class="step-line${i === step ? ' is-current' : ''}">${s.title}</div>`).join('') +
      `<div class="step-note">${STEPS[step].note}</div>`;

    stepBtns.forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.sieveStep, 10) === step);
    });
    prevBtn.disabled = step === 0;
    nextBtn.disabled = step === STEPS.length - 1;

    feedback.innerHTML = wrapFeedback(
      step === STEPS.length - 1
        ? `剩下的 25 個數就是 1 到 100 的全部質數：<strong>2、3、5、7、11、13、17、19、23、29、31、37、41、43、47、53、59、61、67、71、73、79、83、89、97</strong>。`
        : `目前剩下 <strong>${alive}</strong> 個數還沒被刪掉。`
    );
  }

  stepBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      step = parseInt(btn.dataset.sieveStep, 10);
      draw();
    });
  });
  prevBtn.addEventListener('click', () => {
    if (step > 0) step--;
    draw();
  });
  nextBtn.addEventListener('click', () => {
    if (step < STEPS.length - 1) step++;
    draw();
  });
  resetBtn.addEventListener('click', () => {
    step = 0;
    draw();
  });

  draw();
}

/* ==========================================================================
   8. 重點 6：短除法質因數分解
   ========================================================================== */
function initFactorizeCanvas() {
  const canvas = document.getElementById('canvas-fact');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const slider = document.getElementById('pf-n-slider');
  const nVal = document.getElementById('pf-n-val');
  const formula = document.getElementById('pf-formula');
  const feedback = document.getElementById('pf-feedback');

  // 指數字距（投影下底數與指數不能黏在一起）
  const POW_KERN = 0.17;

  // 畫「底數^指數」，回傳寬度
  function drawPower(base, exp, x, y, size, color) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = color;
    ctx.font = f(800, size);
    const bw = ctx.measureText(base).width;
    ctx.fillText(base, x, y);
    if (exp === null) return bw;
    const kern = size * POW_KERN;
    ctx.font = f(800, Math.round(size * 0.62));
    const ew = ctx.measureText(exp).width;
    ctx.fillText(exp, x + bw + kern, y - size * 0.42);
    return bw + kern + ew;
  }

  function draw() {
    const n = parseInt(slider.value, 10);
    const steps = primeFactorSteps(n);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#a7f3d0';
    ctx.font = f(700, 15);
    ctx.fillText('用短除法一路除以最小的質數，直到商是質數為止', canvas.width / 2, 20);

    // --- 短除法梯形 ---
    // 課本的短除法「除到商是質數為止」，所以最後一次除法不畫出來，
    // 直接把那個質數當成梯形最下面的商（例：180 只除到 3)15，下面留 5）
    const rows = steps.slice(0, -1);
    const lastPrime = steps.length ? steps[steps.length - 1].before : null;
    const lineCount = Math.max(1, steps.length); // 梯形列數 + 最下面的商
    const rowH = 30;
    // 列數會隨 n 變動（最多 7 列），列數少時往下推一點，避免下方留一大塊空白
    const topY = 46 + (Math.max(0, 7 - lineCount) * rowH) / 2;
    const divX = 190; // 除數的右界
    const numX = 210; // 被除數的左界

    ctx.textBaseline = 'middle';

    rows.forEach((s, i) => {
      const y = topY + i * rowH;

      // 除數
      ctx.textAlign = 'right';
      ctx.fillStyle = '#34d399';
      ctx.font = f(800, 19);
      ctx.fillText(String(s.divisor), divX - 12, y);

      // ㄴ 形短除法符號
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(divX, y - 13);
      ctx.lineTo(divX, y + 15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(divX, y + 15);
      ctx.lineTo(divX + 84, y + 15);
      ctx.stroke();

      // 被除數
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f8fafc';
      ctx.font = f(700, 19);
      ctx.fillText(String(s.before), numX, y);
    });

    // 最下面的商：已經是質數，不再往下除
    if (lastPrime !== null) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#34d399';
      ctx.font = f(800, 19);
      ctx.fillText(String(lastPrime), numX, topY + rows.length * rowH);
    }

    if (rows.length === 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = f(600, 14);
      ctx.fillText(`${n} 本身就是質數，不必再分解`, canvas.width / 2, topY + 34);
    }

    // --- 連乘式與標準分解式 ---
    const listY = topY + lineCount * rowH + 18;
    const chain = steps.map(s => s.divisor);

    // n 本身是質數時連乘式會變成「n = n」，和上面的說明疊在一起，直接省略
    if (rows.length > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#cbd5e1';
      ctx.font = f(600, 16);
      ctx.fillText(`${n} = ${chain.join(' × ')}`, canvas.width / 2, listY);
    }

    // 標準分解式（含指數 kerning）
    const grouped = [];
    chain.forEach(p => {
      const last = grouped[grouped.length - 1];
      if (last && last.p === p) last.e++;
      else grouped.push({ p, e: 1 });
    });

    const size = 26;
    ctx.font = f(800, size);
    const prefix = `${n} = `;
    let totalW = ctx.measureText(prefix).width;
    grouped.forEach((g, i) => {
      ctx.font = f(800, size);
      totalW += ctx.measureText(String(g.p)).width;
      if (g.e > 1) {
        totalW += size * POW_KERN;
        ctx.font = f(800, Math.round(size * 0.62));
        totalW += ctx.measureText(String(g.e)).width;
      }
      if (i < grouped.length - 1) {
        ctx.font = f(800, size);
        totalW += ctx.measureText(' × ').width;
      }
    });

    let x = (canvas.width - totalW) / 2;
    const baseY = listY + 44;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f8fafc';
    ctx.font = f(800, size);
    ctx.fillText(prefix, x, baseY);
    x += ctx.measureText(prefix).width;

    grouped.forEach((g, i) => {
      x += drawPower(String(g.p), g.e > 1 ? String(g.e) : null, x, baseY, size, '#a7f3d0');
      if (i < grouped.length - 1) {
        ctx.font = f(800, size);
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(' × ', x, baseY);
        x += ctx.measureText(' × ').width;
      }
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#94a3b8';
    ctx.font = f(500, 13);
    ctx.fillText('相異質因數由小排到大，重複的寫成指數 ← 這就是標準分解式', canvas.width / 2, baseY + 26);

    // --- 面板文字 ---
    const uniq = [...new Set(chain)];
    const divisorCount = grouped.reduce((acc, g) => acc * (g.e + 1), 1);
    nVal.textContent = n;
    formula.innerHTML = `\\( ${n} = ${grouped.map(g => (g.e > 1 ? `${g.p}^{${g.e}}` : `${g.p}`)).join(' \\times ')} \\)`;
    feedback.innerHTML = wrapFeedback(
      `\\( ${n} \\) 的質因數為 <strong>${uniq.join('、')}</strong>；` +
        `把每個指數 \\(+1\\) 再相乘 \\( (${grouped.map(g => g.e + 1).join(' \\times ')}) \\)，可知它共有 <strong>${divisorCount}</strong> 個正因數。`
    );
    typeset([formula, feedback]);
  }

  slider.addEventListener('input', draw);
  draw();
}
