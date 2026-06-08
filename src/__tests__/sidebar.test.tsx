import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("lucide-react", () => ({
  BarChart3: () => <span>BarChart3</span>,
  LineChart: () => <span>LineChart</span>,
  ListChecks: () => <span>ListChecks</span>,
  Settings: () => <span>Settings</span>,
  Moon: () => <span>Moon</span>,
  Sun: () => <span>Sun</span>,
  HeartPulse: () => <span>HeartPulse</span>,
  FlaskConical: () => <span>FlaskConical</span>,
  ListTodo: () => <span>ListTodo</span>,
}))

vi.mock("@/contexts/MarketContext", () => ({
  useMarket: () => ({ market: "US", setMarket: vi.fn() }),
}))

import { Sidebar } from "@/components/Sidebar"

describe("Sidebar", () => {
  const defaultProps = {
    activeView: "backtest",
    onViewChange: vi.fn(),
    theme: "dark" as const,
    onThemeToggle: vi.fn(),
  }

  it("renders all navigation items", () => {
    const html = renderToStaticMarkup(<Sidebar {...defaultProps} />)
    expect(html).toContain("回测")
    expect(html).toContain("筛选")
    expect(html).toContain("信号")
    expect(html).toContain("设置")
  })

  it("renders theme toggle button", () => {
    const html = renderToStaticMarkup(<Sidebar {...defaultProps} />)
    expect(html).toContain("切换主题")
  })

  it("highlights active navigation item", () => {
    const html = renderToStaticMarkup(
      <Sidebar {...defaultProps} activeView="screener" />,
    )
    expect(html).toContain("bg-primary/10")
  })
})
