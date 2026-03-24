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
