const currency = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

export function formatAmount(n: number): string {
  return currency.format(n)
}

/** `2026-07` → « juillet 2026 » */
export function formatMonth(month: string): string {
  const [year, m] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    new Date(year, m - 1, 1)
  )
}

/** `2026-07-19` → « dimanche 19 juillet » */
export function formatDay(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(date + 'T00:00:00')
  )
}
