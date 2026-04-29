import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/** GET /api/reviews?businessId=xxx → { reviews, average, count, myReview? } */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');
  if (!businessId) return NextResponse.json({ reviews: [], average: 0, count: 0 });

  // FK 없이 안전하게: 리뷰 먼저 조회
  const { data: rawReviews } = await supabaseAdmin
    .from('bamgil_reviews')
    .select('id, rating, content, created_at, user_id')
    .eq('business_id', businessId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(30);

  const rawList = rawReviews ?? [];

  // 닉네임 일괄 조회 (user_id 목록)
  let nicknameMap: Record<string, string> = {};
  if (rawList.length > 0) {
    const userIds = [...new Set(rawList.map((r) => r.user_id as string))];
    const { data: profiles } = await supabaseAdmin
      .from('bamgil_user_profiles')
      .select('id, nickname')
      .in('id', userIds);
    if (profiles) {
      nicknameMap = Object.fromEntries(profiles.map((p) => [p.id, p.nickname]));
    }
  }

  const list = rawList.map((r) => ({
    ...r,
    bamgil_user_profiles: { nickname: nicknameMap[r.user_id] ?? '익명' },
  }));

  const count = list.length;
  const average =
    count > 0
      ? Math.round((list.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
      : 0;

  // 현재 로그인 유저의 리뷰
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const myReview = user ? (list.find((r) => r.user_id === user.id) ?? null) : null;

  return NextResponse.json({ reviews: list, average, count, myReview });
}

/** POST /api/reviews → 리뷰 작성/수정 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { businessId, rating, content } = await req.json();
  if (!businessId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }

  // 기존 리뷰 확인 (1인 1리뷰)
  const { data: existing } = await supabaseAdmin
    .from('bamgil_reviews')
    .select('id')
    .eq('user_id', user.id)
    .eq('business_id', businessId)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from('bamgil_reviews')
      .update({ rating, content: content?.trim() ?? '', is_visible: true })
      .eq('id', existing.id);
  } else {
    await supabaseAdmin.from('bamgil_reviews').insert({
      user_id: user.id,
      business_id: businessId,
      rating,
      content: content?.trim() ?? '',
      is_visible: true,
    });
  }

  return NextResponse.json({ ok: true });
}
