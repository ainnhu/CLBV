import { NextResponse } from "next/server";
import { getFormTemplateWithCriteria, listFormTemplates } from "../../../../services/repositories/forms-repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get("templateId");

  if (templateId) {
    const result = await getFormTemplateWithCriteria(templateId);
    return NextResponse.json({
      visibility: "public",
      mode: result.mode,
      rule: "Public/anonymous được đọc phiếu, tiêu chí và dữ liệu đã công khai.",
      templates: result.template ? [result.template] : [],
      criteria: result.criteria
    });
  }

  const result = await listFormTemplates();

  return NextResponse.json({
    visibility: "public",
    mode: result.mode,
    rule: "Public/anonymous được đọc phiếu, tiêu chí và dữ liệu đã công khai.",
    templates: result.templates,
    criteria: []
  });
}
