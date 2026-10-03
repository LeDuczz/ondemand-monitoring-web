import { SYSTEM_ROLES, EMPLOYEE_ROLES } from '../../auth/roles'
import { apiRequest } from '../../../shared/api/httpClient'

// DTOs mirror the backend OpenAPI schemas (http://localhost:8080/v3/api-docs).
// Single source of truth for role lists (filters, create form, badges). The
// backend has no roles endpoint: this mirrors the enum in its OpenAPI schema.
export const BE_USER_ROLES = SYSTEM_ROLES

export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number]

export type ManagedUserRole = (typeof BE_USER_ROLES)[number]

export type UserManagementSummaryResponse = {
  id: string
  fullName: string
  email: string
  role: ManagedUserRole
  active: boolean
  emailVerified: boolean
  createdAt: string
  lastLoginAt?: string
}

export type CustomerProfileResponse = {
  phoneNumber?: string
  address?: string
  companyName?: string
}

export type UserManagementDetailResponse = UserManagementSummaryResponse & {
  updatedAt?: string
  linkedProviders?: Array<'LOCAL' | 'GOOGLE'>
  customerProfile?: CustomerProfileResponse
}

export type PageResponse<T> = {
  items: T[]
  page: number
  size: number
  totalItems: number
  totalPages: number
  first: boolean
  last: boolean
}

export type UserStatusUpdateRequest = { active: boolean }

export type CreateManagedAccountRequest = {
  email: string
  fullName: string
  role: EmployeeRole
}

export type ManagedAccountResponse = {
  email: string
  role: ManagedUserRole
  invitationSent: boolean
  passwordChangeRequired: boolean
}

export type ListUsersParams = {
  page?: number
  size?: number
  sort?: string
  search?: string
  role?: ManagedUserRole
  active?: boolean
  emailVerified?: boolean
  signal?: AbortSignal
}

export const adminUsersApi = {
  /** `GET /api/admin/users` [BE]. */
  listUsers({ signal, ...query }: ListUsersParams = {}) {
    return apiRequest<PageResponse<UserManagementSummaryResponse>>(
      '/api/admin/users',
      { query, signal },
    )
  },
  /** `GET /api/admin/users/{userId}` [BE]. */
  getUser(userId: string, signal?: AbortSignal) {
    return apiRequest<UserManagementDetailResponse>(
      `/api/admin/users/${encodeURIComponent(userId)}`,
      { signal },
    )
  },
  /** `PATCH /api/admin/users/{userId}/status` [BE]. */
  updateUserStatus(userId: string, body: UserStatusUpdateRequest) {
    return apiRequest<UserManagementDetailResponse>(
      `/api/admin/users/${encodeURIComponent(userId)}/status`,
      { method: 'PATCH', body },
    )
  },
  /** `POST /api/admin/accounts` [BE]. */
  createAccount(body: CreateManagedAccountRequest) {
    return apiRequest<ManagedAccountResponse>('/api/admin/accounts', {
      method: 'POST',
      body,
    })
  },
}
