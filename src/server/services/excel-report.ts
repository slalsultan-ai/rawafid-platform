import ExcelJS from "exceljs";
import { and, avg, count, desc, eq, sql } from "drizzle-orm";
import type { DB } from "@/server/db";
import {
  developmentGoals,
  developmentPlans,
  goalMilestones,
  matches,
  menteeRequests,
  mentorProfiles,
  sessionReviews,
  sessions,
  tenants,
  users,
} from "@/server/db/schema";

const HEADER_FILL = "FF0891B2";
const HEADER_FONT_COLOR = "FFFFFFFF";
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFE2E8F0" } },
  left: { style: "thin", color: { argb: "FFE2E8F0" } },
  bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
  right: { style: "thin", color: { argb: "FFE2E8F0" } },
};

type Col = {
  header: string;
  key: string;
  width?: number;
  rtl?: boolean;
  numFmt?: string;
};

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toISOString().slice(0, 10);
}

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return "0.0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function addStyledSheet(
  workbook: ExcelJS.Workbook,
  title: string,
  columns: Col[],
  rows: Array<Record<string, unknown>>,
  rtl = true
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(title, {
    views: [{ state: "frozen", ySplit: 1, rightToLeft: rtl }],
    properties: { defaultRowHeight: 18 },
  });

  sheet.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 20,
    style: c.numFmt ? { numFmt: c.numFmt } : undefined,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: HEADER_FILL },
    };
    cell.font = { bold: true, color: { argb: HEADER_FONT_COLOR }, size: 12 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = THIN_BORDER;
  });
  headerRow.height = 24;

  rows.forEach((row) => {
    const added = sheet.addRow(row);
    added.eachCell((cell) => {
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: "middle", horizontal: rtl ? "right" : "left", wrapText: true };
    });
  });

  return sheet;
}

export async function buildTenantReport(
  db: DB,
  tenantId: string
): Promise<{ buffer: Buffer; filename: string }> {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  const tenantName = tenant?.name ?? "—";

  const [
    totalUsers,
    totalMentorsApproved,
    activeMenteesCount,
    matchCountsByStatus,
    sessionCountsByStatus,
    avgRatingRow,
    goalTotals,
    topAreas,
    avgResponseHoursRow,
    skillDemandRows,
    departmentDemandRows,
  ] = await Promise.all([
    db.select({ count: count() }).from(users).where(eq(users.tenantId, tenantId)),
    db
      .select({ count: count() })
      .from(mentorProfiles)
      .where(and(eq(mentorProfiles.tenantId, tenantId), eq(mentorProfiles.status, "approved"))),
    db
      .select({ count: count() })
      .from(menteeRequests)
      .where(and(eq(menteeRequests.tenantId, tenantId), eq(menteeRequests.status, "open"))),
    db
      .select({ status: matches.status, count: count() })
      .from(matches)
      .where(eq(matches.tenantId, tenantId))
      .groupBy(matches.status),
    db
      .select({ status: sessions.status, count: count() })
      .from(sessions)
      .where(eq(sessions.tenantId, tenantId))
      .groupBy(sessions.status),
    db
      .select({ avg: avg(sessionReviews.overallRating) })
      .from(sessionReviews)
      .where(eq(sessionReviews.tenantId, tenantId)),
    db
      .select({
        total: count(),
        completed: sql<number>`SUM(CASE WHEN ${developmentGoals.status} = 'completed' THEN 1 ELSE 0 END)`,
      })
      .from(developmentGoals)
      .where(eq(developmentGoals.tenantId, tenantId)),
    db
      .select({ area: menteeRequests.desiredArea, count: count() })
      .from(menteeRequests)
      .where(eq(menteeRequests.tenantId, tenantId))
      .groupBy(menteeRequests.desiredArea)
      .orderBy(desc(count()))
      .limit(5),
    db
      .select({
        avgHours: sql<number>`AVG(EXTRACT(EPOCH FROM (${matches.updatedAt} - ${matches.createdAt})) / 3600.0)`,
      })
      .from(matches)
      .where(and(eq(matches.tenantId, tenantId), sql`${matches.status} IN ('accepted','rejected','active','completed')`)),
    db
      .select({ skill: menteeRequests.desiredArea, count: count() })
      .from(menteeRequests)
      .where(eq(menteeRequests.tenantId, tenantId))
      .groupBy(menteeRequests.desiredArea),
    db
      .select({ department: users.department, count: count() })
      .from(menteeRequests)
      .innerJoin(users, eq(users.id, menteeRequests.userId))
      .where(eq(menteeRequests.tenantId, tenantId))
      .groupBy(users.department)
      .orderBy(desc(count()))
      .limit(10),
  ]);

  const matchStatusMap = new Map<string, number>();
  for (const r of matchCountsByStatus) matchStatusMap.set(r.status, Number(r.count));
  const sessionStatusMap = new Map<string, number>();
  for (const r of sessionCountsByStatus) sessionStatusMap.set(r.status, Number(r.count));

  const totalMatchesActive = matchStatusMap.get("active") ?? 0;
  const totalMatchesCompleted = matchStatusMap.get("completed") ?? 0;
  const totalMatchesCancelled =
    (matchStatusMap.get("cancelled") ?? 0) + (matchStatusMap.get("rejected") ?? 0);

  const completedSessions = sessionStatusMap.get("completed") ?? 0;
  const scheduledSessions = sessionStatusMap.get("scheduled") ?? 0;
  const cancelledSessions = sessionStatusMap.get("cancelled") ?? 0;

  const avgRating = Number(avgRatingRow[0]?.avg ?? 0);
  const goalRow = goalTotals[0] ?? { total: 0, completed: 0 };
  const goalTotal = Number(goalRow.total ?? 0);
  const goalDone = Number(goalRow.completed ?? 0);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Rawafid Platform";
  workbook.created = new Date();

  addStyledSheet(
    workbook,
    "ملخص تنفيذي",
    [
      { header: "المؤشر", key: "label", width: 42 },
      { header: "القيمة", key: "value", width: 28 },
    ],
    [
      { label: "الجهة", value: tenantName },
      { label: "تاريخ التقرير", value: formatDate(new Date()) },
      { label: "إجمالي الموظفين", value: Number(totalUsers[0]?.count ?? 0).toLocaleString("en-US") },
      { label: "المرشدون المعتمدون", value: Number(totalMentorsApproved[0]?.count ?? 0).toLocaleString("en-US") },
      { label: "المتدربون النشطون (طلبات مفتوحة)", value: Number(activeMenteesCount[0]?.count ?? 0).toLocaleString("en-US") },
      { label: "علاقات إرشاد نشطة", value: totalMatchesActive.toLocaleString("en-US") },
      { label: "علاقات إرشاد مكتملة", value: totalMatchesCompleted.toLocaleString("en-US") },
      { label: "علاقات إرشاد ملغاة/مرفوضة", value: totalMatchesCancelled.toLocaleString("en-US") },
      { label: "جلسات مكتملة", value: completedSessions.toLocaleString("en-US") },
      { label: "جلسات مجدولة", value: scheduledSessions.toLocaleString("en-US") },
      { label: "جلسات ملغاة", value: cancelledSessions.toLocaleString("en-US") },
      { label: "متوسط تقييم الجلسات", value: avgRating.toFixed(2) },
      { label: "نسبة إكمال الأهداف", value: pct(goalDone, goalTotal) },
      { label: "أكثر المجالات طلباً (1)", value: topAreas[0]?.area ?? "—" },
      { label: "أكثر المجالات طلباً (2)", value: topAreas[1]?.area ?? "—" },
      { label: "أكثر المجالات طلباً (3)", value: topAreas[2]?.area ?? "—" },
      { label: "أكثر المجالات طلباً (4)", value: topAreas[3]?.area ?? "—" },
      { label: "أكثر المجالات طلباً (5)", value: topAreas[4]?.area ?? "—" },
    ]
  );

  const mentorRows = await db
    .select({
      id: users.id,
      name: users.name,
      department: users.department,
      jobTitle: users.jobTitle,
      years: users.yearsOfExperience,
      expertise: mentorProfiles.areasOfExpertise,
      skills: mentorProfiles.skills,
      maxMentees: mentorProfiles.maxMentees,
      avgRating: mentorProfiles.averageRating,
      sessionPreference: mentorProfiles.sessionPreference,
      approvedAt: mentorProfiles.approvedAt,
      status: mentorProfiles.status,
    })
    .from(mentorProfiles)
    .innerJoin(users, eq(users.id, mentorProfiles.userId))
    .where(and(eq(mentorProfiles.tenantId, tenantId), eq(mentorProfiles.status, "approved")));

  const mentorCurrentCounts = await db
    .select({ mentorId: matches.mentorId, count: count() })
    .from(matches)
    .where(and(eq(matches.tenantId, tenantId), eq(matches.status, "active")))
    .groupBy(matches.mentorId);
  const currentCountMap = new Map<string, number>();
  for (const r of mentorCurrentCounts) currentCountMap.set(r.mentorId, Number(r.count));

  const mentorSessionCounts = await db
    .select({
      mentorId: matches.mentorId,
      count: count(),
    })
    .from(sessions)
    .innerJoin(matches, eq(matches.id, sessions.matchId))
    .where(and(eq(sessions.tenantId, tenantId), eq(sessions.status, "completed")))
    .groupBy(matches.mentorId);
  const sessionCountMap = new Map<string, number>();
  for (const r of mentorSessionCounts) sessionCountMap.set(r.mentorId, Number(r.count));

  addStyledSheet(
    workbook,
    "المرشدون",
    [
      { header: "الاسم", key: "name", width: 26 },
      { header: "القسم", key: "department", width: 22 },
      { header: "المسمى الوظيفي", key: "jobTitle", width: 24 },
      { header: "سنوات الخبرة", key: "years", width: 14 },
      { header: "مجالات الخبرة", key: "expertise", width: 36 },
      { header: "المهارات", key: "skills", width: 36 },
      { header: "المتدربون الحاليون", key: "currentMentees", width: 18 },
      { header: "السعة القصوى", key: "maxMentees", width: 14 },
      { header: "جلسات مكتملة", key: "completedSessions", width: 16 },
      { header: "متوسط التقييم", key: "rating", width: 14 },
      { header: "التوفر / نوع الجلسة", key: "preference", width: 20 },
      { header: "تاريخ الاعتماد", key: "approvedAt", width: 16 },
    ],
    mentorRows.map((m) => ({
      name: m.name,
      department: m.department ?? "—",
      jobTitle: m.jobTitle ?? "—",
      years: m.years ?? 0,
      expertise: (m.expertise ?? []).map((e) => e.nameAr).join(", ") || "—",
      skills: (m.skills ?? []).map((s) => s.nameAr).join(", ") || "—",
      currentMentees: currentCountMap.get(m.id) ?? 0,
      maxMentees: m.maxMentees ?? 3,
      completedSessions: sessionCountMap.get(m.id) ?? 0,
      rating: m.avgRating ? Number(m.avgRating).toFixed(2) : "—",
      preference: m.sessionPreference ?? "—",
      approvedAt: formatDate(m.approvedAt),
    }))
  );

  const menteeRows = await db
    .select({
      id: users.id,
      name: users.name,
      department: users.department,
      jobTitle: users.jobTitle,
      desiredArea: menteeRequests.desiredArea,
      requestId: menteeRequests.id,
      requestStatus: menteeRequests.status,
    })
    .from(menteeRequests)
    .innerJoin(users, eq(users.id, menteeRequests.userId))
    .where(eq(menteeRequests.tenantId, tenantId));

  const menteeMatchRows = await db
    .select({
      menteeId: matches.menteeId,
      mentorId: matches.mentorId,
      score: matches.matchingScore,
      matchStatus: matches.status,
      mentorName: users.name,
    })
    .from(matches)
    .innerJoin(users, eq(users.id, matches.mentorId))
    .where(eq(matches.tenantId, tenantId));
  const menteeMatchMap = new Map<string, (typeof menteeMatchRows)[number]>();
  for (const r of menteeMatchRows) {
    const existing = menteeMatchMap.get(r.menteeId);
    if (!existing || r.matchStatus === "active") menteeMatchMap.set(r.menteeId, r);
  }

  const menteeSessionRows = await db
    .select({ menteeId: matches.menteeId, count: count() })
    .from(sessions)
    .innerJoin(matches, eq(matches.id, sessions.matchId))
    .where(and(eq(sessions.tenantId, tenantId), eq(sessions.status, "completed")))
    .groupBy(matches.menteeId);
  const menteeSessionMap = new Map<string, number>();
  for (const r of menteeSessionRows) menteeSessionMap.set(r.menteeId, Number(r.count));

  const menteeGoalRows = await db
    .select({
      menteeId: matches.menteeId,
      total: count(developmentGoals.id),
      completed: sql<number>`SUM(CASE WHEN ${developmentGoals.status} = 'completed' THEN 1 ELSE 0 END)`,
      hasPlan: sql<number>`CASE WHEN COUNT(${developmentPlans.id}) > 0 THEN 1 ELSE 0 END`,
    })
    .from(developmentPlans)
    .innerJoin(matches, eq(matches.id, developmentPlans.matchId))
    .leftJoin(developmentGoals, eq(developmentGoals.planId, developmentPlans.id))
    .where(eq(developmentPlans.tenantId, tenantId))
    .groupBy(matches.menteeId);
  const menteeGoalsMap = new Map<
    string,
    { total: number; completed: number; hasPlan: number }
  >();
  for (const r of menteeGoalRows) {
    menteeGoalsMap.set(r.menteeId, {
      total: Number(r.total ?? 0),
      completed: Number(r.completed ?? 0),
      hasPlan: Number(r.hasPlan ?? 0),
    });
  }

  addStyledSheet(
    workbook,
    "المتدربون",
    [
      { header: "الاسم", key: "name", width: 26 },
      { header: "القسم", key: "department", width: 22 },
      { header: "المسمى الوظيفي", key: "jobTitle", width: 24 },
      { header: "مجال الإرشاد المطلوب", key: "desiredArea", width: 26 },
      { header: "المرشد المرتبط", key: "mentor", width: 26 },
      { header: "نسبة التوافق", key: "score", width: 14 },
      { header: "جلسات مكتملة", key: "sessions", width: 14 },
      { header: "خطة التطوير", key: "plan", width: 18 },
      { header: "نسبة إكمال الأهداف", key: "goalRate", width: 18 },
    ],
    menteeRows.map((m) => {
      const match = menteeMatchMap.get(m.id);
      const goals = menteeGoalsMap.get(m.id);
      return {
        name: m.name,
        department: m.department ?? "—",
        jobTitle: m.jobTitle ?? "—",
        desiredArea: m.desiredArea,
        mentor: match?.mentorName ?? "—",
        score: match?.score != null ? `${Number(match.score).toFixed(1)}%` : "—",
        sessions: menteeSessionMap.get(m.id) ?? 0,
        plan: goals?.hasPlan ? "موجودة" : "غير موجودة",
        goalRate: goals ? pct(goals.completed, goals.total) : "—",
      };
    })
  );

  const sessionRows = await db
    .select({
      id: sessions.id,
      scheduledAt: sessions.scheduledAt,
      duration: sessions.durationMinutes,
      type: sessions.type,
      status: sessions.status,
      mentorName: users.name,
      matchId: matches.id,
    })
    .from(sessions)
    .innerJoin(matches, eq(matches.id, sessions.matchId))
    .innerJoin(users, eq(users.id, matches.mentorId))
    .where(eq(sessions.tenantId, tenantId))
    .orderBy(desc(sessions.scheduledAt));

  const menteeLookup = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.tenantId, tenantId));
  const menteeNameMap = new Map(menteeLookup.map((u) => [u.id, u.name] as const));

  const sessionMatchMenteeIdRows = await db
    .select({ matchId: matches.id, menteeId: matches.menteeId })
    .from(matches)
    .where(eq(matches.tenantId, tenantId));
  const matchToMenteeId = new Map(
    sessionMatchMenteeIdRows.map((r) => [r.matchId, r.menteeId] as const)
  );

  const reviewRows = await db
    .select({
      sessionId: sessionReviews.sessionId,
      reviewerId: sessionReviews.reviewerId,
      rating: sessionReviews.overallRating,
    })
    .from(sessionReviews)
    .where(eq(sessionReviews.tenantId, tenantId));
  const mentorReviewBySession = new Map<string, number>();
  const menteeReviewBySession = new Map<string, number>();
  const reviewerRoleRows = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.tenantId, tenantId));
  const roleMap = new Map(reviewerRoleRows.map((r) => [r.id, r.role] as const));
  for (const r of reviewRows) {
    const role = roleMap.get(r.reviewerId);
    if (role === "mentor") mentorReviewBySession.set(r.sessionId, r.rating);
    else menteeReviewBySession.set(r.sessionId, r.rating);
  }

  addStyledSheet(
    workbook,
    "الجلسات",
    [
      { header: "رقم الجلسة", key: "id", width: 16 },
      { header: "المرشد", key: "mentor", width: 24 },
      { header: "المتدرب", key: "mentee", width: 24 },
      { header: "التاريخ", key: "date", width: 14 },
      { header: "المدة (دقيقة)", key: "duration", width: 14 },
      { header: "النوع", key: "type", width: 14 },
      { header: "الحالة", key: "status", width: 14 },
      { header: "تقييم المرشد", key: "mentorRating", width: 14 },
      { header: "تقييم المتدرب", key: "menteeRating", width: 14 },
    ],
    sessionRows.map((s) => {
      const menteeId = matchToMenteeId.get(s.matchId);
      return {
        id: s.id,
        mentor: s.mentorName,
        mentee: (menteeId && menteeNameMap.get(menteeId)) ?? "—",
        date: formatDate(s.scheduledAt),
        duration: s.duration ?? 0,
        type: s.type === "virtual" ? "افتراضية" : "حضورية",
        status:
          s.status === "completed"
            ? "مكتملة"
            : s.status === "scheduled"
            ? "مجدولة"
            : s.status === "cancelled"
            ? "ملغاة"
            : "قيد التحضير",
        mentorRating: mentorReviewBySession.get(s.id) ?? "—",
        menteeRating: menteeReviewBySession.get(s.id) ?? "—",
      };
    })
  );

  const planRows = await db
    .select({
      planId: developmentPlans.id,
      planCreated: developmentPlans.createdAt,
      matchId: matches.id,
      mentorId: matches.mentorId,
      menteeId: matches.menteeId,
    })
    .from(developmentPlans)
    .innerJoin(matches, eq(matches.id, developmentPlans.matchId))
    .where(eq(developmentPlans.tenantId, tenantId));

  const goalsByPlan = await db
    .select({
      planId: developmentGoals.planId,
      id: developmentGoals.id,
      title: developmentGoals.title,
      status: developmentGoals.status,
      targetDate: developmentGoals.targetDate,
      createdAt: developmentGoals.createdAt,
    })
    .from(developmentGoals)
    .where(eq(developmentGoals.tenantId, tenantId));

  const milestonesByGoal = await db
    .select({
      goalId: goalMilestones.goalId,
      status: goalMilestones.status,
    })
    .from(goalMilestones)
    .where(eq(goalMilestones.tenantId, tenantId));

  const milestoneTotals = new Map<string, { total: number; completed: number }>();
  for (const m of milestonesByGoal) {
    const existing = milestoneTotals.get(m.goalId) ?? { total: 0, completed: 0 };
    existing.total += 1;
    if (m.status === "completed") existing.completed += 1;
    milestoneTotals.set(m.goalId, existing);
  }

  const userNameMap = new Map(
    (await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.tenantId, tenantId))).map(
      (u) => [u.id, u.name] as const
    )
  );

  const planGoalRows: Array<Record<string, unknown>> = [];
  for (const plan of planRows) {
    const goals = goalsByPlan.filter((g) => g.planId === plan.planId);
    if (goals.length === 0) {
      planGoalRows.push({
        mentee: userNameMap.get(plan.menteeId) ?? "—",
        mentor: userNameMap.get(plan.mentorId) ?? "—",
        goal: "—",
        status: "—",
        startDate: formatDate(plan.planCreated),
        targetDate: "—",
        milestones: "0 / 0",
        progress: "0.0%",
      });
      continue;
    }
    for (const g of goals) {
      const ms = milestoneTotals.get(g.id) ?? { total: 0, completed: 0 };
      planGoalRows.push({
        mentee: userNameMap.get(plan.menteeId) ?? "—",
        mentor: userNameMap.get(plan.mentorId) ?? "—",
        goal: g.title,
        status:
          g.status === "completed"
            ? "مكتمل"
            : g.status === "in_progress"
            ? "جاري"
            : g.status === "deferred"
            ? "مؤجل"
            : "لم يبدأ",
        startDate: formatDate(g.createdAt),
        targetDate: formatDate(g.targetDate),
        milestones: `${ms.completed} / ${ms.total}`,
        progress: pct(ms.completed, ms.total),
      });
    }
  }

  addStyledSheet(
    workbook,
    "خطط التطوير",
    [
      { header: "المتدرب", key: "mentee", width: 24 },
      { header: "المرشد", key: "mentor", width: 24 },
      { header: "الهدف", key: "goal", width: 36 },
      { header: "الحالة", key: "status", width: 14 },
      { header: "تاريخ البداية", key: "startDate", width: 16 },
      { header: "التاريخ المستهدف", key: "targetDate", width: 16 },
      { header: "المعالم", key: "milestones", width: 14 },
      { header: "نسبة الإنجاز", key: "progress", width: 14 },
    ],
    planGoalRows
  );

  const scoreBuckets = [0, 0, 0, 0, 0];
  const bucketLabels = ["0-20%", "21-40%", "41-60%", "61-80%", "81-100%"];
  for (const r of menteeMatchRows) {
    const s = Number(r.score ?? 0);
    const idx = Math.min(4, Math.max(0, Math.floor(s / 20)));
    scoreBuckets[idx] += 1;
  }

  const mentorSkillTally = new Map<string, number>();
  const mentorExpertiseRows = await db
    .select({ skills: mentorProfiles.skills, expertise: mentorProfiles.areasOfExpertise })
    .from(mentorProfiles)
    .where(and(eq(mentorProfiles.tenantId, tenantId), eq(mentorProfiles.status, "approved")));
  for (const row of mentorExpertiseRows) {
    for (const s of row.skills ?? []) mentorSkillTally.set(s.nameAr, (mentorSkillTally.get(s.nameAr) ?? 0) + 1);
    for (const e of row.expertise ?? [])
      mentorSkillTally.set(e.nameAr, (mentorSkillTally.get(e.nameAr) ?? 0) + 1);
  }

  const demandTally = new Map<string, number>();
  for (const row of skillDemandRows) demandTally.set(row.skill, Number(row.count));

  const allKeys = new Set<string>([...mentorSkillTally.keys(), ...demandTally.keys()]);
  const skillGapRows = [...allKeys]
    .map((key) => ({
      skill: key,
      demand: demandTally.get(key) ?? 0,
      supply: mentorSkillTally.get(key) ?? 0,
      gap: (demandTally.get(key) ?? 0) - (mentorSkillTally.get(key) ?? 0),
    }))
    .sort((a, b) => b.demand - a.demand)
    .slice(0, 20);

  const avgResponseHours = Number(avgResponseHoursRow[0]?.avgHours ?? 0);

  const topMentorRows = await db
    .select({ mentorId: matches.mentorId, count: count() })
    .from(matches)
    .where(eq(matches.tenantId, tenantId))
    .groupBy(matches.mentorId)
    .orderBy(desc(count()))
    .limit(5);

  const matchingSheet = workbook.addWorksheet("تحليل المطابقة", {
    views: [{ state: "frozen", ySplit: 1, rightToLeft: true }],
  });

  let currentRow = 1;
  const writeSection = (title: string, cols: string[], data: Array<Record<string, string | number>>) => {
    const titleRow = matchingSheet.getRow(currentRow);
    titleRow.getCell(1).value = title;
    titleRow.getCell(1).font = { bold: true, size: 13, color: { argb: HEADER_FONT_COLOR } };
    titleRow.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: HEADER_FILL },
    };
    matchingSheet.mergeCells(currentRow, 1, currentRow, cols.length);
    titleRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    titleRow.height = 22;
    currentRow += 1;

    const headerRow = matchingSheet.getRow(currentRow);
    cols.forEach((c, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = c;
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0F2FE" } };
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    currentRow += 1;

    for (const row of data) {
      const r = matchingSheet.getRow(currentRow);
      cols.forEach((c, i) => {
        const cell = r.getCell(i + 1);
        cell.value = row[c] ?? "—";
        cell.border = THIN_BORDER;
        cell.alignment = { horizontal: "right", vertical: "middle" };
      });
      currentRow += 1;
    }
    currentRow += 1;
  };

  matchingSheet.getColumn(1).width = 34;
  matchingSheet.getColumn(2).width = 18;
  matchingSheet.getColumn(3).width = 18;
  matchingSheet.getColumn(4).width = 18;

  writeSection(
    "توزيع نسب التوافق",
    ["الشريحة", "عدد المطابقات"],
    bucketLabels.map((lbl, i) => ({ الشريحة: lbl, "عدد المطابقات": scoreBuckets[i] }))
  );

  writeSection(
    "فجوة المهارات (الطلب مقابل العرض)",
    ["المهارة", "الطلب", "العرض", "الفجوة"],
    skillGapRows.map((r) => ({ المهارة: r.skill, الطلب: r.demand, العرض: r.supply, الفجوة: r.gap }))
  );

  writeSection(
    "الأقسام الأكثر طلباً للإرشاد",
    ["القسم", "عدد الطلبات"],
    departmentDemandRows.map((r) => ({ القسم: r.department ?? "—", "عدد الطلبات": Number(r.count) }))
  );

  const topMentorNames = await Promise.all(
    topMentorRows.map(async (row) => {
      const u = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, row.mentorId))
        .limit(1);
      return { name: u[0]?.name ?? "—", count: Number(row.count) };
    })
  );

  writeSection(
    "المرشدون الأكثر طلباً",
    ["المرشد", "عدد الطلبات"],
    topMentorNames.map((r) => ({ المرشد: r.name, "عدد الطلبات": r.count }))
  );

  writeSection(
    "متوسط وقت الاستجابة للطلبات",
    ["المقياس", "القيمة"],
    [{ المقياس: "ساعات", القيمة: avgResponseHours.toFixed(1) }]
  );

  const filename = `rawafid-report-${formatDate(new Date())}.xlsx`;
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return { buffer: Buffer.from(arrayBuffer as ArrayBuffer), filename };
}
