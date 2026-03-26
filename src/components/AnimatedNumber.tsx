import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  format?: (val: number) => string
}

export function AnimatedNumber({
  value,
  duration = 1000,
  format = (val) => val.toFixed(2),
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const startTime = useRef<number | null>(null)
  const startValue = useRef(0)
  // Track the live displayed value so interrupted animations can continue smoothly
  const displayValueRef = useRef(0)

  useEffect(() => {
    // Restart from the current rendered number instead of the last committed prop value
    startValue.current = displayValueRef.current
    startTime.current = null
    let animationFrameId: number

    const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4)

    const animate = (time: number) => {
      if (!startTime.current) startTime.current = time
      const progress = time - startTime.current
      const progressRatio = Math.min(progress / duration, 1)
      const easedProgress = easeOutQuart(progressRatio)

      const nextValue = startValue.current + (value - startValue.current) * easedProgress
      displayValueRef.current = nextValue
      setDisplayValue(nextValue)

      if (progressRatio < 1) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  }, [value, duration])

  return <>{format(displayValue)}</>
}
