/* Thanh công cụ đọc: cỡ chữ và nền. Lựa chọn được nhớ trên trình duyệt. */
(function () {
  'use strict';

  var KEY = 'hqtt.reader';

  function load() {
    try {
      return JSON.parse(window.localStorage.getItem(KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function save(prefs) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch (e) {
      /* chế độ riêng tư: tuỳ chọn chỉ sống trong phiên này */
    }
  }

  function apply(prefs) {
    var body = document.body;
    body.classList.remove('font-sm', 'font-lg', 'theme-sepia', 'theme-night');
    if (prefs.font === 'sm') body.classList.add('font-sm');
    if (prefs.font === 'lg') body.classList.add('font-lg');
    if (prefs.theme === 'sepia') body.classList.add('theme-sepia');
    if (prefs.theme === 'night') body.classList.add('theme-night');
    mark('font', prefs.font || 'md');
    mark('theme', prefs.theme || 'light');
  }

  function mark(group, value) {
    var btns = document.querySelectorAll('[data-reader-' + group + ']');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-reader-' + group) === value);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('.reader-bar')) return;
    var prefs = load();
    apply(prefs);

    ['font', 'theme'].forEach(function (group) {
      var btns = document.querySelectorAll('[data-reader-' + group + ']');
      for (var i = 0; i < btns.length; i++) {
        btns[i].addEventListener('click', function () {
          prefs[group] = this.getAttribute('data-reader-' + group);
          save(prefs);
          apply(prefs);
        });
      }
    });
  });
})();
