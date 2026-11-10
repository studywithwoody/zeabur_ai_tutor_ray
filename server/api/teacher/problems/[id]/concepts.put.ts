import { z } from "zod";
import type { PickedConcept } from "../../../../../lib/kg/picked-concept";
import {
  assertCanEditProblem,
  replaceProblemConcepts,
  requireTeacher,
} from "../../../../utils/kg-tagging";

const bodySchema = z.object({
  concepts: z.array(
    z.object({
      conceptId: z.string().min(1),
      label: z.string().optional(),
      type: z.string().optional(),
      unitName: z.string().optional(),
      isPrimary: z.boolean().optional(),
      confirmed: z.boolean().optional(),
      taggedBy: z.enum(["manual", "ai"]).optional(),
    })
  ),
});

export default defineEventHandler(async (event) => {
  const session = await requireTeacher(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing problem ID" });
  await assertCanEditProblem(session.user.role, session.user.id, id);
  const parsed = bodySchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Validation failed" });
  }
  const concepts: PickedConcept[] = parsed.data.concepts.map((concept) => ({
    conceptId: concept.conceptId,
    label: concept.label || "",
    type: concept.type || "concept",
    unitName: concept.unitName || "",
    isPrimary: Boolean(concept.isPrimary),
    confirmed: concept.confirmed !== false,
    taggedBy: concept.taggedBy === "ai" ? "ai" : "manual",
  }));
  return { concepts: await replaceProblemConcepts(id, concepts) };
});
