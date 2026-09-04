document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quiz System
  initQuizSystem();

  // Initialize Canvas Simulations
  initAdditionCanvas();
  initRegroupCanvas();
  initThermometerCanvas();
  initBracketCanvas();
  initAbsCanvas();
  initDistanceCanvas();
});
/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');
  
  // Correct answers mapping for Section 1-2 (12 Quizzes)
  const answers = {
    '1-2-1-1': 'A', // Q1. (-8)+(-6) = -14
    '1-2-1-2': 'B', // Q2. (-15)+9 = -6
    '1-2-2-1': 'A', // Q3. (-34)+2508+(-66) = 2408
    '1-2-2-2': 'D', // Q4. 245+(-87)+(-245) = -87
    '1-2-3-1': 'A', // Q5. 142-(-58) = 200
    '1-2-3-2': 'D', // Q6. (-45)-35 = -80
    '1-2-4-1': 'C', // Q7. 388-(475+388) = -475
    '1-2-4-2': 'C', // Q8. -(x-y) = -x+y = y-x
    '1-2-5-1': 'B', // Q9. |-35|-|-85|-12 = -62
    '1-2-5-2': 'C', // Q10. 40+|(-56)+16|-15 = 65
    '1-2-6-1': 'D', // Q11. CD distance = 11
    '1-2-6-2': 'A'  // Q12. Midpoint = 2
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
        
        // Remove 'selected' class from all labels in this card
        optionLabels.forEach(lbl => lbl.classList.remove('selected'));
        // Add 'selected' class to the parent label of selected radio
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

      // Disable all radio buttons in this quiz card
      radios.forEach(r => r.setAttribute('disabled', true));
      btn.setAttribute('disabled', true);
      btn.textContent = '已完成作答';

      // Style correct / incorrect options
      optionLabels.forEach(lbl => {
        const rad = lbl.querySelector('input[type="radio"]');
        if (rad.value === correctAns) {
          lbl.classList.add('correct');
        } else if (rad.checked) {
          lbl.classList.add('incorrect');
        }
      });

      // Show explanation box with feedback
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
function getMouseX(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const clientX = (e.touches && e.touches.length > 0) 
    ? e.touches[0].clientX 
    : ((e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientX : e.clientX);
  const relativeX = clientX - rect.left;
  return relativeX * (canvas.width / rect.width);
}

function getMouseY(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const clientY = (e.touches && e.touches.length > 0) 
    ? e.touches[0].clientY 
    : ((e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientY : e.clientY);
  const relativeY = clientY - rect.top;
  return relativeY * (canvas.height / rect.height);
}

/* ==========================================================================
   3. Concept 1: Integer Addition on Number Line
   ========================================================================== */
function initAdditionCanvas() {
  const canvas = document.getElementById('canvas-addition');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const sliderA = document.getElementById('add-a-slider');
  const sliderB = document.getElementById('add-b-slider');
  const valASpan = document.getElementById('add-a-val');
  const valBSpan = document.getElementById('add-b-val');
  const formulaDiv = document.getElementById('addition-formula');
  const feedbackDiv = document.getElementById('addition-feedback');

  function drawAdditionLine() {
    const a = parseInt(sliderA.value);
    const b = parseInt(sliderB.value);
    const result = a + b;

    // Update text
    valASpan.textContent = a > 0 ? `+${a}` : `${a}`;
    valBSpan.textContent = b > 0 ? `+${b}` : `${b}`;
    
    // Color coded formula
    const aStr = a; // first term does not need parentheses
    const bStr = b < 0 ? `(${b})` : `${b}`;
    const resStr = result; // final result never needs parentheses
    
    const aColor = a >= 0 ? '#fda4af' : '#60a5fa';
    const bColor = b >= 0 ? '#fda4af' : '#60a5fa';
    const resColor = result >= 0 ? '#fda4af' : '#60a5fa';
    const aVal = a < 0 ? `(${a})` : `${a}`; // keep parentheses in general formatting representation if needed, but wait! aStr is just a.
    // We write standard LaTeX:
    formulaDiv.innerHTML = `<span style="color: ${aColor}">\\(${a}\\)</span> \\(+\\) <span style="color: ${bColor}">\\(${bStr}\\)</span> \\(=\\) <span style="color: ${resColor}; font-size: 1.5rem; text-shadow: 0 0 10px rgba(255,255,255,0.2)">\\(${resStr}\\)</span>`;
    if (window.MathJax) {
      MathJax.typesetPromise([formulaDiv]).catch(err => console.log(err));
    }

    // Context explanation
    if (a === 0 && b === 0) {
      feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;">起點在 0，未進行任何移動，結果為 0。</div>`;
    } else if (a * b > 0) {
      // Same sign
      if (a > 0) {
        feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;"><strong>同正數相加</strong>：先向右移動 ${a} 單位，再向右移動 ${b} 單位，共向右移動 ${a + b} 單位。結果為正數。</div>`;
      } else {
        feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;"><strong>同負數相加</strong>：先向左移動 ${Math.abs(a)} 單位，再向左移動 ${Math.abs(b)} 單位，共向左移動 ${Math.abs(a + b)} 單位。結果為負數。</div>`;
      }
    } else if (a * b < 0) {
      // Different sign
      if (a === -b) {
        feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;"><strong>相反數相加</strong>：兩次移動方向相反、距離相等，完全相互抵消！結果為 0。</div>`;
      } else {
        const big = Math.abs(a) > Math.abs(b) ? a : b;
        if (big > 0) {
          feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;"><strong>異號數相加</strong>：正數的絕對值較大，抵消後共向右移動了 ${Math.abs(result)} 單位。結果為正數。</div>`;
        } else {
          feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;"><strong>異號數相加</strong>：負數的絕對值較大，抵消後共向左移動了 ${Math.abs(result)} 單位。結果為負數。</div>`;
        }
      }
    } else {
      // One is zero
      const nonZero = a === 0 ? b : a;
      feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;">與 0 相加：任何數與 0 相加，其結果皆保持不變（仍為 ${nonZero}）。</div>`;
    }

    // Canvas drawing
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const centerY = h - 60;
    const padding = 30;
    const range = 40; // Draw from -20 to 20
    const scale = (w - padding * 2) / range;

    // Math scale function: maps math coordinates [-20, 20] to canvas X
    function getCanvasX(val) {
      return padding + (val + 20) * scale;
    }

    // 1. Draw Number Line (Right arrow only, left is a flat end, per Taiwanese junior high definition)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(getCanvasX(-20.5), centerY);
    ctx.lineTo(getCanvasX(20.2), centerY);
    ctx.stroke();

    // Single right directional arrow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(getCanvasX(20.5), centerY);
    ctx.lineTo(getCanvasX(20.1), centerY - 6);
    ctx.lineTo(getCanvasX(20.1), centerY + 6);
    ctx.closePath();
    ctx.fill();

    // 2. Draw Ticks & Numbers
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = -20; i <= 20; i++) {
      const cx = getCanvasX(i);
      ctx.strokeStyle = i === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = i === 0 ? 2 : 1;
      
      // Tick mark
      ctx.beginPath();
      ctx.moveTo(cx, centerY - (i === 0 ? 8 : 4));
      ctx.lineTo(cx, centerY + (i === 0 ? 8 : 4));
      ctx.stroke();

      // Number Label（-20～20 共 41 格，每 5 格標一次才不會擠在一起）
      if (i % 5 === 0) {
        ctx.fillStyle = i === 0 ? '#fff' : 'rgba(255,255,255,0.7)';
        ctx.font = i === 0 ? 'bold 16px Outfit, sans-serif' : 'bold 15px Outfit, sans-serif';
        ctx.fillText(i, cx, centerY + 12);
      }
    }

    // 3. Draw Arrow A: 0 -> a
    if (a !== 0) {
      const axStart = getCanvasX(0);
      const axEnd = getCanvasX(a);
      const arrowY = centerY - 45;
      
      ctx.strokeStyle = a > 0 ? '#f43f5e' : '#06b6d4'; // rose (positive) vs cyan (negative)
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = ctx.strokeStyle;
      
      ctx.beginPath();
      ctx.moveTo(axStart, arrowY);
      ctx.lineTo(axEnd, arrowY);
      ctx.stroke();
      
      // Arrow head for A
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(axEnd, arrowY);
      const headSize = 5;
      const dir = a > 0 ? 1 : -1;
      ctx.lineTo(axEnd - dir * 8, arrowY - headSize);
      ctx.lineTo(axEnd - dir * 8, arrowY + headSize);
      ctx.closePath();
      ctx.fill();
      
      // Label A
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.fillText(`a: ${a > 0 ? '+' : ''}${a}`, (axStart + axEnd) / 2, arrowY - 22);
    }

    // 4. Draw Arrow B: a -> a + b
    if (b !== 0) {
      const bxStart = getCanvasX(a);
      const bxEnd = getCanvasX(result);
      const arrowY = centerY - 85;
      
      ctx.strokeStyle = b > 0 ? '#ec4899' : '#3b82f6'; // pink (positive) vs blue (negative)
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = ctx.strokeStyle;
      
      ctx.beginPath();
      ctx.moveTo(bxStart, arrowY);
      ctx.lineTo(bxEnd, arrowY);
      ctx.stroke();
      
      // Arrow head for B
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(bxEnd, arrowY);
      const headSize = 5;
      const dir = b > 0 ? 1 : -1;
      ctx.lineTo(bxEnd - dir * 8, arrowY - headSize);
      ctx.lineTo(bxEnd - dir * 8, arrowY + headSize);
      ctx.closePath();
      ctx.fill();

      // Connector line from Arrow A tip up to Arrow B tail
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(bxStart, centerY - 45);
      ctx.lineTo(bxStart, arrowY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Label B
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.fillText(`b: ${b > 0 ? '+' : ''}${b}`, (bxStart + bxEnd) / 2, arrowY - 22);
    }

    // 5. Draw final result projection line down to number line
    if (result !== 0) {
      const rx = getCanvasX(result);
      ctx.strokeStyle = result > 0 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(rx, centerY - 85);
      ctx.lineTo(rx, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw highlighted circle at the result point
      ctx.fillStyle = result > 0 ? '#f43f5e' : '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath();
      ctx.arc(rx, centerY, 6, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Bind sliders
  sliderA.addEventListener('input', drawAdditionLine);
  sliderB.addEventListener('input', drawAdditionLine);
  
  // Initial draw
  drawAdditionLine();
}

/* ==========================================================================
   4. Concept 2: Thermometer Subtraction Simulator
   ========================================================================== */
function initThermometerCanvas() {
  const canvas = document.getElementById('canvas-thermometer');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const sliderStart = document.getElementById('temp-start');
  const sliderEnd = document.getElementById('temp-end');
  
  const labelStart = document.getElementById('sub-start-val');
  const labelEnd = document.getElementById('sub-end-val');
  const labelDiff = document.getElementById('sub-diff-val');
  const formulaDiv = document.getElementById('subtraction-formula');
  const feedbackDiv = document.getElementById('subtraction-feedback');

  function drawThermometer() {
    const start = parseInt(sliderStart.value);
    const end = parseInt(sliderEnd.value);
    const diff = end - start;

    // Update UI text
    labelStart.textContent = start > 0 ? `+${start}°C` : `${start}°C`;
    labelEnd.textContent = end > 0 ? `+${end}°C` : `${end}°C`;
    labelDiff.textContent = diff > 0 ? `+${diff}°C` : `${diff}°C`;

    // Sign formatted string
    // 括號只在負數時才加：那是為了隔開運算符號與性質符號，
    // 正數包括號會跟本節要教的規則對不上（開發約束 27）
    const startStr = start < 0 ? `(${start})` : `${start}`;
    const endStr = end; // first term does not need parentheses
    const diffStr = diff; // final result never needs parentheses
    const oppStr = (-start) < 0 ? `(${ -start })` : `${ -start }`;

    formulaDiv.innerHTML = `<span style="color: #fbbf24">\\(${endStr}\\)</span> \\(-\\) <span style="color: #60a5fa">\\(${startStr}\\)</span> \\(=\\) <span style="color: #10b981; font-size:1.4rem;">\\(${diffStr}\\)</span><br>
    <span style="font-size: 0.9rem; color: var(--text-muted);">相當於加相反數：</span><span style="color: #fbbf24">\\(${endStr}\\)</span> \\(+\\) <span style="color: #f43f5e">\\(${oppStr}\\)</span> \\(=\\) <span style="color: #10b981;">\\(${diffStr}\\)</span>`;
    if (window.MathJax) {
      MathJax.typesetPromise([formulaDiv]).catch(err => console.log(err));
    }

    // Interactive feedback context
    if (diff > 0) {
      feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;">溫度從 ${start}°C 上升到 ${end}°C，一共<strong>升高 ${diff}°C</strong>。減法算式為 \\(${end} - ${startStr} = ${diff}\\)，等同於 \\(${end} + ${oppStr} = ${diff}\\)。</div>`;
    } else if (diff < 0) {
      feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;">溫度從 ${start}°C 下降到 ${end}°C，一共<strong>降低 ${Math.abs(diff)}°C</strong>。減法算式為 \\(${end} - ${startStr} = ${diff}\\)，等同於 \\(${end} + ${oppStr} = ${diff}\\)。</div>`;
    } else {
      feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;">溫度未改變。變化量為 0°C。</div>`;
    }

    // Render LaTeX inside feedback
    if (window.MathJax) {
      MathJax.typesetPromise([feedbackDiv]).catch((err) => console.log(err));
    }

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Thermometer Layout
    const tubeX = w / 2 - 20; // shifted left to make space for change arrows on right
    const bulbY = h - 45;
    const bulbRadius = 18;
    const tubeWidth = 12;
    const tubeTopY = 25;

    // Draw thermometer background casing
    ctx.beginPath();
    const angle = Math.asin((tubeWidth / 2) / bulbRadius);
    ctx.arc(tubeX, tubeTopY + tubeWidth / 2, tubeWidth / 2, Math.PI, 0);
    ctx.lineTo(tubeX + tubeWidth / 2, bulbY - bulbRadius * Math.cos(angle));
    ctx.arc(tubeX, bulbY, bulbRadius, -Math.PI / 2 + angle, Math.PI * 1.5 - angle);
    ctx.lineTo(tubeX - tubeWidth / 2, tubeTopY + tubeWidth / 2);
    ctx.closePath();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Calculations for layout scale
    const maxTemp = 20;
    const minTemp = -20;
    const range = maxTemp - minTemp;
    const scaleHeight = bulbY - bulbRadius - 10 - tubeTopY;
    
    function getTempY(tempVal) {
      const pct = (tempVal - minTemp) / range;
      return (bulbY - bulbRadius - 10) - (pct * scaleHeight);
    }

    // Draw grid ticks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '10px Outfit';

    for (let t = minTemp; t <= maxTemp; t += 5) {
      const ty = getTempY(t);
      
      // left ticks
      ctx.strokeStyle = t === 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.moveTo(tubeX - tubeWidth / 2 - 5, ty);
      ctx.lineTo(tubeX - tubeWidth / 2, ty);
      ctx.stroke();

      // right ticks
      ctx.beginPath();
      ctx.moveTo(tubeX + tubeWidth / 2, ty);
      ctx.lineTo(tubeX + tubeWidth / 2 + 5, ty);
      ctx.stroke();

      // Label on the left
      ctx.fillStyle = t === 0 ? '#fff' : (t > 0 ? '#f87171' : '#60a5fa');
      ctx.fillText(`${t > 0 ? '+' : ''}${t}`, tubeX - tubeWidth / 2 - 10, ty);
    }

    // Draw start/end temperature levels inside tube
    const yStart = getTempY(start);
    const yEnd = getTempY(end);

    // Draw mercury liquid up to End Temperature
    ctx.fillStyle = '#f43f5e'; // red liquid
    ctx.beginPath();
    ctx.arc(tubeX, bulbY, bulbRadius - 4, 0, Math.PI * 2);
    ctx.fill();

    const fillTopY = yEnd;
    ctx.fillRect(tubeX - tubeWidth / 2 + 2.5, fillTopY, tubeWidth - 5, bulbY - bulbRadius - fillTopY + 5);

    // Draw a mark line for "Start Temperature"
    ctx.strokeStyle = '#38bdf8'; // light blue for start
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tubeX - tubeWidth / 2 - 2, yStart);
    ctx.lineTo(tubeX + tubeWidth / 2 + 2, yStart);
    ctx.stroke();

    // High contrast indicator text on the left/inside
    ctx.font = 'bold 9px Noto Sans TC';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText('原來', tubeX + tubeWidth / 2 + 8, yStart);
    
    ctx.fillStyle = '#f87171';
    ctx.fillText('最後', tubeX + tubeWidth / 2 + 8, yEnd);

    // Draw Change Vector Arrow on the right
    const arrowX = tubeX + 55;
    ctx.strokeStyle = diff >= 0 ? '#10b981' : '#f43f5e'; // Green for rise, red/rose for drop
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(arrowX, yStart);
    ctx.lineTo(arrowX, yEnd);
    ctx.stroke();

    // Arrow tip
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(arrowX, yEnd);
    const arrowDir = diff >= 0 ? -1 : 1;
    ctx.lineTo(arrowX - 5, yEnd - arrowDir * 6);
    ctx.lineTo(arrowX + 5, yEnd - arrowDir * 6);
    ctx.closePath();
    ctx.fill();

    // Text label for difference
    ctx.font = 'bold 12px Outfit';
    ctx.fillStyle = ctx.strokeStyle;
    ctx.textAlign = 'left';
    ctx.fillText(`${diff > 0 ? '+' : ''}${diff}°C`, arrowX + 8, (yStart + yEnd) / 2);
  }

  sliderStart.addEventListener('input', drawThermometer);
  sliderEnd.addEventListener('input', drawThermometer);

  drawThermometer();
}

/* ==========================================================================
   5. Concept 3: Parental removal/bracket dynamic explorer
   ========================================================================== */
function initBracketCanvas() {
  // 只收自己這一組的按鈕。.bracket-btn 這個 class 已經被重點 2、重點 5
  // 的模式按鈕共用（只為了共用樣式），用 class 選會把它們一起收走——
  // 點重點 2 會清掉這裡的選取並把畫面重置回第一種情形
  const btns = document.querySelectorAll('[data-bracket-mode]');
  const formulaBox = document.getElementById('bracket-formula');
  const bracketExplanation = document.getElementById('bracket-canvas-feedback');

  if (btns.length === 0 || !formulaBox) return;

  function updateBracketExplorer(id) {
    let prefix = '+';
    let val1 = -5;
    let val2 = 3;
    
    if (id === 'b-btn2') {
      prefix = '－';
      val1 = -5;
      val2 = 3;
    } else if (id === 'b-btn3') {
      prefix = '+';
      val1 = 5;
      val2 = -3;
    } else if (id === 'b-btn4') {
      prefix = '－';
      val1 = 5;
      val2 = -3;
    }

    // Expanded formula values
    let term1Val = 0;
    let term2Val = 0;
    let explText = '';

    if (prefix === '+') {
      term1Val = val1;
      term2Val = val2;
      explText = `<strong>括號前面是「＋」號</strong>：直接去括號，括號內各項的<strong>性質符號皆保持不變</strong>：即 \\(10 + (a + b)\\)<wbr>\\({}= 10 + a + b\\)。`;
    } else {
      term1Val = -val1;
      term2Val = -val2;
      explText = `<strong>括號前面是「－」號</strong>：去括號時必須<strong>變號</strong>，括號內的「＋」變「－」，「－」變「＋」：即 \\(10 - (a + b)\\)<wbr>\\({}= 10 - a - b\\)。`;
    }

    const val1Str = val1; // first term inside parentheses does not need a leading plus
    const val2Str = val2 >= 0 ? `+${val2}` : `${val2}`;
    
    // Format expanded strings
    const term1Str = term1Val >= 0 ? `+ ${term1Val}` : `- ${Math.abs(term1Val)}`;
    const term2Str = term2Val >= 0 ? `+ ${term2Val}` : `- ${Math.abs(term2Val)}`;

    const fullResultVal = 10 + (prefix === '+' ? (val1 + val2) : -(val1 + val2));

    // Render formulas fully inside MathJax LaTeX
    const opChar = prefix === '－' ? '-' : '+';
    formulaBox.innerHTML = `
      <div style="margin-bottom: 0.75rem;">原始算式：\\( 10 ${opChar} (${val1Str} ${val2Str}) \\)</div>
      <div style="font-size: 1.15rem; color: rgba(255,255,255,0.4); margin-bottom: 0.75rem;"><i class="fa-solid fa-arrow-down"></i> 去括號展開 <i class="fa-solid fa-arrow-down"></i></div>
      <div>展開結果：\\( 10 ${term1Str} ${term2Str} = \\) <span style="color: #fbbf24; font-size:1.5rem;">\\(${fullResultVal}\\)</span></div>
    `;

    bracketExplanation.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;">${explText}</div>`;

    if (window.MathJax) {
      MathJax.typesetPromise([formulaBox, bracketExplanation]).catch(err => console.log(err));
    }
  }

  // Click bindings
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateBracketExplorer(btn.dataset.bracketMode);
    });
  });

  // Initial load
  updateBracketExplorer('b-btn1');
}

/* ==========================================================================
   6. Concept 4: Distance & Midpoint on Number Line (Draggable)
   ========================================================================== */
function initDistanceCanvas() {
  const canvas = document.getElementById('canvas-distance');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const distanceFormulaDiv = document.getElementById('distance-formula');
  const midpointFormulaDiv = document.getElementById('midpoint-formula');
  const feedbackDiv = document.getElementById('distance-feedback');

  // Interactive coordinates in math space
  let a = -5;
  let b = 7;
  
  let isDraggingA = false;
  let isDraggingB = false;

  const w = canvas.width;
  const h = canvas.height;
  
  const centerY = h - 60;
  const padding = 40;
  const range = 30; // Maps -15 to 15
  const scale = (w - padding * 2) / range;

  function getCanvasX(val) {
    return padding + (val + 15) * scale;
  }

  function getMathVal(cx) {
    const rawVal = (cx - padding) / scale - 15;
    return Math.max(-15, Math.min(15, Math.round(rawVal)));
  }

  function drawDistanceLine() {
    // 1. Calculations
    const distance = Math.abs(a - b);
    const midpoint = (a + b) / 2;

    // Update text formulas
    const aStr = a; // first term does not need parentheses
    const bStr = b < 0 ? `(${b})` : `${b}`;
    
    // 每一個等號各自起一段 \( \)（`{}` 讓等號維持關係運算子的字距），中間用零寬的 <wbr> 接起來，
    // 讓窄螢幕可以在等號前換行；整條包成一段時 mjx-container 不折行，414px 下會溢出上百 px。
    // 接合用 <wbr> 而不是空白，寬螢幕的排版才跟原本逐像素相同
    distanceFormulaDiv.innerHTML = `距離 \\( \\overline{AB} = |a - b| \\)<wbr>\\({}= | ${a} - ${bStr} | \\)<wbr>\\({}= | ${a-b} | \\)<wbr>\\({}= \\) <span style="color:#fbbf24; font-size:1.35rem; font-weight:700;">\\(${distance}\\)</span>`;
    midpointFormulaDiv.innerHTML = `中點 \\( M = \\frac{a + b}{2} \\)<wbr>\\({}= \\frac{${a} + ${bStr}}{2} \\)<wbr>\\({}= \\) <span style="color:#10b981; font-size:1.35rem; font-weight:700;">\\(${midpoint}\\)</span>`;
    
    const minVal = Math.min(a, b);
    const minStr = minVal < 0 ? `(${minVal})` : minVal;
    feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;">拖曳數線上的紅點 <strong>\\(A (${a})\\)</strong> 或藍點 <strong>\\(B (${b})\\)</strong> 觀察距離與中點變化：<br>
    兩點距離為大數減小數：\\(${Math.max(a, b)} - ${minStr} = ${distance}\\)。中點座標剛好是兩數的算術平均數。</div>`;

    if (window.MathJax) {
      MathJax.typesetPromise([distanceFormulaDiv, midpointFormulaDiv, feedbackDiv]).catch((err) => console.log(err));
    }

    // 2. Clear canvas
    ctx.clearRect(0, 0, w, h);

    // 3. Draw Number Line (Single arrow per Taiwanese guidelines)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(getCanvasX(-15.5), centerY);
    ctx.lineTo(getCanvasX(15.2), centerY);
    ctx.stroke();

    // positive arrow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(getCanvasX(15.5), centerY);
    ctx.lineTo(getCanvasX(15.1), centerY - 6);
    ctx.lineTo(getCanvasX(15.1), centerY + 6);
    ctx.closePath();
    ctx.fill();

    ctx.font = '12px Outfit';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('+', getCanvasX(15.4), centerY + 18);

    // 4. Draw Ticks
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = -15; i <= 15; i++) {
      const cx = getCanvasX(i);
      ctx.strokeStyle = i === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = i === 0 ? 2 : 1;
      
      ctx.beginPath();
      ctx.moveTo(cx, centerY - (i === 0 ? 8 : 4));
      ctx.lineTo(cx, centerY + (i === 0 ? 8 : 4));
      ctx.stroke();

      if (i % 5 === 0 || i === 0) {
        ctx.fillStyle = i === 0 ? '#fff' : 'rgba(255,255,255,0.5)';
        ctx.font = i === 0 ? 'bold 11px Outfit' : '11px Outfit';
        ctx.fillText(i, cx, centerY + 10);
      }
    }

    // 5. Draw highlighted segment AB
    const cxA = getCanvasX(a);
    const cxB = getCanvasX(b);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'; // golden glowing line
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cxA, centerY);
    ctx.lineTo(cxB, centerY);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.lineCap = 'butt'; // reset

    // 6. Draw Midpoint M
    const cxM = getCanvasX(midpoint);
    ctx.fillStyle = '#10b981'; // emerald green
    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.fillStyle;
    
    ctx.beginPath();
    ctx.arc(cxM, centerY, 5, 0, Math.PI*2);
    ctx.fill();
    
    // Label Midpoint M
    ctx.shadowBlur = 0;
    ctx.font = 'bold 11px Outfit, Noto Sans TC';
    ctx.fillText(`M (${midpoint})`, cxM, centerY - 22);
    
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cxM, centerY);
    ctx.lineTo(cxM, centerY - 8);
    ctx.stroke();

    // 7. Draw Point A
    ctx.fillStyle = '#f43f5e'; // Rose pink
    ctx.shadowBlur = 12;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(cxA, centerY, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Outer ring for interaction hint
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cxA, centerY, 10, 0, Math.PI*2);
    ctx.stroke();

    // Label A
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Outfit';
    ctx.fillText(`A (${a})`, cxA, centerY - 45);
    
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cxA, centerY);
    ctx.lineTo(cxA, centerY - 30);
    ctx.stroke();

    // 8. Draw Point B
    ctx.fillStyle = '#06b6d4'; // Cyan
    ctx.shadowBlur = 12;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(cxB, centerY, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Outer ring for B
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cxB, centerY, 10, 0, Math.PI*2);
    ctx.stroke();

    // Label B
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Outfit';
    ctx.fillText(`B (${b})`, cxB, centerY - 45);

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cxB, centerY);
    ctx.lineTo(cxB, centerY - 30);
    ctx.stroke();
  }

  // Interactive mouse/touch dragging handlers
  function handleDown(e) {
    e.preventDefault();
    const mx = getMouseX(e, canvas);
    const my = getMouseY(e, canvas);

    const cxA = getCanvasX(a);
    const cxB = getCanvasX(b);

    // Check hit within 18px radius
    const hitRadius = 18;
    const distA = Math.abs(mx - cxA);
    const distB = Math.abs(mx - cxB);
    const distY = Math.abs(my - centerY);

    if (distY < hitRadius) {
      if (distA < hitRadius && distA <= distB) {
        isDraggingA = true;
      } else if (distB < hitRadius) {
        isDraggingB = true;
      }
    }
  }

  function handleMove(e) {
    if (!isDraggingA && !isDraggingB) return;
    e.preventDefault();
    
    const mx = getMouseX(e, canvas);
    const mathVal = getMathVal(mx);

    if (isDraggingA) {
      a = mathVal;
    } else if (isDraggingB) {
      b = mathVal;
    }
    
    drawDistanceLine();
  }

  function handleUp() {
    isDraggingA = false;
    isDraggingB = false;
  }

  // Mouse listeners
  canvas.addEventListener('mousedown', handleDown);
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleUp);

  // Touch listeners
  canvas.addEventListener('touchstart', handleDown, { passive: false });
  canvas.addEventListener('touchmove', handleMove, { passive: false });
  canvas.addEventListener('touchend', handleUp);

  drawDistanceLine();
}
/* ==========================================================================
   2b. Regrouping Explorer (重點 2：加法運算規律)
   三個加數 + 三種分組法。答案永遠相同（結合律／交換律），
   差別只在好不好算——「哪一組好算」一律即時算出來，不寫死。
   字級依開發約束 13 放大：canvas 在課堂投影下只有約 0.71 倍。
   ========================================================================== */
function initRegroupCanvas() {
  const canvas = document.getElementById('canvas-regroup');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderA = document.getElementById('regroup-a');
  const sliderB = document.getElementById('regroup-b');
  const sliderC = document.getElementById('regroup-c');
  const valA = document.getElementById('regroup-a-val');
  const valB = document.getElementById('regroup-b-val');
  const valC = document.getElementById('regroup-c-val');
  const formulaDiv = document.getElementById('regroup-formula');
  const feedbackDiv = document.getElementById('regroup-feedback');
  // 只收自己這一組的按鈕，免得跟重點 4 的 .bracket-btn 搶控制項
  const modeBtns = document.querySelectorAll('[data-regroup-mode]');

  let mode = 'ab';

  const POS = '#fda4af';
  const NEG = '#60a5fa';
  const clr = (v) => (v >= 0 ? POS : NEG);
  // 括號只在負數時才加：那是為了隔開運算符號與性質符號（開發約束 27）
  const par = (v) => (v < 0 ? `(${v})` : `${v}`);

  // 三種分法：先算哪一對、剩下哪一個
  const MODES = {
    ab: { pair: [0, 1], rest: 2, law: '結合律' },
    bc: { pair: [1, 2], rest: 0, law: '結合律' },
    ac: { pair: [0, 2], rest: 1, law: '交換律 ＋ 結合律' },
  };

  function pairSum(nums, key) {
    const [i, j] = MODES[key].pair;
    return nums[i] + nums[j];
  }

  // 「好算」的兩種情形：湊成 0（相反數）、湊成整十
  function niceness(s) {
    if (s === 0) return { nice: true, why: '相反數，相加剛好抵消成 0' };
    if (s % 10 === 0) return { nice: true, why: `剛好湊成整十 ${s}` };
    return { nice: false, why: '' };
  }

  const MODE_LABEL = { ab: '先算前兩個', bc: '先算後兩個', ac: '交換後配對' };

  // 本頁不載入 math-canvas.js，圓角矩形自備一份（與共用檔同寫法）
  function roundRect(x, y, rw, rh, r) {
    const rad = Math.min(r, Math.abs(rw) / 2, Math.abs(rh) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + rw - rad, y);
    ctx.quadraticCurveTo(x + rw, y, x + rw, y + rad);
    ctx.lineTo(x + rw, y + rh - rad);
    ctx.quadraticCurveTo(x + rw, y + rh, x + rw - rad, y + rh);
    ctx.lineTo(x + rad, y + rh);
    ctx.quadraticCurveTo(x, y + rh, x, y + rh - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  function draw() {
    const a = parseInt(sliderA.value, 10);
    const b = parseInt(sliderB.value, 10);
    const c = parseInt(sliderC.value, 10);
    const nums = [a, b, c];
    const total = a + b + c;

    valA.textContent = a > 0 ? `+${a}` : `${a}`;
    valB.textContent = b > 0 ? `+${b}` : `${b}`;
    valC.textContent = c > 0 ? `+${c}` : `${c}`;

    const m = MODES[mode];
    const [pi, pj] = m.pair;
    const ri = m.rest;
    const p = nums[pi] + nums[pj];
    const rest = nums[ri];

    // 重組後的算式：被結合的那一對包一層括號。
    // 先算後兩個時 a 留在最前面（a + (b + c)），那才是純結合律的形式；
    // 其餘兩種則是被結合的那一對在前
    const restFirst = mode === 'bc';
    const pairTex = `${nums[pi]} + ${par(nums[pj])}`;
    const grouped = restFirst
      ? `${rest} + (${pairTex})`
      : `(${pairTex}) + ${par(rest)}`;
    const step2Tex = restFirst ? `${rest} + ${par(p)}` : `${p} + ${par(rest)}`;

    // 數值列：用共用的 wbrEq() 在每個頂層的 =、+、- 前斷開（開發約束 24）。
    // 414px 下數值列只有 183px，只斷等號的話 (-50 + (-50)) + (-50)
    // 這一段還是溢出 32px；連加減號一起斷才收得住
    const answerSpan =
      `<span style="color:#a7f3d0; font-size:1.4rem; font-weight:700;">\\(${total}\\)</span>`;
    formulaDiv.innerHTML =
      wbrEq(`${a} + ${par(b)} + ${par(c)} = ${grouped} = ${step2Tex} =`) +
      '<wbr>' + answerSpan;
    if (window.MathJax) {
      MathJax.typesetPromise([formulaDiv]).catch((err) => console.log(err));
    }

    // 哪些分法好算——即時算，不寫死（開發約束 27）
    const nicePairs = Object.keys(MODES).filter((k) => niceness(pairSum(nums, k)).nice);
    const cur = niceness(p);
    let msg;
    if (cur.nice) {
      msg = `<div style="width:100%; text-align:center; line-height:1.6; font-size:0.95rem;">這一對<strong>好算</strong>：${wbrEq(`${pairTex} = ${p}`)}，${cur.why}。剩下只要再加 \\(${par(rest)}\\) 就好。</div>`;
    } else if (nicePairs.length > 0) {
      const tips = nicePairs
        .map((k) => {
          const s = pairSum(nums, k);
          const [i, j] = MODES[k].pair;
          return `<strong>${MODE_LABEL[k]}</strong>（${wbrEq(`${nums[i]} + ${par(nums[j])} = ${s}`)}）`;
        })
        .join('、');
      msg = `<div style="width:100%; text-align:center; line-height:1.6; font-size:0.95rem;">目前這一對是 \\(${p}\\)，不算好算。換成 ${tips} 會輕鬆得多——<strong>答案還是 \\(${total}\\)</strong>。</div>`;
    } else {
      msg = `<div style="width:100%; text-align:center; line-height:1.6; font-size:0.95rem;">這三個數<strong>沒有哪一對能湊成 0 或整十</strong>，三種分法一樣費力；但不論先算哪一對，答案都是 \\(${total}\\)。</div>`;
    }
    feedbackDiv.innerHTML = msg;
    if (window.MathJax) {
      MathJax.typesetPromise([feedbackDiv]).catch((err) => console.log(err));
    }

    /* ---------- Canvas ---------- */
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.textBaseline = 'middle';

    // 標題
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(226, 232, 240, 0.75)';
    ctx.font = '600 18px "Noto Sans TC", sans-serif';
    ctx.fillText('原式（三個數相加，順序照寫）', w / 2, 26);

    // --- 第一列：三張數字牌 ---
    const tileW = 108;
    const tileH = 58;
    const gapW = 46; // 放加號的空隙
    const rowW = tileW * 3 + gapW * 2;
    const x0 = (w - rowW) / 2;
    const tileY = 68;
    const cx = [0, 1, 2].map((i) => x0 + i * (tileW + gapW) + tileW / 2);

    for (let i = 0; i < 3; i++) {
      const selected = i === pi || i === pj;
      const x = cx[i] - tileW / 2;
      roundRect(x, tileY, tileW, tileH, 12);
      ctx.fillStyle = selected ? 'rgba(139, 92, 246, 0.22)' : 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      ctx.lineWidth = selected ? 2.5 : 1.5;
      ctx.strokeStyle = selected ? 'rgba(196, 132, 252, 0.95)' : 'rgba(255, 255, 255, 0.14)';
      ctx.stroke();

      ctx.fillStyle = clr(nums[i]);
      ctx.font = '700 30px "Outfit", sans-serif';
      ctx.fillText(`${nums[i]}`, cx[i], tileY + tileH / 2 + 1);

      ctx.fillStyle = 'rgba(226, 232, 240, 0.5)';
      ctx.font = '600 16px "Outfit", sans-serif';
      ctx.fillText(['a', 'b', 'c'][i], cx[i], tileY - 14);
    }

    // 加號
    ctx.fillStyle = 'rgba(226, 232, 240, 0.6)';
    ctx.font = '700 26px "Outfit", sans-serif';
    for (let i = 0; i < 2; i++) {
      ctx.fillText('+', (cx[i] + cx[i + 1]) / 2, tileY + tileH / 2 + 1);
    }

    // --- 連接被結合那一對的弧線 ---
    const arcTop = tileY + tileH + 8;
    const arcDepth = mode === 'ac' ? 32 : 18; // 跨過中間那張牌時壓深一點
    ctx.beginPath();
    ctx.moveTo(cx[pi], arcTop);
    ctx.quadraticCurveTo((cx[pi] + cx[pj]) / 2, arcTop + arcDepth * 2, cx[pj], arcTop);
    ctx.strokeStyle = 'rgba(196, 132, 252, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#c084fc';
    ctx.font = '600 17px "Noto Sans TC", sans-serif';
    ctx.fillText(
      mode === 'ac' ? '交換律：把 a 和 c 移在一起' : '結合律：先算這一對',
      (cx[pi] + cx[pj]) / 2,
      arcTop + arcDepth + 24
    );

    // --- 第二列：重組後的兩步 ---
    const stepY = 224;
    const lx = 34;
    const vx = lx + 74;
    ctx.textAlign = 'left';

    ctx.font = '600 19px "Noto Sans TC", sans-serif';
    ctx.fillStyle = 'rgba(226, 232, 240, 0.6)';
    ctx.fillText('第一步', lx, stepY);
    ctx.font = '700 23px "Outfit", sans-serif';
    ctx.fillStyle = cur.nice ? '#a7f3d0' : 'rgba(226, 232, 240, 0.9)';
    ctx.fillText(`${pairTex} = ${p}`, vx, stepY);

    if (cur.nice) {
      ctx.font = '600 17px "Noto Sans TC", sans-serif';
      ctx.fillStyle = '#34d399';
      ctx.textAlign = 'right';
      ctx.fillText('好算！', w - 34, stepY);
      ctx.textAlign = 'left';
    }

    const step2Y = stepY + 40;
    ctx.font = '600 19px "Noto Sans TC", sans-serif';
    ctx.fillStyle = 'rgba(226, 232, 240, 0.6)';
    ctx.fillText('第二步', lx, step2Y);
    ctx.font = '700 23px "Outfit", sans-serif';
    ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
    const tailStr = `${step2Tex} = `;
    ctx.fillText(tailStr, vx, step2Y);
    const tailW = ctx.measureText(tailStr).width;
    ctx.font = '700 30px "Outfit", sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`${total}`, vx + tailW, step2Y);

    // --- 底部：三種分法的答案一起列出來，看它們永遠相同 ---
    const chipY = 312;
    const keys = ['ab', 'bc', 'ac'];
    const chipW = 160;
    const chipGap = 10;
    const chipX0 = (w - (chipW * 3 + chipGap * 2)) / 2;
    ctx.textAlign = 'center';
    for (let i = 0; i < 3; i++) {
      const k = keys[i];
      const on = k === mode;
      const x = chipX0 + i * (chipW + chipGap);
      roundRect(x, chipY - 16, chipW, 32, 10);
      ctx.fillStyle = on ? 'rgba(251, 191, 36, 0.16)' : 'rgba(255, 255, 255, 0.04)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = on ? 'rgba(251, 191, 36, 0.6)' : 'rgba(255, 255, 255, 0.1)';
      ctx.stroke();
      ctx.font = '600 15px "Noto Sans TC", sans-serif';
      ctx.fillStyle = on ? '#fbbf24' : 'rgba(226, 232, 240, 0.55)';
      ctx.fillText(`${MODE_LABEL[k]} → ${total}`, x + chipW / 2, chipY + 1);
    }
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.regroupMode;
      modeBtns.forEach((o) => o.classList.toggle('active', o === btn));
      draw();
    });
  });

  [sliderA, sliderB, sliderC].forEach((s) => s.addEventListener('input', draw));

  draw();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(draw);
  }
}
/* ==========================================================================
   5b. Absolute Value Explorer (重點 5：含絕對值的算式運算)
   兩個常見誤解各給一個模式：
     split — |a+b| 可以拆成 |a|+|b| 嗎？
     neg   — -|a+b| 可以像去括號那樣變號嗎？
   「這次相不相等」與理由一律即時算出來，不寫死（開發約束 27）。
   字級依開發約束 13 放大：canvas 在課堂投影下只有約 0.71 倍。
   ========================================================================== */
function initAbsCanvas() {
  const canvas = document.getElementById('canvas-abs');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderA = document.getElementById('abs-a');
  const sliderB = document.getElementById('abs-b');
  const valA = document.getElementById('abs-a-val');
  const valB = document.getElementById('abs-b-val');
  const formulaDiv = document.getElementById('abs-formula');
  const feedbackDiv = document.getElementById('abs-feedback');
  // 只收自己這一組的按鈕（工作約定：querySelectorAll 要收斂到自己那一組）
  const modeBtns = document.querySelectorAll('[data-abs-mode]');

  let mode = 'split';

  const OK = '#34d399';
  const NG = '#f87171';
  // 括號只在負數時才加：那是為了隔開運算符號與性質符號（開發約束 27）
  const par = (v) => (v < 0 ? `(${v})` : `${v}`);

  // 本頁不載入 math-canvas.js 的繪圖元件，圓角矩形自備一份
  function roundRect(x, y, rw, rh, r) {
    const rad = Math.min(r, Math.abs(rw) / 2, Math.abs(rh) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + rw - rad, y);
    ctx.quadraticCurveTo(x + rw, y, x + rw, y + rad);
    ctx.lineTo(x + rw, y + rh - rad);
    ctx.quadraticCurveTo(x + rw, y + rh, x + rw - rad, y + rh);
    ctx.lineTo(x + rad, y + rh);
    ctx.quadraticCurveTo(x, y + rh, x, y + rh - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  function draw() {
    const a = parseInt(sliderA.value, 10);
    const b = parseInt(sliderB.value, 10);
    const s = a + b;

    valA.textContent = a > 0 ? `+${a}` : `${a}`;
    valB.textContent = b > 0 ? `+${b}` : `${b}`;

    // left = 先算內部（課本的做法）；right = 學生常見的另一種做法
    let leftVal, rightVal, leftTex, rightTex, leftShort, rightShort, question, rightLabel;
    if (mode === 'split') {
      leftVal = Math.abs(s);
      rightVal = Math.abs(a) + Math.abs(b);
      leftTex = `|${a} + ${par(b)}| = |${s}| = ${leftVal}`;
      rightTex = `|${a}| + |${b}| = ${Math.abs(a)} + ${Math.abs(b)} = ${rightVal}`;
      leftShort = `|${a} + ${par(b)}|`;
      rightShort = `|${a}| + |${b}|`;
      question = '把絕對值「拆開來」各自取，答案會一樣嗎？';
      rightLabel = '拆開來算';
    } else {
      leftVal = -Math.abs(s);
      rightVal = -s;
      leftTex = `-|${a} + ${par(b)}| = -|${s}| = ${leftVal}`;
      rightTex = `-(${a} + ${par(b)}) = -(${s}) = ${rightVal}`;
      leftShort = `-|${a} + ${par(b)}|`;
      rightShort = `-(${a} + ${par(b)})`;
      question = '絕對值前面的負號，可以像去括號那樣變號嗎？';
      rightLabel = '當成括號變號';
    }
    const same = leftVal === rightVal;

    // 數值列：直接寫成「左式 =／≠ 右式」的比較。
    // 只在等號處斷成多段，用 <wbr> 接合（開發約束 24）——這裡不能用 wbrEq()，
    // 它的括號深度只算 {}、()、[]，不認得絕對值的 |，會斷在 |…| 正中間。
    const seg = (lhs, rhs) => `\\(${lhs}\\)<wbr>\\({}= ${rhs}\\)`;
    const rel = same ? '=' : '\\ne';
    formulaDiv.innerHTML =
      `<span style="color:${OK}">${seg(leftShort, leftVal)}</span>` +
      `<wbr>\\(\\;${rel}\\;\\)` +
      `<wbr><span style="color:${same ? OK : NG}">${seg(rightShort, rightVal)}</span>`;
    if (window.MathJax) {
      MathJax.typesetPromise([formulaDiv]).catch((err) => console.log(err));
    }

    // 這次為什麼相等／不相等——即時算，不寫死（開發約束 27）
    let msg;
    if (mode === 'split') {
      if (same) {
        const why =
          a === 0 || b === 0
            ? '其中一個是 0，沒有東西可以抵消'
            : '兩數同號，相加時不會互相抵消';
        msg = `這一組<strong>剛好相等</strong>：${why}。但這是特例，不是通則——把其中一個拉成異號再看看。`;
      } else {
        msg = `<strong>不相等</strong>，差了 \\(${rightVal - leftVal}\\)。\\(${a}\\) 與 \\(${b}\\) 異號，相加時先抵消掉一部分才剩 \\(${s}\\)；先各自取絕對值就抵消不到了。所以一定要<strong>先算內部</strong>。`;
      }
    } else {
      if (same) {
        msg = `這一組<strong>剛好相等</strong>：因為 \\(${a} + ${par(b)} = ${s}\\) 本來就不是負的，取絕對值沒有改變它。這是特例，把和拉成負的再看看。`;
      } else {
        msg = `<strong>不相等</strong>。\\(|${a} + ${par(b)}|\\) 是距離，一定不是負的，前面加負號後必定 \\(\\le 0\\)；而 \\(-(${a} + ${par(b)}) \\)<wbr>\\({}= ${rightVal}\\) 卻是正的。<strong>絕對值不是括號</strong>，不能直接變號。`;
      }
    }
    feedbackDiv.innerHTML = `<div style="width:100%; text-align:center; line-height:1.6; font-size:0.95rem;">${msg}</div>`;
    if (window.MathJax) {
      MathJax.typesetPromise([feedbackDiv]).catch((err) => console.log(err));
    }

    /* ---------- Canvas ---------- */
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.textBaseline = 'middle';

    // 問題（開發約束 22：互動要能單獨讀懂）
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(226, 232, 240, 0.78)';
    ctx.font = '600 18px "Noto Sans TC", sans-serif';
    ctx.fillText(question, w / 2, 26);

    // --- 兩種做法各一列 ---
    const rows = [
      { label: '先算內部', tex: leftTex, val: leftVal, color: OK, y: 74 },
      { label: rightLabel, tex: rightTex, val: rightVal, color: same ? OK : NG, y: 126 },
    ];
    // 算式的起點由「兩列標籤裡最寬的那一個」決定，不寫死——
    // 「當成括號變號」六個字比「先算內部」寬得多，寫死會被壓到
    const LABEL_X = 44;
    ctx.font = '600 16px "Noto Sans TC", sans-serif';
    const texX = LABEL_X + Math.max(...rows.map((r) => ctx.measureText(r.label).width)) + 14;
    for (const r of rows) {
      roundRect(30, r.y - 22, w - 60, 44, 12);
      ctx.fillStyle = `${r.color}22`;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `${r.color}88`;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = '600 16px "Noto Sans TC", sans-serif';
      ctx.fillStyle = 'rgba(226, 232, 240, 0.65)';
      ctx.fillText(r.label, LABEL_X, r.y);
      ctx.font = '700 22px "Outfit", sans-serif';
      ctx.fillStyle = r.color;
      ctx.fillText(r.tex, texX, r.y);
    }

    // --- 數線：兩個結果各自站在自己的位置上（長度與數值成正比，開發約束 17） ---
    const lineY = 214;
    const padding = 46;
    const RANGE = 20; // a、b 各為 -10~10，兩種做法的結果都落在 -20~20
    const sx = (v) => padding + ((v + RANGE) / (RANGE * 2)) * (w - padding * 2);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx(-RANGE), lineY);
    ctx.lineTo(sx(RANGE), lineY);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = '600 14px "Outfit", sans-serif';
    for (let v = -20; v <= 20; v += 5) {
      ctx.beginPath();
      ctx.moveTo(sx(v), lineY - 5);
      ctx.lineTo(sx(v), lineY + 5);
      ctx.strokeStyle = v === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.28)';
      ctx.lineWidth = v === 0 ? 2 : 1;
      ctx.stroke();
      ctx.fillStyle = v === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(226,232,240,0.45)';
      ctx.fillText(`${v}`, sx(v), lineY + 20);
    }

    // 兩個結果的標記：相等時會疊在同一點上，一眼看得出來
    const marks = [
      { v: leftVal, color: OK, dy: -34, label: '先算內部' },
      { v: rightVal, color: same ? OK : NG, dy: same ? -34 : 48, label: rightLabel },
    ];
    for (const mk of marks) {
      const x = sx(mk.v);
      ctx.beginPath();
      ctx.moveTo(x, lineY);
      ctx.lineTo(x, lineY + mk.dy * 0.45);
      ctx.strokeStyle = mk.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, lineY, 6, 0, Math.PI * 2);
      ctx.fillStyle = mk.color;
      ctx.fill();

      // 結果的數字加一塊色底：不加的話它跟正下方的刻度數字長得一模一樣，
      // 在 -20／20 這種剛好落在刻度上的位置會看成兩個刻度標籤
      ctx.font = '700 19px "Outfit", sans-serif';
      const label = `${mk.v}`;
      const tw = ctx.measureText(label).width;
      const cw = tw + 18;
      // 落在數線兩端時整塊會超出畫布，夾回來
      const cxp = Math.min(Math.max(x, cw / 2 + 4), w - cw / 2 - 4);
      roundRect(cxp - cw / 2, lineY + mk.dy - 13, cw, 26, 8);
      ctx.fillStyle = `${mk.color}2e`;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = mk.color;
      ctx.stroke();
      ctx.fillStyle = mk.color;
      ctx.textAlign = 'center';
      ctx.fillText(label, cxp, lineY + mk.dy);
    }
    if (same) {
      // 疊在一起時只畫一個數字，另外標一句話說明它們同一點
      ctx.font = '600 15px "Noto Sans TC", sans-serif';
      ctx.fillStyle = 'rgba(226, 232, 240, 0.6)';
      ctx.fillText('兩種做法落在同一點', w / 2, lineY + 46);
    }

    // --- 結論 ---
    ctx.textAlign = 'center';
    ctx.font = '700 19px "Noto Sans TC", sans-serif';
    ctx.fillStyle = same ? OK : NG;
    ctx.fillText(
      same ? '這一組剛好相等（特例）' : `不相等：差了 ${Math.abs(rightVal - leftVal)}`,
      w / 2,
      300
    );
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.absMode;
      modeBtns.forEach((o) => o.classList.toggle('active', o === btn));
      draw();
    });
  });

  [sliderA, sliderB].forEach((s) => s.addEventListener('input', draw));

  draw();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(draw);
  }
}
