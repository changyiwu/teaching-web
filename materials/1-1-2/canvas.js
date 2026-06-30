document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quiz System
  initQuizSystem();

  // Initialize Canvas Simulations
  initAdditionCanvas();
  initThermometerCanvas();
  initBracketCanvas();
  initDistanceCanvas();
});

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');
  
  // Correct answers mapping for Section 1-2
  const answers = {
    '1-2-1-1': 'A', // Q1. (－9)＋(－7) = －16
    '1-2-1-2': 'B', // Q2. (－12)＋7 = －5
    '1-2-2-1': 'A', // Q3. 125－(－25) = 150
    '1-2-2-2': 'D', // Q4. (－63)－37 = －100
    '1-2-3-1': 'C', // Q5. 299－(396＋299) = －396
    '1-2-3-2': 'C', // Q6. －(－2＋5) 和 2－5 是否相同
    '1-2-4-1': 'D', // Q7. C(－14)和D(－9)距離 = 5
    '1-2-4-2': 'A'  // Q8. 中點座標 C
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
    const range = 24; // Draw from -12 to 12
    const scale = (w - padding * 2) / range;
    
    // Math scale function: maps math coordinates [-12, 12] to canvas X
    function getCanvasX(val) {
      return padding + (val + 12) * scale;
    }

    // 1. Draw Number Line (Right arrow only, left is a flat end, per Taiwanese junior high definition)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(getCanvasX(-12.5), centerY);
    ctx.lineTo(getCanvasX(12.2), centerY);
    ctx.stroke();

    // Single right directional arrow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(getCanvasX(12.5), centerY);
    ctx.lineTo(getCanvasX(12.1), centerY - 6);
    ctx.lineTo(getCanvasX(12.1), centerY + 6);
    ctx.closePath();
    ctx.fill();

    // Label right arrow as positive direction (x-axis label "正向")
    ctx.font = '12px Outfit, Noto Sans TC, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('+', getCanvasX(12.4), centerY + 18);

    // 2. Draw Ticks & Numbers
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = -12; i <= 12; i++) {
      const cx = getCanvasX(i);
      ctx.strokeStyle = i === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = i === 0 ? 2 : 1;
      
      // Tick mark
      ctx.beginPath();
      ctx.moveTo(cx, centerY - (i === 0 ? 8 : 4));
      ctx.lineTo(cx, centerY + (i === 0 ? 8 : 4));
      ctx.stroke();

      // Number Label
      if (i % 2 === 0 || i === 0) {
        ctx.fillStyle = i === 0 ? '#fff' : 'rgba(255,255,255,0.5)';
        ctx.font = i === 0 ? 'bold 11px Outfit, sans-serif' : '11px Outfit, sans-serif';
        ctx.fillText(i, cx, centerY + 10);
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
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.fillText(`a: ${a > 0 ? '+' : ''}${a}`, (axStart + axEnd) / 2, arrowY - 18);
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
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.fillText(`b: ${b > 0 ? '+' : ''}${b}`, (bxStart + bxEnd) / 2, arrowY - 18);
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
      feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;">溫度從 ${start}°C 上升到 ${end}°C，一共<strong>升高 ${diff}°C</strong>。減法算式為 \\(${end} - (${start}) = ${diff}\\)，等同於 \\(${end} + (${-start}) = ${diff}\\)。</div>`;
    } else if (diff < 0) {
      feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;">溫度從 ${start}°C 下降到 ${end}°C，一共<strong>降低 ${Math.abs(diff)}°C</strong>。減法算式為 \\(${end} - (${start}) = ${diff}\\)，等同於 \\(${end} + (${-start}) = ${diff}\\)。</div>`;
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
  const btns = document.querySelectorAll('.bracket-btn');
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
      explText = `<strong>括號前面是「＋」號</strong>：直接去括號，括號內各項的<strong>性質符號皆保持不變</strong>：即 \\(10 + (a + b) = 10 + a + b\\)。`;
    } else {
      term1Val = -val1;
      term2Val = -val2;
      explText = `<strong>括號前面是「－」號</strong>：去括號時必須<strong>變號</strong>，括號內的「＋」變「－」，「－」變「＋」：即 \\(10 - (a + b) = 10 - a - b\\)。`;
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
      updateBracketExplorer(btn.id);
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
    
    distanceFormulaDiv.innerHTML = `距離 \\( AB = |a - b| = | ${a} - ${bStr} | = | ${a-b} | = \\) <span style="color:#fbbf24; font-size:1.35rem; font-weight:700;">\\(${distance}\\)</span>`;
    midpointFormulaDiv.innerHTML = `中點 \\( M = \\frac{a + b}{2} = \\frac{${a} + ${bStr}}{2} = \\) <span style="color:#10b981; font-size:1.35rem; font-weight:700;">\\(${midpoint}\\)</span>`;
    
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
