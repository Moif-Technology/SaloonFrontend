import { useEffect, useState, type FormEvent } from 'react'
import { AlertCircle, ChevronRight, Lock, Mail, Monitor, Tag } from 'lucide-react'
import { apiService } from '../../api/apiService'
import {
  getOrCreateDeviceToken,
  saveEnrollment,
} from '../../utils/deviceEnrollment'

type Station = {
  stationId: number
  stationName: string
  stationCode: string
  counterNo: number | null
  branchName: string | null
}

type Props = {
  onEnrolled: () => void
}

export default function EnrollScreen({ onEnrolled }: Props) {
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [label, setLabel] = useState('')
  const [stations, setStations] = useState<Station[] | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deviceToken, setDeviceToken] = useState('')

  useEffect(() => {
    setDeviceToken(getOrCreateDeviceToken())
  }, [])

  async function loadStations(e?: FormEvent) {
    e?.preventDefault()
    const user = adminUsername.trim()
    if (!user || !adminPassword) {
      setError('Enter the admin email and password.')
      return
    }

    setBusy(true)
    setError(null)
    setStations(null)

    try {
      const data = await apiService.enrollListStations({
        adminUsername: user,
        adminPassword,
      })
      const list = Array.isArray(data.stations) ? (data.stations as Station[]) : []
      setStations(list)
      setCompanyName(String(data.companyName ?? '').trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stations')
    } finally {
      setBusy(false)
    }
  }

  async function enroll(station: Station) {
    setBusy(true)
    setError(null)
    try {
      const token = getOrCreateDeviceToken()
      const data = await apiService.enrollDevice({
        adminUsername: adminUsername.trim(),
        adminPassword,
        deviceToken: token,
        stationId: station.stationId,
        label: label.trim() || undefined,
      })
      const companyId = Number(data.companyId)
      if (!Number.isFinite(companyId) || companyId < 1) {
        throw new Error('Enrollment response missing companyId')
      }
      saveEnrollment({
        companyId,
        stationId: Number(data.stationId ?? station.stationId),
        stationName: String(data.stationName ?? station.stationName),
        deviceToken: token,
      })
      setAdminPassword('')
      onEnrolled()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Device enrollment failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="h-full flex items-center justify-center bg-[#F3F1F0] p-6 overflow-auto">
      <div className="w-full max-w-[520px] bg-white rounded-xl shadow-md border border-[#DDD8D6] p-7">
        <div className="flex flex-col items-center mb-5">
          <div className="w-12 h-12 rounded-full bg-salon-primary text-white flex items-center justify-center text-lg font-bold mb-3">
            S
          </div>
          <h1 className="text-[22px] font-bold text-salon-text text-center">
            Set up this Salon POS
          </h1>
          <p className="text-[13px] text-black/55 text-center mt-1.5">
            {stations == null
              ? 'Sign in as an admin to pair this device with a station.'
              : companyName
                ? `Choose a station for ${companyName}.`
                : 'Choose which station this device is.'}
          </p>
        </div>

        {stations == null ? (
          <form onSubmit={loadStations} className="space-y-3.5">
            <label className="block">
              <span className="sr-only">Admin email</span>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-salon-muted"
                />
                <input
                  type="email"
                  autoFocus
                  autoComplete="username"
                  disabled={busy}
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="Admin email"
                  className="w-full h-12 pl-10 pr-3 rounded-lg border border-[#DDD8D6] bg-white text-salon-text outline-none focus:border-salon-primary"
                />
              </div>
            </label>
            <label className="block">
              <span className="sr-only">Password</span>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-salon-muted"
                />
                <input
                  type="password"
                  autoComplete="current-password"
                  disabled={busy}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-12 pl-10 pr-3 rounded-lg border border-[#DDD8D6] bg-white text-salon-text outline-none focus:border-salon-primary"
                />
              </div>
            </label>
            <label className="block">
              <span className="sr-only">Device name</span>
              <div className="relative">
                <Tag
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-salon-muted"
                />
                <input
                  type="text"
                  disabled={busy}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Device name (optional)"
                  className="w-full h-12 pl-10 pr-3 rounded-lg border border-[#DDD8D6] bg-white text-salon-text outline-none focus:border-salon-primary"
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full h-12 rounded-lg bg-salon-primary text-white font-bold disabled:opacity-50"
            >
              {busy ? 'Loading…' : 'Continue'}
            </button>
          </form>
        ) : (
          <div className="space-y-2.5">
            {stations.length === 0 ? (
              <p className="text-center text-black/55 py-5 text-sm">
                No station exists for this company yet.
                <br />
                Create one in Backoffice &gt; Stations, then try again.
              </p>
            ) : (
              stations.map((s) => (
                <button
                  key={s.stationId}
                  type="button"
                  disabled={busy}
                  onClick={() => enroll(s)}
                  className="w-full flex items-center gap-3.5 p-4 rounded-[10px] border border-[#DDD8D6] bg-white hover:border-salon-primary/40 disabled:opacity-50 text-left"
                >
                  <Monitor size={22} className="text-salon-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[15px] text-salon-text truncate">
                      {s.stationName}
                    </div>
                    <div className="text-xs text-black/55 truncate mt-0.5">
                      {[s.stationCode, s.branchName].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-black/30 shrink-0" />
                </button>
              ))
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStations(null)
                setError(null)
              }}
              className="w-full py-2 text-sm text-salon-primary font-semibold"
            >
              Use a different account
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 flex gap-2 p-3 rounded-lg bg-[#FDECEA] border border-[#F5C6C2] text-[#B3261E] text-[13px]">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="whitespace-pre-wrap">{error}</p>
          </div>
        )}

        <p className="mt-5 text-center text-[10px] text-black/40">
          Device ID: {deviceToken || '…'}
        </p>
      </div>
    </div>
  )
}
