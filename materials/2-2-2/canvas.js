document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quiz System
  initQuizSystem();

  // Initialize Canvas Simulations
  initSolCanvas();
  initTraceCanvas();
  initTwoCanvas();
  initCeptCanvas();
  initGridCanvas();
  initChkCanvas();
  initOrgCanvas();
  initRecCanvas();
  initCrossCanvas();
  initAreaCanvas();
});

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // Correct answers mapping for Book 2 / 2-2 (20 Quizzes)
  // 正解字母分布：A 5 題、B 5 題、C 5 題、D 5 題（開發約束 36）
  const answers = {
    '2-2-2-1': 'C',   // (2,-1) 代入 4x-5y 得 13
    '2-2-2-2': 'B',   // (5,2) 在第一象限
    '2-2-2-3': 'D',   // 每組解描成點會排成一條直線
    '2-2-2-4': 'A',   // (-3,-3) 代入 x-3y 得 6
    '2-2-2-5': 'B',   // 兩組解描兩點再連線
    '2-2-2-6': 'C',   // (3,0) 與 (0,-4) 都是 4x-3y=12 的解
    '2-2-2-7': 'A',   // (10,0) 與 (0,4)
    '2-2-2-8': 'D',   // 4x-5y=20 不通過第二象限
    '2-2-2-9': 'C',   // 垂直 x 軸且過 (-8,5) ⇒ x=-8
    '2-2-2-10': 'A',  // y=-7/2 垂直 y 軸、交 y 軸於 (0,-7/2)
    '2-2-2-11': 'D',  // -10+3a=-7 ⇒ a=1
    '2-2-2-12': 'B',  // (6,3) 代入 3x-4y 得 6 ≠ 10
    '2-2-2-13': 'A',  // 7x=4y 整理成 7x-4y=0，c=0
    '2-2-2-14': 'C',  // k-8=0 ⇒ k=8
    '2-2-2-15': 'B',  // y = -2x + 5
    '2-2-2-16': 'D',  // 兩點 x 坐標同為 6 ⇒ x=6
    '2-2-2-17': 'C',  // 7x=14 ⇒ (2,5)
    '2-2-2-18': 'A',  // 解 x=3、y=1 ⇒ 交點 (3,1)
    '2-2-2-19': 'D',  // 底 6、高 2 ⇒ 面積 6
    '2-2-2-20': 'B'   // 兩股 8 與 6 ⇒ 面積 24
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
   2. 本節配色（沿用 2-1 直角坐標平面的復古航海製圖室調色盤）
   ========================================================================== */
const CH_BRASS = '#fcd34d';
const CH_TEAL = '#5eead4';
const CH_SKY = '#7dd3fc';
const CH_CORAL = '#fda4af';
const CH_MINT = '#6ee7b7';
const CH_VIOLET = '#d8b4fe';
const CH_AMBER = '#fdba74';
const CH_MAGENTA = '#f9a8d4';
const CH_MOSS = '#bef264';
const CH_CYAN = '#67e8f9';
const CH_SLATE = '#cbd5e1';

/* 版面常數：十張畫布共用同一組座標，投影時位置才一致 */
const PL_TOP = 44;      // 坐標平面上緣
const PL_UNIT = 28;     // 一格幾像素
const PL_MIN = -6;
const PL_MAX = 6;
// 十張畫布共用同一組坐標平面設定；刻度字級比共用檔的預設大，
// 因為本節格寬只有 28px，而畫布在兩欄版面下只顯示 0.66 倍
const PLANE = {
  top: PL_TOP, unit: PL_UNIT, min: PL_MIN, max: PL_MAX,
  labelEvery: 1, axisColor: CH_SLATE, tickFont: f(700, 13.5)
};
const R1 = 410;         // 推導第一列
const R2 = 444;         // 推導第二列
const R3 = 478;         // 推導第三列


// 把直線 ax + by = c 裁到坐標平面的方框內，回傳兩個端點的圖上坐標
function clipLine(g, a, b, c) {
  const eps = 1e-9;
  const lo = g.min, hi = g.max;
  const raw = [];
  if (Math.abs(b) > eps) {
    [lo, hi].forEach(u => {
      const v = (c - a * u) / b;
      if (v >= lo - eps && v <= hi + eps) raw.push([u, v]);
    });
  }
  if (Math.abs(a) > eps) {
    [lo, hi].forEach(v => {
      const u = (c - b * v) / a;
      if (u >= lo - eps && u <= hi + eps) raw.push([u, v]);
    });
  }
  if (raw.length < 2) return null;
  // 取相距最遠的兩點，穿過角落時才不會挑到重複的點
  let best = null, bd = -1;
  for (let i = 0; i < raw.length; i++) {
    for (let j = i + 1; j < raw.length; j++) {
      const d = Math.hypot(raw[i][0] - raw[j][0], raw[i][1] - raw[j][1]);
      if (d > bd) { bd = d; best = [raw[i], raw[j]]; }
    }
  }
  return (bd > 1e-6) ? best : null;
}

// 直接把 ax + by = c 畫在坐標平面上
function drawEqLine(ctx, g, a, b, c, color, opts) {
  const o = opts || {};
  const seg = clipLine(g, a, b, c);
  if (!seg) return null;
  ctx.save();
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.strokeStyle = color;
  ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
  ctx.lineWidth = o.width || 2.6;
  ctx.beginPath();
  ctx.moveTo(g.px(seg[0][0]), g.py(seg[0][1]));
  ctx.lineTo(g.px(seg[1][0]), g.py(seg[1][1]));
  ctx.stroke();
  ctx.restore();
  return seg;
}

// 在直線的某一端標上它的方程式
function labelLine(ctx, g, seg, text, color, which) {
  if (!seg) return;
  const p = seg[which ? 1 : 0];
  let x = g.px(p[0]), y = g.py(p[1]);
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = f(800, 13);
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width;
  let tx = x + 8;
  if (tx + w > ctx.canvas.width - 4) tx = x - 8 - w;
  if (tx < 4) tx = 4;
  let ty = y - 12;
  if (ty < g.top + 22) ty = y + 30;
  if (ty > g.bottom - 6) ty = y - 14;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  roundRect(ctx, tx - 5, ty - 10, w + 10, 20, 6);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText(text, tx, ty);
  ctx.restore();
}

// LaTeX 分數字串：共用檔的 texFrac() 不化簡，這裡先 reduce 再交給它，
// 數值列印出來的分數才會跟 canvas 上的 fracItem() 一致
function fTex(n, d) {
  const r = reduce(n, d);
  return texFrac(r[0], r[1]);
}

// 分數元件：分母化簡成 1 時直接印整數，負號放在分數前面
function fracItem(n, d, color) {
  const r = reduce(n, d);
  if (r[1] === 1) return T(numStr(r[0]), color);
  if (r[0] < 0) return SEQ([T('-', color), FR(-r[0], r[1], color)], color, 2);
  return FR(r[0], r[1], color);
}

// 一個點的名稱與坐標，坐標可以是分數
function ptItems(name, xi, yi, color) {
  return SEQ([
    T(name, color),
    GRP([SEQ([xi, T(',', color)], color, 1), yi], '()', color)
  ], color, 1);
}

// 在點旁邊放一張標籤（內容是算式元件，所以分數畫得出來）
function labelPt(ctx, x, y, items, color, opts) {
  const o = opts || {};
  const size = o.size || 14;
  const w = exprWidth(ctx, items, size, 4);
  const h = o.h || 32;
  let tx = x + 12;
  if (o.side === 'left' || tx + w + 8 > ctx.canvas.width - 4) tx = x - 12 - w;
  if (tx < 6) tx = 6;
  let ty = y + (o.dy == null ? 20 : o.dy);
  if (ty + h / 2 > (o.maxY || ctx.canvas.height - 4)) ty = y - 20;
  if (ty - h / 2 < (o.minY || 40)) ty = y + 20;
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  roundRect(ctx, tx - 6, ty - h / 2, w + 12, h, 8);
  ctx.fill();
  ctx.restore();
  drawExpr(ctx, items, 0, ty, size, color, { left: tx, maxW: w + 4, gap: 4 });
}

// 固定分欄的推導列：左欄中文標籤、右側算式（開發約束 22）
function drawLead(ctx, label, items, y, color, opts) {
  const o = opts || {};
  const labX = o.labX == null ? 18 : o.labX;
  const eqX = o.eqX == null ? 128 : o.eqX;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  if (label) {
    ctx.fillStyle = o.labColor || MUTED;
    ctx.font = f(700, 13);
    const lines = fitLines(ctx, label, eqX - labX - 10, f(700, 13)).slice(0, 2);
    if (lines.length === 1) ctx.fillText(lines[0], labX, y);
    else lines.forEach((ln, i) => ctx.fillText(ln, labX, y - 8 + i * 16));
  }
  ctx.restore();
  if (items && items.length) {
    drawExpr(ctx, items, 0, y, o.size || 18, color, {
      left: eqX, maxW: ctx.canvas.width - eqX - 14, gap: 6
    });
  }
}

// y = ax + b 裡 x 的係數：1 與 -1 不印數字
function slopeTex(n, d) {
  const r = reduce(n, d);
  if (r[1] === 1 && r[0] === 1) return '';
  if (r[1] === 1 && r[0] === -1) return '-';
  return fTex(r[0], r[1]);
}

// y = ax + b 裡的常數項：自己帶正負號，為 0 時整項不印
function constTex(n, d) {
  const r = reduce(n, d);
  if (r[0] === 0) return '';
  return (r[0] < 0 ? ' - ' : ' + ') + fTex(Math.abs(r[0]), r[1]);
}

// 代入相乘時的數字寫法：正負數都要加括號。
// 共用檔的 sub() 只替負數加括號，那適用於「= 3」這種位置；
// 這裡是 2×(3) 這種並置相乘，正數不加括號會被讀成「23」。
function mul(v) {
  return `(${v})`;
}

// 課本標準式的字串（把 0 係數收掉）
function stdTex(a, b, c) {
  return eqTex(a, b, c);
}

/* ==========================================================================
   重點 1：解 → 數對 → 點
   ========================================================================== */
const SOL_CASES = [
  { a: 1, b: 2, c: 6 },
  { a: 1, b: -3, c: 3 }
];

function initSolCanvas() {
  const cv = document.getElementById('canvas-sol');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const xS = document.getElementById('sl-x-slider');
  const xV = document.getElementById('sl-x-val');
  const out = document.getElementById('sl-formula');
  const fb = document.getElementById('sl-feedback');
  const caseGroup = document.getElementById('sl-case-group');
  let idx = 0;

  function draw() {
    const x = parseInt(xS.value, 10);
    xV.textContent = x;
    const eq = SOL_CASES[idx];
    const yn = eq.c - eq.a * x;      // y 的分子
    const yd = eq.b;                 // y 的分母
    const yr = reduce(yn, yd);
    const yVal = yn / yd;
    const isInt = (yr[1] === 1);
    const yTex = fTex(yn, yd);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `代入 x = ${x}，配套的 y 是多少？`, CH_BRASS);

    const g = drawPlane(ctx, PLANE);

    // 從兩軸拉虛線到這個點，示範「先左右、再上下」
    const pxv = g.px(x), pyv = g.py(yVal);
    dashLine(ctx, pxv, g.oy, pxv, pyv, 'rgba(252, 211, 77, 0.55)');
    dashLine(ctx, g.ox, pyv, pxv, pyv, 'rgba(94, 234, 212, 0.55)');
    drawFlag(ctx, pxv, pyv, CH_TEAL);
    labelPt(ctx, pxv, pyv, [ptItems('P', T(numStr(x), CH_TEAL), fracItem(yn, yd, CH_TEAL), CH_TEAL)],
      CH_TEAL, { dy: yVal >= 0 ? 22 : -22, maxY: g.bottom + 2 });

    // 推導三列
    const aPart = (eq.a === 1 ? '' : String(eq.a)) + `(${x})`;
    const bAbs = Math.abs(eq.b);
    const bPart = `${eq.b < 0 ? '-' : '+'} ${bAbs === 1 ? '' : bAbs}y`;
    drawLead(ctx, '① 代入', [inkItems(`${aPart} ${bPart} = ${eq.c}`, CH_SLATE)], R1, CH_SLATE);
    drawLead(ctx, '② 解出 y', [IT('y', CH_TEAL), T('=', CH_SLATE), fracItem(yn, yd, CH_TEAL)], R2, CH_TEAL);
    drawLead(ctx, '③ 寫成數對', [ptItems('', T(numStr(x), CH_BRASS), fracItem(yn, yd, CH_BRASS), CH_BRASS)], R3, CH_BRASS);

    out.innerHTML = `${wbrEq(`x = ${x}`)}、${wbrEq(`y = ${yTex}`)} <wbr>\\(\\;\\to\\;\\)<wbr> \\((${x},\\ ${yTex})\\)`;

    fb.innerHTML = wrapFeedback(
      `<b style="color:${CH_BRASS}">在 \\(${stdTex(eq.a, eq.b, eq.c)}\\) 裡代入 \\(x = ${x}\\)</b><br>` +
      `算出配套的 \\(y = ${yTex}\\)，把它寫成數對 \\((${x},\\ ${yTex})\\)，就是圖上那支旗子的位置。<br>` +
      (isInt
        ? `這一組解剛好落在<b style="color:${CH_TEAL}">格點上</b>。`
        : `\\(y\\) 不是整數，這一組解落在<b style="color:${CH_TEAL}">格線之間</b>——它一樣是解，一樣是平面上的一個點。`)
    );
    typeset([out, fb]);
  }

  bindPickGroup(caseGroup, 'data-case', v => { idx = parseInt(v, 10); draw(); });
  xS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 2：一支一支插旗
   ========================================================================== */
const TRACE_CASES = [
  { a: 2, b: -1, c: 3, xs: [0, 3, 1, 4, -1, 2, 4.5, -1.5, 0.5, 1.5, 2.5, 3.5, -0.5] },
  { a: 1, b: 1, c: 4, xs: [0, 4, 2, 6, -2, 1, 3, 5, -1, 0.5, 2.5, 4.5, 5.5] }
];

function initTraceCanvas() {
  const cv = document.getElementById('canvas-trace');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const nS = document.getElementById('tr-n-slider');
  const nV = document.getElementById('tr-n-val');
  const out = document.getElementById('tr-formula');
  const fb = document.getElementById('tr-feedback');
  const caseGroup = document.getElementById('tr-case-group');
  let idx = 0;

  function draw() {
    const n = parseInt(nS.value, 10);
    nV.textContent = n;
    const eq = TRACE_CASES[idx];
    const full = eq.xs.length;
    const pts = eq.xs.slice(0, n).map(x => [x, (eq.c - eq.a * x) / eq.b]);
    const last = pts[pts.length - 1];

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `描出 ${n} 組解之後，看得出形狀了嗎？`, CH_TEAL);

    const g = drawPlane(ctx, PLANE);

    // 兩點以上就先畫一條通過「前兩組解」的參考線，後面每一支旗都會落在上面
    if (n >= 2) {
      const solid = (n === full);
      drawEqLine(ctx, g, eq.a, eq.b, eq.c, CH_TEAL, {
        dash: solid ? null : [6, 5],
        alpha: solid ? 1 : 0.55,
        width: solid ? 3 : 2
      });
    }

    pts.forEach((p, i) => {
      const isLast = (i === pts.length - 1);
      drawDot(ctx, g.px(p[0]), g.py(p[1]), isLast ? CH_BRASS : CH_TEAL, isLast ? 6.5 : 5);
    });

    drawLead(ctx, '方程式', [inkItems(stdTex(eq.a, eq.b, eq.c), CH_SLATE)], R1, CH_SLATE);
    drawLead(ctx, `第 ${n} 組`,
      [ptItems('', T(numStr(last[0]), CH_BRASS), T(numStr(last[1]), CH_BRASS), CH_BRASS)], R2, CH_BRASS);

    if (n === 1) {
      drawNote(ctx, '只有一個點，還看不出圖形的形狀', R3, MUTED, 14);
    } else if (n < full) {
      drawNote(ctx, `這 ${n} 支旗都落在同一條線上，中間還有無限多組解沒描`, R3, CH_TEAL, 13.5);
    } else {
      drawNote(ctx, '把無限多組解全部描完，中間的空隙會被填滿，成為一條直線', R3, OK_COLOR, 13.5);
    }

    out.innerHTML = `${wbrEq(stdTex(eq.a, eq.b, eq.c))}<wbr>\\(\\;\\)<wbr>` +
      `\\(第 ${n} 組：({${numStr(last[0])}},\\ {${numStr(last[1])}})\\)`;

    fb.innerHTML = wrapFeedback(
      n === 1
        ? `<b style="color:${MUTED}">目前只有一個點</b><br>通過一個點的直線有無限多條，還不能斷定圖形長什麼樣子。把滑桿往右拉，多插幾支旗。`
        : (n < full
          ? `<b style="color:${CH_TEAL}">已經描出 ${n} 組解</b><br>它們全都落在同一條線上。但這條線上還有無限多個點沒描到——包括 \\(x\\) 是分數的那些解。`
          : `<b style="color:${OK_COLOR}">結論：二元一次方程式的圖形是一條直線</b><br>把所有的解都描上去，會形成一條<b>沒有缺口</b>的直線；反過來，這條線上任何一點的坐標，都是這個方程式的解。`)
    );
    typeset([out, fb]);
  }

  bindPickGroup(caseGroup, 'data-case', v => { idx = parseInt(v, 10); nS.value = '3'; draw(); });
  nS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 3：挑兩組解來畫線
   ========================================================================== */
function initTwoCanvas() {
  const cv = document.getElementById('canvas-two');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const aS = document.getElementById('tw-a-slider');
  const bS = document.getElementById('tw-b-slider');
  const aV = document.getElementById('tw-a-val');
  const bV = document.getElementById('tw-b-val');
  const out = document.getElementById('tw-formula');
  const fb = document.getElementById('tw-feedback');
  const EQ = { a: 3, b: 2, c: 6 };

  function draw() {
    const x1 = parseInt(aS.value, 10);
    const x2 = parseInt(bS.value, 10);
    aV.textContent = x1;
    bV.textContent = x2;
    const n1 = EQ.c - EQ.a * x1, n2 = EQ.c - EQ.a * x2;
    const y1 = n1 / EQ.b, y2 = n2 / EQ.b;
    const same = (x1 === x2);
    const int1 = (reduce(n1, EQ.b)[1] === 1);
    const int2 = (reduce(n2, EQ.b)[1] === 1);
    const near = (!same && Math.abs(x1 - x2) === 1);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, same ? '兩組解算出同一個點，畫不出唯一的直線'
      : `用 x = ${x1} 與 x = ${x2} 這兩組解畫線`, same ? NO_COLOR : CH_SKY);

    const g = drawPlane(ctx, PLANE);

    if (!same) drawEqLine(ctx, g, EQ.a, EQ.b, EQ.c, CH_SKY, { width: 3 });

    drawFlag(ctx, g.px(x1), g.py(y1), CH_CORAL);
    if (!same) drawFlag(ctx, g.px(x2), g.py(y2), CH_MINT);
    labelPt(ctx, g.px(x1), g.py(y1),
      [ptItems('', T(numStr(x1), CH_CORAL), fracItem(n1, EQ.b, CH_CORAL), CH_CORAL)],
      CH_CORAL, { dy: -22, side: 'left', minY: g.top + 18 });
    if (!same) {
      labelPt(ctx, g.px(x2), g.py(y2),
        [ptItems('', T(numStr(x2), CH_MINT), fracItem(n2, EQ.b, CH_MINT), CH_MINT)],
        CH_MINT, { dy: 24, maxY: g.bottom + 2 });
    }

    drawLead(ctx, '① 第一組',
      [SEQ([IT('x', CH_CORAL), T('=', CH_SLATE), T(numStr(x1), CH_CORAL)], CH_CORAL, 4),
       T('→', CH_SLATE),
       ptItems('', T(numStr(x1), CH_CORAL), fracItem(n1, EQ.b, CH_CORAL), CH_CORAL)], R1, CH_CORAL);
    drawLead(ctx, '② 第二組',
      [SEQ([IT('x', CH_MINT), T('=', CH_SLATE), T(numStr(x2), CH_MINT)], CH_MINT, 4),
       T('→', CH_SLATE),
       ptItems('', T(numStr(x2), CH_MINT), fracItem(n2, EQ.b, CH_MINT), CH_MINT)], R2, CH_MINT);

    if (same) {
      drawNote(ctx, '把兩支滑桿調成不同的 x，才會得到相異的兩個點', R3, NO_COLOR, 13.5);
    } else if (!int1 || !int2) {
      drawNote(ctx, '有一組解落在格線之間，描點時比較容易畫歪', R3, CH_AMBER, 13.5);
    } else if (near) {
      drawNote(ctx, '兩點靠得很近，畫線的角度誤差會被延伸放大', R3, CH_AMBER, 13.5);
    } else {
      drawNote(ctx, '兩點都在格點上又離得夠遠，這一組最好描', R3, OK_COLOR, 13.5);
    }

    out.innerHTML = same
      ? `${wbrEq(`x = ${x1}`)} 時兩組解相同<wbr>\\(\\;\\)<wbr>\\(({${numStr(x1)}},\\ ${fTex(n1, EQ.b)})\\)`
      : `\\((${numStr(x1)},\\ ${fTex(n1, EQ.b)})\\)<wbr>\\(\\;\\)<wbr>\\((${numStr(x2)},\\ ${fTex(n2, EQ.b)})\\)`;

    fb.innerHTML = wrapFeedback(
      same
        ? `<b style="color:${NO_COLOR}">兩組解算出同一個點</b><br>通過<b>一個</b>點的直線有無限多條，沒辦法決定該往哪個方向畫。兩點作圖法要的是<b>相異</b>的兩點。`
        : `<b style="color:${CH_SKY}">通過相異兩點的直線只有一條</b><br>` +
          `所以 \\(${stdTex(EQ.a, EQ.b, EQ.c)}\\) 的圖形已經被這兩個點釘死了。<br>` +
          (int1 && int2
            ? `這兩組解都是<b style="color:${OK_COLOR}">整數解</b>，落在格點上，描起來最準。`
            : `\\(3x\\) 要是偶數，\\(y\\) 才會是整數——也就是 \\(x\\) 取<b style="color:${CH_AMBER}">偶數</b>時最好描。`)
    );
    typeset([out, fb]);
  }

  aS.addEventListener('input', draw);
  bS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 4：截點與空著的那一區
   ========================================================================== */
function initCeptCanvas() {
  const cv = document.getElementById('canvas-cept');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const aS = document.getElementById('ic-a-slider');
  const bS = document.getElementById('ic-b-slider');
  const cS = document.getElementById('ic-c-slider');
  const aV = document.getElementById('ic-a-val');
  const bV = document.getElementById('ic-b-val');
  const cV = document.getElementById('ic-c-val');
  const out = document.getElementById('ic-formula');
  const fb = document.getElementById('ic-feedback');

  // 一條直線漏掉哪一個象限（a > 0，所以斜率的正負由 b 決定）
  function missedQuad(a, b, c) {
    if (b === 0) return 0;            // 鉛垂線：經過兩個象限，沒有「唯一漏掉的那一個」
    if (c === 0) return 0;            // 通過原點：只經過相對的兩個象限
    const mPos = (b < 0);             // 斜率 m = -a/b，a > 0 時 b<0 ⇒ m>0
    const nPos = (c / b) > 0;         // y 軸截距 n = c/b
    if (mPos && nPos) return 4;
    if (mPos && !nPos) return 2;
    if (!mPos && nPos) return 3;
    return 1;
  }

  function draw() {
    const a = parseInt(aS.value, 10);
    const b = parseInt(bS.value, 10);
    const c = parseInt(cS.value, 10);
    aV.textContent = a;
    bV.textContent = b;
    cV.textContent = c;
    const vertical = (b === 0);
    const thruO = (c === 0);
    const miss = missedQuad(a, b, c);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `${eqTex(a, b, c)} 的圖形切在哪裡？`, CH_CORAL);

    const g = drawPlane(ctx, PLANE);

    // 先把空著的那一區塗起來
    if (miss) {
      const sx = (miss === 1 || miss === 4) ? 1 : -1;
      const sy = (miss === 1 || miss === 2) ? 1 : -1;
      ctx.save();
      ctx.fillStyle = 'rgba(253, 164, 175, 0.13)';
      const x0 = g.px(sx > 0 ? 0 : g.min), y0 = g.py(sy > 0 ? g.max : 0);
      ctx.fillRect(x0, y0, g.unit * g.max, g.unit * g.max);
      ctx.restore();
    }

    drawEqLine(ctx, g, a, b, c, CH_CORAL, { width: 3 });

    // 兩個交點
    const xi = c / a;                       // 令 y = 0
    drawDot(ctx, g.px(xi), g.oy, CH_BRASS, 6.5);
    labelPt(ctx, g.px(xi), g.oy,
      [ptItems('', fracItem(c, a, CH_BRASS), T('0', CH_BRASS), CH_BRASS)],
      CH_BRASS, { dy: 24, maxY: g.bottom + 2 });
    if (!vertical) {
      const yi = c / b;                     // 令 x = 0
      drawDot(ctx, g.ox, g.py(yi), CH_MINT, 6.5);
      labelPt(ctx, g.ox, g.py(yi),
        [ptItems('', T('0', CH_MINT), fracItem(c, b, CH_MINT), CH_MINT)],
        CH_MINT, { dy: -22, side: 'left', minY: g.top + 18 });
    }

    drawLead(ctx, '令 y = 0',
      [SEQ([T(a === 1 ? '' : String(a), CH_BRASS), IT('x', CH_BRASS)], CH_BRASS, 1),
       T('=', CH_SLATE), T(String(c), CH_BRASS), T('→', CH_SLATE),
       ptItems('', fracItem(c, a, CH_BRASS), T('0', CH_BRASS), CH_BRASS)], R1, CH_BRASS);
    if (vertical) {
      drawLead(ctx, '令 x = 0', [inkItems('0 = ' + c, CH_MINT)], R2,
        c === 0 ? CH_MINT : NO_COLOR);
    } else {
      drawLead(ctx, '令 x = 0',
        [SEQ([T(Math.abs(b) === 1 ? (b < 0 ? '-' : '') : String(b), CH_MINT), IT('y', CH_MINT)], CH_MINT, 1),
         T('=', CH_SLATE), T(String(c), CH_MINT), T('→', CH_SLATE),
         ptItems('', T('0', CH_MINT), fracItem(c, b, CH_MINT), CH_MINT)], R2, CH_MINT);
    }

    if (vertical) {
      drawNote(ctx, c === 0 ? 'b = 0 且 c = 0：這條線就是 y 軸本身'
        : 'b = 0 時圖形是鉛垂線，它和 y 軸不相交（重點 5）', R3, CH_AMBER, 13.5);
    } else if (thruO) {
      drawNote(ctx, 'c = 0：圖形通過原點，只會經過相對的兩個象限', R3, CH_AMBER, 13.5);
    } else {
      drawNote(ctx, `這條線不通過${quadName(miss)}`, R3, CH_CORAL, 14.5);
    }

    const parts = [wbrEq(eqTex(a, b, c))];
    parts.push(`\\(x\\) 軸：\\((${fTex(c, a)},\\ 0)\\)`);
    parts.push(vertical ? '不交 \\(y\\) 軸' : `\\(y\\) 軸：\\((0,\\ ${fTex(c, b)})\\)`);
    out.innerHTML = parts.join('<wbr>　');

    fb.innerHTML = wrapFeedback(
      vertical
        ? `<b style="color:${CH_AMBER}">\\(b = 0\\)，方程式變成 \\(${a === 1 ? '' : a}x = ${c}\\)</b><br>` +
          `圖形是一條<b>鉛垂線</b> \\(x = ${fTex(c, a)}\\)。它和 \\(y\\) 軸<b>平行</b>，所以沒有「與 \\(y\\) 軸的交點」。` +
          (c === 0 ? `<br>而且 \\(c = 0\\)，這條線正好就是 \\(y\\) 軸本身。` : '')
        : (thruO
          ? `<b style="color:${CH_AMBER}">\\(c = 0\\)，兩個交點都跑到原點去了</b><br>` +
            `令 \\(y=0\\) 得 \\((0,0)\\)、令 \\(x=0\\) 也得 \\((0,0)\\)。通過原點的斜直線只會經過<b>相對的兩個</b>象限，所以「不通過的象限」有兩個，不只一個。`
          : `<b style="color:${CH_BRASS}">與 \\(x\\) 軸交於 \\((${fTex(c, a)},\\ 0)\\)</b>、` +
            `<b style="color:${CH_MINT}">與 \\(y\\) 軸交於 \\((0,\\ ${fTex(c, b)})\\)</b><br>` +
            `把這兩點連起來、再往兩端延伸，畫面上淡紅色那一區<b>完全空著</b>——所以圖形不通過<b style="color:${CH_CORAL}">${quadName(miss)}</b>。<br>` +
            `一條斜的直線恰好經過三個象限，剩下的那一個就是答案。`)
    );
    typeset([out, fb]);
  }

  [aS, bS, cS].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 5：水平線與鉛垂線切換台
   ========================================================================== */
function initGridCanvas() {
  const cv = document.getElementById('canvas-grid');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const kS = document.getElementById('gr-k-slider');
  const kV = document.getElementById('gr-k-val');
  const out = document.getElementById('gr-formula');
  const fb = document.getElementById('gr-feedback');
  const modeGroup = document.getElementById('gr-mode-group');
  let mode = 'y';

  function draw() {
    const k = parseInt(kS.value, 10);
    kV.textContent = k;
    const isY = (mode === 'y');
    const eqStr = isY ? `y = ${k}` : `x = ${k}`;
    const stdStr = isY ? `0x + y = ${k}` : `x + 0y = ${k}`;
    const color = isY ? CH_MINT : CH_VIOLET;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `${eqStr} 的圖形往哪個方向鋪？`, color);

    const g = drawPlane(ctx, PLANE);

    // a = 0 是水平線 y = k；b = 0 是鉛垂線 x = k
    drawEqLine(ctx, g, isY ? 0 : 1, isY ? 1 : 0, k, color, { width: 3.2 });

    // 與軸的交點
    const ix = isY ? g.ox : g.px(k);
    const iy = isY ? g.py(k) : g.oy;
    drawDot(ctx, ix, iy, CH_BRASS, 7);
    labelPt(ctx, ix, iy,
      [ptItems('', T(isY ? '0' : String(k), CH_BRASS), T(isY ? String(k) : '0', CH_BRASS), CH_BRASS)],
      CH_BRASS, { dy: isY ? -22 : 24, side: isY ? 'left' : undefined, minY: g.top + 18, maxY: g.bottom + 2 });

    // 線上另外兩個點：強調「另一個坐標是自由的」
    [-4, 4].forEach(t => {
      const sx = isY ? g.px(t) : g.px(k);
      const sy = isY ? g.py(k) : g.py(t);
      drawDot(ctx, sx, sy, color, 4.5);
    });

    drawLead(ctx, '補成二元一次', [inkItems(stdStr, CH_SLATE)], R1, CH_SLATE);
    drawLead(ctx, '線上的點',
      [-4, 0, 4].map(t => isY
        ? ptItems('', T(String(t), color), T(String(k), color), color)
        : ptItems('', T(String(k), color), T(String(t), color), color)),
      R2, color);

    if (k === 0) {
      drawNote(ctx, isY ? 'y = 0 的圖形就是 x 軸本身' : 'x = 0 的圖形就是 y 軸本身', R3, CH_BRASS, 14.5);
    } else {
      drawNote(ctx, isY ? `這是一條水平線，與 y 軸垂直於 (0 , ${k})`
        : `這是一條鉛垂線，與 x 軸垂直於 (${k} , 0)`, R3, color, 14);
    }

    out.innerHTML = `${wbrEq(eqStr)}<wbr>　\\(\\Leftrightarrow\\)<wbr>　${wbrEq(stdStr)}`;

    fb.innerHTML = wrapFeedback(
      k === 0
        ? `<b style="color:${CH_BRASS}">特例：${isY ? '\\(y = 0\\) 的圖形就是 \\(x\\) 軸' : '\\(x = 0\\) 的圖形就是 \\(y\\) 軸'}</b><br>` +
          (isY
            ? `\\(x\\) 軸上每一點的 \\(y\\) 坐標都是 \\(0\\)，這正是 \\(y=0\\) 描述的那一群點。`
            : `\\(y\\) 軸上每一點的 \\(x\\) 坐標都是 \\(0\\)，這正是 \\(x=0\\) 描述的那一群點。`)
        : (isY
          ? `<b style="color:${CH_MINT}">\\(y = ${k}\\) 是一條水平線</b><br>` +
            `線上每一點的 \\(y\\) 坐標都是 \\(${k}\\)，而 \\(x\\) <b>想是多少都行</b>——所以線往左右鋪開。<br>` +
            `它<b>與 \\(y\\) 軸垂直</b>，交於 \\((0,\\ ${k})\\)。注意：式子裡出現的是 \\(y\\)，線卻不是沿著 \\(y\\) 軸的方向。`
          : `<b style="color:${CH_VIOLET}">\\(x = ${k}\\) 是一條鉛垂線</b><br>` +
            `線上每一點的 \\(x\\) 坐標都是 \\(${k}\\)，而 \\(y\\) <b>想是多少都行</b>——所以線往上下鋪開。<br>` +
            `它<b>與 \\(x\\) 軸垂直</b>，交於 \\((${k},\\ 0)\\)。它是一整條線，不是「\\(x\\) 軸上的 \\(${k}\\) 那一點」。`)
    );
    typeset([out, fb]);
  }

  bindPickGroup(modeGroup, 'data-mode', v => { mode = v; draw(); });
  kS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 6：驗點機與求係數台
   ========================================================================== */
function initChkCanvas() {
  const cv = document.getElementById('canvas-chk');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const pS = document.getElementById('ck-p-slider');
  const qS = document.getElementById('ck-q-slider');
  const pV = document.getElementById('ck-p-val');
  const qV = document.getElementById('ck-q-val');
  const out = document.getElementById('ck-formula');
  const fb = document.getElementById('ck-feedback');
  const modeGroup = document.getElementById('ck-mode-group');
  let mode = 'check';

  function drawCheck(p, q) {
    const A = 2, B = -3, C = 6;
    const lhs = A * p + B * q;
    const on = (lhs === C);

    drawTitle(ctx, `P(${p} , ${q}) 在 2x - 3y = 6 的圖形上嗎？`, on ? OK_COLOR : NO_COLOR);
    const g = drawPlane(ctx, PLANE);
    const seg = drawEqLine(ctx, g, A, B, C, CH_SKY, { width: 3 });
    labelLine(ctx, g, seg, '2x - 3y = 6', CH_SKY, 1);

    const col = on ? OK_COLOR : NO_COLOR;
    drawFlag(ctx, g.px(p), g.py(q), col);
    labelPt(ctx, g.px(p), g.py(q),
      [ptItems('P', T(String(p), col), T(String(q), col), col)],
      col, { dy: q >= 0 ? -22 : 24, minY: g.top + 18, maxY: g.bottom + 2 });

    drawLead(ctx, '① 代入',
      [inkItems(`2${mul(p)} - 3${mul(q)}`, CH_SLATE), T('=', CH_SLATE), T(String(lhs), col)], R1, CH_SLATE);
    drawLead(ctx, '② 比兩邊',
      [T(String(lhs), col), T(on ? '=' : '≠', col), T(String(C), CH_SLATE)], R2, col);
    drawNote(ctx, on ? 'P 的坐標是一組解，所以 P 在圖形上'
      : 'P 的坐標不是解，所以 P 不在圖形上', R3, col, 14);

    out.innerHTML = `${wbrEq(`2${mul(p)} - 3${mul(q)} = ${lhs}`)}<wbr>　` +
      `\\(${lhs} ${on ? '=' : '\\ne'} 6\\)`;

    fb.innerHTML = wrapFeedback(
      `<b style="color:${col}">${on ? 'P 在圖形上' : 'P 不在圖形上'}</b><br>` +
      `把 \\(x = ${p}\\)、\\(y = ${q}\\) 代進 \\(2x - 3y\\)，得到 \\(${lhs}\\)，` +
      (on ? `和右邊的 \\(6\\) <b>相等</b>，所以這組坐標是一組解。`
        : `和右邊的 \\(6\\) <b>不相等</b>（差了 \\(${Math.abs(C - lhs)}\\)），所以這組坐標不是解。`) +
      `<br>驗點只有這一招：代進去比兩邊，不必畫圖也不必量距離。`
    );
  }

  function drawSolve(p, q) {
    const A = 2, C = 8;
    const bad = (q === 0);
    const bn = C - A * p, bd = q;                 // b = (8 - 2p) / q
    const bVal = bad ? null : bn / bd;

    drawTitle(ctx, bad ? 'P 的 y 坐標是 0，這樣定不出 b'
      : `2x + by = 8 通過 P(${p} , ${q})，b 是多少？`, bad ? NO_COLOR : CH_VIOLET);
    const g = drawPlane(ctx, PLANE);

    if (!bad) {
      const seg = drawEqLine(ctx, g, A, bVal, C, CH_VIOLET, { width: 3 });
      labelLine(ctx, g, seg, '2x + by = 8', CH_VIOLET, 1);
    }
    drawFlag(ctx, g.px(p), g.py(q), bad ? NO_COLOR : CH_BRASS);
    labelPt(ctx, g.px(p), g.py(q),
      [ptItems('P', T(String(p), CH_BRASS), T(String(q), CH_BRASS), CH_BRASS)],
      bad ? NO_COLOR : CH_BRASS, { dy: q >= 0 ? -22 : 24, minY: g.top + 18, maxY: g.bottom + 2 });

    drawLead(ctx, '① 代入',
      [inkItems(`2${mul(p)} + b${mul(q)} = 8`, CH_SLATE)], R1, CH_SLATE);
    if (bad) {
      drawLead(ctx, '② 整理', [inkItems(`${A * p} = 8`, NO_COLOR)], R2, NO_COLOR);
      drawNote(ctx, p === 4 ? 'b 被消掉了，任何 b 都成立，定不出唯一的值'
        : 'b 被消掉了，等式不成立，沒有這樣的 b', R3, NO_COLOR, 13.5);
    } else {
      drawLead(ctx, '② 解出 b',
        [T('b', CH_VIOLET), T('=', CH_SLATE), fracItem(bn, bd, CH_VIOLET)], R2, CH_VIOLET);
      drawNote(ctx, '把 b 放回去，這條線就真的通過 P 了', R3, OK_COLOR, 13.5);
    }

    out.innerHTML = bad
      ? `${wbrEq(`2${mul(p)} + b \\times 0 = 8`)}<wbr>　\\(b\\) 被消掉了`
      : `${wbrEq(`2${mul(p)} + b${mul(q)} = 8`)}<wbr>　${wbrEq(`b = ${fTex(bn, bd)}`)}`;

    fb.innerHTML = wrapFeedback(
      bad
        ? `<b style="color:${NO_COLOR}">\\(y\\) 坐標是 \\(0\\) 時，\\(b\\) 會被乘掉</b><br>` +
          `\\(b \\times 0 = 0\\)，式子只剩 \\(${A * p} = 8\\)。` +
          (p === 4
            ? `這是<b>對的</b>，但也代表<b>任何 \\(b\\)</b> 都成立——定不出唯一的值。`
            : `這是<b>錯的</b>，所以沒有任何 \\(b\\) 能讓圖形通過這一點。`) +
          `<br>把 \\(y\\) 坐標調離 \\(0\\) 再試一次。`
        : `<b style="color:${CH_VIOLET}">「圖形通過 \\(P\\)」等於送你一組解</b><br>` +
          `把 \\(x = ${p}\\)、\\(y = ${q}\\) 代進去，方程式只剩 \\(b\\) 一個未知數，變成一元一次方程式：\\(b = ${fTex(bn, bd)}\\)。<br>` +
          `回代驗算：\\(2 \\times ${sub(p)} + ${fTex(bn, bd)} \\times ${sub(q)} = 8\\)，成立。`
    );
  }

  function draw() {
    const p = parseInt(pS.value, 10);
    const q = parseInt(qS.value, 10);
    pV.textContent = p;
    qV.textContent = q;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (mode === 'check') drawCheck(p, q); else drawSolve(p, q);
    typeset([out, fb]);
  }

  bindPickGroup(modeGroup, 'data-mode', v => { mode = v; draw(); });
  pS.addEventListener('input', draw);
  qS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 7：原點檢查器
   ========================================================================== */
const ORG_CASES = [
  { a: 4, b: -3, tex: '4x - 3y' },
  { a: 5, b: 2, tex: '5x + 2y' },
  { a: -2, b: 1, tex: 'y - 2x' }
];

function initOrgCanvas() {
  const cv = document.getElementById('canvas-org');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const cS = document.getElementById('og-c-slider');
  const cV = document.getElementById('og-c-val');
  const out = document.getElementById('og-formula');
  const fb = document.getElementById('og-feedback');
  const caseGroup = document.getElementById('og-case-group');
  let idx = 0;

  function draw() {
    const c = parseInt(cS.value, 10);
    cV.textContent = c;
    const eq = ORG_CASES[idx];
    const thruO = (c === 0);
    const col = thruO ? OK_COLOR : CH_AMBER;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `${eq.tex} = ${c} 的圖形壓到原點了嗎？`, col);

    const g = drawPlane(ctx, PLANE);

    // c = 0 的那條線當參考（虛線），對照目前這條線平移到哪裡
    if (!thruO) drawEqLine(ctx, g, eq.a, eq.b, 0, CH_SLATE, { dash: [5, 5], alpha: 0.35, width: 2 });
    const seg = drawEqLine(ctx, g, eq.a, eq.b, c, col, { width: 3 });
    labelLine(ctx, g, seg, `${eq.tex} = ${c}`, col, 1);

    // 原點的標靶
    ctx.save();
    ctx.strokeStyle = thruO ? OK_COLOR : NO_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(g.ox, g.oy, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    drawDot(ctx, g.ox, g.oy, thruO ? OK_COLOR : NO_COLOR, 5);

    drawLead(ctx, '① 代原點',
      [inkItems(`${eq.tex.replace(/x/g, '(0)').replace(/y/g, '(0)')}`, CH_SLATE),
       T('=', CH_SLATE), T('0', CH_SLATE)], R1, CH_SLATE);
    drawLead(ctx, '② 比右邊',
      [T('0', col), T(thruO ? '=' : '≠', col), T(String(c), col)], R2, col);
    drawNote(ctx, thruO ? '常數項為 0，圖形通過原點'
      : `常數項是 ${c}，不等於 0，圖形不通過原點`, R3, col, 14);

    out.innerHTML = `${wbrEq(`${eq.tex} = ${c}`)}<wbr>　\\(0 ${thruO ? '=' : '\\ne'} ${c}\\)`;

    fb.innerHTML = wrapFeedback(
      thruO
        ? `<b style="color:${OK_COLOR}">通過原點</b><br>` +
          `把 \\((0,0)\\) 代進去，左邊<b>必定</b>變成 \\(0\\)；此時右邊的常數項也是 \\(0\\)，兩邊相等。<br>` +
          `這就是結論的由來：\\(ax + by = c\\) 的圖形通過原點 \\(\\Longleftrightarrow c = 0\\)。`
        : `<b style="color:${CH_AMBER}">不通過原點</b><br>` +
          `把 \\((0,0)\\) 代進去，左邊是 \\(0\\)，右邊是 \\(${c}\\)，兩邊不相等。<br>` +
          `畫面上那條灰虛線就是 \\(${eq.tex} = 0\\)：常數項一離開 \\(0\\)，整條線就<b>平移</b>走，原點被丟在線外。`
    );
    typeset([out, fb]);
  }

  bindPickGroup(caseGroup, 'data-case', v => { idx = parseInt(v, 10); draw(); });
  cS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 8：兩點反求台
   ========================================================================== */
function initRecCanvas() {
  const cv = document.getElementById('canvas-rec');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const axS = document.getElementById('rc-ax-slider');
  const ayS = document.getElementById('rc-ay-slider');
  const bxS = document.getElementById('rc-bx-slider');
  const byS = document.getElementById('rc-by-slider');
  const axV = document.getElementById('rc-ax-val');
  const ayV = document.getElementById('rc-ay-val');
  const bxV = document.getElementById('rc-bx-val');
  const byV = document.getElementById('rc-by-val');
  const out = document.getElementById('rc-formula');
  const fb = document.getElementById('rc-feedback');

  function render() {
    const px = parseInt(axS.value, 10), py = parseInt(ayS.value, 10);
    const qx = parseInt(bxS.value, 10), qy = parseInt(byS.value, 10);
    axV.textContent = px; ayV.textContent = py;
    bxV.textContent = qx; byV.textContent = qy;

    const samePt = (px === qx && py === qy);
    const vert = (!samePt && px === qx);
    const horiz = (!samePt && py === qy);
    // y = ax + b：a 的分子分母
    const an = qy - py, ad = qx - px;
    // b = py - a * px = (py * ad - an * px) / ad
    const bn = py * ad - an * px, bd = ad;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, samePt ? '兩支旗插在同一格，決定不了一條直線'
      : '通過這兩點的方程式是什麼？', samePt ? NO_COLOR : CH_MAGENTA);

    const g = drawPlane(ctx, PLANE);

    if (vert) drawEqLine(ctx, g, 1, 0, px, CH_MAGENTA, { width: 3 });
    else if (horiz) drawEqLine(ctx, g, 0, 1, py, CH_MAGENTA, { width: 3 });
    else if (!samePt) drawEqLine(ctx, g, -an, ad, bn, CH_MAGENTA, { width: 3 });

    drawFlag(ctx, g.px(px), g.py(py), CH_CORAL);
    if (!samePt) drawFlag(ctx, g.px(qx), g.py(qy), CH_SKY);
    labelPt(ctx, g.px(px), g.py(py), [ptItems('A', T(String(px), CH_CORAL), T(String(py), CH_CORAL), CH_CORAL)],
      CH_CORAL, { dy: -22, side: 'left', minY: g.top + 18 });
    if (!samePt) {
      labelPt(ctx, g.px(qx), g.py(qy), [ptItems('B', T(String(qx), CH_SKY), T(String(qy), CH_SKY), CH_SKY)],
        CH_SKY, { dy: 24, maxY: g.bottom + 2 });
    }

    if (samePt) {
      drawLead(ctx, '兩點相同', [ptItems('A = B', T(String(px), NO_COLOR), T(String(py), NO_COLOR), NO_COLOR)], R1, NO_COLOR);
      drawNote(ctx, '兩條式子會變成同一條，解不出唯一的 a 與 b', R2, NO_COLOR, 13.5);
      drawNote(ctx, '把其中一支旗移到別的格點上再試一次', R3, MUTED, 13.5);
      out.innerHTML = `兩點重合於 \\((${px},\\ ${py})\\)<wbr>　通過它的直線有無限多條`;
      fb.innerHTML = wrapFeedback(
        `<b style="color:${NO_COLOR}">兩個點必須相異</b><br>` +
        `兩點相同時，代出來的兩條式子完全一樣，等於只有一條方程式卻要解兩個未知數，\\(a\\) 與 \\(b\\) 定不下來。`
      );
      return;
    }

    if (vert) {
      drawLead(ctx, '兩點的 x 相同', [SEQ([IT('x', CH_MAGENTA), T('=', CH_SLATE), T(String(px), CH_MAGENTA)], CH_MAGENTA, 4)], R1, CH_MAGENTA);
      drawNote(ctx, '這是一條鉛垂線，不必列聯立', R2, CH_MAGENTA, 14);
      drawNote(ctx, '它寫不成 y = ax + b：同一個 x 配了無限多個 y', R3, CH_AMBER, 13.5);
      out.innerHTML = `\\(A(${px},\\ ${py})\\)、\\(B(${qx},\\ ${qy})\\)<wbr>　${wbrEq(`x = ${px}`)}`;
      fb.innerHTML = wrapFeedback(
        `<b style="color:${CH_MAGENTA}">兩點的 \\(x\\) 坐標都是 \\(${px}\\)</b><br>` +
        `所以這條線上每一點的 \\(x\\) 都是 \\(${px}\\)，方程式就是 \\(x = ${px}\\)。<br>` +
        `這種題目<b>不必列聯立</b>——而且它<b>寫不成</b> \\(y = ax + b\\)：那一型的每個 \\(x\\) 只配一個 \\(y\\)，這條線卻在 \\(x = ${px}\\) 上配了無限多個 \\(y\\)。`
      );
      return;
    }

    if (horiz) {
      drawLead(ctx, '兩點的 y 相同', [SEQ([IT('y', CH_MAGENTA), T('=', CH_SLATE), T(String(py), CH_MAGENTA)], CH_MAGENTA, 4)], R1, CH_MAGENTA);
      drawNote(ctx, '這是一條水平線，不必列聯立', R2, CH_MAGENTA, 14);
      drawNote(ctx, `寫成 y = ax + b 的話，a = 0、b = ${py}`, R3, MUTED, 13.5);
      out.innerHTML = `\\(A(${px},\\ ${py})\\)、\\(B(${qx},\\ ${qy})\\)<wbr>　${wbrEq(`y = ${py}`)}`;
      fb.innerHTML = wrapFeedback(
        `<b style="color:${CH_MAGENTA}">兩點的 \\(y\\) 坐標都是 \\(${py}\\)</b><br>` +
        `所以這條線上每一點的 \\(y\\) 都是 \\(${py}\\)，方程式就是 \\(y = ${py}\\)。<br>` +
        `它寫得成 \\(y = ax + b\\)：只是 \\(a = 0\\)、\\(b = ${py}\\)。`
      );
      return;
    }

    // 一般情形：列聯立解出 a 與 b
    drawLead(ctx, '① 代 A', [inkItems(`${py} = a${mul(px)} + b`, CH_CORAL)], R1, CH_CORAL);
    drawLead(ctx, '② 代 B', [inkItems(`${qy} = a${mul(qx)} + b`, CH_SKY)], R2, CH_SKY);
    drawLead(ctx, '① - ② 解出',
      [T('a', CH_MAGENTA), T('=', CH_SLATE), fracItem(an, ad, CH_MAGENTA),
       T('，', CH_SLATE), T('b', CH_MAGENTA), T('=', CH_SLATE), fracItem(bn, bd, CH_MAGENTA)],
      R3, CH_MAGENTA);

    const aTex = fTex(an, ad), bTex = fTex(bn, bd);
    const lineTex = `y = ${slopeTex(an, ad)}x${constTex(bn, bd)}`;
    out.innerHTML = `${wbrEq(`a = ${aTex}`)}、${wbrEq(`b = ${bTex}`)}<wbr>　\\(${lineTex}\\)`;

    fb.innerHTML = wrapFeedback(
      `<b style="color:${CH_MAGENTA}">兩個點各代一次，就得到一個聯立方程式</b><br>` +
      `未知數是 \\(a\\) 與 \\(b\\)：\\(${py} = a${mul(px)} + b\\) 與 \\(${qy} = a${mul(qx)} + b\\)。<br>` +
      `兩式相減把 \\(b\\) 消掉，得 \\(a = ${aTex}\\)；再代回其中一式得 \\(b = ${bTex}\\)。<br>` +
      `記得把<b>兩個點都回代</b>驗算，只驗一個容易漏掉抄錯的那一條。`
    );
  }

  function draw() {
    render();
    typeset([out, fb]);
  }

  [axS, ayS, bxS, byS].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 9：交點＝共同解
   ========================================================================== */
function initCrossCanvas() {
  const cv = document.getElementById('canvas-cross');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const pS = document.getElementById('cx-p-slider');
  const qS = document.getElementById('cx-q-slider');
  const pV = document.getElementById('cx-p-val');
  const qV = document.getElementById('cx-q-val');
  const out = document.getElementById('cx-formula');
  const fb = document.getElementById('cx-feedback');

  function draw() {
    const p = parseInt(pS.value, 10);
    const q = parseInt(qS.value, 10);
    pV.textContent = p;
    qV.textContent = q;
    // L1: x + 2y = p 、L2: 2x - y = q  ⇒  x = (p + 2q)/5、y = (2p - q)/5
    const xn = p + 2 * q, yn = 2 * p - q, dn = 5;
    const xv = xn / dn, yv = yn / dn;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '兩條線交在哪裡？那就是共同解', CH_MOSS);

    const g = drawPlane(ctx, PLANE);
    const s1 = drawEqLine(ctx, g, 1, 2, p, CH_SKY, { width: 3 });
    const s2 = drawEqLine(ctx, g, 2, -1, q, CH_CORAL, { width: 3 });
    labelLine(ctx, g, s1, `L1: x + 2y = ${p}`, CH_SKY, 0);
    labelLine(ctx, g, s2, `L2: 2x - y = ${q}`, CH_CORAL, 1);

    dashLine(ctx, g.px(xv), g.oy, g.px(xv), g.py(yv), 'rgba(190, 242, 100, 0.5)');
    dashLine(ctx, g.ox, g.py(yv), g.px(xv), g.py(yv), 'rgba(190, 242, 100, 0.5)');
    drawDot(ctx, g.px(xv), g.py(yv), CH_MOSS, 7.5);
    labelPt(ctx, g.px(xv), g.py(yv),
      [ptItems('P', fracItem(xn, dn, CH_MOSS), fracItem(yn, dn, CH_MOSS), CH_MOSS)],
      CH_MOSS, { dy: 24, maxY: g.bottom + 2 });

    drawLead(ctx, '① + ② × 2',
      [inkItems(`5x = ${p} + 2${mul(q)} = ${xn}`, CH_SLATE)], R1, CH_SLATE);
    drawLead(ctx, '解出交點',
      [IT('x', CH_MOSS), T('=', CH_SLATE), fracItem(xn, dn, CH_MOSS),
       T('，', CH_SLATE), IT('y', CH_MOSS), T('=', CH_SLATE), fracItem(yn, dn, CH_MOSS)], R2, CH_MOSS);
    drawNote(ctx, '交點的坐標，同時滿足上下兩個方程式', R3, CH_MOSS, 14);

    out.innerHTML = casesTex(`x + 2y = ${p}`, `2x - y = ${q}`) +
      `<wbr>　\\(\\to\\)<wbr>　\\(P\\left(${fTex(xn, dn)},\\ ${fTex(yn, dn)}\\right)\\)`;

    fb.innerHTML = wrapFeedback(
      `<b style="color:${CH_MOSS}">交點同時在兩條線上</b><br>` +
      `在 \\(L_1\\) 上 \\(\\Rightarrow\\) 它的坐標是 \\(x + 2y = ${p}\\) 的解；` +
      `在 \\(L_2\\) 上 \\(\\Rightarrow\\) 也是 \\(2x - y = ${q}\\) 的解。<br>` +
      `兩個同時成立，就是這個聯立方程式的<b>共同解</b>：\\(x = ${fTex(xn, dn)}\\)、\\(y = ${fTex(yn, dn)}\\)。<br>` +
      (dn !== 1 && (reduce(xn, dn)[1] !== 1 || reduce(yn, dn)[1] !== 1)
        ? `這一組交點是<b style="color:${CH_AMBER}">分數</b>——用眼睛看格線是讀不出來的，一定要解聯立。`
        : `這一組交點剛好是整數，看圖也讀得出來；但交點是分數時就<b>只能</b>用解的。`)
    );
    typeset([out, fb]);
  }

  pS.addEventListener('input', draw);
  qS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 10：圍出來的那塊海域
   ========================================================================== */
function initAreaCanvas() {
  const cv = document.getElementById('canvas-area');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const aS = document.getElementById('ar-a-slider');
  const bS = document.getElementById('ar-b-slider');
  const aV = document.getElementById('ar-a-val');
  const bV = document.getElementById('ar-b-val');
  const out = document.getElementById('ar-formula');
  const fb = document.getElementById('ar-feedback');

  function draw() {
    const a = parseInt(aS.value, 10);
    const b = parseInt(bS.value, 10);
    aV.textContent = a;
    bV.textContent = b;
    // L1: x - y = a（與 x 軸交於 (a,0)）、L2: 2x + y = b（與 x 軸交於 (b/2,0)）
    // 交點：3x = a + b ⇒ x = (a+b)/3、y = x - a = (b-2a)/3
    const k = b - 2 * a;
    const degen = (k === 0);
    const Ax = (a + b) / 3, Ay = k / 3;
    const Bx = a, Cx = b / 2;
    const baseN = Math.abs(k), baseD = 2;         // 底 = |b/2 - a| = |k|/2
    const hiN = Math.abs(k), hiD = 3;             // 高 = |k|/3
    const areaN = k * k, areaD = 12;              // 面積 = k² / 12

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, degen ? '兩條線交在 x 軸上，圍不出三角形'
      : '兩條線與 x 軸圍出的那一塊', degen ? NO_COLOR : CH_CYAN);

    const g = drawPlane(ctx, PLANE);

    if (!degen) {
      ctx.save();
      ctx.fillStyle = 'rgba(103, 232, 249, 0.18)';
      ctx.beginPath();
      ctx.moveTo(g.px(Bx), g.oy);
      ctx.lineTo(g.px(Cx), g.oy);
      ctx.lineTo(g.px(Ax), g.py(Ay));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    const s1 = drawEqLine(ctx, g, 1, -1, a, CH_SKY, { width: 2.6 });
    const s2 = drawEqLine(ctx, g, 2, 1, b, CH_CORAL, { width: 2.6 });
    labelLine(ctx, g, s1, `L1: x - y = ${a}`, CH_SKY, 0);
    labelLine(ctx, g, s2, `L2: 2x + y = ${b}`, CH_CORAL, 1);

    if (!degen) dashLine(ctx, g.px(Ax), g.py(Ay), g.px(Ax), g.oy, 'rgba(103, 232, 249, 0.75)', [4, 4]);

    drawDot(ctx, g.px(Bx), g.oy, CH_SKY, 6);
    drawDot(ctx, g.px(Cx), g.oy, CH_CORAL, 6);
    drawDot(ctx, g.px(Ax), g.py(Ay), CH_CYAN, 7);
    labelPt(ctx, g.px(Bx), g.oy, [ptItems('B', T(numStr(Bx), CH_SKY), T('0', CH_SKY), CH_SKY)],
      CH_SKY, { dy: 24, side: 'left', maxY: g.bottom + 2 });
    labelPt(ctx, g.px(Cx), g.oy, [ptItems('C', fracItem(b, 2, CH_CORAL), T('0', CH_CORAL), CH_CORAL)],
      CH_CORAL, { dy: 24, maxY: g.bottom + 2 });
    if (!degen) {
      labelPt(ctx, g.px(Ax), g.py(Ay),
        [ptItems('A', fracItem(a + b, 3, CH_CYAN), fracItem(k, 3, CH_CYAN), CH_CYAN)],
        CH_CYAN, { dy: Ay >= 0 ? -24 : 26, minY: g.top + 20, maxY: g.bottom + 2 });
    }

    if (degen) {
      drawLead(ctx, '交點', [ptItems('A', T(numStr(Ax), NO_COLOR), T('0', NO_COLOR), NO_COLOR)], R1, NO_COLOR);
      drawNote(ctx, '交點剛好落在 x 軸上，三個頂點擠成一直線', R2, NO_COLOR, 13.5);
      drawNote(ctx, '高是 0，面積也是 0——調動任一支滑桿就會恢復', R3, MUTED, 13.5);
      out.innerHTML = `兩線交於 \\((${numStr(Ax)},\\ 0)\\)<wbr>　面積 \\(= 0\\)`;
      fb.innerHTML = wrapFeedback(
        `<b style="color:${NO_COLOR}">圍不出三角形</b><br>` +
        `這時兩條線與 \\(x\\) 軸<b>交在同一點</b>，\\(A\\)、\\(B\\)、\\(C\\) 三個頂點重疊成一條線，底或高有一個是 \\(0\\)。<br>` +
        `要圍出三角形，三個頂點不能共線。`
      );
      typeset([out, fb]);
      return;
    }

    drawLead(ctx, '底（B 到 C）',
      [fracItem(baseN, baseD, CH_MOSS)], R1, CH_MOSS, { eqX: 152 });
    drawLead(ctx, '高（A 到 x 軸）',
      [fracItem(hiN, hiD, CH_MOSS)], R2, CH_MOSS, { eqX: 152 });
    drawLead(ctx, '面積',
      [FR(1, 2, CH_CYAN), T('×', CH_SLATE), fracItem(baseN, baseD, CH_CYAN),
       T('×', CH_SLATE), fracItem(hiN, hiD, CH_CYAN), T('=', CH_SLATE), fracItem(areaN, areaD, CH_CYAN)],
      R3, CH_CYAN, { eqX: 152 });

    out.innerHTML = `底 \\(= ${fTex(baseN, baseD)}\\)<wbr>　高 \\(= ${fTex(hiN, hiD)}\\)` +
      `<wbr>　面積 \\(= ${fTex(areaN, areaD)}\\)`;

    fb.innerHTML = wrapFeedback(
      `<b style="color:${CH_CYAN}">三個頂點分別從哪裡來</b><br>` +
      `\\(B(${numStr(Bx)},\\ 0)\\) 是 \\(L_1\\) 令 \\(y=0\\) 求得、\\(C\\left(${fTex(b, 2)},\\ 0\\right)\\) 是 \\(L_2\\) 令 \\(y=0\\) 求得，` +
      `\\(A\\left(${fTex(a + b, 3)},\\ ${fTex(k, 3)}\\right)\\) 是解聯立求得。<br>` +
      `<b>底</b>取 \\(B\\)、\\(C\\) 的 \\(x\\) 坐標相減再取絕對值 \\(= ${fTex(baseN, baseD)}\\)；` +
      `<b>高</b>取 \\(A\\) 到 \\(x\\) 軸的距離，也就是 \\(|y_A| = ${fTex(hiN, hiD)}\\)——<b>不是</b> \\(A\\) 的 \\(x\\) 坐標。<br>` +
      `面積 \\(= \\frac{1}{2} \\times ${fTex(baseN, baseD)} \\times ${fTex(hiN, hiD)} = ${fTex(areaN, areaD)}\\)。`
    );
    typeset([out, fb]);
  }

  aS.addEventListener('input', draw);
  bS.addEventListener('input', draw);
  draw();
}
