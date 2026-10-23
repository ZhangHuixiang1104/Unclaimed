<script setup lang="ts">
import HistoryReader from './HistoryReader.vue'
import type { HistoryStationData } from './readerTypes'
import { historyRecords } from '../../data/historyRecords'
import supplyVisual from '../../../../stuffs/草鞋/史实视觉/history-shoe-supply.svg'
import yuduVisual from '../../../../stuffs/草鞋/史实视觉/history-yudu-departure.svg'
import wearingVisual from '../../../../stuffs/草鞋/史实视觉/history-two-wearings.svg'
import memoryVisual from '../../../../stuffs/草鞋/史实视觉/history-memory-exhibit.svg'


const researchImages = [{'key': 'display', 'caption': '绣球草鞋现代展柜 · 央视；供给背景参考，非1934年制鞋现场'}, {'key': 'detail', 'caption': '绣球草鞋黑白特写 · 中国军网；非赠鞋现场照片'}, {'key': 'portrait', 'caption': '谢志坚肖像与草鞋 · 央视2026年报道资料；非渡河现场'}, {'key': 'label', 'caption': '绣球草鞋与说明牌 · 中青在线，当代展陈资料'}]

const props = defineProps<{ archived: boolean; visitedStationIds: string[] }>()
const emit = defineEmits<{ visit: [index: number]; archive: [] }>()
const stations = [
  {
    short: '把鞋送上路', title: '鞋不是小事',
    lead: '出发前，一双双草鞋由人赶制，再随人走上漫长道路。',
    detail: '央视网报道，1934 年中央红军从于都出发前，于都群众夜以继日赶制草鞋。文中“20 多万双”是该报道给出的于都口径，不等于整个长征的消耗总量。',
    boundary: '游戏里那两只无名旧鞋不在真实供给统计之内。它们的修补细节都是原创设定。',
    image: supplyVisual, alt: '原创草鞋编织、供给与携行关系示意图，非历史照片',
    source: '央视网《一双草鞋丈量信仰》（2026）', url: 'https://news.cctv.com/2026/10/21/ARTI10MD7EZiTOlYTFaDZnyx261019.shtml',
  },
  {
    short: '于都的一双', title: '春秀把鞋交给谢志坚',
    lead: '据公开报道，出发前，春秀以亲手编织的黄麻草鞋送行。',
    detail: '于都县政府的文史介绍记载，1934 年 10 月中央红军将从于都出发，春秀为谢志坚编鞋相赠。鞋在这里先是日常穿戴，也是一个人对另一个人能够继续走下去的牵挂。',
    boundary: '这是有姓名的真实报道；游戏里两只不相配的鞋没有谢志坚或春秀的身份。',
    image: yuduVisual, alt: '原创于都河畔送鞋意象示意图，非当年场景照片',
    source: '于都县政府《一双绣球草鞋》（2024）', url: 'https://www.yudu.gov.cn/yudu/ydrw/202407/5145dce6d37c4875a07fa364de8e6c5f.shtml',
  },
  {
    short: '只穿过两次', title: '珍惜到舍不得穿',
    lead: '于都县政府和央视网的报道，都记下了“只穿过两次”。',
    detail: '报道说，谢志坚在金沙江、大渡河相关行动中各穿过一次这双鞋。后来他因病在甘肃滞留；新中国成立后回到于都，才得知春秀已经去世。这里转述的是后来公开报道，不是当日行军日志。',
    boundary: '真实草鞋的珍惜与保存，不能从游戏鞋底的磨损推算；游戏鞋也不对应这两次穿用。',
    image: wearingVisual, alt: '原创两处渡河时间节点示意，不是行军路线图',
    source: '于都县政府《一双绣球草鞋》（2024）', url: 'https://www.yudu.gov.cn/yudu/ydrw/202407/5145dce6d37c4875a07fa364de8e6c5f.shtml',
  },
  {
    short: '留在展柜里', title: '后来，鞋尖有了红绣球',
    lead: '于都县政府记载：谢志坚在上世纪 80 年代系上红心绣球后捐赠草鞋。',
    detail: '这双黄麻草鞋长 26.0 厘米、宽 8.5 厘米。关于红绣球何时系上，个别报道存在不同叙述；本页按于都县政府的文物介绍标明出处，不把争议抹成无出处的定论。',
    boundary: '红绣球只属于这件真实文物的报道与展陈。游戏鞋没有绣球，也不是它的翻拍或修补版。',
    image: memoryVisual, alt: '原创红绣球草鞋展陈意象，非馆藏原件照片或精确复制',
    source: '于都县政府《一双绣球草鞋》（2024）', url: 'https://www.yudu.gov.cn/yudu/ydrw/202407/5145dce6d37c4875a07fa364de8e6c5f.shtml',
  },
] as const


const photoCredits = ["央视", "中国军网", "央视（2026）", "中青在线"]
const materials: HistoryStationData[] = stations.map((station, index) => ({
  label: station.short, period: undefined, title: station.title, lead: station.lead,
  detail: station.detail, boundary: station.boundary, source: station.source, sourceUrl: station.url,
  figures: [{ id: `shoes-${index}`, label: '资料图版', src: station.image, alt: station.alt,
    caption: '据公开报道编绘 · 原创示意，非历史照片或馆藏原件。', credit: '原创史实视觉',
    researchSrc: `/__research/shoes-history/${researchImages[index]!.key}`,
    researchAlt: researchImages[index]!.caption, researchCaption: researchImages[index]!.caption, researchCredit: photoCredits[index],
  }],
}))
</script>

<template>
  <HistoryReader chapter-key="shoes" title="一双绣球草鞋的记忆" summary="从于都送行到后来的保存，一双有来源的草鞋留下独立的经历。" :chapter-boundary="historyRecords.shoes!.boundary" :stations="materials" :archived="archived" :visited-station-ids="visitedStationIds" next-key="bowl" @visit="emit('visit', $event)" @archive="emit('archive')" />
</template>
