import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { missionsApi } from '../api/missionsApi'
import { checklistExecutionApi } from '../../mission/api/checklistExecutionApi'
import { MissionDetailPage } from './MissionDetailPage'
import type { MissionResponse, MissionResultResponse } from '../types/missions'

vi.mock('../../media/components/MissionUploadedMedia', () => ({
  MissionUploadedMedia: () => <div>Thư viện media riêng</div>,
}))
const mission: MissionResponse = {
  id: 'm',
  orderId: 'o',
  orderTitle: 'Đơn giám sát',
  customerName: 'Khách hàng',
  missionCode: 'MS-1',
  status: 'COMPLETED',
  operatorId: null,
  droneId: null,
  droneCode: 'DR-1',
  latitude: null,
  longitude: null,
  address: null,
  scheduledStartAt: null,
  startedAt: null,
  completedAt: null,
  description: null,
  failureReason: null,
  rejectionReason: null,
  mediaType: null,
  plan: null,
  preflightRetryCount: 0,
  preflightPassed: true,
  preflightFaultType: null,
  preflightFailureReason: null,
  preflightCheckedAt: null,
}
const result: MissionResultResponse = {
  id: 'r',
  missionId: 'm',
  missionCode: 'MS-1',
  status: 'COMPLETED',
  approvalStatus: 'PENDING_MANAGER_APPROVAL',
  startedAt: null,
  endedAt: null,
  completedAt: null,
  submittedAt: null,
  approvedAt: null,
  rejectedAt: null,
  durationSeconds: null,
  mediaCount: 0,
  summary: 'Báo cáo',
  notes: null,
  createdBy: null,
  reviewedBy: null,
  reviewNote: null,
  createdAt: null,
  updatedAt: null,
  mediaFiles: [],
}
beforeEach(() => {
  vi.spyOn(missionsApi, 'getMissionResponse').mockResolvedValue(mission)
  vi.spyOn(missionsApi, 'getCurrentPreflight').mockRejectedValue(
    new Error('not found'),
  )
  vi.spyOn(missionsApi, 'getCurrentPostDeviceCheck').mockRejectedValue(
    new Error('not found'),
  )
  vi.spyOn(missionsApi, 'getMissionResult').mockResolvedValue(result)
  vi.spyOn(missionsApi, 'getMissionMedia').mockResolvedValue([])
  vi.spyOn(
    checklistExecutionApi,
    'getMissionChecklistExecutions',
  ).mockResolvedValue({
    missionId: 'm',
    legacySnapshot: false,
    readyForSubmission: true,
    executions: [
      {
        id: 'e',
        orderChecklistItemId: 'historical',
        content: 'Kiểm tra mái nhà lịch sử',
        displayOrder: 0,
        sourceType: 'CUSTOMER_CUSTOM',
        executionStatus: 'UNABLE_TO_VERIFY',
        assessmentStatus: 'NOT_ASSESSED',
        observation: 'Có cây che',
        unableToVerifyReason: 'Không có góc nhìn',
        version: 2,
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
describe('Manager Mission Detail monitoring review', () => {
  it('renders per-item historical outcomes read-only', async () => {
    render(<MissionDetailPage missionId="m" />)
    expect(
      await screen.findByText('Kiểm tra mái nhà lịch sử'),
    ).toBeInTheDocument()
    expect(screen.getByText(/Không có góc nhìn/)).toBeInTheDocument()
    expect(screen.getByText(/Có cây che/)).toBeInTheDocument()
    expect(screen.queryByText('Cập nhật mục')).toBeNull()
    expect(screen.getByText('Duyệt kết quả')).toBeEnabled()
    expect(screen.getByText('Từ chối kết quả')).toBeEnabled()
  })
  it.each(['DRAFT', 'REJECTED', 'APPROVED'] as const)(
    '%s cannot be approved/rejected',
    async (approvalStatus) => {
      vi.spyOn(missionsApi, 'getMissionResult').mockResolvedValue({
        ...result,
        approvalStatus,
      })
      render(<MissionDetailPage missionId="m" />)
      await screen.findByText('Kiểm tra mái nhà lịch sử')
      expect(screen.queryByRole('button', { name: 'Duyệt kết quả' })).toBeNull()
      expect(
        screen.queryByRole('button', { name: 'Từ chối kết quả' }),
      ).toBeNull()
    },
  )
  it('refreshes mission/result/checklist after rejection', async () => {
    vi.spyOn(missionsApi, 'rejectMissionResult').mockImplementation(
      async () => {
        vi.mocked(missionsApi.getMissionResult).mockResolvedValue({
          ...result,
          approvalStatus: 'REJECTED',
        })
        return { ...result, approvalStatus: 'REJECTED' }
      },
    )
    render(<MissionDetailPage missionId="m" />)
    fireEvent.click(await screen.findByText('Từ chối kết quả'))
    await screen.findByText(
      'Kết quả đã bị từ chối. Monitoring actor cần chỉnh sửa và gửi lại.',
    )
    await waitFor(() =>
      expect(missionsApi.getMissionResponse).toHaveBeenCalledTimes(2),
    )
    expect(
      checklistExecutionApi.getMissionChecklistExecutions,
    ).toHaveBeenCalledTimes(2)
  })
})
