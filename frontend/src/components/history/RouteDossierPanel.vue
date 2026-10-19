<script setup lang="ts">
import { computed } from 'vue'
import type { ArchiveObject, ObjectRecord } from '../../types/archive'

const props = defineProps<{ item: ArchiveObject; record: ObjectRecord; state: 'sealed' | 'investigating' | 'ready' | 'complete' }>()
const foundCount = computed(() => props.record.foundClueIds.length)
const progress = computed(() => {
  if (props.state === 'complete') return 100
  const cluePart = Math.min(foundCount.value / props.item.clues.length, 1) * 55
  const evidencePart = props.record.evidenceVerified ? 30 : Object.keys(props.record.classified).length / props.item.conclusions.length * 25
  const historyPart = props.record.historyRead ? 15 : props.record.historyRevealed ? 8 : 0
  return Math.round(cluePart + evidencePart + historyPart)
})
</script>

<template>
  <aside :class="['route-dossier-panel', state]" aria-live="polite">
    <header><span>NODE FILE / 0{{ item.order }}</span><strong>{{ state === 'complete' ? '史实已公开' : state === 'ready' ? '等待归档' : state === 'investigating' ? '调查进行中' : '档案封存' }}</strong></header>
    <div v-if="state === 'complete'" class="route-dossier-open">
      <div class="route-dossier-stamp">核验</div><span class="route-dossier-location">{{ item.historicalLabel }}</span><h2>{{ item.name }}</h2><p>{{ item.subtitle }}</p>
      <dl><div><dt>档案编号</dt><dd>{{ item.archiveNo }}</dd></div><div><dt>线索记录</dt><dd>{{ foundCount }} / {{ item.clues.length }}</dd></div><div><dt>史实材料</dt><dd>{{ item.key === 'list' ? '4 站资料' : '待逐章核验' }}</dd></div></dl>
      <RouterLink class="route-dossier-action" :to="`/history/${item.key}`"><span>打开史实档案</span><i>→</i></RouterLink>
      <RouterLink class="route-dossier-secondary" :to="`/object/${item.key}`">回看调查记录</RouterLink>
    </div>
    <div v-else class="route-dossier-sealed">
      <div class="sealed-document" aria-hidden="true"><span>SEAL</span><i></i><i></i><i></i></div>
      <span class="route-dossier-location">第 0{{ item.order }} 件物品</span><h2>{{ state === 'ready' ? record.historyRevealed ? '史实待完成归档' : '证据已核验，等待揭示' : state === 'investigating' ? '对应物件仍在检查台上' : '尚未建立物件档案' }}</h2><p>独立史实主题将在对应调查完成后公开；这张图仅表示调查顺序。</p>
      <div class="dossier-progress"><span><i :style="{ width: `${progress}%` }"></i></span><small>{{ progress }}% 调查进度</small></div>
      <RouterLink class="route-dossier-action muted-action" :to="state === 'sealed' ? '/archive' : item.key === 'list' && record.historyRevealed ? '/history/list' : `/object/${item.key}`"><span>{{ state === 'sealed' ? '返回档案室选择物件' : item.key === 'list' && record.historyRevealed ? '继续翻阅真实档案' : '继续完成物件调查' }}</span><i>→</i></RouterLink>
    </div>
  </aside>
</template>
