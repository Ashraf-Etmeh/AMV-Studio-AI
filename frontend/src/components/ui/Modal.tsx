import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import styles from './Controls.module.css'

interface ModalProps {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}

export function Modal({ title, description, children, onClose, wide = false }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const element = dialog.current
    const trigger = document.activeElement
    element?.showModal()
    // React mounts children while the native dialog is still closed. Focus after
    // showModal so the intended input is actually focusable, including StrictMode.
    element?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    return () => {
      element?.close()
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus()
    }
  }, [])

  return (
    <dialog ref={dialog} className={`${styles.dialog} ${wide ? styles.wide : ''}`}
      aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onKeyDown={(event) => {
        // Search inputs may consume Escape to clear themselves before the dialog
        // receives a native cancel event. Keep dismissal consistent across fields.
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
          return
        }
        if (event.key !== 'Tab') return
        const elements = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
        )).filter((element) => element.getClientRects().length > 0)
        const first = elements[0]
        const last = elements.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}>
      <header className={styles.dialogHeader}>
        <div>
          <span className={styles.eyebrow}>AMV STUDIO AI</span>
          <h2 id={titleId}>{title}</h2>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close dialog"><X size={21} /></button>
      </header>
      {description && <p id={descriptionId} className={styles.description}>{description}</p>}
      {children}
    </dialog>
  )
}
