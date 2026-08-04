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
      className="flex flex-col items-center justify-center gap-2 min-h-[100px] min-w-[170px] rounded-[10px] border-2 border-salon-border bg-white px-3 py-3 text-center transition-colors hover:border-salon-primary hover:bg-salon-primary-light/50 active:scale-[0.97]"
    >
      <Icon size={30} className="text-salon-primary" strokeWidth={1.8} />
      <span className="text-[22px] leading-tight font-semibold text-salon-text line-clamp-2">
        {label}
      </span>
      {price !== undefined && (
        <span className="text-2xl font-bold text-salon-primary">{price.toFixed(2)}</span>
      )}
    </button>
  )
}
