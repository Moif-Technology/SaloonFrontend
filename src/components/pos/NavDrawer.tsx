import { X, ChevronRight, DoorClosed } from 'lucide-react'
import { NAV_MENU_SECTIONS, type NavMenuItem } from '../../data/navMenu'

interface NavDrawerProps {
  open: boolean
  onClose: () => void
  onSelectItem: (item: NavMenuItem) => void
  /** Sonu: open counter close (X/Z) from sidebar */
  onCounterClose?: () => void
  staffName?: string
}

export default function NavDrawer({
  open,
  onClose,
  onSelectItem,
  onCounterClose,
  staffName,
}: NavDrawerProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close menu"
        onClick={onClose}
      />

      <aside className="relative z-10 flex h-full w-full max-w-[360px] flex-col overflow-hidden bg-white shadow-xl sm:max-w-[400px]">
        <header className="flex h-14 shrink-0 items-center justify-between bg-gradient-to-b from-salon-primary/95 to-salon-primary-dark px-4 text-white sm:h-16">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-wide">Menu</h2>
            {staffName ? (
              <p className="truncate text-sm text-white/80">{staffName}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-white/15"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </header>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {onCounterClose && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onCounterClose()
              }}
              className={[
                'mb-4 flex h-14 w-full items-center gap-3 rounded-xl px-3 text-left',
                'border border-salon-primary/30 bg-salon-primary/10',
                'text-base font-bold text-salon-primary',
                'transition-colors hover:bg-salon-primary/15 active:bg-salon-primary/20',
              ].join(' ')}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-salon-primary text-white">
                <DoorClosed size={20} strokeWidth={2.25} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block">Counter Close</span>
                <span className="block text-xs font-medium text-salon-muted">
                  X / Z report & cash close
                </span>
              </span>
              <ChevronRight size={18} className="text-salon-muted" />
            </button>
          )}

          {NAV_MENU_SECTIONS.map((section) => (
            <div key={section.id} className="mb-4">
              <div className="mb-2 flex items-center gap-2 px-2 text-salon-primary">
                <section.icon size={18} />
                <span className="text-xs font-bold uppercase tracking-wide text-salon-muted">
                  {section.title}
                </span>
              </div>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onSelectItem(item)}
                        className="flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-base font-medium text-salon-text transition-colors hover:bg-salon-primary-light/60 active:bg-salon-primary-light"
                      >
                        <Icon size={20} className="shrink-0 text-salon-primary" />
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight size={18} className="text-salon-muted" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </div>
  )
}
