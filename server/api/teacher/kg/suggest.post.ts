import { z } from "zod";
import { buildEmbeddingText, generateEmbedding } from "../../../utils/embedding";
import {
  findCourseBySubject,
  requireTeacher,
  suggestConceptsForEmbedding,
} from "../../../utils/kg-tagging";

const bodySchema = z.object({
  subject: z.string().min(1),
  title: z.string().optional(),
  content: z.string().optional(),
  explanation: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  chapter: z.string().optional(),
  grade: z.string().optional(),
  threshold: z.number().optional(),
  topK: z.number().optional(),
});

export default defineEventHandler(async (event) => {
  await requireTeacher(event);
  const parsed = bodySchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Validation failed" });
  }
  const course = await findCourseBySubject(parsed.data.subject);
  if (!course) return { course: null, suggestions: [] };
  let embedding: number[];
  try {
    embedding = await generateEmbedding(buildEmbeddingText(parsed.data));
  } catch (error: any) {
    throw createError({
      statusCode: 503,
      statusMessage: error?.message || "Embedding service is unavailable",
    });
  }
  const suggestions = await suggestConceptsForEmbedding({
    courseId: course.id,
    embedding,
    threshold: parsed.data.threshold,
    topK: parsed.data.topK,
  });
  return { course, suggestions };
});
