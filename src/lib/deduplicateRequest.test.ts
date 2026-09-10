import { describe, expect, it, vi } from 'vitest'
import { deduplicateRequest } from '@/utils/deduplicateRequest'

describe('deduplicateRequest', () => {
  it('abort 后不会复用已经取消的同 key 请求', async () => {
    const firstController = new AbortController()
    const firstFactory = vi.fn(() => new Promise<string>((_, reject) => {
      firstController.signal.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'))
      })
    }))
    const secondFactory = vi.fn().mockResolvedValue('fresh')

    const first = deduplicateRequest('health-summary-US', firstFactory, firstController.signal)
    firstController.abort()

    const second = deduplicateRequest(
      'health-summary-US',
      secondFactory,
      new AbortController().signal,
    )

    await expect(first).rejects.toMatchObject({ name: 'AbortError' })
    await expect(second).resolves.toBe('fresh')
    expect(firstFactory).toHaveBeenCalledTimes(1)
    expect(secondFactory).toHaveBeenCalledTimes(1)
  })
})
