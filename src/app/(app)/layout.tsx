import { TabBar } from '@/components/tab-bar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F7F5]" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
      <div className="mx-auto max-w-[428px]">
        {children}
      </div>
      <TabBar />
    </div>
  );
}
