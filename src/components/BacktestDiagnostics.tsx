import { AlertTriangle, ChevronDown, ChevronRight, Info } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface BacktestDiagnosticsProps {
  metrics?: {
    totalReturn?: number
    cagr?: number
    sharpe?: number
    totalTrades?: number
  }
}

const COMMON_ISSUES = [
  {
    title: '回测结果全为 0',
    causes: [
      '热身期不足：策略参数（如 SMA-200）需要足够的历史数据才能生效',
      '全部过滤：SMA 过滤条件过严，所有资产都被排除',
      '无再平衡日期：数据区间内没有月末交易日',
      '日期类型不匹配：再平衡日期为 Timestamp 但数据索引为字符串',
    ],
  },
  {
    title: '收益率为负或极低',
    causes: [
      '交易成本过高：cost_rate 设置过大，侵蚀利润',
      '数据区间过短：策略需要足够长的时间才能体现优势',
      '市场环境不利：所选区间市场整体下跌',
    ],
  },
  {
    title: '换手率异常',
    causes: [
      '相关性阈值过高：top_n 与 correlation_threshold 组合导致频繁切换持仓',
      '月度再平衡频率：当前仅支持月度调仓，日频参数不会生效',
    ],
  },
]

export function BacktestDiagnostics({ metrics }: BacktestDiagnosticsProps) {
  const [open, setOpen] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const hasSuspiciousResult =
    metrics &&
    (metrics.totalReturn === 0 ||
      (metrics.cagr !== undefined && metrics.cagr === 0) ||
      (metrics.totalTrades !== undefined && metrics.totalTrades === 0))

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="py-2 px-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasSuspiciousResult ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : (
              <Info className="h-4 w-4 text-muted-foreground" />
            )}
            <CardTitle className="text-xs font-medium">
              {hasSuspiciousResult ? '回测异常诊断' : '常见问题诊断'}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {hasSuspiciousResult && (
              <span className="text-[10px] text-amber-600 font-medium">
                检测到疑似异常
              </span>
            )}
            {open ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="px-3 pb-3 pt-0 space-y-2">
          {COMMON_ISSUES.map((issue, i) => (
            <div key={i}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1 text-xs font-medium w-full justify-start"
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedIdx(expandedIdx === i ? null : i)
                }}
              >
                {expandedIdx === i ? (
                  <ChevronDown className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 mr-1" />
                )}
                {issue.title}
              </Button>
              {expandedIdx === i && (
                <ul className="ml-6 mt-1 space-y-0.5">
                  {issue.causes.map((cause, j) => (
                    <li key={j} className="text-[11px] text-muted-foreground list-disc">
                      {cause}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  )
}
