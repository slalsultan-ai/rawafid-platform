import { describe, it, expect } from "vitest";
import { getInitials, formatScore, getScoreColor, getScoreBgColor, cn } from "@/lib/utils";

// ─── cn (class merger) ───────────────────────────────────────────────────────

describe("cn", () => {
  it("merges two class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("deduplicates conflicting Tailwind classes (last wins)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "nope", "yes")).toBe("base yes");
  });

  it("handles undefined values", () => {
    expect(cn("base", undefined)).toBe("base");
  });
});

// ─── getInitials ─────────────────────────────────────────────────────────────

describe("getInitials", () => {
  it("returns two initials from a two-word name", () => {
    // "العتيبي" starts with "ا" (Alef from definite article)
    expect(getInitials("خالد العتيبي")).toBe("خا");
  });

  it("returns two initials from an Arabic name with prefix", () => {
    // "د." → "د", "نورة" → "ن"
    expect(getInitials("د. نورة الشمري")).toBe("دن");
  });

  it("returns a single initial for a single-word name", () => {
    expect(getInitials("محمد")).toBe("م");
  });

  it("handles English names", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("returns empty string for empty input", () => {
    expect(getInitials("")).toBe("");
  });

  it("trims extra whitespace (bug fix: uses /\\s+/ not ' ')", () => {
    expect(getInitials("  أحمد   سالم  ")).toBe("أس");
  });

  it("only takes first two words even for longer names", () => {
    expect(getInitials("عبدالرحمن بن ناصر الشمري")).toBe("عب");
  });
});

// ─── formatScore ─────────────────────────────────────────────────────────────

describe("formatScore", () => {
  it("formats 87.4 as '87%'", () => {
    expect(formatScore(87.4)).toBe("87%");
  });

  it("rounds 92.6 up to 93%", () => {
    expect(formatScore(92.6)).toBe("93%");
  });

  it("formats 0 as '0%'", () => {
    expect(formatScore(0)).toBe("0%");
  });

  it("formats 100 as '100%'", () => {
    expect(formatScore(100)).toBe("100%");
  });
});

// ─── getScoreColor ────────────────────────────────────────────────────────────

describe("getScoreColor", () => {
  it("returns emerald for score >= 80", () => {
    expect(getScoreColor(80)).toContain("emerald");
    expect(getScoreColor(95)).toContain("emerald");
  });

  it("returns teal for score 60–79", () => {
    expect(getScoreColor(60)).toContain("teal");
    expect(getScoreColor(75)).toContain("teal");
  });

  it("returns amber for score 40–59", () => {
    expect(getScoreColor(40)).toContain("amber");
    expect(getScoreColor(55)).toContain("amber");
  });

  it("returns red for score < 40", () => {
    expect(getScoreColor(39)).toContain("red");
    expect(getScoreColor(0)).toContain("red");
  });

  it("boundary: exactly 60 is teal not amber", () => {
    expect(getScoreColor(60)).toContain("teal");
  });

  it("boundary: exactly 80 is emerald not teal", () => {
    expect(getScoreColor(80)).toContain("emerald");
  });
});

// ─── getScoreBgColor ─────────────────────────────────────────────────────────

describe("getScoreBgColor", () => {
  it("returns a string for any valid score", () => {
    expect(typeof getScoreBgColor(90)).toBe("string");
    expect(typeof getScoreBgColor(50)).toBe("string");
    expect(typeof getScoreBgColor(20)).toBe("string");
  });

  it("high score has different bg than low score", () => {
    expect(getScoreBgColor(90)).not.toBe(getScoreBgColor(20));
  });
});
