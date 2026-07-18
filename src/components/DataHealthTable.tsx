import { memo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { sortBySeverity, type TickerHealthRow, type ViewMode } from '@/utils/dataHealth'

interface DataHealthTableProps {
  data: TickerHealthRow[]
  onSelect?: (ticker: TickerHealthRow) => void
  selectedSymbol?: string | null
  market?: string
  viewMode?: ViewMode
}

const MAX_DEFAULT_ROWS = 200

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
  viewMode = 'limited',
}: DataHealthTableProps) {
  const showName = market === 'CN'

  // ── 排序与截断 ────────────────────────────────────────────

  const filtered =
    viewMode === 'abnormal'
      ? data.filter((row) => row.status !== 'healthy')
      : data

  const sorted = sortBySeverity(filtered)
  const displayRows =
    viewMode === 'limited'
      ? sorted.slice(0, MAX_DEFAULT_ROWS)
      : sorted

  // ── 虚拟滚动 ────────────────────────────────────────────
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // TanStack Virtual 返回的函数无法被 React Compiler 安全 memo 化（已知误报，按官方文档用法）
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: displayRows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48,
    overscan: 10,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        暂无数据
      </div>
    )
  }

  return (
    <div ref={tableContainerRef} className="relative w-full overflow-auto" style={{ maxHeight: '600px' }}>
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
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
          {/* 撑开滚动高度的占位行 */}
          <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            <td colSpan={showName ? 7 : 6} />
          </tr>
        </TableBody>
      </Table>

      {/* 虚拟化行，绝对定位叠在占位行上 */}
      <div
        className="absolute left-0 right-0 top-0"
        style={{ paddingTop: `${virtualItems[0]?.start ?? 0}px` }}
      >
        {virtualItems.map((virtualRow) => {
          const row = displayRows[virtualRow.index]
          if (!row) return null
          return (
            <div
              key={row.symbol}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className={cn(
                'absolute left-0 right-0 flex items-center border-b cursor-pointer hover:bg-muted/50',
                selectedSymbol === row.symbol && 'bg-muted/80',
              )}
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              onClick={() => onSelect?.(row)}
            >
              <div className="w-[120px] px-4 py-2 font-mono font-medium text-sm">{row.symbol}</div>
              {showName && (
                <div className="w-[160px] px-4 py-2 text-muted-foreground text-sm">{row.name || '--'}</div>
              )}
              <div className="w-[80px] px-4 py-2">
                <StatusBadge status={row.status} />
              </div>
              <div className="w-[120px] px-4 py-2 text-muted-foreground text-sm">{row.latest_date ?? '--'}</div>
              <div className="w-[80px] px-4 py-2 text-sm">
                {row.missing_days > 0 ? (
                  <span className="font-mono text-xs font-medium tabular-nums text-amber-600 dark:text-amber-400">{row.missing_days}</span>
                ) : (
                  <span className="font-mono text-xs font-medium tabular-nums text-muted-foreground">0</span>
                )}
              </div>
              <div className="w-[80px] px-4 py-2 text-sm">
                {row.anomaly_count > 0 ? (
                  <span className="font-mono text-xs font-medium tabular-nums text-red-600 dark:text-red-400">{row.anomaly_count}</span>
                ) : (
                  <span className="font-mono text-xs font-medium tabular-nums text-muted-foreground">0</span>
                )}
              </div>
              <div className="flex-1 px-4 py-2 text-muted-foreground text-sm">{row.provider ?? '--'}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
