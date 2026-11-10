import { coverageForCourse } from "../../../utils/kg-practice";
import { requireTeacher } from "../../../utils/kg-tagging";

export default defineEventHandler(async (event) => {
  await requireTeacher(event);
  const courseId = String(getQuery(event).courseId || "");
  if (!courseId) throw createError({ statusCode: 400, statusMessage: "Missing course id" });
  return { concepts: await coverageForCourse(courseId) };
});
