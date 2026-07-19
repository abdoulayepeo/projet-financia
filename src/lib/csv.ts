import type { Transaction } from '../db'

/**
 * Télécharge les transactions au format CSV (séparateur « ; », compatible
 * Excel français, BOM UTF-8 pour les accents).
 */
export function downloadCsv(transactions: Transaction[], filename: string) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
  const lines = [
    'Date;Type;Catégorie;Montant;Note',
    ...transactions.map((t) =>
      [
        t.date,
        t.type === 'income' ? 'Revenu' : 'Dépense',
        escape(t.category),
        String(t.amount).replace('.', ','),
        escape(t.note ?? '')
      ].join(';')
    )
  ]
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
