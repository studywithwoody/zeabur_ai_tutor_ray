import "dotenv/config";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq, notInArray, sql } from "drizzle-orm";
import postgres from "postgres";
import OpenAI from "openai";
import * as schema from "../db/schema";
import { canonicalSubject } from "../lib/kg/subject";

const BATCH_SIZE = 100;
const DATA_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data/courses"
);

type JsonRecord = Record<string, unknown>;

interface LectureFile {
  file: string;
  file_id: string;
  link: string;
  pages: number | null;
}

interface RawUnit {
  id: string;
  unit: string;
  label: string;
  order: number;
  files: LectureFile[];
}

interface RawNode {
  id: string;
  label: string;
  unit: string;
  unitName: string;
  unitId: string;
  type: string;
  definition: string;
  definitionNote: string;
  slideExcerpt: string;
  equations: string[];
  equationsVerified: boolean | null;
  source: JsonRecord | null;
}

interface RawEdge {
  source: string;
  target: string;
  relation: string;
  basis: string;
  note: string;
  crossUnit: boolean;
  evidence: JsonRecord | null;
}

interface CourseFile {
  id: string;
  title: string;
  subject: string;
  sourceFolderUrl: string | null;
  generatedAt: Date | null;
  gapReport: string | null;
  meta: JsonRecord;
  units: RawUnit[];
  nodes: RawNode[];
  edges: RawEdge[];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): JsonRecord | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function readEquations(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) return [value.trim()];
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    typeof item === "string" && item.trim() ? [item.trim()] : []
  );
}

function readFiles(value: unknown): LectureFile[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const record = asRecord(item);
    if (!record) return [];
    return [
      {
        file: asString(record.file),
        file_id: asString(record.file_id) || asString(record.fileId),
        link: asString(record.link),
        pages: asNumber(record.pages),
      },
    ];
  });
}

function conceptKey(courseId: string, slug: string) {
  return `${courseId}:${slug}`;
}

function unitKey(courseId: string, unit: string) {
  return `${courseId}:${unit}`;
}

async function loadCourse(id: string): Promise<CourseFile> {
  const rawText = await readFile(path.join(DATA_DIR, `${id}.json`), "utf8");
  const raw = JSON.parse(rawText) as JsonRecord;
  const meta = asRecord(raw.meta) ?? {};
  const title = asString(meta.course) || asString(raw.course) || id;
  const subject = canonicalSubject(id, title);
  const generatedRaw = asString(meta.generated_at) || asString(meta.generatedAt);
  const generatedAt = generatedRaw ? new Date(generatedRaw) : null;

  const units: RawUnit[] = [];
  const unitList = Array.isArray(raw.units) ? raw.units : [];
  unitList.forEach((item, index) => {
    const record = asRecord(item);
    if (!record) return;
    const unit = asString(record.unit) || asString(record.id).replace(/^unit-/, "");
    if (!unit) return;
    const slug = asString(record.id) || `unit-${unit}`;
    units.push({
      id: slug,
      unit,
      label: asString(record.label) || asString(record.name) || unit,
      order: asNumber(record.order) ?? index + 1,
      files: readFiles(record.files),
    });
  });

  const unitSlugByCode = new Map(units.map((unit) => [unit.unit, unit.id]));
  const nodes: RawNode[] = [];
  const seen = new Set<string>();
  for (const item of Array.isArray(raw.nodes) ? raw.nodes : []) {
    const record = asRecord(item);
    if (!record) continue;
    const nodeId = asString(record.id);
    if (!nodeId) continue;
    if (record.type === "unit") continue;
    if (seen.has(nodeId)) {
      throw new Error(`${id}: duplicate node id ${nodeId}`);
    }
    seen.add(nodeId);
    if (units.some((unit) => unit.id === nodeId)) {
      throw new Error(`${id}: node id ${nodeId} collides with a unit id`);
    }
    const verified = record.equations_verified_in_slide_text ?? record.equationsVerified;
    const unit = asString(record.unit);
    nodes.push({
      id: nodeId,
      label: asString(record.label) || nodeId,
      unit,
      unitName: asString(record.unit_name) || asString(record.unitName),
      unitId: asString(record.unit_id) || asString(record.unitId) || unitSlugByCode.get(unit) || "",
      type: asString(record.type) || "concept",
      definition: asString(record.definition),
      definitionNote: asString(record.definition_note) || asString(record.definitionNote),
      slideExcerpt: asString(record.slide_excerpt) || asString(record.slideExcerpt),
      equations: readEquations(record.equations),
      equationsVerified: typeof verified === "boolean" ? verified : null,
      source: asRecord(record.source),
    });
  }

  const known = new Set<string>([
    ...nodes.map((node) => node.id),
    ...units.map((unit) => unit.id),
  ]);
  const edges: RawEdge[] = [];
  for (const item of Array.isArray(raw.edges) ? raw.edges : []) {
    const record = asRecord(item);
    if (!record) continue;
    const source = asString(record.source);
    const target = asString(record.target);
    const relation = asString(record.relation);
    if (!source || !target || !relation) continue;
    if (!known.has(source) || !known.has(target)) {
      throw new Error(`${id}: edge ${source} → ${target} has a missing endpoint`);
    }
    const evidence = asRecord(record.evidence);
    const basis = asString(record.basis) || (evidence ? "grounded" : "inferred");
    const crossFlag = record.cross_unit ?? record.crossUnit;
    edges.push({
      source,
      target,
      relation,
      basis,
      note: asString(record.note),
      crossUnit: typeof crossFlag === "boolean" ? crossFlag : false,
      evidence,
    });
  }

  let gapReport: string | null = null;
  try {
    gapReport = await readFile(path.join(DATA_DIR, `${id}.gaps.md`), "utf8");
  } catch {
    gapReport = null;
  }

  return {
    id,
    title,
    subject,
    sourceFolderUrl: asString(meta.source_folder) || asString(meta.sourceFolder) || null,
    generatedAt: generatedAt && !Number.isNaN(generatedAt.getTime()) ? generatedAt : null,
    gapReport,
    meta: {
      author: asString(meta.author),
      relations: asRecord(meta.relations) ?? {},
      basis: asRecord(meta.basis) ?? {},
      counts: asRecord(meta.counts) ?? {},
      notes: asString(meta.notes),
      generatedAt: generatedRaw,
    },
    units,
    nodes,
    edges,
  };
}

async function listCourseIds(only?: string): Promise<string[]> {
  const files = await readdir(DATA_DIR);
  const ids = files
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/, ""))
    .sort();
  if (only) {
    if (!ids.includes(only)) {
      throw new Error(`Unknown course "${only}". Available: ${ids.join(", ")}`);
    }
    return [only];
  }
  if (ids.length === 0) {
    throw new Error(`No course JSON files in ${DATA_DIR}`);
  }
  return ids;
}

function embeddingText(course: CourseFile, node: RawNode): string {
  const unit = course.units.find((item) => item.unit === node.unit);
  const meta = [course.subject, unit?.label || node.unitName, node.type]
    .filter(Boolean)
    .map((part) => `[${part}]`)
    .join(" ");
  const equations = node.equations.length ? node.equations.join("\n") : "";
  return [meta, node.label, node.definition, node.slideExcerpt, equations]
    .filter(Boolean)
    .join("\n");
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

async function importCourse(
  db: ReturnType<typeof drizzle<typeof schema>>,
  course: CourseFile,
  dryRun: boolean
) {
  const now = new Date();
  const conceptIds = [
    ...course.units.map((unit) => conceptKey(course.id, unit.id)),
    ...course.nodes.map((node) => conceptKey(course.id, node.id)),
  ];

  const existing = dryRun
    ? await db
        .select({ id: schema.kgConcepts.id, isActive: schema.kgConcepts.isActive })
        .from(schema.kgConcepts)
        .where(eq(schema.kgConcepts.courseId, course.id))
    : [];

  console.log(
    `${course.id}: ${course.nodes.length} concepts, ${course.units.length} units, ${course.edges.length} edges, subject "${course.subject}"${course.gapReport ? `, gap report ${course.gapReport.length} chars` : ""}`
  );

  if (dryRun) {
    const active = new Set(conceptIds);
    const deactivate = existing.filter((row) => row.isActive && !active.has(row.id)).length;
    console.log(
      `  dry-run: existing concepts ${existing.length}, would deactivate ${deactivate}`
    );
    return;
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(schema.kgCourses)
      .values({
        id: course.id,
        title: course.title,
        subject: course.subject,
        sourceFolderUrl: course.sourceFolderUrl,
        gapReport: course.gapReport,
        generatedAt: course.generatedAt,
        meta: course.meta,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.kgCourses.id,
        set: {
          title: course.title,
          subject: course.subject,
          sourceFolderUrl: course.sourceFolderUrl,
          gapReport: course.gapReport,
          generatedAt: course.generatedAt,
          meta: course.meta,
          updatedAt: now,
        },
      });

    if (course.units.length) {
      await tx
        .insert(schema.kgUnits)
        .values(
          course.units.map((unit) => ({
            id: unitKey(course.id, unit.unit),
            courseId: course.id,
            number: unit.order,
            name: unit.label,
            chapter: unit.unit,
            slug: unit.id,
            files: unit.files,
          }))
        )
        .onConflictDoUpdate({
          target: schema.kgUnits.id,
          set: {
            number: sql`excluded.number`,
            name: sql`excluded.name`,
            chapter: sql`excluded.chapter`,
            slug: sql`excluded.slug`,
            files: sql`excluded.files`,
          },
        });
    }

    const conceptRows = [
      ...course.units.map((unit) => ({
        id: conceptKey(course.id, unit.id),
        courseId: course.id,
        unitId: unitKey(course.id, unit.unit),
        slug: unit.id,
        label: unit.label,
        type: "unit",
        definition: null as string | null,
        definitionNote: null as string | null,
        slideExcerpt: null as string | null,
        equations: [] as string[],
        equationsVerified: null as boolean | null,
        sources: [] as JsonRecord[],
        isActive: true,
        updatedAt: now,
      })),
      ...course.nodes.map((node) => ({
        id: conceptKey(course.id, node.id),
        courseId: course.id,
        unitId: node.unit ? unitKey(course.id, node.unit) : null,
        slug: node.id,
        label: node.label,
        type: node.type,
        definition: node.definition || null,
        definitionNote: node.definitionNote || null,
        slideExcerpt: node.slideExcerpt || null,
        equations: node.equations,
        equationsVerified: node.equationsVerified,
        sources: node.source ? [node.source] : [],
        isActive: true,
        updatedAt: now,
      })),
    ];

    for (let i = 0; i < conceptRows.length; i += BATCH_SIZE) {
      const batch = conceptRows.slice(i, i + BATCH_SIZE);
      await tx
        .insert(schema.kgConcepts)
        .values(batch)
        .onConflictDoUpdate({
          target: schema.kgConcepts.id,
          set: {
            courseId: sql`excluded.course_id`,
            unitId: sql`excluded.unit_id`,
            slug: sql`excluded.slug`,
            label: sql`excluded.label`,
            type: sql`excluded.type`,
            definition: sql`excluded.definition`,
            definitionNote: sql`excluded.definition_note`,
            slideExcerpt: sql`excluded.slide_excerpt`,
            equations: sql`excluded.equations`,
            equationsVerified: sql`excluded.equations_verified`,
            sources: sql`excluded.sources`,
            isActive: true,
            updatedAt: now,
          },
        });
    }

    if (conceptIds.length) {
      await tx
        .update(schema.kgConcepts)
        .set({ isActive: false, updatedAt: now })
        .where(
          and(
            eq(schema.kgConcepts.courseId, course.id),
            notInArray(schema.kgConcepts.id, conceptIds)
          )
        );
    }

    const edgeRows = course.edges.map((edge) => ({
      courseId: course.id,
      sourceId: conceptKey(course.id, edge.source),
      targetId: conceptKey(course.id, edge.target),
      relation: edge.relation,
      basis: edge.basis,
      note: edge.note || null,
      evidence: edge.evidence,
      crossUnit: edge.crossUnit,
    }));

    const edgeKeys = edgeRows.map(
      (edge) => `${edge.sourceId}|${edge.targetId}|${edge.relation}`
    );
    if (edgeKeys.length === 0) {
      await tx.delete(schema.kgEdges).where(eq(schema.kgEdges.courseId, course.id));
    } else {
      await tx.delete(schema.kgEdges).where(
        and(
          eq(schema.kgEdges.courseId, course.id),
          sql`(${schema.kgEdges.sourceId} || '|' || ${schema.kgEdges.targetId} || '|' || ${schema.kgEdges.relation}) NOT IN (${sql.join(
            edgeKeys.map((key) => sql`${key}`),
            sql`, `
          )})`
        )
      );
    }

    for (let i = 0; i < edgeRows.length; i += BATCH_SIZE) {
      const batch = edgeRows.slice(i, i + BATCH_SIZE);
      await tx
        .insert(schema.kgEdges)
        .values(batch)
        .onConflictDoUpdate({
          target: [
            schema.kgEdges.sourceId,
            schema.kgEdges.targetId,
            schema.kgEdges.relation,
          ],
          set: {
            courseId: sql`excluded.course_id`,
            basis: sql`excluded.basis`,
            note: sql`excluded.note`,
            evidence: sql`excluded.evidence`,
            crossUnit: sql`excluded.cross_unit`,
          },
        });
    }
  });

  const activeCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.kgConcepts)
    .where(
      and(eq(schema.kgConcepts.courseId, course.id), eq(schema.kgConcepts.isActive, true))
    );
  const edgeCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.kgEdges)
    .where(eq(schema.kgEdges.courseId, course.id));
  console.log(
    `  upserted. active concepts ${activeCount[0]?.count ?? 0}, edges ${edgeCount[0]?.count ?? 0}`
  );
}

async function embedCourses(
  db: ReturnType<typeof drizzle<typeof schema>>,
  courses: CourseFile[]
) {
  const apiKey = process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn(
      "EMBEDDING_API_KEY or OPENAI_API_KEY not set; skipped concept embeddings"
    );
    return;
  }
  const baseURL = process.env.EMBEDDING_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
  const openai = new OpenAI({ baseURL, apiKey });

  for (const course of courses) {
    const rows = await db
      .select({
        id: schema.kgConcepts.id,
        slug: schema.kgConcepts.slug,
        embeddingSourceHash: schema.kgConcepts.embeddingSourceHash,
      })
      .from(schema.kgConcepts)
      .where(
        and(
          eq(schema.kgConcepts.courseId, course.id),
          eq(schema.kgConcepts.isActive, true),
          sql`${schema.kgConcepts.type} <> 'unit'`
        )
      );

    const bySlug = new Map(course.nodes.map((node) => [node.id, node]));
    const pending = rows.flatMap((row) => {
      const node = bySlug.get(row.slug);
      if (!node) return [];
      const text = embeddingText(course, node);
      const hash = hashText(text);
      if (row.embeddingSourceHash === hash) return [];
      return [{ id: row.id, text, hash }];
    });

    console.log(`${course.id}: embedding ${pending.length} concepts with ${model}`);
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE);
      try {
        const response = await openai.embeddings.create({
          input: batch.map((item) => item.text),
          model,
        });
        const vectors = response.data
          .sort((a, b) => a.index - b.index)
          .map((item) => item.embedding);
        for (let j = 0; j < batch.length; j++) {
          const vector = vectors[j];
          if (!vector || vector.length !== 1536) {
            throw new Error(
              `Expected 1536-d embedding for ${batch[j]!.id}, got ${vector?.length ?? 0}`
            );
          }
          await db
            .update(schema.kgConcepts)
            .set({
              embedding: vector,
              embeddingSourceHash: batch[j]!.hash,
              updatedAt: new Date(),
            })
            .where(eq(schema.kgConcepts.id, batch[j]!.id));
        }
        console.log(
          `  embedded ${Math.min(i + BATCH_SIZE, pending.length)}/${pending.length}`
        );
      } catch (err: any) {
        console.error(`Error embedding batch at offset ${i}:`, err.message);
        if (err.status === 429) {
          console.log("Rate limited, waiting 60s...");
          await new Promise((resolve) => setTimeout(resolve, 60_000));
          i -= BATCH_SIZE;
        } else {
          throw err;
        }
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const skipEmbeddings = args.includes("--skip-embeddings");
  const courseFlag = args.indexOf("--course");
  const only = courseFlag >= 0 ? args[courseFlag + 1] : undefined;

  const ids = await listCourseIds(only);
  const courses = [];
  for (const id of ids) courses.push(await loadCourse(id));

  if (dryRun && !process.env.DATABASE_URL) {
    for (const course of courses) {
      console.log(
        `${course.id}: ${course.nodes.length} concepts, ${course.units.length} units, ${course.edges.length} edges, subject "${course.subject}"`
      );
    }
    console.log("dry-run without DATABASE_URL: parsed files only");
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not found");
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });
  try {
    for (const course of courses) {
      await importCourse(db, course, dryRun);
    }
    if (!dryRun && !skipEmbeddings) {
      await embedCourses(db, courses);
    }
    console.log(dryRun ? "Dry run complete." : "Import complete.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
