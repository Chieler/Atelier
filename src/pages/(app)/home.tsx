import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthOverlay, useAuth, useQuery, useMutations } from 'deepspace'
import { useCopyExample } from '../../studio/useCopyExample'
import { ArrowUpRight, Plus, X, ArrowRight, Copy, Check } from 'lucide-react'
import { Header } from '../../studio/Header'
import { DeleteStudioButton } from '../../studio/DeleteStudioButton'
import { ordered, type StudioRoom } from '../../studio/model'
import { examples, exampleImage, type Example } from '../../studio/examples'

export default function Home() {
  const { records: rooms, status } = useQuery<StudioRoom>('studios', {
    orderBy: 'createdAt',
    orderDir: 'desc',
  })
  const roomWrites = useMutations<StudioRoom>('studios')
  const { isSignedIn, userId } = useAuth()
  // Rooms are public, but the home page only lists your own; strangers' and
  // test rooms stay reachable by link without cluttering the gallery.
  const mine = isSignedIn ? ordered(rooms).reverse().filter((r) => r.createdBy === userId) : []
  const navigate = useNavigate()
  const [form, setForm] = useState(false),
    [auth, setAuth] = useState(false)
  const [title, setTitle] = useState(''),
    [brief, setBrief] = useState(''),
    [style, setStyle] = useState('')
  const [pending, setPending] = useState<string | false>(false),
    [error, setError] = useState('')
  const featured = useCopyExample()
  const copyAction = (example: Example) =>
    featured.copied[example.slug] ? (
      <Link className="card-action" to={`/studio/${featured.copied[example.slug]}`}>
        <Check size={13} /> Copied · Open studio <ArrowRight size={13} />
      </Link>
    ) : (
      <button
        className="card-action"
        disabled={!!featured.pending || (isSignedIn && !featured.ready)}
        onClick={() => (isSignedIn ? void featured.copy(example) : setAuth(true))}
      >
        <Copy size={13} /> {featured.pending === example.slug ? 'Copying…' : 'Copy to my studios'}
      </button>
    )
  async function create() {
    setPending('new')
    setError('')
    try {
      const id = await roomWrites.createConfirmed({ title: title.trim(), brief: brief.trim(), style: style.trim() })
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
            <h1>Drawing studios</h1>
          </div>
          <div className="intro-actions">
            <button
              className="dark-button"
              onClick={() => (isSignedIn ? setForm(true) : setAuth(true))}
            >
              <Plus size={17} /> New studio
            </button>
          </div>
        </div>
        <div className="section-heading">
          <h2>
            Featured <span>{examples.length}</span>
          </h2>
          <span>Curated agent paintings · copy one into your studios</span>
        </div>
        <div className="room-grid featured-grid">
          {examples.map((example) => (
            <article className="room-card" key={example.slug}>
              <Link to={`/featured/${example.slug}`}>
                <div className="room-preview">
                  <img src={exampleImage(example)} alt={`Painting: ${example.title}`} loading="lazy" width={1000} height={700} />
                  <span className="card-arrow">
                    <ArrowUpRight size={19} />
                  </span>
                </div>
                <div className="card-detail">
                  <h3>{example.title}</h3>
                  <p>{example.brief}</p>
                </div>
              </Link>
              <div className="card-copy">{copyAction(example)}</div>
            </article>
          ))}
        </div>
        <div className="section-heading">
          <h2>
            Your studios {isSignedIn && <span>{mine.length}</span>}
          </h2>
        </div>
        {isSignedIn && status === 'loading' ? (
          <div className="page-state">Loading studios…</div>
        ) : (
          <div className="room-grid">
            {mine.map((room) => (
              <article className="room-card" key={room.recordId}>
                <Link to={`/studio/${room.recordId}`}>
                  <div className="room-preview">
                    <img
                      loading="lazy"
                      src={`/api/studios/${room.recordId}/view.svg`}
                      alt={`Preview of ${room.data.title}`}
                    />
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
                <DeleteStudioButton studio={room} iconOnly />
              </article>
            ))}
            <button
              className="new-room-card"
              onClick={() => (isSignedIn ? setForm(true) : setAuth(true))}
            >
              <span className="new-plus">
                <Plus size={25} />
              </span>
              <h3>New studio</h3>
              <p>
                {isSignedIn
                  ? 'Write a brief and invite a drawing agent.'
                  : 'Sign in to start a studio and invite a drawing agent.'}
              </p>
            </button>
          </div>
        )}
        {(error || featured.error) && (
          <p role="alert" className="error-text">
            {error || featured.error}
          </p>
        )}
        <footer className="home-footer">
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
                !!pending ||
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
