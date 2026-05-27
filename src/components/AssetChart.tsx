import { CandlestickSeries, ColorType, createChart, LineSeries } from 'lightweight-charts'
import type { BusinessDay, IChartApi, MouseEventParams, Time } from 'lightweight-charts'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useIsDark } from '@/hooks/useIsDark'
import { timeToIso, toBusinessDate } from '@/utils/chartHoverLogic'
import { FloatingTooltip, type TooltipData } from '@/components/FloatingTooltip'
import { IndicatorToggles, type IndicatorConfig } from '@/components/IndicatorToggles'

interface AssetChartProps {
  data: {
    time: string
    open: number
    high: number
    low: number
    close: number
    volume?: number
    indicators?: {
      sma20?: number
      sma50?: number
      sma200?: number
      bb_upper?: number
      bb_lower?: number
    }
  }[]
  theme?: 'light' | 'dark'
}

const getChartTheme = (isDark: boolean) => ({
  textColor: isDark ? '#d1d5db' : '#334155',
  gridColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  borderColor: isDark ? '#374151' : '#e5e7eb',
})

const defaultIndicators: IndicatorConfig[] = [
  { id: 'sma20', label: 'SMA20', color: '#fbbf24', visible: true },
  { id: 'sma50', label: 'SMA50', color: '#3b82f6', visible: true },
  { id: 'sma200', label: 'SMA200', color: '#ef4444', visible: true },
  { id: 'bb', label: 'BB', color: '#a855f7', visible: false },
]

const indicatorLabelMap: Record<string, { label: string; color: string }> = {
  sma20: { label: 'SMA20', color: '#fbbf24' },
  sma50: { label: 'SMA50', color: '#3b82f6' },
  sma200: { label: 'SMA200', color: '#ef4444' },
  bb_upper: { label: 'BB Upper', color: '#a855f7' },
  bb_lower: { label: 'BB Lower', color: '#a855f7' },
}

export const AssetChart = ({ data, theme }: AssetChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 })
  const [hoverInfo, setHoverInfo] = useState<TooltipData | null>(null)
  const [indicators, setIndicators] = useState(defaultIndicators)
  const isDark = useIsDark(theme)
  const isDarkRef = useRef(isDark)
  const seriesRefs = useRef<Map<string, ReturnType<IChartApi['addSeries']>>>(new Map())

  useEffect(() => { isDarkRef.current = isDark }, [isDark])

  const handleIndicatorToggle = useCallback((id: string) => {
    setIndicators((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, visible: !ind.visible } : ind)),
    )
  }, [])

  useEffect(() => {
    if (!chartContainerRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return
      const { width, height } = entries[0].contentRect
      if (width > 0) {
        setDimensions({ width, height: height || 400 })
        if (chartRef.current) chartRef.current.applyOptions({ width, height: height || 400 })
      }
    })
    resizeObserver.observe(chartContainerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (!chartRef.current) return
    const { textColor, gridColor, borderColor } = getChartTheme(isDark)
    chartRef.current.applyOptions({
      layout: { textColor },
      grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
      timeScale: { borderColor },
      rightPriceScale: { borderColor },
    })
  }, [isDark])

  useEffect(() => {
    if (dimensions.width === 0 || !chartContainerRef.current || !data || data.length === 0) return
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null }

    try {
      const { textColor, gridColor, borderColor } = getChartTheme(isDarkRef.current)
      const chart = createChart(chartContainerRef.current, {
        layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor },
        localization: { locale: 'zh-CN', dateFormat: 'yyyy-MM-dd' },
        grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
        width: dimensions.width,
        height: dimensions.height,
        timeScale: {
          borderColor,
          timeVisible: false,
          secondsVisible: false,
          tickMarkFormatter: (time: Time) => {
            const iso = timeToIso(time)
            if (!iso) return ''
            const [y, m, d] = iso.split('-')
            return `${y}/${m}/${d}`
          },
        },
        rightPriceScale: { borderColor },
      })
      chartRef.current = chart

      const normalized = data
        .map((item) => {
          const parsed = toBusinessDate(item.time)
          if (!parsed) return null
          if (item.open == null || item.high == null || item.low == null || item.close == null) return null
          return { ...item, iso: parsed.iso, businessDay: parsed.businessDay }
        })
        .filter(Boolean) as Array<AssetChartProps['data'][number] & { iso: string; businessDay: BusinessDay }>

      if (normalized.length === 0) return

      const byIso = new Map<string, typeof normalized[number]>()
      normalized.forEach((item) => byIso.set(item.iso, item))

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
        wickUpColor: '#26a69a', wickDownColor: '#ef5350',
      })
      candleSeries.setData(
        normalized.map((item) => ({
          time: item.businessDay as Time,
          open: Number(item.open), high: Number(item.high),
          low: Number(item.low), close: Number(item.close),
        })),
      )
      seriesRefs.current.set('candle', candleSeries)

      const addLineSeries = (id: string, color: string, lineWidth: number, title: string, dashed = false) => {
        const s = chart.addSeries(LineSeries, {
          color, lineWidth: lineWidth as 1 | 2 | 3 | 4,
          title, priceLineVisible: false,
          lineStyle: dashed ? 2 : 0,
        })
        seriesRefs.current.set(id, s)
        return s
      }

      const sma20 = addLineSeries('sma20', '#fbbf24', 1, 'SMA 20')
      sma20.setData(normalized.filter((i) => i.indicators?.sma20 != null)
        .map((i) => ({ time: i.businessDay as Time, value: Number(i.indicators!.sma20) })))

      const sma50 = addLineSeries('sma50', '#3b82f6', 1, 'SMA 50')
      sma50.setData(normalized.filter((i) => i.indicators?.sma50 != null)
        .map((i) => ({ time: i.businessDay as Time, value: Number(i.indicators!.sma50) })))

      const sma200 = addLineSeries('sma200', '#ef4444', 2, 'SMA 200')
      sma200.setData(normalized.filter((i) => i.indicators?.sma200 != null)
        .map((i) => ({ time: i.businessDay as Time, value: Number(i.indicators!.sma200) })))

      const bbUpper = addLineSeries('bb_upper', 'rgba(168, 85, 247, 0.5)', 1, 'BB Upper', true)
      bbUpper.setData(normalized.filter((i) => i.indicators?.bb_upper != null)
        .map((i) => ({ time: i.businessDay as Time, value: Number(i.indicators!.bb_upper) })))

      const bbLower = addLineSeries('bb_lower', 'rgba(168, 85, 247, 0.5)', 1, 'BB Lower', true)
      bbLower.setData(normalized.filter((i) => i.indicators?.bb_lower != null)
        .map((i) => ({ time: i.businessDay as Time, value: Number(i.indicators!.bb_lower) })))

      chart.subscribeCrosshairMove((param: MouseEventParams<Time>) => {
        const iso = timeToIso(param?.time)
        if (!iso) { setHoverInfo(null); return }
        const row = byIso.get(iso)
        if (!row) { setHoverInfo(null); return }

        const idx = normalized.findIndex((item) => item.iso === iso)
        const prevRow = idx > 0 ? normalized[idx - 1] : null
        const changePct = prevRow && prevRow.close !== 0
          ? ((row.close - prevRow.close) / prevRow.close) * 100
          : undefined

        setHoverInfo({
          date: iso,
          open: Number(row.open), high: Number(row.high),
          low: Number(row.low), close: Number(row.close),
          changePercent: changePct,
          indicators: {
            sma20: row.indicators?.sma20,
            sma50: row.indicators?.sma50,
            sma200: row.indicators?.sma200,
            bb_upper: row.indicators?.bb_upper,
            bb_lower: row.indicators?.bb_lower,
          },
          indicatorLabels: indicatorLabelMap,
        })
      })

      chart.timeScale().fitContent()

      return () => { chart.remove(); chartRef.current = null; seriesRefs.current.clear() }
    } catch (error) { console.error('Failed to create asset chart', error) }
  }, [data, dimensions.width, dimensions.height])

  useEffect(() => {
    indicators.forEach((ind) => {
      const series = seriesRefs.current.get(ind.id)
      if (series && typeof series.applyOptions === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        series.applyOptions({ visible: ind.visible } as any)
      }
    })
  }, [indicators])

  return (
    <div className="space-y-2">
      <IndicatorToggles indicators={indicators} onToggle={handleIndicatorToggle} />
      <div className="relative">
        <div ref={chartContainerRef} className="h-[400px] w-full" />
        <FloatingTooltip data={hoverInfo} />
      </div>
    </div>
  )
}
