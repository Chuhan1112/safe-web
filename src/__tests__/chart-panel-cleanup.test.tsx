// @vitest-environment jsdom
import { render, cleanup } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

// Stub global animation frame functions for spying
const cancelAnimationFrameSpy = vi.fn()
const requestAnimationFrameStub = vi.fn().mockImplementation((cb) => {
  return 123 as unknown as number
})

vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrameSpy)
vi.stubGlobal('requestAnimationFrame', requestAnimationFrameStub)

vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => ({
    addSeries: vi.fn(() => ({ setData: vi.fn() })),
    timeScale: vi.fn(() => ({ fitContent: vi.fn(), coordinateToLogical: vi.fn() })),
    subscribeCrosshairMove: vi.fn(),
    unsubscribeCrosshairMove: vi.fn(),
    remove: vi.fn(),
    applyOptions: vi.fn(),
  })),
  AreaSeries: 'AreaSeries',
  ColorType: { Solid: 'solid' },
}))

// jsdom lacks ResizeObserver, provide a constructable stub
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe = vi.fn()
    disconnect = vi.fn()
    unobserve = vi.fn()
  },
)

import { ChartPanel } from '@/components/ChartPanel'

describe('ChartPanel cleanup', () => {
  beforeEach(() => {
    cancelAnimationFrameSpy.mockClear()
    requestAnimationFrameStub.mockClear()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('cancels pending RAF on unmount', () => {
    const { unmount } = render(
      <ChartPanel
        result={{
          equity_curve: [{ time: '2024-01-01', value: 100 }],
          metrics: { cagr: 0.1 },
        }}
        compareMode={false}
        chartView="equity"
        setChartView={() => {}}
        chartKey={0}
        setChartKey={() => {}}
        compareResults={{}}
        highlightStrategy={null}
        setHighlightStrategy={() => {}}
        getStrategyName={(id) => id}
        comparePalette={['#2563eb']}
        t={{
          equity_curve: 'Equity',
          drawdown: 'Drawdown',
          equity_curve_desc: 'desc',
          equity_label: 'Equity',
          drawdown_label: 'Drawdown',
          reset_zoom: 'Reset',
          hover_time: 'Time',
          snapshot_date: 'Date',
          no_holdings: 'None',
          trade_snapshot: 'Trade',
          rebalance_snapshot: 'Rebalance',
          no_snapshot_hint: 'No hint',
          no_data: 'No data',
        }}
        loading={false}
        error={null}
      />,
    )
    unmount()
    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(123)
  })
})
