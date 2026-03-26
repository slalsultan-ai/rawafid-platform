/**
 * Rawafid Matching Algorithm v1
 *
 * Calculates compatibility score between a mentee and mentor based on:
 * 1. Domain Match — 30%
 * 2. Skills Overlap — 25%
 * 3. Experience Level — 20%
 * 4. Availability Overlap — 15%
 * 5. Past Ratings — 10%
 *
 * Returns a score from 0 to 100
 */

export interface MatchingWeights {
  domain: number;
  skills: number;
  experience: number;
  availability: number;
  rating: number;
}

export const DEFAULT_WEIGHTS: MatchingWeights = {
  domain: 0.30,
  skills: 0.25,
  experience: 0.20,
  availability: 0.15,
  rating: 0.10,
};

export interface AvailabilitySlot {
  day: string;
  from: string;
  to: string;
}

export interface ExpertiseItem {
  id: string;
  nameAr: string;
  nameEn: string;
}

export interface MenteeRequestData {
  desiredArea: string;
  desiredSkills: string[];
  yearsOfExperience: number;
  availability?: AvailabilitySlot[];
}

export interface MentorProfileData {
  areasOfExpertise: ExpertiseItem[];
  skills: ExpertiseItem[];
  availability: AvailabilitySlot[];
  yearsOfExperience: number;
  maxMentees: number;
  currentMenteeCount: number;
  averageRating?: number;
  totalRatings?: number;
}

function calculateDomainScore(mentee: MenteeRequestData, mentor: MentorProfileData): number {
  const desiredArea = mentee.desiredArea.toLowerCase().trim();
  const mentorAreas = mentor.areasOfExpertise.map(a => ({
    ar: a.nameAr.toLowerCase().trim(),
    en: a.nameEn.toLowerCase().trim(),
    id: a.id.toLowerCase().trim(),
  }));

  // Exact match
  const exactMatch = mentorAreas.some(
    a => a.ar === desiredArea || a.en === desiredArea || a.id === desiredArea
  );
  if (exactMatch) return 100;

  // Partial match (keyword overlap)
  const desiredWords = desiredArea.split(/\s+/);
  const hasPartialMatch = mentorAreas.some(area => {
    const areaWords = `${area.ar} ${area.en} ${area.id}`.split(/\s+/);
    return desiredWords.some(w => w.length > 2 && areaWords.some(aw => aw.includes(w) || w.includes(aw)));
  });

  return hasPartialMatch ? 50 : 0;
}

function calculateSkillsScore(mentee: MenteeRequestData, mentor: MentorProfileData): number {
  if (!mentee.desiredSkills.length) return 50; // neutral if no specific skills requested

  const mentorSkillIds = new Set(
    mentor.skills.flatMap(s => [s.id.toLowerCase(), s.nameAr.toLowerCase(), s.nameEn.toLowerCase()])
  );

  const matchedCount = mentee.desiredSkills.filter(skill =>
    mentorSkillIds.has(skill.toLowerCase())
  ).length;

  return Math.round((matchedCount / mentee.desiredSkills.length) * 100);
}

function calculateExperienceScore(mentee: MenteeRequestData, mentor: MentorProfileData): number {
  const gap = mentor.yearsOfExperience - mentee.yearsOfExperience;

  // Mentor must have more experience
  if (gap <= 0) return 0;

  // Ideal gap is 3–10 years
  if (gap >= 3 && gap <= 10) return 100;

  // Gap of 1–2 years: partial
  if (gap < 3) return Math.round((gap / 3) * 80);

  // Gap > 10 years: slightly decreasing (too senior may not relate well)
  if (gap > 10 && gap <= 20) return Math.round(100 - ((gap - 10) * 2));

  return 60; // very senior mentor still valuable
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function calculateAvailabilityScore(mentee: MenteeRequestData, mentor: MentorProfileData): number {
  if (!mentee.availability?.length) return 70; // neutral if mentee has no preference

  let overlapScore = 0;
  let totalSlots = mentee.availability.length;

  for (const menteeSlot of mentee.availability) {
    const matchingMentorSlot = mentor.availability.find(ms => ms.day === menteeSlot.day);
    if (!matchingMentorSlot) continue;

    const menteeFrom = timeToMinutes(menteeSlot.from);
    const menteeTo = timeToMinutes(menteeSlot.to);
    const mentorFrom = timeToMinutes(matchingMentorSlot.from);
    const mentorTo = timeToMinutes(matchingMentorSlot.to);

    const overlapStart = Math.max(menteeFrom, mentorFrom);
    const overlapEnd = Math.min(menteeTo, mentorTo);
    const overlapMinutes = Math.max(0, overlapEnd - overlapStart);

    if (overlapMinutes >= 60) {
      overlapScore += 1;
    } else if (overlapMinutes > 0) {
      overlapScore += overlapMinutes / 60;
    }
  }

  return Math.round((overlapScore / totalSlots) * 100);
}

function calculateRatingScore(mentor: MentorProfileData): number {
  // New mentors get a neutral score of 70
  if (!mentor.totalRatings || mentor.totalRatings === 0) return 70;
  if (!mentor.averageRating) return 70;

  return Math.round((mentor.averageRating / 5) * 100);
}

export function calculateMatchingScore(
  menteeRequest: MenteeRequestData,
  mentorProfile: MentorProfileData,
  weights: MatchingWeights = DEFAULT_WEIGHTS
): number {
  // Skip full mentors
  if (mentorProfile.currentMenteeCount >= mentorProfile.maxMentees) return 0;

  const domainScore = calculateDomainScore(menteeRequest, mentorProfile);
  const skillsScore = calculateSkillsScore(menteeRequest, mentorProfile);
  const experienceScore = calculateExperienceScore(menteeRequest, mentorProfile);
  const availabilityScore = calculateAvailabilityScore(menteeRequest, mentorProfile);
  const ratingScore = calculateRatingScore(mentorProfile);

  const totalScore =
    domainScore * weights.domain +
    skillsScore * weights.skills +
    experienceScore * weights.experience +
    availabilityScore * weights.availability +
    ratingScore * weights.rating;

  return Math.round(Math.min(100, Math.max(0, totalScore)));
}

export interface MentorWithScore {
  mentorUserId: string;
  mentorProfileId: string;
  score: number;
  breakdown: {
    domain: number;
    skills: number;
    experience: number;
    availability: number;
    rating: number;
  };
}

export function rankMentors(
  menteeRequest: MenteeRequestData,
  mentors: Array<{ userId: string; profileId: string; profile: MentorProfileData }>,
  weights: MatchingWeights = DEFAULT_WEIGHTS,
  limit = 10
): MentorWithScore[] {
  const scored = mentors
    .map(({ userId, profileId, profile }) => {
      if (profile.currentMenteeCount >= profile.maxMentees) return null;

      const breakdown = {
        domain: calculateDomainScore(menteeRequest, profile),
        skills: calculateSkillsScore(menteeRequest, profile),
        experience: calculateExperienceScore(menteeRequest, profile),
        availability: calculateAvailabilityScore(menteeRequest, profile),
        rating: calculateRatingScore(profile),
      };

      const score =
        breakdown.domain * weights.domain +
        breakdown.skills * weights.skills +
        breakdown.experience * weights.experience +
        breakdown.availability * weights.availability +
        breakdown.rating * weights.rating;

      return {
        mentorUserId: userId,
        mentorProfileId: profileId,
        score: Math.round(Math.min(100, Math.max(0, score))),
        breakdown,
      };
    })
    .filter((m): m is MentorWithScore => m !== null && m.score > 0);

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
