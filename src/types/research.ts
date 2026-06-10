// src/types/research.ts — Mira research report types

export interface ResearchSnapshot {
  label: string
  value: string
}

export interface ResearchSource {
  name: string
  description: string
  timestamp: string
}

export interface ResearchFollowUp {
  question: string
  rung: string
  routeBinding: string
  objectAnchor: string
  decisionImpact: string
}

export interface ResearchReport {
  id: string
  symbol: string
  companyName: string
  market: 'US' | 'CN'
  date: string
  depth: 'quick_map' | 'standard' | 'deep_dive'

  taskMode: string
  primaryRoute: string
  timeBoundary: string

  coreJudgment: string
  judgmentConfidence: 'low' | 'medium' | 'high'
  confidenceBasis: string
  reversalCondition: string

  snapshot: ResearchSnapshot[]
  sources: ResearchSource[]
  sourceGaps: string[]

  staleAfter: string
  mustRefreshIf: string

  followUp: ResearchFollowUp
}