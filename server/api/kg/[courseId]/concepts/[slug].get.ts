export default defineEventHandler(async (event) => {
  await requireKgReader(event);
  const courseId = getRouterParam(event, "courseId");
  const slug = getRouterParam(event, "slug");
  if (!courseId || !slug) {
    throw createError({ statusCode: 400, statusMessage: "Missing concept" });
  }
  return buildConceptDetail(courseId, slug);
});
