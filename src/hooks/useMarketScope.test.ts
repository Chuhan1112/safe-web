// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useMarketScope } from "@/hooks/useMarketScope"

describe("useMarketScope", () => {
  it("切市场后旧代际失效", () => {
    const { result, rerender } = renderHook(({ m }) => useMarketScope(m), {
      initialProps: { m: "US" },
    })
    const gen = result.current.claim()
    expect(result.current.alive(gen)).toBe(true)
    rerender({ m: "CN" })
    expect(result.current.alive(gen)).toBe(false)
  })

  it("同市场后发起的请求使先前请求失效（last-wins）", () => {
    const { result } = renderHook(() => useMarketScope("US"))
    const first = result.current.claim()
    const second = result.current.claim()
    expect(result.current.alive(first)).toBe(false)
    expect(result.current.alive(second)).toBe(true)
  })

  it("切市场 abort 旧 signal", () => {
    const { result, rerender } = renderHook(({ m }) => useMarketScope(m), {
      initialProps: { m: "US" },
    })
    const signal = result.current.getSignal()
    expect(signal?.aborted).toBe(false)
    act(() => {
      rerender({ m: "CN" })
    })
    expect(signal?.aborted).toBe(true)
    expect(result.current.getSignal()?.aborted).toBe(false)
  })

  it("返回对象引用稳定，可安全进 effect 依赖", () => {
    const { result, rerender } = renderHook(({ m }) => useMarketScope(m), {
      initialProps: { m: "US" },
    })
    const first = result.current
    rerender({ m: "US" })
    expect(result.current).toBe(first)
  })
})
