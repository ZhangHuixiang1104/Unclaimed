<script setup lang="ts">
import { computed, ref } from 'vue'
import type { HomeArchivePreview } from '../../data/homeArchives'
import ArchiveFolder from './ArchiveFolder.vue'

const props = defineProps<{
  items: HomeArchivePreview[]
  hoveredId: string | null
  selectedId: string | null
  archivedKeys: string[]
  opening: boolean
}>()

const emit = defineEmits<{
  hover: [key: string | null]
  select: [key: string]
}>()

const pointerX = ref(0)
const pointerY = ref(0)

const caseStyle = computed(() => ({
  '--case-x': `${pointerX.value}px`,
  '--case-y': `${pointerY.value}px`,
  '--case-x-soft': `${pointerX.value * 0.35}px`,
  '--case-y-soft': `${pointerY.value * 0.25}px`,
  '--case-x-light': `${pointerX.value * 0.25}px`,
  '--case-y-light': `${pointerY.value * 0.25}px`,
  '--case-x-card': `${pointerX.value * 0.2}px`,
  '--case-y-card': `${pointerY.value * 0.15}px`,
  '--case-tilt': `${pointerX.value * 0.07}deg`,
}))

const handlePointerMove = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  pointerX.value = ((event.clientX - rect.left) / rect.width - 0.5) * 7
  pointerY.value = ((event.clientY - rect.top) / rect.height - 0.5) * 5
}

const resetPointer = () => {
  pointerX.value = 0
  pointerY.value = 0
  emit('hover', null)
}
</script>

<template>
  <section
    class="home-case-stage"
    :class="{ opening }"
    :style="caseStyle"
    aria-label="档案箱内有五份待整理档案"
    @mousemove="handlePointerMove"
    @mouseleave="resetPointer"
  >
    <div class="case-light" aria-hidden="true"></div>
    <div class="archive-case">
      <div class="case-lid" aria-hidden="true">
        <div class="lid-inner-line"></div>
        <span class="case-corner corner-left"></span>
        <span class="case-corner corner-right"></span>
        <div class="warning-slip">
          <small>档案工作原则 / 01</small>
          <strong>请勿替未知填写姓名</strong>
          <i></i>
        </div>
        <span class="lid-number">LZ · 1936 · 07</span>
      </div>

      <div class="case-depth" aria-hidden="true"></div>
      <div class="folder-rack">
        <ArchiveFolder
          v-for="(item, index) in items"
          :key="item.key"
          :item="item"
          :position="index"
          :hovered="hoveredId === item.key"
          :selected="selectedId === item.key"
          :archived="archivedKeys.includes(item.key)"
          :muted="Boolean(hoveredId && hoveredId !== item.key)"
          @hover="emit('hover', $event)"
          @select="emit('select', $event)"
        />
      </div>

      <div class="case-front" aria-hidden="true">
        <span class="case-hinge hinge-left"></span>
        <span class="case-lock"><i></i></span>
        <span class="case-hinge hinge-right"></span>
        <span class="case-stencil">ARCHIVE / 07</span>
      </div>

      <div class="loose-card" aria-hidden="true">
        <span>临时接收登记</span>
        <i></i><i></i><i></i>
        <small>签收人：________</small>
      </div>
    </div>
    <p class="case-hint"><span></span>移动光标，查看箱内档案</p>
  </section>
</template>

