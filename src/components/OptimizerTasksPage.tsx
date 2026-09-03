import { useEffect, useState, useCallback } from 'react'
import { OptimizerTaskTable, type OptimizerTask } from '@/components/OptimizerTaskTable'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/PageContainer'
import { RefreshCw } from 'lucide-react'
import { useMarket } from '@/contexts/MarketContext'
import { usePolling } from '@/hooks/usePolling'
import { api } from '@/lib/api/client'

const POLL_INTERVAL_MS = 3000

function hasRunningTasks(tasks: OptimizerTask[]): boolean {
  return tasks.some((t) => t.status === 'running' || t.status === 'idle')
}

export function OptimizerTasksPage() {
  const { market } = useMarket()
  const [tasks, setTasks] = useState<OptimizerTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      const data = await api.get<OptimizerTask[]>('/backtest/optimize/tasks', { market })
      setTasks(data)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [market])

  // Initial fetch（切市场先清空旧列表，避免旧市场任务闪现）
  useEffect(() => {
    setTasks([])
    setError(null)
    setLoading(true)
    fetchTasks()
  }, [fetchTasks])

  // 有 running 任务时自动轮询，页面 hidden 时暂停
  usePolling(fetchTasks, POLL_INTERVAL_MS, hasRunningTasks(tasks))

  const handleRefresh = useCallback(() => {
    setLoading(true)
    fetchTasks()
  }, [fetchTasks])

  const runningCount = tasks.filter((t) => t.status === 'running' || t.status === 'idle').length

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Optimization Tasks</h1>
          <p className="text-xs text-muted-foreground/50 mt-1">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            {runningCount > 0 && (
              <span className="ml-2 text-blue-500/70">
                ({runningCount} running, auto-refreshing)
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="h-8 gap-1.5 text-xs"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
          {error}
        </div>
      )}

      <OptimizerTaskTable tasks={tasks} />
    </PageContainer>
  )
}
