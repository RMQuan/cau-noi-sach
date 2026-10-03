# Cầu Nối Sách

Công cụ giúp nhà trường xếp mỗi học sinh **chưa có sách giáo khoa** vào một nguồn học liệu hợp pháp ngay trong
tuần đầu: sách giấy luân chuyển, SGK số chính thức hoặc phiếu học tập giáo viên tự soạn. Không photo sách trái
phép, gần như không tốn tiền.

**Dùng thử ngay: https://rmquan.github.io/cau-noi-sach/** (không cần cài đặt, dùng được trên điện thoại)

## Thử trong 3 phút

1. **Tổng quan:** các ô khoanh bút đỏ là lớp có nhiều em chưa có sách hay SGK số.
2. **Phân sách:** bấm "Chạy phân sách", xem em nào giữ sách riêng, cặp nào dùng chung và lịch mang sách về nhà,
   rồi bấm "Áp dụng".
3. **Tổng quan:** các vòng đỏ biến mất dần.
4. **Khảo sát lớp:** bấm "Mã QR phụ huynh" của một em và mở trang dành cho phụ huynh.
5. **Phiếu học tập:** mở một phiếu, bấm "In phiếu hoặc lưu PDF".
6. **Kết thúc chuyển tiếp:** khi sách chính thức về đủ, bấm kết thúc và xem danh sách thu hồi.

Dữ liệu là của một trường giả lập (3 lớp, 48 học sinh, 27 cuốn sách) và chỉ lưu trên trình duyệt của bạn. Bấm
"Nạp lại dữ liệu mẫu" trong menu để làm lại từ đầu.

## Mô hình 3 lớp

| Nguồn học liệu | Dành cho | Vì sao hợp pháp |
|---|---|---|
| Sách giấy luân chuyển | Em không có thiết bị (ưu tiên trước) | Cho mượn sách đã mua hoặc được tặng là hoạt động thư viện thông thường |
| SGK số chính thức | Em có thiết bị | Chỉ đặt đường dẫn tới nền tảng do chính nhà xuất bản phát hành |
| Phiếu học tập tự soạn | Mọi em; in cho em không giữ sách riêng | Giáo viên tự viết theo Chương trình GDPT 2018 (văn bản pháp luật, không được bảo hộ quyền tác giả), chia sẻ theo CC BY 4.0 |

Nếu vẫn cần bản in của sách, nhà trường xin nhà xuất bản cấp phép in **riêng các bài của 6 tuần đầu**, có thời
hạn và không bán. Ứng dụng **không lưu trữ hay phát lại nội dung sách giáo khoa**.

## Tính năng

- **Tổng quan:** bảng mức độ thiếu sách theo lớp và môn, danh sách việc cần làm hôm nay, danh sách cần bổ sung
  sách (tải CSV).
- **Khảo sát lớp:** giáo viên chủ nhiệm đánh dấu em thiếu môn nào, có thiết bị không, có thuộc diện ưu tiên không.
- **Phân sách tự động:** đủ sách thì mỗi em một cuốn; thiếu thì ghép tối đa 2 em một cuốn (cùng lớp, gần nhà) kèm
  lịch mang về nhà xen kẽ; em diện ưu tiên giữ sách riêng trước. Giáo viên xem lại trước khi áp dụng.
  Thuật toán: [`src/logic/allocate.js`](src/logic/allocate.js).
- **Ngân hàng sách:** nhãn QR cho từng cuốn, quét bằng camera điện thoại để cho mượn và nhận lại.
- **Kho phiếu học tập mở:** xem, in, soạn phiếu mới (bắt buộc cam kết tự biên soạn).
- **Trang phụ huynh:** tra cứu bằng mã ngẫu nhiên giáo viên gửi riêng; xem sách đang mượn, hạn trả, lịch mang về
  nhà, link SGK số và phiếu của tuần.
- **Kết thúc chuyển tiếp:** ngừng phân sách mới và lập danh sách thu hồi.

Giao diện có chế độ sáng ("Vở ô li") và tối ("Bảng đen"). Mọi trang đã được rà tự động theo WCAG 2 AA bằng axe-core, không phát hiện vi phạm.

## Chạy trên máy

Cần Node.js 18 trở lên.

```bash
npm install
npm run dev
```

Sau đó mở http://localhost:5173.

## Dành cho người phát triển

- **Công nghệ:** React 18 + Vite, CSS thuần với CSS variables, `qrcode.react` và `html5-qrcode`. Chưa có backend;
  khi triển khai thật có thể lưu dữ liệu trên Supabase hoặc Firebase để nhiều giáo viên dùng chung.
- **Deploy:** mỗi lần đẩy lên nhánh `main`, GitHub Actions tự build và đưa lên GitHub Pages.
- **Design token:** sửa `src/design/tokens.json` rồi chạy `npm run tokens`.
- **Kiểm thử** (cần Python 3 và Playwright), khi dev server đang chạy:
  `python3 tests/e2e.py http://localhost:5173 screenshots/sau` cho các luồng chính, và
  `python3 tests/a11y.py http://localhost:5173` để rà chuẩn truy cập.

## Lưu ý

- Tên học sinh, giáo viên và mã sách đều là dữ liệu giả lập. Nội dung các phiếu mẫu do nhóm tự viết.
- Link SGK số và các điều khoản pháp luật cần được đối chiếu với quy định hiện hành trước khi triển khai.

## Giấy phép

Mã nguồn: MIT, © 2026 RMQuan ([`LICENSE`](LICENSE)). Phiếu học tập mẫu và bộ biểu mẫu giấy: CC BY 4.0
([`LICENSE-NOI-DUNG.md`](LICENSE-NOI-DUNG.md)). `scripts/generate-tokens.cjs` lấy từ skill design-system của
claudekit (MIT).
