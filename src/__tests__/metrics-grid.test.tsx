import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/AnimatedNumber", () => ({
  AnimatedNumber: ({ value, format }: { value: number; format?: (v: number) => string }) => (
    <span>{format ? format(value) : value}</span>
  ),
}))

import { MetricsGrid } from "@/components/MetricsGrid"

describe("MetricsGrid", () => {
  const metrics = [
    { label: "CAGR", value: 18.3, format: (v: number) => `${v.toFixed(1)}%` },
    { label: "Sharpe", value: 1.42 },
    { label: "Max DD", value: -12.5, format: (v: number) => `${v.toFixed(1)}%`, color: "text-red-500" },
  ]

  it("renders all metric labels", () => {
    const html = renderToStaticMarkup(<MetricsGrid metrics={metrics} />)
    expect(html).toContain("CAGR")
    expect(html).toContain("Sharpe")
    expect(html).toContain("Max DD")
  })

  it("formats values with custom format function", () => {
    const html = renderToStaticMarkup(<MetricsGrid metrics={metrics} />)
    expect(html).toContain("18.3%")
    expect(html).toContain("-12.5%")
  })

  it("applies custom color class", () => {
    const html = renderToStaticMarkup(<MetricsGrid metrics={metrics} />)
    expect(html).toContain("text-red-500")
  })
})
