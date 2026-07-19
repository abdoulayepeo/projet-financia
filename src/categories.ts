export const EXPENSE_CATEGORIES = [
  'Logement',
  'Courses',
  'Transport',
  'Sorties',
  'Abonnements',
  'Études',
  'Santé',
  'Shopping',
  'Autre'
] as const

export const INCOME_CATEGORIES = [
  'Salaire',
  'Bourse',
  'Aide famille',
  'Vente',
  'Autre'
] as const

const COLORS: Record<string, string> = {
  Logement: '#6366f1',
  Courses: '#22c55e',
  Transport: '#f59e0b',
  Sorties: '#ec4899',
  Abonnements: '#8b5cf6',
  Études: '#06b6d4',
  Santé: '#ef4444',
  Shopping: '#f97316',
  Autre: '#94a3b8'
}

export function colorFor(category: string): string {
  return COLORS[category] ?? '#94a3b8'
}
