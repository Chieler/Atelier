import { useEffect, useMemo, useState } from 'react'
import { readOperations, replay, type DrawingBatch, type Envelope } from './model'

type Progress = {
  roomId: string
  batches: Envelope<DrawingBatch>[]
  enabled: boolean
  visible: ReadonlyMap<string, number>
}

export function useLiveDrawing(
  roomId: string,
  batches: Envelope<DrawingBatch>[],
  enabled: boolean,
) {
  const steps = useMemo(() => batches.map(batch => ({
    batch,
    length: readOperations(batch).length,
  })), [batches])
  const [progress, setProgress] = useState<Progress>(() => ({
    roomId,
    batches,
    enabled,
    visible: new Map(steps.map(({ batch, length }) => [batch.recordId, length])),
  }))

  if (progress.roomId !== roomId || progress.batches !== batches || progress.enabled !== enabled) {
    const animate = enabled && progress.enabled && progress.roomId === roomId
    setProgress({
      roomId,
      batches,
      enabled,
      visible: new Map(steps.map(({ batch, length }) => [
        batch.recordId,
        animate ? progress.visible.get(batch.recordId) ?? 0 : length,
      ])),
    })
  }

  const queue = enabled ? steps.filter(({ batch, length }) =>
    (progress.visible.get(batch.recordId) ?? 0) < length) : []
  const activeBatch = queue[0]?.batch
  const remaining = queue.reduce((total, { batch, length }) =>
    total + length - (progress.visible.get(batch.recordId) ?? 0), 0)

  useEffect(() => {
    if (!activeBatch) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const flush = () => {
      setProgress(current => current !== progress ? current : ({
        ...current,
        visible: new Map(steps.map(({ batch, length }) => [batch.recordId, length])),
      }))
    }
    // ponytail: ~30 reveal steps; each step re-rasterizes the whole filtered SVG, so more steps just lag.
    const delay = Math.min(135, Math.max(50, 1500 / remaining))
    const timer = window.setTimeout(() => {
      if (document.hidden || motion.matches) {
        flush()
        return
      }
      setProgress(current => {
        if (current !== progress) return current
        const visible = new Map(current.visible)
        visible.set(activeBatch.recordId, (visible.get(activeBatch.recordId) ?? 0) + Math.ceil(remaining / 30))
        return { ...current, visible }
      })
    }, document.hidden || motion.matches ? 0 : delay)
    return () => window.clearTimeout(timer)
  }, [activeBatch, progress, remaining, steps])

  const marks = useMemo(() => replay(batches, batches.length, enabled ? progress.visible : undefined),
    [batches, enabled, progress.visible])

  return { marks, activeBatch }
}
