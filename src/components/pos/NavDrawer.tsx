import { X, ChevronRight } from 'lucide-react'
import { NAV_MENU_SECTIONS, type NavMenuItem } from '../../data/navMenu'

interface NavDrawerProps {
  open: boolean
  onClose: () => void
  onSelectItem: (item: NavMenuItem) => void
}

export default function NavDrawer({ open, onClose, onSelectItem }: NavDrawerProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close menu"
        onClick={onClose}
      />

      {/* Panel — left side, POS-tablet friendly widths */}
      <aside className="relative z-10 flex h-full w-full max-w-[360px] flex-col overflow-hidden bg-white shadow-xl sm:max-w-[400px]">
        <header className="flex h-14 shrink-0 items-center justify-between bg-gradient-to-b from-salon-primary/95 to-salon-primary-dark px-4 text-white sm:h-16">
          <h2 className="text-lg font-bold tracking-wide">Menu</h2>
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