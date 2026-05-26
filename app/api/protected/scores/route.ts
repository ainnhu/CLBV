import { NextResponse } from "next/server";
import { demoUserFromRequest } from "@/lib/api-auth";
import { assertCanWrite } from "../../../../services/access-control";
import { saveInspectionScore } from "../../../../services/repositories/scores-repository";

type ScorePayload = {
  formCriteriaItemId?: string;
  score?: number;
  maxScore?: number;
  deductionReason?: string;
  finding?: string;
  riskLevel?: string;
  correctionRequest?: string;
  dueDate?: string;
  responsiblePerson?: string;
};

export async function POST(request: Request) {
  try {
    const user = demoUserFromRequest(request);
    assertCanWrite(user, "score:update");
    const payload = (await request.json()) as ScorePayload;

    if (!payload.formCriteriaItemId) {
      return NextResponse.json({ error: "Thiếu mã tiêu chí cần chấm." }, { status: 400 });
    }

    if (!Number.isFinite(Number(payload.score)) || !Number.isFinite(Number(payload.maxScore))) {
      return NextResponse.json({ error: "Điểm đạt phải từ 0 đến điểm tối đa." }, { status: 422 });
    }

    const result = await saveInspectionScore(user, {
      formCriteriaItemId: payload.formCriteriaItemId,
      score: Number(payload.score),
      maxScore: Number(payload.maxScore),
      deductionReason: payload.deductionReason,
      finding: payload.finding,
      riskLevel: payload.riskLevel,
      correctionRequest: payload.correctionRequest,
      dueDate: payload.dueDate,
      responsiblePerson: payload.responsiblePerson
    });

    return NextResponse.json({
      status: "accepted",
      mode: result.mode,
      message: "Dữ liệu chấm điểm hợp lệ.",
      savedPreview: result.saved,
      auditLog: result.auditLog
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không có quyền thao tác.";
    return NextResponse.json({ error: message }, { status: message.includes("403") ? 403 : 500 });
  }
}
