<script setup lang="ts">
const { t } = useI18n()
const {
  catalog,
  courseId,
  course,
  catalogError,
  graphError,
  graphPending,
} = useCatalog()

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
