<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useId } from 'vue'
import { useRouter } from 'vue-router'
import { archiveObjects } from '../../data/objects'
import { useArchiveStore } from '../../stores/archive'
import HistoryFigure from './HistoryFigure.vue'
import type { HistoryFigureData, HistoryStationData } from './readerTypes'

const props = defineProps<{
  chapterKey: string; title: string; summary: string; chapterBoundary: string
  stations: HistoryStationData[]; archived: boolean; visitedStationIds: string[]
  nextKey?: string; saving?: boolean; saveError?: string
}>()
const emit = defineEmits<{ visit: [index: number]; archive: [] }>()
const archive = useArchiveStore()
const router = useRouter()
const id = useId()
const activeIndex = ref(0)
const imageIndex = ref(0)
const tab = ref<'reading' | 'sources'>('reading')
const expanded = ref(false)
const unavailable = ref(false)
const enlargeButton = ref<HTMLButtonElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const readingPane = ref<HTMLElement | null>(null)
const sourcePane = ref<HTMLElement | null>(null)
const active = computed(() => props.stations[activeIndex.value]!)
const activeFigure = computed(() => active.value.figures[imageIndex.value])
const imageSource = (figure: HistoryFigureData) => import.meta.env.DEV && figure.researchSrc ? figure.researchSrc : figure.src
const thumbnailError = (event: Event, figure: HistoryFigureData) => {
  const image = event.target as HTMLImageElement
  if (figure.src && image.getAttribute('src') !== figure.src) image.src = figure.src
  else image.hidden = true
}
const canEnlarge = computed(() => !unavailable.value && activeFigure.value && imageSource(activeFigure.value))
const visited = computed(() => new Set(props.stations.map((_, index) => index).filter(index => props.archived || props.visitedStationIds.includes(`${props.chapterKey}-history-0${index + 1}`))))
const confirmedArchived = computed(() => props.archived && !props.saving && !props.saveError)
const allRead = computed(() => visited.value.size === props.stations.length)
const nextUnread = computed(() => props.stations.findIndex((_, index) => !visited.value.has(index)))
const availableChapters = computed(() => archiveObjects.filter(item => item.key === props.chapterKey || archive.getRecord(item.key).historyRevealed || archive.getRecord(item.key).status === 'archived'))
const select = (index: number) => {
  if (index < 0 || index >= props.stations.length) return
  activeIndex.value = index; imageIndex.value = 0; tab.value = 'reading'; unavailable.value = false
  readingPane.value?.scrollTo({ top: 0 }); sourcePane.value?.scrollTo({ top: 0 })
  emit('visit', index)
}
const selectFigure = (index: number) => { imageIndex.value = index; unavailable.value = false }
const switchChapter = (event: Event) => { void router.push(`/history/${(event.target as HTMLSelectElement).value}`) }
const openImage = async () => {
  if (!canEnlarge.value) return
  expanded.value = true; document.body.classList.add('history-image-open')
  await nextTick(); closeButton.value?.focus()
}
const closeImage = async () => {
  expanded.value = false; document.body.classList.remove('history-image-open')
  await nextTick(); enlargeButton.value?.focus()
}
const onKey = (event: KeyboardEvent) => {
  if (!expanded.value) return
  if (event.key === 'Escape') { event.preventDefault(); void closeImage() }
  if (event.key === 'Tab') { event.preventDefault(); closeButton.value?.focus() }
}
const navigateTabs = async (event: KeyboardEvent) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const list = event.currentTarget as HTMLElement
  tab.value = event.key === 'Home' ? 'reading' : event.key === 'End' ? 'sources' : tab.value === 'reading' ? 'sources' : 'reading'
  await nextTick(); list.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus()
}
onMounted(() => { emit('visit', 0); window.addEventListener('keydown', onKey) })
onUnmounted(() => { window.removeEventListener('keydown', onKey); document.body.classList.remove('history-image-open') })
</script>

<template>
  <section class="history-reader">
    <header class="reader-heading">
      <div class="reader-breadcrumb"><RouterLink to="/history">← 史实索引</RouterLink><RouterLink :to="`/object/${chapterKey}`">回看物件</RouterLink><label>切换章节 <select aria-label="切换章节" :value="chapterKey" @change="switchChapter"><option v-for="chapter in availableChapters" :key="chapter.key" :value="chapter.key">{{ String(chapter.order).padStart(2, '0') }} · {{ chapter.name }}</option></select></label></div>
      <h1>{{ title }}</h1><p>{{ summary }}</p><small>史实资料独立阅读，与游戏物件分别陈列。</small>
    </header>
    <nav class="reader-materials" aria-label="四段史实材料"><button v-for="(station, index) in stations" :key="station.title" type="button" :class="{ selected: activeIndex === index }" :aria-current="activeIndex === index ? 'step' : undefined" @click="select(index)"><small>{{ String(index + 1).padStart(2, '0') }}</small><span>{{ station.label }}</span><i v-if="visited.has(index)" aria-label="已读"></i></button></nav>
    <div class="reader-workspace">
      <div class="reader-viewer">
        <div class="reader-viewer-tools"><span>{{ active.period || `材料 ${String(activeIndex + 1).padStart(2, '0')}` }}</span><button v-if="canEnlarge" ref="enlargeButton" type="button" @click="openImage">放大图版 ↗</button></div>
        <HistoryFigure :figure="activeFigure" :station="active" @enlarge="openImage" @unavailable="unavailable = true" />
        <nav v-if="active.figures.length > 1" class="reader-thumbnails" aria-label="当前材料图版"><button v-for="(figure, index) in active.figures" :key="figure.id" type="button" :aria-pressed="imageIndex === index" @click="selectFigure(index)"><img v-if="imageSource(figure)" :src="imageSource(figure)" alt="" @error="thumbnailError($event, figure)"><span>{{ figure.label }}</span></button></nav>
      </div>
      <aside class="reader-rail">
        <div class="reader-tabs" role="tablist" aria-label="资料阅读方式" @keydown="navigateTabs"><button :id="`${id}-reading-tab`" role="tab" type="button" :aria-selected="tab === 'reading'" :aria-controls="`${id}-reading`" :tabindex="tab === 'reading' ? 0 : -1" @click="tab = 'reading'">史实解读</button><button :id="`${id}-sources-tab`" role="tab" type="button" :aria-selected="tab === 'sources'" :aria-controls="`${id}-sources`" :tabindex="tab === 'sources' ? 0 : -1" @click="tab = 'sources'">来源与边界</button></div>
        <article v-show="tab === 'reading'" :id="`${id}-reading`" ref="readingPane" class="reader-pane" role="tabpanel" :aria-labelledby="`${id}-reading-tab`" tabindex="0"><small class="reader-material-count">材料 {{ String(activeIndex + 1).padStart(2, '0') }} / {{ String(stations.length).padStart(2, '0') }}</small><h2>{{ active.title }}</h2><p class="reader-lead">{{ active.lead }}</p><p class="reader-body">{{ active.detail }}</p><details v-if="active.moments?.length" :key="activeIndex" class="reader-chronology"><summary>展开时间脉络</summary><ol><li v-for="moment in active.moments" :key="moment.title"><small>{{ moment.date }}</small><strong>{{ moment.title }}</strong><p>{{ moment.body }}</p></li></ol></details></article>
        <article v-show="tab === 'sources'" :id="`${id}-sources`" ref="sourcePane" class="reader-pane" role="tabpanel" :aria-labelledby="`${id}-sources-tab`" tabindex="0"><small class="reader-material-count">材料来源</small><h2>{{ active.source }}</h2><section><h3>材料所见</h3><p>{{ active.material || active.lead }}</p></section><section><h3>不能由此推断</h3><p>{{ active.boundary }}</p></section><details :key="activeIndex" class="reader-chapter-boundary"><summary>本章的故事与史实边界</summary><p>{{ chapterBoundary }}</p></details></article>
        <a class="reader-source-link" :href="active.sourceUrl" target="_blank" rel="noopener noreferrer"><small>来源原文</small><span>{{ active.source }} ↗</span></a>
      </aside>
    </div>
    <footer class="reader-completion"><div class="reader-progress" role="status"><strong>{{ confirmedArchived ? '本章已归档' : `已读 ${visited.size} / ${stations.length} 份材料` }}</strong><span>{{ confirmedArchived ? '史实材料可随时回看。' : allRead ? '四份材料已翻阅，可以建立档案。' : '按目录自由切换，已读记录会保留。' }}</span></div><div class="reader-completion-action"><button v-if="!allRead" type="button" class="reader-primary" @click="select(nextUnread)">继续未读材料 →</button><button v-else-if="!confirmedArchived" type="button" class="reader-primary" :disabled="saving" @click="emit('archive')">{{ saving ? '正在保存档案…' : saveError ? '重试保存档案 →' : '完成阅读并建档 →' }}</button><RouterLink v-else class="reader-primary" :to="nextKey ? { path: '/archive', query: { focus: nextKey } } : '/ending'">{{ nextKey ? '接收下一件物品 →' : '进入终章 →' }}</RouterLink></div><p v-if="saveError" class="reader-save-error" role="alert">{{ saveError }}</p></footer>
    <Teleport to="body"><div v-if="expanded" class="reader-lightbox" role="dialog" aria-modal="true" aria-label="放大查看史实图版" @click.self="closeImage"><div><button ref="closeButton" class="reader-lightbox-close" type="button" @click="closeImage">关闭图版 ×</button><HistoryFigure :figure="activeFigure" :station="active" :interactive="false" /></div></div></Teleport>
  </section>
</template>
