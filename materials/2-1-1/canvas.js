document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quiz System
  initQuizSystem();

  // Initialize Canvas Simulations
  initExpressCanvas();
  initValueCanvas();
  initTermsCanvas();
  initBracketCanvas();
  initSimplifyCanvas();
  initEqCheckCanvas();
  initSolutionCanvas();
  initInfiniteCanvas();
});

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // Correct answers mapping for Section 2 / 1-1 (16 Quizzes)
  const answers = {
    '2-1-1-1': 'A', // 先說鉛筆 x 元，所以是 6x+4y
    '2-1-1-2': 'C', // 5a-8b+1：兩種符號、次數都是 1、沒有等號
    '2-1-2-1': 'A', // 5(-2)-2(3)+4 = -12
    '2-1-2-2': 'A', // 4(1/2)+6(-1/3) = 2-2 = 0
    '2-1-3-1': 'A', // 4x+3y-4
    '2-1-3-2': 'B', // y 項係數是 -4（要連負號一起讀）
    '2-1-4-1': 'B', // (5x-3y)-(2x-7y) = 3x+4y
    '2-1-4-2': 'C', // 直式減法整列變號，答案是 3x+3y-8
    '2-1-5-1': 'A', // 4(2x-3y+1)-3(x-2y) = 5x-6y+4
    '2-1-5-2': 'A', // 通分後 (4x-10y+3)/12
    '2-1-6-1': 'A', // 45x+20y=430
    '2-1-6-2': 'B', // 5x+2y-1=2y+9 化簡後只剩一元
    '2-1-7-1': 'B', // x=4、y=2 代入 3x-2y=8 成立
    '2-1-7-2': 'B', // 解必須成對出現
    '2-1-8-1': 'D', // 沒有限制時有無限多組解
    '2-1-8-2': 'B'  // 3x+5y=60 且都是正整數 → 3 種
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

// 復古車票印刷配色：油墨青、票券米黃、套印洋紅、天青、常數灰藍、警示橘
const C_INK = '#5eead4';
const C_PAPER = '#fcd34d';
const C_MAGENTA = '#f9a8d4';
const C_SKY = '#7dd3fc';
const C_SLATE = '#cbd5e1';
const C_EMBER = '#fdba74';

/* ==========================================================================
   3. 本節專屬繪圖：票根、票根上的文字、驗票閘門
   ========================================================================== */

// 票根中央（撕線左半邊）的標籤
function ticketLabel(ctx, x, y, w, h, text, color, size, italic) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = italic ? fi(800, size || 17) : f(800, size || 17);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w * 0.37, y + h / 2);
  ctx.restore();
}

// 一排平放的票根（開發約束 33：要數的東西一律平放排成一排）
function drawTicketRow(ctx, x, y, n, tw, th, gap, label, color) {
  for (let i = 0; i < n; i++) {
    const tx = x + i * (tw + gap);
    drawTicket(ctx, tx, y, tw, th, color);
    ticketLabel(ctx, tx, y, tw, th, label, color, 16, true);
  }
}

// 木製驗票閘門：兩根立柱加一根可抬起的橫桿
function drawGate(ctx, cx, cy, open, color) {
  ctx.save();
  const postW = 13, postH = 76;
  [-58, 58].forEach(dx => {
    roundRect(ctx, cx + dx - postW / 2, cy - postH / 2, postW, postH, 4);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.18)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  // 橫桿：開啟時繞左柱往上抬。角度不能再大，否則桿尖會戳進上方的計算列
  const ang = open ? -0.7 : 0;
  ctx.translate(cx - 58, cy - 14);
  ctx.rotate(ang);
  roundRect(ctx, 0, -5, 116, 10, 5);
  ctx.fillStyle = open ? 'rgba(52, 211, 153, 0.30)' : 'rgba(251, 113, 133, 0.25)';
  ctx.fill();
  ctx.strokeStyle = open ? OK_COLOR : NO_COLOR;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  // 號誌燈放在閘門右側，不占下方空間
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx + 96, cy - 18, 9, 0, Math.PI * 2);
  ctx.fillStyle = open ? 'rgba(52, 211, 153, 0.85)' : 'rgba(251, 113, 133, 0.8)';
  ctx.fill();
  ctx.restore();
}

// 把 ax + by + c 這種項的陣列排成 canvas 算式元件
//   terms: [{ c: 係數, v: 'x' | 'y' | null }]
function termItems(terms, colorOf) {
  const out = [];
  terms.forEach((t, i) => {
    if (t.c === 0 && t.v) return;
    const col = colorOf ? colorOf(t) : C_SLATE;
    if (out.length) out.push(T(t.c < 0 ? '-' : '+', C_SLATE));
    else if (t.c < 0) out.push(T('-', col));
    const a = Math.abs(t.c);
    if (!t.v) {
      out.push(T(String(a), col));
    } else if (a === 1) {
      out.push(IT(t.v, col));
    } else {
      out.push(SEQ([T(String(a), col), IT(t.v, col)], col, 1));
    }
  });
  if (!out.length) out.push(T('0', C_SLATE));
  return out;
}

/* ==========================================================================
   重點 1：售票口列式機
   兩支滑桿決定各買幾張，票根一張張排出來，右邊的二元一次式跟著長出來。
   ========================================================================== */
function initExpressCanvas() {
  const canvas = document.getElementById('canvas-express');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('ex-feedback');
  const out = document.getElementById('ex-formula');
  const group = document.getElementById('ex-case-group');
  const sA = document.getElementById('ex-a-slider');
  const sB = document.getElementById('ex-b-slider');
  const vA = document.getElementById('ex-a-val');
  const vB = document.getElementById('ex-b-val');
  const nA = document.getElementById('ex-a-name');
  const nB = document.getElementById('ex-b-name');

  const CASES = [
    { title: '動物園售票口', a: '全票', b: '優待票', unit: '張', money: '元' },
    { title: '早餐店櫃檯', a: '漢堡', b: '豆漿', unit: '份', money: '元' },
    { title: '資源回收站', a: '鋁罐', b: '寶特瓶', unit: '公斤', money: '元' }
  ];

  let idx = 0, a = 5, b = 2;

  function draw() {
    const c = CASES[idx];
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, c.title, C_INK);

    // 兩塊價目牌
    const bw = 208, bh = 40;
    [[c.a, 'x', C_PAPER, 30], [c.b, 'y', C_SKY, 30 + bw + 44]].forEach(([name, sym, col, bx]) => {
      drawPanel(ctx, bx, 46, bw, bh, col, 0.10);
      ctx.fillStyle = col;
      ctx.font = f(750, 15);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${name}每${c.unit === '公斤' ? '公斤' : (c.unit === '份' ? '份' : '張')}`, bx + bw * 0.36, 66);
      ctx.font = fi(850, 21);
      ctx.fillText(sym, bx + bw * 0.72, 66);
      ctx.font = f(700, 14);
      ctx.fillText(c.money, bx + bw * 0.87, 67);
      ctx.textAlign = 'left';
    });

    // 兩排票根：平放、間隔一致（開發約束 33）
    const tw = 62, th = 40, gap = 10;
    const rowW = n => n * tw + Math.max(0, n - 1) * gap;
    ctx.font = f(650, 13);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    ctx.fillStyle = MUTED;
    ctx.fillText(`${c.a} ${a} ${c.unit}`, 24, 122);
    if (a > 0) drawTicketRow(ctx, 24, 138, a, tw, th, gap, 'x', C_PAPER);
    else {
      ctx.fillStyle = DIM;
      ctx.fillText('（一' + c.unit + '都沒有）', 24, 158);
    }

    ctx.fillStyle = MUTED;
    ctx.font = f(650, 13);
    ctx.fillText(`${c.b} ${b} ${c.unit}`, 24, 204);
    if (b > 0) drawTicketRow(ctx, 24, 220, b, tw, th, gap, 'y', C_SKY);
    else {
      ctx.fillStyle = DIM;
      ctx.fillText('（一' + c.unit + '都沒有）', 24, 240);
    }

    // 每一排的小計
    ctx.textAlign = 'right';
    ctx.font = f(750, 14);
    if (a > 0) {
      ctx.fillStyle = C_PAPER;
      ctx.fillText(`= ${a === 1 ? '' : a}x ${c.money}`, w - 24, 158);
    }
    if (b > 0) {
      ctx.fillStyle = C_SKY;
      ctx.fillText(`= ${b === 1 ? '' : b}y ${c.money}`, w - 24, 240);
    }
    ctx.textAlign = 'left';

    // 合計算式
    const terms = [];
    if (a > 0) terms.push({ c: a, v: 'x' });
    if (b > 0) terms.push({ c: b, v: 'y' });
    drawEqPanel(ctx, termItems(terms, t => (t.v === 'x' ? C_PAPER : C_SKY)), 318, C_INK, { h: 32, size: 26 });

    drawNote(ctx, a === 0 && b === 0 ? `什麼都沒買，合計 0 ${c.money}` : `合計（${c.money}）`, 368, MUTED, 14);

    const tex = termTex(terms);
    if (out) {
      out.innerHTML = `合計：${wbrEq(`(${tex})`)} ${c.money}`;
      typeset([out]);
    }

    if (fb) {
      let html;
      if (a === 0 && b === 0) {
        html = `兩種都買 \\(0\\) ${c.unit}，合計當然是 \\(0\\) ${c.money}。<strong>拉動滑桿</strong>看式子怎麼長出來。`;
      } else if (a === 0 || b === 0) {
        const only = a === 0 ? c.b : c.a;
        html = `只買了${only}，所以式子裡<strong>只剩一種符號</strong>：\\(${tex}\\)。這時它是<strong>一元</strong>一次式；兩種都買，才會是二元一次式。`;
      } else {
        html = `${c.a} \\(${a}\\) ${c.unit}花 \\(${a === 1 ? '' : a}x\\) ${c.money}、${c.b} \\(${b}\\) ${c.unit}花 \\(${b === 1 ? '' : b}y\\) ${c.money}，合計 \\((${tex})\\) ${c.money}。<strong>兩種數量，兩個符號</strong>，各乘各的再相加。`;
      }
      fb.innerHTML = wrapFeedback(html);
      typeset([fb]);
    }
  }

  function syncNames() {
    const c = CASES[idx];
    if (nA) nA.textContent = c.a;
    if (nB) nB.textContent = c.b;
  }

  bindPickGroup(group, 'data-case', v => { idx = parseInt(v, 10); syncNames(); draw(); });
  if (sA) sA.addEventListener('input', () => { a = parseInt(sA.value, 10); if (vA) vA.textContent = a; draw(); });
  if (sB) sB.addEventListener('input', () => { b = parseInt(sB.value, 10); if (vB) vB.textContent = b; draw(); });
  if (sA) { a = parseInt(sA.value, 10); if (vA) vA.textContent = a; }
  if (sB) { b = parseInt(sB.value, 10); if (vB) vB.textContent = b; }
  syncNames();
  draw();
}

/* ==========================================================================
   重點 2：代入計算台
   兩張票根各自帶一個數字，逐項算出每一項的值再加總。
   ========================================================================== */
function initValueCanvas() {
  const canvas = document.getElementById('canvas-value');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('vl-feedback');
  const out = document.getElementById('vl-formula');
  const group = document.getElementById('vl-eq-group');
  const sX = document.getElementById('vl-x-slider');
  const sY = document.getElementById('vl-y-slider');
  const vX = document.getElementById('vl-x-val');
  const vY = document.getElementById('vl-y-val');

  const CASES = [
    { terms: [{ c: 4, v: 'x' }, { c: -3, v: 'y' }] },
    { terms: [{ c: 2, v: 'x' }, { c: 5, v: 'y' }, { c: -1, v: null }] },
    { terms: [{ c: -1, v: 'x' }, { c: 3, v: 'y' }] }
  ];

  let idx = 0, xv = 2, yv = -1;

  function draw() {
    const c = CASES[idx];
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, '代入計算台', C_INK);

    // 兩張帶著數字的票根
    const tw = 122, th = 46;
    [[ 'x', xv, C_PAPER, 74 ], [ 'y', yv, C_SKY, 74 + tw + 60 ]].forEach(([sym, val, col, tx]) => {
      drawTicket(ctx, tx, 48, tw, th, col);
      ctx.fillStyle = col;
      ctx.font = fi(800, 19);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sym, tx + tw * 0.20, 48 + th / 2);
      ctx.font = f(750, 18);
      ctx.fillText('= ' + val, tx + tw * 0.50, 48 + th / 2);
      ctx.textAlign = 'left';
    });

    // 原式
    drawNote(ctx, '原式', 118, MUTED, 13);
    drawExpr(ctx, termItems(c.terms, t => (t.v === 'x' ? C_PAPER : (t.v === 'y' ? C_SKY : C_SLATE))),
      w / 2, 144, 25, C_SLATE, { maxW: w - 60 });

    // 逐項代入
    let total = 0;
    let y0 = 190;
    ctx.textBaseline = 'middle';
    c.terms.forEach(t => {
      const col = t.v === 'x' ? C_PAPER : (t.v === 'y' ? C_SKY : C_SLATE);
      const val = t.v ? t.c * (t.v === 'x' ? xv : yv) : t.c;
      total += val;
      const lhs = t.v
        ? `${t.c === 1 ? '' : (t.c === -1 ? '-' : t.c)} ${t.v}`
        : String(t.c);
      const mid = t.v
        ? `${sub(t.c)} × ${sub(t.v === 'x' ? xv : yv)}`
        : String(t.c);
      drawPanel(ctx, 40, y0 - 17, w - 80, 34, col, 0.07);
      ctx.fillStyle = col;
      ctx.font = f(700, 16);
      ctx.textAlign = 'left';
      ctx.fillText(lhs.trim(), 56, y0);
      ctx.fillStyle = MUTED;
      ctx.fillText('→', 108, y0);
      ctx.fillStyle = col;
      ctx.font = f(700, 16);
      ctx.fillText(mid, 136, y0);
      ctx.textAlign = 'right';
      ctx.fillStyle = val < 0 ? NO_COLOR : OK_COLOR;
      ctx.font = f(800, 17);
      ctx.fillText('= ' + numStr(val), w - 56, y0);
      ctx.textAlign = 'left';
      y0 += 42;
    });

    // 總計
    drawEqPanel(ctx, [T('式子的值 =', C_SLATE), T(numStr(total), total < 0 ? NO_COLOR : OK_COLOR)],
      y0 + 22, C_INK, { h: 28, size: 24 });

    const tex = termTex(c.terms);
    const steps = c.terms.map(t => (t.v ? `${sub(t.c)} \\times ${sub(t.v === 'x' ? xv : yv)}` : String(t.c)))
      .join(' + ').replace(/\+ \(-/g, '+ (-');
    if (out) {
      out.innerHTML = wbrEq(`${tex} = ${numStr(total)}`);
      typeset([out]);
    }
    if (fb) {
      // 提醒裡的例子要取自「當下這個狀態」真的出現的那一項（開發約束 27）
      const negT = c.terms.find(t => t.v && (t.v === 'x' ? xv : yv) < 0);
      let tail;
      if (negT) {
        const nv = negT.v === 'x' ? xv : yv;
        tail = `　注意<strong>負數一定要加括號</strong>，\\(${negT.c} \\times (${nv})\\) 不能寫成 \\(${negT.c} \\times ${nv}\\)。`;
      } else {
        tail = '　把滑桿拉到負數，看括號怎麼加。';
      }
      fb.innerHTML = wrapFeedback(
        `把 \\(x=${xv}\\)、\\(y=${yv}\\) <strong>一起</strong>代入，逐項算完再相加，得到 \\(${numStr(total)}\\)。` + tail
      );
      typeset([fb]);
    }
  }

  bindPickGroup(group, 'data-eq', v => { idx = parseInt(v, 10); draw(); });
  if (sX) sX.addEventListener('input', () => { xv = parseInt(sX.value, 10); if (vX) vX.textContent = xv; draw(); });
  if (sY) sY.addEventListener('input', () => { yv = parseInt(sY.value, 10); if (vY) vY.textContent = yv; draw(); });
  if (sX) { xv = parseInt(sX.value, 10); if (vX) vX.textContent = xv; }
  if (sY) { yv = parseInt(sY.value, 10); if (vY) vY.textContent = yv; }
  draw();
}

/* ==========================================================================
   重點 3：票根分類箱
   每一項印成一張票根，先分進 x 箱、y 箱、常數箱，再各自合併。
   滑桿只會動到它自己那一箱，這正是「同類項才能合併」的意思。
   ========================================================================== */
function initTermsCanvas() {
  const canvas = document.getElementById('canvas-terms');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('tm-feedback');
  const out = document.getElementById('tm-formula');
  const group = document.getElementById('tm-eq-group');
  const sK = document.getElementById('tm-k-slider');
  const vK = document.getElementById('tm-k-val');
  const btnNext = document.getElementById('tm-next');
  const btnPrev = document.getElementById('tm-prev');
  const btnReset = document.getElementById('tm-reset');

  // 每個式子固定四到五項，其中一項的係數由滑桿控制（kAt 指出是第幾項）
  const CASES = [
    { name: '式子一', kAt: 1, terms: k => [{ c: 3, v: 'x' }, { c: k, v: 'y' }, { c: -1, v: 'x' }, { c: 2, v: 'y' }] },
    { name: '式子二', kAt: 3, terms: k => [{ c: 5, v: 'x' }, { c: -2, v: 'y' }, { c: 3, v: null }, { c: k, v: 'x' }, { c: -7, v: null }] },
    { name: '式子三', kAt: 2, terms: k => [{ c: -1, v: 'x' }, { c: 4, v: 'y' }, { c: k, v: null }, { c: -6, v: 'y' }, { c: 2, v: null }] }
  ];

  const STEP_MAX = 3;
  let idx = 0, k = 2, step = 0;

  function colOf(t) {
    return t.v === 'x' ? C_PAPER : (t.v === 'y' ? C_SKY : C_MAGENTA);
  }

  function merged(terms) {
    let sx = 0, sy = 0, sc = 0;
    terms.forEach(t => {
      if (t.v === 'x') sx += t.c;
      else if (t.v === 'y') sy += t.c;
      else sc += t.c;
    });
    const out2 = [];
    if (sx !== 0) out2.push({ c: sx, v: 'x' });
    if (sy !== 0) out2.push({ c: sy, v: 'y' });
    if (sc !== 0) out2.push({ c: sc, v: null });
    return out2.length ? out2 : [{ c: 0, v: null }];
  }

  function draw() {
    const c = CASES[idx];
    const terms = c.terms(k);
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, '票根分類箱', C_INK);

    // 原式永遠在最上面
    drawNote(ctx, '原式', 54, MUTED, 13);
    drawExpr(ctx, termItems(terms, colOf), w / 2, 82, 24, C_SLATE, { maxW: w - 50 });

    if (step >= 1) {
      // 每一項印成一張票根，平放成一排
      const n = terms.length;
      const tw = Math.min(84, Math.floor((w - 60 - (n - 1) * 8) / n));
      const th = 40;
      const totalW = n * tw + (n - 1) * 8;
      let tx = (w - totalW) / 2;
      terms.forEach(t => {
        const col = colOf(t);
        drawTicket(ctx, tx, 116, tw, th, col);
        ctx.fillStyle = col;
        ctx.font = f(750, 15);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const a = Math.abs(t.c);
        const body = !t.v ? String(a) : (a === 1 ? t.v : a + t.v);
        ctx.fillText((t.c < 0 ? '-' : '+') + body, tx + tw * 0.37, 136);
        ctx.textAlign = 'left';
        tx += tw + 8;
      });
      drawNote(ctx, '加號隔開的每一部分，就是一「項」', 172, MUTED, 13);
    }

    if (step >= 2) {
      // 三個分類箱
      const boxW = 156, boxH = 108, gap = 12;
      const bx0 = (w - (boxW * 3 + gap * 2)) / 2;
      const BOXES = [
        { label: 'x 項', pick: t => t.v === 'x', col: C_PAPER },
        { label: 'y 項', pick: t => t.v === 'y', col: C_SKY },
        { label: '常數項', pick: t => !t.v, col: C_MAGENTA }
      ];
      BOXES.forEach((bx, i) => {
        const x0 = bx0 + i * (boxW + gap);
        drawPanel(ctx, x0, 190, boxW, boxH, bx.col, 0.09);
        ctx.fillStyle = bx.col;
        ctx.font = f(800, 14);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bx.label, x0 + boxW / 2, 208);
        const inside = terms.filter(bx.pick);
        ctx.font = f(700, 15);
        if (!inside.length) {
          ctx.fillStyle = DIM;
          ctx.fillText('（沒有）', x0 + boxW / 2, 238);
        } else {
          inside.forEach((t, j) => {
            const a = Math.abs(t.c);
            const body = !t.v ? String(a) : (a === 1 ? t.v : a + t.v);
            ctx.fillStyle = bx.col;
            ctx.fillText((t.c < 0 ? '-' : '+') + body, x0 + boxW / 2, 234 + j * 22);
          });
        }
        ctx.textAlign = 'left';
      });
      drawNote(ctx, '文字符號相同的才進同一箱——這一箱裡的才是同類項', 314, MUTED, 13);
    }

    if (step >= 3) {
      const res = merged(terms);
      drawEqPanel(ctx, [T('=', C_SLATE)].concat(termItems(res, colOf)), 376, C_INK, { h: 30, size: 25 });
    } else {
      drawNote(ctx, ['按「下一步」開始分類', '再按一次，票根就會分箱', '再按一次就合併完成'][step], 376, DIM, 14);
    }

    const res = merged(terms);
    if (out) {
      out.innerHTML = wbrEq(`${termTex(terms)} = ${termTex(res)}`);
      typeset([out]);
    }
    if (fb) {
      let html;
      if (step === 0) {
        html = `這是<strong>${c.name}</strong>。滑桿可以改其中一項的係數 \\(k\\)，先按<strong>下一步</strong>把每一項拆出來。`;
      } else if (step === 1) {
        html = `一共 <strong>${terms.length} 項</strong>。項是<strong>加號隔開的每一部分</strong>，前面的正負號要跟著那一項一起走。`;
      } else if (step === 2) {
        html = `票根依<strong>文字符號</strong>分箱：\\(x\\) 進第一箱、\\(y\\) 進第二箱、純數字進第三箱。<strong>不同箱之間不能合併</strong>。`;
      } else {
        html = `各箱各自相加，得到 \\(${termTex(res)}\\)。拉滑桿改 \\(k\\)，你會發現<strong>它只動得了自己那一箱</strong>——這就是同類項的意思。`;
      }
      fb.innerHTML = wrapFeedback(html);
      typeset([fb]);
    }
  }

  bindPickGroup(group, 'data-eq', v => { idx = parseInt(v, 10); step = 0; draw(); });
  if (sK) sK.addEventListener('input', () => { k = parseInt(sK.value, 10); if (vK) vK.textContent = k; draw(); });
  if (sK) { k = parseInt(sK.value, 10); if (vK) vK.textContent = k; }
  if (btnNext) btnNext.addEventListener('click', () => { if (step < STEP_MAX) { step++; draw(); } });
  if (btnPrev) btnPrev.addEventListener('click', () => { if (step > 0) { step--; draw(); } });
  if (btnReset) btnReset.addEventListener('click', () => { step = 0; draw(); });
  draw();
}

/* ==========================================================================
   重點 4：括號拆解器
   括號前是加號就照抄，是減號就整組翻面；直式則要先把同類項對齊。
   ========================================================================== */
function initBracketCanvas() {
  const canvas = document.getElementById('canvas-bracket');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('bk-feedback');
  const out = document.getElementById('bk-formula');
  const gSign = document.getElementById('bk-sign-group');
  const gView = document.getElementById('bk-view-group');
  const sA = document.getElementById('bk-a-slider');
  const sB = document.getElementById('bk-b-slider');
  const vA = document.getElementById('bk-a-val');
  const vB = document.getElementById('bk-b-val');

  // 前式固定，後式的 x、y 係數由滑桿控制
  const FIRST = [{ c: 3, v: 'x' }, { c: -2, v: 'y' }, { c: 4, v: null }];
  let sign = 1, view = 'row', a = 4, b = -6;

  function second() {
    return [{ c: a, v: 'x' }, { c: b, v: 'y' }, { c: -1, v: null }];
  }

  function applied() {
    return second().map(t => ({ c: t.c * sign, v: t.v }));
  }

  function result() {
    const s = applied();
    return [
      { c: FIRST[0].c + s[0].c, v: 'x' },
      { c: FIRST[1].c + s[1].c, v: 'y' },
      { c: FIRST[2].c + s[2].c, v: null }
    ];
  }

  function colOf(t) {
    return t.v === 'x' ? C_PAPER : (t.v === 'y' ? C_SKY : C_MAGENTA);
  }

  function drawRowView() {
    const w = canvas.width;
    const s2 = second();
    const ap = applied();

    drawNote(ctx, '原式', 56, MUTED, 13);
    const orig = [
      GRP(termItems(FIRST, colOf), '()', C_SLATE),
      T(sign > 0 ? '+' : '-', C_EMBER),
      GRP(termItems(s2, colOf), '()', C_SLATE)
    ];
    drawExpr(ctx, orig, w / 2, 86, 23, C_SLATE, { maxW: w - 40 });

    drawNote(ctx, sign > 0 ? '括號前是加號 → 每一項都不變號' : '括號前是減號 → 每一項都變號', 130,
      sign > 0 ? OK_COLOR : C_EMBER, 14);

    // 三張票根：括號裡的每一項各畫一張，變號的翻成橘色
    const tw = 122, th = 44, gap = 14;
    const totalW = 3 * tw + 2 * gap;
    let tx = (w - totalW) / 2;
    s2.forEach((t, i) => {
      const after = ap[i];
      const col = sign > 0 ? colOf(t) : C_EMBER;
      drawTicket(ctx, tx, 152, tw, th, col);
      ctx.fillStyle = MUTED;
      ctx.font = f(650, 13);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const bodyOf = tt => {
        const aa = Math.abs(tt.c);
        const bd = !tt.v ? String(aa) : (aa === 1 ? tt.v : aa + tt.v);
        return (tt.c < 0 ? '-' : '+') + bd;
      };
      ctx.fillText(bodyOf(t), tx + tw * 0.37, 152 + 14);
      ctx.fillStyle = col;
      ctx.font = f(800, 17);
      ctx.fillText(bodyOf(after), tx + tw * 0.37, 152 + 32);
      ctx.textAlign = 'left';
      tx += tw + gap;
    });

    drawNote(ctx, '去括號後', 222, MUTED, 13);
    drawExpr(ctx, termItems(FIRST.concat(ap), t => (t.v === 'x' ? C_PAPER : (t.v === 'y' ? C_SKY : C_MAGENTA))),
      w / 2, 252, 22, C_SLATE, { maxW: w - 40 });

    drawNote(ctx, '合併同類項', 300, MUTED, 13);
    drawEqPanel(ctx, [T('=', C_SLATE)].concat(termItems(result(), colOf)), 344, C_INK, { h: 30, size: 25 });
  }

  function drawColView() {
    const w = canvas.width;
    const ap = applied();
    const res = result();
    // 三欄：x 項、y 項、常數項
    const colX = [200, 300, 400];
    const head = ['x 項', 'y 項', '常數項'];
    const cols = [C_PAPER, C_SKY, C_MAGENTA];

    ctx.textBaseline = 'middle';
    ctx.font = f(700, 13);
    head.forEach((h, i) => {
      ctx.fillStyle = cols[i];
      ctx.textAlign = 'center';
      ctx.fillText(h, colX[i], 62);
    });

    const rows = [
      { tag: '', vals: FIRST.map(t => t.c), y: 108 },
      { tag: sign > 0 ? '+）' : '－）', vals: second().map(t => t.c), y: 152 }
    ];
    rows.forEach(r => {
      ctx.fillStyle = MUTED;
      ctx.font = f(750, 17);
      ctx.textAlign = 'right';
      ctx.fillText(r.tag, 148, r.y);
      r.vals.forEach((v, i) => {
        ctx.fillStyle = cols[i];
        ctx.font = f(750, 19);
        ctx.textAlign = 'center';
        const unit = i === 2 ? '' : (i === 0 ? 'x' : 'y');
        ctx.fillText((v < 0 ? '-' : '+') + (Math.abs(v) === 1 && unit ? '' : Math.abs(v)) + unit, colX[i], r.y);
      });
    });

    // 橫線
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(140, 178);
    ctx.lineTo(w - 40, 178);
    ctx.stroke();

    // 減法時把「整列變號」畫出來
    if (sign < 0) {
      ctx.fillStyle = C_EMBER;
      ctx.font = f(650, 12);
      ctx.textAlign = 'center';
      ap.forEach((t, i) => {
        const unit = i === 2 ? '' : (i === 0 ? 'x' : 'y');
        ctx.fillText('變號成 ' + (t.c < 0 ? '-' : '+') + (Math.abs(t.c) === 1 && unit ? '' : Math.abs(t.c)) + unit,
          colX[i], 202);
      });
    }

    const ry = sign < 0 ? 236 : 212;
    res.forEach((t, i) => {
      ctx.fillStyle = cols[i];
      ctx.font = f(800, 21);
      ctx.textAlign = 'center';
      const unit = i === 2 ? '' : (i === 0 ? 'x' : 'y');
      ctx.fillText((t.c < 0 ? '-' : '+') + (Math.abs(t.c) === 1 && unit ? '' : Math.abs(t.c)) + unit, colX[i], ry);
    });
    ctx.textAlign = 'left';

    drawNote(ctx, '直式計算時，同類項要先對齊再算', ry + 40, MUTED, 14);
    drawEqPanel(ctx, [T('=', C_SLATE)].concat(termItems(result(), colOf)), ry + 92, C_INK, { h: 28, size: 24 });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTitle(ctx, view === 'row' ? '括號拆解器（橫式）' : '括號拆解器（直式）', C_INK);
    if (view === 'row') drawRowView(); else drawColView();

    const s2tex = termTex(second());
    const aptex = termTex(applied());
    const restex = termTex(result());
    if (out) {
      out.innerHTML = wbrEq(`(${termTex(FIRST)}) ${sign > 0 ? '+' : '-'} (${s2tex}) = ${restex}`);
      typeset([out]);
    }
    if (fb) {
      const html = sign > 0
        ? `括號前面是<strong>加號</strong>，去括號時裡面 <strong>三項都照抄</strong>：\\(${s2tex}\\) 原封不動。合併後得 \\(${restex}\\)。`
        : `括號前面是<strong>減號</strong>，去括號時裡面 <strong>三項全部變號</strong>：\\(${s2tex}\\) 變成 \\(${aptex}\\)。<strong>常數項那一項也要變</strong>，漏掉它是最常見的錯。合併後得 \\(${restex}\\)。`;
      fb.innerHTML = wrapFeedback(html);
      typeset([fb]);
    }
  }

  bindPickGroup(gSign, 'data-sign', v => { sign = parseInt(v, 10); draw(); });
  bindPickGroup(gView, 'data-view', v => { view = v; draw(); });
  if (sA) sA.addEventListener('input', () => { a = parseInt(sA.value, 10); if (vA) vA.textContent = a; draw(); });
  if (sB) sB.addEventListener('input', () => { b = parseInt(sB.value, 10); if (vB) vB.textContent = b; draw(); });
  if (sA) { a = parseInt(sA.value, 10); if (vA) vA.textContent = a; }
  if (sB) { b = parseInt(sB.value, 10); if (vB) vB.textContent = b; }
  draw();
}

/* ==========================================================================
   重點 5：化簡工作台
   分配律、多層括號、分數通分三種類型，各自一行一行推導。
   ========================================================================== */
function initSimplifyCanvas() {
  const canvas = document.getElementById('canvas-simplify');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('sp-feedback');
  const out = document.getElementById('sp-formula');
  const group = document.getElementById('sp-mode-group');
  const sK = document.getElementById('sp-k-slider');
  const vK = document.getElementById('sp-k-val');
  const kRow = document.getElementById('sp-k-row');
  const btnNext = document.getElementById('sp-next');
  const btnPrev = document.getElementById('sp-prev');
  const btnReset = document.getElementById('sp-reset');

  let mode = 'dist', k = 3, step = 0;

  // 每一種模式回傳「一行一行的推導」：tex 給數值列、items 給 canvas
  function lines() {
    if (mode === 'dist') {
      const kk = k;
      const kh = (kk === 1 ? '' : (kk === -1 ? '-' : String(kk)));
      const t1 = 2 * kk, t2 = -3 * kk, t3 = kk;
      const res = [{ c: t1, v: 'x' }, { c: t2, v: 'y' }, { c: t3, v: null }];
      return {
        rows: [
          `${kh}(2x - 3y + 1)`,
          `${sub(kk)} \\times 2x + ${sub(kk)} \\times (-3y) + ${sub(kk)} \\times 1`,
          termTex(res)
        ],
        items: [
          [T(kh, C_EMBER), GRP(inkItems('2x - 3y + 1', C_SLATE).items, '()', C_SLATE)],
          [inkItems(`${sub(kk)}×2x + ${sub(kk)}×(-3y) + ${sub(kk)}×1`, C_SLATE)],
          termItems(res, t => (t.v === 'x' ? C_PAPER : (t.v === 'y' ? C_SKY : C_MAGENTA)))
        ],
        notes: [
          '括號外的數要乘進括號裡的每一項',
          '三項都要乘到，常數項也不例外',
          kk < 0 ? '括號外是負數，每一項都跟著變號' : '這就是分配律'
        ],
        final: termTex(res)
      };
    }
    if (mode === 'nest') {
      const rows = [
        '5 - y + 2[4x - (6x + y)]',
        '5 - y + 2[4x - 6x - y]',
        '5 - y + 2[-2x - y]',
        '5 - y - 4x - 2y',
        '-4x - 3y + 5'
      ];
      return {
        rows,
        items: rows.map(s => [inkItems(s, C_SLATE)]),
        notes: [
          '有兩層括號時，先拆最裡面的小括號',
          '小括號前是減號，裡面兩項都變號',
          '中括號裡先合併同類項',
          '再用分配律把 2 乘進中括號',
          '最後把同類項合併起來'
        ],
        final: '-4x - 3y + 5'
      };
    }
    const FR2 = (n, d, col) => VF(inkItems(n, col), T(d, col), col);
    return {
      rows: [
        '\\frac{2x - y + 4}{3} - \\frac{x + y - 1}{2}',
        '\\frac{2(2x - y + 4)}{6} - \\frac{3(x + y - 1)}{6}',
        '\\frac{2(2x - y + 4) - 3(x + y - 1)}{6}',
        '\\frac{4x - 2y + 8 - 3x - 3y + 3}{6}',
        '\\frac{x - 5y + 11}{6}'
      ],
      items: [
        [FR2('2x - y + 4', '3', C_SLATE), T('-', C_SLATE), FR2('x + y - 1', '2', C_SLATE)],
        [FR2('2(2x - y + 4)', '6', C_SLATE), T('-', C_SLATE), FR2('3(x + y - 1)', '6', C_SLATE)],
        [FR2('2(2x - y + 4) - 3(x + y - 1)', '6', C_SLATE)],
        [FR2('4x - 2y + 8 - 3x - 3y + 3', '6', C_SLATE)],
        [FR2('x - 5y + 11', '6', C_INK)]
      ],
      notes: [
        '兩個分母 3 與 2 的最小公倍數是 6',
        '各自通分成分母 6，分子整組加括號',
        '合成一個分數；減號在前的括號不能拆掉',
        '用分配律拆開，−3 要發給括號裡三項',
        '分子合併同類項就完成了'
      ],
      final: '\\frac{x - 5y + 11}{6}'
    };
  }

  function draw() {
    const L = lines();
    const maxStep = L.rows.length - 1;
    if (step > maxStep) step = maxStep;
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, mode === 'dist' ? '化簡工作台：分配律'
      : (mode === 'nest' ? '化簡工作台：多層括號' : '化簡工作台：分數通分'), C_INK);

    // 已推導的每一行都留在畫面上，而且算式就畫在 canvas 上——
    // 課堂投影時學生看的是這張圖，不是下方的數值列（開發約束 22）
    const top = 48;
    const bottom = canvas.height - 46;
    const rowH = Math.floor((bottom - top) / L.rows.length);
    for (let i = 0; i <= step; i++) {
      const y0 = top + i * rowH;
      const cy = y0 + rowH / 2;
      const active = (i === step);
      drawPanel(ctx, 16, y0 + 3, w - 32, rowH - 6, active ? C_INK : C_SLATE, active ? 0.10 : 0.035);
      // 左欄固定寬度：步驟名稱 + 這一步在做什麼（算式再寬也不會壓到它）
      const LCOL = 158;
      ctx.fillStyle = active ? C_INK : DIM;
      ctx.font = f(750, 12);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(i === 0 ? '原式' : '第 ' + i + ' 步', 28, y0 + 9);
      ctx.textBaseline = 'middle';
      wrapText(ctx, L.notes[i] || '', 28 + (LCOL - 40) / 2, y0 + rowH * 0.62, LCOL - 46, 14,
        active ? MUTED : DIM, 11);
      // 右側：真正的算式
      const eq = (i === 0) ? L.items[i] : [T('=', MUTED)].concat(L.items[i]);
      drawExpr(ctx, eq, (16 + LCOL + w - 22) / 2, cy, Math.min(21, rowH - 18), C_SLATE,
        { maxW: w - LCOL - 44, gap: 6 });
    }

    if (step >= maxStep) {
      drawChip(ctx, w / 2 - 120, canvas.height - 38, 240, 30, '化簡完成', OK_COLOR, 'rgba(52, 211, 153, 0.12)');
    } else {
      drawNote(ctx, '按「下一步」繼續推導', canvas.height - 23, DIM, 14);
    }

    if (out) {
      // 每一行都要自己斷得開：分數在窄螢幕下比數值列還寬（開發約束 24）
      const parts = [];
      for (let i = 0; i <= step; i++) {
        parts.push(`<span style="display:block; padding: 1px 0;">${wbrEq((i === 0 ? '' : '= ') + L.rows[i])}</span>`);
      }
      out.innerHTML = parts.join('');
      typeset([out]);
    }
    if (fb) {
      fb.innerHTML = wrapFeedback(
        `<strong>${step === 0 ? '原式' : '第 ' + step + ' 步'}</strong>：${L.notes[step]}。` +
        (step >= maxStep ? `　化簡結果是 \\(${L.final}\\)。` : '')
      );
      typeset([fb]);
    }
  }

  function syncRows() {
    // 只有分配律用得到 k；其餘兩種模式不留一條停用的死滑桿
    if (kRow) kRow.style.display = (mode === 'dist') ? '' : 'none';
  }

  bindPickGroup(group, 'data-mode', v => { mode = v; step = 0; syncRows(); draw(); });
  if (sK) sK.addEventListener('input', () => { k = parseInt(sK.value, 10); if (vK) vK.textContent = k; draw(); });
  if (sK) { k = parseInt(sK.value, 10); if (vK) vK.textContent = k; }
  if (btnNext) btnNext.addEventListener('click', () => { const m = lines().rows.length - 1; if (step < m) { step++; draw(); } });
  if (btnPrev) btnPrev.addEventListener('click', () => { if (step > 0) { step--; draw(); } });
  if (btnReset) btnReset.addEventListener('click', () => { step = 0; draw(); });
  syncRows();
  draw();
}

/* ==========================================================================
   重點 6：三道關卡驗票機
   ① 有等號嗎 ② 化簡後還剩兩種未知數嗎 ③ 次數都是 1 嗎
   ========================================================================== */
function initEqCheckCanvas() {
  const canvas = document.getElementById('canvas-eqcheck');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('ec-feedback');
  const out = document.getElementById('ec-formula');
  const group = document.getElementById('ec-eq-group');
  const btnNext = document.getElementById('ec-next');
  const btnPrev = document.getElementById('ec-prev');
  const btnReset = document.getElementById('ec-reset');

  // pass: null 表示前一關就沒過、這一關不必檢查
  const CASES = [
    {
      tex: '4x - y = 8', simp: '4x - y = 8',
      items: [inkItems('4x - y = 8', C_PAPER)],
      pass: [true, true, true],
      why: ['有等號，是等式', '化簡後仍有 x、y 兩種未知數', 'x、y 的次數都是 1'],
      verdict: true, note: '三關全過，是二元一次方程式。'
    },
    {
      tex: '2(x + 1) = 8 - 3y', simp: '2x + 3y = 6',
      items: [inkItems('2(x + 1) = 8 - 3y', C_PAPER)],
      pass: [true, true, true],
      why: ['有等號，是等式', '化簡成 2x+3y=6，仍有兩種未知數', 'x、y 的次數都是 1'],
      verdict: true, note: '長相有括號，化簡後才看得出來——「經化簡後」四個字就是在說這件事。'
    },
    {
      tex: '6x + 5y', simp: '6x + 5y',
      items: [inkItems('6x + 5y', C_PAPER)],
      pass: [false, null, null],
      why: ['沒有等號，它只是一個「式」', '', ''],
      verdict: false, note: '第一關就沒過。它是二元一次「式」，不是方程式。'
    },
    {
      tex: '3x + 2 = 3x + y', simp: 'y = 2',
      items: [inkItems('3x + 2 = 3x + y', C_PAPER)],
      pass: [true, false, null],
      why: ['有等號，是等式', '化簡後 x 項互相抵消，只剩 y = 2', ''],
      verdict: false, note: '化簡後只剩一種未知數，是一元一次方程式。'
    },
    {
      tex: 'x + y^2 = 5', simp: 'x + y^2 = 5',
      items: [inkItems('x + ', C_PAPER), PW(IT('y', C_PAPER), '2', false, C_PAPER), inkItems(' = 5', C_PAPER)],
      pass: [true, true, false],
      why: ['有等號，是等式', '有 x、y 兩種未知數', 'y 的次數是 2，不是一次'],
      verdict: false, note: '次數這一關沒過。'
    },
    {
      tex: '7x - 4 = 10', simp: '7x = 14',
      items: [inkItems('7x - 4 = 10', C_PAPER)],
      pass: [true, false, null],
      why: ['有等號，是等式', '從頭到尾只有 x 一種未知數', ''],
      verdict: false, note: '只有一種未知數，是一元一次方程式。'
    }
  ];

  const STEP_MAX = 3;
  let idx = 0, step = 0;

  function draw() {
    const c = CASES[idx];
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, '三道關卡驗票機', C_INK);

    // 待檢查的式子（畫成一張票根，算式直接畫在上面）
    drawTicket(ctx, w / 2 - 170, 46, 340, 48, C_PAPER, { perf: false });
    drawExpr(ctx, c.items, w / 2, 70, 23, C_PAPER, { maxW: 316, gap: 5 });
    if (step >= 2 && c.simp !== c.tex) {
      drawNote(ctx, '化簡後：' + c.simp.replace(/\s+/g, ' '), 106, C_EMBER, 13);
    }

    const GATES = ['① 有等號嗎', '② 化簡後有兩種未知數嗎', '③ 次數都是 1 嗎'];
    for (let i = 0; i < 3; i++) {
      const y = 118 + i * 78;
      const checked = step >= i + 1;
      const p = c.pass[i];
      const col = !checked ? DIM : (p === true ? OK_COLOR : (p === false ? NO_COLOR : DIM));
      drawPanel(ctx, 30, y, w - 60, 64, col, checked ? 0.10 : 0.04);
      ctx.fillStyle = checked ? col : DIM;
      ctx.font = f(800, 15);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(GATES[i], 50, y + 22);
      if (checked) {
        ctx.font = f(650, 13);
        ctx.fillStyle = p === null ? DIM : MUTED;
        ctx.fillText(p === null ? '前一關就沒過，不必再檢查' : c.why[i], 50, y + 46);
        ctx.font = f(850, 24);
        ctx.fillStyle = col;
        ctx.textAlign = 'right';
        ctx.fillText(p === true ? '✓' : (p === false ? '✗' : '—'), w - 52, y + 32);
        ctx.textAlign = 'left';
      }
    }

    if (step >= STEP_MAX) {
      const chipW = 300;
      drawChip(ctx, w / 2 - chipW / 2, 362, chipW, 38,
        c.verdict ? '是二元一次方程式' : '不是二元一次方程式',
        c.verdict ? OK_COLOR : NO_COLOR,
        c.verdict ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.10)');
    } else {
      drawNote(ctx, '按「下一步」通過下一道關卡', 380, DIM, 14);
    }

    if (out) {
      const showSimp = (step >= 2 && c.simp !== c.tex);
      out.innerHTML = showSimp
        ? `${wbrEq(c.tex)}　化簡後　${wbrEq(c.simp)}`
        : wbrEq(c.tex);
      typeset([out]);
    }
    if (fb) {
      let html;
      if (step === 0) {
        html = `要檢查的是 \\(${c.tex}\\)。按<strong>下一步</strong>讓它一關一關過。`;
      } else if (step <= 3 && c.pass[step - 1] === null) {
        html = `第 ${step} 關<strong>不必檢查</strong>——前面已經淘汰了。${step >= STEP_MAX ? c.note : ''}`;
      } else {
        html = `第 ${step} 關：${c.why[step - 1]}。` + (step >= STEP_MAX ? `<br><strong>結論</strong>：${c.note}` : '');
      }
      fb.innerHTML = wrapFeedback(html);
      typeset([fb]);
    }
  }

  bindPickGroup(group, 'data-eq', v => { idx = parseInt(v, 10); step = 0; draw(); });
  if (btnNext) btnNext.addEventListener('click', () => { if (step < STEP_MAX) { step++; draw(); } });
  if (btnPrev) btnPrev.addEventListener('click', () => { if (step > 0) { step--; draw(); } });
  if (btnReset) btnReset.addEventListener('click', () => { step = 0; draw(); });
  draw();
}

/* ==========================================================================
   重點 7：驗票閘門
   x 與 y 兩個數字一起送進去，等號真的成立，橫桿才會抬起來。
   ========================================================================== */
function initSolutionCanvas() {
  const canvas = document.getElementById('canvas-solution');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('sl-feedback');
  const out = document.getElementById('sl-formula');
  const group = document.getElementById('sl-eq-group');
  const sX = document.getElementById('sl-x-slider');
  const sY = document.getElementById('sl-y-slider');
  const vX = document.getElementById('sl-x-val');
  const vY = document.getElementById('sl-y-val');

  const CASES = [
    { a: 2, b: 3, r: 12, tex: '2x + 3y = 12' },
    { a: 5, b: -2, r: 4, tex: '5x - 2y = 4' },
    { a: 1, b: 4, r: -3, tex: 'x + 4y = -3' }
  ];

  let idx = 0, xv = 0, yv = 2;

  function draw() {
    const c = CASES[idx];
    const w = canvas.width;
    const lv = c.a * xv + c.b * yv;
    const ok = (lv === c.r);
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, '驗票閘門', C_INK);

    // 正在檢驗哪一條方程式，要畫在畫面上（開發約束 22）
    drawExpr(ctx, [inkItems(c.tex, C_INK)], w / 2, 50, 21, C_INK, { maxW: w - 60 });

    // 送進去的那張票根：上面同時印著 x 與 y
    drawTicket(ctx, w / 2 - 118, 72, 236, 48, ok ? OK_COLOR : C_PAPER);
    ctx.font = f(750, 16);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ok ? OK_COLOR : C_PAPER;
    ctx.fillText(`x = ${xv}`, w / 2 - 52, 96);
    ctx.fillText(`y = ${yv}`, w / 2 + 22, 96);
    ctx.textAlign = 'left';

    // 代入後的計算
    const calc = `${sub(c.a)} × ${sub(xv)} ${c.b < 0 ? '-' : '+'} ${Math.abs(c.b)} × ${sub(yv)} = ${lv}`;
    drawPanel(ctx, 34, 132, w - 68, 42, ok ? OK_COLOR : C_SLATE, 0.08);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = f(700, 16);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(calc, w / 2, 153);
    ctx.textAlign = 'left';

    // 左邊 vs 右邊
    ctx.font = f(800, 18);
    ctx.textAlign = 'center';
    ctx.fillStyle = ok ? OK_COLOR : NO_COLOR;
    ctx.fillText(`左邊 ${lv}`, w / 2 - 96, 186);
    ctx.fillStyle = MUTED;
    ctx.fillText(ok ? '=' : '≠', w / 2, 186);
    ctx.fillStyle = C_INK;
    ctx.fillText(`右邊 ${c.r}`, w / 2 + 96, 186);
    ctx.textAlign = 'left';

    // 閘門
    drawGate(ctx, w / 2, 288, ok, C_SLATE);

    const chipW = 300;
    drawChip(ctx, w / 2 - chipW / 2, 348, chipW, 38,
      ok ? `x = ${xv}、y = ${yv} 是一組解` : `x = ${xv}、y = ${yv} 不是解`,
      ok ? OK_COLOR : NO_COLOR,
      ok ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.10)');

    const calcTex = `${c.a === 1 ? '' : c.a} \\times ${sub(xv)} ${c.b < 0 ? '-' : '+'} ${Math.abs(c.b) === 1 ? '' : Math.abs(c.b)} \\times ${sub(yv)} = ${lv}`;
    if (out) {
      out.innerHTML = `${wbrEq(c.tex)}　${wbrEq(calcTex)}`;
      typeset([out]);
    }
    if (fb) {
      fb.innerHTML = wrapFeedback(ok
        ? `代入後左邊算出 \\(${lv}\\)，跟右邊的 \\(${c.r}\\) <strong>相等</strong>，所以 \\(x=${xv}\\)、\\(y=${yv}\\) 是 \\(${c.tex}\\) 的<strong>一組解</strong>，可記成 \\(\\begin{cases} x=${xv} \\\\ y=${yv} \\end{cases}\\)。再拉拉看，還找得到別組。`
        : `代入後左邊算出 \\(${lv}\\)，右邊是 \\(${c.r}\\)，<strong>不相等</strong>，所以這一組不是解。注意<strong>兩個值要一起看</strong>——只對一半不算數。`);
      typeset([fb]);
    }
  }

  bindPickGroup(group, 'data-eq', v => { idx = parseInt(v, 10); draw(); });
  if (sX) sX.addEventListener('input', () => { xv = parseInt(sX.value, 10); if (vX) vX.textContent = xv; draw(); });
  if (sY) sY.addEventListener('input', () => { yv = parseInt(sY.value, 10); if (vY) vY.textContent = yv; draw(); });
  if (sX) { xv = parseInt(sX.value, 10); if (vX) vX.textContent = xv; }
  if (sY) { yv = parseInt(sY.value, 10); if (vY) vY.textContent = yv; }
  draw();
}

/* ==========================================================================
   重點 8：解的清單機
   沒有限制時每個 x 都算得出 y，永遠列不完；一旦張數只能是整數且不為負，
   解就縮成有限的幾組。方程式 3x + 2y = 24 由 60x + 40y = 480 化簡而來。
   ========================================================================== */
function initInfiniteCanvas() {
  const canvas = document.getElementById('canvas-infinite');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('if-feedback');
  const out = document.getElementById('if-formula');
  const group = document.getElementById('if-mode-group');
  const sX = document.getElementById('if-x-slider');
  const vX = document.getElementById('if-x-val');
  const xRow = document.getElementById('if-x-row');
  const stepRow = document.getElementById('if-step-row');
  const btnNext = document.getElementById('if-next');
  const btnPrev = document.getElementById('if-prev');
  const btnReset = document.getElementById('if-reset');

  const A = 3, B = 2, R = 24;      // 3x + 2y = 24
  const X_MAX = 8;                 // 限制模式下 x 只可能到 8
  const yOf = x => (R - A * x) / B;
  const okAt = x => (x >= 0 && Number.isInteger(yOf(x)) && yOf(x) >= 0);

  let mode = 'free', xv = 2, step = 0;

  function drawFree() {
    const w = canvas.width;
    const y = yOf(xv);
    drawExpr(ctx, [inkItems('3x + 2y = 24', C_INK)], w / 2, 50, 20, C_INK, { maxW: w - 60 });

    // 一條沒有盡頭的票帶：越過右緣繼續延伸
    const tw = 58, th = 34, gap = 6;
    ctx.save();
    for (let i = 0; i < 9; i++) {
      const tx = 26 + i * (tw + gap);
      const fade = i >= 6 ? (1 - (i - 5) * 0.25) : 1;
      ctx.globalAlpha = Math.max(0.15, fade);
      drawTicket(ctx, tx, 74, tw, th, C_PAPER);
      ctx.fillStyle = C_PAPER;
      ctx.font = f(700, 12);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const xi = i - 1;
      ctx.fillText(i === 8 ? '…' : `${xi}, ${numStr(yOf(xi))}`, tx + tw * 0.37, 91);
      ctx.textAlign = 'left';
    }
    ctx.restore();
    drawNote(ctx, '票帶越過畫面右緣還在繼續印——列不完', 128, MUTED, 13);

    // 目前這一組
    drawPanel(ctx, 40, 146, w - 80, 116, C_INK, 0.08);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = f(700, 16);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`設 x = ${xv}`, w / 2, 174);
    ctx.fillText(`${A} × ${sub(xv)} + ${B}y = ${R}`, w / 2, 204);
    ctx.fillText(`${B}y = ${R - A * xv}`, w / 2, 230);
    ctx.fillStyle = C_INK;
    ctx.font = f(800, 19);
    ctx.fillText(`y = ${numStr(y)}`, w / 2, 254);
    ctx.textAlign = 'left';

    drawEqPanel(ctx, [T(`( x, y ) = ( ${xv}, ${numStr(y)} )`, C_INK)], 310, C_INK, { h: 30, size: 23 });
    drawNote(ctx, '任何一個 x 都配得出一個 y，所以有無限多組解', 366, OK_COLOR, 14);
    drawNote(ctx, 'y 算出小數也算一組解——沒有限制的時候', 392, MUTED, 13);
  }

  function drawLimit() {
    const w = canvas.width;
    // 正在解哪一條方程式，要畫在畫面上（開發約束 22）
    drawExpr(ctx, [inkItems('3x + 2y = 24', C_INK)], w / 2, 50, 20, C_INK, { maxW: w - 60 });
    const cols = X_MAX + 1;
    const cw = Math.floor((w - 76) / cols);
    const x0 = 46;
    const rows = [
      { label: 'x', get: i => String(i) },
      { label: 'y', get: i => numStr(yOf(i)) },
      { label: '可以嗎', get: i => (okAt(i) ? '✓' : '✗') }
    ];

    ctx.textBaseline = 'middle';
    rows.forEach((r, ri) => {
      const y = 90 + ri * 46;
      ctx.fillStyle = MUTED;
      ctx.font = f(700, 13);
      ctx.textAlign = 'left';
      ctx.fillText(r.label, 4, y);
      for (let i = 0; i <= X_MAX; i++) {
        const shown = (i <= step - 1);
        const cx = x0 + i * cw + cw / 2;
        if (ri === 0) {
          drawPanel(ctx, x0 + i * cw + 2, 72, cw - 4, 140, shown ? (okAt(i) ? OK_COLOR : NO_COLOR) : C_SLATE, shown ? 0.09 : 0.03);
        }
        ctx.textAlign = 'center';
        if (!shown) {
          ctx.fillStyle = DIM;
          ctx.font = f(700, 14);
          ctx.fillText(ri === 0 ? String(i) : '?', cx, y);
        } else {
          ctx.fillStyle = ri === 2 ? (okAt(i) ? OK_COLOR : NO_COLOR) : (okAt(i) ? '#e2e8f0' : MUTED);
          ctx.font = ri === 2 ? f(850, 18) : f(750, 15);
          ctx.fillText(r.get(i), cx, y);
        }
      }
      ctx.textAlign = 'left';
    });

    drawNote(ctx, '張數必須是整數，而且不能是負的', 228, MUTED, 13);

    const found = [];
    for (let i = 0; i <= Math.min(step - 1, X_MAX); i++) if (okAt(i)) found.push(i);

    drawPanel(ctx, 36, 248, w - 72, 86, C_INK, 0.08);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = f(700, 15);
    ctx.textAlign = 'center';
    ctx.fillText('目前找到的買法', w / 2, 268);
    ctx.font = f(700, 14);
    ctx.fillStyle = found.length ? OK_COLOR : DIM;
    const txt = found.length
      ? found.map(i => `(${i}, ${numStr(yOf(i))})`).join('　')
      : '還沒開始檢查';
    ctx.fillText(txt, w / 2, 294);
    ctx.font = f(800, 17);
    ctx.fillStyle = C_INK;
    ctx.fillText(`共 ${found.length} 組`, w / 2, 320);
    ctx.textAlign = 'left';

    if (step > X_MAX) {
      drawChip(ctx, w / 2 - 150, 350, 300, 36, '一共 5 種買法', OK_COLOR, 'rgba(52, 211, 153, 0.12)');
      drawNote(ctx, '解從無限多組縮成 5 組——限制發揮了作用', 406, MUTED, 13);
    } else {
      drawNote(ctx, '按「下一步」檢查下一個 x', 362, DIM, 14);
      drawNote(ctx, `x 只可能從 0 到 ${X_MAX}：再大 y 就變成負數了`, 390, MUTED, 13);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTitle(ctx, mode === 'free' ? '解的清單機：沒有限制' : '解的清單機：張數有限制', C_INK);
    if (mode === 'free') drawFree(); else drawLimit();

    if (xRow) xRow.style.display = (mode === 'free') ? '' : 'none';
    if (stepRow) stepRow.style.display = (mode === 'free') ? 'none' : '';

    if (out) {
      if (mode === 'free') {
        out.innerHTML = wbrEq(`3x + 2y = 24`) + '　' + wbrEq(`(x, y) = (${xv}, ${numStr(yOf(xv))})`);
      } else {
        out.innerHTML = wbrEq(`60x + 40y = 480`) + '　化簡　' + wbrEq(`3x + 2y = 24`);
      }
      typeset([out]);
    }
    if (fb) {
      let html;
      if (mode === 'free') {
        const y = yOf(xv);
        html = `設 \\(x = ${xv}\\)，代入後解得 \\(y = ${numStr(y)}\\)，所以 \\((${xv},\\ ${numStr(y)})\\) 是一組解。` +
          (Number.isInteger(y) ? '' : '　\\(y\\) 是小數也沒關係——<strong>沒有限制的時候，小數一樣算解</strong>。') +
          `<br>換一個 \\(x\\) 就得到另一組，所以<strong>有無限多組解</strong>。`;
      } else if (step === 0) {
        html = `情境：全票每張 \\(60\\) 元、優待票每張 \\(40\\) 元，共付 \\(480\\) 元，可列 \\(60x + 40y = 480\\)，化簡得 \\(3x + 2y = 24\\)。<strong>張數只能是整數而且不能是負的</strong>。按下一步逐一檢查。`;
      } else if (step <= X_MAX) {
        const i = step - 1;
        const y = yOf(i);
        html = okAt(i)
          ? `\\(x = ${i}\\) 時 \\(y = ${numStr(y)}\\)，兩個都是整數，<strong>可以</strong>——買 \\(${i}\\) 張全票、\\(${numStr(y)}\\) 張優待票。`
          : `\\(x = ${i}\\) 時 \\(y = ${numStr(y)}\\)，<strong>不是整數</strong>，票不能買半張，這一組要刪掉。`;
      } else {
        html = `檢查完 \\(x = 0\\) 到 \\(x = ${X_MAX}\\)，符合的只有 <strong>5 組</strong>：\\((0,12)\\)、\\((2,9)\\)、\\((4,6)\\)、\\((6,3)\\)、\\((8,0)\\)。<br>同一條方程式，<strong>加上情境的限制之後，無限多組就縮成有限的幾組了</strong>。`;
      }
      fb.innerHTML = wrapFeedback(html);
      typeset([fb]);
    }
  }

  bindPickGroup(group, 'data-mode', v => { mode = v; step = 0; draw(); });
  if (sX) sX.addEventListener('input', () => { xv = parseInt(sX.value, 10); if (vX) vX.textContent = xv; draw(); });
  if (sX) { xv = parseInt(sX.value, 10); if (vX) vX.textContent = xv; }
  if (btnNext) btnNext.addEventListener('click', () => { if (step <= X_MAX) { step++; draw(); } });
  if (btnPrev) btnPrev.addEventListener('click', () => { if (step > 0) { step--; draw(); } });
  if (btnReset) btnReset.addEventListener('click', () => { step = 0; draw(); });
  draw();
}
