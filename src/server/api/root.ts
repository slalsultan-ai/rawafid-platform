import { createTRPCRouter } from "@/server/api/trpc";
import { mentorsRouter } from "./routers/mentors";
import { menteesRouter } from "./routers/mentees";
import { matchingRouter } from "./routers/matching";
import { adminRouter } from "./routers/admin";

export const appRouter = createTRPCRouter({
  mentors: mentorsRouter,
  mentees: menteesRouter,
  matching: matchingRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
