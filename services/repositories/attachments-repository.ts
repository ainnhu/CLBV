import { assertCanWrite, type SessionUser } from "../access-control";
import { createAuditLogEntry, toAuditLogRow } from "../audit-log";
import { getSupabaseMode, supabaseRest } from "../supabase-rest";
import { uploadBufferToSupabaseStorage } from "../supabase-storage";

const maxEvidenceFileSize = 10 * 1024 * 1024;
const allowedEvidenceTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

export async function uploadScoreAttachment({
  user,
  inspectionScoreId,
  file
}: {
  user: SessionUser | null;
  inspectionScoreId: string;
  file: File;
}) {
  assertCanWrite(user, "score:update");
  validateAttachmentInput(inspectionScoreId, file);

  const auditLog = createAuditLogEntry({
    userId: user?.id ?? "anonymous",
    role: user?.role,
    action: "attachment:upload",
    module: "Minh chứng",
    entityType: "score_attachments",
    entityId: inspectionScoreId,
    newValue: {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    }
  });

  if (getSupabaseMode() === "mock") {
    return {
      mode: "mock" as const,
      attachment: {
        inspectionScoreId,
        fileName: file.name,
        fileType: file.type,
        downloadUrl: "mock://evidence-text-or-file-preview",
        note: "Chưa cấu hình Supabase Storage nên chỉ kiểm tra quyền và validate file."
      },
      auditLog
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = sanitizeFileName(file.name);
  const bucket = process.env.SCORE_ATTACHMENT_BUCKET || "score-attachments";
  const path = `${inspectionScoreId}/${Date.now()}-${safeName}`;
  const uploaded = await uploadBufferToSupabaseStorage({
    bucket,
    path,
    buffer,
    contentType: file.type || "application/octet-stream"
  });

  const [attachment] = await supabaseRest.insert<Array<Record<string, unknown>>>("score_attachments", {
    inspection_score_id: inspectionScoreId,
    file_url: uploaded.downloadUrl,
    file_name: file.name,
    file_type: file.type,
    uploaded_by: user?.id
  });
  await supabaseRest.insert("audit_logs", toAuditLogRow(auditLog));

  return {
    mode: "supabase" as const,
    attachment: {
      ...attachment,
      storagePath: uploaded.storagePath,
      downloadUrl: uploaded.downloadUrl
    },
    auditLog
  };
}

export async function uploadCapaEvidence({
  user,
  inspectionScoreId,
  file
}: {
  user: SessionUser | null;
  inspectionScoreId: string;
  file: File;
}) {
  assertCanWrite(user, "capa:update");
  validateAttachmentInput(inspectionScoreId, file);

  const auditLog = createAuditLogEntry({
    userId: user?.id ?? "anonymous",
    role: user?.role,
    action: "capa:evidence_upload",
    module: "CAPA",
    entityType: "capa_updates",
    entityId: inspectionScoreId,
    newValue: {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    }
  });

  if (getSupabaseMode() === "mock") {
    return {
      mode: "mock" as const,
      evidence: {
        inspectionScoreId,
        fileName: file.name,
        fileType: file.type,
        evidenceUrl: "mock://capa-evidence-preview",
        note: "Chưa cấu hình Supabase Storage nên chỉ kiểm tra quyền và validate file."
      },
      auditLog
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = sanitizeFileName(file.name);
  const bucket = process.env.CAPA_EVIDENCE_BUCKET || "capa-evidence";
  const path = `${inspectionScoreId}/${Date.now()}-${safeName}`;
  const uploaded = await uploadBufferToSupabaseStorage({
    bucket,
    path,
    buffer,
    contentType: file.type || "application/octet-stream"
  });

  await supabaseRest.insert("audit_logs", toAuditLogRow(auditLog));

  return {
    mode: "supabase" as const,
    evidence: {
      inspectionScoreId,
      fileName: file.name,
      fileType: file.type,
      storagePath: uploaded.storagePath,
      evidenceUrl: uploaded.downloadUrl
    },
    auditLog
  };
}

function validateAttachmentInput(inspectionScoreId: string, file: File) {
  if (!inspectionScoreId) {
    throw new Error("Thiếu mã điểm chấm để gắn minh chứng.");
  }
  if (!file || !file.name) {
    throw new Error("Chưa chọn file minh chứng.");
  }
  if (file.size > maxEvidenceFileSize) {
    throw new Error("File minh chứng tối đa 10MB.");
  }
  if (file.type && !allowedEvidenceTypes.has(file.type)) {
    throw new Error("Chỉ cho phép ảnh JPG/PNG/WEBP, PDF, Word hoặc Excel.");
  }
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
