import { useState } from 'react'
import { useMutations } from 'deepspace'
import type { DrawingBatch, StudioRoom } from './model'
import type { Example } from './examples'

/** Copies a featured piece into a new studio owned by the signed-in user. */
export function useCopyExample() {
  const roomWrites = useMutations<StudioRoom>('studios')
  const batchWrites = useMutations<DrawingBatch>('drawing-batches')
  const [pending, setPending] = useState<string | false>(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<Record<string, string>>({})

  async function copy(example: Example) {
    setPending(example.slug)
    setError('')
    try {
      const id = await roomWrites.createConfirmed({ title: example.title, brief: example.brief, style: example.style })
      for (const batch of example.batches)
        await batchWrites.createConfirmed({
          roomId: id,
          label: batch.label,
          operations: JSON.stringify(batch.marks.map((mark) => ({ op: 'put', mark }))),
        })
      setCopied((c) => ({ ...c, [example.slug]: id }))
      return id
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to copy this painting.')
    } finally {
      setPending(false)
    }
  }

  return { copy, pending, error, copied, ready: roomWrites.ready && batchWrites.ready }
}
