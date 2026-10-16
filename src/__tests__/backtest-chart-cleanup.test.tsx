// @vitest-environment jsdom
import { render, cleanup } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'

const removeMock = vi.fn()
const unsubscribeCrosshairMoveMock = vi.fn()
const applyOptionsMock = vi.fn()
const observeMock = vi.fn()
const disconnectMock = vi.fn()
const setDataMock = vi.fn()
const addSeriesMock = vi.fn(() => ({ setData: setDataMock }))

const createChartMock = vi.fn(() => ({
  addSeries: addSeriesMock,
  timeScale: vi.fn(() => ({ fitContent: vi.fn(), coordinateToLogical: vi.fn() })),
  subscribeCrosshairMove: vi.fn(),
  unsubscribeCrosshairMove: unsubscribeCrosshairMoveMock,
  remove: removeMock,
  applyOptions: applyOptionsMock,
}))

vi.mock('lightweight-charts', () => ({
  createChart: (...args: unknown[]) => createChartMock(...(args as [])),
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
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  /**
   * 契约（autoSize 版）：组件不再自持 ResizeObserver（观察器归 lightweight-charts
   * 内部所有，随 chart.remove() 释放），因此这里锁：
   *  1. createChart 以 autoSize:true 创建（尺寸交给库管理）
   *  2. 卸载时 unsubscribeCrosshairMove + chart.remove 都被调用（无泄漏）
   */
  it('creates chart with autoSize and removes it (plus crosshair sub) on unmount', () => {
    const { unmount } = render(
      <BacktestChart data={[{ time: '2024-01-01', value: 100 }]} />,
    )
    expect(createChartMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ autoSize: true }),
    )
    unmount()
    expect(unsubscribeCrosshairMoveMock).toHaveBeenCalled()
    expect(removeMock).toHaveBeenCalled()
  })

  /** 主题/颜色变化只走 applyOptions，不得销毁重建图表（重建会闪空 + 重灌全部 series） */
  it('applies theme via applyOptions without recreating the chart', () => {
    const { rerender } = render(
      <BacktestChart data={[{ time: '2024-01-01', value: 100 }]} />,
    )
    expect(createChartMock).toHaveBeenCalledTimes(1)
    const removesBefore = removeMock.mock.calls.length

    rerender(
      <BacktestChart
        data={[{ time: '2024-01-01', value: 100 }]}
        colors={{ textColor: '#ffffff', backgroundColor: 'transparent' }}
      />,
    )

    expect(removeMock.mock.calls.length).toBe(removesBefore) // 图表未销毁
    expect(applyOptionsMock).toHaveBeenCalled()
    expect(createChartMock).toHaveBeenCalledTimes(1) // 仍只有一次创建
  })
})
