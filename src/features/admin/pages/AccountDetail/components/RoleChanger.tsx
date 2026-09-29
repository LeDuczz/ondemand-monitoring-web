import { useI18n } from '../../../../../shared/i18n'
import { Card } from '../../../components/common/Card'
import { getRoleLabel } from '../../../lib/accountStatus'
import type { UserRole } from '../../../../auth/types'
import { roleChangerMessages } from './RoleChanger.messages'

export type EmployeeRole = Exclude<UserRole, 'CUSTOMER' | 'ADMIN'>

export const EMPLOYEE_ROLES: EmployeeRole[] = [
  'STAFF',
  'DRONE_OPERATOR',
  'SYSTEM_OPERATOR',
]

export function RoleChanger({
  currentRole,
  disabled,
  onChange,
}: {
  currentRole: UserRole
  disabled: boolean
  onChange: (role: EmployeeRole) => void
}) {
  const { t, lang } = useI18n(roleChangerMessages)

  return (
    <Card title={t.changeRole}>
      <div className="adm-row">
        {EMPLOYEE_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            className={`odm-btn ${currentRole === r ? 'odm-btn-p' : ''}`}
            disabled={disabled || currentRole === r}
            onClick={() => onChange(r)}
          >
            {getRoleLabel(r, lang)}
          </button>
        ))}
      </div>
    </Card>
  )
}
