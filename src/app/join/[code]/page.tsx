import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Join({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: group } = await supabase
    .from('groups').select('id, name').eq('invite_code', code).maybeSingle();

  if (!group) {
    return <main className="p-6"><p>유효하지 않은 링크입니다.</p></main>;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-xl font-bold">{group.name}</h1>
        <p>참여하려면 로그인이 필요해요.</p>
        <Link
          href={`/login?next=${encodeURIComponent(`/join/${code}`)}`}
          className="inline-block bg-black text-white rounded px-4 py-2"
        >로그인</Link>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (!profile) redirect('/onboarding');

  const { data: existing } = await supabase
    .from('group_members').select('group_id')
    .eq('group_id', group.id).eq('user_id', user.id).maybeSingle();
  if (!existing) {
    await supabase.from('group_members').insert({
      group_id: group.id, user_id: user.id,
    });
  }
  redirect('/groups');
}
