<script setup lang="ts">
import { renderLatex } from '../../../lib/kg/mathText'
import 'katex/dist/katex.min.css'

const props = defineProps<{
  equations: string[]
  verified: boolean | null
}>()

const { t } = useI18n()

const rows = computed(() => props.equations.map((tex) => ({
  tex,
  html: renderLatex(tex, true),
})))
</script>

<template>
  <section class="space-y-2">
    <div class="flex flex-wrap items-center gap-2">
      <h3 class="text-base font-semibold text-base-content">{{ t('kg.equations') }}</h3>
      <span v-if="verified === false" class="badge badge-warning badge-sm">{{ t('kg.unverified') }}</span>
      <span v-else-if="verified === true" class="badge badge-success badge-outline badge-sm" :title="t('kg.verified_title')">{{ t('kg.verified') }}</span>
    </div>
    <p v-if="verified === false" class="text-xs leading-5 text-warning">
      {{ t('kg.unverified_hint') }}
    </p>
    <div
      v-for="(row, index) in rows"
      :key="index"
      class="rounded-lg border bg-base-100 px-3 py-2"
      :class="verified === false ? 'border-warning/60' : 'border-base-300'"
    >
      <div v-if="row.html" class="overflow-x-auto text-base-content" v-html="row.html" />
      <p v-else class="overflow-x-auto font-mono text-sm">{{ row.tex }}</p>
      <details class="mt-1">
        <summary class="cursor-pointer text-[11px] text-base-content/50">{{ t('kg.latex') }}</summary>
        <p class="mt-1 break-all font-mono text-[11px] text-base-content/70">{{ row.tex }}</p>
      </details>
    </div>
  </section>
</template>
