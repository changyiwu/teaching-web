/* ==========================================================================
   5-1-4（第五冊 1-4）相似三角形的應用 — 互動 Canvas 與隨堂評量
   畫風：昭和復古照相館・暗房（小影、阿光），第五冊第 1 章四節共用。

   共用工具在 ../math-canvas.js（f／fi／drawTitle／wrapFeedback／wbrEq／typeset／
   bindPickGroup／drawWithFonts、q* 有理數、hb* 幾何、cgLabel、dk* 相似形工具：
   dkView／dkView2 取景、dkRich 混排字、dkTag／dkSideTag／dkName／dkPt／dkAng…）。

   本檔分三層：
     0. 本節色票（DK_ 前綴，與 5-1-1～5-1-3 同名同值；AP_ 是本節新增的）；
     1. 本節工具（ap 前綴）：有理數與根式的顯示、根式 c√r 的乘除、
        人／樹／燈柱／太陽等小圖示；
     2. 13 個互動與評量附圖。

   幾何一律先在「數學座標」（單位長、y 朝上）算好，再由 dkView 等比例
   放進畫布；所有長度、角度都由座標或有理數實算（開發約束 27）。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();
  drawWithFonts(initQuizFigs);

  initShadowCanvas();
  initRiverXCanvas();
  initRiverSumCanvas();
  initHeightCanvas();
  initAreaCanvas();
  initMatchCanvas();
  initMidCanvas();
  initSlopeCanvas();
  initTrigCanvas();
  initRoadCanvas();
  initSpecialCanvas();
  initLifeCanvas();
  initMountCanvas();
});

/* ==========================================================================
   0. 本節色票（暗房：棕褐相紙、安全燈紅、顯影藍、圍裙綠、芥末黃）
   ========================================================================== */

const DK_SEPIA = '#d9b38c';
const DK_RED = '#e05a47';       // 安全燈紅（填色與粗線）
const DK_ROSE = '#f4917f';      // 安全燈紅的亮版，深色底上的字用它
const DK_BLUE = '#5aa9e6';
const DK_GREEN = '#5fbf8f';
const DK_MUSTARD = '#e6b84c';
const DK_IVORY = '#f3ead8';
const DK_OK = '#86efac';
const DK_NO = '#fb7185';
const DK_FAINT = 'rgba(243, 234, 216, 0.3)';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const DK_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9', '#fca5a5', '#f0abfc'];

// 本節新增：河水藍、樹幹棕、天空的光線
const AP_RIVER = 'rgba(90, 169, 230, 0.16)';
const AP_TRUNK = '#a8683a';
const AP_RAY = 'rgba(230, 184, 76, 0.75)';

// 共用 dk* 工具的標籤底色與點外圈（math-canvas.js）
dkUsePalette({ tagBg: 'rgba(28, 22, 17, 0.88)', rim: 'rgba(20, 14, 10, 0.9)' });

/* ==========================================================================
   1. 本節工具（ap 前綴）
   ========================================================================== */

// 有理數 q = [n, d] 是不是有限小數（分母只有 2、5 的因數）
function apIsDec(q) {
  let d = q[1];
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  return d === 1;
}

// 有限小數的精確字串（不經過浮點數）
function apDecStr(q) {
  const neg = q[0] < 0;
  const n = Math.abs(q[0]), d = q[1];
  let s = String(Math.floor(n / d));
  let r = n % d;
  if (r) {
    s += '.';
    for (let i = 0; r && i < 12; i++) { r *= 10; s += Math.floor(r / d); r %= d; }
  }
  return (neg ? '-' : '') + s;
}

// 有理數 → dkRich 字串（有限小數照寫，其餘寫成直式分數）
function apR(q) {
  return apIsDec(q) ? apDecStr(q) : `{${q[0]}/${q[1]}}`;
}

// 有理數 → LaTeX
function apT(q) {
  return apIsDec(q) ? apDecStr(q) : `\\frac{${q[0]}}{${q[1]}}`;
}

// 小數第 k 位四捨五入的字串（保留尾巴的 0）
function apFix(v, k) {
  return (Math.round(v * Math.pow(10, k)) / Math.pow(10, k)).toFixed(k);
}

// 有理數若是有限小數就直接寫，否則補「≒ 兩位小數」
function apRApprox(q) {
  return apIsDec(q) ? apDecStr(q) : `${apR(q)} ≒ ${apFix(qVal(q), 2)}`;
}
function apTApprox(q) {
  return apIsDec(q) ? apDecStr(q) : `${apT(q)} \\fallingdotseq ${apFix(qVal(q), 2)}`;
}

// 化成最簡整數比 a : b（a、b 為有理數）
function apRatio(a, b) {
  const r = qDiv(a, b);
  return [r[0], r[1]];
}

/* --------------------------------------------------------------------------
   單項根式 c√r：c 是有理數 [n, d]，r 是沒有平方因數的正整數
   -------------------------------------------------------------------------- */
function apS(c, r) {
  const h = hbRoot(r);
  return { c: qMul(c, [h.k, 1]), r: h.r };
}
function apSMul(a, b) { return apS(qMul(a.c, b.c), a.r * b.r); }
// a ÷ b：乘上 √r / r 把分母的根號去掉
function apSDiv(a, b) { return apS(qDiv(a.c, qMul(b.c, [b.r, 1])), a.r * b.r); }
function apSVal(a) { return qVal(a.c) * Math.sqrt(a.r); }

// LaTeX：7√3/2 寫成 \frac{7\sqrt{3}}{2}
function apSTex(a) {
  const n = a.c[0], d = a.c[1];
  if (a.r === 1) return apT(a.c);
  const top = (n === 1 ? '' : String(n)) + `\\sqrt{${a.r}}`;
  return d === 1 ? top : `\\frac{${top}}{${d}}`;
}
// dkRich 字串
function apSTxt(a) {
  const n = a.c[0], d = a.c[1];
  if (a.r === 1) return apR(a.c);
  const top = (n === 1 ? '' : String(n)) + `√${a.r}`;
  return d === 1 ? top : `{${top}/${d}}`;
}

/* --------------------------------------------------------------------------
   p + q√3（p、q 為有理數）：兩次仰角求高用
   -------------------------------------------------------------------------- */
function apR3(p, q) { return { p, q }; }
function apR3Val(a) { return qVal(a.p) + qVal(a.q) * Math.sqrt(3); }
// d ÷ (a + b√3) = d(a − b√3) / (a² − 3b²)
function apR3Inv(d, den) {
  const norm = qSub(qMul(den.p, den.p), qMul([3, 1], qMul(den.q, den.q)));
  return apR3(qDiv(qMul(d, den.p), norm), qDiv(qMul(d, qMul(den.q, [-1, 1])), norm));
}
// 寫成 k(m + √3)／k(√3 − m) 這種課本的寫法太難通用，這裡照「a + b√3」寫，
// 係數一律最簡；a 或 b 為 0 時省略那一項
function apR3Tex(a) {
  const parts = [];
  if (a.p[0] !== 0) parts.push(apT(a.p));
  if (a.q[0] !== 0) {
    const s = apSTex({ c: [Math.abs(a.q[0]), a.q[1]], r: 3 });
    parts.push((a.q[0] < 0 ? '- ' : (parts.length ? '+ ' : '')) + s);
  }
  return parts.join(' ') || '0';
}
function apR3Txt(a) {
  const parts = [];
  if (a.p[0] !== 0) parts.push(apR(a.p));
  if (a.q[0] !== 0) {
    const s = apSTxt({ c: [Math.abs(a.q[0]), a.q[1]], r: 3 });
    parts.push((a.q[0] < 0 ? '− ' : (parts.length ? '+ ' : '')) + s);
  }
  return parts.join(' ') || '0';
}

/* --------------------------------------------------------------------------
   小圖示（畫布座標）
   -------------------------------------------------------------------------- */

// 地面：一條粗線，下方淡淡的斜紋
function apGround(ctx, x1, x2, y) {
  ctx.save();
  ctx.strokeStyle = 'rgba(217, 179, 140, 0.35)';
  ctx.lineWidth = 1.2;
  for (let x = x1 + 6; x < x2; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.lineTo(x - 7, y + 10);
    ctx.stroke();
  }
  ctx.restore();
  hbSeg(ctx, hbV(x1, y), hbV(x2, y), DK_SEPIA, 2.6);
}

// 站著的人：腳在 foot、頭頂在 top（兩點同一條鉛垂線）
function apPerson(ctx, foot, top, color) {
  const len = foot.y - top.y;
  const r = Math.max(3, Math.min(9, len * 0.12));
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2.5, Math.min(5, len * 0.07));
  const neck = top.y + 2 * r;
  const hip = foot.y - len * 0.45;
  ctx.beginPath();
  ctx.moveTo(foot.x, neck);
  ctx.lineTo(foot.x, hip);
  ctx.moveTo(foot.x - len * 0.12, foot.y);
  ctx.lineTo(foot.x, hip);
  ctx.lineTo(foot.x + len * 0.12, foot.y);
  ctx.moveTo(foot.x - len * 0.16, neck + len * 0.2);
  ctx.lineTo(foot.x, neck + len * 0.08);
  ctx.lineTo(foot.x + len * 0.16, neck + len * 0.2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(foot.x, top.y + r, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 一棵樹：樹幹在 foot、樹冠頂在 top
function apTree(ctx, foot, top) {
  const len = foot.y - top.y;
  const r = Math.max(6, Math.min(34, len * 0.28));
  hbSeg(ctx, foot, hbV(foot.x, top.y + r), AP_TRUNK, Math.max(3, Math.min(8, len * 0.05)));
  ctx.save();
  ctx.fillStyle = 'rgba(95, 191, 143, 0.55)';
  ctx.strokeStyle = DK_GREEN;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(foot.x, top.y + r, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// 太陽：畫在畫布角落（太陽很遠，不是幾何上的一點）
function apSun(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = DK_MUSTARD;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * 17, y + Math.sin(a) * 17);
    ctx.lineTo(x + Math.cos(a) * 25, y + Math.sin(a) * 25);
    ctx.stroke();
  }
  ctx.fillStyle = DK_MUSTARD;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 光線：從 P 經過 Q 一路畫到 R（虛線，芥末黃）
function apRay(ctx, P, R) {
  hbSeg(ctx, P, R, AP_RAY, 2, [8, 6]);
}

// 填色三角形
function apTri(ctx, pts, color, alpha) {
  dkPoly(ctx, pts, color, alpha == null ? 0.16 : alpha, 2.4);
}

// 公尺的字（有理數）
function apM(q) {
  return apR(q);
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第五冊 1-4 的 26 題正解
  // 正解字母分布：A 7 題、B 6 題、C 7 題、D 6 題（開發約束 36）
  const answers = {
    '1-4-1': 'B',    // 1.44 : x = 1.2 : 7.5，x = 9
    '1-4-2': 'D',    // 1.5 : x = 2.5 : (4 + 2.5)，x = 3.9
    '1-4-3': 'A',    // AB : 1.6 = 45 : 6，AB = 12
    '1-4-4': 'C',    // 9 : 1.2 = 30 : CD，CD = 4
    '1-4-5': 'C',    // 14 : 12 = (2 + x) : x，x = 12
    '1-4-6': 'A',    // 15 : 12 = x : (27 − x)，x = 15
    '1-4-7': 'D',    // DE : 21 = 4 : 7，DE = 12
    '1-4-8': 'B',    // DQ : 4 = 9 : 6，DQ = 6
    '1-4-9': 'A',    // 72 : y = 36 : 25，y = 50
    '1-4-10': 'C',   // AP : AB = 1 : √2 ≒ 0.71，在 E、F 之間
    '1-4-11': 'B',   // AE : DE = 6 : 12，面積比 1 : 4
    '1-4-12': 'D',   // BD : BC = 4 : 20，面積比 1 : 25
    '1-4-13': 'A',   // 周長 2 × 40 = 80，面積 4 × 60 = 240
    '1-4-14': 'C',   // 48 + 24 + 12 = 84
    '1-4-15': 'B',   // 36 × 15 = 540
    '1-4-16': 'D',   // EF ≒ 0.57 × 20 = 11.4
    '1-4-17': 'C',   // sin B = AC / AB = 21/29
    '1-4-18': 'A',   // tan B = AC / AB
    '1-4-19': 'B',   // 800 × 0.4067 = 325.36 ≒ 325
    '1-4-20': 'D',   // 30 × 1.2799 = 38.397 ≒ 38.4
    '1-4-21': 'A',   // AC = 7√3，AB = 14√3
    '1-4-22': 'C',   // AC = 9√2
    '1-4-23': 'D',   // 24 × 2/√3 = 16√3 ≒ 27.71
    '1-4-24': 'B',   // 13 ÷ 2 = 6.5
    '1-4-25': 'A',   // x(√3 − 1) = 400，x = 200(√3 + 1)
    '1-4-26': 'C'    // x(√3 + 1) = 800，x = 400(√3 − 1)
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
const AP_QUIZ_FIGS = {
  // Q5：A 字型量河寬。∠B = ∠CDE = 90°，AB = 14、CD = 12、BD = 2，求 DE
  q5(ctx, W, H) {
    const B0 = hbV(0, 0), D0 = hbV(2, 0), E0 = hbV(14, 0), A0 = hbV(0, 14), C0m = hbV(2, 12);
    const V = dkView([hbV(-0.5, 0), A0, E0, hbV(14.5, 0)], { x: 26, y: 24, w: 268, h: 150 });
    const A = V.P(A0), B = V.P(B0), C = V.P(C0m), D = V.P(D0), E = V.P(E0);
    ctx.save();
    ctx.fillStyle = AP_RIVER;
    ctx.fillRect(D.x, A.y - 6, E.x - D.x, B.y - A.y + 6);
    ctx.restore();
    hbSeg(ctx, B, E, DK_IVORY, 2.2);
    hbSeg(ctx, A, B, DK_IVORY, 2.2);
    hbSeg(ctx, C, D, DK_IVORY, 2.2);
    hbSeg(ctx, A, E, DK_SEPIA, 2.2);
    dkAng(ctx, B, A, E, 10, DK_GREEN);
    dkAng(ctx, D, C, E, 10, DK_GREEN);
    [A, B, C, D, E].forEach(p => dkPt(ctx, p, DK_IVORY, 3.2));
    dkName(ctx, A, 'A', DK_IVORY, -13, -2);
    dkName(ctx, B, 'B', DK_IVORY, -14, 10);
    dkName(ctx, C, 'C', DK_IVORY, 13, -8);
    dkName(ctx, D, 'D', DK_IVORY, 12, 13);
    dkName(ctx, E, 'E', DK_IVORY, 10, 13);
    dkTag(ctx, '14', A.x - 18, (A.y + B.y) / 2, DK_SEPIA, 13);
    dkTag(ctx, '12', C.x + 16, (C.y + D.y) / 2 + 6, DK_SEPIA, 13);
    dkTag(ctx, '2', (B.x + D.x) / 2, B.y + 26, DK_SEPIA, 13);
    textCenter(ctx, '河', (D.x + E.x) / 2, B.y + 26, 'rgba(125, 211, 252, 0.8)', f(800, 14));
  },

  // Q6：X 字型找寶藏。∠B = ∠D = 90°，AB = 15、DE = 12、BD = 27，A、C、E 共線
  q6(ctx, W, H) {
    const B0 = hbV(0, 0), A0 = hbV(0, 15), D0 = hbV(27, 0), E0 = hbV(27, -12), C0m = hbV(15, 0);
    const V = dkView([A0, B0, D0, E0], { x: 50, y: 22, w: 220, h: 170 });
    const A = V.P(A0), B = V.P(B0), C = V.P(C0m), D = V.P(D0), E = V.P(E0);
    hbSeg(ctx, B, D, DK_IVORY, 2.2);
    hbSeg(ctx, A, B, DK_IVORY, 2.2);
    hbSeg(ctx, D, E, DK_IVORY, 2.2);
    hbSeg(ctx, A, E, DK_SEPIA, 2.2);
    dkAng(ctx, B, A, D, 10, DK_GREEN);
    dkAng(ctx, D, B, E, 10, DK_GREEN);
    [A, B, C, D, E].forEach(p => dkPt(ctx, p, DK_IVORY, 3.2));
    dkName(ctx, A, 'A', DK_IVORY, -13, -2);
    dkName(ctx, B, 'B', DK_IVORY, -13, 6);
    dkName(ctx, C, 'C', DK_IVORY, -2, -14);
    dkName(ctx, D, 'D', DK_IVORY, 13, -6);
    dkName(ctx, E, 'E', DK_IVORY, 13, 4);
    dkTag(ctx, '15', A.x - 20, (A.y + B.y) / 2, DK_SEPIA, 13);
    dkTag(ctx, '12', D.x + 20, (D.y + E.y) / 2, DK_SEPIA, 13);
    dkTag(ctx, '[BD] = 27', (B.x + D.x) / 2 - 20, E.y + 6, DK_SEPIA, 13);
  },

  // Q10：D、E、F 把 AB 四等分（由 A 往 B），BC 在下方
  q10(ctx, W, H) {
    const T = dkTriAngles(10, 70, 48);
    const V = dkView([T.A, T.B, T.C], { x: 70, y: 22, w: 190, h: 172 });
    const A = V.P(T.A), B = V.P(T.B), C = V.P(T.C);
    dkPoly(ctx, [A, B, C], DK_IVORY, 0.06, 2.2);
    const at = t => hbV(A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t);
    const pts = [at(0.25), at(0.5), at(0.75)];
    [A, ...pts, B].forEach((p, i, arr) => { if (i) hbTick(ctx, arr[i - 1], p, 1, DK_SEPIA); });
    pts.forEach(p => dkPt(ctx, p, DK_IVORY, 3.2));
    dkNames(ctx, [A, B, C], ['A', 'B', 'C'], DK_IVORY);
    ['D', 'E', 'F'].forEach((nm, i) => dkName(ctx, pts[i], nm, DK_IVORY, -15, -2));
  },

  // Q11：平行四邊形 ABCD，E 在 AD 上，BE 的延長線交 CD 的延長線於 F；BC = 18、DE = 12
  q11(ctx, W, H) {
    const B0 = hbV(0, 0), C0m = hbV(18, 0), D0 = hbV(21, 6), A0 = hbV(3, 6);
    const E0 = hbV(9, 6), F0 = hbV(27, 18);
    const V = dkView([B0, C0m, D0, A0, F0], { x: 40, y: 22, w: 240, h: 176 });
    const A = V.P(A0), B = V.P(B0), C = V.P(C0m), D = V.P(D0), E = V.P(E0), F = V.P(F0);
    dkPoly(ctx, [A, B, C, D], DK_IVORY, 0.06, 2.2);
    hbSeg(ctx, B, F, DK_SEPIA, 2.2);
    hbSeg(ctx, D, F, DK_SEPIA, 2.2, [5, 4]);
    [E, F].forEach(p => dkPt(ctx, p, DK_IVORY, 3.2));
    dkName(ctx, A, 'A', DK_IVORY, -6, -14);
    dkName(ctx, B, 'B', DK_IVORY, -13, 6);
    dkName(ctx, C, 'C', DK_IVORY, 6, 14);
    dkName(ctx, D, 'D', DK_IVORY, 14, 4);
    dkName(ctx, E, 'E', DK_IVORY, -4, -14);
    dkName(ctx, F, 'F', DK_IVORY, 12, -4);
    dkTag(ctx, '18', (B.x + C.x) / 2, B.y + 16, DK_SEPIA, 13);
    dkTag(ctx, '12', (E.x + D.x) / 2, E.y + 15, DK_SEPIA, 13);
  },

  // Q12：∠A = 90°，AB = 16、AC = 12，D 在 AB 上、BD = 4，DE ⊥ BC 於 E
  q12(ctx, W, H) {
    const A0 = hbV(0, 0), B0 = hbV(16, 0), C0m = hbV(0, 12), D0 = hbV(12, 0);
    const E0 = dkAdd(B0, hbV(-16 / 20, 12 / 20), 4 * 16 / 20);
    const V = dkView([A0, B0, C0m], { x: 50, y: 20, w: 220, h: 166 });
    const A = V.P(A0), B = V.P(B0), C = V.P(C0m), D = V.P(D0), E = V.P(E0);
    dkPoly(ctx, [A, B, C], DK_IVORY, 0.06, 2.2);
    hbSeg(ctx, D, E, DK_SEPIA, 2.2);
    dkAng(ctx, A, B, C, 11, DK_GREEN);
    dkAng(ctx, E, D, B, 9, DK_GREEN);
    [D, E].forEach(p => dkPt(ctx, p, DK_IVORY, 3.2));
    dkName(ctx, A, 'A', DK_IVORY, -12, 10);
    dkName(ctx, B, 'B', DK_IVORY, 12, 10);
    dkName(ctx, C, 'C', DK_IVORY, -12, -4);
    dkName(ctx, D, 'D', DK_IVORY, -2, 15);
    dkName(ctx, E, 'E', DK_IVORY, 8, -12);
    dkTag(ctx, '12', A.x - 18, (A.y + C.y) / 2, DK_SEPIA, 13);
    dkTag(ctx, '16', (A.x + D.x) / 2, A.y + 30, DK_SEPIA, 13);
    dkTag(ctx, '4', (D.x + B.x) / 2, A.y + 14, DK_SEPIA, 13);
  },

  // Q25：同一側。A 測山頂 D 的仰角 30°、往山走 400 公尺到 B，仰角 45°
  q25(ctx, W, H) {
    const x = 200 * (Math.sqrt(3) + 1);
    const C0m = hbV(0, 0), D0 = hbV(0, x), A0 = hbV(-x * Math.sqrt(3), 0), B0 = hbV(-x, 0);
    apMountFig(ctx, A0, B0, C0m, D0, '30°', '45°', '400', true);
  },

  // Q26：兩側。A 測得 30°、B 在山的另一側測得 45°，AB = 800 公尺
  q26(ctx, W, H) {
    const x = 400 * (Math.sqrt(3) - 1);
    const C0m = hbV(0, 0), D0 = hbV(0, x), A0 = hbV(-x * Math.sqrt(3), 0), B0 = hbV(x, 0);
    apMountFig(ctx, A0, B0, C0m, D0, '30°', '45°', '800', false);
  }
};

function apMountFig(ctx, A0, B0, C0m, D0, la, lb, ab, same) {
  const V = dkView([A0, B0, C0m, D0], { x: 30, y: 24, w: 260, h: 150 });
  const A = V.P(A0), B = V.P(B0), C = V.P(C0m), D = V.P(D0);
  hbSeg(ctx, hbV(Math.min(A.x, B.x) - 12, C.y), hbV(Math.max(B.x, C.x) + 30, C.y), DK_SEPIA, 2.2);
  hbSeg(ctx, C, D, DK_IVORY, 2.2, [5, 4]);
  hbSeg(ctx, A, D, DK_IVORY, 2.2);
  hbSeg(ctx, B, D, DK_IVORY, 2.2);
  dkAng(ctx, C, A, D, 9, DK_GREEN);
  dkAng(ctx, A, C, D, 30, DK_BLUE, { label: la, lr: 46, font: f(800, 12) });
  if (same) dkAng(ctx, B, C, D, 24, DK_MUSTARD, { label: lb, lr: 40, font: f(800, 12) });
  else dkAng(ctx, B, D, C, 24, DK_MUSTARD, { label: lb, lr: 40, font: f(800, 12) });
  [A, B, C, D].forEach(p => dkPt(ctx, p, DK_IVORY, 3.2));
  dkName(ctx, A, 'A', DK_IVORY, -2, 15);
  dkName(ctx, B, 'B', DK_IVORY, -2, 15);
  dkName(ctx, C, 'C', DK_IVORY, 10, 14);
  dkName(ctx, D, 'D', DK_IVORY, 0, -14);
  dkTag(ctx, ab, (A.x + B.x) / 2, C.y + 34, DK_SEPIA, 13);
}

function initQuizFigs() {
  document.querySelectorAll('canvas.quiz-fig[data-fig]').forEach(cv => {
    const fn = AP_QUIZ_FIGS[cv.getAttribute('data-fig')];
    if (!fn) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    fn(ctx, cv.width, cv.height);
  });
}

/* ==========================================================================
   重點 1：影子測高（陽光是平行光／路燈從一點射出）
   數學座標的單位是公尺，y 朝上；地面是 y = 0。
   ========================================================================== */
function initShadowCanvas() {
  const cv = hbEl('canvas-shadow');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sh = hbEl('shadow-h'), ss = hbEl('shadow-s'), sS = hbEl('shadow-S');
  const sd = hbEl('shadow-d'), sl = hbEl('shadow-l');
  const vh = hbEl('shadow-vh'), vs = hbEl('shadow-vs'), vS = hbEl('shadow-vS');
  const vd = hbEl('shadow-vd'), vl = hbEl('shadow-vl');
  const out = hbEl('shadow-formula'), fb = hbEl('shadow-feedback');
  const C0 = DK_TONE[0];
  let mode = 'sun';

  function draw() {
    const W = cv.width;
    const h = hbClampSlider(sh, 150, 180);
    const hq = qOf(h, 100);
    vh.textContent = `${h} 公分`;
    dkShow(['shadow-row-s', 'shadow-row-S'], mode === 'sun');
    dkShow(['shadow-row-d', 'shadow-row-l'], mode === 'lamp');
    ctx.clearRect(0, 0, W, cv.height);
    const box = { x: 78, y: 62, w: 420, h: 222 };

    if (mode === 'sun') {
      const s = hbClampSlider(ss, 100, 300), S = hbClampSlider(sS, 2, 12);
      vs.textContent = `${s} 公分`;
      vS.textContent = `${S} 公尺`;
      const sq = qOf(s, 100), Sq = qOf(S, 1);
      const xq = qDiv(qMul(hq, Sq), sq);
      drawTitle(ctx, '陽光下的影子：樹有多高？', C0);

      const hm = qVal(hq), sm = qVal(sq), H = qVal(xq);
      const gap = Math.max(1.2, 0.3 * (sm + S));
      const C0m = hbV(0, 0), A0 = hbV(0, hm), B0 = hbV(sm, 0);
      const F0 = hbV(sm + gap, 0), D0 = hbV(sm + gap, H), E0 = hbV(sm + gap + S, 0);
      const V = dkView([hbV(-0.5, 0), A0, B0, F0, D0, E0], box);
      const A = V.P(A0), B = V.P(B0), C = V.P(C0m), D = V.P(D0), E = V.P(E0), F = V.P(F0);

      apGround(ctx, 24, W - 24, C.y);
      apSun(ctx, 40, 66);
      // 平行的陽光：各自從頭頂往回延伸到畫面上緣
      [[B, A], [E, D]].forEach(([P, Q]) => {
        const up = (P.y - Q.y) / (hbDist(P, Q) || 1);
        apRay(ctx, hbBeyond(P, Q, Math.max(0, (Q.y - 50) / up)), P);
      });
      apTri(ctx, [A, C, B], DK_IVORY, 0.14);
      apTri(ctx, [D, F, E], DK_RED, 0.16);
      dkAng(ctx, B, A, C, 24, DK_BLUE);
      dkAng(ctx, E, D, F, 24, DK_BLUE);
      dkAng(ctx, C, A, B, 12, DK_GREEN);
      dkAng(ctx, F, D, E, 12, DK_GREEN);
      apPerson(ctx, C, A, DK_IVORY);
      apTree(ctx, F, D);

      dkName(ctx, A, 'A', DK_IVORY, -15, -2);
      dkName(ctx, C, 'C', DK_IVORY, -12, 16);
      dkName(ctx, B, 'B', DK_IVORY, 6, 16);
      dkName(ctx, D, 'D', DK_IVORY, -16, -6);
      dkName(ctx, F, 'F', DK_IVORY, -12, 16);
      dkName(ctx, E, 'E', DK_IVORY, 6, 16);
      dkTag(ctx, apR(hq), A.x - 34, (A.y + C.y) / 2, DK_IVORY, 14);
      dkTag(ctx, apR(sq), (C.x + B.x) / 2, C.y + 20, DK_IVORY, 14);
      dkTag(ctx, String(S), (F.x + E.x) / 2, C.y + 20, DK_ROSE, 14);
      dkTag(ctx, 'x', D.x + 40, (D.y + F.y) / 2, DK_ROSE, 15);

      dkRow(ctx, '[AB] // [DE]（陽光平行）⇒ ∠B = ∠E；又 ∠C = ∠F = 90°', 330, DK_SEPIA, 15);
      dkRow(ctx, '⇒ △ABC ∼ △DEF（AA 相似）⇒ [AC] : [DF] = [BC] : [EF]', 364, DK_OK, 15);
      dkRow(ctx, `${apR(hq)} : x = ${apR(sq)} : ${S}`, 404, DK_ROSE, 18);
      dkRow(ctx, `${apCoef(apR(sq), "x")} = ${apR(hq)} × ${S} ⇒ x = ${apRApprox(xq)}（公尺）`, 444, DK_ROSE, 17);
      dkRow(ctx, `單位先換成公尺：${h} 公分 = ${apR(hq)} 公尺、${s} 公分 = ${apR(sq)} 公尺`, 484, MUTED, 13.5);

      out.innerHTML = wbrEq(`x = \\frac{${apT(hq)} \\times ${S}}{${apT(sq)}} = ${apTApprox(xq)}`);
      fb.innerHTML = wrapFeedback(`太陽很遠，陽光可以看成<strong>平行光</strong>：同一時刻，人和樹的影子各自圍出一個直角三角形，兩個三角形相似。<br>身高對樹高、人影對樹影：\\(${apT(hq)} : x = ${apT(sq)} : ${S}\\)，樹高約 \\(${apTApprox(xq)}\\) 公尺。`);
    } else {
      const d2 = hbClampSlider(sd, 2, 16), l5 = hbClampSlider(sl, 5, 20);
      const dq = qOf(d2, 2), lq = qOf(l5, 5);
      vd.textContent = `${apR(dq)} 公尺`;
      vl.textContent = `${apR(lq)} 公尺`;
      const bfq = qAdd(dq, lq);
      const xq = qDiv(qMul(hq, bfq), lq);
      drawTitle(ctx, '路燈下的影子：路燈有多高？', C0);

      const hm = qVal(hq), dm = qVal(dq), lm = qVal(lq), H = qVal(xq);
      const F0 = hbV(0, 0), D0 = hbV(0, H), C0m = hbV(dm, 0), A0 = hbV(dm, hm), B0 = hbV(dm + lm, 0);
      const V = dkView([hbV(-0.6, 0), D0, B0, hbV(dm + lm + 0.4, 0)], box);
      const A = V.P(A0), B = V.P(B0), C = V.P(C0m), D = V.P(D0), F = V.P(F0);

      apGround(ctx, 24, W - 24, F.y);
      apTri(ctx, [D, F, B], DK_RED, 0.12);
      apTri(ctx, [A, C, B], DK_IVORY, 0.16);
      apRay(ctx, D, B);
      hbSeg(ctx, F, hbV(D.x, D.y + 4), DK_SEPIA, 4);
      dkAng(ctx, B, A, C, 26, DK_BLUE);
      dkAng(ctx, C, A, B, 12, DK_GREEN);
      dkAng(ctx, F, D, B, 12, DK_GREEN);
      apPerson(ctx, C, A, DK_IVORY);
      dkLamp(ctx, D, DK_MUSTARD);

      dkName(ctx, D, 'D', DK_MUSTARD, -18, -4);
      dkName(ctx, F, 'F', DK_IVORY, -12, 16);
      dkName(ctx, A, 'A', DK_IVORY, -14, -6);
      dkName(ctx, C, 'C', DK_IVORY, -10, 16);
      dkName(ctx, B, 'B', DK_IVORY, 8, 16);
      dkTag(ctx, apR(hq), A.x + 30, (A.y + C.y) / 2, DK_IVORY, 14);
      dkTag(ctx, apR(dq), (F.x + C.x) / 2, F.y + 20, DK_SEPIA, 14);
      dkTag(ctx, apR(lq), (C.x + B.x) / 2, F.y + 20, DK_IVORY, 14);
      dkTag(ctx, 'x', D.x - 30, (D.y + F.y) / 2, DK_ROSE, 15);

      dkRow(ctx, '燈光從燈泡一點射出：D、A、B 在同一直線上，∠B 共用；∠C = ∠F = 90°', 330, DK_SEPIA, 15);
      dkRow(ctx, '⇒ △ABC ∼ △DBF（AA 相似）⇒ [AC] : [DF] = [BC] : [BF]', 364, DK_OK, 15);
      dkRow(ctx, `${apR(hq)} : x = ${apR(lq)} : (${apR(dq)} + ${apR(lq)})`, 404, DK_ROSE, 18);
      dkRow(ctx, `${apCoef(apR(lq), "x")} = ${apR(hq)} × ${apR(bfq)} ⇒ x = ${apRApprox(xq)}（公尺）`, 444, DK_ROSE, 17);
      dkRow(ctx, `對應的是整條 [BF]（人到燈柱 + 影長），不是只有人到燈柱的 ${apR(dq)}`, 484, MUTED, 13.5);

      out.innerHTML = wbrEq(`x = \\frac{${apT(hq)} \\times ${apT(bfq)}}{${apT(lq)}} = ${apTApprox(xq)}`);
      fb.innerHTML = wrapFeedback(`路燈的光是從燈泡<strong>一點</strong>射出來的，不是平行光。燈泡 \\(D\\)、頭頂 \\(A\\)、影子尖端 \\(B\\) 在同一條直線上，小三角形與大三角形共用 \\(\\angle B\\)。<br>身高對燈高、影長對 \\(\\overline{BF}\\)：\\(\\overline{BF} = ${apT(dq)} + ${apT(lq)} = ${apT(bfq)}\\)，燈高約 \\(${apTApprox(xq)}\\) 公尺。`);
    }
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('shadow-mode-group'), 'data-shadow-mode', m => { mode = m; draw(); });
  [sh, ss, sS, sd, sl].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：測量河寬（X 字型：對頂角＋兩個直角）
   沿河岸 A → C 走 a 步、C → D 再走 b 步；D 往離開河的方向走到 E，使 B、C、E 共線。
   畫圖時一步取 0.5 公尺（只影響圖的比例，不影響答案）。
   ========================================================================== */
function initRiverXCanvas() {
  const cv = hbEl('canvas-riverx');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('rx-a'), sb = hbEl('rx-b'), se = hbEl('rx-de');
  const va = hbEl('rx-va'), vb = hbEl('rx-vb'), ve = hbEl('rx-vde');
  const out = hbEl('rx-formula'), fb = hbEl('rx-feedback');
  const C1 = DK_TONE[1];

  function draw() {
    const W = cv.width;
    const a = hbClampSlider(sa, 10, 30), b = hbClampSlider(sb, 3, 8), e2 = hbClampSlider(se, 2, 8);
    const deq = qOf(e2, 2);
    va.textContent = `${a} 步`;
    vb.textContent = `${b} 步`;
    ve.textContent = `${apR(deq)} 公尺`;
    const abq = qDiv(qMul(deq, [a, 1]), [b, 1]);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '站在岸邊，量出對岸有多遠', C1);

    const u = 0.5, wv = qVal(abq), dv = qVal(deq);
    const A0 = hbV(0, 0), C0m = hbV(a * u, 0), D0 = hbV((a + b) * u, 0);
    const B0 = hbV(0, wv), E0 = hbV((a + b) * u, -dv);
    const V = dkView([hbV(-1.2, 0), A0, B0, C0m, D0, E0, hbV((a + b) * u + 1.2, wv)], { x: 40, y: 60, w: 460, h: 226 });
    const A = V.P(A0), B = V.P(B0), C = V.P(C0m), D = V.P(D0), E = V.P(E0);
    const xL = V.P(hbV(-1.2, 0)).x, xR = V.P(hbV((a + b) * u + 1.2, 0)).x;

    // 河：近岸在 y = 0、對岸在 y = 河寬
    ctx.save();
    ctx.fillStyle = AP_RIVER;
    ctx.fillRect(xL, B.y, xR - xL, A.y - B.y);
    ctx.restore();
    hbSeg(ctx, hbV(xL, A.y), hbV(xR, A.y), DK_SEPIA, 2.4);
    hbSeg(ctx, hbV(xL, B.y), hbV(xR, B.y), DK_SEPIA, 2.4);
    textCenter(ctx, '河', (A.x + C.x) / 2 + 30, (A.y + B.y) / 2, 'rgba(125, 211, 252, 0.7)', f(800, 16));

    apTri(ctx, [A, B, C], DK_IVORY, 0.12);
    apTri(ctx, [D, E, C], DK_RED, 0.16);
    apRay(ctx, B, E);
    hbSeg(ctx, A, B, DK_ROSE, 2.6, [6, 5]);
    hbSeg(ctx, A, D, DK_IVORY, 2.6);
    hbSeg(ctx, D, E, DK_IVORY, 2.6);
    dkAng(ctx, A, C, B, 14, DK_GREEN);
    dkAng(ctx, D, C, E, 14, DK_GREEN);
    dkAng(ctx, C, A, B, 22, DK_BLUE);
    dkAng(ctx, C, D, E, 22, DK_BLUE);
    apTree(ctx, B, hbV(B.x, B.y - 30));
    [A, C, D, E].forEach(p => dkPt(ctx, p, DK_IVORY, 4));

    dkName(ctx, A, 'A', DK_IVORY, -14, 14);
    dkName(ctx, B, 'B', DK_IVORY, -16, 4);
    dkName(ctx, C, 'C', DK_IVORY, 0, 18);
    dkName(ctx, D, 'D', DK_IVORY, 14, -12);
    dkName(ctx, E, 'E', DK_IVORY, 14, 6);
    dkTag(ctx, `${a} 步`, (A.x + C.x) / 2, A.y + 22, DK_SEPIA, 13);
    dkTag(ctx, `${b} 步`, (C.x + D.x) / 2, A.y - 16, DK_SEPIA, 13);
    dkTag(ctx, apR(deq), D.x + 30, (D.y + E.y) / 2, DK_IVORY, 14);
    dkTag(ctx, '?', A.x - 22, (A.y + B.y) / 2, DK_ROSE, 15);

    dkRow(ctx, '[AB] ⊥ [AD]、[DE] ⊥ [AD] ⇒ [AB] // [DE] ⇒ ∠B = ∠E（內錯角）', 330, DK_SEPIA, 15);
    dkRow(ctx, '又 ∠A = ∠D = 90° ⇒ △ABC ∼ △DEC（AA 相似）', 364, DK_OK, 15);
    dkRow(ctx, `[AB] : [DE] = [CA] : [CD] ⇒ [AB] : ${apR(deq)} = ${a} : ${b}`, 404, DK_ROSE, 17);
    dkRow(ctx, `${b}[AB] = ${apR(qMul(deq, [a, 1]))} ⇒ [AB] = ${apRApprox(abq)}（公尺）`, 444, DK_ROSE, 17);
    dkRow(ctx, '每一步一樣長，[CA] : [CD] 就直接用步數的比', 484, MUTED, 13.5);

    out.innerHTML = wbrEq(`\\overline{AB} = \\frac{${apT(deq)} \\times ${a}}{${b}} = ${apTApprox(abq)}`);
    fb.innerHTML = wrapFeedback(`河寬 \\(\\overline{AB}\\) 量不到，就在自己這一岸做一個<strong>小的相似三角形</strong>：\\(\\angle ACB\\) 與 \\(\\angle DCE\\) 是對頂角，\\(\\angle A = \\angle D = 90^\\circ\\)。<br>\\(\\overline{CA}\\) 是 \\(\\overline{CD}\\) 的 \\(${apT(qOf(a, b))}\\) 倍，所以河寬也是 \\(\\overline{DE}\\) 的 \\(${apT(qOf(a, b))}\\) 倍。`);
    typeset([out, fb]);
  }

  [sa, sb, se].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：未知數藏在「一段和」裡（A 字型量河寬、X 字型找寶藏）
   ========================================================================== */
function apXCoef(c) {
  return c === 1 ? 'x' : `${c}x`;
}

function initRiverSumCanvas() {
  const cv = hbEl('canvas-riversum');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = hbEl('rs-p'), sq = hbEl('rs-q'), sn = hbEl('rs-n'), sm = hbEl('rs-m');
  const vp = hbEl('rs-vp'), vq = hbEl('rs-vq'), vn = hbEl('rs-vn'), vm = hbEl('rs-vm');
  const out = hbEl('rs-formula'), fb = hbEl('rs-feedback');
  const C2 = DK_TONE[2];
  let mode = 'a';

  function draw() {
    const W = cv.width;
    const p = hbClampSlider(sp, 6, 12), q = hbClampSlider(sq, 2, 5);
    vp.textContent = p;
    vq.textContent = q;
    dkShow(['rs-row-n'], mode === 'a');
    dkShow(['rs-row-m'], mode === 'x');
    ctx.clearRect(0, 0, W, cv.height);
    const box = { x: 60, y: 62, w: 420, h: 220 };

    if (mode === 'a') {
      const n = hbClampSlider(sn, 3, 12);
      vn.textContent = n;
      const xq = qOf(q * n, p - q);
      drawTitle(ctx, 'A 字型：河寬 x 只是底邊的一部分', C2);
      const xv = qVal(xq);
      const B0 = hbV(0, 0), D0 = hbV(n, 0), E0 = hbV(n + xv, 0), A0 = hbV(0, p), C0m = hbV(n, q);
      const V = dkView([hbV(-0.6, 0), A0, E0, hbV(n + xv + 0.8, 0)], box);
      const A = V.P(A0), B = V.P(B0), C = V.P(C0m), D = V.P(D0), E = V.P(E0);
      const top = V.P(hbV(0, p)).y - 8;

      ctx.save();
      ctx.fillStyle = AP_RIVER;
      ctx.fillRect(D.x, top, E.x - D.x, B.y - top + 30);
      ctx.restore();
      textCenter(ctx, '河', (D.x + E.x) / 2, top + 22, 'rgba(125, 211, 252, 0.7)', f(800, 16));
      apGround(ctx, 24, D.x, B.y);
      hbSeg(ctx, hbV(E.x, B.y), hbV(W - 24, B.y), DK_SEPIA, 2.6);

      apTri(ctx, [A, B, E], DK_IVORY, 0.1);
      apTri(ctx, [C, D, E], DK_RED, 0.18);
      apRay(ctx, A, E);
      hbSeg(ctx, A, B, DK_IVORY, 2.6);
      hbSeg(ctx, C, D, DK_IVORY, 2.6);
      hbSeg(ctx, D, E, DK_ROSE, 2.6, [6, 5]);
      dkAng(ctx, B, A, E, 13, DK_GREEN);
      dkAng(ctx, D, C, E, 13, DK_GREEN);
      dkAng(ctx, E, A, B, 30, DK_BLUE);
      apTree(ctx, E, hbV(E.x, E.y - 28));
      [A, B, C, D].forEach(pt => dkPt(ctx, pt, DK_IVORY, 4));

      dkName(ctx, A, 'A', DK_IVORY, -14, -4);
      dkName(ctx, B, 'B', DK_IVORY, -12, 16);
      dkName(ctx, C, 'C', DK_IVORY, -4, -16);
      dkName(ctx, D, 'D', DK_IVORY, -10, 16);
      dkName(ctx, E, 'E', DK_IVORY, 12, 16);
      dkTag(ctx, String(p), A.x - 24, (A.y + B.y) / 2, DK_IVORY, 14);
      dkTag(ctx, String(q), C.x - 20, (C.y + D.y) / 2, DK_IVORY, 14);
      dkTag(ctx, String(n), (B.x + D.x) / 2, B.y + 36, DK_SEPIA, 14);
      dkTag(ctx, 'x', (D.x + E.x) / 2, B.y + 36, DK_ROSE, 15);

      dkRow(ctx, '∠B = ∠CDE = 90°，∠E 共用 ⇒ △ABE ∼ △CDE（AA 相似）', 330, DK_OK, 15);
      dkRow(ctx, `設河寬 [DE] = x，則 [BE] = ${n} + x`, 364, DK_SEPIA, 15);
      dkRow(ctx, `[AB] : [CD] = [BE] : [DE] ⇒ ${p} : ${q} = (${n} + x) : x`, 404, DK_ROSE, 17);
      const mid = p - q === 1 ? '' : `${apXCoef(p - q)} = ${q * n} ⇒ `;
      dkRow(ctx, `${apXCoef(p)} = ${q}(${n} + x) ⇒ ${mid}x = ${apRApprox(xq)}`, 444, DK_ROSE, 17);
      dkRow(ctx, `對應的是整條 [BE]，不是只有 [BD] = ${n}`, 484, MUTED, 13.5);

      out.innerHTML = wbrEq(`x = \\frac{${q} \\times ${n}}{${p} - ${q}} = ${apTApprox(xq)}`);
      fb.innerHTML = wrapFeedback(`兩個直角三角形共用 \\(\\angle E\\)。大三角形的底是 \\(\\overline{BE} = ${n} + x\\)，要整條拿去對應小三角形的 \\(\\overline{DE} = x\\)。<br>列出 \\(${p} : ${q} = (${n} + x) : x\\)，交叉相乘後 \\(x\\) 移到同一邊，得 \\(x = ${apTApprox(xq)}\\)。`);
    } else {
      const m = hbClampSlider(sm, 10, 30);
      vm.textContent = m;
      const xq = qOf(p * m, p + q), cdq = qSub([m, 1], xq);
      drawTitle(ctx, 'X 字型：知道的是兩段的和', C2);
      const xv = qVal(xq);
      const B0 = hbV(0, 0), A0 = hbV(0, p), D0 = hbV(m, 0), E0 = hbV(m, -q), C0m = hbV(xv, 0);
      const V = dkView([hbV(-0.8, 0), A0, D0, E0, hbV(m + 0.8, 0)], box);
      const A = V.P(A0), B = V.P(B0), C = V.P(C0m), D = V.P(D0), E = V.P(E0);

      apTri(ctx, [A, B, C], DK_IVORY, 0.12);
      apTri(ctx, [E, D, C], DK_RED, 0.16);
      hbSeg(ctx, B, D, DK_IVORY, 2.6);
      hbSeg(ctx, A, B, DK_IVORY, 2.6);
      hbSeg(ctx, D, E, DK_IVORY, 2.6);
      apRay(ctx, A, E);
      dkAng(ctx, B, A, C, 13, DK_GREEN);
      dkAng(ctx, D, C, E, 13, DK_GREEN);
      dkAng(ctx, C, A, B, 22, DK_BLUE);
      dkAng(ctx, C, D, E, 22, DK_BLUE);
      [A, B, C, D, E].forEach(pt => dkPt(ctx, pt, DK_IVORY, 4));

      dkName(ctx, A, 'A', DK_IVORY, -14, -4);
      dkName(ctx, B, 'B', DK_IVORY, -14, 12);
      dkName(ctx, C, 'C', DK_IVORY, 0, -17);
      dkName(ctx, D, 'D', DK_IVORY, 14, -12);
      dkName(ctx, E, 'E', DK_IVORY, 14, 6);
      dkTag(ctx, String(p), A.x - 24, (A.y + B.y) / 2, DK_IVORY, 14);
      dkTag(ctx, String(q), D.x + 24, (D.y + E.y) / 2, DK_IVORY, 14);
      dkTag(ctx, 'x', (B.x + C.x) / 2, B.y + 18, DK_ROSE, 15);
      dkTag(ctx, `${m} − x`, (C.x + D.x) / 2, B.y - 16, DK_SEPIA, 13);
      dkTag(ctx, `[BD] = ${m}`, (B.x + D.x) / 2, Math.max(E.y, B.y) + 30, DK_SEPIA, 13);

      dkRow(ctx, '∠B = ∠D = 90°，∠ACB = ∠ECD（對頂角）⇒ △ABC ∼ △EDC（AA 相似）', 330, DK_OK, 15);
      dkRow(ctx, `設 [BC] = x，則 [CD] = ${m} − x`, 364, DK_SEPIA, 15);
      dkRow(ctx, `[AB] : [ED] = [BC] : [DC] ⇒ ${p} : ${q} = x : (${m} − x)`, 404, DK_ROSE, 17);
      dkRow(ctx, `${apXCoef(q)} = ${p}(${m} − x) ⇒ ${apXCoef(p + q)} = ${p * m} ⇒ x = ${apRApprox(xq)}`, 444, DK_ROSE, 17);
      dkRow(ctx, `[BC] = ${apR(xq)}、[CD] = ${apR(cdq)}，兩段合起來剛好是 ${m}`, 484, MUTED, 13.5);

      out.innerHTML = wbrEq(`x = \\frac{${p} \\times ${m}}{${p} + ${q}} = ${apTApprox(xq)}`);
      fb.innerHTML = wrapFeedback(`\\(\\overline{BC}\\) 與 \\(\\overline{CD}\\) 都不知道，只知道合起來是 \\(${m}\\)：設一段是 \\(x\\)，另一段就是 \\(${m} - x\\)。<br>\\(\\overline{BC}\\) 對應 \\(\\overline{DC}\\)（兩個都和直角相鄰、夾著對頂角），列出 \\(${p} : ${q} = x : (${m} - x)\\)。`);
    }
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('rs-mode-group'), 'data-rs-mode', v => { mode = v; draw(); });
  [sp, sq, sn, sm].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：相似三角形的對應高（中線、角平分線也一樣）
   △ABC ∼ △DEF，邊長比 m : n；∠C 固定 52°，∠B 可調（都是銳角三角形）。
   ========================================================================== */
const AP_HR = [[2, 1], [5, 2], [4, 3], [3, 1], [5, 3]];
const AP_HMODE = { alt: '對應高', med: '對應中線', bis: '對應角平分線' };

// 由頂點 A 畫到底邊 BC 上的點：高的垂足、中點、角平分線的交點（數學座標，BC 在 x 軸上）
function apFootOn(T, kind) {
  const a = T.C.x;
  if (kind === 'alt') return hbV(T.A.x, 0);
  if (kind === 'med') return hbV(a / 2, 0);
  const ab = dkLen(T.A, T.B), ac = dkLen(T.A, T.C);
  return hbV(a * ab / (ab + ac), 0);
}

function initHeightCanvas() {
  const cv = hbEl('canvas-height');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sr = hbEl('ht-r'), sbc = hbEl('ht-bc'), sb = hbEl('ht-b');
  const vr = hbEl('ht-vr'), vbc = hbEl('ht-vbc'), vb = hbEl('ht-vb');
  const out = hbEl('ht-formula'), fb = hbEl('ht-feedback');
  const C3 = DK_TONE[3];
  let kind = 'alt';

  function draw() {
    const W = cv.width;
    const [m, n] = AP_HR[hbClampSlider(sr, 0, AP_HR.length - 1)];
    const bc = hbClampSlider(sbc, 6, 15), angB = hbClampSlider(sb, 40, 75);
    vr.textContent = `${m} : ${n}`;
    vbc.textContent = bc;
    vb.textContent = `${angB}°`;
    const efq = qOf(bc * n, m);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `相似三角形的${AP_HMODE[kind]}：比和邊的比一樣嗎？`, C3);

    const T1 = dkTriAngles(bc, angB, 52), T2 = dkTriAngles(qVal(efq), angB, 52);
    const P1 = apFootOn(T1, kind), P2 = apFootOn(T2, kind);
    const V = dkView2([T1.A, T1.B, T1.C], { x: 34, y: 66, w: 270, h: 200 },
                      [T2.A, T2.B, T2.C], { x: 322, y: 66, w: 190, h: 200 });
    const A = V.L(T1.A), B = V.L(T1.B), C = V.L(T1.C), P = V.L(P1);
    const D = V.R(T2.A), E = V.R(T2.B), F = V.R(T2.C), Q = V.R(P2);

    apTri(ctx, [A, B, C], DK_IVORY, 0.1);
    apTri(ctx, [D, E, F], DK_IVORY, 0.1);
    apTri(ctx, [A, B, P], DK_BLUE, 0.16);
    apTri(ctx, [D, E, Q], DK_BLUE, 0.16);
    hbSeg(ctx, A, P, DK_ROSE, 3.2);
    hbSeg(ctx, D, Q, DK_ROSE, 3.2);
    dkAng(ctx, B, A, C, 20, DK_GREEN);
    dkAng(ctx, E, D, F, 20, DK_GREEN);
    if (kind === 'alt') {
      dkAng(ctx, P, A, C, 12, DK_MUSTARD);
      dkAng(ctx, Q, D, F, 12, DK_MUSTARD);
    } else if (kind === 'med') {
      hbTick(ctx, B, P, 1, DK_MUSTARD);
      hbTick(ctx, P, C, 1, DK_MUSTARD);
      hbTick(ctx, E, Q, 2, DK_MUSTARD);
      hbTick(ctx, Q, F, 2, DK_MUSTARD);
    } else {
      dkAng(ctx, A, B, P, 24, DK_MUSTARD);
      dkAng(ctx, A, P, C, 30, DK_MUSTARD);
      dkAng(ctx, D, E, Q, 18, DK_MUSTARD);
      dkAng(ctx, D, Q, F, 23, DK_MUSTARD);
    }
    [P, Q].forEach(pt => dkPt(ctx, pt, DK_ROSE, 3.5));
    dkNames(ctx, [A, B, C], ['A', 'B', 'C'], DK_IVORY);
    dkNames(ctx, [D, E, F], ['D', 'E', 'F'], DK_IVORY);
    dkName(ctx, P, 'P', DK_ROSE, 0, 16);
    dkName(ctx, Q, 'Q', DK_ROSE, 0, 16);

    const ap = dkLen(T1.A, P1), dq = dkLen(T2.A, P2);
    dkTag(ctx, `[BC] = ${bc}`, (B.x + C.x) / 2, B.y + 38, DK_SEPIA, 13);
    dkTag(ctx, `[EF] = ${apR(efq)}`, (E.x + F.x) / 2, E.y + 38, DK_ROSE, 13);
    dkTag(ctx, `≒ ${apFix(ap, 2)}`, (A.x + P.x) / 2 + 30, (A.y + P.y) / 2 + 8, DK_ROSE, 12);
    dkTag(ctx, `≒ ${apFix(dq, 2)}`, (D.x + Q.x) / 2 + 30, (D.y + Q.y) / 2 + 8, DK_ROSE, 12);

    dkRow(ctx, `△ABC ∼ △DEF（A ↔ D、B ↔ E、C ↔ F），對應邊的比是 ${m} : ${n}`, 330, DK_SEPIA, 15);
    if (kind === 'alt') {
      dkRow(ctx, '∠B = ∠E、∠APB = ∠DQE = 90° ⇒ △ABP ∼ △DEQ（AA 相似）', 364, DK_OK, 15);
    } else if (kind === 'med') {
      dkRow(ctx, '∠B = ∠E，[BP] : [EQ] = {1/2}[BC] : {1/2}[EF] = [AB] : [DE] ⇒ △ABP ∼ △DEQ（SAS 相似）', 364, DK_OK, 15);
    } else {
      dkRow(ctx, '∠B = ∠E，∠BAP = {1/2}∠A = {1/2}∠D = ∠EDQ ⇒ △ABP ∼ △DEQ（AA 相似）', 364, DK_OK, 15);
    }
    dkRow(ctx, `⇒ [AP] : [DQ] = [AB] : [DE] = ${m} : ${n}（量一量：${apFix(ap, 2)} : ${apFix(dq, 2)}）`, 404, DK_ROSE, 16);
    dkRow(ctx, `反過來：已知 [AP] : [DQ] = ${m} : ${n}、[BC] = ${bc} ⇒ [EF] = ${bc} × {${n}/${m}} = ${apR(efq)}`, 444, DK_ROSE, 16);
    dkRow(ctx, '高、中線、角平分線：對應線段的比都等於對應邊的比', 484, MUTED, 13.5);

    out.innerHTML = wbrEq(`\\overline{AP} : \\overline{DQ} = ${m} : ${n}`) + '，<wbr>'
      + wbrEq(`\\overline{EF} = ${bc} \\times \\frac{${n}}{${m}} = ${apT(efq)}`);
    fb.innerHTML = wrapFeedback(`${AP_HMODE[kind]}把兩個三角形各切出一個小三角形 \\(\\triangle ABP\\)、\\(\\triangle DEQ\\)，它們也相似，所以 \\(\\overline{AP}\\) 和 \\(\\overline{DQ}\\) 的比就是 \\(${m} : ${n}\\)。<br>量出來 \\(${apFix(ap, 2)} : ${apFix(dq, 2)}\\)，除一除也是 \\(${apFix(m / n, 2)}\\)。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('ht-mode-group'), 'data-ht-mode', v => { kind = v; draw(); });
  [sr, sbc, sb].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：面積比 = 對應邊長平方的比（正推）／面積比 → 邊長比（反推）
   形狀固定：∠B = 62°、∠C = 50°。邊長 n 份的三角形用中點格線切成 n² 塊小三角形。
   ========================================================================== */
const AP_AREA_PAIRS = [[4, 9], [25, 16], [1, 3], [2, 9], [4, 5]];

// 把三角形 ABC（畫布座標）切成 n² 塊：三組平行於各邊的格線
function apTiles(ctx, A, B, C, n, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.3;
  const L = (P, Q, t) => hbV(P.x + (Q.x - P.x) * t, P.y + (Q.y - P.y) * t);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    [[A, B, A, C], [B, A, B, C], [C, A, C, B]].forEach(([P, Q, R, S]) => {
      const u = L(P, Q, t), v = L(R, S, t);
      ctx.beginPath();
      ctx.moveTo(u.x, u.y);
      ctx.lineTo(v.x, v.y);
      ctx.stroke();
    });
  }
  ctx.restore();
}

function apCoef(c, v) {
  // 係數 1 不寫（c 可以是數字或字串）
  return (c === 1 || c === '1') ? v : `${c}${v}`;
}

function initAreaCanvas() {
  const cv = hbEl('canvas-area');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('ar-a'), sb = hbEl('ar-b'), ss = hbEl('ar-s');
  const va = hbEl('ar-va'), vb = hbEl('ar-vb'), vs = hbEl('ar-vs');
  const out = hbEl('ar-formula'), fb = hbEl('ar-feedback');
  const C4 = DK_TONE[4];
  let mode = 'fwd', pair = 0;

  function draw() {
    const W = cv.width;
    dkShow(['ar-row-a', 'ar-row-b', 'ar-row-s'], mode === 'fwd');
    dkShow(['ar-row-pair'], mode === 'rev');
    ctx.clearRect(0, 0, W, cv.height);
    const boxL = { x: 30, y: 64, w: 270, h: 210 }, boxR = { x: 316, y: 64, w: 196, h: 210 };

    if (mode === 'fwd') {
      const a = hbClampSlider(sa, 1, 5), b = hbClampSlider(sb, 1, 5), S = hbClampSlider(ss, 9, 90);
      va.textContent = a;
      vb.textContent = b;
      vs.textContent = S;
      const yq = qOf(S * b * b, a * a);
      const red = qOf(a * a, b * b);
      drawTitle(ctx, '邊長變幾倍，面積變幾倍？', C4);
      const T1 = dkTriAngles(a, 62, 50), T2 = dkTriAngles(b, 62, 50);
      const V = dkView2([T1.A, T1.B, T1.C], boxL, [T2.A, T2.B, T2.C], boxR);
      const A = V.L(T1.A), B = V.L(T1.B), C = V.L(T1.C);
      const D = V.R(T2.A), E = V.R(T2.B), F = V.R(T2.C);
      apTri(ctx, [A, B, C], DK_GREEN, 0.2);
      apTri(ctx, [D, E, F], DK_RED, 0.2);
      apTiles(ctx, A, B, C, a, DK_IVORY);
      apTiles(ctx, D, E, F, b, DK_IVORY);
      dkNames(ctx, [A, B, C], ['A', 'B', 'C'], DK_IVORY);
      dkNames(ctx, [D, E, F], ['D', 'E', 'F'], DK_IVORY);
      dkTag(ctx, `${a} 份`, (B.x + C.x) / 2, B.y + 26, DK_GREEN, 13);
      dkTag(ctx, `${b} 份`, (E.x + F.x) / 2, E.y + 26, DK_ROSE, 13);
      const GA = hbCentroid([A, B, C]), GD = hbCentroid([D, E, F]);
      dkTag(ctx, `${a * a} 塊`, GA.x, GA.y, DK_GREEN, 13);
      dkTag(ctx, `${b * b} 塊`, GD.x, GD.y, DK_ROSE, 13);

      const ratioTail = (red[0] === a * a) ? '' : ` = ${red[0]} : ${red[1]}`;
      dkRow(ctx, `邊長比 [BC] : [EF] = ${a} : ${b}（對應高的比也是 ${a} : ${b}）`, 330, DK_SEPIA, 15);
      dkRow(ctx, `面積比 = ${a}² : ${b}² = ${a * a} : ${b * b}${ratioTail}`, 364, DK_OK, 16);
      dkRow(ctx, `△ABC 的面積是 ${S}，設 △DEF 的面積是 y ⇒ ${S} : y = ${a * a} : ${b * b}`, 404, DK_ROSE, 16);
      dkRow(ctx, `${apCoef(a * a, 'y')} = ${S * b * b} ⇒ y = ${apRApprox(yq)}`, 444, DK_ROSE, 17);
      dkRow(ctx, a === b ? '邊長比 1 : 1：兩個三角形全等，面積一樣' : `面積比不是 ${a} : ${b}：邊長變幾倍，面積就變那個倍數的平方`, 484, MUTED, 13.5);

      out.innerHTML = wbrEq(`y = ${S} \\times ${apT(qOf(b * b, a * a))} = ${apTApprox(yq)}`);
      fb.innerHTML = wrapFeedback(`面積 \\(= \\frac{1}{2} \\times\\) 底 \\(\\times\\) 高，底和高<strong>都</strong>照 \\(${a} : ${b}\\) 變，所以面積的比是 \\(${a}^2 : ${b}^2 = ${a * a} : ${b * b}\\)。<br>數一數小三角形的塊數，就是這個平方。`);
    } else {
      const [m, n] = AP_AREA_PAIRS[pair];
      const g = gcd(m, n), m1 = m / g, n1 = n / g;
      const rm = hbRoot(m1), rn = hbRoot(n1);
      let sideTxt, sideTex;
      if (rm.exact && rn.exact) {
        const g2 = gcd(rm.k, rn.k);
        sideTxt = `${rm.k / g2} : ${rn.k / g2}`;
        sideTex = sideTxt;
      } else {
        sideTxt = `${rm.txt} : ${rn.txt}`;
        sideTex = `${rm.tex} : ${rn.tex}`;
      }
      const kv = Math.sqrt(m / n);
      drawTitle(ctx, '已知面積比，邊長比是多少？', C4);
      const T1 = dkTriAngles(Math.sqrt(m), 62, 50), T2 = dkTriAngles(Math.sqrt(n), 62, 50);
      const V = dkView2([T1.A, T1.B, T1.C], boxL, [T2.A, T2.B, T2.C], boxR);
      const A = V.L(T1.A), B = V.L(T1.B), C = V.L(T1.C);
      const D = V.R(T2.A), E = V.R(T2.B), F = V.R(T2.C);
      apTri(ctx, [A, B, C], DK_GREEN, 0.24);
      apTri(ctx, [D, E, F], DK_RED, 0.24);
      dkNames(ctx, [A, B, C], ['A', 'B', 'C'], DK_IVORY);
      dkNames(ctx, [D, E, F], ['D', 'E', 'F'], DK_IVORY);
      dkTag(ctx, `面積 ${m} 份`, (B.x + C.x) / 2, B.y + 26, DK_GREEN, 13);
      dkTag(ctx, `面積 ${n} 份`, (E.x + F.x) / 2, E.y + 26, DK_ROSE, 13);

      const mid = (g === 1) ? '' : ` = ${m1} : ${n1}`;
      dkRow(ctx, `面積比 △ABC : △DEF = ${m} : ${n}${mid}`, 330, DK_SEPIA, 15);
      dkRow(ctx, `邊長比的平方 = 面積比 ⇒ 邊長比 = √${m1} : √${n1}`, 364, DK_OK, 16);
      dkRow(ctx, `= ${sideTxt}（≒ ${apFix(kv, 2)} : 1）`, 404, DK_ROSE, 18);
      dkRow(ctx, `△ABC 的每一邊是 △DEF 對應邊的 ${apFix(kv, 2)} 倍左右`, 444, DK_ROSE, 16);
      dkRow(ctx, '面積的比要開根號，才是邊長的比', 484, MUTED, 13.5);

      out.innerHTML = wbrEq(`\\sqrt{${m1}} : \\sqrt{${n1}} = ${sideTex}`);
      fb.innerHTML = wrapFeedback(`邊長比是 \\(a : b\\) 時面積比是 \\(a^2 : b^2\\)，所以反過來要<strong>開根號</strong>：面積比 \\(${m} : ${n}\\) 的邊長比是 \\(${sideTex}\\)。<br>面積變幾倍，邊長只變那個倍數的平方根倍，不是一樣多倍。`);
    }
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('ar-mode-group'), 'data-ar-mode', v => { mode = v; draw(); });
  bindPickGroup(hbEl('ar-pair-group'), 'data-ar-pair', v => { pair = parseInt(v, 10); draw(); });
  [sa, sb, ss].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：先找對應邊，再算面積比
   直角 △ABC（∠A = 90°），D 在 AB 上，DE ⊥ BC 於 E；△EBD ∼ △ABC（E ↔ A、D ↔ C）。
   ========================================================================== */
const AP_MATCH_TRI = [[12, 5, 13], [15, 8, 17], [24, 7, 25]];   // AB、AC、BC
const AP_MATCH_T = { '1/3': [1, 3], '1/2': [1, 2], '2/3': [2, 3] };

function apSq(q) {
  return apIsDec(q) ? `${apDecStr(q)}²` : `(${q[0]}/${q[1]})²`;
}

function initMatchCanvas() {
  const cv = hbEl('canvas-match');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const out = hbEl('mt-formula'), fb = hbEl('mt-feedback');
  const C5 = DK_TONE[5];
  let tri = 0, tKey = '1/2', view = 'ok';

  function draw() {
    const W = cv.width;
    const [ab, ac, bc] = AP_MATCH_TRI[tri];
    const t = AP_MATCH_T[tKey];
    const bdq = qMul([ab, 1], t);
    const k = qDiv(bdq, [bc, 1]);
    const beq = qMul(k, [ab, 1]), deq = qMul(k, [ac, 1]);
    const ok = apRatio(qMul(bdq, bdq), [bc * bc, 1]);
    const bad = apRatio(qMul(bdq, bdq), [ab * ab, 1]);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '△EBD 和 △ABC：誰對誰？', C5);

    const A0 = hbV(0, 0), B0 = hbV(ab, 0), C0m = hbV(0, ac);
    const D0 = hbV(ab - qVal(bdq), 0);
    const E0 = dkAdd(B0, hbV((C0m.x - B0.x) / bc, (C0m.y - B0.y) / bc), qVal(beq));
    const V = dkView([A0, B0, C0m], { x: 70, y: 60, w: 400, h: 214 });
    const A = V.P(A0), B = V.P(B0), C = V.P(C0m), D = V.P(D0), E = V.P(E0);

    apTri(ctx, [A, B, C], DK_IVORY, 0.08);
    apTri(ctx, [E, B, D], DK_RED, 0.22);
    hbSeg(ctx, D, E, DK_ROSE, 2.8);
    dkAng(ctx, A, B, C, 13, DK_BLUE);
    dkAng(ctx, E, D, B, 11, DK_BLUE);
    dkAng(ctx, B, A, C, 30, DK_GREEN);
    // 對應頂點同色：E ↔ A（藍）、B ↔ B（綠）、D ↔ C（芥末黃）
    dkPt(ctx, A, DK_BLUE, 5); dkPt(ctx, E, DK_BLUE, 5);
    dkPt(ctx, C, DK_MUSTARD, 5); dkPt(ctx, D, DK_MUSTARD, 5);
    dkPt(ctx, B, DK_GREEN, 5);
    dkName(ctx, A, 'A', DK_BLUE, -14, 12);
    dkName(ctx, B, 'B', DK_GREEN, 14, 12);
    dkName(ctx, C, 'C', DK_MUSTARD, -14, -6);
    dkName(ctx, D, 'D', DK_MUSTARD, -2, 18);
    dkName(ctx, E, 'E', DK_BLUE, 8, -16);
    dkTag(ctx, `[AB] = ${ab}`, (A.x + B.x) / 2 - 40, A.y + 40, DK_SEPIA, 13);
    dkTag(ctx, `[BD] = ${apR(bdq)}`, (D.x + B.x) / 2, A.y + 18, DK_ROSE, 13);
    dkTag(ctx, `[AC] = ${ac}`, A.x - 44, (A.y + C.y) / 2, DK_SEPIA, 13);
    const G = hbCentroid([A, B, C]);
    dkSideTag(ctx, C, E, G, `[BC] = ${bc}`, DK_SEPIA, 22, 13);

    dkRow(ctx, '∠B 共用，∠DEB = ∠A = 90° ⇒ △EBD ∼ △ABC（AA 相似）', 330, DK_OK, 15);
    dkRow(ctx, '對應：E ↔ A、B ↔ B、D ↔ C ⇒ [BD] 對應 [BC]（都是直角對面的斜邊）', 364, DK_SEPIA, 15);
    if (view === 'ok') {
      dkRow(ctx, `[BC] = √(${ab}² + ${ac}²) = ${bc}，[BD] = {${t[0]}/${t[1]}} × ${ab} = ${apR(bdq)}`, 404, DK_SEPIA, 15);
      dkRow(ctx, `面積比 = [BD]² : [BC]² = ${apSq(bdq)} : ${bc}² = ${ok[0]} : ${ok[1]}`, 444, DK_ROSE, 17);
      dkRow(ctx, `小三角形每一邊都是大三角形對應邊的 ${apR(k)} 倍：[BE] = ${apR(beq)}、[DE] = ${apR(deq)}`, 484, MUTED, 13.5);
    } else {
      dkRow(ctx, `✗ 小妍：[BD] 對 [AB] ⇒ 面積比 = ${apSq(bdq)} : ${ab}² = ${bad[0]} : ${bad[1]}`, 404, DK_NO, 16);
      dkRow(ctx, `✓ 正確：[BD] 對 [BC] ⇒ 面積比 = ${apSq(bdq)} : ${bc}² = ${ok[0]} : ${ok[1]}`, 444, DK_OK, 16);
      dkRow(ctx, '[AB] 對應的是 [BE]（都夾在 ∠B 與直角之間），不是 [BD]', 484, MUTED, 13.5);
    }

    out.innerHTML = wbrEq(`\\triangle EBD : \\triangle ABC = ${ok[0]} : ${ok[1]}`);
    fb.innerHTML = view === 'ok'
      ? wrapFeedback(`先由角找對應：\\(\\angle DEB = \\angle A = 90^\\circ\\)，所以 \\(E\\) 對 \\(A\\)、\\(D\\) 對 \\(C\\)。<br>\\(\\overline{BD}\\) 對 \\(\\overline{BC}\\)，邊長比 \\(${apT(bdq)} : ${bc}\\)，面積比是它的平方 \\(${ok[0]} : ${ok[1]}\\)。`)
      : wrapFeedback(`小妍看到 \\(\\overline{BD}\\) 在 \\(\\overline{AB}\\) 上，就拿它們來比，得到 \\(${bad[0]} : ${bad[1]}\\)。<br>但相似是照<strong>角</strong>對應的：\\(\\overline{BD}\\) 對著直角，要配 \\(\\triangle ABC\\) 裡也對著直角的 \\(\\overline{BC}\\)，正確答案是 \\(${ok[0]} : ${ok[1]}\\)。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('mt-tri-group'), 'data-mt-tri', v => { tri = parseInt(v, 10); draw(); });
  bindPickGroup(hbEl('mt-t-group'), 'data-mt-t', v => { tKey = v; draw(); });
  bindPickGroup(hbEl('mt-view-group'), 'data-mt-view', v => { view = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：三角形各邊中點連線段——一層一層往內
   ========================================================================== */
const AP_MID_P = [18, 30, 42, 54];
const AP_MID_S = [16, 48, 80, 112];
const AP_MID_NAMES = [['A', 'B', 'C'], ['D', 'E', 'F'], ['G', 'H', 'I'], ['J', 'K', 'L']];
const AP_MID_COL = [DK_IVORY, DK_GREEN, DK_MUSTARD, DK_ROSE];

function initMidCanvas() {
  const cv = hbEl('canvas-mid');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sn = hbEl('md-n'), sp = hbEl('md-p'), ss = hbEl('md-s'), sb = hbEl('md-b');
  const vn = hbEl('md-vn'), vp = hbEl('md-vp'), vs = hbEl('md-vs'), vb = hbEl('md-vb');
  const out = hbEl('md-formula'), fb = hbEl('md-feedback');
  const C6 = DK_TONE[6];

  function draw() {
    const W = cv.width;
    const n = hbClampSlider(sn, 1, 3);
    const P = AP_MID_P[hbClampSlider(sp, 0, AP_MID_P.length - 1)];
    const S = AP_MID_S[hbClampSlider(ss, 0, AP_MID_S.length - 1)];
    const angB = hbClampSlider(sb, 40, 80);
    vn.textContent = `${n} 層`;
    vp.textContent = P;
    vs.textContent = S;
    vb.textContent = `${angB}°`;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '連接三邊中點，再連一次……', C6);

    const T = dkTriAngles(1, angB, 55);
    const Vw = dkView([T.A, T.B, T.C], { x: 110, y: 58, w: 320, h: 222 });
    // 第 0 層：A、B、C；第 k 層的三個頂點依序是「對前一層第 1、2、3 個頂點的對邊中點」
    const levels = [[Vw.P(T.A), Vw.P(T.B), Vw.P(T.C)]];
    for (let i = 1; i <= n; i++) {
      const [X, Y, Z] = levels[i - 1];
      const mid = (U, Wp) => hbV((U.x + Wp.x) / 2, (U.y + Wp.y) / 2);
      // D 在 BC 上（對 A）、E 在 AC 上（對 B）、F 在 AB 上（對 C）
      levels.push([mid(Y, Z), mid(X, Z), mid(X, Y)]);
    }
    levels.forEach((L, i) => apTri(ctx, L, AP_MID_COL[i], i === 0 ? 0.06 : 0.2));
    levels.forEach((L, i) => {
      const col = AP_MID_COL[i];
      if (i === 0) { dkNames(ctx, L, AP_MID_NAMES[0], DK_IVORY); return; }
      // 中點的字放在上一層邊的外側一點點（往上一層的重心反方向）
      const G = hbCentroid(levels[i - 1]);
      L.forEach((p, j) => {
        dkPt(ctx, p, col, 3.5);
        const d = hbDist(p, G) || 1;
        const off = i === 1 ? 15 : 12;
        dkName(ctx, p, AP_MID_NAMES[i][j], col, (p.x - G.x) / d * off, (p.y - G.y) / d * off);
      });
    });

    const pn = qOf(P, Math.pow(2, n)), sArea = qOf(S, Math.pow(4, n));
    let sum = [0, 1];
    const sumParts = [];
    for (let i = 0; i <= n; i++) {
      const pi = qOf(P, Math.pow(2, i));
      sum = qAdd(sum, pi);
      sumParts.push(apR(pi));
    }
    const nm = AP_MID_NAMES[n].join('');
    dkRow(ctx, 'D、E、F 是三邊中點 ⇒ [EF] = {1/2}[BC]、[DF] = {1/2}[AC]、[DE] = {1/2}[AB]', 330, DK_SEPIA, 15);
    dkRow(ctx, '⇒ △DEF ∼ △ABC（SSS），邊長比 1 : 2 ⇒ 每往內一層：周長 × {1/2}、面積 × {1/4}', 364, DK_OK, 15);
    dkRow(ctx, `第 ${n} 層 △${nm}：周長 = ${P} × {1/${Math.pow(2, n)}} = ${apR(pn)}，面積 = ${S} × {1/${Math.pow(4, n)}} = ${apR(sArea)}`, 404, DK_ROSE, 16);
    dkRow(ctx, `畫出的所有線段總長 = ${sumParts.join(' + ')} = ${apR(sum)}`, 444, DK_ROSE, 16);
    dkRow(ctx, '面積不是 {1/2}：中點連線把三角形切成 4 個全等的小三角形', 484, MUTED, 13.5);

    out.innerHTML = `周長 ${wbrEq(`${P} \\times \\left(\\frac{1}{2}\\right)^{${n}} = ${apT(pn)}`)}，<wbr>面積 ${wbrEq(`${S} \\times \\left(\\frac{1}{4}\\right)^{${n}} = ${apT(sArea)}`)}`;
    fb.innerHTML = wrapFeedback(`\\(\\triangle ABC\\) 的周長 \\(${P}\\)、面積 \\(${S}\\)。每往內連一次中點，新三角形的邊長是上一層的 \\(\\frac{1}{2}\\)：周長乘 \\(\\frac{1}{2}\\)、面積乘 \\(\\frac{1}{4}\\)。<br>所有線段總長要把每一層的周長加起來：\\(${apT(sum)}\\)。`);
    typeset([out, fb]);
  }

  [sn, sp, ss, sb].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：坡度固定 ⇒ 直角三角形的形狀固定 ⇒ 任兩邊的比固定
   A 在左下、∠C = 90°：a = [BC]（高度差）、b = [AC]（水平長度）、c = [AB]（坡道）。
   小的那個固定 a' = 10，大的那個 a 由滑桿調。
   ========================================================================== */
const AP_SLOPES = [[1, 12], [1, 8], [1, 4], [3, 4]];

// a : b = r : u 的直角三角形，a/c、b/c 的文字（c 剛好是整數倍就寫分數）
function apSlopeRatios(r, u) {
  const c = hbRoot(r * r + u * u);
  if (c.exact) {
    const ac = qOf(r, c.k), bc = qOf(u, c.k);
    return { acTxt: `= ${apR(ac)}`, bcTxt: `= ${apR(bc)}`, acTex: `= ${apT(ac)}`, bcTex: `= ${apT(bc)}` };
  }
  const cv = Math.sqrt(r * r + u * u);
  const a3 = apFix(r / cv, 3), b3 = apFix(u / cv, 3);
  return { acTxt: `≒ ${a3}`, bcTxt: `≒ ${b3}`, acTex: `\\fallingdotseq ${a3}`, bcTex: `\\fallingdotseq ${b3}` };
}

function initSlopeCanvas() {
  const cv = hbEl('canvas-slope');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const shh = hbEl('sl-h'), vhh = hbEl('sl-vh');
  const out = hbEl('sl-formula'), fb = hbEl('sl-feedback');
  const C7 = DK_TONE[7];
  let si = 0;

  function draw() {
    const W = cv.width;
    const h = hbClampSlider(shh, 10, 60);
    vhh.textContent = `${h} 公分`;
    const [r, u] = AP_SLOPES[si];
    const bq = qOf(h * u, r), b0q = qOf(10 * u, r);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `坡度 ${r} : ${u} 的坡道：拉長、加高，形狀會變嗎？`, C7);

    const A0 = hbV(0, 0), C0m = hbV(qVal(bq), 0), B0 = hbV(qVal(bq), h);
    const C1 = hbV(qVal(b0q), 0), B1 = hbV(qVal(b0q), 10);
    const V = dkView([A0, B0, C0m, hbV(0, 0)], { x: 50, y: 74, w: 440, h: 196 });
    const A = V.P(A0), B = V.P(B0), C = V.P(C0m), Bs = V.P(B1), Cs = V.P(C1);

    apGround(ctx, 30, W - 30, A.y);
    apTri(ctx, [A, B, C], DK_GREEN, 0.16);
    apTri(ctx, [A, Bs, Cs], DK_RED, 0.3);
    hbSeg(ctx, Bs, Cs, DK_ROSE, 2.4);
    dkAng(ctx, A, C, B, 46, DK_MUSTARD);
    dkAng(ctx, C, A, B, 12, DK_GREEN);
    if (hbDist(Cs, Bs) > 16) dkAng(ctx, Cs, A, Bs, 9, DK_ROSE);
    dkName(ctx, A, 'A', DK_IVORY, -14, 6);
    dkName(ctx, B, 'B', DK_IVORY, 12, -6);
    dkName(ctx, C, 'C', DK_IVORY, 12, 14);
    dkName(ctx, Bs, "B'", DK_ROSE, -4, -16);
    dkName(ctx, Cs, "C'", DK_ROSE, -2, 18);
    dkTag(ctx, `a = ${h}`, B.x - 10, B.y - 24, DK_IVORY, 13);
    dkTag(ctx, `b = ${apR(bq)}`, (A.x + C.x) / 2 + 40, A.y + 36, DK_IVORY, 13);

    const R = apSlopeRatios(r, u);
    dkRow(ctx, `坡度 = {高度差/水平長度} = {${r}/${u}}：高度差 a = ${h} ⇒ 水平長度 b = ${h} × {${u}/${r}} = ${apR(bq)}`, 330, DK_SEPIA, 15);
    dkRow(ctx, `大的 △ABC：{a/b} = {${r}/${u}}，{a/c} ${R.acTxt}，{b/c} ${R.bcTxt}`, 368, DK_IVORY, 16);
    dkRow(ctx, `小的 △AB'C'（a' = 10）：{a'/b'} = {${r}/${u}}，{a'/c'} ${R.acTxt}，{b'/c'} ${R.bcTxt}`, 412, DK_ROSE, 16);
    dkRow(ctx, '∠A 一樣、∠C = 90° ⇒ 兩個直角三角形相似（AA）⇒ 任兩邊的比都一樣', 452, DK_OK, 15);
    dkRow(ctx, '換一個坡度（∠A 變了），這三個比值才會跟著變', 486, MUTED, 13.5);

    out.innerHTML = `\\(\\frac{a}{b} = \\frac{${r}}{${u}}\\)，<wbr>\\(\\frac{a}{c} ${R.acTex}\\)，<wbr>\\(\\frac{b}{c} ${R.bcTex}\\)`;
    fb.innerHTML = wrapFeedback(`坡度固定，\\(\\angle A\\) 就固定。坡道做得再長、再高，都和小的 \\(\\triangle AB'C'\\) 相似，所以 \\(\\frac{a}{b}\\)、\\(\\frac{a}{c}\\)、\\(\\frac{b}{c}\\) 都不會變。<br>高度差 \\(${h}\\) 公分要配水平長度 \\(${apT(bq)}\\) 公分。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('sl-k-group'), 'data-sl-k', v => { si = parseInt(v, 10); draw(); });
  shh.addEventListener('input', draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：對邊、鄰邊、斜邊與 sin、cos、tan
   直角頂點畫在右下 (q, 0)，A 在左下 (0, 0)，另一個頂點在右上 (q, p)。
   ========================================================================== */
const AP_TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];

function apSegName(u, v) {
  return u < v ? u + v : v + u;
}

function initTrigCanvas() {
  const cv = hbEl('canvas-trig');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const out = hbEl('tg-formula'), fb = hbEl('tg-feedback');
  const C8 = DK_TONE[8];
  let tri = 0, right = 'C', which = 'A';

  function draw() {
    const W = cv.width;
    const [p, q, r] = AP_TRIPLES[tri];
    const other = right === 'C' ? 'B' : 'C';          // 右上那個頂點
    const X = which === 'A' ? 'A' : other;            // 看的角
    const Y = X === 'A' ? other : 'A';                // 另一個銳角
    const pos = { A: hbV(0, 0) };
    pos[right] = hbV(q, 0);
    pos[other] = hbV(q, p);
    const len = {};
    len[apSegName('A', right)] = q;
    len[apSegName(right, other)] = p;
    len[apSegName('A', other)] = r;
    const opp = apSegName(right, Y), adj = apSegName(X, right), hyp = apSegName(X, Y);
    const o = len[opp], d = len[adj];
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `直角在 ${right}：站在 ∠${X} 看三邊`, C8);

    const V = dkView([pos.A, pos[right], pos[other]], { x: 90, y: 58, w: 360, h: 220 });
    const P = {};
    ['A', 'B', 'C'].forEach(k => { P[k] = V.P(pos[k]); });
    const G = hbCentroid([P.A, P.B, P.C]);
    apTri(ctx, [P.A, P.B, P.C], DK_IVORY, 0.06);
    const seg = (nm, col) => hbSeg(ctx, P[nm[0]], P[nm[1]], col, 5);
    seg(opp, DK_ROSE);
    seg(adj, DK_BLUE);
    seg(hyp, DK_MUSTARD);
    dkAng(ctx, P[right], P[X], P[Y], 16, DK_IVORY);
    dkAng(ctx, P[X], P[Y], P[right], 30, DK_GREEN, { alpha: 0.4 });
    dkNames(ctx, [P.A, P.B, P.C], ['A', 'B', 'C'], DK_IVORY);
    const tag = (nm, word, col) => dkSideTag(ctx, P[nm[0]], P[nm[1]], G, `${word} ${len[nm]}`, col, 26, 14);
    tag(opp, '對邊', DK_ROSE);
    tag(adj, '鄰邊', DK_BLUE);
    tag(hyp, '斜邊', DK_MUSTARD);

    dkRich(ctx, [[`看 ∠${X}：`, DK_SEPIA], [`對邊 [${opp}] = ${o}`, DK_ROSE], ['、', DK_SEPIA],
                 [`鄰邊 [${adj}] = ${d}`, DK_BLUE], ['、', DK_SEPIA], [`斜邊 [${hyp}] = ${r}`, DK_MUSTARD]], W / 2, 330, 15);
    dkRow(ctx, `sin ${X} = {對邊/斜邊} = {${o}/${r}}`, 368, DK_ROSE, 17);
    dkRow(ctx, `cos ${X} = {鄰邊/斜邊} = {${d}/${r}}`, 412, DK_BLUE, 17);
    dkRow(ctx, `tan ${X} = {對邊/鄰邊} = {${o}/${d}}`, 456, DK_OK, 17);
    dkRow(ctx, '斜邊永遠是直角的對邊；對邊、鄰邊要看站在哪一個角', 490, MUTED, 13.5);

    out.innerHTML = `\\(\\sin ${X} = \\frac{${o}}{${r}}\\)，<wbr>\\(\\cos ${X} = \\frac{${d}}{${r}}\\)，<wbr>\\(\\tan ${X} = \\frac{${o}}{${d}}\\)`;
    fb.innerHTML = wrapFeedback(`直角在 \\(${right}\\)，斜邊是 \\(\\overline{${hyp}}\\)。站在 \\(\\angle ${X}\\)：不碰到 \\(${X}\\) 的那一股 \\(\\overline{${opp}}\\) 是對邊，夾著 \\(\\angle ${X}\\) 的那一股 \\(\\overline{${adj}}\\) 是鄰邊。<br>換站到 \\(\\angle ${Y}\\)，對邊和鄰邊就互換。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('tg-tri-group'), 'data-tg-tri', v => { tri = parseInt(v, 10); draw(); });
  bindPickGroup(hbEl('tg-right-group'), 'data-tg-right', v => { right = v; draw(); });
  bindPickGroup(hbEl('tg-ang-group'), 'data-tg-ang', v => { which = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：用三角比的近似值解生活問題（坡道）
   A 在左下、∠B = 90°：[AB] 水平、[BC] 鉛垂、[AC] 坡道。
   近似值一律取到小數第 4 位，用整數運算：L × (萬分之 v)。
   ========================================================================== */
const AP_ROAD = {
  sin: { title: '已知坡道長，求垂直高度', given: 'AC', want: 'BC', fn: 'sin', word: '{對邊/斜邊}' },
  cos: { title: '已知坡道長，求水平距離', given: 'AC', want: 'AB', fn: 'cos', word: '{鄰邊/斜邊}' },
  tan: { title: '已知水平距離，求垂直高度', given: 'AB', want: 'BC', fn: 'tan', word: '{對邊/鄰邊}' }
};

// 三角比取到小數第 4 位（整數：萬分之幾）
function apTrig4(fn, deg) {
  const x = deg * Math.PI / 180;
  const v = fn === 'sin' ? Math.sin(x) : (fn === 'cos' ? Math.cos(x) : Math.tan(x));
  return Math.round(v * 10000);
}

function initRoadCanvas() {
  const cv = hbEl('canvas-road');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const st = hbEl('rd-ang'), sl = hbEl('rd-len'), vt = hbEl('rd-vang'), vl = hbEl('rd-vlen');
  const out = hbEl('rd-formula'), fb = hbEl('rd-feedback');
  const C9 = DK_TONE[9];
  let mode = 'sin';

  function draw() {
    const W = cv.width;
    const t = hbClampSlider(st, 3, 20), L = hbClampSlider(sl, 200, 1500);
    vt.textContent = `${t}°`;
    vl.textContent = `${L} 公尺`;
    const M = AP_ROAD[mode];
    const v = apTrig4(M.fn, t);
    const prod = L * v;                               // 單位：萬分之一公尺
    const prodS = apDecStr(qOf(prod, 10000));
    const round0 = Math.floor((prod + 5000) / 10000);
    const t4 = fn => (apTrig4(fn, t) / 10000).toFixed(4);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, M.title, C9);

    const rad = t * Math.PI / 180;
    const hyp = mode === 'tan' ? L / Math.cos(rad) : L;
    const A0 = hbV(0, 0), B0 = hbV(hyp * Math.cos(rad), 0), C0m = hbV(hyp * Math.cos(rad), hyp * Math.sin(rad));
    const V = dkView([A0, B0, C0m], { x: 46, y: 70, w: 440, h: 190 });
    const A = V.P(A0), B = V.P(B0), C = V.P(C0m);
    apGround(ctx, 26, W - 26, A.y);
    apTri(ctx, [A, B, C], DK_GREEN, 0.18);
    const SEG = { AB: [A, B], BC: [B, C], AC: [A, C] };
    hbSeg(ctx, SEG[M.given][0], SEG[M.given][1], DK_IVORY, 4);
    hbSeg(ctx, SEG[M.want][0], SEG[M.want][1], DK_ROSE, 4, [7, 5]);
    dkAng(ctx, A, B, C, 70, DK_MUSTARD, { label: `${t}°`, lr: 96, font: f(800, 14) });
    dkAng(ctx, B, A, C, 12, DK_IVORY);
    dkPt(ctx, C, DK_MUSTARD, 5);
    dkName(ctx, A, 'A', DK_IVORY, -14, 6);
    dkName(ctx, B, 'B', DK_IVORY, 12, 14);
    dkName(ctx, C, 'C', DK_IVORY, 14, -8);
    const G = hbCentroid([A, B, C]);
    dkSideTag(ctx, SEG[M.given][0], SEG[M.given][1], G, `[${M.given}] = ${L}`, DK_IVORY, 22, 13);
    dkSideTag(ctx, SEG[M.want][0], SEG[M.want][1], G, `[${M.want}] = ?`, DK_ROSE, 26, 13);

    dkRow(ctx, `sin ${t}° ≒ ${t4('sin')}、cos ${t}° ≒ ${t4('cos')}、tan ${t}° ≒ ${t4('tan')}`, 330, DK_SEPIA, 15);
    dkRow(ctx, `${M.fn} A = ${M.word} ⇒ [${M.want}] = [${M.given}] × ${M.fn} ${t}°`, 368, DK_IVORY, 16);
    dkRow(ctx, `[${M.want}] ≒ ${L} × ${t4(M.fn)} = ${prodS}`, 410, DK_ROSE, 18);
    dkRow(ctx, `≒ ${round0}（公尺，四捨五入到整數）`, 450, DK_ROSE, 18);
    dkRow(ctx, '表上的值本來就是近似值，算出來的長度要寫「≒」', 486, MUTED, 13.5);

    out.innerHTML = wbrEq(`\\overline{${M.want}} \\fallingdotseq ${L} \\times ${t4(M.fn)} = ${prodS} \\fallingdotseq ${round0}`);
    fb.innerHTML = wrapFeedback(`\\(${t}^\\circ\\) 的直角三角形不管多大都相似，所以「${M.fn === 'tan' ? '對邊比鄰邊' : (M.fn === 'sin' ? '對邊比斜邊' : '鄰邊比斜邊')}」固定是 \\(\\${M.fn} ${t}^\\circ \\fallingdotseq ${t4(M.fn)}\\)。<br>已知 \\(\\overline{${M.given}} = ${L}\\)，乘上這個比值，就得到 \\(\\overline{${M.want}} \\fallingdotseq ${round0}\\) 公尺。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('rd-mode-group'), 'data-rd-mode', v => { mode = v; draw(); });
  [st, sl].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 11：特殊直角三角形的邊長比（45°-45°-90°、30°-60°-90°）
   A 在左下、∠C = 90°（右下）、B 在右上。30°-60°-90° 取 ∠A = 30°。
   ========================================================================== */
const AP_ONE = { c: [1, 1], r: 1 }, AP_TWO = { c: [2, 1], r: 1 };
const AP_RT2 = { c: [1, 1], r: 2 }, AP_RT3 = { c: [1, 1], r: 3 };
// 各邊對應比例的哪一份
const AP_SP = {
  '45': { BC: AP_ONE, AC: AP_ONE, AB: AP_RT2 },
  '30': { BC: AP_ONE, AC: AP_RT3, AB: AP_TWO }
};
const AP_SP_KNOWN = {
  '45': { leg: 'BC', hyp: 'AB' },
  '30': { short: 'BC', long: 'AC', hyp: 'AB' }
};
const AP_SP_WORD = { leg: '股', hyp: '斜邊', short: '短股（30° 的對邊）', long: '長股（60° 的對邊）' };

function initSpecialCanvas() {
  const cv = hbEl('canvas-special');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sv = hbEl('sp-v'), vv = hbEl('sp-vv');
  const out = hbEl('sp-formula'), fb = hbEl('sp-feedback');
  const C10 = DK_TONE[10];
  let mode = '45', k45 = 'leg', k30 = 'short';

  function draw() {
    const W = cv.width;
    const v = hbClampSlider(sv, 2, 12);
    vv.textContent = v;
    dkShow(['sp-row-k45'], mode === '45');
    dkShow(['sp-row-k30'], mode === '30');
    const key = mode === '45' ? k45 : k30;
    const known = AP_SP_KNOWN[mode][key];
    const R = AP_SP[mode];
    const unit = apSDiv({ c: [v, 1], r: 1 }, R[known]);
    const side = {};
    ['BC', 'AC', 'AB'].forEach(s => { side[s] = apSMul(unit, R[s]); });
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === '45' ? '45°-45°-90° 三角形：已知一邊，求另兩邊' : '30°-60°-90° 三角形：已知一邊，求另兩邊', C10);

    const A0 = hbV(0, 0), C0m = hbV(mode === '45' ? 1 : Math.sqrt(3), 0), B0 = hbV(C0m.x, 1);
    const V = dkView([A0, B0, C0m], { x: 130, y: 60, w: 270, h: 196 });
    const A = V.P(A0), B = V.P(B0), C = V.P(C0m);
    const G = hbCentroid([A, B, C]);
    apTri(ctx, [A, B, C], DK_GREEN, 0.14);
    const SEG = { AB: [A, B], BC: [B, C], AC: [A, C] };
    hbSeg(ctx, SEG[known][0], SEG[known][1], DK_ROSE, 4.5);
    dkAng(ctx, C, A, B, 14, DK_IVORY);
    dkAng(ctx, A, C, B, 34, DK_MUSTARD, { label: mode === '45' ? '45°' : '30°', lr: 52, font: f(800, 14) });
    dkAng(ctx, B, A, C, 26, DK_BLUE, { label: mode === '45' ? '45°' : '60°', lr: 44, font: f(800, 14) });
    dkNames(ctx, [A, B, C], ['A', 'B', 'C'], DK_IVORY);
    ['BC', 'AC', 'AB'].forEach(s => {
      const col = s === known ? DK_ROSE : DK_IVORY;
      dkSideTag(ctx, SEG[s][0], SEG[s][1], G, `${apSTxt(side[s])}（${apSTxt(R[s])} 份）`, col, s === 'BC' ? 52 : 24, 14);
    });

    const eTxt = apSTxt(R[known]);
    if (mode === '45') {
      dkRow(ctx, '45°-45°-90°：[AC] : [BC] : [AB] = 1 : 1 : √2', 330, DK_SEPIA, 16);
    } else {
      dkRow(ctx, '30°-60°-90°：[BC] : [AC] : [AB] = 1 : √3 : 2（30° 對 1、60° 對 √3、90° 對 2）', 330, DK_SEPIA, 15);
    }
    dkRow(ctx, `已知${AP_SP_WORD[key]} [${known}] = ${v}，它是比例裡的「${eTxt}」那一份`, 366, DK_ROSE, 15);
    dkRow(ctx, R[known].r === 1 && R[known].c[0] === 1 ? `1 份 = ${v}` : `1 份 = {${v}/${eTxt}} = ${apSTxt(unit)}`, 406, DK_ROSE, 17);
    if (mode === '45') {
      dkRow(ctx, `[AC] = [BC] = ${apSTxt(side.BC)}，[AB] = ${apSTxt(side.AB)}`, 448, DK_OK, 17);
    } else {
      dkRow(ctx, `[BC] = ${apSTxt(side.BC)}、[AC] = ${apSTxt(side.AC)}、[AB] = ${apSTxt(side.AB)}`, 448, DK_OK, 17);
    }
    dkRow(ctx, '先看已知邊對到比例的哪一份，算出「1 份」，再乘回去', 486, MUTED, 13.5);

    out.innerHTML = ['BC', 'AC', 'AB'].map(s => `\\(\\overline{${s}} = ${apSTex(side[s])}\\)`).join('，<wbr>');
    fb.innerHTML = wrapFeedback(mode === '45'
      ? `等腰直角三角形兩股一樣長，斜邊是股的 \\(\\sqrt{2}\\) 倍。已知 \\(\\overline{${known}} = ${v}\\)：\\(\\overline{AC} = \\overline{BC} = ${apSTex(side.BC)}\\)、\\(\\overline{AB} = ${apSTex(side.AB)}\\)。`
      : `最短的邊對著 \\(30^\\circ\\)、斜邊是它的 2 倍、長股是它的 \\(\\sqrt{3}\\) 倍。已知 \\(\\overline{${known}} = ${v}\\)：\\(\\overline{BC} = ${apSTex(side.BC)}\\)、\\(\\overline{AC} = ${apSTex(side.AC)}\\)、\\(\\overline{AB} = ${apSTex(side.AB)}\\)。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('sp-mode-group'), 'data-sp-mode', v => { mode = v; draw(); });
  bindPickGroup(hbEl('sp-k45-group'), 'data-sp-k45', v => { k45 = v; draw(); });
  bindPickGroup(hbEl('sp-k30-group'), 'data-sp-k30', v => { k30 = v; draw(); });
  sv.addEventListener('input', draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 12：特殊直角三角形的生活問題（先求精確值，最後才取近似值）
   ========================================================================== */
const AP_LIFE = {
  flag: { min: 6, max: 20, step: 1, def: 12, den: 1, ang: 45, given: 'BC',
          title: '校慶三角旗：從頂樓拉到地面', what: '校舍高 [BC]' },
  esc: { min: 24, max: 60, step: 3, def: 42, den: 10, ang: 30, given: 'BC',
         title: '商場電扶梯：一樓到二樓', what: '樓層高度差 [BC]' },
  skate: { min: 3, max: 12, step: 1, def: 6, den: 1, ang: 30, given: 'AC',
           title: '滑板拋臺：斜面有多長', what: '下滑的水平距離 [AC]' }
};

function initLifeCanvas() {
  const cv = hbEl('canvas-life');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sv = hbEl('lf-v'), vv = hbEl('lf-vv');
  const out = hbEl('lf-formula'), fb = hbEl('lf-feedback');
  const C11 = DK_TONE[11];
  let cs = 'flag';

  function setCase(c) {
    cs = c;
    const L = AP_LIFE[c];
    sv.min = L.min; sv.max = L.max; sv.step = L.step; sv.value = L.def;
  }

  function draw() {
    const W = cv.width;
    const L = AP_LIFE[cs];
    let raw = hbClampSlider(sv, L.min, L.max);
    raw = L.min + Math.round((raw - L.min) / L.step) * L.step;
    const gq = qOf(raw, L.den);
    vv.textContent = `${apR(gq)} 公尺`;
    let exactTxt, exactTex, val, ratioTxt, stepTxt;
    if (cs === 'flag') {
      const s = apS(gq, 2);
      exactTxt = apSTxt(s); exactTex = apSTex(s); val = apSVal(s);
      ratioTxt = '45°-45°-90° ⇒ [BC] : [AB] = 1 : √2';
      stepTxt = `[AB] = ${apR(gq)} × √2 = ${exactTxt}`;
    } else if (cs === 'esc') {
      const ab = qMul(gq, [2, 1]);
      exactTxt = apR(ab); exactTex = apT(ab); val = qVal(ab);
      ratioTxt = '30°-60°-90° ⇒ [BC] : [AB] = 1 : 2';
      stepTxt = `[AB] = 2 × ${apR(gq)} = ${exactTxt}`;
    } else {
      const s = apSDiv({ c: qMul(gq, [2, 1]), r: 1 }, AP_RT3);
      exactTxt = apSTxt(s); exactTex = apSTex(s); val = apSVal(s);
      ratioTxt = '30°-60°-90° ⇒ [AC] : [AB] = √3 : 2';
      stepTxt = `[AB] = ${apR(gq)} × {2/√3} = ${exactTxt}`;
    }
    const exactIsDec = cs === 'esc';
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, L.title, C11);

    const rad = L.ang * Math.PI / 180;
    const A0 = hbV(0, 0), C0m = hbV(Math.cos(rad), 0), B0 = hbV(Math.cos(rad), Math.sin(rad));
    const V = dkView([A0, B0, C0m], { x: 100, y: 64, w: 330, h: 196 });
    const A = V.P(A0), B = V.P(B0), C = V.P(C0m);
    apGround(ctx, 40, W - 40, A.y);
    if (cs === 'flag') {
      // 校舍：BC 是牆
      ctx.save();
      ctx.fillStyle = 'rgba(217, 179, 140, 0.18)';
      ctx.fillRect(C.x, B.y, 70, C.y - B.y);
      ctx.restore();
      hbSeg(ctx, B, hbV(B.x + 70, B.y), DK_SEPIA, 2);
      hbSeg(ctx, hbV(B.x + 70, B.y), hbV(C.x + 70, C.y), DK_SEPIA, 2);
      // 三角旗：沿著 AB 一面一面掛
      for (let i = 1; i < 9; i++) {
        const t = i / 9, P = hbV(A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t);
        const Q = hbV(A.x + (B.x - A.x) * (t + 0.05), A.y + (B.y - A.y) * (t + 0.05));
        ctx.save();
        ctx.fillStyle = [DK_RED, DK_MUSTARD, DK_BLUE][i % 3];
        ctx.beginPath();
        ctx.moveTo(P.x, P.y); ctx.lineTo(Q.x, Q.y); ctx.lineTo((P.x + Q.x) / 2, (P.y + Q.y) / 2 + 14);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    } else if (cs === 'esc') {
      hbSeg(ctx, hbV(A.x + 6, A.y - 16), hbV(B.x + 6, B.y - 16), DK_SEPIA, 2);
      hbSeg(ctx, B, hbV(W - 40, B.y), DK_SEPIA, 2.6);
    } else {
      ctx.save();
      ctx.fillStyle = 'rgba(217, 179, 140, 0.16)';
      ctx.beginPath();
      ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(B.x + 40, B.y); ctx.lineTo(C.x + 40, C.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    apTri(ctx, [A, B, C], DK_GREEN, 0.12);
    const SEG = { AB: [A, B], BC: [B, C], AC: [A, C] };
    hbSeg(ctx, SEG[L.given][0], SEG[L.given][1], DK_IVORY, 4);
    hbSeg(ctx, A, B, DK_ROSE, 3.4, [8, 5]);
    dkAng(ctx, C, A, B, 13, DK_IVORY);
    dkAng(ctx, A, C, B, 46, DK_MUSTARD, { label: `${L.ang}°`, lr: 66, font: f(800, 14) });
    dkNames(ctx, [A, B, C], ['A', 'B', 'C'], DK_IVORY);
    const G = hbCentroid([A, B, C]);
    dkSideTag(ctx, SEG[L.given][0], SEG[L.given][1], G, apR(gq), DK_IVORY, 24, 14);
    dkSideTag(ctx, A, B, G, '[AB] = ?', DK_ROSE, 24, 14);

    dkRow(ctx, `∠A = ${L.ang}°，${L.what} = ${apR(gq)} 公尺，求 [AB]`, 330, DK_SEPIA, 15);
    dkRow(ctx, ratioTxt, 366, DK_OK, 16);
    dkRow(ctx, stepTxt, 406, DK_ROSE, 17);
    dkRow(ctx, exactIsDec ? `[AB] = ${exactTxt}（公尺，剛好是有限小數，不必取近似值）` : `[AB] ≒ ${apFix(val, 2)}（公尺，四捨五入到小數第 2 位）`, 446, DK_ROSE, 16);
    dkRow(ctx, '精確值先算出來，最後一步才用計算機取近似值', 486, MUTED, 13.5);

    out.innerHTML = exactIsDec
      ? `\\(\\overline{AB} = ${exactTex}\\)`
      : wbrEq(`\\overline{AB} = ${exactTex} \\fallingdotseq ${apFix(val, 2)}`);
    fb.innerHTML = wrapFeedback(`先認出這是 \\(${L.ang}^\\circ\\) 的直角三角形，再看已知的 \\(\\overline{${L.given}}\\) 和要求的 \\(\\overline{AB}\\)（斜邊）在比例裡各是哪一份。<br>${exactIsDec ? `斜邊是 \\(30^\\circ\\) 對邊的 2 倍：\\(\\overline{AB} = ${exactTex}\\) 公尺。` : `精確值 \\(\\overline{AB} = ${exactTex}\\)，用計算機取到小數第 2 位約 \\(${apFix(val, 2)}\\) 公尺。`}`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('lf-case-group'), 'data-lf-case', v => { setCase(v); draw(); });
  sv.addEventListener('input', draw);
  setCase('flag');
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 13：在兩個地方測仰角，求山高
   C 是山頂 D 正下方的地面點；A 的仰角較小（離山較遠）。
   [AC] = x × cot∠A、[BC] = x × cot∠B；cot 30° = √3、cot 45° = 1、cot 60° = 1/√3。
   ========================================================================== */
const AP_COT = {
  30: apR3([0, 1], [1, 1]),
  45: apR3([1, 1], [0, 1]),
  60: apR3([0, 1], [1, 3])
};
const AP_COT_TXT = { 30: '√3 × x', 45: 'x', 60: '{x/√3}' };
const AP_COT_TEX = { 30: '\\sqrt{3}x', 45: 'x', 60: '\\frac{x}{\\sqrt{3}}' };
const AP_MO_PAIRS = { '30-60': [30, 60], '45-60': [45, 60] };

// 兩個仰角求高：同側 [AC] − [BC] = d，兩側 [AC] + [BC] = d
function apMountX(side, al, be, d) {
  const ca = AP_COT[al], cb = AP_COT[be];
  const den = side === 'same'
    ? apR3(qSub(ca.p, cb.p), qSub(ca.q, cb.q))
    : apR3(qAdd(ca.p, cb.p), qAdd(ca.q, cb.q));
  return apR3Inv([d, 1], den);
}

function initMountCanvas() {
  const cv = hbEl('canvas-mount');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sd = hbEl('mo-d'), vd = hbEl('mo-vd');
  const out = hbEl('mo-formula'), fb = hbEl('mo-feedback');
  const C12 = DK_TONE[12];
  let side = 'same', pairKey = '30-60';

  function draw() {
    const W = cv.width;
    const d = hbClampSlider(sd, 100, 600);
    vd.textContent = `${d} 公尺`;
    const [al, be] = AP_MO_PAIRS[pairKey];
    const x = apMountX(side, al, be, d);
    const xv = apR3Val(x);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, side === 'same' ? '同一側測兩次仰角：山有多高？' : '山的兩側各測一次仰角：山有多高？', C12);

    const cot = deg => 1 / Math.tan(deg * Math.PI / 180);
    const C0m = hbV(0, 0), D0 = hbV(0, xv);
    const A0 = hbV(-xv * cot(al), 0);
    const B0 = side === 'same' ? hbV(-xv * cot(be), 0) : hbV(xv * cot(be), 0);
    const ext = [A0, B0, C0m, D0, hbV(Math.max(B0.x, 0) + xv * 0.45, 0)];
    const V = dkView(ext, { x: 40, y: 64, w: 460, h: 200 });
    const A = V.P(A0), B = V.P(B0), C = V.P(C0m), D = V.P(D0);
    const wHill = hbDist(D, C) * 0.75;

    // 山：山頂在 D，C 在 D 的正下方
    ctx.save();
    ctx.fillStyle = 'rgba(95, 191, 143, 0.16)';
    ctx.strokeStyle = 'rgba(95, 191, 143, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(C.x - wHill, C.y);
    ctx.quadraticCurveTo(C.x - wHill * 0.35, D.y + 20, D.x, D.y);
    ctx.quadraticCurveTo(C.x + wHill * 0.35, D.y + 20, C.x + wHill, C.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    apGround(ctx, 26, W - 26, C.y);
    hbSeg(ctx, C, D, DK_IVORY, 2.4, [6, 5]);
    apRay(ctx, A, D);
    apRay(ctx, B, D);
    dkAng(ctx, C, A, D, 12, DK_IVORY);
    dkAng(ctx, A, C, D, 44, DK_BLUE, { label: `${al}°`, lr: 62, font: f(800, 14) });
    if (side === 'same') {
      dkAng(ctx, B, C, D, 34, DK_MUSTARD, { label: `${be}°`, lr: 52, font: f(800, 14) });
    } else {
      dkAng(ctx, B, D, C, 34, DK_MUSTARD, { label: `${be}°`, lr: 52, font: f(800, 14) });
    }
    [A, B, C, D].forEach(p => dkPt(ctx, p, DK_IVORY, 4));
    dkName(ctx, A, 'A', DK_IVORY, -4, 18);
    dkName(ctx, B, 'B', DK_IVORY, side === 'same' ? -4 : 4, 18);
    dkName(ctx, C, 'C', DK_IVORY, 12, 16);
    dkName(ctx, D, 'D', DK_IVORY, 0, -16);
    dkTag(ctx, `[AB] = ${d}`, (A.x + B.x) / 2, C.y + 40, DK_ROSE, 13);
    dkTag(ctx, 'x', D.x + 18, (C.y + D.y) / 2, DK_ROSE, 15);

    const op = side === 'same' ? '−' : '+', opTex = side === 'same' ? '-' : '+';
    dkRow(ctx, `設山高 [CD] = x：∠A = ${al}° ⇒ [AC] = ${AP_COT_TXT[al]}；∠B = ${be}° ⇒ [BC] = ${AP_COT_TXT[be]}`, 330, DK_SEPIA, 15);
    dkRow(ctx, side === 'same' ? 'A、B 在山的同一側 ⇒ [AC] − [BC] = [AB]' : 'A、B 在山的兩側 ⇒ [AC] + [BC] = [AB]', 366, DK_OK, 15);
    dkRow(ctx, `${AP_COT_TXT[al]} ${op} ${AP_COT_TXT[be]} = ${d}`, 406, DK_ROSE, 18);
    dkRow(ctx, `x = ${apR3Txt(x)} ≒ ${apFix(xv, 2)}（公尺）`, 446, DK_ROSE, 18);
    dkRow(ctx, '兩個直角三角形共用高 [CD]：先把 [AC]、[BC] 都用 x 表示', 486, MUTED, 13.5);

    out.innerHTML = wbrEq(`${AP_COT_TEX[al]} ${opTex} ${AP_COT_TEX[be]} = ${d}`) + '，<wbr>'
      + wbrEq(`x = ${apR3Tex(x)} \\fallingdotseq ${apFix(xv, 2)}`);
    fb.innerHTML = wrapFeedback(`\\(\\triangle ACD\\) 和 \\(\\triangle BCD\\) 都是特殊直角三角形，而且共用山高 \\(\\overline{CD} = x\\)。<br>用 \\(x\\) 寫出 \\(\\overline{AC}\\)、\\(\\overline{BC}\\)，再由 \\(\\overline{AB} = ${d}\\) 列方程式：${side === 'same' ? '同一側要相減' : '兩側要相加'}。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('mo-side-group'), 'data-mo-side', v => { side = v; draw(); });
  bindPickGroup(hbEl('mo-pair-group'), 'data-mo-pair', v => { pairKey = v; draw(); });
  sd.addEventListener('input', draw);
  drawWithFonts(draw);
}
