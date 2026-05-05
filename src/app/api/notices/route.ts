import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/notices?platform=bamgil
 * 공개 공지사항 조회 — bamgil 플랫폼 대상 공지만 반환
 */
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('notices')
      .select('id, badge, title, content, is_pinned, published_at, expires_at, platforms')
      .eq('is_published', true)
      .contains('platforms', ['bamgil'])
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ notices: data ?? [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ notices: [], error: msg }, { status: 200 });
  }
}
