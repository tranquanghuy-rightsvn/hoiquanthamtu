/* Khung ảnh sản phẩm: trượt, nút trước/sau, ảnh nhỏ, phím mũi tên. */
(function () {
  'use strict';

  var gallery = document.querySelector('[data-gallery]');
  if (!gallery) return;

  var track = gallery.querySelector('.sp-track');
  var slides = track.children;
  var thumbs = gallery.querySelectorAll('.sp-thumb');
  var count = gallery.querySelector('.sp-count');
  var current = 0;

  function go(i) {
    i = (i + slides.length) % slides.length;
    track.scrollTo({ left: slides[i].offsetLeft, behavior: 'smooth' });
  }

  function mark(i) {
    current = i;
    count.textContent = (i + 1) + ' / ' + slides.length;
    for (var k = 0; k < thumbs.length; k++) thumbs[k].classList.toggle('is-active', k === i);
  }

  track.addEventListener('scroll', function () {
    var i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== current) mark(i);
  }, { passive: true });

  gallery.querySelector('.sp-prev').addEventListener('click', function () { go(current - 1); });
  gallery.querySelector('.sp-next').addEventListener('click', function () { go(current + 1); });

  for (var k = 0; k < thumbs.length; k++) {
    thumbs[k].addEventListener('click', go.bind(null, k));
  }

  gallery.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') go(current - 1);
    if (e.key === 'ArrowRight') go(current + 1);
  });
})();

/* Nút "Mua hàng": link đặt hàng nằm trong JS, không viết vào HTML. */
(function () {
  'use strict';

  var LINKS = {
    deception: 'https://shopee.vn/-Ti%E1%BA%BFng-Vi%E1%BB%87t-Boardgame-Deception-%C3%81n-M%E1%BA%A1ng-%E1%BB%9E-Hong-Kong-Tr%C3%B2-Ch%C6%A1i-Trinh-Th%C3%A1m-%E1%BA%A8n-Vai-Suy-Lu%E1%BA%ADn-C%E1%BB%B1c-Cu%E1%BB%91n-i.225627854.43430096496'
  };

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-buy]');
    if (!btn) return;
    var url = LINKS[btn.getAttribute('data-buy')];
    if (!url) return;
    var win = window.open(url, '_blank');
    if (win) win.opener = null;
    else location.href = url;
  });
})();
