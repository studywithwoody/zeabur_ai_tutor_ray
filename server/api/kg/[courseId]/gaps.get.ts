import { eq } from "drizzle-orm";
import { kgCourses } from "../../../../db/schema";

export default defineEventHandler(async (event) => {
  await requireKgReader(event);
  const courseId = getRouterParam(event, "courseId");
  if (!courseId) {
    throw createError({ statusCode: 400, statusMessage: "Missing course id" });
  }
  const [course] = await useDrizzle()
    .select({
      id: kgCourses.id,
      title: kgCourses.title,
      gapReport: kgCourses.gapReport,
    })
    .from(kgCourses)
    .where(eq(kgCourses.id, courseId))
    .limit(1);
  if (!course) {
    throw createError({ statusCode: 404, statusMessage: "Course not found" });
  }
  return {
    id: course.id,
    title: course.title,
    markdown: course.gapReport || "",
  };
});
