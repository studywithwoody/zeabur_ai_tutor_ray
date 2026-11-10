import { z } from "zod";
import { autoTagProblems, requireTeacher } from "../../../utils/kg-tagging";

const bodySchema = z.object({
  subject: z.string().optional(),
  problemIds: z.array(z.string()).optional(),
  threshold: z.number().optional(),
  topK: z.number().optional(),
  limit: z.number().optional(),
});

export default defineEventHandler(async (event) => {
  const session = await requireTeacher(event);
  const parsed = bodySchema.safeParse((await readBody(event)) ?? {});
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Validation failed" });
  }
  return autoTagProblems({
    role: session.user.role,
    userId: session.user.id,
    ...parsed.data,
  });
});
