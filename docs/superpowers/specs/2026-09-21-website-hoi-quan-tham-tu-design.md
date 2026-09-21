# Hội Quán Thám Tử — Thiết kế website nhiều trang

Ngày: 2026-09-21

## Mục tiêu

Mở rộng site tĩnh một trang hiện tại thành website đầy đủ bảy mục trên
header navigation: Trang chủ, Vụ Án, Câu Đố, Game, Truyện trinh thám
(dropdown), Blog của Gà, Về chúng tôi.

## Ràng buộc

1. Giữ nguyên phong cách trang chủ: token màu, font, bóng đổ lệch, hiệu
   ứng tape/stamp/paperclip, lớp grain.
2. Không sửa base gốc. `assets/style.css` giữ nguyên xi; CSS mới nằm
   trong `assets/site.css`, nạp sau. Các section sẵn có của `index.html`
   không đổi, chỉ thêm section mới.
3. Không build step, không package. Mở file bằng trình duyệt là chạy.

Ngoại lệ duy nhất: header phải đổi vì menu mới, và phần xử lý nav trong
`app.js` chuyển sang file dùng chung để 24 trang không lặp lại markup.

## Kiến trúc

Static HTML nhiều trang. Header và footer inject bằng script đồng bộ đặt
đúng vị trí chúng xuất hiện, nên không nháy và không layout shift. Trang
nằm trong thư mục con đặt `window.HQ_BASE` để đường dẫn asset đúng.

Card trong trang danh sách viết thẳng ra HTML tĩnh với thuộc tính
`data-*`; JavaScript chỉ lọc và ẩn hiện. Tắt JavaScript vẫn đọc được
toàn bộ nội dung.

### Sitemap

    index.html                  Trang chủ, tổng hợp mọi mục
    vu-an.html                  Danh sách vụ án
      vu-an/ho-so-031-tai-xe-taxi.html
      vu-an/ho-so-030-mat-ma-ket-sat.html
      vu-an/ho-so-029-bong-ho-lo.html
    cau-do.html                 Danh sách câu đố
      cau-do/can-phong-khoa-kin.html
      cau-do/ba-chiec-hop.html
      cau-do/mat-thu-cua-ga.html
    game.html                   Sảnh game
      game/truy-tim-thu-pham.html
      game/giai-ma-mat-thu.html
      game/tim-diem-khac-biet.html
      game/dong-thoi-gian.html
    truyen-ngan.html            Danh sách, tab Tất cả / Miễn phí / Trả phí
      truyen/vet-muc-tren-tay-ao.html        miễn phí
      truyen/nguoi-khach-luc-3h15.html       trả phí
    truyen-dai.html             Danh sách, tab Tất cả / Miễn phí / Trả phí
      truyen/an-mang-pho-den-do/index.html   mục lục
      truyen/an-mang-pho-den-do/chuong-1.html  miễn phí
      truyen/an-mang-pho-den-do/chuong-2.html  miễn phí
      truyen/an-mang-pho-den-do/chuong-3.html  trả phí
    blog-ga.html                Nhật ký, đọc trọn trong danh sách
    ve-chung-toi.html

### Tài nguyên

    assets/style.css   Base gốc, KHÔNG SỬA
    assets/site.css    Header mới, component dùng chung, mọi trang mới
    assets/game.css    Bảng màu tối cho trang game
    assets/site.js     Header, footer, dropdown, drawer, lọc, tiết lộ khi cuộn
    assets/paywall.js  Ví Xu, modal mở khoá, localStorage
    assets/game.js     Engine giả lập: kịch bản, đồng hồ, HUD
    assets/app.js      Base gốc, chỉ bỏ phần xử lý nav đã chuyển sang site.js

## Navigation

Bảy mục cộng nút CTA. Mục Truyện trinh thám mở panel kiểu bìa hồ sơ, hai
cột Truyện ngắn và Truyện dài, mỗi cột có liên kết Miễn phí và Trả phí
trỏ tới `truyen-ngan.html#free`, `#vip` và tương tự cho truyện dài. Tab ở
trang đích tự chọn theo hash.

Dưới 980px chuyển sang hamburger, drawer toàn màn hình, mục Truyện thành
accordion.

## Tương tác

**Lọc.** Filter bar đặt `data-filter`; card mang `data-level`, `data-type`,
`data-access`. JS gắn lớp `is-hidden`, không xoá DOM.

**Câu đố.** Ô nhập đáp án chấm tại chỗ, chuẩn hoá chuỗi bằng
`normalize('NFD')` bỏ dấu và khoảng trắng. Ba cấp gợi ý mở dần. Lời giải
trong accordion.

**Paywall.** Nội dung trả phí hiện khoảng 30% rồi fade, kế đó là thẻ khoá
với hai nút 50 Xu và 15.000đ. Cả hai mở cùng modal giả lập. Xác nhận thì
trừ Xu, ghi khoá đã mở vào localStorage, bỏ lớp che. Ví Xu hiện ở header,
mặc định 120 Xu. Thiếu Xu thì modal đổi thành nạp Xu demo. Mọi màn hình
gắn nhãn bản demo, không có giao dịch thật.

**Game.** Thanh loading khởi động, HUD gồm đồng hồ đếm ngược chạy thật,
thanh tiến độ manh mối và điểm. Gameplay là kịch bản dựng sẵn trong
`game.js`: mỗi lần bấm mở bước tiếp theo. Kết thúc hiện màn hoàn thành có
xếp hạng và nút chơi lại. Điểm cao lưu localStorage.

## Hệ thiết kế

Kế thừa token gốc `--ink #101c2b`, `--paper #f4efe3`, `--gold #e7b74b`,
`--red #b54338`, font Special Elite và Be Vietnam Pro. Bổ sung `--free`
xanh rêu cho nhãn miễn phí, `--vip` gold cho nhãn trả phí, và bộ token
tối riêng cho trang game.

Component mới: `.page-hero`, `.filter-bar`, `.post-card`, `.badge-free`,
`.badge-vip`, `.breadcrumb`, `.prose`, `.paywall`, `.coin-wallet`,
`.game-card`, `.game-stage`, `.pagination`.

Breakpoint 1200, 980, 760, 520.

## Khả năng tiếp cận

`aria-expanded` và `aria-haspopup` cho dropdown, Esc đóng, focus trap
trong drawer, `aria-current="page"` cho mục đang xem, tôn trọng
`prefers-reduced-motion`.

## Nghiệm thu

Chạy `python3 -m http.server` trong `html`, chụp màn hình từng trang ở
1440, 768 và 390 pixel, xác nhận console không lỗi, bấm thử dropdown, bộ
lọc, paywall và một màn game. Cập nhật README vì đang ghi sai `dist/`.
