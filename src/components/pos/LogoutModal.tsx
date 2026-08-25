import { LogOut, X } from 'lucide-react'
import { useSnackbar } from '../../context/SnackbarContext'

interface LogoutModalProps {
  open: boolean
  onClose: () => void
  onConfirmLogout: () => void
}

export default function LogoutModal({
  open,
  onClose,
  onConfirmLogout,
}: LogoutModalProps) {
  const { showSnackbar } = useSnackbar()

  if (!open) return null

  function handleLogout() {
    showSnackbar('Logged out successfully', 'info')
    onConfirmLogout()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      {/* Scaled to match your exact reference screenshot size */}
      <div
        className="w-full max-w-lg rounded-2xl border border-[#6b1d2f]/15 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#6b1d2f] text-white shadow-sm">
              <LogOut size={24} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Sign Out of Terminal?
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Your session data is saved, but you will need to re-authenticate to continue.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6b1d2f] px-4.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#581725] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20"
          >
            <LogOut size={14} />
            Confirm Logout
          </button>
        </div>
      </div>
    </div>
  )
}