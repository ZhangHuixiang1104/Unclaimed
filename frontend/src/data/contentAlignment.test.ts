import { describe, expect, it } from 'vitest'
import { archiveObjects } from './objects'
import { historyRecords } from './historyRecords'
import { homeArchivePreviews } from './homeArchives'

describe('独立章节与史实边界', () => {
  it('五件物品按既定调查顺序并具备各自证据问题', () => {
    expect(archiveObjects.map((item) => item.key)).toEqual(['list', 'map', 'battery', 'shoes', 'bowl'])
    for (const item of archiveObjects) {
      expect(item.clues).toHaveLength(['map', 'battery', 'shoes', 'bowl'].includes(item.key) ? 4 : 3)
      expect(new Set(item.clues.map((clue) => clue.side))).toEqual(new Set(item.key === 'map' ? ['front'] : ['front', 'back']))
      expect(item.conclusions).toHaveLength(3)
      expect(item.screeningDecoys).toHaveLength(2)
      expect(new Set([...item.clues, ...item.conclusions, ...item.screeningDecoys].map((entry) => entry.id)).size).toBe(['map', 'battery', 'shoes', 'bowl'].includes(item.key) ? 9 : 8)
      expect(historyRecords[item.key]?.boundary).toBeTruthy()
    }
  })

  it('转三只属于名单章节，其他物件不承接这项任务', () => {
    expect(archiveObjects[0].historicalNode).toBe('tucheng')
    expect(historyRecords.list.summary).toContain('土城战役')
    expect(historyRecords.list.boundary).toContain('游戏名单')
    expect(archiveObjects[0].artifactFront.join('')).toContain('转三')
    for (const item of archiveObjects.slice(1)) {
      expect(JSON.stringify(item)).not.toContain('转三')
      expect(JSON.stringify(historyRecords[item.key])).not.toContain('转三')
    }
    expect(homeArchivePreviews.map((preview) => preview.teaser + preview.detail).join('')).not.toContain('转三')
  })

  it('草鞋游戏与真实绣球草鞋不混作同一件', () => {
    const shoes = archiveObjects.find((item) => item.key === 'shoes')!
    expect(shoes.clues.map((clue) => clue.id)).toEqual(['shoes-measure', 'shoes-repair', 'shoes-wear', 'shoes-cord'])
    expect(JSON.stringify(shoes)).not.toContain('谢志坚')
    expect(historyRecords.shoes.materials.filter((material) => material.code.startsWith('H-'))).toHaveLength(4)
    expect(historyRecords.shoes.boundary).toContain('不是游戏')
  })
  it('饭碗的四段游戏故事与仁化真实瓷碗分开陈列', () => {
    const bowl = archiveObjects.find((item) => item.key === 'bowl')!
    expect(bowl.clues.map((clue) => clue.id)).toEqual(['bowl-unwrapped', 'bowl-rim', 'bowl-marks', 'bowl-paper'])
    expect(JSON.stringify(bowl)).not.toContain('蒙家财')
    expect(historyRecords.bowl.materials.filter((material) => material.code.startsWith('H-'))).toHaveLength(4)
    expect(historyRecords.bowl.relation).toContain('原创虚构')
  })
})
