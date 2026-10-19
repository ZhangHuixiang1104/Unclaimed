<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { historyRecords } from '../../data/historyRecords'
import type { ArchiveObject, EvidenceLevel, ObjectStatus } from '../../types/archive'

const props = defineProps<{
  item: ArchiveObject
  status: ObjectStatus
}>()

const emit = defineEmits<{
  close: []
  archive: []
}>()

const conclusionsByLevel = computed(() => {
  const result: Record<EvidenceLevel, typeof props.item.conclusions> = { confirmed: [], inferred: [], unknown: [] }
  props.item.conclusions.forEach((conclusion) => result[conclusion.expectedLevel].push(conclusion))
  return result
})
const history = computed(() => historyRecords[props.item.key])

const handleKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', handleKey))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKey))
</script>

<template>
  <div class="history-reveal-overlay" role="dialog" aria-modal="true" aria-label="史实档案" @click.self="emit('close')">
    <article class="history-reveal-document">
      <button class="history-close" type="button" aria-label="关闭史实档案" @click="emit('close')">×</button>
      <span class="history-document-binding" aria-hidden="true"></span>

      <header class="history-document-header">
        <div>
          <span>HISTORY CONTEXT / {{ item.archiveNo }}</span>
          <small>{{ item.key === 'list' ? '读完虚构名单故事后开放' : '经证据核验后开放' }}</small>
        </div>
        <strong>{{ item.historicalLabel }}</strong>
      </header>

      <section class="history-context">
        <span class="history-section-no">01 / 历史背景</span>
        <h2>{{ item.historicalLabel }}</h2>
        <p v-if="history"><strong>{{ history.period }}。</strong>{{ history.summary }}</p>
        <p v-if="history" class="history-object-relation">{{ history.relation }}</p>
        <a v-if="history?.materials.find((material) => material.url)" :href="history.materials.find((material) => material.url)?.url" target="_blank" rel="noopener noreferrer">阅读本章史实来源 ↗</a>
        <div class="source-line">
          <span>材料边界</span>
          <strong>{{ history?.boundary ?? '游戏叙事与真实历史应分别阅读。' }}</strong>
        </div>
      </section>

      <section v-if="item.key === 'list'" class="history-boundaries">
        <h2>游戏名单与史实，分别保存</h2>
        <article class="boundary confirmed">
          <span>虚构纸件写到</span>
          <div><strong>器材、物料之后，是「后随二人」。</strong><p>这张纸将第三项记为待交接，并写有「回执另存」。</p></div>
        </article>
        <article class="boundary unknown">
          <span>虚构纸件没有写到</span>
          <div><strong>两人的姓名与后来的结局。</strong><p>缺失的纸角和不在场的回执不能由真实史料替它补写。</p></div>
        </article>
      </section>

      <section v-else class="history-boundaries">
        <h2>本件物品的证据结论</h2>
        <article class="boundary confirmed">
          <span>可以确认</span>
          <div v-for="entry in conclusionsByLevel.confirmed" :key="entry.id">
            <strong>{{ entry.text }}</strong>
            <p>{{ entry.explanation }}</p>
          </div>
        </article>
        <article class="boundary inferred">
          <span>合理推测</span>
          <div v-for="entry in conclusionsByLevel.inferred" :key="entry.id">
            <strong>{{ entry.text }}</strong>
            <p>{{ entry.explanation }}</p>
          </div>
        </article>
        <article class="boundary unknown">
          <span>仍然未知</span>
          <div v-for="entry in conclusionsByLevel.unknown" :key="entry.id">
            <strong>{{ entry.text }}</strong>
            <p>{{ entry.explanation }}</p>
          </div>
        </article>
      </section>

      <footer class="history-document-footer">
        <p>{{ item.key === 'list' ? '上方是有来源的真实史事，下方是虚构名单的故事边界；两页不能混作同一份文物。' : '上方历史背景与下方游戏推理属于两类材料；请不要把虚构物件当作文物。' }}</p>
        <button v-if="status !== 'archived'" type="button" @click="emit('archive')">我已阅读，建立物件档案 →</button>
        <button v-else type="button" @click="emit('close')">返回检查台 →</button>
      </footer>
    </article>
  </div>
</template>

