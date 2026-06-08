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
    if (sharedListeners.size === 0 && sharedRafId !== null) {
      cancelAnimationFrame(sharedRafId)
      sharedRafId = null
    }
  }
}

export function AnimatedNumber({
  value,
  duration = 1000,
  format = (val) => val.toFixed(2),
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const startTime = useRef<number | null>(null)
  const startValue = useRef(0)
  const displayValueRef = useRef(0)

  useEffect(() => {
    startValue.current = displayValueRef.current
    startTime.current = null

    const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4)

    const animate = () => {
      if (!startTime.current) startTime.current = performance.now()
      const progress = performance.now() - startTime.current
      const progressRatio = Math.min(progress / duration, 1)
      const easedProgress = easeOutQuart(progressRatio)

      const nextValue = startValue.current + (value - startValue.current) * easedProgress
      displayValueRef.current = nextValue
      setDisplayValue(nextValue)
    }

    const unsub = subscribeShared(animate)
    return unsub
  }, [value, duration])

  return <>{format(displayValue)}</>
}
