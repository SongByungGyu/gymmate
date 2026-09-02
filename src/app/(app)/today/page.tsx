import { createClient } from '@/lib/supabase/server';
import { getWeekRangeKST } from '@/lib/utils/week';
import { toKstDate } from '@/lib/utils/date';
import { CheckInFlow } from '@/components/check-in-flow';
import { Progress } from '@/components/ui/progress';
import { TodayRecords } from '@/components/today-records';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

type TodayCheckIn = {
  id: string;
  checked_in_at: string;
  memo: string | null;
  verification_method: 'gps' | 'photo';
  photo_url: string | null;
  photo_signed: string | null;
};

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
  const checkedDates = new Set((weekCheckins ?? []).map((c) => c.local_date));
  const distinctDays = checkedDates.size;
  const goal = profile?.weekly_goal ?? 3;

  const [sy, sm, sd] = start.split('-').map(Number);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(sy, sm - 1, sd) + i * 86400000);
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return { label: WEEKDAYS[i], dateStr, checked: checkedDates.has(dateStr) };
  });

  const today = toKstDate();
  const { data: todayRows } = await supabase
    .from('check_ins')
    .select('id, checked_in_at, memo, verification_method, photo_url')
    .eq('user_id', user.id).eq('local_date', today)
    .order('checked_in_at', { ascending: false });

  // Generate signed URLs for photo records
  const todayCheckins: TodayCheckIn[] = await Promise.all(
    (todayRows ?? []).map(async (c) => {
      let photo_signed: string | null = null;
      if (c.photo_url) {
        const { data } = await supabase.storage
          .from('check-in-photos')
          .createSignedUrl(c.photo_url, 3600);
        photo_signed = data?.signedUrl ?? null;
      }
      return { ...c, photo_signed } as TodayCheckIn;
    })
  );

  const nickname = profile?.nickname ?? '';

  return (
    <main className="px-5 pt-6 pb-8 space-y-7">
      {/* Header — nickname text only, no avatar */}
      <div>
        <p className="text-[14px] text-[#707580]">안녕하세요</p>
        <h1 className="text-[22px] font-bold text-[#17191F]">{nickname}님</h1>
      </div>

      {/* Week progress card */}
      <section className="rounded-[16px] bg-white border border-[#E7E7E2] p-5">
        <div className="flex items-baseline justify-between mb-4">
          <p className="text-[14px] text-[#707580]">이번 주</p>
          <p className="text-[14px] text-[#17191F]">
            <span className="text-[18px] font-bold">{distinctDays}</span>
            <span className="text-[#9CA3AF]"> / {goal}회</span>
          </p>
        </div>
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {weekDays.map((d, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-1.5 py-2 rounded-[10px] ${
                d.checked ? 'bg-[#EFF6FF]' : ''
              }`}
            >
              <span className={`text-[11px] ${d.checked ? 'text-[#2563EB]' : 'text-[#9CA3AF]'}`}>
                {d.label}
              </span>
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  d.checked ? 'bg-[#2563EB]' : 'bg-[#E7E7E2]'
                }`}
              />
            </div>
          ))}
        </div>
        <Progress value={distinctDays} max={goal} />
      </section>

      <section>
        <CheckInFlow />
      </section>

      <section>
        <h2 className="text-[16px] font-bold text-[#17191F] mb-3">오늘 기록</h2>
        <TodayRecords records={todayCheckins} />
      </section>
    </main>
  );
}
