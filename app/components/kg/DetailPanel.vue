<script setup lang="ts">
import type { GraphEdge } from '../../../lib/kg/schema'
import MathText from './MathText.vue'
import EquationList from './EquationList.vue'
import EvidenceBlock from './EvidenceBlock.vue'

defineEmits<{ close: [] }>()

const { t } = useI18n()
const explorer = useExplorer()

const node = computed(() => explorer.selectedNode.value)
const edge = computed(() => explorer.selectedEdge.value)
const detailTab = ref<'about' | 'practice'>('about')
const mastery = useState<Record<string, string>>('kg-mastery', () => ({}))
const coverage = useState<Record<string, number>>('kg-coverage', () => ({}))

watch(node, () => {
  detailTab.value = 'about'
})

const reviewFirst = computed(() => {
  const current = node.value
  if (!current || current.type === 'unit' || Object.keys(mastery.value).length === 0) return []
  const ids = new Set<string>()
  for (const item of explorer.course.value.edges) {
    if (item.relation === 'prerequisite' && item.target === current.id) ids.add(item.source)
    if (item.relation === 'derived_from' && item.source === current.id) ids.add(item.target)
  }
  return [...ids]
    .map((id) => ({
      id,
      label: labelOf(id),
      band: mastery.value[id] || 'untried',
    }))
    .filter((item) => item.band === 'untried' || item.band === 'low')
})

const unitInfo = computed(() => {
  const current = node.value
  if (!current) return null
  return explorer.course.value.units.find((unit) => unit.id === current.unitId || unit.id === current.id) ?? null
})

const unitConcepts = computed(() => {
  if (node.value?.type !== 'unit') return []
  return explorer.course.value.nodes.filter((item) => item.unitId === node.value?.id)
})

const membership = computed(() => {
  if (!node.value || node.value.type === 'unit') return null
  return explorer.course.value.edges.find((item) => item.relation === 'part_of' && item.source === node.value?.id) ?? null
})

const outgoing = computed(() => linked('out'))
const incoming = computed(() => linked('in'))

const edgeHidden = computed(() => {
  if (!edge.value) return false
  return !explorer.visible.value.edges.some((item) => item.id === edge.value?.id)
})

function linked(direction: 'out' | 'in') {
  const current = node.value
  if (!current) return []
  return explorer.course.value.edges
    .filter((item) => item.relation !== 'part_of' && (direction === 'out' ? item.source === current.id : item.target === current.id))
    .sort((a, b) => a.relation.localeCompare(b.relation) || labelOf(otherId(a, current.id)).localeCompare(labelOf(otherId(b, current.id))))
}

function otherId(item: GraphEdge, currentId: string) {
  return item.source === currentId ? item.target : item.source
}

function labelOf(id: string) {
  return explorer.course.value.nodeById.get(id)?.label ?? id
}

function relationText(relation: string) {
  return explorer.course.value.meta.relations[relation] ?? ''
}

function kindLabel(group: 'types' | 'relations' | 'basis', key: string) {
  const path = `kg.${group}.${key}`
  const translated = t(path)
  return translated === path ? key : translated
}
</script>

<template>
  <aside class="flex h-full min-h-0 min-w-0 max-w-full flex-col bg-base-100 text-base-content">
    <div class="flex items-center justify-between border-b border-base-300 px-3 py-2 xl:hidden">
      <h2 class="font-semibold">{{ t('kg.detail') }}</h2>
      <button type="button" class="btn btn-ghost btn-sm" @click="$emit('close')">{{ t('kg.close') }}</button>
    </div>

    <div class="min-h-0 min-w-0 flex-1 overflow-auto px-4 py-4">
      <div v-if="edge" class="space-y-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-base-content/60">{{ t('kg.edge') }}</p>
          <h2 class="mt-1 text-2xl leading-tight">{{ kindLabel('relations', edge.relation) }}</h2>
          <p class="text-xs text-base-content/50">{{ edge.relation }}</p>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span class="badge badge-primary badge-outline">{{ kindLabel('basis', edge.basis) }}</span>
          <span v-if="edge.crossUnit" class="badge badge-ghost">{{ t('kg.cross_unit') }}</span>
        </div>
        <p v-if="relationText(edge.relation)" class="text-sm leading-6 text-base-content/75">{{ relationText(edge.relation) }}</p>
        <p v-if="edge.note" class="text-sm leading-6">
          <span class="font-semibold">{{ t('kg.note') }}　</span><MathText :text="edge.note" />
        </p>
        <div class="grid gap-2">
          <button type="button" class="rounded-lg border border-base-300 bg-base-200 px-3 py-2 text-left text-sm hover:border-primary" @click="explorer.selectNode(edge.source)">
            <span class="block text-[11px] text-base-content/50">{{ t('kg.from') }}</span>
            <MathText :text="labelOf(edge.source)" />
          </button>
          <button type="button" class="rounded-lg border border-base-300 bg-base-200 px-3 py-2 text-left text-sm hover:border-primary" @click="explorer.selectNode(edge.target)">
            <span class="block text-[11px] text-base-content/50">{{ t('kg.to') }}</span>
            <MathText :text="labelOf(edge.target)" />
          </button>
        </div>
        <p v-if="edgeHidden" class="rounded-md bg-warning/15 px-2 py-1 text-xs text-base-content">
          {{ t('kg.edge_hidden') }}
        </p>
        <EvidenceBlock v-if="edge.evidence" :evidence="edge.evidence" />
        <p v-else class="text-sm text-base-content/60">{{ t('kg.no_evidence') }}</p>
      </div>

      <div v-else-if="node && node.type === 'unit'" class="space-y-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-base-content/60">{{ t('kg.unit') }}</p>
          <h2 class="mt-1 text-2xl leading-tight"><MathText :text="node.label" /></h2>
        </div>
        <p class="text-sm leading-6">{{ t('kg.unit_count', { count: unitConcepts.length }) }}</p>
        <section v-if="unitInfo?.files.length" class="space-y-2">
          <h3 class="text-base font-semibold">{{ t('kg.lecture_files') }}</h3>
          <a
            v-for="file in unitInfo.files"
            :key="file.fileId || file.file"
            :href="file.link || undefined"
            target="_blank"
            rel="noopener noreferrer"
            class="block rounded-lg border border-base-300 bg-base-200 px-3 py-2 text-sm leading-5 text-primary underline-offset-2 hover:border-primary"
            :class="file.link ? 'underline' : 'pointer-events-none no-underline'"
          >
            {{ file.file }}
            <span v-if="file.pages != null" class="block text-xs text-base-content/60 no-underline">{{ t('kg.pages', { count: file.pages }) }}</span>
          </a>
        </section>
        <ul class="space-y-1">
          <li v-for="concept in unitConcepts" :key="concept.id">
            <button type="button" class="w-full rounded-md px-2 py-1 text-left text-sm hover:bg-base-200" @click="explorer.selectNode(concept.id)">
              <span class="text-base-content/50">{{ kindLabel('types', concept.type) }}</span>
              <MathText :text="concept.label" />
            </button>
          </li>
        </ul>
      </div>

      <div v-else-if="node" class="space-y-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-base-content/60">{{ kindLabel('types', node.type) }} · {{ node.type }}</p>
          <h2 class="mt-1 text-2xl leading-tight"><MathText :text="node.label" /></h2>
          <p class="mt-1 text-xs text-base-content/50">{{ node.id }}</p>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span class="badge badge-outline">{{ node.unitName }}</span>
          <span v-if="node.equationsVerified === false" class="badge badge-warning badge-sm">{{ t('kg.unverified') }}</span>
          <span v-else-if="node.equations.length && node.equationsVerified === true" class="badge badge-success badge-outline badge-sm">{{ t('kg.verified') }}</span>
        </div>

        <div class="join">
          <button type="button" class="btn btn-sm join-item" :class="detailTab === 'about' ? 'btn-primary' : 'btn-ghost'" @click="detailTab = 'about'">
            {{ t('kg.practice.about') }}
          </button>
          <button type="button" class="btn btn-sm join-item" :class="detailTab === 'practice' ? 'btn-primary' : 'btn-ghost'" @click="detailTab = 'practice'">
            {{ t('kg.practice.tab') }}
          </button>
        </div>
        <p v-if="coverage[node.id] != null" class="text-sm text-base-content/70">
          {{ t('kg.coverage.count', { count: coverage[node.id] }) }}
        </p>
        <section v-if="reviewFirst.length" class="space-y-2 rounded-box border border-warning/40 bg-warning/10 p-3">
          <h3 class="text-sm font-semibold">{{ t('kg.review_first') }}</h3>
          <ul class="space-y-1">
            <li v-for="item in reviewFirst" :key="item.id">
              <button type="button" class="text-left text-sm text-primary underline" @click="explorer.selectNode(item.id)">
                <MathText :text="item.label" />
                <span class="ml-1 badge badge-ghost badge-sm">{{ t(`kg.mastery.${item.band}`) }}</span>
              </button>
            </li>
          </ul>
        </section>
        <KgPracticeList v-if="detailTab === 'practice'" :course-id="explorer.course.value.id" :slug="node.id" />

        <template v-if="detailTab === 'about'">
        <section v-if="node.definition" class="space-y-1">
          <h3 class="text-base font-semibold">{{ t('kg.definition') }}</h3>
          <p class="text-sm leading-6"><MathText :text="node.definition" /></p>
          <p v-if="node.definitionNote" class="text-[11px] leading-4 text-base-content/50">{{ t('kg.definition_note') }}</p>
        </section>

        <EquationList v-if="node.equations.length" :equations="node.equations" :verified="node.equationsVerified" />

        <details v-if="node.slideExcerpt" class="rounded-lg border border-base-300 bg-base-200 px-3 py-2">
          <summary class="cursor-pointer text-sm font-semibold">{{ t('kg.slide_excerpt') }}</summary>
          <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-base-content/80">{{ node.slideExcerpt }}</p>
        </details>

        <section v-if="node.source" class="space-y-1">
          <h3 class="text-base font-semibold">{{ t('kg.source') }}</h3>
          <p class="text-sm leading-6">{{ node.source.file }}</p>
          <p v-if="node.source.slideTitle" class="text-sm text-base-content/75">{{ node.source.slideTitle }}</p>
          <p v-if="node.source.page != null" class="text-sm">{{ t('kg.page', { page: node.source.page }) }}</p>
          <a
            v-if="node.source.link"
            :href="node.source.link"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block text-sm text-primary underline"
          >
            {{ t('kg.open_drive') }}
          </a>
        </section>

        <section v-if="membership" class="space-y-1">
          <h3 class="text-base font-semibold">{{ t('kg.membership') }}</h3>
          <button type="button" class="text-sm font-semibold text-primary underline" @click="explorer.selectNode(membership.target)">
            <MathText :text="labelOf(membership.target)" />
          </button>
          <EvidenceBlock v-if="membership.evidence" :evidence="membership.evidence" />
        </section>

        <section class="space-y-2">
          <h3 class="text-base font-semibold">{{ t('kg.outgoing', { count: outgoing.length }) }}</h3>
          <p v-if="!outgoing.length" class="text-sm text-base-content/60">{{ t('kg.no_outgoing') }}</p>
          <article v-for="item in outgoing" :key="item.id" class="rounded-lg border border-base-300 px-2.5 py-2">
            <div class="flex flex-wrap items-center gap-1.5">
              <button type="button" class="badge badge-primary badge-outline" @click="explorer.selectEdge(item.id)">{{ kindLabel('relations', item.relation) }}</button>
              <span class="badge badge-ghost">{{ kindLabel('basis', item.basis) }}</span>
              <span v-if="item.crossUnit" class="badge badge-ghost">{{ t('kg.cross_unit') }}</span>
            </div>
            <p class="mt-1 text-sm leading-5">
              <span class="text-base-content/50">{{ t('kg.this_to') }}</span>
              <button type="button" class="font-semibold text-primary underline" @click="explorer.selectNode(item.target)"><MathText :text="labelOf(item.target)" /></button>
            </p>
            <p v-if="item.note" class="mt-1 text-xs leading-5 text-base-content/70"><MathText :text="item.note" /></p>
            <EvidenceBlock v-if="item.evidence" :evidence="item.evidence" />
          </article>
        </section>

        <section class="space-y-2">
          <h3 class="text-base font-semibold">{{ t('kg.incoming', { count: incoming.length }) }}</h3>
          <p v-if="!incoming.length" class="text-sm text-base-content/60">{{ t('kg.no_incoming') }}</p>
          <article v-for="item in incoming" :key="item.id" class="rounded-lg border border-base-300 px-2.5 py-2">
            <div class="flex flex-wrap items-center gap-1.5">
              <button type="button" class="badge badge-primary badge-outline" @click="explorer.selectEdge(item.id)">{{ kindLabel('relations', item.relation) }}</button>
              <span class="badge badge-ghost">{{ kindLabel('basis', item.basis) }}</span>
              <span v-if="item.crossUnit" class="badge badge-ghost">{{ t('kg.cross_unit') }}</span>
            </div>
            <p class="mt-1 text-sm leading-5">
              <button type="button" class="font-semibold text-primary underline" @click="explorer.selectNode(item.source)"><MathText :text="labelOf(item.source)" /></button>
              <span class="text-base-content/50">{{ t('kg.to_this') }}</span>
            </p>
            <p v-if="item.note" class="mt-1 text-xs leading-5 text-base-content/70"><MathText :text="item.note" /></p>
            <EvidenceBlock v-if="item.evidence" :evidence="item.evidence" />
          </article>
        </section>
        </template>
      </div>

      <div v-else class="grid min-h-full place-items-center text-center">
        <div class="max-w-xs space-y-2">
          <p class="text-xl">{{ t('kg.select_concept') }}</p>
          <p class="text-sm leading-6 text-base-content/70">{{ t('kg.select_hint') }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>
