import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  activityItems,
  catalogRows,
  workspaceCards,
  type StatusTone,
} from '@/mock/demoData'

const tabs = ['Overview', 'Catalog', 'Notes'] as const

const toneClasses: Record<StatusTone, string> = {
  stable: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20',
  watch: 'bg-amber-500/15 text-amber-200 border-amber-400/20',
  draft: 'bg-slate-500/15 text-slate-200 border-slate-400/20',
}

interface SafeWorkspaceProps {
  hasPrivateOverlay: boolean
  privateOverlayEnabled: boolean
}

export function SafeWorkspace({ hasPrivateOverlay, privateOverlayEnabled }: SafeWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview')

  const tabCopy = useMemo(() => {
    switch (activeTab) {
      case 'Catalog':
        return 'Safe building blocks and placeholder records for UI development.'
      case 'Notes':
        return 'Guardrails that help this package stay portable across devices.'
      default:
        return 'A company-safe front-end shell with mock-first data and neutral naming.'
    }
  }, [activeTab])

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 md:px-10">
      <header className="mb-8 flex flex-col gap-6 rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/25 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <Badge className="border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-primary">
              Safe Workspace
            </Badge>
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                Interface sandbox for cross-device development
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                Shared UI work lives here. Private flows can plug in locally on a trusted
                machine without changing the tracked codebase.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            <p className="font-semibold text-white">Overlay status</p>
            <p>{hasPrivateOverlay ? 'Local private overlay detected.' : 'No local private overlay found.'}</p>
            <p>
              {privateOverlayEnabled
                ? 'Private loading is enabled for this environment.'
                : 'Private loading is disabled by VITE_ENABLE_PRIVATE_OVERLAY=0.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition',
                activeTab === tab
                  ? 'border-primary/30 bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10',
              )}
            >
              {tab}
            </button>
          ))}
          <span className="text-sm text-slate-400">{tabCopy}</span>
        </div>
      </header>

      <main className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {workspaceCards.map((card) => (
              <Card
                key={card.title}
                className="border-white/10 bg-slate-950/70 shadow-xl shadow-slate-950/20 backdrop-blur"
              >
                <CardHeader className="space-y-3">
                  <CardDescription className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    {card.title}
                  </CardDescription>
                  <CardTitle className="text-4xl font-black text-white">
                    {card.value}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm font-semibold text-primary">{card.delta}</p>
                  <p className="text-sm leading-6 text-slate-300">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-white/10 bg-slate-950/70 shadow-xl shadow-slate-950/20 backdrop-blur">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <CardDescription className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Shared catalog
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-white">
                  Neutral modules for safe iteration
                </CardTitle>
              </div>
              <Badge className="w-fit border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                Mock data only
              </Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">Module</TableHead>
                    <TableHead className="text-slate-400">Surface</TableHead>
                    <TableHead className="text-slate-400">Owner</TableHead>
                    <TableHead className="text-slate-400">Freshness</TableHead>
                    <TableHead className="text-right text-slate-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalogRows.map((row) => (
                    <TableRow key={row.name} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-semibold text-white">{row.name}</TableCell>
                      <TableCell className="text-slate-300">{row.surface}</TableCell>
                      <TableCell className="text-slate-300">{row.owner}</TableCell>
                      <TableCell className="text-slate-300">{row.freshness}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize',
                            toneClasses[row.status],
                          )}
                        >
                          {row.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <Card className="border-white/10 bg-slate-950/70 shadow-xl shadow-slate-950/20 backdrop-blur">
            <CardHeader>
              <CardDescription className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Activity
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-white">
                Recent interface work
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activityItems.map((item) => (
                <div
                  key={`${item.time}-${item.title}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{item.title}</p>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-300">{item.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-primary/15 via-slate-950/80 to-slate-950/80 shadow-xl shadow-slate-950/20">
            <CardHeader>
              <CardDescription className="text-xs uppercase tracking-[0.22em] text-primary/80">
                Guardrails
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-white">
                Keep this package company-safe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-slate-200">
              <p>Use placeholder records instead of live services.</p>
              <p>Avoid business-specific names, formulas, or private document links.</p>
              <p>Put trusted-machine-only features under the ignored `src/private` folder.</p>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">
              Shared mode
            </Button>
            <Button
              variant="outline"
              className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
              disabled={!hasPrivateOverlay || !privateOverlayEnabled}
            >
              Local overlay available
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
