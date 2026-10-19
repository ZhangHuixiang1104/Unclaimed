<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps<{ archived: boolean; visitedStationIds: string[] }>()
const emit = defineEmits<{ archive: []; visit: [index: number] }>()

type ExhibitImage = { src: string; alt: string; label: string; caption: string; credit: string }
const researchPreview = import.meta.env.DEV
const researchImage = (key: string) => `/__research/list-history/${key}`
type ExhibitStation = {
  year: string
  label: string
  title: string
  lead: string
  context: string
  material: string
  limit: string
  sourceTitle: string
  sourceUrl: string
  images: ExhibitImage[]
}

const stations: ExhibitStation[] = [
  {
    year: '1935 · 伤后', label: '有人接住他们', title: '七名伤员，走进山里',
    lead: '土城战役后，七位负伤红军辗转来到四面山一带，在当地人的帮助下隐蔽养伤。',
    context: '公开走访报道根据手迹和当地调查，梳理了温水、飞鸽、洪海的转送经过，以及唐树田家、金龙寺与石岩寨之间的照护。',
    material: '现场照片帮助辨认报道中的地点；它记录的是后来的场所面貌。',
    limit: '现代现场照片不能单独证明1935年每一次转送的细节。',
    sourceTitle: '重庆日报记者实地走访（2018）',
    sourceUrl: 'https://dangshi.people.com.cn/n1/2018/0823/c85037-30247089.html',
    images: [
      { src: researchImage('temple'), alt: '金龙寺相关场所的现代照片', label: '金龙寺今景', caption: '九凤山金龙寺相关场所今景，并非1935年现场照片。', credit: '图片来源：重庆日报实地走访报道（2018）' },
      { src: researchImage('bridge'), alt: '四面山红军桥的现代照片', label: '红军桥今景', caption: '四面山红军桥今景，并非1935年搭桥现场影像。', credit: '图片来源：江津融媒体中心报道（2025）' },
    ],
  },
  {
    year: '1935 · 照护', label: '留下手迹', title: '六十多天，被写在纸上',
    lead: '手迹记录了唐树田父子等人对伤员的照护，也记录了离别时留下文字的缘由。',
    context: '资料记述了送米、送菜、送药与伤员治疗的经历。它不是游戏中的转送清单，而是一份有真实人物、地点和保存历程的文物。',
    material: '原件图能看到破损、墨迹和纸面形态；整理译文只能帮助阅读，不能替代原件校核。',
    limit: '照片不足以逐字确认全部释文；个别残缺字与馆藏信息仍待馆方复核。',
    sourceTitle: '江津融媒体中心手迹研究报道（2025）',
    sourceUrl: 'https://news.cqjjnet.com/web/aritcle/1365986817104867328/web/content_1365986817104867328.html',
    images: [
      { src: researchImage('original'), alt: '土城战役红军手迹原件图', label: '手迹原件', caption: '真实手迹原件图。与游戏虚构名单没有原件、续页或人物对应关系。', credit: '图片来源：江津融媒体中心报道（2025），重庆中国三峡博物馆供图' },
      { src: researchImage('translation'), alt: '媒体制作的手迹与整理译文对照图', label: '整理译文', caption: '媒体整理图，仅作辅助阅读；其中译文需与原件及正式释文对照。', credit: '图片来源：江津融媒体中心报道（2025）' },
    ],
  },
  {
    year: '1935—1943', label: '后来的一页', title: '有人归队，有人留下',
    lead: '报道记载，六名伤员伤愈后返回部队；吴贞和继续养伤。1943年的地址附页又为这段往事留下线索。',
    context: '2024年的采访追访了吴贞和的后人，并解释了地址附页与手迹如何一起被保存、研究。',
    material: '这里采用报道中的附页记载与后人访谈，不把游戏里的「回执另存」解释成这张真实附页。',
    limit: '现有材料不能替游戏中的两位虚构人物提供姓名、去向或结局。',
    sourceTitle: '重庆日报寻访报道（2024）',
    sourceUrl: 'https://cq.people.com.cn/n2/2024/0125/c367698-40725931.html',
    images: [],
  },
  {
    year: '2005—至今', label: '被保存下来', title: '这份记录重新被看见',
    lead: '手迹由唐家保存，后来被重新发现并捐赠入藏。研究者通过文物、文献与走访继续核对它。',
    context: '收藏证书与后续报道记录了文物进入公共收藏、被持续研究的过程；2024年的采访又接上了后人的记忆。',
    material: '证书图是收藏经过的材料线索，人物肖像是吴贞和相关报道图像。二者都不是游戏人物的证件。',
    limit: '报道中的收藏线索不能替代馆方藏品登记记录；日期和名称应以正式馆藏信息为准。',
    sourceTitle: '重庆日报寻访报道（2024）',
    sourceUrl: 'https://cq.people.com.cn/n2/2024/0125/c367698-40725931.html',
    images: [{ src: researchImage('collection'), alt: '吴贞和肖像与重庆中国三峡博物馆收藏证书的资料图', label: '收藏线索', caption: '肖像与收藏证书的资料合成图，说明后续寻访和收藏线索。', credit: '图片来源：重庆日报寻访报道（2024）' }],
  },
]

const activeIndex = ref(0)
const imageIndex = ref(0)
const zoomed = ref(false)
const visited = computed(() => new Set(stations.map((_, index) => index).filter((index) => props.archived || props.visitedStationIds.includes(`list-history-0${index + 1}`))))
const active = computed(() => stations[activeIndex.value]!)
const activeImage = computed(() => active.value.images[imageIndex.value])
const allVisited = computed(() => visited.value.size === stations.length)
const nextUnread = computed(() => stations.findIndex((_, index) => !visited.value.has(index)))

const selectStation = (index: number) => {
  activeIndex.value = index
  imageIndex.value = 0
  zoomed.value = false
  emit('visit', index)
}
onMounted(() => emit('visit', 0))
</script>

<template>
  <section class="list-history-exhibit" aria-labelledby="list-history-title">
    <div class="list-history-back"><RouterLink to="/object/list">← 回看虚构名单</RouterLink><span>REAL HISTORY / 01</span></div>
    <header class="list-history-cover">
      <div class="history-cover-copy">
        <span class="history-real-tag">真实史料 · 独立展柜</span>
        <h1 id="list-history-title">七名伤员，<br><em>六十余天的照护。</em></h1>
        <p>土城战役后，他们辗转到四面山。乡亲们的照护被留在一份真实手迹里，也留给后来的人继续核对。</p>
      </div>
      <div class="history-boundary-ticket" aria-label="虚构与史实边界">
        <div><small>游戏中的名单 / 虚构</small><strong>转三与“另存回执”</strong><span>不替虚构人物补写姓名与结局。</span></div>
        <b aria-hidden="true">≠</b>
        <div><small>土城战役红军手迹 / 史实</small><strong>伤员与照护者的真实记录</strong><span>以下人物、地点与来源独立核对。</span></div>
      </div>
    </header>

    <div class="history-exhibit-head"><div><span>史实档案 · 四段记录</span><h2>从照护，到手迹的保存</h2></div></div>
    <nav class="history-station-nav" aria-label="史实材料目录">
      <button v-for="(station, index) in stations" :key="station.year" type="button" :class="{ active: activeIndex === index, visited: visited.has(index) }" :aria-current="activeIndex === index ? 'step' : undefined" @click="selectStation(index)">
        <small>{{ String(index + 1).padStart(2, '0') }} / {{ station.year }}</small><strong>{{ station.label }}</strong>
      </button>
    </nav>

    <article class="history-exhibit-stage" :key="activeIndex">
      <div class="history-exhibit-visual">
        <template v-if="activeImage && researchPreview">
          <div class="history-image-frame" :class="{ zoomed }">
            <img :src="activeImage.src" :alt="activeImage.alt" />
          </div>
          <div class="history-image-actions">
            <button type="button" :aria-pressed="zoomed" @click="zoomed = !zoomed">{{ zoomed ? '收回局部' : '放大看材料' }}</button>
            <button v-for="(picture, index) in active.images" v-if="active.images.length > 1" :key="picture.src" type="button" :aria-pressed="imageIndex === index" @click="imageIndex = index; zoomed = false">{{ picture.label }}</button>
          </div>
          <p class="history-image-caption">{{ activeImage.caption }}<br><small>{{ activeImage.credit }}</small></p>
        </template>
        <div v-else class="history-text-evidence">
          <span>{{ active.year }} / {{ active.label }}</span>
          <strong>{{ activeImage ? activeImage.label : '地址附页与后人寻访' }}</strong>
          <p>{{ activeImage ? activeImage.caption : '1943年的地址附页与后人的回忆，让这段照护经历有了更多可追寻的线索。' }}</p>
          <span class="history-text-source">相关记载见右侧原始报道</span>
        </div>
      </div>
      <div class="history-exhibit-reading">
        <span class="history-exhibit-count">档案 {{ String(activeIndex + 1).padStart(2, '0') }} / {{ String(stations.length).padStart(2, '0') }}</span>
        <h3>{{ active.title }}</h3>
        <p class="history-exhibit-lead">{{ active.lead }}</p>
        <div class="history-exhibit-narrative"><strong>事情的经过</strong><p class="history-exhibit-context">{{ active.context }}</p></div>
        <div class="history-evidence-note"><div><strong>材料所见</strong><p>{{ active.material }}</p></div><div><strong>不能由此推断</strong><p>{{ active.limit }}</p></div></div>
        <div class="history-stage-actions">
          <a class="history-source-link" :href="active.sourceUrl" target="_blank" rel="noopener noreferrer">核对来源：{{ active.sourceTitle }} ↗</a>
          <button v-if="activeIndex < stations.length - 1" type="button" @click="selectStation(activeIndex + 1)">继续读下一份 →</button>
          <a v-else href="#history-complete">前往建档 →</a>
        </div>
      </div>
    </article>

    <footer id="history-complete" class="history-exhibit-end">
      <div><span>读完之后</span><h2>真实的人有记录；<br>虚构的人，不借他们的名字。</h2><p>史实回应的是“有人照护、有人记录”，不是游戏名单的谜底。</p></div>
      <div class="history-exhibit-actions"><span>{{ visited.size }} / {{ stations.length }} 处材料已翻阅</span><button v-if="!archived && !allVisited" type="button" @click="selectStation(nextUnread)">继续翻阅下一份材料 →</button><button v-else-if="!archived" type="button" @click="emit('archive')">完成史实阅读，建立档案 →</button><RouterLink v-else to="/archive?focus=map">本章已归档，接收下一件 →</RouterLink></div>
    </footer>
  </section>
</template>

<style scoped>
.list-history-exhibit { --type-note: 12px; --type-body: 14px; --type-lead: 16px; --type-heading: 24px; max-width: 1450px; margin: 0 auto; color: #e9e1d1; font-family: var(--font-sans); text-rendering: optimizeLegibility; }
.list-history-back { display: flex; justify-content: space-between; padding: 10px 0 19px; color: #b9ab97; border-bottom: 1px solid rgba(211,194,159,.2); font-size: var(--type-body); }
.list-history-back a { color: #e2a698; }
.list-history-back span { color: #b9ab97; font-size: var(--type-note); font-weight: 700; letter-spacing: .12em; }
.list-history-cover { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(330px, .7fr); gap: 38px; align-items: center; padding: 34px 0 30px; }
.history-real-tag { display: inline-block; padding: 7px 10px; color: #211b18; background: #d7b7a2; font-size: var(--type-note); font-weight: 700; letter-spacing: .09em; }
.history-cover-copy h1 { margin: 16px 0 13px; color: #f4ead8; font: 700 clamp(40px, 3.5vw, 52px)/1.2 var(--font-display); letter-spacing: -.025em; }
.history-cover-copy h1 em { color: #d28b79; font-style: normal; }
.history-cover-copy p { max-width: 680px; margin: 0; color: #d0c7b7; font-size: var(--type-lead); line-height: 1.7; }
.history-boundary-ticket { display: grid; gap: 8px; padding: 20px 22px; border: 1px solid rgba(215,197,162,.35); background: #e8dfcf; color: #37312a; box-shadow: 0 18px 40px rgba(0,0,0,.16); }
.history-boundary-ticket > div { display: grid; gap: 3px; }
.history-boundary-ticket small { color: #8c5448; font-size: var(--type-note); font-weight: 700; }
.history-boundary-ticket strong { font-size: var(--type-lead); line-height: 1.4; }
.history-boundary-ticket span { color: #62594e; font-size: var(--type-body); line-height: 1.5; }
.history-boundary-ticket b { color: #a1685c; font-size: var(--type-heading); line-height: 1; }
.history-exhibit-head { display: flex; justify-content: space-between; gap: 25px; align-items: end; margin-bottom: 13px; }
.history-exhibit-head span, .history-exhibit-count { color: #d39788; font-size: var(--type-note); font-weight: 700; letter-spacing: .08em; }
.history-exhibit-head h2 { margin: 5px 0 0; color: #f1e8d8; font: 650 var(--type-heading)/1.35 var(--font-display); }
.history-exhibit-head p { max-width: 340px; margin: 0; color: #c3c1b8; font-size: var(--type-body); line-height: 1.6; }
.history-station-nav { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
.history-station-nav button { min-height: 79px; display: grid; grid-template-columns: 1fr auto; align-content: center; gap: 5px 9px; padding: 10px 14px; color: #d6cdbc; border: 1px solid rgba(208,190,157,.24); border-top: 3px solid rgba(208,190,157,.24); background: #1c211b; text-align: left; cursor: pointer; transition: border-color .2s, transform .2s, background .2s; }
.history-station-nav button:hover { border-color: #bd8071; transform: translateY(-3px); }
.history-station-nav button.active { color: #28231f; border-color: #b86656; background: #e9deca; }
.history-station-nav small { color: #c79d90; font-size: var(--type-note); }
.history-station-nav strong { grid-column: 1; font-size: var(--type-lead); }
.history-station-nav span { grid-column: 2; grid-row: 1 / 3; align-self: center; color: #c0bdb0; font-size: var(--type-note); }
.history-station-nav button.active small, .history-station-nav button.active span { color: #7a4b41; }
.history-exhibit-stage { display: grid; grid-template-columns: minmax(0, 1.07fr) minmax(370px, .93fr); min-height: 455px; margin-top: 9px; border: 1px solid rgba(205,185,153,.26); background: #e9e0cf; color: #332f29; animation: exhibit-enter .25s ease both; }
.history-exhibit-visual { min-width: 0; padding: 18px; background: #d9cebb; }
.history-image-frame { height: 335px; display: grid; place-items: center; overflow: auto; border: 1px solid rgba(64,50,35,.2); background: #bbb1a0; }
.history-image-frame img { max-width: 100%; max-height: 100%; object-fit: contain; transition: transform .25s ease; }
.history-image-frame.zoomed { display: block; }
.history-image-frame.zoomed img { display: block; max-width: none; max-height: none; width: 145%; margin: 0; transform: none; }
.history-image-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.history-image-actions button { min-height: 36px; padding: 6px 12px; border: 1px solid #9e8270; color: #5b352e; background: rgba(255,255,255,.23); font-size: var(--type-body); font-weight: 700; cursor: pointer; }
.history-image-actions button[aria-pressed='true'] { color: #f7ead6; background: #753d33; border-color: #753d33; }
.history-image-caption { margin: 11px 0 0; color: #4f483e; font-size: var(--type-body); line-height: 1.55; }
.history-image-caption small { color: #6e5045; font-size: var(--type-note); }
.history-text-evidence { height: 100%; min-height: 335px; display: flex; flex-direction: column; justify-content: center; padding: 36px; border: 1px solid rgba(64,50,35,.22); background: repeating-linear-gradient(0deg, rgba(96,77,53,.06) 0 1px, transparent 1px 32px), #eee5d3; }
.history-text-evidence span { color: #854e43; font-size: var(--type-note); font-weight: 700; letter-spacing: .06em; }
.history-text-evidence strong { display: block; margin: 20px 0 10px; font: 600 var(--type-heading)/1.4 var(--font-display); }
.history-text-evidence p { max-width: 480px; margin: 0; color: #4c443a; font-size: var(--type-lead); line-height: 1.7; }
.history-text-evidence .history-text-source { margin-top: 20px; padding-top: 13px; border-top: 1px solid rgba(91,70,50,.22); font-size: var(--type-note); }
.history-exhibit-reading { display: flex; flex-direction: column; align-items: start; padding: 25px 30px; }
.history-exhibit-count { color: #8c5045; }
.history-exhibit-reading h3 { margin: 11px 0 9px; font: 700 var(--type-heading)/1.35 var(--font-display); }
.history-exhibit-lead { margin: 0 0 12px; color: #34302a; font-size: var(--type-lead); font-weight: 650; line-height: 1.65; }
.history-exhibit-narrative { width: 100%; padding: 13px 16px; border-left: 3px solid #a15646; background: #f3ead8; }
.history-exhibit-narrative strong { color: #824236; font-size: var(--type-body); }
.history-exhibit-context { margin: 5px 0 0; color: #443c33; font-size: var(--type-body); line-height: 1.65; }
.history-evidence-note { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 14px; padding: 10px 0; border-top: 1px solid rgba(91,70,50,.2); }
.history-evidence-note strong { color: #823f36; font-size: var(--type-body); }
.history-evidence-note p { margin: 4px 0 0; color: #453d34; font-size: var(--type-body); line-height: 1.55; }
.history-stage-actions { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: auto; padding-top: 12px; }
.history-source-link { color: #7e3b32; font-size: var(--type-body); font-weight: 700; text-decoration: underline; text-underline-offset: 4px; }
.history-stage-actions > button, .history-stage-actions > a:last-child:not(:first-child) { flex: 0 0 auto; padding: 9px 12px; color: #f5ead7; border: 1px solid #793c32; background: #793c32; font-size: var(--type-body); font-weight: 700; text-decoration: none; cursor: pointer; }
.history-stage-actions > button:hover, .history-stage-actions > a:last-child:not(:first-child):hover { background: #95493d; }
.history-exhibit-end { display: flex; justify-content: space-between; gap: 25px; align-items: center; margin-top: 12px; padding: 22px 25px; border: 1px solid rgba(211,194,159,.27); background: #222720; scroll-margin-top: 90px; }
.history-exhibit-end > div:first-child { max-width: 700px; }
.history-exhibit-end span { color: #d59d8d; font-size: var(--type-note); font-weight: 700; }
.history-exhibit-end h2 { margin: 6px 0; color: #f2e8d7; font: 600 var(--type-heading)/1.4 var(--font-display); }
.history-exhibit-end p { margin: 0; color: #c2c0b3; font-size: var(--type-body); line-height: 1.6; }
.history-exhibit-actions { min-width: 270px; display: grid; gap: 11px; justify-items: stretch; }
.history-exhibit-actions button, .history-exhibit-actions a { min-height: 45px; display: grid; place-items: center; padding: 9px 18px; color: #f4e9d7; border: 1px solid #a45b4e; background: #793c32; font-size: var(--type-body); font-weight: 700; text-align: center; cursor: pointer; }
.history-exhibit-actions button:hover, .history-exhibit-actions a:hover { background: #95493d; }
@keyframes exhibit-enter { from { opacity: .4; transform: translateY(5px); } }
@media (max-width: 1050px) { .list-history-cover, .history-exhibit-stage { grid-template-columns: 1fr; } .history-station-nav { grid-template-columns: repeat(2, 1fr); } .history-exhibit-end { align-items: stretch; flex-direction: column; } }
@media (prefers-reduced-motion: reduce) { .history-exhibit-stage { animation: none; } .history-station-nav button, .history-image-frame img { transition: none; } }

/* Editorial exhibit rhythm shared with the map chapter: one paper spread, no nested cards. */
.list-history-exhibit { --type-note: var(--history-caption); --type-body: var(--history-body); --type-lead: var(--history-lead); --type-heading: var(--history-section); }
.history-real-tag { padding: 0; color: #dc9985; background: none; }
.history-cover-copy h1 { font-size: var(--history-display); }
.list-history-cover { gap: 26px; padding: 23px 0 20px; }
.history-cover-copy h1 { margin: 9px 0 8px; line-height: 1.13; }
.history-cover-copy p { font: 400 16px/1.6 var(--font-sans); }
.history-boundary-ticket { display: flex; align-items: center; gap: 14px; padding: 7px 0 7px 18px; border: 0; border-left: 2px solid #aa6757; background: transparent; color: #e9e0d0; box-shadow: none; }
.history-boundary-ticket > div { flex: 1; }
.history-boundary-ticket small { color: #d39a87; }
.history-boundary-ticket strong { font: 650 var(--history-body)/1.45 var(--font-sans); }
.history-boundary-ticket span { color: #c7bba9; font-size: var(--history-caption); }
.history-boundary-ticket b { color: #b27968; font-size: var(--history-section); }
.history-exhibit-head { margin-bottom: 8px; }
.history-exhibit-head h2 { font-size: var(--history-section); }
.history-station-nav { gap: 0; border-bottom: 1px solid rgba(208,190,157,.35); }
.history-station-nav button { min-height: 56px; display: flex; flex-direction: column; align-items: start; justify-content: center; gap: 3px; padding: 6px 14px 8px; border: 0; border-bottom: 2px solid transparent; background: transparent; transition: color .2s, border-color .2s; }
.history-station-nav button:hover { border-color: #ad6b5c; transform: none; }
.history-station-nav button.active { border: 0; border-bottom: 2px solid #dc907b; background: transparent; color: #f5e9d7; }
.history-station-nav small,.history-station-nav button.active small { color: #ca9a86; font: 600 var(--history-caption)/1.3 var(--font-mono); letter-spacing: .02em; }
.history-station-nav strong { font: 650 var(--history-body)/1.35 var(--font-sans); }
.history-exhibit-stage { min-height: 420px; margin-top: 6px; border-color: rgba(205,185,153,.18); }
.history-exhibit-visual { padding: 14px; }
.history-image-frame { height: 305px; }
.history-exhibit-reading { padding: 19px 24px; }
.history-exhibit-reading h3 { margin: 6px 0 7px; font-size: var(--history-heading); line-height: 1.22; }
.history-exhibit-count { font: 600 var(--history-caption)/1.3 var(--font-mono); letter-spacing: .04em; }
.history-exhibit-lead { margin-bottom: 9px; font: 700 var(--history-lead)/1.48 var(--font-sans); }
.history-exhibit-narrative { padding: 3px 0 0; border: 0; background: transparent; }
.history-exhibit-narrative strong,.history-evidence-note strong { font: 700 var(--history-caption) var(--font-sans); }
.history-exhibit-context,.history-evidence-note p { font-size: var(--history-body); line-height: 1.7; }
.history-evidence-note { gap: 24px; margin-top: 11px; padding-top: 11px; }
.history-image-frame,.history-text-evidence { border: 0; }
.history-image-actions button { padding: 5px 3px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: #684b3f; font-size: var(--history-button); }
.history-image-actions button[aria-pressed='true'] { border: 0; border-bottom: 2px solid #8b493d; background: transparent; color: #753d33; }
.history-image-caption { font-size: var(--history-caption); }
.history-exhibit-end { padding: 16px 0; border: 0; border-top: 1px solid rgba(211,194,159,.3); background: transparent; }
.history-exhibit-end h2 { font-size: var(--history-section); }
.history-exhibit-end p { font-size: var(--history-body); }
.history-stage-actions > button,.history-stage-actions > a:last-child:not(:first-child),.history-exhibit-actions button,.history-exhibit-actions a { font-size: var(--history-button); }
</style>
