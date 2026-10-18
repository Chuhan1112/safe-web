import { describe, it, expect } from 'vitest'
import { normalizeEnsembleResult, type EnsembleRunResponse } from './ensemble'

describe('normalizeEnsembleResult', () => {
  it('maps sleeve weights, correlation and drawdown contribution', () => {
    const raw = {
      market: 'US',
      strategies: ['MOMENTUM_CONFIRM', 'ULTIMATE_COMBINED', 'PRACTICAL_RSI'],
      config: {
        method: 'equal',
        lookback: 60,
        rebalance: 'ME',
        max_weight: 0.6,
        min_weight: 0.05,
        max_pair_correlation: 0.6,
        max_dd_contribution: 0.18,
      },
      full_metrics: { sharpe: 1.458, cagr: 0.341, max_drawdown: -0.213, calmar: 1.6 },
      holdout_metrics: { sharpe: 1.652, cagr: 0.485, max_drawdown: -0.145 },
      sleeve_metrics: {
        MOMENTUM_CONFIRM: { sharpe: 1.6 },
        ULTIMATE_COMBINED: { sharpe: 0.9 },
        PRACTICAL_RSI: { sharpe: 0.5 },
      },
      avg_weights: {
        MOMENTUM_CONFIRM: 0.33,
        ULTIMATE_COMBINED: 0.34,
        PRACTICAL_RSI: 0.33,
      },
      correlation: {
        MOMENTUM_CONFIRM: { MOMENTUM_CONFIRM: 1, ULTIMATE_COMBINED: 0.387, PRACTICAL_RSI: 0.297 },
        ULTIMATE_COMBINED: { MOMENTUM_CONFIRM: 0.387, ULTIMATE_COMBINED: 1, PRACTICAL_RSI: 0.225 },
        PRACTICAL_RSI: { MOMENTUM_CONFIRM: 0.297, ULTIMATE_COMBINED: 0.225, PRACTICAL_RSI: 1 },
      },
      contribution: {
        MOMENTUM_CONFIRM: { total_return_contribution: 0.083, max_drawdown_contribution: -0.166 },
        ULTIMATE_COMBINED: { total_return_contribution: 0.118, max_drawdown_contribution: -0.141 },
        PRACTICAL_RSI: { total_return_contribution: 0.228, max_drawdown_contribution: -0.109 },
      },
      constraint_diagnostics: {
        min_weight: 0.05,
        max_pair_correlation: 0.6,
        max_dd_contribution: 0.18,
        min_weight_binding: true,
        min_weight_violations: 0,
        max_observed_pair_correlation: 0.387,
        max_observed_dd_contribution: 0.166,
      },
    }

    const result = normalizeEnsembleResult(raw)

    expect(result.sleeves).toHaveLength(3)
    expect(result.sleeves[0].strategy).toBe('MOMENTUM_CONFIRM')
    expect(result.sleeves[0].avgWeight).toBeCloseTo(0.33)
    expect(result.sleeves[0].sharpe).toBeCloseTo(1.6)
    expect(result.sleeves[0].drawdownContribution).toBeCloseTo(-0.166)
    expect(result.sleeves[0].returnContribution).toBeCloseTo(0.083)
    // 每条 sleeve 都带齐与其它 sleeve 的两两相关性。
    expect(result.sleeves[0].correlations).toEqual({ ULTIMATE_COMBINED: 0.387, PRACTICAL_RSI: 0.297 })
    expect(result.fullMetrics.sharpe).toBeCloseTo(1.458)
    expect(result.holdoutMetrics?.maxDrawdown).toBeCloseTo(-0.145)
    expect(result.constraints.maxPairCorrelation).toBeCloseTo(0.6)
    expect(result.constraints.minWeightBinding).toBe(true)
  })

  it('drops the self-correlation diagonal from pairwise display', () => {
    const raw = {
      strategies: ['A', 'B'],
      correlation: {
        A: { A: 1, B: 0.5 },
        B: { A: 0.5, B: 1 },
      },
      avg_weights: { A: 0.5, B: 0.5 },
      contribution: {
        A: { total_return_contribution: 0.1, max_drawdown_contribution: -0.1 },
        B: { total_return_contribution: 0.1, max_drawdown_contribution: -0.1 },
      },
      sleeve_metrics: { A: {}, B: {} },
      config: {},
      full_metrics: {},
    }

    const result = normalizeEnsembleResult(raw)

    expect(result.sleeves[0].correlations).toEqual({ B: 0.5 })
  })

  it('tolerates a missing holdout window', () => {
    const raw = {
      strategies: ['A'],
      avg_weights: { A: 1 },
      correlation: { A: { A: 1 } },
      contribution: { A: { total_return_contribution: 0, max_drawdown_contribution: 0 } },
      sleeve_metrics: { A: {} },
      config: {},
      full_metrics: {},
    }

    const result = normalizeEnsembleResult(raw)

    expect(result.holdoutMetrics).toBeNull()
    expect(result.sleeves[0].avgWeight).toBeCloseTo(1)
  })

  it('falls back to strategy list when avg_weights is absent', () => {
    const raw = {
      strategies: ['A', 'B'],
      correlation: {},
      contribution: {},
      sleeve_metrics: {},
      config: {},
      full_metrics: {},
    }

    const result = normalizeEnsembleResult(raw)

    expect(result.sleeves.map((s) => s.strategy)).toEqual(['A', 'B'])
    expect(result.sleeves[0].avgWeight).toBe(0)
  })
})

describe('EnsembleRunResponse', () => {
  it('is assignable from a normalized result', () => {
    const value: EnsembleRunResponse = normalizeEnsembleResult({
      strategies: [],
      config: {},
      full_metrics: {},
      avg_weights: {},
      correlation: {},
      contribution: {},
      sleeve_metrics: {},
    })
    expect(value.sleeves).toEqual([])
  })
})