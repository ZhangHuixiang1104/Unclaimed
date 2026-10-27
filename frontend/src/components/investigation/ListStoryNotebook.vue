<script setup lang="ts">
import InvestigationRail from './InvestigationRail.vue'
import { computed } from 'vue'
import { useArchiveStore } from '../../stores/archive'

const emit = defineEmits<{ review: [clueId: string] }>()
const archive = useArchiveStore()
const record = computed(() => archive.getRecord('list'))
const chapters = [
  { id: 'list-task', label: '第一幕', title: '物品之后，是人', preview: '正面第三行仍未读到' },
  { id: 'list-key', label: '第二幕', title: '停住的一笔', preview: '背面图例仍未读到' },
  { id: 'list-stub', label: '第三幕', title: '不在场的回执', preview: '背面纸边仍未读到' },
]
const complete = computed(() => chapters.every((chapter) => record.value.foundClueIds.includes(chapter.id)))
</script>

<template>
  <InvestigationRail class="list-story-notebook" :found="record.foundClueIds.length" :total="chapters.length" :ready="complete">
    <template #notes>
    <div class="notebook-chapters">
      <template v-for="chapter in chapters" :key="chapter.id">
        <button v-if="record.foundClueIds.includes(chapter.id)" type="button" class="notebook-chapter found" @click="emit('review', chapter.id)">
          <small>{{ chapter.label }} / 已读</small>
          <strong>{{ chapter.title }}</strong>
          <em>重读故事卡 ↗</em>
        </button>
        <div v-else class="notebook-chapter waiting">
          <small>{{ chapter.label }} / 尚未翻到</small>
          <strong>{{ chapter.preview }}</strong>
        </div>
      </template>
    </div>
    </template>
    <template #caption><slot /></template>
  </InvestigationRail>
</template>

<style scoped>
.list-story-notebook { border: 1px solid rgba(198,178,143,.3); color: #eee7d7; background: linear-gradient(160deg,#20251e,#171b17); }
.list-story-notebook header { padding: 25px 24px 20px; border-bottom: 1px solid rgba(198,178,143,.2); }
.list-story-notebook header span { color: #d29683; font-size: 10px; font-weight: 700; letter-spacing: .1em; }
.list-story-notebook h2 { margin: 9px 0 8px; font-size: 23px; }
.list-story-notebook header p { margin: 0; color: #c9cbbf; font-size: 13px; line-height: 1.7; }
.notebook-chapters { display: grid; gap: 10px; padding: 20px; }
.notebook-chapter { display: block; width: 100%; min-height: 86px; padding: 15px 18px; text-align: left; border: 1px solid rgba(198,178,143,.22); background: rgba(238,223,193,.04); }
.notebook-chapter small { display: block; color: #d3917d; font-size: 11px; }
.notebook-chapter strong { display: block; margin-top: 8px; color: #efe7d7; font-size: 16px; line-height: 1.4; }
.notebook-chapter em { display: block; margin-top: 9px; color: #e4b29e; font-size: 11px; font-style: normal; }
.notebook-chapter.found { cursor: pointer; transition: transform .2s ease, border-color .2s ease; }
.notebook-chapter.found:hover { transform: translateX(-4px); border-color: #b87861; }
.notebook-chapter.waiting strong { font-size: 14px; font-weight: 400; }
.notebook-footer { padding: 18px 20px 22px; border-top: 1px solid rgba(198,178,143,.2); }
.notebook-footer span { color: #d8c6ac; font-size: 11px; }
.notebook-footer p { margin: 9px 0 0; color: #aeb1a8; font-size: 12px; line-height: 1.5; }
.notebook-footer button { display: block; width: 100%; min-height: 42px; margin-top: 13px; border: 1px solid #a76453; color: #f4e9d8; background: #743c32; font-size: 13px; font-weight: 700; cursor: pointer; }
.notebook-footer button:hover { background: #8d4a3f; }
.list-story-notebook header span,.notebook-chapter small,.notebook-footer span { font-size: 12px; }
.list-story-notebook header { padding: 16px 20px 12px; }
.list-story-notebook h2 { margin: 5px 0 5px; font: 700 24px/1.3 var(--font-display); }
.list-story-notebook header p,.notebook-footer p { font-size: 14px; }
.notebook-chapters { gap: 0; padding: 4px 20px; }
.notebook-chapter { min-height: 62px; padding: 8px 4px; border: 0; border-bottom: 1px solid rgba(198,178,143,.22); background: transparent; }
.notebook-chapter strong { font: 650 15px/1.45 var(--font-sans); }
.notebook-chapter.waiting strong { font-size: 14px; }
.notebook-chapter em { margin-top: 4px; font-size: 12px; }
.notebook-chapter.found:hover { padding-left: 10px; border-bottom-color: #b87861; transform: none; }
.notebook-footer { padding: 12px 20px 16px; }
.notebook-footer button { margin-top: 8px; font-size: 14px; }
</style>
