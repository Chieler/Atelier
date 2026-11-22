import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AuthOverlay, useAuth } from 'deepspace'
import { ArrowLeft, ArrowRight, Check, Copy, History, Radio } from 'lucide-react'
import { Header } from '../../../studio/Header'
import { examples } from '../../../studio/examples'
import { replay, svg, type DrawingBatch, type Envelope } from '../../../studio/model'
import { useLiveDrawing } from '../../../studio/useLiveDrawing'
import { useCopyExample } from '../../../studio/useCopyExample'

/** Read-only studio view of a featured piece; Copy turns it into the visitor's own studio. */
export default function Featured() {
  const { slug = '' } = useParams()
  const example = examples.find((e) => e.slug === slug)
  const { isSignedIn } = useAuth()
  const { copy, pending, error, copied, ready } = useCopyExample()
  const [auth, setAuth] = useState(false)
  const [tab, setTab] = useState<'brief' | 'history'>('brief')
  const [revision, setRevision] = useState<number | null>(null)

  const batches = useMemo<Envelope<DrawingBatch>[]>(
    () =>
      (example?.batches ?? []).map((b, i) => ({
        recordId: `${slug}-${i}`,
        createdAt: i,
        data: { roomId: slug, label: b.label, operations: JSON.stringify(b.marks.map((mark) => ({ op: 'put', mark }))) },
      })),
    [example, slug],
  )
  const live = useLiveDrawing(slug, batches, revision === null)
  const marks = useMemo(() => (revision === null ? live.marks : replay(batches, revision)), [revision, live.marks, batches])
  const image = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg(marks))}`, [marks])

  if (!example)
    return (
      <div className="atelier">
        <Header />
        <div className="page-state">
          <h1>Painting not found</h1>
          <Link to="/home">Back to studios</Link>
        </div>
      </div>
    )

  const copiedId = copied[example.slug]
  return (
    <div className="atelier">
      <Header />
      <div className="room-heading">
        <div>
          <Link className="back-link" to="/home">
            <ArrowLeft size={13} /> All studios
          </Link>
          <h1>{example.title}</h1>
        </div>
        <div className="room-actions">
          {copiedId ? (
            <Link className="dark-button" to={`/studio/${copiedId}`}>
              <Check size={15} /> Copied · Open your studio <ArrowRight size={15} />
            </Link>
          ) : (
            <button
              className="dark-button"
              disabled={!!pending || (isSignedIn && !ready)}
              onClick={() => (isSignedIn ? void copy(example) : setAuth(true))}
            >
              <Copy size={15} /> {pending ? 'Copying…' : 'Copy to my studios'}
            </button>
          )}
        </div>
      </div>
      {error && <p role="alert" className="error-text">{error}</p>}
      <div className="workspace">
        <section className="canvas-panel">
          <div className="canvas-toolbar">
            <span>
              <span className="status-dot" /> {revision === null ? (live.activeBatch ? 'Drawing…' : 'Featured painting') : `Revision ${revision}`}
            </span>
            <span>
              {marks.length} marks · {batches.length} revisions
            </span>
          </div>
          <div className="canvas-stage">
            <img src={image} alt={`${example.title}, ${revision === null ? 'finished painting' : `revision ${revision}`}`} />
          </div>
          <div className="replay-bar">
            <History size={16} />
            <label htmlFor="revision">Replay</label>
            <input
              id="revision"
              type="range"
              min={0}
              max={batches.length}
              value={revision ?? batches.length}
              onChange={(e) => setRevision(Number(e.target.value))}
            />
            <span>
              {revision ?? batches.length} / {batches.length}
            </span>
            <button className={revision === null ? 'live-button active' : 'live-button'} onClick={() => setRevision(null)}>
              <Radio size={13} /> {revision === null ? 'Latest' : 'Return to latest'}
            </button>
          </div>
          {live.activeBatch && <p className="drawing-activity">{live.activeBatch.data.label}</p>}
        </section>
        <aside className="discussion-panel">
          <div className="panel-tabs" role="tablist" aria-label="Painting details">
            <button role="tab" aria-selected={tab === 'brief'} className={tab === 'brief' ? 'selected' : ''} onClick={() => setTab('brief')}>
              Brief
            </button>
            <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'selected' : ''} onClick={() => setTab('history')}>
              <History size={14} /> History
            </button>
          </div>
          {tab === 'brief' ? (
            <div className="brief-panel">
              <h2>Brief</h2>
              <p>{example.brief}</p>
              <div className="panel-rule" />
              <h2>Style notes</h2>
              <p className="preserve-space">{example.style}</p>
            </div>
          ) : (
            <div className="history-list">
              <button onClick={() => setRevision(0)} className="history-item">
                <span>00</span>
                <div>Blank canvas</div>
              </button>
              {batches.map((batch, i) => (
                <button
                  key={batch.recordId}
                  className={`history-item ${revision === i + 1 ? 'current' : ''}`}
                  onClick={() => setRevision(i + 1)}
                >
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <div>{batch.data.label}</div>
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>
      {auth && !isSignedIn && <AuthOverlay title="Sign in to copy this painting" onClose={() => setAuth(false)} />}
    </div>
  )
}
