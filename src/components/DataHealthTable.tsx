import { memo } from 'react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface TickerHealthRow {
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

interface DataHealthTableProps {
  data: TickerHealthRow[]
  onSelect?: (ticker: TickerHealthRow) => void
  selectedSymbol?: string | null
  market?: string
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  healthy: { label: '健康', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
  stale: { label: '过期', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  missing: { label: '缺失', className: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30' },
  anomaly: { label: '异常', className: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30' },
  unknown: { label: '未知', className: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/30' },
}

const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.unknown
  return (
    <Badge variant="outline" className={cn('text-xs', config.className)}>
      {config.label}
    </Badge>
  )
})

export const DataHealthTable = memo(function DataHealthTable({
  data,
  onSelect,
  selectedSymbol,
  market = 'US',
}: DataHealthTableProps) {
  const showName = market === 'CN'
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        暂无数据
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>代码</TableHead>
            {showName && <TableHead>名称</TableHead>}
            <TableHead>状态</TableHead>
            <TableHead>最新日期</TableHead>
            <TableHead>缺失天数</TableHead>
            <TableHead>异常数</TableHead>
            <TableHead>数据源</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row.symbol}
              className={cn(
                'cursor-pointer',
                selectedSymbol === row.symbol && 'bg-muted/80',
              )}
              onClick={() => onSelect?.(row)}
            >
              <TableCell className="font-mono font-medium">
                {row.symbol}
              </TableCell>
              {showName && (
                <TableCell className="text-muted-foreground">
                  {row.name || '--'}
                </TableCell>
              )}
              <TableCell>
                <StatusBadge status={row.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.latest_date ?? '--'}
              </TableCell>
              <TableCell>
                {row.missing_days > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400">
                    {row.missing_days}
                  </span>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </TableCell>
              <TableCell>
                {row.anomaly_count > 0 ? (
                  <span className="text-red-600 dark:text-red-400">
                    {row.anomaly_count}
                  </span>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.provider ?? '--'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
})
