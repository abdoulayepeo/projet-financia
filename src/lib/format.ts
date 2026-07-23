import { currency, type CurrencyCode } from '../composables/currency'

// Format maîtrisé : le symbole est cohérent partout (« FCFA », jamais « XOF »).
const CONFIG: Record<CurrencyCode, { locale: string; decimals: number; symbol: string; before: boolean }> = {
  EUR: { locale: 'fr-FR', decimals: 2, symbol: '€', before: false },
  USD: { locale: 'en-US', decimals: 2, symbol: '$', before: true },
  XOF: { locale: 'fr-FR', decimals: 0, symbol: 'FCFA', before: false }
}

const nfCache: Partial<Record<CurrencyCode, Intl.NumberFormat>> = {}

function numberFor(code: CurrencyCode): Intl.NumberFormat {
  if (!nfCache[code]) {
    const c = CONFIG[code]
    nfCache[code] = new Intl.NumberFormat(c.locale, {
      minimumFractionDigits: c.decimals,
      maximumFractionDigits: c.decimals
    })
  }
  return nfCache[code]!
}

/**
 * Formate un montant dans la devise sélectionnée. Lit `currency.value` :
 * l'accès réactif fait que les composants se rafraîchissent au changement.
 */
export function formatAmount(n: number): string {
  const code = currency.value
  const c = CONFIG[code]
  const sign = n < 0 ? '-' : ''
  const num = numberFor(code).format(Math.abs(n))
  const body = c.before ? `${c.symbol}${num}` : `${num} ${c.symbol}`
  return sign + body
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
