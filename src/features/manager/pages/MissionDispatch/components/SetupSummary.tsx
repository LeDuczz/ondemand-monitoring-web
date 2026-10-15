import { managerHref } from '../../../routes'
import type { Mission, ResourceSuggestions } from '../../../types/missions'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { setupSummaryMessages } from './SetupSummary.messages'

export function SetupSummary({
  setupMode,
  mission,
  suggestions,
  assignedStaffCount,
  bothAssigned,
  setToast,
}: {
  setupMode: boolean
  mission: Mission
  suggestions: ResourceSuggestions
  assignedStaffCount: 0 | 1
  bothAssigned: boolean
  setToast: Dispatch<SetStateAction<string | null>>
}) {
  const { t } = useI18n(setupSummaryMessages)

  return setupMode ? (
    <div className="odm-mgr-setup-summary">
      <div>
        <div style={{ fontWeight: 700 }}>{mission.missionCode}</div>
        <div className="odm-mgr-review-hint">
          {suggestions.scheduledStart} ·{' '}
          {mission.droneId ? '1 Drone' : t.noDroneSelected} ·{' '}
          {assignedStaffCount}
          {t.n1StaffSlot}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a className="odm-btn" href={managerHref({ screen: 'missions' })}>
          {t.back}
        </a>
        <button
          type="button"
          className="odm-btn odm-btn-ok"
          disabled={!bothAssigned}
          onClick={() => setToast(t.phanCongThanhCongMission)}
        >
          {t.confirmAssignment}
        </button>
      </div>
    </div>
  ) : null
}
