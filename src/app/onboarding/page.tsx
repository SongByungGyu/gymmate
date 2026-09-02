'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { GymRegistrar, type GymRegistration } from '@/components/gym-registrar';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nickname, setNickname] = useState('');
  const [gym, setGym] = useState<GymRegistration | null>(null);
  const [goal, setGoal] = useState(3);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!gym) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      nickname,
      weekly_goal: goal,
      gym_place_id: null,
      gym_name: gym.name,
      gym_address: null,
      gym_lat: gym.lat,
      gym_lng: gym.lng,
    });
    if (error) {
      alert('저장 실패: ' + error.message);
      setSaving(false);
    } else {
      router.push('/today');
    }
  }

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto">
      {step === 1 && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">닉네임을 정해주세요</h1>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            className="w-full border rounded px-4 py-3"
          />
          <button
            disabled={!nickname.trim()}
            onClick={() => setStep(2)}
            className="w-full bg-black text-white rounded py-3 disabled:bg-gray-300"
          >다음</button>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">다니는 헬스장 등록</h1>
          <GymRegistrar
            onDone={(reg) => { setGym(reg); setStep(3); }}
          />
        </div>
      )}
      {step === 3 && gym && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">주간 목표를 정해주세요</h1>
          <p className="text-sm text-gray-600">선택한 헬스장: {gym.name}</p>
          <div className="grid grid-cols-3 gap-2">
            {[2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                onClick={() => setGoal(n)}
                className={`py-3 border rounded ${goal === n ? 'bg-black text-white' : ''}`}
              >주 {n}회</button>
            ))}
          </div>
          <button
            disabled={saving}
            onClick={save}
            className="w-full bg-black text-white rounded py-3 disabled:bg-gray-400"
          >{saving ? '저장중...' : '시작하기'}</button>
        </div>
      )}
    </main>
  );
}
