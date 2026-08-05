import { useEffect, useMemo, useState } from 'react'
import PosHeader from '../components/pos/PosHeader'
import StatusStrip from '../components/pos/StatusStrip'
import BillPanel from '../components/pos/BillPanel'
import ServicePanel from '../components/pos/ServicePanel'
import BottomActionBar from '../components/pos/BottomActionBar'
import SettlementDialog from '../components/settlement/SettlementDialog'
import JobListDialog, { type LoadedJobInvoice } from '../components/pos/JobListDialog'
import CounterCloseDialog from '../components/pos/CounterCloseDialog'
import NavDrawer from '../components/pos/NavDrawer'
import GroupDetailsModal from '../components/pos/GroupDetailsModal'
import SubGroupDetailsModal from '../components/pos/SubGroupDetailsModal'
import ProductDetailsModal from '../components/pos/ProductDetailsModal'
import ServiceDetailsModal from '../components/pos/ServiceDetailsModal'
import QuickCashPaymentModal from '../components/pos/QuickCashPaymentModal'
import SalesViewerDialog from '../components/pos/SalesViewerDialog'
import HoldBillModal from '../components/pos/HoldBillModal'
import BillNoteModal from '../components/pos/BillNoteModal'
import CardPaymentModal from '../components/pos/CardPaymentModal'
import QrPayModal from '../components/pos/QrPayModal'
import CustomerEntryModal from '../components/pos/CustomerEntryModal'
import NumericKeypadModal from '../components/common/NumericKeypadModal'
import AppointmentListModal from '../components/pos/AppointmentListModal'
import DiscountModal from '../components/pos/DiscountModal'
import PrintOptionsModal, { type ReceiptType } from '../components/pos/PrintOptionsModal'
import { serviceGroups, products as allProducts } from '../data/mockCatalogue'
import type { BillItem, HeldBill, Product, ServiceGroup } from '../types/pos'
import type { PaymentMethodLabel, SettleOrderData } from '../types/settlement'
import type { Appointment } from '../types/appointment'
import type { CashPaymentResult } from '../types/payment'
import type { NavMenuItem } from '../data/navMenu'
import {
  type AppliedDiscount,
  computeDiscountAmount,
} from '../types/discount'
import { useSnackbar } from '../context/SnackbarContext'
import { apiService } from '../api/apiService'
import { SessionManager } from '../utils/sessionManager'
import { buildJobSavePayload, buildOrderData } from '../utils/buildOrderData'
import { getPosSession } from '../utils/posSession'
import { computeBillTotals } from '../lib/discountCalc'
import {
  billFromSettleResult,
  printBillFromData,
  printSettlementBill,
} from '../lib/printBillReceipt'
import { applyNumericKey } from '../utils/numericInput'
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

function formatElapsed(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
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
  const [jobId, setJobId] = useState(0)
  const [jobNo, setJobNo] = useState<string | null>(null)
  const [billStartedAt, setBillStartedAt] = useState<Date | null>(null)

  const [settleOpen, setSettleOpen] = useState(false)
  const [settleBusy, setSettleBusy] = useState(false)
  const [orderData, setOrderData] = useState<SettleOrderData | null>(null)
  const [initialMethod, setInitialMethod] = useState<PaymentMethodLabel>('Cash')
  const [jobListOpen, setJobListOpen] = useState(false)
  const [counterCloseOpen, setCounterCloseOpen] = useState(false)
  const [navDrawerOpen, setNavDrawerOpen] = useState(false)
  const [groupEntryOpen, setGroupEntryOpen] = useState(false)
  const [subGroupEntryOpen, setSubGroupEntryOpen] = useState(false)
  const [productEntryOpen, setProductEntryOpen] = useState(false)
  const [serviceEntryOpen, setServiceEntryOpen] = useState(false)
  const [cashModalOpen, setCashModalOpen] = useState(false)
  const [salesViewerOpen, setSalesViewerOpen] = useState(false)
  const [lastSettled, setLastSettled] = useState<{
    salesId: string | number
    orderData: SettleOrderData
    settleResult: Record<string, unknown>
  } | null>(null)

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectionMode = selectedIds.size > 0

  const discountAmount = useMemo(
    () =>
      computeDiscountAmount(
        billItems.reduce((sum, item) => sum + item.qty * item.price, 0),
        appliedDiscount,
      ),
    [billItems, appliedDiscount],
  )

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

  function handleOpenMenu() {
    setNavDrawerOpen(true)
  }

  function handleNavSelect(item: NavMenuItem) {
    setNavDrawerOpen(false)

    if (item.action === 'group-entry') {
      setGroupEntryOpen(true)
      return
    }
    if (item.action === 'sub-group-entry') {
      setSubGroupEntryOpen(true)
      return
    }
    if (item.action === 'product-entry') {
      setProductEntryOpen(true)
      return
    }
    if (item.action === 'service-entry') {
      setServiceEntryOpen(true)
      return
    }
    if (item.action === 'sales-viewer' || item.id === 'sales-viewer') {
      setSalesViewerOpen(true)
      return
    }

    showSnackbar(`${item.label} coming soon`, 'info')
  }

  function handleOpenQuickCash() {
    if (billItems.length === 0) {
      showSnackbar('Add items before quick cash', 'warning')
      return
    }
    setCashModalOpen(true)
  }

  async function handleCashPaymentComplete(_result: CashPaymentResult) {
    setCashModalOpen(false)
    await directSettle('Cash')
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
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const groupProducts = useMemo(
    () => (activeGroup ? allProducts.filter((p) => p.groupId === activeGroup.id) : []),
    [activeGroup],
  )

  const totals = useMemo(() => {
    const t = computeBillTotals(billItems, discountAmount)
    return {
      subtotal: t.subtotal,
      discount: t.discount,
      tax: t.tax,
      total: t.total,
    }
  }, [billItems, discountAmount])

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
    if (billItems.length === 0) setBillStartedAt(new Date())
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
          groupId: Number(product.groupId) || 0,
          taxRate: product.taxRate ?? 5,
          lineType: product.lineType,
          stylistId: getPosSession().staffId || undefined,
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
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function resetBillState() {
    setBillItems([])
    setJobId(0)
    setJobNo(null)
    setBillStartedAt(null)
    setAppliedDiscount(null)
    setOrderData(null)
    setBillNote('')
    setCustomerLabel('Walk-in')
    setActiveAppointmentId(null)
    setSelectedIds(new Set())
  }

  function handleClear() {
    if (billItems.length === 0) return
    resetBillState()
    showSnackbar('Bill cleared', 'info')
  }

  function handleEnterSelection(id: string) {
    setSelectedIds(new Set([id]))
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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

  async function ensureJobSaved(
    items: BillItem[],
  ): Promise<{ jobId: number; jobNo: string | null; items: BillItem[] }> {
    if (jobId > 0) return { jobId, jobNo, items }

    if (!SessionManager.accessToken) {
      throw new Error('Not logged in. Complete PIN login first so a POS token is stored.')
    }

    const payload = buildJobSavePayload(items)
    const result = await apiService.saveKot(payload)
    const newId = Number(
      result.CurrentKOTID ?? result.currentJobId ?? result.jobId ?? 0,
    )
    if (!newId) {
      throw new Error(
        String(result.message || result.msg || 'Save Job did not return a valid job ID'),
      )
    }

    const kotDetails = result.kotDetails as { data?: Record<string, unknown>[] } | undefined
    const lines = kotDetails?.data ?? (result.data as Record<string, unknown>[] | undefined)
    let nextItems = items
    if (Array.isArray(lines) && lines.length) {
      nextItems = items.map((item, idx) => {
        const line = lines[idx] as Record<string, unknown> | undefined
        if (!line) return item
        return {
          ...item,
          lineId: Number(line.LineID ?? line.lineId ?? line.KotChildID ?? item.lineId) || item.lineId,
          stylistId:
            Number(line.StylistID ?? line.stylistId ?? item.stylistId) || item.stylistId,
          lineType: String(line.LineType ?? line.lineType ?? item.lineType ?? 'PRODUCT'),
        }
      })
      setBillItems(nextItems)
    }

    const newNo = result.jobNo ? String(result.jobNo) : null
    setJobId(newId)
    setJobNo(newNo)
    return { jobId: newId, jobNo: newNo, items: nextItems }
  }

  async function openSettlement() {
    if (billItems.length === 0 || settleBusy) return
    setSettleBusy(true)
    try {
      const saved = await ensureJobSaved(billItems)
      const data = buildOrderData({
        billItems: saved.items,
        jobId: saved.jobId,
        jobNo: saved.jobNo,
        discountAmount,
        customerName: customerLabel || 'Walk-in',
      })
      setOrderData(data)
      setInitialMethod('Cash')
      setSettleOpen(true)
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Could not open settlement', 'error')
    } finally {
      setSettleBusy(false)
    }
  }

  /** Quick Cash / Card / Online / QR — settle via Sonu API. */
  async function directSettle(method: 'Cash' | 'Card' | 'Online') {
    if (billItems.length === 0 || settleBusy) return
    setSettleBusy(true)
    try {
      const saved = await ensureJobSaved(billItems)
      const data = buildOrderData({
        billItems: saved.items,
        jobId: saved.jobId,
        jobNo: saved.jobNo,
        discountAmount,
        customerName: customerLabel || 'Walk-in',
      })

      const paymentMode =
        method === 'Card' ? 'CREDITCARD' : method === 'Online' ? 'ONLINE' : 'CASH'

      const payload: SettleOrderData = {
        ...data,
        paymentMode,
        paidAmount: data.netAmount,
      }
      if (paymentMode === 'ONLINE') {
        payload.onlineSource = 'ONLINE'
        payload.paymentRefNo = 'ONLINE'
      }

      const result = await apiService.saveSettlement(
        payload as unknown as Record<string, unknown>,
      )

      setLastSettled({
        salesId: String(result.salesId ?? ''),
        orderData: payload,
        settleResult: result as unknown as Record<string, unknown>,
      })

      resetBillState()
      setCardModalOpen(false)
      setQrModalOpen(false)

      showSnackbar(
        `Bill #${result.billNo} settled (${paymentMode})`,
        'success',
      )
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Direct settlement failed', 'error')
    } finally {
      setSettleBusy(false)
    }
  }

  async function handleSaveBill() {
    if (billItems.length === 0) return
    try {
      const saved = await ensureJobSaved(billItems)
      resetBillState()
      showSnackbar(
        `Job saved${saved.jobNo ? ` #${saved.jobNo}` : ''} — open Job List to recall`,
        'success',
      )
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Save bill failed', 'error')
    }
  }

  function handleLoadJobInvoice(loaded: LoadedJobInvoice) {
    setBillItems(loaded.items)
    setJobId(loaded.jobId)
    setJobNo(loaded.jobNo)
    setBillStartedAt(loaded.startedAt ?? new Date())
    setAppliedDiscount(null)
    setOrderData(null)
    showSnackbar(
      `Loaded job${loaded.jobNo ? ` #${loaded.jobNo}` : ''} — ready to settle / print`,
      'success',
    )
  }

  async function handleBillPrint() {
    const meta = {
      counterNo: getPosSession().counterNo,
      companyName: 'MOIF TECHNOLOGY',
    }

    try {
      if (billItems.length > 0) {
        const data =
          orderData ??
          buildOrderData({
            billItems,
            jobId,
            jobNo,
            discountAmount,
            customerName: customerLabel || 'Walk-in',
          })
        const bill = billFromSettleResult(data, {
          salesId: data.jobId || data.kotId || '',
          billNo: data.jobNo || data.kotNumber || String(data.jobId || data.kotId || ''),
          paymentMode: data.paymentMode ?? 'CASH',
          paidAmount: data.netAmount,
          balancePaid: 0,
        })
        await printBillFromData(bill, meta)
        showSnackbar('Printing invoice…', 'success')
        return
      }

      if (lastSettled?.salesId) {
        await printSettlementBill({
          salesId: lastSettled.salesId,
          orderData: lastSettled.orderData,
          settleResult: lastSettled.settleResult,
          meta,
        })
        showSnackbar('Printing invoice…', 'success')
        return
      }

      showSnackbar('Nothing to print — add items or settle a bill first', 'warning')
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Print failed', 'error')
    }
  }

  function handleOpenDiscount() {
    if (billItems.length === 0) {
      showSnackbar('Add items before applying discount', 'warning')
      return
    }
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

  function handleCardPaymentComplete() {
    void directSettle('Card')
  }

  function handleQrPaymentComplete() {
    void directSettle('Online')
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
      billNo: jobNo || nextBillNo(billSeq),
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
    resetBillState()
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
    setBillStartedAt(new Date())

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
    setPrintModalOpen(false)
    if (receiptType === 'customer') {
      void handleBillPrint()
      return
    }
    const labels: Record<ReceiptType, string> = {
      customer: 'Customer Receipt',
      kitchen: 'Kitchen/Service Ticket',
      gift: 'Gift Receipt',
    }
    showSnackbar(`Printing ${labels[receiptType]}...`, 'info')
  }

  function handleReprintLast() {
    setPrintModalOpen(false)
    if (!lastSettled?.salesId && billItems.length === 0) {
      showSnackbar('No previous bill to reprint', 'warning')
      return
    }
    void handleBillPrint()
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
    if (billItems.length === 0) setBillStartedAt(new Date())
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

  const session = getPosSession()
  const startTimeLabel = billStartedAt ? formatTime(billStartedAt) : '—'
  const elapsedLabel = billStartedAt
    ? formatElapsed(now.getTime() - billStartedAt.getTime())
    : '—'
  const billNoLabel = jobNo || (jobId ? String(jobId).padStart(6, '0') : nextBillNo(billSeq))

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
      <header className="shrink-0">
        <PosHeader
          time={formatTime(now)}
          customerLabel={customerLabel}
          appointmentCount={todayApptCount}
          onMenu={handleOpenMenu}
          onCustomer={handleOpenCustomer}
          onAppointment={handleOpenAppointments}
          onMore={() => showSnackbar('More options coming soon', 'info')}
        />
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-2 p-2 md:flex-row md:gap-3 md:p-3">
        <aside className="flex h-[46%] min-h-0 w-full min-w-0 shrink-0 flex-col overflow-hidden md:h-full md:w-[36%] md:min-w-[300px] md:basis-[36%] md:shrink-0 lg:min-w-[360px]">
          <BillPanel
            items={billItems}
            totals={totals}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onRemove={handleRemove}
            onClear={handleClear}
            onEditQty={handleEditQty}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onEnterSelection={handleEnterSelection}
            onToggleSelect={handleToggleSelect}
            onCancelSelection={handleCancelSelection}
            onDeleteSelected={handleDeleteSelected}
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

      <footer className="shrink-0 border-t border-white/40 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_-4px_24px_rgba(31,17,20,0.06)] backdrop-blur-2xl">
        <BottomActionBar
          settlementDisabled={billItems.length === 0 || settleBusy}
          onDiscount={handleOpenDiscount}
          onNote={handleOpenNote}
          onCustomer={handleOpenCustomer}
          onAppointment={handleOpenAppointments}
          onHoldBill={handleOpenHoldBills}
          onBillPrint={handleOpenPrint}
          onSaveBill={() => void handleSaveBill()}
          onQuickCash={handleOpenQuickCash}
          onCard={handleOpenCard}
          onQrPay={handleOpenQrPay}
          onJobList={() => setJobListOpen(true)}
          onSettlement={() => void openSettlement()}
        />
        <StatusStrip
          staffInitial={(session.staffName || 'A').charAt(0).toUpperCase()}
          staffName={session.staffName || 'Admin'}
          billNo={billNoLabel}
          date={formatDate(now)}
          time={formatTime(now)}
        />
      </footer>

      {orderData && settleOpen && (
        <SettlementDialog
          key={`${orderData.kotId}-${initialMethod}`}
          open={settleOpen}
          netTotal={orderData.netAmount}
          customerName={orderData.customerName || customerLabel || 'Walk-in'}
          startTime={startTimeLabel}
          elapsed={elapsedLabel}
          orderData={orderData}
          initialMethod={initialMethod}
          onClose={() => setSettleOpen(false)}
          onSuccess={(result) => {
            const printOrder = result.settledOrder
            setLastSettled({
              salesId: result.salesId,
              orderData: printOrder,
              settleResult: result as unknown as Record<string, unknown>,
            })
            setSettleOpen(false)
            resetBillState()

            void (async () => {
              if (result.printReceipt) {
                try {
                  await printSettlementBill({
                    salesId: result.salesId,
                    orderData: printOrder,
                    settleResult: result as unknown as Record<string, unknown>,
                    meta: {
                      counterNo: getPosSession().counterNo,
                      companyName: 'MOIF TECHNOLOGY',
                    },
                  })
                  showSnackbar(`Settled bill #${result.billNo} — printing…`, 'success')
                } catch (e) {
                  showSnackbar(
                    e instanceof Error
                      ? `Settled #${result.billNo} but print failed: ${e.message}`
                      : `Settled #${result.billNo} but print failed`,
                    'warning',
                  )
                }
              } else {
                showSnackbar(`Settled bill #${result.billNo}`, 'success')
              }
            })()
          }}
        />
      )}

      <JobListDialog
        open={jobListOpen}
        onClose={() => setJobListOpen(false)}
        onInvoice={handleLoadJobInvoice}
      />

      <NavDrawer
        open={navDrawerOpen}
        onClose={() => setNavDrawerOpen(false)}
        staffName={session.staffName || 'Admin'}
        onSelectItem={handleNavSelect}
        onCounterClose={() => setCounterCloseOpen(true)}
      />

      <CounterCloseDialog
        open={counterCloseOpen}
        onClose={() => setCounterCloseOpen(false)}
        isAdmin
      />

      <GroupDetailsModal
        open={groupEntryOpen}
        onClose={() => setGroupEntryOpen(false)}
        onSaved={() => {
          setGroupEntryOpen(false)
          showSnackbar('Group saved', 'success')
        }}
        onError={(msg: string) => showSnackbar(msg, 'error')}
      />
      <SubGroupDetailsModal
        open={subGroupEntryOpen}
        onClose={() => setSubGroupEntryOpen(false)}
        onSaved={() => {
          setSubGroupEntryOpen(false)
          showSnackbar('Sub group saved', 'success')
        }}
        onError={(msg: string) => showSnackbar(msg, 'error')}
      />
      <ProductDetailsModal
        open={productEntryOpen}
        onClose={() => setProductEntryOpen(false)}
        onSaved={() => {
          setProductEntryOpen(false)
          showSnackbar('Product saved', 'success')
        }}
        onError={(msg: string) => showSnackbar(msg, 'error')}
      />
      <ServiceDetailsModal
        open={serviceEntryOpen}
        onClose={() => setServiceEntryOpen(false)}
        onSaved={() => {
          setServiceEntryOpen(false)
          showSnackbar('Service saved', 'success')
        }}
        onError={(msg: string) => showSnackbar(msg, 'error')}
      />

      <QuickCashPaymentModal
        open={cashModalOpen}
        onClose={() => setCashModalOpen(false)}
        amount={totals.total}
        onComplete={handleCashPaymentComplete}
      />

      <SalesViewerDialog
        open={salesViewerOpen}
        onClose={() => setSalesViewerOpen(false)}
      />

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
        canPrint={billItems.length > 0 || !!lastSettled}
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
        billRef={billNoLabel}
        onComplete={handleQrPaymentComplete}
      />
      {qtyEdit && (
        <NumericKeypadModal
          open
          title="Edit quantity"
          label={qtyEdit.name}
          value={qtyEdit.draft}
          error={qtyEdit.error}
          allowDecimal={false}
          doneLabel="Done"
          onKey={(key) => {
            setQtyEdit((q) => {
              if (!q) return q
              const next = applyNumericKey(q.draft, key, { allowDecimal: false })
              return { ...q, draft: next, error: null }
            })
          }}
          onDone={applyQtyEdit}
          onClose={cancelQtyEdit}
        />
      )}
    </div>
  )
}
