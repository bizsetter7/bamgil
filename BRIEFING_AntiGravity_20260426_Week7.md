# BRIEFING — P6 밤길 Week 7 (지역 오버레이 완성 + CTA 5종 + 내주변필터 + SEO 정적페이지)
> 작성: 코부장 (Claude Code) | 2026-04-26
> 필독 선행문서:
> 1. `D:\토탈프로젝트\My-site\p1.choco-idea\MISTAKES_LOG.md`
> 2. `D:\토탈프로젝트\My-site\p1.choco-idea\MASTER_PLAN_CocoEcosystem_20260426.md`
> 3. `D:\토탈프로젝트\My-site\p6.밤길\REPORT_AntiGravity_20260425_Week6.md`

---

## 현재 상태 (Week 6 완료 기준)

| 기능 | 상태 |
|------|------|
| 카카오맵 통합 | ✅ |
| 지역 서브필터 UI (시/도 → 구/군 칩) | ✅ 구현됨 (Week 6) |
| 조회수(views) 배지 | ✅ |
| generateMetadata 동적 SEO | ✅ |
| 로딩 스켈레톤 | ✅ |
| 지역 풀스크린 오버레이 (밤맵 방식) | ❌ 미구현 |
| CTA 5개 버튼 완성 | ❌ 미구현 |
| 내 주변 필터 (위치 기반) | ❌ 미구현 |
| /[region] 정적 SEO 랜딩 | ❌ 미구현 |
| sitemap.xml / robots.txt | ❌ 미구현 |

---

## 🔴 Task 1: 지역 선택 풀스크린 오버레이 (밤맵 방식)

현재는 칩(Chip) 서브필터 방식. 밤맵은 버튼 클릭 시 **전체화면 오버레이 패널**이 열리는 방식 사용.

**파일**: `src/app/HomeClient.tsx` (또는 지역 필터 컴포넌트)

### 구현 방향

```tsx
// 1. 지역 버튼 클릭 → 오버레이 열기
const [regionOverlayOpen, setRegionOverlayOpen] = useState(false);

// 2. 오버레이: 고정 포지션, 배경 블러
{regionOverlayOpen && (
  <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
    <div className="bg-zinc-900 rounded-2xl w-full max-w-lg mx-4 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">지역 선택</h3>
        <button onClick={() => setRegionOverlayOpen(false)}>✕</button>
      </div>

      {/* 1단계: 시/도 선택 */}
      {!selectedProvince ? (
        <div className="grid grid-cols-4 gap-2">
          {PROVINCES.map(p => (
            <button key={p.key} onClick={() => setSelectedProvince(p.key)}
              className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm">
              {p.name}
            </button>
          ))}
        </div>
      ) : (
        // 2단계: 구/군 선택
        <div>
          <button onClick={() => setSelectedProvince(null)} className="mb-3 text-sm text-zinc-400">
            ← {PROVINCES.find(p => p.key === selectedProvince)?.name}
          </button>
          <div className="grid grid-cols-3 gap-2">
            {DISTRICTS[selectedProvince].map(d => (
              <button key={d} onClick={() => { applyRegionFilter(d); setRegionOverlayOpen(false); }}
                className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm">
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
)}
```

PROVINCES와 DISTRICTS 상수를 `src/lib/regions.ts`에 정의.
기존 칩 필터 방식은 제거하지 않고 오버레이로 **교체**.

---

## 🟠 Task 2: 업소 상세 CTA 5개 버튼 완성 (밤맵 방식)

**파일**: `src/app/places/[businessId]/page.tsx`

밤맵 벤치마크: 통화 / 상담톡 / 입소신청 / 찜하기 / 관리자

```tsx
{/* 하단 고정 CTA 바 */}
<div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t border-zinc-800 p-3">
  <div className="flex gap-2 max-w-xl mx-auto">

    {/* 1. 통화 */}
    <a href={`tel:${business.phone}`}
      className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm">
      <Phone size={18} /> 통화
    </a>

    {/* 2. 상담톡 (카카오오픈채팅 URL) */}
    {business.kakao_url && (
      <a href={business.kakao_url} target="_blank" rel="noopener noreferrer"
        className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-sm">
        <MessageSquare size={18} /> 상담톡
      </a>
    )}

    {/* 3. 입소신청 */}
    <button onClick={handleApply}
      className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-sm font-bold">
      <UserCheck size={18} /> 입소신청
    </button>

    {/* 4. 찜하기 */}
    <button onClick={handleBookmark}
      className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm">
      <Heart size={18} className={isBookmarked ? 'fill-pink-500 text-pink-500' : ''} />
      찜하기
    </button>

    {/* 5. 관리자 (업소 owner에게만 표시) */}
    {isOwner && (
      <a href={`/dashboard/businesses/${business.id}`}
        className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm">
        <Settings size={18} /> 관리자
      </a>
    )}
  </div>
</div>
```

> 찜하기: localStorage 기반 간단 구현 (Supabase 저장 없이). 로그인 없이도 동작.
> 입소신청: 클릭 시 업소 전화번호로 연결 또는 상담톡으로 연결 (business.phone 사용).

---

## 🟡 Task 3: 내 주변 필터 (위치 기반)

**경쟁사 벤치마크**: 밤맵 사이드바에 "내 주변" 섹션 확인.

```tsx
const handleNearMe = () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      // 카카오맵 중심 이동
      mapRef.current?.setCenter(new window.kakao.maps.LatLng(latitude, longitude));
      mapRef.current?.setLevel(4); // 약 2km 반경
      // 필터: 지도 표시 업소 중 현재 위치에서 가까운 순 정렬
      setNearMeActive(true);
    },
    () => alert('위치 정보를 가져올 수 없습니다.')
  );
};
```

버튼 위치: 지역 선택 버튼 옆 또는 사이드바 상단.

```tsx
<button onClick={handleNearMe}
  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors
    ${nearMeActive ? 'bg-pink-600 border-pink-600 text-white' : 'border-zinc-700 text-zinc-400 hover:border-pink-500'}`}>
  <Navigation size={12} /> 내 주변
</button>
```

---

## 🟢 Task 4: /[region] SEO 정적 랜딩페이지

### 목표 키워드
- "[지역] 룸살롱"
- "[지역] 유흥 업소"
- "[지역] 밤문화"

### 4-A. regions.ts 생성

**파일 신규**: `src/lib/regions.ts` (P5와 동일 구조)

```ts
export const SEO_REGIONS = [
  { slug: 'gangnam',  name: '강남' },
  { slug: 'seoul',    name: '서울' },
  { slug: 'busan',    name: '부산' },
  { slug: 'daegu',    name: '대구' },
  { slug: 'incheon',  name: '인천' },
  { slug: 'suwon',    name: '수원' },
  { slug: 'daejeon',  name: '대전' },
  { slug: 'gwangju',  name: '광주' },
  { slug: 'ulsan',    name: '울산' },
  { slug: 'jeonju',   name: '전주' },
  { slug: 'cheongju', name: '청주' },
  { slug: 'changwon', name: '창원' },
  { slug: 'pohang',   name: '포항' },
  { slug: 'jeju',     name: '제주' },
] as const;
```

### 4-B. /[region]/page.tsx

**파일 신규**: `src/app/[region]/page.tsx`

```tsx
import { SEO_REGIONS } from '@/lib/regions';
import { createServerSupabaseClient } from '@/lib/supabase-server'; // 서버 클라이언트
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return SEO_REGIONS.map(r => ({ region: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  const found = SEO_REGIONS.find(r => r.slug === region);
  if (!found) return {};
  return {
    title: `${found.name} 룸살롱·유흥업소 목록 | 밤길`,
    description: `${found.name} 지역 룸살롱·유흥 업소 정보. 리뷰·별점·실시간 조회수로 업소를 찾아보세요.`,
    alternates: { canonical: `/${region}` },
    openGraph: {
      title: `${found.name} 밤문화 업소 찾기 | 밤길`,
    },
  };
}

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  const found = SEO_REGIONS.find(r => r.slug === region);
  if (!found) notFound();

  // 해당 지역 업소 목록 SSG
  const supabase = createServerSupabaseClient();
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name, region, address, tc_price, views')
    .ilike('region', `%${found.name}%`)
    .order('views', { ascending: false })
    .limit(20);

  return (
    <main>
      <h1>{found.name} 룸살롱·유흥 업소 목록</h1>
      {/* 업소 카드 목록 (LocalBusiness Schema 포함) */}
      {/* 내부 링크: /places/[id] 개별 상세 */}
      {/* 내부 링크: 인접 지역 SEO 페이지 */}
    </main>
  );
}
```

> LocalBusiness Schema 구조화 데이터 추가:
> ```tsx
> <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
>   "@context": "https://schema.org",
>   "@type": "LocalBusiness",
>   "name": business.name,
>   "address": { "@type": "PostalAddress", "addressLocality": found.name, "addressCountry": "KR" },
> }) }} />
> ```

### 4-C. sitemap.xml

**파일 신규**: `src/app/sitemap.ts`

```ts
import { SEO_REGIONS } from '@/lib/regions';
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://bamgil.kr';
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/rankings`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...SEO_REGIONS.map(r => ({
      url: `${base}/${r.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
```

### 4-D. robots.txt

```ts
// src/app/robots.ts
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: 'https://bamgil.kr/sitemap.xml',
  };
}
```

---

## 📋 검증 절차

1. `npm run build` — 에러 0건 필수
2. `/gangnam` 접속 → H1 "강남 룸살롱·유흥 업소 목록" 확인
3. `/sitemap.xml` → 14개 지역 URL 포함 확인
4. 업소 상세 페이지 → 하단 CTA 5개 버튼 표시 확인
5. "내 주변" 버튼 클릭 → 위치 권한 요청 후 지도 이동 확인
6. 지역 버튼 클릭 → 풀스크린 오버레이 열림/닫힘 확인

---

## 절대 금지

1. canonical/og:url에 트레일링 슬래시 금지 (M-029)
2. 지역명 하드코딩 금지 — SEO_REGIONS 상수 사용 (M-006)
3. 파일 전체 덮어쓰기 금지 — Edit 핀셋 수정만
4. `/admin` 경로에 Supabase 인증 이외의 미들웨어 추가 금지
5. 빌드 에러 있는 상태에서 "완료" 보고 금지
