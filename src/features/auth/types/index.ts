export type UserRole =
  'CUSTOMER' | 'STAFF' | 'DRONE_OPERATOR' | 'SYSTEM_OPERATOR' | 'ADMIN'

export type AuthProvider = 'LOCAL' | 'GOOGLE'
export type SocialAuthIntent = 'LOGIN_ONLY' | 'LOGIN_OR_REGISTER'

export type RegisterRequest = {
  email: string
  password: string
  fullName: string
  role: UserRole
}

export type LoginRequest = {
  email: string
  password: string
  portalRole?: UserRole
}

export type VerifyOtpRequest = { email: string; otpCode: string }
export type ResendOtpRequest = { email: string }
export type ForgotPasswordRequest = { email: string }
export type ResetPasswordRequest = {
  email: string
  otpCode: string
  newPassword: string
}

export type SocialSyncRequest = {
  code: string
  redirectUri: string
  intent?: SocialAuthIntent
  provider?: AuthProvider
}

export type UserProfile = {
  id: string
  fullName: string
  email: string
  emailVerified: boolean
  role: UserRole
  linkedProviders?: string[]
  avatarUrl?: string
  isActive: boolean
}

export type RegisterResponse = { otpRequired: boolean }
export type AuthResponse = {
  accessToken: string
  tokenType: string
  expiresIn?: number
  user?: UserProfile
}

export type ApiResponse<T> = {
  success: boolean
  code?: string
  message?: string
  data?: T
  errors?: Record<string, string> | unknown
  timestamp?: string
}
