import type { VisibleGraph } from './filterGraph'
import { unitColors } from './palette'
import type { CourseGraph } from './schema'
import { isWeakEvidence } from './schema'

export interface GraphElement {
  data: Record<string, string>
}

export function buildElements(course: CourseGraph, visible: VisibleGraph, groupByUnit: boolean): GraphElement[] {
  const elements: GraphElement[] = []

  for (const unit of visible.units) {
    const colors = unitColors(unit.unit)
    elements.push({
      data: {
        id: unit.id,
        label: unit.label,
        kind: 'unit',
        type: 'unit',
        unit: unit.unit,
        color: colors.accent,
        fill: colors.fill,
        grouped: groupByUnit ? 'yes' : 'no',
      },
    })
  }

  for (const node of visible.nodes) {
    const colors = unitColors(node.unit)
    const data: Record<string, string> = {
      id: node.id,
      label: node.label,
      kind: 'concept',
      type: node.type,
      unit: node.unit,
      color: colors.accent,
      fill: colors.fill,
    }
    if (groupByUnit && node.unitId) data.parent = node.unitId
    elements.push({ data })
  }

  for (const edge of visible.edges) {
    elements.push({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        relation: edge.relation,
        basis: edge.basis,
        weak: isWeakEvidence(edge) ? 'yes' : 'no',
        cross: edge.crossUnit ? 'yes' : 'no',
      },
    })
  }

  void course
  return elements
}
