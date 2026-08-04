import { ChevronLeft } from 'lucide-react'
import CatalogueTile from './CatalogueTile'
import type { Product, ServiceGroup } from '../../types/pos'

interface ServicePanelProps {
  groups: ServiceGroup[]
  products: Product[]
  activeGroup: ServiceGroup | null
  onSelectGroup: (group: ServiceGroup) => void
  onSelectProduct: (product: Product) => void
  onBack: () => void
}

export default function ServicePanel({
  groups,
  products,
  activeGroup,
  onSelectGroup,
  onSelectProduct,
  onBack,
}: ServicePanelProps) {
  return (
    <section className="flex flex-col h-full bg-white/45 backdrop-blur-2xl">
      <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-4 border-b border-white/40 bg-white/20">
        {activeGroup ? (
          <>
            <button
              onClick={onBack}
              className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full text-salon-primary bg-white/40 backdrop-blur-sm border border-white/50 hover:bg-white/60 transition-colors shrink-0"
              aria-label="Back to groups"
            >
              <ChevronLeft size={22} />
            </button>
            <h2 className="text-base sm:text-xl lg:text-[24px] font-bold text-salon-text truncate">
              {activeGroup.name}
            </h2>
            <span className="text-xs sm:text-base text-salon-muted font-medium whitespace-nowrap">
              {products.length} item{products.length === 1 ? '' : 's'}
            </span>
          </>
        ) : (
          <h2 className="text-base sm:text-xl lg:text-[24px] font-bold text-salon-text">Select Group</h2>
        )}
      </header>

      <div
        key={activeGroup?.id ?? 'groups'}
        className="flex-1 overflow-y-auto p-3 sm:p-5 flex [align-items:safe_center] [justify-content:safe_center]"
      >
        {activeGroup ? (
          products.length === 0 ? (
            <div className="text-salon-muted text-sm sm:text-lg">No items in this group</div>
          ) : (
            <div className="flex flex-wrap justify-center gap-2.5 sm:gap-4">
              {products.map((product) => (
                <CatalogueTile
                  key={product.id}
                  label={product.name}
                  icon={product.icon}
                  price={product.price}
                  onClick={() => onSelectProduct(product)}
                />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-wrap justify-center gap-2.5 sm:gap-4">
            {groups.map((group) => (
              <CatalogueTile
                key={group.id}
                label={group.name}
                icon={group.icon}
                onClick={() => onSelectGroup(group)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
