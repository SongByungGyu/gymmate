'use client';
import { useState } from 'react';
import type { Place } from '@/lib/kakao';

type Props = { onSelect: (place: Place) => void };

export function GymSearch({ onSelect }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const coords = await new Promise<GeolocationPosition | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 3000 });
      });
      const params = new URLSearchParams({ q });
      if (coords) {
        params.set('lat', String(coords.coords.latitude));
        params.set('lng', String(coords.coords.longitude));
      }
      const res = await fetch(`/api/kakao-search?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results);
    } catch {
      setError('검색 실패. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="헬스장 이름 (예: 스포애니 강남)"
          className="flex-1 border rounded px-3 py-2"
        />
        <button onClick={search} disabled={loading} className="bg-black text-white rounded px-4">
          {loading ? '...' : '검색'}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <ul className="space-y-2">
        {results.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onSelect(p)}
              className="w-full text-left border rounded p-3 hover:bg-gray-50"
            >
              <div className="font-medium">{p.place_name}</div>
              <div className="text-sm text-gray-600">
                {p.road_address || p.address}
              </div>
              {p.distance != null && (
                <div className="text-xs text-gray-500">{Math.round(p.distance)}m</div>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
