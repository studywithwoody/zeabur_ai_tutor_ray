<script setup lang="ts">
import { renderMathHtml } from '../../../lib/kg/mathText'
import 'katex/dist/katex.min.css'

const props = defineProps<{ text?: string }>()
const html = computed(() => renderMathHtml(props.text ?? ''))
</script>

<template>
  <span class="math-text" v-html="html" />
</template>
