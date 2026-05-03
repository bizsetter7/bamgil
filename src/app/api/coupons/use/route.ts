import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/** POST /api/coupons/use — 쿠폰 사용 처리 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

  const { couponId } = await req.json();
  if (!couponId) return NextResponse.json({ error: '쿠폰 ID 필요' }, { status: 400 });

  // 쿠폰 유효성 확인
  const now = new Date().toISOString();
  const { data: coupon, error: couponError } = await supabaseAdmin
    .from('bamgil_coupons')
    .select('id, max_uses, used_count, valid_until, is_active, min_visit_count')
    .eq('id', couponId)
    .single();

  if (couponError || !coupon) return NextResponse.json({ error: '존재하지 않는 쿠폰' }, { status: 404 });
  if (!coupon.is_active) return NextResponse.json({ error: '비활성 쿠폰' }, { status: 400 });
  if (coupon.valid_until && coupon.valid_until < now) return NextResponse.json({ error: '만료된 쿠폰' }, { status: 400 });
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) return NextResponse.json({ error: '사용 한도 초과' }, { status: 400 });

  // 중복 사용 체크 (UNIQUE(coupon_id, user_id) 제약으로도 막히지만 명시적으로 확인)
  const { data: existing } = await supabaseAdmin
    .from('bamgil_coupon_uses')
    .select('id')
    .eq('coupon_id', couponId)
    .eq('user_id', user.id)
    .single();

  if (existing) return NextResponse.json({ error: '이미 사용한 쿠폰' }, { status: 400 });

  // 사용 기록 INSERT
  const { error: useError } = await supabaseAdmin
    .from('bamgil_coupon_uses')
    .insert({ coupon_id: couponId, user_id: user.id });

  if (useError) {
    if (useError.code === '23505') return NextResponse.json({ error: '이미 사용한 쿠폰' }, { status: 400 });
    console.error('[POST /api/coupons/use] insert error:', useError);
    return NextResponse.json({ error: useError.message }, { status: 500 });
  }

  // used_count 증가
  await supabaseAdmin
    .from('bamgil_coupons')
    .update({ used_count: coupon.used_count + 1 })
    .eq('id', couponId);

  return NextResponse.json({ success: true });
}
