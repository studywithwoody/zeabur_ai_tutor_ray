<script setup lang="ts">
const props = defineProps<{
  mode?: "student" | "teacher";
}>();

const { t } = useI18n();
const {
  catalog,
  courseId,
  course,
  catalogError,
  graphError,
  graphPending,
} = useCatalog();

const mode = useState<"student" | "teacher">("kg-mode", () => "student");
mode.value = props.mode === "teacher" ? "teacher" : "student";
const mastery = useState<Record<string, string>>("kg-mastery", () => ({}));
const coverage = useState<Record<string, number>>("kg-coverage", () => ({}));
const studentId = ref("");
const students = ref<Array<{ id: string; name: string }>>([]);

async function loadOverlay() {
  try {
    await loadOverlayInner();
  } catch {
    mastery.value = {};
  }
}

async function loadOverlayInner() {
  mastery.value = {};
  coverage.value = {};
  if (!courseId.value) return;
  if (mode.value === "teacher") {
    const result = await $fetch<{ concepts: Array<{ slug: string; problemCount: number }> }>(
      "/api/teacher/kg/coverage",
      { query: { courseId: courseId.value } }
    );
    coverage.value = Object.fromEntries(result.concepts.map((item) => [item.slug, item.problemCount]));
    if (!studentId.value) return;
    const studentMastery = await $fetch<{ concepts: Array<{ slug: string; band: string }> }>(
      `/api/teacher/students/${studentId.value}/kg-mastery`,
      { query: { courseId: courseId.value } }
    );
    mastery.value = Object.fromEntries(studentMastery.concepts.map((item) => [item.slug, item.band]));
    return;
  }
  const result = await $fetch<{ concepts: Array<{ slug: string; band: string }> }>(
    "/api/student/kg/mastery",
    { query: { courseId: courseId.value } }
  );
  mastery.value = Object.fromEntries(result.concepts.map((item) => [item.slug, item.band]));
}

onMounted(async () => {
  if (mode.value === "teacher") {
    try {
      students.value = await $fetch<Array<{ id: string; name: string }>>("/api/teacher/students");
    } catch {
      students.value = [];
    }
  }
  await loadOverlay();
});

watch([courseId, studentId], () => {
  if (import.meta.client) loadOverlay();
});

onMounted(() => {
  const saved = localStorage.getItem('kg-course')
  if (saved && saved !== courseId.value) courseId.value = saved
})

watch(courseId, (id) => {
  if (import.meta.client) localStorage.setItem('kg-course', id)
})

const active = computed(() => catalog.value.find((item) => item.id === courseId.value) ?? null)
</script>

<template>
  <section class="flex h-[calc(100dvh-7.5rem)] min-h-[32rem] flex-col overflow-hidden rounded-box border border-base-300 bg-base-100">
    <header class="flex flex-wrap items-center gap-3 border-b border-base-300 bg-base-100 px-4 py-3">
      <div class="min-w-0">
        <h1 class="text-lg font-semibold">{{ t('kg.title') }}</h1>
        <p v-if="course" class="truncate text-xs text-base-content/60">
          {{ course.title }}<template v-if="course.meta.author"> · {{ course.meta.author }}</template>
        </p>
      </div>
      <label class="ml-auto flex items-center gap-2 text-sm">
        <span class="text-base-content/70">{{ t('kg.course') }}</span>
        <select v-model="courseId" class="select select-bordered select-sm">
          <option v-for="item in catalog" :key="item.id" :value="item.id">
            {{ item.title }}
          </option>
        </select>
      </label>
      <label v-if="mode === 'teacher'" class="flex items-center gap-2 text-sm">
        <span class="text-base-content/70">{{ t("kg.mastery.student") }}</span>
        <select v-model="studentId" class="select select-bordered select-sm">
          <option value="">{{ t("kg.mastery.none") }}</option>
          <option v-for="student in students" :key="student.id" :value="student.id">
            {{ student.name }}
          </option>
        </select>
      </label>
      <a
        v-if="course?.meta.sourceFolder"
        :href="course.meta.sourceFolder"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-ghost btn-sm"
      >
        {{ t('kg.source_folder') }}
      </a>
    </header>

    <div v-if="catalogError || graphError" class="p-6">
      <div class="alert alert-error">
        <span>{{ t('kg.load_error') }}</span>
      </div>
    </div>
    <div v-else-if="!course" class="grid flex-1 place-items-center text-sm text-base-content/70">
      {{ graphPending ? t('kg.loading') : t('kg.empty') }}
    </div>
    <KgExplorer v-else :key="course.id" />
    <p v-if="active?.subject" class="sr-only">{{ active.subject }}</p>
  </section>
</template>
