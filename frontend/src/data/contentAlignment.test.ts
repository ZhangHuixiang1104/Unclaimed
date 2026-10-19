import { describe, expect, it } from 'vitest'
import { archiveObjects } from './objects'
import { historyRecords } from './historyRecords'
import { homeArchivePreviews } from './homeArchives'

describe('独立章节与史实边界', () => {
  it('五件物品按既定调查顺序并具备各自证据问题', () => {
    expect(archiveObjects.map((item) => item.key)).toEqual(['list', 'map', 'battery', 'shoes', 'bowl'])
    for (const item of archiveObjects) {
      expect(item.clues).toHaveLength(item.key === 'map' ? 4 : 3)
      expect(new Set(item.clues.map((clue) => clue.side))).toEqual(new Set(item.key === 'map' ? ['front'] : ['front', 'back']))
      expect(item.conclusions).toHaveLength(3)
      expect(item.screeningDecoys).toHaveLength(2)
      expect(new Set([...item.clues, ...item.conclusions, ...item.screeningDecoys].map((entry) => entry.id)).size).toBe(item.key === 'map' ? 9 : 8)
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
})
