import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("lucide-react", () => ({
  BarChart3: () => <span>BarChart3</span>,
  LineChart: () => <span>LineChart</span>,
  Target: () => <span>Target</span>,
  Zap: () => <span>Zap</span>,
  Database: () => <span>Database</span>,
  ListChecks: () => <span>ListChecks</span>,
  HeartPulse: () => <span>HeartPulse</span>,
  FlaskConical: () => <span>FlaskConical</span>,
  Search: () => <span>Search</span>,
  Moon: () => <span>Moon</span>,
  Sun: () => <span>Sun</span>,
  Wifi: () => <span>Wifi</span>,
  WifiOff: () => <span>WifiOff</span>,
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
    canOpenPrivate: false,
    onNavigateToPrivate: vi.fn(),
  }

  it("renders public navigation items", () => {
    const html = renderToStaticMarkup(<Sidebar {...defaultProps} />)
    expect(html).toContain("回测")
    expect(html).toContain("优化")
    expect(html).toContain("健康")
    expect(html).toContain("实验")
    expect(html).toContain("信号")
    expect(html).toContain("研究")
  })

  it("hides private items when canOpenPrivate is false", () => {
    const html = renderToStaticMarkup(<Sidebar {...defaultProps} canOpenPrivate={false} />)
    // 用 title="筛选" / title="打分" / title="数据" 做精确匹配，
    // 避免 DataStatusDot 的 title="数据状态未知" 误匹配
    expect(html).not.toContain('title="筛选"')
    expect(html).not.toContain('title="打分"')
    expect(html).not.toContain('title="数据"')
  })

  it("shows private items when canOpenPrivate is true", () => {
    const html = renderToStaticMarkup(<Sidebar {...defaultProps} canOpenPrivate={true} />)
    expect(html).toContain('title="筛选"')
    expect(html).toContain('title="打分"')
    expect(html).toContain('title="数据"')
  })

  it("renders theme toggle button", () => {
    const html = renderToStaticMarkup(<Sidebar {...defaultProps} />)
    expect(html).toContain("切换主题")
  })

  it("highlights active public item", () => {
    const html = renderToStaticMarkup(
      <Sidebar {...defaultProps} activeView="optimizer" />,
    )
    expect(html).toContain("bg-primary/10")
  })
})
