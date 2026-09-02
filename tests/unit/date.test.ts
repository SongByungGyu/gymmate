import { describe, it, expect } from 'vitest';
import { toKstDate } from '@/lib/utils/date';

describe('toKstDate', () => {
  it('returns KST date for UTC 15:00 (midnight KST)', () => {
    expect(toKstDate(new Date('2026-09-01T15:00:00Z'))).toBe('2026-09-02');
  });

  it('returns previous day for UTC 14:59', () => {
    expect(toKstDate(new Date('2026-09-01T14:59:00Z'))).toBe('2026-09-01');
  });
});
