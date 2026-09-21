/* Engine giả lập cho khu Game. Gameplay theo kịch bản dựng sẵn;
   đồng hồ, tiến độ và điểm số chạy thật. */
(function () {
  'use strict';

  var BEST_KEY = 'hqtt.best';

  /* ---------- Hình minh hoạ dùng chung ---------- */

  var ART = {
    room: '<svg viewBox="0 0 120 90"><path d="M8 82V24l52-16 52 16v58"/><path d="M8 82h104"/><rect x="44" y="50" width="32" height="32"/><circle cx="70" cy="66" r="2.5"/><path d="M24 36h18v16H24zM78 36h18v16H78z"/></svg>',
    clock: '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="46"/><path d="M60 30v32l22 13"/><path d="M60 8v8M60 104v8M8 60h8M104 60h8"/></svg>',
    letter: '<svg viewBox="0 0 120 90"><rect x="10" y="16" width="100" height="62" rx="3"/><path d="m10 22 50 34 50-34"/><path d="M34 70h22"/></svg>',
    glass: '<svg viewBox="0 0 120 120"><circle cx="50" cy="50" r="34"/><path d="m75 75 36 36"/><path d="M36 48a14 14 0 0 1 14-14"/></svg>',
    print: '<svg viewBox="0 0 90 120"><path d="M45 10c-22 0-36 17-36 40 0 22 14 36 19 54M45 23c-14 0-23 11-23 27 0 21 13 32 17 48M46 36c-7 0-11 6-11 15 0 17 9 24 12 42M59 15c14 6 21 19 20 36-1 21-14 34-17 51M59 32c7 5 10 12 9 21-1 16-11 22-13 36"/></svg>',
    car: '<svg viewBox="0 0 140 90"><path d="M16 62h108l-10-28H26Z"/><path d="M44 34 56 16h28l14 18"/><circle cx="40" cy="66" r="10"/><circle cx="102" cy="66" r="10"/><path d="M70 17v45M26 35h88"/></svg>',
    key: '<svg viewBox="0 0 130 60"><circle cx="30" cy="30" r="20"/><circle cx="30" cy="30" r="7"/><path d="M50 30h66M90 30v14M104 30v10"/></svg>',
    cam: '<svg viewBox="0 0 130 90"><rect x="10" y="24" width="76" height="48" rx="5"/><path d="m86 40 30-14v38l-30-14z"/><circle cx="40" cy="48" r="12"/></svg>'
  };

  /* ---------- Kịch bản ---------- */

  var GAMES = {
    'truy-tim-thu-pham': {
      title: 'TRUY TÌM THỦ PHẠM',
      time: 300,
      steps: [
        {
          art: 'room', label: 'HIỆN TRƯỜNG 01 · CĂN HỘ TẦNG 7',
          lines: [
            { who: 'Hiraku', text: 'Cửa khoá từ bên trong. Ba người có mặt trong toà nhà tối qua: bà quản lý, anh sửa ống nước, và cô cháu gái. Không ai rời khỏi sảnh sau 22 giờ.' },
            { who: 'Gà', cls: 'ga', text: 'Vậy là thủ phạm vẫn còn ở đây. Mình bắt đầu từ đâu đây anh?' }
          ],
          choices: [
            { label: 'Xem xét ổ khoá cửa chính', score: 120, reply: { who: 'Hiraku', text: 'Ổ khoá không có vết cạy. Nhưng chốt an toàn bị dầu bôi trơn — mùi dầu máy còn rất mới.', found: true } },
            { label: 'Hỏi bà quản lý trước', score: 80, reply: { who: 'Hiraku', text: 'Bà ấy kể lại rành mạch từng phút. Rành mạch đến mức như đã học thuộc.' } },
            { label: 'Kiểm tra cửa sổ ban công', score: 60, reply: { who: 'Gà', cls: 'ga', text: 'Bụi trên bệ cửa sổ còn nguyên. Không ai đi lối này.' } }
          ]
        },
        {
          art: 'print', label: 'HIỆN TRƯỜNG 02 · DẤU VẾT',
          lines: [
            { who: 'Hệ thống', cls: 'sys', text: 'Bạn thu được manh mối: MÙI DẦU MÁY.' },
            { who: 'Hiraku', text: 'Trên tay nắm còn một vân tay mờ, dính chất nhờn. Ba nghi phạm, chỉ một người thường xuyên chạm vào dầu máy.' }
          ],
          choices: [
            { label: 'Đối chiếu vân tay với anh sửa ống nước', score: 140, reply: { who: 'Hiraku', text: 'Trùng khớp. Nhưng anh ta có mặt ở tầng hầm lúc xảy ra vụ việc — ba người nhìn thấy.', found: true } },
            { label: 'Đối chiếu với cô cháu gái', score: 70, reply: { who: 'Gà', cls: 'ga', text: 'Không khớp. Nhưng móng tay cô ấy có vệt xước mới.' } },
            { label: 'Gửi mẫu dầu đi phân tích', score: 100, reply: { who: 'Hệ thống', cls: 'sys', text: 'Kết quả: dầu bảo dưỡng thang máy, không phải dầu ống nước.', found: true } }
          ]
        },
        {
          art: 'cam', label: 'HIỆN TRƯỜNG 03 · PHÒNG CAMERA',
          lines: [
            { who: 'Gà', cls: 'ga', text: 'Camera hành lang tầng 7 bị mất tín hiệu đúng 11 phút. Từ 22:04 tới 22:15.' },
            { who: 'Hiraku', text: 'Mười một phút. Vừa đủ để đi thang máy lên, làm xong việc, rồi xuống lại.' }
          ],
          choices: [
            { label: 'Kiểm tra nhật ký thang máy', score: 150, reply: { who: 'Hiraku', text: '22:06 thang lên tầng 7. 22:13 xuống tầng hầm. Người gọi thang dùng thẻ bảo trì.', found: true } },
            { label: 'Xem camera sảnh cùng khung giờ', score: 110, reply: { who: 'Gà', cls: 'ga', text: 'Sảnh không có ai đi qua. Nghĩa là người đó không dùng cầu thang bộ.' } },
            { label: 'Hỏi ai có quyền tắt camera', score: 130, reply: { who: 'Hệ thống', cls: 'sys', text: 'Chỉ hai thẻ mở được tủ điện: quản lý toà nhà và kỹ thuật bảo trì.', found: true } }
          ]
        },
        {
          art: 'clock', label: 'HIỆN TRƯỜNG 04 · ĐỐI CHẤT',
          lines: [
            { who: 'Hiraku', text: 'Bà quản lý khai bà ở quầy lễ tân suốt đêm. Nhưng thẻ bảo trì trong ngăn kéo quầy lễ tân đã được dùng lúc 22:06.' },
            { who: 'Gà', cls: 'ga', text: 'Anh sửa ống nước có người làm chứng. Cô cháu gái thì không biết mật khẩu tủ điện…' }
          ],
          choices: [
            { label: 'Chỉ đích danh bà quản lý', score: 200, reply: { who: 'Hiraku', text: 'Chính xác. Bà ấy là người duy nhất vừa có thẻ, vừa biết lịch bảo trì thang máy, vừa có lý do bôi trơn chốt cửa từ trước.', found: true } },
            { label: 'Chỉ đích danh anh sửa ống nước', score: 40, reply: { who: 'Hiraku', text: 'Chứng cứ ngoại phạm của anh ta quá chắc. Ta vừa mất thời gian quý báu.' } },
            { label: 'Chỉ đích danh cô cháu gái', score: 40, reply: { who: 'Gà', cls: 'ga', text: 'Cô ấy thậm chí không lên nổi tầng 7 nếu không có thẻ. Nhầm rồi anh ơi.' } }
          ]
        }
      ],
      ending: {
        title: 'HỒ SƠ ĐÃ KHÉP',
        text: 'Bà quản lý đã bôi trơn chốt cửa từ nhiều ngày trước, ngắt camera bằng thẻ bảo trì và dùng thang máy trong đúng mười một phút mù. Một kế hoạch gọn gàng — trừ mùi dầu trên tay nắm.'
      }
    },

    'giai-ma-mat-thu': {
      title: 'GIẢI MÃ MẬT THƯ',
      time: 240,
      steps: [
        {
          art: 'letter', label: 'MẬT THƯ 01 · PHONG BÌ KHÔNG TEM',
          lines: [
            { who: 'Hệ thống', cls: 'sys', text: 'Nhận được: một phong bì không tem, không địa chỉ gửi.' },
            { who: 'Hiraku', text: 'Bên trong chỉ có một dòng in hoa: "WX VDFK". Không dấu, không thừa một ký tự nào. Người viết muốn ta giải được.' }
          ],
          choices: [
            { label: 'Thử dịch chuyển bảng chữ cái', score: 130, reply: { who: 'Hiraku', text: 'Lùi ba bậc: W thành T, X thành U. Đây là mật mã Caesar, khoá bằng 3.', found: true } },
            { label: 'Soi phong bì dưới đèn', score: 100, reply: { who: 'Gà', cls: 'ga', text: 'Có vết hằn bút bi ở góc: một chữ số 3 viết đi viết lại đến rách cả giấy.', found: true } },
            { label: 'Đếm tần suất chữ cái', score: 60, reply: { who: 'Gà', cls: 'ga', text: 'Chỉ có sáu chữ cái, ít quá để thống kê ra được gì.' } }
          ]
        },
        {
          art: 'glass', label: 'MẬT THƯ 02 · GIẢI KHOÁ',
          lines: [
            { who: 'Hệ thống', cls: 'sys', text: 'Khoá đã xác định: Caesar, lùi 3 bậc.' },
            { who: 'Hiraku', text: 'W-X thành T-U. V-D-F-K thành S-A-C-H. Ghép lại là hai từ rất cụ thể trong căn phòng này.' }
          ],
          choices: [
            { label: 'Đọc ra: TU SACH', score: 160, reply: { who: 'Gà', cls: 'ga', text: 'Tủ sách! Kia kìa, sát tường phía nam. Hàng thứ ba từ trên xuống có một cuốn bị thụt vào trong.', found: true } },
            { label: 'Đọc ra: TU SANH', score: 70, reply: { who: 'Hiraku', text: 'K lùi ba bậc là H, không phải N. Đọc lại chữ cuối đi.' } },
            { label: 'Thử khoá dịch 5 bậc', score: 40, reply: { who: 'Hệ thống', cls: 'sys', text: 'Kết quả vô nghĩa. Khoá 3 vẫn là đáp án.' } }
          ]
        },
        {
          art: 'key', label: 'MẬT THƯ 03 · SAU CUỐN SÁCH',
          lines: [
            { who: 'Gà', cls: 'ga', text: 'Sau cuốn sách bị thụt vào có một chiếc chìa khoá nhỏ và một tờ giấy ghi bốn chữ số đã bị bôi đen.' },
            { who: 'Hiraku', text: 'Bôi bằng bút dạ. Nhưng giấy mỏng và người viết ấn bút khá mạnh.' }
          ],
          choices: [
            { label: 'Đưa tờ giấy ra ánh sáng xiên', score: 150, reply: { who: 'Hiraku', text: 'Vết hằn hiện ra: 0-9-1-5. Đúng giờ chiếc đồng hồ trong phòng đã dừng lại.', found: true } },
            { label: 'Tô chì lên mặt sau', score: 130, reply: { who: 'Gà', cls: 'ga', text: 'Có rồi! Bốn chữ số: 0915.', found: true } },
            { label: 'Thử ngẫu nhiên vài mã', score: 30, reply: { who: 'Hệ thống', cls: 'sys', text: 'Sai ba lần. Ổ khoá bị khoá cứng, mất thêm thời gian.' } }
          ]
        },
        {
          art: 'letter', label: 'MẬT THƯ 04 · NGƯỜI GỬI',
          lines: [
            { who: 'Hiraku', text: 'Két mở. Bên trong là một lá thư thứ hai, viết cùng nét chữ, gửi cho chính chủ nhà.' },
            { who: 'Gà', cls: 'ga', text: 'Vậy người gài mật thư và người nhận là… một người?' }
          ],
          choices: [
            { label: 'Kết luận: chủ nhà tự để lại', score: 200, reply: { who: 'Hiraku', text: 'Đúng. Ông ấy biết mình đang bị theo dõi nên để lại lối đi cho người đủ kiên nhẫn giải mã. Người đó là chúng ta.', found: true } },
            { label: 'Kết luận: kẻ tống tiền gài bẫy', score: 60, reply: { who: 'Hiraku', text: 'Kẻ tống tiền không tự viết thư cho nạn nhân bằng nét chữ của nạn nhân.' } }
          ]
        }
      ],
      ending: {
        title: 'MẬT THƯ ĐÃ MỞ',
        text: 'Một khoá Caesar lùi ba bậc, một cuốn sách bị thụt vào và bốn chữ số hằn trên giấy. Chủ nhà đã để lại toàn bộ hồ sơ cho người đủ kiên nhẫn đọc đến dòng cuối.'
      }
    },

    'tim-diem-khac-biet': {
      title: 'TÌM ĐIỂM KHÁC BIỆT',
      time: 180,
      steps: [
        {
          art: 'room', label: 'ẢNH 01 · TRƯỚC & SAU',
          lines: [
            { who: 'Hiraku', text: 'Hai bức ảnh chụp cùng căn phòng, cách nhau bốn tiếng. Có bảy chi tiết đã đổi. Ta chỉ cần ba chi tiết đúng.' }
          ],
          choices: [
            { label: 'Vị trí chiếc ghế bên cửa sổ', score: 120, reply: { who: 'Gà', cls: 'ga', text: 'Ghế xoay đi 90 độ. Ai đó đã ngồi xuống và đứng lên vội.', found: true } },
            { label: 'Số lượng sách trên kệ', score: 140, reply: { who: 'Hiraku', text: 'Thiếu đúng một cuốn. Khoảng trống nằm ở hàng ngang tầm mắt.', found: true } },
            { label: 'Màu rèm cửa', score: 20, reply: { who: 'Gà', cls: 'ga', text: 'Rèm y như cũ. Chỉ là ánh nắng đổi hướng thôi.' } }
          ]
        },
        {
          art: 'clock', label: 'ẢNH 02 · GÓC BÀN LÀM VIỆC',
          lines: [
            { who: 'Hệ thống', cls: 'sys', text: 'Phóng to góc bàn làm việc.' },
            { who: 'Hiraku', text: 'Cốc cà phê, đồng hồ để bàn, một xấp giấy. Nhìn kỹ từng thứ.' }
          ],
          choices: [
            { label: 'Kim đồng hồ để bàn', score: 150, reply: { who: 'Hiraku', text: 'Ảnh sau, đồng hồ chỉ 9:15. Ảnh trước là 14:40. Đồng hồ bị chỉnh lùi.', found: true } },
            { label: 'Mực trong cốc cà phê', score: 110, reply: { who: 'Gà', cls: 'ga', text: 'Cốc đầy hơn ở ảnh sau. Có người rót thêm — nghĩa là có người ở lại.', found: true } },
            { label: 'Độ dày xấp giấy', score: 90, reply: { who: 'Hiraku', text: 'Mỏng đi vài tờ. Nhưng chưa đủ để kết luận điều gì.' } }
          ]
        },
        {
          art: 'print', label: 'ẢNH 03 · SÀN NHÀ',
          lines: [
            { who: 'Gà', cls: 'ga', text: 'Sàn gỗ ảnh sau có một vệt mờ hình bán nguyệt gần chân bàn.' }
          ],
          choices: [
            { label: 'Vệt nước từ chiếc ô', score: 180, reply: { who: 'Hiraku', text: 'Nhưng trời không mưa suốt bốn tiếng đó. Chiếc ô ướt đã được mang từ nơi khác tới.', found: true } },
            { label: 'Vết xước do kéo ghế', score: 70, reply: { who: 'Gà', cls: 'ga', text: 'Vệt quá mềm, không phải vết xước.' } }
          ]
        }
      ],
      ending: {
        title: 'BA ĐIỂM ĐÃ KHỚP',
        text: 'Đồng hồ bị chỉnh lùi, cốc cà phê được rót thêm, và một vệt nước từ chiếc ô trong ngày không mưa. Ba chi tiết nhỏ dựng lại trọn vẹn bốn tiếng đã bị giấu đi.'
      }
    },

    'dong-thoi-gian': {
      title: 'DÒNG THỜI GIAN',
      time: 210,
      steps: [
        {
          art: 'car', label: 'MỐC 01 · 21:40',
          lines: [
            { who: 'Hiraku', text: 'Sáu sự kiện, sáu lời khai lệch nhau. Ta xếp lại theo đúng thứ tự. Bắt đầu từ mốc sớm nhất.' }
          ],
          choices: [
            { label: 'Chiếc taxi rời bến', score: 120, reply: { who: 'Hệ thống', cls: 'sys', text: 'Nhật ký tổng đài xác nhận: 21:40, xe rời bến.', found: true } },
            { label: 'Nạn nhân gọi điện lần cuối', score: 80, reply: { who: 'Gà', cls: 'ga', text: 'Cuộc gọi đó lúc 22:05 — muộn hơn. Chưa phải mốc đầu tiên.' } }
          ]
        },
        {
          art: 'clock', label: 'MỐC 02 · 22:05',
          lines: [
            { who: 'Gà', cls: 'ga', text: 'Cuộc gọi cuối kéo dài 46 giây. Người nghe máy nói không nghe rõ gì cả.' }
          ],
          choices: [
            { label: 'Vì tài xế bật radio quá to', score: 140, reply: { who: 'Hiraku', text: 'Đúng. Và tài xế khai mình bị lãng tai — người lãng tai không bật radio to đến mức át cả cuộc gọi.', found: true } },
            { label: 'Vì sóng điện thoại yếu', score: 60, reply: { who: 'Hệ thống', cls: 'sys', text: 'Nhật ký mạng cho thấy sóng đầy suốt cuộc gọi.' } }
          ]
        },
        {
          art: 'cam', label: 'MỐC 03 · 22:31',
          lines: [
            { who: 'Hiraku', text: 'Camera giao lộ ghi được chiếc taxi. Ghế sau trống. Nhưng hành khách lên xe lúc 21:52.' }
          ],
          choices: [
            { label: 'Hành khách đã xuống trước đó', score: 170, reply: { who: 'Gà', cls: 'ga', text: 'Nhưng đồng hồ tính cước vẫn chạy tới 22:58. Tài xế cố kéo dài hành trình trên giấy tờ.', found: true } },
            { label: 'Hành khách nằm xuống ghế', score: 70, reply: { who: 'Hiraku', text: 'Góc camera nhìn thấy cả sàn xe. Không có ai.' } }
          ]
        },
        {
          art: 'glass', label: 'MỐC 04 · KHỚP DÒNG THỜI GIAN',
          lines: [
            { who: 'Hiraku', text: '21:40 rời bến, 21:52 đón khách, 22:05 cuộc gọi bị radio át đi, 22:31 ghế sau đã trống, 22:58 đồng hồ cước mới dừng.' }
          ],
          choices: [
            { label: 'Khoảng trống nằm giữa 22:05 và 22:31', score: 200, reply: { who: 'Hiraku', text: 'Hai mươi sáu phút không ai giải thích được. Và người duy nhất biết chuyện gì xảy ra lại khai rằng mình không nghe thấy gì.', found: true } },
            { label: 'Khoảng trống nằm sau 22:58', score: 50, reply: { who: 'Gà', cls: 'ga', text: 'Sau 22:58 thì xe đã về bến rồi mà anh.' } }
          ]
        }
      ],
      ending: {
        title: 'DÒNG THỜI GIAN ĐÃ LIỀN',
        text: 'Hai mươi sáu phút biến mất giữa một cuộc gọi bị át tiếng và một chiếc ghế sau trống rỗng. Lời khai "tôi không nghe thấy gì" chính là chi tiết lớn tiếng nhất trong cả hồ sơ.'
      }
    }
  };

  /* ---------- Trạng thái ---------- */

  var state = null;
  var ticker = null;

  function $(sel) {
    return document.querySelector(sel);
  }

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function bestScore(id) {
    try {
      return JSON.parse(window.localStorage.getItem(BEST_KEY) || '{}')[id] || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveBest(id, score) {
    try {
      var all = JSON.parse(window.localStorage.getItem(BEST_KEY) || '{}');
      if (score > (all[id] || 0)) {
        all[id] = score;
        window.localStorage.setItem(BEST_KEY, JSON.stringify(all));
      }
    } catch (e) {
      /* chế độ riêng tư: điểm chỉ sống trong phiên này */
    }
  }

  /* ---------- Vòng chơi ---------- */

  function tick() {
    state.left--;
    var box = $('[data-hud-time]');
    if (box) {
      box.textContent = pad(Math.floor(state.left / 60)) + ':' + pad(state.left % 60);
      box.classList.toggle('warn', state.left <= 30);
    }
    if (state.left <= 0) {
      window.clearInterval(ticker);
      finish(true);
    }
  }

  function setProgress() {
    var pct = (state.index / state.game.steps.length) * 100;
    $('.progress-fill').style.width = pct + '%';
    var c = $('[data-hud-clues]');
    if (c) c.textContent = state.clues + '/' + state.game.steps.length;
    var s = $('[data-hud-score]');
    if (s) s.textContent = state.score;
  }

  function say(who, text, cls, found, scroll) {
    var wrap = document.createElement('div');
    wrap.className = 'said';
    wrap.innerHTML =
      '<div class="who ' + (cls || '') + '"></div>' +
      '<div class="text' + (found ? ' found' : '') + '"></div>';
    wrap.querySelector('.who').textContent = who;
    wrap.querySelector('.text').textContent = text;
    $('.log').appendChild(wrap);
    /* Chỉ cuộn theo các lượt trả lời giữa màn chơi; lượt mở màn giữ nguyên
       vị trí để tiêu đề trang không bị header che mất. */
    if (scroll) wrap.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function renderStep() {
    var step = state.game.steps[state.index];
    var screen = $('.screen');
    screen.innerHTML =
      '<div class="scene-art">' + ART[step.art] + '<span class="scene-label"></span></div>' +
      '<div class="log"></div><div class="choices"></div>';
    screen.querySelector('.scene-label').textContent = step.label;

    for (var i = 0; i < step.lines.length; i++) {
      say(step.lines[i].who, step.lines[i].text, step.lines[i].cls);
    }

    var box = $('.choices');
    var keys = 'ABCD';
    step.choices.forEach(function (choice, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';
      btn.innerHTML = '<span class="key">' + keys[i] + '</span><span></span>';
      btn.querySelector('span:last-child').textContent = choice.label;
      btn.addEventListener('click', function () {
        pick(choice);
      });
      box.appendChild(btn);
    });
    setProgress();
  }

  function pick(choice) {
    $('.choices').remove();
    state.score += choice.score;
    if (choice.reply.found) state.clues++;
    say(choice.reply.who, choice.reply.text, choice.reply.cls, choice.reply.found, true);
    state.index++;
    setProgress();

    var next = document.createElement('div');
    next.className = 'choices';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice';
    var last = state.index >= state.game.steps.length;
    btn.innerHTML = '<span class="key">&rarr;</span><span></span>';
    btn.querySelector('span:last-child').textContent = last
      ? 'Khép hồ sơ và xem kết quả'
      : 'Đi tiếp tới ' + state.game.steps[state.index].label.split(' · ')[1];
    btn.addEventListener('click', function () {
      if (last) {
        finish(false);
      } else {
        renderStep();
      }
    });
    next.appendChild(btn);
    $('.screen').appendChild(next);
    btn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function finish(timeout) {
    window.clearInterval(ticker);
    var bonus = timeout ? 0 : state.left * 2;
    var total = state.score + bonus;
    saveBest(state.id, total);

    var rank = total >= 620 ? 'S' : total >= 480 ? 'A' : total >= 340 ? 'B' : 'C';
    var blurb = {
      S: 'Hiraku nhướn mày. Đó là lời khen cao nhất anh ấy từng dành cho ai.',
      A: 'Gà vỗ tay. Bạn đã đọc được gần hết những gì hiện trường muốn nói.',
      B: 'Không tệ. Vài manh mối đã lọt qua kẽ tay, nhưng hồ sơ vẫn khép lại được.',
      C: 'Hồ sơ khép lại trong gang tấc. Thử lại đi — lần này để ý kỹ hơn.'
    }[rank];

    $('.screen').innerHTML =
      '<div class="result">' +
      '<div class="rank-seal">' + rank + '</div>' +
      '<h2></h2><p class="blurb"></p><p></p>' +
      '<div class="score-row">' +
      '<div><b>' + total + '</b><span>Tổng điểm</span></div>' +
      '<div><b>' + state.clues + '/' + state.game.steps.length + '</b><span>Manh mối</span></div>' +
      '<div><b>' + (timeout ? '00:00' : pad(Math.floor(state.left / 60)) + ':' + pad(state.left % 60)) +
      '</b><span>Còn lại</span></div>' +
      '<div><b>' + bestScore(state.id) + '</b><span>Kỷ lục</span></div>' +
      '</div><div class="actions">' +
      '<button type="button" class="again">Chơi lại</button>' +
      '<a href="' + (window.HQ_BASE || '') + 'game.html">Về sảnh game</a>' +
      '<a href="' + (window.HQ_BASE || '') + 'vu-an.html">Đọc vụ án thật</a>' +
      '</div></div>';

    $('.result h2').textContent = timeout ? 'HẾT GIỜ' : state.game.ending.title;
    $('.result .blurb').textContent = blurb;
    $('.result p:last-of-type').textContent = timeout
      ? 'Đồng hồ đã dừng trước khi bạn kịp ghép nốt các mảnh. Hồ sơ vẫn còn mở.'
      : state.game.ending.text;
    $('.result .again').addEventListener('click', function () {
      start(state.id);
    });
    $('.progress-fill').style.width = '100%';
  }

  function boot() {
    var lines = [
      '> khoi dong HQTT-SIM v2.6',
      '> nap ho so hien truong ...',
      '> hieu chinh do phan giai manh moi ...',
      '> ket noi Hiraku & Ga ... OK',
      '> san sang.'
    ];
    var html = '';
    for (var i = 0; i < lines.length; i++) {
      html += '<div class="line" style="animation-delay:' + (i * 0.34) + 's">' + lines[i] + '</div>';
    }
    $('.screen').innerHTML = '<div class="boot">' + html + '<div class="bar"><i></i></div></div>';
  }

  function start(id) {
    var game = GAMES[id];
    if (!game) return;
    window.clearInterval(ticker);
    state = { id: id, game: game, index: 0, score: 0, clues: 0, left: game.time };

    var mount = document.getElementById('game-stage');
    mount.innerHTML =
      '<div class="game-stage">' +
      '<div class="hud">' +
      '<div class="hud-title">' + game.title + '</div>' +
      '<div class="hud-group">' +
      '<div class="hud-item"><span>Manh mối</span><b data-hud-clues>0/' + game.steps.length + '</b></div>' +
      '<div class="hud-item"><span>Điểm</span><b data-hud-score>0</b></div>' +
      '<div class="hud-item"><span>Thời gian</span><b data-hud-time>' +
      pad(Math.floor(game.time / 60)) + ':' + pad(game.time % 60) + '</b></div>' +
      '</div></div>' +
      '<div class="progress-track"><div class="progress-fill"></div></div>' +
      '<div class="screen"></div></div>';

    boot();
    window.setTimeout(function () {
      renderStep();
      ticker = window.setInterval(tick, 1000);
    }, 2300);
  }

  window.HQGame = {
    start: start,
    best: bestScore,
    paintBest: function () {
      var slots = document.querySelectorAll('[data-best-for]');
      for (var i = 0; i < slots.length; i++) {
        var score = bestScore(slots[i].getAttribute('data-best-for'));
        if (score > 0) {
          slots[i].textContent = 'KỶ LỤC ' + score;
        } else {
          slots[i].remove();
        }
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.HQGame.paintBest();
    var stage = document.getElementById('game-stage');
    if (stage && stage.getAttribute('data-game')) {
      start(stage.getAttribute('data-game'));
    }
  });
})();
