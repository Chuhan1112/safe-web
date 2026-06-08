import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useMarket } from '@/contexts/MarketContext'

const API = 'http://127.0.0.1:8000'

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

export const ExperimentsPage = () => {
  const { market: globalMarket } = useMarket()
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStrategy, setFilterStrategy] = useState('')
  const [filterMarket, setFilterMarket] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (filterMarket) {
      setFilterMarket(globalMarket)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalMarket])

  const fetchExperiments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStrategy) params.set('strategy_id', filterStrategy)
      if (filterMarket) params.set('market', filterMarket)
      const res = await fetch(`${API}/experiments?${params}`)
      if (res.ok) setExperiments(await res.json())
    } finally {
      setLoading(false)
    }
  }, [filterStrategy, filterMarket])

  useEffect(() => { fetchExperiments() }, [fetchExperiments])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 3) next.add(id)
      return next
    })
  }

  const selected = experiments.filter((e) => selectedIds.has(e.id))

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">实验记录本</h2>
        <Button variant="outline" size="sm" onClick={fetchExperiments} disabled={loading}>
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
        <select value={filterMarket} onChange={(e) => setFilterMarket(e.target.value)} className="rounded border bg-background px-2 py-1 text-sm">
          <option value="">全部市场</option>
          <option value="US">美股</option>
          <option value="CN">A股</option>
        </select>
      </div>

      {selected.length >= 2 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="mb-2 text-sm font-medium">对比 ({selected.length})</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {selected.map((exp) => (
                <div key={exp.id} className="rounded border p-3">
                  <div className="font-mono text-xs text-muted-foreground">{exp.id}</div>
                  <div className="font-medium">{exp.name || exp.strategy_id}</div>
                  <div className="mt-1 space-y-0.5">
                    {Object.entries(exp.metrics).slice(0, 5).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-mono">{typeof v === 'number' ? v.toFixed(4) : String(v)}</span>
                      </div>
                    ))}
                  </div>
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
