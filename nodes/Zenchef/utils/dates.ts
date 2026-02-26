export function formatDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatMonthStart(year: number, month: number): string {
  return String(year).padStart(4, '0') + '-' + String(month).padStart(2, '0') + '-01'
}

export function formatMonthEnd(year: number, month: number): string {
  const lastDay = new Date(year, month, 0)
  return formatDate(lastDay)
}

export function formatUpcomingEnd(numberOfDays: number, now: Date = new Date()): string {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + numberOfDays - 1)
  return formatDate(end)
}
