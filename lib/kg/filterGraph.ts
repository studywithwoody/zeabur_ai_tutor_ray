import type { CourseGraph, GraphEdge, GraphNode, UnitInfo } from './schema'
import { isWeakEvidence } from './schema'

export interface FilterInput {
  units: string[]
  types: string[]
  relations: string[]
  hideInferred: boolean
  hideWeak: boolean
  groupByUnit: boolean
  matchIds: Set<string> | null
  pinnedIds: Set<string>
}

export interface VisibleGraph {
  nodes: GraphNode[]
  units: UnitInfo[]
  edges: GraphEdge[]
}

export function applyFilters(course: CourseGraph, state: FilterInput): VisibleGraph {
  const unitOk = new Set(state.units)
  const typeOk = new Set(state.types)
  const relationOk = new Set(state.relations)

  const passesNode = (node: GraphNode) => unitOk.has(node.unit) && typeOk.has(node.type)
  let ids = new Set(course.nodes.filter(passesNode).map((node) => node.id))

  const edgeOk = (edge: GraphEdge) => {
    if (!relationOk.has(edge.relation)) return false
    if (state.hideInferred && edge.basis === 'inferred') return false
    if (state.hideWeak && isWeakEvidence(edge)) return false
    if (state.groupByUnit && edge.relation === 'part_of') return false
    return true
  }

  if (state.matchIds) {
    const seeds = new Set<string>()
    for (const id of state.matchIds) {
      if (ids.has(id)) seeds.add(id)
    }
    for (const id of state.pinnedIds) {
      if (ids.has(id)) seeds.add(id)
    }
    const expanded = new Set(seeds)
    for (const edge of course.edges) {
      if (!edgeOk(edge)) continue
      if (seeds.has(edge.source) && ids.has(edge.target)) expanded.add(edge.target)
      if (seeds.has(edge.target) && ids.has(edge.source)) expanded.add(edge.source)
    }
    ids = expanded
  }

  if (!state.groupByUnit) {
    const neededUnits = new Set<string>()
    for (const id of ids) {
      const node = course.nodeById.get(id)
      if (node?.unitId) neededUnits.add(node.unitId)
    }
    for (const unitId of neededUnits) ids.add(unitId)
  }

  const edges = course.edges.filter((edge) => edgeOk(edge) && ids.has(edge.source) && ids.has(edge.target))
  const nodes = course.nodes.filter((node) => ids.has(node.id))
  const unitIds = new Set(nodes.map((node) => node.unitId))
  if (!state.groupByUnit) {
    for (const id of ids) {
      const node = course.nodeById.get(id)
      if (node?.type === 'unit') unitIds.add(node.id)
    }
  }
  const units = course.units.filter((unit) => unitIds.has(unit.id))
  return { nodes, units, edges }
}
