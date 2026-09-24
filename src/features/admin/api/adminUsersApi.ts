import { apiRequest } from '../../../shared/api/httpClient'

export type AdminUserResponse = {
  id: string
  email: string
  fullName: string
  role: string
  status: string
  createdAt: string
  updatedAt: string
}

export type CreateAccountRequest = {
  email: string
  fullName: string
  role: string
  password: string
}

export const adminUsersApi = {
  /** `GET /api/v1/admin/users` [BE]. */
  listUsers(signal?: AbortSignal): Promise<AdminUserResponse[]> {
    return apiRequest<AdminUserResponse[]>('/api/v1/admin/users', { signal })
  },
  /** `GET /api/v1/admin/users/{userId}` [BE]. */
  getUser(userId: string, signal?: AbortSignal): Promise<AdminUserResponse> {
    return apiRequest<AdminUserResponse>(`/api/v1/admin/users/${userId}`, { signal })
  },
  /** `PATCH /api/v1/admin/users/{userId}/status` [BE]. */
  updateUserStatus(userId: string, status: string): Promise<AdminUserResponse> {
    return apiRequest<AdminUserResponse>(`/api/v1/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: { status },
    })
  },
  /** `POST /api/v1/admin/accounts` [BE]. */
  createAccount(data: CreateAccountRequest): Promise<AdminUserResponse> {
    return apiRequest<AdminUserResponse>('/api/v1/admin/accounts', {
      method: 'POST',
      body: data,
    })
  },
}
