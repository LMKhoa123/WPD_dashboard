
export type ApiRole = "ADMIN" | "STAFF" | string

export interface LoginRequest {
  email: string
  password: string
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
    role: "ADMIN" | "STAFF"
  }
  name: string
  dateOfBirth: string | null
  certification: string
  isOnline: boolean
  createdAt: string
  updatedAt: string
  __v: number
}

export interface ProfileResponse {
  success: boolean
  message: string
  data: ProfileData
}

export interface UpdateProfileRequest {
  name?: string
  dateOfBirth?: string | null
  certification?: string
}

export interface UpdateProfileResponse {
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
  role: "ADMIN" | "STAFF" | "CUSTOMER" | string
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

// Customers
export interface CustomerRecord {
  _id: string
  userId: { _id: string; role: "CUSTOMER" } | null
  customerName: string
  address: string
  deviceTokens?: string[]
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
  userId: string | { _id: string; email: string; role: "ADMIN" | "STAFF"; phone?: string }
  name: string
  dateOfBirth: string | null
  certification: string
  isOnline: boolean
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
export type AppointmentStatus = "scheduled" | "in-progress" | "confirmed" | "completed" | "cancelled" | string

export interface AppointmentRecord {
  _id: string
  staffId: string | { _id: string; name?: string; email?: string }
  customer_id: string | null | { _id: string; customerName?: string }
  vehicle_id: string | { _id: string; vehicleName?: string; model?: string; mileage?: number; plateNumber?: string }
  center_id: string | { _id: string; name?: string; address?: string; phone?: string }
  startTime: string
  endTime: string
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

export interface UpdateAppointmentRequest {
  staffId?: string
  customer_id?: string | null
  vehicle_id?: string
  center_id?: string
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

// Service Checklist types
export type ServiceChecklistStatus = "pending" | "in_progress" | "completed"

export interface ServiceChecklistRecord {
  _id: string
  record_id: string | ServiceRecordRecord
  name: string
  status: ServiceChecklistStatus
  note?: string
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
  data: ServiceChecklistRecord
}

export interface CreateServiceChecklistRequest {
  record_id: string
  name: string
  status: ServiceChecklistStatus
  note?: string
}

export interface UpdateServiceChecklistRequest {
  record_id?: string
  name?: string
  status?: ServiceChecklistStatus
  note?: string
}

// Auto Parts types
export interface AutoPartRecord {
  _id: string
  name: string
  quantity: number
  cost_price: number
  selling_price: number
  min_stock: number
  recommended_min_stock: number
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
  quantity: number
  cost_price: number
  selling_price: number
  min_stock: number
  recommended_min_stock: number
  last_forecast_date?: string
}

export interface UpdateAutoPartRequest {
  name?: string
  quantity?: number
  cost_price?: number
  selling_price?: number
  min_stock?: number
  recommended_min_stock?: number
  last_forecast_date?: string
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
  } catch {}
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

  async login(payload: LoginRequest): Promise<LoginResponse> {
    // Use rawFetch for login (no auth required)
    const res = await rawFetch(this.buildUrl("/auth/login"), {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json", accept: "application/json" },
    })
    
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
    // Use rawFetch for register (no auth required)
    const res = await rawFetch(this.buildUrl("/auth/register"), {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json", accept: "application/json" },
    })
    
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

  async updateProfile(payload: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    return this.fetchJson<UpdateProfileResponse>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    })
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

  async getCustomers(params?: { page?: number; limit?: number }): Promise<CustomersListResponse> {
    const url = new URL(this.buildUrl("/customers"))
    if (params?.page) url.searchParams.set("page", String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    const res = await rawFetch(url.toString(), { headers: { accept: "application/json", ...this.authHeader() } })
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    return (await res.json()) as CustomersListResponse
  }

  async updateCustomer(customerId: string, payload: { customerName?: string; address?: string }): Promise<CustomerRecord> {
    const res = await this.fetchJson<{ success: boolean; data: CustomerRecord }>(`/customers/${customerId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  async deleteCustomer(customerId: string): Promise<void> {
    await this.fetchJson(`/customers/${customerId}`, { method: "DELETE" })
  }

  async getSystemUsers(params?: { page?: number; limit?: number }): Promise<SystemUsersListResponse> {
    const url = new URL(this.buildUrl("/system-users"))
    if (params?.page) url.searchParams.set("page", String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
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

  async getVehicles(params?: { page?: number; limit?: number }): Promise<VehicleRecord[]> {
    const url = new URL(this.buildUrl("/vehicles"))
    if (params?.page) url.searchParams.set("page", String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
    const res = await rawFetch(url.toString(), { headers: { accept: "application/json", ...this.authHeader() } })
    if (!res.ok) throw new Error(await safeErrorMessage(res))
    const data = (await res.json()) as VehiclesListResponse
    return data.data
  }

  // Create a new vehicle with multipart/form-data (supports image upload)
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

  // Get vehicle details by ID
  async getVehicleById(vehicleId: string): Promise<VehicleRecord> {
    const res = await this.fetchJson<CreateVehicleResponse>(`/vehicles/${vehicleId}`, { method: "GET" })
    return res.data
  }

  // Get vehicles by customer ID
  async getVehiclesByCustomerId(customerId: string): Promise<VehicleRecord[]> {
    const res = await this.fetchJson<VehiclesListResponse>(`/vehicles/customer/${customerId}`, { method: "GET" })
    return res.data
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
  async takeConversation(conversationId: string, staffId: string): Promise<{ success: boolean; message?: string }>{
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
  async sendStaffMessage(conversationId: string, payload: { staffId: string; content: string; attachment?: string | null }): Promise<{ success: boolean }>{
    return this.fetchJson<{ success: boolean }>(`/chat/${conversationId}/staff-message`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  // Chat: mark messages as read
  async markConversationRead(conversationId: string): Promise<{ success: boolean }>{
    return this.fetchJson<{ success: boolean }>(`/chat/${conversationId}/mark-read`, { method: "POST", body: JSON.stringify({}) })
  }

  // Chat: close conversation
  async closeConversation(conversationId: string): Promise<{ success: boolean }>{
    return this.fetchJson<{ success: boolean }>(`/chat/${conversationId}/close`, { method: "POST", body: JSON.stringify({}) })
  }

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

  // Service Centers: create
  async createCenter(payload: CreateCenterRequest): Promise<CenterRecord> {
    const res = await this.fetchJson<CenterResponse>(`/centers`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  // Service Centers: update (PUT)
  async updateCenter(id: string, payload: UpdateCenterRequest): Promise<CenterRecord> {
    const res = await this.fetchJson<CenterResponse>(`/centers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    return res.data
  }

  // Service Centers: delete
  async deleteCenter(id: string): Promise<void> {
    await this.fetchJson(`/centers/${id}`, { method: "DELETE" })
  }

  // Appointments: list
  async getAppointments(params?: { page?: number; limit?: number }): Promise<AppointmentsListResponse> {
    const url = new URL(this.buildUrl("/appointments"))
    if (params?.page) url.searchParams.set("page", String(params.page))
    if (params?.limit) url.searchParams.set("limit", String(params.limit))
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
  async createAppointment(payload: CreateAppointmentRequest): Promise<AppointmentRecord> {
    const res = await this.fetchJson<AppointmentResponse>(`/appointments`, {
      method: "POST",
      body: JSON.stringify(payload),
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

  // Appointments: delete
  async deleteAppointment(id: string): Promise<void> {
    await this.fetchJson(`/appointments/${id}`, { method: "DELETE" })
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
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // Service Checklists: delete
  async deleteServiceChecklist(id: string): Promise<void> {
    await this.fetchJson(`/service-checklists/${id}`, { method: "DELETE" })
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
}

// Subscription types and APIs
export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | string

export interface VehicleSubscriptionRecord {
  _id: string
  vehicleId: string | { _id: string; vehicleName?: string; model?: string; VIN?: string }
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
