import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthOverlay, useAuth, useQuery, useMutations } from 'deepspace'
import { ArrowUpRight, Plus, X, ArrowRight } from 'lucide-react'
import { Header } from '../../studio/Header'
import {
  markSchema,
  ordered,
  type StudioRoom,
  type DrawingBatch,
} from '../../studio/model'
import example from '../../studio/example.json'

export default function Home() {
  const { records: rooms, status } = useQuery<StudioRoom>('studios', {
    orderBy: 'createdAt',
    orderDir: 'desc',
  })
  const roomWrites = useMutations<StudioRoom>('studios')
  const batchWrites = useMutations<DrawingBatch>('drawing-batches')
  const { isSignedIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(false),
    [auth, setAuth] = useState(false)
  const [title, setTitle] = useState(''),
    [brief, setBrief] = useState(''),
    [style, setStyle] = useState('')
  const [pending, setPending] = useState(false),
    [error, setError] = useState('')
  async function create(seed = false) {
    setPending(true)
    setError('')
    try {
      const data = seed
        ? {
            title: 'Moonlit crossing',
            brief:
              'A fox leaping across a forest ravine under a full moon. Give the leap a clear silhouette and a sense of height.',
            style:
              'Three-ink woodcut. Warm paper #F1E3C6, charcoal #172126, rust #BA4B35. Broad carved cuts and strong negative space. Keep the composition readable at thumbnail size.',
          }
        : { title: title.trim(), brief: brief.trim(), style: style.trim() }
      const id = await roomWrites.createConfirmed(data)
      if (seed) {
        const marks = example.map((mark) => markSchema.parse(mark))
        for (let i = 0; i < marks.length; i += 16)
          await batchWrites.createConfirmed({
            roomId: id,
            label:
              [
                'Establish the forest',
                'Build the crossing',
                'Carve light and detail',
              ][Math.floor(i / 16)] ?? 'Refine',
            operations: JSON.stringify(
              marks.slice(i, i + 16).map((mark) => ({ op: 'put', mark })),
            ),
          })
      }
      navigate(`/studio/${id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create studio.')
      setPending(false)
    }
  }
  return (
    <div className="atelier">
      <Header />
      <main className="studio-home">
        <div className="home-intro">
          <div>
            <div className="eyebrow">MAKE SOMETHING, TOGETHER</div>
            <h1>
              Good work takes
              <br />
              <em>a conversation.</em>
            </h1>
            <p>
              A place to brief your drawing agents, watch their work unfold,
              <br className="desktop-break" /> and shape the next mark.
            </p>
          </div>
          <div className="intro-actions">
            <button
              className="dark-button"
              onClick={() => (isSignedIn ? setForm(true) : setAuth(true))}
            >
              <Plus size={17} /> New studio
            </button>
            <span>
              One brief. A shared canvas.
              <br />
              As many passes as it takes.
            </span>
          </div>
        </div>
        <div className="section-heading">
          <h2>
            The studios <span>{rooms.length.toString().padStart(2, '0')}</span>
          </h2>
          <span>Open rooms · Shared with everyone</span>
        </div>
        {status === 'loading' ? (
          <div className="page-state">Loading studios…</div>
        ) : (
          <div className="room-grid">
            {ordered(rooms)
              .reverse()
              .map((room, i) => (
                <Link
                  className="room-card"
                  key={room.recordId}
                  to={`/studio/${room.recordId}`}
                >
                  <div className="room-preview">
                    <img
                      loading="lazy"
                      src={`/api/studios/${room.recordId}/view.svg`}
                      alt={`Preview of ${room.data.title}`}
                    />
                    <span className="card-index">
                      STUDIO {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="card-arrow">
                      <ArrowUpRight size={19} />
                    </span>
                  </div>
                  <div className="card-detail">
                    <h3>{room.data.title}</h3>
                    <p>{room.data.brief}</p>
                    <span>
                      Enter studio <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              ))}
            <button
              className="new-room-card"
              onClick={() => (isSignedIn ? setForm(true) : setAuth(true))}
            >
              <span className="new-plus">
                <Plus size={25} />
              </span>
              <h3>A blank canvas awaits.</h3>
              <p>
                Start with a direction.
                <br />
                Invite an agent to explore it.
              </p>
            </button>
          </div>
        )}
        <div className="example-strip">
          <div>
            <span className="eyebrow">FROM THE DRAWING EXPERIMENTS</span>
            <h3>See how a room works.</h3>
            <p>
              Open an editable copy of our fox illustration, with three
              replayable batches. This is a saved example, not a live agent run.
            </p>
          </div>
          <button
            className="outline-button"
            disabled={
              pending ||
              (isSignedIn && (!roomWrites.ready || !batchWrites.ready))
            }
            onClick={() => (isSignedIn ? void create(true) : setAuth(true))}
          >
            {pending ? 'Preparing…' : 'Open the example'}{' '}
            <ArrowUpRight size={15} />
          </button>
        </div>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <footer className="home-footer">
          <span>Made for the space between idea and image.</span>
          <span>Powered by DeepSpace</span>
        </footer>
      </main>
      {auth && (
        <AuthOverlay title="Enter the studio" onClose={() => setAuth(false)} />
      )}{' '}
      {form && (
        <div className="modal-scrim">
          <form
            className="create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-title"
            onSubmit={(e) => {
              e.preventDefault()
              void create()
            }}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setForm(false)}
              aria-label="Close new studio"
            >
              <X size={20} />
            </button>
            <div className="eyebrow">A NEW DIRECTION</div>
            <h2 id="new-title">Set the scene.</h2>
            <p>
              Your brief is the starting point. The conversation takes it from
              there.
            </p>
            <label>
              Studio name
              <input
                autoFocus
                required
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. A city after the rain"
              />
            </label>
            <label>
              The brief
              <textarea
                required
                maxLength={3000}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="What should your agent draw? Describe the subject and composition."
              />
            </label>
            <label>
              Style guide
              <textarea
                required
                maxLength={3000}
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="Palette, medium, references, and what to avoid."
              />
            </label>
            <p className="small-note">
              Public room. Signed-in members can draw and comment.
            </p>
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
            <button
              className="dark-button"
              disabled={
                pending ||
                !roomWrites.ready ||
                !title.trim() ||
                !brief.trim() ||
                !style.trim()
              }
            >
              {pending ? 'Creating…' : 'Create studio'}
              <ArrowUpRight size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
