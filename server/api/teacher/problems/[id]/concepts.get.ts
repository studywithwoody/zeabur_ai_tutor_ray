import {
  assertCanEditProblem,
  listProblemConcepts,
  requireTeacher,
} from "../../../../utils/kg-tagging";

export default defineEventHandler(async (event) => {
  const session = await requireTeacher(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing problem ID" });
  await assertCanEditProblem(session.user.role, session.user.id, id);
  return { concepts: await listProblemConcepts(id) };
});
