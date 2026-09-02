const PALETTE = [
  { bg: '#DBEAFE', fg: '#1E40AF' },
  { bg: '#DCFCE7', fg: '#166534' },
  { bg: '#FEE2E2', fg: '#991B1B' },
  { bg: '#FEF3C7', fg: '#92400E' },
  { bg: '#E0E7FF', fg: '#3730A3' },
  { bg: '#F3E8FF', fg: '#6B21A8' },
  { bg: '#FFE4E6', fg: '#9F1239' },
  { bg: '#CCFBF1', fg: '#115E59' },
];

export function avatarColor(name: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % PALETTE.length;
  return PALETTE[idx];
}

export function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.slice(0, 2);
}
