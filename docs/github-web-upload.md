# Hướng dẫn upload dự án lên GitHub bằng giao diện web

Áp dụng khi máy không cài Git và không dùng GitHub CLI.

Repo đích:

```text
https://github.com/ainnhu/CLBV
```

## 1. Thư mục đã chuẩn bị để upload

Thư mục sạch đã được tạo tại:

```text
D:\Downloads\v2 KTHĐ BV\github-upload\CLBV
```

File ZIP dự phòng:

```text
D:\Downloads\v2 KTHĐ BV\github-upload\CLBV-source.zip
```

Thư mục này đã loại:

- `node_modules`
- `.next`
- `.env`
- file log
- thư mục tạm của Vercel/build

Thư mục này đã giữ:

- Source Next.js.
- `README.md`.
- `.env.example`.
- Schema Supabase.
- Script import Excel.
- Export Excel.
- PDF kế hoạch/quyết định.
- 04 file Excel bảng kiểm.
- Logo và banner.
- Dữ liệu trích xuất mẫu.

## 2. Upload bằng GitHub web

1. Mở:

```text
https://github.com/ainnhu/CLBV
```

2. Vào nhánh `main`.

3. Chọn:

```text
Add file -> Upload files
```

4. Mở File Explorer tại:

```text
D:\Downloads\v2 KTHĐ BV\github-upload\CLBV
```

5. Chọn toàn bộ nội dung bên trong thư mục `CLBV`, không chọn chính thư mục cha.

6. Kéo thả toàn bộ file/thư mục đã chọn vào vùng upload của GitHub.

7. Ở ô commit message, nhập:

```text
Upload prototype cham diem kiem tra hoat dong benh vien
```

8. Chọn:

```text
Commit directly to the main branch
```

9. Bấm:

```text
Commit changes
```

## 3. Nếu GitHub không nhận kéo thả thư mục

Làm theo cách sau:

1. Giải nén file:

```text
D:\Downloads\v2 KTHĐ BV\github-upload\CLBV-source.zip
```

2. Kéo thả các file/thư mục con sau khi giải nén vào GitHub upload.

Nếu vẫn không được, upload theo từng nhóm:

- Nhóm 1: file cấu hình ở thư mục gốc.
- Nhóm 2: thư mục `app`.
- Nhóm 3: thư mục `src`.
- Nhóm 4: `services`, `import`, `export`, `database`, `scripts`, `docs`.
- Nhóm 5: PDF, Excel, logo/banner.

## 3.1. Nếu đã upload lần đầu nhưng chỉ thấy file ở thư mục gốc

Trường hợp này thường xảy ra khi lần đầu chỉ chọn các file ngoài cùng, chưa chọn các thư mục con.

Dấu hiệu:

- Repo đã thấy `package.json`, `README.md`, `.env.example`, các file Excel/PDF.
- Nhưng chưa thấy các thư mục:

```text
app/
database/
docs/
export/
import/
public/
scripts/
services/
src/
```

Khi đó không cần upload lại toàn bộ. Chỉ upload bổ sung thư mục còn thiếu.

Thư mục bổ sung đã chuẩn bị tại:

```text
D:\Downloads\v2 KTHĐ BV\github-upload-missing-folders\CLBV-missing-folders
```

Trong thư mục này có 9 thư mục:

```text
app
database
docs
export
import
public
scripts
services
src
```

Cách upload bổ sung:

1. Mở repo `https://github.com/ainnhu/CLBV`.
2. Chọn `Add file -> Upload files`.
3. Mở File Explorer tại:

```text
D:\Downloads\v2 KTHĐ BV\github-upload-missing-folders\CLBV-missing-folders
```

4. Chọn 9 thư mục bên trong.
5. Kéo thả 9 thư mục đó vào GitHub.
6. Commit message:

```text
Upload missing source folders
```

7. Bấm `Commit changes`.

Không upload file ZIP lên GitHub nếu mục tiêu là deploy, vì GitHub/Vercel sẽ không tự giải nén ZIP để build.

## 4. Kiểm tra sau khi upload

Mục đích của bước này là xác nhận GitHub đã nhận đúng source code, không thiếu thư mục quan trọng và không upload nhầm file tạm/bí mật.

### Cách 1: Kiểm tra trực tiếp trên trang repo

1. Mở repo:

```text
https://github.com/ainnhu/CLBV
```

2. Bảo đảm đang ở nhánh:

```text
main
```

3. Nhìn danh sách file/thư mục ở trang đầu repo.

Repo cần thấy các file/thư mục sau ở cấp ngoài cùng:

```text
app/
database/
docs/
export/
import/
public/
scripts/
services/
src/
package.json
README.md
.env.example
```

Nếu thấy các thư mục trên, nghĩa là source chính đã lên GitHub.

### Cách 2: Kiểm tra bằng ô tìm file của GitHub

Trên trang repo GitHub, bấm phím:

```text
t
```

hoặc bấm ô `Go to file`, rồi tìm lần lượt:

```text
package.json
app/page.tsx
database/supabase-schema.sql
import/excel-import.ts
export/report-export.ts
docs/progress.md
public/logo-bv-san-nhi-ca-mau.jpg
```

Nếu GitHub tìm thấy các file này, nghĩa là các phần chính đã upload đúng.

### Cách 3: Kiểm tra file không nên có

Vẫn tại ô `Go to file`, tìm thử các tên sau:

```text
node_modules/
.next/
.env
*.log
```

Kết quả mong muốn:

- Không thấy `node_modules`.
- Không thấy `.next`.
- Không thấy `.env`.
- Không thấy file `.log`.

Nếu lỡ thấy các file/thư mục này, cần xóa khỏi GitHub vì:

- `node_modules` rất nặng và có thể tạo lỗi deploy.
- `.next` là thư mục build tạm, Vercel sẽ tự tạo.
- `.env` có thể chứa khóa bí mật.
- File log không cần thiết.

### Cách 4: Kiểm tra lịch sử commit

1. Trên trang repo, bấm mục `Commits`.
2. Commit mới nhất nên có nội dung gần giống:

```text
Upload prototype cham diem kiem tra hoat dong benh vien
```

3. Mở commit đó, kiểm tra GitHub báo có nhiều file được thêm mới.

### Cách 5: Kiểm tra sau khi deploy Vercel

Sau khi import repo vào Vercel và deploy:

1. Vào trang project trên Vercel.
2. Mở tab `Deployments`.
3. Deploy mới nhất phải có trạng thái:

```text
Ready
```

4. Bấm URL Vercel để mở web.
5. Kiểm tra nhanh:

- Trang chủ mở được, không yêu cầu đăng nhập.
- Dashboard công khai xem được.
- Có nút `Đăng nhập để chấm điểm / quản trị`.
- Các trang CAPA, báo cáo, bảng kiểm có dữ liệu mẫu.

Nếu Vercel báo lỗi build, mở phần `Build Logs` và tìm dòng màu đỏ đầu tiên. Thông thường lỗi nằm ở thiếu file, thiếu package hoặc upload thiếu thư mục.

## 5. Deploy Vercel sau khi upload

1. Vào `https://vercel.com`.
2. Chọn `Add New -> Project`.
3. Import repo `ainnhu/CLBV`.
4. Framework preset: `Next.js`.
5. Build command:

```text
npm run build
```

6. Install command:

```text
npm install
```

7. Chưa cần nhập biến môi trường nếu chỉ chạy prototype/mock data.
8. Bấm `Deploy`.
