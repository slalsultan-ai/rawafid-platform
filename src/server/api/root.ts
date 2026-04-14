import { createTRPCRouter } from "@/server/api/trpc";
import { mentorsRouter } from "./routers/mentors";
import { menteesRouter } from "./routers/mentees";
import { matchingRouter } from "./routers/matching";
import { adminRouter } from "./routers/admin";
import { sessionsRouter } from "./routers/sessions";
import { reviewsRouter } from "./routers/reviews";
import { developmentPlansRouter } from "./routers/development-plans";
import { notificationsRouter } from "./routers/notifications";
import { authRouter } from "./routers/auth";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  mentors: mentorsRouter,
  mentees: menteesRouter,
  matching: matchingRouter,
  admin: adminRouter,
  sessions: sessionsRouter,
  reviews: reviewsRouter,
  developmentPlans: developmentPlansRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
