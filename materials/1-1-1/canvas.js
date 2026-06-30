document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quiz System
  initQuizSystem();

  // Initialize Canvas Simulations
  initConcept1Canvas();
  initConcept2Canvas();
  initConcept3Canvas();
  initConcept4Canvas();
});

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');
  
  // Correct answers mapping
  const answers = {
    '1-1': 'C',
    '1-2': 'B',
    '2-1': 'D',
    '2-2': 'C',
    '3-1': 'B',
    '3-2': 'B',
    '4-1': 'A',
    '4-2': 'C',
    '4-3': 'A'
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
    tempValSpan.innerHTML = temp > 0 ? `\(+${temp}^\circ\text{C}\)` : `\(${temp}^\circ\text{C}\)`; if (window.MathJax) { MathJax.typesetPromise([tempValSpan]).catch(err => console.log(err)); }
    tempValSpan.className = '';
    if (temp > 0) {
      tempValSpan.classList.add('positive');
      feedbackDiv.innerHTML = `正數 (如 \(+${temp}^\circ\text{C}\)) 代表溫度高於基準點 \(0^\circ\text{C}\)。數字越大代表越熱！`; if (window.MathJax) { MathJax.typesetPromise([feedbackDiv]).catch(err => console.log(err)); }
    } else if (temp < 0) {
      tempValSpan.classList.add('negative');
      // Highlight gelato storage temperature
      if (temp >= -25 && temp <= -18) {
        feedbackDiv.innerHTML = `<strong style="color: #10b981;">\(-${Math.abs(temp)}^\circ\text{C}\) 正處於義式冰淇淋的最佳儲存溫度 (\(-25^\circ\text{C} \sim -18^\circ\text{C}\))！</strong>`; if (window.MathJax) { MathJax.typesetPromise([feedbackDiv]).catch(err => console.log(err)); }
      } else if (temp >= -15 && temp <= -12) {
        feedbackDiv.innerHTML = `<strong style="color: #06b6d4;">\(-${Math.abs(temp)}^\circ\text{C}\) 正處於義式冰淇淋的最佳食用溫度 (\(-15^\circ\text{C} \sim -12^\circ\text{C}\))！</strong>`; if (window.MathJax) { MathJax.typesetPromise([feedbackDiv]).catch(err => console.log(err)); }
      } else {
        feedbackDiv.innerHTML = `負數 (如 \(-${Math.abs(temp)}^\circ\text{C}\)) 代表溫度低於基準點 \(0^\circ\text{C}\)。絕對值（數字部分）越大的負數，溫度越低！`; if (window.MathJax) { MathJax.typesetPromise([feedbackDiv]).catch(err => console.log(err)); }
      }
    } else {
      tempValSpan.classList.add('zero');
      feedbackDiv.innerHTML = `\(0^\circ\text{C}\) 是水結冰的溫度，也是正負溫度的分界點。\(0\) 既不是正數，也不是負數。`; if (window.MathJax) { MathJax.typesetPromise([feedbackDiv]).catch(err => console.log(err)); }
    }

    drawThermometer(temp);
  }

  slider.addEventListener('input', updateVisuals);
  updateVisuals(); // Initial Draw
}

/* ==========================================================================
   3. Concept 2: Draggable Coordinate Line
   ========================================================================== */
function initConcept2Canvas() {
  const canvas = document.getElementById('canvas-line');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const coordA = document.getElementById('coord-a');
  const coordB = document.getElementById('coord-b');
  const feedback = document.getElementById('line-feedback');

  // Logic values: integers between -5 and 5
  let valA = 2;
  let valB = -3;

  // Render parameters
  const originX = canvas.width / 2;
  const originY = 70;
  const spacing = 35; // Pixels per unit

  // Drag states
  let isDraggingA = false;
  let isDraggingB = false;

  function drawNumberLine() {
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

    // Direction text "正向"
    ctx.font = '11px Outfit, Noto Sans TC, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText("正向 (右)", canvas.width - 60, originY - 15);

    // 2. Draw Ticks & Labels
    for (let x = -5; x <= 5; x++) {
      const px = originX + x * spacing;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.moveTo(px, originY - 8);
      ctx.lineTo(px, originY + 8);
      ctx.stroke();

      // Labels below the line
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = x === 0 ? 'bold 13px Outfit, sans-serif' : '11px Outfit, sans-serif';
      ctx.fillStyle = x === 0 ? '#fff' : (x > 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)');
      ctx.fillText(x === 0 ? '0 (O)' : x.toString(), px, originY + 12);
    }

    // 3. Draw Points A & B
    const pxA = originX + valA * spacing;
    const pxB = originX + valB * spacing;

    // Draw Point A (Red)
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#f43f5e';
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(pxA, originY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0; // Reset
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText('A', pxA, originY - 22);

    // Draw Point B (Green)
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#10b981';
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(pxB, originY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0; // Reset
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText('B', pxB, originY - 22);
  }

  function updateTexts() {
    coordA.innerHTML = `\(A(${valA})\)`; if (window.MathJax) { MathJax.typesetPromise([coordA]).catch(err => console.log(err)); }
    coordB.innerHTML = `\(B(${valB})\)`; if (window.MathJax) { MathJax.typesetPromise([coordB]).catch(err => console.log(err)); }

    if (valA > valB) {
      feedback.innerHTML = `因為 \(A(${valA})\) 在 \(B(${valB})\) 的右邊，所以 <span style="color:#f43f5e;">\(${valA}\)</span> \(>\) <span style="color:#10b981;">\(${valB}\)</span>`; if (window.MathJax) { MathJax.typesetPromise([feedback]).catch(err => console.log(err)); }
    } else if (valA < valB) {
      feedback.innerHTML = `因為 \(A(${valA})\) 在 \(B(${valB})\) 的左邊，所以 <span style="color:#f43f5e;">\(${valA}\)</span> \(<\) <span style="color:#10b981;">\(${valB}\)</span>`; if (window.MathJax) { MathJax.typesetPromise([feedback]).catch(err => console.log(err)); }
    } else {
      feedback.innerHTML = `\(A(${valA})\) 與 \(B(${valB})\) 在同一個位置，所以 <span style="color:#f43f5e;">\(${valA}\)</span> \(=\) <span style="color:#10b981;">\(${valB}\)</span>`; if (window.MathJax) { MathJax.typesetPromise([feedback]).catch(err => console.log(err)); }
    }
  }

  // Handle Drag Events
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

    // Detect if clicking near A or B (threshold 15 pixels)
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
      // Change cursor to pointer if hovering over dots
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
    // Find closest integer value
    const relativeX = mouseX - originX;
    let gridVal = Math.round(relativeX / spacing);
    gridVal = Math.max(-5, Math.min(5, gridVal)); // Clamp bounds

    if (isDraggingA) {
      valA = gridVal;
    } else if (isDraggingB) {
      valB = gridVal;
    }

    drawNumberLine();
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

  drawNumberLine();
  updateTexts();
}

/* ==========================================================================
   4. Concept 3: Opposite Numbers Mirroring
   ========================================================================== */
function initConcept3Canvas() {
  const canvas = document.getElementById('canvas-opposite');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const oppASpan = document.getElementById('opp-a');
  const oppBSpan = document.getElementById('opp-b');
  const oppFeedback = document.getElementById('opp-feedback');

  let valA = 3;
  
  const originX = canvas.width / 2;
  const originY = 70;
  const spacing = 35;

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

    // Draw Ticks
    for (let x = -5; x <= 5; x++) {
      const px = originX + x * spacing;
      ctx.strokeStyle = x === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = x === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(px, originY - 8);
      ctx.lineTo(px, originY + 8);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = x === 0 ? 'bold 12px Outfit, sans-serif' : '10px Outfit, sans-serif';
      ctx.fillStyle = x === 0 ? '#fff' : 'rgba(255,255,255,0.5)';
      ctx.fillText(x === 0 ? '0 (O)' : x.toString(), px, originY + 12);
    }

    // 2. Draw Arc distances
    const pxA = originX + valA * spacing;
    const pxB = originX - valA * spacing; // B is opposite (-A)

    if (valA !== 0) {
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      // Draw arc for A
      ctx.beginPath();
      ctx.arc((originX + pxA) / 2, originY, Math.abs(valA * spacing) / 2, 0, Math.PI, true);
      ctx.stroke();

      // Draw arc for B
      ctx.beginPath();
      ctx.arc((originX + pxB) / 2, originY, Math.abs(valA * spacing) / 2, 0, Math.PI, true);
      ctx.stroke();

      ctx.setLineDash([]); // Reset

      // Distance Text Labels
      ctx.font = 'bold 11px Outfit, Noto Sans TC, sans-serif';
      ctx.fillStyle = '#c084fc';
      ctx.fillText(`距離 ${Math.abs(valA)}`, (originX + pxA) / 2, originY - Math.abs(valA * spacing) / 2 - 10);
      ctx.fillText(`距離 ${Math.abs(valA)}`, (originX + pxB) / 2, originY - Math.abs(valA * spacing) / 2 - 10);
    }

    // 3. Draw Dots A & B
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
    ctx.fillText('A', pxA, originY - 18);

    // Point B (Green - Opposite)
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#10b981';
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(pxB, originY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText("A' (相反數)", pxB, originY - 18);
  }

  function updateTexts() {
    oppASpan.innerHTML = valA > 0 ? `\(+${valA}\)` : `\(${valA}\)`;
    oppBSpan.innerHTML = -valA > 0 ? `\(+${-valA}\)` : `\(${-valA}\)`; if (window.MathJax) { MathJax.typesetPromise([oppASpan, oppBSpan]).catch(err => console.log(err)); }

    if (valA === 0) {
      oppFeedback.innerHTML = `<strong>\(0\) 的相反數規定就是 \(0\)</strong>。`; if (window.MathJax) { MathJax.typesetPromise([oppFeedback]).catch(err => console.log(err)); }
    } else {
      const positiveVal = Math.abs(valA);
      oppFeedback.innerHTML = `在原點兩側：<span style="color:#f43f5e;">\(A(${valA})\)</span> 與 <span style="color:#10b981;">\(A'(${-valA})\)</span> 到原點的距離都是 <strong style="color:#c084fc;">\(${positiveVal}\)</strong>，但方向相反，因此它們<strong>互為相反數</strong>。`; if (window.MathJax) { MathJax.typesetPromise([oppFeedback]).catch(err => console.log(err)); }
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
    if (Math.abs(mouseX - pxA) < 15) {
      isDragging = true;
      e.preventDefault();
    }
  }

  function handleMove(e) {
    const mouseX = getMouseX(e);
    if (!isDragging) {
      const pxA = originX + valA * spacing;
      if (Math.abs(mouseX - pxA) < 12) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
      return;
    }

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
   5. Concept 4: Absolute Value Distance Measure
   ========================================================================== */
function initConcept4Canvas() {
  const canvas = document.getElementById('canvas-abs');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const absCoord = document.getElementById('abs-coord');
  const absVal = document.getElementById('abs-val');
  const absFeedback = document.getElementById('abs-feedback');

  let valA = -4;
  
  const originX = canvas.width / 2;
  const originY = 70;
  const spacing = 35;

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

    // Draw Ticks
    for (let x = -5; x <= 5; x++) {
      const px = originX + x * spacing;
      ctx.strokeStyle = x === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = x === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(px, originY - 8);
      ctx.lineTo(px, originY + 8);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = x === 0 ? 'bold 12px Outfit, sans-serif' : '10px Outfit, sans-serif';
      ctx.fillStyle = x === 0 ? '#fff' : 'rgba(255,255,255,0.5)';
      ctx.fillText(x === 0 ? '0 (O)' : x.toString(), px, originY + 12);
    }

    // 2. Draw Distance Tape (Absolute Value Highlight)
    const pxA = originX + valA * spacing;
    
    if (valA !== 0) {
      // Background measuring bar (Cyan)
      ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
      const barLeft = Math.min(originX, pxA);
      const barWidth = Math.abs(valA * spacing);
      ctx.fillRect(barLeft, originY - 12, barWidth, 24);

      // Border and ticks on tape
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.strokeRect(barLeft, originY - 12, barWidth, 24);

      // Distance arrow lines inside
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(pxA, originY);
      ctx.stroke();
    }

    // 3. Draw Drag Dot A
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#f43f5e';
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(pxA, originY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText('A', pxA, originY - 20);
  }

  function updateTexts() {
    absCoord.innerHTML = valA > 0 ? `\(+${valA}\)` : `\(${valA}\)`;
    const absolute = Math.abs(valA);
    absVal.innerHTML = `\(${absolute}\)\`; if (window.MathJax) { MathJax.typesetPromise([absCoord, absVal]).catch(err => console.log(err)); }

    if (valA === 0) {
      absFeedback.innerHTML = `<strong>\(|0| = 0\)</strong>，代表原點到自己本身的距離是 \(0\)。`; if (window.MathJax) { MathJax.typesetPromise([absFeedback]).catch(err => console.log(err)); }
    } else {
      const codeStr = valA > 0 ? `+${valA}` : `${valA}`;
      let text = `<strong>|${codeStr}| ＝ ${absolute}</strong>，代表 <span style="color:#f43f5e;">A(${valA})</span> 與原點的距離是 ${absolute} 個單位長。`;
      
      // If it is a negative number, explain size comparison
      if (valA < 0) {
        text += `<br><span style="style: italic; color: #a855f7; font-size:0.9rem;">提示：${valA} 的絕對值是 ${absolute}，代表距離原點很遠。負數的絕對值越大，在數線上越靠左邊，所以其值越小。</span>`;
      }
      absFeedback.innerHTML = text; if (window.MathJax) { MathJax.typesetPromise([absFeedback]).catch(err => console.log(err)); }
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
    if (Math.abs(mouseX - pxA) < 15) {
      isDragging = true;
      e.preventDefault();
    }
  }

  function handleMove(e) {
    const mouseX = getMouseX(e);
    if (!isDragging) {
      const pxA = originX + valA * spacing;
      if (Math.abs(mouseX - pxA) < 12) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
      return;
    }

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
