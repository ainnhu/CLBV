const baseUrl = (process.argv[2] || process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

const publicPaths = [
  "/api/public/dashboard",
  "/api/public/reports",
  "/api/public/capa",
  "/api/public/sessions",
  "/api/public/catalog",
  "/api/public/assignments",
  "/api/public/results",
  "/api/public/history",
  "/api/public/high-risk"
];

const checks = [];

for (const path of publicPaths) {
  checks.push({
    name: `public GET ${path}`,
    run: async () => {
      const response = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
      expectStatus(response, 200);
    }
  });
}

checks.push(
  {
    name: "protected export without login returns 403",
    run: async () => {
      const response = await fetch(`${baseUrl}/api/protected/reports/export`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}"
      });
      expectStatus(response, 403);
    }
  },
  {
    name: "protected export bad JSON with Admin returns 400",
    run: async () => {
      const response = await fetch(`${baseUrl}/api/protected/reports/export`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-demo-role": "Admin" },
        body: "{\""
      });
      expectStatus(response, 400);
    }
  },
  {
    name: "protected import commit bad JSON with Admin returns 400",
    run: async () => {
      const response = await fetch(`${baseUrl}/api/protected/import/commit`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-demo-role": "Admin" },
        body: "{\""
      });
      expectStatus(response, 400);
    }
  },
  {
    name: "protected export with Admin returns xlsx",
    run: async () => {
      const response = await fetch(`${baseUrl}/api/protected/reports/export`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-demo-role": "Admin" },
        body: "{}"
      });
      expectStatus(response, 200);
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
        throw new Error(`Sai content-type Excel: ${contentType}`);
      }
    }
  },
  {
    name: "score attachment without login returns 403",
    run: async () => {
      const response = await fetch(`${baseUrl}/api/protected/attachments`, { method: "POST" });
      expectStatus(response, 403);
    }
  },
  {
    name: "CAPA evidence without login returns 403",
    run: async () => {
      const response = await fetch(`${baseUrl}/api/protected/capa/evidence`, { method: "POST" });
      expectStatus(response, 403);
    }
  }
);

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

function expectStatus(response, expectedStatus) {
  if (response.status !== expectedStatus) {
    throw new Error(`HTTP ${response.status}, expected ${expectedStatus}`);
  }
}
