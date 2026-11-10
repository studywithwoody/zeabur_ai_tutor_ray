import {
  assertCanEditProblem,
  confirmProblemConcept,
  decodeRouteParam,
  requireTeacher,
} from "../../../../../../utils/kg-tagging";

export default defineEventHandler(async (event) => {
  const session = await requireTeacher(event);
  const id = getRouterParam(event, "id");
  const conceptId = decodeRouteParam(getRouterParam(event, "conceptId"));
  if (!id || !conceptId) {
    throw createError({ statusCode: 400, statusMessage: "Missing problem or concept id" });
  }
  await assertCanEditProblem(session.user.role, session.user.id, id);
  await confirmProblemConcept(id, conceptId);
  return { success: true };
});
