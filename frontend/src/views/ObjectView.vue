<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../components/common/AppShell.vue'
import ObjectInspector from '../components/investigation/ObjectInspector.vue'
import EvidenceBoard from '../components/investigation/EvidenceBoard.vue'
import SignalNetwork from '../components/interactions/SignalNetwork.vue'
import HistoryGate from '../components/story/HistoryGate.vue'
import HistoryReveal from '../components/story/HistoryReveal.vue'
import { objectByKey } from '../data/objects'
import { archiveObjects } from '../data/objects'
import { useArchiveStore } from '../stores/archive'

const route = useRoute()
const router = useRouter()
const archive = useArchiveStore()
const justArchived = ref(false)
const showHistory = ref(false)
const inspector = ref<{ reviewClue: (clueId: string) => void } | null>(null)
const item = computed(() => objectByKey(String(route.params.objectKey)))
const unlocked = computed(() => Boolean(item.value && archive.isObjectUnlocked(item.value.key)))
const record = computed(() => item.value ? archive.getRecord(item.value.key) : undefined)
const nextItem = computed(() => {
  const index = archiveObjects.findIndex((entry) => entry.key === item.value?.key)
  return archiveObjects[index + 1]
})
const cluesComplete = computed(() => Boolean(item.value && record.value && record.value.foundClueIds.length === item.value.clues.length))
const evidenceVerified = computed(() => Boolean(record.value?.evidenceVerified))
const classifiedCount = computed(() => item.value?.conclusions.filter((entry) => record.value?.classified[entry.id]).length ?? 0)
const currentStage = computed(() => {
  if (record.value?.status === 'archived' || record.value?.historyRead) return 4
  if (evidenceVerified.value) return 3
  if (cluesComplete.value) return 2
  return 1
})

watch(item, (value) => {
  if (value && archive.isObjectUnlocked(value.key)) archive.startObject(value.key)
  showHistory.value = false
  justArchived.value = false
}, { immediate: true })

const revealHistory = () => {
  if (!item.value) return
  if (!evidenceVerified.value) return
  archive.revealHistory(item.value.key)
  showHistory.value = true
}

const finishArchive = () => {
  if (!item.value) return
  archive.markHistoryRead(item.value.key)
  archive.archiveObject(item.value.key)
  justArchived.value = true
  showHistory.value = false
}

const reviewClue = (clueId: string) => {
  inspector.value?.reviewClue(clueId)
}
</script>

<template>
  <AppShell>
    <section v-if="item && unlocked" class="object-page" :style="{ '--object-accent': item.accent }">
      <header class="object-header">
        <button class="text-button" type="button" @click="router.push('/archive')">← 返回档案室</button>
        <div>
          <span class="eyebrow">{{ record?.status === 'archived' ? item.historicalLabel : `第 ${String(item.order).padStart(2, '0')} 份未整理物件` }} · {{ item.archiveNo }}</span>
          <h1>{{ item.name }}</h1>
          <p>{{ item.intro }}</p>
          <p class="investigation-question">{{ item.investigationQuestion }}</p>
        </div>
        <div class="stage-indicator object-stage-indicator">
          <span :class="{ active: currentStage === 1, complete: currentStage > 1 }">观察</span><i></i>
          <span :class="{ active: currentStage === 2, complete: currentStage > 2 }">判断</span><i></i>
          <span :class="{ active: currentStage === 3, complete: currentStage > 3 }">核对史实</span><i></i>
          <span :class="{ active: currentStage === 4 }">建档</span>
        </div>
      </header>

      <div class="investigation-layout">
        <div class="investigation-main-column">
          <ObjectInspector :key="item.key" ref="inspector" :item="item" />

          <SignalNetwork v-if="item.interactionType === 'signal-network' && cluesComplete" :key="item.key" />

          <HistoryGate
            :clues-found="record?.foundClueIds.length ?? 0"
            :clues-total="item.clues.length"
            :claims-reviewed="record?.screeningVerified ? item.conclusions.length : 0"
            :claims-total="item.conclusions.length"
            :classified-count="classifiedCount"
            :classified-total="item.conclusions.length"
            :evidence-verified="evidenceVerified"
            :history-revealed="record?.historyRevealed ?? false"
            :history-read="record?.historyRead ?? false"
            @reveal="revealHistory"
          />
        </div>
        <div class="investigation-side-column">
          <EvidenceBoard :key="item.key" :item="item" @review="reviewClue" />
        </div>
      </div>

      <HistoryReveal
        v-if="showHistory"
        :item="item"
        :status="record?.status ?? 'investigating'"
        @close="showHistory = false"
        @archive="finishArchive"
      />

      <section v-if="justArchived || archive.getRecord(item.key).status === 'archived'" class="archive-success">
        <span>档案已建立</span>
        <h2>{{ item.name }}已进入陈列柜</h2>
        <p>历史路线中的“{{ item.historicalLabel }}”节点已经点亮。</p>
        <p class="chapter-next-hook">{{ item.nextHook }}</p>
        <div>
          <RouterLink class="secondary-button" :to="`/history/${item.key}`">阅读本段史实 →</RouterLink>
          <RouterLink class="text-button" to="/history">查看完整路线 →</RouterLink>
          <RouterLink v-if="nextItem" class="text-button" :to="{ path: '/archive', query: { focus: nextItem.key } }">接收下一件物品 →</RouterLink>
          <RouterLink v-else class="text-button" to="/ending">进入终章 →</RouterLink>
        </div>
      </section>
    </section>

    <section v-else-if="item" class="not-found panel">
      <span class="eyebrow">物件尚未接收</span>
      <h1>先完成上一份档案</h1>
      <p>这一件物品仍在档案箱中。前一段路线恢复后，检查台才会开放。</p>
      <RouterLink class="primary-button" :to="{ path: '/archive', query: { focus: item.key } }">返回档案室</RouterLink>
    </section>

    <section v-else class="not-found panel">
      <h1>没有找到这件物品</h1>
      <RouterLink class="primary-button" to="/archive">返回档案室</RouterLink>
    </section>
  </AppShell>
</template>
