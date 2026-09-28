// MNG-08: Mission list + detail panel
import { useEffect, useState } from 'react'
import { env } from '../../../config/env'

import { ApiError } from '../../../shared/api/httpClient'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { missionStatusTone } from '../../../shared/lib/statusTone'
import type { MissionStatus } from '../../../shared/types/domain'
import { missionsApi } from '../api/missionsApi'
import { managerHref } from '../routes'
import { missionsListPageMessages } from './MissionsListPage.messages'
import type { MissionCalendarItem } from '../types/missions'
import '../manager.css'

type StatusChip = 'ALL' | MissionStatus

type PageMessages = (typeof missionsListPageMessages)['vi']

function formatScheduled(
  start: string | null,
  end: string | null,
  locale: 'vi-VN' | 'en-US',
): string {
  if (!start) return '—'
  const d = new Date(start)
  const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
  const startTime = d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  if (!end) return `${dateStr} ${startTime}`
  const endD = new Date(end)
  const endTime = endD.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${dateStr} ${startTime}–${endTime}`
}

type DetailPanelProps = {
  mission: MissionCalendarItem
  onClose: () => void
  onRetried: (newId: string) => void
  t: PageMessages
  locale: 'vi-VN' | 'en-US'
}

function DetailPanel({
  mission,
  onClose,
  onRetried,
  t,
  locale,
}: DetailPanelProps) {
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)

  async function handleRetry() {
    setRetrying(true)
    setRetryError(null)
    try {
      const result = await missionsApi.retryMission(mission.id)
      onRetried(result.newMissionId)
    } catch (e) {
      setRetryError(e instanceof Error ? e.message : t.retryError)
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div
      style={{
        width: 360,
        borderLeft: '1px solid var(--border)',
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          {mission.missionCode}
        </span>
        <button
          type="button"
          className="odm-btn"
          onClick={onClose}
          aria-label={t.close}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <StatusBadge
          kind="mission"
          status={mission.status}
          tone={missionStatusTone[mission.status]}
        />
        {(mission.status === 'CREATED' ||
          mission.status === 'RESOURCE_ASSIGNING') && (
          <a
            href={managerHref({
              screen: 'missionDispatch',
              missionId: mission.id,
            })}
            className="odm-btn odm-btn-p odm-btn-sm"
          >
            {t.dispatch}
          </a>
        )}
      </div>

      <div
        style={{
          fontSize: 13,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {mission.orderCode && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>{t.fields.order} </span>
            <span>{mission.orderCode}</span>
          </div>
        )}
        {mission.serviceLabel && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>{t.fields.service} </span>
            <span>{mission.serviceLabel}</span>
          </div>
        )}
        <div>
          <span style={{ color: 'var(--tx3)' }}>{t.fields.attempt} </span>
          <span>#{mission.attemptNumber ?? 1}</span>
        </div>
        <div>
          <span style={{ color: 'var(--tx3)' }}>{t.fields.schedule} </span>
          <span>
            {formatScheduled(
              mission.scheduledStartAt,
              mission.scheduledEndAt,
              locale,
            )}
          </span>
        </div>
        {mission.droneCode && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>{t.fields.drone} </span>
            <span>
              {mission.droneCode}
              {mission.droneName ? ` ${mission.droneName}` : ''}
            </span>
          </div>
        )}
        {mission.operatorName && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>{t.fields.operator} </span>
            <span>{mission.operatorName}</span>
          </div>
        )}
        {mission.addressText && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>{t.fields.address} </span>
            <span>{mission.addressText}</span>
          </div>
        )}
      </div>

      {mission.status === 'FAILED' && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {retryError && (
            <div style={{ color: 'var(--red-fg)', fontSize: 12 }}>
              {retryError}
            </div>
          )}
          <button
            type="button"
            className="odm-btn odm-btn-p"
            disabled={
              retrying || (!env.useMockApi && import.meta.env.MODE !== 'test')
            }
            title={
              !env.useMockApi && import.meta.env.MODE !== 'test'
                ? t.backendNotSupported
                : undefined
            }
            onClick={handleRetry}
          >
            {retrying ? t.retrying : t.retry}
          </button>
        </div>
      )}
    </div>
  )
}

type MissionsListPageProps = {
  missionId?: string
}

export function MissionsListPage({ missionId }: MissionsListPageProps) {
  const { t, locale } = useI18n(missionsListPageMessages)
  const [statusFilter, setStatusFilter] = useState<StatusChip>('ALL')
  const [selectedMission, setSelectedMission] =
    useState<MissionCalendarItem | null>(null)

  const statusChips: Array<{ value: StatusChip; label: string }> = [
    { value: 'ALL', label: t.statusChips.ALL },
    { value: 'IN_FLIGHT', label: t.statusChips.IN_FLIGHT },
    { value: 'COMPLETED', label: t.statusChips.COMPLETED },
    { value: 'FAILED', label: t.statusChips.FAILED },
    { value: 'CREATED', label: t.statusChips.CREATED },
  ]

  const query = useApiQuery(
    (signal) =>
      missionsApi.listMissions({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        signal,
      }),
    [statusFilter],
  )

  const missions = query.data?.items ?? []

  useEffect(() => {
    if (missionId && missions.length > 0) {
      const found = missions.find((m) => m.id === missionId) ?? null
      setSelectedMission(found)
    }
  }, [missionId, missions])

  function handleRetried(newId: string) {
    query.reload()
    alert(t.retriedAlert(newId))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">{t.title}</h1>
          <div className="odm-mgr-dash-date">
            {!query.loading && !query.error
              ? t.missionCount(missions.length)
              : ' '}
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div
        style={{ display: 'flex', gap: 6, padding: '8px 0', flexWrap: 'wrap' }}
      >
        {statusChips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className={`odm-chip${statusFilter === chip.value ? ' odm-chip-active' : ''}`}
            onClick={() => setStatusFilter(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Table area */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {query.loading && (
            <div
              style={{ padding: 40, textAlign: 'center', color: 'var(--tx3)' }}
              aria-busy="true"
            >
              <div
                className="odm-sk"
                style={{ height: 300, borderRadius: 8 }}
              />
            </div>
          )}

          {!query.loading && !!query.error && (
            <div style={{ padding: 24 }}>
              <StateView
                state="error"
                title={t.loadError}
                error={query.error}
                onRetry={query.reload}
              />
              {query.error instanceof ApiError && (
                <code
                  className="odm-mono"
                  style={{
                    display: 'block',
                    fontSize: 11,
                    color: 'var(--tx3)',
                    marginTop: 8,
                  }}
                >
                  GET /api/missions · {query.error.status ?? '—'}
                </code>
              )}
            </div>
          )}

          {!query.loading && !query.error && missions.length === 0 && (
            <StateView
              state="empty"
              title={t.emptyTitle}
              description={t.emptyDescription}
            />
          )}

          {!query.loading && !query.error && missions.length > 0 && (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--tx3)',
                    textAlign: 'left',
                  }}
                >
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                    {t.columns.mission}
                  </th>
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                    {t.columns.order}
                  </th>
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                    {t.columns.attempt}
                  </th>
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                    {t.columns.schedule}
                  </th>
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                    {t.columns.drone}
                  </th>
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                    {t.columns.operator}
                  </th>
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                    {t.columns.status}
                  </th>
                </tr>
              </thead>
              <tbody>
                {missions.map((m) => (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      background:
                        selectedMission?.id === m.id ? 'var(--bg2)' : undefined,
                    }}
                    onClick={() =>
                      setSelectedMission(
                        selectedMission?.id === m.id ? null : m,
                      )
                    }
                  >
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>
                      {m.missionCode}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
                      {m.orderCode ?? '—'}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
                      #{m.attemptNumber ?? 1}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
                      {formatScheduled(
                        m.scheduledStartAt,
                        m.scheduledEndAt,
                        locale,
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
                      {m.droneCode
                        ? `${m.droneCode}${m.droneName ? ` ${m.droneName}` : ''}`
                        : '—'}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
                      {m.operatorName ?? '—'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <StatusBadge
                        kind="mission"
                        status={m.status}
                        tone={missionStatusTone[m.status]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail side panel */}
        {selectedMission && (
          <DetailPanel
            key={selectedMission.id}
            mission={selectedMission}
            onClose={() => setSelectedMission(null)}
            onRetried={handleRetried}
            t={t}
            locale={locale}
          />
        )}
      </div>
    </div>
  )
}

// Re-export missionId for ManagerApp
export type { MissionsListPageProps }
