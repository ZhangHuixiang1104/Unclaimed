<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ArchiveObject, EvidenceLevel } from '../../types/archive'
import { useArchiveStore } from '../../stores/archive'

const props = defineProps<{ item: ArchiveObject }>()
const emit = defineEmits<{
  verified: []
  review: [clueId: string]
}>()
const archive = useArchiveStore()
const submitted = ref(false)
const screeningMessage = ref('五条说法都需要处理，再提交本轮筛选。')
const selectedStamp = ref<EvidenceLevel | null>(null)
const stampHint = ref('先拿起一枚印章，再盖到对应结论上。')
const levels: Array<{ value: EvidenceLevel; label: string; code: string }> = [
  { value: 'confirmed', label: '可确认', code: 'FACT' },
  { value: 'inferred', label: '可推测', code: 'INFER' },
  { value: 'unknown', label: '仍未知', code: 'OPEN' },
]

const record = computed(() => archive.getRecord(props.item.key))
const allFound = computed(() => record.value.foundClueIds.length === props.item.clues.length)
const isArchived = computed(() => record.value.status === 'archived')
const allClassified = computed(() => props.item.conclusions.every((entry) => record.value.classified[entry.id]))
const correctCount = computed(() => props.item.conclusions.filter((entry) => record.value.classified[entry.id] === entry.expectedLevel).length)
const claimCandidates = computed(() => {
  const decoys = [
    { id: 'decoy-same-time', text: '能否从现有痕迹精确推算这件物品被购买的日期？' },
    { id: 'decoy-owner', text: '能否从现有痕迹确认制作它的具体作坊？' },
  ]
  return [
    { id: props.item.conclusions[0].id, text: props.item.conclusions[0].screeningQuestion },
    decoys[0],
    { id: props.item.conclusions[1].id, text: props.item.conclusions[1].screeningQuestion },
    decoys[1],
    { id: props.item.conclusions[2].id, text: props.item.conclusions[2].screeningQuestion },
  ]
})
const reviewedCount = computed(() => record.value.acceptedConclusionIds.length + record.value.rejectedClaimIds.length)
const screeningComplete = computed(() => isArchived.value || record.value.screeningVerified || record.value.evidenceVerified)
const orderedEvidence = computed(() => record.value.foundClueIds
  .map((id) => props.item.clues.find((clue) => clue.id === id))
  .filter((clue): clue is ArchiveObject['clues'][number] => Boolean(clue)))
const levelLabel = (value?: EvidenceLevel) => levels.find((level) => level.value === value)?.label

const reviewClaim = (claimId: string, relevant: boolean) => {
  if (isArchived.value) return
  archive.reviewClaim(props.item.key, claimId, relevant)
  screeningMessage.value = '选择已记录。可以更改，处理完五条后提交筛选。'
}

const submitScreening = () => {
  if (reviewedCount.value !== claimCandidates.value.length) return
  const approved = archive.verifyScreening(props.item.key)
  screeningMessage.value = approved
    ? '筛选通过。现在给保留下来的三条说法标注证据等级。'
    : '有些说法超出了物证范围。回看证物袋，调整判断后再提交。'
}

const selectStamp = (level: EvidenceLevel) => {
  if (isArchived.value) return
  selectedStamp.value = selectedStamp.value === level ? null : level
  submitted.value = false
  stampHint.value = selectedStamp.value ? `已拿起“${levelLabel(selectedStamp.value)}”印章，选择一条结论盖章。` : '印章已经放回托盘。'
}

const applyStamp = (conclusionId: string) => {
  if (isArchived.value) return
  if (!selectedStamp.value) {
    stampHint.value = '请先从印章托盘中选择证据等级。'
    return
  }
  archive.classify(props.item.key, conclusionId, selectedStamp.value)
  submitted.value = false
  stampHint.value = `已盖下“${levelLabel(selectedStamp.value)}”，可以继续处理其他结论。`
}

const submit = () => {
  if (isArchived.value) return
  if (!allClassified.value || !screeningComplete.value) return
  submitted.value = true
  const verified = correctCount.value === props.item.conclusions.length
  archive.verifyEvidence(props.item.key, verified)
  if (verified) emit('verified')
}

const clearAnswers = () => {
  if (isArchived.value) return
  submitted.value = false
  selectedStamp.value = null
  props.item.conclusions.forEach((entry) => delete record.value.classified[entry.id])
  archive.verifyEvidence(props.item.key, false)
  stampHint.value = '印章已经全部清除，可以重新判断。'
}
</script>

<template>
  <aside class="evidence-panel panel">
    <header class="panel-heading compact evidence-board-heading">
      <div>
        <span class="eyebrow">EVIDENCE WORKBOARD</span>
        <h2>证据工作板</h2>
      </div>
      <div class="evidence-counter">
        <strong>{{ String(record.foundClueIds.length).padStart(2, '0') }}</strong>
        <span>/ {{ String(item.clues.length).padStart(2, '0') }}</span>
      </div>
    </header>

    <section class="evidence-pocket-section">
      <div class="board-section-heading">
        <span>01 / 证物袋</span>
        <small>按发现顺序登记</small>
      </div>

      <div class="evidence-pocket-stack">
        <button
          v-for="(clue, index) in orderedEvidence"
          :key="clue.id"
          type="button"
          class="evidence-slip"
          :style="{ '--slip-index': index }"
          @click="emit('review', clue.id)"
        >
          <span class="slip-index">证物 {{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ clue.title }}</strong>
          <p>{{ clue.description }}</p>
          <span class="slip-action">回看位置 ↗</span>
        </button>

        <div
          v-for="slot in item.clues.length - orderedEvidence.length"
          :key="`pocket-${slot}`"
          class="empty-evidence-pocket"
        >
          <span>EMPTY POCKET</span>
          <strong>等待玩家标记</strong>
        </div>
      </div>
    </section>

    <div v-if="!allFound" class="classification-sealed evidence-seal">
      <span>02 / INFERENCE SHEET</span>
      <strong>推理记录仍在封存</strong>
      <p>再登记 {{ item.clues.length - record.foundClueIds.length }} 处痕迹后打开。</p>
      <i aria-hidden="true">封</i>
    </div>

    <section v-else-if="!screeningComplete" class="claim-screening">
      <div class="board-section-heading">
        <span>02 / 待核验说法</span>
        <small>{{ reviewedCount }} / {{ claimCandidates.length }} 已处理</small>
      </div>
      <p class="claim-screening-intro">五个问题中有三个可以围绕现有痕迹展开判断，另两个缺少可用物证。逐一决定收入或排除。</p>
      <div class="claim-candidate-stack">
        <div
          v-for="(claim, index) in claimCandidates"
          :key="claim.id"
          class="claim-choice"
          :class="{
            accepted: record.acceptedConclusionIds.includes(claim.id),
            rejected: record.rejectedClaimIds.includes(claim.id),
          }"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <p>{{ claim.text }}</p>
          <div class="claim-choice-actions">
            <button type="button" :aria-pressed="record.acceptedConclusionIds.includes(claim.id)" :disabled="isArchived" @click="reviewClaim(claim.id, true)">收入</button>
            <button type="button" :aria-pressed="record.rejectedClaimIds.includes(claim.id)" :disabled="isArchived" @click="reviewClaim(claim.id, false)">排除</button>
          </div>
        </div>
      </div>
      <p class="screening-feedback" role="status">{{ screeningMessage }}</p>
      <div class="screening-progress">
        <span :style="{ width: `${(reviewedCount / claimCandidates.length) * 100}%` }"></span>
      </div>
      <button class="primary-button screening-submit" type="button" :disabled="reviewedCount !== claimCandidates.length" @click="submitScreening">提交线索筛选 →</button>
    </section>

    <section v-else class="classification inference-sheet">
      <div class="board-section-heading">
        <span>02 / 推理记录</span>
        <small>选择印章，再点击结论</small>
      </div>

      <div class="stamp-tray" aria-label="证据等级印章">
        <button
          v-for="level in levels"
          :key="level.value"
          type="button"
          :class="[level.value, { selected: selectedStamp === level.value }]"
          :disabled="isArchived"
          @click="selectStamp(level.value)"
        >
          <small>{{ level.code }}</small>
          <strong>{{ level.label }}</strong>
        </button>
      </div>
      <p class="stamp-hint">{{ stampHint }}</p>

      <div class="conclusion-stack">
        <button
          v-for="(conclusion, index) in item.conclusions"
          :key="conclusion.id"
          type="button"
          :class="['conclusion-slip', { stamped: record.classified[conclusion.id] }]"
          :disabled="isArchived"
          @click="applyStamp(conclusion.id)"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <p>{{ conclusion.text }}</p>
          <i v-if="record.classified[conclusion.id]" :class="record.classified[conclusion.id]">
            {{ levelLabel(record.classified[conclusion.id]) }}
          </i>
          <small v-if="submitted && record.classified[conclusion.id] !== conclusion.expectedLevel" class="feedback warning">证据范围不支持这枚印章</small>
          <small v-if="submitted && record.classified[conclusion.id] === conclusion.expectedLevel" class="feedback success">核验一致</small>
        </button>
      </div>

      <div v-if="submitted" :class="['verification-result', { success: record.evidenceVerified }]">
        {{ record.evidenceVerified ? '核验通过，史实档案封条已经解除。' : `其中 ${item.conclusions.length - correctCount} 枚印章超出了证据能够支持的范围。` }}
      </div>
      <div class="classification-actions">
        <button type="button" class="clear-button" :disabled="!allClassified || isArchived" @click="clearAnswers">清除印章</button>
        <button class="primary-button" type="button" :disabled="!allClassified || isArchived" @click="submit">
          {{ record.evidenceVerified ? '证据核验已通过 ✓' : '提交核验 →' }}
        </button>
      </div>
    </section>
  </aside>
</template>
