<script setup lang="ts">
import { computed, nextTick, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { railTabKey, type RailTab } from '../components/investigation/railTab'
import AppShell from '../components/common/AppShell.vue'
import ObjectInspector from '../components/investigation/ObjectInspector.vue'
import ListStoryNotebook from '../components/investigation/ListStoryNotebook.vue'
import ListStorySynthesis from '../components/investigation/ListStorySynthesis.vue'
import MapInvestigation from '../components/investigation/MapInvestigation.vue'
import BatteryInvestigation from '../components/investigation/BatteryInvestigation.vue'
import ShoesInvestigation from '../components/investigation/ShoesInvestigation.vue'
import BowlInvestigation from '../components/investigation/BowlInvestigation.vue'
import HistoryGate from '../components/story/HistoryGate.vue'
import HistoryReveal from '../components/story/HistoryReveal.vue'
import { objectByKey } from '../data/objects'
import { archiveObjects } from '../data/objects'
import { useArchiveStore } from '../stores/archive'
import { useAccountStore } from '../stores/account'

const railTab = ref<RailTab>('notes')
provide(railTabKey, railTab)
const route = useRoute()
const router = useRouter()
const archive = useArchiveStore()
const account = useAccountStore()
const revealError = ref('')
const justArchived = ref(false)
const showHistory = ref(false)
const inspector = ref<{ reviewClue: (clueId: string) => void } | null>(null)
const gateTarget = ref<{ scrollIntoView: () => void } | null>(null)
const item = computed(() => objectByKey(String(route.params.objectKey)))
const unlocked = computed(() => Boolean(item.value && archive.isObjectUnlocked(item.value.key)))
const record = computed(() => item.value ? archive.getRecord(item.value.key) : undefined)
const nextItem = computed(() => {
  const index = archiveObjects.findIndex((entry) => entry.key === item.value?.key)
  return archiveObjects[index + 1]
})
const cluesComplete = computed(() => Boolean(item.value && record.value && record.value.foundClueIds.length === item.value.clues.length))
const evidenceVerified = computed(() => Boolean(record.value?.evidenceVerified))

watch(item, (value) => {
  if (value && archive.isObjectUnlocked(value.key)) archive.startObject(value.key)
  showHistory.value = false
  justArchived.value = false
  revealError.value = ''
  railTab.value = 'notes'
}, { immediate: true })

watch(evidenceVerified, async (verified, wasVerified) => {
  if (!verified || wasVerified || !['list', 'map', 'battery', 'shoes', 'bowl'].includes(item.value?.key ?? '')) return
  await nextTick()
  gateTarget.value?.scrollIntoView()
})

const saveListStory = () => {
  if (item.value?.key === 'list') archive.completeListNarrative()
}

const revealHistory = async () => {
  if (!item.value) return
  if (!evidenceVerified.value) return
  const key = item.value.key
  if (item.value.key === 'bowl') {
    await account.saveNow()
    if (item.value?.key !== key) return
    if (account.syncState !== 'synced' || account.pendingUpload) {
      revealError.value = '这段故事尚未存到账号。请检查存档服务并重试。'
      return
    }
    revealError.value = ''
  }
  archive.revealHistory(item.value.key)
  if (['list', 'map', 'battery', 'shoes', 'bowl'].includes(item.value.key)) {
    if (item.value.key === 'bowl') {
      await account.saveNow()
      if (item.value?.key !== key) return
      if (account.syncState !== 'synced' || account.pendingUpload) {
        revealError.value = '史实入口尚未同步到账号，请重试。'
        return
      }
    }
    void router.push(`/history/${item.value.key}`)
    return
  }
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
        <div class="chapter-breadcrumb"><button type="button" @click="router.push('/archive')">← 档案室</button><span>第 {{ String(item.order).padStart(2, '0') }} 件 · {{ item.archiveNo }} · 原创虚构物件</span><details><summary>章节背景</summary><p>{{ item.intro }}</p></details></div>
        <h1>{{ item.name }}</h1>
        <p class="investigation-question">{{ item.investigationQuestion }}</p>
      </header>

      <div v-if="item.key === 'map'" class="map-investigation-flow">
        <MapInvestigation ref="inspector" />
      </div>
      <div v-else-if="item.key === 'battery'" class="battery-investigation-flow">
        <BatteryInvestigation ref="inspector" />
      </div>
      <div v-else-if="item.key === 'shoes'" class="shoes-investigation-flow">
        <ShoesInvestigation ref="inspector" />
      </div>
      <div v-else-if="item.key === 'bowl'" class="bowl-investigation-flow">
        <BowlInvestigation ref="inspector" />
        <p v-if="revealError" class="sync-warning" role="alert">{{ revealError }}</p>
      </div>
      <div v-else class="investigation-layout list-inspection-layout">
        <div class="investigation-main-column">
          <div class="inspection-workspace list-inspection-workspace">
            <ObjectInspector :key="item.key" ref="inspector" :item="item" />
            <ListStoryNotebook class="inspection-notebook" @review="reviewClue">
              <div v-if="item.key === 'list' && cluesComplete">
                <ListStorySynthesis :saved="evidenceVerified" @save="saveListStory" />
              </div>
            </ListStoryNotebook>
          </div>
        </div>

      </div>

      <HistoryGate
        ref="gateTarget"
        :story-mode="true"
        :story-subject="({ list: '名单', map: '行军图', battery: '电池盒', shoes: '草鞋', bowl: '饭碗' } as Record<string, string>)[item.key]"
        :clues-found="record?.foundClueIds.length ?? 0"
        :clues-total="item.clues.length"
        :claims-reviewed="0" :claims-total="item.conclusions.length"
        :classified-count="0" :classified-total="item.conclusions.length"
        :evidence-verified="evidenceVerified && (item.key !== 'bowl' || (account.syncState === 'synced' && !account.pendingUpload))"
        :history-revealed="record?.historyRevealed ?? false"
        :history-read="record?.historyRead ?? false"
        :archived="record?.status === 'archived'"
        :next-object-key="nextItem?.key"
        @organize="railTab = 'caption'"
        @reveal="revealHistory"
      >
      </HistoryGate>

      <HistoryReveal
        v-if="showHistory && !['list', 'map', 'battery', 'shoes', 'bowl'].includes(item.key)"
        :item="item"
        :status="record?.status ?? 'investigating'"
        @close="showHistory = false"
        @archive="finishArchive"
      />


    </section>

    <section v-else-if="item" class="not-found panel">
      <span class="eyebrow">物件尚未接收</span>
      <h1>先完成上一份档案</h1>
      <p>这一件物品仍在档案箱中。请先归档上一件，再接收这份新调查。</p>
      <RouterLink class="primary-button" :to="{ path: '/archive', query: { focus: item.key } }">返回档案室</RouterLink>
    </section>

    <section v-else class="not-found panel">
      <h1>没有找到这件物品</h1>
      <RouterLink class="primary-button" to="/archive">返回档案室</RouterLink>
    </section>
  </AppShell>
</template>
