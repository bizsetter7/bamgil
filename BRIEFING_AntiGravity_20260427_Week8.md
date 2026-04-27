# BRIEFING — 안티그래비티 | P6 밤길 Week 8
발행: 코부장(Claude Code) | 날짜: 2026-04-27

---

## 📋 오늘 코부장이 직접 완료한 사항 (참고)

### P5 야사장
- OCR API `docType` 분기: 영업허가증 → `license_number`·`floor_area` 추출
- RegisterForm: `handlePermitOcr()` + 영업허가증 카드에 AI 자동입력 버튼(에메랄드)
- Register API: `business_reg_number`, `license_number`, `floor_area` businesses 테이블 저장

### P6 밤길
- `DetailPanel.tsx`: 검증 배지 → "영업허가 확인 · 합법적인 인증업체", 카테고리 → "지역·업종", 전화 '전화' 텍스트 제거, "전체 정보 보기" 링크 제거, 업소 소개(description) 섹션 추가
- `places/[businessId]/page.tsx`: 동일 배지·카테고리·전화 수정, `maskSensitiveNumber()` 추가, 기본 정보에 영업허가번호·사업자번호(마스킹) 표시
- `BottomCtaBar.tsx`: 관리자 버튼 제거 (존재하지 않는 라우트 `/dashboard/businesses/` 연결이었음)

### Supabase SQL (대표님 실행 완료)
```sql
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS business_reg_number TEXT,
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS floor_area TEXT;
```

---

## 🎯 안티그래비티 Week 8 작업 목록

### [이월] Week 7 미완료 — 최우선 처리

#### Task W7-1: P2 코코알바 ShopDetailView 진입점 6개 교체
- 파일: `AdDetailModal`, `admin/page.tsx`, `/coco/[region]/[id]/`, `/jobs/[id]/`, `JobDetailModal`
- `anyAdToShop()` 유지, `generateStaticParams` 유지, `JobDetailContent` 삭제 금지
- ShopDetailView 히어로+안심섹션+아코디언+탭+CTA 스타일로 통일

#### Task W7-2: P2 ShopDetailView cocoalba_tier 배지
- client-side Supabase 조회로 tier 가져와서 배지 표시

#### Task W7-3: P9 웨이터존 GitHub + Vercel + waiterzone.kr DNS 연결 + 로그인모달 + 구인목록
- GitHub repo: bizsetter7/waiterzone
- Vercel 프로젝트 생성 + waiterzone.kr DNS A레코드(76.76.21.21) + CNAME(www→cname.vercel-dns.com)

---

### [신규] Week 8 — P6 밤길

#### Task 8-1: P6 모바일 리스트뷰 개선 (HomeClient.tsx)
현재 좌측 리스트에서 업체 카드를 클릭하면 `/places/[businessId]` 별도 페이지로 이동함.
모바일에서도 지도가 숨겨지고 우측 DetailPanel이 슬라이드-인 되는 방식으로 변경하여
페이지 이동 없이 앱처럼 작동하도록 개선.

**구현 방향**:
- 모바일(`< lg`)에서 업체 카드 클릭 → 지도 영역 hide + DetailPanel이 전체화면으로 슬라이드
- 뒤로 버튼 클릭 → 리스트뷰로 복귀
- `/places/[businessId]` 직접 URL은 SEO용으로 유지 (삭제 금지)

#### Task 8-2: P6 밤길 git push + Vercel 재배포
오늘 코부장이 수정한 파일들(DetailPanel, page.tsx, BottomCtaBar) push 필요.
```bash
cd D:\토탈프로젝트\My-site\p6.밤길
git add src/components/home/DetailPanel.tsx
git add src/app/places/[businessId]/page.tsx
git add src/app/places/[businessId]/BottomCtaBar.tsx
git commit -m "feat(P6): DetailPanel 전체정보통합 + 배지·카테고리·전화 개선 + 관리자버튼 제거"
git push
```

#### Task 8-3: P5 야사장 git push + Vercel 재배포
오늘 수정 파일: `api/ocr/route.ts`, `RegisterForm.tsx`, `api/register/route.ts`
```bash
cd D:\토탈프로젝트\My-site\p5.야사장
git add src/app/api/ocr/route.ts
git add src/components/register/RegisterForm.tsx
git add src/app/api/register/route.ts
git commit -m "feat(P5): 영업허가증 OCR(허가번호·면적) + register API 신규 컬럼 저장"
git push
```

---

## ✅ 완료 조건

| Task | 완료 기준 |
|------|-----------|
| W7-1 | P2 빌드 통과 + ShopDetailView 6개 진입점 희야야 스타일 적용 확인 |
| W7-2 | ShopDetailView에 cocoalba_tier 배지 노출 확인 |
| W7-3 | waiterzone.kr 접속 확인 + 로그인 모달 작동 + 구인 목록 노출 |
| 8-1 | 모바일에서 업체 카드 클릭 시 DetailPanel 슬라이드 확인 |
| 8-2 | bamgil.kr 배포 후 변경사항 반영 확인 |
| 8-3 | yasajang.kr 배포 후 영업허가증 OCR 버튼 노출 확인 |

---

## 📎 보고 형식
완료 후 `REPORT_AntiGravity_20260427_Week8.md` 파일로 결과 보고.
빌드 Exit Code, 실제 확인한 URL, 미완료 사유 포함.
