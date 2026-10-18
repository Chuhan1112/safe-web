/* eslint-disable @typescript-eslint/no-explicit-any */
export type AnyRecord = Record<string, any>

export interface EnsembleSleeve {
  strategy: string
  avgWeight: number
  sharpe: number
  cagr: number
  maxDrawdown: number
  returnContribution: number
  drawdownContribution: number
  correlations: Record<string, number>
}

export interface EnsembleMetrics {
  sharpe: number
  cagr: number
  maxDrawdown: number
  calmar: number
  totalReturn: number
  volatility: number
  avgInvested: number
  annualTurnover: number
}

export interface EnsembleConstraints {
  minWeight: number
  maxPairCorrelation: number
  maxDdContribution: number
  minWeightBinding: boolean
  minWeightViolations: number
  maxObservedPairCorrelation: number
  maxObservedDdContribution: number
}

export interface EnsembleRunResponse {
  market: string
  sleeves: EnsembleSleeve[]
  fullMetrics: EnsembleMetrics
  holdoutMetrics: EnsembleMetrics | null
  constraints: EnsembleConstraints
  method: string
  maxWeight: number
}

export function normalizeEnsembleResult(raw: AnyRecord): EnsembleRunResponse {
  const toNumber = (v: any, d = 0): number => (Number.isFinite(Number(v)) ? Number(v) : d)

  const metrics = (raw?.full_metrics ?? {}) as AnyRecord
  const normalizeMetrics = (m: AnyRecord): EnsembleMetrics => ({
    sharpe: toNumber(m?.sharpe),
    cagr: toNumber(m?.cagr),
    maxDrawdown: toNumber(m?.max_drawdown),
    calmar: toNumber(m?.calmar),
    totalReturn: toNumber(m?.total_return),
    volatility: toNumber(m?.volatility),
    avgInvested: toNumber(m?.avg_invested),
    annualTurnover: toNumber(m?.annual_turnover),
  })

  const strategies: string[] = Array.isArray(raw?.strategies) && raw.strategies.length
    ? raw.strategies
    : Object.keys(raw?.avg_weights ?? {})

  const weights = (raw?.avg_weights ?? {}) as AnyRecord
  const correlation = (raw?.correlation ?? {}) as AnyRecord
  const contribution = (raw?.contribution ?? {}) as AnyRecord
  const sleeveMetrics = (raw?.sleeve_metrics ?? {}) as AnyRecord

  const sleeves: EnsembleSleeve[] = strategies.map((strategy) => {
    const m = (sleeveMetrics[strategy] ?? {}) as AnyRecord
    const c = (contribution[strategy] ?? {}) as AnyRecord
    const row = (correlation[strategy] ?? {}) as AnyRecord
    const correlations: Record<string, number> = {}
    Object.entries(row).forEach(([other, value]) => {
      if (other !== strategy) correlations[other] = toNumber(value)
    })
    return {
      strategy,
      avgWeight: toNumber(weights[strategy]),
      sharpe: toNumber(m?.sharpe),
      cagr: toNumber(m?.cagr),
      maxDrawdown: toNumber(m?.max_drawdown),
      returnContribution: toNumber(c?.total_return_contribution),
      drawdownContribution: toNumber(c?.max_drawdown_contribution),
      correlations,
    }
  })

  const d = (raw?.constraint_diagnostics ?? {}) as AnyRecord
  const config = (raw?.config ?? {}) as AnyRecord

  return {
    market: String(raw?.market ?? ''),
    sleeves,
    fullMetrics: normalizeMetrics(metrics),
    holdoutMetrics: raw?.holdout_metrics ? normalizeMetrics(raw.holdout_metrics as AnyRecord) : null,
    constraints: {
      minWeight: toNumber(d?.min_weight ?? config?.min_weight),
      maxPairCorrelation: toNumber(d?.max_pair_correlation ?? config?.max_pair_correlation, 1),
      maxDdContribution: toNumber(d?.max_dd_contribution ?? config?.max_dd_contribution, 1),
      minWeightBinding: Boolean(d?.min_weight_binding),
      minWeightViolations: toNumber(d?.min_weight_violations),
      maxObservedPairCorrelation: toNumber(d?.max_observed_pair_correlation),
      maxObservedDdContribution: toNumber(d?.max_observed_dd_contribution),
    },
    method: String(config?.method ?? 'equal'),
    maxWeight: toNumber(config?.max_weight, 0.6),
  }
}
