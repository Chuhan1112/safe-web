// Alert 警告提示组件 — error/warning/info 三种变体
import { cn } from '@/lib/utils'
import { XCircle, AlertTriangle, Info } from 'lucide-react'

interface AlertProps {
  variant: 'error' | 'warning' | 'info'
  title: string
  description?: string
  className?: string
}

const variantStyles = {
  error: {
    wrapper: 'border-destructive/50 bg-destructive/5 text-destructive',
    icon: XCircle,
  },
  warning: {
    wrapper: 'border-amber-500/50 bg-amber-500/5 text-amber-700 dark:text-amber-400',
    icon: AlertTriangle,
  },
  info: {
    wrapper: 'border-sky-500/50 bg-sky-500/5 text-sky-700 dark:text-sky-400',
    icon: Info,
  },
} as const

export function Alert({ variant, title, description, className }: AlertProps) {
  const { wrapper, icon: Icon } = variantStyles[variant]
  return (
    <div className={cn('rounded-lg border p-4', wrapper, className)} role="alert">
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-sm">{title}</h4>
          {description && <p className="text-sm mt-1 opacity-80">{description}</p>}
        </div>
      </div>
    </div>
  )
}
