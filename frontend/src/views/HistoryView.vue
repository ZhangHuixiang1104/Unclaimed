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
const publishedMaterials = computed(() => archive.archivedCount * 2)
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
          <span class="history-kicker">LONG MARCH ROUTE ARCHIVE / 路线档案</span>
          <h1>沿着遗物留下的方向</h1>
          <p>每完成一件失物调查，就会恢复一段被封存的路线。未完成的节点不会提前公开地点与史实。</p>
          <RouterLink class="history-intro-action" :to="archive.endingUnlocked ? '/ending' : `/object/${nextObject.key}`"><span>{{ nextActionLabel }}</span><i>→</i></RouterLink>
        </div>
        <div class="history-room-metrics" aria-label="路线档案恢复进度">
          <div><small>已恢复路线</small><strong>{{ archive.archivedCount }}<i>/05</i></strong></div>
          <div><small>已公开材料</small><strong>{{ publishedMaterials }}<i>份</i></strong></div>
          <div><small>总完成度</small><strong>{{ archive.progressPercent }}<i>%</i></strong></div>
        </div>
      </header>
      <div class="history-room-workspace">
        <RouteArchiveMap :nodes="nodes" :selected-key="selectedKey" @select="selectedKey = $event" />
        <RouteDossierPanel :item="selectedNode.item" :record="selectedNode.record" :state="selectedNode.state" />
      </div>
      <footer class="history-room-footer"><span>档案公开原则 01</span><p>先完成调查，再公布史实；先说明证据边界，再讲述人物故事。</p><RouterLink to="/archive">返回档案室 →</RouterLink></footer>
    </section>
  </AppShell>
</template>
