/* ==========================================================================
   5-2-1（第五冊 2-1）點、直線與圓之間的位置關係 — 互動 Canvas 與隨堂評量
   畫風：油性粉蠟筆・單車修理鋪（小輪、阿軸），第五冊第 2 章兩節共用。

   共用工具在 ../math-canvas.js（f／fi／drawTitle／textCenter／wrapFeedback／
   wbrEq／typeset／bindPickGroup／drawWithFonts、q* 有理數、hb* 幾何、cg* 尺規…）。
   本節自己的工具一律用 bk 前綴、色票用 BK_ 前綴。

   本檔分三層：
     0. 本節色票（BK_）；
     1. 本節工具（bk）：延長線、有理數 × √m 的字串、邊長標籤、輻條；
        圓弧、扇形、點、一行混排字（bkRich）等圓工具已抽進共用檔；
     2. 13 個互動與評量附圖。

   所有長度一律以「平方值是整數」的方式精確運算（hbRoot 化成最簡根式），
   點與圓、直線與圓的位置一律用「距離的平方」與「半徑的平方」整數比較，
   不靠浮點數判斷（開發約束 27）。畫面上的交點則由 cgLC 等真的去求。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();
  drawWithFonts(initQuizFigs);

  initNameCanvas();
  initArcCanvas();
  initInvCanvas();
  initBowCanvas();
  initPtCanvas();
  initLineCanvas();
  initTanCanvas();
  initTlCanvas();
  initTtCanvas();
  initCtrCanvas();
  initCdCanvas();
  initCmpCanvas();
  initTunCanvas();
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

// 尺規播放引擎（共用檔 cgRender）的配色
cgUsePalette({
  ink: BK_CREAM, honey: BK_KRAFT, brass: '#d9a441', brassDk: '#5b3f0c',
  tools: { compass: BK_KRAFT, ruler: BK_SKY, look: BK_LIME, warn: BK_NO }
});

/* ==========================================================================
   1. 本節工具（bk 前綴）
   ========================================================================== */

// 點 P 往 Q 的方向延長（兩端各延長 ext）
function bkLine(ctx, P, Q, color, w, ext, dash) {
  const a = hbBeyond(Q, P, ext), b = hbBeyond(P, Q, ext);
  hbSeg(ctx, a, b, color, w, dash);
}

/* --------------------------------------------------------------------------
   精確數值的字串：有理數 × √m（m 不含平方因數）；有理數 × π 在共用檔
   -------------------------------------------------------------------------- */

// 有理數 q × √m
function bkSqTex(q, m) {
  const [n, d] = reduce(q[0], q[1]);
  if (m === 1) return texFrac(n, d);
  const top = (n === 1 ? '' : String(n)) + `\\sqrt{${m}}`;
  return d === 1 ? top : `\\frac{${top}}{${d}}`;
}
function bkSqTxt(q, m) {
  const [n, d] = reduce(q[0], q[1]);
  if (m === 1) return d === 1 ? String(n) : `{${n}/${d}}`;
  const top = (n === 1 ? '' : String(n)) + `√${m}`;
  return d === 1 ? top : `{${top}/${d}}`;
}

// √N 化成最簡根式：回傳 { k, m, tex, txt }，√N = k√m
function bkRoot(N) {
  const h = hbRoot(N);
  return { k: h.k, m: h.r, tex: h.tex, txt: h.txt, val: h.val, exact: h.exact };
}

// 邊長標籤：放在 PQ 中點、往遠離 G 的那一側外推（開發約束 18）
function bkSideTag(ctx, P, Q, G, str, color, off, size) {
  const m = hbV((P.x + Q.x) / 2, (P.y + Q.y) / 2);
  const d = hbDist(P, Q) || 1;
  let nx = -(Q.y - P.y) / d, ny = (Q.x - P.x) / d;
  if ((m.x - G.x) * nx + (m.y - G.y) * ny < 0) { nx = -nx; ny = -ny; }
  const k = off || 18;
  bkTag(ctx, str, m.x + nx * k, m.y + ny * k, color, size || 14);
}

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

// 平方的字串（負數加括號）
function bkSqStr(v) {
  return v < 0 ? `(${v})²` : `${v}²`;
}
function bkSqTexP(v) {
  return v < 0 ? `(${v})^2` : `${v}^2`;
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第五冊 2-1 的 26 題正解
  // 正解字母分布：A 7 題、B 6 題、C 7 題、D 6 題（開發約束 36）
  const answers = {
    '2-1-1': 'A',    // 直徑是通過圓心的弦，也是最長的弦
    '2-1-2': 'C',    // 兩半徑與劣弧圍成扇形，圓心角 100°
    '2-1-3': 'B',    // 弧長 8π/3，周長 8π/3 + 24
    '2-1-4': 'D',    // 面積 36π、弧長 8π
    '2-1-5': 'C',    // 40π ÷ 225π = 8/45，圓心角 64°
    '2-1-6': 'A',    // 7π ÷ 36π = 7/36，圓心角 70°
    '2-1-7': 'B',    // 36π − 72
    '2-1-8': 'D',    // 5π + 15
    '2-1-9': 'A',    // OA² = 169 在圓上、OB² = 162 圓內、OC² = 181 圓外
    '2-1-10': 'C',   // ∠A = 55°：AB > BC 在圓 B 外、AC < BC 在圓 C 內
    '2-1-11': 'D',   // r = 13：0、1、2、2
    '2-1-12': 'B',   // M 到圓心 7 或 15：可能交兩點，也可能不相交
    '2-1-13': 'C',   // ∠BOC = 180° − 34° = 146°
    '2-1-14': 'A',   // L ⊥ OP
    '2-1-15': 'B',   // √(37² − 12²) = 35
    '2-1-16': 'D',   // √(41² − 40²) = 9
    '2-1-17': 'C',   // AB = 2 × 20 × 21 ÷ 29 = 840/29
    '2-1-18': 'A',   // ∠AOP = 90° − 24° = 66°
    '2-1-19': 'B',   // 弦的中垂線一定通過圓心
    '2-1-20': 'C',   // 兩條不平行的弦各作中垂線
    '2-1-21': 'D',   // √(17² − 15²) = 8
    '2-1-22': 'A',   // CM = 2，OC = 2√2
    '2-1-23': 'C',   // 弦較短的 AB，弦心距較長
    '2-1-24': 'B',   // 等圓中弦心距相等則弦等長
    '2-1-25': 'A',   // 半徑 25，下午水面寬 40
    '2-1-26': 'D'    // x² = (16 − x)² + 7²
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
const BK_QUIZ_FIGS = {
  // Q13：AB、AC 切圓 O 於 B、C，∠BAC = 34°
  q13(ctx, W, H) {
    const a = 34, R = 55;
    const OA = R / Math.sin(a / 2 * HB_RAD);
    const O = hbV(W / 2 - (OA - R) / 2 - 10, H / 2);
    const A = hbV(O.x + OA, O.y);
    const B = hbAt(O, 90 - a / 2, R), C = hbAt(O, -(90 - a / 2), R);
    bkCircle(ctx, O, R, BK_CREAM, 2.4);
    hbSeg(ctx, A, hbBeyond(A, B, 14), BK_TOMATO, 2.4);
    hbSeg(ctx, A, hbBeyond(A, C, 14), BK_TOMATO, 2.4);
    hbSeg(ctx, O, B, BK_CREAM, 2);
    hbSeg(ctx, O, C, BK_CREAM, 2);
    dkAng(ctx, A, B, C, 34, BK_KRAFT);
    bkTag(ctx, '34°', A.x - 54, A.y, BK_KRAFT, 13);
    [O, A, B, C].forEach(p => bkPt(ctx, p, BK_CREAM, 3.5));
    dkName(ctx, O, 'O', BK_CREAM, -15, 0);
    dkName(ctx, A, 'A', BK_CREAM, 15, 0);
    dkName(ctx, B, 'B', BK_CREAM, -4, -15);
    dkName(ctx, C, 'C', BK_CREAM, -4, 15);
  },

  // Q17：PA、PB 切圓 O 於 A、B，半徑 20、OP = 29（依比例），AB 交 OP 於 M
  q17(ctx, W, H) {
    const r = 20, op = 29, k = 4.3;
    const th = Math.acos(r / op) / HB_RAD;
    const O = hbV(W / 2 - (op - r) * k / 2, H / 2 + 4);
    const P = hbV(O.x + op * k, O.y);
    const A = hbAt(O, th, r * k), B = hbAt(O, -th, r * k);
    const M = hbV(A.x, O.y);
    bkCircle(ctx, O, r * k, BK_CREAM, 2.2);
    hbSeg(ctx, P, A, BK_TOMATO, 2.4);
    hbSeg(ctx, P, B, BK_TOMATO, 2.4);
    hbSeg(ctx, O, P, BK_CREAM, 2);
    hbSeg(ctx, A, B, BK_SKY, 2.2);
    hbSeg(ctx, O, A, BK_CREAM, 1.8, [5, 4]);
    [O, P, A, B, M].forEach(p => bkPt(ctx, p, BK_CREAM, 3.5));
    dkName(ctx, O, 'O', BK_CREAM, -14, 2);
    dkName(ctx, P, 'P', BK_CREAM, 14, 0);
    dkName(ctx, A, 'A', BK_CREAM, 2, -15);
    dkName(ctx, B, 'B', BK_CREAM, 2, 15);
    dkName(ctx, M, 'M', BK_CREAM, 12, 13);
    bkSideTag(ctx, O, A, M, '20', BK_KRAFT, 13, 13);
    bkTag(ctx, '29', (M.x + P.x) / 2 + 4, O.y - 11, BK_KRAFT, 13);
  },

  // Q22：C 在弦 AB 上，AC = 7、BC = 3，弦心距 OM = 2（依比例）
  q22(ctx, W, H) {
    const k = 18, rr = Math.sqrt(29);
    const O = hbV(W / 2, 100);
    const A = hbV(O.x - 5 * k, O.y + 2 * k), B = hbV(O.x + 5 * k, O.y + 2 * k);
    const M = hbV(O.x, O.y + 2 * k), C = hbV(A.x + 7 * k, A.y);
    bkCircle(ctx, O, rr * k, BK_CREAM, 2.2);
    hbSeg(ctx, A, B, BK_TOMATO, 2.6);
    hbSeg(ctx, O, M, BK_SKY, 2.2);
    hbSeg(ctx, O, C, BK_KRAFT, 2, [5, 4]);
    dkAng(ctx, M, O, B, 12, BK_SKY);
    [O, A, B, M, C].forEach(p => bkPt(ctx, p, BK_CREAM, 3.5));
    dkName(ctx, O, 'O', BK_CREAM, 0, -15);
    dkName(ctx, A, 'A', BK_CREAM, -14, 4);
    dkName(ctx, B, 'B', BK_CREAM, 14, 4);
    dkName(ctx, M, 'M', BK_CREAM, -2, 16);
    dkName(ctx, C, 'C', BK_CREAM, 2, 16);
    bkTag(ctx, '7', (A.x + C.x) / 2 - 12, A.y + 30, BK_KRAFT, 13);
    bkTag(ctx, '3', (C.x + B.x) / 2, A.y + 30, BK_KRAFT, 13);
    bkTag(ctx, '2', O.x - 13, O.y + k, BK_SKY, 13);
  }
};

function initQuizFigs() {
  document.querySelectorAll('canvas.quiz-fig[data-fig]').forEach(cv => {
    const fn = BK_QUIZ_FIGS[cv.getAttribute('data-fig')];
    if (!fn) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    fn(ctx, cv.width, cv.height);
  });
}

/* ==========================================================================
   重點 1：圓的名詞（弦、直徑、弧、弓形、圓心角、扇形）
   A、B 對稱放在頂部兩側，∠AOB = t。上方的弧對 t、下方的弧對 360° − t。
   ========================================================================== */
function initNameCanvas() {
  const cv = hbEl('canvas-name');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const st = hbEl('name-t'), vt = hbEl('name-vt');
  const out = hbEl('name-formula'), fb = hbEl('name-feedback');
  const C0 = BK_TONE[0];
  let part = 'chord';

  function draw() {
    const W = cv.width;
    const t = hbClampSlider(st, 20, 340);
    vt.textContent = t + '°';
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '車輪上的名詞：圓 O 上取兩點 A、B', C0);

    const O = hbV(270, 212), R = 132;
    const aA = 90 + t / 2, aB = 90 - t / 2;
    const A = hbAt(O, aA, R), B = hbAt(O, aB, R);
    const semi = t === 180;
    const small = Math.min(t, 360 - t);
    // 上方的弧：aB → aA（對 t）；下方的弧：aA → aB + 360（對 360 − t）
    const topSmall = t < 180;
    const minor = topSmall ? [aB, aA] : [aA, aB + 360];
    const major = topSmall ? [aA, aB + 360] : [aB, aA];
    const Cp = hbAt(O, topSmall ? 270 : 90, R);

    bkSpokes(ctx, O, R);
    bkCircle(ctx, O, R, BK_CREAM, 3);

    let row1 = '', row2 = '', tex = '', fbHtml = '';
    if (part === 'chord') {
      hbSeg(ctx, A, B, BK_TOMATO, 4.5);
      row1 = '弦 [AB]：連接圓上兩點的線段';
      row2 = semi ? '[AB] 通過圓心 O：它是直徑，也是最長的弦' : '[AB] 沒有通過圓心 O：不是直徑';
      tex = semi ? '\\overline{AB}\\ \\text{是直徑}' : `\\angle AOB = ${small}^\\circ`;
      fbHtml = semi ? '\\(\\angle AOB = 180^\\circ\\)，\\(A\\)、\\(O\\)、\\(B\\) 在同一直線上：弦 \\(\\overline{AB}\\) 通過圓心，就是<strong>直徑</strong>。把 \\(t\\) 調離 \\(180^\\circ\\)，弦都比它短。'
        : '弦是圓上<strong>兩點</strong>連成的線段。只有通過圓心的弦才叫<strong>直徑</strong>；把 \\(\\angle AOB\\) 調到 \\(180^\\circ\\) 看看。';
    } else if (part === 'minor' || part === 'major') {
      const arcR = part === 'minor' ? minor : major;
      if (semi) {
        bkArc(ctx, O, R, 0, 180, BK_TEAL_L, 7);
        hbSeg(ctx, A, B, BK_FAINT, 2, [6, 5]);
        row1 = '[AB] 是直徑：兩個弧一樣大';
        row2 = '每一個都叫做半圓';
        tex = '\\angle AOB = 180^\\circ';
        fbHtml = '弦是直徑時，圓被分成兩個一樣大的弧，都叫<strong>半圓</strong>，沒有優弧、劣弧之分。';
      } else {
        bkArc(ctx, O, R, arcR[0], arcR[1], part === 'minor' ? BK_TEAL_L : BK_PLUM, 7);
        hbSeg(ctx, A, B, BK_FAINT, 2, [6, 5]);
        if (part === 'major') { bkPt(ctx, Cp, BK_PLUM); dkName(ctx, Cp, 'C', BK_PLUM, 0, topSmall ? 18 : -18); }
        if (part === 'minor') {
          row1 = '較小的弧是劣弧，記作 «AB»';
          row2 = `兩個端點 A、B 就夠了（兩半徑夾 ${small}°）`;
          tex = `\\overset{\\frown}{AB}\\ \\text{是劣弧}`;
          fbHtml = '弦 \\(\\overline{AB}\\) 把圓分成大小兩個弧。較小的是<strong>劣弧</strong>，通常就記作 \\(\\overset{\\frown}{AB}\\)。';
        } else {
          row1 = '較大的弧是優弧，記作 «ACB»';
          row2 = '在優弧上另取一點 C，寫在 A、B 中間';
          tex = `\\overset{\\frown}{ACB}\\ \\text{是優弧}`;
          fbHtml = '<strong>優弧</strong>要在弧上另取一點 \\(C\\)，寫成 \\(\\overset{\\frown}{ACB}\\)，才不會和劣弧 \\(\\overset{\\frown}{AB}\\) 搞混。';
        }
      }
    } else if (part === 'seg') {
      bkFill(ctx, O, R, minor[0], minor[1], BK_TOMATO, 0.42, false);
      bkFill(ctx, O, R, major[0], major[1], BK_TEAL, 0.16, false);
      hbSeg(ctx, A, B, BK_CREAM, 3);
      row1 = '一條弦和一段弧圍成的圖形：弓形';
      row2 = '一條弦把圓分成兩個弓形（紅色、青綠色）';
      tex = '\\text{弦} \\overline{AB} + \\text{弧}';
      fbHtml = '<strong>弓形</strong>由一條弦和一段弧圍成，不含圓心的那一塊、含圓心的那一塊都是弓形。注意：弓形的邊<strong>沒有半徑</strong>。';
    } else if (part === 'sector') {
      const sm = topSmall ? [aB, aA] : [aA, aB + 360];
      const lg = topSmall ? [aA, aB + 360] : [aB, aA];
      if (!semi) {
        bkFill(ctx, O, R, sm[0], sm[1], BK_KRAFT, 0.42, true);
        bkFill(ctx, O, R, lg[0], lg[1], BK_TEAL, 0.14, true);
      } else {
        bkFill(ctx, O, R, 0, 180, BK_KRAFT, 0.42, true);
        bkFill(ctx, O, R, 180, 360, BK_TEAL, 0.14, true);
      }
      hbSeg(ctx, O, A, BK_CREAM, 3.2);
      hbSeg(ctx, O, B, BK_CREAM, 3.2);
      row1 = '兩條半徑 [OA]、[OB] 和一段弧圍成：扇形';
      row2 = semi ? '圓心角 180°：兩個扇形一樣大（半圓形）' : `「扇形 AOB」通常指圓心角較小的那一個（${small}°）`;
      tex = `\\angle AOB = ${small}^\\circ`;
      fbHtml = '<strong>扇形</strong>的邊是<strong>兩條半徑</strong>加一段弧，所以一定碰到圓心；弓形的邊是弦加弧，不會有半徑。';
    } else {
      hbSeg(ctx, O, A, BK_CREAM, 3.2);
      hbSeg(ctx, O, B, BK_CREAM, 3.2);
      const s0 = topSmall || semi ? aB : aA;
      hbSector(ctx, O, s0, small, 34, BK_KRAFT, { alpha: 0.35, label: `${small}°`, lr: 56, lc: BK_KRAFT });
      if (!semi) hbSector(ctx, O, s0 + small, 360 - small, 22, BK_SKY, { alpha: 0.12, dash: [4, 4] });
      row1 = '頂點在圓心、兩邊是半徑的角：圓心角';
      row2 = semi ? '∠AOB = 180°（平角），另一側也是 180°' : `∠AOB = ${small}°，另一側（藍色虛線）是 ${360 - small}°`;
      tex = `\\angle AOB = ${small}^\\circ`;
      fbHtml = '<strong>圓心角</strong>的頂點一定在<strong>圓心</strong>，兩邊都是半徑。頂點在圓上的角不是圓心角（下一節會學）。';
    }

    bkPt(ctx, O, BK_CREAM, 4.5);
    bkPt(ctx, A, BK_CREAM);
    bkPt(ctx, B, BK_CREAM);
    dkName(ctx, O, 'O', BK_CREAM, part === 'angle' ? 0 : -16, part === 'angle' ? 18 : 6);
    hbVLabel(ctx, A, O, 'A', BK_CREAM, 18);
    hbVLabel(ctx, B, O, 'B', BK_CREAM, 18);

    bkRow(ctx, row1, 384, BK_ROSE, 17);
    bkRow(ctx, row2, 420, BK_OK, 16);
    bkRow(ctx, `把 ∠AOB 調到 180°，弦變成直徑、兩個弧都變成半圓`, 452, MUTED, 13.5);

    out.innerHTML = `\\(${tex}\\)`;
    fb.innerHTML = wrapFeedback(fbHtml);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('name-part-group'), 'data-name-part', m => { part = m; draw(); });
  st.addEventListener('input', draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：弧長、扇形周長與扇形面積
   ========================================================================== */
function initArcCanvas() {
  const cv = hbEl('canvas-arc');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sr = hbEl('arc-r'), sx = hbEl('arc-x'), vr = hbEl('arc-vr'), vx = hbEl('arc-vx');
  const out = hbEl('arc-formula'), fb = hbEl('arc-feedback');
  const C1 = BK_TONE[1];

  function draw() {
    const W = cv.width;
    const r = hbClampSlider(sr, 2, 10);
    const x = hbClampSlider(sx, 1, 23) * 15;
    vr.textContent = r;
    vx.textContent = x + '°';
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `半徑 ${r}、圓心角 ${x}° 的扇形`, C1);

    const O = hbV(270, 200), R = 15 * r;
    const a0 = 90 - x / 2, a1 = 90 + x / 2;
    const A = hbAt(O, a1, R), B = hbAt(O, a0, R);
    bkCircle(ctx, O, R, BK_FAINT, 2, [5, 5]);
    bkFill(ctx, O, R, a0, a1, BK_KRAFT, 0.35, true);
    bkArc(ctx, O, R, a0, a1, BK_TEAL_L, 6);
    hbSeg(ctx, O, A, BK_CREAM, 3);
    hbSeg(ctx, O, B, BK_CREAM, 3);
    hbSector(ctx, O, a0, x, Math.min(26, R * 0.45), BK_KRAFT, { alpha: 0.3 });
    bkTag(ctx, `${x}°`, O.x, O.y + (x > 250 ? -24 : 24), BK_KRAFT, 14);
    bkPt(ctx, O, BK_CREAM, 4);
    bkPt(ctx, A, BK_CREAM); bkPt(ctx, B, BK_CREAM);
    hbVLabel(ctx, A, O, 'A', BK_CREAM, 17);
    hbVLabel(ctx, B, O, 'B', BK_CREAM, 17);
    bkSideTag(ctx, O, B, hbAt(O, 90, R), String(r), BK_CREAM, 14, 13);

    const part = qOf(x, 360);                 // 圓心角占周角的幾分之幾
    const arcQ = qMul(part, 2 * r);           // 弧長 = 2πr × part（π 的係數）
    const areaQ = qMul(part, r * r);          // 面積 = πr² × part
    const pt = part[1] === 1 ? String(part[0]) : `{${part[0]}/${part[1]}}`;
    bkRow(ctx, `${x}° 占周角 360° 的 ${pt}`, 368, BK_CREAM, 16);
    bkRow(ctx, `弧長 «AB» = 2π × ${r} × ${pt} = ${bkPiTxt(arcQ)}`, 400, BK_TEAL_L, 16.5);
    bkRow(ctx, `扇形周長 = «AB» + 2 × ${r} = ${bkPiTxt(arcQ)} + ${2 * r}`, 432, BK_ROSE, 16);
    bkRow(ctx, `扇形面積 = π × ${r} × ${r} × ${pt} = ${bkPiTxt(areaQ)}`, 462, BK_KRAFT, 16);

    const ptT = qTex(part);
    out.innerHTML = '弧長 ' + wbrEq(`\\overset{\\frown}{AB} = 2\\pi \\times ${r} \\times ${ptT} = ${bkPiTex(arcQ)}`)
      + '，<wbr>面積 ' + wbrEq(`\\pi \\times ${r}^2 \\times ${ptT} = ${bkPiTex(areaQ)}`);
    fb.innerHTML = wrapFeedback(`圓心角 \\(${x}^\\circ\\) 是周角的 \\(${ptT}\\)，弧長就是圓周長的 \\(${ptT}\\)、扇形面積就是圓面積的 \\(${ptT}\\)。<br>`
      + `<strong>扇形周長</strong>還要加上兩條半徑：\\(${bkPiTex(arcQ)} + ${2 * r}\\)，不是只有弧長。`);
    typeset([out, fb]);
  }

  [sr, sx].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：由扇形面積或弧長反求圓心角
   面積模式：已知面積 nπ，圓心角 = 360° × n / r²；弧長模式：360° × n / (2r)。
   ========================================================================== */
function initInvCanvas() {
  const cv = hbEl('canvas-inv');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sr = hbEl('inv-r'), sn = hbEl('inv-n'), vr = hbEl('inv-vr'), vn = hbEl('inv-vn'), ln = hbEl('inv-ln');
  const out = hbEl('inv-formula'), fb = hbEl('inv-feedback');
  const C2 = BK_TONE[2];
  let mode = 'area';

  function draw() {
    const W = cv.width;
    const r = hbClampSlider(sr, 2, 10);
    const full = mode === 'area' ? r * r : 2 * r;      // 整個圓（π 的係數）
    const n = hbClampSlider(sn, 1, full - 1);
    vr.textContent = r;
    vn.textContent = n === 1 ? 'π' : n + 'π';
    ln.textContent = mode === 'area' ? '已知扇形面積' : '已知弧長';
    const part = qOf(n, full);
    const xq = qMul(part, 360);
    const xv = qVal(xq);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'area' ? `半徑 ${r}、扇形面積 ${bkPiTxt([n, 1])}，圓心角是多少？`.replace(/[{}]/g, '')
      : `半徑 ${r}、弧長 ${bkPiTxt([n, 1])}，圓心角是多少？`.replace(/[{}]/g, ''), C2);

    const O = hbV(270, 200), R = 15 * r;
    const a0 = 90 - xv / 2, a1 = 90 + xv / 2;
    bkCircle(ctx, O, R, BK_FAINT, 2, [5, 5]);
    if (mode === 'area') bkFill(ctx, O, R, a0, a1, BK_KRAFT, 0.42, true);
    else bkArc(ctx, O, R, a0, a1, BK_TEAL_L, 7);
    const A = hbAt(O, a1, R), B = hbAt(O, a0, R);
    hbSeg(ctx, O, A, BK_CREAM, 2.6);
    hbSeg(ctx, O, B, BK_CREAM, 2.6);
    bkTag(ctx, `? = ${bkDegTxt(xq)}`, O.x, O.y + (xv > 250 ? -26 : 26), BK_KRAFT, 14);
    bkPt(ctx, O, BK_CREAM, 4);
    bkSideTag(ctx, O, B, hbAt(O, 90, R), String(r), BK_CREAM, 14, 13);

    const fullT = bkPiTxt([full, 1]);
    const pt = part[1] === 1 ? String(part[0]) : `{${part[0]}/${part[1]}}`;
    if (mode === 'area') {
      bkRow(ctx, `① 整個圓的面積 = π × ${r} × ${r} = ${fullT}`, 368, BK_CREAM, 16);
      bkRow(ctx, `② 扇形占整個圓的 {${bkPiTxt([n, 1])}/${fullT}} = ${pt}`, 404, BK_KRAFT, 16);
    } else {
      bkRow(ctx, `① 整個圓周長 = 2π × ${r} = ${fullT}`, 368, BK_CREAM, 16);
      bkRow(ctx, `② 弧長占圓周長的 {${bkPiTxt([n, 1])}/${fullT}} = ${pt}`, 404, BK_TEAL_L, 16);
    }
    bkRow(ctx, `③ 圓心角 = 360° × ${pt} = ${bkDegTxt(xq)}`, 442, BK_OK, 17);

    const ptT = qTex(part);
    const nT = bkPiTex([n, 1]), fT = bkPiTex([full, 1]);
    out.innerHTML = (mode === 'area' ? '面積占 ' : '弧長占 ') + wbrEq(`\\frac{${nT}}{${fT}} = ${ptT}`)
      + '，<wbr>圓心角 ' + wbrEq(`360^\\circ \\times ${ptT} = ${hbDegTex(xq[0], xq[1])}`);
    fb.innerHTML = wrapFeedback((mode === 'area'
      ? `也可以列方程式：\\(\\pi \\times ${r}^2 \\times \\frac{x}{360} = ${nT}\\)，解出 \\(x\\) 是同一個答案。`
      : `也可以列方程式：\\(2\\pi \\times ${r} \\times \\frac{x}{360} = ${nT}\\)，解出 \\(x\\) 是同一個答案。`)
      + '<br>先算「占整個圓的幾分之幾」，再乘 \\(360^\\circ\\)，比較不會算錯。');
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('inv-mode-group'), 'data-inv-mode', m => { mode = m; draw(); });
  [sr, sn].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：弓形的面積與周長（圓心角 60°、90°、120°）
   ========================================================================== */
function initBowCanvas() {
  const cv = hbEl('canvas-bow');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sr = hbEl('bow-r'), vr = hbEl('bow-vr');
  const out = hbEl('bow-formula'), fb = hbEl('bow-feedback');
  const C3 = BK_TONE[3];
  let th = 120;

  function draw() {
    const W = cv.width;
    const r = hbClampSlider(sr, 2, 10);
    vr.textContent = r;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `半徑 ${r}、∠AOB = ${th}° 的弓形`, C3);

    const O = hbV(270, 204), R = 15 * r;
    const a0 = 90 - th / 2, a1 = 90 + th / 2;
    const A = hbAt(O, a1, R), B = hbAt(O, a0, R);
    bkCircle(ctx, O, R, BK_FAINT, 2, [5, 5]);
    hbPoly(ctx, [O, A, B], BK_SKY, 0.16, 2);
    bkFill(ctx, O, R, a0, a1, BK_TOMATO, 0.5, false);
    bkArc(ctx, O, R, a0, a1, BK_ROSE, 5);
    hbSeg(ctx, A, B, BK_ROSE, 4);
    dkAng(ctx, O, A, B, Math.min(24, R * 0.4), BK_KRAFT);
    bkPt(ctx, O, BK_CREAM, 4); bkPt(ctx, A, BK_CREAM); bkPt(ctx, B, BK_CREAM);
    dkName(ctx, O, 'O', BK_CREAM, 0, 18);
    hbVLabel(ctx, A, O, 'A', BK_CREAM, 17);
    hbVLabel(ctx, B, O, 'B', BK_CREAM, 17);
    bkSideTag(ctx, O, A, B, String(r), BK_CREAM, 14, 13);

    const secQ = qOf(r * r * th, 360);         // 扇形面積（π 的係數）
    const arcQ = qOf(2 * r * th, 360);         // 弧長（π 的係數）
    let triQ, triM, chQ, chM, triWhy, chWhy;
    if (th === 90) {
      triQ = qOf(r * r, 2); triM = 1; chQ = qOf(r, 1); chM = 2;
      triWhy = `△AOB 是直角三角形 = {1/2} × ${r} × ${r} = ${bkSqTxt(triQ, 1)}`;
      chWhy = `[AB] = √(${r * r} + ${r * r}) = ${bkSqTxt(chQ, 2)}`;
    } else if (th === 60) {
      triQ = qOf(r * r, 4); triM = 3; chQ = qOf(r, 1); chM = 1;
      triWhy = `△AOB 是正三角形 = {√3/4} × ${r} × ${r} = ${bkSqTxt(triQ, 3)}`;
      chWhy = `正三角形三邊相等：[AB] = ${r}`;
    } else {
      triQ = qOf(r * r, 4); triM = 3; chQ = qOf(r, 1); chM = 3;
      triWhy = `高 = ${bkSqTxt(qOf(r, 2), 1)}、底 [AB] = ${bkSqTxt(chQ, 3)}，△AOB = ${bkSqTxt(triQ, 3)}`;
      chWhy = `30°-60°-90°：[AB] = 2 × ${bkSqTxt(qOf(r, 2), 3)} = ${bkSqTxt(chQ, 3)}`;
    }
    const triT = bkSqTxt(triQ, triM), chT = bkSqTxt(chQ, chM);
    const partT = th === 90 ? '{1/4}' : th === 60 ? '{1/6}' : '{1/3}';
    bkRow(ctx, `扇形 AOB = π × ${r} × ${r} × ${partT} = ${bkPiTxt(secQ)}`, 356, BK_KRAFT, 15.5);
    bkRow(ctx, triWhy, 384, BK_SKY, 15);
    bkRow(ctx, chWhy, 410, BK_CREAM, 14.5);
    bkRow(ctx, `弓形面積 = 扇形 − △AOB = ${bkPiTxt(secQ)} − ${triT}`, 438, BK_ROSE, 16.5);
    bkRow(ctx, `弓形周長 = «AB» + [AB] = ${bkPiTxt(arcQ)} + ${chT}`, 466, BK_TEAL_L, 16.5);

    const area = `${bkPiTex(secQ)} - ${bkSqTex(triQ, triM)}`;
    const peri = `${bkPiTex(arcQ)} + ${bkSqTex(chQ, chM)}`;
    out.innerHTML = '面積 ' + wbrEq(area) + '，<wbr>周長 ' + wbrEq(peri);
    const why = th === 90 ? `\\(\\triangle AOB\\) 是等腰直角三角形，\\(\\overline{AB} = ${bkSqTex(chQ, 2)}\\)。`
      : th === 60 ? `\\(\\overline{OA} = \\overline{OB}\\) 且夾 \\(60^\\circ\\)，\\(\\triangle AOB\\) 是正三角形，\\(\\overline{AB} = ${r}\\)。`
        : `從 \\(O\\) 作 \\(\\overline{AB}\\) 的垂線，切出兩個 \\(30^\\circ\\)-\\(60^\\circ\\)-\\(90^\\circ\\) 三角形，\\(\\overline{AB} = ${bkSqTex(chQ, 3)}\\)。`;
    fb.innerHTML = wrapFeedback(`弓形 ＝ 扇形 − 三角形。${why}<br>弓形的周長是<strong>弧加弦</strong>，沒有半徑；扇形的周長才是弧加兩條半徑。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('bow-ang-group'), 'data-bow-ang', m => { th = parseInt(m, 10); draw(); });
  sr.addEventListener('input', draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：點與圓的位置關係（坐標方格上，OP² 與 r² 整數比較）
   ========================================================================== */
function initPtCanvas() {
  const cv = hbEl('canvas-pt');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sx = hbEl('pt-x'), sy = hbEl('pt-y'), sr = hbEl('pt-r');
  const vx = hbEl('pt-vx'), vy = hbEl('pt-vy'), vr = hbEl('pt-vr');
  const out = hbEl('pt-formula'), fb = hbEl('pt-feedback');
  const C4 = BK_TONE[4];
  const O = hbV(270, 196), U = 21;
  const toC = (x, y) => hbV(O.x + x * U, O.y - y * U);

  function draw() {
    const W = cv.width;
    const px = hbClampSlider(sx, -6, 6), py = hbClampSlider(sy, -6, 6), r = hbClampSlider(sr, 1, 6);
    vx.textContent = px; vy.textContent = py; vr.textContent = r;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `圓 O 的半徑 r = ${r}，P(${px}, ${py}) 在哪裡？`, C4);

    ctx.save();
    ctx.strokeStyle = 'rgba(246, 236, 214, 0.08)';
    ctx.lineWidth = 1;
    for (let i = -7; i <= 7; i++) {
      const a = toC(i, -7), b = toC(i, 7), c = toC(-7, i), d = toC(7, i);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
    }
    ctx.restore();
    hbSeg(ctx, toC(-7, 0), toC(7, 0), 'rgba(246, 236, 214, 0.22)', 1.4);
    hbSeg(ctx, toC(0, -7), toC(0, 7), 'rgba(246, 236, 214, 0.22)', 1.4);

    const N = px * px + py * py, R2 = r * r;
    const where = N < R2 ? 'in' : N === R2 ? 'on' : 'out';
    const P = toC(px, py);
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = BK_KRAFT;
    ctx.beginPath(); ctx.arc(O.x, O.y, r * U, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    bkCircle(ctx, O, r * U, BK_TOMATO, 3.4);
    if (N > 0) hbSeg(ctx, O, P, BK_SKY, 2.6, [6, 4]);
    bkPt(ctx, O, BK_CREAM, 4);
    dkName(ctx, O, 'O', BK_CREAM, -12, 14);
    const col = where === 'in' ? BK_KRAFT : where === 'on' ? BK_TOMATO : BK_SKY;
    bkPt(ctx, P, col, 6.5);
    dkName(ctx, P, 'P', col, 14, -14);

    const op = bkRoot(N);
    const opT = N === 0 ? '0' : op.exact ? String(op.k) : `√${N}` + (op.k > 1 ? ` = ${op.txt}` : '');
    bkRow(ctx, `[OP] = √(${bkSqStr(px)} + ${bkSqStr(py)}) = ${opT}`.replace('√(', '√ ('), 380, BK_SKY, 16.5);
    const cmp = where === 'in' ? '<' : where === 'on' ? '=' : '>';
    bkRow(ctx, `比平方：[OP]² = ${N} ${cmp} ${R2} = r²`, 414, BK_CREAM, 16);
    const word = where === 'in' ? 'P 在圓內' : where === 'on' ? 'P 在圓上' : 'P 在圓外';
    bkRow(ctx, `[OP] ${cmp} r，所以 ${word}`, 448, col, 18);

    const opTex = N === 0 ? '0' : op.tex;
    const rel = where === 'in' ? '\\lt' : where === 'on' ? '=' : '\\gt';
    out.innerHTML = wbrEq(`\\overline{OP} = \\sqrt{${bkSqTexP(px)} + ${bkSqTexP(py)}} = ${opTex}`) + '<wbr>' + `\\( {}${rel} ${r} = r\\)`;
    fb.innerHTML = wrapFeedback(where === 'in'
      ? '\\(\\overline{OP} \\lt r\\)：\\(P\\) 在<strong>圓內</strong>（黃色區域）。圓心 \\(O\\) 本身也算圓內。'
      : where === 'on'
        ? '\\(\\overline{OP} = r\\)：\\(P\\) 剛好在<strong>圓上</strong>。圓就是「到圓心距離等於半徑」的所有點。'
        : '\\(\\overline{OP} \\gt r\\)：\\(P\\) 在<strong>圓外</strong>。只要比距離和半徑，不必看圖。');
    typeset([out, fb]);
  }

  // 點方格也能放 P
  cv.addEventListener('click', e => {
    const p = canvasPos(cv, e);
    const gx = Math.round((p.x - O.x) / U), gy = Math.round((O.y - p.y) / U);
    if (Math.abs(gx) > 6 || Math.abs(gy) > 6) return;
    sx.value = gx; sy.value = gy;
    draw();
  });
  [sx, sy, sr].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：直線與圓的位置關係（圓心到直線的距離 d 與半徑 r）
   題目可能給半徑，也可能給直徑；比較一律用「2d 與 2r」整數比較。
   ========================================================================== */
function initLineCanvas() {
  const cv = hbEl('canvas-line');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sg = hbEl('line-g'), sd = hbEl('line-d'), vg = hbEl('line-vg'), vd = hbEl('line-vd'), lg = hbEl('line-lg');
  const out = hbEl('line-formula'), fb = hbEl('line-feedback');
  const C5 = BK_TONE[5];
  let give = 'r';

  function draw() {
    const W = cv.width;
    const g = give === 'r' ? hbClampSlider(sg, 1, 8) : hbClampSlider(sg, 2, 16);
    const d = hbClampSlider(sd, 0, 10);
    vg.textContent = g; vd.textContent = d;
    lg.textContent = give === 'r' ? '題目給的半徑' : '題目給的直徑';
    const r2 = give === 'r' ? 2 * g : g;        // 2r（整數）
    const rq = qOf(r2, 2);
    const rv = r2 / 2;
    const rel = 2 * d < r2 ? 2 : 2 * d === r2 ? 1 : 0;    // 交點個數
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, give === 'r' ? `半徑 ${g}，圓心到直線 L 的距離 ${d}` : `直徑 ${g}，圓心到直線 L 的距離 ${d}`, C5);

    const span = rv + Math.max(rv, d);
    const k = Math.min(17, 262 / span);
    const O = hbV(270, 56 + k * rv + (262 - k * span) / 2);
    const R = k * rv;
    const Ly = O.y + k * d;
    const L0 = hbV(28, Ly), L1 = hbV(W - 28, Ly);
    const P = hbV(O.x, Ly);

    ctx.save();
    ctx.globalAlpha = 0.14; ctx.fillStyle = BK_KRAFT;
    ctx.beginPath(); ctx.arc(O.x, O.y, R, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    bkSpokes(ctx, O, R);
    bkCircle(ctx, O, R, BK_CREAM, 3.2);
    const lcol = rel === 0 ? BK_SKY : rel === 1 ? BK_TOMATO : BK_LIME;
    hbSeg(ctx, L0, L1, lcol, 3.4);
    textCenter(ctx, 'L', L1.x - 6, Ly - 14, lcol, fi(800, 17));

    // 半徑：往左上畫一條
    const Rp = hbAt(O, 145, R);
    hbSeg(ctx, O, Rp, BK_KRAFT, 2.4);
    bkTag(ctx, `r = ${rq[1] === 1 ? rq[0] : `{${rq[0]}/${rq[1]}}`}`, (O.x + Rp.x) / 2 - 22, (O.y + Rp.y) / 2 - 12, BK_KRAFT, 13);

    if (d > 0) {
      hbSeg(ctx, O, P, BK_SKY, 2.4, [6, 4]);
      dkAng(ctx, P, O, L1, 11, BK_SKY);
      bkTag(ctx, `d = ${d}`, O.x + 30, (O.y + P.y) / 2, BK_SKY, 13);
    }
    // 交點：真的用直線與圓求交
    const xs = cgLC(L0, L1, O, R);
    const nPts = rel;  // 精確判斷（浮點交點只用來畫）
    if (nPts === 2) xs.forEach(q => bkPt(ctx, q, BK_LIME, 6));
    if (nPts === 1) bkPt(ctx, P, BK_TOMATO, 6.5);
    bkPt(ctx, O, BK_CREAM, 4);
    dkName(ctx, O, 'O', BK_CREAM, 15, -12);
    if (d > 0 && nPts !== 1) dkName(ctx, P, 'P', BK_SKY, 14, 16);
    if (nPts === 1) dkName(ctx, P, 'P', BK_TOMATO, 14, 16);

    const rT = rq[1] === 1 ? String(rq[0]) : `{${rq[0]}/${rq[1]}}`;
    bkRow(ctx, give === 'r' ? `半徑 r = ${g}` : `直徑 ${g}，半徑 r = 直徑的一半 = ${rT}`, 374, BK_KRAFT, 16);
    const cmp = rel === 2 ? '<' : rel === 1 ? '=' : '>';
    bkRow(ctx, `圓心到 L 的距離 d = ${d} ${cmp} ${rT} = r`, 408, BK_SKY, 16.5);
    const word = rel === 0 ? '不相交：0 個交點' : rel === 1 ? 'L 是切線：恰好 1 個交點（切點 P）' : 'L 是割線：2 個交點';
    bkRow(ctx, word, 444, lcol, 18);

    const relT = rel === 2 ? '\\lt' : rel === 1 ? '=' : '\\gt';
    out.innerHTML = `\\(d = ${d}\\)<wbr>\\( {}${relT} ${qTex(rq)} = r\\)，<wbr>交點 \\(${rel}\\) 個`;
    fb.innerHTML = wrapFeedback((give === 'd' ? '題目給的是<strong>直徑</strong>，要先除以 2 變成半徑再比。<br>' : '')
      + (rel === 0 ? '\\(d \\gt r\\)：\\(L\\) 上每一點都在圓外，直線與圓<strong>不相交</strong>。'
        : rel === 1 ? '\\(d = r\\)：垂足 \\(P\\) 剛好在圓上，其餘的點都在圓外，\\(L\\) 是<strong>切線</strong>、\\(P\\) 是<strong>切點</strong>。'
          : '\\(d \\lt r\\)：垂足 \\(P\\) 在圓內，\\(L\\) 穿過圓、交於兩點，是<strong>割線</strong>。'));
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('line-give-group'), 'data-line-give', m => {
    // 切換給法時保持同一個圓：半徑 ↔ 直徑
    const v = hbIv(sg);
    give = m;
    sg.value = m === 'd' ? Math.min(16, v * 2) : Math.max(1, Math.round(v / 2));
    draw();
  });
  [sg, sd].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：切線的性質
   turn：P 是車輪碰地的那一點，直線繞 P 轉，與 PO 夾 φ；φ = 90° 才是切線。
   quad：AB、AC 切圓於 B、C，∠BOC = 360° − 90° − 90° − ∠A。
   ========================================================================== */
function initTanCanvas() {
  const cv = hbEl('canvas-tan');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = hbEl('tan-phi'), sa = hbEl('tan-a'), vp = hbEl('tan-vphi'), va = hbEl('tan-va');
  const out = hbEl('tan-formula'), fb = hbEl('tan-feedback');
  const C6 = BK_TONE[6];
  let mode = 'turn';

  function drawTurn() {
    const W = cv.width;
    const phi = hbClampSlider(sp, 6, 30) * 5;
    vp.textContent = phi + '°';
    drawTitle(ctx, `過圓上一點 P 的直線 L，和半徑 OP 夾 ${phi}°`, C6);
    const O = hbV(270, 178), R = 112;
    const P = hbAt(O, 270, R);
    const dir = hbUnit(90 - phi);          // L 的方向（數學角）
    const L0 = hbV(P.x - dir.x * 250, P.y - dir.y * 250), L1 = hbV(P.x + dir.x * 250, P.y + dir.y * 250);
    bkSpokes(ctx, O, R);
    bkCircle(ctx, O, R, BK_CREAM, 3.2);
    hbSeg(ctx, O, P, BK_KRAFT, 3);
    const tan = phi === 90;
    const lcol = tan ? BK_TOMATO : BK_LIME;
    hbSeg(ctx, L0, L1, lcol, 3.4);
    // 夾角記號（PO 與 L 往右的那一段）
    dkAng(ctx, P, O, L1, 24, BK_SKY);
    const lab = hbAt(P, (hbHead(P, O) + hbHead(P, L1)) / 2, 44);
    bkTag(ctx, `${phi}°`, lab.x, lab.y, BK_SKY, 13);

    const xs = cgLC(L0, L1, O, R);
    let other = null;
    if (!tan) other = xs.slice().sort((u, v) => hbDist(v, P) - hbDist(u, P))[0];
    let rowB, rowC, texB, fbHtml;
    if (tan) {
      const Q = hbV(P.x + dir.x * 120, P.y + dir.y * 120);
      hbSeg(ctx, O, Q, BK_SKY, 2.2, [6, 4]);
      bkPt(ctx, Q, BK_SKY, 5);
      dkName(ctx, Q, 'Q', BK_SKY, 4, 16);
      const ratio = hbDist(O, Q) / R;
      rowB = `L 上其他點 Q：[OQ] 是直角△OPQ 的斜邊，[OQ] > [OP] = r`;
      rowC = `所以 Q 在圓外，L 只碰到圓一點 P：L 是切線`;
      texB = `\\overline{OQ} \\approx ${ratio.toFixed(2)}\\,r \\gt r`;
      fbHtml = '\\(L \\perp \\overline{OP}\\)：\\(L\\) 上除了 \\(P\\)，每一點到 \\(O\\) 的距離都是直角三角形的<strong>斜邊</strong>，比半徑長，所以都在圓外——\\(L\\) 是<strong>切線</strong>。';
    } else {
      bkPt(ctx, other, BK_LIME, 6);
      dkName(ctx, other, "P'", BK_LIME, 14, -12);
      const chord = hbDist(P, other) / R;
      rowB = `L 又穿過圓上另一點 P'：交於兩點`;
      rowC = `沒有垂直 [OP]，L 是割線，不是切線`;
      texB = `\\overline{PP'} \\approx ${chord.toFixed(2)}\\,r`;
      fbHtml = `\\(L\\) 和 \\(\\overline{OP}\\) 夾 \\(${phi}^\\circ\\)，不是直角，它還會從圓上另一點 \\(P'\\) 穿出來，是<strong>割線</strong>。調到 \\(90^\\circ\\) 看看。`;
    }
    bkPt(ctx, O, BK_CREAM, 4); bkPt(ctx, P, BK_TOMATO, 6);
    dkName(ctx, O, 'O', BK_CREAM, -14, -10);
    dkName(ctx, P, 'P', BK_TOMATO, -14, 16);
    bkRow(ctx, tan ? `∠OPQ = 90°：L ⊥ [OP]` : `∠ = ${phi}° ≠ 90°`, 386, BK_SKY, 16.5);
    bkRow(ctx, rowB, 418, BK_CREAM, 15.5);
    bkRow(ctx, rowC, 450, lcol, 16.5);
    out.innerHTML = tan ? `\\(L \\perp \\overline{OP}\\)，<wbr>\\(${texB}\\)` : `夾角 \\(${phi}^\\circ \\ne 90^\\circ\\)，<wbr>\\(${texB}\\)`;
    fb.innerHTML = wrapFeedback(fbHtml);
  }

  function drawQuad() {
    const W = cv.width;
    const a = hbClampSlider(sa, 4, 32) * 5;
    va.textContent = a + '°';
    drawTitle(ctx, `AB、AC 切圓 O 於 B、C，∠A = ${a}°`, C6);
    const R = Math.min(96, 300 * Math.sin(a / 2 * HB_RAD));
    const OA = R / Math.sin(a / 2 * HB_RAD);
    const O = hbV(270 - (OA - R) / 2, 210);
    const A = hbV(O.x + OA, O.y);
    const B = hbAt(O, 90 - a / 2, R), C = hbAt(O, -(90 - a / 2), R);
    bkCircle(ctx, O, R, BK_CREAM, 3);
    hbPoly(ctx, [A, B, O, C], BK_KRAFT, 0.12, 0.01);
    hbSeg(ctx, A, hbBeyond(A, B, 22), BK_TOMATO, 3.2);
    hbSeg(ctx, A, hbBeyond(A, C, 22), BK_TOMATO, 3.2);
    hbSeg(ctx, O, B, BK_CREAM, 2.6);
    hbSeg(ctx, O, C, BK_CREAM, 2.6);
    dkAng(ctx, B, O, A, 13, BK_SKY);
    dkAng(ctx, C, O, A, 13, BK_SKY);
    dkAng(ctx, A, B, C, 30, BK_KRAFT);
    dkAng(ctx, O, B, C, 22, BK_LIME);
    if (a >= 100) bkTag(ctx, `${a}°`, A.x + 44, A.y + 22, BK_KRAFT, 13);
    else bkTag(ctx, `${a}°`, A.x - 52, A.y, BK_KRAFT, 13);
    if (180 - a >= 60) bkTag(ctx, `${180 - a}°`, O.x + 40, O.y, BK_LIME, 13);
    else bkTag(ctx, `${180 - a}°`, O.x - 34, O.y + 26, BK_LIME, 13);
    [O, A, B, C].forEach(p => bkPt(ctx, p, BK_CREAM, 4.5));
    dkName(ctx, O, 'O', BK_CREAM, -16, 0);
    dkName(ctx, A, 'A', BK_CREAM, 16, 0);
    dkName(ctx, B, 'B', BK_CREAM, -2, -17);
    dkName(ctx, C, 'C', BK_CREAM, -2, 17);
    bkRow(ctx, `切線垂直過切點的半徑：∠ABO = ∠ACO = 90°`, 386, BK_SKY, 16);
    bkRow(ctx, `四邊形 ABOC 的內角和是 360°`, 416, BK_CREAM, 15.5);
    bkRow(ctx, `∠BOC = 360° − 90° − 90° − ${a}° = ${180 - a}°`, 450, BK_LIME, 17.5);
    out.innerHTML = wbrEq(`\\angle BOC = 360^\\circ - 90^\\circ - 90^\\circ - ${a}^\\circ = ${180 - a}^\\circ`);
    fb.innerHTML = wrapFeedback(`兩個直角加起來 \\(180^\\circ\\)，所以 \\(\\angle A\\) 與 \\(\\angle BOC\\) <strong>互補</strong>：\\(${a}^\\circ + ${180 - a}^\\circ = 180^\\circ\\)。`);
  }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    bkShow('tan-phi-row', mode === 'turn');
    bkShow('tan-a-row', mode === 'quad');
    if (mode === 'turn') drawTurn(); else drawQuad();
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('tan-mode-group'), 'data-tan-mode', m => { mode = m; draw(); });
  [sp, sa].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：切線段長（連半徑，畢氏定理）
   pa：已知半徑 r 與 OP，求切線段 PA；r：已知 PA 與 OP，求半徑。
   ========================================================================== */
function initTlCanvas() {
  const cv = hbEl('canvas-tl');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const s1 = hbEl('tl-s1'), s2 = hbEl('tl-s2'), v1 = hbEl('tl-v1'), v2 = hbEl('tl-v2'), l1 = hbEl('tl-l1');
  const out = hbEl('tl-formula'), fb = hbEl('tl-feedback');
  const C7 = BK_TONE[7];
  let mode = 'pa';

  function draw() {
    const W = cv.width;
    let r2, pa2, op;
    if (mode === 'pa') {
      const r = hbClampSlider(s1, 1, 9);
      op = hbClampSlider(s2, r + 1, 15);
      r2 = r * r; pa2 = op * op - r2;
      v1.textContent = r; l1.textContent = '半徑 r';
    } else {
      const pa = hbClampSlider(s1, 1, 12);
      op = hbClampSlider(s2, pa + 1, 15);
      pa2 = pa * pa; r2 = op * op - pa2;
      v1.textContent = pa; l1.textContent = '切線段 PA';
    }
    v2.textContent = op;
    const rR = bkRoot(r2), paR = bkRoot(pa2);
    const rv = Math.sqrt(r2), pav = Math.sqrt(pa2);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'pa' ? `半徑 ${rR.txt}、[OP] = ${op}，切線段 [PA] 多長？`.replace(/[\[\]]/g, '')
      : `[PA] = ${paR.txt}、[OP] = ${op}，半徑多長？`.replace(/[\[\]]/g, ''), C7);

    const k = Math.min(400 / (rv + op), 150 / rv);
    const O = hbV(270 + (rv - op) * k / 2, 214);
    const P = hbV(O.x + op * k, O.y);
    const th = Math.acos(rv / op) / HB_RAD;
    const A = hbAt(O, th, rv * k);
    bkSpokes(ctx, O, rv * k);
    bkCircle(ctx, O, rv * k, BK_CREAM, 3);
    bkLine(ctx, P, A, 'rgba(240, 100, 60, 0.35)', 2, 60);
    hbPoly(ctx, [O, A, P], BK_KRAFT, 0.1, 0.01);
    hbSeg(ctx, O, A, BK_KRAFT, 3);
    hbSeg(ctx, A, P, BK_TOMATO, 4);
    hbSeg(ctx, O, P, BK_SKY, 2.6);
    dkAng(ctx, A, O, P, 13, BK_CREAM);
    [O, A, P].forEach(p => bkPt(ctx, p, BK_CREAM, 4.5));
    dkName(ctx, O, 'O', BK_CREAM, -15, 6);
    dkName(ctx, A, 'A', BK_CREAM, -4, -17);
    dkName(ctx, P, 'P', BK_CREAM, 14, 6);
    const G = hbCentroid([O, A, P]);
    bkSideTag(ctx, O, A, G, mode === 'pa' ? `r = ${rR.txt}` : 'r = ?', BK_KRAFT, 18, 13);
    bkSideTag(ctx, A, P, G, mode === 'pa' ? '?' : paR.txt, BK_TOMATO, 16, 13);
    bkSideTag(ctx, O, P, G, String(op), BK_SKY, 16, 13);

    bkRow(ctx, '連接 [OA]：[OA] ⊥ [AP]，△OAP 是直角三角形', 372, BK_CREAM, 15.5);
    const ansR = mode === 'pa' ? paR : rR;
    const N = mode === 'pa' ? pa2 : r2;
    const tail = ansR.exact ? `= ${ansR.k}` : (ansR.k > 1 ? `= ${ansR.txt}` : '');
    if (mode === 'pa') {
      bkRow(ctx, `斜邊是 [OP]：[PA] = √([OP]² − [OA]²)`, 404, BK_SKY, 16);
      bkRow(ctx, `= √(${op * op} − ${r2}) = √${N} ${tail}`, 436, BK_TOMATO, 17.5);
    } else {
      bkRow(ctx, `斜邊是 [OP]：[OA] = √([OP]² − [PA]²)`, 404, BK_SKY, 16);
      bkRow(ctx, `= √(${op * op} − ${pa2}) = √${N} ${tail}`, 436, BK_KRAFT, 17.5);
    }
    bkRow(ctx, '切線段是「圓外一點到切點」那一段，量得到長度', 462, MUTED, 13.5);

    const lhs = mode === 'pa' ? '\\overline{PA}' : '\\overline{OA}';
    const sub = mode === 'pa' ? `${op}^2 - ${rR.exact ? rR.k + '^2' : '(' + rR.tex + ')^2'}` : `${op}^2 - ${paR.exact ? paR.k + '^2' : '(' + paR.tex + ')^2'}`;
    const mid = (!ansR.exact && ansR.k > 1) ? `\\sqrt{${N}} = ` : '';
    out.innerHTML = wbrEq(`${lhs} = \\sqrt{${sub}} = ${mid}${ansR.tex}`);
    fb.innerHTML = wrapFeedback('先連半徑 \\(\\overline{OA}\\)：切線垂直過切點的半徑，三角形的直角在切點 \\(A\\)，<strong>斜邊是 \\(\\overline{OP}\\)</strong>。<br>求切線段或半徑都是「斜邊平方減另一股平方」，不是相加。');
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('tl-mode-group'), 'data-tl-mode', m => { mode = m; draw(); });
  [s1, s2].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：切線段性質（PA = PB、PO 平分 ∠APB、PO 垂直平分 AB）
   eq：等長、平分與四邊形周長；ab：用面積求切點連線 AB。
   ========================================================================== */
function initTtCanvas() {
  const cv = hbEl('canvas-tt');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sr = hbEl('tt-r'), so = hbEl('tt-op'), vr = hbEl('tt-vr'), vo = hbEl('tt-vop');
  const out = hbEl('tt-formula'), fb = hbEl('tt-feedback');
  const C8 = BK_TONE[8];
  let mode = 'eq';

  function draw() {
    const W = cv.width;
    const r = hbClampSlider(sr, 2, 8);
    const op = hbClampSlider(so, r + 1, 14);
    vr.textContent = r; vo.textContent = op;
    const pa = bkRoot(op * op - r * r);
    const amQ = qOf(r * pa.k, op), abQ = qOf(2 * r * pa.k, op);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `PA、PB 切圓 O 於 A、B：半徑 ${r}、OP = ${op}`, C8);

    const k = Math.min(400 / (r + op), 140 / r);
    const O = hbV(270 + (r - op) * k / 2, 200);
    const P = hbV(O.x + op * k, O.y);
    const th = Math.acos(r / op) / HB_RAD;
    const A = hbAt(O, th, r * k), B = hbAt(O, -th, r * k);
    const M = hbV(A.x, O.y);
    bkSpokes(ctx, O, r * k);
    bkCircle(ctx, O, r * k, BK_CREAM, 3);
    hbPoly(ctx, [O, A, P, B], BK_KRAFT, 0.1, 0.01);
    hbSeg(ctx, O, A, BK_KRAFT, 2.6);
    hbSeg(ctx, O, B, BK_KRAFT, 2.6);
    hbSeg(ctx, P, A, BK_TOMATO, 3.6);
    hbSeg(ctx, P, B, BK_TOMATO, 3.6);
    hbSeg(ctx, O, P, BK_SKY, 2.4);
    dkAng(ctx, A, O, P, 12, BK_CREAM);
    dkAng(ctx, B, O, P, 12, BK_CREAM);
    hbTick(ctx, P, A, 2, BK_TOMATO);
    hbTick(ctx, P, B, 2, BK_TOMATO);
    const angP = Math.asin(r / op) / HB_RAD;
    if (mode === 'eq') {
      hbSector(ctx, P, 180 - angP, angP, 40, BK_LIME, { alpha: 0.25 });
      hbSector(ctx, P, 180, angP, 30, BK_LIME, { alpha: 0.25 });
    } else {
      hbSeg(ctx, A, B, BK_PLUM, 3);
      dkAng(ctx, M, A, P, 11, BK_PLUM);
      hbTick(ctx, A, M, 1, BK_PLUM);
      hbTick(ctx, M, B, 1, BK_PLUM);
      bkPt(ctx, M, BK_PLUM, 4);
      dkName(ctx, M, 'M', BK_PLUM, 13, 14);
    }
    [O, A, B, P].forEach(p => bkPt(ctx, p, BK_CREAM, 4.5));
    dkName(ctx, O, 'O', BK_CREAM, -15, 0);
    dkName(ctx, P, 'P', BK_CREAM, 14, 0);
    dkName(ctx, A, 'A', BK_CREAM, -2, -17);
    dkName(ctx, B, 'B', BK_CREAM, -2, 17);

    const paT = pa.exact ? String(pa.k) : pa.txt;
    if (mode === 'eq') {
      const per = pa.exact ? `${2 * (r + pa.k)}` : `${2 * r} + ${bkSqTxt([2 * pa.k, 1], pa.m)}`;
      bkRow(ctx, `[PA] = [PB] = √(${op * op} − ${r * r}) = ${paT}（RHS 全等）`, 366, BK_TOMATO, 15.5);
      bkRow(ctx, `∠APO = ∠BPO ≈ ${angP.toFixed(1)}°：[PO] 平分 ∠APB`, 398, BK_LIME, 15.5);
      bkRow(ctx, `四邊形 OAPB 周長 = 2 × (${r} + ${paT}) = ${per}`, 432, BK_KRAFT, 16.5);
      bkRow(ctx, '兩條切線段等長，所以四邊形 OAPB 是箏形', 462, MUTED, 13.5);
      const perT = pa.exact ? `${2 * (r + pa.k)}` : `${2 * r} + ${bkSqTex([2 * pa.k, 1], pa.m)}`;
      out.innerHTML = wbrEq(`\\overline{PA} = \\overline{PB} = ${pa.tex}`) + '，<wbr>周長 ' + wbrEq(`2(${r} + ${pa.tex}) = ${perT}`);
      fb.innerHTML = wrapFeedback('\\(\\overline{OA} = \\overline{OB}\\)（半徑）、\\(\\angle OAP = \\angle OBP = 90^\\circ\\)、\\(\\overline{OP}\\) 共用，\\(\\triangle OAP \\cong \\triangle OBP\\)（RHS）。<br>所以 \\(\\overline{PA} = \\overline{PB}\\)，而且 \\(\\overline{PO}\\) <strong>平分</strong> \\(\\angle APB\\)。');
    } else {
      bkRow(ctx, `[PO] 垂直平分 [AB]，交於 M：[AB] = 2[AM]`, 366, BK_PLUM, 15.5);
      bkRow(ctx, `△OAP 面積：[OA] × [PA] ÷ 2 = [OP] × [AM] ÷ 2`, 400, BK_CREAM, 15.5);
      bkRow(ctx, `${r} × ${paT} = ${op} × [AM]，[AM] = ${bkSqTxt(amQ, pa.m)}`, 438, BK_SKY, 16);
      bkRow(ctx, `[AB] = 2 × ${bkSqTxt(amQ, pa.m)} = ${bkSqTxt(abQ, pa.m)}`, 466, BK_PLUM, 16.5);
      out.innerHTML = wbrEq(`\\overline{AM} = \\frac{${r} \\times ${pa.tex}}{${op}} = ${bkSqTex(amQ, pa.m)}`) + '，<wbr>'
        + wbrEq(`\\overline{AB} = 2\\overline{AM} = ${bkSqTex(abQ, pa.m)}`);
      fb.innerHTML = wrapFeedback('\\(\\triangle PAB\\) 是等腰三角形，\\(\\overline{PO}\\) 是頂角平分線，所以<strong>垂直平分</strong>底邊 \\(\\overline{AB}\\)。<br>\\(\\overline{AM}\\) 是直角 \\(\\triangle OAP\\) 斜邊上的高：同一個面積用兩種底和高算。');
    }
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('tt-mode-group'), 'data-tt-mode', m => { mode = m; draw(); });
  [sr, so].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：弦的中垂線通過圓心——從一段圓弧找出圓心（尺規逐步播放）
   三段弧的真圓心只用來產生弧；圓心 O 一律由兩條中垂線真的求交而來。
   ========================================================================== */
function initCtrCanvas() {
  const cv = hbEl('canvas-ctr');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const out = hbEl('ctr-formula'), fb = hbEl('ctr-feedback');
  const C9 = BK_TONE[9];
  const st = { k: 1 };
  const UNIT = 30;
  // 弧：圓心、半徑、canvas 角度範圍（度），三點 A、B、C 的角度
  const ARCS = [
    { c: cgP(270, 262), r: 150, a0: -168, a1: -12, pts: [-155, -95, -32] },
    { c: cgP(300, 300), r: 196, a0: -152, a1: -48, pts: [-142, -100, -58] },
    { c: cgP(250, 214), r: 118, a0: -205, a1: 25, pts: [-192, -92, 12] }
  ];
  let which = 0;

  function draw() {
    const S = ARCS[which];
    const [A, B, C] = S.pts.map(t => cgPolar(S.c, S.r, cgRad(t)));
    const bis = (P, Q) => {
      const rr = cgDist(P, Q) * 0.72;
      const xs = cgCC(P, rr, Q, rr);
      return { rr, X: xs[0], Y: xs[1] };
    };
    const b1 = bis(A, B), b2 = bis(B, C);
    const O = cgLL(b1.X, b1.Y, b2.X, b2.Y);
    const ext = (X, Y) => [hbBeyond(Y, X, 260), hbBeyond(X, Y, 260)];
    const L1 = ext(b1.X, b1.Y), L2 = ext(b2.X, b2.Y);

    const steps = [
      { tool: 'ruler', text: '在弧上任取三點 A、B、C，先用直尺連出弦 AB。', ruler: [A, B],
        draw: c => cgSeg(c, A, B, BK_TOMATO, 3) },
      { tool: 'compass', text: '以 A 為圓心、大於 AB 一半的長為半徑，在 AB 兩側畫弧。',
        compass: { c: A, r: b1.rr, ang: cgAng(A, b1.X), label: '' },
        draw: c => cgArcAt(c, A, b1.rr, [b1.X, b1.Y], 0.22, BK_KRAFT) },
      { tool: 'compass', text: '以 B 為圓心、同樣的半徑畫弧，兩弧交於兩點。',
        compass: { c: B, r: b1.rr, ang: cgAng(B, b1.X), label: '' },
        draw: c => cgArcAt(c, B, b1.rr, [b1.X, b1.Y], 0.22, BK_KRAFT) },
      { tool: 'ruler', text: '連接兩個交點：這條直線 L₁ 是弦 AB 的中垂線。', ruler: [b1.X, b1.Y],
        draw: c => cgSeg(c, L1[0], L1[1], BK_SKY, 2.6) },
      { tool: 'ruler', text: '再用直尺連出另一條弦 BC。', ruler: [B, C],
        draw: c => cgSeg(c, B, C, BK_TOMATO, 3) },
      { tool: 'compass', text: '以 B 為圓心、大於 BC 一半的長為半徑，在 BC 兩側畫弧。',
        compass: { c: B, r: b2.rr, ang: cgAng(B, b2.X), label: '' },
        draw: c => cgArcAt(c, B, b2.rr, [b2.X, b2.Y], 0.22, BK_KRAFT) },
      { tool: 'compass', text: '以 C 為圓心、同樣的半徑畫弧，兩弧交於兩點。',
        compass: { c: C, r: b2.rr, ang: cgAng(C, b2.X), label: '' },
        draw: c => cgArcAt(c, C, b2.rr, [b2.X, b2.Y], 0.22, BK_KRAFT) },
      { tool: 'ruler', text: '連接兩個交點得 BC 的中垂線 L₂；L₁ 和 L₂ 交於 O。', ruler: [b2.X, b2.Y],
        draw: c => cgSeg(c, L2[0], L2[1], BK_PLUM, 2.6) },
      { tool: 'look', text: 'O 到 A、B、C 一樣遠：O 就是圓心，OA 就是半徑，可以把整個圓補回來。',
        draw: c => {
          cgArc(c, O, cgDist(O, A), 0, Math.PI * 2, 'rgba(166, 217, 106, 0.55)', 2);
          [A, B, C].forEach(p => cgSeg(c, O, p, BK_LIME, 2, [6, 4]));
        } }
    ];
    cgSync('ctr', st, steps.length);
    const oa = cgDist(O, A) / UNIT, ob = cgDist(O, B) / UNIT, oc = cgDist(O, C) / UNIT;
    cgRender(ctx, {
      title: '撿到一段破輪框：它的圓心在哪裡？', color: C9, k: st.k, steps,
      given: c => {
        const ctxA = c;
        ctxA.save();
        ctxA.strokeStyle = BK_CREAM;
        ctxA.lineWidth = 5;
        ctxA.lineCap = 'round';
        ctxA.beginPath();
        ctxA.arc(S.c.x, S.c.y, S.r, cgRad(S.a0), cgRad(S.a1), false);
        ctxA.stroke();
        ctxA.restore();
      },
      pts: [
        { p: A, n: 'A', s: 0, dx: -12, dy: -16 },
        { p: B, n: 'B', s: 0, dx: 0, dy: -18 },
        { p: C, n: 'C', s: 0, dx: 12, dy: -16 },
        { p: O, n: 'O', s: 8, c: BK_LIME, dx: 16, dy: 14 }
      ],
      measure: st.k >= 9 ? [`量一量：OA = ${oa.toFixed(2)}、OB = ${ob.toFixed(2)}、OC = ${oc.toFixed(2)}（格）`, BK_LIME] : null
    });

    if (st.k >= 8) {
      out.innerHTML = `\\(\\overline{OA} = \\overline{OB} = \\overline{OC} \\approx ${oa.toFixed(2)}\\) 格`;
    } else {
      out.innerHTML = `步驟 \\(${st.k}\\)：${st.k <= 4 ? '先作弦 \\(\\overline{AB}\\) 的中垂線' : '再作弦 \\(\\overline{BC}\\) 的中垂線'}`;
    }
    fb.innerHTML = wrapFeedback('弦的<strong>中垂線一定通過圓心</strong>。一條中垂線只知道圓心在這條線上，所以要<strong>兩條</strong>：兩條中垂線的交點就是圓心。<br>換一段弧（上方按鈕）再做一次，結果都一樣。');
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('ctr-arc-group'), 'data-ctr-arc', m => { which = parseInt(m, 10); st.k = 1; draw(); });
  cgSteps('ctr', st, draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 11：弦心距（半弦、弦心距、半徑組成直角三角形）
   len：已知 r、d 求弦長；d：已知 r、弦長求 d；r：已知弦長、d 求 r；
   two：兩弦共用同一個半徑（已知 AB、OM 求 r，再由 ON 求 CD）。
   ========================================================================== */
function initCdCanvas() {
  const cv = hbEl('canvas-cd');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const s1 = hbEl('cd-s1'), s2 = hbEl('cd-s2'), s3 = hbEl('cd-s3');
  const v1 = hbEl('cd-v1'), v2 = hbEl('cd-v2'), v3 = hbEl('cd-v3');
  const l1 = hbEl('cd-l1'), l2 = hbEl('cd-l2');
  const out = hbEl('cd-formula'), fb = hbEl('cd-feedback');
  const C10 = BK_TONE[10];
  let mode = 'len';

  function draw() {
    const W = cv.width;
    let R2, d2, a2, D2 = null, c2 = null;   // r²、d²、半弦²；two 模式的第二條弦
    let rows = [], tex = '', title = '';
    if (mode === 'len') {
      const r = hbClampSlider(s1, 2, 10), d = hbClampSlider(s2, 0, r - 1);
      v1.textContent = r; v2.textContent = d;
      l1.textContent = '半徑 r'; l2.textContent = '弦心距 OM';
      R2 = r * r; d2 = d * d; a2 = R2 - d2;
      const am = bkRoot(a2);
      title = `半徑 ${r}、弦心距 ${d}，弦 AB 多長？`;
      rows = [[`[AM] = √(${r}² − ${d}²) = √${a2}${am.exact || am.k > 1 ? ' = ' + am.txt : ''}`, BK_SKY],
              [`[OM] 垂直平分 [AB]：[AB] = 2[AM] = ${bkSqTxt([2 * am.k, 1], am.m)}`, BK_TOMATO]];
      tex = wbrEq(`\\overline{AM} = \\sqrt{${r}^2 - ${d}^2} = ${am.tex}`) + '，<wbr>' + wbrEq(`\\overline{AB} = 2\\overline{AM} = ${bkSqTex([2 * am.k, 1], am.m)}`);
    } else if (mode === 'd') {
      const r = hbClampSlider(s1, 2, 10), a = hbClampSlider(s2, 1, r - 1);
      v1.textContent = r; v2.textContent = 2 * a;
      l1.textContent = '半徑 r'; l2.textContent = '弦長 AB';
      R2 = r * r; a2 = a * a; d2 = R2 - a2;
      const om = bkRoot(d2);
      title = `半徑 ${r}、弦 AB = ${2 * a}，弦心距 OM 多長？`;
      rows = [[`[OM] 垂直平分 [AB]：[AM] = {1/2} × ${2 * a} = ${a}`, BK_TOMATO],
              [`[OM] = √(${r}² − ${a}²) = √${d2}${om.exact || om.k > 1 ? ' = ' + om.txt : ''}`, BK_SKY]];
      tex = wbrEq(`\\overline{AM} = \\frac{1}{2} \\times ${2 * a} = ${a}`) + '，<wbr>' + wbrEq(`\\overline{OM} = \\sqrt{${r}^2 - ${a}^2} = ${om.tex}`);
    } else if (mode === 'r') {
      const a = hbClampSlider(s1, 1, 8), d = hbClampSlider(s2, 1, 8);
      v1.textContent = 2 * a; v2.textContent = d;
      l1.textContent = '弦長 AB'; l2.textContent = '弦心距 OM';
      a2 = a * a; d2 = d * d; R2 = a2 + d2;
      const rr = bkRoot(R2);
      title = `弦 AB = ${2 * a}、弦心距 ${d}，半徑多長？`;
      rows = [[`[AM] = {1/2} × ${2 * a} = ${a}`, BK_TOMATO],
              [`半徑 [OA] = √(${a}² + ${d}²) = √${R2}${rr.exact || rr.k > 1 ? ' = ' + rr.txt : ''}`, BK_KRAFT]];
      tex = wbrEq(`\\overline{AM} = ${a}`) + '，<wbr>' + wbrEq(`\\overline{OA} = \\sqrt{${a}^2 + ${d}^2} = ${rr.tex}`);
    } else {
      const a = hbClampSlider(s1, 1, 8), d = hbClampSlider(s2, 1, 8);
      R2 = a * a + d * d; a2 = a * a; d2 = d * d;
      const dmax = Math.ceil(Math.sqrt(R2)) - 1;
      const e = hbClampSlider(s3, 0, dmax);
      v1.textContent = 2 * a; v2.textContent = d; v3.textContent = e;
      l1.textContent = '弦長 AB'; l2.textContent = '弦心距 OM';
      D2 = e * e; c2 = R2 - D2;
      const rr = bkRoot(R2), cn = bkRoot(c2);
      title = `AB = ${2 * a}、OM = ${d}、ON = ${e}，弦 CD 多長？`;
      rows = [[`① [OA] = √(${a}² + ${d}²) = √${R2}${rr.exact || rr.k > 1 ? ' = ' + rr.txt : ''}`, BK_KRAFT],
              [`② 同一圓：[OC] = [OA]，[CN] = √(${R2} − ${e}²) = ${cn.txt === '' ? '0' : cn.txt}`, BK_SKY],
              [`③ [CD] = 2[CN] = ${bkSqTxt([2 * cn.k, 1], cn.m)}`, BK_PLUM]];
      tex = wbrEq(`\\overline{OA}^2 = ${a}^2 + ${d}^2 = ${R2}`) + '，<wbr>' + wbrEq(`\\overline{CN} = \\sqrt{${R2} - ${e}^2} = ${cn.tex}`)
        + '，<wbr>' + wbrEq(`\\overline{CD} = ${bkSqTex([2 * cn.k, 1], cn.m)}`);
    }
    bkShow('cd-s3-row', mode === 'two');
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, title, C10);

    const rv = Math.sqrt(R2), dv = Math.sqrt(d2), av = Math.sqrt(a2);
    const k = Math.min(17, 148 / rv);
    const O = hbV(270, 206);
    const My = O.y + dv * k;
    const A = hbV(O.x - av * k, My), B = hbV(O.x + av * k, My), M = hbV(O.x, My);
    bkSpokes(ctx, O, rv * k);
    bkCircle(ctx, O, rv * k, BK_CREAM, 3);
    hbSeg(ctx, A, B, BK_TOMATO, 3.6);
    hbSeg(ctx, O, A, BK_KRAFT, 2.6);
    if (d2 > 0) { hbSeg(ctx, O, M, BK_SKY, 2.8); dkAng(ctx, M, O, B, 11, BK_SKY); }
    hbTick(ctx, A, M, 1, BK_TOMATO);
    hbTick(ctx, M, B, 1, BK_TOMATO);
    [A, B, M].forEach(p => bkPt(ctx, p, BK_CREAM, 4));
    dkName(ctx, A, 'A', BK_CREAM, -14, 8);
    dkName(ctx, B, 'B', BK_CREAM, 14, 8);
    dkName(ctx, M, 'M', BK_CREAM, 0, 17);
    if (mode === 'two') {
      const cv2 = Math.sqrt(c2), ev = Math.sqrt(D2);
      const Ny = O.y - ev * k;
      const Cc = hbV(O.x - cv2 * k, Ny), D = hbV(O.x + cv2 * k, Ny), N = hbV(O.x, Ny);
      hbSeg(ctx, Cc, D, BK_PLUM, 3.6);
      hbSeg(ctx, O, Cc, BK_KRAFT, 2.2, [5, 4]);
      if (D2 > 0) { hbSeg(ctx, O, N, BK_SKY, 2.4); dkAng(ctx, N, O, D, 10, BK_SKY); }
      [Cc, D, N].forEach(p => bkPt(ctx, p, BK_CREAM, 4));
      dkName(ctx, Cc, 'C', BK_CREAM, -14, -6);
      dkName(ctx, D, 'D', BK_CREAM, 14, -6);
      dkName(ctx, N, 'N', BK_CREAM, 12, -12);
    }
    bkPt(ctx, O, BK_CREAM, 4.5);
    dkName(ctx, O, 'O', BK_CREAM, -14, -8);

    const y0 = mode === 'two' ? 384 : 398;
    rows.forEach((rw, i) => bkRow(ctx, rw[0], y0 + i * 32, rw[1], 16));
    out.innerHTML = tex;
    fb.innerHTML = wrapFeedback(mode === 'two'
      ? '兩條弦在<strong>同一個圓</strong>裡，半徑一樣：先用 \\(\\overline{AB}\\) 這一組求出半徑，再拿去算 \\(\\overline{CD}\\)。'
      : '弦心距 \\(\\overline{OM}\\) <strong>垂直平分</strong>弦：\\(\\overline{AM}\\)（半弦）、\\(\\overline{OM}\\)（弦心距）、\\(\\overline{OA}\\)（半徑）圍成直角三角形，<strong>半徑是斜邊</strong>。<br>別忘了最後把半弦乘 2。');
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('cd-mode-group'), 'data-cd-mode', m => { mode = m; draw(); });
  [s1, s2, s3].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 12：弦心距的性質（同圓或等圓：弦愈長、弦心距愈小）
   比較一律用「半弦的平方 = r² − d²」整數比較。
   ========================================================================== */
function initCmpCanvas() {
  const cv = hbEl('canvas-cmp');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sr1 = hbEl('cmp-r1'), sr2 = hbEl('cmp-r2'), sd1 = hbEl('cmp-d1'), sd2 = hbEl('cmp-d2');
  const vr1 = hbEl('cmp-vr1'), vr2 = hbEl('cmp-vr2'), vd1 = hbEl('cmp-vd1'), vd2 = hbEl('cmp-vd2');
  const out = hbEl('cmp-formula'), fb = hbEl('cmp-feedback');
  const C11 = BK_TONE[11];
  let mode = 'same';

  function chordAt(ctx2, O, R, dpx, up, col, names) {
    const half = Math.sqrt(Math.max(R * R - dpx * dpx, 0));
    const y = O.y + (up ? -dpx : dpx);
    const P = hbV(O.x - half, y), Q = hbV(O.x + half, y), F = hbV(O.x, y);
    hbSeg(ctx2, P, Q, col, 3.6);
    if (dpx > 0) { hbSeg(ctx2, O, F, BK_SKY, 2.4); dkAng(ctx2, F, O, Q, 10, BK_SKY); }
    bkPt(ctx2, P, col, 4); bkPt(ctx2, Q, col, 4);
    dkName(ctx2, P, names[0], col, -13, up ? -8 : 8);
    dkName(ctx2, Q, names[1], col, 13, up ? -8 : 8);
    bkPt(ctx2, F, BK_SKY, 3.5);
    dkName(ctx2, F, names[2], BK_SKY, 12, up ? -12 : 13);
  }

  function draw() {
    const W = cv.width;
    const same = mode === 'same';
    const r1 = hbClampSlider(sr1, same ? 3 : 2, 8);
    const r2 = same ? r1 : hbClampSlider(sr2, 2, 8);
    const d1 = hbClampSlider(sd1, 0, r1 - 1), d2 = hbClampSlider(sd2, 0, r2 - 1);
    vr1.textContent = r1; if (vr2) vr2.textContent = r2; vd1.textContent = d1; vd2.textContent = d2;
    bkShow('cmp-r2-row', !same);
    const h1 = r1 * r1 - d1 * d1, h2 = r2 * r2 - d2 * d2;    // 半弦的平方
    const L1 = bkRoot(4 * h1), L2 = bkRoot(4 * h2);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, same ? `同一個圓（半徑 ${r1}）裡的兩條弦` : `兩個圓：半徑 ${r1} 和 ${r2}`, C11);

    let ok;
    if (same) {
      const k = Math.min(17, 150 / r1);
      const O = hbV(270, 200);
      bkSpokes(ctx, O, r1 * k);
      bkCircle(ctx, O, r1 * k, BK_CREAM, 3);
      chordAt(ctx, O, r1 * k, d1 * k, true, BK_TOMATO, ['A', 'B', 'E']);
      chordAt(ctx, O, r1 * k, d2 * k, false, BK_PLUM, ['C', 'D', 'F']);
      bkPt(ctx, O, BK_CREAM, 4.5);
      dkName(ctx, O, 'O', BK_CREAM, -14, 0);
      ok = true;
    } else {
      const k = Math.min(15, 112 / Math.max(r1, r2));
      const O1 = hbV(140, 200), O2 = hbV(400, 200);
      bkCircle(ctx, O1, r1 * k, BK_CREAM, 3);
      bkCircle(ctx, O2, r2 * k, BK_CREAM, 3);
      chordAt(ctx, O1, r1 * k, d1 * k, false, BK_TOMATO, ['A', 'B', 'E']);
      chordAt(ctx, O2, r2 * k, d2 * k, false, BK_PLUM, ['C', 'D', 'F']);
      bkPt(ctx, O1, BK_CREAM, 4.5); bkPt(ctx, O2, BK_CREAM, 4.5);
      dkName(ctx, O1, 'O', BK_CREAM, -14, -8);
      dkName(ctx, O2, 'P', BK_CREAM, -14, -8);
      // 「弦心距較小的弦較長」在這組數字是否成立
      ok = (d1 < d2 && h1 > h2) || (d1 > d2 && h1 < h2) || (d1 === d2 && h1 === h2);
    }
    const sgnD = d1 < d2 ? '<' : d1 > d2 ? '>' : '=';
    const sgnL = h1 > h2 ? '>' : h1 < h2 ? '<' : '=';
    const e2 = same ? 'OF' : 'PF';
    bkRow(ctx, `弦心距：[OE] = ${d1}，[${e2}] = ${d2}　→　[OE] ${sgnD} [${e2}]`, 372, BK_SKY, 16);
    bkRow(ctx, `弦長：[AB] = ${L1.txt}，[CD] = ${L2.txt}　→　[AB] ${sgnL} [CD]`, 406, BK_ROSE, 16);
    let msg, col;
    if (same) {
      msg = d1 === d2 ? '弦心距相等，兩弦等長' : '弦心距較小的那條弦比較長';
      col = BK_OK;
    } else if (r1 === r2) {
      msg = '兩圓半徑相等（等圓）：性質照樣成立';
      col = BK_OK;
    } else {
      msg = ok ? '這組剛好符合，但兩圓不一樣大，不能保證' : '弦心距較小，弦卻沒有比較長：不同的圓不能這樣比';
      col = ok ? BK_KRAFT : BK_NO;
    }
    bkRow(ctx, msg, 444, col, 17);

    const relD = d1 < d2 ? '\\lt' : d1 > d2 ? '\\gt' : '=';
    const relL = h1 > h2 ? '\\gt' : h1 < h2 ? '\\lt' : '=';
    out.innerHTML = `\\(\\overline{OE} ${relD} \\overline{${e2}}\\)，<wbr>\\(\\overline{AB} = ${L1.tex}\\)<wbr>\\( {}${relL} ${L2.tex} = \\overline{CD}\\)`;
    fb.innerHTML = wrapFeedback(same
      ? '同一個圓裡，半徑都一樣：\\(\\text{半弦}^2 = r^2 - d^2\\)，弦心距 \\(d\\) 愈小，半弦就愈長。<strong>等弦 ⇔ 等弦心距</strong>。'
      : (r1 === r2 ? '半徑相等的兩圓（<strong>等圓</strong>）可以看成同一個圓，性質一樣成立。'
        : '兩個圓不一樣大時，\\(r\\) 不同，只比弦心距<strong>不能</strong>判斷弦長。試試把右邊的圓調大。'));
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('cmp-mode-group'), 'data-cmp-mode', m => { mode = m; draw(); });
  [sr1, sr2, sd1, sd2].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 13：弦心距的應用——設半徑為 x，列方程式（隧道、下水道）
   弦 AB 寬 2a，弓形的高 h（隧道是最高點到路面、下水道是水深）。
   x² = (h − x)² + a² ⇒ 2hx = h² + a² ⇒ x = (h² + a²) / (2h)
   ========================================================================== */
function initTunCanvas() {
  const cv = hbEl('canvas-tun');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('tun-a'), sh = hbEl('tun-h'), va = hbEl('tun-va'), vh = hbEl('tun-vh');
  const la = hbEl('tun-la'), lh = hbEl('tun-lh');
  const out = hbEl('tun-formula'), fb = hbEl('tun-feedback');
  const C12 = BK_TONE[12];
  let mode = 'tunnel';

  function draw() {
    const W = cv.width;
    const a = hbClampSlider(sa, 1, 6), h = hbClampSlider(sh, 1, 8);
    va.textContent = 2 * a; vh.textContent = h;
    const tunnel = mode === 'tunnel';
    la.textContent = tunnel ? '路面寬 AB' : '水面寬 AB';
    lh.textContent = tunnel ? '隧道高 CD' : '水深 CD';
    const xq = qOf(h * h + a * a, 2 * h);
    const xv = qVal(xq);
    const odq = qSub([h, 1], xq);              // h − x（正：圓心在 C、D 之間）
    const cmp = odq[0] > 0 ? 1 : odq[0] === 0 ? 0 : -1;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, tunnel ? `隧道：路面寬 ${2 * a}、高 ${h}，半徑多少？` : `下水道：水面寬 ${2 * a}、水深 ${h}，半徑多少？`, C12);

    // 數學座標（y 朝上）：D 在原點，弦在 y = 0；C 在 (0, h)；O 在 (0, h − x)
    // 下水道是上下翻過來：C 在 (0, −h)、O 在 (0, x − h)
    const s = tunnel ? 1 : -1;
    const ptsM = [hbV(-a, 0), hbV(a, 0), hbV(0, s * h), hbV(0, s * (h - xv))];
    if (!tunnel) { ptsM.push(hbV(0, s * (h - 2 * xv))); ptsM.push(hbV(-xv, s * (h - xv))); ptsM.push(hbV(xv, s * (h - xv))); }
    const xs = ptsM.map(p => p.x), ys = ptsM.map(p => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const box = { x: 70, y: 66, w: 400, h: 218 };
    const k = Math.min(box.w / Math.max(x1 - x0, 1e-6), box.h / Math.max(y1 - y0, 1e-6), 46);
    const ox = box.x + (box.w - (x1 - x0) * k) / 2, oy = box.y + (box.h - (y1 - y0) * k) / 2;
    const T = p => hbV(ox + (p.x - x0) * k, oy + (y1 - p.y) * k);
    const A = T(ptsM[0]), B = T(ptsM[1]), C = T(ptsM[2]), O = T(ptsM[3]), D = T(hbV(0, 0));
    const R = xv * k;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 40, W, 262);
    ctx.clip();
    if (tunnel) {
      // 路面以下是地面；隧道是弦上方的那一段弧
      ctx.fillStyle = 'rgba(242, 200, 121, 0.10)';
      ctx.fillRect(0, D.y, W, 300);
      bkCircle(ctx, O, R, BK_FAINT, 1.8, [5, 5]);
      const aA = hbHead(O, A), aB = hbHead(O, B);
      bkFill(ctx, O, R, aB, aA < aB ? aA + 360 : aA, BK_TEAL, 0.18, false);
      bkArc(ctx, O, R, aB, aA < aB ? aA + 360 : aA, BK_CREAM, 4.5);
      hbSeg(ctx, hbV(20, D.y), hbV(W - 20, D.y), BK_KRAFT, 2.4);
    } else {
      // 整根管子，水在弦下面
      const aA = hbHead(O, A), aB = hbHead(O, B);
      bkFill(ctx, O, R, aA, aB < aA ? aB + 360 : aB, BK_SKY, 0.4, false);
      bkCircle(ctx, O, R, BK_CREAM, 4.5);
    }
    ctx.restore();
    hbSeg(ctx, A, B, BK_TOMATO, 3.4);
    hbSeg(ctx, C, D, BK_PLUM, 2.8);
    hbSeg(ctx, O, A, BK_KRAFT, 2.6, [6, 4]);
    dkAng(ctx, D, A, C, 11, BK_CREAM);
    [A, B, C, D, O].forEach(p => bkPt(ctx, p, BK_CREAM, 4.2));
    dkName(ctx, A, 'A', BK_CREAM, -14, tunnel ? 12 : -12);
    dkName(ctx, B, 'B', BK_CREAM, 14, tunnel ? 12 : -12);
    dkName(ctx, C, 'C', BK_PLUM, 14, tunnel ? -10 : 12);
    dkName(ctx, D, 'D', BK_CREAM, 13, tunnel ? 13 : -13);
    dkName(ctx, O, 'O', BK_KRAFT, -15, 0);

    const xT = bkSqTxt(xq, 1);
    const odAbs = cmp >= 0 ? `${h} − x` : `x − ${h}`;
    const rowsY = [318, 346, 374, 402, 432, 460];
    const L = (str, i, col, sz) => bkRich(ctx, [[str, col]], 34, rowsY[i], sz || 15.5, { align: 'left', maxW: W - 52 });
    L(`設　半徑 [OA] = [OC] = x`, 0, BK_KRAFT);
    L(`量　[AD] = {1/2}[AB] = ${a}，[OD] = ${cmp === 0 ? `${h} − x = 0` : odAbs}`, 1, BK_CREAM);
    L(`列　x² = (${odAbs})² + ${a}²（△OAD 的斜邊是 [OA]）`, 2, BK_SKY);
    L(`解　x² = x² − ${2 * h}x + ${h * h} + ${a * a}，${2 * h}x = ${h * h + a * a}，x = ${xT}`, 3, BK_TOMATO);
    const where = cmp > 0 ? (tunnel ? '圓心在路面上方（C、D 之間）' : '圓心在水面下方（C、D 之間）')
      : cmp === 0 ? '圓心就是 D：[AB] 剛好是直徑' : (tunnel ? '圓心在路面下方' : '圓心在水面上方');
    L(`查　[OD] = ${cmp === 0 ? '0' : bkSqTxt(cmp > 0 ? odq : qMul(odq, -1), 1)}：${where}`, 4, BK_LIME);
    L(cmp < 0 ? `高度 ${h} 比半徑小，所以 [OD] 要寫成 x − ${h}；平方之後是同一個方程式` : cmp > 0 ? `高度 ${h} 比半徑大，[OD] = ${h} − x；平方之後兩種寫法相同` : '這時候弧剛好是半圓', 5, MUTED, 13.5);

    out.innerHTML = wbrEq(`x^2 = (${h} - x)^2 + ${a}^2`) + '，<wbr>' + wbrEq(`${2 * h}x = ${h * h + a * a}`) + '，<wbr>' + `\\(x = ${qTex(xq)}\\)`;
    fb.innerHTML = wrapFeedback('不知道半徑時，就<strong>設半徑為 \\(x\\)</strong>：\\(\\overline{OD}\\) 用「高度減 \\(x\\)」或「\\(x\\) 減高度」表示，再對直角 \\(\\triangle OAD\\) 用畢氏定理列方程式。<br>'
      + `\\(x^2\\) 會在兩邊消掉，剩下一元一次方程式。這組數字的圓心${cmp > 0 ? '在 \\(C\\)、\\(D\\) 之間' : cmp === 0 ? '剛好在 \\(D\\)' : (tunnel ? '在路面下方' : '在水面上方')}。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('tun-mode-group'), 'data-tun-mode', m => { mode = m; draw(); });
  [sa, sh].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}
