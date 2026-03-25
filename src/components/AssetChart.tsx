import { CandlestickSeries, ColorType, createChart, LineSeries } from 'lightweight-charts'
import type { BusinessDay, IChartApi, MouseEventParams, Time } from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'

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
      rsi?: number
    }
  }[]
}

interface HoverInfo {
  date: string
  open: number
  high: number
  low: number
  close: number
  indicators?: {
    sma20?: number
    sma50?: number
    sma200?: number
    bb_upper?: number
    bb_lower?: number
  }
}

const toBusinessDate = (raw: string): { iso: string; businessDay: BusinessDay } | null => {
  if (!raw) return null
  const value = String(raw).trim().split(' ')[0]

  let matched = value.match(/^(\d{2})-(\d{2})-(\d{2})$/)
  if (matched) {
    const year = 2000 + Number(matched[1])
    const month = Number(matched[2])
    const day = Number(matched[3])
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return {
        iso: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        businessDay: { year, month, day },
      }
    }
  }

  matched = value.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/)
  if (matched) {
    const year = Number(matched[1])
    const month = Number(matched[2])
    const day = Number(matched[3])
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return {
        iso: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        businessDay: { year, month, day },
      }
    }
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  const year = parsed.getFullYear()
  const month = parsed.getMonth() + 1
  const day = parsed.getDate()
  return {
    iso: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    businessDay: { year, month, day },
  }
}

const timeToIso = (time: unknown): string | null => {
  if (!time) return null
  if (typeof time === 'string') return toBusinessDate(time)?.iso ?? null
  if (typeof time === 'number') {
    const date = new Date(time * 1000)
    if (Number.isNaN(date.getTime())) return null
    return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  if (typeof time === 'object' && time !== null && 'year' in time && 'month' in time && 'day' in time) {
    const parsed = time as { year: number; month: number; day: number }
    return `${String(parsed.year).padStart(4, '0')}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`
  }
  return null
}

export const AssetChart = ({ data }: AssetChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 })
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return
      const { width, height } = entries[0].contentRect
      if (width > 0) {
        setDimensions({ width, height: height || 400 })
        if (chartRef.current) {
          chartRef.current.applyOptions({ width, height: height || 400 })
        }
      }
    })

    resizeObserver.observe(chartContainerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (dimensions.width === 0 || !chartContainerRef.current || !data || data.length === 0) return

    const isDark = document.documentElement.classList.contains('dark')

    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    try {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: isDark ? '#d1d5db' : '#334155',
        },
        localization: {
          locale: 'zh-CN',
          dateFormat: 'yyyy-MM-dd',
        },
        grid: {
          vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
          horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
        },
        width: dimensions.width,
        height: dimensions.height,
        timeScale: {
          borderColor: isDark ? '#374151' : '#e5e7eb',
          timeVisible: false,
          secondsVisible: false,
          tickMarkFormatter: (time: Time) => {
            const iso = timeToIso(time)
            if (!iso) return ''
            const [year, month, day] = iso.split('-')
            return `${year}/${month}/${day}`
          },
        },
        rightPriceScale: {
          borderColor: isDark ? '#374151' : '#e5e7eb',
        },
      })

      chartRef.current = chart

      const normalized = data
        .map((item) => {
          const parsed = toBusinessDate(item.time)
          if (!parsed) return null
          if (item.open == null || item.high == null || item.low == null || item.close == null) return null
          return {
            ...item,
            iso: parsed.iso,
            businessDay: parsed.businessDay,
          }
        })
        .filter(Boolean) as Array<AssetChartProps['data'][number] & { iso: string; businessDay: BusinessDay }>

      if (normalized.length === 0) return

      const byIso = new Map<string, AssetChartProps['data'][number] & { iso: string; businessDay: BusinessDay }>()
      normalized.forEach((item) => byIso.set(item.iso, item))

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      })

      candleSeries.setData(
        normalized.map((item) => ({
          time: item.businessDay as Time,
          open: Number(item.open),
          high: Number(item.high),
          low: Number(item.low),
          close: Number(item.close),
        })),
      )

      const sma20Series = chart.addSeries(LineSeries, {
        color: '#fbbf24',
        lineWidth: 1,
        title: 'SMA 20',
        priceLineVisible: false,
      })
      sma20Series.setData(
        normalized
          .filter((item) => item.indicators?.sma20 != null)
          .map((item) => ({ time: item.businessDay as Time, value: Number(item.indicators!.sma20) })),
      )

      const sma50Series = chart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 1,
        title: 'SMA 50',
        priceLineVisible: false,
      })
      sma50Series.setData(
        normalized
          .filter((item) => item.indicators?.sma50 != null)
          .map((item) => ({ time: item.businessDay as Time, value: Number(item.indicators!.sma50) })),
      )

      const sma200Series = chart.addSeries(LineSeries, {
        color: '#ef4444',
        lineWidth: 2,
        title: 'SMA 200',
        priceLineVisible: false,
      })
      sma200Series.setData(
        normalized
          .filter((item) => item.indicators?.sma200 != null)
          .map((item) => ({ time: item.businessDay as Time, value: Number(item.indicators!.sma200) })),
      )

      const bbUpperSeries = chart.addSeries(LineSeries, {
        color: 'rgba(168, 85, 247, 0.5)',
        lineWidth: 1,
        lineStyle: 2,
        title: 'BB Upper',
        priceLineVisible: false,
      })
      bbUpperSeries.setData(
        normalized
          .filter((item) => item.indicators?.bb_upper != null)
          .map((item) => ({ time: item.businessDay as Time, value: Number(item.indicators!.bb_upper) })),
      )

      const bbLowerSeries = chart.addSeries(LineSeries, {
        color: 'rgba(168, 85, 247, 0.5)',
        lineWidth: 1,
        lineStyle: 2,
        title: 'BB Lower',
        priceLineVisible: false,
      })
      bbLowerSeries.setData(
        normalized
          .filter((item) => item.indicators?.bb_lower != null)
          .map((item) => ({ time: item.businessDay as Time, value: Number(item.indicators!.bb_lower) })),
      )

      chart.subscribeCrosshairMove((param: MouseEventParams<Time>) => {
        const iso = timeToIso(param?.time)
        if (!iso) {
          setHoverInfo(null)
          return
        }
        const row = byIso.get(iso)
        if (!row) {
          setHoverInfo(null)
          return
        }

        setHoverInfo({
          date: iso,
          open: Number(row.open),
          high: Number(row.high),
          low: Number(row.low),
          close: Number(row.close),
          indicators: {
            sma20: row.indicators?.sma20,
            sma50: row.indicators?.sma50,
            sma200: row.indicators?.sma200,
            bb_upper: row.indicators?.bb_upper,
            bb_lower: row.indicators?.bb_lower,
          },
        })
      })

      chart.timeScale().fitContent()
    } catch (error) {
      console.error('Chart render error:', error)
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [data, dimensions.width, dimensions.height])

  return (
    <div className="space-y-3">
      <div ref={chartContainerRef} className="h-[400px] w-full" />
      {hoverInfo && (
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/60 bg-card/60 p-3 text-xs md:grid-cols-6">
          <div>
            <div className="text-muted-foreground">Date</div>
            <div className="font-mono">{hoverInfo.date}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Open</div>
            <div className="font-mono">{hoverInfo.open.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">High</div>
            <div className="font-mono">{hoverInfo.high.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Low</div>
            <div className="font-mono">{hoverInfo.low.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Close</div>
            <div className="font-mono">{hoverInfo.close.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">SMA20</div>
            <div className="font-mono">
              {hoverInfo.indicators?.sma20 != null ? hoverInfo.indicators.sma20.toFixed(2) : '--'}
            </div>
          </div>
        </div>
      )}
      {(!data || data.length === 0) && (
        <div className="rounded-lg border border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
          No chart data available
        </div>
      )}
    </div>
  )
}
