/**
 * App settings & options modal.
 * Includes manual update check, app version info, etc.
 */
import { useState } from 'react'
import { X, Download, RotateCw, Info } from 'lucide-react'
import { useCheckUpdates } from '../../hooks/useCheckUpdates'
import { useSnackbar } from '../../context/SnackbarContext'

interface AppSettingsDialogProps {
  open: boolean
  onClose: () => void
}

export default function AppSettingsDialog({ open, onClose }: AppSettingsDialogProps) {
  const { data, loading, error, check } = useCheckUpdates()
  const { showSnackbar } = useSnackbar()
  const [checkingUpdates, setCheckingUpdates] = useState(false)

  if (!open) return null

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true)
    try {
      await check()
      showSnackbar('Update check completed', 'success', { duration: 3000 })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to check updates'
      showSnackbar(msg, 'error', { duration: 3000 })
    } finally {
      setCheckingUpdates(false)
    }
  }

  const handleDownload = () => {
    if (data?.downloadUrl) {
      window.open(data.downloadUrl, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">App Settings</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* App Info */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  Salon POS App
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                  Current Version: v{data?.currentVersion || 'unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Update Section */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <p className="font-semibold text-slate-900 dark:text-white text-sm mb-3">
              Check for Updates
            </p>

            {/* Current Update Status */}
            {data?.updateAvailable ? (
              <div className="mb-3 p-3 rounded bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                  v{data.latestVersion} is available
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {data.description}
                </p>
                {data.releaseNotes && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 whitespace-pre-wrap">
                    {data.releaseNotes}
                  </div>
                )}
                {data.releasedAt && (
                  <p className="text-xs text-blue-500 dark:text-blue-500 mt-2">
                    Released: {new Date(data.releasedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-3 p-3 rounded bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700">
                <p className="text-sm text-green-900 dark:text-green-100 font-medium">
                  You are up to date
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Running latest version (v{data?.currentVersion || 'unknown'})
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-3 p-3 rounded bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700">
                <p className="text-xs text-red-900 dark:text-red-100">
                  Error: {error}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleCheckUpdates}
                disabled={checkingUpdates || loading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCw className={`w-4 h-4 ${checkingUpdates ? 'animate-spin' : ''}`} />
                <span>Check Now</span>
              </button>

              {data?.updateAvailable && (
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Update</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
            Updates are checked periodically or manually via this menu.
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}
