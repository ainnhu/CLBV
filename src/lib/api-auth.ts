import type { Role } from "./types";

export function getDemoRole(request: Request): Role | null {
  const role = request.headers.get("x-demo-role")?.trim();
  if (!role) return null;
  return role as Role;
}

export function demoUserFromRequest(request: Request) {
  const role = getDemoRole(request);
  if (!role) return null;
  return {
    id: `demo-${role.toLowerCase().replace(/\s+/g, "-")}`,
    role,
    assignedCriteriaItemIds: request.headers
      .get("x-demo-assigned-criteria")
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  };
}
