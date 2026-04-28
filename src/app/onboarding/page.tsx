'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Moon, ArrowLeft } from 'lucide-react';

export default function OnboardingPage() {
  const [step, setStep] = useState<'role' | 'nickname'>('role');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // 이미 프로필 있으면 홈으로
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return; }
      const { data } = await supabase
        .from('bamgil_user_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      if (data) { router.push('/'); return; }
      setChecking(false);
    });
  }, [router]);

  const handleSaveProfile = async () => {
    if (!nickname.trim() || saving) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }

    const { error } = await supabase.from('bamgil_user_profiles').upsert({
      id: user.id,
      nickname: nickname.trim(),
      email: user.email,
    });

    if (error) {
      alert('저장에 실패했습니다. 다시 시도해주세요.');
      setSaving(false);
      return;
    }
    router.push('/');
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {step === 'role' ? (
        /* ── 역할 선택 ── */
        <div className="w-full max-w-md">
          {/* 로고 */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Moon size={28} fill="black" className="text-black" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">BAMGIL에 오신 것을</h1>
            <h1 className="text-2xl font-black text-gray-900">환영합니다 🌙</h1>
            <p className="text-gray-500 mt-2 text-sm">어떻게 이용하실 건가요?</p>
          </div>

          <div className="space-y-3">
            {/* 손님 선택 */}
            <button
              onClick={() => setStep('nickname')}
              className="w-full p-5 bg-white border-2 border-amber-400 rounded-2xl text-left hover:bg-amber-50 active:scale-[0.98] transition-all shadow-sm group"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl shrink-0">🙋</span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-[17px]">손님으로 시작</p>
                  <p className="text-gray-500 text-sm mt-0.5">업소 탐색 · 리뷰 · 찜하기 · 쿠폰</p>
                </div>
                <span className="text-amber-500 font-bold text-xl shrink-0 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </button>

            {/* 업체 선택 */}
            <a
              href="https://www.yasajang.kr"
              className="w-full p-5 bg-white border border-gray-200 rounded-2xl text-left hover:border-gray-400 active:scale-[0.98] transition-all shadow-sm group flex items-center gap-4"
            >
              <span className="text-3xl shrink-0">🏢</span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-900 text-[17px]">업체 사장님이신가요?</p>
                <p className="text-gray-500 text-sm mt-0.5">야사장에서 업소 등록 · 구독 관리</p>
              </div>
              <span className="text-gray-400 font-bold text-xl shrink-0 group-hover:translate-x-1 transition-transform">
                ↗
              </span>
            </a>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            이용 시{' '}
            <a href="#" className="underline hover:text-gray-600">이용약관</a>
            {' '}및{' '}
            <a href="#" className="underline hover:text-gray-600">개인정보처리방침</a>
            에 동의하게 됩니다.
          </p>
        </div>
      ) : (
        /* ── 닉네임 설정 ── */
        <div className="w-full max-w-sm">
          <button
            onClick={() => setStep('role')}
            className="flex items-center gap-1 text-gray-400 hover:text-gray-700 text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> 뒤로
          </button>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-2">닉네임 설정</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              리뷰 작성 시 표시될 이름이에요.<br />
              최대 12자, 나중에 변경할 수 있어요.
            </p>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 12))}
              placeholder="예: 야경러버, 밤산책러"
              maxLength={12}
              autoFocus
              className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 text-base focus:outline-none focus:border-amber-400 transition-colors pr-16"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
              {nickname.length}/12
            </span>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving || !nickname.trim()}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-gray-200 disabled:text-gray-400 text-black font-black py-3.5 rounded-xl transition-colors text-[15px]"
          >
            {saving ? '저장 중...' : '밤길 시작하기 →'}
          </button>
        </div>
      )}
    </div>
  );
}
