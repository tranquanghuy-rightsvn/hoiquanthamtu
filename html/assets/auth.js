/* Đăng nhập / đăng ký qua /api (Cloudflare Worker), popup gửi truyện vẫn là bản demo.
   Header luôn có sẵn cả nút khách lẫn nút tài khoản; file này chỉ bật/tắt theo trạng thái đăng nhập. */
(function () {
  'use strict';

  var listeners = [];
  var state = { user: null, ready: false };

  /* ---------- Popup ---------- */

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
    if (e.target.closest('[data-auth-logout]')) {
      e.preventDefault();
      logout();
      return;
    }
    /* Bấm ra vùng nền tối (chính thẻ dialog, ngoài khung nội dung) thì đóng. */
    if (e.target.tagName === 'DIALOG' && e.target.classList.contains('auth-modal')) {
      var r = e.target.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) e.target.close();
    }
  });

  /* ---------- Gọi API ---------- */

  function api(path, options) {
    options = options || {};
    var init = { method: options.method || 'GET', credentials: 'same-origin', headers: {} };
    if (options.json) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.json);
    } else if (options.body) {
      init.headers['Content-Type'] = options.type;
      init.body = options.body;
    }
    return fetch(path, init).then(function (res) {
      var isJson = (res.headers.get('Content-Type') || '').indexOf('application/json') === 0;
      return (isJson ? res.json() : Promise.resolve({})).then(function (data) {
        if (!isJson && res.status === 404) {
          data = { error: 'Tính năng tài khoản chỉ hoạt động trên hoiquanthamtu.com.' };
        }
        return { ok: res.ok, status: res.status, data: data };
      });
    }, function () {
      return { ok: false, status: 0, data: { error: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại nhé.' } };
    });
  }

  /* ---------- Trạng thái đăng nhập ---------- */

  function setUser(user) {
    state.user = user || null;
    state.ready = true;
    paint();
    for (var i = 0; i < listeners.length; i++) listeners[i](state.user);
  }

  function paint() {
    var user = state.user;
    var guests = document.querySelectorAll('[data-auth-guest]');
    for (var i = 0; i < guests.length; i++) guests[i].hidden = !!user;
    var links = document.querySelectorAll('[data-auth-user]');
    for (var j = 0; j < links.length; j++) links[j].hidden = !user;
    if (!user) return;
    var names = document.querySelectorAll('[data-auth-name]');
    for (var k = 0; k < names.length; k++) names[k].textContent = user.name;
    var avatars = document.querySelectorAll('[data-auth-avatar]');
    for (var m = 0; m < avatars.length; m++) avatar(avatars[m], user);
  }

  /* Ảnh đại diện; chưa có ảnh thì hiện chữ cái đầu của tên. */
  function avatar(el, user) {
    el.textContent = '';
    if (user.avatar) {
      var img = document.createElement('img');
      img.src = user.avatar;
      img.alt = '';
      el.appendChild(img);
    } else {
      el.textContent = (user.name || '?').trim().charAt(0).toUpperCase();
    }
  }

  function refresh() {
    return api('/api/me').then(function (res) {
      setUser(res.ok ? res.data.user : null);
      return state.user;
    });
  }

  function logout() {
    return api('/api/logout', { method: 'POST' }).then(function () {
      setUser(null);
      if (location.pathname.indexOf('/tai-khoan/') === 0) location.href = '/';
    });
  }

  /* ---------- Form ---------- */

  function showNote(note, text, isError) {
    note.className = 'form-ok show';
    if (isError) {
      note.style.background = '#f8e6e3';
      note.style.color = '#b54338';
    } else {
      note.removeAttribute('style');
    }
    note.textContent = text;
  }

  function checkMatch(form) {
    var match = form.querySelector('[data-match]');
    if (!match) return;
    var other = document.getElementById(match.getAttribute('data-match'));
    match.setCustomValidity(other && other.value !== match.value ? 'Mật khẩu không khớp' : '');
  }

  var forms = document.querySelectorAll('[data-auth-form]');
  for (var i = 0; i < forms.length; i++) {
    (function (form) {
      var kind = form.getAttribute('data-auth-form');
      var note = form.querySelector('[data-auth-note]');
      var submit = form.querySelector('button[type="submit"]');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        checkMatch(form);
        if (!form.checkValidity()) {
          showNote(note, form.getAttribute('data-err'), true);
          return;
        }
        if (kind === 'demo') {
          showNote(note, form.getAttribute('data-ok'));
          form.reset();
          return;
        }
        var payload = { email: form.elements.email.value, password: form.elements.password.value };
        if (kind === 'signup') payload.name = form.elements.name.value;
        submit.disabled = true;
        api('/api/' + (kind === 'signup' ? 'register' : 'login'), { method: 'POST', json: payload }).then(function (res) {
          submit.disabled = false;
          if (!res.ok) {
            showNote(note, res.data.error || 'Có lỗi xảy ra, bạn thử lại nhé.', true);
            return;
          }
          showNote(note, kind === 'signup' ? 'Đăng ký thành công. Chào mừng bạn gia nhập Hội Quán Thám Tử!' : 'Đăng nhập thành công.');
          form.reset();
          setUser(res.data.user);
          setTimeout(function () {
            var dialog = form.closest('dialog');
            if (dialog && dialog.open) dialog.close();
            note.className = 'form-ok';
          }, 900);
        });
      });
    })(forms[i]);
  }

  window.HQAuth = {
    api: api,
    refresh: refresh,
    logout: logout,
    avatar: avatar,
    get user() { return state.user; },
    get ready() { return state.ready; },
    onChange: function (fn) {
      listeners.push(fn);
      if (state.ready) fn(state.user);
    },
    set: setUser
  };

  refresh();
})();
