'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { generateInviteCode } from '@/lib/utils/invite-code';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NewGroup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function create() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let group;
    for (let i = 0; i < 5; i++) {
      const code = generateInviteCode();
      const { data, error } = await supabase.from('groups').insert({
        name, invite_code: code, created_by: user.id,
      }).select().single();
      if (!error) { group = data; break; }
      if ((error as { code?: string }).code !== '23505') {
        alert('그룹 생성에 실패했어요: ' + error.message);
        setSaving(false);
        return;
      }
    }
    if (!group) { alert('코드 충돌이 반복돼요. 다시 시도해주세요.'); setSaving(false); return; }

    await supabase.from('group_members').insert({
      group_id: group.id, user_id: user.id,
    });
    router.push('/groups');
  }

  return (
    <main className="px-5 pt-6 pb-8 space-y-6">
      <div className="flex items-center gap-2 -ml-2">
        <Link
          href="/groups"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#707580]"
          aria-label="뒤로"
        >
          <ChevronLeft size={22} />
        </Link>
        <h1 className="text-[20px] font-bold text-[#17191F]">새 그룹 만들기</h1>
      </div>
      <div>
        <label className="text-[13px] font-semibold text-[#707580] mb-1.5 block">
          그룹 이름
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 우리 헬스 크루"
          autoFocus
        />
      </div>
      <Button
        disabled={!name.trim() || saving}
        onClick={create}
        className="w-full"
      >{saving ? '만드는 중...' : '만들기'}</Button>
    </main>
  );
}
