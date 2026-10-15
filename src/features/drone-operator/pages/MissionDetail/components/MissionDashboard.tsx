import { useEffect, useState, type ReactNode } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { MissionUploadedMedia } from '../../../../media/components/MissionUploadedMedia'
import type { MissionResultApprovalStatus } from '../../../../mission/types/mission'
import type { MissionPermissions } from '../../../../mission/types/permissions'
import type { OperatorMission } from '../../../types/mission'
import { useMissionDateFormatter } from '../missionDate'
import {
  fetchLatestPostflightCheck,
  fetchLatestWeatherCheck,
  fetchPersistedPreflight,
  readStoredPreflightState,
  readStoredWeatherState,
} from '../checkData'
import type {
  PostflightCheckStatus,
  RuntimePreflightStatus,
  WeatherPreflightStatus,
} from '../types'
import { isAwaitingResponse } from '../missionResponse'
import { DecisionSummary } from './DecisionSummary'
import { DroneDeviceCard } from './DroneDeviceCard'
import { ManagerNoteCard } from './ManagerNoteCard'
import { MissionHeader } from './MissionHeader'
import { missionDashboardMessages } from './MissionDashboard.messages'
import { locationLabel, MissionInfoCard } from './MissionInfoCard'
import { missionInfoCardMessages } from './MissionInfoCard.messages'
import { MissionMapCard } from './MissionMapCard'
import { PostcheckCard } from './PostcheckCard'
import { PrecheckCard } from './PrecheckCard'
import { WeatherCard } from './WeatherCard'

export function MissionDashboard({
  mission,
  submitting,
  actionError,
  access,
  resultActions,
  monitoringSection,
  resultApprovalStatus,
  refreshWorkspace,
  mediaRevision,
  onAccept,
  onOpenReject,
}: {
  mission: OperatorMission
  submitting: boolean
  actionError: string | null
  access?: MissionPermissions
  resultActions: ReactNode
  monitoringSection: ReactNode
  resultApprovalStatus: MissionResultApprovalStatus | null
  refreshWorkspace: () => void
  mediaRevision: number
  onAccept: () => void
  onOpenReject: () => void
}) {
  const { t } = useI18n(missionDashboardMessages)
  const { t: infoT } = useI18n(missionInfoCardMessages)
  const formatDate = useMissionDateFormatter()
  const deviceId = mission.deviceId
  const [preflightStatus, setPreflightStatus] =
    useState<RuntimePreflightStatus | null>(() =>
      readStoredPreflightState(mission.id, deviceId),
    )
  const [weatherStatus, setWeatherStatus] =
    useState<WeatherPreflightStatus | null>(() =>
      readStoredWeatherState(mission.id, deviceId),
    )
  const [postflightStatus, setPostflightStatus] =
    useState<PostflightCheckStatus | null>(null)
  const [tab, setTab] = useState<'overview' | 'checks' | 'media'>('overview')
  const tabs: Array<{ id: 'overview' | 'checks' | 'media'; label: string }> = [
    { id: 'overview', label: t.tabOverview },
    { id: 'checks', label: t.tabChecks },
    ...(mission.status === 'COMPLETED' ||
    mission.backendStatus === 'PENDING_REVIEW'
      ? [{ id: 'media' as const, label: t.tabMedia }]
      : []),
  ]

  useEffect(() => {
    setPreflightStatus(readStoredPreflightState(mission.id, deviceId))
    setWeatherStatus(readStoredWeatherState(mission.id, deviceId))
    setPostflightStatus(null)
    const controller = new AbortController()
    fetchPersistedPreflight(mission.id, controller.signal)
      .then((status) => {
        if (status) setPreflightStatus(status)
      })
      .catch(() => {
        // Local precheck cache is still shown if backend history is unavailable.
      })
    fetchLatestWeatherCheck(mission.id, controller.signal)
      .then((status) => {
        if (status) setWeatherStatus(status)
      })
      .catch(() => {
        // Local weather cache is still shown if backend history is unavailable.
      })
    fetchLatestPostflightCheck(mission.id, controller.signal)
      .then((status) => {
        setPostflightStatus(status)
      })
      .catch(() => {
        setPostflightStatus(null)
      })
    return () => controller.abort()
  }, [deviceId, mission.id])

  if (isAwaitingResponse(mission)) {
    return (
      <div className="mds-pending">
        <MissionHeader mission={mission} access={access} />
        <p className="mds-meta-line">
          {[
            mission.serviceLabel,
            [formatDate(mission.date), mission.startTime]
              .filter(Boolean)
              .join(' · '),
            locationLabel(mission.location, infoT),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <DecisionSummary mission={mission} />
        {actionError ? (
          <div
            role="alert"
            style={{
              marginBottom: 12,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'var(--red-bg)',
              color: 'var(--red-fg)',
              border: '1px solid var(--red-dot)',
              fontSize: 13,
            }}
          >
            {actionError}
          </div>
        ) : null}
        <MissionMapCard mission={mission} />
        <div className="mds-tab-grid" style={{ marginTop: 16 }}>
          <div className="mds-col">
            <MissionInfoCard mission={mission} />
            {mission.managerNote ? <ManagerNoteCard mission={mission} /> : null}
          </div>
          <div className="mds-col">
            <DroneDeviceCard mission={mission} />
          </div>
        </div>
        <details className="odm-card mds-pending-checklist">
          <summary>
            {t.pendingChecklistTitle}
            <small>{t.pendingChecklistHint}</small>
          </summary>
          <div className="mds-pending-checklist-body">{monitoringSection}</div>
        </details>
        <div
          className="mds-action-bar"
          role="region"
          aria-label={t.actionBarLabel}
        >
          <div className="mds-action-bar-text">
            {t.actionBarQuestion}
            {!access?.canRespond && <small>{t.noRespondPermission}</small>}
          </div>
          <div className="mds-action-bar-buttons">
            <button
              type="button"
              className="odm-btn odm-btn-rd"
              onClick={onOpenReject}
              disabled={submitting || !access?.canRespond}
            >
              {t.reject}
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={onAccept}
              disabled={submitting || !access?.canRespond}
            >
              {submitting ? t.processing : t.acceptMission}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ── Header ── */}
      <MissionHeader mission={mission} access={access} />

      {resultActions}

      {actionError ? (
        <div
          role="alert"
          style={{
            marginBottom: 12,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--red-bg)',
            color: 'var(--red-fg)',
            border: '1px solid var(--red-dot)',
            fontSize: 13,
          }}
        >
          {actionError}
        </div>
      ) : null}

      <div className="mds-tabs" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`mds-tab${tab === item.id ? ' is-active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="mds-tab-grid">
          <div className="mds-col">
            <MissionMapCard mission={mission} />
            {monitoringSection}
          </div>
          <div className="mds-col mds-sticky-col">
            <MissionInfoCard mission={mission} />
            <DroneDeviceCard mission={mission} />
            {mission.managerNote ? <ManagerNoteCard mission={mission} /> : null}
          </div>
        </div>
      ) : null}

      {tab === 'checks' ? (
        <div className="mds-tab-grid">
          <div className="mds-col">
            <PrecheckCard preflight={preflightStatus} weather={weatherStatus} />
            <WeatherCard weather={weatherStatus} />
          </div>
          <div className="mds-col">
            <PostcheckCard postflight={postflightStatus} />
          </div>
        </div>
      ) : null}

      {tab === 'media' &&
      (mission.status === 'COMPLETED' ||
        mission.backendStatus === 'PENDING_REVIEW') ? (
        <MissionUploadedMedia
          missionId={mission.id}
          reviewStatus={resultApprovalStatus}
          onChanged={refreshWorkspace}
          refreshKey={mediaRevision}
        />
      ) : null}
    </div>
  )
}
