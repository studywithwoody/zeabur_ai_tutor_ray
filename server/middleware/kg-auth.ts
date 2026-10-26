export default defineEventHandler(async (event) => {
  const path = (event.path || "").split("?")[0] || "";
  if (!path.startsWith("/api/kg")) return;
  await requireKgReader(event);
});
