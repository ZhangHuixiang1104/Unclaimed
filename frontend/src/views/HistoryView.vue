<script setup lang="ts">
import { computed, ref } from 'vue'
import AppShell from '../components/common/AppShell.vue'
import RouteArchiveMap from '../components/history/RouteArchiveMap.vue'
import RouteDossierPanel from '../components/history/RouteDossierPanel.vue'
import { archiveObjects } from '../data/objects'
import { useArchiveStore } from '../stores/archive'

const archive = useArchiveStore()
const firstRelevant = archiveObjects.find((item) => archive.getObjectStatus(item.key) === 'investigating')
  ?? [...archiveObjects].reverse().find((item) => archive.getRecord(item.key).status === 'archived')
  ?? archiveObjects[0]
const selectedKey = ref(firstRelevant.key)

const stateFor = (key: string) => {
  const record = archive.getRecord(key)
  if (record.status === 'archived') return 'complete' as const
  if (record.evidenceVerified || record.historyRevealed || record.historyRead) return 'ready' as const
  if (record.status === 'investigating' || record.foundClueIds.length > 0) return 'investigating' as const
  return 'sealed' as const
}

const routeCoordinates = [
  { x: 9, y: 72 }, { x: 29, y: 36 }, { x: 50, y: 60 }, { x: 72, y: 27 }, { x: 91, y: 47 },
]
const nodes = computed(() => archiveObjects.map((item, index) => ({ item, record: archive.getRecord(item.key), state: stateFor(item.key), ...routeCoordinates[index] })))
const selectedNode = computed(() => nodes.value.find((node) => node.item.key === selectedKey.value) ?? nodes.value[0])
const remainingObjects = computed(() => archiveObjects.length - archive.archivedCount)
const nextObject = computed(() => archiveObjects.find((item) => item.key === archive.nextObjectKey) ?? archiveObjects[0])
const nextActionLabel = computed(() => {
  if (archive.endingUnlocked) return '进入终章档案'
  return archive.getObjectStatus(nextObject.value.key) === 'investigating' ? '继续当前调查' : `接收第 ${nextObject.value.order} 件物品`
})
</script>

<template>
  <AppShell>
    <section class="history-room">
      <header class="history-room-intro">
        <div class="history-intro-copy">
          <span class="history-kicker">INVESTIGATION ORDER / 章节与史实索引</span>
          <h1>沿着证据，逐件阅读</h1>
          <p>图中折线只表示五件虚构物品的调查顺序，不是长征行军路线。完成一件调查，才开放对应的独立史实主题。</p>
          <RouterLink class="history-intro-action" :to="archive.endingUnlocked ? '/ending' : `/object/${nextObject.key}`"><span>{{ nextActionLabel }}</span><i>→</i></RouterLink>
        </div>
        <div class="history-room-metrics" aria-label="章节档案进度">
          <div><small>已开放章节</small><strong>{{ archive.archivedCount }}<i>/05</i></strong></div>
          <div><small>尚待归档</small><strong>{{ remainingObjects }}<i>件</i></strong></div>
          <div><small>总完成度</small><strong>{{ archive.progressPercent }}<i>%</i></strong></div>
        </div>
      </header>
      <div class="history-room-workspace">
        <RouteArchiveMap :nodes="nodes" :selected-key="selectedKey" @select="selectedKey = $event" />
        <RouteDossierPanel :item="selectedNode.item" :record="selectedNode.record" :state="selectedNode.state" />
      </div>
      <footer class="history-room-footer"><span>档案公开原则 01</span><p>五件游戏物品各有原创故事；历史材料分别核验，不能连成同一条真实路线。</p><RouterLink to="/archive">返回档案室 →</RouterLink></footer>
    </section>
  </AppShell>
</template>
