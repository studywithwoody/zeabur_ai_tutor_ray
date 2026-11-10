export default defineCachedEventHandler(
  async (event) => {
    await requireKgReader(event);
    const courseId = getRouterParam(event, "courseId");
    if (!courseId) {
      throw createError({ statusCode: 400, statusMessage: "Missing course id" });
    }
    return buildCourseGraph(courseId);
  },
  {
    maxAge: 60 * 10,
    swr: false,
    name: "kg-course-graph",
    // The cached handler only sees listed headers. Cookie must be forwarded so
    // requireKgReader still runs against the real session.
    varies: ["cookie"],
    getKey: (event) => getRouterParam(event, "courseId") || "missing",
  }
);
