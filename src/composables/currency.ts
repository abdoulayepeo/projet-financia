import { computed, ref, watchEffect } from 'vue'

export type CurrencyCode = 'EUR' | 'USD' | 'XOF'

interface CurrencyDef {
  code: CurrencyCode
  label: string
  symbol: string
  locale: string
}

export const CURRENCIES: CurrencyDef[] = [
  { code: 'EUR', label: 'Euro', symbol: '€', locale: 'fr-FR' },
  { code: 'USD', label: 'Dollar', symbol: '$', locale: 'en-US' },
  { code: 'XOF', label: 'Franc CFA', symbol: 'FCFA', locale: 'fr-FR' }
]

const STORAGE_KEY = 'financia-currency'

function initial(): CurrencyCode {
  const stored = localStorage.getItem(STORAGE_KEY)
  return CURRENCIES.some((c) => c.code === stored) ? (stored as CurrencyCode) : 'EUR'
}

// Singleton réactif partagé (comme le thème).
export const currency = ref<CurrencyCode>(initial())

watchEffect(() => localStorage.setItem(STORAGE_KEY, currency.value))

export function useCurrency() {
  const symbol = computed(() => CURRENCIES.find((c) => c.code === currency.value)!.symbol)
  function setCurrency(code: CurrencyCode) {
    currency.value = code
  }
  return { currency, symbol, setCurrency, currencies: CURRENCIES }
}
