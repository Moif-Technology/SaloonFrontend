import { useCallback, useEffect, useMemo, useState } from 'react'
import PosHeader from '../components/pos/PosHeader'
import StatusStrip from '../components/pos/StatusStrip'
import BillPanel from '../components/pos/BillPanel'
import ServicePanel from '../components/pos/ServicePanel'
import BottomActionBar from '../components/pos/BottomActionBar'
import SettlementDialog from '../components/settlement/SettlementDialog'
import JobListDialog, { type LoadedJobInvoice } from '../components/pos/JobListDialog'
import CounterCloseDialog from '../components/pos/CounterCloseDialog'
import CashInOutModal from '../components/pos/CashInOutModal'
import NavDrawer from '../components/pos/NavDrawer'
import GroupDetailsModal from '../components/pos/GroupDetailsModal'
import SubGroupDetailsModal from '../components/pos/SubGroupDetailsModal'
import ProductDetailsModal from '../components/pos/ProductDetailsModal'
import ServiceDetailsModal from '../components/pos/ServiceDetailsModal'
import SalesViewerDialog from '../components/pos/SalesViewerDialog'
import SalesReportDialog, { type SalesReportKind } from '../components/pos/SalesReportDialog'
import HoldBillModal from '../components/pos/HoldBillModal'
import BillNoteModal from '../components/pos/BillNoteModal'
import CustomerSelectDialog, {
  type SelectedPosCustomer,
} from '../components/pos/CustomerSelectDialog'
import NumericKeypadModal from '../components/common/NumericKeypadModal'
import CustomerListDialog from '../components/pos/CustomerListDialog'
import ProductListDialog from '../components/pos/ProductListDialog'
import GroupListDialog from '../components/pos/GroupListDialog'
import PosSetupDialog from '../components/pos/PosSetupDialog'
import AppointmentListModal from '../components/pos/AppointmentListModal'
import DiscountModal from '../components/pos/DiscountModal'
import PriceChangeModal from '../components/pos/PriceChangeModal'
import PrintOptionsModal, { type ReceiptType } from '../components/pos/PrintOptionsModal'
import AppSettingsDialog from '../components/pos/AppSettingsDialog'
import type { BillItem, HeldBill, Product, ServiceGroup } from '../types/pos'
import type { PaymentMethodLabel, SettleOrderData } from '../types/settlement'
import type { Appointment } from '../types/appointment'
import type { NavMenuItem } from '../data/navMenu'
import {
  type AppliedDiscount,
  computeDiscountAmount,
} from '../types/discount'
import { useSnackbar } from '../context/SnackbarContext'
import { useReturnToPinLogin } from '../components/SessionGate'
import { useIdleLogoutWhenEmpty } from '../hooks/useIdleLogoutWhenEmpty'
import { apiService } from '../api/apiService'
import { SessionManager } from '../utils/sessionManager'
import {
  buildJobSavePayload,
  buildOrderData,
  mergeJobSaveLines,
} from '../utils/buildOrderData'
import { getPosSession } from '../utils/posSession'
import { isPosAdmin } from '../utils/posAdmin'
import { mapGroupRow, mapProductRow } from '../utils/catalogueMapper'
import {
  loadLastSettledBill,
  saveLastSettledBill,
} from '../utils/lastSettledBill'
import { computeBillTotals } from '../lib/discountCalc'
import {
  billFromSettleResult,
  printBillFromData,
  printSettlementBill,
} from '../lib/printBillReceipt'
import { receiptPrintMeta, loadReceiptSettings } from '../utils/receiptSettings'
import { openCashDrawer, openCashDrawerIfNeeded } from '../lib/cashDrawer'
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
  const returnToPinLogin = useReturnToPinLogin()
  const [now, setNow] = useState(new Date())
  const [billItems, setBillItems] = useState<BillItem[]>([])

  // Lock to PIN after 1 min idle when the bill grid is empty
  useIdleLogoutWhenEmpty({
    enabled: billItems.length === 0,
    idleMs: 60_000,
    onIdle: returnToPinLogin,
  })

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
  const [cashInOutOpen, setCashInOutOpen] = useState(false)
  const [navDrawerOpen, setNavDrawerOpen] = useState(false)
  const [groupEntryOpen, setGroupEntryOpen] = useState(false)
  const [subGroupEntryOpen, setSubGroupEntryOpen] = useState(false)
  const [productEntryOpen, setProductEntryOpen] = useState(false)
  const [serviceEntryOpen, setServiceEntryOpen] = useState(false)
  const [productEditInitial, setProductEditInitial] = useState<import('../types/product').CatalogueProduct | null>(null)
  const [customerListOpen, setCustomerListOpen] = useState(false)
  const [productListOpen, setProductListOpen] = useState(false)
  const [groupListOpen, setGroupListOpen] = useState(false)
  const [posSetupOpen, setPosSetupOpen] = useState(false)
  const [salesViewerOpen, setSalesViewerOpen] = useState(false)
  const [salesReportKind, setSalesReportKind] = useState<SalesReportKind | null>(null)
  const [lastSettled, setLastSettled] = useState<{
    salesId: string | number
    orderData: SettleOrderData
    settleResult: Record<string, unknown>
  } | null>(() => {
    const saved = loadLastSettledBill()
    if (!saved) return null
    return {
      salesId: saved.salesId,
      orderData: saved.orderData,
      settleResult: saved.settleResult,
    }
  })

  const [discountModalOpen, setDiscountModalOpen] = useState(false)
  const [customerSelectOpen, setCustomerSelectOpen] = useState(false)
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [holdModalOpen, setHoldModalOpen] = useState(false)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [appSettingsOpen, setAppSettingsOpen] = useState(false)
  const [billNote, setBillNote] = useState('')
  const [heldBills, setHeldBills] = useState<HeldBill[]>([])
  const [billSeq, setBillSeq] = useState(123)
  const [customerLabel, setCustomerLabel] = useState('Walk-in')
  const [customerId, setCustomerId] = useState(0)
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
  const [priceEdit, setPriceEdit] = useState<{
    product: Product
    draft: string
    error: string | null
  } | null>(null)
  const [linePriceEditId, setLinePriceEditId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectionMode = selectedIds.size > 0
  const linePriceEditItem = useMemo(
    () => billItems.find((i) => i.id === linePriceEditId) ?? null,
    [billItems, linePriceEditId],
  )

  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [catalogueLoading, setCatalogueLoading] = useState(true)
  const [catalogueError, setCatalogueError] = useState<string | null>(null)

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

    if (item.id === 'logout' || item.id === 'lock-screen') {
      returnToPinLogin()
      return
    }
    if (item.action === 'group-entry') {
      setGroupEntryOpen(true)
      return
    }
    if (item.action === 'group-list' || item.id === 'group-list') {
      setGroupListOpen(true)
      return
    }
    if (item.action === 'pos-setup' || item.id === 'pos-setup') {
      if (!isPosAdmin()) {
        showSnackbar('Only admin can open POS Setup', 'warning')
        return
      }
      setPosSetupOpen(true)
      return
    }
    if (item.action === 'sub-group-entry') {
      setSubGroupEntryOpen(true)
      return
    }
    if (item.action === 'product-entry') {
      setProductEditInitial(null)
      setProductEntryOpen(true)
      return
    }
    if (item.action === 'service-entry') {
      setServiceEntryOpen(true)
      return
    }
    if (item.action === 'customer-list' || item.id === 'customer-list') {
      setCustomerListOpen(true)
      return
    }
    if (item.action === 'product-list' || item.id === 'product-list') {
      setProductListOpen(true)
      return
    }
    if (item.action === 'sales-viewer' || item.id === 'sales-viewer') {
      setSalesViewerOpen(true)
      return
    }
    if (item.action === 'salesman-wise-report' || item.id === 'salesman-wise-report') {
      setSalesReportKind('salesman')
      return
    }
    if (item.action === 'item-wise-report' || item.id === 'item-wise-report') {
      setSalesReportKind('item')
      return
    }
    if (item.action === 'group-wise-report' || item.id === 'group-wise-report') {
      setSalesReportKind('group')
      return
    }
    if (item.action === 'cash-in-out' || item.id === 'cash-in-out') {
      setCashInOutOpen(true)
      return
    }
    if (item.action === 'counter-close' || item.id === 'counter-close') {
      setCounterCloseOpen(true)
      return
    }

    showSnackbar(`${item.label} coming soon`, 'info')
  }

  function handleOpenQuickCash() {
    if (billItems.length === 0) {
      showSnackbar('Add items before quick cash', 'warning')
      return
    }
    void directSettle('Cash')
  }

  function handleEditQty(id: string) {
    const item = billItems.find((i) => i.id === id)
    if (!item) return
    openQtyEdit(item)
  }

  function openLinePriceEdit(id: string) {
    const item = billItems.find((i) => i.id === id)
    if (!item) return
    setLinePriceEditId(id)
  }

  function handleOpenPriceChange() {
    if (billItems.length === 0) {
      showSnackbar('Add items before changing price', 'warning')
      return
    }
    if (selectedIds.size === 1) {
      const id = selectedIds.values().next().value as string
      openLinePriceEdit(id)
      return
    }
    if (selectedIds.size > 1) {
      showSnackbar('Select one item for price change', 'warning')
      return
    }
    // No selection — use the most recently added line (top of bill)
    openLinePriceEdit(billItems[0].id)
  }

  async function handleOpenCashDrawer() {
    const opened = await openCashDrawer()
    if (opened) {
      showSnackbar('Cash drawer opened', 'success')
    } else {
      showSnackbar('Cash drawer only works on the POS device', 'warning')
    }
  }

  function applyLinePriceChange(itemId: string, newPrice: number) {
    setBillItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, price: newPrice } : item)),
    )
    setLinePriceEditId(null)
    showSnackbar('Price updated', 'success')
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
    void loadReceiptSettings().catch(() => {
      /* headings load when POS Setup opens or after next login */
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, [])

  const loadCatalogue = useCallback(async () => {
    setCatalogueLoading(true)
    setCatalogueError(null)
    try {
      const [groupRows, productRows] = await Promise.all([
        apiService.fetchGroups(),
        apiService.fetchProducts({ limit: 2000 }),
      ])

      const groups = [...groupRows]
        .sort((a, b) => {
          const sa = Number(a.SortOrder ?? a.sortOrder ?? 0)
          const sb = Number(b.SortOrder ?? b.sortOrder ?? 0)
          if (sa !== sb) return sa - sb
          return String(a.GroupDescription ?? '').localeCompare(
            String(b.GroupDescription ?? ''),
          )
        })
        .map((row, i) => mapGroupRow(row, i))
        .filter((g) => g.id && g.id !== '0')

      const products = productRows
        .map((row, i) => mapProductRow(row, i))
        .filter((p): p is Product => p != null)

      setServiceGroups(groups)
      setAllProducts(products)
      setActiveGroup(null)
    } catch (e) {
      setCatalogueError(e instanceof Error ? e.message : 'Failed to load catalogue')
      setServiceGroups([])
      setAllProducts([])
    } finally {
      setCatalogueLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCatalogue()
  }, [loadCatalogue])

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
    [activeGroup, allProducts],
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

  function addProductToBill(product: Product, unitPrice: number, opts?: { forceNewLine?: boolean }) {
    if (billItems.length === 0) setBillStartedAt(new Date())
    setBillItems((prev) => {
      // Open-price (catalogue price 0): always a new line — never bump qty.
      if (!opts?.forceNewLine) {
        const existing = prev.find((item) => item.productId === product.id)
        if (existing) {
          const updated = {
            ...existing,
            qty: existing.qty + 1,
            price: existing.price > 0 ? existing.price : unitPrice,
          }
          return [updated, ...prev.filter((item) => item.productId !== product.id)]
        }
      }
      return [
        {
          id: `bill-${product.id}-${Date.now()}`,
          productId: product.id,
          name: product.name,
          qty: 1,
          price: unitPrice,
          groupId: Number(product.groupId) || 0,
          taxRate: product.taxRate ?? 0,
          lineType: product.lineType,
          stylistId: getPosSession().staffId || undefined,
        },
        ...prev,
      ]
    })
  }

  function handleSelectProduct(product: Product) {
    // Zero-price catalogue items: always ask for price (never auto-increment qty).
    if (!(Number(product.price) > 0)) {
      setPriceEdit({ product, draft: '', error: null })
      return
    }
    addProductToBill(product, product.price)
  }

  function applyPriceEdit() {
    if (!priceEdit) return
    const n = Number(priceEdit.draft)
    if (!Number.isFinite(n) || n <= 0) {
      const message = 'Enter a price greater than 0'
      showSnackbar(message, 'error')
      setPriceEdit((p) => (p ? { ...p, error: message } : p))
      return
    }
    const product = priceEdit.product
    setPriceEdit(null)
    addProductToBill(product, n, { forceNewLine: true })
  }

  function cancelPriceEdit() {
    setPriceEdit(null)
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
    setLinePriceEditId((cur) => (cur === id ? null : cur))
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
    setCustomerId(0)
    setActiveAppointmentId(null)
    setSelectedIds(new Set())
    setLinePriceEditId(null)
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
    if (!SessionManager.accessToken) {
      throw new Error('Not logged in. Complete PIN login first so a POS token is stored.')
    }

    // Create new job, or append new lines + sync discount onto a loaded job.
    // (Previously returned early when jobId > 0, so updates were never saved.)
    const payload = buildJobSavePayload(items, {
      customerId,
      jobId: jobId > 0 ? jobId : undefined,
      discountAmount,
    })
    const result = await apiService.saveKot(payload)
    const newId = Number(
      result.CurrentKOTID ?? result.currentJobId ?? result.jobId ?? jobId ?? 0,
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
      nextItems = mergeJobSaveLines(items, lines as Record<string, unknown>[], newId)
      setBillItems(nextItems)
    }

    const newNo = result.jobNo ? String(result.jobNo) : jobNo
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
        customerId,
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

  function rememberSettled(opts: {
    salesId: string | number
    billNo?: string | number
    orderData: SettleOrderData
    settleResult: Record<string, unknown>
  }) {
    setLastSettled({
      salesId: opts.salesId,
      orderData: opts.orderData,
      settleResult: opts.settleResult,
    })
    saveLastSettledBill({
      salesId: opts.salesId,
      billNo: opts.billNo,
      orderData: opts.orderData,
      settleResult: opts.settleResult,
    })
  }

  /** Quick Cash / Card — Cash auto-prints receipt and opens drawer. */
  async function directSettle(method: 'Cash' | 'Card') {
    if (billItems.length === 0 || settleBusy) return
    setSettleBusy(true)
    try {
      const saved = await ensureJobSaved(billItems)
      const data = buildOrderData({
        billItems: saved.items,
        jobId: saved.jobId,
        jobNo: saved.jobNo,
        discountAmount,
        customerId,
        customerName: customerLabel || 'Walk-in',
      })

      const paymentMode = method === 'Card' ? 'CREDITCARD' : 'CASH'

      const payload: SettleOrderData = {
        ...data,
        paymentMode,
        paidAmount: data.netAmount,
      }

      const result = await apiService.saveSettlement(
        payload as unknown as Record<string, unknown>,
      )

      rememberSettled({
        salesId: String(result.salesId ?? ''),
        billNo: result.billNo != null ? String(result.billNo) : undefined,
        orderData: payload,
        settleResult: result as unknown as Record<string, unknown>,
      })

      if (method === 'Cash') {
        try {
          await printSettlementBill({
            salesId: String(result.salesId ?? ''),
            orderData: payload,
            settleResult: result as unknown as Record<string, unknown>,
          })
        } catch (e) {
          showSnackbar(e instanceof Error ? e.message : 'Bill print failed', 'warning')
        }
        await openCashDrawerIfNeeded('CASH', payload.paymentSplits)
      }

      resetBillState()

      showSnackbar(
        `Bill #${result.billNo} settled (${paymentMode})`,
        'success',
      )
      returnToPinLogin()
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
      returnToPinLogin()
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Save bill failed', 'error')
    }
  }

  function handleLoadJobInvoice(loaded: LoadedJobInvoice) {
    setBillItems(loaded.items)
    setJobId(loaded.jobId)
    setJobNo(loaded.jobNo)
    setBillStartedAt(loaded.startedAt ?? new Date())
    const disc = Number(loaded.billDiscount) || 0
    setAppliedDiscount(disc > 0 ? { mode: 'flat', value: disc } : null)
    setOrderData(null)
    setCustomerLabel(loaded.customerName || 'Walk-in')
    setCustomerId(Number(loaded.customerId) || 0)
    showSnackbar(
      `Loaded job${loaded.jobNo ? ` #${loaded.jobNo}` : ''} — add items / discount then Save or Settle`,
      'success',
    )
  }

  async function handleBillPrint() {
    const meta = receiptPrintMeta({
      counterNo: getPosSession().counterNo,
    })

    try {
      if (billItems.length > 0) {
        const data =
          orderData ??
          buildOrderData({
            billItems,
            jobId,
            jobNo,
            discountAmount,
            customerId,
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
    void directSettle('Card')
  }

  async function handleBillPrintLast() {
    const meta = receiptPrintMeta({
      counterNo: getPosSession().counterNo,
    })

    try {
      const saved = lastSettled ?? (() => {
        const fromStore = loadLastSettledBill()
        if (!fromStore) return null
        return {
          salesId: fromStore.salesId,
          orderData: fromStore.orderData,
          settleResult: fromStore.settleResult,
        }
      })()

      if (saved?.salesId) {
        await printSettlementBill({
          salesId: saved.salesId,
          orderData: saved.orderData,
          settleResult: saved.settleResult,
          meta,
        })
        showSnackbar('Printing last invoice…', 'success')
        return
      }

      // Fallback: latest bill for this counter today from sales viewer
      const today = new Date()
      const yyyy = today.getFullYear()
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const dd = String(today.getDate()).padStart(2, '0')
      const dateKey = `${yyyy}-${mm}-${dd}`
      const bills = await apiService.fetchSalesViewer({
        dateFrom: dateKey,
        dateTo: dateKey,
        counterNo: getPosSession().counterNo,
      })
      const latest = bills[0]
      const salesId = String(
        latest?.salesId ?? latest?.SalesID ?? latest?.sales_id ?? '',
      ).trim()
      if (!salesId) {
        showSnackbar('No invoice found for this counter', 'warning')
        return
      }
      await printSettlementBill({ salesId, meta })
      showSnackbar('Printing last invoice…', 'success')
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Print failed', 'error')
    }
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
      customerId,
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
    setCustomerId(Number(bill.customerId) || 0)
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
    setCustomerSelectOpen(true)
  }

  function handleCustomerSelect(customer: SelectedPosCustomer | null) {
    if (!customer) {
      setCustomerLabel('Walk-in')
      setCustomerId(0)
      showSnackbar('Walk-in customer', 'info')
      return
    }
    const id = Number(customer.id) || 0
    setCustomerId(id)
    setCustomerLabel(customer.name || 'Customer')
    showSnackbar(
      customer.mobile
        ? `Customer: ${customer.name} (${customer.mobile})`
        : `Customer: ${customer.name}`,
      'success',
    )
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
    setCustomerId(Number(appt.customerId) || 0)
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
          onMore={() => setAppSettingsOpen(true)}
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
            onEditPrice={openLinePriceEdit}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onEnterSelection={handleEnterSelection}
            onToggleSelect={handleToggleSelect}
            onCancelSelection={handleCancelSelection}
            onDeleteSelected={handleDeleteSelected}
          />
        </aside>

        <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {catalogueLoading ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-white/40 bg-white/40 text-salon-muted font-semibold">
              Loading catalogue…
            </div>
          ) : catalogueError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-white/40 bg-white/40 p-6 text-center">
              <p className="text-salon-danger font-semibold">{catalogueError}</p>
              <button
                type="button"
                className="h-10 px-4 rounded-lg bg-salon-primary text-white font-bold"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : (
            <ServicePanel
              groups={serviceGroups}
              products={groupProducts}
              activeGroup={activeGroup}
              onSelectGroup={setActiveGroup}
              onSelectProduct={handleSelectProduct}
              onBack={() => setActiveGroup(null)}
            />
          )}
        </section>
      </main>

      <footer className="shrink-0 border-t border-white/40 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_-4px_24px_rgba(31,17,20,0.06)] backdrop-blur-2xl">
        <BottomActionBar
          settlementDisabled={billItems.length === 0 || settleBusy}
          onDiscount={handleOpenDiscount}
          onPriceChange={handleOpenPriceChange}
          onOpenCashDrawer={() => void handleOpenCashDrawer()}
          onNote={handleOpenNote}
          onCustomer={handleOpenCustomer}
          onAppointment={handleOpenAppointments}
          onHoldBill={handleOpenHoldBills}
          onSaveBill={() => void handleSaveBill()}
          onQuickCash={handleOpenQuickCash}
          onCard={handleOpenCard}
          onBillPrintLast={() => void handleBillPrintLast()}
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
          onSuccess={async (result) => {
            const printOrder = result.settledOrder
            rememberSettled({
              salesId: result.salesId,
              billNo: result.billNo,
              orderData: printOrder,
              settleResult: result as unknown as Record<string, unknown>,
            })
            setSettleOpen(false)
            resetBillState()
            showSnackbar(`Settled bill #${result.billNo}`, 'success')

            if (result.printReceipt) {
              try {
                await printSettlementBill({
                  salesId: result.salesId,
                  orderData: printOrder,
                  settleResult: result as unknown as Record<string, unknown>,
                })
              } catch (e) {
                showSnackbar(e instanceof Error ? e.message : 'Bill print failed', 'warning')
              }
            }

            await openCashDrawerIfNeeded(
              result.paymentMode ?? printOrder.paymentMode,
              printOrder.paymentSplits,
            )

            returnToPinLogin()
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
        onCashInOut={() => setCashInOutOpen(true)}
      />

      <CashInOutModal
        open={cashInOutOpen}
        onClose={() => setCashInOutOpen(false)}
        onSaved={(msg) => showSnackbar(msg, 'success')}
        onError={(msg) => showSnackbar(msg, 'error')}
      />

      <CounterCloseDialog
        open={counterCloseOpen}
        onClose={() => setCounterCloseOpen(false)}
        isAdmin={isPosAdmin()}
      />

      <GroupDetailsModal
        open={groupEntryOpen}
        onClose={() => setGroupEntryOpen(false)}
        onSaved={() => {
          setGroupEntryOpen(false)
          showSnackbar('Group saved', 'success')
          void loadCatalogue()
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
        initialProduct={productEditInitial}
        onClose={() => {
          setProductEntryOpen(false)
          setProductEditInitial(null)
        }}
        onSaved={() => {
          setProductEntryOpen(false)
          setProductEditInitial(null)
          showSnackbar(productEditInitial ? 'Product updated' : 'Product saved', 'success')
          void loadCatalogue()
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

      <CustomerListDialog
        open={customerListOpen}
        onClose={() => setCustomerListOpen(false)}
        onError={(msg) => showSnackbar(msg, 'error')}
        onInfo={(msg) => showSnackbar(msg, 'success')}
      />
      <ProductListDialog
        open={productListOpen}
        onClose={() => setProductListOpen(false)}
        onError={(msg) => showSnackbar(msg, 'error')}
        onInfo={(msg) => showSnackbar(msg, 'success')}
        onCatalogueChanged={() => void loadCatalogue()}
      />

      <GroupListDialog
        open={groupListOpen}
        onClose={() => setGroupListOpen(false)}
        onError={(msg) => showSnackbar(msg, 'error')}
        onInfo={(msg) => showSnackbar(msg, 'success')}
        onCatalogueChanged={() => void loadCatalogue()}
      />

      <PosSetupDialog
        open={posSetupOpen}
        onClose={() => setPosSetupOpen(false)}
        onError={(msg) => showSnackbar(msg, 'error')}
        onSaved={(msg) => showSnackbar(msg, 'success')}
      />

      <SalesViewerDialog
        open={salesViewerOpen}
        onClose={() => setSalesViewerOpen(false)}
      />

      <SalesReportDialog
        open={salesReportKind != null}
        kind={salesReportKind ?? 'salesman'}
        onClose={() => setSalesReportKind(null)}
      />

      <CustomerSelectDialog
        open={customerSelectOpen}
        onClose={() => setCustomerSelectOpen(false)}
        onSelect={handleCustomerSelect}
        onError={(msg: string) => showSnackbar(msg, 'error')}
        onInfo={(msg) => showSnackbar(msg, 'success')}
        selectedId={customerId > 0 ? String(customerId) : null}
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
      <AppSettingsDialog
        open={appSettingsOpen}
        onClose={() => setAppSettingsOpen(false)}
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
      {priceEdit && (
        <NumericKeypadModal
          open
          title="Enter Price"
          label={priceEdit.product.name}
          value={priceEdit.draft}
          error={priceEdit.error}
          placeholder="0.00"
          allowDecimal
          doneLabel="Add"
          leftExtra={
            <p className="mt-3 text-sm text-salon-muted">
              This item has no set price. Enter the unit price to add it to the bill.
            </p>
          }
          onKey={(key) => {
            setPriceEdit((p) => {
              if (!p) return p
              const next = applyNumericKey(p.draft, key, {
                allowDecimal: true,
                maxDecimalPlaces: 2,
              })
              return { ...p, draft: next, error: null }
            })
          }}
          onDone={applyPriceEdit}
          onClose={cancelPriceEdit}
        />
      )}
      <PriceChangeModal
        open={!!linePriceEditItem}
        item={linePriceEditItem}
        onClose={() => setLinePriceEditId(null)}
        onApply={applyLinePriceChange}
      />
    </div>
  )
}
