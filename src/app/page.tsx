import { createClient } from '@supabase/supabase-js';
import HomeClient from '@/components/home/HomeClient';

// service_role 사용 — subscriptions 테이블 RLS 우회 (배지 표시용 공개 읽기)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; category?: string }>;
}) {
  // searchParams는 초기 진입 시점의 region/category — 클라이언트에서 즉시 필터링하므로
  // 서버 단계에서는 적용하지 않음 (지역/카테고리 변경 시 새로고침 없이 즉시 반영)
  const { region: initialRegion, category: initialCategory } = await searchParams;

  // 1) 활성 업소 전체 fetch (지역·카테고리 필터 없이)
  const { data: businesses } = await supabaseAdmin
    .from('businesses')
    .select('id, name, category, region_code, address, lat, lng, phone, open_chat_url, cover_image_url, manager_name, business_hours, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(500);

  // 2) subscriptions 별도 쿼리 (PostgREST 임플리시트 join 회피)
  let businessesWithSubs = businesses ?? [];
  if (businessesWithSubs.length > 0) {
    const ids = businessesWithSubs.map((b) => b.id);
    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('business_id, plan, status')
      .in('business_id', ids);

    const subsMap = new Map<string, { plan: string; status: string }[]>();
    (subs ?? []).forEach((s) => {
      const list = subsMap.get(s.business_id) ?? [];
      list.push({ plan: s.plan, status: s.status });
      subsMap.set(s.business_id, list);
    });

    businessesWithSubs = businessesWithSubs.map((b) => ({
      ...b,
      subscriptions: subsMap.get(b.id) ?? [],
    }));
  }

  // 3) 지역/구군 카운트 (전체 활성 업소 기준 — 신규 입점 시 자동 반영)
  const provinceCounts: Record<string, number> = {};
  const districtCounts: Record<string, Record<string, number>> = {};
  businessesWithSubs.forEach((b) => {
    if (!b.region_code) return;
    provinceCounts[b.region_code] = (provinceCounts[b.region_code] ?? 0) + 1;
    if (b.address) {
      const sub = b.address.trim().split(/\s+/)[1];
      if (sub) {
        if (!districtCounts[b.region_code]) districtCounts[b.region_code] = {};
        districtCounts[b.region_code][sub] = (districtCounts[b.region_code][sub] ?? 0) + 1;
      }
    }
  });

  return (
    <HomeClient
      businesses={businessesWithSubs}
      initialRegion={initialRegion}
      initialCategory={initialCategory}
      provinceCounts={provinceCounts}
      districtCounts={districtCounts}
    />
  );
}
