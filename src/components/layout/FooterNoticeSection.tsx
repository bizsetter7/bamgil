import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

type Notice = {
  id: string;
  badge: string | null;
  title: string;
  is_pinned: boolean;
  published_at: string;
};

async function getRecentNotices(): Promise<Notice[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('notices')
      .select('id, badge, title, is_pinned, published_at')
      .eq('is_published', true)
      .contains('platforms', ['bamgil'])
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(3);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function FooterNoticeSection() {
  const notices = await getRecentNotices();
  if (notices.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">공지사항</h4>
        <Link
          href="/notice"
          className="text-xs text-zinc-500 hover:text-amber-500 transition-colors"
        >
          전체보기 →
        </Link>
      </div>
      <ul className="flex flex-col md:flex-row gap-y-2 gap-x-6">
        {notices.map((n) => (
          <li key={n.id} className="flex-1 min-w-0">
            <Link
              href="/notice"
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors group"
            >
              {n.is_pinned ? (
                <span className="shrink-0 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-medium">
                  {n.badge ?? '공지'}
                </span>
              ) : n.badge ? (
                <span className="shrink-0 text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                  {n.badge}
                </span>
              ) : null}
              <span className="truncate group-hover:text-amber-400 transition-colors">
                {n.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
