'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="min-h-screen p-8 flex flex-col justify-center max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-6">짐메이트</h1>
      {sent ? (
        <p>이메일로 링크를 보냈어요. 메일함을 확인하세요.</p>
      ) : (
        <form onSubmit={send} className="space-y-4">
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일" autoComplete="email"
            className="w-full border rounded px-4 py-3"
          />
          <button type="submit" className="w-full bg-black text-white rounded px-4 py-3">
            로그인 링크 받기
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      )}
    </main>
  );
}
