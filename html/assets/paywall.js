/* Ví Xu và cổng nội dung trả phí. Hoàn toàn giả lập, không có giao dịch thật. */
(function () {
  'use strict';

  var UNLOCK_KEY = 'hqtt.unlocked';

  function readUnlocked() {
    try {
      return JSON.parse(window.localStorage.getItem(UNLOCK_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function markUnlocked(id) {
    var list = readUnlocked();
    if (list.indexOf(id) === -1) list.push(id);
    try {
      window.localStorage.setItem(UNLOCK_KEY, JSON.stringify(list));
    } catch (e) {
      /* chế độ riêng tư: mở khoá chỉ sống trong phiên này */
    }
  }

  function isUnlocked(id) {
    return readUnlocked().indexOf(id) !== -1;
  }

  /* ---------- Modal ---------- */

  var modal = null;
  var lastFocus = null;

  function buildModal() {
    var el = document.createElement('div');
    el.className = 'hq-modal';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'hq-modal-title');
    el.innerHTML =
      '<div class="sheet">' +
      '<span class="stamp-demo">BẢN<br>DEMO</span>' +
      '<h3 id="hq-modal-title"></h3>' +
      '<p data-modal-text></p>' +
      '<div class="price-row"><span data-modal-label></span><b data-modal-price></b></div>' +
      '<div class="actions">' +
      '<button type="button" class="cancel">Để sau</button>' +
      '<button type="button" class="go"></button>' +
      '</div></div>';
    document.body.appendChild(el);

    el.addEventListener('click', function (e) {
      if (e.target === el || e.target.classList.contains('cancel')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !el.hidden) close();
    });
    return el;
  }

  function open(config) {
    if (!modal) modal = buildModal();
    lastFocus = document.activeElement;
    modal.querySelector('#hq-modal-title').textContent = config.title;
    modal.querySelector('[data-modal-text]').textContent = config.text;
    modal.querySelector('[data-modal-label]').textContent = config.label;
    modal.querySelector('[data-modal-price]').textContent = config.price;
    var go = modal.querySelector('.go');
    go.textContent = config.cta;
    go.onclick = function () {
      close();
      config.onConfirm();
    };
    modal.hidden = false;
    go.focus();
  }

  function close() {
    if (!modal) return;
    modal.hidden = true;
    if (lastFocus) lastFocus.focus();
  }

  /* ---------- Cổng nội dung ---------- */

  function unlock(gate, id) {
    markUnlocked(id);
    gate.classList.add('is-unlocked');
    var banner = document.createElement('div');
    banner.className = 'verdict ok show';
    banner.setAttribute('role', 'status');
    banner.textContent = 'Đã mở khoá. Chúc bạn đọc vui — và đừng bỏ sót chi tiết nào.';
    gate.insertBefore(banner, gate.firstChild);
    window.setTimeout(function () {
      banner.remove();
    }, 6000);
    syncChapterList(id);
  }

  /* Mục lục chương cùng trang cũng bỏ ổ khoá theo. */
  function syncChapterList(id) {
    var rows = document.querySelectorAll('.chapter-list li[data-gate="' + id + '"]');
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.remove('locked');
      var badge = rows[i].querySelector('.badge-vip');
      if (badge) badge.outerHTML = '<span class="badge-free">Đã mở</span>';
    }
  }

  function wireGate(gate) {
    var id = gate.getAttribute('data-gate');
    var coinPrice = parseInt(gate.getAttribute('data-price-coins') || '50', 10);
    var cashPrice = gate.getAttribute('data-price-cash') || '15.000đ';

    if (isUnlocked(id)) {
      gate.classList.add('is-unlocked');
      syncChapterList(id);
      return;
    }

    var coinBtn = gate.querySelector('.buy-btn.coins');
    var cashBtn = gate.querySelector('.buy-btn.cash');

    if (coinBtn) {
      coinBtn.addEventListener('click', function () {
        var have = window.HQ.coins();
        if (have < coinPrice) {
          open({
            title: 'Ví chưa đủ Xu',
            text: 'Bạn đang có ' + have + ' Xu, cần ' + coinPrice +
                  ' Xu cho chương này. Nhận thêm 200 Xu demo để đọc tiếp?',
            label: 'Nạp Xu demo',
            price: '+200 Xu',
            cta: 'Nhận Xu',
            onConfirm: function () {
              window.HQ.setCoins(have + 200);
            }
          });
          return;
        }
        open({
          title: 'Mở khoá bằng Xu',
          text: 'Trừ Xu trong ví Thám Tử của bạn để mở khoá vĩnh viễn nội dung này trên trình duyệt hiện tại.',
          label: 'Ví sau khi trừ',
          price: have - coinPrice + ' Xu',
          cta: 'Dùng ' + coinPrice + ' Xu',
          onConfirm: function () {
            window.HQ.setCoins(have - coinPrice);
            unlock(gate, id);
          }
        });
      });
    }

    if (cashBtn) {
      cashBtn.addEventListener('click', function () {
        open({
          title: 'Thanh toán demo',
          text: 'Đây là bản demo nên không có cổng thanh toán thật và không thu bất kỳ khoản nào. ' +
                'Bấm xác nhận để xem trải nghiệm sau khi mua.',
          label: 'Mở khoá lẻ',
          price: cashPrice,
          cta: 'Xác nhận (demo)',
          onConfirm: function () {
            unlock(gate, id);
          }
        });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var gates = document.querySelectorAll('[data-gate]');
    for (var i = 0; i < gates.length; i++) {
      if (gates[i].classList.contains('story-gate')) wireGate(gates[i]);
    }
    /* Mục lục của truyện dài: bỏ khoá những chương đã mua. */
    var rows = document.querySelectorAll('.chapter-list li[data-gate]');
    for (var j = 0; j < rows.length; j++) {
      if (isUnlocked(rows[j].getAttribute('data-gate'))) {
        syncChapterList(rows[j].getAttribute('data-gate'));
      }
    }
  });
})();
