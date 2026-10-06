/* ==========================================================================
   4-2-1（第四冊 2-1）函數與函數圖形 — 互動 Canvas 與隨堂評量
   畫風：復古鐵皮玩具小鎮（昭和錫製玩具；小鈴、阿扣），第 2 章只有這一節。
   配色：玩具紅 TT_RED、鐵皮藍 TT_BLUE、黃銅 TT_YEL、奶油 TT_CREAM；
   薄荷綠 TT_OK 是「符合、答案」，玫瑰 TT_NO 是「不符合、錯誤」。

   共用工具在 ../math-canvas.js（T／IT／SEQ／GRP／FR／VF／measure／drawExpr／
   drawPanel／drawTitle／drawStepRows／drawPlane／drawDot／wbrEq／q 有理數…），
   本檔只放本節的色票（TT_ 前綴，共用檔與其他節都沒有）、線型函數小工具與
   12 個互動。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initMachineCanvas();
  initMapCanvas();
  initKindCanvas();
  initValueCanvas();
  initEqualCanvas();
  initTwoCanvas();
  initApplyCanvas();
  initPlotCanvas();
  initLineCanvas();
  initHorizCanvas();
  initReadCanvas();
  initCompareCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具（TT_ = Tin Toy）
   ========================================================================== */

const TT_RED = '#fca5a5';
const TT_BLUE = '#93c5fd';
const TT_YEL = '#fde047';
const TT_CREAM = '#fef3c7';
const TT_OK = '#86efac';
const TT_NO = '#fb7185';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const TT_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9', '#fca5a5'];

function ttEl(id) {
  return document.getElementById(id);
}

function ttIv(el) {
  return parseInt(el.value, 10);
}

// canvas 上的減號換成數學減號 −，投影時比連字號清楚
function ttMn(s) {
  return String(s).replace(/-/g, '−');
}

// 一列推導（drawStepRows 的列）
function ttRow(name, hint, items, color) {
  return { name, hint, items, color };
}

// 步驟列重新編號（列數隨情形改變，不要寫死）
function ttNumber(rows) {
  const marks = ['①', '②', '③', '④', '⑤', '⑥'];
  rows.forEach((r, i) => { r.name = marks[i] + ' ' + r.name; });
  return rows;
}

// 有理數 → 有限小數字串（分母只有 2、5 的因數時）；不是有限小數回 null
function ttDec(q) {
  const r = reduce(q[0], q[1]);
  let k = 0;
  while (k < 8 && Math.pow(10, k) % r[1] !== 0) k++;
  if (Math.pow(10, k) % r[1] !== 0) return null;
  const n = r[0] * (Math.pow(10, k) / r[1]);
  let s = String(Math.abs(n));
  if (k > 0) {
    while (s.length < k + 1) s = '0' + s;
    s = s.slice(0, s.length - k) + '.' + s.slice(s.length - k);
  }
  return (n < 0 ? '-' : '') + s;
}

/* --------------------------------------------------------------------------
   線型函數 y = ax + b（a、b 為有理數 [分子, 分母]）
   -------------------------------------------------------------------------- */

// 等號右邊的 LaTeX
function ttLinTex(a, b, v) {
  const x = v || 'x';
  let s = '';
  if (a[0] !== 0) {
    const abs = [Math.abs(a[0]), a[1]];
    const c = (abs[0] === 1 && abs[1] === 1) ? '' : qTex(abs);
    s = (a[0] < 0 ? '-' : '') + c + x;
  }
  if (!s) return qTex(b);
  if (b[0] !== 0) s += (b[0] < 0 ? ' - ' : ' + ') + qTex([Math.abs(b[0]), b[1]]);
  return s;
}

// 等號右邊的 canvas 元件
function ttLinItems(a, b, color, v) {
  const x = v || 'x';
  const out = [];
  if (a[0] !== 0) {
    const abs = [Math.abs(a[0]), a[1]];
    const body = (abs[0] === 1 && abs[1] === 1) ? IT(x, color) : SEQ([qIt(abs, color), IT(x, color)], color, 2);
    out.push(a[0] < 0 ? SEQ([T('−', color), body], color, 1) : body);
  }
  if (!out.length) return [qIt(b, color)];
  if (b[0] !== 0) {
    out.push(T(b[0] < 0 ? '−' : '+', color));
    out.push(qIt([Math.abs(b[0]), b[1]], color));
  }
  return out;
}

// 「y = ax + b」整條
function ttFnItems(a, b, color) {
  return [IT('y', color), T('=', color)].concat(ttLinItems(a, b, color));
}

function ttEval(a, b, x) {
  return qAdd(qMul(a, x), b);
}

// 代入 x 之後的式子（LaTeX）：a × (x) + b
function ttSubTex(a, b, x) {
  if (a[0] === 0) return qTex(b);
  const xt = (x[0] < 0 || x[1] !== 1) ? `\\left(${qTex(x)}\\right)` : qTex(x);
  let s;
  if (a[0] === 1 && a[1] === 1) s = qTex(x);
  else if (a[0] === -1 && a[1] === 1) s = `-${xt}`;
  else s = `${qTex(a)} \\times ${xt}`;
  if (b[0] !== 0) s += (b[0] < 0 ? ' - ' : ' + ') + qTex([Math.abs(b[0]), b[1]]);
  return s;
}

// 同一件事的 canvas 元件
function ttSubItems(a, b, x, color) {
  if (a[0] === 0) return [qIt(b, color)];
  const xi = (x[0] < 0 || x[1] !== 1) ? GRP([qIt(x, color)], '()', color) : qIt(x, color);
  const out = [];
  if (a[0] === 1 && a[1] === 1) out.push(qIt(x, color));
  else if (a[0] === -1 && a[1] === 1) out.push(SEQ([T('−', color), xi], color, 1));
  else { out.push(qIt(a, color)); out.push(T('×', color)); out.push(xi); }
  if (b[0] !== 0) {
    out.push(T(b[0] < 0 ? '−' : '+', color));
    out.push(qIt([Math.abs(b[0]), b[1]], color));
  }
  return out;
}

// 乘完之後、還沒加 b 的那一步：(ax) + b
function ttMidTex(p, b) {
  if (b[0] === 0) return qTex(p);
  return qTex(p) + (b[0] < 0 ? ' - ' : ' + ') + qTex([Math.abs(b[0]), b[1]]);
}

function ttMidItems(p, b, color) {
  const out = [qIt(p, color)];
  if (b[0] !== 0) {
    out.push(T(b[0] < 0 ? '−' : '+', color));
    out.push(qIt([Math.abs(b[0]), b[1]], color));
  }
  return out;
}

// 坐標 (x, y) 的字串（canvas 純文字）
function ttPt(x, y) {
  return `(${ttMn(x)}, ${ttMn(y)})`;
}

// 「ka」這種係數乘字母的字串（parseExpr 用）：1 → a、−1 → −a、0 → ''
function ttCoefStr(c, v) {
  if (c === 0) return '';
  if (c === 1) return v;
  if (c === -1) return '-' + v;
  return c + v;
}

// 「c·a + b」的字串（parseExpr 用）
function ttAbStr(c) {
  const head = ttCoefStr(c, 'a');
  return head ? head + ' + b' : 'b';
}

/* --------------------------------------------------------------------------
   繪圖
   -------------------------------------------------------------------------- */

// 實心三角形箭頭（共用檔的 drawArrow 太細，投影看不見，開發約束 34）
function ttHead(ctx, x, y, ang, color, size) {
  const s = size || 10;
  const w = s * 0.55;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - s * Math.cos(ang) + w * Math.sin(ang), y - s * Math.sin(ang) - w * Math.cos(ang));
  ctx.lineTo(x - s * Math.cos(ang) - w * Math.sin(ang), y - s * Math.sin(ang) + w * Math.cos(ang));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function ttLine(ctx, x1, y1, x2, y2, color, width, dash) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 2;
  ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

// 帶實心箭頭的直線
function ttArrow(ctx, x1, y1, x2, y2, color, width) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ttLine(ctx, x1, y1, x2 - 8 * Math.cos(ang), y2 - 8 * Math.sin(ang), color, width || 2.2);
  ttHead(ctx, x2, y2, ang, color, 11);
}

// 一塊鐵皮招牌：圓角板加四顆鉚釘
function ttPlate(ctx, x, y, w, h, color, alpha) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 10);
  ctx.globalAlpha = alpha == null ? 0.14 : alpha;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.fillStyle = color;
  [[x + 8, y + 8], [x + w - 8, y + 8], [x + 8, y + h - 8], [x + w - 8, y + h - 8]].forEach(p => {
    ctx.beginPath();
    ctx.arc(p[0], p[1], 2.4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

/**
 * 第一象限的函數圖座標軸（刻度可以不是 1）。依〈開發約束 34〉只在正向那端畫箭頭。
 * c：{ L, T, W, H, xmin, xmax, ymin, ymax, xstep, ystep, xlab, ylab, brk }
 *   brk 為 true 時縱軸從 ymin 起算，在原點上方畫一個省略的折線記號
 */
function ttAxes(ctx, c) {
  const px = v => c.L + (v - c.xmin) / (c.xmax - c.xmin) * c.W;
  const py = v => c.T + c.H - (v - c.ymin) / (c.ymax - c.ymin) * c.H;
  const by = c.T + c.H + (c.brk ? 14 : 0);   // 橫軸所在的高度
  ctx.save();
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.13)';
  ctx.lineWidth = 1;
  for (let v = c.xmin + c.xstep; v <= c.xmax + 1e-9; v += c.xstep) {
    ctx.beginPath(); ctx.moveTo(px(v), c.T); ctx.lineTo(px(v), by); ctx.stroke();
  }
  for (let v = c.ymin + (c.brk ? 0 : c.ystep); v <= c.ymax + 1e-9; v += c.ystep) {
    ctx.beginPath(); ctx.moveTo(c.L, py(v)); ctx.lineTo(c.L + c.W, py(v)); ctx.stroke();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(c.L, by); ctx.lineTo(c.L + c.W + 12, by); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(c.L, by); ctx.lineTo(c.L, c.T - 14); ctx.stroke();
  axisArrow(ctx, c.L + c.W + 10, by, 'right', INK);
  axisArrow(ctx, c.L, c.T - 12, 'up', INK);
  if (c.brk) {
    // 縱軸省略記號：在橫軸與 ymin 之間把軸線斷開，畫兩道斜線
    ctx.clearRect(c.L - 3, by - 10, 6, 6);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.L - 7, by - 7); ctx.lineTo(c.L + 7, by - 11);
    ctx.moveTo(c.L - 7, by - 3); ctx.lineTo(c.L + 7, by - 7);
    ctx.stroke();
  }
  ctx.fillStyle = MUTED;
  ctx.font = f(600, 12.5);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let v = c.xmin + c.xstep; v <= c.xmax + 1e-9; v += c.xstep) {
    if (!(c.skipLast && v > c.xmax - c.xstep / 2)) ctx.fillText(String(v), px(v), by + 5);
  }
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let v = c.ymin + (c.brk ? 0 : c.ystep); v <= c.ymax + 1e-9; v += c.ystep) {
    ctx.fillText(String(v), c.L - 7, py(v));
  }
  if (!c.brk && c.xmin === 0 && c.ymin === 0) {
    ctx.font = fi(700, 13);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('O', c.L - 5, by + 4);
  }
  ctx.fillStyle = INK;
  ctx.font = f(700, 13);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(c.xlab, c.L + c.W + 14, by + 22);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(c.ylab, c.L + 10, c.T - 14);
  ctx.restore();
  return { px, py, by };
}

// 直線 y = ax + b 在 [min, max] 方框內的兩個端點（單位坐標）；碰不到方框回 null
function ttClip(a, b, min, max) {
  const pts = [];
  const add = (x, y) => {
    if (x >= min - 1e-9 && x <= max + 1e-9 && y >= min - 1e-9 && y <= max + 1e-9) pts.push([x, y]);
  };
  add(min, a * min + b);
  add(max, a * max + b);
  if (a !== 0) {
    add((min - b) / a, min);
    add((max - b) / a, max);
  }
  if (pts.length < 2) return null;
  pts.sort((p, q) => p[0] - q[0]);
  return [pts[0], pts[pts.length - 1]];
}

// 在 drawPlane 回傳的平面上畫一條直線 y = ax + b
function ttPlaneLine(ctx, P, a, b, color, width) {
  const seg = ttClip(a, b, P.min, P.max);
  if (!seg) return;
  ttLine(ctx, P.px(seg[0][0]), P.py(seg[0][1]), P.px(seg[1][0]), P.py(seg[1][1]), color, width || 2.6);
}

// 點旁邊的坐標標籤（靠近右上，碰到右緣就改放左邊）
function ttPtLabel(ctx, text, x, y, color, W) {
  ctx.save();
  ctx.font = f(800, 13.5);
  const w = ctx.measureText(text).width;
  const left = (x + 10 + w > (W || ctx.canvas.width) - 6);
  ctx.fillStyle = color;
  ctx.textAlign = left ? 'right' : 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, left ? x - 10 : x + 10, y - 13);
  ctx.restore();
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第四冊 2-1 的 24 題正解
  // 正解字母分布：A 6 題、B 6 題、C 6 題、D 6 題（開發約束 36）
  const answers = {
    '2-1-1': 'A',    // 300 元買單價 x 元的玩具 → 15、12、6、5，是函數
    '2-1-2': 'B',    // 反比 xy = 36 → y = 36/x，是函數
    '2-1-3': 'C',    // (5, 1)、(5, 3)：一個 x 對到兩個 y
    '2-1-4': 'D',    // 價格 → 品項：x = 20 對到紅茶與綠茶
    '2-1-5': 'C',    // 4(x + 1) − 4x = 4 是常數函數
    '2-1-6': 'A',    // 月費 650 元吃到飽 → y = 650
    '2-1-7': 'D',    // y = −5x + 8，x = −3 → 23
    '2-1-8': 'B',    // 常數函數 y = −6，x = 50 → −6
    '2-1-9': 'B',    // 3a − 11 = −2a + 9 → a = 4
    '2-1-10': 'D',   // −4a + 7 = −13 → a = 5
    '2-1-11': 'A',   // x = 2 → −1、x = 6 → 11 → y = 3x − 7
    '2-1-12': 'C',   // 通過 (−3, 8)、(1, −4) → y = −3x − 1
    '2-1-13': 'D',   // 八折再減 50，定價 2400 → 1870
    '2-1-14': 'C',   // 周長 46 的長方形 → y = 23 − x，x = 15 時 y = 8
    '2-1-15': 'A',   // (3, 2) 不在圖形上
    '2-1-16': 'B',   // 讀圖：最遠 800 公尺、10～20 分停留
    '2-1-17': 'C',   // y = 2/3 x − 2 通過 (0, −2)、(3, 0)
    '2-1-18': 'A',   // y = −7 是通過 (0, −7) 的水平線
    '2-1-19': 'B',   // 平行 x 軸、過 (6, −8) → y = −8
    '2-1-20': 'D',   // 鉛垂線不是函數，只有阿扣對
    '2-1-21': 'A',   // 停 50 分 20 元、80 分 44 元 → 免費 25 分鐘
    '2-1-22': 'D',   // 40 → 50、100 → 140，原價 60 → 80
    '2-1-23': 'B',   // 300x + 200 = 200x + 450 → x = 2.5
    '2-1-24': 'C'    // 30 − x/2 = 20 − x/4 → 40 分鐘、10 公分
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
   重點 1：函數的意義——給定每一個 x，都恰有一個 y 與它對應
   ========================================================================== */
const TT_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const TT_FN1 = {
  bottle: {
    title: '每瓶 25 元的汽水：買 x 瓶要付 y 元',
    xs: [1, 2, 3, 4, 5, 6, 7, 8], f: x => 25 * x,
    xName: '瓶數', yName: '總價', xu: '瓶', yu: '元', tex: 'y = 25x',
    items: c => [IT('y', c), T('=', c), SEQ([T('25', c), IT('x', c)], c, 2)]
  },
  cups: {
    title: '240 元剛好買 y 杯單價 x 元的飲料',
    xs: [10, 12, 15, 20, 24, 30, 40, 60], f: x => 240 / x,
    xName: '單價', yName: '杯數', xu: '元', yu: '杯', tex: 'y = \\frac{240}{x}',
    items: c => [IT('y', c), T('=', c), VF(T('240', c), IT('x', c), c)]
  },
  month: {
    title: '2027 年（平年）：x 月有 y 天',
    xs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], f: x => TT_DAYS[x - 1],
    xName: '月分', yName: '天數', xu: '月', yu: '天', tex: null,
    items: c => [T('查月曆', c)]
  }
};

function initMachineCanvas() {
  const cv = ttEl('canvas-machine');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const si = ttEl('mc-i'), vi = ttEl('mc-vi');
  const g = ttEl('mc-mode-group');
  const out = ttEl('mc-formula');
  const fb = ttEl('mc-feedback');
  const C = TT_TONE[0];
  let key = 'bottle';

  function draw() {
    const S = TT_FN1[key];
    const n = S.xs.length;
    si.max = n;
    if (ttIv(si) > n) si.value = n;
    const k = ttIv(si);
    const x = S.xs[k - 1], y = S.f(x);
    vi.textContent = `${x} ${S.xu}`;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, S.title, C);

    // 投幣口 → 函數機 → 出貨口
    textCenter(ctx, `輸入 x（${S.xName}）`, 90, 66, TT_YEL, f(800, 14));
    ctx.save();
    ctx.fillStyle = 'rgba(253, 224, 71, 0.16)';
    ctx.strokeStyle = TT_YEL;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(90, 128, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    textCenter(ctx, String(x), 90, 128, TT_CREAM, f(800, 24));
    ttArrow(ctx, 132, 128, 182, 128, TT_YEL);

    ttPlate(ctx, 190, 64, 160, 128, TT_RED, 0.16);
    textCenter(ctx, '函數機', 270, 88, TT_RED, f(800, 15));
    drawExpr(ctx, S.items(TT_CREAM), 270, 140, 22, TT_CREAM, { maxW: 140 });

    ttArrow(ctx, 358, 128, 408, 128, TT_OK);
    textCenter(ctx, `輸出 y（${S.yName}）`, 460, 66, TT_OK, f(800, 14));
    ttPlate(ctx, 418, 96, 84, 64, TT_OK, 0.16);
    textCenter(ctx, String(y), 460, 128, TT_CREAM, f(800, 24));
    textCenter(ctx, '只掉出一個結果', 270, 214, MUTED, f(700, 13.5));

    // 對應表：每一欄一支箭頭
    const cw = Math.min(56, 456 / n), x0 = 64 + (476 - cw * n) / 2 + cw / 2;
    const rx = 252, ry = 344;
    textCenter(ctx, 'x', 34, rx, TT_YEL, fi(800, 18));
    textCenter(ctx, 'y', 34, ry, TT_OK, fi(800, 18));
    S.xs.forEach((xv, i) => {
      const cx = x0 + i * cw;
      const on = (i === k - 1);
      const same = (key === 'month' && S.f(xv) === y && !on);
      ctx.save();
      roundRect(ctx, cx - cw / 2 + 3, rx - 18, cw - 6, 36, 6);
      ctx.fillStyle = on ? 'rgba(253, 224, 71, 0.25)' : 'rgba(148, 163, 184, 0.08)';
      ctx.fill();
      roundRect(ctx, cx - cw / 2 + 3, ry - 18, cw - 6, 36, 6);
      ctx.fillStyle = on ? 'rgba(134, 239, 172, 0.25)' : (same ? 'rgba(134, 239, 172, 0.12)' : 'rgba(148, 163, 184, 0.08)');
      ctx.fill();
      ctx.restore();
      textCenter(ctx, String(xv), cx, rx, on ? TT_YEL : INK, f(800, cw < 44 ? 14 : 16));
      textCenter(ctx, String(S.f(xv)), cx, ry, on ? TT_OK : (same ? TT_OK : INK), f(800, cw < 44 ? 14 : 16));
      ttArrow(ctx, cx, rx + 20, cx, ry - 21, on ? TT_YEL : 'rgba(148, 163, 184, 0.55)', on ? 2.6 : 1.6);
    });

    textCenter(ctx, `每一個 x 都恰好射出一支箭頭 → y 是 x 的函數`, W / 2, 402, TT_OK, f(800, 15));
    textCenter(ctx, key === 'month'
      ? `x = 1、3、5、7、8、10、12 都對到 31：不同的 x 可以對到同一個 y`
      : (key === 'cups' ? '單價越高買得越少，但每個單價仍然只對到一個杯數' : '瓶數一確定，總價就跟著確定'),
    W / 2, 432, MUTED, f(700, 13.5));

    out.innerHTML = S.tex
      ? `\\(x = ${x}\\) 時，\\(y = ${y}\\)；關係式 \\(${S.tex}\\)`
      : `\\(x = ${x}\\) 時，\\(y = ${y}\\)`;
    fb.innerHTML = wrapFeedback(key === 'month'
      ? `${x} 月有 \\(${y}\\) 天。月分與天數沒有一條算式可寫，但每個月分都只有一個天數，所以天數是月分的函數。`
      : `${S.xName} \\(x = ${x}\\) 時，${S.yName}只有一個值 \\(y = ${y}\\)。對每一個 \\(x\\) 都是這樣，所以 \\(y\\) 是 \\(x\\) 的函數。`);
    typeset([out, fb]);
  }

  si.addEventListener('input', draw);
  bindPickGroup(g, 'data-mc-mode', v => { key = v; si.value = 1; draw(); });
  draw();
}

/* ==========================================================================
   重點 2：不是函數——一個 x 對到不只一個 y
   ========================================================================== */
const TT_SCORES = [80, 65, 90, 75, 85];

function initMapCanvas() {
  const cv = ttEl('canvas-map');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const ss = ttEl('mp-s'), vs = ttEl('mp-vs');
  const g = ttEl('mp-dir-group');
  const out = ttEl('mp-formula');
  const fb = ttEl('mp-feedback');
  const C = TT_TONE[1];
  let dir = 'fwd';

  function draw() {
    const s6 = ttIv(ss);
    vs.textContent = s6;
    const scores = TT_SCORES.concat([s6]);
    const seats = [1, 2, 3, 4, 5, 6];
    const uniq = Array.from(new Set(scores)).sort((p, q) => p - q);
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, dir === 'fwd' ? '座號 x → 成績 y：y 是 x 的函數嗎？' : '成績 x → 座號 y：y 是 x 的函數嗎？', C);

    const L = dir === 'fwd' ? seats : uniq;
    const R = dir === 'fwd' ? uniq : seats;
    const pairs = seats.map((st, i) => dir === 'fwd' ? [st, scores[i]] : [scores[i], st]);
    const lx = 140, rx = 400, mid = 214, gap = 44;
    const yOf = (arr, v) => mid + (arr.indexOf(v) - (arr.length - 1) / 2) * gap;

    [[lx, dir === 'fwd' ? '座號 x' : '成績 x', TT_YEL], [rx, dir === 'fwd' ? '成績 y' : '座號 y', TT_BLUE]].forEach(o => {
      ctx.save();
      ctx.strokeStyle = o[2];
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(o[0], mid, 56, 150, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      textCenter(ctx, o[1], o[0], 52, o[2], f(800, 15));
    });

    const cnt = {};
    pairs.forEach(p => { cnt[p[0]] = (cnt[p[0]] || 0) + 1; });
    const bad = L.filter(v => cnt[v] > 1);

    pairs.forEach(p => {
      const y1 = yOf(L, p[0]), y2 = yOf(R, p[1]);
      const col = cnt[p[0]] > 1 ? TT_NO : TT_OK;
      ttArrow(ctx, lx + 30, y1, rx - 30, y2, col, cnt[p[0]] > 1 ? 2.6 : 1.9);
    });
    L.forEach(v => {
      const y = yOf(L, v);
      textCenter(ctx, String(v), lx, y, cnt[v] > 1 ? TT_NO : TT_CREAM, f(800, 18));
      if (cnt[v] > 1) textCenter(ctx, `${cnt[v]} 支`, lx - 70, y, TT_NO, f(800, 13));
    });
    R.forEach(v => textCenter(ctx, String(v), rx, yOf(R, v), INK, f(800, 18)));

    const ok = bad.length === 0;
    const vy = 392;
    drawPanel(ctx, 40, vy - 26, W - 80, 52, ok ? TT_OK : TT_NO, 0.1);
    let verdict;
    if (dir === 'fwd') verdict = '每個座號都恰好一支箭頭 → y 是 x 的函數';
    else if (ok) verdict = '每個成績都恰好一支箭頭 → 這一次 y 是 x 的函數';
    else verdict = `x = ${bad.join('、')} 射出不只一支箭頭 → y 不是 x 的函數`;
    textCenter(ctx, verdict, W / 2, vy, ok ? TT_OK : TT_NO, f(800, 15.5));
    textCenter(ctx, '一對一、多對一：是函數　　一對多：不是函數', W / 2, 446, MUTED, f(700, 13.5));

    const dupSeat = TT_SCORES.indexOf(s6);
    out.innerHTML = dir === 'fwd'
      ? `6 號的成績 \\(= ${s6}\\)；${dupSeat >= 0 ? `和 ${dupSeat + 1} 號同分（多對一）` : '沒有人和他同分'}`
      : (ok ? `成績 \\(x\\) 與座號 \\(y\\)：每個成績只對到一個座號` : `\\(x = ${s6}\\) 對到 \\(y = ${dupSeat + 1}\\) 與 \\(y = 6\\)`);
    if (dir === 'fwd') {
      fb.innerHTML = wrapFeedback(dupSeat >= 0
        ? `${dupSeat + 1} 號與 6 號都是 \\(${s6}\\) 分：兩個 \\(x\\) 對到同一個 \\(y\\)（多對一）。每個座號仍然只有一個成績，所以 \\(y\\) 還是 \\(x\\) 的函數。`
        : `每個座號只有一個成績，所以 \\(y\\) 是 \\(x\\) 的函數。把 6 號的成績調成和別人一樣，結論也不會變。`);
    } else {
      fb.innerHTML = wrapFeedback(ok
        ? `目前沒有人同分，每個成績剛好對到一個座號。但只要有兩人同分，那個成績就會對到兩個座號——試著把 6 號調成 \\(65\\)、\\(75\\)、\\(80\\)、\\(85\\) 或 \\(90\\)。`
        : `給定 \\(x = ${s6}\\)，對應的 \\(y\\) 不只一個（${dupSeat + 1} 號與 6 號），沒辦法說「${s6} 分的是幾號」，所以 \\(y\\) 不是 \\(x\\) 的函數。`);
    }
    typeset([out, fb]);
  }

  ss.addEventListener('input', draw);
  bindPickGroup(g, 'data-mp-dir', v => { dir = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 3：一次函數 y = ax + b（a ≠ 0）與常數函數 y = b
   ========================================================================== */
function initKindCanvas() {
  const cv = ttEl('canvas-kind');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = ttEl('kd-a'), sb = ttEl('kd-b');
  const va = ttEl('kd-va'), vb = ttEl('kd-vb');
  const out = ttEl('kd-formula');
  const fb = ttEl('kd-feedback');
  const C = TT_TONE[2];

  function draw() {
    const a = ttIv(sa), b = ttIv(sb);
    va.textContent = ttMn(a); vb.textContent = ttMn(b);
    const A = [a, 1], B = [b, 1];
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '計費機：基本 b、每多 1 個單位變化 a', C);

    drawExpr(ctx, ttFnItems(A, B, TT_CREAM), W / 2, 72, 26, TT_CREAM);

    const xs = [0, 1, 2, 3, 4, 5];
    const cw = 66, x0 = 120 + cw / 2, rx = 124, ry = 176;
    textCenter(ctx, 'x', 70, rx, TT_YEL, fi(800, 18));
    textCenter(ctx, 'y', 70, ry, TT_OK, fi(800, 18));
    xs.forEach((xv, i) => {
      const cx = x0 + i * cw;
      ctx.save();
      roundRect(ctx, cx - cw / 2 + 3, rx - 18, cw - 6, 36, 6);
      ctx.fillStyle = 'rgba(253, 224, 71, 0.12)';
      ctx.fill();
      roundRect(ctx, cx - cw / 2 + 3, ry - 18, cw - 6, 36, 6);
      ctx.fillStyle = 'rgba(134, 239, 172, 0.12)';
      ctx.fill();
      ctx.restore();
      textCenter(ctx, String(xv), cx, rx, INK, f(800, 17));
      textCenter(ctx, ttMn(a * xv + b), cx, ry, TT_CREAM, f(800, 17));
      if (i > 0) {
        const mx = cx - cw / 2;
        textCenter(ctx, a >= 0 ? `+${a}` : ttMn(a), mx, ry + 34, a === 0 ? MUTED : C, f(800, 13.5));
      }
    });
    textCenter(ctx, 'x 每多 1，y 的變化', W / 2, ry + 58, MUTED, f(700, 13));

    const isLin = a !== 0;
    drawChip(ctx, 46, 268, 214, 44, '一次函數（a ≠ 0）', isLin ? TT_OK : DIM, isLin ? 'rgba(134,239,172,0.16)' : 'rgba(255,255,255,0.03)');
    drawChip(ctx, 280, 268, 214, 44, '常數函數（a = 0）', !isLin ? TT_OK : DIM, !isLin ? 'rgba(134,239,172,0.16)' : 'rgba(255,255,255,0.03)');

    if (isLin) {
      textCenter(ctx, `x 的最高次數是 1 次：x 每多 1，y 就${a > 0 ? '多' : '少'} ${Math.abs(a)}`, W / 2, 346, INK, f(800, 15));
      textCenter(ctx, b === 0 ? '這時 b = 0，關係式只剩 y = ax，y 與 x 成正比' : `x = 0 時 y = ${ttMn(b)}，就是那個「基本」的 b`, W / 2, 378, MUTED, f(700, 13.5));
    } else {
      textCenter(ctx, `不論 x 是多少，y 永遠是 ${ttMn(b)}`, W / 2, 346, INK, f(800, 15));
      textCenter(ctx, '就像「吃到飽」：吃幾盤都付一樣的錢', W / 2, 378, MUTED, f(700, 13.5));
    }
    textCenter(ctx, isLin ? '一次函數：y = ax + b，a ≠ 0' : '常數函數：y = b（每個 x 都對到同一個 y，仍是函數）', W / 2, 420, isLin ? C : TT_OK, f(800, 14));

    out.innerHTML = `\\(y = ${ttLinTex(A, B)}\\)：${isLin ? '一次函數' : '常數函數'}`;
    fb.innerHTML = wrapFeedback(isLin
      ? `\\(a = ${a} \\ne 0\\)，\\(x\\) 的最高次數是一次，所以 \\(y = ${ttLinTex(A, B)}\\) 是一次函數。`
      : `\\(a = 0\\) 時 \\(0 \\cdot x\\) 消失，只剩 \\(y = ${b}\\)：\\(x\\) 怎麼變，\\(y\\) 都不變，這是常數函數。`);
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 4：求函數值——把 x 代入關係式
   ========================================================================== */
const TT_VAL = {
  p1: { a: [4, 1], b: [-9, 1], note: '一次函數' },
  p2: { a: [9, 5], b: [32, 1], note: '攝氏 x 度換成華氏 y 度' },
  p3: { a: [0, 1], b: [15, 1], note: '常數函數' },
  p4: { a: [-1, 2], b: [6, 1], note: '一次函數（係數是分數）' }
};

function initValueCanvas() {
  const cv = ttEl('canvas-value');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sx = ttEl('vl-x'), vx = ttEl('vl-vx');
  const g = ttEl('vl-fn-group');
  const out = ttEl('vl-formula');
  const fb = ttEl('vl-feedback');
  const C = TT_TONE[3];
  let key = 'p1';

  function draw() {
    const P = TT_VAL[key];
    const xv = ttIv(sx);
    vx.textContent = ttMn(xv);
    const X = [xv, 1];
    const prod = qMul(P.a, X);
    const y = ttEval(P.a, P.b, X);
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `${P.note}：x = ${ttMn(xv)} 時，函數值是多少？`, C);

    // 投入 x → 函數機 → 函數值
    ttPlate(ctx, 30, 58, 110, 70, TT_YEL, 0.14);
    drawExpr(ctx, [IT('x', TT_CREAM), T('=', TT_CREAM), T(ttMn(xv), TT_CREAM)], 85, 93, 22, TT_CREAM, { maxW: 96 });
    ttArrow(ctx, 146, 93, 176, 93, TT_YEL);
    ttPlate(ctx, 182, 52, 200, 82, TT_RED, 0.14);
    drawExpr(ctx, ttFnItems(P.a, P.b, TT_CREAM), 282, 93, 22, TT_CREAM, { maxW: 180 });
    ttArrow(ctx, 388, 93, 418, 93, TT_OK);
    ttPlate(ctx, 424, 58, 90, 70, TT_OK, 0.14);
    drawExpr(ctx, [qIt(y, TT_OK)], 469, 93, 24, TT_OK, { maxW: 80 });

    const rows = [];
    rows.push(ttRow('函數', '', ttFnItems(P.a, P.b, INK)));
    if (P.a[0] === 0) {
      rows.push(ttRow('代入', `x 不出現在式子裡`, [IT('y'), T('='), qIt(P.b)]));
    } else {
      rows.push(ttRow('代入', `把 x 換成 ${ttMn(xv)}`, [IT('y'), T('=')].concat(ttSubItems(P.a, P.b, X))));
      rows.push(ttRow('計算', '先乘再加減', [IT('y'), T('=')].concat(ttMidItems(prod, P.b))));
    }
    rows.push(ttRow('函數值', `函數在 x = ${ttMn(xv)} 的值`, [IT('y', TT_OK), T('=', TT_OK), qIt(y, TT_OK)], TT_OK));
    drawStepRows(ctx, ttNumber(rows), rows.length, { top: 192, gap: 62, eqX: 176, color: C, size: 22 });

    if (P.a[0] === 0) {
      textCenter(ctx, '常數函數不必代入：每一個 x 的函數值都一樣', W / 2, 438, TT_OK, f(700, 14));
    }

    out.innerHTML = P.a[0] === 0
      ? `\\(x = ${xv}\\) 時，\\(y = ${qTex(P.b)}\\)`
      : wbrEq(`y = ${ttSubTex(P.a, P.b, X)} = ${ttMidTex(prod, P.b)} = ${qTex(y)}`);
    fb.innerHTML = wrapFeedback(P.a[0] === 0
      ? `\\(y = ${qTex(P.b)}\\) 是常數函數，\\(x = ${xv}\\) 的函數值就是 \\(${qTex(P.b)}\\)。`
      : `代入時 \\(x\\) 是負數要加括號，${P.a[1] !== 1 ? '分數係數先乘再約分，' : ''}函數在 \\(x = ${xv}\\) 的函數值是 \\(${qTex(y)}\\)。`);
    typeset([out, fb]);
  }

  sx.addEventListener('input', draw);
  bindPickGroup(g, 'data-vl-fn', v => { key = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 5：函數值相等——兩個函數在 x = a 的值一樣，列方程式解 a
   ========================================================================== */
function initEqualCanvas() {
  const cv = ttEl('canvas-equal');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = ttEl('eq-p'), sq = ttEl('eq-q'), sr = ttEl('eq-r'), ss = ttEl('eq-s');
  const vp = ttEl('eq-vp'), vq = ttEl('eq-vq'), vr = ttEl('eq-vr'), vs = ttEl('eq-vs');
  const rRow = ttEl('eq-r-row'), sLab = ttEl('eq-s-lab');
  const g = ttEl('eq-mode-group');
  const out = ttEl('eq-formula');
  const fb = ttEl('eq-feedback');
  const C = TT_TONE[4];
  let mode = 'two';

  function draw() {
    const p = ttIv(sp), q = ttIv(sq), s = ttIv(ss);
    const r = mode === 'two' ? ttIv(sr) : 0;
    vp.textContent = ttMn(p); vq.textContent = ttMn(q); vr.textContent = ttMn(ttIv(sr)); vs.textContent = ttMn(s);
    rRow.style.display = mode === 'two' ? '' : 'none';
    sLab.textContent = mode === 'two' ? '乙的 b' : '常數 k';
    const A1 = [p, 1], B1 = [q, 1], A2 = [r, 1], B2 = [s, 1];
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'two' ? 'x = a 時，甲、乙兩個函數值相等，a 是多少？' : 'x = a 時，函數值等於 k，a 是多少？', C);

    // 函數值對照表 x = −4 … 4
    const xs = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    const cw = 46, x0 = 92 + cw / 2;
    const hy = 62, y1y = 100, y2y = 138;
    textLeft(ctx, 'x', 22, hy, TT_YEL, fi(800, 16));
    drawExpr(ctx, ttFnItems(A1, B1, TT_RED), 0, y1y, 13, TT_RED, { left: 10, maxW: 76, gap: 2 });
    drawExpr(ctx, mode === 'two' ? ttFnItems(A2, B2, TT_BLUE) : [IT('y', TT_BLUE), T('=', TT_BLUE), T(ttMn(s), TT_BLUE)], 0, y2y, 13, TT_BLUE, { left: 10, maxW: 76, gap: 2 });
    xs.forEach((xv, i) => {
      const cx = x0 + i * cw;
      const v1 = p * xv + q, v2 = r * xv + s;
      if (v1 === v2) {
        ctx.save();
        roundRect(ctx, cx - cw / 2 + 2, hy - 16, cw - 4, y2y - hy + 34, 8);
        ctx.fillStyle = 'rgba(134, 239, 172, 0.16)';
        ctx.fill();
        ctx.strokeStyle = TT_OK;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
      textCenter(ctx, ttMn(xv), cx, hy, TT_YEL, f(800, 15));
      textCenter(ctx, ttMn(v1), cx, y1y, v1 === v2 ? TT_OK : TT_RED, f(800, 15));
      textCenter(ctx, ttMn(v2), cx, y2y, v1 === v2 ? TT_OK : TT_BLUE, f(800, 15));
    });

    // 方程式兩邊：pa + q 與 ra + s（字串給 parseExpr）
    const side = (c, k) => {
      const h = ttCoefStr(c, 'a');
      if (!h) return String(k);
      if (k === 0) return h;
      return h + (k < 0 ? ' - ' + (-k) : ' + ' + k);
    };
    const L1 = side(p, q), R1 = side(r, s);
    const dc = p - r, dk = s - q;
    const rows = [];
    let texAll, msg;
    rows.push(ttRow('列式', mode === 'two' ? '兩個函數值相等' : '函數值等於 k', exprItems(`${L1} = ${R1}`)));
    if (dc === 0) {
      if (dk === 0) {
        rows.push(ttRow('整理', 'a 消失了，兩邊一樣', exprItems(`${L1} = ${R1}`, TT_OK)));
        msg = mode === 'two' ? '兩個函數完全相同：每一個 a 的函數值都相等' : '函數本身就是 y = k：每一個 a 都符合';
        texAll = `${L1} = ${R1}`;
      } else {
        rows.push(ttRow('整理', 'a 消失了', exprItems(`0 = ${dk}`, TT_NO), TT_NO));
        msg = mode === 'two' ? 'x 的係數相同、常數不同：函數值永遠差一樣多，不會相等' : '函數值永遠不會等於 k，這樣的 a 不存在';
        texAll = `${L1} = ${R1}`;
      }
      drawStepRows(ctx, ttNumber(rows), rows.length, { top: 206, gap: 58, eqX: 176, color: C, size: 22 });
      textCenter(ctx, msg, W / 2, 330, dk === 0 ? TT_OK : TT_NO, f(800, 14.5));
    } else {
      const a = qOf(dk, dc);
      const y = qAdd(qMul([p, 1], a), [q, 1]);
      rows.push(ttRow('移項', 'a 移到左邊、數移到右邊', exprItems(`${ttCoefStr(dc, 'a') || '0'} = ${dk}`)));
      rows.push(ttRow('解', `兩邊同除以 ${ttMn(dc)}`, [IT('a', TT_OK), T('=', TT_OK), qIt(a, TT_OK)], TT_OK));
      rows.push(ttRow('驗算', '代回兩個函數', [IT('y'), T('='), qIt(y), T(mode === 'two' ? '（甲、乙相同）' : '（等於 k）', MUTED)]));
      drawStepRows(ctx, ttNumber(rows), rows.length, { top: 206, gap: 58, eqX: 176, color: C, size: 22 });
      msg = (a[1] === 1 && Math.abs(a[0]) <= 4) ? '表格裡發亮的那一欄就是答案' : '答案不在表格的範圍內（或不是整數），要靠解方程式';
      texAll = `${L1} = ${R1}`;
      textCenter(ctx, msg, W / 2, 460, MUTED, f(700, 13.5));
      out.innerHTML = wbrEq(`${L1} = ${R1}`) + `，<wbr>\\(${ttCoefStr(dc, 'a')} = ${dk}\\)，<wbr>\\(a = ${qTex(a)}\\)`;
      fb.innerHTML = wrapFeedback(`把 \\(x = a\\) 分別代入兩個函數，讓兩個函數值相等，得到一元一次方程式，解出 \\(a = ${qTex(a)}\\)；此時兩個函數值都是 \\(${qTex(y)}\\)。`);
      typeset([out, fb]);
      return;
    }
    out.innerHTML = wbrEq(texAll) + (dk === 0 ? '：每個 \\(a\\) 都成立' : '：無解');
    fb.innerHTML = wrapFeedback(msg + '。');
    typeset([out, fb]);
  }

  [sp, sq, sr, ss].forEach(sl => sl.addEventListener('input', draw));
  bindPickGroup(g, 'data-eq-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 6：由兩組對應值（圖形上的兩點）求一次函數 y = ax + b
   ========================================================================== */
function initTwoCanvas() {
  const cv = ttEl('canvas-two');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const s1 = ttEl('tw-x1'), s2 = ttEl('tw-y1'), s3 = ttEl('tw-x2'), s4 = ttEl('tw-y2');
  const v1 = ttEl('tw-vx1'), v2 = ttEl('tw-vy1'), v3 = ttEl('tw-vx2'), v4 = ttEl('tw-vy2');
  const g = ttEl('tw-mode-group');
  const out = ttEl('tw-formula');
  const fb = ttEl('tw-feedback');
  const C = TT_TONE[5];
  let mode = 'value';

  // 「y = ca + b」的字串
  const eqStr = (xv, yv) => `${yv} = ${ttAbStr(xv)}`;

  function draw() {
    const x1 = ttIv(s1), y1 = ttIv(s2), x2 = ttIv(s3), y2 = ttIv(s4);
    v1.textContent = ttMn(x1); v2.textContent = ttMn(y1); v3.textContent = ttMn(x2); v4.textContent = ttMn(y2);
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'value' ? '由兩個函數值求一次函數 y = ax + b' : '由圖形上的兩點求函數 y = ax + b', C);

    let P = null;
    if (mode === 'graph') {
      P = drawPlane(ctx, { cx: 128, top: 58, unit: 17, min: -5, max: 5, tickFont: f(600, 10.5), labelEvery: 5 });
    } else {
      [[x1, y1, 74], [x2, y2, 160]].forEach(o => {
        ttPlate(ctx, 22, o[2] - 30, 210, 60, TT_YEL, 0.1);
        textCenter(ctx, `x = ${ttMn(o[0])} 時，y = ${ttMn(o[1])}`, 127, o[2], TT_CREAM, f(800, 17));
      });
    }

    const rows = [];
    let a = null, b = null, msg, bad = false;
    if (x1 === x2) {
      bad = true;
      msg = y1 === y2
        ? '兩組其實是同一組，只有一個點，決定不了一條直線'
        : `x = ${ttMn(x1)} 同時對到 ${ttMn(y1)} 和 ${ttMn(y2)}：這不是函數`;
    } else {
      a = qOf(y2 - y1, x2 - x1);
      b = qSub([y1, 1], qMul(a, x1));
    }

    // 右上：兩條代入式
    textCenter(ctx, '代入 y = ax + b', 392, 64, MUTED, f(700, 14));
    drawExpr(ctx, exprItems(eqStr(x1, y1), TT_CREAM), 392, 104, 21, TT_CREAM, { maxW: 270 });
    drawExpr(ctx, exprItems(eqStr(x2, y2), TT_CREAM), 392, 150, 21, TT_CREAM, { maxW: 270 });
    textLeft(ctx, '…①', 486, 104, MUTED, f(700, 13));
    textLeft(ctx, '…②', 486, 150, MUTED, f(700, 13));

    if (P) {
      if (a) ttPlaneLine(ctx, P, qVal(a), qVal(b), C, 2.6);
      else if (x1 === x2 && y1 !== y2) ttLine(ctx, P.px(x1), P.py(-5), P.px(x1), P.py(5), TT_NO, 2.2, [6, 5]);
      drawDot(ctx, P.px(x1), P.py(y1), TT_YEL, 6);
      drawDot(ctx, P.px(x2), P.py(y2), TT_BLUE, 6);
    }

    if (bad) {
      drawPanel(ctx, 40, 280, W - 80, 70, TT_NO, 0.1);
      textCenter(ctx, msg, W / 2, 304, TT_NO, f(800, 15));
      textCenter(ctx, '兩組的 x 要不同，才求得出一次函數或常數函數', W / 2, 330, MUTED, f(700, 13.5));
      out.innerHTML = y1 === y2 ? `只有一組 \\((${x1}, ${y1})\\)，求不出 \\(a\\)、\\(b\\)` : `\\(x = ${x1}\\) 對到兩個 \\(y\\)，不是函數`;
      fb.innerHTML = wrapFeedback(y1 === y2
        ? `兩組資料相同，等於只知道一個點，通過一點的直線有無限多條。把其中一組的 \\(x\\) 調開。`
        : `同一個 \\(x\\) 對到兩個不同的 \\(y\\)，不符合「給定每個 \\(x\\) 恰有一個 \\(y\\)」，所以根本不是函數。`);
      typeset([out, fb]);
      return;
    }

    const dx = x2 - x1, dy = y2 - y1;
    rows.push(ttRow('兩式相減', '② − ①，消去 b', exprItems(`${dy} = ${ttCoefStr(dx, 'a')}`)));
    rows.push(ttRow('求 a', `兩邊同除以 ${ttMn(dx)}`, [IT('a'), T('='), qIt(a)]));
    rows.push(ttRow('求 b', 'a 代回 ①', [IT('b'), T('='), T(ttMn(y1)), T('−'), GRP([SEQ([T(ttMn(x1)), T('×'), qOpIt(a)], null, 4)]), T('='), qIt(b)]));
    rows.push(ttRow(a[0] === 0 ? '常數函數' : '一次函數', a[0] === 0 ? 'a = 0：水平線' : '', ttFnItems(a, b, TT_OK), TT_OK));
    drawStepRows(ctx, ttNumber(rows), rows.length, { top: 268, gap: 58, eqX: 150, color: C, size: 21 });

    out.innerHTML = `\\(a = ${qTex(a)}\\)，<wbr>\\(b = ${qTex(b)}\\)，<wbr>\\(y = ${ttLinTex(a, b)}\\)`;
    fb.innerHTML = wrapFeedback(a[0] === 0
      ? `兩組的 \\(y\\) 一樣，\\(a = 0\\)：函數是 \\(y = ${qTex(b)}\\)，常數函數，圖形是水平線。`
      : `兩式相減消去 \\(b\\)，先求 \\(a = ${qTex(a)}\\)，再代回求 \\(b = ${qTex(b)}\\)，所以函數是 \\(y = ${ttLinTex(a, b)}\\)。`
        + (mode === 'graph' ? '「函數值」與「圖形通過的點」是同一件事。' : ''));
    typeset([out, fb]);
  }

  [s1, s2, s3, s4].forEach(sl => sl.addEventListener('input', draw));
  bindPickGroup(g, 'data-tw-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 7：函數值的應用——由情境列出關係式，再代入（x 要在合適的範圍內）
   ========================================================================== */
const TT_APPLY = {
  mount: {
    title: '山上的氣溫：每上升 100 公尺，氣溫下降 0.6 °C',
    pLab: '平地氣溫（°C）', pMin: 20, pMax: 30, pStep: 1, pDef: 25,
    xLab: '高度 x（公尺）', xMin: 0, xMax: 3900, xStep: 100, xDef: 2500
  },
  rect: {
    title: '鐵絲圍成長方形：長 x 公分、寬 y 公分',
    pLab: '鐵絲長（公分）', pMin: 20, pMax: 30, pStep: 2, pDef: 24,
    xLab: '長 x（公分）', xMin: 1, xMax: 16, xStep: 1, xDef: 7
  },
  leak: {
    title: '水管破了：每分鐘漏水固定的公升數',
    pLab: '每分鐘漏水（公升）', pMin: 10, pMax: 40, pStep: 5, pDef: 15,
    xLab: '時間 x（小時）', xMin: 1, xMax: 8, xStep: 1, xDef: 3
  }
};

function initApplyCanvas() {
  const cv = ttEl('canvas-apply');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = ttEl('ap-p'), sx = ttEl('ap-x');
  const vp = ttEl('ap-vp'), vx = ttEl('ap-vx');
  const lp = ttEl('ap-lp'), lx = ttEl('ap-lx');
  const g = ttEl('ap-mode-group');
  const out = ttEl('ap-formula');
  const fb = ttEl('ap-feedback');
  const C = TT_TONE[6];
  let mode = 'mount';

  function setMode(m) {
    mode = m;
    const M = TT_APPLY[m];
    sp.min = M.pMin; sp.max = M.pMax; sp.step = M.pStep; sp.value = M.pDef;
    sx.min = M.xMin; sx.max = M.xMax; sx.step = M.xStep; sx.value = M.xDef;
    lp.textContent = M.pLab; lx.textContent = M.xLab;
  }

  function draw() {
    const M = TT_APPLY[mode];
    const p = ttIv(sp), xr = ttIv(sx);
    vp.textContent = p;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, M.title, C);
    const rows = [];
    let texOut, msg, ok = true;

    if (mode === 'mount') {
      const x = xr;
      vx.textContent = x;
      const drop = qOf(6 * x, 1000);
      const y = qSub([p, 1], drop);
      // 山與溫度計
      ctx.save();
      ctx.fillStyle = 'rgba(147, 197, 253, 0.12)';
      ctx.strokeStyle = TT_BLUE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 226); ctx.lineTo(215, 56); ctx.lineTo(390, 226); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
      const hy = 226 - x / 4000 * 175;
      const hx = 40 + (226 - hy) / 170 * 175;
      ttLine(ctx, 40, hy, hx, hy, TT_YEL, 1.6, [5, 4]);
      drawDot(ctx, hx, hy, TT_YEL, 6);
      textLeft(ctx, `${x} 公尺`, hx + 12, hy - 2, TT_YEL, f(800, 14));
      textLeft(ctx, '平地 0 公尺', 300, 214, MUTED, f(700, 12.5));
      // 溫度計：−10 °C ～ 30 °C
      const tx = 470, tTop = 60, tBot = 210;
      const ty = v => tBot - (v + 10) / 40 * (tBot - tTop);
      ctx.save();
      roundRect(ctx, tx - 9, tTop - 6, 18, tBot - tTop + 12, 9);
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = TT_RED;
      ctx.fillRect(tx - 5, ty(qVal(y)), 10, tBot - ty(qVal(y)));
      ctx.beginPath(); ctx.arc(tx, tBot + 12, 13, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      [-10, 0, 10, 20, 30].forEach(v => {
        ttLine(ctx, tx + 11, ty(v), tx + 17, ty(v), MUTED, 1.4);
        textLeft(ctx, String(v), tx + 21, ty(v), MUTED, f(600, 11.5));
      });
      textCenter(ctx, `${ttMn(ttDec(y))} °C`, tx - 2, 44, TT_RED, f(800, 15));

      rows.push(ttRow('列式', '每上升 1 公尺降 0.006 度', [IT('y'), T('='), T(p), T('−'), SEQ([T('0.006'), IT('x')], null, 2)]));
      rows.push(ttRow('代入', `x = ${x}`, [IT('y'), T('='), T(p), T('−'), T('0.006'), T('×'), T(x)]));
      rows.push(ttRow('計算', '', [IT('y'), T('='), T(p), T('−'), T(ttDec(drop))]));
      rows.push(ttRow('答', '高度 x 公尺處的氣溫', [IT('y', TT_OK), T('=', TT_OK), T(ttMn(ttDec(y)), TT_OK), T('°C', TT_OK)], TT_OK));
      texOut = wbrEq(`y = ${p} - 0.006 \\times ${x} = ${p} - ${ttDec(drop)} = ${ttDec(y)}`);
      msg = `每上升 \\(1\\) 公尺下降 \\(0.006\\) °C，所以 \\(y = ${p} - 0.006x\\) 是 \\(x\\) 的一次函數；\\(x = ${x}\\) 時氣溫是 \\(${ttDec(y)}\\) °C。`;
    } else if (mode === 'rect') {
      const x = xr, half = p / 2, y = half - x;
      vx.textContent = x;
      ok = y > 0;
      const k = Math.min(300 / half, 12);
      const rw = x * k, rh = Math.max(y, 0) * k;
      const cx = 250, cy = 142;
      if (ok) {
        ctx.save();
        ctx.fillStyle = 'rgba(253, 186, 116, 0.12)';
        ctx.fillRect(cx - rw / 2, cy - rh / 2, rw, rh);
        ctx.strokeStyle = C; ctx.lineWidth = 3;
        ctx.strokeRect(cx - rw / 2, cy - rh / 2, rw, rh);
        ctx.restore();
        textCenter(ctx, `長 x = ${x}`, cx, cy + rh / 2 + 18, TT_YEL, f(800, 14));
        textLeft(ctx, `寬 y = ${y}`, cx + rw / 2 + 10, cy, TT_OK, f(800, 14));
      } else {
        ttLine(ctx, cx - rw / 2, cy, cx + rw / 2, cy, TT_NO, 3);
        textCenter(ctx, `長 x = ${x}：鐵絲只夠圍成一條線（或不夠）`, cx, cy + 30, TT_NO, f(800, 14));
      }
      textCenter(ctx, `周長 2(x + y) = ${p}`, cx, 214, MUTED, f(700, 13.5));

      rows.push(ttRow('列式', `長 + 寬 = ${p} ÷ 2 = ${half}`, [IT('y'), T('='), T(half), T('−'), IT('x')]));
      rows.push(ttRow('代入', `x = ${x}`, [IT('y'), T('='), T(half), T('−'), T(x)]));
      if (ok) {
        rows.push(ttRow('答', '寬是正數，合理', [IT('y', TT_OK), T('=', TT_OK), T(y, TT_OK)], TT_OK));
        msg = `\\(y = ${half} - x\\) 是 \\(x\\) 的一次函數；長 \\(${x}\\) 公分時寬 \\(${y}\\) 公分。`;
      } else {
        rows.push(ttRow('不合', '寬一定要大於 0', [IT('y', TT_NO), T('=', TT_NO), T(ttMn(y), TT_NO), T('≤', TT_NO), T('0', TT_NO)], TT_NO));
        msg = `寬 \\(y = ${y}\\) 不是正數，長方形不存在。長 \\(x\\) 必須在 \\(0\\) 與 \\(${half}\\) 之間，這個函數才有意義。`;
      }
      texOut = ok ? wbrEq(`y = ${half} - ${x} = ${y}`) : `\\(y = ${half} - ${x} = ${y}\\)（不合）`;
    } else {
      const hrs = qOf(xr, 2);
      vx.textContent = ttDec(hrs);
      const perH = 60 * p;
      const y = qMul([perH, 1], hrs);
      // 水管與水桶
      ctx.save();
      ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(60, 70); ctx.lineTo(230, 70); ctx.stroke();
      ctx.restore();
      [0, 1, 2].forEach(i => {
        ctx.save();
        ctx.fillStyle = TT_BLUE;
        ctx.beginPath();
        ctx.arc(170, 90 + i * 22, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      const bx = 130, bw = 80, bTop = 140, bBot = 216;
      ctx.save();
      ctx.fillStyle = 'rgba(147, 197, 253, 0.3)';
      const lev = Math.min(qVal(y) / 9600, 1) * (bBot - bTop);
      ctx.fillRect(bx, bBot - lev, bw, lev);
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.strokeRect(bx, bTop, bw, bBot - bTop);
      ctx.restore();
      textCenter(ctx, `${ttDec(y)} 公升`, 360, 120, TT_BLUE, f(800, 18));
      textCenter(ctx, `漏了 ${ttDec(hrs)} 小時`, 360, 156, TT_YEL, f(800, 15));
      textCenter(ctx, `1 小時 = 60 分鐘 → 每小時 ${perH} 公升`, 360, 192, MUTED, f(700, 13));

      rows.push(ttRow('列式', '時間單位是小時，先換成每小時', [IT('y'), T('='), T(60), T('×'), T(p), T('×'), IT('x'), T('='), SEQ([T(perH), IT('x')], null, 2)]));
      rows.push(ttRow('代入', `x = ${ttDec(hrs)}`, [IT('y'), T('='), T(perH), T('×'), T(ttDec(hrs))]));
      rows.push(ttRow('答', '漏水量（公升）', [IT('y', TT_OK), T('=', TT_OK), T(ttDec(y), TT_OK)], TT_OK));
      texOut = wbrEq(`y = ${perH} \\times ${ttDec(hrs)} = ${ttDec(y)}`);
      msg = `每分鐘漏 \\(${p}\\) 公升，每小時就是 \\(${perH}\\) 公升，\\(y = ${perH}x\\)。忘了換單位會寫成 \\(y = ${p}x\\)，少了 \\(60\\) 倍。`;
    }

    drawStepRows(ctx, ttNumber(rows), rows.length, { top: 268, gap: 58, eqX: 160, color: C, size: 21 });
    out.innerHTML = texOut;
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  [sp, sx].forEach(sl => sl.addEventListener('input', draw));
  bindPickGroup(g, 'data-ap-mode', v => { setMode(v); draw(); });
  setMode('mount');
  draw();
}

/* ==========================================================================
   重點 8：函數圖形——把每一組 (x, y) 描成坐標平面上的點
   ========================================================================== */
const TT_PLOT = {
  week: {
    title: '玩具店一週每天賣出的發條車：第 x 天賣出 y 輛',
    xs: [1, 2, 3, 4, 5, 6, 7], ys: [5, 8, 6, 8, 9, 4, 7],
    ax: { ymin: 0, ymax: 10, ystep: 2, brk: false, xlab: '第幾天', ylab: '輛數 y' }
  },
  month: {
    title: '2027 年（平年）：x 月有 y 天',
    xs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], ys: TT_DAYS,
    ax: { ymin: 27, ymax: 32, ystep: 1, brk: true, xlab: '月分', ylab: '天數 y' }
  }
};

function initPlotCanvas() {
  const cv = ttEl('canvas-plot');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = ttEl('pl-k'), sp = ttEl('pl-p');
  const vk = ttEl('pl-vk'), vp = ttEl('pl-vp');
  const g = ttEl('pl-data-group');
  const out = ttEl('pl-formula');
  const fb = ttEl('pl-feedback');
  const C = TT_TONE[7];
  let key = 'week';

  function draw() {
    const D = TT_PLOT[key];
    const n = D.xs.length;
    sk.max = n; sp.max = n;
    if (ttIv(sk) > n) sk.value = n;
    if (ttIv(sp) > n) sp.value = n;
    const k = ttIv(sk), pr = ttIv(sp);
    vk.textContent = k; vp.textContent = pr;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, D.title, C);

    // 上方對照表
    const cw = Math.min(52, 440 / n), x0 = 84 + cw / 2;
    textCenter(ctx, 'x', 50, 60, TT_YEL, fi(800, 16));
    textCenter(ctx, 'y', 50, 88, TT_OK, fi(800, 16));
    D.xs.forEach((xv, i) => {
      const cx = x0 + i * cw;
      const on = i < k;
      textCenter(ctx, String(xv), cx, 60, on ? TT_YEL : DIM, f(800, 14));
      textCenter(ctx, String(D.ys[i]), cx, 88, on ? TT_OK : DIM, f(800, 14));
    });

    const A = ttAxes(ctx, Object.assign({ L: 70, T: 128, W: 420, H: 250, xmin: 0, xmax: n + 1, xstep: 1, skipLast: true }, D.ax));
    // 探針：x = pr 的鉛垂虛線
    const ppx = A.px(D.xs[pr - 1]);
    ttLine(ctx, ppx, A.by, ppx, 128, TT_BLUE, 1.6, [6, 5]);
    for (let i = 0; i < k; i++) {
      const on = (i === pr - 1);
      drawDot(ctx, A.px(D.xs[i]), A.py(D.ys[i]), on ? TT_YEL : C, on ? 7 : 5.5);
    }
    if (pr <= k) {
      ttPtLabel(ctx, ttPt(D.xs[pr - 1], D.ys[pr - 1]), ppx, A.py(D.ys[pr - 1]), TT_YEL);
    }
    const msg = pr <= k
      ? `x = ${D.xs[pr - 1]} 的鉛垂線只碰到 1 個點 (${D.xs[pr - 1]}, ${D.ys[pr - 1]})`
      : `x = ${D.xs[pr - 1]} 的點還沒描上去（把「描到第幾組」往右拉）`;
    textCenter(ctx, msg, W / 2, 440, pr <= k ? TT_YEL : MUTED, f(800, 14.5));

    const pts = [];
    for (let i = 0; i < Math.min(k, 4); i++) pts.push(`(${D.xs[i]}, ${D.ys[i]})`);
    // 每個點各自一段 \( \)，窄螢幕才換得了行（開發約束 24）
    out.innerHTML = `已描 \\(${k}\\) 點：` + pts.map(p => `\\(${p}\\)`).join('、') + (k > 4 ? '、\\(\\cdots\\)' : '');
    fb.innerHTML = wrapFeedback(k < n
      ? `每一組 \\((x, y)\\) 就是一個點。全部 \\(${n}\\) 組都描上去，才是完整的函數圖形。`
      : `\\(${n}\\) 個點就是這個函數的圖形。\\(x\\) 只取 \\(1, 2, 3, \\cdots\\)，點與點之間沒有對應的資料，所以<strong>不連線</strong>。`);
    typeset([out, fb]);
  }

  [sk, sp].forEach(sl => sl.addEventListener('input', draw));
  bindPickGroup(g, 'data-pl-data', v => { key = v; sk.value = 3; sp.value = 1; draw(); });
  draw();
}

/* ==========================================================================
   重點 9：線型函數的圖形——一次函數是斜直線、常數函數是水平線
   ========================================================================== */
function initLineCanvas() {
  const cv = ttEl('canvas-line');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = ttEl('ln-a'), sb = ttEl('ln-b');
  const va = ttEl('ln-va'), vb = ttEl('ln-vb');
  const more = ttEl('ln-more');
  const out = ttEl('ln-formula');
  const fb = ttEl('ln-feedback');
  const C = TT_TONE[8];
  let showMore = false;

  function draw() {
    const A = qOf(ttIv(sa), 2), b = ttIv(sb), B = [b, 1];
    va.innerHTML = `\\(${qTex(A)}\\)`;
    vb.textContent = ttMn(b);
    more.textContent = showMore ? '只留兩點' : '多描一些點';
    more.classList.toggle('active', showMore);
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '描兩點、連成直線：y = ax + b 的圖形', C);
    const P = drawPlane(ctx, { cx: 270, top: 52, unit: 26, min: -6, max: 6, tickFont: f(600, 11.5), labelEvery: 2 });
    ttPlaneLine(ctx, P, qVal(A), b, C, 3);

    // 兩個好描的點：(0, b) 與 x = 2（或 −2、−1、1）
    const p1 = [0, b];
    let p2 = null;
    [2, -2, 4, -4].some(xv => {
      const yv = ttEval(A, B, [xv, 1]);
      if (yv[1] === 1 && Math.abs(yv[0]) <= 6) { p2 = [xv, yv[0]]; return true; }
      return false;
    });
    if (showMore) {
      for (let xv = -6; xv <= 6; xv++) {
        const yv = ttEval(A, B, [xv, 1]);
        if (yv[1] === 1 && Math.abs(yv[0]) <= 6) drawDot(ctx, P.px(xv), P.py(yv[0]), TT_BLUE, 4.2);
      }
    }
    if (Math.abs(b) <= 6) {
      drawDot(ctx, P.px(p1[0]), P.py(p1[1]), TT_YEL, 6.5);
      ttPtLabel(ctx, ttPt(p1[0], p1[1]), P.px(p1[0]), P.py(p1[1]), TT_YEL);
    }
    if (p2) {
      drawDot(ctx, P.px(p2[0]), P.py(p2[1]), TT_YEL, 6.5);
      ttPtLabel(ctx, ttPt(p2[0], p2[1]), P.px(p2[0]), P.py(p2[1]), TT_YEL);
    }

    let kind, col = TT_OK;
    if (A[0] === 0) kind = `a = 0：常數函數 y = ${ttMn(b)}，圖形是水平線`;
    else if (b === 0) kind = 'a ≠ 0、b = 0：一次函數，圖形是通過原點的斜直線';
    else kind = 'a ≠ 0、b ≠ 0：一次函數，圖形是不通過原點的斜直線';
    drawPanel(ctx, 30, 398, W - 60, 78, col, 0.1);
    drawExpr(ctx, ttFnItems(A, B, TT_CREAM), W / 2, 420, 19, TT_CREAM, { maxW: W - 90 });
    textCenter(ctx, kind, W / 2, 458, col, f(800, 13.5));

    out.innerHTML = `\\(y = ${ttLinTex(A, B)}\\) 通過 \\((0, ${b})\\)` + (p2 ? `、\\((${p2[0]}, ${p2[1]})\\)` : '');
    fb.innerHTML = wrapFeedback(showMore
      ? `再多描幾個點，它們全都落在同一條直線上。所以只要描出兩點、連起來，就是整條圖形。`
      : (A[0] === 0
        ? `不論 \\(x\\) 是多少，\\(y\\) 都是 \\(${b}\\)，所有點的高度相同，連起來是水平線。`
        : `一次函數與常數函數的圖形都是直線，合稱<strong>線型函數</strong>。描兩點、連成直線即可。`));
    typeset([va, out, fb]);
  }

  [sa, sb].forEach(sl => sl.addEventListener('input', draw));
  more.addEventListener('click', () => { showMore = !showMore; draw(); });
  draw();
}

/* ==========================================================================
   重點 10：圖形平行 x 軸 → 常數函數 y = k；鉛垂線不是函數的圖形
   ========================================================================== */
function initHorizCanvas() {
  const cv = ttEl('canvas-horiz');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sh = ttEl('hz-h'), sk = ttEl('hz-k');
  const vh = ttEl('hz-vh'), vk = ttEl('hz-vk');
  const g = ttEl('hz-line-group');
  const out = ttEl('hz-formula');
  const fb = ttEl('hz-feedback');
  const C = TT_TONE[9];
  let kind = 'h';

  function draw() {
    const h = ttIv(sh), k = ttIv(sk);
    vh.textContent = ttMn(h); vk.textContent = ttMn(k);
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `通過 (${ttMn(h)}, ${ttMn(k)}) 的直線，是哪一種函數的圖形？`, C);
    const P = drawPlane(ctx, { cx: 270, top: 50, unit: 23, min: -6, max: 6, tickFont: f(600, 11), labelEvery: 2 });
    let l1, l2, col = TT_OK;
    if (kind === 'h') {
      ttPlaneLine(ctx, P, 0, k, TT_OK, 3);
      [-4, -1, 3].forEach(xv => { if (xv !== h) drawDot(ctx, P.px(xv), P.py(k), TT_BLUE, 4.5); });
      l1 = `水平線：每一個 x 都對到 y = ${ttMn(k)}`;
      l2 = `是常數函數 y = ${ttMn(k)}（a = 0），只要一點就決定`;
    } else if (kind === 'v') {
      col = TT_NO;
      ttLine(ctx, P.px(h), P.py(-6), P.px(h), P.py(6), TT_NO, 3);
      [-4, 1, 4].forEach(yv => { if (yv !== k) drawDot(ctx, P.px(h), P.py(yv), TT_BLUE, 4.5); });
      l1 = `鉛垂線 x = ${ttMn(h)}：一個 x 對到無限多個 y`;
      l2 = '不是函數的圖形，更不是線型函數';
    } else {
      col = TT_YEL;
      [[1, TT_YEL], [-0.5, TT_BLUE], [2, TT_RED], [0, TT_OK]].forEach(o => {
        ttPlaneLine(ctx, P, o[0], k - o[0] * h, o[1], 2.2);
      });
      l1 = '通過同一點的線型函數圖形有無限多條';
      l2 = '其中只有一條是水平線：它是常數函數';
    }
    drawDot(ctx, P.px(h), P.py(k), TT_CREAM, 7);
    ttPtLabel(ctx, ttPt(h, k), P.px(h), P.py(k), TT_CREAM);
    drawPanel(ctx, 30, 376, W - 60, 92, col, 0.1);
    textCenter(ctx, l1, W / 2, 404, col, f(800, 15));
    textCenter(ctx, l2, W / 2, 438, INK, f(700, 14));

    if (kind === 'h') {
      out.innerHTML = `\\(y = ${k}\\)（\\(a = 0\\)、\\(b = ${k}\\)）`;
      fb.innerHTML = wrapFeedback(`平行 \\(x\\) 軸的直線上，每個點的 \\(y\\) 坐標都是 \\(${k}\\)，所以函數是 \\(y = ${k}\\)。只看通過那一點的 \\(y\\) 坐標，和 \\(x\\) 坐標 \\(${h}\\) 無關。`);
    } else if (kind === 'v') {
      out.innerHTML = `\\(x = ${h}\\)：不是函數`;
      fb.innerHTML = wrapFeedback(`給定 \\(x = ${h}\\)，直線上有 \\((${h}, -4)\\)、\\((${h}, 1)\\)、\\((${h}, 4)\\)……，\\(y\\) 不只一個，所以 \\(y\\) 不是 \\(x\\) 的函數。`);
    } else {
      out.innerHTML = `通過 \\((${h}, ${k})\\) 的直線有無限多條`;
      fb.innerHTML = wrapFeedback(`只知道「線型函數的圖形通過一點」，函數有無限多種；若還知道它是<strong>常數函數</strong>（平行 \\(x\\) 軸），就只剩 \\(y = ${k}\\) 一種。`);
    }
    typeset([out, fb]);
  }

  [sh, sk].forEach(sl => sl.addEventListener('input', draw));
  bindPickGroup(g, 'data-hz-line', v => { kind = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 11：線型函數的應用——由圖上兩點求函數，再問截距的意義
   ========================================================================== */
const TT_RATES = [[1, 1], [6, 5], [8, 5]];
const TT_DENS = [[6, 5], [7, 5], [3, 2]];

function initReadCanvas() {
  const cv = ttEl('canvas-read');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = ttEl('rd-p'), sr = ttEl('rd-r');
  const vp = ttEl('rd-vp'), vr = ttEl('rd-vr');
  const lp = ttEl('rd-lp'), lr = ttEl('rd-lr');
  const g = ttEl('rd-mode-group');
  const out = ttEl('rd-formula');
  const fb = ttEl('rd-feedback');
  const C = TT_TONE[10];
  let mode = 'toll';

  function setMode(m) {
    mode = m;
    if (m === 'toll') {
      sp.min = 10; sp.max = 30; sp.step = 5; sp.value = 15;
      lp.textContent = '免費里程（公里）'; lr.textContent = '每公里費率';
    } else {
      sp.min = 150; sp.max = 300; sp.step = 25; sp.value = 200;
      lp.textContent = '空杯重（公克）'; lr.textContent = '每 c.c. 果醬重（公克）';
    }
    sr.value = 2;
  }

  function draw() {
    const p = ttIv(sp), ri = ttIv(sr);
    vp.textContent = p;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    let x1, x2, y1, y2, A, rate;
    if (mode === 'toll') {
      rate = TT_RATES[ri - 1];
      vr.innerHTML = `\\(${qTex(rate)}\\) 元`;
      x1 = p + 10; x2 = p + 25;
      y1 = qVal(qMul(rate, 10)); y2 = qVal(qMul(rate, 25));
      drawTitle(ctx, '高速公路通行費：前段免費，超過的部分成線型函數', C);
      A = ttAxes(ctx, { L: 70, T: 62, W: 400, H: 180, xmin: 0, xmax: 60, ymin: 0, ymax: 50, xstep: 10, ystep: 10, xlab: '距離 x（公里）', ylab: '費用 y（元）' });
      ttLine(ctx, A.px(0), A.py(0), A.px(p), A.py(0), C, 3.4);
      ttLine(ctx, A.px(p), A.py(0), A.px(60), A.py(qVal(qMul(rate, 60 - p))), C, 3);
    } else {
      rate = TT_DENS[ri - 1];
      vr.innerHTML = `\\(${qTex(rate)}\\)`;
      x1 = 150; x2 = 250;
      y1 = p + qVal(qMul(rate, 150)); y2 = p + qVal(qMul(rate, 250));
      drawTitle(ctx, '一杯果醬放在磅秤上：重量與杯中果醬體積成線型函數', C);
      A = ttAxes(ctx, { L: 70, T: 62, W: 400, H: 180, xmin: 0, xmax: 300, ymin: 0, ymax: 700, xstep: 50, ystep: 100, xlab: '體積 x（c.c.）', ylab: '重量 y（公克）' });
      ttLine(ctx, A.px(0), A.py(p), A.px(x1), A.py(y1), C, 2.2, [6, 5]);
      ttLine(ctx, A.px(x1), A.py(y1), A.px(300), A.py(p + qVal(qMul(rate, 300))), C, 3);
    }
    [[x1, y1, TT_YEL], [x2, y2, TT_BLUE]].forEach(o => {
      ttLine(ctx, A.px(o[0]), A.py(o[1]), A.px(o[0]), A.by, o[2], 1.4, [4, 4]);
      ttLine(ctx, A.px(o[0]), A.py(o[1]), A.px(0), A.py(o[1]), o[2], 1.4, [4, 4]);
      drawDot(ctx, A.px(o[0]), A.py(o[1]), o[2], 6);
      ttPtLabel(ctx, ttPt(o[0], o[1]), A.px(o[0]), A.py(o[1]), o[2]);
    });

    const a = qOf(y2 - y1, x2 - x1);
    const b = qSub([y1, 1], qMul(a, x1));
    const rows = [];
    rows.push(ttRow('讀兩點', '設 y = ax + b', exprItems(`${y1} = ${x1}a + b`).concat([T('，'), exprSeq(`${y2} = ${x2}a + b`)])));
    rows.push(ttRow('求 a', '兩式相減', [IT('a'), T('='), VF(T(`${y2} − ${y1}`), T(`${x2} − ${x1}`)), T('='), qIt(a)]));
    rows.push(ttRow('求 b', '代回第一式', [IT('b'), T('='), T(y1), T('−'), qIt(qMul(a, x1)), T('='), qIt(b)]));
    rows.push(ttRow('函數', '', ttFnItems(a, b, INK)));
    let ans, msg;
    if (mode === 'toll') {
      rows.push(ttRow('免費里程', '費用 y = 0 時', [T('0'), T('='), SEQ([qIt(a), IT('x')], null, 2), T('−'), qIt([-b[0], b[1]]), T('→', TT_OK), IT('x', TT_OK), T('=', TT_OK), T(p, TT_OK)], TT_OK));
      ans = `x = ${p}`;
      msg = `圖形與 \\(x\\) 軸的交點就是「開始收費」的那一點：令 \\(y = 0\\)，得 \\(x = ${p}\\)，免費里程是 \\(${p}\\) 公里。`;
    } else {
      rows.push(ttRow('空杯重', '杯裡沒有果醬：x = 0', [IT('y', TT_OK), T('=', TT_OK), T(p, TT_OK)], TT_OK));
      ans = `y = ${p}`;
      msg = `杯裡的果醬用完就是 \\(x = 0\\)，此時 \\(y = b = ${p}\\)：圖形與 \\(y\\) 軸的交點是空杯的重量。`;
    }
    drawStepRows(ctx, ttNumber(rows), rows.length, { top: 300, gap: 58, eqX: 150, color: C, size: 19 });

    out.innerHTML = `\\(y = ${ttLinTex(a, b)}\\)，<wbr>\\(${ans}\\)`;
    fb.innerHTML = wrapFeedback(msg);
    typeset([vr, out, fb]);
  }

  [sp, sr].forEach(sl => sl.addEventListener('input', draw));
  bindPickGroup(g, 'data-rd-mode', v => { setMode(v); draw(); });
  setMode('toll');
  draw();
}

/* ==========================================================================
   重點 12：兩個線型函數的比較——函數值相等時，兩條圖形相交
   ========================================================================== */
function initCompareCanvas() {
  const cv = ttEl('canvas-compare');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const s1 = ttEl('cp-b1'), s2 = ttEl('cp-a1'), s3 = ttEl('cp-b2'), s4 = ttEl('cp-a2');
  const v1 = ttEl('cp-vb1'), v2 = ttEl('cp-va1'), v3 = ttEl('cp-vb2'), v4 = ttEl('cp-va2');
  const out = ttEl('cp-formula');
  const fb = ttEl('cp-feedback');
  const C = TT_TONE[11];

  function draw() {
    const b1 = ttIv(s1), a1 = ttIv(s2), b2 = ttIv(s3), a2 = ttIv(s4);
    v1.textContent = b1; v2.textContent = a1; v3.textContent = b2; v4.textContent = a2;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '兩家玩具車出租：租幾小時的費用一樣？', C);
    const A = ttAxes(ctx, { L: 70, T: 62, W: 400, H: 190, xmin: 0, xmax: 8, ymin: 0, ymax: 700, xstep: 1, ystep: 100, xlab: '時間 x（小時）', ylab: '費用 y（元）' });
    ttLine(ctx, A.px(0), A.py(b1), A.px(8), A.py(b1 + 8 * a1), TT_RED, 3);
    ttLine(ctx, A.px(0), A.py(b2), A.px(8), A.py(b2 + 8 * a2), TT_BLUE, 3);
    textLeft(ctx, '甲', A.px(8) + 8, A.py(b1 + 8 * a1), TT_RED, f(800, 15));
    textLeft(ctx, '乙', A.px(8) + 8, A.py(b2 + 8 * a2) + (Math.abs((b1 + 8 * a1) - (b2 + 8 * a2)) < 40 ? 16 : 0), TT_BLUE, f(800, 15));

    const F1 = [[a1, 1], [b1, 1]], F2 = [[a2, 1], [b2, 1]];
    const rows = [];
    rows.push(ttRow('兩個函數', '甲（紅）、乙（藍）', [IT('y', TT_RED), T('=', TT_RED)].concat(ttLinItems(F1[0], F1[1], TT_RED), [T('，'), IT('y', TT_BLUE), T('=', TT_BLUE)], ttLinItems(F2[0], F2[1], TT_BLUE))));
    rows.push(ttRow('費用相同', '兩個函數值相等', ttLinItems(F1[0], F1[1], INK).concat([T('=')], ttLinItems(F2[0], F2[1], INK))));
    let msg, htmlMsg, texOut;
    if (a1 === a2) {
      rows.push(ttRow('整理', 'x 消失了', exprItems(`0 = ${b2 - b1}`, b1 === b2 ? TT_OK : TT_NO), b1 === b2 ? TT_OK : TT_NO));
      msg = b1 === b2 ? '兩家的收費完全相同，兩條圖形重合' : `每小時一樣貴、基本費不同：兩條圖形平行，${b1 < b2 ? '甲' : '乙'}永遠比較便宜`;
      htmlMsg = b1 === b2 ? '兩家的收費完全相同，兩條圖形重合，每個 \\(x\\) 的費用都一樣' : `每小時一樣貴、基本費不同：兩條圖形平行、永遠不會相交，${b1 < b2 ? '甲' : '乙'}永遠比較便宜`;
      texOut = `\\(${a1}x + ${b1} = ${a2}x + ${b2}\\)，<wbr>${b1 === b2 ? '每個 \\(x\\) 都成立' : '無解'}`;
    } else {
      const x = qOf(b2 - b1, a1 - a2);
      const y = qAdd(qMul([a1, 1], x), [b1, 1]);
      rows.push(ttRow('移項', 'x 移到左邊、數移到右邊', exprItems(`${ttCoefStr(a1 - a2, 'x')} = ${b2 - b1}`)));
      rows.push(ttRow('解', '', [IT('x', TT_OK), T('=', TT_OK), qIt(x, TT_OK), T('，', TT_OK), IT('y', TT_OK), T('=', TT_OK), qIt(y, TT_OK)], TT_OK));
      const xv = qVal(x);
      if (xv >= 0 && xv <= 8) {
        drawDot(ctx, A.px(xv), A.py(qVal(y)), TT_YEL, 7);
        ttLine(ctx, A.px(xv), A.py(qVal(y)), A.px(xv), A.by, TT_YEL, 1.4, [4, 4]);
      }
      const cheapBefore = a1 < a2 ? '乙' : '甲';
      const cheapAfter = a1 < a2 ? '甲' : '乙';
      const hrs = ttDec(x) != null ? ttDec(x) : '約 ' + (Math.round(xv * 10) / 10);
      if (xv > 0) {
        msg = `租 ${hrs} 小時兩家一樣貴；之前${cheapBefore}便宜、之後${cheapAfter}便宜`;
        htmlMsg = `租 \\(${qTex(x)}\\) 小時兩家都是 \\(${qTex(y)}\\) 元；比這短${cheapBefore}便宜、比這長${cheapAfter}便宜（每小時比較便宜的那一家，租越久越划算）`;
      } else {
        msg = `相等發生在 x ≤ 0，租車時間 x > 0 時${cheapAfter}一直比較便宜`;
        htmlMsg = `解出 \\(x = ${qTex(x)}\\)，不是正的租車時間；只要 \\(x \\gt 0\\)，${cheapAfter}一直比較便宜`;
      }
      texOut = `\\(${a1}x + ${b1} = ${a2}x + ${b2}\\)，<wbr>\\(x = ${qTex(x)}\\)`;
    }
    drawStepRows(ctx, ttNumber(rows), rows.length, { top: 314, gap: 54, eqX: 150, color: C, size: 19 });
    textCenter(ctx, msg, W / 2, 536, TT_YEL, f(800, 14));

    out.innerHTML = texOut;
    fb.innerHTML = wrapFeedback(htmlMsg + '。兩條圖形的交點，就是兩個函數值相等的那個 \\(x\\)。');
    typeset([out, fb]);
  }

  [s1, s2, s3, s4].forEach(sl => sl.addEventListener('input', draw));
  draw();
}
