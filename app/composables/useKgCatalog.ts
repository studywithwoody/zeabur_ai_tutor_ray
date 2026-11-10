import { normalizeCourse, type CourseGraph } from "../../lib/kg/schema";

export interface KgCourseSummary {
  id: string;
  title: string;
  subject: string;
  author: string;
  hasGaps: boolean;
}

export interface KgCoursePayload {
  id: string;
  title: string;
  subject: string;
  meta: Record<string, unknown>;
  units: unknown[];
  nodes: unknown[];
  edges: unknown[];
}

export function useCatalog() {
  const courseId = useState<string>("kg-course-id", () => "ap-physics-1");
  const catalog = useFetch<KgCourseSummary[]>("/api/kg/courses", {
    key: "kg-courses",
  });
  const graph = useFetch<KgCoursePayload>(() => `/api/kg/${courseId.value}`, {
    watch: [courseId],
  });

  const course = computed<CourseGraph | null>(() => {
    const payload = graph.data.value;
    if (!payload || payload.id !== courseId.value) return null;
    return normalizeCourse(payload, payload.id);
  });

  return {
    catalog: computed(() => catalog.data.value ?? []),
    catalogError: catalog.error,
    catalogPending: catalog.pending,
    courseId,
    course,
    graphError: graph.error,
    graphPending: graph.pending,
    refreshGraph: graph.refresh,
  };
}
