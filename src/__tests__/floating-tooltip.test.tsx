import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { FloatingTooltip, type TooltipData } from "@/components/FloatingTooltip"

describe("FloatingTooltip", () => {
  it("returns null when data is null", () => {
    const html = renderToStaticMarkup(<FloatingTooltip data={null} />)
    expect(html).toBe("")
  })

  it("renders OHLC data", () => {
    const data: TooltipData = {
      date: "2025-03-07",
      open: 123.0,
      high: 127.0,
      low: 122.0,
      close: 126.0,
    }
    const html = renderToStaticMarkup(<FloatingTooltip data={data} />)
    expect(html).toContain("2025-03-07")
    expect(html).toContain("123.00")
    expect(html).toContain("127.00")
    expect(html).toContain("122.00")
    expect(html).toContain("126.00")
  })

  it("shows positive change in green", () => {
    const data: TooltipData = {
      date: "2025-03-07",
      open: 100,
      high: 110,
      low: 99,
      close: 105,
      changePercent: 5.0,
    }
    const html = renderToStaticMarkup(<FloatingTooltip data={data} />)
    expect(html).toContain("text-emerald-500")
    expect(html).toContain("+5.00%")
  })

  it("shows negative change in red", () => {
    const data: TooltipData = {
      date: "2025-03-07",
      open: 100,
      high: 102,
      low: 95,
      close: 97,
      changePercent: -3.0,
    }
    const html = renderToStaticMarkup(<FloatingTooltip data={data} />)
    expect(html).toContain("text-red-500")
  })

  it("renders indicator values", () => {
    const data: TooltipData = {
      date: "2025-03-07",
      open: 100,
      high: 105,
      low: 99,
      close: 103,
      indicators: { sma20: 101.5, sma50: 98.2 },
      indicatorLabels: {
        sma20: { label: "SMA20", color: "#fbbf24" },
        sma50: { label: "SMA50", color: "#3b82f6" },
      },
    }
    const html = renderToStaticMarkup(<FloatingTooltip data={data} />)
    expect(html).toContain("SMA20")
    expect(html).toContain("101.50")
    expect(html).toContain("SMA50")
    expect(html).toContain("98.20")
  })
})
