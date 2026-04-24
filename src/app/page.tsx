import { createClient } from '@/lib/supabase/server';
import HomeClient from '@/components/home/HomeClient';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; category?: string }>;
}) {
  const { region, category } = await searchParams;

  const supabase = await createClient();

  let query = supabase
    .from('businesses')
    .select('id, name, category, region_code, address, lat, lng, phone, open_chat_url, cover_image_url')
    .eq('is_active', true);

  if (region) query = query.eq('region_code', region);
  if (category) query = query.eq('category', category);

  const { data: businesses } = await query.limit(50);

  return (
    <HomeClient
      businesses={businesses ?? []}
      region={region}
      category={category}
    />
  );
}
