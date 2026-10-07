/* ==========================================================================
   4-3-1（第四冊 3-1）三角形與多邊形的內角與外角 — 互動 Canvas 與隨堂評量
   畫風：19 世紀手工上色銅版畫博物圖鑑・養蜂花園（小蜜、阿蜂），第 3 章共用。
   配色：蜂蜜金 HB_GOLD、苔綠 HB_MOSS、玫瑰 HB_ROSE、象牙 HB_IVORY。
   角的固定配色（全頁一致）：∠A 玫瑰、∠B 天藍、∠C 苔綠、外角／轉彎角 蜂蜜金。

   共用工具在 ../math-canvas.js（T／IT／SEQ／FR／drawExpr／drawTitle／
   drawStepRows／wbrEq／textCenter／textLeft／bindPickGroup／qIt…），hb* 幾何
   工具（角記號、頂點外推、由角度作三角形）也在那裡。本檔只放本節的色票
   （HB_ 前綴）、本節才用的 hb* 擺位工具與 11 個互動。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();
  hbDrawWithFonts(initQuizFigs);

  initAngleCanvas();
  initVertCanvas();
  initTriSumCanvas();
  initTurnCanvas();
  initExtSumCanvas();
  initExtThmCanvas();
  initEightCanvas();
  initDartCanvas();
  initNgonCanvas();
  initRegCanvas();
  initFindNCanvas();
});

/* ==========================================================================
   0. 本節調色盤（HB_ = Honey Bee）
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

// 先畫一次，之後每當有網頁字型下載完成就重畫。canvas 用到的字重（fi(800, 18)
// 這類）與 Noto Sans TC 的中文字段，要等第一次被畫到才開始下載，
// document.fonts.ready 不會等它們；只靠 ready，初次畫面會停在替代字型，
// 直到使用者動了控制項才換過來。draw 只依目前狀態重畫，多畫幾次結果相同。
function hbDrawWithFonts(draw) {
  draw();
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', () => draw());
  }
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第四冊 3-1 的 22 題正解
  // 正解字母分布：A 6 題、B 5 題、C 6 題、D 5 題（開發約束 36）
  const answers = {
    '3-1-1': 'C',    // ∠A = 37°，∠B = 53°，∠C = 127°
    '3-1-2': 'B',    // 鈍角的補角一定是銳角
    '3-1-3': 'D',    // 4x + 12 = 6x − 20 → x = 16，∠1 = 76°，∠2 = 104°
    '3-1-4': 'A',    // ∠1 = 47°、∠2 = ∠5 = 71° → ∠3 = 62°
    '3-1-5': 'C',    // 10x + 20 = 180 → x = 16 → 56°, 76°, 48°，最大 76°
    '3-1-6': 'B',    // 3 : 5 : 7 → 36°, 60°, 84° → 銳角三角形
    '3-1-7': 'A',    // 轉彎角 62° + 39° = 101°
    '3-1-8': 'D',    // ∠A = 64° 的兩個外角都是 116°
    '3-1-9': 'C',    // 外角 108°, 138°, 114° → 內角 72°, 42°, 66°，最小 42°
    '3-1-10': 'B',   // 97° + 126° + 137° = 360°
    '3-1-11': 'D',   // ∠A + ∠B = 128°，∠A = 3∠B → ∠A = 96°
    '3-1-12': 'A',   // ∠ADC = 47° + 29° = 76°，∠C = 180° − 76° − 38° = 66°
    '3-1-13': 'C',   // x + 58 = (2x − 26) + 43 → x = 41
    '3-1-14': 'D',   // 五角星五個尖角和 180°：180 − 140 = 40°
    '3-1-15': 'A',   // 鏢形 ∠BCD = 52° + 23° + 31° = 106°
    '3-1-16': 'B',   // 137 − 64 − 41 = 32°
    '3-1-17': 'C',   // 十三邊形 11 × 180° = 1980°
    '3-1-18': 'A',   // 14 個三角形 → n = 16、內角和 2520°
    '3-1-19': 'D',   // 正十八邊形每一內角 160°
    '3-1-20': 'C',   // 正五邊形外角 72°、正八邊形外角 45° → ∠1 = 63°
    '3-1-21': 'B',   // 內角 168° → 外角 12° → n = 30
    '3-1-22': 'A'    // 內角是外角的 9 倍 → 外角 18° → n = 20
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

// 鏢形 ABCD：A 在上、B 左下、D 右下、C 凹進去。AB = AD
function hbDartPts(A, B, D, apex, L) {
  const P = apex;
  const Bp = hbAt(P, 270 - A / 2, L), Dp = hbAt(P, 270 + A / 2, L);
  const Cp = hbCross(Bp, hbUnit(90 - A / 2 - B), Dp, hbUnit(90 + A / 2 + D));
  return { A: P, B: Bp, C: Cp, D: Dp };
}

// 8 字形：AD 與 BC 交於 O，左邊 △AOB、右邊 △COD
function hbEightPts(A, B, C, O, len) {
  const phi = 180 - A - B, D = A + B - C;
  const k = len / Math.max(Math.sin(A * HB_RAD), Math.sin(B * HB_RAD));
  const k2 = len / Math.max(Math.sin(C * HB_RAD), Math.sin(D * HB_RAD));
  return {
    O,
    A: hbAt(O, 180 - phi / 2, k * Math.sin(B * HB_RAD)),
    B: hbAt(O, 180 + phi / 2, k * Math.sin(A * HB_RAD)),
    C: hbAt(O, phi / 2, k2 * Math.sin(D * HB_RAD)),
    D: hbAt(O, -phi / 2, k2 * Math.sin(C * HB_RAD))
  };
}

function hbRegPts(n, center, R, startDeg) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(hbAt(center, startDeg + 360 * i / n, R));
  return out;
}

const HB_QUIZ_FIGS = {
  // 三直線交於 O：∠1 = 47°、∠2 = 71°（＝∠5）、∠3 待求
  q4(ctx, W, H) {
    const O = hbV(W / 2, H / 2 + 4);
    const d = [8, 55, 126];
    const col = [HB_ROSE, HB_SKY, HB_MOSS];
    d.forEach((a, i) => hbSeg(ctx, hbAt(O, a + 180, 100), hbAt(O, a, 100), INK, 2.2));
    const names = ['L', 'M', 'N'];
    d.forEach((a, i) => { const P = hbAt(O, a, 114); textCenter(ctx, names[i], P.x, P.y, MUTED, fi(700, 15)); });
    const sweeps = [47, 71, 62];
    const labs = ['1', '2', '3', '4', '5', '6'];
    for (let i = 0; i < 6; i++) {
      const a0 = d[i % 3] + (i >= 3 ? 180 : 0);
      hbSector(ctx, O, a0, sweeps[i % 3], 24, col[i % 3], { alpha: 0.25, label: labs[i], lr: 38, font: f(800, 13) });
    }
    textLeft(ctx, '∠1 = 47°', 10, 18, HB_ROSE, f(700, 13));
    textLeft(ctx, '∠5 = 71°', 10, 38, HB_SKY, f(700, 13));
  },
  // △ABC，D 在 BC 上
  q12(ctx, W, H) {
    const t = hbTriangle(67, 47, { x: 40, y: 30, w: W - 80, h: H - 66 });
    const Dp = hbCross(t.B, hbUnit(0), t.A, hbUnit(hbHead(t.A, t.B) + 29));
    hbPoly(ctx, [t.A, t.B, t.C], INK, 0.05, 2.2);
    hbSeg(ctx, t.A, Dp, INK, 2.2);
    hbAngle(ctx, t.B, t.A, t.C, 26, HB_SKY, { label: '47°', lr: 44, font: f(800, 13) });
    hbAngle(ctx, t.A, t.B, Dp, 30, HB_ROSE, { label: '29°', lr: 48, font: f(800, 13) });
    hbAngle(ctx, t.A, Dp, t.C, 22, HB_GOLD, { label: '38°', lr: 40, font: f(800, 13) });
    const G = hbCentroid([t.A, t.B, t.C]);
    hbVLabel(ctx, t.A, G, 'A', HB_IVORY);
    hbVLabel(ctx, t.B, G, 'B', HB_IVORY);
    hbVLabel(ctx, t.C, G, 'C', HB_IVORY);
    textCenter(ctx, 'D', Dp.x, Dp.y + 16, HB_IVORY, fi(800, 17));
  },
  // 8 字形：以 x = 41 照實際角度作圖（∠A 41°、∠B 58°、∠C 56°、∠D 43°），只標題目的式子
  q13(ctx, W, H) {
    const p = hbEightPts(41, 58, 56, hbV(W / 2, H / 2 - 4), 92);
    hbSeg(ctx, p.A, p.D, INK, 2.2);
    hbSeg(ctx, p.B, p.C, INK, 2.2);
    hbSeg(ctx, p.A, p.B, INK, 2.2);
    hbSeg(ctx, p.C, p.D, INK, 2.2);
    hbAngle(ctx, p.A, p.O, p.B, 22, HB_ROSE, { label: 'x°', lr: 40, font: f(800, 13) });
    hbAngle(ctx, p.B, p.O, p.A, 20, HB_SKY, { label: '58°', lr: 36, font: f(800, 13) });
    hbAngle(ctx, p.C, p.O, p.D, 22, HB_MOSS, { label: '(2x−26)°', lr: 50, font: f(800, 13) });
    hbAngle(ctx, p.D, p.O, p.C, 20, HB_VIOLET, { label: '43°', lr: 36, font: f(800, 13) });
    const L = [['A', p.A], ['B', p.B], ['C', p.C], ['D', p.D]];
    L.forEach(([s, P]) => hbVLabel(ctx, P, p.O, s, HB_IVORY, 16));
    textCenter(ctx, 'O', p.O.x, p.O.y - 18, HB_IVORY, fi(800, 15));
  },
  // 五角星（示意圖，未依比例）
  q14(ctx, W, H) {
    const c = hbV(W / 2, H / 2 + 8), R = 96;
    const P = hbRegPts(5, c, R, 90);
    const order = [0, 2, 4, 1, 3];
    hbPoly(ctx, order.map(i => P[i]), INK, 0.04, 2.2);
    const names = ['A', 'B', 'C', 'D', 'E'];
    const labs = ['31°', '38°', '42°', '29°', '?'];
    const cols = [HB_ROSE, HB_SKY, HB_MOSS, HB_VIOLET, HB_GOLD];
    // 頂點 i 的兩鄰是星形連線上的 i±2
    for (let i = 0; i < 5; i++) {
      hbAngle(ctx, P[i], P[(i + 2) % 5], P[(i + 3) % 5], 18, cols[i], { label: labs[i], lr: 34, font: f(800, 12.5) });
      hbVLabel(ctx, P[i], c, names[i], HB_IVORY, 14);
    }
    textLeft(ctx, '（示意圖）', 8, H - 12, MUTED, f(600, 11));
  },
  q15(ctx, W, H) {
    hbDartFig(ctx, W, H, 52, 23, 31, ['52°', '23°', '31°', '?']);
  },
  q16(ctx, W, H) {
    hbDartFig(ctx, W, H, 64, 41, 32, ['64°', '41°', '?', '137°']);
  },
  // 正五邊形與正八邊形各有一邊在直線 L 上，兩者有一個頂點重合於 P
  q20(ctx, W, H) {
    // 底角 72°（五邊形外角）與 45°（八邊形外角），兩條斜邊交於 P
    const e5 = 72, e8 = 45, apex = 180 - e5 - e8;
    // 斜邊長：五邊形邊長 s5、八邊形邊長 s8，正弦定理 s5 / sin45 = s8 / sin72
    const s5 = Math.sin(e8 * HB_RAD), s8 = Math.sin(e5 * HB_RAD);
    const Q = hbV(0, 0);                      // 五邊形右下頂點
    const Pp = hbAt(Q, e5, s5);               // 重合的頂點
    const U = hbAt(Pp, 360 - e8, s8);         // 八邊形左下頂點（從 P 往右下）
    const pent = [];
    let cur = Q, h = 180;                     // 五邊形從 Q 往左走（底邊）
    for (let i = 0; i < 5; i++) { pent.push(cur); cur = hbAt(cur, h, s5); h += -72; }
    const oct = [];
    cur = U; h = 0;                           // 八邊形從 U 往右走（底邊）
    for (let i = 0; i < 8; i++) { oct.push(cur); cur = hbAt(cur, h, s8); h += 45; }
    const all = pent.concat(oct, [hbAt(pent[1], 180, 0.25), hbAt(oct[1], 0, 0.25)]);
    const fit = hbFit(all, { x: 14, y: 22, w: W - 28, h: H - 44 });
    const fp = fit.slice(0, 5), fo = fit.slice(5, 13);
    const L0 = fit[13], L1 = fit[14];
    hbSeg(ctx, L0, L1, MUTED, 2);
    textCenter(ctx, 'L', L1.x - 6, L1.y - 10, MUTED, fi(700, 14));
    hbPoly(ctx, fp, HB_ROSE, 0.1, 2.2);
    hbPoly(ctx, fo, HB_SKY, 0.1, 2.2);
    // 五邊形最後一個頂點、八邊形最後一個頂點都是 P；∠1 在 P 點下方、兩條斜邊之間
    const P = fp[4];
    hbAngle(ctx, P, fp[0], fo[0], 18, HB_GOLD, { label: '1', lr: 30, font: f(800, 14) });
    const PL = hbAt(P, 117, 16);
    textCenter(ctx, 'P', PL.x, PL.y, HB_IVORY, fi(800, 15));
    void apex;
  }
};

function hbDartFig(ctx, W, H, A, B, D, labs) {
  const p = hbDartPts(A, B, D, hbV(0, 0), 1);
  const fit = hbFit([p.A, p.B, p.C, p.D], { x: 50, y: 26, w: W - 100, h: H - 52 });
  const q = { A: fit[0], B: fit[1], C: fit[2], D: fit[3] };
  hbPoly(ctx, [q.A, q.B, q.C, q.D], INK, 0.06, 2.2);
  hbAngle(ctx, q.A, q.B, q.D, 22, HB_ROSE, { label: labs[0], lr: 38, font: f(800, 13) });
  hbAngle(ctx, q.B, q.A, q.C, 24, HB_SKY, { label: labs[1], lr: 42, font: f(800, 13) });
  hbAngle(ctx, q.D, q.A, q.C, 24, HB_MOSS, { label: labs[2], lr: 42, font: f(800, 13) });
  hbAngle(ctx, q.C, q.B, q.D, 18, HB_GOLD, { label: labs[3], lr: 34, font: f(800, 13) });
  const G = hbCentroid([q.A, q.B, q.D]);
  hbVLabel(ctx, q.A, G, 'A', HB_IVORY);
  hbVLabel(ctx, q.B, G, 'B', HB_IVORY);
  hbVLabel(ctx, q.D, G, 'D', HB_IVORY);
  textCenter(ctx, 'C', q.C.x, q.C.y - 15, HB_IVORY, fi(800, 17));
}

function initQuizFigs() {
  document.querySelectorAll('canvas.quiz-fig[data-fig]').forEach(cv => {
    const fn = HB_QUIZ_FIGS[cv.getAttribute('data-fig')];
    if (!fn) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    fn(ctx, cv.width, cv.height);
  });
}

/* ==========================================================================
   重點 1：角的分類、餘角與補角
   ========================================================================== */
function hbAngleClass(a) {
  if (a < 90) return '銳角';
  if (a === 90) return '直角';
  if (a < 180) return '鈍角';
  if (a === 180) return '平角';
  if (a < 360) return '凹角';
  return '周角';
}

function initAngleCanvas() {
  const cv = hbEl('canvas-angle');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('an-a'), va = hbEl('an-va');
  const g = hbEl('an-mode-group');
  const out = hbEl('an-formula'), fb = hbEl('an-feedback');
  const lab = hbEl('an-label');
  const C = HB_TONE[0];
  const RANGE = { cls: [5, 360], comp: [5, 85], supp: [5, 175] };
  let mode = 'cls';

  function drawClass(a) {
    const W = cv.width;
    drawTitle(ctx, '角的大小只看兩邊張開多少', C);
    const B = hbV(270, 196);
    const Cp = hbAt(B, 0, 170), Ap = hbAt(B, a, 170);
    hbSector(ctx, B, 0, a, a === 360 ? 40 : 52, HB_ROSE, { alpha: 0.22, right: a === 90 });
    hbSeg(ctx, B, Cp, INK, 3);
    hbSeg(ctx, B, Ap, INK, 3);
    hbDot(ctx, B, HB_IVORY, 4);
    const mid = a >= 330 ? 225 : a / 2 + 180;
    const BL = hbAt(B, mid, 24);
    textCenter(ctx, 'B', BL.x, BL.y, HB_IVORY, fi(800, 18));
    const CL = hbAt(B, 0, 188), AL = hbAt(B, a, 188);
    if (a === 360) {
      textCenter(ctx, 'A', CL.x, CL.y - 14, HB_IVORY, fi(800, 18));
      textCenter(ctx, 'C', CL.x, CL.y + 14, HB_IVORY, fi(800, 18));
    } else {
      textCenter(ctx, 'C', CL.x, CL.y, HB_IVORY, fi(800, 18));
      textCenter(ctx, 'A', AL.x, AL.y, HB_IVORY, fi(800, 18));
    }
    const LP = hbAt(B, a / 2, a === 360 ? 62 : 74);
    textCenter(ctx, `${a}°`, LP.x, LP.y, HB_ROSE, f(800, 16));

    // 分類尺：0°～360°
    const x0 = 50, x1 = 490, y = 384;
    const px = v => x0 + (x1 - x0) * v / 360;
    const zones = [[0, 90, HB_SKY, '銳角'], [90, 180, HB_MOSS, '鈍角'], [180, 360, HB_VIOLET, '凹角']];
    zones.forEach(z => {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = z[2];
      ctx.fillRect(px(z[0]), y - 12, px(z[1]) - px(z[0]), 24);
      ctx.restore();
      textCenter(ctx, z[3], (px(z[0]) + px(z[1])) / 2, y, z[2], f(800, 13));
    });
    [[0, '0°'], [90, '90° 直角'], [180, '180° 平角'], [360, '360° 周角']].forEach(([v, s]) => {
      hbSeg(ctx, hbV(px(v), y - 14), hbV(px(v), y + 14), INK, 2);
      textCenter(ctx, s, Math.min(px(v), x1 - 26), y + 28, MUTED, f(700, 12));
    });
    ctx.save();
    ctx.fillStyle = HB_GOLD;
    ctx.beginPath();
    ctx.moveTo(px(a), y - 15);
    ctx.lineTo(px(a) - 8, y - 29);
    ctx.lineTo(px(a) + 8, y - 29);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    textCenter(ctx, `∠B = ${a}°，是${hbAngleClass(a)}`, W / 2, 438, HB_GOLD, f(800, 17));
  }

  function drawPair(a, total) {
    const W = cv.width;
    const isComp = total === 90;
    drawTitle(ctx, isComp ? '兩角的和是 90°：互為餘角' : '兩角的和是 180°：互為補角', C);
    const B = isComp ? hbV(150, 330) : hbV(270, 290);
    const L = isComp ? 240 : 210;
    const Cp = hbAt(B, 0, L), Up = hbAt(B, total, L), Ap = hbAt(B, a, L - 16);
    const n1 = isComp ? '∠1' : '∠3', n2 = isComp ? '∠2' : '∠4';
    hbSector(ctx, B, 0, a, isComp ? 62 : 54, HB_ROSE, { alpha: 0.26, label: n1, lr: isComp ? 82 : 74, font: f(800, 15) });
    hbSector(ctx, B, a, total - a, isComp ? 96 : 84, HB_SKY, { alpha: 0.2, label: n2, lr: isComp ? 116 : 104, font: f(800, 15) });
    if (isComp) hbSector(ctx, B, 0, 90, 18, HB_GOLD, { alpha: 0.18, right: true });
    hbSeg(ctx, B, Cp, INK, 3);
    hbSeg(ctx, B, Up, INK, 3);
    hbSeg(ctx, B, Ap, HB_IVORY, 3);
    hbDot(ctx, B, HB_IVORY, 4);
    const yt = isComp ? 388 : 362;
    textCenter(ctx, `${n1} = ${a}°，${n2} = ${total - a}°`, W / 2, yt, INK, f(800, 17));
    textCenter(ctx, `${n1} + ${n2} = ${a}° + ${total - a}° = ${total}°`, W / 2, yt + 34, HB_GOLD, f(800, 18));
  }

  function draw() {
    const a = hbClampSlider(sa, RANGE[mode][0], RANGE[mode][1]);
    va.textContent = a;
    lab.textContent = mode === 'cls' ? '∠B' : (mode === 'comp' ? '∠1' : '∠3');
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (mode === 'cls') {
      drawClass(a);
      out.innerHTML = `\\(\\angle B = ${hbDg(a)}\\)，是${hbAngleClass(a)}`;
      const why = {
        '銳角': `\\(0^\\circ \\lt \\angle B \\lt 90^\\circ\\)，所以是<strong>銳角</strong>。`,
        '直角': `\\(\\angle B = 90^\\circ\\)，是<strong>直角</strong>。`,
        '鈍角': `\\(90^\\circ \\lt \\angle B \\lt 180^\\circ\\)，所以是<strong>鈍角</strong>。`,
        '平角': `\\(\\angle B = 180^\\circ\\)，兩邊成一直線，是<strong>平角</strong>。`,
        '凹角': `比平角大、比周角小的角稱為<strong>凹角</strong>；國中階段的角大多在平角以內。`,
        '周角': `\\(\\angle B = 360^\\circ\\)，邊 \\(\\overline{BA}\\) 轉了一整圈回到 \\(\\overline{BC}\\)，是<strong>周角</strong>。`
      };
      fb.innerHTML = wrapFeedback(why[hbAngleClass(a)] + '<br>兩條邊畫得再長，張開的程度不變，角度就不變。');
    } else {
      const total = mode === 'comp' ? 90 : 180;
      const n1 = mode === 'comp' ? '1' : '3', n2 = mode === 'comp' ? '2' : '4';
      drawPair(a, total);
      out.innerHTML = wbrEq(`\\angle ${n1} + \\angle ${n2} = ${hbDg(a)} + ${hbDg(total - a)} = ${hbDg(total)}`);
      fb.innerHTML = wrapFeedback(mode === 'comp'
        ? `\\(\\angle 2 = 90^\\circ - \\angle 1 = ${hbDg(90 - a)}\\)，\\(\\angle 1\\) 與 \\(\\angle 2\\) <strong>互餘</strong>。<br>互餘只看「和是不是 \\(90^\\circ\\)」，兩個角不一定要拼在一起。`
        : `\\(\\angle 4 = 180^\\circ - \\angle 3 = ${hbDg(180 - a)}\\)，\\(\\angle 3\\) 與 \\(\\angle 4\\) <strong>互補</strong>。<br>${a < 90 ? '銳角的補角是鈍角' : (a === 90 ? '直角的補角還是直角' : '鈍角的補角是銳角')}；互補只看「和是不是 \\(180^\\circ\\)」。`);
    }
    typeset([out, fb]);
  }

  sa.addEventListener('input', draw);
  bindPickGroup(g, 'data-an-mode', v => { mode = v; draw(); });
  hbDrawWithFonts(draw);
}

/* ==========================================================================
   重點 2：對頂角
   ========================================================================== */
function initVertCanvas() {
  const cv = hbEl('canvas-vert');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('vt-a'), sb = hbEl('vt-b'), va = hbEl('vt-va'), vb = hbEl('vt-vb');
  const rowB = hbEl('vt-b-row');
  const g = hbEl('vt-mode-group');
  const out = hbEl('vt-formula'), fb = hbEl('vt-feedback');
  const C = HB_TONE[1];
  let mode = 'two';

  function draw() {
    const W = cv.width;
    const three = mode === 'three';
    rowB.style.display = three ? '' : 'none';
    const a = hbClampSlider(sa, 10, three ? 160 : 170);
    const b = three ? hbClampSlider(sb, 10, 170 - a) : 0;
    va.textContent = a;
    vb.textContent = b;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, three ? '三條直線交於同一點 O' : '兩條直線 L、M 交於 O', C);
    const O = hbV(270, 212);
    const base = 12;
    const dirs = three ? [base, base + a, base + a + b] : [base, base + a];
    const sweeps = three ? [a, b, 180 - a - b] : [a, 180 - a];
    const cols = three ? [HB_ROSE, HB_SKY, HB_MOSS] : [HB_ROSE, HB_SKY];
    const m = dirs.length;
    for (let i = 0; i < 2 * m; i++) {
      const k = i % m;
      const a0 = dirs[k] + (i >= m ? 180 : 0);
      hbSector(ctx, O, a0, sweeps[k], 40 + (k % 2) * 12, cols[k], { alpha: 0.24, label: `∠${i + 1}`, lr: 62 + (k % 2) * 14, font: f(800, 14) });
    }
    const names = three ? ['L', 'M', 'N'] : ['L', 'M'];
    dirs.forEach((d, i) => {
      hbSeg(ctx, hbAt(O, d + 180, 160), hbAt(O, d, 160), INK, 2.8);
      const P = hbAt(O, d, 176);
      textCenter(ctx, names[i], P.x, P.y, MUTED, fi(800, 16));
    });
    hbDot(ctx, O, HB_IVORY, 4);
    textCenter(ctx, 'O', O.x - 14, O.y + 16, HB_IVORY, fi(800, 16));

    if (three) {
      const c = 180 - a - b;
      textCenter(ctx, `∠1 = ∠4 = ${a}°　∠2 = ∠5 = ${b}°　∠3 = ∠6 = ${c}°`, W / 2, 400, INK, f(800, 15.5));
      textCenter(ctx, `∠1 + ∠2 + ∠3 = ${a}° + ${b}° + ${c}° = 180°`, W / 2, 434, HB_GOLD, f(800, 16.5));
      out.innerHTML = wbrEq(`\\angle 3 = 180^\\circ - ${hbDg(a)} - ${hbDg(b)} = ${hbDg(c)}`);
      fb.innerHTML = wrapFeedback(`\\(\\angle 1\\) 與 \\(\\angle 4\\)、\\(\\angle 2\\) 與 \\(\\angle 5\\)、\\(\\angle 3\\) 與 \\(\\angle 6\\) 各是同一條直線組出的對頂角，所以相等。<br>\\(\\angle 1\\) 與 \\(\\angle 2\\) 雖然共用頂點 \\(O\\)，卻<strong>不是</strong>對頂角：它們不是同兩條直線相交、不相鄰的一對。`);
    } else {
      textCenter(ctx, `∠1 = ∠3 = ${a}°　∠2 = ∠4 = ${180 - a}°`, W / 2, 400, INK, f(800, 16.5));
      textCenter(ctx, '∠1 + ∠2 = 180°，∠3 + ∠2 = 180°　⇒　∠1 = ∠3', W / 2, 434, HB_GOLD, f(800, 15.5));
      out.innerHTML = `\\(\\angle 1 = \\angle 3 = ${hbDg(a)}\\)，\\(\\angle 2 = \\angle 4 = ${hbDg(180 - a)}\\)`;
      fb.innerHTML = wrapFeedback(`\\(\\angle 1\\) 與 \\(\\angle 3\\) 不相鄰，是一對<strong>對頂角</strong>；\\(\\angle 2\\) 與 \\(\\angle 4\\) 也是。<br>相鄰的兩個角（例如 \\(\\angle 1\\) 與 \\(\\angle 2\\)）拼成一直線，所以互補。`);
    }
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-vt-mode', v => { mode = v; draw(); });
  hbDrawWithFonts(draw);
}

/* ==========================================================================
   重點 3：三角形內角和 180°
   ========================================================================== */
function initTriSumCanvas() {
  const cv = hbEl('canvas-tri');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('ts-a'), sb = hbEl('ts-b'), va = hbEl('ts-va'), vb = hbEl('ts-vb');
  const out = hbEl('ts-formula'), fb = hbEl('ts-feedback');
  const C = HB_TONE[2];

  function draw() {
    const W = cv.width;
    const A = hbClampSlider(sa, 10, 160);
    const B = hbClampSlider(sb, 10, 170 - A);
    const Cc = 180 - A - B;
    va.textContent = A;
    vb.textContent = B;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '拉動兩個角，第三個角跟著變', C);
    const t = hbTriangle(A, B, { x: 70, y: 62, w: 400, h: 176 });
    const r = Math.max(14, Math.min(30, 0.32 * Math.min(hbDist(t.A, t.B), hbDist(t.B, t.C), hbDist(t.A, t.C))));
    hbPoly(ctx, [t.A, t.B, t.C], INK, 0.05, 2.6);
    hbAngle(ctx, t.A, t.B, t.C, r, HB_ROSE, { label: `${A}°`, lr: r + 17, font: f(800, 14) });
    hbAngle(ctx, t.B, t.A, t.C, r, HB_SKY, { label: `${B}°`, lr: r + 17, font: f(800, 14) });
    hbAngle(ctx, t.C, t.A, t.B, r, HB_MOSS, { label: `${Cc}°`, lr: r + 17, font: f(800, 14) });
    const G = hbCentroid([t.A, t.B, t.C]);
    hbVLabel(ctx, t.A, G, 'A', HB_IVORY);
    hbVLabel(ctx, t.B, G, 'B', HB_IVORY);
    hbVLabel(ctx, t.C, G, 'C', HB_IVORY);

    // 撕下三個角，頂點對在一起
    textLeft(ctx, '把三個角撕下來、頂點對在一起：', 36, 282, MUTED, f(700, 13.5));
    const P = hbV(270, 392);
    hbSeg(ctx, hbV(80, P.y), hbV(460, P.y), INK, 2.6);
    hbSector(ctx, P, 0, B, 76, HB_SKY, { alpha: 0.3, label: '∠B', lr: 94, font: f(800, 14) });
    hbSector(ctx, P, B, A, 76, HB_ROSE, { alpha: 0.3, label: '∠A', lr: 94, font: f(800, 14) });
    hbSector(ctx, P, A + B, Cc, 76, HB_MOSS, { alpha: 0.3, label: '∠C', lr: 94, font: f(800, 14) });
    hbSeg(ctx, P, hbAt(P, B, 76), INK, 1.6);
    hbSeg(ctx, P, hbAt(P, A + B, 76), INK, 1.6);
    hbDot(ctx, P, HB_IVORY, 4);
    textCenter(ctx, `∠A + ∠B + ∠C = ${A}° + ${B}° + ${Cc}° = 180°（平角）`, W / 2, 432, HB_GOLD, f(800, 16));

    out.innerHTML = wbrEq(`\\angle C = 180^\\circ - ${hbDg(A)} - ${hbDg(B)} = ${hbDg(Cc)}`);
    let kind = '銳角三角形';
    if (A === 90 || B === 90 || Cc === 90) kind = '直角三角形';
    else if (A > 90 || B > 90 || Cc > 90) kind = '鈍角三角形';
    fb.innerHTML = wrapFeedback(`三個角拼起來剛好是一個平角，不論三角形長什麼樣子，內角和都是 \\(180^\\circ\\)。<br>最大的角是 \\(${hbDg(Math.max(A, B, Cc))}\\)，這是一個<strong>${kind}</strong>。`);
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  hbDrawWithFonts(draw);
}

/* ==========================================================================
   重點 4：外角的定義——轉彎角，以及一個內角的兩個外角
   ========================================================================== */
function initTurnCanvas() {
  const cv = hbEl('canvas-turn');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('tn-a'), va = hbEl('tn-va');
  const g = hbEl('tn-mode-group');
  const out = hbEl('tn-formula'), fb = hbEl('tn-feedback');
  const C = HB_TONE[3];
  let mode = 'walk';

  function drawWalk(th) {
    const W = cv.width;
    const t = 180 - th;
    drawTitle(ctx, '小蜜沿著花圃小徑走，到 B 點轉彎', C);
    const A = hbV(70, 300), B = hbV(290, 300), Cp = hbAt(B, t, 180);
    const E = hbAt(B, 0, 160);
    hbSeg(ctx, B, E, HB_GOLD, 2.2, [7, 6]);
    textCenter(ctx, '原來的方向', E.x - 8, E.y + 18, HB_GOLD, f(700, 12.5));
    hbSector(ctx, B, t, th, 38, HB_ROSE, { alpha: 0.24, label: `${th}°`, lr: 56, font: f(800, 15) });
    hbSector(ctx, B, 0, t, 66, HB_GOLD, { alpha: 0.24, label: `${t}°`, lr: 84, font: f(800, 15) });
    hbSeg(ctx, A, B, HB_IVORY, 3.4);
    hbSeg(ctx, B, Cp, HB_IVORY, 3.4);
    hbArrowHead(ctx, A, B, HB_IVORY);
    hbArrowHead(ctx, B, Cp, HB_IVORY);
    const G = hbCentroid([A, B, Cp]);
    textCenter(ctx, 'A', A.x - 16, A.y + 4, HB_IVORY, fi(800, 18));
    textCenter(ctx, '出發', A.x + 4, A.y + 24, MUTED, f(700, 12));
    hbVLabel(ctx, B, G, 'B', HB_IVORY, 22);
    const CL = hbAt(B, t, 200);
    textCenter(ctx, 'C', CL.x, CL.y, HB_IVORY, fi(800, 18));
    textCenter(ctx, `∠ABC = ${th}°，轉彎角 = 180° − ${th}° = ${t}°`, W / 2, 396, INK, f(800, 17));
    textCenter(ctx, '轉彎角就是 ∠ABC 的外角，與 ∠ABC 互補', W / 2, 432, HB_GOLD, f(800, 16));
    out.innerHTML = wbrEq(`\\text{轉彎角} = 180^\\circ - ${hbDg(th)} = ${hbDg(t)}`);
    fb.innerHTML = wrapFeedback(`走到 \\(B\\) 點時，前進方向從「原來的方向」轉到 \\(\\overline{BC}\\)，轉過的角就是 \\(\\angle ABC\\) 的<strong>外角</strong>。<br>\\(\\angle ABC\\) 越大，彎越緩，要轉的角越小。`);
  }

  function drawTwo(th) {
    const W = cv.width;
    drawTitle(ctx, '∠A 的兩個外角：延長哪一邊都可以', C);
    const A = hbV(270, 172);
    const B = hbAt(A, 270 - th / 2, 190), Cp = hbAt(A, 270 + th / 2, 190);
    const E1 = hbBeyond(B, A, 130), E2 = hbBeyond(Cp, A, 130);
    hbSeg(ctx, A, E1, HB_GOLD, 2.2, [7, 6]);
    hbSeg(ctx, A, E2, HB_GOLD, 2.2, [7, 6]);
    hbAngle(ctx, A, E1, E2, 22, MUTED, { alpha: 0.12, dash: [4, 4] });
    // ∠A 很大時三角形很扁，角記號與度數要縮進三角形的高度內，才不會壓到底邊
    const hA = 190 * Math.cos(th / 2 * HB_RAD), rA = Math.min(30, 0.45 * hA);
    hbAngle(ctx, A, B, Cp, rA, HB_ROSE, { alpha: 0.26, label: `${th}°`, lr: Math.min(50, rA + 14), font: f(800, 15) });
    hbAngle(ctx, A, E1, Cp, 30, HB_GOLD, { alpha: 0.22, label: '∠1', lr: 48, font: f(800, 15) });
    hbAngle(ctx, A, E2, B, 30, HB_GOLD, { alpha: 0.22, label: '∠2', lr: 48, font: f(800, 15) });
    hbPoly(ctx, [A, B, Cp], INK, 0.04, 2.6);
    const G = hbCentroid([A, B, Cp]);
    hbVLabel(ctx, B, G, 'B', HB_IVORY);
    hbVLabel(ctx, Cp, G, 'C', HB_IVORY);
    // 頂點字母畫在三角形外（開發約束 18）：A 的外側是兩條延長線夾出的灰色角
    const AL = hbAt(A, 90, 40);
    textCenter(ctx, 'A', AL.x, AL.y, HB_IVORY, fi(800, 17));
    const N = hbAt(A, 90, 70);
    textCenter(ctx, '不是外角', N.x, N.y, MUTED, f(700, 12));
    textCenter(ctx, `∠1 = ∠2 = 180° − ${th}° = ${180 - th}°`, W / 2, 404, INK, f(800, 17));
    textCenter(ctx, '兩個外角是對頂角，一樣大', W / 2, 436, HB_GOLD, f(800, 16));
    out.innerHTML = wbrEq(`\\angle 1 = \\angle 2 = 180^\\circ - ${hbDg(th)} = ${hbDg(180 - th)}`);
    fb.innerHTML = wrapFeedback(`外角是「一邊」和「另一邊的延長線」所夾的角，所以 \\(\\angle A\\) 有兩個外角 \\(\\angle 1\\)、\\(\\angle 2\\)，都與 \\(\\angle A\\) 互補。<br>兩條延長線所夾的灰色角是 \\(\\angle A\\) 的對頂角，<strong>不是</strong>外角。`);
  }

  function draw() {
    const th = mode === 'walk' ? hbClampSlider(sa, 30, 175) : hbClampSlider(sa, 60, 150);
    va.textContent = th;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (mode === 'walk') drawWalk(th);
    else drawTwo(th);
    typeset([out, fb]);
  }

  sa.addEventListener('input', draw);
  bindPickGroup(g, 'data-tn-mode', v => { mode = v; draw(); });
  hbDrawWithFonts(draw);
}

/* ==========================================================================
   重點 5：三角形外角和 360°
   ========================================================================== */
function initExtSumCanvas() {
  const cv = hbEl('canvas-xs');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('xs-a'), sb = hbEl('xs-b'), ss = hbEl('xs-s');
  const va = hbEl('xs-va'), vb = hbEl('xs-vb'), vs = hbEl('xs-vs');
  const out = hbEl('xs-formula'), fb = hbEl('xs-feedback');
  const C = HB_TONE[4];

  function draw() {
    const W = cv.width;
    const A = hbClampSlider(sa, 10, 160);
    const B = hbClampSlider(sb, 10, 170 - A);
    const s = hbIv(ss) / 100;
    const Cc = 180 - A - B;
    va.textContent = A; vb.textContent = B; vs.textContent = Math.round(s * 100);
    const e1 = 180 - A, e2 = 180 - B, e3 = 180 - Cc;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '沿 A → B → C → A 走一圈，每到一個頂點轉一次彎', C);

    const t0 = hbTriangle(A, B, { x: 80, y: 122, w: 220, h: 138 });
    const G = hbCentroid([t0.A, t0.B, t0.C]);
    const sc = P => hbV(G.x + (P.x - G.x) * s, G.y + (P.y - G.y) * s);
    const t = { A: sc(t0.A), B: sc(t0.B), C: sc(t0.C) };
    const ext = 58, r = 22;
    // 每個頂點：延長「走進來的那一邊」，與「走出去的那一邊」夾出外角
    const seq = [['A', 'C', 'B', HB_ROSE, '∠1'], ['B', 'A', 'C', HB_SKY, '∠2'], ['C', 'B', 'A', HB_MOSS, '∠3']];
    seq.forEach(([v, from, to, col, nm]) => {
      const V = t[v], F = t[from], To = t[to];
      const E = hbBeyond(F, V, ext);
      hbSeg(ctx, V, E, col, 2, [6, 5]);
      hbAngle(ctx, V, E, To, r, col, { alpha: 0.3, label: nm, lr: r + 15, font: f(800, 13) });
    });
    hbPoly(ctx, [t.A, t.B, t.C], INK, 0.05, 2.6);
    if (s >= 0.5) {
      hbVLabel(ctx, t.A, G, 'A', HB_IVORY, 16);
      hbVLabel(ctx, t.B, G, 'B', HB_IVORY, 16);
      hbVLabel(ctx, t.C, G, 'C', HB_IVORY, 16);
    }

    // 三個外角合在一起：一整圈
    const P = hbV(438, 176), R = 62;
    textCenter(ctx, '三個外角拼在一起', P.x, 92, MUTED, f(700, 13));
    hbSector(ctx, P, 90, e1, R, HB_ROSE, { alpha: 0.34, label: '∠1', lr: R * 0.6, lc: HB_IVORY, font: f(800, 13) });
    hbSector(ctx, P, 90 + e1, e2, R, HB_SKY, { alpha: 0.34, label: '∠2', lr: R * 0.6, lc: HB_IVORY, font: f(800, 13) });
    hbSector(ctx, P, 90 + e1 + e2, e3, R, HB_MOSS, { alpha: 0.34, label: '∠3', lr: R * 0.6, lc: HB_IVORY, font: f(800, 13) });
    hbDot(ctx, P, HB_IVORY, 3);
    textCenter(ctx, '剛好一整圈 360°', P.x, 262, HB_GOLD, f(800, 13.5));

    textCenter(ctx, `∠1 = ${e1}°　∠2 = ${e2}°　∠3 = ${e3}°`, W / 2, 352, INK, f(800, 16.5));
    textCenter(ctx, `∠1 + ∠2 + ∠3 = ${e1}° + ${e2}° + ${e3}° = 360°`, W / 2, 388, HB_GOLD, f(800, 17));
    textCenter(ctx, s < 0.5 ? '三角形縮成一個點，三個外角就像在同一點轉一整圈' : '把「縮小比例」往左拉，看三個外角越靠越近',
      W / 2, 428, MUTED, f(700, 14));

    out.innerHTML = wbrEq(`\\angle 1 + \\angle 2 + \\angle 3 = ${hbDg(e1)} + ${hbDg(e2)} + ${hbDg(e3)} = 360^\\circ`);
    fb.innerHTML = wrapFeedback(`每個外角 \\(= 180^\\circ -\\) 它的內角：\\(3 \\times 180^\\circ - 180^\\circ = 360^\\circ\\)。<br>不論三個內角怎麼變，<strong>一組外角的和永遠是 \\(360^\\circ\\)</strong>。`);
    typeset([out, fb]);
  }

  [sa, sb, ss].forEach(x => x.addEventListener('input', draw));
  hbDrawWithFonts(draw);
}

/* ==========================================================================
   重點 6：三角形外角定理
   ========================================================================== */
function initExtThmCanvas() {
  const cv = hbEl('canvas-xt');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('xt-a'), sb = hbEl('xt-b'), va = hbEl('xt-va'), vb = hbEl('xt-vb');
  const g = hbEl('xt-mode-group');
  const out = hbEl('xt-formula'), fb = hbEl('xt-feedback');
  const C = HB_TONE[5];
  let mode = 'sep';

  function draw() {
    const W = cv.width;
    const A = hbClampSlider(sa, 10, 160);
    const B = hbClampSlider(sb, 10, 170 - A);
    const Cc = 180 - A - B;
    va.textContent = A; vb.textContent = B;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '延長 BC 到 D：∠ACD 是 ∠ACB 的外角', C);
    const t = hbTriangle(A, B, { x: 40, y: 70, w: 300, h: 200 });
    const D = hbAt(t.C, 0, 150);
    const r = Math.max(14, Math.min(30, 0.3 * Math.min(hbDist(t.A, t.B), hbDist(t.B, t.C), hbDist(t.A, t.C))));
    hbSeg(ctx, t.C, D, INK, 2.6);
    hbAngle(ctx, t.A, t.B, t.C, r, HB_ROSE, { label: `${A}°`, lr: r + 17, font: f(800, 14) });
    hbAngle(ctx, t.B, t.A, t.C, r, HB_SKY, { label: `${B}°`, lr: r + 17, font: f(800, 14) });
    hbAngle(ctx, t.C, t.A, t.B, Math.min(r, 22), HB_MOSS, { alpha: 0.2 });
    const ACD = A + B;
    if (mode === 'sep') {
      hbSector(ctx, t.C, 0, ACD, 46, HB_GOLD, { alpha: 0.26, label: `${ACD}°`, lr: 66, font: f(800, 15) });
    } else {
      const Pp = hbAt(t.C, B, 120);
      hbSeg(ctx, t.C, Pp, HB_IVORY, 1.8, [6, 5]);
      hbSector(ctx, t.C, 0, B, 50, HB_SKY, { alpha: 0.34, label: '∠B', lr: 70, font: f(800, 14) });
      hbSector(ctx, t.C, B, A, 50, HB_ROSE, { alpha: 0.34, label: '∠A', lr: 70, font: f(800, 14) });
      // ∠B 大時虛線偏右，說明字夾在畫布內（置中在虛線末端上方）
      textCenter(ctx, '虛線與 BA 平行', clamp(Pp.x, 56, W - 56), Pp.y - 14, MUTED, f(700, 12));
    }
    hbPoly(ctx, [t.A, t.B, t.C], INK, 0.05, 2.6);
    const G = hbCentroid([t.A, t.B, t.C]);
    hbVLabel(ctx, t.A, G, 'A', HB_IVORY);
    hbVLabel(ctx, t.B, G, 'B', HB_IVORY);
    textCenter(ctx, 'C', t.C.x, t.C.y + 20, HB_IVORY, fi(800, 18));
    textCenter(ctx, 'D', D.x + 14, D.y, HB_IVORY, fi(800, 18));

    textCenter(ctx, `∠ACD = ∠A + ∠B = ${A}° + ${B}° = ${ACD}°`, W / 2, 360, HB_GOLD, f(800, 17.5));
    textCenter(ctx, `驗算：∠ACB = ${Cc}°，${Cc}° + ${ACD}° = 180°`, W / 2, 396, INK, f(800, 15.5));
    textCenter(ctx, '外角 = 與它「不相鄰」的兩個內角的和', W / 2, 432, MUTED, f(700, 14.5));

    out.innerHTML = wbrEq(`\\angle ACD = \\angle A + \\angle B = ${hbDg(A)} + ${hbDg(B)} = ${hbDg(ACD)}`);
    fb.innerHTML = wrapFeedback(mode === 'sep'
      ? `\\(\\angle ACD\\) 與 \\(\\angle ACB\\) 互補，\\(\\angle A + \\angle B\\) 也與 \\(\\angle ACB\\) 互補，所以兩者相等。<br>按「搬過去看看」，把 \\(\\angle A\\)、\\(\\angle B\\) 直接放進外角裡。`
      : `過 \\(C\\) 作 \\(\\overline{BA}\\) 的平行線，外角被切成兩塊：一塊等於 \\(\\angle B\\)、一塊等於 \\(\\angle A\\)。<br>和外角<strong>相鄰</strong>的 \\(\\angle ACB\\) 不算在裡面。`);
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-xt-mode', v => { mode = v; draw(); });
  hbDrawWithFonts(draw);
}

/* ==========================================================================
   重點 7：8 字形（∠A + ∠B = ∠C + ∠D）
   ========================================================================== */
function initEightCanvas() {
  const cv = hbEl('canvas-eight');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('eg-a'), sb = hbEl('eg-b'), sc = hbEl('eg-c');
  const va = hbEl('eg-va'), vb = hbEl('eg-vb'), vc = hbEl('eg-vc');
  const out = hbEl('eg-formula'), fb = hbEl('eg-feedback');
  const C = HB_TONE[6];

  function draw() {
    const W = cv.width;
    const A = hbClampSlider(sa, 20, 80);
    const B = hbClampSlider(sb, 20, 80);
    const Cc = hbClampSlider(sc, 15, A + B - 15);
    const D = A + B - Cc, phi = 180 - A - B;
    va.textContent = A; vb.textContent = B; vc.textContent = Cc;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, 'AD 與 BC 交於 O，連接 AB、CD', C);
    const p = hbEightPts(A, B, Cc, hbV(270, 212), 150);
    hbAngle(ctx, p.O, p.A, p.B, 24, HB_GOLD, { alpha: 0.3, label: `${phi}°`, lr: 42, font: f(800, 13.5) });
    hbAngle(ctx, p.O, p.C, p.D, 24, HB_GOLD, { alpha: 0.3, label: `${phi}°`, lr: 42, font: f(800, 13.5) });
    hbAngle(ctx, p.A, p.O, p.B, 30, HB_ROSE, { label: `${A}°`, lr: 50, font: f(800, 14) });
    hbAngle(ctx, p.B, p.O, p.A, 30, HB_SKY, { label: `${B}°`, lr: 50, font: f(800, 14) });
    hbAngle(ctx, p.C, p.O, p.D, 30, HB_MOSS, { label: `${Cc}°`, lr: 50, font: f(800, 14) });
    hbAngle(ctx, p.D, p.O, p.C, 30, HB_VIOLET, { label: `${D}°`, lr: 50, font: f(800, 14) });
    hbSeg(ctx, p.A, p.D, INK, 2.6);
    hbSeg(ctx, p.B, p.C, INK, 2.6);
    hbSeg(ctx, p.A, p.B, INK, 2.6);
    hbSeg(ctx, p.C, p.D, INK, 2.6);
    [['A', p.A], ['B', p.B], ['C', p.C], ['D', p.D]].forEach(([s, P]) => hbVLabel(ctx, P, p.O, s, HB_IVORY, 18));
    textCenter(ctx, 'O', p.O.x, p.O.y - 18 - phi * 0.05, HB_IVORY, fi(800, 16));
    textCenter(ctx, `∠A + ∠B = ${A}° + ${B}° = ${A + B}°`, W / 2, 398, HB_ROSE, f(800, 16.5));
    textCenter(ctx, `∠C + ∠D = ${Cc}° + ${D}° = ${A + B}°`, W / 2, 432, HB_MOSS, f(800, 16.5));

    out.innerHTML = wbrEq(`\\angle D = ${hbDg(A)} + ${hbDg(B)} - ${hbDg(Cc)} = ${hbDg(D)}`);
    fb.innerHTML = wrapFeedback(`\\(\\angle AOB\\) 與 \\(\\angle COD\\) 是對頂角，都是 \\(${hbDg(phi)}\\)。<br>兩個三角形各自扣掉同一個角，剩下的兩角和一樣：<strong>\\(\\angle A + \\angle B = \\angle C + \\angle D\\)</strong>。`);
    typeset([out, fb]);
  }

  [sa, sb, sc].forEach(s => s.addEventListener('input', draw));
  hbDrawWithFonts(draw);
}

/* ==========================================================================
   重點 8：鏢形（∠BCD = ∠A + ∠B + ∠D）與輔助線
   ========================================================================== */
function initDartCanvas() {
  const cv = hbEl('canvas-dart');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('dt-a'), sb = hbEl('dt-b'), sd = hbEl('dt-d');
  const va = hbEl('dt-va'), vb = hbEl('dt-vb'), vd = hbEl('dt-vd');
  const g = hbEl('dt-mode-group');
  const out = hbEl('dt-formula'), fb = hbEl('dt-feedback');
  const C = HB_TONE[7];
  let mode = 'plain';

  function draw() {
    const W = cv.width;
    const A = hbClampSlider(sa, 30, 90);
    const mx = Math.floor(((180 - A) / 2 - 5) / 5) * 5;
    const B = hbClampSlider(sb, 10, mx);
    const D = hbClampSlider(sd, 10, mx);
    const S = A + B + D;
    va.textContent = A; vb.textContent = B; vd.textContent = D;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '鏢形 ABCD：C 點凹進去', C);
    const p = hbDartPts(A, B, D, hbV(270, 64), 290);
    hbPoly(ctx, [p.A, p.B, p.C, p.D], INK, 0.06, 2.6);
    hbAngle(ctx, p.B, p.A, p.C, 34, HB_SKY, { label: `${B}°`, lr: 54, font: f(800, 14) });
    hbAngle(ctx, p.D, p.A, p.C, 34, HB_MOSS, { label: `${D}°`, lr: 54, font: f(800, 14) });
    if (mode === 'plain') {
      hbAngle(ctx, p.A, p.B, p.D, 32, HB_ROSE, { label: `${A}°`, lr: 50, font: f(800, 14) });
      hbAngle(ctx, p.C, p.B, p.D, 26, HB_GOLD, { alpha: 0.32, label: `${S}°`, lr: 46, font: f(800, 15) });
    } else {
      const E = hbBeyond(p.A, p.C, 80);
      hbSeg(ctx, p.A, E, HB_IVORY, 1.8, [6, 5]);
      hbAngle(ctx, p.A, p.B, p.C, 40, HB_ROSE, { alpha: 0.3, label: '∠3', lr: 58, font: f(800, 13.5) });
      hbAngle(ctx, p.A, p.C, p.D, 28, HB_VIOLET, { alpha: 0.3, label: '∠4', lr: 46, font: f(800, 13.5) });
      hbAngle(ctx, p.C, p.B, E, 26, HB_SKY, { alpha: 0.3, label: '∠1', lr: 44, font: f(800, 13.5) });
      hbAngle(ctx, p.C, E, p.D, 26, HB_MOSS, { alpha: 0.3, label: '∠2', lr: 44, font: f(800, 13.5) });
    }
    const G = hbCentroid([p.A, p.B, p.D]);
    hbVLabel(ctx, p.A, G, 'A', HB_IVORY);
    hbVLabel(ctx, p.B, G, 'B', HB_IVORY);
    hbVLabel(ctx, p.D, G, 'D', HB_IVORY);
    textCenter(ctx, 'C', p.C.x + 16, p.C.y - 12, HB_IVORY, fi(800, 18));

    if (mode === 'plain') {
      textCenter(ctx, `∠BCD = ∠A + ∠B + ∠D = ${A}° + ${B}° + ${D}° = ${S}°`, W / 2, 404, HB_GOLD, f(800, 16.5));
      textCenter(ctx, '這裡的 ∠BCD 指凹口那一側、小於 180° 的角', W / 2, 436, MUTED, f(700, 14));
    } else {
      textCenter(ctx, '∠1 = ∠B + ∠3，∠2 = ∠D + ∠4（外角定理）', W / 2, 404, INK, f(800, 16));
      textCenter(ctx, `∠BCD = ∠1 + ∠2 = ∠B + ∠D + ∠A = ${S}°`, W / 2, 436, HB_GOLD, f(800, 16.5));
    }
    out.innerHTML = wbrEq(`\\angle BCD = ${hbDg(A)} + ${hbDg(B)} + ${hbDg(D)} = ${hbDg(S)}`);
    fb.innerHTML = wrapFeedback(mode === 'plain'
      ? `鏢形凹進去的那個角，等於另外三個角的和。<br>按「連 \\(\\overline{AC}\\) 並延長」，看這條<strong>輔助線</strong>怎麼把它拆成兩個外角。`
      : `輔助線把鏢形拆成兩個三角形 \\(\\triangle ABC\\)、\\(\\triangle ADC\\)，\\(\\angle 1\\)、\\(\\angle 2\\) 各是一個外角。<br>\\(\\angle 3 + \\angle 4 = \\angle A\\)，所以 \\(\\angle BCD = \\angle A + \\angle B + \\angle D\\)。`);
    typeset([out, fb]);
  }

  [sa, sb, sd].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-dt-mode', v => { mode = v; draw(); });
  hbDrawWithFonts(draw);
}

/* ==========================================================================
   重點 9：n 邊形內角和 (n − 2) × 180°
   ========================================================================== */
const HB_JIT = [0.12, -0.1, 0.07, -0.14, 0.1, -0.05, 0.13, -0.08, 0.04, -0.11, 0.06, -0.09];

function hbIsConvex(pts) {
  let sign = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], c = pts[(i + 2) % pts.length];
    const z = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(z) < 1e-9) return false;
    if (!sign) sign = Math.sign(z);
    else if (Math.sign(z) !== sign) return false;
  }
  return true;
}

// 不規則的凸 n 邊形（角度與半徑稍微抖動，強調「任意」n 邊形）
function hbIrregular(n, center, R) {
  for (let k = 1; k >= 0; k -= 0.25) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const j = HB_JIT[i % HB_JIT.length] * k;
      pts.push(hbAt(center, 90 + 360 * i / n + j * 360 / n * 0.9, R * (1 + j * 0.5)));
    }
    if (hbIsConvex(pts)) return pts;
  }
  return hbRegPts(n, center, R, 90);
}

function initNgonCanvas() {
  const cv = hbEl('canvas-ngon');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sn = hbEl('ng-n'), vn = hbEl('ng-vn');
  const g = hbEl('ng-mode-group');
  const out = hbEl('ng-formula'), fb = hbEl('ng-feedback');
  const C = HB_TONE[8];
  const FILL = [HB_ROSE, HB_SKY, HB_MOSS, HB_GOLD, HB_VIOLET];
  let mode = 'vertex';

  function draw() {
    const W = cv.width;
    const n = hbClampSlider(sn, 3, 10);
    vn.textContent = n;
    const S = (n - 2) * 180;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'vertex' ? `從一個頂點畫對角線，切開 ${n} 邊形` : `從內部一點連到每個頂點`, C);
    const cen = hbV(270, 210);
    const P = hbIrregular(n, cen, 148);
    if (mode === 'vertex') {
      for (let i = 1; i <= n - 2; i++) {
        const tri = [P[0], P[i], P[i + 1]];
        hbPoly(ctx, tri, FILL[(i - 1) % FILL.length], 0.2, 0.01);
        const G = hbCentroid(tri);
        textCenter(ctx, String(i), G.x, G.y, FILL[(i - 1) % FILL.length], f(800, 17));
      }
      for (let i = 2; i <= n - 2; i++) hbSeg(ctx, P[0], P[i], HB_IVORY, 1.8, [6, 5]);
      hbDot(ctx, P[0], HB_GOLD, 6);
    } else {
      const O = hbCentroid(P);
      for (let i = 0; i < n; i++) {
        const tri = [O, P[i], P[(i + 1) % n]];
        hbPoly(ctx, tri, FILL[i % FILL.length], 0.18, 0.01);
        hbSeg(ctx, O, P[i], HB_IVORY, 1.6, [6, 5]);
      }
      hbSector(ctx, O, 0, 360, 16, HB_GOLD, { alpha: 0.4 });
      textCenter(ctx, '360°', O.x, O.y - 28, HB_GOLD, f(800, 13));
    }
    hbPoly(ctx, P, INK, 0, 2.8);
    const name = ['', '', '', '三角形', '四邊形', '五邊形', '六邊形', '七邊形', '八邊形', '九邊形', '十邊形'][n];
    if (mode === 'vertex') {
      textCenter(ctx, `${name}：對角線 ${n - 3} 條，分成 ${n - 2} 個三角形`, W / 2, 398, INK, f(800, 16.5));
      textCenter(ctx, `內角和 = (${n} − 2) × 180° = ${S}°`, W / 2, 434, HB_GOLD, f(800, 18));
      out.innerHTML = wbrEq(`(${n} - 2) \\times 180^\\circ = ${n - 2} \\times 180^\\circ = ${hbDg(S)}`);
      fb.innerHTML = wrapFeedback(`從一個頂點出發，連不到自己和相鄰的兩個頂點，所以畫出 \\(${n} - 3 = ${n - 3}\\) 條對角線，切成 \\(${n - 2}\\) 個三角形。<br>每個三角形 \\(180^\\circ\\)，${name}的<strong>內角和是 \\(${hbDg(S)}\\)</strong>。`);
    } else {
      textCenter(ctx, `${name}：分成 ${n} 個三角形，但中間多算了一整圈`, W / 2, 398, INK, f(800, 16.5));
      textCenter(ctx, `內角和 = ${n} × 180° − 360° = ${S}°`, W / 2, 434, HB_GOLD, f(800, 18));
      out.innerHTML = wbrEq(`${n} \\times 180^\\circ - 360^\\circ = ${hbDg(S)}`);
      fb.innerHTML = wrapFeedback(`\\(${n}\\) 個三角形的角加起來是 \\(${hbDg(n * 180)}\\)，可是圍著中間那一點的角不是${name}的內角，要扣掉 \\(360^\\circ\\)。<br>兩種切法答案一樣：\\(${hbDg(S)}\\)。`);
    }
    typeset([out, fb]);
  }

  sn.addEventListener('input', draw);
  bindPickGroup(g, 'data-ng-mode', v => { mode = v; draw(); });
  hbDrawWithFonts(draw);
}

/* ==========================================================================
   重點 10：正 n 邊形的每一個內角與外角
   ========================================================================== */

// 內角和相同、但每個角不一樣大的 n 邊形：外角取整數，最後兩邊解出來讓圖形閉合
function hbUnevenPolygon(n) {
  const base = [];
  for (let i = 0; i < n; i++) base.push(Math.floor(360 / n) + (i < 360 % n ? 1 : 0));
  for (const p of [14, 10, 6, 3, 0]) {
    const ext = base.map((e, i) => e + ((n % 2 === 1 && i === n - 1) ? 0 : (i % 2 ? -p : p)));
    if (ext.some(e => e < 8 || e > 150)) continue;
    // 第 i 條邊的方向：從頂點 i 出發，h_0 = 0，h_i = h_{i−1} + ext_i
    const h = [0];
    for (let i = 1; i < n; i++) h.push(h[i - 1] + ext[i]);
    let sx = 0, sy = 0;
    for (let i = 0; i < n - 2; i++) { sx += Math.cos(h[i] * HB_RAD); sy += Math.sin(h[i] * HB_RAD); }
    const ux = Math.cos(h[n - 2] * HB_RAD), uy = Math.sin(h[n - 2] * HB_RAD);
    const vx = Math.cos(h[n - 1] * HB_RAD), vy = Math.sin(h[n - 1] * HB_RAD);
    const det = ux * vy - uy * vx;
    if (Math.abs(det) < 1e-9) continue;
    const L1 = (-sx * vy + sy * vx) / det, L2 = (-ux * sy + uy * sx) / det;
    if (L1 < 0.4 || L2 < 0.4) continue;
    const lens = Array(n - 2).fill(1).concat([L1, L2]);
    const pts = [hbV(0, 0)];
    for (let i = 0; i < n - 1; i++) pts.push(hbAt(pts[i], h[i], lens[i]));
    return { pts, interior: ext.map(e => 180 - e), p };
  }
  return null;
}

function initRegCanvas() {
  const cv = hbEl('canvas-reg');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sn = hbEl('rg-n'), vn = hbEl('rg-vn');
  const g = hbEl('rg-mode-group');
  const out = hbEl('rg-formula'), fb = hbEl('rg-feedback');
  const C = HB_TONE[9];
  let mode = 'reg';

  function draw() {
    const W = cv.width;
    const n = hbClampSlider(sn, 3, 12);
    vn.textContent = n;
    const S = (n - 2) * 180;
    ctx.clearRect(0, 0, W, cv.height);
    if (mode === 'reg') {
      drawTitle(ctx, `正 ${n} 邊形：每條邊一樣長、每個角一樣大`, C);
      const cen = hbV(270, 178), R = 118;
      const P = hbRegPts(n, cen, R, 270 - 180 / n);
      hbPoly(ctx, P, INK, 0.07, 2.8);
      const V = P[1], E = hbBeyond(P[0], P[1], 92);
      hbSeg(ctx, V, E, HB_GOLD, 2.2, [6, 5]);
      const r = Math.min(30, hbDist(P[0], P[1]) * 0.35);
      hbAngle(ctx, V, P[0], P[2], r, HB_ROSE, { alpha: 0.3, label: '內角', lr: r + 22, font: f(800, 13) });
      hbAngle(ctx, V, E, P[2], r + 10, HB_GOLD, { alpha: 0.3, label: '外角', lr: r + 30, font: f(800, 13) });
      const k = (n - 2) * 180, ext = 360;
      drawExpr(ctx, [T('內角和', INK), T('=', INK), T(`(${n} − 2) × 180°`, INK), T('=', INK), T(`${S}°`, HB_IVORY)], W / 2, 340, 19, INK);
      drawExpr(ctx, [T('每一個內角', HB_ROSE), T('=', HB_ROSE), T(`${S}° ÷ ${n}`, HB_ROSE), T('=', HB_ROSE), hbDegItem(k, n, HB_ROSE)], W / 2, 384, 19, HB_ROSE);
      drawExpr(ctx, [T('每一個外角', HB_GOLD), T('=', HB_GOLD), T(`360° ÷ ${n}`, HB_GOLD), T('=', HB_GOLD), hbDegItem(ext, n, HB_GOLD)], W / 2, 430, 19, HB_GOLD);
      out.innerHTML = `每一個內角 \\(= ${hbDegTex(k, n)}\\)，每一個外角 \\(= ${hbDegTex(360, n)}\\)`;
      fb.innerHTML = wrapFeedback(`內角與外角互補：\\(${hbDegTex(k, n)} + ${hbDegTex(360, n)} = 180^\\circ\\)。<br>所以每一個內角也可以寫成 \\(180^\\circ - \\frac{360^\\circ}{n}\\)；\\(n\\) 越大，內角越接近 \\(180^\\circ\\)。`);
    } else {
      drawTitle(ctx, `內角和也是 ${S}°，但每個角不一樣大`, C);
      const U = hbUnevenPolygon(n);
      const fit = hbFit(U.pts, { x: 120, y: 56, w: 300, h: 250 });
      hbPoly(ctx, fit, INK, 0.07, 2.8);
      const G = hbCentroid(fit);
      fit.forEach((V, i) => {
        const prev = fit[(i - 1 + n) % n], next = fit[(i + 1) % n];
        hbAngle(ctx, V, prev, next, 16, HB_ROSE, { alpha: 0.22 });
        hbVLabel(ctx, V, G, `${U.interior[i]}°`, HB_ROSE, -36);
      });
      const sum = U.interior.reduce((a, b) => a + b, 0);
      textCenter(ctx, `${U.interior.join('° + ')}°`, W / 2, 352, INK, f(700, n > 8 ? 12.5 : 14.5));
      textCenter(ctx, `= ${sum}° = (${n} − 2) × 180°`, W / 2, 384, HB_GOLD, f(800, 17));
      textCenter(ctx, '只有「正」多邊形才能用內角和 ÷ n 求每一個角', W / 2, 428, HB_RED, f(800, 15));
      out.innerHTML = `內角和 \\(= ${hbDg(sum)}\\)，但這 \\(${n}\\) 個角不都相等`;
      fb.innerHTML = wrapFeedback(`\\(n\\) 邊形的內角和固定是 \\((n - 2) \\times 180^\\circ\\)，可是每個角可以各不相同。<br>要「每條邊一樣長、每個角一樣大」的<strong>正 \\(n\\) 邊形</strong>，每一個內角才是 \\(\\frac{(n - 2) \\times 180^\\circ}{n}\\)。`);
    }
    typeset([out, fb]);
  }

  sn.addEventListener('input', draw);
  bindPickGroup(g, 'data-rg-mode', v => { mode = v; draw(); });
  hbDrawWithFonts(draw);
}

/* ==========================================================================
   重點 11：由角度反求正 n 邊形的 n
   ========================================================================== */
function initFindNCanvas() {
  const cv = hbEl('canvas-fn');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = hbEl('fn-a'), va = hbEl('fn-va');
  const rowA = hbEl('fn-a-row'), rowK = hbEl('fn-k-row');
  const g = hbEl('fn-mode-group'), gk = hbEl('fn-k-group');
  const out = hbEl('fn-formula'), fb = hbEl('fn-feedback');
  const C = HB_TONE[10];
  let mode = 'int';
  let k = [3, 1];

  function drawShape(n, ok) {
    const cen = hbV(270, 132);
    if (ok) {
      const P = hbRegPts(n, cen, 72, 270 - 180 / n);
      hbPoly(ctx, P, C, 0.12, 2.4);
      textCenter(ctx, `正 ${n} 邊形`, cen.x, cen.y, HB_IVORY, f(800, 16));
    } else {
      drawPanel(ctx, 150, 82, 240, 100, HB_RED, 0.08);
      textCenter(ctx, 'n 不是整數', cen.x, cen.y - 14, HB_RED, f(800, 18));
      textCenter(ctx, '沒有這樣的正多邊形', cen.x, cen.y + 16, HB_RED, f(800, 15));
    }
  }

  function draw() {
    const W = cv.width;
    rowA.style.display = mode === 'int' ? '' : 'none';
    rowK.style.display = mode === 'int' ? 'none' : '';
    ctx.clearRect(0, 0, W, cv.height);
    if (mode === 'int') {
      const a = hbClampSlider(sa, 60, 175);
      va.textContent = a;
      const e = 180 - a;
      const nq = reduce(360, e);
      const ok = nq[1] === 1;
      const n = nq[0];
      drawTitle(ctx, `求：每一個內角 ${a}° 的正多邊形有幾個邊？`, C);
      drawShape(n, ok);
      const rows = [
        { name: '① 先求外角', hint: '內角與外角互補', items: [T('外角'), T('='), T(`180° − ${a}°`), T('='), T(`${e}°`)] },
        { name: '② 用外角和', hint: '正 n 邊形 n 個外角一樣大，合起來 360°', items: [IT('n'), T('='), T(`360° ÷ ${e}°`), T('='), qIt(nq)] },
        ok
          ? { name: '③ 驗算', hint: '代回每一個內角的公式', items: [T(`(${n} − 2) × 180° ÷ ${n}`), T('='), T(`${a}°`)] }
          : { name: '③ 判斷', hint: '邊數一定是正整數', items: [T('n 不是整數，不合', HB_RED)], color: HB_RED }
      ];
      drawStepRows(ctx, rows, 3, { top: 262, gap: 62, color: INK, size: 19 });
      out.innerHTML = wbrEq(`\\text{外角} = 180^\\circ - ${hbDg(a)} = ${hbDg(e)}`) + '，'
        + `\\(n = 360 \\div ${e} = ${qTex(nq)}\\)`;
      fb.innerHTML = wrapFeedback(ok
        ? `正 \\(n\\) 邊形的外角都一樣大，\\(n\\) 個外角合起來 \\(360^\\circ\\)，所以 \\(n = 360 \\div \\text{外角}\\)。<br>每一個內角 \\(${hbDg(a)}\\) 的是<strong>正 \\(${n}\\) 邊形</strong>。`
        : `\\(360 \\div ${e}\\) 除不盡，邊數不可能是 \\(${qTex(nq)}\\)。<br>所以<strong>沒有</strong>每一個內角都是 \\(${hbDg(a)}\\) 的正多邊形。`);
    } else {
      const kq = reduce(k[0], k[1]);
      const k1 = qAdd(kq, 1);
      const x = qDiv([180, 1], k1);
      const n = qDiv([360, 1], x);
      drawTitle(ctx, '求：每一個內角是外角的 k 倍，是正幾邊形？', C);
      drawShape(n[0], n[1] === 1);
      const kIt = (kq[0] === 1 && kq[1] === 1) ? null : qIt(kq);
      const kx = kIt ? SEQ([kIt, IT('x'), T('°')], INK, 2) : SEQ([IT('x'), T('°')], INK, 1);
      const rows = [
        { name: '① 設外角 x°', hint: '內角是外角的 k 倍', items: [T('內角 ='), kx] },
        { name: '② 內角 + 外角', hint: '互補，和是 180°', items: [SEQ([IT('x'), T('°')], INK, 1), T('+'), kx, T('='), T('180°')] },
        { name: '③ 解出外角', hint: '', items: [IT('x'), T('='), T('180 ÷'), qIt(k1), T('='), qIt(x)] },
        { name: '④ 求邊數', hint: '外角和 360°', items: [IT('n'), T('='), T(`360 ÷ ${qTex(x)}`), T('='), qIt(n)] }
      ];
      drawStepRows(ctx, rows, 4, { top: 252, gap: 54, color: INK, size: 19 });
      const kTex = (kq[0] === 1 && kq[1] === 1) ? '' : qTex(kq);
      out.innerHTML = wbrEq(`x + ${kTex}x = 180`) + '，' + `\\(x = ${qTex(x)}\\)，\\(n = ${qTex(n)}\\)`;
      fb.innerHTML = wrapFeedback(`設外角 \\(x^\\circ\\)，內角就是 \\(${kTex}x^\\circ\\)；兩者互補，所以外角 \\(= ${hbDg(qTex(x))}\\)。<br>再用 \\(n = 360 \\div \\text{外角}\\)，是<strong>正 \\(${qTex(n)}\\) 邊形</strong>。`);
    }
    typeset([out, fb]);
  }

  sa.addEventListener('input', draw);
  bindPickGroup(g, 'data-fn-mode', v => { mode = v; draw(); });
  bindPickGroup(gk, 'data-fn-k', v => { const s = v.split('/'); k = [parseInt(s[0], 10), parseInt(s[1] || '1', 10)]; draw(); });
  hbDrawWithFonts(draw);
}
