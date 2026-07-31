import type { Category } from './db'

/** Couleur utilisée quand une catégorie n'est pas (ou plus) connue */
export const FALLBACK_COLOR = '#8892a6'

/**
 * Palette catégorielle — volontairement distincte du sens financier
 * (--income/--expense sont verts/rouges) et de la rampe de marque (violette) :
 * aucune des trois familles ne doit se recouper, pour qu'un vert ou un rouge
 * dans l'interface signifie toujours « revenu » ou « dépense », jamais une
 * catégorie précise.
 */
export const CATEGORY_PALETTE = {
  bleu: '#4d8dfa',
  cyan: '#2bb8c4',
  jauneMoutarde: '#e0b23d',
  corail: '#f0716a',
  indigo: '#7c6cf0',
  rose: '#e069b8',
  terracotta: '#e0793f',
  brunTaupe: '#9c7a54'
} as const

/**
 * Catégories créées à l'initialisation de la base.
 * « Autre » sert de catégorie de repli : elle ne peut être ni renommée ni
 * supprimée, et récupère les transactions des catégories supprimées.
 */
export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Logement', type: 'expense', color: CATEGORY_PALETTE.bleu },
  { name: 'Courses', type: 'expense', color: CATEGORY_PALETTE.cyan },
  { name: 'Transport', type: 'expense', color: CATEGORY_PALETTE.indigo },
  { name: 'Sorties', type: 'expense', color: CATEGORY_PALETTE.rose },
  { name: 'Abonnements', type: 'expense', color: CATEGORY_PALETTE.jauneMoutarde },
  { name: 'Études', type: 'expense', color: CATEGORY_PALETTE.corail },
  { name: 'Santé', type: 'expense', color: CATEGORY_PALETTE.terracotta },
  { name: 'Shopping', type: 'expense', color: CATEGORY_PALETTE.brunTaupe },
  { name: 'Autre', type: 'expense', color: FALLBACK_COLOR },
  { name: 'Salaire', type: 'income', color: CATEGORY_PALETTE.bleu },
  { name: 'Bourse', type: 'income', color: CATEGORY_PALETTE.indigo },
  { name: 'Aide famille', type: 'income', color: CATEGORY_PALETTE.rose },
  { name: 'Vente', type: 'income', color: CATEGORY_PALETTE.jauneMoutarde },
  { name: 'Autre', type: 'income', color: FALLBACK_COLOR }
]

/**
 * Anciennes couleurs par défaut (avant la Phase 2 de l'audit design), pour la
 * migration : seules les catégories jamais recolorées manuellement par
 * l'utilisateur (couleur encore égale à l'ancien défaut) basculent vers la
 * nouvelle palette — voir db.ts, version 5.
 */
export const LEGACY_DEFAULT_COLORS: Record<string, string> = {
  'expense:Logement': '#6366f1',
  'expense:Courses': '#22c55e',
  'expense:Transport': '#0ea5e9',
  'expense:Sorties': '#ec4899',
  'expense:Abonnements': '#8b5cf6',
  'expense:Études': '#06b6d4',
  'expense:Santé': '#ef4444',
  'expense:Shopping': '#d946ef',
  'expense:Autre': '#94a3b8',
  'income:Salaire': '#22c55e',
  'income:Bourse': '#06b6d4',
  'income:Aide famille': '#8b5cf6',
  'income:Vente': '#14b8a6',
  'income:Autre': '#94a3b8'
}
