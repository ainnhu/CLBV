import extracted from "./extracted-workbook-data.json";
import type {
  AuditAssignment,
  AuditPeriod,
  AuditSchedule,
  AuditScore,
  AuditTeam,
  CriteriaItem,
  CriteriaSet,
  DataProvenance,
  Department,
  FormCriteriaItem,
  FormTemplate,
  InspectionForm,
  InspectionScore,
  Report,
  User,
  WorkbookAnalysis
} from "./types";

export const workbookSummary = extracted.workbookSummary as WorkbookAnalysis[];
export const departments = extracted.departments as Department[];
export const users = extracted.users as User[];
export const criteriaSets = extracted.criteriaSets as CriteriaSet[];
export const criteriaItems = extracted.criteriaItems as CriteriaItem[];
export const formTemplates = extracted.formTemplates as FormTemplate[];
export const formCriteriaItems = extracted.formCriteriaItems as FormCriteriaItem[];
export const auditSchedule = extracted.auditSchedule as AuditSchedule[];
export const dataProvenance = extracted.dataProvenance as DataProvenance[];
export const defaultRules = extracted.defaultRules;
export const sourceDocuments = extracted.sourceDocuments;

export const sourceFiles = [
  {
    type: "Kế hoạch / Quyết định",
    name: "KH, QĐ KIỂM TRA HOẠT ĐỘNG BỆNH VIỆN NĂM 2026.pdf"
  },
  ...extracted.sourceFiles.map((name) => ({ type: "Excel bảng kiểm", name })),
  { type: "Logo", name: "2aOboQXevocFGEjm1onIuof8WDMn1dFVBk0bydzk.jpg" },
  { type: "Banner", name: "2aOboQXevbVkpk7efszMKuJzOk37sIUNLOXjB2XY.jpg" }
];

export const publicReadFiles = [
  { type: "SQL schema", name: "database/supabase-schema.sql" },
  { type: "Import dữ liệu", name: "scripts/extract-source-data.py" },
  { type: "Export Excel", name: "export/report-export.ts" },
  { type: "Kiểm quyền", name: "services/access-control.ts" }
];

export const implementationProgress = [
  {
    group: "Nguồn dữ liệu",
    percent: 85,
    status: "Đã phân tích PDF và 04 file Excel; đã trích sheet phiếu theo khoa/phòng.",
    done: ["Danh mục khoa/phòng", "Đoàn kiểm tra", "Sheet phiếu nguồn", "Tiêu chí theo source_row"],
    next: "Bổ sung màn hình rà soát cảnh báo import trước khi ghi Supabase."
  },
  {
    group: "Database và bảo mật",
    percent: 68,
    status: "Đã có schema Supabase, RLS public-read/protected-write, khóa unique phục vụ import lại cùng phiên bản và service kiểm quyền backend.",
    done: ["form_templates", "form_header_fields", "form_criteria_items", "inspection_forms", "inspection_scores", "audit_logs"],
    next: "Kết nối Supabase thật và kiểm thử policy bằng tài khoản thực."
  },
  {
    group: "API nghiệp vụ",
    percent: 82,
    status: "Đã có API public/protected, import prepare/commit, upsert theo phiên bản, chấm điểm, CAPA, kỳ kiểm tra và export Excel mẫu.",
    done: ["Public dashboard", "Public forms", "Protected write 403", "Import Excel thật", "Commit import", "Export Excel mẫu"],
    next: "Tạo màn hình rà soát import Excel và gắn Supabase thật."
  },
  {
    group: "Giao diện",
    percent: 40,
    status: "Có đủ màn hình chính nhưng chưa chốt thẩm mỹ theo nhận xét mới.",
    done: ["Dashboard công khai", "Login thao tác", "Phiếu chấm mobile", "CAPA", "Báo cáo", "Quản trị"],
    next: "Thiết kế lại UI sau khi xong luồng backend/MVP."
  },
  {
    group: "Excel báo cáo",
    percent: 52,
    status: "Đã xuất mẫu theo phiếu nguồn; cần hoàn thiện định dạng giống workbook hơn.",
    done: ["PHIEU_CHI_TIET", "TONG_HOP_DIEM", "CHI_TIET_LOI", "LOI_NGUY_CO_CAO", "CAPA"],
    next: "Thêm logo, vùng chữ ký, style và lưu Supabase Storage."
  }
];

export const sampleFormTemplate =
  formTemplates.find((template) => template.sourceSheet === "LS_KHAM_BENH" && template.inspectionTeam === "Đoàn 01") ??
  formTemplates[0];

export const sampleFormCriteriaItems = formCriteriaItems
  .filter((item) => item.formTemplateId === sampleFormTemplate?.id)
  .slice(0, 30);

export const auditTeams: AuditTeam[] = ["Đoàn 01", "Đoàn 02"].map((teamName) => {
  const teamUsers = users.filter((user) => user.auditTeam === teamName);
  const roleIncludes = (needle: string) => teamUsers.find((user) => user.sourceRole?.includes(needle))?.fullName;
  return {
    id: teamName === "Đoàn 01" ? "audit-team-01" : "audit-team-02",
    name: teamName,
    leader: roleIncludes("Trưởng đoàn"),
    deputy: roleIncludes("Phó"),
    secretary: roleIncludes("Thư ký"),
    members: teamUsers.map((user) => user.fullName),
    dataSource: "Quyết định 271/QĐ-BV và sheet PHAN_CONG_02_DOAN"
  };
});

export const auditPeriods: AuditPeriod[] = [
  {
    id: "period-2026-05",
    month: 5,
    quarter: 2,
    year: 2026,
    startDate: "2026-05-27",
    endDate: "2026-05-31",
    status: "đang mở",
    createdBy: "Phòng KHTH",
    createdAt: "2026-05-25"
  },
  {
    id: "period-2026-06",
    month: 6,
    quarter: 2,
    year: 2026,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    status: "đang mở",
    createdBy: "Phòng KHTH",
    createdAt: "2026-05-25"
  },
  {
    id: "period-2026-07",
    month: 7,
    quarter: 3,
    year: 2026,
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    status: "đã chốt",
    createdBy: "Phòng KHTH",
    createdAt: "2026-06-25"
  }
];

const deptByName = Object.fromEntries(departments.map((department) => [department.name, department]));
const firstSchedule = auditSchedule[0];
const secondSchedule = auditSchedule[1];
const team1Users = users.filter((user) => user.auditTeam === "Đoàn 01");
const team2Users = users.filter((user) => user.auditTeam === "Đoàn 02");

function assignmentMembers(teamUsers: User[], departmentName: string) {
  const keywords = departmentName.toLowerCase();
  const matched = teamUsers.filter((user) =>
    user.assignedGroups?.some((group) => keywords.includes(group.toLowerCase().split(" ")[0] ?? ""))
  );
  return (matched.length ? matched : teamUsers).slice(0, 3).map((user) => user.fullName);
}

export const auditAssignments: AuditAssignment[] = [
  {
    id: "as-001",
    periodId: "period-2026-05",
    auditDate: firstSchedule.auditDate,
    team: "Đoàn 01",
    departmentId: deptByName[firstSchedule.team1ClinicalDepartments[0]]?.id ?? "hstc-cd-nhi",
    departmentName: firstSchedule.team1ClinicalDepartments[0],
    assignedMembers: assignmentMembers(team1Users, firstSchedule.team1ClinicalDepartments[0]),
    assignedGroups: ["Chuyên môn", "Cấp cứu", "An toàn người bệnh"],
    status: "đang chấm"
  },
  {
    id: "as-002",
    periodId: "period-2026-05",
    auditDate: firstSchedule.auditDate,
    team: "Đoàn 01",
    departmentId: deptByName[firstSchedule.team1SupportDepartment]?.id ?? "quan-ly-chat-luong",
    departmentName: firstSchedule.team1SupportDepartment,
    assignedMembers: assignmentMembers(team1Users, firstSchedule.team1SupportDepartment),
    assignedGroups: ["Quản lý chất lượng", "CAPA"],
    status: "chưa chấm"
  },
  {
    id: "as-003",
    periodId: "period-2026-05",
    auditDate: firstSchedule.auditDate,
    team: "Đoàn 02",
    departmentId: deptByName[firstSchedule.team2SupportDepartment]?.id ?? "duoc",
    departmentName: firstSchedule.team2SupportDepartment,
    assignedMembers: assignmentMembers(team2Users, firstSchedule.team2SupportDepartment),
    assignedGroups: ["Thuốc", "Quản lý kho"],
    status: "hoàn tất"
  },
  {
    id: "as-004",
    periodId: "period-2026-06",
    auditDate: secondSchedule.auditDate,
    team: "Đoàn 02",
    departmentId: deptByName[secondSchedule.team2SupportDepartment]?.id ?? "xet-nghiem",
    departmentName: secondSchedule.team2SupportDepartment,
    assignedMembers: assignmentMembers(team2Users, secondSchedule.team2SupportDepartment),
    assignedGroups: ["Quy trình", "Báo cáo", "An toàn"],
    status: "đã rà soát"
  }
];

export function classifyScore(score: number, hasSevereRisk = false) {
  if (hasSevereRisk) return "Không đạt";
  if (score >= 90) return "Đạt tốt";
  if (score >= 80) return "Đạt";
  if (score >= 65) return "Cần cải tiến";
  return "Không đạt";
}

export const inspectionForms: InspectionForm[] = [
  {
    id: "inspection-form-001",
    periodId: "period-2026-05",
    formTemplateId: sampleFormTemplate?.id ?? "form-template-demo",
    inspectionDate: "2026-05-27",
    departmentId: sampleFormTemplate?.departmentId ?? "kham-benh",
    departmentName: sampleFormTemplate?.departmentName ?? "Khám bệnh",
    inspectionTeam: sampleFormTemplate?.inspectionTeam ?? "Đoàn 01",
    leader: auditTeams[0]?.leader ?? "Trưởng đoàn",
    receptionPerson: "Đại diện khoa/phòng",
    startedAt: "08:00",
    endedAt: "10:30",
    status: "đang mở",
    preliminaryConclusion: "Phiếu mẫu bám theo sheet nguồn, dùng để mô phỏng quy trình nhập điểm trên điện thoại."
  }
];

export const inspectionScores: InspectionScore[] = sampleFormCriteriaItems.slice(0, 8).map((item, index) => {
  const score = index === 1 ? Math.max(item.maxScore - 2, 0) : index === 4 ? Math.max(item.maxScore - 1, 0) : item.maxScore;
  const riskLevel = index === 1 ? "Cao" : index === 4 ? "Trung bình" : "Không";
  return {
    id: `inspection-score-${index + 1}`,
    inspectionFormId: inspectionForms[0]?.id ?? "inspection-form-001",
    formCriteriaItemId: item.id,
    assignedUserId: users.find((user) => user.fullName === item.team1Assignee)?.id ?? users[2]?.id ?? "user-demo",
    maxScore: item.maxScore,
    score,
    ratio: item.maxScore ? Math.round((score / item.maxScore) * 100) : 0,
    deductionReason: score < item.maxScore ? "Phát hiện mẫu: cần bổ sung minh chứng và hoàn tất nội dung còn thiếu." : "",
    finding: score < item.maxScore ? "Có điểm trừ, yêu cầu nhập phát hiện/tồn tại." : "",
    evidenceText: score < item.maxScore ? "Ghi chú minh chứng dạng text ở giai đoạn prototype." : "",
    riskLevel,
    correctionRequest: riskLevel === "Cao" ? "Khắc phục trong ngày và báo trưởng đoàn/Ban Giám đốc." : score < item.maxScore ? "Bổ sung minh chứng, phân công người chịu trách nhiệm." : "",
    responsibleDepartment: sampleFormTemplate?.departmentName ?? "Khám bệnh",
    responsiblePerson: score < item.maxScore ? "Trưởng khoa/phòng" : "",
    dueDate: score < item.maxScore ? "2026-06-03" : "",
    capaStatus: score < item.maxScore ? "Đang thực hiện" : "Không áp dụng",
    note: item.sourceSheet
      ? `Nguồn: ${item.sourceFile}, sheet ${item.sourceSheet}, dòng ${item.sourceRow}`
      : "Nguồn: sheet phiếu kiểm tra",
    updatedAt: "2026-05-27 10:30"
  };
});

export const formScoreSummary = {
  totalScore: inspectionScores.reduce((sum, item) => sum + item.score, 0),
  maxScore: inspectionScores.reduce((sum, item) => sum + item.maxScore, 0),
  highRiskCount: inspectionScores.filter((item) => item.riskLevel === "Cao" || item.riskLevel === "Nghiêm trọng").length,
  scoredCount: inspectionScores.length,
  totalCriteria: sampleFormCriteriaItems.length
};

export const auditScores: AuditScore[] = [
  {
    id: "score-001",
    periodId: "period-2026-05",
    auditDate: "2026-05-27",
    departmentId: deptByName["Khám bệnh"]?.id ?? "kham-benh",
    departmentName: "Khám bệnh",
    block: "Lâm sàng",
    team: "Đoàn 01",
    scorer: "Ông Nguyễn Việt Trí",
    criteriaId: "criteria-ls-cls-v03-04",
    criteriaGroup: "Hồ sơ bệnh án",
    criteriaContent: "Hồ sơ bệnh án/HSBA điện tử được ghi đầy đủ, kịp thời, đúng trách nhiệm; ký xác nhận/ký số đúng quy định.",
    maxScore: 4,
    achievedScore: 2,
    deductedScore: 2,
    result: "không đạt",
    note: "Một số hồ sơ chưa hoàn tất ký xác nhận trong ngày.",
    evidence: "Ghi chú danh sách hồ sơ chưa ký trên hệ thống HIS.",
    correctiveAction: "Rà soát hồ sơ cuối ngày, phân công bác sĩ chịu trách nhiệm ký hoàn tất.",
    dueDate: "2026-06-03",
    owner: "Trưởng khoa Khám bệnh",
    capaStatus: "Đang thực hiện",
    riskLevel: "cần theo dõi",
    updatedAt: "2026-05-27 15:20"
  },
  {
    id: "score-002",
    periodId: "period-2026-05",
    auditDate: "2026-05-27",
    departmentId: deptByName["Dược"]?.id ?? "duoc",
    departmentName: "Dược",
    block: "Cận lâm sàng",
    team: "Đoàn 02",
    scorer: "Bà Trần Thiên Lý",
    criteriaId: "criteria-ls-cls-v03-14",
    criteriaGroup: "Thuốc - vật tư",
    criteriaContent: "Bảo quản, cấp phát, theo dõi thuốc và vật tư bảo đảm đúng quy định, không để nhầm lẫn hoặc quá hạn.",
    maxScore: 3,
    achievedScore: 1,
    deductedScore: 2,
    result: "không đạt",
    note: "Một khu vực nhãn cảnh báo thuốc LASA chưa đồng nhất.",
    evidence: "Biên bản kiểm tra tủ thuốc và ghi chú nhãn cảnh báo.",
    correctiveAction: "Chuẩn hóa nhãn LASA, kiểm tra lại toàn bộ tủ thuốc trong tuần.",
    dueDate: "2026-05-31",
    owner: "Trưởng khoa Dược",
    capaStatus: "Quá hạn",
    riskLevel: "nguy cơ cao",
    updatedAt: "2026-05-27 16:00"
  },
  {
    id: "score-003",
    periodId: "period-2026-05",
    auditDate: "2026-05-27",
    departmentId: deptByName["Phòng Kế hoạch tổng hợp"]?.id ?? "ke-hoach-tong-hop",
    departmentName: "Phòng Kế hoạch tổng hợp",
    block: "Hành chính",
    team: "Đoàn 02",
    scorer: "Bà Trần Kim Diệu",
    criteriaId: "criteria-hanh-chinh-v03-02",
    criteriaGroup: "Báo cáo - thống kê",
    criteriaContent: "Thực hiện báo cáo định kỳ/đột xuất đúng thời hạn, đúng biểu mẫu, số liệu thống nhất với hồ sơ gốc.",
    maxScore: 5,
    achievedScore: 4,
    deductedScore: 1,
    result: "đạt",
    note: "Cần chuẩn hóa thêm biểu mẫu đối chiếu số liệu.",
    evidence: "Bảng đối chiếu báo cáo tháng 5.",
    correctiveAction: "Bổ sung biểu mẫu đối chiếu thống nhất trước khi gửi báo cáo.",
    dueDate: "2026-06-05",
    owner: "Phòng KHTH",
    capaStatus: "Chưa thực hiện",
    riskLevel: "bình thường",
    updatedAt: "2026-05-27 17:10"
  }
];

export const reports: Report[] = [
  {
    id: "rp-2026-05",
    periodId: "period-2026-05",
    month: 5,
    year: 2026,
    status: "nháp",
    checkedDepartments: 4,
    highRiskCount: 1
  },
  {
    id: "rp-2026-04",
    periodId: "period-2026-04",
    month: 4,
    year: 2026,
    status: "đã xuất Excel",
    closedBy: "Phòng KHTH",
    closedAt: "2026-04-30 16:40",
    checkedDepartments: 12,
    highRiskCount: 3,
    downloadURL: "/reports/bao-cao-thang-04-2026.xlsx"
  }
];

export const dashboardDepartments = [
  { name: "Dược", score: 91, block: "Cận lâm sàng" },
  { name: "Phòng KHTH", score: 88, block: "Hành chính" },
  { name: "Khám bệnh", score: 82, block: "Lâm sàng" },
  { name: "Cấp cứu Nhi", score: 76, block: "Lâm sàng" },
  { name: "Kiểm soát nhiễm khuẩn", score: 93, block: "Cận lâm sàng" },
  { name: "Sản thường", score: 86, block: "Lâm sàng" }
];

export const monthlyTrend = [
  { month: "T1", average: 82, highRisk: 5 },
  { month: "T2", average: 84, highRisk: 4 },
  { month: "T3", average: 86, highRisk: 3 },
  { month: "T4", average: 85, highRisk: 3 },
  { month: "T5", average: 87, highRisk: 2 }
];

export const criteriaRadar = [
  { group: "Điều hành", score: 88 },
  { group: "HSBA", score: 79 },
  { group: "Thuốc", score: 84 },
  { group: "KSNK", score: 91 },
  { group: "An toàn", score: 81 },
  { group: "CAPA", score: 76 }
];

export const adminModules = [
  "Khoa/phòng",
  "Người dùng",
  "Đoàn kiểm tra",
  "Lịch kiểm tra",
  "Bảng kiểm",
  "Tiêu chí",
  "Phân công",
  "Kỳ kiểm tra",
  "Trạng thái CAPA"
];
