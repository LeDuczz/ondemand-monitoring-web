import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiRequest } from '../../../../../shared/api/httpClient'
import type { OrderDetailView } from '../../../lib/orders/types'
import { ReviewNotice } from './ReviewNotice'

vi.mock('../../../../../shared/api/httpClient', () => ({
  apiRequest: vi.fn(),
}))

const order = {
  id: 'order-1',
  status: 'NEEDS_INFO',
  rejectReason: 'Cần xác nhận quyền truy cập hiện trường',
  reviewByName: 'Manager',
  reviewAt: '2026-10-13T08:00:00Z',
} as OrderDetailView

describe('ReviewNotice', () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset()
    vi.mocked(apiRequest).mockResolvedValue(undefined)
  })

  it('lets the customer submit additional information and reloads the order', async () => {
    const onInformationSubmitted = vi.fn()
    render(
      <ReviewNotice
        order={order}
        onInformationSubmitted={onInformationSubmitted}
      />,
    )

    expect(
      screen.getByText(/Cần xác nhận quyền truy cập hiện trường/),
    ).toBeInTheDocument()
    const submit = screen.getByRole('button', { name: 'Gửi lại cho manager' })
    expect(submit).toBeDisabled()

    fireEvent.change(
      screen.getByLabelText('Nhập thông tin hoặc xác nhận bổ sung...'),
      { target: { value: 'Chủ đất đã đồng ý, số liên hệ 0900000000' } },
    )
    expect(submit).toBeEnabled()
    fireEvent.click(submit)

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        '/api/orders/order-1/additional-information',
        {
          method: 'POST',
          body: {
            information: 'Chủ đất đã đồng ý, số liên hệ 0900000000',
            siteContactName: '',
            siteContactPhone: '',
            accessNotes: '',
            monitoringRelationship: null,
            monitoringAuthorizationConfirmed: false,
          },
        },
      ),
    )
    expect(onInformationSubmitted).toHaveBeenCalledOnce()
    expect(screen.getByText('Đã gửi thông tin bổ sung.')).toBeInTheDocument()
  })
})
