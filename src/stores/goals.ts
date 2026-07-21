import { defineStore } from 'pinia'
import { db, type Contribution, type Goal } from '../db'

/** Nombre de mois (au moins 1) entre aujourd'hui et une date limite. */
function monthsUntil(deadline: string): number {
  const now = new Date()
  const d = new Date(deadline + 'T00:00:00')
  const months = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth())
  return Math.max(months, 1)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export const useGoalsStore = defineStore('goals', {
  state: () => ({
    goals: [] as Goal[],
    contributions: [] as Contribution[]
  }),

  getters: {
    /** Total épargné pour un objectif (contributions moins retraits). */
    savedFor: (s) => (goalId: number) =>
      s.contributions
        .filter((c) => c.goalId === goalId)
        .reduce((sum, c) => sum + c.amount, 0),

    contributionsFor: (s) => (goalId: number) =>
      s.contributions
        .filter((c) => c.goalId === goalId)
        .sort((a, b) => b.date.localeCompare(a.date)),

    /** Épargne nette d'un mois `AAAA-MM` (pour le prélèvement sur le solde). */
    savedInMonth: (s) => (month: string) =>
      s.contributions
        .filter((c) => c.date.startsWith(month))
        .reduce((sum, c) => sum + c.amount, 0),

    /** Épargne nette d'une année `AAAA`. */
    savedInYear: (s) => (year: number) =>
      s.contributions
        .filter((c) => c.date.startsWith(`${year}-`))
        .reduce((sum, c) => sum + c.amount, 0)
  },

  actions: {
    async load() {
      this.goals = await db.goals.orderBy('id').toArray()
      this.contributions = await db.contributions.toArray()
    },

    /** Montant à mettre de côté chaque mois pour tenir la date limite. */
    suggestedMonthly(goal: Goal): number | null {
      if (!goal.deadline) return null
      const remaining = Math.max(goal.target - this.savedFor(goal.id), 0)
      return remaining / monthsUntil(goal.deadline)
    },

    async addGoal(data: Omit<Goal, 'id' | 'createdAt'>) {
      await db.goals.add({ ...data, createdAt: today() } as Goal)
      await this.load()
    },

    async updateGoal(goal: Goal) {
      await db.goals.put(goal)
      await this.load()
    },

    /** Supprime l'objectif et toutes ses contributions. */
    async removeGoal(id: number) {
      await db.transaction('rw', [db.goals, db.contributions], async () => {
        await db.contributions.where('goalId').equals(id).delete()
        await db.goals.delete(id)
      })
      await this.load()
    },

    /** Met de côté (montant > 0) ou retire (montant < 0). */
    async contribute(goalId: number, amount: number, note?: string) {
      if (!amount) return
      await db.contributions.add({
        goalId,
        amount,
        date: today(),
        note: note?.trim() || undefined
      } as Contribution)
      await this.load()
    },

    async removeContribution(id: number) {
      await db.contributions.delete(id)
      await this.load()
    }
  }
})
