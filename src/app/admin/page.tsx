import { createClient } from '@/lib/supabase/server';
import { Building2, Phone, MapPin, TrendingUp, Star } from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = await createClient();

  // 업소 현황
  const [
    { count: totalCount },
    { count: activeCount },
    { count: pendingCount },
    { data: recentContacts },
    { data: topBusinesses },
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('bamgil_contacts')
      .select('business_id, contact_type, contacted_at')
      .order('contacted_at', { ascending: false })
      .limit(10),
    supabase
      .from('bamgil_contacts')
      .select('business_id')
      .gte('contacted_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  // 주간 업소별 연락 집계
  const contactMap: Record<string, number> = {};
  (topBusinesses || []).forEach((c) => {
    contactMap[c.business_id] = (contactMap[c.business_id] || 0) + 1;
  });
  const sortedIds = Object.entries(contactMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  let hotBusinesses: any[] = [];
  if (sortedIds.length > 0) {
    const { data } = await supabase
      .from('businesses')
      .select('id, name, region_code, category')
      .in('id', sortedIds);
    hotBusinesses = (data || []).map((b) => ({ ...b, count: contactMap[b.id] || 0 }))
      .sort((a, b) => b.count - a.count);
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase
    .from('bamgil_contacts')
    .select('*', { count: 'exact', head: true })
    .gte('contacted_at', todayStart.toISOString());

  const stats = [
    { label: '전체 업소', value: totalCount ?? 0, icon: Building2, color: 'text-zinc-400' },
    { label: '활성 업소', value: activeCount ?? 0, icon: Star, color: 'text-amber-400' },
    { label: '심사 대기', value: pendingCount ?? 0, icon: MapPin, color: 'text-orange-400' },
    { label: '오늘 연락', value: todayCount ?? 0, icon: Phone, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">대시보드</h1>
        <p className="text-zinc-500 text-sm mt-1">밤길 운영 현황을 한눈에 확인합니다.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
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
        {/* 이번 주 인기 업소 */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-amber-500" />
            <h2 className="text-sm font-black uppercase tracking-wider">이번 주 인기 업소 TOP 5</h2>
          </div>
          {hotBusinesses.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-8">데이터 없음</p>
          ) : (
            <div className="space-y-3">
              {hotBusinesses.map((b, i) => (
                <div key={b.id} className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-xl">
                  <span className="text-xs font-black text-zinc-500 w-5 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{b.name}</p>
                    <p className="text-[11px] text-zinc-500">{b.region_code} · {b.category}</p>
                  </div>
                  <span className="text-xs font-black text-amber-500">{b.count}건</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 최근 연락 로그 */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Phone size={16} className="text-amber-500" />
            <h2 className="text-sm font-black uppercase tracking-wider">최근 연락 로그</h2>
          </div>
          {(recentContacts || []).length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-8">데이터 없음</p>
          ) : (
            <div className="space-y-2">
              {recentContacts!.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-zinc-800/50 rounded-xl">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    c.contact_type === 'call'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-blue-500/15 text-blue-400'
                  }`}>
                    {c.contact_type === 'call' ? '전화' : '채팅'}
                  </span>
                  <span className="text-xs text-zinc-400 truncate flex-1">{c.business_id.slice(0, 8)}…</span>
                  <span className="text-[11px] text-zinc-600 shrink-0">
                    {new Date(c.contacted_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
