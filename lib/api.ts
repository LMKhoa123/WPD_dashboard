// Centralized API client for auth and authenticated requests
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
  // epoch ms when access token expires
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

// Ensure API_BASE is always a string to avoid type issues
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
    // Clear tokens
    this.setTokens(null)
    // Call the unauthorized callback if provided
    if (this.onUnauthorized) {
      this.onUnauthorized()
    }
  }

  async login(payload: LoginRequest): Promise<LoginResponse> {
    const data = await this.fetchJson<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json", accept: "application/json" },
    })
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
    return this.fetchJson<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async refreshToken(): Promise<RefreshResponse> {
    const tokens = this.getTokens()
    if (!tokens?.refreshToken) {
      this.handleUnauthorized()
      throw new Error("No refresh token")
    }
    
    try {
      const data = await this.fetchJson<RefreshResponse>("/auth/refresh-token", {
        method: "POST",
        body: JSON.stringify({ refreshToken: tokens.refreshToken } satisfies RefreshRequest),
      }, false)

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
    }
  }

  async logout(): Promise<void> {
    try {
      await this.fetchJson("/auth/logout", { method: "POST" }, false)
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
