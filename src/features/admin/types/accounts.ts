import type { UserRole } from '../../auth/types'

export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING'

export type AdminAccountItem = {
  id: string
  fullName: string
  email: string
  role: UserRole
  status: AccountStatus
  emailVerified: boolean
  createdAt: string
  lastLoginAt: string | null
}

export type AdminAccountDetail = AdminAccountItem & {
  linkedProviders: string[]
  avatarUrl: string | null
}

export type AdminDashboard = {
  totalAccounts: number
  activeAccounts: number
  pendingAccounts: number
  inactiveAccounts: number
  byRole: Record<string, number>
  recentAccounts: AdminAccountItem[]
}

export type CreateAdminAccountPayload = {
  fullName: string
  email: string
  role: Exclude<UserRole, 'CUSTOMER' | 'ADMIN'>
}

export type UpdateAccountPayload = {
  fullName?: string
  role?: UserRole
}
