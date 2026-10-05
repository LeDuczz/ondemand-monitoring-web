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
  it('shows compact captured images and editable checklist together without granting Pilot/Operator upload', async () => {
    render(<UploadMediaScreen missionId="m" />)
    await screen.findByText('Quan sát hàng rào')
    expect(screen.getByText('Cập nhật mục')).toBeInTheDocument()
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
    fireEvent.click(await screen.findByText('Cập nhật mục'))
    fireEvent.change(screen.getByLabelText('Trạng thái thực hiện'), {
      target: { value: 'COMPLETED' },
    })
    fireEvent.click(screen.getByText('Lưu mục'))
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
