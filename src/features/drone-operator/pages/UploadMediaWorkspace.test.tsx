import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { UploadMediaScreen } from './UploadMediaScreen'
import { missionApi } from '../../mission/api/missionApi'
import { checklistExecutionApi } from '../../mission/api/checklistExecutionApi'
import {
  operatorMediaApi,
  type LocalMedia,
} from '../../media/api/operatorMediaApi'
import { operatorMissionMediaApi } from '../../media/api/operatorMissionMediaApi'
import { flightControlApi } from '../omss/api/flightControlApi'
import { checklistEvidenceApi } from '../../mission/api/checklistEvidenceApi'

vi.mock('../api/useActiveMission', () => ({
  useActiveMission: () => ({
    data: {
      id: 'm',
      missionCode: 'MS-1',
      status: 'PENDING_REVIEW',
      deviceId: 'd',
    },
  }),
}))
const permissions = {
  canRespond: false,
  canControlFlight: false,
  canOperatePayload: false,
  canInspectDevice: false,
  canMaintainDevice: false,
  canUploadMedia: false,
  canExecuteMonitoringChecklist: true,
}
const media: LocalMedia = {
  localMediaId: 'local',
  missionId: 'm',
  deviceId: 'd',
  mediaType: 'IMAGE',
  fileName: 'capture.jpg',
  contentType: 'image/jpeg',
  fileSize: 200,
  checksumSha256: 'checksum',
  capturedAt: '2026-10-05T00:00:00Z',
  status: 'REVIEW_PENDING',
}
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
  vi.spyOn(missionApi, 'getPermissions').mockResolvedValue(permissions)
  vi.spyOn(missionApi, 'getMissionResult').mockResolvedValue(null)
  vi.spyOn(flightControlApi, 'bindSession').mockResolvedValue({} as never)
  vi.spyOn(operatorMediaApi, 'reviewItems').mockResolvedValue([media])
  vi.spyOn(operatorMediaApi, 'status').mockResolvedValue({
    status: 'VALIDATING',
    attemptNumber: 1,
  } as never)
  vi.spyOn(operatorMissionMediaApi, 'list').mockResolvedValue({
    items: [],
    page: 0,
    totalItems: 0,
    totalPages: 0,
    first: true,
    last: true,
  })
  vi.spyOn(
    checklistExecutionApi,
    'getMissionChecklistExecutions',
  ).mockResolvedValue({
    missionId: 'm',
    readyForSubmission: false,
    legacySnapshot: false,
    executions: [
      {
        id: 'e',
        orderChecklistItemId: 'h',
        content: 'Quan sát hàng rào',
        displayOrder: 1,
        sourceType: 'CUSTOMER_CUSTOM',
        executionStatus: 'PENDING',
        assessmentStatus: 'NOT_ASSESSED',
        observation: null,
        unableToVerifyReason: null,
        version: 4,
        startedAt: null,
        completedAt: null,
        lastModifiedBy: null,
        createdAt: '2026-10-05T00:00:00Z',
        updatedAt: null,
      },
    ],
  })
})
afterEach(() => vi.restoreAllMocks())
describe('Upload media and monitoring workspace', () => {
  it('allows one capture to target multiple historical checklist executions', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({ ...permissions, canUploadMedia: true, canAttachChecklistEvidence: true, canExecuteMonitoringChecklist: false })
    const snapshot = await checklistExecutionApi.getMissionChecklistExecutions('m')
    vi.mocked(checklistExecutionApi.getMissionChecklistExecutions).mockResolvedValue({ ...snapshot, executions: [snapshot.executions[0], { ...snapshot.executions[0], id: 'e2', content: 'Khu vực phía Bắc', version: 2 }] })
    vi.spyOn(operatorMediaApi, 'upload').mockResolvedValue('backend-media')
    const attach = vi.spyOn(checklistEvidenceApi, 'batch').mockResolvedValue([])
    render(<UploadMediaScreen missionId="m" />)
    fireEvent.click(await screen.findByRole('checkbox', { name: /Quan sát hàng rào/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Khu vực phía Bắc/ }))
    fireEvent.click(screen.getByText('Duyệt & upload'))
    await waitFor(() => expect(attach).toHaveBeenCalledWith('m', 'backend-media', [{ executionId: 'e', expectedVersion: 4 }, { executionId: 'e2', expectedVersion: 2 }]))
  })
  it('uploads then attaches using backend media id and recovers attach failure without another upload', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({ ...permissions, canUploadMedia: true, canAttachChecklistEvidence: true, canExecuteMonitoringChecklist: false })
    vi.mocked(operatorMediaApi.reviewItems).mockResolvedValue([{ ...media, sourceType: 'DRONE_CAMERA' }])
    const upload = vi.spyOn(operatorMediaApi, 'upload').mockResolvedValue('backend-media')
    const attach = vi.spyOn(checklistEvidenceApi, 'batch').mockRejectedValueOnce(new Error('attach failed')).mockResolvedValue([])
    render(<UploadMediaScreen missionId="m" />)
    fireEvent.click(await screen.findByRole('checkbox', { name: /Quan sát hàng rào/ }))
    fireEvent.click(screen.getByText('Duyệt & upload'))
    await screen.findByText(/Gắn bằng chứng chưa thành công/)
    expect(attach).toHaveBeenCalledWith('m', 'backend-media', [{ executionId: 'e', expectedVersion: 4 }])
    const retry = await screen.findByText('Gắn bằng chứng — không upload lại')
    await waitFor(() => expect(retry).toBeEnabled())
    fireEvent.click(retry)
    await waitFor(() => expect(attach).toHaveBeenCalledTimes(2))
    expect(upload).toHaveBeenCalledOnce()
  })
  it('shows compact captured images and editable checklist together without granting Pilot/Operator upload', async () => {
    render(<UploadMediaScreen missionId="m" />)
    await screen.findByText('Quan sát hàng rào')
    expect(screen.getByText('Chỉnh sửa')).toBeInTheDocument()
    const image = await screen.findByAltText('capture.jpg')
    expect(image).toHaveClass('upload-media-preview')
    expect(screen.queryByText('Duyệt & upload')).toBeNull()
    expect(screen.getByText(/Upload ảnh cần Inspector/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Xem ảnh lớn'))
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce()
  })
  it('saves a checklist item directly on upload screen with expectedVersion', async () => {
    const save = vi
      .spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
      .mockResolvedValue({} as never)
    render(<UploadMediaScreen missionId="m" />)
    fireEvent.click(await screen.findByText('Chỉnh sửa'))
    fireEvent.change(screen.getByLabelText('Trạng thái'), {
      target: { value: 'COMPLETED' },
    })
    fireEvent.click(screen.getByText('Lưu'))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        'm',
        'e',
        expect.objectContaining({
          expectedVersion: 4,
          executionStatus: 'COMPLETED',
        }),
      ),
    )
  })
  it('offers upload to Inspector while the monitoring checklist is read-only', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canUploadMedia: true,
      canExecuteMonitoringChecklist: false,
    })
    const upload = vi
      .spyOn(operatorMediaApi, 'upload')
      .mockResolvedValue('backend-media')
    render(<UploadMediaScreen missionId="m" />)
    await screen.findByText('Quan sát hàng rào')
    expect(screen.queryByText('Cập nhật mục')).toBeNull()
    fireEvent.click(await screen.findByText('Duyệt & upload'))
    await waitFor(() =>
      expect(upload).toHaveBeenCalledWith(
        expect.objectContaining({ localMediaId: 'local' }),
        false,
      ),
    )
  })
  it('does not claim batch success after an upload fails', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canUploadMedia: true,
    })
    vi.spyOn(operatorMediaApi, 'upload').mockRejectedValue(
      new Error('S3 upload failed'),
    )
    render(<UploadMediaScreen missionId="m" />)
    await screen.findByAltText('capture.jpg')
    fireEvent.click(await screen.findByText('Upload tất cả'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'S3 upload failed',
    )
    expect(screen.queryByText(/Đã gửi các file đang chờ/)).toBeNull()
  })

  it('lets a multi-role inspector complete the mission and send it to manager from upload', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canUploadMedia: true,
      canCompleteMission: true,
      canSubmitMissionResult: true,
      canExecuteMonitoringChecklist: true,
    })
    vi.mocked(checklistExecutionApi.getMissionChecklistExecutions).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      readyForSubmission: true,
      readyForMissionCompletion: true,
      checklistEvidenceReady: true,
      executions: [],
    })
    const complete = vi
      .spyOn(missionApi, 'completeMission')
      .mockResolvedValue({} as never)
    const submit = vi
      .spyOn(missionApi, 'submitMissionResult')
      .mockResolvedValue({} as never)

    render(<UploadMediaScreen missionId="m" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Gửi manager' }),
    )

    await waitFor(() => expect(complete).toHaveBeenCalledWith('m'))
    expect(submit).toHaveBeenCalledWith(
      'm',
      expect.objectContaining({
        status: 'COMPLETED',
        notes: 'Kết quả giám sát được gửi cho manager duyệt.',
      }),
    )
    expect(
      await screen.findByText('Đã nghiệm thu và gửi kết quả mission cho manager duyệt.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Đã gửi manager' }),
    ).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: 'Gửi manager' }),
    ).toBeNull()
  })

  it('shows sent-manager status when the result is already pending manager review', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canUploadMedia: true,
      canCompleteMission: false,
      canSubmitMissionResult: true,
      canExecuteMonitoringChecklist: true,
    })
    vi.mocked(missionApi.getMissionResult).mockResolvedValue({
      id: 'result',
      missionId: 'm',
      status: 'COMPLETED',
      approvalStatus: 'PENDING_MANAGER_APPROVAL',
      submittedAt: '2026-10-06T00:00:00Z',
    } as never)
    vi.mocked(checklistExecutionApi.getMissionChecklistExecutions).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      readyForSubmission: true,
      readyForMissionCompletion: false,
      checklistEvidenceReady: true,
      executions: [],
    })

    render(<UploadMediaScreen missionId="m" />)

    const button = await screen.findByRole('button', {
      name: 'Đã gửi manager',
    })
    expect(button).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Gửi manager' })).toBeNull()
  })

  it('keeps send-manager clickable while checklist readiness is still being resolved', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canUploadMedia: true,
      canCompleteMission: true,
      canSubmitMissionResult: true,
      canExecuteMonitoringChecklist: true,
    })
    vi.mocked(checklistExecutionApi.getMissionChecklistExecutions).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      readyForSubmission: false,
      readyForMissionCompletion: true,
      checklistEvidenceReady: false,
      executions: [],
    })

    render(<UploadMediaScreen missionId="m" />)

    expect(
      await screen.findByRole('button', { name: 'Gửi manager' }),
    ).toBeEnabled()
  })

  it('auto-attaches uploaded media to missing checklist evidence before sending manager', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canUploadMedia: true,
      canCompleteMission: true,
      canSubmitMissionResult: true,
      canAttachChecklistEvidence: true,
      canExecuteMonitoringChecklist: true,
    })
    vi.mocked(operatorMediaApi.reviewItems).mockResolvedValue([
      {
        ...media,
        backendMediaId: 'backend-media',
        sourceType: 'SATELLITE_SNAPSHOT',
        status: 'PENDING_MANAGER_APPROVAL',
      },
    ])
    vi.mocked(operatorMediaApi.status).mockResolvedValue({
      status: 'PENDING_MANAGER_APPROVAL',
      attemptNumber: 1,
    } as never)
    vi.mocked(checklistExecutionApi.getMissionChecklistExecutions).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      readyForSubmission: false,
      readyForMissionCompletion: false,
      checklistEvidenceReady: false,
      executions: [
        {
          id: 'e',
          orderChecklistItemId: 'h',
          content: 'Quan sát hàng rào',
          displayOrder: 1,
          sourceType: 'CUSTOMER_CUSTOM',
          executionStatus: 'COMPLETED',
          assessmentStatus: 'COMPLIANT',
          observation: null,
          unableToVerifyReason: null,
          version: 4,
          startedAt: null,
          completedAt: '2026-10-05T00:00:00Z',
          lastModifiedBy: null,
          createdAt: '2026-10-05T00:00:00Z',
          updatedAt: null,
          evidencePolicyVersion: 1,
          minimumEvidenceCount: 1,
          eligibleEvidenceCount: 0,
          evidenceRequirementSatisfied: false,
          evidenceReady: false,
          evidence: [],
        },
      ],
    })
    const attach = vi.spyOn(checklistEvidenceApi, 'batch').mockResolvedValue([])
    const complete = vi
      .spyOn(missionApi, 'completeMission')
      .mockResolvedValue({} as never)
    const submit = vi
      .spyOn(missionApi, 'submitMissionResult')
      .mockResolvedValue({} as never)

    render(<UploadMediaScreen missionId="m" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Gửi manager' }))

    await waitFor(() =>
      expect(attach).toHaveBeenCalledWith('m', 'backend-media', [
        { executionId: 'e', expectedVersion: 4 },
      ]),
    )
    await waitFor(() => expect(submit).toHaveBeenCalled())
    expect(attach.mock.invocationCallOrder[0]).toBeLessThan(
      complete.mock.invocationCallOrder[0],
    )
  })

  it('shows send-manager action even when only submit permission is present', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canUploadMedia: true,
      canCompleteMission: false,
      canSubmitMissionResult: true,
      canExecuteMonitoringChecklist: true,
    })
    vi.mocked(checklistExecutionApi.getMissionChecklistExecutions).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      readyForSubmission: true,
      readyForMissionCompletion: false,
      checklistEvidenceReady: true,
      executions: [],
    })
    const complete = vi
      .spyOn(missionApi, 'completeMission')
      .mockResolvedValue({} as never)
    const submit = vi
      .spyOn(missionApi, 'submitMissionResult')
      .mockResolvedValue({} as never)

    render(<UploadMediaScreen missionId="m" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Gửi manager' }))

    await waitFor(() => expect(submit).toHaveBeenCalledWith('m', expect.any(Object)))
    expect(complete).not.toHaveBeenCalled()
  })

  it('does not submit to manager if operational completion fails first', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canUploadMedia: true,
      canCompleteMission: true,
      canSubmitMissionResult: true,
      canExecuteMonitoringChecklist: true,
    })
    vi.mocked(checklistExecutionApi.getMissionChecklistExecutions).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      readyForSubmission: true,
      readyForMissionCompletion: false,
      checklistEvidenceReady: false,
      executions: [],
    })
    vi.spyOn(missionApi, 'completeMission').mockRejectedValue(
      new Error('Checklist evidence is not ready'),
    )
    const submit = vi
      .spyOn(missionApi, 'submitMissionResult')
      .mockResolvedValue({} as never)

    render(<UploadMediaScreen missionId="m" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Gửi manager' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Checklist evidence is not ready',
    )
    expect(submit).not.toHaveBeenCalled()
  })

  it('refreshes permissions and fails closed after a permission fetch failure', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      ...permissions,
      canUploadMedia: true,
    })
    render(<UploadMediaScreen missionId="m" />)
    await screen.findByText('Duyệt & upload')
    vi.mocked(missionApi.getPermissions).mockRejectedValue(new Error('denied'))
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Làm mới' })[0],
    )
    await screen.findByText(
      'Không tải được quyền upload. Bấm Làm mới để thử lại.',
    )
    expect(screen.queryByText('Duyệt & upload')).toBeNull()
  })
})
