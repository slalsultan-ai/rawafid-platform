import { db } from "@/server/db";
import { auditLogs } from "@/server/db/schema";

export type AuditAction =
  | "mentor.register"
  | "mentor.approve"
  | "mentor.reject"
  | "match.send_request"
  | "match.respond"
  | "session.schedule"
  | "session.update_status"
  | "user.create"
  | "user.update_status"
  | "review.create"
  | "plan.create"
  | "goal.update"
  | "report.export";

export interface AuditEntry {
  tenantId: string;
  userId: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  if (!db) return;
  try {
    await db.insert(auditLogs).values({
      tenantId: entry.tenantId,
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details ?? {},
      ipAddress: entry.ipAddress ?? null,
    });
  } catch (err) {
    console.error("[audit] failed to write log", err);
  }
}
