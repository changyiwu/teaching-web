/* ==========================================================================
   4-3-3（第四冊 3-3）三角形的全等性質 — 互動 Canvas 與隨堂評量
   畫風：19 世紀手工上色銅版畫博物圖鑑・養蜂花園（小蜜、阿蜂），第 3 章共用。
   配色：象牙 CG_INK（已知圖形）、蜂蜜金 CG_HONEY（圓規畫的弧）、
   天藍 CG_SKY（直尺畫的線）、苔綠 CG_MOSS（作出的結果）、
   薰衣草 CG_LAV（輔助線）、玫瑰 CG_ROSE（作不出來、不全等）。
   全等記號：相等的邊畫相同條數的刻痕、相等的角畫相同條數的弧。

   共用工具在 ../math-canvas.js（f／fi／T／FR／SEQ／drawExpr／drawTitle／
   drawPanel／fitLines／textCenter／textLeft／bindPickGroup／typeset／
   wrapFeedback／wbrEq／clamp…）；cg* 幾何與尺規工具（cgCC、cgLC、cgLL、
   cgRender、cgSteps、cgCompass、cgRuler…）也在那裡，播放引擎的配色由本檔
   呼叫 cgUsePalette() 登記（CG_ 色票與 4-3-2 相同）。
   本節自己的工具一律用 ct／CT_ 前綴（Congruent Triangles）。

   作圖結果一律用真正的作圖動作算出來（圓與圓、直線與圓的交點），
   畫面上量到的角度與長度才是作圖的結果。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();
  initQuizFigs();

  initOvCanvas();
  initCrCanvas();
  initSssCanvas();
  initSasCanvas();
  initSsaCanvas();
  initRhsCanvas();
  initAsaCanvas();
  initAasCanvas();
  initAaaCanvas();
  initJdCanvas();
  initHdCanvas();
  initApCanvas();
});

/* ==========================================================================
   0. 色票（與 4-3-2 相同）
   ========================================================================== */

const CG_INK = '#f5ecd7';
const CG_HONEY = '#fbbf24';
const CG_SKY = '#93c5fd';
const CG_MOSS = '#a3d977';
const CG_LAV = '#c4b5fd';
const CG_ROSE = '#fb7185';
const CG_BRASS = '#d4a017';
const CG_BRASS_DK = '#5b4208';

// 尺規播放引擎的配色（共用檔的 cgUsePalette）
cgUsePalette({
  ink: CG_INK, honey: CG_HONEY, brass: CG_BRASS, brassDk: CG_BRASS_DK,
  tools: { compass: CG_HONEY, ruler: CG_SKY, look: CG_MOSS, warn: CG_ROSE }
});

// 1 公分畫成 40px
const CG_PX = 40;

// 公分（一位小數）
function cgCm(px) {
  return (px / CG_PX).toFixed(1);
}

/* ==========================================================================
   1. 本節工具（ct／CT_ 前綴）
   ========================================================================== */

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const CT_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9', '#fca5a5'];

// 三個角的固定配色（全頁一致）：∠A／∠D 玫瑰、∠B／∠E 天藍、∠C／∠F 苔綠
const CT_ANG = ['#fda4af', '#7dd3fc', '#bef264'];

function ctCentroid(pts) {
  const s = pts.reduce((a, p) => cgP(a.x + p.x, a.y + p.y), cgP(0, 0));
  return cgP(s.x / pts.length, s.y / pts.length);
}

function ctPoly(ctx, pts, color, alpha, w, dash) {
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
  ctx.lineWidth = w || 2.6;
  ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.stroke();
  ctx.restore();
}

// 全等記號：邊的中點畫 n 條短刻痕（相等的邊條數相同）
function ctTicks(ctx, P, Q, n, color) {
  if (!n) return;
  const u = cgUnit(P, Q), nv = cgP(-u.y, u.x), M = cgMid(P, Q);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * 7;
    const c = cgP(M.x + u.x * off, M.y + u.y * off);
    ctx.beginPath();
    ctx.moveTo(c.x - nv.x * 9, c.y - nv.y * 9);
    ctx.lineTo(c.x + nv.x * 9, c.y + nv.y * 9);
    ctx.stroke();
  }
  ctx.restore();
}

// 全等記號：∠PVQ 畫 n 條同心弧（相等的角條數相同），第一條下面淡淡填色
function ctArcs(ctx, V, P, Q, n, color, r0, dash) {
  if (!n) return;
  const a = cgAng(V, P);
  let d = cgAng(V, Q) - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  const r = r0 || 22;
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(V.x, V.y);
  ctx.arc(V.x, V.y, r, a, a + d, d < 0);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  if (dash) ctx.setLineDash(dash);
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.arc(V.x, V.y, r + i * 5, a, a + d, d < 0);
    ctx.stroke();
  }
  ctx.restore();
}

// 直角記號（頂點 V，兩邊通往 P、Q）
function ctRightMark(ctx, V, P, Q, color, s) {
  cgRight(ctx, V, cgUnit(V, P), cgUnit(V, Q), s || 13, color);
}

// ∠PVQ 角平分線方向上、距頂點 r 的點（放角度數字用；在角的內側）
function ctInside(V, P, Q, r) {
  const u = cgUnit(V, P), w = cgUnit(V, Q);
  let bx = u.x + w.x, by = u.y + w.y;
  const L = Math.hypot(bx, by) || 1;
  return cgP(V.x + bx / L * r, V.y + by / L * r);
}

function ctAngText(ctx, V, P, Q, text, color, r, font) {
  const p = ctInside(V, P, Q, r || 42);
  cgLabel(ctx, p, text, color, 0, 0, font || f(700, 14));
}

// 頂點字母畫在圖形外側（開發約束 18）：由 G（通常是重心）往 V 的方向推出去
function ctVLabel(ctx, V, G, text, color, dist) {
  const d = cgDist(V, G) || 1;
  const k = dist || 18;
  cgLabel(ctx, V, text, color || CG_INK, (V.x - G.x) / d * k, (V.y - G.y) / d * k);
}

// 邊長標示：畫在邊的外側（離 G 的那一側）
function ctSideLabel(ctx, P, Q, G, text, color, off, font) {
  const M = cgMid(P, Q), u = cgUnit(P, Q);
  let n = cgP(-u.y, u.x);
  if ((M.x - G.x) * n.x + (M.y - G.y) * n.y < 0) n = cgP(-n.x, -n.y);
  const k = off || 22;
  cgLabel(ctx, M, text, color, n.x * k, n.y * k, font || f(700, 15));
}

// 三邊長（a = BC、b = CA、c = AB）決定的三角形：B 在原點、C 在 (a, 0)、A 在上方
function ctFromSides(a, b, c) {
  const x = (a * a + c * c - b * b) / (2 * a);
  const y2 = c * c - x * x;
  if (y2 <= 1e-9) return null;
  return { A: cgP(x, -Math.sqrt(y2)), B: cgP(0, 0), C: cgP(a, 0) };
}

// 兩角（∠B、∠C，度）與夾邊 a 決定的三角形
function ctFromAngles(angB, angC, a) {
  const s = Math.sin(cgRad(angB + angC));
  const c = a * Math.sin(cgRad(angC)) / s;
  return { A: cgPolar(cgP(0, 0), c, -cgRad(angB)), B: cgP(0, 0), C: cgP(a, 0) };
}

// 把一組點：以重心為中心，先水平縮放 sx（−1 是翻面），再旋轉 ang（弧度），最後放到 (cx, cy)
function ctPose(pts, ang, sx, cx, cy) {
  const G = ctCentroid(pts);
  const c = Math.cos(ang), s = Math.sin(ang);
  return pts.map(p => {
    const x = (p.x - G.x) * sx, y = p.y - G.y;
    return cgP(cx + x * c - y * s, cy + x * s + y * c);
  });
}

// 一組點的外框
function ctBox(pts) {
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

// 等比例縮放、置中到 box 裡（保持形狀）；kmax 是最大放大倍率
function ctFit(pts, box, kmax) {
  const b = ctBox(pts);
  let k = Math.min(box.w / Math.max(b.x1 - b.x0, 1e-6), box.h / Math.max(b.y1 - b.y0, 1e-6));
  if (kmax) k = Math.min(k, kmax);
  const ox = box.x + (box.w - (b.x1 - b.x0) * k) / 2, oy = box.y + (box.h - (b.y1 - b.y0) * k) / 2;
  return pts.map(p => cgP(ox + (p.x - b.x0) * k, oy + (p.y - b.y0) * k));
}

// 根式化簡：√N = k√r（r 不含平方因數）
function ctSurd(N) {
  let k = 1, r = N;
  for (let d = 2; d * d <= r; d++) {
    while (r % (d * d) === 0) { r /= d * d; k *= d; }
  }
  return [k, r];
}

function ctSurdTex(N) {
  const [k, r] = ctSurd(N);
  if (r === 1) return String(k);
  return (k === 1 ? '' : String(k)) + `\\sqrt{${r}}`;
}

// 驗收用：頁面平常不會建立 window.__CT_DBG，這一行什麼都不做；
// 驗收腳本建立它之後，每次重繪都把頂點座標記下來，用來由座標重量角度與長度
function ctDbg(key, obj) {
  if (window.__CT_DBG) window.__CT_DBG[key] = obj;
}

// 一行畫布說明（自動折行，最多 maxLines 行），回傳用掉的行數
function ctRow(ctx, text, x, y, maxW, color, font, lh, maxLines) {
  const lines = fitLines(ctx, text, maxW, font).slice(0, maxLines || 2);
  lines.forEach((ln, i) => textLeft(ctx, ln, x, y + i * (lh || 20), color, font));
  return lines.length;
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第四冊 3-3 的 24 題正解
  // 正解字母分布：A 6 題、B 6 題、C 6 題、D 6 題（開發約束 36）
  const answers = {
    '3-3-1': 'D',    // △PQR ≅ △XYZ：∠Q 對應 ∠Y，不是 ∠Z
    '3-3-2': 'C',    // 邊長都是 7 的兩個正三角形
    '3-3-3': 'B',    // ∠L = 180 − 47 − 68 = 65
    '3-3-4': 'A',    // 3x − 2 = x + 8 → x = 5，周長 9 + 13 + 11 = 33
    '3-3-5': 'B',    // 3x − 4 = 11 → x = 5，AC = 13，SSS
    '3-3-6': 'C',    // 以 B 為圓心、c 為半徑
    '3-3-7': 'A',    // 兩邊 9、14，夾角 38°
    '3-3-8': 'D',    // SAS → AD = BC，(46 − 20) ÷ 2 = 13
    '3-3-9': 'C',    // CB = CB' 等腰：180 − 117 = 63
    '3-3-10': 'D',   // 距離 6 < 9 < 13：2 個
    '3-3-11': 'A',   // RHS，另一股 10，面積 120
    '3-3-12': 'B',   // RHS → EF = BC = 15
    '3-3-13': 'D',   // ∠ECF = 56°，CE = CF → ∠CEF = 62°
    '3-3-14': 'A',   // 96 + 87 > 180：作不出
    '3-3-15': 'C',   // AAS → DF = 11，周長 41
    '3-3-16': 'B',   // AAS → 4x − 5 = 19 → x = 6
    '3-3-17': 'B',   // 第三角相等，但不一定全等
    '3-3-18': 'D',   // 對應邊 5 ≠ 8：不全等
    '3-3-19': 'C',   // 61° 角所對的邊是 8：AAS
    '3-3-20': 'C',   // 只有阿蜂（ASA）
    '3-3-21': 'A',   // 共用角 ∠A，SAS
    '3-3-22': 'D',   // ASA → 2x + 5 = 3x − 4 → x = 9，CD = 46
    '3-3-23': 'B',   // (132 − 38) ÷ 2 = 47
    '3-3-24': 'A'    // 補到 △CRQ：面積 = 正方形 = 256
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
const CT_QUIZ_FIGS = {
  // 平行四邊形 ABCD 與對角線 BD：AB = CD = 10、∠ABD = ∠CDB = 34°（AD 依 13 作圖，但不標）
  q8(ctx, W, H) {
    const B0 = cgP(0, 0);
    const dirBA = cgRad(-100), dirBD = cgRad(-66);
    const A0 = cgPolar(B0, 10, dirBA);
    const bd = 10 * Math.cos(cgRad(34)) + Math.sqrt(169 - 100 * Math.pow(Math.sin(cgRad(34)), 2));
    const D0 = cgPolar(B0, bd, dirBD);
    const C0 = cgP(B0.x + D0.x - A0.x, B0.y + D0.y - A0.y);
    const [A, B, C, D] = ctFit([A0, B0, C0, D0], { x: 60, y: 24, w: W - 120, h: H - 48 });
    ctPoly(ctx, [A, B, C, D], CG_INK, 0.06, 2.2);
    cgSeg(ctx, B, D, CG_INK, 2);
    ctTicks(ctx, A, B, 1, CG_HONEY);
    ctTicks(ctx, C, D, 1, CG_HONEY);
    const G = ctCentroid([A, B, C, D]);
    ctSideLabel(ctx, A, B, G, '10', CG_HONEY, 26, f(700, 13));
    ctSideLabel(ctx, C, D, G, '10', CG_HONEY, 26, f(700, 13));
    ctArcs(ctx, B, A, D, 1, CT_ANG[1], 26);
    ctArcs(ctx, D, C, B, 1, CT_ANG[1], 26);
    ctAngText(ctx, B, A, D, '34°', CT_ANG[1], 54, f(700, 12.5));
    ctAngText(ctx, D, C, B, '34°', CT_ANG[1], 54, f(700, 12.5));
    [['A', A], ['B', B], ['C', C], ['D', D]].forEach(([s, P]) => ctVLabel(ctx, P, G, s, CG_INK, 15));
  },
  // 正方形 ABCD：E 在 AB 上、F 在 AD 上，∠BCE = ∠DCF = 17°
  q13(ctx, W, H) {
    const s = 150, x0 = 146, y0 = 30;
    const A = cgP(x0, y0), B = cgP(x0, y0 + s), C = cgP(x0 + s, y0 + s), D = cgP(x0 + s, y0);
    const t = Math.tan(cgRad(17)) * s;
    const E = cgP(x0, y0 + s - t), F = cgP(x0 + s - t, y0);
    ctPoly(ctx, [A, B, C, D], CG_INK, 0.05, 2.2);
    cgSeg(ctx, C, E, CG_INK, 2);
    cgSeg(ctx, C, F, CG_INK, 2);
    cgSeg(ctx, E, F, CG_INK, 2);
    ctArcs(ctx, C, B, E, 1, CT_ANG[0], 40);
    ctArcs(ctx, C, D, F, 1, CT_ANG[0], 40);
    const G = cgP(x0 + s / 2, y0 + s / 2);
    [['A', A], ['B', B], ['C', C], ['D', D]].forEach(([n, P]) => ctVLabel(ctx, P, G, n, CG_INK, 15));
    cgLabel(ctx, E, 'E', CG_INK, -15, 0, fi(700, 16));
    cgLabel(ctx, F, 'F', CG_INK, 0, -15, fi(700, 16));
    textLeft(ctx, '∠1 = ∠2 = 17°', 8, H - 14, CT_ANG[0], f(700, 13));
    ctAngText(ctx, C, B, E, '1', CT_ANG[0], 56, f(800, 12.5));
    ctAngText(ctx, C, D, F, '2', CT_ANG[0], 56, f(800, 12.5));
  },
  // △ABC：AB = 8、∠B = 47°、∠C = 61°
  q19(ctx, W, H) {
    const t = ctFromAngles(47, 61, 1);
    const [A, B, C] = ctFit([t.A, t.B, t.C], { x: 60, y: 30, w: W - 120, h: H - 64 });
    const G = ctCentroid([A, B, C]);
    ctPoly(ctx, [A, B, C], CG_INK, 0.06, 2.2);
    ctArcs(ctx, B, A, C, 1, CT_ANG[1], 24);
    ctArcs(ctx, C, A, B, 2, CT_ANG[2], 24);
    ctAngText(ctx, B, A, C, '47°', CT_ANG[1], 50, f(700, 12.5));
    ctAngText(ctx, C, A, B, '61°', CT_ANG[2], 52, f(700, 12.5));
    ctSideLabel(ctx, A, B, G, '8', CG_HONEY, 18, f(700, 14));
    [['A', A], ['B', B], ['C', C]].forEach(([n, P]) => ctVLabel(ctx, P, G, n, CG_INK, 16));
  },
  // AB 與 CD 交於 E：∠A = ∠B、AE = BE，CE = 2x + 5、DE = 3x − 4
  q22(ctx, W, H) {
    const E = cgP(W / 2, H / 2);
    const A = cgP(E.x - 112, E.y - 40), B = cgP(E.x + 112, E.y + 40);
    const C = cgP(E.x - 46, E.y + 70), D = cgP(E.x + 46, E.y - 70);
    cgSeg(ctx, A, B, CG_INK, 2.2);
    cgSeg(ctx, C, D, CG_INK, 2.2);
    cgSeg(ctx, A, C, CG_INK, 2.2);
    cgSeg(ctx, B, D, CG_INK, 2.2);
    ctTicks(ctx, A, E, 1, CG_HONEY);
    ctTicks(ctx, E, B, 1, CG_HONEY);
    ctArcs(ctx, A, E, C, 1, CT_ANG[0], 24);
    ctArcs(ctx, B, E, D, 1, CT_ANG[0], 24);
    cgLabel(ctx, A, 'A', CG_INK, -14, -6, fi(700, 16));
    cgLabel(ctx, B, 'B', CG_INK, 14, 6, fi(700, 16));
    cgLabel(ctx, C, 'C', CG_INK, -8, 14, fi(700, 16));
    cgLabel(ctx, D, 'D', CG_INK, 8, -14, fi(700, 16));
    cgLabel(ctx, E, 'E', CG_INK, 0, -16, fi(700, 16));
    cgLabel(ctx, cgMid(C, E), '2x + 5', CG_HONEY, 34, 6, f(700, 12.5));
    cgLabel(ctx, cgMid(D, E), '3x − 4', CG_HONEY, -34, -6, f(700, 12.5));
  },
  // 旋轉重疊：∠ABE = 38°、∠DBC = 132°
  q23(ctx, W, H) {
    const t = 132, o = 38, r = (t - o) / 2;
    const B = cgP(W / 2, H - 34), p = 82, q = 112;
    const C = cgPolar(B, q, 0), E = cgPolar(B, q, -cgRad(r));
    const A = cgPolar(B, p, -cgRad(r + o)), D = cgPolar(B, p, -cgRad(t));
    ctPoly(ctx, [A, B, C], CT_ANG[0], 0.08, 2);
    ctPoly(ctx, [D, B, E], CG_SKY, 0.08, 2);
    ctArcs(ctx, B, A, E, 1, CG_HONEY, 26);
    textLeft(ctx, '∠ABE = 38°', 8, 16, CG_HONEY, f(700, 13));
    textLeft(ctx, '∠DBC = 132°', 8, 36, CG_HONEY, f(700, 13));
    cgLabel(ctx, B, 'B', CG_INK, 0, 16, fi(700, 16));
    [['A', A], ['C', C], ['D', D], ['E', E]].forEach(([n, P]) => {
      const u = cgUnit(B, P);
      cgLabel(ctx, P, n, CG_INK, u.x * 14, u.y * 14, fi(700, 16));
    });
  },
  // 正方形 ABCD 邊長 16，P、Q 為 AB、BC 中點，PQ 延長交直線 DC 於 R
  q24(ctx, W, H) {
    const s = 108, x0 = 92, y0 = 18;
    const A = cgP(x0, y0), B = cgP(x0, y0 + s), C = cgP(x0 + s, y0 + s), D = cgP(x0 + s, y0);
    const P = cgMid(A, B), Q = cgMid(B, C), R = cgP(x0 + s, y0 + s + s / 2);
    ctPoly(ctx, [A, B, C, D], CG_INK, 0.05, 2.2);
    cgSeg(ctx, P, R, CG_INK, 2);
    cgSeg(ctx, C, R, CG_INK, 1.8, [5, 4]);
    ctTicks(ctx, A, P, 1, CG_HONEY);
    ctTicks(ctx, P, B, 1, CG_HONEY);
    ctTicks(ctx, B, Q, 2, CG_HONEY);
    ctTicks(ctx, Q, C, 2, CG_HONEY);
    cgLabel(ctx, A, 'A', CG_INK, -14, -4, fi(700, 16));
    cgLabel(ctx, B, 'B', CG_INK, -14, 6, fi(700, 16));
    cgLabel(ctx, C, 'C', CG_INK, 15, -4, fi(700, 16));
    cgLabel(ctx, D, 'D', CG_INK, 14, -4, fi(700, 16));
    cgLabel(ctx, P, 'P', CG_INK, -15, 0, fi(700, 16));
    cgLabel(ctx, Q, 'Q', CG_INK, -4, 16, fi(700, 16));
    cgLabel(ctx, R, 'R', CG_INK, 14, 4, fi(700, 16));
    cgLabel(ctx, cgMid(A, D), '16', CG_HONEY, 0, -12, f(700, 13));
  }
};

function initQuizFigs() {
  document.querySelectorAll('canvas.quiz-fig[data-fig]').forEach(cv => {
    const fn = CT_QUIZ_FIGS[cv.getAttribute('data-fig')];
    if (!fn) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    fn(ctx, cv.width, cv.height);
  });
}

/* ==========================================================================
   重點 1：全等的意義——平移、旋轉、翻轉後完全疊合
   ========================================================================== */
function initOvCanvas() {
  const cv = hbEl('canvas-ov');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sl = hbEl('ov-t'), vl = hbEl('ov-vt');
  const g = hbEl('ov-mode-group');
  const out = hbEl('ov-formula'), fb = hbEl('ov-feedback');
  let mode = 'slide';
  // 同一個三角形的形狀（A、B、C 三點），兩個三角形都由它擺出來
  const base = [cgP(46, -118), cgP(0, 0), cgP(156, 0)];
  const START = {
    slide: { ang: 0, flip: false, name: '平移', how: '整個三角形直接滑過去，不轉也不翻。' },
    turn: { ang: cgRad(150), flip: false, name: '旋轉', how: '一邊滑過去、一邊轉回原來的方向。' },
    flip: { ang: 0, flip: true, name: '翻轉', how: '△DEF 是翻面的，要把它整片翻過來才疊得上。' }
  };

  function draw() {
    const t = hbIv(sl) / 10;
    vl.textContent = `${Math.round(t * 100)}%`;
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '把 △DEF 搬到 △ABC 上：能完全疊合嗎？', CT_TONE[0]);
    const S = START[mode];
    const G0 = cgP(150, 230);
    const abc = ctPose(base, 0, 1, G0.x, G0.y);
    const sx = S.flip ? (2 * t - 1) : 1;
    const def = ctPose(base, S.ang * (1 - t), sx, G0.x + 240 * (1 - t), G0.y);
    const done = (t >= 1);

    const marks = (P, lineCol) => {
      ctTicks(ctx, P[0], P[1], 1, lineCol);
      ctTicks(ctx, P[1], P[2], 2, lineCol);
      ctTicks(ctx, P[2], P[0], 3, lineCol);
    };
    // △ABC：已知（象牙）
    ctPoly(ctx, abc, CG_INK, 0.1, 2.6);
    marks(abc, CG_INK);
    [0, 1, 2].forEach(i => ctArcs(ctx, abc[i], abc[(i + 1) % 3], abc[(i + 2) % 3], i + 1, CT_ANG[i], 22));
    // △DEF：移動中（苔綠，虛線）
    const thin = Math.abs(sx) < 0.18;
    ctPoly(ctx, def, CG_MOSS, done ? 0 : 0.12, 2.6, done ? [7, 5] : null);
    if (!thin) {
      marks(def, CG_MOSS);
      if (!done) [0, 1, 2].forEach(i => ctArcs(ctx, def[i], def[(i + 1) % 3], def[(i + 2) % 3], i + 1, CT_ANG[i], 22));
    }
    const Ga = ctCentroid(abc), Gd = ctCentroid(def);
    if (done) {
      ['A (D)', 'B (E)', 'C (F)'].forEach((s, i) => ctVLabel(ctx, abc[i], Ga, s, CG_INK, 30));
    } else {
      ['A', 'B', 'C'].forEach((s, i) => ctVLabel(ctx, abc[i], Ga, s, CG_INK));
      if (!thin) ['D', 'E', 'F'].forEach((s, i) => ctVLabel(ctx, def[i], Gd, s, CG_MOSS));
    }

    // 下方說明
    drawPanel(ctx, 12, H - 112, W - 24, 100, done ? CG_MOSS : CG_HONEY, 0.1);
    textLeft(ctx, `${S.name}：${S.how}`, 26, H - 90, '#f1f5f9', f(700, 15));
    if (done) {
      ctRow(ctx, '完全疊合！A 和 D、B 和 E、C 和 F 疊在一起，是對應點。刻痕條數相同的邊、弧條數相同的角也疊在一起。', 26, H - 62, W - 52, CG_MOSS, f(600, 15), 20, 2);
    } else {
      ctRow(ctx, `疊合進度 ${Math.round(t * 100)}%。注意：搬的過程中，三個邊長和三個角都沒有改變。`, 26, H - 62, W - 52, '#e2e8f0', f(600, 15), 20, 2);
    }

    ctDbg('ov', { mode, t, abc, def });
    if (done) {
      out.innerHTML = '\\(\\triangle ABC \\cong \\triangle DEF\\)<wbr>：\\(A \\leftrightarrow D\\)、<wbr>\\(B \\leftrightarrow E\\)、<wbr>\\(C \\leftrightarrow F\\)';
      fb.innerHTML = wrapFeedback('對應邊相等：\\(\\overline{AB} = \\overline{DE}\\)、\\(\\overline{BC} = \\overline{EF}\\)、\\(\\overline{CA} = \\overline{FD}\\)；對應角相等：\\(\\angle A = \\angle D\\)、\\(\\angle B = \\angle E\\)、\\(\\angle C = \\angle F\\)。寫 \\(\\triangle ABC \\cong \\triangle DEF\\) 時，字母依對應的順序排。');
    } else {
      out.innerHTML = `${S.name}中：疊合進度 \\(${Math.round(t * 100)}\\%\\)`;
      fb.innerHTML = wrapFeedback(S.flip
        ? '翻轉是把三角形整片翻面：邊長、角度都不變，只是左右對調。拉到 \\(100\\%\\) 看看能不能疊合。'
        : '平移、旋轉只改變位置與方向，不改變形狀與大小。拉到 \\(100\\%\\) 看看能不能疊合。');
    }
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-ov-mode', v => { mode = v; draw(); });
  sl.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 2：依記號的順序找對應角，求出所有角
   ========================================================================== */
function initCrCanvas() {
  const cv = hbEl('canvas-cr');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sA = hbEl('cr-a'), sF = hbEl('cr-f');
  const vA = hbEl('cr-va'), vF = hbEl('cr-vf');
  const g = hbEl('cr-map-group');
  const out = hbEl('cr-formula'), fb = hbEl('cr-feedback');
  let map = 'def';
  // names[i]：△ABC 第 i 個頂點（A、B、C）在另一個三角形的對應點；ang／flip 是另一個三角形的擺法
  const MAPS = {
    def: { names: ['D', 'E', 'F'], ang: 160, flip: false },
    efd: { names: ['E', 'F', 'D'], ang: -120, flip: false },
    dfe: { names: ['D', 'F', 'E'], ang: 15, flip: true },
    edf: { names: ['E', 'D', 'F'], ang: 200, flip: true }
  };

  function draw() {
    const a = hbIv(sA), fv = hbIv(sF);
    vA.textContent = a;
    vF.textContent = fv;
    const M = MAPS[map];
    const ABC = ['A', 'B', 'C'];
    const iF = M.names.indexOf('F');            // ∠F 對應 △ABC 的哪一個角
    const angs = [a, 0, 0];
    angs[iF] = fv;
    const iLast = [1, 2].find(i => i !== iF);   // 剩下要用內角和求的角
    angs[iLast] = 180 - a - fv;

    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const note = `△ABC ≅ △${M.names.join('')}`;
    drawTitle(ctx, `${note}：∠F 對應到哪一個角？`, CT_TONE[1]);

    const t0 = ctFromAngles(angs[1], angs[2], 1);
    const pts0 = [t0.A, t0.B, t0.C];
    const L = ctFit(pts0, { x: 22, y: 66, w: 230, h: 162 });
    const R0 = ctPose(L, cgRad(M.ang), M.flip ? -1 : 1, 0, 0);
    const R = ctFit(R0, { x: 288, y: 66, w: 230, h: 162 });
    const GL = ctCentroid(L), GR = ctCentroid(R);
    ctPoly(ctx, L, CG_INK, 0.08, 2.4);
    ctPoly(ctx, R, CG_MOSS, 0.08, 2.4);
    [0, 1, 2].forEach(i => {
      const known = (i === 0);
      ctArcs(ctx, L[i], L[(i + 1) % 3], L[(i + 2) % 3], i + 1, CT_ANG[i], 18);
      ctArcs(ctx, R[i], R[(i + 1) % 3], R[(i + 2) % 3], i + 1, CT_ANG[i], 18);
      ctVLabel(ctx, L[i], GL, ABC[i], CG_INK);
      ctVLabel(ctx, R[i], GR, M.names[i], CG_MOSS);
      // 已知的兩個角標在題目給的位置：∠A 在左邊、∠F 在右邊
      if (known) ctAngText(ctx, L[i], L[(i + 1) % 3], L[(i + 2) % 3], `${a}°`, CT_ANG[i], 40, f(700, 13));
      if (i === iF) ctAngText(ctx, R[i], R[(i + 1) % 3], R[(i + 2) % 3], `${fv}°`, CT_ANG[i], 40, f(700, 13));
    });

    // 推導（寫在畫布上）
    const nm = M.names;
    const y0 = 262;
    drawPanel(ctx, 12, y0 - 18, W - 24, H - y0 + 6, CT_TONE[1], 0.08);
    const rows = [
      [`① 依順序配對：A↔${nm[0]}、B↔${nm[1]}、C↔${nm[2]}`, '#f1f5f9'],
      [`② ∠F 對應 ∠${ABC[iF]}：∠${ABC[iF]} = ∠F = ${fv}°`, CT_ANG[iF]],
      [`③ 內角和：∠${ABC[iLast]} = 180° − ${a}° − ${fv}° = ${angs[iLast]}°`, CT_ANG[iLast]],
      [`④ ∠${nm[0]} = ∠A = ${a}°，∠${nm[iLast]} = ∠${ABC[iLast]} = ${angs[iLast]}°`, '#f1f5f9']
    ];
    rows.forEach((r, i) => ctRow(ctx, r[0], 28, y0 + i * 36, W - 56, r[1], f(700, 16), 20, 1));

    ctDbg('cr', { a, fv, map, iF, iLast, angs, L, R, names: M.names });
    out.innerHTML = `\\(\\angle ${ABC[iF]} = \\angle F = ${fv}^\\circ\\)，<wbr>${wbrEq(`\\angle ${ABC[iLast]} = 180^\\circ - ${a}^\\circ - ${fv}^\\circ = ${angs[iLast]}^\\circ`)}`;
    fb.innerHTML = wrapFeedback(`記號 \\(\\triangle ABC \\cong \\triangle ${nm.join('')}\\) 的第 \\(${iF + 1}\\) 個字母是 \\(F\\)，所以 \\(\\angle F\\) 對應的是 \\(\\angle ${ABC[iF]}\\)，不是位置看起來像的那個角。換一種寫法，\\(\\angle F\\) 就改對應別的角。`);
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-cr-map', v => { map = v; draw(); });
  [sA, sF].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 3：SSS 作圖與 SSS 全等性質
   ========================================================================== */
function initSssCanvas() {
  const cv = hbEl('canvas-sss');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('sss-a'), sb = hbEl('sss-b'), sc = hbEl('sss-c');
  const va = hbEl('sss-va'), vb = hbEl('sss-vb'), vc = hbEl('sss-vc');
  const g = hbEl('sss-side-group');
  const out = hbEl('sss-formula'), fb = hbEl('sss-feedback');
  const st = { k: 1 };
  let side = 'up';
  const PX = 34;

  function draw() {
    const a = hbIv(sa) / 2, b = hbIv(sb) / 2, c = hbIv(sc) / 2;
    va.textContent = a.toFixed(1);
    vb.textContent = b.toFixed(1);
    vc.textContent = c.toFixed(1);
    const ra = a * PX, rb = b * PX, rc = c * PX;
    const up = (side === 'up');
    const Y = up ? 372 : 150;
    const B = cgP(270 - ra / 2, Y), C = cgP(270 + ra / 2, Y);
    const xs = cgCC(B, rc, C, rb);
    const A = xs.length === 2 ? (up ? cgUpper(xs) : cgLower(xs)) : null;
    const halfArc = (g2, cen, r) => (up
      ? cgArc(g2, cen, r, Math.PI + 0.12, 2 * Math.PI - 0.12, CG_HONEY)
      : cgArc(g2, cen, r, 0.12, Math.PI - 0.12, CG_HONEY));
    const sideWord = up ? '上' : '下';

    const steps = [
      { tool: 'compass', text: '作一直線 L，取一點 B；以 B 為圓心、a 為半徑畫弧交 L 於 C：BC = a。',
        compass: { c: B, r: ra, ang: 0, label: 'a' },
        draw: g2 => { cgSeg(g2, cgP(B.x - 34, Y), cgP(C.x + 34, Y), CG_SKY, 1.6); cgArcDir(g2, B, ra, 0, 0.2, CG_HONEY); cgSeg(g2, B, C, CG_INK, 3); } },
      { tool: 'compass', text: `以 B 為圓心、c 為半徑，在 L 的${sideWord}方畫弧。`,
        compass: { c: B, r: rc, ang: A ? cgAng(B, A) : (up ? -Math.PI / 3 : Math.PI / 3), label: 'c' },
        draw: g2 => (A ? cgArcAt(g2, B, rc, [A], 0.4, CG_HONEY) : halfArc(g2, B, rc)) },
      { tool: 'compass', text: `以 C 為圓心、b 為半徑，在 L 的同一側（${sideWord}方）畫弧。`,
        compass: { c: C, r: rb, ang: A ? cgAng(C, A) : (up ? -2 * Math.PI / 3 : 2 * Math.PI / 3), label: 'b' },
        draw: g2 => (A ? cgArcAt(g2, C, rb, [A], 0.4, CG_HONEY) : halfArc(g2, C, rb)) }
    ];
    let why = '';
    let angA = 0, angB = 0, angC = 0;
    if (A) {
      angA = cgAngDeg(A, B, C);
      angB = cgAngDeg(B, A, C);
      angC = cgAngDeg(C, A, B);
      const G = ctCentroid([A, B, C]);
      steps.push({ tool: 'ruler', text: '兩弧交於 A，連接 AB、AC，△ABC 即為所求。', ruler: [B, A],
        draw: g2 => {
          cgSeg(g2, A, B, CG_MOSS, 3.5); cgSeg(g2, A, C, CG_MOSS, 3.5);
          ctSideLabel(g2, A, B, G, `c = ${c.toFixed(1)}`, CG_MOSS, 26, f(700, 14));
          ctSideLabel(g2, A, C, G, `b = ${b.toFixed(1)}`, CG_MOSS, 26, f(700, 14));
        } });
      steps.push({ tool: 'look',
        text: `三邊一確定，三個角也跟著確定。按「交點取${up ? '下' : '上'}方」再作一次：作出的三角形翻過來，和這一個完全疊合。`,
        draw: g2 => {
          ctArcs(g2, A, B, C, 1, CT_ANG[0], 20);
          ctArcs(g2, B, A, C, 2, CT_ANG[1], 20);
          ctArcs(g2, C, A, B, 3, CT_ANG[2], 20);
        } });
    } else {
      if (rb + rc <= ra + 1e-6) {
        why = (Math.abs(rb + rc - ra) < 1e-6)
          ? 'b + c 剛好等於 a：兩弧只碰在直線 BC 上一點，圍不成三角形。'
          : 'b + c 比 a 短：兩弧碰不到，沒有交點，作不出三角形。';
      } else {
        why = (Math.abs(Math.abs(rb - rc) - ra) < 1e-6)
          ? '一邊比另一邊長出剛好 a：兩弧只碰在直線 BC 上一點，圍不成三角形。'
          : '一邊比另一邊長太多：大的弧把小的整個包住，兩弧碰不到，作不出三角形。';
      }
      steps.push({ tool: 'warn', text: why + '調整 a、b、c 再試。' });
    }
    cgSync('sss', st, steps.length);

    cgRender(ctx, {
      title: '已知三邊 a、b、c，作 △ABC（SSS 作圖）', color: CT_TONE[2], k: st.k, steps,
      given: g2 => {
        [[a, 'a', 58], [b, 'b', 80], [c, 'c', 102]].forEach(([len, nm, y]) => {
          if (!up && y > 110) return;
          cgSeg(g2, cgP(46, y), cgP(46 + len * PX, y), CG_INK, 3);
          textLeft(g2, nm, 24, y, CG_INK, fi(700, 17));
        });
      },
      pts: [
        { p: B, n: 'B', s: 1, dx: -12, dy: up ? 20 : -20 }, { p: C, n: 'C', s: 1, dx: 12, dy: up ? 20 : -20 },
        A ? { p: A, n: 'A', s: 4, c: CG_MOSS, dx: 0, dy: up ? -20 : 20 } : null
      ],
      measure: (A && st.k === 5) ? [`量一量：∠A = ${Math.round(angA)}°，∠B = ${Math.round(angB)}°，∠C = ${Math.round(angC)}°`, CG_MOSS] : null
    });

    ctDbg('sss', { a, b, c, PX, A, B, C, side, k: st.k });
    if (A) {
      out.innerHTML = `\\(\\overline{BC} = ${a.toFixed(1)}\\)，<wbr>\\(\\overline{CA} = ${b.toFixed(1)}\\)，<wbr>\\(\\overline{AB} = ${c.toFixed(1)}\\) 公分`;
      fb.innerHTML = wrapFeedback('\\(A\\) 在以 \\(B\\) 為圓心、\\(c\\) 為半徑的弧上，也在以 \\(C\\) 為圓心、\\(b\\) 為半徑的弧上。兩弧只交在 \\(\\overline{BC}\\) 的上、下各一點，兩種作法得到的三角形翻過來就疊合：三邊確定，三角形就只有一種。');
    } else {
      out.innerHTML = `\\(a = ${a.toFixed(1)}\\)，<wbr>\\(b = ${b.toFixed(1)}\\)，<wbr>\\(c = ${c.toFixed(1)}\\)：作不出三角形`;
      fb.innerHTML = wrapFeedback(`目前 \\(a = ${a.toFixed(1)}\\)、\\(b = ${b.toFixed(1)}\\)、\\(c = ${c.toFixed(1)}\\)。${why}`);
    }
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-sss-side', v => { side = v; draw(); });
  cgSteps('sss', st, draw);
  [sa, sb, sc].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 4：SAS 作圖與 SAS 全等性質
   ========================================================================== */
function initSasCanvas() {
  const cv = hbEl('canvas-sas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('sas-a'), sc = hbEl('sas-c'), sAng = hbEl('sas-ang');
  const va = hbEl('sas-va'), vc = hbEl('sas-vc'), vAng = hbEl('sas-vang');
  const out = hbEl('sas-formula'), fb = hbEl('sas-feedback');
  const st = { k: 1 };
  const PX = 32;

  function draw() {
    const a = hbIv(sa) / 2, c = hbIv(sc) / 2, th = hbIv(sAng);
    va.textContent = a.toFixed(1);
    vc.textContent = c.toFixed(1);
    vAng.textContent = th;
    const ra = a * PX, rc = c * PX, rad = cgRad(th);
    const Y = 372;
    const B = cgP(120 + Math.max(0, -rc * Math.cos(rad)), Y);
    const A = cgPolar(B, rc, -rad), C = cgP(B.x + ra, Y);
    const ray1 = cgPolar(B, rc + 60, -rad), ray2 = cgP(C.x + 50, Y);
    const G = ctCentroid([A, B, C]);
    const AC = cgDist(A, C) / PX;
    const angA = cgAngDeg(A, B, C), angC = cgAngDeg(C, A, B);
    // 已知的 ∠1（左上角的小圖）
    const V = cgP(96, 112), V1 = cgPolar(V, 62, 0), V2 = cgPolar(V, 62, -rad);

    const steps = [
      { tool: 'compass', text: '用等角作圖作 ∠B = ∠1：B 為頂點，一邊水平。',
        draw: g2 => {
          cgSeg(g2, B, ray1, CG_SKY, 1.8); cgSeg(g2, B, ray2, CG_SKY, 1.8);
          ctArcs(g2, B, ray2, ray1, 1, CT_ANG[1], 22);
        } },
      { tool: 'compass', text: '在 ∠B 的一邊上，以 B 為圓心、c 為半徑畫弧，交於 A：BA = c。',
        compass: { c: B, r: rc, ang: -rad, label: 'c' }, draw: g2 => cgArcDir(g2, B, rc, -rad, 0.2, CG_HONEY) },
      { tool: 'compass', text: '在 ∠B 的另一邊上，以 B 為圓心、a 為半徑畫弧，交於 C：BC = a。',
        compass: { c: B, r: ra, ang: 0, label: 'a' }, draw: g2 => cgArcDir(g2, B, ra, 0, 0.2, CG_HONEY) },
      { tool: 'ruler', text: '連接 AC，△ABC 即為所求。', ruler: [A, C],
        draw: g2 => {
          cgSeg(g2, A, B, CG_INK, 3.2); cgSeg(g2, B, C, CG_INK, 3.2); cgSeg(g2, A, C, CG_MOSS, 3.5);
          ctTicks(g2, A, B, 1, CG_HONEY); ctTicks(g2, B, C, 2, CG_HONEY);
        } },
      { tool: 'look', text: '第三邊 AC 沒有選擇的餘地：兩邊和它們的夾角一確定，AC 的長與另外兩個角也都確定了。',
        draw: g2 => ctSideLabel(g2, A, C, G, `${AC.toFixed(1)} 公分`, CG_MOSS, 24, f(700, 14)) }
    ];
    cgSync('sas', st, steps.length);

    cgRender(ctx, {
      title: '已知兩邊 a、c 及夾角 ∠1，作 △ABC（SAS 作圖）', color: CT_TONE[3], k: st.k, steps,
      given: g2 => {
        cgSeg(g2, V, V1, CG_INK, 2.6); cgSeg(g2, V, V2, CG_INK, 2.6);
        ctArcs(g2, V, V1, V2, 1, CT_ANG[1], 18);
        cgLabel(g2, V, `∠1 = ${th}°`, CT_ANG[1], 0, 20, f(700, 14));
        [[a, 'a', 60], [c, 'c', 86]].forEach(([len, nm, y]) => {
          const x0 = 520 - len * PX;
          cgSeg(g2, cgP(x0, y), cgP(520, y), CG_INK, 3);
          textLeft(g2, nm, x0 - 20, y, CG_INK, fi(700, 17));
        });
      },
      pts: [
        { p: B, n: 'B', s: 1, dx: -6, dy: 20 },
        { p: A, n: 'A', s: 2, c: CG_HONEY, dx: (A.x - G.x) > 0 ? 14 : -14, dy: -14 },
        { p: C, n: 'C', s: 3, c: CG_HONEY, dx: 6, dy: 20 }
      ],
      measure: st.k === 5 ? [`量一量：AC = ${AC.toFixed(1)} 公分，∠A = ${Math.round(angA)}°，∠C = ${Math.round(angC)}°`, CG_MOSS] : null
    });

    ctDbg('sas', { a, c, th, PX, A, B, C, AC });
    out.innerHTML = `\\(\\overline{BA} = ${c.toFixed(1)}\\)，<wbr>\\(\\angle B = ${th}^\\circ\\)，<wbr>\\(\\overline{BC} = ${a.toFixed(1)}\\)<wbr>\\(\\;\\Rightarrow\\;\\overline{AC} \\approx ${AC.toFixed(1)}\\) 公分`;
    fb.innerHTML = wrapFeedback(st.k < 5
      ? '\\(\\angle B\\) 夾在 \\(\\overline{BA}\\) 和 \\(\\overline{BC}\\) 之間，所以叫「夾角」；記號 SAS 把 A 寫在兩個 S 中間，就是這個意思。'
      : '換一組 \\(a\\)、\\(c\\)、\\(\\angle 1\\) 再作一次：每一組都只作得出一種三角形。所以兩組邊和它們的夾角對應相等，兩個三角形就全等。');
    typeset([out, fb]);
  }

  cgSteps('sas', st, draw);
  [sa, sc, sAng].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 5：SSA 不一定全等——弧可能交出兩個點
   ========================================================================== */
function initSsaCanvas() {
  const cv = hbEl('canvas-ssa');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sAng = hbEl('ssa-ang'), sa = hbEl('ssa-a');
  const vAng = hbEl('ssa-vang'), va = hbEl('ssa-va');
  const out = hbEl('ssa-formula'), fb = hbEl('ssa-feedback');
  const st = { k: 1 };
  const PX = 36, b = 5, rb = b * PX;

  function draw() {
    const th = hbIv(sAng), a = hbIv(sa) / 2;
    vAng.textContent = th;
    va.textContent = a.toFixed(1);
    const ra = a * PX, rad = cgRad(th);
    const Y = 372;
    const A = cgP(th > 90 ? 210 : 60, Y);
    const C = cgPolar(A, rb, -rad);
    const end = cgP(530, Y);
    const raw = cgLC(A, end, C, ra);
    const xs = raw.filter(p => p.x - A.x > 0.5);
    const n = xs.length;
    const tangent = (raw.length === 1 && n === 1);
    const Bs = xs.slice().sort((p, q) => q.x - p.x);   // 遠的叫 B、近的叫 B′
    const Bf = Bs[0] || null, Bn = n === 2 ? Bs[1] : null;
    const foot = cgP(C.x, Y);
    const upRay = cgPolar(A, rb + 50, -rad);

    let look;
    if (n === 0) look = '弧碰不到水平那一邊：a 比 C 到這一邊的距離（虛線）還短，作不出三角形。';
    else if (tangent) look = 'a 剛好等於 C 到這一邊的距離：弧只碰到一點，∠B = 90°，只作得出一個三角形。';
    else if (n === 1) look = '另一個交點落在 A 的另一側，不在這一邊上：只作得出一個三角形。';
    else look = '弧交這一邊於 B、B′ 兩點：△ABC 和 △AB′C 都符合這三個條件，卻明顯不一樣——SSA 不能保證全等。';

    const steps = [
      { tool: 'compass', text: '作 ∠A = ∠1，讓一邊水平（B 要落在這一邊上）。',
        draw: g2 => {
          cgSeg(g2, A, end, CG_SKY, 1.8); cgSeg(g2, A, upRay, CG_SKY, 1.8);
          ctArcs(g2, A, end, upRay, 1, CT_ANG[0], 22);
        } },
      { tool: 'compass', text: '在另一邊上，以 A 為圓心、b 為半徑畫弧，取 C 點：AC = b。',
        compass: { c: A, r: rb, ang: -rad, label: 'b' }, draw: g2 => cgArcDir(g2, A, rb, -rad, 0.2, CG_HONEY) },
      { tool: 'compass', text: '以 C 為圓心、a 為半徑畫弧，看它和水平那一邊交在哪裡。',
        compass: { c: C, r: ra, ang: n ? cgAng(C, Bf) : Math.PI / 2, label: 'a' },
        draw: g2 => {
          cgSeg(g2, C, foot, CG_LAV, 1.6, [5, 4]);
          if (n) cgArcAt(g2, C, ra, xs, 0.25, CG_HONEY);
          else cgArc(g2, C, ra, Math.PI / 2 - 0.7, Math.PI / 2 + 0.7, CG_HONEY);
        } },
      { tool: n === 2 ? 'warn' : 'look', text: look,
        draw: g2 => {
          if (Bf) ctPoly(g2, [A, Bf, C], CG_MOSS, 0.14, 3);
          if (Bn) ctPoly(g2, [A, Bn, C], CG_ROSE, 0.16, 3, [7, 5]);
        } }
    ];
    cgSync('ssa', st, steps.length);

    const pts = [
      { p: A, n: 'A', s: 0, dx: -8, dy: 20 },
      { p: C, n: 'C', s: 2, c: CG_HONEY, dx: 14, dy: -12 }
    ];
    if (Bf) pts.push({ p: Bf, n: 'B', s: 3, c: CG_MOSS, dx: 6, dy: 20 });
    if (Bn) pts.push({ p: Bn, n: 'B′', s: 3, c: CG_ROSE, dx: -4, dy: 20 });
    let measure = null;
    if (st.k === 4 && n === 2) {
      measure = [`量一量：BC = B′C = ${a.toFixed(1)}，但 AB = ${(cgDist(A, Bf) / PX).toFixed(1)}、AB′ = ${(cgDist(A, Bn) / PX).toFixed(1)} 公分`, CG_ROSE];
    } else if (st.k === 4 && n === 1) {
      measure = [`量一量：AB = ${(cgDist(A, Bf) / PX).toFixed(1)} 公分，∠B = ${Math.round(cgAngDeg(Bf, A, C))}°`, CG_MOSS];
    }

    cgRender(ctx, {
      title: '兩邊及其中一邊的對角（SSA）：作得出幾個三角形？', color: CT_TONE[4], k: st.k, steps,
      given: g2 => {
        textLeft(g2, `∠1 = ${th}°，b = ${b}，a = ${a.toFixed(1)}（公分）`, 24, 62, CG_INK, f(700, 15));
      },
      pts, measure
    });

    ctDbg('ssa', { th, a, b, PX, A, C, n, Bf, Bn, tangent });
    out.innerHTML = `\\(\\angle A = ${th}^\\circ\\)，<wbr>\\(\\overline{AC} = ${b}\\)，<wbr>\\(\\overline{CB} = ${a.toFixed(1)}\\)：<wbr>作得出 \\(${n}\\) 個三角形`;
    fb.innerHTML = wrapFeedback(n === 2
      ? '同樣的兩邊、同樣的 \\(\\angle A\\)，作出兩個大小不同的三角形。所以只知道 SSA，<strong>不一定</strong>全等（不是「一定不全等」）。'
      : (n === 0
        ? '把 \\(a\\) 調長一點，讓弧碰到水平那一邊，再看看交出幾個點。'
        : '這一組剛好只有一個三角形；但換一組數字（例如把 \\(\\angle 1\\) 調小、\\(a\\) 調到比 \\(5\\) 短一些）就可能交出兩點。只要有可能交出兩點，SSA 就不能當作全等性質。'));
    typeset([out, fb]);
  }

  cgSteps('ssa', st, draw);
  [sAng, sa].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 6：RHS——已知斜邊與一股，作直角三角形
   ========================================================================== */
function initRhsCanvas() {
  const cv = hbEl('canvas-rhs');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sH = hbEl('rhs-h'), sS = hbEl('rhs-s');
  const vH = hbEl('rhs-vh'), vS = hbEl('rhs-vs');
  const out = hbEl('rhs-formula'), fb = hbEl('rhs-feedback');
  const st = { k: 1 };
  const U = 21;

  function draw() {
    const Hh = hbIv(sH), S = hbIv(sS);
    vH.textContent = Hh;
    vS.textContent = S;
    const Y = 376;
    const P = cgP(150, Y), R = cgP(150, Y - S * U);
    const Lr = cgP(520, Y);
    const ok = S < Hh;
    const Q = ok ? cgLC(P, Lr, R, Hh * U).filter(p => p.x > P.x)[0] : null;
    const N = Hh * Hh - S * S;

    const steps = [
      { tool: 'ruler', text: '作直線 L，再過 L 上一點 P 作直線 M ⊥ L（過線上一點作垂線）。', ruler: [cgP(60, Y), Lr],
        draw: g2 => {
          cgSeg(g2, cgP(40, Y), cgP(525, Y), CG_SKY, 1.8);
          cgSeg(g2, cgP(150, Y + 20), cgP(150, 120), CG_SKY, 1.8);
          ctRightMark(g2, P, cgP(200, Y), cgP(150, Y - 40), CG_SKY, 14);
          textLeft(g2, 'L', 508, Y - 16, CG_SKY, fi(700, 17));
          textLeft(g2, 'M', 160, 128, CG_SKY, fi(700, 17));
        } },
      { tool: 'compass', text: '以 P 為圓心、股長 S 為半徑畫弧，交 M 於 R：PR = S。',
        compass: { c: P, r: S * U, ang: -Math.PI / 2, label: 'S' }, draw: g2 => cgArcDir(g2, P, S * U, -Math.PI / 2, 0.25, CG_HONEY) }
    ];
    if (ok) {
      steps.push({ tool: 'compass', text: '以 R 為圓心、斜邊長 H 為半徑畫弧，交 L 於 Q。',
        compass: { c: R, r: Hh * U, ang: cgAng(R, Q), label: 'H' }, draw: g2 => cgArcAt(g2, R, Hh * U, [Q], 0.18, CG_HONEY) });
      steps.push({ tool: 'ruler', text: '連接 QR，△PQR 即為所求：∠P = 90°、斜邊 RQ = H、一股 PR = S。', ruler: [R, Q],
        draw: g2 => {
          ctPoly(g2, [P, Q, R], CG_MOSS, 0.12, 3.2);
          ctRightMark(g2, P, Q, R, CG_MOSS, 14);
        } });
      steps.push({ tool: 'look', text: '第三邊 PQ 不必量：由畢氏定理 PQ² = H² − S²，三邊都確定了——又回到 SSS。',
        draw: g2 => cgSeg(g2, P, Q, CG_HONEY, 4) });
    } else {
      steps.push({ tool: 'warn', text: S === Hh
        ? '股和斜邊一樣長：弧只碰到 P，圍不成三角形。斜邊一定比股長。'
        : '股比斜邊還長：弧碰不到 L。直角三角形裡，斜邊一定是最長的邊。' });
    }
    cgSync('rhs', st, steps.length);

    cgRender(ctx, {
      title: '已知斜邊 H 與一股 S，作直角三角形 PQR', color: CT_TONE[5], k: st.k, steps,
      given: g2 => {
        [[Hh, 'H', 62], [S, 'S', 88]].forEach(([len, nm, y]) => {
          cgSeg(g2, cgP(290, y), cgP(290 + len * U, y), CG_INK, 3);
          textLeft(g2, nm, 266, y, CG_INK, fi(700, 17));
        });
      },
      pts: [
        { p: P, n: 'P', s: 1, c: CG_SKY, dx: -14, dy: 18 },
        { p: R, n: 'R', s: 2, c: CG_HONEY, dx: -16, dy: -6 },
        Q ? { p: Q, n: 'Q', s: 3, c: CG_HONEY, dx: 6, dy: 20 } : null
      ],
      measure: (ok && st.k === 5) ? [`量一量：PQ = ${(cgDist(P, Q) / U).toFixed(2)} 單位長`, CG_HONEY] : null
    });

    ctDbg('rhs', { Hh, S, U, P, Q, R, N, ok });
    if (ok) {
      const simp = ctSurdTex(N);
      const sq = Number.isInteger(Math.sqrt(N)) ? simp : (simp === `\\sqrt{${N}}` ? simp : `\\sqrt{${N}} = ${simp}`);
      out.innerHTML = `${wbrEq(`\\overline{PQ}^2 = ${Hh}^2 - ${S}^2 = ${N}`)}，<wbr>${wbrEq(`\\overline{PQ} = ${sq}`)}`;
      fb.innerHTML = wrapFeedback('兩個直角三角形只要斜邊與一股對應相等，第三邊也一定相等，就能用 SSS 證全等——這就是 <strong>RHS</strong>：R 是直角、H 是斜邊、S 是一股。');
    } else {
      out.innerHTML = `\\(H = ${Hh}\\)，<wbr>\\(S = ${S}\\)：作不出直角三角形`;
      fb.innerHTML = wrapFeedback(`目前股 \\(S = ${S}\\)${S === Hh ? '等於' : '大於'}斜邊 \\(H = ${Hh}\\)。直角三角形的斜邊比兩股都長，把 \\(S\\) 調得比 \\(H\\) 短再試。`);
    }
    typeset([out, fb]);
  }

  cgSteps('rhs', st, draw);
  [sH, sS].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 7：ASA 作圖與 ASA 全等性質
   ========================================================================== */
function initAsaCanvas() {
  const cv = hbEl('canvas-asa');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('asa-a'), s1 = hbEl('asa-b'), s2 = hbEl('asa-c');
  const va = hbEl('asa-va'), v1 = hbEl('asa-vb'), v2 = hbEl('asa-vc');
  const out = hbEl('asa-formula'), fb = hbEl('asa-feedback');
  const st = { k: 1 };

  function draw() {
    const a = hbIv(sa) / 2, b1 = hbIv(s1), b2 = hbIv(s2);
    va.textContent = a.toFixed(1);
    v1.textContent = b1;
    v2.textContent = b2;
    const sum = b1 + b2;
    const ok = sum < 180;
    // 先用公分算出形狀，再挑一個畫得下的比例尺（最大 36px／公分）
    let px = 36;
    let shape = null;
    if (ok) {
      shape = ctFromAngles(b1, b2, a);
      const bx = ctBox([shape.A, shape.B, shape.C]);
      px = Math.min(36, 236 / (bx.y1 - bx.y0), 470 / (bx.x1 - bx.x0));
    }
    const Y = 372;
    let B, C, A = null;
    if (ok) {
      const bx = ctBox([shape.A, shape.B, shape.C]);
      const ox = 270 - (bx.x0 + bx.x1) / 2 * px;
      B = cgP(ox, Y);
      C = cgP(ox + a * px, Y);
      A = cgP(ox + shape.A.x * px, Y + shape.A.y * px);
    } else {
      B = cgP(270 - a * px / 2, Y);
      C = cgP(270 + a * px / 2, Y);
    }
    const r1 = cgPolar(B, 700, -cgRad(b1)), r2 = cgPolar(C, 700, -cgRad(180 - b2));
    const ra = cgDist(B, C);

    const steps = [
      { tool: 'compass', text: '作 BC = a：以 B 為圓心、a 為半徑畫弧交直線於 C。',
        compass: { c: B, r: ra, ang: 0, label: 'a' },
        draw: g2 => { cgSeg(g2, cgP(B.x - 30, Y), cgP(C.x + 30, Y), CG_SKY, 1.6); cgArcDir(g2, B, ra, 0, 0.2, CG_HONEY); cgSeg(g2, B, C, CG_INK, 3); ctTicks(g2, B, C, 1, CG_HONEY); } },
      { tool: 'compass', text: '以 B 為頂點、BC 為一邊，用等角作圖作 ∠B = ∠1。',
        draw: g2 => { cgSeg(g2, B, r1, CG_SKY, 1.8); ctArcs(g2, B, C, r1, 1, CT_ANG[1], 24); } },
      { tool: 'compass', text: '以 C 為頂點、CB 為一邊，在同一側作 ∠C = ∠2。',
        draw: g2 => { cgSeg(g2, C, r2, CG_SKY, 1.8); ctArcs(g2, C, B, r2, 2, CT_ANG[2], 24); } }
    ];
    if (ok) {
      steps.push({ tool: 'look', text: `兩條射線交於 A，△ABC 即為所求。∠A = 180° − ${b1}° − ${b2}° = ${180 - sum}°。`,
        draw: g2 => { ctPoly(g2, [A, B, C], CG_MOSS, 0.12, 3.2); ctArcs(g2, A, B, C, 3, CT_ANG[0], 20); } });
    } else {
      steps.push({ tool: 'warn', text: `∠1 + ∠2 = ${sum}°，不小於 180°：兩條射線${sum === 180 ? '平行' : '往外張開'}，永遠不相交，作不出三角形。` });
    }
    cgSync('asa', st, steps.length);

    const angTxt = `∠1 = ${b1}°，∠2 = ${b2}°，a = ${a.toFixed(1)} 公分`;
    cgRender(ctx, {
      title: '已知兩角 ∠1、∠2 及夾邊 a，作 △ABC（ASA 作圖）', color: CT_TONE[6], k: st.k, steps,
      given: g2 => textLeft(g2, angTxt, 24, 62, CG_INK, f(700, 15)),
      pts: [
        { p: B, n: 'B', s: 1, dx: -10, dy: 20 }, { p: C, n: 'C', s: 1, dx: 10, dy: 20 },
        A ? { p: A, n: 'A', s: 4, c: CG_MOSS, dx: 0, dy: -20 } : null
      ],
      measure: (A && st.k === 4) ? [`量一量：AB = ${(cgDist(A, B) / px).toFixed(1)}，AC = ${(cgDist(A, C) / px).toFixed(1)} 公分`, CG_MOSS] : null
    });
    if (ok && px < 35.99) textLeft(ctx, `（太大放不下，畫成原來的 ${Math.round(px / 36 * 100)}%）`, 24, 84, MUTED, f(600, 13));

    ctDbg('asa', { a, b1, b2, ok, px, A, B, C });
    if (ok) {
      out.innerHTML = wbrEq(`\\angle A = 180^\\circ - ${b1}^\\circ - ${b2}^\\circ = ${180 - sum}^\\circ`);
      fb.innerHTML = wrapFeedback('\\(\\overline{BC}\\) 夾在 \\(\\angle B\\) 和 \\(\\angle C\\) 之間，所以叫「夾邊」；ASA 把 S 寫在兩個 A 中間。兩條射線只交於一點 \\(A\\)，三角形只有一種。');
    } else {
      out.innerHTML = `${wbrEq(`\\angle 1 + \\angle 2 = ${sum}^\\circ`)}\\(\\;\\ge 180^\\circ\\)：作不出三角形`;
      fb.innerHTML = wrapFeedback(`三角形的內角和是 \\(180^\\circ\\)，兩個角加起來一定要小於 \\(180^\\circ\\)。目前 \\(\\angle 1 = ${b1}^\\circ\\)、\\(\\angle 2 = ${b2}^\\circ\\)，把其中一個調小再試。`);
    }
    typeset([out, fb]);
  }

  cgSteps('asa', st, draw);
  [sa, s1, s2].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 8：AAS——用內角和補出第三個角，轉成 ASA
   ========================================================================== */
function initAasCanvas() {
  const cv = hbEl('canvas-aas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sB = hbEl('aas-b'), sC = hbEl('aas-c'), sS = hbEl('aas-s');
  const vB = hbEl('aas-vb'), vC = hbEl('aas-vc'), vS = hbEl('aas-vs');
  const g = hbEl('aas-side-group');
  const out = hbEl('aas-formula'), fb = hbEl('aas-feedback');
  let side = 'ac';
  const INFO = {
    ac: { nm: 'AC', role: '∠B 的對邊', tex: '\\overline{AC}', p: ['A', 'C'] },
    ab: { nm: 'AB', role: '∠C 的對邊', tex: '\\overline{AB}', p: ['A', 'B'] },
    bc: { nm: 'BC', role: '∠B、∠C 的夾邊', tex: '\\overline{BC}', p: ['B', 'C'] }
  };

  function draw() {
    const angB = hbIv(sB), angC = hbIv(sC), s = hbIv(sS) / 2;
    vB.textContent = angB;
    vC.textContent = angC;
    vS.textContent = s.toFixed(1);
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const I = INFO[side];
    drawTitle(ctx, `已知 ∠B、∠C 和 ${I.nm}（${I.role}）`, CT_TONE[7]);
    const angA = 180 - angB - angC;
    const y0 = 316;
    drawPanel(ctx, 12, y0 - 20, W - 24, H - y0 + 8, CT_TONE[7], 0.08);

    if (angA < 10) {
      ctRow(ctx, `∠B + ∠C = ${angB + angC}°，第三個角只剩 ${angA}°（或更小），畫不出像樣的三角形。`, 28, y0, W - 56, CG_ROSE, f(700, 16), 22, 2);
      ctRow(ctx, '把 ∠B 或 ∠C 調小一點再看。', 28, y0 + 50, W - 56, '#e2e8f0', f(600, 15), 20, 1);
      out.innerHTML = `${wbrEq(`\\angle B + \\angle C = ${angB + angC}^\\circ`)}：第三個角太小`;
      fb.innerHTML = wrapFeedback('兩個角的和要小於 \\(180^\\circ\\)，第三個角才存在；這裡再限制它至少 \\(10^\\circ\\)，圖才看得清楚。');
      typeset([out, fb]);
      return;
    }

    // 正弦定律算出三邊（只用來擺圖；推導仍走內角和 → ASA）
    const sinA = Math.sin(cgRad(angA)), sinB = Math.sin(cgRad(angB)), sinC = Math.sin(cgRad(angC));
    const opp = { ac: sinB, ab: sinC, bc: sinA }[side];
    const k = s / opp;
    const a = k * sinA, b = k * sinB, c = k * sinC;
    const t = ctFromAngles(angB, angC, a);
    const [A, B, C] = ctFit([t.A, t.B, t.C], { x: 60, y: 62, w: W - 120, h: 196 }, 36);
    const scale = cgDist(B, C) / a;
    const G = ctCentroid([A, B, C]);
    const P = { A, B, C };
    ctPoly(ctx, [A, B, C], CG_INK, 0.08, 2.4);
    cgSeg(ctx, P[I.p[0]], P[I.p[1]], CG_MOSS, 5);
    ctTicks(ctx, P[I.p[0]], P[I.p[1]], 1, CG_MOSS);
    ctArcs(ctx, B, A, C, 1, CT_ANG[1], 22);
    ctArcs(ctx, C, A, B, 2, CT_ANG[2], 22);
    if (side !== 'bc') ctArcs(ctx, A, B, C, 3, CT_ANG[0], 20, [4, 3]);
    ctAngText(ctx, B, A, C, `${angB}°`, CT_ANG[1], 48, f(700, 13));
    ctAngText(ctx, C, A, B, `${angC}°`, CT_ANG[2], 50, f(700, 13));
    if (side !== 'bc') ctAngText(ctx, A, B, C, `${angA}°`, CT_ANG[0], 50, f(700, 13));
    [['A', A], ['B', B], ['C', C]].forEach(([n, V]) => ctVLabel(ctx, V, G, n, CG_INK));
    ctSideLabel(ctx, P[I.p[0]], P[I.p[1]], G, `${s.toFixed(1)}`, CG_MOSS, 30, f(700, 15));

    const rows = [];
    rows.push([`① 已知：∠B = ${angB}°、∠C = ${angC}°、${I.nm} = ${s.toFixed(1)}（${I.role}）`, '#f1f5f9']);
    if (side === 'bc') {
      rows.push(['② BC 夾在 ∠B 與 ∠C 之間：這本來就是 ASA，不必再算第三個角。', CG_MOSS]);
    } else {
      rows.push([`② 內角和：∠A = 180° − ${angB}° − ${angC}° = ${angA}°`, CT_ANG[0]]);
      rows.push([side === 'ac'
        ? '③ AC 夾在 ∠A 與 ∠C 之間 → ASA：三角形只有一種，所以 AAS 也能判定全等。'
        : '③ AB 夾在 ∠A 與 ∠B 之間 → ASA：三角形只有一種，所以 AAS 也能判定全等。', CG_MOSS]);
    }
    let yy = y0;
    rows.forEach(r => { yy += ctRow(ctx, r[0], 28, yy, W - 56, r[1], f(700, 15), 20, 2) * 20 + 10; });
    void scale;

    ctDbg('aas', { angB, angC, s, side, A, B, C, scale });
    if (side === 'bc') {
      out.innerHTML = `ASA：\\(\\angle B = ${angB}^\\circ\\)、<wbr>\\(\\overline{BC} = ${s.toFixed(1)}\\)、<wbr>\\(\\angle C = ${angC}^\\circ\\)`;
      fb.innerHTML = wrapFeedback('已知的邊夾在兩個已知角中間，直接用 ASA。換成「對邊」看看：要先用內角和補出第三個角。');
    } else {
      out.innerHTML = `${wbrEq(`\\angle A = 180^\\circ - ${angB}^\\circ - ${angC}^\\circ = ${angA}^\\circ`)}<wbr>\\(\\;\\Rightarrow\\;\\) ASA`;
      fb.innerHTML = wrapFeedback(`已知的 \\(${I.tex}\\) 是${side === 'ac' ? '\\(\\angle B\\)' : '\\(\\angle C\\)'} 的對邊，不夾在兩個已知角中間；補出 \\(\\angle A\\) 之後，它就變成夾邊了。比對兩個三角形時，相等的邊必須對著<strong>對應</strong>的角。`);
    }
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-aas-side', v => { side = v; draw(); });
  [sB, sC, sS].forEach(x => x.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 9：AAA 不能當全等性質——形狀一樣，大小可以不同
   ========================================================================== */
function initAaaCanvas() {
  const cv = hbEl('canvas-aaa');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sA = hbEl('aaa-a'), sB = hbEl('aaa-b'), sK = hbEl('aaa-k');
  const vA = hbEl('aaa-va'), vB = hbEl('aaa-vb'), vK = hbEl('aaa-vk');
  const out = hbEl('aaa-formula'), fb = hbEl('aaa-feedback');

  function draw() {
    const angA = hbIv(sA), angB = hbIv(sB), k = hbIv(sK) / 4;
    vA.textContent = angA;
    vB.textContent = angB;
    vK.textContent = String(k);
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '三個角都對應相等，兩個三角形一定全等嗎？', CT_TONE[8]);
    const angC = 180 - angA - angB;
    const y0 = 352;
    drawPanel(ctx, 12, y0 - 20, W - 24, H - y0 + 8, CT_TONE[8], 0.08);
    if (angC < 10) {
      ctRow(ctx, `∠A + ∠B = ${angA + angB}°，第三個角只剩 ${angC}°，畫不出像樣的三角形。把 ∠A 或 ∠B 調小。`, 28, y0, W - 56, CG_ROSE, f(700, 16), 22, 2);
      out.innerHTML = `${wbrEq(`\\angle A + \\angle B = ${angA + angB}^\\circ`)}：第三個角太小`;
      fb.innerHTML = wrapFeedback('先把兩個角的和調到 \\(170^\\circ\\) 以下。');
      typeset([out, fb]);
      return;
    }
    const base = 3;
    const t1 = ctFromAngles(angB, angC, base);
    const t2 = ctFromAngles(angB, angC, base * k);
    const b1 = ctBox([t1.A, t1.B, t1.C]), b2 = ctBox([t2.A, t2.B, t2.C]);
    const px = Math.min(40, 220 / Math.max(b1.x1 - b1.x0, b2.x1 - b2.x0), 250 / Math.max(b1.y1 - b1.y0, b2.y1 - b2.y0));
    const Yb = 300;
    const place = (tt, bx, cx) => {
      const ox = cx - (bx.x0 + bx.x1) / 2 * px;
      return [tt.A, tt.B, tt.C].map(p => cgP(ox + p.x * px, Yb + p.y * px));
    };
    const L = place(t1, b1, 140), R = place(t2, b2, 395);
    const GL = ctCentroid(L), GR = ctCentroid(R);
    ctPoly(ctx, L, CG_INK, 0.08, 2.4);
    ctPoly(ctx, R, CG_MOSS, 0.08, 2.4);
    const vals = [angA, angB, angC];
    [L, R].forEach((T, j) => {
      [0, 1, 2].forEach(i => {
        ctArcs(ctx, T[i], T[(i + 1) % 3], T[(i + 2) % 3], i + 1, CT_ANG[i], 16);
        ctVLabel(ctx, T[i], j ? GR : GL, j ? 'DEF'[i] : 'ABC'[i], j ? CG_MOSS : CG_INK);
      });
      // 邊長：BC、EF 標在外側
      ctSideLabel(ctx, T[1], T[2], j ? GR : GL, j ? String(+(base * k).toFixed(2)) : String(base), j ? CG_MOSS : CG_INK, 18, f(700, 14));
    });
    void vals;

    const same = Math.abs(k - 1) < 1e-9;
    const rows = [
      [`∠A = ∠D = ${angA}°，∠B = ∠E = ${angB}°，∠C = ∠F = ${angC}°（第三個角由內角和自動相等）`, '#f1f5f9'],
      [`EF 是 BC 的 ${k} 倍：每一邊都放大成 ${k} 倍，三個角一點都沒變。`, CG_MOSS],
      [same ? '倍數剛好是 1，兩個三角形一樣大——但這是邊長決定的，三個角本身做不到。'
        : '形狀一樣、大小不一樣：三個角都對應相等，仍然不全等。', same ? CG_HONEY : CG_ROSE]
    ];
    let yy = y0;
    rows.forEach(r => { yy += ctRow(ctx, r[0], 28, yy, W - 56, r[1], f(700, 15), 20, 2) * 20 + 8; });

    ctDbg('aaa', { angA, angB, angC, k, L, R });
    out.innerHTML = `\\(\\angle C = \\angle F = ${angC}^\\circ\\)，<wbr>\\(\\overline{BC} = ${base}\\)，<wbr>\\(\\overline{EF} = ${+(base * k).toFixed(2)}\\)`;
    fb.innerHTML = wrapFeedback(same
      ? '把倍數調離 \\(1\\)：三個角完全不變，三角形卻變大或變小。所以只知道三個角對應相等（AAA），不能判定全等。'
      : '只知道三個角對應相等時，三角形可以等比例放大、縮小。AAA 只決定「形狀」，不決定「大小」，所以不能當全等性質。');
    typeset([out, fb]);
  }

  [sA, sB, sK].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 10：判別機——看記號，選全等性質
   ========================================================================== */
// 每張卡：形狀（∠B、∠C、BC）、記號（邊的刻痕數、角的弧數、直角）、正解與理由
const CT_CARDS = [
  { shape: [52, 70], sides: { AB: 1, BC: 2, CA: 3 }, angs: {}, ans: 'SSS',
    tex: '\\overline{AB} = \\overline{DE}、\\overline{BC} = \\overline{EF}、\\overline{CA} = \\overline{FD}',
    why: '三組邊各畫 1、2、3 條刻痕，全部對應相等：SSS。' },
  { shape: [58, 64], sides: { AB: 1, BC: 2 }, angs: { B: 1 }, ans: 'SAS',
    tex: '\\overline{AB} = \\overline{DE}、\\angle B = \\angle E、\\overline{BC} = \\overline{EF}',
    why: '∠B 夾在 AB、BC 這兩邊中間：兩邊一夾角，SAS。' },
  { shape: [63, 48], sides: { AB: 1, BC: 2 }, angs: { A: 1 }, ans: 'NO',
    tex: '\\overline{AB} = \\overline{DE}、\\overline{BC} = \\overline{EF}、\\angle A = \\angle D',
    why: '∠A 不在 AB、BC 中間，是 BC 的對角：這是 SSA，不一定全等。' },
  { shape: [90, 36], sides: { CA: 1, AB: 2 }, angs: {}, right: 1, ans: 'RHS',
    tex: '\\angle B = \\angle E = 90^\\circ、\\overline{CA} = \\overline{FD}、\\overline{AB} = \\overline{DE}',
    why: '直角三角形，相等的是斜邊 CA 和一股 AB：RHS。' },
  { shape: [55, 67], sides: { BC: 1 }, angs: { B: 1, C: 2 }, ans: 'ASA',
    tex: '\\angle B = \\angle E、\\overline{BC} = \\overline{EF}、\\angle C = \\angle F',
    why: 'BC 夾在 ∠B、∠C 中間：兩角一夾邊，ASA。' },
  { shape: [61, 53], sides: { AB: 1 }, angs: { B: 1, C: 2 }, ans: 'AAS',
    tex: '\\angle B = \\angle E、\\angle C = \\angle F、\\overline{AB} = \\overline{DE}',
    why: 'AB 不夾在 ∠B、∠C 中間，是 ∠C 的對邊：AAS。' },
  { shape: [57, 69], sides: {}, angs: { A: 1, B: 2, C: 3 }, ans: 'NO',
    tex: '\\angle A = \\angle D、\\angle B = \\angle E、\\angle C = \\angle F',
    why: '只有三組角相等（AAA），大小可以不同，不一定全等。' },
  { shape: [90, 40], sides: { AB: 1, BC: 2 }, angs: {}, right: 1, ans: 'SAS',
    tex: '\\overline{AB} = \\overline{DE}、\\angle B = \\angle E = 90^\\circ、\\overline{BC} = \\overline{EF}',
    why: '相等的是兩股，直角夾在兩股中間：這是 SAS，不是 RHS（RHS 要有斜邊）。' }
];
const CT_JUDGE_NAME = { SSS: 'SSS', SAS: 'SAS', RHS: 'RHS', ASA: 'ASA', AAS: 'AAS', NO: '不一定全等' };

function ctDrawMarked(ctx, T, card, G, names, color) {
  ctPoly(ctx, T, color, 0.08, 2.4);
  const idx = { A: 0, B: 1, C: 2 };
  const sidePts = { AB: [0, 1], BC: [1, 2], CA: [2, 0] };
  Object.keys(card.sides).forEach(sd => {
    const [i, j] = sidePts[sd];
    ctTicks(ctx, T[i], T[j], card.sides[sd], CG_HONEY);
  });
  Object.keys(card.angs).forEach(v => {
    const i = idx[v];
    ctArcs(ctx, T[i], T[(i + 1) % 3], T[(i + 2) % 3], card.angs[v], CT_ANG[i], 20);
  });
  if (card.right) ctRightMark(ctx, T[1], T[0], T[2], CT_ANG[1], 14);
  [0, 1, 2].forEach(i => ctVLabel(ctx, T[i], G, names[i], color));
}

function initJdCanvas() {
  const cv = hbEl('canvas-jd');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const gCard = hbEl('jd-card-group'), gJudge = hbEl('jd-judge-group');
  const next = hbEl('jd-next');
  const out = hbEl('jd-formula'), fb = hbEl('jd-feedback');
  let card = 0, judged = null;

  function clearJudge() {
    judged = null;
    gJudge.querySelectorAll('.pick-btn').forEach(b => b.classList.remove('active'));
  }

  function draw() {
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const cd = CT_CARDS[card];
    drawTitle(ctx, `卡片 ${card + 1}：記號相同的部分對應相等，用哪一個全等性質？`, CT_TONE[9]);
    const t = ctFromAngles(cd.shape[0], cd.shape[1], 1);
    const L = ctFit([t.A, t.B, t.C], { x: 30, y: 66, w: 210, h: 190 });
    const R0 = ctPose(L, cgRad(card % 2 ? 140 : -110), card % 3 === 0 ? -1 : 1, 0, 0);
    const R = ctFit(R0, { x: 300, y: 66, w: 210, h: 190 });
    ctDrawMarked(ctx, L, cd, ctCentroid(L), ['A', 'B', 'C'], CG_INK);
    ctDrawMarked(ctx, R, cd, ctCentroid(R), ['D', 'E', 'F'], CG_MOSS);

    const y0 = 316;
    drawPanel(ctx, 12, y0 - 22, W - 24, H - y0 + 10, judged ? (judged === cd.ans ? CG_MOSS : CG_ROSE) : CT_TONE[9], 0.08);
    if (!judged) {
      ctRow(ctx, '先數一數：相等的邊有幾組、角有幾組？再看相等的角是不是夾在相等的兩邊中間（或相等的邊是不是夾在相等的兩角中間）。', 28, y0, W - 56, '#f1f5f9', f(600, 15), 21, 3);
      ctRow(ctx, '在下方選一個答案。', 28, y0 + 74, W - 56, MUTED, f(600, 14), 20, 1);
    } else if (judged === cd.ans) {
      ctRow(ctx, `答對了：${CT_JUDGE_NAME[cd.ans]}。`, 28, y0, W - 56, CG_MOSS, f(800, 17), 22, 1);
      ctRow(ctx, cd.why, 28, y0 + 30, W - 56, '#f1f5f9', f(600, 15), 21, 3);
    } else {
      ctRow(ctx, `不是「${CT_JUDGE_NAME[judged]}」。`, 28, y0, W - 56, CG_ROSE, f(800, 17), 22, 1);
      ctRow(ctx, `正確是「${CT_JUDGE_NAME[cd.ans]}」：${cd.why}`, 28, y0 + 30, W - 56, '#f1f5f9', f(600, 15), 21, 3);
    }

    ctDbg('jd', { card, judged, L, R });
    out.innerHTML = cd.tex.split('、').map(s => `\\(${s}\\)`).join('、<wbr>');
    fb.innerHTML = wrapFeedback(judged
      ? (judged === cd.ans ? '答對了！按「下一張」繼續。' : '再對照一次：先數邊與角的組數，再看「夾」的位置。')
      : '這張卡的條件寫在上面一列，想一想它屬於哪一個全等性質。');
    typeset([out, fb]);
  }

  bindPickGroup(gCard, 'data-jd-card', v => { card = parseInt(v, 10); clearJudge(); draw(); });
  bindPickGroup(gJudge, 'data-jd-judge', v => { judged = v; draw(); });
  next.addEventListener('click', () => {
    card = (card + 1) % CT_CARDS.length;
    gCard.querySelectorAll('.pick-btn').forEach(b => b.classList.toggle('active', parseInt(b.getAttribute('data-jd-card'), 10) === card));
    clearJudge();
    draw();
  });
  draw();
}

/* ==========================================================================
   重點 11：找出圖形裡「沒寫出來」的相等條件
   ========================================================================== */
function initHdCanvas() {
  const cv = hbEl('canvas-hd');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = hbEl('hd-p'), vp = hbEl('hd-vp');
  const g = hbEl('hd-mode-group');
  const out = hbEl('hd-formula'), fb = hbEl('hd-feedback');
  const st = { k: 1 };
  let mode = 'side';

  function draw() {
    const p = hbIv(sp);
    vp.textContent = p;
    let steps, pts, title, tex, fbText;
    if (mode === 'side') {
      const A = cgP(270, 66), D = cgP(270, 384);
      const B = cgP(140, 150 + 25 * p), C = cgP(400, 150 + 25 * p);
      const G = cgP(270, 225);
      title = '共用邊：△ABD 和 △ACD';
      steps = [
        { tool: 'look', text: '已知 AB = AC、BD = CD（刻痕條數相同的邊相等）。',
          draw: g2 => { ctTicks(g2, A, B, 1, CG_HONEY); ctTicks(g2, A, C, 1, CG_HONEY); ctTicks(g2, B, D, 2, CG_HONEY); ctTicks(g2, C, D, 2, CG_HONEY); } },
        { tool: 'look', text: '兩個三角形共用 AD：AD = AD，這就是第三組相等的邊。',
          draw: g2 => { cgSeg(g2, A, D, CG_MOSS, 5); ctTicks(g2, A, D, 3, CG_MOSS); } },
        { tool: 'look', text: '三組邊對應相等 → SSS，△ABD ≅ △ACD。於是 ∠BAD = ∠CAD、∠B = ∠C。',
          draw: g2 => { ctArcs(g2, A, B, D, 1, CT_ANG[0], 30); ctArcs(g2, A, D, C, 1, CT_ANG[0], 30); ctArcs(g2, B, A, D, 2, CT_ANG[1], 22); ctArcs(g2, C, D, A, 2, CT_ANG[1], 22); } }
      ];
      pts = [
        { p: A, n: 'A', s: 0, dx: 0, dy: -18 }, { p: D, n: 'D', s: 0, dx: 0, dy: 20 },
        { p: B, n: 'B', s: 0, dx: -18, dy: 0 }, { p: C, n: 'C', s: 0, dx: 18, dy: 0 }
      ];
      void G;
      steps.forEach(s => { s.base = g2 => ctPoly(g2, [A, B, D, C], CG_INK, 0.06, 2.4); });
      steps[0].base2 = g2 => cgSeg(g2, A, D, CG_INK, 2);
      tex =['\\overline{AB} = \\overline{AC}', '\\overline{BD} = \\overline{CD}', '\\overline{AD} = \\overline{AD}'];
      fbText = '性質：SSS。共用的那一條邊，在兩個三角形裡都是一邊，而且當然等長。';
    } else if (mode === 'angle') {
      const c = 36 + 6 * p, L = 290;
      const C = cgP(270, 70);
      const A = cgP(C.x - L * Math.sin(cgRad(c / 2)), C.y + L * Math.cos(cgRad(c / 2)));
      const B = cgP(C.x + L * Math.sin(cgRad(c / 2)), C.y + L * Math.cos(cgRad(c / 2)));
      const foot = (P, U, V) => {
        const u = cgUnit(U, V);
        const tt = (P.x - U.x) * u.x + (P.y - U.y) * u.y;
        return cgP(U.x + u.x * tt, U.y + u.y * tt);
      };
      const D = foot(A, C, B), E = foot(B, C, A);
      title = '共用角：△ACD 和 △BCE';
      steps = [
        { tool: 'look', text: '已知 CA = CB，AD ⊥ BC、BE ⊥ AC：∠ADC = ∠BEC = 90°。',
          draw: g2 => { ctTicks(g2, C, A, 1, CG_HONEY); ctTicks(g2, C, B, 1, CG_HONEY); ctRightMark(g2, D, C, A, CT_ANG[1], 13); ctRightMark(g2, E, C, B, CT_ANG[1], 13); } },
        { tool: 'look', text: '△ACD 和 △BCE 都用到頂點 C 的角：∠C = ∠C（共用角）。',
          draw: g2 => ctArcs(g2, C, A, B, 2, CG_MOSS, 30) },
        { tool: 'look', text: '兩角（直角、∠C）及其中一角的對邊（CA、CB 都是直角的對邊）→ AAS，△ACD ≅ △BCE，所以 CD = CE。',
          draw: g2 => { ctPoly(g2, [A, C, D], CT_ANG[0], 0.12, 2.6); ctPoly(g2, [B, C, E], CG_SKY, 0.12, 2.6); cgSeg(g2, C, D, CG_MOSS, 4.5); cgSeg(g2, C, E, CG_MOSS, 4.5); } }
      ];
      steps.forEach(s => { s.base = g2 => { ctPoly(g2, [A, B, C], CG_INK, 0.05, 2.4); cgSeg(g2, A, D, CG_INK, 2); cgSeg(g2, B, E, CG_INK, 2); }; });
      const G = ctCentroid([A, B, C]);
      pts = [['A', A], ['B', B], ['C', C]].map(([n, P]) => {
        const d = cgDist(P, G);
        return { p: P, n, s: 0, dx: (P.x - G.x) / d * 18, dy: (P.y - G.y) / d * 18 };
      });
      pts.push({ p: D, n: 'D', s: 0, dx: 16, dy: -4 });
      pts.push({ p: E, n: 'E', s: 0, dx: -16, dy: -4 });
      tex = ['\\angle ADC = \\angle BEC = 90^\\circ', '\\overline{CA} = \\overline{CB}', '\\angle C = \\angle C'];
      fbText = '性質：AAS。共用的角在兩個三角形裡都是一個內角，常常就是缺的那個條件。';
    } else {
      const O = cgP(270, 220);
      const A = cgP(O.x - 160, O.y), C = cgP(O.x + 160, O.y);
      const psi = cgRad(100 + 7 * p);
      const B = cgP(O.x + 130 * Math.cos(psi), O.y - 130 * Math.sin(psi));
      const D = cgP(2 * O.x - B.x, 2 * O.y - B.y);
      title = '對頂角：△ABO 和 △CDO';
      steps = [
        { tool: 'look', text: '已知 AO = CO、∠A = ∠C（∠OAB = ∠OCD）。',
          draw: g2 => { ctTicks(g2, A, O, 1, CG_HONEY); ctTicks(g2, O, C, 1, CG_HONEY); ctArcs(g2, A, O, B, 1, CT_ANG[0], 30); ctArcs(g2, C, O, D, 1, CT_ANG[0], 30); } },
        { tool: 'look', text: 'AC 與 BD 相交於 O：∠AOB 和 ∠COD 是對頂角，對頂角相等。',
          draw: g2 => { ctArcs(g2, O, A, B, 2, CG_MOSS, 24); ctArcs(g2, O, C, D, 2, CG_MOSS, 24); } },
        { tool: 'look', text: '∠A、AO、∠AOB：AO 夾在兩角中間 → ASA，△ABO ≅ △CDO，所以 AB = CD、BO = DO。',
          draw: g2 => { ctPoly(g2, [A, B, O], CT_ANG[0], 0.12, 2.6); ctPoly(g2, [C, D, O], CG_SKY, 0.12, 2.6); } }
      ];
      steps.forEach(s => { s.base = g2 => { cgSeg(g2, A, C, CG_INK, 2.4); cgSeg(g2, B, D, CG_INK, 2.4); cgSeg(g2, A, B, CG_INK, 2.4); cgSeg(g2, C, D, CG_INK, 2.4); }; });
      pts = [
        { p: A, n: 'A', s: 0, dx: -16, dy: 0 }, { p: C, n: 'C', s: 0, dx: 16, dy: 0 },
        { p: B, n: 'B', s: 0, dx: -10, dy: -16 }, { p: D, n: 'D', s: 0, dx: 10, dy: 18 },
        { p: O, n: 'O', s: 0, dx: 0, dy: 22 }
      ];
      tex = ['\\angle OAB = \\angle OCD', '\\overline{AO} = \\overline{CO}', '\\angle AOB = \\angle COD'];
      fbText = '性質：ASA。兩條直線相交，就有一對對頂角可以用。';
    }
    cgSync('hd', st, steps.length);
    const base = steps[0].base, base2 = steps[0].base2;

    cgRender(ctx, {
      title, color: CT_TONE[10], k: st.k, steps,
      given: g2 => { base(g2); if (base2) base2(g2); },
      pts
    });

    ctDbg('hd', { mode, p, pts: pts.map(q => [q.n, q.p]), k: st.k });
    const shown = tex.slice(0, st.k === 1 ? 2 : 3);
    out.innerHTML = shown.map(s => `\\(${s}\\)`).join('，<wbr>');
    fb.innerHTML = wrapFeedback(st.k < 3 ? (st.k === 1 ? '題目只給了兩個條件，還差一個——它就藏在圖裡。按「下一步」。' : '找到了！這個條件圖上看得出來，題目不必寫。') : fbText);
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-hd-mode', v => { mode = v; st.k = 1; draw(); });
  cgSteps('hd', st, draw);
  sp.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 12：全等的應用——證完全等，再用對應邊、對應角算
   ========================================================================== */
function initApCanvas() {
  const cv = hbEl('canvas-ap');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sT = hbEl('ap-t'), sO = hbEl('ap-o'), sM = hbEl('ap-m'), sN = hbEl('ap-n');
  const vT = hbEl('ap-vt'), vO = hbEl('ap-vo'), vM = hbEl('ap-vm'), vN = hbEl('ap-vn');
  const rows = { t: hbEl('ap-row-t'), o: hbEl('ap-row-o'), m: hbEl('ap-row-m'), n: hbEl('ap-row-n') };
  const g = hbEl('ap-mode-group');
  const out = hbEl('ap-formula'), fb = hbEl('ap-feedback');
  let mode = 'turn';

  function drawTurn() {
    const W = cv.width, H = cv.height;
    const t = hbIv(sT), o = hbIv(sO);
    vT.textContent = t;
    vO.textContent = o;
    const r = (t - o) / 2;
    drawTitle(ctx, '△ABC 與 △DBE 全等，∠ABD 是幾度？', CT_TONE[11]);
    const B = cgP(270, 318), p = 140, q = 200;
    const C = cgPolar(B, q, 0), E = cgPolar(B, q, -cgRad(r));
    const A = cgPolar(B, p, -cgRad(r + o)), D = cgPolar(B, p, -cgRad(t));
    const F = cgLL(A, C, D, E);
    ctPoly(ctx, [A, B, C], CT_ANG[0], 0.1, 2.4);
    ctPoly(ctx, [D, B, E], CG_SKY, 0.1, 2.4);
    ctTicks(ctx, B, A, 1, CG_HONEY); ctTicks(ctx, B, D, 1, CG_HONEY);
    ctTicks(ctx, B, C, 2, CG_HONEY); ctTicks(ctx, B, E, 2, CG_HONEY);
    ctTicks(ctx, A, C, 3, CG_HONEY); ctTicks(ctx, D, E, 3, CG_HONEY);
    ctArcs(ctx, B, A, E, 1, CG_HONEY, 30);
    ctArcs(ctx, B, D, A, 1, CG_MOSS, 46);
    ctArcs(ctx, B, E, C, 1, CG_MOSS, 46);
    ctAngText(ctx, B, A, E, '1', CG_HONEY, 62, f(800, 14));
    ctAngText(ctx, B, D, A, '2', CG_MOSS, 66, f(800, 14));
    ctAngText(ctx, B, E, C, '3', CG_MOSS, 66, f(800, 14));
    cgLabel(ctx, B, 'B', CG_INK, 0, 18);
    [['A', A], ['C', C], ['D', D], ['E', E]].forEach(([n, P]) => {
      const u = cgUnit(B, P);
      cgLabel(ctx, P, n, CG_INK, u.x * 16, u.y * 16);
    });
    if (F) cgLabel(ctx, F, 'F', CG_INK, 0, -16, fi(700, 15));

    const y0 = 368;
    drawPanel(ctx, 12, y0 - 20, W - 24, H - y0 + 8, CT_TONE[11], 0.08);
    ctRow(ctx, '① SSS：AB = DB、BC = BE、AC = DE ⇒ △ABC ≅ △DBE', 28, y0, W - 56, '#f1f5f9', f(700, 14.5), 19, 1);
    ctRow(ctx, '② ∠ABC = ∠DBE，兩者都扣掉共同的 ∠1 ⇒ ∠3 = ∠2', 28, y0 + 30, W - 56, '#f1f5f9', f(700, 14.5), 19, 1);
    drawExpr(ctx, [T('③ ∠ABD = ∠2 =', CG_MOSS), FR(`${t}° − ${o}°`, '2', CG_MOSS), T(`= ${r}°`, CG_MOSS)], W / 2, y0 + 92, 17, CG_MOSS, { maxW: W - 56 });
    textLeft(ctx, `∠DBC = ${t}°，∠1 = ∠ABE = ${o}°`, 28, 56, CG_HONEY, f(700, 15));

    ctDbg('ap', { mode: 'turn', t, o, r, A, B, C, D, E });
    out.innerHTML = `\\(\\angle ABD = \\dfrac{${t}^\\circ - ${o}^\\circ}{2}\\)<wbr>\\({}= ${r}^\\circ\\)`;
    fb.innerHTML = wrapFeedback('全等只告訴我們 \\(\\angle ABC = \\angle DBE\\)；兩個角扣掉共同的 \\(\\angle 1\\)，剩下的 \\(\\angle 2\\)、\\(\\angle 3\\) 才相等，再把 \\(\\angle DBC\\) 扣掉 \\(\\angle 1\\) 後平分。');
  }

  function drawKite() {
    const W = cv.width, H = cv.height;
    const m = hbIv(sM), n = hbIv(sN);
    vM.textContent = m;
    vN.textContent = n;
    drawTitle(ctx, '∠1 = ∠2，CB ⊥ AB，CD ⊥ AD：四邊形 ABCD 的面積', CT_TONE[11]);
    const u = 26, ac = Math.hypot(m, n);
    const al = Math.atan2(n, m);
    const A = cgP(270 - ac * u / 2, 200), C = cgP(270 + ac * u / 2, 200);
    const B = cgPolar(A, m * u, -al), D = cgPolar(A, m * u, al);
    ctPoly(ctx, [A, B, C, D], CG_INK, 0.06, 2.4);
    cgSeg(ctx, A, C, CG_MOSS, 3.2);
    ctRightMark(ctx, B, A, C, CT_ANG[1], 13);
    ctRightMark(ctx, D, A, C, CT_ANG[1], 13);
    ctArcs(ctx, A, B, C, 1, CT_ANG[0], 34);
    ctArcs(ctx, A, C, D, 1, CT_ANG[0], 34);
    ctAngText(ctx, A, B, C, '2', CT_ANG[0], 52, f(800, 13));
    ctAngText(ctx, A, C, D, '1', CT_ANG[0], 52, f(800, 13));
    const G = ctCentroid([A, B, C, D]);
    ctSideLabel(ctx, A, B, G, `AB = ${m}`, CG_HONEY, 22, f(700, 14));
    ctSideLabel(ctx, C, D, G, `CD = ${n}`, CG_HONEY, 22, f(700, 14));
    [['A', A], ['B', B], ['C', C], ['D', D]].forEach(([s, P]) => ctVLabel(ctx, P, G, s, CG_INK));

    const y0 = 368;
    drawPanel(ctx, 12, y0 - 20, W - 24, H - y0 + 8, CT_TONE[11], 0.08);
    ctRow(ctx, '① AAS：∠B = ∠D = 90°、∠2 = ∠1、AC 共用 ⇒ △ABC ≅ △ADC', 28, y0, W - 56, '#f1f5f9', f(700, 14.5), 19, 1);
    ctRow(ctx, `② 對應邊相等：CB = CD = ${n}`, 28, y0 + 30, W - 56, '#f1f5f9', f(700, 14.5), 19, 1);
    drawExpr(ctx, [T('③ 面積 = 2 ×', CG_MOSS), FR('1', '2', CG_MOSS), T(`× ${m} × ${n} = ${m * n}`, CG_MOSS)], W / 2, y0 + 92, 17, CG_MOSS, { maxW: W - 56 });

    ctDbg('ap', { mode: 'kite', m, n, u, A, B, C, D });
    out.innerHTML = wbrEq(`2 \\times \\frac{1}{2} \\times ${m} \\times ${n} = ${m * n}`);
    fb.innerHTML = wrapFeedback('題目給的 \\(\\overline{AB}\\) 和 \\(\\overline{CD}\\) 不在同一個三角形裡；先證全等得到 \\(\\overline{CB} = \\overline{CD}\\)，\\(\\triangle ABC\\) 的兩股才都知道。');
  }

  function draw() {
    const turn = (mode === 'turn');
    rows.t.style.display = turn ? '' : 'none';
    rows.o.style.display = turn ? '' : 'none';
    rows.m.style.display = turn ? 'none' : '';
    rows.n.style.display = turn ? 'none' : '';
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (turn) drawTurn(); else drawKite();
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-ap-mode', v => { mode = v; draw(); });
  [sT, sO, sM, sN].forEach(s => s.addEventListener('input', draw));
  draw();
}
