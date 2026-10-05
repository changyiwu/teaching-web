/* ==========================================================================
   3-5-1（第三冊 5-1）資料整理與統計圖表 — 互動 Canvas 與隨堂評量
   畫風：Risograph 雙色孔版印刷・校刊社（小晏、阿樸）。
   配色：粉紅 RG_PINK 與藍綠 RG_TEAL 是兩色油墨（兩群資料比較時，甲粉紅、乙藍綠）；
   玫瑰 RG_ROSE 是錯、翡翠綠 RG_JADE 是對。

   共用工具在 ../math-canvas.js（T／IT／FR／drawExpr／drawPanel／drawTitle／
   wbrEq／textCenter／textLeft…），本檔只放本節的色票、統計圖工具與 9 個互動。

   ⚠️ 統計圖的縱軸一律從 0 開始、線性刻度（開發約束 17）：柱高與點高都和數值
   成正比，不用對數或截斷的刻度。
   ⚠️ 百分比一律用整數運算判斷能不能整除（pctInfo），除不盡才印近似值。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();
  initQuizCharts();

  initCumTableCanvas();
  initCumLineCanvas();
  initCumReadCanvas();
  initFairCanvas();
  initRelTableCanvas();
  initConvertCanvas();
  initTwoWaysCanvas();
  initPositionCanvas();
  initCompareCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具（RG_ = Risograph；共用檔沒有這個前綴）
   ========================================================================== */

const RG_PINK = '#f472b6';    // 粉紅油墨：甲、主要的那一條線
const RG_TEAL = '#2dd4bf';    // 藍綠油墨：乙、對照的那一條線
const RG_CREAM = '#fdf2f8';   // 深色底板上的字色
const RG_ROSE = '#fb7185';    // 錯誤、情境不成立
const RG_JADE = '#6ee7b7';    // 正確
const RG_GOLD = '#fcd34d';    // 強調（要讀的那個高度）

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const RG_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc'];

// 累加疊疊樂：每一組各一個顏色，疊起來才看得出「由哪幾組組成」
const RG_STACK = ['#f472b6', '#2dd4bf', '#fcd34d', '#a78bfa', '#fb923c', '#60a5fa'];

function elById(id) {
  return document.getElementById(id);
}

function iv(el) {
  return parseInt(el.value, 10);
}

// 累積次數（依序累加）
function cumOf(arr) {
  const out = [];
  let s = 0;
  arr.forEach(v => { s += v; out.push(s); });
  return out;
}

function sumOf(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

// 組別文字：canvas 用全形波浪號，LaTeX 用「a～b」的中文寫法放在 \( \) 外
function grpText(lo, hi) {
  return `${lo}～${hi}`;
}

function grpTex(lo, hi) {
  return `\\(${lo}\\)～\\(${hi}\\)`;
}

/* --------------------------------------------------------------------------
   百分比：p / t × 100%，能在兩位小數內除盡就印精確值，否則印到一位的近似值
   一律用整數判斷，不靠浮點數比大小
   -------------------------------------------------------------------------- */
function pctInfo(p, t) {
  if ((10000 * p) % t === 0) {
    const h = (10000 * p) / t;           // 百分比 × 100（整數）
    const ip = Math.floor(h / 100), fp = h % 100;
    let s;
    if (fp === 0) s = String(ip);
    else if (fp % 10 === 0) s = `${ip}.${fp / 10}`;
    else s = `${ip}.${fp < 10 ? '0' + fp : fp}`;
    return { exact: true, s, h };
  }
  const tenth = Math.round((1000 * p) / t);
  const s = `${Math.floor(tenth / 10)}.${tenth % 10}`;
  return { exact: false, s, h: null };
}

// LaTeX：「= 75\%」或「\approx 73.3\%」
function pctRelTex(p, t) {
  const r = pctInfo(p, t);
  return `${r.exact ? '=' : '\\approx'} ${r.s}\\%`;
}

function pctText(p, t) {
  const r = pctInfo(p, t);
  return `${r.exact ? '' : '約 '}${r.s}%`;
}

/* --------------------------------------------------------------------------
   統計圖工具：座標軸（縱軸從 0 開始、線性）、折線、柱子
   -------------------------------------------------------------------------- */
function rgChart(ctx, o) {
  const { L, R, T, B, xMin, xMax, yMax, yStep } = o;
  const px = x => L + (x - xMin) / (xMax - xMin) * (R - L);
  const py = y => B - y / yMax * (B - T);
  const tickFont = o.tickFont || f(600, 12);
  ctx.save();
  // 水平格線
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  for (let y = yStep; y <= yMax + 1e-9; y += yStep) {
    ctx.beginPath();
    ctx.moveTo(L, py(y));
    ctx.lineTo(R, py(y));
    ctx.stroke();
  }
  // 座標軸
  ctx.strokeStyle = MUTED;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(L, T - 8);
  ctx.lineTo(L, B);
  ctx.lineTo(R + 8, B);
  ctx.stroke();
  // 縱軸刻度
  if (!o.noYLabels) {
    for (let y = 0; y <= yMax + 1e-9; y += yStep) {
      ctx.fillStyle = o.yTickColor || INK;
      ctx.font = tickFont;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(numStr(y), L - 6, py(y));
    }
  }
  // 橫軸刻度
  (o.xTicks || []).forEach(x => {
    ctx.strokeStyle = MUTED;
    ctx.beginPath();
    ctx.moveTo(px(x), B);
    ctx.lineTo(px(x), B + 5);
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = tickFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(numStr(x), px(x), B + 15);
  });
  ctx.restore();
  if (o.yLabel) textLeft(ctx, o.yLabel, o.yLabelX == null ? 10 : o.yLabelX, T - 18, o.yLabelColor || MUTED, f(700, 12));
  if (o.xLabel) {
    ctx.save();
    ctx.fillStyle = MUTED;
    ctx.font = f(700, 12);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(o.xLabel, R + 8, B + 32);
    ctx.restore();
  }
  return { px, py, L, R, T, B };
}

// 右側第二條縱軸（次數與相對次數並列時用）
function rgRightAxis(ctx, A, yMax, yStep, color, label) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(A.R, A.T - 8);
  ctx.lineTo(A.R, A.B);
  ctx.stroke();
  ctx.globalAlpha = 1;
  for (let y = 0; y <= yMax + 1e-9; y += yStep) {
    const yy = A.B - y / yMax * (A.B - A.T);
    ctx.fillStyle = color;
    ctx.font = f(600, 12);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(numStr(y), A.R + 6, yy);
  }
  ctx.restore();
  if (label) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = f(700, 12);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, ctx.canvas.width - 8, A.T - 18);
    ctx.restore();
  }
}

// 折線＋圓點；labels 為 true 時在點旁標出縱坐標
function rgLine(ctx, A, pts, color, o) {
  const opt = o || {};
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = opt.w || 2.6;
  if (opt.dash) ctx.setLineDash(opt.dash);
  ctx.globalAlpha = opt.alpha == null ? 1 : opt.alpha;
  ctx.beginPath();
  pts.forEach((p, i) => {
    const x = A.px(p[0]), y = A.py(p[1]);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);
  pts.forEach(p => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(A.px(p[0]), A.py(p[1]), opt.r || 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,8,28,0.9)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });
  ctx.restore();
  if (opt.labels) {
    pts.forEach((p, i) => {
      if (i === 0 && p[1] === 0) return;   // 起點 0 會和縱軸的 0 疊在一起
      haloText(ctx, numStr(p[1]), A.px(p[0]) + (opt.labelDx || -10), A.py(p[1]) + (opt.labelDy || -12),
        color, f(800, opt.labelSize || 12.5));
    });
  }
}

// 帶深色描邊的數字標籤：壓在折線上也讀得出來
function haloText(ctx, text, cx, cy, color, font) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(12,10,30,0.92)';
  ctx.lineWidth = 4;
  ctx.strokeText(text, cx, cy);
  ctx.fillStyle = color;
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

// 虛線引導：從點到兩軸
function rgGuide(ctx, A, x, y, color, toX, toY) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([5, 4]);
  if (toY !== false) {
    ctx.beginPath();
    ctx.moveTo(A.px(x), A.py(y));
    ctx.lineTo(A.L, A.py(y));
    ctx.stroke();
  }
  if (toX !== false) {
    ctx.beginPath();
    ctx.moveTo(A.px(x), A.py(y));
    ctx.lineTo(A.px(x), A.B);
    ctx.stroke();
  }
  ctx.restore();
}

// 縱向大括號＋標籤（標出兩個高度之間的差）
function rgSpan(ctx, x, y1, y2, color, label, side) {
  const top = Math.min(y1, y2), bot = Math.max(y1, y2);
  const dir = side === 'left' ? -1 : 1;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + 7 * dir, top);
  ctx.lineTo(x + 7 * dir, bot);
  ctx.lineTo(x, bot);
  ctx.stroke();
  ctx.restore();
  if (label && bot - top > 1) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = f(800, 13);
    ctx.textAlign = side === 'left' ? 'right' : 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 12 * dir, (top + bot) / 2);
    ctx.restore();
  }
}

// 右側的兩個標籤：太靠近時上下推開，避免互壓
function sideLabels(ctx, x, items, yTop, yBot) {
  const list = items.map(it => ({ ...it })).sort((p, q) => p.y - q.y);
  for (let i = 1; i < list.length; i++) {
    if (list[i].y - list[i - 1].y < 20) list[i].y = list[i - 1].y + 20;
  }
  const over = list[list.length - 1].y - (yBot - 6);
  if (over > 0) list.forEach(it => { it.y -= over; });
  if (list[0].y < yTop) { const d = yTop - list[0].y; list.forEach(it => { it.y += d; }); }
  list.forEach(it => textLeft(ctx, it.text, x, it.y, it.color, f(800, 13)));
}

// 一行置中的混排說明（中文字與算式元件）
function exLine(ctx, items, y, size, color) {
  return drawExpr(ctx, items, ctx.canvas.width / 2, y, size || 16, color || INK, { maxW: ctx.canvas.width - 50, gap: 6 });
}

// 長句子：量寬折行後置中
function noteLines(ctx, text, y, color, size, maxW) {
  const font = f(700, size || 14);
  const lines = fitLines(ctx, text, maxW || ctx.canvas.width - 60, font);
  const lh = (size || 14) + 7;
  const y0 = y - (lines.length - 1) * lh / 2;
  lines.forEach((ln, i) => textCenter(ctx, ln, ctx.canvas.width / 2, y0 + i * lh, color, font));
}

// 只顯示這張卡片目前用得到的滑桿列
function showRow(id, on) {
  const el = elById(id);
  if (el) el.style.display = on ? '' : 'none';
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第三冊 5-1 的 18 題正解
  // 正解字母分布：A 5 題、B 4 題、C 5 題、D 4 題（開發約束 36）
  const answers = {
    '5-1-1': 'C',    // 未滿 80 分：4 + 6 + 9 = 19
    '5-1-2': 'A',    // 6 小時以上（含）：36 − 21 = 15
    '5-1-3': 'B',    // 70～80 的累積次數點：(80, 13)
    '5-1-4': 'D',    // 最後一點的縱坐標是總人數 30
    '5-1-5': 'A',    // 70 分以上（含）：40 − 19 = 21
    '5-1-6': 'C',    // 由高到低第 10 名在 80～90
    '5-1-7': 'D',    // 甲 75%、乙 81.25%，乙班較好
    '5-1-8': 'B',    // 人數不同的兩校比近視多寡
    '5-1-9': 'A',    // 10 / 40 = 25%
    '5-1-10': 'C',   // 相對次數折線圖描 (75, 15)
    '5-1-11': 'D',   // 14 ÷ 35% = 40
    '5-1-12': 'B',   // 甲 140 人、乙 135 人，甲多 5 人
    '5-1-13': 'A',   // a = 60 + 24 = 84
    '5-1-14': 'C',   // 總數 30：x = 12、y = 40、z = 30、u = 60
    '5-1-15': 'D',   // 160 × 75% = 120
    '5-1-16': 'A',   // 25% + 15% = 40%
    '5-1-17': 'B',   // 甲 0%、乙 25%
    '5-1-18': 'C'    // 乙班 8 小時以上（含）占 10%
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

/* --------------------------------------------------------------------------
   評量題的統計圖（靜態，畫一次）
   -------------------------------------------------------------------------- */
const QUIZ_CHARTS = {
  'qc-5': {
    xs: [40, 50, 60, 70, 80, 90, 100], yMax: 40, yStep: 5,
    yLabel: '累積次數（人）', xLabel: '分數（分）',
    series: [{ ys: [0, 4, 10, 19, 31, 37, 40], color: RG_PINK }]
  },
  'qc-6': {
    xs: [50, 60, 70, 80, 90, 100], yMax: 50, yStep: 10,
    yLabel: '累積次數（人）', xLabel: '分數（分）',
    series: [{ ys: [0, 6, 15, 28, 42, 50], color: RG_PINK }]
  },
  'qc-11': {
    xs: [145, 150, 155, 160, 165, 170, 175, 180], mids: true, yMax: 40, yStep: 5,
    yLabel: '相對次數（%）', xLabel: '身高（公分）',
    series: [{ ys: [5, 15, 35, 25, 15, 5], color: RG_TEAL }]
  },
  'qc-15': {
    xs: [40, 50, 60, 70, 80, 90, 100], yMax: 100, yStep: 10,
    yLabel: '累積相對次數（%）', xLabel: '分數（分）',
    series: [{ ys: [0, 5, 20, 45, 75, 95, 100], color: RG_PINK }]
  },
  'qc-16': {
    xs: [30, 40, 50, 60, 70, 80, 90, 100], yMax: 100, yStep: 10,
    yLabel: '累積相對次數（%）', xLabel: '分數（分）',
    series: [{ ys: [0, 5, 10, 25, 45, 70, 85, 100], color: RG_TEAL }]
  },
  'qc-17': {
    xs: [50, 60, 70, 80, 90, 100], yMax: 100, yStep: 10,
    yLabel: '累積相對次數（%）', xLabel: '分數（分）',
    series: [
      { ys: [0, 10, 30, 30, 70, 100], color: RG_PINK, name: '甲班', dy: -12, dx: -12 },
      { ys: [0, 5, 20, 45, 80, 100], color: RG_TEAL, name: '乙班', dy: 14, dx: 12 }
    ]
  },
  'qc-18': {
    xs: [0, 2, 4, 6, 8, 10], yMax: 100, yStep: 10,
    yLabel: '累積相對次數（%）', xLabel: '時數（小時）',
    series: [
      { ys: [0, 20, 50, 80, 100, 100], color: RG_PINK, name: '甲班', dy: -12, dx: -12 },
      { ys: [0, 10, 30, 60, 90, 100], color: RG_TEAL, name: '乙班', dy: 14, dx: 12 }
    ]
  }
};

function drawQuizChart(cv, cfg) {
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  const xs = cfg.xs;
  const A = rgChart(ctx, {
    L: 56, R: cv.width - 30, T: 40, B: cv.height - 44,
    xMin: xs[0], xMax: xs[xs.length - 1], yMax: cfg.yMax, yStep: cfg.yStep,
    xTicks: xs, yLabel: cfg.yLabel, xLabel: cfg.xLabel
  });
  cfg.series.forEach(s => {
    const px = cfg.mids ? s.ys.map((y, i) => [(xs[i] + xs[i + 1]) / 2, y]) : s.ys.map((y, i) => [xs[i], y]);
    rgLine(ctx, A, px, s.color, { labels: true, labelDy: s.dy || -12, labelDx: s.dx || -10 });
  });
  // 圖例（兩條線時）
  const named = cfg.series.filter(s => s.name);
  named.forEach((s, i) => {
    const x = A.L + 16, y = A.T + 4 + i * 20;
    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 22, y);
    ctx.stroke();
    ctx.restore();
    textLeft(ctx, s.name, x + 28, y, s.color, f(800, 13));
  });
}

function initQuizCharts() {
  const draw = () => {
    Object.keys(QUIZ_CHARTS).forEach(id => {
      const cv = elById(id);
      if (cv) drawQuizChart(cv, QUIZ_CHARTS[id]);
    });
  };
  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
}

/* ==========================================================================
   重點 1、2 共用的三班資料（分數 40～100，每 10 分一組）
   ⚠️ 不可以和 Q1～Q4 的數字相同（開發約束 29）
   ========================================================================== */
const SCORE_EDGES = [40, 50, 60, 70, 80, 90, 100];
const CF_DATA = [
  { name: '八年 1 班', f: [2, 3, 5, 8, 6, 4] },
  { name: '八年 2 班', f: [1, 4, 7, 6, 9, 5] },
  { name: '八年 3 班', f: [3, 2, 4, 5, 7, 3] }
];

/* ==========================================================================
   重點 1：累積次數分配表——累加疊疊樂
   ========================================================================== */
function initCumTableCanvas() {
  const cv = elById('canvas-cumtable');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = elById('cf-k'), sb = elById('cf-b');
  const vk = elById('cf-vk'), vb = elById('cf-vb');
  const out = elById('cf-formula');
  const fb = elById('cf-feedback');
  const C = RG_TONE[0];
  let ds = 0, mode = 'below';

  function draw() {
    const k = iv(sk), b = iv(sb);
    vk.textContent = k; vb.textContent = b;
    const fr = CF_DATA[ds].f, cum = cumOf(fr), N = cum[5];
    const j = (b - 40) / 10 - 1;          // 上限是 b 的那一組（0 起算）
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `${CF_DATA[ds].name}：累積次數（全班 ${N} 人）`, C);

    const yMax = Math.ceil(N / 5) * 5;
    const A = rgChart(ctx, {
      L: 58, R: 520, T: 66, B: 300, xMin: 0, xMax: 6, yMax, yStep: 5,
      yLabel: '累積次數（人）'
    });
    const slot = (A.R - A.L) / 6;
    const bw = slot * 0.6;
    for (let i = 0; i < 6; i++) {
      const cx = A.L + slot * (i + 0.5);
      const x0 = cx - bw / 2;
      textCenter(ctx, grpText(SCORE_EDGES[i], SCORE_EDGES[i + 1]), cx, A.B + 15, INK, f(600, 12));
      if (i < k) {
        // 疊起來：第 0 組到第 i 組
        let base = 0;
        for (let g = 0; g <= i; g++) {
          const y1 = A.py(base), y2 = A.py(base + fr[g]);
          ctx.save();
          ctx.fillStyle = RG_STACK[g];
          ctx.globalAlpha = g === i ? 0.95 : 0.55;
          ctx.fillRect(x0, y2, bw, y1 - y2);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = 'rgba(10,8,28,0.85)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x0, y2, bw, y1 - y2);
          ctx.restore();
          base += fr[g];
        }
        textCenter(ctx, String(cum[i]), cx, A.py(cum[i]) - 11, RG_CREAM, f(800, 14));
      } else {
        // 還沒累加：只畫這一組自己的人數（虛線框）
        ctx.save();
        ctx.strokeStyle = RG_STACK[i];
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1.6;
        ctx.strokeRect(x0, A.py(fr[i]), bw, A.B - A.py(fr[i]));
        ctx.restore();
        textCenter(ctx, `+${fr[i]}`, cx, A.py(fr[i]) - 11, RG_STACK[i], f(800, 13));
      }
    }

    // 要問的那一根
    const hx = A.L + slot * (j + 0.5);
    ctx.save();
    ctx.strokeStyle = RG_GOLD;
    ctx.lineWidth = 3;
    if (mode === 'below') {
      ctx.strokeRect(hx - bw / 2 - 4, A.py(cum[j]) - 4, bw + 8, A.B - A.py(cum[j]) + 4);
    } else if (k === 6) {
      // 以上（含）：最後一根（總數）的上半截
      const lx = A.L + slot * 5.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(lx - bw / 2 - 4, A.py(N), bw + 8, A.py(cum[j]) - A.py(N));
    }
    ctx.restore();

    // 下方說明
    const y = 350;
    drawPanel(ctx, 18, y - 20, W - 36, 120, C, 0.07);
    const kk = k - 1;
    const stepItems = kk === 0
      ? [T(`第 1 組：累積次數 = 這一組的次數 = ${fr[0]}`, INK)]
      : [T(`第 ${k} 組：`, INK), T(String(cum[kk - 1]), INK), T('+', INK), T(String(fr[kk]), RG_STACK[kk]), T('=', INK), T(String(cum[kk]), RG_CREAM)];
    exLine(ctx, stepItems, y + 2, 17);

    let ok = true;
    if (mode === 'below') {
      if (j >= k) ok = false;
      exLine(ctx, [T(`未滿 ${b} 分 = ${grpText(SCORE_EDGES[j], b)} 的累積次數 = ${cum[j]} 人`, RG_GOLD)], y + 38, 16);
      noteLines(ctx, ok ? '直接讀這一根柱子的高度，不必再減。' : `這一根還沒疊出來：把「累加到第幾組」拉到 ${j + 1} 以上。`,
        y + 72, ok ? MUTED : RG_ROSE, 13);
    } else {
      if (k < 6) ok = false;
      exLine(ctx, [T(`${b} 分以上（含）= ${N} − ${cum[j]} = ${N - cum[j]} 人`, RG_GOLD)], y + 38, 16);
      noteLines(ctx, ok ? `總數那一根，扣掉未滿 ${b} 分的部分，剩下上面那一截（虛線框）。`
        : '要用總數去減：把「累加到第幾組」拉到 6，疊出總數那一根。', y + 72, ok ? MUTED : RG_ROSE, 13);
    }

    const parts = fr.slice(0, j + 1).join(' + ');
    out.innerHTML = mode === 'below'
      ? `未滿 \\(${b}\\) 分：${wbrEq(`${parts} = ${cum[j]}`)}`
      : `\\(${b}\\) 分以上（含）：${wbrEq(`${N} - ${cum[j]} = ${N - cum[j]}`)}`;
    fb.innerHTML = wrapFeedback(mode === 'below'
      ? `${grpTex(SCORE_EDGES[j], b)} 分的累積次數 \\(${cum[j]}\\)，就是未滿 \\(${b}\\) 分的人數。`
      : `未滿 \\(${b}\\) 分有 \\(${cum[j]}\\) 人，全班 \\(${N}\\) 人，所以 \\(${b}\\) 分以上（含）是 \\(${N} - ${cum[j]} = ${N - cum[j]}\\) 人；也等於後面各組相加 \\(${fr.slice(j + 1).join(' + ')} = ${N - cum[j]}\\)。`);
    typeset([out, fb]);
  }

  [sk, sb].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(elById('cf-ds-group'), 'data-cf-ds', v => { ds = parseInt(v, 10); draw(); });
  bindPickGroup(elById('cf-mode-group'), 'data-cf-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 2：累積次數分配折線圖——描點工作台
   ========================================================================== */
function initCumLineCanvas() {
  const cv = elById('canvas-cumline');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = elById('cl-k'), vk = elById('cl-vk');
  const out = elById('cl-formula');
  const fb = elById('cl-feedback');
  const C = RG_TONE[1];
  let ds = 0, mode = 'cum';

  function draw() {
    const k = iv(sk);
    vk.textContent = k;
    const fr = CF_DATA[ds].f, cum = cumOf(fr), N = cum[5];
    const i = k - 1;
    const lo = SCORE_EDGES[i], hi = SCORE_EDGES[i + 1], mid = (lo + hi) / 2;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    const names = { freq: '次數分配折線圖', cum: '累積次數分配折線圖', mid: '錯誤示範：累積次數點在組中點', nozero: '錯誤示範：沒從 (40, 0) 開始' };
    const wrong = mode === 'mid' || mode === 'nozero';
    drawTitle(ctx, `${CF_DATA[ds].name}：${names[mode]}`, wrong ? RG_ROSE : C);

    const isFreq = mode === 'freq';
    const yMax = isFreq ? 10 : Math.ceil(N / 5) * 5;
    const yStep = isFreq ? 2 : 5;
    const A = rgChart(ctx, {
      L: 58, R: 515, T: 66, B: 292, xMin: 40, xMax: 100, yMax, yStep,
      xTicks: SCORE_EDGES, yLabel: isFreq ? '次數（人）' : '累積次數（人）', xLabel: '分數（分）'
    });

    // 淡淡的柱子：次數圖畫各組次數、累積圖畫各組累積次數
    for (let g = 0; g < 6; g++) {
      const v = isFreq ? fr[g] : cum[g];
      ctx.save();
      ctx.fillStyle = C;
      ctx.globalAlpha = g === i ? 0.22 : 0.09;
      ctx.fillRect(A.px(SCORE_EDGES[g]) + 1, A.py(v), A.px(SCORE_EDGES[g + 1]) - A.px(SCORE_EDGES[g]) - 2, A.B - A.py(v));
      ctx.restore();
    }

    let pts;
    if (isFreq) pts = fr.map((v, g) => [(SCORE_EDGES[g] + SCORE_EDGES[g + 1]) / 2, v]);
    else if (mode === 'cum') pts = [[40, 0]].concat(cum.map((v, g) => [SCORE_EDGES[g + 1], v]));
    else if (mode === 'mid') pts = cum.map((v, g) => [(SCORE_EDGES[g] + SCORE_EDGES[g + 1]) / 2, v]);
    else pts = cum.map((v, g) => [SCORE_EDGES[g + 1], v]);
    const lineColor = wrong ? RG_ROSE : (isFreq ? RG_TEAL : RG_PINK);
    rgLine(ctx, A, pts, lineColor, { labels: true });

    // 標出第 k 組要描的點
    const hp = isFreq ? [mid, fr[i]] : (mode === 'mid' ? [mid, cum[i]] : [hi, cum[i]]);
    rgGuide(ctx, A, hp[0], hp[1], RG_GOLD);
    ctx.save();
    ctx.strokeStyle = RG_GOLD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(A.px(hp[0]), A.py(hp[1]), 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    if (mode === 'cum') {
      ctx.save();
      ctx.strokeStyle = RG_JADE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(A.px(40), A.py(0), 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      haloText(ctx, '起點 (40, 0)', A.px(40) + 44, A.py(0) - 56, RG_JADE, f(800, 12.5));
    }

    // 下方說明
    const y = 352;
    drawPanel(ctx, 18, y - 20, W - 36, 118, wrong ? RG_ROSE : C, 0.07);
    const coord = `(${numStr(hp[0])}, ${hp[1]})`;
    let l1, l2;
    if (isFreq) {
      l1 = `第 ${k} 組 ${grpText(lo, hi)}：描 (組中點, 次數) = ${coord}`;
      l2 = '次數分配折線圖的點在組中點，各點只代表那一組自己的人數。';
    } else if (mode === 'cum') {
      l1 = `第 ${k} 組 ${grpText(lo, hi)}：描 (組上限, 累積次數) = ${coord}`;
      l2 = `累積次數 ${cum[i]} 是「未滿 ${hi} 分」的人數，所以點在上限 ${hi}。別忘了起點。`;
    } else if (mode === 'mid') {
      l1 = `錯：把累積次數 ${cum[i]} 描在組中點 ${mid}`;
      l2 = `未滿 ${hi} 分才有 ${cum[i]} 人，${mid} 分的地方還沒累積到這麼多；應該描在 (${hi}, ${cum[i]})。`;
    } else {
      l1 = '錯：折線從第一組的上限才開始';
      l2 = '未滿 40 分沒有人，要先描 (40, 0) 當起點，再接到 (50, …)。';
    }
    exLine(ctx, [T(l1, wrong ? RG_ROSE : RG_GOLD)], y + 4, 16);
    noteLines(ctx, l2, y + 52, MUTED, 13, W - 70);

    out.innerHTML = isFreq
      ? `組中點 \\(\\dfrac{${lo} + ${hi}}{2} = ${mid}\\)，描 \\((${mid}, ${fr[i]})\\)`
      : (mode === 'cum'
        ? `組上限 \\(${hi}\\)，累積次數 ${wbrEq(`${cum.slice(0, i + 1).length > 1 ? fr.slice(0, i + 1).join(' + ') + ' = ' : ''}${cum[i]}`)}，描 \\((${hi}, ${cum[i]})\\)`
        : `應描 \\((${hi}, ${cum[i]})\\)，起點 \\((40, 0)\\)`);
    fb.innerHTML = wrapFeedback(isFreq
      ? '次數分配折線圖：描 \\((\\text{組中點}, \\text{次數})\\)。'
      : (mode === 'cum'
        ? '累積次數分配折線圖：起點 \\((40, 0)\\)，其餘描 \\((\\text{組上限}, \\text{累積次數})\\)，而且折線只會往上或持平。'
        : '<span style="color:#fb7185">這是錯誤的畫法。</span>累積次數要從 \\((40, 0)\\) 開始，並描在各組的上限。'));
    typeset([out, fb]);
  }

  sk.addEventListener('input', draw);
  bindPickGroup(elById('cl-ds-group'), 'data-cl-ds', v => { ds = parseInt(v, 10); draw(); });
  bindPickGroup(elById('cl-mode-group'), 'data-cl-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 3：報讀累積次數分配折線圖——折線讀數儀（全年級 90 人）
   ⚠️ 不可以和 Q5、Q6 的資料相同
   ========================================================================== */
const CR_FREQ = [5, 9, 16, 25, 22, 13];

function initCumReadCanvas() {
  const cv = elById('canvas-cumread');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('cr-a'), sb = elById('cr-b'), sn = elById('cr-n');
  const va = elById('cr-va'), vb = elById('cr-vb'), vn = elById('cr-vn');
  const out = elById('cr-formula');
  const fb = elById('cr-feedback');
  const C = RG_TONE[2];
  const cum = cumOf(CR_FREQ), N = cum[5];
  const at = x => (x === 40 ? 0 : cum[(x - 40) / 10 - 1]);
  let mode = 'below';

  function draw() {
    const a = iv(sa), b = iv(sb), n = iv(sn);
    va.textContent = a; vb.textContent = b; vn.textContent = n;
    showRow('cr-row-a', mode !== 'rank');
    showRow('cr-row-b', mode === 'between');
    showRow('cr-row-n', mode === 'rank');
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `全年級 ${N} 人：段考數學累積次數分配折線圖`, C);
    const A = rgChart(ctx, {
      L: 58, R: 440, T: 66, B: 290, xMin: 40, xMax: 100, yMax: 90, yStep: 10,
      xTicks: SCORE_EDGES, yLabel: '累積次數（人）', xLabel: '分數（分）'
    });
    const pts = [[40, 0]].concat(cum.map((v, g) => [SCORE_EDGES[g + 1], v]));
    rgLine(ctx, A, pts, RG_PINK, { labels: true });

    const y = 352;
    let line1 = '', line2 = '', okCase = true, tex = '', fbHtml = '';
    if (mode === 'below' || mode === 'above') {
      if (a === 100) {
        okCase = false;
        line1 = `「${mode === 'below' ? '未滿 100 分' : '100 分以上（含）'}」從圖上讀不出來（情境不成立）`;
        line2 = '滿分 100 分歸在 90～100 這一組，和 90 多分的人混在一起；把 a 調回 90 以下。';
        tex = '\\text{（讀不出來）}';
        fbHtml = '<span style="color:#fb7185">滿分 \\(100\\) 分歸在 \\(90\\)～\\(100\\) 這一組，圖上分不出 \\(100\\) 分的有幾人。</span>把 \\(a\\) 調回 \\(90\\) 以下。';
      } else {
        const h = at(a);
        rgGuide(ctx, A, a, h, RG_GOLD);
        if (mode === 'below') {
          line1 = `未滿 ${a} 分 = ${a} 分處的高度 = ${h} 人`;
          line2 = '在橫軸找到 a，往上碰到折線，再往左讀高度。';
          tex = `\\text{未滿 } ${a} \\text{ 分：} ${h} \\text{ 人}`;
          fbHtml = `\\(${a}\\) 分處讀到 \\(${h}\\)，就是未滿 \\(${a}\\) 分的人數，不必再減。`;
        } else {
          rgSpan(ctx, A.R + 6, A.py(h), A.py(N), RG_GOLD, `${N - h} 人`);
          line1 = `${a} 分以上（含）= ${N} − ${h} = ${N - h} 人`;
          line2 = `${a} 分處讀到的 ${h} 是未滿 ${a} 分；用總數 ${N} 去減，才是 ${a} 分以上（含）。`;
          tex = `${N} - ${h} = ${N - h}`;
          fbHtml = `總數 \\(${N}\\) 減去未滿 \\(${a}\\) 分的 \\(${h}\\) 人，得 \\(${N - h}\\) 人。`;
        }
      }
    } else if (mode === 'between') {
      if (b <= a) {
        okCase = false;
        line1 = `b 要比 a 大（現在 a = ${a}、b = ${b}，情境不成立）`;
        line2 = '把 b 拉到比 a 大的分數，才是一段區間。';
        tex = '\\text{（情境不成立）}';
        fbHtml = `<span style="color:#fb7185">現在 \\(a = ${a}\\)、\\(b = ${b}\\)，\\(b\\) 沒有比 \\(a\\) 大，不是一段區間。</span>把 \\(b\\) 拉大一點。`;
      } else {
        const ha = at(a), hb = at(b);
        rgGuide(ctx, A, a, ha, RG_TEAL);
        rgGuide(ctx, A, b, hb, RG_GOLD);
        rgSpan(ctx, A.R + 6, A.py(ha), A.py(hb), RG_GOLD, `${hb - ha} 人`);
        line1 = `${a}～${b} 分 = ${hb} − ${ha} = ${hb - ha} 人`;
        line2 = `兩個點的高度差就是這一段的人數（含 ${a} 分、不含 ${b} 分${b === 100 ? '；滿分 100 歸在最後一組，也算進來' : ''}）。`;
        tex = `${hb} - ${ha} = ${hb - ha}`;
        fbHtml = `\\(${b}\\) 分處的 \\(${hb}\\) 減去 \\(${a}\\) 分處的 \\(${ha}\\)，得 \\(${hb - ha}\\) 人。`;
      }
    } else {
      // 第 n 名（由高分往低分數）
      let g = 5;
      while (g > 0 && N - cum[g - 1] < n) g--;
      const top = N - cum[g] + 1, bot = N - (g === 0 ? 0 : cum[g - 1]);
      const lo = SCORE_EDGES[g], hi = SCORE_EDGES[g + 1];
      const y1 = g === 0 ? 0 : cum[g - 1], y2 = cum[g];
      ctx.save();
      ctx.fillStyle = RG_GOLD;
      ctx.globalAlpha = 0.16;
      ctx.fillRect(A.px(lo), A.py(y2), A.px(hi) - A.px(lo), A.py(y1) - A.py(y2));
      ctx.restore();
      rgSpan(ctx, A.R + 6, A.py(y1), A.py(y2), RG_GOLD, `第${top}～${bot}名`);
      line1 = `第 ${n} 名在 ${grpText(lo, hi)} 分這一組`;
      line2 = `從最高分往下數：這一組有 ${y2} − ${y1} = ${y2 - y1} 人，是第 ${top}～${bot} 名。`;
      tex = `\\text{第 } ${n} \\text{ 名：} ${lo}\\text{～}${hi} \\text{ 分}`;
      fbHtml = `排名從最高分開始數。${grpTex(lo, hi)} 分有 \\(${y2} - ${y1} = ${y2 - y1}\\) 人，排在第 \\(${top}\\)～\\(${bot}\\) 名。`;
    }
    drawPanel(ctx, 18, y - 20, W - 36, 118, okCase ? C : RG_ROSE, 0.07);
    exLine(ctx, [T(line1, okCase ? RG_GOLD : RG_ROSE)], y + 4, 16);
    noteLines(ctx, line2, y + 52, MUTED, 13, W - 70);

    out.innerHTML = tex.indexOf('\\text{（') === 0 ? `\\(${tex}\\)` : wbrEq(tex);
    fb.innerHTML = wrapFeedback(fbHtml);
    typeset([out, fb]);
  }

  [sa, sb, sn].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(elById('cr-mode-group'), 'data-cr-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 4：相對次數的意義——公平秤
   ⚠️ 總人數只到 30：Q7 的 40 人、32 人都調不出來
   ========================================================================== */
function initFairCanvas() {
  const cv = elById('canvas-fair');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sat = elById('fa-at'), sap = elById('fa-ap'), sbt = elById('fa-bt'), sbp = elById('fa-bp');
  const vat = elById('fa-vat'), vap = elById('fa-vap'), vbt = elById('fa-vbt'), vbp = elById('fa-vbp');
  const out = elById('fa-formula');
  const fb = elById('fa-feedback');
  const C = RG_TONE[3];
  let mode = 'pct';

  // 及格人數不能超過總人數：總人數改了就把上限跟著改
  function syncMax(totalEl, passEl) {
    const t = iv(totalEl);
    passEl.max = t;
    if (iv(passEl) > t) passEl.value = t;
  }

  function draw() {
    syncMax(sat, sap); syncMax(sbt, sbp);
    const at = iv(sat), ap = iv(sap), bt = iv(sbt), bp = iv(sbp);
    vat.textContent = at; vap.textContent = ap; vbt.textContent = bt; vbp.textContent = bp;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'count' ? '比人數：柱高 = 及格人數' : '比百分比：兩班都是 100% 長條', C);

    const isPct = mode === 'pct';
    const A = rgChart(ctx, {
      L: 70, R: 500, T: 66, B: 290, xMin: 0, xMax: 2, yMax: isPct ? 100 : 30, yStep: isPct ? 10 : 5,
      yLabel: isPct ? '占全班（%）' : '人數（人）'
    });
    const cls = [
      { name: '甲班', t: at, p: ap, color: RG_PINK },
      { name: '乙班', t: bt, p: bp, color: RG_TEAL }
    ];
    cls.forEach((c, i) => {
      const cx = A.px(i + 0.5), bw = 110;
      const full = isPct ? 100 : c.t;
      const fill = isPct ? (100 * c.p / c.t) : c.p;
      // 外框：全班
      ctx.save();
      ctx.strokeStyle = c.color;
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.8;
      ctx.strokeRect(cx - bw / 2, A.py(full), bw, A.B - A.py(full));
      ctx.setLineDash([]);
      ctx.fillStyle = c.color;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(cx - bw / 2, A.py(fill), bw, A.B - A.py(fill));
      ctx.restore();
      textCenter(ctx, isPct ? pctText(c.p, c.t) : `${c.p} 人`, cx, A.py(fill) - 13, RG_CREAM, f(800, 15));
      textCenter(ctx, `${c.name}（${c.p}/${c.t} 人及格）`, cx, A.B + 16, c.color, f(800, 13));
      if (!isPct) textLeft(ctx, `全班 ${c.t}`, cx + bw / 2 + 6, A.py(full), c.color, f(700, 12));
    });

    // 比較結論（交叉相乘，整數比大小）
    const cntCmp = Math.sign(ap - bp);
    const pctCmp = Math.sign(ap * bt - bp * at);
    const who = s => (s > 0 ? '甲班' : (s < 0 ? '乙班' : '兩班一樣'));
    const y = 352;
    const flip = cntCmp !== 0 && pctCmp !== 0 && cntCmp !== pctCmp;
    drawPanel(ctx, 18, y - 22, W - 36, 120, flip ? RG_GOLD : C, flip ? 0.12 : 0.07);
    exLine(ctx, [T(`及格人數：${who(cntCmp)}${cntCmp === 0 ? '' : '比較多'}　｜　及格比例：${who(pctCmp)}${pctCmp === 0 ? '' : '比較高'}`, RG_CREAM)], y, 15);
    exLine(ctx, [T(`甲 ${ap} ÷ ${at} × 100% ${pctInfo(ap, at).exact ? '=' : '≈'} ${pctInfo(ap, at).s}%　　乙 ${bp} ÷ ${bt} × 100% ${pctInfo(bp, bt).exact ? '=' : '≈'} ${pctInfo(bp, bt).s}%`, MUTED)], y + 34, 14);
    noteLines(ctx, flip ? `人數多的${who(cntCmp)}，及格比例反而比較低——人數不同時，要比百分比才公平。`
      : (at === bt ? '兩班人數一樣時，比人數和比百分比的結論相同。' : '兩班人數不同，結論要以百分比為準。'),
      y + 70, flip ? RG_GOLD : MUTED, 13, W - 70);

    out.innerHTML = `${wbrEq(`\\text{甲}：\\frac{${ap}}{${at}} \\times 100\\% ${pctRelTex(ap, at)}`)}，${wbrEq(`\\text{乙}：\\frac{${bp}}{${bt}} \\times 100\\% ${pctRelTex(bp, bt)}`)}`;
    fb.innerHTML = wrapFeedback(flip
      ? `<strong style="color:#fcd34d">及格人數比較多的${who(cntCmp)}，及格比例反而比較低！</strong>總人數不同時，要比相對次數。`
      : `相對次數＝及格人數 ÷ 全班人數 × \\(100\\%\\)。${at === bt ? '兩班人數相同，比人數也可以。' : '兩班人數不同，比百分比才公平。'}`);
    typeset([out, fb]);
  }

  [sat, sap, sbt, sbp].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(elById('fa-mode-group'), 'data-fa-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 5：相對次數分配表與折線圖——換算印刷機
   ⚠️ 三份資料都避開 25% 與「70～80 占 15%」（Q9、Q10）
   ========================================================================== */
const RT_DATA = [
  { name: '20 人社團', f: [1, 3, 4, 6, 4, 2] },
  { name: '25 人班級', f: [2, 3, 6, 7, 5, 2] },
  { name: '50 人兩班合計', f: [3, 6, 9, 14, 12, 6] }
];

function initRelTableCanvas() {
  const cv = elById('canvas-reltable');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = elById('rt-k'), vk = elById('rt-vk');
  const out = elById('rt-formula');
  const fb = elById('rt-feedback');
  const C = RG_TONE[4];
  let ds = 0, mode = 'rel';

  function draw() {
    const k = iv(sk);
    vk.textContent = k;
    const fr = RT_DATA[ds].f, N = sumOf(fr);
    const rel = fr.map(v => 100 * v / N);     // 三份資料都整除
    const i = k - 1;
    const lo = SCORE_EDGES[i], hi = SCORE_EDGES[i + 1], mid = (lo + hi) / 2;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    const names = { freq: '次數分配折線圖', rel: '相對次數分配折線圖', both: '次數與相對次數：形狀一樣' };
    drawTitle(ctx, `${RT_DATA[ds].name}：${names[mode]}`, C);

    // 兩條縱軸共用同一段高度：次數軸的最大值 = 相對次數軸 40% 對應的人數
    const cMax = 0.4 * N;
    const cStep = N === 25 ? 2 : (N === 20 ? 2 : 4);
    const isRel = mode !== 'freq';
    const A = rgChart(ctx, {
      L: 58, R: mode === 'both' ? 482 : 515, T: 66, B: 286, xMin: 40, xMax: 100,
      yMax: mode === 'freq' ? cMax : 40, yStep: mode === 'freq' ? cStep : 10,
      xTicks: SCORE_EDGES, xLabel: '分數（分）',
      yLabel: mode === 'freq' ? '次數（人）' : '相對次數（%）',
      yTickColor: mode === 'freq' ? RG_TEAL : (mode === 'both' ? RG_PINK : INK),
      yLabelColor: mode === 'both' ? RG_PINK : MUTED
    });
    if (mode === 'both') rgRightAxis(ctx, A, cMax, cStep, RG_TEAL, '次數（人）');

    const ptsRel = rel.map((v, g) => [(SCORE_EDGES[g] + SCORE_EDGES[g + 1]) / 2, v]);
    const ptsCnt = fr.map((v, g) => [(SCORE_EDGES[g] + SCORE_EDGES[g + 1]) / 2, 100 * v / N]);  // 換到 % 軸的同一高度
    if (mode === 'freq') {
      const A2 = { ...A, py: yv => A.B - yv / cMax * (A.B - A.T) };
      rgLine(ctx, A2, fr.map((v, g) => [(SCORE_EDGES[g] + SCORE_EDGES[g + 1]) / 2, v]), RG_TEAL, { labels: true });
      rgGuide(ctx, A2, mid, fr[i], RG_GOLD);
    } else if (mode === 'rel') {
      rgLine(ctx, A, ptsRel, RG_PINK, { labels: true });
      rgGuide(ctx, A, mid, rel[i], RG_GOLD);
    } else {
      rgLine(ctx, A, ptsCnt, RG_TEAL, { w: 7, alpha: 0.45, r: 6.5 });
      rgLine(ctx, A, ptsRel, RG_PINK, { labels: true });
      rgGuide(ctx, A, mid, rel[i], RG_GOLD);
    }

    // 下方：相對次數小表（合計 100%）
    const y = 336;
    const cw = (W - 60) / 7;
    for (let g = 0; g < 7; g++) {
      const x = 30 + g * cw;
      const on = g === i;
      ctx.save();
      ctx.fillStyle = on ? RG_GOLD : C;
      ctx.globalAlpha = on ? 0.2 : 0.06;
      ctx.fillRect(x + 2, y, cw - 4, 58);
      ctx.restore();
      if (g < 6) {
        textCenter(ctx, grpText(SCORE_EDGES[g], SCORE_EDGES[g + 1]), x + cw / 2, y + 14, MUTED, f(600, 11.5));
        textCenter(ctx, `${fr[g]} 人`, x + cw / 2, y + 31, RG_TEAL, f(700, 13));
        textCenter(ctx, `${numStr(rel[g])}%`, x + cw / 2, y + 48, RG_PINK, f(800, 14));
      } else {
        textCenter(ctx, '合計', x + cw / 2, y + 14, MUTED, f(600, 11.5));
        textCenter(ctx, `${N} 人`, x + cw / 2, y + 31, RG_TEAL, f(700, 13));
        textCenter(ctx, '100%', x + cw / 2, y + 48, RG_JADE, f(800, 14));
      }
    }
    const y2 = 428;
    drawPanel(ctx, 18, y2 - 22, W - 36, 50, C, 0.07);
    exLine(ctx, [T(`第 ${k} 組：`, INK), FR(fr[i], N, RG_CREAM), T('× 100% =', RG_CREAM), T(`${numStr(rel[i])}%`, RG_GOLD),
      T(`→ 描 (${mid}, ${numStr(rel[i])})`, MUTED)], y2 + 2, 17);

    out.innerHTML = `${grpTex(lo, hi)} 分：${wbrEq(`\\frac{${fr[i]}}{${N}} \\times 100\\% = ${numStr(rel[i])}\\%`)}`;
    fb.innerHTML = wrapFeedback(mode === 'both'
      ? '粗的藍綠線是次數（右軸）、細的粉紅線是相對次數（左軸）：兩條線<strong>完全重疊</strong>，只是刻度不同。'
      : `相對次數折線圖描 \\((\\text{組中點}, \\text{相對次數})\\)，第 \\(${k}\\) 組是 \\((${mid}, ${numStr(rel[i])})\\)。所有組加起來是 \\(100\\%\\)。`);
    typeset([out, fb]);
  }

  sk.addEventListener('input', draw);
  bindPickGroup(elById('rt-ds-group'), 'data-rt-ds', v => { ds = parseInt(v, 10); draw(); });
  bindPickGroup(elById('rt-mode-group'), 'data-rt-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 6：相對次數與人數互換——百格換算板
   ⚠️ 百分比只到 10 的倍數、總人數只到 300：Q11（35%）、Q12（400 人、35%、45%）都調不出來
   ========================================================================== */
function initConvertCanvas() {
  const cv = elById('canvas-convert');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sN = elById('cv-N'), sp = elById('cv-p');
  const vN = elById('cv-vN'), vp = elById('cv-vp');
  const out = elById('cv-formula');
  const fb = elById('cv-feedback');
  const C = RG_TONE[5];
  let mode = 'count';

  function draw() {
    const N = iv(sN), p = iv(sp);
    vN.textContent = N; vp.textContent = p;
    const n = N * p / 100;               // N 是 20 的倍數、p 是 10 的倍數，必為整數
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'count' ? '已知總人數，求這一組的人數' : '已知這一組的人數，求總人數', C);

    // 10 × 10 百格板：一格 = 1%
    const g0x = 34, g0y = 56, cell = 21;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const idx = r * 10 + c;
        ctx.save();
        ctx.fillStyle = idx < p ? RG_PINK : 'rgba(255,255,255,0.06)';
        ctx.globalAlpha = idx < p ? 0.85 : 1;
        ctx.fillRect(g0x + c * cell + 1, g0y + r * cell + 1, cell - 2, cell - 2);
        ctx.restore();
      }
    }
    ctx.save();
    ctx.strokeStyle = RG_TEAL;
    ctx.lineWidth = 2;
    ctx.strokeRect(g0x, g0y, cell * 10, cell * 10);
    ctx.restore();
    textCenter(ctx, '100 格 = 全體 100%', g0x + cell * 5, g0y + cell * 10 + 16, RG_TEAL, f(700, 13));

    // 右側：已知與要求
    const rx = 290;
    const known = mode === 'count'
      ? [['總人數', `${N} 人`, RG_TEAL], ['這一組占', `${p}%`, RG_PINK]]
      : [['這一組', `${n} 人`, RG_PINK], ['占全體', `${p}%`, RG_PINK]];
    textLeft(ctx, '已知', rx, 72, MUTED, f(800, 14));
    known.forEach((kv, i) => {
      textLeft(ctx, kv[0], rx, 102 + i * 30, INK, f(700, 15));
      textLeft(ctx, kv[1], rx + 110, 102 + i * 30, kv[2], f(800, 17));
    });
    textLeft(ctx, '要求', rx, 176, MUTED, f(800, 14));
    textLeft(ctx, mode === 'count' ? '這一組的人數' : '總人數', rx, 204, RG_GOLD, f(800, 17));
    textLeft(ctx, `每一格代表 ${numStr(N / 100)} 人`, rx, 246, MUTED, f(600, 13));

    const y = 318;
    drawPanel(ctx, 18, y - 22, W - 36, 152, C, 0.07);
    if (mode === 'count') {
      exLine(ctx, [T('人數 = 總人數 × 相對次數', INK)], y, 16);
      exLine(ctx, [T(`${N} × ${p}% = ${N} ×`, RG_CREAM), FR(p, 100, RG_CREAM), T(`= ${n} 人`, RG_GOLD)], y + 44, 18);
      noteLines(ctx, `檢查：${n} 人比總人數 ${N} 少，方向對。`, y + 96, MUTED, 13);
    } else {
      exLine(ctx, [T('總人數 = 人數 ÷ 相對次數', INK)], y, 16);
      exLine(ctx, [T(`${n} ÷ ${p}% = ${n} ×`, RG_CREAM), FR(100, p, RG_CREAM), T(`= ${N} 人`, RG_GOLD)], y + 44, 18);
      noteLines(ctx, `檢查：${p} 格是 ${n} 人，100 格就是 ${N} 人，比這一組多，方向對。`, y + 96, MUTED, 13);
    }

    out.innerHTML = mode === 'count'
      ? wbrEq(`${N} \\times ${p}\\% = ${n}`)
      : wbrEq(`${n} \\div ${p}\\% = ${N}`);
    fb.innerHTML = wrapFeedback(mode === 'count'
      ? `已知總人數用<strong>乘</strong>：\\(${N} \\times ${p}\\% = ${n}\\) 人。`
      : `已知人數求總數用<strong>除</strong>：\\(${n} \\div ${p}\\% = ${N}\\) 人；用乘的會得到 \\(${numStr(n * p / 100)}\\)，比 \\(${n}\\) 還小，一定不對。`);
    typeset([out, fb]);
  }

  [sN, sp].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(elById('cv-mode-group'), 'data-cv-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 7：累積相對次數分配表的兩種方法——兩條路的累加表
   ⚠️ 不可以和 Q13（a = 84）、Q14（10、20、30、40）的數字相同
   ========================================================================== */
const TW_DATA = [
  { name: '立定跳遠（公分）', edges: [120, 140, 160, 180, 200, 220, 240], f: [2, 6, 8, 12, 10, 2] },
  { name: '一分鐘跳繩（下）', edges: [60, 80, 100, 120, 140, 160, 180], f: [1, 2, 4, 6, 5, 2] },
  { name: '一分鐘仰臥起坐（次）', edges: [20, 25, 30, 35, 40, 45, 50], f: [1, 3, 4, 8, 6, 3] }
];

function initTwoWaysCanvas() {
  const cv = elById('canvas-twoways');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = elById('tw-k'), vk = elById('tw-vk');
  const out = elById('tw-formula');
  const fb = elById('tw-feedback');
  const C = RG_TONE[6];
  let ds = 0, mode = 'm1';

  function draw() {
    const k = iv(sk);
    vk.textContent = k;
    const D = TW_DATA[ds], fr = D.f, N = sumOf(fr);
    const cum = cumOf(fr);
    const rel = fr.map(v => 100 * v / N);
    const crel = cum.map(v => 100 * v / N);
    const i = k - 1;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `${D.name}，共 ${N} 人：${mode === 'm1' ? '方法一' : '方法二'}`, C);

    // 表格：組別｜次數｜累積次數｜相對次數｜累積相對次數
    const cols = [104, 76, 98, 104, 122];
    const heads = ['組別', '次數', '累積次數', '相對次數(%)', '累積相對(%)'];
    const x0 = 18, y0 = 48, rh = 32;
    const colX = [];
    let xx = x0;
    cols.forEach(w => { colX.push(xx); xx += w; });
    // 方法一用不到累積次數欄、方法二用不到相對次數欄：淡化
    const dimCol = mode === 'm1' ? 2 : 3;
    heads.forEach((h, c) => {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(colX[c] + 1, y0, cols[c] - 2, rh - 2);
      ctx.restore();
      textCenter(ctx, h, colX[c] + cols[c] / 2, y0 + rh / 2, c === dimCol ? DIM : RG_CREAM, f(800, 12.5));
    });
    const srcCells = mode === 'm1' ? [[i, 3], [i - 1, 4]] : [[i, 2]];
    for (let r = 0; r < 6; r++) {
      const ry = y0 + rh * (r + 1);
      const vals = [grpText(D.edges[r], D.edges[r + 1]), String(fr[r]), String(cum[r]), numStr(rel[r]),
        r <= i ? numStr(crel[r]) : ''];
      vals.forEach((v, c) => {
        const isSrc = srcCells.some(sc => sc[0] === r && sc[1] === c);
        const isOut = r === i && c === 4;
        ctx.save();
        ctx.fillStyle = isOut ? RG_GOLD : (isSrc ? RG_TEAL : 'rgba(255,255,255,0.03)');
        ctx.globalAlpha = isOut ? 0.28 : (isSrc ? 0.25 : 1);
        ctx.fillRect(colX[c] + 1, ry + 1, cols[c] - 2, rh - 2);
        ctx.restore();
        const color = c === dimCol ? DIM : (isOut ? RG_GOLD : (c === 4 ? RG_PINK : INK));
        textCenter(ctx, v, colX[c] + cols[c] / 2, ry + rh / 2, color, f(c === 4 ? 800 : 600, 14));
      });
    }
    const ty = y0 + rh * 7;
    textCenter(ctx, '合計', colX[0] + cols[0] / 2, ty + rh / 2, MUTED, f(700, 13));
    textCenter(ctx, String(N), colX[1] + cols[1] / 2, ty + rh / 2, MUTED, f(700, 13));
    textCenter(ctx, '100', colX[3] + cols[3] / 2, ty + rh / 2, dimCol === 3 ? DIM : MUTED, f(700, 13));

    // 下方：這一列怎麼算
    const y = 330;
    drawPanel(ctx, 18, y - 24, W - 36, 140, C, 0.07);
    if (mode === 'm1') {
      textCenter(ctx, '方法一：上一組的累積相對次數 ＋ 這一組的相對次數', W / 2, y - 2, INK, f(700, 14));
      exLine(ctx, i === 0
        ? [T(`第 1 組：累積相對次數 = 相對次數 = ${numStr(rel[0])}%`, RG_GOLD)]
        : [T(`${numStr(crel[i - 1])}% + ${numStr(rel[i])}% =`, RG_CREAM), T(`${numStr(crel[i])}%`, RG_GOLD)], y + 38, 19);
    } else {
      textCenter(ctx, '方法二：這一組的累積次數 ÷ 總次數 × 100%', W / 2, y - 2, INK, f(700, 14));
      exLine(ctx, [FR(cum[i], N, RG_CREAM), T('× 100% =', RG_CREAM), T(`${numStr(crel[i])}%`, RG_GOLD)], y + 42, 19);
    }
    const other = mode === 'm1'
      ? `另一條路：${cum[i]} ÷ ${N} × 100% 也是 ${numStr(crel[i])}%`
      : `另一條路：相對次數一路加到第 ${k} 組，也是 ${numStr(crel[i])}%`;
    noteLines(ctx, other, y + 90, RG_JADE, 13);

    out.innerHTML = mode === 'm1'
      ? (i === 0 ? `\\(${numStr(crel[0])}\\%\\)` : wbrEq(`${numStr(crel[i - 1])}\\% + ${numStr(rel[i])}\\% = ${numStr(crel[i])}\\%`))
      : wbrEq(`\\frac{${cum[i]}}{${N}} \\times 100\\% = ${numStr(crel[i])}\\%`);
    fb.innerHTML = wrapFeedback(mode === 'm1'
      ? '方法一：次數 → 相對次數 → 把相對次數依序累加。'
      : '方法二：次數 → 累積次數 → 每一組都除以總次數再乘以 \\(100\\%\\)。');
    typeset([out, fb]);
  }

  sk.addEventListener('input', draw);
  bindPickGroup(elById('tw-ds-group'), 'data-tw-ds', v => { ds = parseInt(v, 10); draw(); });
  bindPickGroup(elById('tw-mode-group'), 'data-tw-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 8：累積相對次數折線圖與相對位置——相對位置尺
   ⚠️ 總人數只到 120、80 分處是 90%：Q15（160 人、75%）調不出來
   ========================================================================== */
const PS_CREL = [0, 5, 15, 40, 70, 90, 100];   // 40, 50, …, 100 分處

function initPositionCanvas() {
  const cv = elById('canvas-position');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('ps-a'), sN = elById('ps-N');
  const va = elById('ps-va'), vN = elById('ps-vN');
  const out = elById('ps-formula');
  const fb = elById('ps-feedback');
  const C = RG_TONE[7];
  let mode = 'below';

  function draw() {
    const a = iv(sa), N = iv(sN);
    va.textContent = a; vN.textContent = N;
    const h = PS_CREL[(a - 40) / 10];
    const below = N * h / 100;            // N 是 20 的倍數、h 是 5 的倍數，必為整數
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `全年級 ${N} 人：模擬考累積相對次數分配折線圖`, C);
    const A = rgChart(ctx, {
      L: 58, R: 470, T: 66, B: 280, xMin: 40, xMax: 100, yMax: 100, yStep: 10,
      xTicks: SCORE_EDGES, yLabel: '累積相對次數（%）', xLabel: '分數（分）'
    });
    rgLine(ctx, A, PS_CREL.map((v, g) => [SCORE_EDGES[g], v]), RG_PINK, { labels: true });
    rgGuide(ctx, A, a, h, RG_GOLD);
    if (mode === 'above') rgSpan(ctx, A.R + 6, A.py(h), A.py(100), RG_GOLD, `${100 - h}%`);
    else rgSpan(ctx, A.R + 6, A.py(0), A.py(h), RG_GOLD, `${h}%`);

    // 人數長條：N 人按比例切成「未滿 a」與「a 以上（含）」
    const by = 330, bx = 40, bw = W - 80;
    const cut = bx + bw * h / 100;
    ctx.save();
    ctx.fillStyle = RG_TEAL;
    ctx.globalAlpha = mode === 'above' ? 0.25 : 0.75;
    ctx.fillRect(bx, by, cut - bx, 26);
    ctx.fillStyle = RG_PINK;
    ctx.globalAlpha = mode === 'above' ? 0.75 : 0.25;
    ctx.fillRect(cut, by, bx + bw - cut, 26);
    ctx.restore();
    if (h > 12) textCenter(ctx, `未滿 ${a}：${below} 人`, (bx + cut) / 2, by + 13, RG_CREAM, f(800, 13));
    if (100 - h > 12) textCenter(ctx, `${a} 以上（含）：${N - below} 人`, (cut + bx + bw) / 2, by + 13, RG_CREAM, f(800, 13));
    textLeft(ctx, `全體 ${N} 人`, bx, by - 10, MUTED, f(700, 12));

    const y = 396;
    drawPanel(ctx, 18, y - 22, W - 36, 90, C, 0.07);
    let l1, l2, tex, fbHtml;
    if (mode === 'below') {
      l1 = `${a} 分處的高度 ${h}% = 未滿 ${a} 分的人占全體的百分比`;
      l2 = '直接讀高度，不必換算。';
      tex = `\\text{未滿 } ${a} \\text{ 分：} ${h}\\%`;
      fbHtml = `\\(${a}\\) 分處讀到 \\(${h}\\%\\)，就是未滿 \\(${a}\\) 分的人占全體的百分比。`;
    } else if (mode === 'above') {
      l1 = `${a} 分以上（含）= 100% − ${h}% = ${100 - h}%`;
      l2 = `換成人數：${N} × ${100 - h}% = ${N - below} 人`;
      tex = `100\\% - ${h}\\% = ${100 - h}\\%`;
      fbHtml = `\\(100\\% - ${h}\\% = ${100 - h}\\%\\)，人數是 \\(${N} \\times ${100 - h}\\% = ${N - below}\\) 人。`;
    } else {
      l1 = `考 ${a} 分（只有他）：比他低分的占 ${h}%`;
      l2 = `贏過 ${N} × ${h}% = ${below} 人`;
      tex = `${N} \\times ${h}\\% = ${below}`;
      fbHtml = `比他低分的人就是未滿 \\(${a}\\) 分的人：\\(${N} \\times ${h}\\% = ${below}\\) 人；\\(${a}\\) 分以上（含）的人不算在內。`;
    }
    exLine(ctx, [T(l1, RG_GOLD)], y, 15);
    exLine(ctx, [T(l2, RG_CREAM)], y + 36, 15);

    out.innerHTML = wbrEq(tex);
    fb.innerHTML = wrapFeedback(fbHtml);
    typeset([out, fb]);
  }

  [sa, sN].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(elById('ps-mode-group'), 'data-ps-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 9：比較兩群資料——雙色套印比較台
   ⚠️ 不可以和 Q17、Q18 的兩組折線相同
   ========================================================================== */
const CP_DATA = [
  {
    name: '兩班英語成績', unit: '分', edges: [40, 50, 60, 70, 80, 90, 100], xLabel: '分數（分）',
    a: { name: '甲班', y: [0, 5, 15, 15, 50, 85, 100] },
    b: { name: '乙班', y: [0, 10, 25, 45, 75, 100, 100] }
  },
  {
    name: '兩校每週運動時數', unit: '小時', edges: [0, 2, 4, 6, 8, 10, 12], xLabel: '時數（小時）',
    a: { name: '甲校', y: [0, 10, 35, 60, 80, 95, 100] },
    b: { name: '乙校', y: [0, 20, 30, 30, 70, 100, 100] }
  }
];

function initCompareCanvas() {
  const cv = elById('canvas-compare');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = elById('cp-k'), sa = elById('cp-a');
  const vk = elById('cp-vk'), va = elById('cp-va');
  const out = elById('cp-formula');
  const fb = elById('cp-feedback');
  const C = RG_TONE[8];
  let pair = 0, mode = 'group';

  function draw() {
    const k = iv(sk), ai = iv(sa);
    const P = CP_DATA[pair], E = P.edges;
    vk.textContent = k;
    va.textContent = E[ai];
    showRow('cp-row-k', mode === 'group');
    showRow('cp-row-a', mode === 'above');
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `${P.name}：累積相對次數分配折線圖`, C);
    const A = rgChart(ctx, {
      L: 58, R: 420, T: 66, B: 282, xMin: E[0], xMax: E[6], yMax: 100, yStep: 10,
      xTicks: E, yLabel: '累積相對次數（%）', xLabel: P.xLabel
    });
    const ptsA = P.a.y.map((v, g) => [E[g], v]);
    const ptsB = P.b.y.map((v, g) => [E[g], v]);
    rgLine(ctx, A, ptsB, RG_TEAL, { labels: true, labelDy: 14, labelDx: 12 });
    rgLine(ctx, A, ptsA, RG_PINK, { labels: true, labelDy: -12, labelDx: -12 });
    // 圖例
    [[P.a.name, RG_PINK], [P.b.name, RG_TEAL]].forEach((lg, i) => {
      const x = A.L + 14, y = A.T + 2 + i * 20;
      ctx.save();
      ctx.strokeStyle = lg[1];
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 22, y);
      ctx.stroke();
      ctx.restore();
      textLeft(ctx, lg[0], x + 28, y, lg[1], f(800, 13));
    });

    const y = 352;
    let l1, l2, tex, fbHtml;
    if (mode === 'group') {
      const lo = E[k - 1], hi = E[k];
      const ra = P.a.y[k] - P.a.y[k - 1], rb = P.b.y[k] - P.b.y[k - 1];
      // 兩條線在這一段加粗
      [[P.a.y, RG_PINK, -1], [P.b.y, RG_TEAL, 1]].forEach(s => {
        ctx.save();
        ctx.strokeStyle = s[1];
        ctx.lineWidth = 7;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(A.px(lo), A.py(s[0][k - 1]));
        ctx.lineTo(A.px(hi), A.py(s[0][k]));
        ctx.stroke();
        ctx.restore();
      });
      rgSpan(ctx, A.R + 8, A.py(P.a.y[k - 1]), A.py(P.a.y[k]), RG_PINK, '');
      rgSpan(ctx, A.R + 22, A.py(P.b.y[k - 1]), A.py(P.b.y[k]), RG_TEAL, '');
      sideLabels(ctx, A.R + 36, [
        { y: (A.py(P.a.y[k - 1]) + A.py(P.a.y[k])) / 2, text: `${P.a.name} ${ra}%`, color: RG_PINK },
        { y: (A.py(P.b.y[k - 1]) + A.py(P.b.y[k])) / 2, text: `${P.b.name} ${rb}%`, color: RG_TEAL }
      ], A.T, A.B);
      const flat = [ra === 0 ? P.a.name : null, rb === 0 ? P.b.name : null].filter(Boolean);
      l1 = `${grpText(lo, hi)} ${P.unit}：${P.a.name} ${P.a.y[k]} − ${P.a.y[k - 1]} = ${ra}%　${P.b.name} ${P.b.y[k]} − ${P.b.y[k - 1]} = ${rb}%`;
      l2 = flat.length
        ? `${flat.join('、')}在這一段是水平線：這一組的相對次數是 0%，沒有人。`
        : (ra === rb ? '兩群這一組的相對次數一樣。' : `這一組的相對次數，${ra > rb ? P.a.name : P.b.name}比較大。`);
      tex = `\\text{${P.a.name}}：${P.a.y[k]}\\% - ${P.a.y[k - 1]}\\% = ${ra}\\%`;
      fbHtml = `${grpTex(lo, hi)} ${P.unit}：${P.a.name} \\(${P.a.y[k]}\\% - ${P.a.y[k - 1]}\\% = ${ra}\\%\\)，${P.b.name} \\(${P.b.y[k]}\\% - ${P.b.y[k - 1]}\\% = ${rb}\\%\\)。要比的是<strong>高度差</strong>，不是兩點的高度。`;
      out.innerHTML = `${wbrEq(tex)}，${wbrEq(`\\text{${P.b.name}}：${P.b.y[k]}\\% - ${P.b.y[k - 1]}\\% = ${rb}\\%`)}`;
    } else {
      const av = E[ai];
      const ha = P.a.y[ai], hb = P.b.y[ai];
      rgGuide(ctx, A, av, Math.max(ha, hb), RG_GOLD, true, false);
      rgSpan(ctx, A.R + 8, A.py(ha), A.py(100), RG_PINK, '');
      rgSpan(ctx, A.R + 22, A.py(hb), A.py(100), RG_TEAL, '');
      sideLabels(ctx, A.R + 36, [
        { y: (A.py(ha) + A.py(100)) / 2, text: `${P.a.name} ${100 - ha}%`, color: RG_PINK },
        { y: (A.py(hb) + A.py(100)) / 2, text: `${P.b.name} ${100 - hb}%`, color: RG_TEAL }
      ], A.T, A.B);
      l1 = `${av} ${P.unit}以上（含）：${P.a.name} 100 − ${ha} = ${100 - ha}%　${P.b.name} 100 − ${hb} = ${100 - hb}%`;
      l2 = ha === hb ? '兩條線在這裡一樣高，比例相同。'
        : `${av} ${P.unit}處折線比較低的${ha < hb ? P.a.name : P.b.name}，${av} ${P.unit}以上（含）的比例比較高。`;
      tex = `\\text{${P.a.name}}：100\\% - ${ha}\\% = ${100 - ha}\\%`;
      fbHtml = `\\(${av}\\) ${P.unit}以上（含）＝\\(100\\%\\) 減去 \\(${av}\\) ${P.unit}處的高度：${P.a.name} \\(${100 - ha}\\%\\)、${P.b.name} \\(${100 - hb}\\%\\)。`;
      out.innerHTML = `${wbrEq(tex)}，${wbrEq(`\\text{${P.b.name}}：100\\% - ${hb}\\% = ${100 - hb}\\%`)}`;
    }
    // 最大值在哪一群
    const fullA = P.a.y.indexOf(100), fullB = P.b.y.indexOf(100);
    const maxNote = fullA === fullB ? '兩群都在最後一個分界才到 100%。'
      : `${fullA < fullB ? P.a.name : P.b.name}比較早到 100%，最大的那筆資料在${fullA < fullB ? P.b.name : P.a.name}。`;

    drawPanel(ctx, 18, y - 22, W - 36, 120, C, 0.07);
    noteLines(ctx, l1, y + 4, RG_GOLD, 14, W - 60);
    noteLines(ctx, l2, y + 46, RG_CREAM, 13, W - 60);
    noteLines(ctx, maxNote, y + 76, MUTED, 13, W - 60);

    fb.innerHTML = wrapFeedback(fbHtml);
    typeset([out, fb]);
  }

  [sk, sa].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(elById('cp-pair-group'), 'data-cp-pair', v => { pair = parseInt(v, 10); draw(); });
  bindPickGroup(elById('cp-mode-group'), 'data-cp-mode', v => { mode = v; draw(); });
  draw();
}
