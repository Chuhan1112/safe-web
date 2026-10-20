import { describe, expect, it } from 'vitest'
import {
  badgeToneClass,
  horizonLabel,
  horizonTone,
  triggerLabel,
  triggerTone,
} from '@/utils/rebalanceBadges'

describe('rebalance trigger badges', () => {
  it('labels long-horizon and short-horizon triggers', () => {
    expect(triggerLabel('calendar')).toBe('长线例调')
    expect(triggerLabel('calendar_drift')).toBe('长线漂移')
    expect(triggerLabel('stop')).toBe('止损')
    expect(triggerLabel('calendar+stop')).toBe('长线例调 + 止损')
    expect(triggerLabel('confirm+stop')).toBe('确认换手 + 止损')
    expect(triggerLabel('calendar_drift+stop')).toBe('长线漂移 + 止损')
    expect(triggerLabel('drift:12.3%+stop')).toBe('权重漂移 + 止损')
    expect(triggerLabel('vol_spike+stop')).toBe('波动触发 + 止损')
    expect(triggerLabel('confirm')).toBe('确认换手')
    expect(triggerLabel('drift:12.3%')).toBe('权重漂移')
    expect(triggerLabel('vol_spike')).toBe('波动触发')
  })

  it('maps tone by risk semantics', () => {
    expect(triggerTone('calendar')).toBe('long')
    expect(triggerTone('confirm')).toBe('short')
    expect(triggerTone('calendar+stop')).toBe('risk')
    expect(triggerTone('snapshot')).toBe('neutral')
    expect(horizonTone('long')).toBe('long')
    expect(horizonTone('short')).toBe('short')
    expect(horizonLabel('long')).toBe('长线')
    expect(horizonLabel('short')).toBe('短线')
    expect(badgeToneClass('risk')).toContain('red')
  })
})
