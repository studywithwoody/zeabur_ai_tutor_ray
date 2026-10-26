import { findCourseBySubject, listCourseConcepts, requireTeacher } from "../../../utils/kg-tagging";

export default defineEventHandler(async (event) => {
  await requireTeacher(event);
  const subject = getQuery(event).subject;
  const course = await findCourseBySubject(typeof subject === "string" ? subject : "");
  if (!course) return { course: null, concepts: [] };
  return { course, concepts: await listCourseConcepts(course.id) };
});
