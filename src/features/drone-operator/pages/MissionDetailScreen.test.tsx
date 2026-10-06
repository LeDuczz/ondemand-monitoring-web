import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { setLanguage } from '../../../shared/i18n'
import { MissionDetailScreen } from './MissionDetailScreen'
import { operatorApi } from '../api/operatorApi'
import { missionApi } from '../../mission/api/missionApi'
import { checklistExecutionApi } from '../../mission/api/checklistExecutionApi'
import type { OperatorMission } from '../types/mission'

afterEach(() => vi.restoreAllMocks())
beforeEach(() => {
  vi.spyOn(
    checklistExecutionApi,
    'getMissionChecklistExecutions',
  ).mockResolvedValue({
    missionId: 'm',
    legacySnapshot: false,
    readyForSubmission: true,
    executions: [],
  })
  vi.spyOn(missionApi, 'getMissionResult').mockResolvedValue(null)
})

const mission: OperatorMission = {
  id: 'm',
  missionCode: 'MS-1',
  backendStatus: 'PENDING_REVIEW',
  status: 'ACCEPTED',
  title: 'Monitoring',
  location: 'Local',
  date: '2026-10-05',
  startTime: '09:00',
  endTime: '10:00',
  serviceLabel: 'Monitoring',
  droneCode: null,
  droneName: null,
}
const noActions = {
  canRespond: false,
  canControlFlight: false,
  canOperatePayload: false,
  canInspectDevice: false,
  canMaintainDevice: false,
  canUploadMedia: false,
  canCompleteMission: false,
  canSubmitMissionResult: false,
  canExecuteMonitoringChecklist: false,
}

// operatorApi.getMission routes through the real (unmocked) mission API, so
// it rejects in this test environment and the screen settles on its
// bilingual "mission not found" error state.
describe('MissionDetailScreen', () => {
  it('shows GCS connection before preflight for a scheduled accepted mission', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
      ...mission,
      backendStatus: 'SCHEDULED',
      status: 'SCHEDULED',
      myResponseStatus: 'ACCEPTED',
    })
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canOperatePayload: true,
    })

    render(<MissionDetailScreen missionId="m" />)

    expect(await screen.findByText('Kết nối GCS')).toBeInTheDocument()
    expect(screen.queryByText('Kiểm tra thiết bị')).toBeNull()
  })

  it.each([
    ['OPERATOR', true, false],
    ['PILOT fallback', true, false],
    ['INSPECTOR', false, true],
  ] as const)(
    'PENDING_REVIEW: %s follows backend editing/completion capabilities',
    async (_actor, canExecuteMonitoringChecklist, canCompleteMission) => {
      vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
        ...mission,
        status: 'PENDING_REVIEW',
      })
      vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
        ...noActions,
        canExecuteMonitoringChecklist,
        canCompleteMission,
      })
      vi.mocked(
        checklistExecutionApi.getMissionChecklistExecutions,
      ).mockResolvedValue({
        missionId: 'm',
        legacySnapshot: false,
        readyForSubmission: false,
        executions: [
          {
            id: 'e',
            orderChecklistItemId: 'h',
            content: 'Monitoring lịch sử',
            displayOrder: 1,
            sourceType: 'CUSTOMER_CUSTOM',
            executionStatus: 'PENDING',
            assessmentStatus: 'NOT_ASSESSED',
            observation: null,
            unableToVerifyReason: null,
            startedAt: null,
            completedAt: null,
            lastModifiedBy: null,
            createdAt: '2026-10-05T00:00:00Z',
            updatedAt: null,
            version: 0,
          },
        ],
      })
      render(<MissionDetailScreen missionId="m" />)
      await screen.findByText('Monitoring lịch sử')
      if (canExecuteMonitoringChecklist)
        expect(screen.getByText('Cập nhật mục')).toBeInTheDocument()
      else expect(screen.queryByText('Cập nhật mục')).toBeNull()
      if (canCompleteMission)
        expect(
          await screen.findByText('Nghiệm thu mission'),
        ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Gửi kết quả giám sát' }),
      ).toBeNull()
    },
  )
  it('disables submit when backend checklist readiness is false', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
      ...mission,
      backendStatus: 'COMPLETED',
      status: 'COMPLETED',
    })
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canSubmitMissionResult: true,
      canExecuteMonitoringChecklist: true,
    })
    vi.mocked(
      checklistExecutionApi.getMissionChecklistExecutions,
    ).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      readyForSubmission: false,
      executions: [],
    })
    render(<MissionDetailScreen missionId="m" />)
    expect(
      await screen.findByText('Chưa sẵn sàng gửi kết quả'),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: 'Gửi kết quả giám sát' }),
    ).toBeDisabled()
  })
  it('refreshes pending → rejected on focus and enables resubmission without a sticky local boolean', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
      ...mission,
      backendStatus: 'COMPLETED',
      status: 'COMPLETED',
    })
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canSubmitMissionResult: true,
      canExecuteMonitoringChecklist: true,
    })
    const result = {
      id: 'r',
      missionId: 'm',
      missionCode: 'MS-1',
      status: 'COMPLETED' as const,
      approvalStatus: 'PENDING_MANAGER_APPROVAL' as const,
    }
    vi.mocked(missionApi.getMissionResult).mockResolvedValue(result)
    render(<MissionDetailScreen missionId="m" />)
    await screen.findByText(
      'Chỉ đọc — kết quả đang chờ duyệt hoặc đã được duyệt.',
    )
    vi.mocked(missionApi.getMissionResult).mockResolvedValue({
      ...result,
      approvalStatus: 'REJECTED',
    })
    act(() => window.dispatchEvent(new Event('focus')))
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Gửi kết quả giám sát' }),
      ).toBeEnabled(),
    )
  })
  it('inspector completes without chaining result submission', async () => {
    vi.mocked(checklistExecutionApi.getMissionChecklistExecutions).mockResolvedValue({ missionId: 'm', legacySnapshot: false, executions: [], readyForSubmission: false, readyForMissionCompletion: true, checklistEvidenceReady: true })
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue(mission)
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canCompleteMission: true,
      canUploadMedia: true,
    })
    const complete = vi
      .spyOn(missionApi, 'completeMission')
      .mockResolvedValue({} as never)
    const submit = vi
      .spyOn(missionApi, 'submitMissionResult')
      .mockResolvedValue({} as never)
    render(<MissionDetailScreen missionId="m" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Nghiệm thu mission' }),
    )
    await waitFor(() => expect(complete).toHaveBeenCalledWith('m'))
    expect(submit).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('button', { name: 'Gửi kết quả giám sát' }),
    ).toBeNull()
  })

  it('submits the result to manager when completion staff has submit capability', async () => {
    vi.mocked(checklistExecutionApi.getMissionChecklistExecutions).mockResolvedValue({
      missionId: 'm',
      legacySnapshot: false,
      executions: [],
      readyForSubmission: true,
      readyForMissionCompletion: true,
      checklistEvidenceReady: true,
    })
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue(mission)
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canCompleteMission: true,
      canSubmitMissionResult: true,
      canUploadMedia: true,
    })
    const complete = vi
      .spyOn(missionApi, 'completeMission')
      .mockResolvedValue({} as never)
    const submit = vi
      .spyOn(missionApi, 'submitMissionResult')
      .mockResolvedValue({} as never)

    render(<MissionDetailScreen missionId="m" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Nghiệm thu mission' }),
    )

    await waitFor(() => expect(complete).toHaveBeenCalledWith('m'))
    expect(submit).toHaveBeenCalledWith('m', expect.objectContaining({
      notes: 'Kết quả giám sát được gửi cho manager duyệt.',
      status: 'COMPLETED',
    }))
    expect(
      await screen.findByText('Đã nghiệm thu và gửi kết quả mission cho manager duyệt.'),
    ).toBeInTheDocument()
  })

  it('does not allow Inspector completion before backend evidence readiness', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue(mission)
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({ ...noActions, canCompleteMission: true, canUploadMedia: true })
    vi.mocked(checklistExecutionApi.getMissionChecklistExecutions).mockResolvedValue({ missionId: 'm', legacySnapshot: false, executions: [], readyForSubmission: false, readyForMissionCompletion: false, checklistEvidenceReady: false })
    const complete = vi.spyOn(missionApi, 'completeMission').mockResolvedValue({} as never)
    render(<MissionDetailScreen missionId="m" />)
    expect(await screen.findByRole('button', { name: 'Nghiệm thu mission' })).toBeDisabled()
    expect(complete).not.toHaveBeenCalled()
  })

  it.each(['OPERATOR', 'PILOT fallback'])(
    '%s submits using backend capability, not upload permission',
    async () => {
      vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
        ...mission,
        backendStatus: 'COMPLETED',
        status: 'COMPLETED',
      })
      vi.spyOn(missionApi, 'getMissionResult').mockResolvedValue(null)
      vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
        ...noActions,
        canSubmitMissionResult: true,
        canExecuteMonitoringChecklist: true,
      })
      const complete = vi
        .spyOn(missionApi, 'completeMission')
        .mockResolvedValue({} as never)
      const submit = vi
        .spyOn(missionApi, 'submitMissionResult')
        .mockResolvedValue({} as never)
      render(<MissionDetailScreen missionId="m" />)
      fireEvent.click(
        await screen.findByRole('button', { name: 'Gửi kết quả giám sát' }),
      )
      await waitFor(() =>
        expect(submit).toHaveBeenCalledWith('m', expect.any(Object)),
      )
      expect(complete).not.toHaveBeenCalled()
      expect(
        screen.queryByRole('button', { name: 'Nghiệm thu mission' }),
      ).toBeNull()
    },
  )

  it('upload permission alone never enables result submission', async () => {
    vi.spyOn(operatorApi, 'getMission').mockResolvedValue({
      ...mission,
      backendStatus: 'COMPLETED',
      status: 'COMPLETED',
    })
    vi.spyOn(missionApi, 'getMissionResult').mockResolvedValue(null)
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...noActions,
      canUploadMedia: true,
    })
    render(<MissionDetailScreen missionId="m" />)
    await screen.findByText('Mở media nghiệm thu')
    expect(
      screen.queryByRole('button', { name: 'Gửi kết quả giám sát' }),
    ).toBeNull()
  })
  it('renders the vietnamese error state', async () => {
    vi.spyOn(operatorApi, 'getMission').mockRejectedValue(new Error('not found'))
    render(<MissionDetailScreen missionId="MSN-1" />)
    expect(await screen.findByText('Không tải được mission')).toBeTruthy()
    expect(screen.getByText('Về danh sách')).toBeTruthy()
  })

  it('renders the english error state when language is switched', async () => {
    vi.spyOn(operatorApi, 'getMission').mockRejectedValue(new Error('not found'))
    render(<MissionDetailScreen missionId="MSN-1" />)
    await screen.findByText('Không tải được mission')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Could not load the mission')).toBeTruthy()
    expect(screen.getByText('Back to list')).toBeTruthy()
  })
})
