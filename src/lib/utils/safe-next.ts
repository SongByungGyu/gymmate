const FALLBACK = '/today';
const MAX_LENGTH = 200;

export function safeNextPath(next: string | null | undefined): string {
  if (!next || typeof next !== 'string') return FALLBACK;
  if (next.length > MAX_LENGTH) return FALLBACK;
  if (!next.startsWith('/')) return FALLBACK;
  if (next.startsWith('//')) return FALLBACK;
  if (next.startsWith('/\\')) return FALLBACK;
  if (next.includes('://')) return FALLBACK;
  return next;
}
