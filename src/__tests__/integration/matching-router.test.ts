import { describe, it, expect, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { matchingRouter } from "@/server/api/routers/matching";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const MENTOR_ID = "mentor-001";
const MENTEE_ID = "mentee-001";
const TENANT_ID = "tenant-001";
const MATCH_ID = "match-001";

type Ctx = Parameters<typeof matchingRouter.createCaller>[0];

function makeCtx(userId = MENTOR_ID, role = "mentor", mockDb?: Record<string, unknown>): Ctx {
  return {
    db: (mockDb ?? {}) as never,
    session: {
      user: { id: userId, name: "Test", email: "t@t.com", role, tenantId: TENANT_ID },
    } as never,
    user: { id: userId, name: "Test", email: "t@t.com", role, tenantId: TENANT_ID },
    headers: new Headers(),
  } as Ctx;
}

// ─── respondToMatch ───────────────────────────────────────────────────────────

describe("matchingRouter.respondToMatch", () => {
  const proposedMatch = {
    id: MATCH_ID,
    mentorId: MENTOR_ID,
    menteeId: MENTEE_ID,
    tenantId: TENANT_ID,
    status: "proposed",
  };

  it("accepts a match and returns status 'active'", async () => {
    const mockDb = {
      select: () => dbChain([proposedMatch]),
      update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
      insert: () => ({ values: () => Promise.resolve([]) }),
    };

    const caller = matchingRouter.createCaller(makeCtx(MENTOR_ID, "mentor", mockDb));
    const result = await caller.respondToMatch({ matchId: MATCH_ID, action: "accept" });

    expect(result).toEqual({ success: true, status: "active" });
  });

  it("rejects a match and returns status 'rejected'", async () => {
    const mockDb = {
      select: () => dbChain([proposedMatch]),
      update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
      insert: () => ({ values: () => Promise.resolve([]) }),
    };

    const caller = matchingRouter.createCaller(makeCtx(MENTOR_ID, "mentor", mockDb));
    const result = await caller.respondToMatch({
      matchId: MATCH_ID,
      action: "reject",
      rejectionReason: "لا يتوافق مع تخصصي",
    });

    expect(result).toEqual({ success: true, status: "rejected" });
  });

  it("throws NOT_FOUND when match does not exist", async () => {
    const mockDb = {
      select: () => dbChain([]),
      update: vi.fn(),
    };

    const caller = matchingRouter.createCaller(makeCtx(MENTOR_ID, "mentor", mockDb));

    await expect(
      caller.respondToMatch({ matchId: "bad-match", action: "accept" })
    ).rejects.toThrow(TRPCError);
  });

  it("throws NOT_FOUND when the match belongs to a different mentor", async () => {
    const emptyDb = {
      select: () => dbChain([]),
    };

    const caller = matchingRouter.createCaller(makeCtx(MENTOR_ID, "mentor", emptyDb));

    await expect(
      caller.respondToMatch({ matchId: MATCH_ID, action: "accept" })
    ).rejects.toThrow(TRPCError);
  });
});

// ─── sendRequest ──────────────────────────────────────────────────────────────

describe("matchingRouter.sendRequest", () => {
  it("throws NOT_FOUND when the request does not belong to the user", async () => {
    const mockDb = {
      select: () => dbChain([]),
      insert: vi.fn(),
    };

    const caller = matchingRouter.createCaller(makeCtx(MENTEE_ID, "mentee", mockDb));

    await expect(
      caller.sendRequest({ requestId: "bad-req", mentorUserId: MENTOR_ID })
    ).rejects.toThrow(TRPCError);
  });
});

// ─── getMyMatches ─────────────────────────────────────────────────────────────

describe("matchingRouter.getMyMatches", () => {
  it("returns separate arrays for as-mentor and as-mentee matches", async () => {
    const menteeUser = { id: MENTEE_ID, name: "متدرب", jobTitle: "محلل" };
    const mentorUser = { id: MENTOR_ID, name: "مرشد", jobTitle: "مدير" };

    const matchAsMentor = { match: { id: "m1", mentorId: MENTOR_ID }, mentee: menteeUser };
    const matchAsMentee = { match: { id: "m2", menteeId: MENTEE_ID }, mentor: mentorUser };

    let callCount = 0;
    const mockDb = {
      select: () => {
        callCount++;
        return dbChain(callCount === 1 ? [matchAsMentor] : [matchAsMentee]);
      },
    };

    const caller = matchingRouter.createCaller(makeCtx(MENTOR_ID, "mentor", mockDb));
    const result = await caller.getMyMatches();

    expect(result).toHaveProperty("asmentor");
    expect(result).toHaveProperty("asMentee");
    expect(Array.isArray(result.asmentor)).toBe(true);
    expect(Array.isArray(result.asMentee)).toBe(true);
  });
});
