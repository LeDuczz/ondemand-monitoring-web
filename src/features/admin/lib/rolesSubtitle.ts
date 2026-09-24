import type { AdminRole } from '../types/roles'

/** "5 vai trò · 4 vai trò hệ thống bị khoá sửa và xoá" — counted from data. */
export function rolesSubtitle(roles: Pick<AdminRole, 'isSystemRole'>[]): string {
  const total = roles.length
  const systemCount = roles.filter((r) => r.isSystemRole).length
  return `${total} vai trò · ${systemCount} vai trò hệ thống bị khoá sửa và xoá`
}
