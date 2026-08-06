import { useEffect, useRef } from 'react'

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'pointerdown',
  'keydown',
  'touchstart',
  'mousemove',
  'scroll',
  'wheel',
]

/**
 * Return to PIN when the bill grid stays empty and the user is idle.
 * Activity (pointer/keyboard/scroll) resets the timer. Disabled while the grid has items.
 */
export function useIdleLogoutWhenEmpty(opts: {
  enabled: boolean
  idleMs?: number
  onIdle: () => void
}) {
  const { enabled, idleMs = 60_000, onIdle } = opts
  const onIdleRef = useRef(onIdle)
  onIdleRef.current = onIdle

  useEffect(() => {
    if (!enabled) return

    let timer: ReturnType<typeof setTimeout> | null = null

    function clear() {
      if (timer != null) {
        clearTimeout(timer)
        timer = null
      }
    }

    function arm() {
      clear()
      timer = setTimeout(() => {
        onIdleRef.current()
      }, idleMs)
    }

    arm()
    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, arm, { passive: true })
    }

    return () => {
      clear()
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, arm)
      }
    }
  }, [enabled, idleMs])
}
