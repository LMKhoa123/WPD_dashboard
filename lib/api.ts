
export type ApiRole = "ADMIN" | "STAFF" | "TECHNICIAN" | string

// New login request supports a generic identifier (email or phone)
export interface LoginRequest {
  identifier: string
  password: string
}
// Legacy shape kept for backward compatibility where some code may still pass email
export interface LegacyLoginRequest {
  email: string
  password: string
}
export interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  meta?: any
  createdAt: string
  read?: boolean
}
export interface LoginResponse {
  success: boolean
  message: string
  data: {
    accessToken: string
    refreshToken: string
    expiresIn: number // seconds
    role: ApiRole
  }
}

export interface RegisterRequest {
  email: string
  password: string
  role: ApiRole
  centerId: string
}

export interface RegisterResponse {
  success: boolean
  message: string
}

export interface RefreshRequest {
  refreshToken: string
}

export interface RefreshResponse {
  success: boolean
  message: string
  data: {
    accessToken: string
    expiresIn: number
  }
}

export interface ProfileData {
  _id: string
  userId: {
    _id: string
    email: string
    role: "ADMIN" | "STAFF" | "TECHNICIAN"
  }
  name: string
  dateOfBirth: string | null
  certification: string
  isOnline: boolean
  centerId: string | null
  createdAt: string
  updatedAt: string
  __v: number
}

export interface ProfileResponse {
  success: boolean
  message: string
  data: ProfileData
}

export interface Tokens {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: number
}

// Users (accounts)
export interface UserAccount {
  _id: string
  email?: string
  phone?: string
  role: "ADMIN" | "STAFF" | "TECHNICIAN" | "CUSTOMER" | string
  isDeleted: boolean
  refreshToken?: string | null
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface UsersListResponse {
  success: boolean
  message?: string
  data:
  | UserAccount[]
  | {
    users: UserAccount[]
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
}

// Users update payload (Admin only)
export interface UpdateUserRequest {
  email?: string
  password?: string
  role?: "ADMIN" | "STAFF" | "TECHNICIAN" | "CUSTOMER" | string
  isDeleted?: boolean
}

// Customers
export interface CustomerRecord {
  _id: string
  userId: {
    _id: string
    phone: string
    role: "CUSTOMER"
  }
  customerName: string
  dateOfBirth: string | null
  address: string
  deviceTokens: string[]
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface CustomersListResponse {
  success: boolean
  data: {
    customers: CustomerRecord[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// System users (staff/admin profiles)
export interface SystemUserRecord {
  _id: string
  userId: string | { _id: string; email: string; role: "ADMIN" | "STAFF" | "TECHNICIAN"; phone?: string }
  name: string
  dateOfBirth: string | null
  certification: string
  isOnline: boolean
  centerId?: string
  certificates?: Array<{
    _id: string
    name: string
    issuingOrganization: string
    issueDate: string
    expirationDate: string
    credentialUrl: string
  }>
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface SystemUsersListResponse {
  success: boolean
  data: {
    systemUsers: SystemUserRecord[]
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
}

// Vehicles
export interface VehicleRecord {
  _id: string
  vehicleName: string
  model: string
  year?: number
  VIN: string
  price?: number
  mileage?: number
  plateNumber?: string
  last_service_date?: string
  last_alert_mileage?: number
  image?: string
  customerId?: { _id: string; customerName: string; address: string } | string
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface VehiclesListResponse {
  success: boolean
  data: {
    vehicles: VehicleRecord[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Vehicles by customer response (different shape: data is an array)
export interface VehiclesByCustomerResponse {
  success: boolean
  data: VehicleRecord[]
}

// Create vehicle response shape
export interface CreateVehicleResponse {
  success: boolean
  message?: string
  data: VehicleRecord
}

// Service Packages
export interface ServicePackageRecord {
  _id: string
  name: string
  description: string
  price: number
  duration: number
  km_interval: number
  service_interval_days: number
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface ServicePackagesListResponse {
  success: boolean
  data: ServicePackageRecord[]
}

export interface ServicePackageResponse {
  success: boolean
  data: ServicePackageRecord
}

export interface CreateServicePackageRequest {
  name: string
  description: string
  price: number
  duration: number
  km_interval: number
  service_interval_days: number
}

export interface UpdateServicePackageRequest {
  name?: string
  description?: string
  price?: number
  duration?: number
  km_interval?: number
  service_interval_days?: number
}

// Service Centers
export interface CenterRecord {
  _id: string
  name: string
  address: string
  phone: string
  image?: string
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface CentersListResponse {
  success: boolean
  data: {
    centers: CenterRecord[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface CenterResponse {
  success: boolean
  data: CenterRecord
}

export interface CreateCenterRequest {
  name: string
  address: string
  phone: string
}

export interface UpdateCenterRequest {
  name?: string
  address?: string
  phone?: string
}

// Appointments
export type AppointmentStatus = "pending" | "confirmed" | "in-progress" | "completed" | "cancelled" | "scheduled"

export interface AppointmentRecord {
  _id: string
  staffId: string | { _id: string; name?: string; email?: string }
  customer_id: string | null | { _id: string; customerName?: string }
  vehicle_id: string | { _id: string; vehicleName?: string; model?: string; mileage?: number; plateNumber?: string }
  center_id: string | { _id: string; name?: string; address?: string; phone?: string }
  slot_id?: string | SlotRecord
  startTime?: string
  endTime?: string
  status: AppointmentStatus
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface AppointmentsListResponse {
  success: boolean
  data: {
    appointments: AppointmentRecord[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface AppointmentResponse {
  success: boolean
  data: AppointmentRecord
}

export interface CreateAppointmentRequest {
  staffId: string
  customer_id?: string | null
  vehicle_id: string
  center_id: string
  startTime: string // ISO date
  endTime: string   // ISO date
  status: AppointmentStatus
}

// New slot-based creation request (preferred): use slot_id from center's slots
export interface CreateAppointmentRequestV2 {
  staffId: string
  customer_id?: string | null
  vehicle_id: string
  center_id: string
  slot_id: string
  status: AppointmentStatus
}

// Slot types
export interface SlotRecord {
  _id: string
  center_id: string | { _id: string; name?: string }
  start_time: string
  end_time: string
  slot_date: string
  capacity: number
  booked_count: number
  status: string
  createdAt?: string
  updatedAt?: string
  __v?: number
}

export interface SlotsListResponse {
  success: boolean
  data: SlotRecord[]
}

export interface GenerateSlotsRequest {
  center_ids: string[]
  dates: string[] // array of YYYY-MM-DD
  start_time: string // HH:mm
  end_time: string // HH:mm
  duration: number // minutes
}

export interface GenerateSlotsResponse {
  success: boolean
  message: string
  data: {
    created: number
    skipped: number
    slots: SlotRecord[]
  }
}

// Slot Staff & Technician availability for a slot
export interface SlotUserAvailability {
  id: string
  name: string
  email: string
  phone: string
  assigned: boolean
  shiftId?: string
  shiftTime?: string
}

export interface SlotStaffAndTechnicianResponse {
  success: boolean
  data: {
    slot: {
      id: string
      center_id: string
      date: string
      startTime: string
      endTime: string
      capacity: number
      totalAppointments: number
    }
    staff: SlotUserAvailability[]
    technician: SlotUserAvailability[]
  }
}

export interface UpdateAppointmentRequest {
  staffId?: string
  customer_id?: string | null
  vehicle_id?: string
  center_id?: string
  slot_id?: string
  startTime?: string
  endTime?: string
  status?: AppointmentStatus
}

// Service Records
export type ServiceRecordStatus = "pending" | "in-progress" | "completed" | "cancelled" | string

export interface ServiceRecordRecord {
  _id: string
  appointment_id: string | null | AppointmentRecord
  technician_id: string | { _id: string; name?: string; email?: string }
  start_time: string
  end_time: string
  description: string
  status: ServiceRecordStatus
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface ServiceRecordsListResponse {
  success: boolean
  data: {
    records: ServiceRecordRecord[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ServiceRecordResponse {
  success: boolean
  data: ServiceRecordRecord
}

export interface CreateServiceRecordRequest {
  appointment_id?: string | null
  technician_id: string
  start_time: string // ISO date
  end_time: string   // ISO date
  description: string
  status: ServiceRecordStatus
}

export interface UpdateServiceRecordRequest {
  appointment_id?: string | null
  technician_id?: string
  start_time?: string
  end_time?: string
  description?: string
  status?: ServiceRecordStatus
}

// Record Checklists (items attached to a service record based on templates)
export type RecordChecklistStatus = "pending" | "checked" | "ok" | "needs-replacement" | string

export interface RecordChecklistItem {
  _id: string
  record_id: string | ServiceRecordRecord
  checklist_id: string | ServiceChecklistRecord
  status: RecordChecklistStatus
  note?: string
  suggest?: string[] // Array of part IDs suggested for replacement
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface RecordChecklistsListResponse {
  success: boolean
  data: RecordChecklistItem[]
}

export interface RecordChecklistsCreateResponse {
  success: boolean
  message?: string
  data: RecordChecklistItem[]
}

export interface CreateRecordChecklistsRequest {
  record_id: string
  checklist_ids: string[]
  status?: RecordChecklistStatus
  note?: string
  suggest?: string[] // Array of part IDs, should be empty [] when first creating
}

export interface CreateRecordChecklistRequest {
  record_id: string
  checklist_id: string
  status?: RecordChecklistStatus
  note?: string
  suggest?: string[] // Array of part IDs, should be empty [] when first creating
}

export interface UpdateRecordChecklistRequest {
  status?: RecordChecklistStatus
  note?: string
  suggest_add?: string[] // Part IDs to add to suggest list
  suggest_remove?: string[] // Part IDs to remove from suggest list
}

// Suggested Parts aggregated from all checklists in a service record
export interface SuggestedPartItem {
  _id: string
  center_id: string | CenterRecord
  part_id: string | AutoPartRecord
  quantity: number
  min_stock: number
  recommended_min_stock: number
  last_forecast_date?: string
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface AllSuggestedPartsResponse {
  success: boolean
  message?: string
  data: SuggestedPartItem[]
}

// Service Checklist types (templates managed by Admin)
export interface ServiceChecklistRecord {
  _id: string
  name: string
  order: number
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface ServiceChecklistsListResponse {
  success: boolean
  data: {
    checklists: ServiceChecklistRecord[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ServiceChecklistResponse {
  success: boolean
  message?: string
  data: ServiceChecklistRecord
}

export interface CreateServiceChecklistRequest {
  name: string
  order: number
}

export interface UpdateServiceChecklistRequest {
  name?: string
  order?: number
}

// Workshifts (Admin manages center work shifts)
export type WorkshiftStatus = "active" | "completed" | "cancelled" | string

export interface WorkshiftRecord {
  _id: string
  shift_id: string
  shift_date: string // ISO date string (e.g., 2025-10-27T00:00:00.000Z)
  start_time: string // HH:mm
  end_time: string   // HH:mm
  status: WorkshiftStatus
  center_id: string
  __v?: number
}

export interface WorkshiftsListResponse {
  success: boolean
  data: WorkshiftRecord[]
}

export interface WorkshiftResponse {
  success: boolean
  data: WorkshiftRecord
}

export interface CreateWorkshiftRequest {
  shift_id: string
  shift_date: string // YYYY-MM-DD
  start_time: string // HH:mm
  end_time: string   // HH:mm
  status: WorkshiftStatus
  center_id: string
}

// Bulk create workshifts (new endpoint contract supporting multiple dates)
export interface CreateWorkshiftsBulkRequest {
  shift_dates: string[] // array of YYYY-MM-DD
  start_time: string // HH:mm
  end_time: string   // HH:mm
  status: WorkshiftStatus
  center_id: string
}

export interface UpdateWorkshiftRequest {
  shift_id?: string
  shift_date?: string // YYYY-MM-DD
  start_time?: string // HH:mm
  end_time?: string   // HH:mm
  status?: WorkshiftStatus
  center_id?: string
}

// Shift Assignments
export interface ShiftAssignmentRecord {
  _id: string
  workshift_id: string | WorkshiftRecord
  system_user_id: string | SystemUserRecord
  createdAt?: string
  updatedAt?: string
  __v?: number
}

export interface AssignShiftsRequest {
  system_user_id: string
  workshift_ids: string[]
}

export interface ShiftAssignmentsListResponse {
  success: boolean
  data: ShiftAssignmentRecord[]
}

// GET /shift-assignments/shift/{workshift_id} returns array of system_user_id strings
export interface ShiftAssignmentsByShiftResponse {
  success: boolean
  data: string[]
}

// GET /shift-assignments/user/{system_user_id} returns assigned shift infos (flattened workshift fields)
export interface AssignedShiftInfo {
  _id: string
  shift_date: string
  start_time: string
  end_time: string
  status: WorkshiftStatus
  center_id: string
  __v?: number
}

export interface AssignedShiftsByUserResponse {
  success: boolean
  data: AssignedShiftInfo[]
}

export interface ShiftAssignmentResponse {
  success: boolean
  data: ShiftAssignmentRecord
}

// Auto Parts types
export interface AutoPartRecord {
  _id: string
  name: string
  cost_price: number
  selling_price: number
  warranty_time: number // Thời gian bảo hành (đơn vị: ngày)
  // Legacy fields from previous backend versions (may be absent in new API)
  quantity?: number
  min_stock?: number
  recommended_min_stock?: number
  last_forecast_date?: string
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface AutoPartsListResponse {
  success: boolean
  data: {
    parts: AutoPartRecord[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface AutoPartResponse {
  success: boolean
  data: AutoPartRecord
}

export interface CreateAutoPartRequest {
  name: string
  cost_price: number
  selling_price: number
  warranty_time: number // Thời gian bảo hành (đơn vị: ngày)
}

export interface UpdateAutoPartRequest {
  name?: string
  cost_price?: number
  selling_price?: number
  warranty_time?: number // Thời gian bảo hành (đơn vị: ngày)
}

// Forecast types
export interface ForecastResultItem {
  _id: string
  center_id: string
  part_id: string
  analysis: {
    riskLevel: string // e.g., "MEDIUM", "HIGH", "LOW"
    title: string
    content: string
    suggestedOrderQty: number
  }
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface ForecastInfoResponse {
  success: boolean
  results: ForecastResultItem[]
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

// Center Auto Parts (Inventory per center per part)
export interface CenterAutoPartRecord {
  _id: string
  center_id: string | CenterRecord
  part_id: string | AutoPartRecord
  quantity: number
  min_stock: number
  recommended_min_stock: number
  last_forecast_date?: string
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface CenterAutoPartsListResponse {
  success: boolean
  data: {
    items: CenterAutoPartRecord[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface CenterAutoPartResponse {
  success: boolean
  data: CenterAutoPartRecord
}

export interface CreateCenterAutoPartRequest {
  center_id: string
  part_id: string
  quantity: number
  min_stock: number
  recommended_min_stock: number
  last_forecast_date?: string
}

export interface UpdateCenterAutoPartRequest {
  center_id?: string
  part_id?: string
  quantity?: number
  min_stock?: number
  recommended_min_stock?: number
  last_forecast_date?: string | null
}

// Service Details (line items for a service record)
export interface ServiceDetailRecord {
  _id: string
  record_id: string | ServiceRecordRecord
  centerpart_id: string | CenterAutoPartRecord
  description: string
  quantity: number
  unit_price: number
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface ServiceDetailsListResponse {
  success: boolean
  data: {
    details: ServiceDetailRecord[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ServiceDetailResponse {
  success: boolean
  data: ServiceDetailRecord
}

export interface CreateServiceDetailRequest {
  record_id: string
  centerpart_id: string
  description: string
  quantity: number
  unit_price: number
}

export interface UpdateServiceDetailRequest {
  description?: string
  quantity?: number
  unit_price?: number
}
// Chat – waiting conversations
export interface ChatConversationRecord {
  _id: string
  customerId: { _id: string; customerName: string } | string
  assignedStaffId: string | null
  lastAssignedStaff: string | null
  status: "waiting" | "assigned" | string
  assignmentHistory: Array<any>
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface ChatWaitingResponse {
  success: boolean
  data: {
    conversations: ChatConversationRecord[]
    totalCount: number
    currentPage: number
    totalPages: number
  }
}

export interface MessageRecord {
  _id: string
  conversationId: string
  senderId: null | { _id: string; name?: string }
  senderRole: "user" | "staff" | "system"
  content: string
  isRead: boolean
  attachment?: string | null
  systemMessageType?: string | null
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface StaffConversationsResponse {
  success: boolean
  data: ChatConversationRecord[]
}

export interface ConversationDetailResponse {
  success: boolean
  data: {
    conversation: ChatConversationRecord
    messages: MessageRecord[]
  }
}

const API_BASE: string = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) || ""

const TOKENS_KEY = "evsc:tokens"

function nowMs() {
  return Date.now()
}

export function loadTokens(): Tokens | null {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(TOKENS_KEY) : null
    return raw ? (JSON.parse(raw) as Tokens) : null
  } catch {
    return null
  }
}

export function saveTokens(tokens: Tokens | null) {
  try {
    if (typeof localStorage === "undefined") return
    if (tokens) localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
    else localStorage.removeItem(TOKENS_KEY)
    // Notify same-tab listeners about token changes (e.g. socket reconnect)
    try {
      if (typeof window !== "undefined") {
        const ev = new CustomEvent("ev_tokens_changed", { detail: tokens })
        window.dispatchEvent(ev)
      }
    } catch (e) {
      // ignore
    }
  } catch { }
}

async function rawFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, init)
}

export class ApiClient {
  private baseUrl: string
  private getTokens: () => Tokens | null
  private setTokens: (t: Tokens | null) => void
  private onUnauthorized?: () => void
  private refreshPromise: Promise<RefreshResponse> | null = null

  constructor(opts?: {
    baseUrl?: string
    getTokens?: () => Tokens | null
    setTokens?: (t: Tokens | null) => void
    onUnauthorized?: () => void
  }) {
    this.baseUrl = (opts?.baseUrl || API_BASE).replace(/\/$/, "")
    this.getTokens = opts?.getTokens || loadTokens
    this.setTokens = opts?.setTokens || saveTokens
    this.onUnauthorized = opts?.onUnauthorized
  }

  private buildUrl(path: string) {
    const p = path.startsWith("/") ? path : `/${path}`
    return `${this.baseUrl}${p}`
  }

  private authHeader(): Record<string, string> {
    const tokens = this.getTokens()
    if (tokens?.accessToken) return { Authorization: `Bearer ${tokens.accessToken}` }
    return {}
  }

  private async ensureFreshAccessToken(): Promise<void> {
    const tokens = this.getTokens()
    if (!tokens) return
    // Refresh slightly before expiry (10s skew)
    if (tokens.accessTokenExpiresAt - nowMs() > 10_000) return

    // If already refreshing, wait for that promise
    if (this.refreshPromise) {
      await this.refreshPromise.catch(() => {
        // swallow; next request will likely 401 and we can handle upstream
      })
      return
    }

    // Start refresh
    await this.refreshToken().catch(() => {
      // swallow; next request will likely 401 and we can handle upstream
    })
  }

  private async fetchJson<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
    await this.ensureFreshAccessToken()
    const res = await rawFetch(this.buildUrl(path), {
      ...init,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        ...this.authHeader(),
        ...(init?.headers as any),
      },
    })

    if (res.status === 401 && retry) {
      // try refresh then retry once
      try {
        await this.refreshToken()
        return this.fetchJson<T>(path, init, false)
      } catch {
        // Refresh failed - token is invalid or expired
        this.handleUnauthorized()
        throw new Error("Unauthorized")
      }
    }

    if (!res.ok) {
      const msg = await safeErrorMessage(res)
      throw new Error(msg)
    }
    return (await res.json()) as T
  }

  private handleUnauthorized() {
    // Clear any ongoing refresh
    this.refreshPromise = null
    // Clear tokens
    this.setTokens(null)
    // Call the unauthorized callback if provided
    if (this.onUnauthorized) {
      this.onUnauthorized()
    }
  }

  async login(payload: LoginRequest | LegacyLoginRequest): Promise<LoginResponse> {
    // Normalize payload to new identifier-based format
    const normalized: LoginRequest = "identifier" in payload
      ? payload
      : { identifier: payload.email, password: payload.password }

    // Try new endpoint first
    const attempt = async (path: string) => rawFetch(this.buildUrl(path), {
      method: "POST",
      body: JSON.stringify(normalized),
      headers: { "Content-Type": "application/json", accept: "application/json" },
    })

    // let res = await attempt("/auth/login")
    // // If new endpoint not found or method not allowed, fallback to legacy endpoint
    // if (res.status === 404 || res.status === 405) {
    let res = await attempt("/auth/login-by-password")
    // }

    if (!res.ok) {
      const msg = await safeErrorMessage(res)
      throw new Error(msg)
    }

    const data = (await res.json()) as LoginResponse
    const { accessToken, refreshToken, expiresIn } = data.data
    const tokens: Tokens = {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: nowMs() + expiresIn * 1000,
    }
    this.setTokens(tokens)
    return data
  }

  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    // Admin creates staff/admin/technician accounts; requires auth token
    const attempt = async (path: string) => rawFetch(this.buildUrl(path), {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json", accept: "application/json", ...this.authHeader() },
    })

    let res = await attempt("/auth/register-staff")
    if (res.status === 401) {
      try {
        await this.refreshToken()
        res = await attempt("/auth/register-staff")
      } catch {
        this.handleUnauthorized()
        throw new Error("Unauthorized")
      }
    }
    // backward compatibility fallback
    if (res.status === 404 || res.status === 405) {
      res = await attempt("/auth/register")
    }

    if (!res.ok) {
      const msg = await safeErrorMessage(res)
      throw new Error(msg)
    }
    return (await res.json()) as RegisterResponse
  }

  async refreshToken(): Promise<RefreshResponse> {
    // If already refreshing, return the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    const tokens = this.getTokens()
    if (!tokens?.refreshToken) {
      this.handleUnauthorized()
      throw new Error("No refresh token")
    }

    // Create and store the refresh promise
    this.refreshPromise = (async () => {
      try {
        // Use rawFetch to avoid infinite loop (don't call ensureFreshAccessToken)
        const res = await rawFetch(this.buildUrl("/auth/refresh-token"), {
          method: "POST",
          body: JSON.stringify({ refreshToken: tokens.refreshToken } satisfies RefreshRequest),
          headers: { "Content-Type": "application/json", accept: "application/json" },
        })

        if (!res.ok) {
          const msg = await safeErrorMessage(res)
          throw new Error(msg)
        }

        const data = (await res.json()) as RefreshResponse
        const next: Tokens = {
          accessToken: data.data.accessToken,
          refreshToken: tokens.refreshToken,
          accessTokenExpiresAt: nowMs() + data.data.expiresIn * 1000,
        }
        this.setTokens(next)
        return data
      } catch (e) {
        // Refresh failed - likely expired refresh token
        this.handleUnauthorized()
        throw e
      } finally {
        // Clear the promise after completion (success or failure)
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  async logout(): Promise<void> {
    // Clear any ongoing refresh
    this.refreshPromise = null

    try {
      // Use rawFetch for logout to avoid auth loops
      const tokens = this.getTokens()
      if (tokens?.accessToken) {
        await rawFetch(this.buildUrl("/auth/logout"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        })
      }
    } catch {
      // ignore logout errors
    } finally {
      this.setTokens(null)
    }
  }

  async getProfile(): Promise<ProfileResponse> {
    return this.fetchJson<ProfileResponse>("/auth/profile", { method: "GET" })
  }

  async getUsers(params?: { page?: number; limit?: number; role?: string; q?: string }): Promise<UserAccount[]> {
    const url = new URL(this.buildUrl("/users"))
    if (params?.page) url.searchParams.set("page", String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    if (params?.role) url.searchParams.set("role", params.role)
    if (params?.q) url.searchParams.set("q", params.q)
    const res = await rawFetch(url.toString(), {
      headers: { accept: "application/json", ...this.authHeader() },
    })
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    const data = (await res.json()) as UsersListResponse
    if (Array.isArray(data.data)) return data.data
    return data.data.users
  }

  async getUserById(userId: string): Promise<UserAccount> {
    const res = await this.fetchJson<{ success: boolean; data: UserAccount }>(`/users/${userId}`, { method: "GET" })
    return res.data
  }

  async updateUser(userId: string, payload: UpdateUserRequest): Promise<UserAccount> {
    const res = await this.fetchJson<{ success: boolean; data: UserAccount }>(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  async deleteUser(userId: string): Promise<void> {
    await this.fetchJson(`/users/${userId}`, { method: "DELETE" })
  }

  async getCustomers(params?: { page?: number; limit?: number }): Promise<CustomersListResponse> {
    const url = new URL(this.buildUrl("/customers"))
    if (params?.page) url.searchParams.set("page", String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    const res = await rawFetch(url.toString(), { headers: { accept: "application/json", ...this.authHeader() } })
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    return (await res.json()) as CustomersListResponse
  }

  async getCustomerById(customerId: string): Promise<CustomerRecord> {
    const res = await this.fetchJson<{ success: boolean; data: CustomerRecord }>(`/customers/${customerId}`, {
      method: "GET",
    })
    return res.data
  }

  async updateCustomer(customerId: string, payload: { customerName?: string; dateOfBirth?: string | null; address?: string }): Promise<CustomerRecord> {
    const res = await this.fetchJson<{ success: boolean; data: CustomerRecord }>(`/customers/${customerId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  async deleteCustomer(customerId: string): Promise<void> {
    await this.fetchJson(`/customers/${customerId}`, { method: "DELETE" })
  }

  async getSystemUsers(params?: { page?: number; limit?: number; centerId?: string; role?: string }): Promise<SystemUsersListResponse> {
    const url = new URL(this.buildUrl("/system-users"))
    if (params?.page) url.searchParams.set("page", String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    if (params?.centerId) url.searchParams.set("centerId", params.centerId)
    if (params?.role) url.searchParams.set("role", params.role)
    const res = await rawFetch(url.toString(), { headers: { accept: "application/json", ...this.authHeader() } })
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    return (await res.json()) as SystemUsersListResponse
  }

  async getSystemUserById(systemUserId: string): Promise<SystemUserRecord> {
    const res = await this.fetchJson<{ success: boolean; data: SystemUserRecord }>(`/system-users/${systemUserId}`, { method: "GET" })
    return res.data
  }

  async updateSystemUser(systemUserId: string, payload: {
    name?: string
    dateOfBirth?: string | null
    certificates?: Array<{
      name: string
      issuingOrganization: string
      issueDate: string
      expirationDate: string
      credentialUrl: string
    }>
  }): Promise<SystemUserRecord> {
    const res = await this.fetchJson<{ success: boolean; data: SystemUserRecord }>(`/system-users/${systemUserId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  async deleteSystemUser(systemUserId: string): Promise<void> {
    await this.fetchJson(`/system-users/${systemUserId}`, { method: "DELETE" })
  }

  // GET /vehicles (Admin, Staff)
  // Returns a paginated list of vehicles from the backend. Currently only the array is returned to callers.
  async getVehicles(params?: { page?: number; limit?: number }): Promise<VehicleRecord[]> {
    const url = new URL(this.buildUrl("/vehicles"))
    if (params?.page) url.searchParams.set("page", String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    const res = await rawFetch(url.toString(), { headers: { accept: "application/json", ...this.authHeader() } })
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    const data = (await res.json()) as VehiclesListResponse
    return data.data.vehicles
  }

  // POST /vehicles (Admin, Staff)
  // Create a new vehicle for a customer. Accepts multipart/form-data (supports image upload).
  // Form fields typically include: vehicleName, model, year, VIN, mileage, plateNumber, price, image, and optional customerId.
  async createVehicle(form: FormData): Promise<VehicleRecord> {
    await this.ensureFreshAccessToken()
    const doRequest = async () =>
      rawFetch(this.buildUrl("/vehicles"), {
        method: "POST",
        body: form,
        headers: {
          // Do NOT set Content-Type for FormData; browser will set boundary
          accept: "application/json",
          ...this.authHeader(),
        },
      })

    let res = await doRequest()
    if (res.status === 401) {
      try {
        await this.refreshToken()
        res = await doRequest()
      } catch {
        this.handleUnauthorized()
        throw new Error("Unauthorized")
      }
    }
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    const data = (await res.json()) as CreateVehicleResponse
    return data.data
  }

  // GET /vehicles/{id} (Admin, Staff)
  // Get vehicle details by ID
  async getVehicleById(vehicleId: string): Promise<VehicleRecord> {
    const res = await this.fetchJson<CreateVehicleResponse>(`/vehicles/${vehicleId}`, { method: "GET" })
    return res.data
  }

  // GET /vehicles/customer/{customerId} (Admin, Staff)
  // Get all vehicles belonging to a specific customer
  async getVehiclesByCustomerId(customerId: string): Promise<VehicleRecord[]> {
    const res = await this.fetchJson<VehiclesByCustomerResponse>(`/vehicles/customer/${customerId}`, { method: "GET" })
    return res.data
  }

  // POST /vehicles/assign-vehicle (Admin, Staff)
  // Assign an existing vehicle to a customer found by phone number.
  async assignVehicle(vehicleId: string, phone: string): Promise<{ success: boolean; message?: string }> {
    const res = await this.fetchJson<{ success: boolean; message?: string; data?: any }>(`/vehicles/assign-vehicle`, {
      method: "POST",
      body: JSON.stringify({ vehicleId, phone }),
    })
    return { success: res.success, message: res.message }
  }

  // Service Packages: list
  async getServicePackages(): Promise<ServicePackageRecord[]> {
    const res = await this.fetchJson<ServicePackagesListResponse>(`/service-packages`, { method: "GET" })
    return res.data
  }

  // Service Packages: get by id
  async getServicePackageById(id: string): Promise<ServicePackageRecord> {
    const res = await this.fetchJson<ServicePackageResponse>(`/service-packages/${id}`, { method: "GET" })
    return res.data
  }

  // Service Packages: create
  async createServicePackage(payload: CreateServicePackageRequest): Promise<ServicePackageRecord> {
    const res = await this.fetchJson<ServicePackageResponse>(`/service-packages`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  // Service Packages: update (PATCH)
  async updateServicePackage(id: string, payload: UpdateServicePackageRequest): Promise<ServicePackageRecord> {
    const res = await this.fetchJson<ServicePackageResponse>(`/service-packages/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  // Service Packages: delete
  async deleteServicePackage(id: string): Promise<void> {
    await this.fetchJson(`/service-packages/${id}`, { method: "DELETE" })
  }

  // Chat: get waiting conversations
  async getChatWaiting(params?: { page?: number; limit?: number }): Promise<ChatWaitingResponse> {
    const url = new URL(this.buildUrl("/chat/waiting"))
    if (params?.page) url.searchParams.set("page", String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    const res = await rawFetch(url.toString(), { headers: { accept: "application/json", ...this.authHeader() } })
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    return (await res.json()) as ChatWaitingResponse
  }

  // Chat: take/claim a conversation
  async takeConversation(conversationId: string, staffId: string): Promise<{ success: boolean; message?: string }> {
    const res = await this.fetchJson<{ success: boolean; message?: string }>(`/chat/${conversationId}/take`, {
      method: "POST",
      body: JSON.stringify({ staffId }),
    })
    return res
  }

  // Chat: get staff's conversations
  async getStaffConversations(staffId: string): Promise<StaffConversationsResponse> {
    const res = await this.fetchJson<StaffConversationsResponse>(`/chat/staff/${staffId}`, { method: "GET" })
    return res
  }

  // Chat: get conversation detail (messages)
  async getConversationDetail(conversationId: string): Promise<ConversationDetailResponse> {
    return this.fetchJson<ConversationDetailResponse>(`/chat/${conversationId}`, { method: "GET" })
  }

  // Chat: staff sends a message
  async sendStaffMessage(conversationId: string, payload: { staffId: string; content: string; attachment?: string | null }): Promise<{ success: boolean }> {
    return this.fetchJson<{ success: boolean }>(`/chat/${conversationId}/staff-message`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  // Chat: mark messages as read
  async markConversationRead(conversationId: string): Promise<{ success: boolean }> {
    return this.fetchJson<{ success: boolean }>(`/chat/${conversationId}/mark-read`, { method: "POST", body: JSON.stringify({}) })
  }

  // Chat: close conversation
  async closeConversation(conversationId: string): Promise<{ success: boolean }> {
    return this.fetchJson<{ success: boolean }>(`/chat/${conversationId}/close`, { method: "POST", body: JSON.stringify({}) })
  }

  // PATCH /vehicles/{id} (Admin, Staff)
  // Update a vehicle with multipart/form-data (supports image upload)
  async updateVehicle(vehicleId: string, form: FormData): Promise<VehicleRecord> {
    await this.ensureFreshAccessToken()
    const doRequest = async () =>
      rawFetch(this.buildUrl(`/vehicles/${vehicleId}`), {
        method: "PATCH",
        body: form,
        headers: {
          // Do NOT set Content-Type for FormData; browser will set boundary
          accept: "application/json",
          ...this.authHeader(),
        },
      })

    let res = await doRequest()
    if (res.status === 401) {
      try {
        await this.refreshToken()
        res = await doRequest()
      } catch {
        this.handleUnauthorized()
        throw new Error("Unauthorized")
      }
    }
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    const data = (await res.json()) as CreateVehicleResponse
    return data.data
  }

  // DELETE /vehicles/{id} (Admin, Staff)
  // Delete a vehicle
  async deleteVehicle(vehicleId: string): Promise<void> {
    await this.fetchJson(`/vehicles/${vehicleId}`, { method: "DELETE" })
  }

  // Vehicle Subscriptions: list
  async getVehicleSubscriptions(): Promise<VehicleSubscriptionRecord[]> {
    const res = await this.fetchJson<VehicleSubscriptionsListResponse>(`/vehicle-subscriptions`, { method: "GET" })
    return res.data
  }

  // Vehicle Subscriptions: get by id
  async getVehicleSubscriptionById(id: string): Promise<VehicleSubscriptionRecord> {
    const res = await this.fetchJson<VehicleSubscriptionResponse>(`/vehicle-subscriptions/${id}`, { method: "GET" })
    return res.data
  }

  // Vehicle Subscriptions: create
  async createVehicleSubscription(payload: CreateVehicleSubscriptionRequest): Promise<VehicleSubscriptionRecord> {
    const res = await this.fetchJson<VehicleSubscriptionResponse>(`/vehicle-subscriptions`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  // Vehicle Subscriptions: update
  async updateVehicleSubscription(id: string, payload: UpdateVehicleSubscriptionRequest): Promise<VehicleSubscriptionRecord> {
    const res = await this.fetchJson<VehicleSubscriptionResponse>(`/vehicle-subscriptions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  // Vehicle Subscriptions: delete
  async deleteVehicleSubscription(id: string): Promise<void> {
    await this.fetchJson(`/vehicle-subscriptions/${id}`, { method: "DELETE" })
  }

  // Vehicle Subscriptions: renew (Admin/Staff only)
  async renewVehicleSubscription(id: string): Promise<VehicleSubscriptionRecord> {
    const res = await this.fetchJson<VehicleSubscriptionResponse>(`/vehicle-subscriptions/${id}/renew`, {
      method: "POST",
    })
    return res.data
  }

  // Service Centers: list
  async getCenters(params?: { page?: number; limit?: number }): Promise<CentersListResponse> {
    const url = new URL(this.buildUrl("/centers"))
    if (params?.page) url.searchParams.set("page", String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    const res = await rawFetch(url.toString(), { headers: { accept: "application/json", ...this.authHeader() } })
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    return (await res.json()) as CentersListResponse
  }

  // Service Centers: get by id
  async getCenterById(id: string): Promise<CenterRecord> {
    const res = await this.fetchJson<CenterResponse>(`/centers/${id}`, { method: "GET" })
    return res.data
  }

  // Service Centers: create (multipart/form-data to support image upload)
  async createCenter(form: FormData): Promise<CenterRecord> {
    await this.ensureFreshAccessToken()
    const doRequest = async () =>
      rawFetch(this.buildUrl("/centers"), {
        method: "POST",
        body: form,
        headers: {
          accept: "application/json",
          ...this.authHeader(),
        },
      })

    let res = await doRequest()
    if (res.status === 401) {
      try {
        await this.refreshToken()
        res = await doRequest()
      } catch {
        this.handleUnauthorized()
        throw new Error("Unauthorized")
      }
    }
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    const data = (await res.json()) as CenterResponse
    return data.data
  }

  // Service Centers: update (PUT, multipart/form-data to support image upload)
  async updateCenter(id: string, form: FormData): Promise<CenterRecord> {
    await this.ensureFreshAccessToken()
    const doRequest = async () =>
      rawFetch(this.buildUrl(`/centers/${id}`), {
        method: "PUT",
        body: form,
        headers: {
          accept: "application/json",
          ...this.authHeader(),
        },
      })

    let res = await doRequest()
    if (res.status === 401) {
      try {
        await this.refreshToken()
        res = await doRequest()
      } catch {
        this.handleUnauthorized()
        throw new Error("Unauthorized")
      }
    }
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    const data = (await res.json()) as CenterResponse
    return data.data
  }

  // Service Centers: delete
  async deleteCenter(id: string): Promise<void> {
    await this.fetchJson(`/centers/${id}`, { method: "DELETE" })
  }

  // Appointments: list
  async getAppointments(params?: { page?: number; limit?: number; technician_id?: string; staff_id?: string; status?: string; centerId?: string }): Promise<AppointmentsListResponse> {
    const url = new URL(this.buildUrl("/appointments"))
    if (params?.page) url.searchParams.set("page", String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    if (params?.technician_id) url.searchParams.set("technician_id", params.technician_id)
    if (params?.staff_id) url.searchParams.set("staff_id", params.staff_id)
    if (params?.status) url.searchParams.set("status", params.status)
    if (params?.centerId) url.searchParams.set("centerId", params.centerId)
    const res = await rawFetch(url.toString(), { headers: { accept: "application/json", ...this.authHeader() } })
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    return (await res.json()) as AppointmentsListResponse
  }

  // Appointments: get by id
  async getAppointmentById(id: string): Promise<AppointmentRecord> {
    const res = await this.fetchJson<AppointmentResponse>(`/appointments/${id}`, { method: "GET" })
    return res.data
  }

  // Appointments: create
  async createAppointment(payload: CreateAppointmentRequest | CreateAppointmentRequestV2): Promise<AppointmentRecord> {
    // If using slot-based payload, make sure legacy time fields are not sent
    const body: any = { ...payload }
    if ("slot_id" in body) {
      delete body.startTime
      delete body.endTime
    }
    const res = await this.fetchJson<AppointmentResponse>(`/appointments`, {
      method: "POST",
      body: JSON.stringify(body),
    })
    return res.data
  }

  // Appointments: update (PUT)
  async updateAppointment(id: string, payload: UpdateAppointmentRequest): Promise<AppointmentRecord> {
    const res = await this.fetchJson<AppointmentResponse>(`/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  async getSlots(centerId: string): Promise<SlotRecord[]> {
    const res = await this.fetchJson<SlotsListResponse>(`/slots?center_id=${centerId}`, { method: "GET" })
    return res.data
  }

  async generateSlots(payload: GenerateSlotsRequest): Promise<GenerateSlotsResponse> {
    const res = await this.fetchJson<GenerateSlotsResponse>(`/slots/generate`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return res
  }

  // Slots: fetch staff and technician availability for a slot
  async getSlotStaffAndTechnician(slotId: string): Promise<SlotStaffAndTechnicianResponse> {
    return this.fetchJson<SlotStaffAndTechnicianResponse>(`/slots/${slotId}/staff-and-technician`, { method: "GET" })
  }

  // Appointments: delete
  async deleteAppointment(id: string): Promise<void> {
    await this.fetchJson(`/appointments/${id}`, { method: "DELETE" })
  }

  // Appointments: assign staff (Admin/Staff)
  async assignAppointmentStaff(id: string, staffId: string): Promise<AppointmentRecord> {
    const res = await this.fetchJson<AppointmentResponse>(`/appointments/${id}/assign-staff`, {
      method: "PUT",
      body: JSON.stringify({ staffId }),
    })
    return res.data
  }

  // Appointments: assign technician (Admin/Staff)
  async assignAppointmentTechnician(id: string, staffOrTechId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    // New contract: PUT with { staffId }
    const attempt = async (method: string, body: any) => this.fetchJson<{ success: boolean; data?: any; message?: string }>(`/appointments/${id}/assign-technician`, {
      method,
      body: JSON.stringify(body),
    })
    try {
      return await attempt("PUT", { staffId: staffOrTechId })
    } catch (e: any) {
      // Fallback legacy POST with technician_id
      return attempt("POST", { technician_id: staffOrTechId })
    }
  }

  // Service Records: list
  async getServiceRecords(params?: { page?: number; limit?: number }): Promise<ServiceRecordsListResponse> {
    const url = new URL(this.buildUrl("/service-records"))
    if (params?.page) url.searchParams.set("page", String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    const res = await rawFetch(url.toString(), { headers: { accept: "application/json", ...this.authHeader() } })
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    return (await res.json()) as ServiceRecordsListResponse
  }

  // Service Records: list by appointment id (helper)
  async getServiceRecordsByAppointmentId(appointmentId: string): Promise<ServiceRecordRecord[]> {
    // Try common query param names. Primary: appointment_id; Fallback: id
    const tryFetch = async (paramName: string) => {
      const url = new URL(this.buildUrl("/service-records"))
      url.searchParams.set(paramName, appointmentId)
      const res = await rawFetch(url.toString(), { headers: { accept: "application/json", ...this.authHeader() } })
      if (!res.ok) throw new Error(await safeErrorMessage(res))
      const data = (await res.json()) as ServiceRecordsListResponse
      return data.data.records || []
    }
    try {
      const records = await tryFetch("appointment_id")
      return records
    } catch {
      try {
        const records = await tryFetch("id")
        return records
      } catch (e) {
        // propagate last error
        throw e
      }
    }
  }

  // Service Records: get by id
  async getServiceRecordById(id: string): Promise<ServiceRecordRecord> {
    const res = await this.fetchJson<ServiceRecordResponse>(`/service-records/${id}`, { method: "GET" })
    return res.data
  }

  // Service Records: create
  async createServiceRecord(payload: CreateServiceRecordRequest): Promise<ServiceRecordRecord> {
    const res = await this.fetchJson<ServiceRecordResponse>(`/service-records`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  // Service Records: update (PUT)
  async updateServiceRecord(id: string, payload: UpdateServiceRecordRequest): Promise<ServiceRecordRecord> {
    const res = await this.fetchJson<ServiceRecordResponse>(`/service-records/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  // Service Records: delete
  async deleteServiceRecord(id: string): Promise<void> {
    await this.fetchJson(`/service-records/${id}`, { method: "DELETE" })
  }

  // Record Checklists: get by service record id (All roles)
  async getRecordChecklistsByRecord(recordId: string): Promise<RecordChecklistsListResponse> {
    const res = await this.fetchJson<RecordChecklistsListResponse>(`/record-checklists/by-record/${recordId}`, { method: "GET" })
    return res
  }

  // Record Checklists: assign one or multiple templates to a service record (Staff, Technician)
  async createRecordChecklists(payload: CreateRecordChecklistsRequest | CreateRecordChecklistRequest): Promise<RecordChecklistsCreateResponse> {
    return this.fetchJson(`/record-checklists`, { method: "POST", body: JSON.stringify(payload) })
  }

  // Record Checklists: update a checklist item (Technician only typically)
  async updateRecordChecklist(id: string, payload: UpdateRecordChecklistRequest): Promise<{ success: boolean; message?: string; data: RecordChecklistItem }> {
    return this.fetchJson(`/record-checklists/${id}`, { method: "PUT", body: JSON.stringify(payload) })
  }

  // Record Checklists: delete a checklist item (Admin/Staff/Technician)
  async deleteRecordChecklist(id: string): Promise<void> {
    await this.fetchJson(`/record-checklists/${id}`, { method: "DELETE" })
  }

  // Record Checklists: get all suggested parts from all checklists in a service record
  async getAllSuggestedParts(recordId: string): Promise<AllSuggestedPartsResponse> {
    return this.fetchJson(`/service-records/${recordId}/all-suggested-parts`, { method: "GET" })
  }

  // Service Checklists: get all
  async getServiceChecklists(page = 1, limit = 10): Promise<ServiceChecklistsListResponse> {
    return this.fetchJson(`/service-checklists?page=${page}&limit=${limit}`)
  }

  // Service Checklists: get by id
  async getServiceChecklistById(id: string): Promise<ServiceChecklistResponse> {
    return this.fetchJson(`/service-checklists/${id}`)
  }

  // Service Checklists: create
  async createServiceChecklist(data: CreateServiceChecklistRequest): Promise<ServiceChecklistResponse> {
    return this.fetchJson("/service-checklists", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Service Checklists: update
  async updateServiceChecklist(id: string, data: UpdateServiceChecklistRequest): Promise<ServiceChecklistResponse> {
    return this.fetchJson(`/service-checklists/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  // Service Checklists: delete
  async deleteServiceChecklist(id: string): Promise<void> {
    await this.fetchJson(`/service-checklists/${id}`, { method: "DELETE" })
  }

  // Workshifts: list
  async getWorkshifts(params?: { center_id?: string; page?: number; limit?: number }): Promise<WorkshiftRecord[]> {
    let path = "/workshifts"
    const queryParams = new URLSearchParams()
    if (params?.center_id) queryParams.set("center_id", params.center_id)
    if (params?.page) queryParams.set("page", String(params.page))
    if (params?.limit) queryParams.set("limit", String(params.limit))
    const qs = queryParams.toString()
    if (qs) path += `?${qs}`
    const res = await this.fetchJson<WorkshiftsListResponse>(path, { method: "GET" })
    return res.data
  }

  // Workshifts: get by id
  async getWorkshiftById(id: string): Promise<WorkshiftRecord> {
    const res = await this.fetchJson<WorkshiftResponse>(`/workshifts/${id}`, { method: "GET" })
    return res.data
  }

  // Workshifts: create
  // Create a single workshift (legacy)
  async createWorkshift(payload: CreateWorkshiftRequest): Promise<WorkshiftRecord> {
    const res = await this.fetchJson<WorkshiftResponse>(`/workshifts`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  // Bulk create workshifts by date range (new)
  async createWorkshiftsBulk(payload: CreateWorkshiftsBulkRequest): Promise<WorkshiftRecord[]> {
    const res = await this.fetchJson<WorkshiftsListResponse>(`/workshifts`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  // Workshifts: update (PUT per backend)
  async updateWorkshift(id: string, payload: UpdateWorkshiftRequest): Promise<WorkshiftRecord> {
    const res = await this.fetchJson<WorkshiftResponse>(`/workshifts/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  // Workshifts: delete
  async deleteWorkshift(id: string): Promise<void> {
    await this.fetchJson(`/workshifts/${id}`, { method: "DELETE" })
  }

  // Shift Assignments: assign technician to one or multiple shifts
  async assignShifts(payload: AssignShiftsRequest): Promise<ShiftAssignmentRecord[]> {
    const res = await this.fetchJson<ShiftAssignmentsListResponse>(`/shift-assignments/assign`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  // Shift Assignments: list by user
  async getShiftAssignmentsByUser(systemUserId: string): Promise<AssignedShiftInfo[]> {
    const res = await this.fetchJson<AssignedShiftsByUserResponse>(`/shift-assignments/user/${systemUserId}`, { method: "GET" })
    return res.data
  }

  // Shift Assignments: list by shift
  async getShiftAssignmentsByShift(workshiftId: string): Promise<string[]> {
    const res = await this.fetchJson<ShiftAssignmentsByShiftResponse>(`/shift-assignments/shift/${workshiftId}`, { method: "GET" })
    return res.data
  }

  // Shift Assignments: delete assignment
  async deleteShiftAssignment(id: string): Promise<void> {
    await this.fetchJson(`/shift-assignments/${id}`, { method: "DELETE" })
  }

  // Auto Parts: get all
  async getAutoParts(page = 1, limit = 10): Promise<AutoPartsListResponse> {
    return this.fetchJson(`/auto-parts?page=${page}&limit=${limit}`)
  }

  // Auto Parts: get by id
  async getAutoPartById(id: string): Promise<AutoPartResponse> {
    return this.fetchJson(`/auto-parts/${id}`)
  }

  // Auto Parts: create
  async createAutoPart(data: CreateAutoPartRequest): Promise<AutoPartResponse> {
    return this.fetchJson("/auto-parts", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Auto Parts: update
  async updateAutoPart(id: string, data: UpdateAutoPartRequest): Promise<AutoPartResponse> {
    return this.fetchJson(`/auto-parts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // Auto Parts: delete
  async deleteAutoPart(id: string): Promise<void> {
    await this.fetchJson(`/auto-parts/${id}`, { method: "DELETE" })
  }

  // Forecast: get forecast results by center
  async getForecastInfo(centerId: string): Promise<ForecastInfoResponse> {
    return this.fetchJson(`/forecast/info/${centerId}`, { method: "GET" })
  }

  // Forecast: get latest forecast for a specific part at a center
  async getForecastByCenterPart(centerId: string, partId: string, options: { limit?: number; page?: number } = {}): Promise<ForecastInfoResponse> {
    const { limit = 1, page } = options
    const url = new URL(this.buildUrl(`/forecast/info/${centerId}`))
    url.searchParams.set("part_id", partId)
    if (limit) url.searchParams.set("limit", String(limit))
    if (page) url.searchParams.set("page", String(page))
    const res = await rawFetch(url.toString(), { headers: { accept: "application/json", ...this.authHeader() } })
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    return (await res.json()) as ForecastInfoResponse
  }

  // Center Auto Parts: list
  async getCenterAutoParts(params?: { page?: number; limit?: number; center_id?: string; part_id?: string }): Promise<CenterAutoPartsListResponse> {
    const url = new URL(this.buildUrl("/center-auto-parts"))
    if (params?.page) url.searchParams.set("page", String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    if (params?.center_id) url.searchParams.set("center_id", params.center_id)
    if (params?.part_id) url.searchParams.set("part_id", params.part_id)
    const res = await rawFetch(url.toString(), { headers: { accept: "application/json", ...this.authHeader() } })
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    return (await res.json()) as CenterAutoPartsListResponse
  }

  // Center Auto Parts: get by id
  async getCenterAutoPartById(id: string): Promise<CenterAutoPartRecord> {
    const res = await this.fetchJson<CenterAutoPartResponse>(`/center-auto-parts/${id}`, { method: "GET" })
    return res.data
  }

  // Center Auto Parts: create
  async createCenterAutoPart(payload: CreateCenterAutoPartRequest): Promise<CenterAutoPartRecord> {
    const res = await this.fetchJson<CenterAutoPartResponse>(`/center-auto-parts`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  // Center Auto Parts: update (PUT)
  async updateCenterAutoPart(id: string, payload: UpdateCenterAutoPartRequest): Promise<CenterAutoPartRecord> {
    const res = await this.fetchJson<CenterAutoPartResponse>(`/center-auto-parts/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  // Center Auto Parts: delete
  async deleteCenterAutoPart(id: string): Promise<void> {
    await this.fetchJson(`/center-auto-parts/${id}`, { method: "DELETE" })
  }

  // Service Details: list
  async getServiceDetails(params?: { page?: number; limit?: number; record_id?: string; centerpart_id?: string }): Promise<ServiceDetailsListResponse> {
    const url = new URL(this.buildUrl("/service-details"))
    if (params?.page) url.searchParams.set("page", String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    if (params?.record_id) url.searchParams.set("record_id", params.record_id)
    if (params?.centerpart_id) url.searchParams.set("centerpart_id", params.centerpart_id)
    const res = await rawFetch(url.toString(), { headers: { accept: "application/json", ...this.authHeader() } })
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    return (await res.json()) as ServiceDetailsListResponse
  }

  // Service Details: get by id
  async getServiceDetailById(id: string): Promise<ServiceDetailRecord> {
    const res = await this.fetchJson<ServiceDetailResponse>(`/service-details/${id}`, { method: "GET" })
    return res.data
  }

  // Service Details: create
  async createServiceDetail(payload: CreateServiceDetailRequest): Promise<ServiceDetailRecord> {
    const res = await this.fetchJson<ServiceDetailResponse>(`/service-details`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  // Service Details: update (PUT)
  async updateServiceDetail(id: string, payload: UpdateServiceDetailRequest): Promise<ServiceDetailRecord> {
    const res = await this.fetchJson<ServiceDetailResponse>(`/service-details/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  // Service Details: delete
  async deleteServiceDetail(id: string): Promise<void> {
    await this.fetchJson(`/service-details/${id}`, { method: "DELETE" })
  }

  // Payments: create payment request (e.g., for completed service record)
  async createPayment(payload: CreatePaymentRequest): Promise<{ payment: PaymentRecord; paymentUrl?: string }> {
    const res = await this.fetchJson<{ success: boolean; message?: string; data: { payment: PaymentRecord; paymentUrl?: string } }>(`/payments`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return { payment: res.data.payment, paymentUrl: (res as any).data?.paymentUrl }
  }

  // Payments: list (Admin view only)
  async getPayments(params?: { page?: number; limit?: number }): Promise<PaymentsListResponse> {
    const url = new URL(this.buildUrl("/payments"))
    if (params?.page) url.searchParams.set("page", String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    const res = await rawFetch(url.toString(), { headers: { accept: "application/json", ...this.authHeader() } })
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    return (await res.json()) as PaymentsListResponse
  }

  // Payments: get by id
  async getPaymentById(id: string): Promise<PaymentRecord> {
    const res = await this.fetchJson<PaymentResponse>(`/payments/${id}`, { method: "GET" })
    return res.data
  }

  // Payments: get external PayOS info by orderCode
  async getPaymentInfoByOrderCode(orderCode: number | string): Promise<PaymentInfoResponse> {
    return this.fetchJson<PaymentInfoResponse>(`/payments/info/${orderCode}`, { method: "GET" })
  }

  // Payments: cancel by orderCode
  async cancelPayment(orderCode: number | string): Promise<{ success: boolean; message?: string; data?: any }> {
    return this.fetchJson<{ success: boolean; message?: string; data?: any }>(`/payments/cancel/${orderCode}`, { method: "PUT", body: JSON.stringify({}) })
  }
  // getNotifications removed: notifications now delivered only via websocket events
}

// Subscription types and APIs
export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | string

export interface VehicleSubscriptionRecord {
  _id: string
  vehicleId: string | { _id: string; vehicleName?: string; model?: string; VIN?: string; image?: string }
  package_id: string | { _id: string; name?: string; description?: string; price?: number; duration?: number; km_interval?: number }
  start_date: string
  end_date?: string
  status: SubscriptionStatus
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface VehicleSubscriptionsListResponse {
  success: boolean
  data: VehicleSubscriptionRecord[]
}

export interface VehicleSubscriptionResponse {
  success: boolean
  data: VehicleSubscriptionRecord
}

export interface CreateVehicleSubscriptionRequest {
  vehicleId: string
  package_id: string
  start_date: string // YYYY-MM-DD or ISO date
  status: SubscriptionStatus
}

export interface UpdateVehicleSubscriptionRequest {
  vehicleId?: string
  package_id?: string
  start_date?: string
  end_date?: string | null
  status?: SubscriptionStatus
}


// Payments
export type PaymentStatus = "pending" | "paid" | "cancelled" | "failed" | "expired" | "refunded" | string

export interface PaymentRecord {
  _id: string
  subscription_id?: string | VehicleSubscriptionRecord | null
  service_record_id?: string | ServiceRecordRecord | null
  appointment_id?: string | AppointmentRecord | null
  customer_id?: string | { _id: string; customerName?: string; address?: string } | null
  order_code: number
  amount: number
  description?: string
  payment_type?: "subscription" | "service_record" | "appointment" | string
  status: PaymentStatus
  payment_url?: string
  createdAt: string
  updatedAt: string
  __v?: number
}

export interface PaymentsListResponse {
  success: boolean
  data: {
    payments: PaymentRecord[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface PaymentResponse {
  success: boolean
  data: PaymentRecord
}

export interface PaymentInfoResponse {
  success: boolean
  data: {
    id: string
    orderCode: number
    amount: number
    amountPaid: number
    amountRemaining: number
    status: string
    createdAt: string
    transactions: any[]
    canceledAt: string | null
    cancellationReason: string | null
  }
}

export interface CreatePaymentRequest {
  service_record_id?: string
  subscription_id?: string
  appointment_id?: string
  customer_id?: string
  amount: number
  description?: string
  payment_type?: "service_record" | "subscription" | "appointment" | string
  returnUrl?: string
  cancelUrl?: string
}



async function safeErrorMessage(res: Response): Promise<string> {
  try {
    const j = await res.json()
    return j?.message || `${res.status} ${res.statusText}`
  } catch {
    return `${res.status} ${res.statusText}`
  }
}

// Global API client instance - will be configured with onUnauthorized in auth provider
let globalApiClient: ApiClient | null = null

export function setGlobalApiClient(client: ApiClient) {
  globalApiClient = client
}

export function getApiClient(): ApiClient {
  if (!globalApiClient) {
    // Fallback for when called outside of auth context
    globalApiClient = new ApiClient({ getTokens: loadTokens, setTokens: saveTokens })
  }
  return globalApiClient
}
