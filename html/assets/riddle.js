/* Chấm đáp án câu đố và mở gợi ý theo từng cấp. */
(function () {
  'use strict';

  function norm(s) {
    return String(s)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/gi, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.querySelector('[data-answer]');
    if (form) {
      var accepted = form.getAttribute('data-answer').split('|').map(norm);
      var verdict = form.parentNode.querySelector('.verdict');
      var tries = 0;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var given = norm(form.querySelector('input').value);
        if (!given) return;
        tries++;
        var hit = accepted.some(function (a) {
          return given === a || given.indexOf(a) !== -1 || a.indexOf(given) !== -1;
        });
        verdict.className = 'verdict show ' + (hit ? 'ok' : 'no');
        verdict.textContent = hit
          ? 'Chính xác. Bạn nhìn ra đúng chi tiết mà cả ba nhân chứng đều bỏ qua.'
          : tries < 3
            ? 'Chưa đúng. Đọc lại đề bài một lần nữa — dữ kiện bạn cần đã nằm sẵn ở đó.'
            : 'Vẫn chưa đúng. Thử mở một gợi ý bên dưới xem sao.';
      });
    }

    var hintBtn = document.getElementById('hintBtn');
    if (hintBtn) {
      var hints = document.querySelectorAll('.hint');
      var shown = 0;
      hintBtn.addEventListener('click', function () {
        if (shown >= hints.length) return;
        hints[shown].classList.add('show');
        shown++;
        hintBtn.textContent = shown >= hints.length
          ? 'Đã mở hết gợi ý'
          : 'Mở gợi ý ' + (shown + 1) + ' / ' + hints.length;
        hintBtn.disabled = shown >= hints.length;
      });
    }
  });
})();
