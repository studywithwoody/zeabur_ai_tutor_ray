export const RELATIONS = [
  'prerequisite',
  'derived_from',
  'applies_to',
  'contrasts_with',
  'part_of',
] as const

export const CONCEPT_TYPES = ['concept', 'equation', 'law', 'skill'] as const

export const WEAK_EVIDENCE_KIND = 'label_mention_nearby'

export interface SourceRef {
  file: string
  fileId: string
  link: string
  page: number | null
  slideTitle: string
}

export interface LectureFile {
  file: string
  fileId: string
  link: string
  pages: number | null
}

export interface UnitInfo {
  id: string
  unit: string
  label: string
  order: number
  files: LectureFile[]
}

export interface GraphNode {
  id: string
  label: string
  unit: string
  unitName: string
  unitId: string
  type: string
  definition: string
  definitionNote: string
  slideExcerpt: string
  equations: string[]
  equationsVerified: boolean | null
  source: SourceRef | null
}

export interface Evidence {
  file: string
  fileId: string
  link: string
  page: number | null
  quote: string
  kind: string
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  relation: string
  basis: string
  note: string
  crossUnit: boolean
  evidence: Evidence | null
}

export interface PublishedCounts {
  nodes?: number
  unit_nodes?: number
  edges_total?: number
  edges_by_relation?: Record<string, number>
  edges_by_basis_excl_part_of?: Record<string, number>
  relation_x_basis?: Record<string, number>
  grounded_evidence_kind?: Record<string, number>
  cross_unit_edges?: number
}

export interface CourseMeta {
  generatedAt: string
  course: string
  author: string
  sourceFolder: string
  status: string
  relations: Record<string, string>
  basis: Record<string, string>
  counts: PublishedCounts | null
  notes: string
}

export interface CourseGraph {
  id: string
  title: string
  meta: CourseMeta
  units: UnitInfo[]
  nodes: GraphNode[]
  edges: GraphEdge[]
  nodeById: Map<string, GraphNode>
  edgeById: Map<string, GraphEdge>
  warnings: string[]
}

export function isWeakEvidence(edge: GraphEdge): boolean {
  return edge.evidence?.kind === WEAK_EVIDENCE_KIND
}

export function normalizeCourse(raw: unknown, id: string): CourseGraph {
  if (!isRecord(raw)) {
    throw new Error(`課程「${id}」的 JSON 不是物件`)
  }

  const warnings: string[] = []
  const meta = normalizeMeta(raw)
  const units = new Map<string, UnitInfo>()

  for (const unit of readUnits(raw.units)) {
    units.set(unit.id, unit)
  }

  const nodes: GraphNode[] = []
  const seen = new Set<string>()
  const nodeList = Array.isArray(raw.nodes) ? raw.nodes : null
  if (!nodeList) {
    throw new Error(`課程「${id}」缺少 nodes 陣列`)
  }

  for (const item of nodeList) {
    if (!isRecord(item)) continue
    const node = normalizeNode(item)
    if (!node) {
      warnings.push('略過一筆沒有 id 的節點')
      continue
    }
    if (node.type === 'unit') {
      if (!units.has(node.id)) {
        units.set(node.id, {
          id: node.id,
          unit: node.unit || node.id,
          label: node.label,
          order: units.size + 1,
          files: [],
        })
      }
      continue
    }
    if (seen.has(node.id)) {
      warnings.push(`重複的節點 id：${node.id}`)
      continue
    }
    seen.add(node.id)
    ensureUnit(units, node.unit, node.unitName, node.unitId)
    if (!node.unitId) node.unitId = unitIdFor(node.unit)
    nodes.push(node)
  }

  for (const node of nodes) {
    ensureUnit(units, node.unit, node.unitName, node.unitId)
  }

  const unitList = [...units.values()].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
  const nodeById = new Map<string, GraphNode>()
  for (const node of nodes) nodeById.set(node.id, node)
  for (const unit of unitList) {
    if (!nodeById.has(unit.id)) {
      nodeById.set(unit.id, unitNode(unit))
    }
  }

  const edges: GraphEdge[] = []
  const edgeRecords = Array.isArray(raw.edges) ? raw.edges : []
  edgeRecords.forEach((item, index) => {
    if (!isRecord(item)) return
    const edge = normalizeEdge(item, index, nodeById)
    if (!edge) {
      warnings.push(`略過無法讀取的連結 #${index + 1}`)
      return
    }
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) {
      warnings.push(`略過端點不存在的連結 ${edge.id}（${edge.source} → ${edge.target}）`)
      return
    }
    if (edge.crossUnit !== true && edge.crossUnit !== false) {
      edge.crossUnit = crossesUnits(edge, nodeById)
    }
    edges.push(edge)
  })

  const title = meta.course || id
  return {
    id,
    title,
    meta: { ...meta, course: title },
    units: unitList,
    nodes,
    edges,
    nodeById,
    edgeById: new Map(edges.map((edge) => [edge.id, edge])),
    warnings,
  }
}

function normalizeMeta(raw: Record<string, unknown>): CourseMeta {
  const meta = isRecord(raw.meta) ? raw.meta : {}
  const relations = stringMap(meta.relations)
  const basis = stringMap(meta.basis)
  return {
    generatedAt: asString(meta.generated_at) || asString(meta.generatedAt),
    course: asString(meta.course) || asString(raw.course),
    author: asString(meta.author) || asString(raw.author),
    sourceFolder: asString(meta.source_folder) || asString(meta.sourceFolder) || asString(raw.source_folder) || asString(raw.sourceFolder),
    status: asString(meta.status) || asString(raw.status),
    relations,
    basis,
    counts: normalizeCounts(meta.counts),
    notes: asString(meta.notes),
  }
}

function normalizeCounts(value: unknown): PublishedCounts | null {
  if (!isRecord(value)) return null
  return {
    nodes: asNumber(value.nodes),
    unit_nodes: asNumber(value.unit_nodes),
    edges_total: asNumber(value.edges_total),
    edges_by_relation: numMap(value.edges_by_relation),
    edges_by_basis_excl_part_of: numMap(value.edges_by_basis_excl_part_of),
    relation_x_basis: numMap(value.relation_x_basis),
    grounded_evidence_kind: numMap(value.grounded_evidence_kind),
    cross_unit_edges: asNumber(value.cross_unit_edges),
  }
}

function readUnits(value: unknown): UnitInfo[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => {
      if (!isRecord(item)) return []
      const unit = asString(item.unit) || asString(item.id).replace(/^unit-/, '')
      if (!unit) return []
      const id = asString(item.id) || unitIdFor(unit)
      return [{
        id,
        unit,
        label: asString(item.label) || asString(item.name) || asString(item.unit_name) || unit,
        order: asNumber(item.order) ?? index + 1,
        files: readFiles(item.files),
      }]
    })
  }
  if (isRecord(value)) {
    return Object.entries(value).map(([unit, label], index) => ({
      id: unitIdFor(unit),
      unit,
      label: typeof label === 'string' ? label : unit,
      order: index + 1,
      files: [],
    }))
  }
  return []
}

function readFiles(value: unknown): LectureFile[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!isRecord(item)) return []
    return [{
      file: asString(item.file),
      fileId: asString(item.file_id) || asString(item.fileId),
      link: asString(item.link),
      pages: asNumber(item.pages) ?? null,
    }]
  })
}

function normalizeNode(raw: Record<string, unknown>): GraphNode | null {
  const id = asString(raw.id)
  if (!id) return null
  const unit = asString(raw.unit)
  const unitName = asString(raw.unit_name) || asString(raw.unitName) || unit
  const unitId = asString(raw.unit_id) || asString(raw.unitId) || (unit ? unitIdFor(unit) : '')
  const verifiedRaw = raw.equations_verified_in_slide_text ?? raw.equationsVerified
  return {
    id,
    label: asString(raw.label) || id,
    unit,
    unitName,
    unitId,
    type: asString(raw.type) || 'concept',
    definition: asString(raw.definition),
    definitionNote: asString(raw.definition_note) || asString(raw.definitionNote),
    slideExcerpt: asString(raw.slide_excerpt) || asString(raw.slideExcerpt),
    equations: readEquations(raw.equations),
    equationsVerified: typeof verifiedRaw === 'boolean' ? verifiedRaw : null,
    source: normalizeSource(raw.source),
  }
}

function normalizeSource(value: unknown): SourceRef | null {
  if (!isRecord(value)) return null
  const file = asString(value.file)
  const link = asString(value.link)
  if (!file && !link) return null
  return {
    file,
    fileId: asString(value.file_id) || asString(value.fileId),
    link,
    page: asNumber(value.page) ?? null,
    slideTitle: asString(value.slide_title) || asString(value.slideTitle),
  }
}

function normalizeEdge(raw: Record<string, unknown>, index: number, nodes: Map<string, GraphNode>): GraphEdge | null {
  const source = asString(raw.source)
  const target = asString(raw.target)
  const relation = asString(raw.relation)
  if (!source || !target || !relation) return null
  const evidence = normalizeEvidence(raw.evidence) || normalizeEvidence(raw.citation)
  const basis = asString(raw.basis) || (evidence ? 'grounded' : 'inferred')
  const id = asString(raw.id) || `edge-${index + 1}-${source}-${target}-${relation}`
  const crossFlag = raw.cross_unit ?? raw.crossUnit
  return {
    id,
    source,
    target,
    relation,
    basis,
    note: asString(raw.note),
    crossUnit: typeof crossFlag === 'boolean' ? crossFlag : crossesUnits({ source, target }, nodes),
    evidence,
  }
}

function normalizeEvidence(value: unknown): Evidence | null {
  if (!isRecord(value)) return null
  const quote = asString(value.quote)
  const link = asString(value.link)
  const file = asString(value.file)
  if (!quote && !link && !file) return null
  return {
    file,
    fileId: asString(value.file_id) || asString(value.fileId),
    link,
    page: asNumber(value.page) ?? null,
    quote,
    kind: asString(value.kind),
  }
}

function unitNode(unit: UnitInfo): GraphNode {
  return {
    id: unit.id,
    label: unit.label,
    unit: unit.unit,
    unitName: unit.label,
    unitId: unit.id,
    type: 'unit',
    definition: '',
    definitionNote: '',
    slideExcerpt: '',
    equations: [],
    equationsVerified: null,
    source: null,
  }
}

function ensureUnit(units: Map<string, UnitInfo>, unit: string, label: string, unitId: string) {
  if (!unit && !unitId) return
  const id = unitId || unitIdFor(unit)
  if (units.has(id)) return
  units.set(id, {
    id,
    unit: unit || id.replace(/^unit-/, ''),
    label: label || unit || id,
    order: units.size + 1,
    files: [],
  })
}

function crossesUnits(edge: { source: string, target: string }, nodes: Map<string, GraphNode>): boolean {
  const source = nodes.get(edge.source)
  const target = nodes.get(edge.target)
  if (!source || !target) return false
  if (source.type === 'unit' || target.type === 'unit') return false
  return source.unit !== target.unit
}

function readEquations(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => (typeof item === 'string' && item.trim() ? [item.trim()] : []))
}

function unitIdFor(unit: string): string {
  return unit.startsWith('unit-') ? unit : `unit-${unit}`
}

function stringMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {}
  const out: Record<string, string> = {}
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string') out[key] = item
  }
  return out
}

function numMap(value: unknown): Record<string, number> | undefined {
  if (!isRecord(value)) return undefined
  const out: Record<string, number> = {}
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'number') out[key] = item
  }
  return out
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
