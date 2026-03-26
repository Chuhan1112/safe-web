import { useMemo, useState } from 'react'
import { AssetChart } from '@/components/AssetChart'
import { BacktestChart } from '@/components/BacktestChart'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
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
  focusAssetSeries,
  noteBlocks,
  studioControls,
  studioLogs,
  studioScenarios,
  surfaceLibrary,
  workbenchSeries,
  workspaceCards,
  type StatusTone,
} from '@/mock/demoData'
import { ArrowUpRight, Layers3, ListFilter, Radar, ShieldCheck } from 'lucide-react'

const tabs = ['Overview', 'Studio', 'Collection', 'Notes'] as const

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
  const [selectedScenarioId, setSelectedScenarioId] = useState(studioScenarios[0]?.id ?? 'baseline')
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const [controlValues, setControlValues] = useState<Record<string, number>>(
    () => Object.fromEntries(studioControls.map((control) => [control.id, control.value])),
  )

  const selectedScenario =
    studioScenarios.find((scenario) => scenario.id === selectedScenarioId) ?? studioScenarios[0]
  const selectedLog = studioLogs.find((row) => row.id === selectedLogId) ?? null

  const tabCopy =
    activeTab === 'Studio'
      ? 'A richer mock-first workbench inspired by the local overlay, without private semantics.'
      : activeTab === 'Collection'
        ? 'Portable surfaces that can be shaped safely on any machine.'
        : activeTab === 'Notes'
          ? 'Guardrails for keeping the tracked package neutral and reusable.'
          : 'A company-safe front-end shell with denser interaction patterns and cleaner handoff paths.'

  const summaryMetrics = useMemo(() => {
    const window = controlValues.window ?? 6
    const cadence = controlValues.cadence ?? 3
    const focus = controlValues.focus ?? 45

    return {
      readiness: Math.min(96, 68 + window * 2 + cadence),
      coverage: Math.min(98, 78 + Math.round(focus / 4)),
      throughput: Math.max(5, 22 - cadence + Math.round(window / 2)),
    }
  }, [controlValues])

  const overviewPanel = (
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
              <CardTitle className="text-4xl font-black text-white">{card.value}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-semibold text-primary">{card.delta}</p>
              <p className="text-sm leading-6 text-slate-300">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
        <Card className="border-white/10 bg-slate-950/70 shadow-xl shadow-slate-950/20 backdrop-blur">
          <CardHeader className="space-y-3">
            <CardDescription className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Shared catalog
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-white">
              Neutral modules for safe iteration
            </CardTitle>
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

        <Card className="border-primary/20 bg-gradient-to-br from-primary/15 via-slate-950/80 to-slate-950/90 shadow-xl shadow-slate-950/20">
          <CardHeader>
            <CardDescription className="text-xs uppercase tracking-[0.22em] text-primary/80">
              Guardrails
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-white">
              Keep this package company-safe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-slate-200">
            {noteBlocks.map((block) => (
              <div key={block.title} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <p className="font-semibold text-white">{block.title}</p>
                <p className="mt-2 text-slate-200/85">{block.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )

  const studioPanel = (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr_1fr]">
        <Card className="border-white/10 bg-slate-950/70 shadow-xl shadow-slate-950/20 backdrop-blur">
          <CardHeader>
            <CardDescription className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Workbench controls
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-white">
              Shared interaction density
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {studioControls.map((control) => (
              <div key={control.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{control.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{control.description}</p>
                  </div>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {controlValues[control.id]}
                    {control.unit ?? ''}
                  </span>
                </div>
                <Slider
                  value={[controlValues[control.id]]}
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  onValueChange={(value) =>
                    setControlValues((current) => ({ ...current, [control.id]: value[0] }))
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/70 shadow-xl shadow-slate-950/20 backdrop-blur">
          <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <CardDescription className="text-xs uppercase tracking-[0.22em] text-slate-400">
                Studio preview
              </CardDescription>
              <CardTitle className="text-3xl font-black text-white">
                Workbench with richer shared surfaces
              </CardTitle>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                This panel borrows the density of the local overlay but stays neutral enough for
                company-safe iteration. Every record here is mock-first.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {studioScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => setSelectedScenarioId(scenario.id)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-semibold transition',
                    selectedScenarioId === scenario.id
                      ? 'border-primary/30 bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10',
                  )}
                >
                  {scenario.name}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Readiness</p>
                <p className="mt-3 text-3xl font-black text-white">{summaryMetrics.readiness}%</p>
                <p className="mt-2 text-sm text-slate-300">{selectedScenario.summary}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Mock coverage</p>
                <p className="mt-3 text-3xl font-black text-white">{summaryMetrics.coverage}%</p>
                <p className="mt-2 text-sm text-slate-300">{selectedScenario.emphasis}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Review queue</p>
                <p className="mt-3 text-3xl font-black text-white">{summaryMetrics.throughput}</p>
                <p className="mt-2 text-sm text-slate-300">Open surfaces ready for UI iteration.</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/15 p-4">
              <BacktestChart series={workbenchSeries} />
            </div>

            <div className="flex flex-wrap gap-3">
              <Badge className={cn('border px-3 py-1', toneClasses[selectedScenario.status])}>
                {selectedScenario.status}
              </Badge>
              <Badge className="border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                Owned by {selectedScenario.owner}
              </Badge>
              <Badge className="border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                Portable mock series
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/70 shadow-xl shadow-slate-950/20 backdrop-blur">
          <CardHeader>
            <CardDescription className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Focus preview
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-white">
              Neutral detail surface
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
              <AssetChart data={focusAssetSeries} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Preview target</p>
                <p className="mt-2 text-lg font-semibold text-white">Canvas detail module</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  A wide-detail experience that can be reviewed safely on any machine.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Why it matters</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  This is the closest shared analogue to the richer private dialogs, charts, and
                  table flows.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-slate-950/70 shadow-xl shadow-slate-950/20 backdrop-blur">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardDescription className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Review queue
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-white">
              Portable inspection records
            </CardTitle>
          </div>
          <Button
            variant="outline"
            className="w-fit border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
          >
            Refresh mock session
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-400">Surface</TableHead>
                <TableHead className="text-slate-400">Owner</TableHead>
                <TableHead className="text-slate-400">Stage</TableHead>
                <TableHead className="text-slate-400">Updated</TableHead>
                <TableHead className="text-right text-slate-400">Inspect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studioLogs.map((row) => (
                <TableRow key={row.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold text-white">{row.title}</p>
                      <p className="text-xs leading-5 text-slate-400">{row.summary}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{row.owner}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                        toneClasses[row.status],
                      )}
                    >
                      {row.stage}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-300">{row.updated}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      className="text-slate-200 hover:bg-white/10 hover:text-white"
                      onClick={() => setSelectedLogId(row.id)}
                    >
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )

  const collectionPanel = (
    <section className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-3">
        {surfaceLibrary.map((item, index) => {
          const Icon = [Layers3, Radar, ListFilter][index] ?? Layers3
          return (
            <Card
              key={item.title}
              className="border-white/10 bg-slate-950/70 shadow-xl shadow-slate-950/20 backdrop-blur"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                    {item.eyebrow}
                  </Badge>
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-white">{item.title}</CardTitle>
                  <CardDescription className="mt-2 text-sm leading-6 text-slate-300">
                    {item.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                  >
                    {bullet}
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-white/10 bg-slate-950/70 shadow-xl shadow-slate-950/20 backdrop-blur">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardDescription className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Shared surface matrix
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-white">
              Current tracked modules
            </CardTitle>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
            Safe handoff ready
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-400">Module</TableHead>
                <TableHead className="text-slate-400">Owner</TableHead>
                <TableHead className="text-slate-400">Surface</TableHead>
                <TableHead className="text-slate-400">Freshness</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalogRows.map((row) => (
                <TableRow key={row.name} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-semibold text-white">{row.name}</TableCell>
                  <TableCell className="text-slate-300">{row.owner}</TableCell>
                  <TableCell className="text-slate-300">{row.surface}</TableCell>
                  <TableCell className="text-slate-300">{row.freshness}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )

  const notesPanel = (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <Card className="border-white/10 bg-slate-950/70 shadow-xl shadow-slate-950/20 backdrop-blur">
        <CardHeader>
          <CardDescription className="text-xs uppercase tracking-[0.22em] text-slate-400">
            Field notes
          </CardDescription>
          <CardTitle className="text-2xl font-bold text-white">
            What makes this workspace safe to carry
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

      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-slate-950/80 to-slate-950/95 shadow-xl shadow-slate-950/20">
        <CardHeader>
          <CardDescription className="text-xs uppercase tracking-[0.22em] text-primary/80">
            Overlay status
          </CardDescription>
          <CardTitle className="text-2xl font-bold text-white">
            Shared and local can coexist cleanly
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-slate-200">
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/15 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-white">Overlay detected</p>
              <p>{hasPrivateOverlay ? 'A local private overlay is available on this machine.' : 'No local private overlay was found.'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/15 p-4">
            <ArrowUpRight className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-white">Runtime mode</p>
              <p>
                {privateOverlayEnabled
                  ? 'Private overlay loading is enabled when a trusted local module exists.'
                  : 'Private loading is disabled with VITE_ENABLE_PRIVATE_OVERLAY=0.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )

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
                Interface sandbox with a richer shared workbench
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                The tracked layer now carries more of the real front-end feeling: denser controls,
                chart-driven previews, inspection dialogs, and collection tables, all without
                private semantics.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:w-[320px]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <p className="font-semibold text-white">Overlay status</p>
              <p className="mt-2">
                {hasPrivateOverlay ? 'Local private overlay detected.' : 'No local private overlay found.'}
              </p>
              <p className="mt-1">
                {privateOverlayEnabled
                  ? 'Private loading is enabled for this environment.'
                  : 'Private loading is disabled by VITE_ENABLE_PRIVATE_OVERLAY=0.'}
              </p>
            </div>
            <div className="rounded-2xl border border-primary/15 bg-primary/10 p-4 text-sm text-primary-foreground/90">
              <p className="font-semibold text-white">Current focus</p>
              <p className="mt-2 text-slate-100">
                Grow the shared shell until company-laptop work feels close to home-machine work.
              </p>
            </div>
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

      <main className="space-y-6">
        <div className={activeTab !== 'Overview' ? 'hidden' : ''}>{overviewPanel}</div>
        <div className={activeTab !== 'Studio' ? 'hidden' : ''}>{studioPanel}</div>
        <div className={activeTab !== 'Collection' ? 'hidden' : ''}>{collectionPanel}</div>
        <div className={activeTab !== 'Notes' ? 'hidden' : ''}>{notesPanel}</div>
      </main>

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLogId(null)}>
        <DialogContent className="max-w-3xl border-white/10 bg-slate-950/95 text-white backdrop-blur-xl">
          {selectedLog && (
            <>
              <DialogHeader className="space-y-3">
                <Badge className={cn('w-fit border px-3 py-1', toneClasses[selectedLog.status])}>
                  {selectedLog.stage}
                </Badge>
                <DialogTitle className="text-3xl font-black tracking-tight text-white">
                  {selectedLog.title}
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-slate-300">
                  {selectedLog.summary}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Owner</p>
                  <p className="mt-2 text-lg font-semibold text-white">{selectedLog.owner}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Updated</p>
                  <p className="mt-2 text-lg font-semibold text-white">{selectedLog.updated}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Context</p>
                  <p className="mt-2 text-lg font-semibold text-white">Portable review target</p>
                </div>
              </div>

              <div className="space-y-3 rounded-[24px] border border-white/10 bg-black/15 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Inspection notes</p>
                {selectedLog.notes.map((note) => (
                  <div
                    key={note}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-200"
                  >
                    {note}
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
