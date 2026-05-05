import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/** GET /api/coupons?businessId=xxx → 해당 업소의 활성 쿠폰 목록 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');
  if (!businessId) return NextResponse.json({ coupons: [] });

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('bamgil_coupons')
    .select('id, title, description, discount_type, discount_value, max_uses, used_count, min_visit_count, valid_until')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .or(`valid_until.is.null,valid_until.gte.${now}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[GET /api/coupons] error:', error);
    return NextResponse.json({ coupons: [] });
  }

  // 세션 유저가 이미 사용한 쿠폰 조회
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let usedIds: string[] = [];
  if (user && data && data.length > 0) {
    const couponIds = data.map(c => c.id);
    const { data: uses } = await supabaseAdmin
      .from('bamgil_coupon_uses')
      .select('coupon_id')
      .eq('user_id', user.id)
      .in('coupon_id', couponIds);
    usedIds = uses?.map(u => u.coupon_id) ?? [];
  }

  const coupons = (data ?? []).map(c => ({
    ...c,
    alreadyUsed: usedIds.includes(c.id),
    isFull: c.max_uses !== null && c.used_count >= c.max_uses,
  }));

  return NextResponse.json({ coupons });
}

/** POST /api/coupons — 업체 어드민이 쿠폰 발급 (business_id 본인 확인 필요) */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

  const body = await req.json();
  const { businessId, title, description, discountType, discountValue, maxUses, minVisitCount, validUntil } = body;

  if (!businessId || !title || !discountType || !discountValue) {
    return NextResponse.json({ error: '필수값 누락' }, { status: 400 });
  }

  // 업소 소유자 확인
  const { data: biz } = await supabaseAdmin
    .from('businesses')
    .select('id, owner_id')
    .eq('id', businessId)
    .single();

  if (!biz || biz.owner_id !== user.id) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 });
  }

  // 랜덤 쿠폰 코드 생성 (8자리 영문+숫자)
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();

  const { data, error } = await supabaseAdmin
    .from('bamgil_coupons')
    .insert({
      business_id: businessId,
      code,
      title,
      description: description ?? null,
      discount_type: discountType,
      discount_value: discountValue,
      max_uses: maxUses ?? null,
      min_visit_count: minVisitCount ?? 0,
      valid_until: validUntil ?? null,
      is_active: true,
    })
    .select('id, code')
    .single();

  if (error) {
    console.error('[POST /api/coupons] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, coupon: data });
}
