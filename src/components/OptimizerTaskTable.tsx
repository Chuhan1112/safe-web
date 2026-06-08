import { memo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export interface OptimizerTask {
  task_id: string
  status: string
  progress: number
  processed: number
  total: number
  current_best: Record<string, unknown> | null
  result: Record<string, unknown> | null
  error: string | null
  started_at: string | null
  strategy_id: string | null
  market: string | null
  method: string | null
  metric: string | null
  finished_at: string | null
  experiment_id: string | null
  last_update_at: string | null
}

const STATUS_STYLES: Record<string, string> = {
  idle: 'bg-muted/60 text-muted-foreground border-border/50',
  running: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  error: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  aborted: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
}

const STATUS_LABELS: Record<string, string> = {
  idle: 'Idle',
  running: 'Running',
  completed: 'Done',
  error: 'Error',
  aborted: 'Aborted',
}

function formatTime(iso: string | null): string {
  if (!iso) return '--'
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return '--'
  }
}

export const OptimizerTaskTable = memo(({ tasks }: { tasks: OptimizerTask[] }) => {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground/50 text-sm">
        No optimization tasks yet.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent border-border/40">
          <TableHead className="h-9 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">Strategy</TableHead>
          <TableHead className="h-9 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">Market</TableHead>
          <TableHead className="h-9 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">Method</TableHead>
          <TableHead className="h-9 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">Status</TableHead>
          <TableHead className="h-9 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50 w-[180px]">Progress</TableHead>
          <TableHead className="h-9 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">Started</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const pct = Math.round((task.progress || 0) * 100)
          const statusKey = task.status || 'idle'
          return (
            <TableRow key={task.task_id} className="border-border/30 hover:bg-white/[0.02] transition-colors">
              <TableCell className="py-2.5 font-mono text-xs font-bold tracking-tight">
                {task.strategy_id || '--'}
              </TableCell>
              <TableCell className="py-2.5">
                <span className={cn(
                  "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase border",
                  task.market === 'CN'
                    ? "text-amber-600/70 border-amber-500/20 bg-amber-500/5"
                    : "text-blue-600/70 border-blue-500/20 bg-blue-500/5"
                )}>
                  {task.market || '--'}
                </span>
              </TableCell>
              <TableCell className="py-2.5 text-xs text-muted-foreground/70">
                {task.method || '--'}
              </TableCell>
              <TableCell className="py-2.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-black tracking-wider uppercase px-2 py-0 rounded-full border",
                    STATUS_STYLES[statusKey] || STATUS_STYLES.idle
                  )}
                >
                  {STATUS_LABELS[statusKey] || statusKey}
                </Badge>
              </TableCell>
              <TableCell className="py-2.5">
                <div className="flex items-center gap-2">
                  <Progress value={pct} className="h-1.5 flex-1" />
                  <span className="text-[10px] font-mono font-bold tabular-nums text-muted-foreground/60 w-8 text-right">
                    {pct}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="py-2.5 text-[11px] font-mono text-muted-foreground/50 tabular-nums">
                {formatTime(task.started_at)}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
})
