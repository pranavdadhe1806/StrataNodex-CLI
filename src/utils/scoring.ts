/**
 * Calculate daily points based on task completion.
 * Must match backend scoring logic exactly.
 *
 * Buckets:
 *   total === 0        → 0  (no tasks scheduled, no penalty)
 *   done/total >= 0.90 → +3
 *   done/total >= 0.60 → +2
 *   done/total >= 0.30 → +1
 *   done/total >  0.00 → 0
 *   done === 0         → -1
 */
export function calculatePoints(done: number, total: number): number {
  done = Math.max(0, done)
  total = Math.max(0, total)

  if (total === 0) return 0

  done = Math.min(done, total)

  const ratio = done / total

  if (ratio >= 0.9) return 3
  if (ratio >= 0.6) return 2
  if (ratio >= 0.3) return 1
  if (done > 0) return 0
  return -1
}
