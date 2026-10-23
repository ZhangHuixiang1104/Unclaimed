<script setup lang="ts">
import { computed, ref } from 'vue'
import AppShell from '../components/common/AppShell.vue'
import RouteArchiveMap from '../components/history/RouteArchiveMap.vue'
import RouteDossierPanel from '../components/history/RouteDossierPanel.vue'
import { archiveObjects } from '../data/objects'
import { useArchiveStore } from '../stores/archive'
import { useAccountStore } from '../stores/account'
import { useContinueInvestigation } from '../composables/useContinueInvestigation'

const archive = useArchiveStore()
const account = useAccountStore()
const { to: resumeTo, label: resumeLabel } = useContinueInvestigation()
const endingReady = computed(() => archive.endingUnlocked && account.syncState === 'synced' && !account.pendingUpload)
const firstRelevant = archiveObjects.find((item) => item.key === archive.nextObjectKey)
  ?? [...archiveObjects].reverse().find((item) => archive.getRecord(item.key).status === 'archived')
  ?? archiveObjects[0]
const selectedKey = ref(firstRelevant.key)

const stateFor = (key: string) => {
  const record = archive.getRecord(key)
  if (record.status === 'archived') return 'complete' as const
  if (!archive.isObjectUnlocked(key)) return 'sealed' as const
  if (record.evidenceVerified || record.historyRevealed || record.historyRead) return 'ready' as const
  if (record.status === 'investigating' || record.foundClueIds.length > 0) return 'investigating' as const
  return 'available' as const
}

const nodes = computed(() => archiveObjects.map(item => ({ item, record: archive.getRecord(item.key), state: stateFor(item.key) })))
const selectedNode = computed(() => nodes.value.find((node) => node.item.key === selectedKey.value) ?? nodes.value[0])
const focusCurrent = () => { selectedKey.value = archive.nextObjectKey ?? archiveObjects[archiveObjects.length - 1]!.key }
const stateLabel = (state: ReturnType<typeof stateFor>) => ({ complete: '已归档', ready: '待建档', investigating: '调查中', available: '待接收', sealed: '未开放' })[state]
const nextActionLabel = computed(() => {
  if (endingReady.value) return '进入终章档案'
  if (archive.endingUnlocked) return '核对第五件云存档'
  return resumeLabel.value
})
</script>

<template>
  <AppShell>
    <section class="history-room">
      <header class="history-room-intro">
        <div class="history-intro-copy">
          <span class="history-kicker"><span>ROUTE ARCHIVE / </span>路线档案</span>
          <h1><span class="history-title-full">循着来路，读懂记录。</span><span class="history-title-compact">路线与章节档案</span></h1>
        </div>
        <div class="history-room-summary">
          <span class="history-room-count">已归档 <strong>{{ archive.archivedCount }}</strong> / 05</span>
          <RouterLink class="history-intro-action" :to="endingReady ? '/ending' : archive.endingUnlocked ? '/history/bowl' : resumeTo"><span>{{ nextActionLabel }}</span><i>→</i></RouterLink>
        </div>
      </header>
      <div class="history-room-workspace">
        <RouteArchiveMap />
        <aside class="route-directory"><header><h2>章节目录</h2><button type="button" @click="focusCurrent">当前进度 ↗</button></header><nav aria-label="五章调查目录"><button v-for="node in nodes" :key="node.item.key" type="button" :aria-pressed="selectedKey === node.item.key" @click="selectedKey = node.item.key"><small>{{ String(node.item.order).padStart(2, '0') }}</small><strong>{{ node.item.name }}</strong><span>{{ stateLabel(node.state) }}</span></button></nav><RouteDossierPanel :key="selectedKey" :item="selectedNode.item" :record="selectedNode.record" :state="selectedNode.state" /></aside>
      </div>
      <footer class="history-room-footer"><p>地图为真实历史资料，五件虚构物品的章节顺序不代表行军路线。</p><RouterLink to="/archive">返回档案室 →</RouterLink></footer>
    </section>
  </AppShell>
</template>
