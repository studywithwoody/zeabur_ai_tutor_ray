import { asc } from "drizzle-orm";
import { kgCourses } from "../../../db/schema";

export default defineEventHandler(async (event) => {
  await requireKgReader(event);
  const rows = await useDrizzle()
    .select({
      id: kgCourses.id,
      title: kgCourses.title,
      subject: kgCourses.subject,
      gapReport: kgCourses.gapReport,
      meta: kgCourses.meta,
    })
    .from(kgCourses)
    .orderBy(asc(kgCourses.title));

  return rows.map((row) => {
    const meta = (row.meta ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      title: row.title,
      subject: row.subject,
      author: typeof meta.author === "string" ? meta.author : "",
      hasGaps: Boolean(row.gapReport && row.gapReport.trim()),
    };
  });
});
