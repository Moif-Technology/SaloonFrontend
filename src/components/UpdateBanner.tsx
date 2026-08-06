/**
 * Update notification banner — shows at top of app.
 * - Persistent banner when update available
 * - Auto-dismiss after 8 seconds or manual close
 * - Action buttons: Download, Manual Check
 */
import { useState, useEffect } from 'react'
import { X, Download, RotateCw } from 'lucide-react'
import { useSnackbar } from '../context/SnackbarContext'
import { useCheckUpdates } from '../hooks/useCheckUpdates'

export default function UpdateBanner() {
  const { data, loading, error, isDismissed, check, dismiss } = useCheckUpdates()
  const { showSnackbar } = useSnackbar()
  const [showBanner, setShowBanner] = useState(false)
  const [autoHideTimer, setAutoHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  // Show banner when update available and not dismissed
  useEffect(() => {
    if (data?.updateAvailable && !isDismissed) {
      setShowBanner(true)

      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        setShowBanner(false)
      }, 8000)

      setAutoHideTimer(timer)

      // Toast notification for new update
      showSnackbar(
        `${data.description} (v${data.latestVersion} available)`,
        'info',
        { duration: 6000 },
      )

      return () => {
        if (timer) clearTimeout(timer)
      }
    }
  }, [data?.updateAvailable, isDismissed, data?.description, data?.latestVersion, showSnackbar])

  const handleDismiss = () => {
    setShowBanner(false)
    dismiss()

    // Clear auto-hide timer
    if (autoHideTimer) {
      clearTimeout(autoHideTimer)
    }
  }

  const handleDownload = () => {
    if (data?.downloadUrl) {
      window.open(data.downloadUrl, '_blank')
      handleDismiss()
    }
  }

  const handleManualCheck = () => {
    check()
  }

  if (!showBanner || !data?.updateAvailable) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 border-b border-blue-200 dark:border-blue-700 shadow-sm">
      <div className="max-w-full px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Content */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                Update Available: v{data.latestVersion}
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                {data.description}
              </p>
              <p className="text-blue-600 dark:text-blue-400 text-xs mt-2 whitespace-pre-line">
                {data.releaseNotes.split('\n').slice(0, 2).join('\n')}
                {data.releaseNotes.split('\n').length > 2 && '...'}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              disabled={loading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download
            </button>

            <button
              onClick={handleManualCheck}
              disabled={loading}
              className="px-2 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Check for updates"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleDismiss}
              className="px-2 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <p className="text-red-600 dark:text-red-400 text-xs mt-2">
            Error checking updates: {error}
          </p>
        )}

        {/* Release info footer */}
        {data.releasedAt && (
          <p className="text-blue-500 dark:text-blue-500 text-xs mt-2">
            Released: {new Date(data.releasedAt).toLocaleDateString()}
            {data.isRequired && ' • Required update'}
          </p>
        )}
      </div>
    </div>
  )
}
