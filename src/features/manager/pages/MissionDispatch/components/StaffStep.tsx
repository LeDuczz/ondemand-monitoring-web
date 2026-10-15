import { OrderIcon } from '../../../components/common/OrderIcon'
import { missionRoles } from '../liveDispatchHelpers'
import type { MissionStaffRole } from '../../../../mission/types/mission'
import type { AvailableOperator } from '../../../../staff/api/operatorApi'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { staffStepMessages } from './StaffStep.messages'
import { StaffRoleCard } from './StaffRoleCard'
import { SelectedStaffChips } from './SelectedStaffChips'

export function StaffStep({
  missingRoles,
  staffByRole,
  operators,
  openStaffRole,
  setOpenStaffRole,
  setStaffByRole,
  setError,
  selectedStaffIds,
}: {
  missingRoles: number
  staffByRole: Partial<Record<MissionStaffRole, string[]>>
  operators: { data: AvailableOperator[] | undefined; reload: () => void }
  openStaffRole: MissionStaffRole | null
  setOpenStaffRole: Dispatch<SetStateAction<MissionStaffRole | null>>
  setStaffByRole: Dispatch<
    SetStateAction<Partial<Record<MissionStaffRole, string[]>>>
  >
  setError: Dispatch<SetStateAction<string | null>>
  selectedStaffIds: string[]
}) {
  const { t } = useI18n(staffStepMessages)
  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="users" size={18} />
          {t.step1}
        </span>
        <span
          className={`odm-or-pill ${missingRoles === 0 ? 'odm-or-pill-green' : 'odm-or-pill-amber'}`}
        >
          {missingRoles === 0 ? t.rolesComplete : t.rolesMissing(missingRoles)}
        </span>
      </header>
      <div className="odm-or-card-body" style={{ display: 'grid', gap: 14 }}>
        <p className="odm-or-muted" style={{ margin: 0 }}>
          {t.roleHelp} {t.staffAvailabilityHint}
        </p>
        <div className="odm-or-role-grid">
          {missionRoles.map((role) => {
            const selected = staffByRole[role] ?? []
            return (
              <StaffRoleCard
                key={role}
                role={role}
                selected={selected}
                operators={operators}
                staffByRole={staffByRole}
                openStaffRole={openStaffRole}
                setOpenStaffRole={setOpenStaffRole}
                setStaffByRole={setStaffByRole}
                setError={setError}
              />
            )
          })}
        </div>
        {!operators.data?.length && (
          <p className="odm-or-empty">{t.noAvailableOperators}</p>
        )}
        <SelectedStaffChips
          selectedStaffIds={selectedStaffIds}
          staffByRole={staffByRole}
          operators={operators}
          setStaffByRole={setStaffByRole}
        />
      </div>
    </section>
  )
}
