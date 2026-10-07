/* ==========================================================================
   4-4-3（第四冊 4-3）特殊四邊形的性質 — 互動 Canvas 與隨堂評量
   畫風：復古琺瑯道路標誌風・道路標線工班（小線、阿平），第 4 章三節共用。

   共用工具在 ../math-canvas.js（f／fi／drawTitle／textCenter／textLeft／
   wrapFeedback／wbrEq／typeset／bindPickGroup／numStr／axisArrow…），
   幾何工具 hb*（數學方向角、頂點外推、角記號）與 cg*（交點、直角記號、
   描邊標籤）也在那裡。

   本檔分三層：
     0. 本章色票（RD_ 前綴；共用檔沒有這個前綴）；
     1. 本節自己的工具（sq 前綴）；
     2. 12 個互動與評量附圖。

   長度一律由「邊長平方」這個整數（或 1/4 的整數倍）化成最簡根式，不用浮點數
   判斷相等；角度由頂點座標量出來（開發約束 27）。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();
  drawWithFonts(initQuizFigs);

  initRectCanvas();
  initRhombCanvas();
  initAreaCanvas();
  initKiteCanvas();
  initSquareCanvas();
  initJudgeCanvas();
  initFamilyCanvas();
  initMidCanvas();
  initTareaCanvas();
  initIsoCanvas();
  initIsodCanvas();
  initIsojCanvas();
});

/* ==========================================================================
   0. 本章色票（瀝青深灰底上的道路標線）
   ========================================================================== */

const RD_YELLOW = '#f4c430';   // 標線黃
const RD_WHITE = '#f1f1ec';    // 標線白
const RD_BLUE = '#2f6bb3';     // 琺瑯藍（填色用）
const RD_BLUE_LT = '#7fb0ea';  // 琺瑯藍的亮色（深底上畫線用）
const RD_RED = '#d64933';      // 警示紅（填色用）
const RD_RED_LT = '#f08a78';   // 警示紅的亮色
const RD_OK = '#86efac';
const RD_NO = '#fb7185';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const RD_TONE = ['#f4c430', '#7fb0ea', '#fdba74', '#f08a78', '#f1f1ec', '#5eead4',
                 '#c4b5fd', '#fcd34d', '#a5f3fc', '#f9a8d4', '#bef264', '#fca5a5'];

/* ==========================================================================
   1. 本節工具（sq 前綴）
   ========================================================================== */

// √n ÷ 2（n 為正整數）：k 是偶數就約掉，否則寫成分數或 .5
function sqHalfRoot(n) {
  const R = hbRoot(n);
  if (R.exact) {
    const v = R.k / 2;
    return { val: v, exact: true, tex: numStr(v), txt: numStr(v) };
  }
  if (R.k % 2 === 0) {
    const c = R.k / 2 > 1 ? String(R.k / 2) : '';
    return { val: R.val / 2, exact: false, tex: `${c}\\sqrt{${R.r}}`, txt: `${c}√${R.r}` };
  }
  const c = R.k > 1 ? String(R.k) : '';
  return { val: R.val / 2, exact: false, tex: `\\frac{${c}\\sqrt{${R.r}}}{2}`, txt: `${c}√${R.r} ÷ 2` };
}

// 根式後面補近似值（整數就不補）
function sqApprox(R) {
  return R.exact ? R.txt : `${R.txt} ≈ ${R.val.toFixed(2)}`;
}

// 帶正負號的整數（坐標的變化量用）
function sqSg(v) {
  return v > 0 ? `+${v}` : (v < 0 ? `−${-v}` : '0');
}

// 一位小數的角度
function sqD1(v) {
  return (Math.round(v * 10) / 10).toFixed(1);
}

// 固定比例的座標換算：數學座標（y 朝上）→ 畫布
function sqMap(ox, oy, k) {
  return (x, y) => hbV(ox + x * k, oy - y * k);
}

// 直角記號：頂點 V、兩邊各往 P、Q
function sqRight(ctx, V, P, Q, color, s) {
  cgRight(ctx, V, cgUnit(V, P), cgUnit(V, Q), s || 11, color);
}

// 四邊形：填色、四邊、頂點字母在外
function sqQuad(ctx, pts, names, o) {
  const opt = o || {};
  hbPoly(ctx, pts, opt.fill || RD_WHITE, opt.alpha == null ? 0.07 : opt.alpha, 0.01);
  for (let i = 0; i < pts.length; i++) {
    hbSeg(ctx, pts[i], pts[(i + 1) % pts.length], (opt.sideColor && opt.sideColor[i]) || RD_WHITE, opt.width || 3);
  }
  const G = opt.ref || hbCentroid(pts);
  if (names) pts.forEach((P, i) => { if (names[i]) hbVLabel(ctx, P, G, names[i], RD_WHITE, opt.labelDist || 18); });
  return G;
}

// 多邊形面積（鞋帶公式，數學座標）
// 多邊形與半平面 x ≤ X 的交集（數學座標）
function sqClipLeft(pts, X) {
  const res = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    const pin = p.x <= X + 1e-9, qin = q.x <= X + 1e-9;
    if (pin) res.push(p);
    if (pin !== qin) {
      const t = (X - p.x) / (q.x - p.x);
      res.push(hbV(X, p.y + (q.y - p.y) * t));
    }
  }
  return res;
}

// 一個名詞方塊（家族圖用）
function sqNode(ctx, x, y, w, h, text, lit, color) {
  ctx.save();
  ctx.fillStyle = lit ? color : 'rgba(255,255,255,0.04)';
  ctx.globalAlpha = lit ? 0.24 : 1;
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 8);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = lit ? color : 'rgba(203,213,225,0.3)';
  ctx.lineWidth = lit ? 2.4 : 1.4;
  ctx.stroke();
  ctx.restore();
  textCenter(ctx, text, x, y, lit ? RD_WHITE : DIM, f(800, 14));
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第四冊 4-3 的 24 題正解
  // 正解字母分布：A 6 題、B 6 題、C 6 題、D 6 題（開發約束 36）
  const answers = {
    '4-3-1': 'B',    // 20、21 → 對角線 29，兩條和 58
    '4-3-2': 'D',    // OB 8.5 → BD 17，CD 8 → 周長 46
    '4-3-3': 'C',    // OC 20、BC 29 → OB 21 → BD 42
    '4-3-4': 'A',    // ∠ABC 124° → ∠BAD 56° → ∠OAD 28°
    '4-3-5': 'D',    // 16 × 26 ÷ 2 = 208
    '4-3-6': 'B',    // 15 × BD ÷ 2 = 60 → BD = 8
    '4-3-7': 'A',    // AO 5、OC 16 → AC 21
    '4-3-8': 'C',    // (360 − 64 − 40) ÷ 2 = 128
    '4-3-9': 'B',    // BD 14 → 邊長 7√2，周長 28√2，面積 98
    '4-3-10': 'D',   // O(1, 1)，OA 5 → B、D 為 (1, 6)、(1, −4)
    '4-3-11': 'D',   // 等長又垂直，不一定互相平分
    '4-3-12': 'A',   // AC 是 BD 的中垂線
    '4-3-13': 'C',   // 四邊相等是菱形，不一定是正方形
    '4-3-14': 'B',   // 菱形的對角線一定互相垂直，長方形不一定
    '4-3-15': 'A',   // (9 + 23) ÷ 2 = 16
    '4-3-16': 'C',   // FI 20 → GJ = (20 + 34) ÷ 2 = 27
    '4-3-17': 'B',   // m = h，m² = 121 → m = 11 → 兩底和 22
    '4-3-18': 'D',   // EF 11，AEFD = (5 + 11) × 4 ÷ 2 = 32
    '4-3-19': 'A',   // 2∠B = 360 − 248 → ∠B = 56°
    '4-3-20': 'C',   // 2x + 8 + x + 16 = 180 → x = 52 → ∠D = 112°
    '4-3-21': 'B',   // BQ = 12、DQ = 12 → 12√2
    '4-3-22': 'A',   // CE 15、AE 8 → 面積 15 × 8 = 120
    '4-3-23': 'C',   // 58°、122°、122°、58°
    '4-3-24': 'D'    // AC ⊥ BD 不一定
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

// 數學座標的點組 → 等比例放進附圖
function sqFigFit(pts, W, H) {
  return hbFit(pts, { x: 46, y: 34, w: W - 92, h: H - 66 });
}

const SQ_QUIZ_FIGS = {
  // 箏形 ABCD：AB = AD = 13、CB = CD = 20、BO = 12
  q7(ctx, W, H) {
    const m = [hbV(0, 5), hbV(-12, 0), hbV(0, -16), hbV(12, 0), hbV(0, 0)];
    const p = sqFigFit(m.map(v => hbV(v.x, -v.y)), W, H);
    const [A, B, C, D, O] = p;
    const G = hbCentroid([A, B, C, D]);
    hbPoly(ctx, [A, B, C, D], RD_WHITE, 0.05, 2.4);
    hbSeg(ctx, A, C, RD_YELLOW, 2, [5, 4]);
    hbSeg(ctx, B, D, RD_BLUE_LT, 2, [5, 4]);
    sqRight(ctx, O, A, D, RD_WHITE, 9);
    const fnt = f(800, 13);
    hbSideLabel(ctx, A, B, G, '13', RD_WHITE, 14, fnt);
    hbSideLabel(ctx, A, D, G, '13', RD_WHITE, 14, fnt);
    hbSideLabel(ctx, C, B, G, '20', RD_WHITE, 14, fnt);
    hbSideLabel(ctx, C, D, G, '20', RD_WHITE, 14, fnt);
    cgLabel(ctx, hbV((B.x + O.x) / 2, O.y), '12', RD_BLUE_LT, 0, 12, fnt);
    ['A', 'B', 'C', 'D'].forEach((s, i) => hbVLabel(ctx, p[i], G, s, RD_WHITE, 15));
    cgLabel(ctx, O, 'O', RD_WHITE, 12, -11, fi(800, 14));
  },
  // 梯形 ABCD：AD = 6、BC = 34，AB、DC 各四等分
  q16(ctx, W, H) {
    const raw = [hbV(14, 8), hbV(0, 0), hbV(34, 0), hbV(20, 8)];
    const p = sqFigFit(raw.map(v => hbV(v.x, -v.y)), W, H);
    const [A, B, C, D] = p;
    const G = hbCentroid(p);
    hbPoly(ctx, p, RD_WHITE, 0.05, 2.4);
    const lab = [['E', 'H'], ['F', 'I'], ['G', 'J']];
    for (let i = 1; i <= 3; i++) {
      const t = i / 4;
      const L = hbV(A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t);
      const R = hbV(D.x + (C.x - D.x) * t, D.y + (C.y - D.y) * t);
      hbSeg(ctx, L, R, RD_YELLOW, 1.8, [5, 4]);
      cgLabel(ctx, L, lab[i - 1][0], RD_WHITE, -14, 0, fi(800, 13));
      cgLabel(ctx, R, lab[i - 1][1], RD_WHITE, 14, 0, fi(800, 13));
    }
    hbSideLabel(ctx, A, D, G, '6', RD_WHITE, 14, f(800, 13));
    hbSideLabel(ctx, B, C, G, '34', RD_WHITE, 14, f(800, 13));
    ['A', 'B', 'C', 'D'].forEach((s, i) => hbVLabel(ctx, p[i], G, s, RD_WHITE, 15));
  },
  // 梯形 ABCD：AD = 5、BC = 17、高 8，EF 為兩腰中點連線段
  q18(ctx, W, H) {
    const raw = [hbV(3, 8), hbV(0, 0), hbV(17, 0), hbV(8, 8)];
    const p = sqFigFit(raw.map(v => hbV(v.x, -v.y)), W, H);
    const [A, B, C, D] = p;
    const G = hbCentroid(p);
    hbPoly(ctx, p, RD_WHITE, 0.05, 2.4);
    const E = hbV((A.x + B.x) / 2, (A.y + B.y) / 2), F = hbV((D.x + C.x) / 2, (D.y + C.y) / 2);
    hbSeg(ctx, E, F, RD_YELLOW, 2);
    const Hf = hbV(A.x, B.y);
    hbSeg(ctx, A, Hf, RD_BLUE_LT, 1.6, [4, 4]);
    sqRight(ctx, Hf, A, C, RD_BLUE_LT, 8);
    cgLabel(ctx, hbV(A.x, (A.y + Hf.y) / 2), '8', RD_BLUE_LT, 11, 26, f(800, 13));
    cgLabel(ctx, E, 'E', RD_WHITE, -13, 0, fi(800, 13));
    cgLabel(ctx, F, 'F', RD_WHITE, 13, 0, fi(800, 13));
    hbSideLabel(ctx, A, D, G, '5', RD_WHITE, 14, f(800, 13));
    hbSideLabel(ctx, B, C, G, '17', RD_WHITE, 14, f(800, 13));
    ['A', 'B', 'C', 'D'].forEach((s, i) => hbVLabel(ctx, p[i], G, s, RD_WHITE, 15));
  },
  // 等腰梯形 ABCD：AD = 7、BC = 17、AP = DQ = 12
  q21(ctx, W, H) {
    const raw = [hbV(5, 12), hbV(0, 0), hbV(17, 0), hbV(12, 12), hbV(5, 0), hbV(12, 0)];
    const p = sqFigFit(raw.map(v => hbV(v.x, -v.y)), W, H);
    const [A, B, C, D, Pp, Q] = p;
    const G = hbCentroid([A, B, C, D]);
    hbPoly(ctx, [A, B, C, D], RD_WHITE, 0.05, 2.4);
    hbSeg(ctx, A, Pp, RD_BLUE_LT, 1.8, [4, 4]);
    hbSeg(ctx, D, Q, RD_BLUE_LT, 1.8, [4, 4]);
    sqRight(ctx, Pp, A, C, RD_BLUE_LT, 8);
    sqRight(ctx, Q, D, B, RD_BLUE_LT, 8);
    cgLabel(ctx, hbV(Pp.x, (A.y + Pp.y) / 2), '12', RD_BLUE_LT, 14, 0, f(800, 13));
    cgLabel(ctx, Pp, 'P', RD_WHITE, 0, 14, fi(800, 13));
    cgLabel(ctx, Q, 'Q', RD_WHITE, 0, 14, fi(800, 13));
    hbSideLabel(ctx, A, D, G, '7', RD_WHITE, 14, f(800, 13));
    cgLabel(ctx, hbV((B.x + C.x) / 2, B.y), '17', RD_WHITE, -16, 14, f(800, 13));
    ['A', 'B', 'C', 'D'].forEach((s, i) => hbVLabel(ctx, p[i], G, s, RD_WHITE, 15));
  }
};

function initQuizFigs() {
  document.querySelectorAll('canvas.quiz-fig[data-fig]').forEach(cv => {
    const fn = SQ_QUIZ_FIGS[cv.getAttribute('data-fig')];
    if (!fn) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    fn(ctx, cv.width, cv.height);
  });
}

/* ==========================================================================
   重點 1：長方形的兩條對角線等長且互相平分
   A 左上、B 左下、C 右下、D 右上；BC = w、CD = h
   ========================================================================== */
function initRectCanvas() {
  const cv = hbEl('canvas-rect');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sw = hbEl('rc-w'), sh = hbEl('rc-h');
  const out = hbEl('rc-formula'), fb = hbEl('rc-feedback');
  const C0 = RD_TONE[0];
  let mode = 'diag';

  function draw() {
    const W = cv.width, H = cv.height;
    const w = hbClampSlider(sw, 2, 12), h = hbClampSlider(sh, 2, 9);
    hbEl('rc-vw').textContent = w;
    hbEl('rc-vh').textContent = h;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, mode === 'diag' ? '長方形的兩條對角線：等長、互相平分' : '兩條對角線把長方形切成四塊', C0);

    const P = sqMap(270, 178, 24);
    const A = P(-w / 2, h / 2), B = P(-w / 2, -h / 2), C = P(w / 2, -h / 2), D = P(w / 2, h / 2), O = P(0, 0);
    const n = w * w + h * h;
    const R = hbRoot(n), Hf = sqHalfRoot(n);

    if (mode === 'tri') {
      const quads = [[A, O, B], [B, O, C], [C, O, D], [D, O, A]];
      quads.forEach((t, i) => hbPoly(ctx, t, i === 1 ? C0 : RD_BLUE_LT, i === 1 ? 0.34 : 0.1, 0.01));
    } else {
      // O 到四個頂點一樣遠：以 O 為圓心的圓通過 A、B、C、D
      ctx.save();
      ctx.strokeStyle = 'rgba(244, 196, 48, 0.45)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(O.x, O.y, hbDist(O, A), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    const G = sqQuad(ctx, [A, B, C, D], null, { alpha: mode === 'tri' ? 0 : 0.06, ref: O });
    [[A, B, D], [B, C, A], [C, D, B], [D, A, C]].forEach(v => sqRight(ctx, v[0], v[1], v[2], 'rgba(241,241,236,0.7)', 10));
    hbSeg(ctx, A, C, RD_YELLOW, 3);
    hbSeg(ctx, B, D, RD_BLUE_LT, 3);
    [A, B, C, D].forEach(V => hbTick(ctx, O, V, 1, RD_YELLOW));
    hbDot(ctx, O, RD_WHITE, 4.5);
    cgLabel(ctx, O, 'O', RD_WHITE, 0, -16, fi(800, 16));
    ['A', 'B', 'C', 'D'].forEach((s, i) => hbVLabel(ctx, [A, B, C, D][i], G, s, RD_WHITE, 18));
    hbSideLabel(ctx, B, C, G, String(w), RD_WHITE, 20);
    hbSideLabel(ctx, C, D, G, String(h), RD_WHITE, 20);

    if (mode === 'diag') {
      hbFitLine(ctx, `BD² = BC² + CD² = ${w}² + ${h}² = ${n}（畢氏定理）`, 334, RD_WHITE, 16);
      hbFitLine(ctx, `AC = BD = ${sqApprox(R)}`, 366, RD_YELLOW, 17);
      hbFitLine(ctx, `OA = OB = OC = OD = ½BD = ${Hf.txt}`, 398, RD_BLUE_LT, 16);
      hbFitLine(ctx, '四段一樣長：以 O 為圓心，一個圓剛好通過四個頂點', 432, MUTED, 14.5);
      out.innerHTML = wbrEq(`\\overline{AC} = \\overline{BD} = \\sqrt{${w}^2 + ${h}^2} = ${R.tex}`);
      fb.innerHTML = wrapFeedback(w === h
        ? '四個邊一樣長時它是正方形；正方形也是長方形，對角線照樣<strong>等長且互相平分</strong>。'
        : '長方形是平行四邊形，對角線本來就互相平分；再加上兩條<strong>等長</strong>，\\(O\\) 到四個頂點就一樣遠。');
    } else {
      const per = R.exact ? `${R.txt} + ${w} = ${R.k + w}` : `${R.txt} + ${w}`;
      const area = numStr(w * h / 4);
      hbFitLine(ctx, `OB = OC = ½BD = ${Hf.txt}，OB + OC = BD = ${R.txt}`, 334, RD_BLUE_LT, 15.5);
      hbFitLine(ctx, `△BOC 周長 = OB + OC + BC = ${per}`, 366, RD_WHITE, 16);
      hbFitLine(ctx, `△BOC 面積 = ¼ × 長方形 = ¼ × ${w} × ${h} = ${area}`, 398, C0, 17);
      hbFitLine(ctx, `（底 BC = ${w}，高是 CD 的一半 ${numStr(h / 2)}：½ × ${w} × ${numStr(h / 2)} = ${area}）`, 432, MUTED, 14);
      out.innerHTML = `△\\(BOC\\) 面積：<wbr>` + wbrEq(`\\frac{1}{4} \\times ${w} \\times ${h} = ${area}`);
      fb.innerHTML = wrapFeedback('對角線把長方形切成四個小三角形，<strong>面積都是長方形的 \\(\\frac{1}{4}\\)</strong>；△\\(BOC\\) 的兩腰 \\(\\overline{OB}\\)、\\(\\overline{OC}\\) 各是對角線的一半。');
    }
    typeset([out, fb]);
  }

  [sw, sh].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(hbEl('rc-mode-group'), 'data-rc-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：菱形的兩條對角線互相垂直平分，並平分內角
   A 左、B 下、C 右、D 上；len 模式 AO = p、BO = q；ang 模式邊長 8、∠BAD = a
   ========================================================================== */
function initRhombCanvas() {
  const cv = hbEl('canvas-rhomb');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = hbEl('rb-p'), sq = hbEl('rb-q'), sa = hbEl('rb-a');
  const rowP = hbEl('rb-row-p'), rowQ = hbEl('rb-row-q'), rowA = hbEl('rb-row-a');
  const out = hbEl('rb-formula'), fb = hbEl('rb-feedback');
  const C0 = RD_TONE[1];
  let mode = 'len';

  function draw() {
    const W = cv.width, H = cv.height;
    rowP.style.display = rowQ.style.display = mode === 'len' ? '' : 'none';
    rowA.style.display = mode === 'ang' ? '' : 'none';
    ctx.clearRect(0, 0, W, H);
    let p, q, a = 0;
    if (mode === 'len') {
      p = hbClampSlider(sp, 1, 9);
      q = hbClampSlider(sq, 1, 9);
      hbEl('rb-vp').textContent = p;
      hbEl('rb-vq').textContent = q;
      drawTitle(ctx, '對角線互相垂直平分：切出四個全等的直角三角形', C0);
    } else {
      a = hbClampSlider(sa, 20, 160);
      hbEl('rb-va').textContent = a;
      p = 8 * Math.cos(a / 2 * HB_RAD);
      q = 8 * Math.sin(a / 2 * HB_RAD);
      drawTitle(ctx, '對角線平分菱形的內角', C0);
    }
    const P = sqMap(270, 184, 13.5);
    const A = P(-p, 0), B = P(0, -q), C = P(p, 0), D = P(0, q), O = P(0, 0);
    const G = sqQuad(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], { alpha: 0.06, ref: O });
    hbSeg(ctx, A, C, RD_YELLOW, 3);
    hbSeg(ctx, B, D, RD_BLUE_LT, 3);
    sqRight(ctx, O, C, D, RD_WHITE, 11);
    hbDot(ctx, O, RD_WHITE, 4);
    cgLabel(ctx, O, 'O', RD_WHITE, -13, -13, fi(800, 15));

    if (mode === 'len') {
      [A, B, C, D].forEach((V, i) => hbTick(ctx, V, [B, C, D, A][i], 1, C0));
      hbTick(ctx, O, A, 2, RD_YELLOW);
      hbTick(ctx, O, C, 2, RD_YELLOW);
      hbTick(ctx, O, B, 3, RD_BLUE_LT);
      hbTick(ctx, O, D, 3, RD_BLUE_LT);
      cgLabel(ctx, hbV((A.x + O.x) / 2, O.y), String(p), RD_YELLOW, 0, -14, f(800, 15));
      cgLabel(ctx, hbV(O.x, (B.y + O.y) / 2), String(q), RD_BLUE_LT, 14, 0, f(800, 15));
      const n = p * p + q * q;
      const R = hbRoot(n);
      const per = R.exact ? String(4 * R.k) : `${4 * R.k}√${R.r}`;
      hbFitLine(ctx, `AO = OC = ${p}，BO = OD = ${q}（互相平分）`, 344, RD_WHITE, 16);
      hbFitLine(ctx, `∠AOB = 90° ⇒ AB² = ${p}² + ${q}² = ${n}`, 374, RD_WHITE, 16);
      hbFitLine(ctx, `AB = BC = CD = DA = ${sqApprox(R)}`, 404, C0, 17);
      hbFitLine(ctx, `AC = ${2 * p}，BD = ${2 * q}，周長 = 4 × ${R.txt} = ${per}`, 436, RD_YELLOW, 15.5);
      out.innerHTML = wbrEq(`\\overline{AB} = \\sqrt{${p}^2 + ${q}^2} = ${R.tex}`);
      fb.innerHTML = wrapFeedback(p === q
        ? '\\(\\overline{AO} = \\overline{BO}\\) 時兩條對角線也一樣長，這個菱形就是<strong>正方形</strong>。'
        : '對角線把菱形切成<strong>四個全等的直角三角形</strong>：兩股是對角線的一半，斜邊就是菱形的邊。');
    } else {
      const h1 = a / 2, b1 = 90 - h1;
      const lf = f(800, 13);
      hbAngle(ctx, A, B, O, 30, C0, { alpha: 0.32, label: `${numStr(h1)}°`, lr: 52, font: lf });
      hbAngle(ctx, A, O, D, 36, C0, { alpha: 0.32, label: `${numStr(h1)}°`, lr: 56, font: lf });
      hbAngle(ctx, B, A, O, 24, RD_YELLOW, { alpha: 0.3, label: `${numStr(b1)}°`, lr: 44, font: lf });
      hbFitLine(ctx, `∠BAO = ∠DAO = ½ × ${a}° = ${numStr(h1)}°（AC 平分 ∠A）`, 344, C0, 16);
      hbFitLine(ctx, `∠AOB = 90° ⇒ ∠ABO = 180° − 90° − ${numStr(h1)}° = ${numStr(b1)}°`, 374, RD_WHITE, 16);
      hbFitLine(ctx, `∠ABC = 2 × ${numStr(b1)}° = ${180 - a}°（也等於 180° − ∠BAD）`, 404, RD_YELLOW, 16);
      hbFitLine(ctx, '菱形是平行四邊形：相鄰兩角互補', 436, MUTED, 14.5);
      out.innerHTML = wbrEq(`\\angle ABO = 90^\\circ - ${numStr(h1)}^\\circ = ${numStr(b1)}^\\circ`);
      fb.innerHTML = wrapFeedback(a === 90
        ? '\\(\\angle BAD = 90^\\circ\\) 的菱形就是<strong>正方形</strong>，對角線把直角平分成兩個 \\(45^\\circ\\)。'
        : '對角線<strong>平分內角</strong>，又互相垂直：每個小直角三角形的兩個銳角加起來是 \\(90^\\circ\\)。');
    }
    typeset([out, fb]);
  }

  [sp, sq, sa].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(hbEl('rb-mode-group'), 'data-rb-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：對角線互相垂直的四邊形，面積 = 兩對角線乘積的一半
   AC 水平（長 d1）、BD 鉛垂（長 d2），交點 O：AO = s、BO = t
   ========================================================================== */
function initAreaCanvas() {
  const cv = hbEl('canvas-area');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const s1 = hbEl('ar-d1'), s2 = hbEl('ar-d2'), s3 = hbEl('ar-o'), s4 = hbEl('ar-b');
  const out = hbEl('ar-formula'), fb = hbEl('ar-feedback');
  const C0 = RD_TONE[2];

  function draw() {
    const W = cv.width, H = cv.height;
    const d1 = hbClampSlider(s1, 2, 12), d2 = hbClampSlider(s2, 2, 10);
    const s = hbClampSlider(s3, 1, d1 - 1), t = hbClampSlider(s4, 1, d2 - 1);
    hbEl('ar-vd1').textContent = d1;
    hbEl('ar-vd2').textContent = d2;
    hbEl('ar-vo').textContent = s;
    hbEl('ar-vb').textContent = t;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '外框長方形的一半，就是這個四邊形', C0);

    const k = 22;
    const P = sqMap(270 - d1 * k / 2, 178 + (d2 / 2 - t) * k, k);
    const A = P(0, 0), C = P(d1, 0), B = P(s, -t), D = P(s, d2 - t), O = P(s, 0);
    const c1 = P(0, -t), c2 = P(d1, -t), c3 = P(d1, d2 - t), c4 = P(0, d2 - t);
    // 四塊小長方形：裡面那一半（四邊形的一部分）與外面那一半全等
    const parts = [[A, O, B, c1], [O, C, c2, B], [O, C, c3, D], [A, O, D, c4]];
    const cols = [RD_YELLOW, RD_BLUE_LT, RD_RED_LT, RD_TONE[5]];
    parts.forEach((r, i) => {
      // 每一塊小長方形：靠 O 的那一半在四邊形裡、另一半在外，兩半全等
      const inner = i === 0 ? [A, O, B] : i === 1 ? [O, C, B] : i === 2 ? [O, C, D] : [A, O, D];
      const outer = i === 0 ? [A, B, c1] : i === 1 ? [C, B, c2] : i === 2 ? [C, D, c3] : [A, D, c4];
      hbPoly(ctx, inner, cols[i], 0.36, 0.01);
      hbPoly(ctx, outer, cols[i], 0.1, 0.01);
      hbPoly(ctx, outer, cols[i], 0, 1.2);
    });
    ctx.save();
    ctx.setLineDash([5, 5]);
    hbPoly(ctx, [c1, c2, c3, c4], RD_WHITE, 0, 1.6);
    ctx.restore();
    const G = sqQuad(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], { alpha: 0, ref: O, labelDist: 16 });
    hbSeg(ctx, A, C, RD_YELLOW, 2.6);
    hbSeg(ctx, B, D, RD_BLUE_LT, 2.6);
    sqRight(ctx, O, C, D, RD_WHITE, 10);
    hbDot(ctx, O, RD_WHITE, 4);
    cgLabel(ctx, hbV(c2.x, c1.y), `AC = ${d1}`, RD_YELLOW, -34, 18, f(800, 14));
    cgLabel(ctx, hbV(c2.x, (c2.y + c3.y) / 2), `BD = ${d2}`, RD_BLUE_LT, 40, 0, f(800, 14));

    let name;
    const bisA = (2 * s === d1), bisB = (2 * t === d2);
    if (bisA && bisB) name = d1 === d2 ? '正方形' : '菱形';
    else if (bisA || bisB) name = '箏形';
    else name = '對角線互相垂直的一般四邊形';
    const area = numStr(d1 * d2 / 2);
    hbFitLine(ctx, `外框長方形 = AC × BD = ${d1} × ${d2} = ${d1 * d2}`, 360, RD_WHITE, 16);
    hbFitLine(ctx, '每一小塊長方形，都被四邊形的一邊切成兩個全等三角形', 390, MUTED, 14);
    hbFitLine(ctx, `四邊形 ABCD = ½ × ${d1} × ${d2} = ${area}`, 420, C0, 17.5);
    hbFitLine(ctx, `現在的 ABCD 是：${name}`, 452, RD_YELLOW, 15);
    out.innerHTML = `面積：<wbr>` + wbrEq(`\\frac{1}{2} \\times ${d1} \\times ${d2} = ${area}`);
    fb.innerHTML = wrapFeedback(name === '箏形'
      ? '箏形只有一條對角線被平分，但<strong>兩條對角線仍互相垂直</strong>，所以面積同樣是乘積的一半。'
      : (name.length > 3
        ? '對角線互相垂直就夠了，交點在哪裡都沒關係：面積永遠是<strong>兩對角線乘積的一半</strong>。'
        : `這時是${name}：對角線互相垂直平分，面積是<strong>兩對角線乘積的一半</strong>。`));
    typeset([out, fb]);
  }

  [s1, s2, s3, s4].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：箏形——一條對角線垂直平分另一條，並平分兩個頂角
   A 上、B 左、C 下、D 右；AO = p、OC = r、BO = OD = q
   ========================================================================== */
function initKiteCanvas() {
  const cv = hbEl('canvas-kite');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = hbEl('kt-p'), sr = hbEl('kt-r'), sq = hbEl('kt-q');
  const out = hbEl('kt-formula'), fb = hbEl('kt-feedback');
  const C0 = RD_TONE[3];
  let mode = 'len';

  function draw() {
    const W = cv.width, H = cv.height;
    const p = hbClampSlider(sp, 1, 8), r = hbClampSlider(sr, 1, 10), q = hbClampSlider(sq, 1, 7);
    hbEl('kt-vp').textContent = p;
    hbEl('kt-vr').textContent = r;
    hbEl('kt-vq').textContent = q;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, mode === 'len' ? '箏形：AC 垂直平分 BD' : '箏形：AC 平分 ∠A 與 ∠C', C0);
    const k = 13;
    const P = sqMap(270, 182 + (p - r) / 2 * k, k);
    const A = P(0, p), B = P(-q, 0), C = P(0, -r), D = P(q, 0), O = P(0, 0);
    const G = sqQuad(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], { alpha: 0.06, ref: O });
    hbSeg(ctx, hbBeyond(C, A, 16), hbBeyond(A, C, 16), RD_YELLOW, 1.4, [6, 5]);
    hbSeg(ctx, A, C, RD_YELLOW, 2.8);
    hbSeg(ctx, B, D, RD_BLUE_LT, 2.8);
    sqRight(ctx, O, D, A, RD_WHITE, 10);
    hbDot(ctx, O, RD_WHITE, 4);
    cgLabel(ctx, O, 'O', RD_WHITE, 12, 14, fi(800, 14));
    const R1 = hbRoot(p * p + q * q), R2 = hbRoot(q * q + r * r);
    const bAO = Math.atan2(q, p) / HB_RAD, bCO = Math.atan2(q, r) / HB_RAD;
    const angB = 180 - bAO - bCO;

    if (mode === 'len') {
      hbTick(ctx, A, B, 1, C0);
      hbTick(ctx, A, D, 1, C0);
      hbTick(ctx, C, B, 2, RD_WHITE);
      hbTick(ctx, C, D, 2, RD_WHITE);
      hbTick(ctx, O, B, 3, RD_BLUE_LT);
      hbTick(ctx, O, D, 3, RD_BLUE_LT);
      hbFitLine(ctx, `AB = AD = √(${p}² + ${q}²) = ${R1.txt}`, 342, C0, 16);
      hbFitLine(ctx, `CB = CD = √(${q}² + ${r}²) = ${R2.txt}`, 372, RD_WHITE, 16);
      hbFitLine(ctx, `BO = OD = ${q}，AC = ${p} + ${r} = ${p + r}`, 402, RD_BLUE_LT, 16);
      hbFitLine(ctx, `面積 = ½ × AC × BD = ½ × ${p + r} × ${2 * q} = ${(p + r) * q}`, 434, RD_YELLOW, 16.5);
      out.innerHTML = `面積：<wbr>` + wbrEq(`\\frac{1}{2} \\times ${p + r} \\times ${2 * q} = ${(p + r) * q}`);
    } else {
      hbAngle(ctx, A, B, C, 30, C0, { alpha: 0.32 });
      hbAngle(ctx, A, C, D, 36, C0, { alpha: 0.32 });
      hbAngle(ctx, C, B, A, 30, RD_BLUE_LT, { alpha: 0.3 });
      hbAngle(ctx, C, A, D, 36, RD_BLUE_LT, { alpha: 0.3 });
      hbAngle(ctx, B, A, C, 22, RD_YELLOW, { alpha: 0.3 });
      hbAngle(ctx, D, C, A, 22, RD_YELLOW, { alpha: 0.3 });
      hbFitLine(ctx, `∠BAC = ∠DAC ≈ ${sqD1(bAO)}°（AC 平分 ∠A）`, 342, C0, 16);
      hbFitLine(ctx, `∠BCA = ∠DCA ≈ ${sqD1(bCO)}°（AC 平分 ∠C）`, 372, RD_BLUE_LT, 16);
      hbFitLine(ctx, `∠ABC = ∠ADC ≈ ${sqD1(angB)}°`, 402, RD_YELLOW, 16.5);
      hbFitLine(ctx, '△ABC ≅ △ADC（SSS）：兩邊的角對應相等', 434, MUTED, 14.5);
      out.innerHTML = `\\(\\angle ABC = \\angle ADC \\approx ${sqD1(angB)}^\\circ\\)`;
    }
    let msg;
    if (p === r && p === q) msg = '\\(\\overline{AO} = \\overline{OC} = \\overline{BO}\\)：四邊相等又四角相等，這時是<strong>正方形</strong>。';
    else if (p === r) msg = '\\(\\overline{AO} = \\overline{OC}\\) 時四邊都相等，變成<strong>菱形</strong>：兩條對角線不只互相垂直，還互相平分。';
    else msg = '兩雙<strong>鄰邊</strong>各自相等，但對邊 \\(\\overline{AB}\\) 與 \\(\\overline{DC}\\) 不相等，所以箏形<strong>不一定是平行四邊形</strong>。';
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  [sp, sr, sq].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(hbEl('kt-mode-group'), 'data-kt-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：正方形——對角線等長且互相垂直平分；由 A、C 求 B、D
   O 固定在 (6, 5)，A = O + (u, v)；B = O + (−v, u)、C = O − (u, v)、D = O + (v, −u)
   ========================================================================== */
function initSquareCanvas() {
  const cv = hbEl('canvas-square');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const su = hbEl('sp-u'), sv = hbEl('sp-v');
  const out = hbEl('sp-formula'), fb = hbEl('sp-feedback');
  const C0 = RD_TONE[4];
  const OX = 6, OY = 5;

  function draw() {
    const W = cv.width, H = cv.height;
    const u = hbClampSlider(su, -4, 4), v = hbClampSlider(sv, -4, 4);
    hbEl('sp-vu').textContent = u;
    hbEl('sp-vv').textContent = v;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '已知對角線的兩端 A、C，找出 B、D', C0);
    const k = 22;
    const P = sqMap(138, 292, k);
    // 格線與坐標軸（只在正向畫箭頭，開發約束 34）
    ctx.save();
    ctx.strokeStyle = 'rgba(203,213,225,0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 12; x++) { const a = P(x, 0), b = P(x, 10); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    for (let y = 0; y <= 10; y++) { const a = P(0, y), b = P(12, y); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    ctx.restore();
    const o0 = P(0, 0);
    hbSeg(ctx, o0, P(12.5, 0), MUTED, 1.8);
    hbSeg(ctx, o0, P(0, 10.5), MUTED, 1.8);
    const xe = P(12.5, 0), ye = P(0, 10.5);
    axisArrow(ctx, xe.x, xe.y, 'right', MUTED);
    axisArrow(ctx, ye.x, ye.y, 'up', MUTED);
    for (let x = 2; x <= 12; x += 2) { const q = P(x, 0); textCenter(ctx, String(x), q.x, q.y + 12, DIM, f(600, 11)); }
    for (let y = 2; y <= 10; y += 2) { const q = P(0, y); textCenter(ctx, String(y), q.x - 12, q.y, DIM, f(600, 11)); }
    textCenter(ctx, '0', o0.x - 10, o0.y + 11, DIM, f(600, 11));
    textLeft(ctx, 'x', xe.x + 2, xe.y + 14, MUTED, fi(700, 13));
    textLeft(ctx, 'y', ye.x + 9, ye.y + 2, MUTED, fi(700, 13));

    if (u === 0 && v === 0) {
      hbFitLine(ctx, 'A 和 O 重合了：對角線長 0，畫不出正方形', 360, RD_NO, 16);
      out.innerHTML = '請把 \\(A\\) 移離 \\(O\\)';
      fb.innerHTML = wrapFeedback('對角線至少要有長度，正方形才存在。');
      typeset([out, fb]);
      return;
    }
    const a = [OX + u, OY + v], b = [OX - v, OY + u], c = [OX - u, OY - v], d = [OX + v, OY - u];
    const A = P(a[0], a[1]), B = P(b[0], b[1]), C = P(c[0], c[1]), D = P(d[0], d[1]), O = P(OX, OY);
    hbPoly(ctx, [A, B, C, D], C0, 0.1, 2.8);
    hbSeg(ctx, A, C, RD_YELLOW, 2.6);
    hbSeg(ctx, B, D, RD_BLUE_LT, 2.6);
    sqRight(ctx, O, A, B, RD_WHITE, 10);
    // 斜率三角形：O→A 先橫後直；O→B 是它轉 90°
    if (u !== 0 && v !== 0) {
      const Ah = P(OX + u, OY), Bh = P(OX - v, OY);
      hbSeg(ctx, O, Ah, RD_YELLOW, 1.6, [4, 4]);
      hbSeg(ctx, Ah, A, RD_YELLOW, 1.6, [4, 4]);
      hbSeg(ctx, O, Bh, RD_BLUE_LT, 1.6, [4, 4]);
      hbSeg(ctx, Bh, B, RD_BLUE_LT, 1.6, [4, 4]);
    }
    hbDot(ctx, O, RD_WHITE, 4);
    cgLabel(ctx, O, 'O', RD_WHITE, 12, 12, fi(800, 14));
    const G = O;
    [[A, 'A', a], [B, 'B', b], [C, 'C', c], [D, 'D', d]].forEach(e => {
      hbDot(ctx, e[0], RD_WHITE, 3.5);
      const dd = hbDist(e[0], G) || 1;
      const L = hbV(e[0].x + (e[0].x - G.x) / dd * 26, e[0].y + (e[0].y - G.y) / dd * 20);
      cgLabel(ctx, L, `${e[1]}(${e[2][0]}, ${e[2][1]})`, e[1] === 'A' || e[1] === 'C' ? RD_YELLOW : RD_BLUE_LT, 0, 0, f(800, 13));
    });

    const n = u * u + v * v;
    const Rd = hbRoot(4 * n), Rs = hbRoot(2 * n);
    hbFitLine(ctx, `O 是 AC 的中點：O(${OX}, ${OY})`, 340, RD_WHITE, 15.5);
    hbFitLine(ctx, `O→A：x ${sqSg(u)}、y ${sqSg(v)}；轉 90° 得 O→B：x ${sqSg(-v)}、y ${sqSg(u)}`, 370, RD_WHITE, 15);
    hbFitLine(ctx, `B(${b[0]}, ${b[1]})、D(${d[0]}, ${d[1]})`, 400, RD_BLUE_LT, 17);
    hbFitLine(ctx, `AC = BD = ${Rd.txt}，邊長 = ${Rs.txt}，面積 = ½ × AC × BD = ${2 * n}`, 434, C0, 14.5);
    out.innerHTML = `\\(B(${b[0]}, ${b[1]})\\)、<wbr>\\(D(${d[0]}, ${d[1]})\\)`;
    fb.innerHTML = wrapFeedback(u === 0 || v === 0
      ? '\\(\\overline{AC}\\) 是水平或鉛垂時，\\(B\\)、\\(D\\) 就在 \\(O\\) 的正上下方（或正左右方），而且到 \\(O\\) 的距離和 \\(\\overline{OA}\\) 一樣。'
      : '正方形的對角線<strong>等長、互相垂直平分</strong>：把 \\(O \\to A\\) 的斜率三角形轉 \\(90^\\circ\\)，就得到 \\(O \\to B\\)。');
    typeset([out, fb]);
  }

  [su, sv].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：由對角線判別——互相平分、等長、互相垂直
   O 為交點；A = (−a, 0)、C = (c, 0)；BD 與 OC 夾 θ：D = d(cosθ, sinθ)、B = −b(cosθ, sinθ)
   ========================================================================== */
function sqJudge(a, c, b, d, t) {
  const bis = (a === c && b === d), eq = (a + c === b + d), perp = (t === 90);
  let name, why;
  if (bis && eq && perp) { name = '正方形'; why = '互相平分＋等長＋垂直：三個條件全到齊'; }
  else if (bis && eq) { name = '長方形'; why = '互相平分＋等長'; }
  else if (bis && perp) { name = '菱形'; why = '互相平分＋垂直'; }
  else if (bis) { name = '平行四邊形'; why = '只有互相平分'; }
  else if (perp && b === d) { name = '箏形'; why = 'AC 垂直平分 BD'; }
  else if (perp && a === c) { name = '箏形'; why = 'BD 垂直平分 AC'; }
  else {
    name = '一般四邊形';
    if (eq && perp) why = '等長又垂直，但沒有互相平分：不一定是正方形';
    else if (eq) why = '只有等長，不一定是長方形——還要互相平分';
    else if (perp) why = '只有垂直，不一定是菱形——還要互相平分';
    else why = '三個條件都沒有';
  }
  return { bis, eq, perp, name, why };
}

function initJudgeCanvas() {
  const cv = hbEl('canvas-judge');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sl = ['jd-a', 'jd-c', 'jd-b', 'jd-d'].map(hbEl), st = hbEl('jd-t');
  const out = hbEl('jd-formula'), fb = hbEl('jd-feedback');
  const C0 = RD_TONE[5];

  function draw() {
    const W = cv.width, H = cv.height;
    const [a, c, b, d] = sl.map(s => hbClampSlider(s, 1, 6));
    const t = hbClampSlider(st, 30, 90);
    ['jd-va', 'jd-vc', 'jd-vb', 'jd-vd'].forEach((id, i) => { hbEl(id).textContent = [a, c, b, d][i]; });
    hbEl('jd-vt').textContent = t;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '只看兩條對角線，判斷是哪一種四邊形', C0);
    const cs = Math.cos(t * HB_RAD), sn = Math.sin(t * HB_RAD);
    const m = { A: hbV(-a, 0), C: hbV(c, 0), D: hbV(d * cs, d * sn), B: hbV(-b * cs, -b * sn), O: hbV(0, 0) };
    const P = sqMap(270 - (c - a) / 2 * 22, 172, 22);
    const A = P(m.A.x, m.A.y), B = P(m.B.x, m.B.y), C = P(m.C.x, m.C.y), D = P(m.D.x, m.D.y), O = P(0, 0);
    const J = sqJudge(a, c, b, d, t);
    const G = sqQuad(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], { alpha: 0.08, ref: O });
    hbSeg(ctx, A, C, RD_YELLOW, 3);
    hbSeg(ctx, B, D, RD_BLUE_LT, 3);
    if (a === c) { hbTick(ctx, O, A, 1, RD_YELLOW); hbTick(ctx, O, C, 1, RD_YELLOW); }
    if (b === d) { hbTick(ctx, O, B, 2, RD_BLUE_LT); hbTick(ctx, O, D, 2, RD_BLUE_LT); }
    if (J.perp) sqRight(ctx, O, C, D, RD_WHITE, 11);
    else hbAngle(ctx, O, C, D, 22, RD_WHITE, { alpha: 0.2, label: `${t}°`, lr: 38, font: f(800, 13) });
    hbDot(ctx, O, RD_WHITE, 4);
    // 四個內角（由座標量）
    const pts = [m.A, m.B, m.C, m.D];
    const ang = pts.map((V, i) => cgAngDeg(V, pts[(i + 3) % 4], pts[(i + 1) % 4]));

    // 三個條件的勾選列
    const items = [['互相平分', J.bis], ['等長', J.eq], ['互相垂直', J.perp]];
    items.forEach((it, i) => {
      const x = 95 + i * 175, y = 336;
      drawChip(ctx, x - 75, y - 15, 150, 30, `${it[1] ? '✓' : '✗'} ${it[0]}`, it[1] ? RD_OK : RD_NO, it[1] ? 'rgba(134,239,172,0.12)' : 'rgba(251,113,133,0.10)');
    });
    hbFitLine(ctx, `AC = ${a} + ${c} = ${a + c}，BD = ${b} + ${d} = ${b + d}`, 374, RD_WHITE, 15.5);
    hbFitLine(ctx, `判別：${J.name}`, 406, J.name === '一般四邊形' ? RD_NO : C0, 18);
    hbFitLine(ctx, J.why, 436, MUTED, 14.5);
    hbFitLine(ctx, `量一量四個內角：∠A ≈ ${sqD1(ang[0])}°、∠B ≈ ${sqD1(ang[1])}°、∠C ≈ ${sqD1(ang[2])}°、∠D ≈ ${sqD1(ang[3])}°`, 460, DIM, 13);

    out.innerHTML = `\\(\\overline{AC} = ${a + c}\\)、<wbr>\\(\\overline{BD} = ${b + d}\\)，<wbr>${J.name}`;
    let msg;
    if (J.name === '長方形') msg = '兩條對角線<strong>等長且互相平分</strong>：四個內角都是 \\(90^\\circ\\)，是長方形。';
    else if (J.name === '菱形') msg = '兩條對角線<strong>互相垂直平分</strong>：四邊都相等，是菱形。';
    else if (J.name === '正方形') msg = '兩條對角線<strong>等長且互相垂直平分</strong>：是正方形。';
    else if (J.name === '箏形') msg = '<strong>一條對角線垂直平分另一條</strong>：由中垂線性質得兩雙鄰邊相等，是箏形。';
    else if (J.name === '平行四邊形') msg = '只知道對角線<strong>互相平分</strong>，只能確定是平行四邊形。';
    else msg = J.eq || J.perp
      ? '對角線「等長」或「垂直」都要搭配<strong>互相平分</strong>才判得出長方形、菱形：只看其中一個條件會誤判。'
      : '對角線沒有互相平分、也沒有任何一條被垂直平分：只是一般的四邊形。';
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  sl.concat([st]).forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：特殊四邊形的包含關係
   para 模式：AB、BC、∠B；kite 模式：AB = AD、CB = CD、∠BAD
   ========================================================================== */
const SQ_NODES = {
  quad: { x: 270, y: 248, t: '四邊形' },
  trap: { x: 82, y: 300, t: '梯形' },
  para: { x: 270, y: 300, t: '平行四邊形' },
  kite: { x: 452, y: 300, t: '箏形' },
  iso: { x: 82, y: 352, t: '等腰梯形' },
  rect: { x: 196, y: 352, t: '長方形' },
  rhomb: { x: 360, y: 352, t: '菱形' },
  square: { x: 278, y: 404, t: '正方形' }
};
const SQ_EDGES = [['quad', 'trap'], ['quad', 'para'], ['quad', 'kite'], ['trap', 'iso'],
  ['para', 'rect'], ['para', 'rhomb'], ['rect', 'square'], ['rhomb', 'square']];

function sqFamily(mode, s1, s2, s3) {
  // 回傳「它也是」的集合
  const lit = { quad: true };
  if (mode === 'para') {
    lit.para = true;
    if (s3 === 90) lit.rect = true;
    if (s1 === s2) lit.rhomb = true;
    if (lit.rect && lit.rhomb) lit.square = true;
  } else {
    // 依課本的包含關係，箏形自成一支；四邊都相等時改歸平行四邊形那一支的菱形
    if (s1 === s2) { lit.rhomb = true; lit.para = true; } else lit.kite = true;
    if (lit.rhomb && s3 === 90) { lit.square = true; lit.rect = true; }
  }
  const name = lit.square ? '正方形' : lit.rect ? '長方形' : lit.rhomb ? '菱形' : lit.para ? '平行四邊形' : '箏形';
  return { lit, name };
}

function initFamilyCanvas() {
  const cv = hbEl('canvas-family');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sl = ['fm-1', 'fm-2', 'fm-3'].map(hbEl);
  const out = hbEl('fm-formula'), fb = hbEl('fm-feedback');
  const C0 = RD_TONE[6];
  let mode = 'para';

  function draw() {
    const W = cv.width, H = cv.height;
    const s1 = mode === 'para' ? hbClampSlider(sl[0], 2, 8) : hbClampSlider(sl[0], 2, 5);
    const s2 = mode === 'para' ? hbClampSlider(sl[1], 2, 8) : hbClampSlider(sl[1], 5, 8);
    const s3 = mode === 'para' ? hbClampSlider(sl[2], 45, 90) : hbClampSlider(sl[2], 50, 130);
    hbEl('fm-l1').textContent = mode === 'para' ? 'AB' : 'AB = AD';
    hbEl('fm-l2').textContent = mode === 'para' ? 'BC' : 'CB = CD';
    hbEl('fm-l3').textContent = mode === 'para' ? '∠B' : '∠BAD';
    hbEl('fm-v1').textContent = s1;
    hbEl('fm-v2').textContent = s2;
    hbEl('fm-v3').textContent = `${s3}°`;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '同一個圖形，可以同時屬於好幾個家族', C0);

    let pts = null, bad = false;
    if (mode === 'para') {
      const B = hbV(0, 0), C = hbV(s2, 0), A = hbV(s1 * Math.cos(s3 * HB_RAD), s1 * Math.sin(s3 * HB_RAD));
      pts = [A, B, C, hbV(A.x + s2, A.y)];
    } else {
      const al = s3 / 2 * HB_RAD;
      const bo = s1 * Math.sin(al), ao = s1 * Math.cos(al);
      if (s2 * s2 - bo * bo <= 1e-9) bad = true;
      else {
        const oc = Math.sqrt(s2 * s2 - bo * bo);
        pts = [hbV(0, ao), hbV(-bo, 0), hbV(0, -oc), hbV(bo, 0)];
      }
    }
    let F = null;
    if (!bad) {
      const k0 = Math.max(...pts.map(p => p.y)) - Math.min(...pts.map(p => p.y));
      const k = Math.min(16, 150 / k0);
      const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const P = sqMap(270 - cx * k, 134 + cy * k, k);
      const q = pts.map(p => P(p.x, p.y));
      F = sqFamily(mode, s1, s2, s3);
      sqQuad(ctx, q, ['A', 'B', 'C', 'D'], { fill: C0, alpha: 0.16, labelDist: 15 });
      if (mode === 'para') {
        if (s3 === 90) sqRight(ctx, q[1], q[0], q[2], RD_WHITE, 10);
        else hbAngle(ctx, q[1], q[2], q[0], 20, RD_YELLOW, { alpha: 0.3 });
      } else {
        hbSeg(ctx, q[0], q[2], RD_YELLOW, 1.4, [5, 4]);
        hbSeg(ctx, q[1], q[3], RD_BLUE_LT, 1.4, [5, 4]);
        if (s3 === 90) sqRight(ctx, q[0], q[1], q[3], RD_WHITE, 10);
        else hbAngle(ctx, q[0], q[1], q[3], 20, RD_YELLOW, { alpha: 0.3 });
      }
    } else {
      textCenter(ctx, `CB = ${s2} 太短：比 B 到對稱軸的距離還短，C 點找不到`, 270, 134, RD_NO, f(800, 15));
    }

    // 家族圖：上面是大家族，往下越來越特殊；箭頭讀作「是一種」
    SQ_EDGES.forEach(e => {
      const p = SQ_NODES[e[0]], c = SQ_NODES[e[1]];
      const on = F && F.lit[e[0]] && F.lit[e[1]];
      hbSeg(ctx, hbV(p.x, p.y + 14), hbV(c.x, c.y - 14), on ? C0 : 'rgba(203,213,225,0.25)', on ? 2.4 : 1.3);
    });
    Object.keys(SQ_NODES).forEach(key => {
      const nd = SQ_NODES[key];
      sqNode(ctx, nd.x, nd.y, key === 'para' ? 104 : 84, 28, nd.t, !!(F && F.lit[key]), C0);
    });
    const names = F ? Object.keys(SQ_NODES).filter(k2 => F.lit[k2]).map(k2 => SQ_NODES[k2].t) : [];
    hbFitLine(ctx, F ? `它是${F.name}，也是：${names.filter(t => t !== F.name).join('、')}` : '畫不出來的四邊形，哪個家族都不屬於', 446, F ? RD_YELLOW : RD_NO, 15.5);

    out.innerHTML = F ? `目前：${F.name}` : '目前：畫不出來';
    let msg;
    if (!F) msg = '箏形的下半邊要夠長，才接得起來。';
    else if (F.name === '正方形') msg = '正方形同時是<strong>長方形、菱形，也是平行四邊形</strong>：這三個家族的性質它都有。';
    else if (F.name === '長方形') msg = '長方形是平行四邊形；要再加上<strong>四邊相等</strong>才是正方形。';
    else if (F.name === '菱形') msg = mode === 'kite' ? '把兩組鄰邊調成一樣長，四個邊都相等，就成了菱形：兩雙對邊分別相等，所以它是<strong>平行四邊形</strong>。' : '菱形四邊相等：兩雙對邊分別相等，所以它是<strong>平行四邊形</strong>；要再加上四個直角才是正方形。';
    else if (F.name === '平行四邊形') msg = '一般的平行四邊形：對邊相等、對角線互相平分，但不是長方形也不是菱形。';
    else msg = '一般的箏形只有兩雙<strong>鄰邊</strong>相等，對邊不平行，不是平行四邊形。梯形只有一雙對邊平行，所以平行四邊形也不是梯形。';
    fb.innerHTML = wrapFeedback(msg);
    typeset([fb]);
  }

  sl.forEach(s => s.addEventListener('input', draw));
  bindPickGroup(hbEl('fm-mode-group'), 'data-fm-mode', v => {
    mode = v;
    // 箏形模式讓 CB 一定不短於 AB（AB = AD：2～5，CB = CD：5～8），下半邊才一定接得起來；
    // 兩邊都調到 5 時四邊相等，就是菱形
    const R = mode === 'para'
      ? [[2, 8, 6], [2, 8, 4], [45, 90, 70]]
      : [[2, 5, 3], [5, 8, 6], [50, 130, 80]];
    R.forEach((r, i) => { sl[i].min = r[0]; sl[i].max = r[1]; sl[i].value = r[2]; });
    draw();
  });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：梯形兩腰中點的連線段——平行兩底、長度是兩底和的一半
   B(0, 0)、C(b, 0)、A(s, 6)、D(s + a, 6)
   ========================================================================== */
function initMidCanvas() {
  const cv = hbEl('canvas-mid');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('md-a'), sb = hbEl('md-b'), ss = hbEl('md-s');
  const out = hbEl('md-formula'), fb = hbEl('md-feedback');
  const C0 = RD_TONE[7];
  let mode = 'mid';

  function draw() {
    const W = cv.width, H = cv.height;
    const a = hbClampSlider(sa, 2, 10);
    const b = hbClampSlider(sb, a + 1, 16);
    const s = hbClampSlider(ss, 0, 6);
    hbEl('md-va').textContent = a;
    hbEl('md-vb').textContent = b;
    hbEl('md-vs').textContent = s;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, mode === 'mid' ? '兩個一樣的梯形拼成平行四邊形' : '兩腰四等分：一條一條往下算', C0);
    const h = 6;
    const raw = { A: hbV(s, h), B: hbV(0, 0), C: hbV(b, 0), D: hbV(s + a, h) };
    const Fm = hbV((raw.D.x + raw.C.x) / 2, h / 2);
    const rot = p => hbV(2 * Fm.x - p.x, 2 * Fm.y - p.y);
    const all = mode === 'mid' ? [raw.A, raw.B, raw.C, raw.D, rot(raw.A), rot(raw.B)] : [raw.A, raw.B, raw.C, raw.D];
    const xs = all.map(p => p.x);
    const span = Math.max(...xs) - Math.min(...xs);
    const k = Math.min(24, 440 / span, 200 / h);
    const P = sqMap(270 - (Math.min(...xs) + Math.max(...xs)) / 2 * k, 178 + h / 2 * k, k);
    const A = P(raw.A.x, raw.A.y), B = P(raw.B.x, raw.B.y), C = P(raw.C.x, raw.C.y), D = P(raw.D.x, raw.D.y);
    const E = P(s / 2, h / 2), F = P(Fm.x, Fm.y);
    const m = (a + b) / 2;

    if (mode === 'mid') {
      const A2 = P(rot(raw.A).x, rot(raw.A).y), B2 = P(rot(raw.B).x, rot(raw.B).y);
      const E2 = P(rot(hbV(s / 2, h / 2)).x, h / 2);
      hbPoly(ctx, [D, C, A2, B2], RD_BLUE_LT, 0.12, 0.01);
      ctx.save();
      ctx.setLineDash([6, 5]);
      hbPoly(ctx, [D, C, A2, B2], RD_BLUE_LT, 0, 2);
      ctx.restore();
      hbSeg(ctx, F, E2, RD_BLUE_LT, 2.4, [6, 5]);
      cgLabel(ctx, A2, "A'", RD_BLUE_LT, 0, 18, fi(800, 15));
      cgLabel(ctx, B2, "B'", RD_BLUE_LT, 0, -18, fi(800, 15));
      cgLabel(ctx, E2, "E'", RD_BLUE_LT, 16, 0, fi(800, 15));
      const G = sqQuad(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], { fill: C0, alpha: 0.16 });
      hbSeg(ctx, E, F, C0, 3.2);
      hbTick(ctx, A, E, 1, RD_WHITE); hbTick(ctx, E, B, 1, RD_WHITE);
      hbTick(ctx, D, F, 2, RD_WHITE); hbTick(ctx, F, C, 2, RD_WHITE);
      cgLabel(ctx, E, 'E', RD_WHITE, -16, 0, fi(800, 15));
      cgLabel(ctx, F, 'F', RD_WHITE, -2, -16, fi(800, 15));
      hbSideLabel(ctx, A, D, G, String(a), RD_WHITE, 16);
      hbSideLabel(ctx, B, C, G, String(b), RD_WHITE, 16);
      hbFitLine(ctx, '藍色是把梯形繞 F 轉半圈的那一份：C、D 對調，A、B 跑到右邊', 340, MUTED, 13.5);
      hbFitLine(ctx, `拼起來的平行四邊形，底 = AD + BC = ${a} + ${b} = ${a + b}`, 370, RD_BLUE_LT, 15.5);
      hbFitLine(ctx, `EE' 也是 ${a + b}，而 EF 剛好是它的一半`, 400, RD_WHITE, 15.5);
      hbFitLine(ctx, `EF ∥ BC，EF = ½(${a} + ${b}) = ${numStr(m)}`, 434, C0, 17.5);
      out.innerHTML = wbrEq(`\\overline{EF} = \\frac{${a} + ${b}}{2} = ${numStr(m)}`);
      fb.innerHTML = wrapFeedback('兩腰中點的連線段<strong>平行上下底</strong>，長度是<strong>兩底和的一半</strong>——不是兩底差的一半。');
    } else {
      const G = sqQuad(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], { fill: C0, alpha: 0.12 });
      const names = [['E', 'H'], ['F', 'I'], ['G', 'J']];
      const len = [1, 2, 3].map(i => a + (b - a) * i / 4);
      for (let i = 1; i <= 3; i++) {
        const t = i / 4;
        const L = hbV(A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t);
        const R = hbV(D.x + (C.x - D.x) * t, D.y + (C.y - D.y) * t);
        hbSeg(ctx, L, R, i === 2 ? C0 : RD_YELLOW, i === 2 ? 3 : 2.2);
        cgLabel(ctx, L, names[i - 1][0], RD_WHITE, -15, 0, fi(800, 14));
        cgLabel(ctx, R, names[i - 1][1], RD_WHITE, 15, 0, fi(800, 14));
        cgLabel(ctx, hbV((L.x + R.x) / 2, L.y), numStr(len[i - 1]), i === 2 ? C0 : RD_YELLOW, 0, -10, f(800, 13));
      }
      hbSideLabel(ctx, A, D, G, String(a), RD_WHITE, 16);
      hbSideLabel(ctx, B, C, G, String(b), RD_WHITE, 16);
      hbFitLine(ctx, `FI = ½(AD + BC) = ½(${a} + ${b}) = ${numStr(len[1])}`, 340, C0, 16);
      hbFitLine(ctx, `EH 是梯形 AFID 的中點連線：½(${a} + ${numStr(len[1])}) = ${numStr(len[0])}`, 372, RD_YELLOW, 15);
      hbFitLine(ctx, `GJ 是梯形 FBCI 的中點連線：½(${numStr(len[1])} + ${b}) = ${numStr(len[2])}`, 404, RD_YELLOW, 15);
      hbFitLine(ctx, `由上往下：${a}、${numStr(len[0])}、${numStr(len[1])}、${numStr(len[2])}、${b}，每次多 ${numStr((b - a) / 4)}`, 436, MUTED, 14.5);
      out.innerHTML = `\\(\\overline{EH} = ${numStr(len[0])}\\)、<wbr>\\(\\overline{FI} = ${numStr(len[1])}\\)、<wbr>\\(\\overline{GJ} = ${numStr(len[2])}\\)`;
      fb.innerHTML = wrapFeedback('先算正中間的 \\(\\overline{FI}\\)，再把上半、下半各看成一個新的梯形，<strong>再用一次中點連線段性質</strong>。');
    }
    typeset([out, fb]);
  }

  [sa, sb, ss].forEach(x => x.addEventListener('input', draw));
  bindPickGroup(hbEl('md-mode-group'), 'data-md-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：梯形面積 = 兩腰中點連線段 × 高；平分梯形面積的線段
   B(0, 0)、C(b, 0)、A(s, h)、D(s + a, h)
   ========================================================================== */
function initTareaCanvas() {
  const cv = hbEl('canvas-tarea');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('ta-a'), sb = hbEl('ta-b'), sh = hbEl('ta-h'), ss = hbEl('ta-s');
  const out = hbEl('ta-formula'), fb = hbEl('ta-feedback');
  const C0 = RD_TONE[8];
  let mode = 'area';

  function draw() {
    const W = cv.width, H = cv.height;
    const a = hbClampSlider(sa, 1, 10);
    const b = hbClampSlider(sb, a + 1, 16);
    const h = hbClampSlider(sh, 2, 8);
    const s = hbClampSlider(ss, 0, 6);
    hbEl('ta-va').textContent = a;
    hbEl('ta-vb').textContent = b;
    hbEl('ta-vh').textContent = h;
    hbEl('ta-vs').textContent = s;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, mode === 'area' ? '剪下兩角補過去：梯形變成長方形' : '哪一條線段把梯形分成面積相等的兩塊？', C0);
    const raw = [hbV(s, h), hbV(0, 0), hbV(b, 0), hbV(s + a, h)];
    const xs = raw.map(p => p.x);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const k = Math.min(26, 420 / (x1 - x0), 210 / h);
    const P = sqMap(270 - (x0 + x1) / 2 * k, 180 + h / 2 * k, k);
    const [A, B, C, D] = raw.map(p => P(p.x, p.y));
    const m = (a + b) / 2, S = m * h;

    if (mode === 'area') {
      const eX = s / 2, fX = (s + a + b) / 2;
      const E = P(eX, h / 2), F = P(fX, h / 2);
      const P1 = P(eX, h), Q1 = P(eX, 0), P2 = P(fX, h), Q2 = P(fX, 0);
      hbPoly(ctx, [Q1, Q2, P2, P1], C0, 0.08, 0.01);
      sqQuad(ctx, [A, B, C, D], null, { fill: RD_WHITE, alpha: 0.05 });
      // 左右兩對全等三角形：梯形裡剪下的（實心）與補上去的（虛框）
      hbPoly(ctx, [B, Q1, E], RD_RED_LT, 0.4, 0.01);
      hbPoly(ctx, [A, P1, E], RD_RED_LT, 0.12, 0.01);
      hbPoly(ctx, [C, Q2, F], RD_BLUE_LT, 0.4, 0.01);
      hbPoly(ctx, [D, P2, F], RD_BLUE_LT, 0.12, 0.01);
      ctx.save();
      ctx.setLineDash([6, 5]);
      hbPoly(ctx, [Q1, Q2, P2, P1], C0, 0, 2);
      ctx.restore();
      const G = sqQuad(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], { alpha: 0 });
      hbSeg(ctx, E, F, RD_YELLOW, 3);
      cgLabel(ctx, E, 'E', RD_WHITE, -15, 0, fi(800, 15));
      cgLabel(ctx, F, 'F', RD_WHITE, 15, 0, fi(800, 15));
      cgLabel(ctx, hbV((E.x + F.x) / 2, E.y), `m = ${numStr(m)}`, RD_YELLOW, 0, -12, f(800, 14));
      hbSideLabel(ctx, A, D, G, String(a), RD_WHITE, 16);
      hbSideLabel(ctx, B, C, G, String(b), RD_WHITE, 16);
      cgLabel(ctx, hbV(Math.max(Q2.x, C.x, D.x), (P2.y + Q2.y) / 2), `h = ${h}`, C0, 38, 0, f(800, 14));
      hbFitLine(ctx, `m = EF = ½(${a} + ${b}) = ${numStr(m)}`, 344, RD_YELLOW, 16);
      hbFitLine(ctx, `面積 = (上底 + 下底) × 高 ÷ 2 = (${a} + ${b}) × ${h} ÷ 2 = ${numStr(S)}`, 374, RD_WHITE, 15);
      hbFitLine(ctx, `= 中點連線段 × 高 = ${numStr(m)} × ${h} = ${numStr(S)}`, 404, C0, 17);
      hbFitLine(ctx, `反過來：BC = 2EF − AD = 2 × ${numStr(m)} − ${a} = ${b}`, 436, MUTED, 14.5);
      out.innerHTML = `面積：<wbr>` + wbrEq(`${numStr(m)} \\times ${h} = ${numStr(S)}`);
      fb.innerHTML = wrapFeedback('紅、藍兩對三角形各自全等：剪下來繞 \\(E\\)、\\(F\\) 轉半圈補上去，梯形就變成<strong>寬 \\(m\\)、高 \\(h\\) 的長方形</strong>。');
    } else {
      const Pm = P(s + a / 2, h), Qm = P(b / 2, 0);
      const left = [raw[0], raw[1], hbV(b / 2, 0), hbV(s + a / 2, h)];
      const right = [hbV(s + a / 2, h), hbV(b / 2, 0), raw[2], raw[3]];
      hbPoly(ctx, left.map(p => P(p.x, p.y)), C0, 0.28, 0.01);
      hbPoly(ctx, right.map(p => P(p.x, p.y)), RD_BLUE_LT, 0.22, 0.01);
      const G = sqQuad(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], { alpha: 0 });
      hbSeg(ctx, Pm, Qm, RD_YELLOW, 3);
      cgLabel(ctx, Pm, 'P', RD_YELLOW, 0, -16, fi(800, 15));
      cgLabel(ctx, Qm, 'Q', RD_YELLOW, 0, 16, fi(800, 15));
      // BC 的中垂線（紅虛線）
      const pv = sqClipLeft(raw, b / 2);
      const L = hbPolyArea(pv), Rr = S - L;
      hbSeg(ctx, P(b / 2, 0), P(b / 2, h + 0.6), RD_RED_LT, 2, [6, 5]);
      sqRight(ctx, Qm, C, P(b / 2, h), RD_RED_LT, 9);
      hbSideLabel(ctx, A, D, G, String(a), RD_WHITE, 16);
      hbSideLabel(ctx, B, C, G, String(b), RD_WHITE, 26);
      const iso = (2 * s === b - a);
      hbFitLine(ctx, `PQ 連接兩底中點：兩塊都是上底 ${numStr(a / 2)}、下底 ${numStr(b / 2)}、高 ${h} 的梯形`, 344, RD_YELLOW, 14.5);
      hbFitLine(ctx, `兩塊面積都是 ½ × (${numStr(a / 2)} + ${numStr(b / 2)}) × ${h} = ${numStr(S / 2)}`, 374, C0, 16.5);
      hbFitLine(ctx, `BC 的中垂線（紅虛線）：左 ${numStr(Math.round(L * 100) / 100)}、右 ${numStr(Math.round(Rr * 100) / 100)}，${iso ? '相等' : '不相等'}`, 406, RD_RED_LT, 15);
      hbFitLine(ctx, iso ? '兩腰相等（等腰梯形）時，中垂線剛好就是 PQ' : '兩腰不相等時，中垂線不會經過上底的中點', 436, MUTED, 14.5);
      out.innerHTML = `兩塊各 \\(${numStr(S / 2)}\\)，<wbr>中垂線分出 \\(${numStr(Math.round(L * 100) / 100)}\\) 與 \\(${numStr(Math.round(Rr * 100) / 100)}\\)`;
      fb.innerHTML = wrapFeedback('連接<strong>上底中點與下底中點</strong>，兩塊的高一樣、上下底的和也一樣，面積一定相等；只取下底的中垂線，上底不一定被平分。');
    }
    typeset([out, fb]);
  }

  [sa, sb, sh, ss].forEach(x => x.addEventListener('input', draw));
  bindPickGroup(hbEl('ta-mode-group'), 'data-ta-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：等腰梯形的兩底角相等；它是線對稱圖形
   AD = a、BC = c，∠B = ∠C = x；高 = (c − a)/2 × tan x
   ========================================================================== */
function initIsoCanvas() {
  const cv = hbEl('canvas-iso');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sx = hbEl('is-x'), sa = hbEl('is-a'), sc = hbEl('is-c');
  const out = hbEl('is-formula'), fb = hbEl('is-feedback');
  const C0 = RD_TONE[9];
  let mode = 'ang';

  function draw() {
    const W = cv.width, H = cv.height;
    const x = hbClampSlider(sx, 30, 85);
    const a = hbClampSlider(sa, 2, 8);
    const c = hbClampSlider(sc, a + 1, 14);
    hbEl('is-vx').textContent = x;
    hbEl('is-va').textContent = a;
    hbEl('is-vc').textContent = c;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, mode === 'ang' ? '等腰梯形：兩底角相等' : '對稱軸與兩條高：△ABE ≅ △DCF', C0);
    const e = (c - a) / 2, hh = e * Math.tan(x * HB_RAD);
    const raw = [hbV(e, hh), hbV(0, 0), hbV(c, 0), hbV(e + a, hh), hbV(e, 0), hbV(e + a, 0)];
    const p = hbFit(raw.map(v => hbV(v.x, -v.y)), { x: 110, y: 76, w: 320, h: 214 });
    const [A, B, C, D, E, F] = p;
    const G = hbCentroid([A, B, C, D]);

    if (mode === 'axis') {
      hbPoly(ctx, [A, B, E], RD_BLUE_LT, 0.3, 0.01);
      hbPoly(ctx, [D, C, F], RD_BLUE_LT, 0.3, 0.01);
    }
    sqQuad(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], { fill: C0, alpha: 0.1 });
    hbTick(ctx, A, B, 1, C0);
    hbTick(ctx, D, C, 1, C0);
    if (mode === 'ang') {
      const big = 180 - x;
      hbAngle(ctx, B, C, A, 26, RD_YELLOW, { alpha: 0.32, label: `${x}°`, lr: 46, font: f(800, 14) });
      hbAngle(ctx, C, D, B, 26, RD_YELLOW, { alpha: 0.32, label: `${x}°`, lr: 46, font: f(800, 14) });
      hbAngle(ctx, A, B, D, 22, RD_BLUE_LT, { alpha: 0.32, label: `${big}°`, lr: 42, font: f(800, 14) });
      hbAngle(ctx, D, A, C, 22, RD_BLUE_LT, { alpha: 0.32, label: `${big}°`, lr: 42, font: f(800, 14) });
      hbFitLine(ctx, `∠B = ∠C = ${x}°`, 334, RD_YELLOW, 17);
      hbFitLine(ctx, `AD ∥ BC ⇒ ∠A = 180° − ∠B = 180° − ${x}° = ${big}°`, 366, RD_BLUE_LT, 15.5);
      hbFitLine(ctx, `∠D = ∠A = ${big}°（上底的兩個角也相等）`, 398, RD_BLUE_LT, 15.5);
      hbFitLine(ctx, `四個角的和：2 × ${x}° + 2 × ${big}° = 360°`, 432, MUTED, 14.5);
      out.innerHTML = wbrEq(`\\angle A = \\angle D = 180^\\circ - ${x}^\\circ = ${big}^\\circ`);
      fb.innerHTML = wrapFeedback('等腰梯形的定義是「兩腰相等」；<strong>兩底角相等</strong>是由全等推出來的性質。');
    } else {
      const top = hbV((A.x + D.x) / 2, A.y - 14), bot = hbV((B.x + C.x) / 2, B.y + 26);
      hbSeg(ctx, top, bot, RD_YELLOW, 2, [7, 5]);
      cgLabel(ctx, top, 'L', RD_YELLOW, 12, 2, fi(800, 15));
      hbSeg(ctx, A, E, RD_WHITE, 2, [4, 4]);
      hbSeg(ctx, D, F, RD_WHITE, 2, [4, 4]);
      sqRight(ctx, E, A, C, RD_WHITE, 9);
      sqRight(ctx, F, D, B, RD_WHITE, 9);
      cgLabel(ctx, E, 'E', RD_WHITE, 0, 18, fi(800, 15));
      cgLabel(ctx, F, 'F', RD_WHITE, 0, 18, fi(800, 15));
      hbTick(ctx, B, E, 2, RD_BLUE_LT);
      hbTick(ctx, F, C, 2, RD_BLUE_LT);
      const be = numStr(e);
      hbFitLine(ctx, 'AE = DF（平行線間的距離處處相等）', 334, RD_WHITE, 15.5);
      hbFitLine(ctx, 'AB = DC、∠AEB = ∠DFC = 90° ⇒ △ABE ≅ △DCF（RHS）', 366, RD_BLUE_LT, 15);
      hbFitLine(ctx, `得 ∠B = ∠C，BE = CF = (${c} − ${a}) ÷ 2 = ${be}`, 398, RD_YELLOW, 16);
      hbFitLine(ctx, 'L 是對稱軸，也是上底、下底的中垂線', 432, MUTED, 14.5);
      out.innerHTML = wbrEq(`\\overline{BE} = \\overline{CF} = \\frac{${c} - ${a}}{2} = ${be}`);
      fb.innerHTML = wrapFeedback('從上底兩端作高，兩邊切下的直角三角形<strong>全等</strong>：\\(\\overline{BE} = \\overline{CF}\\) 是兩底差的一半，解題時很常用。');
    }
    typeset([out, fb]);
  }

  [sx, sa, sc].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(hbEl('is-mode-group'), 'data-is-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 11：等腰梯形的兩條對角線等長；作高求對角線長
   B(0, 0)、C(b, 0)、A((b − a)/2, h)、D((b + a)/2, h)；P、Q 是 A、D 的垂足
   ========================================================================== */
function initIsodCanvas() {
  const cv = hbEl('canvas-isod');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('id-a'), sb = hbEl('id-b'), sh = hbEl('id-h');
  const out = hbEl('id-formula'), fb = hbEl('id-feedback');
  const C0 = RD_TONE[10];
  let mode = 'len';

  function draw() {
    const W = cv.width, H = cv.height;
    const a = hbClampSlider(sa, 2, 10);
    const b = hbClampSlider(sb, a + 1, 16);
    const h = hbClampSlider(sh, 2, 8);
    hbEl('id-va').textContent = a;
    hbEl('id-vb').textContent = b;
    hbEl('id-vh').textContent = h;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, mode === 'len' ? '作高，用畢氏定理求對角線' : '△ABC ≅ △DCB（SAS）：兩條對角線等長', C0);
    const k = Math.min(24, 400 / b, 200 / h);
    const P = sqMap(270 - b / 2 * k, 178 + h / 2 * k, k);
    const bp = (b - a) / 2, bq = (a + b) / 2;
    const A = P(bp, h), B = P(0, 0), C = P(b, 0), D = P(bq, h), Pp = P(bp, 0), Q = P(bq, 0);
    // BD² = h² + ((a + b)/2)² = (4h² + (a + b)²) / 4
    const n4 = 4 * h * h + (a + b) * (a + b);
    const R = sqHalfRoot(n4);
    const N = h * h + bq * bq;

    if (mode === 'len') {
      hbPoly(ctx, [B, Q, D], C0, 0.3, 0.01);
      const G = sqQuad(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], { alpha: 0.05 });
      hbTick(ctx, A, B, 1, RD_WHITE);
      hbTick(ctx, D, C, 1, RD_WHITE);
      hbSeg(ctx, A, C, RD_YELLOW, 2.4);
      hbSeg(ctx, B, D, C0, 3);
      hbSeg(ctx, A, Pp, RD_BLUE_LT, 2, [4, 4]);
      hbSeg(ctx, D, Q, RD_BLUE_LT, 2, [4, 4]);
      sqRight(ctx, Pp, A, C, RD_BLUE_LT, 9);
      sqRight(ctx, Q, D, B, RD_BLUE_LT, 9);
      cgLabel(ctx, Pp, 'P', RD_WHITE, 0, 18, fi(800, 15));
      cgLabel(ctx, Q, 'Q', RD_WHITE, 0, 18, fi(800, 15));
      cgLabel(ctx, hbV(Q.x, (Q.y + D.y) / 2), String(h), RD_BLUE_LT, 13, 0, f(800, 14));
      hbSideLabel(ctx, A, D, G, String(a), RD_WHITE, 16);
      cgLabel(ctx, hbV((B.x + C.x) / 2, B.y), String(b), RD_WHITE, 0, 38, f(800, 15));
      hbFitLine(ctx, `BP = CQ = (${b} − ${a}) ÷ 2 = ${numStr(bp)}`, 344, RD_BLUE_LT, 16);
      hbFitLine(ctx, `BQ = BP + PQ = ${numStr(bp)} + ${a} = ${numStr(bq)}`, 374, RD_WHITE, 16);
      hbFitLine(ctx, `BD² = DQ² + BQ² = ${h}² + ${numStr(bq)}² = ${numStr(N)}`, 404, RD_WHITE, 16);
      hbFitLine(ctx, `AC = BD = ${R.exact ? R.txt : `${R.txt} ≈ ${R.val.toFixed(2)}`}`, 436, C0, 17.5);
      out.innerHTML = wbrEq(`\\overline{AC} = \\overline{BD} = \\sqrt{${h}^2 + ${numStr(bq)}^2} = ${R.tex}`);
      fb.innerHTML = wrapFeedback('\\(\\overline{BQ}\\) 剛好等於<strong>兩底和的一半</strong>；畫出高之後，對角線就是直角三角形的斜邊。');
    } else {
      hbPoly(ctx, [A, B, C], RD_YELLOW, 0.16, 0.01);
      hbPoly(ctx, [D, C, B], RD_BLUE_LT, 0.16, 0.01);
      const G = sqQuad(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], { alpha: 0 });
      hbSeg(ctx, A, C, RD_YELLOW, 3);
      hbSeg(ctx, B, D, RD_BLUE_LT, 3);
      hbTick(ctx, A, B, 1, RD_WHITE);
      hbTick(ctx, D, C, 1, RD_WHITE);
      hbAngle(ctx, B, C, A, 24, C0, { alpha: 0.35 });
      hbAngle(ctx, C, D, B, 24, C0, { alpha: 0.35 });
      hbFitLine(ctx, 'AB = DC（等腰）', 344, RD_WHITE, 16);
      hbFitLine(ctx, '∠ABC = ∠DCB（兩底角相等）', 374, C0, 16);
      hbFitLine(ctx, 'BC = CB（共用邊）', 404, RD_WHITE, 16);
      hbFitLine(ctx, `⇒ △ABC ≅ △DCB（SAS），AC = DB = ${R.exact ? R.txt : `${R.txt} ≈ ${R.val.toFixed(2)}`}`, 436, RD_YELLOW, 16);
      out.innerHTML = wbrEq(`\\overline{AC} = \\overline{DB} = ${R.tex}`);
      fb.innerHTML = wrapFeedback('等腰梯形的<strong>兩條對角線等長</strong>；但它們<strong>不互相平分</strong>（交點不在對角線的中點）。');
    }
    typeset([out, fb]);
  }

  [sa, sb, sh].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(hbEl('id-mode-group'), 'data-id-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 12：兩底角相等的梯形是等腰梯形
   B(0, 0)、C(10, 0)、高 4；A 由 ∠B 決定、D 由 ∠C 決定；DE ∥ AB
   ========================================================================== */
function initIsojCanvas() {
  const cv = hbEl('canvas-isoj');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sB = hbEl('ij-b'), sC = hbEl('ij-c');
  const out = hbEl('ij-formula'), fb = hbEl('ij-feedback');
  const C0 = RD_TONE[11];

  function draw() {
    const W = cv.width, H = cv.height;
    const bb = hbClampSlider(sB, 40, 140), cc = hbClampSlider(sC, 40, 140);
    hbEl('ij-vb').textContent = bb;
    hbEl('ij-vc').textContent = cc;
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '過 D 作 DE ∥ AB，看 △DEC', C0);
    const Hh = 4, Wb = 10;
    const ax = Hh / Math.tan(bb * HB_RAD), dx = Wb - Hh / Math.tan(cc * HB_RAD);
    const ad = dx - ax;
    const para = (bb + cc === 180);
    const k = 22;
    const P = sqMap(270 - Wb / 2 * k, 196, k);
    const B = P(0, 0), C = P(Wb, 0);

    if (ad <= 0.05) {
      hbSeg(ctx, B, C, RD_WHITE, 3);
      cgLabel(ctx, B, 'B', RD_WHITE, -12, 12, fi(800, 16));
      cgLabel(ctx, C, 'C', RD_WHITE, 12, 12, fi(800, 16));
      hbFitLine(ctx, `∠B = ${bb}°、∠C = ${cc}° 太小：兩腰在碰到上底之前就交在一起了`, 330, RD_NO, 15.5);
      hbFitLine(ctx, '畫不出梯形——把其中一個角調大一點', 366, MUTED, 15);
      out.innerHTML = '畫不出梯形';
      fb.innerHTML = wrapFeedback('兩腰往上延伸、在高 \\(4\\) 以內就相交，得到的是三角形，不是梯形。');
      typeset([out, fb]);
      return;
    }
    const A = P(ax, Hh), D = P(dx, Hh);
    // E 在 BC 線上，使 DE ∥ AB：E = D − (A − B)
    const Ex = dx - ax;
    const Em = P(Ex, 0);
    const AB = Hh / Math.sin(bb * HB_RAD), DC = Hh / Math.sin(cc * HB_RAD);
    const AC = Math.hypot(Wb - ax, Hh), BD = Math.hypot(dx, Hh);
    const iso = (bb === cc);

    if (!para) {
      hbPoly(ctx, [D, Em, C], C0, 0.3, 0.01);
      hbSeg(ctx, D, Em, RD_YELLOW, 2.4, [6, 5]);
      cgLabel(ctx, Em, 'E', RD_YELLOW, 0, 18, fi(800, 15));
      hbAngle(ctx, Em, C, D, 22, RD_BLUE_LT, { alpha: 0.32 });
    }
    const G = sqQuad(ctx, [A, B, C, D], ['A', 'B', 'C', 'D'], { fill: C0, alpha: 0.06 });
    hbSeg(ctx, A, D, RD_WHITE, 3);
    hbAngle(ctx, B, C, A, 24, RD_BLUE_LT, { alpha: 0.32, label: `${bb}°`, lr: 42, font: f(800, 13.5) });
    hbAngle(ctx, C, D, B, 24, RD_RED_LT, { alpha: 0.32, label: `${cc}°`, lr: 42, font: f(800, 13.5) });
    if (iso) { hbTick(ctx, A, B, 1, RD_YELLOW); hbTick(ctx, D, C, 1, RD_YELLOW); }

    const tup = `${180 - bb}°, ${bb}°, ${cc}°, ${180 - cc}°`;
    let verdict;
    if (para) {
      hbFitLine(ctx, `∠B + ∠C = ${bb}° + ${cc}° = 180° ⇒ AB ∥ DC`, 330, RD_RED_LT, 15.5);
      hbFitLine(ctx, '兩雙對邊都平行：這是平行四邊形，不是梯形', 362, RD_NO, 16);
      verdict = '平行四邊形';
    } else {
      hbFitLine(ctx, `ABED 是平行四邊形 ⇒ DE = AB，∠DEC = ∠B = ${bb}°（同位角）`, 330, RD_WHITE, 14.5);
      hbFitLine(ctx, iso ? `∠DEC = ∠C = ${cc}° ⇒ △DEC 是等腰三角形 ⇒ DE = DC` : `∠DEC = ${bb}° ≠ ∠C = ${cc}° ⇒ DE ≠ DC`, 362, iso ? RD_OK : RD_RED_LT, 15);
      verdict = iso ? '等腰梯形' : '不是等腰梯形';
    }
    hbFitLine(ctx, `AB ≈ ${AB.toFixed(2)}、DC ≈ ${DC.toFixed(2)}：${verdict}`, 394, iso ? RD_OK : RD_YELLOW, 16.5);
    hbFitLine(ctx, `依 ∠A、∠B、∠C、∠D 的順序：${tup}`, 426, MUTED, 14.5);
    hbFitLine(ctx, `對角線 AC ≈ ${AC.toFixed(2)}、BD ≈ ${BD.toFixed(2)}`, 454, DIM, 13.5);
    out.innerHTML = `\\(\\angle B = ${bb}^\\circ\\)、<wbr>\\(\\angle C = ${cc}^\\circ\\)，<wbr>${verdict}`;
    fb.innerHTML = wrapFeedback(para
      ? '兩個「底角」互補時兩腰平行，四邊形變成平行四邊形——<strong>梯形只能有一雙對邊平行</strong>。'
      : (iso
        ? '<strong>兩底角相等的梯形是等腰梯形</strong>：作 \\(\\overline{DE} \\parallel \\overline{AB}\\)，等腰三角形 \\(DEC\\) 把 \\(\\overline{AB}\\) 搬到 \\(\\overline{DC}\\) 旁邊比。'
        : '底角不相等，\\(\\triangle DEC\\) 不是等腰三角形，兩腰就不相等；對角線也跟著不相等。'));
    typeset([out, fb]);
  }

  [sB, sC].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}
