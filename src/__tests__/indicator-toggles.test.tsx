import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { IndicatorToggles, type IndicatorConfig } from "@/components/IndicatorToggles"

describe("IndicatorToggles", () => {
  const indicators: IndicatorConfig[] = [
    { id: "sma20", label: "SMA20", color: "#fbbf24", visible: true },
    { id: "sma50", label: "SMA50", color: "#3b82f6", visible: false },
  ]

  it("renders all indicator labels", () => {
    const html = renderToStaticMarkup(
      <IndicatorToggles indicators={indicators} onToggle={vi.fn()} />,
    )
    expect(html).toContain("SMA20")
    expect(html).toContain("SMA50")
  })

  it("shows checkmark for visible indicators", () => {
    const html = renderToStaticMarkup(
      <IndicatorToggles indicators={indicators} onToggle={vi.fn()} />,
    )
    expect(html).toContain("SMA20 ✓")
    expect(html).not.toContain("SMA50 ✓")
  })
})
