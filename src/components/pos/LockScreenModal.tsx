import { useState } from 'react'
import {
  LockKeyhole,
  Eye,
  EyeOff,
  LogOut,
  UserRound,
  X,
  ShieldCheck,
} from 'lucide-react'

import { useSnackbar } from '../../context/SnackbarContext'

interface LockScreenModalProps {
  open: boolean
  onClose?: () => void
  onUnlock?: (password: string) => void
  onSwitchUser?: () => void
  onLogout?: () => void
}

export default function LockScreenModal({
  open,
  onClose,
  onUnlock,
  onSwitchUser,
  onLogout,
}: LockScreenModalProps) {
  const { showSnackbar } = useSnackbar()

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleUnlock() {
    const value = password.trim()

    if (!value) {
      setError('Please enter your PIN or password')
      showSnackbar('Please enter your PIN or password', 'warning')
      return
    }

    setError('')

    if (onUnlock) {
      onUnlock(value)
    } else {
      showSnackbar('Terminal unlocked successfully', 'success')
    }

    setPassword('')
  }

  function handleSwitchUser() {
    setPassword('')
    setError('')

    if (onSwitchUser) {
      onSwitchUser()
    } else {
      showSnackbar('Switch user selected', 'info')
    }
  }

  function handleLogout() {
    setPassword('')
    setError('')

    if (onLogout) {
      onLogout()
    } else {
      showSnackbar('Logging out...', 'info')
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === 'Enter') {
      handleUnlock()
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[#6b1d2f]/15 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6b1d2f] text-white shadow-sm">
              <LockKeyhole size={21} />
            </span>

            <div>
              <h2 className="text-lg font-bold text-salon-text">
                Terminal Locked
              </h2>

              <p className="text-xs text-salon-muted">
                Security verification required
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-salon-muted transition hover:bg-[#6b1d2f]/10 hover:text-[#6b1d2f]"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          )}
        </header>

        {/* Main Content */}
        <div className="px-6 py-7">
          {/* Security Icon / Message */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6b1d2f]/8 text-[#6b1d2f]">
              <ShieldCheck size={30} strokeWidth={1.8} />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">
              Enter PIN or Password to Resume
            </h3>

            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">
              This terminal has been locked for security. Enter your
              credentials to continue using the POS system.
            </p>
          </div>

          {/* Input */}
          <div>
            <label
              htmlFor="terminal-lock-password"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              PIN / Password
            </label>

            <div className="relative">
              <LockKeyhole
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />

              <input
                id="terminal-lock-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (error) setError('')
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter your PIN or password"
                autoFocus
                className={[
                  'h-11 w-full rounded-xl border bg-white pl-9 pr-11 text-sm text-slate-700',
                  'outline-none transition',
                  'placeholder:text-slate-400',
                  error
                    ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-300 focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10',
                ].join(' ')}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-[#6b1d2f]"
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>

            {error && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {error}
              </p>
            )}

            <p className="mt-2 text-[11px] text-slate-400">
              Press Enter to unlock the terminal.
            </p>
          </div>

          {/* Unlock Button */}
          <button
            type="button"
            onClick={handleUnlock}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#6b1d2f] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#581725] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20 active:scale-[0.99]"
          >
            <LockKeyhole className="h-4 w-4" />
            Unlock Terminal
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />

            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Other options
            </span>

            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleSwitchUser}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-[#6b1d2f]/20 hover:bg-[#6b1d2f]/5 hover:text-[#6b1d2f]"
            >
              <UserRound className="h-4 w-4" />
              Switch User
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-[#6b1d2f]" />
            <span>POS Terminal Secure</span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}