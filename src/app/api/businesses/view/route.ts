import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { businessId } = await request.json();
    if (!businessId) return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });

    const supabase = await createClient();
    
    // RPC가 없으면 에러가 날 수 있으므로, update로 시도하거나 RPC를 먼저 생성해야 함.
    // 여기서는 rpc('increment_views', { row_id: businessId })가 있다고 가정하거나
    // 직접 update를 시도 (경쟁 상태 위험이 있으나 간단한 구현)
    
    const { data: current } = await supabase
      .from('businesses')
      .select('views')
      .eq('id', businessId)
      .single();
    
    const newViews = (current?.views || 0) + 1;
    
    const { error } = await supabase
      .from('businesses')
      .update({ views: newViews })
      .eq('id', businessId);

    if (error) throw error;

    return NextResponse.json({ ok: true, views: newViews });
  } catch (err: any) {
    console.error('View increment error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
