<script setup lang="ts">
import InvestigationRail from './InvestigationRail.vue'
import ObservationControls from './ObservationControls.vue'
import { inspectionRecord } from './inspectionRecord'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { objectByKey } from '../../data/objects'
import { useArchiveStore } from '../../stores/archive'
import { useAccountStore } from '../../stores/account'
import bowlTop from '../../../../stuffs/饭碗/美术母版/bowl_top_blank.png'
import bowlOblique from '../../../../stuffs/饭碗/美术母版/bowl_oblique_blank.png'
import bowlBase from '../../../../stuffs/饭碗/美术母版/bowl_underside_blank.png'
import paperFront from '../../../../stuffs/饭碗/美术母版/bowl_wrapper_front_blank.png'
import paperBack from '../../../../stuffs/饭碗/美术母版/bowl_wrapper_back_blank.png'
import rimDetail from '../../../../stuffs/饭碗/美术母版/bowl_rim_detail.png'
import baseDetail from '../../../../stuffs/饭碗/美术母版/bowl_base_detail.png'

const archive = useArchiveStore()
const account = useAccountStore()
const item = objectByKey('bowl')!
const record = computed(() => inspectionRecord(item, archive.getRecord('bowl')))
const has = (id: string) => record.value.completedInteractions.includes(id)
const found = (id: string) => record.value.foundClueIds.includes(id)
const opened = computed(() => has('bowl-wrapper-opened'))
const turned = ref(has('bowl-rotated'))
const lit = ref(has('bowl-light-on'))
const baseShown = ref(has('bowl-base-viewed'))
const paperTurned = ref(has('bowl-paper-turned'))
const lightPosition = ref(0)
const selectedCaption = ref<number | null>(null)
const activeClueId = ref<string | null>(null)
const activeClue = computed(() => item.clues.find((clue) => clue.id === activeClueId.value))
const allFound = computed(() => item.clues.every((clue) => found(clue.id)))
const cloudSaved = computed(() => record.value.evidenceVerified && account.syncState === 'synced' && !account.pendingUpload)
const saving = ref(false)
const feedback = ref(record.value.foundClueIds.length === item.clues.length ? '线索已读齐，可在右侧整理展签。' : has('bowl-wrapper-opened') ? '包纸已经展开，转动饭碗并移来侧光观察碗沿。' : '先展开包纸。它替旧碗挡了灰，却没有替它写姓名。')
const captions = [
  '旧碗留有使用、修补与两道痕迹；包纸嘱咐将它洗净留给后来的人。用碗者是谁、嘱咐是否实现，仍无记录。',
  '两道刻痕说明两名红军先后用过这只碗。',
  '包纸证明这只碗最终被交还给写字的人。',
]
const boundaries: Record<string, string> = {
  'bowl-unwrapped': '包纸与碗一起保存；何人包起、何时包起，没有记录。',
  'bowl-rim': '局部修补可见，不能由此确定修补者、次数与动机。',
  'bowl-marks': '两道痕迹不等于两个名字，也不能证明两次交接。',
  'bowl-paper': '文字表达了留给后来者的意愿，不能证明这份嘱咐后来实现。',
}
const openPaper = () => {
  archive.completeInteraction('bowl', 'bowl-wrapper-opened')
  archive.findClue('bowl', 'bowl-unwrapped')
  activeClueId.value = 'bowl-unwrapped'
  feedback.value = '碗沿露出来了。把它轻轻转向侧光，看看破处。'
}
const rotate = () => {
  if (!opened.value) return
  paperTurned.value = false
  turned.value = !turned.value
  if (turned.value) archive.completeInteraction('bowl', 'bowl-rotated')
  feedback.value = turned.value ? '碗沿朝向了你。移来侧光，再看补处。' : '碗转回原位；读过的故事仍在手账中。'
}
const toggleLight = () => {
  if (!opened.value) return
  lit.value = !lit.value
  if (lit.value) archive.completeInteraction('bowl', 'bowl-light-on')
  feedback.value = lit.value ? '柔和侧光照亮旧痕。它只帮助观察，不替你下结论。' : '侧光收起；观察记录仍在。'
}
const inspectRim = () => {
  archive.findClue('bowl', 'bowl-rim')
  if (found('bowl-rim')) { activeClueId.value = 'bowl-rim'; feedback.value = '破处被接住了。接下来可以托起碗看底面。' }
}
const flipBowl = () => {
  if (!found('bowl-rim')) return
  paperTurned.value = false
  baseShown.value = !baseShown.value
  if (baseShown.value) archive.completeInteraction('bowl', 'bowl-base-viewed')
  feedback.value = baseShown.value ? '底面露出来了。用斜光缓缓扫过，不必猜是谁留下痕迹。' : '碗已放回；底面的观察不会丢失。'
}
const sweep = () => {
  if (!baseShown.value || !lit.value) return
  if (lightPosition.value < 55) { feedback.value = '再让斜光向右一些，碗底还有两道浅痕。'; return }
  archive.findClue('bowl', 'bowl-marks')
  if (found('bowl-marks')) { activeClueId.value = 'bowl-marks'; feedback.value = '两道痕不够写成两个人。现在可以翻看包纸另一面。' }
}
const turnPaper = () => {
  if (!found('bowl-marks')) return
  if (paperTurned.value) { paperTurned.value = false; feedback.value = '包纸已放回，读过的内容仍在手账中。'; return }
  paperTurned.value = true
  archive.completeInteraction('bowl', 'bowl-paper-turned')
  archive.findClue('bowl', 'bowl-paper')
  activeClueId.value = 'bowl-paper'
  feedback.value = '包纸上的嘱咐读到了。它说的是愿望，不是已经完成的交接。'
}
const saveStory = async () => {
  if (saving.value) return
  if (selectedCaption.value !== 0) {
    feedback.value = selectedCaption.value === 1
      ? '痕迹没有姓名，不能证实使用者身份或人数。请选择另一条。'
      : '纸上是留给后来者使用的嘱咐，不是已经完成的交还记录。'
    return
  }
  if (!archive.completeBowlNarrative(selectedCaption.value)) return
  saving.value = true
  try { await account.saveNow() } finally { saving.value = false }
  feedback.value = cloudSaved.value ? '虚构故事已保存到账号。真实碗的材料从下方单独翻阅。' : '展签已在本机暂存，云端尚未确认。请恢复连接后重试保存。'
}
const retrySave = async () => {
  if (saving.value) return
  saving.value = true
  try { await account.saveNow() } finally { saving.value = false }
  feedback.value = cloudSaved.value ? '云端已经确认这份故事。' : '仍未获得云端确认，请检查存档服务。'
}
const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') activeClueId.value = null }
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
defineExpose({ reviewClue: (id: string) => { if (found(id)) activeClueId.value = id } })
const resetObservation = () => { turned.value = false; lit.value = false; baseShown.value = false; paperTurned.value = false; lightPosition.value = 0; activeClueId.value = null; feedback.value = '视图已恢复，已发现的线索和阅读记录仍保留在手账中。' }
</script>

<template>
  <section class="bowl-investigation inspection-workspace" aria-label="原创虚构饭碗检查台">
    <div class="bowl-worktop">
      <ObservationControls help="展开包纸，转动碗沿并移来侧光；翻到底面缓缓移动斜光，最后翻看包纸。" @reset="resetObservation" :ready="opened">
<template #view><button type="button" :disabled="!opened" :aria-pressed="turned" @click="rotate">{{ turned ? '转回碗沿' : '转动饭碗' }}</button>
<button type="button" :disabled="!found('bowl-rim')" :aria-pressed="baseShown" @click="flipBowl">{{ baseShown ? '放回饭碗' : '托起翻底' }}</button></template>
<template #observe><button type="button" :disabled="!opened" :aria-pressed="lit" @click="toggleLight">{{ lit ? '收起侧光' : '移来侧光' }}</button></template>
<button type="button" :disabled="opened" @click="openPaper">{{ opened ? '包纸已展开' : '展开包纸' }}</button>
<button type="button" :disabled="!found('bowl-marks')" @click="turnPaper">{{ paperTurned ? '放回包纸' : '翻看包纸背面' }}</button>
</ObservationControls>
      <div class="bowl-content">
        <div class="bowl-stage inspection-artifact-stage" :class="{ opened, lit, turned, 'base-shown': baseShown, 'paper-turned': paperTurned }"><div class="inspection-object-canvas">
          <div class="paper"><img :src="paperTurned ? paperBack : paperFront" alt="素色旧包纸，折痕清楚，没有姓名"><p v-if="paperTurned" class="paper-writing">洗净放回灶边，<br>后来的人还用得上。</p></div>
          <img class="bowl-main" :src="baseShown ? bowlBase : turned ? bowlOblique : bowlTop" :alt="baseShown ? '原创旧碗底面有两道不同走向的浅痕' : '原创素色旧碗的碗沿有修补和使用痕迹'">
          <span v-if="lit" class="bowl-light" aria-hidden="true"></span>
          <button v-if="turned && lit && !baseShown" class="rim-spot" type="button" @click="inspectRim">看清补处 →</button>
          <div v-if="baseShown && lit && !paperTurned" class="base-sweep"><label for="bowl-light-sweep">缓缓移动斜光</label><input id="bowl-light-sweep" v-model.number="lightPosition" type="range" min="0" max="100" @change="sweep" @pointerup="sweep" @keyup="sweep"><button type="button" @click="sweep">看清两道浅痕 →</button></div>
          <p v-if="!opened" class="stage-prompt">包纸挡了灰。先把它展开。</p>
          <span class="stage-credit">原创虚构物件 · 不是馆藏红军碗</span>
        </div></div>

      </div>
    <p class="bowl-understage" aria-live="polite">{{ feedback }}</p>
</div>
    <InvestigationRail class="bowl-notebook" :found="record.foundClueIds.length" :total="item.clues.length" :ready="allFound">
<template #notes>
          <div class="bowl-notes"><button v-for="clue in item.clues" :key="clue.id" type="button" :disabled="!found(clue.id)" @click="activeClueId = clue.id"><small>{{ found(clue.id) ? '已读 · 点击重看' : '等待观察' }}</small><strong>{{ found(clue.id) ? clue.title : '还有一段话没有读到' }}</strong></button></div>


</template>
<template #caption><section v-if="allFound" class="bowl-caption inspection-synthesis"><div><span>FICTION / 写下虚构物件的展签</span><h2>把看见的写下，把不知道的留白</h2><p>请选择能被碗和包纸支持的记录。误读可以重新选择，不会扣除进度。</p></div><div class="bowl-options"><button v-for="(caption, index) in captions" :key="caption" type="button" :aria-pressed="selectedCaption === index" @click="selectedCaption = index; if (index !== 0) feedback = index === 1 ? '两道痕迹不是两位确定使用者的证明。' : '嘱咐不等于已经发生的交还。'">{{ caption }}</button><button v-if="!cloudSaved" class="bowl-save" type="button" :disabled="(!record.evidenceVerified && selectedCaption === null) || saving" @click="record.evidenceVerified ? retrySave() : saveStory()">{{ saving ? '正在核对云端…' : record.evidenceVerified ? '重新连接并保存故事 →' : '保存有边界的展签 →' }}</button><strong v-else class="bowl-saved">故事已保存到账号 · 真实史料另在独立展柜</strong></div></section>
</template>
</InvestigationRail>

    <div v-if="activeClue" class="bowl-scrim" @click.self="activeClueId = null"><article class="bowl-story" role="dialog" aria-modal="true" :aria-label="activeClue.title"><button class="bowl-close" type="button" @click="activeClueId = null">关闭 ×</button><span>虚构故事 · 碗边的一段话</span><h2>{{ activeClue.title }}</h2><p>{{ activeClue.description }}</p><div class="detail-row"><img :src="activeClue.id === 'bowl-rim' ? rimDetail : activeClue.id === 'bowl-marks' ? baseDetail : activeClue.id === 'bowl-paper' ? paperBack : paperFront" alt="原创物件局部示意"><small>原创虚构物件的观察图，不是真实馆藏照片。</small></div><details><summary>它仍不能告诉我们什么？</summary><p>{{ boundaries[activeClue.id] }}</p></details><button class="bowl-done" type="button" @click="activeClueId = null">收进手账 →</button></article></div>
  </section>
</template>

<style scoped>
.bowl-investigation{font-family:var(--font-sans);color:#eee7d8}.bowl-worktop{border:1px solid #676656;background:#1e251f}.bowl-toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:7px;padding:12px 15px;border-bottom:1px solid #555d51}.bowl-toolbar span,.bowl-notebook>span,.bowl-caption span,.bowl-story>span{margin-right:auto;color:#d8b783;font-size:12px;font-weight:700;letter-spacing:.07em}.bowl-toolbar button{padding:9px 11px;border:1px solid #6d6c57;background:#30392f;color:#f4e9d4;font:600 13px var(--font-sans);cursor:pointer}.bowl-toolbar button:hover,.bowl-toolbar button[aria-pressed=true]{border-color:#e1b97d;background:#695740}.bowl-toolbar button:disabled{opacity:.45;cursor:not-allowed}.bowl-content{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(310px,.8fr)}.bowl-stage{position:relative;min-height:565px;overflow:hidden;background:radial-gradient(ellipse at 50% 50%,#535745,#313b30 62%,#1f291f);border-right:1px solid #576050}.bowl-stage:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,#fff1 0 1px,transparent 1px 48px),repeating-linear-gradient(90deg,#fff1 0 1px,transparent 1px 48px);opacity:.14}.paper{position:absolute;left:8%;top:11%;width:84%;height:75%;transform:rotate(-4deg);transition:transform .4s}.opened .paper{transform:translate(-8%,5%) rotate(-9deg)}.paper img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(8px 17px 10px #1119)}.paper-writing{position:absolute;top:39%;left:22%;width:61%;margin:0;color:#4e3825;font:700 clamp(16px,1.5vw,24px)/1.6 var(--font-display);transform:rotate(3deg)}.bowl-main{position:absolute;left:24%;top:8%;width:52%;height:76%;object-fit:contain;filter:drop-shadow(10px 23px 14px #111c);transition:transform .4s,top .4s,left .4s,opacity .4s}.opened .bowl-main{top:5%;transform:translateY(-5%)}.turned .bowl-main{transform:translateY(-5%) rotate(10deg)}.base-shown .bowl-main{transform:translateY(-5%) rotate(0deg)}.paper-turned .bowl-main{left:50%;top:22%;width:40%;height:60%}.bowl-light{position:absolute;inset:0;background:linear-gradient(110deg,transparent 26%,#f6d59d35 52%,transparent 75%);pointer-events:none}.rim-spot{position:absolute;z-index:2;right:15%;top:19%;padding:9px 11px;border:1px solid #f2d6a8;background:#243028e8;color:#fff0d4;cursor:pointer}.base-sweep{position:absolute;z-index:3;left:16%;right:16%;bottom:10%;display:flex;align-items:center;gap:12px;padding:10px;background:#1c291fee;color:#f8e6cb}.base-sweep label{font-size:13px;white-space:nowrap}.base-sweep input{flex:1;accent-color:#c59a61}.base-sweep button{border:1px solid #caa269;background:#775532;color:#fff1dc;padding:8px;cursor:pointer}.stage-prompt{position:absolute;left:4%;bottom:6%;padding:10px 14px;background:#ede1cb;color:#3a3024;font-weight:700}.stage-credit{position:absolute;top:12px;left:16px;color:#faeacb;font-size:12px}.bowl-notebook{display:flex;flex-direction:column;padding:22px 24px;background:#293329}.bowl-notebook h2,.bowl-caption h2{margin:6px 0;font:700 26px/1.35 var(--font-display)}.bowl-question{margin:0 0 18px;color:#f3d5a6;font-size:16px;font-weight:700;line-height:1.6}.bowl-notes{display:grid;gap:8px}.bowl-notes button{min-height:69px;padding:9px 12px;text-align:left;border:1px solid #74745e;background:#3b4539;color:#fff1d9;cursor:pointer}.bowl-notes button:disabled{opacity:.6;cursor:default}.bowl-notes button:not(:disabled):hover{border-color:#e8bb7a}.bowl-notes small{display:block;color:#e1c495;font-size:12px}.bowl-notes strong{display:block;margin-top:3px;font-size:15px}.bowl-feedback{margin:auto 0 11px;padding-top:16px;color:#f3ddbb;font-size:14px;line-height:1.6}.bowl-notebook>small{color:#d8bb8e}.bowl-caption{display:grid;grid-template-columns:.8fr 1.2fr;gap:28px;padding:22px 26px;border:1px solid #676656;border-top:0;background:#2c352b}.bowl-caption p{margin:7px 0;color:#ded3c1;font-size:15px;line-height:1.6}.bowl-options{display:grid;gap:7px}.bowl-options button{padding:11px 13px;text-align:left;border:1px solid #807a62;background:#41493b;color:#f7e9d3;font:500 14px/1.55 var(--font-sans);cursor:pointer}.bowl-options button:hover,.bowl-options button[aria-pressed=true]{border-color:#ebba7a;background:#635339}.bowl-options .bowl-save{background:#855734;border-color:#c59559;font-weight:700;text-align:center}.bowl-options button:disabled{opacity:.5;cursor:not-allowed}.bowl-saved{color:#f3cf9b;font-size:14px}.bowl-scrim{position:fixed;z-index:80;inset:0;display:grid;place-items:center;padding:20px;background:#081008d9}.bowl-story{width:min(590px,100%);max-height:90vh;overflow:auto;padding:23px 28px;background:#efe3ce;color:#302b23;border:1px solid #b99461;box-shadow:0 25px 80px #0009}.bowl-story>span{color:#875c32}.bowl-story h2{margin:10px 0;font:700 29px/1.3 var(--font-display)}.bowl-story>p{font-size:17px;line-height:1.7}.bowl-close{float:right;border:0;background:transparent;color:#713f2a;cursor:pointer}.detail-row{display:flex;align-items:center;gap:15px;border-top:1px solid #c8b995;border-bottom:1px solid #c8b995}.detail-row img{width:105px;height:100px;object-fit:contain}.detail-row small{color:#655440;font-size:13px}.bowl-story details{padding:13px 0;color:#5b4a37;font-size:14px;line-height:1.6}.bowl-story summary{font-weight:700;cursor:pointer}.bowl-done{padding:10px 16px;border:0;background:#885b37;color:#fff3e3;cursor:pointer}@media(max-width:1050px){.bowl-content,.bowl-caption{grid-template-columns:1fr}.bowl-stage{border-right:0;border-bottom:1px solid #576050}.bowl-notebook{min-height:370px}}
.paper-turned .bowl-main{opacity:0;pointer-events:none}
</style>
