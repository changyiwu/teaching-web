/* ==========================================================================
   3-2-1（第三冊 2-1）平方根與近似值 — 互動 Canvas 與隨堂評量
   畫風：復古磁磚工坊。正方形磁磚的「面積 → 邊長」就是本節的 √a。
   陶土橘 TL_TERRA 是面積 a 的那塊磚、鈷藍 TL_COBALT 是另一塊或試的邊長、
   翡翠綠 TL_JADE 是正平方根、玫瑰 TL_ROSE 是落單或錯誤的那一份。

   共用工具在 ../math-canvas.js（T／IT／VF／FR／PW／GRP／SEQ／RT／measure／
   drawExpr／drawStepRows／drawEqPanel／drawPanel／drawDot／axisArrow／
   wbrEq／wbrRel／textCenter／textLeft／bindPickGroup…），本檔只放本節的
   色票、精確小數工具、數線與 11 個互動。

   ⚠️ 小數一律用「整數 ÷ 10 的次方」計算與比較（decStr），不要用浮點數直接
   相減比大小：2.2² 用浮點數算是 4.840000000000001，印出來與比較都會出錯。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initMeanCanvas();
  initCompareCanvas();
  initPerfectCanvas();
  initFactorCanvas();
  initFracDecCanvas();
  initTenthCanvas();
  initLocateCanvas();
  initCalcCanvas();
  initRootsCanvas();
  initSolveCanvas();
  initVsCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具（TL_ = Tile；共用檔沒有這個前綴）
   ========================================================================== */

const TL_TERRA = '#fdba74';   // 面積 a 的那塊磚
const TL_COBALT = '#93c5fd';  // 另一塊磚／試的邊長／負平方根
const TL_JADE = '#6ee7b7';    // 正平方根
const TL_ROSE = '#fda4af';    // 落單、錯誤
const TL_CREAM = '#fef3c7';   // 深色底板上的字色
const TL_GOLD = '#fcd34d';    // 夾住的區間

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const TL_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9'];

function elById(id) {
  return document.getElementById(id);
}

function iv(el) {
  return parseInt(el.value, 10);
}

// 整數平方根（無條件捨去），浮點誤差在這裡修正
function isqrt(n) {
  if (n <= 0) return 0;
  let r = Math.floor(Math.sqrt(n));
  while (r * r > n) r--;
  while ((r + 1) * (r + 1) <= n) r++;
  return r;
}

// 精確小數字串：n ÷ 10^dp，固定 dp 位（decFix(12910, 4) = '1.2910'）。
// 「四捨五入到小數第 4 位」的結果要用這個，尾巴的 0 是有意義的位數。
function decFix(n, dp) {
  const neg = n < 0;
  let s = String(Math.abs(n));
  if (dp > 0) {
    while (s.length <= dp) s = '0' + s;
    s = s.slice(0, s.length - dp) + '.' + s.slice(s.length - dp);
  }
  return (neg ? '-' : '') + s;
}

// 同上，但去掉尾巴的 0（decStr(484, 2) = '4.84'、decStr(400, 2) = '4'）
function decStr(n, dp) {
  const s = decFix(n, dp);
  return dp > 0 ? s.replace(/\.?0+$/, '') : s;
}

// canvas 上的減號換成數學減號 −，投影時比連字號清楚
function mn(s) {
  return String(s).replace(/-/g, '−');
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

// √s 與 −√s 的 canvas 元件
function rtItem(s, color) {
  return RT(T(s, color), color);
}

function negRt(s, color) {
  return SEQ([T('−', color), RT(T(s, color), color)], color, 2);
}

// 一塊磁磚：半透明釉面、實線外框，夠大時在左上角加一道反光
function tlTile(ctx, x, y, w, h, color, opts) {
  const o = opts || {};
  if (w <= 0 || h <= 0) return;
  ctx.save();
  ctx.globalAlpha = o.alpha == null ? 0.28 : o.alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = o.lw || 2;
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.strokeRect(x, y, w, h);
  if (o.glaze !== false && w > 16 && h > 16) {
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h - 6);
    ctx.lineTo(x + 4, y + 4);
    ctx.lineTo(x + w - 6, y + 4);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 數線：可以有小數刻度與負數；只有右端（正向）有箭頭，左端平切（開發約束 34）
 * cfg：{ x0, x1, y, min, max, n（刻度段數）, label(i, v)（回傳字串或 null）, font, color }
 * 回傳 px(v)
 */
function srLine(ctx, cfg) {
  const c = cfg;
  const color = c.color || INK;
  const px = v => c.x0 + (v - c.min) / (c.max - c.min) * (c.x1 - c.x0);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(c.x0 - 16, c.y);
  ctx.lineTo(c.x1 + 16, c.y);
  ctx.stroke();
  axisArrow(ctx, c.x1 + 16, c.y, 'right', color);
  ctx.font = c.font || f(700, 13);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i <= c.n; i++) {
    const x = c.x0 + i * (c.x1 - c.x0) / c.n;
    ctx.beginPath();
    ctx.moveTo(x, c.y - 5);
    ctx.lineTo(x, c.y + 5);
    ctx.stroke();
    const lab = c.label ? c.label(i) : null;
    if (lab != null) {
      ctx.fillStyle = c.labelColor || MUTED;
      ctx.fillText(mn(lab), x, c.y + 9);
    }
  }
  ctx.restore();
  return px;
}

// 在數線上標出一段區間（夾住 √a 的那一格）
function srBand(ctx, xa, xb, y, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 7;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(xa, y);
  ctx.lineTo(xb, y);
  ctx.stroke();
  ctx.restore();
}

// 虛線引導線
function srDash(ctx, x1, y1, x2, y2, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

// 一行左對齊的算式（中文字與算式元件混排）
function exprLeft(ctx, items, x, cy, size, color, maxW) {
  return drawExpr(ctx, items, 0, cy, size, color, { left: x, maxW: maxW || (ctx.canvas.width - x - 14), gap: 6 });
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第三冊 2-1 的 22 題正解
  // 正解字母分布：A 5 題、B 6 題、C 5 題、D 6 題（開發約束 36）
  const answers = {
    '2-1-1': 'C',    // 面積 31 的正方形邊長 √31
    '2-1-2': 'B',    // (√(4/7))² = 4/7
    '2-1-3': 'D',    // −√(2/3) > −√(3/4)
    '2-1-4': 'A',    // a = 0.49：√a = 0.7 最大
    '2-1-5': 'B',    // √441 + √81 − √289 = 13
    '2-1-6': 'D',    // 300～400 之間的完全平方數：324、361
    '2-1-7': 'A',    // √(2⁶ × 3⁴ × 5²) = 2³ × 3² × 5
    '2-1-8': 'C',    // 3⁶ × 7² 是完全平方數
    '2-1-9': 'D',    // √(3 1/16) = 1 3/4
    '2-1-10': 'B',   // √0.0169 = 0.13
    '2-1-11': 'C',   // √67 ≒ 8.2
    '2-1-12': 'A',   // 要判斷 √40 四捨五入，算 6.35²
    '2-1-13': 'D',   // −18 < −√300 < −17
    '2-1-14': 'B',   // 周長 4√230 介於 60、61
    '2-1-15': 'C',   // √11 ≒ 3.317
    '2-1-16': 'A',   // 按成 √13 ÷ 4，應先算 13 ÷ 4
    '2-1-17': 'D',   // 0.0196 的平方根 ±0.14
    '2-1-18': 'B',   // 21 的負平方根是 −√21
    '2-1-19': 'C',   // (−7)² = 3x + 4 ⇒ x = 15
    '2-1-20': 'A',   // 5x − 2 = 13 ⇒ x = 3
    '2-1-21': 'D',   // 49 的平方根是 ±√49 = ±7
    '2-1-22': 'B'    // a² = 90 > 70 = b²
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
   重點 1：√a 的意義——面積是 a 的正方形，邊長叫做 √a
   ========================================================================== */
function initMeanCanvas() {
  const cv = elById('canvas-mean');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('me-a'), ss = elById('me-s');
  const va = elById('me-va'), vs = elById('me-vs');
  const out = elById('me-formula');
  const fb = elById('me-feedback');
  const C = TL_TONE[0];
  const U = 52, X0 = 34, YB = 446;

  function draw() {
    const a = iv(sa), t = iv(ss);      // t 是試的邊長 × 10
    va.textContent = a;
    vs.textContent = decStr(t, 1);
    const k = isqrt(a), perfect = (k * k === a);
    const t2 = t * t, A100 = a * 100;  // 都放大 100 倍，用整數比
    const q = isqrt(A100);             // 夾住 √a 的一位小數（× 10）

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '面積是 a 的正方形，邊長是多少？', C);
    const head = [T('面積', INK), T('=', INK), T(a, TL_TERRA), T('⇒', INK), T('邊長', INK), T('=', INK), rtItem(a, TL_TERRA)];
    if (perfect) head.push(T('=', INK), T(k, TL_TERRA));
    drawEqPanel(ctx, head, 80, C, { h: 30, size: 24 });

    // 1 × 1 的小方格底紙
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      ctx.beginPath(); ctx.moveTo(X0 + i * U, YB); ctx.lineTo(X0 + i * U, YB - 5 * U); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X0, YB - i * U); ctx.lineTo(X0 + 5 * U, YB - i * U); ctx.stroke();
    }
    ctx.restore();

    // 目標：面積 a 的磁磚
    const side = Math.sqrt(a) * U;
    tlTile(ctx, X0, YB - side, side, side, TL_TERRA, { alpha: 0.26, dash: [7, 5], lw: 2.5 });
    drawExpr(ctx, [T('面積', TL_TERRA), T(a, TL_TERRA)], X0 + side / 2, YB - side / 2, 16, TL_TERRA, { maxW: Math.max(40, side - 6) });

    // 試的邊長
    const ts = t / 10 * U;
    ctx.save();
    ctx.strokeStyle = TL_COBALT;
    ctx.lineWidth = 3;
    ctx.strokeRect(X0, YB - ts, ts, ts);
    ctx.restore();
    textCenter(ctx, `試的邊長 s = ${decStr(t, 1)}`, X0 + 2.5 * U, YB + 18, TL_COBALT, f(700, 14));

    // 右側說明板
    const PX = 326, PW_ = 200;
    drawPanel(ctx, PX - 8, 138, PW_ + 8, 330, C, 0.06);
    let y = 164;
    exprLeft(ctx, [IT('s', TL_COBALT), T('=', INK), T(decStr(t, 1), TL_COBALT)], PX, y, 18, INK, PW_);
    y += 34;
    exprLeft(ctx, [PW(IT('s', TL_COBALT), 2, false, TL_COBALT), T('=', INK), T(decStr(t2, 2), TL_COBALT)], PX, y, 18, INK, PW_);
    y += 36;
    let chip, chipCol;
    if (t2 < A100) { chip = '比 a 小，再大一點'; chipCol = TL_COBALT; }
    else if (t2 > A100) { chip = '比 a 大，再小一點'; chipCol = TL_ROSE; }
    else { chip = '剛好等於 a！'; chipCol = OK_COLOR; }
    drawChip(ctx, PX, y - 15, PW_ - 6, 30, chip, chipCol, 'rgba(15, 23, 42, 0.6)');
    y += 42;
    if (perfect) {
      textLeft(ctx, `${a} 是 ${k} × ${k}，`, PX, y, INK, f(700, 15));
      y += 26;
      textLeft(ctx, `邊長剛好是整數 ${k}`, PX, y, INK, f(700, 15));
      y += 34;
    } else {
      textLeft(ctx, '一位小數試不到剛好：', PX, y, INK, f(700, 15));
      y += 30;
      exprLeft(ctx, [PW(T(decStr(q, 1), MUTED), 2, false, MUTED), T('=', MUTED), T(decStr(q * q, 2), MUTED), T('<', INK), T(a, TL_TERRA)], PX, y, 16, INK, PW_);
      y += 30;
      exprLeft(ctx, [PW(T(decStr(q + 1, 1), MUTED), 2, false, MUTED), T('=', MUTED), T(decStr((q + 1) * (q + 1), 2), MUTED), T('>', INK), T(a, TL_TERRA)], PX, y, 16, INK, PW_);
      y += 32;
      textLeft(ctx, '邊長只好用新符號表示：', PX, y, INK, f(700, 15));
      y += 30;
    }
    exprLeft(ctx, [PW(rtItem(a, TL_TERRA), 2, true, TL_TERRA), T('=', INK), T(a, TL_TERRA)], PX, y + 4, 22, INK, PW_);

    out.innerHTML = `邊長 ${wbrEq(`\\sqrt{${a}}${perfect ? ` = ${k}` : ''}`)}，<wbr>\\( (\\sqrt{${a}})^2 = ${a} \\)`;
    fb.innerHTML = wrapFeedback(perfect
      ? `\\(${a} = ${k}^2\\)，面積 \\(${a}\\) 的正方形邊長剛好是 \\(${k}\\)，也就是 \\(\\sqrt{${a}} = ${k}\\)。`
      : `\\(${decStr(q, 1)}^2 = ${decStr(q * q, 2)}\\)、\\(${decStr(q + 1, 1)}^2 = ${decStr((q + 1) * (q + 1), 2)}\\)，都不是 \\(${a}\\)。邊長不是整數、也不是一位小數，所以寫成 <b style="color:${TL_TERRA}">\\(\\sqrt{${a}}\\)</b>。`);
    typeset([out, fb]);
  }

  [sa, ss].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 2：根號比大小——面積大的磚，邊長也大
   ========================================================================== */
function initCompareCanvas() {
  const cv = elById('canvas-compare');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('cp-a'), sb = elById('cp-b'), st = elById('cp-t');
  const va = elById('cp-va'), vb = elById('cp-vb'), vt = elById('cp-vt');
  const rowA = elById('cp-row-a'), rowB = elById('cp-row-b'), rowT = elById('cp-row-t');
  const mG = elById('cp-mode-group');
  const out = elById('cp-formula');
  const fb = elById('cp-feedback');
  const C = TL_TONE[1];
  let mode = 'pos';

  function relOf(x, y) { return x > y ? '>' : (x < y ? '<' : '='); }
  function relTex(r) { return r === '>' ? '\\gt' : (r === '<' ? '\\lt' : '='); }

  function drawPosNeg(neg) {
    const a = iv(sa), b = iv(sb);
    va.textContent = a; vb.textContent = b;
    const r = relOf(a, b);
    const rr = neg ? relOf(b, a) : r;   // 加負號之後反過來
    const itA = neg ? negRt(a, TL_TERRA) : rtItem(a, TL_TERRA);
    const itB = neg ? negRt(b, TL_COBALT) : rtItem(b, TL_COBALT);
    drawEqPanel(ctx, [itA, T(rr, C), itB], 80, C, { h: 30, size: 26 });

    // 兩塊磁磚
    const U = 40, YB = 290;
    const sA = Math.sqrt(a) * U, sB = Math.sqrt(b) * U;
    tlTile(ctx, 60, YB - sA, sA, sA, TL_TERRA);
    tlTile(ctx, 300, YB - sB, sB, sB, TL_COBALT);
    textCenter(ctx, `面積 ${a}`, 60 + sA / 2, YB + 16, TL_TERRA, f(700, 14));
    textCenter(ctx, `面積 ${b}`, 300 + sB / 2, YB + 16, TL_COBALT, f(700, 14));
    drawExpr(ctx, [T('邊長', TL_TERRA), rtItem(a, TL_TERRA)], 60 + Math.max(sA, 70) / 2, YB - sA - 18, 15, TL_TERRA);
    drawExpr(ctx, [T('邊長', TL_COBALT), rtItem(b, TL_COBALT)], 300 + Math.max(sB, 70) / 2, YB - sB - 18, 15, TL_COBALT);

    // 數線
    const LY = 372;
    const min = neg ? -5 : 0, max = neg ? 0 : 5;
    const px = srLine(ctx, { x0: 50, x1: 480, y: LY, min, max, n: 5, label: i => String(min + i) });
    const vA = (neg ? -1 : 1) * Math.sqrt(a), vB = (neg ? -1 : 1) * Math.sqrt(b);
    drawDot(ctx, px(vA), LY, TL_TERRA, 7);
    drawDot(ctx, px(vB), LY, TL_COBALT, 7);
    if (a === b) {
      drawExpr(ctx, [itA], px(vA), LY - 26, 15, TL_TERRA);
    } else {
      // 兩個點靠得太近時，一個標上面、一個標更上面
      const close = Math.abs(px(vA) - px(vB)) < 64;
      drawExpr(ctx, [itA], px(vA), LY - 24, 15, TL_TERRA);
      drawExpr(ctx, [itB], px(vB), LY - (close ? 52 : 24), 15, TL_COBALT);
    }

    // 結論
    let items;
    if (!neg) {
      items = [T(a, TL_TERRA), T(r, INK), T(b, TL_COBALT), T('⇒', INK), rtItem(a, TL_TERRA), T(r, INK), rtItem(b, TL_COBALT)];
    } else {
      items = [rtItem(a, TL_TERRA), T(r, INK), rtItem(b, TL_COBALT), T('⇒', INK), negRt(a, TL_TERRA), T(rr, C), negRt(b, TL_COBALT)];
    }
    drawEqPanel(ctx, items, 446, C, { h: 26, size: 21 });

    const L = neg ? `-\\sqrt{${a}}` : `\\sqrt{${a}}`, R = neg ? `-\\sqrt{${b}}` : `\\sqrt{${b}}`;
    out.innerHTML = wbrRel(`${L} ${relTex(rr)} ${R}`);
    if (a === b) {
      fb.innerHTML = wrapFeedback(`兩塊磚面積一樣，邊長也一樣。`);
    } else if (!neg) {
      fb.innerHTML = wrapFeedback(`面積 \\(${a} ${relTex(r)} ${b}\\)，面積大的磚邊長也大，所以 \\(\\sqrt{${a}} ${relTex(r)} \\sqrt{${b}}\\)。`);
    } else {
      fb.innerHTML = wrapFeedback(`\\(\\sqrt{${a}} ${relTex(r)} \\sqrt{${b}}\\)，加上負號後在數線上左右對調，大小<b style="color:${C}">反過來</b>：\\(-\\sqrt{${a}} ${relTex(rr)} -\\sqrt{${b}}\\)。`);
    }
  }

  function drawSelf() {
    const t = iv(st);                 // a = t / 10
    vt.textContent = decStr(t, 1);
    const aS = decStr(t, 1);
    const av = t / 10, rv = Math.sqrt(av);
    const r = t === 10 ? '=' : (t > 10 ? '<' : '>');   // √a 和 a 比
    drawEqPanel(ctx, [rtItem(aS, TL_JADE), T(r, C), T(aS, TL_TERRA)], 80, C, { h: 30, size: 26 });

    // 面積 a 的磚：邊長是 √a
    const U = 96, X0 = 60, YB = 300;
    const s = rv * U;
    tlTile(ctx, X0, YB - s, s, s, TL_TERRA);
    textCenter(ctx, `面積 ${aS}`, X0 + s / 2, YB + 16, TL_TERRA, f(700, 14));
    ctx.save();
    ctx.strokeStyle = TL_JADE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(X0, YB - s - 6);
    ctx.lineTo(X0 + s, YB - s - 6);
    ctx.stroke();
    ctx.restore();
    drawExpr(ctx, [T('邊長', TL_JADE), rtItem(aS, TL_JADE)], X0 + Math.max(s, 80) / 2, YB - s - 26, 15, TL_JADE);

    // 右邊：1 × 1 的參考磚
    tlTile(ctx, 330, YB - U, U, U, MUTED, { alpha: 0.12, dash: [5, 4] });
    textCenter(ctx, '面積 1，邊長 1', 330 + U / 2, YB + 16, MUTED, f(700, 13));

    // 數線上比較兩個長度
    const LY = 384;
    const px = srLine(ctx, { x0: 50, x1: 470, y: LY, min: 0, max: 3, n: 6, label: i => (i % 2 === 0 ? String(i / 2) : decStr(i * 5, 1)) });
    drawDot(ctx, px(av), LY, TL_TERRA, 7);
    drawDot(ctx, px(rv), LY, TL_JADE, 7);
    const close = Math.abs(px(av) - px(rv)) < 60;
    drawExpr(ctx, [T('a', TL_TERRA)], px(av), LY - 22, 16, TL_TERRA);
    drawExpr(ctx, [rtItem('a', TL_JADE)], px(rv), LY - (close ? 48 : 24), 16, TL_JADE);
    ctx.save();
    ctx.strokeStyle = TL_GOLD;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(px(1), LY - 60); ctx.lineTo(px(1), LY + 5); ctx.stroke();
    ctx.restore();

    let msg;
    if (t > 10) msg = 'a 比 1 大：開根號之後變小了';
    else if (t < 10) msg = 'a 比 1 小：開根號之後反而變大';
    else msg = 'a = 1：開根號還是 1';
    drawNote(ctx, msg, 452, C, 16);

    out.innerHTML = `\\( \\sqrt{${aS}} \\approx ${rv.toFixed(3)} \\)<wbr>\\( {}${relTex(r)} ${aS} \\)`;
    fb.innerHTML = wrapFeedback(`面積 \\(${aS}\\) 的磚，邊長 \\(\\sqrt{${aS}} \\approx ${rv.toFixed(3)}\\)。${t === 10 ? '兩者相等。' : (t > 10 ? '邊長比面積的數字小。' : '邊長比面積的數字<b style="color:' + C + '">大</b>，不是所有正數開根號都會變小。')}`);
  }

  function draw() {
    rowA.style.display = mode === 'self' ? 'none' : '';
    rowB.style.display = mode === 'self' ? 'none' : '';
    rowT.style.display = mode === 'self' ? '' : 'none';
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'self' ? '√a 和 a，誰比較大？' : (mode === 'neg' ? '加上負號，大小反過來' : '面積大的磚，邊長也大'), C);
    if (mode === 'self') drawSelf();
    else drawPosNeg(mode === 'neg');
    typeset([out, fb]);
  }

  [sa, sb, st].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-cp-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 3：完全平方數——n 塊方磚排得成實心正方形嗎？
   ========================================================================== */
function initPerfectCanvas() {
  const cv = elById('canvas-perfect');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sn = elById('pf-n'), vn = elById('pf-vn');
  const out = elById('pf-formula');
  const fb = elById('pf-feedback');
  const C = TL_TONE[2];
  const S = 25, X0 = 36, Y0 = 58;

  function draw() {
    const n = iv(sn);
    vn.textContent = n;
    const k = isqrt(n), r = n - k * k, perfect = (r === 0);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `${n} 塊方磚，排得成實心正方形嗎？`, C);

    // k × k 的方陣
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        tlTile(ctx, X0 + j * S + 1, Y0 + i * S + 1, S - 2, S - 2, TL_TERRA, { alpha: 0.32, lw: 1.5 });
      }
    }
    // 多出來的：先排右邊一直行，再排下面一橫列
    for (let m = 0; m < r; m++) {
      let col, row;
      if (m < k) { col = k; row = m; } else { col = m - k; row = k; }
      tlTile(ctx, X0 + col * S + 1, Y0 + row * S + 1, S - 2, S - 2, TL_ROSE, { alpha: 0.30, lw: 1.5, dash: [3, 2] });
    }

    // 右側說明
    const PX = 334, PW_ = 192;
    drawPanel(ctx, PX - 8, 58, PW_ + 8, 272, C, 0.06);
    let y = 84;
    textLeft(ctx, `一共 ${n} 塊方磚`, PX, y, INK, f(700, 16));
    y += 34;
    textLeft(ctx, `最大排成 ${k} × ${k} = ${k * k}`, PX, y, TL_TERRA, f(700, 16));
    y += 34;
    if (perfect) {
      drawChip(ctx, PX, y - 15, PW_ - 6, 30, '剛好排滿，沒有剩！', OK_COLOR, 'rgba(15, 23, 42, 0.6)');
      y += 44;
      textLeft(ctx, `${n} 是完全平方數`, PX, y, INK, f(700, 16));
      y += 40;
      exprLeft(ctx, [rtItem(n, C), T('=', INK), RT(PW(T(k, C), 2, false, C), C), T('=', INK), T(k, C)], PX, y, 20, INK, PW_);
    } else {
      drawChip(ctx, PX, y - 15, PW_ - 6, 30, `還剩 ${r} 塊排不進去`, TL_ROSE, 'rgba(15, 23, 42, 0.6)');
      y += 44;
      textLeft(ctx, `${n} 不是完全平方數`, PX, y, INK, f(700, 16));
      y += 38;
      exprLeft(ctx, [PW(T(k, MUTED), 2, false, MUTED), T('<', INK), T(n, C), T('<', INK), PW(T(k + 1, MUTED), 2, false, MUTED)], PX, y, 19, INK, PW_);
      y += 40;
      exprLeft(ctx, [T(k, MUTED), T('<', INK), rtItem(n, C), T('<', INK), T(k + 1, MUTED)], PX, y, 19, INK, PW_);
    }

    // 下方：附近的完全平方數
    const lo = Math.max(1, k - 1);
    const items = [];
    for (let m = lo; m < lo + 4; m++) {
      if (items.length) items.push(T('、', MUTED));
      const hit = (m * m === n);
      items.push(SEQ([PW(T(m, hit ? C : MUTED), 2, false, hit ? C : MUTED), T('=', hit ? C : MUTED), T(m * m, hit ? C : MUTED)], INK, 3));
    }
    textLeft(ctx, '附近的完全平方數：', 30, 360, INK, f(700, 15));
    drawExpr(ctx, items, 270, 396, 18, INK, { maxW: 500 });

    out.innerHTML = perfect
      ? wbrEq(`\\sqrt{${n}} = \\sqrt{${k}^2} = ${k}`)
      : wbrRel(`${k}^2 \\lt ${n} \\lt ${k + 1}^2`);
    fb.innerHTML = wrapFeedback(perfect
      ? `\\(${n} = ${k}^2\\)，${n} 塊方磚剛好排成 \\(${k} \\times ${k}\\) 的實心正方形，所以 <b style="color:${C}">\\(\\sqrt{${n}} = ${k}\\)</b>。`
      : `排成 \\(${k} \\times ${k}\\) 還剩 \\(${r}\\) 塊，補成 \\(${k + 1} \\times ${k + 1}\\) 又不夠。\\(${n}\\) 不是完全平方數，\\(\\sqrt{${n}}\\) 不是整數。`);
    typeset([out, fb]);
  }

  sn.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 4：用標準分解式求 √a——質因數平分成兩組
   ========================================================================== */
// 候選數字刻意避開課本例題與本節評量（開發約束 29）
const FC_LIST = [576, 900, 1296, 1600, 1764, 3136, 4356, 1024, 2401, 72, 180, 500, 1200];

function primeFactors(n) {
  const out = [];
  let m = n;
  for (let p = 2; p * p <= m; p++) {
    let e = 0;
    while (m % p === 0) { m /= p; e++; }
    if (e) out.push([p, e]);
  }
  if (m > 1) out.push([m, 1]);
  return out;
}

// 標準分解式的 canvas 元件：2⁶ × 3²（指數 1 不寫）
function factorItems(fs, color, half) {
  const items = [];
  fs.forEach(([p, e], i) => {
    const ee = half ? e / 2 : e;
    if (ee === 0) return;
    if (items.length) items.push(T('×', INK));
    items.push(ee === 1 ? T(p, color) : PW(T(p, color), ee, false, color));
  });
  return items;
}

function factorTex(fs, half) {
  return fs.map(([p, e]) => {
    const ee = half ? e / 2 : e;
    return ee === 1 ? `${p}` : `${p}^{${ee}}`;
  }).filter((s, i) => (half ? fs[i][1] / 2 : fs[i][1]) !== 0).join(' \\times ');
}

function initFactorCanvas() {
  const cv = elById('canvas-factor');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const si = elById('fc-i'), vi = elById('fc-vi');
  const out = elById('fc-formula');
  const fb = elById('fc-feedback');
  const C = TL_TONE[3];

  function draw() {
    const n = FC_LIST[iv(si)];
    vi.textContent = n;
    const fs = primeFactors(n);
    const odd = fs.filter(([p, e]) => e % 2 === 1);
    const perfect = odd.length === 0;
    const half = fs.reduce((s, [p, e]) => s * Math.pow(p, Math.floor(e / 2)), 1);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `把 ${n} 的質因數平分成兩組`, C);
    drawEqPanel(ctx, [rtItem(n, C), T('=', INK), T('?', C)], 78, C, { h: 28, size: 24 });

    // 質因數磁磚：成對的一顆放上排、一顆放下排；落單的放第三排
    const rowA = [], rowB = [], lone = [];
    fs.forEach(([p, e]) => {
      for (let i = 0; i < Math.floor(e / 2); i++) { rowA.push(p); rowB.push(p); }
      if (e % 2) lone.push(p);
    });
    const S = 34, G = 6, X0 = 118;
    function tileRow(list, y, color, label, tail) {
      textLeft(ctx, label, 22, y + S / 2, color, f(700, 14));
      list.forEach((p, i) => {
        tlTile(ctx, X0 + i * (S + G), y, S, S, color, { alpha: 0.28 });
        textCenter(ctx, String(p), X0 + i * (S + G) + S / 2, y + S / 2 + 1, TL_CREAM, f(800, 16));
      });
      if (tail) textLeft(ctx, tail, X0 + list.length * (S + G) + 8, y + S / 2, color, f(700, 15));
    }
    tileRow(rowA, 124, TL_TERRA, '第一組', rowA.length ? `乘起來 = ${half}` : '');
    tileRow(rowB, 168, TL_COBALT, '第二組', rowB.length ? `乘起來 = ${half}` : '');
    if (lone.length) tileRow(lone, 212, TL_ROSE, '落單', '← 配不成對');
    else textLeft(ctx, '每一顆質因數都配成對，沒有落單', X0, 229, OK_COLOR, f(700, 14));

    // 步驟
    const rows = [];
    rows.push({ name: '① 標準分解式', hint: '短除法拆成質因數', items: [T(n, C), T('=', INK)].concat(factorItems(fs, C, false)) });
    if (perfect) {
      rows.push({ name: '② 看指數', hint: '每個指數都是偶數', items: [T('指數都能除以 2', INK)] });
      rows.push({ name: '③ 寫成平方', hint: '指數各除以 2，放進括號', items: [PW(SEQ(factorItems(fs, C, true), C, 4), 2, true, C)] });
      const res = [T(half, C)];
      const halfIt = factorItems(fs, C, true);
      rows.push({ name: '④ 開根號', hint: '平方與根號抵消', items: [rtItem(n, C), T('=', INK)].concat(halfIt.length > 1 || (fs.length === 1 && fs[0][1] > 2) ? halfIt.concat([T('=', INK)], res) : res) });
    } else {
      const ps = odd.map(([p]) => p).join('、');
      rows.push({ name: '② 看指數', hint: `${ps} 的指數是奇數`, items: [T('有質因數落單', TL_ROSE)] });
      rows.push({ name: '③ 結論', hint: '寫不成整數的平方', items: [T(`${n} 不是完全平方數`, INK)] });
      const k = isqrt(n);
      rows.push({ name: '④ 夾在中間', hint: '√n 不是整數', items: [T(k, MUTED), T('<', INK), rtItem(n, C), T('<', INK), T(k + 1, MUTED)] });
    }
    drawStepRows(ctx, rows, 4, { top: 288, gap: 54, labX: 22, eqX: 158, size: 21, color: C });

    out.innerHTML = perfect
      ? wbrEq(`\\sqrt{${n}} = \\sqrt{(${factorTex(fs, true)})^2} = ${half}`)
      : `\\( ${n} = ${factorTex(fs, false)} \\)，<wbr>不是完全平方數`;
    fb.innerHTML = wrapFeedback(perfect
      ? `\\(${n} = ${factorTex(fs, false)}\\)，指數都是偶數，質因數剛好平分成兩組，每組乘起來是 <b style="color:${C}">\\(${half}\\)</b>，所以 \\(\\sqrt{${n}} = ${half}\\)。`
      : `\\(${n} = ${factorTex(fs, false)}\\)，${odd.map(([p]) => `\\(${p}\\)`).join('、')} 的指數是奇數，有質因數落單，平分不成兩組。`);
    typeset([out, fb]);
  }

  si.max = FC_LIST.length - 1;
  si.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 5：分數、小數、帶分數的 √——先化成「分子分母都是平方」
   ========================================================================== */
// 都用「根」來存：分數 a/b、小數 r/10^h、帶分數 a/b（a > b）
// 小數的 r 一律與 10 互質：r²/10^(2h) 與 r/10^h 才本來就是最簡分數（6.25 會變成 625/100）
const FD_DATA = {
  frac: [[2, 3], [4, 5], [7, 8], [5, 6], [9, 10], [11, 12], [6, 7]],
  dec: [[9, 1], [23, 1], [7, 2], [17, 1], [11, 2], [3, 1], [19, 1]],
  mixed: [[3, 2], [6, 5], [7, 3], [7, 6], [8, 5], [9, 5]]
};

// 帶分數的 canvas 元件與 TeX：N/D（N > D）
function mixedParts(N, D) {
  return [Math.floor(N / D), N % D, D];
}

function mixedItem(N, D, color) {
  const [w, r, d] = mixedParts(N, D);
  if (r === 0) return T(w, color);
  return SEQ([T(w, color), FR(r, d, color)], color, 2);
}

function mixedTex(N, D) {
  const [w, r, d] = mixedParts(N, D);
  return r === 0 ? `${w}` : `${w}\\frac{${r}}{${d}}`;
}

function initFracDecCanvas() {
  const cv = elById('canvas-fracdec');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const si = elById('fd-i'), vi = elById('fd-vi');
  const mG = elById('fd-mode-group');
  const out = elById('fd-formula');
  const fb = elById('fd-feedback');
  const C = TL_TONE[4];
  let mode = 'frac';

  function draw() {
    const list = FD_DATA[mode];
    si.max = list.length - 1;
    if (iv(si) > list.length - 1) si.value = 0;
    const [p, q] = list[iv(si)];
    ctx.clearRect(0, 0, cv.width, cv.height);

    let side, unitGrid, headItems, valTex, rootTex, rows, areaLabel, note, U;
    if (mode === 'dec') {
      const den = Math.pow(10, q);
      const vS = decStr(p * p, 2 * q), rS = decStr(p, q);
      side = p / den;
      unitGrid = q === 1 ? 10 : 0;
      U = 170;
      areaLabel = vS;
      headItems = [rtItem(vS, C), T('=', INK), T('?', C)];
      valTex = vS; rootTex = rS;
      rows = [
        { name: '① 化成分數', hint: `小數 ${2 * q} 位，分母是 ${den * den}`, items: [rtItem(vS, C), T('=', INK), RT(FR(p * p, den * den, C), C)] },
        { name: '② 分子分母都是平方', hint: '寫成一個數的平方', items: [RT(PW(FR(p, den, C), 2, true, C), C)] },
        { name: '③ 開根號', hint: `小數位數減半，剩 ${q} 位`, items: [FR(p, den, C), T('=', INK), T(rS, C)] }
      ];
      note = `${2 * q} 位小數開根號後剩 ${q} 位：${vS} → ${rS}`;
      out.innerHTML = wbrEq(`\\sqrt{${vS}} = \\sqrt{\\frac{${p * p}}{${den * den}}} = \\frac{${p}}{${den}} = ${rS}`);
      fb.innerHTML = wrapFeedback(`\\(${vS} = \\frac{${p * p}}{${den * den}} = \\left(\\frac{${p}}{${den}}\\right)^2\\)，所以 <b style="color:${C}">\\(\\sqrt{${vS}} = ${rS}\\)</b>。驗算：\\(${rS}^2 = ${vS}\\)。`);
    } else {
      const N = p * p, D = q * q;
      side = p / q;
      unitGrid = q <= 12 ? q : 0;
      U = 170;
      if (mode === 'frac') {
        areaLabel = `${N}/${D}`;
        headItems = [RT(FR(N, D, C), C), T('=', INK), T('?', C)];
        rows = [
          { name: '① 分子分母', hint: '各自是一個數的平方', items: [RT(FR(N, D, C), C), T('=', INK), RT(VF(PW(T(p, C), 2, false, C), PW(T(q, C), 2, false, C), C), C)] },
          { name: '② 寫成平方', hint: '整個分數的平方', items: [RT(PW(FR(p, q, C), 2, true, C), C)] },
          { name: '③ 開根號', hint: '分子、分母各自開根號', items: [FR(p, q, C)] }
        ];
        note = `分子 ${N} 開根號是 ${p}、分母 ${D} 開根號是 ${q}`;
        out.innerHTML = wbrEq(`\\sqrt{\\frac{${N}}{${D}}} = \\sqrt{\\left(\\frac{${p}}{${q}}\\right)^2} = \\frac{${p}}{${q}}`);
        fb.innerHTML = wrapFeedback(`\\(${N} = ${p}^2\\)、\\(${D} = ${q}^2\\)，所以 <b style="color:${C}">\\(\\sqrt{\\frac{${N}}{${D}}} = \\frac{${p}}{${q}}\\)</b>。驗算：\\(\\left(\\frac{${p}}{${q}}\\right)^2 = \\frac{${N}}{${D}}\\)。`);
      } else {
        const [w, r, d] = mixedParts(N, D);
        areaLabel = `${w} ${r}/${d}`;
        headItems = [RT(mixedItem(N, D, C), C), T('=', INK), T('?', C)];
        rows = [
          { name: '① 先化假分數', hint: '帶分數不能直接開根號', items: [RT(mixedItem(N, D, C), C), T('=', INK), RT(FR(N, D, C), C)] },
          { name: '② 寫成平方', hint: '分子分母都是平方', items: [RT(PW(FR(p, q, C), 2, true, C), C)] },
          { name: '③ 開根號', hint: '需要時再寫回帶分數', items: [FR(p, q, C), T('=', INK), mixedItem(p, q, C)] }
        ];
        const wrong = Math.sqrt(w) + Math.sqrt(r / d);
        note = `✗ 整數、分數分開開根號：√${w} + √(${r}/${d}) ≈ ${wrong.toFixed(3)}，不是 ${(p / q).toFixed(3)}`;
        out.innerHTML = wbrEq(`\\sqrt{${mixedTex(N, D)}} = \\sqrt{\\frac{${N}}{${D}}} = \\frac{${p}}{${q}} = ${mixedTex(p, q)}`);
        fb.innerHTML = wrapFeedback(`\\(${mixedTex(N, D)} = \\frac{${N}}{${D}} = \\left(\\frac{${p}}{${q}}\\right)^2\\)，所以 <b style="color:${C}">\\(\\sqrt{${mixedTex(N, D)}} = ${mixedTex(p, q)}\\)</b>。不可以把 \\(${w}\\) 和 \\(\\frac{${r}}{${d}}\\) 分開開根號。`);
      }
    }

    drawTitle(ctx, mode === 'dec' ? '小數開根號：先化成分數' : (mode === 'mixed' ? '帶分數開根號：先化成假分數' : '分數開根號：分子分母各自開'), C);
    drawEqPanel(ctx, headItems, 78, C, { h: 28, size: 24 });

    // 左：1 × 1 的參考磚與面積為這個數的磚。邊長比 1 大時（6.25、帶分數）
    // 整張圖等比例縮小，最大的那塊不超過 168px，才不會壓到上方的算式框
    U = Math.min(U, 168 / Math.max(1, side));
    if (unitGrid && U / unitGrid < 9) unitGrid = 0;   // 格子太密就不畫格線
    const X0 = 50, YB = 312;
    tlTile(ctx, X0, YB - U, U, U, MUTED, { alpha: 0.06, dash: [5, 4], glaze: false });
    textCenter(ctx, '1', X0 - 12, YB - U / 2, MUTED, f(700, 14));
    const s = side * U;
    tlTile(ctx, X0, YB - s, s, s, C, { alpha: 0.32 });
    if (unitGrid) {
      ctx.save();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.lineWidth = 1;
      const g = U / unitGrid;
      for (let x = g; x < s - 0.5; x += g) { ctx.beginPath(); ctx.moveTo(X0 + x, YB); ctx.lineTo(X0 + x, YB - s); ctx.stroke(); }
      for (let y = g; y < s - 0.5; y += g) { ctx.beginPath(); ctx.moveTo(X0, YB - y); ctx.lineTo(X0 + s, YB - y); ctx.stroke(); }
      ctx.restore();
    }

    // 右：面積與邊長
    const PX = 300;
    textLeft(ctx, '面積', PX, 146, MUTED, f(700, 15));
    drawExpr(ctx, [headItems[0].inner], 0, 178, 22, C, { left: PX, maxW: 220 });
    textLeft(ctx, '邊長', PX, 222, MUTED, f(700, 15));
    drawExpr(ctx, rows[2].items, 0, 258, 22, C, { left: PX, maxW: 220 });
    if (unitGrid) textLeft(ctx, `每一小格的邊長是 1/${unitGrid}`, PX, 298, MUTED, f(600, 13));

    // 根號裡放分數、外面再加平方，一列很高，列距要拉開
    drawStepRows(ctx, rows, 3, { top: 374, gap: 74, labX: 22, eqX: 172, size: 19, color: C });
    drawNote(ctx, note, 578, note.charAt(0) === '✗' ? TL_ROSE : MUTED, 13.5);

    vi.textContent = mode === 'dec' ? decStr(p * p, 2 * q) : (mode === 'frac' ? `${p * p}/${q * q}` : areaLabel);
    typeset([out, fb]);
  }

  si.addEventListener('input', draw);
  bindPickGroup(mG, 'data-fd-mode', v => { mode = v; si.value = 0; draw(); });
  draw();
}

/* ==========================================================================
   重點 6：十分逼近法——一格分成十等分，一位一位夾出來
   ========================================================================== */
function initTenthCanvas() {
  const cv = elById('canvas-tenth');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('te-a'), va = elById('te-va');
  const bPrev = elById('te-prev'), bNext = elById('te-next');
  const out = elById('te-formula');
  const fb = elById('te-feedback');
  const C = TL_TONE[5];
  let step = 1;

  function sq10(t) { return decStr(t * t, 2); }

  function draw() {
    const a = iv(sa);
    va.textContent = a;
    const k = isqrt(a), perfect = (k * k === a);
    if (perfect) step = 1;
    const t = isqrt(a * 100);          // 一位小數 × 10：t/10 < √a < (t+1)/10
    const m = 2 * t + 1;               // 中點 × 20
    const midS = decStr(m * 5, 2);     // 例：2.25
    const midSq = decStr(m * m * 25, 4);
    const up = m * m > a * 400;        // 中點的平方比 a 大 ⇒ √a 在下半段 ⇒ 捨去

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `十分逼近法：夾出 √${a}`, C);
    bPrev.disabled = (step <= 1);
    bNext.disabled = perfect || step >= 3;

    // 第 1 層：整數
    const Y1 = 84;
    const px1 = srLine(ctx, { x0: 40, x1: 496, y: Y1, min: 0, max: 6, n: 6, label: i => String(i) });
    for (let i = 0; i <= 6; i++) textCenter(ctx, `${i}²=${i * i}`, px1(i), Y1 + 34, MUTED, f(600, 11.5));
    if (perfect) {
      drawDot(ctx, px1(k), Y1, OK_COLOR, 8);
      drawEqPanel(ctx, [T(a, C), T('=', INK), PW(T(k, C), 2, false, C), T('⇒', INK), rtItem(a, C), T('=', INK), T(k, C)], 200, C, { h: 30, size: 24 });
      drawNote(ctx, `${a} 是完全平方數，√${a} 剛好是整數，不必逼近`, 262, INK, 15);
      out.innerHTML = wbrEq(`\\sqrt{${a}} = ${k}`);
      fb.innerHTML = wrapFeedback(`\\(${a} = ${k}^2\\)，不必逼近。換一個不是完全平方數的 \\(a\\) 看看。`);
      typeset([out, fb]);
      return;
    }
    srBand(ctx, px1(k), px1(k + 1), Y1, TL_GOLD);
    exprLeft(ctx, [T('①', C), PW(T(k, INK), 2, false, INK), T('<', INK), T(a, C), T('<', INK), PW(T(k + 1, INK), 2, false, INK), T('⇒', INK),
      T(k, TL_GOLD), T('<', INK), rtItem(a, C), T('<', INK), T(k + 1, TL_GOLD)], 30, 154, 18, INK, 490);

    const texParts = [`${k} \\lt \\sqrt{${a}} \\lt ${k + 1}`];
    let msg = `${wbrRel(`${k}^2 = ${k * k} \\lt ${a} \\lt ${(k + 1) * (k + 1)} = ${k + 1}^2`)}，所以 \\(\\sqrt{${a}}\\) 夾在 \\(${k}\\) 和 \\(${k + 1}\\) 之間。`;

    if (step >= 2) {
      // 第 2 層：一位小數
      const Y2 = 236;
      srDash(ctx, px1(k), Y1 + 6, 40, Y2 - 10, TL_GOLD);
      srDash(ctx, px1(k + 1), Y1 + 6, 496, Y2 - 10, TL_GOLD);
      const px2 = srLine(ctx, { x0: 40, x1: 496, y: Y2, min: k, max: k + 1, n: 10, label: i => decStr(k * 10 + i, 1), font: f(700, 12) });
      for (let i = 0; i <= 10; i++) {
        const tt = k * 10 + i;
        const hit = (tt === t || tt === t + 1);
        textCenter(ctx, sq10(tt), px2(tt / 10), Y2 + 34, hit ? TL_GOLD : DIM, f(hit ? 800 : 600, 10.5));
      }
      srBand(ctx, px2(t / 10), px2((t + 1) / 10), Y2, TL_GOLD);
      exprLeft(ctx, [T('②', C), T(sq10(t), INK), T('<', INK), T(a, C), T('<', INK), T(sq10(t + 1), INK), T('⇒', INK),
        T(decStr(t, 1), TL_GOLD), T('<', INK), rtItem(a, C), T('<', INK), T(decStr(t + 1, 1), TL_GOLD)], 30, 302, 18, INK, 490);
      texParts.push(`${decStr(t, 1)} \\lt \\sqrt{${a}} \\lt ${decStr(t + 1, 1)}`);
      msg = `${wbrRel(`${decStr(t, 1)}^2 = ${sq10(t)} \\lt ${a} \\lt ${sq10(t + 1)} = ${decStr(t + 1, 1)}^2`)}，所以 \\(\\sqrt{${a}}\\) 夾在 \\(${decStr(t, 1)}\\) 和 \\(${decStr(t + 1, 1)}\\) 之間。`;

      if (step >= 3) {
        // 第 3 層：看中點 x.x5，決定四捨五入
        const Y3 = 386;
        srDash(ctx, px2(t / 10), Y2 + 6, 120, Y3 - 10, TL_GOLD);
        srDash(ctx, px2((t + 1) / 10), Y2 + 6, 420, Y3 - 10, TL_GOLD);
        const px3 = srLine(ctx, { x0: 120, x1: 420, y: Y3, min: 0, max: 2, n: 2, label: i => [decStr(t, 1), midS, decStr(t + 1, 1)][i], font: f(700, 13) });
        if (up) srBand(ctx, px3(0), px3(1), Y3, TL_GOLD); else srBand(ctx, px3(1), px3(2), Y3, TL_GOLD);
        textCenter(ctx, `${midS}² = ${midSq}`, px3(1), Y3 - 22, TL_ROSE, f(800, 13));
        const rounded = up ? decStr(t, 1) : decStr(t + 1, 1);
        exprLeft(ctx, [T('③', C), T(midSq, INK), T(up ? '>' : '<', INK), T(a, C), T('⇒', INK), rtItem(a, C), T(up ? '<' : '>', INK), T(midS, TL_ROSE)], 30, 446, 18, INK, 490);
        drawChip(ctx, 140, 470, 260, 34, `四捨五入：√${a} ≒ ${rounded}`, OK_COLOR, 'rgba(15, 23, 42, 0.6)');
        texParts.push(`\\sqrt{${a}} ${up ? '\\lt' : '\\gt'} ${midS}`);
        msg = `\\(${midS}^2 = ${midSq} ${up ? '\\gt' : '\\lt'} ${a}\\)，所以 \\(\\sqrt{${a}}\\) 比 \\(${midS}\\) ${up ? '小，小數第 2 位小於 5，捨去' : '大，小數第 2 位大於或等於 5，進位'}：<b style="color:${C}">\\(\\sqrt{${a}} \\approx ${rounded}\\)</b>。`;
      }
    }
    if (step < 3) drawNote(ctx, step === 1 ? '按「下一步」把這一格分成 10 等分' : '按「下一步」看小數第 2 位要不要進位', step === 1 ? 236 : 386, MUTED, 14);

    out.innerHTML = texParts.map(s => wbrRel(s)).join('，<wbr>');
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  sa.addEventListener('input', () => { step = 1; draw(); });
  bPrev.addEventListener('click', () => { if (step > 1) { step--; draw(); } });
  bNext.addEventListener('click', () => { if (step < 3) { step++; draw(); } });
  draw();
}

/* ==========================================================================
   重點 7：估整數部分與數線位置——含負號與 k√a
   ========================================================================== */
function initLocateCanvas() {
  const cv = elById('canvas-locate');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('lo-a'), sk = elById('lo-k');
  const va = elById('lo-va'), vk = elById('lo-vk');
  const rowK = elById('lo-row-k');
  const mG = elById('lo-mode-group');
  const out = elById('lo-formula');
  const fb = elById('lo-feedback');
  const C = TL_TONE[6];
  let mode = 'pos';

  function draw() {
    const a = iv(sa), k = iv(sk);
    va.textContent = a; vk.textContent = k;
    rowK.style.display = mode === 'mul' ? '' : 'none';
    const A = mode === 'mul' ? k * k * a : a;   // k√a = √(k²a)
    const n = isqrt(A), exact = (n * n === A);
    const neg = mode === 'neg';

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, neg ? '−√a 介於哪兩個連續整數之間？' : (mode === 'mul' ? 'k√a 先寫成一個根號再估' : '√a 介於哪兩個連續整數之間？'), C);

    let target;
    if (mode === 'pos') target = [rtItem(a, C)];
    else if (neg) target = [negRt(a, C)];
    else target = [SEQ([T(k, C), rtItem(a, C)], C, 2), T('=', INK), RT(SEQ([PW(T(k, C), 2, false, C), T('×', C), T(a, C)], C, 4), C), T('=', INK), rtItem(A, C)];
    drawEqPanel(ctx, target, 78, C, { h: 30, size: 24 });

    // 數線
    const LY = 186;
    let lo, hi;
    if (!neg) { lo = Math.max(0, n - 2); hi = lo + 6; }
    else { hi = -Math.max(0, n - 2); lo = hi - 6; }
    const px = srLine(ctx, { x0: 50, x1: 490, y: LY, min: lo, max: hi, n: 6, label: i => String(lo + i), font: f(700, 14) });
    for (let i = 0; i <= 6; i++) {
      const v = lo + i;
      textCenter(ctx, `${Math.abs(v) === v ? '' : '('}${v}${Math.abs(v) === v ? '' : ')'}²=${v * v}`.replace(/-/g, '−'), px(v), LY + 36, MUTED, f(600, 11));
    }
    const val = (neg ? -1 : 1) * Math.sqrt(A);
    if (!exact) {
      if (!neg) srBand(ctx, px(n), px(n + 1), LY, TL_GOLD);
      else srBand(ctx, px(-n - 1), px(-n), LY, TL_GOLD);
    }
    drawDot(ctx, px(val), LY, C, 8);
    drawExpr(ctx, [mode === 'mul' ? SEQ([T(k, C), rtItem(a, C)], C, 2) : target[0]], px(val), LY - 30, 17, C);

    // 步驟
    const rows = [];
    if (exact) {
      rows.push({ name: '① 剛好是平方', hint: '不必估', items: [T(A, C), T('=', INK), PW(T(n, C), 2, false, C)] });
      rows.push({ name: '② 結果', hint: '是整數', items: neg ? [negRt(a, C), T('=', INK), T(mn(-n), C)] : [rtItem(A, C), T('=', INK), T(n, C)] });
    } else {
      rows.push({ name: '① 找平方數', hint: '夾住被開方數', items: [PW(T(n, INK), 2, false, INK), T('=', INK), T(n * n, INK), T('<', INK), T(A, C), T('<', INK), T((n + 1) * (n + 1), INK), T('=', INK), PW(T(n + 1, INK), 2, false, INK)] });
      rows.push({ name: '② 開根號', hint: '大小關係不變', items: [T(n, TL_GOLD), T('<', INK), rtItem(A, C), T('<', INK), T(n + 1, TL_GOLD)] });
      if (neg) {
        rows.push({ name: '③ 加負號', hint: '左右對調，大小反過來', items: [T(mn(-(n + 1)), TL_GOLD), T('<', INK), negRt(a, C), T('<', INK), T(mn(-n), TL_GOLD)] });
      } else if (mode === 'mul') {
        rows.push({ name: '③ 寫回原式', hint: `${k}√${a} 就是 √${A}`, items: [T(n, TL_GOLD), T('<', INK), SEQ([T(k, C), rtItem(a, C)], C, 2), T('<', INK), T(n + 1, TL_GOLD)] });
      } else {
        rows.push({ name: '③ 整數部分', hint: '比它小的最大整數', items: [T(`√${a} 的整數部分是 ${n}`, INK)] });
      }
    }
    drawStepRows(ctx, rows, rows.length, { top: 286, gap: 60, labX: 22, eqX: 160, size: 20, color: C });

    let tex, msg;
    const head = neg ? `-\\sqrt{${a}}` : (mode === 'mul' ? `${k}\\sqrt{${a}}` : `\\sqrt{${a}}`);
    if (exact) {
      tex = wbrEq(`${head} = ${neg ? -n : n}`);
      msg = `\\(${A} = ${n}^2\\)，剛好是整數。`;
    } else if (neg) {
      tex = wbrRel(`-${n + 1} \\lt -\\sqrt{${a}} \\lt -${n}`);
      msg = `\\(${n} \\lt \\sqrt{${a}} \\lt ${n + 1}\\)，加上負號大小反過來：<b style="color:${C}">\\(-${n + 1} \\lt -\\sqrt{${a}} \\lt -${n}\\)</b>。注意 \\(-${n + 1}\\) 比 \\(-${n}\\) 小。`;
    } else {
      tex = wbrRel(`${n} \\lt ${head} \\lt ${n + 1}`);
      msg = mode === 'mul'
        ? `把 \\(${k}\\) 移進根號裡要先平方：\\(${k}\\sqrt{${a}} = \\sqrt{${A}}\\)。${wbrRel(`${n}^2 = ${n * n} \\lt ${A} \\lt ${(n + 1) * (n + 1)} = ${n + 1}^2`)}，所以 <b style="color:${C}">\\(${n} \\lt ${k}\\sqrt{${a}} \\lt ${n + 1}\\)</b>。`
        : `${wbrRel(`${n}^2 = ${n * n} \\lt ${a} \\lt ${(n + 1) * (n + 1)} = ${n + 1}^2`)}，所以 <b style="color:${C}">\\(${n} \\lt \\sqrt{${a}} \\lt ${n + 1}\\)</b>，整數部分是 \\(${n}\\)。`;
    }
    out.innerHTML = tex;
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  [sa, sk].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-lo-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 8：計算機求近似值——按鍵順序與四捨五入
   ========================================================================== */
const CALC_KEYS = [
  ['SHIFT', '√', '(', ')'],
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '−'],
  ['0', '.', '=', '+']
];

function initCalcCanvas() {
  const cv = elById('canvas-calc');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('ca-a'), sb = elById('ca-b'), sd = elById('ca-d');
  const va = elById('ca-va'), vb = elById('ca-vb'), vd = elById('ca-vd');
  const rowB = elById('ca-row-b');
  const mG = elById('ca-mode-group');
  const out = elById('ca-formula');
  const fb = elById('ca-feedback');
  const C = TL_TONE[7];
  let mode = 'one';

  // 計算機顯示 10 位有效數字
  function screen(v) {
    let s = v.toPrecision(10);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }

  function draw() {
    const a = iv(sa), b = iv(sb), d = iv(sd);
    va.textContent = a; vb.textContent = b; vd.textContent = d;
    rowB.style.display = mode === 'one' ? 'none' : '';
    const [rn, rd] = reduce(a, b);
    let keys, shown, want, wantTex;
    const aKeys = String(a).split(''), bKeys = String(b).split('');
    if (mode === 'one') {
      keys = ['√'].concat(aKeys, ['=']);
      want = Math.sqrt(a);
      shown = want;
      wantTex = `\\sqrt{${a}}`;
    } else if (mode === 'frac') {
      keys = ['√', '('].concat(aKeys, ['÷'], bKeys, [')', '=']);
      want = Math.sqrt(a / b);
      shown = want;
      wantTex = `\\sqrt{${fTex(a, b)}}`;
    } else {
      keys = ['√'].concat(aKeys, ['÷'], bKeys, ['=']);
      want = Math.sqrt(a / b);
      shown = Math.sqrt(a) / b;
      wantTex = `\\sqrt{${fTex(a, b)}}`;
    }
    const scr = screen(shown);
    const p10 = Math.pow(10, d);
    const R = Math.round(shown * p10);
    const rS = decFix(R, d);
    // 開得盡嗎？（顯示的值剛好是有限小數）
    const radN = mode === 'one' ? a : rn, radD = mode === 'one' ? 1 : rd;
    const exactRoot = mode !== 'wrong' && isqrt(radN) ** 2 === radN && isqrt(radD) ** 2 === radD && /^[0-9.]+$/.test(scr) && scr.replace('.', '').length < 9;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'wrong' ? '按鍵順序錯了，算出來的是別的數' : '用計算機求根號的近似值', C);

    // 計算機機身
    ctx.save();
    roundRect(ctx, 22, 52, 214, 440, 18);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    roundRect(ctx, 36, 68, 186, 70, 8);
    ctx.fillStyle = 'rgba(190, 242, 100, 0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(190, 242, 100, 0.45)';
    ctx.stroke();
    ctx.restore();
    textLeft(ctx, keys.join(' '), 44, 84, MUTED, f(600, 12));
    ctx.save();
    ctx.font = f(800, 22);
    ctx.fillStyle = '#d9f99d';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(scr, 214, 116);
    ctx.restore();

    // 按鍵：這一次有用到的鍵亮起來
    const used = new Set(keys);
    CALC_KEYS.forEach((row, r) => {
      row.forEach((lab, c) => {
        const x = 38 + c * 47, y = 158 + r * 64;
        const on = used.has(lab);
        ctx.save();
        roundRect(ctx, x, y, 40, 48, 8);
        ctx.fillStyle = on ? 'rgba(249, 168, 212, 0.30)' : 'rgba(148, 163, 184, 0.10)';
        ctx.fill();
        ctx.strokeStyle = on ? C : 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = on ? 2.4 : 1.2;
        ctx.stroke();
        ctx.restore();
        textCenter(ctx, lab, x + 20, y + 24, on ? '#ffffff' : MUTED, f(800, lab.length > 2 ? 10.5 : 16));
      });
    });

    // 右側：按鍵順序、螢幕、四捨五入、驗算
    const PX = 252;
    textLeft(ctx, '按鍵順序', PX, 70, MUTED, f(700, 14));
    let kx = PX;
    let ky = 100;
    keys.forEach(kk => {
      ctx.font = f(800, 14);
      const w = Math.max(26, ctx.measureText(kk).width + 14);
      if (kx + w > 528) { kx = PX; ky += 34; }
      drawChip(ctx, kx, ky - 14, w, 28, kk, C, 'rgba(249, 168, 212, 0.10)');
      kx += w + 5;
    });
    if (mode !== 'wrong') textLeft(ctx, '有些計算機要先按 SHIFT 才是 √', PX, ky + 28, DIM, f(600, 12));

    let y = ky + 66;
    textLeft(ctx, '螢幕顯示', PX, y, MUTED, f(700, 14));
    y += 28;
    // 第 d + 1 位小數標紅：它決定要不要進位
    const dot = scr.indexOf('.');
    ctx.save();
    ctx.font = f(800, 21);
    ctx.textBaseline = 'middle';
    let cx = PX;
    for (let i = 0; i < scr.length; i++) {
      const ch = scr[i];
      const pos = dot >= 0 ? i - dot : -1;
      ctx.fillStyle = (dot >= 0 && pos === d + 1) ? TL_ROSE : ((dot >= 0 && pos >= 1 && pos <= d) ? '#ffffff' : MUTED);
      ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + 1;
    }
    ctx.restore();
    y += 30;
    textLeft(ctx, `四捨五入到小數第 ${d} 位`, PX, y, INK, f(700, 14));
    y += mode === 'one' ? 28 : 40;   // 根號裡是分數時比較高
    const left = mode === 'one' ? rtItem(a, C) : RT(fracItem(a, b, C), C);
    if (mode === 'wrong') {
      exprLeft(ctx, [SEQ([rtItem(a, TL_ROSE), T('÷', TL_ROSE), T(b, TL_ROSE)], TL_ROSE, 4), T('≒', INK), T(rS, TL_ROSE)], PX, y + 4, 19, INK, 270);
      y += 46;
      const R2 = Math.round(want * p10);
      exprLeft(ctx, [T('應該是', OK_COLOR), left, T('≒', INK), T(decFix(R2, d), OK_COLOR)], PX, y + 4, 19, INK, 270);
      y += 46;
      wrapText(ctx, `先開根號再除，算的是 √${a} ÷ ${b}；要先算 ${a} ÷ ${b}，再開根號`, 390, y + 6, 262, 18, TL_ROSE, 13);
    } else {
      exprLeft(ctx, [left, T(exactRoot ? '=' : '≒', INK), T(rS, C)], PX, y + 4, 21, INK, 270);
      y += 50;
      if (exactRoot) {
        textLeft(ctx, '剛好開得盡，不是近似值', PX, y, OK_COLOR, f(700, 14));
      } else {
        exprLeft(ctx, [PW(T(rS, MUTED), 2, true, MUTED), T('=', INK), T(decStr(R * R, 2 * d), MUTED)], PX, y, 16, INK, 270);
        y += 30;
        textLeft(ctx, `≠ ${mode === 'one' ? a : (rd === 1 ? rn : rn + '/' + rd)}，螢幕上的數只是近似值`, PX, y, TL_ROSE, f(700, 13));
      }
    }

    out.innerHTML = mode === 'wrong'
      ? `\\( \\sqrt{${a}} \\div ${b} \\approx ${rS} \\)，<wbr>\\( ${wantTex} \\approx ${decFix(Math.round(want * p10), d)} \\)`
      : `\\( ${wantTex} ${exactRoot ? '=' : '\\approx'} ${rS} \\)`;
    fb.innerHTML = wrapFeedback(mode === 'wrong'
      ? `按 \\(\\sqrt{\\ }\\,${a} \\div ${b}\\) 會先算 \\(\\sqrt{${a}}\\) 再除以 \\(${b}\\)。要求 \\(${wantTex}\\)，必須先算 \\(${a} \\div ${b}\\)（用括號包起來），再開根號。`
      : (exactRoot
        ? `被開方數剛好是完全平方，\\(${wantTex} = ${rS}\\)。換一個數看看近似值。`
        : `螢幕顯示 \\(${scr}\\)，看小數第 \\(${d + 1}\\) 位決定進位或捨去，得 <b style="color:${C}">\\(${wantTex} \\approx ${rS}\\)</b>。`));
    typeset([out, fb]);
  }

  [sa, sb, sd].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-ca-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 9：平方根的意義——兩個數平方之後都是 a
   ========================================================================== */
function initRootsCanvas() {
  const cv = elById('canvas-roots');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('ro-a'), va = elById('ro-va');
  const out = elById('ro-formula');
  const fb = elById('ro-feedback');
  const C = TL_TONE[8];

  function draw() {
    const a = iv(sa);
    va.textContent = a;
    const k = isqrt(a), perfect = a > 0 && k * k === a;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, a > 0 ? `哪些數平方之後是 ${a}？` : (a === 0 ? '哪些數平方之後是 0？' : `哪些數平方之後是 ${mn(a)}？`), C);

    const Y1 = 116, Y2 = 312;
    textLeft(ctx, '數 b', 22, Y1 - 40, MUTED, f(700, 14));
    textLeft(ctx, '平方 b²', 22, Y2 - 52, MUTED, f(700, 14));
    const px1 = srLine(ctx, { x0: 50, x1: 490, y: Y1, min: -5, max: 5, n: 10, label: i => String(i - 5) });
    // 下面那條：負的那一段畫成禁區
    const px2v = v => 50 + (v + 10) / 30 * 440;
    ctx.save();
    ctx.fillStyle = 'rgba(253, 164, 175, 0.12)';
    ctx.fillRect(px2v(-10) - 16, Y2 - 30, px2v(0) - px2v(-10) + 16, 60);
    ctx.restore();
    textCenter(ctx, '平方不會落在這一段', (px2v(-10) + px2v(0)) / 2, Y2 - 40, TL_ROSE, f(700, 12.5));
    srLine(ctx, { x0: 50, x1: 490, y: Y2, min: -10, max: 20, n: 30, label: i => ((i - 10) % 5 === 0 ? String(i - 10) : null), font: f(700, 12) });

    if (a > 0) {
      const r = Math.sqrt(a);
      const xp = px1(r), xn = px1(-r), xa = px2v(a);
      drawArrow(ctx, xp, Y1 + 10, xa + 3, Y2 - 12, TL_JADE, 2.4);
      drawArrow(ctx, xn, Y1 + 10, xa - 3, Y2 - 12, TL_COBALT, 2.4);
      drawDot(ctx, xp, Y1, TL_JADE, 8);
      drawDot(ctx, xn, Y1, TL_COBALT, 8);
      drawDot(ctx, xa, Y2, C, 8);
      drawExpr(ctx, [perfect ? T(k, TL_JADE) : rtItem(a, TL_JADE)], xp, Y1 - 30, 17, TL_JADE);
      drawExpr(ctx, [perfect ? T(mn(-k), TL_COBALT) : negRt(a, TL_COBALT)], xn, Y1 - 30, 17, TL_COBALT);
      textCenter(ctx, String(a), xa, Y2 + 32, C, f(800, 15));
      textCenter(ctx, '正平方根', xp, Y1 + 34, TL_JADE, f(700, 12.5));
      textCenter(ctx, '負平方根', xn, Y1 + 34, TL_COBALT, f(700, 12.5));
      const pm = perfect ? T(`±${k}`, C) : SEQ([T('±', C), rtItem(a, C)], C, 2);
      drawEqPanel(ctx, [T(`${a} 的平方根是`, INK), pm], 392, C, { h: 28, size: 22 });
      drawNote(ctx, '一正一負，互為相反數，兩個平方後都等於 a', 446, MUTED, 14);
      out.innerHTML = `\\( (\\sqrt{${a}})^2 = ${a} \\)，<wbr>\\( (-\\sqrt{${a}})^2 = ${a} \\)`;
      fb.innerHTML = wrapFeedback(`\\(${a}\\) 的平方根有兩個：正平方根 \\(\\sqrt{${a}}\\)${perfect ? `\\( = ${k}\\)` : ''}、負平方根 \\(-\\sqrt{${a}}\\)${perfect ? `\\( = -${k}\\)` : ''}，合寫成 <b style="color:${C}">\\(\\pm${perfect ? k : `\\sqrt{${a}}`}\\)</b>。`);
    } else if (a === 0) {
      drawArrow(ctx, px1(0), Y1 + 10, px2v(0), Y2 - 12, C, 2.4);
      drawDot(ctx, px1(0), Y1, C, 8);
      drawDot(ctx, px2v(0), Y2, C, 8);
      drawEqPanel(ctx, [T('只有 0 平方後是 0：0 的平方根是 0', INK)], 392, C, { h: 28, size: 20 });
      out.innerHTML = `\\( 0^2 = 0 \\)`;
      fb.innerHTML = wrapFeedback(`只有 \\(0\\) 平方之後是 \\(0\\)，所以 <b style="color:${C}">\\(0\\) 的平方根是 \\(0\\)</b>，只有一個。`);
    } else {
      const xa = px2v(a);
      drawDot(ctx, xa, Y2, TL_ROSE, 8);
      textCenter(ctx, '✗', xa, Y2 + 32, TL_ROSE, f(800, 18));
      drawNote(ctx, '上面的數不管正負，平方後都在 0 或 0 的右邊', Y1 + 64, MUTED, 14);
      drawEqPanel(ctx, [T(`找不到任何數平方後是 ${mn(a)}`, TL_ROSE)], 392, C, { h: 28, size: 20 });
      drawNote(ctx, '負數沒有平方根', 446, TL_ROSE, 16);
      out.innerHTML = `\\( ${a} \\)，<wbr>沒有平方根`;
      fb.innerHTML = wrapFeedback(`正數的平方是正數、負數的平方也是正數、\\(0\\) 的平方是 \\(0\\)，沒有數平方後是 \\(${a}\\)。<b style="color:${TL_ROSE}">負數沒有平方根</b>。`);
    }
    typeset([out, fb]);
  }

  sa.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 10：由平方根求未知數——先翻譯成等式
   ========================================================================== */
// px + q 的 canvas 元件與 TeX（p > 0）
function linItems(p, q, color) {
  const items = [p === 1 ? IT('x', color) : SEQ([T(p, color), IT('x', color)], color, 1)];
  if (q > 0) items.push(T('+', color), T(q, color));
  if (q < 0) items.push(T('−', color), T(-q, color));
  return SEQ(items, color, 5);
}

function linTex(p, q) {
  let s = p === 1 ? 'x' : `${p}x`;
  if (q > 0) s += ` + ${q}`;
  if (q < 0) s += ` - ${-q}`;
  return s;
}

function initSolveCanvas() {
  const cv = elById('canvas-solve');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sb = elById('so-b'), sc = elById('so-c'), sp = elById('so-p'), sq = elById('so-q');
  const vb = elById('so-vb'), vc = elById('so-vc'), vp = elById('so-vp'), vq = elById('so-vq');
  const rowB = elById('so-row-b'), rowC = elById('so-row-c');
  const mG = elById('so-mode-group');
  const out = elById('so-formula');
  const fb = elById('so-feedback');
  const C = TL_TONE[9];
  let mode = 'sq';

  // b 不可為 0：拖過 0 時直接跳到另一邊（0 的平方根只有 0，題目不成立）
  let lastB = iv(sb);
  sb.addEventListener('input', () => {
    let v = iv(sb);
    if (v === 0) { v = lastB > 0 ? -1 : 1; sb.value = v; }
    lastB = v;
  });

  function draw() {
    const b = iv(sb), c = iv(sc), p = iv(sp), q = iv(sq);
    vb.textContent = b; vc.textContent = c; vp.textContent = p; vq.textContent = q;
    rowB.style.display = mode === 'sq' ? '' : 'none';
    rowC.style.display = mode === 'rt' ? '' : 'none';
    const L = linItems(p, q, C), Lt = linTex(p, q);

    ctx.clearRect(0, 0, cv.width, cv.height);
    let head, rows, rhs, wrongX, wrongDesc, tex, msg;
    if (mode === 'sq') {
      const B = b * b;
      const kind = b > 0 ? '正平方根' : '負平方根';
      rhs = B;
      drawTitle(ctx, '「b 是 E 的平方根」⇒ b² = E', C);
      head = [T(mn(b), TL_COBALT), T('是', INK), GRP([L], '()', C), T(`的${kind}，求 x`, INK)];
      rows = [
        { name: '① 翻譯', hint: 'b 平方之後就是 E', items: [PW(T(mn(b), TL_COBALT), 2, b < 0, TL_COBALT), T('=', INK), L] },
        { name: '② 算平方', hint: '負數平方變正數', items: [T(B, TL_COBALT), T('=', INK), L] },
        { name: '③ 移項', hint: '常數移到左邊', items: [T(mn(B - q), INK), T('=', INK), p === 1 ? IT('x', C) : SEQ([T(p, C), IT('x', C)], C, 1)] },
        { name: '④ 求 x', hint: '兩邊除以 x 的係數', items: [IT('x', C), T('=', INK), fracItem(B - q, p, C)] }
      ];
      wrongX = fTex(b - q, p);
      wrongDesc = `忘了平方，寫成 \\(${Lt} = ${b}\\)，會得到 \\(x = ${wrongX}\\)`;
      tex = wbrEq(`(${b})^2 = ${Lt}`) + '，<wbr>' + wbrEq(`x = ${fTex(B - q, p)}`);
      msg = `「\\(${b}\\) 是 \\(${Lt}\\) 的${kind}」表示 \\((${b})^2 = ${Lt}\\)，也就是 \\(${Lt} = ${B}\\)，解得 <b style="color:${C}">\\(x = ${fTex(B - q, p)}\\)</b>。`;
    } else {
      rhs = c;
      drawTitle(ctx, '「√E 是 c 的正平方根」⇒ E = c', C);
      head = [RT(L, C), T('是', INK), T(c, TL_COBALT), T('的正平方根，求 x', INK)];
      rows = [
        { name: '① 翻譯', hint: `${c} 的正平方根是 √${c}`, items: [RT(L, C), T('=', INK), rtItem(c, TL_COBALT)] },
        { name: '② 兩邊平方', hint: '根號裡的數相等', items: [L, T('=', INK), T(c, TL_COBALT)] },
        { name: '③ 移項', hint: '常數移到右邊', items: [p === 1 ? IT('x', C) : SEQ([T(p, C), IT('x', C)], C, 1), T('=', INK), T(mn(c - q), INK)] },
        { name: '④ 求 x', hint: '兩邊除以 x 的係數', items: [IT('x', C), T('=', INK), fracItem(c - q, p, C)] }
      ];
      wrongX = fTex(c * c - q, p);
      wrongDesc = `多平方一次，寫成 \\(${Lt} = ${c * c}\\)，會得到 \\(x = ${wrongX}\\)`;
      tex = wbrEq(`\\sqrt{${Lt}} = \\sqrt{${c}}`) + '，<wbr>' + wbrEq(`x = ${fTex(c - q, p)}`);
      msg = `「\\(\\sqrt{${Lt}}\\) 是 \\(${c}\\) 的正平方根」表示 \\(\\sqrt{${Lt}} = \\sqrt{${c}}\\)，所以 \\(${Lt} = ${c}\\)，解得 <b style="color:${C}">\\(x = ${fTex(c - q, p)}\\)</b>。`;
    }
    drawEqPanel(ctx, head, 80, C, { h: 30, size: 21 });
    drawStepRows(ctx, rows, 4, { top: 158, gap: 58, labX: 22, eqX: 160, size: 21, color: C });

    // 驗算
    const [xn, xd] = reduce(mode === 'sq' ? b * b - q : c - q, p);
    const val = p * xn / xd + q;   // 一定等於 rhs，畫出來讓學生看見
    exprLeft(ctx, [T('驗算：', OK_COLOR), T('代回', INK), L, T('得', INK), T(numStr(val), OK_COLOR),
      T(mode === 'sq' ? `，它的${b > 0 ? '正' : '負'}平方根是 ${mn(b)} ✓` : `，√${rhs} 是 ${rhs} 的正平方根 ✓`, INK)], 22, 404, 16, INK, 500);
    drawNote(ctx, '✗ ' + (mode === 'sq' ? `常見錯誤：忘了平方，寫成 E = ${mn(b)}` : `常見錯誤：多平方一次，寫成 E = ${c}² = ${c * c}`), 448, TL_ROSE, 14);

    out.innerHTML = tex;
    fb.innerHTML = wrapFeedback(msg + `<br><span style="color:${TL_ROSE}">✗ ${wrongDesc}。</span>`);
    typeset([out, fb]);
  }

  [sb, sc, sp, sq].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-so-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 11：√a 與「a 的平方根」不一樣
   ========================================================================== */
function initVsCanvas() {
  const cv = elById('canvas-vs');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sn = elById('vs-n'), sA = elById('vs-A'), sB = elById('vs-B');
  const vn = elById('vs-vn'), vA = elById('vs-vA'), vB = elById('vs-vB');
  const rowN = elById('vs-row-n'), rowA = elById('vs-row-A'), rowB = elById('vs-row-B');
  const mG = elById('vs-mode-group');
  const out = elById('vs-formula');
  const fb = elById('vs-feedback');
  const C = TL_TONE[10];
  let mode = 'sym';

  function nameItem(n, sign, color) {
    const k = isqrt(n);
    if (k * k === n) return T(mn(sign * k), color);
    return sign > 0 ? rtItem(n, color) : negRt(n, color);
  }

  function drawSym() {
    const n = iv(sn);
    vn.textContent = n;
    const k = isqrt(n), perfect = k * k === n;
    const r = Math.sqrt(n);
    drawTitle(ctx, `√${n} 和「${n} 的平方根」差在哪裡？`, C);

    const Y1 = 116, Y2 = 262;
    textLeft(ctx, `√${n}：只有一個`, 22, Y1 - 46, TL_JADE, f(800, 15));
    let px = srLine(ctx, { x0: 50, x1: 490, y: Y1, min: -6, max: 6, n: 12, label: i => String(i - 6) });
    drawDot(ctx, px(r), Y1, TL_JADE, 8);
    drawExpr(ctx, [nameItem(n, 1, TL_JADE)], px(r), Y1 - 26, 17, TL_JADE);

    textLeft(ctx, `${n} 的平方根：有兩個`, 22, Y2 - 46, TL_COBALT, f(800, 15));
    px = srLine(ctx, { x0: 50, x1: 490, y: Y2, min: -6, max: 6, n: 12, label: i => String(i - 6) });
    drawDot(ctx, px(r), Y2, TL_COBALT, 8);
    drawDot(ctx, px(-r), Y2, TL_COBALT, 8);
    drawExpr(ctx, [nameItem(n, 1, TL_COBALT)], px(r), Y2 - 26, 17, TL_COBALT);
    drawExpr(ctx, [nameItem(n, -1, TL_COBALT)], px(-r), Y2 - 26, 17, TL_COBALT);

    const pm = perfect ? T(`±${k}`, TL_COBALT) : SEQ([T('±', TL_COBALT), rtItem(n, TL_COBALT)], TL_COBALT, 2);
    drawEqPanel(ctx, [rtItem(n, TL_JADE), T('=', INK), perfect ? T(k, TL_JADE) : T('正的那一個', TL_JADE), T('；', INK), T(`${n} 的平方根`, INK), T('=', INK), pm], 352, C, { h: 28, size: 19 });
    drawNote(ctx, perfect ? `✗ 寫成 √${n} = ±${k} 是錯的：根號本身只代表正的那個` : `✗ √${n} 不是兩個數；「平方根」才有正、負兩個`, 410, TL_ROSE, 14);

    out.innerHTML = perfect
      ? `\\( \\sqrt{${n}} = ${k} \\)，<wbr>\\( ${n} \\)<wbr> 的平方根是 \\( \\pm ${k} \\)`
      : `\\( \\sqrt{${n}} \\gt 0 \\)，<wbr>\\( ${n} \\)<wbr> 的平方根是 \\( \\pm\\sqrt{${n}} \\)`;
    fb.innerHTML = wrapFeedback(`\\(\\sqrt{${n}}\\) 是<b style="color:${TL_JADE}">一個正數</b>（面積 \\(${n}\\) 的正方形邊長）；「\\(${n}\\) 的平方根」是平方後等於 \\(${n}\\) 的<b style="color:${TL_COBALT}">所有數</b>，有 \\(\\pm${perfect ? k : `\\sqrt{${n}}`}\\) 兩個。`);
  }

  function drawCmp() {
    const A = iv(sA), B = iv(sB);
    vA.textContent = A; vB.textContent = B;
    const rA = Math.sqrt(A), rB = Math.sqrt(B);
    drawTitle(ctx, `a 是 ${A} 的平方根、b 是 ${B} 的平方根，a 和 b 誰大？`, C);
    const LY = 106;
    const px = srLine(ctx, { x0: 50, x1: 490, y: LY, min: -6, max: 6, n: 12, label: i => String(i - 6) });
    [[rA, TL_TERRA], [-rA, TL_TERRA], [rB, TL_COBALT], [-rB, TL_COBALT]].forEach(([v, col]) => drawDot(ctx, px(v), LY, col, 7));
    const close = Math.abs(rA - rB) * 36.7 < 60;
    drawExpr(ctx, [IT('a', TL_TERRA), T('=', TL_TERRA), nameItem(A, 1, TL_TERRA)], px(rA), LY - 24, 14, TL_TERRA);
    drawExpr(ctx, [IT('a', TL_TERRA), T('=', TL_TERRA), nameItem(A, -1, TL_TERRA)], px(-rA), LY - 24, 14, TL_TERRA);
    drawExpr(ctx, [IT('b', TL_COBALT), T('=', TL_COBALT), nameItem(B, 1, TL_COBALT)], px(rB), LY + (close ? 46 : -24), 14, TL_COBALT);
    drawExpr(ctx, [IT('b', TL_COBALT), T('=', TL_COBALT), nameItem(B, -1, TL_COBALT)], px(-rB), LY + (close ? 46 : -24), 14, TL_COBALT);

    // 四種組合
    const combos = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    const TY = 190;
    textCenter(ctx, 'a', 150, TY, TL_TERRA, fi(800, 16));
    textCenter(ctx, 'b', 290, TY, TL_COBALT, fi(800, 16));
    textCenter(ctx, 'a 和 b', 430, TY, INK, f(800, 15));
    let gt = 0, lt = 0;
    combos.forEach(([sa, sb], i) => {
      const y = TY + 38 + i * 40;
      const va = sa * rA, vb = sb * rB;
      const rel = Math.abs(va - vb) < 1e-12 ? '=' : (va > vb ? '>' : '<');
      if (rel === '>') gt++;
      if (rel === '<') lt++;
      ctx.save();
      ctx.fillStyle = 'rgba(148, 163, 184, 0.06)';
      roundRect(ctx, 70, y - 17, 430, 34, 8);
      ctx.fill();
      ctx.restore();
      drawExpr(ctx, [nameItem(A, sa, TL_TERRA)], 150, y, 18, TL_TERRA);
      drawExpr(ctx, [nameItem(B, sb, TL_COBALT)], 290, y, 18, TL_COBALT);
      textCenter(ctx, `a ${rel} b`, 430, y, rel === '>' ? OK_COLOR : (rel === '<' ? TL_ROSE : INK), fi(800, 17));
    });

    const sure = gt === 4 || lt === 4;
    const rel2 = A > B ? '>' : (A < B ? '<' : '=');
    drawEqPanel(ctx, [PW(IT('a', TL_TERRA), 2, false, TL_TERRA), T('=', INK), T(A, TL_TERRA), T(rel2, C), T(B, TL_COBALT), T('=', INK), PW(IT('b', TL_COBALT), 2, false, TL_COBALT)], 404, C, { h: 26, size: 20 });
    drawNote(ctx, sure ? '這一組四種情形都一樣' : 'a、b 誰大不一定，要看取正的還是負的；a² 和 b² 的大小才一定', 448, sure ? INK : TL_ROSE, 13.5);

    const relT = rel2 === '>' ? '\\gt' : (rel2 === '<' ? '\\lt' : '=');
    out.innerHTML = wbrRel(`a^2 = ${A} ${relT} ${B} = b^2`);
    fb.innerHTML = wrapFeedback(`\\(a = \\pm\\sqrt{${A}}\\)、\\(b = \\pm\\sqrt{${B}}\\)，四種組合裡 \\(a \\gt b\\) 有 \\(${gt}\\) 種、\\(a \\lt b\\) 有 \\(${lt}\\) 種。一定成立的是 <b style="color:${C}">\\(a^2 ${relT} b^2\\)</b>。`);
  }

  function draw() {
    rowN.style.display = mode === 'sym' ? '' : 'none';
    rowA.style.display = mode === 'cmp' ? '' : 'none';
    rowB.style.display = mode === 'cmp' ? '' : 'none';
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (mode === 'sym') drawSym(); else drawCmp();
    typeset([out, fb]);
  }

  [sn, sA, sB].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-vs-mode', v => { mode = v; draw(); });
  draw();
}
