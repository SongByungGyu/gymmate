'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Camera, CheckCircle2, AlertCircle, Dumbbell, RotateCcw } from 'lucide-react';

type Mode = 'idle' | 'gps' | 'photo-required' | 'photo-preview' | 'saving' | 'done' | 'error';

const PHOTO_PROMPT = '사진으로 인증할까요?';

export function CheckInFlow() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('idle');
  const [msg, setMsg] = useState('');
  const [promptReason, setPromptReason] = useState('');
  const [memo, setMemo] = useState('');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // preview object URL 메모리 정리
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function start() {
    setMode('gps');
    setMsg('위치를 확인하고 있어요');
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
      setPromptReason('위치 확인이 어려워요.');
    }
  }

  async function submit(method: 'gps' | 'photo', lat?: number, lng?: number, photoPath?: string) {
    setMode('saving');
    setMsg('저장하고 있어요');
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
        setPromptReason(`헬스장에서 ${Math.round(data.distance)}m 떨어져 있어요.`);
      } else {
        setMode('error');
        setMsg('체크인에 실패했어요');
      }
      return;
    }
    setMode('done');
    setMsg('체크인 완료!');
    setTimeout(() => {
      router.refresh();
      resetAll();
    }, 1500);
  }

  function resetAll() {
    setMode('idle');
    setMemo('');
    setMsg('');
    setPromptReason('');
    clearPreview();
  }

  function clearPreview() {
    setPreviewFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function onFileSelected() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMode('photo-preview');
  }

  function retake() {
    clearPreview();
    setMode('photo-required');
    // 다음 tick에 카메라 다시 오픈
    setTimeout(() => fileRef.current?.click(), 0);
  }

  async function confirmPhoto() {
    if (!previewFile) return;
    const file = previewFile;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMode('saving');
    setMsg('사진 업로드 중이에요');
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('check-in-photos').upload(path, file, { contentType: file.type });
    if (upErr) {
      setMode('error');
      setMsg('사진 업로드에 실패했어요');
      return;
    }
    await submit('photo', undefined, undefined, path);
    clearPreview();
  }

  return (
    <div className="space-y-3">
      {mode === 'idle' && (
        <>
          <Button onClick={start} className="w-full h-16 text-[17px]">
            <Dumbbell size={22} />
            오늘 헬스 감
          </Button>
          <Input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="오늘 뭐 했나요? (선택)"
          />
        </>
      )}

      {(mode === 'gps' || mode === 'saving') && (
        <div className="flex items-center justify-center gap-3 h-14 rounded-[14px] bg-[#EFF6FF] text-[#2563EB]">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-[15px] font-semibold">{msg}</span>
        </div>
      )}

      {mode === 'photo-required' && (
        <div className="space-y-3">
          <div className="rounded-[14px] bg-[#EFF6FF] p-4 text-[14px] text-[#1E40AF] break-keep">
            <p>{promptReason}</p>
            <p>{PHOTO_PROMPT}</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileSelected}
            className="hidden"
          />
          <Button onClick={() => fileRef.current?.click()} className="w-full">
            <Camera size={20} />
            사진으로 인증하기
          </Button>
          <Input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="오늘 뭐 했나요? (선택)"
          />
        </div>
      )}

      {mode === 'photo-preview' && previewUrl && (
        <div className="space-y-3">
          <div className="w-full aspect-[3/2] max-h-[280px] rounded-[14px] overflow-hidden bg-[#F7F7F5]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="촬영한 사진 미리보기"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-[13px] text-[#707580] text-center">
            이 사진으로 인증할까요?
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={retake}
              className="flex-1"
            >
              <RotateCcw size={18} />
              다시 찍기
            </Button>
            <Button onClick={confirmPhoto} className="flex-1">
              <CheckCircle2 size={20} />
              인증하기
            </Button>
          </div>
          <Input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="오늘 뭐 했나요? (선택)"
          />
        </div>
      )}

      {mode === 'done' && (
        <div className="flex items-center justify-center gap-3 h-14 rounded-[14px] bg-[#F0FDF4] text-[#166534]">
          <CheckCircle2 size={22} />
          <span className="text-[15px] font-semibold">{msg}</span>
        </div>
      )}

      {mode === 'error' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 h-14 rounded-[14px] bg-[#FEF2F2] text-[#991B1B] px-4">
            <AlertCircle size={20} />
            <span className="text-[15px] font-semibold flex-1">{msg}</span>
          </div>
          <Button variant="secondary" onClick={resetAll} className="w-full">
            다시 시도
          </Button>
        </div>
      )}
    </div>
  );
}
