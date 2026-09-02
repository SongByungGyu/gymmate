import { TabBar } from '@/components/tab-bar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-16">
      {children}
      <TabBar />
    </div>
  );
}
