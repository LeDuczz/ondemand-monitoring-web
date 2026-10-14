import { StatusBadge, toUiTone } from '../../../../shared/components/ui'
import {
  missionStatusLabel,
  missionStatusTone,
} from '../../../../shared/lib/statusTone'
import type { MissionResponse } from '../../types/missions'
import type { ExecutionPlan } from '../../types/planning'
import { STAFF_ROLE_LABELS } from '../missionDetail/missionDetailParts'
import { assignmentReadiness } from '../../lib/assignmentReadiness'
import { planningSchedule } from './planningSchedule'
import { useLanguage } from '../../../../shared/i18n'
import { localizePlanningScopeLabel } from './planningScopeLabel'

export function MissionSelector({
  missions,
  plan,
  selectedId,
  noChecklist,
  disabled,
  drafts,
  onSelect,
}: {
  missions: MissionResponse[]
  plan: ExecutionPlan
  selectedId?: string
  noChecklist: boolean
  disabled: boolean
  drafts: Record<string, { dirty: boolean; busy: boolean }>
  onSelect: (id: string) => void
}) {
  const { lang } = useLanguage()
  return (
    <nav className="odm-workspace-selector" aria-label="Mission trong Order">
      {missions.map((mission) => {
        const scope = plan.missions.find(
          (item) => item.missionId === mission.id,
        )
        const {
          missingRoles: missing,
          device,
          complete,
        } = assignmentReadiness(mission)
        const historical =
          !scope ||
          ['COMPLETED', 'CANCELLED', 'FAILED'].includes(mission.status)
        const count = scope?.assignmentCount ?? 0
        const checklistEditable =
          plan.planStatus === 'DRAFT' &&
          scope?.finalizedPlanRevision == null &&
          mission.status === 'RESOURCE_ASSIGNING'
        const resourcesEditable =
          plan.planStatus === 'FINALIZED' &&
          (scope?.finalizedPlanRevision ?? 0) > 0 &&
          ['RESOURCE_ASSIGNING', 'WAITING_CREW_CONFIRMATION'].includes(
            mission.status,
          )
        return (
          <button
            type="button"
            key={mission.id}
            className={`odm-workspace-choice ${selectedId === mission.id ? 'is-selected' : ''}`}
            aria-pressed={selectedId === mission.id}
            disabled={disabled}
            onClick={() => onSelect(mission.id)}
          >
            <span className="odm-workspace-choice-head">
              <strong>{mission.missionCode || 'Mission'}</strong>
              <StatusBadge
                tone={toUiTone(missionStatusTone[mission.status] ?? 'gray')}
              >
                {missionStatusLabel[mission.status] ?? 'Chưa xác định'}
              </StatusBadge>
            </span>
            <span className="odm-workspace-scope">
              {scope?.scopeLabel
                ? localizePlanningScopeLabel(scope.scopeLabel, lang)
                : 'Lịch sử nhiệm vụ'}
            </span>
            <small>
              {planningSchedule(
                mission.scheduledStartAt,
                mission.scheduledEndAt,
              )}
            </small>
            <span className="odm-workspace-plan-state">
              {historical ? 'Lịch sử · chỉ xem' : scope?.finalizedPlanRevision != null ? 'Đã chốt' : 'Đang lập kế hoạch'}
            </span>
            <span className="odm-workspace-readiness">
              <span className={count > 0 || noChecklist ? 'is-ready' : 'is-missing'}>
                {count > 0 || noChecklist ? '✓' : '!'} Checklist {noChecklist ? '—' : count}
              </span>
              <span className={device ? 'is-ready' : 'is-missing'}>
                {device ? '✓' : '!'} Thiết bị
              </span>
              <span className={!missing.length ? 'is-ready' : 'is-missing'}>
                {!missing.length ? '✓' : '!'} Nhân sự {4 - missing.length}/4
              </span>
            </span>
            {!historical && (
              <small>
                {plan.planStatus === 'DRAFT'
                  ? count > 0 || noChecklist
                    ? 'Đã phân công checklist'
                    : 'Cần phân công checklist'
                  : device && !missing.length
                    ? 'Đủ phân công tài nguyên'
                    : 'Cần bổ sung tài nguyên'}
              </small>
            )}
            {missing.length > 0 && !historical && (
              <small>
                Thiếu:{' '}
                {missing.map((role) => STAFF_ROLE_LABELS[role]).join(', ')}
              </small>
            )}
            {mission.replacesMissionId && (
              <small>
                Thay thế{' '}
                {missions.find((m) => m.id === mission.replacesMissionId)
                  ?.missionCode || 'Mission trước'}
              </small>
            )}
            {missions
              .filter((m) => m.replacesMissionId === mission.id)
              .map((m) => (
                <small key={m.id}>Được thay thế bởi {m.missionCode}</small>
              ))}
            {(drafts[mission.id]?.dirty ||
              drafts[`resources:${mission.id}`]?.dirty) && (
              <small>Thay đổi chưa lưu được giữ tại Mission này</small>
            )}
            <span className="odm-workspace-choice-action">
              {historical
                ? 'Xem lịch sử'
                : checklistEditable
                  ? 'Phân công checklist'
                  : !resourcesEditable
                    ? 'Xem phân công'
                    : complete
                      ? 'Chỉnh sửa phân công'
                      : 'Tiếp tục phân công'}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
