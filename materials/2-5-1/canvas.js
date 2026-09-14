/* ==========================================================================
   5-1 統計圖表與資料分析 — 互動 Canvas 與隨堂評量
   畫風：昭和熱血運動漫畫網點風（朱紅／群青／芥末黃／墨黑），主軸是班級體適能檢測與小考

   共用工具在 ../math-canvas.js（T／IT／FR／SEQ／drawExpr／drawStepRows／drawPanel／
   drawChip／drawTitle／drawDot／axisArrow／dashLine／textCenter／textLeft／wbrEq／
   wbrRel／canvasPos／bindPickGroup／numStr…），
   本檔只放本節專屬的色票、統計圖小工具，以及 12 個互動。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initBoardCanvas();
  initPieCanvas();
  initCrossCanvas();
  initTallyCanvas();
  initHistoCanvas();
  initPolyCanvas();
  initMeanCanvas();
  initFreqMeanCanvas();
  initGroupMeanCanvas();
  initMedianCanvas();
  initCumCanvas();
  initModeCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具
   ========================================================================== */

// 運動漫畫的印刷色（SP_ = Sports；共用檔沒有這個前綴的符號）
const SP_RED = '#f87171';
const SP_BLUE = '#60a5fa';
const SP_YELLOW = '#fcd34d';
const SP_GREEN = '#6ee7b7';
const SP_WOOD = '#fdba74';
const SP_CREAM = '#fef3c7';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const SP_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9', '#fca5a5'];

// 一組資料用的輪替色（分組、類別）
const SP_GROUP = [SP_RED, SP_WOOD, SP_YELLOW, SP_GREEN, SP_BLUE, '#d8b4fe', '#f9a8d4'];

// 取到小數第 digits 位；exact 表示原本就剛好是這個數（不是四捨五入來的）
function spApprox(v, digits) {
  const k = Math.pow(10, digits == null ? 2 : digits);
  const scaled = v * k;
  const r = Math.round(scaled);
  return { s: numStr(r / k), exact: Math.abs(scaled - r) < 1e-7 };
}

// 「= 6.6」或「≈ 6.35」（canvas 用）
function spEq(v, digits) {
  const a = spApprox(v, digits);
  return (a.exact ? '= ' : '≈ ') + a.s;
}

// 同上，LaTeX 用
function spEqTex(v, digits) {
  const a = spApprox(v, digits);
  return (a.exact ? '= ' : '\\approx ') + a.s;
}

// 靠右的一行字
function spTextRight(ctx, text, x, cy, color, font) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, cy);
  ctx.restore();
}

/**
 * 統計圖的坐標軸：原點在左下角，縱軸只在上端、橫軸只在右端有箭頭（開發約束 34）。
 * cfg：{ x0, y0, w, h, min, max, step, unit, cut }
 *   y0 是橫軸所在的高度；cut 為 true 時縱軸底部畫省略記號，min 畫在折線上方
 * 回傳 { py(v), top, bottom }：bottom 是 min 所在的高度
 */
function spAxes(ctx, cfg) {
  const { x0, y0, w, h, min, max, step } = cfg;
  const cut = !!cfg.cut;
  const top = y0 - h;
  const bottom = cut ? y0 - 18 : y0;
  const py = v => bottom - (v - min) / (max - min) * (bottom - top);
  ctx.save();
  ctx.font = f(700, 12);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let v = min; v <= max + 1e-9; v += step) {
    const y = py(v);
    if (y < bottom - 0.5) {
      ctx.strokeStyle = 'rgba(148,163,184,0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + w, y);
      ctx.stroke();
    }
    ctx.fillStyle = MUTED;
    ctx.fillText(numStr(v), x0 - 8, y);
  }
  if (cut) ctx.fillText('0', x0 - 8, y0);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0 + w + 6, y0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  if (cut) {
    ctx.lineTo(x0, y0 - 4);
    ctx.lineTo(x0 - 5, y0 - 7);
    ctx.lineTo(x0 + 5, y0 - 11);
    ctx.lineTo(x0, y0 - 14);
  }
  ctx.lineTo(x0, top - 8);
  ctx.stroke();
  ctx.restore();
  axisArrow(ctx, x0 + w + 6, y0, 'right', INK);
  axisArrow(ctx, x0, top - 8, 'up', INK);
  if (cfg.unit) textCenter(ctx, `(${cfg.unit})`, x0 - 32, top - 14, MUTED, f(700, 12));
  return { py, top, bottom };
}

// canvas 上的小方鈕（＋／－），同時登記點擊範圍
function spBtn(ctx, hits, x, cy, label, id, color) {
  const s = 26;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRect(ctx, x, cy - s / 2, s, s, 7);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  textCenter(ctx, label, x + s / 2, cy + 1, color, f(800, 17));
  hits.push({ x: x - 4, y: cy - s / 2 - 4, w: s + 8, h: s + 8, id });
}

function spHit(hits, px, py) {
  for (const b of hits) {
    if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b.id;
  }
  return null;
}

// 畫記的「正」字：一個字 5 筆，筆順是 上橫、中豎、中短橫、左豎、下橫
function spZheng(ctx, x, cy, n, color) {
  const s = 16;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  let left = n, gx = x;
  while (left > 0) {
    const k = Math.min(5, left);
    const t = cy - s / 2, b = cy + s / 2;
    const seg = [
      [gx, t, gx + s, t],
      [gx + s / 2, t, gx + s / 2, b],
      [gx + s / 2, cy, gx + s * 0.9, cy],
      [gx + s * 0.18, cy - 1, gx + s * 0.18, b],
      [gx, b, gx + s, b]
    ];
    for (let i = 0; i < k; i++) {
      ctx.beginPath();
      ctx.moveTo(seg[i][0], seg[i][1]);
      ctx.lineTo(seg[i][2], seg[i][3]);
      ctx.stroke();
    }
    left -= k;
    gx += s + 8;
  }
  ctx.restore();
}

// 帶深色底的標籤：壓在長條上也讀得到
function spLabelBox(ctx, text, x, cy, color, align) {
  ctx.save();
  ctx.font = f(800, 12.5);
  const w = ctx.measureText(text).width + 10;
  const left = align === 'right' ? x - w : x;
  ctx.fillStyle = 'rgba(15,23,42,0.85)';
  roundRect(ctx, left, cy - 10, w, 20, 5);
  ctx.fill();
  ctx.restore();
  textCenter(ctx, text, left + w / 2, cy, color, f(800, 12.5));
}

// 陣列總和
function spSum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第二冊 5-1 的 24 題正解
  // 正解字母分布：A 6 題、B 6 題、C 6 題、D 6 題（開發約束 36）
  const answers = {
    '5-1-1': 'B',    // 1～12 月平均氣溫適合折線圖
    '5-1-2': 'A',    // 第 2 次與第 5 次下降
    '5-1-3': 'A',    // 72° 占 20%，26 人 ⇒ 130 人
    '5-1-4': 'D',    // 75 ÷ 250 = 30%，108°
    '5-1-5': 'C',    // 男 11 + 女 (14 - 5) = 20
    '5-1-6': 'D',    // 甲 25%、乙 28%
    '5-1-7': 'B',    // 9 秒歸在 9～10
    '5-1-8': 'C',    // 35～65 共 6 組
    '5-1-9': 'A',    // 5 + 9 + 6 = 20
    '5-1-10': 'C',   // 直方圖的長方形相連
    '5-1-11': 'B',   // (65, 7)：60～70 這組 7 人
    '5-1-12': 'D',   // 孝班 14、忠班 8
    '5-1-13': 'A',   // 3000 + 350 ÷ 7 = 3050
    '5-1-14': 'B',   // 158 + 25 ÷ 25 = 159
    '5-1-15': 'C',   // 37 ÷ 20 = 1.85
    '5-1-16': 'A',   // 35 × 4 M+ 26 × 7 M+ MR
    '5-1-17': 'A',   // 620 ÷ 20 = 31
    '5-1-18': 'D',   // 組中點 × 次數
    '5-1-19': 'C',   // 排序後 (14 + 18) ÷ 2 = 16
    '5-1-20': 'B',   // 有極端值，中位數 400
    '5-1-21': 'D',   // 第 15、16 個 ⇒ 5.5
    '5-1-22': 'D',   // 第 18 個在 25～30
    '5-1-23': 'C',   // 23 與 24 都是眾數
    '5-1-24': 'B'    // 中位數 9.5
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
   重點 1：記分板——同一份資料畫成長條圖或折線圖，看哪一種適合；點兩項比差距
   ========================================================================== */
function initBoardCanvas() {
  const cv = document.getElementById('canvas-board');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const dataG = document.getElementById('bd-data-group');
  const typeG = document.getElementById('bd-type-group');
  const axisG = document.getElementById('bd-axis-group');
  const out = document.getElementById('bd-formula');
  const fb = document.getElementById('bd-feedback');
  const C = SP_TONE[0];

  const SETS = {
    sport: { title: '班上最喜歡的運動', labels: ['籃球', '排球', '羽球', '桌球', '跑步'],
             vals: [12, 7, 9, 4, 3], unit: '人', max: 14, step: 2, cutMin: 2, kind: 'cat', xName: '運動項目' },
    rope: { title: '大志一週每天的跳繩下數', labels: ['週一', '週二', '週三', '週四', '週五', '週六', '週日'],
            vals: [96, 104, 101, 112, 118, 109, 125], unit: '下', max: 130, step: 10, cutMin: 90, kind: 'time', xName: '星期' }
  };
  let set = 'sport', type = 'bar', axis = 'full';
  let sel = [0, 3];
  const X0 = 70, Y0 = 318, W = 430, H = 240;

  function draw() {
    const S = SETS[set];
    const n = S.vals.length;
    const cut = axis === 'cut';
    const min = cut ? S.cutMin : 0;
    const slot = W / n;
    const cx = i => X0 + slot * (i + 0.5);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `${S.title}（${type === 'bar' ? '長條圖' : '折線圖'}）`, C);
    const A = spAxes(ctx, { x0: X0, y0: Y0, w: W, h: H, min, max: S.max, step: S.step, unit: S.unit, cut });

    if (type === 'bar') {
      const bw = slot * 0.56;
      S.vals.forEach((v, i) => {
        const on = sel.includes(i);
        const y = A.py(v);
        ctx.save();
        ctx.fillStyle = on ? SP_YELLOW : C;
        ctx.globalAlpha = on ? 0.85 : 0.42;
        ctx.fillRect(cx(i) - bw / 2, y, bw, A.bottom - y);
        ctx.restore();
        textCenter(ctx, String(v), cx(i), y - 12, on ? SP_YELLOW : INK, f(800, 13));
      });
    } else {
      for (let i = 1; i < n; i++) {
        const d = S.vals[i] - S.vals[i - 1];
        const col = S.kind === 'cat' ? MUTED : (d > 0 ? OK_COLOR : (d < 0 ? NO_COLOR : INK));
        ctx.save();
        ctx.strokeStyle = col;
        ctx.lineWidth = 3;
        if (S.kind === 'cat') ctx.setLineDash([7, 6]);
        ctx.beginPath();
        ctx.moveTo(cx(i - 1), A.py(S.vals[i - 1]));
        ctx.lineTo(cx(i), A.py(S.vals[i]));
        ctx.stroke();
        ctx.restore();
      }
      S.vals.forEach((v, i) => {
        const on = sel.includes(i);
        drawDot(ctx, cx(i), A.py(v), on ? SP_YELLOW : C, on ? 8 : 6);
        textCenter(ctx, String(v), cx(i), A.py(v) - 18, on ? SP_YELLOW : INK, f(800, 13));
      });
    }
    S.labels.forEach((lb, i) => {
      textCenter(ctx, lb, cx(i), Y0 + 18, sel.includes(i) ? SP_YELLOW : MUTED, f(700, 13));
    });
    spTextRight(ctx, S.xName, X0 + W + 20, Y0 + 40, MUTED, f(700, 12));

    const V = {
      'sport-bar': ['適合：比較各項目的人數，用長條圖', OK_COLOR],
      'sport-line': ['不適合：運動項目沒有先後順序，連線沒有意義', NO_COLOR],
      'rope-line': ['適合：看得出每天比前一天上升還是下降', OK_COLOR],
      'rope-bar': ['可以比高低，但要看變化的趨勢，折線圖更清楚', SP_YELLOW]
    }[`${set}-${type}`];
    drawChip(ctx, 20, 364, 500, 32, V[0], V[1], 'rgba(15,23,42,0.55)');

    let l1, l2 = '', l3 = null, hi = -1, lo = -1, d = 0;
    if (sel.length === 2) {
      const [i, j] = sel;
      hi = S.vals[i] >= S.vals[j] ? i : j;
      lo = hi === i ? j : i;
      d = S.vals[hi] - S.vals[lo];
      l1 = `${S.labels[i]} ${S.vals[i]} ${S.unit}，${S.labels[j]} ${S.vals[j]} ${S.unit}`;
      l2 = d === 0 ? '兩個一樣多' : `${S.labels[hi]}比${S.labels[lo]}多 ${S.vals[hi]} − ${S.vals[lo]} = ${d} ${S.unit}`;
      if (cut && d > 0) {
        const vis = (S.vals[hi] - min) / (S.vals[lo] - min);
        const real = S.vals[hi] / S.vals[lo];
        l3 = [`縱軸從 ${min} 開始：看起來是 ${spApprox(vis, 1).s} 倍高，實際只有 ${spApprox(real, 2).s} 倍`, SP_RED];
      }
    } else {
      l1 = '點選圖上的兩個項目，比較它們相差多少';
    }
    if (!l3) {
      if (set === 'rope') {
        let up = 0, down = 0;
        for (let i = 1; i < S.vals.length; i++) {
          if (S.vals[i] > S.vals[i - 1]) up++;
          else if (S.vals[i] < S.vals[i - 1]) down++;
        }
        l3 = [`和前一天比：上升 ${up} 天、下降 ${down} 天`, MUTED];
      } else {
        l3 = [cut ? '縱軸有省略時，長條的高度不再和人數成正比' : '縱軸從 0 開始，長條的高度才和人數成正比', MUTED];
      }
    }
    textCenter(ctx, l1, 270, 424, INK, f(700, 14.5));
    if (l2) textCenter(ctx, l2, 270, 452, SP_YELLOW, f(800, 15));
    textCenter(ctx, l3[0], 270, 482, l3[1], f(700, 13.5));

    out.innerHTML = sel.length === 2
      ? `${S.labels[hi]}與${S.labels[lo]}相差 ` + wbrEq(`${S.vals[hi]} - ${S.vals[lo]} = ${d}`) + ` ${S.unit}`
      : '請在圖上點選兩個項目';
    const MSG = {
      'sport-bar': `運動項目是一個一個的<b style="color:${C}">類別</b>，彼此沒有先後順序，用長條圖比高低最清楚。`,
      'sport-line': `把「籃球」連到「排球」的那條線代表什麼？什麼都不代表。<b style="color:${C}">類別資料不要畫折線圖</b>。`,
      'rope-line': `星期有先後順序，線往上是比前一天多、往下是比前一天少，<b style="color:${C}">看趨勢用折線圖</b>。`,
      'rope-bar': `長條圖也比得出哪一天最多，但要看「一天比一天多還是少」，折線圖一眼就看出來。`
    };
    let msg = MSG[`${set}-${type}`];
    if (cut) msg += ' 縱軸用折線省略了下半段，差距會被放大，報讀時要看刻度上的數字，不能只比高度。';
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  cv.addEventListener('click', e => {
    const p = canvasPos(cv, e);
    const n = SETS[set].vals.length;
    if (p.y < 50 || p.y > Y0 + 30 || p.x < X0 || p.x >= X0 + W) return;
    const i = Math.floor((p.x - X0) / (W / n));
    const k = sel.indexOf(i);
    if (k >= 0) sel.splice(k, 1);
    else {
      sel.push(i);
      if (sel.length > 2) sel.shift();
    }
    draw();
  });
  bindPickGroup(dataG, 'data-bd-data', v => { set = v; sel = v === 'sport' ? [0, 3] : [1, 2]; draw(); });
  bindPickGroup(typeG, 'data-bd-type', v => { type = v; draw(); });
  bindPickGroup(axisG, 'data-bd-axis', v => { axis = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 2：運動會報名圓餅機——人數 → 百分率 → 圓心角
   ========================================================================== */
function initPieCanvas() {
  const cv = document.getElementById('canvas-pie');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sliders = [0, 1, 2, 3].map(i => document.getElementById(`pi-${i}-slider`));
  const valEls = [0, 1, 2, 3].map(i => document.getElementById(`pi-${i}-val`));
  const pickG = document.getElementById('pi-pick-group');
  const out = document.getElementById('pi-formula');
  const fb = document.getElementById('pi-feedback');
  const C = SP_TONE[1];
  const NAMES = ['大隊接力', '拔河', '跳繩', '趣味競賽'];
  const COLS = [SP_RED, SP_BLUE, SP_YELLOW, SP_GREEN];
  let pick = 1;

  function pctText(k, N) {
    const a = spApprox(100 * k / N, 1);
    return (a.exact ? '' : '≈') + a.s + '%';
  }

  function draw() {
    const cnt = sliders.map(s => parseInt(s.value, 10));
    cnt.forEach((k, i) => { valEls[i].textContent = k; });
    const N = spSum(cnt);
    const cx = 140, cy = 196, r = 110;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '運動會各項目的報名人數', C);

    if (N === 0) {
      ctx.save();
      ctx.strokeStyle = MUTED;
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      textCenter(ctx, '還沒有人報名', cx, cy, MUTED, f(800, 16));
      textCenter(ctx, '四個項目都是 0 人：總人數 0 不能當分母，畫不出圓形圖', 270, 400, NO_COLOR, f(700, 14.5));
      out.innerHTML = '總人數是 \\(0\\)，無法計算百分率';
      fb.innerHTML = wrapFeedback('至少要有一個項目有人報名，才畫得出圓形圖。把任一個滑桿往右拉。');
      typeset([out, fb]);
      return;
    }

    let a0 = -Math.PI / 2, pickStart = a0;
    cnt.forEach((k, i) => {
      const ang = 2 * Math.PI * k / N;
      if (i === pick) pickStart = a0;
      if (k > 0) {
        const mid = a0 + ang / 2;
        const off = i === pick ? 9 : 0;
        const ox = cx + off * Math.cos(mid), oy = cy + off * Math.sin(mid);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.arc(ox, oy, r, a0, a0 + ang);
        ctx.closePath();
        ctx.fillStyle = COLS[i];
        ctx.globalAlpha = i === pick ? 0.88 : 0.45;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(15,23,42,0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        textCenter(ctx, pctText(k, N), cx + (r + 26) * Math.cos(mid), cy + (r + 20) * Math.sin(mid), COLS[i], f(800, 13));
      }
      a0 += ang;
    });

    // 選中那一塊的圓心角
    const kp = cnt[pick];
    const deg = 360 * kp / N;
    if (kp > 0 && kp < N) {
      const ang = 2 * Math.PI * kp / N, mid = pickStart + ang / 2;
      const ox = cx + 9 * Math.cos(mid), oy = cy + 9 * Math.sin(mid);
      ctx.save();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ox, oy, 26, pickStart, pickStart + ang);
      ctx.stroke();
      ctx.restore();
      if (ang > 0.6) {
        const d = spApprox(deg, 1);
        textCenter(ctx, `${d.exact ? '' : '≈'}${d.s}°`, ox + 54 * Math.cos(mid), oy + 54 * Math.sin(mid), '#0f172a', f(800, 14));
      }
    }

    // 圖例
    cnt.forEach((k, i) => {
      const y = 86 + i * 46;
      if (i === pick) drawPanel(ctx, 306, y - 19, 222, 38, COLS[i], 0.12);
      ctx.save();
      ctx.fillStyle = COLS[i];
      ctx.fillRect(316, y - 8, 16, 16);
      ctx.restore();
      textLeft(ctx, NAMES[i], 340, y, COLS[i], f(800, 14));
      spTextRight(ctx, `${k} 人｜${pctText(k, N)}`, 520, y, i === pick ? '#ffffff' : INK, f(700, 13.5));
    });
    textLeft(ctx, `合計 ${N} 人`, 316, 276, INK, f(800, 15));
    textLeft(ctx, '四塊合起來是 100%、360°', 316, 302, MUTED, f(700, 13));

    const pe = spEq(100 * kp / N, 1);
    const rows = [
      { name: '① 總人數', hint: '四個項目加起來', items: [T(`${cnt.join(' + ')} = ${N}`, INK)] },
      { name: `② ${NAMES[pick]}的百分率`, hint: '這一項 ÷ 總人數 × 100%',
        items: [FR(kp, N, INK), T(`× 100% ${pe}%`, INK)] },
      { name: '③ 圓心角', hint: '整圈 360° 乘上占的比例',
        items: [T('360° ×', SP_YELLOW), FR(kp, N, SP_YELLOW), T(`${spEq(deg, 1)}°`, SP_YELLOW)], color: SP_YELLOW }
    ];
    drawStepRows(ctx, rows, 3, { top: 370, gap: 54, labX: 22, eqX: 196, size: 19, color: C });

    out.innerHTML = `${NAMES[pick]}：` + wbrEq(`${kp} \\div ${N} \\times 100\\% ${spEqTex(100 * kp / N, 1)}\\%`)
      + '，圓心角 ' + wbrEq(`360 \\times ${kp} \\div ${N} ${spEqTex(deg, 1)}`) + ' 度';
    let msg;
    if (kp === 0) {
      msg = `${NAMES[pick]}沒有人報名，占 \\(0\\%\\)，圓形圖上不會出現這一塊。`;
    } else if (kp === N) {
      msg = `所有人都報名${NAMES[pick]}，占 \\(100\\%\\)，整個圓都是它，圓心角是一整圈 \\(360\\) 度。`;
    } else {
      const pa = spApprox(100 * kp / N, 1), da = spApprox(deg, 1);
      msg = `${NAMES[pick]}有 \\(${kp}\\) 人，占全部 \\(${N}\\) 人的 <b style="color:${C}">${pa.exact ? '' : '約 '}${pa.s}%</b>，`
        + `在圓形圖上是 <b style="color:${C}">${da.exact ? '' : '約 '}${da.s} 度</b>的扇形。`;
      if (!pa.exact || !da.exact) msg += '除不盡時，百分率和角度都取近似值來畫。';
      msg += '四個項目的圓心角加起來剛好是一整圈 \\(360\\) 度。';
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  sliders.forEach(s => s.addEventListener('input', draw));
  bindPickGroup(pickG, 'data-pi-pick', v => { pick = parseInt(v, 10); draw(); });
  draw();
}

/* ==========================================================================
   重點 3：器材室分組列聯表——兩種屬性交叉分類，合計與總計互相核對
   ========================================================================== */
function initCrossCanvas() {
  const cv = document.getElementById('canvas-cross');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const modeG = document.getElementById('cr-mode-group');
  const out = document.getElementById('cr-formula');
  const fb = document.getElementById('cr-feedback');
  const C = SP_TONE[2];
  const SPORTS = ['籃球', '排球', '羽球'];
  const SHORT = ['籃', '排', '羽'];
  const COLS = [SP_WOOD, SP_BLUE, SP_GREEN];
  const GEN = ['男', '女'];
  // 前 8 位是男生、後 8 位是女生；數字是選的項目
  const choice = [0, 0, 1, 0, 2, 0, 1, 0, 1, 2, 1, 0, 2, 1, 2, 1];
  let last = 0, mode = 'full';
  const cards = [];
  const TX = 20, TCOL = [110, 95, 95, 95, 105], TTOP = 226, TRH = 44;

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '體育課選項調查：8 位男生、8 位女生', C);

    cards.length = 0;
    for (let i = 0; i < 16; i++) {
      const g = i < 8 ? 0 : 1, col = i % 8;
      const x = 76 + col * 56, y = g === 0 ? 52 : 120, w = 48, h = 58;
      const s = choice[i];
      ctx.save();
      ctx.fillStyle = COLS[s];
      ctx.globalAlpha = 0.16;
      roundRect(ctx, x, y, w, h, 9);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = i === last ? SP_YELLOW : COLS[s];
      ctx.lineWidth = i === last ? 3 : 1.5;
      ctx.stroke();
      ctx.fillStyle = COLS[s];
      ctx.beginPath();
      ctx.arc(x + w / 2, y + 21, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      textCenter(ctx, SHORT[s], x + w / 2, y + 46, COLS[s], f(800, 14));
      cards.push({ x, y, w, h, i });
    }
    textCenter(ctx, '男', 44, 81, INK, f(800, 16));
    textCenter(ctx, '女', 44, 149, INK, f(800, 16));
    textCenter(ctx, '點一下卡片，換這位同學選的項目', 270, 200, MUTED, f(700, 13));

    const m = [[0, 0, 0], [0, 0, 0]];
    choice.forEach((s, i) => { m[i < 8 ? 0 : 1][s]++; });
    const rt = m.map(r => spSum(r));
    const ct = [0, 1, 2].map(s => m[0][s] + m[1][s]);
    const tot = choice.length;
    const hg = last < 8 ? 0 : 1, hs = choice[last];
    const hide = mode === 'hide';

    const xs = [TX];
    TCOL.forEach(w => xs.push(xs[xs.length - 1] + w));
    const cell = (r, c) => ({ x: xs[c], y: TTOP + r * TRH, w: TCOL[c], h: TRH });
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        const b = cell(r, c);
        let bg = null;
        if (r === 0) bg = 'rgba(255,255,255,0.06)';
        else if (r === 3 || c === 4) bg = 'rgba(148,163,184,0.08)';
        if (r === hg + 1 && c === hs + 1) bg = 'rgba(252,211,77,0.18)';
        ctx.save();
        if (bg) {
          ctx.fillStyle = bg;
          ctx.fillRect(b.x, b.y, b.w, b.h);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.restore();
      }
    }
    // 表頭的斜線格
    const h0 = cell(0, 0);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(h0.x, h0.y);
    ctx.lineTo(h0.x + h0.w, h0.y + h0.h);
    ctx.stroke();
    ctx.restore();
    textCenter(ctx, '項目', h0.x + h0.w - 24, h0.y + 13, MUTED, f(700, 12));
    textCenter(ctx, '性別', h0.x + 24, h0.y + h0.h - 12, MUTED, f(700, 12));
    SPORTS.forEach((s, c) => {
      const b = cell(0, c + 1);
      textCenter(ctx, s, b.x + b.w / 2, b.y + b.h / 2, COLS[c], f(800, 15));
    });
    const bT = cell(0, 4);
    textCenter(ctx, '合計', bT.x + bT.w / 2, bT.y + bT.h / 2, INK, f(800, 15));
    [`${GEN[0]}生`, `${GEN[1]}生`, '合計'].forEach((s, r) => {
      const b = cell(r + 1, 0);
      textCenter(ctx, s, b.x + b.w / 2, b.y + b.h / 2, INK, f(800, 15));
    });

    const put = (r, c, v, color) => {
      const b = cell(r, c);
      textCenter(ctx, String(v), b.x + b.w / 2, b.y + b.h / 2 + 1, color, f(800, 18));
    };
    for (let g = 0; g < 2; g++) {
      for (let s = 0; s < 3; s++) {
        if (hide && g === hg && s === hs) put(g + 1, s + 1, '?', SP_YELLOW);
        else put(g + 1, s + 1, m[g][s], g === hg && s === hs ? SP_YELLOW : INK);
      }
      put(g + 1, 4, rt[g], SP_CREAM);
    }
    ct.forEach((v, s) => put(3, s + 1, v, SP_CREAM));
    put(3, 4, tot, SP_YELLOW);

    const outline = (b, color) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3);
      ctx.restore();
    };
    outline(cell(hg + 1, hs + 1), SP_YELLOW);
    if (hide) {
      outline(cell(hg + 1, 4), C);
      outline(cell(3, hs + 1), C);
    }

    const v = m[hg][hs];
    const others = [0, 1, 2].filter(s => s !== hs).map(s => m[hg][s]);
    let l1, l2, l3;
    if (hide) {
      l1 = `橫著看：${GEN[hg]}生合計 ${rt[hg]} − ${others.join(' − ')} = ${v}`;
      l2 = `直著看：${SPORTS[hs]}合計 ${ct[hs]} − ${GEN[1 - hg]}生 ${m[1 - hg][hs]} = ${v}`;
      l3 = '兩種算法答案相同：合計可以推回空格，也可以用來核對';
    } else {
      l1 = `總計 ${tot}：男 ${rt[0]} + 女 ${rt[1]}，也等於 ${ct.join(' + ')}`;
      l2 = `${GEN[hg]}生選${SPORTS[hs]}的有 ${v} 人（黃色那一格）`;
      l3 = `${SPORTS[hs]}：男生 ${m[0][hs]} 人、女生 ${m[1][hs]} 人`;
    }
    textCenter(ctx, l1, 270, 432, INK, f(700, 14.5));
    textCenter(ctx, l2, 270, 462, SP_YELLOW, f(800, 15));
    textCenter(ctx, l3, 270, 492, MUTED, f(700, 13.5));

    out.innerHTML = hide
      ? wbrEq(`${rt[hg]} - ${others[0]} - ${others[1]} = ${v}`)
      : wbrEq(`${rt[0]} + ${rt[1]} = ${ct[0]} + ${ct[1]} + ${ct[2]} = ${tot}`);
    const msg = hide
      ? `空格不必重新數：用同一橫列的合計減掉其他格，或用同一直欄的合計減掉另一個性別，都得到 <b style="color:${C}">\\(${v}\\)</b>。`
      : `每一<b style="color:${C}">橫列</b>最右邊是該性別的合計，每一<b style="color:${C}">直欄</b>最下面是該項目的合計，右下角是總計 \\(${tot}\\)。選${SPORTS[hs]}的男生 \\(${m[0][hs]}\\) 人、女生 \\(${m[1][hs]}\\) 人。`;
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  cv.addEventListener('click', e => {
    const p = canvasPos(cv, e);
    const c = cards.find(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
    if (!c) return;
    choice[c.i] = (choice[c.i] + 1) % 3;
    last = c.i;
    draw();
  });
  bindPickGroup(modeG, 'data-cr-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 4：成績分組機——組距、上下限，含下限不含上限
   ========================================================================== */
function initTallyCanvas() {
  const cv = document.getElementById('canvas-tally');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const wG = document.getElementById('ta-w-group');
  const sG = document.getElementById('ta-s-group');
  const out = document.getElementById('ta-formula');
  const fb = document.getElementById('ta-feedback');
  const C = SP_TONE[3];
  const SCORES = [58, 60, 70, 74, 80, 81, 90, 100, 45, 66, 69, 77, 83, 88, 92, 95, 50, 63, 79, 85];
  let w = 10, s = 40, pickI = 2;
  const chips = [];

  function groups() {
    const gs = [];
    for (let lo = s; lo < 100; lo += w) gs.push([lo, lo + w]);
    return gs;
  }

  // 含下限、不含上限；只有「滿分剛好等於最後一組的上限」時歸進最後一組
  function groupOf(gs, v) {
    let idx = gs.findIndex(([lo, hi]) => v >= lo && v < hi);
    if (idx < 0 && v === 100 && gs[gs.length - 1][1] === 100) idx = gs.length - 1;
    return idx;
  }

  function draw() {
    const gs = groups();
    const cnt = gs.map(() => 0);
    SCORES.forEach(v => { cnt[groupOf(gs, v)]++; });
    const v = SCORES[pickI];
    const gi = groupOf(gs, v);
    const [lo, hi] = gs[gi];
    const special = v === 100 && hi === 100;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `20 位同學的數學小考分數（組距 ${w} 分）`, C);

    chips.length = 0;
    SCORES.forEach((sc, i) => {
      const x = 22 + (i % 10) * 50, y = i < 10 ? 50 : 94, cw = 44, ch = 36;
      const col = SP_GROUP[groupOf(gs, sc) % SP_GROUP.length];
      ctx.save();
      ctx.fillStyle = col;
      ctx.globalAlpha = i === pickI ? 0.35 : 0.14;
      roundRect(ctx, x, y, cw, ch, 8);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = i === pickI ? SP_YELLOW : col;
      ctx.lineWidth = i === pickI ? 3 : 1.2;
      ctx.stroke();
      ctx.restore();
      textCenter(ctx, String(sc), x + cw / 2, y + ch / 2 + 1, i === pickI ? '#ffffff' : col, f(800, 15));
      chips.push({ x, y, w: cw, h: ch, i });
    });
    textCenter(ctx, '點一下分數，看它歸到哪一組', 270, 148, MUTED, f(700, 13));

    // 次數分配表
    const top = 170, hh = 32;
    const rh = gs.length > 3 ? 40 : 50;
    const cellRow = (y, h) => {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1;
      [[20, 150], [170, 220], [390, 130]].forEach(([x, cw]) => ctx.strokeRect(x, y, cw, h));
      ctx.restore();
    };
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(20, top, 500, hh);
    ctx.restore();
    cellRow(top, hh);
    textCenter(ctx, '分數（分）', 95, top + hh / 2, INK, f(800, 14));
    textCenter(ctx, '畫記', 280, top + hh / 2, INK, f(800, 14));
    textCenter(ctx, '次數（人）', 455, top + hh / 2, INK, f(800, 14));
    gs.forEach(([a, b], g) => {
      const y = top + hh + g * rh;
      const on = g === gi;
      if (on) {
        ctx.save();
        ctx.fillStyle = 'rgba(252,211,77,0.14)';
        ctx.fillRect(20, y, 500, rh);
        ctx.restore();
      }
      cellRow(y, rh);
      const col = SP_GROUP[g % SP_GROUP.length];
      textCenter(ctx, `${a}～${b}`, 95, y + rh / 2, on ? SP_YELLOW : col, f(800, 15));
      spZheng(ctx, 190, y + rh / 2, cnt[g], on ? SP_YELLOW : col);
      textCenter(ctx, String(cnt[g]), 455, y + rh / 2, on ? SP_YELLOW : INK, f(800, 17));
    });
    const yT = top + hh + gs.length * rh;
    ctx.save();
    ctx.fillStyle = 'rgba(148,163,184,0.08)';
    ctx.fillRect(20, yT, 500, 36);
    ctx.restore();
    cellRow(yT, 36);
    textCenter(ctx, '合計', 95, yT + 18, INK, f(800, 15));
    textCenter(ctx, String(spSum(cnt)), 455, yT + 18, SP_CREAM, f(800, 17));

    let e1, e2;
    if (special) {
      e1 = `${v} 分 → ${lo}～${hi}：滿分沒有更高的一組，歸進最後一組`;
      e2 = '其他分數一律「含下限、不含上限」';
    } else if (v === lo) {
      e1 = `${v} 分 → ${lo}～${hi}：剛好等於下限，算進這一組`;
      e2 = gi > 0 ? `不算進 ${gs[gi - 1][0]}～${lo}，因為 ${lo} 是那一組的上限（不含）` : '每一組都包含它的下限';
    } else {
      e1 = `${v} 分 → ${lo}～${hi}`;
      e2 = `因為 ${lo} ≤ ${v} < ${hi}：含下限 ${lo}、不含上限 ${hi}`;
    }
    textCenter(ctx, e1, 270, 512, SP_YELLOW, f(800, 15.5));
    textCenter(ctx, e2, 270, 540, INK, f(700, 13.5));

    out.innerHTML = `組距 \\(${w}\\) 分、共 \\(${gs.length}\\) 組；`
      + (special ? '\\(100\\) 分歸進最後一組' : wbrRel(`${lo} \\le ${v} \\lt ${hi}`));
    let msg = `每一組<b style="color:${C}">包含下限、不包含上限</b>，剛好落在分界上的分數只會進一組，不會重複也不會漏掉。`;
    if (s === 45) msg += '從 \\(45\\) 開始分組時，最後一組的上限超過 \\(100\\)，滿分本來就在組裡。';
    msg += `組距 \\(${w}\\) 分共分成 \\(${gs.length}\\) 組，合計 \\(${spSum(cnt)}\\) 人，和原本的人數一樣。`;
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  cv.addEventListener('click', e => {
    const p = canvasPos(cv, e);
    const c = chips.find(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
    if (!c) return;
    pickI = c.i;
    draw();
  });
  bindPickGroup(wG, 'data-ta-w', v => { w = parseInt(v, 10); draw(); });
  bindPickGroup(sG, 'data-ta-s', v => { s = parseInt(v, 10); draw(); });
  draw();
}

/* ==========================================================================
   重點 5：身高直方圖量尺——框出「以上（含）、未滿」的範圍，跨組相加
   ========================================================================== */
function initHistoCanvas() {
  const cv = document.getElementById('canvas-histo');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const typeG = document.getElementById('hi-type-group');
  const loS = document.getElementById('hi-lo-slider');
  const hiS = document.getElementById('hi-hi-slider');
  const loV = document.getElementById('hi-lo-val');
  const hiV = document.getElementById('hi-hi-val');
  const out = document.getElementById('hi-formula');
  const fb = document.getElementById('hi-feedback');
  const C = SP_TONE[4];
  const B = [145, 150, 155, 160, 165, 170, 175];
  const CNT = [3, 5, 8, 6, 4, 2];
  let type = 'histo';
  const X0 = 70, Y0 = 290, W = 430, H = 200;

  function draw() {
    const lo = parseInt(loS.value, 10);
    const hi = parseInt(hiS.value, 10);
    loV.textContent = lo;
    hiV.textContent = hi;
    const ok = lo < hi;
    const slot = W / CNT.length;
    const px = v => X0 + (v - B[0]) / 5 * slot;
    const inR = g => ok && B[g] >= lo && B[g + 1] <= hi;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `28 位同學的身高（${type === 'histo' ? '直方圖' : '畫成長條圖的樣子'}）`, C);
    const A = spAxes(ctx, { x0: X0, y0: Y0, w: W, h: H, min: 0, max: 10, step: 2, unit: '人' });

    CNT.forEach((c, g) => {
      const on = inR(g);
      const bw = type === 'histo' ? slot : slot * 0.6;
      const x = X0 + g * slot + (slot - bw) / 2;
      const y = A.py(c);
      ctx.save();
      ctx.fillStyle = on ? SP_YELLOW : C;
      ctx.globalAlpha = on ? 0.8 : 0.38;
      ctx.fillRect(x, y, bw, Y0 - y);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(15,23,42,0.95)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, bw, Y0 - y);
      ctx.restore();
      textCenter(ctx, String(c), X0 + (g + 0.5) * slot, y - 11, on ? SP_YELLOW : INK, f(800, 13));
      if (type === 'bar') textCenter(ctx, `${B[g]}～${B[g + 1]}`, X0 + (g + 0.5) * slot, Y0 + 18, MUTED, f(700, 11));
    });
    if (type === 'histo') B.forEach(b => textCenter(ctx, String(b), px(b), Y0 + 18, MUTED, f(700, 12)));
    spTextRight(ctx, '身高（公分）', X0 + W + 20, Y0 + 40, MUTED, f(700, 12));

    if (ok) {
      dashLine(ctx, px(lo), 66, px(lo), Y0, SP_YELLOW);
      dashLine(ctx, px(hi), 66, px(hi), Y0, SP_YELLOW);
      textCenter(ctx, `${lo} 以上（含）`, px(lo), 54, SP_YELLOW, f(800, 12.5));
      textCenter(ctx, `未滿 ${hi}`, px(hi), hi - lo <= 5 ? 74 : 54, SP_YELLOW, f(800, 12.5));
    }

    if (type === 'histo') {
      drawChip(ctx, 20, 346, 500, 30, '直方圖：身高是連續的數，相鄰的長方形緊緊相連', OK_COLOR, 'rgba(15,23,42,0.55)');
    } else {
      drawChip(ctx, 20, 346, 500, 30, '長條圖的長方形分開，適合沒有順序的類別', NO_COLOR, 'rgba(15,23,42,0.55)');
    }

    if (!ok) {
      textCenter(ctx, '範圍不成立：「未滿」的數要比「以上」的數大', 270, 430, NO_COLOR, f(800, 15));
      textCenter(ctx, '把「未滿」的滑桿調得比「以上」大，才框得出一段身高', 270, 462, MUTED, f(700, 13.5));
      out.innerHTML = '範圍不成立';
      fb.innerHTML = wrapFeedback(`\\(${lo}\\) 公分以上、未滿 \\(${hi}\\) 公分的身高不存在。把第二個滑桿調得比第一個大。`);
      typeset([out, fb]);
      return;
    }

    const gIn = CNT.map((c, g) => g).filter(inR);
    const terms = gIn.map(g => CNT[g]);
    const sum = spSum(terms);
    const rows = [
      { name: '① 範圍', hint: `${lo} 以上（含）、未滿 ${hi}`, items: [T(`${lo} ≤ 身高 < ${hi}`, INK)] },
      { name: '② 包含的組', hint: '整組都在範圍裡', items: [T(gIn.map(g => `${B[g]}～${B[g + 1]}`).join('、'), INK)] },
      { name: '③ 人數', hint: '把這幾組的次數相加',
        items: [T(terms.length > 1 ? `${terms.join(' + ')} = ${sum} 人` : `${sum} 人`, SP_YELLOW)], color: SP_YELLOW }
    ];
    drawStepRows(ctx, rows, 3, { top: 414, gap: 48, labX: 22, eqX: 170, size: 18, color: C });

    out.innerHTML = (terms.length > 1 ? wbrEq(`${terms.join(' + ')} = ${sum}`) : `\\(${sum}\\)`) + ' 人';
    let msg = `「\\(${lo}\\) 公分以上（含）」包含 \\(${lo}\\)，「未滿 \\(${hi}\\)」不包含 \\(${hi}\\)，剛好對上 \\(${gIn.length}\\) 組，共 <b style="color:${C}">\\(${sum}\\) 人</b>。`;
    if (gIn.length > 1) msg += '跨好幾組時，每一組都要加進去，不能只看其中一組。';
    if (type === 'bar') msg += '直方圖的橫軸是連續的數值，所以長方形要緊緊相連，不像長條圖那樣分開。';
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  [loS, hiS].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(typeG, 'data-hi-type', v => { type = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 6：兩班折線對照台——組中點、疊上直方圖、比較兩班
   ========================================================================== */
function initPolyCanvas() {
  const cv = document.getElementById('canvas-poly');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const viewG = document.getElementById('po-view-group');
  const histoG = document.getElementById('po-histo-group');
  const gS = document.getElementById('po-g-slider');
  const tS = document.getElementById('po-t-slider');
  const gV = document.getElementById('po-g-val');
  const tV = document.getElementById('po-t-val');
  const out = document.getElementById('po-formula');
  const fb = document.getElementById('po-feedback');
  const C = SP_TONE[5];
  const B = [140, 150, 160, 170, 180, 190, 200, 210];
  const A1 = [1, 3, 6, 8, 5, 2, 0];   // 甲班 25 人
  const A2 = [0, 2, 4, 5, 9, 6, 3];   // 乙班 29 人
  let view = 'two', histo = 'off';
  const X0 = 70, Y0 = 300, W = 430, H = 210;

  function draw() {
    const g = parseInt(gS.value, 10);
    const t = parseInt(tS.value, 10);
    const two = view === 'two';
    gV.textContent = `${B[g]}～${B[g + 1]}`;
    tV.textContent = t;
    const slot = W / 7;
    const px = v => X0 + (v - 140) / 10 * slot;
    const mid = gg => B[gg] + 5;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, two ? '甲、乙兩班立定跳遠的次數分配折線圖' : '甲班立定跳遠的次數分配折線圖', C);
    ctx.save();
    ctx.fillStyle = 'rgba(252,211,77,0.07)';
    ctx.fillRect(X0, Y0 - H, px(t) - X0, H);
    ctx.restore();
    const A = spAxes(ctx, { x0: X0, y0: Y0, w: W, h: H, min: 0, max: 10, step: 2, unit: '人' });

    if (histo === 'on') {
      A1.forEach((c, gg) => {
        if (c === 0) return;
        const x = px(B[gg]), y = A.py(c);
        ctx.save();
        ctx.fillStyle = SP_RED;
        ctx.globalAlpha = 0.16;
        ctx.fillRect(x, y, slot, Y0 - y);
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = SP_RED;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x, y, slot, Y0 - y);
        ctx.restore();
      });
    }
    B.forEach(b => textCenter(ctx, String(b), px(b), Y0 + 18, MUTED, f(700, 12)));

    dashLine(ctx, px(mid(g)), 68, px(mid(g)), Y0, SP_CREAM);
    textCenter(ctx, `組中點 ${mid(g)}`, px(mid(g)), 56, SP_CREAM, f(800, 12.5));
    dashLine(ctx, px(t), 86, px(t), Y0, SP_YELLOW);
    textCenter(ctx, `未滿 ${t}`, px(t), 78, SP_YELLOW, f(800, 12.5));

    const poly = (arr, color) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      arr.forEach((c, gg) => {
        const x = px(mid(gg)), y = A.py(c);
        if (gg) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
      arr.forEach((c, gg) => drawDot(ctx, px(mid(gg)), A.py(c), color, gg === g ? 7.5 : 5));
    };
    poly(A1, SP_RED);
    if (two) poly(A2, SP_BLUE);

    // 圖例與橫軸名稱
    const legend = (x, color, text) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, Y0 + 42);
      ctx.lineTo(x + 20, Y0 + 42);
      ctx.stroke();
      ctx.restore();
      textLeft(ctx, text, x + 26, Y0 + 42, color, f(800, 13));
    };
    legend(64, SP_RED, `甲班（${spSum(A1)} 人）`);
    if (two) legend(190, SP_BLUE, `乙班（${spSum(A2)} 人）`);
    spTextRight(ctx, '立定跳遠（公分）', X0 + W + 20, Y0 + 42, MUTED, f(700, 12));

    const lo = B[g], hi = B[g + 1];
    const a = A1[g], b = A2[g];
    const k = B.indexOf(t);
    const sa = spSum(A1.slice(0, k)), sb = spSum(A2.slice(0, k));
    const who = sa === sb ? '一樣多' : (sa > sb ? `甲班多 ${sa - sb} 人` : `乙班多 ${sb - sa} 人`);
    const rows = [
      { name: '① 組中點', hint: `${lo}～${hi} 這一組`, items: [T(`(${lo} + ${hi}) ÷ 2 = ${mid(g)}`, INK)] },
      { name: '② 這一組的人數', hint: '點畫在組中點的正上方',
        items: [T(two ? `甲 ${a} 人、乙 ${b} 人，相差 ${Math.abs(a - b)} 人` : `甲班 ${a} 人 → 點 (${mid(g)}, ${a})`, INK)] },
      { name: `③ 未滿 ${t} 公分`, hint: `從 140 起共 ${k} 組相加`,
        items: [T(two ? `甲 ${sa} 人、乙 ${sb} 人：${who}` : (k > 1 ? `${A1.slice(0, k).join(' + ')} = ${sa} 人` : `${sa} 人`), SP_YELLOW)],
        color: SP_YELLOW }
    ];
    drawStepRows(ctx, rows, 3, { top: 386, gap: 52, labX: 22, eqX: 190, size: 18, color: C });

    let note;
    if (two) {
      const diffs = A1.map((c, gg) => Math.abs(c - A2[gg]));
      const dm = Math.max(...diffs);
      const idx = diffs.map((d, gg) => (d === dm ? gg : -1)).filter(gg => gg >= 0);
      note = `兩班差距最大的是 ${idx.map(gg => `${B[gg]}～${B[gg + 1]}`).join(' 與 ')}（相差 ${dm} 人）`;
    } else {
      note = histo === 'on' ? '把直方圖每個長方形上緣的中點連起來，就是這條折線' : '打開直方圖，看看折線的點落在哪裡';
    }
    textCenter(ctx, note, 270, 540, MUTED, f(700, 13.5));

    out.innerHTML = wbrEq(`(${lo} + ${hi}) \\div 2 = ${mid(g)}`)
      + `；未滿 \\(${t}\\) 公分：` + (two ? `甲 \\(${sa}\\) 人、乙 \\(${sb}\\) 人` : `\\(${sa}\\) 人`);
    let msg = `折線圖的每個點畫在<b style="color:${C}">組中點</b>的正上方，高度是那一組的人數。`;
    if (two) {
      msg += `「未滿 \\(${t}\\) 公分」要把 \\(${k}\\) 組都加起來：甲班 \\(${sa}\\) 人、乙班 \\(${sb}\\) 人，${who}。`;
    } else if (histo === 'on') {
      msg += '直方圖每個長方形上緣的中點，正好就是折線圖的點。';
    } else {
      msg += `\\(${lo}\\)～\\(${hi}\\) 這組的組中點是 \\(${mid(g)}\\)，所以畫出點 \\((${mid(g)}, ${a})\\)。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  [gS, tS].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(viewG, 'data-po-view', v => { view = v; draw(); });
  bindPickGroup(histoG, 'data-po-histo', v => { histo = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 7：平均水位槽——削高補低、基準差距法、登記錯誤對平均的影響
   ========================================================================== */
function initMeanCanvas() {
  const cv = document.getElementById('canvas-mean');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const modeG = document.getElementById('me-mode-group');
  const baseRow = document.getElementById('me-base-row');
  const fixRow = document.getElementById('me-fix-row');
  const baseS = document.getElementById('me-base-slider');
  const idxS = document.getElementById('me-idx-slider');
  const dS = document.getElementById('me-d-slider');
  const baseV = document.getElementById('me-base-val');
  const idxV = document.getElementById('me-idx-val');
  const dV = document.getElementById('me-d-val');
  const out = document.getElementById('me-formula');
  const fb = document.getElementById('me-feedback');
  const C = SP_TONE[6];
  const vals = [118, 124, 109, 130, 121, 124];
  let mode = 'level', dragI = -1;
  const X0 = 70, Y0 = 290, W = 430, H = 220, MIN = 100, MAX = 160, TOP_VAL = 145;
  const slot = W / vals.length, bw = slot * 0.55;
  let A = null;
  cv.style.touchAction = 'none';

  const par = v => (v < 0 ? `(${v})` : String(v));

  function bar(x, yTop, yBot, color, alpha, outlineOnly) {
    if (yBot - yTop < 0.5) return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = outlineOnly ? 0.12 : alpha;
    ctx.fillRect(x, yTop, bw, yBot - yTop);
    if (outlineOnly) {
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = color;
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.8;
      ctx.strokeRect(x, yTop, bw, yBot - yTop);
    }
    ctx.restore();
  }

  function draw(light) {
    baseRow.hidden = mode !== 'base';
    fixRow.hidden = mode !== 'fix';
    const n = vals.length;
    const sum = spSum(vals);
    const m = sum / n;
    const b = parseInt(baseS.value, 10);
    const k = parseInt(idxS.value, 10);
    const d = parseInt(dS.value, 10);
    baseV.textContent = b;
    idxV.textContent = k;
    dV.textContent = d;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'fix' ? `第 ${k} 次多記了 ${d} 下，平均會差多少？` : '大志 6 次一分鐘跳繩（拖曳長條可以改下數）', C);
    A = spAxes(ctx, { x0: X0, y0: Y0, w: W, h: H, min: MIN, max: MAX, step: 10, unit: '下', cut: true });
    const cx = i => X0 + slot * (i + 0.5);

    vals.forEach((v, i) => {
      const x = cx(i) - bw / 2;
      const yv = A.py(v);
      if (mode === 'level') {
        const ym = A.py(m);
        bar(x, Math.max(yv, ym), A.bottom, C, 0.35);
        if (v > m) bar(x, yv, ym, SP_RED, 0.7);
        else if (v < m) bar(x, ym, yv, SP_BLUE, 0, true);
      } else if (mode === 'base') {
        const yb = A.py(b);
        bar(x, Math.max(yv, yb), A.bottom, C, 0.35);
        if (v > b) bar(x, yv, yb, OK_COLOR, 0.6);
        else if (v < b) bar(x, yb, yv, NO_COLOR, 0, true);
        const dd = v - b;
        textCenter(ctx, dd > 0 ? `+${dd}` : String(dd), cx(i), Math.min(yv, yb) - 12,
          dd > 0 ? OK_COLOR : (dd < 0 ? NO_COLOR : INK), f(800, 13.5));
      } else {
        bar(x, yv, A.bottom, C, 0.45);
        if (i === k - 1 && d > 0) {
          const yw = A.py(v + d);
          bar(x, yw, yv, NO_COLOR, 0.6);
          textCenter(ctx, `記成 ${v + d}`, cx(i), yw - 12, NO_COLOR, f(800, 13));
        }
      }
      textCenter(ctx, String(v), cx(i), A.bottom - 12, '#ffffff', f(800, 13));
      textCenter(ctx, `第 ${i + 1} 次`, cx(i), Y0 + 18, MUTED, f(700, 12));
    });

    if (mode === 'level') {
      dashLine(ctx, X0, A.py(m), X0 + W, A.py(m), SP_YELLOW);
      spLabelBox(ctx, `平均 ${spApprox(m, 1).s}`, X0 + W, A.py(m) - 13, SP_YELLOW, 'right');
    } else if (mode === 'base') {
      dashLine(ctx, X0, A.py(b), X0 + W, A.py(b), SP_GREEN);
      spLabelBox(ctx, `基準 ${b}`, X0 + W, A.py(b) + 14, SP_GREEN, 'right');
    } else {
      const mw = (sum + d) / n;
      dashLine(ctx, X0, A.py(m), X0 + W, A.py(m), SP_GREEN);
      if (d > 0) {
        dashLine(ctx, X0, A.py(mw), X0 + W, A.py(mw), NO_COLOR);
        spLabelBox(ctx, `登記的平均 ${spApprox(mw, 1).s}`, X0 + W, A.py(mw) - 13, NO_COLOR, 'right');
      }
      spLabelBox(ctx, `正確的平均 ${spApprox(m, 1).s}`, X0 + 4, A.py(m) + 14, SP_GREEN, 'left');
    }

    let rows;
    if (mode === 'level') {
      const above = spSum(vals.map(v => Math.max(0, v - m)));
      rows = [
        { name: '① 總和', hint: '6 次加起來', items: [T(`${vals.join(' + ')} = ${sum}`, INK)] },
        { name: '② 削高補低', hint: '高出的部分剛好補滿不足的部分',
          items: [T(`高出 ${spApprox(above).s} = 不足 ${spApprox(above).s}`, INK)] },
        { name: '③ 平均', hint: '總和 ÷ 次數', items: [T(`${sum} ÷ ${n} ${spEq(m)} 下`, SP_YELLOW)], color: SP_YELLOW }
      ];
      drawStepRows(ctx, rows, 3, { top: 356, gap: 54, labX: 22, eqX: 180, size: 17, color: C });
    } else if (mode === 'base') {
      const diffs = vals.map(v => v - b);
      const S = spSum(diffs);
      rows = [
        { name: '① 和基準的差', hint: `基準 ${b} 下`, items: [T(`${diffs.map((x, i) => (i ? par(x) : String(x))).join(' + ')} = ${S}`, INK)] },
        { name: '② 差的平均', hint: '差的總和 ÷ 6', items: [T(`${par(S)} ÷ 6 ${spEq(S / 6)}`, INK)] },
        { name: '③ 平均', hint: '基準 + 差的平均', items: [T(`${b} + ${par(S)} ÷ 6 ${spEq(m)} 下`, SP_YELLOW)], color: SP_YELLOW }
      ];
      drawStepRows(ctx, rows, 3, { top: 356, gap: 54, labX: 22, eqX: 180, size: 17, color: C });
    } else {
      const v = vals[k - 1];
      const mw = (sum + d) / n;
      rows = [
        { name: '① 登記的平均', hint: `第 ${k} 次記成 ${v + d}`, items: [T(`(${sum} + ${d}) ÷ 6 ${spEq(mw)}`, NO_COLOR)] },
        { name: '② 總和多算了', hint: '只有那一筆記錯', items: [T(`${v + d} − ${v} = ${d}`, INK)] },
        { name: '③ 平均多算了', hint: '多出來的平分給 6 次', items: [T(`${d} ÷ 6 ${spEq(d / 6)}`, INK)] },
        { name: '④ 正確的平均', hint: '總和 ÷ 次數', items: [T(`${sum} ÷ 6 ${spEq(m)} 下`, SP_GREEN)], color: SP_GREEN }
      ];
      drawStepRows(ctx, rows, 4, { top: 352, gap: 46, labX: 22, eqX: 180, size: 17, color: C });
    }

    if (light) return;
    let msg;
    if (mode === 'level') {
      out.innerHTML = wbrEq(`${sum} \\div ${n} ${spEqTex(m)}`) + ' 下';
      msg = `把高出平均的紅色部分削下來，剛好補滿藍框不足的部分，每一次都變成 \\(${spApprox(m).s}\\) 下：<b style="color:${C}">平均數就是「平分之後每一份的量」</b>。`;
    } else if (mode === 'base') {
      const S = spSum(vals.map(v => v - b));
      out.innerHTML = wbrEq(`${b} + ${par(S)} \\div 6 ${spEqTex(m)}`) + ' 下';
      msg = `每一次都先和 \\(${b}\\) 比，差距加起來是 \\(${S}\\)，平分給 6 次，再加回 \\(${b}\\)。<b style="color:${C}">基準改成多少，算出來的平均都一樣</b>，挑一個好算的數當基準就好。`;
    } else {
      out.innerHTML = '平均多算了 ' + wbrEq(`${d} \\div 6 ${spEqTex(d / 6)}`) + ' 下';
      msg = d === 0
        ? '沒有記錯，登記的平均就是正確的平均。拉動「多記了幾下」看看。'
        : `<b style="color:${C}">總和 = 平均 × 個數</b>。多記了 \\(${d}\\) 下，總和就多 \\(${d}\\)，平分給 6 次，平均只多 \\(${spApprox(d / 6).s}\\) 下${spApprox(d / 6).exact ? '' : '左右'}，不必全部重算。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  function setAt(y) {
    const v = Math.round(MIN + (A.bottom - y) / (A.bottom - A.top) * (MAX - MIN));
    vals[dragI] = clamp(v, MIN, TOP_VAL);
  }
  cv.addEventListener('pointerdown', e => {
    const p = canvasPos(cv, e);
    if (!A || p.x < X0 || p.x >= X0 + W || p.y < 50 || p.y > Y0) return;
    dragI = Math.floor((p.x - X0) / slot);
    setAt(p.y);
    if (cv.setPointerCapture) cv.setPointerCapture(e.pointerId);
    draw(true);
  });
  cv.addEventListener('pointermove', e => {
    if (dragI < 0) return;
    setAt(canvasPos(cv, e).y);
    draw(true);
  });
  const end = () => {
    if (dragI < 0) return;
    dragI = -1;
    draw();
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
  [baseS, idxS, dS].forEach(s => s.addEventListener('input', () => draw()));
  bindPickGroup(modeG, 'data-me-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 8：投籃記分板＋M+ 計算機——值 × 次數的總和，除以總人數
   ========================================================================== */
function initFreqMeanCanvas() {
  const cv = document.getElementById('canvas-fmean');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const modeG = document.getElementById('fm-mode-group');
  const nextB = document.getElementById('fm-next');
  const allB = document.getElementById('fm-all');
  const resetB = document.getElementById('fm-reset');
  const out = document.getElementById('fm-formula');
  const fb = document.getElementById('fm-feedback');
  const C = SP_TONE[7];
  const VALS = [4, 5, 6, 7, 8, 9];
  const cnt = [2, 3, 6, 8, 4, 2];
  let mode = 'right', ks = 0;
  const hits = [];

  function keys() {
    const N = spSum(cnt);
    const k = ['AC'];
    VALS.forEach((v, i) => {
      if (cnt[i] > 0) k.push(String(v), '×', String(cnt[i]), 'M+');
    });
    k.push('MR', '÷', mode === 'right' ? String(N) : String(VALS.length), '=');
    return k;
  }

  // 沒有先乘除後加減的計算機：× ÷ 記下前一個數，M+ 與 = 才算出結果
  function run(k, upto) {
    let disp = 0, mem = 0, acc = 0, op = null;
    for (let i = 0; i < upto; i++) {
      const key = k[i];
      if (key === 'AC') { disp = 0; mem = 0; op = null; }
      else if (key === '×' || key === '÷') { acc = disp; op = key; }
      else if (key === 'M+' || key === '=') {
        if (op) {
          disp = op === '×' ? acc * disp : acc / disp;
          op = null;
        }
        if (key === 'M+') mem += disp;
      } else if (key === 'MR') disp = mem;
      else disp = Number(key);
    }
    return { disp, mem };
  }

  function draw() {
    const N = spSum(cnt);
    const S = spSum(VALS.map((v, i) => v * cnt[i]));
    const K = keys();
    ks = Math.min(ks, K.length);
    const st = run(K, ks);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '每人投 10 球的進球數：先算總和，再除以總人數', C);

    hits.length = 0;
    textCenter(ctx, '進球數', 50, 58, MUTED, f(800, 13));
    textCenter(ctx, '人數（人）', 152, 58, MUTED, f(800, 13));
    textCenter(ctx, '進球數×人數', 240, 58, MUTED, f(800, 13));
    VALS.forEach((v, i) => {
      const y = 92 + i * 38;
      if (i % 2 === 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(16, y - 19, 260, 38);
        ctx.restore();
      }
      textCenter(ctx, `${v} 球`, 50, y, INK, f(800, 15));
      spBtn(ctx, hits, 104, y, '−', `m${i}`, MUTED);
      textCenter(ctx, String(cnt[i]), 152, y, SP_YELLOW, f(800, 17));
      spBtn(ctx, hits, 174, y, '+', `p${i}`, C);
      textCenter(ctx, `${v}×${cnt[i]} = ${v * cnt[i]}`, 240, y, cnt[i] ? INK : DIM, f(700, 13));
    });
    textCenter(ctx, '合計', 50, 322, INK, f(800, 15));
    textCenter(ctx, String(N), 152, 322, SP_CREAM, f(800, 17));
    textCenter(ctx, String(S), 240, 322, SP_CREAM, f(800, 17));

    // 計算機
    drawPanel(ctx, 292, 44, 232, 292, C, 0.06);
    ctx.save();
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    roundRect(ctx, 304, 56, 208, 64, 10);
    ctx.fill();
    ctx.restore();
    if (st.mem !== 0) textLeft(ctx, 'M', 314, 72, SP_YELLOW, f(800, 12));
    textLeft(ctx, `記憶 ${numStr(st.mem)}`, 332, 72, MUTED, f(700, 12));
    spTextRight(ctx, spApprox(st.disp, 4).s, 502, 100, SP_CREAM, f(800, 26));
    K.forEach((key, i) => {
      const x = 304 + (i % 5) * 42, y = 134 + Math.floor(i / 5) * 30;
      const done = i < ks, cur = i === ks - 1;
      const memKey = key === 'M+' || key === 'MR';
      ctx.save();
      ctx.fillStyle = cur ? SP_YELLOW : (done ? 'rgba(148,163,184,0.18)' : 'rgba(255,255,255,0.05)');
      roundRect(ctx, x, y, 38, 24, 6);
      ctx.fill();
      ctx.strokeStyle = memKey ? C : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
      textCenter(ctx, key, x + 19, y + 12.5, cur ? '#0f172a' : (done ? INK : DIM), f(800, 12.5));
    });

    if (N === 0) {
      textCenter(ctx, '總人數是 0：沒有人可以平均', 270, 420, NO_COLOR, f(800, 15));
      textCenter(ctx, '按「+」加入幾位同學', 270, 450, MUTED, f(700, 13.5));
      out.innerHTML = '總人數是 \\(0\\)，無法計算平均';
      fb.innerHTML = wrapFeedback('每一種進球數都是 0 人，分母是 0，平均數算不出來。');
      typeset([out, fb]);
      return;
    }

    const terms = VALS.map((v, i) => (cnt[i] ? `${v}×${cnt[i]}` : null)).filter(Boolean).join(' + ');
    const right = mode === 'right';
    const rows = [
      { name: '① 總進球數', hint: '進球數 × 人數，再相加', items: [T(`${terms} = ${S}`, INK)] },
      { name: '② 總人數', hint: '人數加起來，不是 6 種', items: [T(`${cnt.filter(c => c).join(' + ')} = ${N}`, INK)] },
      right
        ? { name: '③ 平均', hint: '總進球數 ÷ 總人數', items: [T(`${S} ÷ ${N} ${spEq(S / N)} 球`, SP_YELLOW)], color: SP_YELLOW }
        : { name: '③ 錯誤做法', hint: '除以進球數的種類 6', items: [T(`${S} ÷ 6 ${spEq(S / 6)} 球`, NO_COLOR)], color: NO_COLOR }
    ];
    drawStepRows(ctx, rows, 3, { top: 384, gap: 52, labX: 22, eqX: 160, size: 17, color: C });
    const note = right
      ? `平均 ${spApprox(S / N).s} 球，落在最少和最多的進球數之間，合理`
      : (S / 6 > 9 ? `平均 ${spApprox(S / 6).s} 球比最多的 9 球還多，一定算錯了` : '除以 6 沒有意義：6 是進球數的種類，不是人數');
    textCenter(ctx, note, 270, 536, right ? MUTED : NO_COLOR, f(700, 13.5));

    out.innerHTML = ks === K.length
      ? wbrEq(`${S} \\div ${right ? N : 6} ${spEqTex(right ? S / N : S / 6)}`) + ' 球'
      : `已按 \\(${ks}\\) 個鍵：記憶裡是 \\(${numStr(st.mem)}\\)`;
    const lastKey = ks ? K[ks - 1] : null;
    let msg;
    if (!lastKey) msg = '按「按下一個鍵」，一步一步看計算機怎麼用 M+ 把每一列的乘積存起來。';
    else if (lastKey === 'AC') msg = '先按 AC：螢幕和記憶一起歸零，才不會加到上一次留下的數。';
    else if (lastKey === 'M+') msg = `M+ 把螢幕上的乘積 \\(${numStr(st.disp)}\\) 加進記憶，現在記憶裡是 \\(${numStr(st.mem)}\\)。沒有先乘除後加減的計算機，靠 <b style="color:${C}">M+</b> 就能一列一列累加。`;
    else if (lastKey === 'MR') msg = `MR 叫出記憶裡的總和 \\(${numStr(st.mem)}\\)，也就是全部同學的總進球數。`;
    else if (lastKey === '=') {
      msg = right
        ? `總進球數 \\(${S}\\) ÷ 總人數 \\(${N}\\)，得到<b style="color:${C}">平均每人進 \\(${spApprox(S / N).s}\\) 球</b>。`
        : `除以 \\(6\\) 得到 \\(${spApprox(S / 6).s}\\)，可是 \\(6\\) 是「進球數有幾種」，不是人數，這個數沒有意義。`;
    } else if (lastKey === '×' || lastKey === '÷') msg = `按 ${lastKey}，等著輸入下一個數。`;
    else msg = `輸入 \\(${lastKey}\\)。`;
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  cv.addEventListener('click', e => {
    const p = canvasPos(cv, e);
    const id = spHit(hits, p.x, p.y);
    if (!id) return;
    const i = parseInt(id.slice(1), 10);
    cnt[i] = clamp(cnt[i] + (id[0] === 'p' ? 1 : -1), 0, 9);
    ks = 0;
    draw();
  });
  nextB.addEventListener('click', () => { ks += 1; draw(); });
  allB.addEventListener('click', () => { ks = keys().length; draw(); });
  resetB.addEventListener('click', () => { ks = 0; draw(); });
  bindPickGroup(modeG, 'data-fm-mode', v => { mode = v; ks = 0; draw(); });
  draw();
}

/* ==========================================================================
   重點 9：組中點替身——分組資料用代表值估計平均，和真正的平均比一比
   ========================================================================== */
function initGroupMeanCanvas() {
  const cv = document.getElementById('canvas-gmean');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const setG = document.getElementById('gm-set-group');
  const repG = document.getElementById('gm-rep-group');
  const rawG = document.getElementById('gm-raw-group');
  const out = document.getElementById('gm-formula');
  const fb = document.getElementById('gm-feedback');
  const C = SP_TONE[8];
  // raw 的數值都乘上 scale 存成整數，避免小數誤差
  const SETS = {
    situp: { name: '一分鐘仰臥起坐', unit: '次', b: [20, 30, 40, 50, 60], scale: 1, max: 12, step: 2,
             raw: [[24, 27, 29], [31, 33, 35, 36, 37, 38, 38, 39], [40, 41, 42, 42, 44, 45, 46, 47, 48, 49], [51, 52, 55, 58]] },
    run: { name: '1600 公尺跑走', unit: '分鐘', b: [6, 8, 10, 12, 14], scale: 10, max: 10, step: 2,
           raw: [[68, 72, 75, 79], [81, 84, 86, 88, 90, 91, 93, 95, 98], [102, 105, 109, 110, 114, 117, 119], [123, 126, 131, 134, 138]] },
    weight: { name: '體重', unit: '公斤', b: [35, 40, 45, 50, 55, 60], scale: 1, max: 10, step: 2,
              raw: [[36, 38, 39], [40, 41, 43, 43, 44, 44], [45, 46, 47, 47, 48, 49, 49, 49], [50, 52, 53, 54, 54], [56, 59]] }
  };
  let set = 'situp', rep = 'mid', raw = 'hide';
  const X0 = 70, Y0 = 250, W = 430, H = 160;

  function tri(x, y, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - 7);
    ctx.lineTo(x - 7, y + 6);
    ctx.lineTo(x + 7, y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    const S = SETS[set];
    const G = S.b.length - 1;
    const sc = S.scale;
    const cnt = S.raw.map(r => r.length);
    const N = spSum(cnt);
    const repOf = g => (rep === 'mid' ? (S.b[g] + S.b[g + 1]) * sc / 2 : (rep === 'low' ? S.b[g] * sc : S.b[g + 1] * sc));
    const reps = cnt.map((c, g) => repOf(g));
    const sumS = spSum(reps.map((r, g) => r * cnt[g]));
    const est = sumS / sc / N;
    const trueS = spSum(S.raw.map(r => spSum(r)));
    const tru = trueS / sc / N;
    const bad = rep !== 'mid';
    const repColor = bad ? NO_COLOR : SP_YELLOW;
    const px = v => X0 + (v - S.b[0]) / (S.b[G] - S.b[0]) * W;
    const slot = W / G;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `${S.name}（${S.unit}）：用代表值估計平均`, C);
    const A = spAxes(ctx, { x0: X0, y0: Y0, w: W, h: H, min: 0, max: S.max, step: S.step, unit: '人' });

    cnt.forEach((c, g) => {
      const x = px(S.b[g]), y = A.py(c);
      ctx.save();
      ctx.fillStyle = C;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(x, y, slot, Y0 - y);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(15,23,42,0.95)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, slot, Y0 - y);
      ctx.restore();
      textCenter(ctx, String(c), x + slot / 2, y - 11, INK, f(800, 13));
      const rx = px(reps[g] / sc);
      ctx.save();
      ctx.strokeStyle = repColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rx, y);
      ctx.lineTo(rx, Y0);
      ctx.stroke();
      ctx.restore();
    });
    S.b.forEach(v => textCenter(ctx, numStr(v), px(v), Y0 + 16, MUTED, f(700, 12)));

    tri(px(est), Y0 + 34, repColor);
    textLeft(ctx, `估計的平均 ${spApprox(est).s}`, px(est) + 11, Y0 + 36, repColor, f(800, 12.5));

    if (raw === 'show') {
      const yS = 314;
      ctx.save();
      ctx.strokeStyle = 'rgba(148,163,184,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X0, yS);
      ctx.lineTo(X0 + W, yS);
      ctx.stroke();
      ctx.restore();
      textLeft(ctx, '原始', 20, yS - 4, SP_GREEN, f(700, 12));
      const seen = {};
      S.raw.forEach(r => r.forEach(v => {
        const k = seen[v] || 0;
        seen[v] = k + 1;
        ctx.save();
        ctx.fillStyle = SP_GREEN;
        ctx.beginPath();
        ctx.arc(px(v / sc), yS - 4 - k * 7, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }));
      tri(px(tru), yS + 16, SP_GREEN);
      textLeft(ctx, `真正的平均 ${spApprox(tru).s}`, px(tru) + 11, yS + 18, SP_GREEN, f(800, 12.5));
    }

    const col = bad ? NO_COLOR : INK;
    const rows = [
      { name: '① 每組的代表值', hint: { mid: '用組中點', low: '用下限（錯誤）', high: '用上限（錯誤）' }[rep],
        items: [T(reps.map(r => numStr(r / sc)).join('、'), col)], color: bad ? NO_COLOR : undefined },
      { name: '② 總和', hint: '代表值 × 次數，再相加',
        items: [T(`${reps.map((r, g) => `${numStr(r / sc)}×${cnt[g]}`).join(' + ')} = ${numStr(sumS / sc)}`, col)] },
      { name: '③ 平均', hint: `總和 ÷ 總人數 ${N}`,
        items: [T(`${numStr(sumS / sc)} ÷ ${N} ${spEq(est)}`, repColor)], color: repColor }
    ];
    if (raw === 'show') {
      rows.push({ name: '④ 真正的平均', hint: '用每個人的原始資料',
        items: [T(`${numStr(trueS / sc)} ÷ ${N} ${spEq(tru)}`, SP_GREEN)], color: SP_GREEN });
    }
    drawStepRows(ctx, rows, rows.length, { top: 364, gap: 44, labX: 22, eqX: 170, size: 16, color: C });

    const gapV = Math.abs(est - tru);
    const note = rep === 'mid'
      ? `組中點估計 ${spApprox(est).s}，和真正的平均 ${spApprox(tru).s} 只差 ${spApprox(gapV).s}`
      : `每組都用${rep === 'low' ? '最小' : '最大'}的數代表，平均被拉${rep === 'low' ? '低' : '高'}了約 ${spApprox(gapV, 1).s}`;
    textCenter(ctx, note, 270, 546, bad ? NO_COLOR : MUTED, f(700, 13.5));

    out.innerHTML = wbrEq(`${numStr(sumS / sc)} \\div ${N} ${spEqTex(est)}`) + ` ${S.unit}`;
    let msg;
    if (rep === 'mid') {
      msg = `不知道每個人的原始資料時，就假設每一組的人都在<b style="color:${C}">組中點</b>：\\(${numStr(S.b[0])}\\)～\\(${numStr(S.b[1])}\\) 這組的 \\(${cnt[0]}\\) 人都當成 \\(${numStr(reps[0] / sc)}\\)。估出來的平均和真正的平均很接近。`;
    } else {
      msg = `用${rep === 'low' ? '下限' : '上限'}代表整組，等於假設每個人都是組裡${rep === 'low' ? '最小' : '最大'}的數，平均一定${rep === 'low' ? '偏低' : '偏高'}。<b style="color:${C}">要用組中點</b>。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(setG, 'data-gm-set', v => { set = v; draw(); });
  bindPickGroup(repG, 'data-gm-rep', v => { rep = v; draw(); });
  bindPickGroup(rawG, 'data-gm-raw', v => { raw = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 10：排隊找中間——先排序、奇偶兩種取法；極端值拉得動平均、拉不動中位數
   ========================================================================== */
function spMedian(arr) {
  const s = arr.slice().sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

function initMedianCanvas() {
  const cv = document.getElementById('canvas-median');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sortG = document.getElementById('md-sort-group');
  const nS = document.getElementById('md-n-slider');
  const xS = document.getElementById('md-x-slider');
  const nV = document.getElementById('md-n-val');
  const xV = document.getElementById('md-x-val');
  const xName = document.getElementById('md-x-name');
  const out = document.getElementById('md-formula');
  const fb = document.getElementById('md-feedback');
  const C = SP_TONE[9];
  const POOL = [112, 95, 130, 101, 124, 98, 117, 108, 126, 105];
  const vals = POOL.slice();
  let sorted = 'raw';
  const X0 = 70, Y0 = 270, W = 430, H = 200;

  function draw() {
    const n = parseInt(nS.value, 10);
    const x = parseInt(xS.value, 10);
    vals[n - 1] = x;
    nV.textContent = n;
    xV.textContent = x;
    xName.textContent = `第 ${n} 位`;
    const cur = vals.slice(0, n);
    const order = cur.map((v, i) => i);
    if (sorted === 'sorted') order.sort((a, b) => cur[a] - cur[b] || a - b);
    const sv = cur.slice().sort((a, b) => a - b);
    const sum = spSum(cur);
    const mean = sum / n;
    const med = spMedian(cur);
    const odd = n % 2 === 1;
    const midPos = odd ? [(n - 1) / 2] : [n / 2 - 1, n / 2];
    const isSorted = sorted === 'sorted';

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `${n} 位同學的一分鐘跳繩下數（${isSorted ? '由小到大排好' : '照報名順序'}）`, C);
    const A = spAxes(ctx, { x0: X0, y0: Y0, w: W, h: H, min: 0, max: 270, step: 30, unit: '下' });
    const slot = W / n, bw = slot * 0.6;
    order.forEach((idx, pos) => {
      const v = cur[idx];
      const cx = X0 + slot * (pos + 0.5);
      const y = A.py(v);
      const isMid = midPos.includes(pos);
      const color = isMid ? (isSorted ? SP_YELLOW : NO_COLOR) : C;
      ctx.save();
      ctx.fillStyle = color;
      ctx.globalAlpha = isMid ? 0.8 : 0.35;
      ctx.fillRect(cx - bw / 2, y, bw, Y0 - y);
      ctx.restore();
      textCenter(ctx, String(v), cx, y - 11, isMid ? color : INK, f(800, 12.5));
      const labCol = isMid ? color : (idx === n - 1 ? SP_CREAM : MUTED);
      textCenter(ctx, `第${pos + 1}`, cx, Y0 + 16, labCol, f(700, 11.5));
    });
    dashLine(ctx, X0, A.py(mean), X0 + W, A.py(mean), SP_BLUE);
    // 平均線的圖例放在圖的右上方，才不會壓到長條上的數字
    dashLine(ctx, X0 + W - 120, 50, X0 + W - 96, 50, SP_BLUE);
    textLeft(ctx, `平均 ${spApprox(mean, 1).s}`, X0 + W - 90, 50, SP_BLUE, f(800, 12.5));

    const rawMid = odd ? `${cur[midPos[0]]}` : `${cur[midPos[0]]} 和 ${cur[midPos[1]]}`;
    if (isSorted) {
      drawChip(ctx, 20, 300, 500, 30, '排好順序了：正中間的就是中位數', OK_COLOR, 'rgba(15,23,42,0.55)');
    } else {
      drawChip(ctx, 20, 300, 500, 30, `還沒排序：正中間的 ${rawMid} 不是中位數`, NO_COLOR, 'rgba(15,23,42,0.55)');
    }

    const rows = [
      { name: '① 由小到大排', hint: `共 ${n} 個`, items: [T(sv.join(', '), INK)] },
      { name: '② 中間的位置', hint: odd ? `${n} 是奇數` : `${n} 是偶數`,
        items: [T(odd ? `第 (${n} + 1) ÷ 2 = ${(n + 1) / 2} 個` : `第 ${n / 2} 個與第 ${n / 2 + 1} 個`, INK)] },
      { name: '③ 平均數', hint: '全部加起來 ÷ 個數', items: [T(`${sum} ÷ ${n} ${spEq(mean)} 下`, SP_BLUE)] },
      { name: '④ 中位數', hint: odd ? '排在正中間的那一個' : '中間兩個數的平均',
        items: [T(odd ? `${med} 下` : `(${sv[n / 2 - 1]} + ${sv[n / 2]}) ÷ 2 ${spEq(med)} 下`, SP_YELLOW)], color: SP_YELLOW }
    ];
    drawStepRows(ctx, rows, 4, { top: 364, gap: 46, labX: 22, eqX: 170, size: 16, color: C });

    const base = POOL.slice(0, n);
    const bMean = spSum(base) / n, bMed = spMedian(base);
    const note = x !== POOL[n - 1]
      ? `第 ${n} 位從 ${POOL[n - 1]} 改成 ${x}：平均數 ${spApprox(bMean, 1).s} → ${spApprox(mean, 1).s}，中位數 ${spApprox(bMed, 1).s} → ${spApprox(med, 1).s}`
      : `拉動「第 ${n} 位」的下數，改成特別大或特別小，看兩個數怎麼變`;
    textCenter(ctx, note, 270, 546, MUTED, f(700, 13));

    out.innerHTML = (odd ? `中位數 \\(= ${med}\\)` : '中位數 ' + wbrEq(`(${sv[n / 2 - 1]} + ${sv[n / 2]}) \\div 2 ${spEqTex(med)}`))
      + '，平均數 ' + wbrEq(`${sum} \\div ${n} ${spEqTex(mean)}`);
    let msg;
    if (!isSorted) {
      msg = `中位數是<b style="color:${C}">排好順序之後</b>正中間的數。沒排序就直接取中間，只是剛好站在中間的那個人，按「由小到大排」看看。`;
    } else {
      msg = odd
        ? `\\(${n}\\) 個數是奇數個，正中間只有一個：第 \\(${(n + 1) / 2}\\) 個。`
        : `\\(${n}\\) 個數是偶數個，正中間有兩個，取它們的平均。`;
      if (Math.abs(mean - med) >= 10) {
        msg += `平均數被特別${mean > med ? '大' : '小'}的數拉走了，中位數只看排在中間的位置，<b style="color:${C}">不受極端值影響</b>。`;
      } else {
        msg += '現在平均數和中位數很接近；把某一位的下數拉到很大，看看誰會被拉走。';
      }
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  nS.addEventListener('input', () => {
    xS.value = vals[parseInt(nS.value, 10) - 1];
    draw();
  });
  xS.addEventListener('input', draw);
  bindPickGroup(sortG, 'data-md-sort', v => { sorted = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 11：累加量尺——從次數表累加，找出中位數的位置（值或組別）
   ========================================================================== */
function initCumCanvas() {
  const cv = document.getElementById('canvas-cum');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const modeG = document.getElementById('cu-mode-group');
  const out = document.getElementById('cu-formula');
  const fb = document.getElementById('cu-feedback');
  const C = SP_TONE[10];
  const MODES = {
    value: { title: '投 10 球的進球數：中位數是幾球？', head: '進球數', unit: '球',
             labels: ['4 球', '5 球', '6 球', '7 球', '8 球', '9 球'], vals: [4, 5, 6, 7, 8, 9], cnt: [2, 5, 6, 4, 6, 3] },
    group: { title: '立定跳遠：中位數在哪一組？', head: '跳遠（公分）', unit: '公分',
             labels: ['150～160', '160～170', '170～180', '180～190', '190～200', '200～210'], cnt: [3, 6, 9, 7, 4, 2] }
  };
  let mode = 'value';
  const hits = [];

  function draw() {
    const M = MODES[mode];
    const cnt = M.cnt;
    const N = spSum(cnt);
    const cum = [];
    cnt.reduce((a, c, i) => (cum[i] = a + c), 0);
    const isVal = mode === 'value';

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, M.title, C);
    hits.length = 0;
    textCenter(ctx, M.head, 64, 58, MUTED, f(800, 13));
    textCenter(ctx, '人數', 158, 58, MUTED, f(800, 13));
    textCenter(ctx, '累加', 242, 58, MUTED, f(800, 13));
    cnt.forEach((c, i) => {
      const y = 92 + i * 38;
      textCenter(ctx, M.labels[i], 64, y, SP_GROUP[i], f(800, isVal ? 15 : 13));
      spBtn(ctx, hits, 112, y, '−', `m${i}`, MUTED);
      textCenter(ctx, String(c), 158, y, SP_YELLOW, f(800, 17));
      spBtn(ctx, hits, 180, y, '+', `p${i}`, C);
      textCenter(ctx, String(cum[i]), 242, y, INK, f(800, 16));
    });
    textCenter(ctx, '合計', 64, 322, INK, f(800, 15));
    textCenter(ctx, String(N), 158, 322, SP_CREAM, f(800, 17));
    drawPanel(ctx, 290, 44, 234, 292, C, 0.06);

    if (N === 0) {
      textCenter(ctx, '總人數是 0', 407, 150, NO_COLOR, f(800, 16));
      textCenter(ctx, '按「+」加入同學', 407, 180, MUTED, f(700, 13));
      out.innerHTML = '總人數是 \\(0\\)，沒有中位數';
      fb.innerHTML = wrapFeedback('每一列都是 0 人，沒有資料可以排隊，也就沒有中位數。');
      typeset([out, fb]);
      return;
    }

    const odd = N % 2 === 1;
    const ks = odd ? [(N + 1) / 2] : [N / 2, N / 2 + 1];
    const rIdx = ks.map(k => cum.findIndex(c => c >= k));
    const same = rIdx.every(r => r === rIdx[0]);

    textLeft(ctx, `共 ${N} 人`, 304, 72, C, f(800, 17));
    textLeft(ctx, `${N} 是${odd ? '奇' : '偶'}數`, 304, 100, INK, f(700, 13.5));
    textLeft(ctx, odd ? `看第 (${N} + 1) ÷ 2 = ${ks[0]} 個` : `看第 ${ks[0]} 個和第 ${ks[1]} 個`, 304, 124, INK, f(700, 13.5));
    ks.forEach((k, j) => {
      const r = rIdx[j];
      textLeft(ctx, isVal ? `第 ${k} 個是 ${M.vals[r]} 球` : `第 ${k} 個在 ${M.labels[r]}`, 304, 160 + j * 26, SP_GROUP[r], f(800, 13.5));
    });
    let answer, med = null;
    if (isVal) {
      const v1 = M.vals[rIdx[0]], v2 = M.vals[rIdx[rIdx.length - 1]];
      med = (v1 + v2) / 2;
      textLeft(ctx, '中位數', 304, 236, SP_YELLOW, f(800, 15));
      answer = (odd || v1 === v2) ? `中位數 = ${v1} 球` : `中位數 = (${v1} + ${v2}) ÷ 2 = ${spApprox(med).s} 球`;
      textLeft(ctx, (odd || v1 === v2) ? `= ${v1} 球` : `(${v1} + ${v2}) ÷ 2 = ${spApprox(med).s} 球`, 304, 264, SP_YELLOW, f(800, 15));
    } else if (same) {
      answer = `中位數在 ${M.labels[rIdx[0]]} 公分`;
      textLeft(ctx, '中位數在', 304, 236, SP_YELLOW, f(800, 15));
      textLeft(ctx, `${M.labels[rIdx[0]]} 公分這一組`, 304, 264, SP_YELLOW, f(800, 15));
    } else {
      answer = '兩個位置在不同組';
      textLeft(ctx, '兩個位置在不同組', 304, 236, NO_COLOR, f(800, 15));
      textLeft(ctx, '調一下人數再看', 304, 264, MUTED, f(700, 13));
    }
    textLeft(ctx, '累加數第一次 ≥ 位置的那一列', 304, 306, MUTED, f(700, 12));

    // 全部同學排成一條
    const L = 30, WS = 480, cw = WS / N;
    cnt.forEach((c, i) => {
      if (!c) return;
      ctx.save();
      ctx.fillStyle = SP_GROUP[i];
      ctx.globalAlpha = 0.55;
      ctx.fillRect(L + (cum[i] - c) * cw, 358, c * cw, 24);
      ctx.restore();
    });
    if (cw >= 6) {
      ctx.save();
      ctx.strokeStyle = 'rgba(15,23,42,0.7)';
      ctx.lineWidth = 1;
      for (let k = 1; k < N; k++) {
        ctx.beginPath();
        ctx.moveTo(L + k * cw, 358);
        ctx.lineTo(L + k * cw, 382);
        ctx.stroke();
      }
      ctx.restore();
    }
    ks.forEach(k => {
      ctx.save();
      ctx.strokeStyle = SP_YELLOW;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(L + (k - 1) * cw, 356, cw, 28);
      ctx.restore();
    });
    const mx = L + (ks[0] - 1 + ks.length / 2) * cw;
    textCenter(ctx, `第 ${ks.join('、')} 個`, clamp(mx, 60, 480), 342, SP_YELLOW, f(800, 13));
    let lastX = -99;
    cum.forEach((c, i) => {
      if (!cnt[i]) return;
      const x = L + c * cw;
      if (x - lastX < 22) return;
      textCenter(ctx, String(c), x, 396, MUTED, f(700, 11.5));
      lastX = x;
    });

    const rows = [
      { name: '① 逐列累加', hint: '由小到大一列一列加', items: [T(cum.join(' → '), INK)] },
      { name: '② 找位置', hint: `第 ${ks.join('、')} 個落在哪一列`,
        items: [T(ks.map((k, j) => `${rIdx[j] > 0 ? cum[rIdx[j] - 1] : 0} < ${k} ≤ ${cum[rIdx[j]]}`).join('，'), INK)] },
      { name: '③ 答案', hint: isVal ? '位置上的數' : '位置所在的組', items: [T(answer, same || isVal ? SP_YELLOW : NO_COLOR)],
        color: same || isVal ? SP_YELLOW : NO_COLOR }
    ];
    drawStepRows(ctx, rows, 3, { top: 438, gap: 46, labX: 22, eqX: 150, size: 16, color: C });

    let msg;
    if (isVal) {
      const v1 = M.vals[rIdx[0]], v2 = M.vals[rIdx[rIdx.length - 1]];
      out.innerHTML = (odd || v1 === v2) ? `中位數 \\(= ${v1}\\) 球` : '中位數 ' + wbrEq(`(${v1} + ${v2}) \\div 2 = ${numStr(med)}`) + ' 球';
      msg = (!odd && v1 !== v2)
        ? `第 \\(${ks[0]}\\) 個是 \\(${v1}\\) 球、第 \\(${ks[1]}\\) 個是 \\(${v2}\\) 球，剛好跨在兩列的交界，<b style="color:${C}">中位數是兩者的平均 \\(${numStr(med)}\\)</b>，不是任何一個人的進球數。`
        : `不必把 \\(${N}\\) 個數一個一個寫出來：人數一列一列累加，<b style="color:${C}">累加數第一次大於或等於位置的那一列</b>，就是中位數。`;
    } else if (same) {
      out.innerHTML = `第 \\(${ks.join('、')}\\) 個在 ${M.labels[rIdx[0]]} 公分`;
      msg = `分組資料不知道每個人的確切距離，只能說中位數<b style="color:${C}">在哪一組</b>：第 \\(${ks.join('、')}\\) 個都落在 ${M.labels[rIdx[0]]} 公分這一組。`;
    } else {
      out.innerHTML = '兩個位置在不同組';
      msg = `總人數是偶數，第 \\(${ks[0]}\\) 個與第 \\(${ks[1]}\\) 個剛好分在兩組，說不出中位數在哪一組。調一下人數，讓它們落在同一組。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  cv.addEventListener('click', e => {
    const p = canvasPos(cv, e);
    const id = spHit(hits, p.x, p.y);
    if (!id) return;
    const i = parseInt(id.slice(1), 10);
    const cnt = MODES[mode].cnt;
    cnt[i] = clamp(cnt[i] + (id[0] === 'p' ? 1 : -1), 0, 12);
    draw();
  });
  bindPickGroup(modeG, 'data-cu-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 12：三個代表值比較台——眾數、中位數、平均數；類別資料只有眾數
   ========================================================================== */
function initModeCanvas() {
  const cv = document.getElementById('canvas-mode');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const setG = document.getElementById('mo-set-group');
  const toolG = document.getElementById('mo-tool-group');
  const out = document.getElementById('mo-formula');
  const fb = document.getElementById('mo-feedback');
  const C = SP_TONE[11];
  const PRESET = {
    sym: [0, 0, 1, 2, 3, 5, 3, 2, 1, 0, 0],
    extreme: [3, 0, 0, 0, 0, 0, 0, 2, 5, 4, 1],
    two: [0, 0, 1, 4, 2, 1, 2, 4, 1, 0, 0]
  };
  const CATS = ['紅', '藍', '黃', '綠'];
  const CAT_COL = [SP_RED, SP_BLUE, SP_YELLOW, SP_GREEN];
  let set = 'sym', tool = 'add';
  let cnt = PRESET.sym.slice();
  const votes = [7, 11, 4, 6];
  const X0 = 50, Y0 = 290, W = 460, MAXDOT = 8;
  const slot = W / 11;

  function marker(xv, y, color, text, diamond) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    if (diamond) {
      ctx.moveTo(xv, y - 7);
      ctx.lineTo(xv + 7, y);
      ctx.lineTo(xv, y + 7);
      ctx.lineTo(xv - 7, y);
    } else {
      ctx.moveTo(xv, y - 7);
      ctx.lineTo(xv - 7, y + 6);
      ctx.lineTo(xv + 7, y + 6);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (xv > 380) spTextRight(ctx, text, xv - 12, y, color, f(800, 12.5));
    else textLeft(ctx, text, xv + 12, y, color, f(800, 12.5));
  }

  function drawNumeric() {
    const n = spSum(cnt);
    const px = v => X0 + (v + 0.5) * slot;
    drawTitle(ctx, '投 10 球的進球數（一個點代表一位同學）', C);
    const maxc = Math.max(...cnt);
    const modes = n ? cnt.map((c, v) => (c === maxc ? v : -1)).filter(v => v >= 0) : [];
    modes.forEach(v => {
      ctx.save();
      ctx.fillStyle = 'rgba(248,113,113,0.13)';
      ctx.fillRect(px(v) - slot / 2 + 2, Y0 - 190, slot - 4, 190);
      ctx.restore();
      textCenter(ctx, '眾數', px(v), Y0 - 200, SP_RED, f(800, 12));
    });
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X0, Y0);
    ctx.lineTo(X0 + W, Y0);
    ctx.stroke();
    ctx.restore();
    for (let v = 0; v <= 10; v++) textCenter(ctx, String(v), px(v), Y0 + 16, MUTED, f(700, 12.5));
    cnt.forEach((c, v) => {
      for (let k = 0; k < c; k++) drawDot(ctx, px(v), Y0 - 12 - k * 21, C, 8);
    });

    if (n === 0) {
      textCenter(ctx, '還沒有任何資料：選「加一點」再點欄位', 270, 400, NO_COLOR, f(800, 15));
      out.innerHTML = '沒有資料';
      fb.innerHTML = wrapFeedback('一個點都沒有，三個代表值都算不出來。');
      typeset([out, fb]);
      return;
    }

    const sum = spSum(cnt.map((c, v) => c * v));
    const mean = sum / n;
    const list = [];
    cnt.forEach((c, v) => { for (let k = 0; k < c; k++) list.push(v); });
    const med = spMedian(list);
    const odd = n % 2 === 1;
    const mxPx = v => X0 + (v + 0.5) * slot;
    marker(mxPx(mean), Y0 + 38, SP_BLUE, `平均數 ${spApprox(mean, 1).s}`, false);
    marker(mxPx(med), Y0 + 64, SP_YELLOW, `中位數 ${spApprox(med, 1).s}`, true);

    const rows = [
      { name: '① 平均數', hint: '總和 ÷ 人數', items: [T(`${sum} ÷ ${n} ${spEq(mean)} 球`, SP_BLUE)] },
      { name: '② 中位數', hint: odd ? `第 ${(n + 1) / 2} 個` : `第 ${n / 2}、${n / 2 + 1} 個的平均`,
        items: [T(odd ? `${med} 球` : `(${list[n / 2 - 1]} + ${list[n / 2]}) ÷ 2 ${spEq(med)} 球`, SP_YELLOW)] },
      { name: '③ 眾數', hint: '出現次數最多的值',
        items: [T(`${modes.join(' 和 ')} 球（${modes.length > 1 ? '各 ' : ''}${maxc} 人）`, SP_RED)], color: SP_RED }
    ];
    drawStepRows(ctx, rows, 3, { top: 404, gap: 44, labX: 22, eqX: 150, size: 16, color: C });

    let note;
    if (modes.length > 1) note = '出現次數最多的值不只一個時，它們都是眾數';
    else if (Math.abs(mean - med) >= 1) note = `有特別${mean < med ? '小' : '大'}的數，把平均數拉走了；中位數和眾數沒有被影響`;
    else note = '三個代表值很接近：資料沒有極端值';
    textCenter(ctx, note, 270, 526, MUTED, f(700, 13.5));

    out.innerHTML = `眾數 \\(${modes.join('、')}\\)，中位數 \\(${numStr(med)}\\)，平均數 ` + wbrEq(`${sum} \\div ${n} ${spEqTex(mean)}`);
    let msg = `眾數是<b style="color:${C}">出現次數最多</b>的值，數一數哪一欄的點最高就知道。`;
    if (modes.length > 1) msg += `現在 \\(${modes.join('\\)、\\(')}\\) 一樣多，<b style="color:${C}">都是眾數</b>。`;
    else if (Math.abs(mean - med) >= 1) msg += `平均數 \\(${spApprox(mean, 2).s}\\) 被極端值拉走了，中位數 \\(${numStr(med)}\\) 與眾數 \\(${modes[0]}\\) 比較能代表大部分的人。`;
    else msg += '這組資料左右大致對稱，三個代表值落在差不多的地方。';
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  function drawColor() {
    drawTitle(ctx, '班服顏色投票（點一下長條增減票數）', C);
    const A = spAxes(ctx, { x0: 80, y0: Y0, w: 400, h: 200, min: 0, max: 14, step: 2, unit: '票' });
    const n = spSum(votes);
    const maxv = Math.max(...votes);
    const modes = n ? votes.map((c, i) => (c === maxv ? i : -1)).filter(i => i >= 0) : [];
    votes.forEach((c, i) => {
      const cx = 80 + 100 * (i + 0.5);
      const y = A.py(c);
      const on = modes.includes(i);
      ctx.save();
      ctx.fillStyle = CAT_COL[i];
      ctx.globalAlpha = on ? 0.85 : 0.45;
      ctx.fillRect(cx - 28, y, 56, Y0 - y);
      if (on) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(cx - 28, y, 56, Y0 - y);
      }
      ctx.restore();
      textCenter(ctx, String(c), cx, y - 12, on ? '#ffffff' : INK, f(800, 13));
      if (on) textCenter(ctx, '眾數', cx, y - 32, SP_RED, f(800, 12.5));
      textCenter(ctx, `${CATS[i]}色`, cx, Y0 + 18, CAT_COL[i], f(800, 13.5));
    });

    const modeText = modes.length ? `${modes.map(i => `${CATS[i]}色`).join(' 和 ')}（${maxv} 票）` : '還沒有人投票';
    const rows = [
      { name: '① 平均數', hint: '顏色不是數值', items: [T('無法計算', NO_COLOR)] },
      { name: '② 中位數', hint: '顏色沒有大小順序', items: [T('無法計算', NO_COLOR)] },
      { name: '③ 眾數', hint: '票數最多的顏色', items: [T(modeText, SP_RED)], color: SP_RED }
    ];
    drawStepRows(ctx, rows, 3, { top: 404, gap: 44, labX: 22, eqX: 150, size: 16, color: C });
    textCenter(ctx, '類別資料只能用眾數描述', 270, 526, MUTED, f(700, 13.5));

    out.innerHTML = `眾數：${modeText}；平均數、中位數無法計算`;
    fb.innerHTML = wrapFeedback(`顏色不能相加，也不能排大小，所以算不出平均數和中位數，只能用<b style="color:${C}">眾數</b>描述：`
      + (modes.length ? `最多人選的是${modes.map(i => `${CATS[i]}色`).join('和')}。` : '現在還沒有人投票。'));
    typeset([out, fb]);
  }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (set === 'color') drawColor();
    else drawNumeric();
  }

  cv.addEventListener('click', e => {
    const p = canvasPos(cv, e);
    const d = tool === 'add' ? 1 : -1;
    if (set === 'color') {
      if (p.x < 80 || p.x >= 480 || p.y < 60 || p.y > Y0 + 10) return;
      const i = Math.floor((p.x - 80) / 100);
      votes[i] = clamp(votes[i] + d, 0, 14);
    } else {
      if (p.x < X0 || p.x >= X0 + W || p.y < 60 || p.y > Y0 + 10) return;
      const v = Math.floor((p.x - X0) / slot);
      cnt[v] = clamp(cnt[v] + d, 0, MAXDOT);
    }
    draw();
  });
  bindPickGroup(setG, 'data-mo-set', v => {
    set = v;
    if (v !== 'color') cnt = PRESET[v].slice();
    draw();
  });
  bindPickGroup(toolG, 'data-mo-tool', v => { tool = v; draw(); });
  draw();
}
