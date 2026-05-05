import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** GET /api/business-notices?businessId=xxx → 해당 업소의 활성 공지 목록 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');
  if (!businessId) return NextResponse.json({ notices: [] });

  const svc = getAdmin();
  const { data, error } = await svc
    .from('business_notices')
    .select('id, title, content, is_pinned, created_at')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[GET /api/business-notices] error:', error);
    return NextResponse.json({ notices: [] });
  }

  return NextResponse.json({ notices: data ?? [] });
}
