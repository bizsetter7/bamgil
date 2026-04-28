import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      const baseUrl = isLocalEnv
        ? origin
        : forwardedHost
        ? `https://${forwardedHost}`
        : origin;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // bamgil_user_profiles 존재 여부 → 신규/기존 판별
        const { data: profile } = await supabase
          .from('bamgil_user_profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile) {
          // 신규 사용자 → 역할 선택 온보딩
          return NextResponse.redirect(`${baseUrl}/onboarding`);
        }
        // 기존 사용자 → 원래 페이지로
        return NextResponse.redirect(`${baseUrl}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
