/* Game Lá Bài Bốc Cháy: người chơi ngồi đối diện Hiraku, nhớ thầm một lá bài,
   Hiraku đọc suy nghĩ và đốt đúng lá đó. */
(function () {
  'use strict';

  var root = document.querySelector('[data-burn-game]');
  if (!root) return;

  var $ = function (sel) { return root.querySelector(sel); };
  var scene = $('[data-scene]');
  var plane = $('[data-plane]');
  var table = $('.dc-table');
  var fx = $('.dc-fx');
  var hiraku = $('[data-hiraku]');
  var speech = $('[data-speech]');
  var bubble = $('.dc-bubble');
  var panel = $('.dc-panel');
  var title = $('[data-title]');
  var text = $('[data-text]');
  var share = $('[data-share]');
  var buttons = {};
  root.querySelectorAll('[data-act]').forEach(function (b) { buttons[b.getAttribute('data-act')] = b; });

  var RANKS = ['j', 'q', 'k'];
  var RANK_NAME = { j: 'J', q: 'Q', k: 'K' };
  var SUIT_NAME = { s: 'bích', c: 'chuồn', d: 'rô', h: 'cơ' };

  /* Vị trí trên mặt bàn, tính theo % của mặt bàn: y nhỏ là phía Hiraku, y lớn là phía người chơi. */
  var PILE_Y = 24;
  var FAN_Y = 58;
  var ROW_Y = 50;

  var LINES = {
    intro: ['Ngồi xuống đây. Hôm nay tôi chỉ cần 6 lá bài và… suy nghĩ của bạn.'],
    spread: ['Sáu lá đây. Nhìn đi, chọn thầm một lá, đừng nói cho tôi biết.', 'Chọn thầm một lá và nhớ thật kỹ nhé. Đừng để lộ ra mặt.'],
    touch: ['Đã bảo đừng chạm vào lá bài mà! Chỉ cần nhìn và nhớ thôi.', 'Ê, tay để yên nào, hihi. Nhớ trong đầu là đủ.', 'Chạm vào là tôi biết bạn chọn lá nào mất, thế thì còn gì vui.'],
    confirm: ['Nhớ rồi à? Giữ chặt hình ảnh đó trong đầu nhé.', 'Tốt. Đừng đổi ý giữa chừng đấy.'],
    gather: ['Giờ tôi úp bài xuống, gộp lại…', 'Úp hết xuống nào. Gộp lại…'],
    shuffle: ['…và xáo thật kỹ. Đến tôi cũng không biết lá nào ở đâu.', '…xáo thật đều. Tôi không nhìn đâu, thề đấy.'],
    deal: ['Sáu lá úp. Lá của bạn đang nằm đâu đó trong này.', 'Xong. Lá của bạn trốn trong 6 lá này rồi.'],
    ready: ['Nhìn thẳng vào mắt tôi. Đừng nghĩ sang lá khác nhé.', 'Nghĩ thật rõ vào. Tôi đang “dò sóng” qua màn hình đây.'],
    read: ['Hmm… tôi bắt đầu thấy lờ mờ rồi…', 'Sóng não của bạn rõ dần rồi đấy…', 'Lá này… không… lá kia…', 'Suỵt… tập trung nào…'],
    pick: ['Đây. Đây chính là lá bạn đã nghĩ.', 'Tìm thấy rồi. Lá này là lá bạn đang nghĩ.'],
    burn: ['Và bây giờ… nó sẽ biến mất.', 'Lá bài này không nên tồn tại nữa. Tạm biệt.'],
    burned: ['Lá của bạn đã cháy thành tro. Bạn xem đúng không nhé?', 'Cháy rồi. Bạn xem đúng không nhé?'],
    reveal: ['Tôi đã đốt lá bài của bạn.'],
    again: ['Chưa phục à? Lần này nhớ lá khác xem.', 'Thêm ván nữa nhé. Tôi vẫn sẽ đọc ra thôi.']
  };

  var PANELS = {
    intro: ['Lá bài bốc cháy', 'Bạn đang ngồi đối diện Hiraku. Cậu ấy sẽ xoè 6 lá bài lên bàn, bạn chỉ cần nhớ thầm một lá. Phần còn lại cứ để Hiraku lo.', ''],
    spread: ['Chọn thầm một lá và ghi nhớ', 'Đừng bấm vào lá bài, đừng nói ra. Nhớ thật kỹ cả chữ lẫn màu, xong thì bấm nút trên bàn.', 'memo'],
    shuffle: ['Hiraku đang xáo bài', 'Úp xuống, gộp lại, xáo thật kỹ…', ''],
    ready: ['Nghĩ thật rõ lá bài của bạn', 'Nhìn thẳng vào Hiraku và giữ hình ảnh lá bài đó trong đầu.', ''],
    read: ['Hiraku đang đọc suy nghĩ của bạn…', 'Đừng nghĩ sang lá khác.', ''],
    pick: ['Đây là lá bạn đã nghĩ', 'Hiraku không cần lật nó lên.', ''],
    burned: ['Lá bài của bạn đã cháy', 'Hiraku vừa đốt đúng lá bạn đang nghĩ. Bạn xem đúng không nhé?', ''],
    final: ['Tôi đã đốt lá bài của bạn', '', 'again']
  };

  var lastLine = '';
  function line(key) {
    var list = LINES[key];
    var t = list[Math.floor(Math.random() * list.length)];
    if (list.length > 1 && t === lastLine) return line(key);
    lastLine = t;
    return t;
  }

  function say(t) {
    bubble.textContent = t;
    [hiraku, speech].forEach(function (el) {
      el.classList.remove('is-talking');
      void el.offsetWidth;
      el.classList.add('is-talking');
    });
    talk(t);
  }

  /* ---------- Biểu cảm của Hiraku ----------
     Nhân vật ghép từ ảnh thân (hốc mắt trắng), tròng mắt cắt riêng di chuyển trong hốc mắt,
     miệng thay theo khẩu hình; tư thế suy tư là bộ thân khác có tay chống cằm. */
  var mouthEl = $('[data-mouth]');
  var pickHand = $('.dc-pick-hand');
  var lighter = $('.dc-lighter');
  var MOUTH_W = { 'mieng-ngam': 67, 'mieng-cuoi': 65, 'mieng-cuoi-to': 81, 'mieng-o': 47, 'mieng-mo': 83, 'mieng-mo-to': 82, 'mieng-o-nho': 44, 'mieng-dep': 72, 'mieng-luon': 81 };
  var MOOD_MOUTH = { idle: 'mieng-cuoi', think: 'mieng-luon', read: 'mieng-ngam', smile: 'mieng-cuoi-to' };
  var TALK_OPEN = ['mieng-o', 'mieng-mo', 'mieng-mo-to', 'mieng-o-nho', 'mieng-mo'];
  var TALK_SHUT = ['mieng-ngam', 'mieng-dep'];
  Object.keys(MOUTH_W).forEach(function (k) { new Image().src = '/assets/hiraku/' + k + '.webp'; });

  var face = { rest: 'mieng-cuoi', talking: false, timer: 0, gaze: true };

  function setMouth(name) {
    mouthEl.src = '/assets/hiraku/' + name + '.webp';
    mouthEl.style.setProperty('--mw', MOUTH_W[name]);
  }

  /* Hướng nhìn: x từ -1 (trái màn hình) tới 1 (phải), y từ -1 (nhìn lên) tới 1 (nhìn xuống bàn). */
  function look(x, y) {
    hiraku.style.setProperty('--lx', Math.max(-1, Math.min(1, x)));
    hiraku.style.setProperty('--ly', Math.max(-1, Math.min(1, y)));
  }

  function mood(m) {
    hiraku.classList.toggle('is-think', m === 'think');
    face.rest = MOOD_MOUTH[m];
    if (m === 'think') look(-.6, -1);
    if (!face.talking) setMouth(face.rest);
  }

  /* Khẩu hình đóng mở xen kẽ trong lúc nói, độ dài theo câu thoại. */
  function talk(t) {
    clearInterval(face.timer);
    face.talking = true;
    var end = performance.now() + Math.min(3200, Math.max(700, t.length * 55));
    var tick = 0;
    face.timer = setInterval(function () {
      if (performance.now() > end) {
        clearInterval(face.timer);
        face.talking = false;
        setMouth(face.rest);
        return;
      }
      var list = tick++ % 2 ? TALK_SHUT : TALK_OPEN;
      setMouth(list[Math.floor(Math.random() * list.length)]);
    }, 120);
  }

  /* Lúc rảnh, mắt Hiraku thỉnh thoảng liếc nhẹ. */
  setInterval(function () {
    if (!face.gaze) return;
    look(rand(-.35, .35), rand(-.2, .3));
  }, 2600);

  function gaze(free, x, y) {
    face.gaze = free;
    if (x != null) look(x, y);
  }

  /* Vị trí lá bài (khung bao trên màn hình) tính theo cảnh. */
  function cardBox(card) {
    var sr = scene.getBoundingClientRect();
    var r = card.el.getBoundingClientRect();
    return { left: r.left - sr.left, top: r.top - sr.top, width: r.width, height: r.height, cx: r.left - sr.left + r.width / 2 };
  }

  /* Mắt nhìn theo một lá bài trên bàn. */
  function lookAt(card) {
    var b = cardBox(card);
    var hr = hiraku.getBoundingClientRect();
    var sr = scene.getBoundingClientRect();
    var hx = hr.left - sr.left + hr.width / 2;
    look((b.cx - hx) / (scene.clientWidth * .3), .75);
  }

  /* Bàn tay chọn bài lơ lửng ngay trên lá bài, hai ngón tay chỉ xuống. */
  function handTo(card, instant) {
    var b = cardBox(card);
    var w = b.width * 1.05;
    var h = w * 495 / 291;
    var st = pickHand.style;
    if (instant) st.transition = 'none';
    st.width = w + 'px';
    st.left = (b.cx - w * .53) + 'px';
    st.top = (b.top - h * .96 + b.height * .18) + 'px';
    if (instant) { void pickHand.offsetWidth; st.transition = ''; }
    pickHand.classList.add('is-on');
  }

  function handAway() { pickHand.classList.remove('is-on'); }

  function setPanel(key) {
    var p = PANELS[key];
    title.textContent = p[0];
    text.textContent = p[1];
    text.hidden = !p[1];
    Object.keys(buttons).forEach(function (k) { buttons[k].hidden = k !== p[2]; });
    share.hidden = key !== 'final';
    panel.classList.remove('is-in');
    void panel.offsetWidth;
    panel.classList.add('is-in');
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function src(id) { return '/assets/bai/' + id + '.webp'; }
  function cardName(id) { return RANK_NAME[id[0]] + ' ' + SUIT_NAME[id[1]]; }

  /* Mỗi ván có một mã riêng; đổi ván thì mọi chuỗi hoạt cảnh của ván cũ dừng lại. */
  var run = 0;
  /* Nhịp biểu diễn: mọi khoảng chờ và chuyển động nhân với hệ số này (lớn hơn 1 là chậm hơn). */
  var PACE = 1.4;

  function wait(ms) {
    ms *= PACE;
    var my = run;
    return new Promise(function (resolve, reject) {
      setTimeout(function () { if (my === run) resolve(); else reject(new Error('stop')); }, ms);
    });
  }
  function guard(fn) {
    return function () { fn().catch(function () {}); };
  }

  /* ---------- Lá bài trên bàn ---------- */

  var cards = [];
  var z = 1;
  for (var i = 0; i < 6; i++) {
    var el = document.createElement('div');
    el.className = 'dc-card';
    el.innerHTML = '<div class="dc-inner"><span class="dc-face dc-back"></span>' +
      '<img class="dc-face dc-front" alt="" width="222" height="323" draggable="false">' +
      '<span class="dc-char" aria-hidden="true"></span></div>';
    plane.appendChild(el);
    cards.push({ el: el, inner: el.querySelector('.dc-inner'), img: el.querySelector('.dc-front'), id: '', up: false });
  }

  var view = { cwPct: 10, gap: 1.3, layout: null };

  /* Cỡ lá bài theo bề ngang mặt bàn; Hiraku ngồi sao cho mép bàn xa che tới ngực. */
  function measure() {
    var w = plane.offsetWidth;
    var sw = scene.clientWidth;
    var cw = Math.min(118, w * .125, sw * .145);
    plane.style.setProperty('--cw', cw + 'px');
    view.cwPct = cw / w * 100;
    /* Khoảng cách giữa các lá trong hàng 6 lá, thu hẹp trên màn hình nhỏ cho khỏi tràn mép. */
    view.gap = Math.min(1.3, sw * .9 / (6 * cw));
    var sr = scene.getBoundingClientRect();
    var far = table.getBoundingClientRect().top - sr.top;
    var h = hiraku.offsetHeight;
    hiraku.style.top = Math.round(far - h * .8) + 'px';
  }

  function place(card, x, y, r, s, ms) {
    var st = card.el.style;
    st.transitionDuration = (ms == null ? 550 : ms) * PACE + 'ms';
    st.setProperty('--x', x);
    st.setProperty('--y', y);
    st.setProperty('--r', r || 0);
    st.setProperty('--s', s || 1);
  }

  function top(card) {
    z++;
    card.el.style.zIndex = z;
    card.el.style.setProperty('--z', z);
  }

  /* Dựng lá bài đứng lên hoặc đặt nằm xuống bàn. */
  function stand(card, up, ms) {
    card.el.style.transitionDuration = (ms || 500) * PACE + 'ms';
    card.el.classList.toggle('is-stand', up);
  }

  /* Lật bài: co bề ngang lại, đổi mặt, giãn ra. Lá bài không lúc nào biến mất. */
  function flip(card, up, ms) {
    if (card.up === up) return Promise.resolve();
    var half = (ms || 340) * PACE / 2;
    var my = run;
    var a = card.inner.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(.06) translateY(-4%)' }], { duration: half, easing: 'ease-in' });
    return a.finished.then(function () {
      if (my !== run) return;
      card.up = up;
      card.el.classList.toggle('is-up', up);
      return card.inner.animate([{ transform: 'scaleX(.06) translateY(-4%)' }, { transform: 'scaleX(1)' }], { duration: half, easing: 'ease-out' }).finished;
    }).catch(function () {});
  }

  function pilePos(card, k, ms) { place(card, 50 + rand(-.4, .4), PILE_Y - k * .5, rand(-3, 3), 1, ms); }

  function fanPos(list, y, ms, gap) {
    var mid = (list.length - 1) / 2;
    var sp = view.cwPct * (gap || 1.02);
    list.forEach(function (c, k) {
      var d = k - mid;
      place(c, 50 + d * sp, y + d * d * 1.2, d * 6, 1, ms);
    });
  }

  function rowPos(list, y, ms) {
    var mid = (list.length - 1) / 2;
    list.forEach(function (c, k) {
      var r = c.el.classList.contains('is-stand') ? 0 : rand(-3, 3);
      place(c, 50 + (k - mid) * view.cwPct * view.gap, y, r, 1, ms);
    });
  }

  function layout(fn) {
    view.layout = fn;
    fn();
  }

  function relayout() {
    measure();
    if (view.layout) view.layout(0);
  }

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(relayout, 120);
  });

  /* ---------- Ván chơi ---------- */

  var deal = { shown: [], alt: [], order: [], picked: null, rest: [] };

  /* Bộ bài cho ván mới. */
  function newDeal() {
    deal.shown = [];
    deal.alt = [];
    RANKS.forEach(function (r) {
      var b = Math.random() < .5 ? ['s', 'c'] : ['c', 's'];
      var d = Math.random() < .5 ? ['h', 'd'] : ['d', 'h'];
      deal.shown.push(r + b[0], r + d[0]);
      deal.alt.push(r + b[1], r + d[1]);
    });
    deal.shown.concat(deal.alt).forEach(function (id) { new Image().src = src(id); });
  }

  /* Đổi mặt bài và chờ ảnh giải mã xong để lúc lật lên không bị trống. */
  function setFaces(list, ids) {
    return Promise.all(list.map(function (c, k) {
      c.id = ids[k];
      c.img.src = src(ids[k]);
      c.img.alt = cardName(ids[k]);
      return c.img.decode ? c.img.decode().catch(function () {}) : Promise.resolve();
    }));
  }

  function resetTable() {
    z = 1;
    fx.textContent = '';
    scene.classList.remove('is-fire');
    hiraku.classList.remove('is-focus', 'is-lean');
    mood('idle');
    gaze(true, 0, 0);
    handAway();
    lighter.classList.remove('is-on', 'is-lit');
    cards.forEach(function (c, k) {
      c.inner.getAnimations().forEach(function (a) { a.cancel(); });
      c.el.className = 'dc-card';
      c.el.style.removeProperty('--burn');
      c.el.style.removeProperty('--bx');
      c.el.style.removeProperty('--by');
      c.el.style.zIndex = k + 1;
      c.el.style.setProperty('--z', k + 1);
      c.up = false;
    });
    measure();
    layout(function (ms) { cards.forEach(function (c, k) { pilePos(c, k, ms); }); });
  }

  function intro() {
    run++;
    resetTable();
    setPanel('intro');
  }

  async function start() {
    newDeal();
    deal.order = cards.slice();
    /* 6 lá xoè ra theo thứ tự lộn xộn, không xếp J, Q, K tăng dần. */
    await setFaces(cards, noSameNeighbours(deal.shown));
    await wait(0);
    setPanel('spread');
    buttons.memo.disabled = true;
    say(line('spread'));
    gaze(false, 0, .8);
    hiraku.classList.add('is-lean');
    /* Xoè từng lá từ cọc bài ra trước mặt người chơi, xoè tới đâu lật tới đó. */
    var mid = 2.5;
    for (var k = 0; k < cards.length; k++) {
      var c = cards[k];
      var d = k - mid;
      top(c);
      place(c, 50 + d * view.cwPct * 1.02, FAN_Y + d * d * 1.2, d * 6, 1, 450);
      await wait(200);
      flip(c, true);
    }
    view.layout = function (ms) { fanPos(deal.order, FAN_Y, ms); };
    await wait(500);
    hiraku.classList.remove('is-lean');
    gaze(true, 0, 0);
    cards.forEach(function (c) { c.el.classList.add('is-touchable'); });
    buttons.memo.disabled = false;
  }

  async function gather() {
    cards.forEach(function (c) { c.el.classList.remove('is-touchable'); });
    setPanel('shuffle');
    mood('idle');
    say(line('gather'));
    gaze(false, 0, .8);
    hiraku.classList.add('is-lean');
    /* Úp từng lá xuống ngay tại chỗ. */
    for (var k = 0; k < cards.length; k++) {
      flip(cards[k], false, 300);
      await wait(110);
    }
    await wait(400);
    await setFaces(cards, shuffle(deal.alt.slice()));
    var stack = shuffle(cards.slice());
    for (var g = 0; g < stack.length; g++) {
      top(stack[g]);
      pilePos(stack[g], g, 420);
      await wait(90);
    }
    view.layout = function (ms) { stack.forEach(function (c, n) { pilePos(c, n, ms); }); };
    await wait(550);
    say(line('shuffle'));

    /* Chia đôi rồi đan lại. */
    for (var round = 0; round < 2; round++) {
      stack.forEach(function (c, n) {
        place(c, n % 2 ? 50 + view.cwPct * .8 : 50 - view.cwPct * .8, PILE_Y - n * .5, n % 2 ? 6 : -6, 1, 280);
      });
      await wait(330);
      shuffle(stack);
      for (var n = 0; n < stack.length; n++) {
        top(stack[n]);
        pilePos(stack[n], n, 160);
        await wait(85);
      }
      await wait(220);
    }
    /* Rút vài lá ra rồi đặt lại lên trên. */
    for (var m = 0; m < 6; m++) {
      var c = stack[Math.floor(Math.random() * stack.length)];
      var side = Math.random() < .5 ? -1 : 1;
      place(c, 50 + side * view.cwPct * 1.1, PILE_Y + rand(-4, 4), side * 14, 1, 170);
      look(side * .6, .8);
      await wait(180);
      top(c);
      pilePos(c, stack.length, 170);
      await wait(190);
    }
    await wait(250);

    say(line('deal'));
    deal.order = shuffle(cards.slice());
    for (var q = 0; q < deal.order.length; q++) {
      top(deal.order[q]);
      place(deal.order[q], 50 + (q - 2.5) * view.cwPct * view.gap, ROW_Y, rand(-3, 3), 1, 420);
      await wait(150);
    }
    view.layout = function (ms) { rowPos(deal.order, ROW_Y, ms); };
    await wait(500);
    hiraku.classList.remove('is-lean');
    /* Hiraku dựng 6 lá úp đứng lên, lưng bài quay về phía người chơi. */
    for (var t = 0; t < deal.order.length; t++) {
      place(deal.order[t], 50 + (t - 2.5) * view.cwPct * view.gap, ROW_Y, 0, 1, 500);
      stand(deal.order[t], true, 500);
      await wait(120);
    }
    await wait(450);
    setPanel('ready');
    gaze(false, 0, 0);
    say(line('ready'));
  }

  /* Hai lá cùng chữ không nằm cạnh nhau. */
  function noSameNeighbours(ids) {
    var out;
    do { out = shuffle(ids.slice()); } while (!out.every(function (id, k) { return k === 0 || id[0] !== out[k - 1][0]; }));
    return out;
  }

  function arrangeRest() {
    var ids = shuffle(deal.alt.slice());
    deal.picked.id = ids[0];
    return setFaces(deal.rest, noSameNeighbours(ids.slice(1)));
  }

  /* Vị trí lá bị đốt chọn ngẫu nhiên trong hàng, không trùng với ván trước. */
  var lastPick = -1;

  async function read() {
    setPanel('read');
    hiraku.classList.add('is-focus');
    /* Suy nghĩ: tay chống cằm, mắt nhìn lên cao. */
    mood('think');
    say(line('read'));
    await wait(2200);
    mood('read');
    var pos;
    do { pos = Math.floor(Math.random() * 6); } while (pos === lastPick);
    lastPick = pos;
    deal.picked = deal.order[pos];
    var seq = deal.order;
    var steps = 12 + seq.indexOf(deal.picked);
    var delay = 90;
    for (var s = 0; s <= steps; s++) {
      var cur = seq[s % 6];
      seq.forEach(function (c) { c.el.classList.toggle('is-scan', c === cur); });
      /* Bàn tay lướt tới lá nào thì tròng mắt đưa theo lá đó. */
      handTo(cur, s === 0);
      lookAt(cur);
      if (s === 8) say(line('read'));
      await wait(delay);
      if (s > steps - 7) delay += 70;
    }
    await wait(500);
    hiraku.classList.remove('is-focus');
    mood('smile');

    /* Lá được chọn vẫn đứng nguyên trong hàng, sáng lên để người chơi biết là lá nào. */
    hiraku.classList.add('is-lean');
    deal.rest = deal.order.filter(function (c) { return c !== deal.picked; });
    await arrangeRest();
    setPanel('pick');
    say(line('pick'));
    await wait(900);
    hiraku.classList.remove('is-lean');
    handAway();
    gaze(false, 0, 0);
    await wait(1400);
    mood('read');
    say(line('burn'));
    lookAt(deal.picked);
    await wait(900);
    deal.picked.el.classList.remove('is-scan');
    await ignite(deal.picked);
    await burn(deal.picked);
    mood('smile');
    gaze(false, 0, 0);
    setPanel('burned');
    say(line('burned'));
  }

  async function reveal() {
    /* Lật cả 5 lá cùng lúc ngay tại chỗ khi các lá còn đứng; lật xong cả 5 lá nằm xuống tại chỗ. */
    var rest = deal.rest;
    await Promise.all(rest.map(function (c) { return flip(c, true, 420); }));
    await wait(1100);
    rest.forEach(function (c) { stand(c, false, 650); });
    await wait(800);
    setPanel('final');
    mood('smile');
    gaze(true);
    say(line('reveal'));
  }

  /* Cả màn biểu diễn chạy liền một mạch; người chơi chỉ bấm một lần để xác nhận đã nhớ lá bài. */
  var memoDone = null;
  var play = guard(async function () {
    await wait(1800);
    await start();
    await new Promise(function (resolve) { memoDone = resolve; });
    memoDone = null;
    mood('smile');
    say(line('confirm'));
    await wait(1600);
    await gather();
    await wait(2400);
    await read();
    await wait(1800);
    await reveal();
  });

  /* ---------- Lửa ---------- */

  function spawn(cls, x, y, size, life, dx, dy) {
    var p = document.createElement('span');
    p.className = cls;
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.width = p.style.height = size + 'px';
    p.style.setProperty('--dx', dx + 'px');
    p.style.setProperty('--dy', dy + 'px');
    p.style.animationDuration = life + 'ms';
    p.addEventListener('animationend', function () { p.remove(); });
    fx.appendChild(p);
  }

  /* Tay cầm bật lửa: đưa vào cạnh lá bài, bật "cạch" toé đốm sáng, ngọn lửa bùng lên rồi châm vào mép dưới lá bài. */
  async function ignite(card) {
    var b = cardBox(card);
    var w = Math.max(100, b.width * 1.45);
    var fh = w * .237 * 155 / 99;
    /* Lá ở nửa trái bàn thì châm từ bên trái (lật ngược tay cầm), nửa phải thì từ bên phải. */
    var fromLeft = b.cx < scene.clientWidth / 2;
    var wickX = w * (fromLeft ? 1 - .601 : .601);
    var wickY = w * 546 / 417 * .286;
    /* Điểm châm: mép bên của lá bài, gần góc dưới; hiệu ứng cháy bén từ đúng điểm này. */
    var tx = fromLeft ? b.left : b.left + b.width;
    var ty = b.top + b.height * .42;
    card.el.style.setProperty('--bx', fromLeft ? '0%' : '100%');
    card.el.style.setProperty('--by', '42%');
    var dir = fromLeft ? -1 : 1;
    var st = lighter.style;
    lighter.classList.toggle('is-flip', fromLeft);
    st.transition = 'none';
    st.width = w + 'px';
    st.left = (tx - wickX + dir * w * .9) + 'px';
    st.top = (ty - wickY + fh * .5 + 60) + 'px';
    void lighter.offsetWidth;
    st.transition = '';
    lighter.classList.add('is-on');
    /* Dừng cách lá bài một chút để bật lửa. */
    var px = tx - wickX + dir * w * .35;
    var py = ty - wickY + fh * .5 + 20;
    st.left = px + 'px';
    st.top = py + 'px';
    await wait(650);
    /* Cạch! đốm sáng toé ra rồi ngọn lửa xuất hiện. */
    var sx = px + wickX;
    var sy = py + wickY;
    spawn('dc-flash', sx, sy - 6, 70, 400, 0, 0);
    for (var k = 0; k < 16; k++) {
      var a = rand(-Math.PI * .95, -Math.PI * .05);
      var d = rand(18, 50);
      spawn('dc-spark', sx, sy - 4, rand(2, 5), rand(220, 420), Math.cos(a) * d, Math.sin(a) * d);
    }
    await wait(140);
    lighter.classList.add('is-lit');
    await wait(700);
    /* Đưa ngọn lửa chạm mép lá bài. */
    st.left = (tx - wickX) + 'px';
    st.top = (ty - wickY + fh * .5) + 'px';
    await wait(560);
    var my = run;
    setTimeout(function () {
      if (my !== run) return;
      lighter.classList.remove('is-on', 'is-lit');
      st.left = (tx - wickX + dir * w * .9) + 'px';
      st.top = (ty - wickY + fh * .5 + 60) + 'px';
    }, 900);
  }

  function burn(card) {
    var my = run;
    var DURATION = 3400 * PACE;
    var sr = scene.getBoundingClientRect();
    var cr = card.el.getBoundingClientRect();
    var left = cr.left - sr.left;
    var topY = cr.top - sr.top;
    var w = cr.width;
    var h = cr.height;
    /* Lửa bén từ điểm bật lửa châm vào (--bx, --by), lan dần ra cả lá. */
    var bx = parseFloat(card.el.style.getPropertyValue('--bx') || '55') / 100;
    var by = parseFloat(card.el.style.getPropertyValue('--by') || '100') / 100;
    var ox = left + w * bx;
    var oy = topY + h * by;
    var reach = Math.sqrt(Math.pow(w * Math.max(bx, 1 - bx), 2) + Math.pow(h * Math.max(by, 1 - by), 2));

    card.el.classList.add('is-burning');
    scene.classList.add('is-fire');
    spawn('dc-flash', ox, oy, Math.max(w, 80), 700, 0, 0);

    return new Promise(function (resolve, reject) {
      var t0 = performance.now();
      var lastSpawn = 0;
      function tick(now) {
        if (my !== run) { reject(new Error('stop')); return; }
        var t = Math.min(1, (now - t0) / DURATION);
        var eased = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        var pct = eased * 112;
        card.el.style.setProperty('--burn', pct + '%');

        if (now - lastSpawn > 34 && t < .97) {
          lastSpawn = now;
          var r = pct / 100 * reach;
          for (var n = 0; n < 3; n++) {
            for (var tries = 0; tries < 6; tries++) {
              var a = Math.random() * Math.PI * 2;
              var x = ox + Math.cos(a) * r;
              var y = oy + Math.sin(a) * r;
              if (x < left || x > left + w || y < topY || y > topY + h) continue;
              spawn('dc-fire', x, y, rand(.16, .32) * w, rand(500, 900), rand(-10, 10), -rand(30, 70));
              if (Math.random() < .35) spawn('dc-ember', x, y, rand(2, 4), rand(900, 1500), rand(-40, 40), -rand(60, 140));
              break;
            }
          }
        }

        if (t < 1) { requestAnimationFrame(tick); return; }
        card.el.classList.add('is-ash');
        scene.classList.remove('is-fire');
        for (var s = 0; s < 6; s++) {
          spawn('dc-smoke', left + rand(.2, .8) * w, topY + rand(.2, .8) * h, rand(40, 70), rand(1600, 2400), rand(-20, 20), -rand(60, 110));
        }
        for (var k = 0; k < 14; k++) {
          spawn('dc-ash', left + rand(.1, .9) * w, topY + rand(.3, .9) * h, rand(3, 7), rand(1200, 2000), rand(-30, 30), rand(10, 30));
        }
        setTimeout(function () { if (my === run) resolve(); else reject(new Error('stop')); }, 900);
      }
      requestAnimationFrame(tick);
    });
  }

  /* ---------- Sự kiện ---------- */

  root.addEventListener('click', function (e) {
    var card = e.target.closest('.dc-card');
    if (card) {
      if (card.classList.contains('is-touchable')) say(line('touch'));
      return;
    }
    var btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    var act = btn.getAttribute('data-act');
    if (act === 'memo' && memoDone) { buttons.memo.hidden = true; memoDone(); }
    else if (act === 'again') { intro(); say(line('again')); play(); }
  });

  intro();
  say(line('intro'));
  /* Bắt đầu biểu diễn khi người chơi đã nhìn thấy bàn. */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      play();
    }, { threshold: .5 });
    io.observe(scene);
  } else {
    play();
  }
  /* Ảnh Hiraku tải xong mới biết chiều cao thật để đặt cậu ấy ngồi đúng sau bàn. */
  window.addEventListener('load', relayout);
  hiraku.querySelector('img').addEventListener('load', relayout);
})();
