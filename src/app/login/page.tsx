'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dumbbell, Mail, CheckCircle2 } from 'lucide-react';
import { safeNextPath } from '@/lib/utils/safe-next';

const RESEND_COOLDOWN_S = 60;

function LoginInner() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get('next'));
  const kakaoError = searchParams.get('kakao_error');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  function buildEmailRedirectTo() {
    const base = `${window.location.origin}/auth/callback`;
    if (next === '/today') return base;
    return `${base}?next=${encodeURIComponent(next)}`;
  }

  function kakaoStartHref() {
    if (next === '/today') return '/api/auth/kakao/start';
    return `/api/auth/kakao/start?next=${encodeURIComponent(next)}`;
  }

  async function requestLink(target: string) {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: target,
      options: { emailRedirectTo: buildEmailRedirectTo() },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return false;
    }
    return true;
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const ok = await requestLink(email);
    if (ok) {
      setSentEmail(email);
      setSent(true);
      setCooldown(RESEND_COOLDOWN_S);
    }
  }

  async function resend() {
    if (cooldown > 0 || loading) return;
    const ok = await requestLink(sentEmail);
    if (ok) setCooldown(RESEND_COOLDOWN_S);
  }

  function useDifferentEmail() {
    setSent(false);
    setSentEmail('');
    setError(null);
    setEmail('');
    setCooldown(0);
  }

  return (
    <main className="min-h-screen flex flex-col justify-center px-5 py-8 max-w-[428px] mx-auto">
      <div className="mb-10 text-center">
        <div className="w-16 h-16 rounded-[20px] bg-[#2563EB] flex items-center justify-center mx-auto mb-4">
          <Dumbbell size={32} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-[28px] font-bold text-[#17191F]">GymMate</h1>
        <p className="text-[14px] text-[#707580] mt-2">
          친구와 함께 헬스장 출석을 공유해요
        </p>
      </div>

      {sent ? (
        <div className="space-y-4">
          <div className="rounded-[16px] bg-white border border-[#E7E7E2] p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={26} className="text-[#22C55E]" />
            </div>
            <p className="text-[15px] font-semibold text-[#17191F]">
              이메일로 링크를 보냈어요
            </p>
            <p className="text-[13px] text-[#707580] mt-1 break-all">
              {sentEmail}
            </p>
            <p className="text-[13px] text-[#707580] mt-1">
              메일함을 확인해주세요
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={resend}
              disabled={cooldown > 0 || loading}
              className="h-12 rounded-[14px] bg-white border border-[#E7E7E2] text-[14px] font-semibold text-[#17191F] disabled:text-[#9CA3AF]"
            >
              {loading
                ? '전송 중...'
                : cooldown > 0
                  ? `${cooldown}초 후 다시 보내기`
                  : '로그인 링크 다시 보내기'}
            </button>
            <button
              onClick={useDifferentEmail}
              className="h-12 text-[14px] font-semibold text-[#2563EB]"
            >
              다른 방법으로 로그인
            </button>
          </div>
          {error && (
            <p className="text-[13px] text-[#EF4444] text-center">{error}</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {kakaoError && (
            <div className="rounded-[14px] bg-[#FEF2F2] border border-[#FEE2E2] p-3 text-[13px] text-[#991B1B] text-center">
              카카오 로그인에 실패했어요. 다시 시도해주세요.
            </div>
          )}
          <a
            href={kakaoStartHref()}
            className="w-full h-14 rounded-[14px] bg-[#FEE500] text-[rgba(0,0,0,0.85)] text-[16px] font-semibold flex items-center justify-center gap-2 active:opacity-90 transition-opacity"
          >
            <KakaoIcon />
            카카오 로그인
          </a>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E7E7E2]" />
            <span className="text-[13px] text-[#9CA3AF]">또는 이메일로</span>
            <div className="flex-1 h-px bg-[#E7E7E2]" />
          </div>

          <form onSubmit={send} className="space-y-3">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              autoComplete="email"
            />
            <Button variant="secondary" type="submit" disabled={loading} className="w-full">
              <Mail size={18} />
              {loading ? '전송 중...' : '로그인 링크 받기'}
            </Button>
            {error && (
              <p className="text-[13px] text-[#EF4444] text-center">{error}</p>
            )}
          </form>
        </div>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function KakaoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10 2C5.03 2 1 5.13 1 9c0 2.42 1.55 4.55 3.91 5.77-.17.6-.62 2.24-.71 2.59-.11.43.16.43.34.31.14-.09 2.24-1.53 3.15-2.14.4.06.81.09 1.22.09 4.97 0 9-3.13 9-7s-4.03-7-9-7z" />
    </svg>
  );
}
