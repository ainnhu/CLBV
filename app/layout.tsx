import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chấm điểm kiểm tra hoạt động bệnh viện",
  description:
    "Hệ thống chấm điểm kiểm tra các khoa, phòng tại Bệnh viện Sản - Nhi Cà Mau năm 2026"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
