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

/**
 * generateMetadata — P-12 SEO 마스터 표준 (P9 웨이터존 패턴 이식)
 * - 복제사이트 감지 → robots noindex + canonical 차단
 * - GEO 메타태그 + OpenGraph + Twitter Card 일괄 적용
 * - GSC: 도메인 속성 인증(DNS TXT)이라 verification meta tag 선택 사항
 *
 * Refs: PATTERNS/P-12_seo_master.md
 */
export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bamgil.kr';
  const isCloneSite =
    siteUrl.includes('d386') ||
    (siteUrl.includes('vercel.app') && !siteUrl.includes('bamgil'));

  // 복제사이트: 색인 차단 + 본 사이트로 canonical
  if (isCloneSite) {
    return {
      title: '밤길',
      robots: {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
      },
      alternates: { canonical: 'https://www.bamgil.kr' },
    };
  }

  let metadataBase: URL | null = null;
  try { metadataBase = new URL(siteUrl); }
  catch { metadataBase = new URL('https://www.bamgil.kr'); }

  const title = '밤길 — 검증된 업소 탐색 플랫폼';
  const description = '지도 기반으로 내 주변 안전한 유흥업소를 찾아보세요. 실시간 영업시간·리뷰·찜하기.';
  const ogImage = `${siteUrl}/og-image.jpg`;

  return {
    metadataBase,
    alternates: { canonical: siteUrl },
    title,
    description,
    keywords: ['밤길', '밤문화', '유흥업소', '업소정보', '위치기반', '카카오맵', '룸살롱', '노래주점', '강남업소', '서울업소'],
    verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
      : undefined,
    openGraph: {
      title: '밤길',
      description,
      url: siteUrl,
      siteName: '밤길',
      images: [{ url: ogImage, width: 1200, height: 630, alt: '밤길 - 검증된 업소 탐색' }],
      type: 'website',
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    other: {
      google: 'notranslate',
      'geo.region': 'KR',
      'geo.placename': 'Seoul',
      'geo.position': '37.4979;127.0276',
      'ICBM': '37.4979, 127.0276',
      'robots': 'max-image-preview:large',
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
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
      <body className="min-h-full flex flex-col bg-white text-gray-900 notranslate">
        {/* JSON-LD WebSite + SearchAction — P-12 SEO 표준 (사이트링크 검색박스) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              'name': '밤길',
              'alternateName': 'BAMGIL',
              'url': 'https://www.bamgil.kr',
              'potentialAction': {
                '@type': 'SearchAction',
                'target': {
                  '@type': 'EntryPoint',
                  'urlTemplate': 'https://www.bamgil.kr/?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        {/* JSON-LD Organization — 브랜드 엔티티 신호 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              'name': '밤길',
              'alternateName': ['BAMGIL', '밤길닷컴', '밤길지도'],
              'url': 'https://www.bamgil.kr',
              'logo': 'https://www.bamgil.kr/logo.png',
              'description': '전국 유흥업소 지도 플랫폼. 밤길에서 내 주변 업소를 찾고 실시간 정보를 확인하세요.',
              'foundingDate': '2026',
              'areaServed': 'KR',
              'knowsAbout': ['유흥업소', '밤길', '유흥지도', '업소찾기'],
            }),
          }}
        />
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services,clusterer`}
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
