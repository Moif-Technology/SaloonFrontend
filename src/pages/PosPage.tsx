import { useEffect, useMemo, useState } from 'react'
import PosHeader from '../components/pos/PosHeader'
import StatusStrip from '../components/pos/StatusStrip'
import BillPanel from '../components/pos/BillPanel'
import ServicePanel from '../components/pos/ServicePanel'
import BottomActionBar from '../components/pos/BottomActionBar'
import { serviceGroups, products as allProducts } from '../data/mockCatalogue'
import type { BillItem, Product, ServiceGroup } from '../types/pos'
import { useSnackbar } from '../context/SnackbarContext'

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(date: Date) {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${dd}-${mm}-${date.getFullYear()}`
}

export default function PosPage() {
  const { showSnackbar } = useSnackbar()
  const [now, setNow] = useState(new Date())
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [activeGroup, setActiveGroup] = useState<ServiceGroup | null>(null)
  const [discount] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectionMode = selectedIds.size > 0

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])

  const groupProducts = useMemo(
    () => (activeGroup ? allProducts.filter((p) => p.groupId === activeGroup.id) : []),
    [activeGroup],
  )

  const totals = useMemo(() => {
    const subtotal = billItems.reduce((sum, item) => sum + item.qty * item.price, 0)
    return { subtotal, discount, total: Math.max(subtotal - discount, 0) }
  }, [billItems, discount])

  function handleSelectProduct(product: Product) {
    setBillItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        const updated = { ...existing, qty: existing.qty + 1 }
        return [updated, ...prev.filter((item) => item.productId !== product.id)]
      }
      return [
        { id: `bill-${product.id}-${Date.now()}`, productId: product.id, name: product.name, qty: 1, price: product.price },
        ...prev,
      ]
    })
  }

  function handleIncrement(id: string) {
    setBillItems((prev) => prev.map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item)))
  }

  function handleDecrement(id: string) {
    setBillItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0),
    )
  }

  function handleRemove(id: string) {
    setBillItems((prev) => prev.filter((item) => item.id !== id))
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function handleClear() {
    if (billItems.length === 0) return
    setBillItems([])
    setSelectedIds(new Set())
    showSnackbar('Bill cleared', 'info')
  }

  function handleEnterSelection(id: string) {
    setSelectedIds(new Set([id]))
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleCancelSelection() {
    setSelectedIds(new Set())
  }

  function handleDeleteSelected() {
    const count = selectedIds.size
    setBillItems((prev) => prev.filter((item) => !selectedIds.has(item.id)))
    setSelectedIds(new Set())
    showSnackbar(`${count} item${count === 1 ? '' : 's'} removed`, 'info')
  }

  return (
    <div className="flex flex-col h-dvh">
      <PosHeader
        time={formatTime(now)}
        customerLabel="Walk-in"
        onMenu={() => showSnackbar('Menu coming soon', 'info')}
        onCustomer={() => showSnackbar('Customer selection coming soon', 'info')}
        onAppointment={() => showSnackbar('Appointment view coming soon', 'info')}
        onMore={() => showSnackbar('More options coming soon', 'info')}
      />

      <main className="flex-1 min-h-0 flex flex-col md:flex-row gap-2 sm:gap-3 p-2 sm:p-3 pb-0">
        <div className="h-[46%] md:h-full md:w-[36%] md:min-w-[300px] lg:min-w-[360px] shrink-0 min-h-0 rounded-2xl overflow-hidden border border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_32px_rgba(31,17,20,0.10)]">
          <BillPanel
            items={billItems}
            totals={totals}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onRemove={handleRemove}
            onClear={handleClear}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onEnterSelection={handleEnterSelection}
            onToggleSelect={handleToggleSelect}
            onCancelSelection={handleCancelSelection}
            onDeleteSelected={handleDeleteSelected}
          />
        </div>

        <div className="flex-1 min-h-0 md:h-full rounded-2xl overflow-hidden border border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_32px_rgba(31,17,20,0.10)]">
          <ServicePanel
            groups={serviceGroups}
            products={groupProducts}
            activeGroup={activeGroup}
            onSelectGroup={setActiveGroup}
            onSelectProduct={handleSelectProduct}
            onBack={() => setActiveGroup(null)}
          />
        </div>
      </main>

      <div className="px-2 sm:px-3 py-2 sm:py-3">
        <div className="rounded-2xl px-3 sm:px-5 py-2.5 sm:py-4 bg-white/40 backdrop-blur-2xl border border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_32px_rgba(31,17,20,0.10)]">
          <BottomActionBar
            settlementDisabled={billItems.length === 0}
            onSettlement={() => showSnackbar('Proceeding to settlement...', 'success')}
            onSaveBill={() => showSnackbar('Bill saved', 'success')}
            onAppointment={() => showSnackbar('Appointment view coming soon', 'info')}
            onCustomer={() => showSnackbar('Customer selection coming soon', 'info')}
            onDiscount={() => showSnackbar('Discount entry coming soon', 'info')}
            onPrint={() => showSnackbar('Printing bill...', 'info')}
            onHoldBill={() => showSnackbar('Bill held', 'warning')}
            onMore={() => showSnackbar('More actions coming soon', 'info')}
          />
        </div>
      </div>

      <StatusStrip staffInitial="A" staffName="Admin" billNo="000123" date={formatDate(now)} time={formatTime(now)} />
    </div>
  )
}
