<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
withDefaults(defineProps<{ help: string; ready?: boolean }>(), { ready: true })
const emit = defineEmits<{ reset: [] }>()
const host = ref<HTMLElement | null>(null)
const enlarged = ref(false)
const helpOpen = ref(false)
const workspace = () => host.value?.closest('.inspection-workspace')
const setEnlarged = (value: boolean) => {
  enlarged.value = value
  workspace()?.classList.toggle('inspection-enlarged', value)
  document.body.classList.toggle('inspection-overlay-open', value)
}
const closeMenus = () => host.value?.querySelectorAll('details[open]').forEach((menu) => menu.removeAttribute('open'))
const chooseTool = (event: MouseEvent) => {
  if (!(event.target as HTMLElement).closest('button')) return
  const menu = (event.currentTarget as HTMLElement).closest('details')
  menu?.removeAttribute('open')
  menu?.querySelector<HTMLElement>('summary')?.focus()
}
const onOutside = (event: MouseEvent) => { if (!host.value?.contains(event.target as Node)) { closeMenus(); helpOpen.value = false } }
const reset = () => { setEnlarged(false); closeMenus(); helpOpen.value = false; emit('reset') }
const onKey = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  const dialog = workspace()?.querySelector<HTMLElement>('[role="dialog"]')
  if (dialog) { dialog.querySelector<HTMLButtonElement>('button')?.click(); return }
  setEnlarged(false)
  closeMenus()
  helpOpen.value = false
}
onMounted(() => { window.addEventListener('keydown', onKey); document.addEventListener('click', onOutside) })
onUnmounted(() => { window.removeEventListener('keydown', onKey); document.removeEventListener('click', onOutside); document.body.classList.remove('inspection-overlay-open') })
</script>
<template>
  <div ref="host" class="observation-controls">
    <div class="observation-specific-tools" aria-label="物品操作">
      <div class="observation-views" aria-label="观察视角"><slot name="view" /></div>
      <details v-if="ready" class="observation-menu"><summary>观察方式 ▾</summary><div @click="chooseTool"><slot name="observe" /></div></details>
      <div class="observation-current-action"><slot /></div>
    </div>
    <div class="observation-common-tools" aria-label="辅助观察工具">
      <button class="observation-enlarge" type="button" :aria-pressed="enlarged" @click="setEnlarged(!enlarged)">{{ enlarged ? '收起 ×' : '放大' }}</button>
      <button type="button" @click="reset">复位</button>
      <button type="button" :aria-expanded="helpOpen" @click="helpOpen = !helpOpen">提示</button>
    </div>
    <p v-if="helpOpen" class="observation-help" role="status">{{ help }}</p>
    <div v-if="enlarged" class="observation-backdrop" @click="setEnlarged(false)"></div>
  </div>
</template>
