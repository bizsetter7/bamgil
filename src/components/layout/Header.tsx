'use client';

import Link from 'next/link';
import { Moon, Menu, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import AuthButton from '@/components/auth/AuthButton';

const NAV_LINKS = [
  { href: '/', label: '홈' },
  { href: `/?category=${encodeURIComponent('룸살롱')}`, label: '룸살롱' },
  { href: `/?category=${encodeURIComponent('노래주점')}`, label: '노래방' },
  { href: `/?category=${encodeURIComponent('유흥주점')}`, label: '바/나이트' },
  { href: `/?category=${encodeURIComponent('나이트')}`, label: '클럽' },
  { href: `/?category=${encodeURIComponent('홀덤펍')}`, label: '홀덤펍' },
];

const MENU_SECTIONS = [
  {
    title: '둘러보기',
    items: [
      { label: '밤길 메인', href: '/' },
      { label: '업소 랭킹', href: '/rankings' },
      { label: '업소 찾기', href: '/' },
    ],
  },
  {
    title: '밤길 활동',
    items: [
      { label: '최근 본 업소', href: '#recent' },
    ],
  },
  {
    title: '고객 센터',
    items: [
      { label: '공지사항', href: '#notice' },
      { label: '1:1 문의', href: '#contact' },
      { label: '약관 및 정책', href: '#terms' },
    ],
  },
  {
    title: '광고 신청',
    items: [
      { label: '야사장에서 신청해 주세요', href: 'https://www.yasajang.kr/register', external: true },
    ],
  },
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
            <AuthButton />
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
          className="fixed inset-0 z-[60] bg-black/30 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        className={`
          fixed top-0 left-0 h-full w-72 z-[70] bg-white
          flex flex-col
          transition-transform duration-300 ease-in-out
          md:hidden
          ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* 드로어 헤더 */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center text-black">
              <Moon size={15} fill="currentColor" />
            </div>
            <span className="text-base font-black text-gray-900 tracking-tighter italic">BAMGIL</span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
            aria-label="메뉴 닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 드로어 메뉴 — 캡처3 섹션 구조 */}
        <nav className="flex-1 overflow-y-auto">
          {MENU_SECTIONS.map((section) => (
            <div key={section.title} className="border-b border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 px-5 pt-4 pb-2">{section.title}</p>
              {section.items.map((item) => (
                'external' in item && item.external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span>{item.label}</span>
                    <ChevronRight size={15} className="text-gray-300" />
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span>{item.label}</span>
                    <ChevronRight size={15} className="text-gray-300" />
                  </Link>
                )
              ))}
            </div>
          ))}
        </nav>

        {/* 드로어 푸터 */}
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-400">© 2026 BAMGIL. 검증된 업소 탐색 플랫폼.</p>
        </div>
      </div>
    </>
  );
}
