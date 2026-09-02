'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/today', label: '오늘' },
  { href: '/calendar', label: '캘린더' },
  { href: '/groups', label: '그룹' },
  { href: '/settings', label: '설정' },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 border-t bg-white flex">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 py-3 text-center text-sm ${active ? 'font-bold' : 'text-gray-500'}`}
          >{t.label}</Link>
        );
      })}
    </nav>
  );
}
