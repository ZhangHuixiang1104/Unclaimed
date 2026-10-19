import { archiveObjects } from './objects'

export type ArchiveMaterial = 'paper' | 'map' | 'metal' | 'fiber' | 'vessel'

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
    shortTitle: '受雨名单',
    teaser: '姓名栏残缺',
    detail: '纸面有一项尚待核对的转送记录。',
    material: 'paper',
  },
  map: {
    shortTitle: '折叠行军图',
    teaser: '四层墨线叠在一起',
    detail: '路线反复修改，绘制先后仍待辨认。',
    material: 'map',
  },
  battery: {
    shortTitle: '布缠电池盒',
    teaser: '接线端修了又修',
    detail: '三层布条与外壳刻痕留下不同疑问。',
    material: 'metal',
  },
  shoes: {
    shortTitle: '草鞋残件',
    teaser: '两只鞋似乎不成双',
    detail: '尺寸、磨损与补料都值得重新比较。',
    material: 'fiber',
  },
  bowl: {
    shortTitle: '双刻痕饭碗',
    teaser: '碗底留着两种记号',
    detail: '最后一件物品仍在封存，先完成前面的档案。',
    material: 'vessel',
  },
}

export const homeArchivePreviews: HomeArchivePreview[] = archiveObjects.map((item) => ({
  key: item.key,
  index: String(item.order).padStart(2, '0'),
  accent: item.accent,
  silhouette: item.silhouette,
  ...previewCopy[item.key],
}))

