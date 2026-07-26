// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server"
import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getInitialTheme, useIsDark } from "@/hooks/useIsDark"

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
  Sparkles: () => <span>Sparkles</span>,
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
    expect(html).toContain("切换到 Perplexity 主题")
  })

  it("highlights active public item", () => {
    const html = renderToStaticMarkup(
      <Sidebar {...defaultProps} activeView="optimizer" />,
    )
    expect(html).toContain("bg-primary/10")
  })

  it("shows correct theme toggle title for perplexity theme", () => {
    const html = renderToStaticMarkup(<Sidebar {...defaultProps} theme="perplexity" />)
    expect(html).toContain('title="切换到 Light 主题"')
    expect(html).toContain("Sparkles")
  })

  it("shows correct theme toggle title for light theme", () => {
    const html = renderToStaticMarkup(<Sidebar {...defaultProps} theme="light" />)
    expect(html).toContain('title="切换到 Dark 主题"')
    expect(html).toContain("Sun")
  })

  it("shows correct theme toggle title for dark theme", () => {
    const html = renderToStaticMarkup(<Sidebar {...defaultProps} theme="dark" />)
    expect(html).toContain('title="切换到 Perplexity 主题"')
    expect(html).toContain("Moon")
  })

  it("cycles theme titles correctly through three states", () => {
    const titles = {
      light: '切换到 Dark 主题',
      dark: '切换到 Perplexity 主题',
      perplexity: '切换到 Light 主题',
    }
    for (const [theme, expectedTitle] of Object.entries(titles)) {
      const html = renderToStaticMarkup(
        <Sidebar {...defaultProps} theme={theme as "light" | "dark" | "perplexity"} />,
      )
      expect(html).toContain(`title="${expectedTitle}"`)
    }
  })
})

describe("useIsDark", () => {
  it("returns true for perplexity theme argument", () => {
    const { result } = renderHook(() => useIsDark("perplexity"))
    expect(result.current).toBe(true)
  })

  it("returns true for dark theme argument", () => {
    const { result } = renderHook(() => useIsDark("dark"))
    expect(result.current).toBe(true)
  })

  it("returns false for light theme argument", () => {
    const { result } = renderHook(() => useIsDark("light"))
    expect(result.current).toBe(false)
  })

  it("observes DOM class for perplexity and returns true", async () => {
    document.documentElement.classList.remove("light", "perplexity")
    act(() => {
      document.documentElement.classList.add("perplexity")
    })
    const { result } = renderHook(() => useIsDark())
    await waitFor(() => expect(result.current).toBe(true))
    act(() => {
      document.documentElement.classList.remove("perplexity")
    })
  })

  it("observes DOM class changes reactively", async () => {
    document.documentElement.classList.remove("light", "perplexity")
    const { result } = renderHook(() => useIsDark())
    await waitFor(() => expect(result.current).toBe(true)) // no 'light' class → dark

    act(() => {
      document.documentElement.classList.add("light")
    })
    await waitFor(() => expect(result.current).toBe(false))
    act(() => {
      document.documentElement.classList.remove("light")
    })
  })
})

describe("getInitialTheme", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("light", "dark", "perplexity")
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("light", "dark", "perplexity")
  })

  it("restores perplexity theme from localStorage", () => {
    localStorage.setItem("theme", "perplexity")
    expect(getInitialTheme()).toBe("perplexity")
  })

  it("restores light and dark from localStorage", () => {
    localStorage.setItem("theme", "light")
    expect(getInitialTheme()).toBe("light")
    localStorage.setItem("theme", "dark")
    expect(getInitialTheme()).toBe("dark")
  })

  it("falls back to dark for invalid localStorage value", () => {
    localStorage.setItem("theme", "invalid-value")
    expect(getInitialTheme()).toBe("dark")
  })

  it("reads perplexity from <html> class when localStorage is empty", () => {
    document.documentElement.classList.add("perplexity")
    expect(getInitialTheme()).toBe("perplexity")
  })

  it("reads light from <html> class when localStorage is empty", () => {
    document.documentElement.classList.add("light")
    expect(getInitialTheme()).toBe("light")
  })

  it("defaults to dark when no stored theme and no class", () => {
    expect(getInitialTheme()).toBe("dark")
  })

  it("localStorage wins over <html> class", () => {
    localStorage.setItem("theme", "perplexity")
    document.documentElement.classList.add("light")
    expect(getInitialTheme()).toBe("perplexity")
  })
})
