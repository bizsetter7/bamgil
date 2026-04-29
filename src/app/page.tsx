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
  const { region, category } = await searchParams;

  let query = supabaseAdmin
    .from('businesses')
    .select('id, name, category, region_code, address, lat, lng, phone, open_chat_url, cover_image_url, manager_name, business_hours, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (region) query = query.eq('region_code', region);
  if (category) query = query.eq('category', category);

  const { data: businesses } = await query.limit(50);

  // subscriptions는 PostgREST 임플리시트 join이 FK 인식 실패로 빈 배열 반환 →
  // 명시적 별도 쿼리 후 business_id 기준 매핑 (P5 패턴 동일)
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

  return (
    <HomeClient
      businesses={businessesWithSubs}
      region={region}
      category={category}
    />
  );
}
