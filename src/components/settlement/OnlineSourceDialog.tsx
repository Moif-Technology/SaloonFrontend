interface OnlineSourceDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (source: string) => void
  sources: readonly string[]
}

export default function OnlineSourceDialog({
  open,
  onClose,
  onSelect,
  sources,
}: OnlineSourceDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-5 shadow-xl">
        <h3 className="text-xl font-bold text-salon-primary text-center mb-5">Online Sources</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {sources.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              className="h-14 rounded-lg bg-salon-primary text-white font-bold text-sm hover:bg-salon-primary-dark"
            >
              {s}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-lg border-2 border-salon-border font-semibold text-salon-text hover:bg-salon-bg"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
