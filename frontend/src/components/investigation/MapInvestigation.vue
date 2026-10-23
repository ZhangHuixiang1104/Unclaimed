<script setup lang="ts">
import InvestigationRail from './InvestigationRail.vue'
import ObservationControls from './ObservationControls.vue'
import { inspectionRecord } from './inspectionRecord'
import { computed, ref } from 'vue'
import { objectByKey } from '../../data/objects'
import { useArchiveStore } from '../../stores/archive'
import frontOne from '../../assets/objects/map-front-1.png'
import frontTwo from '../../assets/objects/map-front-2.png'
import frontThree from '../../assets/objects/map-front-3.png'
import frontFour from '../../assets/objects/map-front-4.png'
import backPaper from '../../assets/objects/map-back.png'
import rulerImage from '../../assets/objects/map-ruler.png'
const frontPhases = [frontOne, frontTwo, frontThree, frontFour]

const archive = useArchiveStore()
const item = objectByKey('map')!
const record = computed(() => inspectionRecord(item, archive.getRecord('map')))
const side = ref<'front' | 'back'>('front')
const unfolded = ref(record.value.completedInteractions.includes('map-unfolded'))
const sideLight = ref(false)
const phase = ref(4)
const rulerVisible = ref(false)
const rulerX = ref(540)
const rulerY = ref(390)
const activeClueId = ref<string | null>(null)
const selectedCaption = ref<number | null>(null)
const selectedClue = computed(() => item.clues.find((clue) => clue.id === activeClueId.value))
const allFound = computed(() => item.clues.every((clue) => record.value.foundClueIds.includes(clue.id)))
const backViewed = computed(() => record.value.completedInteractions.includes('map-back-viewed'))
const earlyClueCopy: Record<string, string> = {
  'map-near-route': '折角下面压着一笔较淡的近路。另一笔后来从它旁边绕开。先记下这处覆盖，再去找改线的原因。',
  'map-north-bank': '北滩附近有一条抵达岸边的线，却没有越河续线。背面的更新语也许能解释这次停笔。',
  'map-lower-bank': '下滩旁的笔迹断在水边。线尾没有写“已过”，也没有写后来发生了什么。',
  'map-crossing': '两层深浅不同的线在这里相压，其中一笔折向高处。先核对笔压，再看背面写了什么。',
}
const selectedStoryText = computed(() => selectedClue.value && (allFound.value
  ? selectedClue.value.description
  : earlyClueCopy[selectedClue.value.id]))
const spots = [
  { id: 'map-near-route', label: '观察折角下的旧墨线', path: 'M242 679 Q357 552 517 536 Q590 534 610 575 Q569 627 467 653 Q356 706 254 732 Z' },
  { id: 'map-north-bank', label: '观察北滩的线尾', path: 'M1009 220 Q1120 210 1180 254 L1191 377 Q1137 408 1037 384 Q995 313 1009 220 Z' },
  { id: 'map-lower-bank', label: '观察下滩的线尾', path: 'M969 552 Q1075 568 1189 585 L1202 726 Q1104 744 1015 692 Q965 637 969 552 Z' },
  { id: 'map-crossing', label: '观察墨线交叠的笔压', path: 'M553 328 Q681 310 811 350 Q831 416 788 482 Q666 513 566 449 Q542 389 553 328 Z' },
]
const captions = [
  '几次改线后，队伍已从下滩成功渡河。',
  '原来的线被擦淡，说明他们从未走过那里。',
  '条件不断变化，最后的记录让队伍先在高地等信；渡河结果未见。',
]
const captionFeedback = computed(() => selectedCaption.value === 0
  ? '下滩的线止于岸边；这页纸没有江北续线或抵达记录。'
  : selectedCaption.value === 1
    ? '擦淡证明图被修改，不能反推此前的实际脚步。'
    : selectedCaption.value === 2
      ? '末层压过旧线，背注写明暂不放行；江北栏仍空。'
      : '')
const unfold = () => { unfolded.value = true; archive.completeInteraction('map', 'map-unfolded') }
const inspect = (id: string) => {
  if (!unfolded.value) return
  archive.findClue('map', id)
  activeClueId.value = id
}
const save = () => {
  if (selectedCaption.value !== 2) return
  archive.completeInteraction('map', 'map-caption-supported')
  archive.completeMapNarrative()
}
const moveRuler = (event: PointerEvent) => {
  if (!(event.currentTarget instanceof SVGImageElement)) return
  const svg = event.currentTarget.ownerSVGElement
  const matrix = svg?.getScreenCTM()?.inverse()
  if (!svg || !matrix) return
  const point = svg.createSVGPoint()
  point.x = event.clientX; point.y = event.clientY
  const local = point.matrixTransform(matrix)
  rulerX.value = Math.max(90, Math.min(1100, local.x - 210))
  rulerY.value = Math.max(100, Math.min(795, local.y - 51))
}
const rulerDown = (event: PointerEvent) => (event.currentTarget as Element).setPointerCapture(event.pointerId)
const rulerDrag = (event: PointerEvent) => {
  if ((event.currentTarget as Element).hasPointerCapture(event.pointerId)) moveRuler(event)
}
defineExpose({ reviewClue: (id: string) => { if (record.value.foundClueIds.includes(id)) activeClueId.value = id } })
const resetObservation = () => { side.value = 'front'; sideLight.value = false; phase.value = 4; rulerVisible.value = false; rulerX.value = 540; rulerY.value = 390; activeClueId.value = null }
</script>

<template>
  <section class="map-investigation inspection-workspace" aria-label="虚构行路小图调查台">
    <div class="map-worktop">

      <ObservationControls help="先展开小图，查看正背两面；侧光和逐层透视帮助分辨笔迹，描图尺可以拖动。" @reset="resetObservation" :ready="unfolded">
<template #view><button type="button" :disabled="!unfolded" :aria-pressed="side === 'front'" @click="side = 'front'">看正面</button>
<button type="button" :disabled="!unfolded" :aria-pressed="side === 'back'" @click="side = 'back'; archive.completeInteraction('map', 'map-back-viewed')">翻背面</button></template>
<template #observe><button type="button" :disabled="!unfolded || side === 'back'" :aria-pressed="sideLight" @click="sideLight = !sideLight">移侧光</button>
<button type="button" :disabled="!unfolded || side === 'back'" @click="phase = phase === 4 ? 1 : phase + 1">{{ phase === 4 ? '逐层查看笔迹' : `笔迹第 ${phase} 层 / 继续` }}</button>
<button type="button" :disabled="!unfolded || side === 'back'" :aria-pressed="rulerVisible" @click="rulerVisible = !rulerVisible">{{ rulerVisible ? '收起描图尺' : '放上描图尺' }}</button></template>

</ObservationControls>
      <div class="map-paper-stage inspection-artifact-stage" :class="{ 'raking-light': sideLight }">
        <svg viewBox="0 0 1600 1000" role="group" :aria-label="side === 'front' ? '虚构无名河谷行路小图正面' : '虚构行路小图背面更新记录'">
          <image :href="side === 'front' ? frontPhases[phase - 1] : backPaper" width="1600" height="1000" />
          <g v-if="side === 'front'">
            <image v-if="rulerVisible" :href="rulerImage" :x="rulerX" :y="rulerY" width="420" height="102" class="map-ruler" @pointerdown="rulerDown" @pointermove="rulerDrag" />
            <g class="map-hotspots"><path v-for="spot in spots" :key="spot.id" :d="spot.path" tabindex="0" role="button" :aria-label="spot.label" @click="inspect(spot.id)" @keydown.enter.prevent="inspect(spot.id)" @keydown.space.prevent="inspect(spot.id)" /></g>
          </g>
          <g v-else class="map-hotspots"><rect v-for="(spot, index) in spots" :key="spot.id" x="205" :y="270 + index * 125" width="880" height="90" tabindex="0" role="button" :aria-label="`观察背面第${index + 1}行的笔迹`" @click="inspect(spot.id)" @keydown.enter.prevent="inspect(spot.id)" @keydown.space.prevent="inspect(spot.id)" /></g>
        </svg>
        <button v-if="!unfolded" class="map-unfold" type="button" @click="unfold"><span>档案纸仍折着</span><strong>展开行路小图 →</strong></button>
      </div>
      <p class="map-stage-caption">{{ !unfolded ? '先展开小图，再查看纸面的笔迹。' : allFound ? '线索已读齐，可在右侧整理展签。' : side === 'back' ? '逐行阅读背面的更新语。' : '查看改线与笔迹，翻到背面核对。' }}</p>
    </div>
    <InvestigationRail class="map-journal" :found="record.foundClueIds.length" :total="item.clues.length" :ready="allFound">
<template #notes><div class="map-journal-list"><button v-for="(clue, index) in item.clues" :key="clue.id" type="button" :disabled="!record.foundClueIds.includes(clue.id)" @click="activeClueId = clue.id"><small>{{ record.foundClueIds.includes(clue.id) ? `片段 ${index + 1} · 已读` : '仍藏在纸上' }}</small><strong>{{ record.foundClueIds.includes(clue.id) ? clue.title : '等你从笔迹中发现' }}</strong></button></div>
</template>
<template #caption><section class="map-synthesis inspection-synthesis"><span>暂作展签 / 仅对这张虚构纸件负责</span><h2>{{ allFound ? '线停下了，判断没有停止。' : '故事还未读完' }}</h2><p>{{ allFound ? '被擦淡的线，是曾经的打算；停在岸前的线，是纸上最后能负责的决定。选择一条有证据支撑的展签，随时可以改选。' : '正面找笔迹，背面读消息。四段故事都被看见后，才能写下这张图的暂时结论。' }}</p><div v-if="allFound" class="map-caption-options"><button v-for="(caption, index) in captions" :key="caption" type="button" :aria-pressed="selectedCaption === index" @click="selectedCaption = index">{{ caption }}</button></div><p v-if="selectedCaption !== null" class="map-caption-feedback">{{ captionFeedback }}</p><p v-if="allFound && selectedCaption === 2 && !backViewed" class="map-caption-feedback">还需翻到背面，亲自核对“暂不放行”的更新语。</p><button v-if="allFound && backViewed && selectedCaption === 2 && !record.evidenceVerified" class="map-save-button" type="button" @click="save">保存这张图的故事 →</button><strong v-if="record.evidenceVerified" class="map-saved">虚构故事已保存 · 史实档案现可独立翻阅</strong></section>
</template>
</InvestigationRail>

    <div v-if="selectedClue" class="map-clue-scrim" @click.self="activeClueId = null"><article class="map-clue-card" role="dialog" aria-modal="true" :aria-label="selectedClue.title"><button type="button" class="map-clue-close" @click="activeClueId = null">关闭 ×</button><span>纸上故事 / 原创虚构</span><h2>{{ selectedClue.title }}</h2><p>{{ selectedStoryText }}</p><small>{{ allFound ? '故事读齐后仍需留白：没有署名、日期或渡河完成记录。' : '先留下这处观察；等读到其他更新语，再把它放回整张图。' }}</small><button type="button" @click="activeClueId = null">收进故事手账 →</button></article></div>
  </section>
</template>

<style scoped>
.map-investigation{color:#e9e2d2;font-family:var(--font-sans)}.map-worktop{border:1px solid #514e40;background:#191d17}.map-worktop-head{display:flex;justify-content:space-between;align-items:end;gap:30px;padding:22px 28px 17px;border-bottom:1px solid #47483d}.map-worktop-head span,.map-journal header span,.map-synthesis>span,.map-clue-card>span{color:#d69480;font-size:12px;font-weight:700;letter-spacing:.1em}.map-worktop-head h2{margin:7px 0 0;font:600 24px/1.35 var(--font-display)}.map-worktop-head p{max-width:420px;margin:0;color:#c2c4b7;font-size:14px;line-height:1.6}.map-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:12px 20px;border-bottom:1px solid #47483d}.map-tools button{min-height:38px;padding:7px 14px;color:#e8deca;border:1px solid #6c6958;background:#242a22;font-size:14px;cursor:pointer}.map-tools button:hover,.map-tools button[aria-pressed=true]{border-color:#ca8975;background:#673d34}.map-tools button:disabled{opacity:.4;cursor:not-allowed}.map-tools span{margin-left:auto;color:#b9bba9;font-size:13px}.map-paper-stage{position:relative;max-width:1400px;margin:auto;background:radial-gradient(ellipse at center,#36382b,#171d16 72%)}.map-paper-stage svg{display:block;width:100%;height:auto}.map-paper-stage.raking-light:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 24%,rgba(255,230,168,.16) 40%,transparent 62%)}.map-hotspots path,.map-hotspots rect{fill:transparent;stroke:transparent;stroke-width:2;cursor:pointer}.map-hotspots path:hover,.map-hotspots rect:hover,.map-hotspots path:focus-visible,.map-hotspots rect:focus-visible{fill:rgba(246,228,170,.13);stroke:rgba(133,75,53,.7);outline:none}.map-ruler{cursor:grab;touch-action:none}.map-ruler:active{cursor:grabbing}.map-unfold{position:absolute;inset:25% 31%;display:grid;place-content:center;gap:10px;text-align:center;color:#f0e5d3;background:rgba(30,33,27,.92);border:1px solid #b28b6a;box-shadow:0 22px 65px #151611;cursor:pointer}.map-unfold span{font-size:13px}.map-unfold strong{font:600 24px var(--font-display)}.map-stage-caption{margin:0;padding:10px 24px 16px;color:#c8c6b6;font-size:13px;line-height:1.5}.map-story-grid{display:grid;grid-template-columns:minmax(320px,.82fr) minmax(0,1.18fr);gap:18px;margin-top:18px}.map-journal,.map-synthesis{min-width:0;border:1px solid #514e40;background:#20251e}.map-journal header{padding:19px 22px 13px;border-bottom:1px solid #484a3f}.map-journal h2,.map-synthesis h2{margin:6px 0 0;font:600 23px/1.4 var(--font-display)}.map-journal-list{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:16px}.map-journal-list button{min-height:80px;text-align:left;padding:12px;border:1px solid #686456;background:#2b2e24;color:#f0e6d2;cursor:pointer}.map-journal-list button:disabled{opacity:.5;cursor:default}.map-journal-list button:not(:disabled):hover{border-color:#ca8975}.map-journal-list small{display:block;color:#d99c89;font-size:11px}.map-journal-list strong{display:block;margin-top:6px;font-size:15px;line-height:1.4}.map-synthesis{padding:20px 24px}.map-synthesis p{color:#d0cbbc;font-size:14px;line-height:1.7}.map-caption-options{display:grid;gap:7px}.map-caption-options button{padding:10px 13px;text-align:left;border:1px solid #77705e;color:#ede4d3;background:#292d24;font-size:14px;line-height:1.5;cursor:pointer}.map-caption-options button:hover,.map-caption-options button[aria-pressed=true]{border-color:#d48b77;background:#59392f}.map-caption-feedback{border-left:3px solid #cb8a75;padding-left:12px}.map-save-button,.map-clue-card>button:last-child{padding:12px 22px;border:1px solid #a66352;color:#fff2df;background:#8a483b;font-weight:700;cursor:pointer}.map-saved{display:block;margin-top:12px;color:#e5b391;font-size:14px}.map-clue-scrim{position:fixed;z-index:80;inset:0;display:grid;place-items:center;background:rgba(6,10,7,.72)}.map-clue-card{width:min(510px,90vw);padding:28px 32px;border:1px solid #a57965;background:#eee2cb;color:#2b2b25;box-shadow:0 25px 80px #0008}.map-clue-card h2{font:700 28px var(--font-display)}.map-clue-card p{font-size:17px;line-height:1.75}.map-clue-card small{display:block;margin:20px 0;color:#6b5345;font-size:13px;line-height:1.6}.map-clue-close{float:right;border:0;background:none;color:#773f35;font-size:14px;cursor:pointer}@media(max-width:1000px){.map-story-grid{grid-template-columns:1fr}}
.map-worktop-head { padding: 16px 22px 12px; }
.map-worktop-head h2,.map-journal h2 { font: 700 24px/1.3 var(--font-display); }
.map-synthesis h2 { font: 700 26px/1.3 var(--font-display); }
.map-worktop-head p,.map-stage-caption,.map-synthesis p { font-size: 14px; }
.map-tools span,.map-journal-list small,.map-saved { font-size: 12px; }
.map-story-grid { gap: 0; margin-top: 0; border: 1px solid #514e40; border-top: 0; background: #20251e; }
.map-journal,.map-synthesis { border: 0; background: transparent; }
.map-journal { border-right: 1px solid #484a3f; }
.map-journal header { padding: 14px 20px 10px; }
.map-journal-list { grid-template-columns: 1fr; gap: 0; padding: 4px 20px 12px; }
.map-journal-list button { min-height: 56px; padding: 7px 3px; border: 0; border-bottom: 1px solid #484a3f; background: transparent; }
.map-journal-list button:not(:disabled):hover { padding-left: 10px; border-bottom-color: #ca8975; }
.map-journal-list strong { font: 650 15px/1.45 var(--font-sans); }
.map-synthesis { padding: 15px 22px; }
.map-synthesis h2 { color: #f2e6d4; }
.map-caption-options { gap: 0; border-top: 1px solid #686456; }
.map-caption-options button { padding: 8px 3px; border: 0; border-bottom: 1px solid #686456; background: transparent; font-size: 14px; }
.map-caption-options button:hover,.map-caption-options button[aria-pressed=true] { padding-left: 12px; border-bottom-color: #d48b77; background: rgba(159,86,65,.14); }
.map-save-button { font-size: 14px; }
.map-journal-list button:disabled { opacity: .7; }
.map-clue-card>span { font-size: 12px; }
.map-clue-card h2 { font-size: 27px; }
.map-clue-card p { font-size: 16px; }
.map-clue-card small { font-size: 14px; }
.map-clue-card>button:last-child { font-size: 14px; }
@media(max-width:1000px){.map-journal{border-right:0;border-bottom:1px solid #484a3f}}
</style>
