/* eslint-disable @typescript-eslint/no-explicit-any */
// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, act, cleanup } from "@testing-library/react"

afterEach(cleanup)

const { mockGetSyncStatus } = vi.hoisted(() => ({
  mockGetSyncStatus: vi.fn(),
}))

// Mock useMarket hook
vi.mock("@/contexts/MarketContext", () => ({
  useMarket: vi.fn(() => ({ market: "US" as const, setMarket: vi.fn() })),
  MarketProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock 同步状态 API（静态渲染测试不触发 effect，此 mock 仅供 DEGRADED 交互测试使用）
vi.mock("@/lib/api/client", () => ({
  api: {
    getSyncStatus: mockGetSyncStatus,
    runMarketSync: vi.fn(),
    runOptionsSync: vi.fn(),
    runIntradaySync: vi.fn(),
    reloadCaches: vi.fn(),
  },
}))

// 市场作用域守卫：返回稳定单例，避免每次渲染新引用导致 effect 反复触发
vi.mock("@/hooks/useMarketScope", () => {
  const scope = {
    claim: () => 1,
    alive: () => true,
    getSignal: () => undefined,
  }
  return { useMarketScope: () => scope }
})

// 捕获 polling 回调，便于手动触发第二次拉取（running → DEGRADED）
let pollCallback: (() => Promise<void>) | null = null
vi.mock("@/hooks/usePolling", () => ({
  usePolling: (cb: () => Promise<void>) => {
    pollCallback = cb
  },
}))

// Mock dependencies
vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

vi.mock("@/components/ui/progress", () => ({
  Progress: (props: any) => <div {...props} />,
}))

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}))

// 文案经 props 注入（组件不再依赖 @/private），测试直接传字典
const STRINGS = {
  en: {
    data_management: "Data Management",
    grab_data: "Market Data",
    market_sync_desc: "Sync market data",
    grab_option_data: "Options Data",
    options_sync_desc: "Sync options",
    grab_intraday_data: "Intraday Data",
    intraday_sync_desc: "Sync intraday",
    reload_data: "Reload",
    idle: "Idle",
    running: "Running",
    completed: "Completed",
    error: "Error",
    processing: "Processing",
    last_success: "Last Success",
    run_scan: "Run",
    scorer_desc: "Description",
  },
  zh: {
    data_management: "数据管理",
    grab_data: "市场数据",
    market_sync_desc: "同步市场数据",
    grab_option_data: "期权数据",
    options_sync_desc: "同步期权",
    grab_intraday_data: "盘中数据",
    intraday_sync_desc: "同步盘中",
    reload_data: "重载",
    idle: "空闲",
    running: "运行中",
    completed: "已完成",
    error: "错误",
    processing: "处理中",
    last_success: "上次成功",
    run_scan: "执行",
    scorer_desc: "描述",
  },
} satisfies Record<'zh' | 'en', DataManagementStrings>

import { DataManagement, type DataManagementStrings } from "@/components/DataManagement"
import { useMarket } from "@/contexts/MarketContext"

describe("DataManagement CN market hides Options/Intraday", () => {
  beforeEach(() => {
    vi.mocked(useMarket).mockReturnValue({ market: "CN" as const, setMarket: vi.fn() })
  })

  it("CN 市场不渲染 Options 同步卡片", () => {
    const html = renderToStaticMarkup(
      <DataManagement t={{ ...STRINGS.zh }} />,
    )

    // CN 市场应该显示市场数据，但不显示期权/盘中
    expect(html).toContain("市场数据")
    expect(html).not.toContain("期权数据")
    expect(html).not.toContain("盘中数据")
  })

  it("CN 市场不渲染 Intraday 同步卡片", () => {
    const html = renderToStaticMarkup(
      <DataManagement t={{ ...STRINGS.en }} />,
    )

    expect(html).toContain("Market Data")
    expect(html).not.toContain("Options Data")
    expect(html).not.toContain("Intraday Data")
  })
})

describe("DataManagement US market shows all sync cards", () => {
  beforeEach(() => {
    vi.mocked(useMarket).mockReturnValue({ market: "US" as const, setMarket: vi.fn() })
  })

  it("CN 切换到 US 时不会改变 Hook 顺序", async () => {
    mockGetSyncStatus.mockResolvedValue({
      market: { status: "completed" },
      options: { status: "idle" },
      intraday: { status: "idle" },
    })
    vi.mocked(useMarket).mockReturnValue({ market: "CN" as const, setMarket: vi.fn() })

    const { rerender } = render(<DataManagement t={{ ...STRINGS.en }} />)

    await waitFor(() => {
      expect(screen.getByText("Market Data")).toBeTruthy()
    })
    expect(screen.queryByText("Options Data")).toBeNull()

    vi.mocked(useMarket).mockReturnValue({ market: "US" as const, setMarket: vi.fn() })
    rerender(<DataManagement t={{ ...STRINGS.en }} />)

    await waitFor(() => {
      expect(screen.getByText("Options Data")).toBeTruthy()
      expect(screen.getByText("Intraday Data")).toBeTruthy()
    })
  })

  it("US 市场渲染全部三张同步卡片", () => {
    const html = renderToStaticMarkup(
      <DataManagement t={{ ...STRINGS.zh }} />,
    )

    expect(html).toContain("市场数据")
    expect(html).toContain("期权数据")
    expect(html).toContain("盘中数据")
  })
})

describe("DataManagement DEGRADED 黄条", () => {
  beforeEach(() => {
    vi.mocked(useMarket).mockReturnValue({ market: "US" as const, setMarket: vi.fn() })
    mockGetSyncStatus.mockReset()
    pollCallback = null
  })

  it("running → DEGRADED 展示黄色 Badge、原因文案并派发 data:sync-complete", async () => {
    mockGetSyncStatus
      .mockResolvedValueOnce({
        market: { status: "running" },
        options: { status: "idle" },
        intraday: { status: "idle" },
      })
      .mockResolvedValueOnce({
        market: {
          status: "DEGRADED",
          degraded: true,
          reason_code: "PARTIAL_DATA",
          should_reload: true,
        },
        options: { status: "idle" },
        intraday: { status: "idle" },
      })

    const handler = vi.fn()
    window.addEventListener("data:sync-complete", handler)

    render(<DataManagement t={{ ...STRINGS.en }} />)

    // 先 running（Badge + Button 共两处）
    await waitFor(() => {
      expect(screen.getAllByText("Running").length).toBeGreaterThan(0)
    })

    // 手动触发第二次拉取 → DEGRADED
    expect(pollCallback).toBeTruthy()
    await act(async () => {
      await pollCallback!()
    })

    await waitFor(() => {
      // 黄色 Badge：amber 样式且不用 emerald 绿色
      const badge = screen.getByText("Completed")
      expect(badge.className).toContain("bg-amber-500/10")
      expect(badge.className).not.toContain("bg-emerald-500/10")
    })

    // 原因文案 + 保留原始 reason_code
    expect(screen.getByText(/部分数据已写入/)).toBeTruthy()
    expect(screen.getByText(/PARTIAL_DATA/)).toBeTruthy()
    // should_reload 展示增量已重载信息（不调用 reload API）
    expect(screen.getByText(/增量已重载/)).toBeTruthy()

    // running → DEGRADED 触发 data:sync-complete 事件
    await waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(1)
    })

    window.removeEventListener("data:sync-complete", handler)
  })

  it("全部 fresh_skipped 时成功数仍显示为总数", async () => {
    mockGetSyncStatus.mockResolvedValue({
      market: {
        status: "completed",
        data: {
          total: 515,
          valid: 515,
          fresh_skipped: 515,
          network_fetched: 0,
          elapsed_seconds: 2.4,
        },
      },
      options: { status: "idle" },
      intraday: { status: "idle" },
    })

    render(<DataManagement t={{ ...STRINGS.en }} />)

    await waitFor(() => {
      expect(screen.getByText(/515\s*\/\s*515/)).toBeTruthy()
    })
  })
})
