// eslint-disable-next-line @n8n/community-nodes/no-restricted-imports
import { describe, expect, it } from 'vitest'
import { formatDate, formatMonthEnd, formatMonthStart, formatUpcomingEnd } from './dates'

describe('formatDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(formatDate(new Date('2025-03-15T10:30:00Z'))).toBe('2025-03-15')
  })

  it('pads single-digit months and days', () => {
    expect(formatDate(new Date('2025-01-05T00:00:00Z'))).toBe('2025-01-05')
  })
})

describe('formatMonthStart', () => {
  it('returns the first day of the month', () => {
    expect(formatMonthStart(2025, 7)).toBe('2025-07-01')
  })

  it('pads single-digit months', () => {
    expect(formatMonthStart(2025, 1)).toBe('2025-01-01')
  })

  it('handles December', () => {
    expect(formatMonthStart(2025, 12)).toBe('2025-12-01')
  })
})

describe('formatMonthEnd', () => {
  it('returns the last day of January (31 days)', () => {
    expect(formatMonthEnd(2025, 1)).toBe('2025-01-31')
  })

  it('returns the last day of February in a non-leap year', () => {
    expect(formatMonthEnd(2025, 2)).toBe('2025-02-28')
  })

  it('returns the last day of February in a leap year', () => {
    expect(formatMonthEnd(2024, 2)).toBe('2024-02-29')
  })

  it('returns the last day of April (30 days)', () => {
    expect(formatMonthEnd(2025, 4)).toBe('2025-04-30')
  })

  it('returns the last day of December', () => {
    expect(formatMonthEnd(2025, 12)).toBe('2025-12-31')
  })
})

describe('formatUpcomingEnd', () => {
  it('returns the same day when numberOfDays is 1', () => {
    const now = new Date('2025-06-10T12:00:00Z')
    expect(formatUpcomingEnd(1, now)).toBe('2025-06-10')
  })

  it('returns 6 days later when numberOfDays is 7', () => {
    const now = new Date('2025-06-10T12:00:00Z')
    expect(formatUpcomingEnd(7, now)).toBe('2025-06-16')
  })

  it('crosses month boundaries', () => {
    const now = new Date('2025-01-30T12:00:00Z')
    expect(formatUpcomingEnd(5, now)).toBe('2025-02-03')
  })

  it('crosses year boundaries', () => {
    const now = new Date('2025-12-29T12:00:00Z')
    expect(formatUpcomingEnd(7, now)).toBe('2026-01-04')
  })
})
