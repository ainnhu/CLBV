import { readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { readdirSync, statSync } from "node:fs";

const root = process.cwd();
const protectedRoot = resolve(root, "app", "api", "protected");
const publicRoot = resolve(root, "app", "api", "public");

const protectedRoutes = listRouteFiles(protectedRoot);
const publicRoutes = listRouteFiles(publicRoot);
const checks = [];

for (const filePath of protectedRoutes) {
  const content = readFileSync(filePath, "utf8");
  const label = relative(root, filePath).replace(/\\/g, "/");
  const userIndex = content.indexOf("userFromRequest(request)");
  const assertIndex = firstIndex(content, [
    "assertCanWrite(",
    "assertCanScoreCriteria("
  ]);
  const bodyIndex = firstIndex(content, [
    "readJsonBody(request)",
    "readOptionalJsonBody(request)",
    "request.formData()"
  ]);

  checks.push({
    name: `${label} imports userFromRequest`,
    pass: /import\s+\{\s*userFromRequest\s*\}/.test(content) || content.includes("userFromRequest")
  });
  checks.push({
    name: `${label} resolves user before protected work`,
    pass: userIndex >= 0
  });

  if (!label.includes("/system/health/")) {
    checks.push({
      name: `${label} checks write permission`,
      pass: assertIndex >= 0
    });
    checks.push({
      name: `${label} checks permission before reading body or file`,
      pass: bodyIndex < 0 || (assertIndex >= 0 && assertIndex < bodyIndex)
    });
  }

  checks.push({
    name: `${label} returns 403 on forbidden errors`,
    pass: /message\.includes\("403"\)\s*\?\s*403/.test(content) || /status:\s*403/.test(content)
  });
}

for (const filePath of publicRoutes) {
  const content = readFileSync(filePath, "utf8");
  const label = relative(root, filePath).replace(/\\/g, "/");
  checks.push({
    name: `${label} does not require protected user resolution`,
    pass: !content.includes("userFromRequest")
  });
  checks.push({
    name: `${label} does not enforce write permission`,
    pass: !content.includes("assertCanWrite") && !content.includes("assertCanScoreCriteria")
  });
}

checks.push({
  name: "all expected protected routes are covered",
  pass: [
    "app/api/protected/assignments/route.ts",
    "app/api/protected/attachments/route.ts",
    "app/api/protected/capa/route.ts",
    "app/api/protected/capa/evidence/route.ts",
    "app/api/protected/catalog/route.ts",
    "app/api/protected/import/route.ts",
    "app/api/protected/import/commit/route.ts",
    "app/api/protected/periods/route.ts",
    "app/api/protected/reports/export/route.ts",
    "app/api/protected/scores/route.ts",
    "app/api/protected/sessions/route.ts",
    "app/api/protected/system/health/route.ts"
  ].every((expected) => protectedRoutes.some((route) => relative(root, route).replace(/\\/g, "/") === expected))
});

let failed = 0;
console.log(`API contract check: ${root}`);

for (const check of checks) {
  if (check.pass) {
    console.log(`PASS ${check.name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${check.name}`);
  }
}

if (failed > 0) {
  console.error(`API contract check failed: ${failed}/${checks.length}`);
  process.exit(1);
}

console.log(`API contract check passed: ${checks.length}/${checks.length}`);

function listRouteFiles(directory) {
  return walk(directory).filter((filePath) => filePath.endsWith(`${join("", "route.ts")}`));
}

function walk(directory) {
  const entries = readdirSync(directory);
  const files = [];

  for (const entry of entries) {
    const filePath = join(directory, entry);
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      files.push(...walk(filePath));
    } else {
      files.push(filePath);
    }
  }

  return files;
}

function firstIndex(content, needles) {
  const indexes = needles.map((needle) => content.indexOf(needle)).filter((index) => index >= 0);
  return indexes.length > 0 ? Math.min(...indexes) : -1;
}
