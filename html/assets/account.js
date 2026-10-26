/* Trang cá nhân /tai-khoan/: hiện hồ sơ, đổi tên, ảnh đại diện, mật khẩu. Dùng HQAuth từ auth.js. */
(function () {
  'use strict';

  var page = document.querySelector('[data-account-page]');
  if (!page || !window.HQAuth) return;

  var $ = function (sel) { return page.querySelector(sel); };
  var els = {
    loading: $('[data-account-loading]'),
    guest: $('[data-account-guest]'),
    wrap: $('[data-account]'),
    avatar: $('[data-account-avatar]'),
    name: $('[data-account-name]'),
    email: $('[data-account-email]'),
    joined: $('[data-account-joined]'),
    file: $('[data-account-file]'),
    remove: $('[data-account-remove]'),
    photoNote: $('[data-account-photo-note]'),
    emailInput: $('[data-account-email-input]')
  };
  var profileForm = $('[data-account-form="profile"]');
  var passwordForm = $('[data-account-form="password"]');

  function date(ms) {
    var d = new Date(ms);
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function render(user) {
    els.loading.hidden = true;
    els.guest.hidden = !!user;
    els.wrap.hidden = !user;
    if (!user) return;
    HQAuth.avatar(els.avatar, user);
    els.name.textContent = user.name;
    els.email.textContent = user.email;
    els.joined.textContent = date(user.createdAt);
    els.remove.hidden = !user.avatar;
    els.emailInput.value = user.email;
    if (document.activeElement !== profileForm.elements.name) profileForm.elements.name.value = user.name;
  }

  function note(form, text, isError) {
    var el = form.querySelector('[data-account-note]');
    el.className = 'form-ok show';
    if (isError) {
      el.style.background = '#f8e6e3';
      el.style.color = '#b54338';
    } else {
      el.removeAttribute('style');
    }
    el.textContent = text;
  }

  /* ---------- Thông tin cá nhân ---------- */

  profileForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!profileForm.checkValidity()) {
      note(profileForm, 'Tên hiển thị cần từ 2 đến 40 ký tự.', true);
      return;
    }
    var btn = profileForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    HQAuth.api('/api/profile', { method: 'POST', json: { name: profileForm.elements.name.value } }).then(function (res) {
      btn.disabled = false;
      if (!res.ok) return note(profileForm, res.data.error || 'Chưa lưu được, bạn thử lại nhé.', true);
      HQAuth.set(res.data.user);
      note(profileForm, 'Đã lưu tên hiển thị.');
    });
  });

  /* ---------- Mật khẩu ---------- */

  passwordForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = passwordForm.elements;
    f.next2.setCustomValidity(f.next.value !== f.next2.value ? 'Mật khẩu không khớp' : '');
    if (!passwordForm.checkValidity()) {
      note(passwordForm, 'Mật khẩu mới cần tối thiểu 8 ký tự và nhập lại cho khớp.', true);
      return;
    }
    var btn = passwordForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    HQAuth.api('/api/password', { method: 'POST', json: { current: f.current.value, next: f.next.value } }).then(function (res) {
      btn.disabled = false;
      if (!res.ok) return note(passwordForm, res.data.error || 'Chưa đổi được, bạn thử lại nhé.', true);
      passwordForm.reset();
      note(passwordForm, 'Đã đổi mật khẩu. Các thiết bị khác sẽ phải đăng nhập lại.');
    });
  });

  /* ---------- Ảnh đại diện ---------- */

  function photoNote(text, isError) {
    els.photoNote.textContent = text;
    els.photoNote.style.color = isError ? '#b54338' : '';
  }

  /* Cắt giữa thành hình vuông 256px rồi nén, để ảnh gửi lên luôn nhẹ. */
  function squareImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var size = Math.min(img.naturalWidth, img.naturalHeight);
        var canvas = document.createElement('canvas');
        canvas.width = canvas.height = 256;
        canvas.getContext('2d').drawImage(img,
          (img.naturalWidth - size) / 2, (img.naturalHeight - size) / 2, size, size, 0, 0, 256, 256);
        URL.revokeObjectURL(url);
        canvas.toBlob(function (blob) {
          if (blob && blob.type === 'image/webp') return resolve(blob);
          canvas.toBlob(function (jpg) { jpg ? resolve(jpg) : reject(); }, 'image/jpeg', 0.88);
        }, 'image/webp', 0.88);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject();
      };
      img.src = url;
    });
  }

  els.file.addEventListener('change', function () {
    var file = els.file.files[0];
    els.file.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) return photoNote('Hãy chọn một tấm ảnh.', true);
    photoNote('Đang tải ảnh lên…');
    squareImage(file).then(function (blob) {
      return HQAuth.api('/api/avatar', { method: 'POST', body: blob, type: blob.type });
    }).then(function (res) {
      if (!res.ok) return photoNote(res.data.error || 'Chưa tải được ảnh, bạn thử lại nhé.', true);
      HQAuth.set(res.data.user);
      photoNote('Đã đổi ảnh đại diện.');
    }, function () {
      photoNote('Không đọc được ảnh này, bạn thử ảnh khác nhé.', true);
    });
  });

  els.remove.addEventListener('click', function () {
    photoNote('Đang xoá ảnh…');
    HQAuth.api('/api/avatar/delete', { method: 'POST' }).then(function (res) {
      if (!res.ok) return photoNote(res.data.error || 'Chưa xoá được ảnh.', true);
      HQAuth.set(res.data.user);
      photoNote('Đã xoá ảnh đại diện.');
    });
  });

  HQAuth.onChange(render);
})();
