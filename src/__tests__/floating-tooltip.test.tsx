import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { FloatingTooltip, type TooltipData } from "@/components/FloatingTooltip"
import { MarketProvider } from "@/contexts/MarketContext"

function renderTooltip(data: TooltipData | null) {
  return renderToStaticMarkup(
    <MarketProvider>
      <FloatingTooltip data={data} />
    </MarketProvider>,
  )
}

describe("FloatingTooltip", () => {
  it("returns null when data is null", () => {
    const html = renderTooltip(null)
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
    const html = renderTooltip(data)
    expect(html).toContain("2025-03-07")
    expect(html).toContain("123.00")
    expect(html).toContain("127.00")
    expect(html).toContain("122.00")
    expect(html).toContain("126.00")
  })

  it("shows positive change with up token (US default: green)", () => {
    const data: TooltipData = {
      date: "2025-03-07",
      open: 100,
      high: 110,
      low: 99,
      close: 105,
      changePercent: 5.0,
    }
    const html = renderTooltip(data)
    expect(html).toContain("text-data-up")
    expect(html).toContain("+5.00%")
  })

  it("shows negative change with down token (US default: red)", () => {
    const data: TooltipData = {
      date: "2025-03-07",
      open: 100,
      high: 102,
      low: 95,
      close: 97,
      changePercent: -3.0,
    }
    const html = renderTooltip(data)
    expect(html).toContain("text-data-down")
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
    const html = renderTooltip(data)
    expect(html).toContain("SMA20")
    expect(html).toContain("101.50")
    expect(html).toContain("SMA50")
    expect(html).toContain("98.20")
  })
})
