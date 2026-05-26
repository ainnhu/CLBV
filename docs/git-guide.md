# Hướng dẫn chạy Git cho dự án

Tài liệu này dành cho người không chuyên CNTT, dùng để lưu lịch sử chỉnh sửa source code và đẩy dự án lên GitHub.

## 1. Kiểm tra Git đã cài chưa

Mở PowerShell trong thư mục dự án:

```powershell
cd "D:\Downloads\v2 KTHĐ BV"
git --version
```

Nếu thấy dạng như sau là đã cài:

```text
git version 2.x.x
```

Nếu báo `git is not recognized` hoặc `The term 'git' is not recognized`, máy chưa cài Git hoặc Git chưa được thêm vào biến môi trường `PATH`.

## 2. Cài Git trên Windows

Cách dễ nhất:

1. Tải Git tại: `https://git-scm.com/download/win`
2. Mở file cài đặt.
3. Ở các màn hình cài đặt, có thể giữ lựa chọn mặc định.
4. Đến mục chọn PATH, nên chọn:

```text
Git from the command line and also from 3rd-party software
```

5. Cài xong, đóng PowerShell cũ và mở PowerShell mới.
6. Kiểm tra lại:

```powershell
git --version
```

## 3. Thiết lập tên và email Git lần đầu

Chỉ cần làm một lần trên máy:

```powershell
git config --global user.name "Tên của bạn"
git config --global user.email "email@example.com"
```

Email này chỉ dùng cho lịch sử commit GitHub, không liên quan đến đăng nhập hệ thống bệnh viện.

Kiểm tra cấu hình:

```powershell
git config --global --list
```

## 4. Khởi tạo Git cho dự án

Vào thư mục dự án:

```powershell
cd "D:\Downloads\v2 KTHĐ BV"
```

Khởi tạo Git:

```powershell
git init
```

Kiểm tra trạng thái:

```powershell
git status
```

## 5. Tạo file `.gitignore`

Không nên đưa các thư mục build, thư viện và file môi trường thật lên GitHub.

Nếu chưa có `.gitignore`, tạo file `.gitignore` với nội dung:

```gitignore
node_modules/
.next/
.env
.env.local
*.log
```

File `.env.example` vẫn được đưa lên GitHub vì chỉ là mẫu cấu hình, không chứa khóa bí mật.

## 6. Commit lần đầu

Thêm toàn bộ file cần lưu:

```powershell
git add .
```

Xem lại:

```powershell
git status
```

Tạo commit:

```powershell
git commit -m "Khoi tao prototype cham diem benh vien"
```

## 7. Tạo repository trên GitHub

1. Vào `https://github.com`
2. Chọn `New repository`
3. Đặt tên ví dụ:

```text
benh-vien-san-nhi-ca-mau-kiem-tra-hoat-dong-2026
```

4. Không cần chọn tạo README trên GitHub nếu dự án đã có `README.md`.
5. Tạo repository.

## 8. Kết nối dự án local với GitHub

Sau khi GitHub tạo repository, GitHub sẽ hiện URL dạng:

```text
https://github.com/ten-tai-khoan/ten-repository.git
```

Chạy:

```powershell
git branch -M main
git remote add origin https://github.com/ten-tai-khoan/ten-repository.git
git push -u origin main
```

## 9. Các lệnh Git hay dùng

Xem file đã thay đổi:

```powershell
git status
```

Xem nội dung thay đổi:

```powershell
git diff
```

Thêm file vào lần commit tiếp theo:

```powershell
git add .
```

Commit:

```powershell
git commit -m "Mo ta ngan gon noi dung thay doi"
```

Đẩy lên GitHub:

```powershell
git push
```

Tải thay đổi mới nhất từ GitHub về máy:

```powershell
git pull
```

## 10. Quy trình khuyến nghị cho dự án này

Mỗi lần hoàn thành một phần rõ ràng, ví dụ import Excel, API chấm điểm, giao diện CAPA, nên commit một lần:

```powershell
git status
git add .
git commit -m "Hoan thien API import Excel"
git push
```

Không đưa các file sau lên GitHub:

- `.env`
- `.env.local`
- khóa Supabase thật
- mật khẩu thật
- file log tạm
- `node_modules`
- `.next`

## 11. Khi Git chưa chạy được trong PowerShell

Nếu đã cài Git nhưng PowerShell vẫn không nhận:

1. Đóng toàn bộ PowerShell.
2. Mở PowerShell mới.
3. Chạy:

```powershell
git --version
```

Nếu vẫn lỗi, kiểm tra file Git thường nằm ở:

```text
C:\Program Files\Git\cmd\git.exe
```

Có thể chạy tạm:

```powershell
& "C:\Program Files\Git\cmd\git.exe" --version
```

Nếu lệnh này chạy được, cần thêm thư mục sau vào biến môi trường `Path` của Windows:

```text
C:\Program Files\Git\cmd
```

