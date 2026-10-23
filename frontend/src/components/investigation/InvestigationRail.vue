<script setup lang="ts">
import { inject, nextTick, ref, useId } from 'vue'
import { railTabKey, type RailTab } from './railTab'

defineProps<{ found: number; total: number; ready: boolean }>()
const activeTab = inject(railTabKey, ref<RailTab>('notes'))
const id = useId()
const choose = (tab: RailTab) => { activeTab.value = tab }
const navigateTabs = async (event: KeyboardEvent) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  choose(event.key === 'Home' ? 'notes' : event.key === 'End' ? 'caption' : activeTab.value === 'notes' ? 'caption' : 'notes')
  const tablist = event.currentTarget as HTMLElement
  await nextTick()
  tablist.querySelector<HTMLButtonElement>(`[aria-selected="true"]`)?.focus()
}
</script>

<template>
  <aside class="inspection-rail inspection-notebook">
    <div class="rail-tabs" role="tablist" aria-label="调查记录" @keydown="navigateTabs">
      <button :id="`${id}-notes-tab`" type="button" role="tab" :aria-selected="activeTab === 'notes'" :aria-controls="`${id}-notes`" :tabindex="activeTab === 'notes' ? 0 : -1" @click="choose('notes')">线索手账 <small>{{ found }}/{{ total }}</small></button>
      <button :id="`${id}-caption-tab`" type="button" role="tab" :aria-selected="activeTab === 'caption'" :aria-controls="`${id}-caption`" :tabindex="activeTab === 'caption' ? 0 : -1" @click="choose('caption')">整理展签 <i v-if="ready" aria-label="可整理"></i></button>
    </div>
    <div v-show="activeTab === 'notes'" :id="`${id}-notes`" class="rail-pane" role="tabpanel" :aria-labelledby="`${id}-notes-tab`" tabindex="0">
      <p class="rail-intro">从物件上发现线索，点开记录可再次阅读。</p>
      <slot name="notes" />
      <button v-if="ready" class="rail-next" type="button" @click="choose('caption')">线索已读齐，整理展签 →</button>
    </div>
    <div v-show="activeTab === 'caption'" :id="`${id}-caption`" class="rail-pane" role="tabpanel" :aria-labelledby="`${id}-caption-tab`" tabindex="0">
      <slot v-if="ready" name="caption" />
      <div v-else class="rail-empty"><span>{{ found }} / {{ total }}</span><h2>先听物件把故事说完</h2><p>收齐线索后，再写下有依据的展签。</p><button type="button" @click="choose('notes')">返回线索手账</button></div>
    </div>
  </aside>
</template>
