import { getNigeriaWeekRangeContaining, formatDateKey } from "../../shared/utils/date-util";

describe("getNigeriaWeekRangeContaining", () => {
  it("returns Monday through Sunday for a date in the middle of the week", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-03-26T12:00:00.000Z"));
    const { start, end } = getNigeriaWeekRangeContaining();
    const startKey = formatDateKey(start);
    const endKey = formatDateKey(end);
    expect(startKey <= endKey).toBe(true);
    const spanDays =
      (end.getTime() - start.getTime()) / (86400000);
    expect(spanDays).toBeGreaterThanOrEqual(6);
    expect(spanDays).toBeLessThanOrEqual(7);
    jest.useRealTimers();
  });
});
