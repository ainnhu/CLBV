export type DepartmentBlock = "Lâm sàng" | "Cận lâm sàng" | "Hành chính";

export type FormType = "LS_CLS" | "HANH_CHINH";

export type Role =
  | "Khách xem"
  | "Thành viên đoàn"
  | "Thư ký đoàn"
  | "Trưởng đoàn"
  | "Phó trưởng đoàn"
  | "Phòng KHTH"
  | "Admin"
  | "CAPA"
  | "Ban Giám đốc";

export type ProtectedAction =
  | "score:create"
  | "score:update"
  | "score:submit"
  | "capa:update"
  | "period:close"
  | "period:unlock"
  | "report:export"
  | "catalog:manage"
  | "excel:import";

export type PeriodStatus = "đang mở" | "đã chốt" | "đã khóa";
export type CapaStatus = "Chưa thực hiện" | "Đang thực hiện" | "Đã hoàn thành" | "Quá hạn" | "Không áp dụng";
export type RiskLevel = "Không" | "Thấp" | "Trung bình" | "Cao" | "Nghiêm trọng";
export type ReportStatus = "nháp" | "đã chốt" | "đã xuất Excel";

export type Department = {
  id: string;
  name: string;
  shortName?: string;
  block: DepartmentBlock;
  active: boolean;
  dataSource?: string;
};

export type User = {
  id: string;
  username: string;
  fullName: string;
  titleUnit: string;
  role: Role;
  auditTeam?: string;
  assignedGroups?: string[];
  email?: string;
  phone?: string;
  active: boolean;
  defaultPassword?: string;
  sourceRole?: string;
  dataSource?: string;
};

export type CriteriaSet = {
  id: string;
  formType: "LS-CLS" | "Hành chính";
  applicableTeams: string[];
  totalScore: number;
  criteriaCount: number;
  version: string;
  active: boolean;
  dataSource?: string;
};

export type CriteriaItem = {
  id: string;
  criteriaSetId: string;
  order: number;
  groupCode: string;
  groupName: string;
  content: string;
  maxScore: number;
  scoringType: string;
  isHighRisk: boolean;
  evidenceHint: string;
  assignedGroupTeam1: string;
  assignedGroupTeam2: string;
  dataSource?: string;
};

export type FormTemplate = {
  id: string;
  name: string;
  sourceFile: string;
  sourceSheet: string;
  sourceRow?: number;
  formType: FormType;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  block: DepartmentBlock;
  inspectionTeam: string;
  version: string;
  totalScore: number;
  criteriaCount: number;
  headerFields: FormHeaderField[];
};

export type FormHeaderField = {
  key: string;
  label: string;
  value: string;
  sourceCell?: string;
};

export type FormCriteriaItem = {
  id: string;
  formTemplateId: string;
  criteriaId: string;
  sourceFile: string;
  sourceSheet: string;
  sourceRow: number;
  formType: FormType;
  departmentCode: string;
  departmentName: string;
  inspectionTeam: string;
  version: string;
  order: number;
  groupCode: string;
  groupName: string;
  content: string;
  evidenceRequired: string;
  maxScore: number;
  team1Assignee: string;
  team2Assignee: string;
  isHighRiskRelated: boolean;
};

export type InspectionForm = {
  id: string;
  periodId: string;
  formTemplateId: string;
  inspectionDate: string;
  departmentId: string;
  departmentName: string;
  inspectionTeam: string;
  leader: string;
  receptionPerson: string;
  startedAt: string;
  endedAt: string;
  status: "nháp" | "đang mở" | "đã gửi" | "đã khóa" | "đã công bố";
  preliminaryConclusion: string;
};

export type InspectionScore = {
  id: string;
  inspectionFormId: string;
  formCriteriaItemId: string;
  assignedUserId: string;
  maxScore: number;
  score: number;
  ratio: number;
  deductionReason: string;
  finding: string;
  evidenceText: string;
  riskLevel: RiskLevel;
  correctionRequest: string;
  responsibleDepartment: string;
  responsiblePerson: string;
  dueDate: string;
  capaStatus: CapaStatus;
  note: string;
  updatedAt: string;
};

export type AuditTeam = {
  id: string;
  name: string;
  leader?: string;
  deputy?: string;
  secretary?: string;
  members: string[];
  dataSource: string;
};

export type AuditSchedule = {
  id: string;
  auditDate: string;
  team1ClinicalDepartments: string[];
  team1SupportDepartment: string;
  team2ClinicalDepartments: string[];
  team2SupportDepartment: string;
  note: string;
  dataSource: string;
};

export type DataProvenance = {
  area: string;
  source: string;
  status: string;
};

export type AuditPeriod = {
  id: string;
  month: number;
  quarter: number;
  year: number;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  createdBy: string;
  createdAt: string;
};

export type AuditAssignment = {
  id: string;
  periodId: string;
  auditDate: string;
  team: string;
  departmentId: string;
  departmentName: string;
  assignedMembers: string[];
  assignedGroups: string[];
  status: "chưa chấm" | "đang chấm" | "hoàn tất" | "đã rà soát";
};

export type AuditScore = {
  id: string;
  periodId: string;
  auditDate: string;
  departmentId: string;
  departmentName: string;
  block: DepartmentBlock;
  team: string;
  scorer: string;
  criteriaId: string;
  criteriaGroup: string;
  criteriaContent: string;
  maxScore: number;
  achievedScore: number;
  deductedScore: number;
  result: "đạt" | "không đạt" | "không áp dụng";
  note: string;
  evidence: string;
  correctiveAction: string;
  dueDate: string;
  owner: string;
  capaStatus: CapaStatus;
  riskLevel: "bình thường" | "cần theo dõi" | "nguy cơ cao";
  updatedAt: string;
};

export type Report = {
  id: string;
  periodId: string;
  month: number;
  year: number;
  status: ReportStatus;
  closedBy?: string;
  closedAt?: string;
  checkedDepartments: number;
  highRiskCount: number;
  downloadURL?: string;
};

export type WorkbookAnalysis = {
  file: string;
  team: string;
  formType: string;
  sheetCount: number;
  formCount: number;
  forms: Array<{
    sheet: string;
    department: string;
    block: DepartmentBlock;
    criteriaSetId: string;
    criteriaCount: number;
    totalScore: number;
  }>;
};
