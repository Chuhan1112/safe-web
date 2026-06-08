import { useEffect, useRef } from 'react'
import { X, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Condition {
  name: string
  label: string
  passed: boolean
  value?: number | boolean | null
  threshold?: number | null
}

interface FactorContribution {
  name: string
  label: string
  score: number
  weight: number
}

interface SignalExplanationData {
  ticker: string
  action: string
  summary: string
  regime: string | null
  passed_conditions: Condition[]
  failed_conditions: Condition[]
  factor_contributions: FactorContribution[]
  risk_notes: string[]
}

interface SignalExplanationDrawerProps {
  open: boolean
  onClose: () => void
  data: SignalExplanationData | null
  loading?: boolean
}

export function SignalExplanationDrawer({
  open,
  onClose,
  data,
  loading = false,
}: SignalExplanationDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-md border-l',
          'bg-background/95 backdrop-blur-md shadow-xl',
          'flex flex-col',
          'animate-in slide-in-from-right duration-300',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">
            {data ? `${data.ticker} 信号解释` : '信号解释'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
              加载中...
            </div>
          )}

          {!loading && !data && (
            <div className="py-12 text-center text-muted-foreground">无数据</div>
          )}

          {!loading && data && (
            <>
              {/* Summary */}
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm leading-relaxed">{data.summary}</p>
                  {data.regime && (
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {data.regime}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Passed Conditions */}
              {data.passed_conditions.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-600">
                      通过条件
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.passed_conditions.map((c) => (
                      <div key={c.name} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                        <span>{c.label}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Failed Conditions */}
              {data.failed_conditions.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-600">
                      未通过条件
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.failed_conditions.map((c) => (
                      <div key={c.name} className="flex items-start gap-2 text-sm">
                        <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                        <span>{c.label}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Factor Contributions */}
              {data.factor_contributions.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      因子贡献
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.factor_contributions.map((f) => (
                      <div
                        key={f.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">{f.label}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'font-mono',
                              f.score > 0 ? 'text-emerald-600' : f.score < 0 ? 'text-red-600' : 'text-muted-foreground',
                            )}
                          >
                            {f.score > 0 ? '+' : ''}
                            {f.score.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            x{f.weight}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Risk Notes */}
              {data.risk_notes.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-amber-600">
                      风险提示
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.risk_notes.map((note, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                        <span>{note}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
