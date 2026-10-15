import { useState } from 'react'

import { useI18n } from '../../../../shared/i18n'
import type { LocalMedia } from '../../../media/api/operatorMediaApi'
import { MissionUploadedMedia } from '../../../media/components/MissionUploadedMedia'
import { MonitoringChecklistSection } from '../../../mission/components/MonitoringChecklistSection'
import { FlightStepHeader } from '../../components/common/FlightStepper'
import { MissionResultActions } from '../../components/common/MissionResultActions'
import { MediaFileTable } from './components/MediaFileTable'
import { MediaPanel } from './components/MediaPanel'
import { PreviewLightbox } from './components/PreviewLightbox'
import { UploadMediaActions } from './components/UploadMediaActions'
import { UploadMediaNotices } from './components/UploadMediaNotices'
import { UploadProgressSummary } from './components/UploadProgressSummary'
import { uploadMediaPageMessages } from './UploadMediaPage.messages'
import { useUploadMedia } from './useUploadMedia'
import './UploadMediaPage.css'

/** Existing upload layout backed by the selected mission's local media. */
export function UploadMediaPage({ missionId }: { missionId?: string }) {
  return (
    <UploadMediaContent key={missionId ?? 'active'} missionId={missionId} />
  )
}

function UploadMediaContent({
  missionId: routeMissionId,
}: {
  missionId?: string
}) {
  const { t } = useI18n(uploadMediaPageMessages)
  const w = useUploadMedia(routeMissionId)
  const { missionId, monitoring, permissions, canManageMedia } = w
  const [preview, setPreview] = useState<LocalMedia | null>(null)
  const attachExecutions =
    monitoring.data?.permissions.canAttachChecklistEvidence === true &&
    !monitoring.loading &&
    !monitoring.error
      ? monitoring.data.checklist.executions
      : undefined

  return (
    <div className="odm-card upload-media-page" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title={t.stepTitle}
        missionId={w.missionLabel}
        idTitle={missionId ?? undefined}
        active={7}
        right={
          <span className="upload-media-device">{w.deviceLabel ?? '—'}</span>
        }
      />
      <div className="upload-media-body">
        <div className="upload-media-stack">
          <div className="upload-media-bar">
            <UploadProgressSummary
              loadedMedia={w.loadedMedia}
              totalMedia={w.totalMedia}
              pendingMedia={w.pendingMedia}
              uploading={w.uploading}
              manual={w.manual}
            />
            <UploadMediaActions
              missionId={missionId}
              canManageMedia={canManageMedia}
              isBusy={w.isBusy}
              onRefresh={() => w.refreshWorkspace()}
              onUploadAll={w.uploadAll}
            />
          </div>
          {!missionId && !w.loading && <p role="alert">{t.restoringMission}</p>}
          {missionId && (
            <MissionResultActions
              missionId={missionId}
              status={w.missionStatus}
              monitoring={monitoring}
              busy={w.completionSubmitting || w.isBusy}
              onComplete={() => void w.runResultAction('complete')}
              onSubmit={() => void w.runResultAction('submit')}
            />
          )}
          <UploadMediaNotices
            missionId={missionId}
            resultError={w.resultError}
            uploadInfo={w.uploadInfo}
            error={w.error}
            loading={w.loading}
            canManageMedia={canManageMedia}
            permissionsError={permissions.error}
            permissionsLoading={permissions.loading}
          />
          <div className="upload-media-workspace">
            <div className="upload-media-files">
              <MediaPanel
                items={w.items}
                approvable={w.approvable}
                loading={w.loading}
                canManageMedia={canManageMedia}
                isBusy={w.isBusy}
                busyId={w.busyId}
                effectiveStatus={w.effectiveStatus}
                executions={attachExecutions}
                selectedTargets={w.selectedTargets}
                setSelectedTargets={w.setSelectedTargets}
                attachFailures={w.attachFailures}
                setBusyId={w.setBusyId}
                onApprove={(item, manual) => void w.approve(item, manual)}
                onDiscard={(item) => void w.discard(item)}
                onUploadPc={(item, file) => void w.uploadPc(item, file)}
                onAttachSelected={w.attachSelected}
                onPreview={setPreview}
              />
              {canManageMedia ? (
                <MediaFileTable
                  files={w.files}
                  retryingId={w.busyId}
                  onRetry={(id) => {
                    if (w.isBusy) return
                    const item = w.items.find(
                      (entry) => entry.localMediaId === id,
                    )
                    if (item)
                      void w.approve(
                        item,
                        w.effectiveStatus(item) === 'MANUAL_UPLOAD_REQUIRED',
                      )
                  }}
                />
              ) : null}
              {canManageMedia && missionId ? (
                <div className="upload-media-uploaded">
                  <MissionUploadedMedia
                    missionId={missionId}
                    onChanged={w.refreshWorkspace}
                    refreshKey={w.checklistRevision}
                  />
                </div>
              ) : null}
            </div>
            {missionId && (
              <MonitoringChecklistSection
                key={missionId}
                missionId={missionId}
                data={monitoring.data?.checklist}
                loading={monitoring.loading}
                error={monitoring.error}
                resultKnown={w.actions.known}
                resultStatus={monitoring.data?.result?.approvalStatus}
                resultNote={monitoring.data?.result?.reviewNote}
                canExecute={
                  monitoring.data?.permissions.canExecuteMonitoringChecklist
                }
                canAttach={
                  monitoring.data?.permissions.canAttachChecklistEvidence
                }
                canDetach={
                  monitoring.data?.permissions.canDetachChecklistEvidence
                }
                refresh={w.refreshWorkspace}
                compact
                loadEvidenceCandidates={w.loadEvidenceCandidates}
                attachEvidenceCandidate={w.attachEvidenceCandidate}
              />
            )}
          </div>
        </div>
      </div>
      {preview && (
        <PreviewLightbox preview={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}
