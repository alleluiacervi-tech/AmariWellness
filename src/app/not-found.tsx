import Link from '@/components/Link'

export const metadata = {
  title: 'Page not found',
  description: 'The page you were looking for does not exist.',
}

export default function NotFound() {
  return (
    <main className="not-found" id="main-content">
      <p className="label" style={{ color: 'var(--sage-text)' }}>
        404 · Uncharted
      </p>
      <h1 className="not-found__title">You&apos;ve wandered off the path.</h1>
      <p style={{ maxWidth: '44ch', fontSize: '15px', color: 'var(--ink-body)', margin: '0 0 24px', lineHeight: 1.7 }}>
        The space you are seeking does not exist or has been relocated within the sanctuary.
      </p>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link className="btn btn--solid" href="/">
          Return Home
        </Link>
        <Link className="tlink" href="/book">
          Book a chair →
        </Link>
      </div>
    </main>
  )
}
