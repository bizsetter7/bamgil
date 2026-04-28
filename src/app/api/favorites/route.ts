import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/** GET /api/favorites?businessId=xxx → { favorited: boolean } */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ favorited: false });

  const businessId = req.nextUrl.searchParams.get('businessId');
  if (!businessId) return NextResponse.json({ favorited: false });

  const { data } = await supabase
    .from('bamgil_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('business_id', businessId)
    .maybeSingle();

  return NextResponse.json({ favorited: !!data });
}

/** POST /api/favorites → { favorited: boolean } 토글 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { businessId } = await req.json();
  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

  // 이미 찜했는지 확인
  const { data: existing } = await supabase
    .from('bamgil_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('business_id', businessId)
    .maybeSingle();

  if (existing) {
    await supabase.from('bamgil_favorites').delete().eq('id', existing.id);
    return NextResponse.json({ favorited: false });
  } else {
    await supabase.from('bamgil_favorites').insert({
      user_id: user.id,
      business_id: businessId,
    });
    return NextResponse.json({ favorited: true });
  }
}
