<script setup lang="ts">
import { archiveObjects } from '../../data/objects'
import { useArchiveStore } from '../../stores/archive'

defineProps<{
  currentKey: string
  evidenceCounts: { confirmed: number; inferred: number; unknown: number }
}>()

const archive = useArchiveStore()
</script>

<template>
  <aside class="duty-board">
    <header class="duty-board-heading">
      <span>NIGHT DUTY LOG</span>
      <strong>值守记录</strong>
      <small>{{ archive.keeperNumber }}</small>
    </header>

    <section class="evidence-summary">
      <span class="board-label">今晚已记录</span>
      <div><span>直接证据</span><strong>{{ String(evidenceCounts.confirmed).padStart(2, '0') }}</strong></div>
      <div><span>合理推测</span><strong>{{ String(evidenceCounts.inferred).padStart(2, '0') }}</strong></div>
      <div><span>仍然未知</span><strong>{{ String(evidenceCounts.unknown).padStart(2, '0') }}</strong></div>
    </section>

    <section class="duty-note">
      <span class="board-label">工作便签 / 01</span>
      <blockquote>“别先问它们属于谁。先问，它们经历过什么。”</blockquote>
      <small>请勿替未知填写姓名</small>
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

