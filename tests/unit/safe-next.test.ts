import { describe, it, expect } from 'vitest';
import { safeNextPath } from '../../src/lib/utils/safe-next';

describe('safeNextPath', () => {
  it('fallback for null', () => {
    expect(safeNextPath(null)).toBe('/today');
  });
  it('fallback for undefined', () => {
    expect(safeNextPath(undefined)).toBe('/today');
  });
  it('fallback for empty string', () => {
    expect(safeNextPath('')).toBe('/today');
  });
  it('blocks protocol-relative //evil.com', () => {
    expect(safeNextPath('//evil.com')).toBe('/today');
  });
  it('blocks backslash prefix /\\evil.com', () => {
    expect(safeNextPath('/\\evil.com')).toBe('/today');
  });
  it('blocks absolute http url', () => {
    expect(safeNextPath('https://evil.com')).toBe('/today');
  });
  it('blocks javascript scheme', () => {
    expect(safeNextPath('javascript:alert(1)')).toBe('/today');
  });
  it('blocks embedded protocol in path', () => {
    expect(safeNextPath('/redirect?url=https://evil.com')).toBe('/today');
  });
  it('blocks bare word (no slash)', () => {
    expect(safeNextPath('today')).toBe('/today');
  });
  it('blocks overly long path', () => {
    expect(safeNextPath('/' + 'a'.repeat(300))).toBe('/today');
  });
  it('accepts /today', () => {
    expect(safeNextPath('/today')).toBe('/today');
  });
  it('accepts /join/ABC123', () => {
    expect(safeNextPath('/join/ABC123')).toBe('/join/ABC123');
  });
  it('accepts /settings with query', () => {
    expect(safeNextPath('/settings?foo=1')).toBe('/settings?foo=1');
  });
  it('accepts /groups?g=uuid', () => {
    expect(safeNextPath('/groups?g=uuid')).toBe('/groups?g=uuid');
  });
});
