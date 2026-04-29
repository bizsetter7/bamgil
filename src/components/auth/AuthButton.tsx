'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Heart, LogOut, ChevronDown, User, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MeData {
  user: { id: string; email: string } | null;
  profile: { nickname: string } | null;
}

export default function AuthButton() {
  const [me, setMe] = useState<MeData>({ user: null, profile: null });
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchMe = async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data: MeData = await res.json();
        setMe(data);
        // 로그인됐는데 프로필 없으면 → 온보딩
        if (data.user && !data.profile) {
          router.push('/onboarding');
        }
      }
    } catch {
      // 무시 — 미로그인으로 처리
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 3초 타임아웃
    const timer = setTimeout(() => setLoading(false), 3000);
    fetchMe();
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 로그인 후 Supabase auth state 변화 감지 (페이지 재방문 시)
  useEffect(() => {
    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        fetchMe();
      }
    });
    return () => listener.subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`,
      },
    });
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMe({ user: null, profile: null });
    setMenuOpen(false);
    window.location.href = '/';
  };

  if (loading) {
    return (
      <button
        onClick={handleLogin}
        className="px-3 py-1.5 text-sm font-bold text-gray-400 border border-gray-200 rounded-lg"
      >
        로그인
      </button>
    );
  }

  if (!me.user) {
    return (
      <button
        onClick={handleLogin}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-500 rounded-lg transition-colors"
      >
        <LogIn size={14} />
        로그인
      </button>
    );
  }

  const displayName = me.profile?.nickname ?? '손님';
  const initial = displayName[0].toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="내 계정"
      >
        <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-black text-xs font-black shrink-0">
          {initial}
        </div>
        <span className="text-sm font-bold text-gray-700 hidden md:block max-w-[80px] truncate">
          {displayName}
        </span>
        <ChevronDown size={12} className="text-gray-400 hidden md:block" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            {/* 유저 정보 */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-black text-gray-900 truncate">{displayName}</p>
              <p className="text-[10px] text-gray-400 truncate">{me.user.email}</p>
            </div>
            {/* 내 찜 */}
            <Link
              href="/my"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Heart size={14} className="text-pink-500" />
              내 찜 목록
            </Link>
            {/* 로그아웃 — 항상 보이게 */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
            >
              <LogOut size={14} />
              로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  );
}
