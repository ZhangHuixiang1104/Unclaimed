<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import routeImage from '../../assets/history/long-march-route.png'
import overviewImage from '../../assets/history/long-march-overview.jpg'
const maps = [
  { label: '主要节点', title: '中国工农红军长征图', period: '1934.10—1936.10', image: overviewImage,
    source: '上海党史网 · 党史镜报', note: '公开报道所附长征图 · 主要节点概览',
    url: 'https://www.ccphistory.org.cn/shds/shhm/content/383e7ee8-064a-4e8f-8b36-1281ea34cbaf.html',
    alt: '上海党史网文章所附中国工农红军长征图，以红线和地名标注长征主要节点' },
  { label: '各路红军', title: '中国工农红军长征线路图', period: '1934.08—1936.10', image: routeImage,
    source: '中国地图出版集团供图', note: '审图号：GS（2021）3573 · 原图完整展示',
    url: 'https://zrzyt.xinjiang.gov.cn/xjgtzy/fypx/202109/121197f280c646dbb448f3bd81ebcd76.shtml',
    alt: '中国地图出版集团编制的各路红军长征线路图，保留图例和审图号 GS（2021）3573' },
]
const mapIndex = ref(0)
const activeMap = computed(() => maps[mapIndex.value]!)
const expanded = ref(false)
const enlargeButton = ref<HTMLButtonElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const setExpanded = async (value: boolean) => {
  expanded.value = value
  document.body.classList.toggle('route-image-open', value)
  await nextTick()
  ;(value ? closeButton.value : enlargeButton.value)?.focus()
}
const onKey = (event: KeyboardEvent) => {
  if (!expanded.value) return
  if (event.key === 'Escape') { event.preventDefault(); void setExpanded(false) }
  if (event.key === 'Tab') { event.preventDefault(); closeButton.value?.focus() }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => { window.removeEventListener('keydown', onKey); document.body.classList.remove('route-image-open') })
</script>

<template>
  <section class="route-atlas" aria-label="中国工农红军长征线路图">
    <header class="route-atlas-heading"><div><small>历史地理 / {{ activeMap.period }}</small><h2>{{ activeMap.title }}</h2></div><button ref="enlargeButton" type="button" @click="setExpanded(true)">放大图版 ↗</button></header>
    <nav class="route-atlas-tabs" aria-label="历史地图图版"><button v-for="(map, index) in maps" :key="map.label" type="button" :aria-pressed="mapIndex === index" @click="mapIndex = index">{{ map.label }}</button></nav>
    <button class="route-atlas-image" type="button" aria-label="放大查看完整长征线路图" @click="setExpanded(true)"><img :src="activeMap.image" :alt="activeMap.alt"></button>
    <footer class="route-atlas-source"><div><strong>{{ activeMap.source }}</strong><span>{{ activeMap.note }}</span></div><a :href="activeMap.url" target="_blank" rel="noopener noreferrer">核对地图出处 ↗</a></footer>
    <Teleport to="body"><div v-if="expanded" class="route-atlas-dialog" role="dialog" aria-modal="true" aria-label="完整长征线路图" @click.self="setExpanded(false)"><div><header><span>{{ activeMap.title }}</span><button ref="closeButton" type="button" @click="setExpanded(false)">关闭图版 ×</button></header><img :src="activeMap.image" :alt="activeMap.alt"><p>{{ activeMap.source }} · {{ activeMap.note }}</p></div></div></Teleport>
  </section>
</template>
