<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  cluesFound: number
  cluesTotal: number
  claimsReviewed: number
  claimsTotal: number
  classifiedCount: number
  classifiedTotal: number
  evidenceVerified: boolean
  historyRevealed: boolean
  historyRead: boolean
}>()

const emit = defineEmits<{ reveal: [] }>()
const cluesReady = computed(() => props.cluesFound >= props.cluesTotal)
const claimsReady = computed(() => props.claimsReviewed >= props.claimsTotal)
const classificationReady = computed(() => props.classifiedCount >= props.classifiedTotal)
</script>

<template>
  <section class="history-gate" :class="{ unlocked: evidenceVerified, read: historyRead }">
    <div class="history-gate-seal" aria-hidden="true">
      <span>{{ evidenceVerified ? '阅' : '封' }}</span>
    </div>

    <div class="history-gate-copy">
      <span class="history-gate-code">HISTORY RECORD / SEALED</span>
      <template v-if="cluesFound < cluesTotal">
        <h2>史实档案尚未开放</h2>
        <p>还需发现 {{ cluesTotal - cluesFound }} 条线索，才能开始证据判断。</p>
      </template>
      <template v-else-if="!evidenceVerified">
        <h2>史实档案等待核验</h2>
        <p>线索已经齐全。完成三项证据判断后，才能与历史档案核对。</p>
      </template>
      <template v-else>
        <h2>{{ historyRead ? '史实档案已阅' : '证据核验完成' }}</h2>
        <p>{{ historyRead ? '这份记录已经进入物件档案，仍可再次核对。' : '现有判断已经与物件痕迹相互印证。现在，可以揭开密封档案。' }}</p>
      </template>
    </div>

    <div class="history-progress-chart" aria-label="调查进度折线图">
      <div class="chart-heading">
        <span>调查进度</span>
        <strong>{{ evidenceVerified ? '核验完成' : '进行中' }}</strong>
      </div>
      <svg viewBox="0 0 260 76" role="img" aria-hidden="true">
        <line x1="14" y1="54" x2="85" y2="35" :class="{ done: cluesReady }" />
        <line x1="85" y1="35" x2="158" y2="46" :class="{ done: claimsReady }" />
        <line x1="158" y1="46" x2="246" y2="17" :class="{ done: evidenceVerified }" />
        <circle cx="14" cy="54" r="4" class="done" />
        <circle cx="85" cy="35" r="4" :class="{ done: cluesReady }" />
        <circle cx="158" cy="46" r="4" :class="{ done: claimsReady }" />
        <circle cx="246" cy="17" r="4" :class="{ done: evidenceVerified, current: classificationReady && !evidenceVerified }" />
      </svg>
      <div class="chart-labels">
        <span>开始</span><span>痕迹</span><span>筛选</span><span>史实</span>
      </div>
    </div>

    <button v-if="evidenceVerified" class="history-reveal-button" type="button" @click="emit('reveal')">
      <small>{{ historyRevealed ? 'REOPEN' : 'UNSEAL' }}</small>
      <span>{{ historyRevealed ? '再次查看史实档案' : '揭开史实档案' }}</span>
      <i>→</i>
    </button>
    <div v-else class="history-gate-lock">
      <span>{{ String(cluesFound).padStart(2, '0') }} / {{ String(cluesTotal).padStart(2, '0') }}</span>
      <small>{{ cluesFound < cluesTotal ? '线索登记中' : '等待证据判断' }}</small>
    </div>
  </section>
</template>

