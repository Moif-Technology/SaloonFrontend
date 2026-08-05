interface ComplimentDialogProps {
  open: boolean
  onClose: () => void
  onApprove: (approvedBy: string) => void
}

export default function ComplimentDialog({ open, onClose, onApprove }: ComplimentDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-salon-primary text-white rounded-xl w-full max-w-sm p-6 shadow-xl">
        <h3 className="text-xl font-bold text-center mb-3">Compliment</h3>
        <p className="text-sm text-white/80 text-center mb-5">
          This bill will be settled as complimentary (no payment collected). Supervisor approval is
          required.
        </p>
        <button
          type="button"
          onClick={() => {
            const name = window.prompt('Supervisor name for compliment approval')
            if (name?.trim()) onApprove(name.trim())
            else onClose()
          }}
          className="w-full h-12 rounded-lg bg-white text-salon-primary font-bold mb-3"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-lg border border-white/40 text-white font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
