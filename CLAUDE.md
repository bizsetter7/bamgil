@AGENTS.md

# P6 밤길 (bamgil.kr) — 에이전트 핸드오버 가이드
> 최종 업데이트: 2026-04-29 | Week13~14 (지도 마커/클러스터/배지/이미지 전면 개선)
> **작업 시작 전 이 파일만 읽으면 됨 — BRIEFING 파일 별도 읽기 불필요**

---

## 1. 프로젝트 개요

| 항목 | 값 |
|------|-----|
| 도메인 | https://www.bamgil.kr |
| 로컬 경로 | D:\토탈프로젝트\My-site\p6.밤길 |
| GitHub | bizsetter7/bamgil |
| Vercel | bamgil |
| Supabase | chocoidea-coco (P2/P5/P6/P9/P10 공유) |
| 타겟 | 유흥업소 탐색 손님 (B2C) |
| 기술스택 | Next.js 16 + TypeScript + Tailwind CSS v4 + 카카오맵 SDK |
| 경쟁사 | bammap.com, bamsajang.com |

---

## 2. 절대 원칙 (MUST NOT)

1. **파일 전체 덮어쓰기 금지** — Edit 핀셋 수정만
2. **`ignoreBuildErrors: true` 절대 금지**
3. **`cookies()` await 필수** — Next.js 15
4. **SSG 페이지에서 `createClient()` 사용 금지** — 직접 Supabase URL fetch 사용
5. **완료는 `npm run build` 성공 후에만 선언**

---

## 3. DB 활용 테이블 (P5 공유)

### businesses (읽기 전용 — P5에서 관리)
```
조회 조건: is_active = true AND is_verified = true
주요 필드: id(uuid), name, category, region_code, address, lat, lng,
           phone, kakao_channel, open_chat_url, business_hours(JSON),
           menu_main, menu_liquor, menu_snack, cocoalba_tier
```

### subscriptions (읽기 전용 — 배지 표시용)
```
조회: business_id 기준, plan 필드로 배지 결정
```

### bamgil_contacts (밤길에서 write)
```
id: uuid PK
business_id: uuid FK → businesses.id
contact_type: call | chat | visit
contacted_at: timestamptz
```

---

## 4. 파일 구조

```
src/
├── app/
│   ├── layout.tsx              카카오맵 SDK 로드 (services,clusterer 포함)
│   ├── page.tsx                홈 (service_role로 subscriptions 조인)
│   ├── [region]/page.tsx       SEO 지역 랜딩 14개
│   ├── places/
│   │   └── [businessId]/page.tsx  업소 상세
│   ├── my/page.tsx             마이페이지 (찜 목록 + 야사장 전환 배너)
│   ├── onboarding/page.tsx     역할 선택 온보딩 (손님/업체)
│   ├── loading.tsx             스켈레톤
│   ├── sitemap.ts / robots.ts
│   └── api/
│       ├── contacts/           유입 카운터 (service_role)
│       ├── auth/me/            세션 조회
│       ├── favorites/          찜하기 CRUD
│       ├── reviews/            리뷰/평점
│       ├── reports/            잘못된 정보 제보
│       ├── businesses/detail|view  업소 상세 + 조회수
│       └── admin/              어드민 CRUD (service_role)
├── components/
│   ├── layout/                 Header (AuthButton 포함), Footer
│   ├── auth/
│   │   └── AuthButton.tsx      로그인/프로필 드롭다운 (야사장 링크 포함)
│   ├── home/
│   │   ├── HomeClient.tsx      모바일3탭(홈/목록/지도) + PC 사이드패널
│   │   ├── DetailPanel.tsx     우측/모바일 업소 상세 패널
│   │   └── MiniMap.tsx         상세패널 하단 소형 지도 (주소 geocoding 포함)
│   ├── map/
│   │   ├── KakaoMap.tsx        라벨마커 + 클러스터 + 호버팝업 통합
│   │   └── KakaoMapClient.tsx  dynamic import (SSR 비활성화)
│   └── business/
│       ├── BusinessCard.tsx    compact(PC사이드) + 기본 그리드 카드
│       └── BottomCtaBar.tsx    CTA 버튼 (통화/상담톡/입소신청/찜하기)
└── lib/
    ├── supabase/client.ts, server.ts
    ├── maskName.ts             실장명 마스킹 (김O훈)
    ├── businessHours.ts        getTodayHours / getTodayHoursHashtag
    └── regions.ts              SEO_REGIONS 14개 지역 상수
```

---

## 5. 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://www.bamgil.kr
NEXT_PUBLIC_KAKAO_MAP_KEY=
```

---

## 6. 카카오맵 통합 패턴

```typescript
// layout.tsx — SDK 비동기 로드 (services + clusterer 필수)
<Script src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false&libraries=services,clusterer`} />

// KakaoMap.tsx 핵심 아키텍처:
// 1) 투명 Marker(1x1 GIF) → MarkerClusterer (zoom >= 6 → 숫자 클러스터)
// 2) CustomOverlay (라벨 + 화살표) → zoom < 6 에서만 visible
// 3) positionsCache ref: 마커 생성 시 id → LatLng 저장
// 4) zoomTo(id): relayout + setCenter + setLevel(4) — onLoad 콜백으로 노출
// 5) allClusterMarkers 배열 → 전부 수집 후 addMarkers() 1회 배치
// 6) finalizeMarkers(): geocoding 완료 후 clusterer 배치 + setBounds 1회만

// ZoomToFn 타입은 KakaoMap.tsx에서 export, HomeClient에서 ref로 보관
// page.tsx: service_role key 사용 (subscriptions RLS 우회 필수)

// 마커 색상 (tierColor):
// premium/elite → #d97706 (amber), standard → #1d4ed8 (blue), 기타 → #1e3a5f (navy)
// CLUSTER_MIN_LEVEL = 6 (이 레벨 이상 → 클러스터 숫자 표시)

// geocoding: stripDetailAddr() — 층/호 정보 제거 후 주소 검색
// address 예: "충남 천안시 서북구 검은들1길 26 3층" → "충남 천안시 서북구 검은들1길 26"
```

### HomeClient.tsx 지도 컨테이너 패턴
```typescript
// 모바일: display:none 금지 → opacity + pointer-events 방식으로 항상 렌더
// (Kakao Maps가 display:none 컨테이너에서 0x0 초기화 버그)
// PC: 패널 열 때 350ms delay 후 zoomTo() (flex width 변화 후 relayout 필요)
// 모바일 지도탭: 즉시 zoomTo() → 300ms 후 패널 열기
```

---

## 7. 유입 통계 패턴

```typescript
// ContactButton 클릭 → fire-and-forget
fetch('/api/contacts', {
  method: 'POST',
  body: JSON.stringify({ businessId, contactType: 'call' | 'chat' | 'visit' })
});

// API: service_role로 bamgil_contacts INSERT
```

---

## 8. 완료된 기능

| 날짜 | 완료 내용 |
|------|---------|
| 04-24 (Week1~4) | 기본 레이아웃, 카카오맵, 메인페이지, 업소상세, 유입카운터, 지역필터, 조회수배지, SEO메타태그, 플랜배지, 스켈레톤 |
| 04-26 (Week7) | 지역 풀스크린 오버레이(2단계), CTA 5개 버튼, 내주변 필터(geolocation), SEO 지역랜딩 14개, sitemap/robots |
| 04-26 (Hotfix) | SSG 미작동 수정(직접 URL), tc_price 컬럼 제거→category 배지 |
| 04-27 (Week8) | DetailPanel 전체정보 통합(허가배지+사업자번호마스킹), 모바일 슬라이드 패널, 관리자 버튼 제거 |
| 04-29 (Week9~10) | 전체 화이트 테마, DetailPanel 경쟁사 레이아웃(슬라이더+퀵인포+미니맵), 잘못된정보 제보 모달+API(bamgil_reports), 영업시간 파싱(getTodayHours/Hashtag), Header 드로어 섹션구조, MiniMap 컴포넌트 |
| 04-29 (Week11) | 모바일 3탭(홈/목록/지도), 홈탭 배너슬라이더+신규오픈/인기/신규입점 가로스크롤 섹션, 목록탭 카드(150x120 이미지+해시태그시간), 홀덤펍 카테고리 추가 |
| 04-29 (Week12) | **개인회원 시스템**: Google OAuth 로그인, 역할선택 온보딩(손님/업체), AuthButton(Header+야사장링크), 찜하기(bamgil_favorites+API+❤️버튼), 리뷰/평점(bamgil_reviews+API+별점폼+목록), 마이페이지(/my), proxy.ts 라우트 보호 |
| 04-29 (Week13~14) | **지도/마커 전면 개선**: 라벨마커(업소명+삼각화살표)+MarkerClusterer(zoom≥6 숫자), 호버팝업(영업진 팝업), positionsCache+zoomTo 패턴, MiniMap geocoding 수정, 지도 컨테이너 opacity방식(display:none 버그 해결), PC 350ms delay 줌인 패턴 |
| 04-29 (Week13~14) | **배지 시스템**: isPremiumTier(premium/elite)=🔥인기+✓프리미엄, isDeluxe=🔥인기, 홈탭3섹션+목록카드+PC사이드바 적용 |
| 04-29 (Week13~14) | **버그픽스**: page.tsx service_role 전환(subscriptions RLS 우회), geocoding 층/호 스트립, 클러스터 addMarkers 배치(단일업소 '1' 표시), PC사이드바 카드 64px 썸네일 |

---

## 9. 신규 테이블 (04-29 추가)

```
bamgil_reports    — 잘못된 정보 제보 (reason, content, contact, status)
bamgil_user_profiles — 손님 프로필 (nickname, email) — RLS 본인만
bamgil_favorites  — 찜하기 (user_id, business_id UNIQUE) — RLS 본인만
bamgil_reviews    — 리뷰/평점 (user_id, business_id UNIQUE, rating 1~5, content) — RLS 공개읽기/본인쓰기
```

---

## 10. 미완료 항목

- ⏳ **클러스터 단일업소 '1' 표시** — 배치 추가 수정 완료, Vercel 배포 후 실제 테스트 필요
- ⏳ **마커 색상/배지 반영** — service_role 전환 완료, 실제 테스트 필요
- ❌ 쿠폰 시스템 (bamgil_coupons: 업체 발급, 손님 수령) — Phase 3
- ❌ 입소신청 플로우 완성
- ❌ 고급 필터 (가격대, 특징 등)
- ❌ 랭킹 페이지 (리뷰 평점 기반)
- ❌ 앱화 (React Native / Expo — Phase 4)

---

## 11. 알려진 주의사항

- SSG 페이지(`[region]/page.tsx`)에서 `createClient()` 쓰면 빌드 실패 → 직접 fetch 사용
- `tc_price` 컬럼 없음 (제거됨) — category 배지로 대체
- 카카오맵은 SSR 불가 → `use client` + `window.kakao` 필수 → `KakaoMapClient.tsx`로 dynamic import
- businesses.id = uuid (P2의 shops.id = bigint와 다름 — 혼동 주의)
- **proxy.ts** (Next.js 16) — `middleware.ts` 아님. 함수명도 `proxy`로 export
- **리뷰 닉네임 조인**: FK 없음 → `/api/reviews`에서 `user_id IN [...]` 수동 조회로 처리
- **Google OAuth 동작 전제**: Supabase 대시보드 → Authentication → Providers → Google 활성화 필수
- **OAuth Redirect URL 등록 필수**: `https://www.bamgil.kr/auth/callback` (Supabase Auth Settings)
- **page.tsx는 반드시 service_role key 사용** — subscriptions 테이블 RLS가 anon 읽기 차단. createClient(ANON_KEY)로 조인하면 subscriptions=[] 빈 배열 반환 → 배지/마커색상 모두 실패
- **지도 컨테이너 display:none 절대 금지** — Kakao Maps가 0x0으로 초기화됨. opacity + pointer-events 방식 사용
- **clusterer SDK**: layout.tsx Script src에 `&libraries=services,clusterer` 필수
- **KakaoMap 마커 생성**: allClusterMarkers 배열로 수집 → finalizeMarkers()에서 addMarkers() 1회만 호출. 개별 addMarker()는 타이밍 문제로 일부 마커 누락됨
- **geocoding 주소**: 층/호 포함 주소는 stripDetailAddr()로 제거 후 사용 ("검은들1길 26 3층" → "검은들1길 26")
