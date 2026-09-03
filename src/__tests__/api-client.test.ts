import { afterEach, describe, expect, it, vi } from "vitest"
import { api } from "@/lib/api/client"
import { requestCache } from "@/utils/requestCache"

describe("api.getTickerData", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // 回归：市场切换到 CN 后，必须把 market 透传给 /data/ticker 端点，
  // 否则后端会用 settings.market(默认 US) 创建 MarketContext，
  // 导致 CN ticker 走 US provider 拉不到数据 → 图表空白。
  it("把 market 拼接到 ticker 数据请求 URL", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ symbol: "600519.SS", data: [] }),
    }))
    vi.stubGlobal("fetch", fetchMock)

    await api.getTickerData("600519.SS", 100, "CN")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain("/data/ticker/600519.SS")
    expect(url).toContain("lookback=100")
    expect(url).toContain("market=CN")
  })

  it("未传 market 时不拼接 market 参数（保持向后兼容）", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ symbol: "AAPL", data: [] }),
    }))
    vi.stubGlobal("fetch", fetchMock)

    await api.getTickerData("AAPL", 756)

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).not.toContain("market=")
  })
})

describe("api.getScreenerStatus", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    // 清空 requestCache，避免跨用例残留
    requestCache.clear()
  })

  // 回归：缓存键必须按 market 分桶，否则切市场后 2s 内命中旧市场 running/idle 状态。
  it("market 不同的请求不共享缓存", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: "idle" }),
    }))
    vi.stubGlobal("fetch", fetchMock)

    await api.getScreenerStatus("US")
    await api.getScreenerStatus("CN")

    // 两次不同 market 应各自发一次真实请求（idle 会被缓存，但键不同）
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("同 market 的 idle 状态命中缓存（只发一次请求）", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: "idle" }),
    }))
    vi.stubGlobal("fetch", fetchMock)

    await api.getScreenerStatus("US")
    await api.getScreenerStatus("US")

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe("api.getSignals", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // 回归：必须透传 market，否则后端 /signals/latest 默认按 settings.market 跑。
  it("把 market 拼到 /signals/latest URL", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ signals: [], portfolio: [] }),
    }))
    vi.stubGlobal("fetch", fetchMock)

    await api.getSignals("MOMENTUM", "CN")

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain("/signals/latest")
    expect(url).toContain("strategy_id=MOMENTUM")
    expect(url).toContain("market=CN")
  })
})

describe("api.getPortfolioSignals", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("POST /signals/portfolio 并返回归一化结构", async () => {
    const mockResponse = {
      date: "2026-06-28",
      market_status: "Closed",
      portfolio: [
        {
          ticker: "600519.SS",
          weight: "12.5%",
          weight_value: 0.125,
          price: 1850.00,
          overlapping: true,
          sources: [
            { strategy: "PRACTICAL_BOLLINGER", weight: 0.08 },
            { strategy: "ULTIMATE_COMBINED", weight: 0.045 },
          ],
        },
      ],
      sub_portfolios: { PRACTICAL_BOLLINGER: [], ULTIMATE_COMBINED: [] },
      sub_signals: {},
      strategy_weights: { PRACTICAL_BOLLINGER: 0.58, ULTIMATE_COMBINED: 0.31, MOMENTUM_CONFIRM: 0.11 },
      cash_weight: "15.9%",
      metadata: { market: "CN", preset: "tuned", errors: [] },
    }

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => mockResponse,
    }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await api.getPortfolioSignals("tuned", undefined, undefined, "CN")

    // 验证请求体包含 preset 和 market
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain("/signals/portfolio")
    const body = JSON.parse(init.body)
    expect(body.preset).toBe("tuned")
    expect(body.market).toBe("CN")

    // 验证归一化结构
    expect(result.date).toBe("2026-06-28")
    expect(result.market_status).toBe("Closed")
    expect(result.portfolio).toHaveLength(1)
    expect(result.portfolio[0].ticker).toBe("600519.SS")
    expect(result.portfolio[0].weight).toBe("12.5%")
    expect(result.portfolio[0].weight_value).toBe(0.125)
    expect(result.portfolio[0].overlapping).toBe(true)
    expect(result.portfolio[0].sources).toHaveLength(2)
    expect(result.cash_weight).toBe("15.9%")
    expect(result.strategy_weights).toEqual({
      PRACTICAL_BOLLINGER: 0.58,
      ULTIMATE_COMBINED: 0.31,
      MOMENTUM_CONFIRM: 0.11,
    })
    expect(result.metadata.preset).toBe("tuned")
  })

  it("处理空响应时返回安全默认值", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({}),
    }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await api.getPortfolioSignals()

    expect(result.date).toBe("")
    expect(result.market_status).toBe("Unknown")
    expect(result.portfolio).toEqual([])
    expect(result.sub_portfolios).toEqual({})
    expect(result.strategy_weights).toEqual({})
    expect(result.cash_weight).toBe("0%")
    expect(result.metadata).toEqual({})
  })
})

describe("api.runScreener", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("把 market 拼接到 /screener/run URL", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: "running", data: [], started_at: new Date().toISOString() }),
    }))
    vi.stubGlobal("fetch", fetchMock)

    await api.runScreener(20, "CN")

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain("/screener/run")
    expect(url).toContain("top_n=20")
    expect(url).toContain("market=CN")
  })

  it("未传 market 时不拼接 market 参数", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: "running", data: [], started_at: new Date().toISOString() }),
    }))
    vi.stubGlobal("fetch", fetchMock)

    await api.runScreener(10)

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).not.toContain("market=")
  })
})

describe("api.getScreenerStatus URL 含 market", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // 回归：fetch 请求必须带 market 参数，否则后端按 settings.market 默认返回
  it("传 CN 时 URL 含 market=CN", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: "idle" }),
    }))
    vi.stubGlobal("fetch", fetchMock)

    await api.getScreenerStatus("CN")

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain("market=CN")
  })

  it("未传 market 时不拼接 market 参数", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: "idle" }),
    }))
    vi.stubGlobal("fetch", fetchMock)

    await api.getScreenerStatus()

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain("/screener/status")
    expect(url).not.toContain("market=")
  })
})

describe("api.runMarketSync", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("把 market 拼接到 /admin/sync/market URL", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ status: "ok" }),
    }))
    vi.stubGlobal("fetch", fetchMock)

    await api.runMarketSync("CN")

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain("/admin/sync/market")
    expect(url).toContain("market=CN")
  })
})
