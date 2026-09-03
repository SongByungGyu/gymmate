export default function TodayLoading() {
  return (
    <main className="px-5 pt-6 pb-8 space-y-7 animate-pulse">
      <div>
        <div className="h-[14px] w-16 bg-[#E7E7E2] rounded mb-2" />
        <div className="h-[22px] w-32 bg-[#E7E7E2] rounded" />
      </div>
      <section className="rounded-[16px] bg-white border border-[#E7E7E2] p-5">
        <div className="flex items-baseline justify-between mb-4">
          <div className="h-[14px] w-14 bg-[#E7E7E2] rounded" />
          <div className="h-[18px] w-16 bg-[#E7E7E2] rounded" />
        </div>
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 py-2">
              <div className="w-3 h-[11px] bg-[#E7E7E2] rounded" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#E7E7E2]" />
            </div>
          ))}
        </div>
        <div className="h-2 w-full rounded-full bg-[#E7E7E2]" />
      </section>
      <div className="h-16 w-full rounded-[14px] bg-[#DBEAFE]" />
      <div className="h-14 w-full rounded-[14px] bg-white border border-[#E7E7E2]" />
      <section>
        <div className="h-[16px] w-20 bg-[#E7E7E2] rounded mb-3" />
        <div className="h-24 w-full rounded-[14px] bg-white border border-[#E7E7E2]" />
      </section>
    </main>
  );
}
