'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { CalendarView } from '@/components/calendar-view';
import { PhotoLightbox } from '@/components/photo-lightbox';
import { MapPin, Camera } from 'lucide-react';
import type { CheckIn } from '@/lib/types';

export type EnrichedCheckIn = CheckIn & { photo_signed?: string | null };

type Props = {
  checkedDates: string[];
  initialSelected: string;
  initialDayCheckins: EnrichedCheckIn[];
};

export function CalendarClient({ checkedDates, initialSelected, initialDayCheckins }: Props) {
  const [selected, setSelected] = useState<string | null>(initialSelected);
  const [dayCheckins, setDayCheckins] = useState<EnrichedCheckIn[]>(initialDayCheckins);
  const [lightbox, setLightbox] = useState<string | null>(null);

  async function pick(date: string) {
    setSelected(date);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('check_ins').select('*')
      .eq('user_id', user.id).eq('local_date', date)
      .order('checked_in_at', { ascending: false });
    const rows = (data ?? []) as CheckIn[];
    const photoPaths = rows.map((r) => r.photo_url).filter((p): p is string => !!p);
    const signedMap = new Map<string, string>();
    if (photoPaths.length > 0) {
      const { data: signed } = await supabase.storage
        .from('check-in-photos').createSignedUrls(photoPaths, 3600);
      for (const s of signed ?? []) {
        if (s.path && s.signedUrl) signedMap.set(s.path, s.signedUrl);
      }
    }
    setDayCheckins(rows.map((c) => ({
      ...c,
      photo_signed: c.photo_url ? signedMap.get(c.photo_url) ?? null : null,
    })));
  }

  const formatDate = (s: string) => {
    const [, m, d] = s.split('-').map(Number);
    return `${m}월 ${d}일`;
  };

  return (
    <main className="px-5 pt-6 pb-8 space-y-6">
      <h1 className="text-[22px] font-bold text-[#17191F]">캘린더</h1>
      <CalendarView checkedDates={checkedDates} selected={selected} onSelect={pick} />

      {selected && (
        <section className="space-y-3">
          <h2 className="text-[16px] font-bold text-[#17191F]">
            {formatDate(selected)}
          </h2>
          {dayCheckins.length === 0 ? (
            <p className="text-[14px] text-[#9CA3AF] py-4 text-center">
              이 날은 운동 기록이 없어요
            </p>
          ) : (
            <ul className="space-y-2">
              {dayCheckins.map((c) => {
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
                        onClick={() => setLightbox(c.photo_signed!)}
                        className="mt-3 block w-full aspect-[3/2] max-h-[240px] rounded-[12px] overflow-hidden bg-[#F7F7F5]"
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
          )}
        </section>
      )}

      {lightbox && <PhotoLightbox url={lightbox} onClose={() => setLightbox(null)} />}
    </main>
  );
}
