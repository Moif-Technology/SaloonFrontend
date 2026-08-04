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
      className="flex flex-col items-center justify-center gap-1 sm:gap-1.5 min-h-[76px] min-w-[130px] sm:min-h-[100px] sm:min-w-[170px] rounded-[10px] border border-white/50 bg-white/40 backdrop-blur-md px-2 sm:px-3 py-2 sm:py-3 text-center transition-colors duration-150 hover:bg-white/60 active:scale-95"
    >
      <span className="flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--color-salon-primary-light),rgba(245,230,232,0)_70%)]">
        <Icon
          size={16}
          className="text-salon-primary/70 sm:hidden"
          strokeWidth={1.8}
        />
        <Icon
          size={30}
          className="text-salon-primary/70 hidden sm:block"
          strokeWidth={1.8}
        />
      </span>
      <span className="text-xs sm:text-lg lg:text-[22px] leading-tight font-semibold text-salon-text line-clamp-2">
        {label}
      </span>
      {price !== undefined && (
        <span className="text-sm sm:text-xl lg:text-2xl font-bold text-salon-primary tabular-nums">
          {price.toFixed(2)}
        </span>
      )}
    </button>
  )
}
