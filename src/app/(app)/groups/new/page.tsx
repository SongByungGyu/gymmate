'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { generateInviteCode } from '@/lib/utils/invite-code';

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
        alert('그룹 생성 실패: ' + error.message);
        setSaving(false);
        return;
      }
    }
    if (!group) { alert('코드 충돌 반복. 다시 시도'); setSaving(false); return; }

    await supabase.from('group_members').insert({
      group_id: group.id, user_id: user.id,
    });
    router.push('/groups');
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">새 그룹 만들기</h1>
      <input
        value={name} onChange={(e) => setName(e.target.value)}
        placeholder="그룹 이름"
        className="w-full border rounded px-4 py-3"
      />
      <button
        disabled={!name.trim() || saving}
        onClick={create}
        className="w-full bg-black text-white rounded py-3 disabled:bg-gray-300"
      >{saving ? '만드는 중...' : '만들기'}</button>
    </main>
  );
}
