import type { ProtectedAction, Role } from "../src/lib/types";

export type SessionUser = {
  id: string;
  role: Role;
  inspectionTeamId?: string;
  departmentId?: string;
  assignedCriteriaItemIds?: string[];
};

const writeActionsByRole: Record<Role, ProtectedAction[]> = {
  "Khách xem": [],
  "Ban Giám đốc": [],
  "Thành viên đoàn": ["score:create", "score:update", "score:submit"],
  "Phó trưởng đoàn": ["score:submit"],
  "Trưởng đoàn": ["score:submit"],
  "Thư ký đoàn": ["score:submit", "report:export", "capa:update", "session:create"],
  "CAPA": ["capa:update"],
  "Phòng KHTH": ["capa:update", "period:close", "period:unlock", "report:export", "catalog:manage", "excel:import", "session:create"],
  Admin: ["score:create", "score:update", "score:submit", "capa:update", "period:close", "period:unlock", "report:export", "catalog:manage", "excel:import", "session:create"]
};

export function canReadPublishedData() {
  return true;
}

export function canWrite(user: SessionUser | null, action: ProtectedAction) {
  if (!user) return false;
  return writeActionsByRole[user.role]?.includes(action) ?? false;
}

export function assertCanWrite(user: SessionUser | null, action: ProtectedAction) {
  if (!canWrite(user, action)) {
    throw new Error("403 Forbidden: tài khoản không có quyền thực hiện thao tác này.");
  }
}

export function assertCanScoreCriteria(user: SessionUser | null, formCriteriaItemId: string) {
  assertCanWrite(user, "score:update");
  if (user?.role === "Admin") return;
  if (!user?.assignedCriteriaItemIds?.includes(formCriteriaItemId)) {
    throw new Error("403 Forbidden: thành viên chỉ được chấm tiêu chí được phân công.");
  }
}
