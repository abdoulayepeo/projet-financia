import { defineStore } from 'pinia'
import { db, type Transaction } from '../db'
import { currentMonth } from '../lib/months'

export const useTransactionsStore = defineStore('transactions', {
  state: () => ({
    /** Mois affiché, format `AAAA-MM` */
    month: currentMonth(),
    transactions: [] as Transaction[]
  }),

  getters: {
    incomes: (s) => s.transactions.filter((t) => t.type === 'income'),
    expenses: (s) => s.transactions.filter((t) => t.type === 'expense'),
    totalIncome(): number {
      return this.incomes.reduce((sum, t) => sum + t.amount, 0)
    },
    totalExpense(): number {
      return this.expenses.reduce((sum, t) => sum + t.amount, 0)
    },
    balance(): number {
      return this.totalIncome - this.totalExpense
    },
    expensesByCategory(): { category: string; total: number }[] {
      const totals = new Map<string, number>()
      for (const t of this.expenses) {
        totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount)
      }
      return [...totals.entries()]
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total)
    }
  },

  actions: {
    async load() {
      const rows = await db.transactions.where('date').startsWith(this.month).sortBy('date')
      this.transactions = rows.reverse()
    },
    async setMonth(month: string) {
      this.month = month
      await this.load()
    },
    async add(t: Omit<Transaction, 'id'>) {
      await db.transactions.add(t as Transaction)
      await this.setMonth(t.date.slice(0, 7))
    },
    async update(t: Transaction) {
      await db.transactions.put(t)
      await this.setMonth(t.date.slice(0, 7))
    },
    async remove(id: number) {
      await db.transactions.delete(id)
      await this.load()
    }
  }
})
