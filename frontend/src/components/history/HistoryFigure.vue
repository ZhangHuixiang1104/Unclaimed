<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { HistoryFigureData, HistoryStationData } from './readerTypes'

const props = withDefaults(defineProps<{ figure?: HistoryFigureData; station: HistoryStationData; interactive?: boolean }>(), { interactive: true })
const emit = defineEmits<{ enlarge: []; unavailable: [] }>()
const researchFailed = ref(false)
const fallbackFailed = ref(false)
const research = computed(() => Boolean(props.figure?.researchSrc && !researchFailed.value))
const src = computed(() => research.value ? props.figure?.researchSrc : !fallbackFailed.value ? props.figure?.src : undefined)
const caption = computed(() => research.value ? props.figure?.researchCaption ?? props.figure?.caption : props.figure?.caption)
const alt = computed(() => research.value ? props.figure?.researchAlt ?? props.figure?.alt : props.figure?.alt)
const onError = () => {
  if (research.value) researchFailed.value = true
  else fallbackFailed.value = true
  if (!src.value) emit('unavailable')
}
watch(() => [props.figure?.src, props.figure?.researchSrc], () => { researchFailed.value = false; fallbackFailed.value = false })
</script>

<template>
  <figure class="reader-figure">
    <component :is="interactive ? 'button' : 'div'" v-if="src" class="reader-image" :type="interactive ? 'button' : undefined" :aria-label="interactive ? `放大查看${figure?.label}` : undefined" @click="interactive && emit('enlarge')"><img :src="src" :alt="alt" @error="onError"></component>
    <article v-else class="reader-document" aria-label="文字资料摘记">
      <small>{{ station.period || '文字资料' }} · 资料摘记</small><h2>{{ station.title }}</h2><p>{{ station.material || station.lead }}</p><footer>{{ station.source }}<br>文字摘记，非原件影像</footer>
    </article>
    <figcaption><span>{{ src ? caption : '依据公开报道整理，原始记载可从右侧来源入口核对。' }}</span><small>{{ src ? (research ? figure?.researchCredit || station.source : figure?.credit || station.source) : station.source }}</small></figcaption>
  </figure>
</template>
