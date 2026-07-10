// @vitest-environment jsdom
import { render, cleanup } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

const removeMock = vi.fn()
const unsubscribeCrosshairMoveMock = vi.fn()
const observeMock = vi.fn()
const disconnectMock = vi.fn()
const setDataMock = vi.fn()
const addSeriesMock = vi.fn(() => ({ setData: setDataMock }))

vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => ({
    addSeries: addSeriesMock,
    timeScale: vi.fn(() => ({ fitContent: vi.fn(), coordinateToLogical: vi.fn() })),
    subscribeCrosshairMove: vi.fn(),
    unsubscribeCrosshairMove: unsubscribeCrosshairMoveMock,
    remove: removeMock,
    applyOptions: vi.fn(),
  })),
  AreaSeries: 'AreaSeries',
  ColorType: { Solid: 'solid' },
}))

// jsdom lacks ResizeObserver, provide a constructable stub
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe = observeMock
    disconnect = disconnectMock
    unobserve = vi.fn()
  },
)

import { BacktestChart } from '@/components/BacktestChart'

describe('BacktestChart cleanup', () => {
  beforeEach(() => {
    observeMock.mockClear()
    disconnectMock.mockClear()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('removes chart and disconnects observer on unmount', () => {
    const { unmount } = render(
      <BacktestChart data={[{ time: '2024-01-01', value: 100 }]} />,
    )
    expect(observeMock).toHaveBeenCalled()
    unmount()
    expect(unsubscribeCrosshairMoveMock).toHaveBeenCalled()
    expect(removeMock).toHaveBeenCalled()
    expect(disconnectMock).toHaveBeenCalled()
  })
})
