<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  storyMode?: boolean
  storySubject?: string
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
const claimsReady = computed(() => props.storyMode ? props.evidenceVerified : props.claimsReviewed >= props.claimsTotal)
const classificationReady = computed(() => props.storyMode ? props.evidenceVerified : props.classifiedCount >= props.classifiedTotal)
const section = ref<HTMLElement | null>(null)
defineExpose({ scrollIntoView: () => section.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }) })
</script>

<template>
  <section ref="section" class="history-gate" :class="{ unlocked: evidenceVerified, read: historyRead }">
    <div class="history-gate-seal" aria-hidden="true">
      <span>{{ evidenceVerified ? '阅' : '封' }}</span>
    </div>

    <div class="history-gate-copy">
      <span class="history-gate-code">{{ storyMode ? 'FICTION → HISTORY / 故事与史实分界' : 'HISTORY RECORD / SEALED' }}</span>
      <template v-if="cluesFound < cluesTotal">
        <h2>史实档案尚未开放</h2>
        <p>{{ storyMode ? `这张${storySubject ?? '名单'}还有 ${cluesTotal - cluesFound} 段故事没有读到。先听它把自己的话说完。` : `还需发现 ${cluesTotal - cluesFound} 条线索，才能开始证据判断。` }}</p>
      </template>
      <template v-else-if="!evidenceVerified">
        <h2>{{ storyMode ? '先保存这页纸的故事' : '先完成证据判断' }}</h2>
        <p>{{ storyMode ? `${storySubject === '行军图' ? '四段故事' : '三幕'}都读到了。回到上方，为这张${storySubject ?? '名单'}保留一句有边界的记录。` : '线索已经齐全。完成三项证据判断后，才能与历史档案核对。' }}</p>
      </template>
      <template v-else>
        <h2>{{ historyRead ? '史实档案已阅' : (storyMode ? `${storySubject ?? '名单'}故事已保存` : '证据核验完成') }}</h2>
        <p>{{ historyRead ? '这份记录已经进入物件档案，仍可再次核对。' : (storyMode ? (storySubject === '行军图' ? '这张虚构图停在“等信”。下一页是独立史实，不会替纸上队伍补写结局。' : '游戏纸件停在这里。下一页是真实手迹与有出处的材料，不会替虚构人物写结局。') : '现有判断已经与物件痕迹相互印证。现在，可以揭开密封档案。') }}</p>
      </template>
    </div>

    <div class="history-progress-chart" aria-label="调查进度折线图">
      <div class="chart-heading">
        <span>调查进度</span>
        <strong>{{ evidenceVerified ? (storyMode ? '故事已保存' : '核验完成') : '进行中' }}</strong>
      </div>
      <svg viewBox="0 0 260 76" role="img" aria-hidden="true">
        <line x1="14" y1="54" x2="85" y2="35" :class="{ done: cluesReady }" />
        <line x1="85" y1="35" x2="158" y2="46" :class="{ done: claimsReady }" />
        <line x1="158" y1="46" x2="246" y2="17" :class="{ done: historyRevealed }" />
        <circle cx="14" cy="54" r="4" class="done" />
        <circle cx="85" cy="35" r="4" :class="{ done: cluesReady }" />
        <circle cx="158" cy="46" r="4" :class="{ done: claimsReady }" />
        <circle cx="246" cy="17" r="4" :class="{ done: historyRevealed, current: classificationReady && !historyRevealed }" />
      </svg>
      <div class="chart-labels">
        <span>开始</span><span>{{ storyMode ? '片段' : '痕迹' }}</span><span>{{ storyMode ? '收束' : '筛选' }}</span><span>{{ storyMode ? '史实' : '揭露' }}</span>
      </div>
    </div>

    <button v-if="evidenceVerified" class="history-reveal-button" type="button" @click="emit('reveal')">
      <small>{{ historyRevealed ? 'REOPEN' : 'UNSEAL' }}</small>
      <span>{{ storyMode ? (historyRevealed ? '重访真实档案' : '翻阅真实档案') : (historyRevealed ? '再次查看史实档案' : '揭开史实档案') }}</span>
      <i>→</i>
    </button>
    <div v-else class="history-gate-lock">
      <span>{{ String(cluesFound).padStart(2, '0') }} / {{ String(cluesTotal).padStart(2, '0') }}</span>
      <small>{{ storyMode ? (cluesFound < cluesTotal ? '故事阅读中' : '等待故事收束') : (cluesFound < cluesTotal ? '线索登记中' : '等待证据判断') }}</small>
    </div>
  </section>
</template>

