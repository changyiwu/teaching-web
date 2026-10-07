/* ==========================================================================
   4-3-2（第四冊 3-2）尺規作圖 — 互動 Canvas 與隨堂評量
   畫風：19 世紀手工上色銅版畫博物圖鑑風（小蜜、阿蜂），第 3 章五節共用。
   配色：象牙 CG_INK（已知圖形）、蜂蜜金 CG_HONEY（圓規畫的弧）、
   天藍 CG_SKY（直尺畫的線）、苔綠 CG_MOSS（作出的結果）、
   薰衣草 CG_LAV（菱形、箏形等輔助線）、玫瑰 CG_ROSE（作不出來、錯誤）。

   共用工具在 ../math-canvas.js（f／fi／drawTitle／drawPanel／fitLines／
   textCenter／textLeft／bindPickGroup／typeset／wrapFeedback／clamp…）；
   cg* 平面幾何工具與尺規作圖的「逐步播放引擎」（cgRender／cgSteps／cgSync）
   也在那裡，引擎的配色由本檔呼叫 cgUsePalette() 登記。
   本檔只放本節的色票、cgLine／cgSpan，以及 13 個互動。

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

// 尺規播放引擎的配色（共用檔的 cgUsePalette）
cgUsePalette({
  ink: CG_INK, honey: CG_HONEY, brass: CG_BRASS, brassDk: CG_BRASS_DK,
  tools: { compass: CG_HONEY, ruler: CG_SKY, look: CG_MOSS, warn: CG_ROSE }
});

// 1 公分畫成 40px
const CG_PX = 40;

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const CG_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9', '#fca5a5', '#f0abfc'];

// 公分（一位小數）
function cgCm(px) {
  return (px / CG_PX).toFixed(1);
}

/* ==========================================================================
   1. 本節才用的繪圖元件（其餘 cg* 工具在 math-canvas.js）
   ========================================================================== */

// 通過 a、b 的直線，兩端各多畫 ext px
function cgLine(ctx, a, b, color, ext, w, dash) {
  const d = cgDist(a, b);
  const ux = (b.x - a.x) / d, uy = (b.y - a.y) / d;
  const e = ext == null ? 40 : ext;
  cgSeg(ctx, cgP(a.x - ux * e, a.y - uy * e), cgP(b.x + ux * e, b.y + uy * e), color, w, dash);
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
  const cv = hbEl('canvas-cmp');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sl = hbEl('cmp-cd'), vl = hbEl('cmp-vcd');
  const out = hbEl('cmp-formula'), fb = hbEl('cmp-feedback');
  const st = { k: 1 };
  const AB = 4.5 * CG_PX;

  function draw() {
    const cd = hbIv(sl) / 2;
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
  const cv = hbEl('canvas-cpy');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sLen = hbEl('cpy-len'), sTilt = hbEl('cpy-tilt');
  const vLen = hbEl('cpy-vlen'), vTilt = hbEl('cpy-vtilt');
  const out = hbEl('cpy-formula'), fb = hbEl('cpy-feedback');
  const st = { k: 1 };

  function draw() {
    const len = hbIv(sLen) / 2, tilt = hbIv(sTilt) * 10;
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
  const cv = hbEl('canvas-sum');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('sum-a'), sb = hbEl('sum-b');
  const va = hbEl('sum-va'), vb = hbEl('sum-vb');
  const g = hbEl('sum-mode-group');
  const out = hbEl('sum-formula'), fb = hbEl('sum-feedback');
  const st = { k: 1 };
  let mode = 'add';

  function draw() {
    const a = hbIv(sa) / 2, b = hbIv(sb) / 2;
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
  const cv = hbEl('canvas-tri');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('tri-a'), sb = hbEl('tri-b'), sc = hbEl('tri-c');
  const va = hbEl('tri-va'), vb = hbEl('tri-vb'), vc = hbEl('tri-vc');
  const rowB = hbEl('tri-row-b'), rowC = hbEl('tri-row-c');
  const g = hbEl('tri-mode-group');
  const out = hbEl('tri-formula'), fb = hbEl('tri-feedback');
  const st = { k: 1 };
  let mode = 'sss';

  function draw() {
    const equi = (mode === 'equi');
    rowB.style.display = equi ? 'none' : '';
    rowC.style.display = equi ? 'none' : '';
    const a = hbIv(sa) / 2;
    const b = equi ? a : hbIv(sb) / 2, c = equi ? a : hbIv(sc) / 2;
    va.textContent = a.toFixed(1);
    vb.textContent = (hbIv(sb) / 2).toFixed(1);
    vc.textContent = (hbIv(sc) / 2).toFixed(1);
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
  const cv = hbEl('canvas-ang');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sT = hbEl('ang-t'), sR = hbEl('ang-r');
  const vT = hbEl('ang-vt'), vR = hbEl('ang-vr');
  const out = hbEl('ang-formula'), fb = hbEl('ang-feedback');
  const st = { k: 1 };

  function draw() {
    const th = hbIv(sT) * 5, rr = hbIv(sR) / 2;
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
  const cv = hbEl('canvas-asum');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const s1 = hbEl('asum-1'), s2 = hbEl('asum-2');
  const v1 = hbEl('asum-v1'), v2 = hbEl('asum-v2');
  const g = hbEl('asum-mode-group');
  const out = hbEl('asum-formula'), fb = hbEl('asum-feedback');
  const st = { k: 1 };
  let mode = 'add';

  function draw() {
    const t1 = hbIv(s1) * 5, t2 = hbIv(s2) * 5;
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
  const cv = hbEl('canvas-pb');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sL = hbEl('pb-len'), sR = hbEl('pb-r');
  const vL = hbEl('pb-vlen'), vR = hbEl('pb-vr');
  const g = hbEl('pb-mode-group');
  const out = hbEl('pb-formula'), fb = hbEl('pb-feedback');
  const st = { k: 1 };
  let mode = 'same';

  function draw() {
    const len = hbIv(sL) / 2, kr = hbIv(sR) * 0.05;
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
  const cv = hbEl('canvas-half');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = hbEl('half-k'), vk = hbEl('half-vk');
  const out = hbEl('half-formula'), fb = hbEl('half-feedback');
  const st = { k: 1 };
  const NAMES = ['C', 'D', 'E'];

  function draw() {
    const k = hbIv(sk);
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
  const cv = hbEl('canvas-bis');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sT = hbEl('bis-t'), s1 = hbEl('bis-r1'), s2 = hbEl('bis-r2');
  const vT = hbEl('bis-vt'), v1 = hbEl('bis-vr1'), v2 = hbEl('bis-vr2');
  const out = hbEl('bis-formula'), fb = hbEl('bis-feedback');
  const st = { k: 1 };

  function draw() {
    const th = hbIv(sT) * 10, r1 = hbIv(s1) / 2, fct = hbIv(s2) / 10;
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
  const cv = hbEl('canvas-qb');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = hbEl('qb-k'), vk = hbEl('qb-vk');
  const g = hbEl('qb-t-group');
  const out = hbEl('qb-formula'), fb = hbEl('qb-feedback');
  const st = { k: 1 };
  const NAMES = ['C', 'D', 'E'];
  let th = 90;

  function draw() {
    const k = hbIv(sk);
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
  const cv = hbEl('canvas-pon');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sx = hbEl('pon-x'), s1 = hbEl('pon-r1'), s2 = hbEl('pon-r2');
  const vx = hbEl('pon-vx'), v1 = hbEl('pon-vr1'), v2 = hbEl('pon-vr2');
  const out = hbEl('pon-formula'), fb = hbEl('pon-feedback');
  const st = { k: 1 };

  function draw() {
    const px = hbIv(sx) * 20, r1 = hbIv(s1) / 2, fct = hbIv(s2) / 10;
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
  const cv = hbEl('canvas-poff');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sd = hbEl('poff-d'), s1 = hbEl('poff-r1'), s2 = hbEl('poff-r2');
  const vd = hbEl('poff-vd'), v1 = hbEl('poff-vr1'), v2 = hbEl('poff-vr2');
  const out = hbEl('poff-formula'), fb = hbEl('poff-feedback');
  const st = { k: 1 };

  function draw() {
    const d = hbIv(sd) / 2, r1 = hbIv(s1) / 2, fct = hbIv(s2) / 10;
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
  const cv = hbEl('canvas-alt');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sx = hbEl('alt-ax'), vx = hbEl('alt-vax');
  const g = hbEl('alt-mode-group');
  const out = hbEl('alt-formula'), fb = hbEl('alt-feedback');
  const st = { k: 1 };
  let mode = 'height';

  function draw() {
    const ax = hbIv(sx) * 10;
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
