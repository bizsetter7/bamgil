import { createClient } from '@/lib/supabase/server';
import { Phone, MessageSquare, TrendingUp, Calendar } from 'lucide-react';

const REGION_LABELS: Record<string, string> = {
  seoul: '서울', gyeonggi: '경기', incheon: '인천', busan: '부산',
  daegu: '대구', daejeon: '대전', gwangju: '광주', ulsan: '울산',
  chungnam: '충청남도', chungbuk: '충청북도', jeonnam: '전라남도',
  jeonbuk: '전라북도', gangwon: '강원', gyeongnam: '경상남도',
  gyeongbuk: '경상북도', jeju: '제주', other: '기타',
};

export default async function ContactsAdminPage() {
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    { count: totalContacts },
    { count: todayContacts },
    { count: callCount },
    { count: chatCount },
    { data: recentLogs },
    { data: weekLogs },
  ] = await Promise.all([
    supabase.from('bamgil_contacts').select('*', { count: 'exact', head: true }),
    supabase.from('bamgil_contacts').select('*', { count: 'exact', head: true }).gte('contacted_at', todayStart.toISOString()),
    supabase.from('bamgil_contacts').select('*', { count: 'exact', head: true }).eq('contact_type', 'call'),
    supabase.from('bamgil_contacts').select('*', { count: 'exact', head: true }).eq('contact_type', 'chat'),
    supabase.from('bamgil_contacts').select('business_id, contact_type, contacted_at').order('contacted_at', { ascending: false }).limit(50),
    supabase.from('bamgil_contacts').select('business_id').gte('contacted_at', weekStart.toISOString()),
  ]);

  // 주간 업소별 집계
  const weekMap: Record<string, number> = {};
  (weekLogs || []).forEach((c) => {
    weekMap[c.business_id] = (weekMap[c.business_id] || 0) + 1;
  });
  const topIds = Object.entries(weekMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id);

  let topList: any[] = [];
  if (topIds.length > 0) {
    const { data } = await supabase
      .from('businesses')
      .select('id, name, region_code, category, phone')
      .in('id', topIds);
    topList = (data || []).map((b) => ({ ...b, count: weekMap[b.id] || 0 })).sort((a, b) => b.count - a.count);
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">연락 통계</h1>
        <p className="text-zinc-500 text-sm mt-1">밤길을 통한 업소 연락 현황을 분석합니다.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '총 연락', value: totalContacts ?? 0, icon: TrendingUp, color: 'text-zinc-400' },
          { label: '오늘 연락', value: todayContacts ?? 0, icon: Calendar, color: 'text-amber-400' },
          { label: '전화 연락', value: callCount ?? 0, icon: Phone, color: 'text-green-400' },
          { label: '채팅 연락', value: chatCount ?? 0, icon: MessageSquare, color: 'text-blue-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <div className="text-3xl font-black text-white">{value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 주간 TOP 10 */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={15} className="text-amber-500" />
            <h2 className="text-sm font-black uppercase tracking-wider">이번 주 TOP 10 업소</h2>
          </div>
          {topList.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-8">데이터 없음</p>
          ) : (
            <div className="space-y-2.5">
              {topList.map((b, i) => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
                  <span className={`text-xs font-black w-5 text-center ${i < 3 ? 'text-amber-500' : 'text-zinc-600'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{b.name}</p>
                    <p className="text-[10px] text-zinc-500">{REGION_LABELS[b.region_code] || b.region_code} · {b.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-amber-500">{b.count}건</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 최근 50건 로그 */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Phone size={15} className="text-amber-500" />
            <h2 className="text-sm font-black uppercase tracking-wider">최근 연락 로그</h2>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {(recentLogs || []).length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-8">데이터 없음</p>
            ) : (
              (recentLogs || []).map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-zinc-800/50 rounded-xl">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                    c.contact_type === 'call'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-blue-500/15 text-blue-400'
                  }`}>
                    {c.contact_type === 'call' ? '전화' : '채팅'}
                  </span>
                  <span className="text-xs text-zinc-400 flex-1 truncate font-mono">{c.business_id.slice(0, 12)}…</span>
                  <span className="text-[10px] text-zinc-600 shrink-0">
                    {new Date(c.contacted_at).toLocaleString('ko-KR', {
                      month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
