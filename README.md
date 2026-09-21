# Hội Quán Thám Tử

Website tĩnh cho Hội Quán Thám Tử, dẫn chuyện bằng hai nhân vật Gà và Hiraku.
Không cần cài package, không có bước build.

## Chạy trên máy

```bash
cd html
python3 -m http.server 8080
```

Mở `http://localhost:8080`.

Mở thẳng `html/index.html` bằng trình duyệt cũng chạy được, trừ vài chỗ phụ
thuộc đường dẫn tuyệt đối. Dùng web server tĩnh vẫn là cách đúng.

## Cấu trúc

```
html/
├── index.html                 Trang chủ, tổng hợp mọi mục
├── vu-an.html                 Danh sách vụ án + vu-an/*.html
├── cau-do.html                Danh sách câu đố + cau-do/*.html
├── game.html                  Sảnh game + game/*.html
├── truyen-ngan.html           Tab Tất cả / Miễn phí / Trả phí
├── truyen-dai.html            Tab Tất cả / Miễn phí / Trả phí
├── truyen/                    Nội dung truyện, gồm mục lục và từng chương
├── blog-ga.html               Nhật ký của Gà, đọc trọn trong danh sách
├── ve-chung-toi.html
└── assets/
```

## Tài nguyên

| Tệp | Vai trò |
| --- | --- |
| `style.css` | Giao diện gốc của trang chủ. Không sửa. |
| `site.css` | Header mới, component dùng chung, mọi trang được thêm vào |
| `game.css` | Bảng màu tối riêng cho khu game |
| `site.js` | Header, footer, dropdown, drawer, bộ lọc, tìm kiếm |
| `app.js` | Tương tác riêng của trang chủ |
| `paywall.js` | Ví Xu và cổng nội dung trả phí |
| `riddle.js` | Chấm đáp án câu đố và mở gợi ý |
| `reader.js` | Cỡ chữ và nền khi đọc truyện |
| `game.js` | Engine giả lập cho bốn màn chơi |

Header và footer được dựng bằng `site.js` nên không lặp lại markup trên 24
trang. Trang nằm trong thư mục con đặt `window.HQ_BASE = '../'` trước khi nạp
script để đường dẫn tài nguyên trỏ đúng.

Card trong trang danh sách là HTML tĩnh; JavaScript chỉ lọc và ẩn hiện theo
thuộc tính `data-*`. Tắt JavaScript vẫn đọc được toàn bộ nội dung.

## Ghi chú

Ví Xu, việc mở khoá chương trả phí, biểu mẫu liên hệ và bốn màn game đều là
bản mô phỏng. Không có giao dịch thật và không có dữ liệu nào rời khỏi trình
duyệt — tất cả lưu trong `localStorage`.
