/* Popup đăng nhập / đăng ký / gửi truyện — bản demo, không gửi dữ liệu đi đâu. */
(function () {
  'use strict';

  /* data-auth-open="x" mở <dialog id="auth-x">: login, signup, story (gửi truyện). */
  function open(name) {
    var modal = document.getElementById('auth-' + name);
    if (!modal) return;
    var opened = document.querySelectorAll('dialog.auth-modal[open]');
    for (var i = 0; i < opened.length; i++) opened[i].close();
    modal.showModal();
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-auth-open]');
    if (opener) {
      open(opener.getAttribute('data-auth-open'));
      return;
    }
    if (e.target.closest('[data-auth-close]')) {
      e.target.closest('dialog').close();
      return;
    }
    /* Bấm ra vùng nền tối (chính thẻ dialog, ngoài khung nội dung) thì đóng. */
    if (e.target.tagName === 'DIALOG' && e.target.classList.contains('auth-modal')) {
      var r = e.target.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) e.target.close();
    }
  });

  var forms = document.querySelectorAll('[data-auth-form]');
  for (var i = 0; i < forms.length; i++) {
    (function (form) {
      var note = form.querySelector('[data-auth-note]');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var match = form.querySelector('[data-match]');
        if (match) {
          var other = document.getElementById(match.getAttribute('data-match'));
          match.setCustomValidity(other && other.value !== match.value ? 'Mật khẩu không khớp' : '');
        }
        note.className = 'form-ok show';
        if (!form.checkValidity()) {
          note.style.background = '#f8e6e3';
          note.style.color = '#b54338';
          note.textContent = form.getAttribute('data-err');
          return;
        }
        note.removeAttribute('style');
        note.textContent = form.getAttribute('data-ok');
        form.reset();
      });
    })(forms[i]);
  }
})();
