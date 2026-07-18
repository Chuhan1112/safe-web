import { describe, it, expect } from 'vitest'
import { sortBySeverity, type TickerHealthRow } from '@/utils/dataHealth'

describe('sortBySeverity', () => {
  it('orders missing > anomaly > stale > unknown > healthy', () => {
    const rows = [
      { status: 'healthy', symbol: 'A' },
      { status: 'missing', symbol: 'B' },
      { status: 'stale', symbol: 'C' },
      { status: 'anomaly', symbol: 'D' },
      { status: 'unknown', symbol: 'E' },
    ]
    const sorted = sortBySeverity(rows as unknown as TickerHealthRow[]).map((r) => r.status)
    expect(sorted).toEqual(['missing', 'anomaly', 'stale', 'unknown', 'healthy'])
  })

  it('falls back to symbol sort for same status', () => {
    const rows = [
      { status: 'stale', symbol: 'Z' },
      { status: 'stale', symbol: 'A' },
    ]
    const sorted = sortBySeverity(rows as unknown as TickerHealthRow[]).map((r) => r.symbol)
    expect(sorted).toEqual(['A', 'Z'])
  })
})
