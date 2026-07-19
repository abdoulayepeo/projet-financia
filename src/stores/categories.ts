import { defineStore } from 'pinia'
import { db, type Category } from '../db'
import { FALLBACK_COLOR } from '../categories'

export const useCategoriesStore = defineStore('categories', {
  state: () => ({
    categories: [] as Category[]
  }),

  getters: {
    expenseCategories: (s) => s.categories.filter((c) => c.type === 'expense'),
    incomeCategories: (s) => s.categories.filter((c) => c.type === 'income'),
    colorOf: (s) => (name: string) =>
      s.categories.find((c) => c.name === name)?.color ?? FALLBACK_COLOR
  },

  actions: {
    async load() {
      this.categories = await db.categories.toArray()
    },

    async add(name: string, type: 'income' | 'expense', color: string) {
      await db.categories.add({ name, type, color } as Category)
      await this.load()
    },

    /**
     * Renomme la catégorie et met à jour toutes les données qui la
     * référencent par son nom (transactions, récurrences, budget).
     */
    async rename(id: number, newName: string) {
      const cat = await db.categories.get(id)
      if (!cat || cat.name === 'Autre' || cat.name === newName) return
      await db.transaction('rw', [db.categories, db.transactions, db.budgets, db.recurrings], async () => {
        await db.categories.update(id, { name: newName })
        await db.transactions.where('category').equals(cat.name).modify({ category: newName })
        await db.recurrings.filter((r) => r.category === cat.name).modify({ category: newName })
        const budget = await db.budgets.get(cat.name)
        if (budget) {
          await db.budgets.delete(cat.name)
          await db.budgets.put({ category: newName, amount: budget.amount })
        }
      })
      await this.load()
    },

    /**
     * Supprime la catégorie : ses transactions et récurrences sont
     * reclassées dans « Autre », son budget est supprimé.
     */
    async remove(id: number) {
      const cat = await db.categories.get(id)
      if (!cat || cat.name === 'Autre') return
      await db.transaction('rw', [db.categories, db.transactions, db.budgets, db.recurrings], async () => {
        await db.transactions.where('category').equals(cat.name).modify({ category: 'Autre' })
        await db.recurrings.filter((r) => r.category === cat.name).modify({ category: 'Autre' })
        await db.budgets.delete(cat.name)
        await db.categories.delete(id)
      })
      await this.load()
    }
  }
})
