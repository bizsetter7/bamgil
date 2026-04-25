import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { LayoutDashboard, Building2, Phone, LogOut, Map } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'bizsetter7@gmail.com';
  if (!user || user.email !== adminEmail) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="w-60 border-r border-zinc-900 flex flex-col fixed inset-y-0 z-50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="p-6">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-black shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
              <Map size={20} />
            </div>
            <span className="text-lg font-black tracking-tighter">
              밤길 <span className="text-zinc-500 font-medium text-sm">ADMIN</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          <Link href="/admin" className="flex items-center px-4 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all">
            <LayoutDashboard size={16} className="mr-3" /> 대시보드
          </Link>
          <Link href="/admin/businesses" className="flex items-center px-4 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all">
            <Building2 size={16} className="mr-3" /> 업소 관리
          </Link>
          <Link href="/admin/contacts" className="flex items-center px-4 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all">
            <Phone size={16} className="mr-3" /> 연락 통계
          </Link>
        </nav>

        <div className="p-5 border-t border-zinc-900">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">ADM</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate">{user.email}</div>
              <div className="text-[10px] text-zinc-500">Master Admin</div>
            </div>
            <LogOut size={14} className="text-zinc-600 shrink-0" />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 p-10 min-h-screen bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.03)_0%,_transparent_60%)]">
        {children}
      </main>
    </div>
  );
}
