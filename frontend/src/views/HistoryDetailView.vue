<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '../components/common/AppShell.vue'
import ListHistoryExhibit from '../components/history/ListHistoryExhibit.vue'
import MapHistoryExhibit from '../components/history/MapHistoryExhibit.vue'
import { historyRecords } from '../data/historyRecords'
import { archiveObjects, objectByKey } from '../data/objects'
import { useArchiveStore } from '../stores/archive'

const route = useRoute()
const archive = useArchiveStore()
const item = computed(() => objectByKey(String(route.params.objectKey)))
const record = computed(() => item.value ? archive.getRecord(item.value.key) : undefined)
const unlocked = computed(() => record.value?.status === 'archived' || (['list', 'map'].includes(item.value?.key ?? '') && record.value?.historyRevealed))
const content = computed(() => item.value ? historyRecords[item.value.key] : undefined)
const currentIndex = computed(() => item.value ? archiveObjects.findIndex((entry) => entry.key === item.value?.key) : -1)
const previousUnlocked = computed(() => archiveObjects.slice(0, currentIndex.value).reverse().find((entry) => archive.getRecord(entry.key).status === 'archived'))
const nextUnlocked = computed(() => archiveObjects.slice(currentIndex.value + 1).find((entry) => archive.getRecord(entry.key).status === 'archived'))
const nextChapter = computed(() => archiveObjects[currentIndex.value + 1])
const activeMaterialCode = ref<string | null>(null)
const activeMaterial = computed(() => content.value?.materials.find((material) => material.code === activeMaterialCode.value))
const finishListHistory = () => {
  if (item.value?.key !== 'list' || !record.value?.historyRevealed) return
  if (![1, 2, 3, 4].every((index) => record.value?.completedInteractions.includes(`list-history-0${index}`))) return
  archive.markHistoryRead('list')
  archive.archiveObject('list')
}
const visitListStation = (index: number) => {
  if (item.value?.key !== 'list' || !record.value?.historyRevealed || index < 0 || index > 3) return
  archive.completeInteraction('list', `list-history-0${index + 1}`)
}
const visitMapStation = (index: number) => {
  if (item.value?.key !== 'map' || !record.value?.historyRevealed || index < 0 || index > 3) return
  archive.completeInteraction('map', `map-history-0${index + 1}`)
}
const finishMapHistory = () => {
  if (item.value?.key !== 'map' || !record.value?.historyRevealed) return
  if (![1, 2, 3, 4].every((index) => record.value?.completedInteractions.includes(`map-history-0${index}`))) return
  archive.markHistoryRead('map')
  archive.archiveObject('map')
}
</script>

<template>
  <AppShell>
    <ListHistoryExhibit v-if="item?.key === 'list' && content && unlocked" :archived="record?.status === 'archived'" :visited-station-ids="record?.completedInteractions ?? []" @visit="visitListStation" @archive="finishListHistory" />
    <MapHistoryExhibit v-else-if="item?.key === 'map' && content && unlocked" :archived="record?.status === 'archived'" :visited-station-ids="record?.completedInteractions ?? []" @visit="visitMapStation" @archive="finishMapHistory" />
    <section v-else-if="item && content && unlocked" class="history-detail-page">
      <header class="history-detail-cover">
        <div class="history-detail-index"><RouterLink to="/history">← 返回章节索引</RouterLink><span>HISTORY CONTEXT / 0{{ item.order }}</span></div>
        <div class="history-detail-title"><span>{{ content.period }} · {{ item.archiveNo }}</span><h1>{{ item.historicalLabel }}</h1><p>{{ content.summary }}</p></div>
        <div class="history-verified-seal"><span>阅</span><small>主题档案</small></div>
      </header>
      <section class="history-detail-ledger">
        <aside class="history-ledger-index"><span>档案目录</span><a href="#context">01 / 历史背景</a><a href="#evidence">02 / 调查对照</a><a href="#materials">03 / 材料袋</a><a href="#boundary">04 / 真实性边界</a></aside>
        <div class="history-ledger-content">
          <article id="context" class="history-ledger-section history-context-section"><span>01 / HISTORICAL CONTEXT</span><h2>历史主题与游戏故事</h2><p>{{ content.relation }}</p><blockquote>本页历史资料独立阅读，不能当作虚构物件的出土证明。</blockquote></article>
          <article id="evidence" class="history-ledger-section"><span>02 / INVESTIGATION COMPARISON</span><h2>本件物品的调查结论</h2><div class="history-conclusion-grid"><section v-for="conclusion in item.conclusions" :key="conclusion.id" :class="conclusion.expectedLevel"><small>{{ conclusion.expectedLevel === 'confirmed' ? '可以确认' : conclusion.expectedLevel === 'inferred' ? '合理推测' : '仍然未知' }}</small><strong>{{ conclusion.text }}</strong><p>{{ conclusion.explanation }}</p></section></div></article>
          <article id="materials" class="history-ledger-section"><span>03 / MATERIAL ENVELOPES</span><h2>调查记录与阅读材料</h2><div class="history-material-grid"><button v-for="material in content.materials" :key="material.code" type="button" :class="['history-material-card', { active: activeMaterialCode === material.code }]" @click="activeMaterialCode = activeMaterialCode === material.code ? null : material.code"><small>{{ material.code }} / {{ material.type }}</small><strong>{{ material.title }}</strong><p>{{ material.description }}</p><i>{{ activeMaterialCode === material.code ? '收起材料说明 ↑' : '点击展开材料说明 ↗' }}</i></button></div>
            <div v-if="activeMaterial" class="history-material-reader">
              <header><span>{{ activeMaterial.code }} / DECLASSIFIED MATERIAL</span><button type="button" @click="activeMaterialCode = null">关闭 ×</button></header>
              <div>
                <section><small>材料名称</small><h3>{{ activeMaterial.title }}</h3><p>{{ activeMaterial.description }}</p></section>
                <section v-if="activeMaterial.code === 'A-01'" class="material-reader-list"><small>本次调查记录</small><p v-for="clue in item.clues" :key="clue.id"><strong>{{ clue.title }}</strong><span>{{ clue.description }}</span></p></section>
                <section v-else-if="activeMaterial.code === 'A-02'" class="material-reader-list"><small>证据边界记录</small><p v-for="conclusion in item.conclusions" :key="conclusion.id"><strong>{{ conclusion.expectedLevel === 'confirmed' ? '可以确认' : conclusion.expectedLevel === 'inferred' ? '合理推测' : '仍然未知' }}</strong><span>{{ conclusion.text }}</span></p></section>
                <section v-else-if="activeMaterial.url" class="material-source-slot"><small>外部史实来源</small><strong>{{ activeMaterial.title }}</strong><p>{{ activeMaterial.description }}</p><a :href="activeMaterial.url" target="_blank" rel="noopener noreferrer">打开来源原文 ↗</a></section>
              </div>
            </div>
          </article>
          <article id="boundary" class="history-ledger-section history-boundary-note"><span>04 / AUTHENTICITY BOUNDARY</span><h2>真实性与创作边界</h2><p>{{ content.boundary }}</p><div><strong>阅读提示</strong><span>游戏物件是虚构叙事，不应作为真实文物或历史事件的直接证据。</span></div></article>
        </div>
      </section>
      <footer class="history-detail-navigation"><RouterLink v-if="previousUnlocked" :to="`/history/${previousUnlocked.key}`">← 上一份公开档案</RouterLink><span v-else>第一章</span><RouterLink to="/history">查看章节与史实索引</RouterLink><RouterLink v-if="nextUnlocked" :to="`/history/${nextUnlocked.key}`">下一份公开档案 →</RouterLink><RouterLink v-else-if="nextChapter" :to="{ path: '/archive', query: { focus: nextChapter.key } }">接收下一件物品 →</RouterLink><RouterLink v-else to="/ending">进入终章 →</RouterLink></footer>
    </section>
    <section v-else-if="item" class="history-sealed-page">
      <RouterLink to="/history">← 返回章节索引</RouterLink><div class="history-sealed-emblem">封</div><span>HISTORY RECORD / SEALED / 0{{ item.order }}</span><h1>这段史实仍在封存</h1><p>{{ item.key === 'list' ? '先读完名单的三幕故事，再从独立入口打开相关史实。' : item.key === 'map' ? '先在行路小图上读完四段故事、写下展签，再独立翻阅史实。' : '对应物件尚未完成调查与归档。地点、时间和材料将在证据核验完成后公开。' }}</p><RouterLink class="history-sealed-action" :to="record?.status === 'investigating' ? `/object/${item.key}` : '/archive'">{{ record?.status === 'investigating' ? '继续完成调查' : '返回档案室' }} →</RouterLink>
    </section>
    <section v-else class="history-sealed-page"><div class="history-sealed-emblem">?</div><h1>没有找到这份章节档案</h1><RouterLink class="history-sealed-action" to="/history">返回章节索引 →</RouterLink></section>
  </AppShell>
</template>
