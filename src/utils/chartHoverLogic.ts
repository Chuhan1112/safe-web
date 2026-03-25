import type { BusinessDay } from 'lightweight-charts'

export const toBusinessDate = (raw: string): { iso: string; businessDay: BusinessDay } | null => {
  if (!raw) return null
  const value = String(raw).trim().split(' ')[0]

  let matched = value.match(/^(\d{2})-(\d{2})-(\d{2})$/)
  if (matched) {
    const year = 2000 + Number(matched[1])
    const month = Number(matched[2])
    const day = Number(matched[3])
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return {
        iso: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        businessDay: { year, month, day },
      }
    }
  }

  matched = value.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/)
  if (matched) {
    const year = Number(matched[1])
    const month = Number(matched[2])
    const day = Number(matched[3])
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return {
        iso: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        businessDay: { year, month, day },
      }
    }
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  const year = parsed.getFullYear()
  const month = parsed.getMonth() + 1
  const day = parsed.getDate()
  return {
    iso: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    businessDay: { year, month, day },
  }
}

export const timeToIso = (time: unknown): string | null => {
  if (!time) return null
  if (typeof time === 'string') return toBusinessDate(time)?.iso ?? null
  if (typeof time === 'number') {
    const date = new Date(time * 1000)
    if (Number.isNaN(date.getTime())) return null
    return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  if (typeof time === 'object' && time !== null && 'year' in time && 'month' in time && 'day' in time) {
    const parsed = time as { year: number; month: number; day: number }
    return `${String(parsed.year).padStart(4, '0')}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`
  }
  return null
}

export const normalizeDateString = (raw: string): string =>
  toBusinessDate(raw)?.iso ?? String(raw).trim().split(' ')[0]

export const normalizeHoverTime = (time: unknown): string | null => {
  if (!time) return null
  if (typeof time === 'string') return normalizeDateString(time)
  if (typeof time === 'number') return new Date(time * 1000).toISOString().slice(0, 10)
  if (typeof time === 'object' && time !== null && 'year' in time && 'month' in time && 'day' in time) {
    const parsed = time as { year: number; month: number; day: number }
    return `${String(parsed.year).padStart(4, '0')}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`
  }
  return null
}

export const parseDateToTs = (dateStr: string | undefined): number => {
  if (!dateStr) return NaN
  const raw = String(dateStr).trim().split(' ')[0]
  let m = raw.match(/^(\d{2})-(\d{2})-(\d{2})$/)
  if (m) return new Date(2000 + +m[1], +m[2] - 1, +m[3]).getTime()
  m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]).getTime()
  m = raw.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]).getTime()
  return new Date(dateStr).getTime()
}

type LogRow = {
  Date?: string
  [key: string]: unknown
}

export function buildTradeMap(tradeLogs: LogRow[] | undefined) {
  if (!tradeLogs?.length) return null
  const tradeByDate = new Map<string, typeof tradeLogs>()
  for (const log of tradeLogs) {
    const d = String(log.Date ?? '')
    if (!d) continue
    if (!tradeByDate.has(d)) tradeByDate.set(d, [])
    tradeByDate.get(d)!.push(log)
  }
  const tradeDates = Array.from(tradeByDate.keys())
    .map((date) => ({ date, ts: parseDateToTs(date) }))
    .filter((x) => Number.isFinite(x.ts))
    .sort((a, b) => a.ts - b.ts)
  return { tradeByDate, tradeDates }
}

export function buildRebalanceMap(logs: LogRow[] | undefined) {
  const filtered = logs?.filter((log) => log?.Date)
  if (!filtered?.length) return null
  const rebalanceByDate = new Map<string, LogRow>()
  for (const log of filtered) rebalanceByDate.set(String(log.Date), log)
  const rebalanceDates = Array.from(rebalanceByDate.keys())
    .map((date) => ({ date, ts: parseDateToTs(date) }))
    .filter((x) => Number.isFinite(x.ts))
    .sort((a, b) => a.ts - b.ts)
  return { rebalanceByDate, rebalanceDates }
}
