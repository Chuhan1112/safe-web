// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StrategyParamsPanel } from '@/components/StrategyParamsPanel'
import type { StrategyParamSpec } from '@/lib/api/client'

afterEach(cleanup)

const params: StrategyParamSpec[] = [
  {
    key: 'rebalance_freq',
    label: '调仓周期',
    type: 'select',
    default: 'ME',
    group: 'execution',
    choices: ['ME', 'Q', 'W-FRI', 'D'],
  },
  {
    key: 'long_hold',
    label: '长线持有',
    type: 'boolean',
    default: true,
    group: 'execution',
  },
  {
    key: 'momentum_lookback',
    label: '动量窗口',
    type: 'number',
    default: 60,
    min: 20,
    max: 252,
    step: 1,
  },
]

describe('StrategyParamsPanel', () => {
  it('renders select and boolean controls and reports changes', () => {
    const onChange = vi.fn()
    render(
      <StrategyParamsPanel
        params={params}
        values={{ rebalance_freq: 'ME', long_hold: true, momentum_lookback: 60 }}
        onChange={onChange}
      />,
    )

    // 核心组默认展开；执行组需要先展开。
    expect(screen.getByLabelText('动量窗口')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /执行周期/ }))

    const select = screen.getByLabelText('调仓周期') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'Q' } })
    expect(onChange).toHaveBeenCalledWith('rebalance_freq', 'Q')

    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith('long_hold', false)
  })

  it('keeps advanced groups collapsed by default', () => {
    render(
      <StrategyParamsPanel params={params} values={{}} onChange={() => {}} />,
    )
    expect(screen.getByText('核心信号')).toBeTruthy()
    expect(screen.getByText('执行周期')).toBeTruthy()
    expect(screen.queryByLabelText('调仓周期')).toBeNull()
  })
})
