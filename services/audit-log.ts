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

export type AuditLogEntry = ReturnType<typeof createAuditLogEntry>;

export function toAuditLogRow(entry: AuditLogEntry) {
  return {
    user_id: entry.userId.startsWith("demo-") || entry.userId === "anonymous" ? null : entry.userId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: isUuid(entry.entityId) ? entry.entityId : null,
    old_value_json: entry.oldValue,
    new_value_json: {
      module: entry.module,
      username: entry.username,
      role: entry.role,
      value: entry.newValue
    },
    created_at: entry.createdAt
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
