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

  useEffect(() => {
    startValue.current = displayValue
    startTime.current = null
    let animationFrameId: number

    const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4)

    const animate = (time: number) => {
      if (!startTime.current) startTime.current = time
      const progress = time - startTime.current
      const progressRatio = Math.min(progress / duration, 1)
      const easedProgress = easeOutQuart(progressRatio)

      const nextValue = startValue.current + (value - startValue.current) * easedProgress
      setDisplayValue(nextValue)

      if (progressRatio < 1) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }

    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  }, [displayValue, duration, value])

  return <>{format(displayValue)}</>
}
