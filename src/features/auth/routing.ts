import { authSession } from './api/authApi'
import type { UserRole } from './types'

export const roleHomePaths: Record<UserRole, string> = {
  CUSTOMER: '#portal/customer',
  STAFF: '#portal/staff',
  DRONE_OPERATOR: '#portal/drone-operator',
  SYSTEM_OPERATOR: '#portal/system-operator',
  ADMIN: '#portal/admin',
  AUDITOR: '#portal/admin',
}

export function getRoleHomePath(role?: UserRole) {
  return role ? roleHomePaths[role] : '#auth/login'
}

export function getRoleHomeUrl(
  role?: UserRole,
  origin = window.location.origin,
) {
  return `${origin.replace(/\/$/, '')}/${getRoleHomePath(role)}`
}

export function redirectToRoleHome(role?: UserRole) {
  window.location.hash = getRoleHomePath(role)
}

export function getStoredRole() {
  return authSession.getUser()?.role
}
