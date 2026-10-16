<script setup lang="ts">
import type { ArchiveObject, ObjectRecord } from '../../types/archive'

interface RouteNode {
  item: ArchiveObject
  record: ObjectRecord
  x: number
  y: number
  state: 'sealed' | 'investigating' | 'ready' | 'complete'
}

const props = defineProps<{ nodes: RouteNode[]; selectedKey: string }>()
const emit = defineEmits<{ select: [key: string] }>()

const points = [
  { x: 9, y: 72 }, { x: 29, y: 36 }, { x: 50, y: 60 }, { x: 72, y: 27 }, { x: 91, y: 47 },
]

const selectNext = () => {
  const current = props.nodes.findIndex((node) => node.item.key === props.selectedKey)
  emit('select', props.nodes[(current + 1) % props.nodes.length].item.key)
}

const selectActive = () => {
  const target = props.nodes.find((node) => node.state === 'complete')
    ?? props.nodes.find((node) => node.state === 'ready' || node.state === 'investigating')
    ?? props.nodes[0]
  emit('select', target.item.key)
}
</script>

<template>
  <section class="route-archive-map" aria-label="已恢复的长征路线档案">
    <header class="route-map-heading">
      <div><span>ROUTE RECOVERY TABLE / 01—05</span><strong>路线恢复图</strong></div>
      <div class="route-map-controls"><button type="button" @click="selectNext">逐段巡览 →</button><button type="button" @click="selectActive">聚焦当前进度</button></div>
    </header>
    <div class="route-map-canvas">
      <div class="map-coordinates" aria-hidden="true"><span>W 104°</span><span>N 27°</span><span>ARCHIVE / LZ-1936</span></div>
      <span class="terrain-line terrain-line-a" aria-hidden="true"></span>
      <span class="terrain-line terrain-line-b" aria-hidden="true"></span>
      <span class="terrain-line terrain-line-c" aria-hidden="true"></span>
      <svg class="route-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline points="4,86 9,72 29,36 50,60 72,27 91,47 97,39" class="route-base" />
        <line v-for="(node, index) in nodes" :key="`segment-${node.item.key}`" :x1="index === 0 ? 4 : points[index - 1].x" :y1="index === 0 ? 86 : points[index - 1].y" :x2="points[index].x" :y2="points[index].y" :class="['route-segment', { recovered: node.state === 'complete' }]" />
      </svg>
      <template v-for="node in nodes" :key="node.item.key">
        <RouterLink v-if="node.state === 'complete'" :to="`/history/${node.item.key}`" :class="['archive-route-node', node.state, { selected: selectedKey === node.item.key, edge: node.item.order === 5 }]" :style="{ left: `${node.x}%`, top: `${node.y}%` }" :aria-label="`打开${node.item.historicalLabel}史实档案`" @mouseenter="emit('select', node.item.key)" @focus="emit('select', node.item.key)">
          <span class="route-node-ring"><i></i></span><span class="route-node-copy"><small>0{{ node.item.order }} / 已核验</small><strong>{{ node.item.historicalLabel }}</strong></span>
        </RouterLink>
        <button v-else type="button" :class="['archive-route-node', node.state, { selected: selectedKey === node.item.key, edge: node.item.order === 5 }]" :style="{ left: `${node.x}%`, top: `${node.y}%` }" :aria-label="`第${node.item.order}段路线尚未解锁`" @click="emit('select', node.item.key)" @mouseenter="emit('select', node.item.key)" @focus="emit('select', node.item.key)">
          <span class="route-node-ring"><i></i></span><span class="route-node-copy"><small>0{{ node.item.order }} / {{ node.state === 'ready' ? '待归档' : node.state === 'investigating' ? '调查中' : '封存' }}</small><strong>未整理路段</strong></span>
        </button>
      </template>
      <div class="map-legend"><span><i class="complete"></i>史实已公开</span><span><i class="investigating"></i>调查进行中</span><span><i></i>档案封存</span></div>
    </div>
  </section>
</template>
