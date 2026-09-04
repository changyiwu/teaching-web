document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quiz System
  initQuizSystem();

  // Initialize Canvas Simulations
  initCommonCanvas();
  initGcdLadderCanvas();
  initMultipleCanvas();
  initLcmLadderCanvas();
  initTowerCanvas();
  initApplyCanvas({ canvasId: 'canvas-apply-gcd', prefix: 'apg', group: 'gcd', defMode: 'pack' });
  initApplyCanvas({ canvasId: 'canvas-apply-lcm', prefix: 'apl', group: 'lcm', defMode: 'cycle' });
});

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // Correct answers mapping for Section 2-2 (12 Quizzes)
  const answers = {
    '2-2-1-1': 'C', // (54 , 72) = 18，公因數即 18 的因數，共 6 個
    '2-2-1-2': 'B', // 互質：14 與 15
    '2-2-2-1': 'D', // (140 , 210 , 350) = 70
    '2-2-2-2': 'B', // 左欄 2、2、3，底列 5、7 => 60 與 84
    '2-2-3-1': 'C', // [8 , 12] = 24，1~200 之間共 8 個
    '2-2-3-2': 'B', // 公倍數必為最小公倍數的倍數
    '2-2-4-1': 'D', // [18 , 24 , 30] = 360
    '2-2-4-2': 'C', // [12 , 18 , 27] = 108
    '2-2-5-1': 'B', // 取共同質因數次方最小者 => 2 x 3^2
    '2-2-5-2': 'A', // a x b = (a,b) x [a,b] => 8 x 120 = 960
    '2-2-6-1': 'C', // (48 , 72) = 24 => 最多可分成 24 袋
    '2-2-6-2': 'B', // (84 , 60) = 12，周長 288 / 12 = 24 根（繞一圈不加 1）
    '2-2-7-1': 'D', // [12 , 16] = 48 分鐘後再度同時發車
    '2-2-7-2': 'C'  // [8 , 6] = 24，3 x 4 = 12 塊
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
   2. 本節配色與數論工具（通用繪圖工具在 ../math-canvas.js）
   ========================================================================== */
// 兩個主角的固定配色：甲＝天青、乙＝洋紅、丙＝香檳金
const COLOR_A = '#67e8f9';
const COLOR_B = '#f9a8d4';
const COLOR_C = '#fde047';

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47,
  53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113,
  127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199];

function gcdAll(list) {
  return list.reduce((acc, v) => gcd(acc, v));
}

function lcm2(a, b) {
  return a / gcd(a, b) * b;
}

function lcmAll(list) {
  return list.reduce((acc, v) => lcm2(acc, v));
}

function divisorsOf(n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) out.push(i);
  }
  return out;
}

// 質因數分解 → [{p, e}, ...]
function factorList(n) {
  const out = [];
  let cur = n;
  for (const p of PRIMES) {
    if (p * p > cur) break;
    let e = 0;
    while (cur % p === 0) { cur /= p; e++; }
    if (e) out.push({ p, e });
  }
  if (cur > 1) out.push({ p: cur, e: 1 });
  return out;
}

// 標準分解式的 LaTeX 字串（JS 模板字串內一律雙反斜線）
function stdLatex(list) {
  if (!list.length) return '1';
  return list.map(g => (g.e > 1 ? `${g.p}^{${g.e}}` : `${g.p}`)).join(' \\times ');
}

// 畫「底數^指數」，回傳寬度
function drawPower(ctx, base, exp, x, y, size, color) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.font = f(800, size);
  const bw = ctx.measureText(base).width;
  ctx.fillText(base, x, y);
  if (exp === null || exp === 1) return bw;
  const kern = size * POW_KERN;
  ctx.font = f(800, Math.round(size * 0.62));
  const ew = ctx.measureText(String(exp)).width;
  ctx.fillText(String(exp), x + bw + kern, y - size * 0.42);
  return bw + kern + ew;
}

function measurePower(ctx, base, exp, size) {
  ctx.font = f(800, size);
  const bw = ctx.measureText(base).width;
  if (exp === null || exp === 1) return bw;
  const kern = size * POW_KERN;
  ctx.font = f(800, Math.round(size * 0.62));
  return bw + kern + ctx.measureText(String(exp)).width;
}

// 把一串 {p, e} 以「p^e × p^e」的形式置中畫出，回傳結束的 x
function drawStdForm(ctx, list, centerX, baselineY, size, color, prefix) {
  const pre = prefix || '';
  ctx.font = f(800, size);
  let total = pre ? ctx.measureText(pre).width : 0;
  list.forEach((g, i) => {
    total += measurePower(ctx, String(g.p), g.e, size);
    if (i < list.length - 1) {
      ctx.font = f(800, size);
      total += ctx.measureText(' × ').width;
    }
  });
  if (!list.length) {
    ctx.font = f(800, size);
    total += ctx.measureText('1').width;
  }

  let x = centerX - total / 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if (pre) {
    ctx.fillStyle = '#f8fafc';
    ctx.font = f(800, size);
    ctx.fillText(pre, x, baselineY);
    x += ctx.measureText(pre).width;
  }
  if (!list.length) {
    ctx.fillStyle = color;
    ctx.font = f(800, size);
    ctx.fillText('1', x, baselineY);
    x += ctx.measureText('1').width;
  }
  list.forEach((g, i) => {
    x += drawPower(ctx, String(g.p), g.e, x, baselineY, size, color);
    if (i < list.length - 1) {
      ctx.font = f(800, size);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(' × ', x, baselineY);
      x += ctx.measureText(' × ').width;
    }
  });
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  return x;
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
   3. 重點 1：公因數探照燈
   ========================================================================== */
function initCommonCanvas() {
  const canvas = document.getElementById('canvas-common');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderA = document.getElementById('cf-a-slider');
  const sliderB = document.getElementById('cf-b-slider');
  const valA = document.getElementById('cf-a-val');
  const valB = document.getElementById('cf-b-val');
  const formula = document.getElementById('cf-formula');
  const feedback = document.getElementById('cf-feedback');

  // 畫一整列因數方塊，公因數用薄荷綠點亮；回傳這一列的底部 y
  function drawFactorRow(label, n, common, color, topY) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.font = f(700, 16);
    ctx.fillText(label, 16, topY);

    const divs = divisorsOf(n);
    const startX = 16;
    const maxX = canvas.width - 16;
    const chipH = 30;
    let cx = startX;
    let cy = topY + 28;

    divs.forEach(d => {
      ctx.font = f(800, 18);
      const w = Math.max(38, ctx.measureText(String(d)).width + 20);
      if (cx + w > maxX) { cx = startX; cy += chipH + 8; }

      const isCommon = common.indexOf(d) >= 0;
      ctx.fillStyle = isCommon ? 'rgba(52, 211, 153, 0.18)' : 'rgba(148, 163, 184, 0.08)';
      roundRect(ctx, cx, cy - chipH / 2, w, chipH, 8);
      ctx.fill();
      ctx.strokeStyle = isCommon ? OK_COLOR : 'rgba(148, 163, 184, 0.28)';
      ctx.lineWidth = isCommon ? 2 : 1;
      ctx.stroke();

      ctx.fillStyle = isCommon ? OK_COLOR : '#cbd5e1';
      ctx.font = f(800, 18);
      ctx.textAlign = 'center';
      ctx.fillText(String(d), cx + w / 2, cy);
      ctx.textAlign = 'left';

      cx += w + 7;
    });

    return cy + chipH / 2;
  }

  function draw() {
    const a = parseInt(sliderA.value, 10);
    const b = parseInt(sliderB.value, 10);
    const g = gcd(a, b);
    const common = divisorsOf(g);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fda4af';
    ctx.font = f(700, 16);
    ctx.fillText('兩排都亮起來的，就是公因數；最大的那一個就是最大公因數', canvas.width / 2, 20);

    let y = drawFactorRow(`${a} 的因數`, a, common, COLOR_A, 52);
    y = drawFactorRow(`${b} 的因數`, b, common, COLOR_B, y + 34);

    // 結論緊接在因數列下方；因數少、只排一行時才不會在中間留一大塊空白
    const baseY = Math.min(y + 44, canvas.height - 66);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#94a3b8';
    ctx.font = f(500, 14);
    ctx.fillText(`公因數：${common.join('、')}　（正好是 ${g} 的所有因數）`, canvas.width / 2, baseY - 4);

    ctx.fillStyle = OK_COLOR;
    ctx.font = f(800, 26);
    ctx.fillText(`( ${a} , ${b} ) = ${g}`, canvas.width / 2, baseY + 30);

    drawVerdictChip(ctx, canvas.width - 152, baseY + 8, 136, 46,
      g === 1 ? '互質' : '不互質', g === 1,
      g === 1 ? '最大公因數是 1' : `還有公因數 ${g}`);

    valA.textContent = a;
    valB.textContent = b;
    formula.innerHTML = `\\( ( ${a} , ${b} ) = ${g} \\)`;
    feedback.innerHTML = wrapFeedback(
      `\\( ${a} \\) 與 \\( ${b} \\) 的公因數共有 <strong>${common.length}</strong> 個，` +
      `最大的是 <strong>${g}</strong>；這些公因數 <strong>${common.join('、')}</strong> 剛好就是 \\( ${g} \\) 的全部因數。` +
      (g === 1 ? '　兩數的最大公因數為 1，所以它們<strong>互質</strong>。' : '')
    );
    typeset([formula, feedback]);
  }

  sliderA.addEventListener('input', draw);
  sliderB.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   4. 重點 2：最大公因數短除機
   ========================================================================== */

// 一路除以「共同的質因數」，直到沒有共同質因數為止
function gcdLadder(nums) {
  const rows = [];
  let cur = nums.slice();
  while (true) {
    let p = null;
    for (const q of PRIMES) {
      if (q > Math.min.apply(null, cur)) break;
      if (cur.every(v => v % q === 0)) { p = q; break; }
    }
    if (!p) break;
    rows.push({ p, before: cur.slice() });
    cur = cur.map(v => v / p);
  }
  return { rows, last: cur };
}

// 共用的短除法梯形繪製；回傳最下面一列的 y
function drawLadder(ctx, ladder, opts) {
  const { rows, last } = ladder;
  const colCount = last.length;
  const colW = opts.colW || 92;
  const rowH = opts.rowH || 34;
  const topY = opts.topY;
  const colors = opts.colors;

  const bodyW = colCount * colW;
  const divisorW = 54;
  const leftX = (ctx.canvas.width - (divisorW + 10 + bodyW)) / 2;
  const bracketX = leftX + divisorW;
  const rightX = bracketX + 10 + bodyW;

  const colCenter = i => bracketX + 10 + colW * i + colW / 2;

  rows.forEach((r, i) => {
    const y = topY + i * rowH;

    // 除數
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = opts.divisorColor || '#fde047';
    ctx.font = f(800, 20);
    ctx.fillText(String(r.p), bracketX - 10, y);

    // ⌐ 形：右側直線＋下方橫線
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(bracketX, y - rowH / 2 + 3);
    ctx.lineTo(bracketX, y + rowH / 2);
    ctx.lineTo(rightX, y + rowH / 2);
    ctx.stroke();

    // 被除的數
    r.before.forEach((v, c) => {
      ctx.textAlign = 'center';
      ctx.fillStyle = colors[c];
      ctx.font = f(800, 20);
      ctx.fillText(String(v), colCenter(c), y);
    });
  });

  const lastY = topY + rows.length * rowH;
  last.forEach((v, c) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colors[c];
    ctx.font = f(800, 20);
    ctx.fillText(String(v), colCenter(c), lastY);
  });

  return { lastY, leftX, rightX, colCenter };
}

function initGcdLadderCanvas() {
  const canvas = document.getElementById('canvas-gcd');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderA = document.getElementById('gl-a-slider');
  const sliderB = document.getElementById('gl-b-slider');
  const valA = document.getElementById('gl-a-val');
  const valB = document.getElementById('gl-b-val');
  const formula = document.getElementById('gl-formula');
  const feedback = document.getElementById('gl-feedback');

  function draw() {
    const a = parseInt(sliderA.value, 10);
    const b = parseInt(sliderB.value, 10);
    const ladder = gcdLadder([a, b]);
    const g = gcd(a, b);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#67e8f9';
    ctx.font = f(700, 16);
    ctx.fillText('每一層都除以「兩數共同的質因數」，除到沒有共同質因數為止', canvas.width / 2, 20);

    const info = drawLadder(ctx, ladder, {
      topY: 62,
      rowH: 34,
      colW: 96,
      colors: [COLOR_A, COLOR_B],
      divisorColor: '#fde047'
    });

    // 左側除數的括號提示
    if (ladder.rows.length) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(253, 224, 71, 0.75)';
      ctx.font = f(600, 12);
      ctx.fillText('公因數', info.leftX + 22, 42);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = f(500, 13);
    ctx.fillText(
      ladder.rows.length
        ? `最下面一列 ${ladder.last.join('、')} 已經沒有共同質因數了`
        : `${a} 和 ${b} 一開始就沒有共同質因數`,
      canvas.width / 2, info.lastY + 30
    );

    // 結論：左側除數的連乘積
    const chain = ladder.rows.map(r => r.p);
    ctx.fillStyle = OK_COLOR;
    ctx.font = f(800, 22);
    ctx.fillText(
      chain.length
        ? `( ${a} , ${b} ) = ${chain.join(' × ')} = ${g}`
        : `( ${a} , ${b} ) = 1　（互質）`,
      canvas.width / 2, Math.min(info.lastY + 72, canvas.height - 28)
    );

    valA.textContent = a;
    valB.textContent = b;
    formula.innerHTML = `\\( ( ${a} , ${b} ) = ${g} \\)`;
    feedback.innerHTML = wrapFeedback(
      chain.length
        ? `把左側除過的公因數 <strong>${chain.join(' × ')}</strong> 乘起來就是最大公因數 <strong>${g}</strong>；` +
          `最下面一列的 \\( ${ladder.last.join(' \\)、\\( ')} \\) 已經<strong>沒有共同質因數</strong>，所以停在這裡。`
        : `\\( ${a} \\) 與 \\( ${b} \\) 第一層就找不到共同的質因數，代表它們<strong>互質</strong>，最大公因數為 <strong>1</strong>。`
    );
    typeset([formula, feedback]);
  }

  sliderA.addEventListener('input', draw);
  sliderB.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   5. 重點 3：倍數數線交會器
   ========================================================================== */
function initMultipleCanvas() {
  const canvas = document.getElementById('canvas-multiple');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderA = document.getElementById('mu-a-slider');
  const sliderB = document.getElementById('mu-b-slider');
  const valA = document.getElementById('mu-a-val');
  const valB = document.getElementById('mu-b-val');
  const formula = document.getElementById('mu-formula');
  const feedback = document.getElementById('mu-feedback');

  const X0 = 46;
  const X1 = 504;

  function drawAxis(n, y, color, label, range, scale) {
    // 主軸
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X0, y);
    ctx.lineTo(X1, y);
    ctx.stroke();
    // 右端箭頭
    ctx.beginPath();
    ctx.moveTo(X1, y);
    ctx.lineTo(X1 - 9, y - 5);
    ctx.lineTo(X1 - 9, y + 5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(226, 232, 240, 0.35)';
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.font = f(700, 15);
    ctx.fillText(label, 12, y - 26);

    // 0 的位置
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = f(600, 12);
    ctx.fillText('0', X0, y + 18);

    const step = n * scale;
    const showLabel = step >= 30;

    for (let m = n; m <= range; m += n) {
      const x = X0 + m * scale;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      if (showLabel) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = f(600, 12);
        ctx.fillText(String(m), x, y + 18);
      }
    }
  }

  function draw() {
    const a = parseInt(sliderA.value, 10);
    const b = parseInt(sliderB.value, 10);
    const L = lcm2(a, b);
    const range = L * 2;
    const scale = (X1 - X0 - 14) / range;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#d8b4fe';
    ctx.font = f(700, 16);
    ctx.fillText('兩條數線上同時亮起來的位置，就是公倍數', canvas.width / 2, 20);

    const yA = 92;
    const yB = 176;

    // 公倍數的垂直連線（先畫，才不會蓋住圓點）
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    for (let m = L; m <= range; m += L) {
      const x = X0 + m * scale;
      ctx.beginPath();
      ctx.moveTo(x, yA - 16);
      ctx.lineTo(x, yB + 16);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    drawAxis(a, yA, COLOR_A, `${a} 的倍數`, range, scale);
    drawAxis(b, yB, COLOR_B, `${b} 的倍數`, range, scale);

    // 最小公倍數的標記
    const xL = X0 + L * scale;
    ctx.beginPath();
    ctx.arc(xL, yA, 9, 0, Math.PI * 2);
    ctx.strokeStyle = COLOR_C;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(xL, yB, 9, 0, Math.PI * 2);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR_C;
    ctx.font = f(800, 14);
    ctx.fillText('最小公倍數', xL, yB + 40);

    const commons = [];
    for (let m = L; m <= range; m += L) commons.push(m);

    ctx.fillStyle = '#94a3b8';
    ctx.font = f(500, 13);
    ctx.fillText(`公倍數：${commons.join('、')}、⋯　（全都是 ${L} 的倍數）`, canvas.width / 2, canvas.height - 54);

    ctx.fillStyle = OK_COLOR;
    ctx.font = f(800, 24);
    ctx.fillText(`[ ${a} , ${b} ] = ${L}`, canvas.width / 2, canvas.height - 24);

    valA.textContent = a;
    valB.textContent = b;
    formula.innerHTML = `\\( [ ${a} , ${b} ] = ${L} \\)`;
    feedback.innerHTML = wrapFeedback(
      `\\( ${a} \\) 與 \\( ${b} \\) 的公倍數是 <strong>${commons.join('、')}、⋯</strong>，` +
      `最小的一個是 <strong>${L}</strong>；後面每一個公倍數都是 \\( ${L} \\) 的倍數，所以<strong>公倍數有無限多個，卻只有一個最小公倍數</strong>。`
    );
    typeset([formula, feedback]);
  }

  sliderA.addEventListener('input', draw);
  sliderB.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   6. 重點 4：最小公倍數短除機（三個數）
   ========================================================================== */

// 先除三數的公因數，再除任兩數的公因數，直到任兩數都沒有共同質因數
function lcmLadder(nums) {
  const rows = [];
  let cur = nums.slice();
  let guard = 0;
  while (guard++ < 40) {
    let p = null;
    for (const q of PRIMES) {
      if (cur.every(v => v % q === 0)) { p = q; break; }
    }
    if (!p) {
      for (const q of PRIMES) {
        if (cur.filter(v => v % q === 0).length >= 2) { p = q; break; }
      }
    }
    if (!p) break;
    rows.push({ p, before: cur.slice() });
    cur = cur.map(v => (v % p === 0 ? v / p : v));
  }
  return { rows, last: cur };
}

function initLcmLadderCanvas() {
  const canvas = document.getElementById('canvas-lcm');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliders = ['ll-a-slider', 'll-b-slider', 'll-c-slider'].map(id => document.getElementById(id));
  const vals = ['ll-a-val', 'll-b-val', 'll-c-val'].map(id => document.getElementById(id));
  const formula = document.getElementById('ll-formula');
  const feedback = document.getElementById('ll-feedback');

  function draw() {
    const nums = sliders.map(s => parseInt(s.value, 10));
    const ladder = lcmLadder(nums);
    const L = lcmAll(nums);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fde047';
    ctx.font = f(700, 16);
    ctx.fillText('先除三數的公因數，再除任兩數的公因數（除不盡的直接抄下來）', canvas.width / 2, 20);

    const info = drawLadder(ctx, ladder, {
      topY: 64,
      rowH: 34,
      colW: 84,
      colors: [COLOR_A, COLOR_B, '#a7f3d0'],
      divisorColor: '#fde047'
    });

    // L 型提示：左欄除數 + 最下一列，就是要相乘的全部
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(info.leftX - 4, 48);
    ctx.lineTo(info.leftX - 4, info.lastY + 18);
    ctx.lineTo(info.rightX + 4, info.lastY + 18);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(52, 211, 153, 0.8)';
    ctx.font = f(600, 13);
    ctx.fillText('這個 L 形上的數字全部相乘', info.leftX - 4, info.lastY + 36);

    // 結論（跟著梯形走，梯形短的時候才不會中間空一大塊）
    const chain = ladder.rows.map(r => r.p).concat(ladder.last);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = f(600, 15);
    ctx.fillText(`${chain.join(' × ')} = ${L}`, canvas.width / 2, Math.min(info.lastY + 70, canvas.height - 56));

    ctx.fillStyle = OK_COLOR;
    ctx.font = f(800, 23);
    ctx.fillText(`[ ${nums.join(' , ')} ] = ${L}`, canvas.width / 2, Math.min(info.lastY + 102, canvas.height - 24));

    nums.forEach((n, i) => { vals[i].textContent = n; });
    formula.innerHTML = `\\( [ ${nums.join(' , ')} ] = ${L} \\)`;
    feedback.innerHTML = wrapFeedback(
      `左側除過的因數 <strong>${ladder.rows.map(r => r.p).join('、') || '（無）'}</strong> ` +
      `加上最下面一列的 <strong>${ladder.last.join('、')}</strong>，全部相乘得到 <strong>${L}</strong>。` +
      `<br>注意：求最小公倍數時，<strong>只要有兩個數有共同質因數就要繼續除</strong>，除不盡的那個原封不動抄下來。`
    );
    typeset([formula, feedback]);
  }

  sliders.forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   7. 重點 5：標準分解式指數塔（取 min 與取 max）
   ========================================================================== */
function initTowerCanvas() {
  const canvas = document.getElementById('canvas-tower');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderA = document.getElementById('tw-a-slider');
  const sliderB = document.getElementById('tw-b-slider');
  const valA = document.getElementById('tw-a-val');
  const valB = document.getElementById('tw-b-val');
  const formula = document.getElementById('tw-formula');
  const feedback = document.getElementById('tw-feedback');

  function draw() {
    const a = parseInt(sliderA.value, 10);
    const b = parseInt(sliderB.value, 10);

    const fa = factorList(a);
    const fb = factorList(b);
    const mapA = {}; fa.forEach(g => { mapA[g.p] = g.e; });
    const mapB = {}; fb.forEach(g => { mapB[g.p] = g.e; });
    const primes = Array.from(new Set(fa.map(g => g.p).concat(fb.map(g => g.p)))).sort((x, y) => x - y);

    const gcdList = [];
    const lcmList = [];
    primes.forEach(p => {
      const ea = mapA[p] || 0;
      const eb = mapB[p] || 0;
      const mn = Math.min(ea, eb);
      if (mn > 0) gcdList.push({ p, e: mn });
      lcmList.push({ p, e: Math.max(ea, eb) });
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f472b6';
    ctx.font = f(700, 16);
    ctx.fillText('同一個質因數比高低：矮的給最大公因數，高的給最小公倍數', canvas.width / 2, 20);

    // 兩個數的標準分解式
    drawStdForm(ctx, fa, canvas.width / 2, 58, 22, COLOR_A, `${a} = `);
    drawStdForm(ctx, fb, canvas.width / 2, 90, 22, COLOR_B, `${b} = `);

    // 指數積木塔
    const baseY = 258;
    // 依最高的那座塔決定積木高度：塔矮時放大，塔高（如 2^7）時縮小，
    // 兩種情況都剛好填滿圖例（y = 114）到基準線之間的區域
    const maxExp = Math.max(1, ...primes.map(p => Math.max(mapA[p] || 0, mapB[p] || 0)));
    const unit = Math.max(12, Math.min(38, Math.floor(112 / maxExp)));
    const barW = 26;
    const groupW = Math.min(90, (canvas.width - 60) / primes.length);
    const totalW = groupW * primes.length;
    const startX = (canvas.width - totalW) / 2;

    // 基準線
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(startX - 14, baseY);
    ctx.lineTo(startX + totalW + 14, baseY);
    ctx.stroke();

    primes.forEach((p, i) => {
      const gx = startX + groupW * i + groupW / 2;
      const ea = mapA[p] || 0;
      const eb = mapB[p] || 0;
      const xa = gx - barW - 4;
      const xb = gx + 4;

      [[xa, ea, COLOR_A], [xb, eb, COLOR_B]].forEach(([x, e, color]) => {
        for (let k = 0; k < e; k++) {
          const y = baseY - (k + 1) * unit;
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.85;
          roundRect(ctx, x, y + 2, barW, unit - 4, 4);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        if (e === 0) {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
          ctx.font = f(700, 13);
          ctx.textAlign = 'center';
          ctx.fillText('0', x + barW / 2, baseY - 14);
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.font = f(800, Math.min(17, unit - 4));
          ctx.textAlign = 'center';
          ctx.fillText(String(e), x + barW / 2, baseY - e * unit + unit / 2);
        }
      });

      // 取 min 的水平線（最大公因數）
      const mn = Math.min(ea, eb);
      if (mn > 0) {
        ctx.strokeStyle = OK_COLOR;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(xa - 5, baseY - mn * unit);
        ctx.lineTo(xb + barW + 5, baseY - mn * unit);
        ctx.stroke();
      }
      // 取 max 的水平線（最小公倍數）；次方相同時往上讓 5px，兩條線才不會疊成一條
      const mx = Math.max(ea, eb);
      const mxY = baseY - mx * unit - (mn === mx ? 5 : 0);
      ctx.strokeStyle = COLOR_C;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(xa - 5, mxY);
      ctx.lineTo(xb + barW + 5, mxY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 質因數標籤
      ctx.fillStyle = '#e2e8f0';
      ctx.font = f(800, 17);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(p), gx, baseY + 18);
    });

    // 圖例（放在最高的塔頂之上，7 次方的塔頂在 y = 132）
    ctx.textBaseline = 'middle';
    ctx.font = f(600, 12);
    ctx.textAlign = 'left';
    ctx.fillStyle = OK_COLOR;
    ctx.fillText('──  取次方小者 → 最大公因數', 20, 114);
    ctx.textAlign = 'right';
    ctx.fillStyle = COLOR_C;
    ctx.fillText('╌╌  取次方大者 → 最小公倍數', canvas.width - 20, 114);

    // 結論
    const g = gcd(a, b);
    const L = lcm2(a, b);
    ctx.textAlign = 'center';
    drawStdForm(ctx, gcdList, canvas.width / 2, baseY + 56, 20, OK_COLOR, `( ${a} , ${b} ) = `);
    drawStdForm(ctx, lcmList, canvas.width / 2, baseY + 88, 20, COLOR_C, `[ ${a} , ${b} ] = `);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#94a3b8';
    ctx.font = f(600, 14);
    ctx.fillText(`${g} × ${L} = ${g * L} = ${a} × ${b}`, canvas.width / 2, baseY + 116);

    valA.textContent = a;
    valB.textContent = b;
    formula.innerHTML = wbrEq(`( ${a} , ${b} ) = ${stdLatex(gcdList)} = ${g}`);
    feedback.innerHTML = wrapFeedback(
      `\\( ${a} = ${stdLatex(fa)} \\)、\\( ${b} = ${stdLatex(fb)} \\)。<br>` +
      `<strong>共同</strong>的質因數取<strong>次方小的</strong>相乘 \\( \\Rightarrow ( ${a} , ${b} ) = ${g} \\)；` +
      `<strong>所有</strong>質因數取<strong>次方大的</strong>相乘 \\( \\Rightarrow [ ${a} , ${b} ] = ${L} \\)。<br>` +
      `每個質因數取小的那次加上取大的那次，剛好就是兩者各出一次，所以 \\( ${g} \\times ${L} = ${a} \\times ${b} = ${g * L} \\)。`
    );
    typeset([formula, feedback]);
  }

  sliderA.addEventListener('input', draw);
  sliderB.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   8. 重點 6：應用問題情境模擬器
   ========================================================================== */
/**
 * 應用情境模擬器。重點 6（切小 → 最大公因數）與重點 7（湊整體 → 最小公倍數）
 * 共用同一份繪圖程式碼，只差在開放哪幾個情境模式。
 * opts = { canvasId, prefix, group, defMode }
 */
function initApplyCanvas(opts) {
  const canvas = document.getElementById(opts.canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const p = opts.prefix;
  const sliderA = document.getElementById(p + '-a-slider');
  const sliderB = document.getElementById(p + '-b-slider');
  const valA = document.getElementById(p + '-a-val');
  const valB = document.getElementById(p + '-b-val');
  const labA = document.getElementById(p + '-a-label');
  const labB = document.getElementById(p + '-b-label');
  const formula = document.getElementById(p + '-formula');
  const feedback = document.getElementById(p + '-feedback');
  const buttons = document.querySelectorAll('[data-apply-group="' + opts.group + '"]');

  // max 沒寫就沿用 HTML 上的 60。cycle 收到 10，是為了讓 Q1 的 12、16 分鐘調不出來——
  // 否則那一題只要把兩個班距輸進來就直接顯示答案（開發約束 29）
  const MODES = {
    pack: { labelA: '梨子（個）', labelB: '蘋果（個）', defA: 36, defB: 60, kind: 'gcd' },
    cycle: { labelA: '小翊每幾天來', labelB: '小妍每幾天來', defA: 8, defB: 10, maxA: 10, maxB: 10, kind: 'lcm' },
    tile: { labelA: '磁磚長（cm）', labelB: '磁磚寬（cm）', defA: 6, defB: 4, kind: 'lcm' },
    tree: { labelA: '土地長（m）', labelB: '土地寬（m）', defA: 24, defB: 18, kind: 'gcd' }
  };

  let mode = opts.defMode;

  // 切換情境時先套用該情境的滑桿上限，再填預設值（順序反過來會被舊上限夾住）
  function applyRange() {
    sliderA.max = MODES[mode].maxA || 60;
    sliderB.max = MODES[mode].maxB || 60;
  }

  function drawPack(a, b, g) {
    const perBoxA = a / g;
    const perBoxB = b / g;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#94a3b8';
    ctx.font = f(600, 14);
    ctx.fillText(`每一盒都放 ${g} 個，剛好全部分完`, canvas.width / 2, 52);

    // 兩排禮盒
    const rows = [
      { label: '梨子禮盒', count: perBoxA, color: COLOR_A, y: 122 },
      { label: '蘋果禮盒', count: perBoxB, color: COLOR_B, y: 232 }
    ];

    rows.forEach(r => {
      ctx.textAlign = 'left';
      ctx.fillStyle = r.color;
      ctx.font = f(700, 14);
      ctx.fillText(`${r.label} × ${r.count} 盒`, 16, r.y - 34);

      const show = Math.min(r.count, 8);
      const boxW = 52;
      const boxH = 60;
      const gapX = 8;
      const totalW = show * boxW + (show - 1) * gapX + (r.count > show ? 34 : 0);
      let x = (canvas.width - totalW) / 2;

      for (let i = 0; i < show; i++) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.10)';
        roundRect(ctx, x, r.y - boxH / 2, boxW, boxH, 8);
        ctx.fill();
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 盒內的水果（最多畫 9 顆，再多就寫數字）
        if (g <= 9) {
          const rowsInBox = Math.ceil(g / 3);
          for (let k = 0; k < g; k++) {
            const cx = x + boxW / 2 + ((k % 3) - Math.min(3, g - Math.floor(k / 3) * 3) / 2 + 0.5) * 14;
            const cy = r.y - (rowsInBox - 1) * 7 + Math.floor(k / 3) * 14;
            ctx.beginPath();
            ctx.arc(cx, cy, 4.4, 0, Math.PI * 2);
            ctx.fillStyle = r.color;
            ctx.fill();
          }
        } else {
          ctx.textAlign = 'center';
          ctx.fillStyle = r.color;
          ctx.font = f(800, 18);
          ctx.fillText(String(g), x + boxW / 2, r.y);
        }
        x += boxW + gapX;
      }
      if (r.count > show) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#94a3b8';
        ctx.font = f(700, 18);
        ctx.fillText('⋯', x + 6, r.y);
      }
    });

    return {
      answer: `一盒最多放 ${g} 個`,
      detail: `因為每盒個數必須同時整除 \\( ${a} \\) 與 \\( ${b} \\)，也就是兩數的<strong>公因數</strong>；` +
        `要「最多」就取<strong>最大公因數</strong> \\( ( ${a} , ${b} ) = ${g} \\)。` +
        `此時梨子裝成 \\( ${a} \\div ${g} = ${perBoxA} \\) 盒、蘋果裝成 \\( ${b} \\div ${g} = ${perBoxB} \\) 盒。`
    };
  }

  function drawCycle(a, b, L) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#94a3b8';
    ctx.font = f(600, 14);
    ctx.fillText(`今天兩人都來了，接下來各自照自己的週期回來`, canvas.width / 2, 52);

    const X0 = 46;
    const X1 = 500;
    const scale = (X1 - X0) / L;

    [{ n: a, y: 116, color: COLOR_A, name: '小翊' },
     { n: b, y: 190, color: COLOR_B, name: '小妍' }].forEach(r => {
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(X0, r.y);
      ctx.lineTo(X1, r.y);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = r.color;
      ctx.font = f(700, 14);
      ctx.fillText(`${r.name}（每 ${r.n} 天）`, 12, r.y - 26);

      const showLabel = r.n * scale >= 34;
      for (let m = 0; m <= L; m += r.n) {
        const x = X0 + m * scale;
        ctx.beginPath();
        ctx.arc(x, r.y, m === 0 || m === L ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = m === L ? COLOR_C : r.color;
        ctx.shadowColor = m === L ? COLOR_C : r.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        if (showLabel || m === 0 || m === L) {
          ctx.textAlign = 'center';
          ctx.fillStyle = m === L ? COLOR_C : '#94a3b8';
          ctx.font = f(600, 12);
          ctx.fillText(String(m), x, r.y + 18);
        }
      }
    });

    const xL = X0 + L * scale;
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(xL, 96);
    ctx.lineTo(xL, 214);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = 'center';
    ctx.fillStyle = COLOR_C;
    ctx.font = f(800, 14);
    ctx.fillText('再度相遇', xL, 236);

    return {
      answer: `最少再 ${L} 天`,
      detail: `經過的天數必須同時是 \\( ${a} \\) 與 \\( ${b} \\) 的<strong>倍數</strong>，也就是兩數的公倍數；` +
        `要「最少」就取<strong>最小公倍數</strong> \\( [ ${a} , ${b} ] = ${L} \\)。`
    };
  }

  function drawTile(a, b, L) {
    const cols = L / a;
    const rows = L / b;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#94a3b8';
    ctx.font = f(600, 14);
    ctx.fillText(`長邊接長邊、短邊接短邊，拼成一個正方形`, canvas.width / 2, 52);

    const boxSize = 168;
    const bx = (canvas.width - boxSize) / 2;
    const by = 84;

    ctx.fillStyle = 'rgba(52, 211, 153, 0.06)';
    ctx.fillRect(bx, by, boxSize, boxSize);
    ctx.strokeStyle = OK_COLOR;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(bx, by, boxSize, boxSize);

    // 磁磚太多就不畫格線，只標數量
    if (cols <= 30 && rows <= 30) {
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
      ctx.lineWidth = 1;
      for (let i = 1; i < cols; i++) {
        const x = bx + (boxSize / cols) * i;
        ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x, by + boxSize); ctx.stroke();
      }
      for (let j = 1; j < rows; j++) {
        const y = by + (boxSize / rows) * j;
        ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx + boxSize, y); ctx.stroke();
      }
    }

    ctx.fillStyle = COLOR_C;
    ctx.font = f(700, 14);
    ctx.textAlign = 'center';
    ctx.fillText(`${L} cm`, bx + boxSize / 2, by - 16);
    ctx.save();
    ctx.translate(bx - 18, by + boxSize / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${L} cm`, 0, 0);
    ctx.restore();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = f(600, 13);
    ctx.fillText(`橫排 ${cols} 塊 × 直排 ${rows} 塊 = ${cols * rows} 塊`, canvas.width / 2, by + boxSize + 22);

    return {
      answer: `最小邊長 ${L} cm`,
      detail: `正方形的邊長必須同時是磁磚長 \\( ${a} \\) 與寬 \\( ${b} \\) 的<strong>倍數</strong>；` +
        `要「最小」就取 \\( [ ${a} , ${b} ] = ${L} \\)。面積為 \\( ${L} \\times ${L} = ${L * L} \\) 平方公分，共用 ${cols * rows} 塊磁磚。`
    };
  }

  function drawTree(a, b, g) {
    const perimeter = 2 * (a + b);
    const count = perimeter / g;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#94a3b8';
    ctx.font = f(600, 14);
    ctx.fillText(`四個頂點都要種，相鄰兩棵距離相等`, canvas.width / 2, 52);

    const maxW = 300;
    const maxH = 150;
    const scale = Math.min(maxW / a, maxH / b);
    const w = a * scale;
    const h = b * scale;
    const bx = (canvas.width - w) / 2;
    const by = 96;

    ctx.fillStyle = 'rgba(167, 243, 208, 0.06)';
    ctx.fillRect(bx, by, w, h);
    ctx.strokeStyle = 'rgba(167, 243, 208, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, w, h);

    ctx.fillStyle = COLOR_C;
    ctx.font = f(700, 14);
    ctx.fillText(`${a} m`, bx + w / 2, by - 16);
    ctx.save();
    ctx.translate(bx - 20, by + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${b} m`, 0, 0);
    ctx.restore();

    // 沿周長每隔 g 公尺種一棵
    if (count <= 80) {
      const stepX = g * scale;
      const stepY = g * scale;
      const dots = [];
      for (let x = 0; x < a; x += g) dots.push([bx + x * scale, by]);
      for (let y = 0; y < b; y += g) dots.push([bx + w, by + y * scale]);
      for (let x = a; x > 0; x -= g) dots.push([bx + x * scale, by + h]);
      for (let y = b; y > 0; y -= g) dots.push([bx, by + y * scale]);
      dots.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = OK_COLOR;
        ctx.shadowColor = OK_COLOR;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      void stepX; void stepY;
    }

    ctx.fillStyle = '#cbd5e1';
    ctx.font = f(600, 13);
    ctx.textAlign = 'center';
    ctx.fillText(`周長 ( ${a} + ${b} ) × 2 = ${perimeter} m，每 ${g} m 一棵`, canvas.width / 2, by + h + 26);

    return {
      answer: `樹距最大 ${g} m，共 ${count} 棵`,
      detail: `樹距必須同時整除長 \\( ${a} \\) 與寬 \\( ${b} \\)（四個頂點都要種），也就是兩數的<strong>公因數</strong>；` +
        `要「最大」就取 \\( ( ${a} , ${b} ) = ${g} \\)。` +
        `四個頂點都種可看成每邊一端種、一端不種，所以<strong>棵數 = 間隔數</strong> \\( = ${perimeter} \\div ${g} = ${count} \\)。`
    };
  }

  function draw() {
    const cfg = MODES[mode];
    const a = parseInt(sliderA.value, 10);
    const b = parseInt(sliderB.value, 10);
    const g = gcd(a, b);
    const L = lcm2(a, b);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#a7f3d0';
    ctx.font = f(700, 16);
    ctx.fillText(
      cfg.kind === 'gcd' ? '「分裝、平分、最大的間隔」→ 找最大公因數' : '「再相遇、拼成、最小的整體」→ 找最小公倍數',
      canvas.width / 2, 20
    );

    let result;
    if (mode === 'pack') result = drawPack(a, b, g);
    else if (mode === 'cycle') result = drawCycle(a, b, L);
    else if (mode === 'tile') result = drawTile(a, b, L);
    else result = drawTree(a, b, g);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = OK_COLOR;
    ctx.font = f(800, 22);
    ctx.fillText(result.answer, canvas.width / 2, canvas.height - 24);

    valA.textContent = a;
    valB.textContent = b;
    labA.textContent = cfg.labelA;
    labB.textContent = cfg.labelB;
    formula.innerHTML = cfg.kind === 'gcd'
      ? `\\( ( ${a} , ${b} ) = ${g} \\)`
      : `\\( [ ${a} , ${b} ] = ${L} \\)`;
    feedback.innerHTML = wrapFeedback(result.detail);
    typeset([formula, feedback]);
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      mode = btn.getAttribute('data-apply-mode');
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyRange();
      sliderA.value = MODES[mode].defA;
      sliderB.value = MODES[mode].defB;
      draw();
    });
  });

  sliderA.addEventListener('input', draw);
  sliderB.addEventListener('input', draw);
  applyRange();
  draw();
}
