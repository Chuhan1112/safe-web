import { useEffect, useRef } from 'react'
import { usePageVisible } from './usePageVisible'

/**
 * 轮询 hook：页面可见时定时执行回调，hidden 时暂停，卸载时清理。
 * 使用 callback ref 避免因 callback 身份变化导致 interval 重建。
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled: boolean = true,
) {
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  })

  const visible = usePageVisible()

  useEffect(() => {
    if (!enabled || !visible) return
    const id = setInterval(() => callbackRef.current(), intervalMs)
    return () => clearInterval(id)
  }, [enabled, visible, intervalMs])
}
