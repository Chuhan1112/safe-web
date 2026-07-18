// 页面统一容器 — 替代散落的 max-w-7xl / max-w-[1680px] / max-w-[1200px]
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-page px-4 md:px-6 lg:px-8 py-4 md:py-6', className)}>
      {children}
    </div>
  )
}
