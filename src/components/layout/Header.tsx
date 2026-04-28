'use client';

import Link from 'next/link';
import { Moon, Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/', label: '홈' },
  { href: `/?category=${encodeURIComponent('룸살롱')}`, label: '룸살롱' },
  { href: `/?category=${encodeURIComponent('노래주점')}`, label: '노래방' },
  { href: `/?category=${encodeURIComponent('유흥주점')}`, label: '바/나이트' },
  { href: `/?category=${encodeURIComponent('나이트')}`, label: '클럽' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-black">
              <Moon size={18} fill="currentColor" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tighter italic">BAMGIL</span>
          </Link>

          {/* 데스크탑 네비 */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors first:text-gray-900 first:font-bold"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* 우측 아이콘 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
              aria-label="메뉴 열기"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ── 모바일 드로어 ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        className={`
          fixed top-0 right-0 h-full w-72 z-[70] bg-white border-l border-gray-200
          flex flex-col
          transition-transform duration-300 ease-in-out
          md:hidden
          ${menuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* 드로어 헤더 */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center text-black">
              <Moon size={15} fill="currentColor" />
            </div>
            <span className="text-lg font-black text-gray-900 tracking-tighter italic">BAMGIL</span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
            aria-label="메뉴 닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 드로어 메뉴 */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-4 mt-4 border-t border-gray-200">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-3">
              카테고리
            </p>
            {[
              { href: `/?category=${encodeURIComponent('룸살롱')}`, label: '룸살롱' },
              { href: `/?category=${encodeURIComponent('노래주점')}`, label: '노래방' },
              { href: `/?category=${encodeURIComponent('유흥주점')}`, label: '바/주점' },
              { href: `/?category=${encodeURIComponent('나이트')}`, label: '나이트클럽' },
              { href: `/?category=${encodeURIComponent('호스트바')}`, label: '호스트바' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* 드로어 푸터 */}
        <div className="px-5 py-4 border-t border-gray-200">
          <p className="text-[10px] text-gray-400 font-bold">
            © 2026 BAMGIL. 검증된 업소 탐색 플랫폼.
          </p>
        </div>
      </div>
    </>
  );
}
