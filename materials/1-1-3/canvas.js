document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quiz System
  initQuizSystem();

  // Initialize Canvas Simulations
  initMultiplyCanvas();
  initSignsCanvas();
  initDivideCanvas();
  initStepSolver();
  initDistributeCanvas();
  initDiceCanvas();
});

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // Correct answers mapping for Section 1-3 (12 Quizzes)
  const answers = {
    '1-3-1-1': 'C', // (-7)x9 = -63
    '1-3-1-2': 'B', // (-6)x(-5) = 30，5 天前比現在高 30 公分
    '1-3-2-1': 'D', // (-25)x(-17)x(-4) = -1700
    '1-3-2-2': 'B', // 5 個負數（奇數個）=> 負數
    '1-3-3-1': 'A', // (-102)/(-6) = 17
    '1-3-3-2': 'C', // 0 / (-9) = 0
    '1-3-4-1': 'D', // 8 + 5x(-6) = -22
    '1-3-4-2': 'B', // (-9)x4 + |(-7)x5-6| = 5
    '1-3-5-1': 'C', // (-47)x63 + (-47)x37 = -4700
    '1-3-5-2': 'A', // 1003x(-24) = -24072
    '1-3-6-1': 'D', // 5x6 + (-3)x4 + 1x3 = 21
    '1-3-6-2': 'B'  // 5x20 + (-3)x6 + 0x4 = 82
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

// 依正負回傳配色（正：玫瑰紅系；負：天藍系）
function signColor(n) {
  return n >= 0 ? '#fda4af' : '#60a5fa';
}

/* ==========================================================================
   3. 重點 1：水庫水位乘法模擬器
   ========================================================================== */
function initMultiplyCanvas() {
  const canvas = document.getElementById('canvas-multiply');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderA = document.getElementById('mul-a-slider');
  const sliderB = document.getElementById('mul-b-slider');
  const valA = document.getElementById('mul-a-val');
  const valB = document.getElementById('mul-b-val');
  const formulaDiv = document.getElementById('multiply-formula');
  const feedbackDiv = document.getElementById('multiply-feedback');

  function draw() {
    const a = parseInt(sliderA.value, 10);
    const b = parseInt(sliderB.value, 10);
    const result = a * b;

    valA.textContent = a > 0 ? `+${a}` : `${a}`;
    valB.textContent = b > 0 ? `${b} 天後` : (b < 0 ? `${Math.abs(b)} 天前` : '0 天');

    // 公式（首項不加括號，負數的第二項加括號，結果不加括號）
    formulaDiv.innerHTML =
      `<span style="color: ${signColor(a)}">\\(${a}\\)</span> \\(\\times\\) ` +
      `<span style="color: ${signColor(b)}">\\(${paren(b)}\\)</span> \\(=\\) ` +
      `<span style="color: ${signColor(result)}; font-size: 1.5rem; text-shadow: 0 0 10px rgba(255,255,255,0.2)">\\(${result}\\)</span>`;
    typeset([formulaDiv]);

    // 說明文字
    if (a === 0 || b === 0) {
      feedbackDiv.innerHTML = wrapFeedback(
        `<strong>與 0 相乘</strong>：只要有一個因數是 0，乘積必為 0，水位完全沒有變化。`
      );
    } else {
      const dirWord = b > 0 ? '天後' : '天前';
      const stepVal = a * Math.sign(b); // 每一步實際的移動量
      const same = (a > 0) === (b > 0);
      const ruleText = same
        ? `<strong>同號相乘得正</strong>`
        : `<strong>異號相乘得負</strong>`;
      const resultWord = result > 0 ? '高' : '低';
      feedbackDiv.innerHTML = wrapFeedback(
        `每天變化 ${a} 公分，往「${Math.abs(b)} ${dirWord}」推算，` +
        `相當於重複移動 <strong>${Math.abs(b)}</strong> 次、每次 <strong>${stepVal > 0 ? '+' : ''}${stepVal}</strong> 公分。<br>` +
        `${ruleText}：\\(${a} \\times ${paren(b)} = ${result}\\)，` +
        `即 ${Math.abs(b)} ${dirWord}的水位比現在<strong>${resultWord} ${Math.abs(result)}</strong> 公分。`
      );
      typeset([feedbackDiv]);
    }

    // ===== Canvas 繪圖 =====
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const centerY = h - 52;
    const padding = 26;
    const range = 80; // -40 ~ 40
    const scale = (w - padding * 2) / range;
    const toX = v => padding + (v + 40) * scale;

    // 數線本體（僅右側單向箭頭，左側為無箭頭平直線）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(toX(-40.5), centerY);
    ctx.lineTo(toX(39.4), centerY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(toX(40.5), centerY);
    ctx.lineTo(toX(39.3), centerY - 6);
    ctx.lineTo(toX(39.3), centerY + 6);
    ctx.closePath();
    ctx.fill();

    // 刻度與標號
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = -40; i <= 40; i += 2) {
      const cx = toX(i);
      const isZero = i === 0;
      const major = i % 10 === 0;
      ctx.strokeStyle = isZero ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = isZero ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx, centerY - (isZero ? 8 : 4));
      ctx.lineTo(cx, centerY + (isZero ? 8 : 4));
      ctx.stroke();

      if (major) {
        ctx.fillStyle = isZero ? '#fff' : 'rgba(255,255,255,0.7)';
        ctx.font = isZero ? 'bold 14px Outfit, sans-serif' : 'bold 13px Outfit, sans-serif';
        ctx.fillText(i, cx, centerY + 12);
      }
    }

    // 逐步堆疊的位移箭頭
    const steps = Math.abs(b);
    const stepVal = a * Math.sign(b);
    if (steps > 0 && a !== 0) {
      // 箭頭由下往上堆疊，整疊在數線上方的空間中垂直置中
      const baseY = centerY - 26;
      const topLimit = 24;
      const gap = steps > 1 ? Math.min(22, (baseY - topLimit) / (steps - 1)) : 0;
      const stackH = (steps - 1) * gap;
      const firstY = Math.min(baseY, (topLimit + baseY) / 2 + stackH / 2);

      let pos = 0;
      for (let i = 0; i < steps; i++) {
        const from = pos;
        const to = pos + stepVal;
        const y = firstY - i * gap;
        const color = stepVal > 0 ? '#f43f5e' : '#06b6d4';

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.moveTo(toX(from), y);
        ctx.lineTo(toX(to), y);
        ctx.stroke();

        // 箭頭
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(toX(to), y);
        const dir = stepVal > 0 ? 1 : -1;
        ctx.lineTo(toX(to) - dir * 8, y - 4.5);
        ctx.lineTo(toX(to) - dir * 8, y + 4.5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        pos = to;
      }

      // 終點標記
      ctx.fillStyle = '#fbbf24';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#fbbf24';
      ctx.beginPath();
      ctx.arc(toX(result), centerY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${result}`, toX(result), centerY - 6);
      ctx.textBaseline = 'top';
    } else {
      // 0 的情形，只標出原點
      ctx.fillStyle = '#fbbf24';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#fbbf24';
      ctx.beginPath();
      ctx.arc(toX(0), centerY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  sliderA.addEventListener('input', draw);
  sliderB.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   4. 重點 2：連乘符號判斷器
   ========================================================================== */
function initSignsCanvas() {
  const canvas = document.getElementById('canvas-signs');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const grid = document.getElementById('sign-btn-grid');
  const formulaDiv = document.getElementById('signs-formula');
  const feedbackDiv = document.getElementById('signs-feedback');

  // 6 個因數的正負（true 代表負）
  // 因數個數與數字都刻意與 Q2 的 (-3)(-5)(-7)(-9)(-11) 錯開，
  // 否則全部點成負號就等於把那一題的答案直接印在畫面上（開發約束 29）
  const negs = [true, false, true, false, true, false];
  const values = [2, 3, 4, 5, 6, 8]; // 數字部分固定，只切換符號

  function syncButtons() {
    grid.querySelectorAll('.sign-btn').forEach(btn => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      btn.textContent = negs[idx] ? '－' : '＋';
      btn.classList.toggle('is-negative', negs[idx]);
    });
  }

  function draw() {
    const negCount = negs.filter(Boolean).length;
    const isNegative = negCount % 2 === 1;
    const pairCount = Math.floor(negCount / 2);

    // 公式：每個因數各自包一段 \( \)，用零寬的 <wbr> 接起來，讓窄螢幕可以在因數之間換行
    // （整串包成一段時 mjx-container 是不折行的 inline-block，414px 下會溢出 92px；
    //   接合用 <wbr> 而不是空白，寬螢幕的排版才跟原本逐像素相同）
    const terms = values.map((v, i) => {
      const n = negs[i] ? -v : v;
      // 首項不加括號；後面的因數把 \times 帶在自己前面，{} 讓它維持二元運算子的字距
      return i === 0 ? `\\(${n}\\)` : `\\({}\\times ${paren(n)}\\)`;
    }).join('<wbr>');
    const resultSign = isNegative ? '負數' : '正數';
    const color = isNegative ? '#60a5fa' : '#fda4af';

    formulaDiv.innerHTML =
      `${terms} 的乘積是 ` +
      `<span style="color:${color}; font-size:1.35rem; text-shadow: 0 0 10px rgba(255,255,255,0.2)">${resultSign}</span>`;
    typeset([formulaDiv]);

    feedbackDiv.innerHTML = wrapFeedback(
      `目前有 <strong>${negCount}</strong> 個負數，可配成 <strong>${pairCount}</strong> 對` +
      `（每一對負負得正）${negCount % 2 === 1 ? '，還<strong>剩下 1 個</strong>負號沒配到' : '，<strong>剛好配完</strong>'}。<br>` +
      `${negCount} 是<strong>${isNegative ? '奇' : '偶'}數</strong>個 \\(\\Rightarrow\\) 乘積為<strong>${resultSign}</strong>。`
    );
    typeset([feedbackDiv]);

    // ===== Canvas 繪圖 =====
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const tileW = 66;
    const tileH = 66;
    const gap = 16;
    const totalW = values.length * tileW + (values.length - 1) * gap;
    const startX = (w - totalW) / 2;
    const tileY = 46;

    const centers = [];
    values.forEach((v, i) => {
      const x = startX + i * (tileW + gap);
      const neg = negs[i];
      const fill = neg ? 'rgba(6, 182, 212, 0.18)' : 'rgba(244, 63, 94, 0.15)';
      const stroke = neg ? '#06b6d4' : '#f43f5e';

      // 圓角方塊
      ctx.beginPath();
      const r = 14;
      ctx.moveTo(x + r, tileY);
      ctx.arcTo(x + tileW, tileY, x + tileW, tileY + tileH, r);
      ctx.arcTo(x + tileW, tileY + tileH, x, tileY + tileH, r);
      ctx.arcTo(x, tileY + tileH, x, tileY, r);
      ctx.arcTo(x, tileY, x + tileW, tileY, r);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = stroke;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 反光高光線
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 12, tileY + 6);
      ctx.lineTo(x + tileW - 12, tileY + 6);
      ctx.stroke();

      // 數字
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${neg ? '-' : ''}${v}`, x + tileW / 2, tileY + tileH / 2);

      centers.push({ x: x + tileW / 2, neg: neg });
    });

    // 負號兩兩配對的連線
    const negCenters = centers.filter(c => c.neg).map(c => c.x);
    const arcBaseY = tileY + tileH + 14;
    for (let i = 0; i + 1 < negCenters.length; i += 2) {
      const x1 = negCenters[i];
      const x2 = negCenters[i + 1];
      const midX = (x1 + x2) / 2;
      const depth = 30 + (i / 2) * 14;

      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#34d399';
      ctx.beginPath();
      ctx.moveTo(x1, arcBaseY);
      ctx.quadraticCurveTo(midX, arcBaseY + depth, x2, arcBaseY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 配對成功標示為 +
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 18px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('＋', midX, arcBaseY + depth * 0.62);
    }

    // 剩下的那一個負號
    if (negCenters.length % 2 === 1) {
      const lonelyX = negCenters[negCenters.length - 1];
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(lonelyX, arcBaseY);
      ctx.lineTo(lonelyX, h - 30);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('落單的負號', lonelyX, h - 26);
    }

    // 上方標題
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('負號兩兩配對，剩下的決定乘積符號', w / 2, 14);
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.sign-btn');
    if (!btn) return;
    const idx = parseInt(btn.getAttribute('data-idx'), 10);
    negs[idx] = !negs[idx];
    syncButtons();
    draw();
  });

  syncButtons();
  draw();
}

/* ==========================================================================
   5. 重點 3：乘除互逆關係器
   ========================================================================== */
function initDivideCanvas() {
  const canvas = document.getElementById('canvas-divide');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderQ = document.getElementById('div-q-slider');
  const sliderD = document.getElementById('div-d-slider');
  const valQ = document.getElementById('div-q-val');
  const valD = document.getElementById('div-d-val');
  const formulaDiv = document.getElementById('divide-formula');
  const feedbackDiv = document.getElementById('divide-feedback');

  function draw() {
    const q = parseInt(sliderQ.value, 10);
    let d = parseInt(sliderD.value, 10);
    if (d === 0) d = 1; // 除數不可為 0，滑桿滑到 0 時自動跳過
    const dividend = q * d;

    valQ.textContent = q > 0 ? `+${q}` : `${q}`;
    valD.textContent = d > 0 ? `+${d}` : `${d}`;

    formulaDiv.innerHTML =
      `<span style="color: ${signColor(dividend)}">\\(${dividend}\\)</span> \\(\\div\\) ` +
      `<span style="color: ${signColor(d)}">\\(${paren(d)}\\)</span> \\(=\\) ` +
      `<span style="color: ${signColor(q)}; font-size: 1.5rem; text-shadow: 0 0 10px rgba(255,255,255,0.2)">\\(${q}\\)</span>`;
    typeset([formulaDiv]);

    if (dividend === 0) {
      feedbackDiv.innerHTML = wrapFeedback(
        `<strong>0 的除法</strong>：\\(0 \\div ${paren(d)} = 0\\)。0 除以任何一個<strong>不為 0</strong> 的整數，結果都是 0。<br>` +
        `但反過來 \\(${paren(d)} \\div 0\\) <strong>沒有意義</strong>，0 永遠不可以當除數。`
      );
    } else {
      const same = (dividend > 0) === (d > 0);
      feedbackDiv.innerHTML = wrapFeedback(
        `<strong>先用乘法</strong>：\\(${q} \\times ${paren(d)} = ${dividend}\\)，` +
        `所以倒過來就得到 \\(${dividend} \\div ${paren(d)} = ${q}\\)。<br>` +
        `被除數與除數<strong>${same ? '同號' : '異號'}</strong>，商為<strong>${same ? '正數' : '負數'}</strong>；` +
        `數字部分則是 \\(${Math.abs(dividend)} \\div ${Math.abs(d)} = ${Math.abs(q)}\\)。`
      );
    }
    typeset([feedbackDiv]);

    // ===== Canvas 繪圖：三個數值方塊 + 乘除雙向箭頭 =====
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const boxW = 118;
    const boxH = 62;
    const y = 84;
    const positions = [
      { x: 40, label: '被除數', value: dividend, color: '#8b5cf6' },
      { x: (w - boxW) / 2, label: '除數', value: d, color: '#06b6d4' },
      { x: w - boxW - 40, label: '商', value: q, color: '#fbbf24' }
    ];

    positions.forEach(p => {
      // 圓角框
      ctx.beginPath();
      const r = 14;
      ctx.moveTo(p.x + r, y);
      ctx.arcTo(p.x + boxW, y, p.x + boxW, y + boxH, r);
      ctx.arcTo(p.x + boxW, y + boxH, p.x, y + boxH, r);
      ctx.arcTo(p.x, y + boxH, p.x, y, r);
      ctx.arcTo(p.x, y, p.x + boxW, y, r);
      ctx.closePath();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fill();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.color;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 反光高光
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x + 14, y + 6);
      ctx.lineTo(p.x + boxW - 14, y + 6);
      ctx.stroke();

      // 標題
      ctx.fillStyle = p.color;
      ctx.font = 'bold 13px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(p.label, p.x + boxW / 2, y - 8);

      // 數值
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Outfit, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${p.value}`, p.x + boxW / 2, y + boxH / 2);
    });

    // 乘法箭頭（下方，由 商 x 除數 -> 被除數）
    const arrowY = y + boxH + 34;
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(positions[2].x + boxW / 2, y + boxH + 6);
    ctx.lineTo(positions[2].x + boxW / 2, arrowY);
    ctx.lineTo(positions[0].x + boxW / 2, arrowY);
    ctx.lineTo(positions[0].x + boxW / 2, y + boxH + 6);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(251, 191, 36, 0.75)';
    ctx.beginPath();
    ctx.moveTo(positions[0].x + boxW / 2, y + boxH + 4);
    ctx.lineTo(positions[0].x + boxW / 2 - 5, y + boxH + 14);
    ctx.lineTo(positions[0].x + boxW / 2 + 5, y + boxH + 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('乘法：商 × 除數 = 被除數', w / 2, arrowY - 6);

    // 除法箭頭（上方，由 被除數 ÷ 除數 -> 商）
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(positions[0].x + boxW / 2, y - 30);
    ctx.lineTo(positions[2].x + boxW / 2, y - 30);
    ctx.stroke();

    ctx.fillStyle = 'rgba(139, 92, 246, 0.8)';
    ctx.beginPath();
    ctx.moveTo(positions[2].x + boxW / 2, y - 30);
    ctx.lineTo(positions[2].x + boxW / 2 - 9, y - 34.5);
    ctx.lineTo(positions[2].x + boxW / 2 - 9, y - 25.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#c4b5fd';
    ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('除法：被除數 ÷ 除數 = 商', w / 2, y - 36);
  }

  sliderQ.addEventListener('input', draw);
  sliderD.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   6. 重點 4：四則運算逐步拆解器
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
        '\\(5 \\times 12 - 30 \\div (-5)\\)',
        '\\(= 60 - 30 \\div (-5)\\)',
        '\\(= 60 - (-6)\\)',
        '\\(= 60 + 6\\)',
        '\\(= 66\\)'
      ],
      notes: [
        '式子中同時有乘、除、減。依規則要<strong>先算乘除，再算加減</strong>。',
        '先算乘法 \\(5 \\times 12 = 60\\)。',
        '再算除法 \\(30 \\div (-5) = -6\\)（異號相除得負）。',
        '乘除都算完了，才處理減法。<strong>減一個負數等於加上它的相反數</strong>。',
        '最後得到 \\(66\\)。注意這裡不可以直接寫成 \\(60 - 6\\)！'
      ]
    },
    {
      lines: [
        '\\((-60) \\div [(-7) \\times 2 - 1]\\)',
        '\\(= (-60) \\div [-14 - 1]\\)',
        '\\(= (-60) \\div (-15)\\)',
        '\\(= 4\\)'
      ],
      notes: [
        '有括號時<strong>括號內先算</strong>，而且中括號裡面也要遵守「先乘除後加減」。',
        '先算中括號內的乘法 \\((-7) \\times 2 = -14\\)。',
        '再算中括號內的減法 \\(-14 - 1 = -15\\)，括號處理完畢。',
        '最後做除法：同號相除得正，\\((-60) \\div (-15) = 4\\)。'
      ]
    },
    {
      lines: [
        '\\(|8 \\times (-2) - 5| \\div 7 \\times (-3)\\)',
        '\\(= |-16 - 5| \\div 7 \\times (-3)\\)',
        '\\(= |-21| \\div 7 \\times (-3)\\)',
        '\\(= 21 \\div 7 \\times (-3)\\)',
        '\\(= 3 \\times (-3)\\)',
        '\\(= -9\\)'
      ],
      notes: [
        '算式中有絕對值，要<strong>先處理絕對值內部</strong>的運算，再做其他運算。',
        '絕對值內先算乘法 \\(8 \\times (-2) = -16\\)。',
        '絕對值內再算減法 \\(-16 - 5 = -21\\)。',
        '取絕對值：\\(|-21| = 21\\)，<strong>取出後必為非負數</strong>。',
        '剩下只有乘除，<strong>由左而右</strong>先算 \\(21 \\div 7 = 3\\)。',
        '最後 \\(3 \\times (-3) = -9\\)（異號相乘得負）。'
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
   7. 重點 5：分配律面積模型
   ========================================================================== */
function initDistributeCanvas() {
  const canvas = document.getElementById('canvas-distribute');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderA = document.getElementById('dis-a-slider');
  const sliderB = document.getElementById('dis-b-slider');
  const sliderC = document.getElementById('dis-c-slider');
  const valA = document.getElementById('dis-a-val');
  const valB = document.getElementById('dis-b-val');
  const valC = document.getElementById('dis-c-val');
  const formulaDiv = document.getElementById('distribute-formula');
  const feedbackDiv = document.getElementById('distribute-feedback');

  function draw() {
    const a = parseInt(sliderA.value, 10);
    const b = parseInt(sliderB.value, 10);
    const c = parseInt(sliderC.value, 10);

    valA.textContent = a;
    valB.textContent = b;
    valC.textContent = c;

    const left = (a + b) * c;
    const right = a * c + b * c;

    // 等號與加號各自起一段 \( \)，用零寬的 <wbr> 接起來，讓窄螢幕可以在運算子前換行
    // （整串一段時 414px 下溢出 46px）
    formulaDiv.innerHTML =
      `\\((${a} + ${b}) \\times ${c}\\)<wbr>` +
      `\\({}= ${a} \\times ${c}\\)<wbr>` +
      `\\({}+ ${b} \\times ${c}\\) ` +
      `\\(\\Rightarrow\\) <span style="color:#f472b6; font-size:1.35rem; text-shadow: 0 0 10px rgba(255,255,255,0.2)">\\(${left}\\)</span>`;
    typeset([formulaDiv]);

    // 回饋區的兩條算式同樣要斷段：整條包成一段時 414px 下會撐出一根捲軸
    feedbackDiv.innerHTML = wrapFeedback(
      `<strong>分開算</strong>：` +
      wbrEq(`${a} \\times ${c} + ${b} \\times ${c} = ${a * c} + ${b * c} = ${right}`) + `；` +
      `<strong>合起來算</strong>：` +
      wbrEq(`(${a} + ${b}) \\times ${c} = ${a + b} \\times ${c} = ${left}`) + `。<br>` +
      `兩種算法的面積<strong>完全相同</strong>，這就是乘法對加法的分配律。`
    );
    typeset([feedbackDiv]);

    // ===== Canvas 繪圖 =====
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 每單位的像素隨 a、b、c 自動調整，讓圖形盡量放大又不會超出畫布
    const availW = w - 96;   // 左側留給高度標示、右側留邊
    const availH = 190;      // 矩形區可用高度（下方三行結論固定貼齊底部）
    const topPad = 44;       // 上方留給寬度標示
    const unit = Math.min(44, availW / (a + b), availH / c);
    const wA = a * unit;
    const wB = b * unit;
    const hC = c * unit;
    const originX = Math.max(50, (w - (wA + wB)) / 2);   // 水平置中
    const originY = topPad + (availH - hC) / 2;          // 於上方區塊垂直置中

    // 區塊 A（a x c）
    ctx.fillStyle = 'rgba(236, 72, 153, 0.28)';
    ctx.fillRect(originX, originY, wA, hC);
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ec4899';
    ctx.strokeRect(originX, originY, wA, hC);
    ctx.shadowBlur = 0;

    // 區塊 B（b x c）
    ctx.fillStyle = 'rgba(139, 92, 246, 0.28)';
    ctx.fillRect(originX + wA, originY, wB, hC);
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#8b5cf6';
    ctx.strokeRect(originX + wA, originY, wB, hC);
    ctx.shadowBlur = 0;

    // 反光高光
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(originX + 4, originY + 4);
    ctx.lineTo(originX + wA + wB - 4, originY + 4);
    ctx.stroke();

    // 區塊內的面積數字
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.fillText(`${a * c}`, originX + wA / 2, originY + hC / 2);
    ctx.fillText(`${b * c}`, originX + wA + wB / 2, originY + hC / 2);

    // 上方寬度標示
    const topY = originY - 18;
    function dimLineH(x1, x2, y, color, label) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
      // 兩端小豎線
      ctx.beginPath();
      ctx.moveTo(x1, y - 4); ctx.lineTo(x1, y + 4);
      ctx.moveTo(x2, y - 4); ctx.lineTo(x2, y + 4);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, (x1 + x2) / 2, y - 5);
    }

    dimLineH(originX, originX + wA, topY, '#f472b6', `a = ${a}`);
    dimLineH(originX + wA, originX + wA + wB, topY, '#c4b5fd', `b = ${b}`);

    // 左側高度標示
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(originX - 16, originY);
    ctx.lineTo(originX - 16, originY + hC);
    ctx.moveTo(originX - 20, originY); ctx.lineTo(originX - 12, originY);
    ctx.moveTo(originX - 20, originY + hC); ctx.lineTo(originX - 12, originY + hC);
    ctx.stroke();

    ctx.save();
    ctx.translate(originX - 26, originY + hC / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#67e8f9';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`c = ${c}`, 0, 0);
    ctx.restore();

    // 下方結論：固定貼齊畫布底部，不隨矩形大小浮動
    const noteY = h - 86;
    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${a} × ${c} + ${b} × ${c} = ${a * c} + ${b * c} = ${right}`, w / 2, noteY);

    ctx.fillStyle = '#c4b5fd';
    ctx.fillText(`(${a} + ${b}) × ${c} = ${a + b} × ${c} = ${left}`, w / 2, noteY + 25);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 15px "Noto Sans TC", sans-serif';
    ctx.fillText('兩塊分開算 = 合起來一次算', w / 2, noteY + 52);
  }

  sliderA.addEventListener('input', draw);
  sliderB.addEventListener('input', draw);
  sliderC.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   8. 重點 6：骰子走棋數線模擬器
   ========================================================================== */
function initDiceCanvas() {
  const canvas = document.getElementById('canvas-dice');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderK = document.getElementById('dice-k-slider');
  const valK = document.getElementById('dice-k-val');
  const formulaDiv = document.getElementById('dice-formula');
  const feedbackDiv = document.getElementById('dice-feedback');

  const TOTAL = 10;
  const RIGHT_STEP = 5;
  const LEFT_STEP = -4;

  function draw() {
    const k = parseInt(sliderK.value, 10); // 偶數點次數
    const m = TOTAL - k;                   // 奇數點次數
    const rightMove = RIGHT_STEP * k;
    const leftMove = LEFT_STEP * m;
    const pos = rightMove + leftMove;

    valK.textContent = `${k} 次（奇數點 ${m} 次）`;

    formulaDiv.innerHTML =
      `\\(0 + 5 \\times ${k} + (-4) \\times ${m} = \\) ` +
      `<span style="color: ${signColor(pos)}; font-size: 1.5rem; text-shadow: 0 0 10px rgba(255,255,255,0.2)">\\(${pos}\\)</span>`;
    typeset([formulaDiv]);

    feedbackDiv.innerHTML = wrapFeedback(
      `偶數點 <strong>${k}</strong> 次，共往右移 \\(5 \\times ${k} = ${rightMove}\\)；` +
      `奇數點 <strong>${m}</strong> 次，共往左移 \\((-4) \\times ${m} = ${leftMove}\\)。<br>` +
      `棋子最後停在坐標 <strong>${pos}</strong>` +
      `${pos === 0 ? '（恰好回到原點）' : (pos > 0 ? '（在原點右側）' : '（在原點左側）')}。`
    );
    typeset([feedbackDiv]);

    // ===== Canvas 繪圖 =====
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const centerY = h - 58;
    const padding = 26;
    const minV = -40, maxV = 50;
    const scale = (w - padding * 2) / (maxV - minV);
    const toX = v => padding + (v - minV) * scale;

    // 數線本體（僅右側單向箭頭，左側為無箭頭平直線）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(toX(minV - 0.5), centerY);
    ctx.lineTo(toX(maxV - 0.6), centerY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(toX(maxV + 0.5), centerY);
    ctx.lineTo(toX(maxV - 0.7), centerY - 6);
    ctx.lineTo(toX(maxV - 0.7), centerY + 6);
    ctx.closePath();
    ctx.fill();

    // 刻度
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = minV; i <= maxV; i += 2) {
      const cx = toX(i);
      const isZero = i === 0;
      const major = i % 10 === 0;
      ctx.strokeStyle = isZero ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = isZero ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx, centerY - (isZero ? 8 : 4));
      ctx.lineTo(cx, centerY + (isZero ? 8 : 4));
      ctx.stroke();

      if (major) {
        ctx.fillStyle = isZero ? '#fff' : 'rgba(255,255,255,0.7)';
        ctx.font = isZero ? 'bold 14px Outfit, sans-serif' : 'bold 13px Outfit, sans-serif';
        ctx.fillText(i, cx, centerY + 12);
      }
    }

    // 往右的總位移
    const rightY = centerY - 34;
    if (rightMove !== 0) {
      drawMoveArrow(ctx, toX(0), toX(rightMove), rightY, '#f43f5e', `偶數點 ${k} 次：+${rightMove}`);
    }

    // 往左的總位移（接續在右移之後）
    const leftY = centerY - 68;
    if (leftMove !== 0) {
      drawMoveArrow(ctx, toX(rightMove), toX(pos), leftY, '#06b6d4', `奇數點 ${m} 次：${leftMove}`);

      // 連接虛線
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(toX(rightMove), rightY);
      ctx.lineTo(toX(rightMove), leftY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 棋子
    const px = toX(pos);
    ctx.fillStyle = '#fbbf24';
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#fbbf24';
    ctx.beginPath();
    ctx.arc(px, centerY - 9, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px - 7, centerY);
    ctx.quadraticCurveTo(px, centerY - 6, px + 7, centerY);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${pos}`, px, centerY + 26);
  }

  function drawMoveArrow(ctx, x1, x2, y, color, label) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();

    const dir = x2 >= x1 ? 1 : -1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y);
    ctx.lineTo(x2 - dir * 9, y - 5);
    ctx.lineTo(x2 - dir * 9, y + 5);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, (x1 + x2) / 2, y - 8);
  }

  sliderK.addEventListener('input', draw);
  draw();
}
