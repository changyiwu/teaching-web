/* ==========================================================================
   6-1 垂直、線對稱與三視圖 — 互動 Canvas 與隨堂評量
   畫風：彩色卡紙拼貼風（美勞教室的剪紙、摺紙與積木）

   共用工具在 ../math-canvas.js（T／drawChip／drawTitle／drawDot／drawPanel／
   dashLine／axisArrow／textCenter／textLeft／wrapText／wbrEq／canvasPos／
   bindPickGroup／numStr／clamp／roundRect…），
   本檔只放本節專屬的色票、幾何小工具，以及 13 個互動。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initLineCanvas();
  initAngleCanvas();
  initPolyCanvas();
  initDiagCanvas();
  initPerpCanvas();
  initMidCanvas();
  initSymCanvas();
  initCheckCanvas();
  initAxisCanvas();
  initGridCanvas();
  initCutCanvas();
  initViewCanvas();
  initWhoCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具
   ========================================================================== */

// 卡紙的顏色（PC_ = Paper Craft；共用檔沒有這個前綴的符號）
const PC_RED = '#f87171';
const PC_ORANGE = '#fb923c';
const PC_YELLOW = '#facc15';
const PC_GREEN = '#4ade80';
const PC_BLUE = '#60a5fa';
const PC_PURPLE = '#c084fc';
const PC_PINK = '#f472b6';
const PC_CREAM = '#fef3c7';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const PC_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9', '#fca5a5', '#f0abfc'];

const PC_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// #rrggbb 加透明度
function pcRgba(hex, a) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// 取到小數第 digits 位；exact 表示原本就剛好是這個數
function pcApprox(v, digits) {
  const k = Math.pow(10, digits == null ? 1 : digits);
  const r = Math.round(v * k);
  return { s: numStr(r / k), exact: Math.abs(v * k - r) < 1e-7 };
}

// 「= 5」或「≈ 5.8」（canvas 用）
function pcEq(v, digits) {
  const a = pcApprox(v, digits);
  return (a.exact ? '= ' : '≈ ') + a.s;
}

// 同上，LaTeX 用
function pcEqTex(v, digits) {
  const a = pcApprox(v, digits);
  return (a.exact ? '= ' : '\\approx ') + a.s;
}

// 靠右的一行字
function pcTextRight(ctx, text, x, cy, color, font) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, cy);
  ctx.restore();
}

// 帶深色底的標籤：壓在圖形上也讀得到
function pcLabelBox(ctx, text, cx, cy, color, font) {
  ctx.save();
  ctx.font = font || f(800, 13);
  const w = ctx.measureText(text).width + 10;
  ctx.fillStyle = 'rgba(15,23,42,0.85)';
  roundRect(ctx, cx - w / 2, cy - 10, w, 20, 5);
  ctx.fill();
  ctx.restore();
  textCenter(ctx, text, cx, cy, color, font || f(800, 13));
}

/**
 * 幾何符號：斜體字母加上方的記號，回傳寬度。
 * type：'seg' 線段（橫線）、'ray' 射線（右箭頭）、'line' 直線（雙箭頭）、'none' 只有字母
 */
function pcSymbol(ctx, type, letters, x, cy, color, size) {
  const sz = size || 16;
  ctx.save();
  ctx.font = fi(700, sz);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(letters).width;
  ctx.fillText(letters, x, cy);
  if (type !== 'none') {
    const y = cy - sz * 0.74;
    const hs = Math.max(4.5, sz * 0.3);
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    const head = (tipX, dir) => {
      ctx.beginPath();
      ctx.moveTo(tipX, y);
      ctx.lineTo(tipX - dir * hs, y - hs * 0.62);
      ctx.lineTo(tipX - dir * hs, y + hs * 0.62);
      ctx.closePath();
      ctx.fill();
    };
    if (type === 'ray' || type === 'line') head(x + w + 1.5, 1);
    if (type === 'line') head(x - 1.5, -1);
  }
  ctx.restore();
  return w;
}

// 直角記號：頂點 (x, y)，u、v 是兩邊的單位向量（螢幕座標）
function pcRightMark(ctx, x, y, ux, uy, vx, vy, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x + ux * s, y + uy * s);
  ctx.lineTo(x + ux * s + vx * s, y + uy * s + vy * s);
  ctx.lineTo(x + vx * s, y + vy * s);
  ctx.stroke();
  ctx.restore();
}

// 點選範圍
function pcHit(hits, px, py) {
  for (const b of hits) {
    if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b.id;
  }
  return null;
}

// 離 (px, py) 最近、且在 r 以內的點的索引；沒有就回傳 -1
function pcNearest(pts, px, py, r) {
  let best = -1, bd = r;
  pts.forEach((p, i) => {
    const d = Math.hypot(p[0] - px, p[1] - py);
    if (d <= bd) { bd = d; best = i; }
  });
  return best;
}

// ∠ABC 的度數（三點都是 [x, y]）
function pcAngle(a, b, c) {
  const v1x = a[0] - b[0], v1y = a[1] - b[1];
  const v2x = c[0] - b[0], v2y = c[1] - b[1];
  const cos = (v1x * v2x + v1y * v2y) / (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y));
  return Math.acos(clamp(cos, -1, 1)) * 180 / Math.PI;
}

// 填滿一個多邊形
function pcPoly(ctx, pts, fill, stroke, width) {
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width || 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

// 實線段
function pcLine(ctx, x1, y1, x2, y2, color, width) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

// 等長記號：在線段中點畫 k 條短斜線
function pcTicks(ctx, x1, y1, x2, y2, k, color) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  const nx = -uy, ny = ux;
  for (let i = 0; i < k; i++) {
    const off = (i - (k - 1) / 2) * 5;
    const cx = mx + ux * off, cy = my + uy * off;
    pcLine(ctx, cx - nx * 7 + ux * 2, cy - ny * 7 + uy * 2, cx + nx * 7 - ux * 2, cy + ny * 7 - uy * 2, color, 2);
  }
}

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第二冊 6-1 的 26 題正解
  // 正解字母分布：A 7 題、B 7 題、C 6 題、D 6 題（開發約束 36）
  const answers = {
    '6-1-1': 'C',    // 射線 RQ 與射線 RP：端點 R、都往左
    '6-1-2': 'B',    // 在射線 QP 上但不在線段 PQ 上：R
    '6-1-3': 'D',    // ∠QOS = 61° + 47° = 108°，鈍角
    '6-1-4': 'C',    // ∠1 + ∠2 = ∠ABC
    '6-1-5': 'A',    // 十邊形 10 + 10 + 10 = 30
    '6-1-6': 'B',    // 邊等長不一定是正六邊形
    '6-1-7': 'D',    // 五邊形 PQRST 跳著寫
    '6-1-8': 'B',    // 六邊形 6 × 3 ÷ 2 = 9 條
    '6-1-9': 'A',    // 有直角記號的 PS
    '6-1-10': 'D',   // 距離是垂直線段 AD = 12
    '6-1-11': 'A',   // 18 + 9 = 27
    '6-1-12': 'B',   // 3x + 2 = 5x - 6，x = 4，AB = 28
    '6-1-13': 'D',   // PQ 的對稱線段是 PU，不是 ST
    '6-1-14': 'A',   // ∠T = 112°，TS = 4
    '6-1-15': 'D',   // R、U 不是對稱點
    '6-1-16': 'C',   // AM = 9，互相垂直
    '6-1-17': 'B',   // 字母 N
    '6-1-18': 'C',   // AB = AC 才通過 A
    '6-1-19': 'A',   // 以 x = 2 為軸：(-1, 3)
    '6-1-20': 'D',   // 以 y = x 為軸：(2, 5)
    '6-1-21': 'C',   // 四個洞在左右兩邊、靠近中線
    '6-1-22': 'B',   // 256 - 4 × 8 = 224
    '6-1-23': 'C',   // 右視圖 1、2、3
    '6-1-24': 'A',   // 拿走丙
    '6-1-25': 'A',   // 小芸右面、阿翔左面
    '6-1-26': 'B'    // 後視圖左右翻轉
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
   重點 1：同一個圖形嗎？——直線 L 上三點寫出線段、射線、直線，兩兩比對
   ========================================================================== */
function initLineCanvas() {
  const cv = document.getElementById('canvas-line');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const typeGs = [document.getElementById('ln-type-a'), document.getElementById('ln-type-b')];
  const out = document.getElementById('ln-formula');
  const fb = document.getElementById('ln-feedback');
  const C = PC_TONE[0];
  const NAMES = ['A', 'B', 'C'];
  const PX = [170, 290, 410];
  const ROW_Y = [112, 232];
  const OV_Y = 346;
  const FIG_COL = [PC_ORANGE, PC_BLUE];
  const TYPE_NAME = { seg: '線段', ray: '射線', line: '直線' };
  const TEX = { seg: 'overline', ray: 'overrightarrow', line: 'overleftrightarrow' };
  const figs = [{ type: 'seg', p: 0, q: 1 }, { type: 'seg', p: 1, q: 0 }];
  const pending = [null, null];

  // 圖形在直線上佔的範圍（三點的位置是 0、1、2）
  function span(fg) {
    if (fg.type === 'seg') return [Math.min(fg.p, fg.q), Math.max(fg.p, fg.q)];
    if (fg.type === 'line') return [-Infinity, Infinity];
    return fg.q > fg.p ? [fg.p, Infinity] : [-Infinity, fg.p];
  }

  function letters(fg) {
    return NAMES[fg.p] + NAMES[fg.q];
  }

  function tex(fg) {
    return `\\${TEX[fg.type]}{${letters(fg)}}`;
  }

  function baseLine(y) {
    pcLine(ctx, 30, y, 510, y, 'rgba(203,213,225,0.3)', 2);
    textLeft(ctx, 'L', 514, y, MUTED, fi(700, 15));
  }

  function endDot(x, y, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 無限延伸的那一端淡出，不畫箭頭（課本的圖就是這樣畫）
  function drawFig(fg, y, color, width) {
    const s = span(fg);
    const x1 = s[0] === -Infinity ? 30 : PX[s[0]];
    const x2 = s[1] === Infinity ? 510 : PX[s[1]];
    ctx.save();
    const g = ctx.createLinearGradient(30, 0, 510, 0);
    g.addColorStop(0, pcRgba(color, s[0] === -Infinity ? 0 : 1));
    g.addColorStop(0.17, pcRgba(color, 1));
    g.addColorStop(0.83, pcRgba(color, 1));
    g.addColorStop(1, pcRgba(color, s[1] === Infinity ? 0 : 1));
    ctx.strokeStyle = g;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.restore();
    if (fg.type === 'seg') {
      endDot(PX[s[0]], y, color);
      endDot(PX[s[1]], y, color);
    } else if (fg.type === 'ray') {
      endDot(PX[fg.p], y, color);
    }
  }

  function drawPoints(y, ringIdx) {
    PX.forEach((x, i) => {
      ctx.save();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      if (i === ringIdx) {
        ctx.strokeStyle = PC_YELLOW;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      textCenter(ctx, NAMES[i], x, y - 22, INK, fi(700, 16));
    });
  }

  function reason() {
    const [a, b] = figs;
    const sa = span(a), sb = span(b);
    const same = sa[0] === sb[0] && sa[1] === sb[1];
    if (a.type !== b.type) {
      return { same, text: `一個是${TYPE_NAME[a.type]}、一個是${TYPE_NAME[b.type]}，延伸的情形不同` };
    }
    if (a.p === b.p && a.q === b.q) {
      return { same, text: '兩個寫法一模一樣' };
    }
    if (a.type === 'line') {
      return { same, text: '直線 L 上任取兩點，決定的都是同一條直線 L' };
    }
    if (a.type === 'seg') {
      return same
        ? { same, text: `兩個端點都是 ${NAMES[sa[0]]} 和 ${NAMES[sa[1]]}，只是字母順序對調` }
        : { same, text: '兩條線段的端點不一樣，是不同的線段' };
    }
    const dirA = a.q > a.p ? '右' : '左';
    const dirB = b.q > b.p ? '右' : '左';
    if (a.p !== b.p) {
      return { same, text: `端點不同：一條從 ${NAMES[a.p]} 出發，一條從 ${NAMES[b.p]} 出發` };
    }
    if (dirA !== dirB) {
      return { same, text: `端點都是 ${NAMES[a.p]}，但一條往${dirA}、一條往${dirB}延伸` };
    }
    return { same, text: `端點都是 ${NAMES[a.p]}，也都往${dirA}延伸，只是寫的第二個點不同` };
  }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '直線 L 上依序有 A、B、C 三點', C);

    figs.forEach((fg, k) => {
      const y = ROW_Y[k];
      const head = `${['甲', '乙'][k]}：${TYPE_NAME[fg.type]}`;
      textLeft(ctx, head, 24, y - 50, FIG_COL[k], f(800, 16));
      ctx.save();
      ctx.font = f(800, 16);
      const hw = ctx.measureText(head).width;
      ctx.restore();
      pcSymbol(ctx, fg.type, letters(fg), 24 + hw + 10, y - 50, FIG_COL[k], 17);
      if (pending[k] !== null) {
        pcTextRight(ctx, `已點 ${NAMES[pending[k]]}，再點第二個點`, 516, y - 50, PC_YELLOW, f(800, 13));
      } else {
        pcTextRight(ctx, '依序點兩個點改寫法', 516, y - 50, MUTED, f(600, 12.5));
      }
      baseLine(y);
      drawFig(fg, y, FIG_COL[k], 7);
      drawPoints(y, pending[k]);
    });

    textLeft(ctx, '疊在一起比對', 24, OV_Y - 46, INK, f(800, 15));
    baseLine(OV_Y);
    drawFig(figs[0], OV_Y - 6, FIG_COL[0], 6);
    drawFig(figs[1], OV_Y + 6, FIG_COL[1], 6);
    drawPoints(OV_Y, null);

    const r = reason();
    const col = r.same ? OK_COLOR : NO_COLOR;
    drawChip(ctx, 160, 388, 220, 36, r.same ? '同一個圖形' : '不是同一個圖形', col, pcRgba(col, 0.12));
    wrapText(ctx, r.text, 270, 452, 480, 22, INK, 15);

    const rel = r.same ? '=' : '\\ne';
    out.innerHTML = `甲 \\(${tex(figs[0])}\\)，乙 \\(${tex(figs[1])}\\)：<wbr>\\(${tex(figs[0])} ${rel} ${tex(figs[1])}\\)`;
    const tip = figs.some(fg => fg.type === 'ray')
      ? '射線要看<b style="color:' + C + '">端點</b>（寫在前面的字母）與<b style="color:' + C + '">延伸方向</b>。'
      : '線段看兩個端點；直線只要在同一條線上，怎麼取兩點都一樣。';
    fb.innerHTML = wrapFeedback(`${r.text}。${tip}`);
    typeset([out, fb]);
  }

  cv.addEventListener('click', e => {
    const p = canvasPos(cv, e);
    for (let k = 0; k < 2; k++) {
      if (Math.abs(p.y - ROW_Y[k]) > 40) continue;
      const i = PX.findIndex(x => Math.abs(p.x - x) < 32);
      if (i < 0) return;
      if (pending[k] === null) pending[k] = i;
      else if (pending[k] === i) pending[k] = null;
      else {
        figs[k].p = pending[k];
        figs[k].q = i;
        pending[k] = null;
      }
      draw();
      return;
    }
  });
  typeGs.forEach((g, k) => bindPickGroup(g, 'data-ln-type', v => { figs[k].type = v; draw(); }));
  draw();
}

/* ==========================================================================
   重點 2：拼角台——四條射線共用頂點 A，選兩條看角的名稱、度數與種類
   ========================================================================== */
function initAngleCanvas() {
  const cv = document.getElementById('canvas-angle');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sliders = ['ag-a1', 'ag-a2', 'ag-a3'].map(id => document.getElementById(id));
  const vals = ['ag-a1-val', 'ag-a2-val', 'ag-a3-val'].map(id => document.getElementById(id));
  const pickG = document.getElementById('ag-pick-group');
  const out = document.getElementById('ag-formula');
  const fb = document.getElementById('ag-feedback');
  const C = PC_TONE[1];
  const RAY = ['B', 'C', 'D', 'E'];
  const PART_COL = [PC_ORANGE, PC_GREEN, PC_PINK];
  const AX = 270, AY = 300, LEN = 200;
  let pick = [0, 2];

  function kind(deg) {
    if (deg < 90) return '銳角';
    if (deg === 90) return '直角';
    if (deg < 180) return '鈍角';
    return '平角';
  }

  function draw() {
    const parts = sliders.map(s => parseInt(s.value, 10));
    parts.forEach((v, i) => { vals[i].textContent = v + '°'; });
    const dirs = [0, parts[0], parts[0] + parts[1], parts[0] + parts[1] + parts[2]];
    const [i, j] = pick;
    const deg = dirs[j] - dirs[i];
    const name = `∠${RAY[i]}A${RAY[j]}`;
    const rad = d => d * Math.PI / 180;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '四條射線 AB、AC、AD、AE 共用頂點 A', C);

    // 選中的角
    ctx.save();
    ctx.fillStyle = pcRgba(C, 0.16);
    ctx.beginPath();
    ctx.moveTo(AX, AY);
    ctx.arc(AX, AY, 150, -rad(dirs[j]), -rad(dirs[i]));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = C;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(AX, AY, 150, -rad(dirs[j]), -rad(dirs[i]));
    ctx.stroke();
    ctx.restore();

    // 三個小角
    parts.forEach((v, k) => {
      const r = 58 + k * 26;
      ctx.save();
      ctx.strokeStyle = PART_COL[k];
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(AX, AY, r, -rad(dirs[k + 1]), -rad(dirs[k]));
      ctx.stroke();
      ctx.restore();
      const mid = rad(dirs[k] + v / 2);
      pcLabelBox(ctx, v + '°', AX + (r + 2) * Math.cos(mid), AY - (r + 2) * Math.sin(mid), PART_COL[k], f(800, 13));
    });

    // 射線
    dirs.forEach((d, k) => {
      const on = k === i || k === j;
      const ex = AX + LEN * Math.cos(rad(d)), ey = AY - LEN * Math.sin(rad(d));
      pcLine(ctx, AX, AY, ex, ey, on ? '#f8fafc' : INK, on ? 3.2 : 2);
      textCenter(ctx, RAY[k], AX + (LEN + 20) * Math.cos(rad(d)), AY - (LEN + 20) * Math.sin(rad(d)), on ? '#f8fafc' : INK, fi(700, 17));
    });
    drawDot(ctx, AX, AY, C, 5);
    textCenter(ctx, 'A', AX + 4, AY + 22, '#f8fafc', fi(700, 17));

    // 算式
    drawPanel(ctx, 20, 346, 500, 184, C, 0.06);
    const used = [];
    for (let k = i; k < j; k++) used.push(k);
    if (used.length > 1) {
      const pieceNames = used.map(k => `∠${RAY[k]}A${RAY[k + 1]}`).join(' + ');
      textCenter(ctx, `${name} = ${pieceNames}`, 270, 374, INK, f(800, 16));
      textCenter(ctx, `= ${used.map(k => parts[k] + '°').join(' + ')} = ${deg}°`, 270, 404, C, f(800, 17));
    } else {
      textCenter(ctx, `${name} 是相鄰兩條射線夾的角`, 270, 374, INK, f(800, 16));
      textCenter(ctx, `${name} = ${deg}°`, 270, 404, C, f(800, 17));
    }
    const kcol = deg === 90 ? PC_YELLOW : (deg === 180 ? PC_PURPLE : C);
    drawChip(ctx, 200, 424, 140, 34, kind(deg), kcol, pcRgba(kcol, 0.12));
    textCenter(ctx, '頂點 A 寫在中間；以 A 為頂點的角有 6 個', 270, 484, MUTED, f(700, 13.5));
    textCenter(ctx, '所以不能簡記成 ∠A', 270, 508, MUTED, f(700, 13.5));

    const nameTex = `\\angle ${RAY[i]}A${RAY[j]}`;
    out.innerHTML = used.length > 1
      ? wbrEq(`${nameTex} = ${used.map(k => parts[k] + '^\\circ').join(' + ')} = ${deg}^\\circ`)
      : `\\(${nameTex} = ${deg}^\\circ\\)`;
    const range = { '銳角': '小於 \\(90^\\circ\\)', '直角': '等於 \\(90^\\circ\\)', '鈍角': '大於 \\(90^\\circ\\)、小於 \\(180^\\circ\\)', '平角': '等於 \\(180^\\circ\\)，兩邊成一直線' }[kind(deg)];
    fb.innerHTML = wrapFeedback(`\\(${nameTex}\\) 也可以寫成 \\(\\angle ${RAY[j]}A${RAY[i]}\\)。它${range}，是<b style="color:${C}">${kind(deg)}</b>。`);
    typeset([out, fb]);
  }

  sliders.forEach(s => s.addEventListener('input', draw));
  bindPickGroup(pickG, 'data-ag-pick', v => { pick = v.split(',').map(Number); draw(); });
  draw();
}

/* ==========================================================================
   重點 3：紙條多邊形工作台——邊都等長、角都相等，兩個條件分開看
   ========================================================================== */

// 回傳多邊形頂點（數學座標，y 向上）與是否做得出來
function pgBuild(n, kind) {
  const ext = 2 * Math.PI / n;
  const TAU = 2 * Math.PI;
  if (n === 3 && (kind === 'side' || kind === 'angle')) kind = 'regular-forced';
  let dirs = [], lens = [];
  if (kind === 'regular' || kind === 'regular-forced') {
    for (let i = 0; i < n; i++) { dirs.push(i * ext); lens.push(1); }
  } else if (kind === 'side') {
    // 前 n-2 條邊自己決定方向，最後兩條單位長的邊負責接回起點
    const D = [0.34, -0.24, 0.3, -0.2, 0.26, -0.28];
    dirs.push(0); lens.push(1);
    let th = 0;
    // 邊數多時外角本來就小，推開的量跟著縮，否則會出現將近 180° 的角、看起來少一個頂點
    const amp = Math.min(1, 5 / n);
    for (let i = 1; i < n - 2; i++) { th += ext + D[i - 1] * amp; dirs.push(th); lens.push(1); }
    let rx = 0, ry = 0;
    dirs.forEach(d => { rx -= Math.cos(d); ry -= Math.sin(d); });
    const m = Math.hypot(rx, ry);
    const phi = Math.atan2(ry, rx);
    const al = Math.acos(Math.min(1, m / 2));
    const last = dirs[dirs.length - 1];
    let d1 = phi - al, d2 = phi + al;
    while (d1 <= last) d1 += TAU;
    while (d2 <= last) d2 += TAU;
    if (d2 < d1) { const t = d1; d1 = d2; d2 = t; }
    dirs.push(d1, d2); lens.push(1, 1);
  } else if (kind === 'angle') {
    // 每個外角都一樣，前 n-2 條邊長度不同，最後兩條的長度解聯立
    const P = [0.5, -0.3, 0.42, -0.26, 0.36, -0.34];
    for (let i = 0; i < n; i++) dirs.push(i * ext);
    for (let i = 0; i < n - 2; i++) lens.push(1 + P[i]);
    let sx = 0, sy = 0;
    for (let i = 0; i < n - 2; i++) { sx += lens[i] * Math.cos(dirs[i]); sy += lens[i] * Math.sin(dirs[i]); }
    const ax = Math.cos(dirs[n - 2]), ay = Math.sin(dirs[n - 2]);
    const bx = Math.cos(dirs[n - 1]), by = Math.sin(dirs[n - 1]);
    const det = ax * by - ay * bx;
    lens.push((-sx * by + sy * bx) / det, (-sy * ax + sx * ay) / det);
  } else {
    // 邊、角都不相等：把正多邊形的頂點各自推開一點
    const A = [0.0, 0.2, -0.14, 0.18, -0.2, 0.12, -0.1, 0.16];
    const R = [0.0, -0.14, 0.12, -0.08, 0.16, -0.12, 0.1, -0.16];
    const pts = [];
    const amp = Math.min(1, 5 / n);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 - ext / 2 + i * ext + A[i] * ext * amp;
      const r = 1 + R[i] * amp;
      pts.push([r * Math.cos(a), r * Math.sin(a)]);
    }
    return { pts, possible: true };
  }
  const pts = [[0, 0]];
  for (let i = 0; i < n - 1; i++) {
    const p = pts[i];
    pts.push([p[0] + lens[i] * Math.cos(dirs[i]), p[1] + lens[i] * Math.sin(dirs[i])]);
  }
  return { pts, possible: kind !== 'regular-forced' };
}

function initPolyCanvas() {
  const cv = document.getElementById('canvas-poly');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const nG = document.getElementById('pg-n-group');
  const kindG = document.getElementById('pg-kind-group');
  const out = document.getElementById('pg-formula');
  const fb = document.getElementById('pg-feedback');
  const C = PC_TONE[2];
  const NAME = { 3: '三角形', 4: '四邊形', 5: '五邊形', 6: '六邊形', 7: '七邊形', 8: '八邊形' };
  let n = 5, kind = 'side';

  function draw() {
    const res = pgBuild(n, kind);
    const raw = res.pts;
    // 算邊長與內角（用數學座標）
    const sides = raw.map((p, k) => Math.hypot(raw[(k + 1) % n][0] - p[0], raw[(k + 1) % n][1] - p[1]));
    const mean = sides.reduce((a, b) => a + b, 0) / n;
    const cm = sides.map(s => s / mean * 3);
    const angles = raw.map((p, k) => pcAngle(raw[(k + n - 1) % n], p, raw[(k + 1) % n]));
    const sideEq = Math.max(...cm) - Math.min(...cm) < 1e-6;
    const angEq = Math.max(...angles) - Math.min(...angles) < 1e-6;

    // 放進畫布：數學座標 y 向上，畫布 y 向下
    const xs = raw.map(p => p[0]), ys = raw.map(p => p[1]);
    const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    const sc = Math.min(330 / w, 250 / h);
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    const pts = raw.map(p => [270 + (p[0] - cx) * sc, 205 - (p[1] - cy) * sc]);
    const gx = pts.reduce((a, p) => a + p[0], 0) / n, gy = pts.reduce((a, p) => a + p[1], 0) / n;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `用紙條圍一個${NAME[n]}`, C);
    pcPoly(ctx, pts, pcRgba(C, 0.18), C, 3);

    pts.forEach((p, k) => {
      const q = pts[(k + 1) % n];
      if (sideEq) pcTicks(ctx, p[0], p[1], q[0], q[1], 1, PC_YELLOW);
      // 邊長標在外側
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      const dx = mx - gx, dy = my - gy, dl = Math.hypot(dx, dy) || 1;
      pcLabelBox(ctx, pcApprox(cm[k], 1).s.replace(/^(\d+)$/, '$1.0'), mx + dx / dl * 22, my + dy / dl * 22, PC_YELLOW, f(800, 12.5));
      // 頂點字母在外、角度在內
      const vx = p[0] - gx, vy = p[1] - gy, vl = Math.hypot(vx, vy) || 1;
      textCenter(ctx, PC_LETTERS[k], p[0] + vx / vl * 20, p[1] + vy / vl * 20, '#f8fafc', fi(700, 15));
      textCenter(ctx, Math.round(angles[k]) + '°', p[0] - vx / vl * 30, p[1] - vy / vl * 30, PC_ORANGE, f(800, 12.5));
    });

    drawPanel(ctx, 20, 360, 500, 160, C, 0.06);
    textCenter(ctx, `${n} 個頂點、${n} 條邊、${n} 個內角`, 270, 384, '#f8fafc', f(800, 16));
    textLeft(ctx, '邊長（公分）', 40, 416, MUTED, f(700, 13));
    textLeft(ctx, sideEq ? '都等長 ✓' : '不全等長 ✗', 150, 416, sideEq ? OK_COLOR : NO_COLOR, f(800, 14));
    textLeft(ctx, '內角', 290, 416, MUTED, f(700, 13));
    textLeft(ctx, angEq ? '都相等 ✓' : '不全相等 ✗', 340, 416, angEq ? OK_COLOR : NO_COLOR, f(800, 14));

    let verdict, vcol;
    if (!res.possible) {
      verdict = '做不出來';
      vcol = NO_COLOR;
    } else if (sideEq && angEq) {
      verdict = `是正${NAME[n]}`;
      vcol = OK_COLOR;
    } else {
      verdict = '不是正多邊形';
      vcol = NO_COLOR;
    }
    drawChip(ctx, 180, 436, 180, 36, verdict, vcol, pcRgba(vcol, 0.12));
    let note;
    if (!res.possible && kind === 'side') note = '三邊等長的三角形，三個角一定都相等（上面畫的就是）';
    else if (!res.possible) note = '三個角都相等的三角形，三邊一定等長（上面畫的就是）';
    else if (sideEq && angEq) note = '邊都等長，而且角都相等';
    else if (sideEq) note = '邊都等長，但角不相等——只有一個條件不夠';
    else if (angEq) note = '角都相等，但邊不等長——只有一個條件不夠';
    else note = '邊不全等長，角也不全相等';
    textCenter(ctx, note, 270, 496, res.possible ? INK : PC_YELLOW, f(700, 14));

    out.innerHTML = `${NAME[n]}：${n} 個頂點、${n} 條邊、${n} 個內角；邊${sideEq ? '都等長' : '不全等長'}、角${angEq ? '都相等' : '不全相等'}`;
    let msg;
    if (!res.possible) {
      msg = `三角形很特別：${kind === 'side' ? '三邊等長，三個角就一定相等' : '三個角都相等，三邊就一定等長'}，所以做不出「只有一個條件」的三角形。<b style="color:${C}">等邊三角形就是正三角形</b>。`;
    } else if (sideEq && angEq) {
      msg = `所有邊都等長、所有內角也都相等，才是<b style="color:${C}">正多邊形</b>。`;
    } else if (sideEq || angEq) {
      msg = `正多邊形要<b style="color:${C}">兩個條件同時成立</b>：${sideEq ? '這個圖形的邊都等長，但角不相等' : '這個圖形的角都相等，但邊不等長'}，不是正${NAME[n]}。`;
    } else {
      msg = '邊與角都不相等，是一般的多邊形。';
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(nG, 'data-pg-n', v => { n = parseInt(v, 10); draw(); });
  bindPickGroup(kindG, 'data-pg-kind', v => { kind = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 4：頂點連連看——依序點頂點寫出名稱；或點一個頂點畫出所有對角線
   ========================================================================== */
function initDiagCanvas() {
  const cv = document.getElementById('canvas-diag');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const nG = document.getElementById('dg-n-group');
  const modeG = document.getElementById('dg-mode-group');
  const resetBtn = document.getElementById('dg-reset');
  const out = document.getElementById('dg-formula');
  const fb = document.getElementById('dg-feedback');
  const C = PC_TONE[3];
  const NAME = { 4: '四邊形', 5: '五邊形', 6: '六邊形', 7: '七邊形' };
  const OFF = [0, 0.14, -0.1, 0.12, -0.12, 0.08, -0.06];
  const RAD = [1, 0.9, 1.03, 0.92, 1.02, 0.94, 1];
  let n = 5, mode = 'label';
  let seq = [];
  let from = 0;

  function pts() {
    const ext = 2 * Math.PI / n;
    return Array.from({ length: n }, (_, i) => {
      const a = -Math.PI / 2 + i * ext + OFF[i] * ext;
      return [270 + 136 * RAD[i] * Math.cos(a), DG_CY + 136 * RAD[i] * Math.sin(a)];
    });
  }
  // 頂端的字母要離標題一段距離、底端的字母不能壓到下方面板
  const DG_CY = 220;

  const adj = (a, b) => ((a - b + n) % n === 1) || ((b - a + n) % n === 1);

  function drawVertices(P, hi) {
    P.forEach((p, i) => {
      const on = hi.includes(i);
      ctx.save();
      ctx.fillStyle = on ? C : '#f8fafc';
      ctx.beginPath();
      ctx.arc(p[0], p[1], on ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      const dx = p[0] - 270, dy = p[1] - DG_CY, dl = Math.hypot(dx, dy);
      textCenter(ctx, PC_LETTERS[i], p[0] + dx / dl * 24, p[1] + dy / dl * 24, on ? C : '#f8fafc', fi(700, 17));
    });
  }

  function drawLabelMode(P) {
    drawTitle(ctx, `依序點頂點，寫出這個${NAME[n]}的名稱`, C);
    pcPoly(ctx, P, pcRgba(C, 0.1), 'rgba(203,213,225,0.35)', 2);
    let bad = false;
    for (let k = 1; k < seq.length; k++) {
      const a = P[seq[k - 1]], b = P[seq[k]];
      const ok = adj(seq[k - 1], seq[k]);
      if (!ok) bad = true;
      pcLine(ctx, a[0], a[1], b[0], b[1], ok ? PC_GREEN : NO_COLOR, 4);
    }
    const done = seq.length === n;
    if (done) {
      const a = P[seq[n - 1]], b = P[seq[0]];
      const ok = adj(seq[n - 1], seq[0]);
      if (!ok) bad = true;
      pcLine(ctx, a[0], a[1], b[0], b[1], ok ? PC_GREEN : NO_COLOR, 4);
    }
    drawVertices(P, seq);

    drawPanel(ctx, 20, 390, 500, 130, C, 0.06);
    const written = seq.map(i => PC_LETTERS[i]).join('');
    textCenter(ctx, `${NAME[n]} ${written || '＿'}`, 270, 418, '#f8fafc', f(800, 20));
    let line1, line2, col = INK;
    if (seq.length === 0) {
      line1 = '從任何一個頂點開始點';
      line2 = '綠線是沿著邊走，紅線是跳過頂點';
    } else if (bad) {
      line1 = '有一段是紅線：跳過了相鄰的頂點';
      line2 = '連出來的線會穿過圖形內部，不能這樣標示';
      col = NO_COLOR;
    } else if (!done) {
      line1 = `已經點了 ${seq.length} 個，還差 ${n - seq.length} 個`;
      line2 = '沿著順時針或逆時針方向一個接一個';
    } else {
      line1 = '可以！沿著邊繞了一圈';
      line2 = '從別的頂點出發，或反方向繞，也都可以';
      col = OK_COLOR;
    }
    textCenter(ctx, line1, 270, 458, col, f(800, 15));
    textCenter(ctx, line2, 270, 488, MUTED, f(700, 13.5));

    out.innerHTML = seq.length ? `目前寫成：${NAME[n]} ${written}` : '還沒有點任何頂點';
    let msg;
    if (bad) msg = `標示多邊形要<b style="color:${C}">沿著邊</b>依序寫頂點；跳過相鄰的頂點，連出來的是對角線，不是邊。`;
    else if (done) msg = `從任意一個頂點開始，<b style="color:${C}">順時針或逆時針</b>依序寫，都是同一個${NAME[n]}。`;
    else msg = '點錯了可以按「重來」。';
    fb.innerHTML = wrapFeedback(msg);
  }

  function drawDiagMode(P) {
    drawTitle(ctx, '點一個頂點，畫出從它出發的所有對角線', C);
    pcPoly(ctx, P, pcRgba(C, 0.1), 'rgba(203,213,225,0.35)', 2);
    const s = from;
    const prev = (s + n - 1) % n, next = (s + 1) % n;
    const diags = [];
    for (let k = 0; k < n; k++) if (k !== s && k !== prev && k !== next) diags.push(k);
    [prev, next].forEach(k => pcLine(ctx, P[s][0], P[s][1], P[k][0], P[k][1], PC_BLUE, 4));
    diags.forEach(k => {
      ctx.save();
      ctx.setLineDash([9, 6]);
      pcLine(ctx, P[s][0], P[s][1], P[k][0], P[k][1], C, 3);
      ctx.restore();
    });
    drawVertices(P, [s]);

    drawPanel(ctx, 20, 390, 500, 130, C, 0.06);
    const S = PC_LETTERS[s];
    textCenter(ctx, `從 ${S} 出發：不能連到 ${S} 自己，`, 270, 414, INK, f(700, 14.5));
    textCenter(ctx, `也不能連到相鄰的 ${PC_LETTERS[prev]}、${PC_LETTERS[next]}（藍線是邊）`, 270, 438, PC_BLUE, f(700, 14.5));
    textCenter(ctx, `對角線有 ${n} − 3 = ${diags.length} 條：`, 270, 470, C, f(800, 16));
    // 對角線名稱加橫線
    ctx.save();
    ctx.font = fi(700, 17);
    const gap = 16;
    const widths = diags.map(k => ctx.measureText(S + PC_LETTERS[k]).width);
    ctx.restore();
    const total = widths.reduce((a, b) => a + b, 0) + gap * (diags.length - 1);
    let x = 270 - total / 2;
    diags.forEach((k, idx) => {
      pcSymbol(ctx, 'seg', S + PC_LETTERS[k], x, 502, C, 17);
      x += widths[idx] + gap;
    });

    out.innerHTML = `從 \\(${S}\\) 出發的對角線：` + diags.map(k => `\\(\\overline{${S}${PC_LETTERS[k]}}\\)`).join('、') + `，共 \\(${n} - 3 = ${diags.length}\\) 條`;
    fb.innerHTML = wrapFeedback(`對角線連接<b style="color:${C}">不相鄰</b>的兩個頂點。每個頂點都一樣：扣掉自己和兩旁的頂點，剩下的都能連。`);
  }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    const P = pts();
    if (mode === 'label') drawLabelMode(P);
    else drawDiagMode(P);
    typeset([out, fb]);
  }

  cv.addEventListener('click', e => {
    const p = canvasPos(cv, e);
    const i = pcNearest(pts(), p.x, p.y, 34);
    if (i < 0) return;
    if (mode === 'label') {
      if (seq.length === n) seq = [];
      if (!seq.includes(i)) seq.push(i);
    } else {
      from = i;
    }
    draw();
  });
  bindPickGroup(nG, 'data-dg-n', v => { n = parseInt(v, 10); seq = []; from = 0; draw(); });
  bindPickGroup(modeG, 'data-dg-mode', v => { mode = v; draw(); });
  resetBtn.addEventListener('click', () => { seq = []; from = 0; draw(); });
  draw();
}

/* ==========================================================================
   重點 5：最短的那一條——移動直線上的點 P，看 AP 什麼時候最短
   ========================================================================== */
function initPerpCanvas() {
  const cv = document.getElementById('canvas-perp');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const hS = document.getElementById('pp-h');
  const xS = document.getElementById('pp-x');
  const hV = document.getElementById('pp-h-val');
  const xV = document.getElementById('pp-x-val');
  const tiltG = document.getElementById('pp-tilt-group');
  const out = document.getElementById('pp-formula');
  const fb = document.getElementById('pp-feedback');
  const C = PC_TONE[4];
  const U = 30, FX = 270, FY = 250;
  let tilt = 'flat';

  function draw() {
    const h = parseInt(hS.value, 10);
    const x = parseFloat(xS.value);
    hV.textContent = h;
    xV.textContent = numStr(x);
    const phi = tilt === 'tilt' ? 25 * Math.PI / 180 : 0;
    const ex = Math.cos(phi), ey = Math.sin(phi);
    const nx = -Math.sin(phi), ny = Math.cos(phi);
    const S = (a, b) => [FX + a * U, FY - b * U];
    const A = S(h * nx, h * ny);
    const F = S(0, 0);
    const P = S(x * ex, x * ey);
    const ap = Math.hypot(x, h);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `直線 L 外一點 A，A 到 L 的垂足是 F`, C);

    const L1 = S(-9 * ex, -9 * ey), L2 = S(9 * ex, 9 * ey);
    pcLine(ctx, L1[0], L1[1], L2[0], L2[1], INK, 2.5);
    const LL = S(8.4 * ex - 0.6 * nx, 8.4 * ey - 0.6 * ny);
    textCenter(ctx, 'L', LL[0], LL[1] + 16, INK, fi(700, 16));

    // 正下方的點 V（只有斜的 L 才和 F 不同）
    // 先畫所有的線，長度標籤最後才畫，才不會被線壓住
    const labels = [];
    let av = null, V = null;
    if (tilt === 'tilt') {
      const tv = h * nx / ex;
      V = S(tv * ex, tv * ey);
      av = h / Math.cos(phi);
      dashLine(ctx, A[0], A[1], V[0], V[1], PC_PINK, [6, 5]);
      // 標在 V 的下方（直線 L 的另一側），避開 AP 與 AF
      labels.push([`AV ${pcEq(av)}`, V[0] + 4, V[1] + 40, PC_PINK, f(800, 12.5)]);
    }

    // 垂線段 AF
    dashLine(ctx, A[0], A[1], F[0], F[1], C, [7, 5]);
    pcRightMark(ctx, F[0], F[1], ex, -ey, nx, -ny, 13, C);
    // AF 的標籤放在 P 的另一側，避開 AP
    const afSide = x > 0 ? -1 : 1;
    labels.push([`AF = ${h}`, (A[0] + F[0]) / 2 + afSide * 42 * ex, (A[1] + F[1]) / 2 - afSide * 42 * ey + 10, C, f(800, 12.5)]);

    // AP
    if (x !== 0) {
      pcLine(ctx, A[0], A[1], P[0], P[1], PC_ORANGE, 3.5);
      const ang = pcAngle(A, P, F);
      labels.push([`AP ${pcEq(ap)}`, (A[0] + P[0]) / 2 + (x > 0 ? 44 : -44), (A[1] + P[1]) / 2, PC_ORANGE, f(800, 12.5)]);
      labels.push([`∠APF ≈ ${Math.round(ang)}°`, P[0] + (x > 0 ? 30 : -30), P[1] + 30, PC_ORANGE, f(800, 12)]);
    }
    if (V) {
      drawDot(ctx, V[0], V[1], PC_PINK, 5);
      textCenter(ctx, 'V', V[0] - 14, V[1] + 16, PC_PINK, fi(700, 15));
    }
    labels.forEach(l => pcLabelBox(ctx, l[0], l[1], l[2], l[3], l[4]));
    drawDot(ctx, F[0], F[1], C, 5);
    textCenter(ctx, 'F', F[0] + (x === 0 ? -16 : 0), F[1] + 20, C, fi(700, 15));
    drawDot(ctx, P[0], P[1], PC_ORANGE, 6);
    textCenter(ctx, 'P', P[0] + (x === 0 ? 16 : 0), P[1] + 20, PC_ORANGE, fi(700, 15));
    drawDot(ctx, A[0], A[1], PC_YELLOW, 6);
    textCenter(ctx, 'A', A[0], A[1] - 18, PC_YELLOW, fi(700, 16));

    // AP 的長度隨 P 的位置變化
    const GX = u => 270 + u * 33, GY = v => 500 - v * 11;
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(52, 500);
    ctx.lineTo(486, 500);
    ctx.moveTo(52, 500);
    ctx.lineTo(52, 398);
    ctx.stroke();
    ctx.restore();
    axisArrow(ctx, 486, 500, 'right', INK);
    axisArrow(ctx, 52, 398, 'up', INK);
    textLeft(ctx, 'AP 長', 60, 392, MUTED, f(700, 12));
    textCenter(ctx, 'P 的位置', 480, 514, MUTED, f(700, 12));
    ctx.save();
    ctx.strokeStyle = PC_ORANGE;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let u = -6; u <= 6.001; u += 0.1) {
      const px = GX(u), py = GY(Math.hypot(u, h));
      if (u === -6) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
    dashLine(ctx, GX(0), GY(h), GX(0), 500, C, [4, 4]);
    textCenter(ctx, 'F', GX(0), 512, C, fi(700, 13));
    textLeft(ctx, `最短 = ${h}`, GX(0) + 8, GY(h) + 14, C, f(800, 12.5));
    drawDot(ctx, GX(x), GY(ap), PC_ORANGE, 5);

    if (x === 0) {
      out.innerHTML = `P 與 F 重合：\\(\\overline{AP} = \\overline{AF} = ${h}\\)`;
    } else {
      out.innerHTML = `\\(\\overline{AF} = ${h}\\)，<wbr>\\(\\overline{AP} ${pcEqTex(ap)}\\)`;
    }
    let msg;
    if (x === 0) {
      msg = `P 走到垂足 F，\\(\\overline{AP} \\perp L\\)，長度 \\(${h}\\) 是所有連線中<b style="color:${C}">最短</b>的——這就是 A 點到直線 L 的距離。`;
    } else {
      msg = `P 離垂足 \\(${numStr(Math.abs(x))}\\) 格，\\(\\overline{AP}\\) 比 \\(\\overline{AF}\\) 長。P 離 F 越遠，\\(\\overline{AP}\\) 越長。`;
    }
    if (tilt === 'tilt') msg += `L 是斜的：從 A 往正下方畫到 V，\\(\\overline{AV} ${pcEqTex(av)}\\)，也比 \\(\\overline{AF}\\) 長，<b style="color:${C}">要垂直才最短</b>。`;
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  hS.addEventListener('input', draw);
  xS.addEventListener('input', draw);
  bindPickGroup(tiltG, 'data-pp-tilt', v => { tilt = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 6：摺紙找中點——移動摺痕，看 B 什麼時候剛好疊到 A
   ========================================================================== */
function initMidCanvas() {
  const cv = document.getElementById('canvas-mid');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const lenS = document.getElementById('md-len');
  const cS = document.getElementById('md-c');
  const foldS = document.getElementById('md-fold');
  const lenV = document.getElementById('md-len-val');
  const cV = document.getElementById('md-c-val');
  const foldV = document.getElementById('md-fold-val');
  const out = document.getElementById('md-formula');
  const fb = document.getElementById('md-feedback');
  const C = PC_TONE[5];
  const SC = 22;

  function draw() {
    const len = parseInt(lenS.value, 10);
    cS.max = len - 1;
    let c = parseFloat(cS.value);
    if (c > len - 1) { c = len - 1; cS.value = c; }
    const p = parseInt(foldS.value, 10) / 100;
    lenV.textContent = len;
    cV.textContent = numStr(c);
    foldV.textContent = foldS.value + '%';
    const x0 = 270 - len * SC / 2;
    const X = u => x0 + u * SC;
    const mid = Math.abs(c - len / 2) < 1e-9;
    const P = mid ? 'M' : 'P';
    const left = c, right = len - c;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `紙條上畫一條 AB = ${len} 的線段，沿摺痕對摺`, C);

    // 第 1 列：攤開
    textLeft(ctx, '攤開', 20, 66, INK, f(800, 14));
    ctx.save();
    ctx.fillStyle = pcRgba(PC_CREAM, 0.14);
    ctx.fillRect(X(0) - 12, 84, len * SC + 24, 64);
    ctx.restore();
    pcLine(ctx, X(0), 124, X(len), 124, INK, 3);
    ctx.save();
    ctx.setLineDash([6, 5]);
    pcLine(ctx, X(c), 74, X(c), 158, C, 2.5);
    ctx.restore();
    pcRightMark(ctx, X(c), 124, -1, 0, 0, -1, 10, C);
    pcRightMark(ctx, X(c), 124, 1, 0, 0, -1, 10, C);
    textCenter(ctx, '1', X(c) - 20, 102, C, f(800, 12));
    textCenter(ctx, '2', X(c) + 20, 102, C, f(800, 12));
    textCenter(ctx, '摺痕', X(c), 66, C, f(800, 12.5));
    drawDot(ctx, X(0), 124, PC_YELLOW, 5);
    drawDot(ctx, X(len), 124, PC_PINK, 5);
    drawDot(ctx, X(c), 124, C, 4);
    textCenter(ctx, 'A', X(0) - 2, 142, PC_YELLOW, fi(700, 15));
    textCenter(ctx, 'B', X(len) + 2, 142, PC_PINK, fi(700, 15));
    textCenter(ctx, P, X(c) + 10, 142, C, fi(700, 15));
    const lw = X(c) - X(0), rw = X(len) - X(c);
    textCenter(ctx, `A${P} = ${numStr(left)}`, (X(0) + X(c)) / 2, lw < 70 ? 188 : 168, PC_YELLOW, f(800, 13));
    textCenter(ctx, `${P}B = ${numStr(right)}`, (X(c) + X(len)) / 2, rw < 70 ? 188 : 168, PC_PINK, f(800, 13));

    // 第 2 列：摺起來（右半邊繞著摺痕翻過來）
    textLeft(ctx, `摺起來 ${Math.round(p * 100)}%`, 20, 218, INK, f(800, 14));
    const k = Math.cos(Math.PI * p);
    const xr = u => X(c) + (u - c) * SC * k;
    ctx.save();
    ctx.fillStyle = pcRgba(PC_CREAM, 0.14);
    ctx.fillRect(X(0) - 12, 240, c * SC + 12, 64);
    ctx.restore();
    pcLine(ctx, X(0), 272, X(c), 272, INK, 3);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 230, cv.width, 90);
    ctx.clip();
    const r1 = xr(c), r2 = xr(len) + (k >= 0 ? 12 : -12);
    ctx.fillStyle = pcRgba(PC_CREAM, k >= 0 ? 0.14 : 0.3);
    ctx.fillRect(Math.min(r1, r2), 244, Math.abs(r2 - r1), 56);
    pcLine(ctx, xr(c), 272, xr(len), 272, k >= 0 ? INK : PC_PINK, 3);
    ctx.restore();
    ctx.save();
    ctx.setLineDash([6, 5]);
    pcLine(ctx, X(c), 234, X(c), 312, C, 2.5);
    ctx.restore();
    drawDot(ctx, X(0), 272, PC_YELLOW, 5);
    textCenter(ctx, 'A', X(0), 292, PC_YELLOW, fi(700, 15));
    const bx = xr(len);
    if (bx >= 8 && bx <= 532) {
      drawDot(ctx, bx, 272, PC_PINK, 5);
      textCenter(ctx, 'B', bx, 254, PC_PINK, fi(700, 15));
    } else {
      textLeft(ctx, '← B 翻到畫面外的左邊', 12, 236, PC_PINK, f(800, 12.5));
    }
    const gap = Math.abs(2 * c - len);
    let foldMsg, foldCol = INK;
    if (p < 1) {
      foldMsg = '把「摺起來」拉到 100% 看 B 落在哪裡';
      foldCol = MUTED;
    } else if (gap === 0) {
      foldMsg = 'B 剛好疊在 A 上';
      foldCol = OK_COLOR;
    } else {
      foldMsg = `B 落在 A 的${2 * c > len ? '右' : '左'}邊，差 ${numStr(gap)}`;
      foldCol = NO_COLOR;
    }
    textCenter(ctx, foldMsg, 270, 330, foldCol, f(800, 14.5));

    // 第 3 列：結論
    drawPanel(ctx, 20, 350, 500, 160, C, 0.06);
    textCenter(ctx, '∠1、∠2 疊合 ⇒ ∠1 = ∠2，合起來 180°，各是 90°', 270, 376, INK, f(700, 14));
    textCenter(ctx, `所以摺痕 ⊥ AB`, 270, 400, INK, f(800, 14.5));
    if (mid) {
      textCenter(ctx, `A${P} = ${P}B = ${numStr(left)}：${P} 是 AB 的中點`, 270, 432, OK_COLOR, f(800, 15.5));
      drawChip(ctx, 130, 452, 280, 36, '摺痕是 AB 的中垂線', OK_COLOR, pcRgba(OK_COLOR, 0.12));
    } else {
      textCenter(ctx, `A${P} = ${numStr(left)}、${P}B = ${numStr(right)}：不相等，${P} 不是中點`, 270, 432, NO_COLOR, f(800, 15));
      drawChip(ctx, 110, 452, 320, 36, '摺痕垂直 AB，但不是中垂線', NO_COLOR, pcRgba(NO_COLOR, 0.12));
    }

    if (mid) {
      out.innerHTML = wbrEq(`\\overline{AM} = \\overline{BM} = \\frac{1}{2}\\overline{AB} = ${numStr(left)}`);
    } else {
      out.innerHTML = `\\(\\overline{AP} = ${numStr(left)}\\)，\\(\\overline{PB} = ${numStr(right)}\\)，<wbr>\\(\\overline{AP} \\ne \\overline{PB}\\)`;
    }
    fb.innerHTML = wrapFeedback(mid
      ? `摺痕通過中點 M，又與 \\(\\overline{AB}\\) 垂直，就是 \\(\\overline{AB}\\) 的<b style="color:${C}">中垂線</b>。`
      : `摺痕把 \\(\\overline{AB}\\) 分成 \\(${numStr(left)}\\) 與 \\(${numStr(right)}\\)，要移到 \\(${numStr(len / 2)}\\) 的位置，A、B 才會疊合。`);
    typeset([out, fb]);
  }

  [lenS, cS, foldS].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 7：卡紙圖案摺疊台——點選點、線段或角，找出它的對稱部分
   ========================================================================== */
function initSymCanvas() {
  const cv = document.getElementById('canvas-sym');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const shapeG = document.getElementById('sy-shape-group');
  const kindG = document.getElementById('sy-kind-group');
  const foldS = document.getElementById('sy-fold');
  const foldV = document.getElementById('sy-fold-val');
  const out = document.getElementById('sy-formula');
  const fb = document.getElementById('sy-feedback');
  const C = PC_TONE[6];
  const CX = 270, CY = 232, PX_CM = 40;
  const SHAPES = {
    shield: [[0, -150], [-70, -110], [-120, -20], [-80, 100], [0, 150], [80, 100], [120, -20], [70, -110]],
    lantern: [[0, -160], [-100, -120], [-140, 0], [-90, 110], [0, 130], [90, 110], [140, 0], [100, -120]]
  };
  const N = 8;
  const mv = i => (N - i) % N;
  let shape = 'shield', kind = 'ang', sel = 2;

  function draw() {
    const p = parseInt(foldS.value, 10) / 100;
    foldV.textContent = foldS.value + '%';
    const base = SHAPES[shape];
    const k = Math.cos(Math.PI * p);
    const pos = base.map(([dx, dy]) => [CX + (dx > 0 ? dx * k : dx), CY + dy]);
    const flat = base.map(([dx, dy]) => [CX + dx, CY + dy]);
    const L = i => PC_LETTERS[i];

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '沿著對稱軸 L 對摺，左右兩邊完全重疊', C);

    const leftPts = [0, 1, 2, 3, 4].map(i => pos[i]);
    const rightPts = [4, 5, 6, 7, 0].map(i => pos[i]);
    pcPoly(ctx, leftPts, pcRgba(PC_ORANGE, 0.24), PC_ORANGE, 2.5);
    pcPoly(ctx, rightPts, pcRgba(PC_BLUE, k >= 0 ? 0.24 : 0.34), PC_BLUE, 2.5);
    ctx.save();
    ctx.setLineDash([8, 6]);
    pcLine(ctx, CX, 58, CX, 406, INK, 2);
    ctx.restore();
    textCenter(ctx, 'L', CX + 14, 62, INK, fi(700, 16));

    const m = kind === 'seg' ? sel : mv(sel);
    if (kind === 'seg') {
      const a = pos[sel], b = pos[(sel + 1) % N];
      const ma = pos[mv(sel)], mb = pos[mv((sel + 1) % N)];
      pcLine(ctx, a[0], a[1], b[0], b[1], C, 6);
      pcLine(ctx, ma[0], ma[1], mb[0], mb[1], PC_PINK, 6);
    } else {
      [sel, mv(sel)].forEach((i, idx) => {
        const col = idx === 0 ? C : PC_PINK;
        const v = pos[i];
        if (kind === 'ang') {
          const a1 = Math.atan2(pos[(i + N - 1) % N][1] - v[1], pos[(i + N - 1) % N][0] - v[0]);
          const a2 = Math.atan2(pos[(i + 1) % N][1] - v[1], pos[(i + 1) % N][0] - v[0]);
          ctx.save();
          ctx.fillStyle = pcRgba(col, 0.4);
          ctx.beginPath();
          ctx.moveTo(v[0], v[1]);
          let s = a1, e = a2;
          let d = e - s;
          while (d <= -Math.PI) d += 2 * Math.PI;
          while (d > Math.PI) d -= 2 * Math.PI;
          ctx.arc(v[0], v[1], 26, s, s + d, d < 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        ctx.save();
        ctx.strokeStyle = col;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(v[0], v[1], 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
    }
    pos.forEach((v, i) => {
      drawDot(ctx, v[0], v[1], '#f8fafc', 4);
      const dx = base[i][0] === 0 ? 0 : Math.sign(base[i][0]) * (k >= 0 || base[i][0] < 0 ? 1 : -1);
      const dy = Math.sign(base[i][1]);
      textCenter(ctx, L(i), v[0] + dx * 20, v[1] + (dx === 0 ? dy * 20 : dy * 8), '#f8fafc', fi(700, 16));
    });

    drawPanel(ctx, 20, 420, 500, 92, C, 0.06);
    let head, detail, texOut, msg;
    if (kind === 'pt') {
      if (sel === mv(sel)) {
        head = `${L(sel)} 在對稱軸上`;
        detail = `${L(sel)} 的對稱點就是 ${L(sel)} 自己`;
        texOut = `\\(${L(sel)}\\) 在對稱軸上，對稱點是 \\(${L(sel)}\\) 自己`;
        msg = '對摺時，對稱軸上的點不會移動，所以它的對稱點就是自己。';
      } else {
        head = `${L(sel)} 的對稱點是 ${L(mv(sel))}`;
        detail = `對摺後 ${L(sel)} 與 ${L(mv(sel))} 疊在一起`;
        texOut = `\\(${L(sel)}\\) 的對稱點是 \\(${L(mv(sel))}\\)`;
        msg = `把「對摺」拉到 100%，\\(${L(sel)}\\) 與 \\(${L(mv(sel))}\\) 疊在同一個位置。`;
      }
    } else if (kind === 'ang') {
      const deg = pcAngle(flat[(sel + N - 1) % N], flat[sel], flat[(sel + 1) % N]);
      const d = Math.round(deg);
      if (sel === mv(sel)) {
        head = `∠${L(sel)} 在對稱軸上，對稱角是自己`;
        texOut = `\\(\\angle ${L(sel)} \\approx ${d}^\\circ\\)，對稱角是 \\(\\angle ${L(sel)}\\) 自己`;
        msg = `\\(\\angle ${L(sel)}\\) 被對稱軸分成左右兩半，兩半互相疊合。`;
      } else {
        head = `∠${L(sel)} 的對稱角是 ∠${L(mv(sel))}`;
        texOut = `\\(\\angle ${L(sel)}\\) 的對稱角是 \\(\\angle ${L(mv(sel))}\\)，<wbr>\\(\\angle ${L(sel)} = \\angle ${L(mv(sel))} \\approx ${d}^\\circ\\)`;
        msg = `對稱角能完全疊合，所以<b style="color:${C}">對稱角相等</b>。`;
      }
      detail = sel === mv(sel) ? `∠${L(sel)} ≈ ${d}°` : `∠${L(sel)} = ∠${L(mv(sel))} ≈ ${d}°`;
    } else {
      const a = sel, b = (sel + 1) % N;
      const cm = Math.hypot(flat[b][0] - flat[a][0], flat[b][1] - flat[a][1]) / PX_CM;
      const s1 = L(a) + L(b), s2 = L(mv(a)) + L(mv(b));
      head = `${s1} 的對稱線段是 ${s2}`;
      detail = `${s1} = ${s2} ${pcEq(cm)} 公分`;
      texOut = `\\(\\overline{${s1}}\\) 的對稱線段是 \\(\\overline{${s2}}\\)，<wbr>\\(\\overline{${s1}} = \\overline{${s2}} ${pcEqTex(cm)}\\) 公分`;
      msg = `先配對稱點：\\(${L(a)} \\to ${L(mv(a))}\\)、\\(${L(b)} \\to ${L(mv(b))}\\)，再連起來。<b style="color:${C}">對稱線段等長</b>。`;
    }
    textCenter(ctx, head, 270, 450, C, f(800, 17));
    textCenter(ctx, detail, 270, 484, '#f8fafc', f(800, 15.5));

    out.innerHTML = texOut;
    fb.innerHTML = wrapFeedback(msg + '（點圖形換一個）');
    typeset([out, fb]);
    return m;
  }

  cv.addEventListener('click', e => {
    const p = canvasPos(cv, e);
    const k = Math.cos(Math.PI * parseInt(foldS.value, 10) / 100);
    const pos = SHAPES[shape].map(([dx, dy]) => [CX + (dx > 0 ? dx * k : dx), CY + dy]);
    if (kind === 'seg') {
      const mids = pos.map((v, i) => [(v[0] + pos[(i + 1) % N][0]) / 2, (v[1] + pos[(i + 1) % N][1]) / 2]);
      const i = pcNearest(mids, p.x, p.y, 40);
      if (i >= 0) sel = i;
    } else {
      const i = pcNearest(pos, p.x, p.y, 32);
      if (i >= 0) sel = i;
    }
    draw();
  });
  bindPickGroup(shapeG, 'data-sy-shape', v => { shape = v; draw(); });
  bindPickGroup(kindG, 'data-sy-kind', v => { kind = v; draw(); });
  foldS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 8：中垂線檢查器——點兩個點連成線段，看對稱軸是不是它的中垂線
   ========================================================================== */
function initCheckCanvas() {
  const cv = document.getElementById('canvas-check');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const axisG = document.getElementById('ck-axis-group');
  const out = document.getElementById('ck-formula');
  const fb = document.getElementById('ck-feedback');
  const C = PC_TONE[7];
  const U = 30, CX = 270, CY = 236;
  const PTS = [[0, -5], [-2, -2], [-5, -3], [-4, 2], [0, 5], [4, 2], [5, -3], [2, -2]];
  const N = PTS.length;
  let rot = 0;
  let sel = [1, 6];

  const scr = (u, v) => [CX + U * (u * Math.cos(rot) - v * Math.sin(rot)), CY + U * (u * Math.sin(rot) + v * Math.cos(rot))];

  function draw() {
    const L = i => PC_LETTERS[i];
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '以直線 L 為對稱軸的線對稱圖形', C);

    ctx.save();
    ctx.beginPath();
    ctx.rect(14, 46, 512, 380);
    ctx.clip();
    for (let g = -7; g <= 7; g++) {
      const a = scr(g, -7), b = scr(g, 7), c = scr(-7, g), d = scr(7, g);
      pcLine(ctx, a[0], a[1], b[0], b[1], 'rgba(203,213,225,0.1)', 1);
      pcLine(ctx, c[0], c[1], d[0], d[1], 'rgba(203,213,225,0.1)', 1);
    }
    pcPoly(ctx, PTS.map(q => scr(q[0], q[1])), pcRgba(C, 0.14), pcRgba(C, 0.6), 2);
    const l1 = scr(0, -6.6), l2 = scr(0, 6.6);
    ctx.setLineDash([8, 6]);
    pcLine(ctx, l1[0], l1[1], l2[0], l2[1], INK, 2.2);
    ctx.restore();
    const lt = scr(0.5, -6.3);
    textCenter(ctx, 'L', lt[0], lt[1], INK, fi(700, 16));

    let texOut, msg, row1 = '', row2 = '', verdict = null;
    if (sel.length === 2) {
      const [a, b] = sel;
      const P1 = PTS[a], P2 = PTS[b];
      const s1 = scr(P1[0], P1[1]), s2 = scr(P2[0], P2[1]);
      pcLine(ctx, s1[0], s1[1], s2[0], s2[1], PC_YELLOW, 3.5);
      const name = L(a) + L(b);
      const segTex = `\\overline{${name}}`;
      if (P1[0] === 0 && P2[0] === 0) {
        row1 = `${L(a)}、${L(b)} 都在 L 上`;
        row2 = '線段整條落在 L 上，談不上被 L 垂直平分';
        verdict = false;
        texOut = `\\(${segTex}\\) 在 \\(L\\) 上`;
        msg = '兩點都在對稱軸上，它們的對稱點都是自己。';
      } else if (P1[0] * P2[0] > 0) {
        row1 = `${L(a)}、${L(b)} 在 L 的同一側`;
        row2 = `${name} 和 L 沒有交點`;
        verdict = false;
        texOut = `\\(${segTex}\\) 和 \\(L\\) 沒有交點`;
        msg = `兩點在同一側，\\(L\\) 碰不到 \\(${segTex}\\)，更不可能是它的中垂線。`;
      } else if (P1[0] === 0 || P2[0] === 0) {
        const on = P1[0] === 0 ? a : b;
        row1 = `${L(on)} 在 L 上，是線段的端點`;
        row2 = 'L 只碰到線段的一端，沒有平分它';
        verdict = false;
        texOut = `\\(${L(on)}\\) 在 \\(L\\) 上，\\(L\\) 沒有平分 \\(${segTex}\\)`;
        msg = `\\(${L(on)}\\) 的對稱點是自己，\\(${L(a === on ? b : a)}\\) 的對稱點卻不是 \\(${L(on)}\\)。`;
      } else {
        const t = P1[0] / (P1[0] - P2[0]);
        const qu = 0, qv = P1[1] + t * (P2[1] - P1[1]);
        const Q = scr(qu, qv);
        const d1 = Math.hypot(P1[0] - qu, P1[1] - qv), d2 = Math.hypot(P2[0] - qu, P2[1] - qv);
        const du = Math.abs(P2[0] - P1[0]), dv = Math.abs(P2[1] - P1[1]);
        const ang = Math.atan2(du, dv) * 180 / Math.PI;
        const perp = dv === 0;
        const half = Math.abs(d1 - d2) < 1e-9;
        verdict = perp && half;
        drawDot(ctx, Q[0], Q[1], C, 5);
        textCenter(ctx, 'Q', Q[0] + 16, Q[1] - 14, C, fi(700, 15));
        if (perp) {
          const ux = (s2[0] - s1[0]) / Math.hypot(s2[0] - s1[0], s2[1] - s1[1]);
          const uy = (s2[1] - s1[1]) / Math.hypot(s2[0] - s1[0], s2[1] - s1[1]);
          // 沿著對稱軸往上的方向（v 減少）
          pcRightMark(ctx, Q[0], Q[1], ux, uy, Math.sin(rot), -Math.cos(rot), 11, C);
        }
        if (half) {
          pcTicks(ctx, s1[0], s1[1], Q[0], Q[1], 2, C);
          pcTicks(ctx, Q[0], Q[1], s2[0], s2[1], 2, C);
        }
        row1 = `${L(a)}Q ${pcEq(d1)}、${L(b)}Q ${pcEq(d2)}（${half ? '相等 ✓' : '不相等 ✗'}）`;
        row2 = `${name} 與 L 的夾角 ≈ ${Math.round(ang)}°（${perp ? '垂直 ✓' : '不垂直 ✗'}）`;
        texOut = `\\(\\overline{${L(a)}Q} ${pcEqTex(d1)}\\)，<wbr>\\(\\overline{${L(b)}Q} ${pcEqTex(d2)}\\)，<wbr>夾角 \\(\\approx ${Math.round(ang)}^\\circ\\)`;
        msg = verdict
          ? `\\(${L(a)}\\)、\\(${L(b)}\\) 是一組對稱點：\\(L\\) <b style="color:${C}">垂直平分</b> \\(${segTex}\\)，是它的中垂線。`
          : `\\(${L(a)}\\) 的對稱點是 \\(${L((N - a) % N)}\\)，不是 \\(${L(b)}\\)，所以 \\(L\\) 不是 \\(${segTex}\\) 的中垂線。`;
      }
    } else {
      texOut = sel.length ? `已選 \\(${L(sel[0])}\\)，再點一個點` : '點圖形上的兩個頂點';
      msg = '點兩個頂點連成線段，看 L 有沒有把它垂直平分。';
    }
    PTS.forEach((q, i) => {
      const s = scr(q[0], q[1]);
      const on = sel.includes(i);
      drawDot(ctx, s[0], s[1], on ? PC_YELLOW : '#f8fafc', on ? 7 : 5);
      const off = scr(q[0] * 1.18 + (q[0] === 0 ? 0.55 : 0), q[1] * 1.12);
      textCenter(ctx, L(i), off[0], off[1], on ? PC_YELLOW : '#f8fafc', fi(700, 16));
    });

    drawPanel(ctx, 20, 432, 500, 80, C, 0.06);
    if (sel.length === 2) {
      textCenter(ctx, row1, 270, 452, INK, f(800, 14.5));
      textCenter(ctx, row2, 270, 476, INK, f(800, 14.5));
      const col = verdict ? OK_COLOR : NO_COLOR;
      textCenter(ctx, verdict ? 'L 是這條線段的中垂線' : 'L 不是這條線段的中垂線', 270, 500, col, f(800, 15));
    } else {
      textCenter(ctx, sel.length ? `已選 ${L(sel[0])}，再點一個點` : '點兩個頂點連成線段', 270, 472, MUTED, f(800, 15));
    }
    out.innerHTML = texOut;
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  cv.addEventListener('click', e => {
    const p = canvasPos(cv, e);
    const i = pcNearest(PTS.map(q => scr(q[0], q[1])), p.x, p.y, 26);
    if (i < 0) return;
    if (sel.length === 2) sel = [i];
    else if (sel[0] === i) sel = [];
    else sel.push(i);
    draw();
  });
  bindPickGroup(axisG, 'data-ck-axis', v => { rot = v === 'tilt' ? -Math.PI / 4 : 0; draw(); });
  draw();
}

/* ==========================================================================
   重點 9：轉動摺線找對稱軸——摺線通過圖形中心，轉到哪些角度會完全重疊
   ========================================================================== */
function initAxisCanvas() {
  const cv = document.getElementById('canvas-axis');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const shapeG = document.getElementById('ax-shape-group');
  const angS = document.getElementById('ax-angle');
  const angV = document.getElementById('ax-angle-val');
  const out = document.getElementById('ax-formula');
  const fb = document.getElementById('ax-feedback');
  const C = PC_TONE[8];
  const reg = (n, r) => Array.from({ length: n }, (_, i) => [r * Math.cos(Math.PI / 2 + i * 2 * Math.PI / n), r * Math.sin(Math.PI / 2 + i * 2 * Math.PI / n)]);
  // 數學座標（y 向上）；載入時把頂點平均移到原點，摺線一律通過原點
  const SH = {
    iso: { name: '等腰三角形', pts: [[0, 130], [-80, -100], [80, -100]], total: 1 },
    equi: { name: '正三角形', pts: reg(3, 135), total: 3 },
    square: { name: '正方形', pts: [[100, 100], [-100, 100], [-100, -100], [100, -100]], total: 4 },
    rect: { name: '長方形', pts: [[135, 80], [-135, 80], [-135, -80], [135, -80]], total: 2 },
    rhombus: { name: '菱形', pts: [[0, 135], [-90, 0], [0, -135], [90, 0]], total: 2 },
    kite: { name: '箏形', pts: [[0, 135], [-85, 40], [0, -135], [85, 40]], total: 1 },
    para: { name: '平行四邊形', pts: [[-130, -75], [60, -75], [130, 75], [-60, 75]], total: 0 },
    trap: { name: '等腰梯形', pts: [[-65, 85], [65, 85], [130, -85], [-130, -85]], total: 1 },
    pent: { name: '正五邊形', pts: reg(5, 135), total: 5 },
    hex: { name: '正六邊形', pts: reg(6, 130), total: 6 },
    circle: { name: '圓', pts: null, total: Infinity }
  };
  Object.values(SH).forEach(sh => {
    if (!sh.pts) return;
    const gx = sh.pts.reduce((a, p) => a + p[0], 0) / sh.pts.length;
    const gy = sh.pts.reduce((a, p) => a + p[1], 0) / sh.pts.length;
    sh.pts = sh.pts.map(p => [p[0] - gx, p[1] - gy]);
  });
  const CX = 270, CY = 214;
  const S = p => [CX + p[0], CY - p[1]];
  let shape = 'iso';
  let found = new Set(), visited = new Set();

  const reflect = (p, dx, dy) => {
    const d = p[0] * dx + p[1] * dy;
    return [2 * d * dx - p[0], 2 * d * dy - p[1]];
  };
  const isAxis = (sh, deg) => {
    if (!sh.pts) return true;
    const th = deg * Math.PI / 180;
    const dx = Math.cos(th), dy = Math.sin(th);
    return sh.pts.map(p => reflect(p, dx, dy)).every(q => sh.pts.some(p => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.5));
  };

  function lineAt(deg, color, width, dash) {
    const th = deg * Math.PI / 180;
    const a = S([-190 * Math.cos(th), -190 * Math.sin(th)]);
    const b = S([190 * Math.cos(th), 190 * Math.sin(th)]);
    ctx.save();
    if (dash) ctx.setLineDash(dash);
    pcLine(ctx, a[0], a[1], b[0], b[1], color, width);
    ctx.restore();
  }

  function draw() {
    const sh = SH[shape];
    const deg = parseInt(angS.value, 10);
    angV.textContent = deg + '°';
    visited.add(deg);
    const match = isAxis(sh, deg);
    if (match && sh.pts) found.add(deg);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `${sh.name}：轉動摺線，找出所有對稱軸`, C);

    ctx.save();
    ctx.beginPath();
    ctx.rect(20, 42, 500, 350);
    ctx.clip();
    found.forEach(d => { if (d !== deg) lineAt(d, pcRgba(OK_COLOR, 0.45), 2.5); });
    if (sh.pts) {
      pcPoly(ctx, sh.pts.map(S), pcRgba(C, 0.22), C, 3);
      const th = deg * Math.PI / 180;
      ctx.save();
      ctx.setLineDash([7, 5]);
      pcPoly(ctx, sh.pts.map(p => S(reflect(p, Math.cos(th), Math.sin(th)))), null, PC_PINK, 2.2);
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = pcRgba(C, 0.22);
      ctx.strokeStyle = C;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(CX, CY, 125, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    lineAt(deg, match ? OK_COLOR : INK, match ? 4 : 2.5, match ? null : [9, 6]);
    ctx.restore();
    drawDot(ctx, CX, CY, PC_YELLOW, 4);

    drawPanel(ctx, 20, 400, 500, 92, C, 0.06);
    textLeft(ctx, `摺線轉到 ${deg}°`, 40, 424, INK, f(800, 15));
    textLeft(ctx, '粉紅虛線＝翻過去的樣子', 40, 450, PC_PINK, f(700, 12.5));
    const col = match ? OK_COLOR : NO_COLOR;
    drawChip(ctx, 300, 408, 200, 34, match ? '完全重疊 ✓' : '沒有重疊 ✗', col, pcRgba(col, 0.12));
    let status;
    if (!sh.pts) status = '每一個角度都重疊：圓有無限多條對稱軸';
    else if (sh.total === 0) status = visited.size >= 60 ? '轉完一圈都沒有重疊：不是線對稱圖形' : `還沒找到（已試 ${visited.size} / 60 個角度）`;
    else if (found.size === sh.total) status = `全部找到了！${sh.name}共有 ${sh.total} 條對稱軸`;
    else status = `已找到 ${found.size} 條，繼續轉`;
    textCenter(ctx, status, 270, 474, found.size === sh.total || !sh.pts ? OK_COLOR : '#f8fafc', f(800, 15));

    out.innerHTML = `${sh.name}：摺線 \\(${deg}^\\circ\\) ${match ? '是' : '不是'}對稱軸` + (sh.pts ? `；已找到 \\(${found.size}\\) 條` : '');
    let msg;
    if (!sh.pts) msg = `通過圓心的直線都能把圓分成兩個半圓，<b style="color:${C}">圓有無限多條對稱軸</b>。`;
    else if (match && shape === 'iso') msg = `這條對稱軸是底邊的<b style="color:${C}">中垂線</b>，而且通過頂點。`;
    else if (match) msg = `沿著這條線對摺，兩邊完全重疊，是一條<b style="color:${C}">對稱軸</b>。對稱軸不一定只有一條，繼續找。`;
    else if (sh.total === 0 && visited.size >= 60) msg = `${sh.name}找不到任何一條對稱軸，<b style="color:${C}">不是線對稱圖形</b>。`;
    else msg = '翻過去的粉紅虛線和原圖沒有完全重疊，這個角度不是對稱軸。';
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  angS.addEventListener('input', draw);
  bindPickGroup(shapeG, 'data-ax-shape', v => {
    shape = v;
    found = new Set();
    visited = new Set();
    draw();
  });
  draw();
}

/* ==========================================================================
   重點 10：方格鏡射台——一個頂點一個頂點找對稱點，再依序連起來
   ========================================================================== */
function initGridCanvas() {
  const cv = document.getElementById('canvas-grid');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const axisG = document.getElementById('gr-axis-group');
  const figG = document.getElementById('gr-fig-group');
  const prevB = document.getElementById('gr-prev');
  const nextB = document.getElementById('gr-next');
  const stepV = document.getElementById('gr-step');
  const out = document.getElementById('gr-formula');
  const fb = document.getElementById('gr-feedback');
  const C = PC_TONE[9];
  const G = 36, OX = 54, OY = 52;
  // 格點 (i, j)：i 向右、j 向下，都是 0～12
  const FIGS = {
    v: [[[6, 1], [3, 3], [4, 6], [1, 9], [6, 10]],
        [[6, 2], [2, 2], [2, 5], [4, 7], [3, 10], [6, 10]]],
    d: [[[8, 4], [4, 4], [4, 6], [2, 8], [2, 10]],
        [[9, 3], [5, 3], [5, 5], [3, 5], [3, 9]]]
  };
  let axis = 'v', fig = 0, step = 0, probe = null;

  const S = (i, j) => [OX + i * G, OY + j * G];
  const mir = (i, j) => (axis === 'v' ? [12 - i, j] : [12 - j, 12 - i]);
  const onAxis = (i, j) => (axis === 'v' ? i === 6 : i + j === 12);
  const dist = (i, j) => (axis === 'v' ? Math.abs(i - 6) : Math.abs(12 - i - j) / 2);
  const unit = () => (axis === 'v' ? '格' : '個對角線');

  function construct(i, j, color, width, label) {
    const m = mir(i, j);
    const a = S(i, j), b = S(m[0], m[1]);
    const foot = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    ctx.save();
    ctx.setLineDash([6, 5]);
    pcLine(ctx, a[0], a[1], b[0], b[1], color, width);
    ctx.restore();
    const ux = (b[0] - a[0]) / Math.hypot(b[0] - a[0], b[1] - a[1]);
    const uy = (b[1] - a[1]) / Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ax = axis === 'v' ? 0 : Math.SQRT1_2, ay = axis === 'v' ? -1 : -Math.SQRT1_2;
    pcRightMark(ctx, foot[0], foot[1], ux, uy, ax, ay, 9, color);
    if (label) {
      const d = numStr(dist(i, j));
      pcLabelBox(ctx, d, (a[0] + foot[0]) / 2 - uy * 14, (a[1] + foot[1]) / 2 + ux * 14, color, f(800, 12.5));
      pcLabelBox(ctx, d, (b[0] + foot[0]) / 2 - uy * 14, (b[1] + foot[1]) / 2 + ux * 14, color, f(800, 12.5));
    }
    return m;
  }

  function draw() {
    const F = FIGS[axis][fig];
    const offs = F.map((p, k) => (onAxis(p[0], p[1]) ? -1 : k)).filter(k => k >= 0);
    const total = offs.length + 1;
    step = clamp(step, 0, total);
    stepV.textContent = `${step} / ${total}`;
    prevB.disabled = step === 0;
    nextB.disabled = step === total;
    const L = k => PC_LETTERS[k];

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `以 L 為對稱軸，完成線對稱圖形`, C);
    for (let g = 0; g <= 12; g++) {
      const a = S(g, 0), b = S(g, 12), c = S(0, g), d = S(12, g);
      pcLine(ctx, a[0], a[1], b[0], b[1], 'rgba(203,213,225,0.14)', 1);
      pcLine(ctx, c[0], c[1], d[0], d[1], 'rgba(203,213,225,0.14)', 1);
    }
    const la = axis === 'v' ? S(6, 0) : S(0, 12), lb = axis === 'v' ? S(6, 12) : S(12, 0);
    pcLine(ctx, la[0], la[1], lb[0], lb[1], INK, 3);
    textCenter(ctx, 'L', lb[0] + (axis === 'v' ? 14 : 12), lb[1] + (axis === 'v' ? -8 : -12), INK, fi(700, 17));

    const mirrored = F.map(p => mir(p[0], p[1]));
    if (step === total) {
      const full = F.concat(mirrored.slice().reverse()).map(p => S(p[0], p[1]));
      pcPoly(ctx, full, pcRgba(C, 0.14), null);
      ctx.save();
      ctx.strokeStyle = PC_PINK;
      ctx.lineWidth = 3.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      mirrored.forEach((p, k) => {
        const s = S(p[0], p[1]);
        if (k) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]);
      });
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.strokeStyle = C;
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    F.forEach((p, k) => {
      const s = S(p[0], p[1]);
      if (k) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]);
    });
    ctx.stroke();
    ctx.restore();

    const shown = Math.min(step, offs.length);
    for (let s = 0; s < shown; s++) {
      const k = offs[s];
      const latest = s === shown - 1 && step <= offs.length;
      const m = construct(F[k][0], F[k][1], latest ? PC_YELLOW : pcRgba(PC_YELLOW, 0.45), latest ? 2.5 : 1.6, latest);
      const sm = S(m[0], m[1]);
      drawDot(ctx, sm[0], sm[1], PC_PINK, 5);
      textCenter(ctx, L(k) + "'", sm[0] + 14, sm[1] - 14, PC_PINK, fi(700, 15));
    }
    F.forEach((p, k) => {
      const s = S(p[0], p[1]);
      drawDot(ctx, s[0], s[1], onAxis(p[0], p[1]) ? PC_YELLOW : C, 5);
      textCenter(ctx, L(k), s[0] - 14, s[1] - 14, onAxis(p[0], p[1]) ? PC_YELLOW : C, fi(700, 15));
    });
    if (probe) {
      const m = construct(probe[0], probe[1], PC_PURPLE, 2, true);
      const a = S(probe[0], probe[1]), b = S(m[0], m[1]);
      drawDot(ctx, a[0], a[1], PC_PURPLE, 6);
      drawDot(ctx, b[0], b[1], PC_PURPLE, 6);
    }

    let line1, line2;
    if (step === 0) {
      line1 = 'L 的一邊是半個圖形';
      line2 = '按「下一步」，一個頂點一個頂點找對稱點';
    } else if (step <= offs.length) {
      const k = offs[step - 1];
      const d = numStr(dist(F[k][0], F[k][1]));
      line1 = axis === 'v'
        ? `${L(k)} 離 L ${d} 格 → 往另一邊也走 ${d} 格，得到 ${L(k)}'`
        : `${L(k)} 斜著走 ${d} 個對角線到 L → 再走 ${d} 個，得到 ${L(k)}'`;
      line2 = `${L(k)}${L(k)}' 與 L 垂直，而且被 L 平分`;
    } else {
      const names = F.map((p, k) => (onAxis(p[0], p[1]) ? L(k) : L(k) + "'"));
      line1 = `照原來的順序連起來：${names.join(' → ')}`;
      const axisPts = F.map((p, k) => (onAxis(p[0], p[1]) ? L(k) : null)).filter(Boolean);
      line2 = `${axisPts.join('、')} 在 L 上，對稱點是自己`;
    }
    textCenter(ctx, line1, 270, 510, '#f8fafc', f(800, 14.5));
    textCenter(ctx, line2, 270, 536, MUTED, f(700, 13.5));

    out.innerHTML = `第 ${step} 步（共 ${total} 步）：${line1}`;
    let msg;
    if (probe) {
      const d = numStr(dist(probe[0], probe[1]));
      msg = onAxis(probe[0], probe[1])
        ? '你點的格點在 L 上，它的對稱點就是自己。'
        : `紫色點離 L ${d} ${unit()}，對稱點在另一邊同樣 ${d} ${unit()}的地方。`;
    } else {
      msg = axis === 'v'
        ? `L 是直的：沿著<b style="color:${C}">橫的格線</b>數格子。也可以點任何一個格點，看它的對稱點。`
        : `L 是斜的：與 L 垂直的方向是<b style="color:${C}">方格的對角線</b>，要斜著數。也可以點任何一個格點試試。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  cv.addEventListener('click', e => {
    const p = canvasPos(cv, e);
    const i = Math.round((p.x - OX) / G), j = Math.round((p.y - OY) / G);
    if (i < 0 || i > 12 || j < 0 || j > 12) return;
    if (Math.hypot(p.x - (OX + i * G), p.y - (OY + j * G)) > 16) return;
    probe = (probe && probe[0] === i && probe[1] === j) ? null : [i, j];
    draw();
  });
  prevB.addEventListener('click', () => { step--; probe = null; draw(); });
  nextB.addEventListener('click', () => { step++; probe = null; draw(); });
  bindPickGroup(axisG, 'data-gr-axis', v => { axis = v; step = 0; probe = null; draw(); });
  bindPickGroup(figG, 'data-gr-fig', v => { fig = parseInt(v, 10); step = 0; probe = null; draw(); });
  draw();
}

/* ==========================================================================
   重點 11：剪紙展開機——對摺兩次後剪角或打洞，一次攤開一層
   ========================================================================== */

// 兩種摺法（紙張座標 u 向右、v 向下，整張紙是 [0,1]×[0,1]）
const CT_MODES = {
  half: {
    name: '上下、左右各對摺一次',
    piece: [[0.5, 0], [1, 0], [1, 0.5], [0.5, 0.5]],
    half: [[0, 0], [1, 0], [1, 0.5], [0, 0.5]],
    // 倒過來攤開：先攤開第二摺（左右），再攤開第一摺（上下）
    unfold: [p => [1 - p[0], p[1]], p => [p[0], 1 - p[1]]],
    creases: [[[0.5, 0], [0.5, 1]], [[0, 0.5], [1, 0.5]]],
    corners: [[0.5, 0.5], [1, 0.5], [0.5, 0], [1, 0]]
  },
  diag: {
    name: '沿兩條對角線各對摺一次',
    piece: [[1, 0], [1, 1], [0.5, 0.5]],
    half: [[0, 0], [1, 0], [1, 1]],
    unfold: [p => [1 - p[1], 1 - p[0]], p => [p[1], p[0]]],
    creases: [[[1, 0], [0, 1]], [[0, 0], [1, 1]]],
    corners: [[0.5, 0.5], [1, 1], [1, 0]]
  }
};

function initCutCanvas() {
  const cv = document.getElementById('canvas-cut');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const foldG = document.getElementById('ct-fold-group');
  const stepG = document.getElementById('ct-step-group');
  const clearB = document.getElementById('ct-clear');
  const out = document.getElementById('ct-formula');
  const fb = document.getElementById('ct-feedback');
  const C = PC_TONE[10];
  const PAPER = '#fdba74';
  const MARKS = ['①', '②', '③', '④'];
  const off = document.createElement('canvas');
  off.width = cv.width;
  off.height = cv.height;
  const octx = off.getContext('2d');
  let mode = 'half', step = 0;
  let cuts = [{ type: 'corner', k: 0 }];
  let warn = '';

  const M = () => CT_MODES[mode];
  const onSquareEdge = p => p[0] < 1e-9 || p[0] > 1 - 1e-9 || p[1] < 1e-9 || p[1] > 1 - 1e-9;

  // 第 s 步看得到的所有「剪掉的部分」：每一次攤開，就把已有的再鏡射一份
  function images(poly, s) {
    let list = [poly];
    for (let k = 0; k < s; k++) {
      const g = M().unfold[k];
      list = list.concat(list.map(pl => pl.map(g)));
    }
    return list;
  }

  function cutPoly(cut) {
    const piece = M().piece;
    if (cut.type === 'hole') {
      return Array.from({ length: 20 }, (_, i) => [cut.u + 0.045 * Math.cos(i * Math.PI / 10), cut.v + 0.045 * Math.sin(i * Math.PI / 10)]);
    }
    const c = M().corners[cut.k];
    const idx = piece.findIndex(p => Math.hypot(p[0] - c[0], p[1] - c[1]) < 1e-9);
    const prev = piece[(idx + piece.length - 1) % piece.length], next = piece[(idx + 1) % piece.length];
    const d = 0.16;
    const toward = q => {
      const l = Math.hypot(q[0] - c[0], q[1] - c[1]);
      return [c[0] + (q[0] - c[0]) / l * d, c[1] + (q[1] - c[1]) / l * d];
    };
    return [c, toward(prev), toward(next)];
  }

  function region(s) {
    return s === 0 ? M().piece : (s === 1 ? M().half : [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }

  // 把第 s 步的紙畫到 (bx, by, bw, bh) 的框裡，回傳紙張座標→畫布座標的換算
  function renderPaper(s, bx, by, bw, bh, full) {
    const reg = region(s);
    const us = reg.map(p => p[0]), vs = reg.map(p => p[1]);
    let minU = Math.min(...us), minV = Math.min(...vs);
    let spanU = Math.max(...us) - minU, spanV = Math.max(...vs) - minV;
    if (full) { minU = 0; minV = 0; spanU = 1; spanV = 1; }
    const sc = Math.min(bw / spanU, bh / spanV);
    const ox = bx + (bw - spanU * sc) / 2 - minU * sc;
    const oy = by + (bh - spanV * sc) / 2 - minV * sc;
    const T = p => [ox + p[0] * sc, oy + p[1] * sc];

    octx.clearRect(0, 0, off.width, off.height);
    const rp = reg.map(T);
    pcPoly(octx, rp, PAPER, null);
    // 摺痕（虛線）先畫，被剪掉的地方會一起挖掉
    octx.save();
    octx.beginPath();
    rp.forEach((p, i) => (i ? octx.lineTo(p[0], p[1]) : octx.moveTo(p[0], p[1])));
    octx.closePath();
    octx.clip();
    octx.setLineDash([7, 5]);
    M().creases.forEach(([a, b]) => {
      const A = T(a), B = T(b);
      pcLine(octx, A[0], A[1], B[0], B[1], 'rgba(120,53,15,0.85)', 2);
    });
    octx.restore();
    // 紙邊（實線）：落在整張紙外框上的邊
    reg.forEach((p, i) => {
      const q = reg[(i + 1) % reg.length];
      const edge = (p[0] === q[0] && (p[0] === 0 || p[0] === 1)) || (p[1] === q[1] && (p[1] === 0 || p[1] === 1));
      if (edge) {
        const A = T(p), B = T(q);
        pcLine(octx, A[0], A[1], B[0], B[1], '#7c2d12', 2.5);
      }
    });
    octx.save();
    octx.globalCompositeOperation = 'destination-out';
    cuts.forEach(cut => {
      images(cutPoly(cut), s).forEach(pl => pcPoly(octx, pl.map(T), '#000', null));
    });
    octx.restore();
    ctx.drawImage(off, 0, 0);
    return { T, sc, ox, oy };
  }

  function summary() {
    const lines = [];
    cuts.forEach(cut => {
      if (cut.type === 'hole') return;
      const c = M().corners[cut.k];
      const pts = [];
      images([c], 2).forEach(pl => {
        const p = pl[0];
        if (!pts.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-9)) pts.push(p);
      });
      const onCorner = onSquareEdge(c) && ((c[0] < 1e-9 || c[0] > 1 - 1e-9) && (c[1] < 1e-9 || c[1] > 1 - 1e-9));
      let what;
      if (!onSquareEdge(c)) what = pts.length === 1 ? '在正中央合成 1 個洞' : `變成 ${pts.length} 個洞`;
      else if (onCorner) what = `${pts.length} 個角被剪掉`;
      else what = `紙邊上出現 ${pts.length} 個缺口`;
      lines.push(`角 ${MARKS[cut.k]} → ${what}`);
    });
    const holes = cuts.filter(c => c.type === 'hole').length;
    if (holes) lines.push(`${holes} 個洞 → 變成 ${holes * 4} 個洞`);
    return lines;
  }

  function cornerKind(c) {
    const m = M();
    const onCrease = m.creases.filter(([a, b]) => {
      const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      return Math.abs(cross) < 1e-9;
    }).length;
    if (onCrease === 2) return '兩條摺痕交會';
    if (onCrease === 1) return '摺痕碰到紙邊';
    return '原本紙張的角';
  }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `${M().name}，紙疊成 4 層`, C);

    const view = renderPaper(step, 120, 48, 300, 290, false);
    if (step === 0) {
      M().corners.forEach((c, k) => {
        const p = view.T(c);
        const piece = M().piece;
        const gx = piece.reduce((a, q) => a + q[0], 0) / piece.length;
        const gy = piece.reduce((a, q) => a + q[1], 0) / piece.length;
        const g = view.T([gx, gy]);
        const dx = g[0] - p[0], dy = g[1] - p[1], dl = Math.hypot(dx, dy);
        const cutNow = cuts.some(cut => cut.type === 'corner' && cut.k === k);
        pcLabelBox(ctx, MARKS[k], p[0] + dx / dl * 58, p[1] + dy / dl * 58, cutNow ? PC_PINK : '#f8fafc', f(800, 15));
      });
    }
    const hint = step === 0 ? '點角落：剪掉那個角；點中間：打一個洞' : '回到「摺好的樣子」才能再剪';
    textCenter(ctx, hint, 270, 356, step === 0 ? PC_YELLOW : MUTED, f(800, 13.5));
    textCenter(ctx, '虛線＝摺痕　粗實線＝原本的紙邊', 270, 378, MUTED, f(700, 12.5));

    // 三個步驟的縮圖，大小照實際比例
    ['摺好', '攤開一次', '全部攤開'].forEach((label, s) => {
      const bx = 72 + s * 150;
      ctx.save();
      ctx.strokeStyle = s === step ? C : 'rgba(203,213,225,0.25)';
      ctx.lineWidth = s === step ? 2.5 : 1;
      ctx.strokeRect(bx - 6, 396, 108, 108);
      ctx.restore();
      renderPaper(s, bx, 402, 96, 96, true);
      textCenter(ctx, label, bx + 48, 518, s === step ? C : MUTED, f(800, 12.5));
    });

    const sum = summary();
    out.innerHTML = cuts.length ? `全部攤開後：${sum.join('；')}` : '還沒有剪';
    let msg = warn || '';
    if (!msg) {
      if (!cuts.length) msg = '在「摺好的樣子」點角落或中間開始剪。';
      else if (step < 2) msg = `紙疊了 4 層，每一刀都剪到 4 層。按「全部攤開」看結果，或一次攤開一層：每攤開一次，剪掉的部分就對那條摺痕<b style="color:${C}">鏡射</b>一份。`;
      else {
        const k = cuts.find(cut => cut.type === 'corner');
        msg = k
          ? `角 ${MARKS[k.k]} 是「${cornerKind(M().corners[k.k])}」的角。展開圖以兩條摺痕為<b style="color:${C}">對稱軸</b>。`
          : `兩條摺痕都是展開圖的<b style="color:${C}">對稱軸</b>。`;
      }
    }
    fb.innerHTML = wrapFeedback(msg);
    warn = '';
    typeset([out, fb]);
  }

  cv.addEventListener('click', e => {
    const p = canvasPos(cv, e);
    if (p.y > 340) return;
    if (step !== 0) {
      warn = '先按「摺好的樣子」，回到摺好的紙才能剪。';
      draw();
      return;
    }
    // 反推紙張座標
    const reg = M().piece;
    const us = reg.map(q => q[0]), vs = reg.map(q => q[1]);
    const minU = Math.min(...us), minV = Math.min(...vs);
    const spanU = Math.max(...us) - minU, spanV = Math.max(...vs) - minV;
    const sc = Math.min(300 / spanU, 290 / spanV);
    const ox = 120 + (300 - spanU * sc) / 2 - minU * sc;
    const oy = 48 + (290 - spanV * sc) / 2 - minV * sc;
    const u = (p.x - ox) / sc, v = (p.y - oy) / sc;
    const k = M().corners.findIndex(c => Math.hypot(c[0] - u, c[1] - v) < 0.12);
    if (k >= 0) {
      const at = cuts.findIndex(cut => cut.type === 'corner' && cut.k === k);
      if (at >= 0) cuts.splice(at, 1); else cuts.push({ type: 'corner', k });
      draw();
      return;
    }
    // 洞要整個落在紙片裡面，不能壓到摺痕或紙邊
    // 紙片是凸多邊形：點到每一條邊的「有號距離」都要往內至少 0.06
    let area = 0;
    reg.forEach((a, i) => {
      const b = reg[(i + 1) % reg.length];
      area += a[0] * b[1] - b[0] * a[1];
    });
    const orient = Math.sign(area);
    const inside = reg.every((a, i) => {
      const b = reg[(i + 1) % reg.length];
      const cross = (b[0] - a[0]) * (v - a[1]) - (b[1] - a[1]) * (u - a[0]);
      return orient * cross / Math.hypot(b[0] - a[0], b[1] - a[1]) >= 0.06;
    });
    if (!inside) {
      warn = '洞太靠近摺痕或紙邊了，往紙片中間一點再點。';
      draw();
      return;
    }
    const holes = cuts.filter(cut => cut.type === 'hole');
    if (holes.length >= 3) cuts.splice(cuts.indexOf(holes[0]), 1);
    cuts.push({ type: 'hole', u, v });
    draw();
  });
  bindPickGroup(foldG, 'data-ct-fold', v => { mode = v; cuts = []; step = 0; syncStep(); draw(); });
  bindPickGroup(stepG, 'data-ct-step', v => { step = parseInt(v, 10); draw(); });
  clearB.addEventListener('click', () => { cuts = []; draw(); });

  function syncStep() {
    stepG.querySelectorAll('.pick-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-ct-step') === String(step)));
  }
  draw();
}

/* ==========================================================================
   重點 12、13 共用：積木立體與視圖
   H[y][x] 是每一疊的高度：y = 0 是最前排，x = 0 是最左欄（從前面看）。
   立體內嵌在 3×3×3 的正方體裡，每一疊都從地面疊起，不中空。
   ========================================================================== */

// 等角投影：x 往右下、y（往後）往右上、z 往上
function pcIsoPoint(ox, oy, s, x, y, z) {
  return [ox + (x + y) * 0.866 * s, oy + (x - y) * 0.5 * s - z * s];
}

function pcDrawBlocks(ctx, H, ox, oy, s) {
  const P = (x, y, z) => pcIsoPoint(ox, oy, s, x, y, z);
  // 地面的 3×3 格線
  for (let k = 0; k <= 3; k++) {
    const a = P(k, 0, 0), b = P(k, 3, 0), c = P(0, k, 0), d = P(3, k, 0);
    pcLine(ctx, a[0], a[1], b[0], b[1], 'rgba(203,213,225,0.22)', 1);
    pcLine(ctx, c[0], c[1], d[0], d[1], 'rgba(203,213,225,0.22)', 1);
  }
  const cubes = [];
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      for (let z = 0; z < H[y][x]; z++) cubes.push([x, y, z]);
    }
  }
  // 由遠到近：看的人在前方、右方、上方
  cubes.sort((a, b) => (a[0] - a[1] + a[2]) - (b[0] - b[1] + b[2]));
  cubes.forEach(([x, y, z]) => {
    pcPoly(ctx, [P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], PC_YELLOW, '#1e293b', 1.4);
    pcPoly(ctx, [P(x, y, z), P(x + 1, y, z), P(x + 1, y, z + 1), P(x, y, z + 1)], PC_GREEN, '#1e293b', 1.4);
    pcPoly(ctx, [P(x + 1, y, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x + 1, y, z + 1)], PC_BLUE, '#1e293b', 1.4);
  });
}

// 五個方向的視圖，一律換成 3×3 的格子（第 0 列是最上面）
function pcViews(H) {
  const col = x => Math.max(H[0][x], H[1][x], H[2][x]);
  const row = y => Math.max(...H[y]);
  const fromHeights = hs => [0, 1, 2].map(r => hs.map(h => (h >= 3 - r ? 1 : 0)));
  const front = [0, 1, 2].map(col);
  const right = [0, 1, 2].map(row);          // 右視圖：靠前面的在左邊
  return {
    front: fromHeights(front),
    back: fromHeights(front.slice().reverse()),
    right: fromHeights(right),
    left: fromHeights(right.slice().reverse()),
    top: [2, 1, 0].map(y => H[y].map(h => (h > 0 ? 1 : 0))),   // 上視圖：下方是前面
    frontH: front,
    rightH: right
  };
}

function pcDrawView(ctx, grid, x, y, cs, color, frame) {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      ctx.save();
      ctx.fillStyle = grid[r][c] ? color : 'rgba(255,255,255,0.03)';
      ctx.fillRect(x + c * cs, y + r * cs, cs, cs);
      ctx.strokeStyle = grid[r][c] ? '#1e293b' : 'rgba(203,213,225,0.28)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x + c * cs, y + r * cs, cs, cs);
      ctx.restore();
    }
  }
  if (frame) {
    ctx.save();
    ctx.strokeStyle = frame;
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 5, y - 5, cs * 3 + 10, cs * 3 + 10);
    ctx.restore();
  }
}

const pcSameView = (a, b) => a.every((row, r) => row.every((v, c) => v === b[r][c]));

/* ==========================================================================
   重點 12：積木三視圖工作台——改每一疊的高度，看前、右、上視圖怎麼變
   ========================================================================== */
function initViewCanvas() {
  const cv = document.getElementById('canvas-view');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const showG = document.getElementById('vw-show-group');
  const presetG = document.getElementById('vw-preset-group');
  const out = document.getElementById('vw-formula');
  const fb = document.getElementById('vw-feedback');
  const C = PC_TONE[11];
  // 範例的視圖刻意避開 Q23～Q26 用到的每一種高度排列（開發約束 29）
  const PRESETS = {
    a: [[1, 2, 2], [1, 0, 2], [2, 3, 1]],
    b: [[3, 0, 1], [1, 3, 0], [1, 1, 0]],
    empty: [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  };
  const ED = { x: 44, y: 84, cs: 50 };
  let H = PRESETS.a.map(r => r.slice());
  let show = 'three';

  function draw() {
    const V = pcViews(H);
    const count = H.flat().reduce((a, b) => a + b, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '用正方體積木堆一個立體', C);

    // 左上：高度編輯器（像上視圖一樣擺，下方是前面）
    textCenter(ctx, '點格子改高度', ED.x + 75, 54, PC_YELLOW, f(800, 13));
    textCenter(ctx, '後面', ED.x + 75, ED.y - 12, MUTED, f(700, 12));
    for (let r = 0; r < 3; r++) {
      for (let x = 0; x < 3; x++) {
        const h = H[2 - r][x];
        const cx = ED.x + x * ED.cs, cy = ED.y + r * ED.cs;
        ctx.save();
        ctx.fillStyle = h ? pcRgba(PC_YELLOW, 0.18 + h * 0.2) : 'rgba(255,255,255,0.03)';
        ctx.fillRect(cx, cy, ED.cs, ED.cs);
        ctx.strokeStyle = 'rgba(203,213,225,0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx, cy, ED.cs, ED.cs);
        ctx.restore();
        textCenter(ctx, String(h), cx + ED.cs / 2, cy + ED.cs / 2 + 1, h ? '#f8fafc' : DIM, f(800, 20));
      }
    }
    textCenter(ctx, '前面', ED.x + 75, ED.y + 3 * ED.cs + 16, PC_GREEN, f(800, 13));
    textCenter(ctx, '左', ED.x - 14, ED.y + 75, MUTED, f(700, 12));
    textCenter(ctx, '右', ED.x + 3 * ED.cs + 14, ED.y + 75, MUTED, f(700, 12));

    // 右上：立體
    const ox = 300, oy = 200, s = 27;
    pcDrawBlocks(ctx, H, ox, oy, s);
    const fa = pcIsoPoint(ox, oy, s, 1.5, -1.9, 0), fz = pcIsoPoint(ox, oy, s, 1.5, -0.35, 0);
    drawArrow(ctx, fa[0], fa[1], fz[0], fz[1], PC_GREEN, 2.5);
    textCenter(ctx, '前面', fa[0] - 18, fa[1] + 10, PC_GREEN, f(800, 13));
    const ra = pcIsoPoint(ox, oy, s, 4.9, 1.5, 0), rz = pcIsoPoint(ox, oy, s, 3.35, 1.5, 0);
    drawArrow(ctx, ra[0], ra[1], rz[0], rz[1], PC_BLUE, 2.5);
    textCenter(ctx, '右面', ra[0] + 16, ra[1] + 10, PC_BLUE, f(800, 13));
    if (!count) textCenter(ctx, '還沒有積木', 380, 170, MUTED, f(800, 15));

    // 下方：視圖
    const cs = 34;
    let info1, info2;
    if (show === 'three') {
      [['前視圖', V.front, PC_GREEN], ['右視圖', V.right, PC_BLUE], ['上視圖', V.top, PC_YELLOW]].forEach(([label, g, col], k) => {
        const x = 50 + k * 170;
        textCenter(ctx, label, x + 51, 300, col, f(800, 14));
        pcDrawView(ctx, g, x, 314, cs, col);
      });
      const topCount = V.top.flat().reduce((a, b) => a + b, 0);
      info1 = `前視圖：每一欄最高 ${V.frontH.join('、')}；右視圖：每一排最高（前→後）${V.rightH.join('、')}`;
      info2 = `上視圖：${topCount} 個位置有積木（不管疊幾層）`;
    } else {
      const pair = show === 'fb'
        ? [['前視圖', V.front, PC_GREEN], ['後視圖', V.back, PC_GREEN]]
        : [['右視圖', V.right, PC_BLUE], ['左視圖', V.left, PC_BLUE]];
      pair.forEach(([label, g, col], k) => {
        const x = 168 + k * 102;
        textCenter(ctx, label, x + 51, 300, col, f(800, 14));
        pcDrawView(ctx, g, x, 314, cs, col);
      });
      ctx.save();
      ctx.setLineDash([6, 5]);
      pcLine(ctx, 270, 306, 270, 424, PC_PINK, 2.5);
      ctx.restore();
      info1 = show === 'fb' ? '後視圖＝前視圖左右翻轉' : '左視圖＝右視圖左右翻轉';
      info2 = '並排在一起是線對稱圖形，粉紅虛線是對稱軸';
    }
    drawPanel(ctx, 20, 440, 500, 104, C, 0.06);
    textCenter(ctx, `共 ${count} 個積木`, 270, 462, '#f8fafc', f(800, 15));
    wrapText(ctx, info1, 270, 494, 470, 20, INK, 13.5);
    textCenter(ctx, info2, 270, 526, MUTED, f(700, 13));

    out.innerHTML = `前視圖 ${V.frontH.join(', ')}；右視圖 ${V.rightH.join(', ')}；上視圖 ${V.top.flat().reduce((a, b) => a + b, 0)} 格`;
    let msg;
    if (!count) msg = '點左上角的格子加積木。';
    else if (show === 'three') msg = `前視圖看<b style="color:${C}">每一欄最高</b>、右視圖看<b style="color:${C}">每一排最高</b>（靠前面的在左邊），上視圖只看<b style="color:${C}">哪裡有積木</b>。`;
    else msg = '從後面看，原本在左邊的會跑到右邊，所以兩張視圖左右翻轉。知道前、右視圖，就能畫出後、左視圖。';
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  cv.addEventListener('click', e => {
    const p = canvasPos(cv, e);
    const x = Math.floor((p.x - ED.x) / ED.cs), r = Math.floor((p.y - ED.y) / ED.cs);
    if (x < 0 || x > 2 || r < 0 || r > 2) return;
    H[2 - r][x] = (H[2 - r][x] + 1) % 4;
    draw();
  });
  bindPickGroup(showG, 'data-vw-show', v => { show = v; draw(); });
  bindPickGroup(presetG, 'data-vw-preset', v => { H = PRESETS[v].map(r => r.slice()); draw(); });
  draw();
}

/* ==========================================================================
   重點 13：誰在哪一面看？——看一張視圖，判斷是從哪個方向看的
   ========================================================================== */
function initWhoCanvas() {
  const cv = document.getElementById('canvas-who');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const shapeG = document.getElementById('wh-shape-group');
  const ansG = document.getElementById('wh-ans-group');
  const nextB = document.getElementById('wh-next');
  const out = document.getElementById('wh-formula');
  const fb = document.getElementById('wh-feedback');
  const C = PC_TONE[12];
  // 五個方向的視圖兩兩不同，而且都不和 Q23～Q26 的視圖相同（開發約束 29）
  const SHAPES = {
    c: [[1, 1, 0], [3, 0, 0], [3, 2, 2]],
    d: [[1, 0, 2], [1, 0, 2], [3, 3, 0]]
  };
  const DIRS = ['front', 'back', 'left', 'right', 'top'];
  const NAME = { front: '前', back: '後', left: '左', right: '右', top: '上' };
  const COL = { front: PC_GREEN, back: PC_GREEN, left: PC_BLUE, right: PC_BLUE, top: PC_YELLOW };
  const ORDER = ['right', 'top', 'back', 'left', 'front'];
  let shape = 'c', qi = 0, answer = null;

  function clearAns() {
    ansG.querySelectorAll('.pick-btn').forEach(b => b.classList.remove('active'));
  }

  function draw() {
    const H = SHAPES[shape];
    const V = pcViews(H);
    const target = ORDER[qi];
    const matches = DIRS.filter(d => pcSameView(V[d], V[target]));
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '這張視圖是從哪一面看到的？', C);

    const ox = 44, oy = 206, s = 30;
    pcDrawBlocks(ctx, H, ox, oy, s);
    const tag = (d, x, y, z) => {
      const p = pcIsoPoint(ox, oy, s, x, y, z);
      pcLabelBox(ctx, NAME[d] + '面', p[0], p[1], answer === d ? PC_YELLOW : INK, f(800, 13));
    };
    tag('front', 1.1, -1.2, 0);
    tag('back', 1.9, 4.3, 1.6);
    tag('left', -1.1, 1.9, 2.2);
    tag('right', 4.2, 1.2, 0);
    tag('top', 1.5, 1.5, 4.2);

    textCenter(ctx, '題目的視圖', 404, 62, '#f8fafc', f(800, 14));
    pcDrawView(ctx, V[target], 338, 78, 44, pcRgba('#f8fafc', 0.75), answer ? (matches.includes(answer) ? OK_COLOR : NO_COLOR) : null);
    if (answer) {
      const ok = matches.includes(answer);
      const col = ok ? OK_COLOR : NO_COLOR;
      drawChip(ctx, 324, 226, 160, 34, ok ? `答對：${NAME[answer]}面` : `不是${NAME[answer]}面`, col, pcRgba(col, 0.12));
    } else {
      textCenter(ctx, '按下方的方向作答', 404, 243, MUTED, f(700, 13));
    }

    drawPanel(ctx, 20, 282, 500, 150, C, 0.06);
    if (answer) {
      DIRS.forEach((d, k) => {
        const x = 40 + k * 98;
        const frame = matches.includes(d) ? OK_COLOR : (d === answer ? NO_COLOR : null);
        textCenter(ctx, `從${NAME[d]}面看`, x + 36, 300, d === answer ? PC_YELLOW : INK, f(800, 12.5));
        pcDrawView(ctx, V[d], x, 316, 24, COL[d], frame);
      });
      textCenter(ctx, '綠框＝和題目一樣的視圖', 270, 410, OK_COLOR, f(700, 12.5));
    } else {
      textCenter(ctx, '先看：最高的一疊在左邊還是右邊？', 270, 330, INK, f(800, 14.5));
      textCenter(ctx, '前、後視圖左右翻轉；右、左視圖也左右翻轉', 270, 360, MUTED, f(700, 13.5));
      textCenter(ctx, '上視圖沒有高低，看的是哪裡有積木', 270, 390, MUTED, f(700, 13.5));
    }

    let line;
    if (!answer) line = `第 ${qi + 1} 張（共 5 張）`;
    else if (matches.includes(answer)) line = matches.length > 1 ? `答對！從 ${matches.map(d => NAME[d]).join('、')} 面看都一樣` : `答對！這是從${NAME[target]}面看到的`;
    else line = `從${NAME[answer]}面看到的是下方黃色標題那一張，和題目不一樣`;
    textCenter(ctx, line, 270, 462, answer ? (matches.includes(answer) ? OK_COLOR : NO_COLOR) : '#f8fafc', f(800, 15));
    textCenter(ctx, '按「換一張視圖」繼續', 270, 492, MUTED, f(700, 13));

    out.innerHTML = answer ? `你選「${NAME[answer]}面」：${matches.includes(answer) ? '正確' : '不對'}` : '從哪一面看到的？';
    let msg;
    if (!answer) msg = `上視圖和其他四張的樣子常常差很多；剩下四張，先比<b style="color:${C}">最高的那一疊在哪一邊</b>。`;
    else if (matches.includes(answer)) msg = `從${NAME[target]}面看，${target === 'top' ? '只看得到哪些位置有積木' : '每一疊只看得到最高的高度'}。`;
    else if ((answer === 'front' && target === 'back') || (answer === 'back' && target === 'front') || (answer === 'left' && target === 'right') || (answer === 'right' && target === 'left')) {
      msg = `方向剛好相反：${NAME[answer]}面與${NAME[target]}面看到的視圖<b style="color:${C}">左右翻轉</b>。`;
    } else msg = '比對下方五張視圖，找出和題目一樣的那一張。';
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(ansG, 'data-wh-ans', v => { answer = v; draw(); });
  bindPickGroup(shapeG, 'data-wh-shape', v => { shape = v; qi = 0; answer = null; clearAns(); draw(); });
  nextB.addEventListener('click', () => { qi = (qi + 1) % ORDER.length; answer = null; clearAns(); draw(); });
  draw();
}
