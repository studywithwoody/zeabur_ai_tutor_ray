import { and, asc, eq } from "drizzle-orm";
import { kgConcepts, kgCourses, kgEdges, kgUnits } from "../../db/schema";

type JsonRecord = Record<string, unknown>;

export async function buildCourseGraph(courseId: string) {
  const [course] = await useDrizzle()
    .select()
    .from(kgCourses)
    .where(eq(kgCourses.id, courseId))
    .limit(1);
  if (!course) {
    throw createError({ statusCode: 404, statusMessage: "Course not found" });
  }

  const units = await useDrizzle()
    .select()
    .from(kgUnits)
    .where(eq(kgUnits.courseId, courseId))
    .orderBy(asc(kgUnits.number), asc(kgUnits.id));

  const concepts = await useDrizzle()
    .select({
      id: kgConcepts.id,
      slug: kgConcepts.slug,
      unitId: kgConcepts.unitId,
      label: kgConcepts.label,
      type: kgConcepts.type,
      definition: kgConcepts.definition,
      definitionNote: kgConcepts.definitionNote,
      slideExcerpt: kgConcepts.slideExcerpt,
      equations: kgConcepts.equations,
      equationsVerified: kgConcepts.equationsVerified,
      sources: kgConcepts.sources,
    })
    .from(kgConcepts)
    .where(
      and(eq(kgConcepts.courseId, courseId), eq(kgConcepts.isActive, true))
    );

  const edges = await useDrizzle()
    .select({
      id: kgEdges.id,
      sourceId: kgEdges.sourceId,
      targetId: kgEdges.targetId,
      relation: kgEdges.relation,
      basis: kgEdges.basis,
      note: kgEdges.note,
      evidence: kgEdges.evidence,
      crossUnit: kgEdges.crossUnit,
    })
    .from(kgEdges)
    .where(eq(kgEdges.courseId, courseId));

  const unitById = new Map(units.map((unit) => [unit.id, unit]));
  const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));
  const meta = (course.meta ?? {}) as JsonRecord;

  const nodes = concepts
    .filter((concept) => concept.type !== "unit")
    .map((concept) => {
      const unit = concept.unitId ? unitById.get(concept.unitId) : undefined;
      const sources = concept.sources ?? [];
      return {
        id: concept.slug,
        label: concept.label,
        unit: unit?.chapter || "",
        unit_name: unit?.name || "",
        unit_id: unit?.slug || "",
        type: concept.type,
        definition: concept.definition || "",
        definition_note: concept.definitionNote || "",
        slide_excerpt: concept.slideExcerpt || "",
        equations: concept.equations ?? [],
        equations_verified_in_slide_text: concept.equationsVerified,
        source: sources[0] ?? null,
      };
    });

  return {
    id: course.id,
    title: course.title,
    subject: course.subject,
    meta: {
      generated_at: course.generatedAt?.toISOString() || meta.generatedAt || "",
      course: course.title,
      author: typeof meta.author === "string" ? meta.author : "",
      source_folder: course.sourceFolderUrl || "",
      relations: meta.relations ?? {},
      basis: meta.basis ?? {},
      counts: meta.counts ?? {},
      notes: typeof meta.notes === "string" ? meta.notes : "",
    },
    units: units.map((unit) => ({
      id: unit.slug,
      unit: unit.chapter || unit.slug,
      label: unit.name,
      order: unit.number ?? 0,
      files: unit.files ?? [],
    })),
    nodes,
    edges: edges.flatMap((edge) => {
      const source = conceptById.get(edge.sourceId);
      const target = conceptById.get(edge.targetId);
      if (!source || !target) return [];
      return [
        {
          id: edge.id,
          source: source.slug,
          target: target.slug,
          relation: edge.relation,
          basis: edge.basis,
          note: edge.note || "",
          cross_unit: edge.crossUnit,
          evidence: edge.evidence,
        },
      ];
    }),
  };
}

export async function buildConceptDetail(courseId: string, slug: string) {
  const graph = await buildCourseGraph(courseId);
  const node = graph.nodes.find((item) => item.id === slug);
  const unit = graph.units.find((item) => item.id === slug);
  if (!node && !unit) {
    throw createError({ statusCode: 404, statusMessage: "Concept not found" });
  }
  const edges = graph.edges.filter(
    (edge) => edge.source === slug || edge.target === slug
  );
  return {
    courseId: graph.id,
    title: graph.title,
    node: node ?? null,
    unit: unit ?? null,
    edges,
  };
}
