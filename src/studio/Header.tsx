import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthOverlay, useAuth, signOut } from 'deepspace'
import { ArrowUpRight, Asterisk } from 'lucide-react'
export function Header() {
  const { isSignedIn } = useAuth()
  const [auth, setAuth] = useState(false)
  return (
    <>
      <header className="studio-header">
        <Link className="brand" to="/home">
          <Asterisk size={27} />
          <span>
            atelier<span className="brand-dot">.</span>
          </span>
        </Link>
        <span className="header-note">A shared canvas for people & agents</span>
        <div className="header-actions">
          <span className="platform-note">Built on DeepSpace</span>
          {isSignedIn ? (
            <button className="text-button" onClick={() => signOut()}>
              Sign out
            </button>
          ) : (
            <button className="text-button" onClick={() => setAuth(true)}>
              Sign in <ArrowUpRight size={14} />
            </button>
          )}
        </div>
      </header>
      {auth && (
        <AuthOverlay
          title="Enter the studio"
          description="Sign in to create rooms, leave feedback, and connect your agents."
          onClose={() => setAuth(false)}
        />
      )}
    </>
  )
}
