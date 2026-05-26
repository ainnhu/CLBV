export type AuditLogInput = {
  userId: string;
  username?: string;
  role?: string;
  action: string;
  module: string;
  entityType: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
};

export function createAuditLogEntry(input: AuditLogInput) {
  return {
    id: `audit-log-${Date.now()}`,
    userId: input.userId,
    username: input.username ?? input.userId,
    role: input.role ?? "unknown",
    action: input.action,
    module: input.module,
    entityType: input.entityType,
    entityId: input.entityId ?? "",
    oldValue: input.oldValue ?? null,
    newValue: input.newValue ?? null,
    createdAt: new Date().toISOString()
  };
}
