import { useCallback, useEffect, useRef } from 'react'
import {
  AreaSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
} from 'lightweight-charts'
import { normalizeDateString, normalizeHoverTime } from '@/utils/chartHoverLogic'
import { useIsDark } from '@/hooks/useIsDark'

interface ChartSeries {
  id: string
  name: string
  data: { time: string; value: number }[]
  color?: string
  lineWidth?: 1 | 2 | 3 | 4
  opacity?: number
}

interface ChartProps {
  data?: { time: string; value: number }[]
  series?: ChartSeries[]
  onHoverTime?: (time: string | null) => void
  colors?: {
    backgroundColor?: string
    lineColor?: string
    textColor?: string
    areaTopColor?: string
    areaBottomColor?: string
  }
  theme?: 'light' | 'dark'
}

const EMPTY_DATA: { time: string; value: number }[] = []
const EMPTY_SERIES: ChartSeries[] = []

export const BacktestChart = ({ data, series, onHoverTime, colors = {}, theme }: ChartProps) => {
  const normalizedData = data ?? EMPTY_DATA
  const normalizedSeries = series ?? EMPTY_SERIES
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const primarySeriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const lastHoverTimeRef = useRef<string | null>(null)
  const hoverTimesRef = useRef<string[]>([])

  const isDark = useIsDark(theme)

  const emitHover = useCallback((nextTime: string | null) => {
    if (!onHoverTime) return
    if (nextTime !== lastHoverTimeRef.current) {
      lastHoverTimeRef.current = nextTime
      onHoverTime(nextTime)
    }
  }, [onHoverTime])

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current) return
    const values = hoverTimesRef.current
    if (!values.length) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const logical = chartRef.current.timeScale().coordinateToLogical(x)

    let index: number
    if (logical == null || !Number.isFinite(Number(logical))) {
      const ratio = Math.max(0, Math.min(1, x / Math.max(1, rect.width)))
      index = Math.round(ratio * (values.length - 1))
    } else {
      index = Math.round(Number(logical))
    }
    index = Math.max(0, Math.min(values.length - 1, index))
    emitHover(values[index] || null)
  }

  const handleMouseLeave = () => { emitHover(null) }

  const {
    backgroundColor = 'transparent',
    lineColor = '#2962FF',
    areaTopColor = 'rgba(41, 98, 255, 0.4)',
    areaBottomColor = 'rgba(41, 98, 255, 0.0)',
  } = colors
  // textColor from colors prop takes precedence; otherwise derive from theme
  const textColor = colors.textColor ?? (isDark ? '#d1d5db' : '#334155')

  // ResizeObserver — independent of data and theme
  useEffect(() => {
    if (!chartContainerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      if (!chartRef.current || entries.length === 0) return
      const { width } = entries[0].contentRect
      chartRef.current.applyOptions({ width })
    })

    resizeObserver.observe(chartContainerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Theme updates — applyOptions only, no chart rebuild
  useEffect(() => {
    if (!chartRef.current) return
    const resolvedTextColor = colors.textColor ?? (isDark ? '#d1d5db' : '#334155')
    const gridLineColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    chartRef.current.applyOptions({
      layout: { textColor: resolvedTextColor },
      grid: {
        vertLines: { color: gridLineColor },
        horzLines: { color: gridLineColor },
      },
      timeScale: { borderColor },
      rightPriceScale: { borderColor },
    })
  }, [isDark, colors.textColor])

  // Chart build — only when data, series, or color props change
  useEffect(() => {
    if (!chartContainerRef.current) return

    const gridLineColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: gridLineColor },
        horzLines: { color: gridLineColor },
      },
      timeScale: { borderColor },
      rightPriceScale: { borderColor },
    })

    chartRef.current = chart

    const palette = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6']

    if (normalizedSeries.length > 0) {
      hoverTimesRef.current = (normalizedSeries[0]?.data || []).map((item) =>
        normalizeDateString(String(item.time)),
      )
      normalizedSeries.forEach((seriesItem, index) => {
        const color = seriesItem.color || palette[index % palette.length]
        const opacity = seriesItem.opacity ?? 0.4
        const lineWidthValue = seriesItem.lineWidth ?? 2
        const nextSeries = chart.addSeries(AreaSeries, {
          lineColor: color,
          topColor: `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
          bottomColor: `${color}00`,
          lineWidth: lineWidthValue,
        })
        if (seriesItem.data && seriesItem.data.length > 0) {
          nextSeries.setData(seriesItem.data)
        }
        if (index === 0) {
          primarySeriesRef.current = nextSeries
        }
      })
      chart.timeScale().fitContent()
    } else {
      hoverTimesRef.current = normalizedData.map((item) => normalizeDateString(String(item.time)))
      const nextSeries = chart.addSeries(AreaSeries, {
        lineColor,
        topColor: areaTopColor,
        bottomColor: areaBottomColor,
        lineWidth: 2,
      })

      if (normalizedData.length > 0) {
        nextSeries.setData(normalizedData)
        chart.timeScale().fitContent()
      }
      primarySeriesRef.current = nextSeries
    }

    const onCrosshairMove = (param: MouseEventParams<Time>) => {
      if (!param?.point || !chartContainerRef.current) return

      const { x, y } = param.point
      const width = chartContainerRef.current.clientWidth
      const height = chartContainerRef.current.clientHeight
      if (x < 0 || y < 0 || x > width || y > height) return

      let nextTime = normalizeHoverTime(param.time)
      if (!nextTime && primarySeriesRef.current && param.seriesData?.get) {
        const pointData = param.seriesData.get(primarySeriesRef.current)
        if (pointData && typeof pointData === 'object' && 'time' in pointData) {
          nextTime = normalizeHoverTime((pointData as { time?: unknown }).time)
        }
      }
      if (!nextTime && chartRef.current) {
        const logical = chartRef.current.timeScale().coordinateToLogical(x)
        if (logical != null) {
          const index = Math.round(Number(logical))
          const values = hoverTimesRef.current
          if (index >= 0 && index < values.length) {
            nextTime = values[index]
          } else if (values.length > 0) {
            const clamped = Math.max(0, Math.min(values.length - 1, index))
            nextTime = values[clamped]
          }
        }
      }
      emitHover(nextTime)
    }

    chart.subscribeCrosshairMove(onCrosshairMove)

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshairMove)
      onHoverTime?.(null)
      chart.remove()
    }
  }, [
    normalizedData,
    normalizedSeries,
    emitHover,
    backgroundColor,
    lineColor,
    textColor,
    areaTopColor,
    areaBottomColor,
    isDark,
    onHoverTime,
  ])

  return (
    <div
      ref={chartContainerRef}
      className="w-full h-[400px]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  )
}
