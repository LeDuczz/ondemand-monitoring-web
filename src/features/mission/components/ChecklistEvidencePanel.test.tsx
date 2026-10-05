import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ChecklistEvidencePanel } from './ChecklistEvidencePanel'
import { MonitoringChecklistSection } from './MonitoringChecklistSection'
import { checklistEvidenceApi } from '../api/checklistEvidenceApi'
import type {
  EvidenceCandidate,
  MissionChecklistEvidence,
  MissionChecklistExecution,
} from '../types/checklistExecution'
const link: MissionChecklistEvidence = {
  evidenceId: 'link',
  mediaId: 'backend-media',
  executionId: 'e',
  attachedBy: 'inspector',
  attachedAt: '2026-10-05T00:00:00Z',
  note: null,
  version: 0,
  mediaType: 'IMAGE',
  contentType: 'image/jpeg',
  fileName: 'capture.jpg',
  mediaStatus: 'PENDING_MANAGER_APPROVAL',
  sourceType: 'DRONE_CAMERA',
  capturedAt: '2026-10-05T00:00:00Z',
  sourceCapturedAt: null,
  validatedAt: '2026-10-05T00:00:00Z',
  eligibleForOperationalReadiness: true,
  eligibleForFinalApproval: false,
  ineligibilityReason: null,
  previewUrl: 'https://example.test/image',
  urlExpiresAt: '2026-10-05T00:15:00Z',
}
const item: MissionChecklistExecution = {
  id: 'e',
  orderChecklistItemId: 'snapshot',
  content: 'Historical fence',
  displayOrder: 0,
  sourceType: 'CUSTOMER_CUSTOM',
  executionStatus: 'COMPLETED',
  assessmentStatus: 'NOT_ASSESSED',
  observation: null,
  unableToVerifyReason: null,
  startedAt: null,
  completedAt: null,
  lastModifiedBy: null,
  createdAt: '2026-10-05T00:00:00Z',
  updatedAt: null,
  version: 4,
  evidencePolicyVersion: 1,
  minimumEvidenceCount: 1,
  eligibleEvidenceCount: 1,
  evidenceReady: true,
  evidence: [link],
}
const candidate: EvidenceCandidate = {
  mediaId: 'backend-media',
  fileName: 'capture.jpg',
  mediaType: 'IMAGE',
  contentType: 'image/jpeg',
  status: 'PENDING_MANAGER_APPROVAL',
  sourceType: 'DRONE_CAMERA',
  capturedAt: link.capturedAt,
  validatedAt: link.validatedAt,
  attachable: true,
  eligibleForOperationalReadiness: true,
  eligibleForFinalApproval: false,
  ineligibilityReason: null,
  previewUrl: link.previewUrl,
  urlExpiresAt: link.urlExpiresAt,
  alreadyAttachedExecutionIds: [],
}
const props = {
  missionId: 'm',
  item,
  canAttach: true,
  canDetach: true,
  refresh: vi.fn(),
}
afterEach(() => vi.restoreAllMocks())
describe('Checklist evidence', () => {
  it('shows per-item preview, source, status and backend readiness', () => {
    render(<ChecklistEvidencePanel {...props} />)
    expect(screen.getByAltText('capture.jpg')).toBeInTheDocument()
    expect(screen.getByText(/DRONE_CAMERA/)).toBeInTheDocument()
    expect(screen.getByText('Bằng chứng hợp lệ: 1 / 1')).toBeInTheDocument()
    expect(screen.getByText(/Duyệt media bắt buộc/)).toBeInTheDocument()
  })
  it('attaches stable backend media id with expected execution version', async () => {
    vi.spyOn(checklistEvidenceApi, 'candidates').mockResolvedValue([candidate])
    const attach = vi
      .spyOn(checklistEvidenceApi, 'attach')
      .mockResolvedValue([link])
    render(<ChecklistEvidencePanel {...props} />)
    fireEvent.click(screen.getByText('Thêm bằng chứng từ media Mission'))
    fireEvent.click(await screen.findByText('Gắn media'))
    await waitFor(() =>
      expect(attach).toHaveBeenCalledWith('m', 'e', 'backend-media', 4),
    )
  })
  it('soft-detach command uses association id and execution version', async () => {
    const detach = vi
      .spyOn(checklistEvidenceApi, 'detach')
      .mockResolvedValue(undefined)
    render(<ChecklistEvidencePanel {...props} />)
    fireEvent.click(screen.getByText('Gỡ bằng chứng'))
    await waitFor(() =>
      expect(detach).toHaveBeenCalledWith('m', 'e', 'link', 4),
    )
  })
  it('shows invalid source and disables candidate attach', async () => {
    vi.spyOn(checklistEvidenceApi, 'candidates').mockResolvedValue([
      {
        ...candidate,
        sourceType: 'MANUAL_UPLOAD',
        attachable: false,
        ineligibilityReason: 'EVIDENCE_SOURCE_NOT_ELIGIBLE',
      },
    ])
    render(<ChecklistEvidencePanel {...props} />)
    fireEvent.click(screen.getByText('Thêm bằng chứng từ media Mission'))
    expect(await screen.findByText('Gắn media')).toBeDisabled()
    expect(screen.getByText(/Nguồn media không hợp lệ/)).toBeInTheDocument()
  })
  it('retains rejected evidence with blocker and supports video', () => {
    render(
      <ChecklistEvidencePanel
        {...props}
        item={{
          ...item,
          evidence: [
            {
              ...link,
              mediaType: 'VIDEO',
              mediaStatus: 'REJECTED',
              eligibleForOperationalReadiness: false,
              ineligibilityReason: 'MEDIA_REJECTED',
            },
          ],
          eligibleEvidenceCount: 0,
          evidenceReady: false,
        }}
      />,
    )
    expect(screen.getByText('Bằng chứng hợp lệ: 0 / 1')).toBeInTheDocument()
    expect(screen.getByText('Media đã bị từ chối.')).toBeInTheDocument()
    expect(document.querySelector('video')).not.toBeNull()
  })
  it('Inspector may attach while execution editing remains read-only', () => {
    render(
      <MonitoringChecklistSection
        missionId="m"
        loading={false}
        canExecute={false}
        canAttach
        canDetach
        resultStatus="DRAFT"
        refresh={vi.fn()}
        data={{
          missionId: 'm',
          legacySnapshot: false,
          readyForSubmission: true,
          executions: [item],
        }}
      />,
    )
    expect(screen.queryByText('Cập nhật mục')).toBeNull()
    expect(screen.getByText('Thêm bằng chứng từ media Mission')).toBeEnabled()
  })
  it.each(['PENDING_MANAGER_APPROVAL', 'APPROVED'] as const)(
    'locks evidence controls for result %s',
    (status) => {
      render(
        <MonitoringChecklistSection
          missionId="m"
          loading={false}
          canAttach
          canDetach
          resultStatus={status}
          refresh={vi.fn()}
          data={{
            missionId: 'm',
            legacySnapshot: false,
            readyForSubmission: true,
            executions: [item],
          }}
        />,
      )
      expect(screen.queryByText('Gỡ bằng chứng')).toBeNull()
      expect(screen.queryByText('Thêm bằng chứng từ media Mission')).toBeNull()
    },
  )
  it('Manager media review remains a separate action', async () => {
    const review = vi.fn().mockResolvedValue({})
    render(
      <ChecklistEvidencePanel
        {...props}
        canAttach={false}
        canDetach={false}
        reviewMedia={review}
      />,
    )
    fireEvent.click(screen.getByText('Duyệt media'))
    await waitFor(() =>
      expect(review).toHaveBeenCalledWith('backend-media', false),
    )
    expect(screen.queryByText('Duyệt kết quả')).toBeNull()
  })
})
