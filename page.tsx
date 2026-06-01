"use client";

import Image from "next/image";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Lock,
  LogIn,
  LogOut,
  Pencil,
  Search,
  ShieldCheck,
  Smartphone,
  Upload,
  Users,
  Wrench
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import * as XLSX from "xlsx";
import { useEffect, useMemo, useState } from "react";
import {
  adminModules,
  auditPeriods,
  auditSchedule,
  auditScores,
  auditTeams,
  classifyScore,
  dashboardDepartments,
  dataProvenance,
  defaultRules,
  formCriteriaItems,
  formScoreSummary,
  formTemplates,
  implementationProgress,
  inspectionForms,
  inspectionScores,
  monthlyTrend,
  publicReadFiles,
  reports,
  sampleFormCriteriaItems,
  sampleFormTemplate,
  sourceDocuments,
  sourceFiles,
  users,
  workbookSummary
} from "@/lib/mock-data";
import {
  canExportReport,
  canImportExcel,
  canManageData,
  canScore,
  canUpdateCapa,
  permissionsByRole,
  publicReadModules
} from "@/lib/permissions";
import type { FormTemplate, Role, User } from "@/lib/types";

const roleOptions: Role[] = [
  "Admin",
  "Phòng KHTH",
  "Trưởng đoàn",
  "Phó trưởng đoàn",
  "Thư ký đoàn",
  "Thành viên đoàn",
  "CAPA",
  "Ban Giám đốc"
];

type ActiveView = "dashboard" | "progress" | "scoring" | "sessions" | "reports" | "capa" | "guide" | "admin" | "login";

const navItems: { view: ActiveView; label: string; icon: typeof BarChart3 }[] = [
  { view: "dashboard", label: "Dashboard", icon: BarChart3 },
  { view: "progress", label: "Tiến độ", icon: CheckCircle2 },
  { view: "scoring", label: "Chấm điểm", icon: Smartphone },
  { view: "sessions", label: "Lịch kiểm tra", icon: CalendarDays },
  { view: "reports", label: "Báo cáo Excel", icon: FileSpreadsheet },
  { view: "capa", label: "CAPA", icon: Wrench },
  { view: "guide", label: "Hướng dẫn", icon: FileText },
  { view: "admin", label: "Quản trị", icon: Database }
];

function Pill({
  children,
  tone = "green"
}: {
  children: React.ReactNode;
  tone?: "green" | "red" | "yellow" | "blue" | "gray";
}) {
  const tones = {
    green: "bg-hospital-50 text-hospital-800 ring-hospital-200",
    red: "bg-danger-50 text-danger-700 ring-danger-100",
    yellow: "bg-amber-50 text-amber-800 ring-amber-200",
    blue: "bg-sky-50 text-sky-800 ring-sky-200",
    gray: "bg-slate-100 text-slate-700 ring-slate-200"
  };

  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}>{children}</span>;
}

function SectionHeader({
  id,
  eyebrow,
  title,
  note,
  action
}: {
  id?: string;
  eyebrow: string;
  title: string;
  note?: string;
  action?: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-28">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-hospital-700">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950 md:text-3xl">{title}</h2>
          {note ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{note}</p> : null}
        </div>
        {action}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProtectedButton({
  children,
  allowed,
  icon: Icon,
  onClick
}: {
  children: React.ReactNode;
  allowed: boolean;
  icon: typeof Download;
  onClick?: () => void;
}) {
  if (!allowed) return null;

  return (
    <button
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-hospital-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-hospital-900"
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function ReadonlyNotice() {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
      Bạn đang xem ở chế độ công khai. Các ô nhập liệu chỉ để xem mẫu; muốn chấm/sửa/chốt/xuất/import cần đăng nhập đúng quyền.
    </div>
  );
}

function scoreTone(score: number) {
  if (score >= 90) return "text-hospital-800";
  if (score >= 80) return "text-sky-700";
  if (score >= 65) return "text-amber-700";
  return "text-danger-700";
}

function ratio(value: number, max: number) {
  if (!max) return 0;
  return Math.round((value / max) * 100);
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>("Phòng KHTH");
  const [selectedTemplateId, setSelectedTemplateId] = useState(sampleFormTemplate?.id ?? formTemplates[0]?.id ?? "");
  const [selectedMonth, setSelectedMonth] = useState("Tháng 5/2026");
  const [selectedTeam, setSelectedTeam] = useState("Tất cả đoàn");
  const [selectedReportScope, setSelectedReportScope] = useState("Phiếu chi tiết từng khoa/phòng");
  const [reportLink, setReportLink] = useState<string | null>(reports[1]?.downloadURL ?? null);
  const [chartsReady, setChartsReady] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");

  const role = currentUser?.role;
  const writable = canScore(role);
  const selectedTemplate = formTemplates.find((template) => template.id === selectedTemplateId) ?? sampleFormTemplate;
  const selectedCriteria = formCriteriaItems.filter((item) => item.formTemplateId === selectedTemplate?.id);
  const criteriaPreview = selectedCriteria.length ? selectedCriteria : sampleFormCriteriaItems;

  const dashboardSummary = useMemo(() => {
    const highRisk = auditScores.filter((score) => score.riskLevel === "nguy cơ cao").length;
    const overdue = auditScores.filter((score) => score.capaStatus === "Quá hạn").length;
    const average = Math.round(dashboardDepartments.reduce((sum, item) => sum + item.score, 0) / dashboardDepartments.length);
    return {
      checkedDepartments: dashboardDepartments.length,
      average,
      good: dashboardDepartments.filter((item) => item.score >= 90).length,
      passed: dashboardDepartments.filter((item) => item.score >= 80 && item.score < 90).length,
      needsImprovement: dashboardDepartments.filter((item) => item.score >= 65 && item.score < 80).length,
      failed: dashboardDepartments.filter((item) => item.score < 65).length,
      highRisk,
      overdue
    };
  }, []);

  const classification = classifyScore(
    formScoreSummary.maxScore ? Math.round((formScoreSummary.totalScore / formScoreSummary.maxScore) * 100) : 0,
    formScoreSummary.highRiskCount > 0
  );

  useEffect(() => {
    setChartsReady(true);
  }, []);

  useEffect(() => {
    const hashView = window.location.hash.replace("#", "") as ActiveView;
    if (["dashboard", "progress", "scoring", "sessions", "reports", "capa", "guide", "admin", "login"].includes(hashView)) {
      setActiveView(hashView);
    }
  }, []);

  function goToView(view: ActiveView) {
    setActiveView(view);
    window.history.replaceState(null, "", `#${view}`);
  }

  function demoLogin() {
    const user = users.find((item) => item.role === selectedRole) ?? users[0];
    setCurrentUser(user);
  }

  function exportPrototypeReport() {
    const workbook = XLSX.utils.book_new();
    const activeForm = selectedTemplate as FormTemplate;
    const detailRows = criteriaPreview.map((item, index) => {
      const score = inspectionScores[index]?.score ?? item.maxScore;
      return {
        STT: item.order,
        "Mã nhóm": item.groupCode,
        "Nhóm nội dung": item.groupName,
        "Nội dung kiểm tra": item.content,
        "Minh chứng cần xem": item.evidenceRequired,
        "Điểm tối đa": item.maxScore,
        "Điểm đạt": score,
        "Tỷ lệ đạt": `${ratio(score, item.maxScore)}%`,
        "Phát hiện/tồn tại": inspectionScores[index]?.finding ?? "",
        "Yêu cầu khắc phục": inspectionScores[index]?.correctionRequest ?? "",
        "Thời hạn": inspectionScores[index]?.dueDate ?? "",
        "Mức độ nguy cơ": inspectionScores[index]?.riskLevel ?? "Không",
        "Ghi chú": inspectionScores[index]?.note ?? ""
      };
    });
    const summaryRows = dashboardDepartments.map((item) => ({
      "Đơn vị": item.name,
      "Khối": item.block,
      "Tổng điểm": item.score,
      "Xếp loại": classifyScore(item.score, false)
    }));
    const highRiskRows = detailRows.filter((item) => item["Mức độ nguy cơ"] === "Cao" || item["Mức độ nguy cơ"] === "Nghiêm trọng");

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        { "Tên phiếu": activeForm?.name, "Đơn vị": activeForm?.departmentName, "Sheet nguồn": activeForm?.sourceSheet, "File nguồn": activeForm?.sourceFile },
        { "Tổng điểm": formScoreSummary.totalScore, "Tỷ lệ": `${formScoreSummary.maxScore ? ratio(formScoreSummary.totalScore, formScoreSummary.maxScore) : 0}%`, "Xếp loại": classification }
      ]),
      "PHIEU_CHI_TIET"
    );
    XLSX.utils.sheet_add_json(workbook.Sheets.PHIEU_CHI_TIET, detailRows, { origin: "A5" });
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), "TONG_HOP_DIEM");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detailRows.filter((item) => Number(item["Điểm đạt"]) < Number(item["Điểm tối đa"]))), "CHI_TIET_LOI");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(highRiskRows), "LOI_NGUY_CO_CAO");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detailRows.filter((item) => item["Yêu cầu khắc phục"])), "CAPA");
    XLSX.writeFile(workbook, "bao-cao-theo-phieu-nguon-prototype.xlsx");
    setReportLink("bao-cao-theo-phieu-nguon-prototype.xlsx");
  }

  const formChoices = formTemplates
    .slice(0, 30)
    .map((template) => `${template.departmentName} - ${template.inspectionTeam} - ${template.sourceSheet}`);
  const selectedChoice = selectedTemplate
    ? `${selectedTemplate.departmentName} - ${selectedTemplate.inspectionTeam} - ${selectedTemplate.sourceSheet}`
    : formChoices[0];

  return (
    <main className="app-shell min-h-screen">
      <header className="sticky top-0 z-50 border-b border-hospital-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Image src="/logo-bv-san-nhi-ca-mau.jpg" alt="Logo Bệnh viện Sản - Nhi Cà Mau" width={48} height={48} className="h-11 w-11 rounded-md object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase text-hospital-700">Bệnh viện Sản - Nhi Cà Mau</p>
            <h1 className="truncate text-base font-bold text-slate-950 md:text-xl">Chấm điểm kiểm tra các hoạt động của bệnh viện</h1>
          </div>
          {currentUser ? (
            <div className="hidden items-center gap-2 md:flex">
              <Pill tone="blue">{currentUser.role}</Pill>
              <button onClick={() => setCurrentUser(null)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700">
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          ) : (
            <button onClick={() => goToView("login")} className="hidden min-h-10 items-center gap-2 rounded-md bg-hospital-800 px-3 text-sm font-semibold text-white md:inline-flex">
              <LogIn className="h-4 w-4" />
              Đăng nhập để thao tác
            </button>
          )}
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => goToView(item.view)}
              aria-pressed={activeView === item.view}
              className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
                activeView === item.view
                  ? "border-hospital-800 bg-hospital-800 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-hospital-300 hover:bg-hospital-50"
              }`}
            >
              <item.icon className={`h-4 w-4 ${activeView === item.view ? "text-white" : "text-hospital-700"}`} />
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="border-b border-hospital-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h2 className="max-w-3xl text-3xl font-bold leading-tight text-slate-950 md:text-4xl">
              Dashboard công khai, thao tác nghiệp vụ theo phân quyền
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
              Dữ liệu xem được công khai khi có link. Chấm điểm, sửa điểm, cập nhật CAPA, import Excel, chốt kỳ và xuất báo cáo chỉ mở khi đăng nhập đúng quyền.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => goToView("dashboard")} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-hospital-800 px-4 py-2 font-semibold text-white">
                <BarChart3 className="h-4 w-4" />
                Xem dashboard
              </button>
              <button onClick={() => goToView("scoring")} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-hospital-200 bg-white px-4 py-2 font-semibold text-hospital-800">
                <Smartphone className="h-4 w-4" />
                Xem mẫu phiếu chấm
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-2">
            {[
              ["Sheet phiếu nguồn", formTemplates.length],
              ["Dòng tiêu chí theo sheet", formCriteriaItems.length],
              ["Khoa/phòng", new Set(formTemplates.map((item) => item.departmentName)).size],
              ["Lịch thứ Tư", auditSchedule.length]
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-hospital-100 bg-hospital-50 p-4">
                <p className="text-2xl font-bold text-hospital-900">{value}</p>
                <p className="mt-1 text-xs font-semibold text-hospital-800">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <section className={activeView === "dashboard" ? "block" : "hidden"}>
          <SectionHeader
            id="dashboard"
            eyebrow="Dashboard công khai"
            title="Tổng quan kiểm tra hoạt động bệnh viện"
            note="Không yêu cầu đăng nhập để xem dashboard, lịch kiểm tra, kết quả công khai, CAPA, bảng kiểm và báo cáo đã xuất."
          />
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <SelectField label="Thời gian" value={selectedMonth} options={["Tháng 5/2026", "Quý II/2026", "Năm 2026"]} onChange={setSelectedMonth} />
            <SelectField label="Đoàn kiểm tra" value={selectedTeam} options={["Tất cả đoàn", "Đoàn 01", "Đoàn 02"]} onChange={setSelectedTeam} />
            <SelectField label="Khối" value="Tất cả khối" options={["Tất cả khối", "Lâm sàng", "Cận lâm sàng", "Hành chính"]} />
            <SelectField label="Mức độ nguy cơ" value="Tất cả mức độ" options={["Tất cả mức độ", "Không", "Thấp", "Trung bình", "Cao", "Nghiêm trọng"]} />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {[
              ["Phiên/khoa đã kiểm tra", dashboardSummary.checkedDepartments],
              ["Điểm trung bình", dashboardSummary.average],
              ["Lỗi nguy cơ cao", dashboardSummary.highRisk],
              ["CAPA quá hạn", dashboardSummary.overdue]
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-600">{label}</p>
                <p className={`mt-2 text-3xl font-bold ${typeof value === "number" && label === "Điểm trung bình" ? scoreTone(value) : "text-hospital-900"}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-bold text-slate-950">Điểm theo khoa/phòng</h3>
              <div className="h-72">
                {chartsReady ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardDepartments}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="score" name="Điểm" radius={[4, 4, 0, 0]}>
                        {dashboardDepartments.map((item) => (
                          <Cell key={item.name} fill={item.score < 80 ? "#dc2626" : "#089654"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-bold text-slate-950">Xếp loại và xu hướng</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="h-48">
                  {chartsReady ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Đạt tốt", value: dashboardSummary.good, fill: "#089654" },
                            { name: "Đạt", value: dashboardSummary.passed, fill: "#0ea5e9" },
                            { name: "Cần cải tiến", value: dashboardSummary.needsImprovement, fill: "#f59e0b" },
                            { name: "Không đạt", value: dashboardSummary.failed, fill: "#dc2626" }
                          ]}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={70}
                          label
                        />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>
                <div className="h-48">
                  {chartsReady ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrend}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="average" name="Điểm TB" stroke="#087845" strokeWidth={3} />
                        <Line type="monotone" dataKey="highRisk" name="Nguy cơ cao" stroke="#dc2626" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-md border border-danger-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-danger-700">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-bold">Cảnh báo nguy cơ cao</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {auditScores
                .filter((score) => score.riskLevel !== "bình thường")
                .map((score) => (
                  <article key={score.id} className="rounded-md border border-danger-100 bg-danger-50 p-3">
                    <Pill tone={score.riskLevel === "nguy cơ cao" ? "red" : "yellow"}>{score.riskLevel}</Pill>
                    <h4 className="mt-2 font-bold text-slate-950">{score.departmentName}</h4>
                    <p className="mt-1 line-clamp-3 text-sm text-slate-700">{score.criteriaContent}</p>
                  </article>
                ))}
            </div>
          </div>
        </section>

        <section className={activeView === "progress" ? "block" : "hidden"}>
          <SectionHeader
            id="progress"
            eyebrow="Tiến độ hoàn thành"
            title="Theo dõi phần đã làm và phần còn lại"
            note="Khối này dùng để cập nhật tiến độ trong khi tiếp tục hoàn thiện web. Giao diện có thể chỉnh lại sau, còn tiến độ nghiệp vụ/kỹ thuật vẫn được ghi rõ."
          />
          <div className="grid gap-3 lg:grid-cols-5">
            {implementationProgress.map((item) => (
              <article key={item.group} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-slate-950">{item.group}</h3>
                  <span className="text-lg font-bold text-hospital-800">{item.percent}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-hospital-700" style={{ width: `${item.percent}%` }} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{item.status}</p>
                <details className="mt-3 rounded-md bg-slate-50 p-2 text-sm">
                  <summary className="cursor-pointer font-semibold text-slate-800">Chi tiết</summary>
                  <p className="mt-2 font-semibold text-hospital-900">Đã làm</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-slate-600">
                    {item.done.map((done) => (
                      <li key={done}>{done}</li>
                    ))}
                  </ul>
                  <p className="mt-2 font-semibold text-amber-800">Tiếp theo</p>
                  <p className="mt-1 text-slate-600">{item.next}</p>
                </details>
              </article>
            ))}
          </div>
        </section>

        <section id="login" className={activeView === "login" ? "block" : "hidden"}>
          <SectionHeader eyebrow="Đăng nhập thao tác" title="Đăng nhập chỉ dùng cho người cần thay đổi dữ liệu" />
          <div className="grid gap-5 lg:grid-cols-[0.65fr_1.35fr]">
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <Image src="/logo-bv-san-nhi-ca-mau.jpg" alt="Logo bệnh viện" width={72} height={72} className="mb-4 h-16 w-16 rounded-md object-cover" />
              <SelectField label="Vai trò demo" value={selectedRole} options={roleOptions} onChange={(value) => setSelectedRole(value as Role)} />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input className="min-h-11 rounded-md border border-slate-300 px-3 text-sm" value={users.find((item) => item.role === selectedRole)?.username ?? "admin"} readOnly />
                <input className="min-h-11 rounded-md border border-slate-300 px-3 text-sm" value="123456" readOnly />
              </div>
              <button onClick={demoLogin} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-hospital-800 px-4 font-semibold text-white">
                <LogIn className="h-4 w-4" />
                Đăng nhập mẫu
              </button>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Prototype dùng tài khoản mẫu. Bản thật dùng Supabase Auth, mật khẩu hash, RLS và audit log.
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-bold text-slate-950">Quyền hiện tại</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-md bg-hospital-50 p-3">
                  <p className="text-sm font-semibold text-hospital-900">Quyền xem công khai</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {publicReadModules.map((item) => (
                      <Pill key={item} tone="green">{item}</Pill>
                    ))}
                  </div>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{currentUser ? `${currentUser.fullName} - ${currentUser.role}` : "Chưa đăng nhập"}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(currentUser ? permissionsByRole[currentUser.role] : permissionsByRole["Khách xem"]).map((item) => (
                      <Pill key={item} tone={currentUser ? "blue" : "gray"}>{item}</Pill>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                {[
                  ["Chấm/sửa", canScore(role)],
                  ["CAPA", canUpdateCapa(role)],
                  ["Xuất Excel", canExportReport(role)],
                  ["Import/quản trị", canImportExcel(role) || canManageData(role)]
                ].map(([label, allowed]) => (
                  <div key={String(label)} className="rounded-md border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className={`mt-1 text-sm font-bold ${allowed ? "text-hospital-800" : "text-slate-400"}`}>{allowed ? "Được phép" : "Chỉ xem"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={activeView === "scoring" ? "block" : "hidden"}>
          <SectionHeader
            id="scoring"
            eyebrow="Chấm điểm mobile-first"
            title="Phiếu chấm bám theo sheet kiểm tra/chấm điểm nguồn"
            note="Người xem công khai vẫn xem được mẫu phiếu. Người có quyền mới nhập điểm, lưu nháp hoặc hoàn tất phiếu."
          />

          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <SelectField
              label="Phiếu theo sheet nguồn"
              value={selectedChoice}
              options={formChoices}
              onChange={(value) => {
                const template = formTemplates.find((item) => `${item.departmentName} - ${item.inspectionTeam} - ${item.sourceSheet}` === value);
                if (template) setSelectedTemplateId(template.id);
              }}
            />
            <SelectField label="Kỳ kiểm tra" value="Tháng 5/2026" options={["Tháng 5/2026", "Tháng 6/2026", "Tháng 7/2026"]} />
            <SelectField label="Ngày kiểm tra" value="27/05/2026" options={["27/05/2026", "03/06/2026", "10/06/2026"]} />
            <SelectField label="Chế độ" value={writable ? "Có quyền nhập điểm" : "Chỉ xem"} options={[writable ? "Có quyền nhập điểm" : "Chỉ xem"]} />
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <aside className="space-y-4">
              <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="font-bold text-slate-950">Đầu phiếu</h3>
                <dl className="mt-3 grid gap-2 text-sm">
                  {(selectedTemplate?.headerFields ?? []).slice(0, 8).map((field) => (
                    <div key={field.key} className="grid grid-cols-[0.9fr_1.1fr] gap-2 border-b border-slate-100 pb-2 last:border-0">
                      <dt className="font-semibold text-slate-500">{field.label}</dt>
                      <dd className="text-slate-800">{field.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="rounded-md border border-hospital-100 bg-hospital-50 p-4">
                <h3 className="font-bold text-hospital-950">Quy tắc chấm nhanh</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-hospital-900">
                  <li>Điểm đạt không âm và không vượt điểm tối đa.</li>
                  <li>Điểm thấp hơn tối đa phải nhập phát hiện hoặc lý do trừ điểm.</li>
                  <li>Nguy cơ cao/nghiêm trọng phải có yêu cầu khắc phục, thời hạn và người/bộ phận chịu trách nhiệm.</li>
                  <li>Không khóa phiếu nếu còn tiêu chí bắt buộc chưa chấm.</li>
                </ul>
              </div>
              {!writable ? <ReadonlyNotice /> : null}
            </aside>

            <div className="mx-auto w-full max-w-[430px] rounded-[24px] border border-slate-200 bg-slate-950 p-2 shadow-lg lg:max-w-none lg:rounded-md lg:bg-transparent lg:p-0 lg:shadow-none">
              <div className="max-h-[780px] overflow-y-auto rounded-[20px] bg-slate-50 p-3 lg:rounded-md">
                <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-hospital-700">{selectedTemplate?.sourceSheet}</p>
                      <h3 className="text-lg font-bold text-slate-950">{selectedTemplate?.departmentName}</h3>
                      <p className="text-xs text-slate-500">
                        {selectedTemplate?.inspectionTeam} · {selectedTemplate?.criteriaCount} nội dung · {selectedTemplate?.totalScore} điểm
                      </p>
                    </div>
                    <Pill tone={formScoreSummary.highRiskCount ? "red" : "green"}>{classification}</Pill>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-slate-200">
                    <div
                      className="h-3 rounded-full bg-hospital-600"
                      style={{ width: `${Math.min(100, Math.round((formScoreSummary.scoredCount / Math.max(formScoreSummary.totalCriteria, 1)) * 100))}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Đã chấm {formScoreSummary.scoredCount}/{formScoreSummary.totalCriteria} tiêu chí · Tổng mẫu {formScoreSummary.totalScore}/{formScoreSummary.maxScore}
                  </p>
                </div>

                <div className="space-y-3 pt-3">
                  {criteriaPreview.slice(0, 10).map((item, index) => {
                    const score = inspectionScores[index];
                    const hasFinding = score && score.score < score.maxScore;
                    return (
                      <article key={item.id} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <Pill tone={item.isHighRiskRelated ? "red" : "green"}>STT {item.order}</Pill>
                              <Pill tone="gray">{item.groupCode}</Pill>
                            </div>
                            <h4 className="mt-2 text-sm font-bold text-slate-950">{item.groupName}</h4>
                          </div>
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-sm font-bold">{item.maxScore} điểm</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{item.content}</p>
                        <details className="mt-2 rounded-md bg-slate-50 p-2">
                          <summary className="cursor-pointer text-sm font-semibold text-slate-700">Minh chứng cần xem</summary>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{item.evidenceRequired || "Theo sheet nguồn, bổ sung khi import chi tiết."}</p>
                        </details>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <label className="text-xs font-semibold text-slate-500">
                            Điểm đạt
                            <input
                              disabled={!writable}
                              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold disabled:bg-slate-100"
                              defaultValue={score?.score ?? item.maxScore}
                            />
                          </label>
                          <SelectField label="Nguy cơ" value={score?.riskLevel ?? "Không"} options={["Không", "Thấp", "Trung bình", "Cao", "Nghiêm trọng"]} />
                        </div>
                        {hasFinding || index === 0 ? (
                          <details className="mt-3 rounded-md border border-slate-200 p-2" open={Boolean(hasFinding)}>
                            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Phát hiện và khắc phục</summary>
                            <textarea
                              disabled={!writable}
                              className="mt-2 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                              defaultValue={score?.finding ?? ""}
                              placeholder="Phát hiện/tồn tại hoặc lý do trừ điểm"
                            />
                            <textarea
                              disabled={!writable}
                              className="mt-2 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                              defaultValue={score?.evidenceText ?? ""}
                              placeholder="Minh chứng thực tế"
                            />
                            <textarea
                              disabled={!writable}
                              className="mt-2 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                              defaultValue={score?.correctionRequest ?? ""}
                              placeholder="Yêu cầu khắc phục"
                            />
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <input
                                disabled={!writable}
                                className="min-h-11 rounded-md border border-slate-300 px-3 text-sm disabled:bg-slate-100"
                                defaultValue={score?.responsiblePerson ?? ""}
                                placeholder="Người chịu trách nhiệm"
                              />
                              <input
                                disabled={!writable}
                                className="min-h-11 rounded-md border border-slate-300 px-3 text-sm disabled:bg-slate-100"
                                defaultValue={score?.responsibleDepartment ?? ""}
                                placeholder="Bộ phận chịu trách nhiệm"
                              />
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <input disabled={!writable} type="date" className="min-h-11 rounded-md border border-slate-300 px-3 text-sm disabled:bg-slate-100" defaultValue={score?.dueDate} />
                              <SelectField label="CAPA" value={score?.capaStatus ?? "Không áp dụng"} options={["Chưa thực hiện", "Đang thực hiện", "Đã hoàn thành", "Quá hạn", "Không áp dụng"]} />
                            </div>
                          </details>
                        ) : null}
                      </article>
                    );
                  })}
                </div>

                <div className="sticky bottom-0 mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50 pt-3">
                  <ProtectedButton allowed={writable} icon={ClipboardCheck}>Lưu nháp</ProtectedButton>
                  <ProtectedButton allowed={writable} icon={CheckCircle2}>Hoàn tất phiếu</ProtectedButton>
                  {!writable ? (
                    <button onClick={() => goToView("login")} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-hospital-800 px-4 text-sm font-semibold text-white">
                      <LogIn className="h-4 w-4" />
                      Đăng nhập để chấm điểm
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={activeView === "sessions" ? "block" : "hidden"}>
          <SectionHeader
            id="sessions"
            eyebrow="Lịch kiểm tra"
            title="Phiên kiểm tra và phân công theo đoàn"
            action={<ProtectedButton allowed={canManageData(role)} icon={Pencil}>Điều chỉnh lịch</ProtectedButton>}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {auditTeams.map((team) => (
              <div key={team.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <Pill tone="blue">{team.name}</Pill>
                <dl className="mt-3 grid gap-2 text-sm text-slate-700">
                  <div><span className="font-semibold text-slate-950">Trưởng đoàn:</span> {team.leader}</div>
                  <div><span className="font-semibold text-slate-950">Phó trưởng đoàn:</span> {team.deputy}</div>
                  <div><span className="font-semibold text-slate-950">Thư ký:</span> {team.secretary}</div>
                </dl>
              </div>
            ))}
          </div>
          <div className="mt-4 overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-hospital-900 text-white">
                <tr>
                  <th className="px-3 py-3">Ngày</th>
                  <th>Đoàn 01 - lâm sàng</th>
                  <th>Đoàn 01 - HC/CLS</th>
                  <th>Đoàn 02 - lâm sàng</th>
                  <th>Đoàn 02 - HC/CLS</th>
                </tr>
              </thead>
              <tbody>
                {auditSchedule.slice(0, 10).map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-semibold">{row.auditDate}</td>
                    <td>{row.team1ClinicalDepartments.join(", ")}</td>
                    <td>{row.team1SupportDepartment}</td>
                    <td>{row.team2ClinicalDepartments.join(", ")}</td>
                    <td>{row.team2SupportDepartment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={activeView === "reports" ? "block" : "hidden"}>
          <SectionHeader
            id="reports"
            eyebrow="Báo cáo Excel"
            title="Xuất báo cáo bám theo phiếu nguồn"
            note="Mẫu mặc định dùng chính nội dung sheet phiếu hiện có: phiếu chi tiết từng khoa/phòng, tổng hợp điểm, lỗi/điểm trừ, nguy cơ cao và CAPA."
            action={<ProtectedButton allowed={canExportReport(role)} icon={Download} onClick={exportPrototypeReport}>Xuất Excel mẫu</ProtectedButton>}
          />
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <SelectField
                label="Phạm vi báo cáo"
                value={selectedReportScope}
                options={["Phiếu chi tiết từng khoa/phòng", "Theo đoàn", "Theo ngày kiểm tra", "Theo khối", "Toàn viện", "Danh sách CAPA", "Lỗi nguy cơ cao"]}
                onChange={setSelectedReportScope}
              />
              <div className="mt-3 space-y-3">
                {reports.map((report) => (
                  <div key={report.id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold">Báo cáo tháng {report.month}/{report.year}</p>
                      <Pill tone={report.status === "đã xuất Excel" ? "green" : "yellow"}>{report.status}</Pill>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{report.checkedDepartments} khoa/phòng, {report.highRiskCount} lỗi nguy cơ cao</p>
                    {report.downloadURL ? (
                      <a href={report.downloadURL} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-hospital-800">
                        <Download className="h-4 w-4" />
                        Tải báo cáo đã xuất
                      </a>
                    ) : null}
                  </div>
                ))}
                {reportLink ? <p className="rounded-md bg-hospital-50 p-3 text-sm font-semibold text-hospital-900">File mẫu: {reportLink}</p> : null}
              </div>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-bold text-slate-950">Sheet xuất tối thiểu</h3>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {["PHIEU_CHI_TIET", "TONG_HOP_DIEM", "CHI_TIET_LOI", "LOI_NGUY_CO_CAO", "CAPA"].map((sheet) => (
                  <div key={sheet} className="flex items-center gap-2 rounded-md border border-slate-200 p-3 text-sm font-semibold">
                    <FileSpreadsheet className="h-4 w-4 text-hospital-700" />
                    {sheet}
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                Khi triển khai thật, export sẽ đọc `form_templates`, `form_header_fields`, `form_criteria_items` và `inspection_scores` để tái hiện gần đúng bố cục sheet gốc thay vì chỉ xuất bảng tổng hợp rút gọn.
              </p>
            </div>
          </div>
        </section>

        <section className={activeView === "capa" ? "block" : "hidden"}>
          <SectionHeader
            id="capa"
            eyebrow="CAPA"
            title="Theo dõi khắc phục công khai, cập nhật theo quyền"
            action={<ProtectedButton allowed={canUpdateCapa(role)} icon={Pencil}>Cập nhật CAPA</ProtectedButton>}
          />
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input className="min-h-11 w-full rounded-md border border-slate-300 pl-10 pr-3 text-sm" placeholder="Tìm khoa/phòng, phát hiện, yêu cầu khắc phục" />
            </div>
            <SelectField label="Trạng thái" value="Tất cả CAPA" options={["Tất cả CAPA", "Chưa thực hiện", "Đang thực hiện", "Đã hoàn thành", "Quá hạn", "Không áp dụng"]} />
            <SelectField label="Mức độ" value="Tất cả mức độ" options={["Tất cả mức độ", "Không", "Thấp", "Trung bình", "Cao", "Nghiêm trọng"]} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {inspectionScores.filter((score) => score.capaStatus !== "Không áp dụng").map((score) => {
              const criteria = sampleFormCriteriaItems.find((item) => item.id === score.formCriteriaItemId);
              return (
                <article key={score.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={score.riskLevel === "Cao" || score.riskLevel === "Nghiêm trọng" ? "red" : "yellow"}>{score.riskLevel}</Pill>
                    <Pill tone={score.capaStatus === "Quá hạn" ? "red" : "blue"}>{score.capaStatus}</Pill>
                  </div>
                  <h3 className="mt-3 font-bold text-slate-950">{criteria?.departmentName ?? selectedTemplate?.departmentName}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{score.finding || criteria?.content}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{score.correctionRequest}</p>
                  <p className="mt-2 text-sm text-slate-600">Phụ trách: {score.responsiblePerson || score.responsibleDepartment} · hạn {score.dueDate}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className={activeView === "guide" ? "block" : "hidden"}>
          <SectionHeader id="guide" eyebrow="Hướng dẫn" title="Hướng dẫn thao tác ngắn gọn cho người chấm" />
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["1. Chọn phiên", "Chọn kỳ kiểm tra, ngày kiểm tra, khoa/phòng và sheet phiếu tương ứng."],
              ["2. Nhập điểm", "Nhập điểm đạt cho từng tiêu chí. Điểm thấp hơn tối đa phải ghi rõ phát hiện hoặc lý do trừ điểm."],
              ["3. Ghi CAPA", "Nếu có lỗi, nhập yêu cầu khắc phục, thời hạn, người/bộ phận chịu trách nhiệm và trạng thái CAPA."],
              ["4. Nguy cơ cao", "Chọn mức Cao/Nghiêm trọng khi ảnh hưởng an toàn người bệnh hoặc an toàn bệnh viện; báo trưởng đoàn trong ngày."],
              ["5. Lưu nháp", "Dùng khi chưa hoàn tất kiểm tra thực tế hoặc cần bổ sung minh chứng."],
              ["6. Hoàn tất", "Chỉ gửi hoàn tất khi không còn tiêu chí bắt buộc bỏ trống."]
            ].map(([title, text]) => (
              <div key={title} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="font-bold text-hospital-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={activeView === "admin" ? "block" : "hidden"}>
          <SectionHeader
            id="admin"
            eyebrow="Quản trị dữ liệu"
            title="Import Excel, danh mục và cấu hình nghiệp vụ"
            note="Các thay đổi như khoa/phòng, tiêu chí, lịch kiểm tra, phân công và trạng thái CAPA sẽ thao tác trên web, không sửa code."
            action={<ProtectedButton allowed={canManageData(role)} icon={Upload}>Import Excel</ProtectedButton>}
          />
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <SelectField label="Danh mục" value={adminModules[0]} options={adminModules} />
              <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                {canManageData(role)
                  ? "Tài khoản hiện tại được thêm/sửa/khóa/mở khóa danh mục."
                  : "Bạn đang xem danh mục công khai. Muốn chỉnh sửa cần đăng nhập Admin hoặc Phòng KHTH."}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <ProtectedButton allowed={canManageData(role)} icon={Pencil}>Sửa danh mục</ProtectedButton>
                <ProtectedButton allowed={canImportExcel(role)} icon={Upload}>Import 4 file Excel</ProtectedButton>
              </div>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-bold text-slate-950">Dữ liệu nguồn đã dùng</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {dataProvenance.map((item) => (
                  <div key={item.area} className="rounded-md border border-slate-200 p-3">
                    <Pill tone={item.status.includes("mẫu") || item.status.includes("Chưa") ? "yellow" : "green"}>{item.status}</Pill>
                    <p className="mt-2 text-sm font-bold text-slate-950">{item.area}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{item.source}</p>
                  </div>
                ))}
              </div>
              <details className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">Cấu trúc workbook đã phân tích</summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-3 py-2">File</th>
                        <th>Loại</th>
                        <th>Số sheet</th>
                        <th>Sheet phiếu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workbookSummary.map((item) => (
                        <tr key={item.file} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-semibold">{item.file}</td>
                          <td>{item.formType}</td>
                          <td>{item.sheetCount}</td>
                          <td>{item.formCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
              <details className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">Tệp nguồn</summary>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {[...sourceFiles, ...publicReadFiles].map((file) => (
                    <div key={`${file.type}-${file.name}`} className="rounded-md bg-white p-3 text-sm">
                      <p className="text-xs font-semibold text-hospital-700">{file.type}</p>
                      <p className="mt-1 font-semibold text-slate-800">{file.name}</p>
                    </div>
                  ))}
                </div>
              </details>
              <details className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">Căn cứ nguồn</summary>
                <div className="mt-3 grid gap-2">
                  {sourceDocuments.map((document) => (
                    <div key={document.name} className="rounded-md bg-white p-3 text-sm">
                      <p className="font-bold text-slate-950">{document.name}</p>
                      <p className="mt-1 text-slate-600">{document.usedFor.join(", ")}</p>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-8 bg-white">
        <div className="relative overflow-hidden border-t border-hospital-100">
          <Image
            src="/banner-bv-san-nhi-ca-mau.jpg"
            alt="Niềm tin của mẹ - Sức khỏe của bé"
            width={884}
            height={112}
            className="h-24 w-full object-cover md:h-28"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-hospital-950/85 via-hospital-950/35 to-transparent">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 text-sm font-semibold text-white md:flex-row md:items-center md:justify-between">
              <span>Bệnh viện Sản - Nhi Cà Mau</span>
              <span>Phòng Kế hoạch - Tổng hợp</span>
              <span>BS. Hồ Ái Như</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
