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
  // 用 ref 实时跟踪当前显示值，避免将 displayValue state 放入 effect 依赖
  const displayValueRef = useRef(0)

  useEffect(() => {
    // 以动画触发瞬间的实际显示值作为起始点，支持中途打断后平滑衔接
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
