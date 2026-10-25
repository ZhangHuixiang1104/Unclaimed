<script setup lang="ts">
import HistoryReader from './HistoryReader.vue'
import type { HistoryStationData } from './readerTypes'
import { historyRecords } from '../../data/historyRecords'
import { historyResearchImages } from '../../data/historyResearchImages'
import communicationVisual from '../../../../stuffs/电池盒/史实视觉/history-communication-chain.svg'
import repairVisual from '../../../../stuffs/电池盒/史实视觉/history-repair-material.svg'
import carryVisual from '../../../../stuffs/电池盒/史实视觉/history-generator-carry.svg'
import memoryVisual from '../../../../stuffs/电池盒/史实视觉/history-museum-memory.svg'


const researchImages = [{'key': 'radio', 'caption': '王诤1955年肖像 · 人物背景资料，非维修现场照片'}, {'key': 'generator', 'caption': '手摇发电机原件 · 军事博物馆，中国国防报配图；非蔡威维修的旧电瓶'}, {'key': 'generator', 'caption': '手摇发电机原件 · 军事博物馆，中国国防报配图；非游戏电池盒'}, {'key': 'memory', 'caption': '中国文明网馆藏主题海报 · 后来传播资料，非重逢现场照片'}]

const props = defineProps<{ archived: boolean; visitedStationIds: string[] }>()
const emit = defineEmits<{ visit: [index: number]; archive: [] }>()
const stations = [
  {
    short: '让电波有去处', title: '无线电靠一群人维护',
    lead: '报务员、收发设备、能源和修理者，共同支撑信息传递。',
    detail: '中国军网梳理了红军电台与通信材料厂的工作。具体电源配置因设备和时期而不同，不能把每一部电台都画成接着游戏里的盒子。',
    boundary: '玩家刚才检查的电池盒、短笺与空栏全部为虚构；它不是任何真实电台的已知配件。',
    image: communicationVisual, alt: '原创通信保障关系示意，不是某一型电台的线路图',
    source: '中国军网《红军的第一部电台》（2016）', url: 'https://photo.81.cn/zhuanti/2016-09/23/content_7273348_4.htm',
  },
  {
    short: '坏了还能修', title: '让有限器材多一次机会',
    lead: '公开报道记载，蔡威曾利用废铅重做旧电瓶的铅板。',
    detail: '这是红四方面军通信保障的事例。中国军网另引王诤回忆，记载中央红军长征时携带的器材零件大幅减少。两则材料属于不同人物与范围，不是同一台机器的维修履历。',
    boundary: '蔡威没有被证明修过玩家的虚构盒，也不能被写成谢宝金所守护发电机的维修者。',
    image: repairVisual, alt: '原创旧零件、维修、继续使用三阶段示意',
    source: '人民网《蔡威：为何称他“手中有雄兵百万”》（2022）', url: 'https://dangshi.people.com.cn/n1/2022/0104/c436975-32323284.html',
  },
  {
    short: '把机器带着走', title: '68公斤，是发电机的重量',
    lead: '据公开报道，谢宝金和战友守护手摇发电机，越雪山、过草地。',
    detail: '中国国防报的报道记述，这台手摇发电机重68公斤，曾经多人抬运，后来又经历肩扛与草地拖行。这里讲的是器材与人的携行，不给游戏盒子套用真实重量。',
    boundary: '报道中的手摇发电机是独立的真实文物；本章电池盒不是它的缩小模型或原件。',
    image: carryVisual, alt: '原创68公斤重量与抬、背、拖携行方式示意，非当年现场图',
    source: '中国国防报报道，人民网刊载（2026）', url: 'https://cpc.people.com.cn/n1/2026/0614/c443712-40739888.html',
  },
  {
    short: '后来仍被记住', title: '机器留在馆里，记忆留在人心里',
    lead: '据家属采访，谢宝金多年后在军事博物馆重见手摇发电机。',
    detail: '央视网2016年的采访记录了谢林贵的回忆；后来报道也记述这件馆藏。不同采访对动作和引语有不同版本，因此这里保留可核的经过，不拼出一张并不存在的重逢照片。',
    boundary: '真实发电机后来有报道与馆藏记录；游戏盒盖内的“试用结果”依然空白。',
    image: memoryVisual, alt: '原创当代展柜和采访记忆示意，不是重逢现场照片',
    source: '央视网采访谢林贵（2016）', url: 'https://news.cctv.com/2016/09/10/ARTI99Jy7rfn7m2R5Exc9GmD160910.shtml',
  },
] as const

const photoCredits = ["王诤1955年肖像资料", "军事博物馆 · 中国国防报配图", "军事博物馆 · 中国国防报配图", "中国文明网"]
const materials: HistoryStationData[] = stations.map((station, index) => ({
  label: station.short, period: undefined, title: station.title, lead: station.lead,
  detail: station.detail, boundary: station.boundary, source: station.source, sourceUrl: station.url,
  figures: [{ id: `battery-${index}`, label: '资料图版', src: station.image, alt: station.alt,
    caption: '据公开报道编绘 · 原创示意，非历史照片或馆藏原件。', credit: '原创史实视觉',
    researchSrc: historyResearchImages.battery[researchImages[index]!.key as keyof typeof historyResearchImages.battery],
    researchAlt: researchImages[index]!.caption, researchCaption: researchImages[index]!.caption, researchCredit: photoCredits[index],
  }],
}))
</script>

<template>
  <HistoryReader chapter-key="battery" title="电波背后的通信保障" summary="收发、维修与携行，共同支撑着长征中的信息传递。" :chapter-boundary="historyRecords.battery!.boundary" :stations="materials" :archived="archived" :visited-station-ids="visitedStationIds" next-key="shoes" @visit="emit('visit', $event)" @archive="emit('archive')" />
</template>
