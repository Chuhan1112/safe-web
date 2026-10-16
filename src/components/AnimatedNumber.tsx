import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  format?: (val: number) => string
}

let sharedRafId: number | null = null
const sharedListeners = new Set<() => void>()

function runSharedRaf() {
  const loop = () => {
    sharedListeners.forEach(fn => fn())
    sharedRafId = requestAnimationFrame(loop)
  }
  sharedRafId = requestAnimationFrame(loop)
}

function subscribeShared(fn: () => void): () => void {
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

    const animate = () => {
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
    }

    const unsub = subscribeShared(animate)
    return unsub
  }, [value, duration])

  return <>{format(displayValue)}</>
}
