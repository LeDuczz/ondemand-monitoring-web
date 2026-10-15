import { useState } from 'react'

import {
  EmptyState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useI18n } from '../../../../shared/i18n'
import { useActiveMission } from '../../api/useActiveMission'
import { FlightStepHeader } from '../../components/common/FlightStepper'
import { formatDeviceLabel } from '../../lib/deviceLabel'
import { postflightSummary } from '../../lib/postflightSummary'
import type { FaultType, MaintenanceSeverity } from '../../types/mission'
import { AssessmentProgress } from './components/AssessmentProgress'
import { InspectionCategories } from './components/InspectionCategories'
import { MaintenanceBanner } from './components/MaintenanceBanner'
import { MaintenanceTicketDialog } from './components/MaintenanceTicketDialog'
import { PostflightCompletedView } from './components/PostflightCompletedView'
import { PostflightErrorBanner } from './components/PostflightErrorBanner'
import { PostflightHeaderRight } from './components/PostflightHeaderRight'
import { PostflightNotes } from './components/PostflightNotes'
import { PostflightSubmitButton } from './components/PostflightSubmitButton'
import { TelemetrySummary } from './components/TelemetrySummary'
import { postflightPageMessages } from './PostflightPage.messages'
import { ALL_KEYS } from './postflightHelpers'
import { submitPostflight } from './submitPostflight'
import { usePostflightAssessment } from './usePostflightAssessment'
import { usePostflightTelemetry } from './usePostflightTelemetry'

export function PostflightPage({ missionId }: { missionId?: string }) {
  const { t } = useI18n(postflightPageMessages)
  const {
    data: activeData,
    missionId: activeId,
    loading,
    error: queryError,
    postflightMissions = [],
    selectMission,
  } = useActiveMission(missionId)

  const effectiveMissionId = activeData?.id || activeId || ''
  const missionLabel =
    activeData?.missionCode || effectiveMissionId || t.defaultMissionLabel
  const deviceId = activeData?.deviceId ?? 'DEVICE'
  const deviceLabel = activeData
    ? (formatDeviceLabel(activeData) ?? deviceId)
    : deviceId

  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [ticketSubmitting, setTicketSubmitting] = useState(false)
  const [ticketCreated, setTicketCreated] = useState(false)
  const [completed, setCompleted] = useState<{
    overallOk: boolean
    ticketCreated: boolean
    droneStatus: string
  } | null>(null)

  const {
    results,
    items,
    failItems,
    allAssessed,
    handleSetResult,
    handlePassAll,
  } = usePostflightAssessment()
  const summary = postflightSummary(items, ALL_KEYS.length)
  const telemetrySnapshot = usePostflightTelemetry(effectiveMissionId, deviceId)

  async function handleComplete() {
    if (!effectiveMissionId) {
      setError(t.noMissionId)
      return
    }
    if (!allAssessed) {
      setError(t.assessAllRequired(ALL_KEYS.length))
      return
    }

    setSaving(true)
    setError(null)

    try {
      const hasFailures = failItems.length > 0
      const targetDroneStatus = await submitPostflight({
        missionId: effectiveMissionId,
        missionLabel,
        deviceId,
        missionStatus: activeData?.status,
        results,
        hasFailures,
        notes,
        telemetrySnapshot,
      })

      setCompleted({
        overallOk: !hasFailures,
        ticketCreated: hasFailures,
        droneStatus: targetDroneStatus,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateTicket(
    _issueType: FaultType,
    _severity: MaintenanceSeverity,
    description: string,
  ) {
    setTicketSubmitting(true)
    try {
      setNotes((current) =>
        [current, `${t.incidentDetailsPrefix} ${description}`]
          .filter(Boolean)
          .join('\n'),
      )
      setShowTicketDialog(false)
      setTicketCreated(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.noteWriteFailed)
    } finally {
      setTicketSubmitting(false)
    }
  }

  if (loading) return <LoadingState />

  if (queryError || !effectiveMissionId) {
    return (
      <EmptyState
        title={t.missionNotFoundTitle}
        description={String(queryError || t.missionNotFoundDesc)}
      />
    )
  }

  if (completed) {
    return (
      <PostflightCompletedView
        completed={completed}
        missionLabel={missionLabel}
        deviceLabel={deviceLabel}
        failCount={failItems.length}
      />
    )
  }

  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title={t.stepTitle}
        missionId={missionLabel}
        active={6}
        right={
          <PostflightHeaderRight
            postflightMissions={postflightMissions}
            effectiveMissionId={effectiveMissionId}
            selectMission={selectMission}
            deviceLabel={deviceLabel}
          />
        }
      />

      <div style={{ padding: '24px 28px', maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && <PostflightErrorBanner error={error} />}

          {telemetrySnapshot && (
            <TelemetrySummary telemetrySnapshot={telemetrySnapshot} />
          )}

          <AssessmentProgress
            failCount={failItems.length}
            assessedCount={summary.nOk + failItems.length}
            totalCount={ALL_KEYS.length}
            allAssessed={allAssessed}
            onPassAll={handlePassAll}
          />

          <InspectionCategories
            results={results}
            onSetResult={handleSetResult}
          />

          <PostflightNotes notes={notes} onChange={setNotes} />

          <MaintenanceBanner
            failCount={failItems.length}
            deviceLabel={deviceLabel}
            ticketCreated={ticketCreated}
            onAddDetails={() => setShowTicketDialog(true)}
          />

          <PostflightSubmitButton
            saving={saving}
            allAssessed={allAssessed}
            failCount={failItems.length}
            onSubmit={handleComplete}
          />
        </div>
      </div>

      {showTicketDialog && (
        <MaintenanceTicketDialog
          droneCode={deviceLabel}
          missionId={missionLabel}
          defaultIssueType="PHYSICAL_DAMAGE"
          defaultDescription={t.failedItemsDescription(failItems.join(', '))}
          submitting={ticketSubmitting}
          onCancel={() => setShowTicketDialog(false)}
          onConfirm={handleCreateTicket}
        />
      )}
    </div>
  )
}
