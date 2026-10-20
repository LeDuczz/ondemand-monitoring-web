import { Card, StatusBadge } from '../../../../../shared/components/ui'
import { missionRoles } from '../liveDispatchHelpers'
import type { MissionStaffRole } from '../../../../mission/types/mission'
import type { AvailableOperator } from '../../../../staff/api/operatorApi'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { staffStepMessages } from './StaffStep.messages'
import { StaffRoleCard } from './StaffRoleCard'
import { SelectedStaffChips } from './SelectedStaffChips'
import type { Mission } from '../../../../mission/types/mission'

export function StaffStep({
  current,
  scheduleText,
  missingRoles,
  staffByRole,
  operators,
  openStaffRole,
  setOpenStaffRole,
  setStaffByRole,
  setError,
  selectedStaffIds,
}: {
  current: Mission | undefined
  scheduleText: string
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
    <Card
      title={t.step1}
      actions={
        <StatusBadge tone={missingRoles === 0 ? 'success' : 'warning'}>
          {missingRoles === 0 ? t.rolesComplete : t.rolesMissing(missingRoles)}
        </StatusBadge>
      }
    >
      <div className="odm-dp-stack">
        {current && (
          <p className="odm-assign-mission">
            <strong>{current.missionCode}</strong>
            <span>{scheduleText}</span>
          </p>
        )}
        <p className="odm-dp-help">
          {t.roleHelp} {t.staffAvailabilityHint}
        </p>
        <div className="odm-dp-role-grid">
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
          <p className="odm-dp-empty">{t.noAvailableOperators}</p>
        )}
        <SelectedStaffChips
          selectedStaffIds={selectedStaffIds}
          staffByRole={staffByRole}
          operators={operators}
          setStaffByRole={setStaffByRole}
        />
      </div>
    </Card>
  )
}
