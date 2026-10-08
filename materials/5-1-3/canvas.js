/* ==========================================================================
   5-1-3（第五冊 1-3）縮放與相似 — 互動 Canvas 與隨堂評量
   畫風：昭和復古照相館・暗房（小影、阿光），第五冊第 1 章四節共用。

   共用工具在 ../math-canvas.js（f／fi／drawTitle／textCenter／wrapFeedback／
   wbrEq／typeset／bindPickGroup／drawWithFonts、q* 有理數、hb* 幾何、cgLabel…）。

   本檔分三層：
     0. 本節色票（DK_ 前綴；共用檔沒有這個前綴）；
     1. 本節工具（dk 前綴）：數學座標（y 朝上）→ 畫布的取景、
        含上橫線線段名與分數的一行字（dkRich）、標籤；
     2. 11 個互動與評量附圖。

   幾何一律先在「數學座標」（單位長、y 朝上）算好，再由 dkView 等比例
   放進畫布；所有長度、角度都由座標實算（開發約束 27）。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();
  drawWithFonts(initQuizFigs);

  initSegCanvas();
  initAngCanvas();
  initPolyCanvas();
  initRegCanvas();
  initCorrCanvas();
  initOnlyCanvas();
  initCalcCanvas();
  initAACanvas();
  initSASCanvas();
  initSSSCanvas();
  initJudgeCanvas();
});

/* ==========================================================================
   0. 本節色票（暗房：棕褐相紙、安全燈紅、顯影藍、圍裙綠、芥末黃）
   ========================================================================== */

const DK_PAPER = '#2a211a';
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
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9'];

// 對應頂點／對應邊的配色（第 1、2、3、4 組）
const DK_PAIR = [DK_BLUE, DK_GREEN, DK_MUSTARD, '#c4a1f0'];

// 縮放倍率的滑桿刻度（索引 0～6）
const DK_R = [[1, 3], [1, 2], [2, 3], [3, 2], [2, 1], [5, 2], [3, 1]];

/* ==========================================================================
   1. 本節工具（dk 前綴）
   ========================================================================== */

// 倍率的文字：dkRT 給 dkRich（分數用 {n/d}）、dkRL 給滑桿標籤
function dkRT(q) { return q[1] === 1 ? String(q[0]) : `{${q[0]}/${q[1]}}`; }
function dkRL(q) { return q[1] === 1 ? String(q[0]) : `${q[0]}/${q[1]}`; }

// 數學座標（y 朝上）的小工具
function dkDir(deg) { return hbV(Math.cos(deg * HB_RAD), Math.sin(deg * HB_RAD)); }
function dkAdd(P, v, s) { return hbV(P.x + v.x * s, P.y + v.y * s); }
function dkScale(O, P, k) { return hbV(O.x + (P.x - O.x) * k, O.y + (P.y - O.y) * k); }
function dkLen(P, Q) { return Math.hypot(P.x - Q.x, P.y - Q.y); }
function dkRot(P, C, deg) {
  const c = Math.cos(deg * HB_RAD), s = Math.sin(deg * HB_RAD);
  const x = P.x - C.x, y = P.y - C.y;
  return hbV(C.x + x * c - y * s, C.y + x * s + y * c);
}

// 把一組數學座標點等比例放進 box（y 翻成朝下），回傳 { k, P(p) }
function dkView(pts, box) {
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = Math.min(box.w / Math.max(x1 - x0, 1e-6), box.h / Math.max(y1 - y0, 1e-6));
  const ox = box.x + (box.w - (x1 - x0) * k) / 2, oy = box.y + (box.h - (y1 - y0) * k) / 2;
  return { k, P: p => hbV(ox + (p.x - x0) * k, oy + (y1 - p.y) * k) };
}

// 兩組點用同一個比例尺，各自置中在自己的 box 裡
function dkView2(ptsL, boxL, ptsR, boxR) {
  const ext = pts => {
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  };
  const a = ext(ptsL), b = ext(ptsR);
  const k = Math.min(boxL.w / Math.max(a.x1 - a.x0, 1e-6), boxL.h / Math.max(a.y1 - a.y0, 1e-6),
                     boxR.w / Math.max(b.x1 - b.x0, 1e-6), boxR.h / Math.max(b.y1 - b.y0, 1e-6));
  const mk = (e, box) => {
    const ox = box.x + (box.w - (e.x1 - e.x0) * k) / 2, oy = box.y + (box.h - (e.y1 - e.y0) * k) / 2;
    return p => hbV(ox + (p.x - e.x0) * k, oy + (e.y1 - p.y) * k);
  };
  return { k, L: mk(a, boxL), R: mk(b, boxR) };
}

// 由三邊作三角形（數學座標）：BC = a、CA = b、AB = c；B 在原點、C 在右、A 在上
function dkTriSides(a, b, c) {
  const x = (c * c + a * a - b * b) / (2 * a);
  const y = Math.sqrt(Math.max(c * c - x * x, 0));
  return { A: hbV(x, y), B: hbV(0, 0), C: hbV(a, 0) };
}

// 由兩角作三角形：BC = a、∠B、∠C（度）
function dkTriAngles(a, B, C) {
  const A = 180 - B - C;
  const c = a * Math.sin(C * HB_RAD) / Math.sin(A * HB_RAD);
  return { A: dkAdd(hbV(0, 0), dkDir(B), c), B: hbV(0, 0), C: hbV(a, 0) };
}

/* --------------------------------------------------------------------------
   dkRich：一行混排的字
     [AB]     上面加一條橫線的線段名（斜體）
     {n/d}    直式分數
     `AA`     反引號裡照原樣、直立（性質名稱用）
     英文字母 自動斜體（後面的 ' 一起算）
   parts 是 [[字串, 顏色], …]；超過 maxW 會自動縮字。
   -------------------------------------------------------------------------- */
const DK_UPRIGHT = ['AA', 'AAA', 'SAS', 'SSS', 'SSA', 'ASA'];

function dkTok(str, color) {
  const out = [];
  let buf = '';
  const flush = () => { if (buf) { out.push({ k: 'up', s: buf, c: color }); buf = ''; } };
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '[') {
      const j = str.indexOf(']', i);
      flush(); out.push({ k: 'ov', s: str.slice(i + 1, j), c: color }); i = j; continue;
    }
    if (ch === '{') {
      const j = str.indexOf('}', i);
      const p = str.slice(i + 1, j).split('/');
      flush(); out.push({ k: 'fr', n: p[0], d: p[1], c: color }); i = j; continue;
    }
    if (ch === '`') {
      const j = str.indexOf('`', i + 1);
      buf += str.slice(i + 1, j); i = j; continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      flush();
      let s = ch;
      while (i + 1 < str.length && /[A-Za-z']/.test(str[i + 1])) s += str[++i];
      // 性質名稱（AA、SAS、SSS、SSA）照原樣直立，不是變數
      if (DK_UPRIGHT.indexOf(s) >= 0) { buf += s; continue; }
      out.push({ k: 'it', s, c: color });
      continue;
    }
    buf += ch;
  }
  flush();
  return out;
}

function dkTokW(ctx, t, s) {
  if (t.k === 'fr') {
    ctx.font = f(700, s * 0.74);
    return Math.max(ctx.measureText(t.n).width, ctx.measureText(t.d).width) + 6;
  }
  ctx.font = t.k === 'up' ? f(700, s) : fi(700, s);
  return ctx.measureText(t.s).width + (t.k === 'up' ? 0 : 1.5);
}

function dkTokD(ctx, t, x, y, s) {
  ctx.fillStyle = t.c;
  ctx.textBaseline = 'middle';
  if (t.k === 'fr') {
    const w = dkTokW(ctx, t, s);
    ctx.font = f(700, s * 0.74);
    ctx.textAlign = 'center';
    ctx.fillText(t.n, x + w / 2, y - s * 0.44);
    ctx.fillText(t.d, x + w / 2, y + s * 0.5);
    ctx.fillRect(x + 1.5, y - 0.9, w - 3, 1.8);
    ctx.textAlign = 'left';
    return w;
  }
  ctx.font = t.k === 'up' ? f(700, s) : fi(700, s);
  ctx.textAlign = 'left';
  ctx.fillText(t.s, x, y);
  const w = ctx.measureText(t.s).width;
  if (t.k === 'ov') ctx.fillRect(x + 1.5, y - s * 0.72, w - 0.5, 1.7);
  return w + (t.k === 'up' ? 0 : 1.5);
}

function dkRich(ctx, parts, x, y, size, o) {
  const opt = o || {};
  const toks = [];
  parts.forEach(p => dkTok(p[0], p[1]).forEach(t => toks.push(t)));
  const maxW = opt.maxW || ctx.canvas.width - 28;
  ctx.save();
  let s = size;
  const width = () => toks.reduce((a, t) => a + dkTokW(ctx, t, s), 0);
  let w = width();
  while (w > maxW && s > 10) { s -= 0.5; w = width(); }
  let x0 = opt.align === 'left' ? x : x - w / 2;
  if (opt.bg) {
    ctx.fillStyle = 'rgba(28, 22, 17, 0.88)';
    roundRect(ctx, x0 - 5, y - s * 0.78, w + 10, s * 1.56, 6);
    ctx.fill();
  }
  toks.forEach(t => { x0 += dkTokD(ctx, t, x0, y, s); });
  ctx.restore();
  return w;
}

// 置中的一行字（單色）
function dkRow(ctx, str, y, color, size) {
  return dkRich(ctx, [[str, color]], ctx.canvas.width / 2, y, size || 16);
}

// 圖上的小標籤：深色底、置中在 (x, y)
function dkTag(ctx, str, x, y, color, size) {
  return dkRich(ctx, [[str, color]], x, y, size || 14, { bg: true });
}

// 邊長標籤：放在 PQ 中點、往遠離 G 的那一側外推（開發約束 18）
function dkSideTag(ctx, P, Q, G, str, color, off, size) {
  const m = hbV((P.x + Q.x) / 2, (P.y + Q.y) / 2);
  const d = hbDist(P, Q) || 1;
  let nx = -(Q.y - P.y) / d, ny = (Q.x - P.x) / d;
  if ((m.x - G.x) * nx + (m.y - G.y) * ny < 0) { nx = -nx; ny = -ny; }
  const k = off || 18;
  dkTag(ctx, str, m.x + nx * k, m.y + ny * k, color, size || 14);
}

// 點名（深色描邊）
function dkName(ctx, P, text, color, dx, dy) {
  cgLabel(ctx, P, text, color, dx, dy, fi(800, 17));
}

// 實心點加深色外圈
function dkPt(ctx, P, color, r) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(20, 14, 10, 0.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(P.x, P.y, r || 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// 縮放中心：放大機的燈泡（芥末黃的光暈）
function dkLamp(ctx, P) {
  ctx.save();
  const g = ctx.createRadialGradient(P.x, P.y, 0, P.x, P.y, 22);
  g.addColorStop(0, 'rgba(230, 184, 76, 0.55)');
  g.addColorStop(1, 'rgba(230, 184, 76, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(P.x, P.y, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  dkPt(ctx, P, DK_MUSTARD, 6);
}

// ∠PVQ（取小於 180° 的那一側），90° 時畫直角記號
function dkAng(ctx, V, P, Q, r, color, o) {
  const a = hbHead(V, P), b = hbHead(V, Q);
  const d = ((b - a) % 360 + 360) % 360;
  let s0 = a, sw = d;
  if (d > 180) { s0 = b; sw = 360 - d; }
  const right = Math.abs(sw - 90) < 0.01;
  hbSector(ctx, V, s0, right ? 90 : sw, r, color, Object.assign({ right, alpha: 0.3 }, o || {}));
}

// 多邊形（畫布座標）
function dkPoly(ctx, pts, color, alpha, width, dash) {
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
  ctx.lineWidth = width || 2.8;
  ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.stroke();
  ctx.restore();
}

// 頂點名一律推到圖形外側（由重心往外）
function dkNames(ctx, pts, names, color, dist) {
  const G = hbCentroid(pts);
  pts.forEach((p, i) => hbVLabel(ctx, p, G, names[i], color, dist || 17));
}

// 互動卡的滑桿列：依模式顯示或隱藏
function dkShow(ids, on) {
  ids.forEach(id => { const el = hbEl(id); if (el) el.style.display = on ? '' : 'none'; });
}

// 有理數的「x : y」比值文字與相等判斷
function dkRatio(a, b) { return qOf(a, b); }

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第五冊 1-3 的 22 題正解
  // 正解字母分布：A 6 題、B 5 題、C 6 題、D 5 題（開發約束 36）
  const answers = {
    '1-3-1': 'A',    // OA' = 20，A'B' = 28，A'B' // AB
    '1-3-2': 'B',    // 中心在線段上：同一直線、C' D' 在 O 兩側，C'D' = 15/4
    '1-3-3': 'C',    // 角縮放後度數不變：38°
    '1-3-4': 'D',    // 三個角都減半，內角和只剩 90°
    '1-3-5': 'A',    // 中心位置不同，縮放圖形全等
    '1-3-6': 'C',    // 周長 18 × 2/3 = 12
    '1-3-7': 'D',    // 邊長 8，內角 156° 不變
    '1-3-8': 'C',    // 兩個正二十邊形一定相似
    '1-3-9': 'C',    // AD : PS = CD : RS
    '1-3-10': 'B',   // K→Y、L→Z、M→W、N→X ⇒ YZWX
    '1-3-11': 'B',   // ABFE（8×6）與 ABCD（8×12）兩種對應都不成比例
    '1-3-12': 'A',   // 正方形與 72° 菱形：邊成比例、角不相等
    '1-3-13': 'D',   // ∠H = ∠D = 360 − 84 − 77 − 108 = 91
    '1-3-14': 'A',   // AD = 15，AB = 6，多 2
    '1-3-15': 'C',   // 9 : BC = 10 : 15，BC = 27/2
    '1-3-16': 'A',   // 8 : AB = 7 : 14，AB = 16，BD = 9
    '1-3-17': 'D',   // △ACB ∼ △ECD（SAS，2 : 5），DE = 25/2
    '1-3-18': 'B',   // SSA 不一定相似
    '1-3-19': 'B',   // 12、18、21 = 3 × (4、6、7)
    '1-3-20': 'A',   // △ABD ∼ △DBC（SSS），∠A = ∠BDC
    '1-3-21': 'C',   // AB : AE = AC : AD = 2，夾角 ∠A 共用 ⇒ SAS
    '1-3-22': 'D'    // 阿光：∠D = ∠A、∠F = ∠C ⇒ AA
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
const DK_QUIZ_FIGS = {
  // Q15：A 字型，AE = 10、EC = 5、DE = 9（D、E 在 2/3 處）
  q15(ctx, W, H) {
    const tri = dkTriAngles(13.5, 64, 50);
    const D0 = dkScale(tri.A, tri.B, 2 / 3), E0 = dkScale(tri.A, tri.C, 2 / 3);
    const V = dkView([tri.A, tri.B, tri.C], { x: 60, y: 26, w: 200, h: 168 });
    const A = V.P(tri.A), B = V.P(tri.B), C = V.P(tri.C), D = V.P(D0), E = V.P(E0);
    dkPoly(ctx, [A, B, C], DK_IVORY, 0.06, 2.4);
    hbSeg(ctx, D, E, DK_SEPIA, 2.4);
    dkNames(ctx, [A, B, C], ['A', 'B', 'C'], DK_IVORY);
    dkName(ctx, D, 'D', DK_IVORY, -14, -2);
    dkName(ctx, E, 'E', DK_IVORY, 14, -2);
    dkPt(ctx, D, DK_IVORY, 3.5); dkPt(ctx, E, DK_IVORY, 3.5);
    const G = hbCentroid([A, B, C]);
    dkSideTag(ctx, A, E, G, '10', DK_SEPIA, 16, 14);
    dkSideTag(ctx, E, C, G, '5', DK_SEPIA, 16, 14);
    dkTag(ctx, '9', (D.x + E.x) / 2, (D.y + E.y) / 2 - 13, DK_SEPIA, 14);
  },

  // Q16：∠ABC = ∠AED；AD = 7、AE = 8、EC = 6（AB = 16、AC = 14，依比例畫）
  q16(ctx, W, H) {
    const A0 = hbV(0, 0);
    const B0 = dkAdd(A0, dkDir(-112), 16), C0 = dkAdd(A0, dkDir(-58), 14);
    const D0 = dkAdd(A0, dkDir(-112), 7), E0 = dkAdd(A0, dkDir(-58), 8);
    const V = dkView([A0, B0, C0], { x: 60, y: 22, w: 200, h: 176 });
    const A = V.P(A0), B = V.P(B0), C = V.P(C0), D = V.P(D0), E = V.P(E0);
    dkPoly(ctx, [A, B, C], DK_IVORY, 0.06, 2.4);
    hbSeg(ctx, D, E, DK_SEPIA, 2.4);
    dkAng(ctx, B, A, C, 26, DK_BLUE);
    dkAng(ctx, E, A, D, 14, DK_BLUE);
    dkNames(ctx, [A, B, C], ['A', 'B', 'C'], DK_IVORY);
    dkName(ctx, D, 'D', DK_IVORY, -13, 0);
    dkName(ctx, E, 'E', DK_IVORY, 13, 2);
    dkPt(ctx, D, DK_IVORY, 3.5); dkPt(ctx, E, DK_IVORY, 3.5);
    const G = hbCentroid([A, B, C]);
    dkSideTag(ctx, A, D, G, '7', DK_SEPIA, 14, 13);
    dkSideTag(ctx, A, E, G, '8', DK_SEPIA, 14, 13);
    dkSideTag(ctx, E, C, G, '6', DK_SEPIA, 14, 13);
  },

  // Q17：X 字型，AC = 4、CE = 10、BC = 6、CD = 15、AB = 5
  q17(ctx, W, H) {
    const t = Math.acos(27 / 48) / HB_RAD;           // ∠ACB（由三邊 4、6、5 實算）
    const C0 = hbV(0, 0);
    const A0 = dkAdd(C0, dkDir(180 - t / 2), 4), B0 = dkAdd(C0, dkDir(180 + t / 2), 6);
    const E0 = dkAdd(C0, dkDir(-t / 2), 10), D0 = dkAdd(C0, dkDir(t / 2), 15);
    const V = dkView([A0, B0, C0, D0, E0], { x: 34, y: 22, w: 252, h: 176 });
    const A = V.P(A0), B = V.P(B0), C = V.P(C0), D = V.P(D0), E = V.P(E0);
    hbSeg(ctx, A, E, DK_IVORY, 2.4);
    hbSeg(ctx, B, D, DK_IVORY, 2.4);
    hbSeg(ctx, A, B, DK_SEPIA, 2.4);
    hbSeg(ctx, D, E, DK_SEPIA, 2.4);
    [A, B, C, D, E].forEach(p => dkPt(ctx, p, DK_IVORY, 3.5));
    dkName(ctx, A, 'A', DK_IVORY, -13, -4);
    dkName(ctx, B, 'B', DK_IVORY, -13, 4);
    dkName(ctx, C, 'C', DK_IVORY, 0, -15);
    dkName(ctx, D, 'D', DK_IVORY, 13, -4);
    dkName(ctx, E, 'E', DK_IVORY, 13, 4);
    dkSideTag(ctx, A, C, B, '4', DK_SEPIA, 13, 13);
    dkSideTag(ctx, C, E, D, '10', DK_SEPIA, 13, 13);
    dkSideTag(ctx, B, C, A, '6', DK_SEPIA, 13, 13);
    dkSideTag(ctx, C, D, E, '15', DK_SEPIA, 13, 13);
    dkSideTag(ctx, A, B, C, '5', DK_SEPIA, 14, 13);
  },

  // Q21：AD = 3、DB = 5、AE = 4、EC = 2
  q21(ctx, W, H) {
    const A0 = hbV(0, 0);
    const B0 = dkAdd(A0, dkDir(-118), 8), C0 = dkAdd(A0, dkDir(-52), 6);
    const D0 = dkAdd(A0, dkDir(-118), 3), E0 = dkAdd(A0, dkDir(-52), 4);
    const V = dkView([A0, B0, C0], { x: 64, y: 26, w: 192, h: 168 });
    const A = V.P(A0), B = V.P(B0), C = V.P(C0), D = V.P(D0), E = V.P(E0);
    dkPoly(ctx, [A, B, C], DK_IVORY, 0.06, 2.4);
    hbSeg(ctx, D, E, DK_SEPIA, 2.4);
    dkNames(ctx, [A, B, C], ['A', 'B', 'C'], DK_IVORY);
    dkName(ctx, D, 'D', DK_IVORY, -14, -2);
    dkName(ctx, E, 'E', DK_IVORY, 14, -2);
    dkPt(ctx, D, DK_IVORY, 3.5); dkPt(ctx, E, DK_IVORY, 3.5);
    const G = hbCentroid([A, B, C]);
    dkSideTag(ctx, A, D, G, '3', DK_SEPIA, 15, 13);
    dkSideTag(ctx, D, B, G, '5', DK_SEPIA, 15, 13);
    dkSideTag(ctx, A, E, G, '4', DK_SEPIA, 15, 13);
    dkSideTag(ctx, E, C, G, '2', DK_SEPIA, 15, 13);
  }
};

function initQuizFigs() {
  document.querySelectorAll('canvas.quiz-fig[data-fig]').forEach(cv => {
    const fn = DK_QUIZ_FIGS[cv.getAttribute('data-fig')];
    if (!fn) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    fn(ctx, cv.width, cv.height);
  });
}

/* ==========================================================================
   重點 1：縮放中心、縮放倍率與線段的縮放
   ========================================================================== */
function initSegCanvas() {
  const cv = hbEl('canvas-seg');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sr = hbEl('seg-r'), vr = hbEl('seg-vr');
  const out = hbEl('seg-formula'), fb = hbEl('seg-feedback');
  const C0 = DK_TONE[0];
  let mode = 'out';
  // 三種中心位置（長度都是整數：3-4-5 的方向）
  const SET = {
    out: { A: hbV(4, 3), B: hbV(4, -3), OA: 5, OB: 5, AB: 6 },
    on: { A: hbV(-1.6, -1.2), B: hbV(2.4, 1.8), OA: 2, OB: 3, AB: 5 },
    end: { A: hbV(0, 0), B: hbV(4, 3), OA: 0, OB: 5, AB: 5 }
  };

  function draw() {
    const W = cv.width;
    const r = DK_R[hbClampSlider(sr, 0, 6)], k = qVal(r);
    vr.textContent = dkRL(r) + ' 倍';
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `以 O 為中心，把線段 AB 縮放 ${dkRL(r)} 倍`, C0);

    const S = SET[mode], O0 = hbV(0, 0);
    const A1 = dkScale(O0, S.A, k), B1 = dkScale(O0, S.B, k);
    const V = dkView([O0, S.A, S.B, A1, B1], { x: 70, y: 62, w: 400, h: 226 });
    const O = V.P(O0), A = V.P(S.A), B = V.P(S.B), A2 = V.P(A1), B2 = V.P(B1);

    // 光線：從燈泡沿著對應點射出去
    if (mode === 'out') {
      [[A, A2], [B, B2]].forEach(([P, Q]) => {
        const far = hbDist(O, P) > hbDist(O, Q) ? P : Q;
        hbSeg(ctx, O, hbBeyond(O, far, 26), DK_FAINT, 2, [7, 6]);
      });
    } else {
      const farB = hbDist(O, B) > hbDist(O, B2) ? B : B2;
      const e1 = hbBeyond(O, farB, 26);
      let e2;
      if (mode === 'on') {
        const farA = hbDist(O, A) > hbDist(O, A2) ? A : A2;
        e2 = hbBeyond(O, farA, 26);
      } else {
        e2 = O;
      }
      hbSeg(ctx, e2, e1, DK_FAINT, 2, [7, 6]);
    }

    // 新線段先畫（粗、半透明），原線段疊在上面
    ctx.save();
    ctx.globalAlpha = 0.75;
    hbSeg(ctx, A2, B2, DK_RED, mode === 'out' ? 4.5 : 9);
    ctx.restore();
    hbSeg(ctx, A, B, DK_IVORY, 3.2);

    dkLamp(ctx, O);
    if (mode !== 'end') { dkPt(ctx, A, DK_IVORY); dkPt(ctx, A2, DK_ROSE); }
    dkPt(ctx, B, DK_IVORY);
    dkPt(ctx, B2, DK_ROSE);

    // 點名與長度標籤
    if (mode === 'out') {
      dkName(ctx, O, 'O', DK_MUSTARD, -20, 0);
      dkName(ctx, A, 'A', DK_IVORY, -2, -17);
      dkName(ctx, B, 'B', DK_IVORY, -2, 18);
      dkName(ctx, A2, "A'", DK_ROSE, 6, -17);
      dkName(ctx, B2, "B'", DK_ROSE, 6, 18);
      // 離 O 近的那一條，標籤放在靠 O 的一側；遠的那一條放外側
      const near = k > 1 ? [A, B] : [A2, B2], farSeg = k > 1 ? [A2, B2] : [A, B];
      const nearTxt = k > 1 ? `[AB] = ${S.AB}` : `[A'B'] = ${dkRT(qMul(r, S.AB))}`;
      const farTxt = k > 1 ? `[A'B'] = ${dkRT(qMul(r, S.AB))}` : `[AB] = ${S.AB}`;
      // 近的那條離 O 太近時，標籤改放外側，免得壓到 O
      const nm = hbV((near[0].x + near[1].x) / 2, (near[0].y + near[1].y) / 2);
      const toward = hbDist(O, nm) >= 75;
      dkSideTag(ctx, near[0], near[1], toward ? hbBeyond(O, near[0], 999) : O, nearTxt, k > 1 ? DK_IVORY : DK_ROSE, 34, 14);
      dkSideTag(ctx, farSeg[0], farSeg[1], O, farTxt, k > 1 ? DK_ROSE : DK_IVORY, 40, 14);
    } else {
      // 共線：原線段的字放左上、新線段的字放右下
      const u = hbV(0.6, 0.8);
      if (mode === 'on') {
        dkName(ctx, O, 'O', DK_MUSTARD, -u.x * 20, -u.y * 20);
        dkName(ctx, A, 'A', DK_IVORY, -u.x * 18, -u.y * 18);
        dkName(ctx, A2, "A'", DK_ROSE, u.x * 18, u.y * 18);
      } else {
        dkName(ctx, O, "O = A = A'", DK_MUSTARD, 6, 22);
      }
      dkName(ctx, B, 'B', DK_IVORY, -u.x * 18, -u.y * 18);
      dkName(ctx, B2, "B'", DK_ROSE, u.x * 18, u.y * 18);
      const mA = hbV((A.x + B.x) / 2, (A.y + B.y) / 2), mA2 = hbV((A2.x + B2.x) / 2, (A2.y + B2.y) / 2);
      dkTag(ctx, `[AB] = ${S.AB}`, mA.x - u.x * 40, mA.y - u.y * 40, DK_IVORY, 14);
      dkTag(ctx, `[A'B'] = ${dkRT(qMul(r, S.AB))}`, mA2.x + u.x * 42, mA2.y + u.y * 42, DK_ROSE, 14);
    }

    // 說明列
    const rt = dkRT(r);
    if (mode === 'end') {
      dkRow(ctx, `O 就是 A：A 不動，A' = A；[OB'] = ${rt} × [OB] = ${rt} × ${S.OB} = ${dkRT(qMul(r, S.OB))}`, 334, DK_SEPIA, 16);
    } else {
      dkRow(ctx, `[OA'] = ${rt} × [OA] = ${rt} × ${S.OA} = ${dkRT(qMul(r, S.OA))}，[OB'] = ${rt} × ${S.OB} = ${dkRT(qMul(r, S.OB))}`, 334, DK_SEPIA, 16);
    }
    dkRow(ctx, `[A'B'] = ${rt} × [AB] = ${rt} × ${S.AB} = ${dkRT(qMul(r, S.AB))}`, 370, DK_ROSE, 17);
    if (mode === 'out') {
      dkRow(ctx, `[A'B'] // [AB]：兩條線段互相平行`, 406, DK_OK, 16);
    } else {
      dkRow(ctx, `中心在直線 AB 上：[A'B'] 和 [AB] 在同一條直線上`, 406, DK_OK, 16);
    }
    dkRow(ctx, k > 1 ? `倍率 ${rt} > 1：放大` : `倍率 ${rt} < 1：縮小`, 444, MUTED, 15);

    // 數值列與回饋
    const rTex = qTex(r), ab = qTex(qMul(r, S.AB));
    out.innerHTML = wbrEq(`\\overline{A'B'} = ${rTex} \\times ${S.AB} = ${ab}`)
      + (mode === 'out' ? '，<wbr>\\(\\overline{A\'B\'} /\\!/ \\overline{AB}\\)' : '');
    if (mode === 'out') {
      fb.innerHTML = wrapFeedback(`\\(A'\\)、\\(B'\\) 各自留在射線 \\(OA\\)、\\(OB\\) 上，離 \\(O\\) 的距離都變成 \\(${rTex}\\) 倍。<br>連起來的 \\(\\overline{A'B'}\\) 與 \\(\\overline{AB}\\) <strong>平行</strong>，長度也是 \\(${rTex}\\) 倍。`);
    } else if (mode === 'on') {
      fb.innerHTML = wrapFeedback(`\\(O\\) 在線段上：\\(A'\\) 留在 \\(O\\) 的 \\(A\\) 那一側、\\(B'\\) 留在 \\(B\\) 那一側，兩個對應點仍在同一條直線上。<br>畫法一樣、長度一樣是 \\(${rTex}\\) 倍，只是不平行而是<strong>共線</strong>。`);
    } else {
      fb.innerHTML = wrapFeedback(`中心就是端點 \\(A\\)：\\(A\\) 到中心的距離是 0，乘多少倍都是 0，所以 \\(A\\) 不動。<br>\\(B'\\) 在射線 \\(AB\\) 上，\\(\\overline{AB'}\\) 是 \\(\\overline{AB}\\) 的 \\(${rTex}\\) 倍。`);
    }
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('seg-mode-group'), 'data-seg-mode', m => { mode = m; draw(); });
  sr.addEventListener('input', draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：角經過縮放，度數不變
   C 在原點，CB 朝 0°、CA 朝 t°；O 在角的內部（角平分線上）或外部（反方向）。
   ========================================================================== */
function initAngCanvas() {
  const cv = hbEl('canvas-ang');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const st = hbEl('ang-t'), sr = hbEl('ang-r'), vt = hbEl('ang-vt'), vr = hbEl('ang-vr');
  const out = hbEl('ang-formula'), fb = hbEl('ang-feedback');
  const C1 = DK_TONE[1];
  let mode = 'in';

  function draw() {
    const W = cv.width;
    const t = hbClampSlider(st, 30, 150);
    const r = DK_R[hbClampSlider(sr, 0, 6)], k = qVal(r);
    vt.textContent = t + '°';
    vr.textContent = dkRL(r) + ' 倍';
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `把 ∠ACB 縮放 ${dkRL(r)} 倍，角度變了嗎？`, C1);

    const Cm = hbV(0, 0), Am = dkAdd(Cm, dkDir(t), 4), Bm = hbV(5, 0);
    const Om = mode === 'in' ? dkAdd(Cm, dkDir(t / 2), 2.2) : dkAdd(Cm, dkDir(Math.min(270 + t / 2, 312)), 3.4);
    const C2m = dkScale(Om, Cm, k), A2m = dkScale(Om, Am, k), B2m = dkScale(Om, Bm, k);
    // 射線畫到比點再遠一點
    const RA = dkScale(Cm, Am, 1.3), RB = dkScale(Cm, Bm, 1.25);
    const RA2 = dkScale(C2m, A2m, 1.3), RB2 = dkScale(C2m, B2m, 1.25);
    const V = dkView([Om, Cm, RA, RB, C2m, RA2, RB2], { x: 40, y: 58, w: 460, h: 236 });
    const O = V.P(Om), C = V.P(Cm), A = V.P(Am), B = V.P(Bm);
    const C2 = V.P(C2m), A2 = V.P(A2m), B2 = V.P(B2m);

    // 過 O、C、C' 的直線（內部模式才用得到：它截兩組平行線）
    if (mode === 'in') {
      const far = hbDist(O, C) > hbDist(O, C2) ? C : C2;
      hbSeg(ctx, hbBeyond(far, O, 24), hbBeyond(O, far, 30), DK_FAINT, 2, [7, 6]);
    } else {
      hbSeg(ctx, O, C, DK_FAINT, 1.6, [5, 6]);
      hbSeg(ctx, O, C2, DK_FAINT, 1.6, [5, 6]);
    }
    hbSeg(ctx, O, A, DK_FAINT, 1.4, [3, 6]);
    hbSeg(ctx, O, B, DK_FAINT, 1.4, [3, 6]);

    // 兩個角的兩邊（射線）
    hbSeg(ctx, C, V.P(RA), DK_IVORY, 3);
    hbSeg(ctx, C, V.P(RB), DK_IVORY, 3);
    hbSeg(ctx, C2, V.P(RA2), DK_ROSE, 3);
    hbSeg(ctx, C2, V.P(RB2), DK_ROSE, 3);

    if (mode === 'in') {
      dkAng(ctx, C, A, O, 30, DK_BLUE, { label: '1', font: f(800, 14) });
      dkAng(ctx, C, O, B, 30, DK_GREEN, { label: '2', font: f(800, 14) });
      dkAng(ctx, C2, A2, O, 30, DK_BLUE, { label: '3', font: f(800, 14) });
      dkAng(ctx, C2, O, B2, 30, DK_GREEN, { label: '4', font: f(800, 14) });
    } else {
      dkAng(ctx, C, A, B, 30, DK_MUSTARD, { label: `${t}°`, lr: 50, font: f(800, 14) });
      dkAng(ctx, C2, A2, B2, 30, DK_MUSTARD, { label: `${t}°`, lr: 50, font: f(800, 14) });
    }

    dkLamp(ctx, O);
    [C, A, B].forEach(p => dkPt(ctx, p, DK_IVORY, 4.5));
    [C2, A2, B2].forEach(p => dkPt(ctx, p, DK_ROSE, 4.5));
    // C 的點名放在角開口的反方向；A、B 放在角的外側
    const nA = dkDir(t + 90);
    dkName(ctx, C, 'C', DK_IVORY, nA.x * 17, -nA.y * 17);
    dkName(ctx, C2, "C'", DK_ROSE, nA.x * 19, -nA.y * 19);
    dkName(ctx, A, 'A', DK_IVORY, nA.x * 16, -nA.y * 16);
    dkName(ctx, A2, "A'", DK_ROSE, nA.x * 18, -nA.y * 18);
    dkName(ctx, B, 'B', DK_IVORY, 0, 16);
    dkName(ctx, B2, "B'", DK_ROSE, 0, 17);
    dkName(ctx, O, 'O', DK_MUSTARD, 0, mode === 'in' ? -18 : 20);

    // 說明列
    const rt = dkRT(r);
    dkRow(ctx, `射線 CA // C'A'，CB // C'B'（縮放後的射線互相平行）`, 330, DK_SEPIA, 15);
    if (mode === 'in') {
      dkRich(ctx, [['∠1 = ∠3', DK_BLUE], ['，', DK_SEPIA], ['∠2 = ∠4', DK_GREEN], ['（直線 OC 截兩組平行線，同位角相等）', DK_SEPIA]],
        W / 2, 364, 15);
    } else {
      dkRow(ctx, `兩邊各自平行、開口朝同一個方向，所以夾出的角一樣大`, 364, DK_SEPIA, 15);
    }
    dkRow(ctx, `∠A'C'B' = ∠ACB = ${t}°`, 402, DK_OK, 18);
    const wrong = qMul(r, t);
    dkRow(ctx, `不是 ${rt} × ${t}° = ${dkRT(wrong)}°：變成 ${rt} 倍的是長度，不是角度`, 442, DK_NO, 15);

    out.innerHTML = `\\(\\angle A'C'B' = \\angle ACB = ${t}^\\circ\\)`;
    fb.innerHTML = wrapFeedback(mode === 'in'
      ? `\\(\\angle 1 = \\angle 3\\)、\\(\\angle 2 = \\angle 4\\)，所以<br>${wbrEq("\\angle A'C'B' = \\angle 3 + \\angle 4 = \\angle 1 + \\angle 2 = \\angle ACB")}。<br>倍率換成多少，角度都是 \\(${t}^\\circ\\)。`
      : `中心在角的外面也一樣：兩邊各自平行、方向相同，角度不變。<br>倍率換成多少，角度都是 \\(${t}^\\circ\\)。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('ang-mode-group'), 'data-ang-mode', m => { mode = m; draw(); });
  [st, sr].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：多邊形的縮放——中心在哪裡都一樣
   四邊形 ABCD：A(0,0)、B(4,0)、C(7,4)、D(0,4)，四邊 4、5、7、4。
   ========================================================================== */
const DK_POLY = [hbV(0, 0), hbV(4, 0), hbV(7, 4), hbV(0, 4)];
const DK_POLY_SIDE = [4, 5, 7, 4];
const DK_POLY_CENTER = {
  out: { O: hbV(9.5, 6.5), name: '外部' },
  in: { O: hbV(3, 2), name: '內部' },
  vtx: { O: hbV(0, 4), name: '頂點 D' },
  edge: { O: hbV(2, 0), name: 'AB 上' }
};

function initPolyCanvas() {
  const cv = hbEl('canvas-poly');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sr = hbEl('poly-r'), vr = hbEl('poly-vr');
  const out = hbEl('poly-formula'), fb = hbEl('poly-feedback');
  const C2 = DK_TONE[2];
  let center = 'out', view = 'one';
  const NAMES = ['A', 'B', 'C', 'D'];

  function draw() {
    const W = cv.width;
    const r = DK_R[hbClampSlider(sr, 0, 6)], k = qVal(r);
    vr.textContent = dkRL(r) + ' 倍';
    ctx.clearRect(0, 0, W, cv.height);
    const box = { x: 50, y: 58, w: 440, h: 222 };

    if (view === 'one') {
      drawTitle(ctx, `以${DK_POLY_CENTER[center].name}一點為中心，縮放 ${dkRL(r)} 倍`, C2);
      const Om = DK_POLY_CENTER[center].O;
      const img = DK_POLY.map(p => dkScale(Om, p, k));
      const V = dkView([Om].concat(DK_POLY, img), box);
      const O = V.P(Om), P = DK_POLY.map(V.P), Q = img.map(V.P);
      // 光線
      P.forEach((p, i) => {
        const far = hbDist(O, p) > hbDist(O, Q[i]) ? p : Q[i];
        if (hbDist(O, far) > 1) hbSeg(ctx, O, far, DK_FAINT, 1.5, [5, 6]);
      });
      dkPoly(ctx, Q, DK_RED, 0.14, 3);
      dkPoly(ctx, P, DK_IVORY, 0.08, 2.6);
      const rad = Math.max(10, Math.min(22, V.k * 0.9));
      const radQ = Math.max(10, Math.min(22, V.k * k * 0.9));
      [0, 1, 2, 3].forEach(i => {
        const a = (i + 3) % 4, b = (i + 1) % 4;
        dkAng(ctx, P[i], P[a], P[b], rad, DK_PAIR[i]);
        dkAng(ctx, Q[i], Q[a], Q[b], radQ, DK_PAIR[i]);
      });
      dkLamp(ctx, O);
      const vtx = center === 'vtx';
      dkNames(ctx, P, vtx ? ['A', 'B', 'C', ''] : NAMES, DK_IVORY);
      dkNames(ctx, Q, (vtx ? ['A', 'B', 'C', ''] : NAMES).map(n => n ? n + "'" : ''), DK_ROSE);
      if (!vtx) dkName(ctx, O, 'O', DK_MUSTARD, 0, -19);
      else dkName(ctx, O, "O = D = D'", DK_MUSTARD, 30, -18);
    } else {
      drawTitle(ctx, `四種中心各縮放 ${dkRL(r)} 倍：位置不同，形狀大小呢？`, C2);
      const keys = ['out', 'in', 'vtx', 'edge'];
      const cols = [DK_RED, DK_BLUE, DK_GREEN, DK_MUSTARD];
      const imgs = keys.map(key => DK_POLY.map(p => dkScale(DK_POLY_CENTER[key].O, p, k)));
      let all = DK_POLY.slice();
      keys.forEach((key, i) => { all = all.concat(imgs[i]); all.push(DK_POLY_CENTER[key].O); });
      const V = dkView(all, box);
      dkPoly(ctx, DK_POLY.map(V.P), DK_IVORY, 0.1, 2.4);
      imgs.forEach((im, i) => {
        dkPoly(ctx, im.map(V.P), cols[i], 0.06, 2.4, i ? [8, 5] : null);
        dkPt(ctx, V.P(DK_POLY_CENTER[keys[i]].O), cols[i], 5);
      });
      dkNames(ctx, DK_POLY.map(V.P), NAMES, DK_IVORY);
      // 圖例
      const lx = [70, 190, 310, 430];
      keys.forEach((key, i) => dkTag(ctx, `中心在${DK_POLY_CENTER[key].name}`, lx[i], 300, cols[i], 13));
    }

    const rt = dkRT(r);
    const sd = DK_POLY_SIDE.map(s => dkRT(qMul(r, s)));
    dkRow(ctx, `[A'B'] = ${rt} × 4 = ${sd[0]}，[B'C'] = ${rt} × 5 = ${sd[1]}`, 330, DK_ROSE, 16);
    dkRow(ctx, `[C'D'] = ${rt} × 7 = ${sd[2]}，[D'A'] = ${rt} × 4 = ${sd[3]}`, 366, DK_ROSE, 16);
    dkRich(ctx, [['∠A\' = ∠A', DK_PAIR[0]], ['，', DK_SEPIA], ['∠B\' = ∠B', DK_PAIR[1]], ['，', DK_SEPIA],
      ['∠C\' = ∠C', DK_PAIR[2]], ['，', DK_SEPIA], ['∠D\' = ∠D', DK_PAIR[3]], ['（角記號同色）', DK_SEPIA]], W / 2, 402, 15);
    if (view === 'one') {
      dkRow(ctx, `每一邊都是 ${rt} 倍 ⇒ 對應邊成比例；角都不變 ⇒ 對應角相等`, 440, DK_OK, 15);
    } else {
      dkRow(ctx, `四個縮放圖形只是位置不同，邊與角完全一樣 ⇒ 彼此全等`, 440, DK_OK, 15);
    }

    const rTex = qTex(r);
    out.innerHTML = wbrEq(`\\frac{\\overline{A'B'}}{\\overline{AB}} = \\frac{\\overline{B'C'}}{\\overline{BC}} = \\frac{\\overline{C'D'}}{\\overline{CD}} = \\frac{\\overline{D'A'}}{\\overline{DA}} = ${rTex}`);
    fb.innerHTML = wrapFeedback(view === 'one'
      ? `中心在${DK_POLY_CENTER[center].name === 'AB 上' ? ' \\(\\overline{AB}\\) 上' : DK_POLY_CENTER[center].name}，縮放 \\(${rTex}\\) 倍：四邊都是 \\(${rTex}\\) 倍，四個角一個也沒變。<br>換一個中心再看看，邊長和角度會不會不一樣？`
      : `四種中心縮放 \\(${rTex}\\) 倍，得到的四邊形位置各不相同，但邊長都是原來的 \\(${rTex}\\) 倍、角都不變，<strong>彼此全等</strong>。<br>所以討論縮放時，沒有必要就不提中心在哪裡。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('poly-center-group'), 'data-poly-center', m => { center = m; draw(); });
  bindPickGroup(hbEl('poly-view-group'), 'data-poly-view', m => { view = m; draw(); });
  sr.addEventListener('input', draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：正 n 邊形縮放後仍是正 n 邊形
   ========================================================================== */
const DK_NGON = ['', '', '', '正三角形', '正方形', '正五邊形', '正六邊形', '正七邊形', '正八邊形',
                 '正九邊形', '正十邊形', '正十一邊形', '正十二邊形'];

function initRegCanvas() {
  const cv = hbEl('canvas-reg');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sn = hbEl('reg-n'), ss = hbEl('reg-s'), sr = hbEl('reg-r');
  const vn = hbEl('reg-vn'), vs = hbEl('reg-vs'), vr = hbEl('reg-vr');
  const out = hbEl('reg-formula'), fb = hbEl('reg-feedback');
  const C3 = DK_TONE[3];

  // 正 n 邊形（畫布座標）：底邊水平，底邊中點在 (cx, baseY)
  function ngon(n, side, cx, baseY) {
    const R = side / (2 * Math.sin(Math.PI / n));
    const apo = side / (2 * Math.tan(Math.PI / n));
    const cy = baseY - apo;
    const pts = [];
    for (let j = 0; j < n; j++) {
      const th = (-90 - 180 / n + j * 360 / n) * HB_RAD;
      pts.push(hbV(cx + R * Math.cos(th), cy - R * Math.sin(th)));
    }
    return pts;
  }

  function draw() {
    const W = cv.width;
    const n = hbClampSlider(sn, 3, 12), s = hbClampSlider(ss, 1, 6);
    const r = DK_R[hbClampSlider(sr, 0, 6)], k = qVal(r);
    vn.textContent = n;
    vs.textContent = s;
    vr.textContent = dkRL(r) + ' 倍';
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `${DK_NGON[n]}縮放 ${dkRL(r)} 倍`, C3);

    // 兩個圖形共用比例尺：較大的那個放得進 230 × 210
    const big = Math.max(s, s * k);
    const unit = ngon(n, big, 0, 0);
    const xs = unit.map(p => p.x), ys = unit.map(p => p.y);
    const u = Math.min(230 / (Math.max(...xs) - Math.min(...xs)), 206 / (Math.max(...ys) - Math.min(...ys)));
    const baseY = 274;
    const P = ngon(n, s * u, 140, baseY), Q = ngon(n, s * k * u, 400, baseY);
    dkPoly(ctx, P, DK_IVORY, 0.08, 2.6);
    dkPoly(ctx, Q, DK_RED, 0.14, 3);
    const angQ = qOf(180 * (n - 2), n);
    const angTxt = dkRT(angQ) + '°';
    [[P, DK_IVORY], [Q, DK_ROSE]].forEach(([pts, col]) => {
      const rad = Math.min(24, hbDist(pts[0], pts[1]) * 0.42);
      dkAng(ctx, pts[0], pts[1], pts[n - 1], rad, DK_MUSTARD);
      const G = hbCentroid(pts);
      const lab = hbV(pts[0].x + (G.x - pts[0].x) * 0.5, pts[0].y + (G.y - pts[0].y) * 0.5);
      dkTag(ctx, angTxt, lab.x, lab.y - 6, DK_MUSTARD, 13);
      dkTag(ctx, col === DK_IVORY ? String(s) : dkRT(qMul(r, s)), (pts[0].x + pts[1].x) / 2, baseY + 16, col, 14);
    });
    textCenter(ctx, '原來', 140, baseY + 42, DK_IVORY, f(700, 13));
    textCenter(ctx, `縮放 ${dkRL(r)} 倍`, 400, baseY + 42, DK_ROSE, f(700, 13));

    const rt = dkRT(r);
    const sd = dkRT(qMul(r, s));
    dkRow(ctx, `邊長：${s} → ${rt} × ${s} = ${sd}（每一邊都一樣長）`, 348, DK_ROSE, 16);
    dkRow(ctx, `內角：180° × (${n} − 2) ÷ ${n} = ${angTxt}（兩個一樣，不變）`, 384, DK_MUSTARD, 16);
    dkRow(ctx, `邊數相同、對應邊的比都是 ${rt}、內角都相等 ⇒ 兩個${DK_NGON[n]}相似`, 420, DK_OK, 15);
    dkRow(ctx, `${DK_NGON[n]}縮放之後，仍然是${DK_NGON[n]}`, 452, MUTED, 14);

    out.innerHTML = `邊長 \\(${s} \\to ${qTex(qMul(r, s))}\\)，<wbr>內角 \\(${hbDegTex(180 * (n - 2), n)}\\)`;
    fb.innerHTML = wrapFeedback(`內角 \\(\\frac{180^\\circ \\times (${n} - 2)}{${n}}\\) 只跟邊數有關：邊長變成 \\(${qTex(r)}\\) 倍，內角一點也沒變。<br>任意兩個${DK_NGON[n]}，邊都成比例、角都相等，所以<strong>一定相似</strong>。`);
    typeset([out, fb]);
  }

  [sn, ss, sr].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：相似多邊形——寫的順序就是對應關係
   ABCD：A(0,0)、B(9,0)、C(6,4)、D(0,4)，四邊 9、5、6、4。
   右邊放大 2 倍、轉 rot 度；A、B、C、D 的像依序標成 G、H、E、F。
   ========================================================================== */
function initCorrCanvas() {
  const cv = hbEl('canvas-corr');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sRot = hbEl('corr-rot'), vRot = hbEl('corr-vrot');
  const out = hbEl('corr-formula'), fb = hbEl('corr-feedback');
  const C4 = DK_TONE[4];
  const BASE = [hbV(0, 0), hbV(9, 0), hbV(6, 4), hbV(0, 4)];
  const SIDE = [9, 5, 6, 4];
  const L = ['E', 'F', 'G', 'H'];
  const N = ['A', 'B', 'C', 'D'];
  // 像的第 i 個頂點標成 L[(i + 2) % 4]
  const labOf = i => L[(i + 2) % 4];
  let m = 0;

  function draw() {
    const W = cv.width;
    const rot = hbClampSlider(sRot, 0, 330);
    vRot.textContent = rot + '°';
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `A 對應到 ${L[m]}，其餘照順序對應`, C4);

    const G0 = hbCentroid(BASE);
    const img = BASE.map(p => dkRot(dkScale(G0, p, 2), G0, rot));
    const V = dkView2(BASE, { x: 24, y: 66, w: 170, h: 196 }, img, { x: 230, y: 66, w: 280, h: 210 });
    const P = BASE.map(V.L), Q = img.map(V.R);

    // 選定的對應：原圖第 i 點 ↔ 像的第 j 點（標籤 L[(m + i) % 4]）
    const jOf = i => (((m + i - 2) % 4) + 4) % 4;
    dkPoly(ctx, P, DK_IVORY, 0.06, 1.2);
    dkPoly(ctx, Q, DK_IVORY, 0.06, 1.2);
    for (let i = 0; i < 4; i++) {
      const i2 = (i + 1) % 4, j = jOf(i), j2 = (j + 1) % 4;
      hbSeg(ctx, P[i], P[i2], DK_PAIR[i], 4);
      hbSeg(ctx, Q[j], Q[j2], DK_PAIR[i], 4);
      dkAng(ctx, P[i], P[(i + 3) % 4], P[i2], 13, DK_PAIR[i]);
      dkAng(ctx, Q[j], Q[(j + 3) % 4], Q[j2], 20, DK_PAIR[i]);
    }
    dkNames(ctx, P, N, DK_IVORY);
    dkNames(ctx, Q, [0, 1, 2, 3].map(labOf), DK_ROSE);
    const GP = hbCentroid(P);
    for (let i = 0; i < 4; i++) dkSideTag(ctx, P[i], P[(i + 1) % 4], GP, String(SIDE[i]), DK_SEPIA, 15, 13);
    const GQ = hbCentroid(Q);
    for (let j = 0; j < 4; j++) dkSideTag(ctx, Q[j], Q[(j + 1) % 4], GQ, String(SIDE[j] * 2), DK_SEPIA, 16, 13);

    // 四組邊的比與四組角
    const ratios = [], angOK = [];
    const angle = (pts, i) => hbAngleDeg(pts[i], pts[(i + 3) % 4], pts[(i + 1) % 4]);
    for (let i = 0; i < 4; i++) {
      const j = jOf(i);
      ratios.push(qOf(SIDE[i], SIDE[j] * 2));
      angOK.push(Math.abs(angle(BASE, i) - angle(BASE, j)) < 1e-6);
    }
    const sideOK = ratios.every(q => qEq(q, ratios[0]));
    const segName = i => `[${N[i]}${N[(i + 1) % 4]}] : [${L[(m + i) % 4]}${L[(m + i + 1) % 4]}]`;
    const ratioPart = i => [[`${segName(i)} = ${SIDE[i]} : ${SIDE[jOf(i)] * 2} = ${dkRT(ratios[i])}`, DK_PAIR[i]]];
    dkRich(ctx, ratioPart(0).concat([['    ', DK_SEPIA]], ratioPart(1)), W / 2, 316, 15);
    dkRich(ctx, ratioPart(2).concat([['    ', DK_SEPIA]], ratioPart(3)), W / 2, 352, 15);
    const angParts = [];
    for (let i = 0; i < 4; i++) {
      angParts.push([`∠${N[i]} 對 ∠${L[(m + i) % 4]} `, DK_PAIR[i]]);
      angParts.push([angOK[i] ? '✓' : '✗', angOK[i] ? DK_OK : DK_NO]);
      if (i < 3) angParts.push(['   ', DK_SEPIA]);
    }
    dkRich(ctx, angParts, W / 2, 390, 15);
    const name = [0, 1, 2, 3].map(i => L[(m + i) % 4]).join('');
    if (sideOK && angOK.every(Boolean)) {
      dkRow(ctx, `邊的比都是 ${dkRT(ratios[0])}、角都相等 ⇒ 四邊形 ABCD ∼ 四邊形 ${name}`, 432, DK_OK, 16);
    } else {
      dkRow(ctx, `${sideOK ? '' : '邊的比不全相等'}${!sideOK && !angOK.every(Boolean) ? '、' : ''}${angOK.every(Boolean) ? '' : '角也對不上'}：A 不是對應 ${L[m]}`, 432, DK_NO, 16);
    }
    dkRow(ctx, '右邊圖形怎麼轉，對應關係都不變', 462, MUTED, 13);

    const ok = sideOK && angOK.every(Boolean);
    out.innerHTML = ok
      ? `四邊形 \\(ABCD \\sim\\) 四邊形 \\(${name}\\)`
      : `\\(A\\) 對應 \\(${L[m]}\\)：<wbr>邊不成比例或角不相等`;
    fb.innerHTML = wrapFeedback(ok
      ? `\\(A \\leftrightarrow ${name[0]}\\)、\\(B \\leftrightarrow ${name[1]}\\)、\\(C \\leftrightarrow ${name[2]}\\)、\\(D \\leftrightarrow ${name[3]}\\)：同色的邊比都是 \\(${qTex(ratios[0])}\\)、同色的角都相等。<br>相似式照這個順序寫成「四邊形 \\(ABCD \\sim\\) 四邊形 \\(${name}\\)」。`
      : `同色的邊、同色的角就是你選的對應。有的邊比不相等、有的角對不上，表示這樣配錯了。<br>看角的大小（直角在哪裡）和邊的長短，換一個對應試試。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('corr-map-group'), 'data-corr-map', v => { m = parseInt(v, 10); draw(); });
  sRot.addEventListener('input', draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：只有邊成比例、或只有角相等，不一定相似
   左邊固定是邊長 4 的正方形。
   ========================================================================== */
function initOnlyCanvas() {
  const cv = hbEl('canvas-only');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sl = hbEl('only-l'), sw = hbEl('only-w'), sa = hbEl('only-a'), stt = hbEl('only-t');
  const vl = hbEl('only-vl'), vw = hbEl('only-vw'), va = hbEl('only-va'), vt = hbEl('only-vt');
  const out = hbEl('only-formula'), fb = hbEl('only-feedback');
  const C5 = DK_TONE[5];
  let mode = 'rect';

  function draw() {
    const W = cv.width;
    const Lr = hbClampSlider(sl, 2, 10), Wr = hbClampSlider(sw, 2, 8);
    const a = hbClampSlider(sa, 2, 8), t = hbClampSlider(stt, 40, 140);
    vl.textContent = Lr; vw.textContent = Wr; va.textContent = a; vt.textContent = t + '°';
    dkShow(['only-row-l', 'only-row-w'], mode === 'rect');
    dkShow(['only-row-a', 'only-row-t'], mode === 'rho');
    ctx.clearRect(0, 0, W, cv.height);

    const sq = [hbV(0, 0), hbV(4, 0), hbV(4, 4), hbV(0, 4)];
    let fig;
    if (mode === 'rect') {
      drawTitle(ctx, '正方形與長方形：四個角都是 90°', C5);
      fig = [hbV(0, 0), hbV(Lr, 0), hbV(Lr, Wr), hbV(0, Wr)];
    } else {
      drawTitle(ctx, '正方形與菱形：四組邊都成比例', C5);
      const d = dkDir(t);
      fig = [hbV(0, 0), hbV(a, 0), hbV(a + a * d.x, a * d.y), hbV(a * d.x, a * d.y)];
    }
    const V = dkView2(sq, { x: 30, y: 70, w: 170, h: 190 }, fig, { x: 236, y: 70, w: 254, h: 190 });
    const P = sq.map(V.L), Q = fig.map(V.R);
    dkPoly(ctx, P, DK_IVORY, 0.08, 2.6);
    dkPoly(ctx, Q, DK_RED, 0.14, 3);
    for (let i = 0; i < 4; i++) {
      dkAng(ctx, P[i], P[(i + 3) % 4], P[(i + 1) % 4], 14, DK_MUSTARD);
      dkAng(ctx, Q[i], Q[(i + 3) % 4], Q[(i + 1) % 4], 16, DK_MUSTARD);
    }
    const GP = hbCentroid(P), GQ = hbCentroid(Q);
    dkSideTag(ctx, P[0], P[1], GP, '4', DK_IVORY, 15, 14);
    dkSideTag(ctx, P[1], P[2], GP, '4', DK_IVORY, 15, 14);
    if (mode === 'rect') {
      dkSideTag(ctx, Q[0], Q[1], GQ, String(Lr), DK_ROSE, 15, 14);
      dkSideTag(ctx, Q[1], Q[2], GQ, String(Wr), DK_ROSE, 15, 14);
    } else {
      dkSideTag(ctx, Q[0], Q[1], GQ, String(a), DK_ROSE, 15, 14);
      dkSideTag(ctx, Q[1], Q[2], GQ, String(a), DK_ROSE, 15, 14);
      if (t !== 90) dkTag(ctx, `${t}°`, Q[0].x + 34, Q[0].y - 14, DK_MUSTARD, 13);
    }
    textCenter(ctx, '正方形', (P[0].x + P[1].x) / 2, 290, DK_IVORY, f(700, 14));
    textCenter(ctx, mode === 'rect' ? '長方形' : '菱形', (Q[0].x + Q[1].x) / 2 + (mode === 'rho' ? (Q[3].x - Q[0].x) / 2 : 0), 290, DK_ROSE, f(700, 14));

    let sim;
    if (mode === 'rect') {
      const q1 = qOf(Lr, 4), q2 = qOf(Wr, 4);
      const eq = qEq(q1, q2);
      sim = eq;
      dkRow(ctx, '四個角都是 90° ⇒ 對應角相等 ✓', 326, DK_OK, 16);
      dkRow(ctx, `長 : 邊 = ${Lr} : 4 = ${dkRT(q1)}，寬 : 邊 = ${Wr} : 4 = ${dkRT(q2)}`, 364, DK_SEPIA, 16);
      dkRow(ctx, eq ? '兩個比相等 ⇒ 對應邊成比例 ✓' : `${dkRT(q1)} ≠ ${dkRT(q2)} ⇒ 對應邊不成比例 ✗`, 402, eq ? DK_OK : DK_NO, 16);
      dkRow(ctx, eq ? '長 = 寬，它其實是正方形：相似' : '只有角相等，不相似', 442, eq ? DK_OK : DK_NO, 17);
      out.innerHTML = `\\(${Lr} : 4 ${eq ? '=' : '\\ne'} ${Wr} : 4\\)，<wbr>${eq ? '相似' : '不相似'}`;
      fb.innerHTML = wrapFeedback(eq
        ? '長和寬一樣長時，這個「長方形」就是正方形，兩個圖形才相似。'
        : '四個角都相等，但長、寬不一樣長：把正方形怎麼縮放，長和寬都還是一樣長，永遠變不成這個長方形。<br><strong>只有對應角相等，不一定相似。</strong>');
    } else {
      const q = qOf(a, 4);
      sim = (t === 90);
      dkRow(ctx, `四組邊的比都是 ${a} : 4 = ${dkRT(q)} ⇒ 對應邊成比例 ✓`, 326, DK_OK, 16);
      dkRow(ctx, `菱形的內角：${t}°、${180 - t}°；正方形：都是 90°`, 364, DK_SEPIA, 16);
      dkRow(ctx, sim ? '內角也都是 90° ⇒ 對應角相等 ✓' : '對應角不相等 ✗', 402, sim ? DK_OK : DK_NO, 16);
      dkRow(ctx, sim ? '這個菱形其實是正方形：相似' : '只有邊成比例，不相似', 442, sim ? DK_OK : DK_NO, 17);
      out.innerHTML = `內角 \\(${t}^\\circ\\)${sim ? '' : ' 與 \\(90^\\circ\\) 不相等'}，<wbr>${sim ? '相似' : '不相似'}`;
      fb.innerHTML = wrapFeedback(sim
        ? '內角是 \\(90^\\circ\\) 的菱形就是正方形，邊成比例、角也相等，所以相似。'
        : '四組邊都成比例，但菱形有一個角是 \\(' + t + '^\\circ\\)，正方形的角都是 \\(90^\\circ\\)：縮放不改變角度，永遠疊不上。<br><strong>只有對應邊成比例，不一定相似。</strong>');
    }
    void sim;
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('only-mode-group'), 'data-only-mode', v => { mode = v; draw(); });
  [sl, sw, sa, stt].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：已知相似，求邊長與角度
   由 AB、BC 與 ∠A、∠B、∠C 作四邊形：A 在原點、AB 朝右，逆時針走一圈。
   ========================================================================== */
function dkQuad(ab, bc, A, B, C) {
  const D = 360 - A - B - C;
  if (D <= 0 || D >= 180) return null;
  const PA = hbV(0, 0), PB = hbV(ab, 0);
  const PC = dkAdd(PB, dkDir(180 - B), bc);
  const u = dkDir(A), v = dkDir(360 - B - C);
  const det = -u.x * v.y + v.x * u.y;
  if (Math.abs(det) < 1e-9) return null;
  const dx = PC.x - PA.x, dy = PC.y - PA.y;
  const s = (-dx * v.y + v.x * dy) / det;
  const t = (u.x * dy - u.y * dx) / det;
  if (s <= 0.3 || t <= 0.3) return null;
  return [PA, PB, PC, dkAdd(PA, u, s)];
}

// 只給三個角（∠D = 360° − 其餘）：AB = 6 固定，AD 的長度在 0.5～800 之間（等比）找一個
// 讓 BC、CD 都夠長的值（任何一組凸四邊形的角都畫得出來，不靠固定的 BC）
function dkQuadAng(A, B, C) {
  const D = 360 - A - B - C;
  if (D <= 0 || D >= 180) return null;
  const PA = hbV(0, 0), PB = hbV(6, 0);
  const u = dkDir(180 - B), v = dkDir(A + D);    // B 出發的 BC 方向、C→D 的方向
  let best = null, bestScore = -1;
  for (let p = 0.5; p <= 800; p *= 1.02) {
    const PD = dkAdd(PA, dkDir(A), p);
    // PB + s·u = PD − q·v
    const det = u.x * v.y - u.y * v.x;
    if (Math.abs(det) < 1e-9) continue;
    const dx = PD.x - PB.x, dy = PD.y - PB.y;
    const sv = (dx * v.y - dy * v.x) / det;
    const q = (u.x * dy - u.y * dx) / det;
    const score = Math.min(sv, q, p, 6) / Math.max(sv, q, p, 6);   // 四邊越接近越好
    if (sv > 0.5 && q > 0.5 && score > bestScore) {
      bestScore = score;
      best = [PA, PB, dkAdd(PB, u, sv), PD];
    }
  }
  return best;
}

function initCalcCanvas() {
  const cv = hbEl('canvas-calc');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sA = hbEl('calc-A'), sB = hbEl('calc-B'), sC = hbEl('calc-C');
  const sab = hbEl('calc-ab'), sbc = hbEl('calc-bc'), sef = hbEl('calc-ef');
  const vA = hbEl('calc-vA'), vB = hbEl('calc-vB'), vC = hbEl('calc-vC');
  const vab = hbEl('calc-vab'), vbc = hbEl('calc-vbc'), vef = hbEl('calc-vef');
  const out = hbEl('calc-formula'), fb = hbEl('calc-feedback');
  let mode = 'ang';
  const FIX = { A: 75, B: 80, C: 110 };     // 「求邊」用的固定角度（∠D = 95°）

  function draw() {
    const W = cv.width;
    const A = hbClampSlider(sA, 65, 105), B = hbClampSlider(sB, 65, 105), C = hbClampSlider(sC, 65, 105);
    const ab = hbClampSlider(sab, 4, 9), bc = hbClampSlider(sbc, 2, 7), ef = hbClampSlider(sef, 2, 12);
    vA.textContent = A + '°'; vB.textContent = B + '°'; vC.textContent = C + '°';
    vab.textContent = ab; vbc.textContent = bc; vef.textContent = ef;
    dkShow(['calc-row-A', 'calc-row-B', 'calc-row-C'], mode === 'ang');
    dkShow(['calc-row-ab', 'calc-row-bc', 'calc-row-ef'], mode === 'side');
    ctx.clearRect(0, 0, W, cv.height);

    const quad = mode === 'ang' ? dkQuadAng(A, B, C) : dkQuad(ab, bc, FIX.A, FIX.B, FIX.C);
    drawTitle(ctx, mode === 'ang' ? '四邊形 ABCD ∼ 四邊形 EFGH：求角' : '四邊形 ABCD ∼ 四邊形 EFGH：求邊', DK_TONE[6]);
    if (!quad) {
      const D = 360 - A - B - C;
      dkRow(ctx, `∠D = 360° − ${A}° − ${B}° − ${C}° = ${D}°`, 170, DK_NO, 18);
      dkRow(ctx, D <= 0 ? '∠D 不是正的角度：圍不成四邊形（情境不成立）' : '∠D 不小於 180°：圍不成凸四邊形（情境不成立）', 210, DK_NO, 16);
      dkRow(ctx, D <= 0 ? '把 ∠A、∠B、∠C 調小一點，讓三個角的和小於 360°' : '把 ∠A、∠B、∠C 調大一點，讓三個角的和大於 180°', 246, MUTED, 15);
      out.innerHTML = `\\(\\angle D = ${D}^\\circ\\)，<wbr>情境不成立`;
      fb.innerHTML = wrapFeedback('四邊形的內角和是 \\(360^\\circ\\)，而且每個內角都要在 \\(0^\\circ\\) 到 \\(180^\\circ\\) 之間。這組角度圍不成四邊形。');
      typeset([out, fb]);
      return;
    }
    const kk = mode === 'ang' ? 1.5 : ef / ab;
    const G0 = hbCentroid(quad);
    const img = quad.map(p => dkScale(G0, p, kk));
    const V = dkView2(quad, { x: 28, y: 66, w: 196, h: 190 }, img, { x: 254, y: 66, w: 252, h: 200 });
    const P = quad.map(V.L), Q = img.map(V.R);
    dkPoly(ctx, P, DK_IVORY, 0.08, 2.6);
    dkPoly(ctx, Q, DK_RED, 0.12, 2.8);
    dkNames(ctx, P, ['A', 'B', 'C', 'D'], DK_IVORY);
    dkNames(ctx, Q, ['E', 'F', 'G', 'H'], DK_ROSE);
    const GP = hbCentroid(P), GQ = hbCentroid(Q);

    if (mode === 'ang') {
      const D = 360 - A - B - C;
      const angs = [A, B, C, D];
      for (let i = 0; i < 4; i++) {
        dkAng(ctx, P[i], P[(i + 3) % 4], P[(i + 1) % 4], 16, DK_PAIR[i]);
        dkAng(ctx, Q[i], Q[(i + 3) % 4], Q[(i + 1) % 4], 20, DK_PAIR[i]);
      }
      // 角度標在圖形內側
      for (let i = 0; i < 3; i++) {
        const p = hbV(P[i].x + (GP.x - P[i].x) * 0.42, P[i].y + (GP.y - P[i].y) * 0.42);
        dkTag(ctx, `${angs[i]}°`, p.x, p.y, DK_PAIR[i], 13);
      }
      const qh = hbV(Q[3].x + (GQ.x - Q[3].x) * 0.38, Q[3].y + (GQ.y - Q[3].y) * 0.38);
      dkTag(ctx, `${D}°`, qh.x, qh.y, DK_PAIR[3], 14);
      dkRich(ctx, [['∠E = ∠A = ' + A + '°', DK_PAIR[0]], ['，', DK_SEPIA], ['∠F = ∠B = ' + B + '°', DK_PAIR[1]], ['，', DK_SEPIA],
        ['∠G = ∠C = ' + C + '°', DK_PAIR[2]]], W / 2, 314, 15);
      dkRow(ctx, `∠H 對應 ∠D：∠D = 360° − ${A}° − ${B}° − ${C}° = ${D}°`, 354, DK_PAIR[3], 16);
      dkRow(ctx, `∠H = ∠D = ${D}°`, 394, DK_OK, 18);
      dkRow(ctx, '相似式裡同一個位置的字母，就是對應頂點', 436, MUTED, 14);
      out.innerHTML = wbrEq(`\\angle H = \\angle D = 360^\\circ - ${A}^\\circ - ${B}^\\circ - ${C}^\\circ = ${D}^\\circ`);
      fb.innerHTML = wrapFeedback(`\\(ABCD \\sim EFGH\\) 依序對應：\\(\\angle E = \\angle A\\)、\\(\\angle F = \\angle B\\)、\\(\\angle G = \\angle C\\)、\\(\\angle H = \\angle D\\)。<br>放大後角度不變，\\(\\angle H\\) 就用 \\(ABCD\\) 的內角和算 \\(\\angle D\\)。`);
    } else {
      const fg = qOf(bc * ef, ab);
      dkSideTag(ctx, P[0], P[1], GP, String(ab), DK_BLUE, 15, 14);
      dkSideTag(ctx, P[1], P[2], GP, String(bc), DK_GREEN, 15, 14);
      dkSideTag(ctx, Q[0], Q[1], GQ, String(ef), DK_BLUE, 16, 14);
      dkSideTag(ctx, Q[1], Q[2], GQ, '?', DK_GREEN, 16, 15);
      hbSeg(ctx, P[0], P[1], DK_BLUE, 4); hbSeg(ctx, Q[0], Q[1], DK_BLUE, 4);
      hbSeg(ctx, P[1], P[2], DK_GREEN, 4); hbSeg(ctx, Q[1], Q[2], DK_GREEN, 4);
      dkRich(ctx, [['[AB] : [EF]', DK_BLUE], [' = ', DK_SEPIA], ['[BC] : [FG]', DK_GREEN], ['（原圖 : 新圖，兩邊同方向）', DK_SEPIA]], W / 2, 306, 15);
      dkRich(ctx, [[`${ab} : ${ef}`, DK_BLUE], [' = ', DK_SEPIA], [`${bc} : [FG]`, DK_GREEN]], W / 2, 340, 17);
      dkRow(ctx, `${ab} × [FG] = ${ef} × ${bc}（內項乘積 = 外項乘積）`, 374, DK_SEPIA, 16);
      dkRow(ctx, `[FG] = {${ef} × ${bc}/${ab}} = ${dkRT(fg)}`, 414, DK_OK, 18);
      dkRow(ctx, `相似比：每一組對應邊 新 : 原 = ${dkRT(qOf(ef, ab))}`, 452, MUTED, 14);
      out.innerHTML = wbrEq(`\\overline{FG} = \\frac{${ef} \\times ${bc}}{${ab}} = ${qTex(fg)}`);
      fb.innerHTML = wrapFeedback(`\\(\\overline{AB}\\) 對 \\(\\overline{EF}\\)、\\(\\overline{BC}\\) 對 \\(\\overline{FG}\\)，比例式兩邊都寫「原圖 : 新圖」。<br>寫反成 \\(${ab} : ${ef} = \\overline{FG} : ${bc}\\)，算出來就不是 \\(\\overline{FG}\\) 了。`);
    }
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('calc-mode-group'), 'data-calc-mode', v => { mode = v; draw(); });
  [sA, sB, sC, sab, sbc, sef].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：AAA（AA）相似性質
   A 字型：△ABC 的角固定（∠B = 72°、∠C = 52°），整個圖依 DE 的長度縮放。
   反向等角：∠A = 48°，AC = AE + EC，AB = AE × AC ÷ AD。
   ========================================================================== */
function initAACanvas() {
  const cv = hbEl('canvas-aa');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('aa-a'), sc = hbEl('aa-c'), sd = hbEl('aa-d');
  const sad = hbEl('aa-ad'), sae = hbEl('aa-ae'), sec = hbEl('aa-ec');
  const va = hbEl('aa-va'), vc = hbEl('aa-vc'), vd = hbEl('aa-vd');
  const vad = hbEl('aa-vad'), vae = hbEl('aa-vae'), vec = hbEl('aa-vec');
  const out = hbEl('aa-formula'), fb = hbEl('aa-feedback');
  const C7 = DK_TONE[7];
  let mode = 'par';

  function draw() {
    const W = cv.width;
    const a = hbClampSlider(sa, 2, 8), c = hbClampSlider(sc, 1, 6), d = hbClampSlider(sd, 2, 8);
    const ad = hbClampSlider(sad, 2, 5), ae = hbClampSlider(sae, 2, 6), ec = hbClampSlider(sec, 1, 6);
    va.textContent = a; vc.textContent = c; vd.textContent = d;
    vad.textContent = ad; vae.textContent = ae; vec.textContent = ec;
    dkShow(['aa-row-a', 'aa-row-c', 'aa-row-d'], mode === 'par');
    dkShow(['aa-row-ad', 'aa-row-ae', 'aa-row-ec'], mode === 'rev');
    ctx.clearRect(0, 0, W, cv.height);
    const box = { x: 90, y: 72, w: 360, h: 222 };

    if (mode === 'par') {
      drawTitle(ctx, 'A 字型：DE // BC，求 BC', C7);
      const bcQ = qOf(d * (a + c), a);
      const tri = dkTriAngles(qVal(bcQ), 72, 52);
      const D0 = dkScale(tri.A, tri.B, a / (a + c)), E0 = dkScale(tri.A, tri.C, a / (a + c));
      const V = dkView([tri.A, tri.B, tri.C], box);
      const A = V.P(tri.A), B = V.P(tri.B), C = V.P(tri.C), D = V.P(D0), E = V.P(E0);
      dkPoly(ctx, [A, B, C], DK_IVORY, 0.05, 2.6);
      dkPoly(ctx, [A, D, E], DK_RED, 0.16, 2.6);
      dkAng(ctx, B, A, C, 24, DK_BLUE);
      dkAng(ctx, D, A, E, 20, DK_BLUE);
      dkAng(ctx, C, B, A, 24, DK_GREEN);
      dkAng(ctx, E, D, A, 20, DK_GREEN);
      dkNames(ctx, [A, B, C], ['A', 'B', 'C'], DK_IVORY);
      dkName(ctx, D, 'D', DK_IVORY, -15, -3);
      dkName(ctx, E, 'E', DK_IVORY, 15, -3);
      const G = hbCentroid([A, B, C]);
      dkSideTag(ctx, A, E, G, String(a), DK_SEPIA, 16, 14);
      dkSideTag(ctx, E, C, G, String(c), DK_SEPIA, 16, 14);
      dkTag(ctx, String(d), (D.x + E.x) / 2, (D.y + E.y) / 2 - 14, DK_SEPIA, 14);
      dkSideTag(ctx, B, C, A, `[BC] = ${dkRT(bcQ)}`, DK_ROSE, 18, 15);

      dkRich(ctx, [['[DE] // [BC] ⇒ ', DK_SEPIA], ['∠ADE = ∠B', DK_BLUE], ['，', DK_SEPIA], ['∠AED = ∠C', DK_GREEN], ['（同位角）', DK_SEPIA]], W / 2, 342, 15);
      dkRow(ctx, '兩組角相等 ⇒ △ADE ∼ △ABC（`AA` 相似）', 376, DK_OK, 16);
      dkRow(ctx, `[DE] : [BC] = [AE] : [AC] ⇒ ${d} : [BC] = ${a} : (${a} + ${c})`, 412, DK_SEPIA, 16);
      dkRow(ctx, `[BC] = {${d} × ${a + c}/${a}} = ${dkRT(bcQ)}`, 454, DK_ROSE, 18);
      dkRow(ctx, '小心：對應的是整條 AC，不是 EC', 488, MUTED, 13);
      out.innerHTML = wbrEq(`\\overline{BC} = \\frac{${d} \\times ${a + c}}{${a}} = ${qTex(bcQ)}`);
      fb.innerHTML = wrapFeedback(`\\(\\overline{DE}\\) 對應 \\(\\overline{BC}\\)、\\(\\overline{AE}\\) 對應 \\(\\overline{AC}\\)。\\(\\overline{AC} = ${a} + ${c} = ${a + c}\\)，所以 \\(\\overline{BC}\\) 是 \\(\\overline{DE}\\) 的 \\(${qTex(qOf(a + c, a))}\\) 倍。<br>拿 \\(\\overline{EC} = ${c}\\) 去對應，就會算錯。`);
    } else {
      const ac = ae + ec;
      const abQ = qOf(ae * ac, ad);
      const ok = qVal(abQ) > ad;
      drawTitle(ctx, '反向等角：∠AED = ∠B，求 BD', C7);
      if (!ok) {
        dkRow(ctx, `[AB] = {${ae} × ${ac}/${ad}} = ${dkRT(abQ)}，不比 [AD] = ${ad} 長`, 170, DK_NO, 17);
        dkRow(ctx, 'D 不會落在 AB 上：情境不成立', 212, DK_NO, 16);
        dkRow(ctx, '把 AE 或 EC 調大，或把 AD 調小', 248, MUTED, 15);
        out.innerHTML = `\\(\\overline{AB} = ${qTex(abQ)}\\)，<wbr>不比 \\(\\overline{AD}\\) 長，情境不成立`;
        fb.innerHTML = wrapFeedback(`依相似算出的 \\(\\overline{AB}\\) 比 \\(\\overline{AD} = ${ad}\\) 還短，\\(D\\) 就不在 \\(\\overline{AB}\\) 上，題目的圖畫不出來。`);
        typeset([out, fb]);
        return;
      }
      const bdQ = qSub(abQ, ad);
      const A0 = hbV(0, 0);
      const B0 = dkAdd(A0, dkDir(-114), qVal(abQ)), C0 = dkAdd(A0, dkDir(-66), ac);
      const D0 = dkAdd(A0, dkDir(-114), ad), E0 = dkAdd(A0, dkDir(-66), ae);
      const V = dkView([A0, B0, C0], box);
      const A = V.P(A0), B = V.P(B0), C = V.P(C0), D = V.P(D0), E = V.P(E0);
      dkPoly(ctx, [A, B, C], DK_IVORY, 0.05, 2.6);
      dkPoly(ctx, [A, E, D], DK_RED, 0.16, 2.6);
      dkAng(ctx, B, A, C, 24, DK_BLUE);
      dkAng(ctx, E, A, D, 16, DK_BLUE);
      dkAng(ctx, A, B, C, 26, DK_GREEN);
      dkNames(ctx, [A, B, C], ['A', 'B', 'C'], DK_IVORY);
      dkName(ctx, D, 'D', DK_IVORY, -15, -2);
      dkName(ctx, E, 'E', DK_IVORY, 17, -10);
      const G = hbCentroid([A, B, C]);
      dkSideTag(ctx, A, D, G, String(ad), DK_SEPIA, 15, 14);
      dkSideTag(ctx, A, E, G, String(ae), DK_SEPIA, 15, 14);
      dkSideTag(ctx, E, C, G, String(ec), DK_SEPIA, 15, 14);
      dkSideTag(ctx, D, B, G, `[BD] = ${dkRT(bdQ)}`, DK_ROSE, 20, 14);

      dkRich(ctx, [['∠AED = ∠B', DK_BLUE], ['，', DK_SEPIA], ['∠A 共用', DK_GREEN], [' ⇒ △AED ∼ △ABC（`AA`）', DK_OK]], W / 2, 342, 16);
      dkRow(ctx, '對應：A ↔ A，E ↔ B，D ↔ C', 376, DK_SEPIA, 15);
      dkRow(ctx, `[AE] : [AB] = [AD] : [AC] ⇒ ${ae} : [AB] = ${ad} : ${ac}`, 410, DK_SEPIA, 16);
      dkRow(ctx, `[AB] = {${ae} × ${ac}/${ad}} = ${dkRT(abQ)}，[BD] = ${dkRT(abQ)} − ${ad} = ${dkRT(bdQ)}`, 452, DK_ROSE, 17);
      dkRow(ctx, 'E 對應 B：比例式要照這個順序列', 488, MUTED, 13);
      out.innerHTML = wbrEq(`\\overline{BD} = \\frac{${ae} \\times ${ac}}{${ad}} - ${ad} = ${qTex(bdQ)}`);
      fb.innerHTML = wrapFeedback(`\\(\\angle AED\\) 與 \\(\\angle B\\) 相等，所以 \\(E\\) 對應 \\(B\\)、\\(D\\) 對應 \\(C\\)：\\(\\overline{AE}\\) 對 \\(\\overline{AB}\\)、\\(\\overline{AD}\\) 對 \\(\\overline{AC}\\)。<br>照字母的位置以為 \\(D\\) 對 \\(B\\)，比例式就寫錯了。`);
    }
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('aa-mode-group'), 'data-aa-mode', v => { mode = v; draw(); });
  [sa, sc, sd, sad, sae, sec].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：SAS 相似性質
   X 字型：A、C、E 共線，B、C、D 共線，∠ACB = ∠ECD = 64°（對頂角）。
   SSA 陷阱：∠A = 40°、AB = 6 固定，以 B 為圓心、BC 為半徑交射線 AC。
   ========================================================================== */
function initSASCanvas() {
  const cv = hbEl('canvas-sas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const s = { a: hbEl('sas-a'), b: hbEl('sas-b'), e: hbEl('sas-e'), d: hbEl('sas-d'), bc: hbEl('sas-bc') };
  const v = { a: hbEl('sas-va'), b: hbEl('sas-vb'), e: hbEl('sas-ve'), d: hbEl('sas-vd'), bc: hbEl('sas-vbc') };
  const out = hbEl('sas-formula'), fb = hbEl('sas-feedback');
  const C8 = DK_TONE[8];
  let mode = 'x';
  const XA = 64;

  function drawX() {
    const W = cv.width;
    const a = hbClampSlider(s.a, 2, 9), b = hbClampSlider(s.b, 2, 9);
    const e = hbClampSlider(s.e, 2, 9), d = hbClampSlider(s.d, 2, 9);
    v.a.textContent = a; v.b.textContent = b; v.e.textContent = e; v.d.textContent = d;
    drawTitle(ctx, 'X 字型：對頂角夾著兩組邊', C8);
    const C0 = hbV(0, 0);
    const A0 = dkAdd(C0, dkDir(180 - XA / 2), a), B0 = dkAdd(C0, dkDir(180 + XA / 2), b);
    const E0 = dkAdd(C0, dkDir(-XA / 2), e), D0 = dkAdd(C0, dkDir(XA / 2), d);
    const V = dkView([A0, B0, C0, D0, E0], { x: 40, y: 56, w: 460, h: 226 });
    const A = V.P(A0), B = V.P(B0), C = V.P(C0), D = V.P(D0), E = V.P(E0);
    const same = qEq(qOf(a, e), qOf(b, d));     // A↔E、B↔D
    const cross = qEq(qOf(a, d), qOf(b, e));    // A↔D、B↔E
    dkPoly(ctx, [A, C, B], same || cross ? DK_BLUE : DK_IVORY, 0.14, 2.4);
    dkPoly(ctx, [E, C, D], same || cross ? DK_GREEN : DK_IVORY, 0.14, 2.4);
    dkAng(ctx, C, A, B, 24, DK_MUSTARD);
    dkAng(ctx, C, E, D, 24, DK_MUSTARD);
    [A, B, C, D, E].forEach(p => dkPt(ctx, p, DK_IVORY, 4));
    dkName(ctx, A, 'A', DK_IVORY, -14, -6);
    dkName(ctx, B, 'B', DK_IVORY, -14, 8);
    dkName(ctx, C, 'C', DK_IVORY, 0, -20);
    dkName(ctx, D, 'D', DK_IVORY, 14, -6);
    dkName(ctx, E, 'E', DK_IVORY, 14, 8);
    dkSideTag(ctx, A, C, B, String(a), DK_SEPIA, 14, 14);
    dkSideTag(ctx, B, C, A, String(b), DK_SEPIA, 14, 14);
    dkSideTag(ctx, C, E, D, String(e), DK_SEPIA, 14, 14);
    dkSideTag(ctx, C, D, E, String(d), DK_SEPIA, 14, 14);

    const r1 = qOf(a, e), r2 = qOf(b, d), r3 = qOf(a, d), r4 = qOf(b, e);
    dkRow(ctx, '∠ACB = ∠ECD（對頂角相等），它就是兩組邊的夾角', 316, DK_MUSTARD, 15);
    dkRich(ctx, [[`同一條線對應：[CA] : [CE] = ${dkRT(r1)}，[CB] : [CD] = ${dkRT(r2)} `, DK_SEPIA], [same ? '✓' : '✗', same ? DK_OK : DK_NO]], W / 2, 352, 15);
    dkRich(ctx, [[`交叉對應：[CA] : [CD] = ${dkRT(r3)}，[CB] : [CE] = ${dkRT(r4)} `, DK_SEPIA], [cross ? '✓' : '✗', cross ? DK_OK : DK_NO]], W / 2, 392, 15);
    let concl, tex, msg;
    if (same && cross) {
      concl = '兩種對應都成比例：△ACB ∼ △ECD，也 ∼ △DCE（`SAS`）';
      tex = `\\triangle ACB \\sim \\triangle ECD`;
      msg = `\\(\\overline{CA} = \\overline{CB}\\)、\\(\\overline{CE} = \\overline{CD}\\)，兩個都是等腰三角形，兩種對應都成立。`;
    } else if (same) {
      concl = `△ACB ∼ △ECD（SAS），[ED] = ${dkRT(qOf(e, a))} × [AB]`;
      tex = `\\triangle ACB \\sim \\triangle ECD`;
      msg = `\\(\\frac{\\overline{CA}}{\\overline{CE}} = \\frac{\\overline{CB}}{\\overline{CD}} = ${qTex(r1)}\\)，夾角是對頂角：\\(A\\) 對 \\(E\\)、\\(B\\) 對 \\(D\\)。這時 \\(\\overline{AB} /\\!/ \\overline{ED}\\)。`;
    } else if (cross) {
      concl = `△ACB ∼ △DCE（SAS），[DE] = ${dkRT(qOf(d, a))} × [AB]`;
      tex = `\\triangle ACB \\sim \\triangle DCE`;
      msg = `\\(\\frac{\\overline{CA}}{\\overline{CD}} = \\frac{\\overline{CB}}{\\overline{CE}} = ${qTex(r3)}\\)：交叉對應，\\(A\\) 對 \\(D\\)、\\(B\\) 對 \\(E\\)。這時 \\(\\overline{AB}\\) 與 \\(\\overline{DE}\\) 不平行，也照樣相似。`;
    } else {
      concl = '兩種對應都不成比例：不能用 SAS 判定相似';
      tex = `\\text{SAS}`;
      msg = '夾角相等，但兩組夾邊怎麼配都不成比例。調整長度，讓其中一種對應的兩個比相等。';
    }
    dkRow(ctx, concl, 434, same || cross ? DK_OK : DK_NO, 16);
    dkRow(ctx, 'SAS 的 `S` 是「成比例」，不是「相等」', 472, MUTED, 13);
    out.innerHTML = same || cross ? `\\(${tex}\\)（SAS）` : '兩種對應都不成比例';
    fb.innerHTML = wrapFeedback(msg);
  }

  function drawSSA() {
    const W = cv.width;
    const bc = hbClampSlider(s.bc, 3, 8);
    v.bc.textContent = bc;
    drawTitle(ctx, 'SSA 陷阱：∠A、AB、BC 都固定', C8);
    const AB = 6, ang = 40;
    const h = AB * Math.sin(ang * HB_RAD), base = AB * Math.cos(ang * HB_RAD);
    const sols = [];
    if (bc >= h) {
      const w = Math.sqrt(bc * bc - h * h);
      [base + w, base - w].forEach(x => { if (x > 1e-6 && !sols.some(y => Math.abs(y - x) < 1e-6)) sols.push(x); });
    }
    const A0 = hbV(0, 0), B0 = dkAdd(A0, dkDir(ang), AB);
    const Cs = sols.map(x => hbV(x, 0));
    const far = hbV(Math.max(base + bc, 10.5), 0);
    const V = dkView([A0, B0, far, hbV(0, -0.5), hbV(base, AB * Math.sin(ang * HB_RAD) + 0.3)], { x: 40, y: 60, w: 460, h: 220 });
    const A = V.P(A0), B = V.P(B0);
    hbSeg(ctx, A, V.P(far), DK_FAINT, 2);
    // 以 B 為圓心、BC 為半徑的圓（虛線）
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 48, W, 250);
    ctx.clip();
    ctx.strokeStyle = 'rgba(230, 184, 76, 0.55)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(B.x, B.y, bc * V.k, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    const cols = [DK_BLUE, DK_RED];
    Cs.forEach((Cm, i) => {
      const C = V.P(Cm);
      dkPoly(ctx, [A, B, C], cols[i], 0.14, 2.6);
      dkPt(ctx, C, cols[i], 5);
      dkName(ctx, C, Cs.length === 2 ? `C${i ? '₂' : '₁'}` : 'C', cols[i], 0, 18);
    });
    hbSeg(ctx, A, B, DK_IVORY, 3);
    dkAng(ctx, A, V.P(far), B, 34, DK_MUSTARD, { label: '40°', lr: 54, font: f(800, 14) });
    dkPt(ctx, A, DK_IVORY, 4.5); dkPt(ctx, B, DK_IVORY, 4.5);
    dkName(ctx, A, 'A', DK_IVORY, -14, 6);
    dkName(ctx, B, 'B', DK_IVORY, 0, -18);
    dkTag(ctx, '6', (A.x + B.x) / 2 - 14, (A.y + B.y) / 2 - 8, DK_SEPIA, 14);

    dkRow(ctx, `∠A = 40°、[AB] = 6、[BC] = ${bc}：∠A 沒有夾在 AB、BC 中間`, 316, DK_SEPIA, 15);
    let l2, l3, col;
    if (Cs.length === 2) {
      l2 = '以 B 為圓心、BC 為半徑，交射線於 C₁、C₂ 兩點';
      l3 = '同樣的條件畫出兩種形狀：SSA 不能判定相似（也不能判定全等）';
      col = DK_NO;
    } else if (Cs.length === 1) {
      l2 = 'BC 不比 AB 短：圓只交射線一點，這次只畫得出一種';
      l3 = '但只要把 BC 調短一點就會出現兩種形狀，所以 SSA 仍不能當判別方法';
      col = MUTED;
    } else {
      l2 = `BC 比 B 到射線的距離（約 3.86）還短：圓碰不到射線`;
      l3 = '圍不成三角形';
      col = DK_NO;
    }
    dkRow(ctx, l2, 356, DK_MUSTARD, 15);
    dkRow(ctx, l3, 398, col, 15);
    dkRow(ctx, '兩組邊成比例時，相等的角一定要「夾」在它們中間才是 SAS', 440, DK_OK, 14);
    out.innerHTML = Cs.length === 2 ? '兩種形狀：<wbr>不一定相似' : (Cs.length === 1 ? '這次只有一種形狀' : '圍不成三角形');
    fb.innerHTML = wrapFeedback(Cs.length === 2
      ? '\\(\\triangle ABC_1\\) 和 \\(\\triangle ABC_2\\) 的 \\(\\angle A\\)、\\(\\overline{AB}\\)、\\(\\overline{BC}\\) 完全一樣，形狀卻不同——它們連相似都不是。<br>所以「兩邊成比例＋不夾的那個角相等」不能保證相似。'
      : '把 \\(\\overline{BC}\\) 調到 4 或 5，看看會發生什麼事。');
  }

  function draw() {
    dkShow(['sas-row-a', 'sas-row-b', 'sas-row-e', 'sas-row-d'], mode === 'x');
    dkShow(['sas-row-bc'], mode === 'ssa');
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (mode === 'x') drawX(); else drawSSA();
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('sas-mode-group'), 'data-sas-mode', m => { mode = m; draw(); });
  Object.keys(s).forEach(key => s[key].addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：SSS 相似性質——短對短、長對長
   ========================================================================== */
function initSSSCanvas() {
  const cv = hbEl('canvas-sss');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sd = hbEl('sss-d'), se = hbEl('sss-e'), sf = hbEl('sss-f');
  const vd = hbEl('sss-vd'), ve = hbEl('sss-ve'), vf = hbEl('sss-vf');
  const out = hbEl('sss-formula'), fb = hbEl('sss-feedback');
  const C9 = DK_TONE[9];
  // [AB, BC, CA]
  const BASES = [[3, 4, 6], [6, 8, 5]];
  let base = 0;

  function draw() {
    const W = cv.width;
    const DE = hbClampSlider(sd, 2, 18), EF = hbClampSlider(se, 2, 18), FD = hbClampSlider(sf, 2, 18);
    vd.textContent = DE; ve.textContent = EF; vf.textContent = FD;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '三組邊由短到長配對', C9);
    const [AB, BC, CA] = BASES[base];

    // 每一邊：{ 名稱, 長度, 對面的頂點 }
    const s1 = [{ n: 'AB', v: AB, o: 'C' }, { n: 'BC', v: BC, o: 'A' }, { n: 'CA', v: CA, o: 'B' }];
    const s2 = [{ n: 'DE', v: DE, o: 'F' }, { n: 'EF', v: EF, o: 'D' }, { n: 'FD', v: FD, o: 'E' }];
    const o1 = s1.slice().sort((x, y) => x.v - y.v), o2 = s2.slice().sort((x, y) => x.v - y.v);
    const tri2 = o2[0].v + o2[1].v > o2[2].v;

    // 畫兩個三角形（同一比例尺）
    const T1 = dkTriSides(BC, CA, AB);
    const pts1 = [T1.A, T1.B, T1.C];
    let pts2 = null;
    if (tri2) {
      const T2 = dkTriSides(EF, FD, DE);
      pts2 = [T2.A, T2.B, T2.C];
    } else {
      pts2 = [hbV(0, 0.01), hbV(0, 0), hbV(Math.max(DE, EF, FD), 0)];
    }
    const V = dkView2(pts1, { x: 26, y: 66, w: 186, h: 170 }, pts2, { x: 250, y: 62, w: 252, h: 184 });
    const P = pts1.map(V.L);
    const G1 = hbCentroid(P);
    const rank1 = n => o1.findIndex(x => x.n === n), rank2 = n => o2.findIndex(x => x.n === n);
    const segs1 = { AB: [P[0], P[1]], BC: [P[1], P[2]], CA: [P[2], P[0]] };
    Object.keys(segs1).forEach(n => {
      hbSeg(ctx, segs1[n][0], segs1[n][1], DK_PAIR[rank1(n)], 4);
      dkSideTag(ctx, segs1[n][0], segs1[n][1], G1, String(s1.find(x => x.n === n).v), DK_PAIR[rank1(n)], 15, 14);
    });
    dkNames(ctx, P, ['A', 'B', 'C'], DK_IVORY);
    if (tri2) {
      const Q = pts2.map(V.R);
      const G2 = hbCentroid(Q);
      const segs2 = { DE: [Q[0], Q[1]], EF: [Q[1], Q[2]], FD: [Q[2], Q[0]] };
      Object.keys(segs2).forEach(n => {
        hbSeg(ctx, segs2[n][0], segs2[n][1], DK_PAIR[rank2(n)], 4);
        dkSideTag(ctx, segs2[n][0], segs2[n][1], G2, String(s2.find(x => x.n === n).v), DK_PAIR[rank2(n)], 15, 14);
      });
      dkNames(ctx, Q, ['D', 'E', 'F'], DK_ROSE);
    } else {
      dkRow(ctx, `${o2[0].v} + ${o2[1].v} ≤ ${o2[2].v}：圍不成三角形`, 150, DK_NO, 17);
    }

    const qs = [0, 1, 2].map(i => qOf(o2[i].v, o1[i].v));
    const eqCount = (qEq(qs[0], qs[1]) ? 1 : 0) + (qEq(qs[1], qs[2]) ? 1 : 0) + (qEq(qs[0], qs[2]) ? 1 : 0);
    const all = eqCount === 3;
    dkRich(ctx, [0, 1, 2].map(i => [`[${o2[i].n}] : [${o1[i].n}] = ${dkRT(qs[i])}${i < 2 ? '    ' : ''}`, DK_PAIR[i]]), W / 2, 288, 16);
    let concl, col, tex, msg;
    // 對應頂點：最短邊對面的頂點互相對應……
    const map = {};
    for (let i = 0; i < 3; i++) map[o1[i].o] = o2[i].o;
    const stmt = `△ABC ∼ △${map.A}${map.B}${map.C}`;
    if (!tri2) {
      concl = 'DEF 不是三角形，談不上相似'; col = DK_NO;
      tex = '\\text{DEF}'; msg = '三角形任兩邊的和要大於第三邊，這三段圍不起來。';
    } else if (all) {
      concl = `三個比都是 ${dkRT(qs[0])} ⇒ ${stmt}（\`SSS\` 相似）`; col = DK_OK;
      tex = `\\triangle ABC \\sim \\triangle ${map.A}${map.B}${map.C}`;
      msg = `最短邊對最短邊……三個比都相等，所以相似。對應頂點看「對應邊所對的角」：\\(${o1[0].o}\\) 對著最短邊，就對應 \\(${o2[0].o}\\)。`;
    } else if (eqCount === 1) {
      concl = '只有兩組邊成比例 ⇒ 不能說相似'; col = DK_NO;
      tex = '\\text{SSS}'; msg = '兩組邊成比例還不夠，第三組也要一樣的比。調整一條邊，讓三個比都相等。';
    } else {
      concl = '三個比都不相等 ⇒ 不相似'; col = DK_NO;
      tex = '\\text{SSS}'; msg = '把三條邊都乘上同一個數，才會得到相似的三角形。';
    }
    dkRow(ctx, concl, 330, col, 16);
    if (tri2 && all) {
      dkRow(ctx, `對應角：∠A = ∠${map.A}，∠B = ∠${map.B}，∠C = ∠${map.C}（對應邊所對的角）`, 368, DK_SEPIA, 15);
    } else {
      dkRow(ctx, '三個比都相等才是 SSS 相似', 368, MUTED, 15);
    }
    dkRow(ctx, '配對規則：最短對最短、中間對中間、最長對最長', 404, MUTED, 14);
    out.innerHTML = tri2 && all ? `\\(${tex}\\)（SSS）` : (tri2 ? '不能用 SSS 判定相似' : '圍不成三角形');
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('sss-base-group'), 'data-sss-base', v => { base = parseInt(v, 10); draw(); });
  [sd, se, sf].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 11：判別相似，該用哪一個性質？
   每個案例的兩個三角形都由真的長度與角度作出來（tri: 'sides' 給三邊，
   'angles' 給 BC 與 ∠B、∠C），只標題目給的條件。
   ========================================================================== */
const DK_CASES = [
  {
    t1: { by: 'angles', a: 6, B: 75, C: 65, marks: { A: '40°', B: '75°' } },
    t2: { by: 'angles', a: 8, B: 75, C: 65, marks: { B: '75°', C: '65°' } },
    ans: 'AA',
    why: '△ABC 的 ∠C = 180° − 40° − 75° = 65°，和 ∠F 相等；又 ∠B = ∠E。兩組角相等 ⇒ AA 相似。'
  },
  {
    t1: { by: 'sas', b: 9, c: 6, A: 50, marks: { A: '50°' }, sides: { AB: '6', CA: '9' } },
    t2: { by: 'sas', b: 6, c: 4, A: 50, marks: { A: '50°' }, sides: { AB: '4', CA: '6' } },
    ans: 'SAS',
    why: '6 : 4 = 9 : 6 = 3 : 2，而且 50° 的角就夾在這兩組邊中間 ⇒ SAS 相似。'
  },
  {
    t1: { by: 'sides', a: 7, b: 8, c: 5, sides: { AB: '5', BC: '7', CA: '8' } },
    t2: { by: 'sides', a: 14, b: 16, c: 10, sides: { AB: '10', BC: '14', CA: '16' } },
    ans: 'SSS',
    why: '由短到長 5、7、8 對 10、14、16，三個比都是 2 ⇒ SSS 相似。'
  },
  {
    t1: { by: 'angles', a: 6, B: 70, C: 55, marks: { A: '55°' } },
    t2: { by: 'angles', a: 7, B: 40, C: 85, marks: { A: '55°' } },
    ans: 'NO',
    why: '只知道一組角相等，另外兩組角不知道（其實也不相等），不能判定相似。'
  },
  {
    t1: { by: 'ssa', A: 40, c: 6, a: 5, pick: 0, marks: { A: '40°' }, sides: { AB: '6', BC: '5' } },
    t2: { by: 'ssa', A: 40, c: 12, a: 10, pick: 1, marks: { A: '40°' }, sides: { AB: '12', BC: '10' } },
    ans: 'NO',
    why: '兩組邊成比例（1 : 2），但 40° 的角不是這兩組邊的夾角（SSA）：圖上兩個三角形就不相似。'
  },
  {
    t1: { by: 'angles', a: 8, B: 40, C: 60, marks: { A: '80°', B: '40°' } },
    t2: { by: 'angles', a: 4, B: 20, C: 120, marks: { A: '40°', B: '20°' } },
    ans: 'NO',
    why: '邊縮一半沒關係，但角也被減半了：∠C = 60°、∠F = 120°，對應角不相等，不相似。'
  },
  {
    t1: { by: 'sas', b: 8, c: 6, A: 60, rename: true, marks: {}, sides: { AB: '6', CA: '8' } },
    t2: { by: 'sas', b: 12, c: 9, A: 100, rename: true, marks: {}, sides: { AB: '9', CA: '12' } },
    ans: 'NO',
    why: '只有兩組邊成比例（6 : 9 = 8 : 12），夾角不知道是否相等：不能判定。圖上兩個的夾角其實不同。'
  }
];

// 依案例資料作三角形（數學座標），回傳 { A, B, C }
function dkCaseTri(t) {
  if (t.by === 'sides') return dkTriSides(t.a, t.b, t.c);
  if (t.by === 'angles') return dkTriAngles(t.a, t.B, t.C);
  if (t.by === 'sas') {
    // AB = c、AC = b、夾角 ∠A
    const A = hbV(0, 0), B = dkAdd(A, dkDir(180 + 60), t.c), C = dkAdd(A, dkDir(240 + t.A), t.b);
    return { A, B, C };
  }
  // ssa：∠A、AB = c、BC = a；A 在左、AC 沿水平，pick 選兩個解的哪一個
  const h = t.c * Math.sin(t.A * HB_RAD), base = t.c * Math.cos(t.A * HB_RAD);
  const w = Math.sqrt(t.a * t.a - h * h);
  const x = t.pick ? base - w : base + w;
  return { A: hbV(0, 0), B: dkAdd(hbV(0, 0), dkDir(t.A), t.c), C: hbV(x, 0) };
}

function initJudgeCanvas() {
  const cv = hbEl('canvas-judge');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const out = hbEl('judge-formula'), fb = hbEl('judge-feedback');
  const ansGroup = hbEl('judge-ans-group');
  const C10 = DK_TONE[10];
  let ci = 0, ans = null;
  const NAMES = { AA: 'AA 相似', SAS: 'SAS 相似', SSS: 'SSS 相似', NO: '不能判定' };

  function drawTri(tri, map, names, data, color) {
    const P = [map(tri.A), map(tri.B), map(tri.C)];
    dkPoly(ctx, P, color, 0.12, 2.6);
    dkNames(ctx, P, names, color === DK_IVORY ? DK_IVORY : DK_ROSE);
    const G = hbCentroid(P);
    const idx = { A: 0, B: 1, C: 2 };
    Object.keys(data.marks || {}).forEach(k => {
      const i = idx[k];
      dkAng(ctx, P[i], P[(i + 1) % 3], P[(i + 2) % 3], 20, DK_MUSTARD);
      const L = hbV(P[i].x + (G.x - P[i].x) * 0.36, P[i].y + (G.y - P[i].y) * 0.36);
      dkTag(ctx, data.marks[k], L.x, L.y, DK_MUSTARD, 13);
    });
    const segs = { AB: [P[0], P[1]], BC: [P[1], P[2]], CA: [P[2], P[0]] };
    Object.keys(data.sides || {}).forEach(k => {
      dkSideTag(ctx, segs[k][0], segs[k][1], G, data.sides[k], DK_SEPIA, 15, 14);
    });
  }

  function draw() {
    const W = cv.width;
    const cs = DK_CASES[ci];
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `案例 ${ci + 1}：只看標出來的條件`, C10);
    const T1 = dkCaseTri(cs.t1), T2 = dkCaseTri(cs.t2);
    const V = dkView2([T1.A, T1.B, T1.C], { x: 26, y: 62, w: 210, h: 200 }, [T2.A, T2.B, T2.C], { x: 290, y: 62, w: 224, h: 200 });
    drawTri(T1, V.L, ['A', 'B', 'C'], cs.t1, DK_IVORY);
    drawTri(T2, V.R, ['D', 'E', 'F'], cs.t2, DK_RED);

    // 已知條件的文字版
    const lines = [];
    const descr = (t, n) => {
      const parts = [];
      Object.keys(t.marks || {}).forEach(k => parts.push(`∠${n[k]} = ${t.marks[k]}`));
      Object.keys(t.sides || {}).forEach(k => parts.push(`[${n[k[0]]}${n[k[1]]}] = ${t.sides[k]}`));
      return parts.join('，');
    };
    lines.push('△ABC：' + descr(cs.t1, { A: 'A', B: 'B', C: 'C' }));
    lines.push('△DEF：' + descr(cs.t2, { A: 'D', B: 'E', C: 'F' }));
    dkRow(ctx, lines[0], 300, DK_IVORY, 15);
    dkRow(ctx, lines[1], 332, DK_ROSE, 15);

    if (!ans) {
      dkRow(ctx, '先判斷，再按下方的按鈕', 380, MUTED, 15);
      out.innerHTML = `案例 ${ci + 1}：<wbr>請判斷`;
      fb.innerHTML = wrapFeedback('有幾組角相等？有幾組邊成比例？相等的角有沒有夾在兩組邊中間？');
    } else {
      const ok = ans === cs.ans;
      dkRow(ctx, ok ? `✓ 正確：${NAMES[cs.ans]}` : `✗ 不對，你選的是「${NAMES[ans]}」`, 376, ok ? DK_OK : DK_NO, 17);
      if (ok) {
        dkRich(ctx, [[cs.why, DK_SEPIA]], W / 2, 418, 14);
      } else {
        dkRow(ctx, '再數一次：角相等幾組？邊成比例幾組？角有沒有夾在中間？', 418, MUTED, 14);
      }
      out.innerHTML = ok ? `答對：<wbr>${NAMES[cs.ans]}` : '再想想';
      fb.innerHTML = wrapFeedback(ok ? cs.why.replace(/∠/g, '∠') : '把標出來的條件一個一個數：AA 要兩組角、SAS 要兩組邊加上「夾在中間」的角、SSS 要三組邊。');
    }
    dkRow(ctx, 'AA：兩組角　SAS：兩邊夾一角　SSS：三組邊', 456, MUTED, 13);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('judge-case-group'), 'data-judge-case', v => {
    ci = parseInt(v, 10);
    ans = null;
    ansGroup.querySelectorAll('.pick-btn').forEach(b => b.classList.remove('active'));
    draw();
  });
  bindPickGroup(ansGroup, 'data-judge-ans', v => { ans = v; draw(); });
  drawWithFonts(draw);
}
