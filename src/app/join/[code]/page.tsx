import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users } from 'lucide-react';

export default async function Join({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: group } = await supabase
    .from('groups').select('id, name').eq('invite_code', code).maybeSingle();

  if (!group) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-[15px] text-[#707580]">유효하지 않은 링크입니다.</p>
      </main>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="min-h-screen flex flex-col justify-center px-5 py-8 max-w-[428px] mx-auto">
        <div className="rounded-[16px] bg-white border border-[#E7E7E2] p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
            <Users size={26} className="text-[#2563EB]" />
          </div>
          <p className="text-[13px] text-[#707580] mb-1">초대받은 그룹</p>
          <h1 className="text-[20px] font-bold text-[#17191F] mb-6">{group.name}</h1>
          <Link
            href={`/login?next=${encodeURIComponent(`/join/${code}`)}`}
            className="inline-flex items-center justify-center h-12 px-6 rounded-[14px] bg-[#2563EB] text-white font-semibold w-full"
          >
            로그인하고 참여하기
          </Link>
        </div>
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
