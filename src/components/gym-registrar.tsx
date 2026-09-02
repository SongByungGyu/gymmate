'use client';
import { useState } from 'react';

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
        <label className="text-sm text-gray-600">헬스장 이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 우리동네 헬스장"
          className="w-full border rounded px-4 py-3 mt-1"
        />
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-2">
          <strong>지금 헬스장에서</strong> 아래 버튼을 눌러 위치를 저장하세요.
          이 좌표를 기준으로 100m 이내에서 체크인 가능.
        </p>
        {coords ? (
          <div className="border rounded p-3 bg-green-50">
            <p className="text-sm">✅ 위치 저장됨</p>
            <p className="text-xs text-gray-500 mt-1">
              위도 {coords.lat.toFixed(6)}, 경도 {coords.lng.toFixed(6)}
            </p>
            <button
              onClick={capture}
              className="text-xs underline mt-2"
            >다시 잡기</button>
          </div>
        ) : (
          <button
            onClick={capture}
            disabled={locating}
            className="w-full border rounded py-3 disabled:opacity-50"
          >{locating ? '위치 확인 중...' : '📍 여기가 내 헬스장'}</button>
        )}
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <button onClick={onCancel} className="flex-1 border rounded py-3">
            취소
          </button>
        )}
        <button
          disabled={!name.trim() || !coords}
          onClick={() => coords && onDone({ name, lat: coords.lat, lng: coords.lng })}
          className="flex-1 bg-black text-white rounded py-3 disabled:bg-gray-300"
        >저장</button>
      </div>
    </div>
  );
}
