@AGENTS.md

# P6 밤길 (bamgil.kr) — 에이전트 핸드오버 가이드
> 최종 업데이트: 2026-04-29 | Week13~14 + 구독플랜체계/앱로드맵/DB주의사항 추가
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
3. **`cookies()` await 필수** — Next.js 16
4. **SSG 페이지에서 `createClient()` 사용 금지** — 직접 Supabase URL fetch 사용
5. **완료는 `npm run build` 성공 후에만 선언** (Windows: `npx next build --webpack`)
6. **page.tsx에서 `createClient(ANON_KEY)` 사용 금지** — subscriptions RLS 차단됨. 반드시 `createClient(SERVICE_ROLE_KEY)` 사용
7. **`sub.status === 'active'` 직접 비교 금지** — `getActivePlanFromList()` 헬퍼 사용 (active+trial 동등 인정)
8. **PostgREST 임플리시트 join 금지** — `subscriptions(...)` silent fail. 별도 쿼리 + Map 매핑 사용
9. **useEffect deps에 새 배열/콜백 직접 사용 금지** — useMemo / useRef 패턴 필수 (지도 깜빡임 방지)

---

## 3. DB 활용 테이블 (P5 공유)

### businesses (읽기 전용 — P5에서 관리)
```
조회 조건: is_active = true
⚠️ 주의: page.tsx에서 is_verified 조건 없이 is_active만 사용 중 (CLAUDE.md 원문과 불일치)
         → 추후 통일 필요: is_active = true AND is_verified = true 로 맞출지 확인
주요 필드: id(uuid), name, category, region_code, address, lat, lng,
           phone, kakao_channel, open_chat_url, business_hours(JSON),
           menu_main, menu_liquor, menu_snack, cocoalba_tier,
           manager_name, manager_role(2026-04-29 추가 — 사장/실장/팀장/부장/매니저),
           business_reg_number(OCR 자동 추출 — Phase B 그룹핑 키)
```

### subscriptions (읽기 전용 — 배지 표시용)
```
조회: business_id 기준, plan 필드로 배지 결정
⚠️ RLS 주의: anon key로 조인 시 빈 배열 반환 (에러 없이 조용히 실패)
             반드시 service_role key 사용 (page.tsx, API routes 모두)
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

## 6. 구독 플랜 체계 (배지 + 마커 색상 매핑)

| plan | 마커 색상 | 배지 1 | 배지 2 | 우선순위 |
|------|-----------|--------|--------|----------|
| `elite` | #d97706 amber | 🔥 인기 | ✓ 프리미엄 | 최상 |
| `premium` | #d97706 amber | 🔥 인기 | ✓ 프리미엄 | 상 |
| `deluxe` | #1d4ed8 blue | 🔥 인기 | — | 중상 |
| `standard` | #1d4ed8 blue | — | — | 중 |
| `basic` / 없음 | #1e3a5f navy | — | — | 기본 |

```typescript
// 코드 내 로직 (KakaoMap.tsx, BusinessCard.tsx, HomeClient.tsx 공통)
const sub = business.subscriptions?.[0];
const activePlan = sub?.status === 'active' ? sub.plan : null;
const isPremiumTier = activePlan === 'premium' || activePlan === 'elite'; // amber 마커 + 🔥인기 + ✓프리미엄
const isDeluxe     = activePlan === 'deluxe';                             // blue 마커 + 🔥인기
const isPopular    = isPremiumTier || isDeluxe;                           // 🔥인기 표시 여부
```

> **브랜드 컬러**: 기본 navy `#1e3a5f` / 프리미엄 amber `#d97706` / 스탠다드 blue `#1d4ed8`

---

## 8. 카카오맵 통합 패턴

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

## 9. 유입 통계 패턴

```typescript
// ContactButton 클릭 → fire-and-forget
fetch('/api/contacts', {
  method: 'POST',
  body: JSON.stringify({ businessId, contactType: 'call' | 'chat' | 'visit' })
});

// API: service_role로 bamgil_contacts INSERT
```

---

## 10. 완료된 기능

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
| 04-29 (Week15) | **안정화 핫픽스 5종**: ① subscription `status='trial'` 인정(M-045 — `getActivePlan` 헬퍼) ② mappable useMemo + KakaoMap props refs(M-046 — 지도 깜빡임 박멸) ③ MarkerClusterer `minClusterSize:1` ④ geocoding 시군구 fallback ⑤ PostgREST 임플리시트 join → 별도 쿼리 + Map 매핑(M-047) |
| 04-29 (Week15) | **PC 사이드바 카드 강화**: 가로 110→130px, 배지 가로 1줄(text-[9px]), 거리(Haversine `haversineKm`)+동(`coord2RegionCode` region3) 배지, hover 시 마커 `setZIndex(9999)` 앞으로 |
| 04-29 (Week15) | **DetailPanel**: 🔥인기 배지 추가, 전화 옆 이름·"전화"·"사장" 중복 제거, `getActivePlanFromList` 헬퍼 통합 |
| 04-29 (Week15) | **maskName 영문 대응**: 단어별 첫+끝 보존 + 가운데 모두 O ("ZOAO HAIYAN" → "ZOOO HOOOON", 한글 패턴 유지) |
| 04-29 (Week16) | **지역 시스템 전면 재구축**: ① 전국 17시도+표준 행정구역 보강(`lib/regions.ts`) ② RegionOverlay 좌우분할 + 카운트(`provinceCounts`/`districtCounts` SSR 계산) ③ 시도 좌측 + 시군구 우측 즉시 갱신, 단일 클릭 자동 닫힘 ④ region/category 클라이언트 useState 즉시 필터(새로고침 X) ⑤ 좌측 패널 `h-full + overflow-y-auto` 강제 스크롤 |
| 04-29 (Week16) | **manager_role 동적화**: businesses.manager_role 컬럼 추가(SQL: `ALTER TABLE businesses ADD COLUMN manager_role TEXT`), 모든 표시 위치(카드/팝업/DetailPanel/places) 동적, fallback '실장' |
| 04-29 (Week16) | **Phase B 그룹핑** (`business_reg_number` 기준): ① `filteredGroups` useMemo — 같은 사업자 영업진 N명 합치기 ② `primary` = plan 우선순위 최상위(elite>premium>deluxe>special>standard>basic), 동률 시 created_at 빠른 순 ③ 마커 그룹당 1개(primary 좌표·색상) ④ 카드 "+N" / "외 N명" ⑤ DetailPanel 영업진 탭 클릭 → setSelectedId → re-fetch ⑥ 영업진별 plan 독립(★프리미엄/◆디럭스 아이콘) |
| 04-29 (Week16) | **모바일 홈탭 카드 정렬**: 4곳(배너+신규오픈+인기+신규입점) 거리/동/상세지역 추가, 카테고리 별도 줄 고정(`min-h-[18px]` 빈자리 확보)으로 카드 높이 일관 |

---

## 10-1. 핵심 SOP — 신규 작업 시 즉시 트리거 (Week15~16 확정)

### subscription 활성 plan 판별 — 무조건 헬퍼 사용
```ts
import { getActivePlanFromList } from '@/lib/subscriptionPlan';

// ❌ 직접 비교 금지 — status='trial' 무료체험 회원 fallthrough
sub?.status === 'active' ? sub.plan : null

// ✅ 헬퍼 사용 — active + trial 둘 다 인정
const activePlan = getActivePlanFromList(business.subscriptions);
const isPremium = activePlan === 'premium' || activePlan === 'elite';
```
**이유**: P5 야사장 confirm-payment가 무료체험 시 status='trial'로 저장. 코드가 'active'만 체크하면 모든 체험 회원의 amber/배지 미반영. M-045 박멸 패턴.

### PostgREST 임플리시트 join 사용 금지
```ts
// ❌ FK 미인식 시 silent fail — 빈 배열 반환
.select('*, subscriptions(plan, status)')

// ✅ 명시적 별도 쿼리 + business_id IN [...] 매핑
const { data: subs } = await supabase
  .from('subscriptions')
  .select('business_id, plan, status')
  .in('business_id', ids);
const subsMap = new Map();
subs?.forEach(s => { ... });
businesses.forEach(b => { (b as any).subscriptions = subsMap.get(b.id) ?? []; });
```
**이유**: businesses↔subscriptions FK 인식 실패 → 에러 없이 빈 배열 반환. M-047 박멸 패턴.

### useEffect deps에 props/배열 직접 사용 금지 (지도 등 무거운 초기화)
```ts
// ❌ 매 렌더 새 reference → useEffect 무한 재실행 → 지도 깜빡임
useEffect(() => { /* 지도 초기화 */ }, [businesses, router]);

// ✅ 콜백 props는 ref로, 핵심 식별자는 signature로
const onMarkerClickRef = useRef(onMarkerClick);
useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);

const bizSignature = useMemo(
  () => businesses.map(b => `${b.id}:${b.lat ?? ''}:${b.lng ?? ''}:${b.subscriptions?.[0]?.plan ?? ''}`).join('|'),
  [businesses],
);
useEffect(() => { /* 지도 초기화 */ }, [bizSignature]);

// ✅ 부모에서 mappable 등 파생 배열은 useMemo로 안정화
const mappable = useMemo(() => filtered.filter(...), [filtered]);
```
M-046 박멸 패턴.

### 거리/구주소 동 표시 — `lib/geo.ts` + KakaoMap onGeocoded
```ts
// HomeClient에서:
const [userPos, setUserPos] = useState(null);  // navigator.geolocation 1회 시도
const [geocoded, setGeocoded] = useState(new Map());

<KakaoMapClient onGeocoded={(map) => setGeocoded(new Map(map))} />

// 카드 내부:
const geo = geocoded.get(biz.id);
const subRegion = geo?.region2 || (biz.address ? biz.address.trim().split(/\s+/)[1] : null);
const dongLabel = geo?.region3 ?? null;
const distanceLabel = userPos && geo
  ? formatDistance(haversineKm(userPos, { lat: geo.lat, lng: geo.lng }))
  : null;
```
- KakaoMap이 geocoding 끝나면 lat/lng + region2(시군구) + region3(법정동·구주소) 일괄 부모로 전달
- `coord2RegionCode`로 좌표→법정동 추출 (신주소 '검은들1길' → 구주소 '백석동')

### 그룹핑 표시 (Phase B — `business_reg_number` 기준)
- 같은 사업자번호 가진 영업진 여러 row → 화면에서 1개 그룹 카드/마커
- primary = plan 우선순위 최상위 (elite>premium>deluxe>special>standard>basic), 동률 시 created_at 빠른 순
- BusinessCard에 `memberCount` props, DetailPanel에 `groupMembers` + `onSelectMember` props
- 영업진 클릭 → `setSelectedId(memberId)` → DetailPanel 자체 fetch로 데이터 전환

---

## 11. 신규 테이블 (04-29 추가)

```
bamgil_reports    — 잘못된 정보 제보 (reason, content, contact, status)
bamgil_user_profiles — 손님 프로필 (nickname, email) — RLS 본인만
bamgil_favorites  — 찜하기 (user_id, business_id UNIQUE) — RLS 본인만
bamgil_reviews    — 리뷰/평점 (user_id, business_id UNIQUE, rating 1~5, content) — RLS 공개읽기/본인쓰기
```

---

## 12. 미완료 항목

### Phase 2 (단기 — 테스트 필요)
- ⏳ **클러스터 단일업소 '1' 표시** — 배치 수정 완료, Vercel 배포 후 실제 테스트 필요
- ⏳ **마커 색상/배지 반영** — service_role 전환 완료, 실제 테스트 필요

### Phase 3 (중기 — 미구현)
- ❌ 쿠폰 시스템 (bamgil_coupons: 업체 발급, 손님 수령)
- ❌ 입소신청 플로우 완성 (예약 가능 시간 선택 → DB 저장)
- ❌ 고급 필터 (가격대, 특징 등)
- ❌ 랭킹 페이지 (리뷰 평점 기반)
- ❌ 알림/푸시 (찜한 업체 업데이트 알림)
- ❌ 관리자 대시보드 고도화 (통계 차트, 유입 분석)

### Phase 4 — 앱화 로드맵
→ 상세: 아래 섹션 참조

---

## 13. 앱화 로드맵 (Phase 4)

### 목표
밤길 웹 → React Native(Expo) 네이티브 앱으로 전환. iOS/Android 동시 출시.

### 전략 원칙
- **웹 우선(Web-first)**: 현재 Next.js 웹을 완성 → 앱은 검증된 UI/로직을 포팅
- **Supabase 그대로 유지**: 동일 DB + Auth (Google OAuth → Expo Auth Session)
- **공유 가능 코드**: 비즈니스 로직(`lib/`), API routes(→ Supabase Edge Functions 전환 검토), 타입 정의

### 기술 스택 (예상)
| 항목 | 웹 | 앱 |
|------|----|----|
| 프레임워크 | Next.js 16 | Expo (React Native) |
| 지도 | 카카오맵 SDK | 카카오맵 SDK (iOS/Android) |
| 인증 | Supabase Auth + Google OAuth | Expo AuthSession + Supabase |
| 스타일 | Tailwind CSS v4 | NativeWind 또는 StyleSheet |
| 배포 | Vercel | EAS Build (App Store + Play Store) |

### 단계별 계획
1. **웹 기능 완성** (현재 진행 중) — Phase 2~3 완료 후
2. **Expo 프로젝트 초기화** — 기존 `src/lib/` 코드 공유 구조 설계
3. **핵심 화면 포팅**: 지도, 업소상세, 찜하기
4. **카카오맵 네이티브 연동**: `react-native-kakao-maps` 또는 WebView 래핑
5. **앱 전용 기능**: 푸시알림(Expo Notifications), 위치 서비스(Background Location)
6. **스토어 제출**: 유흥업소 관련 심사 정책 확인 필수 (18+ 연령 제한 설정)

> ⚠️ **앱 심사 주의**: 유흥업소 디렉토리 앱은 Google Play / App Store 심사에서 성인 컨텐츠 정책 확인 필수.
> 연령 제한(18+), 지역 제한, 카테고리 분류 등 사전 조사 후 출시 전략 수립.

---

## 14. 알려진 주의사항

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
- **geocoding 실패 fallback**: 1차 풀주소 실패 시 "시도 + 시군구"만 잘라 재시도 (KakaoMap.tsx `tryGeocode(biz, addr, 0)`)
- **subscription status='trial'은 active와 동등 취급** — `getActivePlanFromList()` 헬퍼 사용 필수 (`src/lib/subscriptionPlan.ts`)
- **PostgREST 임플리시트 join 사용 금지** — `subscriptions(plan, status)` 사용 시 빈 배열 silent fail. business_id IN [...] 별도 쿼리 + Map 매핑
- **HomeClient 파생 배열은 반드시 useMemo** (mappable, filteredGroups 등) — 안 그러면 KakaoMap 무한 재초기화로 지도 깜빡임
- **KakaoMap props 콜백은 ref로 분리** — onLoad/onMarkerClick/onGeocoded 모두 useRef로 보관, useEffect deps에서 제외 (router도 동일)
- **bizSignature 패턴**: businesses 변경 감지는 `id:lat:lng:plan:status` 문자열로 통합 → useEffect 재실행 최소화
- **MarkerClusterer minClusterSize: 1 필수** — 기본값 2면 단일 업소 클러스터 처리 안 됨 → 일반 marker로만 표시(투명 GIF라 안 보임)
- **마커 hover 시 z-index** — `overlay.setZIndex(9999)` on mouseenter / 원래값 복원 on mouseleave (다른 마커가 팝업 가림 방지)
- **사업자번호 그룹핑** — `business_reg_number` 기준으로 같은 사업자 영업진 1개 카드로 합침. 누락 시 b.id로 단독 그룹
- **필터링은 클라이언트 useState** — region/category 모두 setState로 즉시 필터링. URL 변경/새로고침 X. SSR은 활성 업소 500개 1회 fetch + provinceCounts/districtCounts 사전 계산
- **maskName 영문 대응** — 단어별 첫+끝 보존 + 가운데 모두 O (`Z**O H****N`)
- **카드 디자인 일관성** — 거리/동/카테고리 분리 줄 + `min-h-[18px]` 빈자리 확보로 카드 높이 정렬
- **Windows 빌드 명령**: `npx next build --webpack` (Turbopack은 win32 native binding 미지원)
