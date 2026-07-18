/**
 * 图表颜色工具 — 运行时从 CSS 变量解析出 lightweight-charts 可用的颜色值
 *
 * lightweight-charts 使用 Canvas2D，无法直接识别 CSS `var()`。
 * 需要在 mount/主题切换时 resolve CSS 变量成 HSL 字符串再传入。
 */

export function resolveChartColor(varName: string, opacity = 1): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  if (!v) return '#888'
  const parts = v.split(' ').filter(Boolean)
  if (parts.length < 3) return '#888'
  const [h, s, l] = parts.map(Number)
  return opacity < 1
    ? `hsla(${h}, ${s}%, ${l}%, ${opacity})`
    : `hsl(${h}, ${s}%, ${l}%)`
}

/** 获取 chart-1 ~ chart-6 的调色板 */
export function getComparePalette(): string[] {
  return Array.from({ length: 6 }, (_, i) => resolveChartColor(`--chart-${i + 1}`))
}

/** 图表主题色（文字/网格/边框） */
export function getChartTheme(isDark: boolean) {
  return {
    textColor: isDark ? '#d1d5db' : '#334155',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  }
}
