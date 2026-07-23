import type { Category } from './db'

/** Couleur utilisée quand une catégorie n'est pas (ou plus) connue */
export const FALLBACK_COLOR = '#94a3b8'

/**
 * Catégories créées à l'initialisation de la base.
 * « Autre » sert de catégorie de repli : elle ne peut être ni renommée ni
 * supprimée, et récupère les transactions des catégories supprimées.
 */
export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Logement', type: 'expense', color: '#6366f1' },
  { name: 'Courses', type: 'expense', color: '#22c55e' },
  { name: 'Transport', type: 'expense', color: '#0ea5e9' },
  { name: 'Sorties', type: 'expense', color: '#ec4899' },
  { name: 'Abonnements', type: 'expense', color: '#8b5cf6' },
  { name: 'Études', type: 'expense', color: '#06b6d4' },
  { name: 'Santé', type: 'expense', color: '#ef4444' },
  { name: 'Shopping', type: 'expense', color: '#d946ef' },
  { name: 'Autre', type: 'expense', color: FALLBACK_COLOR },
  { name: 'Salaire', type: 'income', color: '#22c55e' },
  { name: 'Bourse', type: 'income', color: '#06b6d4' },
  { name: 'Aide famille', type: 'income', color: '#8b5cf6' },
  { name: 'Vente', type: 'income', color: '#14b8a6' },
  { name: 'Autre', type: 'income', color: FALLBACK_COLOR }
]
