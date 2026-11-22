import { useState } from 'react'
import { useAuth, useMutations } from 'deepspace'
import { Trash2 } from 'lucide-react'
import type { Envelope, StudioRoom } from './model'
import { ConfirmDialog } from './ConfirmDialog'

export function DeleteStudioButton({
  studio,
  iconOnly = false,
  onDeleted,
}: {
  studio: Envelope<StudioRoom>
  iconOnly?: boolean
  onDeleted?: () => void
}) {
  const { isSignedIn, userId } = useAuth()
  const { removeConfirmed, ready } = useMutations<StudioRoom>('studios')
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  if (!isSignedIn || !userId || userId !== studio.createdBy) return null

  async function handleDelete() {
    setPending(true)
    setError('')
    try {
      await removeConfirmed(studio.recordId)
      setOpen(false)
      onDeleted?.()
    } catch {
      setError('Couldn’t delete the studio. Try again.')
    } finally {
      setPending(false)
    }
  }

  function handleClose() {
    if (pending) return
    setOpen(false)
    setError('')
  }

  return (
    <div className={iconOnly ? 'studio-delete-card' : 'studio-delete'}>
      <button
        type="button"
        className={iconOnly ? 'studio-delete-icon' : 'outline-button'}
        aria-label={iconOnly ? `Delete ${studio.data.title}` : undefined}
        title={iconOnly ? 'Delete studio' : undefined}
        disabled={!ready || pending}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setError('')
          setOpen(true)
        }}
      >
        <Trash2 size={16} aria-hidden="true" />
        {!iconOnly && 'Delete studio'}
      </button>
      <ConfirmDialog
        open={open}
        title={`Delete “${studio.data.title}”?`}
        body="Its public link will stop working. This can’t be undone."
        confirmLabel={pending ? 'Deleting…' : 'Delete'}
        confirmVariant="danger"
        isPending={pending}
        error={error}
        onConfirm={() => void handleDelete()}
        onClose={handleClose}
      />
    </div>
  )
}
