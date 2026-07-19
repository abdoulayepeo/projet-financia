import Dexie, { type EntityTable } from 'dexie'

export interface Transaction {
  id: number
  type: 'income' | 'expense'
  amount: number
  category: string
  /** Date au format ISO `AAAA-MM-JJ` */
  date: string
  note?: string
}

export const db = new Dexie('financia') as Dexie & {
  transactions: EntityTable<Transaction, 'id'>
}

db.version(1).stores({
  transactions: '++id, date, type, category'
})
