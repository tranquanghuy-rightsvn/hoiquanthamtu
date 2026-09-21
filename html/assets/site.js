/* Hội Quán Thám Tử — layout dùng chung, điều hướng, bộ lọc. */
(function () {
  'use strict';

  var BASE = window.HQ_BASE || '';
  var COIN_KEY = 'hqtt.coins';
  var DEFAULT_COINS = 120;

  function url(path) {
    return BASE + path;
  }

  /* ---------- Dữ liệu điều hướng ---------- */

  var NAV = [
    { id: 'home', label: 'Trang chủ', href: 'index.html' },
    { id: 'vu-an', label: 'Vụ án', href: 'vu-an.html' },
    { id: 'cau-do', label: 'Câu đố', href: 'cau-do.html' },
    { id: 'game', label: 'Game', href: 'game.html' },
    {
      id: 'truyen',
      label: 'Truyện trinh thám',
      panel: [
        {
          icon: 'short',
          title: 'Truyện ngắn',
          note: 'Khép lại trong một lần đọc',
          href: 'truyen-ngan.html',
          links: [
            { label: 'Miễn phí', href: 'truyen-ngan.html#free', count: 3, kind: 'free' },
            { label: 'Trả phí', href: 'truyen-ngan.html#vip', count: 3, kind: 'vip' }
          ]
        },
        {
          icon: 'long',
          title: 'Truyện dài',
          note: 'Nhiều chương, một vụ án lớn',
          href: 'truyen-dai.html',
          links: [
            { label: 'Miễn phí', href: 'truyen-dai.html#free', count: 2, kind: 'free' },
            { label: 'Trả phí', href: 'truyen-dai.html#vip', count: 2, kind: 'vip' }
          ]
        }
      ]
    },
    { id: 'blog', label: 'Blog của Gà', href: 'blog-ga.html' },
    { id: 'about', label: 'Về chúng tôi', href: 've-chung-toi.html' }
  ];

  var BRAND_SVG =
    '<svg viewBox="0 0 48 48"><circle cx="20" cy="20" r="12"/><path d="m29 29 11 11"/><path d="M15 21l4 4 7-10"/></svg>';

  var PANEL_ICON = {
    short:
      '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 4h14l5 5v19H7z"/><path d="M21 4v5h5"/><path d="M11 15h11M11 20h11M11 25h7"/></svg>',
    long:
      '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 6h9a3 3 0 0 1 3 3v17a3 3 0 0 0-3-3H5z"/><path d="M27 6h-9a3 3 0 0 0-3 3v17a3 3 0 0 1 3-3h9z"/></svg>'
  };

  /* ---------- Ví Xu ---------- */

  function readCoins() {
    try {
      var raw = window.localStorage.getItem(COIN_KEY);
      if (raw === null) return DEFAULT_COINS;
      var n = parseInt(raw, 10);
      return isNaN(n) ? DEFAULT_COINS : n;
    } catch (e) {
      return DEFAULT_COINS;
    }
  }

  function writeCoins(n) {
    try {
      window.localStorage.setItem(COIN_KEY, String(n));
    } catch (e) {
      /* chế độ riêng tư: ví chỉ sống trong phiên này */
    }
    paintCoins(n);
  }

  function paintCoins(n) {
    var slots = document.querySelectorAll('[data-coin-value]');
    for (var i = 0; i < slots.length; i++) slots[i].textContent = n;
  }

  /* ---------- Dựng header ---------- */

  function navMarkup(active) {
    var out = '';
    for (var i = 0; i < NAV.length; i++) {
      var item = NAV[i];
      var on = item.id === active;
      if (!item.panel) {
        out +=
          '<a class="nav-link' + (on ? ' is-active' : '') + '" href="' + url(item.href) + '"' +
          (on ? ' aria-current="page"' : '') + '>' + item.label + '</a>';
        continue;
      }
      out +=
        '<div class="nav-drop' + (on ? ' is-active' : '') + '" data-drop>' +
        '<button class="nav-link nav-drop-btn" type="button" aria-expanded="false" aria-haspopup="true"' +
        (on ? ' aria-current="page"' : '') + '>' + item.label +
        '<svg class="caret" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5 6 6.5l5-5"/></svg></button>' +
        panelMarkup(item.panel) +
        '</div>';
    }
    out += '<a class="nav-cta" href="' + url('vu-an.html') + '">Nhận vụ án <span>&rarr;</span></a>';
    return out;
  }

  function panelMarkup(cols) {
    var out =
      '<div class="drop-panel" hidden><span class="drop-clip" aria-hidden="true"></span>' +
      '<p class="drop-head">Hồ sơ truyện &middot; chọn tập</p><div class="drop-cols">';
    for (var i = 0; i < cols.length; i++) {
      var c = cols[i];
      out +=
        '<div class="drop-col"><a class="drop-col-head" href="' + url(c.href) + '">' +
        '<span class="drop-icon" aria-hidden="true">' + PANEL_ICON[c.icon] + '</span>' +
        '<span><b>' + c.title + '</b><i>' + c.note + '</i></span></a><ul class="drop-list">';
      for (var j = 0; j < c.links.length; j++) {
        var l = c.links[j];
        out +=
          '<li><a href="' + url(l.href) + '"><span class="dot ' + l.kind + '"></span>' +
          l.label + '<em>' + l.count + ' truyện</em></a></li>';
      }
      out += '</ul></div>';
    }
    return out + '</div></div>';
  }

  function headerMarkup(active) {
    return (
      '<a class="brand" href="' + url('index.html') + '" aria-label="Hội Quán Thám Tử - Trang chủ">' +
      '<span class="brand-mark" aria-hidden="true">' + BRAND_SVG + '</span>' +
      '<span><strong>HỘI QUÁN</strong><em>THÁM TỬ</em></span></a>' +
      '<a class="coin-wallet" href="' + url('truyen-ngan.html#vip') + '" title="Ví Xu Thám Tử (demo)">' +
      '<span class="coin-face" aria-hidden="true">Xu</span>' +
      '<b data-coin-value>' + readCoins() + '</b><i>Xu</i></a>' +
      '<button class="menu-toggle" type="button" aria-label="Mở menu" aria-expanded="false" aria-controls="hq-nav">' +
      '<span></span><span></span></button>' +
      '<nav class="main-nav" id="hq-nav" aria-label="Điều hướng chính">' + navMarkup(active) + '</nav>'
    );
  }

  function footerMarkup() {
    return (
      '<div class="foot-grid">' +
      '<div class="foot-brand"><a class="brand footer-brand" href="' + url('index.html') + '">' +
      '<span class="brand-mark">' + BRAND_SVG + '</span>' +
      '<span><strong>HỘI QUÁN</strong><em>THÁM TỬ</em></span></a>' +
      '<p>Nơi mọi chi tiết đều đáng ngờ. Gà và Hiraku đã mở hồ sơ từ 2013 và chưa đóng lại một ngày nào.</p>' +
      '<div class="foot-stamp">HỒ SƠ VẪN ĐANG MỞ</div></div>' +
      '<div><h4>Khám phá</h4><ul>' +
      '<li><a href="' + url('vu-an.html') + '">Vụ án</a></li>' +
      '<li><a href="' + url('cau-do.html') + '">Câu đố</a></li>' +
      '<li><a href="' + url('game.html') + '">Game</a></li>' +
      '<li><a href="' + url('blog-ga.html') + '">Blog của Gà</a></li></ul></div>' +
      '<div><h4>Tủ sách</h4><ul>' +
      '<li><a href="' + url('truyen-ngan.html#free') + '">Truyện ngắn miễn phí</a></li>' +
      '<li><a href="' + url('truyen-ngan.html#vip') + '">Truyện ngắn trả phí</a></li>' +
      '<li><a href="' + url('truyen-dai.html#free') + '">Truyện dài miễn phí</a></li>' +
      '<li><a href="' + url('truyen-dai.html#vip') + '">Truyện dài trả phí</a></li></ul></div>' +
      '<div><h4>Hội quán</h4><ul>' +
      '<li><a href="' + url('ve-chung-toi.html') + '">Về chúng tôi</a></li>' +
      '<li><a href="' + url('ve-chung-toi.html#doi-ngu') + '">Đội ngũ</a></li>' +
      '<li><a href="' + url('ve-chung-toi.html#faq') + '">Câu hỏi thường gặp</a></li>' +
      '<li><a href="' + url('ve-chung-toi.html#lien-he') + '">Liên hệ</a></li></ul></div></div>' +
      '<div class="foot-base"><span>&copy; 2026 HQTT</span></div>'
    );
  }

  /* ---------- Hành vi điều hướng ---------- */

  function wireNav(header) {
    var toggle = header.querySelector('.menu-toggle');
    var nav = header.querySelector('.main-nav');
    var drops = header.querySelectorAll('[data-drop]');
    var mq = window.matchMedia('(max-width: 980px)');

    function closeDrops(except) {
      for (var i = 0; i < drops.length; i++) {
        if (drops[i] === except) continue;
        drops[i].classList.remove('is-open');
        drops[i].querySelector('.nav-drop-btn').setAttribute('aria-expanded', 'false');
        drops[i].querySelector('.drop-panel').hidden = true;
      }
    }

    function setDrop(drop, open) {
      drop.classList.toggle('is-open', open);
      drop.querySelector('.nav-drop-btn').setAttribute('aria-expanded', String(open));
      drop.querySelector('.drop-panel').hidden = !open;
    }

    for (var i = 0; i < drops.length; i++) {
      (function (drop) {
        var closeTimer = null;
        var btn = drop.querySelector('.nav-drop-btn');
        btn.addEventListener('click', function () {
          /* Trên desktop con trỏ đã mở panel bằng hover, nên click chỉ giữ nó mở
             thay vì đóng ngay lại. Trên mobile không có hover nên click là công tắc. */
          clearTimeout(closeTimer);
          closeDrops(drop);
          setDrop(drop, mq.matches ? !drop.classList.contains('is-open') : true);
        });
        drop.addEventListener('mouseenter', function () {
          if (mq.matches) return;
          clearTimeout(closeTimer);
          closeDrops(drop);
          setDrop(drop, true);
        });
        drop.addEventListener('mouseleave', function () {
          if (mq.matches) return;
          /* Delay đóng 180 ms — đủ để di chuột từ nút vào panel mà không bị mất
             tooltip. Kết hợp với invisible bridge (::after) trong CSS. */
          closeTimer = setTimeout(function () {
            setDrop(drop, false);
          }, 180);
        });
        drop.addEventListener('focusout', function (e) {
          if (mq.matches) return;
          clearTimeout(closeTimer);
          if (!drop.contains(e.relatedTarget)) setDrop(drop, false);
        });
      })(drops[i]);
    }

    function closeMenu() {
      nav.classList.remove('open');
      document.body.classList.remove('nav-locked');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Mở menu');
      closeDrops(null);
    }

    toggle.addEventListener('click', function () {
      var open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      document.body.classList.toggle('nav-locked', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
      if (open) {
        var first = nav.querySelector('a, button');
        if (first) first.focus();
      } else {
        closeDrops(null);
      }
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeDrops(null);
      if (nav.classList.contains('open')) {
        closeMenu();
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) closeDrops(null);
    });

    /* Giữ focus trong drawer khi menu mở trên mobile. */
    nav.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !nav.classList.contains('open')) return;
      var items = nav.querySelectorAll('a, button');
      var list = [toggle];
      for (var i = 0; i < items.length; i++) {
        if (items[i].offsetParent !== null) list.push(items[i]);
      }
      var first = list[0];
      var last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    mq.addEventListener('change', function () {
      closeMenu();
    });
  }

  /* ---------- Bộ lọc danh sách ---------- */

  function wireFilters() {
    var bars = document.querySelectorAll('[data-filter-bar]');
    for (var i = 0; i < bars.length; i++) {
      (function (bar) {
        var key = bar.getAttribute('data-filter-bar');
        var scope = document.querySelector(bar.getAttribute('data-filter-target'));
        if (!scope) return;
        var empty = document.querySelector(bar.getAttribute('data-filter-empty') || '');
        var buttons = bar.querySelectorAll('[data-filter]');

        function apply(value) {
          var cards = scope.querySelectorAll('[data-' + key + ']');
          var shown = 0;
          for (var j = 0; j < cards.length; j++) {
            var match = value === 'all' || cards[j].getAttribute('data-' + key) === value;
            cards[j].classList.toggle('is-filtered-out', !match);
            if (match) shown++;
          }
          if (empty) empty.hidden = shown !== 0;
          var count = document.querySelector(bar.getAttribute('data-filter-count') || '');
          if (count) count.textContent = shown;
        }

        for (var k = 0; k < buttons.length; k++) {
          (function (btn) {
            btn.addEventListener('click', function () {
              var current = bar.querySelector('[data-filter].active');
              if (current) {
                current.classList.remove('active');
                current.setAttribute('aria-selected', 'false');
              }
              btn.classList.add('active');
              btn.setAttribute('aria-selected', 'true');
              apply(btn.getAttribute('data-filter'));
              if (bar.hasAttribute('data-filter-hash')) {
                var v = btn.getAttribute('data-filter');
                history.replaceState(null, '', v === 'all' ? location.pathname : '#' + v);
              }
            });
          })(buttons[k]);
        }

        /* Deep link: truyen-ngan.html#vip mở sẵn đúng tab. */
        var hash = location.hash.replace('#', '');
        var target = hash && bar.querySelector('[data-filter="' + hash + '"]');
        (target || bar.querySelector('[data-filter].active') || buttons[0]).click();
      })(bars[i]);
    }
  }

  /* ---------- Tìm kiếm trong trang ---------- */

  function wireSearch() {
    var inputs = document.querySelectorAll('[data-search]');
    for (var i = 0; i < inputs.length; i++) {
      (function (input) {
        var scope = document.querySelector(input.getAttribute('data-search'));
        if (!scope) return;
        var empty = document.querySelector(input.getAttribute('data-search-empty') || '');
        input.addEventListener('input', function () {
          var q = window.HQ.slug(input.value);
          var cards = scope.children;
          var shown = 0;
          for (var j = 0; j < cards.length; j++) {
            var hay = window.HQ.slug(cards[j].textContent);
            var match = !q || hay.indexOf(q) !== -1;
            cards[j].classList.toggle('is-searched-out', !match);
            if (match && !cards[j].classList.contains('is-filtered-out')) shown++;
          }
          if (empty) empty.hidden = shown !== 0;
        });
      })(inputs[i]);
    }
  }

  /* ---------- Hiện dần khi cuộn ---------- */

  function wireReveal() {
    var targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (var i = 0; i < targets.length; i++) targets[i].classList.add('is-revealed');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    for (var j = 0; j < targets.length; j++) io.observe(targets[j]);
  }

  /* ---------- Accordion dùng chung ---------- */

  function wireAccordion() {
    var heads = document.querySelectorAll('[data-accordion]');
    for (var i = 0; i < heads.length; i++) {
      (function (head) {
        var body = document.getElementById(head.getAttribute('aria-controls'));
        head.addEventListener('click', function () {
          var open = head.getAttribute('aria-expanded') !== 'true';
          head.setAttribute('aria-expanded', String(open));
          if (body) body.hidden = !open;
        });
      })(heads[i]);
    }
  }

  /* ---------- Tiến độ đọc ---------- */

  function wireProgress() {
    var bar = document.querySelector('[data-read-progress]');
    if (!bar) return;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, h.scrollTop / max) : 0) + ')';
    }
    document.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------- API công khai ---------- */

  window.HQ = {
    base: BASE,
    url: url,
    coins: readCoins,
    setCoins: writeCoins,
    paintCoins: paintCoins,
    slug: function (s) {
      return String(s)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/gi, 'd')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
    },
    header: function (active) {
      var el = document.querySelector('[data-hq-header]');
      if (!el) return;
      el.innerHTML = headerMarkup(active);
      wireNav(el);
    },
    footer: function () {
      var el = document.querySelector('[data-hq-footer]');
      if (!el) return;
      el.innerHTML = footerMarkup();
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    wireFilters();
    wireSearch();
    wireReveal();
    wireAccordion();
    wireProgress();
    paintCoins(readCoins());
  });
})();
