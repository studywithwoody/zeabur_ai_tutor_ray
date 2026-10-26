import type { H3Event } from "h3";

const KG_ROLES = new Set(["student", "teacher", "admin"]);

export async function requireKgReader(event: H3Event) {
  const session = await requireAuthSession(event);
  const role = session.user.role || "";
  if (!KG_ROLES.has(role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }
  return session;
}
