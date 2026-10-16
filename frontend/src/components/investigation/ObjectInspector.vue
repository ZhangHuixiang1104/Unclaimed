<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { ArchiveObject } from '../../types/archive'
import { useArchiveStore } from '../../stores/archive'

type ObservationTool = 'none' | 'side' | 'backlight' | 'zoom'
type WorkLog = { id: number; time: string; text: string; success?: boolean }
type ObservationCandidate = {
  id: string
  clueId: string
  tool: ObservationTool
  position: { x: number; y: number }
  valid: boolean
}

const props = defineProps<{ item: ArchiveObject }>()
const emit = defineEmits<{ complete: [] }>()
const archive = useArchiveStore()
const activeTool = ref<ObservationTool>('none')
const markerMode = ref(false)
const scanning = ref(false)
const activeClueId = ref<string | null>(null)
const markerMessage = ref('先选择观察工具，再在物件上标记可疑区域。')
const logs = ref<WorkLog[]>([])
const rejectedCandidateIds = ref<string[]>([])
let logId = 0
let scanTimer: ReturnType<typeof setTimeout> | undefined

const record = computed(() => archive.getRecord(props.item.key))
const allCluesFound = computed(() => record.value.foundClueIds.length === props.item.clues.length)
const activeClue = computed(() => props.item.clues.find((clue) => clue.id === activeClueId.value))
const toolOrder: ObservationTool[] = ['side', 'backlight', 'zoom']
const toolLabels: Record<ObservationTool, string> = { none: '未选择', side: '侧光', backlight: '透光', zoom: '放大镜' }
const clueTool = (clueId: string) => toolOrder[props.item.clues.findIndex((clue) => clue.id === clueId) % toolOrder.length]
const clampPosition = (value: number) => Math.min(88, Math.max(12, value))
const observationCandidates = computed<ObservationCandidate[]>(() => props.item.clues.flatMap((clue, index) => {
  const offsets = index % 2 === 0
    ? [{ x: 18, y: 12 }, { x: -15, y: 20 }]
    : [{ x: -18, y: -13 }, { x: 17, y: 18 }]
  return [
    { id: `${clue.id}-valid`, clueId: clue.id, tool: clueTool(clue.id), position: clue.position, valid: true },
    ...offsets.map((offset, decoyIndex) => ({
      id: `${clue.id}-decoy-${decoyIndex}`,
      clueId: clue.id,
      tool: clueTool(clue.id),
      position: { x: clampPosition(clue.position.x + offset.x), y: clampPosition(clue.position.y + offset.y) },
      valid: false,
    })),
  ]
}))
const visibleCandidates = computed(() => observationCandidates.value.filter((candidate) => (
  candidate.tool === activeTool.value
  && !record.value.foundClueIds.includes(candidate.clueId)
)))
const nextClue = computed(() => props.item.clues.find((clue) => !record.value.foundClueIds.includes(clue.id)))
const currentTask = computed(() => {
  if (allCluesFound.value) return '痕迹登记完毕，前往右侧证据板进行判断。'
  if (activeTool.value === 'none') return '选择一种观察工具，寻找物件表面的异常。'
  if (!markerMode.value) return `${toolLabels[activeTool.value]}已启用。观察光影变化，确认后选择“添加标记”。`
  return '标记模式已开启。点击你认为存在痕迹的位置。'
})

const addLog = (text: string, success = false) => {
  logs.value.unshift({
    id: ++logId,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    text,
    success,
  })
  logs.value = logs.value.slice(0, 3)
}

const selectTool = (tool: ObservationTool) => {
  activeTool.value = activeTool.value === tool ? 'none' : tool
  markerMode.value = false
  markerMessage.value = activeTool.value === 'none'
    ? '观察工具已收起。'
    : `${toolLabels[activeTool.value]}已就位，移动视线寻找异常纹理。`
  addLog(activeTool.value === 'none' ? '收起观察工具' : `启用${toolLabels[activeTool.value]}`)
}

const startMarking = () => {
  if (activeTool.value === 'none') {
    markerMessage.value = '需要先选择侧光、透光或放大镜。'
    addLog('尝试标记，但尚未选择观察工具')
    return
  }
  markerMode.value = !markerMode.value
  markerMessage.value = markerMode.value ? '标记模式已开启：点击物件上的可疑位置。' : '已退出标记模式。'
}

const markStage = (event: MouseEvent) => {
  if (!markerMode.value) return
  const target = event.target as HTMLElement
  if (target.closest('button, .inspection-note')) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  const candidates = visibleCandidates.value
    .map((candidate) => ({ candidate, distance: Math.hypot(candidate.position.x - x, candidate.position.y - y) }))
    .sort((a, b) => a.distance - b.distance)
  const match = candidates[0]

  if (!match || match.distance > 12) {
    markerMessage.value = '该位置暂未发现可登记痕迹，换个区域继续观察。'
    addLog(`在${toolLabels[activeTool.value]}下标记了一处无效区域`)
    return
  }

  if (!match.candidate.valid) {
    if (!rejectedCandidateIds.value.includes(match.candidate.id)) rejectedCandidateIds.value.push(match.candidate.id)
    markerMessage.value = '这处纹理属于纸面噪点，已排除。还有其他疑似区域。'
    addLog(`排除一处${toolLabels[activeTool.value]}下的干扰痕迹`)
    markerMode.value = false
    return
  }

  const clue = props.item.clues.find((entry) => entry.id === match.candidate.clueId)
  if (!clue) return
  archive.findClue(props.item.key, clue.id, { x, y })
  activeClueId.value = clue.id
  markerMode.value = false
  markerMessage.value = `已登记“${clue.title}”，证物纸片已送入右侧工作板。`
  addLog(`登记痕迹：${clue.title}`, true)
  if (record.value.foundClueIds.length === props.item.clues.length) emit('complete')
}

const runScan = () => {
  scanning.value = false
  window.clearTimeout(scanTimer)
  requestAnimationFrame(() => {
    scanning.value = true
    const clue = nextClue.value
    if (clue) {
      markerMessage.value = `扫描建议：下一处异常更适合使用${toolLabels[clueTool(clue.id)]}观察。`
      addLog(`扫描建议使用${toolLabels[clueTool(clue.id)]}`)
    }
    scanTimer = window.setTimeout(() => { scanning.value = false }, 1700)
  })
}

const reviewClue = (clueId: string) => {
  activeClueId.value = clueId
  activeTool.value = clueTool(clueId)
  markerMode.value = false
  markerMessage.value = '正在回看已经登记的痕迹位置。'
}

const resetTools = () => {
  activeTool.value = 'none'
  markerMode.value = false
  scanning.value = false
  activeClueId.value = null
  markerMessage.value = '检查工具已经复位，已登记线索不会被清除。'
  addLog('复位检查工具')
}

defineExpose({ reviewClue })
onBeforeUnmount(() => window.clearTimeout(scanTimer))
</script>

<template>
  <section class="inspector-panel panel">
    <header class="panel-heading">
      <div>
        <span class="eyebrow">物件检查台</span>
        <h2>{{ item.name }}</h2>
      </div>
      <span class="archive-no">{{ item.archiveNo }}</span>
    </header>

    <div
      :class="['inspection-stage', `tool-${activeTool}`, { scanning, marking: markerMode }]"
      :style="{ '--object-accent': item.accent }"
      @click="markStage"
    >
      <div class="stage-grid" aria-hidden="true"></div>
      <div class="scan-beam" aria-hidden="true"></div>
      <div class="placeholder-object">
        <span>{{ item.silhouette }}</span>
        <small>数字复原示意 · 使用观察工具寻找异常痕迹</small>
      </div>

      <span
        v-for="candidate in visibleCandidates"
        :key="candidate.id"
        :class="['trace-hint', { rejected: rejectedCandidateIds.includes(candidate.id) }]"
        :style="{ left: `${candidate.position.x}%`, top: `${candidate.position.y}%` }"
        aria-hidden="true"
      >{{ rejectedCandidateIds.includes(candidate.id) ? '×' : '' }}</span>

      <button
        v-for="clueId in record.foundClueIds"
        :key="clueId"
        type="button"
        :class="['clue-hotspot', 'found', { focused: activeClueId === clueId }]"
        :style="{
          left: `${record.markerPositions[clueId]?.x ?? item.clues.find((clue) => clue.id === clueId)?.position.x}%`,
          top: `${record.markerPositions[clueId]?.y ?? item.clues.find((clue) => clue.id === clueId)?.position.y}%`,
        }"
        aria-label="回看已登记线索"
        @click.stop="reviewClue(clueId)"
      ></button>

      <Transition name="inspection-note">
        <aside v-if="activeClue && record.foundClueIds.includes(activeClue.id)" class="inspection-note">
          <button type="button" aria-label="关闭痕迹说明" @click="activeClueId = null">×</button>
          <span>TRACE / RECORDED</span>
          <strong>{{ activeClue.title }}</strong>
          <p>{{ activeClue.description }}</p>
        </aside>
      </Transition>

      <div v-if="markerMode" class="marking-cursor-label">点击落下标记</div>
      <div class="inspection-caption">
        <span>{{ markerMessage }}</span>
        <strong>{{ record.foundClueIds.length }} / {{ item.clues.length }} 条线索</strong>
      </div>
    </div>

    <div class="tool-row" aria-label="检查工具">
      <span class="tool-label">观察</span>
      <button type="button" :class="{ active: activeTool === 'side' }" @click="selectTool('side')">侧光</button>
      <button type="button" :class="{ active: activeTool === 'backlight' }" @click="selectTool('backlight')">透光</button>
      <button type="button" :class="{ active: activeTool === 'zoom' }" @click="selectTool('zoom')">放大镜</button>
      <span class="tool-divider"></span>
      <button type="button" class="mark-button" :class="{ active: markerMode }" :disabled="allCluesFound" @click="startMarking">{{ markerMode ? '取消标记' : '添加标记' }}</button>
      <button type="button" :class="{ active: scanning }" :disabled="allCluesFound" @click="runScan">申请提示</button>
      <button type="button" class="tool-reset" @click="resetTools">复位工具</button>
      <span class="tool-hint">当前：{{ toolLabels[activeTool] }}</span>
    </div>

    <section class="field-record-strip">
      <div class="current-task-card">
        <span>当前任务 / TASK</span>
        <strong>{{ allCluesFound ? '转入证据判断' : '自行寻找并标记痕迹' }}</strong>
        <p>{{ currentTask }}</p>
      </div>
      <div class="work-log">
        <span>现场记录 / LOG</span>
        <ul v-if="logs.length">
          <li v-for="log in logs" :key="log.id" :class="{ success: log.success }"><time>{{ log.time }}</time>{{ log.text }}</li>
        </ul>
        <p v-else>尚无操作记录。选择观察工具开始检查。</p>
      </div>
      <div class="contact-sheet">
        <span>采集影像 / FILM</span>
        <div>
          <button
            v-for="(clueId, index) in record.foundClueIds"
            :key="clueId"
            type="button"
            @click="reviewClue(clueId)"
          >
            <i>{{ item.silhouette }}</i><small>{{ String(index + 1).padStart(2, '0') }}</small>
          </button>
          <i v-for="slot in item.clues.length - record.foundClueIds.length" :key="`empty-${slot}`" class="empty-film">未曝光</i>
        </div>
      </div>
    </section>
  </section>
</template>
