import { describe, it, expect } from 'vitest';
import { getWeekRangeKST } from '@/lib/utils/week';

describe('getWeekRangeKST', () => {
  it('returns Mon-Sun range for a Wednesday', () => {
    const { start, end } = getWeekRangeKST(new Date('2026-09-02T12:00:00+09:00'));
    expect(start).toBe('2026-08-31');
    expect(end).toBe('2026-09-06');
  });

  it('returns same week for a Sunday (last day)', () => {
    const { start, end } = getWeekRangeKST(new Date('2026-09-06T23:00:00+09:00'));
    expect(start).toBe('2026-08-31');
    expect(end).toBe('2026-09-06');
  });

  it('returns next week for a Monday (first day)', () => {
    const { start, end } = getWeekRangeKST(new Date('2026-09-07T00:30:00+09:00'));
    expect(start).toBe('2026-09-07');
    expect(end).toBe('2026-09-13');
  });
});
