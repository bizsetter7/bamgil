import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** GET /api/events?businessId=xxx → 해당 업소의 활성 이벤트 목록 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');
  if (!businessId) return NextResponse.json({ events: [] });

  const now = new Date().toISOString();
  const svc = getAdmin();

  const { data, error } = await svc
    .from('business_events')
    .select('id, title, description, event_type, starts_at, ends_at')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order('starts_at', { ascending: true });

  if (error) {
    console.error('[GET /api/events] error:', error);
    return NextResponse.json({ events: [] });
  }

  return NextResponse.json({ events: data ?? [] });
}
