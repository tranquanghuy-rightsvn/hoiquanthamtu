/* Biểu mẫu liên hệ — bản demo, không gửi dữ liệu đi đâu. */
(function () {
  'use strict';
  var form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var note = document.getElementById('contactOk');
    if (!form.checkValidity()) {
      note.className = 'form-ok show';
      note.style.background = '#f8e6e3';
      note.style.color = '#b54338';
      note.textContent = 'Hãy điền đủ tên, email và nội dung vụ việc trước khi gửi.';
      return;
    }
    note.className = 'form-ok show';
    note.removeAttribute('style');
    note.textContent = 'Đã nhận. Trên bản thật, hồ sơ của bạn sẽ vào hàng đợi biên tập trong vòng bảy ngày.';
    form.reset();
  });
})();
