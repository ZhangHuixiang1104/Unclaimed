<script setup lang="ts">
import HistoryReader from './HistoryReader.vue'
import type { HistoryStationData } from './readerTypes'
import { historyRecords } from '../../data/historyRecords'
import { historyResearchImages } from '../../data/historyResearchImages'
import passage from '../../../../stuffs/饭碗/史实视觉/history-bowl-01.svg'
import care from '../../../../stuffs/饭碗/史实视觉/history-bowl-02.svg'
import gift from '../../../../stuffs/饭碗/史实视觉/history-bowl-03.svg'
import keeping from '../../../../stuffs/饭碗/史实视觉/history-bowl-04.svg'


const researchImages = [{'key': 'street', 'caption': '仁化城口镇红军街今景 · 新华社；非1934年现场'}, {'key': 'detail', 'caption': '红军碗实物特写 · 南方+；非照料伤员现场'}, {'key': 'detail', 'caption': '红军碗实物特写 · 南方+；非赠碗现场'}, {'key': 'display', 'caption': '红军碗现代展柜 · 红军长征粤北纪念馆，新华社'}]

const props = defineProps<{ archived: boolean; visitedStationIds: string[]; saving?: boolean; saveError?: string }>()
const emit = defineEmits<{ visit: [index: number]; archive: [] }>()
const stations = [
  { title: '队伍经过仁化', short: '经过', year: '1934', lead: '长征队伍经过粤北仁化，一段关于碗的故事留在了半山村。', detail: '据公开报道，中央红军经过仁化城口一带。队伍继续向前，也有伤员暂时走不动。这里讲述的是半山村那只真实瓷碗的来历，不是玩家小图上的路线。', boundary: '报道没有给游戏五件物品一条共同的真实行军路线。', image: passage, source: '光明日报（2019）', url: 'https://epaper.gmw.cn/gmrb/html/2019-06/26/nw.D110000gmrb_20190626_3-06.htm' },
  { title: '一家人照料伤员', short: '照料', year: '1934', lead: '蒙家财、黄乙秀夫妇收留并照顾受伤的徐排长。', detail: '据报道，韩连长率队先走，徐排长留在蒙家养伤。蒙家财上山采药，黄乙秀煮饭、烧水、清洗衣物。史实最先有分量的不是碗，而是有人让伤者能够留下。', boundary: '公开报道对养伤时间口径不同，此处不写精确天数；游戏旧碗也没有对应这户人家。', image: care, source: '光明日报（2019）', url: 'https://epaper.gmw.cn/gmrb/html/2019-06/26/nw.D110000gmrb_20190626_3-06.htm' },
  { title: '临别留下一只碗', short: '赠碗', year: '伤势好转后', lead: '徐排长将曾用于吃饭、饮药的瓷碗留给蒙家，表达感谢。', detail: '公开报道还记下了胜利后再来的许诺。不同报道的直接引语并不完全一致；这里转述其意思，不冒充可逐字核对的现场原话。赠碗是发生过的行动，承诺后来是否实现则要另看记录。', boundary: '真实瓷碗不是游戏里有两道浅痕的修补碗；“再来”也不能写成已经兑现。', image: gift, source: '光明日报（2019）', url: 'https://epaper.gmw.cn/gmrb/html/2019-06/26/nw.D110000gmrb_20190626_3-06.htm' },
  { title: '五代人没有丢下它', short: '守护', year: '2019 → 2026', lead: '徐排长没有再回来，蒙家五代人保存了这只碗。', detail: '据报道，蒙家后人张堂英于2019年将碗捐给仁化县史志办公室；新华社2026年报道碗移至红军长征粤北纪念馆展出。保存下来的并非一个圆满结局，而是一个家族没有丢掉的记忆。', boundary: '公开材料没有说明徐排长的完整姓名与最终去向。“未再回来”不等于能断定其死亡。', image: keeping, source: '新华社（2026）', url: 'https://www.news.cn/20260917/976e90392e504a5db5e6f1a32a4b7526/c.html' },
] as const

const photoCredits = ["新华社", "南方+", "南方+", "新华社 · 红军长征粤北纪念馆"]
const materials: HistoryStationData[] = stations.map((station, index) => ({
  label: station.short, period: station.year, title: station.title, lead: station.lead,
  detail: station.detail, boundary: station.boundary, source: station.source, sourceUrl: station.url,
  figures: [{ id: `bowl-${index}`, label: '资料图版', src: station.image, alt: '据公开报道编绘的原创史实示意',
    caption: '据公开报道编绘 · 原创示意，非历史照片或馆藏原件。', credit: '原创史实视觉',
    researchSrc: historyResearchImages.bowl[researchImages[index]!.key as keyof typeof historyResearchImages.bowl],
    researchAlt: researchImages[index]!.caption, researchCaption: researchImages[index]!.caption, researchCredit: photoCredits[index],
  }],
}))
</script>

<template>
  <HistoryReader chapter-key="bowl" title="仁化红军碗的守护" summary="被照顾、被赠予、被家族保存，后来又被留给更多人看见。" :chapter-boundary="historyRecords.bowl!.boundary" :stations="materials" :archived="archived" :visited-station-ids="visitedStationIds" :saving="saving" :save-error="saveError" @visit="emit('visit', $event)" @archive="emit('archive')" />
</template>
