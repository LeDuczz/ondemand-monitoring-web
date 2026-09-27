import { useState } from 'react'

import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { missionApi } from '../../mission/api/missionApi'
import { droneApi } from '../../staff/api/droneApi'
import { operatorApi } from '../../staff/api/operatorApi'
import { managerHref } from '../routes'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'

/** Real resource assignment in the existing manager shell; no invented ranking data. */
export function LiveDispatchPage({ missionId }: { missionId: string }) {
  const { t } = useI18n(liveDispatchPageMessages)
  const mission = useApiQuery(
    () => missionApi.getMissionById(missionId),
    [missionId],
  )
  const drones = useApiQuery(() => droneApi.getAvailable(), [missionId])
  const operators = useApiQuery(() => operatorApi.getAvailable(), [missionId])
  const [droneId, setDroneId] = useState('')
  const [operatorId, setOperatorId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function assign() {
    if (!droneId || !operatorId) {
      setError(t.selectDroneAndOperator)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await missionApi.assignResources(missionId, droneId, operatorId)
      mission.reload()
      drones.reload()
      operators.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.assignFailed)
    } finally {
      setBusy(false)
    }
  }

  if (mission.loading || drones.loading || operators.loading) {
    return <div className="odm-mgr-dash">{t.loadingResources}</div>
  }
  if (mission.error || drones.error || operators.error || !mission.data) {
    return (
      <StateView
        state="error"
        title={t.loadError}
        error={mission.error ?? drones.error ?? operators.error}
        onRetry={() => {
          mission.reload()
          drones.reload()
          operators.reload()
        }}
      />
    )
  }

  const current = mission.data
  const assignable =
    current.status === 'RESOURCE_ASSIGNING' || current.status === 'CREATED'
  return (
    <div className="odm-mgr-dash">
      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">{t.title}</h1>
          <div className="odm-mgr-dash-date">
            {t.missionSummary(
              current.missionCode,
              current.orderTitle ?? current.orderId ?? '',
            )}
          </div>
        </div>
        <a className="odm-btn" href={managerHref({ screen: 'orderQueue' })}>
          {t.backToQueue}
        </a>
      </div>
      <div className="odm-card" style={{ marginBottom: 14 }}>
        <div className="odm-card-header">
          {t.missionHeader(current.missionCode)}
        </div>
        <div className="odm-card-body odm-mgr-review-location-grid">
          <div>
            <div className="odm-mgr-review-hint">{t.customer}</div>
            {current.customerName ?? '—'}
          </div>
          <div>
            <div className="odm-mgr-review-hint">{t.location}</div>
            {current.address ?? '—'}
          </div>
          <div>
            <div className="odm-mgr-review-hint">{t.status}</div>
            {current.status}
          </div>
        </div>
      </div>
      {!assignable ? (
        <div className="odm-card">
          <div className="odm-card-body">
            {t.alreadyAssigned(
              current.droneCode ?? '—',
              current.operatorId ?? '—',
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="odm-card" style={{ marginBottom: 14 }}>
            <div className="odm-card-header">{t.step1}</div>
            <div className="odm-card-body">
              <select
                className="odm-inp"
                aria-label={t.chooseDroneAria}
                value={droneId}
                onChange={(event) => setDroneId(event.target.value)}
              >
                <option value="">{t.chooseDroneOption}</option>
                {(drones.data ?? []).map((drone) => (
                  <option key={drone.id} value={drone.id}>
                    {drone.label}
                  </option>
                ))}
              </select>
              {!drones.data?.length && <p>{t.noAvailableDrones}</p>}
            </div>
          </div>
          <div className="odm-card" style={{ marginBottom: 14 }}>
            <div className="odm-card-header">{t.step2}</div>
            <div className="odm-card-body">
              <select
                className="odm-inp"
                aria-label={t.chooseOperatorAria}
                value={operatorId}
                onChange={(event) => setOperatorId(event.target.value)}
              >
                <option value="">{t.chooseOperatorOption}</option>
                {(operators.data ?? []).map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {operator.fullName} ({operator.email})
                  </option>
                ))}
              </select>
              {!operators.data?.length && <p>{t.noAvailableOperators}</p>}
            </div>
          </div>
          {error && (
            <div role="alert" className="odm-mgr-modal-error">
              {error}
            </div>
          )}
          <div className="odm-mgr-dispatch-bottombar">
            <span style={{ flex: 1 }}>{t.footerHint}</span>
            <button
              type="button"
              className="odm-btn odm-btn-ok"
              disabled={busy || !droneId || !operatorId}
              onClick={() => void assign()}
            >
              {busy ? t.assigning : t.assign}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
