<script setup lang="ts">
import { computed } from 'vue'
import { archiveObjects } from '../../data/objects'
import { useArchiveStore } from '../../stores/archive'

defineProps<{ currentKey: string }>()

const archive = useArchiveStore()
const foundClues = computed(() => archiveObjects.reduce((total, item) => total + archive.getRecord(item.key).foundClueIds.length, 0))
const completedInvestigations = computed(() => archiveObjects.filter((item) => archive.getRecord(item.key).evidenceVerified).length)
const currentTask = computed(() => {
  const item = archiveObjects.find((entry) => entry.key === archive.nextObjectKey)
  if (!item) return null
  const record = archive.getRecord(item.key)
  if (record.historyRevealed) return { title: `翻阅「${item.name}」的史实`, detail: '物件故事已记录，继续阅读独立史实材料。', to: `/history/${item.key}`, action: '继续翻阅史实' }
  if (record.evidenceVerified) return { title: `揭露「${item.name}」的史实`, detail: '线索已收齐，请从检查台主动开启真实档案。', to: `/object/${item.key}`, action: '返回检查台' }
  return { title: `检查「${item.name}」`, detail: '观察物件、找到故事线索，再整理调查经过。', to: `/object/${item.key}`, action: record.status === 'investigating' ? '继续调查' : '开始调查' }
})
</script>

<template>
  <aside class="duty-board">
    <header class="duty-board-heading">
      <span>NIGHT DUTY LOG</span>
      <strong>值守记录</strong>
      <small>{{ archive.keeperNumber }}</small>
    </header>

    <section class="evidence-summary">
      <span class="board-label">调查记录</span>
      <div><span>已发现线索</span><strong>{{ String(foundClues).padStart(2, '0') }}</strong></div>
      <div><span>已完成调查</span><strong>{{ String(completedInvestigations).padStart(2, '0') }} / 05</strong></div>
      <div><span>已归档史实</span><strong>{{ String(archive.archivedCount).padStart(2, '0') }} / 05</strong></div>
    </section>

    <section v-if="currentTask" class="duty-note">
      <span class="board-label">下一步 / 当前值守</span>
      <strong>{{ currentTask.title }}</strong>
      <p>{{ currentTask.detail }}</p>
      <RouterLink :to="currentTask.to">{{ currentTask.action }} →</RouterLink>
    </section>
    <section v-else class="duty-note">
      <span class="board-label">值守完成</span>
      <strong>五件档案均已归档</strong>
      <p>每件虚构物品的故事与真实史料，已分别保存。</p>
      <RouterLink to="/ending">翻阅终章 →</RouterLink>
    </section>

    <section class="mini-route">
      <div class="mini-route-heading">
        <span class="board-label">路线进度</span>
        <strong>{{ archive.archivedCount }} / 5</strong>
      </div>
      <div class="mini-route-track">
        <span class="mini-route-line" aria-hidden="true"></span>
        <span
          v-for="item in archiveObjects"
          :key="item.key"
          class="mini-route-node"
          :class="{
            current: currentKey === item.key,
            archived: archive.getRecord(item.key).status === 'archived',
          }"
          :title="archive.getRecord(item.key).status === 'archived' ? item.historicalLabel : `第 ${item.order} 段路线待恢复`"
        ><i></i></span>
      </div>
      <div class="mini-route-labels"><span>路线起点</span><span>最后一段</span></div>
    </section>

    <RouterLink v-if="archive.endingUnlocked" class="ending-seal" to="/ending">
      <small>SEALED FILE / OPEN</small>
      <strong>终章档案已开放</strong>
      <span>查看无人认领记录 →</span>
    </RouterLink>
    <div v-else class="ending-seal locked">
      <small>SEALED FILE / LOCKED</small>
      <strong>终章档案未开放</strong>
      <span>再完成 {{ Math.max(0, archiveObjects.length - archive.archivedCount) }} 份档案</span>
    </div>
  </aside>
</template>

