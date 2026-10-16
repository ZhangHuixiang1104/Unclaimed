import { archiveObjects } from './objects'

export type ArchiveMaterial = 'paper' | 'map' | 'metal' | 'fiber' | 'enamel'

export interface HomeArchivePreview {
  key: string
  index: string
  shortTitle: string
  teaser: string
  detail: string
  material: ArchiveMaterial
  accent: string
  silhouette: string
}

const previewCopy: Record<string, Pick<HomeArchivePreview, 'shortTitle' | 'teaser' | 'detail' | 'material'>> = {
  list: {
    shortTitle: '人员补录名单',
    teaser: '姓名栏被水浸毁',
    detail: '反复展开的纸页上，还留着无法辨认的书写压力。',
    material: 'paper',
  },
  map: {
    shortTitle: '折叠行军图',
    teaser: '终点没有标注',
    detail: '四层墨迹彼此覆盖，旧路线没有被彻底擦去。',
    material: 'map',
  },
  battery: {
    shortTitle: '电台电池盒',
    teaser: '仍残留一次呼叫',
    detail: '接线处被三层布条反复加固，数字含义未知。',
    material: 'metal',
  },
  shoes: {
    shortTitle: '草鞋残件',
    teaser: '鞋底留下两种泥土',
    detail: '两只鞋的尺寸、补料与主要受力区域并不相同。',
    material: 'fiber',
  },
  bowl: {
    shortTitle: '搪瓷碗残片',
    teaser: '碗沿刻痕并非姓名',
    detail: '两个方向不同的刻痕，都不足以指向一个名字。',
    material: 'enamel',
  },
}

export const homeArchivePreviews: HomeArchivePreview[] = archiveObjects.map((item) => ({
  key: item.key,
  index: String(item.order).padStart(2, '0'),
  accent: item.accent,
  silhouette: item.silhouette,
  ...previewCopy[item.key],
}))

