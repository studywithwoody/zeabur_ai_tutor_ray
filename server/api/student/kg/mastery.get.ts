import { masteryForStudent } from "../../../utils/kg-practice";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "student" && session.user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }
  const courseId = String(getQuery(event).courseId || "");
  if (!courseId) throw createError({ statusCode: 400, statusMessage: "Missing course id" });
  const concepts = await masteryForStudent(courseId, session.user.id, "student");
  return { concepts };
});
