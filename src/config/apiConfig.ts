/**
 * Mirrors Saloon-POS `lib/config/api_config.dart`.
 *
 * Dev: leave VITE_API_BASE empty so calls hit `/api/...` and Vite proxies
 * to VITE_API_PROXY_TARGET (local api :5010).
 *
 * Absolute (like Flutter): VITE_API_BASE=http://127.0.0.1:5010
 */
export const baseURL = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''

/** Same default as Saloon-POS `posBasePath`. */
export const posBasePath =
  (import.meta.env.VITE_POS_BASE_PATH as string | undefined) || '/api/salon-pos'

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${baseURL}${p}`
}

export function salonPosUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${baseURL}${posBasePath}${p}`
}
