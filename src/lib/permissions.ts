import type { ProtectedAction, Role } from "./types";

export const publicReadModules = [
  "Trang chủ và dashboard",
  "Lịch kiểm tra",
  "Kết quả chấm điểm đã công khai",
  "Báo cáo tháng đã xuất",
  "Lịch sử kiểm tra",
  "CAPA và theo dõi khắc phục",
  "Dữ liệu khoa/phòng",
  "Bảng kiểm và tiêu chí kiểm tra"
];

export const permissionsByRole: Record<Role, string[]> = {
  "Khách xem": ["Xem dữ liệu công khai", "Tải báo cáo đã xuất"],
  "Thành viên đoàn": ["Nhập/sửa điểm trong phạm vi được phân công", "Lưu nháp", "Gửi hoàn tất phiếu"],
  "Thư ký đoàn": ["Theo dõi tiến độ đoàn", "Rà soát dữ liệu đoàn", "Tổng hợp và xuất báo cáo theo quyền"],
  "Trưởng đoàn": ["Xem dữ liệu đoàn", "Yêu cầu chỉnh sửa", "Khóa phiếu trong phạm vi đoàn"],
  "Phó trưởng đoàn": ["Xem dữ liệu đoàn", "Kiểm soát chất lượng chấm", "Nhắc hoàn tất phiếu"],
  "Phòng KHTH": ["Quản lý kỳ/lịch/phân công", "Chốt dữ liệu", "Xuất Excel", "Import Excel", "Mở khóa kỳ"],
  Admin: ["Quản trị toàn bộ hệ thống", "Quản lý người dùng/danh mục", "Import Excel", "Mở khóa dữ liệu"],
  CAPA: ["Cập nhật phản hồi khắc phục", "Cập nhật trạng thái CAPA theo phân quyền"],
  "Ban Giám đốc": ["Xem dashboard toàn viện", "Xem cảnh báo nguy cơ cao", "Xem xu hướng cải tiến"]
};

const roleActions: Record<Role, ProtectedAction[]> = {
  "Khách xem": [],
  "Thành viên đoàn": ["score:create", "score:update", "score:submit"],
  "Thư ký đoàn": ["score:submit", "report:export", "capa:update"],
  "Trưởng đoàn": ["score:submit"],
  "Phó trưởng đoàn": ["score:submit"],
  "Phòng KHTH": ["capa:update", "period:close", "period:unlock", "report:export", "catalog:manage", "excel:import"],
  Admin: ["score:create", "score:update", "score:submit", "capa:update", "period:close", "period:unlock", "report:export", "catalog:manage", "excel:import"],
  CAPA: ["capa:update"],
  "Ban Giám đốc": []
};

export function canReadPublicData() {
  return true;
}

export function canPerform(role: Role | undefined, action: ProtectedAction) {
  if (!role) return false;
  return roleActions[role]?.includes(action) ?? false;
}

export function canManageData(role?: Role) {
  return canPerform(role, "catalog:manage");
}

export function canImportExcel(role?: Role) {
  return canPerform(role, "excel:import");
}

export function canExportReport(role?: Role) {
  return canPerform(role, "report:export");
}

export function canScore(role?: Role) {
  return canPerform(role, "score:create") || canPerform(role, "score:update");
}

export function canUpdateCapa(role?: Role) {
  return canPerform(role, "capa:update");
}
