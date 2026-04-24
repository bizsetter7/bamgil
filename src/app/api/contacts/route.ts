import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// service_role 사용 — anon은 RLS로 막힘
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const { businessId, contactType } = await request.json();
    
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('bamgil_contacts').insert({
      business_id: businessId,
      contact_type: contactType ?? 'call',
      contacted_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to log contact to DB:', error);
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Contact API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
