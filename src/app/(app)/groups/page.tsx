import { createClient } from '@/lib/supabase/server';
import { getWeekRangeKST } from '@/lib/utils/week';
import { toKstDate } from '@/lib/utils/date';
import { GroupView } from '@/components/group-view';
import Link from 'next/link';
import { Users } from 'lucide-react';

export default async function Groups({ searchParams }: { searchParams: Promise<{ g?: string }> }) {
  const { g: selectedId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from('group_members').select('group_id, groups(id, name, invite_code, created_by)')
    .eq('user_id', user.id);

  type GroupRow = { id: string; name: string; invite_code: string; created_by: string };
  const myGroups: GroupRow[] = (memberships ?? [])
    .map((m: { groups: GroupRow | GroupRow[] | null }) => Array.isArray(m.groups) ? m.groups[0] : m.groups)
    .filter((g): g is GroupRow => !!g);

  if (myGroups.length === 0) {
    return (
      <main className="px-5 pt-6 pb-8">
        <h1 className="text-[22px] font-bold text-[#17191F] mb-8">그룹</h1>
        <div className="pt-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-[#2563EB]" />
          </div>
          <p className="text-[15px] font-semibold text-[#17191F] mb-1">
            아직 참여한 그룹이 없어요
          </p>
          <p className="text-[13px] text-[#707580] mb-6">
            친구를 초대하거나 새 그룹을 만들어보세요
          </p>
          <Link
            href="/groups/new"
            className="inline-flex items-center justify-center h-12 px-6 rounded-[14px] bg-[#2563EB] text-white font-semibold"
          >
            새 그룹 만들기
          </Link>
        </div>
      </main>
    );
  }

  const active = myGroups.find((g) => g.id === selectedId) ?? myGroups[0];

  // Members must be fetched first (memberIds are needed for check_ins queries).
  const { data: members } = await supabase
    .from('group_members').select('user_id, profiles(id, nickname, weekly_goal)')
    .eq('group_id', active.id);

  type MemberRow = { user_id: string; profiles: { id: string; nickname: string; weekly_goal: number } | { id: string; nickname: string; weekly_goal: number }[] | null };
  const memberRows = (members ?? []) as MemberRow[];
  const memberIds = memberRows.map((m) => m.user_id);
  const { start, end } = getWeekRangeKST();

  // Run week stats + recent activity in parallel (both depend only on memberIds).
  const [
    { data: weekCheckins },
    { data: recent },
  ] = await Promise.all([
    supabase.from('check_ins').select('user_id, local_date')
      .in('user_id', memberIds)
      .gte('local_date', start).lte('local_date', end),
    supabase.from('check_ins')
      .select('id, user_id, checked_in_at, verification_method, memo, photo_url')
      .in('user_id', memberIds)
      .order('checked_in_at', { ascending: false })
      .limit(20),
  ]);

  // 오늘 체크인한 user_id 집합 — 각 멤버 행의 오늘 dot 표시에 사용.
  const today = toKstDate();
  const todayDoneUsers = new Set(
    (weekCheckins ?? []).filter((c) => c.local_date === today).map((c) => c.user_id)
  );

  const stats = memberRows.map((m) => {
    const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    const days = new Set(
      (weekCheckins ?? []).filter((c) => c.user_id === m.user_id).map((c) => c.local_date)
    ).size;
    return {
      userId: m.user_id,
      nickname: p?.nickname ?? '',
      goal: p?.weekly_goal ?? 3,
      days,
      todayDone: todayDoneUsers.has(m.user_id),
    };
  });

  const recentRows = (recent ?? []) as Array<{
    id: string; user_id: string; checked_in_at: string;
    verification_method: 'gps' | 'photo'; memo: string | null; photo_url: string | null;
  }>;

  // Batch all photo signed URLs in a single Storage call.
  const photoPaths = recentRows.map((r) => r.photo_url).filter((p): p is string => !!p);
  const signedMap = new Map<string, string>();
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from('check-in-photos').createSignedUrls(photoPaths, 3600);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) signedMap.set(s.path, s.signedUrl);
    }
  }
  const recentEnriched = recentRows.map((r) => ({
    ...r,
    nickname: stats.find((s) => s.userId === r.user_id)?.nickname ?? '',
    photo_signed: r.photo_url ? signedMap.get(r.photo_url) ?? null : null,
  }));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  return (
    <GroupView
      groups={myGroups}
      activeGroup={active}
      currentUserId={user.id}
      stats={stats}
      recent={recentEnriched}
      inviteUrl={`${siteUrl}/join/${active.invite_code}`}
    />
  );
}
