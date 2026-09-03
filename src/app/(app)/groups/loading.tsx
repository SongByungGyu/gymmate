export default function GroupsLoading() {
  return (
    <main className="px-5 pt-6 pb-8 space-y-7 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-[20px] w-32 bg-[#E7E7E2] rounded" />
        <div className="w-9 h-9 rounded-full bg-[#EFF6FF]" />
      </div>
      <div className="h-14 rounded-[14px] bg-white border border-[#E7E7E2]" />
      <section>
        <div className="h-[16px] w-24 bg-[#E7E7E2] rounded mb-3" />
        <ul className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="h-[15px] w-20 bg-[#E7E7E2] rounded" />
                <div className="h-[14px] w-14 bg-[#E7E7E2] rounded" />
              </div>
              <div className="h-2 w-full rounded-full bg-[#E7E7E2]" />
            </li>
          ))}
        </ul>
      </section>
      <section>
        <div className="h-[16px] w-16 bg-[#E7E7E2] rounded mb-3" />
        <div className="rounded-[14px] bg-white border border-[#E7E7E2] p-4 h-24" />
      </section>
    </main>
  );
}
