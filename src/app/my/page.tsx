import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Heart, Star, Moon, Building2, ExternalLink } from 'lucide-react';

const REGION_LABELS: Record<string, string> = {
  seoul: '서울', gyeonggi: '경기', incheon: '인천',
  busan: '부산', daegu: '대구', daejeon: '대전', gwangju: '광주', ulsan: '울산',
  chungnam: '충청남도', chungbuk: '충청북도', jeonnam: '전라남도', jeonbuk: '전라북도',
  gangwon: '강원도', gyeongnam: '경상남도', gyeongbuk: '경상북도', jeju: '제주도',
  other: '기타',
};

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const [{ data: profile }, { data: favorites }, { data: reviews }] = await Promise.all([
    supabase
      .from('bamgil_user_profiles')
      .select('nickname, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('bamgil_favorites')
      .select('business_id, created_at, businesses(id, name, category, region_code, cover_image_url, address)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('bamgil_reviews')
      .select('id, rating, content, created_at, businesses(id, name, category)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  const nickname = profile?.nickname ?? '손님';
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
    : '';

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* ── 프로필 헤더 ── */}
        <header className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-black text-2xl font-black shrink-0 shadow-sm">
              {nickname[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-gray-900">{nickname}</h1>
              <p className="text-gray-400 text-sm">{user.email}</p>
              {joinDate && (
                <p className="text-gray-400 text-xs mt-1">
                  <Moon size={10} className="inline mr-1" />
                  {joinDate} 가입
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-black text-gray-900">{favorites?.length ?? 0}</div>
              <div className="text-xs text-gray-400 font-medium">찜한 업소</div>
              <div className="text-2xl font-black text-gray-900 mt-1">{reviews?.length ?? 0}</div>
              <div className="text-xs text-gray-400 font-medium">작성 리뷰</div>
            </div>
          </div>

          {/* 업체 전환 배너 */}
          <a
            href="https://www.yasajang.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3 group"
          >
            <div className="w-9 h-9 bg-gray-100 group-hover:bg-amber-50 rounded-xl flex items-center justify-center shrink-0 transition-colors">
              <Building2 size={16} className="text-gray-500 group-hover:text-amber-600 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-800">업체 사장님이신가요?</p>
              <p className="text-xs text-gray-400 mt-0.5">야사장에서 무료로 업소 등록 · 구독 관리</p>
            </div>
            <ExternalLink size={14} className="text-gray-300 group-hover:text-amber-500 shrink-0 transition-colors" />
          </a>
        </header>

        {/* ── 찜한 업소 ── */}
        <section>
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Heart size={12} className="text-pink-500" />
            찜한 업소 ({favorites?.length ?? 0})
          </h2>
          {!favorites?.length ? (
            <div className="bg-white border border-gray-200 rounded-2xl py-12 text-center">
              <Heart size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm">아직 찜한 업소가 없어요.</p>
              <Link href="/" className="inline-block mt-4 text-amber-500 font-bold text-sm hover:underline">
                업소 탐색하기 →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {favorites.map((f) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const biz = (f.businesses as unknown) as {
                  id: string; name: string; category: string;
                  region_code: string; cover_image_url: string | null; address: string | null;
                } | null;
                if (!biz) return null;
                const region = REGION_LABELS[biz.region_code] ?? biz.region_code;
                const sub = biz.address ? (biz.address.trim().split(/\s+/)[1] ?? null) : null;
                const location = sub ? `${region} ${sub}` : region;
                return (
                  <Link
                    key={f.business_id}
                    href={`/places/${biz.id}`}
                    className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-2xl hover:border-amber-300 hover:shadow-sm transition-all"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {biz.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={biz.cover_image_url} alt={biz.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate">{biz.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{biz.category} · {location}</p>
                    </div>
                    <Heart size={16} className="text-pink-500 fill-pink-500 shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── 내가 쓴 리뷰 ── */}
        <section>
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Star size={12} className="text-amber-500" />
            내가 쓴 리뷰 ({reviews?.length ?? 0})
          </h2>
          {!reviews?.length ? (
            <div className="bg-white border border-gray-200 rounded-2xl py-12 text-center">
              <Star size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm">아직 작성한 리뷰가 없어요.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reviews.map((r) => {
                const biz = (r.businesses as unknown) as { id: string; name: string; category: string } | null;
                return (
                  <div key={r.id} className="p-4 bg-white border border-gray-200 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <Link href={`/places/${biz?.id}`} className="font-black text-gray-900 hover:text-amber-600 transition-colors text-sm">
                        {biz?.name}
                        <span className="text-gray-400 font-normal ml-1.5">{biz?.category}</span>
                      </Link>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                          />
                        ))}
                        <span className="text-xs font-bold text-amber-500 ml-1">{r.rating}.0</span>
                      </div>
                    </div>
                    {r.content && <p className="text-gray-600 text-sm leading-relaxed">{r.content}</p>}
                    <p className="text-gray-400 text-[10px] mt-2">
                      {new Date(r.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
