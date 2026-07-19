/**
 * 图表颜色工具 — 运行时从 CSS 变量解析出 lightweight-charts 可用的颜色值
 *
 * lightweight-charts 使用 Canvas2D，无法直接识别 CSS `var()`。
 * 需要在 mount/主题切换时 resolve CSS 变量成 HSL 字符串再传入。
 */

export function resolveChartColor(varName: string, opacity = 1): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  if (!v) return '#888'
  // 变量已是完整颜色值（hex/rgb/hsl 等）时直接透传
  if (v.startsWith('#') || v.includes('(')) return v
  // shadcn 风格 HSL 三元组："217 91% 60%" —— 必须用 parseFloat，
  // Number("91%") 会得到 NaN，导致 hsl(NaN...) 非法、canvas 静默回落黑色
  const parts = v.split(' ').filter(Boolean)
  if (parts.length < 3) return '#888'
  const [h, s, l] = parts.map(parseFloat)
  if ([h, s, l].some(Number.isNaN)) return '#888'
  return opacity < 1
    ? `hsla(${h}, ${s}%, ${l}%, ${opacity})`
    : `hsl(${h}, ${s}%, ${l}%)`
}

/** 获取 chart-1 ~ chart-6 的调色板 */
export function getComparePalette(): string[] {
  return Array.from({ length: 6 }, (_, i) => resolveChartColor(`--chart-${i + 1}`))
}

/** 给已解析的颜色值叠加透明度（hex 追加 alpha 通道，hsl 转 hsla） */
export function withAlpha(color: string, opacity: number): string {
  if (color.startsWith('#')) {
    return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
  }
  const hslMatch = color.match(/^hsl\((.+)\)$/)
  if (hslMatch) return `hsla(${hslMatch[1]}, ${opacity})`
  return color
}

/** 图表主题色（文字/网格/边框） */
export function getChartTheme(isDark: boolean) {
  return {
    textColor: isDark ? '#d1d5db' : '#334155',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  }
}
