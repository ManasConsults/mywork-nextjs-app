import { toMinorUnit, fromMinorUnit } from './money';

describe('toMinorUnit', () => {
  it('converts a whole-pound amount to pence', () => {
    expect(toMinorUnit(10)).toBe(1000);
  });

  it('converts a decimal amount with rounding', () => {
    expect(toMinorUnit(12.5)).toBe(1250);
    expect(toMinorUnit(0.01)).toBe(1);
    expect(toMinorUnit(99.99)).toBe(9999);
  });

  it('uses Math.round (0.5 rounds up)', () => {
    // 0.005 * 100 = 0.5 → Math.round gives 1 (not 0 as Math.floor would)
    expect(toMinorUnit(0.005)).toBe(1);
  });

  it('returns 0 for 0', () => {
    expect(toMinorUnit(0)).toBe(0);
  });
});

describe('fromMinorUnit', () => {
  it('formats GBP by default', () => {
    expect(fromMinorUnit(1250)).toBe('£12.50');
  });

  it('formats a whole-pound amount with two decimal places', () => {
    expect(fromMinorUnit(1000)).toBe('£10.00');
  });

  it('formats zero correctly', () => {
    expect(fromMinorUnit(0)).toBe('£0.00');
  });

  it('formats a different currency when specified', () => {
    const result = fromMinorUnit(5000, 'USD');
    expect(result).toContain('50.00');
  });
});
