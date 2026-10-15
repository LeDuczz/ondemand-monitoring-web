import { useEffect, useState } from 'react'
import { Icon } from '../../../../shared/components/Icon'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import {
  SafeStopRefresh,
  SafeStopSummary,
} from '../../../mission/components/SafeStopSummary'
import {
  hasStopRequest,
  managerStopAction,
  safeStopError,
} from '../../../mission/lib/safeStopPresentation'
import { planningApi } from '../../api/planningApi'
import { useI18n } from '../../../../shared/i18n'
import { safeStopPanelMessages } from './SafeStopPanel.messages'

export function SafeStopPanel({
  missionId,
  revision,
  manager = false,
  onChanged,
  onCapabilitiesChanged,
}: {
  missionId: string
  revision?: number
  manager?: boolean
  onChanged: () => void
  onCapabilitiesChanged?: (missionId: string, canCancel: boolean) => void
}) {
  const { t } = useI18n(safeStopPanelMessages)

  const query = useApiQuery(
    (signal) => planningApi.getSafeStop(missionId, signal),
    [missionId, revision],
  )
  const [reason, setReason] = useState('')
  const [attested, setAttested] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const stop = query.data
  const ready = !query.loading && !query.error && stop?.missionId === missionId
  const managerAction = ready ? managerStopAction(stop) : null
  const canConfirm =
    ready &&
    !manager &&
    stop.canConfirmSafeStop === true &&
    !stop.confirmedAt &&
    !stop.cleanedAt
  useEffect(() => {
    onCapabilitiesChanged?.(missionId, ready && stop?.canCancelMission === true)
  }, [missionId, ready, stop, onCapabilitiesChanged])
  function refresh() {
    query.reload()
    onChanged()
  }
  async function command(action: 'request' | 'confirm' | 'cleanup') {
    if (busy || !ready) return
    if (action === 'confirm' && (!canConfirm || !attested || !reason.trim()))
      return
    if (action !== 'confirm' && (!manager || managerAction !== action)) return
    if (action === 'request' && (revision === undefined || !reason.trim()))
      return
    setBusy(true)
    setMessage('')
    try {
      if (action === 'request')
        await planningApi.requestSafeStop(missionId, {
          expectedPlanRevision: revision!,
          reason: reason.trim(),
        })
      if (action === 'confirm')
        await planningApi.confirmSafeStop(missionId, reason.trim())
      if (action === 'cleanup') await planningApi.cleanupSafeStop(missionId)
      setMessage(
        action === 'confirm' ? t.safetyConfirmationSent : t.actionRecorded,
      )
      setAttested(false)
    } catch (error) {
      setMessage(safeStopError(error))
    } finally {
      refresh()
      setBusy(false)
    }
  }
  return (
    <section
      className="mission-stop"
      aria-label={t.dungMissionAnToan(missionId)}
      aria-busy={busy || query.loading}
    >
      <div className="mission-stop__header">
        <h4>
          <Icon name="shield" width={18} height={18} />
          {t.dungMissionAnToan2}
        </h4>
        <SafeStopRefresh disabled={busy || query.loading} onClick={refresh} />
      </div>
      {query.loading && <p role="status">{t.loadingStatus}</p>}
      {query.error ? (
        <p role="alert" className="mission-stop__warning">
          {safeStopError(query.error)}
        </p>
      ) : null}
      {!query.loading && !query.error && !ready && (
        <p role="alert">{t.khongTheXacMinhTrang}</p>
      )}
      {ready && (
        <>
          <SafeStopSummary stop={stop} actor={manager ? 'manager' : 'staff'} />
          {stop.reason && (
            <dl className="mission-stop__reason">
              <dt>{t.reasonForStoppingCancellingThe}</dt>
              <dd>{stop.reason}</dd>
            </dl>
          )}
          {stop.confirmedAt && stop.confirmation && (
            <dl className="mission-stop__reason">
              <dt>{t.safetyRecord}</dt>
              <dd>{stop.confirmation}</dd>
            </dl>
          )}
          {!manager &&
            !stop.confirmedAt &&
            !stop.cleanedAt &&
            hasStopRequest(stop) &&
            !canConfirm && (
              <p className="mission-stop__guidance">{t.dangChoNguoiDuocPhan}</p>
            )}
          {manager && managerAction === 'request' && revision !== undefined && (
            <form
              className="mission-stop__form"
              onSubmit={(e) => {
                e.preventDefault()
                void command('request')
              }}
            >
              <label>
                {t.reasonForStoppingCancellingThe}
                <textarea
                  maxLength={1000}
                  required
                  value={reason}
                  disabled={busy}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <div className="mission-stop__actions">
                <button
                  className="odm-btn odm-btn-p"
                  disabled={busy || !reason.trim()}
                >
                  {t.requestSafeStop}
                </button>
              </div>
            </form>
          )}
          {canConfirm && (
            <form
              className="mission-stop__form"
              onSubmit={(e) => {
                e.preventDefault()
                void command('confirm')
              }}
            >
              <p className="mission-stop__guidance">{t.chiXacNhanSauKhi}</p>
              <label>
                {t.safetyRecord}
                <textarea
                  required
                  maxLength={1000}
                  value={reason}
                  disabled={busy}
                  placeholder={t.describeTheSafetyStatusYou}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <label className="mission-stop__attestation">
                <input
                  type="checkbox"
                  required
                  checked={attested}
                  disabled={busy}
                  onChange={(e) => setAttested(e.target.checked)}
                />
                {t.toiDaKiemTraDrone}
              </label>
              <div className="mission-stop__actions">
                <button
                  className="odm-btn odm-btn-p"
                  disabled={busy || !attested || !reason.trim()}
                >
                  {t.confirmSafe}
                </button>
              </div>
            </form>
          )}
          {manager && managerAction === 'cleanup' && (
            <div className="mission-stop__actions">
              <button
                type="button"
                className="odm-btn odm-btn-p"
                disabled={busy}
                onClick={() => {
                  if (window.confirm(t.releaseThisMissionSDevices))
                    void command('cleanup')
                }}
              >
                {t.releaseResources}
              </button>
            </div>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  )
}
