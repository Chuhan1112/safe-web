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

type TradeLogRow = {
  Date?: string
  [key: string]: unknown
}

type RebalanceLogRow = {
  Date?: string
  [key: string]: unknown
}

export function buildTradeMap(tradeLogs: TradeLogRow[] | undefined) {
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

export function buildRebalanceMap(logs: RebalanceLogRow[] | undefined) {
  const filtered = logs?.filter((log) => log?.Date)
  if (!filtered?.length) return null
  const rebalanceByDate = new Map<string, RebalanceLogRow>()
  for (const log of filtered) rebalanceByDate.set(String(log.Date), log)
  const rebalanceDates = Array.from(rebalanceByDate.keys())
    .map((date) => ({ date, ts: parseDateToTs(date) }))
    .filter((x) => Number.isFinite(x.ts))
    .sort((a, b) => a.ts - b.ts)
  return { rebalanceByDate, rebalanceDates }
}
