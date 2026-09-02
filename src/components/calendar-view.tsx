'use client';
import { useState } from 'react';

type Props = {
  checkedDates: string[];
  onSelect: (date: string) => void;
  initialMonth?: Date;
};

export function CalendarView({ checkedDates, onSelect, initialMonth = new Date() }: Props) {
  const [month, setMonth] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
  const checkedSet = new Set(checkedDates);

  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const startWeekday = (first.getDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const fmt = (d: number) =>
    `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonth(new Date(year, m - 1, 1))}>‹</button>
        <div className="font-bold">{year}.{String(m + 1).padStart(2, '0')}</div>
        <button onClick={() => setMonth(new Date(year, m + 1, 1))}>›</button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-1">
        {['월', '화', '수', '목', '금', '토', '일'].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const date = fmt(day);
          const checked = checkedSet.has(date);
          return (
            <button
              key={i}
              onClick={() => onSelect(date)}
              className={`aspect-square rounded flex flex-col items-center justify-center border ${checked ? 'bg-black text-white' : ''}`}
            >
              <span className="text-sm">{day}</span>
              {checked && <span className="text-[8px]">●</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
