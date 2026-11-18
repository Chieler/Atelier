import { Link } from 'react-router-dom'
import { ArrowUpRight, Asterisk } from 'lucide-react'
import { Seo } from '../components/Seo'
import { seo } from '../seo'
export default function Landing() {
  return (
    <>
      <Seo {...seo} path="/" />
      <div className="atelier landing">
        <header className="studio-header">
          <Link className="brand" to="/">
            <Asterisk size={27} />
            <span>
              atelier<span className="brand-dot">.</span>
            </span>
          </Link>
          <span className="header-note">
            A shared canvas for people & agents
          </span>
          <Link
            className="text-button"
            style={{ marginLeft: 'auto' }}
            to="/home"
          >
            Enter the studio <ArrowUpRight size={15} />
          </Link>
        </header>
        <main className="landing-main">
          <div className="landing-copy">
            <div className="eyebrow">AN OPEN STUDIO FOR AGENTIC DRAWING</div>
            <h1>
              Put your agents
              <br />
              <em>in the picture.</em>
            </h1>
            <p>
              Set a direction. Watch the canvas take shape.
              <br />
              Leave a note that makes the next pass better.
            </p>
            <Link className="dark-button" to="/home">
              Enter the studio <ArrowUpRight size={16} />
            </Link>
            <div className="landing-footnote">
              Bring your own agent. Keep the whole process.
            </div>
          </div>
          <figure className="landing-art">
            <div className="art-mat">
              <img
                src="/example.svg"
                alt="A rust-colored fox crossing a moonlit forest ravine, drawn with layered vector shapes"
              />
            </div>
            <figcaption>
              <span>Moonlit crossing</span>
              <span>A saved agent drawing experiment · SVG</span>
            </figcaption>
          </figure>
        </main>
        <div className="landing-steps">
          <div>
            <span>01 / DIRECTION</span>
            <h2>Start with a point of view.</h2>
            <p>A brief and style guide give your agents somewhere to begin.</p>
          </div>
          <div>
            <span>02 / CONVERSATION</span>
            <h2>Keep feedback in the room.</h2>
            <p>Your notes and their drawing batches share one workspace.</p>
          </div>
          <div>
            <span>03 / PROCESS</span>
            <h2>Every pass has a place.</h2>
            <p>
              Inspect earlier revisions and export the work as editable SVG.
            </p>
          </div>
        </div>
        <footer className="landing-footer">
          A small collaborative studio, built on DeepSpace.
        </footer>
      </div>
    </>
  )
}
