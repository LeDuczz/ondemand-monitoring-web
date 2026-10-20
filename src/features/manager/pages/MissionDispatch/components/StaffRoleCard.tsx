import { OrderIcon } from '../../../components/common/OrderIcon'
import { StaffCombobox } from './StaffCombobox'
import { missionRoles } from '../liveDispatchHelpers'
import type { MissionStaffRole } from '../../../../mission/types/mission'
import type { AvailableOperator } from '../../../../staff/api/operatorApi'
import type { Dispatch, SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { staffRoleCardMessages } from './StaffRoleCard.messages'

export function StaffRoleCard({
  role,
  selected,
  operators,
  staffByRole,
  openStaffRole,
  setOpenStaffRole,
  setStaffByRole,
  setError,
}: {
  role: MissionStaffRole
  selected: string[]
  operators: { data: AvailableOperator[] | undefined; reload: () => void }
  staffByRole: Partial<Record<MissionStaffRole, string[]>>
  openStaffRole: MissionStaffRole | null
  setOpenStaffRole: Dispatch<SetStateAction<MissionStaffRole | null>>
  setStaffByRole: Dispatch<
    SetStateAction<Partial<Record<MissionStaffRole, string[]>>>
  >
  setError: Dispatch<SetStateAction<string | null>>
}) {
  const { t } = useI18n(staffRoleCardMessages)
  return (
    <section
      className={`odm-dp-role${selected.length > 0 ? ' is-filled' : ''}`}
    >
      <span className="odm-dp-role-head">
        <span>{t.roles[role]}</span>
        {selected.length > 0 && (
          <span className="odm-dp-check">
            <OrderIcon name="check" size={14} />
          </span>
        )}
      </span>
      <span className="odm-dp-role-desc">{t.roleDescriptions[role]}</span>
      {selected.length > 0 &&
        missionRoles.some(
          (other) => (staffByRole[other] ?? []).length === 0,
        ) && (
          <button
            type="button"
            className="odm-or-link-btn odm-or-bulk-assign"
            onClick={() => {
              setStaffByRole(
                Object.fromEntries(
                  missionRoles.map((other) => [
                    other,
                    (staffByRole[other] ?? []).length > 0
                      ? staffByRole[other]
                      : [selected[0]],
                  ]),
                ) as typeof staffByRole,
              )
              setError(null)
            }}
          >
            {t.useForEmptyRoles}
          </button>
        )}
      <StaffCombobox
        role={role}
        staff={operators.data ?? []}
        selectedIds={selected}
        staffByRole={staffByRole}
        open={openStaffRole === role}
        onOpen={() => setOpenStaffRole(role)}
        onClose={() => setOpenStaffRole(null)}
        onToggle={(staffId) => {
          setStaffByRole((cur) => {
            const currentIds = cur[role] ?? []
            const nextRoleStaff = currentIds.includes(staffId)
              ? currentIds.filter((id) => id !== staffId)
              : [...currentIds, staffId]
            return { ...cur, [role]: nextRoleStaff }
          })
          setError(null)
        }}
        onRemove={(staffId) => {
          setStaffByRole((cur) => ({
            ...cur,
            [role]: (cur[role] ?? []).filter((id) => id !== staffId),
          }))
          setError(null)
        }}
      />
    </section>
  )
}
