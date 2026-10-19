export type BadgeTone = 'neutral' | 'long' | 'short' | 'risk'

export function triggerLabel(trigger?: string | null): string | null {
  if (!trigger) return null
  if (trigger.startsWith('drift')) return '权重漂移'
  if (trigger === 'calendar+stop') return '例调 + 止损'
  const base = trigger.split(':')[0]
  switch (base) {
    case 'initial':
      return '首次建仓'
    case 'calendar':
      return '长线例调'
    case 'calendar_drift':
      return '长线漂移'
    case 'stop':
      return '止损'
    case 'confirm':
      return '确认换手'
    case 'vol_spike':
      return '波动触发'
    case 'snapshot':
      return '快照'
    default:
      return trigger
  }
}

export function triggerTone(trigger?: string | null): BadgeTone {
  if (!trigger) return 'neutral'
  if (trigger.includes('stop')) return 'risk'
  if (trigger === 'initial' || trigger === 'calendar' || trigger === 'calendar_drift') {
    return 'long'
  }
  if (trigger === 'snapshot') return 'neutral'
  return 'short'
}

export function horizonLabel(horizon?: string | null): string | null {
  switch (horizon) {
    case 'long':
      return '长线'
    case 'short':
      return '短线'
    case 'snapshot':
      return '快照'
    default:
      return horizon || null
  }
}

export function horizonTone(horizon?: string | null): BadgeTone {
  switch (horizon) {
    case 'long':
      return 'long'
    case 'short':
      return 'short'
    default:
      return 'neutral'
  }
}

export function badgeToneClass(tone: BadgeTone): string {
  switch (tone) {
    case 'long':
      return 'border-sky-500/20 bg-sky-500/5 text-sky-600 dark:text-sky-400'
    case 'short':
      return 'border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400'
    case 'risk':
      return 'border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400'
    default:
      return 'border-border/50 bg-muted/30 text-muted-foreground'
  }
}
