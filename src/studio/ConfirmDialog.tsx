import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'danger' | 'dark'
  isPending?: boolean
  error?: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  isPending = false,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId()
  const cancelBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    // Focus Cancel button on open as required
    cancelBtnRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isPending) {
        e.stopPropagation()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, isPending, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="modal-scrim"
      onClick={(e) => {
        e.stopPropagation()
        if (e.target === e.currentTarget && !isPending) {
          onClose()
        }
      }}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Escape' && !isPending) {
          onClose()
        }
      }}
    >
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={() => {
            if (!isPending) onClose()
          }}
          disabled={isPending}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <h2 id={titleId}>{title}</h2>
        <p>{body}</p>

        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}

        <div className="confirm-actions">
          <button
            ref={cancelBtnRef}
            type="button"
            className="outline-button"
            onClick={onClose}
            disabled={isPending}
            autoFocus
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmVariant === 'danger' ? 'danger-button' : 'dark-button'}
            onClick={onConfirm}
            disabled={isPending}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
