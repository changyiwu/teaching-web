/* ==========================================================================
   5-3-1（第五冊 3-1）證明與推理 — 互動 Canvas 與隨堂評量
   畫風：古希臘陶瓶黑繪風・幾何學院（小歐、阿基），第五冊第 3 章兩節共用。

   共用工具在 ../math-canvas.js（f／fi／drawTitle／wrapFeedback／wbrEq／typeset／
   bindPickGroup／drawWithFonts、hb* 幾何、dk* 混排字 dkRich／dkTag／dkPt…）。
   ⚠️ 本頁不修改共用檔；本節自己的工具一律用 gr 前綴、色票用 GR_ 前綴。

   本檔分三層：
     0. 本節色票（GR_）；
     1. 本節工具（gr）：混排字轉 LaTeX（grTex）、圓角框、點擊命中、回紋飾帶、質數…；
     2. 12 個互動與評量附圖。

   代數的數值一律用整數或 reduce() 化簡的分數精確運算；幾何量（角度、長度）
   由頂點座標算出，只用來顯示「量出來」的近似值，判斷一律走代數條件。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();
  drawWithFonts(initQuizFigs);

  initSortCanvas();
  initChainCanvas();
  initCongCanvas();
  initAddCanvas();
  initSimCanvas();
  initAreaCanvas();
  initFoldCanvas();
  initParCanvas();
  initLetCanvas();
  initCntCanvas();
  initSqCanvas();
  initCmpCanvas();
});

/* ==========================================================================
   0. 本節色票（黑繪陶瓶：赤陶橘、黑、奶油白、暗紅；深色卡片上另加三個亮色）
   ========================================================================== */
const GR_CLAY = '#e8874a';      // 赤陶橘（陶瓶底色）
const GR_CLAY_L = '#f4a873';
const GR_BLACK = '#1a1210';     // 黑繪剪影（只當填色，不當字色）
const GR_CREAM = '#f3e6cc';     // 奶油白（加繪的白）
const GR_WINE = '#b5402f';      // 暗紅（陶瓶上的紫紅加繪）
const GR_RED = '#f07a62';       // 暗紅在深色卡片上的亮版
const GR_OLIVE = '#bccb6e';     // 橄欖葉
const GR_SKY = '#8cc8e8';       // 愛琴海藍
const GR_GOLD = '#f2c25a';      // 金箔
const GR_OK = '#86efac';
const GR_NO = '#fb7185';
const GR_FAINT = 'rgba(243, 230, 204, 0.28)';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const GR_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9', '#fca5a5'];

// dk* 混排字的標籤底色與點的外圈
dkUsePalette({ tagBg: 'rgba(30, 19, 14, 0.9)', rim: 'rgba(22, 14, 10, 0.92)' });

/* ==========================================================================
   1. 本節工具（gr 前綴）
   ========================================================================== */

// 混排字（dkRich 的寫法）轉成 LaTeX：[AB] 上橫線、{a/b} 分數、`字` 直立、中文包 \text{}
const GR_TEX_MAP = {
  '∠': '\\angle ', '△': '\\triangle ', '≅': '\\cong ', '∥': '\\parallel ', '⊥': '\\perp ',
  '°': '^\\circ', '×': '\\times ', '−': '-', '²': '^2', '≈': '\\approx ', '>': '\\gt ',
  '<': '\\lt ', '⇒': '\\Rightarrow ', '∴': '\\therefore ', '∵': '\\because ', '≠': '\\ne ',
  '÷': '\\div ', '∼': '\\sim '
};
const GR_CJK = /[　-〿一-鿿＀-￯]/;

function grTex(str) {
  let out = '';
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (ch === '[') {
      const j = str.indexOf(']', i);
      out += `\\overline{${str.slice(i + 1, j)}}`; i = j + 1; continue;
    }
    if (ch === '{') {
      const j = str.indexOf('}', i);
      const p = str.slice(i + 1, j).split('/');
      out += `\\frac{${grTex(p[0])}}{${grTex(p[1])}}`; i = j + 1; continue;
    }
    if (ch === '`') {
      const j = str.indexOf('`', i + 1);
      out += `\\text{${str.slice(i + 1, j)}}`; i = j + 1; continue;
    }
    if (ch === '√') {
      // √ 後面連續的數字放進根號
      let j = i + 1;
      while (j < str.length && /[0-9]/.test(str[j])) j++;
      out += `\\sqrt{${str.slice(i + 1, j)}}`; i = j; continue;
    }
    if (GR_TEX_MAP[ch]) { out += GR_TEX_MAP[ch]; i++; continue; }
    if (GR_CJK.test(ch)) {
      let j = i;
      while (j < str.length && GR_CJK.test(str[j])) j++;
      out += `\\text{${str.slice(i, j)}}`; i = j; continue;
    }
    out += ch; i++;
  }
  return out;
}

// 一串混排字各自轉 LaTeX，用頓號接起來（可在頓號後換行）
function grTexList(arr) {
  return arr.map(s => `\\(${grTex(s)}\\)`).join('、<wbr>');
}

// 單色一行字（混排）
function grText(ctx, str, x, y, color, size, align, maxW) {
  return dkRich(ctx, [[str, color]], x, y, size || 16, { align: align || 'center', maxW });
}

// 圓角框
function grBox(ctx, x, y, w, h, stroke, fill, alpha, lw) {
  ctx.save();
  if (fill) {
    ctx.globalAlpha = alpha == null ? 0.18 : alpha;
    ctx.fillStyle = fill;
    roundRect(ctx, x, y, w, h, 9);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw || 2;
    roundRect(ctx, x, y, w, h, 9);
    ctx.stroke();
  }
  ctx.restore();
}

// 底部的希臘回紋飾帶（純裝飾，淡淡的）
function grMeander(ctx, y) {
  const W = ctx.canvas.width;
  ctx.save();
  ctx.strokeStyle = 'rgba(232, 135, 74, 0.35)';
  ctx.lineWidth = 1.6;
  ctx.lineJoin = 'miter';
  const u = 5;
  for (let x = 14; x + 4 * u <= W - 14; x += 4 * u) {
    ctx.beginPath();
    ctx.moveTo(x, y + 2 * u);
    ctx.lineTo(x, y);
    ctx.lineTo(x + 3 * u, y);
    ctx.lineTo(x + 3 * u, y + 2 * u);
    ctx.lineTo(x + u, y + 2 * u);
    ctx.lineTo(x + u, y + u);
    ctx.lineTo(x + 2 * u, y + u);
    ctx.stroke();
  }
  ctx.restore();
}

// 畫布點擊：回傳畫布內部座標
function grOnClick(cv, handler) {
  cv.addEventListener('click', e => {
    const p = canvasPos(cv, e);
    handler(p.x, p.y);
  });
}

// 有箭頭的線段（P → Q，箭頭在 Q 端）
function grArrow(ctx, P, Q, color, w) {
  hbSeg(ctx, P, Q, color, w || 2.4);
  const ang = Math.atan2(Q.y - P.y, Q.x - P.x);
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(Q.x, Q.y);
  ctx.lineTo(Q.x - Math.cos(ang) * 13 - Math.sin(ang) * 6, Q.y - Math.sin(ang) * 13 + Math.cos(ang) * 6);
  ctx.lineTo(Q.x - Math.cos(ang) * 13 + Math.sin(ang) * 6, Q.y - Math.sin(ang) * 13 - Math.cos(ang) * 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 平行記號：在 PQ 中點畫一個 > 形箭頭
function grParMark(ctx, P, Q, color, n) {
  const d = hbDist(P, Q) || 1;
  const ux = (Q.x - P.x) / d, uy = (Q.y - P.y) / d;
  const M = hbV((P.x + Q.x) / 2, (P.y + Q.y) / 2);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  for (let i = 0; i < (n || 1); i++) {
    const c = hbV(M.x + ux * i * 7, M.y + uy * i * 7);
    ctx.beginPath();
    ctx.moveTo(c.x - ux * 7 - uy * 6, c.y - uy * 7 + ux * 6);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(c.x - ux * 7 + uy * 6, c.y - uy * 7 - ux * 6);
    ctx.stroke();
  }
  ctx.restore();
}

// 直角記號：在 V 點、沿 V→P 與 V→Q 兩個方向
function grRight(ctx, V, P, Q, color, s) {
  const k = s || 12;
  const dp = hbDist(V, P) || 1, dq = hbDist(V, Q) || 1;
  const a = hbV(V.x + (P.x - V.x) / dp * k, V.y + (P.y - V.y) / dp * k);
  const b = hbV(V.x + (Q.x - V.x) / dq * k, V.y + (Q.y - V.y) / dq * k);
  const c = hbV(a.x + b.x - V.x, a.y + b.y - V.y);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

// 質數判斷（正整數）
function grIsPrime(n) {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

// 最小質因數（n ≥ 2 的合數）
function grSmallFactor(n) {
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return d;
  return n;
}

// 整數在乘號後面要加括號
function grP(v) {
  return v < 0 ? `(${v})` : String(v);
}
function grPT(v) {
  return v < 0 ? `(−${-v})` : String(v);
}
// 畫布上的負號一律用 U+2212
function grN(v) {
  return v < 0 ? `−${-v}` : String(v);
}

// 分數字串（畫布 dkRich 寫法）
function grFrac(n, d) {
  const r = reduce(n, d);
  if (r[1] === 1) return grN(r[0]);
  return (r[0] < 0 ? '−' : '') + `{${Math.abs(r[0])}/${r[1]}}`;
}
function grFracTex(n, d) {
  const r = reduce(n, d);
  return texFrac(r[0], r[1]);
}

// 由頂點座標量角（度，取 0～180）
function grDeg(V, P, Q) {
  return hbAngleDeg(V, P, Q);
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第五冊 3-1 的 24 題正解
  // 正解字母分布：A 6 題、B 6 題、C 6 題、D 6 題（開發約束 36）
  const answers = {
    '3-1-1': 'B',    // 已知只有 OA = OC、∠A = ∠C
    '3-1-2': 'D',    // 可以引用已確認性質
    '3-1-3': 'C',    // 全等 → 角相等 → 垂直
    '3-1-4': 'A',    // 找對應邊的兩個三角形
    '3-1-5': 'C',    // SAS
    '3-1-6': 'A',    // 內錯角、已知、對頂角，ASA
    '3-1-7': 'D',    // 38° + 27° = 65°，SAS
    '3-1-8': 'B',    // 都是 90° + ∠DCG
    '3-1-9': 'A',    // 12 : 8 = 4 : CF，CF = 8/3
    '3-1-10': 'C',   // 6 : 9 = 4 : OD，OD = 6
    '3-1-11': 'D',   // AD = BC = 14，面積 126
    '3-1-12': 'B',   // OA : OC = OB : OD = 2 : 3
    '3-1-13': 'B',   // ∠CED = 75°
    '3-1-14': 'D',   // BD = 6、DC = 12，BC = 18
    '3-1-15': 'C',   // 2m + 7 = 2(m + 3) + 1
    '3-1-16': 'A',   // 2t + 5 = 2(t + 2) + 1
    '3-1-17': 'C',   // 不同字母 2m + 1、2n + 1
    '3-1-18': 'D',   // m + n + 1 是整數
    '3-1-19': 'A',   // 反例 n = 3
    '3-1-20': 'B',   // 正數的平方不一定比本身大
    '3-1-21': 'C',   // 20n
    '3-1-22': 'B',   // 3(3p² + 2p)
    '3-1-23': 'D',   // a = −9、b = 7
    '3-1-24': 'A'    // 一正一負，乘積為負
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
function grFigNames(ctx, list) {
  list.forEach(([P, s, dx, dy]) => dkName(ctx, P, s, GR_CREAM, dx, dy));
}

const GR_QUIZ_FIGS = {
  // Q1：AC 與 BD 交於 O，OA = OC、∠A = ∠C
  q1(ctx) {
    const O = hbV(160, 100);
    const A = hbV(55, 45), C = hbV(265, 155);
    const B = hbV(70, 160), D = hbV(250, 40);
    hbSeg(ctx, A, C, GR_CREAM, 2.2);
    hbSeg(ctx, B, D, GR_CREAM, 2.2);
    hbSeg(ctx, A, B, GR_CLAY, 2.6);
    hbSeg(ctx, C, D, GR_CLAY, 2.6);
    hbTick(ctx, A, O, 1, GR_GOLD);
    hbTick(ctx, O, C, 1, GR_GOLD);
    dkAng(ctx, A, O, B, 22, GR_SKY);
    dkAng(ctx, C, O, D, 22, GR_SKY);
    [A, B, C, D, O].forEach(p => dkPt(ctx, p, GR_CREAM, 3.5));
    grFigNames(ctx, [[A, 'A', -12, -8], [B, 'B', -12, 8], [C, 'C', 12, 8], [D, 'D', 12, -8], [O, 'O', 0, -16]]);
  },

  // Q5：四邊形 ABCD，∠DAB = ∠CBA、AD = BC，對角線 AC、BD
  q5(ctx) {
    const A = hbV(55, 165), B = hbV(265, 165), C = hbV(215, 45), D = hbV(105, 45);
    hbPoly(ctx, [A, B, C, D], GR_CREAM, 0, 2.4);
    hbSeg(ctx, A, C, GR_CLAY, 2.2);
    hbSeg(ctx, B, D, GR_CLAY, 2.2);
    dkAng(ctx, A, B, D, 24, GR_SKY);
    dkAng(ctx, B, A, C, 24, GR_SKY);
    hbTick(ctx, A, D, 1, GR_GOLD);
    hbTick(ctx, B, C, 1, GR_GOLD);
    [A, B, C, D].forEach(p => dkPt(ctx, p, GR_CREAM, 3.5));
    grFigNames(ctx, [[A, 'A', -12, 8], [B, 'B', 12, 8], [C, 'C', 12, -8], [D, 'D', -12, -8]]);
  },

  // Q6：AB 與 CD 交於 O，AC ∥ DB，AO = BO
  q6(ctx) {
    const O = hbV(160, 100);
    const A = hbV(70, 45), B = hbV(250, 155), C = hbV(235, 45), D = hbV(85, 155);
    hbSeg(ctx, A, B, GR_CREAM, 2.2);
    hbSeg(ctx, C, D, GR_CREAM, 2.2);
    hbSeg(ctx, A, C, GR_CLAY, 2.6);
    hbSeg(ctx, D, B, GR_CLAY, 2.6);
    grParMark(ctx, A, C, GR_GOLD);
    grParMark(ctx, D, B, GR_GOLD);
    hbTick(ctx, A, O, 1, GR_SKY);
    hbTick(ctx, O, B, 1, GR_SKY);
    [A, B, C, D, O].forEach(p => dkPt(ctx, p, GR_CREAM, 3.5));
    grFigNames(ctx, [[A, 'A', -13, -6], [B, 'B', 13, 6], [C, 'C', 13, -6], [D, 'D', -13, 6], [O, 'O', -18, 0]]);
  },

  // Q7：AB = AD、AC = AE，∠BAD = ∠CAE = 38°、∠DAC = 27°
  q7(ctx) {
    const A = hbV(160, 178);
    const B = hbAt(A, 141.5, 120), D = hbAt(A, 103.5, 120);
    const C = hbAt(A, 76.5, 92), E = hbAt(A, 38.5, 92);
    [B, D, C, E].forEach(P => hbSeg(ctx, A, P, GR_CREAM, 2.2));
    hbSeg(ctx, B, C, GR_CLAY, 2.4);
    hbSeg(ctx, D, E, GR_SKY, 2.4);
    hbSector(ctx, A, 103.5, 38, 30, GR_GOLD, { alpha: 0.3 });
    hbSector(ctx, A, 76.5, 27, 40, GR_OLIVE, { alpha: 0.25 });
    hbSector(ctx, A, 38.5, 38, 30, GR_GOLD, { alpha: 0.3 });
    dkTag(ctx, '38°', hbAt(A, 122.5, 50).x - 8, hbAt(A, 122.5, 50).y, GR_GOLD, 12);
    dkTag(ctx, '27°', hbAt(A, 90, 58).x, hbAt(A, 90, 58).y, GR_OLIVE, 12);
    dkTag(ctx, '38°', hbAt(A, 57.5, 50).x + 8, hbAt(A, 57.5, 50).y, GR_GOLD, 12);
    [A, B, C, D, E].forEach(p => dkPt(ctx, p, GR_CREAM, 3.5));
    grFigNames(ctx, [[A, 'A', 0, 14], [B, 'B', -12, -6], [D, 'D', -4, -14], [C, 'C', 6, -13], [E, 'E', 13, -4]]);
  },

  // Q8：正方形 ABCD 與正方形 CEFG 共頂點 C，連 BG、DE
  q8(ctx) {
    const s = 86, t = 66, phi = 30;
    const A = hbV(40, 22), B = hbV(40, 22 + s), C = hbV(40 + s, 22 + s), D = hbV(40 + s, 22);
    const G = hbAt(C, phi, t), E = hbAt(C, phi - 90, t);
    const F = hbV(E.x + G.x - C.x, E.y + G.y - C.y);
    hbPoly(ctx, [A, B, C, D], GR_CREAM, 0.06, 2.4);
    hbPoly(ctx, [C, E, F, G], GR_OLIVE, 0.08, 2.4);
    hbSeg(ctx, B, G, GR_CLAY, 2.4);
    hbSeg(ctx, D, E, GR_SKY, 2.4);
    [A, B, C, D, E, F, G].forEach(p => dkPt(ctx, p, GR_CREAM, 3.5));
    grFigNames(ctx, [[A, 'A', -12, -6], [B, 'B', -12, 6], [C, 'C', -8, 15], [D, 'D', 4, -13],
      [E, 'E', -10, 10], [F, 'F', 13, 4], [G, 'G', 6, -13]]);
  },

  // Q9：正方形邊長 12，BE = 4，EF ⊥ AE
  q9(ctx) {
    const k = 150 / 12;
    const A = hbV(85, 22), B = hbV(85, 172), C = hbV(235, 172), D = hbV(235, 22);
    const E = hbV(85 + 4 * k, 172), F = hbV(235, 172 - 8 / 3 * k);
    hbPoly(ctx, [A, B, C, D], GR_CREAM, 0.05, 2.4);
    hbSeg(ctx, A, E, GR_CLAY, 2.4);
    hbSeg(ctx, E, F, GR_SKY, 2.4);
    grRight(ctx, E, A, F, GR_GOLD, 11);
    [A, B, C, D, E, F].forEach(p => dkPt(ctx, p, GR_CREAM, 3.5));
    grFigNames(ctx, [[A, 'A', -12, -6], [B, 'B', -12, 6], [C, 'C', 12, 6], [D, 'D', 12, -6], [E, 'E', 0, 15], [F, 'F', 13, 0]]);
    dkTag(ctx, '4', (B.x + E.x) / 2, B.y + 15, GR_GOLD, 13);
    dkTag(ctx, '12', A.x - 22, (A.y + B.y) / 2, GR_GOLD, 13);
  },

  // Q13：正方形 ABCD 內摺出正三角形 BCE，連 DE
  q13(ctx) {
    const A = hbV(85, 22), B = hbV(85, 172), C = hbV(235, 172), D = hbV(235, 22);
    const E = hbV(160, 172 - 150 * Math.sqrt(3) / 2);
    hbPoly(ctx, [A, B, C, D], GR_CREAM, 0.05, 2.4);
    hbPoly(ctx, [B, C, E], GR_CLAY, 0.18, 2.4);
    hbSeg(ctx, D, E, GR_SKY, 2.4);
    [A, B, C, D, E].forEach(p => dkPt(ctx, p, GR_CREAM, 3.5));
    grFigNames(ctx, [[A, 'A', -12, -6], [B, 'B', -12, 6], [C, 'C', 12, 6], [D, 'D', 12, -6], [E, 'E', -4, -14]]);
  },

  // Q14：AB = AC，∠B = 30°，AD ⊥ AC，AD = 6
  q14(ctx) {
    const u = 260 / 18;
    const B = hbV(30, 172), C = hbV(290, 172);
    const A = hbV(160, 172 - 130 * Math.tan(30 * HB_RAD));
    const D = hbV(30 + 6 * u, 172);
    hbPoly(ctx, [A, B, C], GR_CREAM, 0.05, 2.4);
    hbSeg(ctx, A, D, GR_CLAY, 2.6);
    grRight(ctx, A, D, C, GR_GOLD, 11);
    dkAng(ctx, B, C, A, 34, GR_SKY);
    dkTag(ctx, '30°', B.x + 52, B.y - 11, GR_SKY, 12);
    dkTag(ctx, '6', (A.x + D.x) / 2 - 14, (A.y + D.y) / 2 - 6, GR_GOLD, 13);
    [A, B, C, D].forEach(p => dkPt(ctx, p, GR_CREAM, 3.5));
    grFigNames(ctx, [[A, 'A', 0, -15], [B, 'B', -12, 6], [C, 'C', 12, 6], [D, 'D', 0, 15]]);
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
   重點 1：三段式分揀台
   每一列敘述的正解 k：1 已知、2 求證、3 不是題目給的
   ========================================================================== */
const GR_SORT_TAG = ['未分類', '已知', '求證', '不是題目給的'];
const GR_SORT_COLOR = [MUTED, GR_SKY, GR_GOLD, GR_RED];

const GR_SORT = [
  {
    say: ['四邊形 ABCD 中，[AB] ∥ [DC]、[AB] = [DC]，', '對角線 [AC]、[BD] 交於 O。', '說明 [AO] = [CO]。'],
    pts: { A: [1.2, 0], D: [5.2, 0], B: [0, 3], C: [4, 3], O: [2.6, 1.5] },
    segs: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A', 'C'], ['B', 'D']],
    lab: { A: [-10, -10], D: [10, -10], B: [-10, 10], C: [10, 10], O: [0, -15] },
    rows: [
      { s: '[AB] = [DC]', k: 1, why: '題目在「說明」之前給的條件。' },
      { s: '[AO] = [CO]', k: 2, why: '「說明」後面要推出來的，是求證。' },
      { s: '△ABO ≅ △CDO', k: 3, why: '這是證明途中才證出來的中間結果，題目沒有給。' },
      { s: '[AB] ∥ [DC]', k: 1, why: '題目給的條件。' },
      { s: '[AC] ⊥ [BD]', k: 3, why: '題目沒說對角線互相垂直，不能自己加上去。' }
    ]
  },
  {
    say: ['△ABC 中，D 是 [BC] 的中點，延長 [AD] 到 E，', '使 [DE] = [AD]。', '說明 [AB] ∥ [CE]。'],
    pts: { A: [2, 0], B: [0, 3], C: [4.4, 3], D: [2.2, 3], E: [2.4, 6] },
    segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['A', 'E'], ['C', 'E']],
    lab: { A: [0, -14], B: [-12, 0], C: [12, 0], D: [-12, -10], E: [0, 14] },
    rows: [
      { s: '[AD] = [DE]', k: 1, why: '題目給的條件（使 [DE] = [AD]）。' },
      { s: '∠ADB = ∠EDC', k: 3, why: '這是對頂角相等，屬於已確認性質，證明裡可以用，但不是題目給的。' },
      { s: '[AB] ∥ [CE]', k: 2, why: '「說明」後面要推出來的，是求證。' },
      { s: '[BD] = [CD]', k: 1, why: '「D 是 [BC] 的中點」就是 [BD] = [CD]，是題目給的。' },
      { s: '[AB] = [AC]', k: 3, why: '圖上看起來差不多，但題目沒有說這是等腰三角形。' }
    ]
  },
  {
    say: ['△ABC 中，[AB] = [AC]，D、E 在 [BC] 上，', '而且 [BD] = [CE]。', '說明 [AD] = [AE]。'],
    pts: { A: [2.5, 0], B: [0, 3.5], C: [5, 3.5], D: [1.6, 3.5], E: [3.4, 3.5] },
    segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['A', 'D'], ['A', 'E']],
    lab: { A: [0, -14], B: [-12, 4], C: [12, 4], D: [0, 15], E: [0, 15] },
    rows: [
      { s: '∠B = ∠C', k: 3, why: '由 [AB] = [AC] 推出來的（等腰三角形兩底角相等），是已確認性質，不是題目給的。' },
      { s: '[AB] = [AC]', k: 1, why: '題目給的條件。' },
      { s: '[AD] = [AE]', k: 2, why: '「說明」後面要推出來的，是求證。' },
      { s: '[BD] = [CE]', k: 1, why: '題目給的條件。' },
      { s: '[AD] ⊥ [BC]', k: 3, why: '題目沒有給，而且 D 不是中點，[AD] 根本不垂直 [BC]。' }
    ]
  }
];

function grDrawFig(ctx, F, box) {
  const keys = Object.keys(F.pts);
  const raw = keys.map(k => hbV(F.pts[k][0], F.pts[k][1]));
  const fit = hbFit(raw, box);
  const P = {};
  keys.forEach((k, i) => { P[k] = fit[i]; });
  F.segs.forEach(([a, b]) => hbSeg(ctx, P[a], P[b], GR_CREAM, 2.2));
  keys.forEach(k => {
    dkPt(ctx, P[k], GR_CLAY, 3.8);
    dkName(ctx, P[k], k, GR_CREAM, F.lab[k][0], F.lab[k][1]);
  });
  return P;
}

function initSortCanvas() {
  const cv = hbEl('canvas-sort');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const out = hbEl('sort-formula'), fb = hbEl('sort-feedback');
  const C0 = GR_TONE[0];
  const ROW0 = 248, ROWH = 44;
  let prob = 0;
  let tags = [0, 0, 0, 0, 0];

  function draw() {
    const W = cv.width;
    const F = GR_SORT[prob];
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '三段式分揀台：點一下每一列來分類', C0);

    grBox(ctx, 14, 44, 186, 180, GR_FAINT, GR_CLAY, 0.06, 1.4);
    grDrawFig(ctx, F, { x: 40, y: 64, w: 134, h: 140 });
    F.say.forEach((line, i) => grText(ctx, line, 214, 78 + i * 34, GR_CREAM, 16, 'left', W - 230));

    const done = tags.every(t => t > 0);
    let right = 0;
    F.rows.forEach((r, i) => {
      const y = ROW0 + i * ROWH;
      const t = tags[i];
      const ok = t === r.k;
      if (done && ok) right++;
      grBox(ctx, 14, y - 19, W - 28, 38, done ? (ok ? GR_OK : GR_NO) : GR_FAINT, GR_SORT_COLOR[t], t ? 0.14 : 0.04, done ? 2 : 1.2);
      grBox(ctx, 22, y - 14, 128, 28, GR_SORT_COLOR[t], GR_SORT_COLOR[t], t ? 0.3 : 0.08, 1.6);
      grText(ctx, GR_SORT_TAG[t], 86, y, t ? GR_CREAM : MUTED, 14);
      grText(ctx, r.s, 170, y, GR_CREAM, 18, 'left', 290);
      if (done) grText(ctx, ok ? '✓' : '✗', W - 34, y, ok ? GR_OK : GR_NO, 20);
    });

    const left = tags.filter(t => t === 0).length;
    const yb = ROW0 + 5 * ROWH + 4;
    if (!done) {
      grText(ctx, `還有 ${left} 列沒分類（點一下換下一類）`, W / 2, yb, MUTED, 15);
    } else {
      grText(ctx, right === 5 ? '全部分對了！' : `分對 ${right} / 5 列：紅框那幾列再想一想`, W / 2, yb, right === 5 ? GR_OK : GR_GOLD, 17);
    }
    grText(ctx, '提示：「說明」前面是已知、後面是求證', W / 2, yb + 30, MUTED, 13.5);
    grMeander(ctx, cv.height - 16);

    const kn = F.rows.filter((r, i) => tags[i] === 1).map(r => r.s);
    const qz = F.rows.filter((r, i) => tags[i] === 2).map(r => r.s);
    out.innerHTML = `已知：${kn.length ? grTexList(kn) : '（還沒放）'}；<wbr>求證：${qz.length ? grTexList(qz) : '（還沒放）'}`;

    let html;
    if (!done) {
      html = '點畫布上的每一列，依序切換成「已知 → 求證 → 不是題目給的」。<strong>已確認性質</strong>（對頂角、等腰底角……）和<strong>中間結果</strong>都可以寫進證明，但它們不是題目給的已知。';
    } else {
      const wrong = F.rows.map((r, i) => ({ r, t: tags[i] })).filter(o => o.t !== o.r.k);
      const pick = wrong.length ? wrong : F.rows.filter(r => r.k === 3).map(r => ({ r }));
      html = (wrong.length ? '再看一次：' : '分得很好！「不是題目給的」那幾列：') +
        pick.map(o => `\\(${grTex(o.r.s)}\\)——${o.r.why.replace(/\[([A-Z]+)\]/g, '\\(\\overline{$1}\\)')}`).join('<br>');
    }
    fb.innerHTML = wrapFeedback(html);
    typeset([out, fb]);
  }

  grOnClick(cv, (x, y) => {
    for (let i = 0; i < 5; i++) {
      const yc = ROW0 + i * ROWH;
      if (y >= yc - 20 && y <= yc + 20 && x >= 14 && x <= cv.width - 14) {
        tags[i] = (tags[i] + 1) % 4;
        draw();
        return;
      }
    }
  });
  bindPickGroup(hbEl('sort-prob-group'), 'data-sort-prob', v => { prob = parseInt(v, 10); tags = [0, 0, 0, 0, 0]; draw(); });
  hbEl('sort-reset').addEventListener('click', () => { tags = [0, 0, 0, 0, 0]; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：推理迷宮（分析逆推 ↔ 書寫順推）
   lv[0] 是求證；最後一層是已知或已確認性質。p 是上一層的哪一個方塊。
   why[i] 是「由第 i 層推到第 i − 1 層」的理由。
   ========================================================================== */
const GR_CHAIN = [
  {
    say: ['[AB] 與 [CD] 交於 O，[OA] = [OB]、[OC] = [OD]，', '說明 [AC] = [BD]。'],
    lv: [
      [{ s: '[AC] = [BD]', tag: '求證' }],
      [{ s: '△AOC ≅ △BOD', p: 0 }],
      [{ s: '[OA] = [OB]', p: 0, tag: '已知' }, { s: '∠AOC = ∠BOD', p: 0, tag: '對頂角' }, { s: '[OC] = [OD]', p: 0, tag: '已知' }]
    ],
    why: ['', '對應邊相等', '`SAS` 全等性質'],
    ask: ['要得到 [AC] = [BD]，需要什麼？→ 兩個以它們為對應邊的全等三角形', '要得到 △AOC ≅ △BOD，需要哪三組條件？', '三組條件都有理由（已知、對頂角），分析完成！'],
    wr: ['在 △AOC 和 △BOD 中，∵ [OA] = [OB]、∠AOC = ∠BOD、[OC] = [OD]', '∴ △AOC ≅ △BOD（`SAS` 全等性質）', '故 [AC] = [BD]（對應邊相等）']
  },
  {
    say: ['四邊形 ABCD 中，[AB] = [AD]、[CB] = [CD]，', '說明 ∠B = ∠D。'],
    lv: [
      [{ s: '∠B = ∠D', tag: '求證' }],
      [{ s: '△ABC ≅ △ADC', p: 0 }],
      [{ s: '[AB] = [AD]', p: 0, tag: '已知' }, { s: '[CB] = [CD]', p: 0, tag: '已知' }, { s: '[AC] = [AC]', p: 0, tag: '共用邊' }]
    ],
    why: ['', '對應角相等', '`SSS` 全等性質'],
    ask: ['要得到 ∠B = ∠D，需要什麼？→ 兩個以它們為對應角的全等三角形', '要得到 △ABC ≅ △ADC，需要哪三組條件？', '兩組已知加一條共用邊，分析完成！'],
    wr: ['在 △ABC 和 △ADC 中，∵ [AB] = [AD]、[CB] = [CD]、[AC] = [AC]', '∴ △ABC ≅ △ADC（`SSS` 全等性質）', '故 ∠B = ∠D（對應角相等）']
  },
  {
    say: ['△ABC 中 [AB] = [AC]，D、E 分別是 [AB]、[AC] 的中點，', '說明 ∠ABE = ∠ACD。'],
    lv: [
      [{ s: '∠ABE = ∠ACD', tag: '求證' }],
      [{ s: '△ABE ≅ △ACD', p: 0 }],
      [{ s: '[AB] = [AC]', p: 0, tag: '已知' }, { s: '∠A = ∠A', p: 0, tag: '共用角' }, { s: '[AE] = [AD]', p: 0 }],
      [{ s: '[AE] = {1/2}[AC] = {1/2}[AB] = [AD]', p: 2, tag: '中點、已知' }]
    ],
    why: ['', '對應角相等', '`SAS` 全等性質', '等量的一半相等'],
    ask: ['要得到 ∠ABE = ∠ACD，需要什麼？→ 兩個以它們為對應角的全等三角形', '要得到 △ABE ≅ △ACD，需要哪三組條件？',
      '[AB] = [AC] 已知、∠A 共用；[AE] = [AD] 題目沒給，還要再往下找', '由中點與 [AB] = [AC] 推出 [AE] = [AD]，分析完成！'],
    wr: ['∵ D、E 是中點，[AE] = {1/2}[AC] = {1/2}[AB] = [AD]', '在 △ABE 和 △ACD 中，∵ [AB] = [AC]、∠A = ∠A、[AE] = [AD]',
      '∴ △ABE ≅ △ACD（`SAS` 全等性質）', '故 ∠ABE = ∠ACD（對應角相等）']
  }
];

function initChainCanvas() {
  const cv = hbEl('canvas-chain');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const ss = hbEl('chain-s'), vs = hbEl('chain-vs');
  const out = hbEl('chain-formula'), fb = hbEl('chain-feedback');
  const C1 = GR_TONE[1];
  let prob = 0, mode = 'ana';

  function layout(F) {
    const L = F.lv.length;
    const top = 118, bot = 352;
    const gap = (bot - top) / (L - 1);
    const pos = [];
    F.lv.forEach((row, i) => {
      const y = top + i * gap;
      if (row.length === 1 && i > 0 && F.lv[i - 1].length > 1) {
        // 只接在上一層某一個方塊下面
        ctx.font = f(700, 16);
        const par = pos[i - 1][row[0].p];
        const w = Math.min(cv.width - 28, Math.max(200, ctx.measureText(row[0].s).width + 40));
        let x = par.x - w / 2;
        x = Math.max(14, Math.min(cv.width - 14 - w, x));
        pos.push([{ x: x + w / 2, y, w }]);
      } else {
        const n = row.length;
        const w = n === 1 ? 260 : (cv.width - 28 - (n - 1) * 10) / n;
        pos.push(row.map((b, j) => ({ x: 14 + w / 2 + j * (w + 10) + (n === 1 ? (cv.width - 28 - w) / 2 : 0), y, w })));
      }
    });
    return pos;
  }

  function draw() {
    const W = cv.width;
    const F = GR_CHAIN[prob];
    const L = F.lv.length;
    const s = hbClampSlider(ss, 1, L);
    vs.textContent = s;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'ana' ? '分析：從求證往下問「需要什麼？」' : '書寫：從已知往上寫「因為……所以……」', C1);
    F.say.forEach((line, i) => grText(ctx, line, W / 2, 54 + i * 24, GR_CREAM, 15));

    const pos = layout(F);
    // 這一步看得到哪幾層
    const shown = i => (mode === 'ana' ? i < s : i >= L - s);
    const cur = mode === 'ana' ? s - 1 : L - s;

    // 連線（先畫線再畫方塊）
    for (let i = 1; i < L; i++) {
      if (!(shown(i) && shown(i - 1))) continue;
      F.lv[i].forEach((b, j) => {
        const me = pos[i][j], par = pos[i - 1][b.p];
        const P = hbV(par.x, par.y + 20), Q = hbV(me.x, me.y - 20);
        if (mode === 'ana') grArrow(ctx, P, Q, GR_FAINT, 2);
        else grArrow(ctx, Q, P, GR_CLAY_L, 2.2);
      });
      if (mode === 'write') {
        const par = pos[i - 1][F.lv[i][0].p];
        const my = (pos[i][0].y + par.y) / 2;
        dkRich(ctx, [[F.why[i], GR_GOLD]], par.x, my, 13.5, { bg: true });
      }
    }

    F.lv.forEach((row, i) => {
      if (!shown(i)) return;
      row.forEach((b, j) => {
        const p = pos[i][j];
        const isGoal = i === 0;
        const isLeaf = !!b.tag && i > 0;
        const col = isGoal ? GR_GOLD : (isLeaf ? GR_SKY : GR_CLAY_L);
        grBox(ctx, p.x - p.w / 2, p.y - 20, p.w, 40, col, col, i === cur ? 0.26 : 0.1, i === cur ? 2.6 : 1.6);
        grText(ctx, b.s, p.x, p.y, GR_CREAM, 16, 'center', p.w - 12);
        if (b.tag) dkRich(ctx, [[b.tag, isGoal ? GR_GOLD : GR_SKY]], p.x, p.y + 30, 12.5, { bg: true });
      });
    });

    // 底部：這一步的文字
    const lineY = 412;
    if (mode === 'ana') {
      grText(ctx, `第 ${s} 步：${F.ask[s - 1]}`, W / 2, lineY, GR_CREAM, 15.5);
      grText(ctx, s < L ? '把「步驟」往右拉，繼續往下問' : '換成「書寫」，看正式證明怎麼倒過來寫', W / 2, lineY + 36, MUTED, 13.5);
    } else {
      F.wr.slice(0, s).forEach((t, k) => grText(ctx, t, W / 2, lineY - 14 * (s - 1) + k * 28, k === s - 1 ? GR_CREAM : MUTED, 14.5));
      if (s === L) grText(ctx, '寫的順序剛好和分析相反', W / 2, 486, GR_OK, 14);
    }
    grMeander(ctx, cv.height - 16);

    // 數值列：這一步的敘述（LaTeX）
    if (mode === 'ana') {
      out.innerHTML = '需要：' + grTexList(F.lv[cur].map(b => b.s));
    } else {
      out.innerHTML = grTexList(F.lv[cur].map(b => b.s)) + (cur === 0 ? '（得證）' : '');
    }
    const html = mode === 'ana'
      ? '<strong>分析</strong>是從求證出發往回找：每一層問「要得到它，需要先知道什麼？」，直到每個方塊都是<strong>已知</strong>或<strong>已確認性質</strong>（藍色）。'
      : '<strong>書寫</strong>的方向和分析相反：從最下面的已知寫起，每一步附上理由（金色標籤），最後才寫到求證。';
    fb.innerHTML = wrapFeedback(html);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('chain-prob-group'), 'data-chain-prob', v => { prob = parseInt(v, 10); ss.value = 1; draw(); });
  bindPickGroup(hbEl('chain-mode-group'), 'data-chain-mode', v => { mode = v; ss.value = 1; draw(); });
  ss.addEventListener('input', draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：全等條件挑選台（等腰三角形兩腰上的高）
   ========================================================================== */
const GR_CONG = [
  {
    tri: ['A', 'B', 'D'], tri2: ['A', 'C', 'E'], name: '△ABD ≅ △ACE',
    conds: [
      { s: '[AB] = [AC]', why: '已知', ok: true, mk: 'AB' },
      { s: '∠A = ∠A', why: '共用角', ok: true, mk: 'angA' },
      { s: '∠ADB = ∠AEC = 90°', why: '高', ok: true, mk: 'right' },
      { s: '[AD] = [AE]', why: '看起來一樣長', ok: false, bad: '還沒證出來（它要等全等之後才知道），不能先拿來用' },
      { s: '[BD] = [CE]', why: '求證', ok: false, bad: '這就是要證的結論，拿來當條件是繞圈子' }
    ]
  },
  {
    tri: ['D', 'B', 'C'], tri2: ['E', 'C', 'B'], name: '△DBC ≅ △ECB',
    conds: [
      { s: '[BC] = [CB]', why: '共用邊', ok: true, mk: 'BC' },
      { s: '∠DCB = ∠EBC', why: '等腰三角形兩底角相等', ok: true, mk: 'base' },
      { s: '∠BDC = ∠CEB = 90°', why: '高', ok: true, mk: 'right' },
      { s: '[DC] = [EB]', why: '看起來一樣長', ok: false, bad: '還沒證出來（它要等全等之後才知道），不能先拿來用' },
      { s: '[BD] = [CE]', why: '求證', ok: false, bad: '這就是要證的結論，拿來當條件是繞圈子' }
    ]
  }
];

// P 在直線 UV 上的垂足
function grFoot(P, U, V) {
  const dx = V.x - U.x, dy = V.y - U.y;
  const t = ((P.x - U.x) * dx + (P.y - U.y) * dy) / (dx * dx + dy * dy);
  return hbV(U.x + dx * t, U.y + dy * t);
}

function initCongCanvas() {
  const cv = hbEl('canvas-cong');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('cong-a'), va = hbEl('cong-va');
  const out = hbEl('cong-formula'), fb = hbEl('cong-feedback');
  const btns = Array.from(document.querySelectorAll('#cong-cond-group .pick-btn'));
  const C2 = GR_TONE[2];
  let pair = 0;
  let sel = [false, false, false, false, false];

  function draw() {
    const W = cv.width;
    const a = hbClampSlider(sa, 30, 80);
    va.textContent = a + '°';
    ctx.clearRect(0, 0, W, cv.height);
    const P = GR_CONG[pair];
    drawTitle(ctx, `目標：證明 BD = CE（選 ${P.name.replace(' ≅ ', ' 與 ')}）`, C2);

    const H0 = 190, hw = H0 * Math.tan(a / 2 * HB_RAD);
    const A = hbV(W / 2, 66), B = hbV(W / 2 - hw, 66 + H0), C = hbV(W / 2 + hw, 66 + H0);
    const D = grFoot(B, A, C), E = grFoot(C, A, B);
    const pt = { A, B, C, D, E };

    const t1 = P.tri.map(k => pt[k]), t2 = P.tri2.map(k => pt[k]);
    hbPoly(ctx, t1, GR_SKY, 0.16, 0.1);
    hbPoly(ctx, t2, GR_CLAY, 0.16, 0.1);
    hbPoly(ctx, [A, B, C], GR_CREAM, 0, 2.2);
    hbSeg(ctx, B, D, GR_SKY, 2.8);
    hbSeg(ctx, C, E, GR_CLAY, 2.8);

    // 已選條件的記號
    P.conds.forEach((c, i) => {
      if (!sel[i] || !c.ok) return;
      if (c.mk === 'AB') { hbTick(ctx, A, B, 1, GR_GOLD); hbTick(ctx, A, C, 1, GR_GOLD); }
      if (c.mk === 'BC') hbTick(ctx, B, C, 2, GR_GOLD);
      if (c.mk === 'angA') dkAng(ctx, A, B, C, 30, GR_OLIVE);
      if (c.mk === 'base') { dkAng(ctx, C, B, A, 26, GR_OLIVE); dkAng(ctx, B, C, A, 26, GR_OLIVE); }
      if (c.mk === 'right') { grRight(ctx, D, B, A, GR_GOLD); grRight(ctx, E, C, A, GR_GOLD); }
    });
    [A, B, C, D, E].forEach(p => dkPt(ctx, p, GR_CREAM, 4));
    const G = hbCentroid([A, B, C]);
    hbVLabel(ctx, A, G, 'A', GR_CREAM, 18);
    hbVLabel(ctx, B, G, 'B', GR_CREAM, 18);
    hbVLabel(ctx, C, G, 'C', GR_CREAM, 18);
    hbVLabel(ctx, D, G, 'D', GR_CREAM, 18);
    hbVLabel(ctx, E, G, 'E', GR_CREAM, 18);

    // 條件清單
    P.conds.forEach((c, i) => {
      const y = 296 + i * 27;
      const on = sel[i];
      const col = on ? (c.ok ? GR_OK : GR_NO) : MUTED;
      grText(ctx, `${i + 1}.  ${c.s}（${c.why}）`, 40, y, col, 15.5, 'left', W - 80);
      if (on) grText(ctx, c.ok ? '✓' : '✗', 24, y, col, 16);
    });

    const okN = P.conds.filter((c, i) => sel[i] && c.ok).length;
    const badI = P.conds.findIndex((c, i) => sel[i] && !c.ok);
    let l1, l2, col;
    if (badI >= 0) {
      l1 = `條件 ${badI + 1} 不能用`;
      l2 = P.conds[badI].bad;
      col = GR_NO;
    } else if (okN < 3) {
      l1 = `已選 ${okN} 個可以用的條件`;
      l2 = `還差 ${3 - okN} 個才湊得出全等性質`;
      col = GR_GOLD;
    } else {
      l1 = `∴ ${P.name}（\`AAS\` 全等性質）`;
      l2 = '故 [BD] = [CE]（對應邊相等）';
      col = GR_OK;
    }
    grText(ctx, l1, W / 2, 440, col, 17);
    grText(ctx, l2, W / 2, 470, col === GR_OK ? GR_OK : GR_CREAM, 15);
    grMeander(ctx, cv.height - 16);

    btns.forEach((b, i) => b.classList.toggle('active', sel[i]));
    const chosen = P.conds.filter((c, i) => sel[i]).map(c => c.s);
    out.innerHTML = chosen.length ? grTexList(chosen) : '還沒選條件';
    let html;
    if (badI >= 0) html = `<strong>要拿掉的條件</strong>：「求證的結論」與「還沒證出來的結果」都不能當理由，圖上看起來相等也不行。`;
    else if (okN === 3) html = `兩組角 \\(+\\) 一組<strong>不夾在中間</strong>的邊，是 \\(\\text{AAS}\\)。拉動頂角：形狀怎麼變，這三個條件都還在——所以證明對<strong>每一個</strong>等腰三角形都成立。`;
    else html = '找三組相等的條件：已知、共用的邊或角、「高」給的直角。換另一組三角形，看看能不能用不同的條件證出同一件事。';
    fb.innerHTML = wrapFeedback(html);
    typeset([out, fb]);
  }

  btns.forEach((b, i) => b.addEventListener('click', () => { sel[i] = !sel[i]; draw(); }));
  bindPickGroup(hbEl('cong-pair-group'), 'data-cong-pair', v => { pair = parseInt(v, 10); sel = [false, false, false, false, false]; draw(); });
  sa.addEventListener('input', draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：外接正三角形／正方形的夾角（等量加法）
   數學座標：A 在原點，AB 方向 270° − α/2、AC 方向 270° + α/2（往下張開）
   ========================================================================== */
function initAddCanvas() {
  const cv = hbEl('canvas-add');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('add-a'), va = hbEl('add-va');
  const sc = hbEl('add-c'), vc = hbEl('add-vc');
  const sst = hbEl('add-s'), vst = hbEl('add-vs');
  const out = hbEl('add-formula'), fb = hbEl('add-feedback');
  const C3 = GR_TONE[3];
  let mode = 'tri';

  // 數學座標（y 朝上）走一段
  const go = (P, deg, len) => hbV(P.x + Math.cos(deg * HB_RAD) * len, P.y + Math.sin(deg * HB_RAD) * len);

  function draw() {
    const W = cv.width;
    const al = hbClampSlider(sa, 30, 85);
    const c = hbClampSlider(sc, 3, 8);
    const st = hbClampSlider(sst, 0, 3);
    va.textContent = al + '°';
    vc.textContent = c;
    vst.textContent = st;
    ctx.clearRect(0, 0, W, cv.height);
    const sq = mode === 'sq';
    const ex = sq ? 90 : 60;
    drawTitle(ctx, sq ? '在 AB、AC 往外作正方形 ABFG、ACDE' : '在 AB、AC 往外作正三角形 ABD、ACE', C3);

    const dB = 270 - al / 2, dC = 270 + al / 2;
    const A0 = hbV(0, 0), B0 = go(A0, dB, 6), C0 = go(A0, dC, c);
    let pts, names, l1, l2, poly1, poly2;
    if (!sq) {
      const D0 = go(A0, dB - 60, 6), E0 = go(A0, dC + 60, c);
      pts = [A0, B0, C0, D0, E0]; names = ['A', 'B', 'C', 'D', 'E'];
      poly1 = [0, 1, 3]; poly2 = [0, 2, 4];
      l1 = [1, 4]; l2 = [3, 2];   // BE、DC
    } else {
      const G0 = go(A0, dB - 90, 6), F0 = hbV(B0.x + G0.x, B0.y + G0.y);
      const E0 = go(A0, dC + 90, c), D0 = hbV(C0.x + E0.x, C0.y + E0.y);
      pts = [A0, B0, C0, G0, F0, E0, D0]; names = ['A', 'B', 'C', 'G', 'F', 'E', 'D'];
      poly1 = [0, 1, 4, 3]; poly2 = [0, 2, 6, 5];
      l1 = [1, 5]; l2 = [2, 3];   // BE、CG
    }
    // 數學座標轉畫布：翻轉 y 再等比例放進框裡
    const flip = pts.map(p => hbV(p.x, -p.y));
    const P = hbFit(flip, { x: 40, y: 50, w: W - 80, h: 250 });
    const k = hbDist(P[0], P[1]) / 6;

    hbPoly(ctx, poly1.map(i => P[i]), GR_SKY, 0.12, 2);
    hbPoly(ctx, poly2.map(i => P[i]), GR_OLIVE, 0.12, 2);
    hbPoly(ctx, [P[0], P[1], P[2]], GR_CREAM, 0.06, 2.4);

    // 小角：∠BAC（金）與兩個外加的角（紅）；大角：等量加法的兩個和（步驟 1 起）
    const outB = poly1[poly1.length - 1], outC = poly2[poly2.length - 1];
    dkAng(ctx, P[0], P[1], P[2], 22, GR_GOLD);
    dkAng(ctx, P[0], P[outB], P[1], 22, GR_RED);
    dkAng(ctx, P[0], P[2], P[outC], 22, GR_RED);
    if (st >= 1) {
      hbAngle(ctx, P[0], P[outB], P[2], 48, GR_SKY, { alpha: 0.08, lw: 2.4 });
      hbAngle(ctx, P[0], P[1], P[outC], 64, GR_CLAY, { alpha: 0.08, lw: 2.4 });
    }

    hbSeg(ctx, P[l1[0]], P[l1[1]], GR_CLAY_L, 3);
    hbSeg(ctx, P[l2[0]], P[l2[1]], GR_SKY, 3);
    P.forEach(p => dkPt(ctx, p, GR_CREAM, 3.8));
    const G = hbCentroid(P);
    names.forEach((n, i) => {
      if (i === 0) dkName(ctx, P[0], 'A', GR_CREAM, 0, -16);
      else hbVLabel(ctx, P[i], G, n, GR_CREAM, 16);
    });

    // 量出來的長度（由座標算，只是顯示）
    const len1 = hbDist(P[l1[0]], P[l1[1]]) / k, len2 = hbDist(P[l2[0]], P[l2[1]]) / k;
    const nm1 = names[l1[0]] + names[l1[1]], nm2 = names[l2[0]] + names[l2[1]];
    const sOut = sq ? 'G' : 'D', sOut2 = 'E';
    const big = al + ex;
    grText(ctx, `量量看：[${nm1}] ≈ ${len1.toFixed(2)}、[${nm2}] ≈ ${len2.toFixed(2)}`, W / 2, 326, GR_CREAM, 16);
    grText(ctx, `∠${sOut}AC = ${ex}° + ${al}° = ${big}°，∠BA${sOut2} = ${al}° + ${ex}° = ${big}°`, W / 2, 356, GR_GOLD, 15.5);

    const proof = sq ? [
      `① ∠GAB = ∠CAE = 90°，各加上 ∠BAC：∠GAC = ∠BAE（等量加法）`,
      `② [AG] = [AB]、[AC] = [AE]（正方形）⇒ △AGC ≅ △ABE（\`SAS\`）`,
      `③ 故 [CG] = [BE]（對應邊相等）`
    ] : [
      `① ∠DAB = ∠CAE = 60°，各加上 ∠BAC：∠DAC = ∠BAE（等量加法）`,
      `② [AD] = [AB]、[AC] = [AE]（正三角形）⇒ △ADC ≅ △ABE（\`SAS\`）`,
      `③ 故 [DC] = [BE]（對應邊相等）`
    ];
    proof.forEach((t, i) => {
      if (st > i) grText(ctx, t, W / 2, 392 + i * 30, i === 2 ? GR_OK : GR_CREAM, 14.5);
    });
    if (st === 0) grText(ctx, '把「證明步驟」往右拉，一步一步看推理', W / 2, 410, MUTED, 14);
    grMeander(ctx, cv.height - 16);

    out.innerHTML = wbrEq(`\\angle ${sOut}AC = ${ex}^\\circ + ${al}^\\circ = ${big}^\\circ = \\angle BA${sOut2}`);
    const html = sq
      ? `兩個 \\(90^\\circ\\) 各加上同一個 \\(\\angle BAC\\)，和仍然相等——這就是<strong>等量加法</strong>。夾角湊出來之後，兩邊 \\(\\overline{AG} = \\overline{AB}\\)、\\(\\overline{AC} = \\overline{AE}\\) 都是正方形的邊，\\(\\text{SAS}\\) 就成立了。`
      : `兩個 \\(60^\\circ\\) 各加上同一個 \\(\\angle BAC\\)，和仍然相等——這就是<strong>等量加法</strong>。不管 \\(\\angle BAC\\) 和 \\(\\overline{AC}\\) 怎麼變，兩條連線都一樣長。`;
    fb.innerHTML = wrapFeedback(html);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('add-mode-group'), 'data-add-mode', v => { mode = v; draw(); });
  [sa, sc, sst].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：直角拐彎器（AA 相似）
   長方形 AB = 6、BC = 10；E 在 BC 上、BE = e；∠AEF = 90°，F 在 CD 上，CF = e(10 − e)/6
   正三角形邊長 9；P 在 BC 上、BP = p；∠APQ = 60°，Q 在 AC 上，CQ = p(9 − p)/9
   ========================================================================== */
function initSimCanvas() {
  const cv = hbEl('canvas-sim');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const se = hbEl('sim-e'), ve = hbEl('sim-ve'), lab = hbEl('sim-lab');
  const out = hbEl('sim-formula'), fb = hbEl('sim-feedback');
  const C4 = GR_TONE[4];
  let mode = 'rect';
  let labMode = '';

  function draw() {
    const W = cv.width;
    const rect = mode === 'rect';
    const e = rect ? hbClampSlider(se, 1, 9) : hbClampSlider(se, 1, 8);
    ve.textContent = e;
    if (labMode !== mode) {
      lab.innerHTML = rect ? '\\(\\overline{BE}\\)' : '\\(\\overline{BP}\\)';
      typeset([lab]);
      labMode = mode;
    }
    ctx.clearRect(0, 0, W, cv.height);

    let A, B, C, D, E, F, n1, n2, cfN, cfD, side, rest, a1, a3, nmE, nmF;
    if (rect) {
      drawTitle(ctx, '長方形 ABCD：∠AEF = 90°，F 在 CD 上', C4);
      const u = 40, ox = 70, oy = 300;
      const m = (x, y) => hbV(ox + x * u, oy - y * u);
      cfN = e * (10 - e); cfD = 6;
      A = m(0, 6); B = m(0, 0); C = m(10, 0); D = m(10, 6); E = m(e, 0); F = m(10, cfN / cfD);
      hbPoly(ctx, [A, B, C, D], GR_CREAM, 0.04, 2.2);
      hbPoly(ctx, [A, B, E], GR_SKY, 0.16, 2.2);
      hbPoly(ctx, [E, C, F], GR_CLAY, 0.2, 2.2);
      grRight(ctx, E, A, F, GR_GOLD, 13);
      grRight(ctx, B, A, C, GR_FAINT, 11);
      grRight(ctx, C, B, D, GR_FAINT, 11);
      a1 = grDeg(A, B, E); a3 = grDeg(E, F, C);
      hbAngle(ctx, A, B, E, 30, GR_OLIVE, { alpha: 0.3 });
      hbAngle(ctx, E, A, B, 26, GR_RED, { alpha: 0.3 });
      hbAngle(ctx, E, F, C, 30, GR_OLIVE, { alpha: 0.3 });
      textCenter(ctx, '1', hbAt(A, hbHead(A, B) + (hbHead(A, E) - hbHead(A, B)) / 2, 44).x, hbAt(A, hbHead(A, B) + (hbHead(A, E) - hbHead(A, B)) / 2, 44).y, GR_OLIVE, f(800, 14));
      const mid2 = (hbHead(E, A) + 180) / 2;
      textCenter(ctx, '2', hbAt(E, mid2, 40).x, hbAt(E, mid2, 40).y, GR_RED, f(800, 14));
      const mid3 = hbHead(E, F) / 2;
      textCenter(ctx, '3', hbAt(E, mid3, 44).x, hbAt(E, mid3, 44).y, GR_OLIVE, f(800, 14));
      [A, B, C, D, E, F].forEach(p => dkPt(ctx, p, GR_CREAM, 4));
      grFigNames(ctx, [[A, 'A', -14, -6], [B, 'B', -14, 8], [C, 'C', 14, 8], [D, 'D', 14, -6], [E, 'E', 0, 16], [F, 'F', 16, 0]]);
      dkTag(ctx, '6', A.x - 26, (A.y + B.y) / 2, GR_CREAM, 13);
      dkTag(ctx, String(e), (B.x + E.x) / 2, B.y + 30, GR_SKY, 13);
      dkTag(ctx, String(10 - e), (E.x + C.x) / 2, B.y + 30, GR_CLAY_L, 13);
      side = 6; rest = 10 - e; n1 = 'ABE'; n2 = 'ECF'; nmE = 'BE'; nmF = 'CF';
    } else {
      drawTitle(ctx, '正三角形 ABC：∠APQ = 60°，Q 在 AC 上', C4);
      const u = 34, ox = 117, oy = 318;
      const m = (x, y) => hbV(ox + x * u, oy - y * u);
      cfN = e * (9 - e); cfD = 9;
      const h = 9 * Math.sqrt(3) / 2;
      A = m(4.5, h); B = m(0, 0); C = m(9, 0); E = m(e, 0);
      const cq = cfN / cfD;
      F = m(9 - cq / 2, cq * Math.sqrt(3) / 2);
      hbPoly(ctx, [A, B, C], GR_CREAM, 0.04, 2.2);
      hbPoly(ctx, [A, B, E], GR_SKY, 0.16, 2.2);
      hbPoly(ctx, [E, C, F], GR_CLAY, 0.2, 2.2);
      hbSeg(ctx, A, E, GR_CREAM, 2.2);
      hbSeg(ctx, E, F, GR_CREAM, 2.2);
      a1 = grDeg(A, B, E); a3 = grDeg(E, F, C);
      hbAngle(ctx, E, A, F, 28, GR_GOLD, { alpha: 0.3 });
      hbAngle(ctx, A, B, E, 34, GR_OLIVE, { alpha: 0.3 });
      hbAngle(ctx, E, F, C, 34, GR_OLIVE, { alpha: 0.3 });
      const mA = (hbHead(A, B) + hbHead(A, E)) / 2;
      textCenter(ctx, '1', hbAt(A, mA, 48).x, hbAt(A, mA, 48).y, GR_OLIVE, f(800, 14));
      const m2 = hbHead(E, F) / 2;
      textCenter(ctx, '2', hbAt(E, m2, 48).x, hbAt(E, m2, 48).y, GR_OLIVE, f(800, 14));
      [A, B, C, E, F].forEach(p => dkPt(ctx, p, GR_CREAM, 4));
      grFigNames(ctx, [[A, 'A', 0, -15], [B, 'B', -14, 6], [C, 'C', 14, 6], [E, 'P', 0, 16], [F, 'Q', 15, -4]]);
      dkTag(ctx, String(e), (B.x + E.x) / 2, B.y + 30, GR_SKY, 13);
      dkTag(ctx, String(9 - e), (E.x + C.x) / 2, B.y + 30, GR_CLAY_L, 13);
      side = 9; rest = 9 - e; n1 = 'ABP'; n2 = 'PCQ'; nmE = 'BP'; nmF = 'CQ';
    }

    // 量角（由座標）與比值（精確分數）
    const r1 = grFrac(side, rest);
    const cf = grFrac(cfN, cfD);
    const r2 = grFrac(e * cfD, cfN);
    const y0 = 360;
    grText(ctx, rect ? `量量看：∠1 ≈ ${a1.toFixed(1)}°、∠3 ≈ ${a3.toFixed(1)}°` : `量量看：∠1 ≈ ${a1.toFixed(1)}°、∠2 ≈ ${a3.toFixed(1)}°`, W / 2, y0, GR_OLIVE, 16);
    grText(ctx, `[${rect ? 'CF' : 'CQ'}] = ${cf}，  [AB] : [${rect ? 'EC' : 'PC'}] = ${side} : ${rest} = ${r1}，  [${nmE}] : [${nmF}] = ${r2}`, W / 2, y0 + 36, GR_CREAM, 15.5);
    grText(ctx, `⇒ △${n1} ∼ △${n2}（\`AA\` 相似性質），對應邊成比例`, W / 2, y0 + 74, GR_OK, 16);
    grText(ctx, rect ? '∠1、∠3 都是 ∠2 的餘角，所以相等' : '∠B + ∠1 = ∠APC = ∠APQ + ∠2，∠B = ∠APQ = 60°，所以 ∠1 = ∠2', W / 2, y0 + 106, MUTED, 13.5);
    grMeander(ctx, cv.height - 16);

    const exactCf = grFracTex(cfN, cfD);
    out.innerHTML = rect
      ? `\\(\\overline{CF} = ${exactCf}\\)，<wbr>\\(\\dfrac{\\overline{AB}}{\\overline{EC}} = \\dfrac{\\overline{BE}}{\\overline{CF}} = ${grFracTex(side, rest)}\\)`
      : `\\(\\overline{CQ} = ${exactCf}\\)，<wbr>\\(\\dfrac{\\overline{AB}}{\\overline{PC}} = \\dfrac{\\overline{BP}}{\\overline{CQ}} = ${grFracTex(side, rest)}\\)`;
    const html = rect
      ? '\\(\\angle B = \\angle C = 90^\\circ\\) 是現成的一組角；\\(\\angle 1 + \\angle 2 = 90^\\circ\\)、\\(\\angle 3 + \\angle 2 = 90^\\circ\\)，同一個角的餘角相等，\\(\\angle 1 = \\angle 3\\)。兩組角相等，\\(\\text{AA}\\) 相似。'
      : '\\(\\angle B = \\angle C = 60^\\circ\\) 是現成的一組角；\\(\\angle APC\\) 是 \\(\\triangle ABP\\) 的外角，\\(\\angle B + \\angle 1 = \\angle APQ + \\angle 2\\)，兩邊都有 \\(60^\\circ\\)，所以 \\(\\angle 1 = \\angle 2\\)。';
    fb.innerHTML = wrapFeedback(html);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('sim-mode-group'), 'data-sim-mode', v => { mode = v; draw(); });
  se.addEventListener('input', draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：平行線間的面積秤
   平行線間：B(0,0)、C(8,0)、A(s,5)、D(s + ad, 5)，h = 5
   對角線切四塊：OC = OD = 4，AO、BO 可調；兩對角線夾角固定，面積比 = 兩段的乘積比
   ========================================================================== */
function initAreaCanvas() {
  const cv = hbEl('canvas-area');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sad = hbEl('area-ad'), vad = hbEl('area-vad');
  const ssh = hbEl('area-sh'), vsh = hbEl('area-vsh');
  const sao = hbEl('area-ao'), vao = hbEl('area-vao');
  const sbo = hbEl('area-bo'), vbo = hbEl('area-vbo');
  const out = hbEl('area-formula'), fb = hbEl('area-feedback');
  const C5 = GR_TONE[5];
  let mode = 'par';

  function draw() {
    const W = cv.width;
    const par = mode === 'par';
    dkShow(['area-row-ad', 'area-row-sh'], par);
    dkShow(['area-row-ao', 'area-row-bo'], !par);
    ctx.clearRect(0, 0, W, cv.height);
    let html;

    if (par) {
      const ad = hbClampSlider(sad, 2, 12), sh = hbClampSlider(ssh, -2, 4);
      vad.textContent = ad; vsh.textContent = sh;
      drawTitle(ctx, '[AD] ∥ [BC]：比較 △ABC 與 △ACD 的面積'.replace(/\[|\]/g, ''), C5);
      const u = 26, ox = 40 + 2 * u, oy = 280;
      const m = (x, y) => hbV(ox + x * u, oy - y * u);
      const B = m(0, 0), C = m(8, 0), A = m(sh, 5), D = m(sh + ad, 5);
      hbSeg(ctx, hbV(20, oy), hbV(W - 20, oy), GR_FAINT, 1.6, [6, 5]);
      hbSeg(ctx, hbV(20, oy - 5 * u), hbV(W - 20, oy - 5 * u), GR_FAINT, 1.6, [6, 5]);
      hbPoly(ctx, [A, B, C], GR_SKY, 0.2, 2);
      hbPoly(ctx, [A, C, D], GR_CLAY, 0.22, 2);
      hbPoly(ctx, [A, B, C, D], GR_CREAM, 0, 2.6);
      hbSeg(ctx, A, C, GR_CREAM, 2);
      dkAng(ctx, A, D, C, 26, GR_OLIVE);
      dkAng(ctx, C, B, A, 26, GR_OLIVE);
      // 高
      const Hx = Math.max(m(-1.6, 0).x, 26);
      hbSeg(ctx, hbV(Hx, oy), hbV(Hx, oy - 5 * u), GR_GOLD, 2);
      dkTag(ctx, 'h = 5', Hx + 30, oy - 2.5 * u, GR_GOLD, 13);
      [A, B, C, D].forEach(p => dkPt(ctx, p, GR_CREAM, 4));
      grFigNames(ctx, [[A, 'A', 0, -16], [D, 'D', 0, -16], [B, 'B', 0, 16], [C, 'C', 0, 16]]);
      dkTag(ctx, '8', (B.x + C.x) / 2, oy + 17, GR_SKY, 13);
      dkTag(ctx, String(ad), (A.x + D.x) / 2, oy - 5 * u - 30, GR_CLAY_L, 13);

      // 面積條：長度與面積成正比（每 1 單位面積 6px，開發約束 17）
      const pu = 6, by = 330;
      const w1 = 20 * pu, w2 = ad * 2.5 * pu;
      grText(ctx, '△ABC', 56, by, GR_SKY, 14);
      grText(ctx, '△ACD', 56, by + 34, GR_CLAY_L, 14);
      grBox(ctx, 96, by - 11, w1, 22, GR_SKY, GR_SKY, 0.5, 1);
      grBox(ctx, 96, by + 23, w2, 22, GR_CLAY, GR_CLAY, 0.5, 1);
      grText(ctx, `{1/2} × 8 × 5 = ${grFrac(40, 2)}`, 96 + w1 + 12, by, GR_CREAM, 14, 'left');
      grText(ctx, `{1/2} × ${ad} × 5 = ${grFrac(ad * 5, 2)}`, 96 + w2 + 12, by + 34, GR_CREAM, 14, 'left');
      const eq = ad === 8;
      grText(ctx, eq ? '面積相等 ⇒ [AD] = [BC] = 8，一雙對邊平行且相等：平行四邊形！' : (ad < 8 ? '△ACD 比較小：[AD] < [BC]，不是平行四邊形' : '△ACD 比較大：[AD] > [BC]，不是平行四邊形'),
        W / 2, 412, eq ? GR_OK : GR_CREAM, 15.5);
      grText(ctx, '兩個三角形的高都是平行線的距離 h：面積相等 ⇔ 底相等', W / 2, 444, MUTED, 13.5);
      if (eq) hbPoly(ctx, [A, B, C, D], GR_OK, 0, 3.2);
      out.innerHTML = `\\(\\triangle ABC = \\frac{1}{2} \\times 8 \\times 5 = 20\\)，<wbr>\\(\\triangle ACD = \\frac{1}{2} \\times ${ad} \\times 5 = ${grFracTex(ad * 5, 2)}\\)`;

      html = eq
        ? '面積相等、高也相等（都是平行線的距離），所以底 \\(\\overline{AD} = \\overline{BC}\\)；加上 \\(\\overline{AD} /\\!/ \\overline{BC}\\)（\\(\\angle 1 = \\angle 2\\) 內錯角相等），是<strong>一雙對邊平行且相等</strong>的平行四邊形。'
        : '左右移動 \\(A\\) 點，三角形的形狀變了，<strong>面積卻不變</strong>——因為底和高都沒變。只有 \\(\\overline{AD} = 8\\) 時兩塊才一樣大。';
    } else {
      const ao = hbClampSlider(sao, 2, 6), bo = hbClampSlider(sbo, 2, 6);
      vao.textContent = ao; vbo.textContent = bo;
      drawTitle(ctx, '對角線交於 O：四塊三角形的面積', C5);
      const O = hbV(W / 2, 175), u = 26;
      const A = hbAt(O, 200, ao * u), C = hbAt(O, 20, 4 * u);
      const B = hbAt(O, 280, bo * u), D = hbAt(O, 100, 4 * u);
      const ar = [ao * bo, bo * 4, 16, 4 * ao];
      const tris = [[A, O, B], [B, O, C], [C, O, D], [D, O, A]];
      const cols = [GR_SKY, GR_CLAY, GR_OLIVE, GR_GOLD];
      tris.forEach((t, i) => hbPoly(ctx, t, cols[i], 0.22, 1.4));
      hbPoly(ctx, [A, B, C, D], GR_CREAM, 0, 2.6);
      hbSeg(ctx, A, C, GR_CREAM, 2);
      hbSeg(ctx, B, D, GR_CREAM, 2);
      [A, B, C, D, O].forEach(p => dkPt(ctx, p, GR_CREAM, 4));
      const G = O;
      [[A, 'A'], [B, 'B'], [C, 'C'], [D, 'D']].forEach(([p, n]) => hbVLabel(ctx, p, G, n, GR_CREAM, 17));
      dkName(ctx, O, 'O', GR_CREAM, 14, 12);
      tris.forEach((t, i) => {
        const c = hbCentroid(t);
        dkTag(ctx, String(ar[i]), c.x, c.y, cols[i], 13);
      });
      const names = ['△AOB', '△BOC', '△COD', '△DOA'];
      grText(ctx, `面積比 = ${names.join(' : ')} = ${ar.join(' : ')}`, W / 2, 352, GR_CREAM, 15.5);
      const g1 = reduce(ar[0], ar[1]), g2 = reduce(ar[0], ar[3]);
      grText(ctx, `等高 ⇒ [AO] : [OC] = △AOB : △BOC = ${g1[0]} : ${g1[1]}，[BO] : [OD] = △AOB : △DOA = ${g2[0]} : ${g2[1]}`, W / 2, 386, GR_SKY, 13.5);
      const all = ao === 4 && bo === 4;
      grText(ctx, all ? '四塊一樣大 ⇒ [AO] = [OC]、[BO] = [OD]，對角線互相平分：平行四邊形！' : '四塊不全相等 ⇒ 對角線沒有互相平分',
        W / 2, 420, all ? GR_OK : GR_CREAM, 15.5);
      grText(ctx, '（面積比的單位是「兩段的乘積」，兩條對角線的夾角固定）', W / 2, 450, MUTED, 13);
      out.innerHTML = `\\(\\overline{AO} : \\overline{OC} = ${g1[0]} : ${g1[1]}\\)，<wbr>\\(\\overline{BO} : \\overline{OD} = ${g2[0]} : ${g2[1]}\\)`;
      html = '\\(\\triangle AOB\\) 和 \\(\\triangle BOC\\) 有同一個頂點 \\(B\\)、底都在 \\(\\overline{AC}\\) 上，是<strong>等高</strong>的，所以面積比就是底的比 \\(\\overline{AO} : \\overline{OC}\\)。四塊都相等時，兩條對角線都被平分。';
    }
    grMeander(ctx, cv.height - 16);
    fb.innerHTML = wrapFeedback(html);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('area-mode-group'), 'data-area-mode', v => { mode = v; draw(); });
  [sad, ssh, sao, sbo].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：正方形摺出正三角形
   正方形 A 左上、B 左下、C 右下、D 右上；畫面上的正方形大小固定，只換標示的數字
   ========================================================================== */
function initFoldCanvas() {
  const cv = hbEl('canvas-fold');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sst = hbEl('fold-st'), vst = hbEl('fold-vst');
  const ss = hbEl('fold-s'), vs = hbEl('fold-vs');
  const out = hbEl('fold-formula'), fb = hbEl('fold-feedback');
  const C6 = GR_TONE[6];

  function draw() {
    const W = cv.width;
    const st = hbClampSlider(sst, 1, 5);
    let s = hbClampSlider(ss, 4, 8);
    if (s % 2) { s += 1; ss.value = s; }
    vst.textContent = st; vs.textContent = s;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `正方形 ABCD（邊長 ${s}）摺出正三角形`, C6);

    const L = 236, x0 = (W - L) / 2, y0 = 64;
    const A = hbV(x0, y0), D = hbV(x0 + L, y0), B = hbV(x0, y0 + L), C = hbV(x0 + L, y0 + L);
    const Pm = hbV(x0 + L / 2, y0), Q = hbV(x0 + L / 2, y0 + L);
    const E = hbV(Q.x, Q.y - L * Math.sqrt(3) / 2);
    const R = hbV(C.x, C.y - L * Math.tan(30 * HB_RAD));

    hbPoly(ctx, [A, B, C, D], GR_CREAM, 0.07, 2.4);
    hbSeg(ctx, Pm, Q, st === 1 ? GR_GOLD : GR_FAINT, 2, [7, 5]);
    if (st >= 2) {
      hbSeg(ctx, B, R, st === 2 ? GR_GOLD : GR_FAINT, 2, [7, 5]);
      hbPoly(ctx, [B, R, C], GR_SKY, st === 2 ? 0.16 : 0.06, 1.2);
      hbPoly(ctx, [B, R, E], GR_SKY, st === 2 ? 0.3 : 0.1, 1.6);
      if (st === 2) {
        ctx.save();
        ctx.strokeStyle = GR_SKY;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(C.x, C.y);
        ctx.quadraticCurveTo(C.x + 10, E.y + 30, E.x + 12, E.y + 4);
        ctx.stroke();
        ctx.restore();
      }
    }
    if (st >= 3) {
      hbPoly(ctx, [B, C, E], GR_CLAY, 0.22, 2.6);
    }
    if (st === 4) {
      hbPoly(ctx, [E, B, Q], GR_GOLD, 0.25, 2.6);
      grRight(ctx, Q, B, E, GR_GOLD, 12);
      hbAngle(ctx, B, Q, E, 30, GR_OLIVE, { alpha: 0.35, label: '60°', lr: 48, lc: GR_OLIVE });
    }
    if (st === 5) {
      hbPoly(ctx, [B, R, E], GR_GOLD, 0.25, 2.6);
      grRight(ctx, E, B, R, GR_GOLD, 12);
      hbAngle(ctx, B, E, R, 54, GR_OLIVE, { alpha: 0.3, label: '30°', lr: 72, lc: GR_OLIVE });
    }

    const pts = [[A, 'A', -13, -8], [B, 'B', -13, 8], [C, 'C', 13, 8], [D, 'D', 13, -8], [Pm, 'P', 0, -15], [Q, 'Q', 0, 15]];
    if (st >= 2) pts.push([R, 'R', 15, 0], [E, 'E', -12, -12]);
    pts.forEach(([p]) => dkPt(ctx, p, GR_CREAM, 3.8));
    grFigNames(ctx, pts);

    const qe = hbRoot(3 * s * s / 4);          // QE = (s/2)√3
    const erN = s * s / 3;                      // ER² = s²/3
    const er = s % 3 === 0 ? hbRoot(erN) : null;
    const erTxt = er ? er.txt : `{${s}√3/3}`;
    const brTxt = (() => { const r = reduce(2 * s, 3); return r[1] === 1 ? `${r[0]}√3` : `{${r[0]}√3/${r[1]}}`; })();
    const erTex = (() => { const r = reduce(s, 3); return r[1] === 1 ? (r[0] === 1 ? '\\sqrt{3}' : `${r[0]}\\sqrt{3}`) : `\\frac{${r[0]}\\sqrt{3}}{${r[1]}}`; })();
    const brTex = (() => { const r = reduce(2 * s, 3); return r[1] === 1 ? `${r[0]}\\sqrt{3}` : `\\frac{${r[0]}\\sqrt{3}}{${r[1]}}`; })();

    const steps = [
      ['步驟 1：對摺，P、Q 是 [AD]、[BC] 的中點', `[BQ] = {1/2}[BC] = ${s / 2}`],
      ['步驟 2：把 C 摺到 [PQ] 上的 E，摺痕 [BR]', '摺過去的兩部分全等：△BRE ≅ △BRC，[BE] = [BC]'],
      ['步驟 3：摺出 [BE]、[CE]，得到 △BCE', `[BE] = [BC] = ${s}，還要證明一個角是 60°`],
      [`直角 △EBQ：[BQ] : [BE] = ${s / 2} : ${s} = 1 : 2`, `⇒ [QE] = ${qe.txt}，三邊比 1 : 2 : √3，∠EBQ = 60° ⇒ △BCE 是正三角形`],
      ['∠EBR = ∠CBR = 30°，∠BER = ∠C = 90°', `直角 △BRE 是 30°、60°、90°：[ER] = ${erTxt}、[BR] = ${brTxt} ⇒ [BR] = 2[ER]`]
    ];
    grText(ctx, steps[st - 1][0], W / 2, 344, GR_CREAM, 16);
    grText(ctx, steps[st - 1][1], W / 2, 374, st >= 4 ? GR_OK : GR_GOLD, 15);
    grText(ctx, `[BQ] : [BE] : [QE] = ${s / 2} : ${s} : ${qe.txt} = 1 : 2 : √3`, W / 2, 412, st >= 4 ? GR_CREAM : MUTED, 14.5);
    grText(ctx, '換一個邊長，比值還是 1 : 2 : √3——摺出來的永遠是正三角形', W / 2, 446, MUTED, 13.5);
    grMeander(ctx, cv.height - 16);

    const texList = [
      `\\overline{BQ} = ${s / 2}`,
      `\\overline{BE} = \\overline{BC} = ${s}`,
      `\\overline{BE} = ${s}`,
      `\\overline{QE} = ${qe.tex}`,
      `\\overline{ER} = ${erTex},\\ \\overline{BR} = ${brTex}`
    ];
    out.innerHTML = `\\(${texList[st - 1]}\\)`;
    const html = st <= 3
      ? '摺紙的證明，條件藏在摺法裡：<strong>對摺</strong>給中點，<strong>摺過去的兩部分全等</strong>給相等的邊和角。'
      : (st === 4
        ? '直角三角形中，斜邊 \\(\\overline{BE}\\) 是短股 \\(\\overline{BQ}\\) 的 \\(2\\) 倍，三邊比就是 \\(1 : 2 : \\sqrt{3}\\)，短股旁的角 \\(\\angle EBQ = 60^\\circ\\)。等腰三角形頂角 \\(60^\\circ\\)，就是正三角形。'
        : '摺痕 \\(\\overline{BR}\\) 把 \\(60^\\circ\\) 的 \\(\\angle EBC\\) 平分成兩個 \\(30^\\circ\\)；\\(\\angle BER = \\angle C = 90^\\circ\\)（摺過去的對應角），所以 \\(\\triangle BRE\\) 是 \\(30^\\circ\\)、\\(60^\\circ\\)、\\(90^\\circ\\) 的直角三角形，斜邊是短股的 \\(2\\) 倍。');
    fb.innerHTML = wrapFeedback(html);
    typeset([out, fb]);
  }

  [sst, ss].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：奇偶檢驗帶
   ========================================================================== */
const GR_PAR = [
  { s: 'n + 5', tex: 'n + 5', f: n => n + 5, kind: 0, re: 'n 是偶數時是奇數，n 是奇數時是偶數', reTex: 'n + 5' },
  { s: '2n + 6', tex: '2n + 6', f: n => 2 * n + 6, kind: 2, re: '2n + 6 = 2(n + 3)，n + 3 是整數', reTex: '2n + 6 = 2(n + 3)' },
  { s: '2n − 3', tex: '2n - 3', f: n => 2 * n - 3, kind: 1, re: '2n − 3 = 2(n − 2) + 1，n − 2 是整數', reTex: '2n - 3 = 2(n - 2) + 1' },
  { s: '3n', tex: '3n', f: n => 3 * n, kind: 0, re: 'n 是偶數時是偶數，n 是奇數時是奇數', reTex: '3n' },
  { s: 'n(n + 1)', tex: 'n(n + 1)', f: n => n * (n + 1), kind: 2, re: 'n、n + 1 是相鄰的整數，一定有一個是偶數', reTex: 'n(n + 1)' },
  { s: '6n − 1', tex: '6n - 1', f: n => 6 * n - 1, kind: 1, re: '6n − 1 = 2(3n − 1) + 1，3n − 1 是整數', reTex: '6n - 1 = 2(3n - 1) + 1' }
];
const GR_PAR_WORD = ['都有可能', '一定是奇數', '一定是偶數'];

function grOdd(v) {
  return Math.abs(v) % 2 === 1;
}

function initParCanvas() {
  const cv = hbEl('canvas-par');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sn = hbEl('par-n'), vn = hbEl('par-vn');
  const out = hbEl('par-formula'), fb = hbEl('par-feedback');
  const C7 = GR_TONE[7];
  let ex = 0;

  function draw() {
    const W = cv.width;
    const n = hbClampSlider(sn, -5, 5);
    vn.textContent = n;
    const X = GR_PAR[ex];
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '奇偶檢驗帶：n 從 −5 到 5', C7);

    grText(ctx, X.s, W / 2, 66, GR_CREAM, 26);
    const v = X.f(n);
    grText(ctx, `n = ${grN(n)} 時，${X.s} = ${grN(v)}，是${grOdd(v) ? '奇數' : '偶數'}`, W / 2, 104, grOdd(v) ? GR_CLAY_L : GR_CREAM, 17);

    const tw = 42, gap = 4, x0 = (W - (11 * tw + 10 * gap)) / 2, ty = 146;
    let odd = 0, even = 0;
    for (let k = -5; k <= 5; k++) {
      const i = k + 5, x = x0 + i * (tw + gap);
      const val = X.f(k);
      const o = grOdd(val);
      if (o) odd++; else even++;
      grBox(ctx, x, ty, tw, 52, o ? GR_CLAY : GR_CREAM, o ? GR_CLAY : GR_CREAM, o ? 0.55 : 0.75, k === n ? 3 : 1);
      if (k === n) grBox(ctx, x - 3, ty - 3, tw + 6, 58, GR_GOLD, null, 0, 3);
      textCenter(ctx, grN(k), x + tw / 2, ty - 14, MUTED, f(700, 13));
      textCenter(ctx, grN(val), x + tw / 2, ty + 26, o ? GR_CREAM : GR_BLACK, f(800, val <= -10 || val >= 100 ? 13 : 15));
    }
    grBox(ctx, 120, 222, 16, 16, GR_CLAY, GR_CLAY, 0.55, 1);
    grText(ctx, `奇數 ${odd} 個`, 144, 230, GR_CLAY_L, 14, 'left');
    grBox(ctx, 300, 222, 16, 16, GR_CREAM, GR_CREAM, 0.75, 1);
    grText(ctx, `偶數 ${even} 個`, 324, 230, GR_CREAM, 14, 'left');

    grText(ctx, X.re, W / 2, 276, GR_GOLD, 16);
    grText(ctx, `結論：${X.s} ${GR_PAR_WORD[X.kind]}`, W / 2, 312, X.kind ? GR_OK : GR_CREAM, 18);
    grText(ctx, X.kind ? '整條都同色還不夠，整理成 2 × 整數 或 2 × 整數 + 1 才算說明' : '找到一奇一偶兩個例子，就能說「都有可能」', W / 2, 344, MUTED, 13.5);
    grMeander(ctx, cv.height - 16);

    out.innerHTML = `\\(${X.reTex}\\)，<wbr>\\(n = ${n}\\) 時 \\(${X.tex} = ${v}\\)`;
    const html = X.kind === 0
      ? `\\(${X.tex}\\) 有時奇、有時偶。只要舉出一個奇數、一個偶數的例子，就能說明「都有可能」。`
      : `把式子整理成 \\(2 \\times\\) 整數${X.kind === 1 ? ' \\(+ 1\\)' : ''}，並說明括號裡是整數，才能說它<strong>一定</strong>是${X.kind === 1 ? '奇數' : '偶數'}——表格裡只看得到 \\(11\\) 個 \\(n\\)。`;
    fb.innerHTML = wrapFeedback(html);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('par-expr-group'), 'data-par-expr', v => { ex = parseInt(v, 10); draw(); });
  sn.addEventListener('input', draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：字母涵蓋格
   ========================================================================== */
const GR_LET = {
  eo: { aSet: [-4, -2, 0, 2, 4], bSet: [-3, -1, 1, 3, 5], aOf: m => 2 * m, bOf: n => 2 * n + 1, r: (a, b) => a + b,
    aS: 'a = 2m', bS: 'b = 2n + 1', bSame: 'b = 2m + 1', op: 'a + b', title: '偶數 a ＋ 奇數 b' },
  oo: { aSet: [-3, -1, 1, 3, 5], bSet: [-3, -1, 1, 3, 5], aOf: m => 2 * m + 1, bOf: n => 2 * n + 1, r: (a, b) => a + b,
    aS: 'a = 2m + 1', bS: 'b = 2n + 1', bSame: 'b = 2m + 1', op: 'a + b', title: '奇數 a ＋ 奇數 b' },
  om: { aSet: [-3, -1, 1, 3, 5], bSet: [-3, -1, 1, 3, 5], aOf: m => 2 * m + 1, bOf: n => 2 * n + 1, r: (a, b) => a * b,
    aS: 'a = 2m + 1', bS: 'b = 2n + 1', bSame: 'b = 2m + 1', op: 'a × b', title: '奇數 a × 奇數 b' }
};

function initLetCanvas() {
  const cv = hbEl('canvas-let');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sm = hbEl('let-m'), vm = hbEl('let-vm');
  const sn = hbEl('let-n'), vn = hbEl('let-vn');
  const out = hbEl('let-formula'), fb = hbEl('let-feedback');
  const C8 = GR_TONE[8];
  let op = 'eo', set = 'diff';

  function draw() {
    const W = cv.width;
    const m = hbClampSlider(sm, -2, 2);
    const same = set === 'same';
    dkShow(['let-row-n'], !same);
    const n = same ? m : hbClampSlider(sn, -2, 2);
    vm.textContent = m; vn.textContent = n;
    const O = GR_LET[op];
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `${O.title}：${same ? '同一個字母 m' : '不同字母 m、n'}`, C8);

    const a = O.aOf(m), b = O.bOf(n);
    const gx = 62, gy = 74, cs = 44;
    grText(ctx, 'a →', gx - 30, gy - 16, MUTED, 13);
    grText(ctx, 'b ↓', gx - 30, gy + 4, MUTED, 13);
    let cover = 0;
    O.bSet.forEach((bv, r) => {
      textCenter(ctx, grN(bv), gx - 18, gy + 14 + r * cs + cs / 2, MUTED, f(700, 13));
      O.aSet.forEach((av, c) => {
        // 這一格能不能由目前的假設寫出來
        const mm = op === 'eo' ? av / 2 : (av - 1) / 2;
        const nn = (bv - 1) / 2;
        const ok = same ? mm === nn : true;
        if (ok) cover++;
        const x = gx + c * cs, y = gy + 14 + r * cs;
        const val = O.r(av, bv);
        const o = grOdd(val);
        grBox(ctx, x + 2, y + 2, cs - 4, cs - 4, ok ? (o ? GR_CLAY : GR_CREAM) : GR_FAINT, ok ? (o ? GR_CLAY : GR_CREAM) : null, ok ? (o ? 0.5 : 0.7) : 0, 1);
        textCenter(ctx, ok ? grN(val) : '?', x + cs / 2, y + cs / 2, ok ? (o ? GR_CREAM : GR_BLACK) : MUTED, f(800, Math.abs(val) >= 10 ? 13 : 15));
        if (av === a && bv === b) grBox(ctx, x - 1, y - 1, cs + 2, cs + 2, GR_GOLD, null, 0, 3);
      });
    });
    O.aSet.forEach((av, c) => textCenter(ctx, grN(av), gx + c * cs + cs / 2, gy, MUTED, f(700, 13)));

    // 右邊：整理式
    const rx = 300;
    const lines = [];
    if (op === 'eo') {
      lines.push([`${O.aS} = 2 × ${grPT(m)} = ${grN(a)}`, GR_CREAM]);
      lines.push([`${same ? O.bSame : O.bS} = 2 × ${grPT(n)} + 1 = ${grN(b)}`, GR_CREAM]);
      lines.push([same ? 'a + b = 2m + 2m + 1' : 'a + b = 2m + 2n + 1', GR_GOLD]);
      lines.push([same ? '= 2(2m) + 1' : '= 2(m + n) + 1', GR_GOLD]);
      lines.push([`= 2 × ${grPT(same ? 2 * m : m + n)} + 1 = ${grN(a + b)}`, GR_CREAM]);
    } else if (op === 'oo') {
      lines.push([`${O.aS} = ${grN(a)}`, GR_CREAM]);
      lines.push([`${same ? O.bSame : O.bS} = ${grN(b)}`, GR_CREAM]);
      lines.push([same ? 'a + b = 4m + 2' : 'a + b = 2m + 2n + 2', GR_GOLD]);
      lines.push([same ? '= 2(2m + 1)' : '= 2(m + n + 1)', GR_GOLD]);
      lines.push([`= 2 × ${grPT(same ? 2 * m + 1 : m + n + 1)} = ${grN(a + b)}`, GR_CREAM]);
    } else {
      lines.push([`${O.aS} = ${grN(a)}`, GR_CREAM]);
      lines.push([`${same ? O.bSame : O.bS} = ${grN(b)}`, GR_CREAM]);
      lines.push([same ? 'ab = 4m² + 4m + 1' : 'ab = 4mn + 2m + 2n + 1', GR_GOLD]);
      lines.push([same ? '= 2(2m² + 2m) + 1' : '= 2(2mn + m + n) + 1', GR_GOLD]);
      const inner = same ? 2 * m * m + 2 * m : 2 * m * n + m + n;
      lines.push([`= 2 × ${grPT(inner)} + 1 = ${grN(a * b)}`, GR_CREAM]);
    }
    lines.forEach(([t, c], i) => grText(ctx, t, rx, 96 + i * 34, c, 16, 'left', W - rx - 14));
    const res = O.r(a, b);
    grText(ctx, `${O.op} = ${grN(res)}，是${grOdd(res) ? '奇數' : '偶數'}`, rx, 96 + 5 * 34 + 6, grOdd(res) ? GR_CLAY_L : GR_CREAM, 16, 'left');

    const yb = 340;
    grText(ctx, `這種假設涵蓋 ${cover} / 25 組數對`, W / 2, yb, cover === 25 ? GR_OK : GR_NO, 18);
    grText(ctx, same
      ? (op === 'eo' ? 'b 永遠是 a + 1：只證到「相鄰」的偶數和奇數' : 'b 永遠等於 a：只證到「同一個奇數」加（乘）自己')
      : 'm、n 各自跑遍所有整數：每一組 (a, b) 都涵蓋到了', W / 2, yb + 32, GR_CREAM, 15);
    grText(ctx, '兩個任意的數要用不同的字母', W / 2, yb + 64, MUTED, 13.5);
    grMeander(ctx, cv.height - 16);

    out.innerHTML = `\\(a = ${a}\\)，\\(b = ${b}\\)，<wbr>\\(${op === 'om' ? 'ab' : 'a + b'} = ${res}\\)`;
    const html = same
      ? '用同一個字母 \\(m\\)，兩個數就被<strong>綁在一起</strong>了。格子裡只有一條斜線亮起來——其他的數對都沒證到，這不能算「任意」的兩個數。'
      : '\\(m\\)、\\(n\\) 是兩個<strong>互不相干</strong>的整數，格子全部亮起來。整理成 \\(2 \\times (\\ldots)\\) 或 \\(2 \\times (\\ldots) + 1\\) 後，還要說明括號裡是整數。';
    fb.innerHTML = wrapFeedback(html);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('let-op-group'), 'data-let-op', v => { op = v; draw(); });
  bindPickGroup(hbEl('let-set-group'), 'data-let-set', v => { set = v; draw(); });
  [sm, sn].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：猜想檢驗器
   ========================================================================== */
const GR_CNT = [
  {
    s: 'n 是正整數時，n² + n + 11 一定是質數', lab: 'n', lo: 1, hi: 12, two: false,
    test(n) {
      const v = n * n + n + 11;
      const ok = grIsPrime(v);
      return { valid: true, ok, chip: `n = ${n}`,
        line: `n = ${n}：${n}² + ${n} + 11 = ${v}`, res: ok ? `${v} 是質數` : `${v} = ${grSmallFactor(v)} × ${v / grSmallFactor(v)}，不是質數`,
        tex: `${n}^2 + ${n} + 11 = ${v}` };
    },
    proof: ''
  },
  {
    s: '若 a > b，則 a² > b²', lab: 'a', lo: -6, hi: 6, two: true,
    test(a, b) {
      const valid = a > b;
      const ok = !valid || a * a > b * b;
      return { valid, ok, chip: `(${grN(a)}, ${grN(b)})`,
        line: `a = ${grN(a)}、b = ${grN(b)}：a² = ${a * a}、b² = ${b * b}`,
        res: !valid ? '條件 a > b 不成立，這組不能拿來檢驗' : (ok ? 'a² > b²，成立' : `a > b，可是 a² ${a * a === b * b ? '=' : '<'} b²，不成立`),
        tex: `a = ${a},\\ b = ${b},\\ a^2 = ${a * a},\\ b^2 = ${b * b}` };
    },
    proof: ''
  },
  {
    s: '連續三個整數的和一定是 3 的倍數', lab: 'n', lo: -6, hi: 6, two: false,
    test(n) {
      const v = 3 * n + 3;
      return { valid: true, ok: v % 3 === 0, chip: `n = ${grN(n)}`,
        line: `${grN(n)} + ${grP(n + 1)} + ${grP(n + 2)} = ${grN(v)}`, res: `${grN(v)} = 3 × ${grPT(n + 1)}，是 3 的倍數`,
        tex: `${n} + ${n + 1 < 0 ? '(' + (n + 1) + ')' : n + 1} + ${n + 2 < 0 ? '(' + (n + 2) + ')' : n + 2} = ${v}` };
    },
    proof: '要證明：n + (n + 1) + (n + 2) = 3n + 3 = 3(n + 1)，n + 1 是整數'
  },
  {
    s: '奇數的平方減 1 一定是 8 的倍數', lab: 'k（奇數 2k + 1）', lo: -6, hi: 6, two: false,
    test(k) {
      const o = 2 * k + 1, v = o * o - 1;
      return { valid: true, ok: v % 8 === 0, chip: `${grN(o)}`,
        line: `奇數 ${grN(o)}：${grPT(o)}² − 1 = ${v}`, res: `${v} = 8 × ${v / 8}，是 8 的倍數`,
        tex: `(${o})^2 - 1 = ${v}` };
    },
    proof: '要證明：(2k + 1)² − 1 = 4k(k + 1)，k(k + 1) 是偶數，所以是 8 的倍數'
  }
];

function initCntCanvas() {
  const cv = hbEl('canvas-cnt');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('cnt-a'), va = hbEl('cnt-va'), la = hbEl('cnt-la');
  const sb = hbEl('cnt-b'), vb = hbEl('cnt-vb');
  const out = hbEl('cnt-formula'), fb = hbEl('cnt-feedback');
  const C9 = GR_TONE[9];
  let cl = 0, hist = [], searched = null, labFor = -1;

  function cur() {
    const X = GR_CNT[cl];
    const a = hbClampSlider(sa, X.lo, X.hi);
    const b = X.two ? hbClampSlider(sb, -6, 6) : 0;
    return { X, a, b, r: X.two ? X.test(a, b) : X.test(a) };
  }

  function record() {
    const { r } = cur();
    if (!r.valid) return;
    hist = hist.filter(h => h.chip !== r.chip);
    hist.push({ chip: r.chip, ok: r.ok });
    if (hist.length > 12) hist.shift();
  }

  function draw() {
    const W = cv.width;
    const { X, a, b, r } = cur();
    va.textContent = grN(a); vb.textContent = grN(b);
    dkShow(['cnt-row-b'], X.two);
    if (labFor !== cl) {
      la.innerHTML = X.two ? '\\(a\\)' : (cl === 3 ? '\\(k\\)（奇數 \\(2k + 1\\)）' : '\\(n\\)');
      typeset([la]);
      labFor = cl;
    }
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '猜想檢驗器：舉例，還是證明？', C9);
    grText(ctx, `猜想：${X.s}`, W / 2, 64, GR_GOLD, 18);
    grText(ctx, r.line, W / 2, 108, GR_CREAM, 17);
    grText(ctx, r.res, W / 2, 140, !r.valid ? MUTED : (r.ok ? GR_OK : GR_NO), 17);

    grText(ctx, '已試過：', 24, 186, MUTED, 14, 'left');
    hist.forEach((h, i) => {
      const x = 24 + (i % 4) * 126, y = 204 + Math.floor(i / 4) * 40;
      grBox(ctx, x, y, 118, 32, h.ok ? GR_OK : GR_NO, h.ok ? GR_OK : GR_NO, 0.14, 1.6);
      grText(ctx, `${h.chip} ${h.ok ? '✓' : '✗'}`, x + 59, y + 16, h.ok ? GR_OK : GR_NO, 14);
    });
    if (!hist.length) grText(ctx, '（拉動滑桿試試看，或按「自動找反例」）', W / 2, 220, MUTED, 13.5);

    const bad = hist.find(h => !h.ok);
    const yb = 340;
    if (bad) {
      grText(ctx, `找到反例 ${bad.chip}：猜想被推翻！`, W / 2, yb, GR_NO, 18);
      grText(ctx, '一個反例就夠了，不管前面成立了幾次', W / 2, yb + 32, GR_CREAM, 15);
    } else if (searched === 'none') {
      grText(ctx, `範圍內（${X.two ? 'a、b' : X.lab.split('（')[0]} 從 ${grN(X.lo)} 到 ${X.hi}）全部成立`, W / 2, yb, GR_OK, 17);
      grText(ctx, X.proof || '但這仍然只是舉例，還要證明', W / 2, yb + 32, GR_CREAM, 14.5);
    } else if (hist.length) {
      grText(ctx, `試過 ${hist.length} 個都成立——這只是舉例，還不是證明`, W / 2, yb, GR_GOLD, 16.5);
      grText(ctx, '再找找看有沒有反例（記得試負數、0、1）', W / 2, yb + 32, MUTED, 14);
    }
    grText(ctx, '說「成立」要證明；說「不成立」舉一個反例就夠', W / 2, yb + 70, MUTED, 13.5);
    grMeander(ctx, cv.height - 16);

    out.innerHTML = `\\(${r.tex}\\)`;
    let html;
    if (bad) html = `反例要<strong>符合條件</strong>、<strong>結論卻不對</strong>。${cl === 1 ? '這裡的反例都用到負數：\\(a + b \\lt 0\\) 時平方的大小會反過來。' : '\\(n = 10\\) 時 \\(121 = 11 \\times 11\\)，前面 \\(9\\) 個都成立也沒用。'}`;
    else if (searched === 'none') html = '範圍內找不到反例，但整數有無限多個，<strong>試不完</strong>。要說它一定成立，得用代數證明。';
    else html = '每試一個數，就記在下面。全部成立只代表「還沒找到反例」，不代表已經證明。';
    fb.innerHTML = wrapFeedback(html);
    typeset([out, fb]);
  }

  function onSlide() { record(); searched = null; draw(); }

  bindPickGroup(hbEl('cnt-claim-group'), 'data-cnt-claim', v => {
    cl = parseInt(v, 10); hist = []; searched = null;
    const X = GR_CNT[cl];
    sa.min = X.lo; sa.max = X.hi; sa.value = X.lo === 1 ? 1 : 1;
    sb.value = 1;
    record();
    draw();
  });
  hbEl('cnt-search').addEventListener('click', () => {
    const X = GR_CNT[cl];
    let found = null;
    outer:
    for (let a = X.lo; a <= X.hi; a++) {
      if (X.two) {
        for (let b = -6; b <= 6; b++) {
          const r = X.test(a, b);
          if (r.valid && !r.ok) { found = [a, b]; break outer; }
        }
      } else {
        const r = X.test(a);
        if (!r.ok) { found = [a, 0]; break; }
      }
    }
    if (found) {
      sa.value = found[0]; sb.value = found[1];
      searched = 'found';
      record();
    } else {
      searched = 'none';
    }
    draw();
  });
  hbEl('cnt-clear').addEventListener('click', () => { hist = []; searched = null; draw(); });
  [sa, sb].forEach(s => s.addEventListener('input', onSlide));
  record();
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 11：平方差拼板 (k + d)² − k² = d(2k + d)
   ========================================================================== */
function initSqCanvas() {
  const cv = hbEl('canvas-sq');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = hbEl('sq-k'), vk = hbEl('sq-vk');
  const sd = hbEl('sq-d'), vd = hbEl('sq-vd');
  const out = hbEl('sq-formula'), fb = hbEl('sq-feedback');
  const C10 = GR_TONE[10];

  // w × h 個方格（左上角 x, y，每格 u px）
  function cellRect(x, y, w, h, color, alpha, u) {
    ctx.save();
    for (let i = 0; i < w; i++) {
      for (let j = 0; j < h; j++) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(x + i * u + 1, y + j * u + 1, u - 2, u - 2);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + i * u + 1.5, y + j * u + 1.5, u - 3, u - 3);
      }
    }
    ctx.restore();
  }

  function draw() {
    const W = cv.width;
    const k = hbClampSlider(sk, 1, 6), d = hbClampSlider(sd, 1, 4);
    vk.textContent = k; vd.textContent = d;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `邊長 ${k + d} 的正方形挖掉邊長 ${k} 的正方形`, C10);

    const u = 22, x0 = 30, y0 = 66, n = k + d;
    // 上方的帶子（d × n）、右邊的柱子（d × k）、左下挖掉的小正方形（k × k）
    cellRect(x0, y0, n, d, GR_CLAY, 0.5, u);
    cellRect(x0 + k * u, y0 + d * u, d, k, GR_GOLD, 0.45, u);
    ctx.save();
    ctx.strokeStyle = GR_CREAM; ctx.lineWidth = 2.4;
    ctx.strokeRect(x0, y0, n * u, n * u);
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(x0, y0 + d * u, k * u, k * u);
    ctx.restore();
    dkTag(ctx, `${n}`, x0 + n * u / 2, y0 - 13, GR_CREAM, 12.5);
    grText(ctx, `挖掉 k² = ${k * k}`, x0, y0 + n * u + 16, MUTED, 13.5, 'left');

    // 右側：拼成長條（帶子 n 格 ＋ 柱子轉過來 k 格）
    const sx = 292, sy = 86;
    grText(ctx, 'L 形拼成一條長條：', sx, sy - 18, GR_CREAM, 14.5, 'left');
    const su = Math.min(16, (W - sx - 14) / (2 * k + d));
    cellRect(sx, sy, n, d, GR_CLAY, 0.5, su);
    cellRect(sx + n * su, sy, k, d, GR_GOLD, 0.45, su);
    grText(ctx, `寬 d = ${d}、長 2k + d = ${2 * k + d}`, sx, sy + d * su + 18, GR_CLAY_L, 14, 'left', W - sx - 10);

    const big = n * n, small = k * k, diff = big - small;
    grText(ctx, `${n}² − ${k}² = ${big} − ${small} = ${diff}`, sx, 206, GR_CREAM, 16, 'left', W - sx - 10);
    grText(ctx, `= ${d} × ${2 * k + d} = ${diff}`, sx, 238, GR_GOLD, 16, 'left', W - sx - 10);

    const yb = 300;
    grText(ctx, '(k + d)² − k² = ((k + d) + k)((k + d) − k) = d(2k + d)', W / 2, yb + 34, GR_CREAM, 15.5);
    const even = d % 2 === 0;
    grText(ctx, even
      ? `d = ${d} 是偶數，2k + d 也是偶數：d(2k + d) = ${2 * d}(k + ${d / 2})，一定是 ${2 * d} 的倍數`
      : `d = ${d} 是奇數，2k + d 是奇數：一定是 ${d} 的倍數${d === 1 ? '（就是奇數 2k + 1）' : ''}`, W / 2, yb + 68, GR_OK, 15);
    grText(ctx, '不管 k 是多少，長條的寬都是 d——這就是「一定是 d 的倍數」的理由', W / 2, yb + 100, MUTED, 13.5);
    grMeander(ctx, cv.height - 16);

    out.innerHTML = `\\(${n}^2 - ${k}^2 = ${diff}\\)<wbr>\\({} = ${d} \\times ${2 * k + d}\\)`;
    const html = `平方差 \\(a^2 - b^2 = (a + b)(a - b)\\)：\\((k + d) + k = 2k + d\\)、\\((k + d) - k = d\\)。整理成「\\(d \\times\\) 整數」，就證明了它一定是 \\(d\\) 的倍數${even ? `；\\(d\\) 是偶數時還能多提出一個 \\(2\\)` : ''}。`;
    fb.innerHTML = wrapFeedback(html);
    typeset([out, fb]);
  }

  [sk, sd].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 12：平方差符號表
   ========================================================================== */
function initCmpCanvas() {
  const cv = hbEl('canvas-cmp');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('cmp-a'), va = hbEl('cmp-va');
  const sb = hbEl('cmp-b'), vb = hbEl('cmp-vb');
  const out = hbEl('cmp-formula'), fb = hbEl('cmp-feedback');
  const C11 = GR_TONE[11];

  const sgn = v => (v > 0 ? '> 0' : (v < 0 ? '< 0' : '= 0'));
  const sgnTex = v => (v > 0 ? '\\gt 0' : (v < 0 ? '\\lt 0' : '= 0'));

  function draw() {
    const W = cv.width;
    const a = hbClampSlider(sa, -6, 6), b = hbClampSlider(sb, -6, 6);
    va.textContent = grN(a); vb.textContent = grN(b);
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '比較 a² 與 b²：看 (a + b)(a − b) 的正負', C11);

    // 數線（只在正向畫箭頭）
    const ly = 76, cx = W / 2, u = 32;
    hbSeg(ctx, hbV(cx - 7 * u, ly), hbV(cx + 7 * u, ly), GR_CREAM, 2);
    axisArrow(ctx, cx + 7 * u, ly, 'right', GR_CREAM);
    for (let v = -6; v <= 6; v++) {
      hbSeg(ctx, hbV(cx + v * u, ly - 5), hbV(cx + v * u, ly + 5), GR_CREAM, 1.6);
      textCenter(ctx, grN(v), cx + v * u, ly + 18, MUTED, f(600, 12));
    }
    const pa = hbV(cx + a * u, ly), pb = hbV(cx + b * u, ly);
    dkPt(ctx, pa, GR_CLAY, 6.5);
    dkPt(ctx, pb, GR_SKY, 6.5);
    dkName(ctx, pa, 'a', GR_CLAY_L, 0, a === b ? -30 : -18);
    dkName(ctx, pb, 'b', GR_SKY, 0, -18);

    // 兩個正方形
    const q = 15, by = 214;
    const sA = Math.abs(a) * q, sB = Math.abs(b) * q;
    grBox(ctx, 150 - sA / 2, by - sA, Math.max(sA, 1), Math.max(sA, 1), GR_CLAY, GR_CLAY, 0.4, 2);
    grBox(ctx, 390 - sB / 2, by - sB, Math.max(sB, 1), Math.max(sB, 1), GR_SKY, GR_SKY, 0.4, 2);
    grText(ctx, `a² = ${a * a}`, 150, by + 18, GR_CLAY_L, 16);
    grText(ctx, `b² = ${b * b}`, 390, by + 18, GR_SKY, 16);

    const s1 = a + b, s2 = a - b, pr = s1 * s2;
    const rows = [
      [`a + b = ${grN(s1)} ${sgn(s1)}`, s1 > 0 ? GR_OK : (s1 < 0 ? GR_NO : MUTED)],
      [`a − b = ${grN(s2)} ${sgn(s2)}`, s2 > 0 ? GR_OK : (s2 < 0 ? GR_NO : MUTED)],
      [`(a + b)(a − b) = a² − b² = ${grN(pr)} ${sgn(pr)}`, GR_GOLD]
    ];
    rows.forEach(([t, c], i) => grText(ctx, t, W / 2, 264 + i * 30, c, 16));
    const cmp = pr > 0 ? 'a² > b²' : (pr < 0 ? 'a² < b²' : 'a² = b²');
    grText(ctx, `⇒ ${cmp}`, W / 2, 360, GR_CREAM, 19);

    let note, nc = GR_CREAM;
    if (a > b && pr < 0) { note = 'a > b，平方卻比較小！因為 a + b < 0（有負數）'; nc = GR_NO; }
    else if (a > b && pr === 0) { note = 'a > b，平方卻一樣大：a 和 b 互為相反數'; nc = GR_NO; }
    else if (a > b && b > 0) { note = 'a > b > 0：兩個因式都是正的，a² > b²（課本例 8）'; nc = GR_OK; }
    else if (b > a && a > 0) { note = 'b > a > 0：兩個正數，大的那個平方也比較大'; nc = GR_OK; }
    else if (a === b) note = 'a = b：平方當然相等';
    else note = '兩個因式同號，乘積是正的；異號，乘積是負的';
    grText(ctx, note, W / 2, 398, nc, 15);
    grText(ctx, '「兩正數」的條件拿掉，大的數平方不一定比較大', W / 2, 432, MUTED, 13.5);
    grMeander(ctx, cv.height - 16);

    out.innerHTML = `\\(a + b = ${s1}\\)，<wbr>\\(a - b = ${s2}\\)，<wbr>\\(a^2 - b^2 = ${pr} ${sgnTex(pr)}\\)`;
    const html = '\\(a^2 - b^2 = (a + b)(a - b)\\)：兩個因式<strong>同號</strong>，\\(a^2 \\gt b^2\\)；<strong>異號</strong>，\\(a^2 \\lt b^2\\)。\\(a\\)、\\(b\\) 都是正數時 \\(a + b\\) 一定是正的，所以只要看 \\(a - b\\)；有負數時，\\(a + b\\) 可能是負的，結論就會反過來。';
    fb.innerHTML = wrapFeedback(html);
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}
