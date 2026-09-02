'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

type Mode = 'idle' | 'gps' | 'photo-required' | 'saving' | 'done' | 'error';

export function CheckInFlow() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('idle');
  const [msg, setMsg] = useState('');
  const [memo, setMemo] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function start() {
    setMode('gps');
    setMsg('위치 확인 중...');
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('no geo'));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000, enableHighAccuracy: true,
        });
      });
      await submit('gps', pos.coords.latitude, pos.coords.longitude);
    } catch {
      setMode('photo-required');
      setMsg('위치 확인 실패. 사진으로 인증할까요?');
    }
  }

  async function submit(method: 'gps' | 'photo', lat?: number, lng?: number, photoPath?: string) {
    setMode('saving');
    const res = await fetch('/api/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verification_method: method,
        lat, lng,
        memo: memo || undefined,
        photo_path: photoPath,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.error === 'too far') {
        setMode('photo-required');
        setMsg(`헬스장에서 ${Math.round(data.distance)}m 떨어져 있어요. 사진으로 인증할까요?`);
      } else {
        setMode('error');
        setMsg('체크인 실패: ' + (data.error || '알 수 없음'));
      }
      return;
    }
    setMode('done');
    setTimeout(() => {
      router.refresh();
      setMode('idle');
      setMemo('');
    }, 1500);
  }

  async function submitPhoto() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('check-in-photos').upload(path, file, { contentType: file.type });
    if (upErr) {
      setMode('error');
      setMsg('사진 업로드 실패: ' + upErr.message);
      return;
    }
    await submit('photo', undefined, undefined, path);
  }

  return (
    <div className="space-y-4">
      {mode === 'idle' && (
        <button onClick={start} className="w-full bg-black text-white rounded py-6 text-lg font-bold">
          오늘 헬스 감
        </button>
      )}
      {(mode === 'gps' || mode === 'saving') && <p>{msg || '저장중...'}</p>}
      {mode === 'photo-required' && (
        <div className="space-y-3">
          <p>{msg}</p>
          <input
            ref={fileRef} type="file" accept="image/*" capture="environment"
            onChange={submitPhoto}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full bg-black text-white rounded py-4"
          >카메라로 인증</button>
        </div>
      )}
      {mode === 'done' && <p className="text-green-600 font-bold">체크인 완료!</p>}
      {mode === 'error' && (
        <>
          <p className="text-red-600">{msg}</p>
          <button onClick={() => setMode('idle')} className="underline">다시 시도</button>
        </>
      )}
      {(mode === 'idle' || mode === 'photo-required') && (
        <input
          value={memo} onChange={(e) => setMemo(e.target.value)}
          placeholder="오늘 뭐 했나요? (선택)"
          className="w-full border rounded px-3 py-2"
        />
      )}
    </div>
  );
}
