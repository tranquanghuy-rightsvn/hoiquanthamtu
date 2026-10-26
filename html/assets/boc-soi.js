/* Game Bốc Sỏi: người chơi đấu với Hiraku.
   Vòng 1: mỗi lượt bốc 1–4 viên, ai bốc viên cuối cùng thắng.
   Vòng 2: mỗi lượt bốc 1–4 viên, ai bốc viên cuối cùng thua.
   Vòng 3: mỗi lượt bốc 1–4 viên, hết sỏi ai giữ tổng số sỏi chẵn thì thắng.
   Vòng 4: 13 viên thẳng hàng, bốc 1 viên hoặc 2 viên kề nhau, ai bốc viên cuối cùng thắng.
   Vòng 5: như vòng 4 nhưng ai bốc viên cuối cùng thua.
   Vòng 6: như vòng 4 nhưng hết sỏi, ai giữ tổng số sỏi chẵn thì thắng.
   Vòng 7: 7 hàng (1, 2, … 7 viên), mỗi lượt bốc 1–7 viên trên cùng một hàng, ai bốc viên cuối cùng thắng.
   Thắng một vòng thì mở khoá vòng tiếp theo; thua thì chơi lại vòng hiện tại. */
(function () {
  'use strict';

  var root = document.querySelector('[data-pebble-game]');
  if (!root) return;

  var $ = function (sel) { return root.querySelector(sel); };
  var els = {
    setup: $('.pb-setup'),
    board: $('.pb-board'),
    field: $('.pb-field'),
    take: $('.pb-take'),
    picked: $('.pb-picked'),
    left: $('.pb-left'),
    turn: $('.pb-turn'),
    youCount: $('.pb-you b'),
    botCount: $('.pb-bot b'),
    log: $('.pb-log'),
    result: $('.pb-result'),
    again: $('[data-again]'),
    nextLevel: $('[data-next-level]'),
    hiraku: $('[data-say="hiraku"]')
  };

  /* mode 'last': ai bốc viên cuối cùng thì thắng (lastWins) hoặc thua.
     target: số dư (theo 1 + 4 = 5) mà Hiraku luôn muốn để lại cho đối thủ.
     Vòng 1 để lại bội số của 5; vòng 2 để lại 6, 11, 16… (chia 5 dư 1) để đối thủ phải bốc viên cuối.
     mode 'even' (vòng 3): tổng sỏi luôn lẻ nên hết sỏi chỉ đúng một người giữ số chẵn.
     mode 'row' (vòng 4–6): sỏi thẳng hàng, bốc 1 viên hoặc 2 viên kề nhau.
     evenWins: hết sỏi, ai giữ tổng số sỏi chẵn thì thắng (vòng 3, 6).
     mode 'nim' (vòng 7): nhiều hàng, mỗi lượt bốc bao nhiêu cũng được nhưng trên cùng một hàng. */
  var LEVELS = {
    1: { name: 'Vòng 1', desc: 'Bốc viên cuối là thắng', mode: 'last', lastWins: true, target: 0, maxTake: 4 },
    2: { name: 'Vòng 2', desc: 'Bốc viên cuối là thua', mode: 'last', lastWins: false, target: 1, maxTake: 4 },
    3: { name: 'Vòng 3', desc: 'Giữ tổng sỏi chẵn là thắng', mode: 'even', evenWins: true, counts: [29, 31, 33, 35], maxTake: 4 },
    4: { name: 'Vòng 4', desc: 'Thẳng hàng, bốc cuối là thắng', mode: 'row', lastWins: true, counts: [13], maxTake: 2 },
    5: { name: 'Vòng 5', desc: 'Thẳng hàng, bốc cuối là thua', mode: 'row', lastWins: false, counts: [13], maxTake: 2 },
    6: { name: 'Vòng 6', desc: 'Thẳng hàng, giữ số chẵn là thắng', mode: 'row', evenWins: true, counts: [13], maxTake: 2 },
    7: { name: 'Vòng 7', desc: '7 hàng, bốc trên cùng một hàng', mode: 'nim', lastWins: true, rows: [1, 2, 3, 4, 5, 6, 7], counts: [28], maxTake: 7 }
  };
  var LAST_LEVEL = 7;
  /* Tiến độ lưu trong trình duyệt của người chơi: vòng cao nhất đã mở khoá và vòng đang chơi,
     để lần sau vào lại đúng vòng đó. Trình duyệt chặn localStorage thì vẫn chơi được, chỉ không nhớ tiến độ. */
  var STORE_KEY = 'hq-boc-soi-unlocked';
  var LEVEL_KEY = 'hq-boc-soi-level';

  function readLevel(key) {
    try { return Math.min(LAST_LEVEL, Math.max(1, parseInt(localStorage.getItem(key), 10) || 1)); } catch (e) { return 1; }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORE_KEY, String(unlocked));
      localStorage.setItem(LEVEL_KEY, String(state.level));
    } catch (e) {}
  }

  var state = { level: 1, left: 0, you: 0, bot: 0, playerTurn: true, busy: false, over: true, lastMove: null };
  var unlocked = readLevel(STORE_KEY);
  state.level = Math.min(readLevel(LEVEL_KEY), unlocked);

  /* ---------- Thoại ---------- */

  var LINES = {
    hello: ['Lại là cậu à? Bốc sỏi thì tôi chưa thua ai bao giờ.', 'Ngồi xuống đi. Ván này tôi chấp cậu chọn lượt.', 'Bốc sỏi là trò của logic, không phải may mắn đâu.'],
    level2: ['Vòng 2 nhé: lần này ai phải bốc viên cuối cùng là thua.', 'Đổi luật rồi. Viên cuối cùng giờ là viên xui xẻo.'],
    level3: ['Vòng 3: hết sỏi, ai đang giữ tổng số sỏi chẵn là thắng.', 'Xem cậu trụ được bao lâu ở vòng này.'],
    level4: ['Vòng 4: sỏi xếp thẳng một hàng. Mỗi lượt bốc 1 viên, hoặc 2 viên nằm kề nhau.', 'Lần này sỏi xếp thành hàng, và vị trí mới là thứ quan trọng.'],
    level5: ['Vòng 5: vẫn là một hàng sỏi, nhưng ai phải bốc viên cuối cùng là thua.', 'Đừng để mình là người cầm viên sỏi cuối cùng.'],
    level6: ['Vòng 6: vẫn là một hàng sỏi. Hết sỏi, ai đang giữ tổng số sỏi chẵn là thắng.', 'Lần này không cần tranh viên cuối, chỉ cần tay cậu giữ số chẵn.'],
    level7: ['Vòng cuối: 7 hàng sỏi. Mỗi lượt bốc bao nhiêu cũng được, miễn là trên cùng một hàng.', 'Vòng cuối rồi. Ai bốc viên cuối cùng là người thắng.'],
    otherRow: ['Mỗi lượt chỉ được bốc trên cùng một hàng thôi.', 'Hai viên đó không cùng hàng đâu.'],
    youFirst: ['Cậu đi trước. Cứ tự nhiên, tôi đang quan sát.', 'Mời cậu. Tôi muốn xem cậu nghĩ gì.'],
    botFirst: ['Vậy tôi đi trước nhé. Đừng hối hận đấy.', 'Cậu nhường tôi à? Hào phóng quá.'],
    think: ['Để xem nào…', 'Hừm…', 'Một nước đi thú vị.', 'Tôi tính xong rồi.', 'Đơn giản thôi.'],
    winning: ['Mọi thứ đang đi đúng kế hoạch của tôi.', 'Cậu bắt đầu thấy áp lực chưa?', 'Cậu đang đi vào ngõ cụt đấy.', 'Mỗi nước của cậu, tôi đều đã đoán trước.'],
    losing: ['Khoan… cậu tính trước rồi à?', 'Ồ, nước này khá đấy.', 'Cậu học ai vậy?', 'Tôi cần nghĩ kỹ hơn một chút.'],
    lastOne: ['Còn đúng một viên. Mời cậu.', 'Một viên cuối cùng… dành riêng cho cậu đấy.'],
    notAdjacent: ['Hai viên phải nằm kề nhau mới được bốc cùng lúc.', 'Không được đâu, hai viên đó không nằm sát nhau.'],
    botWin: ['Sự thật chỉ có một: tôi thắng!', 'Kết thúc. Cậu cần luyện thêm đấy.', 'Như tôi đã nói, đây là logic.'],
    youWin: ['Không thể nào… cậu thắng tôi thật rồi.', 'Được lắm. Lần này tôi thừa nhận thua.', 'Cậu có tố chất thám tử đấy.']
  };

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function level() { return LEVELS[state.level]; }
  function maxTake() { return level().maxTake; }
  function isRow() { return level().mode === 'row'; }
  function isNim() { return level().mode === 'nim'; }

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

  /* ---------- Bàn sỏi ---------- */

  /* Vòng 4 xếp sỏi thành một hàng, mỗi viên nằm trong một ô có số thứ tự;
     viên đã bốc để lại ô trống để thấy rõ hàng bị chia thành mấy nhóm. */
  function buildField(n) {
    els.field.innerHTML = '';
    els.field.classList.toggle('is-row', isRow());
    els.field.classList.toggle('is-nim', isNim());
    els.field.style.setProperty('--cols', n);
    /* Vòng 7: dựng các hàng (hình tam giác), viên sỏi mang số hàng ở data-row. */
    var rowEls = [];
    var rowOf = [];
    if (isNim()) {
      level().rows.forEach(function (size, r) {
        var line = document.createElement('div');
        line.className = 'pb-nim-row';
        line.innerHTML = '<span class="pb-nim-label">Hàng ' + (r + 1) + '</span>';
        els.field.appendChild(line);
        for (var j = 0; j < size; j++) { rowEls.push(line); rowOf.push(r); }
      });
    }
    for (var i = 0; i < n; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pebble';
      b.setAttribute('data-i', i);
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', 'Viên sỏi ' + (i + 1));
      b.style.setProperty('--r', Math.round(Math.random() * 360) + 'deg');
      b.style.setProperty('--s', (0.86 + Math.random() * 0.24).toFixed(2));
      b.style.setProperty('--tone', ['0deg', '18deg', '-14deg', '30deg'][i % 4]);
      b.style.setProperty('--d', (i * 18) + 'ms');
      b.innerHTML = '<img src="/assets/soi.png" alt="" width="128" height="128" draggable="false">';
      if (isNim()) {
        b.setAttribute('data-row', rowOf[i]);
        b.setAttribute('aria-label', 'Viên sỏi hàng ' + (rowOf[i] + 1));
        rowEls[i].appendChild(b);
      } else if (isRow()) {
        var slot = document.createElement('div');
        slot.className = 'pb-slot';
        slot.appendChild(b);
        slot.insertAdjacentHTML('beforeend', '<span class="pb-slot-no">' + (i + 1) + '</span>');
        els.field.appendChild(slot);
      } else {
        els.field.appendChild(b);
      }
    }
  }

  function stones() { return els.field.querySelectorAll('.pebble:not(.is-gone)'); }
  function selected() { return els.field.querySelectorAll('.pebble.is-picked'); }
  function indexOf(b) { return parseInt(b.getAttribute('data-i'), 10); }
  function rowIndex(b) { return parseInt(b.getAttribute('data-row'), 10); }

  function paint() {
    var n = selected().length;
    els.left.textContent = state.left;
    els.youCount.textContent = state.you;
    els.botCount.textContent = state.bot;
    if (n) els.picked.textContent = 'Đã chọn ' + n + ' / ' + maxTake() + ' viên';
    else if (isNim()) els.picked.textContent = 'Bấm chọn các viên sỏi trên cùng một hàng';
    else els.picked.textContent = isRow() ? 'Bấm chọn 1 viên, hoặc 2 viên nằm kề nhau' : 'Bấm vào 1–' + maxTake() + ' viên sỏi để chọn';
    /* Vòng 7: đã chọn ở một hàng thì làm mờ các hàng khác. */
    var activeRow = isNim() && n ? rowIndex(selected()[0]) : -1;
    var all = els.field.querySelectorAll('.pebble');
    for (var i = 0; i < all.length; i++) all[i].classList.toggle('is-other-row', activeRow >= 0 && rowIndex(all[i]) !== activeRow);
    els.take.disabled = !state.playerTurn || state.busy || state.over || n < 1;
    els.field.classList.toggle('is-locked', !state.playerTurn || state.busy || state.over);
    els.field.classList.toggle('is-full', !isNim() && n >= Math.min(maxTake(), state.left));
    els.turn.textContent = state.over ? 'Ván đã kết thúc' : state.playerTurn ? 'Lượt của bạn' : 'Lượt của Hiraku';
    els.turn.className = 'pb-turn ' + (state.over ? '' : state.playerTurn ? 'is-you' : 'is-bot');
  }

  /* Nút chọn vòng, nhãn luật và số sỏi luôn khớp với vòng đang chọn. */
  function paintLevel() {
    var btns = root.querySelectorAll('[data-level]');
    for (var i = 0; i < btns.length; i++) {
      var lv = parseInt(btns[i].getAttribute('data-level'), 10);
      var active = lv === state.level;
      btns[i].classList.toggle('is-active', active);
      btns[i].setAttribute('aria-pressed', String(active));
      btns[i].disabled = lv > unlocked;
      btns[i].classList.toggle('is-locked', lv > unlocked);
      /* Vòng chưa mở khoá thì không giới thiệu trước luật. */
      var desc = btns[i].querySelector('[data-level-desc]');
      if (desc) desc.textContent = lv > unlocked ? 'Chưa mở khoá' : LEVELS[lv].desc;
    }
    var rule = root.querySelectorAll('[data-win-rule]');
    for (i = 0; i < rule.length; i++) {
      rule[i].innerHTML = level().evenWins
        ? 'Hết sỏi, ai đang giữ tổng số sỏi <b>chẵn</b> thì thắng.'
        : 'Ai bốc viên sỏi cuối cùng thì <b>' + (level().lastWins ? 'thắng' : 'thua') + '</b>.';
    }
    var takeRule = root.querySelectorAll('[data-take-rule]');
    for (i = 0; i < takeRule.length; i++) {
      if (isNim()) takeRule[i].textContent = 'Bạn và Hiraku thay phiên nhau bốc. Mỗi lượt bốc từ 1 đến 7 viên, nhưng tất cả phải nằm trên cùng một hàng.';
      else takeRule[i].textContent = isRow()
        ? 'Bạn và Hiraku thay phiên nhau bốc. Mỗi lượt bốc 1 viên, hoặc 2 viên nằm kề nhau.'
        : 'Bạn và Hiraku thay phiên nhau bốc. Mỗi lượt phải bốc ít nhất 1 viên và nhiều nhất 4 viên.';
    }
    var rowNote = root.querySelectorAll('[data-row-note]');
    for (i = 0; i < rowNote.length; i++) {
      rowNote[i].hidden = !isRow() && !isNim();
      rowNote[i].textContent = isNim() ? ' xếp thành 7 hàng: hàng 1 có 1 viên, hàng 2 có 2 viên… hàng 7 có 7 viên' : ' xếp thành một hàng';
    }
    var names = root.querySelectorAll('[data-level-name]');
    for (i = 0; i < names.length; i++) names[i].textContent = level().name;
    renderPreview();
  }

  /* Hình minh hoạ cách xếp sỏi ở màn hình bắt đầu: vòng 7 là 7 hàng hình tam giác,
     vòng 4–6 là một hàng 13 viên, vòng 1–3 là một đống sỏi (một viên lớn). */
  function renderPreview() {
    var box = $('.pb-preview');
    if (!box) return;
    var stone = '<img src="/assets/soi.png" alt="" width="128" height="128">';
    var repeat = function (n) { return new Array(n + 1).join(stone); };
    box.className = 'pb-preview' + (isNim() ? ' is-nim' : isRow() ? ' is-row' : '');
    if (isNim()) {
      box.innerHTML = level().rows.map(function (size, r) {
        return '<div class="pb-preview-row"><span>Hàng ' + (r + 1) + '</span>' + repeat(size) + '</div>';
      }).join('');
    } else if (isRow()) {
      box.innerHTML = '<div class="pb-preview-row">' + repeat(level().counts[0]) + '</div>';
    } else {
      box.innerHTML = '<img class="pb-setup-art" src="/assets/soi.png" alt="" width="128" height="128">';
    }
  }

  els.field.addEventListener('click', function (e) {
    var b = e.target.closest('.pebble');
    if (!b || b.classList.contains('is-gone') || !state.playerTurn || state.busy || state.over) return;
    var on = b.classList.contains('is-picked');
    var current = selected();
    if (!on && current.length >= Math.min(maxTake(), state.left)) {
      say('Mỗi lượt chỉ được bốc tối đa ' + maxTake() + ' viên thôi.');
      return;
    }
    if (!on && isNim() && current.length && rowIndex(current[0]) !== rowIndex(b)) {
      say(pick(LINES.otherRow));
      return;
    }
    if (!on && isRow() && current.length === 1 && Math.abs(indexOf(current[0]) - indexOf(b)) !== 1) {
      say(pick(LINES.notAdjacent));
      return;
    }
    b.classList.toggle('is-picked', !on);
    b.setAttribute('aria-pressed', String(!on));
    paint();
  });

  /* Sỏi đã chọn bay về khay của người bốc rồi biến mất. */
  function removePicked(who) {
    var list = selected();
    var tray = root.querySelector(who === 'you' ? '.pb-you' : '.pb-bot').getBoundingClientRect();
    var taken = [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i].getBoundingClientRect();
      list[i].style.setProperty('--fx', Math.round(tray.left + tray.width / 2 - r.left - r.width / 2) + 'px');
      list[i].style.setProperty('--fy', Math.round(tray.top + tray.height / 2 - r.top - r.height / 2) + 'px');
      list[i].classList.remove('is-picked');
      list[i].classList.add('is-gone');
      list[i].disabled = true;
      if (list[i].parentNode.classList.contains('pb-slot')) list[i].parentNode.classList.add('is-empty');
      taken.push(indexOf(list[i]));
    }
    return taken;
  }

  function take(who) {
    var taken = removePicked(who);
    var n = taken.length;
    state.left -= n;
    state[who] += n;
    if (who === 'you') state.lastMove = taken;
    var where = isRow() ? ' (số ' + taken.map(function (i) { return i + 1; }).join(', ') + ')' : '';
    if (isNim()) where = ' ở hàng ' + (rowIndex(els.field.querySelector('.pebble[data-i="' + taken[0] + '"]')) + 1);
    log((who === 'you' ? 'Bạn' : 'Hiraku') + ' bốc ' + n + ' viên' + where + ' — còn ' + state.left, who);
    return n;
  }

  /* Hết sỏi. Vòng 1, 4: người bốc viên cuối thắng; vòng 2, 5: người kia thắng; vòng 3, 6: ai giữ số chẵn thắng. */
  function endBy(who) {
    if (level().evenWins) return finish(state.you % 2 === 0 ? 'you' : 'bot');
    finish(level().lastWins ? who : (who === 'you' ? 'bot' : 'you'));
  }

  /* ---------- Vòng 4: hàng sỏi (trò Kayles) ----------
     Mỗi nhóm sỏi liền nhau có một "giá trị Grundy"; bàn có XOR các giá trị bằng 0 là bàn cân bằng,
     người sắp bốc ở bàn cân bằng sẽ thua nếu đối thủ chơi đúng. */

  var grundyMemo = [0];
  function grundy(n) {
    if (grundyMemo[n] !== undefined) return grundyMemo[n];
    var seen = {};
    for (var t = 1; t <= 2; t++) {
      for (var i = 0; i + t <= n; i++) seen[grundy(i) ^ grundy(n - t - i)] = true;
    }
    var m = 0;
    while (seen[m]) m++;
    grundyMemo[n] = m;
    return m;
  }

  /* present[i] = viên thứ i còn trên bàn. */
  function rowPresent() {
    var list = els.field.querySelectorAll('.pebble');
    var present = [];
    for (var i = 0; i < list.length; i++) present.push(!list[i].classList.contains('is-gone'));
    return present;
  }

  function rowXor(present) {
    var x = 0;
    var run = 0;
    for (var i = 0; i <= present.length; i++) {
      if (i < present.length && present[i]) { run++; continue; }
      x ^= grundy(run);
      run = 0;
    }
    return x;
  }

  /* Nhóm sỏi liền nhau, sắp xếp tăng dần, ví dụ [2, 6, 6]. */
  function rowGroups(present) {
    var groups = [];
    var run = 0;
    for (var i = 0; i <= present.length; i++) {
      if (i < present.length && present[i]) { run++; continue; }
      if (run) groups.push(run);
      run = 0;
    }
    return groups.sort(function (a, b) { return a - b; });
  }

  /* Vòng 5 (ai bốc viên cuối thua): luật ngược không dùng được phép XOR,
     nên duyệt hết các nước đi và nhớ kết quả. true = người sắp bốc thắng được. */
  var misereMemo = {};
  function misereWins(groups) {
    if (!groups.length) return true;
    var key = groups.join(',');
    if (key in misereMemo) return misereMemo[key];
    var result = false;
    for (var g = 0; g < groups.length && !result; g++) {
      if (g > 0 && groups[g] === groups[g - 1]) continue;
      var rest = groups.slice(0, g).concat(groups.slice(g + 1));
      for (var t = 1; t <= 2 && !result; t++) {
        for (var i = 0; i + t <= groups[g] && !result; i++) {
          var next = rest.concat([i, groups[g] - t - i]).filter(Boolean).sort(function (a, b) { return a - b; });
          if (!misereWins(next)) result = true;
        }
      }
    }
    misereMemo[key] = result;
    return result;
  }

  /* Vòng 6: thắng thua phụ thuộc cả cách chia nhóm lẫn chẵn/lẻ trên tay hai người,
     nên duyệt hết các nước đi. a, b: chẵn (0) / lẻ (1) của người sắp bốc và đối thủ.
     true = người sắp bốc thắng được. */
  var evenMemo = {};
  function evenRowWins(groups, a, b) {
    if (!groups.length) return a === 0;
    var key = groups.join(',') + '|' + a + b;
    if (key in evenMemo) return evenMemo[key];
    var result = false;
    for (var g = 0; g < groups.length && !result; g++) {
      if (g > 0 && groups[g] === groups[g - 1]) continue;
      var rest = groups.slice(0, g).concat(groups.slice(g + 1));
      for (var t = 1; t <= 2 && !result; t++) {
        for (var i = 0; i + t <= groups[g] && !result; i++) {
          var next = rest.concat([i, groups[g] - t - i]).filter(Boolean).sort(function (x, y) { return x - y; });
          if (!evenRowWins(next, b, (a + t) % 2)) result = true;
        }
      }
    }
    evenMemo[key] = result;
    return result;
  }

  /* Người sắp bốc ở hàng sỏi này (đang giữ moverHand viên, đối thủ giữ oppHand viên) có đang ở thế thua không. */
  function rowLoses(present, moverHand, oppHand) {
    if (level().evenWins) return !evenRowWins(rowGroups(present), moverHand % 2, oppHand % 2);
    return level().lastWins ? rowXor(present) === 0 : !misereWins(rowGroups(present));
  }

  function rowMoves(present) {
    var moves = [];
    for (var i = 0; i < present.length; i++) {
      if (!present[i]) continue;
      moves.push([i]);
      if (i + 1 < present.length && present[i + 1]) moves.push([i, i + 1]);
    }
    return moves;
  }

  function without(present, move) {
    var next = present.slice();
    for (var i = 0; i < move.length; i++) next[move[i]] = false;
    return next;
  }

  /* Hiraku đi trước với hàng còn nguyên: chọn ngẫu nhiên một trong các nước mở đầu thắng
     (vòng 4: viên 3, 5, 7, 9, 11; vòng 5: thêm viên 1 và 13) để người chơi khó đoán.
     Sau đó ưu tiên bốc đối xứng với nước vừa rồi của người chơi; nếu bắt chước không dẫn tới thế thắng
     (vòng 5 có những bàn đối xứng như 1|1, 4|4, 5|5 mà bắt chước lại thua) thì tìm nước khác
     đưa người chơi vào thế thua. Vòng 6: người đi trước luôn ở thế thua nên Hiraku đi trước sẽ gài bẫy.
     Không có nước thắng thì gài bẫy (xem trap). */
  function botRowMove() {
    var present = rowPresent();
    var n = present.length;
    if (state.lastMove) {
      var mirror = state.lastMove.map(function (i) { return n - 1 - i; }).sort(function (a, b) { return a - b; });
      var ok = mirror.every(function (i) { return present[i]; }) && (mirror.length === 1 || mirror[1] - mirror[0] === 1);
      if (ok && rowLoses(without(present, mirror), state.you, state.bot + mirror.length)) return mirror;
    }
    var moves = rowMoves(present);
    var good = moves.filter(function (m) { return rowLoses(without(present, m), state.you, state.bot + m.length); });
    if (good.length) return pick(good);
    return trap(moves, function (m) { return rowShare(without(present, m), state.you, state.bot + m.length); });
  }

  /* ---------- Vòng 7: nhiều hàng (trò Nim) ----------
     Đổi số sỏi mỗi hàng sang nhị phân rồi cộng theo kiểu 1 + 1 = 0 (XOR).
     Tổng bằng 0 là bàn cân bằng: người sắp bốc ở bàn cân bằng sẽ thua nếu đối thủ chơi đúng.
     Bàn ban đầu 1, 2, … 7 có tổng bằng 0 nên người đi trước luôn ở thế thua. */

  function nimHeaps() {
    return level().rows.map(function (size, r) {
      return els.field.querySelectorAll('.pebble[data-row="' + r + '"]:not(.is-gone)').length;
    });
  }

  function nimXor(heaps) {
    return heaps.reduce(function (x, h) { return x ^ h; }, 0);
  }

  /* Tỉ lệ cách đáp đúng của người chơi khi đến lượt họ với các hàng heaps (dùng cho gài bẫy). */
  function nimShare(heaps) {
    var total = 0;
    var good = 0;
    var x = nimXor(heaps);
    if (!x && heaps.every(function (h) { return !h; })) return -1;
    heaps.forEach(function (h) {
      for (var k = 1; k <= h; k++) {
        total++;
        if ((x ^ h ^ (h - k)) === 0) good++;
      }
    });
    return good / total;
  }

  /* Có nước cân bằng lại thì bốc đúng nước đó (chọn ngẫu nhiên nếu có nhiều hàng làm được);
     không có thì gài bẫy. */
  function botNimMove() {
    var heaps = nimHeaps();
    var x = nimXor(heaps);
    var options = [];
    heaps.forEach(function (h, r) {
      for (var k = 1; k <= h; k++) options.push({ row: r, take: k });
    });
    if (x) {
      var good = options.filter(function (o) { return (heaps[o.row] ^ x) === heaps[o.row] - o.take; });
      if (good.length) return pick(good);
    }
    return trap(options, function (o) {
      var next = heaps.slice();
      next[o.row] -= o.take;
      if (next.every(function (h) { return !h; })) return -1;
      return nimShare(next);
    });
  }

  /* ---------- Hiraku ---------- */

  /* Người sắp bốc (đang giữ hand viên, còn left viên trên bàn) có đang ở thế thua không.
     Vòng 1–2: số còn lại đúng "đích" theo 5.
     Vòng 3 (chu kỳ 6): còn 1, 7, 13… mà tay chẵn, hoặc còn 0, 5, 6, 11, 12… mà tay lẻ.
     Vòng 4: bàn đang cân bằng (XOR = 0). Vòng 5: tra bằng misereWins. */
  function moverLoses(left, hand, oppHand) {
    if (isNim()) return nimXor(nimHeaps()) === 0;
    if (isRow()) return rowLoses(rowPresent(), hand, oppHand);
    if (level().mode === 'even') {
      var m = left % 6;
      return (m === 1 && hand % 2 === 0) || ((m === 0 || m === 5) && hand % 2 === 1);
    }
    return left % (maxTake() + 1) === level().target;
  }

  /* Vòng 1: luôn để lại bội số của 5 — đối thủ bốc x thì Hiraku bốc 5 - x.
     Vòng 2: ép về 6 viên (rồi 1 viên) — đối thủ bốc x thì Hiraku bốc 5 - x, cuối cùng đối thủ phải bốc viên cuối.
     Vòng 3: thử bốc 1–4 viên, chọn cách nào đẩy người chơi vào thế thua (xem moverLoses).
     Nếu đang ở thế thua thì gài bẫy (xem trap) và chờ đối thủ sai. */
  function botChoice(left) {
    var most = Math.min(maxTake(), left);
    var options = [];
    for (var k = 1; k <= most; k++) options.push(k);
    if (level().mode === 'even') {
      for (k = 1; k <= most; k++) if (moverLoses(left - k, state.you)) return k;
    } else {
      var r = (left - level().target + (maxTake() + 1)) % (maxTake() + 1);
      if (r >= 1 && r <= most) return r;
    }
    return trap(options, function (n) { return countShare(left - n, state.you, state.bot + n); });
  }

  /* ---------- Gài bẫy khi Hiraku đang ở thế thua ----------
     Không có nước thắng thì Hiraku chọn nước khiến người chơi có ít cách đáp đúng nhất,
     để người chơi dễ đi sai. share = tỉ lệ nước đáp đúng của người chơi sau nước của Hiraku;
     Hiraku tự kết thúc ván mà thua thì cho share = 2 để tránh hẳn. */

  /* Hết sỏi ngay sau nước của lastTaker: người chơi có thắng không. */
  function playerWinsAtEnd(you, bot, lastTaker) {
    if (level().evenWins) return you % 2 === 0;
    return level().lastWins ? lastTaker === 'you' : lastTaker === 'bot';
  }

  function countShare(left, you, bot) {
    if (left === 0) return playerWinsAtEnd(you, bot, 'bot') ? 2 : -1;
    var good = 0;
    var total = Math.min(maxTake(), left);
    for (var j = 1; j <= total; j++) {
      if (left - j === 0) good += playerWinsAtEnd(you + j, bot, 'you') ? 1 : 0;
      else good += moverLoses(left - j, bot, you + j) ? 1 : 0;
    }
    return good / total;
  }

  function rowShare(present, you, bot) {
    if (!present.some(Boolean)) return playerWinsAtEnd(you, bot, 'bot') ? 2 : -1;
    var replies = rowMoves(present);
    var good = 0;
    for (var j = 0; j < replies.length; j++) {
      var next = without(present, replies[j]);
      var y = you + replies[j].length;
      if (!next.some(Boolean)) good += playerWinsAtEnd(y, bot, 'you') ? 1 : 0;
      else good += rowLoses(next, bot, y) ? 1 : 0;
    }
    return good / replies.length;
  }

  function trap(options, share) {
    var best = Infinity;
    var picks = [];
    for (var i = 0; i < options.length; i++) {
      var v = share(options[i]);
      if (v < best) { best = v; picks = [options[i]]; }
      else if (v === best) picks.push(options[i]);
    }
    return pick(picks);
  }

  function botMove() {
    if (state.over) return;
    state.busy = true;
    paint();
    var chosen = [];
    if (isNim()) {
      var mv = botNimMove();
      var inRow = Array.prototype.slice.call(els.field.querySelectorAll('.pebble[data-row="' + mv.row + '"]:not(.is-gone)'));
      while (chosen.length < mv.take) chosen.push(inRow.splice(Math.floor(Math.random() * inRow.length), 1)[0]);
    } else if (isRow()) {
      var all = els.field.querySelectorAll('.pebble');
      botRowMove().forEach(function (i) { chosen.push(all[i]); });
    } else {
      var pool = Array.prototype.slice.call(stones());
      var n = botChoice(state.left);
      while (chosen.length < n) chosen.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    var k = 0;
    (function next() {
      if (k < chosen.length) {
        chosen[k].classList.add('is-picked', 'by-bot');
        k++;
        window.setTimeout(next, 380);
        return;
      }
      els.take.classList.add('is-bot-press');
      window.setTimeout(function () {
        els.take.classList.remove('is-bot-press');
        var took = take('bot');
        var marks = els.field.querySelectorAll('.by-bot');
        for (var i = 0; i < marks.length; i++) marks[i].classList.remove('by-bot');
        if (state.left === 0) return endBy('bot');
        if (level().lastWins === false && state.left === 1) say('Tôi lấy ' + took + ' viên. ' + pick(LINES.lastOne));
        else say('Tôi lấy ' + took + ' viên. ' + (moverLoses(state.left, state.you, state.bot) ? pick(LINES.winning) : pick(LINES.think)));
        state.busy = false;
        state.playerTurn = true;
        paint();
      }, 520);
    })();
  }

  els.take.addEventListener('click', function () {
    if (els.take.disabled) return;
    var n = take('you');
    if (state.left === 0) return endBy('you');
    state.playerTurn = false;
    paint();
    say(moverLoses(state.left, state.bot, state.you) ? pick(LINES.losing) : pick(LINES.think));
    window.setTimeout(botMove, 1100 + n * 120);
  });

  /* ---------- Bắt đầu / kết thúc ---------- */

  /* Số sỏi được bốc thăm ngay ở màn hình chọn lượt để người chơi biết trước khi quyết định.
     Vòng 1–2: 30–35 viên. Vòng 3: 29, 31, 33 hoặc 35 (phải lẻ để chỉ một người giữ số chẵn). Vòng 4–6: 13 viên. Vòng 7: 28 viên (1 + 2 + … + 7). */
  var nextCount = 0;

  function roll() {
    nextCount = level().counts ? pick(level().counts) : 30 + Math.floor(Math.random() * 6);
    var slots = root.querySelectorAll('[data-pebble-count]');
    for (var i = 0; i < slots.length; i++) slots[i].textContent = nextCount;
    return nextCount;
  }

  function showSetup(line) {
    els.result.hidden = true;
    els.board.hidden = true;
    els.setup.hidden = false;
    paintLevel();
    say(line + ' Ván này có ' + roll() + ' viên sỏi.');
  }

  function setLevel(lv) {
    if (lv > unlocked || !LEVELS[lv]) return;
    state.level = lv;
    saveProgress();
    try { history.replaceState(null, '', lv === 1 ? location.pathname : '#vong-' + lv); } catch (e) {}
    showSetup(lv === 1 ? 'Vòng 1: ai bốc viên cuối cùng là thắng.' : pick(LINES['level' + lv]));
  }

  function start(playerFirst) {
    state.left = nextCount;
    state.you = 0;
    state.bot = 0;
    state.lastMove = null;
    state.playerTurn = playerFirst;
    state.busy = false;
    state.over = false;
    els.log.innerHTML = '';
    els.result.hidden = true;
    els.setup.hidden = true;
    els.board.hidden = false;
    buildField(state.left);
    log(level().name + ': ' + state.left + ' viên sỏi', 'sys');
    say(state.left + ' viên sỏi. ' + pick(playerFirst ? LINES.youFirst : LINES.botFirst));
    paint();
    if (!playerFirst) {
      state.busy = true;
      paint();
      window.setTimeout(botMove, 1400);
    }
  }

  function finish(winner) {
    state.over = true;
    state.busy = false;
    paint();
    var youWon = winner === 'you';
    var lastWins = level().lastWins;
    var even = level().evenWins;
    var hasNext = state.level < LAST_LEVEL;
    /* Thắng thì mở khoá vòng tiếp theo; lần sau vào lại sẽ ở ngay vòng mới mở. */
    if (youWon && hasNext && unlocked <= state.level) {
      unlocked = state.level + 1;
      try {
        localStorage.setItem(STORE_KEY, String(unlocked));
        localStorage.setItem(LEVEL_KEY, String(unlocked));
      } catch (e) {}
    }
    say(pick(youWon ? LINES.youWin : LINES.botWin));

    var text;
    if (even) text = 'Hết sỏi: bạn giữ ' + state.you + ' viên, Hiraku giữ ' + state.bot + ' viên.';
    else if (youWon) text = lastWins ? 'Bạn đã bốc viên sỏi cuối cùng.' : 'Hiraku phải bốc viên sỏi cuối cùng.';
    else text = lastWins ? 'Hiraku đã bốc viên sỏi cuối cùng.' : 'Bạn phải bốc viên sỏi cuối cùng.';
    if (youWon) text += hasNext ? ' Bạn đã mở khoá ' + LEVELS[state.level + 1].name + '!' : ' Bạn đã vượt qua tất cả các vòng!';
    else text += ' Thử lại ' + level().name.toLowerCase() + ' nhé.';

    els.result.querySelector('h2').textContent = youWon ? 'BẠN THẮNG!' : 'HIRAKU THẮNG';
    els.result.querySelector('p').textContent = text;
    els.again.textContent = 'Chơi lại ' + level().name.toLowerCase();
    els.nextLevel.hidden = !(youWon && hasNext);
    if (hasNext) els.nextLevel.textContent = 'Sang ' + LEVELS[state.level + 1].name.toLowerCase();
    els.result.classList.toggle('is-win', youWon);
    els.result.hidden = false;
  }

  root.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-level]')) && !t.disabled) return setLevel(parseInt(t.getAttribute('data-level'), 10));
    if ((t = e.target.closest('[data-start]'))) return start(t.getAttribute('data-start') === 'you');
    if (e.target.closest('[data-again]')) return showSetup('Làm lại ' + level().name.toLowerCase() + ' chứ? Cậu muốn đi trước hay sau?');
    if (e.target.closest('[data-next-level]')) return setLevel(state.level + 1);
  });

  /* Mở thẳng vòng đã mở khoá qua #vong-2. */
  var fromHash = parseInt((location.hash.match(/^#vong-(\d+)$/) || [])[1], 10);
  if (fromHash && fromHash <= unlocked && LEVELS[fromHash]) state.level = fromHash;
  paintLevel();
  say(pick(state.level === 1 ? LINES.hello : LINES['level' + state.level]) + ' Ván này có ' + roll() + ' viên sỏi.');
})();
