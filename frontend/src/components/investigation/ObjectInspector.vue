<script setup lang="ts">
import ObservationControls from './ObservationControls.vue'
import { inspectionRecord } from './inspectionRecord'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { ArchiveObject } from '../../types/archive'
import { useArchiveStore } from '../../stores/archive'
import ListArtifact from './ListArtifact.vue'
import listDesk from '../../../../stuffs/名单/美术母版/list_desk_bg.png'

type ObservationTool = 'none' | 'side' | 'backlight' | 'zoom' | 'wipe'
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
const artifactSide = ref<'front' | 'back'>('front')
const markerMessage = ref(props.item.key === 'list' ? '先把散落的三片纸接回一页，看看这份记录究竟写到了哪里。' : '先选择观察工具，再在物件上标记可疑区域。')
const listAssemblyCount = ref(0)
const listCardOpen = ref(false)
const listDialog = ref<HTMLElement | null>(null)
let listReturnFocus: HTMLElement | SVGElement | null = null
watch(listCardOpen, async (open) => {
  if (open) listReturnFocus = document.activeElement as HTMLElement | SVGElement | null
  await nextTick()
  if (open) listDialog.value?.querySelector<HTMLButtonElement>('button')?.focus()
  else if (listReturnFocus?.isConnected) listReturnFocus.focus()
})
const onListDialogKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') { event.preventDefault(); listCardOpen.value = false }
  if (event.key !== 'Tab') return
  const buttons = listDialog.value?.querySelectorAll<HTMLButtonElement>('button')
  if (!buttons?.length) return
  const target = event.shiftKey ? buttons[buttons.length - 1] : buttons[0]
  if (document.activeElement === (event.shiftKey ? buttons[0] : buttons[buttons.length - 1])) {
    event.preventDefault(); target?.focus()
  }
}
const panel = ref<HTMLElement | null>(null)
const logs = ref<WorkLog[]>([])
const rejectedCandidateIds = ref<string[]>([])
let logId = 0
let scanTimer: ReturnType<typeof setTimeout> | undefined

const record = computed(() => inspectionRecord(props.item, archive.getRecord(props.item.key)))
const listAssembled = computed(() => record.value.status === 'archived' || record.value.evidenceVerified || record.value.completedInteractions.includes('list-pieces-assembled'))
const listMudWiped = computed(() => record.value.status === 'archived' || record.value.evidenceVerified || record.value.completedInteractions.includes('list-mud-cleared'))
const allCluesFound = computed(() => record.value.foundClueIds.length === props.item.clues.length
  && (props.item.key !== 'list' || (listAssembled.value && listMudWiped.value)))
const activeClue = computed(() => props.item.clues.find((clue) => clue.id === activeClueId.value))
const artifactLines = computed(() => {
  if (artifactSide.value === 'front') return props.item.artifactFront
  return props.item.artifactBack
})
const toolOrder: ObservationTool[] = ['side', 'backlight', 'zoom']
const toolLabels: Record<ObservationTool, string> = { none: '未选择', side: '侧光', backlight: '透光', zoom: '放大镜', wipe: '轻拭' }
const listClueTools: Record<string, ObservationTool> = { 'list-task': 'zoom', 'list-key': 'backlight', 'list-stub': 'side' }
const clueTool = (clueId: string) => listClueTools[clueId] ?? toolOrder[props.item.clues.findIndex((clue) => clue.id === clueId) % toolOrder.length]
const listClueCards: Record<string, { number: string; heading: string; scene: string; turn: string; boundary: string }> = {
  'list-task': {
    number: '01', heading: '第三行写的是人',
    scene: '器材、物料都列在前面。第三行却是「后随二人」。',
    turn: '纸角缺失，你第一次发现：这份交接还牵着两个人。',
    boundary: '这张虚构名单没有留下他们的姓名。',
  },
  'list-key': {
    number: '02', heading: '这一笔还没有落下',
    scene: '背面的图例说：点框已接收，开口框待交接。',
    turn: '前两项有点；写到两个人，方框却没有合上。',
    boundary: '此页未记下接收，不等于他们最终没有抵达。',
  },
  'list-stub': {
    number: '03', heading: '下一页不在这里',
    scene: '纸边被裁开，旁边写着「回执另存」。',
    turn: '这页纸把后续记录指向了别处，却没有交出那份回执。',
    boundary: '回执内容和两人的后来，仍是故事里的留白。',
  },
}
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
  props.item.key !== 'list'
  &&
  candidate.tool === activeTool.value
  && !record.value.foundClueIds.includes(candidate.clueId)
  && props.item.clues.find((clue) => clue.id === candidate.clueId)?.side === artifactSide.value
)))
const nextClue = computed(() => props.item.clues.find((clue) => !record.value.foundClueIds.includes(clue.id)))
const currentTask = computed(() => {
  if (props.item.key === 'list' && !listAssembled.value) return '拖动三片纸，让断开的笔画和纸边重新相接。'
  if (props.item.key === 'list' && !listMudWiped.value) return '第二行还有一个字被泥遮住。拭去泥点，再看看物品与人被怎样写在同一页。'
  if (props.item.key === 'list' && allCluesFound.value) return '这张纸的三段记录已经读到。可在右侧“整理展签”中连成一段故事，留下该留白的地方。'
  if (props.item.key === 'list' && nextClue.value?.id === 'list-task') return '正面第三行写着「后随二人」。直接点击这一行，读第一段故事。'
  if (props.item.key === 'list' && nextClue.value?.id === 'list-key') return '翻到背面，点击两种方框的说明，看看第三行为什么没有合上。'
  if (props.item.key === 'list' && nextClue.value?.id === 'list-stub') return '仍在背面。点击「回执另存」和下方裁口，看看故事停在了哪里。'
  if (allCluesFound.value) return '痕迹登记完毕，前往右侧证据板进行判断。'
  if (nextClue.value && nextClue.value.side !== artifactSide.value) return `当前这一面尚无下一处待查痕迹，试着翻到${nextClue.value.side === 'front' ? '正面' : '背面'}。`
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
    : activeTool.value === 'wipe'
      ? '轻拭已就位：按住鼠标在正面泥点上拖动。'
      : props.item.key === 'list'
        ? `${toolLabels[activeTool.value]}已就位；它帮助你看纸，不决定故事能否继续。`
        : `${toolLabels[activeTool.value]}已就位，移动视线寻找异常纹理。`
  addLog(activeTool.value === 'none' ? '收起观察工具' : `启用${toolLabels[activeTool.value]}`)
}

const showSide = (side: 'front' | 'back') => {
  if (props.item.key === 'list' && side === 'back' && !listAssembled.value) {
    markerMessage.value = '先把三片纸拼回同一张，才能安全地翻看背面。'
    return
  }
  artifactSide.value = side
  if (side === 'back' && activeTool.value === 'wipe') activeTool.value = 'none'
  markerMode.value = false
  activeClueId.value = null
  markerMessage.value = props.item.key === 'list'
    ? `已翻到${side === 'front' ? '正面' : '背面'}。沿着纸上的文字继续读，不需要额外标记。`
    : `已翻到${side === 'front' ? '正面' : '背面'}，观察物件后再自行标记。`
  addLog(`翻到${side === 'front' ? '正面' : '背面'}`)
}

const startMarking = () => {
  if (props.item.key === 'list' && (!listAssembled.value || !listMudWiped.value)) {
    markerMessage.value = !listAssembled.value ? '先拼合纸片，再观察并登记线索。' : '先轻拭泥点，辨清可恢复的字与真正缺失的纸。'
    return
  }
  if (activeTool.value === 'none' || activeTool.value === 'wipe') {
    markerMessage.value = '需要先选择侧光、透光或放大镜。'
    addLog('尝试标记，但尚未选择观察工具')
    return
  }
  markerMode.value = !markerMode.value
  markerMessage.value = markerMode.value ? '标记模式已开启：点击物件上的可疑位置。' : '已退出标记模式。'
}

const markStage = (event: MouseEvent) => {
  if (props.item.key === 'list') return
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
    markerMessage.value = '这处只是材质干扰，已排除。还有其他疑似区域。'
    addLog(`排除一处${toolLabels[activeTool.value]}下的干扰痕迹`)
    markerMode.value = false
    return
  }

  const clue = props.item.clues.find((entry) => entry.id === match.candidate.clueId)
  if (!clue) return
  archive.findClue(props.item.key, clue.id, { x, y })
  activeClueId.value = clue.id
  markerMode.value = false
  markerMessage.value = `已登记“${clue.title}”，线索卡已送入右侧工作板。`
  addLog(`登记痕迹：${clue.title}`, true)
  if (record.value.foundClueIds.length === props.item.clues.length) emit('complete')
}

const runScan = () => {
  scanning.value = false
  window.clearTimeout(scanTimer)
  requestAnimationFrame(() => {
    scanning.value = true
    const clue = nextClue.value
    if (props.item.key === 'list' && !listAssembled.value) {
      markerMessage.value = '先沿虚线轮廓拖动碎片；三片靠近原位会吸附。'
      addLog('检查拼合顺序')
    } else if (props.item.key === 'list' && !listMudWiped.value) {
      markerMessage.value = '第二行的泥点可以清除；姓名处则是缺纸，不能擦出字。'
      addLog('建议先轻拭泥点')
    } else if (clue) {
      markerMessage.value = `扫描建议：翻到${clue.side === 'front' ? '正面' : '背面'}，使用${toolLabels[clueTool(clue.id)]}观察。`
      addLog(`扫描建议使用${toolLabels[clueTool(clue.id)]}`)
    }
    scanTimer = window.setTimeout(() => { scanning.value = false }, 1700)
  })
}

const reviewClue = async (clueId: string) => {
  activeClueId.value = clueId
  artifactSide.value = props.item.clues.find((clue) => clue.id === clueId)?.side ?? 'front'
  activeTool.value = clueTool(clueId)
  markerMode.value = false
  markerMessage.value = props.item.key === 'list' ? '正在重读这页纸的一幕。' : '正在回看已经登记的痕迹位置。'
  if (props.item.key === 'list') {
    listCardOpen.value = true
    await nextTick()
    panel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const resetTools = () => {
  activeTool.value = 'none'
  markerMode.value = false
  scanning.value = false
  activeClueId.value = null
  markerMessage.value = props.item.key === 'list' ? '观察工具已收起，读过的故事仍留在手账里。' : '检查工具已经复位，已登记线索不会被清除。'
  addLog('复位检查工具')
}

const finishListWipe = () => {
  if (props.item.key !== 'list') return
  archive.completeInteraction('list', 'list-mud-cleared')
  activeTool.value = 'none'
  markerMessage.value = '「备用物料」读全了。前两行是物，第三行却是人；点击第三行，听这张纸开始讲述。'
  addLog('轻拭泥点，露出完整字形', true)
}

const finishListAssembly = () => {
  if (props.item.key !== 'list') return
  archive.completeInteraction('list', 'list-pieces-assembled')
  listAssemblyCount.value = 3
  markerMessage.value = '三片纸接成一页。先轻拭第二行的泥字，再从上到下读它。'
  addLog('三片残纸对齐，名单恢复为一页', true)
}

const inspectListZone = (clueId: string) => {
  if (props.item.key !== 'list') return
  if (nextClue.value?.id !== clueId) return
  archive.findClue('list', clueId)
  activeClueId.value = clueId
  listCardOpen.value = true
  markerMessage.value = '这一页又说出了一段。读完故事卡，再沿纸面继续。'
  addLog(`读到故事片段：${listClueCards[clueId]?.heading ?? clueId}`, true)
  if (allCluesFound.value) emit('complete')
}

defineExpose({ reviewClue })
onBeforeUnmount(() => window.clearTimeout(scanTimer))
</script>

<template>
  <section ref="panel" class="inspector-panel panel">


    <ObservationControls help="先接好三片纸，再轻拭泥点；正面读第三行，背面核对方框与回执裁口。" @reset="resetTools(); artifactSide = 'front'" :ready="listAssembled">
<template #view><button type="button" :class="{ active: artifactSide === 'front' }" @click="showSide('front')">看正面</button>
<button type="button" :class="{ active: artifactSide === 'back' }" :disabled="item.key === 'list' && !listAssembled" @click="showSide('back')">翻到背面</button></template>
<template #observe><button type="button" :class="{ active: activeTool === 'side' }" :disabled="item.key === 'list' && !listAssembled" @click="selectTool('side')">侧光</button>
<button type="button" :class="{ active: activeTool === 'backlight' }" :disabled="item.key === 'list' && !listAssembled" @click="selectTool('backlight')">透光</button>
<button type="button" :class="{ active: activeTool === 'zoom' }" :disabled="item.key === 'list' && !listAssembled" @click="selectTool('zoom')">放大镜</button></template>
<button v-if="item.key === 'list'" type="button" :class="{ active: activeTool === 'wipe' }" :disabled="!listAssembled || artifactSide !== 'front' || listMudWiped" @click="selectTool('wipe')">{{ listMudWiped ? '泥点已清' : '轻拭泥点' }}</button>
<button v-if="item.key !== 'list'" type="button" class="mark-button" :class="{ active: markerMode }" :disabled="allCluesFound" @click="startMarking">{{ markerMode ? '取消标记' : '添加标记' }}</button>
<button v-if="item.key !== 'list'" type="button" :class="{ active: scanning }" :disabled="allCluesFound" @click="runScan">申请提示</button>
</ObservationControls>
    <div
      :class="['inspection-stage', 'inspection-artifact-stage', `tool-${activeTool}`, { scanning, marking: markerMode, 'list-inspection-stage': item.key === 'list' }]"
      :style="{ '--object-accent': item.accent, '--list-desk-url': `url(${listDesk})` }"
      @click="markStage"
    >
      <div v-if="item.key !== 'list'" class="stage-grid" aria-hidden="true"></div>
      <div class="scan-beam" aria-hidden="true"></div>
      <span v-if="item.key === 'list'" class="list-prop-note">原创叙事道具 · 非馆藏原件</span>
      <ListArtifact
        v-if="item.key === 'list'"
        :side="artifactSide"
        :tool="activeTool"
        :wiped="listMudWiped"
        :assembled="listAssembled"
        :next-clue-id="nextClue?.id ?? null"
        :found-clue-ids="record.foundClueIds"
        @progress="listAssemblyCount = $event"
        @assembled="finishListAssembly"
        @wiped="finishListWipe"
        @clue="inspectListZone"
        @review="reviewClue"
      />
      <span v-if="item.key === 'list' && !listAssembled" class="list-assembly-status">拼合纸片 {{ listAssemblyCount }} / 3 · 拖近虚线轮廓自动吸附</span>
      <div v-if="item.key !== 'list'" class="placeholder-object">
        <span>{{ item.silhouette }}</span>
        <small>数字复原示意 · 使用观察工具寻找异常痕迹</small>
      </div>
      <div v-if="item.key !== 'list'" class="story-artifact" aria-label="虚构物件文字复原示意">
        <span>{{ artifactSide === 'front' ? 'FRONT / 正面' : 'REVERSE / 背面' }}</span>
        <p v-for="(line, index) in artifactLines" :key="index">{{ line }}</p>
      </div>

      <span
        v-for="candidate in visibleCandidates"
        :key="candidate.id"
        :class="['trace-hint', { rejected: rejectedCandidateIds.includes(candidate.id) }]"
        :style="{ left: `${candidate.position.x}%`, top: `${candidate.position.y}%` }"
        aria-hidden="true"
      >{{ rejectedCandidateIds.includes(candidate.id) ? '×' : '' }}</span>

      <button
        v-if="item.key !== 'list'"
        v-for="clueId in record.foundClueIds.filter((id) => item.clues.find((clue) => clue.id === id)?.side === artifactSide)"
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
        <aside v-if="item.key !== 'list' && activeClue && record.foundClueIds.includes(activeClue.id)" class="inspection-note">
          <button type="button" aria-label="关闭痕迹说明" @click="activeClueId = null">×</button>
          <span>TRACE / RECORDED</span>
          <strong>{{ activeClue.title }}</strong>
          <p>{{ activeClue.description }}</p>
        </aside>
      </Transition>



      <div v-if="markerMode" class="marking-cursor-label">点击落下标记</div>
      <div class="inspection-caption">
        <span>{{ markerMessage }}</span>
        <strong>{{ item.key === 'list' ? (!listAssembled ? `${listAssemblyCount} / 3 片纸` : `${record.foundClueIds.length} / ${item.clues.length} 幕故事`) : `${record.foundClueIds.length} / ${item.clues.length} 条线索` }}</strong>
      </div>
    </div>



      <div v-if="item.key === 'list' && listCardOpen && activeClue && listClueCards[activeClue.id]" class="list-clue-card-overlay" @click.self="listCardOpen = false">
        <article ref="listDialog" class="list-clue-card" role="dialog" aria-modal="true" :aria-label="`${listClueCards[activeClue.id].heading}故事卡`" @keydown="onListDialogKey">
          <div class="list-clue-card-heading"><span>名单故事 / 第 {{ listClueCards[activeClue.id].number }} 幕</span><button type="button" aria-label="关闭故事卡" @click="listCardOpen = false">×</button></div>
          <h3>{{ listClueCards[activeClue.id].heading }}</h3>
          <p class="list-card-scene">{{ listClueCards[activeClue.id].scene }}</p>
          <div class="list-card-turn"><span>这一幕改变了什么</span><p>{{ listClueCards[activeClue.id].turn }}</p></div>
          <p class="list-card-boundary"><span>纸没有说的事</span>{{ listClueCards[activeClue.id].boundary }}</p>
          <button class="list-clue-card-close" type="button" @click="listCardOpen = false">继续读这张纸 →</button>
        </article>
      </div>
    <section class="field-record-strip">
      <div class="current-task-card">
        <span>当前任务 / TASK</span>
        <strong>{{ item.key === 'list' ? (allCluesFound ? '读完整张纸' : '沿着记录读下去') : (allCluesFound ? '转入证据判断' : '自行寻找并标记痕迹') }}</strong>
        <p>{{ currentTask }}</p>
      </div>
      <div class="work-log">
        <span>现场记录 / LOG</span>
        <ul v-if="logs.length">
          <li v-for="log in logs" :key="log.id" :class="{ success: log.success }"><time>{{ log.time }}</time>{{ log.text }}</li>
        </ul>
        <p v-else>{{ item.key === 'list' ? '三片残纸正在桌上，故事从接回这一页开始。' : '尚无操作记录。选择观察工具开始检查。' }}</p>
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
          <i v-for="slot in item.clues.length - record.foundClueIds.length" :key="`empty-${slot}`" class="empty-film">{{ item.key === 'list' ? '尚未读到' : '未曝光' }}</i>
        </div>
      </div>
    </section>
  </section>
</template>
