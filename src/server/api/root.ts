import { createTRPCRouter } from "@/server/api/trpc";
import { mentorsRouter } from "./routers/mentors";
import { menteesRouter } from "./routers/mentees";
import { matchingRouter } from "./routers/matching";
import { adminRouter } from "./routers/admin";
import { sessionsRouter } from "./routers/sessions";

export const appRouter = createTRPCRouter({
  mentors: mentorsRouter,
  mentees: menteesRouter,
  matching: matchingRouter,
  admin: adminRouter,
  sessions: sessionsRouter,
});

export type AppRouter = typeof appRouter;
