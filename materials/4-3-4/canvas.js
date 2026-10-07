/* ==========================================================================
   4-3-4（第四冊 3-4）中垂線與角平分線的性質 — 互動 Canvas 與隨堂評量
   畫風：19 世紀手工上色銅版畫博物圖鑑・養蜂花園（小蜜、阿蜂），第 3 章共用。
   配色：蜂蜜金 HB_GOLD、苔綠 HB_MOSS、玫瑰 HB_ROSE、天藍 HB_SKY、象牙 HB_IVORY。

   共用工具在 ../math-canvas.js（T／IT／FR／drawExpr／drawTitle／wbrEq／
   textCenter／textLeft／bindPickGroup／typeset／wrapFeedback／reduce…），
   同章共用的 hb*（角記號、頂點外推、三角形擺位）與 cg*（兩圓／直線交點、
   直角記號）幾何工具也在那裡。
   本節自己的工具用 pv 前綴（property），互動共 11 個。

   長度與角度一律由座標實算：垂線段用真正的垂足、交點用真正的直線求交，
   畫面上量到的數字就是作圖的結果，不是用答案公式擺上去的。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();
  drawWithFonts(initQuizFigs);

  initPbPropCanvas();
  initPbConvCanvas();
  initAbPropCanvas();
  initAbConvCanvas();
  initApplyCanvas();
  initFindCanvas();
  initIsoCanvas();
  initIsoAngCanvas();
  initPbIsoCanvas();
  initIsoJudgeCanvas();
  initIsoUseCanvas();
});

/* ==========================================================================
   0. 調色盤（與 4-3-1 相同）
   ========================================================================== */

const HB_GOLD = '#fcd34d';
const HB_MOSS = '#bef264';
const HB_ROSE = '#fda4af';
const HB_SKY = '#7dd3fc';
const HB_IVORY = '#fef3c7';
const HB_VIOLET = '#c4b5fd';
const HB_RED = '#fb7185';
const HB_JADE = '#6ee7b7';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const HB_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9'];

/* ==========================================================================
   本節自己的小工具（pv = property；共用檔沒有這個前綴）
   ========================================================================== */

// 線段中點上的等長記號（n 條短橫線，垂直於線段）
function pvTicks(ctx, P, Q, n, color) {
  const d = hbDist(P, Q) || 1;
  const ux = (Q.x - P.x) / d, uy = (Q.y - P.y) / d;
  const nx = -uy, ny = ux;
  const M = hbV((P.x + Q.x) / 2, (P.y + Q.y) / 2);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const o = (i - (n - 1) / 2) * 6;
    const cx = M.x + ux * o, cy = M.y + uy * o;
    ctx.beginPath();
    ctx.moveTo(cx - nx * 7, cy - ny * 7);
    ctx.lineTo(cx + nx * 7, cy + ny * 7);
    ctx.stroke();
  }
  ctx.restore();
}

// P 在直線 AB 上的垂足
function pvFoot(P, A, B) {
  const dx = B.x - A.x, dy = B.y - A.y;
  const t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / (dx * dx + dy * dy);
  return hbV(A.x + dx * t, A.y + dy * t);
}

// 直角記號：頂點 V，兩邊分別朝 P、Q
function pvRight(ctx, V, P, Q, color, s) {
  cgRight(ctx, V, cgUnit(V, P), cgUnit(V, Q), s || 11, color);
}

// 只填色不描邊的多邊形
function pvFill(ctx, pts, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 過 P、方向 (u.x, u.y) 的直線，往兩邊各畫 len
function pvLineDir(ctx, P, u, len, color, w, dash) {
  const n = Math.hypot(u.x, u.y) || 1;
  const a = hbV(P.x - u.x / n * len, P.y - u.y / n * len);
  const b = hbV(P.x + u.x / n * len, P.y + u.y / n * len);
  hbSeg(ctx, a, b, color, w, dash);
}

// 線段 PQ 的中垂線方向（單位向量）
function pvPerpDir(P, Q) {
  const u = cgUnit(P, Q);
  return hbV(-u.y, u.x);
}

// 頂點 V、兩鄰點 P、Q 的角平分線方向
function pvBisDir(V, P, Q) {
  const u = cgUnit(V, P), w = cgUnit(V, Q);
  return hbV(u.x + w.x, u.y + w.y);
}

// 斜體字母標籤，畫在 P 旁邊 (dx, dy)
function pvLabel(ctx, P, text, dx, dy, color, size) {
  textCenter(ctx, text, P.x + dx, P.y + dy, color || HB_IVORY, fi(800, size || 17));
}

// 標籤畫在 P 往「離開 from」的方向 dist 處（垂足標在圖形外側用）
function pvLabelAway(ctx, P, from, text, dist, color, size) {
  const d = hbDist(P, from) || 1;
  pvLabel(ctx, P, text, (P.x - from.x) / d * dist, (P.y - from.y) / d * dist, color, size);
}

// 滑桿上的數：整數不帶小數點，其餘一位；負號用 −
function pvNum(v) {
  const s = Number.isInteger(v) ? String(Math.abs(v)) : Math.abs(v).toFixed(1);
  return v < 0 ? '−' + s : s;
}

// 長度：整數時寫「=」，否則寫「≈」兩位小數
function pvLen(v) {
  const r = Math.round(v);
  if (Math.abs(v - r) < 1e-6) return { eq: true, s: String(r), rel: '=', tex: '=' };
  return { eq: false, s: v.toFixed(2), rel: '≈', tex: '\\approx' };
}

// 角度（由座標量出來）：整數就寫整數，否則一位小數
function pvDeg(v) {
  const r = Math.round(v);
  if (Math.abs(v - r) < 0.05) return String(r);
  return v.toFixed(1);
}

function pvFracTex(n, d) {
  const r = reduce(n, d);
  return texFrac(r[0], r[1]);
}

function pvFracItem(n, d, color) {
  const r = reduce(n, d);
  if (r[1] === 1) return T(String(r[0]), color);
  return FR(String(r[0]), String(r[1]), color);
}

// 點 P 是否在三角形 ABC 內部（含邊上）
function pvInside(P, A, B, C) {
  const s1 = cgSide(A, B, P), s2 = cgSide(B, C, P), s3 = cgSide(C, A, P);
  const neg = s1 < 0 || s2 < 0 || s3 < 0, pos = s1 > 0 || s2 > 0 || s3 > 0;
  return !(neg && pos);
}

// 只在畫布的作圖區內畫（標題下方），長直線不壓到標題
function pvClip(ctx, y0, y1) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y0, ctx.canvas.width, y1 - y0);
  ctx.clip();
}

// 以三角形重心為參考，把三個頂點字母畫在外側
function pvTriLabels(ctx, A, B, C, names) {
  const G = hbCentroid([A, B, C]);
  const nm = names || ['A', 'B', 'C'];
  hbVLabel(ctx, A, G, nm[0], HB_IVORY);
  hbVLabel(ctx, B, G, nm[1], HB_IVORY);
  hbVLabel(ctx, C, G, nm[2], HB_IVORY);
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第四冊 3-4 的 22 題正解
  // 正解字母分布：A 6 題、B 5 題、C 6 題、D 5 題（開發約束 36）
  const answers = {
    '3-4-1': 'C',    // AE + EC = AE + EB = AB → AB = 31 − 11 = 20
    '3-4-2': 'A',    // 2x + 3 = 5x − 9 → x = 4 → CA = 11
    '3-4-3': 'D',    // D 是 BC 中點 → BC = 15、AC = 12 → 周長 = AB + AC = 21
    '3-4-4': 'C',    // 到 A、B 等距的點有無限多個，全在中垂線上
    '3-4-5': 'B',    // DE = CD = 5 → △ABD = ½ × 20 × 5 = 50
    '3-4-6': 'A',    // ½(10 + 8)x = 27 → x = 3
    '3-4-7': 'D',    // ∠BAC = 74° → ∠B = 180° − 74° − 58° = 48°
    '3-4-8': 'B',    // 斜邊 PA 共用、股 PB = PC → RHS
    '3-4-9': 'C',    // x² = (24 − x)² + 12² → x = 15
    '3-4-10': 'A',   // x² + 12² = (18 − x)² → x = 5
    '3-4-11': 'D',   // ∠PQR 的角平分線與 ST 中垂線的交點
    '3-4-12': 'B',   // 兩個內角的角平分線
    '3-4-13': 'A',   // AB = AC 時頂角平分線就是底邊中垂線
    '3-4-14': 'C',   // BD = 9、∠BAD = 38°
    '3-4-15': 'B',   // 2(∠1 + ∠2) = 210° → ∠ACE = 75°
    '3-4-16': 'D',   // 180° − 3x = 105° → x = 25°
    '3-4-17': 'A',   // ∠EDF = 180° − ∠B − ∠C = ∠A = 68°
    '3-4-18': 'C',   // 90 + 2x + x + 24 = 180 → x = 22 → ∠COD = 44°
    '3-4-19': 'C',   // ∠B = 47° = ∠A → BC = AC
    '3-4-20': 'B',   // ∠A = ∠C → AB = BC
    '3-4-21': 'A',   // AD = BD = BC = 7 → DC = 8
    '3-4-22': 'D'    // ∠D = ∠ABD → AD = AB = 7
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
   座標一律照題目的數字實算，圖上量得到的長度與角度就是題目的數字。
   ========================================================================== */

// 把「數學座標」（y 朝上）的點組翻成畫布座標後置中縮放
function pvFitMath(pts, box) {
  return hbFit(pts.map(p => hbV(p.x, -p.y)), box);
}

const PV_QUIZ_FIGS = {
  // L 為 BC 的中垂線，交 BC 於 D、交 AB 於 E（AB = 20、AC = 11、BC = 16）
  q1(ctx, W, H) {
    const ax = (400 - 121 + 256) / 32, ay = Math.sqrt(400 - ax * ax);
    const M = [hbV(0, 0), hbV(16, 0), hbV(ax, ay)];
    const [B, C, A] = pvFitMath(M, { x: 40, y: 34, w: W - 80, h: H - 66 });
    const D = hbV((B.x + C.x) / 2, (B.y + C.y) / 2);
    const E = cgLL(D, hbV(D.x, D.y - 10), B, A);
    hbPoly(ctx, [A, B, C], INK, 0.05, 2.2);
    hbSeg(ctx, hbV(D.x, D.y + 14), hbV(D.x, Math.min(E.y, A.y) - 22), HB_SKY, 2);
    hbSeg(ctx, E, C, HB_ROSE, 2);
    pvRight(ctx, D, C, E, HB_SKY, 9);
    pvTicks(ctx, B, D, 1, HB_GOLD);
    pvTicks(ctx, D, C, 1, HB_GOLD);
    pvTriLabels(ctx, A, B, C);
    pvLabel(ctx, D, 'D', 0, 17, HB_IVORY, 15);
    pvLabel(ctx, E, 'E', -14, -6, HB_IVORY, 15);
    pvLabel(ctx, hbV(D.x, Math.min(E.y, A.y) - 22), 'L', 12, 4, HB_SKY, 15);
  },
  // ∠A = 90°，D 在 BC 上、E 在 AC 上，DE ⊥ BC、BE = CE（AB = 9、AC = 12）
  q3(ctx, W, H) {
    const M = [hbV(0, 0), hbV(0, 9), hbV(12, 0), hbV(6, 4.5), hbV(2.625, 0)];
    const [A, B, C, D, E] = pvFitMath(M, { x: 50, y: 30, w: W - 100, h: H - 60 });
    hbPoly(ctx, [A, B, C], INK, 0.05, 2.2);
    hbSeg(ctx, D, E, HB_SKY, 2);
    hbSeg(ctx, B, E, HB_ROSE, 2, [5, 4]);
    pvRight(ctx, A, B, C, INK, 9);
    pvRight(ctx, D, C, E, HB_SKY, 9);
    pvTriLabels(ctx, A, B, C);
    pvLabel(ctx, D, 'D', 10, -12, HB_IVORY, 15);
    pvLabel(ctx, E, 'E', 0, 17, HB_IVORY, 15);
  },
  // ∠C = 90°，BD 平分 ∠ABC 交 AC 於 D，DE ⊥ AB（AB = 20、CD = 5）
  q5(ctx, W, H) {
    // 找 θ 使 CD / AB = sinθ cosθ / (1 + cosθ) = 5 / 20（取 θ 較小的那一個）
    let lo = 0.05, hi = 52 * HB_RAD;
    const g = t => Math.sin(t) * Math.cos(t) / (1 + Math.cos(t)) - 5 / 20;
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (g(m) > 0) hi = m; else lo = m; }
    const a = 20 * Math.sin(lo), b = 20 * Math.cos(lo);   // a = AC，b = BC
    const C0 = hbV(0, 0), B0 = hbV(b, 0), A0 = hbV(0, a);
    const D0 = hbV(0, a * b / (b + 20));
    const E0 = pvFoot(D0, A0, B0);
    const [C, B, A, D, E] = pvFitMath([C0, B0, A0, D0, E0], { x: 50, y: 30, w: W - 100, h: H - 60 });
    hbPoly(ctx, [A, B, C], INK, 0.05, 2.2);
    hbSeg(ctx, B, D, HB_GOLD, 2);
    hbSeg(ctx, D, E, HB_SKY, 2);
    pvRight(ctx, C, A, B, INK, 9);
    pvRight(ctx, E, A, D, HB_SKY, 9);
    pvTriLabels(ctx, A, B, C);
    pvLabel(ctx, D, 'D', -14, 0, HB_IVORY, 15);
    pvLabel(ctx, E, 'E', 8, -13, HB_IVORY, 15);
  },
  // AD 平分 ∠BAC，DE ⊥ AB、DF ⊥ AC（AB = 10、AC = 8、面積 27）
  q6(ctx, W, H) {
    const ang = Math.asin(27 / 40);
    const A0 = hbV(0, 0), B0 = hbV(10, 0), C0 = hbV(8 * Math.cos(ang), 8 * Math.sin(ang));
    const D0 = cgLL(A0, hbV(Math.cos(ang / 2), Math.sin(ang / 2)), B0, C0);
    const E0 = pvFoot(D0, A0, B0), F0 = pvFoot(D0, A0, C0);
    const [A, B, C, D, E, F] = pvFitMath([A0, B0, C0, D0, E0, F0], { x: 40, y: 30, w: W - 80, h: H - 60 });
    hbPoly(ctx, [A, B, C], INK, 0.05, 2.2);
    hbSeg(ctx, A, D, HB_GOLD, 2);
    hbSeg(ctx, D, E, HB_SKY, 2);
    hbSeg(ctx, D, F, HB_SKY, 2);
    pvRight(ctx, E, A, D, HB_SKY, 8);
    pvRight(ctx, F, A, D, HB_SKY, 8);
    pvTriLabels(ctx, A, B, C);
    pvLabel(ctx, D, 'D', 13, -4, HB_IVORY, 15);
    pvLabel(ctx, E, 'E', 0, 16, HB_IVORY, 15);
    pvLabel(ctx, F, 'F', -12, -8, HB_IVORY, 15);
  },
  // D 在 BC 上，DE ⊥ AB、DF ⊥ AC、DE = DF；∠BAD = 37°、∠C = 58°
  q7(ctx, W, H) {
    const t = hbTriangle(74, 48, { x: 40, y: 34, w: W - 80, h: H - 64 });
    const bA = pvBisDir(t.A, t.B, t.C);
    const D = cgLL(t.A, hbV(t.A.x + bA.x, t.A.y + bA.y), t.B, t.C);
    const E = pvFoot(D, t.A, t.B), F = pvFoot(D, t.A, t.C);
    hbPoly(ctx, [t.A, t.B, t.C], INK, 0.05, 2.2);
    hbSeg(ctx, t.A, D, INK, 2);
    hbSeg(ctx, D, E, HB_SKY, 2);
    hbSeg(ctx, D, F, HB_SKY, 2);
    pvRight(ctx, E, t.A, D, HB_SKY, 8);
    pvRight(ctx, F, t.A, D, HB_SKY, 8);
    pvTicks(ctx, D, E, 1, HB_GOLD);
    pvTicks(ctx, D, F, 1, HB_GOLD);
    hbAngle(ctx, t.A, t.B, D, 26, HB_ROSE, { label: '37°', lr: 42, font: f(800, 12.5) });
    hbAngle(ctx, t.C, t.A, t.B, 22, HB_MOSS, { label: '58°', lr: 38, font: f(800, 12.5) });
    pvTriLabels(ctx, t.A, t.B, t.C);
    pvLabel(ctx, D, 'D', 0, 16, HB_IVORY, 15);
    pvLabel(ctx, E, 'E', -12, -4, HB_IVORY, 15);
    pvLabel(ctx, F, 'F', 12, -4, HB_IVORY, 15);
  },
  // 梯形 ABCD：AD // BC、∠A = ∠B = 90°、∠CDE = 90°、CE 平分 ∠BCD（AB = 24、AD = 12）
  q9(ctx, W, H) {
    const M = [hbV(0, 24), hbV(0, 0), hbV(30, 0), hbV(12, 24), hbV(0, 15)];
    const [A, B, C, D, E] = pvFitMath(M, { x: 46, y: 26, w: W - 92, h: H - 52 });
    hbPoly(ctx, [A, B, C, D], INK, 0.05, 2.2);
    hbSeg(ctx, C, E, HB_GOLD, 2);
    hbSeg(ctx, D, E, HB_SKY, 2);
    pvRight(ctx, A, B, D, INK, 9);
    pvRight(ctx, B, A, C, INK, 9);
    pvRight(ctx, D, E, C, HB_SKY, 9);
    pvLabel(ctx, A, 'A', -12, -8);
    pvLabel(ctx, B, 'B', -12, 10);
    pvLabel(ctx, C, 'C', 12, 8);
    pvLabel(ctx, D, 'D', 6, -14);
    pvLabel(ctx, E, 'E', -14, 0);
  },
  // ∠C = 90°、AC = 12、BC = 18，L 為 AB 的中垂線，交 AB 於 D、交 BC 於 E
  q10(ctx, W, H) {
    const M = [hbV(0, 0), hbV(18, 0), hbV(0, 12), hbV(9, 6), hbV(5, 0)];
    const [C, B, A, D, E] = pvFitMath(M, { x: 40, y: 30, w: W - 80, h: H - 60 });
    hbPoly(ctx, [A, B, C], INK, 0.05, 2.2);
    const u = cgUnit(E, D);
    hbSeg(ctx, hbV(E.x - u.x * 16, E.y - u.y * 16), hbV(D.x + u.x * 40, D.y + u.y * 40), HB_SKY, 2);
    pvRight(ctx, C, A, B, INK, 9);
    pvRight(ctx, D, B, E, HB_SKY, 8);
    pvTicks(ctx, A, D, 1, HB_GOLD);
    pvTicks(ctx, D, B, 1, HB_GOLD);
    pvTriLabels(ctx, A, B, C);
    pvLabel(ctx, D, 'D', 4, -16, HB_IVORY, 15);
    pvLabel(ctx, E, 'E', 0, 17, HB_IVORY, 15);
    pvLabel(ctx, hbV(D.x + u.x * 40, D.y + u.y * 40), 'L', 10, -6, HB_SKY, 15);
  },
  // B、C、D 共線，AB = AC、EC = ED（示意：∠A = 60°、∠E = 90°）
  q15(ctx, W, H) {
    const B0 = hbV(0, 0), C0 = hbV(4, 0), D0 = hbV(7, 0);
    const A0 = hbV(2, 2 * Math.tan(60 * HB_RAD));
    const E0 = hbV(5.5, 1.5 * Math.tan(45 * HB_RAD));
    const [B, C, D, A, E] = pvFitMath([B0, C0, D0, A0, E0], { x: 34, y: 30, w: W - 68, h: H - 60 });
    hbSeg(ctx, hbV(B.x - 14, B.y), hbV(D.x + 14, D.y), INK, 2.2);
    hbPoly(ctx, [A, B, C], INK, 0.05, 2.2);
    hbPoly(ctx, [E, C, D], INK, 0.05, 2.2);
    pvTicks(ctx, A, B, 1, HB_GOLD);
    pvTicks(ctx, A, C, 1, HB_GOLD);
    pvTicks(ctx, E, C, 2, HB_SKY);
    pvTicks(ctx, E, D, 2, HB_SKY);
    hbAngle(ctx, C, A, E, 18, HB_ROSE, { alpha: 0.3 });
    pvLabel(ctx, A, 'A', 0, -15);
    pvLabel(ctx, B, 'B', 0, 17);
    pvLabel(ctx, C, 'C', 0, 17);
    pvLabel(ctx, D, 'D', 0, 17);
    pvLabel(ctx, E, 'E', 0, -15);
  },
  // △ABC，D 在 BC 上；BD、CD 的中垂線分別交 AB 於 E、交 AC 於 F（∠A = 68°）
  q17(ctx, W, H) {
    const t = hbTriangle(68, 50, { x: 40, y: 30, w: W - 80, h: H - 62 });
    const D = hbV(t.B.x + (t.C.x - t.B.x) * 0.56, t.B.y);
    const M1 = hbV((t.B.x + D.x) / 2, D.y), M2 = hbV((D.x + t.C.x) / 2, D.y);
    const E = cgLL(M1, hbV(M1.x, M1.y - 10), t.B, t.A);
    const F = cgLL(M2, hbV(M2.x, M2.y - 10), t.C, t.A);
    hbPoly(ctx, [t.A, t.B, t.C], INK, 0.05, 2.2);
    hbSeg(ctx, hbV(M1.x, M1.y + 10), hbV(E.x, E.y - 14), HB_SKY, 1.8);
    hbSeg(ctx, hbV(M2.x, M2.y + 10), hbV(F.x, F.y - 14), HB_SKY, 1.8);
    hbSeg(ctx, E, D, HB_ROSE, 2);
    hbSeg(ctx, F, D, HB_ROSE, 2);
    pvRight(ctx, M1, D, E, HB_SKY, 7);
    pvRight(ctx, M2, t.C, F, HB_SKY, 7);
    pvTicks(ctx, t.B, M1, 1, HB_GOLD);
    pvTicks(ctx, M1, D, 1, HB_GOLD);
    pvTicks(ctx, D, M2, 2, HB_GOLD);
    pvTicks(ctx, M2, t.C, 2, HB_GOLD);
    hbAngle(ctx, t.A, t.B, t.C, 20, HB_MOSS, { label: '68°', lr: 36, font: f(800, 12.5) });
    pvTriLabels(ctx, t.A, t.B, t.C);
    pvLabel(ctx, D, 'D', 0, 17, HB_IVORY, 15);
    pvLabel(ctx, E, 'E', -14, -2, HB_IVORY, 15);
    pvLabel(ctx, F, 'F', 14, -2, HB_IVORY, 15);
  },
  // 直角 △ABC（∠A = 90°），L 為 BC 的中垂線，BD 平分 ∠ABC，L 與 BD 交於 O；∠DCO = 24°
  q18(ctx, W, H) {
    const t = hbTriangle(90, 44, { x: 40, y: 30, w: W - 80, h: H - 60 });
    const bB = pvBisDir(t.B, t.A, t.C);
    const D = cgLL(t.B, hbV(t.B.x + bB.x, t.B.y + bB.y), t.A, t.C);
    const M = hbV((t.B.x + t.C.x) / 2, t.B.y);
    const O = cgLL(M, hbV(M.x, M.y - 10), t.B, D);
    hbPoly(ctx, [t.A, t.B, t.C], INK, 0.05, 2.2);
    hbSeg(ctx, t.B, D, HB_GOLD, 2);
    hbSeg(ctx, hbV(M.x, M.y + 10), hbV(M.x, Math.min(O.y, D.y) - 30), HB_SKY, 1.8);
    hbSeg(ctx, O, t.C, HB_ROSE, 2);
    pvRight(ctx, t.A, t.B, t.C, INK, 9);
    pvRight(ctx, M, t.C, O, HB_SKY, 7);
    hbAngle(ctx, t.C, D, O, 30, HB_ROSE, { label: '24°', lr: 46, font: f(800, 12.5) });
    pvTriLabels(ctx, t.A, t.B, t.C);
    pvLabel(ctx, D, 'D', 12, -6, HB_IVORY, 15);
    pvLabel(ctx, O, 'O', -13, -8, HB_IVORY, 15);
    pvLabel(ctx, hbV(M.x, Math.min(O.y, D.y) - 30), 'L', 10, 2, HB_SKY, 15);
  },
  // △ABC，D 在 AC 上，∠ABD = ∠A、∠BDC = ∠C（AC = 15、BC = 7 → BD = AD = 7、DC = 8）
  q21(ctx, W, H) {
    const M = [hbV(-7, 0), hbV(4, Math.sqrt(49 - 16)), hbV(8, 0), hbV(0, 0)];
    const [A, B, C, D] = pvFitMath(M, { x: 30, y: 50, w: W - 60, h: H - 100 });
    hbPoly(ctx, [A, B, C], INK, 0.05, 2.2);
    hbSeg(ctx, B, D, INK, 2);
    hbAngle(ctx, A, B, C, 26, HB_ROSE, { alpha: 0.32 });
    hbAngle(ctx, B, A, D, 26, HB_ROSE, { alpha: 0.32 });
    hbAngle(ctx, D, B, C, 20, HB_SKY, { alpha: 0.32 });
    hbAngle(ctx, C, B, D, 20, HB_SKY, { alpha: 0.32 });
    pvLabel(ctx, A, 'A', -12, 8);
    pvLabel(ctx, B, 'B', 0, -15);
    pvLabel(ctx, C, 'C', 12, 8);
    pvLabel(ctx, D, 'D', 0, 17);
  }
};

function initQuizFigs() {
  document.querySelectorAll('canvas.quiz-fig[data-fig]').forEach(cv => {
    const fn = PV_QUIZ_FIGS[cv.getAttribute('data-fig')];
    if (!fn) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    fn(ctx, cv.width, cv.height);
  });
}

/* ==========================================================================
   重點 1：中垂線性質——中垂線上任一點到兩端點等距
   ========================================================================== */
function initPbPropCanvas() {
  const cv = hbEl('canvas-pb');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sh = hbEl('pb-h'), sd = hbEl('pb-d'), vh = hbEl('pb-vh'), vd = hbEl('pb-vd');
  const out = hbEl('pb-formula'), fb = hbEl('pb-feedback');
  const TONE = HB_TONE[0], U = 32, X0 = 270, Y0 = 268;

  function draw() {
    const W = cv.width;
    const h = parseFloat(sh.value), d = parseFloat(sd.value);
    vh.textContent = pvNum(h);
    vd.textContent = pvNum(d);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '直線 L 是 AB 的中垂線，C 點在哪裡？', TONE);

    const A = hbV(X0 - 4 * U, Y0), B = hbV(X0 + 4 * U, Y0), D = hbV(X0, Y0);
    const C = hbV(X0 + d * U, Y0 - h * U);
    const onL = d === 0;

    if (onL && h !== 0) {
      pvFill(ctx, [C, A, D], HB_ROSE, 0.12);
      pvFill(ctx, [C, D, B], HB_MOSS, 0.12);
    }
    hbSeg(ctx, hbV(X0, 60), hbV(X0, 452), HB_SKY, 2.2);
    textCenter(ctx, 'L', X0 + 14, 66, HB_SKY, fi(800, 17));
    hbSeg(ctx, A, B, INK, 2.6);
    pvRight(ctx, D, B, hbV(X0, 60), HB_SKY, 12);
    pvTicks(ctx, A, D, 1, HB_GOLD);
    pvTicks(ctx, D, B, 1, HB_GOLD);
    if (!onL) hbSeg(ctx, C, hbV(X0, C.y), MUTED, 1.4, [5, 4]);
    hbSeg(ctx, C, A, HB_ROSE, 2.6);
    hbSeg(ctx, C, B, HB_MOSS, 2.6);
    [A, B, D].forEach(P => hbDot(ctx, P, HB_IVORY, 4));
    hbDot(ctx, C, HB_GOLD, 6);
    pvLabel(ctx, A, 'A', -16, 0);
    pvLabel(ctx, B, 'B', 16, 0);
    pvLabel(ctx, D, 'D', 13, 16);
    pvLabel(ctx, C, 'C', 15, h >= 0 ? -14 : 16, HB_GOLD);

    const ca = pvLen(hbDist(C, A) / U), cb = pvLen(hbDist(C, B) / U);
    textCenter(ctx, `CA ${ca.rel} ${ca.s}`, W / 2 - 90, 476, HB_ROSE, f(800, 17));
    textCenter(ctx, `CB ${cb.rel} ${cb.s}`, W / 2 + 90, 476, HB_MOSS, f(800, 17));
    let verdict;
    if (onL) verdict = 'C 在 L 上：CA = CB';
    else verdict = d > 0 ? 'C 偏向 B 那一側：CB 比較短' : 'C 偏向 A 那一側：CA 比較短';
    textCenter(ctx, verdict, W / 2, 506, onL ? HB_GOLD : HB_RED, f(800, 16));

    out.innerHTML = `\\(\\overline{CA} ${ca.tex} ${ca.s}\\)，<wbr>\\(\\overline{CB} ${cb.tex} ${cb.s}\\)`;
    if (onL && h !== 0) {
      fb.innerHTML = wrapFeedback(`\\(\\triangle CAD\\) 與 \\(\\triangle CBD\\) 中：\\(\\overline{AD} = \\overline{BD}\\)、\\(\\angle CDA = \\angle CDB = 90^\\circ\\)、\\(\\overline{CD}\\) 共用，<br>所以 \\(\\triangle CAD \\cong \\triangle CBD\\)（SAS），<strong>\\(\\overline{CA} = \\overline{CB}\\)</strong>。拉動高度，C 在 L 上的哪裡都成立。`);
    } else if (onL) {
      fb.innerHTML = wrapFeedback(`C 剛好落在 \\(D\\)，也就是 \\(\\overline{AB}\\) 的中點：\\(\\overline{CA} = \\overline{CB} = \\frac{1}{2}\\overline{AB}\\)。<br>中點本身也在中垂線上。`);
    } else {
      fb.innerHTML = wrapFeedback(`C 離開了 L，兩個三角形不再全等，\\(\\overline{CA} \\ne \\overline{CB}\\)。<br>把「偏離 L」調回 \\(0\\)，兩段長度又會一樣。`);
    }
    typeset([out, fb]);
  }

  [sh, sd].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：中垂線的判別性質——到兩端點等距的點都在中垂線上
   ========================================================================== */
function initPbConvCanvas() {
  const cv = hbEl('canvas-pc');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sab = hbEl('pc-ab'), sr = hbEl('pc-r'), vab = hbEl('pc-vab'), vr = hbEl('pc-vr');
  const g = hbEl('pc-mode-group');
  const out = hbEl('pc-formula'), fb = hbEl('pc-feedback');
  const TONE = HB_TONE[1], U = 26, X0 = 270, Y0 = 262;
  const trail = {};
  let mode = 'one';

  function draw() {
    const W = cv.width;
    const ab = hbIv(sab);
    const r = Math.max(parseFloat(sr.value), ab / 2 + 0.5);
    sr.min = ab / 2 + 0.5;
    sr.value = r;
    vab.textContent = ab;
    vr.textContent = pvNum(r);
    if (!trail[ab]) trail[ab] = new Set();
    trail[ab].add(r);

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '以 A、B 為圓心，畫兩個一樣大的圓', TONE);
    const A = hbV(X0 - ab / 2 * U, Y0), B = hbV(X0 + ab / 2 * U, Y0);

    pvClip(ctx, 44, 460);
    [A, B].forEach(Cn => {
      ctx.save();
      ctx.strokeStyle = HB_GOLD;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(Cn.x, Cn.y, r * U, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    if (mode === 'all') {
      hbSeg(ctx, hbV(X0, 46), hbV(X0, 458), HB_SKY, 2, [7, 5]);
      textLeft(ctx, 'AB 的中垂線', X0 + 8, 58, HB_SKY, f(700, 13));
      trail[ab].forEach(rr => {
        cgCC(A, rr * U, B, rr * U).forEach(P => hbDot(ctx, P, HB_JADE, 3.6));
      });
    }
    ctx.restore();

    const pts = cgCC(A, r * U, B, r * U);
    const P = cgUpper(pts), Q = cgLower(pts);
    const M = pvFoot(P, A, B);
    hbSeg(ctx, A, B, INK, 2.6);
    hbSeg(ctx, P, Q, HB_SKY, 2, [6, 5]);
    pvRight(ctx, M, B, P, HB_SKY, 11);
    pvTicks(ctx, A, M, 1, HB_JADE);
    pvTicks(ctx, M, B, 1, HB_JADE);
    [P, Q].forEach(X => {
      hbSeg(ctx, X, A, HB_ROSE, 2.4);
      hbSeg(ctx, X, B, HB_ROSE, 2.4);
    });
    [A, B, M].forEach(X => hbDot(ctx, X, HB_IVORY, 4));
    hbDot(ctx, P, HB_GOLD, 6);
    hbDot(ctx, Q, HB_GOLD, 6);
    pvLabel(ctx, A, 'A', -16, -2);
    pvLabel(ctx, B, 'B', 16, -2);
    pvLabel(ctx, M, 'M', 14, 16);
    pvLabel(ctx, P, 'P', 0, -17, HB_GOLD);
    pvLabel(ctx, Q, 'Q', 0, 18, HB_GOLD);

    const pa = pvLen(hbDist(P, A) / U), pb = pvLen(hbDist(P, B) / U);
    const am = pvLen(hbDist(A, M) / U), bm = pvLen(hbDist(B, M) / U);
    textCenter(ctx, `PA ${pa.rel} ${pa.s}，PB ${pb.rel} ${pb.s}（都是半徑）`, W / 2, 482, HB_ROSE, f(800, 16));
    textCenter(ctx, `AM ${am.rel} ${am.s}，BM ${bm.rel} ${bm.s}：M 是 AB 的中點`, W / 2, 508, HB_JADE, f(800, 16));

    out.innerHTML = `\\(\\overline{PA} = \\overline{PB} = ${pvNum(r)}\\)，<wbr>\\(\\overline{AM} = \\overline{BM} = ${pvNum(ab / 2)}\\)`;
    fb.innerHTML = wrapFeedback(mode === 'one'
      ? `\\(\\overline{PA} = \\overline{PB}\\)，作 \\(\\overline{PM} \\perp \\overline{AB}\\)：斜邊 \\(\\overline{PA} = \\overline{PB}\\)、股 \\(\\overline{PM}\\) 共用，\\(\\triangle APM \\cong \\triangle BPM\\)（RHS），<br>所以 \\(\\overline{AM} = \\overline{BM}\\)，\\(\\overleftrightarrow{PM}\\) 就是中垂線。按「留下所有交點」再拉半徑看看。`
      : `每換一次半徑就多兩個到 \\(A\\)、\\(B\\) 等距的點——它們<strong>全部排在 \\(\\overline{AB}\\) 的中垂線上</strong>。<br>到兩端點等距的點有無限多個，但沒有一個跑出這條線。`);
    typeset([out, fb]);
  }

  sab.addEventListener('input', draw);
  sr.addEventListener('input', draw);
  bindPickGroup(g, 'data-pc-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：角平分線性質——角平分線上任一點到兩邊等距（距離是垂線段）
   ========================================================================== */
function initAbPropCanvas() {
  const cv = hbEl('canvas-ab');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('ab-ang'), sd = hbEl('ab-d'), so = hbEl('ab-off');
  const va = hbEl('ab-vang'), vd = hbEl('ab-vd'), vo = hbEl('ab-voff');
  const g = hbEl('ab-mode-group');
  const out = hbEl('ab-formula'), fb = hbEl('ab-feedback');
  const TONE = HB_TONE[2], U = 30;
  let mode = 'perp';

  function draw() {
    const W = cv.width;
    const ang = hbIv(sa);
    const lim = Math.min(15, Math.floor((ang / 2 - 10) / 5) * 5);
    const off = hbClampSlider(so, -lim, lim);
    const dd = hbIv(sd);
    va.textContent = ang;
    vd.textContent = dd;
    vo.textContent = pvNum(off);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, 'AP 平分 ∠EAF，D 點到兩邊的距離', TONE);

    const A = hbV(270, 410);
    const rayL = Math.min(320, 238 / Math.max(Math.abs(Math.cos((90 - ang / 2) * HB_RAD)), 1e-6));   // 端點標籤不出畫布
    const E = hbAt(A, 90 - ang / 2, rayL), F = hbAt(A, 90 + ang / 2, rayL);
    const Pend = hbAt(A, 90, 350);
    const D = hbAt(A, 90 + off, dd * U);
    const Cf = pvFoot(D, A, E), Bf = pvFoot(D, A, F);

    hbSector(ctx, A, 90 - ang / 2, ang / 2, 40, HB_GOLD, { alpha: 0.18, label: '2', lr: 54, font: f(800, 13) });
    hbSector(ctx, A, 90, ang / 2, 46, HB_GOLD, { alpha: 0.3, label: '1', lr: 60, font: f(800, 13) });
    hbSeg(ctx, A, E, INK, 2.6);
    hbSeg(ctx, A, F, INK, 2.6);
    hbSeg(ctx, A, Pend, HB_GOLD, 2, [7, 5]);
    pvLabelAway(ctx, E, A, 'E', 14);
    pvLabelAway(ctx, F, A, 'F', 14);
    pvLabel(ctx, Pend, 'P', 0, -14, HB_GOLD);
    pvLabel(ctx, A, 'A', 0, 18);

    if (mode === 'perp') {
      hbSeg(ctx, D, Cf, HB_SKY, 2.6);
      hbSeg(ctx, D, Bf, HB_ROSE, 2.6);
      pvRight(ctx, Cf, A, D, HB_SKY, 10);
      pvRight(ctx, Bf, A, D, HB_ROSE, 10);
      hbDot(ctx, Cf, HB_SKY, 4);
      hbDot(ctx, Bf, HB_ROSE, 4);
      pvLabelAway(ctx, Cf, D, 'C', 17, HB_SKY, 16);
      pvLabelAway(ctx, Bf, D, 'B', 17, HB_ROSE, 16);
    } else {
      const S1 = hbAt(A, 90 - ang / 2, hbDist(A, Cf) + 2.2 * U);
      const S2 = hbAt(A, 90 + ang / 2, Math.max(hbDist(A, Bf) - 1.6 * U, 0.6 * U));
      hbSeg(ctx, D, S1, HB_SKY, 2.4, [6, 4]);
      hbSeg(ctx, D, S2, HB_ROSE, 2.4, [6, 4]);
      hbDot(ctx, S1, HB_SKY, 4);
      hbDot(ctx, S2, HB_ROSE, 4);
    }
    hbDot(ctx, D, HB_GOLD, 6);
    pvLabel(ctx, D, 'D', off >= 0 ? 16 : -16, -6, HB_GOLD);

    const dc = hbDist(D, Cf) / U, db = hbDist(D, Bf) / U;
    const L1 = pvLen(dc), L2 = pvLen(db);
    if (mode === 'perp') {
      textCenter(ctx, `DC ${L1.rel} ${L1.s}`, W / 2 - 90, 466, HB_SKY, f(800, 17));
      textCenter(ctx, `DB ${L2.rel} ${L2.s}`, W / 2 + 90, 466, HB_ROSE, f(800, 17));
      const same = off === 0;
      textCenter(ctx, same ? 'D 在角平分線上：DC = DB' : 'D 不在角平分線上：兩個距離不相等', W / 2, 496, same ? HB_GOLD : HB_RED, f(800, 16));
    } else {
      const S1 = hbAt(A, 90 - ang / 2, hbDist(A, Cf) + 2.2 * U);
      const s1 = pvLen(hbDist(D, S1) / U);
      textCenter(ctx, `斜著量到 AE：${s1.rel} ${s1.s}，比垂線段 DC（${L1.s}）長`, W / 2, 466, HB_SKY, f(800, 15.5));
      textCenter(ctx, '斜線段隨便量都不一樣——「距離」只認垂線段', W / 2, 496, HB_RED, f(800, 16));
    }

    out.innerHTML = `\\(\\overline{DC} ${L1.tex} ${L1.s}\\)，<wbr>\\(\\overline{DB} ${L2.tex} ${L2.s}\\)`;
    if (mode === 'slant') {
      fb.innerHTML = wrapFeedback(`點到直線的<strong>距離</strong>是它到直線的<strong>垂線段</strong>長，最短的那一條。<br>斜線段的長度要看斜到哪裡，不是距離；按回「垂線段」才能比較。`);
    } else if (off === 0) {
      fb.innerHTML = wrapFeedback(`\\(\\triangle ACD\\) 與 \\(\\triangle ABD\\) 中：\\(\\angle 1 = \\angle 2\\)、\\(\\angle ACD = \\angle ABD = 90^\\circ\\)、\\(\\overline{AD}\\) 共用，<br>所以 \\(\\triangle ACD \\cong \\triangle ABD\\)（AAS），<strong>\\(\\overline{DC} = \\overline{DB}\\)</strong>。改角度、改 \\(\\overline{AD}\\) 都一樣。`);
    } else {
      fb.innerHTML = wrapFeedback(`D 偏向 \\(\\overrightarrow{A${off > 0 ? 'F' : 'E'}}\\) 那一側，離那一邊比較近。<br>把「偏離角平分線」調回 \\(0\\)，兩個距離就相等。`);
    }
    typeset([out, fb]);
  }

  [sa, sd, so].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-ab-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：角平分線的判別性質——到兩邊等距的點在角平分線上
   ========================================================================== */
function initAbConvCanvas() {
  const cv = hbEl('canvas-ac');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('ac-ang'), sp = hbEl('ac-p'), sq = hbEl('ac-q');
  const va = hbEl('ac-vang'), vp = hbEl('ac-vp'), vq = hbEl('ac-vq');
  const out = hbEl('ac-formula'), fb = hbEl('ac-feedback');
  const TONE = HB_TONE[3], U = 26;

  function draw() {
    const W = cv.width;
    const ang = hbIv(sa), p = parseFloat(sp.value), q = parseFloat(sq.value);
    va.textContent = ang;
    vp.textContent = pvNum(p);
    vq.textContent = pvNum(q);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, 'P 在 ∠EAF 內：PB ⊥ AE、PC ⊥ AF', TONE);

    const A = hbV(140, 404);
    const fL = Math.cos(ang * HB_RAD) < 0 ? Math.min(262, 110 / -Math.cos(ang * HB_RAD)) : 262;   // F 標籤不出畫布
    const E = hbV(524, 404), F = hbAt(A, ang, fL);
    const x = (q + p * Math.cos(ang * HB_RAD)) / Math.sin(ang * HB_RAD);
    const P = hbV(A.x + x * U, A.y - p * U);
    const Bf = pvFoot(P, A, E), Cf = pvFoot(P, A, F);
    const Bis = hbAt(A, ang / 2, 300);

    hbSeg(ctx, A, Bis, HB_GOLD, 1.6, [3, 6]);
    hbSeg(ctx, A, E, INK, 2.6);
    hbSeg(ctx, A, F, INK, 2.6);
    const Pext = hbBeyond(A, P, 40);
    hbSeg(ctx, A, Pext, HB_VIOLET, 2.2);
    hbAngle(ctx, A, E, P, 34, HB_SKY, { alpha: 0.26 });
    hbAngle(ctx, A, P, F, 46, HB_ROSE, { alpha: 0.26 });
    hbSeg(ctx, P, Bf, HB_SKY, 2.6);
    hbSeg(ctx, P, Cf, HB_ROSE, 2.6);
    pvRight(ctx, Bf, A, P, HB_SKY, 10);
    pvRight(ctx, Cf, A, P, HB_ROSE, 10);
    hbDot(ctx, P, HB_GOLD, 6);
    hbDot(ctx, Bf, HB_SKY, 4);
    hbDot(ctx, Cf, HB_ROSE, 4);
    pvLabel(ctx, A, 'A', -6, 20);
    pvLabel(ctx, E, 'E', 0, 18);
    pvLabelAway(ctx, F, A, 'F', 14);
    pvLabelAway(ctx, Bf, P, 'B', 17, HB_SKY, 16);
    pvLabelAway(ctx, Cf, P, 'C', 17, HB_ROSE, 16);
    pvLabel(ctx, P, 'P', 14, -12, HB_GOLD);
    textLeft(ctx, '點線：∠EAF 的角平分線', 12, 58, HB_GOLD, f(700, 13));

    const aE = hbAngleDeg(A, E, P), aF = hbAngleDeg(A, P, F);
    const same = p === q;
    textCenter(ctx, `∠PAE ≈ ${pvDeg(aE)}°`, W / 2 - 92, 446, HB_SKY, f(800, 17));
    textCenter(ctx, `∠PAF ≈ ${pvDeg(aF)}°`, W / 2 + 92, 446, HB_ROSE, f(800, 17));
    textCenter(ctx, same ? `PB = PC ⇒ ∠PAE = ∠PAF = ${pvDeg(aE)}°：AP 平分 ∠EAF` : 'PB ≠ PC：AP 不是角平分線',
      W / 2, 478, same ? HB_GOLD : HB_RED, f(800, 15.5));

    const rel = same ? '=' : '\\ne';
    out.innerHTML = `\\(\\angle PAE \\approx ${pvDeg(aE)}^\\circ\\)，<wbr>\\(\\angle PAF \\approx ${pvDeg(aF)}^\\circ\\)`;
    fb.innerHTML = wrapFeedback(same
      ? `\\(\\overline{PB} = \\overline{PC} = ${pvNum(p)}\\)：\\(\\triangle APB\\) 與 \\(\\triangle APC\\) 的斜邊 \\(\\overline{PA}\\) 共用、一股相等，<br>\\(\\triangle APB \\cong \\triangle APC\\)（RHS），所以 \\(\\angle PAE = \\angle PAF\\)，<strong>P 在角平分線上</strong>。`
      : `\\(\\overline{PB} ${rel} \\overline{PC}\\)，P 不在角平分線（點線）上。<br>把兩個距離調成一樣，看紫色的 \\(\\overrightarrow{AP}\\) 怎麼和點線疊在一起。`);
    typeset([out, fb]);
  }

  [sa, sp, sq].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：綜合應用——等長搬過去，再用畢氏定理列方程式
   ========================================================================== */
const PV_TRIPLES = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13]];

function initApplyCanvas() {
  const cv = hbEl('canvas-ap');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('ap-a'), sk = hbEl('ap-k'), va = hbEl('ap-va'), vk = hbEl('ap-vk');
  const rowA = hbEl('ap-row-a'), rowK = hbEl('ap-row-k');
  const g = hbEl('ap-mode-group');
  const out = hbEl('ap-formula'), fb = hbEl('ap-feedback');
  const TONE = HB_TONE[4];
  let mode = 'pb';

  function drawPb() {
    const W = cv.width;
    const a = hbIv(sa), b = 8, U = 36;
    va.textContent = a;
    drawTitle(ctx, '∠C = 90°，L 是 AB 的中垂線，交 BC 於 E', TONE);
    const C = hbV(100, 396), B = hbV(100 + b * U, 396), A = hbV(100, 396 - a * U);
    const M = hbV((A.x + B.x) / 2, (A.y + B.y) / 2);
    const E = cgLL(M, hbV(M.x + pvPerpDir(A, B).x, M.y + pvPerpDir(A, B).y), C, B);
    hbPoly(ctx, [A, B, C], INK, 0.05, 2.6);
    const u = cgUnit(E, M);
    hbSeg(ctx, hbV(E.x - u.x * 20, E.y - u.y * 20), hbV(M.x + u.x * 60, M.y + u.y * 60), HB_SKY, 2.2);
    pvLabel(ctx, hbV(M.x + u.x * 60, M.y + u.y * 60), 'L', 10, -6, HB_SKY, 16);
    hbSeg(ctx, A, E, HB_ROSE, 2.4, [6, 4]);
    pvRight(ctx, C, A, B, INK, 12);
    pvRight(ctx, M, B, E, HB_SKY, 9);
    pvTicks(ctx, A, E, 2, HB_ROSE);
    pvTicks(ctx, E, B, 2, HB_ROSE);
    pvTriLabels(ctx, A, B, C);
    pvLabel(ctx, E, 'E', 0, 20, HB_IVORY, 16);
    textCenter(ctx, 'x', (C.x + E.x) / 2, C.y + 22, HB_GOLD, fi(800, 16));
    textCenter(ctx, `${a}`, A.x - 18, (A.y + C.y) / 2, HB_IVORY, f(800, 15));

    const xNum = b * b - a * a, xDen = 2 * b;
    const meas = hbDist(C, E) / U;
    textCenter(ctx, `① 中垂線性質：設 CE = x，則 AE = BE = ${b} − x`, W / 2, 444, INK, f(800, 15));
    textCenter(ctx, `② △AEC 中：x² + ${a}² = (${b} − x)²`, W / 2, 474, INK, f(800, 15));
    drawExpr(ctx, [T('③', HB_GOLD), SEQ([T(`${2 * b}`, HB_GOLD), IT('x', HB_GOLD)], HB_GOLD, 1), T(`= ${b * b} − ${a * a}`, HB_GOLD),
      T('，', HB_GOLD), IT('x', HB_GOLD), T('=', HB_GOLD), pvFracItem(xNum, xDen, HB_GOLD)], W / 2, 510, 17);
    textCenter(ctx, `（量一量：CE ≈ ${meas.toFixed(2)}）`, W / 2, 544, MUTED, f(700, 13));

    out.innerHTML = `\\(x^2 + ${a}^2 = (${b} - x)^2\\)，<wbr>\\(x = ${pvFracTex(xNum, xDen)}\\)`;
    fb.innerHTML = wrapFeedback(`E 在 \\(\\overline{AB}\\) 的中垂線上，所以 \\(\\overline{AE} = \\overline{BE}\\)：把 \\(\\overline{BE}\\) <strong>搬</strong>到 \\(\\triangle AEC\\) 裡，<br>直角三角形的三邊就都用 \\(x\\) 表示得出來，畢氏定理給出方程式。`);
  }

  function drawAb() {
    const W = cv.width;
    const k = hbIv(sk);
    const [a, b, c] = PV_TRIPLES[k - 1];
    vk.textContent = `AC = ${a}、BC = ${b}、AB = ${c}`;
    const U = 280 / Math.max(a, b);
    drawTitle(ctx, '∠C = 90°，BD 平分 ∠ABC，DE ⊥ AB', TONE);
    const C = hbV(110, 410), B = hbV(110 + b * U, 410), A = hbV(110, 410 - a * U);
    const D = cgLL(B, hbV(B.x + pvBisDir(B, A, C).x, B.y + pvBisDir(B, A, C).y), A, C);
    const E = pvFoot(D, A, B);
    hbPoly(ctx, [A, B, C], INK, 0.05, 2.6);
    hbSeg(ctx, B, D, HB_GOLD, 2.4);
    hbSeg(ctx, D, E, HB_SKY, 2.4);
    pvRight(ctx, C, A, B, INK, 12);
    pvRight(ctx, E, A, D, HB_SKY, 9);
    pvTicks(ctx, D, C, 2, HB_SKY);
    pvTicks(ctx, D, E, 2, HB_SKY);
    pvTicks(ctx, B, C, 1, HB_ROSE);
    pvTicks(ctx, B, E, 1, HB_ROSE);
    pvTriLabels(ctx, A, B, C);
    pvLabel(ctx, D, 'D', -16, 0, HB_IVORY, 16);
    pvLabelAway(ctx, E, D, 'E', 17, HB_IVORY, 16);

    const xNum = a * b, xDen = b + c;
    const meas = hbDist(D, C) / U;
    textCenter(ctx, `① 角平分線性質：DE = DC = x；RHS 全等得 BE = BC = ${b}`, W / 2, 444, INK, f(800, 14.5));
    textCenter(ctx, `② AE = ${c} − ${b} = ${c - b}，AD = ${a} − x；△ADE 中：(${a} − x)² = x² + ${c - b}²`, W / 2, 474, INK, f(800, 14.5));
    drawExpr(ctx, [T('③', HB_GOLD), SEQ([T(`${2 * a}`, HB_GOLD), IT('x', HB_GOLD)], HB_GOLD, 1), T(`= ${a * a - (c - b) * (c - b)}`, HB_GOLD),
      T('，', HB_GOLD), IT('x', HB_GOLD), T('=', HB_GOLD), pvFracItem(xNum, xDen, HB_GOLD)], W / 2, 510, 17);
    textCenter(ctx, `（量一量：DC ≈ ${meas.toFixed(2)}）`, W / 2, 544, MUTED, f(700, 13));

    out.innerHTML = `\\((${a} - x)^2 = x^2 + ${c - b}^2\\)，<wbr>\\(x = ${pvFracTex(xNum, xDen)}\\)`;
    fb.innerHTML = wrapFeedback(`D 在 \\(\\angle ABC\\) 的角平分線上，所以 \\(\\overline{DE} = \\overline{DC}\\)；再由 \\(\\triangle BDE \\cong \\triangle BDC\\)（RHS）得 \\(\\overline{BE} = \\overline{BC}\\)。<br>兩段等長都搬進 \\(\\triangle ADE\\)，就能用畢氏定理列出 \\(x\\) 的方程式。`);
  }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    rowA.style.display = mode === 'pb' ? '' : 'none';
    rowK.style.display = mode === 'ab' ? '' : 'none';
    if (mode === 'pb') drawPb(); else drawAb();
    typeset([out, fb]);
  }

  sa.addEventListener('input', draw);
  sk.addEventListener('input', draw);
  bindPickGroup(g, 'data-ap-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：同時滿足兩個條件——中垂線與角平分線的交點
   ========================================================================== */
function initFindCanvas() {
  const cv = hbEl('canvas-fd');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sc = hbEl('fd-cx'), vc = hbEl('fd-vcx');
  const gp = hbEl('fd-pb-group'), ga = hbEl('fd-ab-group');
  const out = hbEl('fd-formula'), fb = hbEl('fd-feedback');
  const TONE = HB_TONE[5], U = 40;
  let pair = 'AB', vert = 'B';

  function draw() {
    const W = cv.width;
    const cx = hbIv(sc);
    vc.textContent = cx;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `到 ${pair[0]}、${pair[1]} 等距，又到 ∠${vert} 兩邊等距的點`, TONE);
    const P = { A: hbV(170, 120), B: hbV(80, 380), C: hbV(80 + cx * U, 380) };
    const X = P[pair[0]], Y = P[pair[1]];
    const V = P[vert];
    const nb = ['A', 'B', 'C'].filter(s => s !== vert).map(s => P[s]);

    const M = hbV((X.x + Y.x) / 2, (X.y + Y.y) / 2);
    const pd = pvPerpDir(X, Y);
    const bd = pvBisDir(V, nb[0], nb[1]);
    const Pt = cgLL(M, hbV(M.x + pd.x, M.y + pd.y), V, hbV(V.x + bd.x, V.y + bd.y));

    hbPoly(ctx, [P.A, P.B, P.C], INK, 0.05, 2.6);
    pvClip(ctx, 44, 420);
    pvLineDir(ctx, M, pd, 700, HB_SKY, 2.2);
    pvLineDir(ctx, V, bd, 700, HB_GOLD, 2.2, [8, 5]);
    ctx.restore();
    pvRight(ctx, M, Y, hbV(M.x + pd.x, M.y + pd.y), HB_SKY, 9);
    pvTicks(ctx, X, M, 1, HB_SKY);
    pvTicks(ctx, M, Y, 1, HB_SKY);
    pvTriLabels(ctx, P.A, P.B, P.C);
    textLeft(ctx, `實線：${pair[0]}${pair[1]} 的中垂線`, 300, 64, HB_SKY, f(700, 13));
    textLeft(ctx, `虛線：∠${vert} 的角平分線`, 300, 84, HB_GOLD, f(700, 13));

    let lines;
    if (!Pt) {
      lines = ['兩條線平行，沒有交點：找不到這樣的點'];
      out.innerHTML = `\\(\\text{無交點}\\)`;
      fb.innerHTML = wrapFeedback('換一組條件，或拉動 C 點改變三角形的形狀。');
    } else {
      const inside = pvInside(Pt, P.A, P.B, P.C);
      const visible = Pt.x > 6 && Pt.x < W - 6 && Pt.y > 44 && Pt.y < 420;
      const F1 = pvFoot(Pt, V, nb[0]), F2 = pvFoot(Pt, V, nb[1]);
      if (visible) {
        hbSeg(ctx, Pt, X, HB_ROSE, 1.8, [5, 4]);
        hbSeg(ctx, Pt, Y, HB_ROSE, 1.8, [5, 4]);
        hbSeg(ctx, Pt, F1, HB_MOSS, 2.2);
        hbSeg(ctx, Pt, F2, HB_MOSS, 2.2);
        pvRight(ctx, F1, V, Pt, HB_MOSS, 8);
        pvRight(ctx, F2, V, Pt, HB_MOSS, 8);
        hbDot(ctx, Pt, HB_GOLD, 6.5);
        pvLabel(ctx, Pt, 'P', 14, -12, HB_GOLD);
      }
      const px = pvLen(hbDist(Pt, X) / U), py = pvLen(hbDist(Pt, Y) / U);
      const d1 = pvLen(hbDist(Pt, F1) / U), d2 = pvLen(hbDist(Pt, F2) / U);
      lines = [
        `P${pair[0]} ${px.rel} ${px.s}，P${pair[1]} ${py.rel} ${py.s}`,
        `P 到 ∠${vert} 兩邊的距離：${d1.rel} ${d1.s}、${d2.rel} ${d2.s}`,
        inside ? 'P 在三角形內部' : (visible ? 'P 在三角形外面' : 'P 在三角形外面，超出畫面')
      ];
      out.innerHTML = `\\(\\overline{P${pair[0]}} ${px.tex} ${px.s}\\)，<wbr>\\(\\overline{P${pair[1]}} ${py.tex} ${py.s}\\)`;
      fb.innerHTML = wrapFeedback(`P 在 \\(\\overline{${pair}}\\) 的中垂線上 → 到 \\(${pair[0]}\\)、\\(${pair[1]}\\) 等距；P 在 \\(\\angle ${vert}\\) 的角平分線上 → 到 \\(\\angle ${vert}\\) 兩邊等距。<br>兩個條件<strong>各給一條線</strong>，同時滿足就是兩線的<strong>交點</strong>。${inside ? '' : '這一組的交點跑到三角形外面了。'}`);
    }
    lines.forEach((s, i) => textCenter(ctx, s, W / 2, 448 + i * 28, i === 2 ? HB_GOLD : INK, f(800, 15)));
    typeset([out, fb]);
  }

  sc.addEventListener('input', draw);
  bindPickGroup(gp, 'data-fd-pb', v => { pair = v; draw(); });
  bindPickGroup(ga, 'data-fd-ab', v => { vert = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：等腰三角形——頂角平分線、底邊中垂線、底邊上的高三線合一
   ========================================================================== */
function initIsoCanvas() {
  const cv = hbEl('canvas-iso');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sb = hbEl('iso-ab'), sc = hbEl('iso-ac'), sa = hbEl('iso-ang');
  const vb = hbEl('iso-vab'), vc = hbEl('iso-vac'), va = hbEl('iso-vang');
  const out = hbEl('iso-formula'), fb = hbEl('iso-feedback');
  const TONE = HB_TONE[6];

  function draw() {
    const W = cv.width;
    const ab = hbIv(sb), ac = hbIv(sc), ang = hbIv(sa);
    vb.textContent = ab; vc.textContent = ac; va.textContent = ang;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '∠A 的平分線、BC 的中垂線、BC 上的高', TONE);
    const A0 = hbV(0, 0);
    const [A, B, C] = hbFit([A0, hbAt(A0, 270 - ang / 2, ab), hbAt(A0, 270 + ang / 2, ac)],
      { x: 60, y: 66, w: 420, h: 320 });
    const U = hbDist(A, B) / ab;            // 畫布 px → 長度
    const D = cgLL(A, hbV(A.x + pvBisDir(A, B, C).x, A.y + pvBisDir(A, B, C).y), B, C);
    const M = hbV((B.x + C.x) / 2, (B.y + C.y) / 2);
    const H = pvFoot(A, B, C);
    const nrm = pvPerpDir(B, C);           // 朝 A 的反方向（BC 下方）
    const away = (nrm.x * (A.x - M.x) + nrm.y * (A.y - M.y)) > 0 ? hbV(-nrm.x, -nrm.y) : nrm;

    hbPoly(ctx, [A, B, C], INK, 0.05, 2.6);
    pvClip(ctx, 44, 420);
    pvLineDir(ctx, M, nrm, 360, HB_MOSS, 2, [7, 5]);
    ctx.restore();
    hbSeg(ctx, A, H, HB_SKY, 2.4, [2, 4]);
    hbSeg(ctx, A, D, HB_GOLD, 2.4);
    hbAngle(ctx, A, B, D, 30, HB_GOLD, { alpha: 0.24 });
    hbAngle(ctx, A, D, C, 36, HB_GOLD, { alpha: 0.24 });
    pvRight(ctx, H, C, A, HB_SKY, 9);
    pvRight(ctx, M, C, hbV(M.x - away.x, M.y - away.y), HB_MOSS, 9);
    pvTicks(ctx, B, M, 1, HB_MOSS);
    pvTicks(ctx, M, C, 1, HB_MOSS);
    if (ab === ac) {
      pvTicks(ctx, A, B, 2, HB_ROSE);
      pvTicks(ctx, A, C, 2, HB_ROSE);
    }
    pvTriLabels(ctx, A, B, C);
    // 三個點沿 BC 排序，標籤往外一層一層錯開，避免疊在一起
    const pts = [['D', D, HB_GOLD], ['M', M, HB_MOSS], ['H', H, HB_SKY]];
    const same = ab === ac;
    if (same) {
      hbDot(ctx, D, HB_IVORY, 5);
      pvLabel(ctx, D, 'D', away.x * 20, away.y * 20, HB_IVORY, 16);
    } else {
      pts.forEach(([s, Pp, col], i) => {
        hbDot(ctx, Pp, col, 4.5);
        pvLabel(ctx, Pp, s, away.x * (18 + 16 * i), away.y * (18 + 16 * i), col, 15);
      });
    }

    const bd = pvLen(hbDist(B, D) / U), dc = pvLen(hbDist(D, C) / U);
    const adb = hbAngleDeg(D, A, B);
    textCenter(ctx, `BD ${bd.rel} ${bd.s}，DC ${dc.rel} ${dc.s}，∠ADB ≈ ${pvDeg(adb)}°`, W / 2, 446, HB_GOLD, f(800, 16));
    textLeft(ctx, '金：∠A 的平分線（交 BC 於 D）', 24, 476, HB_GOLD, f(700, 13));
    textLeft(ctx, '綠虛線：BC 的中垂線（過中點 M）', 24, 498, HB_MOSS, f(700, 13));
    textLeft(ctx, '藍點線：BC 上的高（垂足 H）', 300, 476, HB_SKY, f(700, 13));
    textLeft(ctx, same ? '三條線合而為一！' : '三條線分開了', 300, 498, same ? HB_GOLD : HB_RED, f(800, 14));

    out.innerHTML = `\\(\\overline{BD} ${bd.tex} ${bd.s}\\)，<wbr>\\(\\overline{DC} ${dc.tex} ${dc.s}\\)，<wbr>\\(\\angle ADB \\approx ${pvDeg(adb)}^\\circ\\)`;
    fb.innerHTML = wrapFeedback(same
      ? `\\(\\overline{AB} = \\overline{AC}\\)：\\(\\triangle ABD \\cong \\triangle ACD\\)（SAS），所以 \\(\\overline{BD} = \\overline{CD}\\)、\\(\\angle ADB = \\angle ADC = 90^\\circ\\)，<br>也得到 <strong>\\(\\angle B = \\angle C\\)</strong>。頂角平分線就是底邊的中垂線，也是高。`
      : `\\(\\overline{AB} \\ne \\overline{AC}\\) 時，角平分線交 \\(\\overline{BC}\\) 的點 \\(D\\) <strong>不是</strong>中點，也不垂直。<br>「角平分線就平分對邊」只在等腰三角形的頂角才成立。`);
    typeset([out, fb]);
  }

  [sb, sc, sa].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：等腰三角形的底角——角度一路推下去
   ========================================================================== */
function initIsoAngCanvas() {
  const cv = hbEl('canvas-ia');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sb = hbEl('ia-b'), sc = hbEl('ia-c'), sk = hbEl('ia-k');
  const vb = hbEl('ia-vb'), vc = hbEl('ia-vc'), vk = hbEl('ia-vk');
  const rowB = hbEl('ia-row-b'), rowC = hbEl('ia-row-c'), rowK = hbEl('ia-row-k');
  const g = hbEl('ia-mode-group');
  const out = hbEl('ia-formula'), fb = hbEl('ia-feedback');
  const TONE = HB_TONE[7];
  let mode = 'two';

  function drawTwo() {
    const W = cv.width;
    const B = hbClampSlider(sb, 30, 100);
    const C = hbClampSlider(sc, 30, 150 - B);
    const A = 180 - B - C;
    vb.textContent = B; vc.textContent = C;
    drawTitle(ctx, 'BD = BE，CD = CF：兩個等腰三角形', TONE);
    const t = hbTriangle(A, B, { x: 50, y: 60, w: 440, h: 300 });
    const ab = hbDist(t.A, t.B), ac = hbDist(t.A, t.C);
    const k = ab / (ab + ac);
    const D = hbV(t.B.x + (t.C.x - t.B.x) * k, t.B.y + (t.C.y - t.B.y) * k);
    const bd = hbDist(t.B, D), cd = hbDist(t.C, D);
    const uBA = cgUnit(t.B, t.A), uCA = cgUnit(t.C, t.A);
    const E = hbV(t.B.x + uBA.x * bd, t.B.y + uBA.y * bd);
    const F = hbV(t.C.x + uCA.x * cd, t.C.y + uCA.y * cd);

    hbPoly(ctx, [t.A, t.B, t.C], INK, 0.05, 2.6);
    hbSeg(ctx, D, E, HB_ROSE, 2.4);
    hbSeg(ctx, D, F, HB_SKY, 2.4);
    pvTicks(ctx, t.B, E, 1, HB_ROSE);
    pvTicks(ctx, t.B, D, 1, HB_ROSE);
    pvTicks(ctx, t.C, F, 2, HB_SKY);
    pvTicks(ctx, t.C, D, 2, HB_SKY);
    hbAngle(ctx, t.B, t.A, t.C, 24, MUTED, { label: `${B}°`, lr: 40, lc: INK, font: f(800, 13.5) });
    hbAngle(ctx, t.C, t.A, t.B, 24, MUTED, { label: `${C}°`, lr: 40, lc: INK, font: f(800, 13.5) });
    const a1 = hbAngleDeg(D, t.B, E), a2 = hbAngleDeg(D, t.C, F), aE = hbAngleDeg(D, E, F);
    hbAngle(ctx, D, t.B, E, 26, HB_ROSE, { label: '1', lr: 40, font: f(800, 13) });
    hbAngle(ctx, D, F, t.C, 26, HB_SKY, { label: '2', lr: 40, font: f(800, 13) });
    hbAngle(ctx, D, E, F, 20, HB_GOLD, { alpha: 0.34 });
    pvTriLabels(ctx, t.A, t.B, t.C);
    pvLabel(ctx, D, 'D', 0, 18, HB_IVORY, 16);
    pvLabel(ctx, E, 'E', -14, -4, HB_IVORY, 16);
    pvLabel(ctx, F, 'F', 14, -4, HB_IVORY, 16);

    textCenter(ctx, `∠1 = (180° − ${B}°) 的一半 = ${pvDeg(a1)}°`, W / 2, 404, HB_ROSE, f(800, 15.5));
    textCenter(ctx, `∠2 = (180° − ${C}°) 的一半 = ${pvDeg(a2)}°`, W / 2, 432, HB_SKY, f(800, 15.5));
    textCenter(ctx, `∠EDF = 180° − ∠1 − ∠2 = ${pvDeg(aE)}°`, W / 2, 462, HB_GOLD, f(800, 16.5));
    textCenter(ctx, `剛好是 (∠B + ∠C) 的一半`, W / 2, 490, MUTED, f(700, 13.5));

    out.innerHTML = wbrEq(`\\angle EDF = 180^\\circ - ${hbDg((180 - B) / 2)} - ${hbDg((180 - C) / 2)} = ${hbDg(180 - (180 - B) / 2 - (180 - C) / 2)}`);
    fb.innerHTML = wrapFeedback(`\\(\\triangle BDE\\) 中 \\(\\overline{BD} = \\overline{BE}\\)，兩底角相等，各是 \\((180^\\circ - \\angle B)\\) 的一半；\\(\\triangle CDF\\) 也一樣。<br>先找出<strong>哪兩邊相等</strong>，就知道<strong>哪兩個角相等</strong>。`);
  }

  function drawChain() {
    const W = cv.width;
    const c = hbClampSlider(sk, 20, 40);
    vk.textContent = c;
    drawTitle(ctx, 'AB = AD = DC，D 在 BC 上', TONE);
    const D0 = hbV(0, 0), C0 = hbV(1, 0);
    const A0 = hbV(-Math.cos(2 * c * HB_RAD), Math.sin(2 * c * HB_RAD));
    const B0 = hbV(-2 * Math.cos(2 * c * HB_RAD), 0);
    const [A, B, C, D] = pvFitMath([A0, B0, C0, D0], { x: 50, y: 70, w: 440, h: 270 });
    hbPoly(ctx, [A, B, C], INK, 0.05, 2.6);
    hbSeg(ctx, A, D, INK, 2.4);
    pvTicks(ctx, A, B, 1, HB_GOLD);
    pvTicks(ctx, A, D, 1, HB_GOLD);
    pvTicks(ctx, D, C, 1, HB_GOLD);
    const mC = hbAngleDeg(C, A, B), mDAC = hbAngleDeg(A, D, C), mADB = hbAngleDeg(D, A, B);
    const mB = hbAngleDeg(B, A, C), mBAD = hbAngleDeg(A, B, D);
    hbAngle(ctx, C, A, D, 30, HB_SKY, { label: `${pvDeg(mC)}°`, lr: 48, font: f(800, 13) });
    hbAngle(ctx, A, D, C, 30, HB_SKY, { label: `${pvDeg(mDAC)}°`, lr: 48, font: f(800, 13) });
    hbAngle(ctx, D, A, B, 24, HB_ROSE, { label: `${pvDeg(mADB)}°`, lr: 42, font: f(800, 13) });
    hbAngle(ctx, B, A, D, 24, HB_ROSE, { label: `${pvDeg(mB)}°`, lr: 42, font: f(800, 13) });
    hbAngle(ctx, A, B, D, 20, HB_GOLD, { alpha: 0.34 });
    pvTriLabels(ctx, A, B, C);
    pvLabel(ctx, D, 'D', 0, 18, HB_IVORY, 16);

    textCenter(ctx, `① AD = DC ⇒ ∠DAC = ∠C = ${c}°`, W / 2, 392, HB_SKY, f(800, 15));
    textCenter(ctx, `② ∠ADB 是 △ADC 的外角 = ${c}° + ${c}° = ${2 * c}°`, W / 2, 420, HB_ROSE, f(800, 15));
    textCenter(ctx, `③ AB = AD ⇒ ∠B = ∠ADB = ${2 * c}°`, W / 2, 448, HB_ROSE, f(800, 15));
    textCenter(ctx, `④ ∠BAD = 180° − ${2 * c}° − ${2 * c}° = ${pvDeg(mBAD)}°`, W / 2, 476, HB_GOLD, f(800, 15.5));

    out.innerHTML = `\\(\\angle B = ${hbDg(2 * c)}\\)，<wbr>\\(\\angle BAD = ${hbDg(180 - 4 * c)}\\)`;
    fb.innerHTML = wrapFeedback(`等長的邊一路接下去，等角也一路傳下去：<br>每遇到一個<strong>等腰三角形</strong>就寫一次「兩底角相等」，再用<strong>外角定理</strong>接到下一個。`);
  }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    rowB.style.display = mode === 'two' ? '' : 'none';
    rowC.style.display = mode === 'two' ? '' : 'none';
    rowK.style.display = mode === 'chain' ? '' : 'none';
    if (mode === 'two') drawTwo(); else drawChain();
    typeset([out, fb]);
  }

  [sb, sc, sk].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-ia-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：中垂線造出等腰三角形——由等長得等角
   ========================================================================== */
function initPbIsoCanvas() {
  const cv = hbEl('canvas-pi');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sb = hbEl('pi-b'), sc = hbEl('pi-c'), vb = hbEl('pi-vb'), vc = hbEl('pi-vc');
  const out = hbEl('pi-formula'), fb = hbEl('pi-feedback');
  const TONE = HB_TONE[8];

  function draw() {
    const W = cv.width;
    const B = hbClampSlider(sb, 20, 60);
    const C = hbClampSlider(sc, B + 5, 170 - B);
    const A = 180 - B - C;
    vb.textContent = B; vc.textContent = C;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, 'BC 的中垂線交 AB 於 P，連 PC', TONE);
    const t = hbTriangle(A, B, { x: 50, y: 70, w: 440, h: 270 });
    const M = hbV((t.B.x + t.C.x) / 2, t.B.y);
    const P = cgLL(M, hbV(M.x, M.y - 10), t.B, t.A);

    hbPoly(ctx, [t.A, t.B, t.C], INK, 0.05, 2.6);
    hbSeg(ctx, hbV(M.x, M.y + 18), hbV(M.x, Math.min(P.y, t.A.y) - 24), HB_SKY, 2.2);
    pvLabel(ctx, hbV(M.x, Math.min(P.y, t.A.y) - 24), 'L', 12, 2, HB_SKY, 16);
    hbSeg(ctx, P, t.C, HB_ROSE, 2.4);
    pvRight(ctx, M, t.C, P, HB_SKY, 9);
    pvTicks(ctx, t.B, M, 1, HB_SKY);
    pvTicks(ctx, M, t.C, 1, HB_SKY);
    pvTicks(ctx, P, t.B, 2, HB_ROSE);
    pvTicks(ctx, P, t.C, 2, HB_ROSE);
    const mPBC = hbAngleDeg(t.B, P, t.C), mPCB = hbAngleDeg(t.C, P, t.B);
    const mACP = hbAngleDeg(t.C, t.A, P), mAPC = hbAngleDeg(P, t.A, t.C);
    hbAngle(ctx, t.B, P, t.C, 30, HB_SKY, { label: `${pvDeg(mPBC)}°`, lr: 48, font: f(800, 13.5) });
    hbAngle(ctx, t.C, P, t.B, 30, HB_SKY, { label: `${pvDeg(mPCB)}°`, lr: 48, font: f(800, 13.5) });
    hbAngle(ctx, t.C, t.A, P, 44, HB_MOSS, { label: `${pvDeg(mACP)}°`, lr: 62, font: f(800, 13.5) });
    hbAngle(ctx, P, t.A, t.C, 20, HB_GOLD, { alpha: 0.34 });
    pvTriLabels(ctx, t.A, t.B, t.C);
    pvLabel(ctx, M, 'M', 0, 18, HB_IVORY, 15);
    pvLabel(ctx, P, 'P', -16, -6, HB_ROSE, 17);

    textCenter(ctx, `① P 在 BC 的中垂線上 ⇒ PB = PC ⇒ ∠PCB = ∠B = ${pvDeg(mPCB)}°`, W / 2, 390, HB_SKY, f(800, 14.5));
    textCenter(ctx, `② ∠ACP = ∠ACB − ∠PCB = ${C}° − ${B}° = ${pvDeg(mACP)}°`, W / 2, 420, HB_MOSS, f(800, 14.5));
    textCenter(ctx, `③ ∠APC 是 △PBC 的外角 = ${B}° + ${B}° = ${pvDeg(mAPC)}°`, W / 2, 450, HB_GOLD, f(800, 14.5));
    textCenter(ctx, `∠C 要比 ∠B 大，中垂線才會交在 AB 上`, W / 2, 480, MUTED, f(700, 13));

    out.innerHTML = `\\(\\angle PCB = ${hbDg(B)}\\)，<wbr>\\(\\angle ACP = ${hbDg(C - B)}\\)，<wbr>\\(\\angle APC = ${hbDg(2 * B)}\\)`;
    fb.innerHTML = wrapFeedback(`中垂線上的點連到兩端點，一定得到<strong>等腰三角形</strong>（\\(\\overline{PB} = \\overline{PC}\\)），<br>於是有兩個角相等。看到中垂線，先把「等腰 → 等角」寫下來。`);
    typeset([out, fb]);
  }

  [sb, sc].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：等腰三角形的判別性質——兩角相等 ⇒ 對邊相等
   ========================================================================== */
function initIsoJudgeCanvas() {
  const cv = hbEl('canvas-ij');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('ij-a'), sb = hbEl('ij-b'), va = hbEl('ij-va'), vb = hbEl('ij-vb');
  const out = hbEl('ij-formula'), fb = hbEl('ij-feedback');
  const TONE = HB_TONE[9];

  function draw() {
    const W = cv.width;
    const A = hbClampSlider(sa, 20, 140);
    const B = hbClampSlider(sb, 20, 160 - A);
    const C = 180 - A - B;
    va.textContent = A; vb.textContent = B;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '看角找邊：相等的角，對邊也相等', TONE);
    const t = hbTriangle(A, B, { x: 60, y: 64, w: 420, h: 280 });
    const sides = { a: [t.B, t.C], b: [t.C, t.A], c: [t.A, t.B] };   // a 對 ∠A……
    const maxS = Math.max(hbDist(t.B, t.C), hbDist(t.C, t.A), hbDist(t.A, t.B));
    const len = s => hbDist(sides[s][0], sides[s][1]) / maxS * 10;
    const ang = { A, B, C };
    const pairs = [['A', 'B'], ['A', 'C'], ['B', 'C']].filter(([x, y]) => ang[x] === ang[y]);
    const hot = new Set();
    pairs.forEach(([x, y]) => { hot.add(x); hot.add(y); });

    hbPoly(ctx, [t.A, t.B, t.C], INK, 0.05, 2.6);
    ['A', 'B', 'C'].forEach(v => {
      const s = v.toLowerCase();
      if (hot.has(v)) {
        hbSeg(ctx, sides[s][0], sides[s][1], HB_GOLD, 4);
        pvTicks(ctx, sides[s][0], sides[s][1], 1, HB_GOLD);
      }
    });
    const V = { A: t.A, B: t.B, C: t.C };
    const nb = { A: [t.B, t.C], B: [t.A, t.C], C: [t.A, t.B] };
    ['A', 'B', 'C'].forEach(v => {
      const col = hot.has(v) ? HB_GOLD : MUTED;
      hbAngle(ctx, V[v], nb[v][0], nb[v][1], 26, col, { label: `${ang[v]}°`, lr: 44, lc: hot.has(v) ? HB_GOLD : INK, font: f(800, 13.5) });
    });
    pvTriLabels(ctx, t.A, t.B, t.C);

    const la = pvLen(len('a')), lb = pvLen(len('b')), lc = pvLen(len('c'));
    textCenter(ctx, `BC ${la.rel} ${la.s}，CA ${lb.rel} ${lb.s}，AB ${lc.rel} ${lc.s}（最長邊當 10）`, W / 2, 404, INK, f(800, 14.5));
    const opp = { A: 'BC', B: 'CA', C: 'AB' };
    let msg;
    if (pairs.length === 3) msg = '三個角都是 60°：三邊都相等（正三角形）';
    else if (pairs.length === 1) {
      const [x, y] = pairs[0];
      msg = `∠${x} = ∠${y} ⇒ 對邊 ${opp[x]} = ${opp[y]}`;
    } else msg = '三個角都不相等：沒有兩邊相等';
    textCenter(ctx, msg, W / 2, 438, pairs.length ? HB_GOLD : HB_RED, f(800, 17));
    textCenter(ctx, '∠A 的對邊是 BC，∠B 的對邊是 CA，∠C 的對邊是 AB', W / 2, 470, MUTED, f(700, 13.5));

    out.innerHTML = wbrEq(`\\angle C = 180^\\circ - ${hbDg(A)} - ${hbDg(B)} = ${hbDg(C)}`);
    if (pairs.length === 1) {
      const [x, y] = pairs[0];
      fb.innerHTML = wrapFeedback(`\\(\\angle ${x} = \\angle ${y}\\)，所以 \\(\\triangle ABC\\) 是等腰三角形，相等的兩邊是這兩個角的<strong>對邊</strong>：\\(\\overline{${opp[x]}} = \\overline{${opp[y]}}\\)。<br>不要找成「夾著這兩個角的那條邊」。`);
    } else if (pairs.length === 3) {
      fb.innerHTML = wrapFeedback(`三個角都相等，任兩邊都相等：<strong>正三角形</strong>。`);
    } else {
      fb.innerHTML = wrapFeedback(`三個角兩兩不等，就找不到相等的兩邊。<br>試著把某兩個角調成一樣，看哪兩條邊一起變成金色。`);
    }
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 11：判別性質的應用——由等角推出等腰，再把等長搬過去
   ========================================================================== */
function initIsoUseCanvas() {
  const cv = hbEl('canvas-iu');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('iu-a'), sbc = hbEl('iu-bc'), va = hbEl('iu-va'), vbc = hbEl('iu-vbc');
  const prev = hbEl('iu-prev'), next = hbEl('iu-next'), stepEl = hbEl('iu-step');
  const out = hbEl('iu-formula'), fb = hbEl('iu-feedback');
  const TONE = HB_TONE[10];
  const N = 4;
  let step = 1;

  function draw() {
    const W = cv.width;
    const a = hbIv(sa), bc = hbIv(sbc);
    va.textContent = a; vbc.textContent = bc;
    stepEl.textContent = `${step} / ${N}`;
    prev.disabled = step <= 1;
    next.disabled = step >= N;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '已知 ∠A = ∠ACD、∠B = ∠BDC，求 BD', TONE);

    const abLen = bc * Math.sin(3 * a * HB_RAD) / Math.sin(a * HB_RAD);
    const A0 = hbV(0, 0), B0 = hbV(abLen, 0);
    const C0 = hbV(abLen + bc * Math.cos((180 - 2 * a) * HB_RAD), bc * Math.sin((180 - 2 * a) * HB_RAD));
    const D0 = hbV(bc, 0);
    const [A, B, C, D] = pvFitMath([A0, B0, C0, D0], { x: 40, y: 80, w: 460, h: 230 });
    const k = abLen / hbDist(A, B);          // 畫布 px → 長度
    hbPoly(ctx, [A, B, C], INK, 0.05, 2.6);
    hbSeg(ctx, C, D, INK, 2.4);
    hbAngle(ctx, A, B, C, 34, HB_ROSE, { alpha: 0.3, label: '1', lr: 50, font: f(800, 13) });
    hbAngle(ctx, C, A, D, 34, HB_ROSE, { alpha: 0.3, label: '1', lr: 50, font: f(800, 13) });
    hbAngle(ctx, B, A, C, 24, HB_SKY, { alpha: 0.3, label: '2', lr: 40, font: f(800, 13) });
    hbAngle(ctx, D, B, C, 24, HB_SKY, { alpha: 0.3, label: '2', lr: 40, font: f(800, 13) });
    if (step >= 1) { pvTicks(ctx, C, D, 1, HB_GOLD); pvTicks(ctx, C, B, 1, HB_GOLD); }
    if (step >= 2) pvTicks(ctx, A, D, 1, HB_GOLD);
    if (step >= 3) {
      hbSeg(ctx, D, B, HB_MOSS, 4.5);
    }
    pvTriLabels(ctx, A, B, C);
    pvLabel(ctx, D, 'D', 0, 18, HB_IVORY, 16);

    const AD = hbDist(A, D) * k, CD = hbDist(C, D) * k, CB = hbDist(C, B) * k, BD = hbDist(B, D) * k;
    const mACD = hbAngleDeg(C, A, D), mBDC = hbAngleDeg(D, B, C), mB = hbAngleDeg(B, A, C);
    const rows = [
      `① △BCD 中 ∠B = ∠BDC ⇒ 對邊 CD = CB = ${bc}`,
      `② △ACD 中 ∠A = ∠ACD ⇒ 對邊 AD = CD = ${bc}`,
      `③ BD = AB − AD ≈ ${abLen.toFixed(2)} − ${bc} = ${BD.toFixed(2)}`,
      `④ ∠BDC 是 △ACD 的外角 = ∠A + ∠ACD，所以 ∠B = 2∠A = ${pvDeg(mB)}°`
    ];
    rows.forEach((s, i) => {
      if (i < step) textCenter(ctx, s, W / 2, 360 + i * 30, i === step - 1 ? HB_GOLD : INK, f(800, 14.5));
    });
    textCenter(ctx, `量一量：AD ≈ ${AD.toFixed(2)}，CD ≈ ${CD.toFixed(2)}，CB ≈ ${CB.toFixed(2)}，∠ACD ≈ ${pvDeg(mACD)}°，∠BDC ≈ ${pvDeg(mBDC)}°`,
      W / 2, 486, MUTED, f(700, 12));

    out.innerHTML = `\\(\\overline{AD} = \\overline{CD} = \\overline{CB} = ${bc}\\)，<wbr>\\(\\overline{BD} \\approx ${BD.toFixed(2)}\\)`;
    const fbs = [
      `看 \\(\\triangle BCD\\)：兩個角 \\(\\angle B = \\angle BDC\\) 相等，它們的<strong>對邊</strong> \\(\\overline{CD}\\)、\\(\\overline{CB}\\) 相等。`,
      `再看 \\(\\triangle ACD\\)：\\(\\angle A = \\angle ACD\\)，對邊 \\(\\overline{AD} = \\overline{CD}\\)。<br>兩次判別性質，把 \\(\\overline{CB}\\) 的長一路搬到 \\(\\overline{AD}\\)。`,
      `\\(\\overline{AD}\\) 知道了，\\(\\overline{BD}\\) 就是 \\(\\overline{AB} - \\overline{AD}\\)。<br>課本題給的是 \\(\\overline{AB}\\) 的長，所以答案是整數；這裡 \\(\\overline{AB}\\) 隨角度變化。`,
      `兩個條件同時成立時，\\(\\angle B\\) 一定是 \\(\\angle A\\) 的 \\(2\\) 倍——外角定理把它們綁在一起。<br>拉動 \\(\\angle A\\) 的滑桿，量一量各段長度，\\(\\overline{AD} = \\overline{CD} = \\overline{CB}\\) 永遠成立。`
    ];
    fb.innerHTML = wrapFeedback(fbs[step - 1]);
    typeset([out, fb]);
  }

  [sa, sbc].forEach(s => s.addEventListener('input', draw));
  prev.addEventListener('click', () => { if (step > 1) { step--; draw(); } });
  next.addEventListener('click', () => { if (step < N) { step++; draw(); } });
  drawWithFonts(draw);
}
