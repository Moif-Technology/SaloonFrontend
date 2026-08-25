import { useState } from 'react'
import {
  Bell,
  Clock3,
  Globe2,
  SlidersHorizontal,
  Moon,
  Save,
  Sun,
  X,
} from 'lucide-react'

interface ApplicationSettingsModalProps {
  open: boolean
  onClose: () => void
}

type ThemeMode = 'light' | 'dark' | 'system'

export default function ApplicationSettingsModal({
  open,
  onClose,
}: ApplicationSettingsModalProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light')
  const [timeZone, setTimeZone] = useState('Asia/Kolkata')
  const [dateFormat, setDateFormat] = useState('DD-MM-YYYY')
  const [autoLogout, setAutoLogout] = useState('30')
  const [smsAlerts, setSmsAlerts] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(true)

  if (!open) return null

  function handleSave() {
    // Connect this to your application settings/API later.
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#6b1d2f]/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6b1d2f] text-white shadow-sm">
              <SlidersHorizontal size={22} />
            </span>

            <div>
              <h2 className="text-xl font-bold text-salon-text">
                Application Settings
              </h2>

              <p className="text-sm text-salon-muted">
                Manage global preferences and system-wide application behavior.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-salon-muted transition hover:bg-[#6b1d2f]/10 hover:text-[#6b1d2f]"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </header>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            {/* Appearance */}
            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6b1d2f]/10 text-[#6b1d2f]">
                    <Sun size={17} />
                  </span>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Appearance
                    </h3>

                    <p className="text-xs text-slate-500">
                      Choose the default application theme.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <label
                  htmlFor="theme-mode"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Default Theme
                </label>

                <div className="relative">
                  {themeMode === 'light' ? (
                    <Sun className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  ) : (
                    <Moon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  )}

                  <select
                    id="theme-mode"
                    value={themeMode}
                    onChange={(event) =>
                      setThemeMode(event.target.value as ThemeMode)
                    }
                    className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                  >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                    <option value="system">Use System Preference</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Regional Settings */}
            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6b1d2f]/10 text-[#6b1d2f]">
                    <Globe2 size={17} />
                  </span>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Regional Settings
                    </h3>

                    <p className="text-xs text-slate-500">
                      Configure timezone and date display preferences.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2">
                {/* Time Zone */}
                <div>
                  <label
                    htmlFor="time-zone"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Time Zone
                  </label>

                  <select
                    id="time-zone"
                    value={timeZone}
                    onChange={(event) => setTimeZone(event.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                  >
                    <option value="Asia/Kolkata">
                      India Standard Time (IST)
                    </option>

                    <option value="Asia/Dubai">
                      Gulf Standard Time (GST)
                    </option>

                    <option value="Asia/Singapore">
                      Singapore Standard Time
                    </option>

                    <option value="Europe/London">
                      United Kingdom
                    </option>

                    <option value="America/New_York">
                      Eastern Time (US)
                    </option>
                  </select>
                </div>

                {/* Date Format */}
                <div>
                  <label
                    htmlFor="date-format"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Date Format
                  </label>

                  <select
                    id="date-format"
                    value={dateFormat}
                    onChange={(event) => setDateFormat(event.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                  >
                    <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Security */}
            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6b1d2f]/10 text-[#6b1d2f]">
                    <Clock3 size={17} />
                  </span>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Session & Security
                    </h3>

                    <p className="text-xs text-slate-500">
                      Control automatic logout behavior for inactive users.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <label
                  htmlFor="auto-logout"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Auto-Logout Timer
                </label>

                <select
                  id="auto-logout"
                  value={autoLogout}
                  onChange={(event) => setAutoLogout(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 sm:w-[260px]"
                >
                  <option value="never">Never</option>
                  <option value="5">5 Minutes</option>
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">60 Minutes</option>
                  <option value="120">120 Minutes</option>
                </select>

                <p className="mt-2 text-xs text-slate-500">
                  Users will automatically be signed out after the selected
                  period of inactivity.
                </p>
              </div>
            </section>

            {/* Notifications */}
            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6b1d2f]/10 text-[#6b1d2f]">
                    <Bell size={17} />
                  </span>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Notification Preferences
                    </h3>

                    <p className="text-xs text-slate-500">
                      Choose how the application sends important alerts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {/* SMS */}
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      SMS Alerts
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Receive important booking and transaction alerts by SMS.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={smsAlerts}
                    onClick={() => setSmsAlerts((prev) => !prev)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      smsAlerts
                        ? 'bg-[#6b1d2f]'
                        : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                        smsAlerts ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Email */}
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Email Alerts
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Receive reports, summaries, and system notifications by
                      email.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={emailAlerts}
                    onClick={() => setEmailAlerts((prev) => !prev)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      emailAlerts
                        ? 'bg-[#6b1d2f]'
                        : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                        emailAlerts ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Helper */}
            <div className="rounded-lg border border-[#6b1d2f]/15 bg-[#6b1d2f]/5 px-4 py-3">
              <p className="text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-[#6b1d2f]">
                  Note:
                </span>{' '}
                These preferences apply system-wide and may affect how
                information is displayed and how notifications are delivered
                across the salon application.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg bg-[#6b1d2f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#581725] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20"
          >
            <Save className="h-4 w-4" />
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  )
}