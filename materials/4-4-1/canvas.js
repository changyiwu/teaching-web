/* ==========================================================================
   4-4-1（第四冊 4-1）平行 — 互動 Canvas 與隨堂評量
   畫風：復古琺瑯道路標誌・道路標線工班（小線、阿平），第 4 章三節共用。

   共用工具在 ../math-canvas.js（f／fi／drawTitle／textCenter／drawExpr／
   exprItems／drawStepRows／wrapFeedback／wbrEq／typeset／bindPickGroup／
   drawWithFonts…），幾何用同檔的 hb*（數學方向角、y 朝上）與 cg*
   （兩圓交點、弧、描邊標籤、圓規直尺的逐步播放引擎）。

   本檔分三層：
     0. 本節色票（RD_ 前綴；共用檔沒有這個前綴）；
     1. 本節工具（pl 前綴）：兩直線被截線所截的八個角、直線與標籤；
     2. 11 個互動與評量附圖。

   八個截角的編號一律照課本圖 4：
     截線與 L1 的交點：1 左上、2 右上、3 左下、4 右下；
     截線與 L2 的交點：5 左上、6 右上、7 左下、8 右下。
   「上」是截線往上走的那一側。每個角的度數都由直線的方向實算（開發約束 27）。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();
  drawWithFonts(initQuizFigs);

  initDefCanvas();
  initPropCanvas();
  initDistCanvas();
  initNameCanvas();
  initCutCanvas();
  initEqCanvas();
  initMultiCanvas();
  initBendCanvas();
  initJudgeCanvas();
  initBisCanvas();
  initBuildCanvas();
});

/* ==========================================================================
   0. 本節色票（道路標線：標線黃、標線白、琺瑯藍、警示紅）
   ========================================================================== */

const RD_YELLOW = '#f4c430';
const RD_WHITE = '#f1f1ec';
const RD_BLUE = '#2f6bb3';      // 琺瑯藍（只當填色；線與字用下面的亮版）
const RD_SKY = '#8cbcf0';       // 琺瑯藍的亮版，深色底上才讀得到
const RD_RED = '#d64933';       // 警示紅（只當填色）
const RD_CORAL = '#f2836b';     // 警示紅的亮版
const RD_OK = '#86efac';
const RD_NO = '#fb7185';
const RD_FAINT = 'rgba(241, 241, 236, 0.32)';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const RD_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9'];

// 尺規播放引擎的配色（共用檔的 cgUsePalette）
cgUsePalette({
  ink: RD_WHITE, honey: RD_YELLOW, brass: '#e5b53a', brassDk: '#8a6512',
  tools: { compass: RD_YELLOW, ruler: RD_SKY, look: RD_OK, warn: RD_CORAL }
});

/* ==========================================================================
   1. 本節工具（pl 前綴）
   ========================================================================== */

// 直線方向 a、截線往上的方向 t（數學角，度）：回傳四個角 [1 左上, 2 右上, 3 左下, 4 右下]
//   每個角是 { a0：起始方向, sw：掃過的度數 }，sw 就是那個角的度數
function plAngles(a, t) {
  const s = (((t - a) % 180) + 180) % 180;
  const tt = a + s;
  return [
    { a0: tt, sw: 180 - s },
    { a0: a, sw: s },
    { a0: a + 180, sw: s },
    { a0: tt + 180, sw: 180 - s }
  ];
}

function plSector(ctx, V, sec, r, color, o) {
  const opt = Object.assign({ right: Math.abs(sec.sw - 90) < 1e-6 }, o || {});
  hbSector(ctx, V, sec.a0, sec.sw, r, color, opt);
}

// 角的平分方向上、距頂點 d 的點
function plIn(V, sec, d) {
  return hbAt(V, sec.a0 + sec.sw / 2, d);
}

// 度數字串：整數不留小數點，其餘一位
function plDeg(v) {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

function plInside(P, box) {
  return P.x >= box.x && P.x <= box.x + box.w && P.y >= box.y && P.y <= box.y + box.h;
}

// 只在 box 裡畫（直線畫很長，靠裁切收邊）
function plClip(ctx, box, fn) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  fn();
  ctx.restore();
}

// 過 P、方向 deg 的整條直線
function plLine(ctx, P, deg, color, w, dash) {
  const u = hbUnit(deg);
  hbSeg(ctx, hbV(P.x - u.x * 1400, P.y - u.y * 1400), hbV(P.x + u.x * 1400, P.y + u.y * 1400), color, w || 3, dash);
}

// 從 P 沿 deg 走到 box 邊緣（內縮 m）的點
function plEndIn(P, deg, box, m) {
  const u = hbUnit(deg);
  const x0 = box.x + m, x1 = box.x + box.w - m, y0 = box.y + m, y1 = box.y + box.h - m;
  let s = 4000;
  if (u.x > 1e-9) s = Math.min(s, (x1 - P.x) / u.x);
  else if (u.x < -1e-9) s = Math.min(s, (x0 - P.x) / u.x);
  if (u.y > 1e-9) s = Math.min(s, (y1 - P.y) / u.y);
  else if (u.y < -1e-9) s = Math.min(s, (y0 - P.y) / u.y);
  return hbV(P.x + u.x * s, P.y + u.y * s);
}

// 直線名稱牌：斜體字母加下標，墊一塊深色底讓它壓在線上也讀得到
function plTag(ctx, p, base, idx, color, size) {
  const s = size || 17;
  const it = idx ? SEQ([IT(base, color), SB(idx, color)], color, 0) : IT(base, color);
  const w = measure(ctx, it, s).w;
  ctx.save();
  ctx.fillStyle = 'rgba(20, 22, 27, 0.86)';
  roundRect(ctx, p.x - w / 2 - 5, p.y - s * 0.72, w + 10, s * 1.44, 6);
  ctx.fill();
  ctx.restore();
  drawIt(ctx, it, p.x - w / 2, p.y, s, color);
}

// 名稱牌放在直線靠 box 邊緣的那一端，往法向推開 off
function plLineTag(ctx, P, deg, box, base, idx, color, off) {
  const e = plEndIn(P, deg, box, 24);
  const n = hbUnit(deg + 90);
  const k = off == null ? 16 : off;
  plTag(ctx, hbV(e.x + n.x * k, e.y + n.y * k), base, idx, color);
}

// 平行記號：直線上的小箭頭（一條線上 n 個）
function plParMark(ctx, P, deg, color, n) {
  const u = hbUnit(deg), v = hbUnit(deg + 90);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < (n || 1); i++) {
    const c = hbV(P.x + u.x * i * 8, P.y + u.y * i * 8);
    ctx.beginPath();
    ctx.moveTo(c.x - u.x * 8 + v.x * 6, c.y - u.y * 8 + v.y * 6);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(c.x - u.x * 8 - v.x * 6, c.y - u.y * 8 - v.y * 6);
    ctx.stroke();
  }
  ctx.restore();
}

// 一行算式風格的字（英文字母自動斜體、L_1 有下標），置中、太寬自動縮
function plX(ctx, str, y, color, size, slots) {
  const W = ctx.canvas.width;
  return drawExpr(ctx, exprItems(str, color, slots), W / 2, y, size || 16, color, { maxW: W - 28, gap: 0 });
}

// 圖上的算式標籤：深色底＋算式（例：(2x + 20)°）
//   dir：靠近端的方向（1 往右長、-1 往左長、0 置中），標籤才不會壓在截線上
function plExprTag(ctx, p0, str, color, size, slots, dir) {
  const s = size || 15;
  const it = exprSeq(str, color, slots);
  const m = measure(ctx, it, s);
  const W = ctx.canvas.width;
  const p = hbV(clamp(p0.x + (dir || 0) * (m.w / 2 + 6), m.w / 2 + 8, W - m.w / 2 - 8), p0.y);
  ctx.save();
  ctx.fillStyle = 'rgba(20, 22, 27, 0.86)';
  roundRect(ctx, p.x - m.w / 2 - 5, p.y - m.h / 2 - 2, m.w + 10, m.h + 4, 6);
  ctx.fill();
  ctx.restore();
  drawIt(ctx, it, p.x - m.w / 2, p.y, s, color);
}

// ∠PVQ（取小於 180° 的那一側），90° 時畫直角記號（浮點誤差也算）
function plAngleR(ctx, V, P, Q, r, color, o) {
  const a = hbHead(V, P), b = hbHead(V, Q);
  const d = ((b - a) % 360 + 360) % 360;
  let s0 = a, sw = d;
  if (d > 180) { s0 = b; sw = 360 - d; }
  const right = Math.abs(sw - 90) < 0.01;
  hbSector(ctx, V, s0, right ? 90 : sw, r, color, Object.assign({ right }, o || {}));
}

// 圖上的度數或編號（描邊字）
function plLab(ctx, p, text, color, size) {
  cgLabel(ctx, p, text, color, 0, 0, f(800, size || 14));
}

// 有「上一步／下一步」的互動：底部的說明列（兩行算式風格的字）
function plBand(ctx, k, n, lines, color) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const y = H - 92, h = 82;
  drawPanel(ctx, 12, y, W - 24, h, color, 0.1);
  textCenter(ctx, `步驟 ${k}/${n}`, 58, y + h / 2, '#f8fafc', f(800, 14));
  const xs = lines.length === 1 ? [y + h / 2] : [y + h / 2 - 14, y + h / 2 + 14];
  lines.forEach((ln, i) => {
    drawExpr(ctx, exprItems(ln, i === 0 ? '#f1f5f9' : color), 0, xs[i], 16, '#f1f5f9',
      { left: 108, maxW: W - 24 - 108, gap: 0 });
  });
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第四冊 4-1 的 22 題正解
  // 正解字母分布：A 6 題、B 5 題、C 6 題、D 5 題（開發約束 36）
  const answers = {
    '4-1-1': 'B',    // a ⊥ c、b ⊥ c ⇒ a // b；b ⊥ c、b ⊥ d ⇒ c // d
    '4-1-2': 'D',    // AB、CD 都垂直 BC：BC 是共同垂線
    '4-1-3': 'A',    // M ⊥ L1 ⇒ M ⊥ L2；又 N ⊥ L2 ⇒ M // N
    '4-1-4': 'C',    // a // c，c ⊥ d ⇒ a ⊥ d
    '4-1-5': 'C',    // 高 = 2 × 35 ÷ 10 = 7，△ACE = 8 × 7 ÷ 2 = 28
    '4-1-6': 'A',    // L 的兩側各 1 條，都與 L 平行
    '4-1-7': 'D',    // 換一種編號的圖：∠2（左上）的同位角是 ∠6（左上）
    '4-1-8': 'A',    // ∠4（L1 右下）與 ∠6（L2 左上）是內錯角
    '4-1-9': 'B',    // ∠6 = 58° ⇒ ∠1 = 180° − 58° = 122°
    '4-1-10': 'D',   // ∠1 與 ∠6 互補，不相等（截線不垂直）
    '4-1-11': 'B',   // 同側內角互補：8x + 12 = 180，x = 21
    '4-1-12': 'C',   // 內錯角相等：4x − 18 = 2x + 30，x = 24，∠1 = 78°
    '4-1-13': 'A',   // x = 63（內錯角）、y = 106（同側內角）⇒ 169
    '4-1-14': 'C',   // ∠1 = 71°，∠2 = 180° − 71° = 109°
    '4-1-15': 'B',   // ∠ABC = 37° + 46° = 83°
    '4-1-16': 'D',   // ∠1 的另一側 = 180° − 142° = 38°，∠ABC = 38° + 49° = 87°
    '4-1-17': 'B',   // ∠1 = ∠8 = 103° ⇒ ∠2 = 77° = ∠6（同位角相等）
    '4-1-18': 'C',   // 123° + 57° = 180° ⇒ a // b；123° + 58° ≠ 180° ⇒ c 不平行 d
    '4-1-19': 'A',   // ∠BEG = ∠CGE（內錯角）⇒ 一半也相等 ⇒ EF // GH
    '4-1-20': 'D',   // ∠DHG = 116°，∠GHI = 58°
    '4-1-21': 'A',   // 同側內角要互補才平行：68° + 68° ≠ 180°
    '4-1-22': 'C'    // 平移保留方向（同位角相等），翻轉不保留
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

// 兩直線被一條截線所截的附圖，回傳兩個交點
//   o.a1、o.a2：兩直線方向；o.t：截線往上方向；o.V1：截線與上面那條線的交點；o.gap：兩線的鉛直距離
function plFigCut(ctx, W, H, o) {
  const box = { x: 4, y: 4, w: W - 8, h: H - 8 };
  const V1 = o.V1, V2 = hbCross(V1, hbUnit(o.t), hbAt(V1, -90, o.gap), hbUnit(o.a2));
  plClip(ctx, box, () => {
    plLine(ctx, V1, o.a1, INK, 2.4);
    plLine(ctx, V2, o.a2, INK, 2.4);
    plLine(ctx, V1, o.t, RD_YELLOW, 2.4);
  });
  if (o.par) {
    plParMark(ctx, hbAt(V1, o.a1, -110), o.a1, INK, 1);
    plParMark(ctx, hbAt(V2, o.a2, -110), o.a2, INK, 1);
  }
  const n1 = o.names || ['L', '1'], n2 = o.names2 || ['L', '2'];
  plTag(ctx, hbAt(plEndIn(V1, o.a1, box, 18), o.a1 + 90, 13), n1[0], n1[1], INK, 15);
  plTag(ctx, hbAt(plEndIn(V2, o.a2, box, 18), o.a2 + 90, 13), n2[0], n2[1], INK, 15);
  const tn = o.tname || ['L', ''];
  plTag(ctx, hbAt(plEndIn(V1, o.t, box, 16), o.t - 90, 14), tn[0], tn[1], RD_YELLOW, 15);
  return { V1, V2, s1: plAngles(o.a1, o.t), s2: plAngles(o.a2, o.t) };
}

// 在八個角的位置寫編號：order 是 [左上, 右上, 左下, 右下] 依序要寫的字（兩個交點各一組）
function plFigNums(ctx, g, nums1, nums2, d) {
  [g.s1, g.s2].forEach((ss, k) => {
    const V = k ? g.V2 : g.V1, nums = k ? nums2 : nums1;
    ss.forEach((s, i) => { if (nums[i]) plLab(ctx, plIn(V, s, d || 22), nums[i], RD_WHITE, 14); });
  });
}

// 拐角圖：L1 // L2 水平，B 在兩線之間，∠1 在 A、∠2 在 C（數學角，課本例 4 的樣子）
function plBendPts(t1, t2, W, H) {
  const yA = 46, yC = H - 40, yB = (yA + yC) / 2, Bx = W * 0.62;
  const d1 = (yB - yA), d2 = (yC - yB);
  const A = hbV(Bx - d1 / Math.tan(t1 * HB_RAD), yA);
  const C = hbV(Bx - d2 / Math.tan(t2 * HB_RAD), yC);
  return { A, B: hbV(Bx, yB), C, yA, yC };
}

function plBendFig(ctx, W, H, t1, t2, lab1, lab2, outer) {
  const p = plBendPts(t1, t2, W, H);
  hbSeg(ctx, hbV(8, p.yA), hbV(W - 8, p.yA), INK, 2.4);
  hbSeg(ctx, hbV(8, p.yC), hbV(W - 8, p.yC), INK, 2.4);
  plParMark(ctx, hbV(40, p.yA), 0, INK, 1);
  plParMark(ctx, hbV(40, p.yC), 0, INK, 1);
  plTag(ctx, hbV(W - 24, p.yA - 14), 'L', '1', INK, 15);
  plTag(ctx, hbV(W - 24, p.yC - 14), 'L', '2', INK, 15);
  hbSeg(ctx, p.A, p.B, RD_YELLOW, 2.6);
  hbSeg(ctx, p.B, p.C, RD_YELLOW, 2.6);
  if (outer) {
    // A 點的已知角量在左邊：L1 往左的射線與 AB 的夾角
    hbSector(ctx, p.A, 180, 180 - t1, 18, RD_SKY, { alpha: 0.25, label: lab1, lr: 36, font: f(800, 13) });
  } else {
    hbSector(ctx, p.A, -t1, t1, 24, RD_SKY, { alpha: 0.25, label: lab1, lr: 44, font: f(800, 13) });
  }
  hbSector(ctx, p.C, 0, t2, 24, RD_CORAL, { alpha: 0.25, label: lab2, lr: 44, font: f(800, 13) });
  textCenter(ctx, 'A', p.A.x, p.A.y - 14, RD_WHITE, fi(800, 16));
  textCenter(ctx, 'C', p.C.x, p.C.y + 15, RD_WHITE, fi(800, 16));
  textCenter(ctx, 'B', p.B.x + 15, p.B.y, RD_WHITE, fi(800, 16));
  return p;
}

const PL_QUIZ_FIGS = {
  // Q5：AE // BD，C 在 BD 上（照比例：AE 8、BD 10、高 7）
  q5(ctx, W, H) {
    const u = 19;
    const A = hbV(70, 42), E = hbV(70 + 8 * u, 42);
    const B = hbV(44, 42 + 7 * u), D = hbV(44 + 10 * u, 42 + 7 * u), C = hbV(44 + 5.6 * u, 42 + 7 * u);
    hbPoly(ctx, [A, B, D], RD_SKY, 0.12, 2);
    hbPoly(ctx, [A, C, E], RD_YELLOW, 0.12, 2);
    hbSeg(ctx, A, E, INK, 2.6);
    hbSeg(ctx, B, D, INK, 2.6);
    plParMark(ctx, hbV((A.x + E.x) / 2 + 4, A.y), 0, INK, 1);
    plParMark(ctx, hbV((B.x + D.x) / 2 - 30, B.y), 0, INK, 1);
    textCenter(ctx, 'A', A.x - 6, A.y - 14, RD_WHITE, fi(800, 16));
    textCenter(ctx, 'E', E.x + 6, E.y - 14, RD_WHITE, fi(800, 16));
    textCenter(ctx, 'B', B.x - 4, B.y + 15, RD_WHITE, fi(800, 16));
    textCenter(ctx, 'C', C.x, C.y + 15, RD_WHITE, fi(800, 16));
    textCenter(ctx, 'D', D.x + 4, D.y + 15, RD_WHITE, fi(800, 16));
  },
  // Q7、Q8：另一種編號（每個交點從右上起逆時針 1、2、3、4），兩直線不平行
  q7(ctx, W, H) {
    const g = plFigCut(ctx, W, H, { V1: hbV(150, 66), a1: 0, a2: -5, t: 64, gap: 96 });
    // 右上、左上、左下、右下 → plAngles 的順序是 [左上, 右上, 左下, 右下]
    plFigNums(ctx, g, ['2', '1', '3', '4'], ['6', '5', '7', '8'], 22);
  },
  // Q9：課本圖 4 的編號，L1 // L2
  q9(ctx, W, H) {
    const g = plFigCut(ctx, W, H, { V1: hbV(170, 66), a1: 0, a2: 0, t: 58, gap: 96, par: true });
    plFigNums(ctx, g, ['1', '2', '3', '4'], ['5', '6', '7', '8'], 22);
  },
  q10(ctx, W, H) {
    const g = plFigCut(ctx, W, H, { V1: hbV(150, 66), a1: 0, a2: 0, t: 68, gap: 96, par: true });
    plFigNums(ctx, g, ['1', '2', '3', '4'], ['5', '6', '7', '8'], 22);
  },
  // Q11：同側內角 ∠1 = (3x + 16)°（L 右下）、∠2 = (5x − 4)°（M 右上）；照答案的角度作圖
  q11(ctx, W, H) {
    const g = plFigCut(ctx, W, H, { V1: hbV(150, 66), a1: 0, a2: 0, t: 101, gap: 100, par: true,
      names: ['L', ''], names2: ['M', ''], tname: ['N', ''] });
    plSector(ctx, g.V1, g.s1[3], 18, RD_SKY, { alpha: 0.3 });
    plSector(ctx, g.V2, g.s2[1], 18, RD_CORAL, { alpha: 0.3 });
    plLab(ctx, plIn(g.V1, g.s1[3], 34), '1', RD_SKY, 14);
    plLab(ctx, plIn(g.V2, g.s2[1], 34), '2', RD_CORAL, 14);
  },
  // Q12：內錯角 ∠1（L 右下）、∠2（M 左上）
  q12(ctx, W, H) {
    const g = plFigCut(ctx, W, H, { V1: hbV(150, 66), a1: 0, a2: 0, t: 102, gap: 100, par: true,
      names: ['L', ''], names2: ['M', ''], tname: ['N', ''] });
    plSector(ctx, g.V1, g.s1[3], 18, RD_SKY, { alpha: 0.3 });
    plSector(ctx, g.V2, g.s2[0], 18, RD_CORAL, { alpha: 0.3 });
    plLab(ctx, plIn(g.V1, g.s1[3], 34), '1', RD_SKY, 14);
    plLab(ctx, plIn(g.V2, g.s2[0], 34), '2', RD_CORAL, 14);
  },
  // Q13：L1 // L2，兩條截線 M（往上方向 117°）、N（74°）
  q13(ctx, W, H) {
    const y1 = 62, y2 = 172;
    const box = { x: 4, y: 4, w: W - 8, h: H - 8 };
    const M1 = hbV(108, y1), N1 = hbV(232, y1);
    const M2 = hbCross(M1, hbUnit(117), hbV(0, y2), hbUnit(0));
    const N2 = hbCross(N1, hbUnit(74), hbV(0, y2), hbUnit(0));
    plClip(ctx, box, () => {
      plLine(ctx, M1, 0, INK, 2.4);
      plLine(ctx, M2, 0, INK, 2.4);
      plLine(ctx, M1, 117, RD_YELLOW, 2.4);
      plLine(ctx, N1, 74, RD_SKY, 2.4);
    });
    plParMark(ctx, hbV(30, y1), 0, INK, 1);
    plParMark(ctx, hbV(30, y2), 0, INK, 1);
    plTag(ctx, hbV(W - 22, y1 - 13), 'L', '1', INK, 14);
    plTag(ctx, hbV(W - 22, y2 - 13), 'L', '2', INK, 14);
    plTag(ctx, hbAt(plEndIn(M1, 117, box, 14), 27, 14), 'M', '', RD_YELLOW, 14);
    plTag(ctx, hbAt(plEndIn(N1, 74, box, 14), -16, 14), 'N', '', RD_SKY, 14);
    const sM1 = plAngles(0, 117), sM2 = plAngles(0, 117), sN1 = plAngles(0, 74), sN2 = plAngles(0, 74);
    plSector(ctx, M1, sM1[3], 16, RD_YELLOW, { alpha: 0.28, label: '63°', lr: 34, font: f(800, 13) });
    plSector(ctx, M2, sM2[0], 16, RD_YELLOW, { alpha: 0.28, label: 'x', lr: 30, font: fi(800, 15) });
    plSector(ctx, N2, sN2[1], 16, RD_SKY, { alpha: 0.28, label: '74°', lr: 34, font: f(800, 13) });
    plSector(ctx, N1, sN1[3], 16, RD_SKY, { alpha: 0.28, label: 'y', lr: 30, font: fi(800, 15) });
  },
  // Q14：L1 // L2，M1 // M2（方向 71°）
  q14(ctx, W, H) {
    const y1 = 64, y2 = 170, t = 71;
    const box = { x: 4, y: 4, w: W - 8, h: H - 8 };
    const A = hbV(92, y1), B = hbV(212, y1);
    const C = hbCross(B, hbUnit(t), hbV(0, y2), hbUnit(0));
    plClip(ctx, box, () => {
      plLine(ctx, A, 0, INK, 2.4);
      plLine(ctx, C, 0, INK, 2.4);
      plLine(ctx, A, t, RD_YELLOW, 2.4);
      plLine(ctx, B, t, RD_YELLOW, 2.4);
    });
    plParMark(ctx, hbV(28, y1), 0, INK, 1);
    plParMark(ctx, hbV(28, y2), 0, INK, 1);
    plParMark(ctx, hbAt(A, t + 180, 70), t, RD_YELLOW, 2);
    plParMark(ctx, hbAt(B, t + 180, 70), t, RD_YELLOW, 2);
    plTag(ctx, hbV(W - 22, y1 - 13), 'L', '1', INK, 14);
    plTag(ctx, hbV(W - 22, y2 - 13), 'L', '2', INK, 14);
    plTag(ctx, hbAt(plEndIn(A, t, box, 12), 160, 16), 'M', '1', RD_YELLOW, 14);
    plTag(ctx, hbAt(plEndIn(B, t, box, 12), 160, 16), 'M', '2', RD_YELLOW, 14);
    const s = plAngles(0, t);
    plSector(ctx, A, s[1], 18, RD_SKY, { alpha: 0.28, label: '71°', lr: 38, font: f(800, 13) });
    plSector(ctx, C, s[0], 18, RD_CORAL, { alpha: 0.28, label: '2', lr: 32, font: f(800, 14) });
  },
  q15(ctx, W, H) {
    const p = plBendFig(ctx, W, H, 37, 46, '37°', '46°', false);
    hbAngle(ctx, p.B, p.A, p.C, 18, RD_OK, { alpha: 0.2, label: '?', lr: 34, font: f(800, 15) });
  },
  q16(ctx, W, H) {
    const p = plBendFig(ctx, W, H, 38, 49, '142°', '49°', true);
    hbAngle(ctx, p.B, p.A, p.C, 18, RD_OK, { alpha: 0.2, label: '?', lr: 34, font: f(800, 15) });
  },
  // Q17：課本圖 4 的編號（不預設平行）
  q17(ctx, W, H) {
    const g = plFigCut(ctx, W, H, { V1: hbV(150, 66), a1: 0, a2: 3, t: 76, gap: 96, tname: ['M', ''] });
    plFigNums(ctx, g, ['1', '2', '3', '4'], ['5', '6', '7', '8'], 22);
  },
  // Q18：a // b（水平），c 往上方向 57°、d 往上方向 58°（角度取奇數，判別互動的滑桿調不出來）
  q18(ctx, W, H) {
    const ya = 66, yb = 168;
    const box = { x: 4, y: 4, w: W - 8, h: H - 8 };
    const Ca = hbV(128, ya), Da = hbV(232, ya);
    const Cb = hbCross(Ca, hbUnit(57), hbV(0, yb), hbUnit(0));
    plClip(ctx, box, () => {
      plLine(ctx, Ca, 0, INK, 2.4);
      plLine(ctx, Cb, 0, INK, 2.4);
      plLine(ctx, Ca, 57, RD_YELLOW, 2.4);
      plLine(ctx, Da, 58, RD_SKY, 2.4);
    });
    plTag(ctx, hbV(W - 20, ya - 13), 'a', '', INK, 15);
    plTag(ctx, hbV(W - 20, yb - 13), 'b', '', INK, 15);
    plTag(ctx, hbAt(plEndIn(Ca, 57, box, 14), 147, 16), 'c', '', RD_YELLOW, 15);
    plTag(ctx, hbAt(plEndIn(Da, 58, box, 12), -32, 14), 'd', '', RD_SKY, 15);
    const sc = plAngles(0, 57), sd = plAngles(0, 58);
    plSector(ctx, Ca, sc[3], 16, RD_YELLOW, { alpha: 0.28, label: '1', lr: 30, font: f(800, 14) });
    plSector(ctx, Cb, sc[1], 16, RD_YELLOW, { alpha: 0.28, label: '3', lr: 30, font: f(800, 14) });
    plSector(ctx, Da, sd[2], 16, RD_SKY, { alpha: 0.28, label: '2', lr: 30, font: f(800, 14) });
    textLeft(ctx, '（示意圖）', 8, H - 12, MUTED, f(600, 11));
  },
  // Q19：AB // CD，EF 平分 ∠BEG、GH 平分 ∠CGE
  q19(ctx, W, H) {
    const yA = 62, yC = 166, t = 64;
    const E = hbV(130, yA), G = hbCross(E, hbUnit(t), hbV(0, yC), hbUnit(0));
    hbSeg(ctx, hbV(14, yA), hbV(W - 14, yA), INK, 2.4);
    hbSeg(ctx, hbV(14, yC), hbV(W - 14, yC), INK, 2.4);
    hbSeg(ctx, hbAt(E, t, 34), hbAt(G, t + 180, 34), RD_YELLOW, 2.4);
    // ∠BEG 從 E→G（t+180）到 E→B（360），平分線方向 t + 180 + (180 − t)/2
    const dE = t + 180 + (180 - t) / 2, dG = t + (180 - t) / 2;
    hbSeg(ctx, E, hbAt(E, dE, 96), RD_SKY, 2.4);
    hbSeg(ctx, G, hbAt(G, dG, 96), RD_SKY, 2.4);
    textCenter(ctx, 'A', 18, yA - 13, RD_WHITE, fi(800, 15));
    textCenter(ctx, 'B', W - 18, yA - 13, RD_WHITE, fi(800, 15));
    textCenter(ctx, 'C', 18, yC + 14, RD_WHITE, fi(800, 15));
    textCenter(ctx, 'D', W - 18, yC + 14, RD_WHITE, fi(800, 15));
    cgLabel(ctx, E, 'E', RD_WHITE, -4, -15, fi(800, 15));
    cgLabel(ctx, G, 'G', RD_WHITE, 4, 15, fi(800, 15));
    const F = hbAt(E, dE, 96), Hh = hbAt(G, dG, 96);
    cgLabel(ctx, F, 'F', RD_SKY, 10, 6, fi(800, 15));
    cgLabel(ctx, Hh, 'H', RD_SKY, -6, -12, fi(800, 15));
  },
  // Q20：AB // CD，∠BGH = 64°，兩條同側內角的平分線交於 I
  q20(ctx, W, H) {
    const yA = 56, yC = 172, t = 116;
    const G = hbV(150, yA), Hh = hbCross(G, hbUnit(t), hbV(0, yC), hbUnit(0));
    hbSeg(ctx, hbV(14, yA), hbV(W - 14, yA), INK, 2.4);
    hbSeg(ctx, hbV(14, yC), hbV(W - 14, yC), INK, 2.4);
    hbSeg(ctx, hbAt(G, t, 30), hbAt(Hh, t + 180, 30), RD_YELLOW, 2.4);
    // ∠BGH：G→B（0°）到 G→H（t + 180 = 296°），平分線 330°；∠DHG：H→D（0°）到 H→G（116°），平分線 58°
    const dG = 360 - (360 - (t + 180)) / 2, dH = t / 2;
    const I = hbCross(G, hbUnit(dG), Hh, hbUnit(dH));
    hbSeg(ctx, G, I, RD_SKY, 2.4);
    hbSeg(ctx, Hh, I, RD_SKY, 2.4);
    hbSector(ctx, G, t + 180, 360 - (t + 180), 20, RD_CORAL, { alpha: 0.25 });
    const lp = hbAt(G, 352, 46);
    textCenter(ctx, '64°', lp.x, lp.y, RD_CORAL, f(800, 13));
    textCenter(ctx, 'A', 18, yA - 13, RD_WHITE, fi(800, 15));
    textCenter(ctx, 'B', W - 18, yA - 13, RD_WHITE, fi(800, 15));
    textCenter(ctx, 'C', 18, yC + 14, RD_WHITE, fi(800, 15));
    textCenter(ctx, 'D', W - 18, yC + 14, RD_WHITE, fi(800, 15));
    cgLabel(ctx, G, 'G', RD_WHITE, -4, -15, fi(800, 15));
    cgLabel(ctx, Hh, 'H', RD_WHITE, -6, 15, fi(800, 15));
    cgLabel(ctx, I, 'I', RD_SKY, 13, 0, fi(800, 15));
  }
};
PL_QUIZ_FIGS.q8 = PL_QUIZ_FIGS.q7;

function initQuizFigs() {
  document.querySelectorAll('canvas.quiz-fig[data-fig]').forEach(cv => {
    const fn = PL_QUIZ_FIGS[cv.getAttribute('data-fig')];
    if (!fn) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    fn(ctx, cv.width, cv.height);
  });
}

/* ==========================================================================
   重點 1：平行的意義——找一條共同的垂直線
   M 永遠畫成垂直 L1；L2 相對 L1 傾斜 t 度。t = 0 時 M 也垂直 L2。
   ========================================================================== */
function initDefCanvas() {
  const cv = hbEl('canvas-def');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('def-a'), st = hbEl('def-t'), sm = hbEl('def-m');
  const va = hbEl('def-va'), vt = hbEl('def-vt'), vm = hbEl('def-vm');
  const out = hbEl('def-formula'), fb = hbEl('def-feedback');
  const C0 = RD_TONE[0];
  const box = { x: 12, y: 44, w: 516, h: 292 };
  const U = 40;

  function draw() {
    const W = cv.width, H = cv.height;
    const a = hbClampSlider(sa, -30, 30), t = hbClampSlider(st, -12, 12), m = hbClampSlider(sm, -3, 3);
    va.textContent = a + '°';
    vt.textContent = t + '°';
    vm.textContent = m;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '找一條同時垂直兩條直線的線', C0);

    const P1 = hbV(270, 140), a2 = a + t;
    const P2 = hbAt(P1, a - 90, 3 * U);
    const Q = hbAt(P1, a, m * 46);
    const R = hbCross(Q, hbUnit(a - 90), P2, hbUnit(a2));
    const par = (t === 0);
    const X = par ? null : hbCross(P1, hbUnit(a), P2, hbUnit(a2));
    const ang = 90 - Math.abs(t);

    plClip(ctx, box, () => {
      plLine(ctx, P1, a, RD_WHITE, 3.2);
      plLine(ctx, P2, a2, RD_WHITE, 3.2);
      plLine(ctx, Q, a + 90, RD_YELLOW, 2.6, [10, 7]);
      hbSeg(ctx, Q, R, RD_YELLOW, 4);
      if (X && plInside(X, box)) {
        hbDot(ctx, X, RD_NO, 6);
        cgLabel(ctx, X, '交點', RD_NO, 0, -20, f(800, 14));
      }
    });
    hbSector(ctx, Q, a - 90, 90, 24, RD_YELLOW, { right: true, alpha: 0.25 });
    if (par) {
      hbSector(ctx, R, a2, 90, 24, RD_OK, { right: true, alpha: 0.3 });
    } else if (t > 0) {
      hbSector(ctx, R, a2, ang, 30, RD_CORAL, { alpha: 0.28, label: `${ang}°`, lr: 52, font: f(800, 15) });
    } else {
      hbSector(ctx, R, a + 90, ang, 30, RD_CORAL, { alpha: 0.28, label: `${ang}°`, lr: 52, font: f(800, 15) });
    }
    hbDot(ctx, Q, RD_YELLOW, 5);
    hbDot(ctx, R, par ? RD_OK : RD_CORAL, 5);
    const len = hbDist(Q, R) / U;
    const mid = hbV((Q.x + R.x) / 2, (Q.y + R.y) / 2);
    cgLabel(ctx, mid, `${len.toFixed(1)} 格`, RD_YELLOW, -34, 0, f(800, 14));
    plLineTag(ctx, P1, a, box, 'L', '1', RD_WHITE);
    plLineTag(ctx, P2, a2, box, 'L', '2', RD_WHITE);
    plLineTag(ctx, Q, a + 90, box, 'M', '', RD_YELLOW, 18);

    plX(ctx, 'M ⊥ L_1（夾角 90°）', 358, RD_YELLOW, 16);
    if (par) {
      plX(ctx, 'M 與 L_2 的夾角也是 90°：M 是共同垂線', 388, RD_OK, 16);
      plX(ctx, '有共同垂線 ⇒ L_1 // L_2', 420, RD_OK, 17);
      plX(ctx, '移動 M：夾在兩線之間的長度都是 3 格', 452, MUTED, 14);
    } else {
      plX(ctx, `M 與 L_2 的夾角是 ${ang}°，不是直角`, 388, RD_CORAL, 16);
      plX(ctx, `移動 M，跟 L_2 的夾角永遠是 ${ang}°：找不到共同垂線`, 420, RD_CORAL, 15);
      const side = X.x < P1.x ? '左' : '右';
      plX(ctx, `L_1、L_2 不平行，往${side}延長會相交`, 452, MUTED, 14);
    }

    if (par) {
      out.innerHTML = '\\(M \\perp L_1\\)，<wbr>\\(M \\perp L_2\\)，<wbr>\\(L_1 /\\!/ L_2\\)';
      fb.innerHTML = wrapFeedback('\\(M\\) 同時垂直 \\(L_1\\) 與 \\(L_2\\)，它就是兩條線的<strong>共同垂線</strong>，依定義 \\(L_1 /\\!/ L_2\\)。<br>左右移動 \\(M\\)：夾在兩線之間的那一段長度都一樣。');
    } else {
      out.innerHTML = `\\(M \\perp L_1\\)，<wbr>\\(M\\) 與 \\(L_2\\) 夾 \\(${ang}^\\circ\\)`;
      fb.innerHTML = wrapFeedback(`每一條垂直 \\(L_1\\) 的線，跟 \\(L_2\\) 的夾角都是 \\(${ang}^\\circ\\)，找不到共同垂線，所以 \\(L_1\\)、\\(L_2\\) <strong>不平行</strong>。<br>把「\\(L_2\\) 的傾斜」調回 \\(0^\\circ\\) 試試看。`);
    }
    typeset([out, fb]);
  }

  [sa, st, sm].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：平行線的性質——垂直跟著傳過去、平行可以遞移
   ========================================================================== */
function initPropCanvas() {
  const cv = hbEl('canvas-prop');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sr = hbEl('prop-r'), vr = hbEl('prop-vr');
  const g = hbEl('prop-mode-group');
  const out = hbEl('prop-formula'), fb = hbEl('prop-feedback');
  const C0 = RD_TONE[1];
  const box = { x: 12, y: 44, w: 516, h: 320 };
  const N = { perp: 3, trans: 5, two: 3 };
  const st = { k: 1 };
  let mode = 'perp';

  function rightAt(V, a0, color, alpha) {
    hbSector(ctx, V, a0, 90, 22, color, { right: true, alpha: alpha == null ? 0.28 : alpha });
  }

  function draw() {
    const W = cv.width, H = cv.height;
    const a = hbClampSlider(sr, -30, 30);
    vr.textContent = a + '°';
    const n = N[mode];
    cgSync('prop', st, n);
    const k = st.k;
    ctx.clearRect(0, 0, W, H);
    const O = hbV(270, 200);
    let lines = [], tex = '', fbText = '';

    if (mode === 'perp') {
      drawTitle(ctx, '已知兩線平行，作 M 垂直其中一條', C0);
      const O1 = hbAt(O, a + 90, 72), O2 = hbAt(O, a - 90, 72);
      const F1 = hbAt(O1, a, -170), F2 = hbAt(O2, a, -170);
      const G1 = hbAt(O1, a, 100), G2 = hbAt(O2, a, 100);
      if (k >= 3) hbPoly(ctx, [F1, G1, G2, F2], RD_OK, 0.1, 0.01);
      plClip(ctx, box, () => {
        plLine(ctx, O1, a, RD_WHITE, 3);
        plLine(ctx, O2, a, RD_WHITE, 3);
        plLine(ctx, F1, a + 90, RD_SKY, 2.4, [8, 6]);
        if (k >= 2) plLine(ctx, G1, a + 90, RD_YELLOW, 3);
      });
      plParMark(ctx, hbAt(O1, a, -20), a, RD_WHITE, 1);
      plParMark(ctx, hbAt(O2, a, -20), a, RD_WHITE, 1);
      rightAt(F1, a - 90, RD_SKY);
      rightAt(F2, a, RD_SKY);
      if (k >= 2) rightAt(G1, a - 90, RD_YELLOW);
      if (k >= 3) rightAt(G2, a, RD_OK, 0.45);
      plLineTag(ctx, O1, a, box, 'L', '1', RD_WHITE);
      plLineTag(ctx, O2, a, box, 'L', '2', RD_WHITE);
      plLineTag(ctx, F1, a + 90, box, 'L', '', RD_SKY, 18);
      if (k >= 2) plLineTag(ctx, G1, a + 90, box, 'M', '', RD_YELLOW, 18);
      if (k === 1) {
        lines = ['已知 L_1 // L_2', '依定義，它們有一條共同垂線 L（虛線）'];
        tex = 'L_1 /\\!/ L_2';
      } else if (k === 2) {
        lines = ['作直線 M ⊥ L_1', 'M、L、L_1、L_2 圍出一個四邊形'];
        tex = 'L_1 /\\!/ L_2,\\ M \\perp L_1';
      } else {
        lines = ['四邊形已有三個直角，第四個角 = 360° − 270° = 90°', '所以 M ⊥ L_2'];
        tex = 'L_1 /\\!/ L_2,\\ M \\perp L_1 \\Rightarrow M \\perp L_2';
      }
      fbText = '兩平行線中，<strong>垂直其中一條的直線，也會垂直另一條</strong>。轉動整組圖形，結論不變。';
    } else if (mode === 'trans') {
      drawTitle(ctx, '平行可以一條傳一條', C0);
      const O1 = hbAt(O, a + 90, 100), O3 = hbAt(O, a - 90, 100);
      const G = [hbAt(O1, a, 60), hbAt(O, a, 60), hbAt(O3, a, 60)];
      plClip(ctx, box, () => {
        plLine(ctx, O1, a, k >= 5 ? RD_YELLOW : RD_WHITE, 3);
        plLine(ctx, O, a, RD_WHITE, 3);
        plLine(ctx, O3, a, k >= 5 ? RD_YELLOW : RD_WHITE, 3);
        if (k >= 2) plLine(ctx, G[0], a + 90, RD_SKY, 2.8);
      });
      plParMark(ctx, hbAt(O1, a, -120), a, RD_WHITE, 1);
      plParMark(ctx, hbAt(O, a, -120), a, RD_WHITE, 1);
      plParMark(ctx, hbAt(O, a, -170), a, RD_WHITE, 2);
      plParMark(ctx, hbAt(O3, a, -170), a, RD_WHITE, 2);
      if (k >= 2) rightAt(G[0], a - 90, RD_SKY);
      if (k >= 3) rightAt(G[1], a - 90, RD_OK, 0.4);
      if (k >= 4) rightAt(G[2], a, RD_OK, 0.4);
      plLineTag(ctx, O1, a, box, 'L', '1', k >= 5 ? RD_YELLOW : RD_WHITE);
      plLineTag(ctx, O, a, box, 'L', '2', RD_WHITE);
      plLineTag(ctx, O3, a, box, 'L', '3', k >= 5 ? RD_YELLOW : RD_WHITE);
      if (k >= 2) plLineTag(ctx, G[0], a + 90, box, 'M', '', RD_SKY, 18);
      const L = [
        ['已知 L_1 // L_2，L_2 // L_3', '（一個箭頭一組、兩個箭頭一組）'],
        ['作直線 M ⊥ L_1', ''],
        ['L_1 // L_2，M ⊥ L_1 ⇒ M ⊥ L_2', '（上一個模式的性質）'],
        ['L_2 // L_3，M ⊥ L_2 ⇒ M ⊥ L_3', '（同一個性質再用一次）'],
        ['M 同時垂直 L_1 與 L_3', '有共同垂線 ⇒ L_1 // L_3']
      ][k - 1];
      lines = L[1] ? L : [L[0]];
      tex = k >= 5 ? 'L_1 /\\!/ L_2,\\ L_2 /\\!/ L_3 \\Rightarrow L_1 /\\!/ L_3' : 'L_1 /\\!/ L_2,\\ L_2 /\\!/ L_3';
      fbText = '平行可以<strong>一條傳一條</strong>：\\(L_1 /\\!/ L_2\\)、\\(L_2 /\\!/ L_3\\) ⇒ \\(L_1 /\\!/ L_3\\)，三條線可以寫成 \\(L_1 /\\!/ L_2 /\\!/ L_3\\)。';
    } else {
      drawTitle(ctx, '兩條線都垂直同一條線', C0);
      const O1 = hbAt(O, a, -110), O3 = hbAt(O, a, 110);
      plClip(ctx, box, () => {
        plLine(ctx, O, a, RD_SKY, 3);
        plLine(ctx, O1, a + 90, k >= 2 ? RD_YELLOW : RD_WHITE, 3);
        plLine(ctx, O3, a + 90, k >= 2 ? RD_YELLOW : RD_WHITE, 3);
      });
      rightAt(O1, a, RD_SKY);
      rightAt(O3, a, RD_SKY);
      plLineTag(ctx, O, a, box, 'L', '2', RD_SKY);
      plLineTag(ctx, O1, a + 90, box, 'L', '1', k >= 2 ? RD_YELLOW : RD_WHITE, 18);
      plLineTag(ctx, O3, a + 90, box, 'L', '3', k >= 2 ? RD_YELLOW : RD_WHITE, 18);
      if (k === 1) {
        lines = ['已知 L_1 ⊥ L_2，L_2 ⊥ L_3', ''];
        tex = 'L_1 \\perp L_2,\\ L_2 \\perp L_3';
      } else if (k === 2) {
        lines = ['L_2 就是 L_1、L_3 的共同垂線', '所以 L_1 // L_3'];
        tex = 'L_1 \\perp L_2,\\ L_2 \\perp L_3 \\Rightarrow L_1 /\\!/ L_3';
      } else {
        lines = ['注意：不是 L_1 ⊥ L_3', '「垂直的垂直」得到的是平行'];
        tex = 'L_1 /\\!/ L_3';
      }
      lines = lines.filter(s => s);
      fbText = '兩條直線<strong>都垂直同一條直線</strong>，這條線就是它們的共同垂線，所以兩條線互相平行，不是互相垂直。';
    }

    plBand(ctx, k, n, lines, C0);
    out.innerHTML = `\\(${tex}\\)`;
    fb.innerHTML = wrapFeedback(fbText);
    typeset([out, fb]);
  }

  sr.addEventListener('input', draw);
  cgSteps('prop', st, draw);
  bindPickGroup(g, 'data-prop-mode', v => { mode = v; st.k = 1; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：兩平行線的距離處處相等——同底、頂點在另一條線上的三角形等積
   ========================================================================== */
function initDistCanvas() {
  const cv = hbEl('canvas-dist');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sh = hbEl('dist-h'), sb = hbEl('dist-b'), sx = hbEl('dist-x');
  const vh = hbEl('dist-vh'), vb = hbEl('dist-vb'), vx = hbEl('dist-vx');
  const out = hbEl('dist-formula'), fb = hbEl('dist-feedback');
  const C0 = RD_TONE[2];
  const U = 34, yL = 92, X0 = 40;

  function draw() {
    const W = cv.width, H = cv.height;
    const h = hbClampSlider(sh, 2, 5), b = hbClampSlider(sb, 3, 8), x = hbClampSlider(sx, 0, 13);
    vh.textContent = h;
    vb.textContent = b;
    vx.textContent = x;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '頂點在 L 上滑動，三角形的面積會變嗎？', C0);
    const yM = yL + h * U;
    const D = hbV(X0 + 3 * U, yM), E = hbV(X0 + (3 + b) * U, yM);
    const A = hbV(X0 + x * U, yL), B = hbV(X0 + 1 * U, yL), C = hbV(X0 + 12 * U, yL);
    const area = b * h / 2;

    hbSeg(ctx, hbV(14, yL), hbV(W - 14, yL), RD_WHITE, 3);
    hbSeg(ctx, hbV(14, yM), hbV(W - 14, yM), RD_WHITE, 3);
    plParMark(ctx, hbV(30, yL), 0, RD_WHITE, 1);
    plParMark(ctx, hbV(30, yM), 0, RD_WHITE, 1);
    plTag(ctx, hbV(W - 26, yL - 16), 'L', '', RD_WHITE);
    plTag(ctx, hbV(W - 26, yM - 16), 'M', '', RD_WHITE);

    [B, C].forEach(P => {
      if (Math.abs(P.x - A.x) < 1) return;
      hbPoly(ctx, [P, D, E], RD_SKY, 0.05, 1.6);
      hbSeg(ctx, P, hbV(P.x, yM), RD_FAINT, 1.6, [5, 5]);
    });
    hbPoly(ctx, [A, D, E], RD_YELLOW, 0.2, 2.8);
    hbSeg(ctx, A, hbV(A.x, yM), RD_OK, 2.4, [7, 5]);
    hbSector(ctx, hbV(A.x, yM), A.x < D.x + 1 ? 0 : 90, 90, 14, RD_OK, { right: true, alpha: 0.25 });
    cgLabel(ctx, hbV(A.x, (yL + yM) / 2), `高 = ${h}`, RD_OK, A.x > W - 90 ? -40 : 40, 0, f(800, 14));
    cgLabel(ctx, hbV((D.x + E.x) / 2, yM), `底 = ${b}`, RD_YELLOW, 0, 22, f(800, 14));
    [[A, 'A', RD_YELLOW], [B, 'B', RD_SKY], [C, 'C', RD_SKY]].forEach(([P, s, c]) => {
      if (s !== 'A' && Math.abs(P.x - A.x) < 1) return;
      hbDot(ctx, P, c, 5);
      textCenter(ctx, s, P.x, P.y - 16, c, fi(800, 17));
    });
    hbDot(ctx, D, RD_WHITE, 4.5);
    hbDot(ctx, E, RD_WHITE, 4.5);
    textCenter(ctx, 'D', D.x - 12, yM + 18, RD_WHITE, fi(800, 16));
    textCenter(ctx, 'E', E.x + 12, yM + 18, RD_WHITE, fi(800, 16));

    const y0 = yM + 62;
    plX(ctx, `△ADE = @0 × ${b} × ${h} = ${numStr(area)}`, y0, RD_YELLOW, 18, [FR(1, 2, RD_YELLOW)]);
    plX(ctx, `△BDE、△CDE 也是 ${numStr(area)}：同一個底 DE`, y0 + 34, RD_SKY, 15);
    plX(ctx, '高都是 L、M 之間的距離——兩平行線的距離處處相等', y0 + 62, MUTED, 14);

    out.innerHTML = wbrEq(`\\triangle ADE = \\frac{1}{2} \\times ${b} \\times ${h} = ${numStr(area)}`);
    fb.innerHTML = wrapFeedback(`\\(A\\) 在 \\(L\\) 上怎麼滑，從 \\(A\\) 到 \\(M\\) 的垂直線段都一樣長（\\(${h}\\) 格），所以 \\(\\triangle ADE\\) 的面積一直是 \\(${numStr(area)}\\)。<br>把 \\(A\\) 滑到 \\(B\\) 或 \\(C\\) 的位置看看：三個三角形一樣大。`);
    typeset([out, fb]);
  }

  [sh, sb, sx].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：截線與截角——同位角、內錯角、同側內角（名稱只看位置）
   ========================================================================== */
const PL_PAIR = {
  cor: { 1: 5, 2: 6, 3: 7, 4: 8, 5: 1, 6: 2, 7: 3, 8: 4 },
  alt: { 3: 6, 4: 5, 5: 4, 6: 3 },
  co: { 3: 5, 4: 6, 5: 3, 6: 4 }
};
const PL_REL = { cor: '同位角', alt: '內錯角', co: '同側內角' };

function plUD(n) { return [1, 2, 5, 6].indexOf(n) >= 0 ? '上方' : '下方'; }
function plLR(n) { return [1, 3, 5, 7].indexOf(n) >= 0 ? '左側' : '右側'; }

function initNameCanvas() {
  const cv = hbEl('canvas-name');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const stt = hbEl('name-t'), sb = hbEl('name-b'), vt = hbEl('name-vt'), vb = hbEl('name-vb');
  const gk = hbEl('name-k-group'), gr = hbEl('name-rel-group');
  const out = hbEl('name-formula'), fb = hbEl('name-feedback');
  const C0 = RD_TONE[3];
  const box = { x: 12, y: 44, w: 516, h: 300 };
  let k = 3, rel = 'alt';

  function draw() {
    const W = cv.width, H = cv.height;
    const t = hbClampSlider(stt, 55, 125), b = hbClampSlider(sb, -12, 12);
    vt.textContent = t + '°';
    vb.textContent = b + '°';
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '截線 L 截兩條直線，出現八個角', C0);
    // 兩個交點的中點放在畫布中線，截線再斜，標籤也不會跑出畫面
    const V1 = hbV(270 + 75 / Math.tan(t * HB_RAD), 118);
    const V2 = hbCross(V1, hbUnit(t), hbV(270, 268), hbUnit(b));
    const s1 = plAngles(0, t), s2 = plAngles(b, t);
    const p = PL_PAIR[rel][k];

    plClip(ctx, box, () => {
      plLine(ctx, V1, 0, RD_WHITE, 3);
      plLine(ctx, V2, b, RD_WHITE, 3);
      plLine(ctx, V1, t, RD_YELLOW, 3);
    });
    for (let n = 1; n <= 8; n++) {
      const V = n <= 4 ? V1 : V2, s = (n <= 4 ? s1 : s2)[(n - 1) % 4];
      let col = RD_FAINT, al = 0.06, r = 22;
      if (n === k) { col = RD_YELLOW; al = 0.4; r = 30; }
      else if (n === p) { col = RD_SKY; al = 0.4; r = 30; }
      plSector(ctx, V, s, r, col, { alpha: al });
      plLab(ctx, plIn(V, s, 44), String(n), n === k ? RD_YELLOW : (n === p ? RD_SKY : RD_WHITE), n === k || n === p ? 17 : 14);
    }
    plLineTag(ctx, V1, 0, box, 'L', '1', RD_WHITE);
    plLineTag(ctx, V2, b, box, 'L', '2', RD_WHITE);
    plLineTag(ctx, V1, t, box, 'L', '', RD_YELLOW, 18);

    const nm = PL_REL[rel];
    if (p) {
      plX(ctx, `∠${k} 的${nm}是 ∠${p}`, 368, RD_YELLOW, 19);
      let why;
      if (rel === 'cor') why = `兩個角都在自己那條線的${plUD(k)}、截線 L 的${plLR(k)}`;
      else if (rel === 'alt') why = '兩個角都夾在 L_1、L_2 之間（內），分在截線的兩側（錯）';
      else why = `兩個角都夾在 L_1、L_2 之間（內），在截線的同一側（${plLR(k)}）`;
      plX(ctx, why, 400, RD_SKY, 15);
    } else {
      plX(ctx, `∠${k} 沒有${nm}`, 368, RD_CORAL, 19);
      plX(ctx, `∠${k} 在 L_1、L_2 的外側；${nm}要夾在兩線之間`, 400, RD_CORAL, 15);
    }
    plX(ctx, b === 0 ? '把 L_2 轉斜：兩線不平行，名稱照樣成立' : 'L_1、L_2 不平行，名稱照樣成立——名稱只看位置', 436, MUTED, 14);

    out.innerHTML = p
      ? `\\(\\angle ${k}\\) 與 \\(\\angle ${p}\\) 是${nm}`
      : `\\(\\angle ${k}\\) 沒有${nm}`;
    fb.innerHTML = wrapFeedback(p
      ? `${nm}是依<strong>位置</strong>命名的：${rel === 'cor' ? '「同位」是位置對應相同' : (rel === 'alt' ? '「內」夾在兩線之間、「錯」交錯在截線兩側' : '「內」夾在兩線之間、「同側」在截線的同一邊')}。`
      : '\\(\\angle 1\\)、\\(\\angle 2\\)、\\(\\angle 7\\)、\\(\\angle 8\\) 在兩線的<strong>外側</strong>，只有同位角；內錯角與同側內角只在 \\(\\angle 3\\)～\\(\\angle 6\\) 之間找。');
    typeset([out, fb]);
  }

  [stt, sb].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(gk, 'data-name-k', v => { k = parseInt(v, 10); draw(); });
  bindPickGroup(gr, 'data-name-rel', v => { rel = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：平行線的截角性質——知道一個角，八個角全部知道
   ========================================================================== */
function initCutCanvas() {
  const cv = hbEl('canvas-cut');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const stt = hbEl('cut-t'), vt = hbEl('cut-vt');
  const gk = hbEl('cut-k-group'), gr = hbEl('cut-rel-group');
  const out = hbEl('cut-formula'), fb = hbEl('cut-feedback');
  const C0 = RD_TONE[4];
  const box = { x: 12, y: 44, w: 516, h: 268 };
  let k = 2, rel = 'cor';
  const VERT = { 1: 4, 4: 1, 2: 3, 3: 2, 5: 8, 8: 5, 6: 7, 7: 6 };

  function draw() {
    const W = cv.width, H = cv.height;
    const t = hbClampSlider(stt, 30, 150);
    vt.textContent = t + '°';
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '兩平行線被一直線所截', C0);
    const V1 = hbV(270 + 70 / Math.tan(t * HB_RAD), 112);
    const V2 = hbCross(V1, hbUnit(t), hbV(0, 252), hbUnit(0));
    const s = plAngles(0, t);
    const val = n => s[(n - 1) % 4].sw;
    const v = val(k);
    const p = PL_PAIR[rel][k];

    plClip(ctx, box, () => {
      plLine(ctx, V1, 0, RD_WHITE, 3);
      plLine(ctx, V2, 0, RD_WHITE, 3);
      plLine(ctx, V1, t, RD_YELLOW, 3);
    });
    plParMark(ctx, hbV(40, V1.y), 0, RD_WHITE, 1);
    plParMark(ctx, hbV(40, V2.y), 0, RD_WHITE, 1);
    for (let n = 1; n <= 8; n++) {
      const V = n <= 4 ? V1 : V2, sec = s[(n - 1) % 4];
      const same = Math.abs(val(n) - v) < 1e-9;
      const col = same ? RD_YELLOW : RD_SKY;
      const hot = (n === k || n === p);
      plSector(ctx, V, sec, hot ? 28 : 20, col, { alpha: hot ? 0.42 : 0.12 });
      plLab(ctx, plIn(V, sec, sec.sw < 50 ? 62 : 46), `∠${n}=${val(n)}°`, hot ? (n === k ? RD_YELLOW : RD_OK) : col, hot ? 14 : 12.5);
    }
    plLineTag(ctx, V1, 0, box, 'L', '1', RD_WHITE);
    plLineTag(ctx, V2, 0, box, 'L', '2', RD_WHITE);
    plLineTag(ctx, V1, t, box, 'L', '', RD_YELLOW, 18);

    const others = [1, 2, 3, 4].map(i => i + (k > 4 ? 4 : 0)).filter(i => i !== k && i !== VERT[k]);
    plX(ctx, `已知 ∠${k} = ${v}°`, 336, RD_YELLOW, 18);
    plX(ctx, `對頂角：∠${VERT[k]} = ∠${k} = ${v}°；補角：∠${others[0]} = ∠${others[1]} = 180° − ${v}° = ${180 - v}°`, 368, INK, 15);
    let relLine;
    if (rel === 'cor') relLine = `同位角相等：∠${k} = ∠${p} = ${v}°，另一條線上的四個角跟著決定`;
    else if (!p) relLine = `∠${k} 在外側，沒有${PL_REL[rel]}；換一個在兩線之間的角`;
    else if (rel === 'alt') relLine = `內錯角相等：∠${k} = ∠${p} = ${v}°`;
    else relLine = `同側內角互補：∠${k} + ∠${p} = ${v}° + ${180 - v}° = 180°`;
    plX(ctx, relLine, 400, p ? RD_OK : RD_CORAL, 15);
    const big = Math.max(v, 180 - v), small = Math.min(v, 180 - v);
    plX(ctx, t === 90 ? '截線垂直兩線：八個角都是 90°' : `黃色的角都是 ${v}°，藍色的都是 ${180 - v}°（大角 ${big}°、小角 ${small}°）`, 436, MUTED, 14);

    const eqA = [1, 4, 5, 8].map(i => `\\angle ${i}`).join(' = ');
    const eqB = [2, 3, 6, 7].map(i => `\\angle ${i}`).join(' = ');
    out.innerHTML = wbrEq(`${eqA} = ${val(1)}^\\circ`) + '，<wbr>' + wbrEq(`${eqB} = ${val(2)}^\\circ`);
    fb.innerHTML = wrapFeedback('兩平行線被一直線所截：<strong>同位角相等、內錯角相等、同側內角互補</strong>。<br>所以八個角只有兩種大小，而且這兩種互補。');
    typeset([out, fb]);
  }

  stt.addEventListener('input', draw);
  bindPickGroup(gk, 'data-cut-k', vv => { k = parseInt(vv, 10); draw(); });
  bindPickGroup(gr, 'data-cut-rel', vv => { rel = vv; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：用截角性質列方程式求 x
   ========================================================================== */
function plLin(a, b) {
  const head = a === 1 ? 'x' : `${a}x`;
  if (b === 0) return head;
  return b > 0 ? `${head} + ${b}` : `${head} - ${-b}`;
}

function plLinTex(a, b) {
  return plLin(a, b);
}

function initEqCanvas() {
  const cv = hbEl('canvas-eq');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('eq-a'), sb = hbEl('eq-b'), sc = hbEl('eq-c'), sd = hbEl('eq-d');
  const va = hbEl('eq-va'), vb = hbEl('eq-vb'), vc = hbEl('eq-vc'), vd = hbEl('eq-vd');
  const g = hbEl('eq-mode-group');
  const out = hbEl('eq-formula'), fb = hbEl('eq-feedback');
  const C0 = RD_TONE[5];
  const box = { x: 12, y: 44, w: 516, h: 250 };
  let mode = 'co';
  // 兩個角放的位置（plAngles 的索引：0 左上、1 右上、2 左下、3 右下）與編號
  const POS = {
    cor: { i1: 1, i2: 1, n1: 2, n2: 6, hint: '同位角相等' },
    alt: { i1: 3, i2: 0, n1: 4, n2: 5, hint: '內錯角相等' },
    co: { i1: 3, i2: 1, n1: 4, n2: 6, hint: '同側內角互補' }
  };

  function solve(a, b, c, d) {
    if (mode === 'co') {
      const k = a + c, r = 180 - b - d;
      return { k, r, x: qOf(r, k) };
    }
    let k = a - c, r = d - b;
    if (k < 0) { k = -k; r = -r; }
    if (k === 0) return { k, r, x: null, inf: r === 0 };
    return { k, r, x: qOf(r, k) };
  }

  function draw() {
    const W = cv.width, H = cv.height;
    const a = hbClampSlider(sa, 1, 4), b = hbClampSlider(sb, -20, 40);
    const c = hbClampSlider(sc, 1, 4), d = hbClampSlider(sd, -20, 40);
    va.textContent = a; vb.textContent = b; vc.textContent = c; vd.textContent = d;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, 'L // M：兩個角用 x 表示，列方程式', C0);
    const P = POS[mode];
    const sol = solve(a, b, c, d);
    const e1 = plLin(a, b), e2 = plLin(c, d);
    let v1 = null, v2 = null, ok = false;
    if (sol.x) {
      v1 = qAdd(qMul(sol.x, a), b);
      v2 = qAdd(qMul(sol.x, c), d);
      ok = qVal(v1) > 0 && qVal(v1) < 180 && qVal(v2) > 0 && qVal(v2) < 180;
    }
    // 截線的方向由解出的角度決定（圖與答案一致）；太斜時改畫示意角度
    let t = 60, schem = false;
    if (ok) {
      const ang = qVal(v1);
      t = (P.i1 === 1) ? ang : 180 - ang;
      if (t < 25 || t > 155) { t = clamp(t, 25, 155); schem = true; }
    }
    const V1 = hbV(270 + 66 / Math.tan(t * HB_RAD), 104);
    const V2 = hbCross(V1, hbUnit(t), hbV(0, 236), hbUnit(0));
    const s1 = plAngles(0, t), s2 = plAngles(0, t);
    plClip(ctx, box, () => {
      plLine(ctx, V1, 0, RD_WHITE, 3);
      plLine(ctx, V2, 0, RD_WHITE, 3);
      plLine(ctx, V1, t, ok ? RD_YELLOW : RD_FAINT, 3, ok ? null : [8, 6]);
    });
    plParMark(ctx, hbV(40, V1.y), 0, RD_WHITE, 1);
    plParMark(ctx, hbV(40, V2.y), 0, RD_WHITE, 1);
    plTag(ctx, hbV(W - 26, V1.y - 16), 'L', '', RD_WHITE);
    plTag(ctx, hbV(W - 26, V2.y - 16), 'M', '', RD_WHITE);
    plSector(ctx, V1, s1[P.i1], 24, RD_SKY, { alpha: 0.35 });
    plSector(ctx, V2, s2[P.i2], 24, RD_CORAL, { alpha: 0.35 });
    const lab1 = plIn(V1, s1[P.i1], 44), lab2 = plIn(V2, s2[P.i2], 44);
    const side = (V, q) => (q.x >= V.x ? 1 : -1);
    plExprTag(ctx, lab1, `∠${P.n1} = (${e1})°`, RD_SKY, 15, null, side(V1, lab1));
    plExprTag(ctx, lab2, `∠${P.n2} = (${e2})°`, RD_CORAL, 15, null, side(V2, lab2));
    if (schem) textLeft(ctx, '（角度太斜，圖只畫示意）', 16, 284, MUTED, f(600, 12));

    const rows = [];
    const eqStr = mode === 'co' ? `(${e1}) + (${e2}) = 180` : `${e1} = ${e2}`;
    rows.push({ name: '列式', hint: P.hint, items: exprItems(eqStr, INK) });
    const kx = sol.k === 1 ? 'x' : `${sol.k}x`;
    rows.push({ name: '整理', hint: '把 x 移到同一邊', items: exprItems(sol.k === 0 ? `0 = ${sol.r}` : `${kx} = ${sol.r}`, INK) });
    let texSteps = [mode === 'co' ? `(${plLinTex(a, b)}) + (${plLinTex(c, d)}) = 180` : `${plLinTex(a, b)} = ${plLinTex(c, d)}`];
    let msg, fbText;
    if (!sol.x) {
      if (sol.inf) {
        rows.push({ name: '結果', hint: '', items: exprItems('兩個式子一模一樣', RD_CORAL), color: RD_CORAL });
        msg = '兩個式子一模一樣，任何 x 都成立：求不出 x';
        fbText = '兩個角的式子完全相同，等式對任何 \\(x\\) 都成立，<strong>求不出唯一的 \\(x\\)</strong>。調一下係數或常數。';
      } else {
        rows.push({ name: '結果', hint: '', items: exprItems(`0 = ${sol.r} 不成立`, RD_CORAL), color: RD_CORAL });
        msg = 'x 的係數一樣、常數不同：兩角永遠不相等（情境不成立）';
        fbText = `\\(${plLinTex(a, b)}\\) 與 \\(${plLinTex(c, d)}\\) 的 \\(x\\) 係數相同、常數不同，兩個角永遠差 \\(${Math.abs(b - d)}^\\circ\\)，不可能相等，<strong>這兩條線不可能平行</strong>。把 \\(x\\) 的係數調成不一樣。`;
      }
      texSteps.push(sol.k === 0 ? `0 = ${sol.r}` : '');
    } else {
      // 係數已經是 1 時，「整理」那一列就是答案，不再重複一列「解出」
      if (sol.k !== 1) rows.push({ name: '解出', hint: '', items: exprItems('x = @0', INK, [qIt(sol.x, INK)]) });
      texSteps.push(`${sol.k === 1 ? '' : sol.k}x = ${sol.r}`);
      if (sol.k !== 1) texSteps.push(`x = ${qTex(sol.x)}`);
      if (ok) {
        rows.push({ name: '代回', hint: '角度要在 0°～180°', items: exprItems(`∠${P.n1} = @0°，∠${P.n2} = @1°`, RD_OK, [qIt(v1, RD_OK), qIt(v2, RD_OK)]), color: RD_OK });
        msg = '';
        fbText = `代回去：\\(\\angle ${P.n1} = ${qTex(v1)}^\\circ\\)、\\(\\angle ${P.n2} = ${qTex(v2)}^\\circ\\)，${mode === 'co' ? '加起來剛好 \\(180^\\circ\\)' : '兩個角相等'}。<br>算出 \\(x\\) 之後一定要<strong>代回去</strong>，題目問的常常是角度而不是 \\(x\\)。`;
      } else {
        rows.push({ name: '代回', hint: '', items: exprItems(`∠${P.n1} = @0°，∠${P.n2} = @1°`, RD_CORAL, [qIt(v1, RD_CORAL), qIt(v2, RD_CORAL)]), color: RD_CORAL });
        msg = '代回去有角度不在 0° 到 180° 之間：情境不成立';
        fbText = `解出 \\(x = ${qTex(sol.x)}\\)，但代回去 \\(\\angle ${P.n1} = ${qTex(v1)}^\\circ\\)、\\(\\angle ${P.n2} = ${qTex(v2)}^\\circ\\)，有一個角不在 \\(0^\\circ\\) 到 \\(180^\\circ\\) 之間，<strong>圖上畫不出來</strong>。調一下常數。`;
      }
    }
    drawStepRows(ctx, rows, rows.length, { top: 316, gap: 36, size: 18, eqX: 168, color: INK });
    if (msg) plX(ctx, msg, 458, RD_CORAL, 14);

    out.innerHTML = texSteps.filter(s => s).map(s => wbrEq(s)).join('，<wbr>');
    fb.innerHTML = wrapFeedback(fbText);
    typeset([out, fb]);
  }

  [sa, sb, sc, sd].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-eq-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：好幾條截線、兩組平行線——一步一步傳角度
   ========================================================================== */
function initMultiCanvas() {
  const cv = hbEl('canvas-multi');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('multi-a'), sb = hbEl('multi-b'), va = hbEl('multi-va'), vb = hbEl('multi-vb');
  const rowB = hbEl('multi-b-row');
  const g = hbEl('multi-mode-group');
  const out = hbEl('multi-formula'), fb = hbEl('multi-feedback');
  const C0 = RD_TONE[6];
  const box = { x: 12, y: 44, w: 516, h: 280 };
  let mode = 'two';

  function draw() {
    const W = cv.width, H = cv.height;
    const al = hbClampSlider(sa, 50, 130), be = hbClampSlider(sb, 50, 130);
    va.textContent = al + '°';
    vb.textContent = be + '°';
    rowB.style.display = mode === 'two' ? '' : 'none';
    ctx.clearRect(0, 0, W, H);
    const y1 = 112, y2 = 262;
    plClip(ctx, box, () => {
      plLine(ctx, hbV(0, y1), 0, RD_WHITE, 3);
      plLine(ctx, hbV(0, y2), 0, RD_WHITE, 3);
    });
    plParMark(ctx, hbV(36, y1), 0, RD_WHITE, 1);
    plParMark(ctx, hbV(36, y2), 0, RD_WHITE, 1);
    plTag(ctx, hbV(W - 26, y1 - 16), 'L', '1', RD_WHITE);
    plTag(ctx, hbV(W - 26, y2 - 16), 'L', '2', RD_WHITE);
    let rows, tex, fbText;

    if (mode === 'two') {
      drawTitle(ctx, '兩條截線 M、N 截同一組平行線', C0);
      const M1 = hbV(170 + 75 / Math.tan(al * HB_RAD), y1), N1 = hbV(370 + 75 / Math.tan(be * HB_RAD), y1);
      const M2 = hbCross(M1, hbUnit(al), hbV(0, y2), hbUnit(0));
      const N2 = hbCross(N1, hbUnit(be), hbV(0, y2), hbUnit(0));
      plClip(ctx, box, () => {
        plLine(ctx, M1, al, RD_YELLOW, 3);
        plLine(ctx, N1, be, RD_SKY, 3);
      });
      plLineTag(ctx, M1, al, box, 'M', '', RD_YELLOW, 18);
      plLineTag(ctx, N1, be, box, 'N', '', RD_SKY, -18);
      const sM = plAngles(0, al), sN = plAngles(0, be);
      // 已知：M 與 L1 的左下角（= al）、N 與 L2 的右下角（= 180 − be）
      plSector(ctx, M1, sM[2], 24, RD_YELLOW, { alpha: 0.4, label: `${al}°`, lr: 48, font: f(800, 14) });
      plSector(ctx, N2, sN[3], 24, RD_SKY, { alpha: 0.4, label: `${180 - be}°`, lr: 48, font: f(800, 14) });
      plSector(ctx, M2, sM[1], 24, RD_OK, { alpha: 0.3, label: '1', lr: 44, font: f(800, 16) });
      plSector(ctx, N1, sN[3], 24, RD_OK, { alpha: 0.3, label: '2', lr: 44, font: f(800, 16) });
      plSector(ctx, N1, sN[2], 30, RD_CORAL, { alpha: 0.25, label: '3', lr: 50, font: f(800, 16) });
      rows = [
        [`∠1 = ${al}°`, '和黃色已知角是內錯角（M 截 L_1 // L_2）', RD_OK],
        [`∠2 = ${180 - be}°`, '和藍色已知角是同位角（N 截 L_1 // L_2）', RD_OK],
        [`∠3 = 180° − ${180 - be}° = ${be}°`, '∠2、∠3 合成一個平角', RD_CORAL]
      ];
      tex = [`\\angle 1 = ${al}^\\circ`, `\\angle 2 = ${180 - be}^\\circ`, `\\angle 3 = ${be}^\\circ`];
      fbText = '每一步只用<strong>一條截線、一組平行線</strong>：先找出已知角跟要求的角是什麼關係（同位、內錯、同側內、對頂、補角），再一步一步傳過去。';
    } else {
      drawTitle(ctx, '兩組平行線互相截', C0);
      const A = hbV(150, y1), B = hbV(340, y1);
      const C = hbCross(B, hbUnit(al), hbV(0, y2), hbUnit(0));
      plClip(ctx, box, () => {
        plLine(ctx, A, al, RD_YELLOW, 3);
        plLine(ctx, B, al, RD_YELLOW, 3);
      });
      plParMark(ctx, hbAt(A, al + 180, 80), al, RD_YELLOW, 2);
      plParMark(ctx, hbAt(B, al + 180, 80), al, RD_YELLOW, 2);
      plLineTag(ctx, A, al, box, 'M', '1', RD_YELLOW, 18);
      plLineTag(ctx, B, al, box, 'M', '2', RD_YELLOW, 18);
      const s = plAngles(0, al);
      plSector(ctx, A, s[1], 24, RD_YELLOW, { alpha: 0.4, label: `${al}°`, lr: 50, font: f(800, 14) });
      plSector(ctx, B, s[1], 24, RD_OK, { alpha: 0.3, label: '1', lr: 44, font: f(800, 16) });
      plSector(ctx, C, s[1], 20, RD_SKY, { alpha: 0.18, label: '3', lr: 40, font: f(800, 15), dash: [4, 4] });
      plSector(ctx, C, s[0], 30, RD_CORAL, { alpha: 0.3, label: '2', lr: 52, font: f(800, 16) });
      rows = [
        [`∠1 = ${al}°`, 'L_1 截 M_1 // M_2：同位角相等', RD_OK],
        [`∠3 = ∠1 = ${al}°`, 'M_2 截 L_1 // L_2：同位角相等', RD_SKY],
        [`∠2 = 180° − ${al}° = ${180 - al}°`, '∠2、∠3 合成一個平角', RD_CORAL]
      ];
      tex = [`\\angle 1 = ${al}^\\circ`, `\\angle 2 = ${180 - al}^\\circ`];
      fbText = '兩組平行線時，<strong>每一步都要說清楚是哪一組平行線、哪一條截線</strong>：\\(\\angle 1\\) 用的是 \\(M_1 /\\!/ M_2\\)，\\(\\angle 3\\) 用的是 \\(L_1 /\\!/ L_2\\)。';
    }
    rows.forEach((r, i) => {
      const y = 344 + i * 40;
      drawExpr(ctx, exprItems(r[0], r[2]), 0, y - 8, 17, r[2], { left: 24, maxW: 210, gap: 0 });
      drawExpr(ctx, exprItems(r[1], MUTED), 0, y + 10, 13.5, MUTED, { left: 24, maxW: W - 48, gap: 0 });
    });
    out.innerHTML = tex.map(s => `\\(${s}\\)`).join('，<wbr>');
    fb.innerHTML = wrapFeedback(fbText);
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-multi-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：拐角——過拐點作平行線，或延長一邊
   ========================================================================== */
function initBendCanvas() {
  const cv = hbEl('canvas-bend');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const s1 = hbEl('bend-1'), s2 = hbEl('bend-2'), v1 = hbEl('bend-v1'), v2 = hbEl('bend-v2');
  const gw = hbEl('bend-way-group'), gp = hbEl('bend-pos-group');
  const out = hbEl('bend-formula'), fb = hbEl('bend-feedback');
  const C0 = RD_TONE[7];
  const box = { x: 12, y: 44, w: 516, h: 290 };
  let way = 'par', pos = 'in';

  function draw() {
    const W = cv.width, H = cv.height;
    const t1 = hbClampSlider(s1, 25, 70), t2 = hbClampSlider(s2, 25, 70);
    v1.textContent = t1 + '°';
    v2.textContent = t2 + '°';
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '兩平行線之間的拐角 ∠ABC', C0);
    const yA = 104, yC = 294, B = hbV(290, 199);
    const A = hbV(B.x - (B.y - yA) / Math.tan(t1 * HB_RAD), yA);
    const C = hbV(B.x - (yC - B.y) / Math.tan(t2 * HB_RAD), yC);
    plClip(ctx, box, () => {
      plLine(ctx, hbV(0, yA), 0, RD_WHITE, 3);
      plLine(ctx, hbV(0, yC), 0, RD_WHITE, 3);
    });
    plParMark(ctx, hbV(36, yA), 0, RD_WHITE, 1);
    plParMark(ctx, hbV(36, yC), 0, RD_WHITE, 1);
    plTag(ctx, hbV(W - 26, yA - 16), 'L', '1', RD_WHITE);
    plTag(ctx, hbV(W - 26, yC - 16), 'L', '2', RD_WHITE);

    let D = null;
    if (way === 'par') {
      plClip(ctx, box, () => plLine(ctx, B, 0, RD_YELLOW, 2.4, [9, 6]));
      plTag(ctx, hbV(30, B.y - 16), 'L', '3', RD_YELLOW);
      hbSector(ctx, B, 180 - t1, t1, 34, RD_SKY, { alpha: 0.3, label: '4', lr: 56, font: f(800, 15) });
      hbSector(ctx, B, 180, t2, 34, RD_CORAL, { alpha: 0.3, label: '5', lr: 56, font: f(800, 15) });
    } else {
      D = hbV(B.x + (B.y - yA) / Math.tan(t2 * HB_RAD), yA);
      hbSeg(ctx, B, D, RD_YELLOW, 2.4, [9, 6]);
      hbSector(ctx, D, 180, t2, 26, RD_CORAL, { alpha: 0.3, label: '3', lr: 46, font: f(800, 15) });
      hbDot(ctx, D, RD_YELLOW, 4.5);
      textCenter(ctx, 'D', D.x + 4, D.y - 16, RD_YELLOW, fi(800, 17));
    }
    hbSeg(ctx, A, B, RD_WHITE, 3.4);
    hbSeg(ctx, B, C, RD_WHITE, 3.4);
    hbAngle(ctx, B, A, C, 18, RD_OK, { alpha: 0.18 });
    if (pos === 'in') {
      hbSector(ctx, A, -t1, t1, 26, RD_SKY, { alpha: 0.35, label: `${t1}°`, lr: 50, font: f(800, 14) });
    } else {
      hbSector(ctx, A, 180, 180 - t1, 24, RD_SKY, { alpha: 0.35, label: `${180 - t1}°`, lr: 46, font: f(800, 14) });
      hbSector(ctx, A, -t1, t1, 30, RD_SKY, { alpha: 0.12, label: '1', lr: 52, font: f(800, 14), dash: [4, 4] });
    }
    hbSector(ctx, C, 0, t2, 26, RD_CORAL, { alpha: 0.35, label: `${t2}°`, lr: 50, font: f(800, 14) });
    [[A, 'A', 0, -16], [C, 'C', 0, 18], [B, 'B', 18, 4]].forEach(([P, s, dx, dy]) => {
      hbDot(ctx, P, RD_WHITE, 4.5);
      textCenter(ctx, s, P.x + dx, P.y + dy, RD_WHITE, fi(800, 17));
    });

    const sum = t1 + t2;
    const rows = [];
    if (pos === 'out') rows.push([`∠1 = 180° − ${180 - t1}° = ${t1}°`, '已知角在 A 的另一側：先取補角', RD_SKY]);
    if (way === 'par') {
      rows.push([`∠4 = ∠1 = ${t1}°，∠5 = ∠2 = ${t2}°`, '過 B 作 L_3 // L_1，兩組內錯角相等', RD_YELLOW]);
      rows.push([`∠ABC = ∠4 + ∠5 = ${t1}° + ${t2}° = ${sum}°`, '', RD_OK]);
    } else {
      rows.push([`∠3 = ${t2}°`, '延長 CB 交 L_1 於 D：內錯角相等', RD_YELLOW]);
      rows.push([`∠ABC = ∠1 + ∠3 = ${t1}° + ${t2}° = ${sum}°`, '△ABD 的外角 = 兩個內對角的和', RD_OK]);
    }
    rows.forEach((r, i) => {
      const y = 352 + i * (rows.length === 3 ? 36 : 44);
      plX(ctx, r[0], r[1] ? y - 8 : y, r[2], 16.5);
      if (r[1]) plX(ctx, r[1], y + 11, MUTED, 13.5);
    });

    const pre = pos === 'out' ? `\\angle 1 = 180^\\circ - ${180 - t1}^\\circ = ${t1}^\\circ` : '';
    out.innerHTML = (pre ? wbrEq(pre) + '，<wbr>' : '') + wbrEq(`\\angle ABC = ${t1}^\\circ + ${t2}^\\circ = ${sum}^\\circ`);
    fb.innerHTML = wrapFeedback(way === 'par'
      ? '過拐點 \\(B\\) 作一條平行線 \\(L_3\\)，把 \\(\\angle ABC\\) 切成兩塊，每一塊都是內錯角，所以<strong>拐角 = 兩邊的角相加</strong>。'
      : '延長 \\(\\overline{CB}\\) 碰到 \\(L_1\\)，平行線把 \\(\\angle 2\\) 搬到 \\(D\\)；\\(\\angle ABC\\) 是 \\(\\triangle ABD\\) 的外角，等於兩個內對角的和——兩種輔助線，答案一樣。');
    typeset([out, fb]);
  }

  [s1, s2].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(gw, 'data-bend-way', v => { way = v; draw(); });
  bindPickGroup(gp, 'data-bend-pos', v => { pos = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：平行線的判別——由角度反過來判斷兩直線平不平行
   截線固定，兩條直線依滑桿的角度轉動；兩線的方向由角度實算
   ========================================================================== */
function initJudgeCanvas() {
  const cv = hbEl('canvas-judge');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('judge-a'), sb = hbEl('judge-b'), va = hbEl('judge-va'), vb = hbEl('judge-vb');
  const la = hbEl('judge-la'), lb = hbEl('judge-lb');
  const g = hbEl('judge-mode-group');
  const out = hbEl('judge-formula'), fb = hbEl('judge-feedback');
  const C0 = RD_TONE[8];
  const box = { x: 12, y: 44, w: 516, h: 290 };
  const TDIR = 100;
  let mode = 'cor';
  const POS = {
    cor: { i1: 1, i2: 1, n1: 2, n2: 6 },
    alt: { i1: 3, i2: 0, n1: 4, n2: 5 },
    co: { i1: 3, i2: 1, n1: 4, n2: 6 }
  };

  function draw() {
    const W = cv.width, H = cv.height;
    const a = hbClampSlider(sa, 40, 140), b = hbClampSlider(sb, 40, 140);
    const P = POS[mode];
    va.textContent = a + '°';
    vb.textContent = b + '°';
    la.textContent = `∠${P.n1}`;
    lb.textContent = `∠${P.n2}`;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '由截角判斷：兩條線平行嗎？', C0);
    // 右上角（plAngles 的 sw[1]）就是 θ：線的方向 = 截線方向 − θ
    const th1 = P.i1 === 1 ? a : 180 - a;
    const th2 = P.i2 === 1 ? b : 180 - b;
    const a1 = TDIR - th1, a2 = TDIR - th2;
    const V1 = hbV(270, 128), V2 = hbAt(V1, TDIR + 180, 140);
    const par = (th1 === th2);
    const s1 = plAngles(a1, TDIR), s2 = plAngles(a2, TDIR);
    const X = par ? null : hbCross(V1, hbUnit(a1), V2, hbUnit(a2));
    plClip(ctx, box, () => {
      plLine(ctx, V1, a1, par ? RD_OK : RD_WHITE, 3);
      plLine(ctx, V2, a2, par ? RD_OK : RD_WHITE, 3);
      plLine(ctx, V1, TDIR, RD_YELLOW, 3);
      if (X && plInside(X, box)) {
        hbDot(ctx, X, RD_NO, 6);
        cgLabel(ctx, X, '交點', RD_NO, 0, -20, f(800, 14));
      }
    });
    for (let n = 1; n <= 8; n++) {
      const V = n <= 4 ? V1 : V2, sec = (n <= 4 ? s1 : s2)[(n - 1) % 4];
      const hot = (n === P.n1 || n === P.n2);
      if (hot) {
        const col = n === P.n1 ? RD_SKY : RD_CORAL;
        plSector(ctx, V, sec, 28, col, { alpha: 0.4 });
        plLab(ctx, plIn(V, sec, sec.sw < 55 ? 64 : 50), `∠${n}=${plDeg(sec.sw)}°`, col, 14);
      } else {
        plLab(ctx, plIn(V, sec, 24), String(n), RD_FAINT, 12);
      }
    }
    plLineTag(ctx, V1, a1, box, 'L', '1', par ? RD_OK : RD_WHITE);
    plLineTag(ctx, V2, a2, box, 'L', '2', par ? RD_OK : RD_WHITE);
    plLineTag(ctx, V1, TDIR, box, 'M', '', RD_YELLOW, 18);

    let line1, ok, tex;
    if (mode === 'co') {
      ok = (a + b === 180);
      line1 = `∠4 + ∠6 = ${a}° + ${b}° = ${a + b}°${ok ? '' : ' ≠ 180°'}`;
      tex = `\\angle 4 + \\angle 6 = ${a + b}^\\circ${ok ? '' : ' \\ne 180^\\circ'}`;
    } else {
      ok = (a === b);
      line1 = `∠${P.n1} = ${a}°，∠${P.n2} = ${b}°${ok ? '：相等' : '：不相等'}`;
      tex = ok ? `\\angle ${P.n1} = \\angle ${P.n2} = ${a}^\\circ` : `\\angle ${P.n1} \\ne \\angle ${P.n2}`;
    }
    const rel = { cor: '同位角相等', alt: '內錯角相等', co: '同側內角互補' }[mode];
    plX(ctx, line1, 360, ok ? RD_OK : RD_CORAL, 18);
    plX(ctx, ok ? `${rel} ⇒ L_1 // L_2` : `不是「${rel}」⇒ L_1、L_2 不平行`, 394, ok ? RD_OK : RD_CORAL, 17);
    if (!ok) {
      const side = X.x < V1.x ? '左' : '右';
      plX(ctx, plInside(X, box) ? '兩條線在畫面裡就相交了' : `兩線往${side}延長會相交`, 428, MUTED, 14);
    } else {
      plX(ctx, '把兩條線一直延長也不會相交', 428, MUTED, 14);
    }
    out.innerHTML = `\\(${tex}\\)` + (ok ? '，<wbr>\\(L_1 /\\!/ L_2\\)' : '');
    fb.innerHTML = wrapFeedback(ok
      ? `<strong>${rel}</strong>，兩直線就互相平行。這是截角性質<strong>反過來</strong>用：由角度推出平行。`
      : `差一點點也不行：${mode === 'co' ? '兩角的和不是 \\(180^\\circ\\)' : '兩角不相等'}，兩條線遲早會相交。<br>眼睛看起來平行不算數，要用角度判斷。`);
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-judge-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：角平分線與平行——平分兩個相等的角，平分線也平行
   ========================================================================== */
function initBisCanvas() {
  const cv = hbEl('canvas-bis');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const stt = hbEl('bis-t'), vt = hbEl('bis-vt');
  const g = hbEl('bis-mode-group');
  const out = hbEl('bis-formula'), fb = hbEl('bis-feedback');
  const C0 = RD_TONE[9];
  const box = { x: 12, y: 44, w: 516, h: 290 };
  let mode = 'alt';

  function draw() {
    const W = cv.width, H = cv.height;
    const t = hbClampSlider(stt, 40, 140);
    vt.textContent = t + '°';
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, 'AB // CD：把兩個截角各分一半', C0);
    const yA = 140, yC = 284;
    const E = hbV(250, yA), G = hbCross(E, hbUnit(t), hbV(0, yC), hbUnit(0));
    plClip(ctx, box, () => {
      plLine(ctx, E, t, RD_YELLOW, 3);
    });
    hbSeg(ctx, hbV(24, yA), hbV(W - 24, yA), RD_WHITE, 3);
    hbSeg(ctx, hbV(24, yC), hbV(W - 24, yC), RD_WHITE, 3);
    plParMark(ctx, hbV(60, yA), 0, RD_WHITE, 1);
    plParMark(ctx, hbV(60, yC), 0, RD_WHITE, 1);
    [['A', 16, yA], ['B', W - 16, yA], ['C', 16, yC], ['D', W - 16, yC]].forEach(([s, x, y]) =>
      textCenter(ctx, s, x, y, RD_WHITE, fi(800, 17)));
    cgLabel(ctx, E, 'E', RD_WHITE, t > 90 ? 14 : -14, -16, fi(800, 17));
    cgLabel(ctx, G, 'G', RD_WHITE, t > 90 ? -14 : 14, 17, fi(800, 17));

    let dE, dG, aE0, aE, aG0, aG, rows, tex, fbText;
    if (mode === 'alt') {
      aE0 = 180; aE = t;            // ∠AEG：E→A（180°）到 E→G（t + 180）
      aG0 = 0; aG = t;              // ∠EGD：G→D（0°）到 G→E（t）
    } else if (mode === 'cor') {
      aE0 = 0; aE = t;              // ∠IEB：E→B（0°）到 E→I（t）
      aG0 = 0; aG = t;              // ∠EGD
    } else {
      aE0 = t + 180; aE = 180 - t;  // ∠BEG：E→G（t + 180）到 E→B（360）
      aG0 = 0; aG = t;              // ∠DGE
    }
    dE = aE0 + aE / 2;
    dG = aG0 + aG / 2;
    const hE = aE / 2, hG = aG / 2;
    hbSector(ctx, E, aE0, aE, 22, RD_SKY, { alpha: 0.16 });
    hbSector(ctx, G, aG0, aG, 22, RD_CORAL, { alpha: 0.16 });
    hbSector(ctx, E, mode === 'co' ? aE0 : dE, hE, 40, RD_SKY, { alpha: 0.35, label: '1', lr: 58, font: f(800, 15) });
    hbSector(ctx, G, dG, hG, 40, RD_CORAL, { alpha: 0.35, label: '2', lr: 58, font: f(800, 15) });
    if (mode === 'cor') {
      const I = hbAt(E, t, 60);
      cgLabel(ctx, I, 'I', RD_WHITE, 14, 0, fi(800, 16));
    }
    if (mode === 'co') {
      const K = hbCross(E, hbUnit(dE), G, hbUnit(dG));
      hbSeg(ctx, E, K, RD_OK, 3);
      hbSeg(ctx, G, K, RD_OK, 3);
      plAngleR(ctx, K, E, G, 16, RD_OK, { alpha: 0.35 });
      cgLabel(ctx, K, 'I', RD_OK, 14, 0, fi(800, 17));
      rows = [
        [`∠BEG + ∠DGE = ${180 - t}° + ${t}° = 180°`, '同側內角互補', RD_WHITE],
        [`∠1 + ∠2 = ${plDeg(hE)}° + ${plDeg(hG)}° = 90°`, '各取一半', RD_SKY],
        ['∠EIG = 180° − 90° = 90°', '△EGI 的內角和是 180°：平分線互相垂直', RD_OK]
      ];
      tex = `\\angle 1 + \\angle 2 = 90^\\circ,\\ \\angle EIG = 90^\\circ`;
      fbText = '同側內角<strong>互補</strong>，各取一半加起來是 \\(90^\\circ\\)，兩條平分線就<strong>互相垂直</strong>——不是平行。';
    } else {
      const reach = (V, d) => Math.min(150, hbDist(V, plEndIn(V, d, box, 22)));
      const F = hbAt(E, dE, reach(E, dE)), Hh = hbAt(G, dG, reach(G, dG));
      plClip(ctx, box, () => {
        plLine(ctx, E, dE, RD_OK, 1.6, [6, 6]);
        plLine(ctx, G, dG, RD_OK, 1.6, [6, 6]);
      });
      hbSeg(ctx, E, F, RD_OK, 3.2);
      hbSeg(ctx, G, Hh, RD_OK, 3.2);
      cgLabel(ctx, F, 'F', RD_OK, 0, 16, fi(800, 17));
      cgLabel(ctx, Hh, 'H', RD_OK, 0, -16, fi(800, 17));
      const big = mode === 'alt' ? '∠AEG = ∠EGD' : '∠IEB = ∠EGD';
      rows = [
        [`${big} = ${t}°`, mode === 'alt' ? '內錯角相等（AB // CD）' : '同位角相等（AB // CD）', RD_WHITE],
        [`∠1 = ∠2 = ${plDeg(t / 2)}°`, '相等的角，各取一半也相等', RD_SKY],
        ['EF // GH', mode === 'alt' ? '∠1、∠2 是 EF、GH 被 EG 所截的內錯角' : '∠1、∠2 是 EF、GH 被直線 EG 所截的同位角', RD_OK]
      ];
      tex = `\\angle 1 = \\angle 2 = ${hbDegTex(t, 2)},\\ \\overline{EF} /\\!/ \\overline{GH}`;
      fbText = `平行線先給出一組${mode === 'alt' ? '內錯角' : '同位角'}相等，平分後的兩半也相等；兩半又剛好是 \\(\\overline{EF}\\)、\\(\\overline{GH}\\) 的${mode === 'alt' ? '內錯角' : '同位角'}，所以<strong>平分線也平行</strong>。`;
    }
    rows.forEach((r, i) => {
      const y = 352 + i * 38;
      plX(ctx, r[0], y - 7, r[2], 16.5);
      plX(ctx, r[1], y + 11, MUTED, 13);
    });
    out.innerHTML = `\\(${tex}\\)`;
    fb.innerHTML = wrapFeedback(fbText);
    typeset([out, fb]);
  }

  stt.addEventListener('input', draw);
  bindPickGroup(g, 'data-bis-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 11：過線外一點作平行線——三角板＋直尺、尺規等角作圖
   作圖的點一律由圓與圓、直線與圓真的求交得到
   ========================================================================== */
function initBuildCanvas() {
  const cv = hbEl('canvas-build');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = hbEl('build-p'), vp = hbEl('build-vp');
  const g = hbEl('build-mode-group');
  const out = hbEl('build-formula'), fb = hbEl('build-feedback');
  const C0 = RD_TONE[10];
  const st = { k: 1 };
  let mode = 'cor';
  const yL = 332, yP = 180, KD = 60, R = 58;

  function triangle(cx, cy, alpha) {
    // 直角在左下，水平邊（貼 L 的那一邊）長 130，鉛直邊長 86
    const P0 = hbV(cx, cy), P1 = hbV(cx + 130, cy), P2 = hbV(cx, cy - 86);
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    hbPoly(ctx, [P0, P1, P2], RD_SKY, 0.16, 2.2);
    hbSector(ctx, P0, 0, 90, 14, RD_SKY, { right: true, alpha: 0.3 });
    ctx.restore();
  }

  function rulerV(x, y0, y1) {
    ctx.save();
    ctx.fillStyle = 'rgba(234, 205, 140, 0.13)';
    ctx.strokeStyle = 'rgba(234, 205, 140, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(x - 22, y0, 22, y1 - y0);
    ctx.fill();
    ctx.stroke();
    ctx.translate(x - 11, (y0 + y1) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = 'rgba(254, 243, 199, 0.7)';
    ctx.font = f(600, 11);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('直尺（壓住不動）', 0, 0);
    ctx.restore();
  }

  function draw() {
    const W = cv.width;
    const p = hbClampSlider(sp, 1, 5);
    vp.textContent = p;
    const P = hbV(200 + (p - 1) * 50, yP);
    const given = c => {
      hbSeg(c, hbV(10, yL), hbV(W - 10, yL), RD_WHITE, 3);
      plTag(c, hbV(W - 26, yL - 16), 'L', '', RD_WHITE);
    };
    let steps, pts, measureLine = null, tex, texHtml, fbText, title;

    if (mode === 'tri') {
      title = '方法一：三角板沿著直尺滑上去';
      const Rx = P.x - 56;
      steps = [
        { tool: 'look', text: '三角板直角的一邊貼齊 L。', draw: () => triangle(Rx, yL) },
        { tool: 'ruler', text: '直尺貼齊三角板直角的另一邊（直尺與 L 垂直）。', draw: () => rulerV(Rx, yP - 50, yL + 34) },
        { tool: 'look', text: '直尺壓住不動，三角板沿直尺往上滑，直到那一邊碰到 P。', draw: () => triangle(Rx, yP) },
        {
          tool: 'ruler', text: '沿著三角板的那一邊畫出直線 M：M、L 都垂直於直尺，所以 M // L。', draw: () => {
            hbSeg(ctx, hbV(10, yP), hbV(W - 10, yP), RD_OK, 3);
            plTag(ctx, hbV(W - 26, yP - 16), 'M', '', RD_OK);
          }
        }
      ];
      pts = [{ p: P, n: 'P', s: 0, c: RD_YELLOW, dx: 14, dy: -16 }];
      tex = null;
      texHtml = '直尺同時垂直 \\(M\\)、\\(L\\) <wbr>\\(\\Rightarrow M /\\!/ L\\)';
      fbText = '方法一的理由：<strong>兩直線同時垂直於另一直線，這兩直線互相平行</strong>。直尺若跟著滑動，畫出來的線就不平行了。';
    } else {
      title = mode === 'cor' ? '方法二：在同位角的位置作等角' : '方法二：在內錯角的位置作等角';
      const u = hbUnit(KD);                      // A → P 的方向（canvas 向量）
      const A = hbV(P.x - (yL - yP) / Math.tan(KD * HB_RAD), yL);
      const B = hbV(A.x + R, yL);
      const C = hbV(A.x + u.x * R, A.y + u.y * R);
      const sgn = mode === 'cor' ? 1 : -1;
      const D = hbV(P.x + u.x * R * sgn, P.y + u.y * R * sgn);
      const rBC = cgDist(B, C);
      const cand = cgCC(P, R, D, rBC);
      // cor：E 與 B 在直線 K 的同一側；alt：在另一側
      const sideB = cgSide(A, P, B);
      const E = cand.filter(q => cgSide(A, P, q) === (mode === 'cor' ? sideB : -sideB))[0] || cand[0];
      const Kfar = hbV(P.x + u.x * 140, P.y + u.y * 140), Knear = hbV(A.x - u.x * 50, A.y - u.y * 50);
      const ang1 = cgAngDeg(A, B, P);
      const ang2 = cgAngDeg(P, E, D);
      steps = [
        {
          tool: 'ruler', text: '過 P 任意畫一直線 K，交 L 於 A；K 與 L 的夾角是 ∠1。', ruler: [Knear, Kfar], draw: () => {
            cgSeg(ctx, Knear, Kfar, RD_YELLOW, 2.6);
            cgLabel(ctx, Kfar, 'K', RD_YELLOW, 14, 0, fi(800, 17));
            hbSector(ctx, A, 0, KD, 22, RD_SKY, { alpha: 0.3, label: '1', lr: 38, font: f(800, 14) });
          }
        },
        {
          tool: 'compass', text: '以 A 為圓心、適當長為半徑畫弧，交 L 於 B、交 K 於 C。',
          compass: { c: A, r: R, ang: cgAng(A, B) }, draw: () => cgArcAt(ctx, A, R, [B, C], 0.22, RD_YELLOW, 2.2)
        },
        {
          tool: 'compass', text: `以 P 為圓心、同樣半徑畫弧，交 K 於 D（${mode === 'cor' ? '在 P 的上方' : '在 P、A 之間'}）。`,
          compass: { c: P, r: R, ang: cgAng(P, D) }, draw: () => cgArcAt(ctx, P, R, [D, E], 0.3, RD_YELLOW, 2.2)
        },
        {
          tool: 'compass', text: '圓規張開 BC 的長，以 D 為圓心畫弧，交前一弧於 E。',
          compass: { c: D, r: rBC, ang: cgAng(D, E) }, draw: () => {
            cgSeg(ctx, B, C, RD_FAINT, 1.4, [4, 4]);
            cgArcAt(ctx, D, rBC, [E], 0.35, RD_CORAL, 2.2);
          }
        },
        {
          tool: 'ruler', text: `連 PE 畫出直線 M：∠2 = ∠1 是${mode === 'cor' ? '同位角' : '內錯角'}，所以 M // L。`, ruler: [hbV(P.x - (E.x - P.x) * 2.2, P.y - (E.y - P.y) * 2.2), hbV(P.x + (E.x - P.x) * 2.2, P.y + (E.y - P.y) * 2.2)], draw: () => {
            const dir = cgUnit(P, E);
            cgSeg(ctx, hbV(P.x - dir.x * 400, P.y - dir.y * 400), hbV(P.x + dir.x * 400, P.y + dir.y * 400), RD_OK, 3);
            hbAngle(ctx, P, E, D, 22, RD_CORAL, { alpha: 0.3, label: '2', lr: 38, font: f(800, 14) });
            const ml = plEndIn(P, hbHead(P, E), { x: 10, y: 44, w: W - 20, h: 300 }, 22);
            cgLabel(ctx, ml, 'M', RD_OK, 0, -16, fi(800, 17));
          }
        }
      ];
      pts = [
        { p: P, n: 'P', s: 0, c: RD_YELLOW, dx: -14, dy: -14 },
        { p: A, n: 'A', s: 1, c: RD_WHITE, dx: -14, dy: 16 },
        { p: B, n: 'B', s: 2, c: RD_WHITE, dx: 6, dy: 16 },
        { p: C, n: 'C', s: 2, c: RD_WHITE, dx: -14, dy: -6 },
        { p: D, n: 'D', s: 3, c: RD_WHITE, dx: -16, dy: 0 },
        { p: E, n: 'E', s: 4, c: RD_CORAL, dx: 4, dy: -16 }
      ];
      measureLine = [`量一量：∠1 = ${cgDeg(ang1)}°，∠2 = ${cgDeg(ang2)}°`, RD_OK];
      tex = `\\angle 2 = \\angle 1 \\Rightarrow M /\\!/ L`;
      fbText = `方法二的理由：<strong>兩直線被另一直線所截，若${mode === 'cor' ? '同位角' : '內錯角'}相等，則這兩直線互相平行</strong>。等角要畫在${mode === 'cor' ? '同位角' : '內錯角'}的位置。`;
    }
    const n = steps.length;
    cgSync('build', st, n);
    cgRender(ctx, {
      title, color: C0, k: st.k, steps, pts, given,
      measure: st.k === n ? measureLine : null
    });
    out.innerHTML = st.k === n ? (texHtml || `\\(${tex}\\)`) : `步驟 \\(${st.k}\\) / \\(${n}\\)`;
    fb.innerHTML = wrapFeedback(fbText);
    typeset([out, fb]);
  }

  sp.addEventListener('input', draw);
  cgSteps('build', st, draw);
  bindPickGroup(g, 'data-build-mode', v => { mode = v; st.k = 1; draw(); });
  drawWithFonts(draw);
}
