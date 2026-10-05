/* ==========================================================================
   4-1-1（第四冊 1-1）等差數列 — 互動 Canvas 與隨堂評量
   畫風：Art Deco 復古戲院海報風（小映、阿幕），第 1 章三節共用。
   配色：戲院金 AD_GOLD、孔雀藍 AD_TEAL、奶油 AD_CREAM；
   玫瑰 AD_ROSE 是「不符合、錯誤」，翡翠綠 AD_JADE 是「符合、答案」。

   共用工具在 ../math-canvas.js（T／IT／SEQ／GRP／FR／VF／measure／drawExpr／
   drawPanel／drawTitle／drawStepRows／wbrEq／numLine／textCenter…），本檔只放
   本節的色票（AD_ 前綴，共用檔與其他節都沒有）、有理數小工具與 10 個互動。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initTermsCanvas();
  initPatternCanvas();
  initGuessCanvas();
  initCheckCanvas();
  initListCanvas();
  initFillCanvas();
  initNthCanvas();
  initCountCanvas();
  initShapeCanvas();
  initMiddleCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具（AD_ = Art Deco）
   ========================================================================== */

const AD_GOLD = '#fcd34d';
const AD_TEAL = '#5eead4';
const AD_CREAM = '#fef3c7';
const AD_ROSE = '#fb7185';
const AD_JADE = '#6ee7b7';
const AD_SKY = '#7dd3fc';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const AD_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264'];

function adEl(id) {
  return document.getElementById(id);
}

function adIv(el) {
  return parseInt(el.value, 10);
}

// canvas 上的減號換成數學減號 −，投影時比連字號清楚
function adMn(s) {
  return String(s).replace(/-/g, '−');
}

// 純文字句子裡的下標（textCenter 用）：a₁₂、aₙ。算式元件一律用共用檔的 SB
const AD_SUBS = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  'n': 'ₙ', '+': '₊', '-': '₋', '−': '₋'
};

function adSubStr(s) {
  return String(s).split('').map(ch => AD_SUBS[ch] || ch).join('');
}

function adA(idx, color, base) {
  return SEQ([IT(base || 'a', color), SB(idx, color)], color, 0);
}

// 一列推導（drawStepRows 的列）
function adRow(name, hint, items, color) {
  return { name, hint, items, color };
}

// 數列的 HTML：每一項各自一段 \( \)，窄螢幕才換得了行（開發約束 24）
function adSeqHtml(texArr) {
  return texArr.map(t => `\\(${t}\\)`).join(', ');
}

/* --------------------------------------------------------------------------
   有理數：一律以化成最簡的 [分子, 分母] 表示，分母為正（q* 工具在 math-canvas.js）
   -------------------------------------------------------------------------- */
// 代入用：負數加括號
function adQPar(q) {
  return q[0] < 0 ? `\\left(${qTex(q)}\\right)` : qTex(q);
}

// 整數代入：負數加括號（canvas 元件）
function adPar(v, color) {
  return v < 0 ? GRP([T(adMn(v), color)], '()', color) : T(String(v), color);
}

/* --------------------------------------------------------------------------
   含文字的項：c·a + q（重點 6 的文字模式用；c = 0 就是一般的數）
   -------------------------------------------------------------------------- */
function adLv(c, q) {
  return { c, q: reduce(q[0], q[1]) };
}

function adLvAdd(v, q) {
  return adLv(v.c, qAdd(v.q, q));
}

function adLvTex(v) {
  if (!v.c) return qTex(v.q);
  const head = v.c === 1 ? 'a' : `${v.c}a`;
  if (v.q[0] === 0) return head;
  return `${head} ${v.q[0] < 0 ? '-' : '+'} ${qTex([Math.abs(v.q[0]), v.q[1]])}`;
}

// 被減的那一項：含文字或負數時加括號
function adLvParTex(v) {
  if (v.c) return v.q[0] === 0 ? adLvTex(v) : `(${adLvTex(v)})`;
  return adQPar(v.q);
}

function adLvItem(v, color) {
  if (!v.c) return qIt(v.q, color);
  const out = [v.c === 1 ? IT('a', color) : SEQ([T(v.c, color), IT('a', color)], color, 1)];
  if (v.q[0] !== 0) {
    out.push(T(v.q[0] < 0 ? '−' : '+', color));
    out.push(qIt([Math.abs(v.q[0]), v.q[1]], color));
  }
  return SEQ(out, color, 6);
}

function adLvParItem(v, color) {
  if (v.c) return v.q[0] === 0 ? adLvItem(v, color) : GRP([adLvItem(v, color)], '()', color);
  return qOpIt(v.q, color);
}

/* --------------------------------------------------------------------------
   繪圖：Art Deco 號碼牌、跳躍弧線、大括號
   -------------------------------------------------------------------------- */

// 一張號碼牌：外框加一圈細內框（戲院票卡的雙框）
function adCard(ctx, cx, cy, w, h, color, opts) {
  const o = opts || {};
  ctx.save();
  roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 6);
  ctx.globalAlpha = o.alpha == null ? 0.14 : o.alpha;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = o.dim ? 0.45 : 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = o.lw || 2;
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = o.dim ? 0.2 : 0.45;
  ctx.lineWidth = 1;
  roundRect(ctx, cx - w / 2 + 4, cy - h / 2 + 4, w - 8, h - 8, 4);
  ctx.stroke();
  ctx.restore();
}

// 牌子裡置中的元件（太寬時自動縮字級）
function adCardText(ctx, item, cx, cy, w, size, color) {
  drawExpr(ctx, [item], cx, cy, size || 20, color || INK, { maxW: w - 10, gap: 4 });
}

// 實心三角形箭頭（共用檔的 drawArrow 太細，投影看不見，開發約束 34）
function adHead(ctx, x, y, ang, color, size) {
  const s = size || 10;
  const w = s * 0.55;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - s * Math.cos(ang) + w * Math.sin(ang), y - s * Math.sin(ang) - w * Math.cos(ang));
  ctx.lineTo(x - s * Math.cos(ang) - w * Math.sin(ang), y - s * Math.sin(ang) + w * Math.cos(ang));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 由 x1 跳到 x2 的弧線（y 是弧線兩端，h 是弧高），labelItems 寫在弧頂上方
function adHop(ctx, x1, x2, y, h, color, labelItems, labelSize) {
  const mx = (x1 + x2) / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.quadraticCurveTo(mx, y - 2 * h, x2, y);
  ctx.stroke();
  ctx.restore();
  adHead(ctx, x2, y, Math.atan2(2 * h, x2 - mx), color, 10);
  if (labelItems) {
    drawExpr(ctx, labelItems, mx, y - h - 13, labelSize || 15, color, { gap: 2 });
  }
}

// 橫向大括號（開口朝上，尖端朝下）
function adBraceH(ctx, x1, x2, y, color) {
  const mx = (x1 + x2) / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y - 8);
  ctx.quadraticCurveTo(x1, y, x1 + 10, y);
  ctx.lineTo(mx - 10, y);
  ctx.quadraticCurveTo(mx, y, mx, y + 8);
  ctx.quadraticCurveTo(mx, y, mx + 10, y);
  ctx.lineTo(x2 - 10, y);
  ctx.quadraticCurveTo(x2, y, x2, y - 8);
  ctx.stroke();
  ctx.restore();
}

function adLine(ctx, x1, y1, x2, y2, color, width, dash) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 2;
  ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

// 數線刻度：讓整條數線的刻度數量不超過 maxTicks
function adScale(vals, maxTicks) {
  const lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
  const steps = [1, 2, 5, 10, 20];
  let t = 1;
  for (let i = 0; i < steps.length; i++) {
    t = steps[i];
    if (Math.ceil(hi / t) - Math.floor(lo / t) <= (maxTicks || 12)) break;
  }
  let a = Math.floor(lo / t) * t, b = Math.ceil(hi / t) * t;
  if (a === b) { a -= t; b += t; }
  return { min: a, max: b, tick: t };
}

/* --------------------------------------------------------------------------
   步驟按鈕：上一步／下一步／全部顯示
   -------------------------------------------------------------------------- */
function adBindSteps(prefix, getN, state, draw) {
  const prev = adEl(prefix + '-prev'), next = adEl(prefix + '-next'), all = adEl(prefix + '-all');
  if (prev) prev.addEventListener('click', () => { state.step -= 1; draw(); });
  if (next) next.addEventListener('click', () => { state.step += 1; draw(); });
  if (all) all.addEventListener('click', () => { state.step = getN(); draw(); });
}

function adSyncSteps(prefix, step, n) {
  const prev = adEl(prefix + '-prev'), next = adEl(prefix + '-next'), all = adEl(prefix + '-all');
  const counter = adEl(prefix + '-step');
  if (counter) counter.textContent = `${step} / ${n}`;
  if (prev) prev.disabled = (step <= 1);
  if (next) next.disabled = (step >= n);
  if (all) all.disabled = (step >= n);
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第四冊 1-1 的 20 題正解
  // 正解字母分布：A 5 題、B 5 題、C 5 題、D 5 題（開發約束 36）
  const answers = {
    '1-1-1': 'B',    // 12, 5, 9, 20, 3, 17, 8：項數 7、a₃ = 9
    '1-1-2': 'D',    // −6, 11, 0, 25, −13, 4：a₂ + a₅ = −2
    '1-1-3': 'A',    // 2, 6, 18, □, 162：×3 → 54
    '1-1-4': 'C',    // 4, 7, 12, 19, 28, □：差 3, 5, 7, 9, 11 → 39
    '1-1-5': 'D',    // 1, 3 之後：+2 或 ×3 都符合，無法確定
    '1-1-6': 'C',    // 5, 12, 19, 26 之後不一定是 33
    '1-1-7': 'A',    // −11, −4, 3, 10 是等差數列（公差 7，超出所有滑桿範圍）
    '1-1-8': 'B',    // 7/2, 3, 5/2, 2 的公差 −1/2
    '1-1-9': 'C',    // 首項 −12、公差 7 → a₄ = 9
    '1-1-10': 'A',   // 首項 15、公差 −4 → 15, 11, 7, 3, −1
    '1-1-11': 'D',   // □, 13, 8, □ → 18 與 3
    '1-1-12': 'B',   // □, 2a + 1, 2a + 5, □ → 2a − 3 與 2a + 9
    '1-1-13': 'A',   // 首項 18、公差 −5 → a₁₅ = −52
    '1-1-14': 'C',   // 25, 22, 19, … → a₄₀ = −92
    '1-1-15': 'B',   // 4, 11, 18, …, 151 → 22 項
    '1-1-16': 'D',   // 50 到 300 的 7 的倍數 → 35 個
    '1-1-17': 'C',   // 正五邊形 5, 9, 13, … → 圖 12 用 49 根
    '1-1-18': 'D',   // 101 = 5 + (n − 1) × 4 → 圖 25
    '1-1-19': 'B',   // −23 與 41 的等差中項 9
    '1-1-20': 'A'    // a₉ + a₁₃ = −26 → a₁₁ = −13
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
   重點 1：數列與名詞——項、項數、首項 a₁、第 n 項 aₙ、末項
   ========================================================================== */
const AD_TERM_SEQS = {
  draw: { title: '售票口抽籤，依序抽出的座位號碼', vals: [14, 3, 27, 9, 30, 16, 21, 5], rule: false },
  row: { title: '從第 1 排往後，每一排的座位數', vals: [16, 18, 20, 22, 24, 26, 28, 30], rule: true }
};

function initTermsCanvas() {
  const cv = adEl('canvas-terms');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sn = adEl('tm-n'), sk = adEl('tm-k');
  const vn = adEl('tm-vn'), vk = adEl('tm-vk');
  const g = adEl('tm-seq-group');
  const out = adEl('tm-formula');
  const fb = adEl('tm-feedback');
  const C = AD_TONE[0];
  let key = 'draw';

  function draw() {
    const n = adIv(sn);
    sk.max = n;
    if (adIv(sk) > n) sk.value = n;
    const k = adIv(sk);
    vn.textContent = n; vk.textContent = k;
    const S = AD_TERM_SEQS[key];
    const vals = S.vals.slice(0, n);
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, S.title, C);

    const sp = Math.min(64, 500 / n), cw = sp - 10, x0 = W / 2 - sp * (n - 1) / 2, cy = 124;
    textCenter(ctx, '首項', x0, cy - 44, AD_TEAL, f(800, 14));
    textCenter(ctx, '末項', x0 + (n - 1) * sp, cy - 44, AD_TEAL, f(800, 14));
    vals.forEach((v, i) => {
      const x = x0 + i * sp;
      const on = (i === k - 1);
      adCard(ctx, x, cy, cw, 52, on ? AD_GOLD : AD_TEAL, { alpha: on ? 0.3 : 0.1, lw: on ? 3.2 : 2 });
      textCenter(ctx, String(v), x, cy, on ? AD_CREAM : INK, f(800, 20));
      subLabel(ctx, 'a', String(i + 1), x, cy + 46, on ? AD_GOLD : MUTED, 18);
    });

    const by = cy + 74;
    adBraceH(ctx, x0 - cw / 2, x0 + (n - 1) * sp + cw / 2, by, MUTED);
    textCenter(ctx, `項數 = ${n}（共 ${n} 個數）`, W / 2, by + 26, INK, f(800, 15));

    // 三個名詞
    drawPanel(ctx, 40, 252, W - 80, 156, C, 0.07);
    const rowsY = [282, 330, 378];
    const lab = [['首項', '1', vals[0]], [`第 ${k} 項`, String(k), vals[k - 1]], [`末項（第 ${n} 項）`, String(n), vals[n - 1]]];
    lab.forEach((L, i) => {
      const col = i === 1 ? AD_GOLD : INK;
      textLeft(ctx, L[0], 66, rowsY[i], i === 1 ? AD_GOLD : AD_TEAL, f(800, 16));
      drawExpr(ctx, [adA(L[1], col), T('=', col), T(adMn(L[2]), col)], 0, rowsY[i], 22, col, { left: 280, gap: 8 });
    });
    textCenter(ctx, `a${adSubStr(k)} 的 ${k} 是「第幾項」，不是 a × ${k}`, W / 2, 436, AD_ROSE, f(700, 14));

    out.innerHTML = `首項 \\(a_1 = ${vals[0]}\\)，第 ${k} 項 \\(a_{${k}} = ${vals[k - 1]}\\)，末項 \\(a_{${n}} = ${vals[n - 1]}\\)`;
    fb.innerHTML = wrapFeedback((S.rule
      ? `每一排比前一排多 \\(2\\) 個座位，這個數列有規律。`
      : `抽籤的號碼沒有規律，但它照樣是一個數列：只要把數排成一列、以逗號分開就是數列。`)
      + `<br>下標 \\(${k}\\) 說的是「第幾個」，\\(a_{${k}}\\) 本身的值是 \\(${vals[k - 1]}\\)；它不是 \\(a \\times ${k}\\)。`);
    typeset([out, fb]);
  }

  [sn, sk].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-tm-seq', v => { key = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 2：找出數列的規律，求空格
   ========================================================================== */
function adPatternTerms(kind, p) {
  const out = [];
  for (let k = 1; k <= 6; k++) {
    if (kind === 'add') out.push(1 + (k - 1) * (p + 1));
    else if (kind === 'mul') out.push(ipow(p + 1, k));
    else if (kind === 'alt') out.push((k % 2 ? 1 : -1) * k * p);
    else out.push(p * k * k);
  }
  return out;
}

function initPatternCanvas() {
  const cv = adEl('canvas-pattern');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = adEl('pt-p'), sb = adEl('pt-b');
  const vp = adEl('pt-vp'), vb = adEl('pt-vb');
  const g = adEl('pt-kind-group');
  const btnShow = adEl('pt-show');
  const out = adEl('pt-formula');
  const fb = adEl('pt-feedback');
  const C = AD_TONE[1];
  let kind = 'add';
  let shown = false;

  function ruleText(p) {
    if (kind === 'add') return `每一項都比前一項多 ${p + 1}`;
    if (kind === 'mul') return `每一項都是前一項的 ${p + 1} 倍`;
    if (kind === 'alt') return `絕對值是 ${p} 的 1, 2, 3… 倍；奇數項為正、偶數項為負`;
    return `第 k 項是 ${p} × k²`;
  }

  function draw() {
    const p = adIv(sp), b = adIv(sb);
    vp.textContent = p; vb.textContent = b;
    const vals = adPatternTerms(kind, p);
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '觀察規律，空格要填什麼？', C);

    const step = 82, cw = 70, x0 = W / 2 - step * 2.5, cy = 130;
    // 相鄰兩項之間的關係（加法、乘法才畫弧線）
    if (kind === 'add' || kind === 'mul') {
      for (let i = 0; i < 5; i++) {
        const touch = (i === b - 2 || i === b - 1) && !shown;
        const lab = touch ? [T('?', AD_GOLD)] : [T(kind === 'add' ? `+${p + 1}` : `×${p + 1}`, C)];
        adHop(ctx, x0 + i * step + 10, x0 + (i + 1) * step - 10, cy - 32, 16, touch ? AD_GOLD : C, lab, 15);
      }
    }
    vals.forEach((v, i) => {
      const x = x0 + i * step;
      const blank = (i === b - 1);
      if (blank && !shown) {
        adCard(ctx, x, cy, cw, 52, AD_GOLD, { alpha: 0.1, lw: 2.4, dash: [6, 4] });
        textCenter(ctx, '?', x, cy, AD_GOLD, f(900, 24));
      } else {
        adCard(ctx, x, cy, cw, 52, blank ? AD_JADE : C, { alpha: blank ? 0.26 : 0.1, lw: blank ? 3 : 2 });
        adCardText(ctx, T(adMn(v), blank ? AD_CREAM : INK), x, cy, cw, 20);
      }
      // 每一項底下：第 k 項的寫法
      let sub = '';
      if (kind === 'alt') sub = `${i % 2 ? '−' : '+'}${i + 1}×${p}`;
      else if (kind === 'sq') sub = `${p}×${i + 1}²`;
      else if (kind === 'mul') sub = `${p + 1}^${i + 1}`;
      if (sub) {
        const hide = blank && !shown;
        if (kind === 'mul') {
          drawExpr(ctx, [hide ? T('?', AD_GOLD) : PW(T(p + 1, MUTED), i + 1, false, MUTED)], x, cy + 44, 15, MUTED, {});
        } else {
          textCenter(ctx, hide ? '?' : sub, x, cy + 44, hide ? AD_GOLD : MUTED, f(700, 14));
        }
      }
      subLabel(ctx, 'a', String(i + 1), x, cy + 72, blank ? AD_GOLD : DIM, 15);
    });

    drawPanel(ctx, 30, 238, W - 60, 130, C, 0.07);
    textCenter(ctx, shown ? `規律：${ruleText(p)}` : '先比較相鄰兩項：差一樣嗎？倍數一樣嗎？正負號呢？', W / 2, 266, shown ? C : MUTED, f(800, 15));
    const v = vals[b - 1];
    let items;
    if (!shown) {
      items = [T('空格', AD_GOLD), T('=', AD_GOLD), T('?', AD_GOLD)];
    } else if (kind === 'add') {
      items = [T('空格', AD_JADE), T('=', AD_JADE), T(adMn(vals[b - 2]), AD_JADE), T('+', AD_JADE), T(p + 1, AD_JADE), T('=', AD_JADE), T(adMn(v), AD_JADE)];
    } else if (kind === 'mul') {
      items = [T('空格', AD_JADE), T('=', AD_JADE), T(vals[b - 2], AD_JADE), T('×', AD_JADE), T(p + 1, AD_JADE), T('=', AD_JADE), T(v, AD_JADE)];
    } else if (kind === 'alt') {
      items = [T('空格', AD_JADE), T('=', AD_JADE), T(b % 2 ? '+' : '−', AD_JADE), SEQ([T(`${b} × ${p}`, AD_JADE)], AD_JADE, 0), T('=', AD_JADE), T(adMn(v), AD_JADE)];
    } else {
      items = [T('空格', AD_JADE), T('=', AD_JADE), T(`${p} ×`, AD_JADE), PW(T(b, AD_JADE), 2, false, AD_JADE), T('=', AD_JADE), T(v, AD_JADE)];
    }
    drawExpr(ctx, items, W / 2, 318, 22, AD_JADE, { gap: 8, maxW: W - 90 });
    textCenter(ctx, shown ? '再用規律檢查空格前後的項，確認每一組都對得上' : '按「揭曉空格」對答案', W / 2, 395, DIM, f(700, 13));

    btnShow.textContent = shown ? '蓋回去' : '揭曉空格';
    out.innerHTML = adSeqHtml(vals.map((x, i) => (i === b - 1 && !shown) ? '\\square' : String(x)));
    fb.innerHTML = wrapFeedback(shown
      ? `${ruleText(p).replace('k²', '\\(k^2\\)')}，所以第 \\(${b}\\) 項是 \\(${v}\\)。`
      : `先猜，再按「揭曉空格」。找規律時，可以看相鄰兩項的<b>差</b>、<b>倍數</b>、<b>正負號</b>，或每一項和它的<b>位置</b>有什麼關係。`);
    typeset([out, fb]);
  }

  [sp, sb].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-pt-kind', v => { kind = v; draw(); });
  btnShow.addEventListener('click', () => { shown = !shown; draw(); });
  draw();
}

/* ==========================================================================
   重點 3：只看前幾項，規律不一定唯一
   ========================================================================== */
const AD_GUESS = {
  a: {
    title: '前三項是 1, 2, 4，第 4 項是多少？',
    rules: [
      { name: '看法一：差是 +1、+2、+3、…', vals: [1, 2, 4, 7, 11, 16] },
      { name: '看法二：每次都 ×2', vals: [1, 2, 4, 8, 16, 32] }
    ]
  },
  b: {
    title: '前三項是 2, 3, 5，接下來呢？',
    rules: [
      { name: '看法一：差是 +1、+2、+3、…', vals: [2, 3, 5, 8, 12, 17] },
      { name: '看法二：前兩項相加', vals: [2, 3, 5, 8, 13, 21] }
    ]
  }
};

function initGuessCanvas() {
  const cv = adEl('canvas-guess');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = adEl('gs-k'), vk = adEl('gs-vk');
  const gc = adEl('gs-case-group'), gt = adEl('gs-truth-group');
  const out = adEl('gs-formula');
  const fb = adEl('gs-feedback');
  const C = AD_TONE[2];
  let cs = 'a', truth = 0;

  function draw() {
    const k = adIv(sk);
    vk.textContent = k;
    const S = AD_GUESS[cs];
    const real = S.rules[truth].vals;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, S.title, C);

    const step = 80, cw = 66, x0 = W / 2 - step * 2.5;
    textLeft(ctx, `已公開的前 ${k} 項`, 34, 60, AD_GOLD, f(800, 15));
    real.forEach((v, i) => {
      const x = x0 + i * step;
      if (i < k) {
        adCard(ctx, x, 98, cw, 46, AD_GOLD, { alpha: 0.22, lw: 2.6 });
        textCenter(ctx, String(v), x, 98, AD_CREAM, f(800, 20));
      } else {
        adCard(ctx, x, 98, cw, 46, DIM, { alpha: 0.05, dash: [5, 4], dim: true });
        textCenter(ctx, '?', x, 98, DIM, f(800, 20));
      }
    });

    const fits = S.rules.map(r => r.vals.slice(0, k).every((v, i) => v === real[i]));
    S.rules.forEach((r, ri) => {
      const y0 = 160 + ri * 112;
      const ok = fits[ri];
      textLeft(ctx, r.name, 34, y0, ok ? AD_TEAL : AD_ROSE, f(800, 15));
      drawChip(ctx, W - 130, y0 - 14, 96, 28, ok ? '仍然符合' : '被排除', ok ? AD_JADE : AD_ROSE, ok ? 'rgba(110,231,183,0.12)' : 'rgba(251,113,133,0.12)');
      r.vals.forEach((v, i) => {
        const x = x0 + i * step;
        const cy = y0 + 46;
        if (i < k) {
          const same = v === real[i];
          adCard(ctx, x, cy, cw, 44, same ? AD_JADE : AD_ROSE, { alpha: 0.16, lw: 2.2 });
          textCenter(ctx, String(v), x, cy, same ? AD_CREAM : AD_ROSE, f(800, 19));
          if (!same) textCenter(ctx, '✗', x + cw / 2 - 6, cy - 22, AD_ROSE, f(900, 14));
        } else {
          adCard(ctx, x, cy, cw, 44, ok ? C : DIM, { alpha: 0.05, dim: true, dash: [4, 4] });
          textCenter(ctx, String(v), x, cy, ok ? C : DIM, f(700, 17));
        }
      });
    });

    const both = fits[0] && fits[1];
    drawPanel(ctx, 30, 392, W - 60, 64, both ? AD_GOLD : AD_JADE, 0.08);
    textCenter(ctx, both ? `前 ${k} 項兩種看法都符合，下一項是 ${S.rules[0].vals[k]} 還是 ${S.rules[1].vals[k]}？還不能確定`
      : `第 ${k} 項之前，只有${truth === 0 ? '看法一' : '看法二'}一路符合`, W / 2, 414, both ? AD_GOLD : AD_JADE, f(800, 15));
    textCenter(ctx, '只憑有限幾項，可能看出不同的規律', W / 2, 438, MUTED, f(700, 13));

    const nextTxt = k < 6 ? `，看法一的下一項 \\(${S.rules[0].vals[k]}\\)、看法二的下一項 \\(${S.rules[1].vals[k]}\\)` : '';
    out.innerHTML = `公開：${adSeqHtml(real.slice(0, k).map(String))}${nextTxt}`;
    fb.innerHTML = wrapFeedback(both
      ? `前 \\(${k}\\) 項兩種看法都說得通，光看這 \\(${k}\\) 項沒辦法決定下一項。題目要明確告訴你規則（例如「這是等差數列」），後面的項才能確定。`
      : `多公開一項，${truth === 0 ? '看法二' : '看法一'}就對不上了。可是在它被排除之前，誰也不能只憑前幾項就斷言規律。`);
    typeset([out, fb]);
  }

  sk.addEventListener('input', draw);
  bindPickGroup(gc, 'data-gs-case', v => { cs = v; draw(); });
  bindPickGroup(gt, 'data-gs-truth', v => { truth = parseInt(v, 10); draw(); });
  draw();
}

/* ==========================================================================
   重點 4：等差數列與公差——後項減前項，每一組都要一樣
   ========================================================================== */
function initCheckCanvas() {
  const cv = adEl('canvas-check');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = adEl('ck-a1'), sd = adEl('ck-d'), se = adEl('ck-e');
  const va = adEl('ck-va1'), vd = adEl('ck-vd'), ve = adEl('ck-ve');
  const out = adEl('ck-formula');
  const fb = adEl('ck-feedback');
  const C = AD_TONE[3];

  function draw() {
    const a1 = adIv(sa), d = adIv(sd), e = adIv(se);
    va.textContent = a1; vd.textContent = d; ve.textContent = e;
    const t = [];
    for (let i = 0; i < 6; i++) t.push(a1 + i * d + (i === 3 ? e : 0));
    const diffs = [];
    for (let i = 0; i < 5; i++) diffs.push(t[i + 1] - t[i]);
    const isAP = diffs.every(x => x === diffs[0]);
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '每一組相鄰兩項：後項 − 前項', C);

    const step = 82, cw = 66, x0 = W / 2 - step * 2.5;
    t.forEach((v, i) => {
      const x = x0 + i * step;
      adCard(ctx, x, 90, cw, 48, i === 3 && e !== 0 ? AD_GOLD : AD_TEAL, { alpha: 0.12, lw: i === 3 && e !== 0 ? 3 : 2 });
      textCenter(ctx, adMn(v), x, 90, INK, f(800, 20));
      subLabel(ctx, 'a', String(i + 1), x, 130, DIM, 15);
    });
    diffs.forEach((df, i) => {
      const x = x0 + (i + 0.5) * step;
      const ok = df === diffs[0] && (isAP || (i !== 2 && i !== 3));
      const col = isAP ? AD_JADE : (ok ? AD_TEAL : AD_ROSE);
      adLine(ctx, x - 26, 148, x, 172, DIM, 1.4);
      adLine(ctx, x + 26, 148, x, 172, DIM, 1.4);
      adCard(ctx, x, 192, 52, 34, col, { alpha: 0.16, lw: 2 });
      textCenter(ctx, adMn(df), x, 192, col, f(800, 17));
    });
    textLeft(ctx, '差', 12, 192, MUTED, f(800, 14));

    // 逐組計算
    for (let i = 0; i < 5; i++) {
      const y = 240 + i * 30;
      const col = (isAP || (i !== 2 && i !== 3)) ? INK : AD_ROSE;
      drawExpr(ctx, [adA(String(i + 2), col), T('−', col), adA(String(i + 1), col), T('=', col),
        T(adMn(t[i + 1]), col), T('−', col), adPar(t[i], col), T('=', col), T(adMn(diffs[i]), col)],
        W / 2, y, 17, col, { gap: 6 });
    }

    drawPanel(ctx, 30, 396, W - 60, 60, isAP ? AD_JADE : AD_ROSE, 0.09);
    if (isAP) {
      const kind = d > 0 ? '公差是正數' : (d < 0 ? '公差是負數' : '公差是 0');
      textCenter(ctx, `差都是 ${adMn(d)}：是等差數列，公差 d = ${adMn(d)}（${kind}）`, W / 2, 426, AD_JADE, f(800, 15));
    } else {
      textCenter(ctx, `${adMn(diffs[2])} ≠ ${adMn(diffs[0])}：差不完全相同，不是等差數列`, W / 2, 426, AD_ROSE, f(800, 15));
    }

    out.innerHTML = `差：${adSeqHtml(diffs.map(String))}，${isAP ? `是等差數列，\\(d = ${d}\\)` : '不是等差數列'}`;
    fb.innerHTML = wrapFeedback(isAP
      ? `任意相鄰兩項，後項減前項都等於 \\(${d}\\)。${d === 0 ? '每一項都相同也是等差數列，公差是 \\(0\\)。' : (d < 0 ? '公差可以是負數：後項比前項小。' : '公差是正數：後項比前項大。')}`
      : `只把第 4 項改動 \\(${e}\\)，就有兩組差變了（\\(${diffs[2]}\\) 與 \\(${diffs[3]}\\)）。判斷時<b>每一組</b>都要算，只要有一組不同就不是等差數列。`);
    typeset([out, fb]);
  }

  [sa, sd, se].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 5：由首項與公差列出各項——數線上一步一步跳
   ========================================================================== */
function initListCanvas() {
  const cv = adEl('canvas-list');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = adEl('li-a1'), sd = adEl('li-d'), sn = adEl('li-n');
  const va = adEl('li-va1'), vd = adEl('li-vd'), vn = adEl('li-vn');
  const out = adEl('li-formula');
  const fb = adEl('li-feedback');
  const C = AD_TONE[4];
  const state = { step: 1 };

  function draw() {
    const a1 = adIv(sa), d = adIv(sd), n = adIv(sn);
    va.textContent = a1; vd.textContent = d; vn.textContent = n;
    state.step = clamp(state.step, 1, n);
    adSyncSteps('li', state.step, n);
    const s = state.step;
    const t = [];
    for (let i = 0; i < n; i++) t.push(a1 + i * d);
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `首項 ${adMn(a1)}、公差 ${adMn(d)}：逐項加上公差`, C);

    const step = Math.min(64, 500 / n), cw = step - 10, x0 = W / 2 - step * (n - 1) / 2;
    t.forEach((v, i) => {
      const x = x0 + i * step;
      if (i < s) {
        adCard(ctx, x, 82, cw, 46, i === s - 1 ? AD_GOLD : C, { alpha: i === s - 1 ? 0.26 : 0.1, lw: i === s - 1 ? 3 : 2 });
        textCenter(ctx, adMn(v), x, 82, i === s - 1 ? AD_CREAM : INK, f(800, 18));
      } else {
        adCard(ctx, x, 82, cw, 46, DIM, { alpha: 0.04, dash: [4, 4], dim: true });
      }
      subLabel(ctx, 'a', String(i + 1), x, 121, i < s ? MUTED : DIM, 14);
    });

    // 這一步的算式
    let items;
    if (s === 1) items = [adA('1', AD_GOLD), T('=', AD_GOLD), T(adMn(a1), AD_GOLD), T('（首項）', MUTED)];
    else items = [adA(String(s), AD_GOLD), T('=', AD_GOLD), adA(String(s - 1), AD_GOLD), T('+', AD_GOLD), IT('d', AD_GOLD),
      T('=', AD_GOLD), T(adMn(t[s - 2]), AD_GOLD), T('+', AD_GOLD), adPar(d, AD_GOLD), T('=', AD_GOLD), T(adMn(t[s - 1]), AD_GOLD)];
    drawExpr(ctx, items, W / 2, 168, 20, AD_GOLD, { gap: 6 });

    // 數線上的跳躍
    const sc = adScale(t, 12);
    const ly = 340;
    const L = numLine(ctx, { x0: 50, x1: 488, y: ly, min: sc.min, max: sc.max, tick: sc.tick, labelEvery: sc.tick, color: INK });
    const gapPx = Math.abs(L.px(a1 + d) - L.px(a1));
    for (let i = 1; i < s; i++) {
      if (d === 0) break;
      const h = 34 + (i % 2) * 22;
      adHop(ctx, L.px(t[i - 1]), L.px(t[i]), ly - 8, h, C, gapPx > 34 || i === s - 1 ? [T(d > 0 ? `+${d}` : adMn(d), C)] : null, 14);
    }
    for (let i = 0; i < s; i++) {
      drawDot(ctx, L.px(t[i]), ly, i === s - 1 ? AD_GOLD : C, i === s - 1 ? 7 : 5.5);
    }
    if (d === 0) {
      textCenter(ctx, `公差 0：每一項都停在 ${adMn(a1)}`, L.px(a1), ly - 40, C, f(800, 14));
    }
    const dir = d > 0 ? '公差是正數：每跳一次往右，數列遞增' : (d < 0 ? '公差是負數：每跳一次往左，數列遞減' : '公差是 0：每一項都等於首項');
    textCenter(ctx, dir, W / 2, 404, d === 0 ? MUTED : C, f(800, 15));

    out.innerHTML = adSeqHtml(t.slice(0, s).map(String)) + (s < n ? ', \\(\\cdots\\)' : '');
    fb.innerHTML = wrapFeedback(s === 1
      ? `從首項 \\(a_1 = ${a1}\\) 出發，按「下一步」逐項加上公差 \\(${d}\\)。`
      : `${wbrEq(`a_{${s}} = a_{${s - 1}} + d = ${t[s - 2]} + ${sub(d)} = ${t[s - 1]}`)}。${d < 0 ? '加上負的公差，數就變小。' : (d === 0 ? '加上 \\(0\\)，數不變。' : '加上正的公差，數就變大。')}`);
    typeset([out, fb]);
  }

  [sa, sd, sn].forEach(sl => sl.addEventListener('input', draw));
  adBindSteps('li', () => adIv(sn), state, draw);
  draw();
}

/* ==========================================================================
   重點 6：由相鄰兩項求公差，往後加、往前減
   ========================================================================== */
function initFillCanvas() {
  const cv = adEl('canvas-fill');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const spp = adEl('fl-p'), su = adEl('fl-u'), sv = adEl('fl-v');
  const vp = adEl('fl-vp'), vu = adEl('fl-vu'), vv = adEl('fl-vv');
  const g = adEl('fl-mode-group');
  const out = adEl('fl-formula');
  const fb = adEl('fl-feedback');
  const C = AD_TONE[5];
  const state = { step: 1 };
  let mode = 'int';
  let nRows = 4;

  function known(raw) {
    if (mode === 'frac') return adLv(0, [raw, 3]);
    if (mode === 'text') return adLv(1, [raw, 1]);
    return adLv(0, [raw, 1]);
  }

  function draw() {
    const p = adIv(spp), u = adIv(su), v = adIv(sv);
    vp.textContent = p;
    const lab = raw => {
      if (mode === 'text') return adMn(adLvTex(adLv(1, [raw, 1])));
      if (mode === 'frac') { const q = qOf(raw, 3); return q[1] === 1 ? adMn(q[0]) : adMn(`${q[0]}/${q[1]}`); }
      return adMn(raw);
    };
    vu.textContent = lab(u);
    vv.textContent = lab(v);
    const K1 = known(u), K2 = known(v);
    const d = qSub(K2.q, K1.q);
    // 五格：第 p、p+1 格已知
    const vals = [];
    for (let i = 1; i <= 5; i++) vals.push(adLvAdd(K1, qMul(d, i - p)));
    // 揭曉順序：先求公差，再往後、再往前
    const order = [];
    for (let i = p + 2; i <= 5; i++) order.push(i);
    for (let i = p - 1; i >= 1; i--) order.push(i);
    nRows = 1 + order.length;
    state.step = clamp(state.step, 1, nRows);
    adSyncSteps('fl', state.step, nRows);
    const s = state.step;
    const revealed = new Set([p, p + 1]);
    order.slice(0, s - 1).forEach(i => revealed.add(i));

    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '填入空格，使它成為等差數列', C);

    const step = 100, cw = 90, x0 = W / 2 - step * 2, cy = 112;
    // 弧線：往後 +d、往前 −d
    order.slice(0, s - 1).forEach(i => {
      const fwd = i > p;
      const from = fwd ? i - 1 : i + 1;
      const lab = fwd ? [T('+', AD_TEAL), qOpIt(d, AD_TEAL)] : [T('−', AD_GOLD), qOpIt(d, AD_GOLD)];
      adHop(ctx, x0 + (from - 1) * step + (fwd ? 12 : -12), x0 + (i - 1) * step + (fwd ? -12 : 12), cy - 32, 14, fwd ? AD_TEAL : AD_GOLD, lab, 14);
    });
    for (let i = 1; i <= 5; i++) {
      const x = x0 + (i - 1) * step;
      const isKnown = (i === p || i === p + 1);
      if (revealed.has(i)) {
        const col = isKnown ? C : (i > p ? AD_TEAL : AD_GOLD);
        adCard(ctx, x, cy, cw, 54, col, { alpha: isKnown ? 0.24 : 0.12, lw: isKnown ? 3 : 2 });
        adCardText(ctx, adLvItem(vals[i - 1], isKnown ? AD_CREAM : INK), x, cy, cw, 19);
      } else {
        adCard(ctx, x, cy, cw, 54, DIM, { alpha: 0.04, dash: [5, 4], dim: true });
        textCenter(ctx, '?', x, cy, DIM, f(800, 20));
      }
      subLabel(ctx, 'a', String(i), x, cy + 46, isKnown ? C : DIM, 15);
    }

    const rows = [adRow('求公差', '後項 − 前項', [IT('d', INK), T('=', INK), adLvItem(K2, INK), T('−', INK), adLvParItem(K1, INK), T('=', INK), qIt(d, AD_CREAM)])];
    order.forEach(i => {
      const fwd = i > p;
      const ref = vals[fwd ? i - 2 : i];
      rows.push(adRow(fwd ? '往後' : '往前', fwd ? '前一項 + 公差' : '後一項 − 公差',
        [adA(String(i)), T('='), adLvItem(ref), T(fwd ? '+' : '−'), qOpIt(d), T('='), adLvItem(vals[i - 1], fwd ? AD_TEAL : AD_GOLD)],
        fwd ? AD_TEAL : AD_GOLD));
    });
    drawStepRows(ctx, rows, s, { top: 208, gap: 54, eqX: 150, color: C, size: 19 });
    if (p === 1 || p === 4) {
      textCenter(ctx, p === 1 ? '已知的是前兩格，前面沒有空格，只要往後加' : '已知的是後兩格，後面沒有空格，只要往前減', W / 2, 432, MUTED, f(700, 13));
    }

    const dTex = `d = ${adLvTex(K2)} - ${adLvParTex(K1)} = ${qTex(d)}`;
    out.innerHTML = `${wbrEq(dTex)}；${adSeqHtml(vals.map((x, i) => revealed.has(i + 1) ? adLvTex(x) : '\\square'))}`;
    fb.innerHTML = wrapFeedback(s === 1
      ? `先用已知的相鄰兩項求公差：<b>後項 − 前項</b>。按「下一步」往兩邊填。`
      : `往後是「前一項 \\(+\\) 公差」，往前是「後一項 \\(-\\) 公差」。公差是 \\(${qTex(d)}\\)${d[0] < 0 ? '（負數），往前減反而會變大' : ''}。`);
    typeset([out, fb]);
  }

  [spp, su, sv].forEach(sl => sl.addEventListener('input', draw));
  bindPickGroup(g, 'data-fl-mode', m => { mode = m; draw(); });
  adBindSteps('fl', () => nRows, state, draw);
  draw();
}

/* ==========================================================================
   重點 7：第 n 項公式 aₙ = a₁ + (n − 1)d
   ========================================================================== */
function initNthCanvas() {
  const cv = adEl('canvas-nth');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = adEl('nt-a1'), sd = adEl('nt-d'), sn = adEl('nt-n');
  const va = adEl('nt-va1'), vd = adEl('nt-vd'), vn = adEl('nt-vn');
  const out = adEl('nt-formula');
  const fb = adEl('nt-feedback');
  const C = AD_TONE[6];
  const state = { step: 1 };
  const N_ROWS = 4;

  function draw() {
    const a1 = adIv(sa), d = adIv(sd), n = adIv(sn);
    va.textContent = a1; vd.textContent = d; vn.textContent = n;
    state.step = clamp(state.step, 1, N_ROWS);
    adSyncSteps('nt', state.step, N_ROWS);
    const s = state.step;
    const prod = (n - 1) * d;
    const an = a1 + prod;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `首項 ${adMn(a1)}、公差 ${adMn(d)}，第 ${n} 項是多少？`, C);

    // 號碼牌：a₁, a₂, a₃, ⋯, aₙ
    let idx;
    if (n <= 5) { idx = []; for (let i = 1; i <= n; i++) idx.push(i); }
    else idx = [1, 2, 3, 0, n];
    const step = 92, cw = 74, x0 = W / 2 - step * (idx.length - 1) / 2, cy = 102;
    idx.forEach((k, j) => {
      const x = x0 + j * step;
      if (k === 0) { textCenter(ctx, '⋯', x, cy, MUTED, f(800, 26)); return; }
      const last = k === n;
      if (last && s < N_ROWS) {
        adCard(ctx, x, cy, cw, 50, AD_GOLD, { alpha: 0.08, dash: [5, 4], lw: 2.4 });
        textCenter(ctx, '?', x, cy, AD_GOLD, f(800, 22));
      } else {
        adCard(ctx, x, cy, cw, 50, last ? AD_JADE : C, { alpha: last ? 0.24 : 0.12, lw: last ? 3 : 2 });
        adCardText(ctx, T(adMn(a1 + (k - 1) * d), last ? AD_CREAM : INK), x, cy, cw, 20);
      }
      subLabel(ctx, 'a', String(k), x, cy + 44, last ? AD_GOLD : MUTED, 16);
      if (j > 0 && idx[j - 1] !== 0 && k === idx[j - 1] + 1) {
        adHop(ctx, x - step + 14, x - 14, cy - 30, 14, C, [T(d >= 0 ? `+${d}` : adMn(d), C)], 14);
      }
    });
    const bx1 = x0 - cw / 2, bx2 = x0 + (idx.length - 1) * step + cw / 2;
    adBraceH(ctx, bx1, bx2, cy + 70, AD_GOLD);
    textCenter(ctx, `從 a₁ 到 a${adSubStr(n)}，只跳了 ${n} − 1 = ${n - 1} 次公差`, W / 2, cy + 96, AD_GOLD, f(800, 15));

    const dP = adPar(d);
    const rows = [
      adRow('公式', '首項加上 n − 1 個公差', [adA('n'), T('='), adA('1'), T('+'), SEQ([GRP([SEQ([IT('n'), T('−'), T('1')], null, 5)]), IT('d')], null, 2)]),
      adRow('代入', `a₁ = ${adMn(a1)}，d = ${adMn(d)}，n = ${n}`, [adA(String(n)), T('='), T(adMn(a1)), T('+'), GRP([SEQ([T(n), T('−'), T('1')], null, 5)]), T('×'), dP]),
      adRow('計算', `${n - 1} 個公差合起來`, [adA(String(n)), T('='), T(adMn(a1)), T('+'), adPar(prod)]),
      adRow('答', '', [adA(String(n), AD_JADE), T('=', AD_JADE), T(adMn(an), AD_JADE)], AD_JADE)
    ];
    drawStepRows(ctx, rows, s, { top: 252, gap: 54, eqX: 160, color: C, size: 20 });
    if (s >= N_ROWS) {
      textCenter(ctx, `常見錯誤：寫成 a₁ + n × d = ${adMn(a1 + n * d)}，多加了一次公差`, W / 2, 482, AD_ROSE, f(700, 14));
    }

    out.innerHTML = wbrEq(`a_{${n}} = ${a1} + (${n} - 1) \\times ${sub(d)} = ${a1} + ${sub(prod)} = ${an}`);
    fb.innerHTML = wrapFeedback(s < N_ROWS
      ? `\\(a_2\\) 加了 \\(1\\) 個公差、\\(a_3\\) 加了 \\(2\\) 個……第 \\(n\\) 項只加了 \\((n - 1)\\) 個公差。`
      : `第 \\(${n}\\) 項是 \\(${an}\\)。不必從 \\(a_1\\) 一項一項加 \\(${n - 1}\\) 次，代公式一步就到。`);
    typeset([out, fb]);
  }

  [sa, sd, sn].forEach(sl => sl.addEventListener('input', draw));
  adBindSteps('nt', () => N_ROWS, state, draw);
  draw();
}

/* ==========================================================================
   重點 8：已知末項求項數（含「某範圍內有幾個倍數」）
   ========================================================================== */
function initCountCanvas() {
  const cv = adEl('canvas-count');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = adEl('ct-a1'), sd = adEl('ct-d'), sn = adEl('ct-n');
  const va = adEl('ct-va1'), vd = adEl('ct-vd'), vn = adEl('ct-vn');
  const sk = adEl('ct-k'), slo = adEl('ct-lo'), shi = adEl('ct-hi');
  const vk = adEl('ct-vk'), vlo = adEl('ct-vlo'), vhi = adEl('ct-vhi');
  const boxSeq = adEl('ct-seq-sliders'), boxMult = adEl('ct-mult-sliders');
  const g = adEl('ct-mode-group');
  const out = adEl('ct-formula');
  const fb = adEl('ct-feedback');
  const C = AD_TONE[7];
  let mode = 'seq';

  // 公差不可以是 0（0 時往原本的方向退一格）
  let lastD = adIv(sd);
  sd.addEventListener('input', () => {
    if (adIv(sd) === 0) sd.value = lastD > 0 ? -1 : 1;
    lastD = adIv(sd);
  });

  function cards(first, d, last, y) {
    const W = cv.width;
    const vals = [first, first + d, first + 2 * d, null, last];
    const step = 96, cw = 76, x0 = W / 2 - step * 2;
    vals.forEach((v, j) => {
      const x = x0 + j * step;
      if (v === null) { textCenter(ctx, '⋯', x, y, MUTED, f(800, 26)); return; }
      const col = j === 4 ? AD_GOLD : C;
      adCard(ctx, x, y, cw, 48, col, { alpha: j === 4 ? 0.22 : 0.1, lw: j === 4 ? 3 : 2 });
      adCardText(ctx, T(adMn(v), j === 4 ? AD_CREAM : INK), x, y, cw, 20);
      if (j === 1 || j === 2) adHop(ctx, x - step + 14, x - 14, y - 30, 13, C, [T(d > 0 ? `+${d}` : adMn(d), C)], 14);
    });
    textCenter(ctx, '首項', x0, y + 40, MUTED, f(700, 13));
    textCenter(ctx, '末項', x0 + 4 * step, y + 40, AD_GOLD, f(700, 13));
  }

  function draw() {
    boxSeq.style.display = mode === 'seq' ? '' : 'none';
    boxMult.style.display = mode === 'mult' ? '' : 'none';
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    let first, d, last, n, rows;
    if (mode === 'seq') {
      const a1 = adIv(sa); d = adIv(sd); const nn = adIv(sn);
      va.textContent = a1; vd.textContent = d; vn.textContent = nn;
      first = a1; last = a1 + (nn - 1) * d; n = (last - first) / d + 1;
      drawTitle(ctx, `等差數列 ${adMn(first)}, ${adMn(first + d)}, ${adMn(first + 2 * d)}, ⋯, ${adMn(last)} 共有幾項？`, C);
      rows = [
        adRow('公差', '後項 − 前項', [IT('d'), T('='), T(adMn(first + d)), T('−'), adPar(first), T('='), T(adMn(d))]),
        adRow('代入', '設共有 n 項，末項就是第 n 項', [T(adMn(last)), T('='), T(adMn(first)), T('+'), GRP([SEQ([IT('n'), T('−'), T('1')], null, 5)]), T('×'), adPar(d)]),
        adRow('移項', '先把首項移到左邊', [GRP([SEQ([IT('n'), T('−'), T('1')], null, 5)]), T('×'), adPar(d), T('='), T(adMn(last)), T('−'), adPar(first), T('='), T(adMn(last - first))]),
        adRow('除以公差', '', [IT('n'), T('−'), T('1'), T('='), T(adMn(last - first)), T('÷'), adPar(d), T('='), T(n - 1)]),
        adRow('答', '最後別忘了 + 1', [IT('n', AD_JADE), T('=', AD_JADE), T(n, AD_JADE), T(`，共 ${n} 項`, AD_JADE)], AD_JADE)
      ];
      out.innerHTML = `${wbrEq(`${last} = ${first} + (n - 1) \\times ${sub(d)}`)}，\\(n - 1 = ${n - 1}\\)，\\(n = ${n}\\)`;
      fb.innerHTML = wrapFeedback(`末項是第 \\(n\\) 項，代入 \\(a_n = a_1 + (n - 1)d\\) 解出 \\(n\\)。算出 \\(n - 1 = ${n - 1}\\) 之後還要 \\(+1\\)，數列共有 \\(${n}\\) 項。`);
    } else {
      const k = adIv(sk), lo = adIv(slo), hi = adIv(shi);
      vk.textContent = k; vlo.textContent = lo; vhi.textContent = hi;
      d = k;
      first = Math.ceil(lo / k) * k; last = Math.floor(hi / k) * k;
      n = (last - first) / k + 1;
      drawTitle(ctx, `${lo} 到 ${hi} 的整數中，${k} 的倍數有幾個？`, C);
      rows = [
        adRow('頭', `${lo} 以上第一個 ${k} 的倍數`, [T(first), T('='), T(k), T('×'), T(first / k)]),
        adRow('尾', `${hi} 以下最後一個 ${k} 的倍數`, [T(last), T('='), T(k), T('×'), T(last / k)]),
        adRow('代入', `公差 ${k} 的等差數列，設共 n 項`, [T(last), T('='), T(first), T('+'), GRP([SEQ([IT('n'), T('−'), T('1')], null, 5)]), T('×'), T(k)]),
        adRow('解', '', [IT('n'), T('−'), T('1'), T('='), T(`(${last} − ${first})`), T('÷'), T(k), T('='), T(n - 1)]),
        adRow('答', '頭尾都要算', [IT('n', AD_JADE), T('=', AD_JADE), T(n, AD_JADE), T(`，共 ${n} 個`, AD_JADE)], AD_JADE)
      ];
      out.innerHTML = `${adSeqHtml([String(first), String(first + k), '\\cdots', String(last)])}；${wbrEq(`n = (${last} - ${first}) \\div ${k} + 1 = ${n}`)}`;
      const wrong = Math.floor((hi - lo) / k);
      fb.innerHTML = wrapFeedback(`先找出範圍裡的第一個與最後一個倍數，它們排成公差 \\(${k}\\) 的等差數列。直接算 \\((${hi} - ${lo}) \\div ${k}\\) 只得到約 \\(${wrong}\\)，不是個數。`);
    }
    cards(first, d, last, 104);
    drawStepRows(ctx, rows, rows.length, { top: 190, gap: 54, eqX: 150, color: C, size: 19 });
    typeset([out, fb]);
  }

  [sa, sd, sn, sk, slo, shi].forEach(sl => sl.addEventListener('input', draw));
  bindPickGroup(g, 'data-ct-mode', m => { mode = m; draw(); });
  draw();
}

/* ==========================================================================
   重點 9：圖形的規律——吸管排圖形
   ========================================================================== */
const AD_SHAPES = {
  sq: { name: '相連的正方形', a1: 4, d: 3 },
  tri: { name: '相連的正三角形', a1: 3, d: 2 },
  hex: { name: '相連的正六邊形', a1: 6, d: 5 }
};

// 圖 n 的每一根吸管：[x1, y1, x2, y2, 是不是圖 n 新加的]
function adShapeSegs(kind, n, W, top, H) {
  const segs = [];
  if (kind === 'sq') {
    const s = Math.min(58, 440 / n);
    const x0 = W / 2 - n * s / 2, y0 = top + (H - s) / 2;
    for (let i = 0; i < n; i++) {
      const nw = i === n - 1;
      segs.push([x0 + i * s, y0, x0 + (i + 1) * s, y0, nw]);
      segs.push([x0 + i * s, y0 + s, x0 + (i + 1) * s, y0 + s, nw]);
    }
    for (let i = 0; i <= n; i++) segs.push([x0 + i * s, y0, x0 + i * s, y0 + s, i === n || (n === 1)]);
  } else if (kind === 'tri') {
    const s = Math.min(80, 440 / ((n + 1) / 2));
    const h = s * Math.sqrt(3) / 2;
    const x0 = W / 2 - (n + 1) * s / 4, yb = top + (H + h) / 2;
    const P = m => (m % 2 === 0 ? [x0 + (m / 2) * s, yb] : [x0 + ((m - 1) / 2) * s + s / 2, yb - h]);
    for (let m = 0; m <= n; m++) {
      const a = P(m), b = P(m + 1);
      segs.push([a[0], a[1], b[0], b[1], m === n || n === 1]);
    }
    for (let i = 0; i < n; i++) {
      const a = P(i), b = P(i + 2);
      segs.push([a[0], a[1], b[0], b[1], i === n - 1]);
    }
  } else {
    const r = Math.min(40, 440 / (n * Math.sqrt(3)));
    const w = r * Math.sqrt(3);
    const cx0 = W / 2 - (n - 1) * w / 2, cy = top + H / 2;
    for (let i = 0; i < n; i++) {
      const cx = cx0 + i * w;
      const v = [];
      for (let k = 0; k < 6; k++) {
        const ang = Math.PI / 2 - k * Math.PI / 3;
        v.push([cx + r * Math.cos(ang), cy - r * Math.sin(ang)]);
      }
      // 頂點依序：上、右上、右下、下、左下、左上；左邊那根（左下—左上）與前一個共用
      for (let k = 0; k < 6; k++) {
        if (i > 0 && k === 4) continue;
        const a = v[k], b = v[(k + 1) % 6];
        segs.push([a[0], a[1], b[0], b[1], i === n - 1]);
      }
    }
  }
  return segs;
}

function initShapeCanvas() {
  const cv = adEl('canvas-shape');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sn = adEl('sh-n'), sN = adEl('sh-N');
  const vn = adEl('sh-vn'), vN = adEl('sh-vN');
  const g = adEl('sh-kind-group');
  const out = adEl('sh-formula');
  const fb = adEl('sh-feedback');
  const C = AD_TONE[8];
  let kind = 'sq';

  function draw() {
    const n = adIv(sn), N = adIv(sN);
    vn.textContent = n; vN.textContent = N;
    const S = AD_SHAPES[kind];
    const an = S.a1 + (n - 1) * S.d;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `用等長的吸管排${S.name}：圖 ${n}`, C);

    const segs = adShapeSegs(kind, n, W, 48, 170);
    segs.forEach(sg => {
      ctx.save();
      ctx.strokeStyle = sg[4] && n > 1 ? AD_TEAL : AD_GOLD;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sg[0], sg[1]);
      ctx.lineTo(sg[2], sg[3]);
      ctx.stroke();
      ctx.restore();
    });
    textCenter(ctx, `數一數：圖 ${n} 共 ${segs.length} 根${n > 1 ? `（藍色是比圖 ${n - 1} 多的 ${S.d} 根）` : ''}`, W / 2, 232, n > 1 ? AD_TEAL : AD_GOLD, f(800, 14));

    // 圖 1 ～ 圖 8 的吸管數
    const step = 60, x0 = W / 2 - step * 3.5;
    for (let i = 1; i <= 8; i++) {
      const x = x0 + (i - 1) * step;
      const on = i <= n;
      textCenter(ctx, `圖 ${i}`, x, 262, on ? MUTED : DIM, f(700, 12));
      adCard(ctx, x, 290, 50, 36, i === n ? AD_GOLD : C, { alpha: on ? 0.14 : 0.03, dim: !on, lw: i === n ? 3 : 2 });
      textCenter(ctx, String(S.a1 + (i - 1) * S.d), x, 290, on ? (i === n ? AD_CREAM : INK) : DIM, f(800, 17));
    }

    // 吸管數 N 能不能剛好排完
    const mm = qOf(N - S.a1 + S.d, S.d); // m = (N − a₁)/d + 1
    const okN = N >= S.a1 && mm[1] === 1;
    const rows = [
      adRow(`圖 ${n}`, `首項 ${S.a1}、公差 ${S.d}`, [adA(String(n)), T('='), T(S.a1), T('+'), GRP([SEQ([T(n), T('−'), T('1')], null, 5)]), T('×'), T(S.d), T('='), T(an)]),
      adRow(`${N} 根`, '設剛好排出圖 m', [T(N), T('='), T(S.a1), T('+'), GRP([SEQ([IT('m'), T('−'), T('1')], null, 5)]), T('×'), T(S.d)]),
      adRow(okN ? '可以' : '不行', okN ? 'm 是正整數' : 'm 不是正整數', [IT('m', okN ? AD_JADE : AD_ROSE), T('=', okN ? AD_JADE : AD_ROSE), qIt(mm, okN ? AD_JADE : AD_ROSE),
        T(okN ? `，剛好排出圖 ${mm[0]}` : '，排不出完整的圖形', okN ? AD_JADE : AD_ROSE)], okN ? AD_JADE : AD_ROSE)
    ];
    drawStepRows(ctx, rows, 3, { top: 350, gap: 52, eqX: 132, color: C, size: 19 });

    out.innerHTML = `${wbrEq(`a_{${n}} = ${S.a1} + (${n} - 1) \\times ${S.d} = ${an}`)}；${wbrEq(`m = (${N} - ${S.a1}) \\div ${S.d} + 1 = ${qTex(mm)}`)}`;
    fb.innerHTML = wrapFeedback(`每多一個圖形就多 \\(${S.d}\\) 根，所以吸管數是首項 \\(${S.a1}\\)、公差 \\(${S.d}\\) 的等差數列。`
      + (okN ? `\\(${N}\\) 根剛好排出圖 \\(${mm[0]}\\)。` : `\\(${N}\\) 根解出 \\(m = ${qTex(mm)}\\)，不是正整數，代表會多出吸管、排不出完整的圖形。`));
    typeset([out, fb]);
  }

  [sn, sN].forEach(sl => sl.addEventListener('input', draw));
  bindPickGroup(g, 'data-sh-kind', k => { kind = k; draw(); });
  draw();
}

/* ==========================================================================
   重點 10：等差中項 b = (a + c) / 2——數線上的正中間
   ========================================================================== */
function initMiddleCanvas() {
  const cv = adEl('canvas-mid');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = adEl('md-a'), sc = adEl('md-c');
  const va = adEl('md-va'), vc = adEl('md-vc');
  const g = adEl('md-mode-group');
  const out = adEl('md-formula');
  const fb = adEl('md-feedback');
  const C = AD_TONE[9];
  let mode = 'three';

  function midQ(p, q) {
    return qDiv(qAdd(p, q), 2);
  }

  // (p + q)/2 的 canvas 元件
  function midItems(name, p, q, r, color) {
    return [IT(name, color), T('=', color),
      VF(SEQ([qIt(p, color), T('+', color), qOpIt(q, color)], color, 6), T('2', color), color),
      T('=', color), qIt(r, color)];
  }

  function midTex(name, p, q, r) {
    return `${name} = \\frac{${qTex(p)} + ${adQPar(q)}}{2} = ${qTex(r)}`;
  }

  function draw() {
    const a = adIv(sa), c = adIv(sc);
    va.textContent = a; vc.textContent = c;
    const A = qOf(a), Cc = qOf(c);
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);

    let pts, rows, texParts;
    const b = midQ(A, Cc);
    if (mode === 'three') {
      drawTitle(ctx, `${adMn(a)}, b, ${adMn(c)} 成等差數列，b 在正中間`, C);
      pts = [['a', A, AD_TEAL], ['b', b, AD_GOLD], ['c', Cc, AD_TEAL]];
      const dd = qSub(b, A);
      rows = [
        adRow('等差中項', '前後兩項和的一半', midItems('b', A, Cc, b, AD_GOLD), AD_GOLD),
        adRow('驗算', '兩段的差一樣', [IT('b'), T('−'), IT('a'), T('='), qIt(qSub(b, A)), T('，'), IT('c'), T('−'), IT('b'), T('='), qIt(qSub(Cc, b))]),
        adRow('公差', '', [IT('d'), T('='), qIt(dd, AD_JADE)], AD_JADE)
      ];
      texParts = [midTex('b', A, Cc, b)];
    } else {
      drawTitle(ctx, `在 ${adMn(a)} 與 ${adMn(c)} 之間插入三個數 x, y, z`, C);
      const x = midQ(A, b), z = midQ(b, Cc);
      pts = [['a', A, AD_TEAL], ['x', x, AD_SKY], ['y', b, AD_GOLD], ['z', z, AD_SKY], ['c', Cc, AD_TEAL]];
      rows = [
        adRow('先找正中間', 'y 是 a 與 c 的中項', midItems('y', A, Cc, b, AD_GOLD), AD_GOLD),
        adRow('左半邊', 'x 是 a 與 y 的中項', midItems('x', A, b, x, AD_SKY), AD_SKY),
        adRow('右半邊', 'z 是 y 與 c 的中項', midItems('z', b, Cc, z, AD_SKY), AD_SKY),
        adRow('公差', '', [IT('d'), T('='), qIt(qSub(x, A), AD_JADE)], AD_JADE)
      ];
      texParts = [midTex('y', A, Cc, b), midTex('x', A, b, x), midTex('z', b, Cc, z)];
    }

    // 數線
    const sc0 = adScale([a, c], 10);
    const ly = 168;
    const L = numLine(ctx, { x0: 50, x1: 488, y: ly, min: sc0.min, max: sc0.max, tick: sc0.tick, labelEvery: sc0.tick, color: INK });
    const same = a === c;
    const gapPx = pts.length > 1 ? Math.abs(L.px(qVal(pts[1][1])) - L.px(qVal(pts[0][1]))) : 0;
    pts.forEach((P, i) => {
      const x = L.px(qVal(P[1]));
      drawDot(ctx, x, ly, P[2], P[0] === 'a' || P[0] === 'c' ? 6 : 7);
      if (same && i > 0) return;
      const lift = (gapPx < 70 && i % 2 === 1) ? 44 : 0;
      textCenter(ctx, same ? '全部重合' : P[0], x, ly - 70 - lift, P[2], fi(800, 17));
      drawExpr(ctx, [qIt(P[1], P[2])], x, ly - 40 - lift, 16, P[2], {});
    });
    if (!same && gapPx >= 36) {
      for (let i = 0; i + 1 < pts.length; i++) {
        const x1 = L.px(qVal(pts[i][1])), x2 = L.px(qVal(pts[i + 1][1]));
        adLine(ctx, x1, ly + 40, x2, ly + 40, AD_JADE, 2);
        adLine(ctx, x1, ly + 34, x1, ly + 46, AD_JADE, 2);
        adLine(ctx, x2, ly + 34, x2, ly + 46, AD_JADE, 2);
      }
      textCenter(ctx, '每一段一樣長', W / 2, ly + 62, AD_JADE, f(700, 13));
    }

    drawStepRows(ctx, rows, rows.length, { top: mode === 'five' ? 284 : 272, gap: mode === 'five' ? 80 : 62, eqX: 150, color: C, size: 19 });
    if (mode === 'three') {
      textCenter(ctx, '中項落在 a 與 c 的正中間：左右兩段一樣長，差也一樣', W / 2, 470, MUTED, f(700, 14));
      textCenter(ctx, '切到「插入三個數」，看五個數怎麼把 a 到 c 分成四段', W / 2, 500, DIM, f(700, 13));
    }

    out.innerHTML = texParts.map(t => wbrEq(t)).join('；');
    fb.innerHTML = wrapFeedback(mode === 'three'
      ? `\\(a, b, c\\) 成等差數列時 \\(b - a = c - b\\)，所以 \\(2b = a + c\\)，\\(b\\) 就是前後兩項和的一半，也就是數線上的正中間。${b[1] !== 1 ? '和是奇數時，中項是分數。' : ''}`
      : `插入三個數，就是先找 \\(a\\) 與 \\(c\\) 的正中間 \\(y\\)，再分別找兩半的正中間。五個數之間分成 \\(4\\) 段，公差是 \\((c - a) \\div 4\\)。`);
    typeset([out, fb]);
  }

  [sa, sc].forEach(sl => sl.addEventListener('input', draw));
  bindPickGroup(g, 'data-md-mode', m => { mode = m; draw(); });
  draw();
}
