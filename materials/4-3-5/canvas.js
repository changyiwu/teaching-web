/* ==========================================================================
   4-3-5（第四冊 3-5）三角形的邊角關係 — 互動 Canvas 與隨堂評量
   畫風：19 世紀手工上色銅版畫博物圖鑑・養蜂花園（小蜜、阿蜂），第 3 章共用。

   共用工具在 ../math-canvas.js（f／fi／drawTitle／textCenter／textLeft／
   numLine／numLineEnd／numLineSeg／wrapFeedback／wbrEq／typeset／
   bindPickGroup／clamp…）。

   本檔分三層：
     0. 由 4-3-1 複製的 hb* 幾何小工具（角記號、頂點外推）與 HB_ 色票，
        由 4-3-2 複製的 cg* 求交工具（兩圓交點、弧、描邊標籤）——
        兩組都逐字照抄，日後再統一抽進共用檔；
     1. 本節自己的工具（EK_ = Edge／Kaku 邊角；ek 前綴）；
     2. 12 個互動與評量附圖。

   三角形的邊長與角度一律由頂點座標實算（開發約束 27）：
   格點三角形用「邊長平方」這個整數判斷大小與相等，角度由座標量出來；
   由角度作的三角形，角度是整數、邊長由座標量。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();
  initQuizFigs();

  initPathCanvas();
  initMakeCanvas();
  initIsoCanvas();
  initRangeCanvas();
  initShareCanvas();
  initBigCanvas();
  initWhyCanvas();
  initAngCanvas();
  initChainCanvas();
  initTwoCanvas();
  initRngCanvas();
  initRightCanvas();
});

/* ==========================================================================
   0a. 由 4-3-1 複製：色票與 hb* 幾何小工具（逐字相同）
   ========================================================================== */

const HB_GOLD = '#fcd34d';
const HB_MOSS = '#bef264';
const HB_ROSE = '#fda4af';
const HB_SKY = '#7dd3fc';
const HB_IVORY = '#fef3c7';
const HB_VIOLET = '#c4b5fd';
const HB_RED = '#fb7185';
const HB_JADE = '#6ee7b7';

const HB_RAD = Math.PI / 180;

function hbEl(id) {
  return document.getElementById(id);
}

function hbIv(el) {
  return parseInt(el.value, 10);
}

function hbV(x, y) {
  return { x, y };
}

// 數學方向角（度；逆時針為正、y 軸朝上）走 len 的點
function hbAt(P, deg, len) {
  return hbV(P.x + Math.cos(deg * HB_RAD) * len, P.y - Math.sin(deg * HB_RAD) * len);
}

// 由 V 看 P 的數學方向角（0～360）
function hbHead(V, P) {
  let a = Math.atan2(-(P.y - V.y), P.x - V.x) / HB_RAD;
  if (a < 0) a += 360;
  return a;
}

function hbDist(P, Q) {
  return Math.hypot(P.x - Q.x, P.y - Q.y);
}

function hbCentroid(pts) {
  const s = pts.reduce((a, p) => hbV(a.x + p.x, a.y + p.y), hbV(0, 0));
  return hbV(s.x / pts.length, s.y / pts.length);
}

function hbSeg(ctx, P, Q, color, width, dash) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 2.4;
  ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(P.x, P.y);
  ctx.lineTo(Q.x, Q.y);
  ctx.stroke();
  ctx.restore();
}

function hbPoly(ctx, pts, color, alpha, width) {
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  if (alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 2.6;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

function hbDot(ctx, P, color, r) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(P.x, P.y, r || 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 扇形角記號：從數學角 a0 起、逆時針掃 sweep 度（sweep 可到 360）
//   o.alpha 填色透明度、o.label 標籤（畫在角平分線上 o.lr 處）、o.right 直角記號
function hbSector(ctx, V, a0, sweep, r, color, o) {
  const opt = o || {};
  ctx.save();
  if (opt.right && Math.abs(sweep - 90) < 1e-9) {
    const s = Math.min(r * 0.55, 16);
    const P1 = hbAt(V, a0, s), P3 = hbAt(V, a0 + 90, s), P2 = hbAt(P1, a0 + 90, s);
    ctx.beginPath();
    ctx.moveTo(V.x, V.y); ctx.lineTo(P1.x, P1.y); ctx.lineTo(P2.x, P2.y); ctx.lineTo(P3.x, P3.y); ctx.closePath();
    ctx.globalAlpha = opt.alpha == null ? 0.28 : opt.alpha;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    const s = -a0 * HB_RAD, e = -(a0 + sweep) * HB_RAD;
    ctx.beginPath();
    ctx.moveTo(V.x, V.y);
    ctx.arc(V.x, V.y, r, s, e, sweep > 0);
    ctx.closePath();
    ctx.globalAlpha = opt.alpha == null ? 0.28 : opt.alpha;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(V.x, V.y, r, s, e, sweep > 0);
    ctx.strokeStyle = color;
    ctx.lineWidth = opt.lw || 2.2;
    if (opt.dash) ctx.setLineDash(opt.dash);
    ctx.stroke();
  }
  ctx.restore();
  if (opt.label) {
    const P = hbAt(V, a0 + sweep / 2, opt.lr || r + 17);
    textCenter(ctx, opt.label, P.x, P.y, opt.lc || color, opt.font || f(800, 15));
  }
}

// ∠PVQ（取小於 180° 的那一側）
function hbAngle(ctx, V, P, Q, r, color, o) {
  const a = hbHead(V, P), b = hbHead(V, Q);
  const d = ((b - a) % 360 + 360) % 360;
  if (d > 180) hbSector(ctx, V, b, 360 - d, r, color, o);
  else hbSector(ctx, V, a, d, r, color, o);
}

// ∠PVQ 的度數（數值，驗收用）
function hbAngleDeg(V, P, Q) {
  const d = ((hbHead(V, Q) - hbHead(V, P)) % 360 + 360) % 360;
  return d > 180 ? 360 - d : d;
}

// 頂點字母畫在圖形外側（開發約束 18）：由 ref（通常是重心）往 V 的方向推出去
function hbVLabel(ctx, V, ref, text, color, dist) {
  const d = hbDist(V, ref) || 1;
  const k = dist || 18;
  const P = hbV(V.x + (V.x - ref.x) / d * k, V.y + (V.y - ref.y) / d * k);
  textCenter(ctx, text, P.x, P.y, color || HB_IVORY, fi(800, 18));
}

// 把一組點等比例縮放、置中到 box 裡（保持形狀）
function hbFit(pts, box) {
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = Math.min(box.w / Math.max(x1 - x0, 1e-6), box.h / Math.max(y1 - y0, 1e-6));
  const ox = box.x + (box.w - (x1 - x0) * k) / 2, oy = box.y + (box.h - (y1 - y0) * k) / 2;
  return pts.map(p => hbV(ox + (p.x - x0) * k, oy + (p.y - y0) * k));
}

// 由兩個內角作三角形：BC 水平，B 在左、C 在右、A 在上
function hbTriangle(A, B, box) {
  const C = 180 - A - B;
  const Bp = hbV(0, 0), Cp = hbV(1, 0);
  const ab = Math.sin(C * HB_RAD) / Math.sin(A * HB_RAD);
  const Ap = hbAt(Bp, B, ab);
  const fit = hbFit([Ap, Bp, Cp], box);
  return { A: fit[0], B: fit[1], C: fit[2] };
}

// 度數的 LaTeX
function hbDg(v) {
  return `${v}^\\circ`;
}

// 依數值把滑桿夾回範圍，回傳夾過的值
function hbClampSlider(s, lo, hi) {
  s.min = lo;
  s.max = hi;
  let v = hbIv(s);
  if (v > hi) v = hi;
  if (v < lo) v = lo;
  s.value = v;
  return v;
}

/* ==========================================================================
   0b. 由 4-3-2 複製：cg* 求交與描邊標籤（逐字相同）
   ========================================================================== */

const CG_HONEY = '#fbbf24';

function cgP(x, y) { return { x, y }; }
function cgDist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function cgAng(c, p) { return Math.atan2(p.y - c.y, p.x - c.x); }

// 兩圓交點：0、1（相切）或 2 個
function cgCC(c1, r1, c2, r2) {
  const d = cgDist(c1, c2);
  const eps = 1e-6;
  if (d < eps) return [];
  if (d > r1 + r2 + eps || d < Math.abs(r1 - r2) - eps) return [];
  const a = (d * d + r1 * r1 - r2 * r2) / (2 * d);
  const h2 = r1 * r1 - a * a;
  const ux = (c2.x - c1.x) / d, uy = (c2.y - c1.y) / d;
  const mx = c1.x + a * ux, my = c1.y + a * uy;
  if (h2 <= eps * Math.max(1, r1 * r1) || Math.abs(d - r1 - r2) < eps || Math.abs(d - Math.abs(r1 - r2)) < eps) {
    return [cgP(mx, my)];
  }
  const h = Math.sqrt(h2);
  return [cgP(mx - h * uy, my + h * ux), cgP(mx + h * uy, my - h * ux)];
}

function cgUpper(pts) { return pts.slice().sort((u, v) => u.y - v.y)[0]; }
function cgLower(pts) { return pts.slice().sort((u, v) => v.y - u.y)[0]; }

function cgArc(ctx, c, r, a0, a1, color, w) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = w || 2.2;
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, a0, a1, false);
  ctx.stroke();
  ctx.restore();
}

// 圓心 c、半徑 r 的弧，涵蓋通往 pts 各點的方向，兩端再多 spread 弧度
function cgArcAt(ctx, c, r, pts, spread, color, w) {
  const base = cgAng(c, pts[0]);
  let lo = 0, hi = 0;
  pts.forEach(p => {
    let d = cgAng(c, p) - base;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    lo = Math.min(lo, d);
    hi = Math.max(hi, d);
  });
  cgArc(ctx, c, r, base + lo - spread, base + hi + spread, color, w);
}

// 點名或邊長標籤：深色描邊讓它壓在線上也讀得到
function cgLabel(ctx, p, text, color, dx, dy, font) {
  ctx.save();
  ctx.font = font || fi(700, 18);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeText(text, p.x + dx, p.y + dy);
  ctx.fillStyle = color;
  ctx.fillText(text, p.x + dx, p.y + dy);
  ctx.restore();
}

/* ==========================================================================
   1. 本節工具（EK_ 色票、ek 前綴；共用檔沒有這兩個前綴）
   ========================================================================== */

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const EK_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9', '#fca5a5'];

// 大小排名的固定配色（全頁一致）：最大玫瑰紅、中間蜂蜜金、最小天藍；
// 一條邊與它的對角用同一個顏色
const EK_BIG = '#fb7185';
const EK_MID = '#fcd34d';
const EK_SMALL = '#7dd3fc';
const EK_OK = '#86efac';
const EK_NO = '#fb7185';

// 邊長平方 n（正整數）→ 最簡根式：k√r
function ekRoot(n) {
  let k = 1, r = n;
  for (let d = 2; d * d <= r; d++) {
    while (r % (d * d) === 0) { r /= d * d; k *= d; }
  }
  const val = Math.sqrt(n);
  const exact = (r === 1);
  const txt = exact ? String(k) : (k > 1 ? `${k}√${r}` : `√${r}`);
  const tex = exact ? String(k) : (k > 1 ? `${k}\\sqrt{${r}}` : `\\sqrt{${r}}`);
  const dec = exact ? k : Math.round(val * 100) / 100;
  return { n, k, r, val, exact, txt, tex, dec };
}

// 兩位小數（整數不留小數點）
function ekD2(v) {
  const r = Math.round(v * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

// 一位小數的角度（一律保留一位，方便並排比較）
function ekD1(v) {
  return (Math.round(v * 10) / 10).toFixed(1);
}

// 半格值（滑桿存 2 倍）→ 字串：7 → 3.5、8 → 4
function ekHalf(n2) {
  return n2 % 2 === 0 ? String(n2 / 2) : `${(n2 - 1) / 2}.5`;
}

function ekMid(P, Q) {
  return hbV((P.x + Q.x) / 2, (P.y + Q.y) / 2);
}

// 邊長標示畫在三角形外側（開發約束 18）：沿邊的法向、遠離重心 G 推出去
function ekSideLabel(ctx, P, Q, G, text, color, off, font) {
  const m = ekMid(P, Q);
  const d = hbDist(P, Q) || 1;
  let nx = -(Q.y - P.y) / d, ny = (Q.x - P.x) / d;
  if ((m.x - G.x) * nx + (m.y - G.y) * ny < 0) { nx = -nx; ny = -ny; }
  const k = off || 18;
  cgLabel(ctx, m, text, color, nx * k, ny * k, font || f(800, 15));
}

// 等長記號：在邊的中點畫 n 條短橫線
function ekTick(ctx, P, Q, n, color) {
  const m = ekMid(P, Q);
  const d = hbDist(P, Q) || 1;
  const ux = (Q.x - P.x) / d, uy = (Q.y - P.y) / d;
  const nx = -uy, ny = ux;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const t = (i - (n - 1) / 2) * 6;
    const c = hbV(m.x + ux * t, m.y + uy * t);
    ctx.beginPath();
    ctx.moveTo(c.x - nx * 8, c.y - ny * 8);
    ctx.lineTo(c.x + nx * 8, c.y + ny * 8);
    ctx.stroke();
  }
  ctx.restore();
}

// 等角記號：n 條弧（第一條帶填色）
function ekArcs(ctx, V, P, Q, r, n, color, o) {
  hbAngle(ctx, V, P, Q, r, color, o);
  for (let i = 1; i < n; i++) hbAngle(ctx, V, P, Q, r + 5 * i, color, { alpha: 0 });
}

// 三個量排名次：vals 是可比較的值，eq(i, j) 判斷相等。
// 回傳每一項的顏色（相等的同色），以及由大到小、相等並在一起的群組
function ekRank(vals, eq) {
  const idx = [0, 1, 2].sort((i, j) => vals[j] - vals[i]);
  const groups = [];
  idx.forEach(i => {
    const g = groups[groups.length - 1];
    if (g && eq(g[0], i)) g.push(i); else groups.push([i]);
  });
  const pal = groups.length === 3 ? [EK_BIG, EK_MID, EK_SMALL]
    : (groups.length === 2 ? [EK_BIG, EK_SMALL] : [EK_MID]);
  const color = [];
  groups.forEach((g, k) => g.forEach(i => { color[i] = pal[k]; }));
  return { groups, color };
}

// 依群組把名字串成「甲 > 乙 = 丙」
function ekChain(groups, names, sep) {
  return groups.map(g => g.map(i => names[i]).join(sep ? sep.eq : ' = ')).join(sep ? sep.gt : ' > ');
}

// 畫布底部的一行字，太長時自動縮字級（最小 13px）
function ekLine(ctx, text, y, color, size) {
  const W = ctx.canvas.width;
  let s = size || 16;
  ctx.save();
  ctx.font = f(800, s);
  while (ctx.measureText(text).width > W - 24 && s > 13) {
    s -= 0.5;
    ctx.font = f(800, s);
  }
  ctx.restore();
  textCenter(ctx, text, W / 2, y, color, f(800, s));
}

// 淡淡的格點（格點三角形用）
function ekGrid(ctx, px, x0, x1, y0, y1) {
  ctx.save();
  ctx.fillStyle = 'rgba(203, 213, 225, 0.22)';
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      const P = px(x, y);
      ctx.beginPath();
      ctx.arc(P.x, P.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// 一個三角形：填色、三邊、頂點字母在外、邊長在外
//   o.sides：[BC, CA, AB] 的標籤；o.sideColor：三邊的顏色
function ekTri(ctx, T, o) {
  const opt = o || {};
  const pts = [T.A, T.B, T.C];
  hbPoly(ctx, pts, opt.fill || INK, opt.alpha == null ? 0.06 : opt.alpha, 0.01);
  const segs = [[T.B, T.C], [T.C, T.A], [T.A, T.B]];
  const cols = opt.sideColor || [INK, INK, INK];
  segs.forEach((s, i) => hbSeg(ctx, s[0], s[1], cols[i], opt.width || 3));
  const G = hbCentroid(pts);
  if (opt.sides) segs.forEach((s, i) => { if (opt.sides[i]) ekSideLabel(ctx, s[0], s[1], G, opt.sides[i], cols[i], opt.sideOff || 20); });
  const names = opt.names || ['A', 'B', 'C'];
  pts.forEach((P, i) => hbVLabel(ctx, P, G, names[i], HB_IVORY, 20));
  return G;
}

// 角記號半徑：不超過最短邊的三成
function ekR(T, lo, hi) {
  const m = Math.min(hbDist(T.A, T.B), hbDist(T.B, T.C), hbDist(T.C, T.A));
  return clamp(m * 0.3, lo || 14, hi || 30);
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第四冊 3-5 的 24 題正解
  // 正解字母分布：A 6 題、B 6 題、C 6 題、D 6 題（開發約束 36）
  const answers = {
    '3-5-1': 'C',    // AB − BC > AC 不可能成立
    '3-5-2': 'A',    // 9 + 14 = 23：B 在 AC 上，三點共線
    '3-5-3': 'D',    // 11、13、21：11 + 13 > 21
    '3-5-4': 'B',    // 7、9、22：要檢查最長邊 22，7 + 9 < 22
    '3-5-5': 'B',    // 23、23、7 → 周長 53（7、7、23 不合）
    '3-5-6': 'D',    // 11、11、21 與 21、21、11 都可以 → 43 或 53
    '3-5-7': 'A',    // 9.5 < x < 16.5 → 10～16，共 7 個
    '3-5-8': 'C',    // 16 < x < 34 → 22
    '3-5-9': 'D',    // 7 < AC < 19 且 6 < AC < 16 → 最小 8、最大 15
    '3-5-10': 'B',   // 11 < AC < 19 且 1 < AC < 17 → 12～16，共 5 個
    '3-5-11': 'A',   // BC 25 > CA 21 > AB 16 → ∠A > ∠B > ∠C
    '3-5-12': 'C',   // AB = BC → ∠A = ∠C；AC 最長 → ∠B 最大
    '3-5-13': 'C',   // AB > AC → ∠C > ∠B → ∠BAH > ∠CAH
    '3-5-14': 'A',   // AE > AD = AB → ∠ABE > ∠AEB
    '3-5-15': 'B',   // ∠B = 65° → ∠C > ∠B > ∠A → AB > AC > BC
    '3-5-16': 'D',   // ∠B = ∠C = 52°，∠A = 76° 最大 → BC > AB
    '3-5-17': 'D',   // BD > AD、CD > BD → CD 最長
    '3-5-18': 'B',   // BD > AD、BD > CD → BD 最長
    '3-5-19': 'A',   // △PQR 中 QR > PQ → ∠P > ∠R（同一個三角形）
    '3-5-20': 'C',   // 兩人都錯：不在同一個三角形
    '3-5-21': 'C',   // ∠A = 74° 最大，∠B 是中間 → 53° < ∠B < 74°
    '3-5-22': 'A',   // ∠A = 38° 最小 → 71° < ∠B < 104°
    '3-5-23': 'B',   // 20² + 21² = 29²
    '3-5-24': 'D'    // 9² + 40² = 41²，BC 最長 → ∠A = 90°
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

// 四邊形 ABCD 被對角線 BD 分成 △DAB、△DBC：
//   a = ∠DAB、b1 = ∠DBA、b2 = ∠DBC、c = ∠DCB（B 在下、D 在上、A 在左、C 在右）
function ekKitePts(a, b1, b2, c) {
  const B = hbV(0, 0), D = hbAt(B, 90, 1);
  const A = hbAt(B, 90 + b1, Math.sin((180 - a - b1) * HB_RAD) / Math.sin(a * HB_RAD));
  const C = hbAt(B, 90 - b2, Math.sin((180 - b2 - c) * HB_RAD) / Math.sin(c * HB_RAD));
  return { A, B, C, D };
}

function ekKiteFig(ctx, W, H, ang, labs, box) {
  const p = ekKitePts(ang[0], ang[1], ang[2], ang[3]);
  const fit = hbFit([p.A, p.B, p.C, p.D], box || { x: 40, y: 32, w: W - 80, h: H - 62 });
  const q = { A: fit[0], B: fit[1], C: fit[2], D: fit[3] };
  hbPoly(ctx, [q.A, q.B, q.C, q.D], INK, 0.05, 2.4);
  hbSeg(ctx, q.B, q.D, INK, 2.2);
  const r = 22;
  const fnt = f(800, 13);
  hbAngle(ctx, q.A, q.D, q.B, r, HB_ROSE, { label: labs[0], lr: r + 18, font: fnt });
  hbAngle(ctx, q.B, q.A, q.D, r, HB_SKY, { label: labs[1], lr: r + 20, font: fnt });
  hbAngle(ctx, q.B, q.D, q.C, r + 8, HB_MOSS, { label: labs[2], lr: r + 26, font: fnt });
  hbAngle(ctx, q.C, q.B, q.D, r, HB_VIOLET, { label: labs[3], lr: r + 18, font: fnt });
  const G = hbCentroid([q.A, q.B, q.C, q.D]);
  ['A', 'B', 'C', 'D'].forEach(s => hbVLabel(ctx, q[s], G, s, HB_IVORY, 16));
  return q;
}

const EK_QUIZ_FIGS = {
  // 四邊形 ABCD，對角線 AC（示意圖）
  q9(ctx, W, H) {
    const A = hbV(0, 0), C = hbV(12, 0);
    const B = cgUpper(cgCC(A, 13, C, 6));
    const D = cgLower(cgCC(A, 5, C, 11));
    const fit = hbFit([A, B, C, D], { x: 50, y: 32, w: W - 100, h: H - 60 });
    const q = { A: fit[0], B: fit[1], C: fit[2], D: fit[3] };
    hbPoly(ctx, [q.A, q.B, q.C, q.D], INK, 0.05, 2.4);
    hbSeg(ctx, q.A, q.C, HB_GOLD, 2.2, [7, 5]);
    const G = hbCentroid([q.A, q.B, q.C, q.D]);
    ekSideLabel(ctx, q.A, q.B, G, '13', HB_ROSE, 16, f(800, 14));
    ekSideLabel(ctx, q.B, q.C, G, '6', HB_ROSE, 16, f(800, 14));
    ekSideLabel(ctx, q.C, q.D, G, '11', HB_SKY, 16, f(800, 14));
    ekSideLabel(ctx, q.D, q.A, G, '5', HB_SKY, 16, f(800, 14));
    ['A', 'B', 'C', 'D'].forEach(s => hbVLabel(ctx, q[s], G, s, HB_IVORY, 16));
    textLeft(ctx, '（示意圖）', 8, H - 12, MUTED, f(600, 11));
  },
  // 正方形 ABCD，E 在 CD 上
  q14(ctx, W, H) {
    const s = 150, x0 = (W - s) / 2, y0 = 34;
    const A = hbV(x0, y0), B = hbV(x0 + s, y0), C = hbV(x0 + s, y0 + s), D = hbV(x0, y0 + s);
    const E = hbV(x0 + s * 0.38, y0 + s);
    hbPoly(ctx, [A, B, C, D], INK, 0.04, 2.4);
    hbPoly(ctx, [A, B, E], HB_GOLD, 0.1, 2.2);
    hbAngle(ctx, B, A, E, 26, HB_ROSE, { label: '1', lr: 40, font: f(800, 14) });
    hbAngle(ctx, E, A, B, 22, HB_SKY, { label: '2', lr: 36, font: f(800, 14) });
    const G = hbCentroid([A, B, C, D]);
    ['A', 'B', 'C', 'D'].forEach((n, i) => hbVLabel(ctx, [A, B, C, D][i], G, n, HB_IVORY, 16));
    textCenter(ctx, 'E', E.x, E.y + 16, HB_IVORY, fi(800, 17));
  },
  q17(ctx, W, H) {
    ekKiteFig(ctx, W, H, [73, 58, 61, 54], ['73°', '58°', '61°', '54°']);
  },
  q18(ctx, W, H) {
    ekKiteFig(ctx, W, H, [72, 46, 43, 69], ['72°', '46°', '43°', '69°']);
  },
  // 四邊形 ABCD，AE ⊥ BC、AF ⊥ CD，AE = 7、AF = 12（照實際長度作圖）
  q20(ctx, W, H) {
    const u = hbV(Math.cos(100 * HB_RAD), Math.sin(100 * HB_RAD));
    // A 到 x 軸距離 7、到 CD 所在直線距離 12
    const ax = (12 + 7 * Math.cos(100 * HB_RAD)) / Math.sin(100 * HB_RAD);
    // 數學座標（y 朝上）：C 在原點，CB 沿 x 軸，CD 沿 100° 方向
    const A0 = hbV(ax, 7);
    const t = A0.x * u.x + A0.y * u.y;
    const pts = [A0, hbV(ax + 4.2, 0), hbV(0, 0), hbV(u.x * 8.2, u.y * 8.2), hbV(ax, 0), hbV(u.x * t, u.y * t)];
    const flip = pts.map(p => hbV(p.x, -p.y));
    const fit = hbFit(flip, { x: 46, y: 26, w: W - 92, h: H - 52 });
    const [A, B, C, D, E, F] = fit;
    hbPoly(ctx, [A, B, C, D], INK, 0.05, 2.4);
    hbSeg(ctx, A, E, HB_GOLD, 2.2);
    hbSeg(ctx, A, F, HB_SKY, 2.2);
    hbSector(ctx, E, hbHead(E, B), 90, 14, HB_GOLD, { right: true, alpha: 0.2 });
    hbSector(ctx, F, hbHead(F, A), 90, 14, HB_SKY, { right: true, alpha: 0.2 });
    const G = hbCentroid([A, B, C, D]);
    ekSideLabel(ctx, A, E, G, '7', HB_GOLD, 12, f(800, 14));
    textCenter(ctx, '12', (A.x + F.x) / 2, (A.y + F.y) / 2 - 12, HB_SKY, f(800, 14));
    ['A', 'B', 'C', 'D'].forEach((n, i) => hbVLabel(ctx, [A, B, C, D][i], G, n, HB_IVORY, 16));
    textCenter(ctx, 'E', E.x, E.y + 16, HB_IVORY, fi(800, 16));
    hbVLabel(ctx, F, A, 'F', HB_IVORY, 16);
  }
};

function initQuizFigs() {
  document.querySelectorAll('canvas.quiz-fig[data-fig]').forEach(cv => {
    const fn = EK_QUIZ_FIGS[cv.getAttribute('data-fig')];
    if (!fn) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    fn(ctx, cv.width, cv.height);
  });
}

/* ==========================================================================
   重點 1：兩邊的和大於第三邊、兩邊的差小於第三邊
   B(0, 0)、C(8, 0) 固定，A 在格點上移動（A 的高可以是 0：三點共線）
   ========================================================================== */
function ekPathData(x, h) {
  const L = {
    AB: ekRoot(x * x + h * h),
    AC: ekRoot((8 - x) * (8 - x) + h * h),
    BC: ekRoot(64)
  };
  return L;
}

// 「AB + AC = 9.51 > BC = 8」：用畫面上印出的數字算，關係由真值決定
function ekSumRow(L, p, q, r) {
  const s = Math.round((L[p].dec + L[q].dec) * 100) / 100;
  const tv = L[p].val + L[q].val - L[r].val;
  const rel = Math.abs(tv) < 1e-9 ? '=' : (tv > 0 ? '>' : '<');
  const ap = !(L[p].exact && L[q].exact);
  return { rel, s, ap, txt: `${p} + ${q} ${ap ? '≈' : '='} ${ekD2(L[p].dec)} + ${ekD2(L[q].dec)} = ${ekD2(s)} ${rel} ${r} ${L[r].exact ? '=' : '≈'} ${ekD2(L[r].dec)}` };
}

function ekDiffRow(L, p, q, r) {
  let big = p, small = q;
  if (L[q].val > L[p].val + 1e-12) { big = q; small = p; }
  const s = Math.round((L[big].dec - L[small].dec) * 100) / 100;
  const tv = (L[big].val - L[small].val) - L[r].val;
  const rel = Math.abs(tv) < 1e-9 ? '=' : (tv > 0 ? '>' : '<');
  const ap = !(L[big].exact && L[small].exact);
  return { rel, s, ap, txt: `${big} − ${small} ${ap ? '≈' : '='} ${ekD2(L[big].dec)} − ${ekD2(L[small].dec)} = ${ekD2(s)} ${rel} ${r} ${L[r].exact ? '=' : '≈'} ${ekD2(L[r].dec)}` };
}

function initPathCanvas() {
  const cv = hbEl('canvas-path');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sx = hbEl('pa-x'), sh = hbEl('pa-h'), vx = hbEl('pa-vx'), vh = hbEl('pa-vh');
  const g = hbEl('pa-mode-group');
  const out = hbEl('pa-formula'), fb = hbEl('pa-feedback');
  const C0 = EK_TONE[0];
  const U = 36, OX = 54, OY = 300;
  const px = (x, y) => hbV(OX + (x + 2) * U, OY - y * U);
  let mode = 'sum';

  function draw() {
    const W = cv.width;
    const x = hbClampSlider(sx, -2, 10), h = hbClampSlider(sh, 0, 6);
    vx.textContent = x; vh.textContent = h;
    const L = ekPathData(x, h);
    const A = px(x, h), B = px(0, 0), C = px(8, 0);
    const flat = (h === 0);
    const same = flat && (x === 0 || x === 8);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'sum' ? '從 A 到 C：直走，還是繞到 B？' : '兩邊相減，跟第三邊比一比', C0);
    ekGrid(ctx, px, -2, 10, 0, 6);
    if (flat) {
      const xs = [x, 0, 8];
      hbSeg(ctx, px(Math.min(...xs), 0), px(Math.max(...xs), 0), EK_NO, 3.4);
    } else {
      hbPoly(ctx, [A, B, C], HB_GOLD, 0.08, 0.01);
    }
    hbSeg(ctx, A, B, HB_ROSE, 3);
    hbSeg(ctx, A, C, HB_SKY, 3);
    hbSeg(ctx, B, C, HB_MOSS, 3);
    hbDot(ctx, A, HB_IVORY, 5);
    hbDot(ctx, B, HB_IVORY, 5);
    hbDot(ctx, C, HB_IVORY, 5);
    const G = flat ? hbV((A.x + B.x + C.x) / 3, OY - 40) : hbCentroid([A, B, C]);
    if (!same) {
      if (!flat) {
        ekSideLabel(ctx, A, B, G, L.AB.txt, HB_ROSE, 18);
        ekSideLabel(ctx, A, C, G, L.AC.txt, HB_SKY, 18);
      }
      ekSideLabel(ctx, B, C, flat ? hbV(G.x, OY - 80) : G, `BC = ${L.BC.txt}`, HB_MOSS, flat ? 34 : 20);
    }
    if (flat) {
      cgLabel(ctx, A, 'A', HB_IVORY, 0, -22, fi(800, 18));
      cgLabel(ctx, B, 'B', HB_IVORY, x === 0 ? 14 : 0, -22, fi(800, 18));
      cgLabel(ctx, C, 'C', HB_IVORY, x === 8 ? 14 : 0, -22, fi(800, 18));
    } else {
      hbVLabel(ctx, A, G, 'A', HB_IVORY, 20);
      hbVLabel(ctx, B, G, 'B', HB_IVORY, 20);
      hbVLabel(ctx, C, G, 'C', HB_IVORY, 20);
    }

    const pairs = [['AB', 'AC', 'BC'], ['AB', 'BC', 'AC'], ['AC', 'BC', 'AB']];
    const rows = pairs.map(p => (mode === 'sum' ? ekSumRow(L, p[0], p[1], p[2]) : ekDiffRow(L, p[0], p[1], p[2])));
    const want = mode === 'sum' ? '>' : '<';
    rows.forEach((r, i) => ekLine(ctx, r.txt, 356 + i * 30, r.rel === want ? INK : EK_NO, 16));
    const bad = rows.filter(r => r.rel !== want).length;
    let msg;
    if (same) msg = `A 和 ${x === 0 ? 'B' : 'C'} 疊在同一點：根本沒有三角形`;
    else if (flat) msg = '三點在同一直線上：有一組變成「=」，圍不成三角形';
    else msg = mode === 'sum' ? '三組都是「>」：任意兩邊的和大於第三邊' : '三組都是「<」：任意兩邊的差小於第三邊';
    ekLine(ctx, msg, 450, bad ? EK_NO : HB_GOLD, 16.5);

    out.innerHTML = [`\\(\\overline{AB} ${L.AB.exact ? '=' : '\\approx'} ${ekD2(L.AB.dec)}\\)`,
      `\\(\\overline{AC} ${L.AC.exact ? '=' : '\\approx'} ${ekD2(L.AC.dec)}\\)`,
      `\\(\\overline{BC} = 8\\)`].join('，<wbr>');
    if (same) {
      fb.innerHTML = wrapFeedback(`\\(A\\) 和 \\(${x === 0 ? 'B' : 'C'}\\) 是同一個點，只剩一條線段。把 \\(A\\) 往上拉，三角形才會出現。`);
    } else if (flat) {
      fb.innerHTML = wrapFeedback(`\\(A\\)、\\(B\\)、\\(C\\) 在同一直線上，紅色那一組變成<strong>相等</strong>——三角形被壓扁成一條線。<br>只要 \\(A\\) 離開直線一點點，「\\(=\\)」就變回${mode === 'sum' ? '「\\(\\gt\\)」' : '「\\(\\lt\\)」'}。`);
    } else if (mode === 'sum') {
      fb.innerHTML = wrapFeedback('兩點之間直線最短：從 \\(A\\) 直走到 \\(C\\)，一定比繞到 \\(B\\) 再到 \\(C\\) 近。<br>換成哪兩邊都一樣——<strong>任意兩邊的和大於第三邊</strong>。');
    } else {
      fb.innerHTML = wrapFeedback('把 \\(\\overline{AB} + \\overline{BC} \\gt \\overline{AC}\\) 兩邊同減 \\(\\overline{BC}\\)，就得到 \\(\\overline{AB} - \\overline{BC} \\lt \\overline{AC}\\)。<br>所以<strong>任意兩邊的差小於第三邊</strong>（用大的減小的）。');
    }
    typeset([out, fb]);
  }

  [sx, sh].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-pa-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 2：三線段能不能構成三角形——只看最長那一條
   最長的當底，另外兩條當半徑從兩端畫弧（課本的問題探索）
   ========================================================================== */
function initMakeCanvas() {
  const cv = hbEl('canvas-make');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sl = ['mk-a', 'mk-b', 'mk-c'].map(hbEl);
  const vl = ['mk-va', 'mk-vb', 'mk-vc'].map(hbEl);
  const out = hbEl('mk-formula'), fb = hbEl('mk-feedback');
  const C0 = EK_TONE[1];
  const NM = ['a', 'b', 'c'];

  function draw() {
    const W = cv.width;
    const v = sl.map(s => hbClampSlider(s, 1, 12));
    v.forEach((x, i) => { vl[i].textContent = x; });
    // 最長的（並列時取後面那一條）當底
    let li = 0;
    for (let i = 1; i < 3; i++) if (v[i] >= v[li]) li = i;
    const oth = [0, 1, 2].filter(i => i !== li);
    const L = v[li], p = v[oth[0]], q = v[oth[1]];
    const sum = p + q;
    const s = 30, Y = 300;
    const P0 = hbV(W / 2 - L * s / 2, Y), P1 = hbV(W / 2 + L * s / 2, Y);
    const xs = cgCC(P0, p * s, P1, q * s);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `最長的 ${NM[li]} 當底，${NM[oth[0]]}、${NM[oth[1]]} 從兩端畫弧`, C0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 40, W, Y - 40 + 2);
    ctx.clip();
    let apex = null;
    if (sum > L) {
      apex = cgUpper(xs);
      cgArcAt(ctx, P0, p * s, [apex], 0.35, CG_HONEY, 2.2);
      cgArcAt(ctx, P1, q * s, [apex], 0.35, CG_HONEY, 2.2);
    } else {
      cgArc(ctx, P0, p * s, Math.PI, 2 * Math.PI, CG_HONEY, 2.2);
      cgArc(ctx, P1, q * s, Math.PI, 2 * Math.PI, CG_HONEY, 2.2);
    }
    ctx.restore();
    hbSeg(ctx, P0, P1, HB_GOLD, 3.4);
    hbDot(ctx, P0, HB_IVORY, 5);
    hbDot(ctx, P1, HB_IVORY, 5);
    cgLabel(ctx, ekMid(P0, P1), `${NM[li]} = ${L}`, HB_GOLD, 0, 22, f(800, 15));
    if (apex) {
      const T = { A: apex, B: P0, C: P1 };
      hbPoly(ctx, [T.A, T.B, T.C], HB_MOSS, 0.1, 0.01);
      hbSeg(ctx, P0, apex, HB_MOSS, 3);
      hbSeg(ctx, P1, apex, HB_MOSS, 3);
      const G = hbCentroid([T.A, T.B, T.C]);
      ekSideLabel(ctx, P0, apex, G, `${NM[oth[0]]} = ${p}`, HB_MOSS, 18);
      ekSideLabel(ctx, P1, apex, G, `${NM[oth[1]]} = ${q}`, HB_MOSS, 18);
      hbDot(ctx, apex, HB_MOSS, 5);
    } else if (sum === L) {
      const T0 = hbV(P0.x + p * s, Y);
      hbDot(ctx, T0, EK_NO, 6);
      cgLabel(ctx, T0, '兩弧只碰在底上', EK_NO, 0, -24, f(800, 14));
    } else {
      const a0 = hbV(P0.x + p * s, Y), a1 = hbV(P1.x - q * s, Y);
      hbSeg(ctx, a0, a1, EK_NO, 6);
      cgLabel(ctx, ekMid(a0, a1), `缺 ${L - sum}`, EK_NO, 0, -22, f(800, 14));
    }

    // 三個不等式：只有「另兩邊和 vs 最長邊」那一個可能不成立
    const rows = [[0, 1, 2], [0, 2, 1], [1, 2, 0]].map(([i, j, k]) => {
      const t = v[i] + v[j];
      const rel = t > v[k] ? '>' : (t === v[k] ? '=' : '<');
      return { k, txt: `${NM[i]} + ${NM[j]} = ${v[i]} + ${v[j]} = ${t} ${rel} ${NM[k]} = ${v[k]}`, ok: rel === '>' };
    });
    rows.forEach((r, i) => {
      const key = (r.k === li);
      const col = r.ok ? (key ? HB_GOLD : MUTED) : EK_NO;
      ekLine(ctx, r.txt + (key ? '　← 關鍵' : ''), 352 + i * 28, col, key ? 16.5 : 15);
    });
    const ok = sum > L;
    ekLine(ctx, ok ? '最長邊比另外兩邊的和短 ⇒ 可以構成三角形'
      : (sum === L ? '另外兩邊的和剛好等於最長邊 ⇒ 壓成一直線，不行'
        : '另外兩邊的和比最長邊短 ⇒ 兩弧碰不到，不行'), 448, ok ? EK_OK : EK_NO, 16.5);

    const rel = ok ? '\\gt' : (sum === L ? '=' : '\\lt');
    out.innerHTML = `最長邊 \\(${NM[li]} = ${L}\\)：<wbr>\\(${NM[oth[0]]} + ${NM[oth[1]]} = ${sum} ${rel} ${L}\\)`;
    fb.innerHTML = wrapFeedback(ok
      ? `\\(${p} + ${q} = ${sum} \\gt ${L}\\)，兩弧在底的上方交於一點，三角形圍起來了。<br>另外兩個不等式裡都有最長邊在左邊，<strong>一定成立</strong>，不必再算。`
      : (sum === L
        ? `\\(${p} + ${q} = ${L}\\)：兩弧剛好碰在底邊上，三個點在同一直線上，<strong>不能</strong>構成三角形。`
        : `\\(${p} + ${q} = ${sum} \\lt ${L}\\)：兩條短的接起來還不夠長，兩弧碰不到，<strong>不能</strong>構成三角形。`));
    typeset([out, fb]);
  }

  sl.forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 3：等腰三角形——兩種長度，哪一種當腰？
   ========================================================================== */
function initIsoCanvas() {
  const cv = hbEl('canvas-iso');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = hbEl('is-p'), sq = hbEl('is-q'), vp = hbEl('is-vp'), vq = hbEl('is-vq');
  const g = hbEl('is-mode-group');
  const out = hbEl('is-formula'), fb = hbEl('is-feedback');
  const C0 = EK_TONE[2];
  let mode = 'p';

  function draw() {
    const W = cv.width;
    const p = hbClampSlider(sp, 1, 12), q = hbClampSlider(sq, 1, 12);
    vp.textContent = p; vq.textContent = q;
    const leg = mode === 'p' ? p : q, base = mode === 'p' ? q : p;
    const ok = 2 * leg > base;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `腰 = ${leg}、底 = ${base}：圍得起來嗎？`, C0);
    const Y = 312;
    if (ok) {
      const hh = Math.sqrt(leg * leg - base * base / 4);
      const s = Math.min(30, 400 / base, 240 / hh);
      const B = hbV(W / 2 - base * s / 2, Y), C = hbV(W / 2 + base * s / 2, Y), A = hbV(W / 2, Y - hh * s);
      const T = { A, B, C };
      const r = ekR(T, 14, 30);
      ekArcs(ctx, B, A, C, r, 1, HB_SKY, { alpha: 0.3 });
      ekArcs(ctx, C, A, B, r, 1, HB_SKY, { alpha: 0.3 });
      ekTri(ctx, T, { sides: [`${base}`, `${leg}`, `${leg}`], sideColor: [HB_GOLD, HB_MOSS, HB_MOSS] });
      ekTick(ctx, A, B, 1, HB_MOSS);
      ekTick(ctx, A, C, 1, HB_MOSS);
    } else {
      const s = Math.min(30, 420 / base);
      const B = hbV(W / 2 - base * s / 2, Y), C = hbV(W / 2 + base * s / 2, Y);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 40, W, Y - 38);
      ctx.clip();
      cgArc(ctx, B, leg * s, Math.PI, 2 * Math.PI, CG_HONEY, 2.2);
      cgArc(ctx, C, leg * s, Math.PI, 2 * Math.PI, CG_HONEY, 2.2);
      ctx.restore();
      hbSeg(ctx, B, C, HB_GOLD, 3.4);
      hbDot(ctx, B, HB_IVORY, 5);
      hbDot(ctx, C, HB_IVORY, 5);
      cgLabel(ctx, ekMid(B, C), `底 ${base}`, HB_GOLD, 0, 22, f(800, 15));
      if (2 * leg === base) {
        hbDot(ctx, hbV(W / 2, Y), EK_NO, 6);
        cgLabel(ctx, hbV(W / 2, Y), '兩腰只碰在底上', EK_NO, 0, -24, f(800, 14));
      } else {
        const a0 = hbV(B.x + leg * s, Y), a1 = hbV(C.x - leg * s, Y);
        hbSeg(ctx, a0, a1, EK_NO, 6);
        cgLabel(ctx, ekMid(a0, a1), `缺 ${base - 2 * leg}`, EK_NO, 0, -22, f(800, 14));
      }
      textCenter(ctx, `兩條腰（半徑 ${leg}）的弧碰不在一起`, W / 2, 60, EK_NO, f(700, 14));
    }
    const lineFor = (L0, B0) => {
      const s2 = 2 * L0;
      const rel = s2 > B0 ? '>' : (s2 === B0 ? '=' : '<');
      return { ok: s2 > B0, txt: `腰 ${L0}：${L0} + ${L0} = ${s2} ${rel} ${B0}` + (s2 > B0 ? `，周長 ${L0} + ${L0} + ${B0} = ${s2 + B0}` : '，不合') };
    };
    const r1 = lineFor(p, q), r2 = lineFor(q, p);
    ekLine(ctx, r1.txt, 372, mode === 'p' ? (r1.ok ? HB_GOLD : EK_NO) : MUTED, mode === 'p' ? 16.5 : 15);
    if (p !== q) ekLine(ctx, r2.txt, 402, mode === 'q' ? (r2.ok ? HB_GOLD : EK_NO) : MUTED, mode === 'q' ? 16.5 : 15);
    const nOk = (p === q) ? 1 : [r1, r2].filter(r => r.ok).length;
    const sumTxt = p === q ? `三邊都是 ${p}：正三角形，只有一種` : `兩種當腰的方法中，有 ${nOk} 種圍得起來`;
    ekLine(ctx, sumTxt, 440, HB_IVORY, 16);

    out.innerHTML = ok
      ? wbrEq(`${leg} + ${leg} = ${2 * leg} \\gt ${base}`) + `，<wbr>周長 \\(${2 * leg + base}\\)`
      : `\\(${leg} + ${leg} = ${2 * leg} ${2 * leg === base ? '=' : '\\lt'} ${base}\\)：<wbr>不合`;
    const other = mode === 'p' ? r2 : r1;
    fb.innerHTML = wrapFeedback((ok
      ? `腰 \\(${leg}\\)、腰 \\(${leg}\\)、底 \\(${base}\\)：最長邊比另兩邊的和短，圍得起來。兩腰相等，所以<strong>兩底角也相等</strong>（等邊對等角）。`
      : `腰 \\(${leg}\\)、腰 \\(${leg}\\)、底 \\(${base}\\)：兩腰加起來${2 * leg === base ? '剛好等於' : '還不到'}底，<strong>不合</strong>。`)
      + (p === q ? '' : `<br>另一種（腰 \\(${mode === 'p' ? q : p}\\)）${other.ok ? '也圍得起來' : '圍不起來'}——兩種都要檢查。`));
    typeset([out, fb]);
  }

  [sp, sq].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-is-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 4：已知兩邊，第三邊的範圍——兩根木條用鉚釘接起來張開
   ========================================================================== */
function initRangeCanvas() {
  const cv = hbEl('canvas-range');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('rg-a'), sb = hbEl('rg-b'), st = hbEl('rg-t');
  const va = hbEl('rg-va'), vb = hbEl('rg-vb'), vt = hbEl('rg-vt');
  const out = hbEl('rg-formula'), fb = hbEl('rg-feedback');
  const C0 = EK_TONE[3];

  function draw() {
    const W = cv.width;
    const a2 = hbClampSlider(sa, 2, 24), b2 = hbClampSlider(sb, 2, 24), t = hbClampSlider(st, 0, 180);
    const a = a2 / 2, b = b2 / 2;
    va.textContent = ekHalf(a2); vb.textContent = ekHalf(b2); vt.textContent = t;
    const lo2 = Math.abs(a2 - b2), hi2 = a2 + b2;
    const x = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(t * HB_RAD));
    const s = 15;
    const O = hbV(W / 2 - (a - b) * s / 2, 238);
    const P = hbAt(O, 0, a * s), Q = hbAt(O, t, b * s);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '兩根木條長度不變，張開的角度改變', C0);
    const flat = (t === 0 || t === 180);
    if (!flat) hbPoly(ctx, [O, P, Q], HB_ROSE, 0.08, 0.01);
    hbSeg(ctx, P, Q, flat ? EK_NO : HB_GOLD, 3, [8, 5]);
    hbSeg(ctx, O, P, HB_SKY, 4.5);
    hbSeg(ctx, O, Q, HB_MOSS, 4.5);
    if (t > 0) hbSector(ctx, O, 0, t, 22, HB_ROSE, { alpha: 0.2 });
    hbDot(ctx, O, '#d4a017', 6.5);
    const G = flat ? hbV(O.x, O.y - 60) : hbCentroid([O, P, Q]);
    if (!flat) {
      ekSideLabel(ctx, O, P, G, ekHalf(a2), HB_SKY, 16);
      ekSideLabel(ctx, O, Q, G, ekHalf(b2), HB_MOSS, 16);
      ekSideLabel(ctx, P, Q, G, `x ≈ ${ekD2(x)}`, HB_GOLD, 18);
    } else {
      cgLabel(ctx, O, t === 0 ? `疊在一起：x = ${ekHalf(lo2)}` : `拉成一直線：x = ${ekHalf(hi2)}`, EK_NO, 0, -34, f(800, 15));
    }

    // 數線：0～24，只在右端有箭頭（開發約束 34）
    const NL = numLine(ctx, { x0: 40, x1: 496, y: 352, min: 0, max: 24, tick: 1, labelEvery: 2 });
    const xa = NL.px(lo2 / 2), xb = NL.px(hi2 / 2);
    numLineSeg(ctx, 352, xa, xb, HB_ROSE, 'fold');
    numLineEnd(ctx, xa, 352, false, HB_ROSE);
    numLineEnd(ctx, xb, 352, false, HB_ROSE);
    const ints = [];
    for (let n = Math.floor(lo2 / 2) + 1; n * 2 < hi2; n++) ints.push(n);
    ints.forEach(n => hbDot(ctx, hbV(NL.px(n), 352), HB_GOLD, 3.6));
    ctx.save();
    ctx.fillStyle = flat ? EK_NO : HB_GOLD;
    const mx = NL.px(x);
    ctx.beginPath();
    ctx.moveTo(mx, 344);
    ctx.lineTo(mx - 7, 330);
    ctx.lineTo(mx + 7, 330);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ekLine(ctx, `${ekHalf(b2 > a2 ? b2 : a2)} − ${ekHalf(b2 > a2 ? a2 : b2)} < x < ${ekHalf(a2)} + ${ekHalf(b2)}，即 ${ekHalf(lo2)} < x < ${ekHalf(hi2)}`, 402, HB_ROSE, 16.5);
    ekLine(ctx, `x 是整數：${ints.length ? (ints.length <= 8 ? ints.join('、') : `${ints[0]}、${ints[1]}、…、${ints[ints.length - 1]}`) : '沒有'}，共 ${ints.length} 個`, 434, HB_GOLD, 15.5);
    ekLine(ctx, flat ? `現在 x = ${ekHalf(t === 0 ? lo2 : hi2)}，碰到端點：三點共線，不是三角形` : `現在 x ≈ ${ekD2(x)}，落在範圍裡`, 462, flat ? EK_NO : INK, 14.5);

    out.innerHTML = `\\(${ekHalf(lo2)} \\lt x \\lt ${ekHalf(hi2)}\\)，<wbr>整數 \\(x\\) 共 \\(${ints.length}\\) 個`;
    fb.innerHTML = wrapFeedback(flat
      ? (t === 0
        ? '張開 \\(0^\\circ\\)：兩根木條疊在一起，第三邊只剩「兩邊的差」，三點共線，<strong>不算</strong>三角形，所以範圍的端點是空心圈。'
        : '張開 \\(180^\\circ\\)：拉成一直線，第三邊是「兩邊的和」，也<strong>不算</strong>三角形，端點仍是空心圈。')
      : '角度越大，第三邊越長；但永遠<strong>大於兩邊的差、小於兩邊的和</strong>。<br>兩個端點都取不到——取到就壓成一直線了。');
    typeset([out, fb]);
  }

  [sa, sb, st].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 5：共用邊——兩個三角形的範圍取交集
   四邊形 ABCD 的對角線 AC 同時是 △ABC 與 △ACD 的邊
   ========================================================================== */
function ekInterval(p, q) {
  return [Math.abs(p - q), p + q];
}

function initShareCanvas() {
  const cv = hbEl('canvas-share');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const ids = ['ab', 'bc', 'cd', 'da', 'ac'];
  const sl = ids.map(k => hbEl('sh-' + k)), vl = ids.map(k => hbEl('sh-v' + k));
  const out = hbEl('sh-formula'), fb = hbEl('sh-feedback');
  const C0 = EK_TONE[4];

  function draw() {
    const W = cv.width;
    const ab = hbClampSlider(sl[0], 2, 12), bc = hbClampSlider(sl[1], 2, 12);
    const cd = hbClampSlider(sl[2], 2, 12), da = hbClampSlider(sl[3], 2, 12);
    const ac = hbClampSlider(sl[4], 1, 24);
    [ab, bc, cd, da, ac].forEach((v, i) => { vl[i].textContent = v; });
    const I1 = ekInterval(ab, bc), I2 = ekInterval(cd, da);
    const lo = Math.max(I1[0], I2[0]), hi = Math.min(I1[1], I2[1]);
    const ints = [];
    for (let n = lo + 1; n < hi; n++) ints.push(n);
    const ok1 = ac > I1[0] && ac < I1[1], ok2 = ac > I2[0] && ac < I2[1];

    const s = 11, Y = 212;
    const A = hbV(W / 2 - ac * s / 2, Y), C = hbV(W / 2 + ac * s / 2, Y);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '對角線 AC 要同時讓上下兩個三角形都圍得起來', C0);
    const Bs = cgCC(A, ab * s, C, bc * s), Ds = cgCC(A, da * s, C, cd * s);
    const B = ok1 ? cgUpper(Bs) : null, D = ok2 ? cgLower(Ds) : null;
    if (B) {
      hbPoly(ctx, [A, B, C], HB_ROSE, 0.1, 0.01);
      hbSeg(ctx, A, B, HB_ROSE, 3); hbSeg(ctx, B, C, HB_ROSE, 3);
      const G = hbCentroid([A, B, C]);
      ekSideLabel(ctx, A, B, G, String(ab), HB_ROSE, 15, f(800, 14));
      ekSideLabel(ctx, B, C, G, String(bc), HB_ROSE, 15, f(800, 14));
      hbVLabel(ctx, B, G, 'B', HB_IVORY, 18);
    } else {
      textCenter(ctx, `△ABC 圍不起來：AC 要在 ${I1[0]} 與 ${I1[1]} 之間`, W / 2, 62, EK_NO, f(700, 14));
    }
    if (D) {
      hbPoly(ctx, [A, D, C], HB_SKY, 0.1, 0.01);
      hbSeg(ctx, A, D, HB_SKY, 3); hbSeg(ctx, D, C, HB_SKY, 3);
      const G = hbCentroid([A, D, C]);
      ekSideLabel(ctx, A, D, G, String(da), HB_SKY, 15, f(800, 14));
      ekSideLabel(ctx, D, C, G, String(cd), HB_SKY, 15, f(800, 14));
      hbVLabel(ctx, D, G, 'D', HB_IVORY, 18);
    } else {
      textCenter(ctx, `△ACD 圍不起來：AC 要在 ${I2[0]} 與 ${I2[1]} 之間`, W / 2, 344, EK_NO, f(700, 14));
    }
    hbSeg(ctx, A, C, (ok1 && ok2) ? HB_GOLD : EK_NO, 3.4, [9, 6]);
    cgLabel(ctx, A, 'A', HB_IVORY, -16, 0, fi(800, 18));
    cgLabel(ctx, C, 'C', HB_IVORY, 16, 0, fi(800, 18));
    // AC 太短時標籤放到 C 的右邊，才不會蓋住 A、C 兩個字母
    if (ac * s >= 90) cgLabel(ctx, ekMid(A, C), `AC = ${ac}`, (ok1 && ok2) ? HB_GOLD : EK_NO, 0, 0, f(800, 14));
    else cgLabel(ctx, C, `AC = ${ac}`, (ok1 && ok2) ? HB_GOLD : EK_NO, 64, 0, f(800, 14));

    // 數線：兩段範圍與交集（右端箭頭）
    const NY = 486;
    const NL = numLine(ctx, { x0: 40, x1: 496, y: NY, min: 0, max: 24, tick: 1, labelEvery: 2 });
    const bar = (I, y, col) => {
      hbSeg(ctx, hbV(NL.px(I[0]), y), hbV(NL.px(I[1]), y), col, 5);
      [I[0], I[1]].forEach(v0 => {
        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(NL.px(v0), y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });
    };
    bar(I1, 414, HB_ROSE);
    bar(I2, 432, HB_SKY);
    if (hi > lo) {
      numLineSeg(ctx, NY, NL.px(lo), NL.px(hi), HB_GOLD, 'fold');
      numLineEnd(ctx, NL.px(lo), NY, false, HB_GOLD);
      numLineEnd(ctx, NL.px(hi), NY, false, HB_GOLD);
      ints.forEach(n => hbDot(ctx, hbV(NL.px(n), NY), HB_GOLD, 3.4));
    }
    ctx.save();
    ctx.fillStyle = (ok1 && ok2) ? HB_GOLD : EK_NO;
    const mx = NL.px(ac);
    ctx.beginPath();
    ctx.moveTo(mx, 404);
    ctx.lineTo(mx - 6, 392);
    ctx.lineTo(mx + 6, 392);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const t1 = `${I1[0]} < AC < ${I1[1]}`, t2 = `${I2[0]} < AC < ${I2[1]}`;
    textCenter(ctx, `△ABC：${t1}`, W / 4 + 10, 378, HB_ROSE, f(800, 14));
    textCenter(ctx, `△ACD：${t2}`, W * 3 / 4 - 10, 378, HB_SKY, f(800, 14));

    const rng = hi > lo ? `\\(${lo} \\lt \\overline{AC} \\lt ${hi}\\)` : '交集是空的';
    out.innerHTML = `\\(${I1[0]} \\lt \\overline{AC} \\lt ${I1[1]}\\)<wbr> 且 \\(${I2[0]} \\lt \\overline{AC} \\lt ${I2[1]}\\)<wbr> ⇒ ${rng}`;
    let msg;
    if (hi <= lo) {
      msg = '兩段範圍沒有重疊：不管 \\(\\overline{AC}\\) 多長，總有一個三角形圍不起來，這樣的四邊形<strong>不存在</strong>。';
    } else {
      msg = `交集是 \\(${lo} \\lt \\overline{AC} \\lt ${hi}\\)，整數的 \\(\\overline{AC}\\) ${ints.length ? `最小 \\(${ints[0]}\\)、最大 \\(${ints[ints.length - 1]}\\)` : '一個都沒有'}。<br>`;
      msg += (ok1 && ok2) ? `現在 \\(\\overline{AC} = ${ac}\\) 落在交集裡，上下兩個三角形都圍得起來。`
        : `現在 \\(\\overline{AC} = ${ac}\\) 不在${!ok1 && !ok2 ? '兩段' : (ok1 ? '藍色' : '紅色')}範圍裡，${!ok1 ? '△ABC' : '△ACD'}${!ok1 && !ok2 ? ' 和 △ACD 都' : ''}圍不起來。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  sl.forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 6：大邊對大角（等邊對等角）——格點三角形
   B(0, 0)、C(cx, 0)、A(ax, ay)；邊長平方是整數，大小與相等都精確
   ========================================================================== */
// 三邊長的平方：a = BC（∠A 的對邊）、b = CA、c = AB
function ekLatticeTri(ax, ay, cx) {
  return {
    a: cx * cx,
    b: (cx - ax) * (cx - ax) + ay * ay,
    c: ax * ax + ay * ay
  };
}

function initBigCanvas() {
  const cv = hbEl('canvas-big');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sx = hbEl('bg-ax'), sy = hbEl('bg-ay'), sc = hbEl('bg-cx');
  const vx = hbEl('bg-vax'), vy = hbEl('bg-vay'), vc = hbEl('bg-vcx');
  const out = hbEl('bg-formula'), fb = hbEl('bg-feedback');
  const C0 = EK_TONE[5];
  const U = 34, OX = 60, OY = 320;
  const px = (x, y) => hbV(OX + (x + 2) * U, OY - y * U);

  function draw() {
    const W = cv.width;
    const ax = hbClampSlider(sx, -2, 10), ay = hbClampSlider(sy, 1, 7), cx = hbClampSlider(sc, 3, 10);
    vx.textContent = ax; vy.textContent = ay; vc.textContent = cx;
    const n = ekLatticeTri(ax, ay, cx);
    const sq = [n.a, n.b, n.c];                 // BC、CA、AB 的平方
    const len = sq.map(ekRoot);
    const T = { A: px(ax, ay), B: px(0, 0), C: px(cx, 0) };
    const ang = [hbAngleDeg(T.A, T.B, T.C), hbAngleDeg(T.B, T.C, T.A), hbAngleDeg(T.C, T.A, T.B)];
    const rk = ekRank(sq, (i, j) => sq[i] === sq[j]);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '同一個顏色：一條邊和它對面的角', C0);
    ekGrid(ctx, px, -2, 10, 0, 7);
    const r = ekR(T, 16, 28);
    const names = ['A', 'B', 'C'];
    const verts = [T.A, T.B, T.C];
    // 相等的角畫同樣條數的弧、相等的邊畫同樣條數的短線
    const marks = [1, 1, 1];
    rk.groups.forEach(gp => { if (gp.length > 1) gp.forEach(i => { marks[i] = gp.length === 3 ? 1 : 2; }); });
    verts.forEach((V, i) => {
      const P = verts[(i + 1) % 3], Q = verts[(i + 2) % 3];
      ekArcs(ctx, V, P, Q, r, rk.groups.some(gp => gp.length > 1 && gp.includes(i)) ? marks[i] : 1, rk.color[i], { alpha: 0.3 });
    });
    ekTri(ctx, T, { sides: len.map(l => l.txt), sideColor: rk.color, names });
    const segs = [[T.B, T.C], [T.C, T.A], [T.A, T.B]];
    rk.groups.forEach(gp => { if (gp.length > 1) gp.forEach(i => ekTick(ctx, segs[i][0], segs[i][1], gp.length === 3 ? 1 : 2, rk.color[i])); });

    const sideN = ['BC', 'CA', 'AB'], angN = ['∠A', '∠B', '∠C'];
    const sideTxt = rk.groups.map(gp => gp.map(i => `${sideN[i]} = ${len[i].txt}`).join(' = ')).join(' > ');
    const angTxt = rk.groups.map(gp => gp.map(i => `${angN[i]} ≈ ${ekD1(ang[i])}°`).join(' = ')).join(' > ');
    ekLine(ctx, '邊：' + sideTxt, 372, HB_IVORY, 15.5);
    ekLine(ctx, '角：' + angTxt, 404, HB_IVORY, 15.5);
    const big = rk.groups[0], small = rk.groups[rk.groups.length - 1];
    let msg;
    if (rk.groups.length === 1) msg = '三邊都相等 ⇒ 三個角都相等（正三角形）';
    else msg = `最長的 ${big.map(i => sideN[i]).join('、')} 對著最大的 ${big.map(i => angN[i]).join('、')}；最短的 ${small.map(i => sideN[i]).join('、')} 對著最小的 ${small.map(i => angN[i]).join('、')}`;
    ekLine(ctx, msg, 440, HB_GOLD, 15);

    const texSide = ['\\overline{BC}', '\\overline{CA}', '\\overline{AB}'];
    const texAng = ['\\angle A', '\\angle B', '\\angle C'];
    out.innerHTML = wbrEq(ekChain(rk.groups, texSide, { gt: ' \\gt ', eq: ' = ' }))
      + ' ⇒ <wbr>' + wbrEq(ekChain(rk.groups, texAng, { gt: ' \\gt ', eq: ' = ' }));
    const hasEq = rk.groups.some(gp => gp.length > 1);
    fb.innerHTML = wrapFeedback((hasEq
      ? '有兩邊一樣長時，它們對面的兩個角也一樣大：<strong>等邊對等角</strong>（反過來，等角也對等邊）。<br>'
      : '')
      + '邊長平方是整數，大小一比就知道；角度是由座標量出來的，順序跟邊<strong>完全一樣</strong>：<strong>大邊對大角</strong>。');
    typeset([out, fb]);
  }

  [sx, sy, sc].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 7：大邊對大角的推理——先找出哪一條邊比較大
   模式 alt：高 AH 把 ∠A 分成兩塊（例 4）
   模式 sq ：正方形裡的直角三角形，斜邊最長（例 5）
   ========================================================================== */
function initWhyCanvas() {
  const cv = hbEl('canvas-why');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sx = hbEl('wy-ax'), sy = hbEl('wy-ay'), se = hbEl('wy-e');
  const vx = hbEl('wy-vax'), vy = hbEl('wy-vay'), ve = hbEl('wy-ve');
  const rows = { ax: hbEl('wy-row-ax'), ay: hbEl('wy-row-ay'), e: hbEl('wy-row-e') };
  const g = hbEl('wy-mode-group');
  const out = hbEl('wy-formula'), fb = hbEl('wy-feedback');
  const C0 = EK_TONE[6];
  let mode = 'alt';

  function drawAlt() {
    const W = cv.width;
    const ax = hbClampSlider(sx, 1, 9), ay = hbClampSlider(sy, 2, 7);
    vx.textContent = ax; vy.textContent = ay;
    const U = 38, OX = 80, OY = 300;
    const px = (x, y) => hbV(OX + x * U, OY - y * U);
    const T = { A: px(ax, ay), B: px(0, 0), C: px(10, 0) };
    const H = px(ax, 0);
    const ab2 = ax * ax + ay * ay, ac2 = (10 - ax) * (10 - ax) + ay * ay;
    const AB = ekRoot(ab2), AC = ekRoot(ac2);
    const aB = hbAngleDeg(T.B, T.A, T.C), aC = hbAngleDeg(T.C, T.A, T.B);
    const a1 = hbAngleDeg(T.A, T.B, H), a2 = hbAngleDeg(T.A, H, T.C);
    const rel = ab2 > ac2 ? '>' : (ab2 < ac2 ? '<' : '=');
    drawTitle(ctx, '高 AH 把 ∠A 切成 ∠BAH 和 ∠CAH', C0);
    const colB = rel === '<' ? EK_BIG : (rel === '>' ? EK_SMALL : EK_MID);
    const colC = rel === '>' ? EK_BIG : (rel === '<' ? EK_SMALL : EK_MID);
    hbAngle(ctx, T.B, T.A, T.C, 26, colB, { alpha: 0.3 });
    hbAngle(ctx, T.C, T.A, T.B, 26, colC, { alpha: 0.3 });
    hbAngle(ctx, T.A, T.B, H, 30, colB === EK_BIG ? EK_SMALL : (colB === EK_SMALL ? EK_BIG : EK_MID), { alpha: 0.18, dash: [4, 3] });
    hbAngle(ctx, T.A, H, T.C, 38, colC === EK_BIG ? EK_SMALL : (colC === EK_SMALL ? EK_BIG : EK_MID), { alpha: 0.18 });
    ekTri(ctx, T, { sides: ['10', AC.txt, AB.txt], sideColor: [INK, colB, colC] });
    hbSeg(ctx, T.A, H, HB_IVORY, 2, [6, 5]);
    hbSector(ctx, H, 0, 90, 14, HB_IVORY, { right: true, alpha: 0.15 });
    textCenter(ctx, 'H', H.x, H.y + 20, HB_IVORY, fi(800, 17));
    if (rel === '=') { ekTick(ctx, T.A, T.B, 1, EK_MID); ekTick(ctx, T.A, T.C, 1, EK_MID); }
    ekLine(ctx, `① AB = ${AB.txt} ${rel} AC = ${AC.txt}`, 352, HB_IVORY, 15.5);
    ekLine(ctx, `② 大邊對大角：∠C ${rel} ∠B（∠B ≈ ${ekD1(aB)}°，∠C ≈ ${ekD1(aC)}°）`, 382, HB_IVORY, 15.5);
    ekLine(ctx, `③ ∠BAH = 90° − ∠B ${rel} 90° − ∠C = ∠CAH`, 412, HB_GOLD, 15.5);
    ekLine(ctx, `量一量：∠BAH ≈ ${ekD1(a1)}°，∠CAH ≈ ${ekD1(a2)}°`, 442, MUTED, 14.5);
    const lt = { '>': '\\gt', '<': '\\lt', '=': '=' };
    out.innerHTML = `\\(\\overline{AB} ${lt[rel]} \\overline{AC}\\)<wbr> ⇒ \\(\\angle C ${lt[rel]} \\angle B\\)<wbr> ⇒ \\(\\angle BAH ${lt[rel]} \\angle CAH\\)`;
    fb.innerHTML = wrapFeedback(rel === '='
      ? '\\(\\overline{AB} = \\overline{AC}\\)：等腰三角形，\\(\\angle B = \\angle C\\)，高把頂角平分成兩個一樣大的角。'
      : `比 \\(\\angle BAH\\)、\\(\\angle CAH\\) 不能直接用大邊對大角（它們不在同一個三角形裡、對邊也不是題目給的）。<br>先在 △\\(ABC\\) 比 \\(\\angle B\\)、\\(\\angle C\\)，再用「直角三角形的兩銳角互餘」轉過去：<strong>大的減去後反而小</strong>。`);
  }

  function drawSq() {
    const W = cv.width;
    const e = hbClampSlider(se, 0, 6);
    ve.textContent = e;
    const s = 40, x0 = 150, y0 = 76;
    const A = hbV(x0, y0), B = hbV(x0, y0 + 6 * s), C = hbV(x0 + 6 * s, y0 + 6 * s), D = hbV(x0 + 6 * s, y0);
    const E = hbV(x0 + e * s, y0);
    const ce2 = 36 + (6 - e) * (6 - e);
    const CE = ekRoot(ce2);
    const aCBE = hbAngleDeg(B, C, E), aCEB = hbAngleDeg(E, B, C);
    drawTitle(ctx, '正方形 ABCD，E 在 AD 上，連 BE、CE', C0);
    hbPoly(ctx, [A, B, C, D], INK, 0.03, 2.4);
    hbPoly(ctx, [B, C, E], HB_GOLD, 0.1, 0.01);
    hbSeg(ctx, B, E, HB_GOLD, 3);
    hbSeg(ctx, C, E, e === 6 ? EK_MID : EK_BIG, 3.4);
    hbSeg(ctx, B, C, e === 6 ? EK_MID : EK_SMALL, 3.4);
    if (e < 6) hbSector(ctx, D, 180, 90, 16, HB_IVORY, { right: true, alpha: 0.15 });
    hbAngle(ctx, B, C, E, 30, e === 6 ? EK_MID : EK_BIG, { alpha: 0.3 });
    hbAngle(ctx, E, B, C, 26, e === 6 ? EK_MID : EK_SMALL, { alpha: 0.3 });
    ekTick(ctx, B, C, 1, INK);
    ekTick(ctx, C, D, 1, INK);
    const G = hbCentroid([A, B, C, D]);
    [['A', A], ['B', B], ['C', C], ['D', D]].forEach(([n, P]) => hbVLabel(ctx, P, G, n, HB_IVORY, 18));
    if (e > 0 && e < 6) textCenter(ctx, 'E', E.x, E.y - 18, HB_GOLD, fi(800, 18));
    else cgLabel(ctx, E, `E（與 ${e === 0 ? 'A' : 'D'} 重合）`, HB_GOLD, e === 0 ? 62 : -62, 24, f(800, 13));
    cgLabel(ctx, ekMid(C, E), `CE = ${CE.txt}`, e === 6 ? EK_MID : EK_BIG, 34, 6, f(800, 14));
    if (e < 6) {
      ekLine(ctx, `① △CDE 中 ∠D = 90°，斜邊 CE 最長：CE > CD = BC = 6`, 380, HB_IVORY, 15.5);
      ekLine(ctx, '② △BCE 中 CE > BC ⇒ ∠CBE > ∠CEB（大邊對大角）', 410, HB_GOLD, 15.5);
    } else {
      ekLine(ctx, '① E 與 D 重合：CE 就是 CD，CE = CD = BC = 6', 380, HB_IVORY, 15.5);
      ekLine(ctx, '② 等邊對等角：∠CBE = ∠CEB', 410, HB_GOLD, 15.5);
    }
    ekLine(ctx, `量一量：∠CBE ≈ ${ekD1(aCBE)}°，∠CEB ≈ ${ekD1(aCEB)}°`, 440, MUTED, 14.5);
    out.innerHTML = e < 6
      ? `\\(\\overline{CE} = ${CE.tex} \\gt \\overline{BC} = 6\\)<wbr> ⇒ \\(\\angle CBE \\gt \\angle CEB\\)`
      : `\\(\\overline{CE} = \\overline{BC} = 6\\)<wbr> ⇒ \\(\\angle CBE = \\angle CEB\\)`;
    fb.innerHTML = wrapFeedback(e < 6
      ? '題目沒有直接告訴你哪條邊比較長，要自己找：直角三角形裡<strong>直角最大，所以斜邊最長</strong>。<br>有了 \\(\\overline{CE} \\gt \\overline{BC}\\)，再回到 △\\(BCE\\) 用大邊對大角。'
      : '\\(E\\) 走到 \\(D\\) 時，△\\(CDE\\) 消失了，\\(\\overline{CE}\\) 和 \\(\\overline{BC}\\) 一樣長，兩個角也就一樣大。');
  }

  function draw() {
    rows.ax.style.display = mode === 'alt' ? '' : 'none';
    rows.ay.style.display = mode === 'alt' ? '' : 'none';
    rows.e.style.display = mode === 'sq' ? '' : 'none';
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (mode === 'alt') drawAlt(); else drawSq();
    typeset([out, fb]);
  }

  [sx, sy, se].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-wy-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 8：大角對大邊——先把第三個角算出來
   ========================================================================== */
function initAngCanvas() {
  const cv = hbEl('canvas-ang');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('ag-a'), sb = hbEl('ag-b'), va = hbEl('ag-va'), vb = hbEl('ag-vb');
  const out = hbEl('ag-formula'), fb = hbEl('ag-feedback');
  const C0 = EK_TONE[7];

  function draw() {
    const W = cv.width;
    const A = hbClampSlider(sa, 10, 150);
    const B = hbClampSlider(sb, 10, 170 - A);
    const Cc = 180 - A - B;
    va.textContent = A; vb.textContent = B;
    const deg = [A, B, Cc];
    const T = hbTriangle(A, B, { x: 70, y: 82, w: 400, h: 214 });
    const len = [hbDist(T.B, T.C), hbDist(T.C, T.A), hbDist(T.A, T.B)].map(v => v / 40);
    const rk = ekRank(deg, (i, j) => deg[i] === deg[j]);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `∠C = 180° − ${A}° − ${B}° = ${Cc}°`, C0);
    const r = ekR(T, 16, 30);
    const verts = [T.A, T.B, T.C];
    verts.forEach((V, i) => {
      const P = verts[(i + 1) % 3], Q = verts[(i + 2) % 3];
      const gp = rk.groups.find(x => x.includes(i));
      ekArcs(ctx, V, P, Q, r, gp.length === 2 ? 2 : 1, rk.color[i], { alpha: 0.3, label: `${deg[i]}°`, lr: r + 20, font: f(800, 14) });
    });
    ekTri(ctx, T, { sides: len.map(v => ekD2(v)), sideColor: rk.color, sideOff: 22 });
    const segs = [[T.B, T.C], [T.C, T.A], [T.A, T.B]];
    rk.groups.forEach(gp => { if (gp.length > 1) gp.forEach(i => ekTick(ctx, segs[i][0], segs[i][1], gp.length === 3 ? 1 : 2, rk.color[i])); });
    const angN = ['∠A', '∠B', '∠C'], sideN = ['BC', 'CA', 'AB'];
    ekLine(ctx, '角：' + rk.groups.map(gp => gp.map(i => `${angN[i]} = ${deg[i]}°`).join(' = ')).join(' > '), 356, HB_IVORY, 15.5);
    ekLine(ctx, '⇒ 邊：' + ekChain(rk.groups, sideN), 388, HB_GOLD, 17);
    ekLine(ctx, '量一量：' + rk.groups.map(gp => gp.map(i => `${sideN[i]} ≈ ${ekD2(len[i])}`).join(' = ')).join(' > '), 420, MUTED, 14.5);
    ekLine(ctx, '找對邊：不在這條邊上的那個頂點，就是它對著的角', 450, MUTED, 13.5);

    const texAng = ['\\angle A', '\\angle B', '\\angle C'];
    const texSide = ['\\overline{BC}', '\\overline{CA}', '\\overline{AB}'];
    out.innerHTML = wbrEq(`\\angle C = 180^\\circ - ${hbDg(A)} - ${hbDg(B)} = ${hbDg(Cc)}`) + '，<wbr>'
      + wbrEq(ekChain(rk.groups, texSide, { gt: ' \\gt ', eq: ' = ' }));
    const big = rk.groups[0];
    fb.innerHTML = wrapFeedback(rk.groups.length === 1
      ? '三個角都是 \\(60^\\circ\\)：三邊相等。'
      : `最大的角是 ${big.map(i => `\\(${texAng[i]}\\)`).join('、')}，所以它對面的 ${big.map(i => `\\(${texSide[i]}\\)`).join('、')} 最長：<strong>大角對大邊</strong>。<br>${rk.groups.some(gp => gp.length > 1) ? '有兩個角相等，它們的對邊也相等（等角對等邊）。' : '找對邊的方法：哪個頂點不在這條邊上，這條邊就是那個角的對邊。'}`);
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 9：大角對大邊的串接——兩個三角形共用一條邊 DB
   ========================================================================== */
function ekCmp(x, y) {
  return x > y ? '>' : (x < y ? '<' : '=');
}

function initChainCanvas() {
  const cv = hbEl('canvas-chain');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const ids = ['a', 'b1', 'b2', 'c'];
  const sl = ids.map(k => hbEl('ch-' + k)), vl = ids.map(k => hbEl('ch-v' + k));
  const out = hbEl('ch-formula'), fb = hbEl('ch-feedback');
  const C0 = EK_TONE[8];

  function draw() {
    const W = cv.width;
    const a = hbClampSlider(sl[0], 20, 120);
    const b1 = hbClampSlider(sl[1], 20, Math.min(120, 160 - a));
    const b2 = hbClampSlider(sl[2], 20, Math.min(120, 160 - b1));
    const c = hbClampSlider(sl[3], 20, Math.min(120, 160 - b2));
    [a, b1, b2, c].forEach((v, i) => { vl[i].textContent = v; });
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '對角線 BD 是兩個三角形共用的邊', C0);
    const q = ekKiteFig(ctx, W, cv.height, [a, b1, b2, c], [`${a}°`, `${b1}°`, `${b2}°`, `${c}°`], { x: 60, y: 50, w: 420, h: 250 });
    const r1 = ekCmp(a, b1);    // DB 對 ∠DAB、DA 對 ∠DBA
    const r2 = ekCmp(b2, c);    // DC 對 ∠DBC、DB 對 ∠DCB
    ekLine(ctx, `△DAB：∠DAB = ${a}° ${r1} ∠DBA = ${b1}° ⇒ DB ${r1} DA`, 340, HB_ROSE, 15.5);
    ekLine(ctx, `△DBC：∠DBC = ${b2}° ${r2} ∠DCB = ${c}° ⇒ DC ${r2} DB`, 370, HB_MOSS, 15.5);
    // 以 DB 為 0：比 DB 長記 +1、短記 −1、相等記 0
    const sg = { '>': 1, '<': -1, '=': 0 };
    const vDA = -sg[r1], vDC = sg[r2];
    const can = !(vDA !== 0 && vDA === vDC);
    let concl;
    if (can) {
      const items = [['DA', vDA], ['DB', 0], ['DC', vDC]].sort((x, y) => y[1] - x[1]);
      concl = items.map(x => x[0]).reduce((acc, nm, i) => (i === 0 ? nm : acc + (items[i - 1][1] === items[i][1] ? ' = ' : ' > ') + nm), '');
    } else {
      concl = vDA > 0 ? 'DB 最短；只靠這兩次比較，DA、DC 分不出大小' : 'DB 最長；只靠這兩次比較，DA、DC 分不出大小';
    }
    ekLine(ctx, can ? `串起來：${concl}` : concl, 404, can ? HB_GOLD : EK_NO, 17);
    const mDA = hbDist(q.D, q.A), mDB = hbDist(q.D, q.B), mDC = hbDist(q.D, q.C);
    const k = 40;
    ekLine(ctx, `量一量：DA ≈ ${ekD2(mDA / k)}，DB ≈ ${ekD2(mDB / k)}，DC ≈ ${ekD2(mDC / k)}（畫布單位）`, 436, MUTED, 13.5);

    const lt = { '>': '\\gt', '<': '\\lt', '=': '=' };
    out.innerHTML = `\\(\\overline{DB} ${lt[r1]} \\overline{DA}\\)，<wbr>\\(\\overline{DC} ${lt[r2]} \\overline{DB}\\)`;
    fb.innerHTML = wrapFeedback(can
      ? '每一次比較都只在<strong>同一個三角形</strong>裡做；兩個三角形共用 \\(\\overline{DB}\\)，就能把兩段結果接成一串。'
      : `兩次比較都${vDA > 0 ? '說 \\(\\overline{DB}\\) 比較短' : '說 \\(\\overline{DB}\\) 比較長'}，\\(\\overline{DA}\\) 和 \\(\\overline{DC}\\) 不在同一個三角形裡，<strong>無法</strong>用這兩組角判斷誰長。`);
    typeset([out, fb]);
  }

  sl.forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 10：邊角關係只在同一個三角形裡成立
   兩個等腰三角形：△ABC 頂角 C、底 AB；△PQR 頂角 R、底 PQ
   ========================================================================== */
function ekIsoApex(apex, base, cx, by, s) {
  const h = (base / 2) / Math.tan(apex / 2 * HB_RAD);
  return { L: hbV(cx - base * s / 2, by), R: hbV(cx + base * s / 2, by), T: hbV(cx, by - h * s) };
}

function initTwoCanvas() {
  const cv = hbEl('canvas-two');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const ids = ['c', 'ab', 'r', 'pq'];
  const sl = ids.map(k => hbEl('tw-' + k)), vl = ids.map(k => hbEl('tw-v' + k));
  const out = hbEl('tw-formula'), fb = hbEl('tw-feedback');
  const C0 = EK_TONE[9];

  function draw() {
    const W = cv.width;
    const c = hbClampSlider(sl[0], 40, 140), ab = hbClampSlider(sl[1], 3, 9);
    const r = hbClampSlider(sl[2], 40, 140), pq = hbClampSlider(sl[3], 3, 9);
    [c, ab, r, pq].forEach((v, i) => { vl[i].textContent = v; });
    const s = 18, BY = 296;
    const t1 = ekIsoApex(c, ab, 140, BY, s), t2 = ekIsoApex(r, pq, 400, BY, s);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '兩個不同的三角形，邊和角能互相比嗎？', C0);
    const base1 = (180 - c) / 2, base2 = (180 - r) / 2;
    const one = (t, apex, base, nm, col) => {
      const T = { A: t.L, B: t.R, C: t.T };
      const rr = ekR(T, 14, 24);
      hbAngle(ctx, T.C, T.A, T.B, rr, col, { alpha: 0.35 });
      hbAngle(ctx, T.A, T.B, T.C, rr, INK, { alpha: 0.12 });
      hbAngle(ctx, T.B, T.C, T.A, rr, INK, { alpha: 0.12 });
      ekTri(ctx, T, { names: nm, sides: [null, null, `${base}`], sideColor: [INK, INK, col], sideOff: 20 });
      ekTick(ctx, T.B, T.C, 1, INK);
      ekTick(ctx, T.C, T.A, 1, INK);
    };
    one(t1, c, ab, ['A', 'B', 'C'], HB_ROSE);
    one(t2, r, pq, ['P', 'Q', 'R'], HB_SKY);
    const rs = ekCmp(ab, pq), ra = ekCmp(c, r);
    ekLine(ctx, `AB = ${ab} ${rs} PQ = ${pq}　　∠C = ${c}° ${ra} ∠R = ${r}°`, 350, HB_IVORY, 16);
    const agree = (rs === ra);
    ekLine(ctx, agree ? '這一次邊和角的大小方向一樣——只是剛好' : '邊大的那一個，角反而不大：跨三角形比不出結論', 378, agree ? HB_GOLD : EK_NO, 15.5);
    const in1 = ekCmp(c, base1), in2 = ekCmp(r, base2);
    const side1 = in1 === '>' ? 'AB > BC' : (in1 === '<' ? 'AB < BC' : 'AB = BC');
    const side2 = in2 === '>' ? 'PQ > QR' : (in2 === '<' ? 'PQ < QR' : 'PQ = QR');
    ekLine(ctx, `同一個三角形裡：∠C ${in1} ∠A ⇒ ${side1}；∠R ${in2} ∠P ⇒ ${side2}`, 414, HB_MOSS, 14.5);
    ekLine(ctx, '（兩個三角形都是等腰：∠A、∠B 一樣大，∠P、∠Q 一樣大）', 444, MUTED, 13);

    const lt = { '>': '\\gt', '<': '\\lt', '=': '=' };
    out.innerHTML = `\\(\\overline{AB} ${lt[rs]} \\overline{PQ}\\)，<wbr>\\(\\angle C ${lt[ra]} \\angle R\\)`;
    fb.innerHTML = wrapFeedback(agree
      ? '方向一樣只是這組數字碰巧。把 \\(\\angle C\\) 或 \\(\\angle R\\) 調一調，很快就會出現「邊大、角反而小」的情形。'
      : '△\\(ABC\\) 和 △\\(PQR\\) 的大小不同，<strong>大邊對大角只能在同一個三角形裡用</strong>；不同三角形的邊和角沒有這種關係。');
    typeset([out, fb]);
  }

  sl.forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 11：由邊的大小順序，求角的範圍
   已知 AB > BC > AC ⇒ ∠C > ∠A > ∠B
   模式 max：已知最大角 ∠C，求最小角 ∠B 的範圍
   模式 min：已知最小角 ∠B，求最大角 ∠C 的範圍
   ========================================================================== */
function ekNumTxt(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function initRngCanvas() {
  const cv = hbEl('canvas-rng');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sg = hbEl('rn-g'), stt = hbEl('rn-t'), vg = hbEl('rn-vg'), vt = hbEl('rn-vt');
  const lg = hbEl('rn-lg'), lt = hbEl('rn-lt');
  const g = hbEl('rn-mode-group');
  const out = hbEl('rn-formula'), fb = hbEl('rn-feedback');
  const C0 = EK_TONE[10];
  let mode = 'max';

  function draw() {
    const W = cv.width;
    let C, B, lo, hi, given, test;
    if (mode === 'max') {
      C = hbClampSlider(sg, 65, 175);
      B = hbClampSlider(stt, 5, 85);
      lo = Math.max(0, 180 - 2 * C); hi = (180 - C) / 2;
      given = C; test = B;
      lg.textContent = '∠C（最大角）'; lt.textContent = '試試 ∠B';
    } else {
      B = hbClampSlider(sg, 5, 55);
      C = hbClampSlider(stt, 65, 175);
      lo = (180 - B) / 2; hi = 180 - 2 * B;
      given = B; test = C;
      lg.textContent = '∠B（最小角）'; lt.textContent = '試試 ∠C';
    }
    vg.textContent = given; vt.textContent = test;
    const A = 180 - B - C;
    const ok = A > 0 && C > A && A > B;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '已知 AB > BC > AC，所以 ∠C > ∠A > ∠B', C0);
    if (A > 0) {
      const T = hbTriangle(A, B, { x: 90, y: 72, w: 360, h: 156 });
      const deg = [A, B, C];
      const rk = ekRank(deg, (i, j) => deg[i] === deg[j]);
      const verts = [T.A, T.B, T.C];
      const r = ekR(T, 14, 26);
      verts.forEach((V, i) => hbAngle(ctx, V, verts[(i + 1) % 3], verts[(i + 2) % 3], r, rk.color[i], { alpha: 0.3, label: `${deg[i]}°`, lr: r + 18, font: f(800, 13.5) }));
      ekTri(ctx, T, { sideColor: rk.color });
    } else {
      textCenter(ctx, `∠A = 180° − ${B}° − ${C}° = ${A}°：根本沒有這個三角形`, W / 2, 140, EK_NO, f(800, 15));
    }
    // 數線：角度
    const NY = 300;
    const nmin = mode === 'max' ? 0 : 60, nmax = mode === 'max' ? 90 : 180;
    const NL = numLine(ctx, { x0: 50, x1: 490, y: NY, min: nmin, max: nmax, tick: 5, labelEvery: mode === 'max' ? 10 : 20, font: f(700, 12) });
    const xa = NL.px(Math.max(lo, nmin)), xb = NL.px(hi);
    numLineSeg(ctx, NY, xa, xb, HB_GOLD, 'fold');
    numLineEnd(ctx, xa, NY, false, HB_GOLD);
    numLineEnd(ctx, xb, NY, false, HB_GOLD);
    ctx.save();
    ctx.fillStyle = ok ? EK_OK : EK_NO;
    const mx = NL.px(test);
    ctx.beginPath();
    ctx.moveTo(mx, NY - 6);
    ctx.lineTo(mx - 7, NY - 20);
    ctx.lineTo(mx + 7, NY - 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    textLeft(ctx, mode === 'max' ? '∠B（度）' : '∠C（度）', 6, NY - 40, MUTED, f(700, 12));

    let l1, l2, l3;
    if (mode === 'max') {
      l1 = `∠A + ∠B = 180° − ${C}° = ${180 - C}°，且 ∠A > ∠B ⇒ ∠B < ${ekNumTxt(hi)}°`;
      l2 = 180 - 2 * C > 0
        ? `∠C > ∠A = ${180 - C}° − ∠B ⇒ ∠B > ${180 - 2 * C}°`
        : `∠C = ${C}° ≥ 90°，∠A 一定比 ∠C 小，只剩 ∠B > 0°`;
      l3 = `${ekNumTxt(lo)}° < ∠B < ${ekNumTxt(hi)}°`;
    } else {
      l1 = `∠A + ∠C = 180° − ${B}° = ${180 - B}°，且 ∠C > ∠A ⇒ ∠C > ${ekNumTxt(lo)}°`;
      l2 = `∠A = ${180 - B}° − ∠C > ∠B = ${B}° ⇒ ∠C < ${hi}°`;
      l3 = `${ekNumTxt(lo)}° < ∠C < ${hi}°`;
    }
    ekLine(ctx, l1, 356, HB_IVORY, 14.5);
    ekLine(ctx, l2, 384, HB_IVORY, 14.5);
    ekLine(ctx, '範圍：' + l3, 414, HB_GOLD, 17);
    const why = A <= 0 ? '三個角加起來超過 180°' : (ok ? '三個角的順序是 ∠C > ∠A > ∠B，符合' : `∠A = ${A}°，順序變成 ${ekChain(ekRank([A, B, C], (i, j) => [A, B, C][i] === [A, B, C][j]).groups, ['∠A', '∠B', '∠C'])}，不符合`);
    ekLine(ctx, `試的 ${mode === 'max' ? '∠B' : '∠C'} = ${test}°：${why}`, 446, ok ? EK_OK : EK_NO, 14.5);

    const tl = l3.replace(/°/g, '^\\circ').replace(/∠/g, '\\angle ').replace(/</g, '\\lt');
    out.innerHTML = `\\(${tl}\\)`;
    fb.innerHTML = wrapFeedback(mode === 'max'
      ? '已知最大角，另外兩角的和就固定了。「\\(\\angle A \\gt \\angle B\\)」給上限：\\(\\angle B\\) 不到一半；「\\(\\angle C \\gt \\angle A\\)」給下限。'
      : '已知最小角，另外兩角的和就固定了。「\\(\\angle C \\gt \\angle A\\)」給下限：\\(\\angle C\\) 超過一半；「\\(\\angle A \\gt \\angle B\\)」給上限。');
    typeset([out, fb]);
  }

  [sg, stt].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-rn-mode', v => {
    mode = v;
    // 切模式時把兩支滑桿放回該模式的中間
    if (mode === 'max') { sg.min = 65; sg.max = 175; sg.value = 100; stt.min = 5; stt.max = 85; stt.value = 30; }
    else { sg.min = 5; sg.max = 55; sg.value = 30; stt.min = 65; stt.max = 175; stt.value = 100; }
    draw();
  });
  draw();
}

/* ==========================================================================
   重點 12：直角三角形的判別——最長邊的平方等於另兩邊的平方和
   a = BC（∠A 的對邊）、b = CA、c = AB
   ========================================================================== */
function initRightCanvas() {
  const cv = hbEl('canvas-right');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sl = ['rt-a', 'rt-b', 'rt-c'].map(hbEl), vl = ['rt-va', 'rt-vb', 'rt-vc'].map(hbEl);
  const out = hbEl('rt-formula'), fb = hbEl('rt-feedback');
  const C0 = EK_TONE[11];
  const NM = ['a', 'b', 'c'], VN = ['A', 'B', 'C'], SN = ['BC', 'CA', 'AB'];

  function draw() {
    const W = cv.width;
    const v = sl.map(s => hbClampSlider(s, 1, 20));
    v.forEach((x, i) => { vl[i].textContent = x; });
    let li = 0;
    for (let i = 1; i < 3; i++) if (v[i] > v[li]) li = i;
    const oth = [0, 1, 2].filter(i => i !== li);
    const tri = v[oth[0]] + v[oth[1]] > v[li];
    const s2 = v[oth[0]] * v[oth[0]] + v[oth[1]] * v[oth[1]], L2 = v[li] * v[li];
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '最長邊的平方，和另外兩邊的平方和比一比', C0);
    let mAng = null;
    if (tri) {
      // 用 SSS 作圖：B(0,0)、C(a,0)，A 由兩圓交點求出
      const B0 = hbV(0, 0), Cc0 = hbV(v[0], 0);
      const A0 = cgUpper(cgCC(B0, v[2], Cc0, v[1]));
      const fit = hbFit([A0, B0, Cc0], { x: 90, y: 74, w: 360, h: 216 });
      const T = { A: fit[0], B: fit[1], C: fit[2] };
      const verts = [T.A, T.B, T.C];
      const angs = verts.map((V, i) => hbAngleDeg(V, verts[(i + 1) % 3], verts[(i + 2) % 3]));
      mAng = angs[li];
      const right = (s2 === L2);
      const V = verts[li], P = verts[(li + 1) % 3], Q = verts[(li + 2) % 3];
      if (right) {
        const a0 = hbHead(V, P), b0 = hbHead(V, Q);
        const d = ((b0 - a0) % 360 + 360) % 360;
        hbSector(ctx, V, d > 180 ? b0 : a0, 90, 22, EK_OK, { right: true, alpha: 0.3 });
      } else {
        hbAngle(ctx, V, P, Q, 24, EK_NO, { alpha: 0.25 });
      }
      const cols = [INK, INK, INK];
      cols[li] = HB_GOLD;
      ekTri(ctx, T, { sides: v.map((x, i) => `${NM[i]} = ${x}`), sideColor: cols, sideOff: 22 });
    } else {
      textCenter(ctx, `${v[oth[0]]} + ${v[oth[1]]} ${v[oth[0]] + v[oth[1]] === v[li] ? '=' : '<'} ${v[li]}：連三角形都圍不起來`, W / 2, 160, EK_NO, f(800, 16));
    }
    ekLine(ctx, `最長邊 ${NM[li]} = ${v[li]}（${SN[li]}，對著 ∠${VN[li]}）`, 336, HB_IVORY, 15.5);
    const relS = s2 === L2 ? '=' : (s2 > L2 ? '>' : '<');
    ekLine(ctx, `${NM[oth[0]]}² + ${NM[oth[1]]}² = ${v[oth[0]] * v[oth[0]]} + ${v[oth[1]] * v[oth[1]]} = ${s2} ${relS} ${NM[li]}² = ${L2}`, 368, HB_GOLD, 16);
    let msg;
    if (!tri) msg = '不是三角形，就談不上直角三角形';
    else if (relS === '=') msg = `相等 ⇒ 直角三角形，∠${VN[li]} = 90°`;
    else msg = `不相等 ⇒ 不是直角三角形`;
    ekLine(ctx, msg, 402, tri && relS === '=' ? EK_OK : EK_NO, 17);
    if (tri) ekLine(ctx, `量一量：最大角 ∠${VN[li]} ≈ ${ekD1(mAng)}°`, 436, MUTED, 14.5);

    const tex = `${NM[oth[0]]}^2 + ${NM[oth[1]]}^2 = ${s2}`;
    out.innerHTML = wbrEq(tex) + `，<wbr>\\(${NM[li]}^2 = ${L2}\\)`;
    fb.innerHTML = wrapFeedback(!tri
      ? '先確定三條線段圍得起來（最長邊小於另兩邊的和），再談是不是直角三角形。'
      : (relS === '='
        ? `兩邊的平方和剛好等於最長邊的平方，這個三角形<strong>一定是直角三角形</strong>，直角是最長邊 \\(${NM[li]}\\) 對面的 \\(\\angle ${VN[li]}\\)。`
        : '只有「最長邊」的平方可能等於另外兩邊的平方和；最長邊的不相等，另外兩種組合更不可能相等。'));
    typeset([out, fb]);
  }

  sl.forEach(s => s.addEventListener('input', draw));
  draw();
}
