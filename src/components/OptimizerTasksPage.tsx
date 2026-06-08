import { useEffect, useState, useCallback, useRef } from 'react'
import { OptimizerTaskTable, type OptimizerTask } from '@/components/OptimizerTaskTable'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

const API_BASE = 'http://127.0.0.1:8000'
const POLL_INTERVAL_MS = 3000

function hasRunningTasks(tasks: OptimizerTask[]): boolean {
  return tasks.some((t) => t.status === 'running' || t.status === 'idle')
}

export function OptimizerTasksPage() {
  const [tasks, setTasks] = useState<OptimizerTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/backtest/optimize/tasks`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: OptimizerTask[] = await res.json()
      setTasks(data)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    setLoading(true)
    fetchTasks()
  }, [fetchTasks])

  // Auto-refresh when tasks are running
  useEffect(() => {
    if (hasRunningTasks(tasks)) {
      intervalRef.current = setInterval(fetchTasks, POLL_INTERVAL_MS)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [tasks, fetchTasks])

  const handleRefresh = useCallback(() => {
    setLoading(true)
    fetchTasks()
  }, [fetchTasks])

  const runningCount = tasks.filter((t) => t.status === 'running' || t.status === 'idle').length

  return (
    <div className="max-w-[1200px] mx-auto w-full px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-black tracking-tight">Optimization Tasks</h1>
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
    </div>
  )
}
