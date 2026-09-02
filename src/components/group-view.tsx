'use client';
import { useState } from 'react';
import Link from 'next/link';

type Group = { id: string; name: string; invite_code: string; created_by: string };
type Stat = { userId: string; nickname: string; goal: number; days: number };
type Recent = {
  id: string; user_id: string; nickname: string; checked_in_at: string;
  verification_method: 'gps' | 'photo'; memo: string | null; photo_url: string | null;
  photo_signed: string | null;
};

export function GroupView(props: {
  groups: Group[];
  activeGroup: Group;
  currentUserId: string;
  stats: Stat[];
  recent: Recent[];
  inviteUrl: string;
}) {
  const { groups, activeGroup, currentUserId, stats, recent, inviteUrl } = props;
  const [copied, setCopied] = useState(false);
  const isAdmin = activeGroup.created_by === currentUserId;

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('복사 실패. 링크: ' + inviteUrl);
    }
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <select
          value={activeGroup.id}
          onChange={(e) => { window.location.href = `/groups?g=${e.target.value}`; }}
          className="border rounded px-2 py-1"
        >
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <Link href="/groups/new" className="text-sm underline">새 그룹</Link>
      </div>

      <section>
        <button
          onClick={copy}
          className="w-full border rounded px-4 py-3 text-left"
        >
          <div className="text-xs text-gray-500">초대 링크</div>
          <div className="truncate">{inviteUrl}</div>
          <div className="text-xs text-blue-600 mt-1">
            {copied ? '복사됨!' : '탭해서 복사'}
          </div>
        </button>
      </section>

      <section>
        <h2 className="font-bold mb-2">이번주 달성률</h2>
        <ul className="space-y-2">
          {stats.map((s) => {
            const pct = Math.round((s.days / s.goal) * 100);
            return (
              <li key={s.userId} className="border rounded p-3">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{s.nickname}</span>
                  <span className="text-sm">{s.days}/{s.goal}일 · {pct}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-black" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="font-bold mb-2">최근 활동</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500">아직 활동이 없어요</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((r) => (
              <li key={r.id} className="border rounded p-3">
                <div className="text-sm">
                  <span className="font-medium">{r.nickname}</span> ·{' '}
                  <span className="text-gray-500">
                    {new Date(r.checked_in_at).toLocaleString('ko-KR')}
                  </span> ·{' '}
                  {r.verification_method === 'gps' ? '📍' : '📷'}
                </div>
                {r.memo && <p className="text-sm mt-1">{r.memo}</p>}
                {r.photo_signed && <img src={r.photo_signed} alt="" className="mt-2 rounded max-w-xs" />}
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin && (
        <section>
          <p className="text-xs text-gray-500">방장 도구는 다음 태스크에서 추가</p>
        </section>
      )}
    </main>
  );
}
