import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react'

type SnackbarType = 'success' | 'error' | 'info' | 'warning'

interface SnackbarState {
  id: number
  message: string
  type: SnackbarType
}

interface SnackbarContextValue {
  showSnackbar: (message: string, type?: SnackbarType) => void
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined)

const iconByType: Record<SnackbarType, ReactNode> = {
  success: <CheckCircle2 size={22} />,
  error: <XCircle size={22} />,
  warning: <AlertTriangle size={22} />,
  info: <Info size={22} />,
}

const colorByType: Record<SnackbarType, string> = {
  success: 'bg-salon-success',
  error: 'bg-salon-danger',
  warning: 'bg-salon-accent',
  info: 'bg-salon-text',
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showSnackbar = useCallback((message: string, type: SnackbarType = 'info') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const id = Date.now()
    setSnackbar({ id, message, type })
    timerRef.current = setTimeout(() => {
      setSnackbar((current) => (current?.id === id ? null : current))
    }, 2600)
  }, [])

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {snackbar && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[fadeIn_0.15s_ease-out]">
          <div
            className={[
              'flex items-center gap-3 text-white rounded-xl shadow-lg px-5 py-4 min-w-[320px] max-w-[560px]',
              colorByType[snackbar.type],
            ].join(' ')}
          >
            {iconByType[snackbar.type]}
            <span className="text-lg font-medium flex-1">{snackbar.message}</span>
            <button
              onClick={() => setSnackbar(null)}
              className="text-white/80 hover:text-white"
              aria-label="Dismiss"
            >
              <X size={20} />
            </button>
          </div>
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
