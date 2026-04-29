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
    .select('*')
    .eq('id', businessId)
    .single();

  if (error) {
    console.error('Business detail fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // subscriptions 별도 쿼리 (PostgREST 임플리시트 join FK 인식 실패 회피)
  const { data: subs } = await supabaseAdmin
    .from('subscriptions')
    .select('plan, status, plan_name, billing_period, period_months, payment_reference, confirmed_at')
    .eq('business_id', businessId);

  return NextResponse.json({ business: { ...data, subscriptions: subs ?? [] } });
}
