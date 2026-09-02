'use client';
import { useState } from 'react';
import { MapPin, Camera } from 'lucide-react';
import { PhotoLightbox } from '@/components/photo-lightbox';

type Record = {
  id: string;
  checked_in_at: string;
  memo: string | null;
  verification_method: 'gps' | 'photo';
  photo_url: string | null;
  photo_signed: string | null;
};

export function TodayRecords({ records }: { records: Record[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <p className="text-[14px] text-[#9CA3AF] py-4 text-center">
        아직 오늘 기록이 없어요
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {records.map((c) => {
          const isGps = c.verification_method === 'gps';
          const Icon = isGps ? MapPin : Camera;
          const label = isGps ? 'GPS 인증' : '사진 인증';
          const time = new Date(c.checked_in_at).toLocaleTimeString('ko-KR', {
            hour: '2-digit', minute: '2-digit',
          });
          return (
            <li
              key={c.id}
              className="rounded-[14px] bg-white border border-[#E7E7E2] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-[#17191F]">{label}</span>
                    <span className="text-[13px] text-[#9CA3AF]">{time}</span>
                  </div>
                  {c.memo && <p className="text-[14px] text-[#707580] mt-0.5">{c.memo}</p>}
                </div>
              </div>
              {c.photo_signed && (
                <button
                  onClick={() => setLightbox(c.photo_signed)}
                  className="mt-3 block w-full aspect-[4/3] rounded-[12px] overflow-hidden bg-[#F7F7F5]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.photo_signed}
                    alt="체크인 사진"
                    className="w-full h-full object-cover"
                  />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {lightbox && <PhotoLightbox url={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}
