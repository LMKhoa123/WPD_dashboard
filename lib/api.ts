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

const API_BASE = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
  "https://ev-maintenance-9bd58b96744e.herokuapp.com/api"

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

  constructor(opts?: { baseUrl?: string; getTokens?: () => Tokens | null; setTokens?: (t: Tokens | null) => void }) {
    this.baseUrl = (opts?.baseUrl || API_BASE).replace(/\/$/, "")
    this.getTokens = opts?.getTokens || loadTokens
    this.setTokens = opts?.setTokens || saveTokens
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
        throw new Error("Unauthorized")
      }
    }

    if (!res.ok) {
      const msg = await safeErrorMessage(res)
      throw new Error(msg)
    }
    return (await res.json()) as T
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
    if (!tokens?.refreshToken) throw new Error("No refresh token")
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
}

async function safeErrorMessage(res: Response): Promise<string> {
  try {
    const j = await res.json()
    return j?.message || `${res.status} ${res.statusText}`
  } catch {
    return `${res.status} ${res.statusText}`
  }
}
