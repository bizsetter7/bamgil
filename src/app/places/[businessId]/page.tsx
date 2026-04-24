import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ContactButton from './ContactButton';
import { MapPin, Phone, MessageSquare, ChevronLeft, ShieldCheck, User, Users, Star, Check } from 'lucide-react';
import Link from 'next/link';

const CATEGORY_LABELS: Record<string, string> = {
  room_salon: '룸살롱', karaoke_bar: '노래방', bar: '바/주점',
  night_club: '나이트', hostbar: '호스트바', general: '일반', other: '기타',
};

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('*, managers(*), subscriptions(*)')
    .eq('id', businessId)
    .eq('is_active', true)
    .single();

  if (!business) notFound();

  const subscription = business.subscriptions?.[0];
  const isActive = subscription?.status === 'active';

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 탐색으로 돌아가기
        </Link>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px]" />
          
          <div className="flex items-start justify-between relative">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase tracking-widest">
                  {CATEGORY_LABELS[business.category] ?? business.category}
                </span>
                <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck size={10} /> 검증완료
                </span>
                
                {/* 구독 플랜 배지 */}
                {isActive && subscription.plan === 'premium' && (
                  <span className="text-[10px] font-black text-white bg-amber-500 px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-amber-500/20">
                    <Star size={10} fill="white" /> 프리미엄 파트너
                  </span>
                )}
                {isActive && subscription.plan === 'standard' && (
                  <span className="text-[10px] font-black text-white bg-blue-600 px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                    <Check size={10} /> 공식 파트너
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {business.name}
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-3 relative">
            <div className="flex items-center gap-2 text-zinc-400 font-medium">
              <MapPin size={18} className="text-zinc-600" />
              <span>{business.address || business.region_code}</span>
            </div>
            {business.address_detail && (
              <p className="text-sm text-zinc-500 ml-6">{business.address_detail}</p>
            )}
          </div>
        </section>

        {/* Action Buttons */}
        <section className="grid grid-cols-1 gap-4">
          {business.phone && (
            <ContactButton
              businessId={businessId}
              type="call"
              href={`tel:${business.phone}`}
              label="전화 연락하기"
            />
          )}
          {business.open_chat_url && (
            <ContactButton
              businessId={businessId}
              type="chat"
              href={business.open_chat_url}
              label="카카오 오픈채팅 상담"
            />
          )}
        </section>

        {/* Managers Section */}
        {business.managers && business.managers.length > 0 && (
          <section className="space-y-6 pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                <Users size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">현장 담당자</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {business.managers.filter((m: any) => m.is_active).map((manager: any) => (
                <div key={manager.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5 flex items-center gap-4 hover:border-zinc-700 transition-all">
                  <div className="relative">
                    {manager.photo_url ? (
                      <img src={manager.photo_url} alt="" className="w-14 h-14 rounded-2xl object-cover border border-zinc-800 shadow-lg" />
                    ) : (
                      <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-600">
                        <User size={24} />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-zinc-900 rounded-full" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-lg leading-tight">{manager.name}</h4>
                    <p className="text-zinc-500 text-sm font-medium">{manager.role || '담당 매니저'}</p>
                  </div>
                  <button className="ml-auto p-3 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-2xl transition-all">
                    <MessageSquare size={20} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Extra Info (Mock for now) */}
        <section className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] space-y-4">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">이용 안내</h3>
          <p className="text-zinc-500 text-sm leading-relaxed">
            방문 전 예약을 통해 더 나은 서비스를 받으실 수 있습니다. 
            야사장 검증 파트너로서 신뢰할 수 있는 서비스를 약속드립니다.
          </p>
        </section>
      </div>
    </div>
  );
}
