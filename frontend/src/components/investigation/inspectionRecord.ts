import type { ArchiveObject, ObjectRecord } from '../../types/archive'

const observationSteps: Record<string, string[]> = {
  list: ['list-pieces-assembled', 'list-mud-cleared'],
  map: ['map-unfolded', 'map-back-viewed', 'map-caption-supported'],
  battery: ['battery-band-lifted', 'battery-right-viewed', 'battery-lid-opened'],
  shoes: ['shoes-separated', 'shoes-measured', 'shoes-light-on', 'shoes-large-repair-viewed', 'shoes-small-repair-viewed', 'shoes-large-sole-viewed', 'shoes-small-sole-viewed', 'shoes-wear-traced', 'shoes-cord-lifted'],
  bowl: ['bowl-wrapper-opened', 'bowl-rotated', 'bowl-light-on', 'bowl-base-viewed', 'bowl-paper-turned'],
}

// Completed legacy archives remain inspectable with the current artwork. This
// is a read-only presentation; it does not invent actions in the saved record.
export const inspectionRecord = (item: ArchiveObject, record: ObjectRecord): ObjectRecord => record.status !== 'archived' ? record : {
  ...record,
  foundClueIds: item.clues.map(clue => clue.id),
  completedInteractions: [...new Set([...record.completedInteractions, ...(observationSteps[item.key] ?? [])])],
}
