// MathJax dynamic rendering helper
function triggerMathJax() {
  if (window.MathJax) {
    MathJax.typesetPromise();
  }
}

// ----------------------------------------------------
// Event coordinates alignment for Retina/Responsive Canvas
// ----------------------------------------------------
function getCanvasMouseCoords(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  let clientX = e.clientX;
  let clientY = e.clientY;
  
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  }
  
  const x = (clientX - rect.left) * (canvas.width / rect.width);
  const y = (clientY - rect.top) * (canvas.height / rect.height);
  return { x, y };
}

// ----------------------------------------------------
// Focus 1: Arc Reactor Energy Jump Canvas
// ----------------------------------------------------
const canvasReactor = document.getElementById('canvas-reactor');
if (canvasReactor) {
  const ctx = canvasReactor.getContext('2d');
  const rateSlider = document.getElementById('reactor-rate');
  const timeSlider = document.getElementById('reactor-time');
  const rateVal = document.getElementById('rate-val');
  const timeVal = document.getElementById('time-val');
  const feedback = document.getElementById('reactor-feedback');

  function drawReactorCanvas() {
    const rate = parseInt(rateSlider.value);
    const time = parseInt(timeSlider.value);
    const result = rate * time;
    
    // Update labels
    rateVal.innerText = rate > 0 ? `+${rate}%` : `${rate}%`;
    timeVal.innerText = time > 0 ? `+${time}秒` : `${time}秒`;
    
    // Update feedback text
    let rateText = rate >= 0 ? `每秒能量上升 \\(${rate}\\%\\)` : `每秒能量下降 \\(${Math.abs(rate)}\\%\\)（記為 \\(${rate}\\%\\)）`;
    let timeText = time >= 0 ? `在 \\(${time}\\) 秒後` : `在 \\(${Math.abs(time)}\\) 秒前（時間軸記為 \\(${time}\\) 秒）`;
    let resSignText = result >= 0 ? `比現在「高」\\(${result}\\%\\) （結果為正）` : `比現在「低」\\(${Math.abs(result)}\\%\\) （結果為負）`;
    feedback.innerHTML = `<div style="width:100%; text-align:center;">${rateText}，${timeText}，反應爐能量變化為：<br><span style="font-size:1.15rem; color:#f43f5e; font-weight:bold;">\\(${rate} \\times (${time}) = ${result > 0 ? '+' : ''}${result}\\%\\)</span>，${resSignText}</div>`;
    triggerMathJax();

    // Clear Canvas
    ctx.clearRect(0, 0, canvasReactor.width, canvasReactor.height);
    
    const W = canvasReactor.width;
    const H = canvasReactor.height;
    const centerY = H / 2 - 10;
    const padding = 40;
    const range = 25; // number line range: -25 to 25
    
    const getX = (val) => padding + (val + range) * (W - 2 * padding) / (2 * range);
    
    // Draw grid background glow
    ctx.save();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
    ctx.lineWidth = 1;
    for(let i = -20; i <= 20; i += 5) {
      ctx.beginPath();
      ctx.moveTo(getX(i), 0);
      ctx.lineTo(getX(i), H);
      ctx.stroke();
    }
    ctx.restore();

    // Draw Number Line (Single arrow pointing to the right as per standard definition)
    ctx.save();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding - 20, centerY);
    ctx.lineTo(W - padding + 20, centerY);
    ctx.stroke();
    
    // Draw Arrow on the positive side (Right only)
    ctx.beginPath();
    ctx.moveTo(W - padding + 20, centerY);
    ctx.lineTo(W - padding + 10, centerY - 6);
    ctx.lineTo(W - padding + 10, centerY + 6);
    ctx.closePath();
    ctx.fillStyle = '#94a3b8';
    ctx.fill();
    ctx.restore();
    
    // Draw ticks and labels
    ctx.save();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#64748b';
    
    for (let i = -25; i <= 25; i += 5) {
      const x = getX(i);
      ctx.beginPath();
      ctx.moveTo(x, centerY - 5);
      ctx.lineTo(x, centerY + 5);
      ctx.stroke();
      
      // Label
      ctx.fillText(i, x, centerY + 10);
    }
    ctx.restore();
    
    // Draw Origin Highlight
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(getX(0), centerY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Jump Animation / Static Curves
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    
    const finalVal = result;
    const finalX = getX(finalVal);
    
    // Determine color based on final position
    let strokeColor = '#38bdf8'; // positive (cyan)
    if (finalVal < 0) {
      strokeColor = '#f43f5e'; // negative (rose red)
    }
    ctx.strokeStyle = strokeColor;
    ctx.shadowColor = strokeColor;
    
    // Draw jumps
    const stepsCount = Math.abs(time);
    const stepDirection = time >= 0 ? 1 : -1;
    const jumpVal = rate * stepDirection; // value jumped per step
    
    let currentVal = 0;
    for (let step = 0; step < stepsCount; step++) {
      const startX = getX(currentVal);
      const nextVal = currentVal + jumpVal;
      const endX = getX(nextVal);
      
      // Draw jump arc
      ctx.beginPath();
      ctx.moveTo(startX, centerY);
      const cpX = (startX + endX) / 2;
      const cpY = centerY - 45 - (step * 5); // offset curves slightly to reduce overlap
      ctx.quadraticCurveTo(cpX, cpY, endX, centerY);
      ctx.stroke();
      
      // Draw jump direction arrow on arc
      const midX = (startX + endX) / 2;
      const midY = centerY - 22.5 - (step * 2.5);
      ctx.save();
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(midX, midY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      currentVal = nextVal;
    }
    ctx.restore();
    
    // Draw Tony's reactor at final position
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = strokeColor;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(finalX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Core details
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.arc(finalX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  rateSlider.addEventListener('input', drawReactorCanvas);
  timeSlider.addEventListener('input', drawReactorCanvas);
  
  // Initial draw
  drawReactorCanvas();
}

// ----------------------------------------------------
// Focus 2: Division Reverse Visualizer Canvas
// ----------------------------------------------------
const canvasDivision = document.getElementById('canvas-division');
if (canvasDivision) {
  const ctx = canvasDivision.getContext('2d');
  const dividendSlider = document.getElementById('div-dividend');
  const divisorSlider = document.getElementById('div-divisor');
  const dividendVal = document.getElementById('dividend-val');
  const divisorVal = document.getElementById('divisor-val');
  const feedback = document.getElementById('division-feedback');

  function drawDivisionCanvas() {
    const total = parseInt(dividendSlider.value);
    let count = parseInt(divisorSlider.value);
    
    // Prevent division by 0
    if (count === 0) {
      count = 1;
      divisorSlider.value = 1;
    }
    
    const quotient = total / count;
    
    // Update labels
    dividendVal.innerText = total >= 0 ? `+${total}%` : `${total}%`;
    divisorVal.innerText = count > 0 ? `+${count}秒` : `${count}秒`;
    
    let totalText = total >= 0 ? `總能量變化為上升 \\(${total}\\%\\)` : `總能量變化為下降 \\(${Math.abs(total)}\\%\\)（記為 \\(${total}\\%\\)）`;
    let countText = count > 0 ? `在 \\(${count}\\) 秒內發生` : `在 \\(${Math.abs(count)}\\) 秒前逆向推算（時間變化 \\(${count}\\) 秒）`;
    let quotientSignText = quotient >= 0 ? `平均每秒能量「上升」\\(${quotient.toFixed(1)}\\%\\)（同號得正）` : `平均每秒能量「下降」\\(${Math.abs(quotient).toFixed(1)}\\%\\)（異號得負）`;
    
    feedback.innerHTML = `<div style="width:100%; text-align:center;">${totalText}，${countText}，則：<br><span style="font-size:1.15rem; color:#06b6d4; font-weight:bold;">\\(${total} \\div (${count}) = ${quotient >= 0 ? '+' : ''}${quotient.toFixed(1)}\\%\\)</span>，${quotientSignText}</div>`;
    triggerMathJax();

    // Clear
    ctx.clearRect(0, 0, canvasDivision.width, canvasDivision.height);
    
    const W = canvasDivision.width;
    const H = canvasDivision.height;
    const centerY = H / 2 - 10;
    const padding = 40;
    const range = 25;
    
    const getX = (val) => padding + (val + range) * (W - 2 * padding) / (2 * range);

    // Number Line (Standard)
    ctx.save();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding - 20, centerY);
    ctx.lineTo(W - padding + 20, centerY);
    ctx.stroke();
    
    // Arrow (Right side only)
    ctx.beginPath();
    ctx.moveTo(W - padding + 20, centerY);
    ctx.lineTo(W - padding + 10, centerY - 6);
    ctx.lineTo(W - padding + 10, centerY + 6);
    ctx.closePath();
    ctx.fillStyle = '#94a3b8';
    ctx.fill();
    ctx.restore();
    
    // Ticks & Labels
    ctx.save();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#64748b';
    
    for (let i = -25; i <= 25; i += 5) {
      const x = getX(i);
      ctx.beginPath();
      ctx.moveTo(x, centerY - 5);
      ctx.lineTo(x, centerY + 5);
      ctx.stroke();
      ctx.fillText(i, x, centerY + 10);
    }
    ctx.restore();

    // Draw total segment
    const startX = getX(0);
    const endX = getX(total);
    
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, centerY);
    ctx.lineTo(endX, centerY);
    ctx.stroke();
    
    // Draw subdivision arrows
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    const color = quotient >= 0 ? '#10b981' : '#ef4444';
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    
    const stepsCount = Math.abs(count);
    const stepSize = total / stepsCount;
    
    for (let i = 0; i < stepsCount; i++) {
      const segmentStart = getX(i * stepSize);
      const segmentEnd = getX((i + 1) * stepSize);
      
      // Draw sub segment line
      ctx.beginPath();
      ctx.moveTo(segmentStart, centerY - 15);
      ctx.lineTo(segmentEnd, centerY - 15);
      ctx.stroke();
      
      // Arrow head on sub segment
      const dx = segmentEnd - segmentStart;
      const angle = Math.atan2(0, dx);
      ctx.beginPath();
      ctx.moveTo(segmentEnd, centerY - 15);
      ctx.lineTo(segmentEnd - 8 * Math.cos(angle - Math.PI/6), centerY - 15 - 8 * Math.sin(angle - Math.PI/6));
      ctx.lineTo(segmentEnd - 8 * Math.cos(angle + Math.PI/6), centerY - 15 - 8 * Math.sin(angle + Math.PI/6));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Highlight target point
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(endX, centerY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  dividendSlider.addEventListener('input', drawDivisionCanvas);
  divisorSlider.addEventListener('input', drawDivisionCanvas);
  
  // Initial draw
  drawDivisionCanvas();
}

// ----------------------------------------------------
// Focus 3: Order of Operations Dynamic Step Visualizer
// ----------------------------------------------------
const expressions = [
  {
    expr: "7 + 4 \\times (-3)",
    steps: [
      { text: "原始算式：7 + 4 \\times (-3)", code: "7 + 4 * (-3)", activePart: [4, 13] },
      { text: "第一步：先算乘除 \\(4 \\times (-3) = -12\\)", code: "7 + (-12)", activePart: [2, 9] },
      { text: "第二步：再算加減 \\(7 + (-12) = -5\\)", code: "-5", activePart: [0, 2] }
    ]
  },
  {
    expr: "(-60) \\div [ (-7) \\times 2 - 1 ]",
    steps: [
      { text: "原始算式：(-60) \\div [ (-7) \\times 2 - 1 ]", code: "(-60) / [ (-7) * 2 - 1 ]", activePart: [9, 18] },
      { text: "第一步：括號內先算乘法 \\((-7) \\times 2 = -14\\)", code: "(-60) / [ -14 - 1 ]", activePart: [9, 16] },
      { text: "第二步：算完括號內減法 \\(-14 - 1 = -15\\)", code: "(-60) / (-15)", activePart: [0, 14] },
      { text: "第三步：計算最後的除法 \\((-60) \\div (-15) = 4\\)", code: "4", activePart: [0, 1] }
    ]
  },
  {
    expr: "(-8) \\times 6 + | (-5) \\times 10 - 1 |",
    steps: [
      { text: "原始算式：(-8) \\times 6 + | (-5) \\times 10 - 1 |", code: "(-8) * 6 + | (-5) * 10 - 1 |", activePart: [12, 27] },
      { text: "第一步：優先計算絕對值內的乘法 \\((-5) \\times 10 = -50\\)", code: "(-8) * 6 + | -50 - 1 |", activePart: [12, 21] },
      { text: "第二步：算出絕對值內的值 \\(|-50 - 1| = |-51| = 51\\)", code: "(-8) * 6 + 51", activePart: [0, 9] },
      { text: "第三步：計算乘除 \\((-8) \\times 6 = -48\\)", code: "-48 + 51", activePart: [0, 8] },
      { text: "第四步：計算最後的加減 \\(-48 + 51 = 3\\)", code: "3", activePart: [0, 1] }
    ]
  }
];

let selectedExprIdx = 0;
let currentStepIdx = 0;

const canvasOps = document.getElementById('canvas-ops');
if (canvasOps) {
  const ctx = canvasOps.getContext('2d');
  const prevBtn = document.getElementById('step-prev');
  const nextBtn = document.getElementById('step-next');
  const exprBtns = document.querySelectorAll('.btn-select-expr');
  const stepListContainer = document.getElementById('ops-steps-list');

  function renderOpsCanvas() {
    ctx.clearRect(0, 0, canvasOps.width, canvasOps.height);
    
    const exprData = expressions[selectedExprIdx];
    const steps = exprData.steps;
    const currentStep = steps[currentStepIdx];
    
    const W = canvasOps.width;
    const H = canvasOps.height;
    
    // Draw sci-fi screen borders
    ctx.save();
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(5, 5, W - 10, H - 10);
    ctx.restore();

    // Render Steps Text List
    updateStepsUI(steps);

    // Draw active equation on Canvas
    ctx.save();
    ctx.font = '28px Outfit, sans-serif, "Noto Sans TC"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8fafc';
    
    const cleanCodeStr = currentStep.code;
    // Replace standard math symbols for display
    let displayStr = cleanCodeStr
      .replace(/\*/g, '×')
      .replace(/\//g, '÷')
      .replace(/\|/g, '|');
      
    ctx.fillText(displayStr, W / 2, H / 2);
    ctx.restore();
    
    // Highlight active operation part
    if (currentStep.activePart && currentStepIdx < steps.length - 1) {
      ctx.save();
      ctx.font = '28px Outfit, sans-serif, "Noto Sans TC"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const partStart = currentStep.activePart[0];
      const partEnd = currentStep.activePart[1];
      
      const fullText = currentStep.code.replace(/\*/g, '×').replace(/\//g, '÷');
      const textBefore = fullText.substring(0, partStart);
      const textActive = fullText.substring(partStart, partEnd);
      
      const widthFull = ctx.measureText(fullText).width;
      const widthBefore = ctx.measureText(textBefore).width;
      const widthActive = ctx.measureText(textActive).width;
      
      const startX = (W / 2) - (widthFull / 2) + widthBefore;
      const activeCenterX = startX + (widthActive / 2);
      
      // Draw neon border around active calculation part
      ctx.strokeStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(startX - 4, H / 2 - 25, widthActive + 8, 50);
      ctx.restore();
    }
    
    // Update Button status
    prevBtn.disabled = currentStepIdx === 0;
    nextBtn.disabled = currentStepIdx === steps.length - 1;
  }

  function updateStepsUI(steps) {
    stepListContainer.innerHTML = '';
    steps.forEach((step, idx) => {
      const activeClass = idx === currentStepIdx ? 'active' : '';
      const div = document.createElement('div');
      div.className = `step-card ${activeClass}`;
      div.innerHTML = `
        <div class="step-badge">${idx + 1}</div>
        <div class="step-text">${step.text}</div>
      `;
      stepListContainer.appendChild(div);
    });
    triggerMathJax();
  }

  exprBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      exprBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedExprIdx = idx;
      currentStepIdx = 0;
      renderOpsCanvas();
    });
  });

  prevBtn.addEventListener('click', () => {
    if (currentStepIdx > 0) {
      currentStepIdx--;
      renderOpsCanvas();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentStepIdx < expressions[selectedExprIdx].steps.length - 1) {
      currentStepIdx++;
      renderOpsCanvas();
    }
  });

  // Initial render
  renderOpsCanvas();
}

// ----------------------------------------------------
// Focus 4: Distributive Law Area & Grouping Visualizer
// ----------------------------------------------------
const canvasDistributor = document.getElementById('canvas-distributor');
if (canvasDistributor) {
  const ctx = canvasDistributor.getContext('2d');
  const packagesSlider = document.getElementById('dist-packages');
  const reactorsSlider = document.getElementById('dist-reactors');
  const websSlider = document.getElementById('dist-webs');
  
  const packagesVal = document.getElementById('packages-val');
  const reactorsVal = document.getElementById('reactors-val');
  const websVal = document.getElementById('webs-val');
  
  const toggleGrouped = document.getElementById('btn-layout-grouped');
  const toggleDistributed = document.getElementById('btn-layout-distributed');
  const feedback = document.getElementById('distributor-feedback');

  let currentLayout = 'grouped'; // or 'distributed'

  function drawDistributor() {
    const C = parseInt(packagesSlider.value);
    const A = parseInt(reactorsSlider.value);
    const B = parseInt(websSlider.value);
    const total = C * (A + B);
    
    // Update labels
    packagesVal.innerText = `${C} 份`;
    reactorsVal.innerText = `${A} 個`;
    websVal.innerText = `${B} 個`;

    // Formula feedback
    if (currentLayout === 'grouped') {
      feedback.innerHTML = `<div style="width:100%; text-align:center;">結合式佈局：將每份打包好在一起算。<br><span style="font-size:1.15rem; color:#fbbf24; font-weight:bold;">\\(${C} \\times (${A} + ${B}) = ${C} \\times ${A + B} = ${total}\\)</span> 個裝備</div>`;
    } else {
      feedback.innerHTML = `<div style="width:100%; text-align:center;">分配式佈局：分別把鋼鐵與蜘蛛裝備加總。<br><span style="font-size:1.15rem; color:#fbbf24; font-weight:bold;">\\(${C} \\times ${A} + ${C} \\times ${B} = ${C * A} + ${C * B} = ${total}\\)</span> 個裝備</div>`;
    }
    triggerMathJax();

    // Clear
    ctx.clearRect(0, 0, canvasDistributor.width, canvasDistributor.height);
    
    const W = canvasDistributor.width;
    const H = canvasDistributor.height;
    
    ctx.save();
    if (currentLayout === 'grouped') {
      // Draw Grouped Layout: C boxes
      const boxW = 135;
      const boxH = 100;
      const gapX = 15;
      const gapY = 15;
      
      const cols = C <= 3 ? C : Math.ceil(C / 2);
      const rows = C <= 3 ? 1 : 2;
      
      const startX = (W - (cols * boxW + (cols - 1) * gapX)) / 2;
      const startY = (H - (rows * boxH + (rows - 1) * gapY)) / 2;
      
      let index = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (index >= C) break;
          const bx = startX + c * (boxW + gapX);
          const by = startY + r * (boxH + gapY);
          
          // Draw package box outline
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
          ctx.lineWidth = 2;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
          ctx.strokeRect(bx, by, boxW, boxH);
          ctx.fillRect(bx, by, boxW, boxH);
          
          // Draw label "Package i"
          ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
          ctx.font = '10px Outfit';
          ctx.fillText(`BOX ${index + 1}`, bx + 8, by + 16);
          
          // Draw Reactors (A) in the left side of the box
          for (let i = 0; i < A; i++) {
            const rx = bx + 30 + (i % 2) * 18;
            const ry = by + 35 + Math.floor(i / 2) * 18;
            drawMiniReactor(rx, ry, 6);
          }
          
          // Draw Web-shooters (B) in the right side of the box
          for (let j = 0; j < B; j++) {
            const wx = bx + boxW - 40 + (j % 2) * 18;
            const wy = by + 35 + Math.floor(j / 2) * 18;
            drawMiniWeb(wx, wy, 6);
          }
          
          index++;
        }
      }
    } else {
      // Draw Distributed Layout: All reactors on left, all webs on right
      const groupW = 200;
      const groupH = H - 40;
      
      // Left Group (Reactors): C * A
      const rxStart = 30;
      const ryStart = 30;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rxStart, ryStart, groupW, groupH);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
      ctx.fillRect(rxStart, ryStart, groupW, groupH);
      
      ctx.fillStyle = '#fca5a5';
      ctx.font = '12px Outfit, sans-serif, "Noto Sans TC"';
      ctx.fillText(`鋼鐵裝備: ${C} × ${A} = ${C * A}`, rxStart + 10, ryStart + 20);
      
      const totalR = C * A;
      for (let i = 0; i < totalR; i++) {
        const itemX = rxStart + 25 + (i % 6) * 28;
        const itemY = ryStart + 45 + Math.floor(i / 6) * 28;
        drawMiniReactor(itemX, itemY, 8);
      }
      
      // Right Group (Web-shooters): C * B
      const wxStart = W - groupW - 30;
      const wyStart = 30;
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wxStart, wyStart, groupW, groupH);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
      ctx.fillRect(wxStart, wyStart, groupW, groupH);
      
      ctx.fillStyle = '#93c5fd';
      ctx.fillText(`蜘蛛裝備: ${C} × ${B} = ${C * B}`, wxStart + 10, wyStart + 20);
      
      const totalW = C * B;
      for (let j = 0; j < totalW; j++) {
        const itemX = wxStart + 25 + (j % 6) * 28;
        const itemY = wyStart + 45 + Math.floor(j / 6) * 28;
        drawMiniWeb(itemX, itemY, 8);
      }
    }
    ctx.restore();
  }

  function drawMiniReactor(x, y, r) {
    ctx.save();
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#ef4444';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawMiniWeb(x, y, r) {
    ctx.save();
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#3b82f6';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw cross inside to make it look like a web-shooter
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.lineTo(x + r, y);
    ctx.moveTo(x, y - r);
    ctx.lineTo(x, y + r);
    ctx.stroke();
    ctx.restore();
  }

  packagesSlider.addEventListener('input', drawDistributor);
  reactorsSlider.addEventListener('input', drawDistributor);
  websSlider.addEventListener('input', drawDistributor);
  
  toggleGrouped.addEventListener('click', () => {
    toggleGrouped.classList.add('active');
    toggleDistributed.classList.remove('active');
    currentLayout = 'grouped';
    drawDistributor();
  });

  toggleDistributed.addEventListener('click', () => {
    toggleDistributed.classList.add('active');
    toggleGrouped.classList.remove('active');
    currentLayout = 'distributed';
    drawDistributor();
  });

  // Initial draw
  drawDistributor();
}

// ----------------------------------------------------
// Quiz Submissions Feedback and Unlock mechanism
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const quizCards = document.querySelectorAll('.quiz-card');
  
  quizCards.forEach(card => {
    const radios = card.querySelectorAll('input[type="radio"]');
    const checkBtn = card.querySelector('.btn-check-ans');
    const feedbackBox = card.querySelector('.explanation-box');
    const optionLabels = card.querySelectorAll('.option-label');
    
    // Enable button on select
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        // Clear selected class from other options
        optionLabels.forEach(label => label.classList.remove('selected'));
        // Add selected class to the label of this radio
        const selectedLabel = radio.closest('.option-label');
        if (selectedLabel) {
          selectedLabel.classList.add('selected');
        }
        
        checkBtn.disabled = false;
      });
    });
    
    // Check Answer logic
    checkBtn.addEventListener('click', () => {
      // Find selected answer
      const selectedRadio = card.querySelector('input[type="radio"]:checked');
      if (!selectedRadio) return;
      
      const userAnswer = selectedRadio.value;
      
      // Read correct answer from attribute or custom definition
      // We'll define the correct answer in the HTML data-correct attribute
      const correctAnswer = card.getAttribute('data-correct') || 'A';
      const isCorrect = userAnswer === correctAnswer;
      
      // Update styling
      optionLabels.forEach(label => {
        const input = label.querySelector('input[type="radio"]');
        input.disabled = true; // disable choices
        
        if (input.value === correctAnswer) {
          label.classList.add('correct');
        } else if (input.checked) {
          label.classList.add('incorrect');
        }
      });
      
      // Disable check button
      checkBtn.disabled = true;
      checkBtn.style.display = 'none';
      
      // Show feedback
      feedbackBox.className = `explanation-box ${isCorrect ? 'correct' : 'incorrect'}`;
      const titleBox = feedbackBox.querySelector('.explanation-title');
      titleBox.innerHTML = isCorrect 
        ? '<i class="fa-solid fa-circle-check"></i> 回答正確！' 
        : '<i class="fa-solid fa-circle-xmark"></i> 回答錯誤！';
      
      // Smooth slideDown transition for feedback box
      feedbackBox.style.display = 'block';
      feedbackBox.style.opacity = 0;
      feedbackBox.style.maxHeight = '0px';
      feedbackBox.style.overflow = 'hidden';
      feedbackBox.style.transition = 'all 0.5s ease';
      
      setTimeout(() => {
        feedbackBox.style.opacity = 1;
        feedbackBox.style.maxHeight = '500px';
      }, 50);
      
      triggerMathJax();
    });
  });
});
