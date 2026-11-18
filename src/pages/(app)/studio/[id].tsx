import { useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutations, useAuth, useUserLookup } from 'deepspace'
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
import {
  ordered,
  replay,
  svg,
  type StudioRoom,
  type DrawingBatch,
  type Message,
} from '../../../studio/model'

export default function Studio() {
  const { id = '' } = useParams()
  const { records: rooms, status } = useQuery<StudioRoom>('studios', {
    where: { recordId: id },
  })
  const { records: batches } = useQuery<DrawingBatch>('drawing-batches', {
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
  const { isSignedIn } = useAuth()
  const { getName } = useUserLookup()
  const [tab, setTab] = useState<'conversation' | 'history'>('conversation')
  const [revision, setRevision] = useState<number | null>(null)
  const [body, setBody] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [agent, setAgent] = useState(false)
  const [copied, setCopied] = useState(false)
  const sorted = useMemo(() => ordered(batches), [batches])
  const marks = useMemo(
    () => replay(sorted, revision ?? sorted.length),
    [sorted, revision],
  )
  const source = useMemo(() => svg(marks), [marks])
  const image = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`
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
  const instructions = `Join my Atelier drawing room: ${location.origin}/studio/${id}\nRead the brief and style guide first. Sign in to the app as an authorized member before using your DeepSpace CLI session.\nDiscover tools: npx deepspace agent tools ${location.origin} --json\nInvoke the returned studio_read tool with roomId: ${id}. Then use studio_paint for small labelled drawing batches and studio_comment for plans or questions.\nCurrent image: ${location.origin}/api/studios/${id}/view.svg\nCanvas: 1000 × 700. Use stable agent-prefixed mark IDs. Inspect your actual rendered work and read feedback between passes. This is a public room.`
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
              <span className="public-label">Public studio</span>
              <button className="outline-button" onClick={download}>
                <Download size={15} /> Export SVG
              </button>
              <button className="dark-button" onClick={() => setAgent(true)}>
                Invite an agent <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
          <div className="workspace">
            <aside className="brief-panel">
              <div className="eyebrow">THE DIRECTION</div>
              <h2>The brief</h2>
              <p>{room.data.brief}</p>
              <div className="panel-rule" />
              <div className="eyebrow">VISUAL LANGUAGE</div>
              <h2>Style notes</h2>
              <p className="preserve-space">{room.data.style}</p>
              <div className="panel-rule" />
              <div className="canvas-spec">
                <span>Canvas</span>
                <strong>1000 × 700</strong>
                <span>Medium</span>
                <strong>Layered vector</strong>
                <span>Visibility</span>
                <strong>Public</strong>
              </div>
              <p className="small-note">
                Give your agent the room link. Its drawing batches and your
                feedback meet here.
              </p>
            </aside>
            <section className="canvas-panel">
              <div className="canvas-toolbar">
                <span>
                  <span className="status-dot" />{' '}
                  {revision === null ? 'Latest canvas' : `Revision ${revision}`}
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
                {!marks.length && (
                  <div className="empty-canvas">
                    <span className="empty-cross">✳</span>
                    <h2>Room for a first mark.</h2>
                    <p>Invite your agent and let the brief take shape.</p>
                    <button
                      className="outline-button"
                      onClick={() => setAgent(true)}
                    >
                      Get agent instructions <ArrowUpRight size={14} />
                    </button>
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
                  <Radio size={13} /> Latest
                </button>
              </div>
              <div className="canvas-caption">
                A shared surface. A visible process.
              </div>
            </section>
            <aside className="discussion-panel">
              <div className="panel-tabs">
                <button
                  className={tab === 'conversation' ? 'selected' : ''}
                  onClick={() => setTab('conversation')}
                >
                  <MessageSquare size={14} /> Conversation
                </button>
                <button
                  className={tab === 'history' ? 'selected' : ''}
                  onClick={() => setTab('history')}
                >
                  <History size={14} /> History
                </button>
              </div>
              {tab === 'conversation' ? (
                <>
                  <div className="message-list">
                    <div className="thread-intro">
                      <span className="eyebrow">THE FEEDBACK LOOP</span>
                      <p>Plan, draw, look, refine.</p>
                      <span>Keep direction close to the work.</span>
                    </div>
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
                    <textarea
                      id="feedback"
                      maxLength={2000}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder={
                        isSignedIn
                          ? 'What should change? Be specific.'
                          : 'Sign in to leave feedback.'
                      }
                      disabled={!isSignedIn}
                    />
                    <div>
                      <span>
                        {isSignedIn
                          ? 'Your agent can read this thread.'
                          : 'Public viewing · Sign in to contribute'}
                      </span>
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
                  <p className="small-note">
                    Each batch is a saved step. Select one to inspect the
                    drawing at that moment.
                  </p>
                  <button
                    onClick={() => setRevision(0)}
                    className="history-item"
                  >
                    <span>00</span>
                    <div>
                      Blank canvas<small>The starting point</small>
                    </div>
                  </button>
                  {sorted.map((batch, i) => (
                    <button
                      className={`history-item ${revision === i + 1 ? 'current' : ''}`}
                      key={batch.recordId}
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
                  ))}
                </div>
              )}
            </aside>
          </div>
        </>
      )}
      {agent && (
        <div className="modal-scrim">
          <section
            className="agent-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-title"
          >
            <button
              autoFocus
              className="modal-close"
              onClick={() => setAgent(false)}
              aria-label="Close agent instructions"
            >
              <X size={20} />
            </button>
            <div className="eyebrow">BRING YOUR OWN AGENT</div>
            <h2 id="agent-title">A seat at the canvas.</h2>
            <p>
              Send these instructions to your coding agent. It uses its
              DeepSpace login; a room link does not grant write access.
            </p>
            <pre>{instructions}</pre>
            <button
              className="dark-button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(instructions)
                  setCopied(true)
                } catch {
                  setError(
                    'Clipboard unavailable. Select and copy the instructions.',
                  )
                }
              }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}{' '}
              {copied ? 'Instructions copied' : 'Copy instructions'}
            </button>
            {error && <p role="alert">{error}</p>}
          </section>
        </div>
      )}
    </div>
  )
}
