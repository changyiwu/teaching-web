/* ==========================================================================
   5-1-2（第五冊 1-2）比例線段 — 互動 Canvas 與隨堂評量
   畫風：昭和復古照相館・暗房（小影、阿光），第 1 章四節共用。

   共用工具在 ../math-canvas.js（f／fi／drawTitle／drawExpr／T／FR／qIt／qTex／
   wbrEq／typeset／bindPickGroup…），幾何工具 hb*（頂點外推、邊長標籤、角記號、
   刻痕）與 cg*（交點、標籤、尺規逐步播放引擎）也在那裡。

   本檔分三層：
     0. 本章色票（DK_ 前綴；共用檔沒有這個前綴）；
     1. 本節自己的工具（pr 前綴）；
     2. 11 個互動與評量附圖。

   長度一律用有理數 [分子, 分母]（qOf／qMul…）計算與輸出，不用浮點數判斷相等；
   畫面上的「量一量」才用畫布座標量出來，兩者互相印證（開發約束 27）。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();
  drawWithFonts(initQuizFigs);

  initAreaCanvas();
  initCut1Canvas();
  initCut2Canvas();
  initJudgeCanvas();
  initCounterCanvas();
  initMidCanvas();
  initConvCanvas();
  initThreeCanvas();
  initTrapCanvas();
  initShiftCanvas();
  initBuildCanvas();
});

/* ==========================================================================
   0. 本章色票（暗房：棕褐相紙、安全燈紅、顯影藍、圍裙綠、芥末黃）
   ========================================================================== */

const DK_SEPIA = '#d9b38c';     // 棕褐相紙
const DK_RED = '#e05a47';       // 安全燈紅（填色）
const DK_RED_LT = '#f08a78';    // 安全燈紅的亮版（深底上畫線用）
const DK_BLUE = '#5aa9e6';      // 顯影藍
const DK_GREEN = '#5fbf8f';     // 圍裙綠
const DK_MUSTARD = '#e6b84c';   // 芥末黃
const DK_IVORY = '#f3ead8';     // 相紙白
const DK_OK = '#86efac';
const DK_NO = '#fb7185';
const DK_FAINT = 'rgba(243, 234, 216, 0.3)';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const DK_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9'];

// 尺規播放引擎的配色（共用檔的 cgUsePalette）
cgUsePalette({
  ink: DK_IVORY, honey: DK_MUSTARD, brass: '#e5b53a', brassDk: '#8a6512',
  tools: { compass: DK_MUSTARD, ruler: DK_BLUE, look: DK_OK, warn: DK_RED_LT }
});

/* ==========================================================================
   1. 本節工具（pr 前綴）
   ========================================================================== */

function prLerp(P, Q, t) {
  return hbV(P.x + (Q.x - P.x) * t, P.y + (Q.y - P.y) * t);
}

// 由 AB、AC 與 ∠A 作三角形，轉成 BC 水平、A 在上方，再等比例放進 box
//   skew：AB 那一側分到 ∠A 的比例（0.5 是左右對稱）
function prTriFlat(ab, ac, angA, box, skew) {
  const w = skew == null ? 0.5 : skew;
  const A0 = hbV(0, 0), B0 = hbAt(A0, 270 - angA * w, ab), C0 = hbAt(A0, 270 + angA * (1 - w), ac);
  const th = Math.atan2(C0.y - B0.y, C0.x - B0.x);
  const c = Math.cos(-th), s = Math.sin(-th);
  const rot = P => hbV(P.x * c - P.y * s, P.x * s + P.y * c);
  const p = hbFit([A0, B0, C0].map(rot), box);
  return { A: p[0], B: p[1], C: p[2], k: hbDist(p[0], p[1]) / ab };
}

// 由三邊長作三角形（BC 水平、A 在上方），回傳 null 表示三邊圍不成三角形
function prTriSides(ab, ac, bc, box) {
  if (ab + ac <= bc || ab + bc <= ac || ac + bc <= ab) return null;
  const x = (ab * ab - ac * ac + bc * bc) / (2 * bc);
  const y = Math.sqrt(ab * ab - x * x);
  const p = hbFit([hbV(x, -y), hbV(0, 0), hbV(bc, 0)], box);
  return { A: p[0], B: p[1], C: p[2], k: hbDist(p[1], p[2]) / bc };
}

// 點名：P 在直線 L1L2 上，名字往遠離 G 的法線方向推出去
function prPtLab(ctx, P, L1, L2, G, name, color, off) {
  const d = hbDist(L1, L2) || 1;
  let nx = -(L2.y - L1.y) / d, ny = (L2.x - L1.x) / d;
  if ((P.x - G.x) * nx + (P.y - G.y) * ny < 0) { nx = -nx; ny = -ny; }
  const k = off || 17;
  cgLabel(ctx, P, name, color || DK_IVORY, nx * k, ny * k, fi(800, 17));
}

// 邊長標籤（canvas 元件，分數也畫得出來），位置同 hbSideLabel：線段中點往外推
function prSideIt(ctx, P, Q, G, it, color, off, size) {
  const m = hbV((P.x + Q.x) / 2, (P.y + Q.y) / 2);
  const d = hbDist(P, Q) || 1;
  let nx = -(Q.y - P.y) / d, ny = (Q.x - P.x) / d;
  if ((m.x - G.x) * nx + (m.y - G.y) * ny < 0) { nx = -nx; ny = -ny; }
  const k = off || 18;
  drawExpr(ctx, [it], m.x + nx * k, m.y + ny * k, size || 16, color, { gap: 0 });
}

// 一列置中的 canvas 算式
function prRow(ctx, y, items, size, color) {
  drawExpr(ctx, items, ctx.canvas.width / 2, y, size || 17, color || INK, { gap: 3 });
}

// 化簡後的比 a : b（a、b 為正整數）
function prRatio(a, b) {
  const g = gcd(a, b);
  return `${a / g} : ${b / g}`;
}

// 比 a : b 若可化簡就接一段「= 最簡比」
function prRatioEq(a, b) {
  const g = gcd(a, b);
  return g === 1 ? `${a} : ${b}` : `${a} : ${b} = ${a / g} : ${b / g}`;
}

// 兩個有理數的比化成最簡整數比
function prQRatio(p, q) {
  const r = qDiv(p, q);
  return `${r[0]} : ${r[1]}`;
}

// 量出來的比值
function prDec(v) {
  return (Math.round(v * 100) / 100).toFixed(2);
}

// 兩平行線的記號：兩條線段中點各畫一個同向的箭頭
function prParMark(ctx, P1, Q1, P2, Q2, color) {
  hbArrowHead(ctx, P1, Q1, color);
  hbArrowHead(ctx, P2, Q2, color);
}

// 三角形外框＋三個頂點名（字母在外）
function prTriOutline(ctx, T3, color, names) {
  const { A, B, C } = T3;
  hbPoly(ctx, [A, B, C], color || DK_IVORY, 0.05, 2.6);
  const G = hbCentroid([A, B, C]);
  const nm = names || ['A', 'B', 'C'];
  hbVLabel(ctx, A, G, nm[0], DK_IVORY, 18);
  hbVLabel(ctx, B, G, nm[1], DK_IVORY, 18);
  hbVLabel(ctx, C, G, nm[2], DK_IVORY, 18);
  return G;
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第五冊 1-2 的 22 題正解
  // 正解字母分布：A 6 題、B 5 題、C 6 題、D 5 題（開發約束 36）
  const answers = {
    '5-1-2-1': 'B',    // BD : BC = 4 : 11
    '5-1-2-2': 'A',    // 8 : 9 : 8
    '5-1-2-3': 'C',    // 7 : 3 = 14 : EC → EC = 6
    '5-1-2-4': 'D',    // 10 : 24 = AE : 36 → AE = 15 → EC = 21
    '5-1-2-5': 'A',    // x : (x + 10) = 4 : 9 → x = 8
    '5-1-2-6': 'C',    // AE : AB = 3 : 7 → EG = 9
    '5-1-2-7': 'D',    // 7 : 4 = 14 : 8
    '5-1-2-8': 'B',    // 5 : 7 = 15 : 21 → 平行 → ∠ADE = ∠B = 58°
    '5-1-2-9': 'C',    // 不一定平行
    '5-1-2-10': 'A',   // DE' 與 DE 等長，比相同但不平行
    '5-1-2-11': 'D',   // ½(13 + 15 + 10) = 19
    '5-1-2-12': 'C',   // 6 + 12 + 24 = 42
    '5-1-2-13': 'B',   // AE = 13/2、DE = 19/2
    '5-1-2-14': 'A',   // AB = AC = 10、BC = 14 → 34
    '5-1-2-15': 'D',   // (x + 3) : (2x + 4) = 14 : 24 → x = 4
    '5-1-2-16': 'C',   // 7 : (x + 1) = (x − 1) : 9 → x = 8（−8 不合）
    '5-1-2-17': 'B',   // EF = 6 + 7 × 2/7 = 8
    '5-1-2-18': 'D',   // EG = GF = 15/2 → EF = 15
    '5-1-2-19': 'A',   // BG = 2 → CH = 5 → CF = 12
    '5-1-2-20': 'C',   // BE、CF 在平行線上，不能直接列比例（正確 CF = 5）
    '5-1-2-21': 'B',   // AD : DE = 2 : 7 → AC : CB = 2 : 7
    '5-1-2-22': 'A'    // 過 P6 作 BP11 的平行線
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

const PR_FIG_FONT = () => f(800, 13);
const PR_FIG_IT = () => fi(800, 14);

// D 在 AB、E 在 AC、DE // BC 的三角形附圖
//   lab：{ AD, DB, AE, EC, DE, BC }，有給的才標
function prFigDE(ctx, W, H, t, lab, opts) {
  const o = opts || {};
  const T3 = prTriFlat(10, 11, 50, { x: 60, y: 30, w: W - 120, h: H - 60 }, 0.46);
  const { A, B, C } = T3;
  const G = hbCentroid([A, B, C]);
  hbPoly(ctx, [A, B, C], DK_IVORY, 0.05, 2.2);
  const D = prLerp(A, B, t), E = prLerp(A, C, t);
  hbSeg(ctx, D, E, DK_GREEN, 2.4);
  if (!o.noPar) prParMark(ctx, D, E, B, C, DK_MUSTARD);
  ['A', 'B', 'C'].forEach((s, i) => hbVLabel(ctx, [A, B, C][i], G, s, DK_IVORY, 15));
  prPtLab(ctx, D, A, B, G, 'D', DK_IVORY, 14);
  prPtLab(ctx, E, A, C, G, 'E', DK_IVORY, 14);
  const fnt = PR_FIG_FONT();
  if (lab.AD) hbSideLabel(ctx, A, D, G, lab.AD, DK_SEPIA, 14, fnt);
  if (lab.DB) hbSideLabel(ctx, D, B, G, lab.DB, DK_SEPIA, 14, fnt);
  if (lab.AE) hbSideLabel(ctx, A, E, G, lab.AE, DK_SEPIA, 14, fnt);
  if (lab.EC) hbSideLabel(ctx, E, C, G, lab.EC, DK_SEPIA, 14, fnt);
  if (lab.BC) hbSideLabel(ctx, B, C, G, lab.BC, DK_SEPIA, 14, fnt);
  if (lab.DE) cgLabel(ctx, prLerp(D, E, 0.25), lab.DE, DK_GREEN, 0, -11, fnt);
  return { A, B, C, D, E, G };
}

// 三條水平平行線 L1、L2、L3 與兩條截線
function prFigPar3(ctx, W, H, r, lab) {
  const y1 = 40, y3 = H - 34, y2 = y1 + (y3 - y1) * r;
  [y1, y2, y3].forEach((y, i) => {
    hbSeg(ctx, hbV(22, y), hbV(W - 30, y), DK_IVORY, 2);
    subLabel(ctx, 'L', String(i + 1), W - 16, y, DK_IVORY, 14);
  });
  const m1 = y => 92 + 0.18 * (y - y1);
  const m2 = y => 196 + 0.42 * (y - y1);
  const A = hbV(m1(y1), y1), B = hbV(m1(y2), y2), C = hbV(m1(y3), y3);
  const D = hbV(m2(y1), y1), E = hbV(m2(y2), y2), F = hbV(m2(y3), y3);
  hbSeg(ctx, hbBeyond(C, A, 14), hbBeyond(A, C, 14), DK_BLUE, 2.2);
  hbSeg(ctx, hbBeyond(F, D, 14), hbBeyond(D, F, 14), DK_RED_LT, 2.2);
  const nm = [['A', A, -1], ['B', B, -1], ['C', C, -1], ['D', D, 1], ['E', E, 1], ['F', F, 1]];
  nm.forEach(([s, P, sd]) => cgLabel(ctx, P, s, DK_IVORY, 12 * sd, -11, PR_FIG_IT()));
  const fnt = PR_FIG_FONT();
  const mid = (P, Q) => hbV((P.x + Q.x) / 2, (P.y + Q.y) / 2);
  if (lab.AB) cgLabel(ctx, mid(A, B), lab.AB, DK_BLUE, -30, 0, fnt);
  if (lab.BC) cgLabel(ctx, mid(B, C), lab.BC, DK_BLUE, -32, 0, fnt);
  if (lab.DE) cgLabel(ctx, mid(D, E), lab.DE, DK_RED_LT, 30, 0, fnt);
  if (lab.EF) cgLabel(ctx, mid(E, F), lab.EF, DK_RED_LT, 30, 0, fnt);
  return { A, B, C, D, E, F };
}

const PR_QUIZ_FIGS = {
  // Q1：D 在 BC 上，BD = 4、DC = 7
  q1(ctx, W, H) {
    const B = hbV(40, H - 40), C = hbV(W - 40, H - 40);
    const D = prLerp(B, C, 4 / 11), A = hbV(B.x + (C.x - B.x) * 0.3, 36);
    const G = hbCentroid([A, B, C]);
    hbPoly(ctx, [A, B, C], DK_IVORY, 0.05, 2.2);
    hbSeg(ctx, A, D, DK_GREEN, 2.2);
    ['A', 'B', 'C'].forEach((s, i) => hbVLabel(ctx, [A, B, C][i], G, s, DK_IVORY, 15));
    cgLabel(ctx, D, 'D', DK_IVORY, 0, 16, PR_FIG_IT());
    cgLabel(ctx, prLerp(B, D, 0.5), '4', DK_SEPIA, 0, 16, PR_FIG_FONT());
    cgLabel(ctx, prLerp(D, C, 0.5), '7', DK_SEPIA, 0, 16, PR_FIG_FONT());
  },
  // Q2：梯形 ABCD，AD = 9、BC = 16，M 為 BC 中點
  q2(ctx, W, H) {
    const B = hbV(36, H - 40), C = hbV(W - 36, H - 40);
    const A = hbV(B.x + 54, 44), D = hbV(A.x + (C.x - B.x) * 9 / 16, 44);
    const M = prLerp(B, C, 0.5);
    const G = hbCentroid([A, B, C, D]);
    hbPoly(ctx, [A, B, C, D], DK_IVORY, 0.05, 2.2);
    hbSeg(ctx, A, M, DK_GREEN, 2.2);
    hbSeg(ctx, D, M, DK_GREEN, 2.2);
    hbTick(ctx, B, M, 1, DK_SEPIA);
    hbTick(ctx, M, C, 1, DK_SEPIA);
    ['A', 'B', 'C', 'D'].forEach((s, i) => hbVLabel(ctx, [A, B, C, D][i], G, s, DK_IVORY, 15));
    cgLabel(ctx, M, 'M', DK_IVORY, 0, 17, PR_FIG_IT());
    hbSideLabel(ctx, A, D, G, '9', DK_SEPIA, 13, PR_FIG_FONT());
    cgLabel(ctx, prLerp(B, M, 0.5), 'BC = 16', DK_SEPIA, 0, 16, PR_FIG_FONT());
  },
  q3(ctx, W, H) { prFigDE(ctx, W, H, 0.7, { AD: '7', DB: '3', AE: '14' }); },
  q4(ctx, W, H) {
    prFigDE(ctx, W, H, 10 / 24, { AD: '10', EC: '?' });
  },
  q5(ctx, W, H) { prFigDE(ctx, W, H, 8 / 18, { DB: '10', DE: '4', BC: '9' }); },
  // Q6：D、E 在 AB 上，F、G 在 AC 上，DF // EG // BC
  q6(ctx, W, H) {
    const T3 = prTriFlat(10, 11, 50, { x: 60, y: 30, w: W - 120, h: H - 60 }, 0.46);
    const { A, B, C } = T3;
    const G0 = hbCentroid([A, B, C]);
    hbPoly(ctx, [A, B, C], DK_IVORY, 0.05, 2.2);
    const D = prLerp(A, B, 1 / 7), E = prLerp(A, B, 3 / 7), F = prLerp(A, C, 1 / 7), Gp = prLerp(A, C, 3 / 7);
    hbSeg(ctx, D, F, DK_GREEN, 2.2);
    hbSeg(ctx, E, Gp, DK_GREEN, 2.2);
    ['A', 'B', 'C'].forEach((s, i) => hbVLabel(ctx, [A, B, C][i], G0, s, DK_IVORY, 15));
    prPtLab(ctx, D, A, B, G0, 'D', DK_IVORY, 14);
    prPtLab(ctx, E, A, B, G0, 'E', DK_IVORY, 14);
    prPtLab(ctx, F, A, C, G0, 'F', DK_IVORY, 14);
    prPtLab(ctx, Gp, A, C, G0, 'G', DK_IVORY, 14);
    hbSideLabel(ctx, B, C, G0, '21', DK_SEPIA, 14, PR_FIG_FONT());
  },
  q8(ctx, W, H) {
    const g = prFigDE(ctx, W, H, 10 / 24, { AD: '10', DB: '14', AE: '15', EC: '21' }, { noPar: true });
    hbAngle(ctx, g.B, g.C, g.A, 22, DK_MUSTARD, { alpha: 0.3 });
    cgLabel(ctx, g.B, '58°', DK_MUSTARD, 38, -10, PR_FIG_FONT());
  },
  // Q10：DE // BC，以 D 為圓心、DE 為半徑畫弧，交 AC 於 E、E'
  q10(ctx, W, H) {
    const T3 = prTriFlat(10, 9, 50, { x: 60, y: 30, w: W - 120, h: H - 60 }, 0.5);
    const { A, B, C } = T3;
    const G = hbCentroid([A, B, C]);
    hbPoly(ctx, [A, B, C], DK_IVORY, 0.05, 2.2);
    const D = prLerp(A, B, 0.55), E = prLerp(A, C, 0.55);
    const r = hbDist(D, E);
    const two = cgLC(A, C, D, r);
    const E2 = two.filter(q => hbDist(q, E) > 2)[0];
    ctx.save();
    ctx.setLineDash([4, 4]);
    cgArcAt(ctx, D, r, [E, E2], 0.25, DK_MUSTARD, 1.6);
    ctx.restore();
    hbSeg(ctx, D, E, DK_GREEN, 2.4);
    hbSeg(ctx, D, E2, DK_RED_LT, 2.2, [6, 4]);
    prParMark(ctx, D, E, B, C, DK_MUSTARD);
    ['A', 'B', 'C'].forEach((s, i) => hbVLabel(ctx, [A, B, C][i], G, s, DK_IVORY, 15));
    prPtLab(ctx, D, A, B, G, 'D', DK_IVORY, 14);
    prPtLab(ctx, E, A, C, G, 'E', DK_IVORY, 14);
    prPtLab(ctx, E2, A, C, G, "E'", DK_RED_LT, 15);
  },
  // Q12：三層中點，PQ = 3
  q12(ctx, W, H) {
    const T3 = prTriFlat(10, 11, 62, { x: 40, y: 22, w: W - 80, h: H - 44 }, 0.46);
    const { A, B, C } = T3;
    const G = hbCentroid([A, B, C]);
    hbPoly(ctx, [A, B, C], DK_IVORY, 0.05, 2.2);
    const lv = [[0.5, 'D', 'E'], [0.25, 'F', 'G'], [0.125, 'P', 'Q']];
    lv.forEach(([t, a, b], i) => {
      const L = prLerp(A, B, t), R = prLerp(A, C, t);
      hbSeg(ctx, L, R, i === 2 ? DK_GREEN : DK_SEPIA, 2);
      prPtLab(ctx, L, A, B, G, a, DK_IVORY, 12);
      prPtLab(ctx, R, A, C, G, b, DK_IVORY, 12);
    });
    ['A', 'B', 'C'].forEach((s, i) => hbVLabel(ctx, [A, B, C][i], G, s, DK_IVORY, 15));
    const P = prLerp(A, B, 0.125), Q = prLerp(A, C, 0.125);
    cgLabel(ctx, hbV((P.x + Q.x) / 2, P.y), '3', DK_GREEN, 0, -10, f(800, 12));
  },
  // Q13：AD = DB = 5，DE // BC，AC = 13、BC = 19
  q13(ctx, W, H) {
    prFigDE(ctx, W, H, 0.5, { AD: '5', DB: '5', BC: '19' });
  },
  q15(ctx, W, H) { prFigPar3(ctx, W, H, 7 / 19, { AB: 'x + 3', BC: '2x + 4', DE: '14', EF: '24' }); },
  q16(ctx, W, H) { prFigPar3(ctx, W, H, 7 / 16, { AB: '7', BC: 'x + 1', DE: 'x − 1', EF: '9' }); },
  // Q17：梯形 ABCD，AD // EF // BC，AD = 6、BC = 13
  q17(ctx, W, H) {
    const B = hbV(34, H - 40), C = hbV(W - 34, H - 40);
    const A = hbV(B.x + 40, 40), D = hbV(A.x + (C.x - B.x) * 6 / 13, 40);
    const G = hbCentroid([A, B, C, D]);
    hbPoly(ctx, [A, B, C, D], DK_IVORY, 0.05, 2.2);
    const E = prLerp(A, B, 2 / 7), F = prLerp(D, C, 2 / 7);
    hbSeg(ctx, E, F, DK_GREEN, 2.4);
    ['A', 'B', 'C', 'D'].forEach((s, i) => hbVLabel(ctx, [A, B, C, D][i], G, s, DK_IVORY, 15));
    prPtLab(ctx, E, A, B, G, 'E', DK_IVORY, 14);
    prPtLab(ctx, F, D, C, G, 'F', DK_IVORY, 14);
    hbSideLabel(ctx, A, D, G, '6', DK_SEPIA, 13, PR_FIG_FONT());
    hbSideLabel(ctx, B, C, G, '13', DK_SEPIA, 13, PR_FIG_FONT());
  },
  // Q18：梯形 ABCD，對角線交於 G，EF 過 G 且 // BC，AD = 12、BC = 20
  q18(ctx, W, H) {
    const B = hbV(34, H - 40), C = hbV(W - 34, H - 40);
    const A = hbV(B.x + 50, 40), D = hbV(A.x + (C.x - B.x) * 12 / 20, 40);
    const Gc = hbCentroid([A, B, C, D]);
    hbPoly(ctx, [A, B, C, D], DK_IVORY, 0.05, 2.2);
    hbSeg(ctx, A, C, DK_SEPIA, 1.6, [5, 4]);
    hbSeg(ctx, B, D, DK_SEPIA, 1.6, [5, 4]);
    const Gx = cgLL(A, C, B, D);
    const E = cgLL(A, B, hbV(0, Gx.y), hbV(W, Gx.y)), F = cgLL(D, C, hbV(0, Gx.y), hbV(W, Gx.y));
    hbSeg(ctx, E, F, DK_GREEN, 2.4);
    ['A', 'B', 'C', 'D'].forEach((s, i) => hbVLabel(ctx, [A, B, C, D][i], Gc, s, DK_IVORY, 15));
    prPtLab(ctx, E, A, B, Gc, 'E', DK_IVORY, 14);
    prPtLab(ctx, F, D, C, Gc, 'F', DK_IVORY, 14);
    cgLabel(ctx, Gx, 'G', DK_IVORY, 0, -14, PR_FIG_IT());
    hbSideLabel(ctx, A, D, Gc, '12', DK_SEPIA, 13, PR_FIG_FONT());
    hbSideLabel(ctx, B, C, Gc, '20', DK_SEPIA, 13, PR_FIG_FONT());
  },
  // Q19：L1 // L2 // L3，AB = 4、BC = 6、AD = 7、BE = 9
  q19(ctx, W, H) {
    const y1 = 40, y3 = H - 34, y2 = y1 + (y3 - y1) * 0.4;
    [y1, y2, y3].forEach((y, i) => {
      hbSeg(ctx, hbV(22, y), hbV(W - 30, y), DK_IVORY, 2);
      subLabel(ctx, 'L', String(i + 1), W - 16, y, DK_IVORY, 14);
    });
    const s = 12;
    const m1 = y => 50 + 0.12 * (y - y1);
    const A = hbV(m1(y1), y1), B = hbV(m1(y2), y2), C = hbV(m1(y3), y3);
    const D = hbV(A.x + 7 * s, y1), E = hbV(B.x + 9 * s, y2), F = hbV(C.x + 12 * s, y3);
    hbSeg(ctx, hbBeyond(C, A, 12), hbBeyond(A, C, 12), DK_BLUE, 2.2);
    hbSeg(ctx, hbBeyond(F, D, 12), hbBeyond(D, F, 12), DK_RED_LT, 2.2);
    hbSeg(ctx, A, D, DK_GREEN, 3);
    hbSeg(ctx, B, E, DK_GREEN, 3);
    hbSeg(ctx, C, F, DK_GREEN, 3);
    [['A', A, -1], ['B', B, -1], ['C', C, -1], ['D', D, 1], ['E', E, 1], ['F', F, 1]]
      .forEach(([n, P, sd]) => cgLabel(ctx, P, n, DK_IVORY, 12 * sd, -11, PR_FIG_IT()));
    const fnt = PR_FIG_FONT();
    cgLabel(ctx, prLerp(A, B, 0.5), '4', DK_BLUE, -14, 0, fnt);
    cgLabel(ctx, prLerp(B, C, 0.5), '6', DK_BLUE, -14, 0, fnt);
    cgLabel(ctx, prLerp(A, D, 0.5), '7', DK_GREEN, 0, 12, fnt);
    cgLabel(ctx, prLerp(B, E, 0.5), '9', DK_GREEN, 0, 12, fnt);
    cgLabel(ctx, prLerp(C, F, 0.5), '?', DK_GREEN, 0, -12, fnt);
  }
};

function initQuizFigs() {
  document.querySelectorAll('canvas.quiz-fig[data-fig]').forEach(cv => {
    const fn = PR_QUIZ_FIGS[cv.getAttribute('data-fig')];
    if (!fn) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    fn(ctx, cv.width, cv.height);
  });
}

/* ==========================================================================
   重點 1：高相等的兩個三角形，面積比 = 底邊比
   ========================================================================== */
function initAreaCanvas() {
  const cv = hbEl('canvas-area');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = hbEl('ar-p'), sq = hbEl('ar-q'), ss = hbEl('ar-s');
  const out = hbEl('ar-formula'), fb = hbEl('ar-feedback');
  const C0 = DK_TONE[0];
  let mode = 'line';

  function draw() {
    const W = cv.width, H = cv.height;
    const p = hbIv(sp), q = hbIv(sq), s = hbIv(ss);
    hbEl('ar-vp').textContent = p;
    hbEl('ar-vq').textContent = q;
    hbEl('ar-vs').textContent = s;
    ctx.clearRect(0, 0, W, H);
    let a1, a2;
    if (mode === 'line') {
      drawTitle(ctx, '頂點相同、底邊在同一條直線上', C0);
      const k = Math.min(56, 400 / (p + q));
      const x0 = W / 2 - (p + q) * k / 2, yb = 280;
      const B = hbV(x0, yb), D = hbV(x0 + p * k, yb), C = hbV(x0 + (p + q) * k, yb);
      const A = hbV(W / 2 + s * 34, yb - 196);
      const E = hbV(A.x, yb);
      const lo = Math.min(B.x, E.x) - 16, hi = Math.max(C.x, E.x) + 16;
      hbSeg(ctx, hbV(lo, yb), hbV(hi, yb), DK_FAINT, 1.4, [5, 5]);
      hbPoly(ctx, [A, B, D], C0, 0.26, 0.01);
      hbPoly(ctx, [A, D, C], DK_BLUE, 0.22, 0.01);
      hbPoly(ctx, [A, B, C], DK_IVORY, 0, 2.6);
      hbSeg(ctx, A, D, DK_IVORY, 2.4);
      hbSeg(ctx, A, E, DK_MUSTARD, 2, [6, 5]);
      cgRight(ctx, E, hbV(0, -1), hbV(E.x > (B.x + C.x) / 2 ? -1 : 1, 0), 10, DK_MUSTARD);
      cgLabel(ctx, hbV(A.x, (A.y + E.y) / 2), 'h', DK_MUSTARD, 13, 0, fi(800, 17));
      const G = hbCentroid([A, B, C]);
      hbVLabel(ctx, A, G, 'A', DK_IVORY, 18);
      cgLabel(ctx, B, 'B', DK_IVORY, -6, 19, fi(800, 17));
      cgLabel(ctx, C, 'C', DK_IVORY, 6, 19, fi(800, 17));
      cgLabel(ctx, D, 'D', DK_IVORY, 0, 19, fi(800, 17));
      cgLabel(ctx, prLerp(B, D, 0.5), String(p), C0, 0, -14, f(800, 15));
      cgLabel(ctx, prLerp(D, C, 0.5), String(q), DK_BLUE, 0, -14, f(800, 15));
      a1 = hbPolyArea([A, B, D]);
      a2 = hbPolyArea([A, D, C]);
      hbFitLine(ctx, '△ABD = ½ × BD × h，△ADC = ½ × DC × h（兩個三角形的高都是 h）', 334, MUTED, 14);
      hbFitLine(ctx, `△ABD : △ADC = BD : DC = ${prRatioEq(p, q)}`, 368, C0, 17);
      hbFitLine(ctx, `△ABD : △ABC = BD : BC = ${prRatioEq(p, p + q)}`, 400, DK_BLUE, 16);
      hbFitLine(ctx, `量一量：△ABD ÷ △ADC ≈ ${prDec(a1 / a2)}，BD ÷ DC ≈ ${prDec(p / q)}`, 436, MUTED, 14);
      out.innerHTML = '面積比：' + wbrEq(`\\triangle ABD : \\triangle ADC = \\overline{BD} : \\overline{DC} = ${prRatioEq(p, q)}`) +
        '，' + wbrEq(`\\triangle ABD : \\triangle ABC = ${prRatioEq(p, p + q)}`);
      fb.innerHTML = wrapFeedback('頂點 \\(A\\) 左右移動時，高 \\(h\\) 不變，兩塊的<strong>面積比也不變</strong>：高相等時，面積比 = 底邊比。');
    } else {
      drawTitle(ctx, '底邊分別在兩條平行線上', C0);
      const yT = 112, yB = 282;
      const k = Math.min(52, 340 / Math.max(p, q));
      const A = hbV(W / 2 - p * k / 2 + s * 28, yT), D = hbV(A.x + p * k, yT);
      const B = hbV(W / 2 - q * k / 2, yB), C = hbV(B.x + q * k, yB);
      hbSeg(ctx, hbV(14, yT), hbV(W - 14, yT), DK_FAINT, 1.6);
      hbSeg(ctx, hbV(14, yB), hbV(W - 14, yB), DK_FAINT, 1.6);
      prParMark(ctx, hbV(14, yT), hbV(70, yT), hbV(14, yB), hbV(70, yB), DK_MUSTARD);
      hbPoly(ctx, [A, B, D], C0, 0.26, 0.01);
      hbPoly(ctx, [B, C, D], DK_BLUE, 0.22, 0.01);
      hbPoly(ctx, [A, B, C, D], DK_IVORY, 0, 2.6);
      hbSeg(ctx, B, D, DK_IVORY, 2.4);
      const hx = W - 34;
      hbSeg(ctx, hbV(hx, yT), hbV(hx, yB), DK_MUSTARD, 2, [6, 5]);
      cgRight(ctx, hbV(hx, yB), hbV(0, -1), hbV(-1, 0), 10, DK_MUSTARD);
      cgLabel(ctx, hbV(hx, (yT + yB) / 2), 'h', DK_MUSTARD, -13, 0, fi(800, 17));
      cgLabel(ctx, A, 'A', DK_IVORY, -10, -17, fi(800, 17));
      cgLabel(ctx, D, 'D', DK_IVORY, 10, -17, fi(800, 17));
      cgLabel(ctx, B, 'B', DK_IVORY, -10, 19, fi(800, 17));
      cgLabel(ctx, C, 'C', DK_IVORY, 10, 19, fi(800, 17));
      cgLabel(ctx, prLerp(A, D, 0.5), String(p), C0, 0, -16, f(800, 15));
      cgLabel(ctx, prLerp(B, C, 0.5), String(q), DK_BLUE, 0, 18, f(800, 15));
      a1 = hbPolyArea([A, B, D]);
      a2 = hbPolyArea([B, C, D]);
      hbFitLine(ctx, '△ABD 的底是 AD、△BCD 的底是 BC，高都是兩條平行線的距離 h', 334, MUTED, 14);
      hbFitLine(ctx, `△ABD : △BCD = AD : BC = ${prRatioEq(p, q)}`, 368, C0, 17);
      hbFitLine(ctx, '上面那條邊左右滑動，兩塊的面積都不變', 400, DK_BLUE, 15);
      hbFitLine(ctx, `量一量：△ABD ÷ △BCD ≈ ${prDec(a1 / a2)}，AD ÷ BC ≈ ${prDec(p / q)}`, 436, MUTED, 14);
      out.innerHTML = '面積比：' + wbrEq(`\\triangle ABD : \\triangle BCD = \\overline{AD} : \\overline{BC} = ${prRatioEq(p, q)}`);
      fb.innerHTML = wrapFeedback('\\(\\overline{AD} /\\!/ \\overline{BC}\\)：兩條平行線的距離處處相等，所以兩個三角形<strong>等高</strong>，面積比就是底邊比。');
    }
    typeset([out, fb]);
  }

  [sp, sq, ss].forEach(x => x.addEventListener('input', draw));
  bindPickGroup(hbEl('ar-mode-group'), 'data-ar-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：平行線截比例線段性質①——兩邊被截成相同的比
   AB = a + b、AC = c（單位長），D、E 把兩邊都截成 a : b
   ========================================================================== */
function initCut1Canvas() {
  const cv = hbEl('canvas-cut1');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('c1-a'), sb = hbEl('c1-b'), sc = hbEl('c1-c');
  const out = hbEl('c1-formula'), fb = hbEl('c1-feedback');
  const C0 = DK_TONE[1];
  let mode = 'part';

  // 把線段 PQ 往遠離 G 的那一側平移 off，畫成一條帶端點短槓的量尺
  function outerBar(P, Q, G, off, color) {
    const d = hbDist(P, Q) || 1;
    let nx = -(Q.y - P.y) / d, ny = (Q.x - P.x) / d;
    const m = prLerp(P, Q, 0.5);
    if ((m.x - G.x) * nx + (m.y - G.y) * ny < 0) { nx = -nx; ny = -ny; }
    const P2 = hbV(P.x + nx * off, P.y + ny * off), Q2 = hbV(Q.x + nx * off, Q.y + ny * off);
    hbSeg(ctx, P2, Q2, color, 3);
    [P2, Q2].forEach(R => hbSeg(ctx, hbV(R.x - nx * 6, R.y - ny * 6), hbV(R.x + nx * 6, R.y + ny * 6), color, 2.4));
  }

  function draw() {
    const W = cv.width, H = cv.height;
    const a = hbIv(sa), b = hbIv(sb), c = hbIv(sc);
    hbEl('c1-va').textContent = a;
    hbEl('c1-vb').textContent = b;
    hbEl('c1-vc').textContent = c;
    const n = a + b;
    ctx.clearRect(0, 0, W, H);
    const titles = { part: '上段比下段：AD : DB = AE : EC', whole: '上段比全長：AD : AB = AE : AC', low: '下段比全長：DB : AB = EC : AC', why: '為什麼？用等高三角形的面積來推' };
    drawTitle(ctx, titles[mode], C0);
    const T3 = prTriFlat(n, c, 54, { x: 110, y: 66, w: 320, h: 214 }, 0.45);
    const { A, B, C } = T3;
    const G = hbCentroid([A, B, C]);
    const t = a / n;
    const D = prLerp(A, B, t), E = prLerp(A, C, t);
    const AE = qOf(c * a, n), EC = qOf(c * b, n);

    if (mode === 'why') {
      hbPoly(ctx, [A, D, E], C0, 0.3, 0.01);
      hbPoly(ctx, [B, D, E], DK_BLUE, 0.16, 1.6);
      hbPoly(ctx, [C, D, E], DK_RED_LT, 0.16, 1.6);
    }
    hbPoly(ctx, [A, B, C], DK_IVORY, 0.04, 2.6);
    hbSeg(ctx, D, E, DK_GREEN, 3);
    prParMark(ctx, D, E, B, C, DK_MUSTARD);
    if (mode === 'part') {
      hbSeg(ctx, A, D, C0, 5); hbSeg(ctx, D, B, DK_BLUE, 5);
      hbSeg(ctx, A, E, C0, 5); hbSeg(ctx, E, C, DK_BLUE, 5);
    } else if (mode === 'whole') {
      hbSeg(ctx, A, D, C0, 5); hbSeg(ctx, A, E, C0, 5);
      outerBar(A, B, G, 46, DK_BLUE); outerBar(A, C, G, 46, DK_BLUE);
    } else if (mode === 'low') {
      hbSeg(ctx, D, B, C0, 5); hbSeg(ctx, E, C, C0, 5);
      outerBar(A, B, G, 46, DK_BLUE); outerBar(A, C, G, 46, DK_BLUE);
    } else {
      hbSeg(ctx, B, E, DK_BLUE, 2, [5, 4]);
      hbSeg(ctx, C, D, DK_RED_LT, 2, [5, 4]);
    }
    hbVLabel(ctx, A, G, 'A', DK_IVORY, 18);
    hbVLabel(ctx, B, G, 'B', DK_IVORY, 18);
    hbVLabel(ctx, C, G, 'C', DK_IVORY, 18);
    prPtLab(ctx, D, A, B, G, 'D', DK_IVORY, 17);
    prPtLab(ctx, E, A, C, G, 'E', DK_IVORY, 17);
    prSideIt(ctx, A, D, G, T(String(a), C0), C0, 22, 15);
    prSideIt(ctx, D, B, G, T(String(b), DK_BLUE), DK_BLUE, 22, 15);
    prSideIt(ctx, A, E, G, qIt(AE, C0), C0, 26, 14);
    prSideIt(ctx, E, C, G, qIt(EC, DK_BLUE), DK_BLUE, 26, 14);

    const m = (P, Q) => hbDist(P, Q);
    if (mode === 'part') {
      prRow(ctx, 330, [T(`AD : DB = ${prRatioEq(a, b)}`, C0)], 17);
      prRow(ctx, 368, [T('AE : EC = ', DK_BLUE), qIt(AE, DK_BLUE), T(' : ', DK_BLUE), qIt(EC, DK_BLUE), T(` = ${prRatio(a, b)}`, DK_BLUE)], 17);
      hbFitLine(ctx, 'DE // BC：兩邊的「上段 : 下段」一樣', 404, DK_GREEN, 15);
      hbFitLine(ctx, `量一量：AD ÷ DB ≈ ${prDec(m(A, D) / m(D, B))}，AE ÷ EC ≈ ${prDec(m(A, E) / m(E, C))}`, 436, MUTED, 14);
      out.innerHTML = wbrEq(`\\overline{AD} : \\overline{DB} = ${prRatioEq(a, b)}`) + '，' +
        wbrEq(`\\overline{AE} : \\overline{EC} = ${qTex(AE)} : ${qTex(EC)} = ${prRatio(a, b)}`);
      fb.innerHTML = wrapFeedback('\\(\\overline{DE} /\\!/ \\overline{BC}\\) 時，\\(\\overline{AB}\\)、\\(\\overline{AC}\\) 被截成<strong>相同的比</strong>：上段 : 下段一樣。');
    } else if (mode === 'whole') {
      prRow(ctx, 330, [T(`AD : AB = ${prRatioEq(a, n)}`, C0)], 17);
      prRow(ctx, 368, [T('AE : AC = ', DK_BLUE), qIt(AE, DK_BLUE), T(` : ${c} = ${prRatio(a, n)}`, DK_BLUE)], 17);
      hbFitLine(ctx, '藍色量尺是整條邊：上段要和「整條邊」比', 404, DK_GREEN, 15);
      hbFitLine(ctx, `量一量：AD ÷ AB ≈ ${prDec(m(A, D) / m(A, B))}，AE ÷ AC ≈ ${prDec(m(A, E) / m(A, C))}`, 436, MUTED, 14);
      out.innerHTML = wbrEq(`\\overline{AD} : \\overline{AB} = ${prRatioEq(a, n)}`) + '，' +
        wbrEq(`\\overline{AE} : \\overline{AC} = ${qTex(AE)} : ${c} = ${prRatio(a, n)}`);
      fb.innerHTML = wrapFeedback('上段比全長也相等：\\(\\overline{AD} : \\overline{AB} = \\overline{AE} : \\overline{AC}\\)。題目給「全長」時用這一條最快。');
    } else if (mode === 'low') {
      prRow(ctx, 330, [T(`DB : AB = ${prRatioEq(b, n)}`, C0)], 17);
      prRow(ctx, 368, [T('EC : AC = ', DK_BLUE), qIt(EC, DK_BLUE), T(` : ${c} = ${prRatio(b, n)}`, DK_BLUE)], 17);
      hbFitLine(ctx, '下段比全長也一樣', 404, DK_GREEN, 15);
      hbFitLine(ctx, `量一量：DB ÷ AB ≈ ${prDec(m(D, B) / m(A, B))}，EC ÷ AC ≈ ${prDec(m(E, C) / m(A, C))}`, 436, MUTED, 14);
      out.innerHTML = wbrEq(`\\overline{DB} : \\overline{AB} = ${prRatioEq(b, n)}`) + '，' +
        wbrEq(`\\overline{EC} : \\overline{AC} = ${qTex(EC)} : ${c} = ${prRatio(b, n)}`);
      fb.innerHTML = wrapFeedback('下段比全長：\\(\\overline{DB} : \\overline{AB} = \\overline{EC} : \\overline{AC}\\)。三個比例式都對，挑題目給的那幾段來用。');
    } else {
      hbFitLine(ctx, '△ADE : △BDE = AD : DB（以 AD、DB 為底，高相同）', 326, C0, 15);
      hbFitLine(ctx, '△ADE : △CDE = AE : EC（以 AE、EC 為底，高相同）', 356, C0, 15);
      hbFitLine(ctx, 'DE // BC ⇒ △BDE = △CDE（同底 DE、等高）', 388, DK_GREEN, 15);
      hbFitLine(ctx, `所以 AE : EC = AD : DB = ${prRatio(a, b)}`, 420, DK_IVORY, 17);
      hbFitLine(ctx, `量一量：△BDE ÷ △CDE ≈ ${prDec(hbPolyArea([B, D, E]) / hbPolyArea([C, D, E]))}`, 450, MUTED, 13.5);
      out.innerHTML = wbrEq(`\\triangle BDE = \\triangle CDE \\Rightarrow \\overline{AE} : \\overline{EC} = \\overline{AD} : \\overline{DB} = ${prRatioEq(a, b)}`);
      fb.innerHTML = wrapFeedback('藍色 \\(\\triangle BDE\\) 與紅色 \\(\\triangle CDE\\) 有同一條底 \\(\\overline{DE}\\)，又因為平行而<strong>等高</strong>，面積相等——兩個比就被它們串起來了。');
    }
    typeset([out, fb]);
  }

  [sa, sb, sc].forEach(x => x.addEventListener('input', draw));
  bindPickGroup(hbEl('c1-mode-group'), 'data-c1-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：平行線截比例線段性質②——DE : BC = AD : AB（不是 AD : DB）
   B(0, 0)、C(c, 0)、A 在 ∠B = 64° 的方向上
   ========================================================================== */
function initCut2Canvas() {
  const cv = hbEl('canvas-cut2');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('c2-a'), sb = hbEl('c2-b'), sc = hbEl('c2-c');
  const rowB = hbEl('c2-row-b'), la = hbEl('c2-la');
  const out = hbEl('c2-formula'), fb = hbEl('c2-feedback');
  const C0 = DK_TONE[2];
  let mode = 'one';

  function setLabel() {
    la.innerHTML = mode === 'one' ? '\\(\\overline{AD}\\) 的長' : '\\(\\overline{AB}\\) 分成幾等分';
    rowB.style.display = mode === 'one' ? '' : 'none';
    typeset([la]);
  }

  function draw() {
    const W = cv.width, H = cv.height;
    const a = mode === 'one' ? hbClampSlider(sa, 1, 6) : hbClampSlider(sa, 2, 6);
    const b = hbIv(sb), c = hbIv(sc);
    hbEl('c2-va').textContent = a;
    hbEl('c2-vb').textContent = b;
    hbEl('c2-vc').textContent = c;
    ctx.clearRect(0, 0, W, H);
    const ab = mode === 'one' ? a + b : c;
    const raw = [hbV(0, 0), hbV(c, 0), hbAt(hbV(0, 0), 64, ab)];
    const p = hbFit(raw, { x: 100, y: 62, w: 340, h: 222 });
    const B = p[0], C = p[1], A = p[2];
    const G = hbCentroid([A, B, C]);
    hbPoly(ctx, [A, B, C], DK_IVORY, 0.04, 2.6);
    hbVLabel(ctx, A, G, 'A', DK_IVORY, 18);
    hbVLabel(ctx, B, G, 'B', DK_IVORY, 18);
    hbVLabel(ctx, C, G, 'C', DK_IVORY, 18);
    hbSideLabel(ctx, B, C, G, String(c), DK_BLUE, 18, f(800, 15));

    if (mode === 'one') {
      drawTitle(ctx, 'DE 要和整條 BC 比：DE : BC = AD : AB', C0);
      const D = prLerp(A, B, a / (a + b)), E = prLerp(A, C, a / (a + b));
      const DE = qOf(c * a, a + b), wrong = qOf(c * a, b);
      hbSeg(ctx, A, D, C0, 5);
      hbSeg(ctx, D, E, DK_GREEN, 3.4);
      prParMark(ctx, D, E, B, C, DK_MUSTARD);
      prPtLab(ctx, D, A, B, G, 'D', DK_IVORY, 17);
      prPtLab(ctx, E, A, C, G, 'E', DK_IVORY, 17);
      prSideIt(ctx, A, D, G, T(String(a), C0), C0, 22, 15);
      prSideIt(ctx, D, B, G, T(String(b), DK_SEPIA), DK_SEPIA, 22, 15);
      drawExpr(ctx, [qIt(DE, DK_GREEN)], (D.x + E.x) / 2, D.y + 20, 15, DK_GREEN, { gap: 0 });
      prRow(ctx, 328, [T(`DE : BC = AD : AB = ${prRatioEq(a, a + b)}`, C0)], 17);
      prRow(ctx, 366, [T(`DE = ${c} × `, DK_GREEN), qIt(qOf(a, a + b), DK_GREEN), T(' = ', DK_GREEN), qIt(DE, DK_GREEN)], 17);
      prRow(ctx, 406, [T(`錯：誤用 AD : DB，會算成 ${c} × `, DK_NO), qIt(qOf(a, b), DK_NO), T(' = ', DK_NO), qIt(wrong, DK_NO)], 15);
      hbFitLine(ctx, `量一量：DE ÷ BC ≈ ${prDec(hbDist(D, E) / hbDist(B, C))}，AD ÷ AB ≈ ${prDec(hbDist(A, D) / hbDist(A, B))}`, 442, MUTED, 14);
      out.innerHTML = wbrEq(`\\overline{DE} : \\overline{BC} = \\overline{AD} : \\overline{AB} = ${prRatioEq(a, a + b)}`) + '，' +
        wbrEq(`\\overline{DE} = ${c} \\times ${qTex(qOf(a, a + b))} = ${qTex(DE)}`);
      fb.innerHTML = wrapFeedback('\\(\\overline{DE}\\) 和 \\(\\overline{BC}\\) 是<strong>上下兩條平行邊</strong>，要配「上段 : 全長」\\(\\overline{AD} : \\overline{AB}\\)；配成 \\(\\overline{AD} : \\overline{DB}\\) 是最常見的錯。');
    } else {
      const n = a;
      drawTitle(ctx, `AB 分成 ${n} 等分，每一條都和 BC 平行`, C0);
      const lens = [];
      for (let k = 1; k < n; k++) {
        const L = prLerp(A, B, k / n), R = prLerp(A, C, k / n);
        const len = qOf(c * k, n);
        lens.push(len);
        hbSeg(ctx, L, R, DK_GREEN, 2.4);
        hbTick(ctx, prLerp(A, B, (k - 1) / n), L, 1, DK_SEPIA);
        drawExpr(ctx, [qIt(len, DK_GREEN)], R.x + 26, R.y, 13, DK_GREEN, { gap: 0 });
      }
      hbTick(ctx, prLerp(A, B, (n - 1) / n), B, 1, DK_SEPIA);
      hbArrowHead(ctx, B, C, DK_MUSTARD);
      prRow(ctx, 328, [T('由上往下第 k 條 = ', C0), VF(IT('k', C0), T(String(n), C0), C0), T(` × BC = `, C0), VF(IT('k', C0), T(String(n), C0), C0), T(` × ${c}`, C0)], 17);
      const items = [];
      lens.forEach((L, i) => { if (i) items.push(T('、', DK_GREEN)); items.push(qIt(L, DK_GREEN)); });
      prRow(ctx, 374, items, 16);
      prRow(ctx, 418, [T('每往下一條，長度就多 ', MUTED), qIt(qOf(c, n), MUTED), T('（BC 的 ', MUTED), qIt(qOf(1, n), MUTED), T('）', MUTED)], 15);
      out.innerHTML = '由上往下：' + lens.map(L => `\\(${qTex(L)}\\)`).join('、<wbr>');
      fb.innerHTML = wrapFeedback('每一條都和 \\(\\overline{BC}\\) 平行，各自配「上段 : 全長」：第 \\(k\\) 條是 \\(\\overline{BC}\\) 的 \\(\\frac{k}{' + n + '}\\)。');
    }
    typeset([out, fb]);
  }

  [sa, sb, sc].forEach(x => x.addEventListener('input', draw));
  bindPickGroup(hbEl('c2-mode-group'), 'data-c2-mode', v => { mode = v; setLabel(); draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：截成比例線段 ⇒ 平行（判別）
   ========================================================================== */
function initJudgeCanvas() {
  const cv = hbEl('canvas-judge');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = hbEl('jd-p'), sq = hbEl('jd-q'), sr = hbEl('jd-r'), ss = hbEl('jd-s');
  const out = hbEl('jd-formula'), fb = hbEl('jd-feedback');
  const C0 = DK_TONE[3];
  const d1 = v => (Math.round(v * 10) / 10).toFixed(1);

  function draw() {
    const W = cv.width, H = cv.height;
    const p = hbIv(sp), q = hbIv(sq), r = hbIv(sr), s = hbIv(ss);
    hbEl('jd-vp').textContent = p;
    hbEl('jd-vq').textContent = q;
    hbEl('jd-vr').textContent = r;
    hbEl('jd-vs').textContent = s;
    ctx.clearRect(0, 0, W, H);
    const par = p * s === q * r;
    drawTitle(ctx, '比一比兩邊被截成的比', C0);
    const T3 = prTriFlat(p + q, r + s, 54, { x: 110, y: 64, w: 320, h: 216 }, 0.45);
    const { A, B, C } = T3;
    const G = hbCentroid([A, B, C]);
    const D = prLerp(A, B, p / (p + q)), E = prLerp(A, C, r / (r + s));
    hbPoly(ctx, [A, B, C], DK_IVORY, 0.04, 2.6);
    const col = par ? DK_OK : DK_NO;
    hbSeg(ctx, D, E, col, 3.2);
    if (par) prParMark(ctx, D, E, B, C, DK_MUSTARD);
    hbAngle(ctx, D, A, E, 20, col, { alpha: 0.3 });
    hbAngle(ctx, B, A, C, 20, DK_MUSTARD, { alpha: 0.3 });
    hbVLabel(ctx, A, G, 'A', DK_IVORY, 18);
    hbVLabel(ctx, B, G, 'B', DK_IVORY, 18);
    hbVLabel(ctx, C, G, 'C', DK_IVORY, 18);
    prPtLab(ctx, D, A, B, G, 'D', DK_IVORY, 17);
    prPtLab(ctx, E, A, C, G, 'E', DK_IVORY, 17);
    hbSideLabel(ctx, A, D, G, String(p), C0, 22, f(800, 15));
    hbSideLabel(ctx, D, B, G, String(q), C0, 22, f(800, 15));
    hbSideLabel(ctx, A, E, G, String(r), DK_BLUE, 22, f(800, 15));
    hbSideLabel(ctx, E, C, G, String(s), DK_BLUE, 22, f(800, 15));
    const aD = hbAngleDeg(D, A, E), aB = hbAngleDeg(B, A, C);
    hbFitLine(ctx, `AD : DB = ${prRatioEq(p, q)}`, 326, C0, 17);
    hbFitLine(ctx, `AE : EC = ${prRatioEq(r, s)}`, 358, DK_BLUE, 17);
    hbFitLine(ctx, par ? '比相等 ⇒ DE // BC，∠ADE = ∠B（同位角相等）' : '比不相等 ⇒ DE 不平行 BC', 394, col, 16);
    hbFitLine(ctx, `量一量：∠ADE ≈ ${d1(aD)}°，∠B ≈ ${d1(aB)}°`, 428, MUTED, 14.5);
    if (!par && p - q === r - s) hbFitLine(ctx, '兩邊的「差」一樣，但「比」不一樣，照樣不平行', 456, DK_RED_LT, 13.5);
    out.innerHTML = wbrEq(`\\overline{AD} : \\overline{DB} = ${prRatioEq(p, q)}`) + '，' +
      wbrEq(`\\overline{AE} : \\overline{EC} = ${prRatioEq(r, s)}`) +
      (par ? '，比相等，所以 \\(\\overline{DE} /\\!/ \\overline{BC}\\)' : '，比不相等，\\(\\overline{DE}\\) 不平行 \\(\\overline{BC}\\)');
    fb.innerHTML = wrapFeedback(par
      ? '兩邊截成的比相等，\\(\\overline{DE}\\) 就<strong>一定平行</strong> \\(\\overline{BC}\\)，同位角 \\(\\angle ADE = \\angle B\\)。'
      : '比不相等，\\(\\overline{DE}\\) 就不平行 \\(\\overline{BC}\\)：看的是<strong>比</strong>，不是長度差。');
    typeset([out, fb]);
  }

  [sp, sq, sr, ss].forEach(x => x.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：DE : BC = AD : AB 不能拿來判斷平行（反例 E'）
   AB = 10、AC = c、∠A = 50°；AD : AB = k : 6
   ========================================================================== */
function initCounterCanvas() {
  const cv = hbEl('canvas-counter');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = hbEl('ct-k'), sc = hbEl('ct-c');
  const out = hbEl('ct-formula'), fb = hbEl('ct-feedback');
  const C0 = DK_TONE[4];
  const d1 = v => (Math.round(v * 10) / 10).toFixed(1);
  let mode = 'E2';

  function draw() {
    const W = cv.width, H = cv.height;
    const k = hbIv(sk), c = hbIv(sc);
    hbEl('ct-vk').textContent = `${k} : 6`;
    hbEl('ct-vc').textContent = c;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, mode === 'E2' ? "同樣長的 DE'，卻不平行 BC" : 'DE // BC：比例式成立', C0);
    const T3 = prTriFlat(10, c, 50, { x: 110, y: 74, w: 320, h: 208 }, 0.5);
    const { A, B, C } = T3;
    const G = hbCentroid([A, B, C]);
    const D = prLerp(A, B, k / 6), E = prLerp(A, C, k / 6);
    const rad = hbDist(D, E);
    const two = cgLC(A, C, D, rad);
    const E2 = two.slice().sort((u, v) => hbDist(v, E) - hbDist(u, E))[0];
    hbPoly(ctx, [A, B, C], DK_IVORY, 0.04, 2.6);
    ctx.save();
    ctx.setLineDash([5, 5]);
    cgArcAt(ctx, D, rad, [E, E2], 0.3, DK_MUSTARD, 1.6);
    ctx.restore();
    const focus2 = mode === 'E2';
    hbSeg(ctx, D, E, DK_OK, focus2 ? 2.2 : 3.6);
    hbSeg(ctx, D, E2, DK_NO, focus2 ? 3.6 : 2.2, focus2 ? null : [6, 4]);
    prParMark(ctx, D, E, B, C, DK_MUSTARD);
    hbAngle(ctx, B, A, C, 20, DK_MUSTARD, { alpha: 0.3 });
    if (focus2) hbAngle(ctx, D, A, E2, 24, DK_NO, { alpha: 0.28 });
    else hbAngle(ctx, D, A, E, 24, DK_OK, { alpha: 0.28 });
    hbVLabel(ctx, A, G, 'A', DK_IVORY, 18);
    hbVLabel(ctx, B, G, 'B', DK_IVORY, 18);
    hbVLabel(ctx, C, G, 'C', DK_IVORY, 18);
    prPtLab(ctx, D, A, B, G, 'D', DK_IVORY, 17);
    prPtLab(ctx, E, A, C, G, 'E', DK_OK, 17);
    prPtLab(ctx, E2, A, C, G, "E'", DK_NO, 18);
    const aB = hbAngleDeg(B, A, C), aE = hbAngleDeg(D, A, E), aE2 = hbAngleDeg(D, A, E2);
    const rE2 = hbDist(A, E2) / hbDist(E2, C);
    hbFitLine(ctx, "DE' = DE（以 D 為圓心的同一段弧，半徑相同）", 324, DK_MUSTARD, 15);
    hbFitLine(ctx, `DE : BC = AD : AB = ${prRatioEq(k, 6)}，所以 DE' : BC 也是 ${prRatio(k, 6)}`, 356, C0, 15.5);
    if (focus2) {
      hbFitLine(ctx, `可是 ∠ADE' ≈ ${d1(aE2)}°，∠B ≈ ${d1(aB)}°：DE' 不平行 BC`, 390, DK_NO, 16);
      hbFitLine(ctx, `量一量：AE' ÷ E'C ≈ ${prDec(rE2)}，AD ÷ DB ≈ ${prDec(k / (6 - k))}`, 424, MUTED, 14);
    } else {
      hbFitLine(ctx, `∠ADE ≈ ${d1(aE)}° = ∠B ≈ ${d1(aB)}°：DE // BC`, 390, DK_OK, 16);
      hbFitLine(ctx, `量一量：AE ÷ EC ≈ ${prDec(hbDist(A, E) / hbDist(E, C))}，AD ÷ DB ≈ ${prDec(k / (6 - k))}`, 424, MUTED, 14);
    }
    hbFitLine(ctx, '「一條平行邊 : 另一條平行邊」只能在已知平行後拿來算，不能反過來判斷平行', 456, MUTED, 13);
    if (focus2) {
      out.innerHTML = wbrEq(`\\overline{DE'} : \\overline{BC} = \\overline{AD} : \\overline{AB} = ${prRatioEq(k, 6)}`) +
        '，但 \\(\\overline{DE\'}\\) 不平行 \\(\\overline{BC}\\)';
    } else {
      out.innerHTML = wbrEq(`\\overline{DE} : \\overline{BC} = \\overline{AD} : \\overline{AB} = ${prRatioEq(k, 6)}`) +
        '，\\(\\overline{DE} /\\!/ \\overline{BC}\\)';
    }
    fb.innerHTML = wrapFeedback('\\(E\\) 與 \\(E\'\\) 都滿足「\\(\\overline{DE} : \\overline{BC} = \\overline{AD} : \\overline{AB}\\)」，卻只有一條平行：這個比例式<strong>不能用來判斷平行</strong>。判斷要用兩邊截成的比。');
    typeset([out, fb]);
  }

  [sk, sc].forEach(x => x.addEventListener('input', draw));
  bindPickGroup(hbEl('ct-mode-group'), 'data-ct-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：三角形兩邊中點連線段平行第三邊，長度是第三邊的一半
   ========================================================================== */
function initMidCanvas() {
  const cv = hbEl('canvas-mid');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sab = hbEl('md-ab'), sac = hbEl('md-ac'), sbc = hbEl('md-bc');
  const out = hbEl('md-formula'), fb = hbEl('md-feedback');
  const C0 = DK_TONE[5];
  const d1 = v => (Math.round(v * 10) / 10).toFixed(1);
  let mode = 'one';

  function draw() {
    const W = cv.width, H = cv.height;
    const ab = hbIv(sab), ac = hbIv(sac), bc = hbIv(sbc);
    hbEl('md-vab').textContent = ab;
    hbEl('md-vac').textContent = ac;
    hbEl('md-vbc').textContent = bc;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, mode === 'one' ? '兩邊中點的連線段' : '一層一層取中點', C0);
    const T3 = prTriSides(ab, ac, bc, { x: 110, y: 64, w: 320, h: 214 });
    if (!T3) {
      hbFitLine(ctx, `AB = ${ab}、AC = ${ac}、BC = ${bc} 圍不成三角形`, 200, DK_NO, 18);
      hbFitLine(ctx, '任兩邊的和一定要大於第三邊', 240, DK_NO, 16);
      hbFitLine(ctx, '把較短的兩邊調長，或把最長的那一邊調短', 280, MUTED, 15);
      out.innerHTML = '三邊圍不成三角形（情境不成立）';
      fb.innerHTML = wrapFeedback(`\\(${ab}\\)、\\(${ac}\\)、\\(${bc}\\) 之中，較短兩邊的和沒有大於最長邊，畫不出三角形。`);
      typeset([out, fb]);
      return;
    }
    const { A, B, C } = T3;
    const G = hbCentroid([A, B, C]);
    hbPoly(ctx, [A, B, C], DK_IVORY, 0.04, 2.6);
    hbVLabel(ctx, A, G, 'A', DK_IVORY, 18);
    hbVLabel(ctx, B, G, 'B', DK_IVORY, 18);
    hbVLabel(ctx, C, G, 'C', DK_IVORY, 18);
    hbSideLabel(ctx, B, C, G, String(bc), DK_BLUE, 18, f(800, 15));
    const half = v => qOf(v, 2);
    if (mode === 'one') {
      const D = prLerp(A, B, 0.5), E = prLerp(A, C, 0.5);
      hbPoly(ctx, [A, D, E], C0, 0.18, 0.01);
      hbSeg(ctx, D, E, DK_GREEN, 3.4);
      prParMark(ctx, D, E, B, C, DK_MUSTARD);
      hbTick(ctx, A, D, 1, DK_SEPIA); hbTick(ctx, D, B, 1, DK_SEPIA);
      hbTick(ctx, A, E, 2, DK_SEPIA); hbTick(ctx, E, C, 2, DK_SEPIA);
      prPtLab(ctx, D, A, B, G, 'D', DK_IVORY, 17);
      prPtLab(ctx, E, A, C, G, 'E', DK_IVORY, 17);
      prSideIt(ctx, A, D, G, qIt(half(ab), C0), C0, 26, 14);
      prSideIt(ctx, D, B, G, qIt(half(ab), DK_SEPIA), DK_SEPIA, 26, 14);
      prSideIt(ctx, A, E, G, qIt(half(ac), C0), C0, 26, 14);
      prSideIt(ctx, E, C, G, qIt(half(ac), DK_SEPIA), DK_SEPIA, 26, 14);
      drawExpr(ctx, [qIt(half(bc), DK_GREEN)], (D.x + E.x) / 2, D.y + 20, 15, DK_GREEN, { gap: 0 });
      prRow(ctx, 326, [T('D、E 是中點 ⇒ DE // BC，DE = ', DK_GREEN), FR(1, 2, DK_GREEN), T(` × ${bc} = `, DK_GREEN), qIt(half(bc), DK_GREEN)], 17);
      prRow(ctx, 370, [T('△ADE 周長 = ', C0), FR(1, 2, C0), T(` × △ABC 周長 = `, C0), FR(1, 2, C0), T(` × ${ab + ac + bc} = `, C0), qIt(half(ab + ac + bc), C0)], 16);
      hbFitLine(ctx, `量一量：DE ÷ BC ≈ ${prDec(hbDist(D, E) / hbDist(B, C))}，∠ADE ≈ ${d1(hbAngleDeg(D, A, E))}°，∠B ≈ ${d1(hbAngleDeg(B, A, C))}°`, 418, MUTED, 14);
      hbFitLine(ctx, '△ADE 的三邊都是 △ABC 對應邊的一半', 448, MUTED, 13.5);
      out.innerHTML = wbrEq(`\\overline{DE} = \\frac{1}{2}\\overline{BC} = ${qTex(half(bc))}`) + '，△ADE 周長' +
        wbrEq(`= ${qTex(half(ab))} + ${qTex(half(ac))} + ${qTex(half(bc))} = ${qTex(half(ab + ac + bc))}`);
      fb.innerHTML = wrapFeedback(wbrEq('\\overline{AD} : \\overline{DB} = \\overline{AE} : \\overline{EC} = 1 : 1') + '，所以 \\(\\overline{DE} /\\!/ \\overline{BC}\\)；再由 ' + wbrEq('\\overline{DE} : \\overline{BC} = \\overline{AD} : \\overline{AB} = 1 : 2') + '，得 \\(\\overline{DE} = \\frac{1}{2}\\overline{BC}\\)。');
    } else {
      const lv = [[0.5, 'D', 'E'], [0.25, 'F', 'G'], [0.125, 'P', 'Q']];
      const lens = [half(bc), qOf(bc, 4), qOf(bc, 8)];
      lv.forEach(([t, n1, n2], i) => {
        const L = prLerp(A, B, t), R = prLerp(A, C, t);
        hbSeg(ctx, L, R, [DK_GREEN, C0, DK_MUSTARD][i], 3);
        prPtLab(ctx, L, A, B, G, n1, DK_IVORY, 15);
        prPtLab(ctx, R, A, C, G, n2, DK_IVORY, 15);
      });
      prRow(ctx, 326, [T('D、E 是 AB、AC 的中點；F、G 是 AD、AE 的中點；P、Q 是 AF、AG 的中點', MUTED)], 13);
      prRow(ctx, 366, [T('DE = ', DK_GREEN), qIt(lens[0], DK_GREEN), T('，FG = ', C0), qIt(lens[1], C0), T('，PQ = ', DK_MUSTARD), qIt(lens[2], DK_MUSTARD)], 17);
      hbFitLine(ctx, '每往上一層，又是一個三角形的兩邊中點連線段：長度變成下一層的一半', 410, MUTED, 13.5);
      hbFitLine(ctx, `由下往上：${bc} → ${numStr(bc / 2)} → ${numStr(bc / 4)} → ${numStr(bc / 8)}`, 442, DK_IVORY, 15);
      out.innerHTML = wbrEq(`\\overline{DE} = ${qTex(lens[0])}`) + '、<wbr>' + wbrEq(`\\overline{FG} = ${qTex(lens[1])}`) + '、<wbr>' + wbrEq(`\\overline{PQ} = ${qTex(lens[2])}`);
      fb.innerHTML = wrapFeedback('\\(\\overline{FG}\\) 是 \\(\\triangle ADE\\) 的兩邊中點連線段，所以 \\(\\overline{FG} = \\frac{1}{2}\\overline{DE}\\)；每一層都<strong>再用一次</strong>中點連線段性質。');
    }
    typeset([out, fb]);
  }

  [sab, sac, sbc].forEach(x => x.addEventListener('input', draw));
  bindPickGroup(hbEl('md-mode-group'), 'data-md-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：過一邊中點作另一邊的平行線，會通過第三邊的中點
   B(0, 0)、C(12, 0)、A(5 + s, 8)；過 AB 中點 D 畫一條傾斜 t° 的直線
   ========================================================================== */
function initConvCanvas() {
  const cv = hbEl('canvas-conv');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const st = hbEl('cv-t'), ss = hbEl('cv-s');
  const out = hbEl('cv-formula'), fb = hbEl('cv-feedback');
  const C0 = DK_TONE[6];

  function draw() {
    const W = cv.width, H = cv.height;
    const t = hbIv(st), s = hbIv(ss);
    hbEl('cv-vt').textContent = `${t}°`;
    hbEl('cv-vs').textContent = s;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '過 AB 的中點 D 畫一條直線', C0);
    const p = hbFit([hbV(5 + s, -8), hbV(0, 0), hbV(12, 0)], { x: 110, y: 62, w: 320, h: 218 });
    const [A, B, C] = p;
    const G = hbCentroid(p);
    const D = prLerp(A, B, 0.5);
    const dir = hbUnit(t);
    const E = cgLL(D, hbV(D.x + dir.x, D.y + dir.y), A, C);
    const par = t === 0;
    const col = par ? DK_OK : DK_NO;
    hbSeg(ctx, hbV(D.x - dir.x * 120, D.y - dir.y * 120), hbV(D.x + dir.x * 440, D.y + dir.y * 440), DK_FAINT, 1.4, [6, 5]);
    hbPoly(ctx, [A, B, C], DK_IVORY, 0.04, 2.6);
    hbSeg(ctx, D, E, col, 3.4);
    if (par) prParMark(ctx, D, E, B, C, DK_MUSTARD);
    hbTick(ctx, A, D, 1, DK_SEPIA);
    hbTick(ctx, D, B, 1, DK_SEPIA);
    if (par) { hbTick(ctx, A, E, 2, DK_OK); hbTick(ctx, E, C, 2, DK_OK); }
    hbVLabel(ctx, A, G, 'A', DK_IVORY, 18);
    hbVLabel(ctx, B, G, 'B', DK_IVORY, 18);
    hbVLabel(ctx, C, G, 'C', DK_IVORY, 18);
    prPtLab(ctx, D, A, B, G, 'D', DK_IVORY, 17);
    prPtLab(ctx, E, A, C, G, 'E', col, 17);
    hbSideLabel(ctx, B, C, G, '12', DK_BLUE, 18, f(800, 15));
    const rAE = hbDist(A, E) / hbDist(E, C);
    hbFitLine(ctx, 'D 是 AB 的中點：AD : DB = 1 : 1', 326, DK_SEPIA, 15.5);
    if (par) {
      hbFitLine(ctx, 'DE // BC ⇒ AE : EC = AD : DB = 1 : 1，E 是 AC 的中點', 360, DK_OK, 16);
      prRow(ctx, 396, [T('DE = ', DK_GREEN), FR(1, 2, DK_GREEN), T(' × BC = ', DK_GREEN), FR(1, 2, DK_GREEN), T(' × 12 = 6', DK_GREEN)], 17);
    } else {
      hbFitLine(ctx, `這條線和 BC 不平行（斜了 ${Math.abs(t)}°）`, 360, DK_NO, 16);
      hbFitLine(ctx, 'E 沒有落在 AC 的中點', 394, DK_NO, 15.5);
    }
    hbFitLine(ctx, `量一量：AE ÷ EC ≈ ${prDec(rAE)}`, 432, MUTED, 14.5);
    if (par) {
      out.innerHTML = wbrEq('\\overline{AE} : \\overline{EC} = \\overline{AD} : \\overline{DB} = 1 : 1') + '，' +
        wbrEq('\\overline{DE} = \\frac{1}{2}\\overline{BC} = 6');
    } else {
      out.innerHTML = `直線不平行 \\(\\overline{BC}\\)：量到 \\(\\overline{AE} \\div \\overline{EC} \\approx ${prDec(rAE)}\\)`;
    }
    fb.innerHTML = wrapFeedback(par
      ? '過一邊中點、平行另一邊的直線，<strong>一定通過第三邊的中點</strong>，所以 \\(\\overline{DE}\\) 也是兩邊中點連線段。'
      : '把傾斜調回 \\(0^\\circ\\)（和 \\(\\overline{BC}\\) 平行），\\(E\\) 才會剛好落在中點。');
    typeset([out, fb]);
  }

  [st, ss].forEach(x => x.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：L1 // L2 // L3 截兩條截線，截出的線段成比例
   ========================================================================== */
function initThreeCanvas() {
  const cv = hbEl('canvas-three');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const s1 = hbEl('th-g1'), s2 = hbEl('th-g2'), s3 = hbEl('th-t1'), s4 = hbEl('th-t2');
  const out = hbEl('th-formula'), fb = hbEl('th-feedback');
  const C0 = DK_TONE[7];
  let mode = 'show';

  function draw() {
    const W = cv.width, H = cv.height;
    const g1 = hbIv(s1), g2 = hbIv(s2), t1 = hbIv(s3), t2 = hbIv(s4);
    hbEl('th-vg1').textContent = g1;
    hbEl('th-vg2').textContent = g2;
    hbEl('th-vt1').textContent = `${t1}°`;
    hbEl('th-vt2').textContent = `${t2}°`;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, mode === 'show' ? '三條平行線截兩條截線' : '為什麼？連 AF 借兩個三角形', C0);
    const y1 = 72, y3 = 286, u = (y3 - y1) / (g1 + g2), y2 = y1 + g1 * u;
    const ym = (y1 + y3) / 2;
    const m1 = y => 170 + Math.tan(t1 * HB_RAD) * (y - ym);
    const m2 = y => 372 + Math.tan(t2 * HB_RAD) * (y - ym);
    const A = hbV(m1(y1), y1), B = hbV(m1(y2), y2), C = hbV(m1(y3), y3);
    const D = hbV(m2(y1), y1), E = hbV(m2(y2), y2), F = hbV(m2(y3), y3);
    [y1, y2, y3].forEach((y, i) => {
      hbSeg(ctx, hbV(20, y), hbV(W - 50, y), DK_IVORY, 2.2);
      subLabel(ctx, 'L', String(i + 1), W - 32, y, DK_IVORY, 16);
    });
    if (mode === 'proof') {
      hbPoly(ctx, [A, C, F], DK_BLUE, 0.14, 0.01);
      hbPoly(ctx, [A, F, D], DK_RED_LT, 0.14, 0.01);
    }
    hbSeg(ctx, hbBeyond(C, A, 22), hbBeyond(A, C, 22), DK_BLUE, 2.4);
    hbSeg(ctx, hbBeyond(F, D, 22), hbBeyond(D, F, 22), DK_RED_LT, 2.4);
    hbSeg(ctx, A, B, C0, 5); hbSeg(ctx, B, C, DK_SEPIA, 5);
    hbSeg(ctx, D, E, C0, 5); hbSeg(ctx, E, F, DK_SEPIA, 5);
    subLabel(ctx, 'M', '1', hbBeyond(A, C, 22).x - 20, hbBeyond(A, C, 22).y - 4, DK_BLUE, 15);
    subLabel(ctx, 'M', '2', hbBeyond(D, F, 22).x + 20, hbBeyond(D, F, 22).y - 4, DK_RED_LT, 15);
    let I = null;
    if (mode === 'proof') {
      hbSeg(ctx, A, F, DK_MUSTARD, 2.4, [6, 5]);
      I = cgLL(A, F, hbV(0, y2), hbV(W, y2));
      cgDot(ctx, I, DK_MUSTARD);
      cgLabel(ctx, I, 'I', DK_MUSTARD, 0, -16, fi(800, 17));
    }
    [['A', A], ['B', B], ['C', C]].forEach(([n, P]) => cgLabel(ctx, P, n, DK_IVORY, -14, -14, fi(800, 17)));
    [['D', D], ['E', E], ['F', F]].forEach(([n, P]) => cgLabel(ctx, P, n, DK_IVORY, 14, -14, fi(800, 17)));
    [A, B, C, D, E, F].forEach(P => cgDot(ctx, P, DK_IVORY));
    const L = (P, Q) => hbDist(P, Q) / u;
    if (mode === 'show') {
      hbFitLine(ctx, `AB ≈ ${prDec(L(A, B))}，BC ≈ ${prDec(L(B, C))}，AB ÷ BC ≈ ${prDec(L(A, B) / L(B, C))}`, 326, C0, 15);
      hbFitLine(ctx, `DE ≈ ${prDec(L(D, E))}，EF ≈ ${prDec(L(E, F))}，DE ÷ EF ≈ ${prDec(L(D, E) / L(E, F))}`, 356, C0, 15);
      hbFitLine(ctx, `AB : BC = DE : EF = ${prRatioEq(g1, g2)}`, 394, DK_IVORY, 17);
      hbFitLine(ctx, '兩條截線怎麼斜都一樣：比只由平行線的間距決定', 430, MUTED, 14);
    } else {
      prRow(ctx, 322, exprItems('連 AF，交 L_2 於 I', DK_MUSTARD), 15);
      prRow(ctx, 352, exprItems('△ACF 中，BI // CF ⇒ AB : BC = AI : IF', DK_BLUE), 15);
      prRow(ctx, 382, exprItems('△AFD 中，IE // AD ⇒ DE : EF = AI : IF', DK_RED_LT), 15);
      hbFitLine(ctx, `所以 AB : BC = DE : EF = ${prRatio(g1, g2)}`, 418, DK_IVORY, 17);
      hbFitLine(ctx, `量一量：AI ÷ IF ≈ ${prDec(hbDist(A, I) / hbDist(I, F))}`, 448, MUTED, 14);
    }
    out.innerHTML = wbrEq(`\\overline{AB} : \\overline{BC} = \\overline{DE} : \\overline{EF} = ${prRatioEq(g1, g2)}`);
    fb.innerHTML = wrapFeedback(mode === 'show'
      ? '\\(L_1 /\\!/ L_2 /\\!/ L_3\\) 時，兩條截線被截出的線段<strong>成比例</strong>；截線傾斜只改變長度，不改變比。'
      : '對角線 \\(\\overline{AF}\\) 把圖分成兩個三角形，每一個都用一次平行線截比例線段性質，兩個比都等於 \\(\\overline{AI} : \\overline{IF}\\)。');
    typeset([out, fb]);
  }

  [s1, s2, s3, s4].forEach(x => x.addEventListener('input', draw));
  bindPickGroup(hbEl('th-mode-group'), 'data-th-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：梯形中的平行線段 EF
   B(0, 0)、C(b, 0)、A(xa, 5)、D(xa + a, 5)；AE : EB = m : n
   ========================================================================== */
function initTrapCanvas() {
  const cv = hbEl('canvas-trap');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sm = hbEl('tp-m'), sn = hbEl('tp-n'), sa = hbEl('tp-a'), sb = hbEl('tp-b');
  const out = hbEl('tp-formula'), fb = hbEl('tp-feedback');
  const C0 = DK_TONE[8];
  let mode = 'diag';

  function draw() {
    const W = cv.width, H = cv.height;
    const m = hbIv(sm), n = hbIv(sn), a = hbIv(sa);
    const b = hbClampSlider(sb, a + 2, 14);
    hbEl('tp-vm').textContent = m;
    hbEl('tp-vn').textContent = n;
    hbEl('tp-va').textContent = a;
    hbEl('tp-vb').textContent = b;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, mode === 'diag' ? '方法一：連對角線 AC' : '方法二：作 DN // AB', C0);
    const xa = (b - a) * 0.3;
    const p = hbFit([hbV(xa, -5), hbV(0, 0), hbV(b, 0), hbV(xa + a, -5)], { x: 80, y: 66, w: 380, h: 206 });
    const [A, B, C, D] = p;
    const sc = hbDist(B, C) / b;
    const G0 = hbCentroid(p);
    const tt = m / (m + n);
    const E = prLerp(A, B, tt), F = prLerp(D, C, tt);
    const EF = qOf(n * a + m * b, m + n);
    hbPoly(ctx, p, DK_IVORY, 0.04, 2.6);
    hbVLabel(ctx, A, G0, 'A', DK_IVORY, 18);
    hbVLabel(ctx, B, G0, 'B', DK_IVORY, 18);
    hbVLabel(ctx, C, G0, 'C', DK_IVORY, 18);
    hbVLabel(ctx, D, G0, 'D', DK_IVORY, 18);
    hbSideLabel(ctx, A, D, G0, String(a), DK_SEPIA, 16, f(800, 15));
    hbSideLabel(ctx, B, C, G0, String(b), DK_SEPIA, 16, f(800, 15));
    prPtLab(ctx, E, A, B, G0, 'E', DK_IVORY, 17);
    prPtLab(ctx, F, D, C, G0, 'F', DK_IVORY, 17);
    hbSideLabel(ctx, A, E, G0, String(m), C0, 30, f(800, 13));
    hbSideLabel(ctx, E, B, G0, String(n), C0, 30, f(800, 13));
    if (mode === 'diag') {
      const EG = qOf(b * m, m + n), GF = qOf(a * n, m + n);
      const Gp = cgLL(A, C, E, F);
      hbSeg(ctx, A, C, DK_MUSTARD, 2, [6, 5]);
      hbSeg(ctx, E, Gp, DK_BLUE, 4);
      hbSeg(ctx, Gp, F, DK_RED_LT, 4);
      cgDot(ctx, Gp, DK_MUSTARD);
      cgLabel(ctx, Gp, 'G', DK_MUSTARD, 0, 18, fi(800, 16));
      drawExpr(ctx, [qIt(EG, DK_BLUE)], (E.x + Gp.x) / 2, E.y - 18, 14, DK_BLUE, { gap: 0 });
      drawExpr(ctx, [qIt(GF, DK_RED_LT)], (Gp.x + F.x) / 2, E.y - 18, 14, DK_RED_LT, { gap: 0 });
      hbFitLine(ctx, `AD // EF // BC，AE : EB = DF : FC = ${prRatioEq(m, n)}`, 316, C0, 15);
      prRow(ctx, 350, [T('△ABC 中，EG = ', DK_BLUE), qIt(qOf(m, m + n), DK_BLUE), T(' × BC = ', DK_BLUE), qIt(EG, DK_BLUE)], 16);
      prRow(ctx, 390, [T('△CAD 中，GF = ', DK_RED_LT), qIt(qOf(n, m + n), DK_RED_LT), T(' × AD = ', DK_RED_LT), qIt(GF, DK_RED_LT)], 16);
      prRow(ctx, 430, [T('EF = EG + GF = ', DK_IVORY), qIt(EF, DK_IVORY), T(`（量一量 ≈ ${prDec(hbDist(E, F) / sc)}）`, MUTED)], 16);
      out.innerHTML = wbrEq(`\\overline{EF} = \\overline{EG} + \\overline{GF} = ${qTex(EG)} + ${qTex(GF)} = ${qTex(EF)}`);
      fb.innerHTML = wrapFeedback('對角線把梯形切成兩個三角形：\\(\\overline{EG}\\) 在 \\(\\triangle ABC\\) 裡配 \\(\\overline{BC}\\)，\\(\\overline{GF}\\) 在 \\(\\triangle CAD\\) 裡配 \\(\\overline{AD}\\)，<strong>兩段的比不一樣</strong>（一個是上段、一個是下段）。');
    } else {
      const N = hbV(D.x + (B.x - A.x), D.y + (B.y - A.y));
      const M = cgLL(D, N, E, F);
      const MF = qOf((b - a) * m, m + n);
      hbPoly(ctx, [A, E, M, D], DK_SEPIA, 0.1, 0.01);
      hbPoly(ctx, [E, B, N, M], DK_SEPIA, 0.1, 0.01);
      hbSeg(ctx, D, N, DK_MUSTARD, 2, [6, 5]);
      hbSeg(ctx, E, M, DK_BLUE, 4);
      hbSeg(ctx, M, F, DK_RED_LT, 4);
      cgDot(ctx, M, DK_MUSTARD); cgDot(ctx, N, DK_MUSTARD);
      cgLabel(ctx, M, 'M', DK_MUSTARD, -12, 16, fi(800, 16));
      cgLabel(ctx, N, 'N', DK_MUSTARD, 0, 18, fi(800, 16));
      drawExpr(ctx, [T(String(a), DK_BLUE)], (E.x + M.x) / 2, E.y - 16, 14, DK_BLUE, { gap: 0 });
      drawExpr(ctx, [qIt(MF, DK_RED_LT)], (M.x + F.x) / 2, E.y - 18, 14, DK_RED_LT, { gap: 0 });
      hbFitLine(ctx, `AEMD、EBNM 是平行四邊形：EM = BN = AD = ${a}，NC = ${b} − ${a} = ${b - a}`, 316, DK_BLUE, 14.5);
      prRow(ctx, 352, [T('△DNC 中，MF = ', DK_RED_LT), qIt(qOf(m, m + n), DK_RED_LT), T(' × NC = ', DK_RED_LT), qIt(MF, DK_RED_LT)], 16);
      prRow(ctx, 392, [T(`EF = EM + MF = ${a} + `, DK_IVORY), qIt(MF, DK_IVORY), T(' = ', DK_IVORY), qIt(EF, DK_IVORY)], 16);
      hbFitLine(ctx, `量一量：EF ≈ ${prDec(hbDist(E, F) / sc)}`, 432, MUTED, 14);
      out.innerHTML = wbrEq(`\\overline{EF} = \\overline{EM} + \\overline{MF} = ${a} + ${qTex(MF)} = ${qTex(EF)}`);
      fb.innerHTML = wrapFeedback('先把上底 \\(\\overline{AD}\\) 平移下來，剩下的 \\(\\triangle DNC\\) 再用平行線截比例線段性質。兩種方法算出來<strong>一樣</strong>。');
    }
    typeset([out, fb]);
  }

  [sm, sn, sa, sb].forEach(x => x.addEventListener('input', draw));
  bindPickGroup(hbEl('tp-mode-group'), 'data-tp-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：落在平行線上的線段不能直接列比例——先作平行線平移
   L1、L2、L3 水平；AB = u、BC = v（M1 上），AD = d、BE = d + k
   ========================================================================== */
function initShiftCanvas() {
  const cv = hbEl('canvas-shift');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const su = hbEl('sh-u'), sv = hbEl('sh-v'), sd = hbEl('sh-d'), sk = hbEl('sh-k');
  const out = hbEl('sh-formula'), fb = hbEl('sh-feedback');
  const C0 = DK_TONE[9];
  let mode = 'right';

  function draw() {
    const W = cv.width, H = cv.height;
    const u = hbIv(su), v = hbIv(sv), d = hbIv(sd), k = hbIv(sk);
    hbEl('sh-vu').textContent = u;
    hbEl('sh-vv').textContent = v;
    hbEl('sh-vd').textContent = d;
    hbEl('sh-vk').textContent = d + k;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, mode === 'right' ? '正確做法：過 A 作 M2 的平行線 M3' : '錯誤做法：把 BE、CF 直接配比例', C0);
    const CH = qOf(k * (u + v), u);
    const CF = qAdd(CH, d);
    const wrong = qOf((d + k) * (u + v), u);
    const y1 = 74, y3 = 286, y2 = y1 + (y3 - y1) * u / (u + v);
    const s = Math.min(26, 380 / (qVal(CF) + 2));
    const m1 = y => 58 + 0.12 * (y - y1);
    const A = hbV(m1(y1), y1), B = hbV(m1(y2), y2), C = hbV(m1(y3), y3);
    const D = hbV(A.x + d * s, y1), E = hbV(B.x + (d + k) * s, y2), F = hbV(C.x + qVal(CF) * s, y3);
    [y1, y2, y3].forEach((y, i) => {
      hbSeg(ctx, hbV(16, y), hbV(W - 46, y), DK_FAINT, 1.8);
      subLabel(ctx, 'L', String(i + 1), W - 30, y, DK_IVORY, 15);
    });
    hbSeg(ctx, hbBeyond(C, A, 20), hbBeyond(A, C, 20), DK_BLUE, 2.4);
    hbSeg(ctx, hbBeyond(F, D, 20), hbBeyond(D, F, 20), DK_RED_LT, 2.4);
    subLabel(ctx, 'M', '1', hbBeyond(A, C, 20).x + 14, hbBeyond(A, C, 20).y + 4, DK_BLUE, 14);
    subLabel(ctx, 'M', '2', hbBeyond(D, F, 20).x + 16, hbBeyond(D, F, 20).y + 4, DK_RED_LT, 14);
    hbSeg(ctx, A, D, DK_GREEN, 3.4);
    hbSeg(ctx, B, E, DK_GREEN, 3.4);
    hbSeg(ctx, C, F, DK_GREEN, 3.4);
    cgLabel(ctx, prLerp(A, B, 0.5), String(u), DK_BLUE, -16, 0, f(800, 14));
    cgLabel(ctx, prLerp(B, C, 0.5), String(v), DK_BLUE, -16, 0, f(800, 14));
    cgLabel(ctx, prLerp(A, D, 0.5), String(d), DK_GREEN, 0, -13, f(800, 14));
    cgLabel(ctx, prLerp(B, E, 0.5), String(d + k), DK_GREEN, 0, -13, f(800, 14));
    if (mode === 'right') {
      const Gp = hbV(A.x + (E.x - D.x), y2), Hp = hbV(A.x + (F.x - D.x), y3);
      hbPoly(ctx, [A, Gp, E, D], DK_SEPIA, 0.12, 0.01);
      hbPoly(ctx, [Gp, Hp, F, E], DK_SEPIA, 0.12, 0.01);
      hbSeg(ctx, A, hbBeyond(A, Hp, 14), DK_MUSTARD, 2.2, [6, 5]);
      hbSeg(ctx, B, Gp, C0, 4.4);
      hbSeg(ctx, C, Hp, C0, 4.4);
      cgDot(ctx, Gp, DK_MUSTARD); cgDot(ctx, Hp, DK_MUSTARD);
      cgLabel(ctx, Gp, 'G', DK_MUSTARD, 0, 16, fi(800, 15));
      cgLabel(ctx, Hp, 'H', DK_MUSTARD, 0, 16, fi(800, 15));
      drawExpr(ctx, [qIt(CF, DK_GREEN)], (C.x + F.x) / 2, y3 + 22, 14, DK_GREEN, { gap: 0 });
      prRow(ctx, 330, exprItems(`AGED、GHFE 是平行四邊形：GE = HF = AD = ${d}`, DK_SEPIA), 14.5);
      prRow(ctx, 360, [T(`BG = BE − GE = ${d + k} − ${d} = ${k}`, C0)], 15);
      prRow(ctx, 396, [T('△ACH 中 BG // CH：AB : AC = BG : CH ⇒ CH = ', C0), qIt(CH, C0)], 15);
      prRow(ctx, 436, [T('CF = CH + HF = ', DK_GREEN), qIt(CH, DK_GREEN), T(` + ${d} = `, DK_GREEN), qIt(CF, DK_GREEN)], 16);
      out.innerHTML = wbrEq(`\\overline{CF} = \\overline{CH} + \\overline{HF} = ${qTex(CH)} + ${d} = ${qTex(CF)}`);
      fb.innerHTML = wrapFeedback('先把 \\(\\overline{AD}\\) 平移下來扣掉，剩下的 \\(\\overline{BG}\\)、\\(\\overline{CH}\\) 才是被平行線截在 \\(\\triangle ACH\\) 裡的線段，<strong>才能列比例</strong>。');
    } else {
      const Fw = hbV(C.x + qVal(wrong) * s, y3);
      if (Fw.x < W - 16) {
        hbSeg(ctx, F, Fw, DK_NO, 3, [6, 4]);
        cgDot(ctx, Fw, DK_NO);
        cgLabel(ctx, Fw, "F'", DK_NO, 0, 18, fi(800, 15));
      }
      prRow(ctx, 330, [T('錯：AB : AC = BE : CF ⇒ CF = ', DK_NO), qIt(wrong, DK_NO)], 15.5);
      hbFitLine(ctx, 'BE、CF 是落在平行線上的線段，不是被平行線截出來的，這個比例式不成立', 366, DK_NO, 13.5);
      prRow(ctx, 402, [T('實際上 CF = ', DK_GREEN), qIt(CF, DK_GREEN), T('：D、E、F 要在同一條直線上', DK_GREEN)], 15);
      hbFitLine(ctx, Fw.x < W - 16 ? "紅色的 F' 和 D、E 不在同一條直線上" : "錯的答案太長，F' 已經跑出畫面了", 438, MUTED, 14);
      out.innerHTML = '錯：' + wbrEq(`\\overline{CF} = ${d + k} \\times ${qTex(qOf(u + v, u))} = ${qTex(wrong)}`) +
        '；正確：' + wbrEq(`\\overline{CF} = ${qTex(CF)}`);
      fb.innerHTML = wrapFeedback('平行線截比例線段性質講的是「截線被截出的線段」，\\(\\overline{AD}\\)、\\(\\overline{BE}\\)、\\(\\overline{CF}\\) 不在截線上，<strong>不能直接配比例</strong>。切到「正確做法」看怎麼平移。');
    }
    [['A', A], ['B', B], ['C', C]].forEach(([nm, P]) => cgLabel(ctx, P, nm, DK_IVORY, -14, -13, fi(800, 16)));
    [['D', D], ['E', E], ['F', F]].forEach(([nm, P]) => cgLabel(ctx, P, nm, DK_IVORY, 13, -13, fi(800, 16)));
    typeset([out, fb]);
  }

  [su, sv, sd, sk].forEach(x => x.addEventListener('input', draw));
  bindPickGroup(hbEl('sh-mode-group'), 'data-sh-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 11：尺規作圖作比例線段（在 AB 上找 C，使 AC : CB = m : n）
   ========================================================================== */
function initBuildCanvas() {
  const cv = hbEl('canvas-build');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sm = hbEl('bd-m'), sn = hbEl('bd-n');
  const out = hbEl('bd-formula'), fb = hbEl('bd-feedback');
  const C0 = DK_TONE[10];
  const st = { k: 1 };

  function draw() {
    const m = hbIv(sm), n = hbIv(sn);
    hbEl('bd-vm').textContent = m;
    hbEl('bd-vn').textContent = n;
    const N = m + n;
    const A = hbV(56, 360), B = hbV(484, 360);
    const u = hbV(Math.cos(-36 * HB_RAD), Math.sin(-36 * HB_RAD));
    const r = Math.min(100, 330 / N);
    const P = i => hbV(A.x + u.x * r * i, A.y + u.y * r * i);
    const D = P(m), E = P(N);
    const R = Math.min(38, r * 0.6);
    const ue = cgUnit(E, B);
    const X = hbV(E.x - u.x * R, E.y - u.y * R), Y = hbV(E.x + ue.x * R, E.y + ue.y * R);
    const X2 = hbV(D.x - u.x * R, D.y - u.y * R), Y2 = hbV(D.x + ue.x * R, D.y + ue.y * R);
    const C = cgLL(D, Y2, A, B);
    const rXY = cgDist(X, Y);
    const Lend = P(N + 1.3);
    const given = c => {
      hbSeg(c, A, B, DK_IVORY, 3);
    };
    const steps = [
      { tool: 'ruler', text: '過 A 任意畫一條射線 L（不要與 AB 重合）。', ruler: [A, Lend], draw: () => {
        cgSeg(ctx, A, Lend, DK_SEPIA, 2.4);
        cgLabel(ctx, Lend, 'L', DK_SEPIA, 12, -10, fi(800, 17));
      } },
      { tool: 'compass', text: `圓規張開固定長度，從 A 起在 L 上連續截 ${N} 段等長；第 ${m} 個點記為 D、第 ${N} 個點記為 E。`,
        compass: { c: P(N - 1), r, ang: cgAng(P(N - 1), E) }, draw: () => {
          for (let i = 1; i <= N; i++) {
            cgArcDir(ctx, P(i - 1), r, cgAng(A, E), 0.22, DK_MUSTARD, 2);
            cgDot(ctx, P(i), i === m || i === N ? DK_IVORY : DK_SEPIA);
          }
        } },
      { tool: 'ruler', text: '連接 B、E。', ruler: [E, B], draw: () => cgSeg(ctx, E, B, DK_BLUE, 2.6) },
      { tool: 'compass', text: '以 E 為圓心畫弧，交 EA、EB 於兩點；以 D 為圓心、同樣半徑畫弧，交 DA 於一點。',
        compass: { c: D, r: R, ang: cgAng(D, Y2) }, draw: () => {
          cgArcAt(ctx, E, R, [X, Y], 0.25, DK_MUSTARD, 2);
          cgArcAt(ctx, D, R, [X2, Y2], 0.35, DK_MUSTARD, 2);
          cgDot(ctx, X, DK_MUSTARD); cgDot(ctx, Y, DK_MUSTARD); cgDot(ctx, X2, DK_MUSTARD);
        } },
      { tool: 'compass', text: '圓規量 E 那段弧上兩交點的距離，以 D 弧與 DA 的交點為圓心畫弧，交出新的一點。',
        compass: { c: X2, r: rXY, ang: cgAng(X2, Y2) }, draw: () => {
          cgSeg(ctx, X, Y, DK_FAINT, 1.4, [4, 4]);
          cgArcAt(ctx, X2, rXY, [Y2], 0.35, DK_RED_LT, 2.2);
          cgDot(ctx, Y2, DK_RED_LT);
        } },
      { tool: 'ruler', text: '過 D 與新交點畫直線，交 AB 於 C：∠ADC = ∠AEB（同位角相等），所以 DC // EB。', ruler: [D, C], draw: () => {
        cgSeg(ctx, D, C, DK_GREEN, 2.8);
      } },
      { tool: 'look', text: `△ABE 中 DC // EB，所以 AC : CB = AD : DE = ${prRatioEq(m, n)}，C 點即為所求。`, draw: () => {
        cgSeg(ctx, A, C, C0, 5);
        cgSeg(ctx, C, B, DK_SEPIA, 5);
      } }
    ];
    const pts = [
      { p: A, n: 'A', s: 0, c: DK_IVORY, dx: -12, dy: 18 },
      { p: B, n: 'B', s: 0, c: DK_IVORY, dx: 10, dy: 18 },
      { p: D, n: 'D', s: 2, c: DK_IVORY, dx: -14, dy: -12 },
      { p: E, n: 'E', s: 2, c: DK_IVORY, dx: -14, dy: -12 },
      { p: C, n: 'C', s: 6, c: DK_GREEN, dx: 0, dy: 20 }
    ];
    cgSync('bd', st, steps.length);
    const ratio = hbDist(A, C) / hbDist(C, B);
    cgRender(ctx, {
      title: `在 AB 上找 C，使 AC : CB = ${m} : ${n}`, color: C0, k: st.k, steps, pts, given,
      measure: st.k === steps.length ? [`量一量：AC ÷ CB ≈ ${prDec(ratio)}，${m} ÷ ${n} ≈ ${prDec(m / n)}`, DK_OK] : null
    });
    out.innerHTML = st.k === steps.length
      ? wbrEq(`\\overline{AC} : \\overline{CB} = \\overline{AD} : \\overline{DE} = ${prRatioEq(m, n)}`) + '，' +
        wbrEq(`\\overline{AC} : \\overline{AB} = ${prRatioEq(m, N)}`)
      : `步驟 \\(${st.k}\\) / \\(${steps.length}\\)`;
    fb.innerHTML = wrapFeedback('在另一條射線上量出 \\(' + m + ' + ' + n + '\\) 段等長，再過第 \\(' + m + '\\) 個點作平行線：<strong>平行線截比例線段性質</strong>把 \\(L\\) 上的比原封不動搬到 \\(\\overline{AB}\\) 上。');
    typeset([out, fb]);
  }

  [sm, sn].forEach(x => x.addEventListener('input', draw));
  cgSteps('bd', st, draw);
  drawWithFonts(draw);
}
