<script setup lang="ts">
import HistoryReader from './HistoryReader.vue'
import type { HistoryStationData } from './readerTypes'
import { historyRecords } from '../../data/historyRecords'
import { historyResearchImages } from '../../data/historyResearchImages'

const props = defineProps<{ archived: boolean; visitedStationIds: string[] }>()
const emit = defineEmits<{ archive: []; visit: [index: number] }>()

type ExhibitImage = { src: string; alt: string; label: string; caption: string; credit: string }
const researchImage = (key: keyof typeof historyResearchImages.list) => historyResearchImages.list[key]
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

const materials: HistoryStationData[] = stations.map((station, index) => ({
  label: station.label, period: station.year, title: station.title, lead: station.lead,
  detail: station.context, material: station.material, boundary: station.limit,
  source: station.sourceTitle, sourceUrl: station.sourceUrl,
  figures: station.images.map((picture, imageIndex) => ({
    id: `list-${index}-${imageIndex}`, label: picture.label, alt: picture.alt,
    caption: picture.caption, researchCaption: picture.caption, researchCredit: picture.credit, researchSrc: picture.src,
  })),
}))
</script>

<template>
  <HistoryReader chapter-key="list" title="七名伤员的照护记录" summary="土城战役后的照护，留在一份真实手迹里，也留给后来的人继续核对。" :chapter-boundary="historyRecords.list!.boundary" :stations="materials" :archived="archived" :visited-station-ids="visitedStationIds" next-key="map" @visit="emit('visit', $event)" @archive="emit('archive')" />
</template>
