'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Copy, MapPin, Camera, MoreVertical, Plus, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PhotoLightbox } from '@/components/photo-lightbox';

type Group = { id: string; name: string; invite_code: string; created_by: string };
type Stat = { userId: string; nickname: string; goal: number; days: number; todayDone: boolean };
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
  const [openMemberMenu, setOpenMemberMenu] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const isAdmin = activeGroup.created_by === currentUserId;

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('복사에 실패했어요. 링크: ' + inviteUrl);
    }
  }

  async function refreshInvite() {
    if (!confirm('새 링크를 발급하면 기존 링크는 무효화됩니다. 진행할까요?')) return;
    const res = await fetch(`/api/groups/${activeGroup.id}/invite-refresh`, { method: 'POST' });
    if (res.ok) location.reload();
    else alert('실패');
  }

  async function kick(userId: string, nickname: string) {
    setOpenMemberMenu(null);
    if (!confirm(`${nickname}님을 추방할까요?`)) return;
    const res = await fetch(`/api/groups/${activeGroup.id}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) location.reload();
    else alert('실패');
  }

  return (
    <main className="px-5 pt-6 pb-8 space-y-7">
      {/* Group header */}
      <div className="flex items-center justify-between">
        <select
          value={activeGroup.id}
          onChange={(e) => { window.location.href = `/groups?g=${e.target.value}`; }}
          className="text-[20px] font-bold text-[#17191F] bg-transparent border-none focus:outline-none pr-2 max-w-[70%]"
        >
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <Link
          href="/groups/new"
          className="w-9 h-9 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]"
          aria-label="새 그룹"
        >
          <Plus size={20} />
        </Link>
      </div>

      {/* Invite link row */}
      <button
        onClick={copy}
        className="w-full flex items-center gap-3 rounded-[14px] bg-white border border-[#E7E7E2] px-4 py-3"
      >
        <div className="w-9 h-9 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] shrink-0">
          <Copy size={16} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[12px] text-[#707580]">초대 링크</div>
          <div className="text-[13px] text-[#17191F] truncate">{inviteUrl}</div>
        </div>
        <span className="text-[12px] font-semibold text-[#2563EB] shrink-0">
          {copied ? '복사됨' : '복사'}
        </span>
      </button>

      {/* Weekly progress per member — nickname only, no avatars.
          오늘 완료 여부는 nickname 왼쪽 작은 dot으로 표시 (초록=완료 / 회색=아직) */}
      <section>
        <h2 className="text-[16px] font-bold text-[#17191F] mb-3">이번주 달성률</h2>
        <ul className="space-y-4">
          {stats.map((s) => {
            const isMe = s.userId === currentUserId;
            const showAdminMenu = isAdmin && !isMe;
            return (
              <li key={s.userId} className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${s.todayDone ? 'bg-[#22C55E]' : 'bg-[#E2E8F0]'}`}
                      aria-label={s.todayDone ? '오늘 완료' : '오늘 아직'}
                    />
                    <span className="text-[15px] font-semibold text-[#17191F] truncate">
                      {s.nickname}
                    </span>
                    {isMe && (
                      <span className="text-[11px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.5 rounded">
                        나
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-[#707580]">
                      {s.days} / {s.goal}일
                    </span>
                    {showAdminMenu && (
                      <button
                        onClick={() => setOpenMemberMenu(openMemberMenu === s.userId ? null : s.userId)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#9CA3AF] hover:bg-[#F7F7F5]"
                        aria-label="멤버 관리"
                      >
                        <MoreVertical size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <Progress value={s.days} max={s.goal} />
                {openMemberMenu === s.userId && (
                  <div className="absolute right-0 top-8 z-10 rounded-[12px] bg-white border border-[#E7E7E2] shadow-sm py-1 min-w-[120px]">
                    <button
                      onClick={() => kick(s.userId, s.nickname)}
                      className="w-full text-left px-3 py-2 text-[14px] text-[#EF4444] hover:bg-[#FEF2F2]"
                    >
                      추방하기
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Recent activity feed — nickname only, with actual check-in photos */}
      <section>
        <h2 className="text-[16px] font-bold text-[#17191F] mb-3">최근 활동</h2>
        {recent.length === 0 ? (
          <p className="text-[14px] text-[#9CA3AF] py-4 text-center">
            아직 활동이 없어요
          </p>
        ) : (
          <ul className="space-y-3">
            {recent.map((r) => {
              const isGps = r.verification_method === 'gps';
              const Icon = isGps ? MapPin : Camera;
              const label = isGps ? 'GPS 인증' : '사진 인증';
              const time = new Date(r.checked_in_at).toLocaleString('ko-KR', {
                month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
              });
              return (
                <li
                  key={r.id}
                  className="rounded-[14px] bg-white border border-[#E7E7E2] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold text-[#17191F]">{r.nickname}</div>
                      <div className="flex items-center gap-1.5 text-[13px] text-[#707580] mt-0.5">
                        <Icon size={13} className="text-[#2563EB]" />
                        <span>{label}</span>
                        <span className="text-[#9CA3AF]">·</span>
                        <span>{time}</span>
                      </div>
                    </div>
                  </div>
                  {r.memo && (
                    <p className="text-[14px] text-[#17191F] mt-2">{r.memo}</p>
                  )}
                  {r.photo_signed && (
                    <button
                      onClick={() => setLightbox(r.photo_signed!)}
                      className="mt-3 block w-full aspect-[3/2] max-h-[240px] rounded-[12px] overflow-hidden bg-[#F7F7F5]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.photo_signed}
                        alt="체크인 사진"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {isAdmin && (
        <section>
          <button
            onClick={refreshInvite}
            className="w-full flex items-center justify-center gap-2 rounded-[14px] border border-[#E7E7E2] bg-white py-3 text-[14px] text-[#707580]"
          >
            <RefreshCw size={16} />
            새 초대 링크 발급
          </button>
        </section>
      )}

      {lightbox && <PhotoLightbox url={lightbox} onClose={() => setLightbox(null)} />}
    </main>
  );
}
