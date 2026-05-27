import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { ActionFilter } from "@/components/ActionFilter"

describe("ActionFilter", () => {
  it("renders all action buttons", () => {
    const html = renderToStaticMarkup(
      <ActionFilter selected={new Set()} onToggle={vi.fn()} />,
    )
    expect(html).toContain("BUY")
    expect(html).toContain("SELL")
    expect(html).toContain("HOLD")
  })

  it("highlights selected actions", () => {
    const html = renderToStaticMarkup(
      <ActionFilter selected={new Set(["BUY"])} onToggle={vi.fn()} />,
    )
    expect(html).toContain("border-emerald-500/30")
  })

  it("highlights SELL in red", () => {
    const html = renderToStaticMarkup(
      <ActionFilter selected={new Set(["SELL"])} onToggle={vi.fn()} />,
    )
    expect(html).toContain("border-red-500/30")
  })
})
