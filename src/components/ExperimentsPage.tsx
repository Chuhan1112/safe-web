import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMarket } from '@/contexts/MarketContext'

import { api } from '@/lib/api/client'

interface Experiment {
  id: string
  name: string
  type: string
  strategy_id: string
  market: string
  data_source: string
  start_date: string
  end_date: string
  params: Record<string, unknown>
  metrics: Record<string, unknown>
  result_summary: Record<string, unknown>
  created_at: string
}

interface RerunState {
  experimentId: string
  paramsJson: string
  running: boolean
  error: string
}

export const ExperimentsPage = () => {
  const { market: globalMarket } = useMarket()
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStrategy, setFilterStrategy] = useState('')
  const [filterMarket, setFilterMarket] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 调参重跑状态
  const [editingId, setEditingId] = useState<string | null>(null)
  const [rerunState, setRerunState] = useState<Record<string, RerunState>>({})
  // 重跑结果（BacktestResult 格式），key 为 "experimentId" 或 "experimentId:variant"
  const [rerunResults, setRerunResults] = useState<Record<string, {
    metrics: Record<string, number>
    equity_curve: { time: string; value: number }[]
    drawdown_curve: { time: string; value: number }[]
    logs: unknown[]
    trade_logs: unknown[]
  }>>({})

  // 切全局市场：跟随过滤 + 清空旧列表/选中/重跑结果，避免跨市场脏数据。
  // 注意后端 list_experiments 在 market 缺省时仍回落默认市场过滤，没有真正的"全部"语义，
  // 因此 filterMarket 恒为具体市场（US/CN），不保留空值。
  useEffect(() => {
    setFilterMarket(globalMarket)
    setExperiments([])
    setSelectedIds(new Set())
    setRerunResults({})
    setEditingId(null)
  }, [globalMarket])

  const fetchExperiments = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const data = await api.get<Experiment[]>(
        '/experiments',
        { strategy_id: filterStrategy || undefined, market: filterMarket || undefined },
        signal,
      )
      setExperiments(data)
    } finally {
      setLoading(false)
    }
  }, [filterStrategy, filterMarket])

  useEffect(() => {
    const controller = new AbortController()
    fetchExperiments(controller.signal).catch(() => {})
    return () => controller.abort()
  }, [fetchExperiments])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 3) next.add(id)
      return next
    })
  }

  const startEdit = (exp: Experiment) => {
    const pretty = JSON.stringify(exp.params, null, 2)
    setEditingId(exp.id)
    setRerunState((prev) => ({
      ...prev,
      [exp.id]: { experimentId: exp.id, paramsJson: pretty, running: false, error: '' },
    }))
  }

  const cancelEdit = (id: string) => {
    setEditingId(null)
    setRerunState((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const updateParamsJson = (id: string, json: string) => {
    setRerunState((prev) => ({
      ...prev,
      [id]: { ...(prev[id]!), paramsJson: json, error: '' },
    }))
  }

  const runRerun = async (exp: Experiment) => {
    const state = rerunState[exp.id]
    if (!state) return

    let paramOverrides: Record<string, unknown> = {}
    try {
      paramOverrides = JSON.parse(state.paramsJson)
    } catch {
      setRerunState((prev) => ({
        ...prev,
        [exp.id]: { ...state, error: 'JSON 解析失败，请检查格式' },
      }))
      return
    }

    setRerunState((prev) => ({
      ...prev,
      [exp.id]: { ...state, running: true, error: '' },
    }))

    try {
      const data = await api.post<{
        metrics: Record<string, number>
        equity_curve: { time: string; value: number }[]
        drawdown_curve: { time: string; value: number }[]
        logs: unknown[]
        trade_logs: unknown[]
      }>(`/experiments/${exp.id}/rerun`, { param_overrides: paramOverrides })

      // 标准化 metrics key（后端返回 snake_case）
      const raw = data.metrics || {}
      setRerunResults((prev) => ({
        ...prev,
        [exp.id]: {
          metrics: {
            total_return: raw.total_return ?? 0,
            cagr: raw.cagr ?? 0,
            sharpe: raw.sharpe ?? 0,
            max_drawdown: raw.max_drawdown ?? 0,
            turnover: raw.turnover ?? 0,
          },
          equity_curve: data.equity_curve || [],
          drawdown_curve: data.drawdown_curve || [],
          logs: data.logs || [],
          trade_logs: data.trade_logs || [],
        },
      }))
      // 成功后关闭编辑器
      setEditingId(null)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '未知错误'
      setRerunState((prev) => ({
        ...prev,
        [exp.id]: { ...state, running: false, error: msg },
      }))
    }
  }

  const selected = experiments.filter((e) => selectedIds.has(e.id))

  // 对比展示：原始实验 + 重跑结果
  const compareEntries = selected.map((exp) => {
    const rerun = rerunResults[exp.id]
    return { exp, rerun }
  })

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">实验记录本</h2>
        <Button variant="outline" size="sm" onClick={() => fetchExperiments()} disabled={loading}>
          {loading ? '加载中...' : '刷新'}
        </Button>
      </div>

      <div className="flex gap-2">
        <input
          value={filterStrategy}
          onChange={(e) => setFilterStrategy(e.target.value)}
          placeholder="策略 ID"
          className="rounded border bg-background px-2 py-1 text-sm"
        />
        <Select value={filterMarket} onValueChange={setFilterMarket}>
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue placeholder="市场" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="US">美股</SelectItem>
            <SelectItem value="CN">A股</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selected.length >= 2 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="mb-2 text-sm font-medium">对比 ({selected.length})</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {compareEntries.map(({ exp, rerun }) => (
                <div key={exp.id} className="rounded border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-mono text-xs text-muted-foreground">{exp.id}</div>
                    {exp.type === 'backtest' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-2xs"
                        onClick={() => startEdit(exp)}
                      >
                        调参重跑
                      </Button>
                    )}
                  </div>
                  <div className="font-medium">{exp.name || exp.strategy_id}</div>

                  {/* 参数编辑器 */}
                  {editingId === exp.id && rerunState[exp.id] && (
                    <div className="mt-2 space-y-1.5">
                      <Textarea
                        className="w-full h-24 font-mono text-xs resize-y"
                        value={rerunState[exp.id]!.paramsJson}
                        onChange={(e) => updateParamsJson(exp.id, e.target.value)}
                        spellCheck={false}
                      />
                      {rerunState[exp.id]!.error && (
                        <div className="text-2xs text-red-500">{rerunState[exp.id]!.error}</div>
                      )}
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="h-6 text-2xs"
                          disabled={rerunState[exp.id]!.running}
                          onClick={() => runRerun(exp)}
                        >
                          {rerunState[exp.id]!.running ? '运行中...' : '重跑'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-2xs"
                          onClick={() => cancelEdit(exp.id)}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 原始 metrics */}
                  <div className="mt-1 space-y-0.5">
                    <div className="text-2xs text-muted-foreground mb-0.5">
                      {rerun ? '原始' : ''}
                    </div>
                    {Object.entries(exp.metrics).slice(0, 5).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-mono text-xs font-medium tabular-nums">{typeof v === 'number' ? v.toFixed(4) : String(v)}</span>
                      </div>
                    ))}
                  </div>

                  {/* 重跑结果 metrics */}
                  {rerun && (
                    <div className="mt-2 pt-2 border-t border-dashed space-y-0.5">
                      <div className="text-2xs text-primary mb-0.5">重跑结果</div>
                      {Object.entries(rerun.metrics).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="font-mono text-xs font-medium tabular-nums text-primary">
                            {typeof v === 'number' ? v.toFixed(4) : String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experiments.map((exp) => (
                <TableRow key={exp.id} className="cursor-pointer" onClick={() => toggleSelect(exp.id)}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(exp.id)}
                      onChange={() => toggleSelect(exp.id)}
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{exp.id}</TableCell>
                  <TableCell>{exp.name || '-'}</TableCell>
                  <TableCell><Badge variant="outline">{exp.type}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{exp.strategy_id}</TableCell>
                  <TableCell>{exp.market}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{exp.created_at}</TableCell>
                </TableRow>
              ))}
              {experiments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                    暂无实验记录
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
