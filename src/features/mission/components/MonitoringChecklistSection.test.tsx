import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ApiError } from '../../../shared/api/httpClient'
import { checklistExecutionApi } from '../api/checklistExecutionApi'
import {
  MonitoringChecklistSection,
  allowedExecutionStatuses,
} from './MonitoringChecklistSection'
import type {
  MissionChecklistExecution,
  MissionChecklistResponse,
} from '../types/checklistExecution'

const item: MissionChecklistExecution = {
  id: 'e',
  orderChecklistItemId: 'historical',
  content: 'Yêu cầu lịch sử',
  displayOrder: 1,
  sourceType: 'SERVICE_TEMPLATE',
  executionStatus: 'PENDING',
  assessmentStatus: 'NOT_ASSESSED',
  observation: null,
  unableToVerifyReason: null,
  startedAt: null,
  completedAt: null,
  lastModifiedBy: null,
  createdAt: '2026-10-05T00:00:00Z',
  updatedAt: null,
  version: 7,
}
const data: MissionChecklistResponse = {
  missionId: 'm',
  legacySnapshot: false,
  readyForSubmission: false,
  executions: [item],
}
const props = {
  missionId: 'm',
  data,
  loading: false,
  canExecute: true,
  resultStatus: 'DRAFT' as const,
  refresh: vi.fn(),
}
afterEach(() => vi.restoreAllMocks())

describe('MonitoringChecklistSection', () => {
  it('uses the refreshed version on the next edit', async () => {
    const updated = {
      ...item,
      version: 8,
      executionStatus: 'IN_PROGRESS' as const,
    }
    const save = vi
      .spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
      .mockResolvedValue(updated)
    const { rerender } = render(<MonitoringChecklistSection {...props} />)
    fireEvent.click(screen.getByText('Cập nhật mục'))
    fireEvent.change(screen.getByLabelText('Trạng thái thực hiện'), {
      target: { value: 'IN_PROGRESS' },
    })
    fireEvent.click(screen.getByText('Lưu mục'))
    await screen.findByText('Cập nhật mục')
    rerender(
      <MonitoringChecklistSection
        {...props}
        data={{ ...data, executions: [updated] }}
      />,
    )
    fireEvent.click(screen.getByText('Cập nhật mục'))
    fireEvent.click(screen.getByText('Lưu mục'))
    await waitFor(() =>
      expect(save).toHaveBeenLastCalledWith(
        'm',
        'e',
        expect.objectContaining({ expectedVersion: 8 }),
      ),
    )
  })
  it('reopens rejected terminal items and omits a stale unable reason', async () => {
    const save = vi
      .spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
      .mockResolvedValue({ ...item, version: 8 })
    render(
      <MonitoringChecklistSection
        {...props}
        resultStatus="REJECTED"
        data={{
          ...data,
          executions: [
            {
              ...item,
              executionStatus: 'UNABLE_TO_VERIFY',
              unableToVerifyReason: 'Lý do cũ',
            },
          ],
        }}
      />,
    )
    fireEvent.click(screen.getByText('Cập nhật mục'))
    fireEvent.change(screen.getByLabelText('Trạng thái thực hiện'), {
      target: { value: 'PENDING' },
    })
    expect(screen.queryByLabelText('Lý do không thể xác minh')).toBeNull()
    fireEvent.click(screen.getByText('Lưu mục'))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        'm',
        'e',
        expect.objectContaining({
          executionStatus: 'PENDING',
          unableToVerifyReason: null,
        }),
      ),
    )
  })
  it('renders historical content in displayOrder including assessment, notes and reason', () => {
    render(
      <MonitoringChecklistSection
        {...props}
        data={{
          ...data,
          executions: [
            {
              ...item,
              id: '3',
              displayOrder: 3,
              content: 'Thứ ba',
              executionStatus: 'UNABLE_TO_VERIFY',
              unableToVerifyReason: 'Bị che khuất',
            },
            {
              ...item,
              id: '2',
              displayOrder: 2,
              content: 'Thứ hai',
              assessmentStatus: 'NON_COMPLIANT',
              observation: 'Vết nứt',
            },
            item,
          ],
        }}
      />,
    )
    expect(
      screen
        .getAllByRole('heading', { level: 3 })
        .map((node) => node.textContent),
    ).toEqual(['Yêu cầu lịch sử', 'Thứ hai', 'Thứ ba'])
    expect(screen.getByText('Không đạt yêu cầu')).toBeInTheDocument()
    expect(screen.getByText(/Vết nứt/)).toBeInTheDocument()
    expect(screen.getByText(/Bị che khuất/)).toBeInTheDocument()
    expect(screen.getByText('Chưa sẵn sàng gửi kết quả')).toBeInTheDocument()
  })
  it.each(['IN_PROGRESS', 'COMPLETED'] as const)(
    'saves PENDING → %s with expectedVersion and optional assessment',
    async (executionStatus) => {
      const save = vi
        .spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
        .mockResolvedValue({ ...item, executionStatus, version: 8 })
      render(<MonitoringChecklistSection {...props} />)
      fireEvent.click(screen.getByText('Cập nhật mục'))
      fireEvent.change(screen.getByLabelText('Trạng thái thực hiện'), {
        target: { value: executionStatus },
      })
      fireEvent.click(screen.getByText('Lưu mục'))
      await waitFor(() =>
        expect(save).toHaveBeenCalledWith('m', 'e', {
          expectedVersion: 7,
          executionStatus,
          assessmentStatus: 'NOT_ASSESSED',
          observation: null,
          unableToVerifyReason: null,
        }),
      )
      expect(props.refresh).toHaveBeenCalled()
    },
  )
  it('allows IN_PROGRESS → COMPLETED with NON_COMPLIANT and trimmed observation', async () => {
    const save = vi
      .spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
      .mockResolvedValue({ ...item, version: 8 })
    render(
      <MonitoringChecklistSection
        {...props}
        data={{
          ...data,
          executions: [{ ...item, executionStatus: 'IN_PROGRESS' }],
        }}
      />,
    )
    fireEvent.click(screen.getByText('Cập nhật mục'))
    fireEvent.change(screen.getByLabelText('Trạng thái thực hiện'), {
      target: { value: 'COMPLETED' },
    })
    fireEvent.change(screen.getByLabelText('Đánh giá'), {
      target: { value: 'NON_COMPLIANT' },
    })
    fireEvent.change(screen.getByLabelText('Ghi nhận'), {
      target: { value: '  vết nứt  ' },
    })
    fireEvent.click(screen.getByText('Lưu mục'))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        'm',
        'e',
        expect.objectContaining({
          executionStatus: 'COMPLETED',
          assessmentStatus: 'NON_COMPLIANT',
          observation: 'vết nứt',
        }),
      ),
    )
  })
  it('requires nonblank reason for UNABLE_TO_VERIFY and clears it on another status', async () => {
    const save = vi
      .spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
      .mockResolvedValue({ ...item, version: 8 })
    render(<MonitoringChecklistSection {...props} />)
    fireEvent.click(screen.getByText('Cập nhật mục'))
    fireEvent.change(screen.getByLabelText('Trạng thái thực hiện'), {
      target: { value: 'UNABLE_TO_VERIFY' },
    })
    fireEvent.change(screen.getByLabelText('Lý do không thể xác minh'), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByText('Lưu mục'))
    expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng nhập lý do')
    expect(save).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Lý do không thể xác minh'), {
      target: { value: '  che khuất  ' },
    })
    fireEvent.click(screen.getByText('Lưu mục'))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        'm',
        'e',
        expect.objectContaining({ unableToVerifyReason: 'che khuất' }),
      ),
    )
  })
  it('preserves unsaved edits on conflict; requires explicit latest-data adoption and never retries', async () => {
    const save = vi
      .spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
      .mockRejectedValue(
        new ApiError('stale', {
          status: 409,
          code: 'CONCURRENT_UPDATE',
          method: 'PATCH',
          path: '/',
        }),
      )
    const refresh = vi.fn()
    const { rerender } = render(
      <MonitoringChecklistSection {...props} refresh={refresh} />,
    )
    fireEvent.click(screen.getByText('Cập nhật mục'))
    fireEvent.change(screen.getByLabelText('Ghi nhận'), {
      target: { value: 'Chưa lưu' },
    })
    fireEvent.click(screen.getByText('Lưu mục'))
    await screen.findByText(/Chỉnh sửa của bạn chưa được lưu/)
    rerender(
      <MonitoringChecklistSection
        {...props}
        refresh={refresh}
        data={{
          ...data,
          executions: [{ ...item, version: 8, observation: 'Mới từ server' }],
        }}
      />,
    )
    expect(screen.getByLabelText('Ghi nhận')).toHaveValue('Chưa lưu')
    expect(screen.getByText('Lưu mục')).toBeDisabled()
    expect(save).toHaveBeenCalledTimes(1)
    expect(refresh).toHaveBeenCalledOnce()
    fireEvent.click(
      screen.getByText('Dùng dữ liệu mới (bỏ chỉnh sửa chưa lưu)'),
    )
    expect(screen.getByLabelText('Ghi nhận')).toHaveValue('Mới từ server')
  })
  it.each(['DRAFT', 'REJECTED'] as const)(
    '%s allows capability-driven editing',
    (resultStatus) => {
      render(
        <MonitoringChecklistSection {...props} resultStatus={resultStatus} />,
      )
      expect(screen.getByText('Cập nhật mục')).toBeInTheDocument()
    },
  )
  it.each(['PENDING_MANAGER_APPROVAL', 'APPROVED'] as const)(
    '%s locks editing',
    (resultStatus) => {
      render(
        <MonitoringChecklistSection {...props} resultStatus={resultStatus} />,
      )
      expect(screen.queryByText('Cập nhật mục')).toBeNull()
    },
  )
  it('is read-only without capability or when result state is unavailable', () => {
    const { rerender } = render(
      <MonitoringChecklistSection {...props} canExecute={false} />,
    )
    expect(screen.queryByText('Cập nhật mục')).toBeNull()
    rerender(<MonitoringChecklistSection {...props} resultKnown={false} />)
    expect(screen.queryByText('Cập nhật mục')).toBeNull()
  })
  it.each([false, true])(
    'handles empty/legacy=%s and trusts backend readiness',
    (legacySnapshot) => {
      render(
        <MonitoringChecklistSection
          {...props}
          data={{
            ...data,
            legacySnapshot,
            readyForSubmission: true,
            executions: [],
          }}
        />,
      )
      expect(
        screen.getByText('Không có mục checklist giám sát.'),
      ).toBeInTheDocument()
      expect(screen.getByText('Sẵn sàng gửi kết quả')).toBeInTheDocument()
    },
  )
  it('restricts reverse transitions except rejected terminal items', () => {
    expect(allowedExecutionStatuses('IN_PROGRESS', false)).not.toContain(
      'PENDING',
    )
    expect(allowedExecutionStatuses('COMPLETED', false)).toEqual(['COMPLETED'])
    expect(allowedExecutionStatuses('COMPLETED', true)).toContain('PENDING')
  })
  it('shows permission failure and offers retry', () => {
    const refresh = vi.fn()
    render(
      <MonitoringChecklistSection
        {...props}
        error={
          new ApiError('denied', { status: 403, method: 'GET', path: '/' })
        }
        refresh={refresh}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('không có quyền')
    fireEvent.click(screen.getByText('Thử lại checklist'))
    expect(refresh).toHaveBeenCalledOnce()
  })
})
