import { useCallback, useEffect, useMemo, useRef } from 'react'

/**
 * 市场作用域守卫（canonical）：一切跨 market 异步写回走这里。
 *
 * 代替各组件手写的代际 ref / abort 散件。用法：
 *   const scope = useMarketScope(market)
 *   const run = async () => {
 *     const gen = scope.claim()
 *     const data = await api.get(url, { market }, scope.getSignal())
 *     if (!scope.alive(gen)) return   // 切市场后落定直接丢弃
 *     setData(data)
 *   }
 *
 * 语义：
 * - 切市场/卸载自动 abort 上一代 signal（api.get/post 均支持 signal）。
 * - 同市场内后发起的请求同样使先前请求失效（last-wins），轮询/连点天然安全。
 */
export function useMarketScope(market: string) {
  const genRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    genRef.current += 1
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    return () => controller.abort()
  }, [market])

  const claim = useCallback(() => {
    genRef.current += 1
    return genRef.current
  }, [])

  const alive = useCallback((gen: number) => gen === genRef.current, [])

  const getSignal = useCallback(() => abortRef.current?.signal, [])

  // 返回对象引用稳定，调用方可安全放进 useCallback/useEffect 依赖
  return useMemo(() => ({ claim, alive, getSignal }), [claim, alive, getSignal])
}
