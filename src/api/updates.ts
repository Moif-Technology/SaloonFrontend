/**
 * App update checker — public endpoint (no auth required).
 */
import axios from 'axios'
import { apiUrl } from '../config/apiConfig'

export interface AppVersionInfo {
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
  description: string
  releaseNotes: string
  downloadUrl: string
  isRequired: boolean
  releasedAt: string
  platform: string
}

/**
 * Check if app update is available.
 * Throws on network errors.
 */
export async function checkAppUpdate(platform: 'web' | 'mobile' = 'web'): Promise<AppVersionInfo> {
  try {
    const res = await axios.get<{
      ok: boolean
      data?: AppVersionInfo
      message?: string
    }>(apiUrl('/api/salon-pos/app/version'), {
      params: { platform },
      timeout: 8000,
      validateStatus: () => true, // don't throw on status
    })

    if (res.status === 200 && res.data?.ok && res.data.data) {
      return res.data.data
    }

    throw new Error(res.data?.message ?? `Version check failed (HTTP ${res.status})`)
  } catch (err) {
    if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
      throw new Error('Version check timeout')
    }
    throw err
  }
}

/**
 * Compare versions. Returns true if update is needed.
 * Simple semver comparison: "0.1.0" vs "0.2.0"
 */
export function isUpdateNeeded(currentVersion: string, latestVersion: string): boolean {
  const current = currentVersion.split('.').map(Number)
  const latest = latestVersion.split('.').map(Number)

  for (let i = 0; i < Math.max(current.length, latest.length); i++) {
    const c = current[i] ?? 0
    const l = latest[i] ?? 0
    if (l > c) return true
    if (l < c) return false
  }

  return false
}
