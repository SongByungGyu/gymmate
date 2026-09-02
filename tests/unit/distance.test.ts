import { describe, it, expect } from 'vitest';
import { haversineMeters } from '@/lib/utils/distance';

describe('haversineMeters', () => {
  it('returns 0 for same point', () => {
    expect(haversineMeters(37.5, 127.0, 37.5, 127.0)).toBe(0);
  });

  it('returns ~111km for 1 degree of latitude', () => {
    const d = haversineMeters(37.0, 127.0, 38.0, 127.0);
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });

  it('returns <100m for nearby points', () => {
    const d = haversineMeters(37.4979, 127.0276, 37.4984, 127.0276);
    expect(d).toBeLessThan(100);
    expect(d).toBeGreaterThan(30);
  });
});
