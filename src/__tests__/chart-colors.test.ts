// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { getComparePalette, resolveChartColor, withAlpha } from '@/utils/chartColors'

/**
 * 回归测试：globals.css 中 --chart-* / --data-* 是 shadcn 风格 HSL 三元组
 * （如 "217 91% 60%"）。旧实现用 Number("91%") 得到 NaN，
 * 输出 hsl(217, NaN%, NaN%) 非法颜色 → canvas 静默回落黑色 → 图表线条"消失"。
 */
describe('resolveChartColor', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--test-color')
  })

  it('解析带 % 的 HSL 三元组', () => {
    document.documentElement.style.setProperty('--test-color', '217 91% 60%')
    expect(resolveChartColor('--test-color')).toBe('hsl(217, 91%, 60%)')
  })

  it('支持透明度参数', () => {
    document.documentElement.style.setProperty('--test-color', '142 76% 46%')
    expect(resolveChartColor('--test-color', 0.4)).toBe('hsla(142, 76%, 46%, 0.4)')
  })

  it('透传完整颜色值（hex）', () => {
    document.documentElement.style.setProperty('--test-color', '#22c55e')
    expect(resolveChartColor('--test-color')).toBe('#22c55e')
  })

  it('变量不存在时回退 #888', () => {
    expect(resolveChartColor('--nonexistent-var')).toBe('#888')
  })

  it('getComparePalette 不含 NaN', () => {
    for (let i = 1; i <= 6; i++) {
      document.documentElement.style.setProperty(`--chart-${i}`, '217 91% 60%')
    }
    const palette = getComparePalette()
    expect(palette).toHaveLength(6)
    palette.forEach((c) => expect(c).not.toContain('NaN'))
  })
})

describe('withAlpha', () => {
  it('hex 颜色追加 alpha 通道', () => {
    expect(withAlpha('#2563eb', 0.4)).toBe('#2563eb66')
    expect(withAlpha('#2563eb', 0)).toBe('#2563eb00')
  })

  it('hsl 颜色转 hsla（对比模式调色板路径）', () => {
    expect(withAlpha('hsl(217, 91%, 65%)', 0.4)).toBe('hsla(217, 91%, 65%, 0.4)')
    expect(withAlpha('hsl(217, 91%, 65%)', 0)).toBe('hsla(217, 91%, 65%, 0)')
  })

  it('其他格式原样透传', () => {
    expect(withAlpha('rgb(1, 2, 3)', 0.5)).toBe('rgb(1, 2, 3)')
  })
})
