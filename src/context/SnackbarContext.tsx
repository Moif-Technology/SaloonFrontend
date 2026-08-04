import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import Snackbar, { type SnackbarAction, type SnackbarVariant } from '../components/common/Snackbar'

interface SnackbarState {
  id: number
  message: string
  variant: SnackbarVariant
  action?: SnackbarAction
}

interface ShowSnackbarOptions {
  action?: SnackbarAction
  /** Milliseconds before auto-dismiss. Loading snackbars never auto-dismiss. */
  duration?: number
}

interface SnackbarContextValue {
  showSnackbar: (message: string, variant?: SnackbarVariant, options?: ShowSnackbarOptions) => void
  hideSnackbar: () => void
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined)

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hideSnackbar = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setSnackbar(null)
  }, [])

  const showSnackbar = useCallback(
    (message: string, variant: SnackbarVariant = 'info', options?: ShowSnackbarOptions) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      const id = Date.now()
      setSnackbar({ id, message, variant, action: options?.action })

      if (variant !== 'loading') {
        timerRef.current = setTimeout(() => {
          setSnackbar((current) => (current?.id === id ? null : current))
        }, options?.duration ?? 2600)
      }
    },
    [],
  )

  return (
    <SnackbarContext.Provider value={{ showSnackbar, hideSnackbar }}>
      {children}
      {snackbar && (
        <div className="fixed bottom-44 sm:bottom-52 left-1/2 -translate-x-1/2 z-50 animate-[fadeIn_0.15s_ease-out]">
          <Snackbar variant={snackbar.variant} message={snackbar.message} action={snackbar.action} />
        </div>
      )}
    </SnackbarContext.Provider>
  )
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext)
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider')
  return ctx
}
