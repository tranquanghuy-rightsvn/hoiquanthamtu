/* Nút chia sẻ ở cuối các game: chia sẻ lên Facebook và copy link trang hiện tại. */
(function () {
  'use strict';

  var url = location.href.split('#')[0];

  var fb = document.querySelectorAll('[data-share-fb]');
  for (var i = 0; i < fb.length; i++) {
    fb[i].href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  function copied(btn, ok) {
    var label = btn.querySelector('span');
    if (!btn.dataset.label) btn.dataset.label = label.textContent;
    label.textContent = ok ? 'Đã copy link!' : 'Không copy được';
    btn.classList.toggle('is-done', ok);
    clearTimeout(btn.copyTimer);
    btn.copyTimer = setTimeout(function () {
      label.textContent = btn.dataset.label;
      btn.classList.remove('is-done');
    }, 2000);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy-link]');
    if (!btn) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () { copied(btn, true); }, function () { copied(btn, fallbackCopy(url)); });
    } else {
      copied(btn, fallbackCopy(url));
    }
  });
})();
