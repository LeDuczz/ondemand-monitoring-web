import { apiRequest } from '../../../shared/api/httpClient'
import type { UserRole, AuthProvider } from '../../auth/types'

export type CurrentUserProfile = {
  id: string
  email: string
  fullName: string
  role: UserRole
  linkedProviders: AuthProvider[]
  avatarUrl?: string
  customerProfile?: {
    phoneNumber?: string
    address?: string
    companyName?: string
  }
}

export function canSetLocalPassword(profile?: CurrentUserProfile): boolean {
  return Boolean(
    profile?.linkedProviders?.includes('GOOGLE') &&
    !profile.linkedProviders.includes('LOCAL'),
  )
}

export const userProfileApi = {
  getCurrent: (signal?: AbortSignal) =>
    apiRequest<CurrentUserProfile>('/api/users/me', { signal }),
}
