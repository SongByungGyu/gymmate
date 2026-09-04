'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type Props = {
  checkedDates: string[];
  selected: string | null;
  onSelect: (date: string) => void;
  initialMonth?: Date;
};

const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export function CalendarView({ checkedDates, selected, onSelect, initialMonth = new Date() }: Props) {
  const [month, setMonth] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(initialMonth.getFullYear());
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

  function openPicker() {
    setPickerYear(year);
    setPickerOpen(true);
  }

  function pickMonth(mi: number) {
    setMonth(new Date(pickerYear, mi, 1));
    setPickerOpen(false);
  }

  // ESC로 picker 닫기 + body 스크롤 잠금
  useEffect(() => {
    if (!pickerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPickerOpen(false); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [pickerOpen]);

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
        <button
          onClick={openPicker}
          className="text-[16px] font-bold text-[#17191F] px-2 py-1 rounded-lg hover:bg-[#F7F7F5] active:bg-[#EFF6FF]"
          aria-label="연/월 선택"
        >
          {year}년 {m + 1}월
        </button>
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

      {pickerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center"
          onClick={() => setPickerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="연/월 선택"
        >
          <div
            className="w-full max-w-[428px] bg-white rounded-t-[20px] sm:rounded-[20px] p-5 pb-8"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setPickerYear((y) => y - 1)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-[#707580] hover:bg-[#F7F7F5]"
                aria-label="이전 해"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-[18px] font-bold text-[#17191F]">
                {pickerYear}년
              </div>
              <button
                onClick={() => setPickerYear((y) => y + 1)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-[#707580] hover:bg-[#F7F7F5]"
                aria-label="다음 해"
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => setPickerOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-[#707580] hover:bg-[#F7F7F5] ml-1"
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {MONTH_LABELS.map((label, mi) => {
                const isCurrent = pickerYear === year && mi === m;
                const isThisMonth = pickerYear === today.getFullYear() && mi === today.getMonth();
                let cls = 'bg-white text-[#17191F] border border-[#E7E7E2] hover:bg-[#F7F7F5]';
                if (isCurrent) cls = 'bg-[#2563EB] text-white border-[#2563EB]';
                else if (isThisMonth) cls = 'bg-white text-[#2563EB] font-semibold border border-[#2563EB]';
                return (
                  <button
                    key={mi}
                    onClick={() => pickMonth(mi)}
                    className={`h-12 rounded-[12px] text-[14px] font-semibold transition-colors ${cls}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
