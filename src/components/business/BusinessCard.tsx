import Link from 'next/link';
import { MapPin, Star, Phone, MessageSquare } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  room_salon: '룸살롱', 
  karaoke_bar: '노래방', 
  bar: '바/주점',
  night_club: '나이트', 
  hostbar: '호스트바', 
  general: '일반', 
  other: '기타',
};

export default function BusinessCard({ business }: { business: any }) {
  return (
    <Link href={`/places/${business.id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-amber-500/50 transition-all cursor-pointer group relative overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute -right-10 -bottom-10 w-20 h-20 bg-amber-500/5 blur-3xl group-hover:bg-amber-500/10 transition-all duration-500" />
        
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase tracking-widest">
                {CATEGORY_LABELS[business.category] ?? business.category}
              </span>
              <h3 className="font-bold text-white text-xl tracking-tight group-hover:text-amber-500 transition-colors">
                {business.name}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-amber-500 transition-all">
              <Star size={18} />
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
            <MapPin size={14} />
            <span className="truncate">{business.address ?? business.region_code}</span>
          </div>

          <div className="pt-2 flex items-center gap-3">
            {business.phone && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-800/50 px-2.5 py-1 rounded-full">
                <Phone size={10} /> 전화 가능
              </div>
            )}
            {business.open_chat_url && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-800/50 px-2.5 py-1 rounded-full">
                <MessageSquare size={10} /> 오픈채팅
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
