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
          <span>HISTORY RECORD / {{ item.archiveNo }}</span>
          <small>经证据核验后开放</small>
        </div>
        <strong>{{ item.historicalLabel }}</strong>
      </header>

      <section class="history-context">
        <span class="history-section-no">01 / 历史背景</span>
        <h2>{{ item.historicalLabel }}</h2>
        <p v-if="history"><strong>{{ history.period }}。</strong>{{ history.summary }}</p>
        <p v-if="history" class="history-object-relation">{{ history.relation }}</p>
        <div class="source-line">
          <span>材料边界</span>
          <strong>{{ history?.boundary ?? '资料待核验' }}</strong>
        </div>
      </section>

      <section class="history-boundaries">
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
        <p>史实不是标准答案，而是证据能够抵达的边界。</p>
        <button v-if="status !== 'archived'" type="button" @click="emit('archive')">我已阅读，建立物件档案 →</button>
        <button v-else type="button" @click="emit('close')">返回检查台 →</button>
      </footer>
    </article>
  </div>
</template>

