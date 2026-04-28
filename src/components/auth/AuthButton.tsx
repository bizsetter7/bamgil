'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Heart, LogOut, ChevronDown, User } from 'lucide-react';
import Link from 'next/link';

interface Profile {
  nickname: string;
}

export default function AuthButton() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from('bamgil_user_profiles')
          .select('nickname')
          .eq('id', user.id)
          .maybeSingle();
        setProfile(data);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const { data } = await supabase
          .from('bamgil_user_profiles')
          .select('nickname')
          .eq('id', u.id)
          .maybeSingle();
        setProfile(data);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
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
    setUser(null);
    setProfile(null);
    setMenuOpen(false);
    window.location.href = '/';
  };

  if (loading) {
    return <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse" />;
  }

  if (!user) {
    return (
      <button
        onClick={handleLogin}
        className="px-3 py-1.5 text-sm font-bold text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-500 rounded-lg transition-colors"
      >
        로그인
      </button>
    );
  }

  const displayName = profile?.nickname ?? '손님';
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
          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-black text-gray-900 truncate">{displayName}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
            <Link
              href="/my"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Heart size={14} className="text-pink-500" />
              내 찜 목록
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 transition-colors border-t border-gray-100"
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
