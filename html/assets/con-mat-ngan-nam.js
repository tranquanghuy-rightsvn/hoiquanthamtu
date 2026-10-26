/* Game Con Mắt Ngàn Năm: con mắt của Hiraku đoán ký tự cổ người chơi đang nghĩ.
   Số có 2 chữ số ab trừ đi a rồi trừ đi b luôn ra 9 × a, tức một bội của 9.
   Mỗi lượt, các số 9, 18, … 81 trong bảng 0–99 mang cùng một ký tự được chọn ngẫu nhiên;
   các số còn lại mang ký tự khác. Bảng xếp hàng 8–11 số để các bội của 9 không thẳng cột. */
(function () {
  'use strict';

  var root = document.querySelector('[data-eye-game]');
  if (!root) return;

  var $ = function (sel) { return root.querySelector(sel); };
  var els = {
    hiraku: $('[data-say="hiraku"]'),
    panels: root.querySelectorAll('[data-panel]'),
    badge: $('[data-step-badge]'),
    stepTitle: $('[data-step-title]'),
    stepText: $('[data-step-text]'),
    stepBtn: $('[data-panel="step"] [data-next]'),
    board: $('.cm-board'),
    read: $('.cm-read'),
    readTitle: $('[data-read-title]'),
    readText: $('[data-read-text]'),
    answerBox: $('.cm-answer'),
    answer: $('[data-answer]'),
    readStart: $('[data-read-start]'),
    again: $('[data-again]'),
    count: $('[data-count]'),
    share: $('[data-share]')
  };

  /* Bọ hung, cú, rắn hổ mang, ankh, cột djed, mặt trời, sư tử, chim ưng, cá, cây sậy,
     cánh tay, bàn chân, nước, ngôi nhà, rắn lục. */
  var GLYPHS = ['𓆣', '𓅓', '𓆓', '𓋹', '𓊽', '𓇳', '𓃭', '𓅃', '𓆛', '𓇋', '𓂝', '𓃀', '𓈖', '𓉐', '𓆑'];

  /* Thời gian được nhìn bảng số trước khi con mắt tự chuyển sang bước đọc. */
  var MEMORIZE = 10;

  var STEPS = [
    { title: 'Nghĩ một số có 2 chữ số bất kỳ', text: 'Ví dụ 47. Đừng nói ra, cũng đừng viết ra.' },
    { title: 'Lấy số đó trừ đi chữ số đầu tiên', text: 'Ví dụ nghĩ 47 thì lấy 47 − 4. Nhẩm trong đầu thôi, đừng viết ra.' },
    { title: 'Lấy kết quả trừ tiếp chữ số phía sau', text: 'Với ví dụ 47 thì trừ tiếp đi 7. Nhớ kỹ kết quả cuối cùng.' },
    { badge: MEMORIZE + 's', title: 'Chuẩn bị ghi nhớ', btn: 'Tôi đã sẵn sàng',
      text: 'Bảng số sẽ hiện ra trong ' + MEMORIZE + ' giây. Tìm kết quả của bạn và ghi nhớ thật kỹ ký tự đi kèm. Hết giờ, bảng sẽ biến mất.' }
  ];

  /* Mỗi câu khi con mắt quét hiện trong 2,4 giây, cả lượt quét khoảng 7 giây. */
  var READ_STEP = 2400;

  var READING = [
    { title: 'Đừng chớp mắt…', text: 'Nhìn thẳng vào con mắt.' },
    { title: 'Tiếp tục nghĩ về ký tự đó…', text: 'Hình dung thật rõ từng nét của nó.' },
    { title: 'Con mắt đang đọc…', text: 'Sắp xong rồi, đừng rời mắt.' }
  ];

  var LINES = {
    intro: ['Nó nhìn tôi suốt từ hôm qua đến giờ. Hơi rợn, nhưng mà hay lắm.', 'Thử thách nó đi. Tôi cá là nó không sai đâu.'],
    step0: ['Số nào cũng được, miễn là có 2 chữ số.', 'Nghĩ xong chưa? Đừng nói cho tôi biết đấy.', 'Con mắt bắt đầu mở to rồi kìa…'],
    step1: ['Nhẩm thôi nhé, đừng viết ra giấy.', 'Bình tĩnh mà trừ, không ai chấm điểm đâu.', 'Con mắt đang nhìn bạn tính nhẩm đấy.'],
    step2: ['Trừ tiếp chữ số còn lại nhé.', 'Nhớ kỹ kết quả cuối cùng, đừng để lẫn.', 'Xong phép trừ là tới phần hay rồi.'],
    step3: ['Chỉ có 10 giây thôi đấy, tập trung nhé.', 'Sẵn sàng chưa? Bảng số không chờ ai đâu.', 'Hít một hơi thật sâu rồi hẵng bấm.'],
    board: ['Tìm số của bạn trong bảng, nhớ ký tự đi kèm.', 'Ký tự cổ Ai Cập đấy. Chọn đúng con số của bạn nhé.', 'Nhớ hình dáng ký tự thôi, không cần biết nó tên gì.', 'Tôi quay mặt đi rồi, cứ tìm thoải mái.'],
    ready: ['Giờ nhìn thẳng vào con mắt. Không được chớp đâu đấy.', 'Đừng ngừng nghĩ về ký tự đó nhé.'],
    reading: ['Đừng chớp mắt…', 'Tiếp tục nghĩ… con mắt đang thấy nó rồi.', 'Suỵt… nó đang đọc.', 'Đừng nghĩ sang ký tự khác nhé, nó dễ bị nhiễu lắm.'],
    found: ['Con mắt ngàn năm chưa bao giờ nhìn sai.', 'Thấy chưa? Tôi đã bảo nó đọc được suy nghĩ mà.', 'Ký tự này đúng không? Con mắt bảo đúng, hihi.'],
    again: ['Chơi lại à? Nghĩ số khác đi, nó vẫn đọc ra thôi.', 'Lần này thử số khó hơn xem.', 'Con mắt đang chờ bạn đấy.']
  };

  var state = { step: 0, secret: '', timers: [] };

  var lastLine = '';
  function line(key) {
    var list = LINES[key];
    var text = list[Math.floor(Math.random() * list.length)];
    if (list.length > 1 && text === lastLine) return line(key);
    lastLine = text;
    return text;
  }

  function rand(n) { return Math.floor(Math.random() * n); }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = rand(i + 1);
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function say(text) {
    var el = els.hiraku;
    el.querySelector('.pb-bubble').textContent = text;
    el.classList.remove('is-talking');
    void el.offsetWidth;
    el.classList.add('is-talking');
  }

  function show(name) {
    for (var i = 0; i < els.panels.length; i++) {
      var panel = els.panels[i];
      panel.hidden = panel.getAttribute('data-panel') !== name;
      if (!panel.hidden) {
        panel.classList.remove('is-in');
        void panel.offsetWidth;
        panel.classList.add('is-in');
      }
    }
  }

  function clearTimers() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
  }

  /* Chia 100 số thành các hàng dài 8–11, hai hàng liền nhau không dài bằng nhau. */
  function rowLengths() {
    for (;;) {
      var out = [];
      var sum = 0;
      while (sum < 100) {
        var n = 8 + rand(4);
        if (n === out[out.length - 1]) continue;
        out.push(n);
        sum += n;
      }
      if (sum === 100) return out;
    }
  }

  /* Kết quả chỉ có thể là 9, 18, … 81. Số 0, 90 và 99 cũng chia hết cho 9
     nhưng không thể ra được, nên mang ký tự khác cho đỡ lộ. */
  function isAnswer(n) { return n >= 9 && n <= 81 && n % 9 === 0; }

  /* Mỗi hàng lệch trái/phải ngẫu nhiên từng nửa ô (vẫn nằm trong khung 11 ô).
     x là vị trí ngang của ô, tính theo số ô tính từ giữa bảng. */
  function layout() {
    var rows = rowLengths();
    var offs = rows.map(function (len) { return rand(2 * (11 - len) + 1) / 2 - (11 - len) / 2; });
    var cells = [];
    var n = 0;
    rows.forEach(function (len, r) {
      for (var i = 0; i < len; i++, n++) cells.push({ n: n, row: r, x: i - (len - 1) / 2 + offs[r] });
    });
    return { rows: rows, offs: offs, cells: cells };
  }

  /* Các ô đáp án không được thẳng cột với nhau trong phạm vi 2 hàng,
     và ba ô liên tiếp không được xếp thành một đường thẳng (kể cả đường chéo). */
  function scattered(cells) {
    var s = cells.filter(function (c) { return isAnswer(c.n); });
    for (var i = 0; i < s.length; i++) {
      for (var j = i + 1; j < s.length; j++) {
        var dr = s[j].row - s[i].row;
        if (dr > 0 && dr <= 2 && Math.abs(s[j].x - s[i].x) < 1) return false;
      }
      if (i + 2 < s.length) {
        var a = s[i], b = s[i + 1], c = s[i + 2];
        if (b.row - a.row === c.row - b.row && Math.abs((b.x - a.x) - (c.x - b.x)) < 1) return false;
      }
    }
    return true;
  }

  /* Gán ký tự cho các số còn lại: không trùng ô bên trái, không trùng ô ngay phía trên,
     ưu tiên ký tự đang dùng ít nhất để các ký tự xuất hiện đều nhau. */
  function assignGlyphs(cells, others) {
    var used = {};
    others.forEach(function (g) { used[g] = 0; });
    cells.forEach(function (cell, k) {
      if (isAnswer(cell.n)) { cell.glyph = state.secret; return; }
      var near = cells.filter(function (o, m) {
        return m < k && ((o.row === cell.row && m === k - 1) || (o.row === cell.row - 1 && Math.abs(o.x - cell.x) < 1));
      }).map(function (o) { return o.glyph; });
      var free = shuffle(others.filter(function (g) { return near.indexOf(g) < 0; }));
      free.sort(function (p, q) { return used[p] - used[q]; });
      cell.glyph = free[0];
      used[cell.glyph]++;
    });
  }

  function buildBoard() {
    state.secret = GLYPHS[rand(GLYPHS.length)];
    var others = GLYPHS.filter(function (g) { return g !== state.secret; });
    var plan;
    do { plan = layout(); } while (!scattered(plan.cells));
    assignGlyphs(plan.cells, others);
    els.board.textContent = '';
    var rowEl = null;
    plan.cells.forEach(function (c) {
      if (!rowEl || rowEl.rowIndex !== c.row) {
        rowEl = document.createElement('div');
        rowEl.className = 'cm-row';
        rowEl.rowIndex = c.row;
        rowEl.style.setProperty('--off', plan.offs[c.row]);
        els.board.appendChild(rowEl);
      }
      var cell = document.createElement('span');
      cell.className = 'cm-cell';
      var num = document.createElement('b');
      num.textContent = c.n;
      var glyph = document.createElement('i');
      glyph.className = 'cm-glyph';
      glyph.textContent = c.glyph;
      cell.appendChild(num);
      cell.appendChild(glyph);
      rowEl.appendChild(cell);
    });
  }

  function showStep() {
    var s = STEPS[state.step];
    els.badge.textContent = s.badge || state.step + 1;
    els.stepBtn.textContent = s.btn || 'OK';
    els.badge.classList.toggle('is-timer', !!s.badge);
    els.stepTitle.textContent = s.title;
    els.stepText.textContent = s.text;
    show('step');
    say(line('step' + state.step));
  }

  function showRead() {
    clearTimers();
    els.read.classList.remove('is-reading', 'is-done');
    els.readTitle.textContent = 'Nhìn thẳng vào con mắt';
    els.readText.textContent = 'Không được chớp mắt. Đừng ngừng nghĩ về ký tự đó.';
    els.readText.hidden = false;
    els.answerBox.hidden = true;
    els.readStart.hidden = false;
    els.again.hidden = true;
    els.share.hidden = true;
    show('read');
    say(line('ready'));
  }

  function startReading() {
    els.readStart.hidden = true;
    els.read.classList.add('is-reading');
    READING.forEach(function (r, i) {
      state.timers.push(setTimeout(function () {
        els.readTitle.textContent = r.title;
        els.readText.textContent = r.text;
        say(line('reading'));
      }, i * READ_STEP));
    });
    state.timers.push(setTimeout(reveal, READING.length * READ_STEP));
  }

  function reveal() {
    els.read.classList.remove('is-reading');
    els.read.classList.add('is-done');
    els.readTitle.textContent = 'Ký tự bạn đang nghĩ là';
    els.readText.hidden = true;
    els.answer.textContent = state.secret;
    els.answerBox.hidden = false;
    els.again.hidden = false;
    els.share.hidden = false;
    say(line('found'));
  }

  /* Đếm ngược 10 giây trên bảng số; mỗi giây con số nhảy lên một nhịp, hết giờ thì sang bước đọc. */
  function countdown() {
    clearTimers();
    for (var s = 0; s <= MEMORIZE; s++) {
      (function (left) {
        state.timers.push(setTimeout(function () {
          if (left === 0) return showRead();
          els.count.textContent = left;
          els.count.classList.remove('is-tick');
          void els.count.offsetWidth;
          els.count.classList.add('is-tick');
        }, (MEMORIZE - left) * 1000));
      })(MEMORIZE - s);
    }
  }

  function next() {
    var current = '';
    for (var i = 0; i < els.panels.length; i++) {
      if (!els.panels[i].hidden) current = els.panels[i].getAttribute('data-panel');
    }
    if (current === 'intro') {
      state.step = 0;
      showStep();
    } else if (current === 'step' && state.step < STEPS.length - 1) {
      state.step++;
      showStep();
    } else if (current === 'step') {
      buildBoard();
      show('board');
      say(line('board'));
      countdown();
    }
  }

  root.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    if (btn.hasAttribute('data-next')) next();
    else if (btn.hasAttribute('data-read-start')) startReading();
    else if (btn.hasAttribute('data-again')) {
      clearTimers();
      state.step = 0;
      showStep();
      say(line('again'));
    }
  });
})();
