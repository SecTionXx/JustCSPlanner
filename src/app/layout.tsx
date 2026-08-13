import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Just Logistics · Freight Operations Planner",
  description:
    "ระบบจัดการงานสำหรับทีม CS Freight Forwarder — Job Card ต่อ booking, เจ้าของงานชัดเจน, deadline ไม่ตกหล่น",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
