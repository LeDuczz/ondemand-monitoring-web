import { useState } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { missionApi } from '../../../mission/api/missionApi'
import { useActiveMission } from '../../api/useActiveMission'
import {
  backendPreflightTokenStorageKey,
  handoverAcknowledgedStorageKey,
  preflightReadyStorageKey,
} from '../../lib/flightWorkflowStorage'
import { formatDeviceLabel } from '../../lib/deviceLabel'
import { flightControlApi } from '../../api/flightControlApi'
import { operatorHref } from '../../routes'
import { FlightStepHeader } from '../../components/common/FlightStepper'
import { AckToggle } from './components/AckToggle'
import { CommitmentsCard } from './components/CommitmentsCard'
import { DroneStrip } from './components/DroneStrip'
import { HandoverActions } from './components/HandoverActions'
import { RevokedBanner } from './components/HandoverBanners'
import { handoverPageMessages } from './HandoverPage.messages'

/** OPR-05W — Bàn giao quyền điều khiển: 4 cam kết + tick tổng + xác nhận. */
export function HandoverPage({ missionId }: { missionId?: string }) {
  const mission = useActiveMission(missionId)
  const { t } = useI18n(handoverPageMessages)
  const missionLabel =
    mission.data?.missionCode ?? mission.missionId ?? t.noMissionSelected
  const deviceLabel = mission.data ? formatDeviceLabel(mission.data) : null
  const [revoked, setRevoked] = useState(false)
  const [checked, setChecked] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ])
  const [ack, setAck] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allChecked = checked.every(Boolean)
  const canConfirm = allChecked && ack && !submitting

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      const data = mission.data
      const deviceId = data?.deviceId
      if (!mission.missionId || !deviceId)
        throw new Error(t.noDroneAssignedError)
      window.sessionStorage.setItem(
        handoverAcknowledgedStorageKey(mission.missionId),
        'true',
      )
      window.localStorage.setItem(
        preflightReadyStorageKey(
          data?.missionCode ?? mission.missionId,
          deviceId,
        ),
        'true',
      )
      window.localStorage.setItem(
        preflightReadyStorageKey(mission.missionId, deviceId),
        'true',
      )

      await flightControlApi
        .bindSession(mission.missionId, deviceId)
        .catch(() => undefined)
      if (data?.status !== 'READY_TO_FLY') {
        const completedPreflight = await missionApi.runPreflightCheck(
          mission.missionId,
          deviceId,
        )
        const tokenValue = completedPreflight.flightToken?.tokenValue
        if (tokenValue) {
          window.sessionStorage.setItem(
            backendPreflightTokenStorageKey(mission.missionId, deviceId),
            tokenValue,
          )
        }
      }
      await missionApi.handoverMyMission(mission.missionId)
      const permissions = await missionApi
        .getPermissions(mission.missionId)
        .catch(() => null)
      if (permissions?.canControlFlight) {
        window.location.hash = operatorHref({
          screen: 'flight',
          missionId: mission.missionId,
        })
        return
      }
      window.location.hash = operatorHref({ screen: 'missions' })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.confirmFailed)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title={t.stepTitle}
        missionId={missionLabel}
        active={4}
      />
      <div style={{ padding: '18px 22px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <p role="alert" style={{ color: 'var(--red-fg)' }}>
              {error}
            </p>
          )}
          <DroneStrip
            missionLabel={missionLabel}
            droneLabel={deviceLabel ?? t.noDroneAssigned}
          />

          {revoked ? (
            <RevokedBanner onReconfirm={() => setRevoked(false)} />
          ) : (
            <>
              <CommitmentsCard
                checked={checked}
                onToggle={(i, value) => {
                  const next = [...checked]
                  next[i] = value
                  setChecked(next)
                }}
              />

              <AckToggle ack={ack} onToggle={() => setAck((v) => !v)} />

              <HandoverActions
                missionId={mission.missionId}
                canConfirm={canConfirm}
                submitting={submitting}
                onConfirm={handleConfirm}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
