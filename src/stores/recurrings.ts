import { defineStore } from 'pinia'
import { db, type Recurring, type Transaction } from '../db'
import { currentMonth, daysInMonth, shiftMonth } from '../lib/months'

export const useRecurringsStore = defineStore('recurrings', {
  state: () => ({
    recurrings: [] as Recurring[]
  }),

  actions: {
    async load() {
      this.recurrings = await db.recurrings.toArray()
    },

    /**
     * Génère les transactions de tous les mois écoulés depuis la dernière
     * application (appelé au démarrage de l'app : rattrape aussi les mois
     * passés sans ouverture).
     */
    async applyDue() {
      const now = currentMonth()
      for (const r of await db.recurrings.toArray()) {
        let month = r.lastAppliedMonth
        while (month < now) {
          month = shiftMonth(month, 1)
          const day = Math.min(r.dayOfMonth, daysInMonth(month))
          await db.transactions.add({
            type: r.type,
            amount: r.amount,
            category: r.category,
            note: r.note,
            date: `${month}-${String(day).padStart(2, '0')}`,
            recurringId: r.id
          } as Transaction)
        }
        if (r.lastAppliedMonth !== now) {
          await db.recurrings.update(r.id, { lastAppliedMonth: now })
        }
      }
    },

    /** Ajoute une récurrence et crée immédiatement sa transaction du mois courant. */
    async add(data: Omit<Recurring, 'id' | 'lastAppliedMonth'>) {
      await db.recurrings.add({
        ...data,
        lastAppliedMonth: shiftMonth(currentMonth(), -1)
      } as Recurring)
      await this.applyDue()
      await this.load()
    },

    /** Supprime la récurrence (les transactions déjà créées sont conservées). */
    async remove(id: number) {
      await db.recurrings.delete(id)
      await this.load()
    }
  }
})
