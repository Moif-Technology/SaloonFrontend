import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import EnrollScreen from '../pages/auth/EnrollScreen'
import PinLoginScreen from '../pages/auth/PinLoginScreen'
import { clearEnrollment, isDeviceEnrolled } from '../utils/deviceEnrollment'
import { clearStaffSession, hasActiveStaffSession } from '../utils/pinLoginSession'

const AuthLogoutContext = createContext<() => void>(() => {
  clearStaffSession()
  window.location.reload()
})

export function useReturnToPinLogin() {
  return useContext(AuthLogoutContext)
}

/**
 * Auth gate: enroll device → PIN login → POS.
 * Logout clears staff JWT only; enrollment stays so the next staff enters PIN.
 */
export default function SessionGate({ children }: { children: ReactNode }) {
  const [enrolled, setEnrolled] = useState(() => isDeviceEnrolled())
  const [loggedIn, setLoggedIn] = useState(() => hasActiveStaffSession())
  const [authKey, setAuthKey] = useState(0)

  const forcePin = useCallback(() => {
    clearStaffSession()
    setLoggedIn(false)
    setEnrolled(isDeviceEnrolled())
    setAuthKey((k) => k + 1)
  }, [])

  const unpair = useCallback(() => {
    clearStaffSession()
    clearEnrollment()
    setLoggedIn(false)
    setEnrolled(false)
    setAuthKey((k) => k + 1)
  }, [])

  if (!enrolled) {
    return (
      <EnrollScreen
        key={`enroll-${authKey}`}
        onEnrolled={() => {
          setEnrolled(true)
          setLoggedIn(false)
          setAuthKey((k) => k + 1)
        }}
      />
    )
  }

  if (!loggedIn) {
    return (
      <PinLoginScreen
        key={`pin-${authKey}`}
        onLoggedIn={() => setLoggedIn(true)}
        onNeedsEnrollment={unpair}
      />
    )
  }

  return (
    <AuthLogoutContext.Provider value={forcePin}>{children}</AuthLogoutContext.Provider>
  )
}
