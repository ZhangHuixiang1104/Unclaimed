<script setup lang="ts">
import type { ArchiveObject, ObjectStatus } from '../../types/archive'
import { objectArtwork as artwork } from '../../data/objectArtwork'

defineProps<{
  item: ArchiveObject
  status: ObjectStatus
  foundCount: number
}>()

const statusText = (status: ObjectStatus) => {
  if (status === 'archived') return '已归档'
  if (status === 'investigating') return '调查中'
  if (status === 'locked') return '尚未接收'
  return '待整理'
}
</script>

<template>
  <Transition name="dossier-swap" mode="out-in">
    <article :key="item.key" class="archive-dossier" :class="{ locked: status === 'locked' }" :style="{ '--dossier-accent': item.accent }">
      <span class="dossier-binding" aria-hidden="true"></span>
      <span class="dossier-corner" aria-hidden="true"></span>

      <header class="dossier-header">
        <div>
          <span class="dossier-code">{{ item.archiveNo }}</span>
          <small>{{ String(item.order).padStart(2, '0') }} / {{ status === 'archived' ? item.historicalLabel : '史实主题封存' }}</small>
        </div>
        <span class="dossier-status" :class="status">{{ statusText(status) }}</span>
      </header>

      <div class="dossier-art" :class="`art-${item.key}`" aria-hidden="true">
        <img class="dossier-artwork" :src="artwork[item.key]" alt="">
        <span class="art-caption">原创虚构物件 / 美术展示</span>
      </div>

      <section class="dossier-copy">
        <span class="dossier-section-label">OBJECT RECORD / {{ String(item.order).padStart(2, '0') }}</span>
        <h2>{{ item.name }}</h2>
        <p class="dossier-subtitle">{{ status === 'locked' ? '完成上一份档案后开放调查' : item.subtitle }}</p>
        <p class="dossier-intro">{{ status === 'locked' ? '完成前一份物件档案后，这件物品将被送到检查台。' : item.intro }}</p>
      </section>

      <footer class="dossier-footer">
        <div class="dossier-clue-progress">
          <span>发现线索</span>
          <strong>{{ String(foundCount).padStart(2, '0') }} / {{ String(item.clues.length).padStart(2, '0') }}</strong>
          <i><b :style="{ width: `${(foundCount / item.clues.length) * 100}%` }"></b></i>
        </div>
        <RouterLink v-if="status !== 'locked'" class="dossier-action" :to="`/object/${item.key}`">
          {{ status === 'archived' ? '重新查看档案' : status === 'investigating' ? '继续检查' : '放到检查台' }}
          <span>→</span>
        </RouterLink>
        <span v-else class="dossier-action dossier-action-locked" aria-disabled="true">等待上一份归档 <span>封</span></span>
      </footer>

      <span v-if="status === 'archived'" class="archived-stamp">已存档</span>
    </article>
  </Transition>
</template>

