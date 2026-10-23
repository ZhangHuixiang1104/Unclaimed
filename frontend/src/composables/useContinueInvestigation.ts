import { computed } from 'vue'
import { archiveObjects } from '../data/objects'
import { useArchiveStore } from '../stores/archive'

export const useContinueInvestigation = () => {
  const archive = useArchiveStore()
  const item = computed(() => archiveObjects.find(item => item.key === archive.nextObjectKey) ?? archiveObjects[archiveObjects.length - 1]!)
  const record = computed(() => archive.getRecord(item.value.key))
  const to = computed(() => archive.endingUnlocked ? '/ending' : record.value.historyRevealed ? `/history/${item.value.key}` : `/object/${item.value.key}`)
  const label = computed(() => archive.endingUnlocked ? '进入终章' : record.value.historyRevealed ? '继续阅读史实' : record.value.status === 'investigating' ? '继续调查' : '开始调查')
  const task = computed(() => archive.endingUnlocked ? '五件物品的故事与史实都已归档，选一件物品，留下你的陈列说明。' : record.value.historyRevealed ? '故事已记录。继续翻阅四份史实材料，完成这一章的建档。' : record.value.evidenceVerified ? '展签已保存。从检查台打开独立史实，完成这一章的建档。' : record.value.status === 'investigating' ? '接着上次的痕迹继续观察，收齐线索后整理一条有依据的展签。' : '这件物品已经可以接收。先观察它的痕迹，再慢慢读出故事。')
  return { item, to, label, task }
}
