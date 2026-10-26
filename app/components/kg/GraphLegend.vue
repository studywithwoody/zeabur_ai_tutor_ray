<script setup lang="ts">
const { t } = useI18n()
const explorer = useExplorer()
const { unitColor, edgeColor, currentTheme } = useKgColors()
const mastery = useState<Record<string, string>>('kg-mastery', () => ({}))
const showMastery = computed(() => Object.keys(mastery.value).length > 0)
const open = ref(true)

const shapes = computed(() => [
  { label: t('kg.types.concept'), shape: 'h-3.5 w-5 rounded' },
  { label: t('kg.types.equation'), shape: 'h-3.5 w-3.5 rotate-45' },
  { label: t('kg.types.law'), shape: 'h-3.5 w-4 [clip-path:polygon(30%_0,70%_0,100%_30%,100%_70%,70%_100%,30%_100%,0_70%,0_30%)]' },
  { label: t('kg.types.skill'), shape: 'h-3.5 w-5 rounded-full' },
])

const relations = computed(() => {
  const defined = Object.keys(explorer.course.value.meta.relations)
  const keys = defined.length ? defined : ['prerequisite', 'derived_from', 'applies_to', 'contrasts_with', 'part_of']
  return keys.map((key) => {
    const path = `kg.relations.${key}`
    const translated = t(path)
    return {
      key,
      label: translated === path ? key : translated,
      description: explorer.course.value.meta.relations[key] ?? '',
    }
  })
})

const stroke = computed(() => currentTheme().baseContent)

onMounted(() => {
  if (window.innerWidth < 1280) open.value = false
})
</script>

<template>
  <aside class="max-w-[min(100%-1.5rem,280px)] rounded-box border border-base-300 bg-base-100/95 text-xs text-base-content shadow-sm">
    <button type="button" class="flex w-full items-center justify-between px-3 py-2 font-semibold" :aria-expanded="open" @click="open = !open">
      {{ t('kg.legend.title') }}
      <span class="text-base-content/50">{{ open ? t('kg.legend.collapse') : t('kg.legend.expand') }}</span>
    </button>
    <div v-if="open" class="max-h-[46vh] space-y-3 overflow-y-auto border-t border-base-300 px-3 py-3">
      <div>
        <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-base-content/60">{{ t('kg.legend.shapes') }}</p>
        <ul class="grid grid-cols-2 gap-1.5">
          <li v-for="item in shapes" :key="item.label" class="flex items-center gap-2">
            <span class="inline-block border-2 border-primary bg-primary/15" :class="item.shape" />
            {{ item.label }}
          </li>
        </ul>
      </div>
      <div>
        <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-base-content/60">{{ t('kg.legend.colors') }}</p>
        <ul class="grid grid-cols-1 gap-1">
          <li v-for="unit in explorer.course.value.units" :key="unit.id" class="flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ background: unitColor(unit.unit).accent }" />
            <span class="truncate">{{ unit.label }}</span>
          </li>
        </ul>
      </div>
      <div v-if="showMastery">
        <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-base-content/60">{{ t('kg.mastery.legend') }}</p>
        <ul class="space-y-1">
          <li v-for="band in ['untried', 'low', 'mid', 'high']" :key="band" class="flex items-center gap-2">
            <span
              class="h-3 w-5 rounded-sm border-[3px] bg-base-100"
              :style="{ borderColor: band === 'untried' ? currentTheme().baseContent : band === 'low' ? currentTheme().error : band === 'mid' ? currentTheme().warning : currentTheme().success }"
            />
            {{ t(`kg.mastery.${band}`) }}
          </li>
        </ul>
      </div>
      <div>
        <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-base-content/60">{{ t('kg.legend.lines') }}</p>
        <ul class="space-y-1">
          <li v-for="relation in relations" :key="relation.key" class="flex items-center gap-2" :title="relation.description">
            <svg width="36" height="10" aria-hidden="true">
              <line x1="1" y1="5" x2="30" y2="5" :stroke="edgeColor(relation.key)" stroke-width="2" />
              <polygon v-if="relation.key !== 'contrasts_with'" points="30,2 36,5 30,8" :fill="edgeColor(relation.key)" />
            </svg>
            <span>{{ relation.label }}</span>
          </li>
        </ul>
      </div>
      <div>
        <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-base-content/60">{{ t('kg.legend.evidence') }}</p>
        <ul class="space-y-1">
          <li class="flex items-center gap-2">
            <svg width="36" height="8" aria-hidden="true"><line x1="0" y1="4" x2="36" y2="4" :stroke="stroke" stroke-width="2" /></svg>
            {{ t('kg.legend.solid') }}
          </li>
          <li class="flex items-center gap-2">
            <svg width="36" height="8" aria-hidden="true"><line x1="0" y1="4" x2="36" y2="4" :stroke="stroke" stroke-width="2" stroke-dasharray="1.5 3" /></svg>
            {{ t('kg.legend.dotted') }}
          </li>
          <li class="flex items-center gap-2">
            <svg width="36" height="8" aria-hidden="true"><line x1="0" y1="4" x2="36" y2="4" :stroke="stroke" stroke-width="2" stroke-dasharray="6 4" /></svg>
            {{ t('kg.legend.dashed') }}
          </li>
        </ul>
      </div>
      <p class="text-[11px] leading-4 text-base-content/60">{{ t('kg.legend.zoom_hint') }}</p>
    </div>
  </aside>
</template>
