const baseUrl = (process.argv[2] || process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const jsonHeaders = { "content-type": "application/json" };

const checks = [
  ...[
    "/api/public/dashboard",
    "/api/public/reports",
    "/api/public/capa",
    "/api/public/sessions",
    "/api/public/catalog",
    "/api/public/assignments",
    "/api/public/results",
    "/api/public/history",
    "/api/public/high-risk"
  ].map((path) => ({
    name: `public GET ${path}`,
    run: async () => expectStatus(await fetch(`${baseUrl}${path}`, { cache: "no-store" }), 200)
  })),
  jsonCheck("protected export without login returns 403", "/api/protected/reports/export", {}, {}, 403),
  rawJsonCheck("protected export bad JSON with Admin returns 400", "/api/protected/reports/export", "{\"", adminHeaders(), 400),
  rawJsonCheck("protected import commit bad JSON with Admin returns 400", "/api/protected/import/commit", "{\"", adminHeaders(), 400),
  jsonCheck("protected import commit without login returns 403", "/api/protected/import/commit", buildCommitImportPayload(), {}, 403),
  jsonCheck("protected import commit invalid payload with Admin returns 422", "/api/protected/import/commit", {
    batchId: "batch-smoke",
    fileName: "file.xlsx",
    fileType: "DOAN_1_LS_CLS",
    templates: [],
    criteriaItems: []
  }, adminHeaders(), 422),
  jsonCheck("protected import commit warning without allow returns 422", "/api/protected/import/commit", buildCommitImportPayload({
    warnings: [{ type: "validation", sourceFile: "smoke.xlsx", sourceSheet: "P_KHTH", message: "Canh bao smoke test" }],
    allowWarnings: false
  }), adminHeaders(), 422),
  jsonCheck("protected import commit with Admin returns 200", "/api/protected/import/commit", buildCommitImportPayload(), adminHeaders(), 200),
  {
    name: "protected system health without login returns 403",
    run: async () => expectStatus(await fetch(`${baseUrl}/api/protected/system/health`, { cache: "no-store" }), 403)
  },
  {
    name: "protected system health with Admin returns 200",
    run: async () => {
      const response = await fetch(`${baseUrl}/api/protected/system/health`, {
        headers: adminHeaders(),
        cache: "no-store"
      });
      expectStatus(response, 200);
      const data = await response.json();
      if (!data?.summary || !data?.supabase || !Array.isArray(data?.checks)) {
        throw new Error("System health thieu summary/supabase/checks.");
      }
      if (!data?.storage?.scoreAttachmentBucket || data?.storage?.scoreEvidenceBucket) {
        throw new Error("System health chua dung cau hinh SCORE_ATTACHMENT_BUCKET.");
      }
    }
  },
  {
    name: "protected export with Admin returns xlsx",
    run: async () => {
      const response = await postJson("/api/protected/reports/export", {}, adminHeaders());
      expectStatus(response, 200);
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
        throw new Error(`Sai content-type Excel: ${contentType}`);
      }
    }
  },
  jsonCheck("score save without login returns 403", "/api/protected/scores", buildValidScorePayload(), {}, 403),
  jsonCheck("score save invalid payload with Admin returns 422", "/api/protected/scores", {
    ...buildValidScorePayload(),
    score: 4,
    finding: "",
    deductionReason: ""
  }, adminHeaders(), 422),
  jsonCheck("score save with Admin returns 200", "/api/protected/scores", buildValidScorePayload(), adminHeaders(), 200),
  jsonCheck("CAPA update without login returns 403", "/api/protected/capa", buildValidCapaPayload(), {}, 403),
  jsonCheck("CAPA update invalid payload with CAPA role returns 422", "/api/protected/capa", {
    ...buildValidCapaPayload(),
    updateContent: ""
  }, roleHeaders("CAPA"), 422),
  jsonCheck("CAPA update with CAPA role returns 200", "/api/protected/capa", buildValidCapaPayload(), roleHeaders("CAPA"), 200),
  jsonCheck("period update without login returns 403", "/api/protected/periods", { periodId: "period-2026-05", action: "close" }, {}, 403),
  rawJsonCheck("period update bad JSON with Admin returns 400", "/api/protected/periods", "{\"", adminHeaders(), 400),
  jsonCheck("period update invalid payload with Admin returns 422", "/api/protected/periods", { periodId: "", action: "close" }, adminHeaders(), 422),
  jsonCheck("period unlock without reason with Admin returns 422", "/api/protected/periods", { periodId: "period-2026-05", action: "unlock" }, adminHeaders(), 422),
  jsonCheck("period close with Admin returns 200", "/api/protected/periods", { periodId: "period-2026-05", action: "close" }, adminHeaders(), 200),
  jsonCheck("period unlock with Admin returns 200", "/api/protected/periods", {
    periodId: "period-2026-05",
    action: "unlock",
    reason: "Smoke test mo khoa co ly do"
  }, adminHeaders(), 200),
  {
    name: "score attachment without login returns 403",
    run: async () => expectStatus(await fetch(`${baseUrl}/api/protected/attachments`, { method: "POST" }), 403)
  },
  uploadCheck("score attachment with Admin returns data preview", "/api/protected/attachments", "attachment", "downloadUrl", adminHeaders(), "minh-chung-smoke.png", "minh chung smoke"),
  {
    name: "CAPA evidence without login returns 403",
    run: async () => expectStatus(await fetch(`${baseUrl}/api/protected/capa/evidence`, { method: "POST" }), 403)
  },
  uploadCheck("CAPA evidence with CAPA role returns data preview", "/api/protected/capa/evidence", "evidence", "evidenceUrl", roleHeaders("CAPA"), "capa-smoke.png", "capa smoke"),
  jsonCheck("catalog create without login returns 403", "/api/protected/catalog", { entity: "department", name: "Test", block: "Lam sang" }, {}, 403),
  jsonCheck("catalog invalid payload with Admin returns 422", "/api/protected/catalog", { entity: "department", name: "", block: "Lam sang" }, adminHeaders(), 422),
  jsonCheck("catalog create with Admin returns 200", "/api/protected/catalog", {
    entity: "department",
    name: "Khoa smoke test",
    shortName: "SMOKE",
    block: "Lam sang",
    active: true
  }, adminHeaders(), 200),
  jsonCheck("session create without login returns 403", "/api/protected/sessions", {}, {}, 403),
  rawJsonCheck("session bad JSON with Admin returns 400", "/api/protected/sessions", "{\"", adminHeaders(), 400),
  jsonCheck("session invalid payload with Admin returns 422", "/api/protected/sessions", {
    periodId: "",
    inspectionDate: "2026-05-27",
    formTemplateId: ""
  }, adminHeaders(), 422),
  jsonCheck("session create with Admin returns 200", "/api/protected/sessions", {
    periodId: "period-2026-05",
    inspectionDate: "2026-05-27",
    formTemplateId: "form-template-1805-v03-oan-1-hanh-chinh-p-khth"
  }, adminHeaders(), 200),
  jsonCheck("assignment create without login returns 403", "/api/protected/assignments", {}, {}, 403),
  rawJsonCheck("assignment bad JSON with Admin returns 400", "/api/protected/assignments", "{\"", adminHeaders(), 400),
  jsonCheck("assignment invalid payload with Admin returns 422", "/api/protected/assignments", {
    inspectionSessionId: "s1",
    userId: "u1",
    formCriteriaItemIds: [],
    blockType: "clinical"
  }, adminHeaders(), 422),
  jsonCheck("assignment create with Admin returns 200", "/api/protected/assignments", {
    inspectionSessionId: "s1",
    userId: "u1",
    formCriteriaItemIds: ["form-template-1805-v03-oan-1-hanh-chinh-p-khth-row-01"],
    blockType: "administrative"
  }, adminHeaders(), 200)
];

let failed = 0;
console.log(`Smoke test: ${baseUrl}`);

for (const check of checks) {
  try {
    await check.run();
    console.log(`PASS ${check.name}`);
  } catch (error) {
    failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${check.name}: ${message}`);
  }
}

if (failed > 0) {
  console.error(`Smoke test failed: ${failed}/${checks.length}`);
  process.exit(1);
}

console.log(`Smoke test passed: ${checks.length}/${checks.length}`);

function jsonCheck(name, path, body, headers, expectedStatus) {
  return {
    name,
    run: async () => expectStatus(await postJson(path, body, headers), expectedStatus)
  };
}

function rawJsonCheck(name, path, body, headers, expectedStatus) {
  return {
    name,
    run: async () => {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { ...jsonHeaders, ...headers },
        body
      });
      expectStatus(response, expectedStatus);
    }
  };
}

function uploadCheck(name, path, responseRoot, urlField, headers, fileName, content) {
  return {
    name,
    run: async () => {
      const formData = new FormData();
      formData.set("inspectionScoreId", "score-smoke");
      formData.set("file", new Blob([content], { type: "image/png" }), fileName);
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers,
        body: formData
      });
      expectStatus(response, 200);
      const data = await response.json();
      if (!data?.[responseRoot]?.[urlField]?.startsWith("data:image/png;base64,")) {
        throw new Error(`${name} khong tra data URL hop le.`);
      }
    }
  };
}

function postJson(path, body, headers = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { ...jsonHeaders, ...headers },
    body: JSON.stringify(body)
  });
}

function expectStatus(response, expectedStatus) {
  if (response.status !== expectedStatus) {
    throw new Error(`HTTP ${response.status}, expected ${expectedStatus}`);
  }
}

function adminHeaders() {
  return roleHeaders("Admin");
}

function roleHeaders(role) {
  return { "x-demo-role": role };
}

function buildValidScorePayload() {
  return {
    formCriteriaItemId: "form-template-1805-v03-oan-1-hanh-chinh-p-khth-row-01",
    score: 4,
    maxScore: 5,
    finding: "Phat hien smoke test",
    deductionReason: "Tru diem smoke test",
    evidenceText: "Minh chung dang ghi chu smoke test",
    riskLevel: "Thap",
    correctionRequest: "Khac phuc noi dung smoke test",
    responsibleDepartment: "Ke hoach tong hop",
    responsiblePerson: "Nguoi phu trach smoke test",
    dueDate: "2026-06-30",
    note: "Smoke test"
  };
}

function buildValidCapaPayload() {
  return {
    inspectionScoreId: "score-smoke",
    status: "Dang thuc hien",
    updateContent: "Cap nhat khac phuc smoke test",
    evidenceUrl: "https://clbv.vercel.app/"
  };
}

function buildCommitImportPayload(overrides = {}) {
  return {
    batchId: "batch-smoke",
    fileName: "1805_V03_DOAN_1_HANH_CHINH.xlsx",
    fileType: "DOAN_1_HANH_CHINH",
    templates: [
      {
        sourceFile: "1805_V03_DOAN_1_HANH_CHINH.xlsx",
        sourceSheet: "P_KHTH",
        formType: "HANH_CHINH",
        departmentCode: "P_KHTH",
        departmentName: "Ke hoach tong hop",
        inspectionTeam: "Doan 01",
        totalScore: 100,
        criteriaCount: 1,
        headerFields: [
          {
            key: "department_name",
            label: "Don vi duoc kiem tra",
            value: "Ke hoach tong hop",
            sourceCell: "B4",
            orderIndex: 1
          }
        ]
      }
    ],
    criteriaItems: [
      {
        sourceFile: "1805_V03_DOAN_1_HANH_CHINH.xlsx",
        sourceSheet: "P_KHTH",
        sourceRow: 7,
        order: 1,
        groupCode: "A",
        groupName: "Quan ly ke hoach",
        content: "Tieu chi smoke test",
        evidenceRequired: "Minh chung smoke test",
        maxScore: 5,
        team1Assignee: "Thanh vien Doan 01",
        team2Assignee: ""
      }
    ],
    warnings: [],
    allowWarnings: true,
    importMode: "upsert_version",
    version: "SMOKE",
    ...overrides
  };
}
