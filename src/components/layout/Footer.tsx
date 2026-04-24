import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 py-12 px-4 mt-20">
      <div className="max-w-screen-lg mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-lg font-black text-white italic">BAMGIL</h3>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
              밤길은 사장님과 손님을 잇는 가장 안전하고 투명한 플랫폼입니다. 
              검증된 업소 정보와 실시간 위치를 통해 최고의 밤을 선사합니다.
            </p>
          </div>
          
          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">서비스</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="/" className="hover:text-white">업소 찾기</Link></li>
              <li><Link href="/?category=room_salon" className="hover:text-white">룸살롱</Link></li>
              <li><Link href="/?category=karaoke_bar" className="hover:text-white">노래방</Link></li>
              <li><Link href="/?category=bar" className="hover:text-white">바</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">비즈니스</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><a href="https://yasajang.kr" className="hover:text-white">야사장 입점신청</a></li>
              <li><Link href="/terms" className="hover:text-white">이용약관</Link></li>
              <li><Link href="/privacy" className="hover:text-white">개인정보처리방침</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-600">
          <p>&copy; 2026 BAMGIL. All rights reserved.</p>
          <p>Powered by Yasajang Platform</p>
        </div>
      </div>
    </footer>
  );
}
