import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { StrategyParamSpec } from '@/lib/api/client'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface StrategyParamsPanelProps {
  params: StrategyParamSpec[]
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  className?: string
}

const GROUP_LABELS: Record<string, string> = {
  core: '核心信号',
  execution: '执行周期',
  risk: '短线风控',
  entry_quality: '入场质量',
  '确认': '确认逻辑',
}

const GROUP_ORDER = ['core', 'execution', 'risk', 'entry_quality', '确认']
const ADVANCED_GROUPS = new Set(['execution', 'risk', 'entry_quality'])

function groupOf(param: StrategyParamSpec): string {
  return param.group || 'core'
}

function groupLabel(key: string): string {
  return GROUP_LABELS[key] || key
}

function defaultHint(param: StrategyParamSpec): string {
  if (param.default === undefined || param.default === null) return ''
  return `默认 ${String(param.default)}`
}

export function StrategyParamsPanel({
  params,
  values,
  onChange,
  className,
}: StrategyParamsPanelProps) {
  const groups = useMemo(() => {
    const map = new Map<string, StrategyParamSpec[]>()
    for (const param of params) {
      const key = groupOf(param)
      map.set(key, [...(map.get(key) || []), param])
    }
    const order = new Map(GROUP_ORDER.map((key, index) => [key, index]))
    return [...map.entries()].sort(
      ([a], [b]) => (order.get(a) ?? 99) - (order.get(b) ?? 99),
    )
  }, [params])

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map(([key]) => [key, !ADVANCED_GROUPS.has(key)])),
  )

  return (
    <div className={cn('space-y-2', className)}>
      {groups.map(([group, groupParams]) => {
        const isOpen = expanded[group] ?? !ADVANCED_GROUPS.has(group)
        return (
          <div key={group} className="rounded-md border border-border/50 bg-background/30">
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left"
              onClick={() => setExpanded((prev) => ({ ...prev, [group]: !isOpen }))}
              aria-expanded={isOpen}
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                {isOpen ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                {groupLabel(group)}
                {ADVANCED_GROUPS.has(group) && (
                  <Badge variant="outline" className="h-4 px-1.5 py-0 text-2xs font-normal text-muted-foreground">
                    可选
                  </Badge>
                )}
              </span>
              <span className="text-2xs text-muted-foreground/60">{groupParams.length} 项</span>
            </button>
            {isOpen && (
              <div className="grid gap-3 border-t border-border/40 px-3 py-3 sm:grid-cols-2">
                {groupParams.map((param) => {
                  const value = values[param.key] ?? param.default
                  const inputId = `strategy-param-${param.key}`
                  return (
                    <div key={param.key} className={cn('space-y-1', param.type === 'boolean' && 'flex items-center justify-between gap-3')}>
                      <div className="space-y-0.5">
                        <Label htmlFor={inputId} className="text-xs font-medium">
                          {param.label || param.key}
                        </Label>
                        {param.description && (
                          <p className="text-2xs leading-snug text-muted-foreground/70">
                            {param.description}
                          </p>
                        )}
                      </div>
                      {param.type === 'boolean' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-2xs text-muted-foreground/60">
                            {value ? '开启' : '关闭'}
                          </span>
                          <Switch
                            id={inputId}
                            checked={Boolean(value)}
                            onCheckedChange={(checked) => onChange(param.key, checked)}
                          />
                        </div>
                      ) : param.type === 'select' && param.choices?.length ? (
                        <select
                          id={inputId}
                          className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm"
                          value={String(value ?? '')}
                          onChange={(event) => onChange(param.key, event.target.value)}
                        >
                          {param.choices.map((choice) => (
                            <option key={choice} value={choice}>
                              {choice}
                            </option>
                          ))}
                        </select>
                      ) : param.type === 'number' ? (
                        <div className="space-y-1">
                          <Input
                            id={inputId}
                            type="number"
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            value={value === undefined || value === null ? '' : String(value)}
                            onChange={(event) =>
                              onChange(
                                param.key,
                                event.target.value === '' ? '' : Number(event.target.value),
                              )
                            }
                          />
                          {defaultHint(param) && (
                            <span className="text-2xs text-muted-foreground/60">{defaultHint(param)}</span>
                          )}
                        </div>
                      ) : (
                        <Input
                          id={inputId}
                          value={value === undefined || value === null ? '' : String(value)}
                          onChange={(event) => onChange(param.key, event.target.value)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
