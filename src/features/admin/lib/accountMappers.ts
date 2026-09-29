import type {
  UserManagementDetailResponse,
  UserManagementSummaryResponse,
} from '../api/adminUsersApi'
import type {
  AccountStatus,
  AdminAccountDetail,
  AdminAccountItem,
} from '../types/accounts'

// The backend only exposes `active`; PENDING is not representable there, so
// accounts map to ACTIVE / INACTIVE and `emailVerified` carries the rest.
export function mapAccountStatus(active: boolean): AccountStatus {
  return active ? 'ACTIVE' : 'INACTIVE'
}

export function mapUserSummary(
  dto: UserManagementSummaryResponse,
): AdminAccountItem {
  return {
    id: dto.id,
    fullName: dto.fullName,
    email: dto.email,
    role: dto.role,
    status: mapAccountStatus(dto.active),
    emailVerified: dto.emailVerified,
    createdAt: dto.createdAt,
    lastLoginAt: dto.lastLoginAt ?? null,
    // TODO(BE): certificate expiry is not provided by the backend.
    certExpiry: null,
  }
}

export function mapUserDetail(
  dto: UserManagementDetailResponse,
): AdminAccountDetail {
  return {
    ...mapUserSummary(dto),
    linkedProviders: dto.linkedProviders ?? [],
    // TODO(BE): avatar is not provided by the backend.
    avatarUrl: null,
  }
}
