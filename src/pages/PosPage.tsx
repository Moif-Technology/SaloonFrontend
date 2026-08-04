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
        return prev.map((item) =>
          item.productId === product.id ? { ...item, qty: item.qty + 1 } : item,
        )
      }
      return [
        ...prev,
        { id: `bill-${product.id}-${Date.now()}`, productId: product.id, name: product.name, qty: 1, price: product.price },
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
  }

  function handleClear() {
    if (billItems.length === 0) return
    setBillItems([])
    showSnackbar('Bill cleared', 'info')
  }

  return (
    <div className="flex flex-col h-screen bg-salon-bg">
      <PosHeader
        time={formatTime(now)}
        customerLabel="Walk-in"
        onMenu={() => showSnackbar('Menu coming soon', 'info')}
        onCustomer={() => showSnackbar('Customer selection coming soon', 'info')}
        onAppointment={() => showSnackbar('Appointment view coming soon', 'info')}
        onMore={() => showSnackbar('More options coming soon', 'info')}
      />

      <main className="flex-1 min-h-0 flex gap-4 p-4">
        <div className="w-[36%] min-w-[360px] h-full">
          <BillPanel
            items={billItems}
            totals={totals}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onRemove={handleRemove}
            onClear={handleClear}
          />
        </div>

        <div className="flex-1 h-full">
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

      <div className="px-4 pb-3">
        <BottomActionBar
          settlementDisabled={billItems.length === 0}
          onDiscount={() => showSnackbar('Discount entry coming soon', 'info')}
          onNote={() => showSnackbar('Note / comment coming soon', 'info')}
          onCustomer={() => showSnackbar('Customer selection coming soon', 'info')}
          onAppointment={() => showSnackbar('Appointment view coming soon', 'info')}
          onHoldBill={() => showSnackbar('Bill held', 'warning')}
          onBillPrint={() => showSnackbar('Printing bill...', 'info')}
          onSaveBill={() => showSnackbar('Bill saved', 'success')}
          onQuickCash={() => showSnackbar('Quick cash settlement...', 'success')}
          onCard={() => showSnackbar('Card settlement...', 'success')}
          onQrPay={() => showSnackbar('QR pay settlement...', 'success')}
          onSettlement={() => showSnackbar('Proceeding to settlement...', 'success')}
        />
      </div>

      <StatusStrip staffInitial="A" staffName="Admin" billNo="000123" date={formatDate(now)} time={formatTime(now)} />
    </div>
  )
}
