/* ==========================================================================
   4-3-2（第四冊 3-2）尺規作圖 — 互動 Canvas 與隨堂評量
   畫風：19 世紀手工上色銅版畫博物圖鑑風（小蜜、阿蜂），第 3 章五節共用。
   配色：象牙 CG_INK（已知圖形）、蜂蜜金 CG_HONEY（圓規畫的弧）、
   天藍 CG_SKY（直尺畫的線）、苔綠 CG_MOSS（作出的結果）、
   薰衣草 CG_LAV（菱形、箏形等輔助線）、玫瑰 CG_ROSE（作不出來、錯誤）。

   共用工具在 ../math-canvas.js（f／fi／drawTitle／drawPanel／fitLines／
   textCenter／textLeft／bindPickGroup／typeset／wrapFeedback／clamp…），
   本檔只放本節的色票、平面幾何小工具、尺規作圖的「逐步播放引擎」，
   以及 13 個互動。

   作圖結果一律用真正的作圖動作算出來（圓與圓的交點、直線與圓的交點），
   不直接用答案公式擺位置——畫面上量到的角度與長度才是作圖的結果。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initCmpCanvas();
  initCpyCanvas();
  initSumCanvas();
  initTriCanvas();
  initAngCanvas();
  initAsumCanvas();
  initPbCanvas();
  initHalfCanvas();
  initBisCanvas();
  initQbCanvas();
  initPonCanvas();
  initPoffCanvas();
  initAltCanvas();
});

/* ==========================================================================
   0. 本節調色盤（CG_ = Compass Geometry；共用檔沒有這個前綴）
   ========================================================================== */

const CG_INK = '#f5ecd7';
const CG_HONEY = '#fbbf24';
const CG_SKY = '#93c5fd';
const CG_MOSS = '#a3d977';
const CG_LAV = '#c4b5fd';
const CG_ROSE = '#fb7185';
const CG_BRASS = '#d4a017';
const CG_BRASS_DK = '#5b4208';

// 1 公分畫成 40px
const CG_PX = 40;

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const CG_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9', '#fca5a5', '#f0abfc'];

function elById(id) {
  return document.getElementById(id);
}

function iv(el) {
  return parseInt(el.value, 10);
}

// 公分（一位小數）
function cgCm(px) {
  return (px / CG_PX).toFixed(1);
}

// 角度：四捨五入到 0.01 度（33.75° 這種再平分的角要看得到兩位），尾巴的 0 不留
function cgDeg(v) {
  const r = Math.round(v * 100) / 100;
  return String(r);
}

/* ==========================================================================
   1. 平面幾何（canvas 座標，y 向下）
   ========================================================================== */

function cgP(x, y) { return { x, y }; }
function cgDist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function cgAng(c, p) { return Math.atan2(p.y - c.y, p.x - c.x); }
function cgPolar(c, r, ang) { return cgP(c.x + r * Math.cos(ang), c.y + r * Math.sin(ang)); }
function cgMid(a, b) { return cgP((a.x + b.x) / 2, (a.y + b.y) / 2); }
function cgRad(deg) { return deg * Math.PI / 180; }

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

// 直線 ab 與圓的交點（依沿 a→b 的方向排序）
function cgLC(a, b, c, r) {
  const d = cgDist(a, b);
  const ux = (b.x - a.x) / d, uy = (b.y - a.y) / d;
  const fx = a.x - c.x, fy = a.y - c.y;
  const B = fx * ux + fy * uy;
  const C = fx * fx + fy * fy - r * r;
  const disc = B * B - C;
  if (disc < -1e-6) return [];
  if (Math.abs(disc) <= 1e-6) return [cgP(a.x - B * ux, a.y - B * uy)];
  const s = Math.sqrt(disc);
  return [-B - s, -B + s].map(t => cgP(a.x + t * ux, a.y + t * uy));
}

// 兩直線 ab、cd 的交點
function cgLL(a, b, c, d) {
  const x1 = b.x - a.x, y1 = b.y - a.y, x2 = d.x - c.x, y2 = d.y - c.y;
  const den = x1 * y2 - y1 * x2;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * y2 - (c.y - a.y) * x2) / den;
  return cgP(a.x + t * x1, a.y + t * y1);
}

// 以 v 為頂點、兩邊通過 p、q 的角（度）
function cgAngDeg(v, p, q) {
  const ax = p.x - v.x, ay = p.y - v.y, bx = q.x - v.x, by = q.y - v.y;
  const c = (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by));
  return Math.acos(clamp(c, -1, 1)) * 180 / Math.PI;
}

// 點 p 在直線 ab 的哪一側（正負號）
function cgSide(a, b, p) {
  return Math.sign((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x));
}

function cgUpper(pts) { return pts.slice().sort((u, v) => u.y - v.y)[0]; }
function cgLower(pts) { return pts.slice().sort((u, v) => v.y - u.y)[0]; }

/* ==========================================================================
   2. 繪圖元件
   ========================================================================== */

function cgSeg(ctx, a, b, color, w, dash) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = w || 2.4;
  ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

// 通過 a、b 的直線，兩端各多畫 ext px
function cgLine(ctx, a, b, color, ext, w, dash) {
  const d = cgDist(a, b);
  const ux = (b.x - a.x) / d, uy = (b.y - a.y) / d;
  const e = ext == null ? 40 : ext;
  cgSeg(ctx, cgP(a.x - ux * e, a.y - uy * e), cgP(b.x + ux * e, b.y + uy * e), color, w, dash);
}

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

// 圍繞某個方向的弧
function cgArcDir(ctx, c, r, ang, spread, color, w) {
  cgArc(ctx, c, r, ang - spread, ang + spread, color, w);
}

function cgDot(ctx, p, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
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

// 角的記號：從方向 a0 轉到 a1（走較短的那一邊）
function cgAngMark(ctx, v, a0, a1, r, color, w) {
  let d = a1 - a0;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  // 平角：一律畫在上方（canvas 的負角度）
  if (Math.abs(Math.abs(d) - Math.PI) < 1e-6) d = -Math.PI;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = w || 2;
  ctx.beginPath();
  ctx.arc(v.x, v.y, r, a0, a0 + d, d < 0);
  ctx.stroke();
  ctx.restore();
}

// 直角記號：u、w 是兩條線的單位方向
function cgRight(ctx, v, u, w, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(v.x + u.x * s, v.y + u.y * s);
  ctx.lineTo(v.x + u.x * s + w.x * s, v.y + u.y * s + w.y * s);
  ctx.lineTo(v.x + w.x * s, v.y + w.y * s);
  ctx.stroke();
  ctx.restore();
}

function cgUnit(a, b) {
  const d = cgDist(a, b);
  return cgP((b.x - a.x) / d, (b.y - a.y) / d);
}

// 一段長度的小括線（畫在線段旁邊 off px，標上名字）
function cgSpan(ctx, a, b, off, color, text) {
  const u = cgUnit(a, b);
  const n = cgP(-u.y, u.x);
  const p = cgP(a.x + n.x * off, a.y + n.y * off), q = cgP(b.x + n.x * off, b.y + n.y * off);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(a.x + n.x * off * 0.45, a.y + n.y * off * 0.45);
  ctx.lineTo(p.x, p.y);
  ctx.lineTo(q.x, q.y);
  ctx.lineTo(b.x + n.x * off * 0.45, b.y + n.y * off * 0.45);
  ctx.stroke();
  ctx.restore();
  const m = cgMid(p, q);
  const sg = off < 0 ? -1 : 1;
  cgLabel(ctx, m, text, color, n.x * 12 * sg, n.y * 12 * sg, fi(700, 16));
}

/* --------------------------------------------------------------------------
   圓規：針腳在圓心 c，筆尖在 c 往 ang 方向 r 的位置。
   兩腳一樣長、在鉸鏈處相接，張開的大小（針腳到筆尖）就是半徑——
   畫面上的圓規真的畫得出那段弧（開發約束 28）。
   -------------------------------------------------------------------------- */
function cgCompass(ctx, c, r, ang, label) {
  const t = cgPolar(c, r, ang);
  const m = cgMid(c, t);
  let nx = -(t.y - c.y) / r, ny = (t.x - c.x) / r;
  if (ny > 0 || (Math.abs(ny) < 1e-6 && nx < 0)) { nx = -nx; ny = -ny; }
  const L = Math.max(96, r / 2 + 36);
  const h = Math.sqrt(L * L - r * r / 4);
  const hinge = cgP(m.x + nx * h, m.y + ny * h);

  ctx.save();
  // 半徑（針腳到筆尖的距離）
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = CG_HONEY;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(c.x, c.y);
  ctx.lineTo(t.x, t.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.lineCap = 'round';

  [[c, 'needle'], [t, 'pencil']].forEach(([tip, kind]) => {
    const dd = cgDist(hinge, tip);
    const ux = (tip.x - hinge.x) / dd, uy = (tip.y - hinge.y) / dd;
    const end = cgP(tip.x - ux * 13, tip.y - uy * 13);
    ctx.strokeStyle = CG_BRASS_DK;
    ctx.lineWidth = 7.5;
    ctx.beginPath(); ctx.moveTo(hinge.x, hinge.y); ctx.lineTo(end.x, end.y); ctx.stroke();
    ctx.strokeStyle = CG_BRASS;
    ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.moveTo(hinge.x, hinge.y); ctx.lineTo(end.x, end.y); ctx.stroke();
    if (kind === 'needle') {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(end.x, end.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    } else {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(end.x, end.y); ctx.lineTo(tip.x - ux * 4, tip.y - uy * 4); ctx.stroke();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tip.x - ux * 4, tip.y - uy * 4); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    }
  });

  // 握柄與鉸鏈
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(hinge.x, hinge.y);
  ctx.lineTo(hinge.x + nx * 18, hinge.y + ny * 18);
  ctx.stroke();
  ctx.fillStyle = CG_BRASS;
  ctx.strokeStyle = CG_BRASS_DK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(hinge.x, hinge.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (label) cgLabel(ctx, m, label, CG_HONEY, -nx * 15, -ny * 15, f(700, 13));
}

/* --------------------------------------------------------------------------
   直尺：沒有刻度的木條，一邊貼著要畫的那條線
   -------------------------------------------------------------------------- */
function cgRuler(ctx, a, b) {
  const u = cgUnit(a, b);
  let nx = -u.y, ny = u.x;
  if (ny < 0 || (Math.abs(ny) < 1e-6 && nx < 0)) { nx = -nx; ny = -ny; }
  const ext = 26, wd = 18, off = 5;
  const p0 = cgP(a.x - u.x * ext + nx * off, a.y - u.y * ext + ny * off);
  const p1 = cgP(b.x + u.x * ext + nx * off, b.y + u.y * ext + ny * off);
  ctx.save();
  ctx.fillStyle = 'rgba(234, 205, 140, 0.10)';
  ctx.strokeStyle = 'rgba(234, 205, 140, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p1.x + nx * wd, p1.y + ny * wd);
  ctx.lineTo(p0.x + nx * wd, p0.y + ny * wd);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  let ang = Math.atan2(u.y, u.x);
  if (ang > Math.PI / 2) ang -= Math.PI;
  if (ang < -Math.PI / 2) ang += Math.PI;
  const cx = (p0.x + p1.x) / 2 + nx * wd / 2, cy = (p0.y + p1.y) / 2 + ny * wd / 2;
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  ctx.fillStyle = 'rgba(254, 243, 199, 0.6)';
  ctx.font = f(600, 11);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('直尺（沒有刻度）', 0, 0);
  ctx.restore();
}

/* --------------------------------------------------------------------------
   畫布下方的步驟列：第幾步、用什麼工具、這一步在做什麼
   -------------------------------------------------------------------------- */
const CG_TOOL = {
  compass: ['圓規', CG_HONEY],
  ruler: ['直尺', CG_SKY],
  look: ['觀察', CG_MOSS],
  warn: ['注意', CG_ROSE]
};

function cgBand(ctx, k, n, tool, text) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const y = H - 84, h = 76;
  const [name, col] = CG_TOOL[tool];
  drawPanel(ctx, 12, y, W - 24, h, col, 0.1);
  textCenter(ctx, `步驟 ${k}/${n}`, 62, y + 22, '#f8fafc', f(800, 14));
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = col;
  roundRect(ctx, 30, y + 38, 64, 26, 8);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.6;
  roundRect(ctx, 30, y + 38, 64, 26, 8);
  ctx.stroke();
  ctx.restore();
  textCenter(ctx, name, 62, y + 51, col, f(800, 14));
  const lines = fitLines(ctx, text, W - 24 - 104 - 14, f(600, 15)).slice(0, 3);
  const lh = 20;
  const y0 = y + h / 2 - (lines.length - 1) * lh / 2;
  lines.forEach((ln, i) => textLeft(ctx, ln, 116, y0 + i * lh, '#f1f5f9', f(600, 15)));
}

// 步驟列上方的一行量測結果
function cgMeasure(ctx, text, color) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  textCenter(ctx, text, W / 2, H - 100, color, f(700, 15));
}

/* --------------------------------------------------------------------------
   逐步播放引擎
     o.steps: [{ tool, text, draw(ctx), compass: {c, r, ang, label}, ruler: [a, b] }]
     o.pts:   [{ p, n（名字）, s（第幾步出現；0 是已知）, c（顏色）, dx, dy }]
     o.k:     目前顯示到第幾步
   畫到第 k 步：已知圖形 → 前 k 步的痕跡（舊的淡一點）→ 點與名字 →
   這一步正在用的工具 → 量測結果 → 步驟列。
   -------------------------------------------------------------------------- */
function cgRender(ctx, o) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);
  drawTitle(ctx, o.title, o.color);
  const k = o.k;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 40, W, H - 152);
  ctx.clip();
  if (o.given) o.given(ctx);
  const cur = o.steps[k - 1];
  // 直尺墊在痕跡底下：它只是表示「這一步用直尺」，不能蓋住畫出來的線
  if (cur.ruler) cgRuler(ctx, cur.ruler[0], cur.ruler[1]);
  for (let i = 0; i < k; i++) {
    const s = o.steps[i];
    if (!s.draw) continue;
    ctx.save();
    ctx.globalAlpha = (i === k - 1) ? 1 : 0.78;
    s.draw(ctx);
    ctx.restore();
  }
  const pts = (o.pts || []).filter(q => q && q.s <= k);
  pts.forEach(q => cgDot(ctx, q.p, q.c || CG_INK));
  pts.forEach(q => { if (q.n) cgLabel(ctx, q.p, q.n, q.c || CG_INK, q.dx || 0, q.dy == null ? -18 : q.dy); });
  if (cur.compass) cgCompass(ctx, cur.compass.c, cur.compass.r, cur.compass.ang, cur.compass.label);
  ctx.restore();
  if (o.measure) cgMeasure(ctx, o.measure[0], o.measure[1]);
  cgBand(ctx, k, o.steps.length, cur.tool, cur.text);
}

/* --------------------------------------------------------------------------
   步驟按鈕：上一步／下一步／全部顯示
   -------------------------------------------------------------------------- */
function cgSteps(prefix, st, draw) {
  const prev = elById(prefix + '-prev'), next = elById(prefix + '-next'), all = elById(prefix + '-all');
  if (prev) prev.addEventListener('click', () => { st.k -= 1; draw(); });
  if (next) next.addEventListener('click', () => { st.k += 1; draw(); });
  if (all) all.addEventListener('click', () => { st.k = 99; draw(); });
}

function cgSync(prefix, st, n) {
  st.k = clamp(st.k, 1, n);
  const prev = elById(prefix + '-prev'), next = elById(prefix + '-next'), all = elById(prefix + '-all');
  const counter = elById(prefix + '-step');
  if (counter) counter.textContent = `${st.k} / ${n}`;
  if (prev) prev.disabled = (st.k <= 1);
  if (next) next.disabled = (st.k >= n);
  if (all) all.disabled = (st.k >= n);
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第四冊 3-2 的 26 題正解
  // 正解字母分布：A 7 題、B 7 題、C 6 題、D 6 題（開發約束 36）
  const answers = {
    '3-2-1': 'B',    // 圓規可以搬長度
    '3-2-2': 'A',    // OP = MN
    '3-2-3': 'C',    // 半徑是 AB 的長
    '3-2-4': 'D',    // 交於 2 點，取哪一個都可以
    '3-2-5': 'B',    // 2a − b = 10
    '3-2-6': 'C',    // N 在 Q 左側、落在 MQ 上
    '3-2-7': 'D',    // 等腰，AB = AC = 2BC
    '3-2-8': 'A',    // 7 + 9 < 18，0 個交點
    '3-2-9': 'D',    // 適當長改變，角不變
    '3-2-10': 'C',   // 半徑 3 改 4 → 角變小
    '3-2-11': 'B',   // 112 − 47 = 65
    '3-2-12': 'C',   // 180 − (A + B) = C
    '3-2-13': 'D',   // 9 公分、9 公分
    '3-2-14': 'A',   // 菱形周長 20
    '3-2-15': 'A',   // AR = 55
    '3-2-16': 'C',   // 1/16 → 4 次
    '3-2-17': 'D',   // PA = QA 不一定
    '3-2-18': 'A',   // 菱形
    '3-2-19': 'C',   // 45° 是 135° 的 1/3
    '3-2-20': 'A',   // 156 ÷ 2 = 78
    '3-2-21': 'B',   // 步驟二半徑不同
    '3-2-22': 'B',   // 垂線 + 平分 ∠QBA
    '3-2-23': 'A',   // PQ = 10
    '3-2-24': 'B',   // 9 > 7
    '3-2-25': 'B',   // 先延長 AB
    '3-2-26': 'D'    // ∠B 的角平分線
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
   重點 1：圓規比長短——以 C 為圓心、AB 長為半徑畫弧，看弧落在哪裡
   ========================================================================== */
function initCmpCanvas() {
  const cv = elById('canvas-cmp');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sl = elById('cmp-cd'), vl = elById('cmp-vcd');
  const out = elById('cmp-formula'), fb = elById('cmp-feedback');
  const st = { k: 1 };
  const AB = 4.5 * CG_PX;

  function draw() {
    const cd = iv(sl) / 2;
    vl.textContent = cd.toFixed(1);
    const L = cd * CG_PX;
    const A = cgP(80, 150), B = cgP(80 + AB, 150);
    const dir = cgRad(-10);
    const C = cgP(80, 320), D = cgPolar(C, L, dir);
    // 弧與射線 CD 的交點：以 C 為圓心、AB 為半徑的圓與直線 CD 的交點中，在 D 那一側的那一個
    const E = cgLC(C, D, C, AB).filter(p => (p.x - C.x) * (D.x - C.x) + (p.y - C.y) * (D.y - C.y) > 0)[0];
    const cmp = Math.abs(L - AB) < 1e-6 ? 0 : (L > AB ? 1 : -1);

    const lookText = cmp > 0 ? '弧與 CD 交於 E，E 落在 C、D 之間：AB 比 CD 短。'
      : (cmp === 0 ? '弧剛好通過 D：AB 和 CD 一樣長。'
        : '弧落在 D 的外側（CD 的延長線上）：AB 比 CD 長。');
    const steps = [
      { tool: 'compass', text: '把圓規的針腳放在 A、筆尖放在 B：圓規張開的大小就是 AB 的長。',
        compass: { c: A, r: AB, ang: 0, label: 'AB 的長' } },
      { tool: 'compass', text: '圓規張開的大小不變，把針腳移到 C，朝 CD 的方向畫一段弧。',
        compass: { c: C, r: AB, ang: dir, label: 'AB 的長' },
        draw: c => cgArcAt(c, C, AB, [E], 0.32, CG_HONEY) },
      { tool: 'look', text: lookText,
        draw: c => { if (cmp < 0) cgSeg(c, D, E, CG_ROSE, 1.8, [6, 5]); } }
    ];
    cgSync('cmp', st, steps.length);

    cgRender(ctx, {
      title: '不看刻度，用圓規比較 AB 與 CD', color: CG_TONE[0], k: st.k, steps,
      given: c => { cgSeg(c, A, B, CG_INK, 3); cgSeg(c, C, D, CG_INK, 3); },
      pts: [
        { p: A, n: 'A', s: 0, dx: -16, dy: 0 }, { p: B, n: 'B', s: 0, dx: 16, dy: 0 },
        { p: C, n: 'C', s: 0, dx: -16, dy: 0 }, { p: D, n: 'D', s: 0, dx: 4, dy: 22 },
        cmp !== 0 ? { p: E, n: 'E', s: 3, c: cmp > 0 ? CG_MOSS : CG_ROSE, dx: 0, dy: -20 } : null
      ],
      measure: st.k === 3 ? [`量一量：AB = 4.5 公分，CD = ${cd.toFixed(1)} 公分`, CG_MOSS] : null
    });

    const rel = cmp > 0 ? '\\lt' : (cmp === 0 ? '=' : '\\gt');
    out.innerHTML = `\\(\\overline{AB} = 4.5\\) 公分，<wbr>\\(\\overline{CD} = ${cd.toFixed(1)}\\) 公分，<wbr>\\(\\overline{AB} ${rel} \\overline{CD}\\)`;
    fb.innerHTML = wrapFeedback(cmp > 0
      ? '弧上每一點到 \\(C\\) 都是 \\(\\overline{AB}\\) 那麼遠。弧還沒到 \\(D\\) 就碰到 \\(\\overline{CD}\\)，表示 \\(\\overline{CD}\\) 比較長。'
      : (cmp === 0
        ? '弧剛好通過 \\(D\\)：\\(D\\) 到 \\(C\\) 的距離也等於 \\(\\overline{AB}\\)，兩段一樣長。'
        : '弧要越過 \\(D\\) 才碰得到直線 \\(CD\\)，表示 \\(\\overline{AB}\\) 比較長。'));
    typeset([out, fb]);
  }

  cgSteps('cmp', st, draw);
  sl.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 2：等線段作圖
   ========================================================================== */
function initCpyCanvas() {
  const cv = elById('canvas-cpy');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sLen = elById('cpy-len'), sTilt = elById('cpy-tilt');
  const vLen = elById('cpy-vlen'), vTilt = elById('cpy-vtilt');
  const out = elById('cpy-formula'), fb = elById('cpy-feedback');
  const st = { k: 1 };

  function draw() {
    const len = iv(sLen) / 2, tilt = iv(sTilt) * 10;
    vLen.textContent = len.toFixed(1);
    vTilt.textContent = tilt;
    const r = len * CG_PX;
    const A = cgP(90, 200), B = cgPolar(A, r, cgRad(-tilt));
    const C = cgP(120, 330), Lr = cgP(500, 330);
    // 以 C 為圓心、AB 為半徑的圓與直線 L 的交點，取 C 右側那一個
    const D = cgLC(C, Lr, C, r).filter(p => p.x > C.x)[0];
    const CD = cgDist(C, D), ABm = cgDist(A, B);

    const steps = [
      { tool: 'ruler', text: '畫一直線 L，並在 L 上取一點 C。',
        ruler: [cgP(40, 330), Lr], draw: c => cgSeg(c, cgP(30, 330), cgP(510, 330), CG_SKY, 2) },
      { tool: 'compass', text: '圓規量取 AB 的長：針腳放在 A、筆尖放在 B。',
        compass: { c: A, r, ang: cgRad(-tilt), label: 'AB 的長' } },
      { tool: 'compass', text: '張開的大小不變，以 C 為圓心、AB 長為半徑畫弧，交 L 於 D 點。',
        compass: { c: C, r, ang: 0, label: 'AB 的長' },
        draw: c => cgArcDir(c, C, r, 0, 0.3, CG_HONEY) },
      { tool: 'look', text: 'CD 即為所求：CD 和 AB 一樣長。',
        draw: c => cgSeg(c, C, D, CG_MOSS, 4.5) }
    ];
    cgSync('cpy', st, steps.length);

    cgRender(ctx, {
      title: '已知 AB，在直線 L 上作 CD = AB', color: CG_TONE[1], k: st.k, steps,
      given: c => cgSeg(c, A, B, CG_INK, 3),
      pts: [
        { p: A, n: 'A', s: 0, dx: -16, dy: 4 }, { p: B, n: 'B', s: 0, dx: 14, dy: -10 },
        { p: C, n: 'C', s: 1, c: CG_SKY, dx: 0, dy: 20 },
        { p: D, n: 'D', s: 3, c: CG_MOSS, dx: 0, dy: 20 }
      ],
      measure: st.k === 4 ? [`量一量：CD = ${cgCm(CD)} 公分，AB = ${cgCm(ABm)} 公分`, CG_MOSS] : null
    });
    textLeft(ctx, 'L', 500, 312, CG_SKY, fi(700, 18));

    out.innerHTML = `\\(\\overline{CD} = \\overline{AB} = ${cgCm(CD)}\\) 公分`;
    fb.innerHTML = wrapFeedback(st.k < 4
      ? '圓規先在 \\(\\overline{AB}\\) 上張開，再整支搬到 \\(C\\)，中途不改變張開的大小。'
      : '不論 \\(\\overline{AB}\\) 怎麼傾斜，圓規搬過去的都是同一段長：\\(\\overline{CD} = \\overline{AB}\\)。整個過程沒有讀任何刻度。');
    typeset([out, fb]);
  }

  cgSteps('cpy', st, draw);
  [sLen, sTilt].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 3：線段的和與差
   ========================================================================== */
function initSumCanvas() {
  const cv = elById('canvas-sum');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('sum-a'), sb = elById('sum-b');
  const va = elById('sum-va'), vb = elById('sum-vb');
  const g = elById('sum-mode-group');
  const out = elById('sum-formula'), fb = elById('sum-feedback');
  const st = { k: 1 };
  let mode = 'add';

  function draw() {
    const a = iv(sa) / 2, b = iv(sb) / 2;
    va.textContent = a.toFixed(1);
    vb.textContent = b.toFixed(1);
    const ra = a * CG_PX, rb = b * CG_PX;
    const Y = 300;
    const A = cgP(70, Y), Lr = cgP(510, Y);
    const P = cgLC(A, Lr, A, ra).filter(p => p.x > A.x)[0];
    const add = (mode === 'add');
    const ok = add || a > b;
    // 第二個弧與 L 的兩個交點：和取 P 的右側，差取 P 的左側
    const Bs = cgLC(A, Lr, P, rb);
    const B = add ? Bs.filter(p => p.x > P.x)[0] : Bs.filter(p => p.x < P.x)[0];
    const AB = cgDist(A, B);

    // 已知的兩段長
    const a0 = cgP(70, 96), a1 = cgP(70 + ra, 96), b0 = cgP(70, 150), b1 = cgP(70 + rb, 150);

    const steps = [
      { tool: 'ruler', text: '畫一直線 L，並在 L 上取一點 A。',
        ruler: [cgP(40, Y), Lr], draw: c => cgSeg(c, cgP(30, Y), cgP(510, Y), CG_SKY, 2) },
      { tool: 'compass', text: '以 A 為圓心、a 為半徑畫弧，在 A 點右側交 L 於 P 點。',
        compass: { c: A, r: ra, ang: 0, label: 'a' },
        draw: c => { cgArcDir(c, A, ra, 0, 0.28, CG_HONEY); cgSpan(c, A, P, -16, CG_HONEY, 'a'); } }
    ];
    if (!ok) {
      steps.push({ tool: 'warn',
        text: a === b ? 'a 和 b 一樣長：往回切 b 會剛好回到 A，a − b 是 0，作不出線段。把 a 調得比 b 長。'
          : 'a 比 b 短：往回切 b 會越過 A，作不出 a − b。把 a 調得比 b 長再試一次。' });
    } else {
      steps.push({ tool: 'compass',
        text: add ? '以 P 為圓心、b 為半徑畫弧，在 P 點右側（往外接）交 L 於 B 點。'
          : '以 P 為圓心、b 為半徑畫弧，在 P 點左側（往回切）交 AP 於 B 點。',
        compass: { c: P, r: rb, ang: add ? 0 : Math.PI, label: 'b' },
        draw: c => { cgArcDir(c, P, rb, add ? 0 : Math.PI, 0.28, CG_HONEY); cgSpan(c, P, B, add ? 16 : -16, CG_SKY, 'b'); } });
      steps.push({ tool: 'look', text: add ? 'AB 即為所求：AB = a + b。' : 'AB 即為所求：AB = a − b。',
        draw: c => cgSeg(c, A, B, CG_MOSS, 5) });
    }
    cgSync('sum', st, steps.length);

    cgRender(ctx, {
      title: add ? '已知 a、b，作 AB = a + b' : '已知 a、b，作 AB = a − b', color: CG_TONE[2], k: st.k, steps,
      given: c => {
        cgSeg(c, a0, a1, CG_HONEY, 3); cgSeg(c, b0, b1, CG_SKY, 3);
        cgLabel(c, a0, 'a', CG_HONEY, -18, 0); cgLabel(c, b0, 'b', CG_SKY, -18, 0);
      },
      pts: [
        { p: A, n: 'A', s: 1, c: CG_SKY, dx: 0, dy: 22 },
        { p: P, n: 'P', s: 2, c: CG_HONEY, dx: 0, dy: add ? 22 : -36 },
        ok ? { p: B, n: 'B', s: 3, c: CG_MOSS, dx: 0, dy: add ? 22 : 46 } : null
      ],
      measure: (ok && st.k === 4) ? [`量一量：AB = ${cgCm(AB)} 公分（a = ${a.toFixed(1)}，b = ${b.toFixed(1)}）`, CG_MOSS] : null
    });
    textLeft(ctx, 'L', 500, Y - 18, CG_SKY, fi(700, 18));

    if (ok) {
      out.innerHTML = `\\(\\overline{AB} = a ${add ? '+' : '-'} b\\)<wbr>\\({}= ${a.toFixed(1)} ${add ? '+' : '-'} ${b.toFixed(1)}\\)<wbr>\\({}= ${cgCm(AB)}\\) 公分`;
      fb.innerHTML = wrapFeedback(add
        ? '第二個弧畫在 \\(P\\) 的右側，接在 \\(\\overline{AP}\\) 的外面，兩段長度相加。'
        : '第二個弧畫在 \\(P\\) 的左側，往回切進 \\(\\overline{AP}\\)，從 \\(a\\) 扣掉 \\(b\\)。');
    } else {
      out.innerHTML = `\\(a = ${a.toFixed(1)}\\)，<wbr>\\(b = ${b.toFixed(1)}\\)，<wbr>作不出 \\(a - b\\)`;
      fb.innerHTML = wrapFeedback(`目前 \\(a = ${a.toFixed(1)}\\)、\\(b = ${b.toFixed(1)}\\)，\\(a\\) 沒有比 \\(b\\) 長，作不出 \\(a - b\\) 的線段。把 \\(a\\) 調長，或把 \\(b\\) 調短。`);
    }
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-sum-mode', v => { mode = v; draw(); });
  cgSteps('sum', st, draw);
  [sa, sb].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 4：兩弧的交點——已知三邊作三角形
   ========================================================================== */
function initTriCanvas() {
  const cv = elById('canvas-tri');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('tri-a'), sb = elById('tri-b'), sc = elById('tri-c');
  const va = elById('tri-va'), vb = elById('tri-vb'), vc = elById('tri-vc');
  const rowB = elById('tri-row-b'), rowC = elById('tri-row-c');
  const g = elById('tri-mode-group');
  const out = elById('tri-formula'), fb = elById('tri-feedback');
  const st = { k: 1 };
  let mode = 'sss';

  function draw() {
    const equi = (mode === 'equi');
    rowB.style.display = equi ? 'none' : '';
    rowC.style.display = equi ? 'none' : '';
    const a = iv(sa) / 2;
    const b = equi ? a : iv(sb) / 2, c = equi ? a : iv(sc) / 2;
    va.textContent = a.toFixed(1);
    vb.textContent = (iv(sb) / 2).toFixed(1);
    vc.textContent = (iv(sc) / 2).toFixed(1);
    const ra = a * CG_PX, rb = b * CG_PX, rc = c * CG_PX;
    const Y = 330;
    const B = cgP(270 - ra / 2, Y);
    const C = cgLC(B, cgP(B.x + 10, Y), B, ra).filter(p => p.x > B.x)[0];
    const xs = cgCC(B, rc, C, rb);
    const A = xs.length === 2 ? cgUpper(xs) : null;
    const nameB = equi ? 'a' : 'c', nameC = equi ? 'a' : 'b';
    const upArc = (ctx2, cen, r) => cgArc(ctx2, cen, r, Math.PI + 0.12, 2 * Math.PI - 0.12, CG_HONEY);

    const steps = [
      { tool: 'compass', text: '畫一直線，取一點 B；以 B 為圓心、a 為半徑畫弧交直線於 C：BC = a。',
        compass: { c: B, r: ra, ang: 0, label: 'a' },
        draw: g2 => { cgSeg(g2, cgP(B.x - 30, Y), cgP(C.x + 30, Y), CG_SKY, 1.6); cgArcDir(g2, B, ra, 0, 0.22, CG_HONEY); cgSeg(g2, B, C, CG_INK, 3); } },
      { tool: 'compass', text: `以 B 為圓心、${nameB} 為半徑，在 BC 上方畫弧。`,
        compass: { c: B, r: rc, ang: A ? cgAng(B, A) : -Math.PI / 3, label: nameB },
        draw: g2 => (A ? cgArcAt(g2, B, rc, [A], 0.42, CG_HONEY) : upArc(g2, B, rc)) },
      { tool: 'compass', text: `以 C 為圓心、${nameC} 為半徑，在 BC 上方畫弧。`,
        compass: { c: C, r: rb, ang: A ? cgAng(C, A) : -2 * Math.PI / 3, label: nameC },
        draw: g2 => (A ? cgArcAt(g2, C, rb, [A], 0.42, CG_HONEY) : upArc(g2, C, rb)) }
    ];
    let why = '';
    if (A) {
      steps.push({ tool: 'ruler', text: '兩弧交於 A，連接 AB、AC，△ABC 即為所求。', ruler: [B, A],
        draw: g2 => {
          cgSeg(g2, A, B, CG_MOSS, 3.5); cgSeg(g2, A, C, CG_MOSS, 3.5);
          // 邊長標在三角形外側（開發約束 18）
          const G = cgP((A.x + B.x + C.x) / 3, (A.y + B.y + C.y) / 3);
          [[A, B], [A, C]].forEach(([p, q]) => {
            const m = cgMid(p, q), u = cgUnit(p, q);
            let n = cgP(-u.y, u.x);
            if ((m.x - G.x) * n.x + (m.y - G.y) * n.y < 0) n = cgP(-n.x, -n.y);
            cgLabel(g2, m, cgCm(cgDist(p, q)), CG_MOSS, n.x * 24, n.y * 24, f(700, 14));
          });
        } });
    } else {
      if (rb + rc <= ra + 1e-6) {
        why = (Math.abs(rb + rc - ra) < 1e-6)
          ? '兩個半徑合起來剛好等於 BC：兩弧只碰在直線 BC 上一點，A 落在 BC 上，圍不成三角形。'
          : '兩個半徑合起來比 BC 短：兩弧碰不到，沒有交點，作不出三角形。';
      } else {
        why = (Math.abs(Math.abs(rb - rc) - ra) < 1e-6)
          ? '一個半徑比另一個長出剛好 BC：兩弧只碰在直線 BC 上一點，圍不成三角形。'
          : '一個半徑比另一個長太多：大的弧把小的整個包住，兩弧碰不到，作不出三角形。';
      }
      steps.push({ tool: 'warn', text: why + '把 b、c 調整一下再試。' });
    }
    cgSync('tri', st, steps.length);

    cgRender(ctx, {
      title: equi ? '已知 a，作正三角形 ABC' : '已知三邊 a、b、c，作 △ABC', color: CG_TONE[3], k: st.k, steps,
      pts: [
        { p: B, n: 'B', s: 1, dx: -10, dy: 22 }, { p: C, n: 'C', s: 1, dx: 10, dy: 22 },
        A ? { p: A, n: 'A', s: 4, c: CG_MOSS, dx: 0, dy: -20 } : null
      ],
      measure: (A && st.k === 4) ? [`量一量：BC = ${cgCm(cgDist(B, C))}，AC = ${cgCm(cgDist(A, C))}，AB = ${cgCm(cgDist(A, B))} 公分`, CG_MOSS] : null
    });

    if (A) {
      out.innerHTML = `\\(\\overline{BC} = ${cgCm(cgDist(B, C))}\\)，<wbr>\\(\\overline{AC} = ${cgCm(cgDist(A, C))}\\)，<wbr>\\(\\overline{AB} = ${cgCm(cgDist(A, B))}\\) 公分`;
      fb.innerHTML = wrapFeedback(equi
        ? '三次都用同一個半徑 \\(a\\)，交點 \\(A\\) 到 \\(B\\)、到 \\(C\\) 都是 \\(a\\)：三邊相等，是正三角形。'
        : '\\(A\\) 在以 \\(B\\) 為圓心的弧上，所以 \\(\\overline{AB} = c\\)；也在以 \\(C\\) 為圓心的弧上，所以 \\(\\overline{AC} = b\\)。');
    } else {
      out.innerHTML = `\\(a = ${a.toFixed(1)}\\)，<wbr>\\(b = ${b.toFixed(1)}\\)，<wbr>\\(c = ${c.toFixed(1)}\\)：兩弧沒有交在 \\(\\overline{BC}\\) 上方`;
      fb.innerHTML = wrapFeedback(`目前 \\(a = ${a.toFixed(1)}\\)、\\(b = ${b.toFixed(1)}\\)、\\(c = ${c.toFixed(1)}\\)。${why}`);
    }
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-tri-mode', v => { mode = v; draw(); });
  cgSteps('tri', st, draw);
  [sa, sb, sc].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 5：等角作圖
   ========================================================================== */
function initAngCanvas() {
  const cv = elById('canvas-ang');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sT = elById('ang-t'), sR = elById('ang-r');
  const vT = elById('ang-vt'), vR = elById('ang-vr');
  const out = elById('ang-formula'), fb = elById('ang-feedback');
  const st = { k: 1 };

  function draw() {
    const th = iv(sT) * 5, rr = iv(sR) / 2;
    vT.textContent = th;
    vR.textContent = rr.toFixed(1);
    const r = rr * CG_PX;
    const A = cgP(150, 200);
    const s1 = cgPolar(A, 140, 0), s2 = cgPolar(A, 140, cgRad(-th));
    const B = cgPolar(A, r, 0), C = cgPolar(A, r, cgRad(-th));
    const BC = cgDist(B, C);
    const Y = 355;
    const S = cgP(320, Y), Lr = cgP(520, Y);
    const T = cgLC(S, Lr, S, r).filter(p => p.x > S.x)[0];
    const R = cgUpper(cgCC(S, r, T, BC));
    const Rr = cgPolar(S, 150, cgAng(S, R));
    const res = cgAngDeg(S, R, T);
    const arc2 = (c2, cen) => cgArc(c2, cen, r, cgRad(-th) - 0.2, 0.2, CG_HONEY);

    const steps = [
      { tool: 'ruler', text: '畫一直線 L，並在 L 上取一點 S。', ruler: [cgP(250, Y), Lr],
        draw: c => cgSeg(c, cgP(235, Y), cgP(525, Y), CG_SKY, 2) },
      { tool: 'compass', text: '以 A 為圓心、適當長為半徑畫弧，交 ∠A 的兩邊於 B、C 兩點。',
        compass: { c: A, r, ang: cgRad(-th / 2), label: '適當長' }, draw: c => arc2(c, A) },
      { tool: 'compass', text: '再以 S 為圓心、AB 長（同一個適當長）為半徑畫弧，交 L 於 T 點。',
        compass: { c: S, r, ang: cgRad(-th / 2), label: 'AB 的長' }, draw: c => arc2(c, S) },
      { tool: 'compass', text: '圓規改量 B、C 兩點的距離：針腳放在 B、筆尖放在 C。',
        compass: { c: B, r: BC, ang: cgAng(B, C), label: 'BC 的長' }, draw: c => cgSeg(c, B, C, CG_LAV, 1.6, [5, 4]) },
      { tool: 'compass', text: '以 T 為圓心、BC 長為半徑畫弧，交第 3 步的弧於 R 點。',
        compass: { c: T, r: BC, ang: cgAng(T, R), label: 'BC 的長' }, draw: c => cgArcAt(c, T, BC, [R], 0.3, CG_HONEY) },
      { tool: 'ruler', text: '連接 SR，∠RST 即為所求。', ruler: [S, Rr],
        draw: c => {
          cgSeg(c, S, Rr, CG_MOSS, 3.5);
          cgSeg(c, T, R, CG_LAV, 1.6, [5, 4]);
          cgAngMark(c, S, 0, cgAng(S, R), 26, CG_MOSS, 2.4);
          cgLabel(c, S, `${cgDeg(res)}°`, CG_MOSS, 58 * Math.cos(cgAng(S, R) / 2), 58 * Math.sin(cgAng(S, R) / 2), f(700, 15));
        } }
    ];
    cgSync('ang', st, steps.length);

    cgRender(ctx, {
      title: '已知 ∠A，作一角等於 ∠A', color: CG_TONE[4], k: st.k, steps,
      given: c => {
        cgSeg(c, A, s1, CG_INK, 3); cgSeg(c, A, s2, CG_INK, 3);
        cgAngMark(c, A, 0, cgRad(-th), 24, CG_INK, 2);
        cgLabel(c, A, `${th}°`, CG_INK, 52 * Math.cos(cgRad(-th / 2)), 52 * Math.sin(cgRad(-th / 2)), f(700, 15));
      },
      pts: [
        { p: A, n: 'A', s: 0, dx: -16, dy: 8 },
        { p: B, n: 'B', s: 2, c: CG_HONEY, dx: 6, dy: 20 },
        { p: C, n: 'C', s: 2, c: CG_HONEY, dx: -16, dy: -6 },
        { p: S, n: 'S', s: 1, c: CG_SKY, dx: -4, dy: 20 },
        { p: T, n: 'T', s: 3, c: CG_HONEY, dx: 4, dy: 20 },
        { p: R, n: 'R', s: 5, c: CG_MOSS, dx: 14, dy: -12 }
      ],
      measure: st.k === 6 ? [`量一量：∠RST = ${cgDeg(res)}°，∠A = ${th}°`, CG_MOSS] : null
    });
    textLeft(ctx, 'L', 505, Y - 18, CG_SKY, fi(700, 18));

    out.innerHTML = `\\(\\angle RST = \\angle A = ${cgDeg(res)}^\\circ\\)，<wbr>\\(\\overline{BC} = \\overline{TR} = ${cgCm(BC)}\\) 公分`;
    fb.innerHTML = wrapFeedback(st.k < 6
      ? '前兩個弧用同一個「適當長」，第三個弧量的是 \\(B\\)、\\(C\\) 兩點的距離。'
      : `\\(\\overline{SR} = \\overline{ST} = \\overline{AB} = \\overline{AC}\\)、\\(\\overline{TR} = \\overline{BC}\\)：兩邊一樣長、兩端點的距離也一樣，張開的角就一樣大。換一個適當長（現在是 \\(${rr.toFixed(1)}\\) 公分）再量一次看看。`);
    typeset([out, fb]);
  }

  cgSteps('ang', st, draw);
  [sT, sR].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 6：角的和與差——兩次等角作圖
   ========================================================================== */
function initAsumCanvas() {
  const cv = elById('canvas-asum');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const s1 = elById('asum-1'), s2 = elById('asum-2');
  const v1 = elById('asum-v1'), v2 = elById('asum-v2');
  const g = elById('asum-mode-group');
  const out = elById('asum-formula'), fb = elById('asum-feedback');
  const st = { k: 1 };
  let mode = 'add';

  function draw() {
    const t1 = iv(s1) * 5, t2 = iv(s2) * 5;
    v1.textContent = t1;
    v2.textContent = t2;
    const add = (mode === 'add');
    const ok = add || t1 > t2;
    // 已知的兩個角
    const V1 = cgP(70, 170), V2 = cgP(330, 170);
    const g1a = cgPolar(V1, 92, 0), g1b = cgPolar(V1, 92, cgRad(-t1));
    const g2a = cgPolar(V2, 92, 0), g2b = cgPolar(V2, 92, cgRad(-t2));
    // 作圖區
    const O = cgP(270, 380);
    const P = cgPolar(O, 175, 0);
    const r1 = 55, r2 = 82;
    // 第一次等角作圖：在 ∠1 上量弦長，搬到 O
    const ch1 = cgDist(cgPolar(V1, r1, 0), cgPolar(V1, r1, cgRad(-t1)));
    const X1 = cgPolar(O, r1, 0);
    const Q1 = cgUpper(cgCC(O, r1, X1, ch1));
    const Q = cgPolar(O, 175, cgAng(O, Q1));
    // 第二次：以 OQ 為一邊，在 ∠2 上量弦長
    const ch2 = cgDist(cgPolar(V2, r2, 0), cgPolar(V2, r2, cgRad(-t2)));
    const X2 = cgPolar(O, r2, cgAng(O, Q1));
    const cands = cgCC(O, r2, X2, ch2);
    const sideP = cgSide(O, Q, P);
    const R2 = cands.filter(p => (cgSide(O, Q, p) === sideP) !== add)[0];
    const R = R2 ? cgPolar(O, 175, cgAng(O, R2)) : null;
    const res = R ? cgAngDeg(O, P, R) : 0;

    const steps = [
      { tool: 'ruler', text: '畫一直線，在直線上取一點 O 與 P。', ruler: [cgP(110, 380), P],
        draw: c => cgSeg(c, cgP(85, 380), cgP(470, 380), CG_SKY, 2) },
      { tool: 'compass', text: '等角作圖：在 ∠1 上畫弧、量兩交點的距離，搬到 O，作出 ∠POQ = ∠1。',
        compass: { c: O, r: r1, ang: cgAng(O, Q1), label: '' },
        draw: c => {
          cgArc(c, V1, r1, cgRad(-t1) - 0.15, 0.15, CG_HONEY, 1.8);
          cgArc(c, O, r1, cgAng(O, Q1) - 0.15, 0.15, CG_HONEY, 2);
          cgArcAt(c, X1, ch1, [Q1], 0.35, CG_HONEY, 2);
          cgSeg(c, O, Q, CG_MOSS, 2.6);
        } }
    ];
    if (!ok) {
      steps.push({ tool: 'warn', text: t1 === t2 ? '∠1 和 ∠2 一樣大：往回切會剛好回到 OP，∠1 − ∠2 是 0°。把 ∠1 調得比 ∠2 大。'
        : '∠1 比 ∠2 小：往回切會越過 OP，作不出 ∠1 − ∠2。把 ∠1 調得比 ∠2 大再試一次。' });
    } else {
      const a0 = cgAng(O, Q1), a1 = cgAng(O, R2);
      steps.push({ tool: 'compass',
        text: add ? '以 OQ 為一邊，再用等角作圖作 ∠QOR = ∠2，R 與 P 在 OQ 的兩側。'
          : '以 OQ 為一邊，再用等角作圖作 ∠QOR = ∠2，R 與 P 在 OQ 的同側（切進 ∠1 裡）。',
        compass: { c: O, r: r2, ang: a1, label: '' },
        draw: c => {
          cgArc(c, V2, r2, cgRad(-t2) - 0.15, 0.15, CG_HONEY, 1.8);
          cgAngMark(c, O, a0 + (add ? 0.15 : -0.15), a1 + (add ? -0.15 : 0.15), r2, CG_HONEY, 2);
          cgArcAt(c, X2, ch2, [R2], 0.35, CG_HONEY, 2);
          cgSeg(c, O, R, CG_MOSS, 2.6);
        } });
      steps.push({ tool: 'look', text: add ? '∠POR = ∠1 + ∠2 即為所求。' : '∠POR = ∠1 − ∠2 即為所求。',
        draw: c => {
          cgSeg(c, O, R, CG_MOSS, 4);
          cgAngMark(c, O, 0, cgAng(O, R), 30, CG_MOSS, 3);
          const mid = cgAng(O, R) / 2;
          cgLabel(c, O, `${cgDeg(res)}°`, CG_MOSS, 52 * Math.cos(mid), 52 * Math.sin(mid), f(700, 15));
        } });
    }
    cgSync('asum', st, steps.length);

    cgRender(ctx, {
      title: add ? '已知 ∠1、∠2，作 ∠1 + ∠2' : '已知 ∠1、∠2，作 ∠1 − ∠2', color: CG_TONE[5], k: st.k, steps,
      given: c => {
        cgSeg(c, V1, g1a, CG_INK, 2.6); cgSeg(c, V1, g1b, CG_INK, 2.6);
        cgSeg(c, V2, g2a, CG_INK, 2.6); cgSeg(c, V2, g2b, CG_INK, 2.6);
        cgAngMark(c, V1, 0, cgRad(-t1), 22, CG_INK, 1.8);
        cgAngMark(c, V2, 0, cgRad(-t2), 22, CG_INK, 1.8);
        cgLabel(c, V1, `∠1 = ${t1}°`, CG_INK, 40, 20, f(700, 14));
        cgLabel(c, V2, `∠2 = ${t2}°`, CG_INK, 40, 20, f(700, 14));
      },
      pts: [
        { p: O, n: 'O', s: 1, c: CG_SKY, dx: -14, dy: 18 },
        { p: P, n: 'P', s: 1, c: CG_SKY, dx: 0, dy: 20 },
        { p: Q, n: 'Q', s: 2, c: CG_MOSS, dx: 12, dy: -12 },
        R && ok ? { p: R, n: 'R', s: 3, c: CG_MOSS, dx: R.x < O.x ? -14 : 14, dy: -12 } : null
      ],
      measure: (ok && st.k === 4) ? [`量一量：∠POR = ${cgDeg(res)}°`, CG_MOSS] : null
    });

    if (ok) {
      out.innerHTML = `\\(\\angle POR = \\angle 1 ${add ? '+' : '-'} \\angle 2\\)<wbr>\\({}= ${t1}^\\circ ${add ? '+' : '-'} ${t2}^\\circ\\)<wbr>\\({}= ${cgDeg(res)}^\\circ\\)`;
      fb.innerHTML = wrapFeedback(add
        ? '\\(\\angle 2\\) 作在 \\(\\overrightarrow{OQ}\\) 的另一側，接在 \\(\\angle 1\\) 外面，兩個角相加。'
        : '\\(\\angle 2\\) 作在 \\(\\overrightarrow{OQ}\\) 的同一側，切進 \\(\\angle 1\\) 裡面，從 \\(\\angle 1\\) 扣掉 \\(\\angle 2\\)。');
    } else {
      out.innerHTML = `\\(\\angle 1 = ${t1}^\\circ\\)，<wbr>\\(\\angle 2 = ${t2}^\\circ\\)，<wbr>作不出 \\(\\angle 1 - \\angle 2\\)`;
      fb.innerHTML = wrapFeedback(`目前 \\(\\angle 1 = ${t1}^\\circ\\)、\\(\\angle 2 = ${t2}^\\circ\\)，\\(\\angle 1\\) 沒有比 \\(\\angle 2\\) 大，作不出差。把 \\(\\angle 1\\) 調大，或把 \\(\\angle 2\\) 調小。`);
    }
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-asum-mode', v => { mode = v; draw(); });
  cgSteps('asum', st, draw);
  [s1, s2].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 7：中垂線作圖（含「兩端半徑不同」的錯誤示範）
   ========================================================================== */
function initPbCanvas() {
  const cv = elById('canvas-pb');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sL = elById('pb-len'), sR = elById('pb-r');
  const vL = elById('pb-vlen'), vR = elById('pb-vr');
  const g = elById('pb-mode-group');
  const out = elById('pb-formula'), fb = elById('pb-feedback');
  const st = { k: 1 };
  let mode = 'same';

  function draw() {
    const len = iv(sL) / 2, kr = iv(sR) * 0.05;
    vL.textContent = len.toFixed(1);
    vR.textContent = kr.toFixed(2);
    const same = (mode === 'same');
    const Lp = len * CG_PX;
    const A = cgP(270 - Lp / 2, 220), B = cgP(270 + Lp / 2, 220);
    const rA = kr * Lp, rB = same ? rA : rA + 30;
    const xs = cgCC(A, rA, B, rB);
    const P = xs.length === 2 ? cgUpper(xs) : null, Q = xs.length === 2 ? cgLower(xs) : null;
    const M = P ? cgLL(P, Q, A, B) : null;
    const half = Math.abs(kr - 0.5) < 1e-9 ? 0 : (kr > 0.5 ? 1 : -1);
    const rWord = half > 0 ? '比 AB 的一半長' : (half === 0 ? '剛好是 AB 的一半' : '比 AB 的一半短');

    const steps = [
      { tool: 'compass', text: `以 A 為圓心、AB 的 ${kr.toFixed(2)} 倍為半徑畫弧（半徑${rWord}）。`,
        compass: { c: A, r: rA, ang: P ? cgAng(A, P) : -0.9, label: '' },
        draw: c => cgArc(c, A, rA, -1.75, 1.75, CG_HONEY) },
      { tool: 'compass',
        text: same ? '以 B 為圓心、同樣的半徑畫弧。' : '以 B 為圓心，改用比較長的半徑（多 0.75 公分）畫弧——這是錯誤示範。',
        compass: { c: B, r: rB, ang: P ? cgAng(B, P) : Math.PI + 0.9, label: '' },
        draw: c => cgArc(c, B, rB, Math.PI - 1.75, Math.PI + 1.75, same ? CG_HONEY : CG_ROSE) }
    ];
    if (P) {
      steps.push({ tool: 'look', text: '兩弧相交於 P、Q 兩點。' });
      steps.push({ tool: 'ruler', ruler: [P, Q],
        text: same ? '連接 PQ，交 AB 於 M：直線 PQ 就是 AB 的中垂線。'
          : '連接 PQ，交 AB 於 M：PQ 與 AB 垂直，卻沒有通過中點，不是中垂線。',
        draw: c => {
          cgLine(c, P, Q, same ? CG_MOSS : CG_ROSE, 26, 3);
          if (same) {
            [[A, P], [P, B], [B, Q], [Q, A]].forEach(([p, q]) => cgSeg(c, p, q, CG_LAV, 1.6, [6, 5]));
          }
          cgRight(c, M, cgUnit(M, B), cgUnit(M, P), 12, same ? CG_MOSS : CG_ROSE);
        } });
    } else {
      steps.push({ tool: 'warn',
        text: xs.length === 1 ? '兩弧只碰在一點，一個點畫不出一條直線。半徑要大於 AB 的一半。'
          : '兩弧沒有交點，作不出中垂線。半徑要大於 AB 的一半。' });
    }
    cgSync('pb', st, steps.length);

    const AM = M ? cgDist(A, M) : 0, MB = M ? cgDist(M, B) : 0;
    const ang = M ? cgAngDeg(M, B, P) : 0;
    cgRender(ctx, {
      title: '已知 AB，作 AB 的中垂線', color: CG_TONE[6], k: st.k, steps,
      given: c => cgSeg(c, A, B, CG_INK, 3),
      pts: [
        { p: A, n: 'A', s: 0, dx: -16, dy: 0 }, { p: B, n: 'B', s: 0, dx: 16, dy: 0 },
        xs.length === 1 ? { p: xs[0], n: '', s: 3, c: CG_ROSE } : null,
        P ? { p: P, n: 'P', s: 3, c: CG_HONEY, dx: 16, dy: -4 } : null,
        Q ? { p: Q, n: 'Q', s: 3, c: CG_HONEY, dx: 16, dy: 4 } : null,
        M ? { p: M, n: 'M', s: 4, c: same ? CG_MOSS : CG_ROSE, dx: -14, dy: 18 } : null
      ],
      measure: (P && st.k === 4) ? [`量一量：AM = ${cgCm(AM)}，MB = ${cgCm(MB)} 公分，PQ 與 AB 的夾角 ${cgDeg(ang)}°`, same ? CG_MOSS : CG_ROSE] : null
    });

    if (P) {
      out.innerHTML = `\\(\\overline{AM} = ${cgCm(AM)}\\)，<wbr>\\(\\overline{MB} = ${cgCm(MB)}\\) 公分，<wbr>\\(\\angle PMB = ${cgDeg(ang)}^\\circ\\)`;
      fb.innerHTML = wrapFeedback(same
        ? '\\(\\overline{PA} = \\overline{PB} = \\overline{QA} = \\overline{QB}\\)，\\(APBQ\\) 是菱形（虛線），對角線 \\(PQ\\) 垂直平分 \\(\\overline{AB}\\)。'
        : '兩個半徑不同時，\\(PQ\\) 仍然和 \\(\\overline{AB}\\) 垂直，但 \\(\\overline{AM} \\ne \\overline{MB}\\)：沒有平分，所以兩端的半徑一定要相同。');
    } else {
      out.innerHTML = `半徑 \\(= ${kr.toFixed(2)} \\times \\overline{AB}\\)：<wbr>兩弧${xs.length === 1 ? '只碰在一點' : '沒有交點'}`;
      fb.innerHTML = wrapFeedback(`目前半徑是 \\(\\overline{AB}\\) 的 \\(${kr.toFixed(2)}\\) 倍，${xs.length === 1 ? '兩弧只碰在一點' : '兩弧碰不到'}，作不出中垂線。把半徑調到 \\(\\overline{AB}\\) 的一半以上（滑桿調到 \\(0.55\\) 倍以上）再試。`);
    }
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-pb-mode', v => { mode = v; draw(); });
  cgSteps('pb', st, draw);
  [sL, sR].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 8：用中垂線找八等分點——對半、再對半
   ========================================================================== */
function initHalfCanvas() {
  const cv = elById('canvas-half');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = elById('half-k'), vk = elById('half-vk');
  const out = elById('half-formula'), fb = elById('half-feedback');
  const st = { k: 1 };
  const NAMES = ['C', 'D', 'E'];

  function draw() {
    const k = iv(sk);
    vk.textContent = k;
    const A = cgP(60, 220), B = cgP(480, 220);
    const at = i => cgP(A.x + (B.x - A.x) * i / 8, A.y);
    // 二分搜尋：每一次作 [lo, hi] 的中垂線
    const names = { 0: 'A', 8: 'B' };
    const cuts = [];
    let lo = 0, hi = 8;
    for (;;) {
      const mid = (lo + hi) / 2;
      cuts.push({ lo, hi, mid });
      names[mid] = NAMES[cuts.length - 1];
      if (mid === k) break;
      if (k < mid) hi = mid; else lo = mid;
    }
    const steps = [];
    const pts = [{ p: A, n: 'A', s: 0, dx: -16, dy: 0 }, { p: B, n: 'B', s: 0, dx: 16, dy: 0 }];
    cuts.forEach((cu, i) => {
      const L = at(cu.lo), R = at(cu.hi);
      const seg = cgDist(L, R), r = 0.62 * seg;
      const xs = cgCC(L, r, R, r);
      const P = cgUpper(xs), Q = cgLower(xs);
      const M = cgLL(P, Q, L, R);
      const last = (i === cuts.length - 1);
      steps.push({ tool: 'compass',
        text: `作 ${names[cu.lo]}${names[cu.hi]} 的中垂線（兩端同半徑畫弧、連接兩交點），交 ${names[cu.lo]}${names[cu.hi]} 於中點 ${names[cu.mid]}。`,
        compass: { c: R, r, ang: cgAng(R, P), label: '' },
        draw: c => {
          cgArcAt(c, L, r, [P, Q], 0.22, CG_HONEY, 1.8);
          cgArcAt(c, R, r, [P, Q], 0.22, CG_HONEY, 1.8);
          cgSeg(c, P, Q, last ? CG_MOSS : CG_LAV, last ? 2.4 : 1.8, last ? null : [6, 5]);
        } });
      pts.push({ p: M, n: names[cu.mid], s: i + 1, c: last ? CG_MOSS : CG_HONEY, dx: 0, dy: 22 });
    });
    const g0 = gcd(k, 8);
    const ratio = `${k / g0} : ${(8 - k) / g0}`;
    const E = names[k];
    const ratioTxt = g0 === 1 ? ratio : `${k} : ${8 - k} = ${ratio}`;
    steps.push({ tool: 'look', text: `${E} 就是目標：A${E} : ${E}B = ${ratioTxt}，共作了 ${cuts.length} 次中垂線。`,
      draw: c => cgSeg(c, A, at(k), CG_MOSS, 5) });
    cgSync('half', st, steps.length);

    cgRender(ctx, {
      title: `在 AB 上找 ${E}，使 A${E} : ${E}B = ${ratio}`, color: CG_TONE[7], k: st.k, steps,
      given: c => {
        cgSeg(c, A, B, CG_INK, 3);
        for (let i = 1; i < 8; i++) {
          const p = at(i);
          cgSeg(c, cgP(p.x, p.y - 5), cgP(p.x, p.y + 5), i === k ? CG_MOSS : 'rgba(245, 236, 215, 0.35)', i === k ? 2.4 : 1.4);
        }
      },
      pts,
      measure: st.k === steps.length ? [`量一量：A${E} = ${k}/8 AB，${E}B = ${8 - k}/8 AB`, CG_MOSS] : null
    });

    const fr = texFrac(k / g0, 8 / g0);
    out.innerHTML = `\\(\\overline{A${E}} : \\overline{${E}B} = ${ratio}\\)，<wbr>\\(\\overline{A${E}} = ${fr}\\,\\overline{AB}\\)`;
    fb.innerHTML = wrapFeedback(`每作一次中垂線，就把包住目標的那一段對半分。第 \\(${k}\\) 個八分點要作 \\(${cuts.length}\\) 次${cuts.length === 1 ? '（就是中點）' : ''}；分母是 \\(${8 / g0}\\)，${8 / g0 === 2 ? '對半一次' : (8 / g0 === 4 ? '對半兩次' : '對半三次')}就到。`);
    typeset([out, fb]);
  }

  cgSteps('half', st, draw);
  sk.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 9：角平分線作圖
   ========================================================================== */
function initBisCanvas() {
  const cv = elById('canvas-bis');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sT = elById('bis-t'), s1 = elById('bis-r1'), s2 = elById('bis-r2');
  const vT = elById('bis-vt'), v1 = elById('bis-vr1'), v2 = elById('bis-vr2');
  const out = elById('bis-formula'), fb = elById('bis-feedback');
  const st = { k: 1 };

  function draw() {
    const th = iv(sT) * 10, r1 = iv(s1) / 2, fct = iv(s2) / 10;
    vT.textContent = th;
    v1.textContent = r1.toFixed(1);
    v2.textContent = fct.toFixed(1);
    const P = cgP(270, 355);
    const a0 = cgRad(-10), a1 = cgRad(-10 - th);
    const e0 = cgPolar(P, 230, a0), e1 = cgPolar(P, 230, a1);
    const rr = r1 * CG_PX;
    const A = cgPolar(P, rr, a0), B = cgPolar(P, rr, a1);
    const halfAB = cgDist(A, B) / 2;
    const r2 = fct * halfAB;
    const xs = cgCC(A, r2, B, r2);
    // Q 取離 P 較遠的那一個交點
    const Q = xs.length === 2 ? xs.slice().sort((u, v) => cgDist(P, v) - cgDist(P, u))[0] : null;
    const Qr = Q ? cgPolar(P, 240, cgAng(P, Q)) : null;
    const bisA = (a0 + a1) / 2;

    const steps = [
      { tool: 'compass', text: '以 P 點為圓心、適當長為半徑畫弧，交 ∠P 的兩邊於 A、B 兩點。',
        compass: { c: P, r: rr, ang: bisA, label: '適當長' },
        draw: c => cgArc(c, P, rr, a1 - 0.18, a0 + 0.18, CG_HONEY) },
      { tool: 'compass', text: `以 A 為圓心、½AB 的 ${fct.toFixed(1)} 倍為半徑畫弧。`,
        compass: { c: A, r: r2, ang: Q ? cgAng(A, Q) : cgAng(A, B), label: '' },
        draw: c => (Q ? cgArcAt(c, A, r2, [Q], 0.35, CG_HONEY) : cgArcDir(c, A, r2, cgAng(A, B), 0.9, CG_HONEY)) },
      { tool: 'compass', text: '以 B 為圓心、同樣的半徑畫弧。',
        compass: { c: B, r: r2, ang: Q ? cgAng(B, Q) : cgAng(B, A), label: '' },
        draw: c => (Q ? cgArcAt(c, B, r2, [Q], 0.35, CG_HONEY) : cgArcDir(c, B, r2, cgAng(B, A), 0.9, CG_HONEY)) }
    ];
    if (Q) {
      steps.push({ tool: 'ruler', text: '兩弧交於 Q，連接 PQ：PQ 就是 ∠P 的角平分線。', ruler: [P, Qr],
        draw: c => {
          cgSeg(c, P, Qr, CG_MOSS, 3.5);
          [[P, A], [A, Q], [Q, B], [B, P]].forEach(([p, q]) => cgSeg(c, p, q, CG_LAV, 1.6, [6, 5]));
        } });
    } else {
      steps.push({ tool: 'warn', text: xs.length === 1
        ? '兩弧只碰在 AB 的中點一點，很難看準，課本規定半徑要大於 ½AB。'
        : '半徑沒有大於 ½AB，兩弧碰不到，找不到 Q。把倍數調到 1 以上。' });
    }
    cgSync('bis', st, steps.length);

    const angA = Q ? cgAngDeg(P, A, Q) : 0, angB = Q ? cgAngDeg(P, Q, B) : 0;
    cgRender(ctx, {
      title: '已知 ∠P，作 ∠P 的角平分線', color: CG_TONE[8], k: st.k, steps,
      given: c => { cgSeg(c, P, e0, CG_INK, 3); cgSeg(c, P, e1, CG_INK, 3); },
      pts: [
        { p: P, n: 'P', s: 0, dx: 0, dy: 22 },
        { p: A, n: 'A', s: 1, c: CG_HONEY, dx: 4, dy: 20 },
        { p: B, n: 'B', s: 1, c: CG_HONEY, dx: -16, dy: -8 },
        Q ? { p: Q, n: 'Q', s: 3, c: CG_MOSS, dx: 16, dy: -8 } : null
      ],
      measure: (Q && st.k === 4) ? [`量一量：∠APQ = ${cgDeg(angA)}°，∠QPB = ${cgDeg(angB)}°（∠P = ${th}°）`, CG_MOSS] : null
    });

    if (Q) {
      const PA = cgDist(P, A), QA = cgDist(Q, A);
      out.innerHTML = `\\(\\angle APQ = \\angle QPB = ${cgDeg(angA)}^\\circ\\)，<wbr>\\(\\overline{PA} = ${cgCm(PA)}\\)，<wbr>\\(\\overline{QA} = ${cgCm(QA)}\\) 公分`;
      fb.innerHTML = wrapFeedback(Math.abs(PA - QA) < 0.05
        ? '\\(\\overline{PA} = \\overline{QA}\\)：四邊都相等，這時箏形剛好是菱形，\\(PQ\\) 一樣平分 \\(\\angle P\\)。'
        : '\\(\\overline{PA} = \\overline{PB}\\)、\\(\\overline{QA} = \\overline{QB}\\)，\\(APBQ\\) 是箏形（虛線），對稱軸 \\(PQ\\) 平分 \\(\\angle P\\)。兩次的半徑不必相同。');
    } else {
      out.innerHTML = `第二步半徑 \\(= ${fct.toFixed(1)} \\times \\frac{1}{2}\\overline{AB}\\)：<wbr>${xs.length === 1 ? '兩弧只碰在一點' : '兩弧沒有交點'}`;
      fb.innerHTML = wrapFeedback(`第二步的半徑只有 \\(\\frac{1}{2}\\overline{AB}\\) 的 \\(${fct.toFixed(1)}\\) 倍，${xs.length === 1 ? '兩弧只碰在 \\(\\overline{AB}\\) 的中點' : '兩弧碰不到'}。要大於 \\(\\frac{1}{2}\\overline{AB}\\)，倍數調到 \\(1.1\\) 以上。`);
    }
    typeset([out, fb]);
  }

  cgSteps('bis', st, draw);
  [sT, s1, s2].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 10：角平分線的再平分——作出 k/8 個角
   ========================================================================== */
function initQbCanvas() {
  const cv = elById('canvas-qb');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = elById('qb-k'), vk = elById('qb-vk');
  const g = elById('qb-t-group');
  const out = elById('qb-formula'), fb = elById('qb-feedback');
  const st = { k: 1 };
  const NAMES = ['C', 'D', 'E'];
  let th = 90;

  function draw() {
    const k = iv(sk);
    vk.textContent = k;
    const O = cgP(270, 355);
    const LEN = 215, RR = 80;
    const dirOf = i => cgRad(-th * i / 8);
    const rayEnd = ang => cgPolar(O, LEN, ang);
    const names = { 0: 'A', 8: 'B' };
    // 每一條射線的實際方向，由作圖算出來（不是直接用 k/8 × θ）
    const dirs = { 0: dirOf(0), 8: dirOf(8) };
    const cuts = [];
    let lo = 0, hi = 8;
    for (;;) {
      const mid = (lo + hi) / 2;
      const X = cgPolar(O, RR, dirs[lo]), Y = cgPolar(O, RR, dirs[hi]);
      const r2 = 0.8 * cgDist(X, Y);
      const xs = cgCC(X, r2, Y, r2);
      const F = xs.slice().sort((u, v) => cgDist(O, v) - cgDist(O, u))[0];
      dirs[mid] = cgAng(O, F);
      cuts.push({ lo, hi, mid, X, Y, r2, F });
      names[mid] = NAMES[cuts.length - 1];
      if (mid === k) break;
      if (k < mid) hi = mid; else lo = mid;
    }
    const steps = [];
    const pts = [{ p: O, n: 'O', s: 0, dx: 0, dy: 22 },
      { p: rayEnd(dirs[0]), n: 'A', s: 0, dx: 0, dy: 20 },
      { p: rayEnd(dirs[8]), n: 'B', s: 0, dx: -12, dy: -12 }];
    cuts.forEach((cu, i) => {
      const last = (i === cuts.length - 1);
      const nm = names[cu.mid];
      steps.push({ tool: 'compass',
        text: `作 ∠${names[cu.lo]}O${names[cu.hi]} 的角平分線：O 為圓心畫弧，再以兩交點為圓心畫弧交於一點，連成 O${nm}。`,
        compass: { c: cu.Y, r: cu.r2, ang: cgAng(cu.Y, cu.F), label: '' },
        draw: c => {
          cgAngMark(c, O, dirs[cu.lo] + 0.12, dirs[cu.hi] - 0.12, RR, CG_HONEY, 1.8);
          cgArcAt(c, cu.X, cu.r2, [cu.F], 0.3, CG_HONEY, 1.8);
          cgArcAt(c, cu.Y, cu.r2, [cu.F], 0.3, CG_HONEY, 1.8);
          cgSeg(c, O, rayEnd(dirs[cu.mid]), last ? CG_MOSS : CG_LAV, last ? 2.6 : 1.8, last ? null : [6, 5]);
        } });
      pts.push({ p: rayEnd(dirs[cu.mid]), n: nm, s: i + 1, c: last ? CG_MOSS : CG_LAV,
        dx: 14 * Math.cos(dirs[cu.mid]), dy: 14 * Math.sin(dirs[cu.mid]) - 4 });
    });
    const E = names[k];
    const res = cgAngDeg(O, rayEnd(dirs[0]), rayEnd(dirs[k]));
    const g0 = gcd(k, 8);
    steps.push({ tool: 'look', text: `∠AO${E} = ${k}/8 × ${th}° = ${cgDeg(th * k / 8)}°，共作 ${cuts.length} 次角平分線。`,
      draw: c => {
        cgSeg(c, O, rayEnd(dirs[k]), CG_MOSS, 4);
        cgAngMark(c, O, dirs[0], dirs[k], 34, CG_MOSS, 3);
      } });
    cgSync('qb', st, steps.length);

    cgRender(ctx, {
      title: `∠AOB = ${th}°，作出 ∠AO${E} = ${k}/8 ∠AOB`, color: CG_TONE[9], k: st.k, steps,
      given: c => { cgSeg(c, O, rayEnd(dirs[0]), CG_INK, 3); cgSeg(c, O, rayEnd(dirs[8]), CG_INK, 3); },
      pts,
      measure: st.k === steps.length ? [`量一量：∠AO${E} = ${cgDeg(res)}°`, CG_MOSS] : null
    });

    out.innerHTML = `\\(\\angle AO${E} = ${texFrac(k / g0, 8 / g0)} \\times ${th}^\\circ\\)<wbr>\\({}= ${cgDeg(res)}^\\circ\\)`;
    fb.innerHTML = wrapFeedback(`每作一次角平分線，就把包住目標的那個角對半分。從 \\(\\overrightarrow{OA}\\) 量起的 \\(${texFrac(k / g0, 8 / g0)}\\) 要作 \\(${cuts.length}\\) 次。只靠對半分，份數的分母只會是 \\(2\\)、\\(4\\)、\\(8\\)……`);
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-qb-t', v => { th = parseInt(v, 10); draw(); });
  cgSteps('qb', st, draw);
  sk.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 11：過線上一點作垂線
   ========================================================================== */
function initPonCanvas() {
  const cv = elById('canvas-pon');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sx = elById('pon-x'), s1 = elById('pon-r1'), s2 = elById('pon-r2');
  const vx = elById('pon-vx'), v1 = elById('pon-vr1'), v2 = elById('pon-vr2');
  const out = elById('pon-formula'), fb = elById('pon-feedback');
  const st = { k: 1 };

  function draw() {
    const px = iv(sx) * 20, r1 = iv(s1) / 2, fct = iv(s2) / 10;
    vx.textContent = ((px - 20) / CG_PX).toFixed(1);
    v1.textContent = r1.toFixed(1);
    v2.textContent = fct.toFixed(1);
    const Y = 330;
    const L0 = cgP(20, Y), L1 = cgP(515, Y);
    const P = cgP(px, Y);
    const rr = r1 * CG_PX;
    const [A, B] = cgLC(L0, L1, P, rr);
    const r2 = fct * cgDist(A, B) / 2;
    const xs = cgCC(A, r2, B, r2);
    const Q = xs.length === 2 ? cgUpper(xs) : null;
    const Qr = Q ? cgPolar(P, Math.max(cgDist(P, Q) + 40, 150), cgAng(P, Q)) : null;

    const steps = [
      { tool: 'compass', text: '以 P 點為圓心、適當長為半徑畫弧，交 L 於 A、B 兩點。',
        compass: { c: P, r: rr, ang: -Math.PI / 4, label: '適當長' },
        draw: c => cgArc(c, P, rr, Math.PI - 0.15, 2 * Math.PI + 0.15, CG_HONEY) },
      { tool: 'compass', text: `以 A 為圓心、½AB 的 ${fct.toFixed(1)} 倍為半徑畫弧。`,
        compass: { c: A, r: r2, ang: Q ? cgAng(A, Q) : -Math.PI / 3, label: '' },
        draw: c => (Q ? cgArcAt(c, A, r2, [Q], 0.35, CG_HONEY) : cgArc(c, A, r2, -1.4, 0.1, CG_HONEY)) },
      { tool: 'compass', text: '以 B 為圓心、同樣的半徑畫弧。',
        compass: { c: B, r: r2, ang: Q ? cgAng(B, Q) : -2 * Math.PI / 3, label: '' },
        draw: c => (Q ? cgArcAt(c, B, r2, [Q], 0.35, CG_HONEY) : cgArc(c, B, r2, Math.PI - 0.1, Math.PI + 1.4, CG_HONEY)) }
    ];
    if (Q) {
      steps.push({ tool: 'ruler', text: '兩弧交於 Q，連接 PQ：直線 PQ 與 L 垂直。', ruler: [P, Qr],
        draw: c => {
          cgSeg(c, cgP(P.x, P.y + 30), Qr, CG_MOSS, 3.5);
          cgSeg(c, A, Q, CG_LAV, 1.6, [6, 5]); cgSeg(c, B, Q, CG_LAV, 1.6, [6, 5]);
          cgRight(c, P, cgP(1, 0), cgP(0, -1), 14, CG_MOSS);
        } });
    } else {
      steps.push({ tool: 'warn', text: xs.length === 1
        ? '半徑剛好是 ½AB（也就是 PA）：兩弧只碰在 P 點，找不到另一個點 Q。'
        : '半徑沒有大於 ½AB，兩弧碰不到，找不到 Q。把倍數調到 1 以上。' });
    }
    cgSync('pon', st, steps.length);

    const angA = Q ? cgAngDeg(P, A, Q) : 0, angB = Q ? cgAngDeg(P, Q, B) : 0;
    cgRender(ctx, {
      title: '過直線 L 上一點 P，作 L 的垂線', color: CG_TONE[10], k: st.k, steps,
      given: c => cgSeg(c, L0, L1, CG_INK, 3),
      pts: [
        { p: P, n: 'P', s: 0, dx: 0, dy: 22 },
        { p: A, n: 'A', s: 1, c: CG_HONEY, dx: 0, dy: 22 },
        { p: B, n: 'B', s: 1, c: CG_HONEY, dx: 0, dy: 22 },
        Q ? { p: Q, n: 'Q', s: 3, c: CG_MOSS, dx: 16, dy: -6 } : null
      ],
      measure: (Q && st.k === 4) ? [`量一量：∠QPA = ${cgDeg(angA)}°，∠QPB = ${cgDeg(angB)}°`, CG_MOSS] : null
    });
    textLeft(ctx, 'L', 500, Y - 18, CG_INK, fi(700, 18));

    if (Q) {
      out.innerHTML = `\\(\\angle QPA = \\angle QPB = ${cgDeg(angA)}^\\circ\\)，<wbr>\\(\\overline{QA} = \\overline{QB} = ${cgCm(r2)}\\) 公分`;
      fb.innerHTML = wrapFeedback('\\(\\overline{PA} = \\overline{PB}\\)、\\(\\overline{QA} = \\overline{QB}\\)：\\(\\triangle QAB\\) 是等腰三角形（虛線），\\(QP\\) 是它的對稱軸，垂直平分底邊 \\(\\overline{AB}\\)。也可以看成平角 \\(\\angle APB\\) 的角平分線。');
    } else {
      out.innerHTML = `第二步半徑 \\(= ${fct.toFixed(1)} \\times \\frac{1}{2}\\overline{AB}\\)：<wbr>${xs.length === 1 ? '兩弧只碰在 \\(P\\)' : '兩弧沒有交點'}`;
      fb.innerHTML = wrapFeedback(`第二步的半徑只有 \\(\\frac{1}{2}\\overline{AB}\\) 的 \\(${fct.toFixed(1)}\\) 倍，${xs.length === 1 ? '剛好等於 \\(\\overline{PA}\\)，兩弧只碰在 \\(P\\) 點' : '兩弧碰不到'}。倍數調到 \\(1.1\\) 以上再試。`);
    }
    typeset([out, fb]);
  }

  cgSteps('pon', st, draw);
  [sx, s1, s2].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 12：過線外一點作垂線
   ========================================================================== */
function initPoffCanvas() {
  const cv = elById('canvas-poff');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sd = elById('poff-d'), s1 = elById('poff-r1'), s2 = elById('poff-r2');
  const vd = elById('poff-vd'), v1 = elById('poff-vr1'), v2 = elById('poff-vr2');
  const out = elById('poff-formula'), fb = elById('poff-feedback');
  const st = { k: 1 };

  function draw() {
    const d = iv(sd) / 2, r1 = iv(s1) / 2, fct = iv(s2) / 10;
    vd.textContent = d.toFixed(1);
    v1.textContent = r1.toFixed(1);
    v2.textContent = fct.toFixed(1);
    const Y = 240;
    const L0 = cgP(25, Y), L1 = cgP(515, Y);
    const P = cgP(250, Y - d * CG_PX);
    const rr = r1 * CG_PX;
    const ab = cgLC(L0, L1, P, rr);
    const A = ab.length === 2 ? ab[0] : null, B = ab.length === 2 ? ab[1] : null;
    const r2 = A ? fct * cgDist(A, B) / 2 : 0;
    const xs = A ? cgCC(A, r2, B, r2) : [];
    const Q = xs.length === 2 ? cgLower(xs) : null;
    const H = Q ? cgLL(P, Q, L0, L1) : null;

    const steps = [
      { tool: 'compass', text: `以 P 點為圓心、適當長（${r1.toFixed(1)} 公分）為半徑畫弧，交 L 於 A、B 兩點。`,
        compass: { c: P, r: rr, ang: A ? cgAng(P, B) : Math.PI / 4, label: '適當長' },
        draw: c => (A ? cgArcAt(c, P, rr, [A, B], 0.25, CG_HONEY) : cgArcDir(c, P, rr, Math.PI / 2, 0.9, CG_ROSE)) }
    ];
    if (!A) {
      steps.push({ tool: 'warn', text: ab.length === 1
        ? '半徑剛好等於 P 到 L 的距離：弧只碰到 L 一點，得不到兩個交點。把適當長調長一點。'
        : '半徑比 P 到 L 的距離短：弧碰不到 L。把適當長調得比 P 到 L 的距離長。' });
    } else {
      steps.push({ tool: 'compass', text: `以 A 為圓心、½AB 的 ${fct.toFixed(1)} 倍為半徑，在 L 的另一側畫弧。`,
        compass: { c: A, r: r2, ang: Q ? cgAng(A, Q) : Math.PI / 3, label: '' },
        draw: c => (Q ? cgArcAt(c, A, r2, [Q], 0.35, CG_HONEY) : cgArc(c, A, r2, -0.1, 1.4, CG_HONEY)) });
      steps.push({ tool: 'compass', text: '以 B 為圓心、同樣的半徑畫弧。',
        compass: { c: B, r: r2, ang: Q ? cgAng(B, Q) : 2 * Math.PI / 3, label: '' },
        draw: c => (Q ? cgArcAt(c, B, r2, [Q], 0.35, CG_HONEY) : cgArc(c, B, r2, Math.PI - 1.4, Math.PI + 0.1, CG_HONEY)) });
      if (Q) {
        steps.push({ tool: 'ruler', text: '兩弧交於 Q，連接 PQ，交 L 於 H：直線 PQ 與 L 垂直。', ruler: [P, Q],
          draw: c => {
            cgLine(c, P, Q, CG_MOSS, 24, 3.5);
            [[P, A], [A, Q], [Q, B], [B, P]].forEach(([p, q]) => cgSeg(c, p, q, CG_LAV, 1.6, [6, 5]));
            cgRight(c, H, cgP(1, 0), cgP(0, -1), 13, CG_MOSS);
          } });
      } else {
        steps.push({ tool: 'warn', text: xs.length === 1
          ? '兩弧只碰在 L 上一點（AB 的中點），找不到 L 另一側的 Q。倍數要大於 1。'
          : '半徑沒有大於 ½AB，兩弧碰不到。把倍數調到 1 以上。' });
      }
    }
    cgSync('poff', st, steps.length);

    const n = steps.length;
    const done = Q && st.k === n;
    cgRender(ctx, {
      title: '過直線 L 外一點 P，作 L 的垂線', color: CG_TONE[11], k: st.k, steps,
      given: c => cgSeg(c, L0, L1, CG_INK, 3),
      pts: [
        { p: P, n: 'P', s: 0, dx: 0, dy: -20 },
        A ? { p: A, n: 'A', s: 1, c: CG_HONEY, dx: -10, dy: -18 } : null,
        B ? { p: B, n: 'B', s: 1, c: CG_HONEY, dx: 10, dy: -18 } : null,
        Q ? { p: Q, n: 'Q', s: 3, c: CG_MOSS, dx: 18, dy: 0 } : null,
        H ? { p: H, n: 'H', s: 4, c: CG_MOSS, dx: -16, dy: 16 } : null
      ],
      measure: done ? [`量一量：PA = ${cgCm(cgDist(P, A))}、QA = ${cgCm(cgDist(Q, A))}；PH = ${cgCm(cgDist(P, H))}、QH = ${cgCm(cgDist(Q, H))} 公分`, CG_MOSS] : null
    });
    textLeft(ctx, 'L', 500, Y - 18, CG_INK, fi(700, 18));

    if (Q) {
      const PA = cgDist(P, A), QA = cgDist(Q, A), PH = cgDist(P, H), QH = cgDist(Q, H);
      const ang = cgAngDeg(H, A, P);
      out.innerHTML = `\\(\\angle PHA = ${cgDeg(ang)}^\\circ\\)，<wbr>\\(\\overline{PA} = ${cgCm(PA)}\\)，<wbr>\\(\\overline{QA} = ${cgCm(QA)}\\)，<wbr>\\(\\overline{PH} = ${cgCm(PH)}\\)，<wbr>\\(\\overline{QH} = ${cgCm(QH)}\\) 公分`;
      fb.innerHTML = wrapFeedback((Math.abs(PA - QA) < 0.05
        ? '這一次兩個半徑剛好一樣長，\\(APBQ\\) 是菱形，\\(\\overline{PH} = \\overline{QH}\\)。'
        : '箏形 \\(APBQ\\)（虛線）的對角線互相垂直，所以 \\(PQ \\perp L\\)；但兩次半徑不同，\\(\\overline{PA} \\ne \\overline{QA}\\)、\\(\\overline{PH} \\ne \\overline{QH}\\)，\\(L\\) 不是 \\(\\overline{PQ}\\) 的中垂線。'));
    } else if (!A) {
      out.innerHTML = `\\(P\\) 到 \\(L\\) 的距離 \\(${d.toFixed(1)}\\) 公分，<wbr>適當長 \\(${r1.toFixed(1)}\\) 公分`;
      fb.innerHTML = wrapFeedback(`適當長 \\(${r1.toFixed(1)}\\) 公分沒有比 \\(P\\) 到 \\(L\\) 的距離 \\(${d.toFixed(1)}\\) 公分長，弧${ab.length === 1 ? '只碰到 \\(L\\) 一點' : '碰不到 \\(L\\)'}。把適當長調長，或把 \\(P\\) 移近 \\(L\\)。`);
    } else {
      out.innerHTML = `第二步半徑 \\(= ${fct.toFixed(1)} \\times \\frac{1}{2}\\overline{AB}\\)：<wbr>${xs.length === 1 ? '兩弧只碰在 \\(L\\) 上' : '兩弧沒有交點'}`;
      fb.innerHTML = wrapFeedback(`第二步的半徑只有 \\(\\frac{1}{2}\\overline{AB}\\) 的 \\(${fct.toFixed(1)}\\) 倍，找不到 \\(L\\) 另一側的交點。倍數調到 \\(1.1\\) 以上再試。`);
    }
    typeset([out, fb]);
  }

  cgSteps('poff', st, draw);
  [sd, s1, s2].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 13：三角形裡的四條線——高、中垂線、中線、角平分線
   ========================================================================== */
function initAltCanvas() {
  const cv = elById('canvas-alt');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sx = elById('alt-ax'), vx = elById('alt-vax');
  const g = elById('alt-mode-group');
  const out = elById('alt-formula'), fb = elById('alt-feedback');
  const st = { k: 1 };
  let mode = 'height';

  function draw() {
    const ax = iv(sx) * 10;
    const dx = (ax - 200) / CG_PX;
    vx.textContent = (dx > 0 ? '+' : '') + dx.toFixed(2);
    const Y = 280;
    const B = cgP(200, Y), C = cgP(440, Y), A = cgP(ax, 150);
    const L0 = cgP(15, Y), L1 = cgP(525, Y);
    const obtuseB = cgAngDeg(B, A, C) > 90 + 1e-9;
    const steps = [];
    const pts = [{ p: A, n: 'A', s: 0, dx: 0, dy: -20 }, { p: B, n: 'B', s: 0, dx: -6, dy: 22 }, { p: C, n: 'C', s: 0, dx: 6, dy: 22 }];
    let measure = null, tex = '', fbText = '';

    if (mode === 'height') {
      const r1 = 170;
      const [D, E] = cgLC(L0, L1, A, r1);
      const r2 = 0.65 * cgDist(D, E);
      const F = cgLower(cgCC(D, r2, E, r2));
      const H = cgLL(A, F, B, C);
      const inside = H.x >= B.x - 1e-6 && H.x <= C.x + 1e-6;
      steps.push({ tool: 'ruler', text: '用直尺把 BC 往兩端延長成直線（高的垂足可能落在 BC 外面）。', ruler: [B, C],
        draw: c => cgSeg(c, L0, L1, CG_SKY, 1.6, [7, 5]) });
      steps.push({ tool: 'compass', text: '以 A 為圓心、適當長為半徑畫弧，交直線 BC 於 D、E 兩點。',
        compass: { c: A, r: r1, ang: cgAng(A, E), label: '' },
        draw: c => cgArcAt(c, A, r1, [D, E], 0.15, CG_HONEY) });
      steps.push({ tool: 'compass', text: '分別以 D、E 為圓心、大於 ½DE 的相同長度為半徑，在 BC 下方畫弧，兩弧交於 F。',
        compass: { c: E, r: r2, ang: cgAng(E, F), label: '' },
        draw: c => { cgArcAt(c, D, r2, [F], 0.3, CG_HONEY); cgArcAt(c, E, r2, [F], 0.3, CG_HONEY); } });
      steps.push({ tool: 'ruler',
        text: inside ? '連接 AF，交 BC 於 H：AH 就是 BC 邊上的高。' : '連接 AF，交直線 BC 於 H：H 落在 CB 的延長線上（∠B 是鈍角），AH 是 BC 邊上的高。',
        ruler: [A, F],
        draw: c => {
          cgSeg(c, A, F, CG_LAV, 1.6, [6, 5]);
          cgSeg(c, A, H, CG_MOSS, 4);
          cgRight(c, H, cgP(1, 0), cgP(0, -1), 12, CG_MOSS);
        } });
      pts.push({ p: D, n: 'D', s: 2, c: CG_HONEY, dx: -4, dy: -18 }, { p: E, n: 'E', s: 2, c: CG_HONEY, dx: 4, dy: -18 },
        { p: F, n: 'F', s: 3, c: CG_HONEY, dx: 16, dy: 0 }, { p: H, n: 'H', s: 4, c: CG_MOSS, dx: -16, dy: -16 });
      const ang = cgAngDeg(H, A, C.x > H.x + 1 ? C : B);
      measure = [`量一量：∠AHC = ${cgDeg(ang)}°，H ${inside ? '在 BC 上' : '在 BC 的延長線上'}`, CG_MOSS];
      tex = `\\(\\overline{AH} \\perp \\overline{BC}\\)，<wbr>\\(\\overline{AH} = ${cgCm(cgDist(A, H))}\\) 公分`;
      fbText = obtuseB
        ? '\\(\\angle B\\) 是鈍角，垂足 \\(H\\) 跑到 \\(\\overline{CB}\\) 的延長線上；第一步沒有先延長，以 \\(A\\) 為圓心的弧就交不出兩個點。'
        : '這是「過線外一點作垂線」：\\(A\\) 是線外一點，直線 \\(BC\\) 是那條線。把 \\(A\\) 往左拉到 \\(B\\) 的左邊試試看。';
    } else if (mode === 'perp' || mode === 'median') {
      const r = 0.65 * cgDist(B, C);
      const xs = cgCC(B, r, C, r);
      const P = cgUpper(xs), Q = cgLower(xs);
      const M = cgLL(P, Q, B, C);
      steps.push({ tool: 'compass', text: '以 B 為圓心、大於 ½BC 的長為半徑畫弧。',
        compass: { c: B, r, ang: cgAng(B, P), label: '' },
        draw: c => cgArcAt(c, B, r, [P, Q], 0.22, CG_HONEY) });
      steps.push({ tool: 'compass', text: '以 C 為圓心、同樣的半徑畫弧，兩弧交於 P、Q。',
        compass: { c: C, r, ang: cgAng(C, P), label: '' },
        draw: c => cgArcAt(c, C, r, [P, Q], 0.22, CG_HONEY) });
      pts.push({ p: P, n: 'P', s: 2, c: CG_HONEY, dx: 16, dy: -4 }, { p: Q, n: 'Q', s: 2, c: CG_HONEY, dx: 16, dy: 4 });
      if (mode === 'perp') {
        steps.push({ tool: 'ruler', text: '連接 PQ，交 BC 於 M：直線 PQ 是 BC 的中垂線，它不一定通過頂點 A。', ruler: [P, Q],
          draw: c => { cgLine(c, P, Q, CG_MOSS, 20, 3.5); cgRight(c, M, cgP(1, 0), cgP(0, -1), 12, CG_MOSS); } });
        pts.push({ p: M, n: 'M', s: 3, c: CG_MOSS, dx: -14, dy: 18 });
        const dA = Math.abs(A.x - M.x) / CG_PX;
        measure = [`量一量：BM = ${cgCm(cgDist(B, M))}、MC = ${cgCm(cgDist(M, C))} 公分；A 離中垂線 ${dA.toFixed(1)} 公分`, CG_MOSS];
        tex = `\\(\\overline{BM} = \\overline{MC} = ${cgCm(cgDist(B, M))}\\) 公分，<wbr>\\(PQ \\perp \\overline{BC}\\)`;
        fbText = Math.abs(A.x - M.x) < 1e-6
          ? '\\(A\\) 剛好在中垂線上：\\(\\overline{AB} = \\overline{AC}\\)，中垂線通過頂點 \\(A\\)。'
          : '中垂線只看 \\(B\\)、\\(C\\) 兩個端點，跟頂點 \\(A\\) 無關，所以一般不會通過 \\(A\\)。';
      } else {
        steps.push({ tool: 'ruler', text: '連接 PQ，只取它和 BC 的交點：這就是 BC 的中點 M。', ruler: [P, Q],
          draw: c => cgSeg(c, P, Q, CG_LAV, 1.8, [6, 5]) });
        steps.push({ tool: 'ruler', text: '連接 AM：AM 就是 BC 邊上的中線。', ruler: [A, M],
          draw: c => cgSeg(c, A, M, CG_MOSS, 4) });
        pts.push({ p: M, n: 'M', s: 3, c: CG_MOSS, dx: -14, dy: 18 });
        measure = [`量一量：BM = ${cgCm(cgDist(B, M))}、MC = ${cgCm(cgDist(M, C))} 公分`, CG_MOSS];
        tex = `\\(\\overline{BM} = \\overline{MC} = ${cgCm(cgDist(B, M))}\\) 公分，<wbr>\\(\\overline{AM}\\) 是中線`;
        fbText = Math.abs(A.x - M.x) < 1e-6
          ? '\\(A\\) 剛好在正中間：\\(\\overline{AB} = \\overline{AC}\\)，中線、高、中垂線、角平分線重合成同一條。'
          : '中線要先用中垂線找到中點 \\(M\\)，再連到頂點 \\(A\\)；它一般不和 \\(\\overline{BC}\\) 垂直。';
      }
    } else {
      const r1 = 70;
      const D = cgPolar(A, r1, cgAng(A, B)), E = cgPolar(A, r1, cgAng(A, C));
      const r2 = 0.75 * cgDist(D, E) + 25;
      const xs = cgCC(D, r2, E, r2);
      const F = xs.slice().sort((u, v) => cgDist(A, v) - cgDist(A, u))[0];
      const G = cgLL(A, F, B, C);
      steps.push({ tool: 'compass', text: '以 A 為圓心、適當長為半徑畫弧，交 AB、AC 於 D、E。',
        compass: { c: A, r: r1, ang: cgAng(A, E), label: '' },
        draw: c => cgArcAt(c, A, r1, [D, E], 0.2, CG_HONEY) });
      steps.push({ tool: 'compass', text: '分別以 D、E 為圓心、大於 ½DE 的相同長度為半徑畫弧，兩弧交於 F。',
        compass: { c: E, r: r2, ang: cgAng(E, F), label: '' },
        draw: c => { cgArcAt(c, D, r2, [F], 0.3, CG_HONEY); cgArcAt(c, E, r2, [F], 0.3, CG_HONEY); } });
      steps.push({ tool: 'ruler', text: '連接 AF 並延長，交 BC 於 G：AG 是 ∠A 的角平分線。', ruler: [A, G],
        draw: c => cgSeg(c, A, G, CG_MOSS, 4) });
      pts.push({ p: D, n: 'D', s: 1, c: CG_HONEY, dx: -16, dy: 0 }, { p: E, n: 'E', s: 1, c: CG_HONEY, dx: 6, dy: -16 },
        { p: F, n: 'F', s: 2, c: CG_HONEY, dx: 16, dy: 0 }, { p: G, n: 'G', s: 3, c: CG_MOSS, dx: 0, dy: 22 });
      const a1 = cgAngDeg(A, B, G), a2 = cgAngDeg(A, G, C);
      measure = [`量一量：∠BAG = ${cgDeg(a1)}°，∠GAC = ${cgDeg(a2)}°`, CG_MOSS];
      tex = `\\(\\angle BAG = \\angle GAC = ${cgDeg(a1)}^\\circ\\)`;
      fbText = Math.abs(A.x - 320) < 1e-6
        ? '\\(A\\) 剛好在正中間：角平分線也垂直平分 \\(\\overline{BC}\\)。'
        : '角平分線的圓心先是頂點 \\(A\\)，弧交的是角的兩邊 \\(\\overline{AB}\\)、\\(\\overline{AC}\\)；一般不經過 \\(\\overline{BC}\\) 的中點。';
    }
    cgSync('alt', st, steps.length);

    const TITLES = { height: '作 △ABC 中 BC 邊上的高', perp: '作 △ABC 中 BC 的中垂線', median: '作 △ABC 中 BC 邊上的中線', bisect: '作 △ABC 中 ∠A 的角平分線' };
    cgRender(ctx, {
      title: TITLES[mode], color: CG_TONE[12], k: st.k, steps,
      given: c => { cgSeg(c, A, B, CG_INK, 3); cgSeg(c, B, C, CG_INK, 3); cgSeg(c, C, A, CG_INK, 3); },
      pts,
      measure: st.k === steps.length ? measure : null
    });

    out.innerHTML = tex;
    fb.innerHTML = wrapFeedback(fbText);
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-alt-mode', v => { mode = v; st.k = 1; draw(); });
  cgSteps('alt', st, draw);
  sx.addEventListener('input', draw);
  draw();
}
