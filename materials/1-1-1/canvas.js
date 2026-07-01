document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();
  initConcept1Canvas();
  initConcept2Canvas();
  initConcept3Canvas();
  initConcept4Canvas();
  initConcept5Canvas();
});

/* ==========================================================================
   1. Quiz Assessment System (11 questions)
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');
  
  // Correct answers mapping
  const answers = {
    '1-1': 'B',
    '1-2': 'D',
    '2-1': 'B',
    '2-2': 'A',
    '3-1': 'D',
    '3-2': 'B',
    '4-1': 'D',
    '4-2': 'B',
    '5-1': 'A',
    '5-2': 'C',
    '5-3': 'A'
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
      
      // Wrap content in block div for Flexbox safety
      const isCorrectText = isCorrect 
        ? `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;"><span style="color:#10b981; font-weight:700;"><i class="fa-solid fa-circle-check"></i> 回答正確！</span></div>`
        : `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;"><span style="color:#f43f5e; font-weight:700;"><i class="fa-solid fa-circle-xmark"></i> 回答錯誤！正確答案是 (${correctAns})</span></div>`;
      
      expTitle.innerHTML = isCorrectText;
      explanation.classList.add(isCorrect ? 'correct-feedback' : 'incorrect-feedback');
      
      if (window.MathJax) {
        MathJax.typesetPromise([explanation]).catch(err => console.log(err));
      }
    });
  });
}

/* ==========================================================================
   2. Concept 1: Thermometer Canvas Simulation
   ========================================================================== */
function initConcept1Canvas() {
  const canvas = document.getElementById('canvas-temp');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const slider = document.getElementById('temp-slider');
  const tempValSpan = document.getElementById('temp-val');
  const feedbackDiv = document.getElementById('temp-feedback');

  function drawThermometer(temp) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Dynamic background visual indicator
    if (temp > 0) {
      // Warm orange-red radial gradient
      const alpha = Math.min(0.25, temp / 40 * 0.25);
      ctx.fillStyle = `rgba(244, 63, 94, ${alpha})`;
      ctx.fillRect(0, 0, w, h);
      
      // Draw a tiny sun in the top left
      ctx.beginPath();
      ctx.arc(40, 40, 15, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
    } else if (temp < 0) {
      // Icy blue radial gradient
      const alpha = Math.min(0.25, Math.abs(temp) / 30 * 0.25);
      ctx.fillStyle = `rgba(6, 182, 212, ${alpha})`;
      ctx.fillRect(0, 0, w, h);
      
      // Draw a simple snowflake shape
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, 40); ctx.lineTo(50, 40);
      ctx.moveTo(40, 30); ctx.lineTo(40, 50);
      ctx.moveTo(33, 33); ctx.lineTo(47, 47);
      ctx.moveTo(33, 47); ctx.lineTo(47, 33);
      ctx.stroke();
    }

    const tubeX = w / 2; // Centered on canvas
    const bulbY = h - 50;
    const bulbRadius = 22;
    const tubeWidth = 14;
    const tubeTopY = 30;

    // 1. Draw Thermometer Glass Outline (combined tube and bulb path)
    const angle = Math.asin((tubeWidth / 2) / bulbRadius);
    ctx.beginPath();
    // Top dome of the tube
    ctx.arc(tubeX, tubeTopY + tubeWidth / 2, tubeWidth / 2, Math.PI, 0);
    // Right wall of the tube
    ctx.lineTo(tubeX + tubeWidth / 2, bulbY - bulbRadius * Math.cos(angle));
    // Outer bulb circle
    ctx.arc(tubeX, bulbY, bulbRadius, -Math.PI / 2 + angle, Math.PI * 1.5 - angle);
    // Left wall of the tube
    ctx.lineTo(tubeX - tubeWidth / 2, tubeTopY + tubeWidth / 2);
    // Close path
    ctx.closePath();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 2. Draw Ticks & Labels (on both sides)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const maxTemp = 40;
    const minTemp = -30;
    const totalRange = maxTemp - minTemp;
    const scaleHeight = bulbY - bulbRadius - 10 - tubeTopY;

    // Draw grid lines on the thermometer
    for (let t = minTemp; t <= maxTemp; t += 10) {
      const pct = (t - minTemp) / totalRange;
      const y = (bulbY - bulbRadius - 10) - (pct * scaleHeight);

      // Left tick mark
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tubeX - tubeWidth / 2 - 8, y);
      ctx.lineTo(tubeX - tubeWidth / 2, y);
      ctx.stroke();

      // Right tick mark
      ctx.beginPath();
      ctx.moveTo(tubeX + tubeWidth / 2, y);
      ctx.lineTo(tubeX + tubeWidth / 2 + 8, y);
      ctx.stroke();

      // Label on the left
      let labelText = `${t}°`;
      if (t > 0) labelText = `+${t}°`;
      ctx.fillStyle = t === 0 ? '#fff' : (t > 0 ? '#f87171' : '#60a5fa');
      ctx.font = t === 0 ? 'bold 11px Outfit, sans-serif' : '11px Outfit, sans-serif';
      
      ctx.fillText(labelText, tubeX - tubeWidth / 2 - 12, y);
    }

    // 3. Draw Mercury Liquid Column
    const curPct = (temp - minTemp) / totalRange;
    const fillY = (bulbY - bulbRadius - 10) - (curPct * scaleHeight);

    let liquidColor = '#fff'; // White for 0
    if (temp > 0) {
      liquidColor = 'var(--accent)'; // Red for positive
    } else if (temp < 0) {
      liquidColor = 'var(--secondary)'; // Blue for negative
    }

    ctx.fillStyle = liquidColor;
    
    // Draw bulb mercury (liquid base)
    ctx.beginPath();
    ctx.arc(tubeX, bulbY, bulbRadius - 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw tube mercury column (inner liquid line)
    ctx.fillRect(tubeX - tubeWidth / 2 + 3.5, fillY, tubeWidth - 7, bulbY - bulbRadius - fillY + 5);

    // Draw glass shine highlight on the left
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tubeX - tubeWidth / 4, tubeTopY + 10);
    ctx.lineTo(tubeX - tubeWidth / 4, bulbY - 20);
    ctx.stroke();

    // Bulb highlight reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(tubeX - 6, bulbY - 6, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  function updateVisuals() {
    const temp = parseInt(slider.value);
    
    // Update labels and classes
    tempValSpan.innerHTML = temp > 0 ? `\\(+${temp}^\\circ\\text{C}\\)` : `\\(${temp}^\\circ\\text{C}\\)`; 
    if (window.MathJax) { MathJax.typesetPromise([tempValSpan]).catch(err => console.log(err)); }
    
    tempValSpan.className = '';
    
    // Wrap dynamic text inside container block for Flexbox safety
    if (temp > 0) {
      tempValSpan.classList.add('positive');
      feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6;">正數 (如 \\(+${temp}^\\circ\\text{C}\\)) 代表溫度高於基準點 \\(0^\\circ\\text{C}\\)。數字越大代表越熱！</div>`;
    } else if (temp < 0) {
      tempValSpan.classList.add('negative');
      // Highlight gelato storage temperature
      if (temp >= -25 && temp <= -18) {
        feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6;"><strong style="color: #10b981;">\\(-${Math.abs(temp)}^\\circ\\text{C}\\) 正處於義式冰淇淋的最佳儲藏溫度 (\\(-25^\\circ\\text{C} \\sim -18^\\circ\\text{C}\\))！</strong></div>`;
      } else if (temp >= -15 && temp <= -12) {
        feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6;"><strong style="color: #06b6d4;">\\(-${Math.abs(temp)}^\\circ\\text{C}\\) 正處於義式冰淇淋的最佳食用溫度 (\\(-15^\\circ\\text{C} \\sim -12^\\circ\\text{C}\\))！</strong></div>`;
      } else {
        feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6;">負數 (如 \\(-${Math.abs(temp)}^\\circ\\text{C}\\)) 代表溫度低於基準點 \\(0^\\circ\\text{C}\\)。絕對值（數字部分）越大的負數，溫度越低！</div>`;
      }
    } else {
      tempValSpan.classList.add('zero');
      feedbackDiv.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6;">\\(0^\\circ\\text{C}\\) 是水結冰的溫度，也是正負溫度的分界基準。\\(0\\) 既不是正數，也不是負數。</div>`;
    }

    if (window.MathJax) { MathJax.typesetPromise([feedbackDiv]).catch(err => console.log(err)); }
    drawThermometer(temp);
  }

  slider.addEventListener('input', updateVisuals);
  updateVisuals(); // Initial Draw
}

/* ==========================================================================
   3. Concept 2: Draggable Coordinate Line (Integers / Fractions / Decimals)
   ========================================================================== */
function initConcept2Canvas() {
  const canvas = document.getElementById('canvas-line');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const coordA = document.getElementById('coord-a');
  const feedback = document.getElementById('line-feedback');
  const btnInt = document.getElementById('btn-grid-int');
  const btnFrac = document.getElementById('btn-grid-frac');

  // Value range from -5 to 5.
  // We represent values as floats internally.
  let valA = 2.0;
  let gridMode = 'int'; // 'int' or 'frac'

  // Render parameters
  const originX = canvas.width / 2;
  const originY = 70;
  const spacing = 38; // Pixels per unit
  let isDragging = false;

  btnInt.addEventListener('click', () => {
    gridMode = 'int';
    btnInt.classList.add('active');
    btnFrac.classList.remove('active');
    valA = Math.round(valA); // Snap to integer
    drawNumberLine();
    updateTexts();
  });

  btnFrac.addEventListener('click', () => {
    gridMode = 'frac';
    btnFrac.classList.add('active');
    btnInt.classList.remove('active');
    drawNumberLine();
    updateTexts();
  });

  function drawNumberLine() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Main Line & Ticks
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, originY);
    ctx.lineTo(canvas.width - 20, originY);
    ctx.stroke();

    // Arrow
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.moveTo(canvas.width - 20, originY - 6);
    ctx.lineTo(canvas.width - 10, originY);
    ctx.lineTo(canvas.width - 20, originY + 6);
    ctx.fill();

    // Direction text "正向"
    ctx.font = '11px Outfit, Noto Sans TC, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText("正向 (右)", canvas.width - 60, originY - 15);

    // 2. Draw Ticks (Subdivisions if frac mode is active)
    if (gridMode === 'frac') {
      // 5 subdivisions per unit (each interval is 0.2)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1;
      for (let x = -5.0; x <= 5.0; x += 0.2) {
        // Skip integers which get drawn larger
        if (Math.abs(x - Math.round(x)) < 0.01) continue;
        const px = originX + x * spacing;
        if (px < 20 || px > canvas.width - 20) continue;
        
        ctx.beginPath();
        ctx.moveTo(px, originY - 4);
        ctx.lineTo(px, originY + 4);
        ctx.stroke();
      }
    }

    // 3. Draw Integer Ticks & Labels
    for (let x = -5; x <= 5; x++) {
      const px = originX + x * spacing;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, originY - 8);
      ctx.lineTo(px, originY + 8);
      ctx.stroke();

      // Labels below the line
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = x === 0 ? 'bold 13px Outfit, Noto Sans TC, sans-serif' : '11px Outfit, sans-serif';
      ctx.fillStyle = x === 0 ? '#fff' : (x > 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)');
      ctx.fillText(x === 0 ? '0 (O)' : x.toString(), px, originY + 12);
    }

    // 4. Draw Point A
    const pxA = originX + valA * spacing;

    ctx.shadowBlur = 8;
    ctx.shadowColor = '#f43f5e';
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(pxA, originY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0; // Reset shadow
    ctx.fillStyle = 'white';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.fillText('A', pxA, originY - 22);
  }

  function getMixedFraction(val) {
    if (Math.abs(val - Math.round(val)) < 0.01) {
      return `${val}`;
    }
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const integerPart = Math.floor(absVal);
    const decimalPart = absVal - integerPart;
    
    // We subdivide by 5, so fractional parts are multiples of 0.2
    const numerator = Math.round(decimalPart * 5);
    const denominator = 5;
    
    let fracStr = `\\frac{${numerator}}{${denominator}}`;
    if (integerPart > 0) {
      fracStr = `${integerPart}\\frac{${numerator}}{${denominator}}`;
    }
    
    return isNegative ? `-${fracStr}` : fracStr;
  }

  function updateTexts() {
    const valString = valA.toFixed(1);
    
    if (gridMode === 'int') {
      coordA.innerHTML = `\\(A(${Math.round(valA)})\\)`;
      feedback.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6;">點 \\(A\\) 位於原點右邊的整數 \\(${Math.round(valA)}\\) 處，代表 \\(A\\) 的坐標為 \\(${Math.round(valA)}\\)。</div>`;
    } else {
      const fracRepresentation = getMixedFraction(valA);
      coordA.innerHTML = `\\(A(${fracRepresentation})\\)`;
      
      const posString = valA >= 0 
        ? `右邊 \\(${fracRepresentation}\\) (即 \\(${valString}\\))`
        : `左邊 \\(${Math.abs(valA).toFixed(1)}\\) (即 \\(${fracRepresentation}\\))`;
        
      feedback.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6;">點 \\(A\\) 位於原點的${posString} 處，代表小數/分數的坐標標記。</div>`;
    }

    if (window.MathJax) {
      MathJax.typesetPromise([coordA, feedback]).catch(err => console.log(err));
    }
  }

  function getMouseX(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = (e.touches && e.touches.length > 0) 
      ? e.touches[0].clientX 
      : ((e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientX : e.clientX);
    const relativeX = clientX - rect.left;
    return relativeX * (canvas.width / rect.width);
  }

  function handleStart(e) {
    const mouseX = getMouseX(e);
    const pxA = originX + valA * spacing;

    if (Math.abs(mouseX - pxA) < 16) {
      isDragging = true;
      e.preventDefault();
    }
  }

  function handleMove(e) {
    if (!isDragging) {
      const mouseX = getMouseX(e);
      const pxA = originX + valA * spacing;
      if (Math.abs(mouseX - pxA) < 12) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
      return;
    }

    const mouseX = getMouseX(e);
    const relativeX = mouseX - originX;
    let gridVal = relativeX / spacing;

    if (gridMode === 'int') {
      gridVal = Math.round(gridVal);
    } else {
      // Snap to steps of 0.2
      gridVal = Math.round(gridVal * 5) / 5;
    }

    gridVal = Math.max(-5.0, Math.min(5.0, gridVal)); // Clamp bounds
    valA = gridVal;

    drawNumberLine();
    updateTexts();
    e.preventDefault();
  }

  function handleEnd() {
    isDragging = false;
  }

  canvas.addEventListener('mousedown', handleStart);
  canvas.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);

  canvas.addEventListener('touchstart', handleStart);
  canvas.addEventListener('touchmove', handleMove);
  window.addEventListener('touchend', handleEnd);

  drawNumberLine();
  updateTexts();
}

/* ==========================================================================
   4. Concept 3: Size Comparison and Transitivity (Draggable A & B)
   ========================================================================== */
function initConcept3Canvas() {
  const canvas = document.getElementById('canvas-compare');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const coordA = document.getElementById('coord-comp-a');
  const coordB = document.getElementById('coord-comp-b');
  const feedback = document.getElementById('compare-feedback');

  // Drag states
  let valA = 2;
  let valB = -2;
  const originX = canvas.width / 2;
  const originY = 70;
  const spacing = 38;

  let isDraggingA = false;
  let isDraggingB = false;

  function drawCompareLine() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Main Line & Ticks
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, originY);
    ctx.lineTo(canvas.width - 20, originY);
    ctx.stroke();

    // Arrow
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.moveTo(canvas.width - 20, originY - 6);
    ctx.lineTo(canvas.width - 10, originY);
    ctx.lineTo(canvas.width - 20, originY + 6);
    ctx.fill();

    // 2. Draw Ticks & Labels
    for (let x = -5; x <= 5; x++) {
      const px = originX + x * spacing;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, originY - 8);
      ctx.lineTo(px, originY + 8);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = x === 0 ? 'bold 13px Outfit, sans-serif' : '11px Outfit, sans-serif';
      ctx.fillStyle = x === 0 ? '#fff' : (x > 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)');
      ctx.fillText(x === 0 ? '0' : x.toString(), px, originY + 12);
    }

    // 3. Draw Points
    const pxA = originX + valA * spacing;
    const pxB = originX + valB * spacing;

    // Point A (Red)
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#f43f5e';
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(pxA, originY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText('A', pxA, originY - 22);

    // Point B (Green)
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#10b981';
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(pxB, originY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText('B', pxB, originY - 22);
  }

  function updateTexts() {
    coordA.innerHTML = `\\(A(${valA})\\)`;
    coordB.innerHTML = `\\(B(${valB})\\)`;

    let relation = '';
    let description = '';

    if (valA > valB) {
      relation = `\\(${valA}\\) > \\(${valB}\\)`;
      description = `因為點 \\(A(${valA})\\) 位於點 \\(B(${valB})\\) 的<span style="color:#f43f5e; font-weight:bold;">右邊</span>，所以 ${relation}。`;
      
      // If one is positive and one is negative, explain using transitivity
      if (valA > 0 && valB < 0) {
        description += `<br><span style="font-size:0.88rem; color:#6ee7b7;">💡 遞移關係：\\(${valB} < 0\\) 且 \\(0 < ${valA}\\) \\(\\implies\\) \\(${valB} < ${valA}\\) (負數小於正數)</span>`;
      }
    } else if (valA < valB) {
      relation = `\\(${valA}\\) < \\(${valB}\\)`;
      description = `因為點 \\(A(${valA})\\) 位於點 \\(B(${valB})\\) 的<span style="color:#10b981; font-weight:bold;">左邊</span>，所以 ${relation}。`;
      
      if (valA < 0 && valB > 0) {
        description += `<br><span style="font-size:0.88rem; color:#6ee7b7;">💡 遞移關係：\\(${valA} < 0\\) 且 \\(0 < ${valB}\\) \\(\\implies\\) \\(${valA} < ${valB}\\) (負數小於正數)</span>`;
      }
    } else {
      relation = `\\(${valA}\\) = \\(${valB}\\)`;
      description = `點 \\(A(${valA})\\) 與點 \\(B(${valB})\\) 重疊在同一個位置，代表 ${relation}。`;
    }

    feedback.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6;">${description}</div>`;

    if (window.MathJax) {
      MathJax.typesetPromise([coordA, coordB, feedback]).catch(err => console.log(err));
    }
  }

  function getMouseX(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = (e.touches && e.touches.length > 0) 
      ? e.touches[0].clientX 
      : ((e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientX : e.clientX);
    const relativeX = clientX - rect.left;
    return relativeX * (canvas.width / rect.width);
  }

  function handleStart(e) {
    const mouseX = getMouseX(e);
    const pxA = originX + valA * spacing;
    const pxB = originX + valB * spacing;

    if (Math.abs(mouseX - pxA) < 15) {
      isDraggingA = true;
      e.preventDefault();
    } else if (Math.abs(mouseX - pxB) < 15) {
      isDraggingB = true;
      e.preventDefault();
    }
  }

  function handleMove(e) {
    if (!isDraggingA && !isDraggingB) {
      const mouseX = getMouseX(e);
      const pxA = originX + valA * spacing;
      const pxB = originX + valB * spacing;
      if (Math.abs(mouseX - pxA) < 12 || Math.abs(mouseX - pxB) < 12) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
      return;
    }

    const mouseX = getMouseX(e);
    const relativeX = mouseX - originX;
    let gridVal = Math.round(relativeX / spacing);
    gridVal = Math.max(-5, Math.min(5, gridVal));

    if (isDraggingA) {
      valA = gridVal;
    } else if (isDraggingB) {
      valB = gridVal;
    }

    drawCompareLine();
    updateTexts();
    e.preventDefault();
  }

  function handleEnd() {
    isDraggingA = false;
    isDraggingB = false;
  }

  canvas.addEventListener('mousedown', handleStart);
  canvas.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);

  canvas.addEventListener('touchstart', handleStart);
  canvas.addEventListener('touchmove', handleMove);
  window.addEventListener('touchend', handleEnd);

  drawCompareLine();
  updateTexts();
}

/* ==========================================================================
   5. Concept 4: Opposite Numbers Mirroring (Draggable A and symmetrical A')
   ========================================================================== */
function initConcept4Canvas() {
  const canvas = document.getElementById('canvas-opposite');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const coordA = document.getElementById('coord-opp-a');
  const coordB = document.getElementById('coord-opp-b');
  const feedback = document.getElementById('opposite-feedback');

  // A starts at 3, A' starts at -3
  let valA = 3;
  const originX = canvas.width / 2;
  const originY = 70;
  const spacing = 38;
  let isDragging = false;

  function drawOpposites() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Main Line & Ticks
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, originY);
    ctx.lineTo(canvas.width - 20, originY);
    ctx.stroke();

    // Arrows
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.moveTo(canvas.width - 20, originY - 6);
    ctx.lineTo(canvas.width - 10, originY);
    ctx.lineTo(canvas.width - 20, originY + 6);
    ctx.fill();

    // 2. Draw Ticks
    for (let x = -5; x <= 5; x++) {
      const px = originX + x * spacing;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.moveTo(px, originY - 8);
      ctx.lineTo(px, originY + 8);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = x === 0 ? 'bold 13px Outfit, sans-serif' : '11px Outfit, sans-serif';
      ctx.fillStyle = x === 0 ? '#fff' : (x > 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)');
      ctx.fillText(x === 0 ? '0' : x.toString(), px, originY + 12);
    }

    // 3. Draw Points
    const pxA = originX + valA * spacing;
    const pxB = originX - valA * spacing; // Symmetric point

    // Opposite connector line (curved dashed line to show mirror link)
    if (valA !== 0) {
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(originX, originY, Math.abs(valA) * spacing, Math.PI, 0, valA < 0);
      ctx.stroke();
      ctx.setLineDash([]); // Reset
    }

    // Draw Point A (Red)
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#f43f5e';
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(pxA, originY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText('A', pxA, originY - 22);

    // Draw Point A' (Purple Symmetric)
    if (valA !== 0) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#a855f7';
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(pxB, originY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.fillText("A'", pxB, originY - 22);
    }
  }

  function updateTexts() {
    const oppVal = -valA;
    coordA.innerHTML = `\\(A(${valA})\\)`;
    coordB.innerHTML = `\\(A'(${oppVal})\\)`;

    let description = '';
    if (valA === 0) {
      description = `點 \\(A\\) 與對稱點 \\(A'\\) 均重合在原點 \\(0\\) 處。我們特別規定：\\(0\\) 的相反數就是 \\(0\\)；\\(-(0) = 0\\)。`;
    } else {
      const posA = valA > 0 ? '右邊' : '左邊';
      const posB = oppVal > 0 ? '右邊' : '左邊';
      description = `點 \\(A(${valA})\\) 位在原點的${posA} ${Math.abs(valA)} 個單位處；對稱點 \\(A'(${oppVal})\\) 則位在原點的${posB} ${Math.abs(oppVal)} 個單位處。
      <br>兩點到原點的距離相等，只有方向相反。因此，<strong style="color: #a855f7;">\\(${oppVal}\\) 與 \\(${valA}\\) 互為相反數</strong>。`;
    }

    feedback.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6;">${description}</div>`;

    if (window.MathJax) {
      MathJax.typesetPromise([coordA, coordB, feedback]).catch(err => console.log(err));
    }
  }

  function getMouseX(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = (e.touches && e.touches.length > 0) 
      ? e.touches[0].clientX 
      : ((e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientX : e.clientX);
    const relativeX = clientX - rect.left;
    return relativeX * (canvas.width / rect.width);
  }

  function handleStart(e) {
    const mouseX = getMouseX(e);
    const pxA = originX + valA * spacing;

    if (Math.abs(mouseX - pxA) < 16) {
      isDragging = true;
      e.preventDefault();
    }
  }

  function handleMove(e) {
    if (!isDragging) {
      const mouseX = getMouseX(e);
      const pxA = originX + valA * spacing;
      if (Math.abs(mouseX - pxA) < 12) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
      return;
    }

    const mouseX = getMouseX(e);
    const relativeX = mouseX - originX;
    let gridVal = Math.round(relativeX / spacing);
    gridVal = Math.max(-5, Math.min(5, gridVal));
    valA = gridVal;

    drawOpposites();
    updateTexts();
    e.preventDefault();
  }

  function handleEnd() {
    isDragging = false;
  }

  canvas.addEventListener('mousedown', handleStart);
  canvas.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);

  canvas.addEventListener('touchstart', handleStart);
  canvas.addEventListener('touchmove', handleMove);
  window.addEventListener('touchend', handleEnd);

  drawOpposites();
  updateTexts();
}

/* ==========================================================================
   6. Concept 5: Absolute Value as Distance (Draggable A with highlighted ruler)
   ========================================================================== */
function initConcept5Canvas() {
  const canvas = document.getElementById('canvas-abs');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const coordA = document.getElementById('coord-abs-a');
  const absVal = document.getElementById('abs-val');
  const feedback = document.getElementById('abs-feedback');

  // A starts at 3
  let valA = 3;
  const originX = canvas.width / 2;
  const originY = 70;
  const spacing = 38;
  let isDragging = false;

  function drawAbsoluteValue() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Main Line & Ticks
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, originY);
    ctx.lineTo(canvas.width - 20, originY);
    ctx.stroke();

    // Arrows
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.moveTo(canvas.width - 20, originY - 6);
    ctx.lineTo(canvas.width - 10, originY);
    ctx.lineTo(canvas.width - 20, originY + 6);
    ctx.fill();

    // 2. Draw Ticks
    for (let x = -5; x <= 5; x++) {
      const px = originX + x * spacing;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.moveTo(px, originY - 8);
      ctx.lineTo(px, originY + 8);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = x === 0 ? 'bold 13px Outfit, sans-serif' : '11px Outfit, sans-serif';
      ctx.fillStyle = x === 0 ? '#fff' : (x > 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)');
      ctx.fillText(x === 0 ? '0' : x.toString(), px, originY + 12);
    }

    // 3. Highlight Distance to Origin
    const pxA = originX + valA * spacing;
    
    if (valA !== 0) {
      // Glow background for distance
      ctx.save();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 6;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(pxA, originY);
      ctx.stroke();
      ctx.restore();

      // Draw dimension lines underneath
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(originX, originY - 15);
      ctx.lineTo(originX, originY - 25);
      ctx.moveTo(pxA, originY - 15);
      ctx.lineTo(pxA, originY - 25);
      ctx.moveTo(originX, originY - 20);
      ctx.lineTo(pxA, originY - 20);
      ctx.stroke();

      // Dimension Text: showing absolute value distance
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`距離 = ${Math.abs(valA)}`, (originX + pxA) / 2, originY - 34);
    }

    // 4. Draw Point A
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#fca5a5';
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(pxA, originY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText('A', pxA, originY - 22);
  }

  function updateTexts() {
    const absValCalc = Math.abs(valA);
    coordA.innerHTML = `\\(A(${valA})\\)`;
    absVal.innerHTML = `\\(|${valA}| = ${absValCalc}\\)`;

    let description = '';
    if (valA === 0) {
      description = `點 \\(A\\) 就在原點 \\(0\\) 處，它與原點的距離是 0。因此，絕對值 \\(|0| = 0\\)。`;
    } else {
      const directionStr = valA > 0 ? '右' : '左';
      description = `在數線上，點 \\(A(${valA})\\) 位於原點的${directionStr}側，牠與原點的距離是 \\(${absValCalc}\\) 個單位長。
      <br>因為「絕對值」代表點到原點的距離，因此我們得到：\\(|${valA}| = ${absValCalc}\\)。絕對值一定為非負數（正數或 0）。`;
    }

    feedback.innerHTML = `<div style="width: 100%; text-align: center; line-height: 1.6;">${description}</div>`;

    if (window.MathJax) {
      MathJax.typesetPromise([coordA, absVal, feedback]).catch(err => console.log(err));
    }
  }

  function getMouseX(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = (e.touches && e.touches.length > 0) 
      ? e.touches[0].clientX 
      : ((e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientX : e.clientX);
    const relativeX = clientX - rect.left;
    return relativeX * (canvas.width / rect.width);
  }

  function handleStart(e) {
    const mouseX = getMouseX(e);
    const pxA = originX + valA * spacing;

    if (Math.abs(mouseX - pxA) < 16) {
      isDragging = true;
      e.preventDefault();
    }
  }

  function handleMove(e) {
    if (!isDragging) {
      const mouseX = getMouseX(e);
      const pxA = originX + valA * spacing;
      if (Math.abs(mouseX - pxA) < 12) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
      return;
    }

    const mouseX = getMouseX(e);
    const relativeX = mouseX - originX;
    let gridVal = Math.round(relativeX / spacing);
    gridVal = Math.max(-5, Math.min(5, gridVal));
    valA = gridVal;

    drawAbsoluteValue();
    updateTexts();
    e.preventDefault();
  }

  function handleEnd() {
    isDragging = false;
  }

  canvas.addEventListener('mousedown', handleStart);
  canvas.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);

  canvas.addEventListener('touchstart', handleStart);
  canvas.addEventListener('touchmove', handleMove);
  window.addEventListener('touchend', handleEnd);

  drawAbsoluteValue();
  updateTexts();
}
