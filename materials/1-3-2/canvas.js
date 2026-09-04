document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quiz System
  initQuizSystem();

  // Initialize Canvas Simulations
  initIdentityCanvas();
  initTranslateCanvas();
  initSubstituteCanvas();
  initAxiomCanvas();
  initMoveCanvas();
  initExpandCanvas();
});

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // Correct answers mapping for Section 3-2 (12 Quizzes)
  const answers = {
    '3-2-1-1': 'D', // 7-4x=9 三個條件都符合
    '3-2-1-2': 'C', // 3x+5 沒有等號，不是方程式
    '3-2-2-1': 'B', // 3 倍少 4 歲 → 3y-4=29
    '3-2-2-2': 'A', // 比 3/4 倍小 6 → (3/4)x-6=-2
    '3-2-3-1': 'C', // x=5 代入 -3x+4=-11 成立
    '3-2-3-2': 'A', // x=-2 是 5x+3=-7 的解
    '3-2-4-1': 'D', // c 可能為 0，不能同除以 c
    '3-2-4-2': 'B', // 兩邊同減 3，是等量減法公理
    '3-2-5-1': 'C', // 7x-4=5x-10 → x=-3
    '3-2-5-2': 'D', // 6x=3 要同除以 6，x=3÷6
    '3-2-6-1': 'A', // -3[2(x-1)-x]=9 → x=-1
    '3-2-6-2': 'B'  // 兩邊同乘 6，常數項 1 也要乘
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
      typeset([explanation]);
    });
  });
}

/* ==========================================================================
   2. 本節配色（通用繪圖工具在 ../math-canvas.js）
   ========================================================================== */

// 蒸汽龐克黃銅天平工房配色：黃銅金、天青、翠綠、紫水晶、警示橘、玫瑰銅
const C_BRASS = '#fcd34d';
const C_SKY = '#7dd3fc';
const C_JADE = '#6ee7b7';
const C_AMETHYST = '#e9d5ff';
const C_EMBER = '#fdba74';
const C_ROSE = '#f9a8d4';

/* ==========================================================================
   3. 本節專屬繪圖：黃銅天平、砝碼與未知數鐵盒
   ========================================================================== */

// 一個未知數鐵盒（正方形加鎖孔），中央寫 x
function drawBox(ctx, cx, cy, size, color) {
  const h = size;
  ctx.save();
  roundRect(ctx, cx - h / 2, cy - h / 2, h, h, 5);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.18)';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  // 鎖扣
  ctx.beginPath();
  ctx.arc(cx, cy + h * 0.28, h * 0.10, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = fi(800, h * 0.58);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('x', cx, cy - h * 0.10);
  ctx.restore();
  ctx.textAlign = 'left';
}

// 一枚黃銅砝碼（圓片，側面帶厚度）
function drawDisc(ctx, cx, cy, r, color, negative) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fillStyle = negative ? 'rgba(251, 113, 133, 0.16)' : 'rgba(252, 211, 77, 0.20)';
  ctx.fill();
  ctx.strokeStyle = negative ? NO_COLOR : color;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  // 側面厚度
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx - r, cy + r * 0.30);
  ctx.ellipse(cx, cy + r * 0.30, r, r * 0.42, 0, Math.PI, 0, true);
  ctx.lineTo(cx + r, cy);
  ctx.stroke();
  ctx.restore();
}

/* 在秤盤上排出內容
   boxes：x 鐵盒的個數（可為負，負的用紅色標示）
   discs：砝碼的個數（可為負或分數）
   碗的內徑只有 116px，所以圖示排成網格往上堆；數量太多或不是整數時改用文字標籤。 */
function drawPanLoad(ctx, cx, panY, boxes, discs, color) {
  const bs = 22;            // 鐵盒邊長
  const dr = 8;             // 砝碼半徑
  const BOX_COLS = 2;       // 鐵盒每列 2 個，再往上堆
  const DISC_COLS = 3;      // 砝碼每列 3 顆，再往上堆
  const boxN = Math.abs(boxes);
  const discN = Math.abs(discs);
  const boxFits = Number.isInteger(boxes) && boxN <= 4;
  const discFits = Number.isInteger(discs) && discN <= 9;

  // 先算總寬，讓整組內容在碗裡置中
  let w = 0;
  if (boxes !== 0) w += boxFits ? Math.min(boxN, BOX_COLS) * (bs + 3) : 46;
  if (discs !== 0) w += discFits ? Math.min(discN, DISC_COLS) * (dr * 2 + 2) : 40;
  if (boxes !== 0 && discs !== 0) w += 6;
  let x = cx - w / 2;

  ctx.save();
  ctx.textBaseline = 'middle';

  if (boxes !== 0) {
    if (boxFits) {
      for (let i = 0; i < boxN; i++) {
        const col = i % BOX_COLS, row = Math.floor(i / BOX_COLS);
        drawBox(ctx, x + col * (bs + 3) + bs / 2, panY + 2 - row * (bs + 3), bs, boxes < 0 ? NO_COLOR : color);
      }
      x += Math.min(boxN, BOX_COLS) * (bs + 3) + 6;
    } else {
      ctx.fillStyle = boxes < 0 ? NO_COLOR : color;
      ctx.font = f(800, 17);
      ctx.textAlign = 'left';
      ctx.fillText(numStr(boxes), x, panY + 4);
      const nw = ctx.measureText(numStr(boxes)).width;
      ctx.font = fi(800, 17);
      ctx.fillText('x', x + nw + 9, panY + 4);
      x += 46 + 6;
    }
  }

  if (discs !== 0) {
    if (discFits) {
      for (let i = 0; i < discN; i++) {
        const col = i % DISC_COLS, row = Math.floor(i / DISC_COLS);
        drawDisc(ctx, x + col * (dr * 2 + 2) + dr, panY + 8 - row * 10, dr, color, discs < 0);
      }
    } else {
      ctx.fillStyle = discs < 0 ? NO_COLOR : color;
      ctx.font = f(800, 17);
      ctx.textAlign = 'left';
      ctx.fillText(numStr(discs), x, panY + 4);
    }
  }

  if (boxes === 0 && discs === 0) {
    ctx.fillStyle = MUTED;
    ctx.font = f(700, 17);
    ctx.textAlign = 'center';
    ctx.fillText('0', cx, panY + 4);
  }
  ctx.restore();
  ctx.textAlign = 'left';
}

/* 黃銅等臂天平
   tilt：橫樑傾斜（弧度，正值代表右邊下沉）
   left / right：{ boxes, discs, label } */
function drawScale(ctx, cx, beamY, halfSpan, tilt, left, right, color, balanced) {
  const baseY = beamY + 150;

  ctx.save();
  // 立柱與底座
  ctx.strokeStyle = 'rgba(252, 211, 77, 0.55)';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, beamY);
  ctx.lineTo(cx, baseY);
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx - 42, baseY);
  ctx.lineTo(cx + 42, baseY);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 6, 52, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(252, 211, 77, 0.16)';
  ctx.fill();

  // 橫樑
  const dx = Math.cos(tilt) * halfSpan;
  const dy = Math.sin(tilt) * halfSpan;
  const lx = cx - dx, ly = beamY - dy;
  const rx = cx + dx, ry = beamY + dy;
  if (balanced) {
    ctx.shadowColor = OK_COLOR;
    ctx.shadowBlur = 18;
  }
  ctx.strokeStyle = balanced ? OK_COLOR : 'rgba(148, 163, 184, 0.85)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.lineTo(rx, ry);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 支點指針
  ctx.beginPath();
  ctx.moveTo(cx - 8, beamY + 13);
  ctx.lineTo(cx + 8, beamY + 13);
  ctx.lineTo(cx, beamY - 4);
  ctx.closePath();
  ctx.fillStyle = balanced ? OK_COLOR : 'rgba(148, 163, 184, 0.85)';
  ctx.fill();

  // 兩側吊繩與秤盤
  [[lx, ly, left], [rx, ry, right]].forEach(([px, py, load]) => {
    const panY = py + 74;
    ctx.strokeStyle = 'rgba(252, 211, 77, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - 46, panY);
    ctx.moveTo(px, py);
    ctx.lineTo(px + 46, panY);
    ctx.stroke();
    // 淺碟
    ctx.beginPath();
    ctx.moveTo(px - 58, panY);
    ctx.quadraticCurveTo(px, panY + 36, px + 58, panY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(252, 211, 77, 0.07)';
    ctx.fill();

    drawPanLoad(ctx, px, panY, load.boxes || 0, load.discs || 0, color);

    if (load.label) {
      ctx.fillStyle = MUTED;
      ctx.font = f(700, 15);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(load.label, px, panY + 40);
      ctx.textAlign = 'left';
    }
  });
  ctx.restore();
}

/* ==========================================================================
   重點 1：方程式身分檢查台
   八個式子輪流上檢查台，三盞燈分別檢查「有等號」「只含一種未知數」
   「未知數的次數是 1」，三盞全亮才是一元一次方程式。
   ========================================================================== */
function initIdentityCanvas() {
  const canvas = document.getElementById('canvas-identity');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('id-feedback');
  const group = document.getElementById('id-eq-group');
  const C = C_BRASS;

  const CASES = [
    {
      items: () => [xItems(3, C), T('+', C), T('5', C), T('=', C), T('14', C)],
      tex: '3x+5=14', eq: true, one: true, deg1: true,
      why: '有等號、只含一種未知數 \\(x\\)、\\(x\\) 的次數是 \\(1\\)：三個條件都成立。'
    },
    {
      items: () => [T('4', C), T('-', C), IT('x', C)],
      tex: '4-x', eq: false, one: true, deg1: true,
      why: '只有算式、<strong>沒有等號</strong>，這是<strong>代數式</strong>不是方程式。方程式一定要有等號。'
    },
    {
      items: () => [SEQ([T('2', C), IT('y', C)], C, 1), T('+', C), T('8', C), T('=', C), T('0', C)],
      tex: '2y+8=0', eq: true, one: true, deg1: true,
      why: '未知數換成 \\(y\\) 一樣可以。<strong>用哪個字母不影響</strong>，看的是「幾種」與「幾次」。'
    },
    {
      items: () => [PW(IT('x', C), 2, false, C), T('+', C), T('1', C), T('=', C), T('5', C)],
      tex: 'x^2+1=5', eq: true, one: true, deg1: false,
      why: '\\(x\\) 的次數是 \\(2\\)，不是 \\(1\\)。這是<strong>一元二次方程式</strong>，要到九年級才學。'
    },
    {
      items: () => [xItems(2, C), T('+', C), SEQ([T('3', C), IT('y', C)], C, 1), T('=', C), T('7', C)],
      tex: '2x+3y=7', eq: true, one: false, deg1: true,
      why: '同時含有 \\(x\\) 與 \\(y\\) <strong>兩種未知數</strong>，所以不是「一元」，這是二元一次方程式。'
    },
    {
      items: () => [T('5', C), T('+', C), T('3', C), T('=', C), T('8', C)],
      tex: '5+3=8', eq: true, one: false, deg1: true,
      why: '有等號，但<strong>連未知數都沒有</strong>，只是一個算完的等式，沒有東西可以解。'
    },
    {
      items: () => [VF(IT('x', C), T('6', C), C), T('=', C), T('2', C)],
      tex: '\\frac{x}{6}=2', eq: true, one: true, deg1: true,
      why: '\\(\\frac{x}{6}\\) 就是 \\(x \\div 6 = \\frac{1}{6}x\\)，\\(x\\) 仍然是<strong>一次</strong>，是一元一次方程式。'
    },
    {
      items: () => [SEQ([IT('x', C), IT('y', C)], C, 1), T('=', C), T('6', C)],
      tex: 'xy=6', eq: true, one: false, deg1: false,
      why: '\\(xy\\) 是兩種未知數<strong>相乘</strong>，次數合計是 \\(2\\)，兩個條件都不符合。'
    }
  ];

  let idx = 0;

  function lamp(cx, cy, on) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 13, 0, Math.PI * 2);
    ctx.fillStyle = on ? 'rgba(52, 211, 153, 0.22)' : 'rgba(251, 113, 133, 0.16)';
    ctx.fill();
    ctx.strokeStyle = on ? OK_COLOR : NO_COLOR;
    ctx.lineWidth = 2.2;
    if (on) { ctx.shadowColor = OK_COLOR; ctx.shadowBlur = 12; }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = on ? OK_COLOR : NO_COLOR;
    ctx.font = f(800, 15);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(on ? '✓' : '✗', cx, cy + 1);
    ctx.restore();
    ctx.textAlign = 'left';
  }

  function draw() {
    const c = CASES[idx];
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, '一元一次方程式檢查台', C);

    // 檢查台上的式子
    drawPanel(ctx, 40, 52, w - 80, 62, C, 0.10);
    drawExpr(ctx, c.items(), w / 2, 83, 30, C, { maxW: w - 110, gap: 8 });

    // 三盞燈
    const rows = [
      { on: c.eq, label: '① 有等號嗎？', hint: c.eq ? '有「=」，是等式' : '沒有等號，只是算式' },
      { on: c.one, label: '② 只含一種未知數嗎？', hint: c.one ? '只出現一種文字符號' : (c.tex === '5+3=8' ? '完全沒有未知數' : '出現兩種未知數') },
      { on: c.deg1, label: '③ 未知數的次數是 1 嗎？', hint: c.deg1 ? '未知數上沒有指數' : '次數是 2，太高了' }
    ];
    rows.forEach((r, i) => {
      const y = 148 + i * 52;
      lamp(60, y, r.on);
      ctx.fillStyle = r.on ? '#e2e8f0' : MUTED;
      ctx.font = f(750, 18);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.label, 86, y - 9);
      ctx.fillStyle = r.on ? OK_COLOR : NO_COLOR;
      ctx.font = f(600, 14);
      ctx.fillText(r.hint, 86, y + 11);
    });

    // 結論
    const pass = c.eq && c.one && c.deg1;
    const bw = 300;
    drawChip(ctx, w / 2 - bw / 2, 312, bw, 40,
      pass ? '是一元一次方程式' : '不是一元一次方程式',
      pass ? OK_COLOR : NO_COLOR,
      pass ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.10)');

    if (fb) {
      fb.innerHTML = wrapFeedback(`\\(${c.tex}\\)：${c.why}`);
      typeset([fb]);
    }
  }

  bindPickGroup(group, 'data-eq', v => { idx = parseInt(v, 10); draw(); });
  draw();
}

/* ==========================================================================
   重點 2：文字敘述翻譯機
   把一句中文逐步翻成一條一元一次方程式：先認出未知數，再翻左半邊，
   最後把「是多少」翻成等號與右半邊。
   ========================================================================== */
function initTranslateCanvas() {
  const canvas = document.getElementById('canvas-translate');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('tr-feedback');
  const group = document.getElementById('tr-item-group');
  const btnPrev = document.getElementById('tr-prev');
  const btnNext = document.getElementById('tr-next');
  const stepLabel = document.getElementById('tr-step');
  const C = C_SKY;

  const CASES = [
    {
      text: '比 x 大 7 的數是 -5',
      unknown: 'x', keyword: '「大 7」是多 7，用加法',
      left: () => [IT('x', C), T('+', C), T('7', C)],
      right: () => [T('-5', C)],
      tex: 'x+7=-5'
    },
    {
      text: '比 y 小 4 的數是 21',
      unknown: 'y', keyword: '「小 4」是少 4，用減法',
      left: () => [IT('y', C), T('-', C), T('4', C)],
      right: () => [T('21', C)],
      tex: 'y-4=21'
    },
    {
      text: '18 是 x 的 3/4 倍',
      unknown: 'x', keyword: '「幾倍」用乘法，倍數寫在前面',
      left: () => [T('18', C)],
      right: () => [SEQ([VF(T('3', C), T('4', C), C), IT('x', C)], C, 3)],
      tex: '18=\\frac{3}{4}x'
    },
    {
      text: '把 a 分成 5 等分，每一份都是 6',
      unknown: 'a', keyword: '「分成幾等分」用除法',
      left: () => [VF(IT('a', C), T('5', C), C)],
      right: () => [T('6', C)],
      tex: '\\frac{a}{5}=6'
    },
    {
      text: '比 c 的 3 倍多 8 的數是 2',
      unknown: 'c', keyword: '先算 3 倍，再多 8：先乘後加',
      left: () => [SEQ([T('3', C), IT('c', C)], C, 1), T('+', C), T('8', C)],
      right: () => [T('2', C)],
      tex: '3c+8=2'
    },
    {
      text: '一盒 x 元的餅乾買 4 盒，再加一瓶 60 元的牛奶，共付 200 元',
      unknown: 'x', keyword: '4 盒是 4 個 x，再把牛奶加上去',
      left: () => [xItems(4, C), T('+', C), T('60', C)],
      right: () => [T('200', C)],
      tex: '4x+60=200'
    }
  ];

  const NOTES = [
    '先讀懂這句話在說什麼',
    '把「還不知道的數」用文字符號記下來',
    '照著文字的順序，把左半邊寫成代數式',
    '「是」「共」就是等號，右半邊補上去，方程式完成'
  ];

  let idx = 0, step = 0;

  function draw() {
    const c = CASES[idx];
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, '文字敘述翻譯機', C);

    // 上層：中文敘述
    drawPanel(ctx, 24, 50, w - 48, 62, C, 0.08);
    wrapText(ctx, c.text, w / 2, 81, w - 76, 24, '#e2e8f0', 18);

    // 未知數
    if (step >= 1) {
      ctx.fillStyle = C;
      ctx.font = f(700, 16);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`未知數：${c.unknown}`, w / 2 - 96, 136);
      ctx.fillStyle = MUTED;
      ctx.font = f(600, 15);
      ctx.fillText(c.keyword, w / 2 + 66, 136);
      ctx.textAlign = 'left';
    }

    if (step >= 2) drawArrow(ctx, w / 2, 152, w / 2, 184, 'rgba(125, 211, 252, 0.6)', 2.4);

    // 下層：翻出來的式子
    if (step >= 2) {
      const items = (step >= 3)
        ? c.left().concat([T('=', C)], c.right())
        : c.left().concat([T('=', MUTED), T('?', MUTED)]);
      drawPanel(ctx, 24, 196, w - 48, 74, step >= 3 ? OK_COLOR : C, step >= 3 ? 0.10 : 0.06);
      drawExpr(ctx, items, w / 2, 233, 30, C, { maxW: w - 80, gap: 8 });
    }

    if (step >= 3) {
      drawChip(ctx, w / 2 - 130, 292, 260, 36, '一元一次方程式完成', OK_COLOR, 'rgba(52, 211, 153, 0.12)');
    }

    drawNote(ctx, NOTES[step], 356, MUTED, 15);

    if (stepLabel) stepLabel.textContent = `${step + 1} / 4`;
    if (btnPrev) btnPrev.disabled = (step === 0);
    if (btnNext) btnNext.disabled = (step === 3);

    if (fb) {
      fb.innerHTML = wrapFeedback(step >= 3
        ? `這句話列出來就是 \\(${c.tex}\\)。<strong>照文字的順序寫，不要跳著寫</strong>。`
        : '按「下一步」，一句一句把中文翻成方程式。');
      typeset([fb]);
    }
  }

  bindPickGroup(group, 'data-item', v => { idx = parseInt(v, 10); step = 0; draw(); });
  if (btnPrev) btnPrev.addEventListener('click', () => { if (step > 0) { step--; draw(); } });
  if (btnNext) btnNext.addEventListener('click', () => { if (step < 3) { step++; draw(); } });
  draw();
}

/* ==========================================================================
   重點 3：代入檢驗天平
   把 x 從 -4 拉到 8，看左式的值怎麼變；只有一個值能讓天平真的平起來，
   那個值就是這個方程式的解。
   ========================================================================== */
function initSubstituteCanvas() {
  const canvas = document.getElementById('canvas-substitute');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('sub-feedback');
  const group = document.getElementById('sub-eq-group');
  const slider = document.getElementById('sub-x-slider');
  const valOut = document.getElementById('sub-x-val');
  const C = C_JADE;

  const CASES = [
    {
      tex: '3x+5=14', right: 14, sol: 3,
      lhs: x => 3 * x + 5,
      leftItems: () => [xItems(3, C), T('+', C), T('5', C)],
      calc: x => `3 \\times ${x < 0 ? '(' + x + ')' : x} + 5 = ${3 * x + 5}`
    },
    {
      tex: '-2x+3=-7', right: -7, sol: 5,
      lhs: x => -2 * x + 3,
      leftItems: () => [xItems(-2, C), T('+', C), T('3', C)],
      calc: x => `(-2) \\times ${x < 0 ? '(' + x + ')' : x} + 3 = ${-2 * x + 3}`
    },
    {
      tex: '\\frac{x}{2}-1=3', right: 3, sol: 8,
      lhs: x => x / 2 - 1,
      leftItems: () => [VF(IT('x', C), T('2', C), C), T('-', C), T('1', C)],
      calc: x => `\\frac{${x}}{2} - 1 = ${numStr(x / 2 - 1)}`
    }
  ];

  let idx = 0, xv = 1;

  function draw() {
    const c = CASES[idx];
    const w = canvas.width;
    const lv = c.lhs(xv);
    const rv = c.right;
    const equal = Math.abs(lv - rv) < 1e-9;
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, '代入檢驗天平', C);

    // 代入後的算式
    drawPanel(ctx, 24, 48, w - 48, 52, C, 0.08);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = f(750, 19);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`x = ${xv} 時，左邊 = ${numStr(lv)}，右邊 = ${rv}`, w / 2, 74);
    ctx.textAlign = 'left';

    // 天平：右邊重就往右沉
    const tilt = clamp((rv - lv) * 0.05, -0.30, 0.30);
    drawScale(ctx, w / 2, 150, 132, equal ? 0 : tilt,
      { discs: lv, label: '左邊 ' + numStr(lv) },
      { discs: rv, label: '右邊 ' + rv },
      C, equal);

    // 判定
    const chipW = 250;
    drawChip(ctx, w / 2 - chipW / 2, 330, chipW, 38,
      equal ? `x = ${xv} 是這個方程式的解` : `x = ${xv} 不是解`,
      equal ? OK_COLOR : NO_COLOR,
      equal ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.10)');

    if (fb) {
      fb.innerHTML = wrapFeedback(equal
        ? `代入得 \\(${c.calc(xv)}\\)，<strong>兩邊相等</strong>，所以 \\(x = ${xv}\\) 是 \\(${c.tex}\\) 的<strong>解</strong>（也叫根）。`
        : `代入得 \\(${c.calc(xv)} \\neq ${rv}\\)，兩邊不相等，所以 \\(x = ${xv}\\) 不是解。繼續拉滑桿找找看。`);
      typeset([fb]);
    }
  }

  bindPickGroup(group, 'data-eq', v => { idx = parseInt(v, 10); draw(); });
  if (slider) {
    slider.addEventListener('input', () => {
      xv = parseInt(slider.value, 10);
      if (valOut) valOut.textContent = xv;
      draw();
    });
    xv = parseInt(slider.value, 10);
    if (valOut) valOut.textContent = xv;
  }
  draw();
}

/* ==========================================================================
   重點 4：等量公理操作台
   自己挑「同加、同減、同乘、同除」與數字，兩邊一起做，天平永遠不會歪；
   把左盤清到只剩一個鐵盒，x 就解出來了。
   ========================================================================== */
function initAxiomCanvas() {
  const canvas = document.getElementById('canvas-axiom');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('ax-feedback');
  const eqGroup = document.getElementById('ax-eq-group');
  const opGroup = document.getElementById('ax-op-group');
  const numGroup = document.getElementById('ax-num-group');
  const btnApply = document.getElementById('ax-apply');
  const btnUndo = document.getElementById('ax-undo');
  const btnReset = document.getElementById('ax-reset');
  const C = C_AMETHYST;

  // 方程式一律寫成 a·x + b = c
  const CASES = [
    { a: 2, b: 5, c: 9, tex: '2x+5=9' },
    { a: 3, b: 0, c: 12, tex: '3x=12' },
    { a: 1, b: -4, c: -6, tex: 'x-4=-6' }
  ];

  const OP_NAME = { add: '兩邊同加', sub: '兩邊同減', mul: '兩邊同乘', div: '兩邊同除以' };
  const OP_LAW = {
    add: '等量加法公理', sub: '等量減法公理',
    mul: '等量乘法公理', div: '等量除法公理'
  };

  let caseIdx = 0;
  let op = 'sub', num = 5;
  let state = null, history = [], lastMsg = '';

  function reset() {
    const c = CASES[caseIdx];
    state = { a: c.a, b: c.b, c: c.c };
    history = [];
    lastMsg = '';
  }

  function apply() {
    history.push(Object.assign({}, state));
    const n = num;
    if (op === 'add') { state.b += n; state.c += n; }
    else if (op === 'sub') { state.b -= n; state.c -= n; }
    else if (op === 'mul') { state.a *= n; state.b *= n; state.c *= n; }
    else if (op === 'div') { state.a /= n; state.b /= n; state.c /= n; }
    lastMsg = `${OP_NAME[op]} ${n}（${OP_LAW[op]}）`;
    draw();
  }

  // 目前方程式的 canvas 元件
  function eqItems() {
    const left = [];
    if (state.a !== 0) left.push(xItems(numStr(state.a) * 1, C));
    if (state.b !== 0 || state.a === 0) {
      if (left.length) left.push(T(state.b < 0 ? '-' : '+', C), T(numStr(Math.abs(state.b)), C));
      else left.push(T(numStr(state.b), C));
    }
    return left.concat([T('=', C), T(numStr(state.c), C)]);
  }

  function draw() {
    const w = canvas.width;
    const solved = (state.a === 1 && state.b === 0);
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, '等量公理操作台', C);

    // 目前的方程式
    drawPanel(ctx, 24, 46, w - 48, 54, solved ? OK_COLOR : C, solved ? 0.12 : 0.08);
    drawExpr(ctx, eqItems(), w / 2, 73, 27, solved ? OK_COLOR : C, { maxW: w - 80, gap: 7 });

    // 天平：做什麼都保持平衡
    drawScale(ctx, w / 2, 152, 132, 0,
      { boxes: state.a, discs: state.b, label: '左邊' },
      { discs: state.c, label: '右邊' },
      C, true);

    // 操作紀錄
    ctx.fillStyle = MUTED;
    ctx.font = f(600, 15);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lastMsg ? `剛才：${lastMsg}` : '選一個動作與數字，再按「兩邊一起做」', w / 2, 330);
    ctx.fillText(`已做 ${history.length} 步`, w / 2, 352);
    ctx.textAlign = 'left';

    if (solved) {
      drawChip(ctx, w / 2 - 120, 372, 240, 36, `解出來了：x = ${numStr(state.c)}`, OK_COLOR, 'rgba(52, 211, 153, 0.12)');
    } else {
      drawNote(ctx, '目標：把左邊清到只剩一個 x', 388, 'rgba(226, 232, 240, 0.65)', 15);
    }

    if (btnUndo) btnUndo.disabled = (history.length === 0);

    if (fb) {
      fb.innerHTML = wrapFeedback(solved
        ? `左邊只剩 \\(x\\)，右邊就是答案：\\(x = ${numStr(state.c)}\\)。<strong>每一步兩邊都做了一樣的事，天平從頭到尾沒有歪過</strong>。`
        : `目前是 \\(${numStr(state.a)}x ${state.b < 0 ? '-' : '+'} ${numStr(Math.abs(state.b))} = ${numStr(state.c)}\\)。想想看：要先<strong>清掉常數項</strong>，還是先<strong>把係數變成 1</strong>？`);
      typeset([fb]);
    }
  }

  bindPickGroup(eqGroup, 'data-eq', v => { caseIdx = parseInt(v, 10); reset(); draw(); });
  bindPickGroup(opGroup, 'data-op', v => { op = v; });
  bindPickGroup(numGroup, 'data-num', v => { num = parseInt(v, 10); });
  if (btnApply) btnApply.addEventListener('click', apply);
  if (btnUndo) btnUndo.addEventListener('click', () => {
    if (history.length) { state = history.pop(); lastMsg = '（已退回上一步）'; draw(); }
  });
  if (btnReset) btnReset.addEventListener('click', () => { reset(); draw(); });

  reset();
  draw();
}

/* 逐行推導的堆疊排版
   每一行的高度都不一樣（含分數的那行特別高），固定行距會讓分數與上下行咬在一起，
   所以逐行量高度再累加。做過的步驟留在上面並淡化，目前這行加底板、字級大一級。 */
function drawStepStack(ctx, lines, step, color, opts) {
  const o = opts || {};
  const w = ctx.canvas.width;
  const sizeCur = o.sizeCur || 26;
  const sizeOld = o.sizeOld || 21;
  let y = o.startY || 84;
  lines.forEach((ln, i) => {
    if (i > step) return;
    const cur = (i === step);
    const size = cur ? sizeCur : sizeOld;
    const items = ln.items();
    let h = size * 1.2;
    items.forEach(it => { h = Math.max(h, measure(ctx, it, size).h); });
    y += h / 2;
    if (cur) drawPanel(ctx, o.padX || 18, y - h / 2 - 12, w - (o.padX || 18) * 2, h + 24, color, 0.10);
    ctx.save();
    if (!cur) ctx.globalAlpha = 0.45;
    drawExpr(ctx, items, w / 2, y, size, cur ? color : DIM, { maxW: w - 64, gap: o.gap || 6 });
    ctx.restore();
    y += h / 2;
    if (cur && ln.note) {
      ctx.fillStyle = MUTED;
      ctx.font = f(600, 14);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ln.note, w / 2, y + 26);
      ctx.textAlign = 'left';
      y += 26;
    }
    y += 20;
  });
  return y;
}

/* ==========================================================================
   重點 5：移項傳送帶
   把一項送過等號的拱門，出來時加變減、減變加、乘變除、除變乘。
   ========================================================================== */
function initMoveCanvas() {
  const canvas = document.getElementById('canvas-move');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('mv-feedback');
  const group = document.getElementById('mv-eq-group');
  const btnPrev = document.getElementById('mv-prev');
  const btnNext = document.getElementById('mv-next');
  const stepLabel = document.getElementById('mv-step');
  const C = C_EMBER;

  const L = s => T(s, C);
  const X = () => IT('x', C);

  const CASES = [
    {
      title: 'x - 9 = 13',
      lines: [
        { items: () => [X(), L('-'), L('9'), L('='), L('13')], note: '原方程式' },
        { items: () => [X(), L('='), L('13'), L('+'), L('9')], note: '把 -9 送過等號，減號變加號' },
        { items: () => [X(), L('='), L('22')], note: '化簡，得 x = 22' }
      ],
      why: '\\(x-9=13\\)：\\(-9\\) 移項到右邊變成 \\(+9\\)，所以 \\(x=13+9=22\\)。'
    },
    {
      title: '27 = x + 15',
      lines: [
        { items: () => [L('27'), L('='), X(), L('+'), L('15')], note: '原方程式，未知數在右邊也沒關係' },
        { items: () => [L('27'), L('-'), L('15'), L('='), X()], note: '把 +15 送到左邊，加號變減號' },
        { items: () => [L('12'), L('='), X()], note: '化簡得 12 = x' },
        { items: () => [X(), L('='), L('12')], note: '習慣上把未知數寫在左邊' }
      ],
      why: '\\(27=x+15\\)：\\(+15\\) 移項變 \\(-15\\)，得 \\(27-15=x\\)，即 \\(x=12\\)。'
    },
    {
      title: 'x ÷ 6 = -4',
      lines: [
        { items: () => [VF(X(), L('6'), C), L('='), L('-4')], note: '原方程式，左邊是 x 除以 6' },
        { items: () => [X(), L('='), L('-4'), L('×'), L('6')], note: '把 ÷6 送過等號，除號變乘號' },
        { items: () => [X(), L('='), L('-24')], note: '化簡，得 x = -24' }
      ],
      why: '\\(\\frac{x}{6}=-4\\) 就是 \\(x \\div 6=-4\\)：\\(\\div 6\\) 移項變 \\(\\times 6\\)，得 \\(x=(-4) \\times 6=-24\\)。'
    },
    {
      title: 'x × 5 = -35',
      lines: [
        { items: () => [SEQ([X(), L('×'), L('5')], C, 5), L('='), L('-35')], note: '原方程式，左邊是 x 乘以 5' },
        { items: () => [X(), L('='), VF(L('-35'), L('5'), C)], note: '把 ×5 送過等號，乘號變除號' },
        { items: () => [X(), L('='), L('-7')], note: '化簡，得 x = -7' }
      ],
      why: '\\(x \\times 5=-35\\)：\\(\\times 5\\) 移項變 \\(\\div 5\\)，得 \\(x=\\frac{-35}{5}=-7\\)。'
    },
    {
      title: '6x = 4x + 10',
      lines: [
        { items: () => [xItems(6, C), L('='), xItems(4, C), L('+'), L('10')], note: '兩邊都有未知數' },
        { items: () => [xItems(6, C), L('-'), xItems(4, C), L('='), L('10')], note: '把 4x 送到左邊，變成 -4x' },
        { items: () => [xItems(2, C), L('='), L('10')], note: '合併同類項：6x - 4x = 2x' },
        { items: () => [X(), L('='), L('5')], note: '×2 移項變 ÷2，得 x = 5' }
      ],
      why: '兩邊都有 \\(x\\) 時，<strong>先把含 x 的項集中到同一邊</strong>：\\(6x-4x=10\\)，得 \\(2x=10\\)，\\(x=5\\)。'
    },
    {
      title: '5x + 7 = 8x - 5',
      lines: [
        { items: () => [xItems(5, C), L('+'), L('7'), L('='), xItems(8, C), L('-'), L('5')], note: '兩邊都有未知數，也都有常數' },
        { items: () => [xItems(5, C), L('-'), xItems(8, C), L('='), L('-5'), L('-'), L('7')], note: '含 x 的移到左邊、常數移到右邊，全部變號' },
        { items: () => [xItems(-3, C), L('='), L('-12')], note: '兩邊各自合併：5x - 8x = -3x，-5 - 7 = -12' },
        { items: () => [X(), L('='), L('4')], note: '×(-3) 移項變 ÷(-3)，得 x = 4' }
      ],
      why: '\\(5x+7=8x-5\\)：含 \\(x\\) 的往左、常數往右，<strong>跨過等號的每一項都要變號</strong>，得 \\(-3x=-12\\)，所以 \\(x=4\\)。'
    }
  ];

  let idx = 0, step = 0;

  function draw() {
    const c = CASES[idx];
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, '移項傳送帶', C);

    const endY = drawStepStack(ctx, c.lines, step, C, { startY: 78, sizeCur: 27, sizeOld: 22, padX: 20, gap: 7 });

    // 最後一步：解出來了
    if (step === c.lines.length - 1) {
      drawChip(ctx, w / 2 - 90, Math.min(endY + 6, canvas.height - 44), 180, 34, '解完成', OK_COLOR, 'rgba(52, 211, 153, 0.12)');
    }

    if (stepLabel) stepLabel.textContent = `${step + 1} / ${c.lines.length}`;
    if (btnPrev) btnPrev.disabled = (step === 0);
    if (btnNext) btnNext.disabled = (step === c.lines.length - 1);

    if (fb) {
      fb.innerHTML = wrapFeedback(step === c.lines.length - 1
        ? c.why
        : '按「下一步」，看這一項怎麼跨過等號、怎麼變號。');
      typeset([fb]);
    }
  }

  bindPickGroup(group, 'data-eq', v => { idx = parseInt(v, 10); step = 0; draw(); });
  if (btnPrev) btnPrev.addEventListener('click', () => { if (step > 0) { step--; draw(); } });
  if (btnNext) btnNext.addEventListener('click', () => {
    if (step < CASES[idx].lines.length - 1) { step++; draw(); }
  });
  draw();
}

/* ==========================================================================
   重點 6：推導檢查台
   模式一：括號與分數的方程式逐行化簡。
   模式二：課本的挑錯題——別人的解法擺出來，點出從哪一行開始錯。
   ========================================================================== */
function initExpandCanvas() {
  const canvas = document.getElementById('canvas-expand');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('ex-feedback');
  const modeGroup = document.getElementById('ex-mode-group');
  const itemGroup = document.getElementById('ex-item-group');
  const btnPrev = document.getElementById('ex-prev');
  const btnNext = document.getElementById('ex-next');
  const stepLabel = document.getElementById('ex-step');
  const stepRow = document.getElementById('ex-step-row');
  const itemRow = document.getElementById('ex-item-row');
  const C = C_ROSE;

  const L = s => T(s, C);
  const X = () => IT('x', C);

  const CASES = [
    {
      lines: [
        { items: () => [L('3'), GRP([X(), L('-'), L('2')], '()', C), L('='), L('-2'), GRP([X(), L('+'), L('3')], '()', C), L('+'), L('10')], note: '原方程式：兩邊都有括號' },
        { items: () => [xItems(3, C), L('-'), L('6'), L('='), xItems(-2, C), L('-'), L('6'), L('+'), L('10')], note: '用分配律去括號，括號前是負號時裡面每一項都變號' },
        { items: () => [xItems(3, C), L('+'), xItems(2, C), L('='), L('-6'), L('+'), L('10'), L('+'), L('6')], note: '含 x 的移到左邊、常數移到右邊，跨過等號就變號' },
        { items: () => [xItems(5, C), L('='), L('10')], note: '兩邊各自合併同類項' },
        { items: () => [X(), L('='), L('2')], note: '×5 移項變 ÷5，得 x = 2' }
      ],
      why: '\\(3(x-2)=-2(x+3)+10\\)：<strong>先去括號</strong>，再把含 \\(x\\) 的項與常數項各自集中，得 \\(5x=10\\)，所以 \\(x=2\\)。'
    },
    {
      lines: [
        { items: () => [L('2'), GRP([L('3'), GRP([X(), L('+'), L('1')], '()', C), L('-'), X()], '[]', C), L('='), L('14')], note: '原方程式：括號裡面還有括號' },
        { items: () => [L('2'), GRP([xItems(3, C), L('+'), L('3'), L('-'), X()], '[]', C), L('='), L('14')], note: '多層括號由內而外：先去小括號' },
        { items: () => [L('2'), GRP([xItems(2, C), L('+'), L('3')], '[]', C), L('='), L('14')], note: '把中括號裡面先合併：3x - x = 2x' },
        { items: () => [xItems(4, C), L('+'), L('6'), L('='), L('14')], note: '再去中括號，2 要乘到裡面每一項' },
        { items: () => [xItems(4, C), L('='), L('8')], note: '+6 移項變 -6' },
        { items: () => [X(), L('='), L('2')], note: '×4 移項變 ÷4，得 x = 2' }
      ],
      why: '\\(2[3(x+1)-x]=14\\)：<strong>多層括號由內而外</strong>，先小括號再中括號，得 \\(4x+6=14\\)，所以 \\(x=2\\)。'
    },
    {
      lines: [
        { items: () => [VF(X(), L('2'), C), L('-'), VF(L('1'), L('3'), C), L('='), VF(X(), L('6'), C), L('+'), L('1')], note: '原方程式：分母有 2、3、6' },
        { items: () => [GRP([VF(X(), L('2'), C), L('-'), VF(L('1'), L('3'), C)], '()', C), L('×'), L('6'), L('='), GRP([VF(X(), L('6'), C), L('+'), L('1')], '()', C), L('×'), L('6')], note: '兩邊同乘分母的最小公倍數 6（等量乘法公理）' },
        { items: () => [xItems(3, C), L('-'), L('2'), L('='), X(), L('+'), L('6')], note: '每一項都要乘到，常數 1 也不例外' },
        { items: () => [xItems(3, C), L('-'), X(), L('='), L('6'), L('+'), L('2')], note: '含 x 的移到左邊、常數移到右邊' },
        { items: () => [xItems(2, C), L('='), L('8')], note: '合併同類項' },
        { items: () => [X(), L('='), L('4')], note: '×2 移項變 ÷2，得 x = 4' }
      ],
      why: '有分數時<strong>兩邊同乘分母的最小公倍數</strong>把分母清掉：\\(6\\) 要乘到<strong>每一項</strong>，得 \\(3x-2=x+6\\)，所以 \\(x=4\\)。'
    }
  ];

  // 挑錯題：課本 P.202 的題型，數字改過
  const WRONG = {
    head: '小翊解  (x+7)/3 = (x-2)/4 + 2',
    lines: [
      { items: () => [VF(SEQ([X(), L('+'), L('7')], C, 5), L('3'), C), L('='), VF(SEQ([X(), L('-'), L('2')], C, 5), L('4'), C), L('+'), L('2')], ok: true },
      { items: () => [L('4'), GRP([X(), L('+'), L('7')], '()', C), L('='), L('3'), GRP([X(), L('-'), L('2')], '()', C), L('+'), L('2')], ok: false },
      { items: () => [xItems(4, C), L('+'), L('28'), L('='), xItems(3, C), L('-'), L('6'), L('+'), L('2')], ok: false },
      { items: () => [X(), L('='), L('-32')], ok: false }
    ],
    fixed: [
      { items: () => [L('4'), GRP([X(), L('+'), L('7')], '()', C), L('='), L('3'), GRP([X(), L('-'), L('2')], '()', C), L('+'), L('24')], note: '兩邊同乘 12，常數項 2 也要乘 12' },
      { items: () => [xItems(4, C), L('+'), L('28'), L('='), xItems(3, C), L('-'), L('6'), L('+'), L('24')], note: '去括號' },
      { items: () => [xItems(4, C), L('-'), xItems(3, C), L('='), L('-6'), L('+'), L('24'), L('-'), L('28')], note: '移項，跨過等號就變號' },
      { items: () => [X(), L('='), L('-10')], note: '合併，得 x = -10' }
    ]
  };

  let mode = 'steps';
  let idx = 0, step = 0;
  let picked = -1;       // 挑錯模式：學生點的行（0 起算）
  let lineRects = [];

  function drawSteps() {
    const c = CASES[idx];
    const w = canvas.width;
    drawTitle(ctx, '括號與分數推導器', C);
    const endY = drawStepStack(ctx, c.lines, step, C, { startY: 72, sizeCur: 24, sizeOld: 20, padX: 18, gap: 6 });
    if (step === c.lines.length - 1) {
      drawChip(ctx, w / 2 - 90, Math.min(endY + 6, canvas.height - 40), 180, 32, '解完成', OK_COLOR, 'rgba(52, 211, 153, 0.12)');
    }
    if (stepLabel) stepLabel.textContent = `${step + 1} / ${c.lines.length}`;
    if (btnPrev) btnPrev.disabled = (step === 0);
    if (btnNext) btnNext.disabled = (step === c.lines.length - 1);
    if (fb) {
      fb.innerHTML = wrapFeedback(step === c.lines.length - 1
        ? c.why
        : '按「下一步」，一行一行看括號怎麼拆、分母怎麼清掉。');
      typeset([fb]);
    }
  }

  function drawError() {
    const w = canvas.width;
    drawTitle(ctx, '挑錯題：從哪一行開始錯？', C);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = f(700, 16);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(WRONG.head, w / 2, 52);
    ctx.textAlign = 'left';

    lineRects = [];
    const correctLine = 1;   // 第 2 行開始錯
    WRONG.lines.forEach((ln, i) => {
      const y = 92 + i * 58;
      const boxTop = y - 24;
      lineRects.push({ top: boxTop, bottom: boxTop + 48, index: i });
      let col = C, alpha = 0.05;
      if (picked >= 0) {
        if (i === correctLine) { col = NO_COLOR; alpha = 0.14; }
        else if (i === picked) { col = OK_COLOR; alpha = 0.10; }
      }
      drawPanel(ctx, 52, boxTop, w - 76, 48, col, alpha);
      ctx.fillStyle = MUTED;
      ctx.font = f(700, 14);
      ctx.textBaseline = 'middle';
      ctx.fillText(`行 ${i + 1}`, 20, y);
      drawExpr(ctx, ln.items(), w / 2 + 12, y, 21, picked >= 0 && i >= correctLine ? NO_COLOR : C,
        { maxW: w - 130, gap: 6 });
    });

    if (picked < 0) {
      drawNote(ctx, '直接點你覺得開始出錯的那一行', 340, 'rgba(226, 232, 240, 0.7)', 16);
    } else if (picked === correctLine) {
      drawChip(ctx, w / 2 - 150, 328, 300, 34, '答對了：第 2 行開始錯', OK_COLOR, 'rgba(52, 211, 153, 0.12)');
      // 正確做法
      WRONG.fixed.slice(0, 2).forEach((ln, i) => {
        drawExpr(ctx, ln.items(), w / 2, 380 + i * 34, 19, OK_COLOR, { maxW: w - 60, gap: 6 });
      });
    } else {
      drawChip(ctx, w / 2 - 150, 328, 300, 34, `第 ${picked + 1} 行沒問題，再看一次`, NO_COLOR, 'rgba(251, 113, 133, 0.10)');
      drawNote(ctx, '提示：兩邊同乘一個數時，「每一項」都要乘到', 380, MUTED, 15);
    }

    if (stepLabel) stepLabel.textContent = '挑錯';
    if (fb) {
      if (picked === correctLine) {
        fb.innerHTML = wrapFeedback('第 2 行兩邊同乘 \\(12\\) 時，右邊的常數 \\(2\\) <strong>也要乘 \\(12\\)</strong>，應該是 \\(4(x+7)=3(x-2)+24\\)。少乘那一項，後面全錯，正確答案是 \\(x=-10\\)。');
      } else if (picked >= 0) {
        fb.innerHTML = wrapFeedback('再想想：<strong>等量乘法公理是「兩邊」同乘</strong>，而右邊是 \\(\\frac{x-2}{4}+2\\) 兩項相加，兩項都要乘到。');
      } else {
        fb.innerHTML = wrapFeedback('這是課本的挑錯題型。小翊的答案 \\(x=-32\\) 是錯的，<strong>點一下你認為開始出錯的那一行</strong>。');
      }
      typeset([fb]);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mode === 'steps') drawSteps(); else drawError();
    if (stepRow) stepRow.style.display = (mode === 'steps') ? '' : 'none';
    if (itemRow) itemRow.style.display = (mode === 'steps') ? '' : 'none';
  }

  canvas.addEventListener('click', e => {
    if (mode !== 'error') return;
    const p = canvasPos(canvas, e);
    const hit = lineRects.find(r => p.y >= r.top && p.y <= r.bottom);
    if (hit) { picked = hit.index; draw(); }
  });

  bindPickGroup(modeGroup, 'data-mode', v => { mode = v; step = 0; picked = -1; draw(); });
  bindPickGroup(itemGroup, 'data-item', v => { idx = parseInt(v, 10); step = 0; draw(); });
  if (btnPrev) btnPrev.addEventListener('click', () => { if (step > 0) { step--; draw(); } });
  if (btnNext) btnNext.addEventListener('click', () => {
    if (step < CASES[idx].lines.length - 1) { step++; draw(); }
  });
  draw();
}
