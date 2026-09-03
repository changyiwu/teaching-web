document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quiz System
  initQuizSystem();

  // Initialize Canvas Simulations
  initEquivCanvas();
  initCompareCanvas();
  initAddSubCanvas();
  initMulCanvas();
  initRecipCanvas();
  initApplyCanvas();
});

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // Correct answers mapping for Section 2-3 (12 Quizzes)
  const answers = {
    '2-3-1-1': 'B', // (15 , 28) = 1，只有它是最簡分數
    '2-3-1-2': 'C', // 分母 8 -> 32 是擴分 4 倍，分子 5 -> 20，加上 15
    '2-3-2-1': 'D', // 負分數絕對值大的反而小
    '2-3-2-2': 'A', // 同分子時分母小的大
    '2-3-3-1': 'B', // -7/10 + 3/4 = 1/20
    '2-3-3-2': 'C', // 3/8 - 5/6 - 1/8 = -7/12
    '2-3-4-1': 'A', // 負負得正，8/15 x 25/12 = 10/9
    '2-3-4-2': 'D', // 3 個負號 => 負；絕對值為 1，故為 -1
    '2-3-5-1': 'B', // -2 1/4 = -9/4，倒數為 -4/9
    '2-3-5-2': 'C', // 每個除數都要翻，結果為 1
    '2-3-6-1': 'A', // 乘除由左到右，結果為 2
    '2-3-6-2': 'D'  // 分配律提出 -63，3 x (-63) = -189
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
   2. 本節配色（通用繪圖工具在 ../math-canvas.js）
   ========================================================================== */
// 正值＝薄荷綠、負值＝珊瑚紅；兩個主角分數＝天青與洋紅
const POS_COLOR = '#34d399';
const NEG_COLOR = '#fb7185';
const COLOR_A = '#67e8f9';
const COLOR_B = '#f9a8d4';
const COLOR_C = '#fde047';

function lcm2(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

/* --------------------------------------------------------------------------
   Canvas 上的分數與算式：把整條式子當成一串「項」置中畫出
   item = { frac: [分子, 分母], color } 或 { txt: '=', color }

   本頁的項是平面的 { frac }／{ txt }，跟 ../math-canvas.js 的遞迴元件
   （T／VF／FR…）不同，所以保留一套本頁專用的排版：
     itemWidth／drawItem（單一項）、termsWidth／drawTerms（整條式子）。
   共用檔的 measure／drawIt／exprWidth／drawExpr 在本頁不適用，不要呼叫。
   -------------------------------------------------------------------------- */
function itemWidth(ctx, it, size) {
  if (it.frac) {
    let [n, d] = it.frac;
    if (d < 0) { n = -n; d = -d; }
    if (d === 1) { ctx.font = f(800, size); return ctx.measureText(String(n)).width; }
    ctx.font = f(800, size * 0.86);
    const bar = Math.max(ctx.measureText(String(Math.abs(n))).width,
      ctx.measureText(String(d)).width) + 10;
    let sw = 0;
    if (n < 0) { ctx.font = f(800, size); sw = ctx.measureText('-').width + 5; }
    return bar + sw;
  }
  ctx.font = f(700, size);
  return ctx.measureText(it.txt).width;
}

function drawItem(ctx, it, x, cy, size, fallback) {
  const color = it.color || fallback;
  const w = itemWidth(ctx, it, size);
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  if (it.frac) {
    let [n, d] = it.frac;
    if (d < 0) { n = -n; d = -d; }
    if (d === 1) {
      ctx.font = f(800, size);
      ctx.fillText(String(n), x, cy);
      return w;
    }
    let sw = 0;
    if (n < 0) {
      ctx.font = f(800, size);
      sw = ctx.measureText('-').width + 5;
      ctx.fillText('-', x, cy);
    }
    const bx = x + sw;
    const bw = w - sw;
    ctx.font = f(800, size * 0.86);
    ctx.textAlign = 'center';
    ctx.fillText(String(Math.abs(n)), bx + bw / 2, cy - size * 0.52);
    ctx.fillText(String(d), bx + bw / 2, cy + size * 0.55);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, size / 13);
    ctx.beginPath();
    ctx.moveTo(bx + 3, cy);
    ctx.lineTo(bx + bw - 3, cy);
    ctx.stroke();
    ctx.textAlign = 'left';
    return w;
  }

  ctx.font = f(700, size);
  ctx.fillText(it.txt, x, cy);
  return w;
}

function termsWidth(ctx, items, size, gap) {
  let w = 0;
  items.forEach((it, i) => {
    if (i) w += gap;
    w += itemWidth(ctx, it, size);
  });
  return w;
}

// 置中畫出一整條算式；太寬時自動縮小字級，確保不會超出畫布
function drawTerms(ctx, items, cx, cy, size, fallback, opts) {
  const o = opts || {};
  const gap = o.gap == null ? 9 : o.gap;
  const maxW = o.maxW == null ? ctx.canvas.width - 24 : o.maxW;
  let s = size;
  let total = termsWidth(ctx, items, s, gap);
  while (total > maxW && s > 10) {
    s -= 1;
    total = termsWidth(ctx, items, s, gap);
  }
  let x = cx - total / 2;
  items.forEach((it, i) => {
    if (i) x += gap;
    x += drawItem(ctx, it, x, cy, s, fallback);
  });
  return total;
}

// 判定用的小徽章（跟 2-2 同一套視覺）
function drawVerdictChip(ctx, x, y, w, h, label, ok, note) {
  ctx.fillStyle = ok ? 'rgba(52, 211, 153, 0.14)' : 'rgba(251, 113, 133, 0.14)';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = ok ? OK_COLOR : NO_COLOR;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = ok ? OK_COLOR : NO_COLOR;
  ctx.font = f(800, 17);
  ctx.fillText(label, x + w / 2, y + (note ? h * 0.36 : h / 2));
  if (note) {
    ctx.fillStyle = MUTED;
    ctx.font = f(500, 12);
    ctx.fillText(note, x + w / 2, y + h * 0.72);
  }
}

// 切成 cells 格、塗滿前 filled 格的長條；格線太密時自動不畫分隔線
function drawSegBar(ctx, x, y, w, h, cells, filled, color, dim) {
  ctx.fillStyle = 'rgba(148, 163, 184, 0.07)';
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();

  const cw = w / cells;
  const n = Math.min(filled, cells);
  if (n > 0) {
    ctx.fillStyle = dim ? 'rgba(148, 163, 184, 0.16)' : hexA(color, 0.26);
    roundRect(ctx, x, y, cw * n, h, 6);
    ctx.fill();
  }

  if (cells <= 48) {
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.22)';
    ctx.lineWidth = 1;
    for (let i = 1; i < cells; i++) {
      ctx.beginPath();
      ctx.moveTo(x + cw * i, y + 2);
      ctx.lineTo(x + cw * i, y + h - 2);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = dim ? 'rgba(148, 163, 184, 0.4)' : color;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 6);
  ctx.stroke();
}

// #rrggbb 轉 rgba()
function hexA(hex, a) {
  const v = hex.replace('#', '');
  const r = parseInt(v.substring(0, 2), 16);
  const g = parseInt(v.substring(2, 4), 16);
  const b = parseInt(v.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/* ==========================================================================
   3. 重點 1：等值分數縮放器
   ========================================================================== */
function initEquivCanvas() {
  const canvas = document.getElementById('canvas-equiv');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderA = document.getElementById('eq-a-slider');
  const sliderB = document.getElementById('eq-b-slider');
  const sliderK = document.getElementById('eq-k-slider');
  const valA = document.getElementById('eq-a-val');
  const valB = document.getElementById('eq-b-val');
  const valK = document.getElementById('eq-k-val');
  const formula = document.getElementById('eq-formula');
  const feedback = document.getElementById('eq-feedback');

  const BAR_X = 118;
  const BAR_W = 404;
  const BAR_H = 42;

  // 一列：左邊寫分數，右邊畫出「單位長度固定」的分數條
  function drawRow(label, n, d, unitCount, cy, color) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = MUTED;
    ctx.font = f(600, 14);
    ctx.fillText(label, 14, cy - 30);

    drawTerms(ctx, [{ frac: [n, d] }], 62, cy, 26, color, { maxW: 108 });

    const cells = d * unitCount;
    const filled = Math.abs(n);
    drawSegBar(ctx, BAR_X, cy - BAR_H / 2, BAR_W, BAR_H, cells, filled,
      n < 0 ? NEG_COLOR : POS_COLOR, false);

    // 單位分隔線（1 的位置）畫粗一點，看得出「幾個 1」
    const unitW = BAR_W / unitCount;
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
    ctx.lineWidth = 2;
    for (let i = 1; i < unitCount; i++) {
      ctx.beginPath();
      ctx.moveTo(BAR_X + unitW * i, cy - BAR_H / 2 - 3);
      ctx.lineTo(BAR_X + unitW * i, cy + BAR_H / 2 + 3);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = MUTED;
    ctx.font = f(500, 14);
    ctx.fillText(`切成 ${cells} 格，塗 ${filled} 格`, BAR_X + BAR_W / 2, cy + BAR_H / 2 + 14);
  }

  function draw() {
    let a = parseInt(sliderA.value, 10);
    const b = parseInt(sliderB.value, 10);
    const k = parseInt(sliderK.value, 10);
    if (a === 0) { a = 1; sliderA.value = 1; }

    const g = gcd(a, b);
    const sn = a / g, sd = b / g;
    const en = a * k, ed = b * k;
    const unitCount = Math.max(1, Math.ceil(Math.abs(a) / b));

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fda4af';
    ctx.font = f(700, 16);
    ctx.fillText('格子變多、變少，塗色的長度都沒有變——這就是等值分數', canvas.width / 2, 20);

    drawRow('原分數', a, b, unitCount, 82, COLOR_A);
    drawRow(`擴分 ×${k}（分子分母同乘 ${k}）`, en, ed, unitCount, 176, COLOR_B);
    drawRow(`約分（同除以最大公因數 ${g}）`, sn, sd, unitCount, 270, COLOR_C);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawTerms(ctx, [
      { frac: [a, b], color: COLOR_A },
      { txt: '=' },
      { frac: [en, ed], color: COLOR_B },
      { txt: '=' },
      { frac: [sn, sd], color: COLOR_C }
    ], 178, 336, 26, INK, { maxW: 330 });

    const already = g === 1;
    drawVerdictChip(ctx, canvas.width - 176, 314, 162, 44,
      already ? '本來就最簡' : '約分後才最簡', already,
      already ? `(${Math.abs(a)} , ${b}) = 1` : `(${Math.abs(a)} , ${b}) = ${g}`);

    valA.textContent = a;
    valB.textContent = b;
    valK.textContent = k;
    formula.innerHTML = `\\( ${texFrac(a, b)} = ${texFrac(en, ed)} = ${texFrac(sn, sd)} \\)`;
    feedback.innerHTML = wrapFeedback(
      `擴分 \\( ${k} \\) 倍後格子從 \\( ${b} \\) 格變成 \\( ${ed} \\) 格，塗色也從 \\( ${Math.abs(a)} \\) 格變成 \\( ${Math.abs(en)} \\) 格，` +
      `<strong>長度完全一樣</strong>。<br>` +
      (already
        ? `因為 \\( ( ${Math.abs(a)} , ${b} ) = 1 \\)，\\( ${texFrac(a, b)} \\) <strong>本來就是最簡分數</strong>。`
        : `分子分母同除以最大公因數 \\( ${g} \\)，一步化到最簡：\\( ${texFrac(a, b)} = ${texFrac(sn, sd)} \\)。`)
    );
    typeset([formula, feedback]);
  }

  sliderA.addEventListener('input', draw);
  sliderB.addEventListener('input', draw);
  sliderK.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   4. 重點 2：通分比大小台
   ========================================================================== */
function initCompareCanvas() {
  const canvas = document.getElementById('canvas-compare');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sA1 = document.getElementById('cp-a1-slider');
  const sB1 = document.getElementById('cp-b1-slider');
  const sA2 = document.getElementById('cp-a2-slider');
  const sB2 = document.getElementById('cp-b2-slider');
  const vA1 = document.getElementById('cp-a1-val');
  const vB1 = document.getElementById('cp-b1-val');
  const vA2 = document.getElementById('cp-a2-val');
  const vB2 = document.getElementById('cp-b2-val');
  const formula = document.getElementById('cp-formula');
  const feedback = document.getElementById('cp-feedback');

  function draw() {
    const a1 = parseInt(sA1.value, 10);
    const b1 = parseInt(sB1.value, 10);
    const a2 = parseInt(sA2.value, 10);
    const b2 = parseInt(sB2.value, 10);

    const L = lcm2(b1, b2);
    const n1 = a1 * (L / b1);
    const n2 = a2 * (L / b2);
    const v1 = a1 / b1;
    const v2 = a2 / b2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#67e8f9';
    ctx.font = f(700, 16);
    ctx.fillText(`先通分成同分母 [ ${b1} , ${b2} ] = ${L}，再比分子`, canvas.width / 2, 20);

    // 兩條通分算式
    drawTerms(ctx, [
      { frac: [a1, b1], color: COLOR_A }, { txt: '=' }, { frac: [n1, L], color: COLOR_A }
    ], 150, 66, 25, INK, { maxW: 250 });
    drawTerms(ctx, [
      { frac: [a2, b2], color: COLOR_B }, { txt: '=' }, { frac: [n2, L], color: COLOR_B }
    ], 390, 66, 25, INK, { maxW: 250 });

    // 數線：只有右側有箭頭（數線三要素）
    const axisY = 176;
    const lo = Math.min(-1, Math.floor(Math.min(v1, v2)));
    const hi = Math.max(1, Math.ceil(Math.max(v1, v2)));
    const padL = 42, padR = 42;
    const x0 = padL, x1 = canvas.width - padR;
    const toX = v => x0 + (v - lo) / (hi - lo) * (x1 - x0);

    ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0 - 14, axisY);
    ctx.lineTo(x1 + 16, axisY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1 + 16, axisY);
    ctx.lineTo(x1 + 4, axisY - 6);
    ctx.lineTo(x1 + 4, axisY + 6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(226, 232, 240, 0.6)';
    ctx.fill();

    // 細刻度：每 1/L 一格（太密就不畫）
    if ((hi - lo) * L <= 60) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 1;
      for (let t = lo * L; t <= hi * L; t++) {
        const px = toX(t / L);
        ctx.beginPath();
        ctx.moveTo(px, axisY - 5);
        ctx.lineTo(px, axisY + 5);
        ctx.stroke();
      }
    }

    // 整數刻度
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.75)';
    ctx.lineWidth = 2;
    ctx.font = f(700, 15);
    ctx.textAlign = 'center';
    for (let t = lo; t <= hi; t++) {
      const px = toX(t);
      ctx.beginPath();
      ctx.moveTo(px, axisY - 9);
      ctx.lineTo(px, axisY + 9);
      ctx.stroke();
      ctx.fillStyle = t === 0 ? '#e2e8f0' : MUTED;
      ctx.fillText(String(t), px, axisY + 24);
    }

    // 兩個分數的位置
    function mark(v, color, label, up) {
      const px = toX(v);
      const py = axisY + (up ? -34 : 34);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px, axisY);
      ctx.lineTo(px, py + (up ? 10 : -10));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, axisY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = color;
      ctx.font = f(800, 16);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, px, py);
    }
    mark(v1, COLOR_A, '甲', true);
    mark(v2, COLOR_B, '乙', false);

    // 結論
    const same = n1 === n2;
    const sign = same ? '=' : (v1 > v2 ? '>' : '<');
    ctx.textAlign = 'center';
    ctx.fillStyle = MUTED;
    ctx.font = f(500, 14);
    ctx.fillText(same ? '兩個分數是等值分數，在數線上是同一點'
      : '數線上比較右邊的那一個比較大', canvas.width / 2, 262);

    drawTerms(ctx, [
      { frac: [a1, b1], color: COLOR_A },
      { txt: sign, color: '#e2e8f0' },
      { frac: [a2, b2], color: COLOR_B }
    ], 168, 306, 28, INK, { maxW: 300 });

    const bothNeg = v1 < 0 && v2 < 0;
    if (bothNeg) {
      const absSign = Math.abs(n1) === Math.abs(n2) ? '=' : (Math.abs(n1) > Math.abs(n2) ? '>' : '<');
      drawVerdictChip(ctx, canvas.width - 190, 284, 176, 46,
        `絕對值 ${absSign}`, false, '絕對值大的負數反而小');
    } else if (v1 * v2 < 0) {
      drawVerdictChip(ctx, canvas.width - 190, 284, 176, 46,
        '一正一負', true, '負分數一定小於正分數');
    } else {
      drawVerdictChip(ctx, canvas.width - 190, 284, 176, 46,
        `分子 ${Math.abs(n1) === Math.abs(n2) ? '=' : (n1 > n2 ? '>' : '<')}`, true,
        `同分母 ${L}，比分子就好`);
    }

    // 底部提示
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.font = f(500, 14);
    ctx.fillText(`通分後：${n1} 與 ${n2}（分母都是 ${L}）`, canvas.width / 2, 350);

    vA1.textContent = a1; vB1.textContent = b1;
    vA2.textContent = a2; vB2.textContent = b2;
    formula.innerHTML = `\\( ${texFrac(a1, b1)} ${sign} ${texFrac(a2, b2)} \\)`;

    let note;
    if (same) {
      note = `兩個分數通分後都是 \\( ${texFrac(n1, L)} \\)，<strong>值相等</strong>，互為等值分數。`;
    } else if (bothNeg) {
      note = `兩個都是負分數，先比絕對值：\\( \\left| ${texFrac(a1, b1)} \\right| = ${texFrac(Math.abs(n1), L)} \\)、` +
        `\\( \\left| ${texFrac(a2, b2)} \\right| = ${texFrac(Math.abs(n2), L)} \\)。<br>` +
        `<strong>絕對值愈大的負數愈小</strong>，所以 \\( ${texFrac(a1, b1)} ${sign} ${texFrac(a2, b2)} \\)。`;
    } else if (v1 * v2 < 0) {
      note = `一正一負不必通分——<strong>負分數一定小於 0、0 一定小於正分數</strong>，` +
        `直接得 \\( ${texFrac(a1, b1)} ${sign} ${texFrac(a2, b2)} \\)。`;
    } else {
      note = `通分成同分母 \\( ${L} \\) 後得 \\( ${texFrac(n1, L)} \\) 與 \\( ${texFrac(n2, L)} \\)，` +
        `分母相同就<strong>比分子</strong>，所以 \\( ${texFrac(a1, b1)} ${sign} ${texFrac(a2, b2)} \\)。`;
    }
    feedback.innerHTML = wrapFeedback(`\\( [ ${b1} , ${b2} ] = ${L} \\)。<br>` + note);
    typeset([formula, feedback]);
  }

  [sA1, sB1, sA2, sB2].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   5. 重點 3：通分拼接器
   ========================================================================== */
function initAddSubCanvas() {
  const canvas = document.getElementById('canvas-addsub');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sA1 = document.getElementById('as-a1-slider');
  const sB1 = document.getElementById('as-b1-slider');
  const sA2 = document.getElementById('as-a2-slider');
  const sB2 = document.getElementById('as-b2-slider');
  const vA1 = document.getElementById('as-a1-val');
  const vB1 = document.getElementById('as-b1-val');
  const vA2 = document.getElementById('as-a2-val');
  const vB2 = document.getElementById('as-b2-val');
  const formula = document.getElementById('as-formula');
  const feedback = document.getElementById('as-feedback');
  const opButtons = document.querySelectorAll('[data-addsub-op]');

  let op = 'add';

  // 以 0 為中心、往左右延伸的有號長條
  function drawSigned(ctx, value, den, cy, h, unitPx, zeroX, color, label) {
    const w = Math.abs(value) * unitPx / den;
    const x = value >= 0 ? zeroX : zeroX - w;
    const cells = Math.abs(value);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.06)';
    roundRect(ctx, x, cy - h / 2, Math.max(w, 2), h, 5);
    ctx.fill();
    ctx.fillStyle = hexA(color, 0.26);
    roundRect(ctx, x, cy - h / 2, Math.max(w, 2), h, 5);
    ctx.fill();

    if (cells > 1 && cells <= 40) {
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.25)';
      ctx.lineWidth = 1;
      for (let i = 1; i < cells; i++) {
        const px = x + (w / cells) * i;
        ctx.beginPath();
        ctx.moveTo(px, cy - h / 2 + 2);
        ctx.lineTo(px, cy + h / 2 - 2);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    roundRect(ctx, x, cy - h / 2, Math.max(w, 2), h, 5);
    ctx.stroke();

    ctx.fillStyle = MUTED;
    ctx.font = f(600, 13);
    ctx.textBaseline = 'middle';
    ctx.textAlign = value >= 0 ? 'right' : 'left';
    ctx.fillText(label, value >= 0 ? zeroX - 8 : zeroX + 8, cy);
  }

  function draw() {
    const a1 = parseInt(sA1.value, 10);
    const b1 = parseInt(sB1.value, 10);
    const a2raw = parseInt(sA2.value, 10);
    const b2 = parseInt(sB2.value, 10);
    const a2 = op === 'add' ? a2raw : -a2raw;

    const L = lcm2(b1, b2);
    const n1 = a1 * (L / b1);
    const n2 = a2 * (L / b2);
    const rn = n1 + n2;
    const [sn, sd] = reduce(rn, L);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#d8b4fe';
    ctx.font = f(700, 16);
    ctx.fillText(`通分成同分母 [ ${b1} , ${b2} ] = ${L}，再把格子拼起來`, canvas.width / 2, 20);

    // 座標軸
    const zeroX = canvas.width / 2;
    // 讓「最長的那一條」剛好佔滿半邊，小分數才看得清楚格子
    const maxAbs = Math.max(0.02, Math.abs(a1 / b1), Math.abs(a2 / b2), Math.abs(rn / L));
    const unitPx = 232 / maxAbs;

    ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(zeroX, 44);
    ctx.lineTo(zeroX, 268);
    ctx.stroke();
    ctx.fillStyle = MUTED;
    ctx.font = f(700, 13);
    ctx.textAlign = 'center';
    ctx.fillText('0', zeroX, 36);

    // 1 與 -1 的位置（放得下才畫）
    if (unitPx <= 236) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      [-1, 1].forEach(u => {
        const px = zeroX + u * unitPx;
        ctx.beginPath();
        ctx.moveTo(px, 48);
        ctx.lineTo(px, 264);
        ctx.stroke();
        ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
        ctx.font = f(600, 12);
        ctx.fillText(String(u), px, 36);
      });
      ctx.setLineDash([]);
    }

    drawSigned(ctx, n1, L, 80, 36, unitPx, zeroX, COLOR_A, `${texPlain(a1, b1)}`);
    drawSigned(ctx, n2, L, 152, 36, unitPx, zeroX, COLOR_B,
      `${op === 'add' ? '+' : '-'} ${texPlain(a2raw, b2)}`);
    drawSigned(ctx, rn, L, 232, 40, unitPx, zeroX, rn < 0 ? NEG_COLOR : POS_COLOR, '=');

    // 說明文字放在長條「上方」，長條拉滿版面時才不會被壓到
    ctx.fillStyle = MUTED;
    ctx.font = f(500, 14);
    [[n1 + ' 格', 50], [n2 + ' 格', 122], [rn + ' 格', 202]].forEach(([t, y], i) => {
      ctx.textAlign = 'left';
      ctx.fillText((i === 2 ? '共 ' : '通分後 ') + t, 12, y);
      ctx.textAlign = 'right';
      ctx.fillText(`每格 1/${L}`, canvas.width - 12, y);
    });

    // 算式
    drawTerms(ctx, [
      { frac: [a1, b1], color: COLOR_A },
      { txt: op === 'add' ? '+' : '-' },
      { frac: [a2raw, b2], color: COLOR_B },
      { txt: '=' },
      { frac: [n1, L], color: COLOR_A },
      { txt: n2 < 0 ? '-' : '+' },
      { frac: [Math.abs(n2), L], color: COLOR_B }
    ], canvas.width / 2, 300, 24, INK);

    const already = (sd === L);
    drawTerms(ctx, already ? [
      { txt: '=' },
      { frac: [rn, L], color: rn < 0 ? NEG_COLOR : POS_COLOR },
      { txt: '（已是最簡）', color: MUTED }
    ] : [
      { txt: '=' },
      { frac: [rn, L], color: rn < 0 ? NEG_COLOR : POS_COLOR },
      { txt: '=' },
      { frac: [sn, sd], color: rn < 0 ? NEG_COLOR : POS_COLOR }
    ], canvas.width / 2, 350, 26, INK);

    vA1.textContent = a1; vB1.textContent = b1;
    vA2.textContent = a2raw; vB2.textContent = b2;
    formula.innerHTML = `\\( ${texFrac(a1, b1)} ${op === 'add' ? '+' : '-'} ` +
      `${a2raw < 0 ? '( ' + texFrac(a2raw, b2) + ' )' : texFrac(a2raw, b2)} = ${texFrac(sn, sd)} \\)`;
    feedback.innerHTML = wrapFeedback(
      `\\( [ ${b1} , ${b2} ] = ${L} \\)，通分後兩個分數變成 \\( ${texFrac(n1, L)} \\) 與 \\( ${texFrac(n2, L)} \\)。<br>` +
      `<strong>分母不變，只把分子加減</strong>：\\( \\frac{${n1} ${n2 < 0 ? '-' : '+'} ${Math.abs(n2)}}{${L}} = ${texFrac(rn, L)} \\)` +
      (Math.abs(rn) === Math.abs(sn) && L === sd
        ? '，已是最簡分數。'
        : `，再約分得 \\( ${texFrac(sn, sd)} \\)。`) +
      (op === 'sub' && a2raw < 0
        ? '<br>注意這裡是<strong>減去一個負數</strong>，等於加上它的相反數。'
        : '')
    );
    typeset([formula, feedback]);
  }

  // 給長條用的純文字分數（畫在 canvas 上，不走 MathJax）
  function texPlain(n, d) {
    return d === 1 ? String(n) : `${n}/${d}`;
  }

  opButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      opButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      op = btn.getAttribute('data-addsub-op');
      draw();
    });
  });
  [sA1, sB1, sA2, sB2].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   6. 重點 4：面積乘法器
   ========================================================================== */
function initMulCanvas() {
  const canvas = document.getElementById('canvas-mul');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sA1 = document.getElementById('ml-a1-slider');
  const sB1 = document.getElementById('ml-b1-slider');
  const sA2 = document.getElementById('ml-a2-slider');
  const sB2 = document.getElementById('ml-b2-slider');
  const vA1 = document.getElementById('ml-a1-val');
  const vB1 = document.getElementById('ml-b1-val');
  const vA2 = document.getElementById('ml-a2-val');
  const vB2 = document.getElementById('ml-b2-val');
  const formula = document.getElementById('ml-formula');
  const feedback = document.getElementById('ml-feedback');

  function draw() {
    const b1 = parseInt(sB1.value, 10);
    const b2 = parseInt(sB2.value, 10);
    // 面積模型畫的是「一整塊烤盤」，分子絕對值不超過分母才畫得下
    let a1 = clamp(parseInt(sA1.value, 10), -b1, b1);
    let a2 = clamp(parseInt(sA2.value, 10), -b2, b2);
    if (a1 === 0) a1 = 1;
    if (a2 === 0) a2 = 1;
    // 滑鈕要跟著回到合法值，否則畫面上的數字會跟滑桿位置對不上
    if (+sA1.value !== a1) sA1.value = a1;
    if (+sA2.value !== a2) sA2.value = a2;

    const negCount = (a1 < 0 ? 1 : 0) + (a2 < 0 ? 1 : 0);
    const positive = negCount % 2 === 0;
    const pn = a1 * a2;
    const pd = b1 * b2;
    const [sn, sd] = reduce(pn, pd);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fde047';
    ctx.font = f(700, 16);
    ctx.fillText('整塊烤盤看成 1：直條 × 橫條，交疊的格子就是乘積', canvas.width / 2, 20);

    // 面積格
    const S = 208;
    const gx = 24, gy = 52;
    const cw = S / b1, ch = S / b2;

    ctx.fillStyle = 'rgba(148, 163, 184, 0.06)';
    roundRect(ctx, gx, gy, S, S, 8);
    ctx.fill();

    // 直條（第一個分數）
    ctx.fillStyle = hexA(COLOR_B, 0.22);
    ctx.fillRect(gx, gy, cw * Math.abs(a1), S);
    // 橫條（第二個分數）
    ctx.fillStyle = hexA(OK_COLOR, 0.2);
    ctx.fillRect(gx, gy, S, ch * Math.abs(a2));
    // 交疊區＝乘積
    ctx.fillStyle = positive ? hexA(OK_COLOR, 0.5) : hexA(NEG_COLOR, 0.5);
    ctx.fillRect(gx, gy, cw * Math.abs(a1), ch * Math.abs(a2));

    ctx.strokeStyle = 'rgba(226, 232, 240, 0.22)';
    ctx.lineWidth = 1;
    for (let i = 1; i < b1; i++) {
      ctx.beginPath(); ctx.moveTo(gx + cw * i, gy); ctx.lineTo(gx + cw * i, gy + S); ctx.stroke();
    }
    for (let j = 1; j < b2; j++) {
      ctx.beginPath(); ctx.moveTo(gx, gy + ch * j); ctx.lineTo(gx + S, gy + ch * j); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
    ctx.lineWidth = 2;
    roundRect(ctx, gx, gy, S, S, 8);
    ctx.stroke();

    // 交疊區的邊框
    ctx.strokeStyle = positive ? OK_COLOR : NEG_COLOR;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(gx, gy, cw * Math.abs(a1), ch * Math.abs(a2));

    ctx.fillStyle = MUTED;
    ctx.font = f(600, 14);
    ctx.textAlign = 'center';
    ctx.fillText(`橫向切 ${b1} 條，取 ${Math.abs(a1)} 條`, gx + S / 2, gy + S + 18);
    ctx.save();
    ctx.translate(gx - 10, gy + S / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`縱向切 ${b2} 條，取 ${Math.abs(a2)} 條`, 0, 0);
    ctx.restore();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = f(800, 15);
    ctx.fillText(`${Math.abs(a1)} × ${Math.abs(a2)} = ${Math.abs(pn)} 格`,
      gx + S / 2, gy + S + 40);
    ctx.fillStyle = MUTED;
    ctx.font = f(500, 14);
    ctx.fillText(`整塊共 ${b1} × ${b2} = ${pd} 格`, gx + S / 2, gy + S + 60);

    // 右側：符號燈與算式
    const rx = 288, rw = 236;
    drawVerdictChip(ctx, rx, 56, rw, 52,
      positive ? '乘積為正' : '乘積為負', positive,
      negCount === 0 ? '兩個都是正數' : (negCount === 1 ? '異號相乘得負' : '同號相乘得正'));

    ctx.textAlign = 'center';
    ctx.fillStyle = MUTED;
    ctx.font = f(600, 14);
    ctx.fillText('分子乘分子、分母乘分母', rx + rw / 2, 128);

    drawTerms(ctx, [
      { frac: [a1, b1], color: COLOR_B },
      { txt: '×' },
      { frac: [a2, b2], color: OK_COLOR }
    ], rx + rw / 2, 172, 25, INK, { maxW: rw });

    drawTerms(ctx, [
      { txt: '=' },
      { frac: [pn, pd], color: positive ? OK_COLOR : NEG_COLOR }
    ], rx + rw / 2, 232, 25, INK, { maxW: rw });

    ctx.fillStyle = MUTED;
    ctx.font = f(500, 13);
    ctx.fillText(pd === sd ? '已經是最簡分數' : `同除以 ${gcd(pn, pd)} 化到最簡`,
      rx + rw / 2, 274);

    drawTerms(ctx, [
      { txt: '=' },
      { frac: [sn, sd], color: positive ? OK_COLOR : NEG_COLOR }
    ], rx + rw / 2, 320, 30, INK, { maxW: rw });

    vA1.textContent = a1; vB1.textContent = b1;
    vA2.textContent = a2; vB2.textContent = b2;
    formula.innerHTML = `\\( ${texFrac(a1, b1)} \\times ${texFrac(a2, b2)} = ${texFrac(sn, sd)} \\)`;
    feedback.innerHTML = wrapFeedback(
      `${negCount === 1 ? '<strong>異號相乘得負</strong>' : '<strong>同號相乘得正</strong>'}` +
      `（負號有 ${negCount} 個）。<br>` +
      `絕對值部分：\\( \\frac{${Math.abs(a1)} \\times ${Math.abs(a2)}}{${b1} \\times ${b2}} = ` +
      `\\frac{${Math.abs(pn)}}{${pd}} \\)，` +
      (pd === sd ? '已是最簡分數。' : `約分後為 \\( ${texFrac(Math.abs(sn), sd)} \\)。`) +
      `<br>所以 \\( ${texFrac(a1, b1)} \\times ${texFrac(a2, b2)} = ${texFrac(sn, sd)} \\)。` +
      `<br><span style="color:#94a3b8">面積模型要畫得下，分子的絕對值不會超過分母。</span>`
    );
    typeset([formula, feedback]);
  }

  [sA1, sB1, sA2, sB2].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   7. 重點 5：倒數翻轉機
   ========================================================================== */
function initRecipCanvas() {
  const canvas = document.getElementById('canvas-recip');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sP = document.getElementById('rc-p-slider');
  const sQ = document.getElementById('rc-q-slider');
  const sA = document.getElementById('rc-a-slider');
  const sB = document.getElementById('rc-b-slider');
  const vP = document.getElementById('rc-p-val');
  const vQ = document.getElementById('rc-q-val');
  const vA = document.getElementById('rc-a-val');
  const vB = document.getElementById('rc-b-val');
  const formula = document.getElementById('rc-formula');
  const feedback = document.getElementById('rc-feedback');

  function card(cx, cy, n, d, color, caption) {
    const w = 116, h = 84;
    ctx.fillStyle = hexA(color, 0.12);
    roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawTerms(ctx, [{ frac: [n, d] }], cx, cy, 27, color, { maxW: w - 16 });
    if (caption) {
      ctx.fillStyle = MUTED;
      ctx.font = f(600, 13);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(caption, cx, cy + h / 2 + 13);
    }
  }

  function op(txt, cx, cy, color) {
    ctx.fillStyle = color || '#e2e8f0';
    ctx.font = f(800, 26);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, cx, cy);
  }

  function draw() {
    let p = parseInt(sP.value, 10);
    const q = parseInt(sQ.value, 10);
    let a = parseInt(sA.value, 10);
    const b = parseInt(sB.value, 10);
    if (p === 0) { p = 1; sP.value = 1; }
    if (a === 0) { a = 1; sA.value = 1; }

    const negCount = (p < 0 ? 1 : 0) + (a < 0 ? 1 : 0);
    const positive = negCount % 2 === 0;
    const rn = p * b;
    const rd = q * a;
    const [sn, sd] = reduce(rn, rd);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f472b6';
    ctx.font = f(700, 16);
    ctx.fillText('除以一個分數 ＝ 乘以這個分數的倒數', canvas.width / 2, 20);

    // 第一列：原本的除法
    card(112, 82, p, q, COLOR_A, '被除數');
    op('÷', 208, 82);
    card(304, 82, a, b, COLOR_B, '');

    // 翻面箭頭
    ctx.strokeStyle = COLOR_C;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(304, 132);
    ctx.lineTo(304, 166);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(304, 174);
    ctx.lineTo(298, 162);
    ctx.lineTo(310, 162);
    ctx.closePath();
    ctx.fillStyle = COLOR_C;
    ctx.fill();
    ctx.font = f(700, 13);
    ctx.textAlign = 'left';
    ctx.fillStyle = COLOR_C;
    ctx.fillText('分子分母對調', 316, 150);

    // 第二列：改成乘法
    card(112, 208, p, q, COLOR_A, '不動');
    op('×', 208, 208);
    card(304, 208, b, a, COLOR_C, '除數的倒數');

    // 符號燈
    drawVerdictChip(ctx, 390, 176, 138, 64,
      positive ? '結果為正' : '結果為負', positive,
      negCount === 1 ? '異號相除得負' : (negCount === 2 ? '同號相除得正' : '兩個都是正數'));

    // 倒數驗算
    ctx.fillStyle = MUTED;
    ctx.font = f(600, 14);
    ctx.textAlign = 'center';
    ctx.fillText('互為倒數的兩數相乘', 450, 62);
    drawTerms(ctx, [
      { frac: [a, b], color: COLOR_B },
      { txt: '×' },
      { frac: [b, a], color: COLOR_C },
      { txt: '=' },
      { txt: '1', color: OK_COLOR }
    ], 450, 100, 19, INK, { maxW: 160, gap: 5 });

    // 結果
    const alreadyLowest = Math.abs(rd) === sd;
    drawTerms(ctx, [
      { frac: [p, q], color: COLOR_A },
      { txt: '÷' },
      { frac: [a, b], color: COLOR_B },
      { txt: '=' },
      { frac: [rn, rd], color: positive ? OK_COLOR : NEG_COLOR }
    ].concat(alreadyLowest ? [] : [
      { txt: '=' },
      { frac: [sn, sd], color: positive ? OK_COLOR : NEG_COLOR }
    ]), canvas.width / 2, 308, 27, INK);

    ctx.fillStyle = MUTED;
    ctx.font = f(500, 13);
    ctx.textAlign = 'center';
    ctx.fillText(alreadyLowest
      ? '乘出來就已經是最簡分數'
      : `分子分母同除以 ${gcd(rn, rd)}，化成最簡分數`, canvas.width / 2, 356);

    vP.textContent = p; vQ.textContent = q;
    vA.textContent = a; vB.textContent = b;
    formula.innerHTML = `\\( ${texFrac(p, q)} \\div ${a < 0 ? '( ' + texFrac(a, b) + ' )' : texFrac(a, b)} = ${texFrac(sn, sd)} \\)`;
    feedback.innerHTML = wrapFeedback(
      `\\( ${texFrac(a, b)} \\) 的倒數是 \\( ${texFrac(b, a)} \\)，兩者相乘為 \\( 1 \\)。<br>` +
      `把除法改寫成乘法：\\( ${texFrac(p, q)} \\times ${texFrac(b, a)} = ` +
      `${texFrac(rn, rd)} \\)` +
      (alreadyLowest ? '，<strong>已是最簡分數</strong>。' : `\\( = ${texFrac(sn, sd)} \\)。`) +
      `<br>${negCount === 1 ? '<strong>異號相除得負</strong>' : '<strong>同號相除得正</strong>'}` +
      `（負號有 ${negCount} 個）。`
    );
    typeset([formula, feedback]);
  }

  [sP, sQ, sA, sB].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   8. 重點 6：分配律拼圖與情境模擬器
   ========================================================================== */
function initApplyCanvas() {
  const canvas = document.getElementById('canvas-apply');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sA = document.getElementById('ap-a-slider');
  const sB = document.getElementById('ap-b-slider');
  const sC = document.getElementById('ap-c-slider');
  const vA = document.getElementById('ap-a-val');
  const vB = document.getElementById('ap-b-val');
  const vC = document.getElementById('ap-c-val');
  const lA = document.getElementById('ap-a-label');
  const lB = document.getElementById('ap-b-label');
  const lC = document.getElementById('ap-c-label');
  const formula = document.getElementById('ap-formula');
  const feedback = document.getElementById('ap-feedback');
  const modeButtons = document.querySelectorAll('[data-apply-mode]');

  // 可選的「分率」清單，給果汁瓶與圖書館兩個情境用
  const RATES = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5]];

  const MODES = {
    dist: {
      labels: ['共同的因數 a', '第一項 b', '第二項 c'],
      ranges: [[1, 12, 3], [1, 12, 5], [1, 12, 3]]
    },
    drone: {
      labels: ['滿載總重（公斤）', '已飛行時間（分）', '目前總重（公斤）'],
      ranges: [[30, 60, 45], [5, 45, 20], [10, 59, 37]]
    },
    bottle: {
      labels: ['原本連瓶重（公克）', '剩下連瓶重（公克）', '喝掉的比例'],
      ranges: [[500, 1200, 930], [100, 1100, 430], [0, RATES.length - 1, 2]]
    },
    books: {
      labels: ['添購的新書（本）', '「添購前占添購後」的分子', '同一個分率的分母'],
      ranges: [[100, 900, 450], [1, 9, 7], [2, 10, 10]]
    }
  };

  let mode = 'dist';

  function applyMode(name) {
    mode = name;
    const m = MODES[name];
    [[sA, vA, lA, 0], [sB, vB, lB, 1], [sC, vC, lC, 2]].forEach(([s, v, l, i]) => {
      const [lo, hi, def] = m.ranges[i];
      s.min = lo; s.max = hi; s.value = def;
      l.textContent = m.labels[i];
      v.textContent = def;
    });
  }

  // 一條分成數段的橫條，每段自帶標籤
  function stackBar(x, y, w, h, segs, total) {
    let cx = x;
    segs.forEach(seg => {
      const sw = w * (seg.v / total);
      ctx.fillStyle = hexA(seg.color, 0.28);
      ctx.fillRect(cx, y, sw, h);
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, y, sw, h);
      // 標籤一定要塞得進自己那一段，否則會從畫布邊緣溢出；放不下就只寫數字，再放不下就不寫
      ctx.font = f(800, 14);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const candidates = [seg.label, seg.label.split(' ').pop()];
      const fit = candidates.find(t => ctx.measureText(t).width + 10 <= sw);
      if (fit) {
        ctx.fillStyle = seg.color;
        ctx.fillText(fit, cx + sw / 2, y + h / 2);
      }
      cx += sw;
    });
  }

  function drawDist() {
    const a = parseInt(sA.value, 10);
    const b = parseInt(sB.value, 10);
    const c = parseInt(sC.value, 10);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = f(700, 16);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('兩塊高度一樣的長方形，可以併成一整塊', canvas.width / 2, 20);

    const unit = Math.min(360 / (b + c), 140 / a);
    const bw = b * unit, cw = c * unit, hh = a * unit;
    const ox = canvas.width / 2 - (bw + cw) / 2;
    const oy = 60;

    ctx.fillStyle = hexA(COLOR_A, 0.26);
    ctx.fillRect(ox, oy, bw, hh);
    ctx.strokeStyle = COLOR_A;
    ctx.lineWidth = 2;
    ctx.strokeRect(ox, oy, bw, hh);

    ctx.fillStyle = hexA(COLOR_B, 0.26);
    ctx.fillRect(ox + bw, oy, cw, hh);
    ctx.strokeStyle = COLOR_B;
    ctx.strokeRect(ox + bw, oy, cw, hh);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = f(800, 15);
    if (bw > 44) ctx.fillText(`a×b = ${a * b}`, ox + bw / 2, oy + hh / 2);
    if (cw > 44) ctx.fillText(`a×c = ${a * c}`, ox + bw + cw / 2, oy + hh / 2);

    // 標示邊長
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox - 14, oy);
    ctx.lineTo(ox - 14, oy + hh);
    ctx.stroke();
    ctx.fillStyle = MUTED;
    ctx.font = f(700, 14);
    ctx.save();
    ctx.translate(ox - 26, oy + hh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`a = ${a}`, 0, 0);
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(ox, oy + hh + 12);
    ctx.lineTo(ox + bw + cw, oy + hh + 12);
    ctx.stroke();
    ctx.fillStyle = COLOR_A;
    ctx.fillText(`b = ${b}`, ox + bw / 2, oy + hh + 26);
    ctx.fillStyle = COLOR_B;
    ctx.fillText(`c = ${c}`, ox + bw + cw / 2, oy + hh + 26);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`b + c = ${b + c}`, ox + (bw + cw) / 2, oy + hh + 48);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = f(800, 21);
    ctx.fillText(`${a}×${b} + ${a}×${c} = ${a}×(${b} + ${c})`, canvas.width / 2, 292);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = f(800, 23);
    ctx.fillText(`${a * b} + ${a * c} = ${a * (b + c)}`, canvas.width / 2, 328);

    vA.textContent = a; vB.textContent = b; vC.textContent = c;
    // 每一個等號各自起一段 \( \)（`{}` 維持關係運算子的字距），中間用零寬的 <wbr> 接起來，
    // 讓窄螢幕可以在等號前換行，而寬螢幕的排版跟原本逐像素相同
    formula.innerHTML = `\\( ${a} \\times ${b} + ${a} \\times ${c} \\)<wbr>` +
      `\\( {}= ${a} \\times ( ${b} + ${c} ) \\)<wbr>\\( {}= ${a * (b + c)} \\)`;
    feedback.innerHTML = wrapFeedback(
      `兩塊長方形的<strong>高都是 \\( ${a} \\)</strong>，所以可以直接把底邊接起來：` +
      `底變成 \\( ${b} + ${c} = ${b + c} \\)，面積 \\( = ${a} \\times ${b + c} = ${a * (b + c)} \\)。<br>` +
      `這就是<strong>分配律</strong> \\( a \\times b + a \\times c = a \\times ( b + c ) \\)——` +
      `看到<strong>相同的因數</strong>就把它提出來，兩次乘法變成一次。<br>` +
      `<span style="color:#fb7185">但除法沒有這條規則</span>：\\( a \\div ( b + c ) \\neq a \\div b + a \\div c \\)。`
    );
  }

  function drawDrone() {
    const T = 50; // 滿載可噴灑的總時間（分）
    const W = parseInt(sA.value, 10);
    const t = parseInt(sB.value, 10);
    // 機身至少 1 公斤，所以滿載農藥 (W - M) * T / t 不能超過 W - 1，
    // 換算成「目前總重」的下界。夾的是輸入不是算出來的結果——
    // 夾結果會讓畫面照樣印出 20 ÷ 1/10 = 20 × 10/1 = 30 這種假等式（開發約束 27）
    const mMin = Math.max(+sC.min, Math.ceil(W - (W - 1) * t / T));
    const M = clamp(parseInt(sC.value, 10), mMin, W - 1);
    if (+sC.value !== M) sC.value = M;

    const used = W - M;                  // 這次用掉的農藥
    const [rn, rd] = reduce(t, T);       // 用掉的比例
    const full = used * T / t;           // 滿載的農藥重
    const body = W - full;               // 機身重

    ctx.fillStyle = '#a7f3d0';
    ctx.font = f(700, 16);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`飛 ${T} 分鐘剛好噴完，所以飛 ${t} 分鐘就用掉 ${rn}/${rd} 的農藥`, canvas.width / 2, 20);

    const bx = 40, bw = canvas.width - 80;
    ctx.fillStyle = MUTED;
    ctx.font = f(600, 14);
    ctx.textAlign = 'left';
    ctx.fillText(`出發：機身 + 滿載農藥 = ${W} 公斤`, bx, 58);
    stackBar(bx, 72, bw, 44, [
      { v: body, color: COLOR_A, label: `機身 ${round2(body)}` },
      { v: full, color: COLOR_B, label: `農藥 ${round2(full)}` }
    ], W);

    ctx.fillStyle = MUTED;
    ctx.textAlign = 'left';
    ctx.fillText(`飛 ${t} 分鐘後：機身 + 剩餘農藥 = ${M} 公斤`, bx, 148);
    stackBar(bx, 162, bw * (M / W), 44, [
      { v: body, color: COLOR_A, label: `機身 ${round2(body)}` },
      { v: full - used, color: COLOR_B, label: `剩 ${round2(full - used)}` }
    ], M);

    ctx.strokeStyle = NEG_COLOR;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(bx + bw * (M / W), 162, bw * (used / W), 44);
    ctx.setLineDash([]);
    ctx.fillStyle = NEG_COLOR;
    ctx.font = f(700, 13);
    ctx.textAlign = 'center';
    ctx.fillText(`用掉 ${used}`, bx + bw * (M / W) + bw * (used / W) / 2, 220);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = f(700, 16);
    ctx.fillText(`用掉 ${W} - ${M} = ${used} 公斤，占滿載農藥的 ${rn}/${rd}`, canvas.width / 2, 256);
    ctx.fillStyle = '#a7f3d0';
    ctx.font = f(800, 19);
    ctx.fillText(`滿載農藥 = ${used} ÷ ${rn}/${rd} = ${round2(full)} 公斤`, canvas.width / 2, 292);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = f(800, 21);
    ctx.fillText(`機身重 = ${W} - ${round2(full)} = ${round2(body)} 公斤`, canvas.width / 2, 328);

    vA.textContent = W; vB.textContent = t; vC.textContent = M;
    formula.innerHTML = `\\( ${W} - ( ${used} \\div \\frac{${rn}}{${rd}} ) \\)<wbr>` +
      `\\( {}= ${round2(body)} \\) 公斤`;
    feedback.innerHTML = wrapFeedback(
      `① 這次用掉的農藥：\\( ${W} - ${M} = ${used} \\) 公斤。<br>` +
      `② 它占滿載農藥的 \\( \\frac{${t}}{${T}} = \\frac{${rn}}{${rd}} \\)。<br>` +
      `③ 用<strong>除法還原全體</strong>：滿載農藥 \\( = ${used} \\div \\frac{${rn}}{${rd}} = ` +
      `${used} \\times \\frac{${rd}}{${rn}} = ${round2(full)} \\) 公斤。<br>` +
      `④ 機身重 \\( = ${W} - ${round2(full)} = ${round2(body)} \\) 公斤。`
    );
  }

  function drawBottle() {
    const W = parseInt(sA.value, 10);
    const [rn, rd] = RATES[parseInt(sC.value, 10)];
    // 空瓶至少 1 公克，所以果汁原重 (W - R) * rd / rn 不能超過 W - 1，
    // 換算成「剩下連瓶重」的下界（同 drawDrone：夾輸入，不夾結果）
    const rMin = Math.max(+sB.min, Math.ceil(W - (W - 1) * rn / rd));
    const R = clamp(parseInt(sB.value, 10), rMin, W - 10);
    if (+sB.value !== R) sB.value = R;

    const drunk = W - R;               // 喝掉的果汁重
    const juice = drunk * rd / rn;     // 果汁原重
    const bottle = W - juice;          // 空瓶重

    ctx.fillStyle = '#a7f3d0';
    ctx.font = f(700, 16);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('瓶子的重量從頭到尾沒變，變的只有果汁', canvas.width / 2, 20);

    const bx = 40, bw = canvas.width - 80;
    ctx.fillStyle = MUTED;
    ctx.font = f(600, 14);
    ctx.textAlign = 'left';
    ctx.fillText(`原本：空瓶 + 果汁 = ${W} 公克`, bx, 58);
    stackBar(bx, 72, bw, 44, [
      { v: bottle, color: COLOR_A, label: `瓶 ${round2(bottle)}` },
      { v: juice, color: COLOR_B, label: `果汁 ${round2(juice)}` }
    ], W);

    ctx.fillStyle = MUTED;
    ctx.textAlign = 'left';
    ctx.fillText(`喝掉 ${rn}/${rd} 瓶後：空瓶 + 剩餘果汁 = ${R} 公克`, bx, 148);
    stackBar(bx, 162, bw * (R / W), 44, [
      { v: bottle, color: COLOR_A, label: `瓶 ${round2(bottle)}` },
      { v: juice - drunk, color: COLOR_B, label: `剩 ${round2(juice - drunk)}` }
    ], R);

    ctx.strokeStyle = NEG_COLOR;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(bx + bw * (R / W), 162, bw * (drunk / W), 44);
    ctx.setLineDash([]);
    ctx.fillStyle = NEG_COLOR;
    ctx.font = f(700, 13);
    ctx.textAlign = 'center';
    ctx.fillText(`喝掉 ${drunk}`, bx + bw * (R / W) + bw * (drunk / W) / 2, 220);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = f(700, 16);
    ctx.fillText(`喝掉 ${W} - ${R} = ${drunk} 公克，占果汁的 ${rn}/${rd}`, canvas.width / 2, 256);
    ctx.fillStyle = '#a7f3d0';
    ctx.font = f(800, 19);
    ctx.fillText(`果汁原重 = ${drunk} ÷ ${rn}/${rd} = ${round2(juice)} 公克`, canvas.width / 2, 292);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = f(800, 21);
    ctx.fillText(`空瓶重 = ${W} - ${round2(juice)} = ${round2(bottle)} 公克`, canvas.width / 2, 328);

    vA.textContent = W; vB.textContent = R;
    vC.textContent = `${rn}/${rd}`;
    formula.innerHTML = `\\( ${W} - ( ${drunk} \\div \\frac{${rn}}{${rd}} ) \\)<wbr>` +
      `\\( {}= ${round2(bottle)} \\) 公克`;
    feedback.innerHTML = wrapFeedback(
      `① 喝掉的果汁：\\( ${W} - ${R} = ${drunk} \\) 公克。<br>` +
      `② 它占果汁原重的 \\( \\frac{${rn}}{${rd}} \\)。<br>` +
      `③ 果汁原重 \\( = ${drunk} \\div \\frac{${rn}}{${rd}} = ${drunk} \\times \\frac{${rd}}{${rn}} = ${round2(juice)} \\) 公克。<br>` +
      `④ 空瓶重 \\( = ${W} - ${round2(juice)} = ${round2(bottle)} \\) 公克。<br>` +
      `<span style="color:#94a3b8">關鍵是「喝掉的分率是對<strong>果汁</strong>算的，不是對連瓶總重算的」。</span>`
    );
  }

  function drawBooks() {
    const add = parseInt(sA.value, 10);
    const d = parseInt(sC.value, 10);
    const n = clamp(parseInt(sB.value, 10), 1, d - 1);

    // 添購前 = 添購後 x n/d，所以新書占添購後的 (d-n)/d
    const [rn, rd] = reduce(d - n, d);
    const after = add * rd / rn;
    const before = after - add;

    ctx.fillStyle = '#a7f3d0';
    ctx.font = f(700, 16);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`添購前的藏書是添購後的 ${n}/${d}，所以新書占 ${rn}/${rd}`, canvas.width / 2, 20);

    const bx = 40, bw = canvas.width - 80;
    ctx.fillStyle = MUTED;
    ctx.font = f(600, 14);
    ctx.textAlign = 'left';
    ctx.fillText(`添購後的總藏書 = ${round2(after)} 本（看成 1）`, bx, 58);
    stackBar(bx, 72, bw, 46, [
      { v: before, color: COLOR_A, label: `添購前 ${round2(before)}` },
      { v: add, color: COLOR_B, label: `新書 ${add}` }
    ], after);

    ctx.fillStyle = COLOR_A;
    ctx.font = f(700, 14);
    ctx.textAlign = 'center';
    ctx.fillText(`${n}/${d}`, bx + bw * (before / after) / 2, 136);
    ctx.fillStyle = COLOR_B;
    ctx.fillText(`${rn}/${rd}`, bx + bw * (before / after) + bw * (add / after) / 2, 136);

    ctx.fillStyle = MUTED;
    ctx.font = f(600, 14);
    ctx.fillText(`兩段合起來剛好是 1 個「添購後」`, canvas.width / 2, 176);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = f(700, 16);
    ctx.fillText(`新書 ${add} 本占添購後的 1 - ${n}/${d} = ${rn}/${rd}`, canvas.width / 2, 224);
    ctx.fillStyle = '#a7f3d0';
    ctx.font = f(800, 19);
    ctx.fillText(`添購後 = ${add} ÷ ${rn}/${rd} = ${round2(after)} 本`, canvas.width / 2, 268);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = f(800, 21);
    ctx.fillText(`添購前 = ${round2(after)} - ${add} = ${round2(before)} 本`, canvas.width / 2, 312);

    vA.textContent = add; vB.textContent = n; vC.textContent = d;
    formula.innerHTML = `\\( ( ${add} \\div \\frac{${rn}}{${rd}} ) - ${add} \\)<wbr>` +
      `\\( {}= ${round2(before)} \\) 本`;
    feedback.innerHTML = wrapFeedback(
      `① 添購前占添購後的 \\( \\frac{${n}}{${d}} \\)，所以<strong>新書</strong>占添購後的 ` +
      `\\( 1 - \\frac{${n}}{${d}} = \\frac{${rn}}{${rd}} \\)。<br>` +
      `② 添購後 \\( = ${add} \\div \\frac{${rn}}{${rd}} = ${add} \\times \\frac{${rd}}{${rn}} = ${round2(after)} \\) 本。<br>` +
      `③ 添購前 \\( = ${round2(after)} - ${add} = ${round2(before)} \\) 本。<br>` +
      `<span style="color:#94a3b8">分率的「1」是<strong>添購後</strong>的總數，先認清誰是 1 再列式。</span>`
    );
  }

  function round2(v) {
    return Math.round(v * 100) / 100;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mode === 'dist') drawDist();
    else if (mode === 'drone') drawDrone();
    else if (mode === 'bottle') drawBottle();
    else drawBooks();
    typeset([formula, feedback]);
  }

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyMode(btn.getAttribute('data-apply-mode'));
      draw();
    });
  });
  [sA, sB, sC].forEach(s => s.addEventListener('input', draw));

  applyMode('dist');
  draw();
}
