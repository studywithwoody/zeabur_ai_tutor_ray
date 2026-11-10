import { practiceProblemsForConcept } from "../../../../../utils/kg-practice";
import { requireKgReader } from "../../../../../utils/kg-access";

export default defineEventHandler(async (event) => {
  const session = await requireKgReader(event);
  const courseId = getRouterParam(event, "courseId");
  const slug = decodeURIComponent(getRouterParam(event, "slug") || "");
  if (!courseId || !slug) {
    throw createError({ statusCode: 400, statusMessage: "Missing concept" });
  }
  const expand = ["1", "true"].includes(String(getQuery(event).expand || ""));
  const problems = await practiceProblemsForConcept({
    courseId,
    slug,
    expand,
    viewerId: session.user.id,
    viewerRole: session.user.role,
  });
  return { problems };
});
