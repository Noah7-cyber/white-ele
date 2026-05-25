import { computeRelativeGrowthPercent } from '../date-util';

describe('computeRelativeGrowthPercent', () => {
  it('returns relative change when previous > 0', () => {
    expect(computeRelativeGrowthPercent(110, 100)).toBeCloseTo(10, 5);
    expect(computeRelativeGrowthPercent(50, 100)).toBeCloseTo(-50, 5);
  });

  it('returns 100 when previous is 0 and current > 0', () => {
    expect(computeRelativeGrowthPercent(5, 0)).toBe(100);
  });

  it('returns 0 when both are 0', () => {
    expect(computeRelativeGrowthPercent(0, 0)).toBe(0);
  });
});
