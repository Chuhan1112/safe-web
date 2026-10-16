// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * 回归：共享 RAF 循环必须在动画收敛后停表。
 *
 * 背景（修复前）：loop 无条件 requestAnimationFrame(loop)，只要页面上还挂着任意一个
 * <AnimatedNumber>（指标卡就有），就会以 60 Hz 永久空转 —— 实测空闲期约 120 帧/4s，
 * 期间零 DOM 变更（React 对相同数值 bail out）、零可见效果，纯烧主线程与电量。
 */

let now = 0
let nextId = 1
const pending = new Map<number, FrameRequestCallback>()

const rafStub = vi.fn((cb: FrameRequestCallback) => {
  const id = nextId++
  pending.set(id, cb)
  return id
})
const cafStub = vi.fn((id: number) => {
  pending.delete(id)
})

vi.stubGlobal('requestAnimationFrame', rafStub)
vi.stubGlobal('cancelAnimationFrame', cafStub)
vi.stubGlobal('performance', { now: () => now })

import { AnimatedNumber } from '@/components/AnimatedNumber'

/** 推进虚拟时间并驱动已排队的帧（与真实 rAF 一样：回调重新排队才算还在动） */
function drive(ms: number, step = 16) {
  for (let elapsed = 0; elapsed < ms; elapsed += step) {
    now += step
    const due = [...pending.entries()]
    pending.clear()
    act(() => {
      due.forEach(([, cb]) => cb(now))
    })
  }
}

describe('AnimatedNumber 共享 RAF 生命周期', () => {
  beforeEach(() => {
    now = 0
    nextId = 1
    pending.clear()
    rafStub.mockClear()
    cafStub.mockClear()
  })

  afterEach(() => cleanup())

  it('收敛后不再排帧；值变化时重新启动并再次收敛', () => {
    const { container, rerender } = render(<AnimatedNumber value={10} duration={200} />)

    drive(250)
    expect(container.textContent).toBe('10.00')
    expect(pending.size).toBe(0) // ← 修复前这里会一直是 1（永久续帧）

    const framesAtSettle = rafStub.mock.calls.length
    drive(500, 16)
    expect(rafStub.mock.calls.length).toBe(framesAtSettle) // 静置期零新帧
    expect(container.textContent).toBe('10.00')

    rerender(<AnimatedNumber value={20} duration={200} />)
    drive(250)
    expect(container.textContent).toBe('20.00')
    expect(pending.size).toBe(0)
    const framesAfterChange = rafStub.mock.calls.length
    expect(framesAfterChange).toBeGreaterThan(framesAtSettle)

    drive(500, 16)
    expect(rafStub.mock.calls.length).toBe(framesAfterChange)
  })
})
