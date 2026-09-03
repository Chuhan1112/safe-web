/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi, beforeEach } from "vitest"

// Mock useMarket hook
vi.mock("@/contexts/MarketContext", () => ({
  useMarket: vi.fn(() => ({ market: "US" as const, setMarket: vi.fn() })),
  MarketProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

  it("US 市场渲染全部三张同步卡片", () => {
    const html = renderToStaticMarkup(
      <DataManagement t={{ ...STRINGS.zh }} />,
    )

    expect(html).toContain("市场数据")
    expect(html).toContain("期权数据")
    expect(html).toContain("盘中数据")
  })
})
