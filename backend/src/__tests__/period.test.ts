import { describe, expect, it } from 'vitest';
import { resolveDateRange } from '../utils/period';

describe('resolveDateRange', () => {
  it('resolves month and year to full UTC month bounds', () => {
    const range = resolveDateRange({ month: 2, year: 2026 });
    expect(range).toBeDefined();
    expect(range!.start.toISOString()).toBe('2026-02-01T00:00:00.000Z');
    expect(range!.end.toISOString()).toBe('2026-02-28T23:59:59.999Z');
  });

  it('resolves custom startDate and endDate interval', () => {
    const range = resolveDateRange({
      startDate: '2026-05-10',
      endDate: '2026-05-25',
    });
    expect(range).toBeDefined();
    expect(range!.start.toISOString()).toBe('2026-05-10T00:00:00.000Z');
    expect(range!.end.toISOString()).toBe('2026-05-25T23:59:59.999Z');
  });

  it('returns undefined when no period filter is supplied', () => {
    expect(resolveDateRange({})).toBeUndefined();
  });
});
