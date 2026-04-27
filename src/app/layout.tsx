import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from 'next/script';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: '밤길 — 검증된 업소 탐색 플랫폼',
  description: '지도 기반으로 내 주변 안전한 업소를 찾아보세요.',
  keywords: ["밤길", "밤문화", "업소정보", "위치기반", "카카오맵"],
  openGraph: {
    title: '밤길',
    description: '검증된 업소 탐색',
    url: 'https://bamgil.kr',
    siteName: '밤길',
    locale: 'ko_KR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50">
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services`}
          strategy="afterInteractive"
        />
        <Header />
        <main className="flex-grow pt-16 overflow-hidden">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
