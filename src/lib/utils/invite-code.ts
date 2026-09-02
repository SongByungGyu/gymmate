const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generateInviteCode(): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}
