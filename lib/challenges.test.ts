import { describe, expect, it } from "vitest";
import {
  currentStreak,
  isComplete,
  longestStreak,
  progress,
  sampleChallenges,
  shiftDay,
  toggleCheckIn,
  validateChallenge,
  type Challenge,
} from "./challenges";

const T = "2025-03-01";

describe("shiftDay", () => {
  it("crosses month and leap boundaries", () => {
    expect(shiftDay(T, -1)).toBe("2025-02-28");
    expect(shiftDay("2024-02-28", 1)).toBe("2024-02-29");
    expect(shiftDay("2025-12-31", 1)).toBe("2026-01-01");
  });
});

describe("streaks", () => {
  it("counts a streak ending today", () => {
    expect(currentStreak(["2025-02-27", "2025-02-28", T], T)).toBe(3);
  });
  it("keeps a streak alive until today ends", () => {
    expect(currentStreak(["2025-02-27", "2025-02-28"], T)).toBe(2);
  });
  it("breaks after a missed day", () => {
    expect(currentStreak(["2025-02-26", "2025-02-27"], T)).toBe(0);
    expect(currentStreak([], T)).toBe(0);
  });
  it("finds the longest run ignoring duplicates and order", () => {
    expect(longestStreak(["2025-01-03", "2025-01-01", "2025-01-02", "2025-01-02", "2025-01-10", "2025-01-11"])).toBe(3);
    expect(longestStreak([])).toBe(0);
  });
});

describe("progress", () => {
  const c: Challenge = { id: "x", name: "x", targetDays: 4, checkIns: ["2025-01-01", "2025-01-02"] };
  it("is a capped fraction of the target", () => {
    expect(progress(c)).toBe(0.5);
    expect(progress({ ...c, targetDays: 1 })).toBe(1);
    expect(isComplete({ ...c, targetDays: 2 })).toBe(true);
    expect(progress({ ...c, targetDays: 0 })).toBe(0);
  });
  it("toggles check-ins immutably", () => {
    const on = toggleCheckIn(c, "2025-01-03");
    expect(on.checkIns).toEqual(["2025-01-01", "2025-01-02", "2025-01-03"]);
    expect(c.checkIns).toHaveLength(2);
    expect(toggleCheckIn(on, "2025-01-03").checkIns).toEqual(c.checkIns);
  });
});

describe("validation and samples", () => {
  it("validates new challenges", () => {
    expect(validateChallenge("Run", "30")).toBeNull();
    expect(validateChallenge(" ", "30")).toMatch(/Name/);
    expect(validateChallenge("Run", "3.5")).toMatch(/whole/);
    expect(validateChallenge("Run", "0")).toMatch(/between/);
    expect(validateChallenge("Run", "400")).toMatch(/between/);
  });
  it("builds sample data relative to today", () => {
    const [pushups, reading] = sampleChallenges(T);
    expect(currentStreak(pushups.checkIns, T)).toBe(6);
    expect(currentStreak(reading.checkIns, T)).toBe(4);
  });
});
