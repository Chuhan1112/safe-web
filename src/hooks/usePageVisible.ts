import { useEffect, useState } from 'react'

/** 返回当前页签/窗口是否可见（document.visibilityState === 'visible'） */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true,
  )

  useEffect(() => {
    const handler = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  return visible
}
