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
    teaser: '旧带被留在新带下面',
    detail: '盖内写着“到了干处再试”，结果栏仍空着。',
    material: 'metal',
  },
  shoes: {
    shortTitle: '不成双的草鞋',
    teaser: '被登记作“一双”',
    detail: '长短、补编与磨损各不相同；不要急着认定原来的主人。',
    material: 'fiber',
  },
  bowl: {
    shortTitle: '包起的旧碗',
    teaser: '一件东西被仔细包住',
    detail: '修补与包裹留在碗上，曾经的使用者与后来的去向仍待分辨。',
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

