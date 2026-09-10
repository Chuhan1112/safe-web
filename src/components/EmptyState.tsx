// EmptyState 空状态占位组件 — 用于图表、表格等无数据场景
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  )
}
