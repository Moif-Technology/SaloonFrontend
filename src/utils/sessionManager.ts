/**
 * Mirrors Saloon-POS `lib/utils/sessionManager.dart`.
 * Persists to localStorage so refresh keeps the till session.
 */
const KEYS = {
  stationId: 'stationId',
  staffName: 'staffName',
  staffID: 'staffId',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  companyId: 'companyId',
  deviceToken: 'deviceToken',
} as const

class SessionManagerImpl {
  stationId: string | null = localStorage.getItem(KEYS.stationId)
  staffName: string | null = localStorage.getItem(KEYS.staffName)
  staffID: string | null = localStorage.getItem(KEYS.staffID)
  accessToken: string | null = localStorage.getItem(KEYS.accessToken)
  refreshToken: string | null = localStorage.getItem(KEYS.refreshToken)
  companyId: string | null = localStorage.getItem(KEYS.companyId)
  deviceToken: string | null = localStorage.getItem(KEYS.deviceToken)
  subscription: Record<string, unknown> | null = null
  features: Record<string, unknown> | null = null
  limits: Record<string, unknown> | null = null
  permissions: unknown[] | null = null
  businessType: string | null = null
  branding: Record<string, unknown> | null = null

  setSession(opts: {
    stationId: string
    staffName: string
    staffID: string
    accessToken?: string
    refreshToken?: string
    companyId?: string
    deviceToken?: string
    subscription?: Record<string, unknown>
    features?: Record<string, unknown>
    limits?: Record<string, unknown>
    permissions?: unknown[]
    businessType?: string
    branding?: Record<string, unknown>
  }) {
    this.stationId = opts.stationId
    this.staffName = opts.staffName
    this.staffID = opts.staffID
    this.accessToken = opts.accessToken ?? this.accessToken
    this.refreshToken = opts.refreshToken ?? this.refreshToken
    this.companyId = opts.companyId ?? this.companyId
    this.deviceToken = opts.deviceToken ?? this.deviceToken
    this.subscription = opts.subscription ?? this.subscription
    this.features = opts.features ?? this.features
    this.limits = opts.limits ?? this.limits
    this.permissions = opts.permissions ?? this.permissions
    this.businessType = opts.businessType ?? this.businessType
    this.branding = opts.branding ?? this.branding

    localStorage.setItem(KEYS.stationId, opts.stationId)
    localStorage.setItem(KEYS.staffName, opts.staffName)
    localStorage.setItem(KEYS.staffID, opts.staffID)
    if (opts.accessToken) localStorage.setItem(KEYS.accessToken, opts.accessToken)
    if (opts.refreshToken) localStorage.setItem(KEYS.refreshToken, opts.refreshToken)
    if (opts.companyId) localStorage.setItem(KEYS.companyId, opts.companyId)
    if (opts.deviceToken) localStorage.setItem(KEYS.deviceToken, opts.deviceToken)
  }

  clearSession() {
    this.stationId = null
    this.staffName = null
    this.staffID = null
    this.accessToken = null
    this.refreshToken = null
    this.companyId = null
    this.subscription = null
    this.features = null
    this.limits = null
    this.permissions = null
    this.businessType = null
    this.branding = null
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  }
}

export const SessionManager = new SessionManagerImpl()
