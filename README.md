# Hội Quán Thám Tử

Website tĩnh cho Hội Quán Thám Tử, dẫn chuyện bằng hai nhân vật Gà và Hiraku.
Không cần cài package, không có bước build.

## Chạy trên máy

```bash
cd html
python3 -m http.server 8080
```

Mở `http://localhost:8080`.

Mọi đường dẫn đều tuyệt đối dạng `/slug/` (mỗi trang là `slug/index.html`),
nên phải chạy qua web server tĩnh với `html/` làm gốc, không mở thẳng file.

## Cấu trúc

```
html/
├── index.html                 Trang chủ, tổng hợp mọi mục
├── vu-an/                     19 vụ án lấy từ fanpage thamtuvui, ảnh ở assets/vu-an/
├── cau-do/                    46 câu đố lấy từ fanpage, ảnh ở assets/cau-do/ (mục Lời giải chờ cập nhật)
├── game/                      Sảnh game + game/<slug>/
├── truyen-ngan/               Tab Tất cả / Miễn phí / Trả phí
├── truyen-dai/                Tab Tất cả / Miễn phí / Trả phí
├── truyen/                    Nội dung truyện, gồm mục lục và từng chương
├── blog/                   Nhật ký của Gà, đọc trọn trong danh sách
├── ve-chung-toi/
├── cua-hang/                  Cửa hàng (sắp mở)
├── video/                     Video (sắp ra mắt)
└── assets/
```

## Tài nguyên

| Tệp | Vai trò |
| --- | --- |
| `style.css` | Giao diện gốc của trang chủ. Không sửa. |
| `site.css` | Header mới, component dùng chung, mọi trang được thêm vào |
| `game.css` | Bảng màu tối riêng cho khu game |
| `site.js` | Dropdown, drawer menu, bộ lọc, tìm kiếm |
| `app.js` | Tương tác riêng của trang chủ |
| `paywall.js` | Ví Xu và cổng nội dung trả phí |
| `riddle.js` | Chấm đáp án câu đố và mở gợi ý |
| `reader.js` | Cỡ chữ và nền khi đọc truyện |
| `boc-soi.js` | Game Bốc Sỏi: lượt chơi, thoại và nước đi của Hiraku |
| `doc-suy-nghi.js` | Game Đọc Suy Nghĩ: Hiraku đoán lá bài người chơi nghĩ (ảnh lá bài trong `assets/bai/`) |
| `con-mat-ngan-nam.js` | Game Con Mắt Ngàn Năm: bảng 100 số kèm ký tự cổ, con mắt đoán ký tự |
| `share.js` | Nút chia sẻ Facebook và copy link ở cuối các game (ảnh con mắt ở `assets/mat/`) |
| `shop.css`, `shop.js` | Cửa hàng: thẻ sản phẩm, trang chi tiết dạng khối, khung ảnh trượt (ảnh ở `assets/cua-hang/`) |
| `auth.js` | Popup đăng nhập / đăng ký (demo, không gửi dữ liệu) |

Header (menu) và footer viết cứng trong HTML của từng trang, không dùng
JavaScript để dựng, để link thật nằm sẵn trong mã nguồn cho SEO. Sửa menu thì
sửa đồng loạt cả 26 file `index.html` (popup đăng nhập/đăng ký cũng
viết cứng ở cuối mỗi trang); mục đang chọn đánh dấu bằng
`class="nav-link is-active" aria-current="page"`. `site.js` chỉ gắn hành vi
mở/đóng dropdown và menu mobile.

Card trong trang danh sách là HTML tĩnh; JavaScript chỉ lọc và ẩn hiện theo
thuộc tính `data-*`. Tắt JavaScript vẫn đọc được toàn bộ nội dung.

## Ghi chú

Ví Xu, việc mở khoá chương trả phí, biểu mẫu liên hệ và bốn màn game đều là
bản mô phỏng. Không có giao dịch thật và không có dữ liệu nào rời khỏi trình
duyệt — tất cả lưu trong `localStorage`.

## SEO

- Mỗi trang có khối `<!-- seo --> … <!-- /seo -->` trong `<head>`: canonical, Open Graph, Twitter card, JSON-LD (website, bài viết, sản phẩm, breadcrumb). Tên miền chính: `https://hoiquanthamtu.com`.
- Ảnh chia sẻ 1200×630 cho từng trang ở `assets/og/` (tên file = đường dẫn trang, `/` đổi thành `--`; trang chủ là `trang-chu.jpg`).
- `sitemap.xml`, `robots.txt` ở gốc `html/`. Trang Truyện dài và Video đang trống nên chưa đưa vào sitemap.
- `404.html` là trang báo không tìm thấy (noindex).
- Đường dẫn cũ `/blog-ga/…` chuyển 301 sang `/blog/…` (khai ở `vercel.json` và `_redirects`).
- Thêm trang mới: nhớ thêm khối SEO, ảnh OG và một dòng trong `sitemap.xml`.

## Tài khoản (đăng ký, đăng nhập, trang cá nhân)

- Giao diện: popup đăng nhập/đăng ký có sẵn trên mọi trang, `assets/auth.js` gọi API và bật/tắt nút tài khoản trên header; trang cá nhân `/tai-khoan/` (`assets/account.js`).
- API: Cloudflare Worker trong thư mục `api/` (`api/src/index.js`), dữ liệu ở D1 (`api/migrations/`). Chỉ chạy ở `hoiquanthamtu.com/api/*`; trên bản `*.vercel.app` không có API.
- Mật khẩu băm PBKDF2-SHA256 có salt; phiên đăng nhập là cookie HttpOnly, D1 chỉ lưu SHA-256 của token; sai mật khẩu 8 lần trong 15 phút thì bị chặn tạm.
- Chạy thử trên máy: `cd api && npm install && npm run migrate:local && npm run dev`, mở `http://127.0.0.1:8787`.
- Deploy: đăng nhập wrangler bằng tài khoản Cloudflare đang giữ tên miền, rồi `npm run deploy` và `npm run migrate:remote` trong `api/`.

## Cửa hàng

- 3 quầy: `/cua-hang/boardgame/`, `/cua-hang/sach/`, `/cua-hang/phu-kien-trinh-tham/`. Trang `/cua-hang/` hiện tối đa 6 sản phẩm nổi bật mỗi quầy; quầy chưa có hàng hiện "Sắp có sản phẩm".
- Sản phẩm vẫn ở `/cua-hang/<tên-sản-phẩm>/` (breadcrumb có thêm cấp quầy). Thêm sản phẩm mới: tạo trang sản phẩm, chép thẻ `.shop-card` vào quầy tương ứng ở `/cua-hang/` và trang quầy, thêm link mua vào `LINKS` trong `assets/shop.js`, cập nhật số sản phẩm trong menu dropdown "Cửa hàng".
