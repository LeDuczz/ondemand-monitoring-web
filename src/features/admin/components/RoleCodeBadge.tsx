import type { UserRole } from '../../auth/types'

export function RoleCodeBadge({ role }: { role: UserRole }) {
  return <span className="odm-mono odm-adm-rolechip">{role}</span>
}
