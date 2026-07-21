import Dexie, { type EntityTable } from 'dexie'
import { DEFAULT_CATEGORIES } from './categories'

export interface Transaction {
  id: number
  type: 'income' | 'expense'
  amount: number
  category: string
  /** Date au format ISO `AAAA-MM-JJ` */
  date: string
  note?: string
  /** Présent si la transaction a été générée par une transaction récurrente */
  recurringId?: number
}

export interface Budget {
  /** Catégorie de dépense (clé primaire) */
  category: string
  /** Plafond mensuel en euros */
  amount: number
}

export interface Recurring {
  id: number
  type: 'income' | 'expense'
  amount: number
  category: string
  note?: string
  /** Jour du mois où la transaction est créée (1-31, borné à la fin du mois) */
  dayOfMonth: number
  /** Dernier mois (`AAAA-MM`) pour lequel la transaction a été générée */
  lastAppliedMonth: string
}

export interface Category {
  id: number
  name: string
  type: 'income' | 'expense'
  /** Couleur affichée dans les graphiques et les listes */
  color: string
}

export interface Goal {
  id: number
  name: string
  /** Montant cible en euros */
  target: number
  color: string
  /** Date limite optionnelle `AAAA-MM-JJ` */
  deadline?: string
  /** Date de création `AAAA-MM-JJ` */
  createdAt: string
}

export interface Contribution {
  id: number
  goalId: number
  /** Montant : positif = mis de côté, négatif = retiré */
  amount: number
  /** Date `AAAA-MM-JJ` — détermine le mois où l'épargne est prélevée */
  date: string
  note?: string
}

export const db = new Dexie('financia') as Dexie & {
  transactions: EntityTable<Transaction, 'id'>
  budgets: EntityTable<Budget, 'category'>
  recurrings: EntityTable<Recurring, 'id'>
  categories: EntityTable<Category, 'id'>
  goals: EntityTable<Goal, 'id'>
  contributions: EntityTable<Contribution, 'id'>
}

db.version(1).stores({
  transactions: '++id, date, type, category'
})

db.version(2).stores({
  transactions: '++id, date, type, category',
  budgets: 'category',
  recurrings: '++id'
})

db.version(3)
  .stores({
    transactions: '++id, date, type, category',
    budgets: 'category',
    recurrings: '++id',
    categories: '++id, type'
  })
  .upgrade((tx) => tx.table('categories').bulkAdd(DEFAULT_CATEGORIES as Category[]))

db.version(4).stores({
  transactions: '++id, date, type, category',
  budgets: 'category',
  recurrings: '++id',
  categories: '++id, type',
  goals: '++id',
  contributions: '++id, goalId, date'
})

// Base créée directement (nouvel utilisateur) : l'upgrade ne tourne pas,
// les catégories par défaut sont insérées ici.
db.on('populate', (tx) => {
  tx.table('categories').bulkAdd(DEFAULT_CATEGORIES as Category[])
})
