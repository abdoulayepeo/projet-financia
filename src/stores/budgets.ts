import { defineStore } from 'pinia'
import { db } from '../db'

export const useBudgetsStore = defineStore('budgets', {
  state: () => ({
    /** Plafond mensuel par catégorie de dépense */
    budgets: {} as Record<string, number>
  }),

  actions: {
    async load() {
      const rows = await db.budgets.toArray()
      this.budgets = Object.fromEntries(rows.map((b) => [b.category, b.amount]))
    },
    /** Définit le plafond d'une catégorie ; `null` ou 0 supprime le budget. */
    async set(category: string, amount: number | null) {
      if (amount && amount > 0) {
        await db.budgets.put({ category, amount })
      } else {
        await db.budgets.delete(category)
      }
      await this.load()
    }
  }
})
