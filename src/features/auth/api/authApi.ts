import { env } from '../../../config/env'
import type {
  ApiResponse,
  AuthResponse,
  CreateManagedAccountRequest,
  FirstLoginPasswordChangeRequest,
  ForgotPasswordRequest,
  LoginRequest,
  ManagedAccountResponse,
  RegisterRequest,
  RegisterResponse,
  ResendOtpRequest,
  ResetPasswordRequest,
  SocialSyncRequest,
  VerifyOtpRequest,
} from '../types'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  accessToken?: string
  skipRefresh?: boolean
}

export class AuthApiError extends Error {
  readonly code?: string
  readonly errors?: Record<string, string>

  constructor(message: string, code?: string, errors?: Record<string, string>) {
    super(message)
    this.name = 'AuthApiError'
    this.code = code
    this.errors = errors
  }
}

export function getGoogleAuthorizationUrl() {
  if (!env.cognitoDomain || !env.cognitoClientId) {
    throw new AuthApiError(
      'Google sign-in is not configured. Add the Cognito domain and app client ID to the frontend environment.',
      'GOOGLE_AUTH_NOT_CONFIGURED',
    )
  }

  const redirectUri =
    env.cognitoRedirectSignIn ?? `${window.location.origin}/social/callback`
  const domain = /^https?:\/\//i.test(env.cognitoDomain)
    ? env.cognitoDomain
    : `https://${env.cognitoDomain}`
  const params = new URLSearchParams({
    client_id: env.cognitoClientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: redirectUri,
    identity_provider: 'Google',
    state: `GOOGLE:${crypto.randomUUID()}`,
  })

  return `${domain.replace(/\/$/, '')}/oauth2/authorize?${params.toString()}`
}

let refreshPromise: Promise<AuthResponse | undefined> | undefined

async function refreshAccessTokenOnce() {
  if (!refreshPromise) {
    refreshPromise = request<AuthResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      skipRefresh: true,
    })
      .then((response) => {
        authSession.updateAccessToken(response)
        return response
      })
      .catch(() => {
        authSession.clear()
        return undefined
      })
      .finally(() => {
        refreshPromise = undefined
      })
  }
  return refreshPromise
}

// Same transport choice as `src/shared/api/httpClient.ts`: mockFetch when
// `env.useMockApi` is on, otherwise the real network. Dynamic import keeps
// `src/mocks` out of the module graph unless mocking is actually used.
async function transportFetch(
  url: string,
  init: RequestInit,
): Promise<Response> {
  if (env.useMockApi) {
    const { mockFetch } = await import('../../../mocks')
    return mockFetch(url, init)
  }
  return fetch(url, init)
}

export async function authenticatedFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const request = (token?: string) => {
    const headers = new Headers(init.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return transportFetch(url, { ...init, credentials: 'include', headers })
  }

  const response = await request(authSession.getAccessToken() ?? undefined)
  if (response.status !== 401) return response

  const refreshed = await refreshAccessTokenOnce()
  if (!refreshed?.accessToken) return response
  return request(refreshed.accessToken)
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const { accessToken, skipRefresh, body, ...requestInit } = options
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  let response: Response
  try {
    response = await transportFetch(`${env.apiBaseUrl}${path}`, {
      ...requestInit,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
      headers,
    })
  } catch {
    throw new AuthApiError(
      'Unable to reach the authentication service. Please try again.',
    )
  }

  if (
    response.status === 401 &&
    !skipRefresh &&
    path !== '/api/v1/auth/refresh'
  ) {
    const refreshed = await refreshAccessTokenOnce()
    if (refreshed?.accessToken) {
      return request<T>(path, {
        ...options,
        accessToken: refreshed.accessToken,
        skipRefresh: true,
      })
    }
  }

  const payload = (await response.json().catch(() => undefined)) as
    ApiResponse<T> | undefined
  if (!response.ok || payload?.success === false) {
    const errors =
      payload?.errors && typeof payload.errors === 'object'
        ? (payload.errors as Record<string, string>)
        : undefined
    throw new AuthApiError(
      payload?.message ?? 'Something went wrong. Please try again.',
      payload?.code,
      errors,
    )
  }
  return payload?.data as T
}

export const authApi = {
  register: (body: RegisterRequest) =>
    request<RegisterResponse>('/api/v1/auth/register', {
      method: 'POST',
      body,
    }),
  verifyOtp: (body: VerifyOtpRequest) =>
    request<void>('/api/v1/auth/verify-otp', { method: 'POST', body }),
  resendOtp: (body: ResendOtpRequest) =>
    request<void>('/api/v1/auth/resend-otp', { method: 'POST', body }),
  login: (body: LoginRequest) =>
    request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body,
      skipRefresh: true,
    }),
  completeFirstLogin: (body: FirstLoginPasswordChangeRequest) =>
    request<AuthResponse>('/api/v1/auth/first-login/change-password', {
      method: 'POST',
      body,
      skipRefresh: true,
    }),
  socialSync: (body: SocialSyncRequest) =>
    request<AuthResponse>('/api/v1/auth/social/sync', { method: 'POST', body }),
  refresh: () =>
    request<AuthResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      skipRefresh: true,
    }),
  logout: (accessToken: string) =>
    request<void>('/api/v1/auth/logout', { method: 'POST', accessToken }),
  createManagedAccount: (
    body: CreateManagedAccountRequest,
    accessToken: string,
  ) =>
    request<ManagedAccountResponse>('/api/v1/admin/accounts', {
      method: 'POST',
      body,
      accessToken,
    }),
  forgotPassword: (body: ForgotPasswordRequest) =>
    request<void>('/api/v1/auth/forgot-password', { method: 'POST', body }),
  resetPassword: (body: ResetPasswordRequest) =>
    request<void>('/api/v1/auth/reset-password', { method: 'POST', body }),
}

const ACCESS_TOKEN_KEY = 'fieldwise.accessToken'
const USER_KEY = 'fieldwise.user'

const isSafeToken = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9._~-]+$/.test(value)

const sanitizeUser = (user: NonNullable<AuthResponse['user']>) => ({
  id: String(user.id),
  fullName: String(user.fullName),
  email: String(user.email),
  emailVerified: Boolean(user.emailVerified),
  role: user.role,
  linkedProviders: user.linkedProviders?.filter(
    (provider): provider is string => typeof provider === 'string',
  ),
  avatarUrl:
    typeof user.avatarUrl === 'string' && /^https?:\/\//i.test(user.avatarUrl)
      ? user.avatarUrl
      : undefined,
  isActive: Boolean(user.isActive),
})

export const authSession = {
  save(response: AuthResponse, rememberMe: boolean) {
    if (!isSafeToken(response.accessToken) || !response.user) return
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem(ACCESS_TOKEN_KEY, response.accessToken)
    storage.setItem(USER_KEY, JSON.stringify(sanitizeUser(response.user)))
  },
  updateAccessToken(response: AuthResponse) {
    if (!isSafeToken(response.accessToken)) return
    const storage = localStorage.getItem(ACCESS_TOKEN_KEY)
      ? localStorage
      : sessionStorage
    storage.setItem(ACCESS_TOKEN_KEY, response.accessToken)
  },
  getAccessToken() {
    return (
      localStorage.getItem(ACCESS_TOKEN_KEY) ??
      sessionStorage.getItem(ACCESS_TOKEN_KEY)
    )
  },
  getUser() {
    const raw =
      localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY)
    if (!raw) return undefined
    try {
      return JSON.parse(raw) as AuthResponse['user']
    } catch {
      return undefined
    }
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
  },
}
