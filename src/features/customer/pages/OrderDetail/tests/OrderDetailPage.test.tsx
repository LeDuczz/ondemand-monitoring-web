import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { customerApi } from '../../../api/customerApi'
import { OrderDetailPage } from '../OrderDetailPage'

beforeEach(() => resetMockDb())
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

describe('OrderDetailPage', () => {
  it('renders the Vietnamese order-info heading from GET /api/orders/{id}', async () => {
    render(<OrderDetailPage orderId="cus-ord-003" />)
    expect(await screen.findByText('Thông tin đơn hàng')).toBeInTheDocument()
    expect(screen.getByText('Tuần tra an ninh công trường Sala Riverside')).toBeInTheDocument()
  })

  it('renders the English order-info heading when language is switched', async () => {
    render(<OrderDetailPage orderId="cus-ord-003" />)
    await screen.findByText('Thông tin đơn hàng')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Order information')).toBeInTheDocument()
  })

  it('shows the status with OrderStatusBadge', async () => {
    render(<OrderDetailPage orderId="cus-ord-006" />)
    expect(await screen.findByText('Hoàn thành', { selector: '.ui-badge' })).toBeInTheDocument()
  })

  it('shows the rejection reason from the BE for a rejected order', async () => {
    render(<OrderDetailPage orderId="cus-ord-007" />)
    expect(await screen.findByText('Đơn bị từ chối')).toBeInTheDocument()
    expect(screen.getByText(/vùng kiểm soát không lưu sân bay TSN/)).toBeInTheDocument()
  })

  it('offers no cancel action once the order is approved', async () => {
    render(<OrderDetailPage orderId="cus-ord-005" />)
    await screen.findByText('Thông tin đơn hàng')
    expect(screen.queryByRole('button', { name: 'Huỷ đơn hàng' })).not.toBeInTheDocument()
  })

  it('cancels a pending order through a danger confirm dialog, marked as sample data', async () => {
    const cancel = vi.spyOn(customerApi, 'cancelOrder')
    render(<OrderDetailPage orderId="cus-ord-003" />)
    await screen.findByText('Thông tin đơn hàng')
    expect(screen.getByText('Dữ liệu mẫu')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Huỷ đơn hàng' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Huỷ đơn hàng?')).toBeInTheDocument()
    expect(dialog.querySelector('.ui-modal-icon.is-danger')).not.toBeNull()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Huỷ đơn hàng' }))
    await waitFor(() => expect(cancel).toHaveBeenCalledWith('cus-ord-003'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Đã huỷ', { selector: '.ui-badge' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Huỷ đơn hàng' })).not.toBeInTheDocument()
  })

  it('keeps the order when the dialog is dismissed', async () => {
    const cancel = vi.spyOn(customerApi, 'cancelOrder')
    render(<OrderDetailPage orderId="cus-ord-003" />)
    await screen.findByText('Thông tin đơn hàng')
    fireEvent.click(screen.getByRole('button', { name: 'Huỷ đơn hàng' }))
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Giữ đơn' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(cancel).not.toHaveBeenCalled()
  })

  it('shows the cancel error inside the dialog', async () => {
    vi.spyOn(customerApi, 'cancelOrder').mockRejectedValue(new Error('Không thể huỷ đơn ở trạng thái này.'))
    render(<OrderDetailPage orderId="cus-ord-003" />)
    await screen.findByText('Thông tin đơn hàng')
    fireEvent.click(screen.getByRole('button', { name: 'Huỷ đơn hàng' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Huỷ đơn hàng' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Không thể huỷ đơn ở trạng thái này.')
  })

  it('shows an error with retry when the order is missing', async () => {
    render(<OrderDetailPage orderId="does-not-exist" />)
    expect(await screen.findByText('Không tải được đơn hàng')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })
})
