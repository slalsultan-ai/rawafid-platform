import { describe, it, expect } from "vitest";
import {
  calculateDomainScore,
  calculateSkillsScore,
  calculateExperienceScore,
  calculateAvailabilityScore,
  calculateRatingScore,
  calculateMatchingScore,
  rankMentors,
  timeToMinutes,
  DEFAULT_WEIGHTS,
  type MenteeRequestData,
  type MentorProfileData,
} from "@/server/services/matching-algorithm";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseMentor: MentorProfileData = {
  areasOfExpertise: [
    { id: "it", nameAr: "تقنية المعلومات", nameEn: "Information Technology" },
    { id: "cybersecurity", nameAr: "الأمن السيبراني", nameEn: "Cybersecurity" },
  ],
  skills: [
    { id: "leadership", nameAr: "القيادة", nameEn: "Leadership" },
    { id: "data_analysis", nameAr: "تحليل البيانات", nameEn: "Data Analysis" },
  ],
  availability: [
    { day: "monday", from: "09:00", to: "17:00" },
    { day: "wednesday", from: "10:00", to: "16:00" },
  ],
  yearsOfExperience: 12,
  maxMentees: 3,
  currentMenteeCount: 1,
  averageRating: 4.5,
  totalRatings: 10,
};

const baseMentee: MenteeRequestData = {
  desiredArea: "تقنية المعلومات",
  desiredSkills: ["leadership", "data_analysis"],
  yearsOfExperience: 5,
  availability: [{ day: "monday", from: "10:00", to: "15:00" }],
};

// ─── timeToMinutes ────────────────────────────────────────────────────────────

describe("timeToMinutes", () => {
  it("converts 09:00 to 540", () => expect(timeToMinutes("09:00")).toBe(540));
  it("converts 17:30 to 1050", () => expect(timeToMinutes("17:30")).toBe(1050));
  it("converts 00:00 to 0", () => expect(timeToMinutes("00:00")).toBe(0));
  it("handles missing minutes", () => expect(timeToMinutes("9")).toBe(540));
});

// ─── calculateDomainScore ────────────────────────────────────────────────────

describe("calculateDomainScore", () => {
  it("returns 100 for exact Arabic name match", () => {
    expect(calculateDomainScore(baseMentee, baseMentor)).toBe(100);
  });

  it("returns 100 for exact English name match", () => {
    const mentee = { ...baseMentee, desiredArea: "Information Technology" };
    expect(calculateDomainScore(mentee, baseMentor)).toBe(100);
  });

  it("returns 100 for exact ID match", () => {
    const mentee = { ...baseMentee, desiredArea: "it" };
    expect(calculateDomainScore(mentee, baseMentor)).toBe(100);
  });

  it("returns 100 even with different casing", () => {
    const mentee = { ...baseMentee, desiredArea: "INFORMATION TECHNOLOGY" };
    expect(calculateDomainScore(mentee, baseMentor)).toBe(100);
  });

  it("returns 50 for partial keyword match", () => {
    const mentee = { ...baseMentee, desiredArea: "تقنية" }; // subset word
    expect(calculateDomainScore(mentee, baseMentor)).toBe(50);
  });

  it("returns 0 for completely unrelated area", () => {
    const mentee = { ...baseMentee, desiredArea: "الموارد البشرية" };
    expect(calculateDomainScore(mentee, baseMentor)).toBe(0);
  });

  it("returns 0 for empty expertise list", () => {
    const mentor = { ...baseMentor, areasOfExpertise: [] };
    expect(calculateDomainScore(baseMentee, mentor)).toBe(0);
  });
});

// ─── calculateSkillsScore ────────────────────────────────────────────────────

describe("calculateSkillsScore", () => {
  it("returns 50 (neutral) when no skills requested", () => {
    const mentee = { ...baseMentee, desiredSkills: [] };
    expect(calculateSkillsScore(mentee, baseMentor)).toBe(50);
  });

  it("returns 100 when all requested skills match", () => {
    expect(calculateSkillsScore(baseMentee, baseMentor)).toBe(100);
  });

  it("returns 50 when half of requested skills match", () => {
    const mentee = { ...baseMentee, desiredSkills: ["leadership", "strategy"] };
    expect(calculateSkillsScore(mentee, baseMentor)).toBe(50);
  });

  it("returns 0 when no skills match", () => {
    const mentee = { ...baseMentee, desiredSkills: ["strategy", "finance"] };
    expect(calculateSkillsScore(mentee, baseMentor)).toBe(0);
  });

  it("matches by Arabic skill name", () => {
    const mentee = { ...baseMentee, desiredSkills: ["القيادة"] };
    expect(calculateSkillsScore(mentee, baseMentor)).toBe(100);
  });

  it("matches by English skill name (case-insensitive)", () => {
    const mentee = { ...baseMentee, desiredSkills: ["LEADERSHIP"] };
    expect(calculateSkillsScore(mentee, baseMentor)).toBe(100);
  });

  it("returns fractional percentage for partial matches", () => {
    const mentee = { ...baseMentee, desiredSkills: ["leadership", "data_analysis", "strategy"] };
    expect(calculateSkillsScore(mentee, baseMentor)).toBe(67); // 2/3 rounded
  });
});

// ─── calculateExperienceScore ────────────────────────────────────────────────

describe("calculateExperienceScore", () => {
  it("returns 0 when mentor has equal experience", () => {
    const mentee = { ...baseMentee, yearsOfExperience: 12 };
    expect(calculateExperienceScore(mentee, baseMentor)).toBe(0);
  });

  it("returns 0 when mentor has less experience", () => {
    const mentee = { ...baseMentee, yearsOfExperience: 15 };
    expect(calculateExperienceScore(mentee, baseMentor)).toBe(0);
  });

  it("returns 100 for gap of exactly 3 years (lower bound)", () => {
    const mentee = { ...baseMentee, yearsOfExperience: 9 };
    expect(calculateExperienceScore(mentee, baseMentor)).toBe(100);
  });

  it("returns 100 for gap of exactly 10 years (upper bound)", () => {
    const mentee = { ...baseMentee, yearsOfExperience: 2 };
    expect(calculateExperienceScore(mentee, baseMentor)).toBe(100);
  });

  it("returns 100 for ideal gap of 7 years", () => {
    expect(calculateExperienceScore(baseMentee, baseMentor)).toBe(100); // 12-5=7
  });

  it("returns partial score for gap of 1 year", () => {
    const mentee = { ...baseMentee, yearsOfExperience: 11 };
    const score = calculateExperienceScore(mentee, baseMentor); // gap=1
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });

  it("decreases for gap > 10 years", () => {
    const mentee = { ...baseMentee, yearsOfExperience: 0 };
    const score = calculateExperienceScore(mentee, baseMentor); // gap=12
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThan(0);
  });

  it("returns 60 for very large gap (>20 years)", () => {
    const mentor = { ...baseMentor, yearsOfExperience: 30 };
    const mentee = { ...baseMentee, yearsOfExperience: 1 }; // gap=29
    expect(calculateExperienceScore(mentee, mentor)).toBe(60);
  });
});

// ─── calculateAvailabilityScore ──────────────────────────────────────────────

describe("calculateAvailabilityScore", () => {
  it("returns 70 (neutral) when mentee has no availability preference", () => {
    const mentee = { ...baseMentee, availability: undefined };
    expect(calculateAvailabilityScore(mentee, baseMentor)).toBe(70);
  });

  it("returns 70 for empty availability array", () => {
    const mentee = { ...baseMentee, availability: [] };
    expect(calculateAvailabilityScore(mentee, baseMentor)).toBe(70);
  });

  it("returns 100 when mentee slot is fully within mentor slot", () => {
    // Mentee: monday 10:00-15:00 (5h), Mentor: monday 09:00-17:00 (8h) — full overlap ≥ 1h
    expect(calculateAvailabilityScore(baseMentee, baseMentor)).toBe(100);
  });

  it("returns 0 when no days overlap", () => {
    const mentee = { ...baseMentee, availability: [{ day: "friday", from: "09:00", to: "17:00" }] };
    expect(calculateAvailabilityScore(mentee, baseMentor)).toBe(0);
  });

  it("returns partial score for < 60min overlap", () => {
    const mentee = { ...baseMentee, availability: [{ day: "monday", from: "16:30", to: "17:30" }] };
    // Mentor ends at 17:00, overlap = 30 min → 0.5 / 1 = 50%
    expect(calculateAvailabilityScore(mentee, baseMentor)).toBe(50);
  });

  it("handles multiple slots and averages correctly", () => {
    // 2 mentee slots: monday (overlap) + friday (no mentor slot)
    const mentee = {
      ...baseMentee,
      availability: [
        { day: "monday", from: "10:00", to: "12:00" }, // 2h overlap → 1 point
        { day: "friday", from: "10:00", to: "12:00" }, // no overlap → 0 points
      ],
    };
    expect(calculateAvailabilityScore(mentee, baseMentor)).toBe(50); // 1/2 = 50%
  });
});

// ─── calculateRatingScore ────────────────────────────────────────────────────

describe("calculateRatingScore", () => {
  it("returns 70 for new mentor with no ratings", () => {
    const mentor = { ...baseMentor, totalRatings: 0, averageRating: undefined };
    expect(calculateRatingScore(mentor)).toBe(70);
  });

  it("returns 70 when averageRating is undefined but has ratings count", () => {
    const mentor = { ...baseMentor, totalRatings: 5, averageRating: undefined };
    expect(calculateRatingScore(mentor)).toBe(70);
  });

  it("returns 100 for perfect 5-star rating", () => {
    const mentor = { ...baseMentor, averageRating: 5, totalRatings: 20 };
    expect(calculateRatingScore(mentor)).toBe(100);
  });

  it("returns 60 for 3-star rating", () => {
    const mentor = { ...baseMentor, averageRating: 3, totalRatings: 10 };
    expect(calculateRatingScore(mentor)).toBe(60);
  });

  it("returns 90 for 4.5-star rating", () => {
    const mentor = { ...baseMentor, averageRating: 4.5, totalRatings: 10 };
    expect(calculateRatingScore(mentor)).toBe(90);
  });
});

// ─── calculateMatchingScore ──────────────────────────────────────────────────

describe("calculateMatchingScore", () => {
  it("returns 0 for a full mentor (at capacity)", () => {
    const fullMentor = { ...baseMentor, maxMentees: 2, currentMenteeCount: 2 };
    expect(calculateMatchingScore(baseMentee, fullMentor)).toBe(0);
  });

  it("returns a score between 0 and 100", () => {
    const score = calculateMatchingScore(baseMentee, baseMentor);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns high score for perfect match", () => {
    const score = calculateMatchingScore(baseMentee, baseMentor);
    expect(score).toBeGreaterThan(85);
  });

  it("returns low score for mismatched area and skills", () => {
    const poorMentor: MentorProfileData = {
      ...baseMentor,
      areasOfExpertise: [{ id: "hr", nameAr: "الموارد البشرية", nameEn: "Human Resources" }],
      skills: [{ id: "recruitment", nameAr: "التوظيف", nameEn: "Recruitment" }],
    };
    const score = calculateMatchingScore(baseMentee, poorMentor);
    expect(score).toBeLessThan(60);
  });

  it("uses custom weights when provided", () => {
    const domainOnlyWeights = { domain: 1, skills: 0, experience: 0, availability: 0, rating: 0 };
    const mismatchedMentee = { ...baseMentee, desiredArea: "الموارد البشرية" };
    const score = calculateMatchingScore(mismatchedMentee, baseMentor, domainOnlyWeights);
    expect(score).toBe(0);
  });

  it("gives the same result as DEFAULT_WEIGHTS when no weights specified", () => {
    const explicit = calculateMatchingScore(baseMentee, baseMentor, DEFAULT_WEIGHTS);
    const implicit = calculateMatchingScore(baseMentee, baseMentor);
    expect(explicit).toBe(implicit);
  });
});

// ─── rankMentors ─────────────────────────────────────────────────────────────

describe("rankMentors", () => {
  const mentorA = {
    userId: "userA",
    profileId: "profA",
    profile: {
      ...baseMentor,
      areasOfExpertise: [{ id: "it", nameAr: "تقنية المعلومات", nameEn: "Information Technology" }],
      averageRating: 5,
    },
  };

  const mentorB = {
    userId: "userB",
    profileId: "profB",
    profile: {
      ...baseMentor,
      areasOfExpertise: [{ id: "hr", nameAr: "الموارد البشرية", nameEn: "Human Resources" }],
      averageRating: 3,
    },
  };

  const mentorFull = {
    userId: "userC",
    profileId: "profC",
    profile: { ...baseMentor, maxMentees: 2, currentMenteeCount: 2 },
  };

  it("returns mentors sorted by score descending", () => {
    const result = rankMentors(baseMentee, [mentorB, mentorA]);
    expect(result[0].mentorUserId).toBe("userA");
    expect(result[0].score).toBeGreaterThanOrEqual(result[1]?.score ?? 0);
  });

  it("excludes full mentors", () => {
    const result = rankMentors(baseMentee, [mentorA, mentorFull]);
    expect(result.map((r) => r.mentorUserId)).not.toContain("userC");
  });

  it("includes mentors with score 0 (sorted last) so the user can still pick", () => {
    const zeroDomainMentee = {
      ...baseMentee,
      desiredArea: "مجال غير موجود",
      desiredSkills: [],
    };
    const domainOnly = { domain: 1, skills: 0, experience: 0, availability: 0, rating: 0 };
    const result = rankMentors(zeroDomainMentee, [mentorB], domainOnly);
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(0);
  });

  it("respects the limit parameter", () => {
    const result = rankMentors(baseMentee, [mentorA, mentorB], DEFAULT_WEIGHTS, 1);
    expect(result).toHaveLength(1);
  });

  it("returns breakdown for each mentor", () => {
    const result = rankMentors(baseMentee, [mentorA]);
    expect(result[0].breakdown).toHaveProperty("domain");
    expect(result[0].breakdown).toHaveProperty("skills");
    expect(result[0].breakdown).toHaveProperty("experience");
    expect(result[0].breakdown).toHaveProperty("availability");
    expect(result[0].breakdown).toHaveProperty("rating");
  });

  it("returns empty array when no mentors provided", () => {
    expect(rankMentors(baseMentee, [])).toEqual([]);
  });

  it("handles all mentors being full", () => {
    const result = rankMentors(baseMentee, [mentorFull]);
    expect(result).toHaveLength(0);
  });
});
