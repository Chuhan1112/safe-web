// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'

// jsdom 没有 ResizeObserver，AssetChart 会 crash；必须 mock
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

// jsdom 没有 canvas getContext，lightweight-charts 需要
HTMLCanvasElement.prototype.getContext = (() => {
  return {
    clearRect: () => {},
    fillRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    arc: () => {},
    measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    fillText: () => {},
    strokeText: () => {},
    clip: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(0), width: 0, height: 0 }),
    putImageData: () => {},
    createPattern: () => ({}),
    isPointInPath: () => false,
  } as any
}) as any

HTMLCanvasElement.prototype.toDataURL = () => '' as any
HTMLCanvasElement.prototype.toBlob = (() => {}) as any

import { TechAnalysisPage } from '@/components/TechAnalysisPage'

vi.mock('@/lib/api/client', () => ({
  api: {
    getTickerData: vi.fn(),
    getAnalysis: vi.fn(),
  },
}))

// useMarket 无 Provider 会 throw（MarketContext.tsx:30），必须 mock。
// mockMarketRef.current 用对象包装避免 vi.mock 提升时的 TDZ 问题。
const mockMarketRef = { current: 'US' as string }
vi.mock('@/contexts/MarketContext', () => ({
  useMarket: () => ({ market: mockMarketRef.current, setMarket: vi.fn() }),
}))

import { api } from '@/lib/api/client'

const MOCK_ANALYSIS = {
  symbol: 'AAPL', market: 'US', as_of: '2026-08-04',
  indicators: { close: 303.72, macd: { dif: 4.536, dea: 4.31, hist: 0.45, state: 'golden' },
    kdj: { k: 61.2, d: 55.4, j: 72.8 }, rsi14: 58.2, sma20: 210.3, sma50: 198.7, sma200: 185.2 },
  buy_points: [{ rule_id: 'macd_golden_cross', name: 'MACD 金叉', triggered: true, trigger_date: '2026-07-31', note: '近5日DIF上穿DEA，低位金叉' }],
  backtest: [{ rule_id: 'macd_golden_cross', name: 'MACD 金叉', signals: 6, avg_ret_5d: 1.2, avg_ret_10d: 2.8, avg_ret_20d: 4.1, win_rate_5d: 0.67, win_rate_10d: 0.83, win_rate_20d: 0.83, last_trigger: '2026-07-31' }],
  live_snapshot: { source: 'westock_technical', date: '2026-08-04', close: 303.72, dif: 4.536, dea: 4.31, rsi_6: 61.2, rsi_12: 58.4, rsi_24: 55.1, kdj_k: 61.2, kdj_d: 55.4, kdj_j: 72.8 },
  errors: [],
} as const

const MOCK_CHART = { symbol: 'AAPL', data: [{ time: '2026-08-01', open: 300, high: 305, low: 299, close: 303, volume: 1000, indicators: {} }], current_price: 303, change_percent: 1.2, is_intraday: false }

beforeEach(() => {
  vi.clearAllMocks()
  mockMarketRef.current = 'US'
})

afterEach(() => {
  cleanup()
})

describe('TechAnalysisPage', () => {
  it('输入代码点击分析后渲染指标卡/买点/回测/实时快照', async () => {
    ;(api.getTickerData as any).mockResolvedValue(MOCK_CHART)
    ;(api.getAnalysis as any).mockResolvedValue(MOCK_ANALYSIS)
    render(<TechAnalysisPage />)
    fireEvent.change(screen.getByPlaceholderText('输入代码，如 AAPL / NVDA / 600519'), { target: { value: 'AAPL' } })
    fireEvent.click(screen.getByRole('button', { name: /分析/i }))
    await waitFor(() => expect(screen.getAllByText('MACD 金叉').length).toBeGreaterThanOrEqual(1))
    expect(api.getTickerData).toHaveBeenCalledWith('AAPL', 756, 'US')
    expect(api.getAnalysis).toHaveBeenCalledWith('AAPL', 'US')
    expect(screen.getByText(/实时·腾讯口径/)).toBeTruthy()
  })

  it('空输入不发起请求', () => {
    render(<TechAnalysisPage />)
    fireEvent.click(screen.getByRole('button', { name: /分析/i }))
    expect(api.getAnalysis).not.toHaveBeenCalled()
  })

  it('live_snapshot 为 null 时显示不可用', async () => {
    ;(api.getTickerData as any).mockResolvedValue(MOCK_CHART)
    ;(api.getAnalysis as any).mockResolvedValue({ ...MOCK_ANALYSIS, live_snapshot: null })
    render(<TechAnalysisPage />)
    fireEvent.change(screen.getByPlaceholderText(/输入代码/), { target: { value: 'AAPL' } })
    fireEvent.click(screen.getByRole('button', { name: /分析/i }))
    await waitFor(() => expect(screen.getByText(/不可用/)).toBeTruthy())
  })

  it('切市场清空分析结果（CLAUDE.md 陷阱 14）', async () => {
    ;(api.getTickerData as any).mockResolvedValue(MOCK_CHART)
    ;(api.getAnalysis as any).mockResolvedValue(MOCK_ANALYSIS)
    const { rerender } = render(<TechAnalysisPage />)
    fireEvent.change(screen.getByPlaceholderText('输入代码，如 AAPL / NVDA / 600519'), { target: { value: 'AAPL' } })
    fireEvent.click(screen.getByRole('button', { name: /分析/i }))
    await waitFor(() => expect(screen.getAllByText('MACD 金叉').length).toBeGreaterThanOrEqual(1))

    // 切换到 CN 市场
    mockMarketRef.current = 'CN'
    rerender(<TechAnalysisPage />)

    // 结果应被清空（useEffect([market]) 清空 analysis/chart/error）
    await waitFor(() => expect(screen.queryByText('MACD 金叉')).toBeNull())
    expect(screen.queryByText(/实时·腾讯口径/)).toBeNull()
  })
})
