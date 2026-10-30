/* Game Tìm Thỏi Vàng Giả: tìm thỏi vàng giả bằng cân thăng bằng.
   Vòng 1: 9 thỏi, 1 thỏi giả nhẹ hơn, 2 lần cân.
   Vòng 2: 13 thỏi, 1 thỏi giả khác khối lượng (không biết nặng hay nhẹ), 3 lần cân.
   Vòng 3: như vòng 2 nhưng 12 thỏi.
   Máy không chọn trước thỏi giả. Mỗi thỏi mang một trạng thái: U (có thể nặng hoặc nhẹ),
   H (chỉ có thể nặng), L (chỉ có thể nhẹ), G (chắc chắn thật). Mỗi lần cân, máy xét cả 3 kết quả
   và ưu tiên kết quả khiến người chơi không thể chắc chắn với số lần cân còn lại; nếu cách cân
   đúng (kết quả nào cũng giải được) thì chọn ngẫu nhiên theo số khả năng còn lại.
   Chốt đáp án: chỉ đúng khi các lần cân đã loại hết, chỉ còn đúng thỏi đó; nếu không máy đưa ra
   một thỏi khác vẫn khớp với mọi lần cân.
   Mỗi vòng có một bộ kịch bản cố định (SCENARIOS), mỗi kịch bản là một lượt; thứ tự xáo lại mỗi khi
   bắt đầu vòng. Phải đúng hết các lượt liên tiếp mới qua vòng; sai một lượt thì làm lại từ lượt 1.
   Kịch bản quy định từng lần cân: T lệch (trái hay phải ngẫu nhiên vì hai bên đối xứng), B cân bằng,
   S lệch cùng phía với lần cân đầu, R lệch ngược phía lần cân đầu, * tuỳ ý.
   Kịch bản chỉ áp dụng khi người chơi cân đúng cách. */
(function () {
  'use strict';

  var root = document.querySelector('[data-gold-game]');
  if (!root) return;

  var $ = function (sel) { return root.querySelector(sel); };
  var els = {
    levels: root.querySelectorAll('[data-level]'),
    task: $('[data-task]'),
    turns: $('.gw-turns:not(.gw-plays)'),
    plays: $('.gw-plays'),
    scale: $('.gw-scale'),
    verdict: $('.gw-verdict'),
    left: $('[data-zone="left"] .gw-pile'),
    right: $('[data-zone="right"] .gw-pile'),
    tray: $('[data-zone="tray"]'),
    weigh: $('[data-weigh]'),
    clear: $('[data-clear]'),
    form: $('.gw-answer'),
    input: $('.gw-answer input'),
    submit: $('.gw-answer button'),
    rules: $('[data-rules]'),
    log: $('.pb-log'),
    result: $('.pb-result'),
    again: $('[data-again]'),
    nextLevel: $('[data-next-level]'),
    hiraku: $('[data-say="hiraku"]')
  };

  var LEVELS = {
    1: { n: 9, weighs: 2, light: true, desc: '9 thỏi · 2 lần cân' },
    2: { n: 13, weighs: 3, light: false, desc: '13 thỏi · 3 lần cân' },
    3: { n: 12, weighs: 3, light: false, desc: '12 thỏi · 3 lần cân' }
  };
  var LAST_LEVEL = 3;
  /* Vòng 1 chỉ có 2 kiểu suy luận (lệch: thỏi giả ở đĩa nổi lên; cân bằng: thỏi giả nằm ngoài cân),
     nên 2 lượt: một lượt cân bằng-cân bằng, một lượt lần 1 lệch còn lần 2 ngẫu nhiên lệch hoặc cân bằng
     (lệch-lệch và lệch-cân bằng cùng một kiểu suy luận ở lần 1, nên chỉ lấy một trong hai).
     Kịch bản viết dạng { any: [...] } là chọn ngẫu nhiên một trong các phương án mỗi khi bắt đầu vòng.
     Vòng 2, 3, mỗi kịch bản một kiểu suy luận riêng:
     T-B: lần 1 lệch, lần 2 cân bằng, thỏi giả nằm trong nhóm không lên cân ở lần 2.
     T-S: lần 2 lệch cùng phía, thỏi giả là thỏi giữ nguyên phía (nặng ở đĩa chìm hoặc nhẹ ở đĩa nổi).
     T-R: lần 2 lệch ngược phía, thỏi giả là thỏi đã đổi phía.
     B-T: lần 1 cân bằng, lần 2 cân với thỏi thật và lệch, biết được thỏi giả nặng hay nhẹ.
     B-B-B: thỏi giả là thỏi chưa từng lên cân, không cần biết nặng hay nhẹ. */
  var DEEP = [['T', 'B', '*'], ['T', 'S', '*'], ['T', 'R', '*'], ['B', 'T', '*'], ['B', 'B', 'B']];
  var SCENARIOS = {
    1: [{ any: [['T', 'T'], ['T', 'B']] }, ['B', 'B']],
    2: DEEP,
    3: DEEP
  };

  /* Tạm thời không xáo: lượt N luôn là kịch bản N để kiểm tra từng kịch bản. Bật lại thì đổi thành true. */
  var SHUFFLE = false;

  function shuffleScenarios(lv) {
    var list = SCENARIOS[lv].map(function (k) {
      return k.any ? k.any[Math.floor(Math.random() * k.any.length)] : k;
    });
    if (!SHUFFLE) return list;
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = list[i]; list[i] = list[j]; list[j] = t;
    }
    return list;
  }
  var STORE_KEY = 'hq-tim-thoi-vang-gia-unlocked';
  var LEVEL_KEY = 'hq-tim-thoi-vang-gia-level';

  function readLevel(key) {
    try { return Math.min(LAST_LEVEL, Math.max(1, parseInt(localStorage.getItem(key), 10) || 1)); } catch (e) { return 1; }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORE_KEY, String(unlocked));
      localStorage.setItem(LEVEL_KEY, String(state.level));
    } catch (e) {}
  }

  var unlocked = readLevel(STORE_KEY);
  var state = { level: Math.min(readLevel(LEVEL_KEY), unlocked), cand: [], used: 0, streak: 0, order: [], sides: [], weighed: false, busy: false, over: false, answer: '' };

  /* ---------- Thoại ---------- */

  var LINES = {
    level1: ['9 thỏi vàng, 1 thỏi giả nhẹ hơn. Cậu chỉ có 2 lần cân thôi.', 'Bắt đầu nhẹ nhàng nhé: 9 thỏi, 1 thỏi nhẹ hơn, 2 lần cân.'],
    level2: ['Vòng 2: 13 thỏi, thỏi giả có thể nặng hơn hoặc nhẹ hơn. 3 lần cân.', '13 thỏi và không ai biết thỏi giả nặng hay nhẹ. Cậu có 3 lần cân.'],
    level3: ['Vòng 3: 12 thỏi, thỏi giả nặng hơn hoặc nhẹ hơn. Vẫn 3 lần cân.', 'Vòng cuối: 12 thỏi. Nghe thì dễ hơn vòng trước, cậu thử xem.'],
    weighed: ['Hừm…', 'Ghi lại kết quả đi.', 'Thú vị đấy.', 'Cân không biết nói dối.', 'Cậu đọc ra được gì chưa?'],
    uneven: ['Hai bên không cùng số thỏi thì bên nhiều hơn chắc chắn nặng hơn. Lần cân này phí rồi.', 'Bên nhiều thỏi hơn thì nặng hơn, cái này không cần cân cũng biết.'],
    noTurn: ['Hết lần cân rồi. Thỏi giả là số mấy?', 'Không cân được nữa đâu. Chốt đáp án đi.'],
    /* Sau mỗi lượt đúng chưa qua vòng: lần lượt 3 câu đầu, lượt cuối cùng còn lại luôn là câu "Nốt lần này". */
    win: ['Chỉ là may mắn thôi, thử lại lần nữa.', 'Chưa tài đâu, chơi lại thêm lần nữa đi.', 'Lại đi, tôi chưa tin bạn có thể tìm ra quy luật.'],
    lastOne: 'Nốt lần này nữa thôi.',
    pass: ['Đúng hết các lượt. Cậu hiểu quy luật thật rồi.', 'Mỗi lượt một diễn biến khác nhau, cậu đều đúng. Phục đấy.'],
    lose: ['Sai rồi.', 'Sai rồi, thử lại đi.']
  };

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function level() { return LEVELS[state.level]; }

  function say(text) {
    var el = els.hiraku;
    el.querySelector('.pb-bubble').textContent = text;
    el.classList.remove('is-talking');
    void el.offsetWidth;
    el.classList.add('is-talking');
  }

  function log(text, who) {
    var li = document.createElement('li');
    li.className = who;
    li.textContent = text;
    els.log.prepend(li);
  }

  /* ---------- Bộ giải: trạng thái có còn tìm chắc chắn được thỏi giả không ---------- */

  var memo = {};

  /* u, h, l: số thỏi loại U, H, L; g: số thỏi chắc chắn thật (dùng để bù cho hai bên bằng nhau); k: lần cân còn lại.
     Giải được khi chỉ còn tối đa 1 thỏi nghi ngờ (không cần biết nặng hay nhẹ). */
  function solvable(u, h, l, g, k) {
    if (u + h + l <= 1) return true;
    if (k === 0 || u + h + l > Math.pow(3, k)) return false;
    var key = u + ',' + h + ',' + l + ',' + Math.min(g, 13) + ',' + k;
    if (key in memo) return memo[key];
    memo[key] = false;
    var all = u + h + l;
    for (var u1 = 0; u1 <= u; u1++) for (var u2 = 0; u2 <= u - u1; u2++)
    for (var h1 = 0; h1 <= h; h1++) for (var h2 = 0; h2 <= h - h1; h2++)
    for (var l1 = 0; l1 <= l; l1++) for (var l2 = 0; l2 <= l - l1; l2++) {
      var a = u1 + h1 + l1, b = u2 + h2 + l2;
      if (a + b === 0 || Math.abs(a - b) > g) continue;
      var bu = u - u1 - u2, bh = h - h1 - h2, bl = l - l1 - l2;
      if (2 * bu + bh + bl > 0 && !solvable(bu, bh, bl, g + all - bu - bh - bl, k - 1)) continue;
      var hl = u1 + h1, ll = u2 + l2;
      if (hl + ll > 0 && !solvable(0, hl, ll, g + all - hl - ll, k - 1)) continue;
      var hr = u2 + h2, lr = u1 + l1;
      if (hr + lr > 0 && !solvable(0, hr, lr, g + all - hr - lr, k - 1)) continue;
      return (memo[key] = true);
    }
    return memo[key];
  }

  function count(cand) {
    var c = { U: 0, H: 0, L: 0, G: 0 };
    for (var i = 1; i < cand.length; i++) c[cand[i]]++;
    return c;
  }

  function suspects(cand) {
    var out = [];
    for (var i = 1; i < cand.length; i++) if (cand[i] !== 'G') out.push(i);
    return out;
  }

  /* Số khả năng (thỏi, nặng/nhẹ) còn lại, dùng làm trọng số khi chọn ngẫu nhiên kết quả. */
  function weight(cand) {
    var c = count(cand);
    return 2 * c.U + c.H + c.L;
  }

  /* Trạng thái mới sau một kết quả cân. side: 0 cân bằng, -1 lệch trái (đĩa trái nặng), 1 lệch phải. */
  function apply(cand, onLeft, onRight, side) {
    var next = cand.slice();
    for (var i = 1; i < next.length; i++) {
      var t = next[i];
      if (t === 'G') continue;
      var where = onLeft[i] ? -1 : onRight[i] ? 1 : 0;
      if (side === 0) {
        if (where !== 0) next[i] = 'G';
      } else if (where === 0) {
        next[i] = 'G';
      } else {
        /* Thỏi ở đĩa chìm xuống chỉ có thể nặng, thỏi ở đĩa nổi lên chỉ có thể nhẹ. */
        var heavySide = where === side;
        if (heavySide) next[i] = t === 'L' ? 'G' : 'H';
        else next[i] = t === 'H' ? 'G' : 'L';
      }
    }
    return next;
  }

  function chooseOutcome(leftIds, rightIds) {
    if (leftIds.length !== rightIds.length) {
      return { side: leftIds.length > rightIds.length ? -1 : 1, cand: state.cand, uneven: true };
    }
    var onLeft = {}, onRight = {};
    leftIds.forEach(function (i) { onLeft[i] = true; });
    rightIds.forEach(function (i) { onRight[i] = true; });
    var left = level().weighs - state.used - 1;
    var options = [];
    [-1, 0, 1].forEach(function (side) {
      var next = apply(state.cand, onLeft, onRight, side);
      var w = weight(next);
      if (!w) return;
      var c = count(next);
      options.push({ side: side, cand: next, w: w, ok: solvable(c.U, c.H, c.L, c.G, left) });
    });
    /* Có kết quả khiến người chơi không thể chắc chắn thì luôn chọn nó.
       Nếu cách cân đúng thì đi theo kịch bản của lượt này (không theo được thì chọn ngẫu nhiên). */
    var bad = options.filter(function (o) { return !o.ok; });
    var pool = bad;
    if (!bad.length) {
      var want = (state.order[state.streak] || [])[state.used];
      var first = state.sides[0];
      pool = options.filter(function (o) {
        if (want === 'T') return o.side !== 0;
        if (want === 'B') return o.side === 0;
        if (want === 'S') return o.side !== 0 && o.side === first;
        if (want === 'R') return o.side !== 0 && o.side === -first;
        return true;
      });
      if (!pool.length) pool = options;
    }
    var total = pool.reduce(function (s, o) { return s + o.w; }, 0);
    var r = Math.random() * total;
    for (var j = 0; j < pool.length; j++) {
      r -= pool[j].w;
      if (r < 0) return pool[j];
    }
    return pool[pool.length - 1];
  }

  /* ---------- Thỏi vàng và cân ---------- */

  function bars() { return root.querySelectorAll('.gw-bar'); }

  function idsIn(pile) {
    return Array.prototype.map.call(pile.querySelectorAll('.gw-bar'), function (b) { return +b.dataset.n; });
  }

  /* Chèn thỏi vào khu vực theo đúng thứ tự số. */
  function place(bar, pile) {
    var n = +bar.dataset.n;
    var after = null;
    var list = pile.querySelectorAll('.gw-bar');
    for (var i = 0; i < list.length; i++) {
      if (list[i] !== bar && +list[i].dataset.n > n) { after = list[i]; break; }
    }
    pile.insertBefore(bar, after);
  }

  function buildBars() {
    els.left.innerHTML = '';
    els.right.innerHTML = '';
    els.tray.innerHTML = '';
    for (var i = 1; i <= level().n; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'gw-bar';
      b.dataset.n = i;
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', 'Thỏi số ' + i);
      b.innerHTML = '<span class="gw-ingot" aria-hidden="true"></span><b>' + i + '</b>';
      els.tray.appendChild(b);
    }
  }

  function setTilt(side) {
    els.scale.style.setProperty('--tilt', side * 9 + 'deg');
  }

  /* Đưa cân về trạng thái chờ: thỏi lơ lửng trên đĩa, cân thăng bằng. */
  function liftOff() {
    if (!state.weighed) return;
    state.weighed = false;
    els.scale.classList.remove('is-weighed');
    els.verdict.textContent = 'Đặt thỏi lên hai đĩa rồi bấm Cân';
    setTilt(0);
  }

  function renderTurns() {
    var k = level().weighs;
    var html = '<span>Lần cân</span>';
    for (var i = 0; i < k; i++) html += '<i class="' + (i < state.used ? 'is-used' : '') + '"></i>';
    html += '<b>' + (k - state.used) + '/' + k + '</b>';
    els.turns.innerHTML = html;
  }

  function sync() {
    var outOfTurns = state.used >= level().weighs;
    var onScale = idsIn(els.left).length + idsIn(els.right).length;
    els.weigh.disabled = state.busy || state.over || outOfTurns || !onScale || state.weighed;
    els.clear.disabled = state.busy || state.over || outOfTurns || !onScale;
    root.classList.toggle('is-frozen', state.busy || state.over || outOfTurns);
    var v = parseInt(state.answer, 10);
    els.submit.disabled = state.busy || state.over || !(v >= 1 && v <= level().n);
    els.input.disabled = state.over;
  }

  function move(list, zone) {
    if (state.busy || state.over || state.used >= level().weighs) return;
    var pile = zone === 'left' ? els.left : zone === 'right' ? els.right : els.tray;
    var moved = false;
    list.forEach(function (bar) {
      if (bar.parentNode !== pile) moved = true;
      place(bar, pile);
    });
    clearSelection();
    if (moved) liftOff();
    sync();
  }

  /* ---------- Chọn thỏi bằng chạm / bàn phím ---------- */

  function selected() { return Array.prototype.slice.call(root.querySelectorAll('.gw-bar.is-selected')); }

  function clearSelection() {
    selected().forEach(function (b) {
      b.classList.remove('is-selected');
      b.setAttribute('aria-pressed', 'false');
    });
    root.classList.remove('has-selection');
  }

  function toggle(bar) {
    var on = !bar.classList.contains('is-selected');
    bar.classList.toggle('is-selected', on);
    bar.setAttribute('aria-pressed', String(on));
    root.classList.toggle('has-selection', selected().length > 0);
  }

  var suppressClick = false;

  root.addEventListener('click', function (e) {
    if (suppressClick) { suppressClick = false; return; }
    if (state.busy || state.over || state.used >= level().weighs) return;
    var bar = e.target.closest('.gw-bar');
    if (bar) { toggle(bar); return; }
    var zone = e.target.closest('[data-zone]');
    if (zone && selected().length) move(selected(), zone.dataset.zone);
  });

  root.addEventListener('keydown', function (e) {
    var zone = e.target.closest('[data-zone]');
    if (!zone || e.target.closest('.gw-bar') || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    if (selected().length) move(selected(), zone.dataset.zone);
  });

  /* ---------- Kéo thả (chuột và cảm ứng) ---------- */

  var drag = null;

  function zoneAt(x, y) {
    var el = document.elementFromPoint(x, y);
    return el && el.closest('[data-gold-game] [data-zone]');
  }

  function hover(zone) {
    root.querySelectorAll('[data-zone].is-over').forEach(function (z) { if (z !== zone) z.classList.remove('is-over'); });
    if (zone) zone.classList.add('is-over');
  }

  root.addEventListener('pointerdown', function (e) {
    var bar = e.target.closest('.gw-bar');
    if (!bar || e.button > 0 || state.busy || state.over || state.used >= level().weighs) return;
    drag = { bar: bar, id: e.pointerId, x: e.clientX, y: e.clientY, ghost: null };
  });

  document.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.ghost) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 6) return;
      /* Kéo một thỏi đang được chọn thì kéo cả nhóm đang chọn. */
      drag.list = drag.bar.classList.contains('is-selected') ? selected() : [drag.bar];
      var ghost = document.createElement('div');
      ghost.className = 'gw-ghost';
      drag.list.forEach(function (b) { ghost.appendChild(b.cloneNode(true)); });
      document.body.appendChild(ghost);
      drag.ghost = ghost;
      drag.list.forEach(function (b) { b.classList.add('is-dragging'); });
    }
    e.preventDefault();
    drag.ghost.style.transform = 'translate(' + (e.clientX - 20) + 'px,' + (e.clientY - 14) + 'px)';
    hover(zoneAt(e.clientX, e.clientY));
  }, { passive: false });

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    drag = null;
    if (!d.ghost) return;
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 0);
    d.ghost.remove();
    d.list.forEach(function (b) { b.classList.remove('is-dragging'); });
    var zone = e.type === 'pointerup' ? zoneAt(e.clientX, e.clientY) : null;
    hover(null);
    if (zone) move(d.list, zone.dataset.zone);
  }

  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  /* ---------- Cân ---------- */

  var VERDICT = { '-1': 'Lệch trái', '0': 'Cân bằng', '1': 'Lệch phải' };

  els.weigh.addEventListener('click', function () {
    if (els.weigh.disabled) return;
    var leftIds = idsIn(els.left);
    var rightIds = idsIn(els.right);
    var out = chooseOutcome(leftIds, rightIds);
    state.cand = out.cand;
    state.sides.push(out.side);
    state.used++;
    state.busy = true;
    state.weighed = true;
    clearSelection();
    renderTurns();
    sync();
    els.verdict.textContent = '';
    els.scale.classList.add('is-weighed');
    log('Lần ' + state.used + ': ' + (leftIds.join(', ') || 'trống') + '  |  ' + (rightIds.join(', ') || 'trống') +
      ' → ' + VERDICT[out.side], 'you');
    setTimeout(function () { setTilt(out.side); }, 380);
    setTimeout(function () {
      state.busy = false;
      if (state.used >= level().weighs) {
        say(pick(LINES.noTurn));
        els.input.focus({ preventScroll: true });
      } else {
        say(out.uneven ? pick(LINES.uneven) : pick(LINES.weighed));
      }
      sync();
    }, 1500);
  });

  els.clear.addEventListener('click', function () {
    var list = Array.prototype.slice.call(els.left.querySelectorAll('.gw-bar')).concat(
      Array.prototype.slice.call(els.right.querySelectorAll('.gw-bar')));
    move(list, 'tray');
  });

  /* ---------- Ô đáp án: chỉ nhận số từ 1 đến n ---------- */

  els.input.addEventListener('input', function () {
    var raw = els.input.value.replace(/\D/g, '').replace(/^0+/, '');
    var v = parseInt(raw, 10);
    if (raw && v > level().n) raw = state.answer;
    els.input.value = raw;
    state.answer = raw;
    sync();
  });

  els.form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (els.submit.disabled) return;
    var x = parseInt(state.answer, 10);
    var left = suspects(state.cand);
    var won = left.length === 1 && left[0] === x;
    var title, text;
    var passed = false;
    if (won) {
      state.streak++;
      passed = state.streak >= plays();
      title = passed ? 'Qua vòng ' + state.level + '!' : 'Chính xác!';
      text = 'Thỏi số ' + x + ' là thỏi vàng giả.';
      var taunt = plays() - state.streak === 1 ? LINES.lastOne : LINES.win[(state.streak - 1) % LINES.win.length];
      if (!passed) text += ' Đúng ' + state.streak + '/' + plays() + ' lượt. ' + taunt;
      else if (state.level < LAST_LEVEL) text += ' Bạn đã đúng cả ' + plays() + ' lượt. Vòng ' + (state.level + 1) + ' đã mở.';
      else text += ' Bạn đã vượt qua cả 3 vòng.';
      if (passed && unlocked <= state.level && state.level < LAST_LEVEL) unlocked = state.level + 1;
      log('Chốt đáp án: số ' + x + ' → Đúng', 'bot');
    } else {
      state.streak = 0;
      var others = left.filter(function (i) { return i !== x; });
      var truth = others[Math.floor(Math.random() * others.length)];
      title = 'Sai rồi!';
      text = 'Thỏi giả là số ' + truth + '. Phải đúng cả ' + plays() + ' lượt liên tiếp, làm lại từ lượt 1 nhé.';
      log('Chốt đáp án: số ' + x + ' → Sai, thỏi giả là số ' + truth, 'sys');
    }
    state.over = true;
    sync();
    say(passed ? pick(LINES.pass) : won ? taunt : pick(LINES.lose));
    renderPlays();
    els.result.classList.toggle('is-win', won);
    els.result.querySelector('h2').textContent = title;
    els.result.querySelector('p').textContent = text;
    els.nextLevel.hidden = !(won && (!passed || state.level < LAST_LEVEL));
    els.nextLevel.textContent = passed ? 'Sang vòng ' + (state.level + 1) : 'Lượt tiếp theo';
    els.again.hidden = won && !passed;
    els.again.textContent = passed ? 'Chơi lại vòng này' : 'Chơi lại từ lượt 1';
    els.result.hidden = false;
    saveProgress();
    renderLevels();
  });

  /* ---------- Vòng chơi ---------- */

  function renderLevels() {
    for (var i = 0; i < els.levels.length; i++) {
      var btn = els.levels[i];
      var lv = +btn.dataset.level;
      var on = lv === state.level;
      btn.disabled = lv > unlocked;
      btn.classList.toggle('is-locked', lv > unlocked);
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
      btn.querySelector('small').textContent = lv > unlocked ? 'Chưa mở khoá' : LEVELS[lv].desc;
    }
  }

  function renderRules() {
    var lv = level();
    els.task.innerHTML = '<b>' + lv.n + '</b> thỏi vàng, 1 thỏi giả <b>' + (lv.light ? 'nhẹ hơn' : 'nặng hơn hoặc nhẹ hơn') + '</b>';
    els.rules.querySelector('[data-rule-coins]').innerHTML = 'Có <b>' + lv.n + '</b> thỏi vàng đánh số từ 1 đến ' + lv.n + '. Đúng 1 thỏi là giả, ' +
      (lv.light ? 'thỏi giả <b>nhẹ hơn</b> các thỏi thật.' : 'thỏi giả <b>khác khối lượng</b>: có thể nặng hơn hoặc nhẹ hơn, không biết trước.');
    els.rules.querySelector('[data-rule-turns]').innerHTML = 'Bạn có <b>' + lv.weighs + ' lần cân</b>. Mỗi lần bấm <b>Cân</b> là mất một lần cân.';
    els.rules.querySelector('[data-level-name]').textContent = 'Vòng ' + state.level;
    var k = SCENARIOS[state.level].length;
    els.rules.querySelector('[data-rule-plays]').innerHTML = 'Vòng này có <b>' + k + ' lượt</b>, mỗi lượt là một đống vàng mới với diễn biến cân khác nhau. ' +
      'Phải tìm đúng <b>cả ' + k + ' lượt liên tiếp</b> mới qua vòng, sai một lượt là làm lại từ lượt 1.';
    els.input.placeholder = '1 – ' + lv.n;
    els.input.setAttribute('aria-label', 'Số thứ tự thỏi vàng giả, từ 1 đến ' + lv.n);
  }

  function plays() { return state.order.length; }

  function renderPlays() {
    var html = '<span>Lượt</span>';
    for (var i = 0; i < plays(); i++) html += '<i class="' + (i < state.streak ? 'is-done' : i === state.streak ? 'is-now' : '') + '"></i>';
    html += '<b>' + Math.min(state.streak + 1, plays()) + '/' + plays() + '</b>';
    els.plays.innerHTML = html;
  }

  /* Bắt đầu một lượt mới trong vòng hiện tại; fresh = true thì làm lại vòng từ lượt 1. */
  function start(lv, fresh) {
    if (lv > unlocked || !LEVELS[lv]) return;
    if (fresh || lv !== state.level) {
      state.streak = 0;
      state.order = shuffleScenarios(lv);
    }
    state.level = lv;
    state.used = 0;
    state.sides = [];
    state.over = false;
    state.busy = false;
    state.weighed = true;
    state.answer = '';
    var c = [null];
    for (var i = 1; i <= level().n; i++) c.push(level().light ? 'L' : 'U');
    state.cand = c;
    els.input.value = '';
    els.result.hidden = true;
    if (!state.streak) els.log.innerHTML = '';
    log('Lượt ' + (state.streak + 1) + '/' + plays(), 'sys');
    buildBars();
    liftOff();
    renderLevels();
    renderRules();
    renderTurns();
    renderPlays();
    sync();
    saveProgress();
    say(state.streak ? 'Lượt ' + (state.streak + 1) + '. Lần này diễn biến sẽ khác đấy.' : pick(LINES['level' + lv]));
  }

  for (var i = 0; i < els.levels.length; i++) {
    els.levels[i].addEventListener('click', function () {
      var lv = +this.dataset.level;
      if (lv !== state.level || state.over || state.used || state.streak) start(lv, true);
    });
  }

  els.again.addEventListener('click', function () { start(state.level, true); });
  els.nextLevel.addEventListener('click', function () {
    if (state.streak >= plays()) start(state.level + 1, true);
    else start(state.level);
  });

  start(state.level, true);
})();
