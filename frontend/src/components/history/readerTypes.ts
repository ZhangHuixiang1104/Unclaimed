export interface HistoryFigureData {
  id: string
  label: string
  src?: string
  alt: string
  caption: string
  credit?: string
  researchSrc?: string
  researchAlt?: string
  researchCredit?: string
  researchCaption?: string
}

export interface HistoryStationData {
  label: string
  period?: string
  title: string
  lead: string
  detail: string
  material?: string
  boundary: string
  source: string
  sourceUrl: string
  figures: HistoryFigureData[]
  moments?: readonly { date: string; title: string; body: string }[]
}
