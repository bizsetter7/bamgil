import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/** GET /api/businesses/detail?id=xxx */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('id');
  if (!businessId) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('businesses')
    .select('*, subscriptions(*)')
    .eq('id', businessId)
    .single();

  if (error) {
    console.error('Business detail fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ business: data });
}
