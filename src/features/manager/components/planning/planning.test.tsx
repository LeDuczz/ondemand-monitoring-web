import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../../shared/api/httpClient'
import { ordersApi } from '../../api/ordersApi'
import { planningApi } from '../../api/planningApi'
import type { MissionResponse } from '../../types/missions'
import type { OrderDetail } from '../../types/orders'
import type { ExecutionPlan, SafeStop } from '../../types/planning'
import { OrderMissionPlanningSection } from './OrderMissionPlanningSection'
import { SafeStopPanel } from './SafeStopPanel'
import { managerHref, parseManagerRoute } from '../../routes'

const items = ['A', 'B', 'C', 'D', 'E'].map((id, displayOrder) => ({
  id,
  displayOrder,
  content: `Requirement ${id}`,
  sourceType: 'CUSTOMER_CUSTOM' as const,
  sourceChecklistId: null,
}))
const plan: ExecutionPlan = {
  orderId: 'o',
  planStatus: 'DRAFT',
  revision: 7,
  missions: ['m1', 'm2', 'm3'].map((missionId) => ({
    missionId,
    scopeLabel: missionId,
    assignmentCount: 0,
    finalizedPlanRevision: null,
  })),
  coverage: {
    total: 5,
    covered: 5,
    uncovered: 0,
    repeated: 1,
    coverageReady: true,
    uncoveredItemIds: [],
  },
  blockers: [],
}
const stop: SafeStop = {
  missionId: 'm1',
  status: null,
  requestedAt: null,
  confirmedAt: null,
  cleanedAt: null,
  failureReason: null,
  requiresLanding: false,
  canRequestSafeStop: true,
  canConfirmSafeStop: false,
  canCleanupSafeStop: false,
  canCancelMission: true,
}
beforeEach(() => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.spyOn(ordersApi, 'getOrder').mockResolvedValue({
    id: 'o',
    status: 'APPROVED',
    checklistItems: items,
  } as OrderDetail)
  vi.spyOn(planningApi, 'getExecutionPlan').mockResolvedValue(plan)
  vi.spyOn(planningApi, 'getOrderMissions').mockResolvedValue(
    ['m1', 'm2', 'm3'].map(
      (id) =>
        ({
          id,
          orderId: 'o',
          missionCode: id.toUpperCase(),
          status: 'RESOURCE_ASSIGNING',
          staffAssignments: [],
        }) as unknown as MissionResponse,
    ),
  )
  vi.spyOn(planningApi, 'getAssignments').mockImplementation(async (id) => ({
    missionId: id,
    revision: 7,
    assignments: [],
  }))
  vi.spyOn(planningApi, 'getSafeStop').mockResolvedValue(stop)
})
afterEach(() => vi.restoreAllMocks())
describe('Manager multi-Mission planning', () => {
  it('loads persisted replacement chains after remount without creation-session state', async () => {
    vi.mocked(planningApi.getOrderMissions).mockResolvedValue([
      {
        id: 'm1',
        orderId: 'o',
        missionCode: 'M1',
        status: 'CANCELLED',
        replacesMissionId: null,
      },
      {
        id: 'm2',
        orderId: 'o',
        missionCode: 'M2',
        status: 'CANCELLED',
        replacesMissionId: 'm1',
      },
      {
        id: 'm3',
        orderId: 'o',
        missionCode: 'M3',
        status: 'RESOURCE_ASSIGNING',
        replacesMissionId: 'm2',
      },
    ] as MissionResponse[])
    const first = render(<OrderMissionPlanningSection orderId="o" />)
    await screen.findAllByText(/Replacement cho/)
    first.unmount()
    render(<OrderMissionPlanningSection orderId="o" />)
    const relations = await screen.findAllByText(/Replacement cho/)
    expect(
      within(relations[0]).getByRole('link', { name: 'M1' }),
    ).toHaveAttribute('href', '#portal/manager/missions/m1/detail')
    expect(
      within(relations[1]).getByRole('link', { name: 'M2' }),
    ).toHaveAttribute('href', '#portal/manager/missions/m2/detail')
    expect(screen.getAllByText(/Được thay thế bởi/)).toHaveLength(2)
  })
  it('does not infer cancellation from READY_FOR_CANCELLATION when the server denies it', async () => {
    vi.mocked(planningApi.getSafeStop).mockResolvedValue({
      ...stop,
      status: 'READY_FOR_CANCELLATION',
      canCancelMission: false,
    })
    render(<OrderMissionPlanningSection orderId="o" />)
    await screen.findAllByText('READY_FOR_CANCELLATION')
    expect(
      screen.queryByRole('button', { name: 'Hủy Mission M1' }),
    ).not.toBeInTheDocument()
  })
  it('enables cancellation only after cleanup and a refreshed server capability', async () => {
    let cleaned = false
    let permitted = false
    vi.mocked(planningApi.getSafeStop).mockImplementation(
      async (missionId) => ({
        ...stop,
        missionId,
        status: cleaned ? 'READY_FOR_CANCELLATION' : 'IN_PROGRESS',
        canRequestSafeStop: false,
        canCleanupSafeStop: missionId === 'm1' && !cleaned,
        canCancelMission: missionId === 'm1' && permitted,
      }),
    )
    vi.spyOn(planningApi, 'cleanupSafeStop').mockImplementation(async () => {
      cleaned = true
      return {
        ...stop,
        status: 'READY_FOR_CANCELLATION',
        canCancelMission: true,
      }
    })
    render(<OrderMissionPlanningSection orderId="o" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Cleanup Mission' }),
    )
    await screen.findAllByText('READY_FOR_CANCELLATION')
    expect(
      screen.queryByRole('button', { name: 'Hủy Mission M1' }),
    ).not.toBeInTheDocument()
    permitted = true
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Safe-stop m1' })).getByRole(
        'button',
        { name: 'Làm mới safe-stop' },
      ),
    )
    expect(
      await screen.findByRole('button', { name: 'Hủy Mission M1' }),
    ).toBeEnabled()
  })
  it('shows every Mission, exact links, authoritative repeated coverage and second create', async () => {
    render(<OrderMissionPlanningSection orderId="o" />)
    expect(await screen.findByRole('link', { name: 'M3' })).toHaveAttribute(
      'href',
      '#portal/manager/missions/m3/detail',
    )
    expect(
      screen.getByRole('link', { name: 'Tạo thêm Mission' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Phân công lặp')).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: 'Chốt kế hoạch' })).toBeEnabled()
  })
  it('shows uncovered backend items and disables finalize', async () => {
    vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
      ...plan,
      coverage: {
        ...plan.coverage,
        covered: 4,
        uncovered: 1,
        coverageReady: false,
        uncoveredItemIds: ['E'],
      },
    })
    render(<OrderMissionPlanningSection orderId="o" />)
    expect(
      await screen.findByRole('list', { name: 'Checklist chưa phủ' }),
    ).toHaveTextContent('Requirement E')
    expect(screen.getByRole('button', { name: 'Chốt kế hoạch' })).toBeDisabled()
  })
  it('submits split assignments with repeated E across sibling Missions', async () => {
    const update = vi
      .spyOn(planningApi, 'updateMissionChecklistAssignments')
      .mockResolvedValue({ missionId: 'm1', revision: 7, assignments: [] })
    render(<OrderMissionPlanningSection orderId="o" />)
    for (const [id, indices] of [
      ['m1', [0, 2, 4]],
      ['m2', [1, 3, 4]],
    ] as const) {
      const field = await screen.findByRole('group', {
        name: `Checklist ${id}`,
      })
      await waitFor(() =>
        expect(within(field).getAllByRole('checkbox')[0]).toBeEnabled(),
      )
      for (const index of indices)
        fireEvent.click(within(field).getAllByRole('checkbox')[index])
      fireEvent.click(
        within(field.closest('details')!).getByRole('button', {
          name: 'Lưu phân công',
        }),
      )
      await waitFor(() =>
        expect(update).toHaveBeenCalledWith(
          id,
          7,
          id === 'm1' ? ['A', 'C', 'E'] : ['B', 'D', 'E'],
        ),
      )
    }
    expect(screen.getByText('Phân công lặp')).toHaveTextContent('1')
  })
  it('keeps unsaved selection after stale conflict, refreshes and does not retry', async () => {
    const update = vi
      .spyOn(planningApi, 'updateMissionChecklistAssignments')
      .mockRejectedValue(
        new ApiError('Stale', {
          code: 'EXECUTION_PLAN_REVISION_CONFLICT',
          status: 409,
          method: 'PUT',
          path: '/test',
        }),
      )
    render(<OrderMissionPlanningSection orderId="o" />)
    const field = await screen.findByRole('group', { name: 'Checklist m1' })
    await waitFor(() =>
      expect(within(field).getAllByRole('checkbox')[0]).toBeEnabled(),
    )
    fireEvent.click(within(field).getAllByRole('checkbox')[0])
    fireEvent.click(
      within(field.closest('details')!).getByRole('button', {
        name: 'Lưu phân công',
      }),
    )
    expect(await screen.findByText(/Kế hoạch đã thay đổi/)).toBeInTheDocument()
    expect(within(field).getAllByRole('checkbox')[0]).toBeChecked()
    expect(update).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledWith('m1', 7, ['A'])
  })
  it('finalize refresh locks assignment/create and amendment preserves finalized Missions', async () => {
    const finalized = {
      ...plan,
      planStatus: 'FINALIZED' as const,
      missions: plan.missions.map((m) => ({ ...m, finalizedPlanRevision: 7 })),
    }
    vi.spyOn(planningApi, 'finalizeExecutionPlan').mockImplementation(
      async () => {
        vi.mocked(planningApi.getExecutionPlan).mockResolvedValue(finalized)
        return finalized
      },
    )
    vi.spyOn(planningApi, 'amendExecutionPlan').mockImplementation(async () => {
      vi.mocked(planningApi.getExecutionPlan).mockResolvedValue({
        ...finalized,
        planStatus: 'DRAFT',
      })
      return {
        orderId: 'o',
        executionPlanStatus: 'DRAFT',
        executionPlanRevision: 7,
        amendedAt: '',
        amendmentReason: 'Weather',
      }
    })
    render(<OrderMissionPlanningSection orderId="o" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Chốt kế hoạch' }),
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Mở amendment' }))
    expect(
      screen.queryByRole('link', { name: 'Tạo thêm Mission' }),
    ).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Lý do amendment'), {
      target: { value: 'Weather' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận amendment' }))
    expect(
      await screen.findByRole('link', { name: 'Tạo thêm Mission' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText('Đã chốt tại revision 7', { exact: false }),
    ).toHaveLength(3)
    expect(
      screen.queryByRole('button', { name: 'Lưu phân công' }),
    ).not.toBeInTheDocument()
  })
  it('replacement route retains Order and cancelled original identity', () => {
    const route = {
      screen: 'missionCreate' as const,
      orderId: 'o',
      replacesMissionId: 'm1',
    }
    expect(parseManagerRoute(managerHref(route))).toEqual(route)
  })
  it('cancel safe-stop blocker remains visible and does not remove the Mission locally', async () => {
    const cancel = vi.spyOn(planningApi, 'cancelMission').mockRejectedValue(
      new ApiError('Unsafe', {
        code: 'MISSION_CANCELLATION_REQUIRES_SAFE_STOP',
        status: 409,
        method: 'POST',
        path: '/cancel',
      }),
    )
    render(<OrderMissionPlanningSection orderId="o" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Hủy Mission M1' }),
    )
    fireEvent.change(screen.getByLabelText('Lý do hủy M1'), {
      target: { value: 'Weather' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Xác nhận hủy Mission' }),
    )
    expect(await screen.findByText(/Mission cần safe-stop/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'M1' })).toBeInTheDocument()
    expect(cancel).toHaveBeenCalledWith('m1', {
      expectedPlanRevision: 7,
      reason: 'Weather',
    })
    expect(cancel).toHaveBeenCalledTimes(1)
  })
  it('only offers replacement after actual cancellation, not safe-stop readiness', async () => {
    vi.mocked(planningApi.getOrderMissions).mockResolvedValue([
      { id: 'm1', orderId: 'o', missionCode: 'M1', status: 'CANCELLED' },
      { id: 'm2', orderId: 'o', missionCode: 'M2', status: 'PENDING_REVIEW' },
    ] as MissionResponse[])
    vi.mocked(planningApi.getSafeStop).mockResolvedValue({
      ...stop,
      status: 'READY_FOR_CANCELLATION',
    })
    render(<OrderMissionPlanningSection orderId="o" />)
    expect(
      await screen.findByRole('link', { name: 'Tạo replacement cho M1' }),
    ).toHaveAttribute('href', '#portal/manager/orders/o/replacement/m1')
    expect(
      screen.queryByRole('link', { name: 'Tạo replacement cho M2' }),
    ).not.toBeInTheDocument()
  })
})
describe('safe-stop role boundaries', () => {
  it('Manager can request but never confirm crew landing even if capability is true', async () => {
    vi.mocked(planningApi.getSafeStop).mockResolvedValue({
      ...stop,
      canConfirmSafeStop: true,
    })
    render(
      <SafeStopPanel
        missionId="m1"
        revision={7}
        manager
        onChanged={() => {}}
      />,
    )
    expect(
      await screen.findByRole('button', { name: 'Yêu cầu safe-stop' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Xác nhận an toàn' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Cleanup Mission' }),
    ).not.toBeInTheDocument()
  })
  it('only exposes cleanup from explicit server capability and waits for server state', async () => {
    vi.mocked(planningApi.getSafeStop).mockResolvedValue({
      ...stop,
      status: 'IN_PROGRESS',
      canCleanupSafeStop: true,
    })
    const cleanup = vi
      .spyOn(planningApi, 'cleanupSafeStop')
      .mockImplementation(async () => {
        vi.mocked(planningApi.getSafeStop).mockResolvedValue({
          ...stop,
          status: 'READY_FOR_CANCELLATION',
          cleanedAt: '2026-10-07T00:00:00Z',
        })
        return { ...stop, status: 'READY_FOR_CANCELLATION' }
      })
    render(<SafeStopPanel missionId="m1" manager onChanged={() => {}} />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Cleanup Mission' }),
    )
    expect(
      await screen.findByText('READY_FOR_CANCELLATION'),
    ).toBeInTheDocument()
    expect(cleanup).toHaveBeenCalledTimes(1)
  })
  it('crew action fails closed without capability', async () => {
    vi.mocked(planningApi.getSafeStop).mockResolvedValue({
      ...stop,
      status: 'REQUESTED',
      canRequestSafeStop: undefined,
      canConfirmSafeStop: undefined,
      canCleanupSafeStop: undefined,
      canCancelMission: undefined,
    })
    render(<SafeStopPanel missionId="m1" onChanged={() => {}} />)
    await screen.findByText('REQUESTED')
    expect(
      screen.queryByRole('button', { name: 'Xác nhận an toàn' }),
    ).not.toBeInTheDocument()
  })
  it('Manager actions and cancellation fail closed with an older capability-less response', async () => {
    vi.mocked(planningApi.getSafeStop).mockResolvedValue({
      ...stop,
      canRequestSafeStop: undefined,
      canConfirmSafeStop: undefined,
      canCleanupSafeStop: undefined,
      canCancelMission: undefined,
    })
    render(<OrderMissionPlanningSection orderId="o" />)
    await screen.findByRole('link', { name: 'M1' })
    await waitFor(() =>
      expect(planningApi.getSafeStop).toHaveBeenCalledTimes(3),
    )
    expect(
      screen.queryByRole('button', { name: 'Yêu cầu safe-stop' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Cleanup Mission' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Hủy Mission M1' }),
    ).not.toBeInTheDocument()
  })
  it('assigned crew with server capability must explicitly attest before confirmation', async () => {
    vi.mocked(planningApi.getSafeStop).mockResolvedValue({
      ...stop,
      status: 'REQUESTED',
      canConfirmSafeStop: true,
    })
    const confirm = vi
      .spyOn(planningApi, 'confirmSafeStop')
      .mockResolvedValue({ ...stop, status: 'IN_PROGRESS' })
    render(<SafeStopPanel missionId="m1" onChanged={() => {}} />)
    const button = await screen.findByRole('button', {
      name: 'Xác nhận an toàn',
    })
    expect(button).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Xác nhận vận hành m1'), {
      target: { value: 'Landed and disarmed' },
    })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(button)
    await waitFor(() =>
      expect(confirm).toHaveBeenCalledWith('m1', 'Landed and disarmed'),
    )
  })
})
