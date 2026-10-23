// MNG-08: Mission list + detail panel
import { useEffect, useMemo, useState } from 'react'
import { StateView } from '../../../../shared/components/odm/StateView'
import {
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
  StatCard,
} from '../../../../shared/components/ui'
import { Segmented } from '../../components/layout/Segmented'
import type { MissionCalendarItem } from '../../types/missions'
import '../../components/layout/mgrLayout.css'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { missionsApi } from '../../api/missionsApi'
import type { DeliveryStatus as WorkflowDeliveryStatus } from '../../../delivery/types'
import { missionsPageMessages } from './MissionsPage.messages'
import '../../manager.css'
import { type DeliveryStatus, type StatusChip } from './missionsTypes'
import { DetailPanel } from './components/DetailPanel'
import { useMissionDeliveryStatuses } from './useMissionDeliveryStatuses'
import { MissionsTable } from './components/MissionsTable'
import { groupCounts, matchesMissionSearch } from './missionsHelpers'

type MissionsListPageProps = {
  missionId?: string
}

export function MissionsPage({ missionId }: MissionsListPageProps) {
  const { t, locale } = useI18n(missionsPageMessages)
  const [statusFilter, setStatusFilter] = useState<StatusChip>('ALL')
  const [selectedMission, setSelectedMission] = useState<string | null>(
    missionId ?? null,
  )
  const [deliveryStatuses, setDeliveryStatuses] = useState<
    Record<string, DeliveryStatus>
  >({})

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
  const missions = useMemo(() => query.data?.items ?? [], [query.data?.items])
  // KPI counts always describe the whole list, even while a status filter is applied.
  const [snapshot, setSnapshot] = useState<MissionCalendarItem[] | null>(null)
  useEffect(() => {
    if (statusFilter === 'ALL' && query.data) setSnapshot(query.data.items)
  }, [statusFilter, query.data])
  const [search, setSearch] = useState('')
  const selected =
    missions.find((mission) => mission.id === selectedMission) ?? null
  const [orderDeliveryStatuses, setOrderDeliveryStatuses] = useState<
    Record<string, WorkflowDeliveryStatus>
  >({})
  useMissionDeliveryStatuses({
    missions,
    setOrderDeliveryStatuses,
    setDeliveryStatuses,
    missionId,
    setSelectedMission,
  })

  const snapshotCounts = useMemo(
    () => groupCounts(snapshot ?? missions),
    [snapshot, missions],
  )
  const visible = useMemo(
    () => missions.filter((mission) => matchesMissionSearch(mission, search)),
    [missions, search],
  )
  const ready = !query.loading && !query.error

  return (
    <div className="odm-or mgr-page">
      <PageHeader
        title={t.title}
        subtitle={ready ? t.missionCount(missions.length) : undefined}
      />

      <div className="mgr-kpis">
        <StatCard label={t.kpis.preparing} value={snapshotCounts.preparing} />
        <StatCard
          label={t.kpis.running}
          value={snapshotCounts.running}
          tone={snapshotCounts.running > 0 ? 'success' : 'default'}
        />
        <StatCard
          label={t.kpis.review}
          value={snapshotCounts.review}
          tone={snapshotCounts.review > 0 ? 'warning' : 'default'}
        />
        <StatCard label={t.kpis.completed} value={snapshotCounts.completed} />
        <StatCard
          label={t.kpis.failed}
          value={snapshotCounts.failed}
          tone={snapshotCounts.failed > 0 ? 'danger' : 'default'}
        />
      </div>

      <div className="mgr-toolbar">
        <input
          type="search"
          className="mgr-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchAria}
        />
        <Segmented<StatusChip>
          ariaLabel={t.statusAria}
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusChips}
        />
      </div>

      <div className={`mgr-list-grid${selectedMission ? ' has-panel' : ''}`}>
        <div className="mgr-detail-main">
          {query.loading && (
            <div aria-busy="true">
              <Skeleton variant="block" height={260} />
            </div>
          )}

          {!query.loading && !!query.error && (
            <Card>
              <StateView
                state="error"
                title={t.loadError}
                error={t.loadErrorDetail}
                onRetry={query.reload}
              />
            </Card>
          )}

          {ready && visible.length === 0 && (
            <div className="ui-table-card">
              <EmptyState
                title={missions.length === 0 ? t.emptyTitle : t.emptySearch}
                description={
                  missions.length === 0 ? t.emptyDescription : undefined
                }
              />
            </div>
          )}

          {ready && visible.length > 0 && (
            <MissionsTable
              missions={visible}
              total={missions.length}
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
