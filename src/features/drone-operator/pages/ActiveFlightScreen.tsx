import { useEffect, useState } from 'react'

import { missionApi } from '../../mission/api/missionApi'
import { flightControlApi } from '../omss/api/flightControlApi'
import { getActiveMissionId, setActiveMissionId, toFlightDrone, toFlightMission, type BackendMission } from '../api/liveMission'
import InFlightControlScreen from '../omss/screens/InFlightControl'
import { operatorHref } from '../routes'

const postflightTelemetryKey = (missionId: string) =>
  `fieldwise.operator.postflightTelemetry.${missionId}`

export function ActiveFlightScreen() {
  const missionId = getActiveMissionId()
  const [mission, setMission] = useState<BackendMission | null>(null)
  const [error, setError] = useState<string | null>(null)
  const autoStart = window.sessionStorage.getItem('odm.operator.autoStartSimulation') === 'true'

  useEffect(() => {
    if (!missionId) return
    let active = true
    void missionApi.getMissionById(missionId).then((result) => {
      if (active) setMission(result as BackendMission)
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Không tải được mission')
    })
    return () => { active = false }
  }, [missionId])

  if (!missionId) return <p>Chọn mission trong “Mission của tôi” trước khi mở buồng lái.</p>
  if (error) return <p role="alert">{error}</p>
  if (!mission) return <p>Đang tải mission…</p>
  if (!mission.droneCode) return <p role="alert">Mission chưa được gán drone.</p>

  return (
    <InFlightControlScreen
      mission={toFlightMission(mission)}
      drone={toFlightDrone(mission)}
      autoStartPlan={autoStart}
      onAutoStartPlanConsumed={() => window.sessionStorage.removeItem('odm.operator.autoStartSimulation')}
      onReviewMedia={() => { window.location.hash = operatorHref({ screen: 'upload' }) }}
      onCompleteMission={() => {
        void (async () => {
          const telemetrySnapshot = await flightControlApi.status().catch(() => null)
          if (telemetrySnapshot) {
            window.sessionStorage.setItem(
              postflightTelemetryKey(mission.id),
              JSON.stringify(telemetrySnapshot),
            )
          }
          if (mission.status === 'IN_FLIGHT' || mission.status === 'IN_PROGRESS') {
            await missionApi.markReturning(mission.id)
          }
          await missionApi.startPostflight(mission.id)
          setActiveMissionId(mission.id)
          window.location.hash = operatorHref({ screen: 'postflight' })
        })().catch((cause) => setError(cause instanceof Error ? cause.message : 'Không chuyển được mission sang Postflight'))
      }}
      onRTB={() => {
        void missionApi.markReturning(mission.id).then(() =>
          missionApi.startPostflight(mission.id),
        ).then(() => {
          setActiveMissionId(mission.id)
          window.location.hash = operatorHref({ screen: 'postflight' })
        }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Không chuyển được mission sang RETURNING'))
      }}
      onEmergency={() => {
        const reason = window.prompt('Lý do kết thúc khẩn cấp')
        if (!reason?.trim()) return
        void missionApi.failMission(mission.id, reason.trim()).catch((cause) =>
          setError(cause instanceof Error ? cause.message : 'Không cập nhật được mission'))
      }}
    />
  )
}
