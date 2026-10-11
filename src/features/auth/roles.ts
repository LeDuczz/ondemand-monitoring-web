import type { UserRole } from './types'

export const SYSTEM_ROLES = ['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER'] as const
export const EMPLOYEE_ROLES = ['MANAGER', 'STAFF'] as const

export function isUserRole(role: unknown): role is UserRole {
  return (
    typeof role === 'string' && SYSTEM_ROLES.some((known) => known === role)
  )
}
