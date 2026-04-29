import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/** GET /api/auth/me → { user, profile } | { user: null } */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ user: null, profile: null });
    }

    const { data: profile } = await supabase
      .from('bamgil_user_profiles')
      .select('nickname')
      .eq('id', user.id)
      .maybeSingle();

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      profile,
    });
  } catch {
    return NextResponse.json({ user: null, profile: null });
  }
}
