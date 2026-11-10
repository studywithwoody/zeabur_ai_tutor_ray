<script setup lang="ts">
import MathText from './MathText.vue'

defineEmits<{ close: [] }>()

const { t, locale } = useI18n()
const explorer = useExplorer()
const { unitColor } = useKgColors()

const counts = computed(() => explorer.course.value.meta.counts)
const totalByUnit = computed(() => {
  const map = new Map<string, number>()
  for (const node of explorer.course.value.nodes) {
    map.set(node.unit, (map.get(node.unit) ?? 0) + 1)
  }
  return map
})
const visibleByUnit = computed(() => {
  const map = new Map<string, number>()
  for (const node of explorer.visible.value.nodes) {
    map.set(node.unit, (map.get(node.unit) ?? 0) + 1)
  }
  return map
})
const typeCounts = computed(() => {
  const map = new Map<string, number>()
  for (const node of explorer.course.value.nodes) {
    map.set(node.type, (map.get(node.type) ?? 0) + 1)
  }
  return map
})
const maxUnitCount = computed(() => Math.max(1, ...totalByUnit.value.values()))

function labelOf(group: 'types' | 'relations' | 'basis' | 'evidence', key: string) {
  const path = `kg.${group}.${key}`
  const translated = t(path)
  return translated === path ? key : translated
}

function stamp(iso: string) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(locale.value === 'zhTW' ? 'zh-TW' : 'en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Taipei',
  }).format(date)
}

function onSearchKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    const first = explorer.searchHits.value[0]
    if (first) explorer.selectNode(first.id)
  }
  if (event.key === 'Escape' && explorer.searchText.value) {
    explorer.searchText.value = ''
    event.stopPropagation()
  }
}

</script>

<template>
  <aside class="flex h-full min-h-0 flex-col bg-base-100 text-base-content">
    <div class="flex items-center justify-between border-b border-base-300 px-3 py-2 xl:hidden">
      <h2 class="font-semibold">{{ t('kg.filters_title') }}</h2>
      <button type="button" class="btn btn-ghost btn-sm" @click="$emit('close')">{{ t('kg.close') }}</button>
    </div>
    <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-3">
      <section>
        <label class="text-xs font-semibold uppercase tracking-wide text-base-content/60" for="concept-search">{{ t('kg.search') }}</label>
        <div class="mt-1.5 flex gap-2">
          <input
            id="concept-search"
            v-model="explorer.searchText.value"
            type="search"
            :placeholder="t('kg.search_placeholder')"
            class="input input-bordered input-sm w-full"
            @keydown="onSearchKeydown"
          >
          <button v-if="explorer.searchText.value" type="button" class="btn btn-ghost btn-sm shrink-0" @click="explorer.searchText.value = ''">
            {{ t('kg.clear') }}
          </button>
        </div>
        <p v-if="explorer.searchText.value.trim().length >= 2" class="mt-1 text-[11px] text-base-content/60">
          {{ t('kg.match_count', { count: explorer.matchCount.value }) }}
        </p>
        <ul v-if="explorer.searchHits.value.length" class="mt-2 overflow-hidden rounded-lg border border-base-300">
          <li v-for="hit in explorer.searchHits.value" :key="hit.id" class="border-b border-base-300 last:border-b-0">
            <button
              type="button"
              class="flex w-full flex-col items-start px-2.5 py-1.5 text-left hover:bg-base-200"
              @click="explorer.selectNode(hit.id)"
            >
              <span class="text-sm font-semibold leading-5"><MathText :text="hit.label" /></span>
              <span class="text-[11px] text-base-content/60">{{ hit.meta }}</span>
            </button>
          </li>
        </ul>
        <p v-else-if="explorer.searchText.value.trim().length >= 2" class="mt-2 text-sm text-base-content/60">
          {{ t('kg.no_match') }}
        </p>
      </section>

      <section>
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-base-content/60">{{ t('kg.units') }}</h2>
          <div class="flex gap-2 text-[11px]">
            <button type="button" class="link link-hover" @click="explorer.setAllUnits(true)">{{ t('kg.select_all') }}</button>
            <button type="button" class="link link-hover" @click="explorer.setAllUnits(false)">{{ t('kg.clear') }}</button>
          </div>
        </div>
        <ul class="mt-2 space-y-1.5">
          <li v-for="unit in explorer.course.value.units" :key="unit.id">
            <label class="flex cursor-pointer items-start gap-2 text-sm leading-5">
              <input
                type="checkbox"
                class="checkbox checkbox-xs checkbox-primary mt-1"
                :checked="explorer.unitSet.value.includes(unit.unit)"
                @change="explorer.toggleValue(explorer.unitSet, unit.unit)"
              >
              <span class="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ background: unitColor(unit.unit).accent }" />
              <span class="min-w-0 flex-1">{{ unit.label }}</span>
              <span class="shrink-0 tabular-nums text-base-content/50">
                <template v-if="(visibleByUnit.get(unit.unit) ?? 0) !== (totalByUnit.get(unit.unit) ?? 0)">
                  {{ visibleByUnit.get(unit.unit) ?? 0 }}/
                </template>
                {{ totalByUnit.get(unit.unit) ?? 0 }}
              </span>
            </label>
            <span class="ml-7 mt-1 block h-1 overflow-hidden rounded bg-base-300">
              <span
                class="block h-full"
                :style="{
                  width: `${((totalByUnit.get(unit.unit) ?? 0) / maxUnitCount) * 100}%`,
                  background: unitColor(unit.unit).accent,
                }"
              />
            </span>
          </li>
        </ul>
      </section>

      <section>
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-base-content/60">{{ t('kg.node_types') }}</h2>
          <div class="flex gap-2 text-[11px]">
            <button type="button" class="link link-hover" @click="explorer.setAllTypes(true)">{{ t('kg.select_all') }}</button>
            <button type="button" class="link link-hover" @click="explorer.setAllTypes(false)">{{ t('kg.clear') }}</button>
          </div>
        </div>
        <ul class="mt-2 space-y-1">
          <li v-for="type in explorer.typeOptions.value" :key="type">
            <label class="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                class="checkbox checkbox-xs checkbox-primary"
                :checked="explorer.typeSet.value.includes(type)"
                @change="explorer.toggleValue(explorer.typeSet, type)"
              >
              <span class="flex-1">{{ labelOf('types', type) }} <span class="text-base-content/40">{{ type }}</span></span>
              <span class="tabular-nums text-base-content/50">{{ typeCounts.get(type) ?? 0 }}</span>
            </label>
          </li>
        </ul>
      </section>

      <section>
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-base-content/60">{{ t('kg.relation_heading') }}</h2>
          <div class="flex gap-2 text-[11px]">
            <button type="button" class="link link-hover" @click="explorer.setAllRelations(true)">{{ t('kg.select_all') }}</button>
            <button type="button" class="link link-hover" @click="explorer.setAllRelations(false)">{{ t('kg.clear') }}</button>
          </div>
        </div>
        <ul class="mt-2 space-y-1">
          <li v-for="relation in explorer.relationOptions.value" :key="relation">
            <label class="flex cursor-pointer items-center gap-2 text-sm" :title="explorer.course.value.meta.relations[relation]">
              <input
                type="checkbox"
                class="checkbox checkbox-xs checkbox-primary"
                :checked="explorer.relationSet.value.includes(relation)"
                @change="explorer.toggleValue(explorer.relationSet, relation)"
              >
              <span class="flex-1">{{ labelOf('relations', relation) }} <span class="text-base-content/40">{{ relation }}</span></span>
              <span class="tabular-nums text-base-content/50">{{ counts?.edges_by_relation?.[relation] ?? '' }}</span>
            </label>
          </li>
        </ul>
      </section>

      <section class="space-y-2">
        <h2 class="text-xs font-semibold uppercase tracking-wide text-base-content/60">{{ t('kg.display') }}</h2>
        <label class="flex cursor-pointer items-start gap-2 text-sm">
          <input v-model="explorer.hideInferred.value" type="checkbox" class="checkbox checkbox-xs checkbox-primary mt-1">
          <span>
            <span class="font-semibold">{{ t('kg.hide_inferred') }}</span>
            <span class="mt-0.5 block text-xs leading-5 text-base-content/60">{{ t('kg.hide_inferred_hint') }}</span>
          </span>
        </label>
        <label class="flex cursor-pointer items-start gap-2 text-sm">
          <input v-model="explorer.hideWeak.value" type="checkbox" class="checkbox checkbox-xs checkbox-primary mt-1">
          <span>
            <span class="font-semibold">{{ t('kg.hide_weak') }}</span>
            <span class="mt-0.5 block text-xs leading-5 text-base-content/60">{{ t('kg.hide_weak_hint') }}</span>
          </span>
        </label>
        <label class="flex cursor-pointer items-start gap-2 text-sm">
          <input v-model="explorer.groupByUnit.value" type="checkbox" class="checkbox checkbox-xs checkbox-primary mt-1">
          <span>
            <span class="font-semibold">{{ t('kg.group_units') }}</span>
            <span class="mt-0.5 block text-xs leading-5 text-base-content/60">{{ t('kg.group_units_hint') }}</span>
          </span>
        </label>
      </section>

      <section class="space-y-2 border-t border-base-300 pt-3">
        <h2 class="text-xs font-semibold uppercase tracking-wide text-base-content/60">{{ t('kg.stats_title') }}</h2>
        <dl class="grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg bg-base-200 px-2 py-2">
            <dt class="text-[11px] text-base-content/60">{{ t('kg.concepts') }}</dt>
            <dd class="text-xl">{{ counts?.nodes ?? explorer.course.value.nodes.length }}</dd>
          </div>
          <div class="rounded-lg bg-base-200 px-2 py-2">
            <dt class="text-[11px] text-base-content/60">{{ t('kg.units') }}</dt>
            <dd class="text-xl">{{ counts?.unit_nodes ?? explorer.course.value.units.length }}</dd>
          </div>
          <div class="rounded-lg bg-base-200 px-2 py-2">
            <dt class="text-[11px] text-base-content/60">{{ t('kg.edges') }}</dt>
            <dd class="text-xl">{{ counts?.edges_total ?? explorer.course.value.edges.length }}</dd>
          </div>
        </dl>
        <p class="text-xs leading-5 text-base-content/70">
          {{ t('kg.visible_stats', { nodes: explorer.visible.value.nodes.length, edges: explorer.visible.value.edges.length }) }}
          <template v-if="explorer.groupByUnit.value"> {{ t('kg.grouped_note') }}</template>
        </p>
        <ul v-if="counts?.edges_by_basis_excl_part_of" class="space-y-0.5 text-xs text-base-content/70">
          <li v-for="(count, key) in counts.edges_by_basis_excl_part_of" :key="key">
            {{ labelOf('basis', String(key)) }} {{ count }} {{ t('kg.excl_part_of') }}
          </li>
          <li v-if="counts.grounded_evidence_kind">
            {{ t('kg.evidence_counts', { strong: counts.grounded_evidence_kind.targeted_phrase ?? 0, weak: counts.grounded_evidence_kind.label_mention_nearby ?? 0 }) }}
          </li>
          <li v-if="counts.cross_unit_edges != null">{{ t('kg.cross_unit_count', { count: counts.cross_unit_edges }) }}</li>
        </ul>
        <details class="text-xs leading-5 text-base-content/70">
          <summary class="cursor-pointer font-semibold text-base-content">{{ t('kg.about') }}</summary>
          <div class="mt-2 space-y-2">
            <p v-for="(text, key) in explorer.course.value.meta.relations" :key="key">
              <span class="font-semibold">{{ labelOf('relations', String(key)) }}</span>：{{ text }}
            </p>
            <p v-for="(text, key) in explorer.course.value.meta.basis" :key="`basis-${key}`">
              <span class="font-semibold">{{ labelOf('basis', String(key)) }}</span>：{{ text }}
            </p>
            <p v-if="explorer.course.value.meta.notes">{{ explorer.course.value.meta.notes }}</p>
            <p v-if="explorer.course.value.meta.status">{{ explorer.course.value.meta.status }}</p>
            <p v-if="explorer.course.value.meta.generatedAt">{{ t('kg.generated', { time: stamp(explorer.course.value.meta.generatedAt) }) }}</p>
            <p v-if="explorer.course.value.warnings.length" class="text-warning">
              {{ t('kg.warnings', { count: explorer.course.value.warnings.length }) }}
            </p>
          </div>
        </details>
      </section>
    </div>
  </aside>
</template>
