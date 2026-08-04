import type { LucideIcon } from 'lucide-react'

interface CatalogueTileProps {
  label: string
  icon: LucideIcon
  price?: number
  onClick: () => void
}

export default function CatalogueTile({ label, icon: Icon, price, onClick }: CatalogueTileProps) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[76px] min-w-[130px] flex-col items-center justify-center gap-1 rounded-[10px] border border-white/50 bg-white/40 px-2 py-2 text-center backdrop-blur-md transition-colors duration-150 hover:bg-white/60 active:scale-95 sm:min-h-[100px] sm:min-w-[170px] sm:gap-1.5 sm:px-3 sm:py-3"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--color-salon-primary-light),rgba(245,230,232,0)_70%)] sm:h-12 sm:w-12">
        <Icon size={18} className="text-salon-primary sm:hidden" strokeWidth={2.25} />
        <Icon size={32} className="hidden text-salon-primary sm:block" strokeWidth={2.25} />
      </span>
      <span className="line-clamp-2 text-xs font-semibold leading-tight text-salon-text sm:text-lg lg:text-[22px]">
        {label}
      </span>
      {price !== undefined && (
        <span className="text-sm font-bold tabular-nums text-salon-primary sm:text-xl lg:text-2xl">
          {price.toFixed(2)}
        </span>
      )}
    </button>
  )
}
