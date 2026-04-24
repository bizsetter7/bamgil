'use client';

import Link from 'next/link';
import { Moon, Menu, Search, MapPin } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900">
      <div className="max-w-screen-lg mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-black">
            <Moon size={20} fill="currentColor" />
          </div>
          <span className="text-xl font-black text-white tracking-tighter italic">BAMGIL</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-bold text-white">홈</Link>
          <Link href="/?category=room_salon" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">룸살롱</Link>
          <Link href="/?category=karaoke_bar" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">노래방</Link>
          <Link href="/?category=bar" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">바/나이트</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button className="p-2 text-zinc-400 hover:text-white transition-colors">
            <Search size={20} />
          </button>
          <button className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
