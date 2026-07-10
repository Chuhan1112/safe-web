import { describe, it, expect } from 'vitest'
import { formatPrice } from './utils'

describe('formatPrice', () => {
  it('returns "--" for null, undefined, NaN, 0, Infinity, and empty string', () => {
    expect(formatPrice(null, '$')).toBe('--')
    expect(formatPrice(undefined, '$')).toBe('--')
    expect(formatPrice(Number.NaN, '$')).toBe('--')
    expect(formatPrice(0, '$')).toBe('--')
    expect(formatPrice(Number.POSITIVE_INFINITY, '$')).toBe('--')
    expect(formatPrice('', '$')).toBe('--')
  })

  it('formats positive numbers with two decimals and symbol', () => {
    expect(formatPrice(1.5, '$')).toBe('$1.50')
    expect(formatPrice(1234.567, '$')).toBe('$1234.57')
    expect(formatPrice(1.5, '¥')).toBe('¥1.50')
  })

  it('formats numeric strings', () => {
    expect(formatPrice('1.5', '$')).toBe('$1.50')
  })
})
