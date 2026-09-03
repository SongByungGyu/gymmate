export default function CalendarLoading() {
  return (
    <main className="px-5 pt-6 pb-8 space-y-6 animate-pulse">
      <div className="h-[22px] w-20 bg-[#E7E7E2] rounded" />
      <div className="rounded-[16px] bg-white border border-[#E7E7E2] p-4">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="w-9 h-9 rounded-full bg-[#E7E7E2]" />
          <div className="h-[16px] w-24 bg-[#E7E7E2] rounded" />
          <div className="w-9 h-9 rounded-full bg-[#E7E7E2]" />
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="py-1 flex justify-center">
              <div className="h-[12px] w-3 bg-[#E7E7E2] rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-[10px] bg-[#F7F7F5]" />
          ))}
        </div>
      </div>
    </main>
  );
}
