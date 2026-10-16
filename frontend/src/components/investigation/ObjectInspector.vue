<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ArchiveObject } from '../../types/archive'
import { useArchiveStore } from '../../stores/archive'

const props = defineProps<{ item: ArchiveObject }>()
const archive = useArchiveStore()
const lightOn = ref(false)
const zoomed = ref(false)

const record = computed(() => archive.getRecord(props.item.key))
const allCluesFound = computed(() => record.value.foundClueIds.length === props.item.clues.length)
</script>

<template>
  <section class="inspector-panel panel">
    <header class="panel-heading">
      <div>
        <span class="eyebrow">物件检查台</span>
        <h2>{{ item.name }}</h2>
      </div>
      <span class="archive-no">{{ item.archiveNo }}</span>
    </header>

    <div :class="['inspection-stage', { 'light-on': lightOn, zoomed }]" :style="{ '--object-accent': item.accent }">
      <div class="stage-grid" aria-hidden="true"></div>
      <div class="placeholder-object">
        <span>{{ item.silhouette }}</span>
        <small>正式物件图占位</small>
      </div>
      <button
        v-for="(clue, index) in item.clues"
        :key="clue.id"
        class="clue-hotspot"
        :class="{ found: record.foundClueIds.includes(clue.id) }"
        :style="{ left: `${clue.position.x}%`, top: `${clue.position.y}%` }"
        type="button"
        :aria-label="`检查线索 ${index + 1}`"
        @click="archive.findClue(item.key, clue.id)"
      >
        {{ record.foundClueIds.includes(clue.id) ? '✓' : index + 1 }}
      </button>

      <div class="inspection-caption">
        <span>{{ item.artNote }}</span>
        <strong>{{ record.foundClueIds.length }} / {{ item.clues.length }} 条线索</strong>
      </div>
    </div>

    <div class="tool-row" aria-label="检查工具">
      <button type="button" :class="{ active: lightOn }" @click="lightOn = !lightOn">侧光</button>
      <button type="button" :class="{ active: zoomed }" @click="zoomed = !zoomed">放大</button>
      <button type="button" disabled>旋转 <small>待接素材</small></button>
      <span class="tool-hint">{{ allCluesFound ? '痕迹已全部登记，可以进入证据分类。' : '点击物件上的编号检查痕迹。' }}</span>
    </div>
  </section>
</template>
