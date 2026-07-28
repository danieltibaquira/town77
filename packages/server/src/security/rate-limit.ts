interface RateLimitWindow {
  startedAt: number
  count: number
}

export class RateLimiter {
  private readonly windows = new Map<string, RateLimitWindow>()

  constructor(private readonly now: () => number = Date.now) {}

  consume(key: string, limit: number, windowMs: number): boolean {
    const current = this.windows.get(key)
    const now = this.now()
    if (!current || now - current.startedAt >= windowMs) {
      this.windows.set(key, { startedAt: now, count: 1 })
      return true
    }
    if (current.count >= limit) return false
    current.count += 1
    return true
  }

  prune(maxWindowMs = 60_000): number {
    const threshold = this.now() - maxWindowMs
    let removed = 0
    for (const [key, window] of this.windows) {
      if (window.startedAt < threshold) {
        this.windows.delete(key)
        removed += 1
      }
    }
    return removed
  }
}
