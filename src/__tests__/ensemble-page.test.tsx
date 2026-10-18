// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { EnsemblePage } from '@/components/EnsemblePage'
import type { EnsembleRunResponse } from '@/lib/api/ensemble'

const runEnsemble = vi.fn()

vi.mock('@/lib/api/client', () => ({
  api: {
    runEnsemble: (...args: unknown[]) => runEnsemble(...args),
  },
}))

const marketState = vi.hoisted(() => ({ current: 'US' }))

vi.mock('@/contexts/MarketContext', () => ({
  useMarket: () => ({ market: marketState.current, setMarket: vi.fn() }),
}))

const RESPONSE: EnsembleRunResponse = {
  market: 'US',
  sleeves: [
    {
      strategy: 'MOMENTUM_CONFIRM',
      avgWeight: 0.33,
      sharpe: 1.6,
      cagr: 0.9,
      maxDrawdown: -0.45,
      returnContribution: 0.083,
      drawdownContribution: -0.166,
      correlations: { ULTIMATE_COMBINED: 0.387, PRACTICAL_RSI: 0.297 },
    },
    {
      strategy: 'ULTIMATE_COMBINED',
      avgWeight: 0.34,
      sharpe: 0.9,
      cagr: 0.4,
      maxDrawdown: -0.3,
      returnContribution: 0.118,
      drawdownContribution: -0.141,
      correlations: { MOMENTUM_CONFIRM: 0.387, PRACTICAL_RSI: 0.225 },
    },
    {
      strategy: 'PRACTICAL_RSI',
      avgWeight: 0.33,
      sharpe: 0.5,
      cagr: 0.2,
      maxDrawdown: -0.2,
      returnContribution: 0.228,
      drawdownContribution: -0.109,
      correlations: { MOMENTUM_CONFIRM: 0.297, ULTIMATE_COMBINED: 0.225 },
    },
  ],
  fullMetrics: {
    sharpe: 1.458,
    cagr: 0.341,
    maxDrawdown: -0.213,
    calmar: 1.6,
    totalReturn: 0.9,
    volatility: 0.2,
    avgInvested: 0.98,
    annualTurnover: 1.2,
  },
  holdoutMetrics: {
    sharpe: 1.652,
    cagr: 0.485,
    maxDrawdown: -0.145,
    calmar: 3.3,
    totalReturn: 0.6,
    volatility: 0.18,
    avgInvested: 0.99,
    annualTurnover: 1.1,
  },
  constraints: {
    minWeight: 0.05,
    maxPairCorrelation: 0.6,
    maxDdContribution: 0.18,
    minWeightBinding: true,
    minWeightViolations: 0,
    maxObservedPairCorrelation: 0.387,
    maxObservedDdContribution: 0.166,
    ddContributionBinding: false,
    ddContributionBreached: false,
    pairCorrelationIsSoftTarget: true,
  },
  method: 'equal',
  maxWeight: 0.6,
}

describe('EnsemblePage', () => {
  beforeEach(() => {
    marketState.current = 'US'
    runEnsemble.mockReset()
    // 没有全局 cleanup 配置时，多个 render 会叠加进同一个 document。
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  it('展示 preset 选择器并默认不自动发起请求', () => {
    render(<EnsemblePage />)

    expect(screen.getByLabelText(/preset/i)).toBeTruthy()
    expect(runEnsemble).not.toHaveBeenCalled()
  })

  it('运行后展示组合指标、sleeve 权重与相关性', async () => {
    runEnsemble.mockResolvedValue(RESPONSE)
    render(<EnsemblePage />)

    screen.getByRole('button', { name: /^run ensemble$/i }).click()

    await waitFor(() => {
      expect(screen.getByText('1.46')).toBeTruthy()
    })

    // 三条 sleeve 都在权重表里（同样的名字也会出现在相关性矩阵，按行数断言）
    const weightTable = document.body.querySelectorAll('table')[0]
    expect(weightTable.textContent).toContain('MOMENTUM_CONFIRM')
    expect(weightTable.textContent).toContain('ULTIMATE_COMBINED')
    expect(weightTable.textContent).toContain('PRACTICAL_RSI')

    // 相关性矩阵展示两两相关性（对称矩阵里每个值出现两次，按表断言）
    const corrTable = document.body.querySelectorAll('table')[1]
    expect(corrTable.textContent).toContain('0.387')
    expect(corrTable.textContent).toContain('0.225')
    // 对角线不重复显示自身相关性
    expect(corrTable.textContent).toContain('—')

    // 回撤贡献单独成列
    expect(weightTable.textContent).toContain('-16.6%')

    // 约束生效情况可见
    expect(screen.getByText(/corr soft target/i)).toBeTruthy()
  })

  it('接口失败时展示错误信息而不是空白', async () => {
    runEnsemble.mockRejectedValue(new Error('strategies must not be empty'))
    render(<EnsemblePage />)

    screen.getByRole('button', { name: /^run ensemble$/i }).click()

    await waitFor(() => {
      expect(screen.getByText(/strategies must not be empty/i)).toBeTruthy()
    })
  })

  it('切市场时重置 preset 与旧结果', async () => {
    marketState.current = 'US'
    runEnsemble.mockResolvedValue(RESPONSE)
    const view = render(<EnsemblePage />)
    screen.getByRole('button', { name: /^run ensemble$/i }).click()
    await waitFor(() => expect(screen.getByText('1.46')).toBeTruthy())

    marketState.current = 'CN'
    view.rerender(<EnsemblePage />)

    await waitFor(() => {
      const select = screen.getByLabelText(/preset/i) as HTMLSelectElement
      expect(select.value).toBe('CN_CORE_2')
    })
    expect(screen.queryByText('1.46')).toBeNull()
  })

  it('请求带上当前 market，避免 preset 串市场', async () => {
    runEnsemble.mockResolvedValue(RESPONSE)
    render(<EnsemblePage />)

    screen.getByRole('button', { name: /^run ensemble$/i }).click()

    await waitFor(() => expect(runEnsemble).toHaveBeenCalled())
    expect(runEnsemble.mock.calls[0][0]).toMatchObject({ market: 'US' })
  })
})