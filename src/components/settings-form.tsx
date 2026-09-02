'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { GymSearch } from '@/components/gym-search';
import type { Profile } from '@/lib/types';
import type { Place } from '@/lib/naver';

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
    if (error) alert('저장 실패');
    else router.refresh();
  }

  async function saveGym(place: Place) {
    const supabase = createClient();
    const { error } = await supabase.from('profiles').update({
      gym_place_id: place.id,
      gym_name: place.place_name,
      gym_address: place.road_address || place.address,
      gym_lat: place.lat,
      gym_lng: place.lng,
    }).eq('id', profile.id);
    if (error) alert('저장 실패');
    else { setGymEdit(false); router.refresh(); }
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <label className="text-sm text-gray-600">닉네임</label>
        <input
          value={nickname} onChange={(e) => setNickname(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </section>

      <section className="space-y-2">
        <label className="text-sm text-gray-600">주간 목표</label>
        <div className="grid grid-cols-3 gap-2">
          {[2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              onClick={() => setGoal(n)}
              className={`py-2 border rounded ${goal === n ? 'bg-black text-white' : ''}`}
            >주 {n}회</button>
          ))}
        </div>
      </section>

      <button
        onClick={saveBasic} disabled={saving}
        className="w-full bg-black text-white rounded py-3"
      >저장</button>

      <section className="space-y-2">
        <label className="text-sm text-gray-600">헬스장</label>
        {gymEdit ? (
          <>
            <GymSearch onSelect={saveGym} />
            <button onClick={() => setGymEdit(false)} className="text-sm underline">
              취소
            </button>
          </>
        ) : (
          <div className="border rounded p-3">
            <div className="font-medium">{profile.gym_name}</div>
            <div className="text-sm text-gray-600">{profile.gym_address}</div>
            <button
              onClick={() => setGymEdit(true)}
              className="mt-2 text-sm underline"
            >변경</button>
          </div>
        )}
      </section>

      <hr />

      <button
        onClick={logout}
        className="w-full border rounded py-2 text-red-600"
      >로그아웃</button>
    </div>
  );
}
