import { inspectionScores } from "../../src/lib/mock-data";
import { assertCanWrite, type SessionUser } from "../access-control";
import { createAuditLogEntry } from "../audit-log";
import { getSupabaseMode, supabaseRest } from "../supabase-rest";

export type UpdateCapaInput = {
  inspectionScoreId: string;
  status: string;
  updateContent: string;
  evidenceUrl?: string;
};

const allowedStatuses = ["Chưa thực hiện", "Đang thực hiện", "Đã hoàn thành", "Quá hạn", "Không áp dụng"];

export async function updateCapa(user: SessionUser | null, input: UpdateCapaInput) {
  assertCanWrite(user, "capa:update");
  const score = inspectionScores.find((item) => item.id === input.inspectionScoreId);

  if (!allowedStatuses.includes(input.status)) {
    throw new Error("Trạng thái CAPA không hợp lệ.");
  }
  if (!input.updateContent.trim()) {
    throw new Error("Vui lòng nhập nội dung cập nhật khắc phục.");
  }

  const auditLog = createAuditLogEntry({
    userId: user?.id ?? "anonymous",
    role: user?.role,
    action: "capa:update",
    module: "CAPA",
    entityType: "inspection_scores",
    entityId: input.inspectionScoreId,
    oldValue: { capaStatus: score?.capaStatus ?? "" },
    newValue: input
  });

  if (getSupabaseMode() === "supabase") {
    const [saved] = await supabaseRest.insert<Record<string, unknown>[]>("capa_updates", {
      inspection_score_id: input.inspectionScoreId,
      status: mapCapaStatus(input.status),
      update_content: input.updateContent,
      evidence_url: input.evidenceUrl ?? "",
      updated_by: user?.id
    });
    await supabaseRest.insert("audit_logs", auditLog);
    return { mode: "supabase" as const, saved, auditLog };
  }

  return {
    mode: "mock" as const,
    saved: {
      inspectionScoreId: input.inspectionScoreId,
      previousStatus: score?.capaStatus ?? "",
      nextStatus: input.status,
      updateContent: input.updateContent,
      evidenceUrl: input.evidenceUrl ?? ""
    },
    auditLog
  };
}

function mapCapaStatus(status: string) {
  if (status === "Chưa thực hiện") return "chua_thuc_hien";
  if (status === "Đang thực hiện") return "dang_thuc_hien";
  if (status === "Đã hoàn thành") return "da_hoan_thanh";
  if (status === "Quá hạn") return "qua_han";
  return "khong_ap_dung";
}
