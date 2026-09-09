import { env } from '../../../config/env'
import type {
  ApiResponse,
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
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

async function request<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body !== undefined)
    headers.set('Content-Type', 'application/json')
  if (options.accessToken)
    headers.set('Authorization', `Bearer ${options.accessToken}`)

  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...options,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: 'include',
      headers,
    })
  } catch {
    throw new AuthApiError(
      'Unable to reach the authentication service. Please try again.',
    )
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
    request<AuthResponse>('/api/v1/auth/login', { method: 'POST', body }),
  socialSync: (body: SocialSyncRequest) =>
    request<AuthResponse>('/api/v1/auth/social/sync', { method: 'POST', body }),
  refresh: () =>
    request<AuthResponse>('/api/v1/auth/refresh', { method: 'POST' }),
  logout: (accessToken: string) =>
    request<void>('/api/v1/auth/logout', { method: 'POST', accessToken }),
  forgotPassword: (body: ForgotPasswordRequest) =>
    request<void>('/api/v1/auth/forgot-password', { method: 'POST', body }),
  resetPassword: (body: ResetPasswordRequest) =>
    request<void>('/api/v1/auth/reset-password', { method: 'POST', body }),
}

const ACCESS_TOKEN_KEY = 'fieldwise.accessToken'
const USER_KEY = 'fieldwise.user'

export const authSession = {
  save(response: AuthResponse, rememberMe: boolean) {
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem(ACCESS_TOKEN_KEY, response.accessToken)
    if (response.user) storage.setItem(USER_KEY, JSON.stringify(response.user))
  },
  getAccessToken() {
    return (
      localStorage.getItem(ACCESS_TOKEN_KEY) ??
      sessionStorage.getItem(ACCESS_TOKEN_KEY)
    )
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
  },
}
