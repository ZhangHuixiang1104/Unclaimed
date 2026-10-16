<script setup lang="ts">
import { computed } from 'vue'
import type { ArchiveObject, EvidenceLevel } from '../../types/archive'
import { useArchiveStore } from '../../stores/archive'

const props = defineProps<{ item: ArchiveObject }>()
const emit = defineEmits<{ complete: [] }>()
const archive = useArchiveStore()
const levels: Array<{ value: EvidenceLevel; label: string }> = [
  { value: 'confirmed', label: '可确认' },
  { value: 'inferred', label: '可推测' },
  { value: 'unknown', label: '仍未知' },
]

const record = computed(() => archive.getRecord(props.item.key))
const allFound = computed(() => record.value.foundClueIds.length === props.item.clues.length)
const allClassified = computed(() => props.item.conclusions.every((entry) => record.value.classified[entry.id]))
const correctCount = computed(() => props.item.conclusions.filter((entry) => record.value.classified[entry.id] === entry.expectedLevel).length)

const submit = () => {
  if (allClassified.value && correctCount.value === props.item.conclusions.length) emit('complete')
}
</script>

<template>
  <aside class="evidence-panel panel">
    <header class="panel-heading compact">
      <div>
        <span class="eyebrow">证据板</span>
        <h2>痕迹与结论</h2>
      </div>
      <span class="evidence-count">{{ record.foundClueIds.length }}/{{ item.clues.length }}</span>
    </header>

    <div class="clue-stack">
      <article v-for="clue in item.clues" :key="clue.id" :class="['clue-card', { hidden: !record.foundClueIds.includes(clue.id) }]">
        <span>{{ record.foundClueIds.includes(clue.id) ? '物件痕迹' : '尚未发现' }}</span>
        <strong>{{ record.foundClueIds.includes(clue.id) ? clue.title : '继续检查物件' }}</strong>
        <p v-if="record.foundClueIds.includes(clue.id)">{{ clue.description }}</p>
      </article>
    </div>

    <div class="classification" :class="{ disabled: !allFound }">
      <div class="classification-intro">
        <strong>为结论选择证据等级</strong>
        <p>不是所有合理解释都能写成确定事实。</p>
      </div>

      <article v-for="conclusion in item.conclusions" :key="conclusion.id" class="conclusion-card">
        <p>{{ conclusion.text }}</p>
        <div class="level-buttons">
          <button
            v-for="level in levels"
            :key="level.value"
            type="button"
            :disabled="!allFound"
            :class="{ selected: record.classified[conclusion.id] === level.value }"
            @click="archive.classify(item.key, conclusion.id, level.value)"
          >
            {{ level.label }}
          </button>
        </div>
        <small v-if="record.classified[conclusion.id] && record.classified[conclusion.id] !== conclusion.expectedLevel" class="feedback warning">
          当前证据还不足以支持这个等级，再看看痕迹。
        </small>
        <small v-if="record.classified[conclusion.id] === conclusion.expectedLevel" class="feedback success">
          {{ conclusion.explanation }}
        </small>
      </article>

      <button class="primary-button full" type="button" :disabled="!allClassified || correctCount !== item.conclusions.length" @click="submit">
        建立物件档案
      </button>
    </div>
  </aside>
</template>
