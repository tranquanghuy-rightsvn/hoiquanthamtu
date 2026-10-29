/* Game Đọc Suy Nghĩ: Hiraku đoán lá bài người chơi nghĩ thầm.
   Hiraku giữ danh sách các lá "còn khả năng". Mỗi lần hỏi luôn hiện đúng 20 lá:
   lần đầu là 20 lá ngẫu nhiên trong 52 lá (Có còn 20 lá, Không còn 32 lá); các lần sau
   lấy khoảng một nửa số lá còn khả năng, phần còn thiếu bù bằng những lá đã bị loại.
   Có thì giữ phần được hiện, Không thì giữ phần còn lại, sau 6 lần còn đúng 1 lá. */
(function () {
  'use strict';

  var root = document.querySelector('[data-mind-game]');
  if (!root) return;

  var $ = function (sel) { return root.querySelector(sel); };
  var els = {
    hiraku: $('[data-say="hiraku"]'),
    intro: $('.mt-intro'),
    confirm: $('.mt-confirm'),
    confirmText: $('[data-confirm-text]'),
    ask: $('.mt-ask'),
    reveal: $('.mt-reveal'),
    list: $('.mt-list'),
    flip: $('.mt-flip'),
    front: $('.mt-front'),
    again: $('[data-again]'),
    share: $('[data-share]')
  };

  var RANKS = ['a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k'];
  var SUITS = ['s', 'c', 'd', 'h'];
  var RANK_NAME = { a: 'A', j: 'J', q: 'Q', k: 'K' };
  var SUIT_NAME = { s: 'bích', c: 'chuồn', d: 'rô', h: 'cơ' };
  var LISTS = 6;
  var PER_LIST = 20;
  /* Hai màn xác nhận cho vui trước khi vào danh sách đầu tiên. */
  var CONFIRMS = [
    { text: 'Bạn nghĩ kĩ chưa?', say: 'Chắc chưa đấy? Nghĩ kĩ vào nhé.' },
    { text: 'Đừng thay đổi suy nghĩ đấy nhé.', say: 'Đổi lá giữa chừng là tôi biết ngay, hihi.' }
  ];

  /* Bộ bài xếp sẵn theo thứ tự tăng dần: A, 2, … K; cùng số thì bích, chuồn, rô, cơ. */
  var deck = [];
  RANKS.forEach(function (r) {
    SUITS.forEach(function (s) {
      deck.push({ id: r + s, name: (RANK_NAME[r] || r) + ' ' + SUIT_NAME[s] });
    });
  });

  var LINES = {
    begin: ['Tốt. Giữ hình ảnh lá bài đó trong đầu nhé.', 'Đừng đổi ý giữa chừng đấy. Bắt đầu thôi.', 'Tập trung vào lá bài của bạn. Tôi đang “dò sóng”.', 'Nghĩ xong rồi à? Nhanh đấy. Vào việc thôi.', 'Nhắm mắt lại ba giây, nghĩ thật rõ lá bài đó… rồi mở mắt ra nhìn đây.'],
    ask: ['Nhớ xem cho kĩ nhé.', 'Không được nói dối đâu đấy.', 'Cậu nói dối là tôi biết đấy, hihi.', 'Có lá bài cậu đang nghĩ không?', 'Lá của bạn có ở đây không?', 'Đừng vội, tìm cho kĩ nhé.', 'Nhìn từng lá một thôi, đừng bỏ sót.', 'Đừng nhìn tôi, nhìn vào danh sách ấy.', 'Tôi không nhìn trộm đâu. Tôi chỉ… đọc thôi.', 'Bình tĩnh, cứ trả lời thật lòng.', 'Mắt cậu vừa sáng lên kìa. Hay là không?', 'Có hay không, nói thật là được.'],
    near: ['Hmm… tôi bắt đầu thấy lờ mờ rồi.', 'Tôi biết nó là gì rồi. Nhưng cứ trả lời cho chắc.', 'Sóng não của cậu rõ dần rồi đấy.', 'Gần ra rồi. Thêm chút nữa.', 'Tôi đoán được một nửa rồi, hihi.'],
    last: ['Còn 1 lần này nữa thôi.', 'Danh sách cuối. Thành thật nhé.', 'Lần cuối rồi, nhìn thật kĩ vào.', 'Câu cuối cùng. Sau đó tôi sẽ nói ra lá bài của cậu.'],
    yes: ['Có à? Tôi biết mà.', 'Ừm, đúng như tôi nghĩ.', 'Hay đấy.'],
    no: ['Không à? Được thôi.', 'Ồ, thế thì thú vị đây.', 'Ừm… ghi nhận.'],
    think: ['Để tôi tập trung một chút…', 'Tôi đang đọc suy nghĩ của bạn…', 'Suỵt… đừng nghĩ sang lá khác nhé…', 'Hình ảnh đang hiện ra rồi…'],
    found: ['Đây là lá bài bạn đang nghĩ, đúng không?', 'Không giấu được tôi đâu.', 'Ảo thuật hay suy luận? Bạn tự đoán đi.', 'Tôi đã bảo rồi mà, hihi.', 'Đọc suy nghĩ là nghề của tôi.'],
    lost: ['Lạ thật, suy nghĩ của bạn bị nhiễu sóng rồi. Kiểm tra lại các danh sách nhé.', 'Ơ, cậu nói dối tôi đúng không? Tôi biết mà, hihi.', 'Có ai đó vừa đổi lá bài giữa chừng thì phải…'],
    touch: ['Đã bảo đừng chạm vào lá bài mà! Tôi biết hết đấy.', 'Ê, chạm vào là tôi biết đấy nhé. Chỉ cần bấm Có hoặc Không thôi.', 'Tay để yên nào, hihi.'],
    again: ['Lần này nghĩ một lá khác đi. Tôi vẫn sẽ đoán ra thôi.', 'Chưa phục à? Thử thêm lần nữa xem.', 'Nghĩ lá khó hơn đi, tôi chấp hết.']
  };

  /* Không nói lại đúng câu vừa nói. */
  var lastLine = '';
  function line(key) {
    var list = LINES[key];
    var text = list[Math.floor(Math.random() * list.length)];
    if (list.length > 1 && text === lastLine) return line(key);
    lastLine = text;
    return text;
  }

  var state = { left: [], shown: [], step: 0, timer: 0, confirm: 0 };

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
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

  function src(card) { return '/assets/bai/' + card.id + '.webp'; }

  function show(panel) {
    els.intro.hidden = panel !== els.intro;
    els.confirm.hidden = panel !== els.confirm;
    els.ask.hidden = panel !== els.ask;
    els.reveal.hidden = panel !== els.reveal;
  }

  function deal() {
    state.left = deck.slice();
    state.step = 0;
  }

  /* Chọn 20 lá cho lần hỏi này. Số lá còn khả năng được hiện (k) phải sao cho
     dù trả lời Có hay Không, số lá còn lại vẫn đoán được với số lần hỏi còn lại:
     không quá 2^(số lần còn lại sau lần này). Lần đầu luôn là 20 lá trong 52. */
  function pickList() {
    var n = state.left.length;
    var cap = 1 << (LISTS - state.step - 1);
    var k = state.step === 0 ? PER_LIST : Math.floor(n / 2) + (n % 2 && Math.random() < .5 ? 1 : 0);
    k = Math.max(n - cap, Math.min(k, cap, PER_LIST));
    var left = shuffle(state.left.slice());
    var out = shuffle(deck.filter(function (c) { return state.left.indexOf(c) < 0; }));
    state.shown = left.slice(0, k).concat(out.slice(0, PER_LIST - k));
  }

  function renderList(lead) {
    pickList();
    els.list.textContent = '';
    deck.forEach(function (card) {
      if (state.shown.indexOf(card) < 0) return;
      var li = document.createElement('li');
      var img = document.createElement('img');
      img.className = 'mt-card';
      img.src = src(card);
      img.alt = card.name;
      img.width = 222;
      img.height = 323;
      li.style.animationDelay = (els.list.children.length * 18) + 'ms';
      li.appendChild(img);
      els.list.appendChild(li);
    });
    var key = state.step === LISTS - 1 ? 'last' : (state.step >= 3 ? 'near' : 'ask');
    say((lead ? lead + ' ' : '') + line(key));
  }

  function confirmStep() {
    if (state.confirm >= CONFIRMS.length) { begin(); return; }
    var c = CONFIRMS[state.confirm++];
    els.confirmText.textContent = c.text;
    show(els.confirm);
    els.confirm.classList.remove('is-in');
    void els.confirm.offsetWidth;
    els.confirm.classList.add('is-in');
    say(c.say);
  }

  function begin() {
    deal();
    deck.forEach(function (card) { new Image().src = src(card); });
    show(els.ask);
    renderList(line('begin'));
  }

  function answer(yes) {
    state.left = state.left.filter(function (c) { return (state.shown.indexOf(c) >= 0) === yes; });
    state.step++;
    if (state.step < LISTS) renderList(Math.random() < .35 ? line(yes ? 'yes' : 'no') : '');
    else reveal();
  }

  function reveal() {
    var card = state.left.length === 1 ? state.left[0] : null;
    var title = els.reveal.querySelector('h2');
    var note = els.reveal.querySelector('p');
    show(els.reveal);
    els.flip.classList.remove('is-open');
    els.flip.classList.add('is-thinking');
    els.again.hidden = true;
    els.share.hidden = true;
    title.textContent = '';
    note.textContent = '';
    say(line('think'));
    if (card) els.front.src = src(card);
    clearTimeout(state.timer);
    state.timer = setTimeout(function () {
      els.flip.classList.remove('is-thinking');
      els.again.hidden = false;
      els.share.hidden = false;
      if (!card) {
        title.textContent = 'Hình như có nhầm lẫn';
        note.textContent = 'Không có lá bài nào khớp với các câu trả lời của bạn. Chơi lại và kiểm tra kỹ từng danh sách nhé.';
        say(line('lost'));
        return;
      }
      els.front.alt = card.name;
      els.flip.classList.add('is-open');
      title.textContent = card.name;
      note.textContent = 'Đúng lá bạn đang nghĩ chứ? Chơi lại với một lá khác để thử Hiraku lần nữa.';
      say(line('found'));
    }, 1600);
  }

  root.addEventListener('click', function (e) {
    if (e.target.closest('.mt-list li')) { say(line('touch')); return; }
    var btn = e.target.closest('button');
    if (!btn) return;
    if (btn.hasAttribute('data-begin')) { state.confirm = 0; confirmStep(); }
    else if (btn.hasAttribute('data-ok')) confirmStep();
    else if (btn.hasAttribute('data-answer')) answer(btn.getAttribute('data-answer') === 'yes');
    else if (btn.hasAttribute('data-again')) {
      clearTimeout(state.timer);
      show(els.intro);
      say(line('again'));
    }
  });
})();
