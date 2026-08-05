import { useEffect, useState, type ReactNode } from 'react'
import { ensureDevSession } from '../bootstrap/devAutoLogin'
import { SessionManager } from '../utils/sessionManager'

export default function SessionGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [staffName, setStaffName] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await ensureDevSession()
        if (cancelled) return
        setStaffName(SessionManager.staffName || 'STAFF1')
        setReady(true)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Auto login failed')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-salon-bg p-6">
        <div className="max-w-md w-full bg-white border border-salon-border rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-bold text-salon-primary mb-2">Login failed</h1>
          <p className="text-sm text-salon-muted mb-4">
            Temporary auto-login uses STAFF1 / PIN 1234. Check API is running on :5010.
          </p>
          <p className="text-sm font-semibold text-salon-danger whitespace-pre-wrap">{error}</p>
          <button
            type="button"
            className="mt-4 w-full h-11 rounded-lg bg-salon-primary text-white font-bold"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="h-full flex items-center justify-center bg-salon-bg text-salon-muted font-semibold">
        Signing in as STAFF1…
      </div>
    )
  }

  return (
    <>
      {children}
      <div className="sr-only" aria-live="polite">
        Signed in as {staffName}
      </div>
    </>
  )
}
