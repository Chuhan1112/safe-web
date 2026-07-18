export interface TickerHealthRow {
  symbol: string
  market: string
  latest_date: string | null
  effective_date: string
  status: string
  name: string | null
  missing_days: number
  anomaly_count: number
  provider: string | null
  last_checked_at: string
  notes: string[]
}

export type ViewMode = 'abnormal' | 'limited' | 'all'

export const STATUS_ORDER: Record<string, number> = {
  missing: 0,
  anomaly: 1,
  stale: 2,
  unknown: 3,
  healthy: 4,
}

export function sortBySeverity(rows: TickerHealthRow[]): TickerHealthRow[] {
  return [...rows].sort((a, b) => {
    const orderA = STATUS_ORDER[a.status] ?? 999
    const orderB = STATUS_ORDER[b.status] ?? 999
    return orderA - orderB || a.symbol.localeCompare(b.symbol)
  })
}
