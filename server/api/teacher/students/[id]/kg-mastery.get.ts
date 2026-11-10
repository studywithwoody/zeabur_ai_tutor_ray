import { assertTeacherCanViewStudent, masteryForStudent } from "../../../../utils/kg-practice";
import { requireTeacher } from "../../../../utils/kg-tagging";

export default defineEventHandler(async (event) => {
  const session = await requireTeacher(event);
  const studentId = getRouterParam(event, "id");
  const courseId = String(getQuery(event).courseId || "");
  if (!studentId || !courseId) {
    throw createError({ statusCode: 400, statusMessage: "Missing student or course" });
  }
  await assertTeacherCanViewStudent(session.user.id, studentId, session.user.role);
  const concepts = await masteryForStudent(courseId, studentId, "student");
  return { concepts };
});