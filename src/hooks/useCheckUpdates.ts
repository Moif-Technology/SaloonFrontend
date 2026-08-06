/**
 * Hook to manage app update checking.
 * - Auto-checks on mount
 * - Provides manual refresh
 * - Persists dismiss state in localStorage
 */
import { useEffect, useState, useCallback } from 'react'
import { checkAppUpdate, AppVersionInfo } from '../api/updates'

export interface UpdateState {
  data: AppVersionInfo | null
  loading: boolean
  error: string | null
  isDismissed: boolean
}

const DISMISS_KEY = 'pos_update_dismissed'
const LAST_CHECK_KEY = 'pos_update_last_check'
const CHECK_INTERVAL_MINUTES = 60

export function useCheckUpdates() {
  const [state, setState] = useState<UpdateState>({
    data: null,
    loading: false,
    error: null,
    isDismissed: localStorage.getItem(DISMISS_KEY) === 'true',
  })

  const check = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const info = await checkAppUpdate('web')

      setState((prev) => ({
        ...prev,
        data: info,
        loading: false,
        error: null,
      }))

      // Store last check time
      localStorage.setItem(LAST_CHECK_KEY, Date.now().toString())
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState((prev) => ({
        ...prev,
        loading: false,
        error: msg,
      }))
    }
  }, [])

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, 'true')
    setState((prev) => ({ ...prev, isDismissed: true }))
  }, [])

  const undismiss = useCallback(() => {
    localStorage.removeItem(DISMISS_KEY)
    setState((prev) => ({ ...prev, isDismissed: false }))
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem(DISMISS_KEY)
    localStorage.removeItem(LAST_CHECK_KEY)
    setState({
      data: null,
      loading: false,
      error: null,
      isDismissed: false,
    })
  }, [])

  // Auto-check on mount
  useEffect(() => {
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY)
    const lastCheckTime = lastCheck ? Number(lastCheck) : 0
    const now = Date.now()
    const diffMinutes = (now - lastCheckTime) / 1000 / 60

    // Check if enough time passed since last check
    if (diffMinutes >= CHECK_INTERVAL_MINUTES) {
      check()
    }
  }, [check])

  return {
    ...state,
    check,
    dismiss,
    undismiss,
    reset,
  }
}
