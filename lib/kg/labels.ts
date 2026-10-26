export const TYPE_LABEL: Record<string, string> = {
  concept: '概念',
  equation: '公式',
  law: '定律',
  skill: '技能',
  unit: '單元',
}

export const RELATION_LABEL: Record<string, string> = {
  prerequisite: '先備',
  derived_from: '衍生',
  applies_to: '應用',
  contrasts_with: '對比',
  part_of: '歸屬',
}

export const BASIS_LABEL: Record<string, string> = {
  grounded: '講義依據',
  inferred: '推論',
  grounded_kinds: '證據強度',
}

export const EVIDENCE_LABEL: Record<string, string> = {
  targeted_phrase: '強證據',
  label_mention_nearby: '弱證據',
  source_slide: '來源頁',
}

export function typeLabel(type: string): string {
  return TYPE_LABEL[type] ?? type
}

export function relationLabel(relation: string): string {
  return RELATION_LABEL[relation] ?? relation
}

export function basisLabel(basis: string): string {
  return BASIS_LABEL[basis] ?? basis
}

export function evidenceLabel(kind: string): string {
  return EVIDENCE_LABEL[kind] ?? (kind || '出處')
}

export function shortChapter(label: string): string {
  const match = /^Ch\s*\d+/i.exec(label.trim())
  return match ? match[0].replace(/\s+/g, ' ') : label
}

export function formatTimestamp(iso: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('zh-TW', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Taipei',
  }).format(date)
}
