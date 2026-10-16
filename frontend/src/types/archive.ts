export type ObjectStatus = 'locked' | 'available' | 'investigating' | 'archived'
export type EvidenceLevel = 'confirmed' | 'inferred' | 'unknown'
export type InteractionType = 'name-restorer' | 'route-rebuilder' | 'signal-network' | 'shoe-repair' | 'mark-comparison'

export interface Clue {
  id: string
  title: string
  description: string
  position: { x: number; y: number }
}

export interface Conclusion {
  id: string
  screeningQuestion: string
  text: string
  expectedLevel: EvidenceLevel
  explanation: string
}

export interface ArchiveObject {
  key: string
  order: number
  name: string
  archiveNo: string
  subtitle: string
  historicalNode: string
  historicalLabel: string
  interactionType: InteractionType
  accent: string
  silhouette: string
  intro: string
  investigationQuestion: string
  nextHook: string
  artNote: string
  clues: Clue[]
  conclusions: Conclusion[]
}

export interface ObjectRecord {
  status: ObjectStatus
  foundClueIds: string[]
  classified: Record<string, EvidenceLevel>
  markerPositions: Record<string, { x: number; y: number }>
  acceptedConclusionIds: string[]
  rejectedClaimIds: string[]
  screeningVerified: boolean
  evidenceVerified: boolean
  historyRevealed: boolean
  historyRead: boolean
}
