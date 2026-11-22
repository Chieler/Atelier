import { describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { ConfirmDialog } from './ConfirmDialog'
import { DeleteStudioButton } from './DeleteStudioButton'
import type { Envelope, StudioRoom } from './model'

// Mock react-dom createPortal so it renders children directly in SSR/Node
vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom')
  return {
    ...actual,
    createPortal: (children: React.ReactNode) => children,
  }
})

// Mock deepspace useAuth and useMutations
vi.mock('deepspace', () => ({
  useAuth: vi.fn(),
  useMutations: vi.fn(),
}))

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    // Set document so typeof document !== 'undefined'
    const origDoc = globalThis.document
    // @ts-expect-error minimal mock
    globalThis.document = { body: {} }
    try {
      const html = renderToString(
        <ConfirmDialog
          open={false}
          title="Delete “Test”?"
          body="Its public link will stop working. This can’t be undone."
          onConfirm={() => {}}
          onClose={() => {}}
        />,
      )
      expect(html).toBe('')
    } finally {
      globalThis.document = origDoc
    }
  })

  it('renders dialog markup with all required attributes and copy when open', () => {
    const origDoc = globalThis.document
    // @ts-expect-error minimal mock
    globalThis.document = { body: {} }
    try {
      const html = renderToString(
        <ConfirmDialog
          open={true}
          title="Delete “Harbor at dawn”?"
          body="Its public link will stop working. This can’t be undone."
          confirmLabel="Delete"
          onConfirm={() => {}}
          onClose={() => {}}
        />,
      )
      expect(html).toContain('role="dialog"')
      expect(html).toContain('aria-modal="true"')
      expect(html).toContain('aria-labelledby="')
      expect(html).toContain('modal-scrim')
      expect(html).toContain('confirm-modal')
      expect(html).toContain('Delete “Harbor at dawn”?')
      expect(html).toContain('Its public link will stop working. This can’t be undone.')
      expect(html).toContain('outline-button')
      expect(html).toContain('Cancel')
      expect(html).toContain('danger-button')
      expect(html).toContain('Delete')
    } finally {
      globalThis.document = origDoc
    }
  })

  it('renders pending state with Deleting… and disabled buttons', () => {
    const origDoc = globalThis.document
    // @ts-expect-error minimal mock
    globalThis.document = { body: {} }
    try {
      const html = renderToString(
        <ConfirmDialog
          open={true}
          title="Delete “Harbor at dawn”?"
          body="Its public link will stop working. This can’t be undone."
          confirmLabel="Deleting…"
          isPending={true}
          onConfirm={() => {}}
          onClose={() => {}}
        />,
      )
      expect(html).toContain('Deleting…')
      // Cancel and confirm buttons should be disabled
      expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Cancel<\/button>/)
      expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Deleting…<\/button>/)
    } finally {
      globalThis.document = origDoc
    }
  })

  it('renders error message inside the dialog when error prop is passed', () => {
    const origDoc = globalThis.document
    // @ts-expect-error minimal mock
    globalThis.document = { body: {} }
    try {
      const html = renderToString(
        <ConfirmDialog
          open={true}
          title="Delete “Harbor at dawn”?"
          body="Its public link will stop working. This can’t be undone."
          error="Couldn’t delete the studio. Try again."
          onConfirm={() => {}}
          onClose={() => {}}
        />,
      )
      expect(html).toContain('role="alert"')
      expect(html).toContain('error-text')
      expect(html).toContain('Couldn’t delete the studio. Try again.')
    } finally {
      globalThis.document = origDoc
    }
  })
})

describe('DeleteStudioButton', () => {
  const fakeStudio: Envelope<StudioRoom> = {
    recordId: 'room-123',
    createdBy: 'user-456',
    createdAt: 1000,
    data: {
      title: 'Ocean Sunset',
      brief: 'Paint the sunset over ocean',
      style: 'Oil on canvas',
    },
  }

  it('renders null when user is not signed in', async () => {
    const { useAuth, useMutations } = await import('deepspace')
    vi.mocked(useAuth).mockReturnValue({
      isSignedIn: false,
      userId: null,
      user: null,
      signOut: async () => {},
    } as any)
    vi.mocked(useMutations).mockReturnValue({
      removeConfirmed: vi.fn(),
      ready: true,
    } as any)

    const html = renderToString(<DeleteStudioButton studio={fakeStudio} />)
    expect(html).toBe('')
  })

  it('renders null when signed-in user is not the creator', async () => {
    const { useAuth, useMutations } = await import('deepspace')
    vi.mocked(useAuth).mockReturnValue({
      isSignedIn: true,
      userId: 'different-user',
      user: null,
      signOut: async () => {},
    } as any)
    vi.mocked(useMutations).mockReturnValue({
      removeConfirmed: vi.fn(),
      ready: true,
    } as any)

    const html = renderToString(<DeleteStudioButton studio={fakeStudio} />)
    expect(html).toBe('')
  })

  it('renders full button variant when signed in as creator', async () => {
    const { useAuth, useMutations } = await import('deepspace')
    vi.mocked(useAuth).mockReturnValue({
      isSignedIn: true,
      userId: 'user-456',
      user: null,
      signOut: async () => {},
    } as any)
    vi.mocked(useMutations).mockReturnValue({
      removeConfirmed: vi.fn(),
      ready: true,
    } as any)

    const html = renderToString(<DeleteStudioButton studio={fakeStudio} iconOnly={false} />)
    expect(html).toContain('studio-delete')
    expect(html).toContain('outline-button')
    expect(html).toContain('Delete studio')
  })

  it('renders iconOnly variant for card when iconOnly={true}', async () => {
    const { useAuth, useMutations } = await import('deepspace')
    vi.mocked(useAuth).mockReturnValue({
      isSignedIn: true,
      userId: 'user-456',
      user: null,
      signOut: async () => {},
    } as any)
    vi.mocked(useMutations).mockReturnValue({
      removeConfirmed: vi.fn(),
      ready: true,
    } as any)

    const html = renderToString(<DeleteStudioButton studio={fakeStudio} iconOnly={true} />)
    expect(html).toContain('studio-delete-card')
    expect(html).toContain('studio-delete-icon')
    expect(html).toContain('aria-label="Delete Ocean Sunset"')
    expect(html).toContain('title="Delete studio"')
  })
})
