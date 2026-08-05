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
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-salon-accent/[0.09] via-white/45 to-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_32px_rgba(31,17,20,0.10)] backdrop-blur-2xl">
      <header className="flex items-center gap-2 border-b border-salon-accent/20 bg-salon-accent/[0.06] px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-4">
        {activeGroup ? (
          <>
            <button
              onClick={onBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/40 text-salon-primary backdrop-blur-sm transition-colors hover:bg-white/60 sm:h-11 sm:w-11"
              aria-label="Back to groups"
            >
              <ChevronLeft size={22} />
            </button>
            <h2 className="truncate text-base font-bold text-salon-text sm:text-xl lg:text-[24px]">
              {activeGroup.name}
            </h2>
            <span className="whitespace-nowrap text-xs font-medium text-salon-muted sm:text-base">
              {products.length} item{products.length === 1 ? '' : 's'}
            </span>
          </>
        ) : (
          <h2 className="text-base font-bold text-salon-text sm:text-xl lg:text-[24px]">
            Select Group
          </h2>
        )}
      </header>

      <div
        key={activeGroup?.id ?? 'groups'}
        className="flex flex-1 overflow-y-auto p-3 sm:p-5 [align-items:safe_center] [justify-content:safe_center]"
      >
        {activeGroup ? (
          products.length === 0 ? (
            <div className="text-sm text-salon-muted sm:text-lg">No items in this group</div>
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
