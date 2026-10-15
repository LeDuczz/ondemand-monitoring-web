import { Icon } from '../../../../../shared/components/Icon'
import {
  SafeStopRefresh,
  SafeStopSummary,
} from '../../../../mission/components/SafeStopSummary'
import { safeStopError } from '../../../../mission/lib/safeStopPresentation'
import type { RefObject } from 'react'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { SafeStop } from '../../../types/planning'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { stopIntentPanelMessages } from './StopIntentPanel.messages'

export function StopIntentPanel({
  intent,
  flowRef,
  missionCode,
  busy,
  query,
  ready,
  stop,
  requested,
  refresh,
  setIntent,
  missionId,
  triggerRef,
  reason,
  nextAction,
  setReason,
  actionReason,
  draft,
  allowed,
  command,
  message,
}: {
  intent: 'cancel' | 'replace' | null
  flowRef: RefObject<HTMLElement | null>
  missionCode: string
  busy: boolean
  query: UseApiQueryState<SafeStop>
  ready: boolean
  stop: SafeStop | undefined
  requested: boolean
  refresh: () => void
  setIntent: Dispatch<SetStateAction<'cancel' | 'replace' | null>>
  missionId: string
  triggerRef: RefObject<HTMLButtonElement | null>
  reason: string
  nextAction: 'cancel' | 'request' | 'cleanup' | null
  setReason: Dispatch<SetStateAction<string>>
  actionReason: string
  draft: boolean
  allowed: boolean
  command: (action: 'cancel' | 'request' | 'cleanup') => Promise<void>
  message: string
}) {
  const { t } = useI18n(stopIntentPanelMessages)

  return (
    <>
      {intent && (
        <section
          className="odm-manager-stop-flow mission-stop"
          ref={flowRef}
          tabIndex={-1}
          aria-label={t.dungMission(missionCode)}
          aria-busy={busy || query.loading}
        >
          <div className="mission-stop__header">
            <h4>
              <Icon name="shield" width={18} height={18} />
              {ready && stop?.canCancelMission === true && !requested
                ? t.confirmMissionCancellation
                : t.safeStopMission}
            </h4>
            <div className="mission-stop__header-actions">
              <SafeStopRefresh
                disabled={busy || query.loading}
                onClick={refresh}
              />
              <button
                className="odm-btn"
                disabled={busy}
                onClick={() => {
                  setIntent(null)
                  window.requestAnimationFrame(() => {
                    const button = document.querySelector<HTMLButtonElement>(
                      `[data-stop-trigger="${missionId}:${intent}"]`,
                    )
                    ;(button ?? triggerRef.current)?.focus()
                  })
                }}
              >
                {t.closeActionPanel}
              </button>
            </div>
          </div>
          {query.loading && <p role="status">{t.checkingStatus}</p>}
          {query.error ? (
            <p role="alert" className="mission-stop__warning">
              {safeStopError(query.error)}
            </p>
          ) : null}
          {ready && stop && (
            <>
              {stop.canCancelMission === true && !requested ? (
                <p className="mission-stop__description">
                  {t.missionCoTheDuocHuy}
                </p>
              ) : (
                <>
                  <SafeStopSummary stop={stop} actor="manager" />
                  {!requested && (
                    <p className="mission-stop__guidance">
                      {t.doiBayChiuTrachNhiem}
                    </p>
                  )}
                </>
              )}
              {intent === 'replace' && (
                <p className="mission-stop__guidance">
                  {t.afterCancellingYouCanCreate}
                </p>
              )}
              {requested ? (
                <dl className="mission-stop__reason">
                  <dt>{t.reasonForStoppingCancellingThe}</dt>
                  <dd>{stop.reason || reason || t.noReasonInformationYet}</dd>
                </dl>
              ) : (
                (nextAction === 'request' || nextAction === 'cancel') && (
                  <div className="mission-stop__form">
                    <label className="mission-stop__field">
                      {t.reasonForStoppingCancellingThe}
                      <textarea
                        maxLength={1000}
                        value={reason}
                        disabled={busy}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </label>
                  </div>
                )
              )}
              {requested && nextAction === 'cancel' && !actionReason && (
                <p className="mission-stop__warning">{t.chuaTaiDuocLyDo}</p>
              )}
              {stop.cleanedAt && stop.canCancelMission !== true && (
                <p className="mission-stop__guidance">
                  {draft ? t.chuaTheHuyMissionLuc : t.moDieuChinhKeHoach}
                </p>
              )}
              {stop.confirmedAt && !stop.cleanedAt && nextAction === null && (
                <p className="mission-stop__guidance">{t.chuaDuDieuKienGiai}</p>
              )}
              {nextAction && (
                <div className="mission-stop__actions">
                  <button
                    className={`odm-btn ${nextAction === 'cancel' ? 'odm-btn-rd' : 'odm-btn-p'}`}
                    disabled={
                      !allowed || (nextAction !== 'cleanup' && !actionReason)
                    }
                    onClick={() => void command(nextAction)}
                  >
                    {busy
                      ? t.processing
                      : {
                          request: t.requestSafeStop,
                          cleanup: t.releaseResources,
                          cancel: t.cancelMission,
                        }[nextAction]}
                  </button>
                </div>
              )}
            </>
          )}
          {message && <p role="status">{message}</p>}
        </section>
      )}
    </>
  )
}
