<script setup lang="ts">
import InvestigationRail from './InvestigationRail.vue'
import ObservationControls from './ObservationControls.vue'
import { inspectionRecord } from './inspectionRecord'
import { computed, ref } from 'vue'
import { objectByKey } from '../../data/objects'
import { useArchiveStore } from '../../stores/archive'
import largeTop from '../../../../stuffs/草鞋/美术母版/shoe_large_top.png'
import smallTop from '../../../../stuffs/草鞋/美术母版/shoe_small_top.png'
import largeSole from '../../../../stuffs/草鞋/美术母版/shoe_large_sole.png'
import smallSole from '../../../../stuffs/草鞋/美术母版/shoe_small_sole.png'
import pairInk from '../../../../stuffs/草鞋/美术母版/ink-shoes-pair.svg'

const archive = useArchiveStore()
const item = objectByKey('shoes')!
const record = computed(() => inspectionRecord(item, archive.getRecord('shoes')))
const has = (id: string) => record.value.completedInteractions.includes(id)
const separated = computed(() => has('shoes-separated'))
const repairReady = computed(() => has('shoes-large-repair-viewed') && has('shoes-small-repair-viewed'))
const solesReady = computed(() => has('shoes-large-sole-viewed') && has('shoes-small-sole-viewed'))
const cordReady = computed(() => ['shoes-measure', 'shoes-repair', 'shoes-wear'].every((id) => record.value.foundClueIds.includes(id)))
const allFound = computed(() => item.clues.every((clue) => record.value.foundClueIds.includes(clue.id)))
const measuring = ref(has('shoes-measured'))
const sideLight = ref(has('shoes-light-on'))
const largeFlipped = ref(false)
const smallFlipped = ref(false)
const traceOn = ref(has('shoes-wear-traced'))
const cordRaised = ref(has('shoes-cord-lifted'))
const helpOpen = ref(false)
const activeClueId = ref<string | null>(null)
const selectedCaption = ref<number | null>(null)
const feedback = ref(record.value.foundClueIds.length === item.clues.length ? '线索已读齐，可在右侧整理展签。' : has('shoes-separated') ? '对照两只鞋的长度与补编，再分别翻看鞋底。' : '桌上是两只被并作一份保存的旧鞋。先把它们轻轻分开。')
const activeClue = computed(() => item.clues.find((clue) => clue.id === activeClueId.value))
const captions = [
  '两只旧鞋被并作一份保存。尺寸、补编与磨损各不相同；原先怎样同行、由谁穿过，仍无记录。',
  '一大一小证明父子共同走过雪山草地。',
  '外绳证明这双鞋在同一次战斗中被人修好。',
]
const boundaries: Record<string, string> = {
  'shoes-measure': '一大一小不是父子、年龄或穿鞋人数的证明。旧鞋也可能换穿、转手。',
  'shoes-repair': '补编看得见，次数、时日、材料来处和修补者都没有登记。',
  'shoes-wear': '磨损只能显示两只鞋受力不同；不能倒推具体道路、战斗或使用者。',
  'shoes-cord': '这条外绳是虚构档案并置的一部分，不是某件真实文物的绳带。',
}
const separate = () => {
  archive.completeInteraction('shoes', 'shoes-separated')
  feedback.value = '两只鞋分开了。对齐鞋跟再比鞋尖，别急着给它们写名字。'
}
const measure = () => {
  if (!separated.value) return
  measuring.value = !measuring.value
  if (measuring.value) archive.completeInteraction('shoes', 'shoes-measured')
  feedback.value = measuring.value ? '刻度尺已经沿两只鞋的鞋跟放好。点一下尺边，读它们被写成一双的第一段。' : '收起刻度尺；比较结果仍留在手账。'
}
const useLight = () => {
  if (!separated.value) return
  sideLight.value = !sideLight.value
  if (sideLight.value) archive.completeInteraction('shoes', 'shoes-light-on')
  feedback.value = sideLight.value ? '侧光照出两处不一样的补编。分别看较长鞋的后跟、较短鞋的鞋头。' : '侧光收起；已读到的补编故事仍在。'
}
const flip = (which: 'large' | 'small') => {
  if (!separated.value) return
  if (which === 'large') {
    largeFlipped.value = !largeFlipped.value
    if (largeFlipped.value) archive.completeInteraction('shoes', 'shoes-large-sole-viewed')
  } else {
    smallFlipped.value = !smallFlipped.value
    if (smallFlipped.value) archive.completeInteraction('shoes', 'shoes-small-sole-viewed')
  }
  feedback.value = solesReady.value ? '两只鞋底都看过了。打开描线，比比磨得最深的地方。' : '鞋底露出来了。再看看另一只，才有比较。'
}
const trace = () => {
  if (!solesReady.value) return
  traceOn.value = !traceOn.value
  if (traceOn.value) archive.completeInteraction('shoes', 'shoes-wear-traced')
  feedback.value = traceOn.value ? '描线已经落在两只鞋的不同受力处。点击中间的比较条，读第三段。' : '描线暂收起；观察记录没有丢。'
}
const liftCord = () => {
  if (!cordReady.value) return
  cordRaised.value = !cordRaised.value
  if (cordRaised.value) {
    archive.completeInteraction('shoes', 'shoes-cord-lifted')
    archive.findClue('shoes', 'shoes-cord')
    activeClueId.value = 'shoes-cord'
  }
  feedback.value = cordRaised.value ? '绳离开鞋面了：它把两只鞋拢成一份，并没有把鞋补成一双。' : '外绳放回；第四段故事已记下。'
}
const inspect = (id: string) => {
  archive.findClue('shoes', id)
  if (record.value.foundClueIds.includes(id)) {
    activeClueId.value = id
    feedback.value = `《${item.clues.find((clue) => clue.id === id)?.title ?? '观察'}》已收入手账。`
  } else {
    feedback.value = '再换一种看法：分开、比尺寸、照补编或翻鞋底。'
  }
}
const inspectRepair = (which: 'large' | 'small') => {
  if (!sideLight.value) return
  archive.completeInteraction('shoes', which === 'large' ? 'shoes-large-repair-viewed' : 'shoes-small-repair-viewed')
  if (repairReady.value) inspect('shoes-repair')
  else feedback.value = '这一处补编看到了。另一只鞋的补编也值得看看。'
}
const saveStory = () => {
  if (selectedCaption.value !== 0) {
    feedback.value = selectedCaption.value === 1 ? '尺寸无法证明亲属，也无法指出雪山草地。' : '外绳只把两只鞋并在一处，不能证明战斗或同一次修理。'
    return
  }
  if (archive.completeShoesNarrative(selectedCaption.value)) feedback.value = '《不成双》的虚构故事已保存。真实草鞋的材料另在独立展柜。'
}
defineExpose({ reviewClue: (id: string) => { if (record.value.foundClueIds.includes(id)) activeClueId.value = id } })
const resetObservation = () => { measuring.value = false; sideLight.value = false; largeFlipped.value = false; smallFlipped.value = false; traceOn.value = false; cordRaised.value = false; helpOpen.value = false; activeClueId.value = null; feedback.value = '视图已恢复，已发现的线索和阅读记录仍保留在手账中。' }
</script>

<template>
  <section class="shoes-investigation inspection-workspace" aria-label="原创虚构草鞋检查台">
    <div class="shoes-worktop">

      <ObservationControls help="先分开两只鞋，再比较长度、侧光看补编、分别翻底，最后观察外绳。" @reset="resetObservation" :ready="separated">
<template #view><button type="button" :disabled="!separated" :aria-pressed="largeFlipped" @click="flip('large')">{{ largeFlipped ? '长鞋翻回' : '翻长鞋' }}</button>
<button type="button" :disabled="!separated" :aria-pressed="smallFlipped" @click="flip('small')">{{ smallFlipped ? '短鞋翻回' : '翻短鞋' }}</button></template>
<template #observe><button type="button" :disabled="!separated" :aria-pressed="measuring" @click="measure">{{ measuring ? '收起刻度' : '沿尺比长度' }}</button>
<button type="button" :disabled="!separated" :aria-pressed="sideLight" @click="useLight">{{ sideLight ? '收起侧光' : '移来侧光' }}</button>
<button type="button" :disabled="!solesReady" :aria-pressed="traceOn" @click="trace">{{ traceOn ? '收起描线' : '比对磨损' }}</button></template>
<button type="button" :disabled="separated" @click="separate">{{ separated ? '已轻轻分开' : '轻轻分开' }}</button>
<button type="button" :disabled="!cordReady" :aria-pressed="cordRaised" @click="liftCord">{{ cordRaised ? '放回外绳' : '提起外绳' }}</button>
</ObservationControls>
      <div class="shoes-stage inspection-artifact-stage" :class="{ 'lit': sideLight, 'separated': separated, 'cord-raised': cordRaised }"><div class="inspection-object-canvas">
        <div class="shoes-grid" aria-hidden="true"></div>
        <img class="shoes-ink" :src="pairInk" alt="" aria-hidden="true">
        <svg class="shoes-cord" viewBox="0 0 1000 560" aria-hidden="true"><path d="M 237 310 C 199 166 311 108 488 125 C 664 85 801 167 803 314 C 822 450 680 486 508 464 C 323 493 225 422 237 310 Z" /><path d="M803 314 Q835 304 855 319 M804 318 Q830 340 850 350" /></svg>
        <div class="shoe shoe-large" :class="{ 'flipped': largeFlipped }"><img :src="largeFlipped ? largeSole : largeTop" :alt="largeFlipped ? '虚构较长草鞋鞋底，外后缘磨损较深' : '虚构较长草鞋鞋面，后跟有旧补编'"><button v-if="sideLight && !largeFlipped" class="shoe-hotspot patch-large" type="button" aria-label="查看长鞋后跟的旧补编" @click="inspectRepair('large')"><span>查看后跟补编</span></button></div>
        <div class="shoe shoe-small" :class="{ 'flipped': smallFlipped }"><img :src="smallFlipped ? smallSole : smallTop" :alt="smallFlipped ? '虚构较短草鞋鞋底，前掌磨损较深' : '虚构较短草鞋鞋面，鞋头有较浅的补编'"><button v-if="sideLight && !smallFlipped" class="shoe-hotspot patch-small" type="button" aria-label="查看短鞋鞋头的补编" @click="inspectRepair('small')"><span>查看鞋头补编</span></button></div>
        <button v-if="measuring" class="shoes-measure" type="button" @click="inspect('shoes-measure')"><span>同一起点线 · 点击记录长度差异</span><i></i></button>
        <button v-if="traceOn && solesReady" class="shoes-trace" type="button" @click="inspect('shoes-wear')">对照两处磨损 →</button>
        <span v-if="traceOn && largeFlipped" class="wear-mark wear-mark-large" aria-hidden="true"></span>
        <span v-if="traceOn && smallFlipped" class="wear-mark wear-mark-small" aria-hidden="true"></span>
        <div v-if="!separated" class="shoes-first-action"><strong>两只鞋压在一处</strong><p>先别把登记上的“一双”当成答案。</p><button type="button" @click="separate">把它们分开 →</button></div>
        <span class="shoes-stage-label">原创虚构物件 · 两只旧鞋</span>
      </div></div>
      <div class="shoes-understage"><p aria-live="polite">{{ feedback }}</p><span>{{ record.foundClueIds.length }} / 4 段故事</span></div>
      <div v-if="helpOpen" class="shoes-help"><strong>观察顺序</strong><span>分开 → 尺边 → 两处补编 → 两只鞋底 → 外绳</span><small>侧光、翻面和描线可随时收起；已读故事会保留。</small></div>
    </div>
    <InvestigationRail class="shoes-notebook" :found="record.foundClueIds.length" :total="item.clues.length" :ready="allFound">
<template #notes><div class="shoes-note-list"><button v-for="clue in item.clues" :key="clue.id" type="button" :disabled="!record.foundClueIds.includes(clue.id)" @click="activeClueId = clue.id"><small>{{ record.foundClueIds.includes(clue.id) ? '已记下 · 点击重读' : '仍在鞋上' }}</small><strong>{{ record.foundClueIds.includes(clue.id) ? clue.title : '再观察一处' }}</strong></button></div>
</template>
<template #caption><section class="shoes-caption inspection-synthesis"><span>给虚构物件写一句展签</span><h2>{{ allFound ? '留下差异，也留下未知' : '别急着给鞋找主人' }}</h2><p>{{ allFound ? '四段话已经读完。选一句能被这两只鞋和外绳支持的记录；选错可以重选。' : '这不是身份谜题。先把鞋、补编、鞋底和外绳各自说的事读完。' }}</p><div v-if="allFound" class="shoes-options"><button v-for="(caption, index) in captions" :key="caption" type="button" :aria-pressed="selectedCaption === index" @click="selectedCaption = index">{{ caption }}</button></div><button v-if="allFound && !record.evidenceVerified" class="shoes-save" type="button" :disabled="selectedCaption === null" @click="saveStory">保存《不成双》的故事 →</button><strong v-if="record.evidenceVerified" class="shoes-saved">虚构故事已保存 · 真实材料需从下方单独翻阅</strong></section>
</template>
</InvestigationRail>

    <div v-if="activeClue" class="shoes-scrim" @click.self="activeClueId = null"><article class="shoes-story-card" role="dialog" aria-modal="true" :aria-label="activeClue.title"><button type="button" class="shoes-close" @click="activeClueId = null">关闭 ×</button><span>游戏故事 · 一段观察</span><h2>{{ activeClue.title }}</h2><p>{{ activeClue.description }}</p><details><summary>到这里，仍不能确定什么？</summary><p>{{ boundaries[activeClue.id] }}</p></details><button type="button" class="shoes-card-done" @click="activeClueId = null">收进手账 →</button></article></div>
  </section>
</template>

<style scoped>
.shoes-investigation{color:#ece4d3;font-family:var(--font-sans)}.shoes-worktop{border:1px solid #645f4d;background:#20251f}.shoes-heading{display:flex;align-items:end;justify-content:space-between;gap:28px;padding:18px 23px 15px;border-bottom:1px solid #5a5c4f}.shoes-heading span,.shoes-notebook header span,.shoes-caption>span,.shoes-story-card>span{font-size:12px;font-weight:700;letter-spacing:.08em;color:#d1ac79}.shoes-heading h2{margin:5px 0 0;font:700 25px/1.3 var(--font-display)}.shoes-heading p{max-width:390px;margin:0;color:#d3cdbc;font-size:14px;line-height:1.6}.shoes-toolbar{display:flex;flex-wrap:wrap;gap:7px;padding:10px 14px;border-bottom:1px solid #51564b}.shoes-toolbar button,.shoes-help button{min-height:37px;padding:7px 10px;border:1px solid #686e5f;background:#30382f;color:#f2ead8;font-size:13px;cursor:pointer}.shoes-toolbar button:hover,.shoes-toolbar button[aria-pressed=true]{border-color:#d4ad72;background:#67563c}.shoes-toolbar button:disabled{opacity:.43;cursor:not-allowed}.shoes-stage{position:relative;min-height:450px;overflow:hidden;background:radial-gradient(ellipse at center,#575747 0,#353c32 58%,#20271f 100%)}.shoes-stage.lit:after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 10%,#efcf9450 43%,transparent 72%);pointer-events:none}.shoes-grid{position:absolute;inset:0;background:repeating-linear-gradient(0deg,#fff1 0 1px,transparent 1px 44px),repeating-linear-gradient(90deg,#fff1 0 1px,transparent 1px 44px);opacity:.18}.shoes-cord{position:absolute;z-index:2;inset:0;width:100%;height:100%;fill:none;stroke:#b49b67;stroke-width:9;stroke-linecap:round;opacity:.74;filter:drop-shadow(3px 6px 3px #1119);transition:transform .45s,opacity .45s;pointer-events:none}.shoes-stage.separated .shoes-cord{stroke-width:7}.shoes-stage.cord-raised .shoes-cord{transform:translateY(-12%);opacity:.34}.shoe{position:absolute;z-index:3;top:8%;width:34%;height:78%;transition:left .55s ease,transform .55s ease;filter:drop-shadow(8px 18px 16px #10170fcc)}.shoe img{width:100%;height:100%;object-fit:contain}.shoe-large{left:31%;transform:rotate(-13deg)}.shoe-small{left:43%;transform:rotate(11deg)}.separated .shoe-large{left:16%;transform:rotate(-8deg)}.separated .shoe-small{left:51%;transform:rotate(9deg) scale(.84)}.shoe-hotspot{position:absolute;z-index:2;border:1px solid transparent;border-radius:40%;background:transparent;cursor:crosshair}.shoe-hotspot:hover,.shoe-hotspot:focus-visible{border-color:#f6d5a4;background:#f0ce8440;outline:2px solid #f5dcad}.shoe-hotspot span{display:none;position:absolute;top:-30px;left:50%;transform:translateX(-50%);white-space:nowrap;padding:4px 7px;background:#272a21;color:#fff2dc;font-size:12px}.shoe-hotspot:hover span,.shoe-hotspot:focus-visible span{display:block}.patch-large{bottom:5%;left:18%;width:31%;height:23%}.patch-small{top:5%;left:10%;width:40%;height:23%}.shoes-measure{position:absolute;z-index:5;left:15%;right:15%;bottom:12%;height:40px;border:0;border-bottom:2px solid #dfc38e;background:#202920d9;color:#f3dfb8;cursor:pointer;font-size:13px}.shoes-measure i{position:absolute;inset:auto 0 -7px;height:12px;background:repeating-linear-gradient(90deg,#dfc38e 0 1px,transparent 1px 3.33%)}.shoes-trace{position:absolute;z-index:5;left:41%;top:44%;padding:9px 12px;border:1px solid #e1c297;background:#233128e8;color:#ffe9c6;cursor:pointer}.wear-mark{position:absolute;z-index:4;width:14%;height:12%;border:3px dashed #f0b978;border-radius:50%;pointer-events:none}.wear-mark-large{left:26%;top:67%;transform:rotate(-18deg)}.wear-mark-small{left:62%;top:15%;transform:rotate(15deg)}.shoes-first-action{position:absolute;z-index:8;right:3%;bottom:9%;max-width:250px;padding:14px 17px;background:#e8dcc4;color:#302c24;box-shadow:0 8px 25px #1117}.shoes-first-action strong{font:700 18px var(--font-display)}.shoes-first-action p{font-size:13px;line-height:1.5}.shoes-first-action button{padding:8px 10px;border:0;background:#68513a;color:#fff2db;cursor:pointer}.shoes-stage-label{position:absolute;z-index:5;left:16px;top:14px;color:#f1e5cc;font-size:12px;letter-spacing:.08em}.shoes-understage{display:flex;justify-content:space-between;gap:20px;padding:11px 18px;color:#e6dec9;font-size:13px;border-top:1px solid #4e5449}.shoes-understage p{margin:0}.shoes-understage span{white-space:nowrap;color:#e3ba83}.shoes-help{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:10px 18px;border-top:1px solid #51564b;font-size:13px;color:#eee2cf}.shoes-help small{color:#cabfae}.shoes-reading{display:grid;grid-template-columns:.95fr 1.05fr;border:1px solid #645f4d;border-top:0;background:#283027}.shoes-notebook{border-right:1px solid #596050}.shoes-notebook header,.shoes-caption{padding:16px 20px}.shoes-notebook h2,.shoes-caption h2{margin:5px 0 10px;font:700 23px/1.3 var(--font-display)}.shoes-note-list{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:0 20px 18px}.shoes-note-list button{min-height:66px;padding:9px 11px;text-align:left;border:1px solid #77775f;background:#354034;color:#fff0d9;cursor:pointer}.shoes-note-list button:disabled{opacity:.45;cursor:default}.shoes-note-list button:not(:disabled):hover{border-color:#e6bb85}.shoes-note-list small{display:block;font-size:11px;color:#e0bb8f}.shoes-note-list strong{display:block;margin-top:5px;font-size:15px}.shoes-caption p{margin:0 0 11px;font-size:14px;line-height:1.6;color:#d6d1bf}.shoes-options{display:grid;gap:6px}.shoes-options button{padding:9px 12px;text-align:left;border:1px solid #75735c;background:#3a4337;color:#f1e5d0;line-height:1.45;font-size:14px;cursor:pointer}.shoes-options button:hover,.shoes-options button[aria-pressed=true]{border-color:#e1b682;background:#63543d}.shoes-save,.shoes-card-done{margin-top:12px;padding:10px 16px;border:1px solid #d4a771;background:#865a39;color:#fff3df;font-weight:700;cursor:pointer}.shoes-save:disabled{opacity:.4;cursor:not-allowed}.shoes-saved{display:block;margin-top:12px;color:#edc390;font-size:14px}.shoes-scrim{position:fixed;z-index:80;inset:0;display:grid;place-items:center;padding:20px;background:#0b100bd1}.shoes-story-card{width:min(560px,100%);padding:26px 30px;background:#f0e4cc;color:#302a21;border:1px solid #a98452;box-shadow:0 25px 80px #0008}.shoes-story-card>span{color:#805e33}.shoes-story-card h2{margin:10px 0;font:700 29px/1.3 var(--font-display)}.shoes-story-card>p{font-size:17px;line-height:1.75}.shoes-story-card details{margin-top:16px;padding-top:13px;border-top:1px solid #cbb995;color:#604e37;font-size:14px;line-height:1.6}.shoes-story-card summary{cursor:pointer;font-weight:700}.shoes-close{float:right;border:0;background:transparent;color:#78482c;cursor:pointer}.shoes-card-done{display:block}@media(max-width:950px){.shoes-heading{align-items:start;flex-direction:column}.shoes-reading{grid-template-columns:1fr}.shoes-notebook{border-right:0;border-bottom:1px solid #596050}.shoes-stage{min-height:360px}}
.shoes-ink{position:absolute;z-index:5;top:13px;right:16px;width:190px;max-width:28%;height:auto;opacity:.72;pointer-events:none}
</style>
