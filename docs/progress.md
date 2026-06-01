# Tiến độ hoàn thành web

Ngày cập nhật: 01/06/2026.

## Tổng quan

Trọng tâm hiện tại là hoàn thiện phần lõi trước khi chỉnh sâu giao diện. Website vẫn theo nguyên tắc: ai có link đều xem được dữ liệu công khai; mọi thao tác ghi, chấm điểm, import, export, chốt, mở khóa và quản trị đều phải đăng nhập và được kiểm tra quyền ở backend/API.

| Nhóm việc | Tiến độ | Trạng thái |
| --- | ---: | --- |
| Nguồn dữ liệu | 88% | Đã phân tích PDF và 04 file Excel; dữ liệu đang bám theo sheet phiếu nguồn, giữ `source_file`, `source_sheet`, `source_row`, loại phiếu, khoa/phòng, đoàn và phiên bản; script đã xác nhận 04 workbook, 58 sheet phiếu và 1.580 dòng tiêu chí. |
| Database và bảo mật | 86% | Đã có schema Supabase theo hướng public-read/protected-write, RLS, migration lõi, bảng profile public, phân công, report file, audit log, API health protected và script kiểm tra schema/RLS tĩnh. |
| Auth/API quyền | 97% | API protected hỗ trợ demo role và Bearer token Supabase; đã thêm `POST /api/auth/login` cho username/password nội bộ qua Supabase Auth mapping `username@clbv.local`; request ghi kiểm tra quyền backend trước khi xử lý body/file. |
| API nghiệp vụ | 99% | Đã có API public/protected cho dashboard, forms, catalog, results, history, high-risk, reports, CAPA, sessions, assignments, scores, attachments, import, export, periods, system health và auth login. |
| Storage | 82% | Upload lên Supabase Storage đã hỗ trợ public URL và signed URL tùy chọn qua `SUPABASE_STORAGE_SIGNED_URL_SECONDS`; system health kiểm tra đúng `SCORE_ATTACHMENT_BUCKET`, `REPORT_EXPORT_BUCKET`, `CAPA_EVIDENCE_BUCKET`. |
| Import Excel | 87% | Parser ưu tiên sheet phiếu kiểm tra/chấm điểm theo khoa/phòng, nhận diện loại file, cảnh báo lệch tổng điểm/số tiêu chí, có commit import theo quyền Admin/Phòng KHTH; đã chuẩn hóa nhận diện tên file tiếng Việt có `Đ/đ`, dấu, gạch dưới và khoảng trắng. |
| Excel báo cáo | 82% | Export đã tạo workbook nhiều sheet và có script kiểm tra workbook thật từ API: đủ 10 sheet nghiệp vụ, đúng MIME `.xlsx`, có sheet phiếu chi tiết, sheet tiêu chí và dấu nguồn `source_file`, `source_sheet`, `source_row`. |
| Giao diện | 52% | Đã đủ màn hình chính và điều hướng dạng tab động. Giao diện còn cần tinh giản sau khi lõi ổn định. |
| Deploy Vercel | 100% | Đã deploy tại `https://clbv.vercel.app/`; GitHub `main` tự kích hoạt Vercel deploy. |

## Kiểm thử gần nhất

- `npm.cmd run api:check`: đạt `81/81`.
- `npm.cmd run schema:check`: đạt `106/106`.
- `npm.cmd run excel:check`: đạt, xác nhận 04 workbook nguồn, 58 sheet phiếu và 1.580 dòng tiêu chí.
- `npm.cmd run export:check`: đạt trên production, file `.xlsx` có 10 sheet bắt buộc và dấu nguồn.
- `npm.cmd run build`: đạt; Next.js nhận route mới `/api/auth/login`.
- Vercel `node scripts/smoke-test.mjs https://clbv.vercel.app`: đạt `49/49`.
- Public read API trên Vercel: dashboard, reports, CAPA, sessions, catalog, assignments, results, history, high-risk đều trả `200` khi không đăng nhập.
- Auth login API trên Vercel: JSON hỏng trả `400`, payload thiếu username/password trả `422`, chưa cấu hình Supabase hoặc sai mật khẩu được xử lý bằng `503` hoặc `401`.
- Protected API trên Vercel: không đăng nhập trả `403` cho thao tác ghi/export/import/upload; JSON hỏng trả `400`; payload sai nghiệp vụ trả `422`; payload hợp lệ đúng quyền trả `200`.
- Import commit protected: kiểm tra đủ các trường hợp không đăng nhập, JSON hỏng, payload thiếu template/criteria, cảnh báo chưa cho phép và commit hợp lệ bằng Admin.
- Scores protected: thiếu lý do/phát hiện khi bị trừ điểm trả `422`; Admin ghi hợp lệ trả `200`.
- CAPA protected: thiếu nội dung cập nhật trả `422`; vai trò CAPA cập nhật hợp lệ trả `200`.
- Periods protected: mở khóa không có lý do trả `422`; Admin chốt/mở khóa hợp lệ trả `200`.
- Upload minh chứng điểm và minh chứng CAPA: không đăng nhập trả `403`; đúng quyền trả `200` và có data URL trong chế độ dữ liệu mẫu.
- Export Excel protected bằng vai trò Admin: trả `200` và đúng MIME `.xlsx`.

## Rà soát ngõ cụt

Đã ghi rõ tại `docs/core-gap-audit.md`: không tiếp tục chỉ mở rộng smoke test quanh demo role. Điểm nghẽn thật sự hiện nay là Supabase thật, seed user thật, import Excel thật, RLS thật và sau đó mới tinh giản giao diện.

## Việc tiếp theo

1. Nối màn hình đăng nhập với `POST /api/auth/login` để UI dùng auth thật khi Supabase đã cấu hình.
2. Tạo script seed Supabase Auth/profile cho tài khoản mẫu theo username/password nội bộ.
3. Kết nối Supabase thật trên Vercel bằng biến môi trường, chạy schema/migration và seed tài khoản quản trị.
4. Chạy import 04 file Excel thật qua API/import UI và đối chiếu số sheet, số tiêu chí, tổng điểm, đoàn, khoa/phòng.
5. Kiểm thử RLS bằng token thật: anonymous chỉ đọc, thành viên chỉ ghi tiêu chí được phân công, CAPA chỉ cập nhật CAPA, Admin/Phòng KHTH quản trị được.
6. Kiểm thử luồng chấm điểm thật: tạo phiên, phân công, nhập điểm, bắt lỗi thiếu lý do trừ điểm, lưu nháp, hoàn tất, khóa/mở khóa.
7. Kiểm thử export Excel sau khi có dữ liệu Supabase thật và lưu thông tin file báo cáo.
8. Sau khi lõi đạt, chỉnh lại giao diện mobile-first và dashboard cho gọn, dễ thao tác hơn.
