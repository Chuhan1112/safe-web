import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { DURATION, EASE, SPRING } from '@/lib/motion'

/**
 * 回归测试：动效词汇表（motion vocabulary）
 *
 * 背景：改动前全仓 82 处 transition-* 全部落在 Tailwind 默认曲线
 * (cubic-bezier(0.4,0,0.2,1) @150ms)，0 处显式 ease-*，于是 hover / 按压 /
 * 面板入场各说各话；另有 21 处 animate-in / slide-in-from-* 因为没装
 * tailwindcss-animate 而**从未编译**（弹层是硬弹出），以及 9 处
 * transition-colors + active:scale-* 的按压反馈根本没动画。
 *
 * 该测试锁住三件事：
 *  1. 词汇表在 motion.ts / globals.css / tailwind.config.js 三处保持一致
 *  2. 弹簧阻尼比落在"至多一点点回弹"的区间，不出现 bouncy 曲线
 *  3. 公开动效面不再出现禁用模式（死类名、ease-in-out、超长 duration、ping）
 */

const ROOT = fileURLToPath(new URL('../../', import.meta.url))

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

// `walk` returns absolute paths; the hand-listed entries are relative. Normalise
// everything to absolute exactly once so `read()` always gets a valid path.
const COVERED = [
  ...walk(join(ROOT, 'src/components/ui')),
  'src/components/Sidebar.tsx',
  'src/components/MarketToggle.tsx',
  'src/components/ActionFilter.tsx',
  'src/components/IndicatorToggles.tsx',
  'src/components/SignalsPage.tsx',
  'src/components/DataManagement.tsx',
  'src/components/ChartPanel.tsx',
].map((p) => (p.startsWith(ROOT) ? p : join(ROOT, p)))

const read = (p: string) => readFileSync(p, 'utf8')
const rel = (p: string) => relative(ROOT, p)

const CSS = read(join(ROOT, 'src/globals.css'))
const TW = read(join(ROOT, 'tailwind.config.js'))

function cssVar(name: string): string | undefined {
  return CSS.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim()
}

describe('motion vocabulary', () => {
  it('keeps src/globals.css in sync with src/lib/motion.ts', () => {
    for (const [name, value] of Object.entries(EASE)) {
      expect(cssVar(`ease-${name}`), `--ease-${name}`).toBe(value)
    }
    for (const [name, ms] of Object.entries(DURATION)) {
      expect(cssVar(`dur-${name}`), `--dur-${name}`).toBe(`${ms}ms`)
    }
  })

  it('keeps tailwind.config.js in sync with src/lib/motion.ts', () => {
    for (const [name, value] of Object.entries(EASE)) {
      expect(TW, `ease-${name}`).toContain(`${name}: '${value}'`)
    }
    for (const [name, ms] of Object.entries(DURATION)) {
      expect(TW, `duration-${name}`).toContain(`${name}: '${ms}ms'`)
    }
  })

  it('defines real overlay enter/exit animations', () => {
    // Guards against falling back to tailwindcss-animate class names that do
    // not compile in this project (plugins: []).
    for (const token of ['motion-in', 'motion-out', 'motion-fade-in', 'motion-fade-out', 'motion-sheet-in']) {
      expect(TW, token).toContain(`'${token}'`)
    }
  })

  it('never emits a space-separated transform translate()', () => {
    // `translate(100% 0)` is invalid as a transform *function* (its arguments
    // are comma separated) so it silently does nothing — the sheet slid not at
    // all while still reporting a running animation. Standalone `translate`
    // accepts the space-separated form; the transform function does not.
    const values = [...TW.matchAll(/transform:\s*'([^']*)'/g)].map((m) => m[1])
    for (const value of values) {
      const inner = value.match(/^translate\(([^)]*)\)$/)?.[1]
      if (inner === undefined) continue
      expect(inner, `invalid transform function: ${value}`).toMatch(
        /^[^,\s]+$|^[^,\s]+,\s*[^,]+$/
      )
    }
  })

  it('bounds every spring to a tiny overshoot', () => {
    for (const [name, spring] of Object.entries(SPRING)) {
      expect(spring, name).toMatchObject({ type: 'spring' })
      const { stiffness: k, damping: c, mass: m } = spring as unknown as {
        stiffness: number
        damping: number
        mass: number
      }
      // zeta = c / (2*sqrt(k*m))
      const zeta = c / (2 * Math.sqrt(k * m))
      expect(zeta, `${name} damping ratio`).toBeGreaterThan(0.7) // not bouncy
      expect(zeta, `${name} damping ratio`).toBeLessThan(1) // still a spring
      const overshoot = Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta))
      expect(overshoot, `${name} overshoot`).toBeLessThanOrEqual(0.05)
    }
  })

  it('keeps .motion-interactive as the single press primitive', () => {
    expect(CSS).toContain('.motion-interactive')
    expect(CSS).toContain('.motion-interactive:active')
    // The press must be reduced-motion safe.
    const reduced = CSS.slice(CSS.indexOf('prefers-reduced-motion: reduce'))
    expect(reduced).toContain('.motion-interactive')
  })
})

describe('public motion surface', () => {
  it('has no never-compiled tailwindcss-animate classes', () => {
    const DEAD =
      /\b(animate-in|animate-out)\b|fade-in-\d|fade-out-\d|zoom-in-\d|zoom-out-\d|slide-in-from-|slide-out-to-/
    for (const file of COVERED) {
      expect(read(file), rel(file)).not.toMatch(DEAD)
    }
  })

  it('has no banned easings, oversized durations or particle bursts', () => {
    // ease-in / ease-out / ease-in-out read as generic templates, and the spec
    // bans bouncy or dead-time motion: nothing interactive may exceed ~300ms.
    const BANNED = /\b(ease-in|ease-out|ease-in-out|animate-ping)\b|duration-([4-9]\d{2}|\d{4,})/
    for (const file of COVERED) {
      expect(read(file), rel(file)).not.toMatch(BANNED)
    }
  })

  it('never leaves a press feedback without a transform transition', () => {
    for (const file of COVERED) {
      const src = read(file)
      if (!/active:scale-/.test(src)) continue
      expect(src, `${rel(file)} has active:scale without a transform transition`).toMatch(
        /motion-interactive|transition-all|transition-transform/
      )
    }
  })
})
