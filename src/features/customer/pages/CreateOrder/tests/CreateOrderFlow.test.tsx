import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { CreateOrderPage } from '../CreateOrderPage'

beforeEach(() => {
  resetMockDb()
})
afterEach(() => {
  resetMockDb()
})

const next = (label: string) =>
  fireEvent.click(screen.getByRole('button', { name: `Tiếp tục: ${label}` }))

async function fillLocation() {
  fireEvent.change(await screen.findByLabelText(/Địa chỉ\/khu vực/), {
    target: { value: 'KCN Long Hậu' },
  })
  next('AI tư vấn & mục tiêu')
}

describe('CreateOrderPage wizard', () => {
  it('shows the real location map and step 1 fields', async () => {
    render(<CreateOrderPage />)
    expect(await screen.findByRole('application', { name: 'Bản đồ chọn vị trí giám sát' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Địa chỉ\/khu vực/)).toBeInTheDocument()
  })

  it('blocks step 1 without an address and shows the validation message', async () => {
    render(<CreateOrderPage />)
    await screen.findByLabelText(/Địa chỉ\/khu vực/)
    next('AI tư vấn & mục tiêu')
    expect(await screen.findByText('Nhập địa chỉ/khu vực cần giám sát.')).toBeInTheDocument()
    expect(screen.queryByText('Thông tin yêu cầu')).not.toBeInTheDocument()
  })

  it('lists BE services on step 2 and requires a service and title', async () => {
    render(<CreateOrderPage />)
    await fillLocation()
    expect(await screen.findByText('Giám sát Tiến độ Xây dựng')).toBeInTheDocument()
    next('Thời gian và kết quả')
    expect(await screen.findByText('Chọn dịch vụ giám sát.')).toBeInTheDocument()
    expect(screen.getByText('Nhập tiêu đề yêu cầu.')).toBeInTheDocument()
  })

  it('shows the pricing estimate for the chosen service', async () => {
    render(<CreateOrderPage />)
    await fillLocation()
    fireEvent.click(await screen.findByRole('button', { name: /Giám sát Tiến độ Xây dựng/ }))
    expect((await screen.findAllByText(/3\.200\.000/)).length).toBe(2)
    fireEvent.click(screen.getByLabelText(/AI phân tích hình ảnh/))
    expect(await screen.findByText(/^\+.*500\.000/)).toBeInTheDocument()
    expect(await screen.findByText(/3\.700\.000/)).toBeInTheDocument()
  })

  it('walks through all steps and submits via the confirm dialog', async () => {
    render(<CreateOrderPage />)
    await fillLocation()
    fireEvent.click(await screen.findByRole('button', { name: /Giám sát Tiến độ Xây dựng/ }))
    fireEvent.change(screen.getByLabelText(/Tiêu đề/), { target: { value: 'Đơn kiểm thử' } })
    next('Thời gian và kết quả')

    const deliverable = (await screen.findByLabelText(/Loại kết quả/)) as HTMLSelectElement
    await waitFor(() => expect(deliverable.value).toBe('dt-progress'))
    next('Xác nhận & gửi yêu cầu')

    expect(await screen.findByText('Xác nhận yêu cầu')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Gửi yêu cầu giám sát?')
    expect(dialog).toHaveTextContent('Đơn kiểm thử')
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }))

    expect(await screen.findByText('Đã tạo yêu cầu')).toBeInTheDocument()
    expect(window.localStorage.getItem('odm.customer.createOrderDraft.v1')).toBeNull()
  })

  it('closes the confirm dialog with Escape without submitting', async () => {
    render(<CreateOrderPage />)
    await fillLocation()
    fireEvent.click(await screen.findByRole('button', { name: /Giám sát Tiến độ Xây dựng/ }))
    fireEvent.change(screen.getByLabelText(/Tiêu đề/), { target: { value: 'T' } })
    next('Thời gian và kết quả')
    await waitFor(() =>
      expect((screen.getByLabelText(/Loại kết quả/) as HTMLSelectElement).value).toBe('dt-progress'),
    )
    next('Xác nhận & gửi yêu cầu')
    fireEvent.click(await screen.findByRole('button', { name: 'Gửi yêu cầu' }))
    await screen.findByRole('dialog')
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('switches step labels to English', async () => {
    render(<CreateOrderPage />)
    await screen.findByLabelText(/Địa chỉ\/khu vực/)
    act(() => setLanguage('en'))
    expect(await screen.findByRole('button', { name: 'Continue: AI consultation & target' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Address\/area/)).toBeInTheDocument()
  })
})
