import { describe, it, expect } from 'vitest'
import { calculatePoints } from './scoring.js'

describe('calculatePoints', () => {
  it('returns +3 when 100% done (10/10)', () => {
    expect(calculatePoints(10, 10)).toBe(3)
  })

  it('returns +3 when exactly 90% done (9/10)', () => {
    expect(calculatePoints(9, 10)).toBe(3)
  })

  it('returns +3 when 18/20 done (90%)', () => {
    expect(calculatePoints(18, 20)).toBe(3)
  })

  it('returns +2 when 60% done (6/10)', () => {
    expect(calculatePoints(6, 10)).toBe(2)
  })

  it('returns +2 when 89% done (8/9 ≈ 88.9%)', () => {
    expect(calculatePoints(8, 9)).toBe(2)
  })

  it('returns +1 when 30% done (3/10)', () => {
    expect(calculatePoints(3, 10)).toBe(1)
  })

  it('returns +1 when 59% done (59/100)', () => {
    expect(calculatePoints(59, 100)).toBe(1)
  })

  it('returns 0 when 1 out of 10 done (10%)', () => {
    expect(calculatePoints(1, 10)).toBe(0)
  })

  it('returns 0 when 29% done (29/100)', () => {
    expect(calculatePoints(29, 100)).toBe(0)
  })

  it('returns -1 when 0 tasks done out of 5', () => {
    expect(calculatePoints(0, 5)).toBe(-1)
  })

  it('returns -1 when done is 0 and total is 1', () => {
    expect(calculatePoints(0, 1)).toBe(-1)
  })

  it('returns 0 when total is 0 (no tasks scheduled)', () => {
    expect(calculatePoints(0, 0)).toBe(0)
  })

  it('clamps done > total to total (15/10 → treated as 10/10)', () => {
    expect(calculatePoints(15, 10)).toBe(3)
  })

  it('handles negative done input as 0', () => {
    expect(calculatePoints(-5, 10)).toBe(-1)
  })
})
