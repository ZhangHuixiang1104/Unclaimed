<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import frontPaper from '../../assets/objects/list-front.png'
import backPaper from '../../assets/objects/list-back.png'
import mudOverlay from '../../../../stuffs/名单/美术母版/list_mud_overlay.png'
import rakingTexture from '../../../../stuffs/名单/美术母版/list_raking_light_texture.png'

const props = defineProps<{
  side: 'front' | 'back'
  tool: 'none' | 'side' | 'backlight' | 'zoom' | 'wipe'
  wiped: boolean
  assembled: boolean
  nextClueId: string | null
  foundClueIds: string[]
}>()
const emit = defineEmits<{ wiped: []; assembled: []; progress: [count: number]; clue: [id: string]; review: [id: string] }>()

const width = 1448
const height = 1086
type PieceId = 'left' | 'upper' | 'lower'
const pieces: PieceId[] = ['left', 'upper', 'lower']
const scatteredOffsets: Record<PieceId, { x: number; y: number }> = {
  left: { x: -65, y: 24 },
  upper: { x: 70, y: -53 },
  lower: { x: 60, y: 52 },
}
const pieceOffsets = ref<Record<PieceId, { x: number; y: number }>>({
  left: { ...scatteredOffsets.left },
  upper: { ...scatteredOffsets.upper },
  lower: { ...scatteredOffsets.lower },
})
const snappedPieces = ref<Record<PieceId, boolean>>({ left: false, upper: false, lower: false })
const snappedCount = computed(() => pieces.filter((piece) => snappedPieces.value[piece]).length)
const svg = ref<SVGSVGElement | null>(null)
const drag = ref<{ piece: PieceId; pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null)
const clueZones = [
  { id: 'list-task', side: 'front', x: 235, y: 590, width: 740, height: 122, label: '第三行记录' },
  { id: 'list-key', side: 'back', x: 235, y: 350, width: 800, height: 228, label: '背面记号图例' },
  { id: 'list-stub', side: 'back', x: 235, y: 665, width: 610, height: 224, label: '另存回执与缺口' },
] as const
const activeZone = computed(() => props.assembled && props.wiped
  ? clueZones.find((zone) => zone.id === props.nextClueId && zone.side === props.side)
  : undefined)
const foundZones = computed(() => clueZones.filter((zone) => zone.side === props.side && props.foundClueIds.includes(zone.id)))
const mudBounds = { x: 550, y: 475, width: 200, height: 100 }
const canvas = ref<HTMLCanvasElement | null>(null)
const lightPosition = ref({ x: 420, y: 450 })
let initialOpaquePixels = 0
let drawing = false
let previousPoint: { x: number; y: number } | null = null

const svgPoint = (event: PointerEvent) => {
  const rect = svg.value!.getBoundingClientRect()
  return { x: ((event.clientX - rect.left) / rect.width) * width, y: ((event.clientY - rect.top) / rect.height) * height }
}

const startPieceDrag = (piece: PieceId, event: PointerEvent) => {
  if (props.assembled || props.side !== 'front' || snappedPieces.value[piece]) return
  const point = svgPoint(event)
  const offset = pieceOffsets.value[piece]
  drag.value = { piece, pointerId: event.pointerId, startX: point.x, startY: point.y, baseX: offset.x, baseY: offset.y }
  svg.value?.setPointerCapture(event.pointerId)
  event.preventDefault()
  event.stopPropagation()
}

const movePiece = (event: PointerEvent) => {
  if (!drag.value || drag.value.pointerId !== event.pointerId) return
  const point = svgPoint(event)
  pieceOffsets.value[drag.value.piece] = {
    x: Math.max(-135, Math.min(135, drag.value.baseX + point.x - drag.value.startX)),
    y: Math.max(-115, Math.min(115, drag.value.baseY + point.y - drag.value.startY)),
  }
}

const finishPieceDrag = (event: PointerEvent) => {
  if (!drag.value || drag.value.pointerId !== event.pointerId) return
  const piece = drag.value.piece
  drag.value = null
  const offset = pieceOffsets.value[piece]
  if (Math.hypot(offset.x, offset.y) <= 45) {
    pieceOffsets.value[piece] = { x: 0, y: 0 }
    snappedPieces.value[piece] = true
    emit('progress', snappedCount.value)
    if (pieces.every((entry) => snappedPieces.value[entry])) emit('assembled')
  }
  if (svg.value?.hasPointerCapture(event.pointerId)) svg.value.releasePointerCapture(event.pointerId)
}

const onZoneClick = (id: string) => emit('clue', id)

watch(() => props.assembled, (assembled) => {
  if (!assembled) return
  pieceOffsets.value = { left: { x: 0, y: 0 }, upper: { x: 0, y: 0 }, lower: { x: 0, y: 0 } }
  snappedPieces.value = { left: true, upper: true, lower: true }
}, { immediate: true })

const countMudPixels = () => {
  const context = canvas.value?.getContext('2d', { willReadFrequently: true })
  if (!context) return 0
  const pixels = context.getImageData(mudBounds.x, mudBounds.y, mudBounds.width, mudBounds.height).data
  let count = 0
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] > 48) count += 1
  }
  return count
}

const drawMud = () => {
  const context = canvas.value?.getContext('2d', { willReadFrequently: true })
  if (!context) return
  context.clearRect(0, 0, width, height)
  if (props.wiped) return
  const image = new Image()
  image.onload = () => {
    if (!canvas.value || props.wiped) return
    context.drawImage(image, mudBounds.x, mudBounds.y, mudBounds.width, mudBounds.height)
    initialOpaquePixels = countMudPixels()
  }
  image.src = mudOverlay
}

const paperPoint = (event: PointerEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * width,
    y: ((event.clientY - rect.top) / rect.height) * height,
  }
}

const moveLight = (event: PointerEvent) => {
  if (props.tool === 'side') lightPosition.value = paperPoint(event)
}

const erase = (point: { x: number; y: number }) => {
  const context = canvas.value?.getContext('2d')
  if (!context) return
  context.globalCompositeOperation = 'destination-out'
  context.lineWidth = 54
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.beginPath()
  context.moveTo(previousPoint?.x ?? point.x, previousPoint?.y ?? point.y)
  context.lineTo(point.x, point.y)
  context.stroke()
  context.globalCompositeOperation = 'source-over'
  previousPoint = point
}

const startWipe = (event: PointerEvent) => {
  if (!props.assembled || props.side !== 'front' || props.tool !== 'wipe' || props.wiped) return
  drawing = true
  previousPoint = null
  canvas.value?.setPointerCapture(event.pointerId)
  erase(paperPoint(event))
  event.preventDefault()
}

const moveWipe = (event: PointerEvent) => {
  if (drawing) erase(paperPoint(event))
}

const finishWipe = () => {
  if (!drawing) return
  drawing = false
  previousPoint = null
  if (initialOpaquePixels > 0 && countMudPixels() / initialOpaquePixels <= 0.3) {
    emit('wiped')
  }
}

onMounted(drawMud)
watch(() => props.wiped, (wiped) => {
  if (wiped) canvas.value?.getContext('2d')?.clearRect(0, 0, width, height)
  else drawMud()
})
</script>

<template>
  <div class="list-artifact" :class="{ 'wiping': assembled && tool === 'wipe' && side === 'front' && !wiped, 'assembling': !assembled }" @pointermove="moveLight">
    <svg ref="svg" class="list-artifact-paper" :viewBox="`0 0 ${width} ${height}`" role="img" :aria-label="assembled ? (side === 'front' ? '虚构转送名单正面，姓名处为纸张真实缺口' : '虚构转送名单背面，含方框图例和另存回执注记') : `三片分开的名单纸片，已有${snappedCount}片对齐`" @pointermove="movePiece" @pointerup="finishPieceDrag" @pointercancel="finishPieceDrag">
      <desc v-if="side === 'front'">转送事项：转一，器材；转二，备用物料；转三，后随二人。姓名栏的纸张缺失。</desc>
      <desc v-else>背面注记：开口框，待交接；框内加点，已有接收记录。回执另存。随借与交回之间的纸张缺失。</desc>
      <defs>
        <clipPath id="list-outer-clip" clipPathUnits="userSpaceOnUse">
          <path d="M81 77 Q112 70 175 76 L1359 76 Q1373 77 1371 102 L1373 983 Q1372 1013 1350 1011 L88 1010 Q73 1007 76 986 L76 107 Q75 82 81 77 Z" />
        </clipPath>
        <clipPath id="list-piece-left" clipPathUnits="userSpaceOnUse">
          <path d="M0 0 H721 L711 185 L725 340 L716 470 L742 548 L701 676 L684 842 L696 1086 H0 Z" />
        </clipPath>
        <clipPath id="list-piece-upper" clipPathUnits="userSpaceOnUse">
          <path d="M729 0 H1448 V555 L1260 558 L1083 545 L912 559 L750 552 L724 470 L733 340 L719 185 Z" />
        </clipPath>
        <clipPath id="list-piece-lower" clipPathUnits="userSpaceOnUse">
          <path d="M750 562 L912 569 L1083 555 L1260 568 L1448 565 V1086 H704 L692 842 L709 676 Z" />
        </clipPath>
        <mask id="list-physical-missing" maskUnits="userSpaceOnUse" x="0" y="0" width="1448" height="1086">
          <rect width="1448" height="1086" fill="white" />
          <path d="M526 861 L550 850 L573 863 L601 844 L626 858 L649 848 L671 865 L700 851 L731 867 L750 852 L778 870 L800 859 L818 881 L829 1086 H507 L513 979 L504 941 L520 911 Z" fill="black" />
          <path d="M1101 979 L1124 968 L1147 982 L1173 963 L1194 977 L1219 965 L1247 983 L1271 970 L1295 985 L1321 975 L1343 989 L1354 1086 H1087 Z" fill="black" />
        </mask>
        <radialGradient id="list-raking-gradient" gradientUnits="userSpaceOnUse" :cx="lightPosition.x" :cy="lightPosition.y" r="340">
          <stop offset="0" stop-color="white" />
          <stop offset="0.36" stop-color="white" stop-opacity=".72" />
          <stop offset="1" stop-color="black" />
        </radialGradient>
        <mask id="list-raking-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1448" height="1086">
          <rect width="1448" height="1086" fill="url(#list-raking-gradient)" />
        </mask>
      </defs>

      <path v-if="!assembled" class="list-assembly-guide" d="M81 77 Q112 70 175 76 L1359 76 Q1373 77 1371 102 L1373 983 Q1372 1013 1350 1011 L88 1010 Q73 1007 76 986 L76 107 Q75 82 81 77 Z" />
      <g>
        <g v-for="piece in pieces" :key="piece" :class="['list-piece', { snapped: snappedPieces[piece], dragging: drag?.piece === piece }]" :transform="`translate(${pieceOffsets[piece].x} ${pieceOffsets[piece].y})`" @pointerdown="startPieceDrag(piece, $event)">
          <g clip-path="url(#list-outer-clip)">
          <g :clip-path="`url(#list-piece-${piece})`">
          <g mask="url(#list-physical-missing)">
            <image :href="side === 'front' ? frontPaper : backPaper" width="1448" height="1086" />
            <image v-if="tool === 'side'" :href="rakingTexture" x="78" y="75" width="1294" height="936" preserveAspectRatio="xMidYMid slice" opacity=".13" mask="url(#list-raking-mask)" />


          </g>
          </g>
          </g>
        </g>
      </g>

      <g v-if="activeZone" class="list-discovery-zone" :aria-label="activeZone.label" @click.stop="onZoneClick(activeZone.id)">
        <rect :x="activeZone.x" :y="activeZone.y" :width="activeZone.width" :height="activeZone.height" rx="18" />
        <g class="list-discovery-label" aria-hidden="true">
          <rect :x="activeZone.x" :y="activeZone.y - 43" width="262" height="34" rx="3" />
          <text :x="activeZone.x + 13" :y="activeZone.y - 19">点击阅读这处记录</text>
        </g>
      </g>
      <g v-for="zone in foundZones" :key="zone.id" class="list-found-zone" role="button" :aria-label="`回看${zone.label}线索卡`" @click.stop="emit('review', zone.id)">
        <circle :cx="zone.x + 12" :cy="zone.y + 12" r="16" /><path :d="`M${zone.x + 5} ${zone.y + 12} l5 5 l10 -11`" />
      </g>
    </svg>

    <canvas
      ref="canvas"
      class="list-mud-canvas"
      :class="{ visible: assembled && side === 'front' && !wiped }"
      :width="width"
      :height="height"
      aria-label="覆盖备用物料末字的泥点，可选择轻拭工具后拖动鼠标清理"
      @pointerdown="startWipe"
      @pointermove="moveWipe"
      @pointerup="finishWipe"
      @pointercancel="finishWipe"
    ></canvas>
  </div>
</template>

<style scoped>
.list-artifact {
  width: min(74%, 610px, 68vh);
  aspect-ratio: 4 / 3;
  position: absolute;
  z-index: 1;
  left: 50%;
  top: 47%;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 20px 27px rgba(0,0,0,.45));
  transition: transform .25s ease;
}
.list-artifact-paper,
.list-mud-canvas { width: 100%; height: 100%; display: block; position: absolute; inset: 0; }
.list-artifact-paper { touch-action: none; }
.list-piece { transition: transform .32s ease; }
.list-piece.dragging { transition: none; cursor: grabbing; }
.assembling .list-piece:not(.snapped) { cursor: grab; }
.list-assembly-guide { fill: rgba(211,195,160,.025); stroke: rgba(222,205,169,.43); stroke-width: 3; stroke-dasharray: 15 13; pointer-events: none; }
.list-discovery-zone > rect { fill: rgba(168,95,72,.07); stroke: rgba(125,64,47,.62); stroke-width: 3; stroke-dasharray: 12 11; cursor: help; transition: fill .2s ease, stroke .2s ease; }
.list-discovery-zone > rect { cursor: pointer; }
.list-discovery-zone:hover > rect { fill: rgba(168,95,72,.18); stroke: #743b2e; }
.list-discovery-label { pointer-events: none; }
.list-discovery-label rect { fill: #e9dcc4; stroke: #814a3b; stroke-width: 2; stroke-dasharray: none; }
.list-discovery-label text { fill: #58372c; font-family: var(--font-sans); font-size: 21px; font-weight: 700; letter-spacing: .03em; }
.list-found-zone { cursor: pointer; }
.list-found-zone circle { fill: #6d332a; stroke: #e2d0b3; stroke-width: 3; }
.list-found-zone path { fill: none; stroke: #f2e8d6; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.list-ink { fill: #40382d; font-family: var(--font-serif); font-size: 45px; font-weight: 600; letter-spacing: .04em; }
.list-title { font-size: 58px; letter-spacing: .12em; }
.list-rule { fill: none; stroke: rgba(73,60,43,.58); stroke-width: 2; }
.list-name-line { stroke-dasharray: 9 10; }
.list-mark { fill: none; stroke: #493b2f; stroke-width: 4; stroke-linecap: square; stroke-linejoin: miter; }
.list-mark-dot { fill: #493b2f; }
.list-back-ink { font-size: 40px; }
.list-mud-canvas { opacity: 0; pointer-events: none; filter: grayscale(1) sepia(.14) saturate(.55); touch-action: none; }
.list-mud-canvas.visible { opacity: 1; }
.list-artifact.wiping .list-mud-canvas { pointer-events: auto; cursor: crosshair; }
:global(.tool-zoom) .list-artifact { transform: translate(-50%, -50%) scale(1.08); }
</style>
