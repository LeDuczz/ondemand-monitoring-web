import { apiRequest } from '../../../shared/api/httpClient'
import type { CustomerProfileResponse, ManagedUserRole } from './adminUsersApi'

// DTOs mirror UserProfileResponse / UserProfileUpdateRequest in the BE OpenAPI.
export type UserProfileResponse = {
  id: string
  fullName: string
  email: string
  role: ManagedUserRole
  avatarUrl?: string
  customerProfile?: CustomerProfileResponse
}

export type UserProfileUpdateRequest = {
  fullName?: string
  phoneNumber?: string
  address?: string
  companyName?: string
}

export const userProfileApi = {
  /** `GET /api/users/me` [BE]. */
  getMe(signal?: AbortSignal) {
    return apiRequest<UserProfileResponse>('/api/users/me', { signal })
  },
  /** `PATCH /api/users/me` [BE]: only edits the signed-in user. */
  updateMe(body: UserProfileUpdateRequest) {
    return apiRequest<UserProfileResponse>('/api/users/me', {
      method: 'PATCH',
      body,
    })
  },
}
