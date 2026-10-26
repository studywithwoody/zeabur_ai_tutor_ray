import { and, eq, inArray, sql } from "drizzle-orm";
import {
  classrooms,
  classroomStudents,
  kgConcepts,
  problemConcepts,
} from "../../db/schema";
import { searchProblems } from "./problems";

export type MasteryBand = "untried" | "low" | "mid" | "high";

export function masteryBand(attempted: number, correct: number): MasteryBand {
  if (attempted <= 0) return "untried";
  const rate = correct / attempted;
  if (rate < 0.5) return "low";
  if (rate < 0.8) return "mid";
  return "high";
}

export async function expandConceptIds(conceptId: string, depth = 3) {
  const rows = await useDrizzle().execute<{ concept_id: string }>(sql`
    WITH RECURSIVE walk AS (
      SELECT ${conceptId}::text AS concept_id, 0 AS depth, ARRAY[${conceptId}::text] AS path
      UNION ALL
      SELECT step.next_id, walk.depth + 1, walk.path || step.next_id
      FROM walk
      JOIN (
        SELECT target_id AS from_id, source_id AS next_id
        FROM kg_edges
        WHERE relation = 'prerequisite'
        UNION ALL
        SELECT source_id AS from_id, target_id AS next_id
        FROM kg_edges
        WHERE relation = 'derived_from'
      ) step ON step.from_id = walk.concept_id
      JOIN kg_concepts c
        ON c.id = step.next_id
       AND c.is_active = true
       AND c.type <> 'unit'
      WHERE walk.depth < ${depth}
        AND NOT (step.next_id = ANY (walk.path))
    )
    SELECT DISTINCT concept_id FROM walk
  `);
  const list = Array.isArray(rows) ? rows : ((rows as { rows?: { concept_id: string }[] }).rows ?? []);
  const ids = list.map((row) => row.concept_id).filter(Boolean);
  return ids.length ? ids : [conceptId];
}

export async function practiceProblemsForConcept(options: {
  courseId: string;
  slug: string;
  expand: boolean;
  viewerId?: string;
  viewerRole?: string;
}) {
  const conceptId = `${options.courseId}:${options.slug}`;
  const [concept] = await useDrizzle()
    .select({ id: kgConcepts.id })
    .from(kgConcepts)
    .where(and(eq(kgConcepts.id, conceptId), eq(kgConcepts.isActive, true)))
    .limit(1);
  if (!concept) {
    throw createError({ statusCode: 404, statusMessage: "Concept not found" });
  }
  const conceptIds = options.expand ? await expandConceptIds(conceptId, 3) : [conceptId];
  const links = await useDrizzle()
    .select({
      problemId: problemConcepts.problemId,
      conceptId: problemConcepts.conceptId,
    })
    .from(problemConcepts)
    .where(
      and(inArray(problemConcepts.conceptId, conceptIds), eq(problemConcepts.confirmed, true))
    );
  const problemIds = [...new Set(links.map((link) => link.problemId))];
  const direct = new Set(
    links.filter((link) => link.conceptId === conceptId).map((link) => link.problemId)
  );
  const visible = await searchProblems({
    ids: problemIds,
    viewerId: options.viewerId,
    viewerRole: options.viewerRole,
    limit: Math.max(problemIds.length, 1),
  });
  return visible.map((problem) => ({
    ...problem,
    viaPrerequisite: !direct.has(problem.id),
  }));
}

export async function masteryForStudent(courseId: string, studentId: string, viewerRole: string) {
  const concepts = await useDrizzle()
    .select({ id: kgConcepts.id, slug: kgConcepts.slug, label: kgConcepts.label })
    .from(kgConcepts)
    .where(
      and(
        eq(kgConcepts.courseId, courseId),
        eq(kgConcepts.isActive, true),
        sql`${kgConcepts.type} <> 'unit'`
      )
    );
  const conceptIds = concepts.map((concept) => concept.id);
  if (conceptIds.length === 0) return [];
  const links = await useDrizzle()
    .select({
      conceptId: problemConcepts.conceptId,
      problemId: problemConcepts.problemId,
    })
    .from(problemConcepts)
    .where(
      and(inArray(problemConcepts.conceptId, conceptIds), eq(problemConcepts.confirmed, true))
    );
  const problemIds = [...new Set(links.map((link) => link.problemId))];
  const visible = await searchProblems({
    ids: problemIds,
    viewerId: studentId,
    viewerRole,
    limit: Math.max(problemIds.length, 1),
  });
  const visibleIds = new Set(visible.map((problem) => problem.id));
  const latest = new Map<string, boolean>();
  if (visibleIds.size > 0) {
    const rows = await useDrizzle().execute<{ problem_id: string; is_correct: boolean }>(sql`
      SELECT DISTINCT ON (problem_id) problem_id, is_correct
      FROM submissions
      WHERE user_id = ${studentId}
        AND problem_id IN (${sql.join([...visibleIds], sql`, `)})
      ORDER BY problem_id, created_at DESC
    `);
    const list = Array.isArray(rows)
      ? rows
      : ((rows as { rows?: { problem_id: string; is_correct: boolean }[] }).rows ?? []);
    for (const row of list) latest.set(row.problem_id, row.is_correct);
  }
  return concepts.map((concept) => {
    const problems = links
      .filter((link) => link.conceptId === concept.id && visibleIds.has(link.problemId))
      .map((link) => link.problemId);
    const unique = [...new Set(problems)];
    const attemptedIds = unique.filter((id) => latest.has(id));
    const correct = attemptedIds.filter((id) => latest.get(id)).length;
    const attempted = attemptedIds.length;
    return {
      conceptId: concept.id,
      slug: concept.slug,
      label: concept.label,
      attempted,
      correct,
      rate: attempted ? correct / attempted : 0,
      band: masteryBand(attempted, correct),
    };
  });
}

export async function coverageForCourse(courseId: string) {
  const rows = await useDrizzle()
    .select({
      conceptId: kgConcepts.id,
      slug: kgConcepts.slug,
      problemId: problemConcepts.problemId,
    })
    .from(kgConcepts)
    .leftJoin(
      problemConcepts,
      and(eq(problemConcepts.conceptId, kgConcepts.id), eq(problemConcepts.confirmed, true))
    )
    .where(
      and(
        eq(kgConcepts.courseId, courseId),
        eq(kgConcepts.isActive, true),
        sql`${kgConcepts.type} <> 'unit'`
      )
    );
  const counts = new Map<string, { slug: string; problemIds: Set<string> }>();
  for (const row of rows) {
    const entry = counts.get(row.conceptId) ?? { slug: row.slug, problemIds: new Set<string>() };
    if (row.problemId) entry.problemIds.add(row.problemId);
    counts.set(row.conceptId, entry);
  }
  return [...counts.entries()].map(([conceptId, entry]) => ({
    conceptId,
    slug: entry.slug,
    problemCount: entry.problemIds.size,
  }));
}

export async function assertTeacherCanViewStudent(teacherId: string, studentId: string, role: string | null | undefined) {
  if (role === "admin") return;
  const [row] = await useDrizzle()
    .select({ id: classroomStudents.id })
    .from(classroomStudents)
    .innerJoin(classrooms, eq(classroomStudents.classroomId, classrooms.id))
    .where(and(eq(classroomStudents.studentId, studentId), eq(classrooms.teacherId, teacherId)))
    .limit(1);
  if (!row) {
    throw createError({
      statusCode: 403,
      statusMessage: "Student is not in one of your classrooms",
    });
  }
}
