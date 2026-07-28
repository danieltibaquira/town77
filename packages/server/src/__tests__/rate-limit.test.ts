import { describe, expect, it } from 'vitest'
import { RateLimiter } from '../security/rate-limit'

describe('RateLimiter', () => {
  it('rejects a key after its window limit and prunes expired entries', () => {
    let now = 1_000
    const limiter = new RateLimiter(() => now)

    expect(limiter.consume('ip:127.0.0.1', 2, 1_000)).toBe(true)
    expect(limiter.consume('ip:127.0.0.1', 2, 1_000)).toBe(true)
    expect(limiter.consume('ip:127.0.0.1', 2, 1_000)).toBe(false)

    now += 1_001
    expect(limiter.prune(1_000)).toBe(1)
    expect(limiter.consume('ip:127.0.0.1', 2, 1_000)).toBe(true)
  })
})
