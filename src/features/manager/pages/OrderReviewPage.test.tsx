import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../../shared/api/httpClient'
import { ordersApi } from '../api/ordersApi'
import type {
  OrderAnalysis,
  OrderDetail,
  OrderResourcePreview,
} from '../types/orders'
import { OrderReviewPage } from './OrderReviewPage'

const order: OrderDetail = {
  id: 'ord-2609-0157',
  code: 'ORD-2609-0157',
  status: 'PENDING',
  customer: {
    fullName: 'Lê Quốc Bảo',
    companyName: 'Công ty CP Logistics Cát Lái',
    email: 'bao.le@logisticscatlai.vn',
    phone: '0918 227 640',
  },
  serviceName: 'Tuần tra an ninh khu vực',
  preferredDate: '25/09',
  preferredTimeName: 'Chiều',
  preferredWindow: '25/09/2026 · Chiều 13:00–17:00',
  submittedAt: '2026-09-18T08:15:00+07:00',
  addressText: 'Cảng Cát Lái, P. Cát Lái, TP. Thủ Đức',
  center: { lat: 10.7686, lon: 106.7952 },
  radiusM: 600,
  nearestBase: 'Trạm Bình Thạnh · 5,9 km',
  mediaRequirements: [{ label: 'VIDEO × 2 · 300 giây · 1080p' }],
  purpose: 'Tuần tra bãi container ngoài giờ',
  attachments: [],
}

const feasibleAnalysis: OrderAnalysis = {
  overallVerdict: 'FEASIBLE',
  blockerCount: 0,
  warningCount: 0,
  ruleEngineMs: 172,
  createdAt: '2026-09-14T00:00:00+07:00',
  llmSummary: 'Yêu cầu đáp ứng các luật kiểm tra. Nên duyệt.',
  findings: [
    {
      severity: 'INFO',
      message: 'Vòng giám sát giao cắt vùng hạn chế Cát Lái.',
      evidence: { 'Trần cho phép': '60 m' },
      customerAction: 'AUTO_FIXED',
    },
  ],
}

const riskyAnalysis: OrderAnalysis = {
  overallVerdict: 'RISKY',
  blockerCount: 0,
  warningCount: 2,
  ruleEngineMs: 172,
  createdAt: '2026-09-14T00:00:00+07:00',
  llmSummary: 'Có 2 cảnh báo cần cân nhắc trước khi duyệt.',
  findings: [
    {
      severity: 'WARNING',
      message: 'Vòng giám sát giao cắt vùng hạn chế Cát Lái, trần bay 60 m.',
      evidence: { 'Độ cao kế hoạch': '80 m' },
      customerAction: 'IGNORED',
    },
    {
      severity: 'WARNING',
      message: 'Chỉ còn 1 phi công đủ điều kiện khung chiều 25/09.',
      evidence: { 'Phi công đủ điều kiện': '1' },
      customerAction: null,
    },
  ],
}

const preview: OrderResourcePreview = {
  eligibleDroneCount: 4,
  eligiblePilotCount: 3,
  topDrones: [{ name: 'DRN-06 Cú Mèo', score: 88, distanceLabel: '4,1 km' }],
  topPilots: [
    { name: 'Bùi Anh Tuấn', score: 84, distanceLabel: '1 mission/tuần' },
  ],
}

function mockHappyPath(analysis: OrderAnalysis) {
  vi.spyOn(ordersApi, 'getOrder').mockResolvedValue(order)
  vi.spyOn(ordersApi, 'getLatestAnalysis').mockResolvedValue(analysis)
  vi.spyOn(ordersApi, 'getResourcePreview').mockResolvedValue(preview)
}

afterEach(() => {
  vi.restoreAllMocks()
  window.location.hash = ''
})

describe('OrderReviewPage', () => {
  it('renders FEASIBLE order data', async () => {
    mockHappyPath(feasibleAnalysis)
    render(<OrderReviewPage orderId="ord-2609-0157" />)

    await waitFor(() => screen.getByText('Duyệt đơn ORD-2609-0157'))
    expect(screen.getByText('Lê Quốc Bảo')).toBeInTheDocument()
    expect(screen.getByText('KHẢ THI')).toBeInTheDocument()
    expect(
      screen.getByText('Vòng giám sát giao cắt vùng hạn chế Cát Lái.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('drone đủ điều kiện', { exact: false }),
    ).toBeInTheDocument()
  })

  it('renders RISKY analysis for a different order', async () => {
    mockHappyPath(riskyAnalysis)
    render(<OrderReviewPage orderId="ord-2609-0160" />)

    await waitFor(() => screen.getByText('RỦI RO'))
    expect(screen.getByText('2 WARNING')).toBeInTheDocument()
    expect(
      screen.getByText('Chỉ còn 1 phi công đủ điều kiện khung chiều 25/09.'),
    ).toBeInTheDocument()
  })

  it('requires a reason before confirming reject, and a chip fills it in', async () => {
    mockHappyPath(feasibleAnalysis)
    vi.spyOn(ordersApi, 'submitApproval').mockResolvedValue(undefined)
    render(<OrderReviewPage orderId="ord-2609-0157" />)
    await waitFor(() => screen.getByText('Duyệt đơn ORD-2609-0157'))

    fireEvent.click(screen.getByRole('button', { name: 'Từ chối' }))
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận từ chối' }))
    expect(screen.getByText('Lý do là bắt buộc')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Vùng cấm bay' }))
    expect(
      screen.getByPlaceholderText('Khách hàng sẽ nhìn thấy nội dung này'),
    ).toHaveValue('Vùng cấm bay')
  })

  it('navigates back to the queue after a successful reject', async () => {
    mockHappyPath(feasibleAnalysis)
    vi.spyOn(ordersApi, 'submitApproval').mockResolvedValue(undefined)
    render(<OrderReviewPage orderId="ord-2609-0157" />)
    await waitFor(() => screen.getByText('Duyệt đơn ORD-2609-0157'))

    fireEvent.click(screen.getByRole('button', { name: 'Từ chối' }))
    fireEvent.click(screen.getByRole('button', { name: 'Vùng cấm bay' }))
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận từ chối' }))

    await waitFor(() =>
      expect(window.location.hash).toBe('#portal/staff/orders'),
    )
  })

  it('navigates to the create-mission route after approve', async () => {
    mockHappyPath(feasibleAnalysis)
    vi.spyOn(ordersApi, 'approve').mockResolvedValue(undefined)
    render(<OrderReviewPage orderId="ord-2609-0157" />)
    await waitFor(() => screen.getByText('Duyệt đơn ORD-2609-0157'))

    fireEvent.click(
      screen.getByRole('button', { name: 'Duyệt và tạo mission' }),
    )

    await waitFor(() =>
      expect(window.location.hash).toBe(
        '#portal/staff/orders/ord-2609-0157/mission',
      ),
    )
  })

  it('shows the 409 error state', async () => {
    vi.spyOn(ordersApi, 'getOrder').mockRejectedValue(
      new ApiError('Đơn không còn ở trạng thái chờ duyệt', {
        status: 409,
        code: 'ORDER_NOT_UNDER_REVIEW',
        method: 'GET',
        path: '/orders/ord-2609-0157',
      }),
    )
    vi.spyOn(ordersApi, 'getLatestAnalysis').mockResolvedValue(feasibleAnalysis)
    vi.spyOn(ordersApi, 'getResourcePreview').mockResolvedValue(preview)

    render(<OrderReviewPage orderId="ord-2609-0157" />)

    await waitFor(() => screen.getByText('Không tải được hồ sơ đơn'))
    expect(
      screen.getByText(/Đơn không còn ở trạng thái chờ duyệt/),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Về hàng đợi' })).toHaveAttribute(
      'href',
      '#portal/staff/orders',
    )
  })

  it('saves the internal note', async () => {
    mockHappyPath(feasibleAnalysis)
    vi.spyOn(ordersApi, 'saveInternalNote').mockResolvedValue({
      note: 'Ghi chú mới',
      authorName: 'Lê Thị Thanh Hằng',
      updatedAt: '2026-09-19T13:50:00+07:00',
    })
    render(<OrderReviewPage orderId="ord-2609-0157" />)
    await waitFor(() => screen.getByText('Duyệt đơn ORD-2609-0157'))

    fireEvent.change(
      screen.getByPlaceholderText(
        'Thêm ghi chú cho đồng nghiệp (khách không thấy)',
      ),
      { target: { value: 'Ghi chú mới' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' }))

    await waitFor(() => screen.getByText('Đã lưu'))
  })
})
