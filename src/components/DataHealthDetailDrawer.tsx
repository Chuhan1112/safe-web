import { memo, useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TickerHealthDetail {
  symbol: string
  market: string
  latest_date: string | null
  effective_date: string
  status: string
  name: string | null
  missing_days: number
  anomaly_count: number
  provider: string | null
  last_checked_at: string
  notes: string[]
}

interface DataHealthDetailDrawerProps {
  ticker: TickerHealthDetail | null
  onClose: () => void
  onRepair?: (symbol: string) => Promise<void>
}

const STATUS_LABEL: Record<string, string> = {
  healthy: '健康',
  stale: '过期',
  missing: '缺失',
  anomaly: '异常',
  unknown: '未知',
}

export const DataHealthDetailDrawer = memo(function DataHealthDetailDrawer({
  ticker,
  onClose,
  onRepair,
}: DataHealthDetailDrawerProps) {
  const [repairing, setRepairing] = useState(false)

  const handleRepair = useCallback(async () => {
    if (!ticker || !onRepair) return
    setRepairing(true)
    try {
      await onRepair(ticker.symbol)
    } finally {
      setRepairing(false)
    }
  }, [ticker, onRepair])

  if (!ticker) return null

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col border-l bg-background shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-lg font-semibold">
          {ticker.symbol}{ticker.name && ` - ${ticker.name}`}
        </h2>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-4">
          {/* 基本信息 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">市场</span>
                <span>{ticker.market}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">状态</span>
                <Badge variant="outline" className="text-xs">
                  {STATUS_LABEL[ticker.status] ?? ticker.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">最新数据日期</span>
                <span className="font-mono">{ticker.latest_date ?? '无数据'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">有效交易日</span>
                <span className="font-mono">{ticker.effective_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">缺失天数</span>
                <span className={cn(ticker.missing_days > 0 && 'text-amber-600 dark:text-amber-400')}>
                  {ticker.missing_days}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">异常数</span>
                <span className={cn(ticker.anomaly_count > 0 && 'text-red-600 dark:text-red-400')}>
                  {ticker.anomaly_count}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">数据源</span>
                <span>{ticker.provider ?? '--'}</span>
              </div>
            </CardContent>
          </Card>

          {/* 备注 */}
          {ticker.notes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">诊断信息</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {ticker.notes.map((note, i) => (
                    <li key={i} className="text-muted-foreground">
                      {note}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4">
        {onRepair && (
          <Button
            onClick={handleRepair}
            disabled={repairing}
            className="w-full"
            variant={ticker.status === 'healthy' ? 'outline' : 'default'}
          >
            {repairing ? '修复中...' : '修复数据'}
          </Button>
        )}
      </div>
    </div>
  )
})
