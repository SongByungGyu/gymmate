import { createClient } from '@/lib/supabase/server';
import { toKstDate } from '@/lib/utils/date';
import { CalendarClient, type EnrichedCheckIn } from './client';
import type { CheckIn } from '@/lib/types';

export default async function Calendar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // KST 기준 오늘 — check-in API가 local_date를 toKstDate()로 저장하므로 동일한 규약.
  const today = toKstDate();

  const [allRes, dayRes] = await Promise.all([
    supabase.from('check_ins').select('local_date').eq('user_id', user.id),
    supabase.from('check_ins').select('*')
      .eq('user_id', user.id).eq('local_date', today)
      .order('checked_in_at', { ascending: false }),
  ]);

  const checkedDates = [...new Set((allRes.data ?? []).map((r) => r.local_date))];
  const rows = (dayRes.data ?? []) as CheckIn[];

  const photoPaths = rows.map((r) => r.photo_url).filter((p): p is string => !!p);
  const signedMap: Record<string, string> = {};
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from('check-in-photos').createSignedUrls(photoPaths, 3600);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) signedMap[s.path] = s.signedUrl;
    }
  }
  const initialDayCheckins: EnrichedCheckIn[] = rows.map((c) => ({
    ...c,
    photo_signed: c.photo_url ? signedMap[c.photo_url] ?? null : null,
  }));

  return (
    <CalendarClient
      checkedDates={checkedDates}
      initialSelected={today}
      initialDayCheckins={initialDayCheckins}
    />
  );
}
