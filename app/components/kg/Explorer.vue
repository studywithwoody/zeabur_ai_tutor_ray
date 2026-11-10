<script setup lang="ts">
import FilterPanel from './FilterPanel.vue'
import GraphCanvas from './GraphCanvas.client.vue'
import GraphLegend from './GraphLegend.vue'
import DetailPanel from './DetailPanel.vue'

const explorer = provideExplorer()
const { t } = useI18n()
const filtersOpen = ref(false)
const detailOpen = ref(false)
const gapsOpen = ref(false)

const gapsFetch = useFetch(
  () => `/api/kg/${explorer.course.value.id}/gaps`,
  { immediate: false },
)

function openFilters() {
  detailOpen.value = false
  filtersOpen.value = true
}

function openDetail() {
  filtersOpen.value = false
  detailOpen.value = true
}

async function toggleGaps() {
  gapsOpen.value = !gapsOpen.value
  if (gapsOpen.value && !gapsFetch.data.value) await gapsFetch.refresh()
}

watch([explorer.selectedNodeId, explorer.selectedEdgeId, explorer.focusKey], () => {
  if (!import.meta.client) return
  if (!explorer.selectedNodeId.value && !explorer.selectedEdgeId.value) return
  if (window.innerWidth < 1280) openDetail()
})

onMounted(() => {
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    filtersOpen.value = false
    detailOpen.value = false
    gapsOpen.value = false
    explorer.clearSelection()
  }
}
</script>

<template>
  <div class="relative flex min-h-0 flex-1">
    <button
      v-if="filtersOpen || detailOpen"
      type="button"
      class="absolute inset-0 z-20 bg-neutral/40 xl:hidden"
      :aria-label="t('kg.close_sidebar')"
      @click="filtersOpen = false; detailOpen = false"
    />

    <div
      class="absolute inset-y-0 left-0 z-30 h-full w-[min(92vw,300px)] shadow-2xl xl:static xl:z-auto xl:w-[280px] xl:shrink-0 xl:shadow-none"
      :class="filtersOpen ? 'block' : 'hidden xl:block'"
    >
      <FilterPanel class="h-full border-r border-base-300" @close="filtersOpen = false" />
    </div>

    <main class="relative min-w-0 flex-1 bg-base-200">
      <ClientOnly>
        <GraphCanvas class="absolute inset-0" />
        <template #fallback>
          <div class="grid h-full place-items-center bg-base-200 text-sm text-base-content/70">{{ t('kg.loading') }}</div>
        </template>
      </ClientOnly>

      <div class="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3">
        <button type="button" class="btn btn-sm pointer-events-auto xl:hidden" @click="openFilters">
          {{ t('kg.filters') }}
        </button>
        <div class="pointer-events-auto ml-auto flex max-w-full flex-wrap justify-end gap-2">
          <div class="join" role="group" :aria-label="t('kg.layout_group')">
            <button type="button" class="btn btn-sm join-item" :class="explorer.layout.value === 'dagre' ? 'btn-primary' : 'btn-ghost'" :aria-pressed="explorer.layout.value === 'dagre'" @click="explorer.layout.value = 'dagre'">
              {{ t('kg.layout_dagre') }}
            </button>
            <button type="button" class="btn btn-sm join-item" :class="explorer.layout.value === 'fcose' ? 'btn-primary' : 'btn-ghost'" :aria-pressed="explorer.layout.value === 'fcose'" @click="explorer.layout.value = 'fcose'">
              {{ t('kg.layout_fcose') }}
            </button>
          </div>
          <button type="button" class="btn btn-sm btn-ghost" @click="explorer.graphControls.relayout()">{{ t('kg.relayout') }}</button>
          <button type="button" class="btn btn-sm btn-ghost" @click="explorer.graphControls.fit()">{{ t('kg.fit') }}</button>
          <button type="button" class="btn btn-sm btn-ghost" @click="explorer.graphControls.zoomBy(1.2)">{{ t('kg.zoom_in') }}</button>
          <button type="button" class="btn btn-sm btn-ghost" @click="explorer.graphControls.zoomBy(0.8)">{{ t('kg.zoom_out') }}</button>
          <button type="button" class="btn btn-sm btn-ghost" @click="toggleGaps">{{ t('kg.gaps') }}</button>
          <button type="button" class="btn btn-sm xl:hidden" @click="openDetail">
            {{ t('kg.detail') }}
            <span v-if="explorer.selectedNodeId.value || explorer.selectedEdgeId.value" class="ml-1 inline-block h-2 w-2 rounded-full bg-primary" />
          </button>
        </div>
      </div>

      <GraphLegend class="absolute bottom-3 left-3 z-10 max-h-[70%] overflow-hidden" />

      <div v-if="gapsOpen" class="absolute inset-x-3 bottom-16 top-16 z-20 overflow-auto rounded-box border border-base-300 bg-base-100 p-4 shadow-xl">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="font-semibold">{{ t('kg.gaps') }}</h2>
          <button type="button" class="btn btn-ghost btn-sm" @click="gapsOpen = false">{{ t('kg.close') }}</button>
        </div>
        <p v-if="gapsFetch.pending.value" class="text-sm text-base-content/70">{{ t('kg.loading') }}</p>
        <pre v-else class="whitespace-pre-wrap text-sm leading-6">{{ gapsFetch.data.value?.markdown || t('kg.no_gaps') }}</pre>
      </div>
    </main>

    <div
      class="absolute inset-y-0 right-0 z-30 h-full w-[min(92vw,390px)] shadow-2xl xl:static xl:z-auto xl:w-[360px] xl:shrink-0 xl:shadow-none"
      :class="detailOpen ? 'block' : 'hidden xl:block'"
    >
      <DetailPanel class="h-full border-l border-base-300" @close="detailOpen = false" />
    </div>
  </div>
</template>
