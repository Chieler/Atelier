import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AuthOverlay, getAuthToken, useQuery, useMutations, useAuth, useUserLookup } from 'deepspace'
import {
  ArrowLeft,
  ArrowUpRight,
  Copy,
  Download,
  Send,
  Radio,
  History,
  MessageSquare,
  X,
  Check,
} from 'lucide-react'
import { Header } from '../../../studio/Header'
import { DeleteStudioButton } from '../../../studio/DeleteStudioButton'
import { ConfirmDialog } from '../../../studio/ConfirmDialog'
import {
  ordered,
  replay,
  svg,
  type StudioRoom,
  type DrawingBatch,
  type Message,
  historyOperation,
} from '../../../studio/model'
import { useLiveDrawing } from '../../../studio/useLiveDrawing'

export default function Studio() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { records: rooms, status } = useQuery<StudioRoom>('studios', {
    where: { recordId: id },
  })
  const { records: batches, status: batchStatus } = useQuery<DrawingBatch>('drawing-batches', {
    where: { roomId: id },
    orderBy: 'createdAt',
    orderDir: 'asc',
  })
  const { records: messages } = useQuery<Message>('studio-messages', {
    where: { roomId: id },
    orderBy: 'createdAt',
    orderDir: 'asc',
  })
  const comments = useMutations<Message>('studio-messages')
  const drawings = useMutations<DrawingBatch>('drawing-batches')
  const { isSignedIn, userId } = useAuth()
  const { getName } = useUserLookup()
  const [tab, setTab] = useState<'brief' | 'conversation' | 'history'>('conversation')
  const [revision, setRevision] = useState<number | null>(null)
  const [body, setBody] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [canvasPending, setCanvasPending] = useState(false)
  const [canvasMessage, setCanvasMessage] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearError, setClearError] = useState('')
  const [auth, setAuth] = useState<string | null>(null)
  const [agent, setAgent] = useState(false)
  const sorted = useMemo(() => ordered(batches), [batches])
  const latestMarks = useMemo(() => replay(sorted), [sorted])
  const fullMarks = useMemo(
    () => revision === null ? latestMarks : replay(sorted, revision),
    [latestMarks, sorted, revision],
  )
  const live = useLiveDrawing(id, sorted, revision === null && batchStatus !== 'loading')
  const marks = revision === null ? live.marks : fullMarks
  const source = useMemo(() => svg(fullMarks), [fullMarks])
  const displaySource = useMemo(() => svg(marks), [marks])
  const image = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(displaySource)}`
  const room = rooms[0]
  async function send() {
    if (!body.trim()) return
    setPending(true)
    setError('')
    try {
      await comments.createConfirmed({ roomId: id, body: body.trim() })
      setBody('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send feedback')
    } finally {
      setPending(false)
    }
  }
  async function changeCanvas(operation: { op: 'clear' } | { op: 'restore'; clearId: string }) {
    if (operation.op === 'clear' && revision !== null) return
    if (!isSignedIn) {
      setAuth(operation.op === 'clear' ? 'Sign in to clear the canvas' : 'Sign in to restore the canvas')
      return
    }
    if (!drawings.ready || canvasPending) return
    if (operation.op === 'clear') {
      setClearError('')
      setConfirmClear(true)
      return
    }
    setCanvasPending(true)
    setCanvasMessage('')
    try {
      const label = 'Canvas restored'
      await drawings.createConfirmed({ roomId: id, label, operations: JSON.stringify([operation]) })
      setRevision(null)
      setCanvasMessage('Canvas restored.')
    } catch (e) {
      setCanvasMessage(e instanceof Error ? e.message : 'Could not update the canvas')
    } finally {
      setCanvasPending(false)
    }
  }
  async function executeClearCanvas() {
    setCanvasPending(true)
    setClearError('')
    try {
      await drawings.createConfirmed({
        roomId: id,
        label: 'Canvas cleared',
        operations: JSON.stringify([{ op: 'clear' }]),
      })
      setRevision(null)
      setCanvasMessage('Canvas cleared.')
      setConfirmClear(false)
    } catch (e) {
      setClearError(e instanceof Error ? e.message : 'Could not update the canvas')
    } finally {
      setCanvasPending(false)
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([source], { type: 'image/svg+xml' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `atelier-${id}.svg`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <div className="atelier">
      <Header />
      {status === 'loading' ? (
        <div className="page-state">Opening the studio…</div>
      ) : !room ? (
        <div className="page-state">
          <h1>Room not found</h1>
          <Link to="/home">Back to your studios</Link>
        </div>
      ) : (
        <>
          <div className="room-heading">
            <div>
              <Link className="back-link" to="/home">
                <ArrowLeft size={13} /> All studios
              </Link>
              <h1>{room.data.title}</h1>
            </div>
            <div className="room-actions">
              <DeleteStudioButton studio={room} onDeleted={() => navigate('/home')} />
              {(latestMarks.length > 0 || (revision !== null && marks.length > 0)) && (
                <button
                  className="outline-button"
                  disabled={revision !== null || canvasPending || (isSignedIn && !drawings.ready)}
                  title={revision !== null ? 'Return to live to clear' : undefined}
                  onClick={() => void changeCanvas({ op: 'clear' })}
                >
                  Clear canvas
                </button>
              )}
              <button className="outline-button" onClick={download}>
                <Download size={15} /> Export SVG
              </button>
              <button className="dark-button" onClick={() => setAgent(true)}>
                Invite an agent <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
          <div className="workspace">
            <section className="canvas-panel">
              <div className="canvas-toolbar">
                <span>
                  <span className="status-dot" />{' '}
                  {revision === null ? (live.activeBatch ? 'Drawing…' : 'Live canvas') : `Revision ${revision}`}
                </span>
                <span>
                  {marks.length} marks · {sorted.length} revisions
                </span>
              </div>
              <div className="canvas-stage">
                <img
                  src={image}
                  alt={`Drawing in ${room.data.title}, ${revision === null ? 'latest revision' : `revision ${revision}`}`}
                />
                {!marks.length && !live.activeBatch && (
                  <div className="empty-canvas">
                    <h2>Room for a first mark.</h2>
                  </div>
                )}
              </div>
              <div className="replay-bar">
                <History size={16} />
                <label htmlFor="revision">Replay</label>
                <input
                  id="revision"
                  aria-label="Drawing revision"
                  type="range"
                  min={0}
                  max={sorted.length}
                  value={revision ?? sorted.length}
                  onChange={(e) => setRevision(Number(e.target.value))}
                />
                <span>
                  {revision ?? sorted.length} / {sorted.length}
                </span>
                <button
                  className={
                    revision === null ? 'live-button active' : 'live-button'
                  }
                  onClick={() => setRevision(null)}
                >
                  <Radio size={13} /> {revision === null ? 'Live' : 'Return to live'}
                </button>
              </div>
              {live.activeBatch && (
                <p className="drawing-activity">
                  {getName(live.activeBatch.createdBy ?? '') ?? 'Contributor'} · {live.activeBatch.data.label}
                </p>
              )}
              {canvasMessage && <p role="status" className="drawing-activity">{canvasMessage}</p>}
            </section>
            <aside className="discussion-panel">
              <div className="panel-tabs" role="tablist" aria-label="Studio details">
                <button role="tab" aria-selected={tab === 'brief'} className={tab === 'brief' ? 'selected' : ''} onClick={() => setTab('brief')}>Brief</button>
                <button
                  role="tab" aria-selected={tab === 'conversation'}
                  className={tab === 'conversation' ? 'selected' : ''}
                  onClick={() => setTab('conversation')}
                >
                  <MessageSquare size={14} /> Conversation
                </button>
                <button
                  role="tab" aria-selected={tab === 'history'}
                  className={tab === 'history' ? 'selected' : ''}
                  onClick={() => setTab('history')}
                >
                  <History size={14} /> History
                </button>
              </div>
              {tab === 'brief' ? (
            <div className="brief-panel">
              <h2>Brief</h2>
              <p>{room.data.brief}</p>
              <div className="panel-rule" />
              <h2>Style notes</h2>
              <p className="preserve-space">{room.data.style}</p>
            </div>
              ) : tab === 'conversation' ? (
                <>
                  <div className="message-list">
                    {ordered(messages).map((m) => (
                      <article className="message" key={m.recordId}>
                        <div>
                          <strong>
                            {getName(m.createdBy ?? '') ?? 'Contributor'}
                          </strong>
                          <time>
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </time>
                        </div>
                        <p>{m.data.body}</p>
                      </article>
                    ))}
                  </div>
                  <form
                    className="comment-form"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void send()
                    }}
                  >
                    <label className="sr-only" htmlFor="feedback">
                      Feedback
                    </label>
                    <span style={{ display: 'block', position: 'relative' }}>
                      <textarea
                        id="feedback"
                        maxLength={2000}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder={isSignedIn ? 'Leave feedback' : 'Sign in to leave feedback'}
                        disabled={!isSignedIn}
                      />
                      {!isSignedIn && (
                        <button
                          type="button"
                          aria-label="Sign in to leave feedback"
                          style={{ position: 'absolute', inset: 0, width: '100%', background: 'transparent' }}
                          onClick={() => setAuth('Sign in to leave feedback')}
                        />
                      )}
                    </span>
                    <div>
                      <button
                        aria-label="Send feedback"
                        disabled={
                          !isSignedIn ||
                          !comments.ready ||
                          pending ||
                          !body.trim()
                        }
                      >
                        <Send size={16} />
                      </button>
                    </div>
                    {error && (
                      <p role="alert" className="error-text">
                        {error}
                      </p>
                    )}
                  </form>
                </>
              ) : (
                <div className="history-list">
                  <button
                    onClick={() => setRevision(0)}
                    className="history-item"
                  >
                    <span>00</span>
                    <div>
                      Blank canvas
                    </div>
                  </button>
                  {sorted.map((batch, i) => (
                    <div className="history-row" key={batch.recordId}>
                    <button
                      className={`history-item ${revision === i + 1 ? 'current' : ''}`}
                      onClick={() => setRevision(i + 1)}
                    >
                      <span>{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        {batch.data.label}
                        <small>
                          {new Date(batch.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </small>
                      </div>
                    </button>
                    {historyOperation(batch)?.op === 'clear' && isSignedIn && (
                      <button className="restore-button" disabled={!drawings.ready || canvasPending} onClick={() => void changeCanvas({ op: 'restore', clearId: batch.recordId })}>
                        Restore
                      </button>
                    )}
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </>
      )}
      {auth && !isSignedIn && (
        <AuthOverlay title={auth} onClose={() => setAuth(null)} />
      )}
      {agent && (
        <AgentInviteModal
          key={`${id}:${userId ?? ''}`}
          roomId={id}
          isSignedIn={isSignedIn}
          onClose={() => setAgent(false)}
          onSignIn={() => {
            setAgent(false)
            setAuth('Sign in to invite an agent')
          }}
        />
      )}
      <ConfirmDialog
        open={confirmClear}
        title="Clear drawing?"
        body="Clear the current drawing? You can restore earlier drawings from history."
        confirmLabel={canvasPending ? 'Clearing…' : 'Clear canvas'}
        confirmVariant="danger"
        isPending={canvasPending}
        error={clearError}
        onConfirm={() => void executeClearCanvas()}
        onClose={() => {
          if (canvasPending) return
          setConfirmClear(false)
          setClearError('')
        }}
      />
    </div>
  )
}

function AgentInviteModal({
  roomId,
  isSignedIn,
  onClose,
  onSignIn,
}: {
  roomId: string
  isSignedIn: boolean
  onClose: () => void
  onSignIn: () => void
}) {
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isSignedIn) return
    const controller = new AbortController()

    async function loadInvite() {
      try {
        const token = await getAuthToken()
        if (!token) throw new Error('Sign in again to invite an agent.')
        const response = await fetch(`/api/studios/${encodeURIComponent(roomId)}/invite`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        const result = await response.json() as { url?: string; error?: string }
        if (!response.ok || !result.url) throw new Error(result.error || 'Could not create an invite.')
        if (!controller.signal.aborted) setPrompt(`Join my Atelier drawing room. Read ${result.url} and follow it.`)
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Could not create an invite.')
      }
    }

    void loadInvite()
    return () => controller.abort()
  }, [isSignedIn, roomId])

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setError('')
    } catch {
      setError('Clipboard unavailable. Select and copy the prompt.')
    }
  }

  return (
    <div className="modal-scrim">
      <section
        className="agent-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-title"
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
      >
        <button autoFocus className="modal-close" onClick={onClose} aria-label="Close agent invite">
          <X size={20} />
        </button>
        <h2 id="agent-title">Invite an agent</h2>
        {!isSignedIn ? (
          <button className="dark-button" onClick={onSignIn}>Sign in</button>
        ) : prompt ? (
          <>
            <pre>{prompt}</pre>
            <button
              className="dark-button"
              onClick={() => void copyPrompt()}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}{' '}
              {copied ? 'Prompt copied' : 'Copy prompt'}
            </button>
          </>
        ) : !error && (
          <p role="status">Creating invite…</p>
        )}
        {error && <p role="alert">{error}</p>}
      </section>
    </div>
  )
}
