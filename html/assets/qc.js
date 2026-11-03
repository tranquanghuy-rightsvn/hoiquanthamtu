/* Popup quảng cáo ủng hộ HQTT (link tiếp thị Shopee, ảnh mô hình Gundam).
   window.hqQC.show(text) để mở từ game; text là dòng năn nỉ, bỏ trống thì dùng câu mặc định.
   Tự gắn sẵn:
   - Trang đọc truyện (/truyen/...): hiện sau 30 giây người đọc ở lại trang (chỉ đếm lúc tab đang mở).
   Khối Donate trên trang chủ không dùng popup: ảnh + nút mua hàng viết thẳng trong index.html với data-qc-go. */
(function () {
  'use strict';

  var LINK = 'https://s.shopee.vn/1W0TPIfdNj';
  var IMG = '/assets/qc/gundam.webp';
  var DEFAULT_TEXT = 'Click để ủng hộ đội ngũ HQTT';
  var box = null;
  var lastFocus = null;

  function build() {
    box = document.createElement('div');
    box.className = 'qc-overlay';
    box.hidden = true;
    box.innerHTML =
      '<div class="qc-card" role="dialog" aria-modal="true" aria-labelledby="qc-title">' +
        '<button type="button" class="qc-close" data-qc-close aria-label="Đóng quảng cáo">&times;</button>' +
        '<p class="qc-tag">Quảng cáo</p>' +
        '<button type="button" class="qc-media" data-qc-go aria-label="Xem mô hình Gundam trên Shopee">' +
          '<img src="' + IMG + '" width="600" height="600" alt="Mô hình Gundam HG Strike Freedom" loading="lazy">' +
        '</button>' +
        '<p class="qc-plea" id="qc-title"></p>' +
        '<p class="qc-sub">Mỗi lượt bấm giúp Gà và Hiraku có thêm thời gian viết vụ án mới. Cảm ơn bạn rất nhiều!</p>' +
        '<button type="button" class="qc-btn" data-qc-go>Xem mô hình Gundam <span>&rarr;</span></button>' +
        '<button type="button" class="qc-skip" data-qc-close>Để lần sau</button>' +
      '</div>';
    document.body.appendChild(box);

    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.closest('[data-qc-close]')) return hide();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box && !box.hidden) hide();
    });
  }

  function show(text, from) {
    if (!document.body) return;
    if (!box) build();
    if (!box.hidden) return;
    box.querySelector('.qc-plea').textContent = text || DEFAULT_TEXT;
    box.dataset.from = from || '';
    lastFocus = document.activeElement;
    box.hidden = false;
    document.documentElement.classList.add('qc-open');
    box.querySelector('.qc-close').focus();
    if (typeof window.gtag === 'function') window.gtag('event', 'qc_show', { qc_from: from || '' });
  }

  function hide() {
    if (!box || box.hidden) return;
    box.hidden = true;
    document.documentElement.classList.remove('qc-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* Chuyển sang Shopee bằng JS (không dùng thẻ <a>), mở tab mới. */
  function go(from) {
    if (typeof window.gtag === 'function') window.gtag('event', 'qc_click', { qc_from: from || '' });
    var w = window.open(LINK, '_blank');
    if (w) w.opener = null;
    else location.href = LINK;
  }

  /* Mọi phần tử có data-qc-go (trong popup hoặc viết sẵn trong trang) đều chuyển sang Shopee khi bấm. */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-qc-go]');
    if (!t) return;
    var inPopup = box && box.contains(t);
    go(inPopup ? box.dataset.from : t.getAttribute('data-qc-go'));
    if (inPopup) window.setTimeout(hide, 300);
  });

  window.hqQC = { show: show, hide: hide, go: go };

  function init() {
    var path = location.pathname;

    /* Đọc truyện: đủ 30 giây người đọc thật sự ở trên trang thì hiện một lần. */
    if (/^\/truyen\/[^/]+/.test(path)) {
      var seconds = 0;
      var timer = window.setInterval(function () {
        if (document.hidden) return;
        if (++seconds >= 30) {
          window.clearInterval(timer);
          show('Click để ủng hộ đội ngũ HQTT', 'doc-truyen');
        }
      }, 1000);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
