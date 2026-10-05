import { useMissionMonitoring } from '../../mission/hooks/useMissionMonitoring'
import { MonitoringChecklistSection } from '../../mission/components/MonitoringChecklistSection'

/** Same execution contract as Mission Detail; media upload remains a separate operation. */
export function UploadMonitoringChecklist({
  missionId,
  revision,
}: {
  missionId: string
  revision: number
}) {
  const query = useMissionMonitoring(missionId, revision)
  return (
    <MonitoringChecklistSection
      missionId={missionId}
      data={query.data?.checklist}
      loading={query.loading}
      error={query.error}
      resultKnown={!query.loading && !query.error && Boolean(query.data)}
      resultStatus={query.data?.result?.approvalStatus}
      resultNote={query.data?.result?.reviewNote}
      canExecute={query.data?.permissions.canExecuteMonitoringChecklist}
      refresh={query.reload}
    />
  )
}
