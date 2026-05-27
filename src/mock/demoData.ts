export type StatusTone = 'stable' | 'watch' | 'draft'

export interface WorkspaceCard {
  title: string
  value: string
  delta: string
  description: string
}

export interface CatalogRow {
  name: string
  owner: string
  status: StatusTone
  freshness: string
  surface: string
}

export interface ActivityItem {
  title: string
  detail: string
  time: string
}

export interface StudioControl {
  id: string
  label: string
  min: number
  max: number
  step: number
  unit?: string
  value: number
  description: string
}

export interface StudioScenario {
  id: string
  name: string
  status: StatusTone
  owner: string
  summary: string
  emphasis: string
}

export interface StudioLogRow {
  id: string
  title: string
  owner: string
  stage: string
  updated: string
  status: StatusTone
  summary: string
  notes: string[]
}

export interface SurfaceLibraryItem {
  title: string
  eyebrow: string
  description: string
  bullets: string[]
}

export interface NoteBlock {
  title: string
  detail: string
}

export const workspaceCards: WorkspaceCard[] = [
  {
    title: 'Active surfaces',
    value: '12',
    delta: '+3 this week',
    description: 'Reusable views and shells prepared for iteration.',
  },
  {
    title: 'Mock coverage',
    value: '91%',
    delta: 'Up from 76%',
    description: 'Most flows now run without any live service dependency.',
  },
  {
    title: 'Release readiness',
    value: '7 / 10',
    delta: '2 blockers left',
    description: 'The remaining work is mostly fit and finish.',
  },
]

export const catalogRows: CatalogRow[] = [
  {
    name: 'Overview canvas',
    owner: 'Local',
    status: 'stable',
    freshness: 'Updated 2h ago',
    surface: 'Dashboard shell',
  },
  {
    name: 'Inspector panel',
    owner: 'Local',
    status: 'watch',
    freshness: 'Updated yesterday',
    surface: 'Detail drawer',
  },
  {
    name: 'Collection table',
    owner: 'Local',
    status: 'stable',
    freshness: 'Updated 3d ago',
    surface: 'Data view',
  },
  {
    name: 'Notes composer',
    owner: 'Local',
    status: 'draft',
    freshness: 'Updated 5d ago',
    surface: 'Text workflow',
  },
]

export const activityItems: ActivityItem[] = [
  {
    title: 'Refined navigation spacing',
    detail: 'Header density now scales better between laptop and desktop widths.',
    time: '09:20',
  },
  {
    title: 'Moved cards to mock-first data',
    detail: 'The app can be developed without any private endpoint or local service.',
    time: '11:05',
  },
  {
    title: 'Prepared safe handoff package',
    detail: 'Only generic labels, mock records, and reusable UI primitives remain.',
    time: '14:40',
  },
]

export const studioControls: StudioControl[] = [
  {
    id: 'window',
    label: 'Review window',
    min: 2,
    max: 12,
    step: 1,
    unit: 'w',
    value: 6,
    description: 'How much recent history should shape the preview narrative.',
  },
  {
    id: 'cadence',
    label: 'Update cadence',
    min: 1,
    max: 7,
    step: 1,
    unit: 'd',
    value: 3,
    description: 'A neutral control for testing compact/expanded summary rhythms.',
  },
  {
    id: 'focus',
    label: 'Highlight depth',
    min: 20,
    max: 80,
    step: 5,
    unit: '%',
    value: 45,
    description: 'Pushes emphasis between summary cards and detail rows.',
  },
]

export const studioScenarios: StudioScenario[] = [
  {
    id: 'baseline',
    name: 'Baseline rhythm',
    status: 'stable',
    owner: 'Shared',
    summary: 'Balanced density for laptop-first product work.',
    emphasis: 'Good default for day-to-day iteration.',
  },
  {
    id: 'compact',
    name: 'Compact review',
    status: 'watch',
    owner: 'Shared',
    summary: 'Denser summaries with quicker context scanning.',
    emphasis: 'Useful when many panels need to coexist in one viewport.',
  },
  {
    id: 'spotlight',
    name: 'Spotlight mode',
    status: 'draft',
    owner: 'Shared',
    summary: 'More dramatic emphasis on one active surface.',
    emphasis: 'Helpful for demo flows and design reviews.',
  },
]

export const studioLogs: StudioLogRow[] = [
  {
    id: 'log-01',
    title: 'Preview drawer pass',
    owner: 'Local',
    stage: 'Ready for review',
    updated: 'Today · 16:10',
    status: 'stable',
    summary: 'Detail copy and section spacing now align with the shared shell.',
    notes: [
      'Header actions collapse cleanly under tablet widths.',
      'CTA labels stay generic and service-free.',
      'No private identifiers appear in exported mock payloads.',
    ],
  },
  {
    id: 'log-02',
    title: 'Workbench controls',
    owner: 'Shared',
    stage: 'Watching',
    updated: 'Today · 13:45',
    status: 'watch',
    summary: 'Slider density feels strong, but some helper text may still be too quiet.',
    notes: [
      'Control grouping now mirrors the richer private workspace.',
      'Interaction uses only tracked shared primitives.',
      'Can be refined further without touching any sensitive logic.',
    ],
  },
  {
    id: 'log-03',
    title: 'Collection records',
    owner: 'Shared',
    stage: 'Drafting',
    updated: 'Yesterday · 18:20',
    status: 'draft',
    summary: 'Table structure is in place, but a stronger empty-state story may help.',
    notes: [
      'Current data is fully mocked and portable.',
      'Status badges intentionally avoid business-specific wording.',
      'Good candidate for company-laptop development.',
    ],
  },
]

export const surfaceLibrary: SurfaceLibraryItem[] = [
  {
    title: 'Workbench shell',
    eyebrow: 'Parameter-first',
    description: 'A dense control surface with chart, log, and inspector flows in one canvas.',
    bullets: ['Slider groups', 'Status chips', 'Modal inspection'],
  },
  {
    title: 'Preview detail',
    eyebrow: 'Context-first',
    description: 'A wide dialog that gives designers and developers a common review target.',
    bullets: ['Large headline', 'Support notes', 'Secondary metadata'],
  },
  {
    title: 'Collection matrix',
    eyebrow: 'Inventory-first',
    description: 'Shared rows stay neutral while preserving the richer table ergonomics.',
    bullets: ['Action column', 'Portable freshness labels', 'Safe handoff framing'],
  },
]

export const noteBlocks: NoteBlock[] = [
  {
    title: 'Keep the tracked layer neutral',
    detail: 'Names, labels, and examples should describe interface behavior, not a private system.',
  },
  {
    title: 'Use mocks that feel real enough',
    detail: 'The shared package should still feel like a working product, not a toy wireframe.',
  },
  {
    title: 'Hide trusted-machine flows behind the overlay',
    detail: 'If a feature needs live wiring or reveals internal intent, it belongs in src/private.',
  },
]

export const workbenchSeries = [
  {
    id: 'baseline',
    name: 'Baseline',
    color: '#38bdf8',
    opacity: 0.28,
    data: [
      { time: '2025-01-02', value: 100 },
      { time: '2025-01-09', value: 102 },
      { time: '2025-01-16', value: 101 },
      { time: '2025-01-23', value: 104 },
      { time: '2025-01-30', value: 108 },
      { time: '2025-02-06', value: 109 },
      { time: '2025-02-13', value: 111 },
      { time: '2025-02-20', value: 114 },
      { time: '2025-02-27', value: 116 },
      { time: '2025-03-06', value: 119 },
      { time: '2025-03-13', value: 121 },
      { time: '2025-03-20', value: 124 },
    ],
  },
  {
    id: 'compact',
    name: 'Compact',
    color: '#f59e0b',
    opacity: 0.22,
    data: [
      { time: '2025-01-02', value: 100 },
      { time: '2025-01-09', value: 101 },
      { time: '2025-01-16', value: 103 },
      { time: '2025-01-23', value: 105 },
      { time: '2025-01-30', value: 106 },
      { time: '2025-02-06', value: 108 },
      { time: '2025-02-13', value: 110 },
      { time: '2025-02-20', value: 111 },
      { time: '2025-02-27', value: 113 },
      { time: '2025-03-06', value: 115 },
      { time: '2025-03-13', value: 116 },
      { time: '2025-03-20', value: 118 },
    ],
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    color: '#8b5cf6',
    opacity: 0.24,
    data: [
      { time: '2025-01-02', value: 100 },
      { time: '2025-01-09', value: 99 },
      { time: '2025-01-16', value: 101 },
      { time: '2025-01-23', value: 103 },
      { time: '2025-01-30', value: 107 },
      { time: '2025-02-06', value: 106 },
      { time: '2025-02-13', value: 109 },
      { time: '2025-02-20', value: 113 },
      { time: '2025-02-27', value: 117 },
      { time: '2025-03-06', value: 118 },
      { time: '2025-03-13', value: 122 },
      { time: '2025-03-20', value: 127 },
    ],
  },
]

export const focusAssetSeries = [
  {
    time: '2025-03-03',
    open: 118,
    high: 121,
    low: 116,
    close: 120,
    indicators: { sma20: 116, sma50: 110, sma200: 102, bb_upper: 123, bb_lower: 109 },
  },
  {
    time: '2025-03-04',
    open: 120,
    high: 123,
    low: 119,
    close: 122,
    indicators: { sma20: 116.5, sma50: 110.4, sma200: 102.2, bb_upper: 123.8, bb_lower: 109.4 },
  },
  {
    time: '2025-03-05',
    open: 122,
    high: 125,
    low: 121,
    close: 124,
    indicators: { sma20: 117, sma50: 110.8, sma200: 102.5, bb_upper: 124.5, bb_lower: 109.8 },
  },
  {
    time: '2025-03-06',
    open: 124,
    high: 126,
    low: 122,
    close: 123,
    indicators: { sma20: 117.3, sma50: 111.2, sma200: 102.8, bb_upper: 125.1, bb_lower: 110.1 },
  },
  {
    time: '2025-03-07',
    open: 123,
    high: 127,
    low: 122,
    close: 126,
    indicators: { sma20: 117.8, sma50: 111.7, sma200: 103.1, bb_upper: 126.2, bb_lower: 110.6 },
  },
  {
    time: '2025-03-10',
    open: 126,
    high: 128,
    low: 124,
    close: 125,
    indicators: { sma20: 118.2, sma50: 112.1, sma200: 103.4, bb_upper: 126.8, bb_lower: 111 },
  },
  {
    time: '2025-03-11',
    open: 125,
    high: 129,
    low: 124,
    close: 128,
    indicators: { sma20: 118.7, sma50: 112.6, sma200: 103.7, bb_upper: 127.9, bb_lower: 111.5 },
  },
  {
    time: '2025-03-12',
    open: 128,
    high: 130,
    low: 126,
    close: 129,
    indicators: { sma20: 119.2, sma50: 113, sma200: 104, bb_upper: 128.6, bb_lower: 111.9 },
  },
  {
    time: '2025-03-13',
    open: 129,
    high: 131,
    low: 127,
    close: 130,
    indicators: { sma20: 119.8, sma50: 113.4, sma200: 104.4, bb_upper: 129.2, bb_lower: 112.4 },
  },
  {
    time: '2025-03-14',
    open: 130,
    high: 132,
    low: 128,
    close: 131,
    indicators: { sma20: 120.4, sma50: 113.9, sma200: 104.7, bb_upper: 130.1, bb_lower: 112.8 },
  },
]

// ---- Backtest mock data ----

export interface BacktestMetrics {
  cagr: number
  sharpe: number
  maxDrawdown: number
  winRate: number
  totalTrades: number
  totalReturn: number
}

export const mockBacktestMetrics: BacktestMetrics = {
  cagr: 18.3,
  sharpe: 1.42,
  maxDrawdown: -12.5,
  winRate: 62.8,
  totalTrades: 156,
  totalReturn: 83.2,
}

export const mockEquityCurve = [
  { time: '2023-01-02', value: 100000 },
  { time: '2023-02-01', value: 103200 },
  { time: '2023-03-01', value: 101800 },
  { time: '2023-04-03', value: 105600 },
  { time: '2023-05-01', value: 108400 },
  { time: '2023-06-01', value: 107100 },
  { time: '2023-07-03', value: 112300 },
  { time: '2023-08-01', value: 110800 },
  { time: '2023-09-01', value: 109200 },
  { time: '2023-10-02', value: 113500 },
  { time: '2023-11-01', value: 116200 },
  { time: '2023-12-01', value: 119800 },
  { time: '2024-01-02', value: 122400 },
  { time: '2024-02-01', value: 125100 },
  { time: '2024-03-01', value: 123800 },
  { time: '2024-04-01', value: 128300 },
  { time: '2024-05-01', value: 131200 },
  { time: '2024-06-03', value: 129500 },
  { time: '2024-07-01', value: 134800 },
  { time: '2024-08-01', value: 133100 },
  { time: '2024-09-02', value: 136200 },
  { time: '2024-10-01', value: 138900 },
  { time: '2024-11-01', value: 141500 },
  { time: '2024-12-02', value: 143200 },
]

export const mockDrawdownCurve = [
  { time: '2023-01-02', value: 0 },
  { time: '2023-02-01', value: -0.5 },
  { time: '2023-03-01', value: -2.1 },
  { time: '2023-04-03', value: -0.8 },
  { time: '2023-05-01', value: -1.2 },
  { time: '2023-06-01', value: -3.5 },
  { time: '2023-07-03', value: -1.0 },
  { time: '2023-08-01', value: -2.8 },
  { time: '2023-09-01', value: -4.2 },
  { time: '2023-10-02', value: -1.5 },
  { time: '2023-11-01', value: -0.6 },
  { time: '2023-12-01', value: -0.3 },
  { time: '2024-01-02', value: -1.8 },
  { time: '2024-02-01', value: -0.9 },
  { time: '2024-03-01', value: -2.5 },
  { time: '2024-04-01', value: -0.7 },
  { time: '2024-05-01', value: -0.4 },
  { time: '2024-06-03', value: -3.1 },
  { time: '2024-07-01', value: -1.2 },
  { time: '2024-08-01', value: -2.6 },
  { time: '2024-09-02', value: -1.0 },
  { time: '2024-10-01', value: -0.5 },
  { time: '2024-11-01', value: -0.3 },
  { time: '2024-12-02', value: -0.2 },
]

export const mockTradeLogs: Record<string, any>[] = [
  { Date: '2023-01-03', Ticker: 'AAPL', TickerName: 'Apple', Action: 'BUY', Price: 130.28, Reason: '唐奇安突破 Entry', PnL: null, Snapshot: { holdings: ['AAPL (45%)', 'MSFT (35%)', 'Cash (20%)'], names: { AAPL: 'Apple', MSFT: 'Microsoft' } } },
  { Date: '2023-01-03', Ticker: 'MSFT', TickerName: 'Microsoft', Action: 'BUY', Price: 242.58, Reason: '唐奇安突破 Entry', PnL: null, Snapshot: { holdings: ['AAPL (45%)', 'MSFT (35%)', 'Cash (20%)'], names: { AAPL: 'Apple', MSFT: 'Microsoft' } } },
  { Date: '2023-02-15', Ticker: 'NVDA', TickerName: 'NVIDIA', Action: 'BUY', Price: 224.52, Reason: '动量轮动 Entry', PnL: null, Snapshot: { holdings: ['NVDA (40%)', 'AAPL (30%)', 'Cash (30%)'], names: { NVDA: 'NVIDIA', AAPL: 'Apple' } } },
  { Date: '2023-02-15', Ticker: 'MSFT', TickerName: 'Microsoft', Action: 'SELL', Price: 252.18, Reason: '唐奇安离场 Exit', PnL: 428.16, Snapshot: { holdings: ['NVDA (40%)', 'AAPL (30%)', 'Cash (30%)'], names: { NVDA: 'NVIDIA', AAPL: 'Apple' } } },
  { Date: '2023-04-10', Ticker: 'AAPL', TickerName: 'Apple', Action: 'SELL', Price: 132.55, Reason: '唐奇安离场 Exit', PnL: 102.15, Snapshot: { holdings: ['NVDA (50%)', 'Cash (50%)'], names: { NVDA: 'NVIDIA' } } },
  { Date: '2023-06-20', Ticker: 'GOOGL', TickerName: 'Alphabet', Action: 'BUY', Price: 124.35, Reason: '均值回归 Entry', PnL: null, Snapshot: { holdings: ['NVDA (35%)', 'GOOGL (30%)', 'Cash (35%)'], names: { NVDA: 'NVIDIA', GOOGL: 'Alphabet' } } },
  { Date: '2023-09-05', Ticker: 'NVDA', TickerName: 'NVIDIA', Action: 'SELL', Price: 455.21, Reason: '动量轮动 Exit', PnL: 2306.90, Snapshot: { holdings: ['GOOGL (45%)', 'AMZN (30%)', 'Cash (25%)'], names: { GOOGL: 'Alphabet', AMZN: 'Amazon' } } },
  { Date: '2023-09-05', Ticker: 'AMZN', TickerName: 'Amazon', Action: 'BUY', Price: 138.12, Reason: '动量轮动 Entry', PnL: null, Snapshot: { holdings: ['GOOGL (45%)', 'AMZN (30%)', 'Cash (25%)'], names: { GOOGL: 'Alphabet', AMZN: 'Amazon' } } },
]

export const mockRebalanceLogs: Record<string, any>[] = [
  { Date: '2023-01-31', PortfolioValue: 101200, Selected: ['AAPL', 'MSFT'], PrevHoldings: [], Exited: [], Prices: { AAPL: 135.40, MSFT: 248.30 }, Weights: { AAPL: '55%', MSFT: '45%' }, WeightNames: { AAPL: 'Apple', MSFT: 'Microsoft' }, Names: { AAPL: 'Apple', MSFT: 'Microsoft' } },
  { Date: '2023-02-28', PortfolioValue: 103800, Selected: ['AAPL', 'NVDA'], PrevHoldings: ['AAPL', 'MSFT'], Exited: ['MSFT'], Prices: { AAPL: 140.20, NVDA: 235.80 }, Weights: { AAPL: '50%', NVDA: '50%' }, WeightNames: { AAPL: 'Apple', NVDA: 'NVIDIA' }, Names: { AAPL: 'Apple', NVDA: 'NVIDIA' }, CashWeight: '0%' },
  { Date: '2023-03-31', PortfolioValue: 102100, Selected: ['NVDA', 'GOOGL'], PrevHoldings: ['AAPL', 'NVDA'], Exited: ['AAPL'], Prices: { NVDA: 245.60, GOOGL: 118.90 }, Weights: { NVDA: '55%', GOOGL: '45%' }, WeightNames: { NVDA: 'NVIDIA', GOOGL: 'Alphabet' }, Names: { NVDA: 'NVIDIA', GOOGL: 'Alphabet' }, CashWeight: '0%' },
  { Date: '2023-04-30', PortfolioValue: 105600, Selected: ['NVDA', 'GOOGL', 'AMZN'], PrevHoldings: ['NVDA', 'GOOGL'], Exited: [], Prices: { NVDA: 260.40, GOOGL: 122.50, AMZN: 128.30 }, Weights: { NVDA: '40%', GOOGL: '30%', AMZN: '30%' }, WeightNames: { NVDA: 'NVIDIA', GOOGL: 'Alphabet', AMZN: 'Amazon' }, Names: { NVDA: 'NVIDIA', GOOGL: 'Alphabet', AMZN: 'Amazon' }, CashWeight: '0%' },
  { Date: '2023-05-31', PortfolioValue: 107200, Selected: ['NVDA', 'AMZN'], PrevHoldings: ['NVDA', 'GOOGL', 'AMZN'], Exited: ['GOOGL'], Prices: { NVDA: 285.10, AMZN: 132.80 }, Weights: { NVDA: '55%', AMZN: '45%' }, WeightNames: { NVDA: 'NVIDIA', AMZN: 'Amazon' }, Names: { NVDA: 'NVIDIA', AMZN: 'Amazon' }, CashWeight: '0%' },
]
