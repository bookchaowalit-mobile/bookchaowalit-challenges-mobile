/** Pure logic for daily challenges: check-ins, streaks and progress. Dates are "YYYY-MM-DD" keys. */

export type Challenge = {
  id: string;
  name: string;
  targetDays: number;
  checkIns: string[]; // unique date keys
};

const DAY = 86_400_000;

function toTime(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function shiftDay(key: string, delta: number): string {
  return new Date(toTime(key) + delta * DAY).toISOString().slice(0, 10);
}

/**
 * Consecutive checked-in days ending today; if today is not checked in yet,
 * a streak ending yesterday still counts (it is not broken until the day passes).
 */
export function currentStreak(checkIns: string[], today: string): number {
  const days = new Set(checkIns);
  let cursor = days.has(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

export function longestStreak(checkIns: string[]): number {
  const sorted = [...new Set(checkIns)].sort();
  let best = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    run = i > 0 && shiftDay(sorted[i - 1], 1) === sorted[i] ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

/** Fraction 0..1 of the target reached (total check-ins, capped at 1). */
export function progress(challenge: Challenge): number {
  if (challenge.targetDays <= 0) return 0;
  return Math.min(1, new Set(challenge.checkIns).size / challenge.targetDays);
}

export function isComplete(challenge: Challenge): boolean {
  return progress(challenge) >= 1;
}

/** Check in (or undo the check-in) for `day`, returning a new challenge. */
export function toggleCheckIn(challenge: Challenge, day: string): Challenge {
  const has = challenge.checkIns.includes(day);
  return {
    ...challenge,
    checkIns: has ? challenge.checkIns.filter((d) => d !== day) : [...challenge.checkIns, day].sort(),
  };
}

/**
 * Parse the target-days field. Full-width digits from CJK keyboards are
 * normalised (NFKC); anything else that is not a plain whole number is NaN.
 */
export function parseTargetDays(text: string): number {
  const t = text.normalize("NFKC").trim();
  return /^\d+$/.test(t) ? Number(t) : NaN;
}

export function validateChallenge(name: string, targetDaysText: string): string | null {
  if (!name.trim()) return "Name is required";
  const n = parseTargetDays(targetDaysText);
  if (Number.isNaN(n)) return "Target days must be a whole number";
  if (n < 1 || n > 365) return "Target days must be between 1 and 365";
  return null;
}

/** "3/30 days", "1/1 day", "0/1 day". */
export function progressLabel(challenge: Challenge): string {
  const done = new Set(challenge.checkIns).size;
  return `${done}/${challenge.targetDays} ${challenge.targetDays === 1 ? "day" : "days"}`;
}

export function sampleChallenges(today: string): Challenge[] {
  const past = (n: number) => Array.from({ length: n }, (_, i) => shiftDay(today, -(i + 1))).sort();
  return [
    { id: "ch1", name: "30 days of push-ups", targetDays: 30, checkIns: past(6) },
    { id: "ch2", name: "Read 20 pages", targetDays: 21, checkIns: [...past(3), today] },
    { id: "ch3", name: "No sugar week", targetDays: 7, checkIns: [] },
  ];
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Type guard used when loading challenges from local storage. */
export function isChallenge(value: unknown): value is Challenge {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    c.name.trim().length > 0 &&
    typeof c.targetDays === "number" &&
    Number.isInteger(c.targetDays) &&
    c.targetDays > 0 &&
    Array.isArray(c.checkIns) &&
    c.checkIns.every((d) => typeof d === "string" && DATE_KEY.test(d)) &&
    new Set(c.checkIns).size === c.checkIns.length
  );
}
