<script setup lang="ts">
import type { PickedConcept } from "../../../lib/kg/picked-concept";

interface CatalogConcept {
  id: string;
  label: string;
  type: string;
  unitName: string;
}

const props = defineProps<{
  modelValue: PickedConcept[];
  subject: string;
  problemId?: string;
  title: string;
  content: string;
  explanation: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: PickedConcept[]): void;
}>();

const { t } = useI18n();
const query = ref("");
const catalog = ref<CatalogConcept[]>([]);
const courseTitle = ref("");
const suggesting = ref(false);
const notice = ref("");

const selectedIds = computed(() => new Set(props.modelValue.map((item) => item.conceptId)));

const matches = computed(() => {
  const needle = query.value.trim().toLowerCase();
  if (needle.length < 1) return [];
  return catalog.value
    .filter(
      (concept) =>
        !selectedIds.value.has(concept.id) &&
        (concept.label.toLowerCase().includes(needle) ||
          concept.unitName.toLowerCase().includes(needle))
    )
    .slice(0, 8);
});

async function loadCatalog() {
  notice.value = "";
  if (!props.subject.trim()) {
    catalog.value = [];
    courseTitle.value = "";
    return;
  }
  try {
    const result = await $fetch<{
      course: { title: string } | null;
      concepts: CatalogConcept[];
    }>("/api/teacher/kg/concepts", { query: { subject: props.subject } });
    catalog.value = result.concepts;
    courseTitle.value = result.course?.title || "";
  } catch {
    catalog.value = [];
    courseTitle.value = "";
    notice.value = t("teacher.problems.concepts.suggest_failed");
  }
}

async function loadLinks() {
  if (!props.problemId) return;
  try {
    const result = await $fetch<{ concepts: PickedConcept[] }>(
      `/api/teacher/problems/${props.problemId}/concepts`
    );
    emit("update:modelValue", result.concepts);
  } catch {
    notice.value = t("teacher.problems.concepts.suggest_failed");
  }
}

watch(() => props.subject, () => {
  if (import.meta.client) loadCatalog();
});

watch(() => props.problemId, () => {
  if (import.meta.client) loadLinks();
});

onMounted(() => {
  loadCatalog();
  loadLinks();
});

function write(next: PickedConcept[]) {
  emit("update:modelValue", next);
}

function add(concept: CatalogConcept) {
  if (selectedIds.value.has(concept.id)) return;
  write([
    ...props.modelValue,
    {
      conceptId: concept.id,
      label: concept.label,
      type: concept.type,
      unitName: concept.unitName,
      isPrimary: props.modelValue.length === 0,
      confirmed: true,
      taggedBy: "manual",
    },
  ]);
  query.value = "";
}

function remove(conceptId: string) {
  const current = props.modelValue.find((item) => item.conceptId === conceptId);
  const next = props.modelValue.filter((item) => item.conceptId !== conceptId);
  if (current?.isPrimary && next[0]) next[0].isPrimary = true;
  write(next);
  if (props.problemId && current) {
    $fetch(
      `/api/teacher/problems/${props.problemId}/concepts/${encodeURIComponent(conceptId)}/reject`,
      { method: "POST" }
    ).catch(() => {
      // A suggestion that was never saved has no row yet.
    });
  }
}

function setPrimary(conceptId: string) {
  write(
    props.modelValue.map((item) => ({
      ...item,
      isPrimary: item.conceptId === conceptId,
    }))
  );
}

async function confirm(item: PickedConcept) {
  write(
    props.modelValue.map((current) =>
      current.conceptId === item.conceptId ? { ...current, confirmed: true } : current
    )
  );
  if (!props.problemId) return;
  try {
    await $fetch(
      `/api/teacher/problems/${props.problemId}/concepts/${encodeURIComponent(item.conceptId)}/confirm`,
      { method: "POST" }
    );
  } catch {
    // Saved with the problem when the row does not exist yet.
  }
}

async function suggest() {
  if (!props.subject.trim()) {
    notice.value = t("teacher.problems.concepts.need_subject");
    return;
  }
  suggesting.value = true;
  notice.value = "";
  try {
    const result = props.problemId
      ? await $fetch<{ suggestions: Array<CatalogConcept & { conceptId: string }> }>(
          `/api/teacher/problems/${props.problemId}/concepts/suggest`,
          { method: "POST", body: { threshold: 0.35, topK: 5 } }
        )
      : await $fetch<{ suggestions: Array<CatalogConcept & { conceptId: string }> }>(
          "/api/teacher/kg/suggest",
          {
            method: "POST",
            body: {
              subject: props.subject,
              title: props.title,
              content: props.content,
              explanation: props.explanation,
              threshold: 0.35,
              topK: 5,
            },
          }
        );
    const additions: PickedConcept[] = [];
    for (const suggestion of result.suggestions) {
      if (selectedIds.value.has(suggestion.conceptId)) continue;
      additions.push({
        conceptId: suggestion.conceptId,
        label: suggestion.label,
        type: suggestion.type,
        unitName: suggestion.unitName,
        isPrimary: false,
        confirmed: false,
        taggedBy: "ai",
      });
    }
    if (additions.length === 0) {
      notice.value = t("teacher.problems.concepts.no_suggestions");
    } else {
      write([...props.modelValue, ...additions]);
    }
  } catch (error: any) {
    notice.value =
      error?.statusCode === 503
        ? t("teacher.problems.concepts.embedding_unavailable")
        : t("teacher.problems.concepts.suggest_failed");
  } finally {
    suggesting.value = false;
  }
}
</script>

<template>
  <div class="form-control">
    <label class="label mb-2">{{ t("teacher.problems.concepts.label") }}</label>
    <p v-if="courseTitle" class="mb-2 text-xs text-base-content/60">
      {{ t("teacher.problems.concepts.course", { course: courseTitle }) }}
    </p>
    <p v-else-if="subject.trim()" class="mb-2 text-xs text-base-content/60">
      {{ t("teacher.problems.concepts.no_course") }}
    </p>
    <div class="mb-2 flex gap-2">
      <input
        v-model="query"
        type="search"
        class="input input-bordered flex-1"
        :placeholder="t('teacher.problems.concepts.search')"
        :disabled="!courseTitle"
      />
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="suggesting || !courseTitle"
        @click="suggest"
      >
        {{ suggesting ? t("teacher.problems.concepts.suggesting") : t("teacher.problems.concepts.suggest") }}
      </button>
    </div>
    <ul v-if="matches.length" class="menu mb-2 max-h-48 overflow-auto rounded-box bg-base-200">
      <li v-for="concept in matches" :key="concept.id">
        <button type="button" class="flex items-center justify-between gap-2" @click="add(concept)">
          <span>{{ concept.label }}</span>
          <span class="badge badge-ghost badge-sm">{{ concept.unitName || concept.type }}</span>
        </button>
      </li>
    </ul>
    <div class="flex flex-wrap gap-2">
      <div
        v-for="item in modelValue"
        :key="item.conceptId"
        class="badge badge-lg gap-1"
        :class="item.confirmed ? 'badge-primary' : 'badge-warning'"
      >
        <button
          type="button"
          class="btn btn-ghost btn-xs px-1"
          :title="t('teacher.problems.concepts.primary')"
          @click="setPrimary(item.conceptId)"
        >
          {{ item.isPrimary ? "●" : "○" }}
        </button>
        <span>{{ item.label }}</span>
        <button
          v-if="!item.confirmed"
          type="button"
          class="btn btn-ghost btn-xs"
          @click="confirm(item)"
        >
          {{ t("teacher.problems.concepts.confirm") }}
        </button>
        <button type="button" class="btn btn-ghost btn-xs btn-circle" @click="remove(item.conceptId)">
          ✕
        </button>
      </div>
    </div>
    <p v-if="notice" class="mt-2 text-sm text-base-content/70">{{ notice }}</p>
  </div>
</template>
