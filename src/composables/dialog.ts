import { reactive } from 'vue'

type Kind = 'confirm' | 'prompt' | 'alert'

export interface DialogOptions {
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Bouton de confirmation en rouge (action destructrice) */
  danger?: boolean
  /** Valeur initiale (prompt) */
  value?: string
  placeholder?: string
}

export const dialogState = reactive({
  open: false,
  kind: 'confirm' as Kind,
  title: '',
  message: '',
  confirmLabel: 'OK',
  cancelLabel: 'Annuler',
  danger: false,
  value: '',
  placeholder: ''
})

let resolver: ((value: unknown) => void) | null = null

function openDialog(kind: Kind, o: DialogOptions) {
  dialogState.kind = kind
  dialogState.title = o.title ?? ''
  dialogState.message = o.message ?? ''
  dialogState.confirmLabel = o.confirmLabel ?? (kind === 'alert' ? 'OK' : 'Confirmer')
  dialogState.cancelLabel = o.cancelLabel ?? 'Annuler'
  dialogState.danger = o.danger ?? false
  dialogState.value = o.value ?? ''
  dialogState.placeholder = o.placeholder ?? ''
  dialogState.open = true
  return new Promise((resolve) => {
    resolver = resolve
  })
}

/** Appelé par le composant AppDialog. */
export function resolveDialog(ok: boolean) {
  if (!dialogState.open) return
  dialogState.open = false
  const result = dialogState.kind === 'prompt' ? (ok ? dialogState.value : null) : ok
  resolver?.(result)
  resolver = null
}

export function useDialog() {
  return {
    /** Retourne true si confirmé, false sinon. */
    confirm: (o: DialogOptions = {}) => openDialog('confirm', o) as Promise<boolean>,
    /** Retourne la saisie, ou null si annulé. */
    prompt: (o: DialogOptions = {}) => openDialog('prompt', o) as Promise<string | null>,
    /** Message simple à valider. */
    alert: (o: DialogOptions = {}) => openDialog('alert', o) as Promise<void>
  }
}
