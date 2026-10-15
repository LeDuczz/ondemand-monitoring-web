import { missionRoles } from '../liveDispatchHelpers'
import type { MissionStaffRole } from '../../../../mission/types/mission'
import type { AvailableOperator } from '../../../../staff/api/operatorApi'
import type { Dispatch, SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { selectedStaffChipsMessages } from './SelectedStaffChips.messages'

export function SelectedStaffChips({
  selectedStaffIds,
  staffByRole,
  operators,
  setStaffByRole,
}: {
  selectedStaffIds: string[]
  staffByRole: Partial<Record<MissionStaffRole, string[]>>
  operators: { data: AvailableOperator[] | undefined; reload: () => void }
  setStaffByRole: Dispatch<
    SetStateAction<Partial<Record<MissionStaffRole, string[]>>>
  >
}) {
  const { t } = useI18n(selectedStaffChipsMessages)
  return (
    <>
      {selectedStaffIds.length > 0 && (
        <div className="odm-dp-chips">
          <strong>{t.selectedStaff}</strong>
          {missionRoles.flatMap((role) =>
            (staffByRole[role] ?? []).map((selectedId) => {
              const staff = (operators.data ?? []).find(
                (item) => item.id === selectedId,
              )
              if (!staff) return null
              return (
                <span key={`${role}-${selectedId}`} className="odm-dp-chip">
                  <b>{t.roles[role]}</b>
                  {staff.fullName}
                  <button
                    type="button"
                    onClick={() =>
                      setStaffByRole((cur) => ({
                        ...cur,
                        [role]: (cur[role] ?? []).filter(
                          (id) => id !== selectedId,
                        ),
                      }))
                    }
                    aria-label={`${t.clearStaff} ${staff.fullName}`}
                  >
                    ×
                  </button>
                </span>
              )
            }),
          )}
          <button
            type="button"
            className="odm-dp-link"
            onClick={() => setStaffByRole({})}
          >
            {t.clearAll}
          </button>
        </div>
      )}
    </>
  )
}
