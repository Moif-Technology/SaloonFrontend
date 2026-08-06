/**
 * POS API client — ported from Saloon-POS `lib/services/api_service.dart`.
 * Same endpoints / path layout: `{baseURL}{posBasePath}/...` and `/api/...`.
 */
import axios, { type AxiosRequestConfig } from 'axios'
import { apiUrl, salonPosUrl } from '../config/apiConfig'
import { clearStaffSession } from '../utils/pinLoginSession'
import { SessionManager } from '../utils/sessionManager'
import { getPosSession } from '../utils/posSession'
import { productRowForPos } from '../utils/catalogueMapper'

function httpErrorMessage(prefix: string, status: number, body: unknown): string {
  if (body && typeof body === 'object' && body !== null && 'message' in body) {
    return `${prefix}: ${String((body as { message: unknown }).message)}`
  }
  if (typeof body === 'string' && body.trim()) {
    const trimmed = body.trim()
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
      return `${prefix}: server returned HTML (HTTP ${status}). Check API URL.`
    }
    const snippet = trimmed.length > 160 ? `${trimmed.slice(0, 160)}…` : trimmed
    return `${prefix}: ${snippet}`
  }
  return `${prefix} (HTTP ${status})`
}

function hasBearerAuth(headers?: Record<string, string>): boolean {
  const a = headers?.Authorization ?? headers?.authorization
  return typeof a === 'string' && a.toLowerCase().startsWith('bearer ')
}

async function request<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  opts?: {
    body?: unknown
    headers?: Record<string, string>
    params?: Record<string, string | number | undefined>
    timeout?: number
    /** Skip auto PIN re-login on 401 (used by session probe / pin-login). */
    skipAuthRetry?: boolean
  },
): Promise<{ status: number; data: T }> {
  const config: AxiosRequestConfig = {
    method,
    url,
    headers: opts?.headers,
    params: opts?.params,
    data: opts?.body,
    timeout: opts?.timeout ?? 20_000,
    validateStatus: () => true,
  }
  const res = await axios.request<T>(config)

  // Access tokens expire — return to PIN login (enrollment kept).
  if (
    res.status === 401 &&
    !opts?.skipAuthRetry &&
    hasBearerAuth(opts?.headers) &&
    !url.includes('/pin-login')
  ) {
    clearStaffSession()
    // Soft reload so SessionGate shows the PIN screen.
    window.setTimeout(() => window.location.reload(), 0)
  }

  return { status: res.status, data: res.data }
}

class ApiService {
  private bearerHeaders(): Record<string, string> {
    const t = SessionManager.accessToken?.trim()
    if (!t) throw new Error('Not logged in.')
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${t}`,
    }
  }

  private sessionHeaders(): Record<string, string> {
    const { stationId, staffName, staffID } = SessionManager
    if (!stationId || !staffName || !staffID) {
      throw new Error('Missing session (stationId / staffName / staffID).')
    }
    const h = this.bearerHeaders()
    return {
      ...h,
      stationId,
      staffName,
      staffID,
    }
  }

  private branchId(): number {
    const n = Number(SessionManager.stationId?.trim() ?? '')
    if (!Number.isFinite(n) || n < 1) throw new Error('Invalid branch (stationId).')
    return n
  }

  // ── Auth (public) ─────────────────────────────────────────────────────────

  async login(login: string, password: string): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>('POST', salonPosUrl('/login'), {
      body: { login, password },
      headers: { 'Content-Type': 'application/json' },
    })
    if (status === 200 && data && typeof data === 'object') return data
    throw new Error(httpErrorMessage('Login failed', status, data))
  }

  async pinLogin(opts: {
    pin: string
    companyId: number
    staffId?: number
    deviceToken: string
  }): Promise<Record<string, unknown>> {
    const body: Record<string, unknown> = {
      pin: opts.pin,
      companyId: opts.companyId,
      deviceToken: opts.deviceToken,
    }
    if (opts.staffId != null) body.staffId = opts.staffId
    const { status, data } = await request<Record<string, unknown>>(
      'POST',
      salonPosUrl('/pin-login'),
      {
        body,
        headers: { 'Content-Type': 'application/json' },
        skipAuthRetry: true,
      },
    )
    if (status === 200 && data && typeof data === 'object') return data
    throw new Error(httpErrorMessage('PIN login failed', status, data))
  }

  async fetchPosStaffList(deviceToken: string): Promise<Record<string, unknown>[]> {
    const { status, data } = await request<Record<string, unknown>>(
      'POST',
      salonPosUrl('/staff-list'),
      {
        body: { deviceToken },
        headers: { 'Content-Type': 'application/json' },
      },
    )
    if (status === 200 && data && Array.isArray(data.staff)) {
      return data.staff as Record<string, unknown>[]
    }
    return []
  }

  async enrollListStations(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>(
      'POST',
      salonPosUrl('/device/stations'),
      { body, headers: { 'Content-Type': 'application/json' } },
    )
    if (status >= 200 && status < 300 && data) return data
    throw new Error(httpErrorMessage('Failed to list stations', status, data))
  }

  async enrollDevice(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>(
      'POST',
      salonPosUrl('/device/enroll'),
      { body, headers: { 'Content-Type': 'application/json' } },
    )
    if (status >= 200 && status < 300 && data) return data
    throw new Error(httpErrorMessage('Device enroll failed', status, data))
  }

  async fetchCurrentSession(): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>('GET', apiUrl('/api/auth/me'), {
      headers: this.bearerHeaders(),
      skipAuthRetry: true,
    })
    if (status === 401) throw new Error('Unauthorized.')
    if (status === 403) throw new Error(httpErrorMessage('Forbidden', status, data))
    if (status !== 200) throw new Error(httpErrorMessage('Failed to refresh session', status, data))
    if (!data?.session || typeof data.session !== 'object') {
      throw new Error('session refresh: expected session object')
    }
    return data.session as Record<string, unknown>
  }

  async fetchParameters(): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>(
      'GET',
      salonPosUrl('/parameters'),
      { headers: this.sessionHeaders() },
    )
    if (status !== 200) throw new Error(httpErrorMessage('Failed to fetch parameters', status, data))
    if (data?.success === true && data.data && typeof data.data === 'object') {
      return data.data as Record<string, unknown>
    }
    throw new Error(
      `Failed: ${typeof data === 'object' && data && 'message' in data ? data.message : data}`,
    )
  }

  async saveCompanyDetails(body: {
    heading1?: string
    heading2?: string
    heading3?: string
    heading4?: string
    heading5?: string
    footer1?: string
    footer2?: string
    taxRegNo?: string
  }): Promise<void> {
    const { status, data } = await request<Record<string, unknown>>(
      'PUT',
      salonPosUrl('/parameters/company-details'),
      { headers: this.bearerHeaders(), body },
    )
    if (status < 200 || status >= 300) {
      throw new Error(httpErrorMessage('Failed to save company details', status, data))
    }
  }

  async fetchPrivileges(): Promise<Record<string, unknown>[]> {
    const { status, data } = await request<Record<string, unknown>>(
      'GET',
      salonPosUrl('/privileges'),
      { headers: this.bearerHeaders() },
    )
    if (status === 401) throw new Error('Unauthorized.')
    if (status !== 200) throw new Error(httpErrorMessage('Failed to load privileges', status, data))
    const list = data?.privileges
    if (!Array.isArray(list)) return []
    return list as Record<string, unknown>[]
  }

  // ── Catalogue (shared /api/* — same as Saloon-POS) ────────────────────────

  async fetchGroups(): Promise<Record<string, unknown>[]> {
    const { status, data } = await request<Record<string, unknown>>('GET', apiUrl('/api/groups'), {
      headers: this.bearerHeaders(),
      params: { branchId: this.branchId() },
    })
    if (status === 401) throw new Error('Unauthorized.')
    if (status !== 200) throw new Error(httpErrorMessage('Failed to load groups', status, data))
    const list = data?.groups
    if (!Array.isArray(list)) return []
    return list.map((e) => this.groupRowForPos(e))
  }

  groupRowForPos(raw: unknown): Record<string, unknown> {
    if (!raw || typeof raw !== 'object') {
      return { GroupID: '0', GroupDescription: '', GroupDescriptionArabic: '' }
    }
    const m = raw as Record<string, unknown>
    const gid = m.groupId ?? m.GroupID ?? 0
    const desc = String(m.groupDescription ?? m.GroupDescription ?? '').trim()
    const code = String(m.groupCode ?? m.GroupCode ?? '').trim()
    const display = desc || code || `Group ${gid}`
    return {
      GroupID: `${gid}`,
      GroupCode: code,
      GroupDescription: display,
      GroupDescriptionArabic: String(m.groupDescriptionArabic ?? m.GroupDescriptionArabic ?? ''),
      KeyShift: m.keyShift ?? m.KeyShift ?? '',
      KeyCode: m.keyCode ?? m.KeyCode ?? '',
      RStatus: String(m.rStatus ?? m.RStatus ?? 'ACTIVE'),
    }
  }

  async createGroup(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>(
      'POST',
      apiUrl('/api/groups'),
      {
        headers: this.bearerHeaders(),
        body: { ...body, branchId: body.branchId ?? this.branchId() },
      },
    )
    if (status >= 200 && status < 300 && data && typeof data === 'object') {
      return (data.group as Record<string, unknown>) ?? data
    }
    throw new Error(httpErrorMessage('Create group failed', status, data))
  }

  async updateGroup(
    groupId: string | number,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>(
      'PATCH',
      apiUrl(`/api/groups/${encodeURIComponent(String(groupId))}`),
      {
        headers: this.bearerHeaders(),
        body: { ...body, branchId: body.branchId ?? this.branchId() },
      },
    )
    if (status >= 200 && status < 300 && data && typeof data === 'object') {
      return (data.group as Record<string, unknown>) ?? data
    }
    throw new Error(httpErrorMessage('Update group failed', status, data))
  }

  async deleteGroup(groupId: string | number): Promise<void> {
    const { status, data } = await request<Record<string, unknown>>(
      'DELETE',
      apiUrl(`/api/groups/${encodeURIComponent(String(groupId))}`),
      {
        headers: this.bearerHeaders(),
        body: { branchId: this.branchId() },
      },
    )
    if (status >= 200 && status < 300) return
    throw new Error(httpErrorMessage('Delete group failed', status, data))
  }

  async fetchProducts(opts?: {
    groupId?: string | number
    search?: string
    limit?: number
  }): Promise<Record<string, unknown>[]> {
    const params: Record<string, string | number | undefined> = {
      branchId: this.branchId(),
      limit: opts?.limit ?? 2000,
    }
    if (opts?.groupId != null && String(opts.groupId)) params.groupId = String(opts.groupId)
    if (opts?.search?.trim()) params.search = opts.search.trim()

    const { status, data } = await request<Record<string, unknown>>('GET', apiUrl('/api/products'), {
      headers: this.bearerHeaders(),
      params,
    })
    if (status === 401) throw new Error('Unauthorized.')
    if (status !== 200) throw new Error(httpErrorMessage('Failed to load products', status, data))
    const list = data?.products
    if (!Array.isArray(list)) return []
    return list.map((e) => productRowForPos(e))
  }

  async fetchCustomers(opts?: { limit?: number; search?: string }): Promise<Record<string, unknown>[]> {
    const params: Record<string, string | number | undefined> = {
      limit: Math.min(Math.max(opts?.limit ?? 400, 1), 2000),
    }
    if (opts?.search?.trim()) params.search = opts.search.trim()

    const { status, data } = await request<Record<string, unknown>>('GET', apiUrl('/api/customers'), {
      headers: this.bearerHeaders(),
      params,
    })
    if (status === 401) throw new Error('Unauthorized.')
    if (status === 503 || status === 404) return []
    if (status !== 200) throw new Error(httpErrorMessage('Failed to load customers', status, data))
    const list = data?.customers
    if (!Array.isArray(list)) return []
    return list.map((e) => this.customerRowForPos(e))
  }

  customerRowForPos(raw: unknown): Record<string, unknown> {
    if (!raw || typeof raw !== 'object') {
      return { CustomerID: '0', CustomerName: '', CustomerCode: '' }
    }
    const m = raw as Record<string, unknown>
    return {
      CustomerID: String(m.customerId ?? m.CustomerID ?? ''),
      CustomerName: String(m.customerName ?? m.CustomerName ?? ''),
      CustomerCode: String(m.customerCode ?? m.CustomerCode ?? ''),
      MobileNo: String(m.mobileNo ?? m.MobileNo ?? ''),
      Telephone: String(m.telephone ?? m.Telephone ?? ''),
      Address: String(m.address ?? m.Address ?? ''),
      email: String(m.email ?? m.Email ?? ''),
      CustTRN: String(m.taxRegNo ?? m.CustTRN ?? ''),
      creditStatus: String(m.creditStatus ?? 'ACTIVE'),
    }
  }

  async createCustomer(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>(
      'POST',
      apiUrl('/api/customers'),
      { headers: this.bearerHeaders(), body },
    )
    if (status >= 200 && status < 300 && data && typeof data === 'object') {
      return (data.customer as Record<string, unknown>) ?? data
    }
    throw new Error(httpErrorMessage('Create customer failed', status, data))
  }

  async updateCustomer(
    customerId: string | number,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>(
      'PUT',
      apiUrl(`/api/customers/${encodeURIComponent(String(customerId))}`),
      { headers: this.bearerHeaders(), body },
    )
    if (status >= 200 && status < 300 && data && typeof data === 'object') {
      return (data.customer as Record<string, unknown>) ?? data
    }
    throw new Error(httpErrorMessage('Update customer failed', status, data))
  }

  async createProduct(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>(
      'POST',
      apiUrl('/api/products'),
      { headers: this.bearerHeaders(), body },
    )
    if (status >= 200 && status < 300 && data && typeof data === 'object') {
      return (data.product as Record<string, unknown>) ?? data
    }
    throw new Error(httpErrorMessage('Create product failed', status, data))
  }

  async updateProduct(
    productId: string | number,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>(
      'PUT',
      apiUrl(`/api/products/${encodeURIComponent(String(productId))}`),
      { headers: this.bearerHeaders(), body },
    )
    if (status >= 200 && status < 300 && data && typeof data === 'object') {
      return (data.product as Record<string, unknown>) ?? data
    }
    throw new Error(httpErrorMessage('Update product failed', status, data))
  }

  async fetchStaff(): Promise<Record<string, unknown>[]> {
    const { status, data } = await request<Record<string, unknown> | unknown[]>(
      'GET',
      apiUrl('/api/staff/members'),
      { headers: this.bearerHeaders() },
    )
    if (status === 401) throw new Error('Unauthorized.')
    if (status !== 200) throw new Error(httpErrorMessage('Failed to load staff', status, data))
    if (Array.isArray(data)) return data as Record<string, unknown>[]
    if (data && typeof data === 'object' && Array.isArray((data as { members?: unknown }).members)) {
      return (data as { members: Record<string, unknown>[] }).members
    }
    return []
  }

  async verifySupervisor(username: string, password: string): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>(
      'POST',
      salonPosUrl('/supervisor/verify'),
      {
        headers: this.bearerHeaders(),
        body: { username, password },
      },
    )
    if (status >= 200 && status < 300 && data && typeof data === 'object') return data
    throw new Error(httpErrorMessage('Supervisor verify failed', status, data))
  }

  // ── Jobs (KOT analogue) ───────────────────────────────────────────────────

  /** POST `/api/salon-pos/job/save` — same as Saloon-POS `saveKot`. */
  async saveKot(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>(
      'POST',
      salonPosUrl('/job/save'),
      { headers: this.bearerHeaders(), body: payload, timeout: 60_000 },
    )
    if (status === 200 && data && typeof data === 'object') return data
    throw new Error(httpErrorMessage('Job save failed', status, data))
  }

  async fetchOrderList(opts?: {
    areaId?: string
    search?: string
    jobNo?: string
    customerName?: string
    mobile?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<Record<string, unknown>[]> {
    const params: Record<string, string | number | undefined> = {}
    if (opts?.areaId) params.areaId = opts.areaId
    if (opts?.search) params.search = opts.search
    if (opts?.jobNo) params.jobNo = opts.jobNo
    if (opts?.customerName) params.customerName = opts.customerName
    if (opts?.mobile) params.mobile = opts.mobile
    if (opts?.dateFrom) params.dateFrom = opts.dateFrom
    if (opts?.dateTo) params.dateTo = opts.dateTo

    const { status, data } = await request<Record<string, unknown>>('GET', salonPosUrl('/job/list'), {
      headers: this.bearerHeaders(),
      params,
    })
    if (status === 401) throw new Error('Unauthorized.')
    if (status !== 200) throw new Error(httpErrorMessage('Failed to load order list', status, data))
    const list = data?.data
    if (!Array.isArray(list)) return []
    return list as Record<string, unknown>[]
  }

  async fetchKotDetails(kotMasterId: string): Promise<Record<string, unknown>> {
    const id = kotMasterId.trim()
    if (!id) return { success: true, data: [] }
    const { status, data } = await request<Record<string, unknown>>(
      'GET',
      salonPosUrl(`/job/${encodeURIComponent(id)}`),
      { headers: this.bearerHeaders() },
    )
    if (status === 401) throw new Error('Unauthorized.')
    if (status === 404) return { success: false, data: [] }
    if (status !== 200) throw new Error(httpErrorMessage('Failed to load job', status, data))
    if (!data || typeof data !== 'object') throw new Error('Job: expected object')
    return data
  }

  // ── Settlement (bill checkout) ────────────────────────────────────────────

  /**
   * POST `/api/salon-pos/sales/settle`
   * Modes: CASH, CREDITCARD, CREDIT, MULTIPAYMENT, ONLINE, COMPLIMENT
   */
  async saveSettlement(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>(
      'POST',
      salonPosUrl('/sales/settle'),
      { headers: this.bearerHeaders(), body: payload, timeout: 60_000 },
    )

    if (status >= 200 && status < 300 && data && typeof data === 'object') {
      if (data.ok === false) {
        throw new Error(String(data.message ?? 'Settlement rejected'))
      }
      const ok = data.ok === true || data.ok === 1
      const bill = String(data.billNo ?? '').trim()
      const sid = String(data.salesId ?? '').trim()
      if (!ok || !bill || !sid) {
        throw new Error(
          'Settlement was not confirmed by the server (missing bill number). Check API base URL.',
        )
      }
      return data
    }

    throw new Error(httpErrorMessage('Settlement failed', status, data))
  }

  async fetchSalesViewer(opts: {
    dateFrom: string
    dateTo: string
    filter?: string
    search?: string
    customerId?: string
    counterNo?: number | string
  }): Promise<Record<string, unknown>[]> {
    const params: Record<string, string | number | undefined> = {
      dateFrom: opts.dateFrom,
      dateTo: opts.dateTo,
    }
    if (opts.filter?.trim()) params.filter = opts.filter.trim()
    if (opts.search?.trim()) params.q = opts.search.trim()
    if (opts.customerId?.trim()) params.customerId = opts.customerId.trim()
    if (opts.counterNo != null && String(opts.counterNo) !== '') {
      params.counterNo = opts.counterNo
    }

    const { status, data } = await request<Record<string, unknown> | unknown[]>(
      'GET',
      salonPosUrl('/sales/viewer'),
      { headers: this.bearerHeaders(), params },
    )
    if (status < 200 || status >= 300) {
      throw new Error(httpErrorMessage('Failed to load sales viewer', status, data))
    }
    if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.bills)) {
      return data.bills as Record<string, unknown>[]
    }
    if (Array.isArray(data)) return data as Record<string, unknown>[]
    throw new Error('Sales viewer: expected bills list')
  }

  async fetchSalesViewerBill(salesId: string): Promise<Record<string, unknown>> {
    const id = salesId.trim()
    if (!id) throw new Error('salesId required')
    const { status, data } = await request<Record<string, unknown>>(
      'GET',
      salonPosUrl(`/sales/viewer/${encodeURIComponent(id)}`),
      { headers: this.bearerHeaders() },
    )
    if (status === 404) throw new Error('Bill not found')
    if (status < 200 || status >= 300) {
      throw new Error(httpErrorMessage('Failed to load bill', status, data))
    }
    if (!data || typeof data !== 'object') throw new Error('Bill detail: expected object')
    return data
  }

  async fetchSalesReport(
    kind: 'salesman-wise' | 'item-wise' | 'group-wise',
    opts: {
      dateFrom: string
      dateTo: string
      staffId?: string | number
      productId?: string | number
      groupId?: string | number
    },
  ): Promise<Record<string, unknown>[]> {
    const params: Record<string, string | number | undefined> = {
      dateFrom: opts.dateFrom,
      dateTo: opts.dateTo,
    }
    if (opts.staffId != null && String(opts.staffId) !== '' && String(opts.staffId) !== 'all') {
      params.staffId = opts.staffId
    }
    if (opts.productId != null && String(opts.productId) !== '' && String(opts.productId) !== 'all') {
      params.productId = opts.productId
    }
    if (opts.groupId != null && String(opts.groupId) !== '' && String(opts.groupId) !== 'all') {
      params.groupId = opts.groupId
    }

    const { status, data } = await request<Record<string, unknown>>(
      'GET',
      salonPosUrl(`/sales/reports/${kind}`),
      { headers: this.bearerHeaders(), params },
    )
    if (status < 200 || status >= 300) {
      throw new Error(httpErrorMessage(`Failed to load ${kind} report`, status, data))
    }
    const rows = data?.rows
    if (!Array.isArray(rows)) return []
    return rows as Record<string, unknown>[]
  }

  // ── Credit settlement receipts ────────────────────────────────────────────

  async fetchCreditSettlementCustomers(opts?: {
    search?: string
    limit?: number
  }): Promise<Record<string, unknown>[]> {
    const limit = Math.min(Math.max(opts?.limit ?? 200, 1), 200)
    const params: Record<string, string | number | undefined> = { limit }
    const q = opts?.search?.trim() ?? ''
    if (q) params.q = q

    const { status, data } = await request<Record<string, unknown>>(
      'GET',
      salonPosUrl('/settlement/credit-customers'),
      { headers: this.bearerHeaders(), params },
    )
    if (status === 401) throw new Error('Unauthorized.')
    if (status !== 200) {
      throw new Error(httpErrorMessage('Failed to load credit customers', status, data))
    }
    const list = data?.customers
    if (!Array.isArray(list)) return []
    return list as Record<string, unknown>[]
  }

  async fetchCustomerOutstandingBills(customerId: string): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>(
      'GET',
      salonPosUrl(`/settlement/customers/${encodeURIComponent(customerId)}/bills`),
      { headers: this.bearerHeaders() },
    )
    if (status === 401) throw new Error('Unauthorized.')
    if (status !== 200) {
      throw new Error(httpErrorMessage('Failed to load outstanding bills', status, data))
    }
    if (!data || typeof data !== 'object') throw new Error('Expected object')
    return data
  }

  async saveCreditSettlement(opts: {
    customerId: string | number
    amount: number
    paymentMode: string
    counterNo?: number
  }): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>(
      'POST',
      salonPosUrl('/settlement/save'),
      {
        headers: this.bearerHeaders(),
        body: {
          customerId: opts.customerId,
          amount: opts.amount,
          paymentMode: opts.paymentMode,
          counterNo: opts.counterNo ?? 1,
        },
      },
    )
    if (status >= 200 && status < 300 && data && typeof data === 'object') return data
    throw new Error(httpErrorMessage('Credit settlement failed', status, data))
  }

  async fetchCreditSettlementHistory(opts?: {
    customerId?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
  }): Promise<Record<string, unknown>[]> {
    const params: Record<string, string | number | undefined> = {
      limit: opts?.limit ?? 150,
    }
    if (opts?.customerId) params.customerId = opts.customerId
    if (opts?.dateFrom) params.dateFrom = opts.dateFrom
    if (opts?.dateTo) params.dateTo = opts.dateTo

    const { status, data } = await request<Record<string, unknown>>(
      'GET',
      salonPosUrl('/settlement/history'),
      { headers: this.bearerHeaders(), params },
    )
    if (status !== 200) {
      throw new Error(httpErrorMessage('Failed to load settlement history', status, data))
    }
    const list = data?.receipts
    if (!Array.isArray(list)) return []
    return list as Record<string, unknown>[]
  }

  async fetchCreditSettlementReceipt(transactionId: string): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>(
      'GET',
      salonPosUrl(`/settlement/receipts/${encodeURIComponent(transactionId)}`),
      { headers: this.bearerHeaders() },
    )
    if (status !== 200) throw new Error(httpErrorMessage('Failed to load receipt', status, data))
    if (!data || typeof data !== 'object') throw new Error('Expected object')
    return data
  }

  // ── Counter close (X / Z) ─────────────────────────────────────────────────

  async fetchCounterSummary(opts?: {
    counterNo?: number
    allStaff?: boolean
  }): Promise<Record<string, unknown>> {
    const session = getPosSession()
    // Same as Saloon-POS: counterNo defaults to stationId; Admin passes allStaff=true
    const params: Record<string, string | number | undefined> = {
      counterNo: opts?.counterNo ?? session.counterNo,
    }
    if (opts?.allStaff) params.allStaff = 'true'
    const { status, data } = await request<Record<string, unknown>>(
      'GET',
      salonPosUrl('/counter/summary'),
      { headers: this.bearerHeaders(), params, timeout: 20_000 },
    )
    if (status === 401) throw new Error('Unauthorized.')
    if (status === 403) throw new Error('Counter close is not enabled for this plan.')
    if (status !== 200 || !data || typeof data !== 'object') {
      throw new Error(httpErrorMessage('Failed to load counter summary', status, data))
    }
    return data
  }

  async closeCounter(opts: {
    reportType: 'X' | 'Z'
    collectedCash: number
    counterNo?: number
    allStaff?: boolean
  }): Promise<Record<string, unknown>> {
    const session = getPosSession()
    const body: Record<string, unknown> = {
      counterNo: opts.counterNo ?? session.counterNo,
      reportType: String(opts.reportType).toUpperCase(),
      collectedCash: Number(opts.collectedCash) || 0,
    }
    if (opts.allStaff) body.allStaff = true
    const { status, data } = await request<Record<string, unknown>>(
      'POST',
      salonPosUrl('/counter/close'),
      { headers: this.bearerHeaders(), body, timeout: 60_000 },
    )
    if (status === 401) throw new Error('Unauthorized.')
    if (status === 403) throw new Error('Counter close is not enabled for this plan.')
    if ((status === 200 || status === 201) && data && typeof data === 'object') {
      return data
    }
    throw new Error(httpErrorMessage('Counter close failed', status, data))
  }

  // ── Appointments / stylists ───────────────────────────────────────────────

  async fetchAppointmentsByDate(date: string): Promise<Record<string, unknown>[]> {
    const { status, data } = await request<Record<string, unknown> | unknown[]>(
      'GET',
      salonPosUrl(`/appointments?date=${encodeURIComponent(date)}`),
      { headers: this.sessionHeaders() },
    )
    if (status !== 200) return []
    if (Array.isArray(data)) return data as Record<string, unknown>[]
    if (data && typeof data === 'object' && Array.isArray(data.data)) {
      return data.data as Record<string, unknown>[]
    }
    return []
  }

  async getStylistAvailability(
    stylistId: number,
    date: string,
  ): Promise<Record<string, unknown>> {
    const { status, data } = await request<Record<string, unknown>>(
      'GET',
      salonPosUrl(`/stylists/${stylistId}/availability?date=${encodeURIComponent(date)}`),
      { headers: this.sessionHeaders() },
    )
    if (status === 200 && data && typeof data === 'object') return data
    return { availableSlots: [], bookedSlots: [] }
  }
}

/** Singleton — same usage pattern as Saloon-POS `ApiService()`. */
export const apiService = new ApiService()
export default apiService
