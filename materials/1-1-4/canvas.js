document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quiz System
  initQuizSystem();

  // Initialize Canvas Simulations
  initPowerCanvas();
  initBracketCanvas();
  initStepSolver();
  initTenCanvas();
  initSciCanvas();
  initCompareCanvas();
});

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // Correct answers mapping for Section 1-4 (12 Quizzes)
  const answers = {
    '1-4-1-1': 'C', // 6 個 7 連乘 => 7^6
    '1-4-1-2': 'A', // 0^5 + 1^8 + 3^1 = 0 + 1 + 3 = 4
    '1-4-2-1': 'D', // -4^2 = -16
    '1-4-2-2': 'C', // n 為奇數 => (-1)^n + (-1)^(n+1) = -1 + 1 = 0
    '1-4-3-1': 'A', // -2^4 + (-3)^2 x 2 = -16 + 18 = 2
    '1-4-3-2': 'B', // (-6)^2 ÷ [4+(-1)^3] x 2 = 36 ÷ 3 x 2 = 24
    '1-4-4-1': 'C', // 10^-4 = 0.0001
    '1-4-4-2': 'D', // 10^0 + 10^-2 = 1 + 0.01 = 1.01
    '1-4-5-1': 'A', // 6400000000 = 6.4 x 10^9
    '1-4-5-2': 'B', // 9/100000 = 9 x 10^-5
    '1-4-6-1': 'D', // 5.2 x 10^7 = 52000000，8 位數
    '1-4-6-2': 'B'  // 1.1 x 10^-4 指數最大 => 最大
  };

  quizCards.forEach(card => {
    const quizId = card.getAttribute('data-quiz');
    const radios = card.querySelectorAll('input[type="radio"]');
    const btn = card.querySelector('.btn-check-ans');
    const explanation = card.querySelector('.explanation-box');
    const expTitle = card.querySelector('.explanation-title');
    const optionLabels = card.querySelectorAll('.option-label');

    // Enable button when option is selected and style selected option
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        btn.removeAttribute('disabled');
        optionLabels.forEach(lbl => lbl.classList.remove('selected'));
        radio.closest('.option-label').classList.add('selected');
      });
    });

    // Check Answer Click Handler
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
   2. 本節專屬工具（通用繪圖工具在 ../math-canvas.js）
   ========================================================================== */
// 負數要加括號（避免出現 4 x -2 這種相鄰運算子的寫法）；首項與結果不加括號
function paren(n) {
  return n < 0 ? `(${n})` : `${n}`;
}

// 依正負回傳配色（正：琥珀金；負：天青藍）
function signColor(n) {
  return n >= 0 ? '#fbbf24' : '#38bdf8';
}

// 在 canvas 上畫「底數 + 上標指數」，回傳整體寬度
// align: 'left' | 'center'
function drawPow(ctx, x, y, base, exp, size, color, align) {
  const expSize = Math.max(10, Math.round(size * 0.62));
  const kern = exp === '' ? 0 : size * POW_KERN;
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.font = `bold ${size}px Outfit, sans-serif`;
  const baseW = ctx.measureText(base).width;
  ctx.font = `bold ${expSize}px Outfit, sans-serif`;
  const expW = exp === '' ? 0 : ctx.measureText(exp).width;
  const total = baseW + kern + expW;
  let startX = x;
  if (align === 'center') startX = x - total / 2;

  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.font = `bold ${size}px Outfit, sans-serif`;
  ctx.fillText(base, startX, y);
  if (exp !== '') {
    ctx.font = `bold ${expSize}px Outfit, sans-serif`;
    ctx.fillText(exp, startX + baseW + kern, y - size * 0.42);
  }
  ctx.restore();
  return total;
}

// 量測「底數 + 上標指數」的寬度（不繪圖）
function measurePow(ctx, base, exp, size) {
  const expSize = Math.max(10, Math.round(size * 0.62));
  ctx.save();
  ctx.font = `bold ${size}px Outfit, sans-serif`;
  const baseW = ctx.measureText(base).width;
  ctx.font = `bold ${expSize}px Outfit, sans-serif`;
  const expW = exp === '' ? 0 : ctx.measureText(exp).width;
  ctx.restore();
  return baseW + (exp === '' ? 0 : size * POW_KERN) + expW;
}

// 以整數尾數與 10 的次方組出精確的十進位字串（避免浮點誤差）
// digits: 有效數字字串（如 "43"），exp10: 這串數字最後一位所代表的 10 的次方
function buildDecimal(digits, exp10) {
  if (exp10 >= 0) return digits + '0'.repeat(exp10);
  const k = -exp10;
  if (k < digits.length) {
    return digits.slice(0, digits.length - k) + '.' + digits.slice(digits.length - k);
  }
  return '0.' + '0'.repeat(k - digits.length) + digits;
}

/* ==========================================================================
   3. 重點 1：乘方展開器
   ========================================================================== */
function initPowerCanvas() {
  const canvas = document.getElementById('canvas-power');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderA = document.getElementById('pow-a-slider');
  const sliderN = document.getElementById('pow-n-slider');
  const valA = document.getElementById('pow-a-val');
  const valN = document.getElementById('pow-n-val');
  const formulaDiv = document.getElementById('pow-formula');
  const feedbackDiv = document.getElementById('pow-feedback');

  const READ = ['一', '二', '三', '四', '五', '六'];

  function draw() {
    const a = parseInt(sliderA.value, 10);
    const n = parseInt(sliderN.value, 10);
    const result = Math.pow(a, n);

    valA.textContent = `${a}`;
    valN.textContent = `${n}`;

    formulaDiv.innerHTML =
      `<span style="color:${signColor(a)}">\\(${paren(a)}^{${n}}\\)</span> \\(=\\) ` +
      `<span style="color:${signColor(result)}; font-size:1.45rem; text-shadow: 0 0 10px rgba(255,255,255,0.2)">\\(${result}\\)</span>`;
    typeset([formulaDiv]);

    // 說明文字
    let note;
    if (a === 0) {
      note = `<strong>0 的乘方</strong>：不管幾個 0 相乘，值都是 0，所以 \\(0^{${n}} = 0\\)。`;
    } else if (a === 1) {
      note = `<strong>1 的乘方</strong>：不管幾個 1 相乘，值都是 1，所以 \\(1^{${n}} = 1\\)。`;
    } else if (n === 1) {
      note = `<strong>指數為 1</strong> 時通常省略不寫，\\(${paren(a)}^{1}\\) 習慣上就寫成 \\(${a}\\)。`;
    } else {
      const signWord = a < 0
        ? (n % 2 === 0 ? '負數的<strong>偶數</strong>次方為<strong>正數</strong>' : '負數的<strong>奇數</strong>次方為<strong>負數</strong>')
        : '正數的任何次方都是正數';
      note = `\\(${paren(a)}^{${n}}\\) 讀作「${a < 0 ? `負 ${Math.abs(a)}` : a} 的${READ[n - 1]}次方」，` +
        `表示 <strong>${n}</strong> 個 \\(${paren(a)}\\) 連乘。<br>${signWord}，所以結果是 \\(${result}\\)。`;
    }
    feedbackDiv.innerHTML = wrapFeedback(note);
    typeset([feedbackDiv]);

    // ===== Canvas 繪圖 =====
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padding = 24;
    const usable = w - padding * 2;

    // --- 第一列：n 個底數方塊，中間以 × 相連 ---
    const tileH = 40;
    const tileY = 24;
    const gap = 22;
    const tileW = Math.min(58, (usable - gap * (n - 1)) / n);
    const rowW = tileW * n + gap * (n - 1);
    let tx = padding + (usable - rowW) / 2;

    for (let i = 0; i < n; i++) {
      const color = a < 0 ? '#38bdf8' : '#fbbf24';
      ctx.save();
      roundRect(ctx, tx, tileY, tileW, tileH, 9);
      ctx.fillStyle = a < 0 ? 'rgba(56, 189, 248, 0.16)' : 'rgba(251, 191, 36, 0.16)';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 17px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${a}`, tx + tileW / 2, tileY + tileH / 2 + 1);

      if (i < n - 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = 'bold 15px Outfit, sans-serif';
        ctx.fillText('×', tx + tileW + gap / 2, tileY + tileH / 2 + 1);
      }
      tx += tileW + gap;
    }

    // 大括號說明：n 個底數連乘
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1.5;
    const braceY = tileY + tileH + 8;
    const bx1 = padding + (usable - rowW) / 2;
    const bx2 = bx1 + rowW;
    ctx.beginPath();
    ctx.moveTo(bx1, braceY);
    ctx.lineTo(bx1, braceY + 5);
    ctx.lineTo(bx2, braceY + 5);
    ctx.lineTo(bx2, braceY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${n} 個 ${a < 0 ? `(${a})` : a} 連乘`, (bx1 + bx2) / 2, braceY + 9);

    // --- 第二列：逐次累乘的長度尺 ---
    // 線段長度＝數值的「真實大小」等比例（不是取對數），正數往右、負數往左，
    // 讓「每多乘一次就長很多」與「負數的奇偶次方換邊」都直接看得到。
    const axisX = Math.round(w / 2);
    const chartTop = 112;
    const chartBottom = h - 30;
    const availH = chartBottom - chartTop;
    const rowH = Math.min(30, availH / n);
    const blockTop = chartTop + (availH - rowH * n) / 2;
    const halfW = w / 2 - padding - 4;

    const values = [];
    for (let i = 1; i <= n; i++) values.push(Math.pow(a, i));
    const maxAbs = Math.max(...values.map(v => Math.abs(v)));

    // 中軸（0 的位置）
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(axisX, blockTop - 2);
    ctx.lineTo(axisX, blockTop + rowH * n + 4);
    ctx.stroke();

    for (let i = 0; i < n; i++) {
      const v = values[i];
      const dir = v < 0 ? -1 : 1;                       // 正的往右、負的往左
      const len = maxAbs === 0 ? 0 : (Math.abs(v) / maxAbs) * halfW;
      const lineY = Math.round(blockTop + rowH * i + rowH * 0.74);
      const color = v >= 0 ? '#fbbf24' : '#38bdf8';
      const last = i === n - 1;

      // 長度線段
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = last ? 5 : 3.5;
      ctx.lineCap = 'round';
      ctx.shadowBlur = last ? 12 : 5;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.moveTo(axisX, lineY);
      ctx.lineTo(axisX + dir * Math.max(len, 1.5), lineY);
      ctx.stroke();
      ctx.restore();

      // 標籤：a^i = 值（貼著中軸、放在線段上方，跟線段同一側）
      const baseTxt = a < 0 ? `(${a})` : `${a}`;
      const labelSize = last ? 14 : 12;
      const powW = measurePow(ctx, baseTxt, `${i + 1}`, labelSize);
      ctx.font = `bold ${labelSize}px Outfit, sans-serif`;
      const restTxt = ` = ${v}`;
      const restW = ctx.measureText(restTxt).width;
      const startX = dir > 0 ? axisX + 6 : axisX - 6 - (powW + restW);
      const labelColor = last ? '#ffffff' : 'rgba(255,255,255,0.7)';

      drawPow(ctx, startX, lineY - 6, baseTxt, `${i + 1}`, labelSize, labelColor, 'left');
      ctx.fillStyle = labelColor;
      ctx.font = `bold ${labelSize}px Outfit, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(restTxt, startX + powW, lineY - 6);
    }

    // 尺規說明
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('線段長度 = 數值大小（同一把尺，正數向右、負數向左）', w / 2, h - 8);
  }

  sliderA.addEventListener('input', draw);
  sliderN.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   4. 重點 2：括號陷阱對照器
   ========================================================================== */
function initBracketCanvas() {
  const canvas = document.getElementById('canvas-bracket');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderA = document.getElementById('brk-a-slider');
  const sliderN = document.getElementById('brk-n-slider');
  const valA = document.getElementById('brk-a-val');
  const valN = document.getElementById('brk-n-val');
  const formulaDiv = document.getElementById('brk-formula');
  const feedbackDiv = document.getElementById('brk-feedback');

  function draw() {
    const a = parseInt(sliderA.value, 10);
    const n = parseInt(sliderN.value, 10);

    const left = Math.pow(-a, n);          // (-a)^n
    const right = -Math.pow(a, n);         // -a^n
    const same = left === right;

    valA.textContent = `${a}`;
    valN.textContent = `${n}`;

    formulaDiv.innerHTML =
      `<span style="color:#f472b6">\\((-${a})^{${n}} = ${left}\\)</span>` +
      `<span style="color:#94a3b8; margin: 0 0.5rem;">vs</span>` +
      `<span style="color:#67e8f9">\\(-${a}^{${n}} = ${right}\\)</span>`;
    typeset([formulaDiv]);

    feedbackDiv.innerHTML = wrapFeedback(
      same
        ? `\\(${n}\\) 是<strong>奇數</strong>：\\((-${a})^{${n}}\\) 的 ${n} 個負號配對後剩 1 個，結果為負；` +
          `而 \\(-${a}^{${n}}\\) 的負號本來就在外面，也是負的。<br>` +
          `兩者<strong>意義不同</strong>（一個是 ${n} 個 \\(-${a}\\) 連乘，一個是先算 \\(${a}^{${n}}\\) 再取相反數），但<strong>值恰好相同</strong>，都是 \\(${left}\\)。`
        : `\\(${n}\\) 是<strong>偶數</strong>：\\((-${a})^{${n}}\\) 的 ${n} 個負號兩兩配對<strong>剛好抵消</strong>，結果為正 \\(${left}\\)；` +
          `而 \\(-${a}^{${n}}\\) 的負號在括號外，不參與連乘，結果為負 \\(${right}\\)。<br>` +
          `所以兩者<strong>意義不同、值也不同</strong>。`
    );
    typeset([feedbackDiv]);

    // ===== Canvas 繪圖 =====
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const colW = (w - 60) / 2;
    const cols = [
      {
        x: 20,
        title: `(-${a})`,
        exp: `${n}`,
        accent: '#f472b6',
        soft: 'rgba(244,114,182,0.14)',
        expand: `${n} 個 (-${a}) 連乘`,
        detail: `負號在括號內，會一起參與連乘`,
        value: left
      },
      {
        x: 40 + colW,
        title: `-${a}`,
        exp: `${n}`,
        accent: '#67e8f9',
        soft: 'rgba(103,232,249,0.14)',
        expand: `-( ${n} 個 ${a} 連乘 )`,
        detail: `負號在括號外，只在最後取相反數`,
        value: right
      }
    ];

    cols.forEach(col => {
      const boxY = 14;
      const boxH = h - 54;

      ctx.save();
      roundRect(ctx, col.x, boxY, colW, boxH, 14);
      ctx.fillStyle = col.soft;
      ctx.fill();
      ctx.strokeStyle = col.accent;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = col.accent;
      ctx.stroke();
      ctx.restore();

      const cx = col.x + colW / 2;

      // 算式（含上標）
      drawPow(ctx, cx, boxY + 40, col.title, col.exp, 26, '#ffffff', 'center');

      // 展開的意義
      ctx.fillStyle = col.accent;
      ctx.font = 'bold 13px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(col.expand, cx, boxY + 54);

      ctx.fillStyle = 'rgba(255,255,255,0.62)';
      ctx.font = '12px Outfit, sans-serif';
      ctx.fillText(col.detail, cx, boxY + 74);

      // 分隔線
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(col.x + 18, boxY + 96);
      ctx.lineTo(col.x + colW - 18, boxY + 96);
      ctx.stroke();

      // 結果
      const vColor = col.value >= 0 ? '#fbbf24' : '#38bdf8';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.fillText('計算結果', cx, boxY + 106);

      ctx.fillStyle = vColor;
      ctx.font = 'bold 26px Outfit, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 12;
      ctx.shadowColor = vColor;
      ctx.fillText(`${col.value}`, cx, boxY + 144);
      ctx.shadowBlur = 0;
      ctx.textBaseline = 'top';
    });

    // 底部結論
    const verdict = same ? '指數為奇數 → 兩者的值相同' : '指數為偶數 → 兩者的值不同';
    const vcolor = same ? '#34d399' : '#f87171';
    ctx.fillStyle = vcolor;
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.shadowBlur = 10;
    ctx.shadowColor = vcolor;
    ctx.fillText(verdict, w / 2, h - 10);
    ctx.shadowBlur = 0;
  }

  sliderA.addEventListener('input', draw);
  sliderN.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   5. 重點 3：含乘方的四則運算逐步拆解器
   ========================================================================== */
function initStepSolver() {
  const stage = document.getElementById('step-stage');
  if (!stage) return;

  const grid = document.getElementById('step-choice-grid');
  const btnNext = document.getElementById('step-next');
  const btnReset = document.getElementById('step-reset');

  // 每個題目：lines 為逐行算式，notes 為對應該行的說明
  const PROBLEMS = [
    {
      lines: [
        '\\((-4^2) \\div 4 - 2^3\\)',
        '\\(= (-16) \\div 4 - 8\\)',
        '\\(= -4 - 8\\)',
        '\\(= -12\\)'
      ],
      notes: [
        '含有乘方的四則運算，<strong>乘方要最先算</strong>，再處理乘除，最後加減。',
        '先算兩個乘方：\\(-4^2 = -(4 \\times 4) = -16\\)（負號在括號外，不參與連乘）、\\(2^3 = 8\\)。',
        '乘方算完才輪到除法：\\((-16) \\div 4 = -4\\)（異號相除得負）。',
        '最後做減法：\\(-4 - 8 = -12\\)。'
      ]
    },
    {
      lines: [
        '\\(9 - 3^2 \\times [ 6 + (-2^3) ]\\)',
        '\\(= 9 - 9 \\times [ 6 + (-8) ]\\)',
        '\\(= 9 - 9 \\times (-2)\\)',
        '\\(= 9 + 18\\)',
        '\\(= 27\\)'
      ],
      notes: [
        '式子裡有中括號，<strong>括號內先算</strong>；而括號內也一樣要先算乘方。',
        '把三個乘方先算出來：\\(3^2 = 9\\)、\\(-2^3 = -(2 \\times 2 \\times 2) = -8\\)。',
        '再算中括號內的加法：\\(6 + (-8) = -2\\)，括號處理完畢。',
        '接著算乘法：\\(9 \\times (-2) = -18\\)，<strong>減去 \\(-18\\) 等於加上 \\(18\\)</strong>。',
        '最後 \\(9 + 18 = 27\\)。'
      ]
    },
    {
      lines: [
        '\\(6^2 - (-6)^2 \\times (11 - 3^2)\\)',
        '\\(= 36 - 36 \\times (11 - 9)\\)',
        '\\(= 36 - 36 \\times 2\\)',
        '\\(= 36 - 72\\)',
        '\\(= -36\\)'
      ],
      notes: [
        '這題最容易錯的是 \\(6^2\\) 被當成 \\(6 \\times 2\\)。<strong>乘方是連乘，不是相乘</strong>。',
        '三個乘方分別是 \\(6^2 = 36\\)、\\((-6)^2 = (-6) \\times (-6) = 36\\)（負數的偶數次方為正）、\\(3^2 = 9\\)。',
        '再算小括號內的減法：\\(11 - 9 = 2\\)。',
        '括號沒了，先乘除後加減：\\(36 \\times 2 = 72\\)。',
        '最後 \\(36 - 72 = -36\\)。整題只要有一個乘方算錯，答案就全錯了。'
      ]
    }
  ];

  let current = 0; // 目前選的題目
  let shown = 1;   // 已顯示到第幾行

  function render() {
    const p = PROBLEMS[current];
    let html = '';
    for (let i = 0; i < shown; i++) {
      const isCurrent = i === shown - 1;
      html += `<div class="step-line${isCurrent ? ' is-current' : ''}">${p.lines[i]}</div>`;
    }
    html += `<div class="step-note">${p.notes[shown - 1]}</div>`;
    stage.innerHTML = html;
    typeset([stage]);

    const done = shown >= p.lines.length;
    btnNext.disabled = done;
    btnNext.textContent = done ? '已完成計算' : '下一步';
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.step-choice-btn');
    if (!btn) return;
    grid.querySelectorAll('.step-choice-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    current = parseInt(btn.getAttribute('data-idx'), 10);
    shown = 1;
    render();
  });

  btnNext.addEventListener('click', () => {
    if (shown < PROBLEMS[current].lines.length) {
      shown++;
      render();
    }
  });

  btnReset.addEventListener('click', () => {
    shown = 1;
    render();
  });

  render();
}

/* ==========================================================================
   6. 重點 4：10 的次方位值尺
   ========================================================================== */
function initTenCanvas() {
  const canvas = document.getElementById('canvas-ten');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const slider = document.getElementById('ten-n-slider');
  const valN = document.getElementById('ten-n-val');
  const formulaDiv = document.getElementById('ten-formula');
  const feedbackDiv = document.getElementById('ten-feedback');

  const MIN = -6, MAX = 6;

  function draw() {
    const n = parseInt(slider.value, 10);
    const decimal = buildDecimal('1', n);

    valN.textContent = `${n}`;

    let latex;
    if (n > 0) {
      latex = `10^{${n}} = ${decimal}`;
    } else if (n === 0) {
      latex = `10^{0} = 1`;
    } else {
      latex = `10^{${n}} = \\frac{1}{10^{${-n}}} = ${decimal}`;
    }
    formulaDiv.innerHTML = `<span style="color:#fde047">\\(${latex}\\)</span>`;
    typeset([formulaDiv]);

    let note;
    if (n > 0) {
      note = `指數是<strong>正整數</strong> \\(${n}\\)，代表 \\(${n}\\) 個 10 連乘，` +
        `寫成小數就是 1 後面接 <strong>${n}</strong> 個 0。`;
    } else if (n === 0) {
      note = `\\(10^{0} = 1\\)。把 \\(10^{1} = 10\\) 變成 \\(\\frac{1}{10}\\) 倍就得到 1，` +
        `所以指數從 1 減少為 <strong>0</strong> 時，數值恰好是 1。`;
    } else {
      note = `指數是<strong>負整數</strong> \\(${n}\\)，代表 \\(\\frac{1}{10^{${-n}}}\\)，` +
        `是一個<strong>很小的正數</strong> \\(${decimal}\\)，<strong>不是負數</strong>。`;
    }
    feedbackDiv.innerHTML = wrapFeedback(note);
    typeset([feedbackDiv]);

    // ===== Canvas 繪圖 =====
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padding = 30;
    const axisY = 74;
    const span = MAX - MIN;
    const toX = v => padding + ((v - MIN) / span) * (w - padding * 2);

    // 指數尺（雙向皆為指數座標，非數線，兩端不加箭頭以免與數線規範混淆）
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toX(MIN), axisY);
    ctx.lineTo(toX(MAX), axisY);
    ctx.stroke();

    for (let i = MIN; i <= MAX; i++) {
      const cx = toX(i);
      const isCur = i === n;
      ctx.strokeStyle = isCur ? '#fbbf24' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = isCur ? 2.5 : 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, axisY - 7);
      ctx.lineTo(cx, axisY + 7);
      ctx.stroke();

      ctx.fillStyle = isCur ? '#fde047' : 'rgba(255,255,255,0.5)';
      ctx.font = `bold ${isCur ? 14 : 12}px Outfit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${i}`, cx, axisY + 11);
    }

    // 目前位置的光點
    ctx.save();
    ctx.fillStyle = '#fbbf24';
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#fbbf24';
    ctx.beginPath();
    ctx.arc(toX(n), axisY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 尺的兩端說明
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('← 每往左一格，數值變 1/10 倍', padding, axisY - 16);
    ctx.textAlign = 'right';
    ctx.fillText('每往右一格，數值變 10 倍 →', w - padding, axisY - 16);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('指　數', w / 2, axisY + 30);

    // 下半部：10 的次方與其十進位寫法
    const cardY = 128;
    const cardH = h - cardY - 16;
    ctx.save();
    roundRect(ctx, padding, cardY, w - padding * 2, cardH, 14);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.10)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    const midX = w / 2;
    drawPow(ctx, midX, cardY + 40, '10', `${n}`, 30, '#ffffff', 'center');

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('=', midX, cardY + 62);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 26px Outfit, sans-serif';
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(251,191,36,0.7)';
    ctx.fillText(decimal, midX, cardY + 90);
    ctx.shadowBlur = 0;
  }

  slider.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   7. 重點 5：科學記號小數點移動器
   ========================================================================== */
function initSciCanvas() {
  const canvas = document.getElementById('canvas-sci');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const grid = document.getElementById('sci-choice-grid');
  const slider = document.getElementById('sci-pos-slider');
  const valPos = document.getElementById('sci-pos-val');
  const formulaDiv = document.getElementById('sci-formula');
  const feedbackDiv = document.getElementById('sci-feedback');

  // digits：整串數字（不含小數點）；pointIdx：原數的小數點前有幾位數字
  const NUMBERS = [
    { label: '4300000000', digits: '4300000000', pointIdx: 10, unit: '（約 43 億）' },
    { label: '0.00000275', digits: '000000275', pointIdx: 1, unit: '（很小的正數）' },
    { label: '0.000000027', digits: '0000000027', pointIdx: 1, unit: '（諾羅病毒直徑，公尺）' }
  ];

  let current = 0;

  function syncSlider() {
    const num = NUMBERS[current];
    slider.min = '1';
    slider.max = `${num.digits.length}`;
    slider.value = `${num.pointIdx}`;
  }

  function draw() {
    const num = NUMBERS[current];
    const pos = parseInt(slider.value, 10);          // 小數點前保留幾位數字
    const n = num.pointIdx - pos;                    // 需要補回的 10 的次方
    const intPart = num.digits.slice(0, pos);
    const fracPart = num.digits.slice(pos);
    const shown = fracPart.length > 0 ? `${intPart}.${fracPart}` : intPart;
    const a = parseFloat(shown);
    const legal = a >= 1 && a < 10;

    // 去掉多餘前導 0 後的顯示字串
    const aText = `${a}`;
    valPos.textContent = `${pos}`;

    formulaDiv.innerHTML = legal
      ? `<span style="color:#f472b6">\\(${num.label} = ${aText} \\times 10^{${n}}\\)</span>`
      : `<span style="color:#94a3b8">\\(${num.label} = ${aText} \\times 10^{${n}}\\)</span>`;
    typeset([formulaDiv]);

    let note;
    if (legal) {
      note = `\\(${aText}\\) 落在 \\(1 \\le a < 10\\) 之間，這是<strong>合法的科學記號</strong>：` +
        `\\(${num.label} = ${aText} \\times 10^{${n}}\\)。` +
        (n >= 0
          ? `<br>小數點<strong>左移 ${n} 位</strong>，就要乘回 \\(10^{${n}}\\) 才不改變大小。`
          : `<br>小數點<strong>右移 ${-n} 位</strong>，就要乘上 \\(10^{${n}}\\)（即除以 \\(10^{${-n}}\\)）才不改變大小。`);
    } else if (a < 1) {
      note = `\\(${aText}\\) 小於 1，<strong>還不是</strong>科學記號的標準寫法。` +
        `把小數點再<strong>往右</strong>移，直到整數部分只剩一個不為 0 的數字。`;
    } else {
      note = `\\(${aText}\\) 大於等於 10，<strong>還不是</strong>科學記號的標準寫法。` +
        `把小數點再<strong>往左</strong>移，直到整數部分只剩一位數。`;
    }
    feedbackDiv.innerHTML = wrapFeedback(note);
    typeset([feedbackDiv]);

    // ===== Canvas 繪圖 =====
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padding = 26;
    const digits = num.digits;
    const cellW = Math.min(34, (w - padding * 2) / digits.length);
    const rowW = cellW * digits.length;
    const startX = (w - rowW) / 2;
    const cellY = 46;
    const cellH = 42;

    // 標題
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('拖動滑桿移動小數點的位置', w / 2, 16);

    // 數字格
    for (let i = 0; i < digits.length; i++) {
      const cx = startX + i * cellW;
      const inInt = i < pos;
      const isLeadZero = inInt && parseFloat(digits.slice(0, pos)) === 0;
      const active = legal && i === pos - 1;

      ctx.save();
      roundRect(ctx, cx + 2, cellY, cellW - 4, cellH, 6);
      ctx.fillStyle = active
        ? 'rgba(244,114,182,0.30)'
        : (inInt ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)');
      ctx.fill();
      ctx.strokeStyle = active ? '#f472b6' : 'rgba(255,255,255,0.14)';
      ctx.lineWidth = active ? 2 : 1;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = isLeadZero ? 'rgba(255,255,255,0.35)' : (inInt ? '#ffffff' : 'rgba(255,255,255,0.7)');
      ctx.font = 'bold 17px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(digits[i], cx + cellW / 2, cellY + cellH / 2 + 1);
    }

    // 小數點標記（畫在第 pos 個數字的右側）
    const dotX = startX + pos * cellW;
    ctx.save();
    ctx.fillStyle = '#f472b6';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#f472b6';
    ctx.beginPath();
    ctx.arc(dotX, cellY + cellH + 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(244,114,182,0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(dotX, cellY - 6);
    ctx.lineTo(dotX, cellY + cellH + 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 原始小數點位置（灰色參考線）
    const origX = startX + num.pointIdx * cellW;
    if (origX !== dotX) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(origX, cellY - 6);
      ctx.lineTo(origX, cellY + cellH + 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255,255,255,0.42)';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('原位置', origX, cellY + cellH + 14);
    }

    // 結果卡片
    const cardY = 148;
    const cardH = h - cardY - 14;
    const accent = legal ? '#34d399' : '#94a3b8';
    ctx.save();
    roundRect(ctx, padding, cardY, w - padding * 2, cardH, 14);
    ctx.fillStyle = legal ? 'rgba(52,211,153,0.10)' : 'rgba(148,163,184,0.08)';
    ctx.fill();
    ctx.strokeStyle = legal ? 'rgba(52,211,153,0.55)' : 'rgba(148,163,184,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // a × 10^n
    const aStr = aText;
    const midY = cardY + 42;
    ctx.font = 'bold 26px Outfit, sans-serif';
    const aW = ctx.measureText(aStr).width;
    const timesW = ctx.measureText(' × ').width;
    const powW = measurePow(ctx, '10', `${n}`, 26);
    const totalW = aW + timesW + powW;
    let cx0 = w / 2 - totalW / 2;

    ctx.fillStyle = legal ? '#ffffff' : 'rgba(255,255,255,0.65)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(aStr, cx0, midY);
    cx0 += aW;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(' × ', cx0, midY);
    cx0 += timesW;
    drawPow(ctx, cx0, midY, '10', `${n}`, 26, legal ? '#fde047' : 'rgba(253,224,71,0.55)', 'left');

    // 合法性標示
    ctx.fillStyle = accent;
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(legal ? '✓ 符合 1 ≤ a < 10，是科學記號' : '✗ a 不在 1 到 10 之間，還不是科學記號',
      w / 2, cardY + cardH - 12);
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.step-choice-btn');
    if (!btn) return;
    grid.querySelectorAll('.step-choice-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    current = parseInt(btn.getAttribute('data-idx'), 10);
    syncSlider();
    draw();
  });

  slider.addEventListener('input', draw);
  syncSlider();
  draw();
}

/* ==========================================================================
   8. 重點 6：科學記號比大小擂台
   ========================================================================== */
function initCompareCanvas() {
  const canvas = document.getElementById('canvas-compare');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sA = document.getElementById('cmp-a-slider');
  const sM = document.getElementById('cmp-m-slider');
  const sB = document.getElementById('cmp-b-slider');
  const sN = document.getElementById('cmp-n-slider');
  const vA = document.getElementById('cmp-a-val');
  const vM = document.getElementById('cmp-m-val');
  const vB = document.getElementById('cmp-b-val');
  const vN = document.getElementById('cmp-n-val');
  const formulaDiv = document.getElementById('cmp-formula');
  const feedbackDiv = document.getElementById('cmp-feedback');

  function draw() {
    const ai = parseInt(sA.value, 10);   // 10 ~ 99，代表 1.0 ~ 9.9
    const m = parseInt(sM.value, 10);
    const bi = parseInt(sB.value, 10);
    const n = parseInt(sN.value, 10);

    const aTxt = (ai / 10).toFixed(1);
    const bTxt = (bi / 10).toFixed(1);
    const aDec = buildDecimal(`${ai}`, m - 1);
    const bDec = buildDecimal(`${bi}`, n - 1);

    vA.textContent = aTxt;
    vM.textContent = `${m}`;
    vB.textContent = bTxt;
    vN.textContent = `${n}`;

    // 比較：先比指數，指數相同再比 a
    let cmp;
    if (m !== n) cmp = m > n ? 1 : -1;
    else if (ai !== bi) cmp = ai > bi ? 1 : -1;
    else cmp = 0;

    const symbol = cmp > 0 ? '>' : (cmp < 0 ? '<' : '=');
    formulaDiv.innerHTML =
      `<span style="color:#a7f3d0">\\(${aTxt} \\times 10^{${m}}\\)</span>` +
      `<span style="color:#ffffff; margin:0 0.6rem; font-size:1.4rem;">\\(${symbol}\\)</span>` +
      `<span style="color:#7dd3fc">\\(${bTxt} \\times 10^{${n}}\\)</span>`;
    typeset([formulaDiv]);

    let note;
    if (cmp === 0) {
      note = `兩數的 \\(a\\) 與指數都相同，因此<strong>兩數相等</strong>。`;
    } else if (m !== n) {
      const bigM = m > n;
      note = `兩數的<strong>指數不同</strong>（\\(${m}\\) 與 \\(${n}\\)）。` +
        `科學記號中 \\(1 \\le a < 10\\)，所以<strong>指數愈大，數值一定愈大</strong>，不必比較 \\(a\\)。<br>` +
        `因為 \\(${Math.max(m, n)} > ${Math.min(m, n)}\\)，所以 ` +
        `\\(${bigM ? `${aTxt} \\times 10^{${m}} > ${bTxt} \\times 10^{${n}}` : `${aTxt} \\times 10^{${m}} < ${bTxt} \\times 10^{${n}}`}\\)。`;
    } else {
      note = `兩數的<strong>指數相同</strong>（都是 \\(${m}\\)），這時就<strong>直接比較 \\(a\\)</strong>。<br>` +
        `因為 \\(${aTxt} ${cmp > 0 ? '>' : '<'} ${bTxt}\\)，所以 ` +
        `\\(${aTxt} \\times 10^{${m}} ${cmp > 0 ? '>' : '<'} ${bTxt} \\times 10^{${n}}\\)。`;
    }
    feedbackDiv.innerHTML = wrapFeedback(note);
    typeset([feedbackDiv]);

    // ===== Canvas 繪圖 =====
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padding = 24;
    const labelW = 118;              // 左側標籤區
    const barX = padding + labelW;
    const barMaxW = w - barX - padding - 34;
    // 長條長度＝兩數的實際比例（以比較大的那個數為滿格），
    // 所以「大幾倍」直接用長度看得出來；差距太大時小的那條會縮成一小段，這本身就是答案。
    const valA = (ai / 10) * Math.pow(10, m);
    const valB = (bi / 10) * Math.pow(10, n);
    const vMax = Math.max(valA, valB);
    const lenOf = v => Math.max(10, (v / vMax) * barMaxW);

    const rows = [
      { txt: aTxt, e: m, val: valA, dec: aDec, color: '#34d399', soft: 'rgba(52,211,153,0.22)', y: 44, win: cmp > 0 },
      { txt: bTxt, e: n, val: valB, dec: bDec, color: '#38bdf8', soft: 'rgba(56,189,248,0.22)', y: 118, win: cmp < 0 }
    ];

    rows.forEach(r => {
      // 左側：科學記號寫法
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const powW = measurePow(ctx, `${r.txt} × 10`, `${r.e}`, 17);
      drawPow(ctx, padding, r.y + 18, `${r.txt} × 10`, `${r.e}`, 17, '#ffffff', 'left');

      // 乘開後的十進位寫法
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '11px Outfit, sans-serif';
      ctx.textBaseline = 'top';
      const decTxt = r.dec.length > 15 ? r.dec.slice(0, 15) + '…' : r.dec;
      ctx.fillText(decTxt, padding, r.y + 26);

      // 長條：長度由「整個數值的大小」決定（a 與指數都算進去）
      const bw = lenOf(r.val);
      ctx.save();
      roundRect(ctx, barX, r.y, bw, 34, 8);
      ctx.fillStyle = r.soft;
      ctx.fill();
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.win ? 2.5 : 1.5;
      ctx.shadowBlur = r.win ? 14 : 5;
      ctx.shadowColor = r.color;
      ctx.stroke();
      ctx.restore();

      // 條尾的指數標籤
      drawPow(ctx, barX + bw + 8, r.y + 22, '10', `${r.e}`, 14, r.color, 'left');
    });

    // 中間的大小符號
    ctx.save();
    ctx.fillStyle = cmp === 0 ? '#fbbf24' : '#ffffff';
    ctx.font = 'bold 30px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(255,255,255,0.35)';
    ctx.fillText(symbol, padding + labelW / 2 - 6, 96);
    ctx.restore();

    // 底部判斷理由
    const reason = m !== n
      ? '指數不同 → 指數大的數就大'
      : (cmp === 0 ? '指數與 a 都相同 → 兩數相等' : '指數相同 → 比較前面的 a');
    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(167,243,208,0.5)';
    ctx.fillText(reason, w / 2, h - 12);
    ctx.shadowBlur = 0;

    // 長度尺說明：長條長度就是兩數的實際倍率
    const grey = 'rgba(255,255,255,0.4)';
    ctx.fillStyle = grey;
    ctx.font = '11px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    if (cmp === 0) {
      ctx.fillText('長條長度＝兩數的實際比例：兩數一樣大，所以一樣長', barX, 176);
    } else {
      const head = '長條長度＝兩數的實際比例：大的是小的 ';
      ctx.fillText(head, barX, 176);
      const x = barX + ctx.measureText(head).width;
      const ratio = vMax / Math.min(valA, valB);
      if (ratio < 10000) {
        ctx.fillText(`${Math.round(ratio * 10) / 10} 倍`, x, 176);
      } else {
        const e10 = Math.floor(Math.log10(ratio) + 1e-9);
        const mant = Math.round((ratio / Math.pow(10, e10)) * 10) / 10;
        const pw = drawPow(ctx, x, 185, `約 ${mant} × 10`, `${e10}`, 11, grey, 'left');
        ctx.fillStyle = grey;
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(' 倍', x + pw, 176);
      }
    }
  }

  [sA, sM, sB, sN].forEach(s => s.addEventListener('input', draw));
  draw();
}
