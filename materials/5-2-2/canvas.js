/* ==========================================================================
   5-2-2（第五冊 2-2）圓心角、圓周角與弧的關係 — 互動 Canvas 與隨堂評量
   畫風：油性粉蠟筆・單車修理鋪（小輪、阿軸），第五冊第 2 章兩節共用。

   共用工具在 ../math-canvas.js（f／fi／drawTitle／wrapFeedback／wbrEq／typeset／
   bindPickGroup／drawWithFonts、q* 有理數、hb* 幾何、cg* 交點…）。

   本檔分四層：
     0. 本節色票（BK_，與 5-2-1 逐字相同）；
     1. 第 2 章的 bk 工具：圓工具已抽進共用檔，頁內只剩車輪輻條；
     2. 本節新寫的工具（cq 前綴）：圓上的點、不含某點的弧、角的標籤位置；
     3. 10 個互動與評量附圖。

   所有角度一律由「圓上各點的方向角（整數度）」精確推得：
   圓周角 = 不含頂點那段弧的一半，弧由 cqArcNot 以整數加減求出，
   畫面上的點則照方向角真的畫在圓上（驗收時由座標重量角度比對）。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();
  drawWithFonts(initQuizFigs);

  initDegCanvas();
  initChordCanvas();
  initInsCanvas();
  initSameCanvas();
  initCenCanvas();
  initSumCanvas();
  initSemiCanvas();
  initParCanvas();
  initQuadCanvas();
  initExtCanvas();
});

/* ==========================================================================
   0. 本節色票（粉蠟筆單車行：牛皮紙、車架青綠、番茄紅、奶油黃）
   ========================================================================== */
const BK_KRAFT = '#f2c879';
const BK_TEAL = '#2bb3a3';
const BK_TEAL_L = '#5fd4c4';
const BK_TOMATO = '#f0643c';
const BK_ROSE = '#ff9b7a';
const BK_CREAM = '#f6ecd6';
const BK_SKY = '#7cc4f0';
const BK_LIME = '#a6d96a';
const BK_PLUM = '#c9a0f0';
const BK_OK = '#86efac';
const BK_NO = '#fb7185';
const BK_FAINT = 'rgba(246, 236, 214, 0.28)';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const BK_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9', '#fca5a5', '#f0abfc'];

// 共用圓工具（bk*）的標籤底色與點外圈
bkUsePalette({ tagBg: 'rgba(14, 22, 24, 0.88)', rim: 'rgba(10, 18, 20, 0.9)' });

/* ==========================================================================
   1. 第 2 章的 bk 工具（其餘在共用檔）
   ========================================================================== */

// 淡淡的車輪輻條（只是情境，不是半徑記號）
function bkSpokes(ctx, C, R) {
  ctx.save();
  ctx.strokeStyle = 'rgba(246, 236, 214, 0.07)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 12; i++) {
    const P = hbAt(C, i * 30 + 15, R - 6);
    ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(P.x, P.y); ctx.stroke();
  }
  ctx.restore();
}

/* ==========================================================================
   2. 本節新寫的工具（cq 前綴）
   ========================================================================== */

// 角度正規化到 [0, 360)
function cqNorm(d) {
  return ((d % 360) + 360) % 360;
}

// 圓上從方向角 x 逆時針走到 y 的度數（0～360）
function cqCcw(x, y) {
  return cqNorm(y - x);
}

// 圓上兩點 x、y（方向角）之間「不含 z」的那一段弧的度數
function cqArcNot(x, y, z) {
  const s = cqCcw(x, y);
  const t = cqCcw(x, z);
  return (t > 0 && t < s) ? 360 - s : s;
}

// 同上，回傳 bkArc 用的 [a0, a1]（從 a0 逆時針走到 a1）
function cqArcSpan(x, y, z) {
  const s = cqCcw(x, y);
  const t = cqCcw(x, z);
  if (t > 0 && t < s) return [y, y + 360 - s];
  return [x, x + s];
}

// 弧的 LaTeX
function cqArcT(name) {
  return `\\overset{\\frown}{${name}}`;
}

// 角的標籤：放在 ∠PVQ（小於 180° 那一側）的角平分線上、距頂點 dist
function cqAngTag(ctx, V, P, Q, dist, text, color, size) {
  const a = hbHead(V, P), b = hbHead(V, Q);
  const d = cqNorm(b - a);
  const mid = d <= 180 ? a + d / 2 : b + (360 - d) / 2;
  const T0 = hbAt(V, mid, dist);
  bkTag(ctx, text, T0.x, T0.y, color, size || 13);
}

// 圓上的點名：沿半徑往外推（開發約束 18：字母一律在圖形外側）
function cqOutName(ctx, O, P, text, color, dist) {
  const d = hbDist(O, P) || 1;
  const k = dist || 17;
  dkName(ctx, hbV(P.x + (P.x - O.x) / d * k, P.y + (P.y - O.y) / d * k), text, color, 0, 0);
}

// 弧的度數標籤：放在弧的中點外側
function cqArcTag(ctx, O, R, a0, a1, text, color, off, size) {
  const P = hbAt(O, (a0 + a1) / 2, R + (off || 20));
  bkTag(ctx, text, P.x, P.y, color, size || 13);
}

// 依序在圓上的四點：從方向角 start 起逆時針，相鄰兩點夾 arcs[i] 度
function cqChain(start, arcs) {
  const out = [start];
  for (let i = 0; i < arcs.length - 1; i++) out.push(out[i] + arcs[i]);
  return out;
}

// 圓內接四邊形 ABCD：由 ∠BAD、∠ABC 決定四段弧（CD 取兩者較小的 1.4 倍，四段都 > 0）
//   ∠BAD = ½«BCD» → bc + cd = 2A；∠ABC = ½«ADC» → da + cd = 2B
//   兩組對邊延長（A + B < 180°）改用 k = 0.8，讓 B、C 拉開，E 不會擠在 B 旁邊
function cqQuadArcs(A, B, k) {
  const cd = (k || 1.4) * Math.min(A, B);
  const bc = 2 * A - cd, da = 2 * B - cd;
  return { ab: 360 - bc - cd - da, bc, cd, da };
}

// 依 cqQuadArcs 的弧，C 固定在方向角 350°：回傳四點的方向角
function cqQuadDeg(A, B, k) {
  const r = cqQuadArcs(A, B, k);
  const c = 350, b = c - r.bc, a = b - r.ab, d = c + r.cd;
  return { a, b, c, d };
}

// 單位圓上的圓內接四邊形與兩組對邊延長線的交點（AB、DC → E；AD、BC → F）
function cqExtGeom(A, B) {
  const g = cqQuadDeg(A, B, 0.8);
  const O = hbV(0, 0);
  const P = { O, A: hbAt(O, g.a, 1), B: hbAt(O, g.b, 1), C: hbAt(O, g.c, 1), D: hbAt(O, g.d, 1) };
  P.E = cgLL(P.A, P.B, P.D, P.C);
  P.F = cgLL(P.A, P.D, P.B, P.C);
  return P;
}

// 把一組點（含圓心 O 與圓）等比例放進 box，回傳新座標與縮放後的半徑
function cqFitAll(P, R, box) {
  const keys = Object.keys(P).filter(k => P[k]);
  const pts = keys.map(k => P[k]);
  const ring = [hbV(P.O.x + R, P.O.y), hbV(P.O.x - R, P.O.y), hbV(P.O.x, P.O.y + R), hbV(P.O.x, P.O.y - R)];
  const fit = hbFit(pts.concat(ring), box);
  const out = {};
  keys.forEach((k, i) => { out[k] = fit[i]; });
  const k0 = keys.length;
  out.R = hbDist(fit[k0], fit[k0 + 1]) / 2;
  return out;
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第五冊 2-2 的 20 題正解
  // 正解字母分布：A 5 題、B 5 題、C 5 題、D 5 題（開發約束 36）
  const answers = {
    '2-2-1': 'C',    // 圓心角 108°，內圈弧長 18π/5
    '2-2-2': 'A',    // 135°、21π/2
    '2-2-3': 'D',    // 正十二邊形 ∠AOE = 4 × 30° = 120°
    '2-2-4': 'B',    // 等弦對等弧：(360° − 76°) ÷ 2 = 142°
    '2-2-5': 'A',    // ∠BAC = 128° ÷ 2 = 64°
    '2-2-6': 'B',    // ∠ACB 是圓周角，對 «AB»
    '2-2-7': 'C',    // ∠BDC = 38°，∠BPC = 38° + 29° = 67°
    '2-2-8': 'D',    // ∠CAB、∠CDB 同對 «BC»
    '2-2-9': 'B',    // ∠ADC = (360° − 136°) ÷ 2 = 112°
    '2-2-10': 'A',   // ∠AOB = 128°，∠OAB = 26°
    '2-2-11': 'D',   // «BC» = 214° − 84° = 130°
    '2-2-12': 'C',   // ∠ABC = (105° + 135°) ÷ 2 = 120°
    '2-2-13': 'B',   // ∠ABC = 57°，«AC» = 114°
    '2-2-14': 'A',   // ∠OMP 對半圓，是直角
    '2-2-15': 'C',   // «CDB» = 180° + 58° = 238°
    '2-2-16': 'D',   // «AC» = «BD» = 82°
    '2-2-17': 'A',   // 5x + 10 = 180，∠C = 64°
    '2-2-18': 'D',   // 72°、108°、72°、108°：對角不互補
    '2-2-19': 'B',   // ∠DCE = ∠BAD = 118°
    '2-2-20': 'C'    // ∠E = 134° − 85° = 49°
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
   點一律照方向角真的畫在圓上，所以圖上的角度與題目一致。
   ========================================================================== */
function cqFigPts(ctx, O, R, deg, names, dist) {
  const P = {};
  Object.keys(deg).forEach(k => { P[k] = hbAt(O, deg[k], R); });
  if (names !== false) {
    Object.keys(P).forEach(k => {
      bkPt(ctx, P[k], BK_CREAM, 3.5);
      cqOutName(ctx, O, P[k], k, BK_CREAM, dist || 14);
    });
  }
  return P;
}

const CQ_QUIZ_FIGS = {
  // Q6：弦 AC、BD 交於圓內一點 E，∠AEB = 72°
  q6(ctx, W, H) {
    const O = hbV(W / 2, H / 2), R = 78;
    bkCircle(ctx, O, R, BK_CREAM, 2.2);
    const P = cqFigPts(ctx, O, R, { A: 150, B: 60, C: 330, D: 276 });
    const E = cgLL(P.A, P.C, P.B, P.D);
    hbSeg(ctx, P.A, P.C, BK_TOMATO, 2.2);
    hbSeg(ctx, P.B, P.D, BK_SKY, 2.2);
    dkAng(ctx, E, P.A, P.B, 16, BK_KRAFT);
    cqAngTag(ctx, E, P.A, P.B, 34, '72°', BK_KRAFT, 12);
    bkPt(ctx, E, BK_CREAM, 3.5);
    dkName(ctx, E, 'E', BK_CREAM, 4, 16);
  },

  // Q7：A、B、C、D 依序在圓上，AC 與 BD 交於 P；∠BAC = 38°、∠ACD = 29°
  q7(ctx, W, H) {
    const O = hbV(W / 2, H / 2), R = 80;
    bkCircle(ctx, O, R, BK_CREAM, 2.2);
    const P = cqFigPts(ctx, O, R, { A: 84, B: 200, C: 276, D: 26 });
    const X = cgLL(P.A, P.C, P.B, P.D);
    hbSeg(ctx, P.A, P.B, BK_CREAM, 2);
    hbSeg(ctx, P.C, P.D, BK_CREAM, 2);
    hbSeg(ctx, P.A, P.C, BK_TOMATO, 2.2);
    hbSeg(ctx, P.B, P.D, BK_SKY, 2.2);
    dkAng(ctx, P.A, P.B, P.C, 22, BK_KRAFT);
    cqAngTag(ctx, P.A, P.B, P.C, 38, '38°', BK_KRAFT, 12);
    dkAng(ctx, P.C, P.A, P.D, 22, BK_LIME);
    cqAngTag(ctx, P.C, P.A, P.D, 40, '29°', BK_LIME, 12);
    bkPt(ctx, X, BK_CREAM, 3.5);
    dkName(ctx, X, 'P', BK_CREAM, 13, 6);
  },

  // Q8：AC 是直徑，B、D 在圓上，BD 交 AC 於 E
  q8(ctx, W, H) {
    const O = hbV(W / 2, H / 2), R = 80;
    bkCircle(ctx, O, R, BK_CREAM, 2.2);
    const P = cqFigPts(ctx, O, R, { A: 180, B: 250, C: 0, D: 60 });
    const E = cgLL(P.A, P.C, P.B, P.D);
    hbSeg(ctx, P.A, P.C, BK_TOMATO, 2.2);
    hbSeg(ctx, P.B, P.D, BK_SKY, 2.2);
    hbSeg(ctx, P.A, P.B, BK_CREAM, 1.8);
    hbSeg(ctx, P.B, P.C, BK_CREAM, 1.8);
    hbSeg(ctx, P.C, P.D, BK_CREAM, 1.8);
    hbSeg(ctx, P.D, P.A, BK_CREAM, 1.8);
    bkPt(ctx, O, BK_CREAM, 3.2);
    dkName(ctx, O, 'O', BK_CREAM, -4, -13);
    bkPt(ctx, E, BK_CREAM, 3.5);
    dkName(ctx, E, 'E', BK_CREAM, 12, 12);
  },

  // Q9：∠AOC = 136°，B 在優弧上、D 在劣弧上
  q9(ctx, W, H) {
    const O = hbV(W / 2, H / 2 + 4), R = 80;
    bkCircle(ctx, O, R, BK_CREAM, 2.2);
    const P = cqFigPts(ctx, O, R, { A: 158, B: 250, C: 22, D: 90 });
    hbSeg(ctx, O, P.A, BK_KRAFT, 2.2);
    hbSeg(ctx, O, P.C, BK_KRAFT, 2.2);
    [P.B, P.D].forEach(V => { hbSeg(ctx, V, P.A, BK_CREAM, 1.8); hbSeg(ctx, V, P.C, BK_CREAM, 1.8); });
    dkAng(ctx, O, P.C, P.A, 16, BK_KRAFT);
    bkTag(ctx, '136°', O.x, O.y + 18, BK_KRAFT, 12);
    bkPt(ctx, O, BK_CREAM, 3.2);
    dkName(ctx, O, 'O', BK_CREAM, 26, 2);
  },

  // Q10：A、B、C 在圓 O 上，C 在劣弧 AB 上，∠ACB = 116°
  q10(ctx, W, H) {
    const O = hbV(W / 2, H / 2 + 10), R = 80;
    bkCircle(ctx, O, R, BK_CREAM, 2.2);
    const P = cqFigPts(ctx, O, R, { A: 154, B: 26, C: 90 });
    hbSeg(ctx, O, P.A, BK_CREAM, 2);
    hbSeg(ctx, O, P.B, BK_CREAM, 2);
    hbSeg(ctx, P.A, P.B, BK_SKY, 2);
    hbSeg(ctx, P.C, P.A, BK_TOMATO, 2.2);
    hbSeg(ctx, P.C, P.B, BK_TOMATO, 2.2);
    dkAng(ctx, P.C, P.A, P.B, 14, BK_KRAFT);
    bkTag(ctx, '116°', P.C.x, P.C.y + 28, BK_KRAFT, 12);
    bkPt(ctx, O, BK_CREAM, 3.2);
    dkName(ctx, O, 'O', BK_CREAM, 0, 15);
  },

  // Q11：∠COD = 84°、«AD» = 62°、∠DAB = 107°
  q11(ctx, W, H) {
    const O = hbV(W / 2, H / 2), R = 78;
    bkCircle(ctx, O, R, BK_CREAM, 2.2);
    const P = cqFigPts(ctx, O, R, { A: 200, B: 284, C: 54, D: 138 });
    hbPoly(ctx, [P.A, P.B, P.C, P.D], BK_CREAM, 0, 2);
    hbSeg(ctx, O, P.C, BK_KRAFT, 2);
    hbSeg(ctx, O, P.D, BK_KRAFT, 2);
    dkAng(ctx, O, P.C, P.D, 15, BK_KRAFT);
    cqAngTag(ctx, O, P.C, P.D, 30, '84°', BK_KRAFT, 12);
    dkAng(ctx, P.A, P.B, P.D, 18, BK_LIME);
    cqAngTag(ctx, P.A, P.B, P.D, 36, '107°', BK_LIME, 12);
    bkArc(ctx, O, R, 138, 200, BK_SKY, 4);
    cqArcTag(ctx, O, R, 138, 200, '62°', BK_SKY, 22, 12);
    bkPt(ctx, O, BK_CREAM, 3.2);
    dkName(ctx, O, 'O', BK_CREAM, 4, 14);
  },

  // Q13：AB 是直徑，C 在圓上，∠CAB = 33°
  q13(ctx, W, H) {
    const O = hbV(W / 2, H / 2 + 12), R = 80;
    bkCircle(ctx, O, R, BK_CREAM, 2.2);
    const P = cqFigPts(ctx, O, R, { A: 180, B: 0, C: 66 });
    hbSeg(ctx, P.A, P.B, BK_TOMATO, 2.2);
    hbSeg(ctx, P.A, P.C, BK_CREAM, 2);
    hbSeg(ctx, P.B, P.C, BK_CREAM, 2);
    dkAng(ctx, P.A, P.B, P.C, 24, BK_KRAFT);
    cqAngTag(ctx, P.A, P.B, P.C, 44, '33°', BK_KRAFT, 12);
    bkPt(ctx, O, BK_CREAM, 3.2);
    dkName(ctx, O, 'O', BK_CREAM, 0, 14);
  },

  // Q15：AB // OC，«AB» = 64°，D 在下半圓
  q15(ctx, W, H) {
    const O = hbV(W / 2, H / 2 + 10), R = 72;
    bkCircle(ctx, O, R, BK_CREAM, 2.2);
    const P = cqFigPts(ctx, O, R, { A: 122, B: 58, C: 180, D: 270 });
    hbSeg(ctx, O, P.C, BK_TOMATO, 2.4);
    hbSeg(ctx, P.A, P.B, BK_TOMATO, 2.4);
    hbArrowHead(ctx, P.A, P.B, BK_TOMATO);
    hbArrowHead(ctx, P.C, O, BK_TOMATO);
    bkArc(ctx, O, R, 58, 122, BK_SKY, 4);
    cqArcTag(ctx, O, R, 58, 122, '64°', BK_SKY, 15, 12);
    bkPt(ctx, O, BK_CREAM, 3.2);
    dkName(ctx, O, 'O', BK_CREAM, 6, 14);
  },

  // Q16：AB // CD，∠BAD = 41°
  q16(ctx, W, H) {
    const O = hbV(W / 2, H / 2), R = 80;
    bkCircle(ctx, O, R, BK_CREAM, 2.2);
    const P = cqFigPts(ctx, O, R, { A: 140, B: 40, C: 222, D: 318 });
    hbSeg(ctx, P.A, P.B, BK_TOMATO, 2.4);
    hbSeg(ctx, P.C, P.D, BK_TOMATO, 2.4);
    hbArrowHead(ctx, P.A, P.B, BK_TOMATO);
    hbArrowHead(ctx, P.C, P.D, BK_TOMATO);
    hbSeg(ctx, P.A, P.D, BK_CREAM, 2);
    dkAng(ctx, P.A, P.B, P.D, 24, BK_KRAFT);
    cqAngTag(ctx, P.A, P.B, P.D, 44, '41°', BK_KRAFT, 12);
  },

  // Q19：圓內接四邊形 ABCD，B、C、E 共線，∠ABC = 73°、∠BAD = 118°
  q19(ctx, W, H) {
    const g = cqQuadDeg(118, 73);
    const O = hbV(W / 2 - 34, H / 2 + 2), R = 76;
    bkCircle(ctx, O, R, BK_CREAM, 2.2);
    const P = cqFigPts(ctx, O, R, { A: g.a, B: g.b, C: g.c, D: g.d });
    const E = hbBeyond(P.B, P.C, 70);
    hbPoly(ctx, [P.A, P.B, P.C, P.D], BK_CREAM, 0, 2.2);
    hbSeg(ctx, P.C, E, BK_CREAM, 2.2);
    bkPt(ctx, E, BK_CREAM, 3.5);
    dkName(ctx, E, 'E', BK_CREAM, 10, -10);
    dkAng(ctx, P.A, P.B, P.D, 18, BK_KRAFT);
    cqAngTag(ctx, P.A, P.B, P.D, 38, '118°', BK_KRAFT, 12);
    dkAng(ctx, P.B, P.A, P.C, 18, BK_LIME);
    cqAngTag(ctx, P.B, P.A, P.C, 38, '73°', BK_LIME, 12);
  },

  // Q20：AB、DC 延長交於 E，AD、BC 延長交於 F；∠A = 46°、∠F = 39°
  q20(ctx, W, H) {
    const G = cqFitAll(cqExtGeom(46, 95), 1, { x: 28, y: 32, w: W - 64, h: H - 50 });
    bkCircle(ctx, G.O, G.R, BK_CREAM, 2.2);
    hbSeg(ctx, G.A, G.E, BK_CREAM, 2);
    hbSeg(ctx, G.D, G.E, BK_CREAM, 2);
    hbSeg(ctx, G.A, G.F, BK_CREAM, 2);
    hbSeg(ctx, G.B, G.F, BK_CREAM, 2);
    hbPoly(ctx, [G.A, G.B, G.C, G.D], BK_TOMATO, 0.1, 2.2);
    dkAng(ctx, G.A, G.B, G.D, 16, BK_KRAFT);
    cqAngTag(ctx, G.A, G.B, G.D, 32, '46°', BK_KRAFT, 12);
    dkAng(ctx, G.F, G.A, G.B, 16, BK_LIME);
    bkTag(ctx, '39°', G.F.x - 6, G.F.y - 17, BK_LIME, 12);   // 角很窄，標籤放在 F 的上方
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(k => bkPt(ctx, G[k], BK_CREAM, 3.5));
    const ref = G.O;
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(k => {
      const d = hbDist(ref, G[k]) || 1;
      dkName(ctx, hbV(G[k].x + (G[k].x - ref.x) / d * 13, G[k].y + (G[k].y - ref.y) / d * 13), k, BK_CREAM, 0, 0);
    });
  }
};

function initQuizFigs() {
  document.querySelectorAll('canvas.quiz-fig[data-fig]').forEach(cv => {
    const fn = CQ_QUIZ_FIGS[cv.getAttribute('data-fig')];
    if (!fn) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    fn(ctx, cv.width, cv.height);
  });
}

/* ==========================================================================
   重點 1：弧的度數與弧長（同心圓：同一個圓心角，度數相同、長度不同）
   ========================================================================== */
function initDegCanvas() {
  const cv = hbEl('canvas-deg');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sx = hbEl('deg-x'), sa = hbEl('deg-a'), sb = hbEl('deg-b');
  const vx = hbEl('deg-vx'), va = hbEl('deg-va'), vb = hbEl('deg-vb');
  const out = hbEl('deg-formula'), fb = hbEl('deg-feedback');
  const C0 = BK_TONE[0];

  function draw() {
    const W = cv.width;
    const x = hbClampSlider(sx, 2, 34) * 10;
    const a = hbClampSlider(sa, 2, 6), b = hbClampSlider(sb, 7, 12);
    vx.textContent = x + '°'; va.textContent = a; vb.textContent = b;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `同一個圓心 O：內圈半徑 ${a}、外圈半徑 ${b}`, C0);

    const O = hbV(270, 202), k = 12.5;
    const Ri = a * k, Ro = b * k;
    const a0 = 90 - x / 2, a1 = 90 + x / 2;
    bkSpokes(ctx, O, Ro);
    bkCircle(ctx, O, Ro, BK_FAINT, 2, [5, 5]);
    bkCircle(ctx, O, Ri, BK_FAINT, 2, [5, 5]);
    bkFill(ctx, O, Ro, a0, a1, BK_KRAFT, 0.14, true);
    bkArc(ctx, O, Ro, a0, a1, BK_TOMATO, 6);
    bkArc(ctx, O, Ri, a0, a1, BK_TEAL_L, 6);
    const A = hbAt(O, a1, Ri), B = hbAt(O, a0, Ri), C = hbAt(O, a1, Ro), D = hbAt(O, a0, Ro);
    hbSeg(ctx, O, C, BK_CREAM, 2.6);
    hbSeg(ctx, O, D, BK_CREAM, 2.6);
    hbSector(ctx, O, a0, x, Math.min(18, Ri * 0.6), BK_KRAFT, { alpha: 0.4 });
    const lab = hbAt(O, 90, (Ri + Ro) / 2);
    bkTag(ctx, `${x}°`, lab.x, lab.y, BK_KRAFT, 14);
    [A, B, C, D].forEach(p => bkPt(ctx, p, BK_CREAM, 4.5));
    bkPt(ctx, O, BK_CREAM, 4);
    // 點名放在半徑的「外側」（垂直半徑、遠離扇形）
    const side = (P, deg, s, t) => { const Q = hbAt(P, deg + s * 90, 15); dkName(ctx, Q, t, BK_CREAM, 0, 0); };
    side(A, a1, 1, 'A'); side(B, a0, -1, 'B'); side(C, a1, 1, 'C'); side(D, a0, -1, 'D');
    dkName(ctx, O, 'O', BK_CREAM, 0, 16);

    const part = qOf(x, 360);
    const pt = part[1] === 1 ? String(part[0]) : `{${part[0]}/${part[1]}}`;
    const Li = qMul(part, 2 * a), Lo = qMul(part, 2 * b);
    const g = gcd(a, b);
    bkRow(ctx, `«AB» 的度數 = «CD» 的度數 = ∠AOB = ${x}°`, 376, BK_CREAM, 16.5);
    bkRow(ctx, `«AB» 的長度 = 2π × ${a} × ${pt} = ${bkPiTxt(Li)}`, 410, BK_TEAL_L, 16);
    bkRow(ctx, `«CD» 的長度 = 2π × ${b} × ${pt} = ${bkPiTxt(Lo)}`, 442, BK_TOMATO, 16);
    bkRow(ctx, `度數一樣；長度比 = 半徑比 = ${a / g} : ${b / g}`, 470, BK_KRAFT, 15);

    const ptT = qTex(part);
    out.innerHTML = '度數：' + wbrEq(`${cqArcT('AB')} = ${cqArcT('CD')} = ${x}^\\circ`)
      + '；<wbr>長度：' + wbrEq(`${cqArcT('AB')} = 2\\pi \\times ${a} \\times ${ptT} = ${bkPiTex(Li)}`)
      + '，<wbr>' + wbrEq(`${cqArcT('CD')} = 2\\pi \\times ${b} \\times ${ptT} = ${bkPiTex(Lo)}`);
    fb.innerHTML = wrapFeedback(`兩段弧都被同一個圓心角 \\(\\angle AOB = ${x}^\\circ\\) 夾住，<strong>度數一樣</strong>；`
      + `但外圈半徑比較大，弧比較長，長度比是 \\(${a / g} : ${b / g}\\)。<br>「度數相等 ⇒ 長度相等」只在<strong>同圓或等圓</strong>中成立。`);
    typeset([out, fb]);
    cv._chk = { x, a, b, Li, Lo, O, A, B, C, D };
  }

  [sx, sa, sb].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：等弧對等弦、等弦對等弧（比較兩弦；正多邊形分圓）
   ========================================================================== */
function initChordCanvas() {
  const cv = hbEl('canvas-chord');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = hbEl('chord-p'), sq = hbEl('chord-q'), sn = hbEl('chord-n'), sk = hbEl('chord-k');
  const vp = hbEl('chord-vp'), vq = hbEl('chord-vq'), vn = hbEl('chord-vn'), vk = hbEl('chord-vk');
  const out = hbEl('chord-formula'), fb = hbEl('chord-feedback');
  const C1 = BK_TONE[1];
  const L = 'ABCDEFGHIJ';
  let mode = 'cmp';

  function drawCmp() {
    const p = hbClampSlider(sp, 2, 16) * 10, q = hbClampSlider(sq, 2, 16) * 10;
    vp.textContent = p + '°'; vq.textContent = q + '°';
    drawTitle(ctx, '同一個圓 O（半徑 10）：比較弦 AB 與弦 CD', C1);
    const O = hbV(270, 196), R = 130;
    const A = hbAt(O, 135 + p / 2, R), B = hbAt(O, 135 - p / 2, R);
    const C = hbAt(O, 315 - q / 2, R), D = hbAt(O, 315 + q / 2, R);
    bkSpokes(ctx, O, R);
    bkCircle(ctx, O, R, BK_CREAM, 3);
    hbPoly(ctx, [O, A, B], BK_TEAL, 0.18, 0.01);
    hbPoly(ctx, [O, C, D], BK_TOMATO, 0.18, 0.01);
    bkArc(ctx, O, R, 135 - p / 2, 135 + p / 2, BK_TEAL_L, 6);
    bkArc(ctx, O, R, 315 - q / 2, 315 + q / 2, BK_ROSE, 6);
    [A, B, C, D].forEach(P => hbSeg(ctx, O, P, BK_CREAM, 2.2));
    hbSeg(ctx, A, B, BK_TEAL_L, 4);
    hbSeg(ctx, C, D, BK_ROSE, 4);
    hbSector(ctx, O, 135 - p / 2, p, 22, BK_TEAL_L, { alpha: 0.35 });
    hbSector(ctx, O, 315 - q / 2, q, 22, BK_ROSE, { alpha: 0.35 });
    const t1 = hbAt(O, 135, 50), t2 = hbAt(O, 315, 50);
    bkTag(ctx, `${p}°`, t1.x, t1.y, BK_TEAL_L, 13);
    bkTag(ctx, `${q}°`, t2.x, t2.y, BK_ROSE, 13);
    [A, B, C, D].forEach(P => bkPt(ctx, P, BK_CREAM, 4.5));
    bkPt(ctx, O, BK_CREAM, 4);
    cqOutName(ctx, O, A, 'A', BK_CREAM);
    cqOutName(ctx, O, B, 'B', BK_CREAM);
    cqOutName(ctx, O, C, 'C', BK_CREAM);
    cqOutName(ctx, O, D, 'D', BK_CREAM);
    dkName(ctx, O, 'O', BK_CREAM, 16, -6);

    const l1 = 20 * Math.sin(p / 2 * HB_RAD), l2 = 20 * Math.sin(q / 2 * HB_RAD);
    bkRow(ctx, `«AB» = ∠AOB = ${p}°；«CD» = ∠COD = ${q}°`, 372, BK_CREAM, 16.5);
    if (p === q) {
      bkRow(ctx, `[OA] = [OC]、∠AOB = ∠COD、[OB] = [OD]`, 404, BK_CREAM, 15.5);
      bkRow(ctx, `△AOB ≅ △COD（SAS）⇒ 弦 [AB] = [CD]：等弧對等弦`, 436, BK_OK, 16.5);
      bkRow(ctx, `反過來，弦相等時用 SSS 全等，也推得出弧相等`, 466, MUTED, 13.5);
      out.innerHTML = wbrEq(`${cqArcT('AB')} = ${cqArcT('CD')} = ${p}^\\circ`) + '，<wbr>'
        + `\\(\\overline{AB} = \\overline{CD} \\approx ${l1.toFixed(2)}\\)`;
      fb.innerHTML = wrapFeedback(`兩個圓心角一樣大，兩個等腰三角形 \\(\\triangle AOB\\)、\\(\\triangle COD\\) 以 <strong>SAS</strong> 全等，所以弦一樣長：<strong>等弧對等弦</strong>。`);
    } else {
      bkRow(ctx, `兩段弧的度數不同 ⇒ 兩個圓心角不同`, 404, BK_CREAM, 15.5);
      bkRow(ctx, `量一量：[AB] ≈ ${l1.toFixed(2)}、[CD] ≈ ${l2.toFixed(2)}，弦不相等`, 436, BK_NO, 16);
      bkRow(ctx, `把兩個圓心角調成一樣大看看`, 466, MUTED, 13.5);
      out.innerHTML = `\\(${cqArcT('AB')} = ${p}^\\circ\\)、<wbr>\\(${cqArcT('CD')} = ${q}^\\circ\\)，<wbr>`
        + `\\(\\overline{AB} \\approx ${l1.toFixed(2)}\\)、<wbr>\\(\\overline{CD} \\approx ${l2.toFixed(2)}\\)`;
      fb.innerHTML = wrapFeedback(`弧的度數不同，夾出弦的兩個三角形就不全等，弦也不一樣長。這兩段弧都比半圓小，<strong>度數大的那一段，弦也比較長</strong>。`);
    }
    cv._chk = { mode, p, q, O, A, B, C, D, R };
  }

  function drawPoly() {
    const n = hbClampSlider(sn, 3, 10);
    const k = hbClampSlider(sk, 1, Math.floor(n / 2));
    vn.textContent = n; vk.textContent = k;
    drawTitle(ctx, `正 ${n} 邊形的頂點都在圓 O 上`, C1);
    const O = hbV(270, 196), R = 130;
    const P = [];
    for (let i = 0; i < n; i++) P.push(hbAt(O, 90 - 360 * i / n, R));
    const X = L[k];
    bkSpokes(ctx, O, R);
    bkCircle(ctx, O, R, BK_CREAM, 3);
    bkFill(ctx, O, R, 90 - 360 * k / n, 90, BK_KRAFT, 0.2, true);
    hbPoly(ctx, P, BK_CREAM, 0.05, 2.4);
    for (let i = 0; i < k; i++) hbSeg(ctx, P[i], P[i + 1], BK_TEAL_L, 4.5);
    bkArc(ctx, O, R, 90 - 360 * k / n, 90, BK_ROSE, 5);
    hbSeg(ctx, O, P[0], BK_CREAM, 2.4);
    hbSeg(ctx, O, P[k], BK_CREAM, 2.4);
    hbSector(ctx, O, 90 - 360 * k / n, 360 * k / n, 20, BK_KRAFT, { alpha: 0.4 });
    const tg = hbAt(O, 90 - 180 * k / n, 54);
    bkTag(ctx, bkDegTxt([360 * k, n]), tg.x, tg.y, BK_KRAFT, 13);
    P.forEach((Q, i) => {
      bkPt(ctx, Q, i === 0 || i === k ? BK_ROSE : BK_CREAM, 4.5);
      cqOutName(ctx, O, Q, L[i], BK_CREAM);
    });
    bkPt(ctx, O, BK_CREAM, 4);
    dkName(ctx, O, 'O', BK_CREAM, 0, 17);

    const one = bkDegTxt([360, n]);
    const arcName = k === 1 ? 'AB' : `AB${X}`;
    bkRow(ctx, `${n} 條邊（弦）都相等 ⇒ ${n} 段弧也都相等（等弦對等弧）`, 372, BK_CREAM, 16);
    bkRow(ctx, `每一段弧 = 360° ÷ ${n} = ${one}`, 404, BK_TEAL_L, 16);
    if (k === 1) bkRow(ctx, `∠AOB = «AB» = ${one}`, 438, BK_OK, 17);
    else bkRow(ctx, `∠AO${X} = «${arcName}» = ${k} × ${one} = ${bkDegTxt([360 * k, n])}`, 438, BK_OK, 17);
    bkRow(ctx, `${X} 是從 A 數過去第 ${k} 個頂點：中間隔了 ${k} 條邊`, 468, MUTED, 13.5);

    const fr = qTex(qOf(k, n));
    out.innerHTML = wbrEq(`\\angle AO${X} = ${cqArcT(arcName)} = 360^\\circ \\times ${fr} = ${hbDegTex(360 * k, n)}`);
    fb.innerHTML = wrapFeedback(`正 \\(${n}\\) 邊形的 \\(${n}\\) 條邊是 \\(${n}\\) 條等長的弦，所以把圓周分成 \\(${n}\\) 段<strong>相等的弧</strong>。`
      + `從 \\(A\\) 到 \\(${X}\\) 跨過 \\(${k}\\) 段，圓心角就是 \\(360^\\circ\\) 的 \\(${fr}\\)。`);
    cv._chk = { mode, n, k, O, P, R };
  }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    bkShow('chord-p-row', mode === 'cmp');
    bkShow('chord-q-row', mode === 'cmp');
    bkShow('chord-n-row', mode === 'poly');
    bkShow('chord-k-row', mode === 'poly');
    if (mode === 'cmp') drawCmp(); else drawPoly();
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('chord-mode-group'), 'data-chord-mode', m => { mode = m; draw(); });
  [sp, sq, sn, sk].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：圓周角與它所對的弧（三種情形；頂點不在圓上時不能取一半）
   B、C 固定在下方，«BC»（不含 A）= a；A 在上半圓移動（方向角 p）。
   ========================================================================== */
function initInsCanvas() {
  const cv = hbEl('canvas-ins');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('ins-a'), st = hbEl('ins-t'), sk = hbEl('ins-k');
  const va = hbEl('ins-va'), vt = hbEl('ins-vt'), vk = hbEl('ins-vk');
  const out = hbEl('ins-formula'), fb = hbEl('ins-feedback');
  const C2 = BK_TONE[2];
  let mode = 'on';

  function draw() {
    const W = cv.width;
    const a = hbClampSlider(sa, 1, 8) * 20;
    const t = hbClampSlider(st, -9, 9), p = 90 + 10 * t;
    const half = a / 2;
    va.textContent = a + '°';
    vt.textContent = p + '°';
    bkShow('ins-k-row', mode === 'off');
    ctx.clearRect(0, 0, W, cv.height);

    const O = hbV(270, 212), R = 115;
    const bDeg = 270 - half, cDeg = 270 + half;
    const B = hbAt(O, bDeg, R), C = hbAt(O, cDeg, R), A = hbAt(O, p, R);
    bkSpokes(ctx, O, R);
    bkCircle(ctx, O, R, BK_CREAM, 3);
    bkArc(ctx, O, R, bDeg, cDeg, BK_TEAL_L, 6.5);
    cqArcTag(ctx, O, R, bDeg, cDeg, `«BC» = ${a}°`, BK_TEAL_L, 40, 13);
    hbSeg(ctx, O, B, BK_FAINT, 2, [5, 4]);
    hbSeg(ctx, O, C, BK_FAINT, 2, [5, 4]);

    if (mode === 'on') {
      drawTitle(ctx, `圓周角 ∠BAC：頂點 A 在圓上，兩邊是弦`, C2);
      let cas;
      if (p === 90 + half) cas = 'onAC';
      else if (p === 90 - half) cas = 'onAB';
      else if (p > 90 - half && p < 90 + half) cas = 'in';
      else cas = 'out';
      const D = hbAt(O, p + 180, R);
      const bd = cqArcNot(bDeg, p + 180, p), dc = cqArcNot(p + 180, cDeg, p);
      let r1, r2, r3, tex2;
      if (cas === 'onAC' || cas === 'onAB') {
        const Q = cas === 'onAC' ? B : C, qn = cas === 'onAC' ? 'B' : 'C', on = cas === 'onAC' ? 'C' : 'B';
        hbSeg(ctx, O, Q, BK_SKY, 3);
        hbPoly(ctx, [O, A, Q], BK_SKY, 0.15, 0.01);
        dkAng(ctx, Q, A, O, 20, BK_SKY);
        dkAng(ctx, O, B, C, 16, BK_LIME);
        r1 = `圓心 O 在邊 [A${on}] 上：[OA] = [O${qn}]，∠O${qn}A = ∠A`;
        r2 = `∠BOC 是 △OA${qn} 的外角：∠BOC = ∠A + ∠O${qn}A = 2∠A`;
        r3 = `所以 ∠BAC = {1/2}∠BOC = {1/2}«BC»`;
        tex2 = `\\angle BOC = \\angle A + \\angle O${qn}A = 2\\angle A`;
      } else {
        hbSeg(ctx, A, D, BK_SKY, 2.4, [7, 5]);
        bkPt(ctx, D, BK_SKY, 4.5);
        cqOutName(ctx, O, D, 'D', BK_SKY);
        bkArc(ctx, O, R, ...cqArcSpan(bDeg, p + 180, p), 'rgba(124, 196, 240, 0.55)', 3, [4, 4]);
        if (cas === 'in') {
          r1 = '圓心 O 在 ∠BAC 的內部：作直徑 [AD]';
          r2 = `∠BAC = ∠BAD + ∠DAC = {1/2}«BD» + {1/2}«DC»`;
          r3 = `= ${bd / 2}° + ${dc / 2}° = {1/2}«BC»`;
          tex2 = `\\angle BAC = \\angle BAD + \\angle DAC = ${bd / 2}^\\circ + ${dc / 2}^\\circ`;
        } else {
          r1 = '圓心 O 在 ∠BAC 的外部：作直徑 [AD]';
          if (bd > dc) {
            r2 = `∠BAC = ∠BAD − ∠CAD = {1/2}«BD» − {1/2}«CD»`;
            r3 = `= ${bd / 2}° − ${dc / 2}° = {1/2}«BC»`;
            tex2 = `\\angle BAC = \\angle BAD - \\angle CAD = ${bd / 2}^\\circ - ${dc / 2}^\\circ`;
          } else {
            r2 = `∠BAC = ∠CAD − ∠BAD = {1/2}«CD» − {1/2}«BD»`;
            r3 = `= ${dc / 2}° − ${bd / 2}° = {1/2}«BC»`;
            tex2 = `\\angle BAC = \\angle CAD - \\angle BAD = ${dc / 2}^\\circ - ${bd / 2}^\\circ`;
          }
        }
      }
      hbSeg(ctx, A, B, BK_TOMATO, 3.4);
      hbSeg(ctx, A, C, BK_TOMATO, 3.4);
      dkAng(ctx, A, B, C, 26, BK_KRAFT);
      cqAngTag(ctx, A, B, C, 48, `${half}°`, BK_KRAFT, 14);
      [A, B, C].forEach(P => bkPt(ctx, P, BK_CREAM, 5));
      bkPt(ctx, O, BK_CREAM, 4);
      cqOutName(ctx, O, A, 'A', BK_CREAM);
      cqOutName(ctx, O, B, 'B', BK_CREAM);
      cqOutName(ctx, O, C, 'C', BK_CREAM);
      dkName(ctx, O, 'O', BK_CREAM, 15, 4);
      bkRow(ctx, r1, 386, BK_SKY, 15.5);
      bkRow(ctx, r2, 416, BK_CREAM, 16);
      bkRow(ctx, r3, 446, BK_CREAM, 16);
      bkRow(ctx, `∠BAC = {1/2}«BC» = {1/2} × ${a}° = ${half}°`, 480, BK_OK, 17);
      out.innerHTML = wbrEq(tex2) + '，<wbr>' + wbrEq(`\\angle BAC = \\frac{1}{2}${cqArcT('BC')} = \\frac{1}{2} \\times ${a}^\\circ = ${half}^\\circ`);
      const caseTxt = { onAC: '圓心在一邊上', onAB: '圓心在一邊上', in: '圓心在角的內部', out: '圓心在角的外部' }[cas];
      fb.innerHTML = wrapFeedback(`這是「${caseTxt}」的情形。不管 \\(A\\) 移到優弧上的哪裡，圓周角 \\(\\angle BAC\\) 都是它所對的弧 \\(${cqArcT('BC')}\\) 的<strong>一半</strong>：\\(${half}^\\circ\\)。`);
      cv._chk = { mode, a, p, cas, half, bd, dc, O, A, B, C, D };
    } else {
      const kk = hbClampSlider(sk, 4, 15) / 10;
      vk.textContent = kk === 1 ? '1（在圓上）' : String(kk);
      drawTitle(ctx, `頂點 P 在射線 OA 上，OP 是半徑的 ${kk} 倍`, C2);
      const P = hbV(O.x + (A.x - O.x) * kk, O.y + (A.y - O.y) * kk);
      const m = hbAngleDeg(P, B, C);
      hbSeg(ctx, O, kk > 1 ? P : A, BK_FAINT, 2, [5, 4]);
      if (kk !== 1) { bkPt(ctx, A, BK_FAINT, 4); cqOutName(ctx, O, A, 'A', 'rgba(246, 236, 214, 0.5)'); }
      const col = kk === 1 ? BK_OK : BK_PLUM;
      hbSeg(ctx, P, B, col, 3.4);
      hbSeg(ctx, P, C, col, 3.4);
      dkAng(ctx, P, B, C, 24, BK_KRAFT);
      const ms = kk === 1 ? `${half}°` : `≈ ${m.toFixed(1)}°`;
      cqAngTag(ctx, P, B, C, 46, ms, BK_KRAFT, 13.5);
      [B, C].forEach(Q => bkPt(ctx, Q, BK_CREAM, 5));
      bkPt(ctx, P, col, 5.5);
      bkPt(ctx, O, BK_CREAM, 4);
      cqOutName(ctx, O, B, 'B', BK_CREAM);
      cqOutName(ctx, O, C, 'C', BK_CREAM);
      dkName(ctx, O, 'O', BK_CREAM, 15, 4);
      const pn = hbDist(P, O) < 1 ? hbV(P.x, P.y - 16) : hbV(P.x + (P.x - O.x) / hbDist(P, O) * 16, P.y + (P.y - O.y) / hbDist(P, O) * 16);
      dkName(ctx, pn, 'P', col, 0, 0);
      let r1, r2, html;
      if (kk === 1) {
        r1 = `P 在圓上：∠BPC 是圓周角 = {1/2}«BC» = ${half}°`;
        r2 = '頂點在圓上、兩邊是弦，才可以用「弧的一半」';
        out.innerHTML = wbrEq(`\\angle BPC = \\frac{1}{2}${cqArcT('BC')} = ${half}^\\circ`);
        html = `\\(P\\) 回到圓上，\\(\\angle BPC\\) 就是圓周角，等於 \\(${cqArcT('BC')}\\) 的一半。`;
      } else if (kk < 1) {
        r1 = `P 在圓內：∠BPC ≈ ${m.toFixed(1)}°，比 {1/2}«BC» = ${half}° 大`;
        r2 = '頂點不在圓上就不是圓周角，不能用「弧的一半」';
        out.innerHTML = `\\(\\angle BPC \\approx ${m.toFixed(1)}^\\circ\\)，<wbr>` + wbrEq(`\\frac{1}{2}${cqArcT('BC')} = ${half}^\\circ`);
        html = `\\(P\\) 在圓內時角比較大（\\(P\\) 移到圓心時就是圓心角 \\(${a}^\\circ\\)）。只有頂點在圓上，才是圓周角。`;
      } else {
        r1 = `P 在圓外：∠BPC ≈ ${m.toFixed(1)}°，比 {1/2}«BC» = ${half}° 小`;
        r2 = '頂點不在圓上就不是圓周角，不能用「弧的一半」';
        out.innerHTML = `\\(\\angle BPC \\approx ${m.toFixed(1)}^\\circ\\)，<wbr>` + wbrEq(`\\frac{1}{2}${cqArcT('BC')} = ${half}^\\circ`);
        html = `\\(P\\) 在圓外時角比較小。兩弦交點、圓外一點這些頂點都不在圓上，不能直接取弧的一半。`;
      }
      bkRow(ctx, r1, 420, kk === 1 ? BK_OK : BK_NO, 16.5);
      bkRow(ctx, r2, 456, BK_CREAM, 15);
      fb.innerHTML = wrapFeedback(html);
      cv._chk = { mode, a, p, kk, half, m, O, P, B, C };
    }
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('ins-mode-group'), 'data-ins-mode', m => { mode = m; draw(); });
  [sa, st, sk].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：同弧所對的圓周角相等（P 可繞圓一圈；Q、R 固定在優弧上）
   ========================================================================== */
function initSameCanvas() {
  const cv = hbEl('canvas-same');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('same-a'), sp = hbEl('same-p'), va = hbEl('same-va'), vp = hbEl('same-vp');
  const out = hbEl('same-formula'), fb = hbEl('same-feedback');
  const C3 = BK_TONE[3];

  function draw() {
    const W = cv.width;
    const a = hbClampSlider(sa, 1, 8) * 20;
    const pv = hbClampSlider(sp, 0, 71);
    const p = 5 * pv + 2.5;            // P 的方向角永遠不會和 A、B、Q、R 重合
    const h = a / 2;
    va.textContent = a + '°';
    vp.textContent = p + '°';
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `弧 AB = ${a}°：從圓上三個不同的位置看 A、B`, C3);

    const O = hbV(270, 200), R = 130;
    const aDeg = 270 - h, bDeg = 270 + h;
    const A = hbAt(O, aDeg, R), B = hbAt(O, bDeg, R);
    const Q = hbAt(O, 40, R), Rr = hbAt(O, 150, R), P = hbAt(O, p, R);
    const onMajor = cqArcNot(aDeg, bDeg, p) === a;     // 不含 P 的弧就是 «AB» → P 在優弧上
    const angP = cqArcNot(aDeg, bDeg, p) / 2;
    bkSpokes(ctx, O, R);
    bkCircle(ctx, O, R, BK_CREAM, 3);
    if (!onMajor) bkArc(ctx, O, R, bDeg, aDeg + 360, 'rgba(201, 160, 240, 0.7)', 5);
    bkArc(ctx, O, R, aDeg, bDeg, BK_TEAL_L, 6.5);
    [[Q, BK_KRAFT], [Rr, BK_SKY], [P, onMajor ? BK_TOMATO : BK_PLUM]].forEach(([V, c]) => {
      hbSeg(ctx, V, A, c, 2.6);
      hbSeg(ctx, V, B, c, 2.6);
    });
    dkAng(ctx, Q, A, B, 24, BK_KRAFT);
    dkAng(ctx, Rr, A, B, 24, BK_SKY);
    dkAng(ctx, P, A, B, 24, onMajor ? BK_TOMATO : BK_PLUM);
    cqAngTag(ctx, Q, A, B, 46, `${h}°`, BK_KRAFT, 13);
    cqAngTag(ctx, Rr, A, B, 46, `${h}°`, BK_SKY, 13);
    cqAngTag(ctx, P, A, B, 46, `${angP}°`, onMajor ? BK_TOMATO : BK_PLUM, 13);
    [A, B, Q, Rr].forEach(V => bkPt(ctx, V, BK_CREAM, 4.5));
    bkPt(ctx, P, onMajor ? BK_TOMATO : BK_PLUM, 6);
    cqOutName(ctx, O, A, 'A', BK_CREAM);
    cqOutName(ctx, O, B, 'B', BK_CREAM);
    cqOutName(ctx, O, Q, 'Q', BK_KRAFT);
    cqOutName(ctx, O, Rr, 'R', BK_SKY);
    cqOutName(ctx, O, P, 'P', onMajor ? BK_TOMATO : BK_PLUM);

    bkRow(ctx, `∠AQB = ∠ARB = {1/2}«AB» = {1/2} × ${a}° = ${h}°`, 376, BK_CREAM, 16.5);
    if (onMajor) {
      bkRow(ctx, `P 也在 «AB» 外的圓上：∠APB = ${h}°`, 410, BK_TOMATO, 16.5);
      bkRow(ctx, '同一段弧所對的圓周角，度數都相等', 444, BK_OK, 17);
      out.innerHTML = wbrEq(`\\angle APB = \\angle AQB = \\angle ARB = \\frac{1}{2}${cqArcT('AB')} = ${h}^\\circ`);
      fb.innerHTML = wrapFeedback(`\\(P\\)、\\(Q\\)、\\(R\\) 夾住的都是同一段弧 \\(${cqArcT('AB')}\\)，所以三個圓周角都是它的一半：<strong>同弧所對的圓周角相等</strong>。`);
    } else {
      bkRow(ctx, `P 跑到 «AB» 上了：∠APB 對的是另一段弧（紫色）`, 410, BK_PLUM, 16);
      bkRow(ctx, `∠APB = {1/2}(360° − ${a}°) = ${angP}°，和 ∠AQB 不相等`, 444, BK_NO, 16.5);
      out.innerHTML = wbrEq(`\\angle APB = \\frac{1}{2}(360^\\circ - ${a}^\\circ) = ${angP}^\\circ`) + '，<wbr>'
        + wbrEq(`\\angle AQB = ${h}^\\circ`);
      fb.innerHTML = wrapFeedback(`「同弧」要夾住<strong>同一段</strong>弧。\\(P\\) 移到 \\(${cqArcT('AB')}\\) 上之後，它夾住的是另一段弧，角度變成 \\(180^\\circ - ${h}^\\circ\\)。`);
    }
    bkRow(ctx, '拖動 P 繞圓一圈，看它什麼時候和 Q、R 一樣大', 474, MUTED, 13.5);
    typeset([out, fb]);
    cv._chk = { a, p, onMajor, angP, h, O, A, B, P, Q, R: Rr };
  }

  [sa, sp].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：圓周角 = 圓心角的一半（含優弧；已知圓周角反求圓心角；等腰底角）
   A、C 對稱放在上方，∠AOC = θ（非優角）；B 在優弧上、D 在劣弧上。
   ========================================================================== */
function initCenCanvas() {
  const cv = hbEl('canvas-cen');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const st = hbEl('cen-t'), sg = hbEl('cen-g'), vt = hbEl('cen-vt'), vg = hbEl('cen-vg'), lg = hbEl('cen-lg');
  const out = hbEl('cen-formula'), fb = hbEl('cen-feedback');
  const C4 = BK_TONE[4];
  let mode = 'fwd', view = 'maj';

  function draw() {
    const W = cv.width;
    bkShow('cen-t-row', mode === 'fwd');
    bkShow('cen-g-row', mode === 'inv');
    let theta, g;
    if (mode === 'fwd') {
      theta = hbClampSlider(st, 2, 16) * 10;
      vt.textContent = theta + '°';
      g = view === 'maj' ? theta / 2 : 180 - theta / 2;
    } else {
      const v = hbClampSlider(sg, 2, 16) * 5;
      g = view === 'maj' ? v : 180 - v;
      theta = view === 'maj' ? 2 * g : 360 - 2 * g;
      lg.textContent = view === 'maj' ? '∠ABC' : '∠ADC';
      vg.textContent = g + '°';
    }
    const iso = (180 - theta) / 2;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'fwd' ? `已知圓心角 ∠AOC = ${theta}°` : `已知圓周角 ${view === 'maj' ? '∠ABC' : '∠ADC'} = ${g}°`, C4);

    const O = hbV(270, 196), R = 122;
    const aDeg = 90 + theta / 2, cDeg = 90 - theta / 2;
    const A = hbAt(O, aDeg, R), C = hbAt(O, cDeg, R), B = hbAt(O, 240, R), D = hbAt(O, 90, R);
    bkSpokes(ctx, O, R);
    bkCircle(ctx, O, R, BK_CREAM, 3);
    if (view === 'maj') bkArc(ctx, O, R, cDeg, aDeg, BK_TEAL_L, 6.5);
    else bkArc(ctx, O, R, aDeg, cDeg + 360, BK_PLUM, 6.5);
    hbPoly(ctx, [O, A, C], BK_SKY, 0.12, 0.01);
    hbSeg(ctx, A, C, BK_SKY, 2, [6, 4]);
    hbSeg(ctx, O, A, BK_CREAM, 2.8);
    hbSeg(ctx, O, C, BK_CREAM, 2.8);
    hbSector(ctx, O, cDeg, theta, 22, BK_KRAFT, { alpha: 0.4 });
    bkTag(ctx, `${theta}°`, O.x, O.y + 22, BK_KRAFT, 13);
    dkAng(ctx, C, O, A, 18, BK_SKY);
    cqAngTag(ctx, C, O, A, 40, `${iso}°`, BK_SKY, 12);
    const V = view === 'maj' ? B : D;
    hbSeg(ctx, V, A, BK_TOMATO, 3.2);
    hbSeg(ctx, V, C, BK_TOMATO, 3.2);
    dkAng(ctx, V, A, C, view === 'maj' ? 26 : 16, BK_TOMATO);
    if (view === 'maj') cqAngTag(ctx, V, A, C, 48, `${g}°`, BK_TOMATO, 13.5);
    else bkTag(ctx, `${g}°`, V.x, V.y + 34, BK_TOMATO, 13.5);
    [A, C].forEach(P => bkPt(ctx, P, BK_CREAM, 4.5));
    bkPt(ctx, B, view === 'maj' ? BK_TOMATO : BK_CREAM, 4.5);
    bkPt(ctx, D, view === 'min' ? BK_TOMATO : BK_FAINT, 4.5);
    bkPt(ctx, O, BK_CREAM, 4);
    cqOutName(ctx, O, A, 'A', BK_CREAM);
    cqOutName(ctx, O, C, 'C', BK_CREAM);
    cqOutName(ctx, O, B, 'B', BK_CREAM);
    cqOutName(ctx, O, D, 'D', view === 'min' ? BK_CREAM : 'rgba(246, 236, 214, 0.45)');
    dkName(ctx, O, 'O', BK_CREAM, 0, -15);

    let r1, r2, r3, tex;
    if (view === 'maj') {
      r1 = '∠ABC 對的是 «AC»（不含 B 的那一段，青綠色）';
      if (mode === 'fwd') {
        r2 = `«AC» = ∠AOC = ${theta}°`;
        r3 = `∠ABC = {1/2}∠AOC = {1/2} × ${theta}° = ${g}°`;
        tex = `\\angle ABC = \\frac{1}{2}\\angle AOC = \\frac{1}{2} \\times ${theta}^\\circ = ${g}^\\circ`;
      } else {
        r2 = `«AC» = 2 × ∠ABC = 2 × ${g}° = ${theta}°`;
        r3 = `∠AOC = «AC» = ${theta}°`;
        tex = `\\angle AOC = 2\\angle ABC = 2 \\times ${g}^\\circ = ${theta}^\\circ`;
      }
    } else {
      r1 = '∠ADC 對的是 «ABC»（不含 D 的那一段，紫色）';
      if (mode === 'fwd') {
        r2 = `«ABC» = 360° − ${theta}° = ${360 - theta}°`;
        r3 = `∠ADC = {1/2} × ${360 - theta}° = ${g}°`;
        tex = `\\angle ADC = \\frac{1}{2}(360^\\circ - ${theta}^\\circ) = ${g}^\\circ`;
      } else {
        r2 = `«ABC» = 2 × ∠ADC = 2 × ${g}° = ${2 * g}°`;
        r3 = `∠AOC = 360° − ${2 * g}° = ${theta}°`;
        tex = `${cqArcT('ABC')} = 2 \\times ${g}^\\circ = ${2 * g}^\\circ` + '，<wbr>' + `\\angle AOC = 360^\\circ - ${2 * g}^\\circ = ${theta}^\\circ`;
      }
    }
    bkRow(ctx, r1, 362, BK_CREAM, 15.5);
    bkRow(ctx, r2, 394, view === 'maj' ? BK_TEAL_L : BK_PLUM, 16.5);
    bkRow(ctx, r3, 426, BK_OK, 17);
    bkRow(ctx, `等腰 △OAC：∠OCA = (180° − ${theta}°) ÷ 2 = ${iso}°`, 460, BK_SKY, 15.5);
    if (view === 'min' && mode === 'inv') out.innerHTML = tex.split('，<wbr>').map(s => wbrEq(s)).join('，<wbr>');
    else out.innerHTML = wbrEq(tex);
    out.innerHTML += '，<wbr>' + wbrEq(`\\angle OCA = (180^\\circ - ${theta}^\\circ) \\div 2 = ${iso}^\\circ`);
    fb.innerHTML = wrapFeedback(view === 'maj'
      ? `\\(\\angle ABC\\) 和 \\(\\angle AOC\\) 對的是同一段弧 \\(${cqArcT('AC')}\\)，所以<strong>圓周角是圓心角的一半</strong>。`
      : `\\(D\\) 在劣弧上，\\(\\angle ADC\\) 對的是優弧 \\(${cqArcT('ABC')}\\)，要先用 \\(360^\\circ\\) 減，不能直接拿 \\(\\angle AOC\\) 的一半。`);
    typeset([out, fb]);
    cv._chk = { mode, view, theta, g, iso, O, A, B, C, D };
  }

  bindPickGroup(hbEl('cen-mode-group'), 'data-cen-mode', m => { mode = m; draw(); });
  bindPickGroup(hbEl('cen-view-group'), 'data-cen-view', m => { view = m; draw(); });
  [st, sg].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：把弧加起來求圓周角（A、B、C、D 依序在圓上）
   ========================================================================== */
const CQ_SUM_ANGLES = {
  ABC: ['B', 'A', 'C'], DAB: ['A', 'D', 'B'], ACB: ['C', 'A', 'B'], BDC: ['D', 'B', 'C'], CAD: ['A', 'C', 'D']
};

function initSumCanvas() {
  const cv = hbEl('canvas-sum');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const s1 = hbEl('sum-ab'), s2 = hbEl('sum-bc'), s3 = hbEl('sum-cd');
  const v1 = hbEl('sum-vab'), v2 = hbEl('sum-vbc'), v3 = hbEl('sum-vcd');
  const out = hbEl('sum-formula'), fb = hbEl('sum-feedback');
  const C5 = BK_TONE[5];
  const N = ['A', 'B', 'C', 'D'];
  let pick = 'ABC';

  function draw() {
    const W = cv.width;
    const ab = hbClampSlider(s1, 2, 11) * 10, bc = hbClampSlider(s2, 2, 11) * 10, cd = hbClampSlider(s3, 2, 11) * 10;
    const da = 360 - ab - bc - cd;
    v1.textContent = ab + '°'; v2.textContent = bc + '°'; v3.textContent = cd + '°';
    const arcs = [ab, bc, cd, da];
    const deg = cqChain(215, arcs);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `四點依序在圓上，四段弧加起來是 360°`, C5);

    const O = hbV(270, 198), R = 125;
    const P = {};
    N.forEach((n, i) => { P[n] = hbAt(O, deg[i], R); });
    const [vName, pName, qName] = CQ_SUM_ANGLES[pick];
    const iv = N.indexOf(vName), ip = N.indexOf(pName), iq = N.indexOf(qName);
    // 從 P 逆時針走到 Q；碰到頂點就改從 Q 逆時針走到 P
    function walk(i0, i1) {
      const idx = [];
      let i = i0, hit = false;
      while (i !== i1) { idx.push(i); i = (i + 1) % 4; if (i === iv && i !== i1) hit = true; }
      return { idx, hit };
    }
    let w = walk(ip, iq), forward = true;
    if (w.hit) { w = walk(iq, ip); forward = false; }
    const parts = w.idx.map(i => arcs[i]);
    const total = parts.reduce((s, v) => s + v, 0);
    let letters = w.idx.map(i => N[i]).concat([N[(w.idx[w.idx.length - 1] + 1) % 4]]);
    if (!forward) letters = letters.reverse();
    const arcName = letters.join('');
    const subNames = [];
    for (let i = 0; i < letters.length - 1; i++) subNames.push(letters[i] + letters[i + 1]);
    const subVals = forward ? parts : parts.slice().reverse();

    bkSpokes(ctx, O, R);
    bkCircle(ctx, O, R, BK_CREAM, 3);
    const s0 = deg[w.idx[0]];
    bkArc(ctx, O, R, s0, s0 + total, BK_TEAL_L, 7);
    // 四段弧的度數（題目給的條件）
    N.forEach((n, i) => cqArcTag(ctx, O, R, deg[i], deg[i] + arcs[i], `${arcs[i]}°`, MUTED, 32, 12.5));
    hbPoly(ctx, N.map(n => P[n]), BK_FAINT, 0, 1.6);
    hbSeg(ctx, P[vName], P[pName], BK_TOMATO, 3.4);
    hbSeg(ctx, P[vName], P[qName], BK_TOMATO, 3.4);
    dkAng(ctx, P[vName], P[pName], P[qName], 24, BK_KRAFT);
    const h = total / 2;
    cqAngTag(ctx, P[vName], P[pName], P[qName], 46, `${h}°`, BK_KRAFT, 13.5);
    N.forEach(n => { bkPt(ctx, P[n], n === vName ? BK_TOMATO : BK_CREAM, 5); cqOutName(ctx, O, P[n], n, BK_CREAM, 17); });

    const ang = `∠${pName}${vName}${qName}`;
    bkRow(ctx, `${ang} 對的弧：«${arcName}»（不含頂點 ${vName}，青綠色）`, 372, BK_CREAM, 16);
    if (subNames.length > 1) {
      bkRow(ctx, `«${arcName}» = ${subNames.map(s => '«' + s + '»').join(' + ')} = ${subVals.map(v => v + '°').join(' + ')} = ${total}°`, 406, BK_TEAL_L, 16);
    } else {
      bkRow(ctx, `«${arcName}» = ${total}°（一段就夠了）`, 406, BK_TEAL_L, 16);
    }
    bkRow(ctx, `${ang} = {1/2} × ${total}° = ${h}°`, 440, BK_OK, 17.5);
    bkRow(ctx, '先找不含頂點的那段弧，各段加起來，再除以 2', 470, MUTED, 13.5);

    const angT = `\\angle ${pName}${vName}${qName}`;
    if (subNames.length > 1) {
      out.innerHTML = wbrEq(`${angT} = \\frac{1}{2}${cqArcT(arcName)} = \\frac{1}{2}(${subVals.map(v => v + '^\\circ').join(' + ')}) = ${h}^\\circ`);
    } else {
      out.innerHTML = wbrEq(`${angT} = \\frac{1}{2}${cqArcT(arcName)} = \\frac{1}{2} \\times ${total}^\\circ = ${h}^\\circ`);
    }
    fb.innerHTML = wrapFeedback(`\\(${angT}\\) 的頂點是 \\(${vName}\\)，兩邊通過 \\(${pName}\\)、\\(${qName}\\)。它夾住的是<strong>不含 \\(${vName}\\)</strong> 的 \\(${cqArcT(arcName)}\\)`
      + (subNames.length > 1 ? `，由 ${subNames.length} 段弧<strong>加起來</strong>。` : '。'));
    typeset([out, fb]);
    cv._chk = { pick, arcs, deg, total, h, O, P };
  }

  bindPickGroup(hbEl('sum-ang-group'), 'data-sum-ang', m => { pick = m; draw(); });
  [s1, s2, s3].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：半圓的圓周角是直角（直徑上的圓周角；從圓外一點作切線）
   ========================================================================== */
function initSemiCanvas() {
  const cv = hbEl('canvas-semi');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('semi-a'), sd = hbEl('semi-d'), va = hbEl('semi-va'), vd = hbEl('semi-vd');
  const out = hbEl('semi-formula'), fb = hbEl('semi-feedback');
  const C6 = BK_TONE[6];
  let mode = 'semi';

  function drawSemi() {
    const al = hbClampSlider(sa, 2, 16) * 5;
    va.textContent = al + '°';
    drawTitle(ctx, `AB 是直徑，C 在圓上，∠CAB = ${al}°`, C6);
    const O = hbV(270, 200), R = 128;
    const A = hbAt(O, 180, R), B = hbAt(O, 0, R), C = hbAt(O, 2 * al, R), D = hbAt(O, 270, R);
    bkSpokes(ctx, O, R);
    bkCircle(ctx, O, R, BK_CREAM, 3);
    bkArc(ctx, O, R, 180, 360, BK_TEAL_L, 6.5);
    hbPoly(ctx, [A, B, C], BK_KRAFT, 0.14, 0.01);
    hbSeg(ctx, A, B, BK_TOMATO, 3.6);
    hbSeg(ctx, A, C, BK_CREAM, 3);
    hbSeg(ctx, B, C, BK_CREAM, 3);
    dkAng(ctx, C, A, B, 22, BK_OK);
    dkAng(ctx, A, B, C, 30, BK_KRAFT);
    cqAngTag(ctx, A, B, C, 56, `${al}°`, BK_KRAFT, 13.5);
    dkAng(ctx, B, A, C, 26, BK_SKY);
    cqAngTag(ctx, B, A, C, 52, `${90 - al}°`, BK_SKY, 13.5);
    [A, B, C].forEach(P => bkPt(ctx, P, BK_CREAM, 5));
    bkPt(ctx, D, BK_TEAL_L, 4.5);
    bkPt(ctx, O, BK_CREAM, 4);
    cqOutName(ctx, O, A, 'A', BK_CREAM);
    cqOutName(ctx, O, B, 'B', BK_CREAM);
    cqOutName(ctx, O, C, 'C', BK_CREAM);
    cqOutName(ctx, O, D, 'D', BK_TEAL_L);
    dkName(ctx, O, 'O', BK_CREAM, 0, -15);
    bkRow(ctx, '[AB] 是直徑：«ADB» 是半圓 = 180°', 384, BK_TEAL_L, 16);
    bkRow(ctx, '∠ACB 對半圓 «ADB»：∠ACB = {1/2} × 180° = 90°', 418, BK_OK, 17);
    bkRow(ctx, `∠ABC = 180° − 90° − ${al}° = ${90 - al}°`, 452, BK_SKY, 16.5);
    out.innerHTML = wbrEq(`\\angle ACB = \\frac{1}{2} \\times 180^\\circ = 90^\\circ`) + '，<wbr>'
      + wbrEq(`\\angle ABC = 180^\\circ - 90^\\circ - ${al}^\\circ = ${90 - al}^\\circ`);
    fb.innerHTML = wrapFeedback(`不管 \\(C\\) 在圓上的哪裡，\\(\\angle ACB\\) 都對著半圓，永遠是<strong>直角</strong>，\\(\\triangle ABC\\) 是以直徑為斜邊的直角三角形。`);
    cv._chk = { mode, al, O, A, B, C };
  }

  function drawTan() {
    const d = hbClampSlider(sd, 13, 26) / 10;
    vd.textContent = d + ' 倍半徑';
    drawTitle(ctx, `P 在圓 O 外，OP 是半徑的 ${d} 倍：作過 P 的切線`, C6);
    const O = hbV(160, 206), R = 82;
    const P = hbV(O.x + d * R, O.y), Q = hbV((O.x + P.x) / 2, O.y);
    const xs = cgCC(O, R, Q, d * R / 2);
    const M = xs[0].y < xs[1].y ? xs[0] : xs[1], N = xs[0].y < xs[1].y ? xs[1] : xs[0];
    bkSpokes(ctx, O, R);
    bkCircle(ctx, O, R, BK_CREAM, 3);
    bkCircle(ctx, Q, d * R / 2, BK_SKY, 2, [6, 5]);
    hbSeg(ctx, O, P, BK_SKY, 2.2);
    hbSeg(ctx, P, hbBeyond(P, M, 46), BK_TOMATO, 3.4);
    hbSeg(ctx, P, hbBeyond(P, N, 46), BK_TOMATO, 3.4);
    hbSeg(ctx, O, M, BK_CREAM, 2.6);
    hbSeg(ctx, O, N, BK_CREAM, 2.6);
    dkAng(ctx, M, O, P, 13, BK_OK);
    dkAng(ctx, N, O, P, 13, BK_OK);
    [O, P, Q, M, N].forEach(X => bkPt(ctx, X, X === Q ? BK_SKY : BK_CREAM, 4.5));
    dkName(ctx, O, 'O', BK_CREAM, -15, -4);
    dkName(ctx, P, 'P', BK_CREAM, 15, 0);
    dkName(ctx, Q, 'Q', BK_SKY, 0, 16);
    dkName(ctx, M, 'M', BK_CREAM, -4, -17);
    dkName(ctx, N, 'N', BK_CREAM, -4, 17);
    const mAng = hbAngleDeg(M, O, P);
    bkRow(ctx, '以 [OP] 為直徑作圓 Q（虛線），交圓 O 於 M、N', 384, BK_SKY, 15.5);
    bkRow(ctx, '∠OMP、∠ONP 都對圓 Q 的半圓 ⇒ 都是 90°', 418, BK_OK, 16.5);
    bkRow(ctx, '[PM] ⊥ 半徑 [OM]、[PN] ⊥ 半徑 [ON]：PM、PN 都是切線', 452, BK_TOMATO, 15.5);
    out.innerHTML = wbrEq(`\\angle OMP = \\angle ONP = 90^\\circ`) + '，<wbr>' + `\\(\\overline{PM} = \\overline{PN}\\)`;
    fb.innerHTML = wrapFeedback(`\\(\\overline{OP}\\) 是圓 \\(Q\\) 的直徑，\\(M\\)、\\(N\\) 在圓 \\(Q\\) 上，所以 \\(\\angle OMP\\)、\\(\\angle ONP\\) 都是<strong>半圓所對的圓周角</strong>，是直角；`
      + `再由 5-2-1「垂直半徑外端的直線是切線」，\\(PM\\)、\\(PN\\) 就是切線。`);
    cv._chk = { mode, d, mAng, O, P, M, N, R };
  }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    bkShow('semi-a-row', mode === 'semi');
    bkShow('semi-d-row', mode === 'tan');
    if (mode === 'semi') drawSemi(); else drawTan();
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('semi-mode-group'), 'data-semi-mode', m => { mode = m; draw(); });
  [sa, sd].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：平行弦截出相等的弧
   AB 在上：A = 90° + p、B = 90° − p；CD 在下：C = 270° − q + t、D = 270° + q + t。
   «AC» = 180 − p − q + t，«BD» = 180 − p − q − t（t = 0 時 AB // CD）。
   ========================================================================== */
function initParCanvas() {
  const cv = hbEl('canvas-par');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = hbEl('par-p'), sq = hbEl('par-q'), st = hbEl('par-t');
  const vp = hbEl('par-vp'), vq = hbEl('par-vq'), vt = hbEl('par-vt');
  const out = hbEl('par-formula'), fb = hbEl('par-feedback');
  const C7 = BK_TONE[7];

  function draw() {
    const W = cv.width;
    const p = hbClampSlider(sp, 1, 7) * 10, q = hbClampSlider(sq, 1, 7) * 10, t = hbClampSlider(st, -3, 3) * 10;
    vp.textContent = (2 * p) + '°';
    vq.textContent = (2 * q) + '°';
    vt.textContent = t === 0 ? '0°（平行）' : `${t}°`;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, t === 0 ? '圓 O 中兩弦 AB // CD' : `把弦 CD 轉 ${Math.abs(t)}°：AB 與 CD 不平行`, C7);

    const O = hbV(270, 196), R = 130;
    const aD = 90 + p, bD = 90 - p, cD = 270 - q + t, dD = 270 + q + t;
    const A = hbAt(O, aD, R), B = hbAt(O, bD, R), C = hbAt(O, cD, R), D = hbAt(O, dD, R);
    const ac = cqArcNot(aD, cD, bD), bd = cqArcNot(bD, dD, aD);
    bkSpokes(ctx, O, R);
    bkCircle(ctx, O, R, BK_CREAM, 3);
    bkArc(ctx, O, R, aD, cD, BK_SKY, 7);
    bkArc(ctx, O, R, dD - 360, bD, BK_LIME, 7);
    cqArcTag(ctx, O, R, aD, cD, `${ac}°`, BK_SKY, 24, 13.5);
    cqArcTag(ctx, O, R, dD - 360, bD, `${bd}°`, BK_LIME, 24, 13.5);
    const col = t === 0 ? BK_TOMATO : BK_PLUM;
    hbSeg(ctx, A, B, BK_TOMATO, 4);
    hbSeg(ctx, C, D, col, 4);
    if (t === 0) { hbArrowHead(ctx, A, B, BK_TOMATO); hbArrowHead(ctx, C, D, BK_TOMATO); }
    hbSeg(ctx, B, C, BK_CREAM, 2.2, [6, 4]);
    dkAng(ctx, B, A, C, 26, BK_SKY);
    dkAng(ctx, C, B, D, 26, BK_LIME);
    cqAngTag(ctx, B, A, C, 50, `${ac / 2}°`, BK_SKY, 13);
    cqAngTag(ctx, C, B, D, 50, `${bd / 2}°`, BK_LIME, 13);
    [A, B, C, D].forEach(P => bkPt(ctx, P, BK_CREAM, 5));
    bkPt(ctx, O, BK_CREAM, 3.5);
    cqOutName(ctx, O, A, 'A', BK_CREAM);
    cqOutName(ctx, O, B, 'B', BK_CREAM);
    cqOutName(ctx, O, C, 'C', BK_CREAM);
    cqOutName(ctx, O, D, 'D', BK_CREAM);

    if (t === 0) {
      bkRow(ctx, 'AB // CD：內錯角 ∠ABC = ∠BCD', 378, BK_CREAM, 16.5);
      bkRow(ctx, '∠ABC = {1/2}«AC»、∠BCD = {1/2}«BD»', 410, BK_CREAM, 16);
      bkRow(ctx, `所以 «AC» = «BD» = ${ac}°`, 444, BK_OK, 17.5);
      bkRow(ctx, '兩平行弦夾住的兩段弧一樣大', 472, MUTED, 13.5);
      out.innerHTML = wbrEq(`\\angle ABC = \\angle BCD`) + '，<wbr>' + wbrEq(`${cqArcT('AC')} = ${cqArcT('BD')} = ${ac}^\\circ`);
      fb.innerHTML = wrapFeedback(`連接 \\(\\overline{BC}\\)，平行線的<strong>內錯角相等</strong>；這兩個角又分別是對 \\(${cqArcT('AC')}\\)、\\(${cqArcT('BD')}\\) 的圓周角，所以兩段弧相等。`);
    } else {
      bkRow(ctx, `«AC» = ${ac}°、«BD» = ${bd}°，兩段弧不相等`, 394, BK_NO, 17);
      bkRow(ctx, `內錯角 ∠ABC = ${ac / 2}°、∠BCD = ${bd / 2}°，也不相等`, 428, BK_CREAM, 16);
      bkRow(ctx, '反過來：«AC» = «BD» 時內錯角相等，AB // CD', 464, MUTED, 14);
      out.innerHTML = `\\(${cqArcT('AC')} = ${ac}^\\circ\\)、<wbr>\\(${cqArcT('BD')} = ${bd}^\\circ\\)，<wbr>\\(\\angle ABC \\ne \\angle BCD\\)`;
      fb.innerHTML = wrapFeedback(`\\(\\overline{CD}\\) 轉了 \\(${Math.abs(t)}^\\circ\\)，一邊的弧多 \\(${Math.abs(t)}^\\circ\\)、另一邊少 \\(${Math.abs(t)}^\\circ\\)。把它轉回 \\(0^\\circ\\)，兩弦平行、兩段弧就一樣大——<strong>弧相等也能推出兩弦平行</strong>。`);
    }
    typeset([out, fb]);
    cv._chk = { p, q, t, ac, bd, O, A, B, C, D };
  }

  [sp, sq, st].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：圓內接四邊形的對角互補（D 離開圓就不成立）
   ========================================================================== */
function initQuadCanvas() {
  const cv = hbEl('canvas-quad');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const s1 = hbEl('quad-ab'), s2 = hbEl('quad-bc'), s3 = hbEl('quad-cd');
  const v1 = hbEl('quad-vab'), v2 = hbEl('quad-vbc'), v3 = hbEl('quad-vcd');
  const out = hbEl('quad-formula'), fb = hbEl('quad-feedback');
  const C8 = BK_TONE[8];
  let where = 'on';

  function draw() {
    const W = cv.width;
    const ab = hbClampSlider(s1, 3, 11) * 10, bc = hbClampSlider(s2, 3, 11) * 10, cd = hbClampSlider(s3, 3, 11) * 10;
    const da = 360 - ab - bc - cd;
    v1.textContent = ab + '°'; v2.textContent = bc + '°'; v3.textContent = cd + '°';
    const deg = cqChain(215, [ab, bc, cd, da]);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, where === 'on' ? '四個頂點都在圓上：圓內接四邊形 ABCD' : `把 D 移到圓${where === 'in' ? '內' : '外'}`, C8);

    const O = hbV(270, 208), R = 120;
    const A = hbAt(O, deg[0], R), B = hbAt(O, deg[1], R), C = hbAt(O, deg[2], R), D0 = hbAt(O, deg[3], R);
    const M = hbV((A.x + C.x) / 2, (A.y + C.y) / 2);
    let D = D0;
    if (where === 'in') D = hbV(D0.x + 0.4 * (M.x - D0.x), D0.y + 0.4 * (M.y - D0.y));
    if (where === 'out') D = hbV(D0.x + 0.16 * (D0.x - M.x), D0.y + 0.16 * (D0.y - M.y));
    const quad = [A, B, C, D];
    // 凸四邊形檢查：四個轉角的外積同號
    const cr = quad.map((P, i) => {
      const Q = quad[(i + 1) % 4], S = quad[(i + 2) % 4];
      return (Q.x - P.x) * (S.y - Q.y) - (Q.y - P.y) * (S.x - Q.x);
    });
    const convex = cr.every(v => v > 0) || cr.every(v => v < 0);

    bkSpokes(ctx, O, R);
    bkCircle(ctx, O, R, BK_CREAM, 3);
    if (where !== 'on') { bkPt(ctx, D0, BK_FAINT, 4); if (where === 'in') cqOutName(ctx, O, D0, 'D', 'rgba(246, 236, 214, 0.35)', 17); hbSeg(ctx, D0, D, BK_FAINT, 1.6, [4, 4]); }
    hbPoly(ctx, quad, BK_KRAFT, 0.14, 3);

    const ex = { A: (bc + cd) / 2, B: (cd + da) / 2, C: (da + ab) / 2, D: (ab + bc) / 2 };
    const ms = {
      A: hbAngleDeg(A, D, B), B: hbAngleDeg(B, A, C), C: hbAngleDeg(C, B, D), D: hbAngleDeg(D, C, A)
    };
    const cols = { A: BK_TOMATO, B: BK_SKY, C: BK_TOMATO, D: BK_SKY };
    const nb = { A: [D, B], B: [A, C], C: [B, D], D: [C, A] };
    const V = { A, B, C, D };
    Object.keys(V).forEach(k => {
      dkAng(ctx, V[k], nb[k][0], nb[k][1], 22, cols[k]);
      const txt = where === 'on' ? `${ex[k]}°` : `${ms[k].toFixed(1)}°`;
      cqAngTag(ctx, V[k], nb[k][0], nb[k][1], 44, txt, cols[k], 13);
    });
    quad.forEach(P => bkPt(ctx, P, BK_CREAM, 5));
    bkPt(ctx, O, BK_CREAM, 3.5);
    cqOutName(ctx, O, A, 'A', BK_CREAM);
    cqOutName(ctx, O, B, 'B', BK_CREAM);
    cqOutName(ctx, O, C, 'C', BK_CREAM);
    dkName(ctx, hbV(D.x + (D.x - M.x) / (hbDist(M, D) || 1) * 17, D.y + (D.y - M.y) / (hbDist(M, D) || 1) * 17), where === 'on' ? 'D' : "D'", BK_CREAM, 0, 0);

    if (where === 'on') {
      bkRow(ctx, '∠A = {1/2}«BCD»、∠C = {1/2}«DAB»，兩段弧合起來是整個圓', 374, BK_CREAM, 15);
      bkRow(ctx, `∠A + ∠C = ${ex.A}° + ${ex.C}° = {1/2} × 360° = 180°`, 408, BK_TOMATO, 16.5);
      bkRow(ctx, `∠B + ∠D = ${ex.B}° + ${ex.D}° = 180°`, 440, BK_SKY, 16.5);
      bkRow(ctx, '圓內接四邊形的對角互補', 470, BK_OK, 15.5);
      out.innerHTML = wbrEq(`\\angle A + \\angle C = ${ex.A}^\\circ + ${ex.C}^\\circ = 180^\\circ`) + '，<wbr>'
        + wbrEq(`\\angle B + \\angle D = ${ex.B}^\\circ + ${ex.D}^\\circ = 180^\\circ`);
      fb.innerHTML = wrapFeedback(`\\(\\angle A\\)、\\(\\angle C\\) 是兩個圓周角，對的兩段弧 \\(${cqArcT('BCD')}\\)、\\(${cqArcT('DAB')}\\) 拼起來剛好是整個圓 \\(360^\\circ\\)，所以兩角加起來是 \\(180^\\circ\\)：<strong>對角互補</strong>。`);
    } else if (!convex) {
      bkRow(ctx, '四邊形凹進去了，這個位置量不出對角', 410, BK_NO, 16);
      out.innerHTML = '四邊形凹進去了，換一組弧再試';
      fb.innerHTML = wrapFeedback('把 \\(D\\) 放回圓上看看。');
    } else {
      const s1v = ms.A + ms.C, s2v = ms.B + ms.D;
      bkRow(ctx, `D' 不在圓上：A、B、C、D' 不是圓內接四邊形`, 380, BK_CREAM, 15.5);
      bkRow(ctx, `∠A + ∠C ≈ ${s1v.toFixed(1)}°、∠B + ∠D' ≈ ${s2v.toFixed(1)}°`, 414, BK_NO, 16.5);
      bkRow(ctx, '對角互補只對「四個頂點都在圓上」的四邊形成立', 448, BK_CREAM, 15);
      out.innerHTML = `\\(\\angle A + \\angle C \\approx ${s1v.toFixed(1)}^\\circ \\ne 180^\\circ\\)`;
      fb.innerHTML = wrapFeedback(`\\(D'\\) 離開圓之後，\\(\\angle A\\)、\\(\\angle C\\) 不再對著兩段合起來是整個圓的弧，對角就不互補了（四個角加起來仍是 \\(360^\\circ\\)）。`);
    }
    typeset([out, fb]);
    cv._chk = { where, ab, bc, cd, da, ex, ms, convex, O, A, B, C, D };
  }

  bindPickGroup(hbEl('quad-d-group'), 'data-quad-d', m => { where = m; draw(); });
  [s1, s2, s3].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：圓內接四邊形的外角等於內對角（延長一邊；兩組對邊延長相交）
   ========================================================================== */
function initExtCanvas() {
  const cv = hbEl('canvas-ext');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('ext-a'), sb = hbEl('ext-b'), sp = hbEl('ext-p'), sf = hbEl('ext-f');
  const va = hbEl('ext-va'), vb = hbEl('ext-vb'), vp = hbEl('ext-vp'), vf = hbEl('ext-vf');
  const out = hbEl('ext-formula'), fb = hbEl('ext-feedback');
  const C9 = BK_TONE[9];
  let mode = 'ext';

  function drawExt() {
    const A = hbClampSlider(sa, 6, 13) * 10, Bv = hbClampSlider(sb, 6, 13) * 10;
    va.textContent = A + '°'; vb.textContent = Bv + '°';
    drawTitle(ctx, `圓內接四邊形 ABCD，延長 BC 到 E`, C9);
    const g = cqQuadDeg(A, Bv);
    const O = hbV(236, 196), R = 125;
    const P = { A: hbAt(O, g.a, R), B: hbAt(O, g.b, R), C: hbAt(O, g.c, R), D: hbAt(O, g.d, R) };
    const E = hbBeyond(P.B, P.C, 92);
    bkSpokes(ctx, O, R);
    bkCircle(ctx, O, R, BK_CREAM, 3);
    hbPoly(ctx, [P.A, P.B, P.C, P.D], BK_KRAFT, 0.14, 3);
    hbSeg(ctx, P.C, E, BK_CREAM, 3);
    dkAng(ctx, P.A, P.B, P.D, 24, BK_TOMATO);
    cqAngTag(ctx, P.A, P.B, P.D, 46, `${A}°`, BK_TOMATO, 13.5);
    dkAng(ctx, P.C, P.D, E, 24, BK_TOMATO);
    cqAngTag(ctx, P.C, P.D, E, 46, `${A}°`, BK_TOMATO, 13.5);
    dkAng(ctx, P.C, P.B, P.D, 16, BK_SKY);
    dkAng(ctx, P.B, P.A, P.C, 20, BK_LIME);
    cqAngTag(ctx, P.B, P.A, P.C, 40, `${Bv}°`, BK_LIME, 12.5);
    Object.keys(P).forEach(k => { bkPt(ctx, P[k], BK_CREAM, 5); cqOutName(ctx, O, P[k], k, BK_CREAM); });
    bkPt(ctx, E, BK_CREAM, 4.5);
    dkName(ctx, E, 'E', BK_CREAM, 14, 0);
    bkRow(ctx, `∠BAD + ∠BCD = 180°（對角互補），∠BCD = ${180 - A}°`, 380, BK_CREAM, 15.5);
    bkRow(ctx, `∠DCE + ∠BCD = 180°（B、C、E 在一直線上）`, 412, BK_SKY, 15.5);
    bkRow(ctx, `∠DCE = ∠BAD = ${A}°：外角等於內對角`, 446, BK_OK, 17);
    bkRow(ctx, `同樣地，∠ADC = 180° − ∠ABC = ${180 - Bv}°`, 474, MUTED, 13.5);
    out.innerHTML = wbrEq(`\\angle DCE = 180^\\circ - \\angle BCD = \\angle BAD = ${A}^\\circ`);
    fb.innerHTML = wrapFeedback(`\\(\\angle DCE\\) 與 \\(\\angle BAD\\) 都和 \\(\\angle BCD\\) 互補，所以兩者相等：圓內接四邊形的<strong>外角等於它的內對角</strong>。`);
    const Eu = hbBeyond(P.B, P.C, 92);
    cv._chk = { mode, A, B: Bv, P, E: Eu, O, R };
  }

  function drawEF() {
    const A = hbClampSlider(sp, 8, 14) * 5, F = hbClampSlider(sf, 4, 12) * 5;
    vp.textContent = A + '°'; vf.textContent = F + '°';
    const Bv = 180 - A - F, Ev = Bv - A;
    drawTitle(ctx, `AB、DC 延長交於 E；AD、BC 延長交於 F`, C9);
    if (Ev <= 0) {
      bkRow(ctx, `∠A = ${A}°、∠F = ${F}° 時，∠ABC = 180° − ${A}° − ${F}° = ${Bv}°`, 170, BK_CREAM, 16);
      bkRow(ctx, `∠ABC 不比 ∠A 大：AB、DC 延長後不會在 B、C 那一側相交`, 214, BK_NO, 15.5);
      bkRow(ctx, '這個情境不成立：把 ∠A 或 ∠F 調小一點', 256, BK_KRAFT, 16);
      out.innerHTML = `∠ABC = ${Bv}° 不大於 ∠A = ${A}°，E 點不存在（情境不成立）`;
      fb.innerHTML = wrapFeedback(`要讓 \\(E\\) 出現在 \\(B\\)、\\(C\\) 那一側，需要 \\(\\angle ABC \\gt \\angle A\\)，也就是 \\(180^\\circ - 2\\angle A - \\angle F \\gt 0^\\circ\\)。`);
      cv._chk = { mode, A, F, B: Bv, E: Ev, ok: false };
      return;
    }
    const G = cqFitAll(cqExtGeom(A, Bv), 1, { x: 24, y: 48, w: cv.width - 48, h: 290 });
    bkCircle(ctx, G.O, G.R, BK_CREAM, 3);
    hbSeg(ctx, G.A, G.E, BK_CREAM, 2.4);
    hbSeg(ctx, G.D, G.E, BK_CREAM, 2.4);
    hbSeg(ctx, G.A, G.F, BK_CREAM, 2.4);
    hbSeg(ctx, G.B, G.F, BK_CREAM, 2.4);
    hbPoly(ctx, [G.A, G.B, G.C, G.D], BK_KRAFT, 0.16, 3);
    dkAng(ctx, G.A, G.B, G.D, 20, BK_TOMATO);
    cqAngTag(ctx, G.A, G.B, G.D, 40, `${A}°`, BK_TOMATO, 13);
    dkAng(ctx, G.F, G.A, G.B, 20, BK_LIME);
    cqAngTag(ctx, G.F, G.A, G.B, 40, `${F}°`, BK_LIME, 13);
    dkAng(ctx, G.E, G.A, G.D, 20, BK_OK);
    cqAngTag(ctx, G.E, G.A, G.D, 40, `${Ev}°`, BK_OK, 13);
    dkAng(ctx, G.C, G.B, G.D, 14, BK_SKY);
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(k => {
      bkPt(ctx, G[k], BK_CREAM, 4.5);
      const d = hbDist(G.O, G[k]) || 1;
      dkName(ctx, hbV(G[k].x + (G[k].x - G.O.x) / d * 16, G[k].y + (G[k].y - G.O.y) / d * 16), k, BK_CREAM, 0, 0);
    });
    bkRow(ctx, `∠DCB = 180° − ∠A = ${180 - A}°（對角互補）`, 376, BK_SKY, 15.5);
    bkRow(ctx, `∠CBE = ∠A + ∠F = ${A + F}°（△ABF 的外角）`, 408, BK_CREAM, 15.5);
    bkRow(ctx, `∠E = ∠DCB − ∠CBE = ${180 - A}° − ${A + F}° = ${Ev}°（△CBE 的外角）`, 442, BK_OK, 16);
    bkRow(ctx, Ev < 15 ? 'E 離得很遠，畫面已經縮小' : '先用對角互補，再用三角形的外角', 472, MUTED, 13.5);
    out.innerHTML = wbrEq(`\\angle DCB = 180^\\circ - ${A}^\\circ = ${180 - A}^\\circ`) + '，<wbr>'
      + wbrEq(`\\angle CBE = ${A}^\\circ + ${F}^\\circ = ${A + F}^\\circ`) + '，<wbr>'
      + wbrEq(`\\angle E = ${180 - A}^\\circ - ${A + F}^\\circ = ${Ev}^\\circ`);
    fb.innerHTML = wrapFeedback(`\\(\\angle DCB\\) 是 \\(\\triangle CBE\\) 在 \\(C\\) 的外角，等於 \\(\\angle CBE + \\angle E\\)；\\(\\angle CBE\\) 又是 \\(\\triangle ABF\\) 在 \\(B\\) 的外角。兩個外角接力，就把 \\(\\angle E\\) 算出來了。`);
    cv._chk = { mode, A, F, B: Bv, E: Ev, ok: true, G };
  }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ['ext-a-row', 'ext-b-row'].forEach(id => bkShow(id, mode === 'ext'));
    ['ext-p-row', 'ext-f-row'].forEach(id => bkShow(id, mode === 'ef'));
    if (mode === 'ext') drawExt(); else drawEF();
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('ext-mode-group'), 'data-ext-mode', m => { mode = m; draw(); });
  [sa, sb, sp, sf].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}
