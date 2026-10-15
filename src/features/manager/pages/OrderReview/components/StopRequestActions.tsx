import type { SafeStop } from '../../../types/planning'
import type { RefObject } from 'react'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { stopRequestActionsMessages } from './StopRequestActions.messages'

export function StopRequestActions({
  writable,
  ready,
  intent,
  stop,
  requested,
  relevant,
  missionId,
  allowed,
  triggerRef,
  setIntent,
  query,
  missionCode,
  draft,
}: {
  writable: boolean
  ready: boolean
  intent: 'cancel' | 'replace' | null
  stop: SafeStop | undefined
  requested: boolean
  relevant: boolean
  missionId: string
  allowed: boolean
  triggerRef: RefObject<HTMLButtonElement | null>
  setIntent: Dispatch<SetStateAction<'cancel' | 'replace' | null>>
  query: UseApiQueryState<SafeStop>
  missionCode: string
  draft: boolean
}) {
  const { t } = useI18n(stopRequestActionsMessages)

  return (
    <>
      {writable && ready && !intent && (
        <div className="odm-mission-actions">
          {(stop?.canCancelMission !== true || requested) && relevant && (
            <button
              className="odm-btn odm-btn-danger-soft"
              data-stop-trigger={`${missionId}:cancel`}
              disabled={!allowed}
              onClick={(event) => {
                triggerRef.current = event.currentTarget
                setIntent('cancel')
                query.reload()
              }}
            >
              {t.cancelMission}
              {missionCode}
            </button>
          )}
          {draft && (stop?.canCancelMission === true || relevant) && (
            <button
              className="odm-btn odm-btn-secondary-soft"
              data-stop-trigger={`${missionId}:replace`}
              disabled={!allowed}
              onClick={(event) => {
                triggerRef.current = event.currentTarget
                setIntent('replace')
                query.reload()
              }}
            >
              {t.replaceMission}
              {missionCode}
            </button>
          )}
        </div>
      )}
    </>
  )
}
