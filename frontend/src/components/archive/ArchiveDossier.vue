<script setup lang="ts">
import type { ArchiveObject, ObjectStatus } from '../../types/archive'

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
    <article :key="item.key" class="archive-dossier" :style="{ '--dossier-accent': item.accent }">
      <span class="dossier-binding" aria-hidden="true"></span>
      <span class="dossier-corner" aria-hidden="true"></span>

      <header class="dossier-header">
        <div>
          <span class="dossier-code">{{ item.archiveNo }}</span>
          <small>{{ String(item.order).padStart(2, '0') }} / {{ status === 'archived' ? item.historicalLabel : '路线待核验' }}</small>
        </div>
        <span class="dossier-status" :class="status">{{ statusText(status) }}</span>
      </header>

      <div class="dossier-art" :class="`art-${item.key}`" aria-hidden="true">
        <div v-if="item.key === 'list'" class="list-art">
          <span v-for="line in 7" :key="line"></span>
          <i class="water-mark one"></i><i class="water-mark two"></i>
        </div>

        <svg v-else-if="item.key === 'map'" class="map-art" viewBox="0 0 560 270">
          <path class="map-fold" d="M185 15v240M372 15v240" />
          <path class="map-river" d="M-20 190C90 90 176 235 285 142S468 84 590 34" />
          <path class="map-route route-old" d="M48 213L142 161L226 184L318 105L443 128L518 65" />
          <path class="map-route route-new" d="M48 213L126 198L205 125L296 151L390 83L518 65" />
          <circle cx="48" cy="213" r="5"/><circle cx="205" cy="125" r="5"/><circle cx="390" cy="83" r="5"/><circle cx="518" cy="65" r="5"/>
        </svg>

        <div v-else-if="item.key === 'battery'" class="battery-art">
          <span class="battery-handle"></span>
          <span class="battery-case"><i></i><b>3 · 7 · ?</b></span>
          <span class="battery-terminal left"></span><span class="battery-terminal right"></span>
          <span class="battery-wire one"></span><span class="battery-wire two"></span>
          <span class="battery-cloth"></span>
        </div>

        <div v-else-if="item.key === 'shoes'" class="shoes-art">
          <span class="shoe left"><i></i></span>
          <span class="shoe right"><i></i></span>
          <span class="shoe-thread"></span>
        </div>

        <div v-else class="bowl-art">
          <span class="bowl-rim"></span>
          <span class="bowl-body"></span>
          <i class="bowl-mark first"></i><i class="bowl-mark second"></i>
        </div>

        <span class="art-scale">0　1　2　3 CM</span>
        <span class="art-caption">数字复原示意 / 线索定位用</span>
      </div>

      <section class="dossier-copy">
        <span class="dossier-section-label">OBJECT RECORD / {{ String(item.order).padStart(2, '0') }}</span>
        <h2>{{ item.name }}</h2>
        <p class="dossier-subtitle">{{ item.subtitle }}</p>
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

