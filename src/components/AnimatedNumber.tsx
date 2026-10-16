import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  format?: (val: number) => string
}

/** 监听器返回 true 表示"我还在动"，返回 false 表示已收敛。 */
type FrameListener = () => boolean

let sharedRafId: number | null = null
const sharedListeners = new Set<FrameListener>()

function runSharedRaf() {
  const loop = () => {
    let stillAnimating = false
    sharedListeners.forEach((fn) => {
      if (fn()) stillAnimating = true
    })
    if (stillAnimating) {
      sharedRafId = requestAnimationFrame(loop)
    } else {
      // 全部收敛 → 停表。之前这里无条件续帧，只要还有一个 <AnimatedNumber>
      // 挂在树上，就永远以 60 Hz 空转（实测：空闲期 ~120 帧/4s，零 DOM 变更、
      // 零可见效果），白烧主线程与电量。
      sharedRafId = null
    }
  }
  sharedRafId = requestAnimationFrame(loop)
}

function subscribeShared(fn: FrameListener): () => void {
  sharedListeners.add(fn)
  if (sharedRafId === null) runSharedRaf()
  return () => {
    sharedListeners.delete(fn)
    // 最后实例卸载后立即停止共享 RAF，不留延迟
    if (sharedListeners.size === 0 && sharedRafId !== null) {
      cancelAnimationFrame(sharedRafId)
      sharedRafId = null
    }
  }
}

/**
 * Critically damped spring, closed form: x(t) = 1 - (1 + wt)e^(-wt).
 *
 * This is the step response of a spring that never overshoots, which is what
 * you want for a number ticker — an overshooting count would briefly show a
 * value past the true one. Normalised so x(1) is exactly 1, otherwise the
 * clamped progress would park the ticker a fraction of a percent short of its
 * target forever.
 *
 * `OMEGA` sets how decisively it settles inside the given duration: higher is
 * snappier off the mark. 10 keeps a readable ramp at the start of the count
 * while still landing cleanly.
 */
const OMEGA = 10
const springStepAt = (t: number) => 1 - (1 + OMEGA * t) * Math.exp(-OMEGA * t)
const SPRING_STEP_NORM = springStepAt(1)

export function AnimatedNumber({
  value,
  duration = 700,
  format = (val) => val.toFixed(2),
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const startTime = useRef<number | null>(null)
  const startValue = useRef(0)
  const displayValueRef = useRef(0)

  useEffect(() => {
    startValue.current = displayValueRef.current
    startTime.current = null

    const reduced = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const animate = (): boolean => {
      if (!startTime.current) startTime.current = performance.now()
      const progress = performance.now() - startTime.current
      const progressRatio = reduced ? 1 : Math.min(progress / duration, 1)

      // Land exactly on the target at t=1 instead of accumulating float drift.
      const nextValue = progressRatio >= 1
        ? value
        : startValue.current
          + (value - startValue.current) * (springStepAt(progressRatio) / SPRING_STEP_NORM)

      displayValueRef.current = nextValue
      setDisplayValue(nextValue)
      // 已落到目标值 → 通知共享循环停表（值再次变化时 effect 重跑会重新订阅）
      return progressRatio < 1
    }

    const unsub = subscribeShared(animate)
    return unsub
  }, [value, duration])

  return <>{format(displayValue)}</>
}
