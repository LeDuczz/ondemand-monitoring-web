import type {
  MissionCalendarItem,
  LiveTelemetry,
} from '../../../types/missions'
import { useState, useRef, useCallback, useEffect } from 'react'
import { ApiError } from '../../../../../shared/api/httpClient'
import { missionsApi } from '../../../api/missionsApi'
import { POLL_INTERVAL_MS } from '../liveHelpers'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import { MapPlaceholder } from './MapPlaceholder'
import { IncidentModal } from './IncidentModal'
import { CancelModal } from './CancelModal'
import { LiveTopBar } from './LiveTopBar'
import { LiveActions } from './LiveActions'
import { TelemetryErrorBanner } from './TelemetryErrorBanner'
import { TelemetryPanel } from './TelemetryPanel'
import { LivestreamBlock } from './LivestreamBlock'
import { IncidentLog } from './IncidentLog'

export function LiveMainPanel({
  mission,
  onCancelled,
}: {
  mission: MissionCalendarItem
  onCancelled: () => void
}) {
  const [telemetry, setTelemetry] = useState<LiveTelemetry | null>(null)
  const [telemetryError, setTelemetryError] = useState<ApiError | null>(null)
  const [showIncidentModal, setShowIncidentModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const liveRequest = useRef<AbortController | null>(null)

  const fetchLive = useCallback(async () => {
    liveRequest.current?.abort()
    const abort = new AbortController()
    liveRequest.current = abort
    try {
      const data = await missionsApi.getLive(mission.id, abort.signal)
      if (abort.signal.aborted) return
      setTelemetry(data)
      setTelemetryError(null)
    } catch (err) {
      if (abort.signal.aborted) return
      if (err instanceof ApiError) setTelemetryError(err)
    }
  }, [mission.id])

  useEffect(() => {
    fetchLive()
    intervalRef.current = setInterval(fetchLive, POLL_INTERVAL_MS)
    return () => {
      liveRequest.current?.abort()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchLive])

  const tone = missionStatusTone[mission.status] ?? 'gray'

  return (
    <>
      <LiveTopBar mission={mission} tone={tone} />

      <TelemetryErrorBanner
        telemetryError={telemetryError}
        mission={mission}
        fetchLive={fetchLive}
      />

      <div className="odm-live-media">
        <MapPlaceholder
          lat={telemetry?.latitude ?? mission.centerLat ?? null}
          lon={telemetry?.longitude ?? mission.centerLon ?? null}
          missionCode={mission.missionCode}
        />
        <LivestreamBlock telemetry={telemetry} />
      </div>

      <TelemetryPanel telemetry={telemetry} />

      <IncidentLog telemetry={telemetry} />

      <LiveActions
        setShowIncidentModal={setShowIncidentModal}
        setShowCancelModal={setShowCancelModal}
      />

      {/* Modals */}
      {showIncidentModal && (
        <IncidentModal
          missionId={mission.id}
          onClose={() => setShowIncidentModal(false)}
          onCreated={() => {
            setShowIncidentModal(false)
            fetchLive()
          }}
        />
      )}
      {showCancelModal && (
        <CancelModal
          mission={mission}
          onClose={() => setShowCancelModal(false)}
          onCancelled={() => {
            setShowCancelModal(false)
            onCancelled()
          }}
        />
      )}
    </>
  )
}
