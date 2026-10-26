<script setup lang="ts">
const props = defineProps<{
  courseId: string;
  slug: string;
}>();

const { t } = useI18n();
const localePath = useLocalePath();
const mode = useState<"student" | "teacher">("kg-mode", () => "student");
const expand = ref(false);
const pending = ref(false);
const problems = ref<Array<Record<string, any>>>([]);

async function load() {
  pending.value = true;
  try {
    const result = await $fetch<{ problems: Array<Record<string, any>> }>(
      `/api/kg/${props.courseId}/concepts/${encodeURIComponent(props.slug)}/problems`,
      { query: { expand: expand.value ? "1" : "0" } }
    );
    problems.value = result.problems;
  } catch {
    problems.value = [];
  } finally {
    pending.value = false;
  }
}

watch(() => [props.courseId, props.slug, expand.value], load, { immediate: true });

function problemLink(id: string) {
  return localePath(
    mode.value === "teacher" ? `/teacher/problems/${id}/edit` : `/student/problems/${id}`
  );
}
</script>

<template>
  <section class="space-y-3">
    <label class="flex items-center gap-2 text-sm">
      <input v-model="expand" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
      {{ t("kg.practice.expand") }}
    </label>
    <p v-if="pending" class="text-sm text-base-content/70">{{ t("kg.loading") }}</p>
    <p v-else-if="problems.length === 0" class="text-sm text-base-content/70">{{ t("kg.practice.empty") }}</p>
    <div v-else class="space-y-3">
      <div v-for="problem in problems" :key="problem.id" class="space-y-1">
        <span v-if="problem.viaPrerequisite" class="badge badge-warning badge-sm">
          {{ t("kg.practice.via_prerequisite") }}
        </span>
        <StudentProblemSummaryCard
          :problem="problem"
          :to="problemLink(problem.id)"
          :show-favorite="mode === 'student'"
        />
      </div>
    </div>
  </section>
</template>
