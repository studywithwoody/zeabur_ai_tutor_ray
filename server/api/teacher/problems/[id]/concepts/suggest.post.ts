import { z } from "zod";
import {
  assertCanEditProblem,
  embeddingForProblem,
  findCourseBySubject,
  requireTeacher,
  suggestConceptsForEmbedding,
} from "../../../../../utils/kg-tagging";

const bodySchema = z.object({
  threshold: z.number().optional(),
  topK: z.number().optional(),
});

export default defineEventHandler(async (event) => {
  const session = await requireTeacher(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing problem ID" });
  const problem = await assertCanEditProblem(session.user.role, session.user.id, id);
  const parsed = bodySchema.safeParse((await readBody(event)) ?? {});
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Validation failed" });
  }
  const course = await findCourseBySubject(problem.subject);
  if (!course) return { course: null, suggestions: [] };
  const embedding = await embeddingForProblem(problem);
  const suggestions = await suggestConceptsForEmbedding({
    courseId: course.id,
    embedding,
    threshold: parsed.data.threshold,
    topK: parsed.data.topK,
  });
  return { course, suggestions };
});
