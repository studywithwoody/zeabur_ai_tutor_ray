<script setup lang="ts">
import type { Core, LayoutOptions } from 'cytoscape'
import { graphStylesheet } from '../../../lib/kg/graphStyle'
import { masteryOutline, readCanvasTheme, unitColorsFor } from '../../../lib/kg/themeColors'

const { t } = useI18n()
const explorer = useExplorer()
const themeName = useState<string>('theme', () => 'dark')
const mastery = useState<Record<string, string>>('kg-mastery', () => ({}))
const coverage = useState<Record<string, number>>('kg-coverage', () => ({}))
const host = ref<HTMLElement | null>(null)
const ready = ref(false)
const zoomLabel = ref('100%')
const tip = ref<{ label: string, x: number, y: number } | null>(null)

let cy: Core | null = null
let resizeObserver: ResizeObserver | null = null
let layoutRunning = false
let focusQueued = false

function layoutOptions(name: 'dagre' | 'fcose', randomize: boolean): LayoutOptions {
  if (name === 'dagre') {
    return {
      name: 'dagre',
      rankDir: 'TB',
      nodeSep: 30,
      edgeSep: 12,
      rankSep: 64,
      ranker: 'network-simplex',
      acyclicer: 'greedy',
      fit: true,
      padding: 36,
      animate: false,
      spacingFactor: 1.08,
    } as LayoutOptions
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return {
    name: 'fcose',
    quality: 'default',
    randomize,
    animate: !reduce,
    animationDuration: 480,
    fit: true,
    padding: 36,
    packComponents: true,
    nodeSeparation: 90,
    idealEdgeLength: 140,
    nodeRepulsion: 7000,
    gravity: 0.22,
    numIter: 2200,
    tile: true,
  } as LayoutOptions
}

function paintTheme() {
  if (!cy) return
  const theme = readCanvasTheme()
  cy.batch(() => {
    cy!.nodes().forEach((node) => {
      const colors = unitColorsFor(String(node.data('unit') || ''), theme)
      node.data('color', colors.accent)
      node.data('fill', colors.fill)
      if (!node.data('baseLabel')) node.data('baseLabel', node.data('label'))
      const outline = masteryOutline(mastery.value[String(node.id())], theme)
      if (outline) node.data('outline', outline)
      else node.removeData('outline')
      const count = coverage.value[String(node.id())]
      if (typeof count === 'number') node.data('coverage', String(count))
      else node.removeData('coverage')
    })
  })
  cy.style(graphStylesheet(theme) as never)
}

function updateZoom() {
  if (!cy) return
  zoomLabel.value = `${Math.round(cy.zoom() * 100)}%`
}

function applyHighlight() {
  if (!cy) return
  cy.batch(() => {
    cy!.elements().removeClass('faded highlight neighbor')
    const nodeId = explorer.selectedNodeId.value
    const edgeId = explorer.selectedEdgeId.value
    if (!nodeId && !edgeId) return
    cy!.elements().addClass('faded')
    if (nodeId) {
      const node = cy!.getElementById(nodeId)
      if (node.empty()) return
      const focus = node.data('kind') === 'unit'
        ? node.union(node.descendants()).union(node.descendants().connectedEdges())
        : node.closedNeighborhood()
      focus.removeClass('faded')
      focus.nodes().addClass('neighbor')
      node.addClass('highlight')
      focus.nodes().parents().removeClass('faded')
      return
    }
    const edge = cy!.getElementById(edgeId || '')
    if (edge.empty()) return
    const focus = edge.union(edge.connectedNodes())
    focus.removeClass('faded')
    edge.addClass('highlight')
    edge.connectedNodes().addClass('neighbor')
    edge.connectedNodes().parents().removeClass('faded')
  })
}

function focusSelection() {
  if (!cy) return
  const id = explorer.selectedNodeId.value || explorer.selectedEdgeId.value
  if (!id) return
  const ele = cy.getElementById(id)
  if (ele.empty()) return
  const kind = ele.data('kind')
  const hood = kind === 'unit'
    ? ele.union(ele.descendants()).union(ele.descendants().connectedEdges())
    : kind
      ? ele.closedNeighborhood().union(ele.parent())
      : ele.union(ele.connectedNodes()).union(ele.connectedNodes().parent())
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  cy.animate(
    { fit: { eles: hood, padding: 72 } },
    {
      duration: reduce ? 0 : 280,
      complete: () => {
        if (!cy) return
        if (cy.zoom() > 1.35) {
          cy.zoom(1.35)
          cy.center(ele)
        }
        updateZoom()
      },
    },
  )
}

function runLayout(randomize = false) {
  if (!cy) return
  layoutRunning = true
  let settled = false
  const finish = () => {
    if (settled) return
    settled = true
    layoutRunning = false
    applyHighlight()
    updateZoom()
    if (focusQueued) {
      focusQueued = false
      focusSelection()
    }
  }
  const instance = cy.layout(layoutOptions(explorer.layout.value, randomize || explorer.layout.value === 'fcose'))
  instance.one('layoutstop', finish)
  instance.run()
  window.setTimeout(finish, explorer.layout.value === 'fcose' ? 2600 : 800)
}

onMounted(async () => {
  const [{ default: cytoscape }, dagreMod, fcoseMod] = await Promise.all([
    import('cytoscape'),
    import('cytoscape-dagre'),
    import('cytoscape-fcose'),
  ])
  const dagre = dagreMod.default
  const fcose = fcoseMod.default
  const register = (extension: Parameters<typeof cytoscape.use>[0]) => {
    try {
      cytoscape.use(extension)
    } catch {
      // HMR can register the same extension twice.
    }
  }
  register(dagre)
  register(fcose)

  if (!host.value) return
  cy = cytoscape({
    container: host.value,
    elements: explorer.elements.value,
    style: graphStylesheet(readCanvasTheme()) as never,
    layout: layoutOptions(explorer.layout.value, false),
    minZoom: 0.06,
    maxZoom: 2.6,
    wheelSensitivity: 0.22,
    boxSelectionEnabled: false,
    autounselectify: true,
  })

  cy.on('tap', 'node', (event) => {
    explorer.selectNode(event.target.id())
  })
  cy.on('tap', 'edge', (event) => {
    explorer.selectEdge(event.target.id())
  })
  cy.on('tap', (event) => {
    if (event.target === cy) explorer.clearSelection()
  })
  cy.on('mouseover', 'node[kind = "concept"]', (event) => {
    const point = event.target.renderedPosition()
    tip.value = { label: event.target.data('label'), x: point.x, y: point.y }
  })
  cy.on('mouseout', 'node', () => {
    tip.value = null
  })
  cy.on('viewport', () => {
    tip.value = null
    updateZoom()
  })
  cy.on('mouseover', 'edge', (event) => event.target.addClass('hover'))
  cy.on('mouseout', 'edge', (event) => event.target.removeClass('hover'))

  resizeObserver = new ResizeObserver(() => {
    cy?.resize()
    updateZoom()
  })
  resizeObserver.observe(host.value)

  explorer.bindGraphControls({
    fit() {
      cy?.fit(undefined, 32)
      updateZoom()
    },
    zoomBy(factor: number) {
      if (!cy) return
      const level = Math.min(cy.maxZoom(), Math.max(cy.minZoom(), cy.zoom() * factor))
      cy.zoom({ level, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } })
      updateZoom()
    },
    relayout() {
      runLayout(true)
    },
  })

  paintTheme()
  ready.value = true
  updateZoom()
  if (explorer.selectedNodeId.value || explorer.selectedEdgeId.value) {
    focusQueued = true
    runLayout(false)
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      if (cy && explorer.layout.value === 'dagre') runLayout(false)
    })
  }
})

watch(explorer.elements, (elements) => {
  if (!cy) return
  tip.value = null
  cy.elements().remove()
  cy.add(elements)
  paintTheme()
  runLayout(false)
})

watch(themeName, async () => {
  await nextTick()
  paintTheme()
})

watch([mastery, coverage], () => paintTheme(), { deep: true })

watch(explorer.layout, () => {
  if (!cy) return
  runLayout(explorer.layout.value === 'fcose')
})

watch([explorer.selectedNodeId, explorer.selectedEdgeId], () => applyHighlight())

watch(explorer.focusKey, () => {
  if (!cy) return
  if (layoutRunning) focusQueued = true
  else focusSelection()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  cy?.destroy()
  cy = null
  explorer.bindGraphControls({ fit() {}, zoomBy() {}, relayout() {} })
})
</script>

<template>
  <div class="graph-stage relative h-full w-full bg-base-200">
    <!-- Cytoscape injects an unlayered `position: relative` rule that beats Tailwind's
         `absolute`, so the host must have an explicit height or the canvas collapses to 0. -->
    <div ref="host" class="h-full w-full" />
    <p v-if="!ready" class="pointer-events-none absolute inset-0 grid place-items-center text-sm text-base-content/70">
      {{ t('kg.loading') }}
    </p>
    <p
      v-else-if="explorer.visible.value.nodes.length === 0"
      class="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center text-sm text-base-content/70"
    >
      {{ t('kg.empty_filter') }}
    </p>
    <p
      v-if="ready && explorer.course.value.edges.length === 0"
      class="absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-full bg-warning/20 px-3 py-1 text-xs text-warning-content shadow-sm"
    >
      {{ t('kg.nodes_only') }}
    </p>
    <div
      v-if="tip"
      class="pointer-events-none absolute z-20 max-w-xs -translate-x-1/2 -translate-y-full rounded-md bg-neutral px-2 py-1 text-xs text-neutral-content shadow"
      :style="{ left: `${tip.x}px`, top: `${tip.y - 12}px` }"
    >
      {{ tip.label }}
    </div>
    <p class="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full bg-base-100/90 px-3 py-1 text-xs text-base-content/80 shadow-sm">
      {{ t('kg.stats', { nodes: explorer.visible.value.nodes.length, edges: explorer.visible.value.edges.length, zoom: zoomLabel }) }}
    </p>
  </div>
</template>
