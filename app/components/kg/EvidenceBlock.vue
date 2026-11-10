<script setup lang="ts">
import type { Evidence } from '../../../lib/kg/schema'
import { WEAK_EVIDENCE_KIND } from '../../../lib/kg/schema'

defineProps<{ evidence: Evidence }>()

const { t } = useI18n()

function evidenceText(kind: string) {
  const key = `kg.evidence.${kind}`
  const translated = t(key)
  return translated === key ? (kind || t('kg.open_lecture')) : translated
}
</script>

<template>
  <div class="mt-1.5 rounded-md bg-base-200 px-2.5 py-2 text-xs leading-5">
    <span
      class="badge badge-sm mb-1"
      :class="evidence.kind === WEAK_EVIDENCE_KIND ? 'badge-warning' : 'badge-info'"
    >
      {{ evidenceText(evidence.kind) }}
    </span>
    <blockquote v-if="evidence.quote" class="border-l-2 border-primary/70 pl-2 text-base-content">
      「{{ evidence.quote }}」
    </blockquote>
    <a
      v-if="evidence.link"
      :href="evidence.link"
      target="_blank"
      rel="noopener noreferrer"
      class="mt-1 inline-block text-primary underline decoration-primary/30 underline-offset-2"
    >
      {{ evidence.file || t('kg.open_lecture') }}<template v-if="evidence.page != null"> · {{ t('kg.page', { page: evidence.page }) }}</template>
    </a>
    <p v-else-if="evidence.file" class="mt-1 text-base-content/70">
      {{ evidence.file }}<template v-if="evidence.page != null"> · {{ t('kg.page', { page: evidence.page }) }}</template>
    </p>
  </div>
</template>
