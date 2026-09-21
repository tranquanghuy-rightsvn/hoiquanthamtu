/* Tương tác riêng của trang chủ. Điều hướng đã chuyển sang site.js. */
(function () {
  'use strict';

  var tabs = document.querySelectorAll('.case-switch button');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () {
      var current = document.querySelector('.case-switch .active');
      if (current) current.classList.remove('active');
      this.classList.add('active');
      var want = this.getAttribute('data-level') || 'all';
      var cards = document.querySelectorAll('.case-grid .case-card');
      for (var j = 0; j < cards.length; j++) {
        var level = cards[j].getAttribute('data-level');
        cards[j].classList.toggle('is-filtered-out', want !== 'all' && level !== want);
      }
    });
  }

  var reveal = document.getElementById('revealBtn');
  if (reveal) {
    reveal.addEventListener('click', function () {
      document.getElementById('clue').classList.add('show');
      reveal.textContent = 'Manh mối đã được mở';
      reveal.disabled = true;
    });
  }

  var joinForm = document.getElementById('joinForm');
  if (joinForm) {
    joinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = document.getElementById('joinOk');
      note.textContent = 'Đã ghi tên vào sổ hội quán. Hồ sơ đầu tiên sẽ tới hộp thư của bạn.';
      note.classList.add('show');
      joinForm.querySelector('input').value = '';
    });
  }
})();
