'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="min-h-screen flex flex-col justify-center px-5 py-8 max-w-[428px] mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-[28px] font-bold text-[#17191F]">GymMate</h1>
        <p className="text-[14px] text-[#707580] mt-2">
          친구와 함께 헬스장 출석을 공유해요
        </p>
      </div>

      {sent ? (
        <div className="rounded-[16px] bg-white border border-[#E7E7E2] p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={26} className="text-[#22C55E]" />
          </div>
          <p className="text-[15px] font-semibold text-[#17191F]">
            이메일로 링크를 보냈어요
          </p>
          <p className="text-[13px] text-[#707580] mt-1">
            메일함을 확인해주세요
          </p>
        </div>
      ) : (
        <form onSubmit={send} className="space-y-3">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            autoComplete="email"
          />
          <Button type="submit" disabled={loading} className="w-full">
            <Mail size={18} />
            {loading ? '전송 중...' : '로그인 링크 받기'}
          </Button>
          {error && (
            <p className="text-[13px] text-[#EF4444] text-center">{error}</p>
          )}
        </form>
      )}
    </main>
  );
}
