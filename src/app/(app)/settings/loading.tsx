export default function SettingsLoading() {
  return (
    <main className="px-5 pt-6 pb-8 animate-pulse">
      <div className="h-[22px] w-16 bg-[#E7E7E2] rounded mb-6" />
      <div className="space-y-6">
        <section>
          <div className="h-[13px] w-12 bg-[#E7E7E2] rounded mb-2 mx-1" />
          <div className="rounded-[16px] bg-white border border-[#E7E7E2] p-4 h-24" />
        </section>
        <section>
          <div className="h-[13px] w-16 bg-[#E7E7E2] rounded mb-2 mx-1" />
          <div className="rounded-[16px] bg-white border border-[#E7E7E2] p-4 h-40" />
        </section>
        <div className="h-14 rounded-[14px] bg-[#DBEAFE]" />
        <section>
          <div className="h-[13px] w-14 bg-[#E7E7E2] rounded mb-2 mx-1" />
          <div className="rounded-[16px] bg-white border border-[#E7E7E2] p-4 h-20" />
        </section>
        <div className="h-12 rounded-[14px] bg-white border border-[#FEE2E2]" />
      </div>
    </main>
  );
}
