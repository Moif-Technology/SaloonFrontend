/**
 * Temporary auto PIN login until login screens are ready.
 * Defaults: STAFF1 / pin 1234 (company 5).
 * Re-logins when the access token is missing or expired (JWT ~15m).
 * Mid-session 401s are handled by apiService auth retry.
 */
import { apiService } from '../api/apiService'
import { SessionManager } from '../utils/sessionManager'

const DEVICE_TOKEN =
  import.meta.env.VITE_DEV_DEVICE_TOKEN || 'salon-frontend-dev'
const COMPANY_ID = Number(import.meta.env.VITE_DEV_COMPANY_ID || 5)
const STAFF_ID = Number(import.meta.env.VITE_DEV_STAFF_ID || 46)
const STAFF_PIN = import.meta.env.VITE_DEV_STAFF_PIN || '1234'

/** True when JWT `exp` is missing or already past (with 30s skew). */
export function isAccessTokenExpired(token: string | null | undefined): boolean {
  const t = token?.trim()
  if (!t) return true
  const parts = t.split('.')
  if (parts.length < 2) return true
  try {
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json) as { exp?: number }
    if (typeof payload.exp !== 'number') return true
    return payload.exp * 1000 <= Date.now() + 30_000
  } catch {
    return true
  }
}

let loginInFlight: Promise<void> | null = null

async function pinLoginAndStore(): Promise<void> {
  localStorage.setItem('deviceToken', DEVICE_TOKEN)
  SessionManager.deviceToken = DEVICE_TOKEN
  SessionManager.companyId = String(COMPANY_ID)

  const session = await apiService.pinLogin({
    pin: STAFF_PIN,
    companyId: COMPANY_ID,
    staffId: STAFF_ID,
    deviceToken: DEVICE_TOKEN,
  })

  const stationId = String(session.stationId ?? '').trim()
  const staffName = String(session.staffName ?? '').trim()
  const staffID = String(session.staffID ?? '').trim()
  const accessToken = String(session.accessToken ?? '').trim()
  const refreshToken = session.refreshToken ? String(session.refreshToken) : undefined

  if (!stationId || !staffName || !staffID || !accessToken) {
    throw new Error('Login response incomplete (missing stationId / staffName / staffID / token).')
  }

  SessionManager.setSession({
    stationId,
    staffName,
    staffID,
    accessToken,
    refreshToken,
    companyId: String(session.companyId ?? COMPANY_ID),
    deviceToken: DEVICE_TOKEN,
    subscription: (session.subscription as Record<string, unknown>) ?? undefined,
    features: (session.features as Record<string, unknown>) ?? undefined,
    limits: (session.limits as Record<string, unknown>) ?? undefined,
    permissions: Array.isArray(session.permissions) ? session.permissions : undefined,
  })
}

/**
 * Ensure a usable POS session. Pass `force` (or call after 401) to re-PIN login.
 */
export async function ensureDevSession(force = false): Promise<void> {
  if (
    !force &&
    SessionManager.accessToken &&
    SessionManager.staffID &&
    SessionManager.stationId &&
    !isAccessTokenExpired(SessionManager.accessToken)
  ) {
    return
  }

  if (loginInFlight) return loginInFlight

  loginInFlight = (async () => {
    SessionManager.clearSession()
    await pinLoginAndStore()
  })().finally(() => {
    loginInFlight = null
  })

  return loginInFlight
}
