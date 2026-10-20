// MNG-08: Mission list + detail panel
import { useEffect, useMemo, useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { missionsApi } from '../../api/missionsApi'
import { deliveryApi } from '../../../delivery/api'
import type { DeliveryStatus as WorkflowDeliveryStatus } from '../../../delivery/types'
import '../../manager.css'
import { useI18n } from '../../../../shared/i18n'
import { missionsPageMessages } from './MissionsPage.messages'
import { type DeliveryStatus, type StatusChip } from './missionsHelpers'
import { DetailPanel } from './components/DetailPanel'
import { MissionsStats } from './components/MissionsStats'
import { PageHeader } from '../../../../shared/components/ui'
import { StatusFilterChips } from './components/StatusFilterChips'
import { MissionsLoadError } from './components/MissionsLoadError'
import { MissionsEmptyState } from './components/MissionsEmptyState'
import { MissionsTable } from './components/MissionsTable'

type MissionsListPageProps = {
  missionId?: string
}

export function MissionsPage({ missionId }: MissionsListPageProps) {
  const { t } = useI18n(missionsPageMessages)
  const [statusFilter, setStatusFilter] = useState<StatusChip>('ALL')
  const [search, setSearch] = useState('')
  const [selectedMission, setSelectedMission] = useState<string | null>(
    missionId ?? null,
  )
  const [deliveryStatuses, setDeliveryStatuses] = useState<
    Record<string, DeliveryStatus>
  >({})

  const query = useApiQuery(
    (signal) =>
      missionsApi.listMissions({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        signal,
      }),
    [statusFilter],
  )

  const missions = useMemo(() => query.data?.items ?? [], [query.data?.items])
  const visibleMissions = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return missions
    return missions.filter((m) =>
      [m.missionCode, m.orderCode]
        .filter(Boolean)
        .some((code) => String(code).toLowerCase().includes(needle)),
    )
  }, [missions, search])
  const selected =
    missions.find((mission) => mission.id === selectedMission) ?? null
  const [orderDeliveryStatuses, setOrderDeliveryStatuses] = useState<
    Record<string, WorkflowDeliveryStatus>
  >({})
  useEffect(() => {
    let cancelled = false
    const orderIds = [...new Set(missions.map((m) => m.orderId))]
    void Promise.allSettled(
      orderIds.map(
        async (orderId) =>
          [
            orderId,
            (await deliveryApi.managerGet(orderId)).deliveryStatus,
          ] as const,
      ),
    ).then((results) => {
      if (cancelled) return
      const next: Record<string, WorkflowDeliveryStatus> = {}
      results.forEach((result) => {
        if (result.status === 'fulfilled')
          next[result.value[0]] = result.value[1]
      })
      setOrderDeliveryStatuses(next)
    })
    return () => {
      cancelled = true
    }
  }, [missions])

  useEffect(() => {
    const completed = missions.filter(
      (mission) => mission.status === 'COMPLETED',
    )
    if (completed.length === 0) {
      setDeliveryStatuses({})
      return
    }

    let cancelled = false
    setDeliveryStatuses((previous) => {
      const next = { ...previous }
      for (const mission of completed) {
        if (!next[mission.id]) next[mission.id] = 'LOADING'
      }
      return next
    })

    void Promise.allSettled(
      completed.map(async (mission) => {
        try {
          const result = await missionsApi.getMissionResult(mission.id)
          return [mission.id, result?.approvalStatus ?? 'NO_RESULT'] as const
        } catch {
          return [mission.id, 'NOT_READY'] as const
        }
      }),
    ).then((results) => {
      if (cancelled) return
      setDeliveryStatuses((previous) => {
        const next: Record<string, DeliveryStatus> = {}
        const visibleIds = new Set(missions.map((mission) => mission.id))
        for (const [missionId, status] of Object.entries(previous)) {
          if (visibleIds.has(missionId)) next[missionId] = status
        }
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            const [missionId, status] = result.value
            next[missionId] = status
          }
        })
        return next
      })
    })

    return () => {
      cancelled = true
    }
  }, [missions])

  useEffect(() => {
    if (missionId && missions.length > 0) {
      setSelectedMission(missionId)
    }
  }, [missionId, missions])

  const ready = !query.loading && !query.error
  return (
    <div className="odm-or">
      <PageHeader
        title={t.title}
        subtitle={ready ? t.missionCount(missions.length) : undefined}
      />

      {ready && missions.length > 0 && <MissionsStats missions={missions} />}

      <StatusFilterChips
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        search={search}
        setSearch={setSearch}
      />

      <div
        className={`odm-or-list-layout${selectedMission ? ' has-panel' : ''}`}
      >
        <div className="odm-or-col">
          {query.loading && (
            <div aria-busy="true">
              <span className="odm-sk" style={{ width: '100%', height: 260 }} />
            </div>
          )}

          {!query.loading && !!query.error && (
            <MissionsLoadError onRetry={query.reload} />
          )}

          {ready && visibleMissions.length === 0 && <MissionsEmptyState />}

          {ready && visibleMissions.length > 0 && (
            <MissionsTable
              missions={visibleMissions}
              selectedMission={selectedMission}
              setSelectedMission={setSelectedMission}
              deliveryStatuses={deliveryStatuses}
              orderDeliveryStatuses={orderDeliveryStatuses}
            />
          )}
        </div>

        {selected && (
          <DetailPanel
            key={selected.id}
            mission={selected}
            onClose={() => setSelectedMission(null)}
          />
        )}
      </div>
    </div>
  )
}

// Re-export missionId for ManagerApp
export type { MissionsListPageProps }
