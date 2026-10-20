import { useI18n } from '../../../../../shared/i18n'
import type { MissionChecklistExecution } from '../../../../mission/types/checklistExecution'
import { mediaAttachChecklistMessages } from './MediaAttachChecklist.messages'

/** Checklist items a media file can be attached to as evidence. */
export function MediaAttachChecklist({
  executions,
  selectedIds,
  isBusy,
  canAttach,
  onToggle,
  onAttach,
}: {
  executions: MissionChecklistExecution[]
  selectedIds: string[]
  isBusy: boolean
  canAttach: boolean
  onToggle: (executionId: string, checked: boolean) => void
  onAttach: () => void
}) {
  const { t } = useI18n(mediaAttachChecklistMessages)
  const targetCount = selectedIds.length
  return (
    <details className="upload-media-attach-wrap" open={targetCount > 0}>
      <summary>
        {t.attachToChecklist}
        {targetCount > 0 && (
          <span className="upload-media-chip">
            {t.attachSelected(targetCount)}
          </span>
        )}
      </summary>
      <fieldset disabled={isBusy} className="upload-media-attach">
        {executions.map((execution) => (
          <label key={execution.id} className="upload-media-attach-row">
            <input
              type="checkbox"
              checked={selectedIds.includes(execution.id)}
              onChange={(event) => onToggle(execution.id, event.target.checked)}
            />
            <span>{execution.content}</span>
            <em>
              {execution.eligibleEvidenceCount ?? 0}/
              {execution.minimumEvidenceCount ?? 0}
            </em>
          </label>
        ))}
        {canAttach && (
          <button
            type="button"
            className="odm-btn upload-media-attach-button"
            disabled={isBusy || !targetCount}
            onClick={onAttach}
          >
            {t.attachEvidence}
          </button>
        )}
      </fieldset>
    </details>
  )
}
