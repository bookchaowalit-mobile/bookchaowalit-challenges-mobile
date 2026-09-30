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
  type Challenge, parseTargetDays, progressLabel } from "./challenges";

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

describe("pass 3 edge cases", () => {
  it("accepts full-width digits for the target and stores the same number", () => {
    expect(validateChallenge("Run", "\uFF13\uFF10")).toBeNull();
    expect(parseTargetDays("\uFF13\uFF10")).toBe(30);
    expect(parseTargetDays("0x1E")).toBeNaN();
    expect(parseTargetDays("1e2")).toBeNaN();
    expect(parseTargetDays("7,5")).toBeNaN();
  });
  it("pluralises the progress label", () => {
    expect(progressLabel({ id: "a", name: "x", targetDays: 1, checkIns: [] })).toBe("0/1 day");
    expect(progressLabel({ id: "a", name: "x", targetDays: 30, checkIns: ["2025-01-01"] })).toBe("1/30 days");
  });
  it("keeps streaks across a DST change and month/year ends", () => {
    expect(currentStreak(["2025-03-29", "2025-03-30", "2025-03-31"], "2025-03-31")).toBe(3);
    expect(currentStreak(["2024-12-31", "2025-01-01"], "2025-01-01")).toBe(2);
    expect(longestStreak(["2024-02-28", "2024-02-29", "2024-03-01"])).toBe(3);
  });
});
