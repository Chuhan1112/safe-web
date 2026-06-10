// src/components/ResearchPage.tsx
import { useState, useEffect } from 'react'
import { mockResearchReports, getReportById } from '@/mock/researchData'
import type { ResearchReport } from '@/types/research'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Search, FileText, AlertTriangle, RefreshCw, HelpCircle, ExternalLink, Calendar, Layers, Target, WifiOff } from 'lucide-react'

const API_BASE = 'http://127.0.0.1:8000'

export function ResearchPage() {
  const [reports, setReports] = useState<ResearchReport[]>(mockResearchReports)
  const [selectedId, setSelectedId] = useState<string>(mockResearchReports[0]?.id ?? '')
  const [search, setSearch] = useState('')
  const [apiAvailable, setApiAvailable] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/research`)
      .then(res => res.json())
      .then(data => {
        if (data.reports?.length > 0) {
          setReports(data.reports)
          setApiAvailable(true)
        }
      })
      .catch(() => {
        // API unavailable, keep mock data
      })
  }, [])

  const filtered = reports.filter(r => {
    const q = search.toLowerCase()
    return r.symbol.toLowerCase().includes(q) || r.companyName.toLowerCase().includes(q)
  })

  const selected = getReportById(selectedId) ?? reports.find(r => r.id === selectedId)

  return (
    <div className="flex h-full">
      {/* Left panel: report list */}
      <div className="w-72 shrink-0 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索代码或名称..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-muted/50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary/50 focus:bg-muted"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              无匹配报告。在对话中说 "研究一下 AAPL" 生成新报告。
            </div>
          ) : (
            filtered.map(report => (
              <button
                key={report.id}
                onClick={() => setSelectedId(report.id)}
                className={cn(
                  'w-full border-b border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/50',
                  selectedId === report.id && 'bg-primary/5 border-l-2 border-l-primary',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{report.symbol}</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {report.depth}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{report.companyName}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{report.date}</p>
              </button>
            ))
          )}
        </div>
        <div className="p-2 border-t border-border space-y-1">
          {!apiAvailable && (
            <div className="flex items-center justify-center gap-1 text-[10px] text-amber-500">
              <WifiOff className="h-3 w-3" />
              API 离线，显示示例数据
            </div>
          )}
          <p className="text-[10px] text-muted-foreground text-center">
            在对话中说 <code className="bg-muted px-1 rounded">研究一下 SYMBOL</code> 生成新报告
          </p>
        </div>
      </div>

      {/* Right panel: report detail */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <ReportDetail report={selected} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-2">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">选择一份研究报告查看</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ReportDetail({ report }: { report: ResearchReport }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">{report.symbol}</h1>
            <Badge variant="secondary" className="text-[10px]">{report.companyName}</Badge>
            <Badge variant="outline" className="text-[10px]">{report.market}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{report.date} · {report.depth}</p>
        </div>
        <Badge variant="secondary" className={cn(
          'text-[10px]',
          report.judgmentConfidence === 'high' && 'bg-emerald-500/10 text-emerald-500',
          report.judgmentConfidence === 'medium' && 'bg-amber-500/10 text-amber-500',
          report.judgmentConfidence === 'low' && 'bg-red-500/10 text-red-500',
        )}>
          confidence: {report.judgmentConfidence}
        </Badge>
      </div>

      {/* Routing card */}
      <Card className="border-border/50 bg-muted/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{report.taskMode}</span>
            <span className="flex items-center gap-1"><Target className="h-3 w-3" />{report.primaryRoute}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{report.timeBoundary}</span>
          </div>
        </CardContent>
      </Card>

      {/* Core judgment */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">核心判断</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed">{report.coreJudgment}</p>
          <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
            <div className="flex items-start gap-2 text-xs">
              <span className="text-muted-foreground shrink-0">置信度依据:</span>
              <span>{report.confidenceBasis}</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <span className="text-muted-foreground shrink-0">翻转条件:</span>
              <span className="text-red-400">{report.reversalCondition}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Snapshot grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">数据快照</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {report.snapshot.map((row, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{row.label}</span>
                <span className="text-sm font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sources */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            来源
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5">
            {report.sources.map((s, i) => (
              <li key={i} className="text-xs flex items-start gap-2">
                <span className="text-muted-foreground shrink-0 mt-0.5">{i + 1}.</span>
                <div>
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground"> — {s.description}</span>
                  <span className="text-[10px] text-muted-foreground/60 ml-1">({s.timestamp})</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Source gaps */}
      {report.sourceGaps.length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5 text-amber-500">
              <AlertTriangle className="h-3.5 w-3.5" />
              来源缺口
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {report.sourceGaps.map((gap, i) => (
                <li key={i} className="text-xs text-amber-500/80 flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">•</span>
                  {gap}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Refresh conditions */}
      <Card className="border-border/50 bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            刷新条件
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground shrink-0">stale_after:</span>
            <span>{report.staleAfter}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground shrink-0">must_refresh_if:</span>
            <span>{report.mustRefreshIf}</span>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            Progressive Follow-Up
          </CardTitle>
          <CardDescription className="text-[10px]">
            rung: {report.followUp.rung} · route: {report.followUp.routeBinding} · impact: {report.followUp.decisionImpact}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{report.followUp.question}</p>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            锚点: {report.followUp.objectAnchor}
          </p>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground/60 text-center pb-4">
        Mira quick_map · 本输出是研究辅助，不是投资建议。
      </p>
    </div>
  )
}