import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: '짐메이트',
  description: '헬스장 출석 공유',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: '짐메이트' },
};

export const viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // iPhone 홈 인디케이터 등 safe-area까지 뷰포트를 확장. 이게 없으면
  // env(safe-area-inset-*) 값이 0으로 계산돼 하단 탭바가 인디케이터를 침범.
  viewportFit: 'cover' as const,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
