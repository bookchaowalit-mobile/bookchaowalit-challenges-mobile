import { describe, expect, it } from "vitest";
import { isChallenge, sampleChallenges, toggleCheckIn } from "./challenges";
import { encodeEnvelope, listCodec } from "./persist";

describe("challenge persistence", () => {
  const codec = listCodec(isChallenge);
  const today = "2026-03-10";

  it("round-trips challenges including check-ins", () => {
    const [first, ...rest] = sampleChallenges(today);
    const list = [toggleCheckIn(first, today), ...rest];
    expect(codec.decode(codec.encode(list))).toEqual(list);
  });

  it("drops malformed challenges", () => {
    const good = sampleChallenges(today)[0];
    const raw = encodeEnvelope([
      good,
      { ...good, id: "t", targetDays: 0 },
      { ...good, id: "d", checkIns: ["2026-03-10", "2026-03-10"] },
      { ...good, id: "f", checkIns: ["yesterday"] },
    ]);
    expect(codec.decode(raw)?.map((c) => c.id)).toEqual([good.id]);
  });
});
