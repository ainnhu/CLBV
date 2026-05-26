"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
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
  LogIn,
  LogOut,
  Pencil,
  Search,
  Smartphone,
  Upload,
  Wrench
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as XLSX from "xlsx";
import {
  adminModules,
  auditSchedule,
  auditScores,
  auditTeams,
  classifyScore,
  dashboardDepartments,
  dataProvenance,
  formCriteriaItems,
  formScoreSummary,
  formTemplates,
  implementationProgress,
  inspectionScores,
  monthlyTrend,
  reports,
  sampleFormCriteriaItems,
  sampleFormTemplate,
  sourceFiles,
  users,
  workbookSummary
} from "@/lib/mock-data";
import { canExportReport, canImportExcel, canManageData, canScore, canUpdateCapa } from "@/lib/permissions";
import type { FormTemplate, Role, User } from "@/lib/types";

type View = "dashboard" | "scoring" | "sessions" | "reports" | "capa" | "guide" | "admin" | "progress" | "login";
type Tone = "green" | "red" | "yellow" | "blue" | "gray";

const roles: Role[] = ["Admin", "Phòng KHTH", "Trưởng đoàn", "Phó trưởng đoàn", "Thư ký đoàn", "Thành viên đoàn", "CAPA", "Ban Giám đốc"];
const views: { id: View; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "scoring", label: "Chấm điểm", icon: Smartphone },
  { id: "sessions", label: "Lịch", icon: CalendarDays },
  { id: "reports", label: "Báo cáo", icon: FileSpreadsheet },
  { id: "capa", label: "CAPA", icon: Wrench },
  { id: "guide", label: "Hướng dẫn", icon: FileText },
  { id: "admin", label: "Quản trị", icon: Database },
  { id: "progress", label: "Tiến độ", icon: CheckCircle2 }
];

function Pill({ children, tone = "green" }: { children: React.ReactNode; tone?: Tone }) {
  const tones: Record<Tone, string> = {
    green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    yellow: "bg-amber-50 text-amber-800 ring-amber-200",
    blue: "bg-sky-50 text-sky-800 ring-sky-200",
    gray: "bg-slate-100 text-slate-700 ring-slate-200"
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}>{children}</span>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-md border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange?: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange?.(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function SectionTitle({ eyebrow, title, note, action }: { eyebrow: string; title: string; note?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-semibold text-hospital-700">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950 md:text-3xl">{title}</h2>
        {note ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{note}</p> : null}
      </div>
      {action}
    </div>
  );
}

function ActionButton({ children, allowed, icon: Icon, onClick }: { children: React.ReactNode; allowed: boolean; icon: ComponentType<{ className?: string }>; onClick?: () => void }) {
  if (!allowed) return null;
  return (
    <button onClick={onClick} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-hospital-800 px-4 text-sm font-semibold text-white">
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function ratio(value: number, max: number) {
  return max ? Math.round((value / max) * 100) : 0;
}

function scoreTone(score: number) {
  if (score >= 90) return "text-hospital-800";
  if (score >= 80) return "text-sky-700";
  if (score >= 65) return "text-amber-700";
  return "text-red-700";
}

export default function Home() {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>("Phòng KHTH");
  const [selectedTemplateId, setSelectedTemplateId] = useState(sampleFormTemplate?.id ?? formTemplates[0]?.id ?? "");
  const [selectedMonth, setSelectedMonth] = useState("Tháng 5/2026");
  const [selectedTeam, setSelectedTeam] = useState("Tất cả đoàn");
  const [reportScope, setReportScope] = useState("Phiếu chi tiết từng khoa/phòng");
  const [reportLink, setReportLink] = useState<string | null>(reports[1]?.downloadURL ?? null);
  const [chartsReady, setChartsReady] = useState(false);

  const role = currentUser?.role;
  const selectedTemplate = formTemplates.find((item) => item.id === selectedTemplateId) ?? sampleFormTemplate;
  const criteriaSource = formCriteriaItems.filter((item) => item.formTemplateId === selectedTemplate?.id);
  const criteriaPreview = (criteriaSource.length ? criteriaSource : sampleFormCriteriaItems).slice(0, 8);
  const canWriteScore = canScore(role);

  const summary = useMemo(() => {
    const total = dashboardDepartments.length || 1;
    const average = Math.round(dashboardDepartments.reduce((sum, item) => sum + item.score, 0) / total);
    return {
      checked: dashboardDepartments.length,
      average,
      highRisk: auditScores.filter((score) => score.riskLevel === "nguy cơ cao").length,
      overdue: auditScores.filter((score) => score.capaStatus === "Quá hạn").length,
      good: dashboardDepartments.filter((item) => item.score >= 90).length,
      passed: dashboardDepartments.filter((item) => item.score >= 80 && item.score < 90).length,
      improve: dashboardDepartments.filter((item) => item.score >= 65 && item.score < 80).length,
      failed: dashboardDepartments.filter((item) => item.score < 65).length
    };
  }, []);

  const formChoices = formTemplates.slice(0, 30).map((item) => `${item.departmentName} - ${item.inspectionTeam} - ${item.sourceSheet}`);
  const selectedChoice = selectedTemplate ? `${selectedTemplate.departmentName} - ${selectedTemplate.inspectionTeam} - ${selectedTemplate.sourceSheet}` : formChoices[0];
  const classification = classifyScore(ratio(formScoreSummary.totalScore, formScoreSummary.maxScore), formScoreSummary.highRiskCount > 0);

  useEffect(() => {
    setChartsReady(true);
    const hashView = window.location.hash.replace("#", "") as View;
    if (["dashboard", "scoring", "sessions", "reports", "capa", "guide", "admin", "progress", "login"].includes(hashView)) setActiveView(hashView);
  }, []);

  function goToView(view: View) {
    setActiveView(view);
    window.history.replaceState(null, "", `#${view}`);
  }

  function demoLogin() {
    setCurrentUser(users.find((item) => item.role === selectedRole) ?? users[0]);
  }

  function exportPrototypeReport() {
    const workbook = XLSX.utils.book_new();
    const form = selectedTemplate as FormTemplate;
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
        "Mức độ nguy cơ": inspectionScores[index]?.riskLevel ?? "Không"
      };
    });
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ "Tên phiếu": form?.name, "Đơn vị": form?.departmentName, "Sheet nguồn": form?.sourceSheet }, { "Tổng điểm": formScoreSummary.totalScore, "Xếp loại": classification }]), "PHIEU_CHI_TIET");
    XLSX.utils.sheet_add_json(workbook.Sheets.PHIEU_CHI_TIET, detailRows, { origin: "A5" });
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(dashboardDepartments), "TONG_HOP_DIEM");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detailRows.filter((item) => Number(item["Điểm đạt"]) < Number(item["Điểm tối đa"]))), "CHI_TIET_LOI");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detailRows.filter((item) => item["Mức độ nguy cơ"] === "Cao" || item["Mức độ nguy cơ"] === "Nghiêm trọng")), "LOI_NGUY_CO_CAO");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detailRows.filter((item) => item["Yêu cầu khắc phục"])), "CAPA");
    XLSX.writeFile(workbook, "bao-cao-theo-phieu-nguon-prototype.xlsx");
    setReportLink("bao-cao-theo-phieu-nguon-prototype.xlsx");
  }

  const Metric = ({ label, value }: { label: string; value: number }) => (
    <Card>
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${label === "Điểm trung bình" ? scoreTone(value) : "text-hospital-900"}`}>{value}</p>
    </Card>
  );

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
              <button onClick={() => setCurrentUser(null)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700"><LogOut className="h-4 w-4" />Đăng xuất</button>
            </div>
          ) : (
            <button onClick={() => goToView("login")} className="hidden min-h-10 items-center gap-2 rounded-md bg-hospital-800 px-3 text-sm font-semibold text-white md:inline-flex"><LogIn className="h-4 w-4" />Đăng nhập để thao tác</button>
          )}
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">
          {views.map((item) => (
            <button key={item.id} onClick={() => goToView(item.id)} aria-pressed={activeView === item.id} className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${activeView === item.id ? "border-hospital-800 bg-hospital-800 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:bg-hospital-50"}`}>
              <item.icon className={`h-4 w-4 ${activeView === item.id ? "text-white" : "text-hospital-700"}`} />
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="border-b border-hospital-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h2 className="max-w-3xl text-2xl font-bold leading-tight text-slate-950 md:text-4xl">Dashboard công khai, thao tác nghiệp vụ theo phân quyền</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">Ai có link đều xem được. Chấm điểm, sửa điểm, cập nhật CAPA, import Excel, chốt kỳ và xuất báo cáo cần đăng nhập đúng quyền.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-2">
            {[["Sheet phiếu nguồn", formTemplates.length], ["Dòng tiêu chí", formCriteriaItems.length], ["Khoa/phòng", new Set(formTemplates.map((item) => item.departmentName)).size], ["Lịch thứ Tư", auditSchedule.length]].map(([label, value]) => (
              <Card key={label} className="bg-hospital-50 p-3"><p className="text-2xl font-bold text-hospital-900">{value}</p><p className="text-xs font-semibold text-hospital-800">{label}</p></Card>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {activeView === "dashboard" && (
          <section>
            <SectionTitle eyebrow="Dashboard công khai" title="Tổng quan kiểm tra hoạt động bệnh viện" note="Không yêu cầu đăng nhập để xem dashboard, lịch kiểm tra, kết quả công khai, CAPA, bảng kiểm và báo cáo đã xuất." />
            <div className="mb-4 grid gap-3 md:grid-cols-4">
              <SelectField label="Thời gian" value={selectedMonth} options={["Tháng 5/2026", "Quý II/2026", "Năm 2026"]} onChange={setSelectedMonth} />
              <SelectField label="Đoàn kiểm tra" value={selectedTeam} options={["Tất cả đoàn", "Đoàn 01", "Đoàn 02"]} onChange={setSelectedTeam} />
              <SelectField label="Khối" value="Tất cả khối" options={["Tất cả khối", "Lâm sàng", "Cận lâm sàng", "Hành chính"]} />
              <SelectField label="Nguy cơ" value="Tất cả mức độ" options={["Tất cả mức độ", "Không", "Thấp", "Trung bình", "Cao", "Nghiêm trọng"]} />
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <Metric label="Phiên/khoa đã kiểm tra" value={summary.checked} />
              <Metric label="Điểm trung bình" value={summary.average} />
              <Metric label="Lỗi nguy cơ cao" value={summary.highRisk} />
              <Metric label="CAPA quá hạn" value={summary.overdue} />
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <Card><h3 className="mb-3 font-bold text-slate-950">Điểm theo khoa/phòng</h3><div className="h-72">{chartsReady && <ResponsiveContainer width="100%" height="100%"><BarChart data={dashboardDepartments}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="score" name="Điểm" radius={[4, 4, 0, 0]}>{dashboardDepartments.map((item) => <Cell key={item.name} fill={item.score < 80 ? "#dc2626" : "#089654"} />)}</Bar></BarChart></ResponsiveContainer>}</div></Card>
              <Card><h3 className="mb-3 font-bold text-slate-950">Xếp loại và xu hướng</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"><div className="h-44">{chartsReady && <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ name: "Đạt tốt", value: summary.good, fill: "#089654" }, { name: "Đạt", value: summary.passed, fill: "#0ea5e9" }, { name: "Cần cải tiến", value: summary.improve, fill: "#f59e0b" }, { name: "Không đạt", value: summary.failed, fill: "#dc2626" }]} dataKey="value" nameKey="name" outerRadius={68} label /><Tooltip /></PieChart></ResponsiveContainer>}</div><div className="h-44">{chartsReady && <ResponsiveContainer width="100%" height="100%"><LineChart data={monthlyTrend}><XAxis dataKey="month" /><YAxis /><Tooltip /><Line type="monotone" dataKey="average" name="Điểm TB" stroke="#087845" strokeWidth={3} /><Line type="monotone" dataKey="highRisk" name="Nguy cơ cao" stroke="#dc2626" strokeWidth={3} /></LineChart></ResponsiveContainer>}</div></div></Card>
            </div>
            <Card className="mt-5 border-red-100"><div className="mb-3 flex items-center gap-2 text-red-700"><AlertTriangle className="h-5 w-5" /><h3 className="font-bold">Cảnh báo nguy cơ cao</h3></div><div className="grid gap-3 md:grid-cols-3">{auditScores.filter((score) => score.riskLevel !== "bình thường").slice(0, 3).map((score) => <article key={score.id} className="rounded-md bg-red-50 p-3"><Pill tone={score.riskLevel === "nguy cơ cao" ? "red" : "yellow"}>{score.riskLevel}</Pill><h4 className="mt-2 font-bold text-slate-950">{score.departmentName}</h4><p className="mt-1 text-sm leading-6 text-slate-700">{score.criteriaContent}</p></article>)}</div></Card>
          </section>
        )}

        {activeView === "login" && (
          <section>
            <SectionTitle eyebrow="Đăng nhập thao tác" title="Đăng nhập chỉ dùng cho người cần thay đổi dữ liệu" />
            <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
              <Card><Image src="/logo-bv-san-nhi-ca-mau.jpg" alt="Logo bệnh viện" width={72} height={72} className="h-16 w-16 rounded-md object-cover" /><div className="mt-4 space-y-3"><SelectField label="Vai trò demo" value={selectedRole} options={roles} onChange={(value) => setSelectedRole(value as Role)} /><input className="min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm" value={users.find((item) => item.role === selectedRole)?.username ?? "admin"} readOnly /><input className="min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm" value="••••••••" readOnly /><button onClick={demoLogin} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-hospital-800 px-4 text-sm font-semibold text-white"><LogIn className="h-4 w-4" />Đăng nhập demo</button></div></Card>
              <Card><h3 className="font-bold text-slate-950">Quyền thao tác</h3><div className="mt-3 grid gap-2 md:grid-cols-2">{["Chấm/sửa điểm", "Cập nhật CAPA", "Chốt/mở khóa kỳ", "Import Excel", "Xuất báo cáo", "Quản trị danh mục"].map((item) => <div key={item} className="rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-700">{item}</div>)}</div><p className="mt-4 text-sm leading-6 text-slate-600">Người không đăng nhập vẫn xem được dữ liệu công khai. Các thao tác ghi sẽ kiểm tra quyền ở backend/API.</p></Card>
            </div>
          </section>
        )}

        {activeView === "scoring" && (
          <section>
            <SectionTitle eyebrow="Chấm điểm mobile-first" title="Phiếu chấm bám theo sheet kiểm tra/chấm điểm nguồn" note="Giữ đầu phiếu, nhóm tiêu chí và các cột nghiệp vụ chính; ô nhập chỉ mở khi có quyền." action={<ActionButton allowed={canWriteScore} icon={ClipboardCheck}>Lưu nháp</ActionButton>} />
            {!canWriteScore && <Card className="mb-4 bg-slate-50">Bạn đang xem chế độ công khai. Muốn chấm/sửa/lưu phiếu cần đăng nhập tài khoản có quyền. <button onClick={() => goToView("login")} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md bg-hospital-800 px-4 text-sm font-semibold text-white md:ml-3 md:mt-0"><LogIn className="h-4 w-4" />Đăng nhập để chấm điểm</button></Card>}
            <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <Card><div className="grid gap-3"><SelectField label="Phiếu nguồn" value={selectedChoice} options={formChoices} onChange={(value) => { const template = formTemplates.find((item) => `${item.departmentName} - ${item.inspectionTeam} - ${item.sourceSheet}` === value); if (template) setSelectedTemplateId(template.id); }} /><div className="grid grid-cols-2 gap-2 text-sm"><div><span className="font-semibold">Đơn vị:</span> {selectedTemplate?.departmentName}</div><div><span className="font-semibold">Đoàn:</span> {selectedTemplate?.inspectionTeam}</div><div><span className="font-semibold">Sheet:</span> {selectedTemplate?.sourceSheet}</div><div><span className="font-semibold">Tổng điểm:</span> {formScoreSummary.totalScore}/{formScoreSummary.maxScore}</div></div><div className="rounded-md bg-hospital-50 p-3"><p className="text-sm font-semibold text-hospital-900">Tiến độ: {formScoreSummary.scoredCount}/{formScoreSummary.totalCriteria} nội dung</p><div className="mt-2 h-2 rounded-full bg-white"><div className="h-2 rounded-full bg-hospital-700" style={{ width: `${ratio(formScoreSummary.scoredCount, formScoreSummary.totalCriteria)}%` }} /></div></div><Pill tone={formScoreSummary.highRiskCount ? "red" : "green"}>{classification}</Pill></div></Card>
              <div className="space-y-3">{criteriaPreview.map((item, index) => { const score = inspectionScores[index]; const hasFinding = score && score.score < score.maxScore; return <Card key={item.id}><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><Pill tone={item.isHighRiskRelated ? "red" : "gray"}>STT {item.order}</Pill><Pill tone="blue">{item.groupCode}</Pill></div><h3 className="mt-2 font-bold text-slate-950">{item.groupName}</h3></div><span className="rounded-md bg-slate-100 px-2 py-1 text-sm font-bold">{item.maxScore} điểm</span></div><p className="mt-2 text-sm leading-6 text-slate-700">{item.content}</p><details className="mt-2 rounded-md bg-slate-50 p-2"><summary className="cursor-pointer text-sm font-semibold">Minh chứng cần xem</summary><p className="mt-2 text-sm text-slate-600">{item.evidenceRequired || "Theo sheet nguồn."}</p></details><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-xs font-semibold text-slate-500">Điểm đạt<input disabled={!canWriteScore} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm font-semibold disabled:bg-slate-100" defaultValue={score?.score ?? item.maxScore} /></label><SelectField label="Nguy cơ" value={score?.riskLevel ?? "Không"} options={["Không", "Thấp", "Trung bình", "Cao", "Nghiêm trọng"]} /></div>{(hasFinding || index === 0) && <details className="mt-3 rounded-md border border-slate-200 p-2" open={Boolean(hasFinding)}><summary className="cursor-pointer text-sm font-semibold">Phát hiện và khắc phục</summary><textarea disabled={!canWriteScore} className="mt-2 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" defaultValue={score?.finding ?? ""} placeholder="Phát hiện/tồn tại hoặc lý do trừ điểm" /><textarea disabled={!canWriteScore} className="mt-2 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" defaultValue={score?.correctionRequest ?? ""} placeholder="Yêu cầu khắc phục" /><div className="mt-2 grid grid-cols-2 gap-2"><input disabled={!canWriteScore} type="date" className="min-h-11 rounded-md border border-slate-300 px-3 text-sm disabled:bg-slate-100" defaultValue={score?.dueDate} /><SelectField label="CAPA" value={score?.capaStatus ?? "Không áp dụng"} options={["Chưa thực hiện", "Đang thực hiện", "Đã hoàn thành", "Quá hạn", "Không áp dụng"]} /></div></details>}</Card>; })}<div className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50 pt-3"><ActionButton allowed={canWriteScore} icon={ClipboardCheck}>Lưu nháp</ActionButton><ActionButton allowed={canWriteScore} icon={CheckCircle2}>Hoàn tất phiếu</ActionButton></div></div>
            </div>
          </section>
        )}

        {activeView === "sessions" && (
          <section><SectionTitle eyebrow="Lịch kiểm tra" title="Phiên kiểm tra và phân công theo đoàn" action={<ActionButton allowed={canManageData(role)} icon={Pencil}>Điều chỉnh lịch</ActionButton>} /><div className="grid gap-4 lg:grid-cols-2">{auditTeams.map((team) => <Card key={team.id}><Pill tone="blue">{team.name}</Pill><dl className="mt-3 grid gap-2 text-sm text-slate-700"><div><span className="font-semibold text-slate-950">Trưởng đoàn:</span> {team.leader}</div><div><span className="font-semibold text-slate-950">Phó trưởng đoàn:</span> {team.deputy}</div><div><span className="font-semibold text-slate-950">Thư ký:</span> {team.secretary}</div></dl></Card>)}</div><div className="mt-4 overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-hospital-900 text-white"><tr><th className="px-3 py-3">Ngày</th><th>Đoàn 01 - lâm sàng</th><th>Đoàn 01 - HC/CLS</th><th>Đoàn 02 - lâm sàng</th><th>Đoàn 02 - HC/CLS</th></tr></thead><tbody>{auditSchedule.slice(0, 10).map((row) => <tr key={row.id} className="border-t border-slate-100"><td className="px-3 py-3 font-semibold">{row.auditDate}</td><td>{row.team1ClinicalDepartments.join(", ")}</td><td>{row.team1SupportDepartment}</td><td>{row.team2ClinicalDepartments.join(", ")}</td><td>{row.team2SupportDepartment}</td></tr>)}</tbody></table></div></section>
        )}

        {activeView === "reports" && (
          <section><SectionTitle eyebrow="Báo cáo Excel" title="Xuất báo cáo bám theo phiếu nguồn" note="Mẫu mặc định dùng chính nội dung sheet phiếu hiện có: phiếu chi tiết, tổng hợp điểm, lỗi/điểm trừ, nguy cơ cao và CAPA." action={<ActionButton allowed={canExportReport(role)} icon={Download} onClick={exportPrototypeReport}>Xuất Excel mẫu</ActionButton>} /><div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><Card><SelectField label="Phạm vi báo cáo" value={reportScope} options={["Phiếu chi tiết từng khoa/phòng", "Theo đoàn", "Theo ngày kiểm tra", "Theo khối", "Toàn viện", "Danh sách CAPA", "Lỗi nguy cơ cao"]} onChange={setReportScope} /><div className="mt-3 space-y-3">{reports.map((report) => <div key={report.id} className="rounded-md border border-slate-200 p-3"><div className="flex items-center justify-between gap-3"><p className="font-bold">Báo cáo tháng {report.month}/{report.year}</p><Pill tone={report.status === "đã xuất Excel" ? "green" : "yellow"}>{report.status}</Pill></div><p className="mt-1 text-sm text-slate-600">{report.checkedDepartments} khoa/phòng, {report.highRiskCount} lỗi nguy cơ cao</p></div>)}{reportLink && <p className="rounded-md bg-hospital-50 p-3 text-sm font-semibold text-hospital-900">File mẫu: {reportLink}</p>}</div></Card><Card><h3 className="font-bold text-slate-950">Sheet xuất tối thiểu</h3><div className="mt-3 grid gap-2 md:grid-cols-2">{["PHIEU_CHI_TIET", "TONG_HOP_DIEM", "CHI_TIET_LOI", "LOI_NGUY_CO_CAO", "CAPA"].map((sheet) => <div key={sheet} className="flex items-center gap-2 rounded-md border border-slate-200 p-3 text-sm font-semibold"><FileSpreadsheet className="h-4 w-4 text-hospital-700" />{sheet}</div>)}</div></Card></div></section>
        )}

        {activeView === "capa" && (
          <section><SectionTitle eyebrow="CAPA" title="Theo dõi khắc phục công khai, cập nhật theo quyền" action={<ActionButton allowed={canUpdateCapa(role)} icon={Pencil}>Cập nhật CAPA</ActionButton>} /><div className="mb-4 grid gap-3 md:grid-cols-4"><div className="relative md:col-span-2"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input className="min-h-11 w-full rounded-md border border-slate-300 pl-10 pr-3 text-sm" placeholder="Tìm khoa/phòng, phát hiện, yêu cầu khắc phục" /></div><SelectField label="Trạng thái" value="Tất cả CAPA" options={["Tất cả CAPA", "Chưa thực hiện", "Đang thực hiện", "Đã hoàn thành", "Quá hạn", "Không áp dụng"]} /><SelectField label="Mức độ" value="Tất cả mức độ" options={["Tất cả mức độ", "Không", "Thấp", "Trung bình", "Cao", "Nghiêm trọng"]} /></div><div className="grid gap-3 md:grid-cols-3">{inspectionScores.filter((score) => score.capaStatus !== "Không áp dụng").map((score) => <Card key={score.id}><div className="flex flex-wrap gap-2"><Pill tone={score.riskLevel === "Cao" || score.riskLevel === "Nghiêm trọng" ? "red" : "yellow"}>{score.riskLevel}</Pill><Pill tone={score.capaStatus === "Quá hạn" ? "red" : "blue"}>{score.capaStatus}</Pill></div><h3 className="mt-3 font-bold text-slate-950">{selectedTemplate?.departmentName}</h3><p className="mt-2 text-sm leading-6 text-slate-700">{score.finding}</p><p className="mt-2 text-sm font-semibold text-slate-900">{score.correctionRequest}</p><p className="mt-2 text-sm text-slate-600">Phụ trách: {score.responsiblePerson || score.responsibleDepartment} · hạn {score.dueDate}</p></Card>)}</div></section>
        )}

        {activeView === "guide" && (
          <section><SectionTitle eyebrow="Hướng dẫn" title="Hướng dẫn thao tác ngắn gọn cho người chấm" /><div className="grid gap-3 md:grid-cols-3">{[["1. Chọn phiên", "Chọn kỳ kiểm tra, ngày kiểm tra, khoa/phòng và sheet phiếu tương ứng."], ["2. Nhập điểm", "Điểm thấp hơn tối đa phải ghi rõ phát hiện hoặc lý do trừ điểm."], ["3. Ghi CAPA", "Nếu có lỗi, nhập yêu cầu khắc phục, thời hạn, người/bộ phận chịu trách nhiệm."], ["4. Nguy cơ cao", "Chọn Cao/Nghiêm trọng khi ảnh hưởng an toàn người bệnh hoặc an toàn bệnh viện."], ["5. Lưu nháp", "Dùng khi chưa hoàn tất kiểm tra thực tế hoặc cần bổ sung minh chứng."], ["6. Hoàn tất", "Chỉ gửi hoàn tất khi không còn tiêu chí bắt buộc bỏ trống."]].map(([title, text]) => <Card key={title}><h3 className="font-bold text-hospital-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-700">{text}</p></Card>)}</div></section>
        )}

        {activeView === "admin" && (
          <section><SectionTitle eyebrow="Quản trị dữ liệu" title="Import Excel, danh mục và cấu hình nghiệp vụ" note="Khoa/phòng, tiêu chí, lịch kiểm tra, phân công và trạng thái CAPA sẽ thao tác trên web, không sửa code." action={<ActionButton allowed={canManageData(role)} icon={Upload}>Import Excel</ActionButton>} /><div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><Card><SelectField label="Danh mục" value={adminModules[0]} options={adminModules} /><p className="mt-4 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">{canManageData(role) ? "Tài khoản hiện tại được thêm/sửa/khóa/mở khóa danh mục." : "Bạn đang xem danh mục công khai. Muốn chỉnh sửa cần đăng nhập Admin hoặc Phòng KHTH."}</p><div className="mt-3 flex flex-wrap gap-2"><ActionButton allowed={canManageData(role)} icon={Pencil}>Sửa danh mục</ActionButton><ActionButton allowed={canImportExcel(role)} icon={Upload}>Import 4 file Excel</ActionButton></div></Card><Card><h3 className="font-bold text-slate-950">Dữ liệu nguồn đã dùng</h3><div className="mt-3 grid gap-3 md:grid-cols-2">{dataProvenance.map((item) => <div key={item.area} className="rounded-md border border-slate-200 p-3"><Pill tone={item.status.includes("mẫu") || item.status.includes("Chưa") ? "yellow" : "green"}>{item.status}</Pill><p className="mt-2 text-sm font-bold text-slate-950">{item.area}</p><p className="mt-1 text-xs leading-5 text-slate-600">{item.source}</p></div>)}</div><details className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-sm font-semibold">Cấu trúc workbook đã phân tích</summary><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-100"><tr><th className="px-3 py-2">File</th><th>Loại</th><th>Số sheet</th><th>Sheet phiếu</th></tr></thead><tbody>{workbookSummary.map((item) => <tr key={item.file} className="border-t border-slate-100"><td className="px-3 py-2 font-semibold">{item.file}</td><td>{item.formType}</td><td>{item.sheetCount}</td><td>{item.formCount}</td></tr>)}</tbody></table></div></details><details className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-sm font-semibold">Tệp nguồn</summary><div className="mt-3 grid gap-2 md:grid-cols-2">{sourceFiles.map((file) => <div key={`${file.type}-${file.name}`} className="rounded-md bg-white p-3 text-sm"><p className="text-xs font-semibold text-hospital-700">{file.type}</p><p className="mt-1 font-semibold text-slate-800">{file.name}</p></div>)}</div></details></Card></div></section>
        )}

        {activeView === "progress" && (
          <section><SectionTitle eyebrow="Tiến độ hoàn thành" title="Theo dõi phần đã làm và phần còn lại" /><div className="grid gap-3 md:grid-cols-2">{implementationProgress.map((item) => <Card key={item.group}><div className="flex items-center justify-between gap-3"><h3 className="font-bold text-slate-950">{item.group}</h3><Pill tone={item.percent >= 80 ? "green" : item.percent >= 60 ? "yellow" : "blue"}>{item.percent}%</Pill></div><p className="mt-2 text-sm leading-6 text-slate-600">{item.status}</p><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-hospital-700" style={{ width: `${item.percent}%` }} /></div></Card>)}</div></section>
        )}
      </div>

      <footer className="mt-8 bg-white">
        <div className="relative overflow-hidden border-t border-hospital-100">
          <Image src="/banner-bv-san-nhi-ca-mau.jpg" alt="Niềm tin của mẹ - Sức khỏe của bé" width={884} height={112} className="h-24 w-full object-cover md:h-28" />
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
