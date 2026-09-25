import { useEffect, useState } from 'react'

import { missionApi } from '../../mission/api/missionApi'
import { flightControlApi } from '../omss/api/flightControlApi'
import { getActiveMissionId, setActiveMissionId, toFlightDrone, toFlightMission, type BackendMission } from '../api/liveMission'
import InFlightControlScreen from '../omss/screens/InFlightControl'
import { operatorHref } from '../routes'

const postflightTelemetryKey = (missionId: string) =>
  `fieldwise.operator.postflightTelemetry.${missionId}`

function FlightEmptyState({
  tone = 'info',
  title,
  message,
  primaryLabel = 'Về Mission của tôi',
  primaryHref = operatorHref({ screen: 'missions' }),
}: {
  tone?: 'info' | 'error' | 'loading'
  title: string
  message: string
  primaryLabel?: string
  primaryHref?: string
}) {
  const accent = tone === 'error' ? '#dc2626' : tone === 'loading' ? '#2563eb' : '#16a34a'

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background:
          'radial-gradient(circle at 18% 12%, rgba(37,99,235,.13), transparent 32%), radial-gradient(circle at 82% 20%, rgba(22,163,74,.12), transparent 30%), #f3f6fb',
      }}
    >
      <section
        style={{
          width: 'min(100%, 560px)',
          background: '#fff',
          border: '1px solid #d9e2ef',
          borderRadius: 18,
          boxShadow: '0 24px 70px rgba(15,23,42,.12)',
          padding: '34px 36px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            margin: '0 auto 18px',
            borderRadius: 20,
            display: 'grid',
            placeItems: 'center',
            color: accent,
            background: `${accent}18`,
            border: `1px solid ${accent}35`,
            fontSize: 32,
            fontWeight: 900,
          }}
          aria-hidden="true"
        >
          {tone === 'loading' ? '…' : tone === 'error' ? '!' : '◎'}
        </div>
        <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.1, color: '#07142b' }}>{title}</h1>
        <p style={{ margin: '12px auto 0', maxWidth: 430, color: '#53627a', fontSize: 15, lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={primaryHref}
            style={{
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 18px',
              borderRadius: 10,
              background: '#1f6feb',
              color: '#fff',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 12px 28px rgba(31,111,235,.24)',
            }}
          >
            {primaryLabel}
          </a>
          <a
            href={operatorHref({ screen: 'preflight' })}
            style={{
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 18px',
              borderRadius: 10,
              background: '#fff',
              color: '#1f3151',
              border: '1px solid #c8d4e6',
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            Qua Preflight
          </a>
        </div>
      </section>
    </main>
  )
}

export function ActiveFlightScreen({ missionId: routeMissionId }: { missionId?: string }) {
  const missionId = routeMissionId ?? getActiveMissionId()
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

  if (!missionId) {
    return (
      <FlightEmptyState
        title="Chưa chọn mission"
        message="Chọn một mission trong Mission của tôi trước khi mở buồng lái. Buồng lái cần mission đã được gán drone để kết nối GCS và hiển thị telemetry."
      />
    )
  }
  if (error) {
    return (
      <FlightEmptyState
        tone="error"
        title="Không mở được buồng lái"
        message={error}
        primaryLabel="Quay lại Mission"
      />
    )
  }
  if (!mission) {
    return (
      <FlightEmptyState
        tone="loading"
        title="Đang tải mission"
        message="Đang lấy thông tin mission, drone và kế hoạch bay trước khi mở buồng lái."
        primaryLabel="Mission của tôi"
      />
    )
  }
  if (!mission.droneCode) {
    return (
      <FlightEmptyState
        tone="error"
        title="Mission chưa có drone"
        message="Mission này chưa được gán drone nên chưa thể mở buồng lái. Hãy quay lại danh sách mission hoặc yêu cầu quản lý gán drone trước."
      />
    )
  }

  return (
    <InFlightControlScreen
      mission={toFlightMission(mission)}
      drone={toFlightDrone(mission)}
      autoStartPlan={autoStart}
      onAutoStartPlanConsumed={() => window.sessionStorage.removeItem('odm.operator.autoStartSimulation')}
      onReviewMedia={() => { window.location.hash = operatorHref({ screen: 'upload', missionId }) }}
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
          window.location.hash = operatorHref({ screen: 'postflight', missionId: mission.id })
        })().catch((cause) => setError(cause instanceof Error ? cause.message : 'Không chuyển được mission sang Postflight'))
      }}
      onRTB={() => {
        void missionApi.markReturning(mission.id).then(() =>
          missionApi.startPostflight(mission.id),
        ).then(() => {
          setActiveMissionId(mission.id)
          window.location.hash = operatorHref({ screen: 'postflight', missionId: mission.id })
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
