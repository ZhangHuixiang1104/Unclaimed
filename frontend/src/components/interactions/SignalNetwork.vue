<script setup lang="ts">
import { computed, ref } from 'vue'

type NodePoint = { id: string; x: number; y: number; fixed?: boolean }

const emit = defineEmits<{ complete: [] }>()
const nodes = ref<NodePoint[]>([
  { id: 'start', x: 10, y: 72, fixed: true },
  { id: 'relay-a', x: 34, y: 58 },
  { id: 'relay-b', x: 59, y: 43 },
  { id: 'end', x: 88, y: 28, fixed: true },
])
const tested = ref(false)
const complete = ref(false)
const dragging = ref<string | null>(null)

const distance = (a: NodePoint, b: NodePoint) => Math.hypot(a.x - b.x, a.y - b.y)
const links = computed(() => nodes.value.slice(0, -1).map((node, index) => ({
  a: node,
  b: nodes.value[index + 1],
  quality: Math.max(0, Math.round(100 - distance(node, nodes.value[index + 1]) * 1.55)),
})))
const stable = computed(() => links.value.every((link) => link.quality >= 48))

const pointerMove = (event: PointerEvent) => {
  if (!dragging.value) return
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const node = nodes.value.find((entry) => entry.id === dragging.value)
  if (!node || node.fixed) return
  node.x = Math.min(92, Math.max(8, ((event.clientX - rect.left) / rect.width) * 100))
  node.y = Math.min(86, Math.max(14, ((event.clientY - rect.top) / rect.height) * 100))
  tested.value = false
}

const testLine = () => {
  tested.value = true
  if (stable.value) {
    complete.value = true
    emit('complete')
  }
}
</script>

<template>
  <section class="signal-module panel">
    <header class="panel-heading compact">
      <div>
        <span class="eyebrow">专属互动占位</span>
        <h2>恢复临时通信线路</h2>
      </div>
      <span :class="['signal-status', { online: complete }]">{{ complete ? '线路稳定' : '等待测试' }}</span>
    </header>
    <p class="module-intro">拖动两个中继点，让四个节点之间的信号质量都达到48以上。</p>

    <div class="signal-map" @pointermove="pointerMove" @pointerup="dragging = null" @pointerleave="dragging = null">
      <div class="terrain mountain-one"></div>
      <div class="terrain river"></div>
      <svg class="signal-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line
          v-for="link in links"
          :key="`${link.a.id}-${link.b.id}`"
          :x1="link.a.x"
          :y1="link.a.y"
          :x2="link.b.x"
          :y2="link.b.y"
          :class="{ weak: link.quality < 48 }"
        />
      </svg>
      <button
        v-for="node in nodes"
        :key="node.id"
        type="button"
        :class="['signal-node', { fixed: node.fixed }]"
        :style="{ left: `${node.x}%`, top: `${node.y}%` }"
        @pointerdown.prevent="!node.fixed && (dragging = node.id)"
      >
        {{ node.fixed ? (node.id === 'start' ? '起' : '终') : '中' }}
      </button>
      <div class="quality-row">
        <span v-for="link in links" :key="link.a.id" :class="{ weak: link.quality < 48 }">{{ link.quality }}</span>
      </div>
    </div>

    <div class="module-actions">
      <span v-if="tested && !stable">仍有一段信号过弱，缩短相邻节点距离。</span>
      <span v-else-if="complete">信号已送达。正式版将在这里进入电报输入。</span>
      <span v-else>当前为框架演示，地图和参数均可从配置文件替换。</span>
      <button class="secondary-button" type="button" @click="testLine">测试线路</button>
    </div>
  </section>
</template>
