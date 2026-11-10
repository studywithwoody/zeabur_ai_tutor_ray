import { and, eq, inArray, isNotNull, ne, notInArray, sql } from "drizzle-orm";
import type { H3Event } from "h3";
import { kgConcepts, kgCourses, kgUnits, problemConcepts, problems } from "../../db/schema";
import type { PickedConcept } from "../../lib/kg/picked-concept";
import { normalizeSubjectKey, subjectsMatch } from "../../lib/kg/subject";
import { buildEmbeddingText, generateEmbedding } from "./embedding";

export const DEFAULT_SUGGEST_THRESHOLD = 0.35;
export const DEFAULT_SUGGEST_TOP_K = 5;

export interface ConceptSuggestion {
  conceptId: string;
  label: string;
  type: string;
  unitName: string;
  similarity: number;
}

export function decodeRouteParam(value: string | undefined) {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function requireTeacher(event: H3Event) {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }
  return session;
}

export async function assertCanEditProblem(
  role: string | null | undefined,
  userId: string,
  problemId: string
) {
  const [problem] = await useDrizzle()
    .select()
    .from(problems)
    .where(eq(problems.id, problemId))
    .limit(1);
  if (!problem) {
    throw createError({ statusCode: 404, statusMessage: "Problem not found" });
  }
  if (role !== "admin" && problem.createdBy !== userId) {
    throw createError({
      statusCode: 403,
      statusMessage: "You can only update problems you created",
    });
  }
  return problem;
}

export async function findCourseBySubject(subject: string | null | undefined) {
  if (!normalizeSubjectKey(subject)) return null;
  const courses = await useDrizzle()
    .select({
      id: kgCourses.id,
      title: kgCourses.title,
      subject: kgCourses.subject,
    })
    .from(kgCourses);
  return courses.find((course) => subjectsMatch(course.subject, subject)) ?? null;
}

export async function listCourseConcepts(courseId: string) {
  const rows = await useDrizzle()
    .select({
      id: kgConcepts.id,
      label: kgConcepts.label,
      type: kgConcepts.type,
      unitName: kgUnits.name,
    })
    .from(kgConcepts)
    .leftJoin(kgUnits, eq(kgConcepts.unitId, kgUnits.id))
    .where(
      and(
        eq(kgConcepts.courseId, courseId),
        eq(kgConcepts.isActive, true),
        ne(kgConcepts.type, "unit")
      )
    )
    .orderBy(kgConcepts.label);
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    type: row.type,
    unitName: row.unitName || "",
  }));
}

export async function listProblemConcepts(problemId: string): Promise<PickedConcept[]> {
  const rows = await useDrizzle()
    .select({
      conceptId: problemConcepts.conceptId,
      label: kgConcepts.label,
      type: kgConcepts.type,
      unitName: kgUnits.name,
      isPrimary: problemConcepts.isPrimary,
      confirmed: problemConcepts.confirmed,
      taggedBy: problemConcepts.taggedBy,
    })
    .from(problemConcepts)
    .innerJoin(kgConcepts, eq(problemConcepts.conceptId, kgConcepts.id))
    .leftJoin(kgUnits, eq(kgConcepts.unitId, kgUnits.id))
    .where(eq(problemConcepts.problemId, problemId));
  return rows.map((row) => ({
    conceptId: row.conceptId,
    label: row.label,
    type: row.type,
    unitName: row.unitName || "",
    isPrimary: row.isPrimary,
    confirmed: row.confirmed,
    taggedBy: row.taggedBy === "ai" ? "ai" : "manual",
  }));
}

function vectorLiteral(values: number[]) {
  if (values.length !== 1536 || values.some((value) => !Number.isFinite(value))) {
    throw createError({
      statusCode: 400,
      statusMessage: "Embedding must be 1536 finite dimensions",
    });
  }
  return sql.raw(`'[${values.join(",")}]'::vector`);
}

export function asEmbedding(value: unknown): number[] | null {
  if (Array.isArray(value) && value.length === 1536 && value.every((item) => typeof item === "number")) {
    return value;
  }
  if (typeof value === "string") {
    const numbers = value
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map((part) => Number(part.trim()));
    if (numbers.length === 1536 && numbers.every((item) => Number.isFinite(item))) return numbers;
  }
  return null;
}

export async function suggestConceptsForEmbedding(options: {
  courseId: string;
  embedding: number[];
  threshold?: number;
  topK?: number;
}): Promise<ConceptSuggestion[]> {
  const threshold = clampThreshold(options.threshold);
  const topK = clampTopK(options.topK);
  const vector = vectorLiteral(options.embedding);
  const distance = sql<number>`${kgConcepts.embedding} <=> ${vector}`;
  const rows = await useDrizzle()
    .select({
      conceptId: kgConcepts.id,
      label: kgConcepts.label,
      type: kgConcepts.type,
      unitName: kgUnits.name,
      similarity: sql<number>`1 - (${distance})`,
    })
    .from(kgConcepts)
    .leftJoin(kgUnits, eq(kgConcepts.unitId, kgUnits.id))
    .where(
      and(
        eq(kgConcepts.courseId, options.courseId),
        eq(kgConcepts.isActive, true),
        ne(kgConcepts.type, "unit"),
        isNotNull(kgConcepts.embedding),
        sql`${distance} <= ${1 - threshold}`
      )
    )
    .orderBy(distance)
    .limit(topK);
  return rows.map((row) => ({
    conceptId: row.conceptId,
    label: row.label,
    type: row.type,
    unitName: row.unitName || "",
    similarity: Number(row.similarity),
  }));
}

export async function embeddingForProblem(problem: {
  title?: string | null;
  content?: string | null;
  explanation?: string | null;
  subject?: string | null;
  chapter?: string | null;
  grade?: string | null;
  hashtags?: string[] | null;
  embedding?: unknown;
}) {
  const stored = asEmbedding(problem.embedding);
  if (stored) return stored;
  try {
    return await generateEmbedding(buildEmbeddingText(problem));
  } catch (error: any) {
    throw createError({
      statusCode: 503,
      statusMessage: error?.message || "Embedding service is unavailable",
    });
  }
}

export async function replaceProblemConcepts(problemId: string, links: PickedConcept[]) {
  const problem = await assertProblemExists(problemId);
  const course = await findCourseBySubject(problem.subject);
  if (!course) {
    if (normalizeLinks(links).length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Problem subject does not match a lecture course",
      });
    }
    await useDrizzle()
      .delete(problemConcepts)
      .where(eq(problemConcepts.problemId, problemId));
    await syncProblemConceptHashtags(problemId);
    return [];
  }
  const catalog = await listCourseConcepts(course.id);
  const allowed = new Set(catalog.map((concept) => concept.id));
  const requested = normalizeLinks(links);
  const normalized = requested.filter((link) => allowed.has(link.conceptId));
  if (normalized.length !== requested.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "One or more concepts are not in this subject",
    });
  }
  const byId = new Map(catalog.map((concept) => [concept.id, concept]));
  const stored = normalized.map((link) => {
    const concept = byId.get(link.conceptId)!;
    return { ...link, label: concept.label, type: concept.type, unitName: concept.unitName };
  });

  await useDrizzle().transaction(async (tx) => {
    const keep = stored.map((link) => link.conceptId);
    if (keep.length === 0) {
      await tx.delete(problemConcepts).where(eq(problemConcepts.problemId, problemId));
      return;
    }
    await tx
      .delete(problemConcepts)
      .where(
        and(
          eq(problemConcepts.problemId, problemId),
          notInArray(problemConcepts.conceptId, keep)
        )
      );
    for (const link of stored) {
      await tx
        .insert(problemConcepts)
        .values({
          problemId,
          conceptId: link.conceptId,
          isPrimary: link.isPrimary,
          taggedBy: link.taggedBy,
          confirmed: link.confirmed,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [problemConcepts.problemId, problemConcepts.conceptId],
          set: {
            isPrimary: link.isPrimary,
            taggedBy: link.taggedBy,
            confirmed: link.confirmed,
            updatedAt: new Date(),
          },
        });
    }
  });

  await syncProblemConceptHashtags(problemId);
  return stored;
}

export async function confirmProblemConcept(problemId: string, conceptId: string) {
  const [row] = await useDrizzle()
    .update(problemConcepts)
    .set({ confirmed: true, updatedAt: new Date() })
    .where(and(eq(problemConcepts.problemId, problemId), eq(problemConcepts.conceptId, conceptId)))
    .returning({ id: problemConcepts.id });
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "Concept tag not found" });
  }
  await syncProblemConceptHashtags(problemId);
}

export async function rejectProblemConcept(problemId: string, conceptId: string) {
  const removed = await useDrizzle()
    .delete(problemConcepts)
    .where(and(eq(problemConcepts.problemId, problemId), eq(problemConcepts.conceptId, conceptId)))
    .returning({ id: problemConcepts.id });
  if (removed.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "Concept tag not found" });
  }
  await syncProblemConceptHashtags(problemId);
}

/** Confirmed concept labels replace any hashtag that matches a concept label. Manual tags stay. */
export async function syncProblemConceptHashtags(problemId: string) {
  const problem = await assertProblemExists(problemId);
  const course = await findCourseBySubject(problem.subject);
  const conceptLabels = course
    ? (await listCourseConcepts(course.id)).map((concept) => concept.label.trim())
    : [];
  const conceptLabelSet = new Set(conceptLabels);
  const current = (problem.hashtags ?? []).map((tag) => tag.trim()).filter(Boolean);
  const manual = current.filter((tag) => !conceptLabelSet.has(tag));
  const confirmed = await useDrizzle()
    .select({ label: kgConcepts.label })
    .from(problemConcepts)
    .innerJoin(kgConcepts, eq(problemConcepts.conceptId, kgConcepts.id))
    .where(
      and(
        eq(problemConcepts.problemId, problemId),
        eq(problemConcepts.confirmed, true),
        eq(kgConcepts.isActive, true)
      )
    );
  const next: string[] = [];
  const seen = new Set<string>();
  for (const tag of [...manual, ...confirmed.map((row) => row.label.trim())]) {
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    next.push(tag);
  }
  const changed =
    next.length !== current.length || next.some((tag, index) => tag !== current[index]);
  if (changed) {
    await useDrizzle()
      .update(problems)
      .set({ hashtags: next, updatedAt: new Date() })
      .where(eq(problems.id, problemId));
  }
  await generateAndStoreEmbedding(problemId, {
    title: problem.title,
    content: problem.content,
    explanation: problem.explanation,
    subject: problem.subject,
    chapter: problem.chapter,
    grade: problem.grade,
    hashtags: next,
  });
}

export async function autoTagProblems(options: {
  role: string | null | undefined;
  userId: string;
  subject?: string;
  problemIds?: string[];
  threshold?: number;
  topK?: number;
  limit?: number;
}) {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const filters = [isNotNull(problems.embedding)];
  if (options.role !== "admin") filters.push(eq(problems.createdBy, options.userId));
  if (options.problemIds?.length) filters.push(inArray(problems.id, options.problemIds));
  if (options.subject && normalizeSubjectKey(options.subject)) {
    const key = normalizeSubjectKey(options.subject);
    filters.push(
      sql`lower(regexp_replace(btrim(${problems.subject}), '\\s+', ' ', 'g')) = ${key}`
    );
  }
  const rows = await useDrizzle()
    .select({
      id: problems.id,
      subject: problems.subject,
      embedding: problems.embedding,
    })
    .from(problems)
    .where(and(...filters))
    .limit(limit);

  let inserted = 0;
  let skipped = 0;
  for (const problem of rows) {
    const course = await findCourseBySubject(problem.subject);
    const embedding = asEmbedding(problem.embedding);
    if (!course || !embedding) {
      skipped += 1;
      continue;
    }
    const suggestions = await suggestConceptsForEmbedding({
      courseId: course.id,
      embedding,
      threshold: options.threshold,
      topK: options.topK,
    });
    if (suggestions.length === 0) {
      skipped += 1;
      continue;
    }
    const written = await useDrizzle()
      .insert(problemConcepts)
      .values(
        suggestions.map((suggestion) => ({
          problemId: problem.id,
          conceptId: suggestion.conceptId,
          isPrimary: false,
          taggedBy: "ai" as const,
          confirmed: false,
        }))
      )
      .onConflictDoNothing()
      .returning({ id: problemConcepts.id });
    inserted += written.length;
  }
  return { examined: rows.length, inserted, skipped };
}

function clampThreshold(value: number | undefined) {
  if (value == null || Number.isNaN(value)) return DEFAULT_SUGGEST_THRESHOLD;
  return Math.min(0.99, Math.max(0, value));
}

function clampTopK(value: number | undefined) {
  if (value == null || Number.isNaN(value)) return DEFAULT_SUGGEST_TOP_K;
  return Math.min(20, Math.max(1, Math.round(value)));
}

function normalizeLinks(links: PickedConcept[]) {
  const seen = new Set<string>();
  const next: PickedConcept[] = [];
  for (const link of links) {
    if (!link.conceptId || seen.has(link.conceptId)) continue;
    seen.add(link.conceptId);
    next.push({
      ...link,
      taggedBy: link.taggedBy === "ai" ? "ai" : "manual",
      confirmed: Boolean(link.confirmed),
      isPrimary: false,
    });
  }
  const primary = links.find((link) => link.isPrimary && seen.has(link.conceptId));
  if (primary) {
    const match = next.find((link) => link.conceptId === primary.conceptId);
    if (match) match.isPrimary = true;
  }
  return next;
}

async function assertProblemExists(problemId: string) {
  const [problem] = await useDrizzle()
    .select()
    .from(problems)
    .where(eq(problems.id, problemId))
    .limit(1);
  if (!problem) {
    throw createError({ statusCode: 404, statusMessage: "Problem not found" });
  }
  return problem;
}
