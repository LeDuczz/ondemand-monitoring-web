import { useI18n } from '../../../../../shared/i18n'
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
    <div
      style={{
        background: 'var(--sf)',
        border: '1px solid var(--bd)',
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 16,
      }}
    >
      <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>
        {t.changeRole}
      </h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {EMPLOYEE_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            className={`odm-btn ${currentRole === r ? 'odm-btn-p' : 'odm-btn-gh'}`}
            style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}
            disabled={disabled || currentRole === r}
            onClick={() => onChange(r)}
          >
            {getRoleLabel(r, lang)}
          </button>
        ))}
      </div>
    </div>
  )
}
