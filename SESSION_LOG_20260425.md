# P6 밤길 — 세션 로그 (2026-04-25)

> 다음 채팅에서 이 파일 먼저 읽고 시작할 것.

---

## ✅ 이번 세션에서 완료한 것

### 1. 모바일 UI 개선 (밤맵 스타일)
- `HomeClient.tsx` 모바일 카드 전면 재설계
  - 96×76px 썸네일 + "입점문의" 플레이스홀더 텍스트
  - 티어 배지 오버레이 (프리미엄=amber, 스탠다드=blue)
  - 지역명 한글 표기 (`REGION_LABELS` 적용)
  - 담당자명 마스킹 (`maskName()`)
  - 영업시간 `#해시태그` 형식

### 2. 담당자명 마스킹 (`maskName`)
- `src/lib/maskName.ts` 신규 생성
  - 규칙: `이름[0] + 'O' + 이름.slice(2)` → 김철훈 → 김O훈
- 적용 파일: `DetailPanel.tsx`, `places/[businessId]/page.tsx`

### 3. 지역명 영문 표시 버그 수정
- 4개 파일 모두 `REGION_LABELS` 추가/확장:
  - `HomeClient.tsx`
  - `DetailPanel.tsx`
  - `BusinessCard.tsx`
  - `places/[businessId]/page.tsx`

### 4. REGION_LABELS 전국 코드로 확장 (이번 세션)
- 기존: seoul/gyeonggi/incheon/busan/daegu/other
- 추가: daejeon/gwangju/ulsan/chungnam/chungbuk/jeonnam/jeonbuk/gangwon/gyeongnam/gyeongbuk/jeju
- 충남 = 충청남도, 충북 = 충청북도 (대표님 확인)

### 5. 카카오맵 핀 티어 시스템 (`KakaoMap.tsx`)
- CustomOverlay 방식으로 전환 (Marker → DOM element)
- premium: 주황 대형(20px), standard: 파란 중형(16px), basic: 회색 소형(12px)
- hover scale(1.25), click → router.push()
- 범례(legend) 우하단 표시

### 6. `places/[businessId]/page.tsx` 상세 페이지 개선
- 이미지 슬라이더 h-52 → h-72
- 퀵 인포 그리드 5칸 항상 표시 (null이면 dim 처리)
- 사진 그리드 3열 썸네일
- MiniKakaoMap h-40 → h-56
- 뒤로가기 버튼: 이미지 위 절대위치 (absolute top-4 left-4)
- 인증 배지: 이미지 하단 그라데이션 오버레이

### 7. P5 야사장 — 프라이싱 수정
- `Pricing.tsx`: 베이직(99k) / 스탠다드(199k) / 프리미엄(499k)
- 모바일 가로 스와이프 (snap-x snap-mandatory, w-[82vw])
- Hero.tsx / Features.tsx 콘텐츠 밤사장 대응 스타일로 교체

---

## ⏳ SQL 실행 필요 (Supabase SQL Editor에 붙여넣기)

**아직 실행 안 됨 — 다음 세션 시작 전 반드시 실행할 것**

```sql
-- 1. 뷰테라피
UPDATE businesses SET
  address        = '경기 수원시 영통구 반달로7번길 30',
  address_detail = '204호',
  manager_name   = '최태호',
  owner_id       = 'ed45f38d-7c32-4803-b859-f70268f20590',
  region_code    = 'gyeonggi'
WHERE name = '뷰테라피';

-- 2. 별테라피
UPDATE businesses SET
  address        = '경기 화성시 병점구 병점동로 110-7',
  address_detail = '진영빌 301호',
  manager_name   = '박민준',
  owner_id       = 'acf3f95e-145c-4e7f-916e-37a439e1c060',
  region_code    = 'gyeonggi'
WHERE name = '별테라피';

-- 3. 이안
UPDATE businesses SET
  address        = '경기 수원시 영통구 청명남로 32',
  address_detail = '302,303호',
  manager_name   = '강정훈',
  owner_id       = 'e5f862be-ecbe-4201-8200-dad12604a96f',
  region_code    = 'gyeonggi'
WHERE name = '이안';

-- 4. 에이 (충남 = chungnam)
UPDATE businesses SET
  address        = '충남 천안시 서북구 검은들1길 26',
  address_detail = '3층',
  manager_name   = '이지훈',
  owner_id       = '75b0f7e8-a1c2-43de-90f6-7d9c06e711aa',
  region_code    = 'chungnam'
WHERE name = '에이';

-- 5. 뷰테라피 업주 실명 반영 (profiles에 실명 없음)
UPDATE profiles SET
  full_name = '최태호',
  nickname  = '최태호'
WHERE id = 'ed45f38d-7c32-4803-b859-f70268f20590';
```

실행 후 확인:
```sql
SELECT id, name, manager_name, address, address_detail, region_code, owner_id
FROM businesses
WHERE name IN ('뷰테라피', '별테라피', '이안', '에이')
ORDER BY name;
```

---

## 📋 다음 세션 해야 할 것 (우선순위 순)

### 🔴 즉시
| 항목 | 내용 |
|------|------|
| SQL 실행 | 위의 5개 UPDATE 쿼리 Supabase에서 실행 |
| 빌드 확인 | `npm run build` 오류 없는지 확인 후 git push |

### 🟠 높음
| 항목 | 내용 |
|------|------|
| 위경도(lat/lng) 입력 | 4개 업소 주소로 카카오맵 좌표 확인 후 UPDATE |
| 관리자 로그인 | 밤길 어드민 페이지 없음 — 구축 필요 |
| 입점 파이프라인 | 업소 문의/신청 접수 페이지 (`/admin/leads`) |

### 🟡 중간
| 항목 | 내용 |
|------|------|
| P5 PaymentModal 가격 | 9.9만/19.9만/49.9만 → 9.9만/19.9만/49.9만 맞는지 재확인 |
| 코코알바 업주 자동 연동 | profiles.business_address → businesses.address 자동 반영 트리거 |
| 밤길 필터 — 충남 지역 탭 | HomeClient 지역 탭에 chungnam 추가 표시 |

### 🟢 낮음
| 항목 | 내용 |
|------|------|
| P9 웨이터존 / P10 선수존 | Vercel + DNS 연결 후 개발 착수 |
| 밤길 SEO | 메타태그, OG, sitemap 최적화 |

---

## 📁 핵심 파일 위치

| 파일 | 경로 |
|------|------|
| 지도 핀 | `src/components/map/KakaoMap.tsx` |
| 홈 클라이언트 (모바일 카드) | `src/components/home/HomeClient.tsx` |
| 상세 패널 | `src/components/home/DetailPanel.tsx` |
| 업소 카드 | `src/components/business/BusinessCard.tsx` |
| 상세 페이지 | `src/app/places/[businessId]/page.tsx` |
| 이름 마스킹 | `src/lib/maskName.ts` |

---

## 🗺️ 현재 DB 상태 (2026-04-25 기준)

| 업소명 | owner_id | address | manager_name | region_code |
|--------|----------|---------|-------------|-------------|
| 뷰테라피 | ed45f38d (미반영) | 미입력 | ytview5833 → **최태호** (SQL 후) | gyeonggi |
| 별테라피 | acf3f95e (미반영) | 미입력 | 박민준 | gyeonggi |
| 이안 | e5f862be (미반영) | 미입력 | 강정훈 | gyeonggi |
| 에이 | 75b0f7e8 (미반영) | 미입력 | 이지훈 | **chungnam** (SQL 후) |

→ SQL 실행 후 모두 반영됨

---

## 📌 참고 — Supabase 프로젝트
- **프로젝트 ID**: `ronqwailyistjuyolmyh`
- P2 코코알바 + P5 야사장 + P6 밤길 **같은 Supabase** 사용
- businesses 테이블: P6 밤길이 사용 (P2 shops 테이블과 별개)
- profiles 테이블: P2 코코알바 인증 데이터 (owner_id 연결용)
