import { createClient } from '@/lib/supabase/server';
import { getWeekRangeKST } from '@/lib/utils/week';
import { toKstDate } from '@/lib/utils/date';
import { CheckInFlow } from '@/components/check-in-flow';

export default async function Today() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles').select('nickname, weekly_goal').eq('id', user.id).single();

  const { start, end } = getWeekRangeKST();
  const { data: weekCheckins } = await supabase
    .from('check_ins').select('local_date')
    .eq('user_id', user.id).gte('local_date', start).lte('local_date', end);
  const distinctDays = new Set((weekCheckins ?? []).map((c) => c.local_date)).size;
  const goal = profile?.weekly_goal ?? 3;

  const today = toKstDate();
  const { data: todayCheckins } = await supabase
    .from('check_ins')
    .select('id, checked_in_at, memo, photo_url, verification_method')
    .eq('user_id', user.id).eq('local_date', today)
    .order('checked_in_at', { ascending: false });

  // 사진 signed URL 생성 (60분 유효)
  const enriched = await Promise.all(
    (todayCheckins ?? []).map(async (c) => {
      if (!c.photo_url) return { ...c, photo_signed: null as string | null };
      const { data } = await supabase.storage
        .from('check-in-photos').createSignedUrl(c.photo_url, 3600);
      return { ...c, photo_signed: data?.signedUrl ?? null };
    })
  );

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-bold">안녕하세요, {profile?.nickname}님</h1>

      <section>
        <p className="text-sm text-gray-600 mb-2">이번주 진행률</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black"
              style={{ width: `${Math.min(100, (distinctDays / goal) * 100)}%` }}
            />
          </div>
          <span className="text-sm">{distinctDays} / {goal}일</span>
        </div>
      </section>

      <section>
        <CheckInFlow />
      </section>

      <section>
        <h2 className="font-bold mb-2">오늘 기록</h2>
        {enriched.length > 0 ? (
          <ul className="space-y-2">
            {enriched.map((c) => (
              <li key={c.id} className="border rounded p-3">
                <div className="text-xs text-gray-500">
                  {new Date(c.checked_in_at).toLocaleTimeString('ko-KR')} ·{' '}
                  {c.verification_method === 'gps' ? '📍 GPS' : '📷 사진'}
                </div>
                {c.memo && <p className="mt-1">{c.memo}</p>}
                {c.photo_signed && (
                  <img src={c.photo_signed} alt="" className="mt-2 rounded max-w-xs" />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">아직 오늘 기록이 없어요.</p>
        )}
      </section>
    </main>
  );
}
