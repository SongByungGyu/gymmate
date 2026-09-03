'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { GymRegistrar, type GymRegistration } from '@/components/gym-registrar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { safeNextPath } from '@/lib/utils/safe-next';

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get('next'));
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
      router.push(next);
    }
  }

  return (
    <main className="min-h-screen flex flex-col px-5 py-6 max-w-[428px] mx-auto">
      <div className="flex gap-1.5 mb-3">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`flex-1 h-1 rounded-full transition-colors ${
              step >= n ? 'bg-[#2563EB]' : 'bg-[#E7E7E2]'
            }`}
          />
        ))}
      </div>
      <div className="mb-2 text-[12px] font-semibold text-[#9CA3AF]">
        {step} / 3 단계
      </div>

      {step === 1 && (
        <div className="flex-1 flex flex-col">
          <h1 className="text-[24px] font-bold text-[#17191F] mb-2">
            어떤 이름으로<br />부를까요?
          </h1>
          <p className="text-[14px] text-[#707580] mb-6">
            친구들에게 보일 이름이에요
          </p>
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            autoFocus
          />
          <div className="mt-auto">
            <Button
              disabled={!nickname.trim()}
              onClick={() => setStep(2)}
              className="w-full"
            >다음</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col">
          <h1 className="text-[24px] font-bold text-[#17191F] mb-2">
            다니는 헬스장을<br />등록해주세요
          </h1>
          <p className="text-[14px] text-[#707580] mb-6">
            지금 헬스장에서 위치를 저장하면 근처에서만 체크인할 수 있어요
          </p>
          <div className="flex-1">
            <GymRegistrar
              onDone={(reg) => { setGym(reg); setStep(3); }}
            />
          </div>
        </div>
      )}

      {step === 3 && gym && (
        <div className="flex-1 flex flex-col">
          <h1 className="text-[24px] font-bold text-[#17191F] mb-2">
            주간 목표를 정해주세요
          </h1>
          <p className="text-[14px] text-[#707580] mb-6">
            일주일에 며칠 운동할까요?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                onClick={() => setGoal(n)}
                className={`h-14 rounded-[14px] text-[15px] font-semibold border transition-colors ${
                  goal === n
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white text-[#17191F] border-[#E7E7E2] hover:bg-[#F7F7F5]'
                }`}
              >
                주 {n}일
              </button>
            ))}
          </div>
          <div className="mt-auto pt-8">
            <Button
              disabled={saving}
              onClick={save}
              className="w-full"
            >{saving ? '저장중...' : '시작하기'}</Button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Onboarding() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  );
}
