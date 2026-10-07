/* ==========================================================================
   3-2-3（第三冊 2-3）畢氏定理 — 互動 Canvas 與隨堂評量
   畫風：復古磁磚工坊（沿用 3-2-1、3-2-2 的小瓷、阿岩）。直角三角形三邊上的
   正方形就是三塊方磚：兩股上的兩塊合起來，剛好鋪滿斜邊上的那一塊。
   鈷藍 TL_COBALT、翡翠綠 TL_JADE 是兩股（P、Q），陶土橘 TL_TERRA 是斜邊（R），
   金色 TL_GOLD 是直角三角形本身、玫瑰 TL_ROSE 是錯誤或不成立的情形。

   共用工具在 ../math-canvas.js（T／IT／VF／FR／PW／GRP／SEQ／RT／measure／
   drawExpr／drawStepRows／drawEqPanel／drawPanel／drawChip／wbrEq／
   drawPlane／drawDot／dashLine／textCenter／textLeft／bindPickGroup…），
   本檔只放本節的色票、根式化簡、幾何小工具與 13 個互動。

   ⚠️ 長度一律用「平方值 N」來算（N 是整數），最後才化成 k√r；不要拿浮點數
   判斷是不是整數或能不能化簡。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initGridCanvas();
  initProofCanvas();
  initHypCanvas();
  initLegCanvas();
  initRelayCanvas();
  initAltCanvas();
  initIsoCanvas();
  initEquiCanvas();
  initCompCanvas();
  initDiagCanvas();
  initLadderCanvas();
  initAxisCanvas();
  initDistCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具（TL_ = Tile；共用檔沒有這個前綴）
   ========================================================================== */

const TL_TERRA = '#fdba74';   // 斜邊、斜邊上的正方形 R
const TL_COBALT = '#93c5fd';  // 第一股、P
const TL_JADE = '#6ee7b7';    // 第二股、Q、結果
const TL_ROSE = '#fda4af';    // 錯誤、不成立
const TL_GOLD = '#fcd34d';    // 直角三角形本身、提示

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const TL_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9', '#fca5a5', '#f0abfc'];

const CIRC = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];

function elById(id) {
  return document.getElementById(id);
}

function iv(el) {
  return parseInt(el.value, 10);
}

// canvas 上的減號換成數學減號 −，投影時比連字號清楚
function mn(s) {
  return String(s).replace(/-/g, '−');
}

// 近似值（三位小數），-0.000 一律寫成 0.000
function ap(v) {
  return (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3);
}

// 分數一律先約分（AGENTS.md〈工作約定〉texFrac 那條）
function fTex(n, d) {
  const r = reduce(n, d);
  return texFrac(r[0], r[1]);
}

// canvas 上的分數元件：約分、負號提到前面、分母 1 時寫整數
function fracItem(n, d, color) {
  const r = reduce(n, d);
  if (r[1] === 1) return T(mn(r[0]), color);
  if (r[0] < 0) return SEQ([T('−', color), FR(-r[0], r[1], color)], color, 2);
  return FR(r[0], r[1], color);
}

// √n 的 canvas 元件
function rtItem(s, color) {
  return RT(T(s, color), color);
}

// c√n（c 是整數；1 不寫係數）
function crItem(c, n, color) {
  const root = rtItem(n, color);
  if (c === 1) return root;
  return SEQ([T(mn(c), color), root], color, 2);
}

function crTex(c, n) {
  if (c === 1) return `\\sqrt{${n}}`;
  return `${c}\\sqrt{${n}}`;
}

// 步驟列重新編號（列數會隨狀態改變，編號不寫死）
function numberRows(rows) {
  rows.forEach((r, i) => { r.name = `${CIRC[i]} ${r.name}`; });
  return rows;
}

// 乘方元件的簡寫：數字或文字的平方
function sqr(s, color) {
  return PW(T(s, color), 2, false, color);
}

// 一行左對齊的算式（中文字與算式元件混排）
function exprLeft(ctx, items, x, cy, size, color, maxW) {
  return drawExpr(ctx, items, 0, cy, size, color, { left: x, maxW: maxW || (ctx.canvas.width - x - 14), gap: 6 });
}

/* ==========================================================================
   根式：項 = (n/d)√r，n/d 是最簡分數、r 不含平方因數（r = 1 是有理數）
   （同 3-2-2 的 rd 工具，本節只用到化簡與合併）
   ========================================================================== */

// n = k² × r（r 不含平方因數）
function rdSqf(n) {
  let k = 1, r = n;
  for (let p = 2; p * p <= r; p++) {
    while (r % (p * p) === 0) { r /= p * p; k *= p; }
  }
  return [k, r];
}

// (n/d)√rad 化成最簡的一項
function rdTerm(n, d, rad) {
  if (n === 0) return { n: 0, d: 1, r: 1 };
  const [k, r] = rdSqf(rad);
  const c = reduce(n * k, d);
  return { n: c[0], d: c[1], r };
}

// 合併同類方根；順序照各類第一次出現的位置（有理數在前就寫在前）
function rdSum(terms) {
  const map = new Map();
  terms.forEach(t0 => {
    const t = rdTerm(t0.n, t0.d, t0.r);
    if (t.n === 0) return;
    const c = map.get(t.r) || [0, 1];
    map.set(t.r, reduce(c[0] * t.d + t.n * c[1], c[1] * t.d));
  });
  return [...map.entries()]
    .filter(([, c]) => c[0] !== 0)
    .map(([r, c]) => ({ n: c[0], d: c[1], r }));
}

function rdVal(terms) {
  return terms.reduce((s, t) => s + t.n / t.d * Math.sqrt(t.r), 0);
}

// 一項的 LaTeX（不含正負號）：5、\frac{3}{4}、2\sqrt{3}、\frac{5\sqrt{3}}{6}
function rdBodyTex(t) {
  const a = Math.abs(t.n);
  if (t.r === 1) return t.d === 1 ? `${a}` : `\\frac{${a}}{${t.d}}`;
  const num = a === 1 ? `\\sqrt{${t.r}}` : `${a}\\sqrt{${t.r}}`;
  return t.d === 1 ? num : `\\frac{${num}}{${t.d}}`;
}

function rdTex(terms) {
  if (!terms.length) return '0';
  return terms.map((t, i) => {
    const b = rdBodyTex(t);
    if (i === 0) return (t.n < 0 ? '-' : '') + b;
    return (t.n < 0 ? ' - ' : ' + ') + b;
  }).join('');
}

// 一項的 canvas 元件（不含正負號）
function rdBodyItem(t, color) {
  const a = Math.abs(t.n);
  let num;
  if (t.r === 1) num = T(a, color);
  else num = a === 1 ? rtItem(t.r, color) : SEQ([T(a, color), rtItem(t.r, color)], color, 2);
  return t.d === 1 ? num : VF(num, T(t.d, color), color);
}

// 一整串項的 canvas 元件陣列
function rdItems(terms, color) {
  if (!terms.length) return [T('0', color)];
  const out = [];
  terms.forEach((t, i) => {
    const body = rdBodyItem(t, color);
    if (i === 0) out.push(t.n < 0 ? SEQ([T('−', color), body], color, 2) : body);
    else out.push(T(t.n < 0 ? '−' : '+', INK), body);
  });
  return out;
}

/* ==========================================================================
   長度：由平方值 N 開平方（N ≥ 0 的整數）
   ========================================================================== */

// √N 化成最簡：完全平方數就是整數
function lenTex(N) {
  if (N === 0) return '0';
  const [k, r] = rdSqf(N);
  if (r === 1) return `${k}`;
  return crTex(k, r);
}

// 純文字版（canvas 上的中文句子用，不能塞 LaTeX）：5、2√5
function lenStr(N) {
  if (N === 0) return '0';
  const [k, r] = rdSqf(N);
  if (r === 1) return `${k}`;
  return `${k === 1 ? '' : k}√${r}`;
}

function lenItem(N, color) {
  if (N === 0) return T('0', color);
  const [k, r] = rdSqf(N);
  if (r === 1) return T(k, color);
  return crItem(k, r, color);
}

// √N 的推導鏈（LaTeX）：√25 = 5、√20 = 2√5、√13（不能化簡就只寫一次）
function chainTex(N) {
  if (N === 0) return '0';
  const [k, r] = rdSqf(N);
  if (r === 1) return `\\sqrt{${N}} = ${k}`;
  if (k === 1) return `\\sqrt{${N}}`;
  return `\\sqrt{${N}} = ${k}\\sqrt{${r}}`;
}

function chainItems(N, color) {
  if (N === 0) return [T('0', color)];
  const [k, r] = rdSqf(N);
  const out = [rtItem(N, color)];
  if (r === 1) out.push(T('=', INK), T(k, color));
  else if (k > 1) out.push(T('=', INK), crItem(k, r, color));
  return out;
}

/* ==========================================================================
   幾何小工具：點一律是 [x, y] 陣列（畫布座標）
   ========================================================================== */

// 把一組以「單位」表示的點（y 朝上）等比例縮放進畫布上的方框
function fitBox(pts, box) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const s = Math.min(box.w / Math.max(maxX - minX, 1e-6), box.h / Math.max(maxY - minY, 1e-6), box.max || Infinity);
  const ox = box.x + (box.w - (maxX - minX) * s) / 2;
  const oy = box.y + (box.h - (maxY - minY) * s) / 2;
  return { s, P: p => [ox + (p[0] - minX) * s, oy + (maxY - p[1]) * s] };
}

function centroid(pts) {
  const n = pts.length;
  return [pts.reduce((s, p) => s + p[0], 0) / n, pts.reduce((s, p) => s + p[1], 0) / n];
}

function unitVec(dx, dy) {
  const L = Math.hypot(dx, dy) || 1;
  return [dx / L, dy / L];
}

// 多邊形：半透明填色＋實線外框
function polyFill(ctx, pts, color, alpha, opts) {
  const o = opts || {};
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  if (alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (o.lw !== 0) {
    ctx.strokeStyle = o.stroke || color;
    ctx.lineWidth = o.lw || 2.2;
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.stroke();
  }
  ctx.restore();
}

function seg(ctx, P, Q, color, lw, dash) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw || 2.2;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(P[0], P[1]);
  ctx.lineTo(Q[0], Q[1]);
  ctx.stroke();
  ctx.restore();
}

// 直角記號：頂點 V，兩個鄰點 A、B
function rightMark(ctx, V, A, B, color, size) {
  const s = size || 13;
  const u = unitVec(A[0] - V[0], A[1] - V[1]);
  const w = unitVec(B[0] - V[0], B[1] - V[1]);
  ctx.save();
  ctx.strokeStyle = color || INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(V[0] + u[0] * s, V[1] + u[1] * s);
  ctx.lineTo(V[0] + u[0] * s + w[0] * s, V[1] + u[1] * s + w[1] * s);
  ctx.lineTo(V[0] + w[0] * s, V[1] + w[1] * s);
  ctx.stroke();
  ctx.restore();
}

// 頂點字母：從圖形重心往外推（開發約束 18：標示一律在圖形外側）
function vLabel(ctx, cen, P, text, color, dist) {
  const d = dist || 17;
  const u = unitVec(P[0] - cen[0], P[1] - cen[1]);
  textCenter(ctx, text, P[0] + u[0] * d, P[1] + u[1] * d, color || INK, fi(700, 17));
}

// 邊長標示：邊的中點沿外法線往外推，連元件本身的寬高一起算進去
function sideLabel(ctx, P, Q, cen, items, color, opts) {
  const o = opts || {};
  const size = o.size || 17;
  const mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2;
  let [nx, ny] = unitVec(-(Q[1] - P[1]), Q[0] - P[0]);
  if (nx * (mx - cen[0]) + ny * (my - cen[1]) < 0) { nx = -nx; ny = -ny; }
  if (o.inward) { nx = -nx; ny = -ny; }
  const w = exprWidth(ctx, items, size, 4);
  const h = items.reduce((m, it) => Math.max(m, measure(ctx, it, size).h), size);
  const off = (o.off == null ? 7 : o.off) + Math.abs(nx) * w / 2 + Math.abs(ny) * h / 2;
  drawExpr(ctx, items, mx + nx * off, my + ny * off, size, color, { gap: 4, maxW: 400 });
}

// 等長記號：在邊的中點畫 n 條短線
function tickMark(ctx, P, Q, n, color) {
  const mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2;
  const u = unitVec(Q[0] - P[0], Q[1] - P[1]);
  const v = [-u[1], u[0]];
  ctx.save();
  ctx.strokeStyle = color || INK;
  ctx.lineWidth = 1.8;
  for (let i = 0; i < n; i++) {
    const k = (i - (n - 1) / 2) * 5;
    const cx = mx + u[0] * k, cy = my + u[1] * k;
    ctx.beginPath();
    ctx.moveTo(cx - v[0] * 7, cy - v[1] * 7);
    ctx.lineTo(cx + v[0] * 7, cy + v[1] * 7);
    ctx.stroke();
  }
  ctx.restore();
}

// 一塊小色票（圖例用）
function swatch(ctx, x, cy, color, text) {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = color;
  ctx.fillRect(x, cy - 8, 16, 16);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(x, cy - 8, 16, 16);
  ctx.restore();
  textLeft(ctx, text, x + 24, cy, INK, f(700, 14));
}

// 坐標平面上的點標示：墊一塊深色底，壓到格線或線段時仍讀得到
function tag(ctx, text, cx, cy, color) {
  ctx.save();
  ctx.font = f(800, 13.5);
  const w = ctx.measureText(text).width + 10;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  roundRect(ctx, cx - w / 2, cy - 11, w, 22, 6);
  ctx.fill();
  ctx.restore();
  textCenter(ctx, text, cx, cy, color, f(800, 13.5));
  return w;
}

// 不成立時的紅字說明（開發約束 27）：一句為什麼、一句怎麼調回去
function drawInvalid(ctx, y, why, fix) {
  drawPanel(ctx, 30, y - 46, ctx.canvas.width - 60, 92, TL_ROSE, 0.08);
  textCenter(ctx, why, ctx.canvas.width / 2, y - 14, TL_ROSE, f(800, 17));
  textCenter(ctx, fix, ctx.canvas.width / 2, y + 18, INK, f(700, 15));
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第三冊 2-3 的 26 題正解
  // 正解字母分布：A 6 題、B 7 題、C 7 題、D 6 題（開發約束 36）
  const answers = {
    '2-3-1': 'A',    // ∠Q = 90°，斜邊是 PR
    '2-3-2': 'B',    // 兩股 2、5：R = 7² − 4 × 5 = 29
    '2-3-3': 'D',    // 中間正方形 = (a + b)² − 2ab
    '2-3-4': 'C',    // (甲周長)² + (乙周長)² = (丙周長)²
    '2-3-5': 'B',    // 兩股 9、40，斜邊 41
    '2-3-6': 'A',    // 兩股 5、15，斜邊 5√10
    '2-3-7': 'D',    // 斜邊 25、一股 20，另一股 15
    '2-3-8': 'C',    // 兩邊 9、16，第三邊 √337 或 5√7
    '2-3-9': 'A',    // AB = 15、AD = 17、DC = 12 → AC = 25
    '2-3-10': 'C',   // AB = 9、AD = 12、BC = 12 → CD = 9
    '2-3-11': 'B',   // 兩股 12、35 → 斜邊上的高 420/37
    '2-3-12': 'D',   // 斜邊 13、一股 5 → 斜邊上的高 60/13
    '2-3-13': 'C',   // 腰 17、底 16 → 面積 120
    '2-3-14': 'B',   // 腰 11、底 18 → 面積 18√10
    '2-3-15': 'D',   // 正三角形邊長 14：高 7√3、面積 49√3
    '2-3-16': 'A',   // 正三角形邊長 2√3：面積 3√3
    '2-3-17': 'C',   // 星形：正方形邊長 8 → 64 + 64√3
    '2-3-18': 'D',   // 3 個正方形、2 個正三角形，邊長 10 → 300 + 50√3
    '2-3-19': 'A',   // 8 × 15 換成 15 × 20：多 25 − 17 = 8
    '2-3-20': 'C',   // 7 個邊長 3 的正方形：21√2 ≈ 29.4
    '2-3-21': 'B',   // 梯長 13、梯腳 5，梯頂下滑 7 → 梯腳移動 7
    '2-3-22': 'C',   // 風箏線 65，水平 25 與 39 → 高度差 60 − 52 = 8
    '2-3-23': 'B',   // A(−7, 4)、B(5, 4) → 12
    '2-3-24': 'D',   // M(3, −9)、N(3, 2) → 11
    '2-3-25': 'A',   // A(7, −2)、B(−5, 3) → 13
    '2-3-26': 'B'    // P(8, 1)、Q(2, 9) 的正確算式
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
   重點 1：名詞與方格——兩股上的正方形面積和，等於斜邊上的正方形面積
   ========================================================================== */
function initGridCanvas() {
  const cv = elById('canvas-grid');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('gr-a'), sb = elById('gr-b');
  const va = elById('gr-va'), vb = elById('gr-vb');
  const mG = elById('gr-mode-group');
  const out = elById('gr-formula');
  const fb = elById('gr-feedback');
  const C = TL_TONE[0];
  let mode = 'name';

  function draw() {
    const a = iv(sa), b = iv(sb);
    va.textContent = a; vb.textContent = b;
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'name' ? '直角三角形：哪一邊是斜邊？' : '三塊方磚的面積（每小格面積 1）', C);

    // 範圍：x 從 −a 到 a + b，y 從 −b 到 a + b（原點是直角頂點 C）
    const W = 2 * a + b, H = a + 2 * b;
    const U = Math.min(34, 470 / W, 318 / H);
    const x0 = (cv.width - W * U) / 2 + a * U;
    const y0 = 52 + (318 - H * U) / 2 + (a + b) * U;
    const P = (x, y) => [x0 + x * U, y0 - y * U];

    ctx.save();
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.12)';
    ctx.lineWidth = 1;
    for (let x = -a; x <= a + b; x++) {
      ctx.beginPath(); ctx.moveTo(...P(x, -b)); ctx.lineTo(...P(x, a + b)); ctx.stroke();
    }
    for (let y = -b; y <= a + b; y++) {
      ctx.beginPath(); ctx.moveTo(...P(-a, y)); ctx.lineTo(...P(a + b, y)); ctx.stroke();
    }
    ctx.restore();

    const Cc = P(0, 0), A = P(0, a), B = P(b, 0);
    const sqP = [P(-a, 0), Cc, A, P(-a, a)];
    const sqQ = [Cc, B, P(b, -b), P(0, -b)];
    const sqR = [A, B, P(a + b, b), P(a, a + b)];
    const tri = [A, B, Cc];
    const cen = centroid(tri);
    const N = a * a + b * b, frame = (a + b) * (a + b);

    if (mode === 'name') {
      [sqP, sqQ, sqR].forEach(q => polyFill(ctx, q, MUTED, 0.04, { dash: [4, 4], lw: 1.2 }));
      polyFill(ctx, tri, TL_GOLD, 0.3, { lw: 2.6 });
      seg(ctx, A, B, TL_TERRA, 4);
      rightMark(ctx, Cc, A, B, INK, Math.min(14, U * 0.45));
      sideLabel(ctx, Cc, A, cen, [T('股', TL_COBALT)], TL_COBALT, { size: 16 });
      sideLabel(ctx, Cc, B, cen, [T('股', TL_JADE)], TL_JADE, { size: 16 });
      sideLabel(ctx, A, B, cen, [T('斜邊', TL_TERRA)], TL_TERRA, { size: 17 });
      vLabel(ctx, cen, A, 'A', INK);
      vLabel(ctx, cen, B, 'B', INK);
      vLabel(ctx, cen, Cc, 'C', INK);

      drawPanel(ctx, 18, 384, cv.width - 36, 104, C, 0.06);
      textCenter(ctx, '∠C 是直角：直角對面的邊 AB 叫斜邊（最長）', cv.width / 2, 410, TL_TERRA, f(800, 16));
      textCenter(ctx, '直角兩側的邊 AC、BC 都叫股', cv.width / 2, 438, INK, f(700, 15));
      textCenter(ctx, a === b ? `兩股都是 ${a}：這是等腰直角三角形` : `兩股長 ${a} 和 ${b}，不一樣長`, cv.width / 2, 466, a === b ? TL_GOLD : MUTED, f(700, 15));

      out.innerHTML = `斜邊 \\(\\overline{AB}\\)；股 \\(\\overline{AC}\\)、\\(\\overline{BC}\\)`;
      fb.innerHTML = wrapFeedback(`直角 \\(\\angle C\\) 對面的 <b style="color:${TL_TERRA}">\\(\\overline{AB}\\) 是斜邊</b>，夾著直角的 \\(\\overline{AC}\\)、\\(\\overline{BC}\\) 是股。${a === b ? '兩股一樣長，是<b>等腰直角三角形</b>。' : ''}`);
    } else {
      // 斜邊上的 R 是斜放的，用外框正方形扣掉四個角落的直角三角形來算
      polyFill(ctx, [Cc, P(a + b, 0), P(a + b, a + b), P(0, a + b)], TL_ROSE, 0, { dash: [6, 4], lw: 1.6 });
      [[B, P(a + b, 0), P(a + b, b)], [P(a + b, b), P(a + b, a + b), P(a, a + b)], [P(a, a + b), P(0, a + b), A]]
        .forEach(t => polyFill(ctx, t, TL_ROSE, 0.14, { lw: 1.2 }));
      polyFill(ctx, sqP, TL_COBALT, 0.28);
      polyFill(ctx, sqQ, TL_JADE, 0.28);
      polyFill(ctx, sqR, TL_TERRA, 0.3, { lw: 2.6 });
      polyFill(ctx, tri, TL_GOLD, 0.3, { lw: 2 });
      rightMark(ctx, Cc, A, B, INK, Math.min(14, U * 0.45));

      const lab = (q, s, col) => {
        const c = centroid(q);
        drawExpr(ctx, [T(s, col)], c[0], c[1], Math.min(17, U * 0.62), col, { maxW: 200 });
      };
      lab(sqP, `P = ${a * a}`, TL_COBALT);
      lab(sqQ, `Q = ${b * b}`, TL_JADE);
      lab(sqR, `R = ${N}`, TL_TERRA);

      drawPanel(ctx, 18, 384, cv.width - 36, 104, C, 0.06);
      drawExpr(ctx, [T('R = 外框', TL_TERRA), sqr(a + b, TL_TERRA), T('− 4 個角落', TL_ROSE), T('=', INK),
        T(frame, INK), T('−', INK), T(4, INK), T('×', INK), FR(1, 2, INK), T('×', INK), T(a, INK), T('×', INK), T(b, INK),
        T('=', INK), T(N, TL_TERRA)], cv.width / 2, 414, 16, INK, { maxW: cv.width - 60, gap: 5 });
      drawExpr(ctx, [T('P + Q =', INK), sqr(a, TL_COBALT), T('+', INK), sqr(b, TL_JADE), T('=', INK), T(N, TL_TERRA),
        T('= R ✓', OK_COLOR)], cv.width / 2, 458, 19, INK, { maxW: cv.width - 60 });

      out.innerHTML = wbrEq(`P + Q = ${a}^2 + ${b}^2 = ${N} = R`);
      fb.innerHTML = wrapFeedback(`R 斜放、不好數，改用外框：${wbrEq(`(${a} + ${b})^2 - 4 \\times \\frac{1}{2} \\times ${a} \\times ${b} = ${N}`)}。兩股上的正方形 <b style="color:${TL_COBALT}">P</b>、<b style="color:${TL_JADE}">Q</b> 合起來，剛好等於斜邊上的 <b style="color:${TL_TERRA}">R</b>。`);
    }
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-gr-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：拼圖證明——(a + b)² − 4 × ½ab = c²
   ========================================================================== */
function initProofCanvas() {
  const cv = elById('canvas-proof');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('pf-a'), sb = elById('pf-b');
  const va = elById('pf-va'), vb = elById('pf-vb');
  const mG = elById('pf-mode-group');
  const out = elById('pf-formula');
  const fb = elById('pf-feedback');
  const C = TL_TONE[1];
  let mode = 'one';

  function draw() {
    const a = iv(sa), b = iv(sb), n = a + b, N = a * a + b * b;
    va.textContent = a; vb.textContent = b;
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'one' ? '拼法一：四個三角形繞一圈' : '拼法二：四個三角形兩兩拼成長方形', C);

    const S = 232 / n, X0 = 34, Y0 = 60;
    const P = (x, y) => [X0 + x * S, Y0 + 232 - y * S];
    const box = [P(0, 0), P(n, 0), P(n, n), P(0, n)];
    const cenBox = centroid(box);

    if (mode === 'one') {
      const E = P(a, 0), F = P(n, a), G = P(b, n), H = P(0, b);
      [[P(0, 0), E, H], [P(n, 0), F, E], [P(n, n), G, F], [P(0, n), H, G]]
        .forEach(t => polyFill(ctx, t, TL_GOLD, 0.3, { lw: 1.8 }));
      polyFill(ctx, [E, F, G, H], TL_TERRA, 0.3, { lw: 2.6 });
      const ci = centroid([E, F, G, H]);
      drawExpr(ctx, [PW(IT('c', TL_TERRA), 2, false, TL_TERRA)], ci[0], ci[1], 22, TL_TERRA);
      sideLabel(ctx, E, F, ci, [IT('c', TL_TERRA)], TL_TERRA, { inward: true, size: 16, off: 5 });
      // 外框的 a、b 分段
      [[P(0, 0), E, 'a'], [E, P(n, 0), 'b'], [P(n, 0), F, 'a'], [F, P(n, n), 'b'],
       [P(n, n), G, 'a'], [G, P(0, n), 'b'], [P(0, n), H, 'a'], [H, P(0, 0), 'b']]
        .forEach(([p, q, s]) => sideLabel(ctx, p, q, cenBox, [IT(s, s === 'a' ? TL_COBALT : TL_JADE)], INK, { size: 16 }));
    } else {
      polyFill(ctx, [P(0, 0), P(a, 0), P(a, a), P(0, a)], TL_COBALT, 0.3, { lw: 2.4 });
      polyFill(ctx, [P(a, a), P(n, a), P(n, n), P(a, n)], TL_JADE, 0.3, { lw: 2.4 });
      [[P(a, 0), P(n, 0), P(n, a)], [P(a, 0), P(n, a), P(a, a)], [P(0, a), P(a, a), P(a, n)], [P(0, a), P(a, n), P(0, n)]]
        .forEach(t => polyFill(ctx, t, TL_GOLD, 0.3, { lw: 1.8 }));
      const cA = centroid([P(0, 0), P(a, a)]), cB = centroid([P(a, a), P(n, n)]);
      drawExpr(ctx, [PW(IT('a', TL_COBALT), 2, false, TL_COBALT)], cA[0], cA[1], Math.min(22, a * S * 0.5), TL_COBALT);
      drawExpr(ctx, [PW(IT('b', TL_JADE), 2, false, TL_JADE)], cB[0], cB[1], Math.min(22, b * S * 0.5), TL_JADE);
      [[P(0, 0), P(a, 0), 'a'], [P(a, 0), P(n, 0), 'b'], [P(0, a), P(0, 0), 'a'], [P(0, n), P(0, a), 'b']]
        .forEach(([p, q, s]) => sideLabel(ctx, p, q, cenBox, [IT(s, s === 'a' ? TL_COBALT : TL_JADE)], INK, { size: 16 }));
    }
    polyFill(ctx, box, INK, 0, { lw: 2.4 });

    // 右側圖例
    const lx = 312;
    textLeft(ctx, `大正方形邊長 a + b`, lx, 82, INK, f(800, 15));
    textLeft(ctx, `= ${a} + ${b} = ${n}`, lx, 106, MUTED, f(700, 14));
    swatch(ctx, lx, 144, TL_GOLD, '4 個直角三角形');
    textLeft(ctx, `兩股 a = ${a}、b = ${b}`, lx + 24, 168, MUTED, f(700, 13));
    if (mode === 'one') {
      swatch(ctx, lx, 206, TL_TERRA, '中間：邊長 c 的正方形');
      textLeft(ctx, '四邊都是 c、四個角都是直角', lx + 24, 230, MUTED, f(700, 13));
    } else {
      swatch(ctx, lx, 206, TL_COBALT, `邊長 a 的正方形：${a * a}`);
      swatch(ctx, lx, 238, TL_JADE, `邊長 b 的正方形：${b * b}`);
    }

    const tri4 = 2 * a * b;
    const rows = [
      { name: '大正方形', hint: '邊長 a + b', items: [PW(GRP([T(a, INK), T('+', INK), T(b, INK)], '()', INK), 2, false, INK), T('=', INK), T(n * n, INK)] },
      { name: '扣掉 4 個三角形', hint: '每個是 ½ × a × b', items: [T(n * n, INK), T('−', INK), T(4, TL_GOLD), T('×', INK), FR(1, 2, TL_GOLD), T('×', INK), T(a, TL_COBALT), T('×', INK), T(b, TL_JADE), T('=', INK), T(n * n - tri4, TL_TERRA)] },
      mode === 'one'
        ? { name: '留白是 c²', hint: '中間那塊正方形', items: [PW(IT('c', TL_TERRA), 2, false, TL_TERRA), T('=', INK), T(N, TL_TERRA), T('=', INK), sqr(a, TL_COBALT), T('+', INK), sqr(b, TL_JADE)] }
        : { name: '留白是 a² + b²', hint: '兩塊正方形', items: [sqr(a, TL_COBALT), T('+', INK), sqr(b, TL_JADE), T('=', INK), T(N, TL_TERRA), T('=', INK), PW(IT('c', TL_TERRA), 2, false, TL_TERRA)] }
    ];
    drawStepRows(ctx, numberRows(rows), 3, { top: 340, gap: 54, labX: 22, eqX: 170, size: 20, color: C });

    out.innerHTML = wbrEq(`(${a} + ${b})^2 - 4 \\times \\frac{1}{2} \\times ${a} \\times ${b} = ${N} = ${a}^2 + ${b}^2`);
    fb.innerHTML = wrapFeedback(`${mode === 'one' ? '拼法一的留白是中間的 \\(c^2\\)' : '拼法二的留白是 \\(a^2\\) 和 \\(b^2\\) 兩塊'}；兩種拼法用的是同一個大正方形、同樣四個三角形，留白一定一樣大：<br>\\((a + b)^2 - 2ab = a^2 + b^2\\)，所以 <b style="color:${C}">\\(c^2 = a^2 + b^2\\)</b>，這裡 \\(c = ${chainTex(N)}\\)。`);
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-pf-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：已知兩股求斜邊——c² = a² + b²
   ========================================================================== */
function initHypCanvas() {
  const cv = elById('canvas-hyp');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('hy-a'), sb = elById('hy-b');
  const va = elById('hy-va'), vb = elById('hy-vb');
  const out = elById('hy-formula');
  const fb = elById('hy-feedback');
  const C = TL_TONE[2];
  const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];

  function draw() {
    const a = iv(sa), b = iv(sb), N = a * a + b * b;
    va.textContent = a; vb.textContent = b;
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '已知兩股，求斜邊', C);

    // 直角在 C；股 a 直立、股 b 橫放
    const map = fitBox([[0, 0], [b, 0], [0, a]], { x: 52, y: 66, w: 240, h: 220 });
    const Cc = map.P([0, 0]), A = map.P([b, 0]), B = map.P([0, a]);
    const tri = [A, B, Cc], cen = centroid(tri);
    polyFill(ctx, tri, TL_GOLD, 0.22);
    seg(ctx, A, B, TL_TERRA, 4);
    rightMark(ctx, Cc, A, B, INK);
    sideLabel(ctx, Cc, B, cen, [T(a, TL_COBALT)], TL_COBALT);
    sideLabel(ctx, Cc, A, cen, [T(b, TL_JADE)], TL_JADE);
    sideLabel(ctx, A, B, cen, [IT('c', TL_TERRA)], TL_TERRA, { size: 19 });

    // 右側：常見的整數三邊組
    const g = gcd(a, b);
    const pa = Math.min(a, b) / g, pb = Math.max(a, b) / g;
    const hit = TRIPLES.findIndex(t => t[0] === pa && t[1] === pb);
    textLeft(ctx, '常見的整數三邊', 334, 78, MUTED, f(800, 14));
    TRIPLES.forEach((t, i) => {
      const on = i === hit;
      drawChip(ctx, 334, 94 + i * 42, 170, 32, `${t[0]}、${t[1]}、${t[2]}`, on ? OK_COLOR : DIM, on ? 'rgba(52,211,153,0.16)' : null);
    });
    if (hit >= 0 && g > 1) {
      const t = TRIPLES[hit];
      textLeft(ctx, `${Math.min(a, b)}、${Math.max(a, b)}、${g * t[2]} 是它的 ${g} 倍`, 334, 278, OK_COLOR, f(700, 13));
    }

    const [k, r] = rdSqf(N);
    const pm = r === 1 ? T(`±${k}`, TL_TERRA) : SEQ([T('±', TL_TERRA), k > 1 ? crItem(k, r, TL_TERRA) : rtItem(N, TL_TERRA)], TL_TERRA, 2);
    const rows = [
      { name: '畢氏定理', hint: '斜邊² = 兩股平方和', items: [PW(IT('c', TL_TERRA), 2, false, TL_TERRA), T('=', INK), sqr(a, TL_COBALT), T('+', INK), sqr(b, TL_JADE), T('=', INK), T(a * a, TL_COBALT), T('+', INK), T(b * b, TL_JADE), T('=', INK), T(N, TL_TERRA)] },
      { name: '開平方', hint: `平方等於 ${N} 的數有兩個`, items: [IT('c', TL_TERRA), T('=', INK), pm] },
      { name: '邊長取正', hint: '邊長一定是正數，負的捨去', items: [IT('c', TL_TERRA), T('=', INK), ...chainItems(N, TL_TERRA)] }
    ];
    drawStepRows(ctx, numberRows(rows), 3, { top: 330, gap: 58, labX: 22, eqX: 160, size: 20, color: C });

    out.innerHTML = `${wbrEq(`c^2 = ${a}^2 + ${b}^2 = ${N}`)}，<wbr>\\( c = ${chainTex(N)} \\)`;
    fb.innerHTML = wrapFeedback(r === 1
      ? `斜邊 \\(c = ${k}\\) 是整數：\\(${Math.min(a, b)}\\)、\\(${Math.max(a, b)}\\)、\\(${k}\\) 是一組整數三邊${hit >= 0 ? `（${TRIPLES[hit].join('、')} 的 ${g} 倍）` : ''}。`
      : `\\(${N}\\) 不是完全平方數，斜邊寫成 <b style="color:${C}">\\(${lenTex(N)} \\approx ${ap(Math.sqrt(N))}\\)</b>。`);
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：已知斜邊與一股求另一股——先判斷誰是斜邊
   ========================================================================== */
function initLegCanvas() {
  const cv = elById('canvas-leg');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = elById('lg-p'), sq = elById('lg-q');
  const vp = elById('lg-vp'), vq = elById('lg-vq');
  const mG = elById('lg-mode-group');
  const out = elById('lg-formula');
  const fb = elById('lg-feedback');
  const C = TL_TONE[3];
  let mode = 'hyp';

  function draw() {
    const p = iv(sp), q = iv(sq);
    vp.textContent = p; vq.textContent = q;
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'legs' ? `${p} 和 ${q} 都是股，求斜邊 x` : `${q} 是斜邊、${p} 是股，求另一股 x`, C);

    const Nsum = p * p + q * q, Ndiff = q * q - p * p;

    // 下方：同樣兩個數，兩種情形都列出來（第三邊不一定只有一個答案）
    drawPanel(ctx, 18, 410, cv.width - 36, 80, C, 0.06);
    textLeft(ctx, `只知道兩邊是 ${p}、${q} 時，第三邊有兩種可能：`, 36, 428, MUTED, f(700, 13.5));
    exprLeft(ctx, [T(`${q} 是股 → 斜邊`, mode === 'legs' ? TL_TERRA : INK), lenItem(Nsum, mode === 'legs' ? TL_TERRA : INK)], 36, 458, 16, INK, 225);
    if (q > p) exprLeft(ctx, [T(`${q} 是斜邊 → 股`, mode === 'hyp' ? TL_TERRA : INK), lenItem(Ndiff, mode === 'hyp' ? TL_TERRA : INK)], 280, 458, 16, INK, 230);
    else textLeft(ctx, `${q} 不比 ${p} 長，不能當斜邊`, 280, 458, MUTED, f(700, 14));

    if (mode === 'hyp' && q <= p) {
      drawInvalid(ctx, 200, `斜邊一定是最長的邊，${q} 不比 ${p} 長，不能當斜邊`, '把斜邊 q 調得比 p 大，或改選「兩個都是股」');
      out.innerHTML = '斜邊必須是最長的邊，這組數字不成立';
      fb.innerHTML = wrapFeedback(`<span style="color:${TL_ROSE}">斜邊對著直角，一定是最長的邊；現在 \\(q = ${q}\\)、\\(p = ${p}\\)，\\(q\\) 不比 \\(p\\) 大，不能當斜邊。</span>`);
      typeset([out, fb]);
      return;
    }

    const N = mode === 'legs' ? Nsum : Ndiff;
    const vert = Math.sqrt(mode === 'legs' ? q * q : Ndiff);
    const map = fitBox([[0, 0], [p, 0], [0, vert]], { x: 150, y: 62, w: 240, h: 160 });
    const Cc = map.P([0, 0]), A = map.P([p, 0]), B = map.P([0, vert]);
    const tri = [A, B, Cc], cen = centroid(tri);
    polyFill(ctx, tri, TL_GOLD, 0.22);
    seg(ctx, A, B, TL_TERRA, 4);
    rightMark(ctx, Cc, A, B, INK);
    sideLabel(ctx, Cc, A, cen, [T(p, TL_COBALT)], TL_COBALT);
    if (mode === 'legs') {
      sideLabel(ctx, Cc, B, cen, [T(q, TL_JADE)], TL_JADE);
      sideLabel(ctx, A, B, cen, [IT('x', TL_TERRA), T('（斜邊）', TL_TERRA)], TL_TERRA, { size: 17 });
    } else {
      sideLabel(ctx, Cc, B, cen, [IT('x', TL_JADE)], TL_JADE, { size: 19 });
      sideLabel(ctx, A, B, cen, [T(q, TL_TERRA), T('（斜邊）', TL_TERRA)], TL_TERRA, { size: 17 });
    }

    const rows = mode === 'legs'
      ? [
        { name: '先找斜邊', hint: '直角對面的那一邊', items: [T('斜邊是', INK), IT('x', TL_TERRA), T('（第三邊）', MUTED)] },
        { name: '兩股平方相加', hint: '斜邊² = 股² + 股²', items: [PW(IT('x', TL_TERRA), 2, false, TL_TERRA), T('=', INK), sqr(p, TL_COBALT), T('+', INK), sqr(q, TL_JADE), T('=', INK), T(N, TL_TERRA)] },
        { name: '邊長取正', hint: '負的捨去', items: [IT('x', TL_TERRA), T('=', INK), ...chainItems(N, TL_TERRA)] }
      ]
      : [
        { name: '先找斜邊', hint: '直角對面的那一邊', items: [T('斜邊是', INK), T(q, TL_TERRA), T('，', INK), IT('x', TL_JADE), T('是股', INK)] },
        { name: '斜邊平方減股平方', hint: `${q}² = x² + ${p}²`, items: [PW(IT('x', TL_JADE), 2, false, TL_JADE), T('=', INK), sqr(q, TL_TERRA), T('−', INK), sqr(p, TL_COBALT), T('=', INK), T(N, TL_JADE)] },
        { name: '邊長取正', hint: '負的捨去', items: [IT('x', TL_JADE), T('=', INK), ...chainItems(N, TL_JADE)] }
      ];
    drawStepRows(ctx, numberRows(rows), 3, { top: 262, gap: 50, labX: 22, eqX: 170, size: 20, color: C });

    out.innerHTML = mode === 'legs'
      ? `${wbrEq(`x^2 = ${p}^2 + ${q}^2 = ${N}`)}，<wbr>\\( x = ${chainTex(N)} \\)`
      : `${wbrEq(`x^2 = ${q}^2 - ${p}^2 = ${N}`)}，<wbr>\\( x = ${chainTex(N)} \\)`;
    fb.innerHTML = wrapFeedback(mode === 'legs'
      ? `\\(${p}\\)、\\(${q}\\) 都是股，第三邊是斜邊，<b style="color:${C}">兩股平方相加</b>：\\(x = ${lenTex(N)}\\)。`
      : `\\(${q}\\) 是斜邊，第三邊是股，要用<b style="color:${C}">斜邊平方減股平方</b>：\\(x = ${lenTex(N)}\\)。<br>同樣是 \\(${p}\\)、\\(${q}\\)，當成兩股會算出 \\(${lenTex(Nsum)}\\)：沒先看誰是斜邊就會算錯。`);
    typeset([out, fb]);
  }

  [sp, sq].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-lg-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：兩個直角三角形接力——先求共用的那一邊
   ========================================================================== */
function initRelayCanvas() {
  const cv = elById('canvas-relay');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const st = elById('rl-t'), sn = elById('rl-n');
  const sp = elById('rl-p'), sq = elById('rl-q'), sr = elById('rl-r');
  const vt = elById('rl-vt'), vn = elById('rl-vn'), vp = elById('rl-vp'), vq = elById('rl-vq'), vr = elById('rl-vr');
  const rowsLine = [elById('rl-row-t'), elById('rl-row-n')];
  const rowsQuad = [elById('rl-row-p'), elById('rl-row-q'), elById('rl-row-r')];
  const mG = elById('rl-mode-group');
  const out = elById('rl-formula');
  const fb = elById('rl-feedback');
  const C = TL_TONE[4];
  // △ABD 的三邊（AB, BD, AD），BD 都是整數，第二步才接得起來
  const SETS = [[4, 3, 5], [3, 4, 5], [8, 6, 10], [6, 8, 10], [12, 5, 13], [5, 12, 13]];
  let mode = 'line';

  function drawLine() {
    const [h, m, d] = SETS[iv(st)], n = iv(sn);
    vt.textContent = `AB = ${h}、AD = ${d}`; vn.textContent = n;
    const BC = m + n, N = h * h + BC * BC;
    drawTitle(ctx, '∠B 是直角，D 在 BC 上：求 AC', C);

    const map = fitBox([[0, 0], [BC, 0], [0, h]], { x: 60, y: 60, w: 420, h: 166 });
    const B = map.P([0, 0]), D = map.P([m, 0]), Cc = map.P([BC, 0]), A = map.P([0, h]);
    const cen = centroid([A, B, Cc]);
    polyFill(ctx, [A, B, D], TL_COBALT, 0.22, { lw: 1.8 });
    polyFill(ctx, [A, D, Cc], TL_JADE, 0.16, { lw: 1.8 });
    seg(ctx, A, B, TL_GOLD, 4);
    seg(ctx, A, Cc, TL_TERRA, 3.2, [7, 5]);
    rightMark(ctx, B, A, Cc, INK);
    sideLabel(ctx, B, A, cen, [T(h, TL_GOLD)], TL_GOLD);
    sideLabel(ctx, A, D, centroid([A, B, D]), [T(d, TL_COBALT)], TL_COBALT, { inward: false });
    sideLabel(ctx, B, D, cen, [T('?', TL_COBALT)], TL_COBALT);
    sideLabel(ctx, D, Cc, cen, [T(n, TL_JADE)], TL_JADE);
    sideLabel(ctx, A, Cc, cen, [IT('x', TL_TERRA)], TL_TERRA, { size: 19 });
    [[A, 'A'], [B, 'B'], [Cc, 'C']].forEach(([P, s]) => vLabel(ctx, cen, P, s, INK));
    textCenter(ctx, 'D', D[0], D[1] + 18, INK, fi(700, 17));

    const rows = [
      { name: '△ABD 求 BD', hint: '斜邊 AD、股 AB', items: [sqr('BD', TL_COBALT), T('=', INK), sqr(d, INK), T('−', INK), sqr(h, TL_GOLD), T('=', INK), T(m * m, INK), T('，BD =', INK), T(m, TL_COBALT)] },
      { name: '接起來', hint: 'BC = BD + DC', items: [T('BC =', INK), T(m, TL_COBALT), T('+', INK), T(n, TL_JADE), T('=', INK), T(BC, INK)] },
      { name: '△ABC 求 AC', hint: '兩股 AB、BC', items: [PW(IT('x', TL_TERRA), 2, false, TL_TERRA), T('=', INK), sqr(h, TL_GOLD), T('+', INK), sqr(BC, INK), T('=', INK), T(N, TL_TERRA)] },
      { name: '邊長取正', hint: '負的捨去', items: [IT('x', TL_TERRA), T('=', INK), ...chainItems(N, TL_TERRA)] }
    ];
    drawStepRows(ctx, numberRows(rows), 4, { top: 300, gap: 52, labX: 22, eqX: 170, size: 19, color: C });

    out.innerHTML = `\\( BD = ${m} \\)，<wbr>\\( BC = ${BC} \\)，<wbr>${wbrEq(`AC = ${chainTex(N)}`)}`;
    fb.innerHTML = wrapFeedback(`\\(\\overline{AC}\\) 所在的 △ABC 只知道一股 \\(\\overline{AB}\\)，另一股 \\(\\overline{BC}\\) 缺了 \\(\\overline{BD}\\)。先在 △ABD 求出 <b style="color:${TL_COBALT}">\\(\\overline{BD} = ${m}\\)</b>，接成 \\(\\overline{BC} = ${BC}\\)，再用一次畢氏定理。`);
  }

  function drawQuad() {
    const p = iv(sp), q = iv(sq), r = iv(sr);
    vp.textContent = p; vq.textContent = q; vr.textContent = r;
    const N1 = p * p + q * q;
    drawTitle(ctx, '四邊形 ABCD 中 ∠A = ∠C = 90°：求 CD', C);

    if (r * r >= N1) {
      drawInvalid(ctx, 190, `BC = ${r} 不比對角線 BD = ${lenStr(N1)} 短，△BCD 圍不起來`, '在 △BCD 裡 BD 是斜邊，把 BC 調小');
      out.innerHTML = `BC 必須比斜邊 BD 短，這組數字不成立`;
      fb.innerHTML = wrapFeedback(`<span style="color:${TL_ROSE}">在 △BCD 中 \\(\\angle C\\) 是直角，\\(\\overline{BD}\\) 是斜邊，一定比 \\(\\overline{BC}\\) 長；\\(\\overline{BD} = ${lenTex(N1)} \\approx ${ap(Math.sqrt(N1))}\\)，\\(\\overline{BC} = ${r}\\) 太長了。</span>`);
      return;
    }
    const N2 = N1 - r * r;
    // A 在原點，AB 沿 x 軸、AD 沿 y 軸；C 在 BD 的另一側，使 ∠BCD = 90°
    const L = Math.sqrt(N1);
    const u = [(0 - p) / L, (q - 0) / L];
    let nv = [-u[1], u[0]];
    if (nv[0] * (0 - p) + nv[1] * (0 - 0) > 0) nv = [-nv[0], -nv[1]];
    const cosB = r / L, sinB = Math.sqrt(1 - cosB * cosB);
    const Cu = [p + r * (cosB * u[0] + sinB * nv[0]), r * (cosB * u[1] + sinB * nv[1])];
    const map = fitBox([[0, 0], [p, 0], [0, q], Cu], { x: 60, y: 66, w: 420, h: 178 });
    const A = map.P([0, 0]), B = map.P([p, 0]), D = map.P([0, q]), Cc = map.P(Cu);
    const quad = [A, B, Cc, D], cen = centroid(quad);
    polyFill(ctx, [A, B, D], TL_COBALT, 0.22, { lw: 1.8 });
    polyFill(ctx, [B, Cc, D], TL_JADE, 0.16, { lw: 1.8 });
    seg(ctx, B, D, TL_GOLD, 4, [8, 5]);
    rightMark(ctx, A, B, D, INK);
    rightMark(ctx, Cc, B, D, INK);
    sideLabel(ctx, A, B, cen, [T(p, TL_COBALT)], TL_COBALT);
    sideLabel(ctx, A, D, cen, [T(q, TL_COBALT)], TL_COBALT);
    sideLabel(ctx, B, Cc, cen, [T(r, TL_JADE)], TL_JADE);
    sideLabel(ctx, Cc, D, cen, [IT('x', TL_TERRA)], TL_TERRA, { size: 19 });
    [[A, 'A'], [B, 'B'], [Cc, 'C'], [D, 'D']].forEach(([P, s]) => vLabel(ctx, cen, P, s, INK));

    const rows = [
      { name: '△ABD 求 BD', hint: '兩股 AB、AD', items: [sqr('BD', TL_GOLD), T('=', INK), sqr(p, TL_COBALT), T('+', INK), sqr(q, TL_COBALT), T('=', INK), T(N1, TL_GOLD)] },
      { name: '共用 BD', hint: '下一步要的是 BD²，先不開根號也行', items: [T('BD =', INK), lenItem(N1, TL_GOLD)] },
      { name: '△BCD 求 CD', hint: '斜邊 BD、股 BC', items: [PW(IT('x', TL_TERRA), 2, false, TL_TERRA), T('=', INK), T(N1, TL_GOLD), T('−', INK), sqr(r, TL_JADE), T('=', INK), T(N2, TL_TERRA)] },
      { name: '邊長取正', hint: '負的捨去', items: [IT('x', TL_TERRA), T('=', INK), ...chainItems(N2, TL_TERRA)] }
    ];
    drawStepRows(ctx, numberRows(rows), 4, { top: 300, gap: 52, labX: 22, eqX: 170, size: 19, color: C });

    out.innerHTML = `${wbrEq(`BD^2 = ${N1}`)}，<wbr>${wbrEq(`CD^2 = ${N1} - ${r}^2 = ${N2}`)}，<wbr>\\( CD = ${chainTex(N2)} \\)`;
    fb.innerHTML = wrapFeedback(`對角線 <b style="color:${TL_GOLD}">\\(\\overline{BD}\\)</b> 是兩個直角三角形共用的邊：在 △ABD 是斜邊、在 △BCD 也是斜邊。先求 \\(\\overline{BD}^2 = ${N1}\\)，再減 \\(${r}^2\\) 得 \\(\\overline{CD} = ${lenTex(N2)}\\)。`);
  }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    rowsLine.forEach(rw => { rw.style.display = mode === 'line' ? '' : 'none'; });
    rowsQuad.forEach(rw => { rw.style.display = mode === 'quad' ? '' : 'none'; });
    if (mode === 'line') drawLine();
    else drawQuad();
    typeset([out, fb]);
  }

  [st, sn, sp, sq, sr].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-rl-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：斜邊上的高——同一個三角形的面積算兩次
   ========================================================================== */
function initAltCanvas() {
  const cv = elById('canvas-alt');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('al-a'), sb = elById('al-b');
  const va = elById('al-va'), vb = elById('al-vb');
  const out = elById('al-formula');
  const fb = elById('al-feedback');
  const C = TL_TONE[5];

  function draw() {
    const a = iv(sa), b = iv(sb), N = a * a + b * b;
    va.textContent = a; vb.textContent = b;
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '∠ABC 是直角，BD 是斜邊上的高', C);

    // B 在原點，AB 直立、BC 橫放；D 是 B 在 AC 上的垂足
    const t = (a * a) / N;
    const Du = [t * b, a - t * a];
    const map = fitBox([[0, 0], [b, 0], [0, a]], { x: 70, y: 64, w: 400, h: 190 });
    const B = map.P([0, 0]), Cc = map.P([b, 0]), A = map.P([0, a]), D = map.P(Du);
    const tri = [A, B, Cc], cen = centroid(tri);
    polyFill(ctx, tri, TL_GOLD, 0.2);
    seg(ctx, A, Cc, TL_TERRA, 3.4);
    seg(ctx, B, D, TL_JADE, 3.4, [7, 5]);
    rightMark(ctx, B, A, Cc, INK);
    rightMark(ctx, D, Cc, B, INK, 11);
    sideLabel(ctx, B, A, cen, [T(a, TL_COBALT)], TL_COBALT);
    sideLabel(ctx, B, Cc, cen, [T(b, TL_COBALT)], TL_COBALT);
    sideLabel(ctx, A, Cc, cen, [T('AC', TL_TERRA)], TL_TERRA);
    [[A, 'A'], [B, 'B'], [Cc, 'C']].forEach(([P, s]) => vLabel(ctx, cen, P, s, INK));
    vLabel(ctx, B, D, 'D', INK, 16);

    const h = rdTerm(a * b, N, N);
    const area2 = fracItem(a * b, 2, INK);
    // 斜邊是整數、分數又已經最簡時，「= 化簡結果」只是把同一個分數再寫一次
    const [hk, hr] = rdSqf(N);
    const same = hr === 1 && gcd(a * b, hk) === 1;
    const rows = [
      { name: '先求斜邊', hint: 'AC² = AB² + BC²', items: [sqr('AC', TL_TERRA), T('=', INK), sqr(a, TL_COBALT), T('+', INK), sqr(b, TL_COBALT), T('=', INK), T(N, INK), T('，AC =', INK), lenItem(N, TL_TERRA)] },
      { name: '面積：兩股', hint: '底 BC、高 AB', items: [FR(1, 2, INK), T('×', INK), T(a, TL_COBALT), T('×', INK), T(b, TL_COBALT), T('=', INK), area2] },
      { name: '面積：斜邊', hint: '底 AC、高 BD', items: [FR(1, 2, INK), T('×', INK), lenItem(N, TL_TERRA), T('×', INK), T('BD', TL_JADE), T('=', INK), area2] },
      { name: '解出 BD', hint: '兩股相乘 ÷ 斜邊', items: [T('BD =', TL_JADE), VF(T(a * b, TL_COBALT), lenItem(N, TL_TERRA), INK), ...(same ? [] : [T('=', INK), ...rdItems([h], TL_JADE)])] }
    ];
    drawStepRows(ctx, numberRows(rows), 4, { top: 296, gap: 54, labX: 22, eqX: 160, size: 19, color: C });

    out.innerHTML = `\\( AC = ${chainTex(N)} \\)，<wbr>${wbrEq(`BD = \\frac{${a} \\times ${b}}{${lenTex(N)}} = ${rdTex([h])}`)}`;
    fb.innerHTML = wrapFeedback(`同一個三角形，用兩股當底和高、或用斜邊 \\(\\overline{AC}\\) 和高 \\(\\overline{BD}\\)，算出的面積相同。所以 <b style="color:${C}">\\(\\overline{BD} = \\frac{\\text{兩股相乘}}{\\text{斜邊}}\\)</b> \\(= ${rdTex([h])} \\approx ${ap(rdVal([h]))}\\)。`);
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：等腰三角形底邊上的高——中點把底邊切一半
   ========================================================================== */
function initIsoCanvas() {
  const cv = elById('canvas-iso');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const ss = elById('is-s'), sw = elById('is-w');
  const vs = elById('is-vs'), vw = elById('is-vw');
  const out = elById('is-formula');
  const fb = elById('is-feedback');
  const C = TL_TONE[6];

  function draw() {
    const s = iv(ss), w = iv(sw), m = w / 2;
    vs.textContent = s; vw.textContent = w;
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `等腰三角形：兩腰 ${s}、底 ${w}`, C);

    if (s <= m) {
      drawInvalid(ctx, 180, `兩腰加起來 ${2 * s} 不比底 ${w} 長，圍不成三角形`, '把腰調長，或把底調短（腰要比底的一半長）');
      out.innerHTML = '腰必須比底的一半長，這組數字不成立';
      fb.innerHTML = wrapFeedback(`<span style="color:${TL_ROSE}">底的一半是 \\(${m}\\)，腰 \\(${s}\\) 不比它長，兩腰搭不起來，沒有頂點 A。</span>`);
      typeset([out, fb]);
      return;
    }
    const N = s * s - m * m;
    const hv = Math.sqrt(N);
    const map = fitBox([[-m, 0], [m, 0], [0, hv]], { x: 80, y: 64, w: 380, h: 200 });
    const B = map.P([-m, 0]), Cc = map.P([m, 0]), A = map.P([0, hv]), D = map.P([0, 0]);
    const tri = [A, B, Cc], cen = centroid(tri);
    polyFill(ctx, tri, TL_GOLD, 0.2);
    polyFill(ctx, [A, B, D], TL_COBALT, 0.12, { lw: 0 });
    seg(ctx, A, D, TL_JADE, 3.4, [7, 5]);
    rightMark(ctx, D, Cc, A, INK, 12);
    tickMark(ctx, A, B, 2, TL_TERRA);
    tickMark(ctx, A, Cc, 2, TL_TERRA);
    tickMark(ctx, B, D, 1, INK);
    tickMark(ctx, D, Cc, 1, INK);
    sideLabel(ctx, A, B, cen, [T(s, TL_TERRA)], TL_TERRA);
    sideLabel(ctx, A, Cc, cen, [T(s, TL_TERRA)], TL_TERRA);
    sideLabel(ctx, B, D, cen, [T(mn(m), INK)], INK, { off: 18 });
    sideLabel(ctx, D, Cc, cen, [T(mn(m), INK)], INK, { off: 18 });
    [[A, 'A'], [B, 'B'], [Cc, 'C']].forEach(([P, t]) => vLabel(ctx, cen, P, t, INK));
    textCenter(ctx, 'D', D[0], D[1] + 40, INK, fi(700, 17));

    const area = rdTerm(m, 1, N);
    const rows = [
      { name: '取底邊中點 D', hint: 'AD 垂直平分 BC', items: [T('BD =', INK), FR(1, 2, INK), T('×', INK), T(w, INK), T('=', INK), T(m, INK)] },
      { name: '△ABD 求高 AD', hint: '斜邊是腰 AB', items: [sqr('AD', TL_JADE), T('=', INK), sqr(s, TL_TERRA), T('−', INK), sqr(m, INK), T('=', INK), T(N, INK), T('，AD =', INK), ...chainItems(N, TL_JADE)] },
      { name: '面積', hint: '½ × 底 × 高', items: [FR(1, 2, INK), T('×', INK), T(w, INK), T('×', INK), lenItem(N, TL_JADE), T('=', INK), ...rdItems([area], C)] }
    ];
    drawStepRows(ctx, numberRows(rows), 3, { top: 320, gap: 60, labX: 22, eqX: 170, size: 19, color: C });

    out.innerHTML = `${wbrEq(`AD = ${chainTex(N)}`)}，<wbr>${wbrEq(`\\text{面積} = \\frac{1}{2} \\times ${w} \\times ${lenTex(N)} = ${rdTex([area])}`)}`;
    fb.innerHTML = wrapFeedback(`腰是斜邊、底的一半 \\(${m}\\) 是股：高 \\(\\overline{AD} = ${lenTex(N)}\\)，面積 <b style="color:${C}">\\(${rdTex([area])}\\)</b>。`);
    typeset([out, fb]);
  }

  [ss, sw].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：正三角形的高 √3/2·a 與面積 √3/4·a²
   ========================================================================== */
function initEquiCanvas() {
  const cv = elById('canvas-equi');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('eq-a');
  const va = elById('eq-va');
  const mG = elById('eq-mode-group');
  const out = elById('eq-formula');
  const fb = elById('eq-feedback');
  const C = TL_TONE[7];
  let mode = 'derive';

  function draw() {
    const a = iv(sa);
    va.textContent = a;
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'derive' ? `邊長 ${a}：用畢氏定理推出高` : `邊長 ${a}：直接代公式`, C);

    const hv = a * Math.sqrt(3) / 2;
    const map = fitBox([[-a / 2, 0], [a / 2, 0], [0, hv]], { x: 110, y: 64, w: 320, h: 196 });
    const B = map.P([-a / 2, 0]), Cc = map.P([a / 2, 0]), A = map.P([0, hv]), D = map.P([0, 0]);
    const tri = [A, B, Cc], cen = centroid(tri);
    polyFill(ctx, tri, TL_GOLD, 0.2);
    seg(ctx, A, D, TL_JADE, 3.4, [7, 5]);
    rightMark(ctx, D, Cc, A, INK, 12);
    [[A, B], [B, Cc], [Cc, A]].forEach(([P, Q]) => tickMark(ctx, P, Q, 1, TL_TERRA));
    sideLabel(ctx, A, B, cen, [T(a, TL_TERRA)], TL_TERRA);
    sideLabel(ctx, A, Cc, cen, [T(a, TL_TERRA)], TL_TERRA);
    [[A, 'A'], [B, 'B'], [Cc, 'C']].forEach(([P, t]) => vLabel(ctx, cen, P, t, INK));
    textCenter(ctx, 'D', D[0] - 14, D[1] + 16, INK, fi(700, 16));

    const half = fracItem(a, 2, INK);
    const h = rdTerm(a, 2, 3), area = rdTerm(a * a, 4, 3);
    const rows = mode === 'derive'
      ? [
        { name: '取中點 D', hint: '正三角形也是等腰三角形', items: [T('BD =', INK), half] },
        { name: '△ABD 求高', hint: '斜邊是邊長', items: [sqr('AD', TL_JADE), T('=', INK), sqr(a, TL_TERRA), T('−', INK), PW(fracItem(a, 2, INK), 2, a % 2 === 1, INK), T('=', INK), fracItem(3 * a * a, 4, INK)] },
        { name: '高', hint: '開平方取正', items: [T('AD =', TL_JADE), ...rdItems([h], TL_JADE)] },
        { name: '面積', hint: '½ × 底 × 高', items: [FR(1, 2, INK), T('×', INK), T(a, TL_TERRA), T('×', INK), ...rdItems([h], TL_JADE), T('=', INK), ...rdItems([area], C)] }
      ]
      : [
        { name: '高的公式', hint: '高 = (√3 / 2) a', items: [T('高 =', TL_JADE), VF(rtItem(3, INK), T(2, INK), INK), T('×', INK), T(a, TL_TERRA), T('=', INK), ...rdItems([h], TL_JADE)] },
        { name: '面積的公式', hint: '面積 = (√3 / 4) a²', items: [T('面積 =', C), VF(rtItem(3, INK), T(4, INK), INK), T('×', INK), sqr(a, TL_TERRA), T('=', INK), ...rdItems([area], C)] }
      ];
    drawStepRows(ctx, numberRows(rows), rows.length, { top: 312, gap: mode === 'derive' ? 50 : 66, labX: 22, eqX: 160, size: 19, color: C });

    out.innerHTML = `${wbrEq(`\\text{高} = \\frac{\\sqrt{3}}{2} \\times ${a} = ${rdTex([h])}`)}，<wbr>${wbrEq(`\\text{面積} = \\frac{\\sqrt{3}}{4} \\times ${a}^2 = ${rdTex([area])}`)}`;
    fb.innerHTML = wrapFeedback(mode === 'derive'
      ? `中點把底邊切成兩段 \\(${fTex(a, 2)}\\)，\\(\\overline{AD}^2 = ${a}^2 - ${a % 2 === 0 ? `${a / 2}^2` : `\\left(${fTex(a, 2)}\\right)^2`} =${fTex(3 * a * a, 4)}\\)，高 <b style="color:${TL_JADE}">\\(${rdTex([h])}\\)</b>，正好是邊長的 \\(\\frac{\\sqrt{3}}{2}\\) 倍。`
      : `記住兩個公式：高 \\(= \\frac{\\sqrt{3}}{2}a\\)、面積 \\(= \\frac{\\sqrt{3}}{4}a^2\\)。面積的 \\(a\\) 要<b style="color:${C}">先平方</b>。`);
    typeset([out, fb]);
  }

  sa.addEventListener('input', draw);
  bindPickGroup(mG, 'data-eq-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：複合圖形——正方形與正三角形拼起來
   ========================================================================== */
function initCompCanvas() {
  const cv = elById('canvas-comp');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sn = elById('cp-n'), sm = elById('cp-m'), ss = elById('cp-s');
  const vn = elById('cp-vn'), vm = elById('cp-vm'), vs = elById('cp-vs');
  const rowN = elById('cp-row-n'), rowM = elById('cp-row-m');
  const mG = elById('cp-mode-group');
  const out = elById('cp-formula');
  const fb = elById('cp-feedback');
  const C = TL_TONE[8];
  const R3 = Math.sqrt(3);
  let mode = 'roof';

  // 正三角形：底邊 P→Q，往 dir 那一側長出去
  function eqTri(P, Q, side) {
    const mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2;
    const L = Math.hypot(Q[0] - P[0], Q[1] - P[1]);
    let [nx, ny] = unitVec(-(Q[1] - P[1]), Q[0] - P[0]);
    if (nx * (side[0] - mx) + ny * (side[1] - my) > 0) { nx = -nx; ny = -ny; }
    const A = [mx + nx * L * R3 / 2, my + ny * L * R3 / 2];
    polyFill(ctx, [P, Q, A], TL_TERRA, 0.26, { lw: 2 });
  }

  function draw() {
    // 屋頂模式：三角形個數不能超過正方形個數
    sm.max = iv(sn);
    if (iv(sm) > iv(sn)) sm.value = sn.value;
    const s = iv(ss);
    const n = mode === 'roof' ? iv(sn) : 1, m = mode === 'roof' ? iv(sm) : 4;
    vn.textContent = iv(sn); vm.textContent = iv(sm); vs.textContent = s;
    rowN.style.display = mode === 'roof' ? '' : 'none';
    rowM.style.display = mode === 'roof' ? '' : 'none';
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'roof' ? `${n} 個正方形、${m} 個正三角形，邊長都是 ${s}` : `星形：1 個正方形、4 個正三角形，邊長 ${s}`, C);

    if (mode === 'roof') {
      const L = Math.min(76, 460 / n), x0 = (cv.width - n * L) / 2, yb = 270;
      for (let i = 0; i < n; i++) polyFill(ctx, [[x0 + i * L, yb], [x0 + (i + 1) * L, yb], [x0 + (i + 1) * L, yb - L], [x0 + i * L, yb - L]], TL_COBALT, 0.24, { lw: 2 });
      for (let i = 0; i < m; i++) eqTri([x0 + i * L, yb - L], [x0 + (i + 1) * L, yb - L], [x0 + i * L + L / 2, yb]);
      sideLabel(ctx, [x0, yb], [x0 + L, yb], [x0 + L / 2, yb - L / 2], [T(s, INK)], INK);
    } else {
      const L = 92, cx = cv.width / 2, cy = 184;
      const sq = [[cx - L / 2, cy + L / 2], [cx + L / 2, cy + L / 2], [cx + L / 2, cy - L / 2], [cx - L / 2, cy - L / 2]];
      polyFill(ctx, sq, TL_COBALT, 0.24, { lw: 2 });
      for (let i = 0; i < 4; i++) eqTri(sq[i], sq[(i + 1) % 4], [cx, cy]);
      textCenter(ctx, String(s), cx, cy, INK, f(800, 17));
      textCenter(ctx, '（正方形的邊長）', cx, cy + 22, MUTED, f(600, 11.5));
    }
    swatch(ctx, 40, 312, TL_COBALT, `正方形 × ${n}：每個 ${s}² = ${s * s}`);
    swatch(ctx, 290, 312, TL_TERRA, `正三角形 × ${m}`);

    const sqA = n * s * s, triA = rdTerm(m * s * s, 4, 3), one = rdTerm(s * s, 4, 3);
    const total = rdSum([{ n: sqA, d: 1, r: 1 }, triA]);
    const rows = [
      { name: '正方形', hint: `${n} 個 × 邊長²`, items: [T(n, INK), T('×', INK), sqr(s, INK), T('=', INK), T(sqA, TL_COBALT)] },
      { name: '正三角形', hint: `${m} 個 × (√3 / 4) × 邊長²`, items: m === 0 ? [T('沒有三角形：0', MUTED)] : [T(m, INK), T('×', INK), VF(rtItem(3, INK), T(4, INK), INK), T('×', INK), sqr(s, INK), T('=', INK), ...rdItems([triA], TL_TERRA)] },
      { name: '合起來', hint: '整數和根號不能合併', items: [T('面積 =', C), ...rdItems(total, C)] }
    ];
    drawStepRows(ctx, numberRows(rows), 3, { top: 360, gap: 54, labX: 22, eqX: 170, size: 19, color: C });

    out.innerHTML = wbrEq(`${n} \\times ${s}^2 + ${m} \\times \\frac{\\sqrt{3}}{4} \\times ${s}^2 = ${rdTex(total)}`);
    fb.innerHTML = wrapFeedback(m === 0
      ? `沒有三角形，面積就是 \\(${sqA}\\)。`
      : `每個正三角形 \\(\\frac{\\sqrt{3}}{4} \\times ${s}^2 = ${rdTex([one])}\\)，\\(${m}\\) 個是 \\(${rdTex([triA])}\\)；加上正方形的 \\(${sqA}\\)，面積 <b style="color:${C}">\\(${rdTex(total)}\\)</b>（整數與 \\(\\sqrt{3}\\) 不是同類，不能再合併）。`);
    typeset([out, fb]);
  }

  [sn, sm, ss].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-cp-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：長方形的對角線——螢幕尺寸與一排正方形
   ========================================================================== */
function initDiagCanvas() {
  const cv = elById('canvas-diag');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sw = elById('dg-w'), sh = elById('dg-h'), sn = elById('dg-n'), ss = elById('dg-s');
  const vw = elById('dg-vw'), vh = elById('dg-vh'), vn = elById('dg-vn'), vs = elById('dg-vs');
  const rowsRect = [elById('dg-row-w'), elById('dg-row-h')];
  const rowsRib = [elById('dg-row-n'), elById('dg-row-s')];
  const mG = elById('dg-mode-group');
  const out = elById('dg-formula');
  const fb = elById('dg-feedback');
  const C = TL_TONE[9];
  let mode = 'rect';

  function drawRect() {
    const w = iv(sw), h = iv(sh), N = w * w + h * h;
    vw.textContent = w; vh.textContent = h;
    drawTitle(ctx, '螢幕尺寸 = 對角線的長', C);
    const map = fitBox([[0, 0], [w, 0], [w, h], [0, h]], { x: 90, y: 66, w: 360, h: 200 });
    const P0 = map.P([0, 0]), P1 = map.P([w, 0]), P2 = map.P([w, h]), P3 = map.P([0, h]);
    const box = [P0, P1, P2, P3], cen = centroid(box);
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(P3[0], P3[1], P1[0] - P0[0], P0[1] - P3[1]);
    ctx.restore();
    polyFill(ctx, box, INK, 0.05, { lw: 3 });
    polyFill(ctx, [P0, P1, P2], TL_GOLD, 0.16, { lw: 0 });
    seg(ctx, P0, P2, TL_TERRA, 4);
    rightMark(ctx, P1, P0, P2, INK);
    sideLabel(ctx, P0, P1, cen, [T(w, TL_COBALT)], TL_COBALT);
    sideLabel(ctx, P1, P2, cen, [T(h, TL_JADE)], TL_JADE);
    const mid = [(P0[0] + P2[0]) / 2, (P0[1] + P2[1]) / 2];
    drawExpr(ctx, [T('對角線', TL_TERRA)], mid[0] - 30, mid[1] - 16, 15, TL_TERRA);

    const rows = [
      { name: '切出直角三角形', hint: '長寬是股、對角線是斜邊', items: [T('兩股', INK), T(w, TL_COBALT), T('、', INK), T(h, TL_JADE)] },
      { name: '畢氏定理', hint: '對角線² = 長² + 寬²', items: [T('對角線² =', TL_TERRA), sqr(w, TL_COBALT), T('+', INK), sqr(h, TL_JADE), T('=', INK), T(N, TL_TERRA)] },
      { name: '對角線', hint: '開平方取正', items: [T('對角線 =', TL_TERRA), ...chainItems(N, TL_TERRA), T(`≈ ${ap(Math.sqrt(N))}`, MUTED)] }
    ];
    drawStepRows(ctx, numberRows(rows), 3, { top: 320, gap: 60, labX: 22, eqX: 180, size: 19, color: C });
    out.innerHTML = `${wbrEq(`\\text{對角線}^2 = ${w}^2 + ${h}^2 = ${N}`)}，<wbr>\\( \\text{對角線} = ${chainTex(N)} \\)`;
    fb.innerHTML = wrapFeedback(`長方形的一條對角線把它切成兩個直角三角形，長和寬是兩股：對角線 <b style="color:${C}">\\(${lenTex(N)} \\approx ${ap(Math.sqrt(N))}\\)</b>。`);
  }

  function drawRibbon() {
    const n = iv(sn), s = iv(ss);
    vn.textContent = n; vs.textContent = s;
    drawTitle(ctx, `${n} 個邊長 ${s} 的正方形連成一條帶子`, C);
    const L = Math.min(72, 440 / n), x0 = (cv.width - n * L) / 2, yb = 210;
    for (let i = 0; i < n; i++) {
      const sq = [[x0 + i * L, yb], [x0 + (i + 1) * L, yb], [x0 + (i + 1) * L, yb - L], [x0 + i * L, yb - L]];
      polyFill(ctx, sq, TL_COBALT, 0.18, { lw: 1.8 });
      // 對角線一上一下，接成一條鋸齒，總長是 n 條對角線
      if (i % 2 === 0) seg(ctx, sq[0], sq[2], TL_TERRA, 4);
      else seg(ctx, sq[3], sq[1], TL_TERRA, 4);
    }
    sideLabel(ctx, [x0, yb], [x0 + L, yb], [x0 + L / 2, yb - L / 2], [T(s, INK)], INK);
    sideLabel(ctx, [x0, yb - L], [x0, yb], [x0 + L / 2, yb - L / 2], [T(s, INK)], INK);

    const tot = rdTerm(n * s, 1, 2), one = rdTerm(s, 1, 2);
    const rows = [
      { name: '一個正方形', hint: '兩股都是邊長', items: [T('對角線² =', TL_TERRA), sqr(s, INK), T('+', INK), sqr(s, INK), T('=', INK), T(2 * s * s, INK), T('，對角線 =', TL_TERRA), ...rdItems([one], TL_TERRA)] },
      { name: `${n} 條接起來`, hint: `${n} 個一樣的對角線`, items: [T(n, INK), T('×', INK), ...rdItems([one], TL_TERRA), T('=', INK), ...rdItems([tot], C)] },
      { name: '近似值', hint: '√2 ≈ 1.414', items: [...rdItems([tot], C), T(`≈ ${n * s} × 1.414 ≈ ${ap(n * s * 1.414)}`, MUTED)] }
    ];
    drawStepRows(ctx, numberRows(rows), 3, { top: 300, gap: 62, labX: 22, eqX: 170, size: 19, color: C });
    out.innerHTML = `${wbrEq(`\\sqrt{${s}^2 + ${s}^2} = ${rdTex([one])}`)}，<wbr>${wbrEq(`${n} \\times ${rdTex([one])} = ${rdTex([tot])}`)}`;
    fb.innerHTML = wrapFeedback(`邊長 \\(${s}\\) 的正方形，對角線是 \\(${rdTex([one])}\\)（邊長的 \\(\\sqrt{2}\\) 倍）；\\(${n}\\) 條接起來是 <b style="color:${C}">\\(${rdTex([tot])} \\approx ${ap(n * s * Math.SQRT2)}\\)</b>。`);
  }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    rowsRect.forEach(rw => { rw.style.display = mode === 'rect' ? '' : 'none'; });
    rowsRib.forEach(rw => { rw.style.display = mode === 'ribbon' ? '' : 'none'; });
    if (mode === 'rect') drawRect();
    else drawRibbon();
    typeset([out, fb]);
  }

  [sw, sh, sn, ss].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-dg-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 11：梯子靠牆——移動前、移動後各是一個直角三角形
   滑桿以 10 公分為一格（內部用公寸算），畫面上一律寫公分
   ========================================================================== */
function initLadderCanvas() {
  const cv = elById('canvas-lad');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sL = elById('ld-L'), s1 = elById('ld-x1'), s2 = elById('ld-x2');
  const vL = elById('ld-vL'), v1 = elById('ld-vx1'), v2 = elById('ld-vx2');
  const out = elById('ld-formula');
  const fb = elById('ld-feedback');
  const C = TL_TONE[10];

  function draw() {
    const L = iv(sL);
    [s1, s2].forEach(s => { s.max = L - 1; if (iv(s) > L - 1) s.value = L - 1; });
    const x1 = iv(s1), x2 = iv(s2);
    const Lc = L * 10, x1c = x1 * 10, x2c = x2 * 10;
    vL.textContent = Lc; v1.textContent = x1c; v2.textContent = x2c;
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `梯長 ${Lc} 公分：梯腳由 ${x1c} 移到 ${x2c} 公分`, C);

    const N1 = Lc * Lc - x1c * x1c, N2 = Lc * Lc - x2c * x2c;
    const y1 = Math.sqrt(N1), y2 = Math.sqrt(N2);
    // 牆在左、地板在下；比例尺讓梯長剛好放得下
    const U = 236 / Lc, wx = 70, fy = 296;
    const P = (x, y) => [wx + x * U, fy - y * U];
    ctx.save();
    ctx.fillStyle = 'rgba(253, 186, 116, 0.08)';
    ctx.fillRect(wx - 26, 56, 26, fy - 56);
    ctx.restore();
    seg(ctx, [wx, 56], [wx, fy], INK, 3);
    seg(ctx, [wx - 26, fy], [wx + 420, fy], INK, 3);
    textCenter(ctx, '牆', wx - 13, fy - 16, MUTED, f(700, 13));

    // 移動前：實線；移動後：虛線
    const F1 = P(x1c, 0), T1 = P(0, y1), F2 = P(x2c, 0), T2 = P(0, y2);
    seg(ctx, F1, T1, TL_TERRA, 5);
    seg(ctx, F2, T2, TL_COBALT, 4, [9, 6]);
    rightMark(ctx, [wx, fy], [wx + 10, fy], [wx, fy - 10], INK, 12);
    drawDot(ctx, F1[0], F1[1], TL_TERRA, 5);
    drawDot(ctx, T1[0], T1[1], TL_TERRA, 5);
    drawDot(ctx, F2[0], F2[1], TL_COBALT, 5);
    drawDot(ctx, T2[0], T2[1], TL_COBALT, 5);
    swatch(ctx, 330, 82, TL_TERRA, '移動前');
    swatch(ctx, 330, 110, TL_COBALT, '移動後');

    const t1 = rdTerm(1, 1, N1), t2 = rdTerm(1, 1, N2);
    let diff = rdSum([t1, { n: -t2.n, d: t2.d, r: t2.r }]);
    if (rdVal(diff) < 0) diff = diff.map(t => ({ n: -t.n, d: t.d, r: t.r }));
    const dFoot = Math.abs(x1c - x2c);
    const rows = [
      { name: '移動前的梯頂', hint: '斜邊是梯子', items: [T('高 =', TL_TERRA), RT(SEQ([sqr(Lc, INK), T('−', INK), sqr(x1c, INK)], INK, 5), INK), T('=', INK), lenItem(N1, TL_TERRA)] },
      { name: '移動後的梯頂', hint: '梯子長度不變', items: [T('高 =', TL_COBALT), RT(SEQ([sqr(Lc, INK), T('−', INK), sqr(x2c, INK)], INK, 5), INK), T('=', INK), lenItem(N2, TL_COBALT)] },
      { name: '梯腳移動', hint: '地面上兩點相減', items: [T('|', INK), T(x1c, INK), T('−', INK), T(x2c, INK), T('|', INK), T('=', INK), T(dFoot, C), T('公分', MUTED)] },
      { name: '梯頂移動', hint: '牆上兩點相減', items: x1 === x2 ? [T('0（沒有移動）', MUTED)]
        : (diff.every(t => t.r === 1) ? [...rdItems(diff, C), T('公分', MUTED)] : [...rdItems(diff, C), T(`≈ ${ap(Math.abs(y1 - y2))} 公分`, MUTED)]) }
    ];
    drawStepRows(ctx, numberRows(rows), 4, { top: 336, gap: 52, labX: 22, eqX: 160, size: 18, color: C });

    const dir = x1 === x2 ? '梯子沒有移動。'
      : (x2 < x1 ? '梯腳往牆靠近，梯頂就往上升。' : '梯腳往外拉，梯頂就往下滑。');
    out.innerHTML = `${wbrEq(`\\sqrt{${Lc}^2 - ${x1c}^2} = ${lenTex(N1)}`)}，<wbr>${wbrEq(`\\sqrt{${Lc}^2 - ${x2c}^2} = ${lenTex(N2)}`)}`;
    fb.innerHTML = wrapFeedback(`${dir}梯子長度不變，前後各用一次畢氏定理：梯頂高由 \\(${lenTex(N1)}\\) 變成 \\(${lenTex(N2)}\\) 公分${x1 === x2 ? '' : `，移動 <b style="color:${C}">\\(${rdTex(diff)}\\)</b> 公分；梯腳移動 \\(${dFoot}\\) 公分`}。${x1 === x2 ? '' : '<br>兩段移動的距離通常不一樣，要分開算。'}`);
    typeset([out, fb]);
  }

  [sL, s1, s2].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 12：水平線、鉛垂線上兩點的距離——坐標差的絕對值
   ========================================================================== */
function initAxisCanvas() {
  const cv = elById('canvas-axis');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = elById('ax-p'), sq = elById('ax-q'), sr = elById('ax-r');
  const vp = elById('ax-vp'), vq = elById('ax-vq'), vr = elById('ax-vr');
  const lp = elById('ax-lp'), lq = elById('ax-lq'), lr = elById('ax-lr');
  const mG = elById('ax-mode-group');
  const out = elById('ax-formula');
  const fb = elById('ax-feedback');
  const C = TL_TONE[11];
  let mode = 'h';

  function draw() {
    const p = iv(sp), q = iv(sq), r = iv(sr);
    vp.textContent = p; vq.textContent = q; vr.textContent = r;
    lp.textContent = mode === 'h' ? 'A 的 x 坐標' : 'A 的 y 坐標';
    lq.textContent = mode === 'h' ? 'B 的 x 坐標' : 'B 的 y 坐標';
    lr.textContent = mode === 'h' ? '共同的 y 坐標' : '共同的 x 坐標';
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'h' ? '兩點在同一條水平線上' : '兩點在同一條鉛垂線上', C);

    const pl = drawPlane(ctx, { top: 58, unit: 26, min: -6, max: 6, labelEvery: 2, tickFont: f(600, 12.5) });
    const A = mode === 'h' ? [p, r] : [r, p];
    const B = mode === 'h' ? [q, r] : [r, q];
    const PA = [pl.px(A[0]), pl.py(A[1])], PB = [pl.px(B[0]), pl.py(B[1])];
    seg(ctx, PA, PB, TL_GOLD, 5);
    drawDot(ctx, PA[0], PA[1], TL_COBALT, 6);
    drawDot(ctx, PB[0], PB[1], TL_JADE, 6);
    // 標示往遠離另一點的方向放，兩點靠近（或重合）時才不會疊在一起
    const lab = (P, s, col, other, first) => {
      ctx.font = f(800, 13.5);
      const w = ctx.measureText(s).width + 10;
      if (mode === 'h') {
        const dir = P[0] === other[0] ? (first ? -1 : 1) : (P[0] > other[0] ? 1 : -1);
        tag(ctx, s, P[0] + dir * (w / 2 + 4), P[1] - 18 < 46 ? P[1] + 20 : P[1] - 18, col);
      } else {
        const dir = P[1] === other[1] ? (first ? -1 : 1) : (P[1] < other[1] ? -1 : 1);
        tag(ctx, s, P[0] + w / 2 + 10, Math.max(48, P[1] + dir * 14), col);
      }
    };
    lab(PA, `A(${mn(A[0])}, ${mn(A[1])})`, TL_COBALT, PB, true);
    lab(PB, `B(${mn(B[0])}, ${mn(B[1])})`, TL_JADE, PA, false);

    const d = Math.abs(p - q), xy = mode === 'h' ? 'x' : 'y', other = mode === 'h' ? 'y' : 'x';
    const rows = [
      { name: `${other} 坐標相同`, hint: mode === 'h' ? '兩點在同一條水平線上' : '兩點在同一條鉛垂線上', items: [T(`${other} 坐標都是`, INK), T(mn(r), C), T(`→ 用 ${xy} 坐標相減`, INK)] },
      { name: '坐標差的絕對值', hint: '距離不會是負的', items: [T('AB = |', INK), T(mn(p), TL_COBALT), T('−', INK), T(q < 0 ? `(${mn(q)})` : q, TL_JADE), T('| =', INK), T(d, C)] }
    ];
    drawStepRows(ctx, numberRows(rows), 2, { top: 420, gap: 56, labX: 22, eqX: 170, size: 19, color: C });

    out.innerHTML = wbrEq(`\\overline{AB} = |${p} - ${sub(q)}| = ${d}`);
    fb.innerHTML = wrapFeedback(p === q
      ? 'A、B 是同一個點，距離是 \\(0\\)。'
      : `兩點的 \\(${other}\\) 坐標相同，只差在 \\(${xy}\\) 坐標：<b style="color:${C}">\\(\\overline{AB} = |${p} - ${sub(q)}| = ${d}\\)</b>，在圖上數格子也是 \\(${d}\\) 格。`);
    typeset([out, fb]);
  }

  [sp, sq, sr].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-ax-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 13：任意兩點的距離公式——補一點 C 拉出直角三角形
   ========================================================================== */
function initDistCanvas() {
  const cv = elById('canvas-dist');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sx1 = elById('ds-x1'), sy1 = elById('ds-y1'), sx2 = elById('ds-x2'), sy2 = elById('ds-y2');
  const vx1 = elById('ds-vx1'), vy1 = elById('ds-vy1'), vx2 = elById('ds-vx2'), vy2 = elById('ds-vy2');
  const out = elById('ds-formula');
  const fb = elById('ds-feedback');
  const C = TL_TONE[12];

  function draw() {
    const x1 = iv(sx1), y1 = iv(sy1), x2 = iv(sx2), y2 = iv(sy2);
    vx1.textContent = x1; vy1.textContent = y1; vx2.textContent = x2; vy2.textContent = y2;
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '補一點 C，拉出直角三角形', C);

    const pl = drawPlane(ctx, { top: 58, unit: 26, min: -6, max: 6, labelEvery: 2, tickFont: f(600, 12.5) });
    const PA = [pl.px(x1), pl.py(y1)], PB = [pl.px(x2), pl.py(y2)], PC = [pl.px(x2), pl.py(y1)];
    const dx = Math.abs(x1 - x2), dy = Math.abs(y1 - y2), N = dx * dx + dy * dy;
    if (dx && dy) {
      polyFill(ctx, [PA, PB, PC], TL_GOLD, 0.14, { lw: 0 });
      seg(ctx, PA, PC, TL_COBALT, 3, [7, 5]);
      seg(ctx, PC, PB, TL_JADE, 3, [7, 5]);
      rightMark(ctx, PC, PA, PB, INK, 11);
      drawDot(ctx, PC[0], PC[1], INK, 5);
    }
    seg(ctx, PA, PB, TL_TERRA, 4);
    drawDot(ctx, PA[0], PA[1], TL_TERRA, 6);
    drawDot(ctx, PB[0], PB[1], TL_TERRA, 6);
    const cen = centroid([PA, PB, PC]);
    // 標示從三角形重心往外推；太靠上緣就改放到點的下方，免得壓到標題
    const put = (P, s, col) => {
      const u = unitVec(P[0] - cen[0], P[1] - cen[1]);
      let y = P[1] + (u[1] < 0 ? -18 : 18);
      if (y < 46) y = P[1] + 18;
      tag(ctx, s, P[0] + u[0] * 34, y, col);
    };
    put(PA, `A(${mn(x1)}, ${mn(y1)})`, TL_TERRA);
    put(PB, `B(${mn(x2)}, ${mn(y2)})`, TL_TERRA);
    if (dx && dy) put(PC, `C(${mn(x2)}, ${mn(y1)})`, INK);

    const par = v => (v < 0 ? `(${mn(v)})` : String(v));
    const rows = [
      { name: '補一點 C', hint: '過 A 的水平線、過 B 的鉛垂線', items: [T(`C(${mn(x2)}, ${mn(y1)})`, INK)] },
      { name: 'AC：x 坐標差', hint: '水平的那一股', items: [T('|', INK), T(mn(x1), INK), T('−', INK), T(par(x2), INK), T('| =', INK), T(dx, TL_COBALT)] },
      { name: 'BC：y 坐標差', hint: '鉛垂的那一股', items: [T('|', INK), T(mn(y1), INK), T('−', INK), T(par(y2), INK), T('| =', INK), T(dy, TL_JADE)] },
      { name: '畢氏定理', hint: 'AB 是斜邊', items: [T('AB =', TL_TERRA), RT(SEQ([sqr(dx, TL_COBALT), T('+', INK), sqr(dy, TL_JADE)], INK, 5), INK), T('=', INK), ...chainItems(N, TL_TERRA)] }
    ];
    drawStepRows(ctx, numberRows(rows), 4, { top: 432, gap: 48, labX: 22, eqX: 180, size: 18, color: C });

    // 整條根號不能斷行，窄螢幕放不下；改成先寫平方、再開根號，加號處才斷得開
    out.innerHTML = `${wbrEq(`\\overline{AB}^2 = (${x1} - ${sub(x2)})^2 + (${y1} - ${sub(y2)})^2 = ${N}`)}，<wbr>\\( \\overline{AB} = ${chainTex(N)} \\)`;
    const wrong = (x1 - y1) * (x1 - y1) + (x2 - y2) * (x2 - y2);
    let msg;
    if (!dx && !dy) msg = 'A、B 是同一個點，距離是 \\(0\\)。';
    else if (!dx || !dy) msg = `兩點在同一條${dx ? '水平' : '鉛垂'}線上，C 就是 B，三角形壓成一條線；公式照樣能用：<b style="color:${C}">\\(\\overline{AB} = ${lenTex(N)}\\)</b>。`;
    else msg = `\\(\\overline{AC} = ${dx}\\)、\\(\\overline{BC} = ${dy}\\) 是兩股，<b style="color:${C}">\\(\\overline{AB} = ${lenTex(N)}\\)</b>。`;
    if (wrong !== N && (dx || dy)) msg += `<br><span style="color:${TL_ROSE}">✗ 把同一點的 \\(x\\)、\\(y\\) 相減：${wbrEq(`(${x1} - ${sub(y1)})^2 + (${x2} - ${sub(y2)})^2 = ${wrong}`)}，開根號得 \\(${lenTex(wrong)}\\)，不是 \\(\\overline{AB}\\)。</span>`;
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  [sx1, sy1, sx2, sy2].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}
