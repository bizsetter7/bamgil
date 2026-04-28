import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/** 잘못된 정보 제보 API
 *  Body: { businessId, businessName, reason, content, contact? }
 *  → bamgil_reports 테이블에 INSERT
 *
 *  [Supabase SQL 필요]
 *  CREATE TABLE IF NOT EXISTS bamgil_reports (
 *    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *    business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
 *    business_name text,
 *    reason text NOT NULL,
 *    content text NOT NULL,
 *    contact text,
 *    status text DEFAULT 'pending',   -- pending | reviewed | resolved
 *    created_at timestamptz DEFAULT now()
 *  );
 */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, businessName, reason, content, contact } = body;

    if (!businessId || !reason || !content?.trim()) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('bamgil_reports')
      .insert({
        business_id: businessId,
        business_name: businessName,
        reason,
        content: content.trim(),
        contact: contact?.trim() || null,
        status: 'pending',
      });

    if (error) {
      console.error('Report insert error:', error);
      return NextResponse.json({ error: '제보 저장에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '서버 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
