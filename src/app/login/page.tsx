'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Dumbbell } from 'lucide-react';
import { safeNextPath } from '@/lib/utils/safe-next';

function LoginInner() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get('next'));
  const kakaoError = searchParams.get('kakao_error');

  function kakaoStartHref() {
    if (next === '/today') return '/api/auth/kakao/start';
    return `/api/auth/kakao/start?next=${encodeURIComponent(next)}`;
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

      <div className="space-y-4">
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
      </div>
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
