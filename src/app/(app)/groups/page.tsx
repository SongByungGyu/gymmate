import { createClient } from '@/lib/supabase/server';
import { getWeekRangeKST } from '@/lib/utils/week';
import { GroupView } from '@/components/group-view';
import Link from 'next/link';

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
      <main className="p-6 space-y-4">
        <h1 className="text-xl font-bold">그룹</h1>
        <p className="text-gray-600">아직 소속된 그룹이 없어요.</p>
        <Link href="/groups/new" className="inline-block bg-black text-white rounded px-4 py-2">
          새 그룹 만들기
        </Link>
      </main>
    );
  }

  const active = myGroups.find((g) => g.id === selectedId) ?? myGroups[0];

  const { data: members } = await supabase
    .from('group_members').select('user_id, profiles(id, nickname, weekly_goal)')
    .eq('group_id', active.id);

  type MemberRow = { user_id: string; profiles: { id: string; nickname: string; weekly_goal: number } | { id: string; nickname: string; weekly_goal: number }[] | null };
  const memberRows = (members ?? []) as MemberRow[];

  const memberIds = memberRows.map((m) => m.user_id);
  const { start, end } = getWeekRangeKST();
  const { data: weekCheckins } = await supabase
    .from('check_ins').select('user_id, local_date')
    .in('user_id', memberIds)
    .gte('local_date', start).lte('local_date', end);

  const { data: recent } = await supabase
    .from('check_ins').select('id, user_id, checked_in_at, verification_method, memo, photo_url')
    .in('user_id', memberIds)
    .order('checked_in_at', { ascending: false })
    .limit(20);

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
    };
  });

  const recentRows = (recent ?? []) as Array<{
    id: string; user_id: string; checked_in_at: string;
    verification_method: 'gps' | 'photo'; memo: string | null; photo_url: string | null;
  }>;

  // signed URL 생성
  const recentEnriched = await Promise.all(recentRows.map(async (r) => {
    let photo_signed: string | null = null;
    if (r.photo_url) {
      const { data } = await supabase.storage
        .from('check-in-photos').createSignedUrl(r.photo_url, 3600);
      photo_signed = data?.signedUrl ?? null;
    }
    return {
      ...r,
      nickname: stats.find((s) => s.userId === r.user_id)?.nickname ?? '',
      photo_signed,
    };
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
