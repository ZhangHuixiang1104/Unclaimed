<script setup lang="ts">
import InvestigationRail from './InvestigationRail.vue'
import ObservationControls from './ObservationControls.vue'
import { inspectionRecord } from './inspectionRecord'
import { computed, ref } from 'vue'
import { objectByKey } from '../../data/objects'
import { useArchiveStore } from '../../stores/archive'
import closedBox from '../../../../stuffs/电池盒/美术母版/battery_box_closed_blank.png'
import rightBox from '../../../../stuffs/电池盒/美术母版/battery_box_right_blank.png'
import openedBox from '../../../../stuffs/电池盒/美术母版/battery_lid_inside_blank.png'
import oldBand from '../../../../stuffs/电池盒/美术母版/battery_old_band.png'
import dryLiner from '../../../../stuffs/电池盒/美术母版/battery_dry_liner.png'
import outerBand from '../../../../stuffs/电池盒/美术母版/battery_outer_band.png'
import notePaper from '../../../../stuffs/电池盒/美术母版/battery_note_blank.png'
import terminalDetail from '../../../../stuffs/电池盒/美术母版/battery_terminal_detail.png'
import problemInk from '../../../../stuffs/电池盒/美术母版/ink-battery-problem.svg'
import retryInk from '../../../../stuffs/电池盒/美术母版/ink-battery-retry.svg'
import resultInk from '../../../../stuffs/电池盒/美术母版/ink-battery-result.svg'

type View = 'front' | 'right' | 'open'
const archive = useArchiveStore()
const item = objectByKey('battery')!
const record = computed(() => inspectionRecord(item, archive.getRecord('battery')))
const view = ref<View>('front')
const bandRaised = ref(record.value.completedInteractions.includes('battery-band-lifted'))
const sideLight = ref(false)
const zoomed = ref(false)
const helpOpen = ref(false)
const activeClueId = ref<string | null>(null)
const selectedCaption = ref<number | null>(null)
const feedback = ref(record.value.foundClueIds.length === item.clues.length ? '线索已读齐，可在右侧整理展签。' : record.value.completedInteractions.includes('battery-band-lifted') ? '护带已掀开，可继续查看右侧接点与盖内纸笺。' : '盒子被重新扎牢了。先从布带、接线端与盖边开始看。')
const allFound = computed(() => item.clues.every((clue) => record.value.foundClueIds.includes(clue.id)))
const activeClue = computed(() => item.clues.find((clue) => clue.id === activeClueId.value))
const captions = [
  '旧带被后加护带压住，接线端有处理痕迹；纸笺安排到干处再试，结果未填写。',
  '重新扎牢证明换了一位使用者；空栏说明这次试用失败了。',
  '接点被擦亮，说明盒子成功供电并发出过电报。',
]
const boundaryFor: Record<string, string> = {
  'battery-old-band': '能看到先后两层布，不能按布层数量计算修补次数或人数。',
  'battery-terminal': '较亮的擦痕只能说明表面被处理，不能证明已经通电。',
  'battery-note': '“再试”写的是打算，不是已发生的成功记录。',
  'battery-blank': '空栏不是失败证明，也不是等待刮开的隐藏答案。',
}
const openView = (next: View) => {
  view.value = next
  zoomed.value = false
  if (next === 'right') archive.completeInteraction('battery', 'battery-right-viewed')
  if (next === 'open') archive.completeInteraction('battery', 'battery-lid-opened')
  feedback.value = next === 'right' ? '从右侧看，两个接线端的表面并不一样。' : next === 'open' ? '盖内留着一张普通短笺。两句话之后，还有一处空栏。' : '回到正面。宽护带下面仍压着旧结。'
}
const toggleBand = () => {
  if (view.value !== 'front') openView('front')
  bandRaised.value = !bandRaised.value
  if (bandRaised.value) archive.completeInteraction('battery', 'battery-band-lifted')
  feedback.value = bandRaised.value ? '宽带抬起了一点。旧带没有被剪走，下面还有磨扁的结。' : '护带放回原处；旧结的观察记录仍保留。'
}
const inspect = (id: string) => {
  archive.findClue('battery', id)
  if (record.value.foundClueIds.includes(id)) {
    activeClueId.value = id
    feedback.value = `已记下《${item.clues.find((clue) => clue.id === id)?.title ?? '观察'}》。`
  } else {
    feedback.value = id === 'battery-old-band' ? '先轻轻掀起外层护带，再看它压着什么。' : id === 'battery-blank' ? '先读完短笺，再看下面没有写完的地方。' : '换个视角，仔细看看物件。'
  }
}
const saveStory = () => {
  if (selectedCaption.value !== 0) {
    feedback.value = selectedCaption.value === 1 ? '布层不能证明换了谁；空栏也没有写“失败”。' : '擦痕不等于供电成功。请把短笺上的“再试”和空栏一起读。'
    return
  }
  if (archive.completeBatteryNarrative(selectedCaption.value)) feedback.value = '虚构故事已保存。结果栏仍空着；真实历史要从独立档案阅读。'
}
defineExpose({ reviewClue: (id: string) => { if (record.value.foundClueIds.includes(id)) activeClueId.value = id } })
const resetObservation = () => { view.value = 'front'; sideLight.value = false; zoomed.value = false; bandRaised.value = false; helpOpen.value = false; activeClueId.value = null; feedback.value = '视图已恢复，已发现的线索和阅读记录仍保留在手账中。' }
</script>

<template>
  <section class="battery-investigation inspection-workspace" aria-label="原创虚构电池盒调查台">
    <div class="battery-worktop">

      <ObservationControls help="先掀护带，再查看右侧接点，打开盖子，阅读纸笺与结果空栏。" @reset="resetObservation">
<template #view><button type="button" :aria-pressed="view === 'front'" @click="openView('front')">看正面</button>
<button type="button" :aria-pressed="view === 'right'" @click="openView('right')">转到右侧</button>
<button type="button" :aria-pressed="view === 'open'" @click="openView('open')">{{ view === 'open' ? '盖已打开' : '打开盒盖' }}</button></template>
<template #observe><button type="button" :aria-pressed="sideLight" @click="sideLight = !sideLight">{{ sideLight ? '收起侧光' : '移来侧光' }}</button>
<button type="button" :aria-pressed="zoomed" @click="zoomed = !zoomed">{{ zoomed ? '收起放大' : '放大细节' }}</button></template>
<button type="button" :aria-pressed="bandRaised" @click="toggleBand">{{ bandRaised ? '放回护带' : '轻掀护带' }}</button>
</ObservationControls>
      <div class="battery-stage inspection-artifact-stage" :class="{ 'side-light': sideLight }">
        <div class="battery-scene" :class="`view-${view}`">
          <img class="battery-box-image" :src="view === 'front' ? closedBox : view === 'right' ? rightBox : openedBox" :alt="view === 'open' ? '虚构电池盒开盖内视，盖内可见普通短笺' : '虚构灰绿木胎电池盒，无真实文物铭牌'">
          <template v-if="view === 'front'">
            <img class="battery-old-band" :src="oldBand" alt="" aria-hidden="true">
            <img class="battery-dry-liner" :src="dryLiner" alt="" aria-hidden="true">
            <img class="battery-outer-band" :class="{ raised: bandRaised }" :src="outerBand" alt="" aria-hidden="true">
            <button class="battery-hit battery-hit-band" type="button" aria-label="观察护带下面的旧结" @click="inspect('battery-old-band')"><span class="sr-only">观察护带下面的旧结</span></button>
          </template>
          <button v-if="view === 'right'" class="battery-hit battery-hit-terminal" type="button" aria-label="观察接线端的暗蚀与擦痕" @click="inspect('battery-terminal')"><span class="sr-only">观察接线端的暗蚀与擦痕</span></button>
          <template v-if="view === 'open'">
            <img class="battery-note-paper" :src="notePaper" alt="" aria-hidden="true">
            <img class="battery-ink battery-ink-problem" :src="problemInk" alt="" aria-hidden="true">
            <img class="battery-ink battery-ink-retry" :src="retryInk" alt="" aria-hidden="true">
            <img class="battery-ink battery-ink-result" :src="resultInk" alt="" aria-hidden="true">
            <button class="battery-hit battery-hit-note" type="button" aria-label="阅读盖内两句短笺" @click="inspect('battery-note')"><span class="sr-only">阅读盖内两句短笺</span></button>
            <button class="battery-hit battery-hit-blank" type="button" aria-label="观察试用结果空栏" @click="inspect('battery-blank')"><span class="sr-only">观察试用结果空栏</span></button>
          </template>
        </div>
        <div v-if="zoomed" class="battery-zoom"><button type="button" @click="zoomed = false">收起 ×</button><template v-if="view === 'right'"><img :src="terminalDetail" alt="两只旧铜接线端的放大材质，一端较暗，另一端有亮擦痕"><p>擦痕说明表面被处理，不能说明后来已经通电。</p></template><template v-else-if="view === 'open'"><img :src="notePaper" alt="" aria-hidden="true"><p class="battery-note-transcript">潮后接点不稳。<br>接点已擦，到了干处再试。<br><strong>试用结果：＿＿</strong></p></template><template v-else><img :src="bandRaised ? oldBand : outerBand" alt="放大的布带纹理"><p>先掀起护带，才能看清被压住的旧结。</p></template></div>
      </div>
      <div class="battery-understage"><p aria-live="polite">{{ feedback }}</p><span>游戏物件 · 原创虚构</span></div>
      <div v-if="helpOpen" class="battery-help"><strong>想找不到时，再看这里</strong><button type="button" @click="openView('front')">布带边缘</button><button type="button" @click="openView('right')">接线端</button><button type="button" @click="openView('open')">盖内纸笺与下端空栏</button></div>
    </div>
    <InvestigationRail class="battery-notebook" :found="record.foundClueIds.length" :total="item.clues.length" :ready="allFound">
<template #notes><div class="battery-notebook-list"><button v-for="clue in item.clues" :key="clue.id" type="button" :disabled="!record.foundClueIds.includes(clue.id)" @click="activeClueId = clue.id"><span>{{ record.foundClueIds.includes(clue.id) ? '已收入手账' : '尚未读到' }}</span><strong>{{ record.foundClueIds.includes(clue.id) ? clue.title : '从物件上发现' }}</strong></button></div>
</template>
<template #caption><section class="battery-caption inspection-synthesis"><span>给虚构物件留一句展签</span><h2>{{ allFound ? '能写下的，不是结局' : '先把故事读完整' }}</h2><p>{{ allFound ? '四段话已经读到。选择一条真正由盒子支持的记录；错选不会扣分，随时可以更改。' : '轻掀护带，看右侧接点，打开盖子，再读纸笺最后的空栏。每处线索是一段故事，不是破译密码。' }}</p><div v-if="allFound" class="battery-caption-options"><button v-for="(caption, index) in captions" :key="caption" type="button" :aria-pressed="selectedCaption === index" @click="selectedCaption = index">{{ caption }}</button></div><button v-if="allFound && !record.evidenceVerified" class="battery-save" type="button" :disabled="selectedCaption === null" @click="saveStory">保存这只盒子的故事 →</button><strong v-if="record.evidenceVerified" class="battery-saved">虚构故事已保存 · 史实档案已解封</strong></section>
</template>
</InvestigationRail>

    <div v-if="activeClue" class="battery-story-scrim" @click.self="activeClueId = null"><article class="battery-story-card" role="dialog" aria-modal="true" :aria-label="activeClue.title"><button type="button" class="battery-close" @click="activeClueId = null">关闭 ×</button><span>纸面之外 / 游戏故事</span><h2>{{ activeClue.title }}</h2><p>{{ activeClue.description }}</p><details><summary>这一段还不能证明什么？</summary><p>{{ boundaryFor[activeClue.id] }}</p></details><button type="button" class="battery-card-done" @click="activeClueId = null">收进手账 →</button></article></div>
  </section>
</template>

<style scoped>
.battery-investigation{color:#eae1d0;font-family:var(--font-sans)}.battery-worktop{border:1px solid #5a5648;background:#181e19}.battery-worktop-header{display:flex;justify-content:space-between;align-items:end;gap:28px;padding:19px 24px 16px;border-bottom:1px solid #4d5248}.battery-worktop-header span,.battery-notebook header span,.battery-caption>span,.battery-story-card>span{font-size:12px;letter-spacing:.1em;font-weight:700;color:#d69b85}.battery-worktop-header h2{margin:5px 0 0;font:700 25px/1.3 var(--font-display)}.battery-worktop-header p{max-width:400px;margin:0;color:#c3c8bb;font-size:14px;line-height:1.6}.battery-toolbar{display:flex;flex-wrap:wrap;gap:7px;padding:11px 16px;border-bottom:1px solid #444b42}.battery-toolbar button,.battery-help button{min-height:39px;padding:7px 12px;border:1px solid #686c5e;background:#252c26;color:#ece3d2;font-size:14px;cursor:pointer}.battery-toolbar button[aria-pressed=true],.battery-toolbar button:hover,.battery-help button:hover{border-color:#c88e79;background:#64443a}.battery-stage{position:relative;min-height:400px;background:radial-gradient(ellipse at 53% 52%,#343b32 0,#202820 63%,#171d18 100%);overflow:hidden}.battery-stage.side-light:after{content:"";position:absolute;inset:0;background:linear-gradient(107deg,transparent 10%,rgba(248,223,168,.13) 43%,transparent 67%);pointer-events:none}.battery-scene{position:relative;max-width:1120px;aspect-ratio:8/5;margin:auto}.battery-box-image{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;filter:drop-shadow(5px 23px 24px #0b100caa)}.battery-old-band,.battery-dry-liner,.battery-outer-band,.battery-note-paper,.battery-ink{position:absolute;object-fit:contain;pointer-events:none}.battery-old-band{left:19%;top:18%;width:46%;height:63%;transform:rotate(-7deg);z-index:1}.battery-dry-liner{left:41%;top:25%;width:32%;height:52%;transform:rotate(-7deg);opacity:.89;z-index:2}.battery-outer-band{left:27%;top:18%;width:57%;height:65%;transform:rotate(-1deg);transform-origin:88% 80%;transition:transform .45s ease,filter .45s ease;z-index:3}.battery-outer-band.raised{transform:rotate(-17deg) translateY(-9%);filter:drop-shadow(6px 12px 8px #0b100ca8)}.battery-note-paper{left:30%;top:17%;width:43%;height:28%;z-index:1;filter:drop-shadow(2px 4px 5px #080b0870)}.battery-ink{z-index:2}.battery-ink-problem{left:35%;top:20%;width:26%;height:6%}.battery-ink-retry{left:35%;top:26%;width:34%;height:6%}.battery-ink-result{left:35%;top:34%;width:25%;height:6%}.battery-hit{position:absolute;z-index:4;border:1px solid transparent;background:transparent;cursor:crosshair;border-radius:22px}.battery-hit:hover,.battery-hit:focus-visible{background:rgba(246,221,171,.13);border-color:#dcc29b;outline:0;box-shadow:0 0 0 5px #e6b99335}.battery-hit-band{left:27%;top:46%;width:25%;height:21%}.battery-hit-terminal{left:63%;top:28%;width:27%;height:25%}.battery-hit-note{left:32%;top:18%;width:38%;height:16%}.battery-hit-blank{left:34%;top:34%;width:35%;height:9%}.battery-understage{display:flex;justify-content:space-between;gap:20px;padding:12px 20px;color:#d3d3c4;font-size:13px;border-top:1px solid #454c42}.battery-understage p{margin:0}.battery-understage span{flex-shrink:0;color:#c58e7a}.battery-help{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 18px;border-top:1px solid #444b42}.battery-help strong{margin-right:12px;color:#e9e0ce;font-size:13px}.battery-zoom{position:absolute;z-index:6;right:3%;top:3%;width:min(370px,42%);padding:14px;border:1px solid #b5a48b;background:#ede2cf;color:#2d3029;box-shadow:0 20px 55px #090d0aaa}.battery-zoom>button{display:block;margin-left:auto;border:0;background:none;color:#783f35;cursor:pointer}.battery-zoom img{display:block;width:100%;max-height:250px;object-fit:contain}.battery-zoom p{margin:8px 0 0;font-size:14px;line-height:1.55}.battery-zoom .battery-note-transcript{padding:0 12px 8px;font:20px/1.8 var(--font-display)}.battery-story{display:grid;grid-template-columns:1fr 1.15fr;border:1px solid #5a5648;border-top:0;background:#232a23}.battery-notebook{border-right:1px solid #4b5247}.battery-notebook header{padding:16px 20px 10px}.battery-notebook h2,.battery-caption h2{margin:6px 0;font:700 24px/1.3 var(--font-display)}.battery-notebook header small{color:#b8c0b2;font-size:12px}.battery-notebook-list{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:9px 19px 18px}.battery-notebook-list button{min-height:67px;text-align:left;padding:9px 11px;border:1px solid #6f6c5c;background:#2c332c;color:#f0e6d4;cursor:pointer}.battery-notebook-list button:disabled{opacity:.48;cursor:default}.battery-notebook-list button:not(:disabled):hover{border-color:#d19b80}.battery-notebook-list span{display:block;color:#d7a389;font-size:11px}.battery-notebook-list strong{display:block;margin-top:4px;font-size:15px}.battery-caption{padding:16px 22px 19px}.battery-caption p{margin:8px 0 12px;color:#d0cebf;font-size:14px;line-height:1.65}.battery-caption-options{display:grid;gap:6px}.battery-caption-options button{padding:10px 12px;text-align:left;border:1px solid #6d6b5b;background:#30372e;color:#f0e6d6;font-size:14px;line-height:1.45;cursor:pointer}.battery-caption-options button:hover,.battery-caption-options button[aria-pressed=true]{border-color:#cb927b;background:#5e4035}.battery-save,.battery-card-done{margin-top:13px;padding:11px 18px;border:1px solid #bb806d;background:#875043;color:#fff0dd;font-weight:700;cursor:pointer}.battery-save:disabled{opacity:.45;cursor:not-allowed}.battery-saved{display:block;margin-top:13px;color:#eab59d;font-size:14px}.battery-story-scrim{position:fixed;z-index:80;inset:0;display:grid;place-items:center;padding:20px;background:#080d0bc4}.battery-story-card{width:min(550px,100%);padding:26px 30px;background:#eee2cc;color:#302b24;border:1px solid #ad8166;box-shadow:0 28px 85px #0008}.battery-story-card h2{margin:10px 0;font:700 29px/1.3 var(--font-display)}.battery-story-card>p{font-size:17px;line-height:1.8}.battery-story-card details{border-top:1px solid #cbbda5;margin-top:16px;padding-top:13px;color:#614d3d;font-size:14px;line-height:1.6}.battery-story-card summary{cursor:pointer;font-weight:700}.battery-close{float:right;border:0;background:none;color:#823f32;font-size:14px;cursor:pointer}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:950px){.battery-story{grid-template-columns:1fr}.battery-notebook{border-right:0;border-bottom:1px solid #4b5247}.battery-worktop-header{align-items:start;flex-direction:column}.battery-stage{min-height:300px}}
</style>
