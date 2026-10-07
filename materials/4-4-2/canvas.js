/* ==========================================================================
   4-4-2（第四冊 4-2）平行四邊形 — 互動 Canvas 與隨堂評量
   畫風：復古琺瑯道路標誌風・道路標線工班（小線、阿平），第 4 章三節共用。

   共用工具在 ../math-canvas.js：f／fi／drawTitle／textCenter／textLeft／
   drawExpr／wrapFeedback／typeset／bindPickGroup／drawWithFonts，以及 hb*
   （數學方向角、角記號、頂點外推）與 cg*（圓規、直尺、逐步播放引擎）。

   本檔分三層：
     0. 本節色票（RD_ 前綴；共用檔沒有這個前綴）；
     1. 本節工具（pq 前綴：Parallelogram Quadrilateral）；
     2. 10 個互動與評量附圖。

   長度與角度一律由頂點座標實算（開發約束 27）：畫布上印出的每一個角度、
   每一段長、每一塊面積都是從頂點座標量出來的，不是直接照抄滑桿的值。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();
  drawWithFonts(initQuizFigs);

  initAngleCanvas();
  initTileCanvas();
  initFlipCanvas();
  initDiagCanvas();
  initAreaCanvas();
  initJudgeCanvas();
  initFindCanvas();
  initChopCanvas();
  initTrapCanvas();
  initBuildCanvas();
});

/* ==========================================================================
   0. 色票：瀝青深灰底、標線黃、標線白、琺瑯藍、警示紅
   琺瑯藍與警示紅在深色畫布上太暗，線條與文字改用淺一階的 _LT
   ========================================================================== */

const RD_YELLOW = '#f4c430';
const RD_WHITE = '#f1f1ec';
const RD_BLUE = '#2f6bb3';
const RD_RED = '#d64933';
const RD_BLUE_LT = '#7fb2ec';
const RD_RED_LT = '#f08a74';
const RD_OK = '#86efac';
const RD_NO = '#fb7185';
const RD_WOOD = '#c08a4a';
const RD_WOOD_DK = '#6b4a24';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const RD_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264'];

// 尺規播放引擎的配色（共用檔的 cgUsePalette）
cgUsePalette({
  ink: RD_WHITE, honey: RD_YELLOW, brass: '#d4a017', brassDk: '#5b4208',
  tools: { compass: RD_YELLOW, ruler: RD_BLUE_LT, look: RD_OK, warn: RD_RED_LT }
});

/* ==========================================================================
   1. 本節工具（pq 前綴）
   數學座標（y 朝上）的點用 { x, y }；pqMap 把它換成畫布座標
   ========================================================================== */

function pqMap(ox, oy, U) {
  return (P) => hbV(ox + P.x * U, oy - P.y * U);
}

function pqP(x, y) { return { x, y }; }
function pqAdd(P, Q) { return pqP(P.x + Q.x, P.y + Q.y); }
function pqSub(P, Q) { return pqP(P.x - Q.x, P.y - Q.y); }
function pqMul(P, k) { return pqP(P.x * k, P.y * k); }
function pqDir(deg) { return pqP(Math.cos(deg * HB_RAD), Math.sin(deg * HB_RAD)); }
function pqLen(P, Q) { return Math.hypot(P.x - Q.x, P.y - Q.y); }
function pqMid(P, Q) { return pqP((P.x + Q.x) / 2, (P.y + Q.y) / 2); }

// 兩線段 PQ、RS 是否平行（方向向量的外積為 0）
function pqPar(P, Q, R, S) {
  const u = pqSub(Q, P), v = pqSub(S, R);
  const c = u.x * v.y - u.y * v.x;
  return Math.abs(c) < 1e-7 * (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y) + 1e-12);
}

function pqEq(a, b) { return Math.abs(a - b) < 1e-6; }

// 鞋帶公式（數學座標的面積，取正值）
function pqArea(pts) {
  let s = 0;
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    s += p.x * q.y - q.x * p.y;
  });
  return Math.abs(s) / 2;
}

// 凸多邊形被直線切開：保留 n·X ≤ c 的那一半（Sutherland–Hodgman）
function pqClip(poly, n, c) {
  const out = [];
  const val = p => n.x * p.x + n.y * p.y - c;
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % poly.length];
    const vp = val(p), vq = val(q);
    if (vp <= 0) out.push(p);
    if ((vp < 0 && vq > 0) || (vp > 0 && vq < 0)) {
      const t = vp / (vp - vq);
      out.push(pqP(p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t));
    }
  });
  return out;
}

// 兩條直線 P + t·u、Q + s·v 的交點與參數（數學座標）
function pqCross(P, u, Q, v) {
  const det = u.x * (-v.y) - u.y * (-v.x);
  if (Math.abs(det) < 1e-12) return null;
  const t = ((Q.x - P.x) * (-v.y) - (Q.y - P.y) * (-v.x)) / det;
  const s = (u.x * (Q.y - P.y) - u.y * (Q.x - P.x)) / det;
  return { X: pqP(P.x + u.x * t, P.y + u.y * t), t, s };
}

// 四邊形 A、B、C、D 依序是不是凸的（四個轉向同號）
function pqConvex(pts) {
  let sgn = 0;
  for (let i = 0; i < 4; i++) {
    const a = pts[i], b = pts[(i + 1) % 4], c = pts[(i + 2) % 4];
    const cr = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cr) < 1e-9) return false;
    const s = cr > 0 ? 1 : -1;
    if (sgn && s !== sgn) return false;
    sgn = s;
  }
  return true;
}

// 數學座標的內角（度）
function pqAng(V, P, Q) {
  const a = Math.atan2(P.y - V.y, P.x - V.x), b = Math.atan2(Q.y - V.y, Q.x - V.x);
  let d = Math.abs(a - b) / HB_RAD;
  if (d > 180) d = 360 - d;
  return d;
}

// 兩位小數（整數不留小數點）
function pqD2(v) {
  const r = Math.round(v * 100) / 100;
  return Number.isInteger(r) ? String(r) : String(r);
}

// 邊長平方 n（正整數）→ 最簡根式 k√r
function pqRoot(n) {
  let k = 1, r = n;
  for (let d = 2; d * d <= r; d++) {
    while (r % (d * d) === 0) { r /= d * d; k *= d; }
  }
  const exact = (r === 1);
  return {
    exact,
    txt: exact ? String(k) : (k > 1 ? `${k}√${r}` : `√${r}`),
    tex: exact ? String(k) : (k > 1 ? `${k}\\sqrt{${r}}` : `\\sqrt{${r}}`)
  };
}

// 邊長標示畫在圖形外側（開發約束 18）：沿邊的法向、遠離 G 推出去
function pqSideLabel(ctx, P, Q, G, text, color, off, font) {
  const m = hbV((P.x + Q.x) / 2, (P.y + Q.y) / 2);
  const d = hbDist(P, Q) || 1;
  let nx = -(Q.y - P.y) / d, ny = (Q.x - P.x) / d;
  if ((m.x - G.x) * nx + (m.y - G.y) * ny < 0) { nx = -nx; ny = -ny; }
  const k = off || 18;
  cgLabel(ctx, m, text, color, nx * k, ny * k, font || f(800, 15));
}

// 等長記號：在線段中點畫 n 條短橫線（t 指定沿線的位置，預設 0.5）
function pqTick(ctx, P, Q, n, color, t) {
  const tt = t == null ? 0.5 : t;
  const m = hbV(P.x + (Q.x - P.x) * tt, P.y + (Q.y - P.y) * tt);
  const d = hbDist(P, Q) || 1;
  const ux = (Q.x - P.x) / d, uy = (Q.y - P.y) / d;
  const nx = -uy, ny = ux;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const s = (i - (n - 1) / 2) * 6;
    const c = hbV(m.x + ux * s, m.y + uy * s);
    ctx.beginPath();
    ctx.moveTo(c.x - nx * 8, c.y - ny * 8);
    ctx.lineTo(c.x + nx * 8, c.y + ny * 8);
    ctx.stroke();
  }
  ctx.restore();
}

// 平行記號：在線段中點畫 n 個朝 P→Q 方向的箭頭（「>」「>>」）
function pqChev(ctx, P, Q, n, color) {
  const d = hbDist(P, Q) || 1;
  const ux = (Q.x - P.x) / d, uy = (Q.y - P.y) / d;
  const nx = -uy, ny = ux;
  const m = hbV((P.x + Q.x) / 2, (P.y + Q.y) / 2);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < n; i++) {
    const s = (i - (n - 1) / 2) * 9;
    const tip = hbV(m.x + ux * (s + 5), m.y + uy * (s + 5));
    ctx.beginPath();
    ctx.moveTo(tip.x - ux * 8 + nx * 7, tip.y - uy * 8 + ny * 7);
    ctx.lineTo(tip.x, tip.y);
    ctx.lineTo(tip.x - ux * 8 - nx * 7, tip.y - uy * 8 - ny * 7);
    ctx.stroke();
  }
  ctx.restore();
}

// 畫布底部的一行字，太長時自動縮字級（最小 12.5px）
function pqLine(ctx, text, y, color, size) {
  const W = ctx.canvas.width;
  let s = size || 16;
  ctx.save();
  ctx.font = f(800, s);
  while (ctx.measureText(text).width > W - 24 && s > 12.5) {
    s -= 0.5;
    ctx.font = f(800, s);
  }
  ctx.restore();
  textCenter(ctx, text, W / 2, y, color, f(800, s));
}

// 淡淡的格點
function pqGrid(ctx, map, x0, x1, y0, y1) {
  ctx.save();
  ctx.fillStyle = 'rgba(241, 241, 236, 0.20)';
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      const P = map(pqP(x, y));
      ctx.beginPath();
      ctx.arc(P.x, P.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// 四個頂點字母（畫在外側）
function pqNames(ctx, pts, names, color, dist) {
  const G = hbCentroid(pts);
  pts.forEach((P, i) => hbVLabel(ctx, P, G, names[i], color || RD_WHITE, dist || 20));
  return G;
}

// 一列滑桿的顯示與隱藏（某個模式用不到的滑桿不要留著當死 UI）
function pqShow(el, on) {
  if (el) el.style.display = on ? '' : 'none';
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第四冊 4-2 的 20 題正解
  // 正解字母分布：A 5 題、B 5 題、C 5 題、D 5 題（開發約束 36）
  const answers = {
    '4-2-1': 'D',    // x + 30 = 3x − 22 → x = 26，∠A = 56°，∠B = 124°
    '4-2-2': 'B',    // ∠B = ∠D → 3∠B = 222° → ∠B = 74°，∠A = 106°
    '4-2-3': 'A',    // ∠D = 180° − (64° + 43°) = 73°
    '4-2-4': 'C',    // ∠ABC = 72° → ∠DBC = 27° → ∠ADB = ∠DBC = 27°
    '4-2-5': 'C',    // 2(3x − 1) = 46 → x = 8 → AB = 15
    '4-2-6': 'D',    // 2a + 3 = 5a − 9 → a = 4 → 周長 2(11 + 10) = 42
    '4-2-7': 'B',    // 2x + 1 = 3x − 4 → x = 5 → AC = 22，AC + BD = 40
    '4-2-8': 'C',    // OA = 8，OB = 15 → BD = 30
    '4-2-9': 'A',    // 76 ÷ 2 + 76 ÷ 4 = 38 + 19 = 57
    '4-2-10': 'B',   // 過對角線交點 O 的直線平分面積
    '4-2-11': 'B',   // 68、112、68、112：兩雙對角分別相等
    '4-2-12': 'C',   // 8、11、8、11：兩雙對邊分別相等
    '4-2-13': 'A',   // D = A + C − B = (0, 4)
    '4-2-14': 'A',   // AE // FC 且 AE = FC → 平行四邊形，面積 30
    '4-2-15': 'A',   // x = 4：OA = OC = 11、OB = OD = 6 → 是，AC + BD = 34
    '4-2-16': 'D',   // OP = OR、OQ = OS：兩對角線互相平分
    '4-2-17': 'C',   // ∠A + ∠B = 180°、∠B + ∠C = 180° → 兩雙對邊平行
    '4-2-18': 'B',   // AD // BC 且 ∠B = ∠C：等腰梯形是反例
    '4-2-19': 'D',   // 取 AC 中點 O、延長 BO 使 OD = OB：兩對角線互相平分
    '4-2-20': 'D'    // 只取 CD = AB 可能畫成等腰梯形
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
   評量題的附圖（只標題目給的條件，不標答案）
   ========================================================================== */

// 把數學座標的點組翻成畫布方向（y 朝下）後縮放到 box 裡
function pqFitMath(pts, box) {
  return hbFit(pts.map(p => hbV(p.x, -p.y)), box);
}

const PQ_QUIZ_FIGS = {
  // 四邊形 ABCE 與 ACDE 都是平行四邊形；∠1 = ∠ABC、∠2 = ∠CED
  q3(ctx, W, H) {
    // E 在原點、EC 沿正 x 軸；∠AEC = 64°；D = C + E − A 使 ∠CED = 43°
    const t1 = 64 * HB_RAD, t2 = 43 * HB_RAD;
    const r = Math.sin(t2) / (Math.sin(t1) * Math.cos(t2) + Math.cos(t1) * Math.sin(t2)) ;
    const E = pqP(0, 0), C = pqP(1, 0), A = pqP(r * Math.cos(t1), r * Math.sin(t1));
    const B = pqAdd(A, pqSub(C, E));
    const D = pqAdd(C, pqSub(E, A));
    const q = pqFitMath([A, B, C, D, E], { x: 50, y: 32, w: W - 100, h: H - 60 });
    const [a, b, c, d, e] = q;
    hbPoly(ctx, [a, b, c, e], RD_YELLOW, 0.08, 2.4);
    hbPoly(ctx, [a, c, d, e], RD_BLUE_LT, 0.08, 2.4);
    hbAngle(ctx, b, a, c, 22, RD_YELLOW, { label: '1', lr: 36, font: f(800, 14) });
    hbAngle(ctx, e, c, d, 26, RD_BLUE_LT, { label: '2', lr: 40, font: f(800, 14) });
    const G = hbCentroid(q);
    ['A', 'B', 'C', 'D', 'E'].forEach((n, i) => hbVLabel(ctx, q[i], G, n, RD_WHITE, 16));
  },
  // 平行四邊形 ABCD 與對角線 BD，標 ∠A = 108°
  q4(ctx, W, H) {
    const B = pqP(0, 0), C = pqP(5, 0), A = pqMul(pqDir(72), 3.2), D = pqAdd(A, C);
    const q = pqFitMath([A, B, C, D], { x: 40, y: 30, w: W - 80, h: H - 60 });
    const [a, b, c, d] = q;
    hbPoly(ctx, q, RD_WHITE, 0.05, 2.4);
    hbSeg(ctx, b, d, RD_YELLOW, 2.2);
    hbAngle(ctx, a, b, d, 22, RD_BLUE_LT, { label: '108°', lr: 44, font: f(800, 13) });
    pqNames(ctx, q, ['A', 'B', 'C', 'D'], RD_WHITE, 16);
  },
  // P 在直線 CD 上（D 在 P 與 C 之間）
  q10(ctx, W, H) {
    const B = pqP(0, 0), C = pqP(5, 0), A = pqMul(pqDir(62), 2.6), D = pqAdd(A, C);
    const P = pqAdd(D, pqMul(pqSub(D, C), 0.9));
    const q = pqFitMath([A, B, C, D, P], { x: 40, y: 20, w: W - 80, h: H - 40 });
    const [a, b, c, d, p] = q;
    hbPoly(ctx, [a, b, c, d], RD_WHITE, 0.05, 2.4);
    hbSeg(ctx, d, p, MUTED, 1.8, [6, 5]);
    hbDot(ctx, p, RD_RED_LT, 5);
    pqNames(ctx, [a, b, c, d], ['A', 'B', 'C', 'D'], RD_WHITE, 16);
    textCenter(ctx, 'P', p.x + 16, p.y, RD_RED_LT, fi(800, 17));
  },
  // E、F 分別是 AD、BC 的中點
  q14(ctx, W, H) {
    const B = pqP(0, 0), C = pqP(6, 0), A = pqMul(pqDir(58), 3), D = pqAdd(A, C);
    const E = pqMid(A, D), F = pqMid(B, C);
    const q = pqFitMath([A, B, C, D, E, F], { x: 40, y: 28, w: W - 80, h: H - 56 });
    const [a, b, c, d, e, fp] = q;
    hbPoly(ctx, [a, b, c, d], RD_WHITE, 0.05, 2.4);
    hbSeg(ctx, a, fp, RD_YELLOW, 2.2);
    hbSeg(ctx, e, c, RD_YELLOW, 2.2);
    pqTick(ctx, a, e, 1, RD_BLUE_LT);
    pqTick(ctx, e, d, 1, RD_BLUE_LT);
    pqTick(ctx, b, fp, 2, RD_BLUE_LT);
    pqTick(ctx, fp, c, 2, RD_BLUE_LT);
    pqNames(ctx, [a, b, c, d], ['A', 'B', 'C', 'D'], RD_WHITE, 16);
    textCenter(ctx, 'E', e.x, e.y - 16, RD_WHITE, fi(800, 16));
    textCenter(ctx, 'F', fp.x, fp.y + 16, RD_WHITE, fi(800, 16));
  },
  // O 為對角線交點，P、Q、R、S 分別為 OA、OB、OC、OD 的中點
  q16(ctx, W, H) {
    const B = pqP(0, 0), C = pqP(6, 0), A = pqMul(pqDir(60), 3.4), D = pqAdd(A, C);
    const O = pqMid(A, C);
    const P = pqMid(O, A), Q = pqMid(O, B), R = pqMid(O, C), S = pqMid(O, D);
    const q = pqFitMath([A, B, C, D, O, P, Q, R, S], { x: 40, y: 24, w: W - 80, h: H - 48 });
    const [a, b, c, d, o, p, qq, r, s] = q;
    hbPoly(ctx, [a, b, c, d], RD_WHITE, 0.05, 2.4);
    hbSeg(ctx, a, c, MUTED, 1.6);
    hbSeg(ctx, b, d, MUTED, 1.6);
    hbPoly(ctx, [p, qq, r, s], RD_YELLOW, 0.12, 2.2);
    pqNames(ctx, [a, b, c, d], ['A', 'B', 'C', 'D'], RD_WHITE, 16);
    const G = hbCentroid([p, qq, r, s]);
    [[p, 'P'], [qq, 'Q'], [r, 'R'], [s, 'S']].forEach(([pt, n]) => {
      const dd = hbDist(pt, G) || 1;
      const off = hbV(pt.x + (pt.x - G.x) / dd * 2, pt.y + (pt.y - G.y) / dd * 2);
      // 標在 P、Q、R、S 的外側但不壓到外框：沿垂直方向錯開
      textCenter(ctx, n, off.x + (n === 'P' || n === 'S' ? 0 : 0), off.y + (pt.y < G.y ? -12 : 13), RD_YELLOW, fi(800, 14));
    });
    hbDot(ctx, o, RD_WHITE, 3);
    textCenter(ctx, 'O', o.x + 12, o.y - 2, RD_WHITE, fi(800, 13));
  }
};

function initQuizFigs() {
  document.querySelectorAll('canvas.quiz-fig[data-fig]').forEach(cv => {
    const fn = PQ_QUIZ_FIGS[cv.getAttribute('data-fig')];
    if (!fn) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    fn(ctx, cv.width, cv.height);
  });
}

/* ==========================================================================
   重點 1：對角相等、鄰角互補（斜停車格）
   B(0, 0)、C(6, 0)、A = AB 長 × 方向 ∠B、D = A + (6, 0)
   ========================================================================== */
function initAngleCanvas() {
  const cv = hbEl('canvas-angle');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sB = hbEl('an-b'), sS = hbEl('an-s'), vB = hbEl('an-vb'), vS = hbEl('an-vs');
  const g = hbEl('an-mode-group');
  const out = hbEl('an-formula'), fb = hbEl('an-feedback');
  const C0 = RD_TONE[0];
  let mode = 'opp';

  function draw() {
    const W = cv.width, H = cv.height;
    const b = hbClampSlider(sB, 35, 145), s = hbClampSlider(sS, 2, 5);
    vB.textContent = b; vS.textContent = s;
    const mA = pqMul(pqDir(b), s), mB = pqP(0, 0), mC = pqP(6, 0), mD = pqAdd(mA, mC);
    const xs = [mA.x, mB.x, mC.x, mD.x];
    const U = 44;
    const map = pqMap(270 - (Math.min(...xs) + Math.max(...xs)) / 2 * U, 318, U);
    const [A, B, C, D] = [mA, mB, mC, mD].map(map);
    const aA = Math.round(hbAngleDeg(A, B, D)), aB = Math.round(hbAngleDeg(B, A, C));
    const aC = Math.round(hbAngleDeg(C, B, D)), aD = Math.round(hbAngleDeg(D, A, C));

    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, mode === 'opp' ? '斜停車格的四個角：看對角' : '斜停車格的四個角：看鄰角', C0);

    if (mode === 'adj') {
      // 平行線 AD、BC 與截線 AB 延長出去
      hbSeg(ctx, hbBeyond(D, A, 60), hbBeyond(A, D, 60), MUTED, 1.6, [6, 5]);
      hbSeg(ctx, hbBeyond(C, B, 60), hbBeyond(B, C, 60), MUTED, 1.6, [6, 5]);
      hbSeg(ctx, hbBeyond(B, A, 46), hbBeyond(A, B, 46), RD_YELLOW, 1.6, [6, 5]);
    }
    hbPoly(ctx, [A, B, C, D], RD_YELLOW, 0.07, 0.01);
    hbSeg(ctx, A, B, RD_WHITE, 3.2);
    hbSeg(ctx, B, C, RD_WHITE, 3.2);
    hbSeg(ctx, C, D, RD_WHITE, 3.2);
    hbSeg(ctx, D, A, RD_WHITE, 3.2);
    pqChev(ctx, A, D, 1, RD_BLUE_LT);
    pqChev(ctx, B, C, 1, RD_BLUE_LT);
    pqChev(ctx, B, A, 2, RD_RED_LT);
    pqChev(ctx, C, D, 2, RD_RED_LT);

    const r = 26, fnt = f(800, 14);
    if (mode === 'opp') {
      hbAngle(ctx, A, B, D, r, RD_YELLOW, { label: `${aA}°`, lr: r + 20, font: fnt });
      hbAngle(ctx, C, B, D, r, RD_YELLOW, { label: `${aC}°`, lr: r + 20, font: fnt });
      hbAngle(ctx, B, A, C, r, RD_BLUE_LT, { label: `${aB}°`, lr: r + 20, font: fnt });
      hbAngle(ctx, D, A, C, r, RD_BLUE_LT, { label: `${aD}°`, lr: r + 20, font: fnt });
    } else {
      hbAngle(ctx, A, B, D, r, RD_YELLOW, { label: `${aA}°`, lr: r + 20, font: fnt });
      hbAngle(ctx, B, A, C, r, RD_BLUE_LT, { label: `${aB}°`, lr: r + 20, font: fnt });
      hbAngle(ctx, C, B, D, r, MUTED, { alpha: 0.08, label: `${aC}°`, lr: r + 20, font: fnt, lc: MUTED });
      hbAngle(ctx, D, A, C, r, MUTED, { alpha: 0.08, label: `${aD}°`, lr: r + 20, font: fnt, lc: MUTED });
    }
    pqNames(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], RD_WHITE, 22);

    if (mode === 'opp') {
      pqLine(ctx, `∠A = ∠C = ${aA}°`, 384, RD_YELLOW, 17);
      pqLine(ctx, `∠B = ∠D = ${aB}°`, 412, RD_BLUE_LT, 17);
      pqLine(ctx, '對角相等：∠A、∠C 都等於 180° − ∠B', 442, INK, 15.5);
    } else {
      pqLine(ctx, 'AD // BC，AB 是截線：∠A、∠B 是同側內角', 384, INK, 15.5);
      pqLine(ctx, `∠A + ∠B = ${aA}° + ${aB}° = ${aA + aB}°`, 412, RD_YELLOW, 17);
      pqLine(ctx, '換一條邊當截線也一樣：任兩個鄰角的和都是 180°', 442, INK, 15.5);
    }

    out.innerHTML = `\\(\\angle A = \\angle C = ${aA}^\\circ\\)，<wbr>\\(\\angle B = \\angle D = ${aB}^\\circ\\)，<wbr>\\(\\angle A + \\angle B = ${aA + aB}^\\circ\\)`;
    if (aB === 90) {
      fb.innerHTML = wrapFeedback('四個角都是 \\(90^\\circ\\)：長方形的兩雙對邊也分別平行，所以<strong>長方形也是平行四邊形</strong>。');
    } else if (mode === 'opp') {
      fb.innerHTML = wrapFeedback(`\\(\\angle A\\) 和 \\(\\angle C\\) 都跟 \\(\\angle B\\) 互補，所以一樣大。<br>斜停車格的<strong>對角相等</strong>：兩個銳角都是 \\(${Math.min(aA, aB)}^\\circ\\)、兩個鈍角都是 \\(${Math.max(aA, aB)}^\\circ\\)。`);
    } else {
      fb.innerHTML = wrapFeedback('\\(\\overline{AD} \\parallel \\overline{BC}\\)，截線 \\(\\overline{AB}\\) 造出的同側內角互補。<br>所以平行四邊形的<strong>鄰角互補</strong>：一個銳角配一個鈍角，加起來剛好 \\(180^\\circ\\)。');
    }
    typeset([out, fb]);
  }

  [sB, sS].forEach(el => el.addEventListener('input', draw));
  bindPickGroup(g, 'data-an-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：複合圖形追角（咖啡館的立體方塊磁磚牆）
   三塊平行四邊形磁磚以 O 為共同頂點：
     磁磚 1 = O、u1、u1 + u2、u2（在 O 的角 = ∠1）
     磁磚 2 = O、u2、u2 + u3、u3（∠2 在 O 的對角）
     磁磚 3 = O、u3、u3 + u1、u1（∠3 在 u1 那個頂點，與 O 相鄰）
   ========================================================================== */
function initTileCanvas() {
  const cv = hbEl('canvas-tile');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sA = hbEl('ti-a'), sB = hbEl('ti-b'), vA = hbEl('ti-va'), vB = hbEl('ti-vb');
  const out = hbEl('ti-formula'), fb = hbEl('ti-feedback');
  const C0 = RD_TONE[1];

  function draw() {
    const W = cv.width, H = cv.height;
    const a = hbClampSlider(sA, 60, 150), b = hbClampSlider(sB, 60, 150);
    vA.textContent = a; vB.textContent = b;
    const ok = a + b > 180;
    const gm = 360 - a - b;
    const u1 = pqMul(pqDir(90), 3.0), u2 = pqMul(pqDir(90 + a), 2.6), u3 = pqMul(pqDir(90 + a + b), 3.2);
    const O = pqP(0, 0);
    const m = [O, u1, pqAdd(u1, u2), u2, pqAdd(u2, u3), u3, pqAdd(u3, u1)];
    const q = pqFitMath(m, { x: 40, y: 50, w: W - 80, h: 300 });
    const [o, p1, p12, p2, p23, p3, p31] = q;

    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '三塊平行四邊形磁磚拼在 O 點', C0);

    hbPoly(ctx, [o, p1, p12, p2], RD_YELLOW, 0.2, 2.6);
    hbPoly(ctx, [o, p2, p23, p3], RD_BLUE_LT, 0.2, 2.6);
    if (ok) hbPoly(ctx, [o, p3, p31, p1], RD_WHITE, 0.1, 2.6);

    // 太扁的磁磚（在 O 的角超過 130°）放不下名字，就不標
    if (a <= 130) textCenter(ctx, '磁磚 1', (o.x + p12.x) / 2, (o.y + p12.y) / 2, RD_YELLOW, f(700, 12.5));
    if (b <= 130) textCenter(ctx, '磁磚 2', (o.x + p23.x) / 2, (o.y + p23.y) / 2, RD_BLUE_LT, f(700, 12.5));
    if (ok && gm >= 50 && gm <= 130) textCenter(ctx, '磁磚 3', (o.x + p31.x) / 2, (o.y + p31.y) / 2, RD_WHITE, f(700, 12.5));

    const fnt = f(800, 15);
    hbAngle(ctx, o, p1, p2, 24, RD_YELLOW, { label: '1', lr: 36, font: fnt });
    hbAngle(ctx, p23, p2, p3, 24, RD_BLUE_LT, { label: '2', lr: 38, font: fnt });
    hbAngle(ctx, o, p2, p3, 18, RD_BLUE_LT, { alpha: 0.12, dash: [4, 3] });
    let a3 = null;
    if (ok) {
      hbAngle(ctx, o, p3, p1, 14, RD_WHITE, { alpha: 0.12, dash: [4, 3] });
      hbAngle(ctx, p1, o, p31, 24, RD_RED_LT, { label: '3', lr: 38, font: fnt });
      a3 = Math.round(hbAngleDeg(p1, o, p31));
    }
    hbDot(ctx, o, RD_WHITE, 4.5);
    cgLabel(ctx, o, 'O', RD_WHITE, 14, 14, fi(800, 16));

    const r3 = a + b - 180;
    if (ok) {
      pqLine(ctx, `① 磁磚 2 對角相等：它在 O 的角 = ∠2 = ${b}°`, 384, RD_BLUE_LT, 15.5);
      pqLine(ctx, `② 周角 360°：磁磚 3 在 O 的角 = 360° − ${a}° − ${b}° = ${gm}°`, 412, INK, 15.5);
      pqLine(ctx, `③ 磁磚 3 鄰角互補：∠3 = 180° − ${gm}° = ${a3}°`, 440, RD_RED_LT, 16);
      pqLine(ctx, '一次只看一塊磁磚，把角一路「搬」過去', 466, MUTED, 14);
      out.innerHTML = `\\(\\angle 3 = 180^\\circ\\)<wbr>\\({} - (360^\\circ - ${a}^\\circ - ${b}^\\circ)\\)<wbr>\\({} = ${a3}^\\circ\\)`;
      fb.innerHTML = wrapFeedback(`\\(\\angle 2\\) 先用<strong>對角相等</strong>搬到 \\(O\\)，三個角湊成周角 \\(360^\\circ\\)，再用<strong>鄰角互補</strong>搬到 \\(\\angle 3\\)。<br>合起來就是 \\(\\angle 3 = \\angle 1 + \\angle 2 - 180^\\circ\\)。`);
    } else {
      pqLine(ctx, `∠1 + ∠2 = ${a + b}°，第三塊磁磚在 O 的角要 ${gm}°`, 392, RD_NO, 16);
      pqLine(ctx, '平行四邊形的角都小於 180°：第三塊拼不進去', 420, RD_NO, 16);
      pqLine(ctx, '把 ∠1 或 ∠2 調大，讓兩個角的和超過 180°', 448, INK, 15);
      out.innerHTML = `\\(\\angle 1 + \\angle 2 = ${a + b}^\\circ\\)，<wbr>第三塊磁磚拼不進去（情境不成立）`;
      fb.innerHTML = wrapFeedback(`三塊磁磚在 \\(O\\) 的角要湊成 \\(360^\\circ\\)，第三塊就得是 \\(${gm}^\\circ\\)——但平行四邊形的每個角都小於 \\(180^\\circ\\)。<br>現在 \\(\\angle 1 = ${a}^\\circ\\)、\\(\\angle 2 = ${b}^\\circ\\)，把其中一個調大就拼得起來。`);
    }
    typeset([out, fb]);
  }

  [sA, sB].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：對角線分出兩個全等三角形，兩雙對邊分別相等
   △ABC 繞 AC 的中點 O 轉 t 度；轉到 180° 時疊在 △CDA 上
   ========================================================================== */
function initFlipCanvas() {
  const cv = hbEl('canvas-flip');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sAB = hbEl('fl-ab'), sBC = hbEl('fl-bc'), sB = hbEl('fl-b'), sT = hbEl('fl-t');
  const vAB = hbEl('fl-vab'), vBC = hbEl('fl-vbc'), vB = hbEl('fl-vb'), vT = hbEl('fl-vt');
  const out = hbEl('fl-formula'), fb = hbEl('fl-feedback');
  const C0 = RD_TONE[2];

  function rot(P, O, deg) {
    const c = Math.cos(deg * HB_RAD), s = Math.sin(deg * HB_RAD);
    const dx = P.x - O.x, dy = P.y - O.y;
    // 畫布座標（y 朝下）上看起來是逆時針
    return hbV(O.x + c * dx + s * dy, O.y - s * dx + c * dy);
  }

  function draw() {
    const W = cv.width, H = cv.height;
    const ab = hbClampSlider(sAB, 2, 5), bc = hbClampSlider(sBC, 3, 7);
    const b = hbClampSlider(sB, 45, 135), t = hbClampSlider(sT, 0, 180);
    vAB.textContent = ab; vBC.textContent = bc; vB.textContent = b; vT.textContent = t;
    const mA = pqMul(pqDir(b), ab), mB = pqP(0, 0), mC = pqP(bc, 0), mD = pqAdd(mA, mC);
    const xs = [mA.x, mB.x, mC.x, mD.x];
    const U = 33;
    const map = pqMap(270 - (Math.min(...xs) + Math.max(...xs)) / 2 * U, 300, U);
    const [A, B, C, D] = [mA, mB, mC, mD].map(map);
    const O = hbV((A.x + C.x) / 2, (A.y + C.y) / 2);
    const A2 = rot(A, O, t), B2 = rot(B, O, t), C2 = rot(C, O, t);

    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '把 △ABC 繞 AC 的中點 O 轉半圈', C0);

    // 原本的平行四邊形與 △CDA
    hbPoly(ctx, [C, D, A], RD_BLUE_LT, 0.12, 0.01);
    hbSeg(ctx, A, B, RD_WHITE, 2, [5, 4]);
    hbSeg(ctx, B, C, RD_WHITE, 2, [5, 4]);
    hbSeg(ctx, C, D, RD_YELLOW, 2.6);
    hbSeg(ctx, D, A, RD_BLUE_LT, 2.6);
    hbSeg(ctx, A, C, MUTED, 2);

    // 內錯角（只在還沒轉的時候畫）
    if (t === 0) {
      const fnt = f(800, 13);
      hbAngle(ctx, A, B, C, 30, RD_YELLOW, { label: '1', lr: 42, font: fnt });
      hbAngle(ctx, C, D, A, 30, RD_YELLOW, { label: '2', lr: 42, font: fnt });
      hbAngle(ctx, C, B, A, 20, RD_BLUE_LT, { label: '3', lr: 31, font: fnt });
      hbAngle(ctx, A, D, C, 20, RD_BLUE_LT, { label: '4', lr: 31, font: fnt });
    }

    // 轉動中的 △ABC
    hbPoly(ctx, [A2, B2, C2], RD_YELLOW, 0.18, 0.01);
    hbSeg(ctx, A2, B2, RD_YELLOW, 3.4);
    hbSeg(ctx, B2, C2, RD_BLUE_LT, 3.4);
    hbSeg(ctx, C2, A2, RD_WHITE, 2.2);
    hbDot(ctx, O, RD_WHITE, 4);
    cgLabel(ctx, O, 'O', RD_WHITE, 0, 16, fi(800, 14));
    if (t > 0 && t < 180) {
      textCenter(ctx, "B'", B2.x, B2.y - 16, RD_YELLOW, fi(800, 15));
    }

    pqNames(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], RD_WHITE, 20);

    const lAB = pqLen(mA, mB), lCD = pqLen(mC, mD), lBC = pqLen(mB, mC), lDA = pqLen(mD, mA);
    if (t === 180) {
      pqLine(ctx, '轉半圈：B 落在 D，AB 疊在 CD 上、BC 疊在 DA 上', 448, RD_OK, 15.5);
    } else if (t === 0) {
      pqLine(ctx, '∠1 = ∠2、∠3 = ∠4（內錯角），AC 共用 → △ABC ≅ △CDA', 448, INK, 15);
    } else {
      pqLine(ctx, `已經轉了 ${t}°，再轉 ${180 - t}° 就疊上 △CDA`, 448, INK, 15.5);
    }
    pqLine(ctx, `AB = CD = ${pqD2(lAB)}，BC = DA = ${pqD2(lBC)}`, 476, RD_YELLOW, 16.5);
    pqLine(ctx, `周長 = 2 × (${pqD2(lAB)} + ${pqD2(lBC)}) = ${pqD2(lAB + lBC + lCD + lDA)}`, 504, RD_BLUE_LT, 16.5);

    out.innerHTML = `\\(\\overline{AB} = \\overline{CD} = ${pqD2(lCD)}\\)，<wbr>\\(\\overline{BC} = \\overline{DA} = ${pqD2(lDA)}\\)，<wbr>周長 \\(= 2(${ab} + ${bc})\\)<wbr>\\({} = ${2 * (ab + bc)}\\)`;
    fb.innerHTML = wrapFeedback(t === 180
      ? '對角線 \\(\\overline{AC}\\) 把平行四邊形分成兩個<strong>全等三角形</strong>，對應邊一樣長：<br>\\(\\overline{AB} = \\overline{CD}\\)、\\(\\overline{BC} = \\overline{DA}\\)，也就是<strong>兩雙對邊分別相等</strong>。'
      : '把旋轉角度拉到 \\(180^\\circ\\)，看 \\(\\triangle ABC\\) 會不會剛好蓋住藍色的 \\(\\triangle CDA\\)。');
    typeset([out, fb]);
  }

  [sAB, sBC, sB, sT].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：兩對角線互相平分（不一定等長）
   O 為原點：A = p·方向(180° − φ/2)、B = q·方向(180° + φ/2)、C = −A、D = −B
   ========================================================================== */
function initDiagCanvas() {
  const cv = hbEl('canvas-diag');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sP = hbEl('dg-p'), sQ = hbEl('dg-q'), sF = hbEl('dg-phi');
  const vP = hbEl('dg-vp'), vQ = hbEl('dg-vq'), vF = hbEl('dg-vphi');
  const out = hbEl('dg-formula'), fb = hbEl('dg-feedback');
  const C0 = RD_TONE[3];

  function draw() {
    const W = cv.width, H = cv.height;
    const p = hbClampSlider(sP, 1, 6), q = hbClampSlider(sQ, 1, 6), phi = hbClampSlider(sF, 30, 150);
    vP.textContent = p; vQ.textContent = q; vF.textContent = phi;
    const mA = pqMul(pqDir(180 - phi / 2), p), mB = pqMul(pqDir(180 + phi / 2), q);
    const mC = pqMul(mA, -1), mD = pqMul(mB, -1), mO = pqP(0, 0);
    const map = pqMap(270, 212, 28);
    const [A, B, C, D, O] = [mA, mB, mC, mD, mO].map(map);

    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '兩條對角線在 O 點交叉', C0);
    hbPoly(ctx, [A, B, C, D], RD_WHITE, 0.06, 2.8);
    hbSeg(ctx, A, C, RD_YELLOW, 3);
    hbSeg(ctx, B, D, RD_BLUE_LT, 3);
    pqTick(ctx, O, A, 1, RD_YELLOW);
    pqTick(ctx, O, C, 1, RD_YELLOW);
    pqTick(ctx, O, B, 2, RD_BLUE_LT);
    pqTick(ctx, O, D, 2, RD_BLUE_LT);
    const ang = Math.round(hbAngleDeg(O, A, B));
    if (ang === 90) {
      hbAngle(ctx, O, A, B, 16, RD_RED_LT, { right: true, alpha: 0.25 });
    } else {
      hbAngle(ctx, O, A, B, 20, RD_RED_LT, { label: `${ang}°`, lr: 36, font: f(800, 13) });
    }
    hbDot(ctx, O, RD_WHITE, 4);
    cgLabel(ctx, O, 'O', RD_WHITE, 16, 0, fi(800, 15));
    pqNames(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], RD_WHITE, 20);

    const lOA = pqLen(mO, mA), lOC = pqLen(mO, mC), lOB = pqLen(mO, mB), lOD = pqLen(mO, mD);
    const lAC = pqLen(mA, mC), lBD = pqLen(mB, mD);
    pqLine(ctx, `OA = OC = ${pqD2(lOA)}，OB = OD = ${pqD2(lOB)}：互相平分`, 400, INK, 16);
    pqLine(ctx, `AC = ${pqD2(lAC)}，BD = ${pqD2(lBD)}${pqEq(lAC, lBD) ? '：一樣長（這時是長方形）' : '：不一樣長'}`, 428, pqEq(lAC, lBD) ? RD_OK : RD_YELLOW, 16);
    let tex = `\\(\\overline{OA} = \\overline{OC} = ${pqD2(lOC)}\\)，<wbr>\\(\\overline{OB} = \\overline{OD} = ${pqD2(lOD)}\\)，<wbr>\\(\\overline{AC} + \\overline{BD} = 2(${p} + ${q})\\)<wbr>\\({} = ${2 * (p + q)}\\)`;
    if (ang === 90) {
      const rt = pqRoot(p * p + q * q);
      pqLine(ctx, `AC ⊥ BD：BC² = OB² + OC² = ${q * q} + ${p * p} = ${p * p + q * q}，BC = ${rt.txt}`, 456, RD_RED_LT, 15.5);
      tex += `，<wbr>\\(\\overline{BC} = \\sqrt{${q}^2 + ${p}^2}\\)<wbr>\\({} = ${rt.tex}\\)`;
    } else {
      pqLine(ctx, '把夾角調成 90°，看看能不能用畢氏定理算邊長', 456, MUTED, 14.5);
    }
    out.innerHTML = tex;
    fb.innerHTML = wrapFeedback(pqEq(lAC, lBD)
      ? '兩條對角線一樣長只是特例（長方形）。一般的平行四邊形，對角線<strong>互相平分</strong>，但<strong>不一定等長</strong>。'
      : `\\(O\\) 是兩條對角線共同的中點：\\(\\overline{OA} = \\overline{OC}\\)、\\(\\overline{OB} = \\overline{OD}\\)。<br>但 \\(\\overline{AC} \\ne \\overline{BD}\\)——平行四邊形的對角線<strong>不一定等長</strong>。`);
    typeset([out, fb]);
  }

  [sP, sQ, sF].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：兩對角線把面積四等分；過 O 的直線把面積平分
   格點平行四邊形 B(0, 0)、C(b, 0)、A(k, h)、D(k + b, h)
   ========================================================================== */
function initAreaCanvas() {
  const cv = hbEl('canvas-area');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sb = hbEl('ar-b'), sh = hbEl('ar-h'), sk = hbEl('ar-k'), sa = hbEl('ar-ang'), so = hbEl('ar-off');
  const vb = hbEl('ar-vb'), vh = hbEl('ar-vh'), vk = hbEl('ar-vk'), va = hbEl('ar-vang'), vo = hbEl('ar-voff');
  const cutRows = hbEl('ar-cut-rows');
  const g = hbEl('ar-mode-group');
  const out = hbEl('ar-formula'), fb = hbEl('ar-feedback');
  const C0 = RD_TONE[4];
  let mode = 'four';

  function fracItem(n, d, color) {
    const r = reduce(n, d);
    return r[1] === 1 ? T(String(r[0]), color) : FR(String(r[0]), String(r[1]), color);
  }
  function fracTex(n, d) {
    const r = reduce(n, d);
    return texFrac(r[0], r[1]);
  }

  function draw() {
    const W = cv.width, H = cv.height;
    const b = hbClampSlider(sb, 2, 8), h = hbClampSlider(sh, 2, 6), k = hbClampSlider(sk, -3, 3);
    const ang = hbClampSlider(sa, 0, 170), off2 = hbClampSlider(so, 0, 4);
    const off = off2 / 2;
    vb.textContent = b; vh.textContent = h; vk.textContent = k; va.textContent = ang; vo.textContent = String(off);
    pqShow(cutRows, mode === 'cut');
    const mB = pqP(0, 0), mC = pqP(b, 0), mA = pqP(k, h), mD = pqP(k + b, h);
    const mO = pqMid(mA, mC);
    const U = 38;
    const x0 = Math.min(0, k), x1 = Math.max(b, k + b);
    const map = pqMap(270 - (x0 + x1) / 2 * U, 200 + h / 2 * U, U);
    const [A, B, C, D, O] = [mA, mB, mC, mD, mO].map(map);
    const S = b * h;

    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, mode === 'four' ? '兩條對角線把停車格切成四塊' : '過 O 畫一條直線，切成兩塊', C0);
    pqGrid(ctx, map, x0 - 1, x1 + 1, -1, h + 1);

    let tex;
    if (mode === 'four') {
      const tris = [[A, O, B], [B, O, C], [C, O, D], [D, O, A]];
      const mtris = [[mA, mO, mB], [mB, mO, mC], [mC, mO, mD], [mD, mO, mA]];
      const cols = [RD_YELLOW, RD_BLUE_LT, RD_RED_LT, RD_WHITE];
      tris.forEach((tr, i) => hbPoly(ctx, tr, cols[i], 0.22, 0.01));
      hbPoly(ctx, [A, B, C, D], RD_WHITE, 0, 2.8);
      hbSeg(ctx, A, C, INK, 2);
      hbSeg(ctx, B, D, INK, 2);
      const areas = mtris.map(pqArea);
      tris.forEach((tr, i) => {
        const G = hbCentroid(tr);
        drawExpr(ctx, [fracItem(Math.round(areas[i] * 4), 4, cols[i])], G.x, G.y, 15, cols[i]);
      });
      hbDot(ctx, O, RD_WHITE, 4);
      cgLabel(ctx, O, 'O', RD_WHITE, 14, -10, fi(800, 14));
      pqNames(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], RD_WHITE, 20);
      pqLine(ctx, `停車格面積 = 底 × 高 = ${b} × ${h} = ${S}`, 392, INK, 16);
      drawExpr(ctx, [T('四塊的面積都 =', RD_YELLOW), fracItem(S, 1, RD_YELLOW), T('的四分之一 =', RD_YELLOW), fracItem(S, 4, RD_YELLOW)], W / 2, 428, 16, RD_YELLOW, { gap: 6 });
      pqLine(ctx, '全等＋等底同高：四個三角形一樣大', 462, MUTED, 14.5);
      tex = `\\(\\triangle AOB\\)、\\(\\triangle BOC\\)、\\(\\triangle COD\\)、\\(\\triangle DOA\\) 的面積都是 \\(${fracTex(S, 4)}\\)`;
      fb.innerHTML = wrapFeedback('\\(\\triangle AOB\\) 和 \\(\\triangle COB\\) 的底 \\(\\overline{OA} = \\overline{OC}\\)、高相同（都從 \\(B\\) 畫到 \\(\\overline{AC}\\)），所以面積相等；再加上兩組全等三角形，<strong>四塊一樣大</strong>。');
    } else {
      const n = pqP(-Math.sin(ang * HB_RAD), Math.cos(ang * HB_RAD));
      const M = pqAdd(mO, pqMul(n, off));
      const c = n.x * M.x + n.y * M.y;
      const poly = [mA, mB, mC, mD];
      const P1 = pqClip(poly, n, c);
      const P2 = pqClip(poly, pqMul(n, -1), -c);
      const a1 = P1.length >= 3 ? pqArea(P1) : 0, a2 = P2.length >= 3 ? pqArea(P2) : 0;
      if (P1.length >= 3) hbPoly(ctx, P1.map(map), RD_YELLOW, 0.25, 0.01);
      if (P2.length >= 3) hbPoly(ctx, P2.map(map), RD_BLUE_LT, 0.25, 0.01);
      hbPoly(ctx, [A, B, C, D], RD_WHITE, 0, 2.8);
      const dvec = pqDir(ang);
      const L1 = map(pqAdd(M, pqMul(dvec, -14))), L2 = map(pqAdd(M, pqMul(dvec, 14)));
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 44, W, 330);
      ctx.clip();
      hbSeg(ctx, L1, L2, RD_RED_LT, 2.6);
      ctx.restore();
      hbDot(ctx, O, RD_WHITE, 4);
      cgLabel(ctx, O, 'O', RD_WHITE, 14, -12, fi(800, 14));
      pqNames(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], RD_WHITE, 20);
      const miss = (a1 < 1e-9 || a2 < 1e-9);
      const same = pqEq(a1, a2);
      pqLine(ctx, `停車格面積 = ${b} × ${h} = ${S}`, 392, INK, 16);
      if (miss) {
        pqLine(ctx, '直線沒有穿過停車格，切不出兩塊', 424, RD_NO, 16);
        tex = `直線沒有穿過停車格`;
      } else {
        const ap = x => (Math.abs(x * 100 - Math.round(x * 100)) < 1e-6 ? '=' : '≈');
        pqLine(ctx, `黃色 ${ap(a1)} ${pqD2(a1)}，藍色 ${ap(a2)} ${pqD2(a2)}${same ? '：一樣大' : '：不一樣大'}`, 424, same ? RD_OK : RD_YELLOW, 16);
        tex = `黃色 \\(${ap(a1) === '=' ? '=' : '\\approx'} ${pqD2(a1)}\\)，<wbr>藍色 \\(${ap(a2) === '=' ? '=' : '\\approx'} ${pqD2(a2)}\\)`;
      }
      pqLine(ctx, off === 0 ? '直線通過 O：轉到哪個方向都平分面積' : `直線離開 O ${off} 格：兩塊就不一樣大了`, 458, off === 0 ? RD_OK : RD_RED_LT, 15);
      fb.innerHTML = wrapFeedback(off === 0
        ? '平行四邊形繞 \\(O\\) 轉半圈會疊回自己，所以<strong>過 \\(O\\) 的直線</strong>切下的兩塊也會互相疊合——面積一定相等。'
        : '直線沒有通過對角線交點 \\(O\\)，兩塊轉半圈後疊不回彼此，面積通常不相等。把「離開 \\(O\\)」調回 \\(0\\) 試試。');
    }
    out.innerHTML = tex;
    typeset([out, fb]);
  }

  [sb, sh, sk, sa, so].forEach(el => el.addEventListener('input', draw));
  bindPickGroup(g, 'data-ar-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：判別①② 兩雙對角／兩雙對邊分別相等（依頂點順序看「對」的那一個）
   ========================================================================== */
function initJudgeCanvas() {
  const cv = hbEl('canvas-judge');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const g = hbEl('jd-mode-group');
  const angRows = hbEl('jd-ang-rows'), sideRows = hbEl('jd-side-rows');
  const sA = hbEl('jd-a'), sB = hbEl('jd-bb'), sC = hbEl('jd-c');
  const vA = hbEl('jd-va'), vB = hbEl('jd-vbb'), vC = hbEl('jd-vc');
  const sAB = hbEl('jd-ab'), sBC = hbEl('jd-bc'), sCD = hbEl('jd-cd'), sDA = hbEl('jd-da'), sAng = hbEl('jd-ang');
  const vAB = hbEl('jd-vab'), vBC = hbEl('jd-vbc'), vCD = hbEl('jd-vcd'), vDA = hbEl('jd-vda'), vAng = hbEl('jd-vang');
  const out = hbEl('jd-formula'), fb = hbEl('jd-feedback');
  const C0 = RD_TONE[5];
  let mode = 'ang';

  // 依角度作四邊形：B(0, 0)、C(6, 0)、A = 3.6·方向(∠B)，
  // 由 A 沿「AB 方向轉 ∠A」與由 C 沿「180° − ∠C」兩射線交出 D
  // 四個角都在 0°～180° 之間、和為 360° 時一定圍得起來，只是四邊的長要配合。
  // 沿 A→B→C→D→A 走一圈，四條邊的方向由內角決定（每到一個頂點左轉 180° − 內角）：
  //   AB：∠B − 180°、BC：0°、CD：180° − ∠C、DA：360° − ∠C − ∠D
  // BC 固定 6，AB 從 0.3 掃到 30，由「走一圈回到原點」解出 CD、DA，
  // 四邊都是正的才算數，挑四邊最均勻（最短 ÷ 最長最大）的那一個
  function buildAng(a, b, c) {
    const d = 360 - a - b - c;
    if (d <= 0 || d >= 180) return null;
    const u1 = pqDir(b - 180), u2 = pqDir(0), u3 = pqDir(180 - c), u4 = pqDir(360 - c - d);
    const L2 = 6;
    const det = u3.x * u4.y - u3.y * u4.x;
    if (Math.abs(det) < 1e-12) return null;
    let best = null, bestQ = -1;
    for (let L1 = 0.3; L1 <= 30; L1 += 0.1) {
      const rx = -(L1 * u1.x + L2 * u2.x), ry = -(L1 * u1.y + L2 * u2.y);
      const L3 = (rx * u4.y - ry * u4.x) / det;
      const L4 = (u3.x * ry - u3.y * rx) / det;
      if (L3 <= 0 || L4 <= 0) continue;
      const q = Math.min(L1, L2, L3, L4) / Math.max(L1, L2, L3, L4);
      if (q > bestQ) { bestQ = q; best = [L1, L3]; }
    }
    if (!best) return null;
    const B = pqP(0, 0), C = pqP(L2, 0), A = pqMul(pqDir(b), best[0]);
    const D = pqAdd(C, pqMul(u3, best[1]));
    if (!pqConvex([A, B, C, D])) return null;
    return { A, B, C, D };
  }

  // 依四邊作四邊形：B(0, 0)、C(BC, 0)、A = AB·方向(∠B)，D 取兩圓交點中
  // 與 B 分在 AC 兩側的那一個
  function buildSide(ab, bc, cd, da, ang) {
    const B = pqP(0, 0), C = pqP(bc, 0), A = pqMul(pqDir(ang), ab);
    const d = pqLen(A, C);
    if (d > da + cd - 1e-9 || d < Math.abs(da - cd) + 1e-9) return { fail: 'circle' };
    const x = (da * da - cd * cd + d * d) / (2 * d);
    const hh = Math.sqrt(Math.max(0, da * da - x * x));
    const u = pqMul(pqSub(C, A), 1 / d), nrm = pqP(-u.y, u.x);
    const base = pqAdd(A, pqMul(u, x));
    const cands = [pqAdd(base, pqMul(nrm, hh)), pqAdd(base, pqMul(nrm, -hh))];
    const side = P => (C.x - A.x) * (P.y - A.y) - (C.y - A.y) * (P.x - A.x);
    const sb = side(B);
    const D = cands.find(P => side(P) * sb < 0);
    if (!D) return { fail: 'flat' };
    if (!pqConvex([A, B, C, D])) return { A, B, C, D, concave: true };
    return { A, B, C, D };
  }

  function draw() {
    const W = cv.width, H = cv.height;
    pqShow(angRows, mode === 'ang');
    pqShow(sideRows, mode === 'side');
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, mode === 'ang' ? '調四個角：是不是平行四邊形？' : '排四根標線條：是不是平行四邊形？', C0);

    let Q = null, lines = [], tex = '', verdictOk = false, bad = null;
    if (mode === 'ang') {
      const a = hbClampSlider(sA, 50, 130), b = hbClampSlider(sB, 50, 130), c = hbClampSlider(sC, 50, 130);
      vA.textContent = a; vB.textContent = b; vC.textContent = c;
      const d = 360 - a - b - c;
      Q = buildAng(a, b, c);
      if (!Q) {
        bad = [`∠A + ∠B + ∠C = ${a + b + c}°，∠D 要 ${d}°`, d <= 0 ? '三個角加起來就達到 360°，四邊形圍不起來' : '∠D 不小於 180°，圍不出凸四邊形', d <= 0 ? '把其中一個角調小一點' : '把其中一個角調大一點'];
        tex = `${wbrEq(`\\angle D = 360^\\circ - ${a}^\\circ - ${b}^\\circ - ${c}^\\circ = ${d}^\\circ`)}，<wbr>圍不出凸四邊形（情境不成立）`;
      }
    } else {
      const ab = hbClampSlider(sAB, 2, 7), bc = hbClampSlider(sBC, 2, 7), cd = hbClampSlider(sCD, 2, 7), da = hbClampSlider(sDA, 2, 7);
      const ang = hbClampSlider(sAng, 50, 130);
      vAB.textContent = ab; vBC.textContent = bc; vCD.textContent = cd; vDA.textContent = da; vAng.textContent = ang;
      const r = buildSide(ab, bc, cd, da, ang);
      if (r.fail) {
        bad = [`AB = ${ab}、BC = ${bc}、CD = ${cd}、DA = ${da}，∠B = ${ang}°`, r.fail === 'circle' ? 'CD、DA 兩根接不到一起，圍不成四邊形' : 'CD、DA 只能往內折，圍出凹進去的形狀', '換一個 ∠B，或改改 CD、DA 的長'];
        tex = r.fail === 'circle'
          ? `四根標線條在這個 \\(\\angle B\\) 下接不起來（情境不成立）`
          : `四根標線條在這個 \\(\\angle B\\) 下只能圍出凹四邊形`;
      } else {
        Q = r;
        if (r.concave) Q.concave = true;
      }
    }

    if (bad) {
      bad.forEach((s, i) => pqLine(ctx, s, 200 + i * 34, i === 2 ? INK : RD_NO, 16));
      out.innerHTML = tex;
      fb.innerHTML = wrapFeedback('目前的設定圍不出凸四邊形，先把它調回能圍起來的樣子，再來判斷是不是平行四邊形。');
      typeset([out, fb]);
      return;
    }

    const box = { x: 60, y: 74, w: W - 120, h: 232 };
    const q = pqFitMath([Q.A, Q.B, Q.C, Q.D], box);
    const [A, B, C, D] = q;
    const par1 = pqPar(Q.A, Q.D, Q.B, Q.C), par2 = pqPar(Q.A, Q.B, Q.D, Q.C);
    verdictOk = par1 && par2;
    hbPoly(ctx, q, verdictOk ? RD_YELLOW : RD_WHITE, 0.08, 2.8);
    if (par1) { pqChev(ctx, A, D, 1, RD_BLUE_LT); pqChev(ctx, B, C, 1, RD_BLUE_LT); }
    if (par2) { pqChev(ctx, B, A, 2, RD_RED_LT); pqChev(ctx, C, D, 2, RD_RED_LT); }
    const G = pqNames(ctx, q, ['A', 'B', 'C', 'D'], RD_WHITE, 22);

    const angs = [pqAng(Q.A, Q.B, Q.D), pqAng(Q.B, Q.A, Q.C), pqAng(Q.C, Q.B, Q.D), pqAng(Q.D, Q.A, Q.C)].map(v => Math.round(v * 10) / 10);
    const lens = [pqLen(Q.A, Q.B), pqLen(Q.B, Q.C), pqLen(Q.C, Q.D), pqLen(Q.D, Q.A)];
    if (mode === 'ang') {
      const cols = [RD_YELLOW, RD_BLUE_LT, RD_YELLOW, RD_BLUE_LT];
      [[A, B, D], [B, A, C], [C, B, D], [D, A, C]].forEach((t, i) => {
        hbAngle(ctx, t[0], t[1], t[2], 22, cols[i], { label: `${pqD2(angs[i])}°`, lr: 42, font: f(800, 13.5) });
      });
      const e1 = pqEq(angs[0], angs[2]), e2 = pqEq(angs[1], angs[3]);
      lines = [
        [`∠A 對 ∠C：${pqD2(angs[0])}° 和 ${pqD2(angs[2])}° ${e1 ? '相等' : '不相等'}`, e1 ? RD_OK : RD_NO],
        [`∠B 對 ∠D：${pqD2(angs[1])}° 和 ${pqD2(angs[3])}° ${e2 ? '相等' : '不相等'}`, e2 ? RD_OK : RD_NO]
      ];
      tex = `\\(\\angle A = ${pqD2(angs[0])}^\\circ\\)、<wbr>\\(\\angle B = ${pqD2(angs[1])}^\\circ\\)、<wbr>\\(\\angle C = ${pqD2(angs[2])}^\\circ\\)、<wbr>\\(\\angle D = ${pqD2(angs[3])}^\\circ\\)`;
    } else {
      const segs = [[A, B], [B, C], [C, D], [D, A]];
      const cols = [RD_YELLOW, RD_BLUE_LT, RD_YELLOW, RD_BLUE_LT];
      segs.forEach((s, i) => pqSideLabel(ctx, s[0], s[1], G, pqD2(lens[i]), cols[i], 18));
      const e1 = pqEq(lens[0], lens[2]), e2 = pqEq(lens[1], lens[3]);
      lines = [
        [`AB 對 CD：${pqD2(lens[0])} 和 ${pqD2(lens[2])} ${e1 ? '相等' : '不相等'}`, e1 ? RD_OK : RD_NO],
        [`BC 對 DA：${pqD2(lens[1])} 和 ${pqD2(lens[3])} ${e2 ? '相等' : '不相等'}`, e2 ? RD_OK : RD_NO]
      ];
      tex = `\\(\\overline{AB} = ${pqD2(lens[0])}\\)、<wbr>\\(\\overline{BC} = ${pqD2(lens[1])}\\)、<wbr>\\(\\overline{CD} = ${pqD2(lens[2])}\\)、<wbr>\\(\\overline{DA} = ${pqD2(lens[3])}\\)`;
    }
    lines.forEach((ln, i) => pqLine(ctx, ln[0], 352 + i * 28, ln[1], 16));
    pqLine(ctx, `AD 與 BC ${par1 ? '平行' : '不平行'}，AB 與 DC ${par2 ? '平行' : '不平行'}`, 412, INK, 15.5);
    pqLine(ctx, verdictOk ? '兩雙對邊都平行：是平行四邊形' : (Q.concave ? '凹進去了：不是平行四邊形' : '不是平行四邊形'), 444, verdictOk ? RD_OK : RD_NO, 17);

    out.innerHTML = tex;
    if (verdictOk) {
      fb.innerHTML = wrapFeedback(mode === 'ang'
        ? '<strong>兩雙對角分別相等</strong>，四邊形就是平行四邊形：內角和 \\(360^\\circ\\) 推出 \\(\\angle A + \\angle B = 180^\\circ\\)，同側內角互補 ⇒ 平行。'
        : '<strong>兩雙對邊分別相等</strong>，四邊形就是平行四邊形：連 \\(\\overline{AC}\\) 用 SSS 全等，得到內錯角相等 ⇒ 平行。');
    } else {
      fb.innerHTML = wrapFeedback(mode === 'ang'
        ? '「對角」是隔著一個頂點的那一個：\\(\\angle A\\) 對 \\(\\angle C\\)、\\(\\angle B\\) 對 \\(\\angle D\\)。相鄰的兩個角相等不算數。'
        : '「對邊」是不相鄰的那一條：\\(\\overline{AB}\\) 對 \\(\\overline{CD}\\)、\\(\\overline{BC}\\) 對 \\(\\overline{DA}\\)。鄰邊兩兩相等（像箏形）不算數。');
    }
    typeset([out, fb]);
  }

  [sA, sB, sC, sAB, sBC, sCD, sDA, sAng].forEach(el => el.addEventListener('input', draw));
  bindPickGroup(g, 'data-jd-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：判別③ 一雙對邊平行且相等；已知三點找第四點
   ========================================================================== */
function initFindCanvas() {
  const cv = hbEl('canvas-find');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const g = hbEl('fd-mode-group');
  const lineRows = hbEl('fd-line-rows'), threeRows = hbEl('fd-three-rows');
  const sAB = hbEl('fd-ab'), sC = hbEl('fd-c'), sD = hbEl('fd-d'), sCx = hbEl('fd-cx'), sCy = hbEl('fd-cy');
  const vAB = hbEl('fd-vab'), vC = hbEl('fd-vc'), vD = hbEl('fd-vd'), vCx = hbEl('fd-vcx'), vCy = hbEl('fd-vcy');
  const out = hbEl('fd-formula'), fb = hbEl('fd-feedback');
  const C0 = RD_TONE[6];
  let mode = 'line';

  function drawLineMode() {
    const W = cv.width;
    const ab = hbClampSlider(sAB, 2, 4), c = hbClampSlider(sC, 0, 6), d = hbClampSlider(sD, -4, 10);
    vAB.textContent = ab; vC.textContent = c; vD.textContent = d;
    const map = pqMap(32 + 4 * 34, 300, 34);
    const mA = pqP(0, 0), mB = pqP(ab, 0), mC = pqP(c, 3), mD = pqP(d, 3);
    const [A, B, C, D] = [mA, mB, mC, mD].map(map);
    drawTitle(ctx, '兩條平行的標線上找 D 點', C0);
    pqGrid(ctx, map, -4, 10, -1, 4);
    // 直線 L、M（標線黃）
    hbSeg(ctx, map(pqP(-4.6, 3)), map(pqP(10.6, 3)), RD_YELLOW, 3);
    hbSeg(ctx, map(pqP(-4.6, 0)), map(pqP(10.6, 0)), RD_YELLOW, 3);
    textCenter(ctx, 'L', map(pqP(-4.6, 3)).x + 2, map(pqP(-4.6, 3)).y - 16, RD_YELLOW, fi(800, 17));
    textCenter(ctx, 'M', map(pqP(-4.6, 0)).x + 2, map(pqP(-4.6, 0)).y - 16, RD_YELLOW, fi(800, 17));

    const cdLen = Math.abs(d - c);
    const same = (d === c);
    const isPG = pqEq(cdLen, pqLen(mA, mB));
    let name = '';
    if (!same) {
      // d < c 時 D 在 C 左邊：A、B、C、D 依序；d > c 時：A、B、D、C 依序
      const poly = d < c ? [A, B, C, D] : [A, B, D, C];
      hbPoly(ctx, poly, isPG ? RD_OK : RD_WHITE, isPG ? 0.16 : 0.06, 2.6);
      name = d < c ? 'ABCD' : 'ABDC';
    }
    hbSeg(ctx, A, B, RD_BLUE_LT, 4);
    if (!same) hbSeg(ctx, C, D, RD_RED_LT, 4);
    [[A, 'A'], [B, 'B']].forEach(([P, n]) => { hbDot(ctx, P, RD_WHITE, 5); cgLabel(ctx, P, n, RD_WHITE, 0, 20, fi(800, 17)); });
    hbDot(ctx, C, RD_WHITE, 5);
    cgLabel(ctx, C, 'C', RD_WHITE, 0, -20, fi(800, 17));
    hbDot(ctx, D, RD_RED_LT, 6);
    cgLabel(ctx, D, 'D', RD_RED_LT, same ? 18 : 0, -20, fi(800, 17));

    pqLine(ctx, 'AB 在 M 上、CD 在 L 上，L // M：AB // CD 一定成立', 372, INK, 15.5);
    if (same) {
      pqLine(ctx, 'D 和 C 疊在一起，只剩三個點', 404, RD_NO, 16);
      out.innerHTML = `\\(D\\) 與 \\(C\\) 重合`;
      fb.innerHTML = wrapFeedback('把 \\(D\\) 往左或往右移，讓 \\(\\overline{CD}\\) 跟 \\(\\overline{AB}\\) 一樣長。');
      return;
    }
    pqLine(ctx, `AB = ${ab}，CD = ${cdLen}${isPG ? '：平行且相等' : '：平行但不相等'}`, 404, isPG ? RD_OK : RD_YELLOW, 16.5);
    pqLine(ctx, isPG ? `是平行四邊形 ${name}` : '只是梯形，不是平行四邊形', 436, isPG ? RD_OK : RD_NO, 17);
    out.innerHTML = `\\(\\overline{AB} = ${ab}\\)，<wbr>\\(\\overline{CD} = ${cdLen}\\)，<wbr>\\(\\overline{AB} \\parallel \\overline{CD}\\)`;
    fb.innerHTML = wrapFeedback(isPG
      ? `<strong>一雙對邊平行且相等</strong>：\\(\\overline{AB} \\parallel \\overline{CD}\\) 且 \\(\\overline{AB} = \\overline{CD}\\)，這是平行四邊形 ${name}。<br>\\(D\\) 在 \\(C\\) 的左右兩邊各有一個位置。`
      : '\\(\\overline{AB}\\) 和 \\(\\overline{CD}\\) 平行，但不一樣長，只能圍出梯形。斑馬線就是靠「在兩條平行線上量等長」畫出來的。');
  }

  function drawThreeMode() {
    const W = cv.width;
    const cx = hbClampSlider(sCx, 0, 6), cy = hbClampSlider(sCy, 2, 5);
    vCx.textContent = cx; vCy.textContent = cy;
    const U = 26;
    const map = pqMap(70 + 4 * U, 196, U);
    const mA = pqP(1, 0), mB = pqP(5, 0), mC = pqP(cx, cy);
    const D1 = pqSub(pqAdd(mA, mC), mB), D2 = pqSub(pqAdd(mA, mB), mC), D3 = pqSub(pqAdd(mB, mC), mA);
    drawTitle(ctx, '已知 A、B、C 三點，D 可以在哪裡？', C0);
    pqGrid(ctx, map, -4, 11, -5, 5);
    hbSeg(ctx, map(pqP(-4.5, 0)), map(pqP(11.5, 0)), MUTED, 1.4);
    hbSeg(ctx, map(pqP(0, -5.5)), map(pqP(0, 5.5)), MUTED, 1.4);
    textCenter(ctx, 'x', map(pqP(11.5, 0)).x + 10, map(pqP(11.5, 0)).y, MUTED, fi(700, 14));
    textCenter(ctx, 'y', map(pqP(0, 5.5)).x + 10, map(pqP(0, 5.5)).y, MUTED, fi(700, 14));
    const cols = [RD_YELLOW, RD_BLUE_LT, RD_RED_LT];
    const polys = [[mA, mB, mC, D1], [mA, mC, mB, D2], [mA, mB, D3, mC]];
    polys.forEach((p, i) => hbPoly(ctx, p.map(map), cols[i], 0.07, 1.8));
    const [A, B, C] = [mA, mB, mC].map(map);
    [[A, 'A', 0, 18], [B, 'B', 0, 18], [C, 'C', 0, -18]].forEach(([P, n, dx, dy]) => {
      hbDot(ctx, P, RD_WHITE, 5);
      cgLabel(ctx, P, n, RD_WHITE, dx, dy, fi(800, 16));
    });
    [D1, D2, D3].forEach((Dm, i) => {
      const P = map(Dm);
      hbDot(ctx, P, cols[i], 5.5);
      subLabel(ctx, 'D', String(i + 1), P.x + 16, P.y - 14, cols[i], 16);
    });
    const ptxt = P => `(${P.x}, ${P.y})`;
    const rows = [
      [`D1 = A + C − B = ${ptxt(D1)}：平行四邊形 ABCD`, cols[0]],
      [`D2 = A + B − C = ${ptxt(D2)}：平行四邊形 ACBD`, cols[1]],
      [`D3 = B + C − A = ${ptxt(D3)}：平行四邊形 ABDC`, cols[2]]
    ];
    rows.forEach((r, i) => {
      const y = 372 + i * 30;
      drawExpr(ctx, [SEQ([IT('D', r[1]), SB(String(i + 1), r[1])], r[1], 0), T(r[0].slice(2), r[1])], W / 2, y, 15.5, r[1], { gap: 0 });
    });
    pqLine(ctx, '三點各當一次「對角線的一端」，D 就有三個位置', 460, MUTED, 14);
    out.innerHTML = `\\(D_1(${D1.x}, ${D1.y})\\)、<wbr>\\(D_2(${D2.x}, ${D2.y})\\)、<wbr>\\(D_3(${D3.x}, ${D3.y})\\)`;
    fb.innerHTML = wrapFeedback('從 \\(B\\) 走到 \\(A\\) 的那一段位移，從 \\(C\\) 再走一次就到 \\(D_1\\)：\\(\\overline{CD_1}\\) 與 \\(\\overline{BA}\\) <strong>平行且相等</strong>。另外兩點也一樣。');
  }

  function draw() {
    pqShow(lineRows, mode === 'line');
    pqShow(threeRows, mode === 'three');
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (mode === 'line') drawLineMode(); else drawThreeMode();
    typeset([out, fb]);
  }

  [sAB, sC, sD, sCx, sCy].forEach(el => el.addEventListener('input', draw));
  bindPickGroup(g, 'data-fd-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：判別④ 兩對角線互相平分（筷子中點對齊）
   AC 在 O 被平分；BD 的交叉點可以偏離 BD 的中點 off
   ========================================================================== */
function initChopCanvas() {
  const cv = hbEl('canvas-chop');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const s1 = hbEl('ch-l1'), s2 = hbEl('ch-l2'), sAng = hbEl('ch-ang'), sOff = hbEl('ch-off');
  const v1 = hbEl('ch-vl1'), v2 = hbEl('ch-vl2'), vAng = hbEl('ch-vang'), vOff = hbEl('ch-voff');
  const out = hbEl('ch-formula'), fb = hbEl('ch-feedback');
  const C0 = RD_TONE[7];

  function stick(ctx2, P, Q) {
    hbSeg(ctx2, P, Q, RD_WOOD_DK, 10);
    hbSeg(ctx2, P, Q, RD_WOOD, 6);
  }

  function draw() {
    const W = cv.width, H = cv.height;
    const l1 = hbClampSlider(s1, 6, 10), l2 = hbClampSlider(s2, 4, 10);
    const ang = hbClampSlider(sAng, 30, 150), off2 = hbClampSlider(sOff, -4, 4);
    const off = off2 / 2;
    v1.textContent = l1; v2.textContent = l2; vAng.textContent = ang; vOff.textContent = String(off);
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '兩根筷子交叉，四個端點連起來', C0);

    const half2 = l2 / 2;
    if (Math.abs(off) >= half2) {
      pqLine(ctx, `交叉點離 BD 的中點 ${Math.abs(off)}，已經超出筷子的一半 ${half2}`, 220, RD_NO, 16);
      pqLine(ctx, '兩根筷子根本沒有交叉，圍不出四邊形', 254, RD_NO, 16);
      pqLine(ctx, '把偏移量調小，或把 BD 調長', 288, INK, 15);
      out.innerHTML = `交叉點跑到筷子外面（情境不成立）`;
      fb.innerHTML = wrapFeedback(`\\(\\overline{BD}\\) 只有 \\(${l2}\\) 長，交叉點最多只能偏離中點不到 \\(${half2}\\)。`);
      typeset([out, fb]);
      return;
    }
    const mO = pqP(0, 0);
    const mA = pqMul(pqDir(180 - ang / 2), l1 / 2), mC = pqMul(mA, -1);
    const uB = pqDir(180 + ang / 2);
    const mB = pqMul(uB, half2 + off), mD = pqMul(uB, -(half2 - off));
    const map = pqMap(270, 200, 24);
    const [A, B, C, D, O] = [mA, mB, mC, mD, mO].map(map);

    const par1 = pqPar(mA, mD, mB, mC), par2 = pqPar(mA, mB, mD, mC);
    const ok = par1 && par2;
    hbPoly(ctx, [A, B, C, D], ok ? RD_OK : RD_WHITE, ok ? 0.14 : 0.06, 2.4);
    stick(ctx, A, C);
    stick(ctx, B, D);
    pqTick(ctx, O, A, 1, RD_YELLOW);
    pqTick(ctx, O, C, 1, RD_YELLOW);
    const lOB = pqLen(mO, mB), lOD = pqLen(mO, mD);
    if (pqEq(lOB, lOD)) { pqTick(ctx, O, B, 2, RD_BLUE_LT); pqTick(ctx, O, D, 2, RD_BLUE_LT); }
    // BD 自己的中點
    const midBD = map(pqMid(mB, mD));
    if (!pqEq(lOB, lOD)) {
      hbDot(ctx, midBD, RD_BLUE_LT, 4);
      cgLabel(ctx, midBD, 'BD 的中點', RD_BLUE_LT, 0, 18, f(700, 12));
    }
    hbDot(ctx, O, RD_WHITE, 4.5);
    cgLabel(ctx, O, 'O', RD_WHITE, 14, -12, fi(800, 15));
    pqNames(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], RD_WHITE, 20);

    const lAD = pqLen(mA, mD), lBC = pqLen(mB, mC);
    pqLine(ctx, `OA = OC = ${pqD2(l1 / 2)}，OB = ${pqD2(lOB)}，OD = ${pqD2(lOD)}`, 396, INK, 16);
    pqLine(ctx, `AD = ${pqD2(lAD)}，BC = ${pqD2(lBC)}，AD 與 BC ${par1 ? '平行' : '不平行'}`, 426, par1 ? RD_OK : RD_YELLOW, 15.5);
    pqLine(ctx, ok ? '兩條對角線互相平分：是平行四邊形' : '只有 AC 被平分，BD 沒有：不是平行四邊形', 458, ok ? RD_OK : RD_NO, 16.5);

    out.innerHTML = `\\(\\overline{OA} = \\overline{OC} = ${pqD2(l1 / 2)}\\)，<wbr>\\(\\overline{OB} = ${pqD2(lOB)}\\)，<wbr>\\(\\overline{OD} = ${pqD2(lOD)}\\)`;
    fb.innerHTML = wrapFeedback(ok
      ? '兩根筷子<strong>中點對齊</strong>：\\(\\overline{OA} = \\overline{OC}\\)、\\(\\overline{OB} = \\overline{OD}\\)。不管筷子一不一樣長、夾角多大，四個端點都圍出平行四邊形。'
      : '交叉點只是 \\(\\overline{AC}\\) 的中點、不是 \\(\\overline{BD}\\) 的中點——只有一條被平分還不夠，要<strong>互相平分</strong>。剪刀的支點就是這樣。');
    typeset([out, fb]);
  }

  [s1, s2, sAng, sOff].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：條件不夠的陷阱——找反例
   每一組條件畫兩個四邊形：左邊是符合條件的平行四邊形，右邊是另一個也符合
   條件的四邊形（反例，或條件真的夠時的另一個平行四邊形）
   ========================================================================== */
const PQ_TRAP_SETS = {
  pe: {
    title: '一雙對邊平行，另一雙對邊相等',
    build(s) {
      const a = 0.4 + 0.3 * s;
      return {
        L: [pqP(a, 3), pqP(0, 0), pqP(4.5, 0), pqP(a + 4.5, 3)],
        R: [pqP(a, 3), pqP(0, 0), pqP(6, 0), pqP(6 - a, 3)]
      };
    },
    check(P) {
      const [A, B, C, D] = P;
      return [['AD // BC', pqPar(A, D, B, C)], ['AB = CD', pqEq(pqLen(A, B), pqLen(C, D))]];
    }
  },
  kite: {
    title: '兩雙鄰邊分別相等',
    build(s) {
      const t = 2.4 + 0.5 * s;
      const A = pqMul(pqDir(50 + 5 * s), 3);
      return {
        L: [A, pqP(0, 0), pqP(3, 0), pqAdd(A, pqP(3, 0))],
        R: [pqP(0, 2), pqP(-2, 0), pqP(0, -t), pqP(2, 0)]
      };
    },
    check(P) {
      const [A, B, C, D] = P;
      return [['AB = AD', pqEq(pqLen(A, B), pqLen(A, D))], ['CB = CD', pqEq(pqLen(C, B), pqLen(C, D))]];
    }
  },
  diag: {
    title: '兩條對角線等長',
    build(s) {
      const a = 0.6 + 0.4 * s;
      const h = 2.4 + 0.2 * s;
      return {
        L: [pqP(0, h), pqP(0, 0), pqP(5, 0), pqP(5, h)],
        R: [pqP(a, 3), pqP(0, 0), pqP(6, 0), pqP(6 - a, 3)]
      };
    },
    check(P) {
      const [A, B, C, D] = P;
      return [['AC = BD', pqEq(pqLen(A, C), pqLen(B, D))]];
    }
  },
  half: {
    title: '一條對角線 BD 平分另一條 AC',
    build(s) {
      const d = 1.6 + 0.6 * s;
      const A = pqMul(pqDir(130), 2.6), B = pqMul(pqDir(200), 2);
      return {
        L: [A, B, pqMul(A, -1), pqMul(B, -1)],
        R: [pqP(0, 2.2), pqP(-1, 0), pqP(0, -2.2), pqP(d, 0)]
      };
    },
    check(P) {
      const [A, B, C, D] = P;
      const hit = pqCross(B, pqSub(D, B), A, pqSub(C, A));
      const ok = hit && hit.t > 0 && hit.t < 1 && pqEq(hit.s, 0.5);
      return [['BD 通過 AC 的中點', !!ok]];
    }
  },
  pa: {
    title: '一雙對邊平行，一雙對角相等',
    build(s) {
      const A = pqMul(pqDir(60), 3), A2 = pqMul(pqDir(70 + 10 * s), 2.6);
      return {
        L: [A, pqP(0, 0), pqP(4.5, 0), pqAdd(A, pqP(4.5, 0))],
        R: [A2, pqP(0, 0), pqP(5, 0), pqAdd(A2, pqP(5, 0))]
      };
    },
    check(P) {
      const [A, B, C, D] = P;
      return [['AD // BC', pqPar(A, D, B, C)], ['∠A = ∠C', pqEq(pqAng(A, B, D), pqAng(C, B, D))]];
    }
  }
};

function initTrapCanvas() {
  const cv = hbEl('canvas-trap');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const g = hbEl('tp-mode-group');
  const sS = hbEl('tp-s'), vS = hbEl('tp-vs');
  const out = hbEl('tp-formula'), fb = hbEl('tp-feedback');
  const C0 = RD_TONE[8];
  let mode = 'pe';

  function isPG(P) {
    const [A, B, C, D] = P;
    return pqPar(A, D, B, C) && pqPar(A, B, D, C);
  }

  function panel(P, box, label) {
    const q = pqFitMath(P, box);
    const ok = isPG(P);
    hbPoly(ctx, q, ok ? RD_OK : RD_RED_LT, 0.12, 2.6);
    pqNames(ctx, q, ['A', 'B', 'C', 'D'], RD_WHITE, 18);
    textCenter(ctx, label, box.x + box.w / 2, 58, MUTED, f(700, 13));
    return ok;
  }

  function draw() {
    const W = cv.width, H = cv.height;
    const s = hbClampSlider(sS, 1, 5);
    vS.textContent = s;
    const set = PQ_TRAP_SETS[mode];
    const fig = set.build(s);
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, `條件：${set.title}`, C0);
    const okL = panel(fig.L, { x: 44, y: 100, w: 190, h: 176 }, '符合條件的平行四邊形');
    const okR = panel(fig.R, { x: 306, y: 100, w: 190, h: 176 }, '另一個也符合條件的四邊形');
    const cL = set.check(fig.L), cR = set.check(fig.R);
    const allL = cL.every(c => c[1]), allR = cR.every(c => c[1]);
    const mark = cs => cs.map(c => `${c[0]} ${c[1] ? '✓' : '✗'}`).join('　');
    textCenter(ctx, mark(cL), 139, 312, allL ? RD_OK : RD_NO, f(700, 13.5));
    textCenter(ctx, mark(cR), 401, 312, allR ? RD_OK : RD_NO, f(700, 13.5));
    textCenter(ctx, okL ? '是平行四邊形' : '不是平行四邊形', 139, 340, okL ? RD_OK : RD_NO, f(800, 15.5));
    textCenter(ctx, okR ? '是平行四邊形' : '不是平行四邊形', 401, 340, okR ? RD_OK : RD_NO, f(800, 15.5));

    const enough = okR;
    pqLine(ctx, enough ? '怎麼變形都還是平行四邊形：這組條件夠' : '符合條件卻不是平行四邊形：這組條件不夠', 392, enough ? RD_OK : RD_NO, 17);
    pqLine(ctx, enough ? '∠A + ∠B = 180° 又 ∠A = ∠C ⇒ ∠B + ∠C = 180° ⇒ AB // DC' : '舉出一個反例，就能說明「不一定」', 424, INK, 15);
    pqLine(ctx, '拉動「變形」滑桿，看右邊的四邊形怎麼變', 456, MUTED, 14);

    out.innerHTML = enough
      ? `這組條件<strong>一定</strong>是平行四邊形`
      : `這組條件<strong>不一定</strong>是平行四邊形（右圖是反例）`;
    const story = {
      pe: '右邊是<strong>等腰梯形</strong>：\\(\\overline{AD} \\parallel \\overline{BC}\\)、\\(\\overline{AB} = \\overline{CD}\\)，但 \\(\\overline{AB}\\) 與 \\(\\overline{DC}\\) 不平行。平行和相等要落在<strong>同一雙</strong>對邊上。',
      kite: '右邊是<strong>箏形</strong>：相等的是<strong>鄰邊</strong>，不是對邊。',
      diag: '右邊是<strong>等腰梯形</strong>：兩條對角線一樣長，但沒有互相平分。',
      half: '右邊只有 \\(\\overline{AC}\\) 被 \\(\\overline{BD}\\) 平分，\\(\\overline{BD}\\) 卻沒有被平分——要<strong>互相</strong>平分才行。',
      pa: '\\(\\overline{AD} \\parallel \\overline{BC}\\) 讓 \\(\\angle A + \\angle B = 180^\\circ\\)；再加上 \\(\\angle A = \\angle C\\)，就得到 \\(\\angle B + \\angle C = 180^\\circ\\)，所以 \\(\\overline{AB} \\parallel \\overline{DC}\\)。'
    };
    fb.innerHTML = wrapFeedback(story[mode]);
    typeset([out, fb]);
  }

  sS.addEventListener('input', draw);
  bindPickGroup(g, 'data-tp-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：用尺規作出平行四邊形，說出依據的判別性質
   三種作法：兩雙對邊等長、一雙對邊平行且相等、對角線互相平分
   ========================================================================== */
function initBuildCanvas() {
  const cv = hbEl('canvas-build');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const g = hbEl('bd-mode-group');
  const sAng = hbEl('bd-ang'), vAng = hbEl('bd-vang'), lAng = hbEl('bd-lang');
  const out = hbEl('bd-formula'), fb = hbEl('bd-feedback');
  const C0 = RD_TONE[9];
  const st = { k: 1 };
  let mode = 'sss';
  const PX = 40; // 1 公分畫成 40px
  const cm = v => (Math.round(v / PX * 10) / 10).toFixed(1);

  function setMode(v) { mode = v; st.k = 1; draw(); }

  function draw() {
    const ang = hbClampSlider(sAng, 50, 130);
    vAng.textContent = ang;
    lAng.textContent = mode === 'diag' ? '直線 L 與 AC 的夾角' : '∠ABC';
    const th = cgRad(-ang);
    let steps, pts, given, title, measure = null, prop;

    if (mode !== 'diag') {
      const ba = 150, bc = 220;
      const ux = Math.cos(th), A0x = ux * ba;
      const minx = Math.min(0, A0x), maxx = Math.max(bc, A0x + bc);
      const B = cgP(270 - (minx + maxx) / 2, 330);
      const A = cgPolar(B, ba, th), C = cgP(B.x + bc, B.y);
      const D = cgP(A.x + C.x - B.x, A.y + C.y - B.y);
      if (mode === 'sss') {
        title = '兩雙對邊分別相等：用兩段弧找 D';
        prop = '兩雙對邊分別相等';
        steps = [
          { tool: 'ruler', text: '已知 A、B、C 三點，連接 BA、BC。', ruler: [B, C],
            draw: c => { cgSeg(c, B, A, RD_WHITE, 3); cgSeg(c, B, C, RD_WHITE, 3); } },
          { tool: 'compass', text: '圓規量 BC 的長，以 A 為圓心畫弧。',
            compass: { c: A, r: bc, ang: cgAng(A, D), label: 'BC 的長' },
            draw: c => cgArcAt(c, A, bc, [D], 0.3, RD_YELLOW) },
          { tool: 'compass', text: '圓規量 AB 的長，以 C 為圓心畫弧，兩弧交於 D。',
            compass: { c: C, r: ba, ang: cgAng(C, D), label: 'AB 的長' },
            draw: c => cgArcAt(c, C, ba, [D], 0.45, RD_BLUE_LT) },
          { tool: 'ruler', text: '連接 AD、CD，得到四邊形 ABCD。', ruler: [A, D],
            draw: c => { cgSeg(c, A, D, RD_YELLOW, 3); cgSeg(c, C, D, RD_BLUE_LT, 3); } },
          { tool: 'look', text: 'AD = BC、CD = AB：兩雙對邊分別相等，所以 ABCD 是平行四邊形。',
            draw: c => { hbPoly(c, [A, B, C, D], RD_OK, 0.12, 0.01); } }
        ];
        pts = [{ p: A, n: 'A', s: 0, dx: -14, dy: -14 }, { p: B, n: 'B', s: 0, dx: -14, dy: 14 },
               { p: C, n: 'C', s: 0, dx: 14, dy: 14 }, { p: D, n: 'D', s: 3, c: RD_OK, dx: 14, dy: -14 }];
        if (st.k >= 5) measure = [`量一量：AD = ${cm(cgDist(A, D))}、BC = ${cm(bc)}，CD = ${cm(cgDist(C, D))}、AB = ${cm(ba)}（公分）`, RD_OK];
      } else {
        title = '一雙對邊平行且相等：複製角再量長';
        prop = '一雙對邊平行且相等';
        const r0 = 56;
        const u = cgUnit(B, C);
        const F = cgP(C.x + u.x * 110, C.y);
        const P = cgPolar(B, r0, th), Qp = cgPolar(B, r0, 0);
        const Q2 = cgPolar(C, r0, 0), P2 = cgPolar(C, r0, th);
        const chord = cgDist(P, Qp);
        const E = cgPolar(C, ba * 1.45, th);
        steps = [
          { tool: 'ruler', text: '連接 BA、BC，並把 BC 延長到 C 的右邊。', ruler: [B, F],
            draw: c => { cgSeg(c, B, A, RD_WHITE, 3); cgSeg(c, B, C, RD_WHITE, 3); cgSeg(c, C, F, MUTED, 2, [6, 5]); } },
          { tool: 'compass', text: '以 B 為圓心畫弧，交 BA、BC 於 P、Q。',
            compass: { c: B, r: r0, ang: th / 2, label: '' },
            draw: c => cgArc(c, B, r0, th - 0.2, 0.2, RD_YELLOW) },
          { tool: 'compass', text: '半徑不變，以 C 為圓心畫弧，交延長線於 Q′。',
            compass: { c: C, r: r0, ang: th / 2, label: '' },
            draw: c => cgArc(c, C, r0, th - 0.2, 0.2, RD_YELLOW) },
          { tool: 'compass', text: '圓規量 PQ 的長，以 Q′ 為圓心畫弧，交前一段弧於 P′。',
            compass: { c: Q2, r: chord, ang: cgAng(Q2, P2), label: 'PQ 的長' },
            draw: c => cgArcAt(c, Q2, chord, [P2], 0.35, RD_BLUE_LT) },
          { tool: 'ruler', text: '過 C、P′ 畫射線 CE：∠1 = ∠ABC（同位角相等），所以 CE 平行 BA。', ruler: [C, E],
            draw: c => { cgSeg(c, C, E, RD_BLUE_LT, 2.4); cgAngMark(c, C, 0, th, 26, RD_RED_LT, 2.4); cgAngMark(c, B, 0, th, 26, RD_RED_LT, 2.4); } },
          { tool: 'compass', text: '圓規量 AB 的長，以 C 為圓心畫弧，交 CE 於 D。',
            compass: { c: C, r: ba, ang: th, label: 'AB 的長' },
            draw: c => cgArcAt(c, C, ba, [D], 0.25, RD_YELLOW) },
          { tool: 'ruler', text: '連接 AD，得到四邊形 ABCD。', ruler: [A, D],
            draw: c => { cgSeg(c, A, D, RD_WHITE, 3); cgSeg(c, C, D, RD_YELLOW, 3.4); } },
          { tool: 'look', text: 'CD 平行 BA 且 CD = BA：一雙對邊平行且相等，所以 ABCD 是平行四邊形。',
            draw: c => { hbPoly(c, [A, B, C, D], RD_OK, 0.12, 0.01); } }
        ];
        pts = [{ p: A, n: 'A', s: 0, dx: -14, dy: -14 }, { p: B, n: 'B', s: 0, dx: -14, dy: 14 },
               { p: C, n: 'C', s: 0, dx: 4, dy: 18 },
               { p: P, n: 'P', s: 2, c: RD_YELLOW, dx: -14, dy: -4 }, { p: Qp, n: 'Q', s: 2, c: RD_YELLOW, dx: 0, dy: 16 },
               { p: Q2, n: 'Q′', s: 3, c: RD_YELLOW, dx: 4, dy: 16 }, { p: P2, n: 'P′', s: 4, c: RD_BLUE_LT, dx: 16, dy: -2 },
               { p: E, n: 'E', s: 5, c: RD_BLUE_LT, dx: 14, dy: -6 },
               { p: D, n: 'D', s: 6, c: RD_OK, dx: 14, dy: -14 }];
        if (st.k >= 8) measure = [`量一量：CD = ${cm(cgDist(C, D))}、AB = ${cm(ba)}（公分），CD // BA`, RD_OK];
      }
      given = c => {
        if (st.k < 1) return;
        cgDot(c, A, RD_WHITE); cgDot(c, B, RD_WHITE); cgDot(c, C, RD_WHITE);
      };
    } else {
      title = '兩對角線互相平分：先找中點再對齊';
      prop = '兩對角線互相平分';
      const a = 260, bLen = 200;
      const A = cgP(140, 250), C = cgP(400, 250), O = cgP(270, 250);
      const dirL = cgRad(-ang);
      const D = cgPolar(O, bLen / 2, dirL), B = cgPolar(O, bLen / 2, dirL + Math.PI);
      const rr = a * 0.68;
      const X = cgCC(A, rr, C, rr);
      const Xu = cgUpper(X), Xd = cgLower(X);
      const ga = cgP(40, 64), gb = cgP(40, 96);
      steps = [
        { tool: 'ruler', text: '已知線段 a、b。畫 AC，使 AC 的長等於 a。', ruler: [A, C],
          draw: c => cgSeg(c, A, C, RD_YELLOW, 3) },
        { tool: 'compass', text: '分別以 A、C 為圓心、同一半徑（大於 AC 的一半）畫弧，兩弧交於兩點。',
          compass: { c: C, r: rr, ang: cgAng(C, Xu), label: '' },
          draw: c => { cgArcAt(c, A, rr, [Xu, Xd], 0.15, RD_BLUE_LT); cgArcAt(c, C, rr, [Xu, Xd], 0.15, RD_BLUE_LT); } },
        { tool: 'ruler', text: '連接兩交點，與 AC 交於 O：O 是 AC 的中點。', ruler: [Xu, Xd],
          draw: c => cgSeg(c, Xu, Xd, MUTED, 1.6, [6, 5]) },
        { tool: 'ruler', text: '過 O 畫任意一條直線 L。', ruler: [cgPolar(O, 150, dirL + Math.PI), cgPolar(O, 150, dirL)],
          draw: c => cgSeg(c, cgPolar(O, 160, dirL + Math.PI), cgPolar(O, 160, dirL), RD_BLUE_LT, 2) },
        { tool: 'compass', text: '用同樣方法找出 b 的中點，圓規量 b 的一半，以 O 為圓心畫弧，交 L 於 B、D。',
          compass: { c: O, r: bLen / 2, ang: dirL, label: 'b 的一半' },
          draw: c => { cgArcDir(c, O, bLen / 2, dirL, 0.25, RD_YELLOW); cgArcDir(c, O, bLen / 2, dirL + Math.PI, 0.25, RD_YELLOW); } },
        { tool: 'ruler', text: '依序連接 A、B、C、D。', ruler: [A, B],
          draw: c => { hbPoly(c, [A, B, C, D], RD_WHITE, 0, 3); } },
        { tool: 'look', text: 'OA = OC、OB = OD：兩對角線互相平分，所以 ABCD 是平行四邊形。',
          draw: c => { hbPoly(c, [A, B, C, D], RD_OK, 0.12, 0.01); } }
      ];
      pts = [{ p: A, n: 'A', s: 1, dx: -16, dy: 0 }, { p: C, n: 'C', s: 1, dx: 16, dy: 0 },
             { p: O, n: 'O', s: 3, c: RD_BLUE_LT, dx: 14, dy: 16 },
             { p: B, n: 'B', s: 5, c: RD_OK, dx: -14, dy: 14 }, { p: D, n: 'D', s: 5, c: RD_OK, dx: 14, dy: -14 }];
      given = c => {
        cgSeg(c, ga, cgP(ga.x + a, ga.y), RD_YELLOW, 3);
        cgSeg(c, gb, cgP(gb.x + bLen, gb.y), RD_BLUE_LT, 3);
        textLeft(c, 'a', ga.x + a + 10, ga.y, RD_YELLOW, fi(800, 16));
        textLeft(c, 'b', gb.x + bLen + 10, gb.y, RD_BLUE_LT, fi(800, 16));
      };
      if (st.k >= 7) measure = [`量一量：OA = OC = ${cm(a / 2)}、OB = OD = ${cm(bLen / 2)}（公分）`, RD_OK];
    }

    cgSync('bd', st, steps.length);
    cgRender(ctx, { title, color: C0, k: st.k, steps, given, pts, measure });

    const done = st.k >= steps.length;
    out.innerHTML = done ? `依據：${prop}` : `作圖進行中：第 \\(${st.k}\\) 步，共 \\(${steps.length}\\) 步`;
    fb.innerHTML = wrapFeedback(done
      ? `作完要說得出<strong>根據哪一個判別性質</strong>：這個作法靠的是「${prop}」。`
      : '按「下一步」一步一步看圓規和直尺在做什麼，最後一步會說出依據。');
    typeset([out, fb]);
  }

  cgSteps('bd', st, draw);
  sAng.addEventListener('input', draw);
  bindPickGroup(g, 'data-bd-mode', setMode);
  drawWithFonts(draw);
}
