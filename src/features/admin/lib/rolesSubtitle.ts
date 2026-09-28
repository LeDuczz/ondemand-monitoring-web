import type { AdminRole } from '../types/roles'
import type { Language } from '../../../shared/i18n'

/** "5 vai trò · 4 vai trò hệ thống bị khoá sửa và xoá" — counted from data. */
export function rolesSubtitle(
  roles: Pick<AdminRole, 'isSystemRole'>[],
  lang: Language = 'vi',
): string {
  const total = roles.length
  const systemCount = roles.filter((r) => r.isSystemRole).length
  if (lang === 'en') {
    return `${total} roles · ${systemCount} system roles locked from edit/delete`
  }
  return `${total} vai trò · ${systemCount} vai trò hệ thống bị khoá sửa và xoá`
}
