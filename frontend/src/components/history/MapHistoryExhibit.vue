<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import phaseDiagram from '../../../../stuffs/行军图/史实视觉/history-phase-diagram.svg'
import mapReportCard from '../../../../stuffs/行军图/史实视觉/history-map-report-card.svg'
import crossingConditions from '../../../../stuffs/行军图/史实视觉/history-crossing-conditions.svg'
import boatmenCard from '../../../../stuffs/行军图/史实视觉/history-boatmen-card.svg'

const props = defineProps<{ archived: boolean; visitedStationIds: string[] }>()
const emit = defineEmits<{ visit: [index: number]; archive: [] }>()
const stations = [
  { period: '1935 · 1—3月', short: '路线转向', title: '四渡赤水，不是一条直线', lead: '中央红军在1935年1月至3月四次渡过赤水河，随后南渡乌江、进入云南。', detail: '每次渡河都有自己的时间和地点。把这段历史压成一条平滑箭头，会遮住行动中持续变化的判断。', limit: '真实的“四渡”不是游戏小图的四层笔迹；两者不能一一对应。', image: phaseDiagram, imageAlt: '原创历史阶段关系示意图，呈现四渡赤水、南渡乌江、入滇与金沙江的时间关系', source: '湖南省工信厅党史大事记', url: 'https://gxt.hunan.gov.cn/gxt/syzt/dsxxjy/dsydyy/dsdsj/202103/t20210329_15075565.html' },
  { period: '1935 · 4月', short: '地图资料', title: '先要知道路在哪里', lead: '公开报道记载，红军于1935年4月27日在曲靖关下村截获一批云南军用地图。', detail: '三元宫如今陈列着相关地图副本。它提示了当时辨认道路与渡口所需的资料，不能被当成1935年现场拍摄的原件照片。', limit: '这批真实地图不是玩家手中的无名河谷小图；陈列副本也不是1935年原件。', image: mapReportCard, imageAlt: '原创关下村地图报道材料卡，不是历史地图原件', source: '人民日报采访报道（2019）', url: 'https://dangshi.people.com.cn/n1/2019/0725/c85037-31254648.html' },
  { period: '1935 · 金沙江', short: '渡口条件', title: '到了岸边，也未必能过江', lead: '龙街渡、洪门渡与皎平渡的渡江条件并不相同，部队根据水流、船只和敌情调整安排。', detail: '洪门渡曾有部分人员渡过；把它简单写成“完全不能渡”也会抹掉真实经过。最后的主力渡江安排集中到皎平渡。', limit: '这张条件对照图不表达精确方位或距离；游戏北滩和下滩不是真实渡口。', image: crossingConditions, imageAlt: '原创三个渡口条件对照图，不是测绘路线地图', source: '新华社军事地理解读（2026）', url: 'https://www.news.cn/20260917/12f46b49a5914e54a7952bf1d52bb326/c.html' },
  { period: '1935 · 皎平渡', short: '摆渡的人', title: '把线接到对岸的，是人', lead: '在皎平渡，当地船工与木船参与接续摆渡，让渡江行动得以推进。', detail: '公开报道记下船工的协作，也记下不同的船数、人数和历时口径；这里先呈现能够核对的经过，不用未经核齐的数字制造戏剧性。', limit: '真实船工不是虚构小图里的探路者；游戏纸上未写完的“江北”仍然留白。', image: boatmenCard, imageAlt: '原创皎平渡船工报道材料卡，不是船工肖像或名单墙照片', source: '新华社军事地理解读（2026）', url: 'https://www.news.cn/20260917/12f46b49a5914e54a7952bf1d52bb326/c.html' },
]
const historyMoments = [
  { focus: '四次渡河，是随局势变化作出的连续调整。', moments: [
    { date: '1月29日', title: '一渡赤水', body: '土城战斗后，中央红军从土城、猿猴场一带西渡赤水河，向川南转移。' },
    { date: '2月18—21日', title: '折回黔北', body: '部队再次东渡赤水河；2月28日重入遵义。路线的折返不是事先画好的圆圈。' },
    { date: '3月16—22日', title: '第三、四次渡河', body: '两次渡河后，红军南渡乌江、进入云南。金沙江是接下来另一阶段的江河。' },
  ] },
  { focus: '4月27日获得的地图，改变了辨认云南地形的条件。', moments: [
    { date: '进入云南前', title: '缺少详细地图', body: '《人民日报》2019年走访报道称，红军当时主要依靠少数全省略图制定计划。' },
    { date: '4月27日', title: '关下村截获地图', body: '据同一报道，军委纵队先遣分队在曲靖关下村截获一批云南军用地图。' },
    { date: '今日三元宫', title: '陈列的是副本', body: '报道说三元宫陈列有相关地图副本；展陈照片不能直接认作1935年使用的地图原件。' },
  ] },
  { focus: '地图指出渡口，却不能替人备好船。', moments: [
    { date: '4月29日', title: '发出速渡指示', body: '新华社2026年报道援引中革军委指示，记录了迅速渡过金沙江的部署。' },
    { date: '龙街渡', title: '北岸设防、船只受损', body: '报道记载，红军在此遇到北岸防守，船只难寻，架设浮桥也未成功。' },
    { date: '洪门渡', title: '有人渡过，主力改道', body: '此处曾有部队用小船渡江，但船只不足、浮桥受阻，主力后来改往皎平渡。' },
  ] },
  { focus: '最后完成渡江的，不只是一条路线。', moments: [
    { date: '5月2日夜', title: '找到船，也找到船工', body: '新华社2026年报道记载，先遣队抵达皎平渡后找到木船，并联络当地船工。' },
    { date: '5月3日起', title: '接续摆渡', body: '江段水深流急，部队依靠木船和船工连续摆渡；船的数量在公开资料中存在不同说法。' },
    { date: '后来被记住', title: '名字进入展陈', body: '报道提及37名船工参与摆渡。今天的名单展板是后来的纪念材料，不是1935年的现场合影。' },
  ] },
] as const
// Research photographs stay outside the production bundle. Local development
// previews are for editorial review until their image rights are cleared.
const researchPreview = import.meta.env.DEV
const researchPhotos = [
  null,
  { key: 'museumMap', label: '三元宫地图陈列', alt: '三元宫展陈地图的现代照片，纸面有地形线与地名', caption: '三元宫地图展陈的现代照片；不能据此认定图中纸张就是1935年缴获的原件。' },
  { key: 'longjieToday', label: '龙街渡今景', alt: '龙街渡附近金沙江江面与两岸山地的现代航拍照片', caption: '龙街渡附近江面的现代航拍；今景不能说明1935年当日的水位与渡江条件。' },
  { key: 'boatmenDisplay', label: '船工名单展板', alt: '杉乐纪念馆皎平渡船工姓名与部分人物照片的现代展板', caption: '杉乐纪念馆的现代船工名单展板；红星不是人物肖像，也不是1935年现场拍摄的名单。' },
] as const
const activeIndex = ref(0)
const active = computed(() => stations[activeIndex.value]!)
const activeMoments = computed(() => historyMoments[activeIndex.value]!)
const activeMomentIndex = ref(0)
const activeMoment = computed(() => activeMoments.value.moments[activeMomentIndex.value]!)
const imageExpanded = ref(false)
const researchPhotoAvailable = ref(true)
const activeResearch = computed(() => researchPreview && researchPhotoAvailable.value ? researchPhotos[activeIndex.value] : null)
const showResearchPhoto = ref(false)
const researchPhotoUrl = computed(() => activeResearch.value ? `/__research/map-history/${activeResearch.value.key}` : '')
const visited = computed(() => new Set(stations.map((_, index) => index).filter((index) => props.archived || props.visitedStationIds.includes(`map-history-0${index + 1}`))))
const allVisited = computed(() => visited.value.size === stations.length)
const nextUnread = computed(() => stations.findIndex((_, index) => !visited.value.has(index)))
const select = (index: number, scrollToStage = false) => {
  activeIndex.value = index
  activeMomentIndex.value = 0
  imageExpanded.value = false
  researchPhotoAvailable.value = true
  showResearchPhoto.value = researchPreview && Boolean(researchPhotos[index])
  emit('visit', index)
  if (scrollToStage) void nextTick(() => document.getElementById('map-history-stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}
const closeExpandedImage = (event: KeyboardEvent) => {
  if (event.key === 'Escape') imageExpanded.value = false
}
onMounted(() => {
  emit('visit', 0)
  window.addEventListener('keydown', closeExpandedImage)
})
onUnmounted(() => window.removeEventListener('keydown', closeExpandedImage))
</script>

<template>
  <section class="map-history-exhibit">
    <div class="map-history-top"><RouterLink to="/object/map">← 回看虚构行军图</RouterLink><span>REAL HISTORY / 02</span></div>
    <header class="map-history-cover">
      <div class="map-history-intro"><span class="map-history-tag">真实史料 · 独立展柜</span><h1>地图上有线，<br><em>过江还需要人。</em></h1><p>从赤水的往返，到金沙江的摆渡。路线在消息、地形与人的协作中不断调整。</p></div>
      <aside class="map-history-index-card" aria-label="1935年史实脉络与叙事边界">
        <span class="map-history-index-label">1935 / 路线档案</span>
        <div class="map-history-index-dates"><div><b>1—3月</b><span>四渡赤水</span></div><div><b>4月27日</b><span>曲靖获地图</span></div><div><b>5月初</b><span>金沙江摆渡</span></div></div>
        <p><strong>游戏小图 ≠ 真实历史地图。</strong>以下材料独立记录真实时间、地点与人物，不补写游戏队伍的结局。</p>
      </aside>
    </header>
    <div class="map-history-navigation"><div><span>史实阅读 / 四站</span><h2>路线如何形成</h2></div><nav aria-label="史实材料四站"><button v-for="(station, index) in stations" :key="station.short" type="button" :class="{ active: activeIndex === index, visited: visited.has(index) }" @click="select(index)"><small>{{ String(index + 1).padStart(2, '0') }} · {{ station.period }}</small><strong>{{ station.short }}</strong></button></nav></div>
    <article id="map-history-stage" :key="activeIndex" class="map-history-stage"><div class="map-history-visual">
      <div v-if="activeResearch" class="map-history-image-switch" aria-label="材料图版切换">
        <button type="button" :aria-pressed="showResearchPhoto" @click="showResearchPhoto = true">资料照片 · {{ activeResearch.label }}</button>
        <button type="button" :aria-pressed="!showResearchPhoto" @click="showResearchPhoto = false">原创示意图</button>
      </div>
      <button class="map-history-image-frame" type="button" @click="imageExpanded = true" :aria-label="`放大查看${showResearchPhoto && activeResearch ? activeResearch.label : active.short}图版`"><img v-if="showResearchPhoto && activeResearch" :src="researchPhotoUrl" :alt="activeResearch.alt" @error="researchPhotoAvailable = false; showResearchPhoto = false"/><img v-else :src="active.image" :alt="active.imageAlt"/><span>点击放大图版 ↗</span></button>
      <p v-if="showResearchPhoto && activeResearch" class="map-history-image-caption">{{ activeResearch.caption }}</p>
      <p v-else class="map-history-image-caption">原创后制示意／材料卡，非历史照片或档案原件。</p>
    </div><div class="map-history-reading"><span class="map-history-number">史实材料 {{ String(activeIndex + 1).padStart(2, '0') }} / 04</span><h2>{{ active.title }}</h2><div class="map-history-focus"><small>关键史实</small><strong>{{ active.lead }}</strong></div><p class="map-history-detail">{{ active.detail }}</p><div class="map-history-limit"><strong>虚构与史实的边界</strong><p>{{ active.limit }}</p></div><a class="map-history-source" :href="active.url" target="_blank" rel="noopener noreferrer">核对来源：{{ active.source }} ↗</a></div></article>
    <section id="map-history-moments" class="map-history-moments" aria-label="本段史实经过"><div class="map-history-moments-heading"><span>史实经过 / {{ String(activeIndex + 1).padStart(2, '0') }}</span><h3>{{ active.short }}</h3></div><div class="map-history-moment-tabs"><button v-for="(moment, index) in activeMoments.moments" :key="moment.title" type="button" :aria-pressed="activeMomentIndex === index" @click="activeMomentIndex = index"><small>{{ moment.date }}</small><strong>{{ moment.title }}</strong></button></div><div class="map-history-moment-detail" aria-live="polite"><span>{{ activeMoment.date }} · {{ activeMoment.title }}</span><p>{{ activeMoment.body }}</p><div class="map-history-moment-actions"><a :href="active.url" target="_blank" rel="noopener noreferrer">查看报道依据 ↗</a><button v-if="activeIndex < 3" type="button" @click="select(activeIndex + 1, true)">继续下一站 →</button><a v-else class="map-history-moment-next" href="#map-history-end">前往建档 ↓</a></div></div></section>
    <footer id="map-history-end" class="map-history-end"><div><span>阅读终点</span><h2>真实的皎平渡有可考的历史；<br>游戏小图的江北，仍然留白。</h2><p>路线并非事后那一条平滑的箭头。地图、消息、地形和摆渡的人，共同决定行进能否继续。</p></div><div><small>{{ visited.size }} / 4 站已翻阅</small><button v-if="!archived && !allVisited" type="button" @click="select(nextUnread, true)">继续翻阅未读材料 →</button><button v-else-if="!archived" type="button" @click="emit('archive')">完成史实阅读，建立档案 →</button><RouterLink v-else to="/archive?focus=battery">本章已归档，接收下一件 →</RouterLink></div></footer>
    <div v-if="imageExpanded" class="map-history-lightbox" role="dialog" aria-modal="true" aria-label="放大查看史实图版" @click.self="imageExpanded = false"><div><button type="button" @click="imageExpanded = false">关闭图版 ×</button><img v-if="showResearchPhoto && activeResearch" :src="researchPhotoUrl" :alt="activeResearch.alt"/><img v-else :src="active.image" :alt="active.imageAlt"/></div></div>
  </section>
</template>

<style scoped>
.map-history-exhibit{max-width:1510px;margin:auto;color:#eee6d5;font-family:var(--font-sans)}.map-history-top{display:flex;justify-content:space-between;padding:9px 0 18px;border-bottom:1px solid #635f50;color:#d8baa1;font-size:13px}.map-history-top a{color:#e7aa95}.map-history-cover{display:grid;grid-template-columns:1.12fr .88fr;gap:38px;align-items:center;padding:35px 0 33px}.map-history-tag{display:inline-block;padding:7px 12px;color:#2b201e;background:#dfb59e;font-size:12px;font-weight:700}.map-history-cover h1{margin:16px 0 15px;font:700 clamp(38px,3.5vw,56px)/1.2 var(--font-display)}.map-history-cover h1 em{color:#d18e7a;font-style:normal}.map-history-cover p{max-width:750px;color:#d2caba;font-size:16px;line-height:1.7}.map-history-cover aside{padding:23px 27px;border:1px solid #7d6b56;background:#eee2ce;color:#342b24}.map-history-cover aside small{color:#904d3f;font-size:12px;font-weight:700}.map-history-cover aside strong{display:block;margin:10px 0;font:700 22px var(--font-display)}.map-history-cover aside p{margin:0;color:#4f443b;font-size:14px}.map-history-navigation>div{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:13px}.map-history-navigation>div span{color:#d08f7b;font-size:12px}.map-history-navigation h2{margin:0;font:600 23px var(--font-display)}.map-history-navigation nav{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.map-history-navigation button{min-height:88px;display:grid;gap:4px;padding:10px 14px;text-align:left;border:1px solid #6b6755;border-top:3px solid #6b6755;color:#eee5d1;background:#222920;cursor:pointer}.map-history-navigation button.active{border-color:#af6652;color:#32261f;background:#eadfcb}.map-history-navigation button:hover{border-color:#d58e78}.map-history-navigation small,.map-history-navigation nav span{font-size:11px;color:#c6927f}.map-history-navigation strong{font-size:16px}.map-history-navigation button.active small,.map-history-navigation button.active span{color:#854d3c}.map-history-stage{display:grid;grid-template-columns:1.15fr .85fr;gap:0;margin-top:11px;border:1px solid #706b58;background:#eee3cf;color:#302b25}.map-history-visual{display:grid;align-content:center;gap:10px;min-width:0;padding:18px;background:#d5cbb9}.map-history-visual img{display:block;width:100%;max-height:590px;object-fit:contain;box-shadow:0 12px 30px #655a4b55}.map-history-visual p{margin:0;color:#544b3f;font-size:12px;line-height:1.5}.map-history-reading{display:flex;flex-direction:column;align-items:start;gap:12px;padding:25px 30px}.map-history-reading>span{color:#88483c;font-size:12px;font-weight:700}.map-history-reading h2{margin:0;font:700 30px/1.3 var(--font-display)}.map-history-reading p{margin:0;font-size:14px;line-height:1.75}.map-history-reading .map-history-lead{font-size:17px;font-weight:650}.map-history-limit{width:100%;padding:13px 16px;border-left:3px solid #a55245;background:#f5ebd8}.map-history-limit strong{color:#854439;font-size:13px}.map-history-reading>a{color:#823e34;font-size:14px;font-weight:700;text-decoration:underline}.map-history-reading>button,.map-history-reading>a:last-child:not(:first-child){margin-top:auto;padding:10px 16px;border:1px solid #8d493d;color:#f6e9d5;background:#8d493d;font-size:14px;font-weight:700;text-decoration:none;cursor:pointer}.map-history-end{display:flex;justify-content:space-between;gap:30px;align-items:center;margin-top:14px;padding:23px 28px;border:1px solid #716955;background:#222820;scroll-margin-top:90px}.map-history-end span{color:#d2927e;font-size:12px}.map-history-end h2{margin:8px 0;font:600 24px/1.4 var(--font-display)}.map-history-end p{max-width:680px;margin:0;color:#d4c9b6;font-size:14px;line-height:1.6}.map-history-end>div:last-child{display:grid;gap:12px;min-width:270px}.map-history-end small{color:#c6b89e;font-size:12px}.map-history-end button,.map-history-end a{padding:12px 15px;border:1px solid #b76d59;color:#f5e8d5;background:#874638;font-size:14px;font-weight:700;text-align:center;cursor:pointer}@media(max-width:1050px){.map-history-cover,.map-history-stage{grid-template-columns:1fr}.map-history-navigation nav{grid-template-columns:repeat(2,1fr)}}
.map-history-image-switch{display:flex;gap:8px;flex-wrap:wrap}.map-history-image-switch button{padding:8px 11px;border:1px solid #786e5d;background:#e7ddca;color:#423a31;font:600 13px var(--font-sans);cursor:pointer}.map-history-image-switch button[aria-pressed="true"]{border-color:#8d493d;background:#8d493d;color:#fff4e5}.map-history-image-frame{display:flex;min-height:350px;align-items:center;justify-content:center;background:#beb19c}.map-history-image-frame img{max-height:520px}.map-history-research-caption{padding:11px 13px;border-left:3px solid #9c4c40;background:#f0e4d0;font-size:13px!important}.map-history-research-caption strong{display:block;margin-bottom:4px;color:#8b4437}
.map-history-spine{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:0 0 24px;padding:16px 22px;border:1px solid #766955;background:#242b23}.map-history-spine>span{color:#e5a48d;font-size:12px;font-weight:700;letter-spacing:.08em}.map-history-spine strong{font:700 17px/1.25 var(--font-sans);color:#f1e6d4}.map-history-spine strong small{font-size:12px;font-weight:500;color:#cbbfac}.map-history-spine b{color:#b67d69;font:400 22px var(--font-sans)}
.map-history-focus{width:100%;padding:15px 18px;border-left:4px solid #a85445;background:#f8f0e2}.map-history-focus small{display:block;margin-bottom:7px;color:#8c4438;font-size:12px;font-weight:700}.map-history-focus strong{display:block;font:700 21px/1.45 var(--font-display);color:#352820}.map-history-reading .map-history-lead{font-size:16px}.map-history-reading .map-history-limit{margin-top:2px}
.map-history-moments{display:grid;grid-template-columns:230px 1fr 1.2fr;gap:18px;align-items:stretch;margin-top:12px;padding:17px;border:1px solid #6d6959;background:#222920}.map-history-moments-heading{padding:5px 10px}.map-history-moments-heading span{color:#d69a85;font-size:12px;font-weight:700}.map-history-moments-heading h3{margin:10px 0 7px;font:700 20px/1.35 var(--font-display)}.map-history-moments-heading p{margin:0;color:#c7baa6;font-size:13px;line-height:1.5}.map-history-moment-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.map-history-moment-tabs button{display:flex;flex-direction:column;justify-content:center;gap:8px;padding:13px 10px;border:1px solid #736a58;background:#30352d;color:#eee5d5;text-align:left;cursor:pointer}.map-history-moment-tabs button[aria-pressed="true"]{border-color:#ad6753;background:#eadcc6;color:#312820}.map-history-moment-tabs button small{color:#d99a82;font-size:12px}.map-history-moment-tabs button[aria-pressed="true"] small{color:#8d4638}.map-history-moment-tabs button strong{font-size:14px;line-height:1.35}.map-history-moment-detail{display:flex;flex-direction:column;justify-content:center;gap:9px;padding:16px 20px;background:#eadcc6;color:#342c24}.map-history-moment-detail span{color:#8b4437;font-size:12px;font-weight:700}.map-history-moment-detail p{margin:0;font-size:15px;font-weight:600;line-height:1.65}.map-history-moment-detail a{color:#803d33;font-size:12px;text-decoration:underline}@media(max-width:1250px){.map-history-moments{grid-template-columns:1fr 2fr}.map-history-moment-detail{grid-column:1/-1}}
.map-history-moments{scroll-margin-top:100px}.map-history-moment-detail button,.map-history-moment-detail .map-history-moment-next{align-self:flex-start;margin-top:3px;padding:8px 12px;border:1px solid #8d493d;background:#8d493d;color:#fff3e5;font:700 13px var(--font-sans);text-decoration:none;cursor:pointer}
.map-history-stage{scroll-margin-top:100px}

/* The visual and the historical sentence are the only major surfaces. */
.map-history-exhibit { font-size: var(--history-body); }
.map-history-tag { padding: 0; color: #dc9985; background: none; font-size: var(--history-caption); }
.map-history-cover { gap: 26px; padding: 23px 0 20px; }
.map-history-cover h1 { margin: 9px 0 8px; font-size: var(--history-display); line-height: 1.13; }
.map-history-cover p { font: 400 16px/1.6 var(--font-sans); }
.map-history-cover aside { padding: 7px 0 7px 18px; border: 0; border-left: 2px solid #aa6757; background: transparent; color: #e9e0d0; }
.map-history-cover aside small { color: #d39a87; }
.map-history-cover aside strong { font: 650 var(--history-body)/1.45 var(--font-sans); }
.map-history-cover aside p { color: #c7bba9; font-size: var(--history-caption); }
.map-history-spine { justify-content: start; gap: 20px; margin-bottom: 14px; padding: 0 0 11px; border: 0; border-bottom: 1px solid rgba(208,190,157,.3); background: transparent; }
.map-history-spine strong { font-size: var(--history-body); }
.map-history-spine strong small { font-size: var(--history-caption); }
.map-history-navigation h2 { font-size: var(--history-section); }
.map-history-navigation nav { gap: 0; border-bottom: 1px solid rgba(208,190,157,.35); }
.map-history-navigation button { min-height: 56px; padding: 6px 14px 8px; border: 0; border-bottom: 2px solid transparent; background: transparent; }
.map-history-navigation button.active { border: 0; border-bottom: 2px solid #dc907b; background: transparent; color: #f5e9d7; }
.map-history-navigation button:hover { border-color: #ad6b5c; }
.map-history-navigation strong { font: 650 var(--history-body)/1.35 var(--font-sans); }
.map-history-navigation small,.map-history-navigation button.active small { color: #ca9a86; font: 600 var(--history-caption)/1.3 var(--font-mono); letter-spacing: .02em; }
.map-history-stage { min-height: 420px; margin-top: 6px; border-color: rgba(205,185,153,.18); }
.map-history-visual { padding: 14px; }
.map-history-reading { gap: 9px; padding: 19px 24px; }
.map-history-reading h2 { font-size: var(--history-heading); line-height: 1.22; }
.map-history-reading>span { font: 700 var(--history-caption)/1.3 var(--font-mono); letter-spacing: .04em; }
.map-history-reading p { font-size: var(--history-body); }
.map-history-reading .map-history-lead { font: 700 var(--history-lead)/1.48 var(--font-sans); }
.map-history-focus { padding: 2px 0 2px 15px; border-left-width: 3px; background: transparent; }
.map-history-focus small { font-size: var(--history-caption); }
.map-history-focus strong { font: 750 22px/1.4 var(--font-sans); color: #613a30; }
.map-history-limit { padding: 13px 0 0; border: 0; border-top: 1px solid rgba(91,70,50,.22); background: transparent; }
.map-history-limit strong { font-size: var(--history-caption); }
.map-history-image-switch button { padding: 6px 3px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: #604f43; font-size: var(--history-button); }
.map-history-image-switch button[aria-pressed="true"] { border: 0; border-bottom: 2px solid #8b493d; background: transparent; color: #753d33; }
.map-history-image-frame { background: transparent; }
.map-history-visual p { font-size: var(--history-caption); }
.map-history-moments { gap: 16px; padding: 14px 0 0; border: 0; border-top: 1px solid rgba(208,190,157,.3); background: transparent; }
.map-history-moments-heading { padding: 0; }
.map-history-moments-heading h3 { font-size: var(--history-section); }
.map-history-moment-tabs { gap: 0; }
.map-history-moment-tabs button { padding: 11px 10px; border: 0; border-top: 2px solid rgba(208,190,157,.32); background: transparent; }
.map-history-moment-tabs button[aria-pressed="true"] { border: 0; border-top: 2px solid #dc907b; background: transparent; color: #f5e9d7; }
.map-history-moment-tabs button strong { font-size: var(--history-body); }
.map-history-moment-tabs button[aria-pressed="true"] small { color: #d99a82; }
.map-history-moment-detail { padding: 4px 0 4px 19px; border-left: 2px solid #a96755; background: transparent; color: #eee5d5; }
.map-history-moment-detail p { color: #eee5d5; font-size: var(--history-body); }
.map-history-moment-detail a { color: #df9e8d; font-size: var(--history-caption); }
.map-history-end { padding: 16px 0; border: 0; border-top: 1px solid rgba(208,190,157,.3); background: transparent; }
.map-history-end h2 { font-size: var(--history-section); }
.map-history-end p { font-size: var(--history-body); }
.map-history-reading>button,.map-history-reading>a:last-child:not(:first-child),.map-history-end button,.map-history-end a,.map-history-moment-detail button,.map-history-moment-detail .map-history-moment-next { font-size: var(--history-button); }

/* Three deliberate surfaces: index, source spread, and interactive chronology. */
.map-history-top { padding: 5px 0 13px; }
.map-history-cover { grid-template-columns: minmax(0,1.12fr) minmax(400px,.88fr); gap: 42px; padding: 23px 0 22px; }
.map-history-intro { align-self: center; }
.map-history-intro h1 { margin: 9px 0 10px; }
.map-history-intro p { max-width: 670px; }
.map-history-cover .map-history-index-card { align-self: center; padding: 19px 24px 17px; border: 1px solid #8b7760; background: #e7dcc8; color: #302b25; box-shadow: 5px 5px 0 rgba(0,0,0,.12); }
.map-history-index-label { display: block; color: #854638; font: 700 12px/1.35 var(--font-mono); letter-spacing: .06em; }
.map-history-index-dates { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 0; margin-top: 13px; }
.map-history-index-dates div { padding: 0 14px; border-left: 1px solid rgba(89,73,51,.24); }
.map-history-index-dates div:first-child { padding-left: 0; border-left: 0; }
.map-history-index-dates b { display: block; color: #302b25; font: 700 18px/1.25 var(--font-sans); }
.map-history-index-dates span { display: block; margin-top: 4px; color: #655749; font: 500 13px/1.4 var(--font-sans); }
.map-history-cover .map-history-index-card p { margin: 15px 0 0; padding-top: 11px; border-top: 1px solid rgba(89,73,51,.24); color: #5b4f43; font: 400 13px/1.55 var(--font-sans); }
.map-history-index-card p strong { color: #824336; font-weight: 750; }
.map-history-navigation > div { justify-content: flex-start; align-items: baseline; gap: 14px; margin-bottom: 7px; }
.map-history-navigation h2 { font: 700 22px/1.3 var(--font-display); }
.map-history-navigation button { min-height: 54px; }
.map-history-stage { grid-template-columns: minmax(0,1.08fr) minmax(410px,.92fr); min-height: 0; margin-top: 8px; border: 1px solid #a99b82; background: #eee3d0; box-shadow: 0 12px 28px rgba(0,0,0,.12); }
.map-history-visual { display: flex; flex-direction: column; justify-content: center; gap: 8px; padding: 14px; background: #d7cbb7; }
.map-history-image-switch { gap: 12px; }
.map-history-image-frame { position: relative; display: grid; place-items: center; width: 100%; height: 420px; min-height: 0; padding: 8px; overflow: hidden; border: 1px solid rgba(65,53,39,.25); background: #c7bba7; cursor: zoom-in; }
.map-history-image-frame img { display: block; width: 100%; height: 100%; max-height: none; object-fit: contain; box-shadow: none; }
.map-history-image-frame span { position: absolute; right: 12px; bottom: 12px; padding: 5px 9px; color: #f8efe2; background: rgba(34,34,28,.84); font: 700 12px/1.35 var(--font-sans); }
.map-history-image-frame:hover span,.map-history-image-frame:focus-visible span { background: #7d4337; }
.map-history-visual .map-history-image-caption { margin: 0; color: #554d42; font: 400 13px/1.45 var(--font-sans); }
.map-history-reading { display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start; gap: 10px; padding: 22px 27px 20px; }
.map-history-number { color: #854638; }
.map-history-reading h2 { margin: 0; color: #302b25; font: 700 30px/1.27 var(--font-display); }
.map-history-focus { margin: 0; padding: 12px 15px 13px; border: 0; border-left: 4px solid #9d5748; background: #f5e8d2; }
.map-history-focus small { margin: 0 0 4px; color: #8b483a; font: 700 12px/1.35 var(--font-sans); }
.map-history-focus strong { color: #493229; font: 750 21px/1.45 var(--font-sans); }
.map-history-reading p.map-history-detail { margin: 0; color: #3f3932; font: 400 15px/1.7 var(--font-sans); }
.map-history-limit { margin-top: 1px; padding: 10px 0 0; border-top: 1px solid rgba(93,73,51,.22); }
.map-history-limit strong { color: #854638; font: 700 12px/1.4 var(--font-sans); }
.map-history-limit p { margin: 4px 0 0; color: #5c5145; font: 400 14px/1.55 var(--font-sans); }
.map-history-reading > a.map-history-source:last-child { align-self: flex-start; margin: 0; padding: 0; border: 0; background: none; color: #783d32; font: 700 14px/1.5 var(--font-sans); text-decoration: underline; text-underline-offset: 3px; }
.map-history-moments { display: grid; grid-template-columns: minmax(0,1.08fr) minmax(410px,.92fr); gap: 0; margin-top: 14px; padding: 0; border: 1px solid #716b59; background: #252a22; }
.map-history-moments-heading { grid-column: 1/-1; display: flex; align-items: baseline; gap: 15px; padding: 10px 18px; border-bottom: 1px solid rgba(220,204,170,.2); }
.map-history-moments-heading h3 { margin: 0; color: #eee4d3; font: 700 19px/1.3 var(--font-display); }
.map-history-moment-tabs { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 0; padding: 13px 10px; }
.map-history-moment-tabs button { min-height: 101px; padding: 9px 12px; border: 0; border-left: 1px solid rgba(220,204,170,.2); background: transparent; color: #efe7d8; }
.map-history-moment-tabs button:first-child { border-left: 0; }
.map-history-moment-tabs button[aria-pressed='true'] { border: 0; border-left: 3px solid #d88c78; background: rgba(202,122,94,.13); color: #fff0db; }
.map-history-moment-tabs button strong { color: inherit; font: 700 15px/1.35 var(--font-sans); }
.map-history-moment-tabs button small,.map-history-moment-tabs button[aria-pressed='true'] small { color: #d7a18b; font: 600 12px/1.35 var(--font-sans); }
.map-history-moment-detail { display: flex; flex-direction: column; justify-content: center; gap: 7px; min-height: 130px; padding: 16px 22px; border: 0; border-left: 1px solid #bbaa8e; background: #e8ddc9; color: #382e27; }
.map-history-moment-detail span { color: #854638; font: 700 12px/1.35 var(--font-sans); }
.map-history-moment-detail p { margin: 0; color: #382e27; font: 650 16px/1.55 var(--font-sans); }
.map-history-moment-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 4px; }
.map-history-moment-actions a:not(.map-history-moment-next) { color: #7e4235; font: 700 13px/1.4 var(--font-sans); text-decoration: underline; }
.map-history-moment-detail .map-history-moment-actions button,.map-history-moment-detail .map-history-moment-actions .map-history-moment-next { align-self: auto; margin: 0; padding: 7px 11px; border: 1px solid #874b3e; background: #874b3e; color: #fff2df; font: 700 13px/1.3 var(--font-sans); white-space: nowrap; }
.map-history-end { margin-top: 12px; padding: 17px 0 4px; }
.map-history-end h2 { margin: 5px 0; font-size: 23px; }
.map-history-lightbox { position: fixed; z-index: 100; inset: 0; display: grid; place-items: center; padding: 26px; background: rgba(6,9,6,.88); }
.map-history-lightbox > div { display: grid; justify-items: end; gap: 10px; max-width: min(1200px,95vw); max-height: 94vh; }
.map-history-lightbox button { padding: 8px 12px; border: 1px solid #cbb99b; background: #282b24; color: #f2e8d8; cursor: pointer; }
.map-history-lightbox img { display: block; max-width: 100%; max-height: calc(94vh - 55px); object-fit: contain; }
@media (max-width: 1050px) {
  .map-history-cover,.map-history-stage,.map-history-moments { grid-template-columns: 1fr; }
  .map-history-moment-detail { border-left: 0; border-top: 1px solid #bbaa8e; }
  .map-history-image-frame { height: 360px; }
}
</style>
