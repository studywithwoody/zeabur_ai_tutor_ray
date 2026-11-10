/** Teacher-facing subject strings, matched to problems.subject. */
export const COURSE_SUBJECTS: Record<string, string> = {
  "ap-physics-1": "AP Physics 1",
  "ap-micro": "AP Microeconomics",
  "ap-macro": "AP Macroeconomics",
};

export function normalizeSubjectKey(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function subjectsMatch(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const left = normalizeSubjectKey(a);
  const right = normalizeSubjectKey(b);
  return left.length > 0 && left === right;
}

/** Canonical spelling stored on kg_courses.subject. */
export function canonicalSubject(
  courseId: string,
  metaCourse?: string | null
): string {
  const known = COURSE_SUBJECTS[courseId];
  if (known) return known;
  const trimmed = (metaCourse ?? "").trim().replace(/\s+/g, " ");
  return trimmed || courseId;
}
