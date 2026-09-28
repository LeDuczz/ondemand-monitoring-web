// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { customerMissionHistoryApi } from '../api/customerMissionHistoryApi'
import { customerHref, parseCustomerRoute } from '../routes'
import { MissionHistoryPage } from './MissionHistoryPage'
import { MissionHistoryDetailPage } from './MissionHistoryDetailPage'

vi.mock('../api/customerMissionHistoryApi', () => ({
  customerMissionHistoryApi: {
    list: vi.fn(),
    get: vi.fn(),
    mediaStatus: vi.fn(),
  },
  customerMissionMediaApi: { list: vi.fn(), get: vi.fn() },
}))
vi.mock('../../media/components/MissionUploadedMedia', () => ({
  MissionUploadedMedia: ({ missionId }: { missionId: string }) => (
    <div>Gallery: {missionId}</div>
  ),
}))
const mission = {
  id: 'mission',
  missionCode: 'MS-1',
  orderId: 'order',
  orderTitle: 'Survey',
  address: 'Forest',
  status: 'COMPLETED' as const,
  scheduledStartAt: null,
  startedAt: null,
  completedAt: '2026-09-27T00:00:00Z',
  description: null,
}
describe('customer mission history', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)
  it('supports history list/detail routes', () => {
    expect(
      parseCustomerRoute(customerHref({ screen: 'missionHistory' })),
    ).toEqual({ screen: 'missionHistory' })
    expect(
      parseCustomerRoute(
        customerHref({ screen: 'missionHistoryDetail', missionId: 'mission' }),
      ),
    ).toEqual({ screen: 'missionHistoryDetail', missionId: 'mission' })
  })
  it('lists missions with links to their results', async () => {
    vi.mocked(customerMissionHistoryApi.list).mockResolvedValue({
      items: [mission],
      page: 0,
      totalItems: 1,
      totalPages: 1,
      first: true,
      last: true,
    })
    render(<MissionHistoryPage />)
    await screen.findByText('MS-1')
    expect(screen.getByText('Xem chi tiết và media').getAttribute('href')).toBe(
      '#portal/customer/mission-history/mission',
    )
  })
  it('shows processing results without claiming all files are available', async () => {
    vi.mocked(customerMissionHistoryApi.get).mockResolvedValue(mission)
    vi.mocked(customerMissionHistoryApi.mediaStatus).mockResolvedValue({
      availableCount: 1,
      processingCount: 2,
      rejectedCount: 0,
    })
    render(<MissionHistoryDetailPage missionId="mission" />)
    await screen.findByText('Gallery: mission')
    await screen.findByText(/Kết quả đang được xử lý: 2 file/)
    expect(screen.getByText('1 file sẵn sàng.')).toBeTruthy()
  })
  it('does not render media when mission access is denied', async () => {
    vi.mocked(customerMissionHistoryApi.get).mockRejectedValue(
      new Error('Forbidden'),
    )
    vi.mocked(customerMissionHistoryApi.mediaStatus).mockRejectedValue(
      new Error('Forbidden'),
    )
    render(<MissionHistoryDetailPage missionId="other" />)
    await screen.findByText(/Không thể xem mission này/)
    expect(screen.queryByText('Gallery: other')).toBeNull()
  })
  it('retries a failed history request', async () => {
    vi.mocked(customerMissionHistoryApi.list)
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValue({
        items: [],
        page: 0,
        totalItems: 0,
        totalPages: 0,
        first: true,
        last: true,
      })
    render(<MissionHistoryPage />)
    await screen.findByText(/Không tải được lịch sử mission/)
    fireEvent.click(screen.getByText('Thử lại'))
    await screen.findByText('Chưa có mission nào trong lịch sử.')
  })
})
