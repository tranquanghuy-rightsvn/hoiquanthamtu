/* Hội Quán Thám Tử — layout dùng chung, điều hướng, bộ lọc. */
(function () {
  'use strict';

  var COIN_KEY = 'hqtt.coins';
  var DEFAULT_COINS = 120;

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
      if (e.target.closest('a, [data-auth-open]')) closeMenu();
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

        /* Deep link: /truyen-ngan/#vip mở sẵn đúng tab. */
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
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var header = document.querySelector('[data-hq-header]');
    if (header) wireNav(header);
    wireFilters();
    wireSearch();
    wireReveal();
    wireAccordion();
    wireProgress();
    paintCoins(readCoins());
  });
})();
