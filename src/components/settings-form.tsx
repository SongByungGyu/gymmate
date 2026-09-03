'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { GymRegistrar, type GymRegistration } from '@/components/gym-registrar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut } from 'lucide-react';
import type { Profile } from '@/lib/types';

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [nickname, setNickname] = useState(profile.nickname);
  const [goal, setGoal] = useState(profile.weekly_goal);
  const [gymEdit, setGymEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  async function saveBasic() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('profiles')
      .update({ nickname, weekly_goal: goal }).eq('id', profile.id);
    setSaving(false);
    if (error) alert('저장에 실패했어요');
    else router.refresh();
  }

  async function saveGym(reg: GymRegistration) {
    const supabase = createClient();
    const { error } = await supabase.from('profiles').update({
      gym_place_id: null,
      gym_name: reg.name,
      gym_address: null,
      gym_lat: reg.lat,
      gym_lng: reg.lng,
    }).eq('id', profile.id);
    if (error) alert('저장에 실패했어요');
    else { setGymEdit(false); router.refresh(); }
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-[13px] font-semibold text-[#707580] mb-2 px-1">프로필</h2>
        <div className="rounded-[16px] bg-white border border-[#E7E7E2] p-4 space-y-3">
          <div>
            <label className="text-[13px] text-[#707580] mb-1.5 block">닉네임</label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-semibold text-[#707580] mb-2 px-1">주간 목표</h2>
        <div className="rounded-[16px] bg-white border border-[#E7E7E2] p-4">
          <p className="text-[13px] text-[#707580] mb-3">일주일에 며칠 운동할까요?</p>
          <div className="grid grid-cols-3 gap-2">
            {[2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                onClick={() => setGoal(n)}
                className={`h-12 rounded-[10px] text-[14px] font-semibold border transition-colors ${
                  goal === n
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white text-[#17191F] border-[#E7E7E2]'
                }`}
              >주 {n}일</button>
            ))}
          </div>
        </div>
      </section>

      <Button onClick={saveBasic} disabled={saving} className="w-full">
        {saving ? '저장 중...' : '프로필·목표 저장'}
      </Button>

      <section>
        <h2 className="text-[13px] font-semibold text-[#707580] mb-2 px-1">헬스장</h2>
        {gymEdit ? (
          <div className="rounded-[16px] bg-white border border-[#E7E7E2] p-4">
            <GymRegistrar
              onDone={saveGym}
              onCancel={() => setGymEdit(false)}
            />
          </div>
        ) : (
          <div className="rounded-[16px] bg-white border border-[#E7E7E2] p-4">
            <div className="text-[15px] font-semibold text-[#17191F]">{profile.gym_name}</div>
            {profile.gym_address && (
              <div className="text-[13px] text-[#707580] mt-0.5">{profile.gym_address}</div>
            )}
            <button
              onClick={() => setGymEdit(true)}
              className="mt-3 text-[13px] font-semibold text-[#2563EB]"
            >헬스장 변경</button>
          </div>
        )}
      </section>

      <button
        onClick={logout}
        className="w-full h-12 rounded-[14px] bg-white border border-[#FEE2E2] text-[15px] font-semibold text-[#EF4444] flex items-center justify-center gap-2"
      >
        <LogOut size={18} />
        로그아웃
      </button>
    </div>
  );
}
