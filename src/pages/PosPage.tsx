import { useEffect, useMemo, useState } from 'react'
import PosHeader from '../components/pos/PosHeader'
import StatusStrip from '../components/pos/StatusStrip'
import BillPanel from '../components/pos/BillPanel'
import ServicePanel from '../components/pos/ServicePanel'
import BottomActionBar from '../components/pos/BottomActionBar'
import { serviceGroups, products as allProducts } from '../data/mockCatalogue'
import type { BillItem, HeldBill, Product, ServiceGroup } from '../types/pos'
import HoldBillModal from '../components/pos/HoldBillModal'
import BillNoteModal from '../components/pos/BillNoteModal'
import CardPaymentModal from '../components/pos/CardPaymentModal'
import QrPayModal from '../components/pos/QrPayModal'
import { useSnackbar } from '../context/SnackbarContext'
import CustomerEntryModal from '../components/pos/CustomerEntryModal'
import NumericKeypadModal from '../components/common/NumericKeypadModal'
import { applyNumericKey } from '../utils/numericInput'
import AppointmentListModal from '../components/pos/AppointmentListModal'
import DiscountModal from '../components/pos/DiscountModal'
import PrintOptionsModal, {
  type ReceiptType,
} from '../components/pos/PrintOptionsModal'
import type { Appointment } from '../types/appointment'
import {
  type AppliedDiscount,
  computeDiscountAmount,
} from '../types/discount'
import {
  fetchAppointments,
  markAppointmentLoaded,
} from '../api/appointments'
import { countDayAppointments } from '../utils/appointmentFilters'
import { toDateKey } from '../utils/appointmentDate'
import {
  appointmentToBillItems,
  isAppointmentOnBill,
} from '../utils/appointmentToBill'

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(date: Date) {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${dd}-${mm}-${date.getFullYear()}`
}

function formatCurrencyLabel(value: number) {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function nextBillNo(seq: number): string {
  return String(seq).padStart(6, '0')
}

function deriveStylistName(items: BillItem[]): string {
  const fromLine = items.find((i) => i.stylistName)?.stylistName
  return fromLine?.trim() || 'Unassigned'
}

export default function PosPage() {
  const { showSnackbar } = useSnackbar()
  const [now, setNow] = useState(new Date())
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [activeGroup, setActiveGroup] = useState<ServiceGroup | null>(null)
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null)

  const [discountModalOpen, setDiscountModalOpen] = useState(false)
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [holdModalOpen, setHoldModalOpen] = useState(false)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [cardModalOpen, setCardModalOpen] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [billNote, setBillNote] = useState('')
  const [heldBills, setHeldBills] = useState<HeldBill[]>([])
  const [billSeq, setBillSeq] = useState(123)
  const [customerLabel, setCustomerLabel] = useState('Walk-in')
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null)
  const [qtyEdit, setQtyEdit] = useState<{
    id: string
    name: string
    draft: string
    error: string | null
  } | null>(null)

  function openQtyEdit(item: BillItem) {
    setQtyEdit({
      id: item.id,
      name: item.name,
      draft: String(item.qty),
      error: null,
    })
  }

  function applyQtyEdit() {
    if (!qtyEdit) return
    const n = Math.floor(Number(qtyEdit.draft))
    if (!Number.isFinite(n) || n < 1) {
      const message = 'Quantity must be at least 1'
      showSnackbar(message, 'error')
      setQtyEdit((q) => (q ? { ...q, error: message } : q))
      return
    }
    setBillItems((prev) =>
      prev.map((item) => (item.id === qtyEdit.id ? { ...item, qty: n } : item)),
    )
    setQtyEdit(null)
  }

  function cancelQtyEdit() {
    setQtyEdit(null)
  }

  function handleEditQty(id: string) {
    const item = billItems.find((i) => i.id === id)
    if (!item) return
    openQtyEdit(item)
  }

  async function loadAppointments() {
    setAppointmentsLoading(true)
    try {
      const list = await fetchAppointments()
      setAppointments(list)
    } catch {
      showSnackbar('Could not load appointments', 'error')
    } finally {
      setAppointmentsLoading(false)
    }
  }

  useEffect(() => {
    void loadAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, [])

  useEffect(() => {
    if (appointmentModalOpen) void loadAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentModalOpen])

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
    const discount = computeDiscountAmount(subtotal, appliedDiscount)
    const tax = 0
    return {
      subtotal,
      discount,
      tax,
      total: Math.max(subtotal - discount, 0),
    }
  }, [billItems, appliedDiscount])

  const todayApptCount = useMemo(
    () => countDayAppointments(appointments, toDateKey(now)),
    [appointments, now],
  )

  const loadedAppointmentIds = useMemo(() => {
    const ids = new Set<string>()
    for (const b of billItems) {
      if (b.appointmentId) ids.add(b.appointmentId)
    }
    for (const a of appointments) {
      if (a.loadedIntoBill) ids.add(a.id)
    }
    return ids
  }, [billItems, appointments])

  function handleSelectProduct(product: Product) {
    setBillItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        const updated = { ...existing, qty: existing.qty + 1 }
        return [updated, ...prev.filter((item) => item.productId !== product.id)]
      }
      return [
        {
          id: `bill-${product.id}-${Date.now()}`,
          productId: product.id,
          name: product.name,
          qty: 1,
          price: product.price,
        },
        ...prev,
      ]
    })
  }

  function handleIncrement(id: string) {
    setBillItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item)),
    )
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
    setAppliedDiscount(null)
    setBillNote('')
    showSnackbar('Bill cleared', 'info')
  }

  function handleOpenDiscount() {
    setDiscountModalOpen(true)
  }

  function handleOpenHoldBills() {
    setHoldModalOpen(true)
  }

  function handleOpenNote() {
    setNoteModalOpen(true)
  }

  function handleOpenCard() {
    if (billItems.length === 0) {
      showSnackbar('Add items before taking card payment', 'warning')
      return
    }
    setCardModalOpen(true)
  }

  function handleOpenQrPay() {
    if (billItems.length === 0) {
      showSnackbar('Add items before taking QR payment', 'warning')
      return
    }
    setQrModalOpen(true)
  }

  function settlePaidBill(methodLabel: string) {
    showSnackbar(
      `${methodLabel} received · ₹${formatCurrencyLabel(totals.total)}`,
      'success',
    )
    setBillItems([])
    setAppliedDiscount(null)
    setBillNote('')
    setCustomerLabel('Walk-in')
    setActiveAppointmentId(null)
    setCardModalOpen(false)
    setQrModalOpen(false)
  }

  function handleCardPaymentComplete() {
    settlePaidBill('Card payment')
  }

  function handleQrPaymentComplete() {
    settlePaidBill('QR payment')
  }

  function handleSaveBillNote(note: string) {
    setBillNote(note)
    setNoteModalOpen(false)
    showSnackbar(note ? 'Bill note saved' : 'Bill note cleared', note ? 'success' : 'info')
  }

  function handleHoldCurrentBill(note: string) {
    if (billItems.length === 0) {
      showSnackbar('Nothing to hold — cart is empty', 'warning')
      return
    }

    const snapshot: HeldBill = {
      id: `held-${Date.now()}`,
      billNo: nextBillNo(billSeq),
      heldAt: new Date().toISOString(),
      note,
      customerName: customerLabel,
      stylistName: deriveStylistName(billItems),
      items: billItems.map((item) => ({ ...item })),
      appliedDiscount: appliedDiscount ? { ...appliedDiscount } : null,
      appointmentId: activeAppointmentId,
      subtotal: totals.subtotal,
      discount: totals.discount,
      total: totals.total,
    }

    setHeldBills((prev) => [snapshot, ...prev])
    setBillSeq((n) => n + 1)

    setBillItems([])
    setAppliedDiscount(null)
    setCustomerLabel('Walk-in')
    setActiveAppointmentId(null)

    showSnackbar(`Bill #${snapshot.billNo} held`, 'warning')
  }

  function handleRecallHeldBill(bill: HeldBill) {
    if (billItems.length > 0) {
      showSnackbar(
        'Clear or hold the current bill before resuming another',
        'warning',
      )
      return
    }

    setBillItems(bill.items.map((item) => ({ ...item })))
    setAppliedDiscount(bill.appliedDiscount ? { ...bill.appliedDiscount } : null)
    setCustomerLabel(bill.customerName || 'Walk-in')
    setActiveAppointmentId(bill.appointmentId)

    setHeldBills((prev) => prev.filter((h) => h.id !== bill.id))
    setHoldModalOpen(false)
    showSnackbar(`Resumed bill #${bill.billNo}`, 'success')
  }

  function handleDeleteHeldBill(billId: string) {
    const target = heldBills.find((h) => h.id === billId)
    setHeldBills((prev) => prev.filter((h) => h.id !== billId))
    showSnackbar(
      target ? `Voided held bill #${target.billNo}` : 'Held bill removed',
      'info',
    )
  }

  function handleApplyDiscount(discount: AppliedDiscount) {
    setAppliedDiscount(discount)
    setDiscountModalOpen(false)
    const label =
      discount.mode === 'percentage'
        ? `${discount.value}%`
        : formatCurrencyLabel(discount.value)
    showSnackbar(
      discount.promoCode
        ? `Discount applied (${discount.promoCode}: ${label})`
        : `Discount applied (${label})`,
      'success',
    )
  }

  function handleRemoveDiscount() {
    setAppliedDiscount(null)
    setDiscountModalOpen(false)
    showSnackbar('Discount removed', 'info')
  }

  function handleOpenPrint() {
    setPrintModalOpen(true)
  }

  function handlePrint(receiptType: ReceiptType) {
    const labels: Record<ReceiptType, string> = {
      customer: 'Customer Receipt',
      kitchen: 'Kitchen/Service Ticket',
      gift: 'Gift Receipt',
    }
    showSnackbar(`Printing ${labels[receiptType]}...`, 'info')
    setPrintModalOpen(false)
  }

  function handleReprintLast() {
    showSnackbar('Reprinting last bill...', 'info')
  }

  function handleSendEmail() {
    showSnackbar('Send receipt via email coming soon', 'info')
  }

  function handleSendSms() {
    showSnackbar('Send receipt via SMS coming soon', 'info')
  }

  function handleTestPrinter() {
    showSnackbar('Test page sent to printer', 'success')
  }

  function handleChangePrinter() {
    showSnackbar('Printer picker coming soon', 'info')
  }

  function handleOpenCustomer() {
    setCustomerModalOpen(true)
  }

  function handleCustomerSaved(customer: unknown) {
    const name =
      customer &&
      typeof customer === 'object' &&
      'name' in customer &&
      typeof (customer as { name: unknown }).name === 'string'
        ? (customer as { name: string }).name
        : customerLabel
    setCustomerLabel(name || 'Customer')
    showSnackbar('Customer saved', 'success')
  }

  function handleOpenAppointments() {
    setAppointmentModalOpen(true)
  }

  async function handleSelectAppointment(appt: Appointment) {
    if (appt.status === 'cancelled') {
      showSnackbar('Cannot load a cancelled appointment', 'warning')
      return
    }
    if (isAppointmentOnBill(billItems, appt.id) || appt.loadedIntoBill) {
      showSnackbar('Appointment already on this bill', 'info')
      return
    }

    const lines = appointmentToBillItems(appt)
    setBillItems((prev) => [...prev, ...lines])
    setCustomerLabel(appt.customerName || 'Customer')
    setActiveAppointmentId(appt.id)

    await markAppointmentLoaded(appt.id)
    setAppointments((prev) =>
      prev.map((a) => (a.id === appt.id ? { ...a, loadedIntoBill: true } : a)),
    )

    setAppointmentModalOpen(false)
    showSnackbar(`Loaded ${appt.customerName}'s appointment`, 'success')
  }

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
      <header className="shrink-0">
        <PosHeader
          time={formatTime(now)}
          customerLabel={customerLabel}
          appointmentCount={todayApptCount}
          onMenu={() => showSnackbar('Menu coming soon', 'info')}
          onCustomer={handleOpenCustomer}
          onAppointment={handleOpenAppointments}
          onMore={() => showSnackbar('More options coming soon', 'info')}
        />
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-2 p-2 md:flex-row md:gap-3 md:p-3">
        <aside className="h-[46%] min-h-0 w-full min-w-0 shrink-0 overflow-hidden md:h-full md:w-[36%] md:min-w-[300px] md:basis-[36%] md:shrink-0 lg:min-w-[360px] flex flex-col">
          <BillPanel
            items={billItems}
            totals={totals}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onRemove={handleRemove}
            onClear={handleClear}
            onEditQty={handleEditQty}
          />
        </aside>

        <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ServicePanel
            groups={serviceGroups}
            products={groupProducts}
            activeGroup={activeGroup}
            onSelectGroup={setActiveGroup}
            onSelectProduct={handleSelectProduct}
            onBack={() => setActiveGroup(null)}
          />
        </section>
      </main>

      <footer className="shrink-0 border-t border-white/40 bg-white/40 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_-4px_24px_rgba(31,17,20,0.06)]">
        <BottomActionBar
          settlementDisabled={billItems.length === 0}
          onDiscount={handleOpenDiscount}
          onNote={handleOpenNote}
          onCustomer={handleOpenCustomer}
          onAppointment={handleOpenAppointments}
          onHoldBill={handleOpenHoldBills}
          onBillPrint={handleOpenPrint}
          onSaveBill={() => showSnackbar('Bill saved', 'success')}
          onQuickCash={() => showSnackbar('Quick cash settlement...', 'success')}
          onCard={handleOpenCard}
          onQrPay={handleOpenQrPay}
          onSettlement={() => showSnackbar('Proceeding to settlement...', 'success')}
        />
        <StatusStrip
          staffInitial="A"
          staffName="Admin"
          billNo={nextBillNo(billSeq)}
          date={formatDate(now)}
          time={formatTime(now)}
        />
      </footer>

      <CustomerEntryModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSaved={handleCustomerSaved}
        onError={(msg: string) => showSnackbar(msg, 'error')}
      />
      <AppointmentListModal
        open={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        appointments={appointments}
        loading={appointmentsLoading}
        onSelect={handleSelectAppointment}
        activeAppointmentId={activeAppointmentId}
        loadedAppointmentIds={loadedAppointmentIds}
      />
      <DiscountModal
        open={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
        subtotal={totals.subtotal}
        current={appliedDiscount}
        onApply={handleApplyDiscount}
        onRemove={handleRemoveDiscount}
        onPromoFeedback={(msg, kind) => showSnackbar(msg, kind)}
      />
      <PrintOptionsModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        canPrint={billItems.length > 0}
        printerName="POS-80 Thermal Printer"
        printerConnected={true}
        onPrint={handlePrint}
        onReprintLast={handleReprintLast}
        onSendEmail={handleSendEmail}
        onSendSms={handleSendSms}
        onTestPrinter={handleTestPrinter}
        onChangePrinter={handleChangePrinter}
      />
      <HoldBillModal
        open={holdModalOpen}
        onClose={() => setHoldModalOpen(false)}
        canHold={billItems.length > 0}
        heldBills={heldBills}
        onHold={handleHoldCurrentBill}
        onRecall={handleRecallHeldBill}
        onDelete={handleDeleteHeldBill}
      />
      <BillNoteModal
        open={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        currentNote={billNote}
        onSave={handleSaveBillNote}
      />
      <CardPaymentModal
        open={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        amount={totals.total}
        onComplete={handleCardPaymentComplete}
      />
      <QrPayModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        amount={totals.total}
        billRef={nextBillNo(billSeq)}
        onComplete={handleQrPaymentComplete}
      />
      <NumericKeypadModal
        open={!!qtyEdit}
        title="Edit quantity"
        label={qtyEdit?.name ?? 'Quantity'}
        value={qtyEdit?.draft ?? ''}
        error={qtyEdit?.error ?? null}
        allowDecimal={false}
        doneLabel="Done"
        onKey={(key) =>
          setQtyEdit((q) =>
            q
              ? {
                  ...q,
                  error: null,
                  draft: applyNumericKey(q.draft, key, {
                    allowDecimal: false,
                    maxLength: 4,
                    allowLeadingZeros: false,
                  }),
                }
              : q,
          )
        }
        onDone={applyQtyEdit}
        onClose={cancelQtyEdit}
      />
    </div>
  )
}
