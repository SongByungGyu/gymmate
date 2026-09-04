import { createClient } from '@/lib/supabase/server';
import { getWeekRangeKST } from '@/lib/utils/week';
import { toKstDate } from '@/lib/utils/date';
import { CheckInFlow } from '@/components/check-in-flow';
import { Progress } from '@/components/ui/progress';
import { TodayRecords } from '@/components/today-records';
import { CheckCircle2, Circle } from 'lucide-react';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

type TodayCheckIn = {
  id: string;
  checked_in_at: string;
  memo: string | null;
  verification_method: 'gps' | 'photo';
  photo_url: string | null;
  photo_signed: string | null;
};

type FriendStatus = {
  userId: string;
  nickname: string;
  checkedInAt: string | null;
};

export default async function Today() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { start, end } = getWeekRangeKST();
  const today = toKstDate();

  // 1단계: 사용자 관련 데이터 + 소속 그룹 id 병렬 조회.
  const [
    { data: profile },
    { data: weekCheckins },
    { data: todayRows },
    { data: myMemberships },
  ] = await Promise.all([
    supabase.from('profiles').select('nickname, weekly_goal').eq('id', user.id).single(),
    supabase.from('check_ins').select('local_date')
      .eq('user_id', user.id).gte('local_date', start).lte('local_date', end),
    supabase.from('check_ins')
      .select('id, checked_in_at, memo, verification_method, photo_url')
      .eq('user_id', user.id).eq('local_date', today)
      .order('checked_in_at', { ascending: false }),
    supabase.from('group_members').select('group_id').eq('user_id', user.id),
  ]);

  const checkedDates = new Set((weekCheckins ?? []).map((c) => c.local_date));
  const distinctDays = checkedDates.size;
  const goal = profile?.weekly_goal ?? 3;

  const [sy, sm, sd] = start.split('-').map(Number);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(sy, sm - 1, sd) + i * 86400000);
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return { label: WEEKDAYS[i], dateStr, checked: checkedDates.has(dateStr) };
  });

  // Batch all photo signed URLs in a single Storage call.
  const rows = todayRows ?? [];
  const photoPaths = rows.map((r) => r.photo_url).filter((p): p is string => !!p);
  const signedMap = new Map<string, string>();
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from('check-in-photos').createSignedUrls(photoPaths, 3600);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) signedMap.set(s.path, s.signedUrl);
    }
  }
  const todayCheckins: TodayCheckIn[] = rows.map((c) => ({
    ...c,
    photo_signed: c.photo_url ? signedMap.get(c.photo_url) ?? null : null,
  }));

  // 2단계: 그룹 소속이 있을 때만 친구 오늘 상태 조회.
  const groupIds = (myMemberships ?? []).map((m) => m.group_id);
  let friendStatuses: FriendStatus[] = [];
  if (groupIds.length > 0) {
    type MemberRow = {
      user_id: string;
      profiles: { id: string; nickname: string } | { id: string; nickname: string }[] | null;
    };
    const { data: allMembersRaw } = await supabase
      .from('group_members')
      .select('user_id, profiles(id, nickname)')
      .in('group_id', groupIds);
    const allMembers = (allMembersRaw ?? []) as MemberRow[];

    // self 제외, 중복 제거
    const friendMap = new Map<string, string>();
    for (const m of allMembers) {
      if (m.user_id === user.id) continue;
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      if (p && !friendMap.has(m.user_id)) friendMap.set(m.user_id, p.nickname);
    }

    if (friendMap.size > 0) {
      const friendIds = Array.from(friendMap.keys());
      const { data: friendCheckins } = await supabase
        .from('check_ins')
        .select('user_id, checked_in_at')
        .in('user_id', friendIds).eq('local_date', today)
        .order('checked_in_at', { ascending: true });
      const firstByUser = new Map<string, string>();
      for (const c of friendCheckins ?? []) {
        if (!firstByUser.has(c.user_id)) firstByUser.set(c.user_id, c.checked_in_at);
      }
      friendStatuses = friendIds.map((fid) => ({
        userId: fid,
        nickname: friendMap.get(fid) ?? '',
        checkedInAt: firstByUser.get(fid) ?? null,
      }));
    }
  }

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
            <span className="text-[#9CA3AF]"> / {goal}일</span>
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

      {friendStatuses.length > 0 && (
        <section>
          <h2 className="text-[16px] font-bold text-[#17191F] mb-3">오늘 함께</h2>
          <ul className="rounded-[14px] bg-white border border-[#E7E7E2] divide-y divide-[#E7E7E2]">
            {friendStatuses.map((f) => {
              const done = !!f.checkedInAt;
              const time = done
                ? new Date(f.checkedInAt!).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                : null;
              return (
                <li key={f.userId} className="flex items-center gap-3 px-4 py-3">
                  {done ? (
                    <CheckCircle2 size={18} className="text-[#22C55E] shrink-0" />
                  ) : (
                    <Circle size={18} className="text-[#9CA3AF] shrink-0" />
                  )}
                  <span className="text-[15px] font-semibold text-[#17191F] truncate flex-1">
                    {f.nickname}
                  </span>
                  <span className={`text-[13px] ${done ? 'text-[#707580]' : 'text-[#9CA3AF]'}`}>
                    {done ? `${time} 완료` : '아직'}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-[16px] font-bold text-[#17191F] mb-3">오늘 기록</h2>
        <TodayRecords records={todayCheckins} />
      </section>
    </main>
  );
}
