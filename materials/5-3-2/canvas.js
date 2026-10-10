/* ==========================================================================
   5-3-2（第五冊 3-2）三角形的外心、內心與重心 — 互動 Canvas 與隨堂評量
   畫風：古希臘陶瓶黑繪風・幾何學院（小歐、阿基），第五冊第 3 章兩節共用。

   共用工具在 ../math-canvas.js（f／fi／drawTitle／textCenter／wrapFeedback／
   wbrEq／typeset／bindPickGroup／drawWithFonts、q* 有理數、hb* 幾何、cg* 尺規、
   dk* 一行混排字…）。
   ⚠️ 本頁不修改共用檔；本節自己的工具一律用 gr2 前綴、色票用 GR_ 前綴。

   本檔分三層：
     0. 本節色票（GR_）；
     1. 本節工具（gr2）：方格座標、拖曳、外心／內心／垂足、根式分數字串；
     2. 17 個互動與評量附圖。

   三心一律由頂點座標「真的求」：外心＝兩條中垂線的交點（公式解）、
   內心＝以邊長加權的頂點平均、重心＝三頂點平均。拖曳的頂點落在整數方格上，
   銳角／直角／鈍角一律用內積的正負號判斷（整數，不靠浮點數），面積一律用
   兩倍面積（整數）算，分數用 q* 化簡（開發約束 27）。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();
  drawWithFonts(initQuizFigs);

  initC1Canvas();
  initC2Canvas();
  initC3Canvas();
  initC4Canvas();
  initC5Canvas();
  initC6Canvas();
  initC7Canvas();
  initC8Canvas();
  initC9Canvas();
  initC10Canvas();
  initC11Canvas();
  initC12Canvas();
  initC13Canvas();
  initC14Canvas();
  initC15Canvas();
  initC16Canvas();
  initC17Canvas();
});

/* ==========================================================================
   0. 本節色票（黑繪陶瓶：赤陶橘底、黑色剪影、奶油白、暗紅；
      外心＝愛琴藍、內心＝橄欖綠、重心＝金，三心各一色，全頁一致）
   ========================================================================== */
const GR_TERRA = '#e8874a';   // 赤陶橘（在深色卡片上提亮一階）
const GR_CREAM = '#f3e6cc';   // 奶油白
const GR_RED = '#f07a62';     // 暗紅（提亮一階）
const GR_O = '#6cc3ea';       // 外心：愛琴藍
const GR_I = '#9fd36a';       // 內心：橄欖綠
const GR_G = '#f5c542';       // 重心：金
const GR_ROSE = '#f29b8f';
const GR_PLUM = '#c9a0f0';
const GR_OK = '#86efac';
const GR_NO = '#fb7185';
const GR_FAINT = 'rgba(243, 230, 204, 0.3)';
const GR_GRID = 'rgba(243, 230, 204, 0.16)';
const GR_TAG_BG = 'rgba(28, 20, 16, 0.9)';

// 17 個重點的標題色（與 style.css 的 #conceptN 一致）
const GR_TONE = ['#7dd3fc', '#67e8f9', '#a5b4fc', '#93c5fd', '#c4b5fd', '#6ee7b7', '#5eead4',
  '#bef264', '#86efac', '#a3e635', '#2dd4bf', '#d8b4fe', '#fcd34d', '#fdba74', '#fde047',
  '#fca5a5', '#f9a8d4'];

cgUsePalette({
  ink: GR_CREAM, honey: GR_TERRA, brass: '#d9a441', brassDk: '#5b3f0c',
  tools: { compass: GR_TERRA, ruler: GR_O, look: GR_OK, warn: GR_NO }
});
dkUsePalette({ tagBg: GR_TAG_BG, rim: 'rgba(15, 23, 42, 0.9)' });

/* ==========================================================================
   1. 本節工具（gr2 前綴）
   ========================================================================== */

// 方格：x 0～16、y 0～10，一格 28px，y 朝上
const GR_GX0 = 46, GR_GY0 = 372, GR_U = 28, GR_NX = 16, GR_NY = 10;

function gr2Px(g) {
  return hbV(GR_GX0 + g.x * GR_U, GR_GY0 - g.y * GR_U);
}

function gr2Gd(p) {
  return hbV((p.x - GR_GX0) / GR_U, (GR_GY0 - p.y) / GR_U);
}

function gr2Grid(ctx) {
  ctx.save();
  ctx.fillStyle = GR_GRID;
  for (let x = 0; x <= GR_NX; x++) {
    for (let y = 0; y <= GR_NY; y++) {
      const p = gr2Px(hbV(x, y));
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// 兩倍有號面積（整數座標時是整數）
function gr2Cross(A, B, C) {
  return (B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x);
}

function gr2Dot(V, P, Q) {
  return (P.x - V.x) * (Q.x - V.x) + (P.y - V.y) * (Q.y - V.y);
}

function gr2Mid(P, Q) {
  return hbV((P.x + Q.x) / 2, (P.y + Q.y) / 2);
}

// 外心：兩條中垂線交點的公式解（任何座標系都適用）
function gr2Circum(A, B, C) {
  const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
  const a2 = A.x * A.x + A.y * A.y, b2 = B.x * B.x + B.y * B.y, c2 = C.x * C.x + C.y * C.y;
  return hbV((a2 * (B.y - C.y) + b2 * (C.y - A.y) + c2 * (A.y - B.y)) / d,
             (a2 * (C.x - B.x) + b2 * (A.x - C.x) + c2 * (B.x - A.x)) / d);
}

// 內心：以對邊長為權重的頂點平均
function gr2Incenter(A, B, C) {
  const a = hbDist(B, C), b = hbDist(C, A), c = hbDist(A, B), s = a + b + c;
  return hbV((a * A.x + b * B.x + c * C.x) / s, (a * A.y + b * B.y + c * C.y) / s);
}

// P 到直線 AB 的垂足
function gr2Foot(P, A, B) {
  const dx = B.x - A.x, dy = B.y - A.y;
  const t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / (dx * dx + dy * dy);
  return hbV(A.x + dx * t, A.y + dy * t);
}

function gr2LDist(P, A, B) {
  return hbDist(P, gr2Foot(P, A, B));
}

// 數字：最多 k 位小數，尾巴的 0 不留
function gr2N(v, k) {
  const p = Math.pow(10, k == null ? 2 : k);
  const r = Math.round(v * p) / p;
  return String(Object.is(r, -0) ? 0 : r);
}

// 由 V 往外推的單位向量 × len（標點名用）
function gr2Out(V, ref, len) {
  const d = hbDist(V, ref) || 1;
  return hbV((V.x - ref.x) / d * len, (V.y - ref.y) / d * len);
}

// 直線 PQ 往兩頭延長畫（要先 clip）
function gr2Line(ctx, P, Q, color, w, dash) {
  hbSeg(ctx, hbBeyond(Q, P, 900), hbBeyond(P, Q, 900), color, w, dash);
}

// PQ 的中垂線上的兩點（M ± 法向量）
function gr2BisPts(P, Q) {
  const M = gr2Mid(P, Q);
  return [M, hbV(M.x - (Q.y - P.y), M.y + (Q.x - P.x))];
}

// 三角形：赤陶填色、奶油白描邊
function gr2Tri(ctx, A, B, C, alpha) {
  dkPoly(ctx, [A, B, C], GR_TERRA, alpha == null ? 0.16 : alpha, 0.01);
  dkPoly(ctx, [A, B, C], GR_CREAM, 0, 2.6);
}

function gr2Names(ctx, pts, names, color) {
  const G = hbCentroid(pts);
  pts.forEach((p, i) => {
    const o = gr2Out(p, G, 19);
    dkName(ctx, p, names[i], color || GR_CREAM, o.x, o.y);
  });
}

// 實心點 + 名字（名字位置以 dx, dy 指定）
function gr2Pt(ctx, P, name, color, dx, dy, r) {
  dkPt(ctx, P, color, r || 6);
  if (name) dkName(ctx, P, name, color, dx == null ? 14 : dx, dy == null ? -14 : dy);
}

// 圓（canvas 座標）
function gr2Circle(ctx, C, R, color, w, dash, alpha) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = w || 2;
  if (alpha != null) ctx.globalAlpha = alpha;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.arc(C.x, C.y, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// 直角記號：頂點 V，兩邊朝 P、Q
function gr2Right(ctx, V, P, Q, color, s) {
  const u = cgUnit(V, P), w = cgUnit(V, Q);
  cgRight(ctx, V, u, w, s || 11, color);
}

// 畫面上半部的圖形區（clip），之後的字不會被線蓋到
function gr2Clip(ctx, y0, y1) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y0, ctx.canvas.width, y1 - y0);
  ctx.clip();
}

// √n ÷ den 化成最簡：回傳 { tex, txt, val }；txt 給 dkRich（{分子/分母}）
function gr2RootFrac(n, den) {
  const R = hbRoot(n);
  const q = reduce(R.k, den);
  const val = Math.sqrt(n) / den;
  if (R.r === 1) {
    return { tex: qTex(q), txt: q[1] === 1 ? String(q[0]) : `{${q[0]}/${q[1]}}`, val, exact: true };
  }
  const numTex = (q[0] === 1 ? '' : q[0]) + `\\sqrt{${R.r}}`;
  const numTxt = (q[0] === 1 ? '' : q[0]) + `√${R.r}`;
  if (q[1] === 1) return { tex: numTex, txt: numTxt, val, exact: false };
  return { tex: `\\frac{${numTex}}{${q[1]}}`, txt: `{${numTxt}/${q[1]}}`, val, exact: false };
}

/* 拖曳：handles() 回傳 [{ key, p }]（canvas 座標），move(key, 方格座標) 自己決定接不接受 */
function gr2Drag(cv, o) {
  cv.style.touchAction = 'none';
  let drag = null;
  const near = p => {
    let best = null, bd = 26;
    o.handles().forEach(h => { const d = hbDist(p, h.p); if (d < bd) { bd = d; best = h.key; } });
    return best;
  };
  cv.addEventListener('pointerdown', e => {
    const key = near(canvasPos(cv, e));
    if (key == null) return;
    drag = key;
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* 合成事件沒有 pointerId */ }
    e.preventDefault();
  });
  cv.addEventListener('pointermove', e => {
    const p = canvasPos(cv, e);
    if (drag == null) {
      cv.style.cursor = near(p) == null ? 'default' : 'grab';
      return;
    }
    o.move(drag, gr2Gd(p));
    e.preventDefault();
  });
  const end = () => { drag = null; };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
}

/* 三頂點拖曳：頂點吸附到整數方格，不可重合、不可共線；extra(P) 回傳 false 就不接受 */
function gr2TriDrag(cv, st, draw, extra) {
  gr2Drag(cv, {
    handles: () => ['A', 'B', 'C'].map(k => ({ key: k, p: gr2Px(st.P[k]) })),
    move: (k, g) => {
      const n = hbV(clamp(Math.round(g.x), 0, GR_NX), clamp(Math.round(g.y), 0, GR_NY));
      if (n.x === st.P[k].x && n.y === st.P[k].y) return;
      const P = Object.assign({}, st.P, { [k]: n });
      if (gr2Cross(P.A, P.B, P.C) === 0) return;
      if (extra && !extra(P)) return;
      st.P = P;
      draw();
    }
  });
}

// 三頂點（方格）→ canvas
function gr2TriPx(P) {
  return { A: gr2Px(P.A), B: gr2Px(P.B), C: gr2Px(P.C) };
}

// 依內積判斷三角形種類（整數座標，精確）：回傳 { kind, at }，at 是最大角的頂點名
function gr2Kind(P) {
  const d = { A: gr2Dot(P.A, P.B, P.C), B: gr2Dot(P.B, P.C, P.A), C: gr2Dot(P.C, P.A, P.B) };
  for (const k of ['A', 'B', 'C']) {
    if (d[k] === 0) return { kind: 'right', at: k };
    if (d[k] < 0) return { kind: 'obtuse', at: k };
  }
  const L = { A: hbDist(P.B, P.C), B: hbDist(P.C, P.A), C: hbDist(P.A, P.B) };
  const at = ['A', 'B', 'C'].sort((x, y) => L[y] - L[x])[0];
  return { kind: 'acute', at };
}

const GR_OPP = { A: 'BC', B: 'CA', C: 'AB' };
const GR_KIND = { acute: '銳角', right: '直角', obtuse: '鈍角' };

// 尺規：PQ 的中垂線（兩圓交點 X、Y，以及延長後的兩端）
function gr2CgBis(P, Q, k) {
  const rr = cgDist(P, Q) * (k || 0.66);
  const xs = cgCC(P, rr, Q, rr);
  return { rr, X: xs[0], Y: xs[1], L: [hbBeyond(xs[1], xs[0], 300), hbBeyond(xs[0], xs[1], 300)] };
}

// 尺規：∠PVQ 的角平分線（先在兩邊截等長、再以兩截點為圓心畫等半徑弧）
function gr2CgAngBis(V, P, Q) {
  const rr = Math.min(cgDist(V, P), cgDist(V, Q)) * 0.36;
  const P1 = cgPolar(V, rr, cgAng(V, P)), Q1 = cgPolar(V, rr, cgAng(V, Q));
  const r2 = cgDist(P1, Q1) * 0.82;
  const xs = cgCC(P1, r2, Q1, r2);
  const X = xs.sort((u, w) => cgDist(V, w) - cgDist(V, u))[0];
  const end = cgLL(V, X, P, Q);
  return { rr, P1, Q1, r2, X, end };
}

// 三個預設三角形（canvas 座標）：尺規作圖與懸吊用
const GR_CG_TRIS = [
  { A: cgP(250, 128), B: cgP(108, 352), C: cgP(432, 338) },
  { A: cgP(150, 118), B: cgP(150, 332), C: cgP(420, 332) },
  { A: cgP(190, 222), B: cgP(95, 332), C: cgP(445, 332) }
];

function gr2CgTri(ctx, A, B, C) {
  gr2Tri(ctx, A, B, C, 0.14);
}

function gr2CgLabels(A, B, C) {
  const G = hbCentroid([A, B, C]);
  return [[A, 'A'], [B, 'B'], [C, 'C']].map(([p, n]) => {
    const o = gr2Out(p, G, 20);
    return { p, n, s: 0, dx: o.x, dy: o.y };
  });
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第五冊 3-2 的 34 題正解
  // 正解字母分布：A 9 題、B 8 題、C 9 題、D 8 題（開發約束 36）
  const answers = {
    '3-2-1': 'B',    // 4x − 3 = 2x + 9，x = 6，OB = 21
    '3-2-2': 'C',    // 作兩邊中垂線的交點就是外心
    '3-2-3': 'A',    // 外心在 BC 上 → BC 是斜邊，∠A = 90°
    '3-2-4': 'C',    // 30°、45°、105° 鈍角 → 外部
    '3-2-5': 'D',    // 斜邊 13，R = 13/2
    '3-2-6': 'A',    // AB = 41，AC = 40
    '3-2-7': 'B',    // ∠BOC = 2 × 63° = 126°
    '3-2-8': 'D',    // 69° 或 111°
    '3-2-9': 'A',    // r = (8² + 15²) ÷ 16 = 289/16
    '3-2-10': 'B',   // r² = (7 − r)² + 24²
    '3-2-11': 'C',   // 內切圓與三邊都相切
    '3-2-12': 'D',   // 內心一定在內部
    '3-2-13': 'B',   // 到三條路等距 → 角平分線交點（內心）
    '3-2-14': 'C',   // 延長三弦圍成三角形，取內心
    '3-2-15': 'A',   // 90° + 32° = 122°
    '3-2-16': 'D',   // (133° − 90°) × 2 = 86°
    '3-2-17': 'C',   // 29/70 × 210 = 87
    '3-2-18': 'B',   // 13/28 × 56 = 26
    '3-2-19': 'B',   // 周長 = 2 × 105 ÷ 3.5 = 60
    '3-2-20': 'A',   // r = 240 ÷ 50 = 24/5
    '3-2-21': 'D',   // BC = 35，r = (12 + 35 − 37) ÷ 2 = 5
    '3-2-22': 'C',   // a + b = 25 + 6 = 31，周長 56
    '3-2-23': 'B',   // AB + AC = 24
    '3-2-24': 'A',   // 角平分線＋內錯角 → 等腰
    '3-2-25': 'D',   // 中線
    '3-2-26': 'B',   // 重心、內心一定在內部，外心不一定
    '3-2-27': 'A',   // (24 + 21 + 30) ÷ 3 = 25
    '3-2-28': 'C',   // 4x − 2 = 2(x + 3)，x = 4，AD = 21
    '3-2-29': 'D',   // 每塊 15，四邊形 AFGE = 30
    '3-2-30': 'C',   // 105 × 2/6 = 35
    '3-2-31': 'D',   // BD = 6 × 7 = 42
    '3-2-32': 'C',   // △ABG = ▱ 的 1/6，▱ = 60
    '3-2-33': 'A',   // BE = 21，AC = 42
    '3-2-34': 'A'    // OC = 4√3，OG = 4√3/3
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
const GR_QUIZ_FIGS = {
  // Q23：I 是內心，過 I 作 DE ∥ BC；AB = 11、AC = 13、BC = 16（依比例）
  q23(ctx, W, H) {
    const t = dkTriSides(16, 13, 11);
    const v = dkView([t.A, t.B, t.C], { x: 50, y: 28, w: W - 100, h: H - 62 });
    const A = v.P(t.A), B = v.P(t.B), C = v.P(t.C);
    const I = gr2Incenter(A, B, C);
    const D = cgLL(I, hbV(I.x + 10, I.y), A, B), E = cgLL(I, hbV(I.x + 10, I.y), A, C);
    gr2Tri(ctx, A, B, C, 0.12);
    hbSeg(ctx, D, E, GR_I, 2.4);
    hbSeg(ctx, B, I, GR_FAINT, 1.6, [5, 4]);
    hbSeg(ctx, C, I, GR_FAINT, 1.6, [5, 4]);
    [A, B, C, D, E].forEach(p => dkPt(ctx, p, GR_CREAM, 3.5));
    dkPt(ctx, I, GR_I, 4);
    gr2Names(ctx, [A, B, C], ['A', 'B', 'C']);
    dkName(ctx, D, 'D', GR_CREAM, -14, -2);
    dkName(ctx, E, 'E', GR_CREAM, 14, -2);
    dkName(ctx, I, 'I', GR_I, 0, 15);
    const G = hbCentroid([A, B, C]);
    dkSideTag(ctx, A, B, G, '11', GR_TERRA, 22, 13);
    dkSideTag(ctx, A, C, G, '13', GR_TERRA, 22, 13);
    dkSideTag(ctx, B, C, G, '16', GR_TERRA, 15, 13);
  },

  // Q31：平行四邊形 ABCD，對角線交於 O，E 是 BC 中點，AE 交 BD 於 G，OG = 7
  q31(ctx, W, H) {
    const B = hbV(48, 168), C = hbV(218, 168), A = hbV(102, 40), D = hbV(272, 40);
    const O = gr2Mid(A, C), E = gr2Mid(B, C);
    const G = cgLL(A, E, B, D);
    dkPoly(ctx, [A, B, C, D], GR_CREAM, 0.06, 2.4);
    hbSeg(ctx, A, C, GR_FAINT, 1.8);
    hbSeg(ctx, B, D, GR_CREAM, 1.8);
    hbSeg(ctx, A, E, GR_G, 2.2);
    hbSeg(ctx, O, G, GR_TERRA, 3.4);
    [A, B, C, D, O, E].forEach(p => dkPt(ctx, p, GR_CREAM, 3.5));
    dkPt(ctx, G, GR_G, 4);
    dkName(ctx, A, 'A', GR_CREAM, -8, -13);
    dkName(ctx, B, 'B', GR_CREAM, -12, 8);
    dkName(ctx, C, 'C', GR_CREAM, 12, 8);
    dkName(ctx, D, 'D', GR_CREAM, 10, -12);
    dkName(ctx, O, 'O', GR_CREAM, 4, -16);
    dkName(ctx, E, 'E', GR_CREAM, 0, 15);
    dkName(ctx, G, 'G', GR_G, -14, 6);
    dkTag(ctx, '7', (O.x + G.x) / 2 + 10, (O.y + G.y) / 2 + 10, GR_TERRA, 13);
  },

  // Q34：AB 是圓 O 的直徑，C 在圓上，D、E 是 AC、BC 中點，AE 交 BD 於 G
  q34(ctx, W, H) {
    const O = hbV(W / 2, 112), R = 78;
    const A = hbV(O.x - R, O.y), B = hbV(O.x + R, O.y);
    const C = hbAt(O, 62, R);
    const D = gr2Mid(A, C), E = gr2Mid(B, C);
    const G = cgLL(A, E, B, D);
    gr2Circle(ctx, O, R, GR_CREAM, 2);
    gr2Tri(ctx, A, B, C, 0.1);
    hbSeg(ctx, A, E, GR_G, 2);
    hbSeg(ctx, B, D, GR_G, 2);
    [A, B, C, D, E, O].forEach(p => dkPt(ctx, p, GR_CREAM, 3.5));
    dkPt(ctx, G, GR_G, 4);
    dkName(ctx, A, 'A', GR_CREAM, -13, 3);
    dkName(ctx, B, 'B', GR_CREAM, 13, 3);
    dkName(ctx, C, 'C', GR_CREAM, 4, -14);
    dkName(ctx, D, 'D', GR_CREAM, -12, -8);
    dkName(ctx, E, 'E', GR_CREAM, 12, -6);
    dkName(ctx, O, 'O', GR_CREAM, 0, 15);
    dkName(ctx, G, 'G', GR_G, 2, 15);
  }
};

function initQuizFigs() {
  document.querySelectorAll('canvas.quiz-fig[data-fig]').forEach(cv => {
    const fn = GR_QUIZ_FIGS[cv.getAttribute('data-fig')];
    if (!fn) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    fn(ctx, cv.width, cv.height);
  });
}

/* ==========================================================================
   重點 1：外心——尺規作兩條中垂線（逐步播放）
   ========================================================================== */
function initC1Canvas() {
  const cv = hbEl('canvas-c1');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const out = hbEl('c1-formula'), fb = hbEl('c1-feedback');
  const st = { k: 1 };
  const UNIT = 30;
  let which = 0;

  function draw() {
    const { A, B, C } = GR_CG_TRIS[which];
    const b1 = gr2CgBis(A, B), b2 = gr2CgBis(B, C), b3 = gr2CgBis(C, A);
    const O = cgLL(b1.X, b1.Y, b2.X, b2.Y);
    const R = cgDist(O, A);
    const steps = [
      { tool: 'compass', text: '以 A 為圓心、大於 AB 一半的長為半徑，在 AB 兩側畫弧。',
        compass: { c: A, r: b1.rr, ang: cgAng(A, b1.X), label: '' },
        draw: c => cgArcAt(c, A, b1.rr, [b1.X, b1.Y], 0.2, GR_TERRA) },
      { tool: 'compass', text: '以 B 為圓心、同樣的半徑畫弧，兩弧交於兩點。',
        compass: { c: B, r: b1.rr, ang: cgAng(B, b1.X), label: '' },
        draw: c => cgArcAt(c, B, b1.rr, [b1.X, b1.Y], 0.2, GR_TERRA) },
      { tool: 'ruler', text: '連接兩個交點：直線 L 是 AB 的中垂線，L 上每一點到 A、B 等距離。', ruler: [b1.X, b1.Y],
        draw: c => cgSeg(c, b1.L[0], b1.L[1], GR_O, 2.4) },
      { tool: 'compass', text: '以 B 為圓心、大於 BC 一半的長為半徑，在 BC 兩側畫弧。',
        compass: { c: B, r: b2.rr, ang: cgAng(B, b2.X), label: '' },
        draw: c => cgArcAt(c, B, b2.rr, [b2.X, b2.Y], 0.2, GR_TERRA) },
      { tool: 'compass', text: '以 C 為圓心、同樣的半徑畫弧，兩弧交於兩點。',
        compass: { c: C, r: b2.rr, ang: cgAng(C, b2.X), label: '' },
        draw: c => cgArcAt(c, C, b2.rr, [b2.X, b2.Y], 0.2, GR_TERRA) },
      { tool: 'ruler', text: '連接兩交點得 BC 的中垂線 M；L 和 M 交於 O，O 就是外心。', ruler: [b2.X, b2.Y],
        draw: c => cgSeg(c, b2.L[0], b2.L[1], GR_O, 2.4) },
      { tool: 'look', text: '以 O 為圓心、OA 為半徑畫圓：它同時通過 A、B、C，這就是外接圓。',
        draw: c => {
          cgArc(c, O, R, 0, Math.PI * 2, 'rgba(108, 195, 234, 0.6)', 2.2);
          [A, B, C].forEach(p => cgSeg(c, O, p, GR_O, 1.8, [6, 4]));
        } },
      { tool: 'look', text: '不必再作第三條：AC 的中垂線 N 也一定通過 O（虛線）。',
        draw: c => cgSeg(c, b3.L[0], b3.L[1], GR_PLUM, 2, [7, 5]) }
    ];
    cgSync('c1', st, steps.length);
    const oa = cgDist(O, A) / UNIT, ob = cgDist(O, B) / UNIT, oc = cgDist(O, C) / UNIT;
    cgRender(ctx, {
      title: '營火要離三個帳篷一樣遠：尺規找外心', color: GR_TONE[0], k: st.k, steps,
      given: c => gr2CgTri(c, A, B, C),
      pts: gr2CgLabels(A, B, C).concat([{ p: O, n: 'O', s: 6, c: GR_O, dx: 16, dy: 14 }]),
      measure: st.k >= 7 ? [`量一量：OA ≈ ${oa.toFixed(2)}、OB ≈ ${ob.toFixed(2)}、OC ≈ ${oc.toFixed(2)}（單位）`, GR_OK] : null
    });

    if (st.k >= 7) {
      out.innerHTML = `\\(\\overline{OA} = \\overline{OB} = \\overline{OC} \\approx ${oa.toFixed(2)}\\)`;
    } else if (st.k >= 6) {
      out.innerHTML = '兩條中垂線的交點 \\(O\\) 就是外心';
    } else {
      out.innerHTML = `步驟 \\(${st.k}\\)：${st.k <= 3 ? '先作 \\(\\overline{AB}\\) 的中垂線' : '再作 \\(\\overline{BC}\\) 的中垂線'}`;
    }
    fb.innerHTML = wrapFeedback('\\(O\\) 在 \\(\\overline{AB}\\) 的中垂線上，所以 \\(\\overline{OA} = \\overline{OB}\\)；又在 \\(\\overline{BC}\\) 的中垂線上，所以 \\(\\overline{OB} = \\overline{OC}\\)。<br>於是 \\(\\overline{OA} = \\overline{OC}\\)，\\(O\\) 也在 \\(\\overline{AC}\\) 的中垂線上：<strong>三條中垂線交於一點</strong>，找外心只要作<strong>兩條</strong>。');
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('c1-tri-group'), 'data-c1-tri', m => { which = parseInt(m, 10); st.k = 1; draw(); });
  cgSteps('c1', st, draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：外心的位置——拖曳頂點，看銳角／直角／鈍角三角形的外心在哪裡
   ========================================================================== */
const GR_C2_PRESET = {
  acute: { A: hbV(7, 9), B: hbV(2, 2), C: hbV(13, 3) },
  right: { A: hbV(12, 8), B: hbV(3, 2), C: hbV(12, 2) },
  obtuse: { A: hbV(6, 5), B: hbV(4, 7), C: hbV(12, 7) }
};

// 外心要留在畫面裡（太扁的鈍角三角形外心會跑出畫布）
function gr2OInView(P) {
  const O = gr2Px(gr2Circum(P.A, P.B, P.C));
  return O.x >= 16 && O.x <= 524 && O.y >= 52 && O.y <= 384;
}

function initC2Canvas() {
  const cv = hbEl('canvas-c2');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width;
  const out = hbEl('c2-formula'), fb = hbEl('c2-feedback');
  const st = { P: Object.assign({}, GR_C2_PRESET.acute) };

  function draw() {
    const P = st.P;
    const { A, B, C } = gr2TriPx(P);
    const O = gr2Circum(A, B, C);
    const R = hbDist(O, A);
    const K = gr2Kind(P);
    const ang = { A: cgAngDeg(A, B, C), B: cgAngDeg(B, C, A), C: cgAngDeg(C, A, B) };
    const V = { A, B, C };

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '拖曳 A、B、C：外心 O 跑到哪裡？', GR_TONE[1]);
    gr2Clip(ctx, 40, 392);
    gr2Grid(ctx);
    gr2Circle(ctx, O, R, GR_O, 2, null, 0.5);
    gr2Line(ctx, ...gr2BisPts(A, B), 'rgba(108, 195, 234, 0.45)', 1.6, [6, 5]);
    gr2Line(ctx, ...gr2BisPts(B, C), 'rgba(108, 195, 234, 0.45)', 1.6, [6, 5]);
    gr2Line(ctx, ...gr2BisPts(C, A), 'rgba(108, 195, 234, 0.45)', 1.6, [6, 5]);
    gr2Tri(ctx, A, B, C, 0.16);
    const at = V[K.at], nb = ['A', 'B', 'C'].filter(k => k !== K.at).map(k => V[k]);
    if (K.kind === 'right') gr2Right(ctx, at, nb[0], nb[1], GR_RED, 13);
    else dkAng(ctx, at, nb[0], nb[1], 24, K.kind === 'obtuse' ? GR_RED : GR_TERRA);
    if (K.kind !== 'acute') {
      // 最大角的對邊（斜邊或鈍角對邊）加粗
      hbSeg(ctx, nb[0], nb[1], GR_RED, 4);
    }
    [A, B, C].forEach(p => dkPt(ctx, p, GR_CREAM, 7));
    gr2Names(ctx, [A, B, C], ['A', 'B', 'C']);
    dkPt(ctx, O, GR_O, 6.5);
    dkName(ctx, O, 'O', GR_O, 15, 13);
    ctx.restore();

    const angTxt = `∠A ≈ ${gr2N(ang.A, 1)}°　∠B ≈ ${gr2N(ang.B, 1)}°　∠C ≈ ${gr2N(ang.C, 1)}°`;
    dkRow(ctx, angTxt, 414, GR_CREAM, 16);
    let where, col;
    if (K.kind === 'acute') { where = '外心 O 在三角形的內部'; col = GR_OK; }
    else if (K.kind === 'right') { where = `外心 O 在斜邊 [${GR_OPP[K.at]}] 的中點`; col = GR_G; }
    else { where = `外心 O 在三角形的外部（在 [${GR_OPP[K.at]}] 的另一側）`; col = GR_RED; }
    const head = K.kind === 'acute' ? '三個角都是銳角' : `∠${K.at} 是${GR_KIND[K.kind]}`;
    dkRow(ctx, `${head} → ${GR_KIND[K.kind]}三角形`, 442, col, 17);
    dkRow(ctx, where, 468, col, 17);

    const deg = v => gr2N(v, 1) + '^\\circ';
    out.innerHTML = `\\(\\angle A \\approx ${deg(ang.A)}\\)、<wbr>\\(\\angle B \\approx ${deg(ang.B)}\\)、<wbr>\\(\\angle C \\approx ${deg(ang.C)}\\)`;
    fb.innerHTML = wrapFeedback(K.kind === 'acute'
      ? '<strong>銳角三角形</strong>：外心在內部。試著把一個角拉成直角或鈍角。'
      : K.kind === 'right'
        ? `<strong>直角三角形</strong>：斜邊 \\(\\overline{${GR_OPP[K.at]}}\\) 就是外接圓的直徑，外心是<strong>斜邊的中點</strong>。`
        : `<strong>鈍角三角形</strong>：外心跑到外部，和鈍角頂點 \\(${K.at}\\) 分在 \\(\\overline{${GR_OPP[K.at]}}\\) 的兩側。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('c2-tri-group'), 'data-c2-tri', m => { st.P = Object.assign({}, GR_C2_PRESET[m]); draw(); });
  gr2TriDrag(cv, st, draw, gr2OInView);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：直角三角形的外接圓半徑＝斜邊的一半
   ∠C = 90°，BC = a、AC = b（整數），AB² = a² + b²（整數，hbRoot 化簡）。
   ========================================================================== */
function initC3Canvas() {
  const cv = hbEl('canvas-c3');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width;
  const out = hbEl('c3-formula'), fb = hbEl('c3-feedback');
  const sa = hbEl('c3-a'), sb = hbEl('c3-b');

  function draw() {
    const a = hbIv(sa), b = hbIv(sb);
    hbEl('c3-va').textContent = a;
    hbEl('c3-vb').textContent = b;
    const n = a * a + b * b;
    const AB = hbRoot(n), R = gr2RootFrac(n, 2);
    const mC = hbV(0, 0), mB = hbV(a, 0), mA = hbV(0, b);
    const mO = hbV(a / 2, b / 2);
    const rr = Math.sqrt(n) / 2;
    const v = dkView([hbV(mO.x - rr, mO.y - rr), hbV(mO.x + rr, mO.y + rr)], { x: 110, y: 50, w: 320, h: 300 });
    const A = v.P(mA), B = v.P(mB), C = v.P(mC), O = v.P(mO);
    const Rpx = rr * v.k;

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '直角三角形：外心在斜邊中點', GR_TONE[2]);
    gr2Circle(ctx, O, Rpx, GR_O, 2, null, 0.55);
    gr2Tri(ctx, A, B, C, 0.16);
    gr2Right(ctx, C, A, B, GR_CREAM, 12);
    hbSeg(ctx, O, A, GR_O, 3);
    hbSeg(ctx, O, B, GR_O, 3);
    hbSeg(ctx, O, C, GR_G, 3, [7, 5]);
    hbTick(ctx, O, A, 1, GR_O);
    hbTick(ctx, O, B, 1, GR_O);
    hbTick(ctx, O, C, 1, GR_G);
    [A, B, C].forEach(p => dkPt(ctx, p, GR_CREAM, 5.5));
    gr2Names(ctx, [A, B, C], ['A', 'B', 'C']);
    dkPt(ctx, O, GR_O, 6.5);
    dkName(ctx, O, 'O', GR_O, 16, -12);
    const Gc = hbCentroid([A, B, C]);
    dkSideTag(ctx, B, C, Gc, String(a), GR_TERRA, 18, 15);
    dkSideTag(ctx, A, C, Gc, String(b), GR_TERRA, 18, 15);

    dkRow(ctx, `[AB] = √(${a}² + ${b}²) = ${AB.txt}`, 388, GR_CREAM, 17);
    dkRow(ctx, `外接圓半徑 R = {1/2}[AB] = ${R.txt}${R.exact ? '' : ' ≈ ' + gr2N(R.val)}`, 422, GR_O, 18);
    dkRow(ctx, '[OA] = [OB] = [OC]：斜邊上的中線也等於斜邊的一半', 456, GR_G, 15);

    out.innerHTML = `\\(\\overline{AB} = \\sqrt{${a}^2 + ${b}^2} = ${AB.tex}\\)，<wbr>\\(R = \\frac{1}{2}\\overline{AB} = ${R.tex}\\)`;
    fb.innerHTML = wrapFeedback('直角所對的斜邊 \\(\\overline{AB}\\) 是外接圓的<strong>直徑</strong>，外心 \\(O\\) 是斜邊中點，<strong>外接圓半徑＝斜邊的一半</strong>。<br>因為 \\(\\overline{OC}\\) 也是半徑，直角頂點 \\(C\\) 到斜邊中點的距離同樣是斜邊的一半。');
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：外心與角度——∠BOC 與 ∠A
   B、C 固定在圓上、∠BOC = θ；A 在優弧上（∠A 銳角）或劣弧上（∠A 鈍角）。
   ========================================================================== */
function initC4Canvas() {
  const cv = hbEl('canvas-c4');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width;
  const out = hbEl('c4-formula'), fb = hbEl('c4-feedback');
  const sT = hbEl('c4-t'), sP = hbEl('c4-p');
  const O = hbV(270, 196), R = 138;
  let arc = 'major';

  function draw() {
    const th = hbIv(sT), p = hbIv(sP) / 100;
    hbEl('c4-vt').textContent = th + '°';
    hbEl('c4-vp').textContent = Math.round(p * 100) + '%';
    const rad = d => d * HB_RAD;
    const B = cgPolar(O, R, rad(90 + th / 2)), C = cgPolar(O, R, rad(90 - th / 2));
    const aDeg = arc === 'major' ? (90 - th / 2) - p * (360 - th) : (90 - th / 2) + p * th;
    const A = cgPolar(O, R, rad(aDeg));
    const angA = arc === 'major' ? th / 2 : 180 - th / 2;   // 圓周角＝所對弧的一半
    const meas = cgAngDeg(A, B, C);

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '圓心角 ∠BOC 和 ∠A 對的是哪一段弧？', GR_TONE[3]);
    gr2Circle(ctx, O, R, GR_CREAM, 1.8, null, 0.45);
    // ∠A 所對的弧（不含 A 的那一段）加粗
    ctx.save();
    ctx.strokeStyle = GR_TERRA;
    ctx.lineWidth = 6;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    if (arc === 'major') ctx.arc(O.x, O.y, R, rad(90 - th / 2), rad(90 + th / 2), false);
    else ctx.arc(O.x, O.y, R, rad(90 + th / 2), rad(450 - th / 2), false);
    ctx.stroke();
    ctx.restore();
    gr2Tri(ctx, A, B, C, 0.14);
    hbSeg(ctx, O, B, GR_O, 2.6);
    hbSeg(ctx, O, C, GR_O, 2.6);
    dkAng(ctx, O, B, C, 26, GR_O);
    dkAng(ctx, A, B, C, 24, GR_G);
    // 角度標籤
    const bisO = th >= 179.5 ? hbV(0, -1) : cgUnit(O, gr2Mid(B, C));
    const mA = gr2Mid(cgUnit(A, B), cgUnit(A, C));
    const ml = Math.hypot(mA.x, mA.y) || 1;
    // ∠A 很尖或 A 貼近 BC 時，標籤往頂點收，免得和 ∠BOC 的標籤疊在一起
    const dA = Math.min(50, hbDist(A, gr2Mid(B, C)) * 0.42);
    const dO = arc === 'minor' ? Math.min(42, Math.max(26, hbDist(O, gr2Mid(B, C)) * 0.6)) : 50;
    dkTag(ctx, `${th}°`, O.x + bisO.x * dO, O.y + bisO.y * dO, GR_O, 15);
    dkTag(ctx, `${gr2N(angA, 1)}°`, A.x + mA.x / ml * dA, A.y + mA.y / ml * dA, GR_G, 15);
    [A, B, C].forEach(q => dkPt(ctx, q, GR_CREAM, 5.5));
    [[A, 'A'], [B, 'B'], [C, 'C']].forEach(([q, nm]) => {
      const o = gr2Out(q, O, 19);
      dkName(ctx, q, nm, GR_CREAM, o.x, o.y);
    });
    dkPt(ctx, O, GR_O, 5.5);
    dkName(ctx, O, 'O', GR_O, th >= 179.5 ? 0 : -16, th >= 179.5 ? -16 : -6);

    const half = gr2N(th / 2, 1);
    if (arc === 'major') {
      dkRow(ctx, `∠A 是銳角（或直角），它和 ∠BOC 對同一段弧 BC`, 380, GR_CREAM, 15);
      dkRow(ctx, `∠A = {1/2}∠BOC = {1/2} × ${th}° = ${half}°`, 414, GR_G, 18);
      dkRow(ctx, `也就是 ∠BOC = 2∠A`, 448, GR_O, 17);
    } else {
      dkRow(ctx, `∠A 是鈍角（或直角），它對的是另一段弧（360° − ${th}°）`, 380, GR_CREAM, 15);
      dkRow(ctx, `∠A = {1/2}(360° − ${th}°) = ${gr2N(angA, 1)}°`, 414, GR_G, 18);
      dkRow(ctx, `也就是 ∠BOC = 360° − 2∠A`, 448, GR_O, 17);
    }

    const dg = v => gr2N(v, 1) + '^\\circ';
    out.innerHTML = arc === 'major'
      ? `\\(\\angle A = \\frac{1}{2}\\angle BOC\\)<wbr>\\({}= ${dg(angA)}\\)`
      : `\\(\\angle A = \\frac{1}{2}(360^\\circ - \\angle BOC)\\)<wbr>\\({}= ${dg(angA)}\\)`;
    out.setAttribute('data-meas', gr2N(meas, 3));
    fb.innerHTML = wrapFeedback(arc === 'major'
      ? '\\(A\\) 在優弧上移動時，\\(\\angle A\\) 一直等於 \\(\\angle BOC\\) 的一半——<strong>銳角三角形：\\(\\angle BOC = 2\\angle A\\)</strong>。'
      : '\\(A\\) 跑到劣弧上，\\(\\angle A\\) 變成鈍角，外心 \\(O\\) 在三角形外部：<strong>\\(\\angle BOC = 360^\\circ - 2\\angle A\\)</strong>。<br>反過來由 \\(\\angle BOC\\) 求 \\(\\angle A\\) 時，兩種情形都要考慮。');
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('c4-arc-group'), 'data-c4-arc', m => { arc = m; draw(); });
  [sT, sP].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：等腰三角形的外接圓半徑——設 r、列畢氏定理
   AB = AC，BC 上的高 AM = h、半底 BM = m（整數）；r = (h² + m²) / (2h)。
   ========================================================================== */
function initC5Canvas() {
  const cv = hbEl('canvas-c5');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width;
  const out = hbEl('c5-formula'), fb = hbEl('c5-feedback');
  const sm = hbEl('c5-m'), sh = hbEl('c5-h');

  function draw() {
    const m = hbIv(sm), h = hbIv(sh);
    hbEl('c5-vm').textContent = m;
    hbEl('c5-vh').textContent = h;
    const r = qOf(h * h + m * m, 2 * h);
    const rv = qVal(r);
    const mA = hbV(0, h), mB = hbV(-m, 0), mC = hbV(m, 0), mM = hbV(0, 0), mO = hbV(0, h - rv);
    const v = dkView([mA, mB, mC, mO, hbV(0, Math.min(0, h - rv) - 0.4)], { x: 80, y: 76, w: 380, h: 226 });
    const A = v.P(mA), B = v.P(mB), C = v.P(mC), M = v.P(mM), O = v.P(mO);

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '等腰三角形：外心在底邊的中垂線上', GR_TONE[4]);
    gr2Clip(ctx, 40, 318);
    gr2Circle(ctx, O, rv * v.k, GR_O, 1.8, null, 0.45);
    gr2Tri(ctx, A, B, C, 0.16);
    gr2Line(ctx, A, M, 'rgba(108, 195, 234, 0.35)', 1.4, [5, 5]);
    hbSeg(ctx, A, M, GR_CREAM, 2, [6, 4]);
    if (m !== h) {
      hbSeg(ctx, O, M, GR_G, 4);
      hbSeg(ctx, O, B, GR_O, 3);
      gr2Right(ctx, M, C, A, GR_CREAM, 11);
    }
    hbTick(ctx, A, B, 1, GR_CREAM);
    hbTick(ctx, A, C, 1, GR_CREAM);
    [A, B, C, M].forEach(p => dkPt(ctx, p, GR_CREAM, 5));
    gr2Names(ctx, [A, B, C], ['A', 'B', 'C']);
    dkName(ctx, M, 'M', GR_CREAM, m === h ? 16 : 14, m === h ? 18 : (h - rv > 0 ? 15 : -14));
    dkPt(ctx, O, GR_O, 6);
    dkName(ctx, O, 'O', GR_O, -16, m === h ? -14 : 0);
    const Gc = hbCentroid([A, B, C]);
    dkTag(ctx, String(m), (B.x + M.x) / 2, M.y + (h - rv >= 0 ? 16 : -16), GR_TERRA, 14);
    dkTag(ctx, String(h), A.x + 18, (A.y + M.y) / 2, GR_TERRA, 14);
    if (m !== h) dkSideTag(ctx, O, B, Gc, 'r', GR_O, 14, 15);
    ctx.restore();

    const rTxt = r[1] === 1 ? String(r[0]) : `{${r[0]}/${r[1]}}`;
    dkRow(ctx, `已知 [BM] = ${m}、[AM] = ${h}；設 [OA] = [OB] = r`, 340, GR_CREAM, 16);
    if (m === h) {
      dkRow(ctx, '[AM] = [BM]：∠A = 90°，外心 O 就是底邊中點 M', 374, GR_G, 16);
      dkRow(ctx, `r = [BM] = ${m}`, 410, GR_O, 18);
    } else {
      dkRow(ctx, m < h ? `O 在 [AM] 上：[OM] = ${h} − r`
                       : `∠A 是鈍角，O 在 [BC] 下方：[OM] = r − ${h}`, 374, GR_G, 16);
      dkRow(ctx, `直角 △OBM：r² = (${h} − r)² + ${m}²`, 410, GR_CREAM, 17);
      dkRow(ctx, `${2 * h}r = ${h * h + m * m}，r = ${rTxt}`, 446, GR_O, 18);
    }

    out.innerHTML = m === h
      ? `\\(r = \\overline{BM} = ${m}\\)`
      : `\\(r^2 = (${h} - r)^2 + ${m}^2\\)<wbr>\\(\\;\\Rightarrow\\; r = ${qTex(r)}\\)`;
    fb.innerHTML = wrapFeedback(m < h
      ? '頂角是銳角：外心 \\(O\\) 在高 \\(\\overline{AM}\\) 上，\\(\\overline{OM} = h - r\\)。'
      : m > h
        ? '頂角是鈍角：外心 \\(O\\) 跑到 \\(\\overline{BC}\\) 下方，\\(\\overline{OM} = r - h\\)；平方之後方程式和銳角時<strong>一模一樣</strong>。'
        : '頂角剛好是直角：外心是斜邊 \\(\\overline{BC}\\) 的中點。');
    typeset([out, fb]);
  }

  [sm, sh].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：內心——尺規作兩條角平分線（逐步播放）
   ========================================================================== */
function initC6Canvas() {
  const cv = hbEl('canvas-c6');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const out = hbEl('c6-formula'), fb = hbEl('c6-feedback');
  const st = { k: 1 };
  const UNIT = 30;
  let which = 0;

  function draw() {
    const { A, B, C } = GR_CG_TRIS[which];
    const bA = gr2CgAngBis(A, B, C), bB = gr2CgAngBis(B, C, A), bC = gr2CgAngBis(C, A, B);
    const I = cgLL(A, bA.X, B, bB.X);
    const fP = gr2Foot(I, A, B), fQ = gr2Foot(I, B, C), fR = gr2Foot(I, C, A);
    const r = cgDist(I, fQ);
    const angSteps = (V, b, nm) => [
      { tool: 'compass', text: `以 ${nm} 為圓心畫弧，交 ∠${nm} 的兩邊於兩點。`,
        compass: { c: V, r: b.rr, ang: (cgAng(V, b.P1) + cgAng(V, b.Q1)) / 2, label: '' },
        draw: c => cgArcAt(c, V, b.rr, [b.P1, b.Q1], 0.18, GR_TERRA) },
      { tool: 'compass', text: '以第一個交點為圓心、適當長為半徑，在角的內部畫弧。',
        compass: { c: b.P1, r: b.r2, ang: cgAng(b.P1, b.X), label: '' },
        draw: c => cgArcDir(c, b.P1, b.r2, cgAng(b.P1, b.X), 0.3, GR_TERRA) },
      { tool: 'compass', text: '以第二個交點為圓心、同樣的半徑畫弧，兩弧交於一點。',
        compass: { c: b.Q1, r: b.r2, ang: cgAng(b.Q1, b.X), label: '' },
        draw: c => cgArcDir(c, b.Q1, b.r2, cgAng(b.Q1, b.X), 0.3, GR_TERRA) },
      { tool: 'ruler', text: `連接 ${nm} 和這個交點：就是 ∠${nm} 的角平分線。`, ruler: [V, b.end],
        draw: c => cgSeg(c, V, b.end, GR_I, 2.6) }
    ];
    const steps = angSteps(A, bA, 'A').concat(angSteps(B, bB, 'B')).concat([
      { tool: 'look', text: '兩條角平分線交於 I。從 I 作三邊的垂線：三段一樣長。',
        draw: c => {
          [fP, fQ, fR].forEach(q => cgSeg(c, I, q, GR_G, 2.2));
          gr2Right(c, fP, A, I, GR_G, 9);
          gr2Right(c, fQ, C, I, GR_G, 9);
          gr2Right(c, fR, A, I, GR_G, 9);
        } },
      { tool: 'look', text: '以 I 為圓心、IP 為半徑畫圓：它和三邊都只碰一點——內切圓。',
        draw: c => cgArc(c, I, r, 0, Math.PI * 2, 'rgba(159, 211, 106, 0.7)', 2.4) },
      { tool: 'look', text: '∠C 的角平分線也一定通過 I（虛線）。內心永遠在三角形內部。',
        draw: c => cgSeg(c, C, bC.end, GR_PLUM, 2, [7, 5]) }
    ]);
    cgSync('c6', st, steps.length);
    const ip = cgDist(I, fP) / UNIT, iq = cgDist(I, fQ) / UNIT, ir = cgDist(I, fR) / UNIT;
    const G = hbCentroid([A, B, C]);
    cgRender(ctx, {
      title: '遊戲場要離三條路一樣遠：尺規找內心', color: GR_TONE[5], k: st.k, steps,
      given: c => gr2CgTri(c, A, B, C),
      pts: gr2CgLabels(A, B, C).concat([
        { p: I, n: 'I', s: 8, c: GR_I, dx: 0, dy: -18 },
        { p: fP, n: 'P', s: 9, c: GR_G, ...(() => { const o = gr2Out(fP, G, 16); return { dx: o.x, dy: o.y }; })() },
        { p: fQ, n: 'Q', s: 9, c: GR_G, dx: 0, dy: 17 },
        { p: fR, n: 'R', s: 9, c: GR_G, ...(() => { const o = gr2Out(fR, G, 16); return { dx: o.x, dy: o.y }; })() }
      ]),
      measure: st.k >= 9 ? [`量一量：IP ≈ ${ip.toFixed(2)}、IQ ≈ ${iq.toFixed(2)}、IR ≈ ${ir.toFixed(2)}（單位）`, GR_OK] : null
    });

    if (st.k >= 9) {
      out.innerHTML = `\\(\\overline{IP} = \\overline{IQ} = \\overline{IR} \\approx ${ip.toFixed(2)}\\)`;
    } else {
      out.innerHTML = `步驟 \\(${st.k}\\)：${st.k <= 4 ? '先作 \\(\\angle A\\) 的角平分線' : '再作 \\(\\angle B\\) 的角平分線'}`;
    }
    fb.innerHTML = wrapFeedback('\\(I\\) 在 \\(\\angle A\\) 的平分線上，所以到 \\(\\overline{AB}\\)、\\(\\overline{AC}\\) 等距；又在 \\(\\angle B\\) 的平分線上，所以到 \\(\\overline{BA}\\)、\\(\\overline{BC}\\) 等距。<br>於是 \\(I\\) 到三邊等距，也在 \\(\\angle C\\) 的平分線上：<strong>三條角平分線交於一點</strong>，就是<strong>內心</strong>。');
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('c6-tri-group'), 'data-c6-tri', m => { which = parseInt(m, 10); st.k = 1; draw(); });
  cgSteps('c6', st, draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：外心還是內心——拖曳一點 P，比「到三頂點」與「到三邊」的距離
   ========================================================================== */
const GR_C7_TRIS = [
  { A: hbV(6, 9), B: hbV(1, 2), C: hbV(14, 3) },
  { A: hbV(6, 5), B: hbV(4, 7), C: hbV(12, 7) }
];

function initC7Canvas() {
  const cv = hbEl('canvas-c7');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width;
  const out = hbEl('c7-formula'), fb = hbEl('c7-feedback');
  let which = 0, look = 'pts';
  const st = { Pt: hbV(8, 4.5) };

  function geo() {
    const T3 = GR_C7_TRIS[which];
    const g = { A: gr2Px(T3.A), B: gr2Px(T3.B), C: gr2Px(T3.C) };
    g.O = gr2Circum(g.A, g.B, g.C);
    g.I = gr2Incenter(g.A, g.B, g.C);
    return g;
  }

  function draw() {
    const g = geo();
    const { A, B, C } = g;
    const P = gr2Px(st.Pt);
    const dV = [hbDist(P, A), hbDist(P, B), hbDist(P, C)].map(d => d / GR_U);
    const feet = [gr2Foot(P, B, C), gr2Foot(P, C, A), gr2Foot(P, A, B)];
    const dL = feet.map(q => hbDist(P, q) / GR_U);
    const ds = look === 'pts' ? dV : dL;
    const eq = Math.max(...ds) - Math.min(...ds) < 0.03;

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, look === 'pts' ? '三個帳篷 A、B、C：拖 P 找離三點一樣遠的地方' : '三條路 AB、BC、CA：拖 P 找離三條路一樣遠的地方', GR_TONE[6]);
    gr2Clip(ctx, 40, 392);
    gr2Grid(ctx);
    if (look === 'lines') {
      [[A, B], [B, C], [C, A]].forEach(([u, w]) => gr2Line(ctx, u, w, 'rgba(232, 131, 79, 0.35)', 6));
    }
    gr2Tri(ctx, A, B, C, 0.14);
    if (look === 'pts') {
      [A, B, C].forEach((q, i) => {
        hbSeg(ctx, P, q, eq ? GR_OK : GR_O, 2.6);
        dkTag(ctx, gr2N(dV[i]), (P.x + q.x) / 2, (P.y + q.y) / 2, eq ? GR_OK : GR_O, 14);
      });
    } else {
      feet.forEach((q, i) => {
        hbSeg(ctx, P, q, eq ? GR_OK : GR_I, 2.6);
        dkTag(ctx, gr2N(dL[i]), (P.x + q.x) / 2, (P.y + q.y) / 2, eq ? GR_OK : GR_I, 14);
      });
    }
    // 外心、內心的位置提示（小空心圈）
    [[g.O, GR_O], [g.I, GR_I]].forEach(([q, col]) => {
      ctx.save();
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(q.x, q.y, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    [A, B, C].forEach(q => dkPt(ctx, q, GR_CREAM, 6));
    gr2Names(ctx, [A, B, C], ['A', 'B', 'C']);
    dkPt(ctx, P, GR_G, 8);
    dkName(ctx, P, 'P', GR_G, 15, -15);
    ctx.restore();

    const names = look === 'pts' ? ['[PA]', '[PB]', '[PC]'] : ['到 [BC]', '到 [CA]', '到 [AB]'];
    dkRow(ctx, names.map((nm, i) => `${nm} ≈ ${gr2N(ds[i])}`).join('　'), 414, GR_CREAM, 16);
    if (eq) {
      dkRow(ctx, look === 'pts' ? 'P 到三個頂點一樣遠：P 就是外心 O' : 'P 到三條邊一樣遠：P 就是內心 I', 446, GR_OK, 18);
    } else {
      dkRow(ctx, look === 'pts' ? '還沒一樣遠：P 要落在三條中垂線的交點' : '還沒一樣遠：P 要落在三條角平分線的交點', 446, GR_CREAM, 16);
    }
    dkRow(ctx, '藍色虛圈是外心、綠色虛圈是內心（可按下方按鈕直接移過去）', 474, GR_FAINT, 13);

    const L = look === 'pts' ? ['\\overline{PA}', '\\overline{PB}', '\\overline{PC}'] : ['d_{BC}', 'd_{CA}', 'd_{AB}'];
    out.innerHTML = L.map((nm, i) => `\\(${nm} \\approx ${gr2N(ds[i])}\\)`).join('、<wbr>');
    fb.innerHTML = wrapFeedback(look === 'pts'
      ? '「到三個<strong>點</strong>等距」→ 中垂線的交點 → <strong>外心</strong>（營火與三個帳篷）。'
      : '「到三條<strong>線</strong>等距」→ 角平分線的交點 → <strong>內心</strong>（遊戲場與三條路）。<br>同一個三角形，外心和內心通常不是同一點。');
    typeset([out, fb]);
  }

  gr2Drag(cv, {
    handles: () => [{ key: 'P', p: gr2Px(st.Pt) }],
    move: (k, g) => {
      let n = hbV(clamp(g.x, 0, GR_NX), clamp(g.y, -0.5, GR_NY + 0.5));
      // 很接近外心／內心時吸附過去
      const G2 = geo();
      [G2.O, G2.I].forEach(q => { const gq = gr2Gd(q); if (Math.hypot(gq.x - n.x, gq.y - n.y) < 0.28) n = gq; });
      st.Pt = n;
      draw();
    }
  });
  bindPickGroup(hbEl('c7-tri-group'), 'data-c7-tri', m => { which = parseInt(m, 10); st.Pt = hbV(8, 4.5); draw(); });
  bindPickGroup(hbEl('c7-look-group'), 'data-c7-look', m => { look = m; draw(); });
  hbEl('c7-toO').addEventListener('click', () => { st.Pt = gr2Gd(geo().O); draw(); });
  hbEl('c7-toI').addEventListener('click', () => { st.Pt = gr2Gd(geo().I); draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：內心與角度——∠BIC = 90° + ½∠A
   ========================================================================== */
function initC8Canvas() {
  const cv = hbEl('canvas-c8');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width;
  const out = hbEl('c8-formula'), fb = hbEl('c8-feedback');
  const sB = hbEl('c8-b'), sC = hbEl('c8-c');

  function draw() {
    const b = hbIv(sB), c = hbIv(sC);
    hbEl('c8-vb').textContent = b + '°';
    hbEl('c8-vc').textContent = c + '°';
    const a = 180 - b - c;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '內心 I 與 ∠BIC', GR_TONE[7]);
    if (a <= 0) {
      dkRow(ctx, `∠B + ∠C = ${b + c}°，已經不小於 180°`, 200, GR_NO, 18);
      dkRow(ctx, '三角形的三個內角和是 180°，這樣的三角形不存在（情境不成立）', 236, GR_NO, 15);
      dkRow(ctx, '把 ∠B 或 ∠C 調小，讓兩角的和小於 180°', 272, GR_CREAM, 15);
      out.innerHTML = `\\(\\angle B + \\angle C = ${b + c}^\\circ\\)（情境不成立）`;
      fb.innerHTML = wrapFeedback(`\\(\\angle B = ${b}^\\circ\\)、\\(\\angle C = ${c}^\\circ\\) 加起來已經 \\(${b + c}^\\circ\\)，第三個角沒有空間。把其中一個角調小。`);
      typeset([out, fb]);
      return;
    }
    const t = hbTriangle(a, b, { x: 70, y: 62, w: 400, h: 230 });
    const A = t.A, B = t.B, C = t.C;
    const I = gr2Incenter(A, B, C);
    gr2Tri(ctx, A, B, C, 0.14);
    hbSeg(ctx, A, I, GR_FAINT, 1.6, [5, 4]);
    hbSeg(ctx, B, I, GR_I, 2.6);
    hbSeg(ctx, C, I, GR_I, 2.6);
    dkAng(ctx, B, A, I, 36, GR_TERRA);
    dkAng(ctx, B, I, C, 44, GR_TERRA, { alpha: 0.12 });
    dkAng(ctx, C, A, I, 36, GR_ROSE);
    dkAng(ctx, C, I, B, 44, GR_ROSE, { alpha: 0.12 });
    dkAng(ctx, I, B, C, 22, GR_G);
    [A, B, C].forEach(q => dkPt(ctx, q, GR_CREAM, 5.5));
    gr2Names(ctx, [A, B, C], ['A', 'B', 'C']);
    dkPt(ctx, I, GR_I, 6.5);
    dkName(ctx, I, 'I', GR_I, 0, -17);
    const hb = b / 2, hc = c / 2, bic = 180 - hb - hc;
    dkTag(ctx, `${gr2N(bic, 1)}°`, I.x, I.y + 36, GR_G, 14);
    dkTag(ctx, `${a}°`, A.x, A.y + 30, GR_CREAM, 13);

    dkRow(ctx, `∠IBC = {1/2}∠B = ${gr2N(hb, 1)}°，∠ICB = {1/2}∠C = ${gr2N(hc, 1)}°`, 344, GR_CREAM, 16);
    dkRow(ctx, `∠BIC = 180° − ${gr2N(hb, 1)}° − ${gr2N(hc, 1)}° = ${gr2N(bic, 1)}°`, 384, GR_G, 18);
    dkRow(ctx, `= 90° + {1/2}∠A = 90° + ${gr2N(a / 2, 1)}° = ${gr2N(90 + a / 2, 1)}°`, 424, GR_I, 18);
    dkRow(ctx, `∠A = 180° − ${b}° − ${c}° = ${a}°`, 462, GR_FAINT, 14);

    out.innerHTML = `\\(\\angle BIC = 90^\\circ + \\frac{1}{2} \\times ${a}^\\circ\\)<wbr>\\({}= ${gr2N(90 + a / 2, 1)}^\\circ\\)`;
    out.setAttribute('data-meas', gr2N(cgAngDeg(I, B, C), 3));
    fb.innerHTML = wrapFeedback('\\(\\angle BIC\\)<wbr>\\({}= 180^\\circ - \\frac{1}{2}(\\angle B + \\angle C)\\)<wbr>\\({}= 180^\\circ - \\frac{1}{2}(180^\\circ - \\angle A)\\)，<br>所以 <strong>\\(\\angle BIC = 90^\\circ + \\frac{1}{2}\\angle A\\)</strong>，一定比 \\(90^\\circ\\) 大。和外心的 \\(\\angle BOC = 2\\angle A\\) 不要搞混。');
    typeset([out, fb]);
  }

  [sB, sC].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：內心把三角形分成三塊，面積比＝邊長比
   三邊 a = BC、b = CA、c = AB（整數滑桿），由三邊作圖；三邊不合三角不等式時情境不成立。
   ========================================================================== */
function initC9Canvas() {
  const cv = hbEl('canvas-c9');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width;
  const out = hbEl('c9-formula'), fb = hbEl('c9-feedback');
  const sa = hbEl('c9-a'), sb = hbEl('c9-b'), sc = hbEl('c9-c');

  function draw() {
    const a = hbIv(sa), b = hbIv(sb), c = hbIv(sc);
    hbEl('c9-va').textContent = a;
    hbEl('c9-vb').textContent = b;
    hbEl('c9-vc').textContent = c;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '內心把三角形切成三塊：高都是 r', GR_TONE[8]);
    const sorted = [a, b, c].sort((x, y) => x - y);
    if (sorted[0] + sorted[1] <= sorted[2]) {
      dkRow(ctx, `${sorted[0]} + ${sorted[1]} = ${sorted[0] + sorted[1]}，沒有大於 ${sorted[2]}`, 200, GR_NO, 18);
      dkRow(ctx, '兩邊之和必須大於第三邊，這三段圍不成三角形（情境不成立）', 236, GR_NO, 15);
      dkRow(ctx, '把最長的那一邊調短，或把另外兩邊調長', 272, GR_CREAM, 15);
      out.innerHTML = `\\(${sorted[0]} + ${sorted[1]} \\le ${sorted[2]}\\)（情境不成立）`;
      fb.innerHTML = wrapFeedback('三角不等式：任兩邊的和要大於第三邊。調整滑桿讓三段圍得起來。');
      typeset([out, fb]);
      return;
    }
    const t = dkTriSides(a, b, c);
    const v = dkView([t.A, t.B, t.C], { x: 70, y: 56, w: 400, h: 232 });
    const A = v.P(t.A), B = v.P(t.B), C = v.P(t.C);
    const I = gr2Incenter(A, B, C);
    const fa = gr2Foot(I, B, C), fb2 = gr2Foot(I, C, A), fc = gr2Foot(I, A, B);
    const cols = [GR_O, GR_I, GR_G];
    dkPoly(ctx, [B, I, C], cols[0], 0.3, 2);
    dkPoly(ctx, [C, I, A], cols[1], 0.3, 2);
    dkPoly(ctx, [A, I, B], cols[2], 0.3, 2);
    gr2Tri(ctx, A, B, C, 0);
    [fa, fb2, fc].forEach((q, i) => hbSeg(ctx, I, q, GR_CREAM, 1.8, [5, 4]));
    gr2Right(ctx, fa, C, I, GR_CREAM, 8);
    gr2Right(ctx, fb2, A, I, GR_CREAM, 8);
    gr2Right(ctx, fc, B, I, GR_CREAM, 8);
    [A, B, C].forEach(q => dkPt(ctx, q, GR_CREAM, 5));
    gr2Names(ctx, [A, B, C], ['A', 'B', 'C']);
    dkPt(ctx, I, GR_CREAM, 5.5);
    dkName(ctx, I, 'I', GR_CREAM, 0, -16);
    const Gc = hbCentroid([A, B, C]);
    dkSideTag(ctx, B, C, Gc, String(a), cols[0], 18, 15);
    dkSideTag(ctx, C, A, Gc, String(b), cols[1], 18, 15);
    dkSideTag(ctx, A, B, Gc, String(c), cols[2], 18, 15);

    // 精確：面積比＝a : b : c 約到最簡
    const g = gcd(gcd(a, b), c);
    const s2 = (a + b + c) / 2;
    const tArea = Math.sqrt(s2 * (s2 - a) * (s2 - b) * (s2 - c));
    const r = 2 * tArea / (a + b + c);
    dkRich(ctx, [['△BIC', cols[0]], [' : ', GR_CREAM], ['△CIA', cols[1]], [' : ', GR_CREAM], ['△AIB', cols[2]]], W / 2, 338, 18);
    dkRow(ctx, `= {1/2}·${a}·r : {1/2}·${b}·r : {1/2}·${c}·r`, 374, GR_CREAM, 17);
    dkRow(ctx, `= ${a} : ${b} : ${c}${g > 1 ? ` = ${a / g} : ${b / g} : ${c / g}` : ''}`, 412, GR_OK, 19);
    dkRow(ctx, `（r ≈ ${gr2N(r)}；三塊面積 ≈ ${gr2N(a * r / 2)}、${gr2N(b * r / 2)}、${gr2N(c * r / 2)}）`, 448, GR_FAINT, 14);

    out.innerHTML = `\\(\\triangle BIC : \\triangle CIA : \\triangle AIB\\)<wbr>\\({}= ${a / g} : ${b / g} : ${c / g}\\)`;
    out.setAttribute('data-meas', [hbPolyArea([B, I, C]), hbPolyArea([C, I, A]), hbPolyArea([A, I, B])].map(x => gr2N(x, 4)).join(','));
    fb.innerHTML = wrapFeedback('三塊三角形的高都是內切圓半徑 \\(r\\)，底分別是三邊——<strong>高一樣，面積比就是底的比</strong>：<br>\\(\\triangle BIC : \\triangle CIA : \\triangle AIB\\)<wbr>\\({}= \\overline{BC} : \\overline{CA} : \\overline{AB}\\)。');
    typeset([out, fb]);
  }

  [sa, sb, sc].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：三角形面積＝½ × r × 周長
   五個邊長都是整數、面積也是整數的三角形；下方把三塊攤平排成一列。
   ========================================================================== */
const GR_C10_TRIS = [
  { a: 14, b: 15, c: 13, area: 84 },
  { a: 6, b: 5, c: 5, area: 12 },
  { a: 10, b: 13, c: 13, area: 60 },
  { a: 17, b: 10, c: 9, area: 36 },
  { a: 5, b: 4, c: 3, area: 6 }
];

function initC10Canvas() {
  const cv = hbEl('canvas-c10');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width;
  const out = hbEl('c10-formula'), fb = hbEl('c10-feedback');
  let which = 0;

  function draw() {
    const S = GR_C10_TRIS[which];
    const { a, b, c, area } = S;
    const per = a + b + c;
    const r = qOf(2 * area, per);
    const t = dkTriSides(a, b, c);
    const v = dkView([t.A, t.B, t.C], { x: 120, y: 54, w: 300, h: 190 });
    const A = v.P(t.A), B = v.P(t.B), C = v.P(t.C);
    const I = gr2Incenter(A, B, C);
    const rpx = gr2LDist(I, B, C);
    const cols = [GR_O, GR_I, GR_G];

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '三塊的高都是 r：攤平排成一列', GR_TONE[9]);
    dkPoly(ctx, [B, I, C], cols[0], 0.3, 1.6);
    dkPoly(ctx, [C, I, A], cols[1], 0.3, 1.6);
    dkPoly(ctx, [A, I, B], cols[2], 0.3, 1.6);
    gr2Tri(ctx, A, B, C, 0);
    gr2Circle(ctx, I, rpx, GR_CREAM, 1.6, [4, 4], 0.7);
    [A, B, C].forEach(q => dkPt(ctx, q, GR_CREAM, 4.5));
    gr2Names(ctx, [A, B, C], ['A', 'B', 'C']);
    dkPt(ctx, I, GR_CREAM, 4.5);
    const Gc = hbCentroid([A, B, C]);
    dkSideTag(ctx, B, C, Gc, String(a), cols[0], 16, 14);
    dkSideTag(ctx, C, A, Gc, String(b), cols[1], 16, 14);
    dkSideTag(ctx, A, B, Gc, String(c), cols[2], 16, 14);

    // 攤平：三塊依序排在同一條底線上，頂點都在高 r 的那條線上（另一個比例尺）
    const k2 = 470 / per;
    const base = 330, x0 = 35;
    const hpx = qVal(r) * k2;
    let x = x0;
    [[a, cols[0], B, C], [b, cols[1], C, A], [c, cols[2], A, B]].forEach(([len, col, U, V2]) => {
      const foot = gr2Foot(I, U, V2);
      const tpos = hbDist(U, foot) / hbDist(U, V2);
      const P0 = hbV(x, base), P1 = hbV(x + len * k2, base), Ap = hbV(x + len * k2 * tpos, base - hpx);
      dkPoly(ctx, [P0, P1, Ap], col, 0.35, 1.6);
      textCenter(ctx, String(len), (P0.x + P1.x) / 2, base + 14, col, f(800, 13));
      x += len * k2;
    });
    hbSeg(ctx, hbV(x0, base - hpx), hbV(x, base - hpx), GR_CREAM, 1.2, [4, 4]);
    textLeft(ctx, `r = ${r[1] === 1 ? r[0] : r[0] + '/' + r[1]}`, x0, base - hpx - 12, GR_CREAM, f(800, 13));
    textCenter(ctx, '（攤平的這一列另外縮小畫）', W / 2, base + 34, GR_FAINT, f(600, 12));

    const rTxt = r[1] === 1 ? String(r[0]) : `{${r[0]}/${r[1]}}`;
    dkRow(ctx, `面積 = {1/2}·${a}·r + {1/2}·${b}·r + {1/2}·${c}·r = {1/2} × r × ${per}`, 398, GR_CREAM, 16);
    dkRow(ctx, `已知面積 ${area}：${area} = {1/2} × r × ${per}，r = ${rTxt}`, 436, GR_I, 18);
    dkRow(ctx, '面積 = {1/2} × 內切圓半徑 × 周長', 472, GR_G, 16);

    out.innerHTML = `\\(${area} = \\frac{1}{2} \\times r \\times ${per}\\)<wbr>\\(\\;\\Rightarrow\\; r = ${qTex(r)}\\)`;
    out.setAttribute('data-meas', gr2N(rpx / v.k, 4));
    fb.innerHTML = wrapFeedback('三塊三角形的高都是 \\(r\\)，底加起來是周長 \\(s\\)：<strong>\\(\\triangle ABC\\) 面積 \\(= \\frac{1}{2}rs\\)</strong>。<br>知道面積和周長可以求 \\(r\\)；知道 \\(r\\) 和周長可以求面積。');
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('c10-tri-group'), 'data-c10-tri', m => { which = parseInt(m, 10); draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 11：直角三角形的內切圓半徑 r = (兩股和 − 斜邊) ÷ 2
   ∠C = 90°，BC = a、AC = b（整數）；c² = a² + b²。
   ========================================================================== */
function initC11Canvas() {
  const cv = hbEl('canvas-c11');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width;
  const out = hbEl('c11-formula'), fb = hbEl('c11-feedback');
  const sa = hbEl('c11-a'), sb = hbEl('c11-b');

  function draw() {
    const a = hbIv(sa), b = hbIv(sb);
    hbEl('c11-va').textContent = a;
    hbEl('c11-vb').textContent = b;
    const n = a * a + b * b;
    const cR = hbRoot(n);
    const cv2 = Math.sqrt(n);
    const rv = (a + b - cv2) / 2;
    const mC = hbV(0, 0), mB = hbV(a, 0), mA = hbV(0, b);
    const v = dkView([mA, mB, mC], { x: 110, y: 54, w: 320, h: 250 });
    const A = v.P(mA), B = v.P(mB), C = v.P(mC);
    const I = v.P(hbV(rv, rv));
    const Pp = v.P(hbV(0, rv)), Qp = v.P(hbV(rv, 0));
    const Rp = gr2Foot(I, A, B);

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '直角三角形的內切圓：切線段一樣長', GR_TONE[10]);
    dkPoly(ctx, [C, Qp, I, Pp], GR_I, 0.25, 1.8);
    gr2Tri(ctx, A, B, C, 0.1);
    gr2Circle(ctx, I, rv * v.k, GR_I, 2.2);
    // 切線段：A 出發的兩段（金）、B 出發的兩段（藍）
    hbSeg(ctx, A, Pp, GR_G, 4.5);
    hbSeg(ctx, A, Rp, GR_G, 4.5);
    hbSeg(ctx, B, Qp, GR_O, 4.5);
    hbSeg(ctx, B, Rp, GR_O, 4.5);
    gr2Right(ctx, C, A, B, GR_CREAM, 11);
    [Pp, Qp, Rp].forEach(q => dkPt(ctx, q, GR_CREAM, 4));
    [A, B, C].forEach(q => dkPt(ctx, q, GR_CREAM, 5.5));
    gr2Names(ctx, [A, B, C], ['A', 'B', 'C']);
    dkPt(ctx, I, GR_I, 5.5);
    dkName(ctx, I, 'I', GR_I, 13, -12);
    dkName(ctx, Pp, 'P', GR_CREAM, -15, 0);
    dkName(ctx, Qp, 'Q', GR_CREAM, 0, 16);
    const Gc = hbCentroid([A, B, C]);
    const o = gr2Out(Rp, I, 16);
    dkName(ctx, Rp, 'R', GR_CREAM, o.x, o.y);
    dkTag(ctx, String(a), (C.x + B.x) / 2 + 30, C.y + 34, GR_TERRA, 14);
    dkTag(ctx, String(b), C.x - 34, (C.y + A.y) / 2 - 20, GR_TERRA, 14);
    dkTag(ctx, 'r', (C.x + Qp.x) / 2, C.y + 15, GR_I, 13);

    const cTxt = cR.txt;
    let rTex, rTxt;
    if (cR.exact) {
      const q = qOf(a + b - cR.k, 2);
      rTex = qTex(q);
      rTxt = q[1] === 1 ? String(q[0]) : `{${q[0]}/${q[1]}}`;
    } else {
      rTex = `\\frac{${a + b} - ${cR.tex}}{2}`;
      rTxt = `{${a + b} − ${cTxt}/2} ≈ ${gr2N(rv)}`;
    }
    dkRow(ctx, `CPIQ 是正方形：[CP] = [CQ] = r`, 344, GR_I, 16);
    dkRow(ctx, '[AP] = [AR]、[BQ] = [BR]（圓外一點的兩條切線段等長）', 376, GR_CREAM, 15);
    dkRow(ctx, `[AC] + [BC] = [AB] + 2r：${b} + ${a} = ${cTxt} + 2r`, 412, GR_CREAM, 16);
    dkRow(ctx, `r = ${rTxt}`, 450, GR_OK, 19);

    out.innerHTML = `\\(\\overline{AB} = \\sqrt{${a}^2 + ${b}^2} = ${cR.tex}\\)，<wbr>\\(r = \\frac{${a} + ${b} - ${cR.exact ? cR.k : cR.tex}}{2}\\)<wbr>\\({}= ${rTex}\\)`;
    out.setAttribute('data-meas', gr2N(gr2LDist(I, A, B) / v.k, 4));
    fb.innerHTML = wrapFeedback('<strong>兩股和＝斜邊＋2r</strong>，所以 \\(r = \\frac{\\text{兩股和} - \\text{斜邊}}{2}\\)。<br>它是 \\(\\frac{1}{2}rs\\) 以外的第二種求法，只適用於<strong>直角三角形</strong>。');
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 12：過內心作一邊的平行線——小三角形的周長＝另外兩邊的和
   ========================================================================== */
function initC12Canvas() {
  const cv = hbEl('canvas-c12');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width;
  const out = hbEl('c12-formula'), fb = hbEl('c12-feedback');
  const st = { P: { A: hbV(6, 9), B: hbV(1, 2), C: hbV(14, 2) } };
  let side = 'A';   // 平行於頂點 side 的對邊

  function draw() {
    const px = gr2TriPx(st.P);
    const nm = { A: ['B', 'C'], B: ['C', 'A'], C: ['A', 'B'] }[side];
    const V = px[side], P1 = px[nm[0]], P2 = px[nm[1]];
    const I = gr2Incenter(px.A, px.B, px.C);
    const dir = hbV(I.x + (P2.x - P1.x), I.y + (P2.y - P1.y));
    const D = cgLL(I, dir, V, P1), E = cgLL(I, dir, V, P2);
    const len = (p, q) => hbDist(p, q) / GR_U;
    const per = len(V, D) + len(D, E) + len(E, V);
    const sum = len(V, P1) + len(V, P2);

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `過內心 I 作 ${nm.join('')} 的平行線`, GR_TONE[11]);
    gr2Clip(ctx, 40, 392);
    gr2Grid(ctx);
    gr2Tri(ctx, px.A, px.B, px.C, 0.1);
    dkPoly(ctx, [V, D, E], GR_PLUM, 0.22, 2.4);
    hbSeg(ctx, D, E, GR_I, 3);
    hbSeg(ctx, P1, I, GR_FAINT, 1.6, [5, 4]);
    hbSeg(ctx, P2, I, GR_FAINT, 1.6, [5, 4]);
    hbSeg(ctx, D, P1, GR_G, 4);
    hbSeg(ctx, D, I, GR_G, 4);
    hbSeg(ctx, E, P2, GR_O, 4);
    hbSeg(ctx, E, I, GR_O, 4);
    hbTick(ctx, D, P1, 1, GR_G);
    hbTick(ctx, D, I, 1, GR_G);
    hbTick(ctx, E, P2, 2, GR_O);
    hbTick(ctx, E, I, 2, GR_O);
    dkAng(ctx, P1, V, I, 26, GR_G, { alpha: 0.35 });
    dkAng(ctx, P1, I, P2, 32, GR_G, { alpha: 0.15 });
    dkAng(ctx, I, D, P1, 22, GR_G, { alpha: 0.35 });
    [px.A, px.B, px.C].forEach(q => dkPt(ctx, q, GR_CREAM, 6.5));
    gr2Names(ctx, [px.A, px.B, px.C], ['A', 'B', 'C']);
    [D, E].forEach(q => dkPt(ctx, q, GR_CREAM, 4.5));
    const oD = gr2Out(D, I, 17), oE = gr2Out(E, I, 17);
    dkName(ctx, D, 'D', GR_CREAM, oD.x, oD.y);
    dkName(ctx, E, 'E', GR_CREAM, oE.x, oE.y);
    dkPt(ctx, I, GR_I, 5.5);
    const oI = gr2Out(I, V, 16);
    dkName(ctx, I, 'I', GR_I, oI.x, oI.y);
    ctx.restore();

    dkRow(ctx, `[D${nm[0]}] = [DI]、[E${nm[1]}] = [EI]（角平分線＋內錯角 → 等腰）`, 414, GR_CREAM, 15);
    dkRow(ctx, `△${side}DE 的周長 = [${side}D] + [DI] + [IE] + [E${side}] = [${side}${nm[0]}] + [${side}${nm[1]}]`, 444, GR_PLUM, 15);
    dkRow(ctx, `量一量：${gr2N(per)} = ${gr2N(len(V, P1))} + ${gr2N(len(V, P2))}`, 472, GR_OK, 17);

    out.innerHTML = `\\(\\triangle ${side}DE\\) 的周長 \\(\\approx ${gr2N(per)}\\)，<wbr>\\(\\overline{${side}${nm[0]}} + \\overline{${side}${nm[1]}} \\approx ${gr2N(sum)}\\)`;
    out.setAttribute('data-meas', gr2N(per - sum, 6));
    fb.innerHTML = wrapFeedback(`\\(\\overline{${nm[0]}I}\\) 平分 \\(\\angle ${nm[0]}\\)，又 \\(\\overline{DE} \\parallel \\overline{${nm.join('')}}\\) 使 \\(\\angle DI${nm[0]} = \\angle I${nm[0]}${nm[1]}\\)（內錯角），所以 \\(\\angle D${nm[0]}I = \\angle DI${nm[0]}\\)，<strong>\\(\\triangle D${nm[0]}I\\) 是等腰三角形</strong>。<br>小三角形周長就把 \\(\\overline{DI}\\)、\\(\\overline{IE}\\) 換成 \\(\\overline{D${nm[0]}}\\)、\\(\\overline{E${nm[1]}}\\)，等於另外兩邊的和。`);
    typeset([out, fb]);
  }

  gr2TriDrag(cv, st, draw);
  bindPickGroup(hbEl('c12-side-group'), 'data-c12-side', m => { side = m; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 13：重心——懸吊找重心、尺規作兩條中線
   ========================================================================== */
function initC13Canvas() {
  const cv = hbEl('canvas-c13');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const out = hbEl('c13-formula'), fb = hbEl('c13-feedback');
  const st = { k: 1 };
  let which = 0, mode = 'hang';
  let hung = [];   // 已經吊過的頂點（依序）

  function base() {
    const { A, B, C } = GR_CG_TRIS[which];
    return { A, B, C, G: hbCentroid([A, B, C]) };
  }

  function drawHang() {
    const g = base();
    const keys = ['A', 'B', 'C'];
    const opp = { A: ['B', 'C'], B: ['C', 'A'], C: ['A', 'B'] };
    const sc = 0.6;
    const cur = hung.length ? hung[hung.length - 1] : null;
    // 局部座標：相對於重心縮放；吊起時旋轉使「頂點在重心正上方」
    let rot = 0;
    if (cur) {
      const vx = g[cur].x - g.G.x, vy = g[cur].y - g.G.y;
      rot = -Math.PI / 2 - Math.atan2(vy, vx);
    }
    const loc = p => {
      const x = (p.x - g.G.x) * sc, y = (p.y - g.G.y) * sc;
      return hbV(x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot));
    };
    let shift;
    if (cur) {
      const lv = loc(g[cur]);
      shift = hbV(270 - lv.x, 96 - lv.y);
    } else {
      shift = hbV(270, 210);
    }
    const tp = p => { const l = loc(p); return hbV(l.x + shift.x, l.y + shift.y); };
    const P = { A: tp(g.A), B: tp(g.B), C: tp(g.C) };
    const Gp = tp(g.G);

    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '用一根線吊起頂點：鉛垂線通過哪裡？', GR_TONE[12]);
    // 掛鉤橫桿
    hbSeg(ctx, hbV(200, 48), hbV(340, 48), GR_TERRA, 5);
    if (cur) {
      hbSeg(ctx, hbV(270, 48), P[cur], GR_CREAM, 1.8);
      hbSeg(ctx, P[cur], hbV(270, 400), GR_RED, 1.8, [7, 5]);
    }
    gr2Tri(ctx, P.A, P.B, P.C, 0.2);
    // 已經畫下的鉛垂線（就是中線），跟著紙板一起轉
    hung.forEach(k => {
      const M = gr2Mid(P[opp[k][0]], P[opp[k][1]]);
      hbSeg(ctx, P[k], M, GR_G, 2.6);
      hbTick(ctx, P[opp[k][0]], M, 1, GR_G, 0.5);
      hbTick(ctx, M, P[opp[k][1]], 1, GR_G, 0.5);
      dkPt(ctx, M, GR_G, 4.5);
    });
    keys.forEach(k => dkPt(ctx, P[k], GR_CREAM, 5));
    gr2Names(ctx, [P.A, P.B, P.C], keys);
    const uniq = [...new Set(hung)];
    if (uniq.length >= 2) {
      dkPt(ctx, Gp, GR_G, 7);
      dkName(ctx, Gp, 'G', GR_G, 16, 10);
    }

    let l1, l2, col = GR_CREAM;
    if (!cur) {
      l1 = '先選一個頂點吊起來（下方按鈕），等它不晃了再畫鉛垂線';
      l2 = '紙板是均勻的三角形厚紙板';
    } else if (uniq.length === 1) {
      l1 = `吊起 ${cur}：鉛垂線通過對邊 ${opp[cur].join('')} 的中點——這條線是中線`;
      l2 = '再吊另一個頂點試試';
    } else if (uniq.length === 2) {
      l1 = '兩條中線交於 G；第三個頂點吊起來，鉛垂線也會通過 G';
      l2 = 'G 就是重心：用筆尖頂住 G，紙板能平衡';
      col = GR_G;
    } else {
      l1 = '三條中線交於同一點 G：三角形的重心';
      l2 = '重心一定在三角形內部';
      col = GR_G;
    }
    dkRow(ctx, l1, 432, col, 15);
    dkRow(ctx, l2, 464, GR_FAINT, 14);

    out.innerHTML = uniq.length >= 2 ? '三條中線交於一點 \\(G\\)：重心' : (cur ? `吊起 \\(${cur}\\)：鉛垂線是中線` : '還沒吊');
    fb.innerHTML = wrapFeedback('頂點與對邊<strong>中點</strong>的連線叫做<strong>中線</strong>。吊起一個頂點時，紙板的重量在鉛垂線兩側平衡，所以鉛垂線把對邊分成一樣長——它就是中線。<br>三條中線交於一點 \\(G\\)，叫做<strong>重心</strong>。');
    typeset([out, fb]);
  }

  function drawCg() {
    const { A, B, C } = GR_CG_TRIS[which];
    const bD = gr2CgBis(B, C), bE = gr2CgBis(C, A);
    const D = gr2Mid(B, C), E = gr2Mid(C, A), F = gr2Mid(A, B);
    const G = hbCentroid([A, B, C]);
    const UNIT = 30;
    const steps = [
      { tool: 'compass', text: '以 B 為圓心、大於 BC 一半的長為半徑，在 BC 兩側畫弧。',
        compass: { c: B, r: bD.rr, ang: cgAng(B, bD.X), label: '' },
        draw: c => cgArcAt(c, B, bD.rr, [bD.X, bD.Y], 0.2, GR_TERRA) },
      { tool: 'compass', text: '以 C 為圓心、同樣的半徑畫弧，兩弧交於兩點。',
        compass: { c: C, r: bD.rr, ang: cgAng(C, bD.X), label: '' },
        draw: c => cgArcAt(c, C, bD.rr, [bD.X, bD.Y], 0.2, GR_TERRA) },
      { tool: 'ruler', text: '連接兩交點（BC 的中垂線），與 BC 交於中點 D。', ruler: [bD.X, bD.Y],
        draw: c => cgSeg(c, bD.X, bD.Y, 'rgba(108, 195, 234, 0.45)', 1.6, [5, 4]) },
      { tool: 'ruler', text: '連接 A 和 D：AD 是 BC 邊上的中線。', ruler: [A, D],
        draw: c => cgSeg(c, A, D, GR_G, 2.8) },
      { tool: 'compass', text: '以 C 為圓心、大於 CA 一半的長為半徑，在 CA 兩側畫弧。',
        compass: { c: C, r: bE.rr, ang: cgAng(C, bE.X), label: '' },
        draw: c => cgArcAt(c, C, bE.rr, [bE.X, bE.Y], 0.2, GR_TERRA) },
      { tool: 'compass', text: '以 A 為圓心、同樣的半徑畫弧，兩弧交於兩點。',
        compass: { c: A, r: bE.rr, ang: cgAng(A, bE.X), label: '' },
        draw: c => cgArcAt(c, A, bE.rr, [bE.X, bE.Y], 0.2, GR_TERRA) },
      { tool: 'ruler', text: '連接兩交點，與 CA 交於中點 E。', ruler: [bE.X, bE.Y],
        draw: c => cgSeg(c, bE.X, bE.Y, 'rgba(108, 195, 234, 0.45)', 1.6, [5, 4]) },
      { tool: 'ruler', text: '連接 B 和 E：兩條中線 AD、BE 交於 G，G 就是重心。', ruler: [B, E],
        draw: c => cgSeg(c, B, E, GR_G, 2.8) },
      { tool: 'look', text: '第三條中線 CF 也通過 G（虛線）。量一量：AG 是 GD 的兩倍。',
        draw: c => cgSeg(c, C, F, GR_PLUM, 2, [7, 5]) }
    ];
    cgSync('c13', st, steps.length);
    const ag = cgDist(A, G) / UNIT, gd = cgDist(G, D) / UNIT;
    cgRender(ctx, {
      title: '尺規找重心：先找中點，再連中線', color: GR_TONE[12], k: st.k, steps,
      given: c => gr2CgTri(c, A, B, C),
      pts: gr2CgLabels(A, B, C).concat([
        { p: D, n: 'D', s: 3, c: GR_G, dx: 0, dy: 17 },
        { p: E, n: 'E', s: 7, c: GR_G, ...(() => { const o = gr2Out(E, G, 17); return { dx: o.x, dy: o.y }; })() },
        { p: G, n: 'G', s: 8, c: GR_G, dx: 15, dy: -12 },
        { p: F, n: 'F', s: 9, c: GR_PLUM, ...(() => { const o = gr2Out(F, G, 17); return { dx: o.x, dy: o.y }; })() }
      ]),
      measure: st.k >= 9 ? [`量一量：AG ≈ ${ag.toFixed(2)}、GD ≈ ${gd.toFixed(2)}（單位）`, GR_OK] : null
    });
    out.innerHTML = st.k >= 8 ? '兩條中線的交點 \\(G\\) 就是重心' : `步驟 \\(${st.k}\\)：${st.k <= 4 ? '先找 \\(\\overline{BC}\\) 的中點、連中線' : '再找 \\(\\overline{CA}\\) 的中點、連中線'}`;
    fb.innerHTML = wrapFeedback('找重心不用量長度：用尺規作邊的<strong>中垂線</strong>找到<strong>中點</strong>，再把中點和對面的頂點連起來（中線）。<br>兩條中線的交點就是重心——小心：重心用到中垂線，但只拿它來找中點，<strong>重心不是中垂線的交點</strong>。');
    typeset([out, fb]);
  }

  function draw() {
    hbEl('c13-hang-row').style.display = mode === 'hang' ? '' : 'none';
    hbEl('c13-step-row').style.display = mode === 'cg' ? '' : 'none';
    if (mode === 'hang') drawHang(); else drawCg();
  }

  bindPickGroup(hbEl('c13-mode-group'), 'data-c13-mode', m => { mode = m; st.k = 1; draw(); });
  bindPickGroup(hbEl('c13-tri-group'), 'data-c13-tri', m => { which = parseInt(m, 10); hung = []; st.k = 1; draw(); });
  ['A', 'B', 'C'].forEach(k => hbEl('c13-hang' + k).addEventListener('click', () => { hung.push(k); draw(); }));
  hbEl('c13-clear').addEventListener('click', () => { hung = []; draw(); });
  cgSteps('c13', st, draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 14：重心把中線分成 2 : 1
   ========================================================================== */
function initC14Canvas() {
  const cv = hbEl('canvas-c14');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width;
  const out = hbEl('c14-formula'), fb = hbEl('c14-feedback');
  const st = { P: { A: hbV(5, 9), B: hbV(1, 1), C: hbV(15, 2) } };
  let med = 'A', proof = 'off';

  function draw() {
    const px = gr2TriPx(st.P);
    const nb = { A: ['B', 'C'], B: ['C', 'A'], C: ['A', 'B'] }[med];
    const MN = { A: 'D', B: 'E', C: 'F' };
    const V = px[med], M = gr2Mid(px[nb[0]], px[nb[1]]);
    const G = hbCentroid([px.A, px.B, px.C]);
    const vg = hbDist(V, G) / GR_U, gm = hbDist(G, M) / GR_U;
    const mName = MN[med];

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '拖曳頂點：重心把中線切成幾比幾？', GR_TONE[13]);
    gr2Clip(ctx, 40, 392);
    gr2Grid(ctx);
    gr2Tri(ctx, px.A, px.B, px.C, 0.12);
    // 三條中線淡淡畫出
    ['A', 'B', 'C'].forEach(k => {
      const q = { A: ['B', 'C'], B: ['C', 'A'], C: ['A', 'B'] }[k];
      hbSeg(ctx, px[k], gr2Mid(px[q[0]], px[q[1]]), GR_FAINT, 1.4, [5, 4]);
    });
    if (proof === 'on') {
      // 另一條中線從 nb[0] 出發，到對邊（含 V 的那一邊）的中點 N
      const W2 = nb[0], N = gr2Mid(px[nb[1]], V);
      dkPoly(ctx, [V, G, px[W2]], GR_O, 0.28, 2);
      dkPoly(ctx, [M, G, N], GR_O, 0.5, 2);
      hbSeg(ctx, M, N, GR_O, 3);
      hbSeg(ctx, px[W2], N, GR_G, 2.4);
      dkPt(ctx, N, GR_O, 4.5);
      const oN = gr2Out(N, G, 16);
      dkName(ctx, N, MN[W2], GR_O, oN.x, oN.y);
    }
    hbSeg(ctx, V, G, GR_G, 5);
    hbSeg(ctx, G, M, GR_TERRA, 5);
    // 2 : 1 的刻痕：VG 中點一道、GM 不加
    const Vh = gr2Mid(V, G);
    hbTick(ctx, V, Vh, 1, GR_G);
    hbTick(ctx, Vh, G, 1, GR_G);
    hbTick(ctx, G, M, 1, GR_TERRA);
    hbTick(ctx, px[nb[0]], M, 2, GR_CREAM);
    hbTick(ctx, M, px[nb[1]], 2, GR_CREAM);
    [px.A, px.B, px.C].forEach(q => dkPt(ctx, q, GR_CREAM, 6.5));
    gr2Names(ctx, [px.A, px.B, px.C], ['A', 'B', 'C']);
    dkPt(ctx, M, GR_TERRA, 5);
    const oM = gr2Out(M, G, 17);
    dkName(ctx, M, mName, GR_TERRA, oM.x, oM.y);
    dkPt(ctx, G, GR_G, 6.5);
    dkName(ctx, G, 'G', GR_G, 15, -12);
    ctx.restore();

    dkRow(ctx, `[${med}G] ≈ ${gr2N(vg)}、[G${mName}] ≈ ${gr2N(gm)}，比值 ≈ ${gr2N(vg / gm, 3)}`, 414, GR_CREAM, 16);
    dkRow(ctx, `[${med}G] : [G${mName}] = 2 : 1，[${med}G] = {2/3}[${med}${mName}]、[G${mName}] = {1/3}[${med}${mName}]`, 446, GR_G, 16);
    dkRow(ctx, proof === 'on' ? `兩邊中點連線 ∥ 第三邊且等於它的一半 → 兩個藍色三角形相似，比 1 : 2` : '按「看理由」看為什麼一定是 2 : 1', 474, proof === 'on' ? GR_O : GR_FAINT, 14);

    out.innerHTML = `\\(\\overline{${med}G} : \\overline{G${mName}} = 2 : 1\\)，<wbr>\\(\\overline{${med}G} = \\frac{2}{3}\\overline{${med}${mName}}\\)`;
    out.setAttribute('data-meas', gr2N(vg / gm, 6));
    fb.innerHTML = wrapFeedback(proof === 'on'
      ? `連接兩個中點的線段平行第三邊、長度是它的一半，所以小藍三角形和大藍三角形 <strong>AA 相似</strong>、邊長比 \\(1 : 2\\)，\\(\\overline{G${mName}} : \\overline{${med}G} = 1 : 2\\)。`
      : '不管怎麼拖，重心到頂點的距離永遠是它到對邊中點的<strong>兩倍</strong>。注意：\\(\\overline{AG}\\)、\\(\\overline{BG}\\)、\\(\\overline{CG}\\) 三段通常<strong>不相等</strong>。');
    typeset([out, fb]);
  }

  gr2TriDrag(cv, st, draw);
  bindPickGroup(hbEl('c14-med-group'), 'data-c14-med', m => { med = m; draw(); });
  bindPickGroup(hbEl('c14-proof-group'), 'data-c14-proof', m => { proof = m; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 15：重心把面積三等分、三中線把面積六等分
   頂點在整數方格上：兩倍面積 S2 是整數，三等分 = S2/6、六等分 = S2/12（精確）。
   ========================================================================== */
function initC15Canvas() {
  const cv = hbEl('canvas-c15');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width;
  const out = hbEl('c15-formula'), fb = hbEl('c15-feedback');
  const st = { P: { A: hbV(5, 9), B: hbV(1, 1), C: hbV(14, 3) } };
  let cut = '3';
  const COLS6 = [GR_O, GR_I, GR_G, GR_ROSE, GR_PLUM, GR_TERRA];

  function draw() {
    const P = st.P;
    const px = gr2TriPx(P);
    const { A, B, C } = px;
    const G = hbCentroid([A, B, C]);
    const D = gr2Mid(B, C), E = gr2Mid(C, A), F = gr2Mid(A, B);
    const S2 = Math.abs(gr2Cross(P.A, P.B, P.C));
    const tot = qOf(S2, 2), third = qOf(S2, 6), sixth = qOf(S2, 12);
    const qt = q => (q[1] === 1 ? String(q[0]) : `{${q[0]}/${q[1]}}`);

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '重心切出來的每一塊一樣大嗎？', GR_TONE[14]);
    gr2Clip(ctx, 40, 392);
    gr2Grid(ctx);
    let pieces;
    if (cut === '3') {
      pieces = [[G, B, C], [G, C, A], [G, A, B]];
      pieces.forEach((pc, i) => dkPoly(ctx, pc, [GR_O, GR_I, GR_G][i], 0.32, 2));
    } else {
      pieces = [[G, B, D], [G, D, C], [G, C, E], [G, E, A], [G, A, F], [G, F, B]];
      pieces.forEach((pc, i) => dkPoly(ctx, pc, COLS6[i], cut === 'quad' && (i === 3 || i === 4) ? 0.6 : 0.26, 1.6));
      if (cut === 'quad') dkPoly(ctx, [A, F, G, E], GR_CREAM, 0, 3.4);
    }
    gr2Tri(ctx, A, B, C, 0);
    [A, B, C].forEach(q => dkPt(ctx, q, GR_CREAM, 6.5));
    gr2Names(ctx, [A, B, C], ['A', 'B', 'C']);
    if (cut !== '3') {
      [[D, 'D'], [E, 'E'], [F, 'F']].forEach(([q, nm]) => {
        dkPt(ctx, q, GR_CREAM, 4.5);
        const o = gr2Out(q, G, 16);
        dkName(ctx, q, nm, GR_CREAM, o.x, o.y);
      });
    }
    dkPt(ctx, G, GR_G, 6);
    dkName(ctx, G, 'G', GR_G, 14, -12);
    // 每塊面積（鞋帶公式，在方格單位下）標在該塊中央
    const areas = pieces.map(pc => hbPolyArea(pc) / (GR_U * GR_U));
    pieces.forEach((pc, i) => {
      const c0 = hbCentroid(pc);
      dkTag(ctx, gr2N(areas[i]), c0.x, c0.y, GR_CREAM, 12);
    });
    ctx.restore();

    dkRow(ctx, `△ABC 面積 = ${qt(tot)}（方格）`, 414, GR_CREAM, 16);
    if (cut === '3') {
      dkRow(ctx, `△GBC = △GCA = △GAB = {1/3} × ${qt(tot)} = ${qt(third)}`, 448, GR_G, 18);
    } else if (cut === '6') {
      dkRow(ctx, `六塊都 = {1/6} × ${qt(tot)} = ${qt(sixth)}`, 448, GR_G, 18);
    } else {
      dkRow(ctx, `四邊形 AFGE = 兩塊 = {2/6} × ${qt(tot)} = ${qt(third)}`, 448, GR_G, 18);
    }
    dkRow(ctx, '拖曳頂點：形狀怎麼變，每一塊都一樣大', 474, GR_FAINT, 13);

    const q = cut === '6' ? sixth : third;
    const lab = cut === '3' ? '\\triangle GAB' : cut === '6' ? '\\triangle GBD' : 'AFGE';
    const frac = cut === '6' ? '\\frac{1}{6}' : '\\frac{1}{3}';
    out.innerHTML = `\\(${lab} = ${frac} \\times ${qTex(tot)} = ${qTex(q)}\\)`;
    out.setAttribute('data-meas', areas.map(x => gr2N(x, 6)).join(',') + '|' + gr2N(qVal(q), 6));
    fb.innerHTML = wrapFeedback(cut === '3'
      ? '中線把三角形分成等底同高的兩半；重心和三頂點的連線把面積<strong>三等分</strong>。'
      : cut === '6'
        ? '三條中線把面積<strong>六等分</strong>：每一塊都是 \\(\\frac{1}{6}\\triangle ABC\\)，連形狀很不一樣的兩塊也一樣大。'
        : '四邊形 \\(AFGE\\) 由兩塊組成，面積是 \\(\\frac{2}{6} = \\frac{1}{3}\\triangle ABC\\)。');
    typeset([out, fb]);
  }

  gr2TriDrag(cv, st, draw);
  bindPickGroup(hbEl('c15-cut-group'), 'data-c15-cut', m => { cut = m; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 16：藏在平行四邊形裡的重心
   B(0,0)、C(w,0)、D(w+k,h)、A(k,h)；E 是 BC 或 CD 的中點，AE 交 BD 於 G。
   ========================================================================== */
function initC16Canvas() {
  const cv = hbEl('canvas-c16');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width;
  const out = hbEl('c16-formula'), fb = hbEl('c16-feedback');
  const sw = hbEl('c16-w'), sk = hbEl('c16-k'), sh = hbEl('c16-h');
  let eAt = 'BC';

  function draw() {
    const w = hbIv(sw), k = hbIv(sk), h = hbIv(sh);
    hbEl('c16-vw').textContent = w;
    hbEl('c16-vk').textContent = k;
    hbEl('c16-vh').textContent = h;
    const m = { B: hbV(0, 0), C: hbV(w, 0), D: hbV(w + k, h), A: hbV(k, h) };
    const v = dkView([m.A, m.B, m.C, m.D], { x: 70, y: 56, w: 400, h: 240 });
    const A = v.P(m.A), B = v.P(m.B), C = v.P(m.C), D = v.P(m.D);
    const O = gr2Mid(A, C);
    const E = eAt === 'BC' ? gr2Mid(B, C) : gr2Mid(C, D);
    const G = cgLL(A, E, B, D);
    const tri = eAt === 'BC' ? [A, B, C] : [A, C, D];
    const near = eAt === 'BC' ? B : D;      // 重心那個三角形在對角線 BD 上的頂點
    const nearN = eAt === 'BC' ? 'B' : 'D';
    const area = w * h;
    const sixth = qOf(area, 12);
    const ng = hbDist(near, G), go = hbDist(G, O);

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `平行四邊形裡：E 是 ${eAt} 的中點`, GR_TONE[15]);
    dkPoly(ctx, tri, GR_G, 0.16, 0.01);
    dkPoly(ctx, [A, B, C, D], GR_CREAM, 0.04, 2.6);
    hbSeg(ctx, A, C, GR_CREAM, 1.8);
    hbSeg(ctx, B, D, GR_CREAM, 1.8);
    hbSeg(ctx, A, E, GR_G, 2.6);
    const smallTri = eAt === 'BC' ? [A, G, O] : [G, D, E];
    dkPoly(ctx, smallTri, GR_RED, 0.45, 2);
    hbSeg(ctx, near, G, GR_O, 4.5);
    hbSeg(ctx, G, O, GR_TERRA, 4.5);
    hbTick(ctx, A, O, 1, GR_CREAM);
    hbTick(ctx, O, C, 1, GR_CREAM);
    if (eAt === 'BC') { hbTick(ctx, B, E, 2, GR_CREAM); hbTick(ctx, E, C, 2, GR_CREAM); }
    else { hbTick(ctx, C, E, 2, GR_CREAM); hbTick(ctx, E, D, 2, GR_CREAM); }
    [A, B, C, D].forEach(q => dkPt(ctx, q, GR_CREAM, 5));
    const ctr = gr2Mid(A, C);
    [[A, 'A'], [B, 'B'], [C, 'C'], [D, 'D']].forEach(([q, nm]) => { const o = gr2Out(q, ctr, 18); dkName(ctx, q, nm, GR_CREAM, o.x, o.y); });
    dkPt(ctx, O, GR_CREAM, 4.5);
    dkName(ctx, O, 'O', GR_CREAM, 0, -16);
    dkPt(ctx, E, GR_CREAM, 4.5);
    const oE = gr2Out(E, ctr, 16);
    dkName(ctx, E, 'E', GR_CREAM, oE.x, oE.y);
    dkPt(ctx, G, GR_G, 6);
    dkName(ctx, G, 'G', GR_G, eAt === 'BC' ? -6 : 6, 17);

    const triName = eAt === 'BC' ? '△ABC' : '△ACD';
    const small = eAt === 'BC' ? '△AGO' : '△GDE';
    const sTxt = sixth[1] === 1 ? String(sixth[0]) : `{${sixth[0]}/${sixth[1]}}`;
    dkRow(ctx, `O 是 [AC] 的中點、E 是 [${eAt}] 的中點 → G 是 ${triName} 的重心`, 330, GR_G, 15);
    dkRow(ctx, `[${nearN}G] : [GO] = 2 : 1，[BD] = 2[${nearN}O] = 6[GO]（量：${gr2N(ng / go, 3)} : 1）`, 362, GR_CREAM, 15);
    dkRow(ctx, `${small} = {1/6}${triName} = {1/12} 平行四邊形ABCD`, 400, GR_RED, 17);
    dkRow(ctx, `平行四邊形面積 = ${w} × ${h} = ${area}，${small} = ${sTxt}`, 438, GR_OK, 16);
    dkRow(ctx, '（底、高的單位是方格）', 468, GR_FAINT, 13);

    out.innerHTML = `\\(\\overline{${nearN}G} : \\overline{GO} = 2 : 1\\)，<wbr>\\(${eAt === 'BC' ? '\\triangle AGO' : '\\triangle GDE'} = \\frac{1}{12} \\times ${area} = ${qTex(sixth)}\\)`;
    out.setAttribute('data-meas', gr2N(ng / go, 6) + '|' + gr2N(hbPolyArea(smallTri) / (v.k * v.k), 6));
    fb.innerHTML = wrapFeedback('平行四邊形的對角線<strong>互相平分</strong>，所以 \\(O\\) 是 \\(\\overline{AC}\\) 的中點：\\(\\overline{AE}\\) 和 \\(\\overline{BD}\\) 都是同一個三角形的中線，交點 \\(G\\) 是重心。<br>先找出「藏起來的三角形」，再用重心的 \\(2 : 1\\) 與面積六等分。');
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('c16-e-group'), 'data-c16-e', m => { eAt = m; draw(); });
  [sw, sk, sh].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 17：直角三角形的重心與外心
   ∠B = 90°，BC = a、AB = b；E 是斜邊 AC 的中點＝外心，G 在中線 BE 上。
   ========================================================================== */
function initC17Canvas() {
  const cv = hbEl('canvas-c17');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width;
  const out = hbEl('c17-formula'), fb = hbEl('c17-feedback');
  const sa = hbEl('c17-a'), sb = hbEl('c17-b');

  function draw() {
    const a = hbIv(sa), b = hbIv(sb);
    hbEl('c17-va').textContent = a;
    hbEl('c17-vb').textContent = b;
    const n = a * a + b * b;
    const AC = hbRoot(n);
    const half = gr2RootFrac(n, 2), third = gr2RootFrac(n, 3), sixth = gr2RootFrac(n, 6);
    const mB = hbV(0, 0), mC = hbV(a, 0), mA = hbV(0, b);
    const mE = hbV(a / 2, b / 2), rr = Math.sqrt(n) / 2;
    const v = dkView([hbV(mE.x - rr, mE.y - rr), hbV(mE.x + rr, mE.y + rr)], { x: 120, y: 50, w: 300, h: 280 });
    const A = v.P(mA), B = v.P(mB), C = v.P(mC), E = v.P(mE);
    const G = hbCentroid([A, B, C]);
    const D = gr2Mid(B, C);

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '直角三角形：斜邊中點是外心，重心在它的中線上', GR_TONE[16]);
    gr2Circle(ctx, E, rr * v.k, GR_O, 1.8, null, 0.45);
    gr2Tri(ctx, A, B, C, 0.14);
    gr2Right(ctx, B, A, C, GR_CREAM, 12);
    hbSeg(ctx, A, D, GR_FAINT, 1.4, [5, 4]);
    hbSeg(ctx, E, A, GR_O, 2.4);
    hbSeg(ctx, E, C, GR_O, 2.4);
    hbSeg(ctx, B, G, GR_G, 5);
    hbSeg(ctx, G, E, GR_TERRA, 5);
    hbTick(ctx, E, A, 1, GR_O);
    hbTick(ctx, E, C, 1, GR_O);
    [A, B, C].forEach(q => dkPt(ctx, q, GR_CREAM, 5.5));
    gr2Names(ctx, [A, B, C], ['A', 'B', 'C']);
    dkPt(ctx, E, GR_O, 6);
    const oE = gr2Out(E, B, 17);
    dkName(ctx, E, 'E', GR_O, oE.x, oE.y);
    dkPt(ctx, G, GR_G, 6);
    dkName(ctx, G, 'G', GR_G, 14, 12);
    const Gc = hbCentroid([A, B, C]);
    dkSideTag(ctx, B, C, Gc, String(a), GR_TERRA, 18, 15);
    dkSideTag(ctx, A, B, Gc, String(b), GR_TERRA, 18, 15);

    dkRow(ctx, `[AC] = ${AC.txt}；E 是外心：[EA] = [EB] = [EC] = ${half.txt}`, 362, GR_O, 16);
    dkRow(ctx, `[BG] = {2/3}[BE] = {1/3}[AC] = ${third.txt}`, 398, GR_G, 17);
    dkRow(ctx, `[GE] = {1/3}[BE] = {1/6}[AC] = ${sixth.txt}`, 434, GR_TERRA, 17);
    dkRow(ctx, '兩個性質接力：先用外心（[BE] = 斜邊一半），再用重心（2 : 1）', 468, GR_FAINT, 13);

    out.innerHTML = `\\(\\overline{BE} = ${half.tex}\\)，<wbr>\\(\\overline{BG} = ${third.tex}\\)，<wbr>\\(\\overline{GE} = ${sixth.tex}\\)`;
    out.setAttribute('data-meas', [hbDist(B, E), hbDist(B, G), hbDist(G, E)].map(x => gr2N(x / v.k, 6)).join(','));
    fb.innerHTML = wrapFeedback('直角三角形的外心是<strong>斜邊中點</strong> \\(E\\)，所以斜邊上的中線 \\(\\overline{BE} = \\frac{1}{2}\\overline{AC}\\)；重心 \\(G\\) 又把 \\(\\overline{BE}\\) 分成 \\(2 : 1\\)：<br><strong>\\(\\overline{BG} = \\frac{1}{3}\\overline{AC}\\)、\\(\\overline{GE} = \\frac{1}{6}\\overline{AC}\\)</strong>。');
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}
