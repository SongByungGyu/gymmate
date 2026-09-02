'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  checkedDates: string[];
  selected: string | null;
  onSelect: (date: string) => void;
  initialMonth?: Date;
};

export function CalendarView({ checkedDates, selected, onSelect, initialMonth = new Date() }: Props) {
  const [month, setMonth] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
  const checkedSet = new Set(checkedDates);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

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
    <div className="rounded-[16px] bg-white border border-[#E7E7E2] p-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={() => setMonth(new Date(year, m - 1, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-full text-[#707580] hover:bg-[#F7F7F5]"
          aria-label="이전 달"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-[16px] font-bold text-[#17191F]">
          {year}년 {m + 1}월
        </div>
        <button
          onClick={() => setMonth(new Date(year, m + 1, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-full text-[#707580] hover:bg-[#F7F7F5]"
          aria-label="다음 달"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
          <div key={d} className="text-center text-[12px] font-semibold text-[#9CA3AF] py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const date = fmt(day);
          const checked = checkedSet.has(date);
          const isSelected = date === selected;
          const isToday = date === todayStr;

          const base = 'aspect-square rounded-[10px] flex flex-col items-center justify-center relative text-[14px]';
          let classes = '';
          if (isSelected) {
            classes = 'bg-[#2563EB] text-white font-semibold';
          } else if (isToday) {
            classes = 'text-[#2563EB] font-bold ring-1 ring-inset ring-[#2563EB]';
          } else {
            classes = 'text-[#17191F] hover:bg-[#F7F7F5]';
          }

          return (
            <button
              key={i}
              onClick={() => onSelect(date)}
              className={`${base} ${classes}`}
            >
              <span>{day}</span>
              {checked && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#2563EB]" />
              )}
              {checked && isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
