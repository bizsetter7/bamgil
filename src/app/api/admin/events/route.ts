import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'bizsetter7@gmail.com';
  return !!user && user.email === adminEmail;
}

/** GET /api/admin/events — 전체 이벤트 목록 (service_role) */
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: events, error } = await supabaseAdmin
    .from('business_events')
    .select('id, business_id, type, title, description, starts_at, ends_at, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const bizIds = [...new Set((events ?? []).map(e => e.business_id).filter(Boolean))];
  let bizMap = new Map<string, string>();
  if (bizIds.length > 0) {
    const { data: bizzes } = await supabaseAdmin
      .from('businesses')
      .select('id, name')
      .in('id', bizIds);
    bizMap = new Map((bizzes ?? []).map(b => [b.id as string, b.name as string]));
  }

  const result = (events ?? []).map(e => ({
    ...e,
    business_name: bizMap.get(e.business_id) ?? null,
  }));

  return NextResponse.json({ events: result });
}

/** PATCH /api/admin/events — is_active 토글 */
export async function PATCH(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, is_active } = await req.json() as { id: string; is_active: boolean };
  if (!id || typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'id, is_active 필수' }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from('business_events')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
