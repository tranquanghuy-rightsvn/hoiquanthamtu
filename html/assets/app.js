/* Tương tác riêng của trang chủ. Điều hướng đã chuyển sang site.js. */
(function () {
  'use strict';

  /* Số liệu hero đếm tăng dần khi lọt vào màn hình; HTML đã có sẵn số cuối. */
  var counters = document.querySelectorAll('[data-count]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function format(n) {
    return n.toLocaleString('vi-VN');
  }
  function run(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1600;
    var start = null;
    function step(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = format(0) + suffix;
    requestAnimationFrame(step);
  }
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        seen.unobserve(entries[i].target);
        run(entries[i].target);
      }
    }, { threshold: 0.6 });
    for (var i = 0; i < counters.length; i++) seen.observe(counters[i]);
  }
})();
