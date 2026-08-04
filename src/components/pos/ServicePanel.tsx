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
    <section className="flex flex-col h-full bg-white rounded-2xl border border-salon-border overflow-hidden">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-salon-border">
        {activeGroup ? (
          <>
            <button
              onClick={onBack}
              className="flex items-center justify-center w-11 h-11 rounded-full text-salon-primary hover:bg-salon-primary-light"
              aria-label="Back to groups"
            >
              <ChevronLeft size={28} />
            </button>
            <h2 className="text-[24px] font-bold text-salon-text">{activeGroup.name}</h2>
          </>
        ) : (
          <h2 className="text-[24px] font-bold text-salon-text">Select Group</h2>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        {activeGroup ? (
          products.length === 0 ? (
            <div className="h-full flex items-center justify-center text-salon-muted text-lg">
              No items in this group
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4">
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
          <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4">
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
