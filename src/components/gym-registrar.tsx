'use client';
import { useState } from 'react';
import { MapPin, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type GymRegistration = {
  name: string;
  lat: number;
  lng: number;
};

type Props = {
  onDone: (reg: GymRegistration) => void;
  onCancel?: () => void;
};

export function GymRegistrar({ onDone, onCancel }: Props) {
  const [name, setName] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function capture() {
    setLocating(true);
    setError(null);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('no geo'));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000, enableHighAccuracy: true,
        });
      });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      setError('위치를 가져올 수 없어요. 권한을 확인해주세요.');
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[13px] font-semibold text-[#707580] mb-1.5 block">
          헬스장 이름
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 우리동네 헬스장"
        />
      </div>

      <div>
        <label className="text-[13px] font-semibold text-[#707580] mb-1.5 block">
          위치
        </label>
        {coords ? (
          <div className="rounded-[14px] bg-[#F0FDF4] border border-[#DCFCE7] p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={18} className="text-[#22C55E]" />
              <span className="text-[14px] font-semibold text-[#166534]">
                위치가 저장됐어요
              </span>
            </div>
            <button
              onClick={capture}
              className="text-[13px] text-[#707580] underline mt-1"
            >
              다시 잡기
            </button>
          </div>
        ) : (
          <button
            onClick={capture}
            disabled={locating}
            className="w-full h-14 rounded-[14px] bg-white border border-[#E7E7E2] text-[15px] font-semibold text-[#17191F] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <MapPin size={18} className="text-[#2563EB]" />
            {locating ? '위치 확인 중...' : '여기가 내 헬스장'}
          </button>
        )}
        {error && <p className="text-[13px] text-[#EF4444] mt-2">{error}</p>}
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            취소
          </Button>
        )}
        <Button
          disabled={!name.trim() || !coords}
          onClick={() => coords && onDone({ name, lat: coords.lat, lng: coords.lng })}
          className="flex-1"
        >
          저장
        </Button>
      </div>
    </div>
  );
}
