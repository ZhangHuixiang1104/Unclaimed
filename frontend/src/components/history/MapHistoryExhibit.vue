<script setup lang="ts">
import HistoryReader from './HistoryReader.vue'
import type { HistoryStationData } from './readerTypes'
import { historyRecords } from '../../data/historyRecords'
import { historyResearchImages } from '../../data/historyResearchImages'
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
const researchPhotos = [
  null,
  { key: 'museumMap', label: '三元宫地图陈列', alt: '三元宫展陈地图的现代照片，纸面有地形线与地名', caption: '三元宫地图展陈的现代照片；不能据此认定图中纸张就是1935年缴获的原件。' },
  { key: 'longjieToday', label: '龙街渡今景', alt: '龙街渡附近金沙江江面与两岸山地的现代航拍照片', caption: '龙街渡附近江面的现代航拍；今景不能说明1935年当日的水位与渡江条件。' },
  { key: 'boatmenDisplay', label: '船工名单展板', alt: '杉乐纪念馆皎平渡船工姓名与部分人物照片的现代展板', caption: '杉乐纪念馆的现代船工名单展板；红星不是人物肖像，也不是1935年现场拍摄的名单。' },
] as const
const materials: HistoryStationData[] = stations.map((station, index) => {
  const photo = researchPhotos[index]
  const illustration = { id: `map-illustration-${index}`, label: '史实示意', src: station.image, alt: station.imageAlt, caption: '据公开报道编绘 · 原创示意，非历史照片或档案原件。', credit: '原创史实视觉' }
  return {
    label: station.short, period: station.period, title: station.title, lead: station.lead,
    detail: station.detail, boundary: station.limit, source: station.source, sourceUrl: station.url,
    moments: historyMoments[index]!.moments,
    figures: photo ? [{ ...illustration, id: `map-photo-${index}`, label: photo.label, researchSrc: historyResearchImages.map[photo.key], researchAlt: photo.alt, researchCaption: photo.caption, researchCredit: '报道配图 · 拍摄语境见图注' }, illustration] : [illustration],
  }
})
</script>

<template>
  <HistoryReader chapter-key="map" title="从赤水到金沙江" summary="路线在消息、地形与摆渡条件的变化中不断调整。" :chapter-boundary="historyRecords.map!.boundary" :stations="materials" :archived="archived" :visited-station-ids="visitedStationIds" next-key="battery" @visit="emit('visit', $event)" @archive="emit('archive')" />
</template>
