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
const pieceLabels: Record<PieceId, string> = { left: '左侧', upper: '右上', lower: '右下' }
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
const visibleZones = computed(() => clueZones.filter((zone) => zone.side === props.side
  && (props.foundClueIds.includes(zone.id) || (props.assembled && props.wiped && zone.id === props.nextClueId))))
const canWipe = computed(() => props.assembled && props.side === 'front' && props.tool === 'wipe' && !props.wiped)
const wipeAction = ref<HTMLButtonElement | null>(null)
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
  ;(event.currentTarget as SVGGElement).focus({ preventScroll: true })
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

const snapPiece = (piece: PieceId) => {
  if (props.assembled || props.side !== 'front' || snappedPieces.value[piece]) return
  pieceOffsets.value[piece] = { x: 0, y: 0 }
  snappedPieces.value[piece] = true
  emit('progress', snappedCount.value)
  if (pieces.every((entry) => snappedPieces.value[entry])) emit('assembled')
}

const finishPieceDrag = (event: PointerEvent) => {
  if (!drag.value || drag.value.pointerId !== event.pointerId) return
  const piece = drag.value.piece
  drag.value = null
  const offset = pieceOffsets.value[piece]
  if (Math.hypot(offset.x, offset.y) <= 45) snapPiece(piece)
  if (svg.value?.hasPointerCapture(event.pointerId)) svg.value.releasePointerCapture(event.pointerId)
}

const onZoneClick = (id: string, event: Event) => {
  ;(event.currentTarget as SVGGElement).focus({ preventScroll: true })
  if (props.foundClueIds.includes(id)) emit('review', id)
  else emit('clue', id)
}

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
  if (!canWipe.value) return
  wipeAction.value?.focus({ preventScroll: true })
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

const clearMud = () => {
  if (canWipe.value) emit('wiped')
}

onMounted(drawMud)
watch(() => props.wiped, (wiped) => {
  if (wiped) canvas.value?.getContext('2d')?.clearRect(0, 0, width, height)
  else drawMud()
})
</script>

<template>
  <div class="list-artifact" :class="{ 'wiping': assembled && tool === 'wipe' && side === 'front' && !wiped, 'assembling': !assembled }" @pointermove="moveLight">
    <svg ref="svg" class="list-artifact-paper" :viewBox="`0 0 ${width} ${height}`" role="group" :aria-label="assembled ? (side === 'front' ? '虚构转送名单正面，姓名处为纸张真实缺口' : '虚构转送名单背面，含方框图例和另存回执注记') : `三片分开的名单纸片，已有${snappedCount}片对齐；可拖动纸片，或聚焦后按回车或空格对齐`" @pointermove="movePiece" @pointerup="finishPieceDrag" @pointercancel="finishPieceDrag">
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
        <g v-for="piece in pieces" :key="piece" :class="['list-piece', { snapped: snappedPieces[piece], dragging: drag?.piece === piece }]" :transform="`translate(${pieceOffsets[piece].x} ${pieceOffsets[piece].y})`" role="button" :tabindex="!assembled && side === 'front' && !snappedPieces[piece] ? 0 : -1" :aria-disabled="assembled || side !== 'front' || snappedPieces[piece]" :aria-label="`${pieceLabels[piece]}纸片${snappedPieces[piece] ? '已对齐' : '，按回车或空格对齐'}`" @pointerdown="startPieceDrag(piece, $event)" @keydown.enter.prevent.stop="snapPiece(piece)" @keydown.space.prevent.stop="snapPiece(piece)">
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

      <g v-for="zone in visibleZones" :key="zone.id" :class="foundClueIds.includes(zone.id) ? 'list-found-zone' : 'list-discovery-zone'" role="button" tabindex="0" :aria-label="`${foundClueIds.includes(zone.id) ? '回看' : '阅读'}${zone.label}线索卡`" @click.stop="onZoneClick(zone.id, $event)" @keydown.enter.prevent.stop="onZoneClick(zone.id, $event)" @keydown.space.prevent.stop="onZoneClick(zone.id, $event)">
        <template v-if="!foundClueIds.includes(zone.id)">
          <rect :x="zone.x" :y="zone.y" :width="zone.width" :height="zone.height" rx="18" />
          <g class="list-discovery-label" aria-hidden="true">
            <rect :x="zone.x" :y="zone.y - 43" width="262" height="34" rx="3" />
            <text :x="zone.x + 13" :y="zone.y - 19">点击或按回车阅读</text>
          </g>
        </template>
        <template v-else>
          <circle :cx="zone.x + 12" :cy="zone.y + 12" r="16" /><path :d="`M${zone.x + 5} ${zone.y + 12} l5 5 l10 -11`" />
        </template>
      </g>
    </svg>

    <canvas
      ref="canvas"
      class="list-mud-canvas"
      :class="{ visible: assembled && side === 'front' && !wiped }"
      :width="width"
      :height="height"
      aria-label="覆盖备用物料末字的泥点，选择轻拭工具后可拖动清理，或使用清理泥点按钮"
      @pointerdown="startWipe"
      @pointermove="moveWipe"
      @pointerup="finishWipe"
      @pointercancel="finishWipe"
    ></canvas>
    <button v-if="assembled && side === 'front' && (tool === 'wipe' || wiped)" ref="wipeAction" type="button" class="list-wipe-action" :aria-disabled="wiped" :tabindex="wiped ? -1 : 0" @click.stop="clearMud">{{ wiped ? '泥点已清' : '清理泥点（回车 / 空格）' }}</button>
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
.list-piece:focus-visible { outline: 5px solid #ffe1a1; outline-offset: -12px; }
.list-piece.dragging { transition: none; cursor: grabbing; }
.assembling .list-piece:not(.snapped) { cursor: grab; }
.list-assembly-guide { fill: rgba(211,195,160,.025); stroke: rgba(222,205,169,.43); stroke-width: 3; stroke-dasharray: 15 13; pointer-events: none; }
.list-discovery-zone > rect { fill: rgba(168,95,72,.07); stroke: rgba(125,64,47,.62); stroke-width: 3; stroke-dasharray: 12 11; cursor: help; transition: fill .2s ease, stroke .2s ease; }
.list-discovery-zone > rect { cursor: pointer; }
.list-discovery-zone:hover > rect,
.list-discovery-zone:focus-visible > rect { fill: rgba(168,95,72,.18); stroke: #743b2e; }
.list-discovery-zone:focus-visible > rect { stroke-width: 6; stroke-dasharray: none; }
.list-discovery-label { pointer-events: none; }
.list-discovery-label rect { fill: #e9dcc4; stroke: #814a3b; stroke-width: 2; stroke-dasharray: none; }
.list-discovery-label text { fill: #58372c; font-family: var(--font-sans); font-size: 21px; font-weight: 700; letter-spacing: .03em; }
.list-found-zone { cursor: pointer; }
.list-found-zone circle { fill: #6d332a; stroke: #e2d0b3; stroke-width: 3; }
.list-found-zone path { fill: none; stroke: #f2e8d6; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.list-found-zone:focus-visible circle { stroke: #ffe1a1; stroke-width: 8; }
.list-wipe-action { position: absolute; z-index: 2; left: 50%; bottom: 0; transform: translateX(-50%); padding: 10px 16px; border: 2px solid #d7bf95; border-radius: 3px; color: #f5ead6; background: #423b2c; font: 600 14px/1.4 var(--font-sans); white-space: nowrap; cursor: pointer; }
.list-wipe-action:focus-visible { outline: 3px solid #ffe1a1; outline-offset: 4px; }
.list-wipe-action[aria-disabled="true"] { cursor: default; }
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
