'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Users, Settings } from 'lucide-react';

const tabs = [
  { href: '/today', label: '오늘', Icon: Home },
  { href: '/calendar', label: '캘린더', Icon: Calendar },
  { href: '/groups', label: '그룹', Icon: Users },
  { href: '/settings', label: '설정', Icon: Settings },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 border-t border-[#E7E7E2] bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto max-w-[428px] flex">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.href);
          const color = active ? '#2563EB' : '#9CA3AF';
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
              style={{ color }}
            >
              <t.Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className={`text-[11px] ${active ? 'font-semibold' : 'font-medium'}`}>
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
