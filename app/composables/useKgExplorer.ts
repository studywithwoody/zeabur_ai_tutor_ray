import type { ComputedRef, InjectionKey, Ref } from 'vue'
import Fuse from 'fuse.js'
import { buildElements, type GraphElement } from '../../lib/kg/elements'
import { applyFilters, type VisibleGraph } from '../../lib/kg/filterGraph'
import { CONCEPT_TYPES, RELATIONS, type CourseGraph, type GraphEdge, type GraphNode } from '../../lib/kg/schema'
import { shortChapter } from '../../lib/kg/labels'

export interface SearchHit {
  id: string
  label: string
  kind: 'unit' | 'node'
  meta: string
}

export interface GraphControls {
  fit: () => void
  zoomBy: (factor: number) => void
  relayout: () => void
}

export interface Explorer {
  course: ComputedRef<CourseGraph>
  searchText: Ref<string>
  hideInferred: Ref<boolean>
  hideWeak: Ref<boolean>
  groupByUnit: Ref<boolean>
  layout: Ref<'dagre' | 'fcose'>
  unitSet: Ref<string[]>
  typeSet: Ref<string[]>
  relationSet: Ref<string[]>
  selectedNodeId: Ref<string | null>
  selectedEdgeId: Ref<string | null>
  focusKey: Ref<number>
  visible: ComputedRef<VisibleGraph>
  elements: ComputedRef<GraphElement[]>
  searchHits: ComputedRef<SearchHit[]>
  matchCount: ComputedRef<number>
  typeOptions: ComputedRef<string[]>
  relationOptions: ComputedRef<string[]>
  selectedNode: ComputedRef<GraphNode | null>
  selectedEdge: ComputedRef<GraphEdge | null>
  selectNode: (id: string) => void
  selectEdge: (id: string) => void
  clearSelection: () => void
  toggleValue: (list: Ref<string[]>, value: string) => void
  setAllUnits: (on: boolean) => void
  setAllTypes: (on: boolean) => void
  setAllRelations: (on: boolean) => void
  graphControls: GraphControls
  bindGraphControls: (controls: GraphControls) => void
}

const explorerKey: InjectionKey<Explorer> = Symbol('explorer')

export function provideExplorer(): Explorer {
  const { t } = useI18n()
  const catalogApi = useCatalog()
  const { course: courseRef, courseId, catalog } = catalogApi
  const course = computed(() => {
    const value = courseRef.value
    if (!value) throw new Error('沒有可用的課程資料')
    return value
  })

  const searchText = ref('')
  const hideInferred = ref(false)
  const hideWeak = ref(false)
  const groupByUnit = ref(true)
  const layout = ref<'dagre' | 'fcose'>('dagre')
  const unitSet = ref<string[]>(course.value.units.map((unit) => unit.unit))
  const typeSet = ref<string[]>([...CONCEPT_TYPES])
  const relationSet = ref<string[]>([...RELATIONS])
  const selectedNodeId = ref<string | null>(null)
  const selectedEdgeId = ref<string | null>(null)
  const focusKey = ref(0)
  const route = useRoute()
  let syncQuery = false

  const graphControls: GraphControls = {
    fit: () => {},
    zoomBy: () => {},
    relayout: () => {},
  }

  function resetFilters() {
    unitSet.value = course.value.units.map((unit) => unit.unit)
    typeSet.value = typeOptions.value
    relationSet.value = relationOptions.value
    searchText.value = ''
    selectedNodeId.value = null
    selectedEdgeId.value = null
  }

  const typeOptions = computed(() => {
    const values = new Set<string>(CONCEPT_TYPES)
    for (const node of course.value.nodes) values.add(node.type)
    return [...values]
  })

  const relationOptions = computed(() => {
    const values = new Set<string>(RELATIONS)
    for (const relation of Object.keys(course.value.meta.relations)) values.add(relation)
    for (const edge of course.value.edges) values.add(edge.relation)
    return [...values]
  })

  typeSet.value = typeOptions.value
  relationSet.value = relationOptions.value

  watch(() => course.value.id, () => resetFilters())

  const fuse = computed(() => new Fuse(course.value.nodes, {
    keys: [
      { name: 'label', weight: 0.5 },
      { name: 'id', weight: 0.18 },
      { name: 'definition', weight: 0.16 },
      { name: 'slideExcerpt', weight: 0.1 },
      { name: 'equations', weight: 0.06 },
    ],
    threshold: 0.32,
    ignoreLocation: true,
    minMatchCharLength: 2,
  }))

  const fuseMatches = computed(() => {
    const text = searchText.value.trim()
    if (text.length < 2) return null
    return fuse.value.search(text, { limit: 40 })
  })

  const matchIds = computed(() => {
    if (!fuseMatches.value) return null
    return new Set(fuseMatches.value.map((result) => result.item.id))
  })

  const searchHits = computed<SearchHit[]>(() => {
    const text = searchText.value.trim().toLowerCase()
    if (text.length < 2) return []
    const hits: SearchHit[] = []
    for (const unit of course.value.units) {
      if (unit.label.toLowerCase().includes(text) || unit.unit.toLowerCase().includes(text)) {
        hits.push({ id: unit.id, label: unit.label, kind: 'unit', meta: t('kg.unit') })
      }
    }
    for (const result of fuseMatches.value ?? []) {
      if (hits.some((hit) => hit.id === result.item.id)) continue
      hits.push({
        id: result.item.id,
        label: result.item.label,
        kind: 'node',
        meta: `${t(`kg.types.${result.item.type}`)} · ${shortChapter(result.item.unitName)}`,
      })
      if (hits.length >= 12) break
    }
    return hits.slice(0, 12)
  })

  const pinnedIds = computed(() => {
    const ids = new Set<string>()
    if (selectedNodeId.value) ids.add(selectedNodeId.value)
    const edge = selectedEdgeId.value ? course.value.edgeById.get(selectedEdgeId.value) : undefined
    if (edge) {
      ids.add(edge.source)
      ids.add(edge.target)
    }
    return ids
  })

  const visible = computed(() => applyFilters(course.value, {
    units: unitSet.value,
    types: typeSet.value,
    relations: relationSet.value,
    hideInferred: hideInferred.value,
    hideWeak: hideWeak.value,
    groupByUnit: groupByUnit.value,
    matchIds: matchIds.value,
    pinnedIds: pinnedIds.value,
  }))

  const elements = computed(() => buildElements(course.value, visible.value, groupByUnit.value))

  function ensureListed(id: string) {
    const node = course.value.nodeById.get(id)
    if (!node) return
    if (node.type !== 'unit' && !typeSet.value.includes(node.type)) {
      typeSet.value = [...typeSet.value, node.type]
    }
    if (node.unit && !unitSet.value.includes(node.unit)) {
      unitSet.value = [...unitSet.value, node.unit]
    }
  }

  function selectNode(id: string) {
    if (!course.value.nodeById.has(id)) return
    const node = course.value.nodeById.get(id)
    if (node?.type === 'unit') searchText.value = ''
    ensureListed(id)
    selectedNodeId.value = id
    selectedEdgeId.value = null
    focusKey.value += 1
  }

  function selectEdge(id: string) {
    const edge = course.value.edgeById.get(id)
    if (!edge) return
    ensureListed(edge.source)
    ensureListed(edge.target)
    if (!relationSet.value.includes(edge.relation)) {
      relationSet.value = [...relationSet.value, edge.relation]
    }
    if (edge.basis === 'inferred') hideInferred.value = false
    if (edge.evidence?.kind === 'label_mention_nearby') hideWeak.value = false
    if (edge.relation === 'part_of') groupByUnit.value = false
    selectedEdgeId.value = id
    selectedNodeId.value = null
    focusKey.value += 1
  }

  function clearSelection() {
    selectedNodeId.value = null
    selectedEdgeId.value = null
  }

  function toggleValue(list: Ref<string[]>, value: string) {
    list.value = list.value.includes(value)
      ? list.value.filter((item) => item !== value)
      : [...list.value, value]
  }

  function setAllUnits(on: boolean) {
    unitSet.value = on ? course.value.units.map((unit) => unit.unit) : []
  }

  function setAllTypes(on: boolean) {
    typeSet.value = on ? [...typeOptions.value] : []
  }

  function setAllRelations(on: boolean) {
    relationSet.value = on ? [...relationOptions.value] : []
  }

  function syncUrl() {
    if (!import.meta.client || !syncQuery) return
    const url = new URL(window.location.href)
    if (selectedNodeId.value) url.searchParams.set('node', selectedNodeId.value)
    else url.searchParams.delete('node')
    if (selectedEdgeId.value) url.searchParams.set('edge', selectedEdgeId.value)
    else url.searchParams.delete('edge')
    const next = `${url.pathname}${url.search}${url.hash}`
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
    if (next !== current) window.history.replaceState(window.history.state, '', next)
  }

  watch([selectedNodeId, selectedEdgeId], () => syncUrl())

  onMounted(async () => {
    syncQuery = true
    const saved = localStorage.getItem('kg-course')
    if (saved && catalog.value.some((item) => item.id === saved) && saved !== courseId.value) {
      courseId.value = saved
      await nextTick()
    }
    const node = route.query.node
    const edge = route.query.edge
    if (typeof node === 'string') selectNode(node)
    else if (typeof edge === 'string') selectEdge(edge)
  })

  watch(courseId, (id) => {
    if (import.meta.client) localStorage.setItem('kg-course', id)
  })

  const api: Explorer = {
    course,
    searchText,
    hideInferred,
    hideWeak,
    groupByUnit,
    layout,
    unitSet,
    typeSet,
    relationSet,
    selectedNodeId,
    selectedEdgeId,
    focusKey,
    visible,
    elements,
    searchHits,
    matchCount: computed(() => matchIds.value?.size ?? 0),
    typeOptions,
    relationOptions,
    selectedNode: computed(() => selectedNodeId.value ? course.value.nodeById.get(selectedNodeId.value) ?? null : null),
    selectedEdge: computed(() => selectedEdgeId.value ? course.value.edgeById.get(selectedEdgeId.value) ?? null : null),
    selectNode,
    selectEdge,
    clearSelection,
    toggleValue,
    setAllUnits,
    setAllTypes,
    setAllRelations,
    graphControls,
    bindGraphControls(controls: GraphControls) {
      graphControls.fit = controls.fit
      graphControls.zoomBy = controls.zoomBy
      graphControls.relayout = controls.relayout
    },
  }

  provide(explorerKey, api)
  return api
}

export function useExplorer(): Explorer {
  const explorer = inject(explorerKey)
  if (!explorer) throw new Error('Knowledge graph state is not ready')
  return explorer
}
