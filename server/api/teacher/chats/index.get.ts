export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const user = session.user;

  if (user.role !== "teacher" && user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const query = getQuery(event);
  return listChats(user.id, "teacher", {
    projectId: query.projectId as string | undefined,
    unorganized: query.unorganized === "true",
  });
});
