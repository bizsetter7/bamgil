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
    .select('id, name, category, region_code, address, lat, lng, phone, open_chat_url, cover_image_url, manager_name, business_hours, created_at, subscriptions(plan, status)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (region) query = query.eq('region_code', region);
  if (category) query = query.eq('category', category);

  const { data: businesses } = await query.limit(50);

  return (
    <HomeClient
      businesses={businesses ?? []}
      region={region}
      category={category}
    />
  );
}
