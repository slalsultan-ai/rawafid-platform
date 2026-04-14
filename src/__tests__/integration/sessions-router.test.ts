import { describe, it, expect, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { sessionsRouter } from "@/server/api/routers/sessions";

function dbChain<T>(data: T) {
  const make = (): Record<string, unknown> => {
    const proxy: Record<string, unknown> = {
      then: (fn: (v: T) => unknown) => Promise.resolve(data).then(fn),
      returning: () => Promise.resolve(data),
    };
    return new Proxy(proxy, {
      get(target, prop: string) {
        if (prop in target) return target[prop];
        return () => make();
      },
    });
  };
  return make();
}

const MENTOR_USER_ID = "mentor-001";
const MENTEE_USER_ID = "mentee-001";
const TENANT_ID = "tenant-001";
const MATCH_ID = "match-001";
const SESSION_ID = "session-001";

const mockMatch = {
  id: MATCH_ID,
  mentorId: MENTOR_USER_ID,
  menteeId: MENTEE_USER_ID,
  tenantId: TENANT_ID,
  status: "active",
};

type Ctx = Parameters<typeof sessionsRouter.createCaller>[0];

function makeCtx(userId = MENTOR_USER_ID, mockDb?: Record<string, unknown> | null): Ctx {
  return {
    db: (mockDb ?? {}) as never,
    session: {
      user: {
        id: userId,
        name: "Test User",
        email: "test@test.com",
        role: "mentor",
        tenantId: TENANT_ID,
      },
    } as never,
    user: {
      id: userId,
      name: "Test User",
      email: "test@test.com",
      role: "mentor",
      tenantId: TENANT_ID,
    },
    headers: new Headers(),
  } as Ctx;
}

describe("sessionsRouter.schedule", () => {
  it("creates a session when user is part of the match", async () => {
    const createdSession = { id: SESSION_ID, matchId: MATCH_ID, status: "scheduled" };
    const mockDb = {
      select: () => dbChain([mockMatch]),
      insert: () => ({
        values: () => ({
          returning: () => Promise.resolve([createdSession]),
        }),
      }),
    };

    const caller = sessionsRouter.createCaller(makeCtx(MENTOR_USER_ID, mockDb));

    const result = await caller.schedule({
      matchId: MATCH_ID,
      scheduledAt: new Date("2025-06-01T10:00:00").toISOString(),
      type: "virtual",
      durationMinutes: 60,
    });

    expect(result).toMatchObject({ id: SESSION_ID, status: "scheduled" });
  });

  it("throws NOT_FOUND when match does not exist", async () => {
    const mockDb = {
      select: () => dbChain([]),
      insert: vi.fn(),
    };

    const caller = sessionsRouter.createCaller(makeCtx(MENTOR_USER_ID, mockDb));

    await expect(
      caller.schedule({
        matchId: "nonexistent",
        scheduledAt: new Date().toISOString(),
        type: "virtual",
        durationMinutes: 60,
      })
    ).rejects.toThrow(TRPCError);
  });

  it("throws FORBIDDEN when user is not part of the match", async () => {
    const otherMatch = { ...mockMatch, mentorId: "other-user", menteeId: "another-user" };
    const mockDb = {
      select: () => dbChain([otherMatch]),
      insert: vi.fn(),
    };

    const caller = sessionsRouter.createCaller(makeCtx(MENTOR_USER_ID, mockDb));

    await expect(
      caller.schedule({
        matchId: MATCH_ID,
        scheduledAt: new Date().toISOString(),
        type: "virtual",
        durationMinutes: 60,
      })
    ).rejects.toThrow(TRPCError);
  });

  it("throws INTERNAL_SERVER_ERROR when db is null", async () => {
    const caller = sessionsRouter.createCaller(makeCtx(MENTOR_USER_ID, null));

    await expect(
      caller.schedule({
        matchId: MATCH_ID,
        scheduledAt: new Date().toISOString(),
        type: "virtual",
        durationMinutes: 60,
      })
    ).rejects.toThrow(TRPCError);
  });
});

describe("sessionsRouter.addAgendaItem", () => {
  const mockSessionRow = { mentorId: MENTOR_USER_ID, menteeId: MENTEE_USER_ID };
  const newItem = { id: "item-001", content: "Review progress", sessionId: SESSION_ID };

  it("adds an agenda item when user is part of the session", async () => {
    const mockDb = {
      select: () => dbChain([mockSessionRow]),
      insert: () => ({
        values: () => ({
          returning: () => Promise.resolve([newItem]),
        }),
      }),
    };

    const caller = sessionsRouter.createCaller(makeCtx(MENTOR_USER_ID, mockDb));
    const result = await caller.addAgendaItem({ sessionId: SESSION_ID, content: "Review progress" });

    expect(result).toMatchObject({ content: "Review progress" });
  });

  it("throws NOT_FOUND for a session not in this tenant", async () => {
    const mockDb = {
      select: () => dbChain([]),
    };

    const caller = sessionsRouter.createCaller(makeCtx(MENTOR_USER_ID, mockDb));

    await expect(
      caller.addAgendaItem({ sessionId: "bad-session", content: "anything" })
    ).rejects.toThrow(TRPCError);
  });

  it("throws FORBIDDEN when user is not part of the session", async () => {
    const foreignSession = { mentorId: "other-mentor", menteeId: "other-mentee" };
    const mockDb = {
      select: () => dbChain([foreignSession]),
    };

    const caller = sessionsRouter.createCaller(makeCtx(MENTOR_USER_ID, mockDb));

    await expect(
      caller.addAgendaItem({ sessionId: SESSION_ID, content: "anything" })
    ).rejects.toThrow(TRPCError);
  });
});

describe("sessionsRouter.updateStatus", () => {
  const mockSessionRow = { mentorId: MENTOR_USER_ID, menteeId: MENTEE_USER_ID };

  it("updates status to completed", async () => {
    const mockDb = {
      select: () => dbChain([mockSessionRow]),
      update: () => ({
        set: () => ({
          where: () => Promise.resolve([]),
        }),
      }),
    };

    const caller = sessionsRouter.createCaller(makeCtx(MENTOR_USER_ID, mockDb));
    const result = await caller.updateStatus({ sessionId: SESSION_ID, status: "completed" });

    expect(result).toEqual({ success: true });
  });

  it("throws FORBIDDEN when user is not part of the session", async () => {
    const foreignSession = { mentorId: "other-mentor", menteeId: "other-mentee" };
    const mockDb = {
      select: () => dbChain([foreignSession]),
    };

    const caller = sessionsRouter.createCaller(makeCtx(MENTOR_USER_ID, mockDb));

    await expect(
      caller.updateStatus({ sessionId: SESSION_ID, status: "cancelled" })
    ).rejects.toThrow(TRPCError);
  });
});

describe("sessionsRouter.saveSummary", () => {
  const mockSessionRow = { mentorId: MENTOR_USER_ID, menteeId: MENTEE_USER_ID };
  const newSummary = {
    id: "summary-001",
    sessionId: SESSION_ID,
    discussedPoints: "Discussed goals",
    decisions: "Focus on leadership",
    actionItems: "Read book X",
  };

  it("creates a new summary when none exists", async () => {
    let callCount = 0;
    const mockDb = {
      select: () => {
        callCount++;
        return dbChain(callCount === 1 ? [mockSessionRow] : []);
      },
      insert: () => ({
        values: () => ({
          returning: () => Promise.resolve([newSummary]),
        }),
      }),
    };

    const caller = sessionsRouter.createCaller(makeCtx(MENTOR_USER_ID, mockDb));
    const result = await caller.saveSummary({
      sessionId: SESSION_ID,
      discussedPoints: "Discussed goals",
      decisions: "Focus on leadership",
      actionItems: "Read book X",
    });

    expect(result).toMatchObject({ discussedPoints: "Discussed goals" });
  });

  it("updates existing summary when one already exists", async () => {
    const existingSummary = { id: "summary-001", sessionId: SESSION_ID };
    const updatedSummary = { ...existingSummary, discussedPoints: "Updated" };
    let callCount = 0;
    const mockDb = {
      select: () => {
        callCount++;
        return dbChain(callCount === 1 ? [mockSessionRow] : [existingSummary]);
      },
      update: () => ({
        set: () => ({
          where: () => ({
            returning: () => Promise.resolve([updatedSummary]),
          }),
        }),
      }),
    };

    const caller = sessionsRouter.createCaller(makeCtx(MENTOR_USER_ID, mockDb));
    const result = await caller.saveSummary({
      sessionId: SESSION_ID,
      discussedPoints: "Updated",
    });

    expect(result).toMatchObject({ discussedPoints: "Updated" });
  });
});
