import { CURRENCIES, currency } from '../composables/currency'

const formatters: Record<string, Intl.NumberFormat> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, new Intl.NumberFormat(c.locale, { style: 'currency', currency: c.code })])
)

/**
 * Formate un montant dans la devise sélectionnée. Lit `currency.value` :
 * l'accès réactif fait que les composants se rafraîchissent au changement.
 */
export function formatAmount(n: number): string {
  return formatters[currency.value].format(n)
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
