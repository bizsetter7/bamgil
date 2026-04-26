# BRIEFING_AntiGravity_20260426_Week7_Hotfix

> **대상**: P6 밤길  
> **유형**: 버그픽스 (Week7 작업보고 검증 후 발견)  
> **우선순위**: 🔴 즉시 수정  
> **날짜**: 2026-04-26

---

## 배경

Week 7 작업보고 검증 결과 2가지 버그 발견.
**수정 완료 후 `npm run build` 실행 → 빌드 결과 캡처 → 재보고 필수.**

---

## Bug 1 — `[region]` 페이지 SSG 미작동 (Dynamic으로 동작 중)

### 문제

`src/app/[region]/page.tsx`에서 `@/lib/supabase/server`의 `createClient()`를 사용 중.
이 함수는 내부적으로 Next.js `cookies()`를 호출하기 때문에,
`generateStaticParams`가 있어도 Next.js가 강제로 Dynamic(ƒ) 처리함.

실제 빌드 결과:
```
ƒ /[region]   ← Dynamic. SSG가 아님.
```

보고서에서는 SSG라 했으나 실제로는 요청마다 서버 렌더링 = SEO 효과 반감, 성능 저하.

### 수정 방법

`src/app/[region]/page.tsx` 상단 import와 DB 조회 부분을 교체.

**현재 코드:**
```ts
import { createClient } from '@/lib/supabase/server';
// ...
const supabase = await createClient();
```

**수정 코드:**
```ts
import { createClient } from '@supabase/supabase-js';
// ...
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

파일 최상단에 revalidate도 추가:
```ts
export const revalidate = 3600; // 1시간마다 재생성
```

수정 후 빌드 결과에서 `/[region]`이 `●` (SSG) 또는 `ISR`로 표시되어야 정상.

---

## Bug 2 — `businesses` 테이블에 `tc_price` 컬럼 없음

### 문제

`src/app/[region]/page.tsx`에서 `tc_price`를 조회하고 있으나,
`businesses` 테이블에 해당 컬럼이 존재하지 않음 (실제 DB 스키마 확인 완료).

```ts
// 현재 — tc_price 컬럼 없어서 항상 undefined → TC 미표시
.select('id, name, region, address, tc_price, views')
```

### 수정 방법

`tc_price` 제거, 실제 존재하는 컬럼으로 교체:

```ts
.select('id, name, category, address, views, description')
```

TC 표시 블록은 제거하고 대신 `category`(업종)로 교체:
```tsx
{/* 기존 */}
{biz.tc_price && (
  <p className="text-pink-400 font-bold text-sm mt-auto">TC: {Number(biz.tc_price).toLocaleString()}원</p>
)}

{/* 수정 — 업종 뱃지로 교체 */}
{biz.category && (
  <span className="text-xs font-bold text-pink-400/80 bg-pink-500/10 px-2 py-1 rounded-lg mt-auto self-start">
    {biz.category}
  </span>
)}
```

---

## 완료 기준

- [ ] `npm run build` 실행
- [ ] 빌드 결과에서 `/[region]`이 `●` 또는 ISR 표시 확인
- [ ] `ƒ /[region]` 사라진 것 확인
- [ ] Exit code 0 확인
- [ ] 본 파일 경로에 REPORT 파일 재작성
