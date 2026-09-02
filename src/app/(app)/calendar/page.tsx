'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { CalendarView } from '@/components/calendar-view';
import type { CheckIn } from '@/lib/types';

type EnrichedCheckIn = CheckIn & { photo_signed?: string | null };

export default function Calendar() {
  const [checkedDates, setCheckedDates] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dayCheckins, setDayCheckins] = useState<EnrichedCheckIn[]>([]);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('check_ins').select('local_date')
        .eq('user_id', user.id);
      setCheckedDates([...new Set((data ?? []).map((r) => r.local_date))]);
    })();
  }, []);

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
    const enriched = await Promise.all(
      rows.map(async (c) => {
        if (!c.photo_url) return { ...c, photo_signed: null };
        const { data: sig } = await supabase.storage
          .from('check-in-photos').createSignedUrl(c.photo_url, 3600);
        return { ...c, photo_signed: sig?.signedUrl ?? null };
      })
    );
    setDayCheckins(enriched);
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-bold">캘린더</h1>
      <CalendarView checkedDates={checkedDates} onSelect={pick} />
      {selected && (
        <section>
          <h2 className="font-bold mb-2">{selected}</h2>
          {dayCheckins.length === 0 ? (
            <p className="text-sm text-gray-500">이 날은 기록 없음</p>
          ) : (
            <ul className="space-y-2">
              {dayCheckins.map((c) => (
                <li key={c.id} className="border rounded p-3">
                  <div className="text-xs text-gray-500">
                    {new Date(c.checked_in_at).toLocaleTimeString('ko-KR')} ·{' '}
                    {c.verification_method === 'gps' ? '📍' : '📷'}
                  </div>
                  {c.memo && <p className="mt-1">{c.memo}</p>}
                  {c.photo_signed && (
                    <img src={c.photo_signed} alt="" className="mt-2 rounded max-w-xs" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
