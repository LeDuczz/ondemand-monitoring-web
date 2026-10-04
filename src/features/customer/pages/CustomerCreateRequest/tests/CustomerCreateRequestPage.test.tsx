import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { customerApi } from '../../../api/customerApi'
import { ApiError } from '../../../../../shared/api/httpClient'
import { CustomerCreateRequestPage } from '../CustomerCreateRequestPage'

beforeEach(() => {
  resetMockDb()
  // The simulation map metadata is a static file, not an API call.
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
})
afterEach(() => {
  resetMockDb()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function fillForm() {
  fireEvent.change(await screen.findByLabelText(/Địa chỉ\/khu vực/), {
    target: { value: 'KCN Long Hậu' },
  })
  fireEvent.change(screen.getByLabelText(/Tiêu đề yêu cầu/), {
    target: { value: 'Đơn nhanh' },
  })
  fireEvent.click(
    await screen.findByRole('button', { name: /Giám sát Tiến độ Xây dựng/ }),
  )
  const deliverable = (await screen.findByLabelText(
    /Loại kết quả/,
  )) as HTMLSelectElement
  await waitFor(() => expect(deliverable.value).toBe('dt-progress'))
}

describe('CustomerCreateRequestPage', () => {
  it('renders the Vietnamese page title', async () => {
    render(<CustomerCreateRequestPage />)
    expect(await screen.findByText('Tạo yêu cầu giám sát')).toBeInTheDocument()
  })

  it('renders the English page title when language is switched', async () => {
    render(<CustomerCreateRequestPage />)
    await screen.findByText('Tạo yêu cầu giám sát')
    act(() => setLanguage('en'))
    expect(
      await screen.findByText('Create Monitoring Request'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Submit request' }),
    ).toBeInTheDocument()
  })

  it('lists BE services (not the legacy category list) and price estimate', async () => {
    render(<CustomerCreateRequestPage />)
    expect(
      await screen.findByRole('button', { name: /Giám sát Tiến độ Xây dựng/ }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Hạ tầng')).not.toBeInTheDocument()
  })

  it('validates required fields before opening the confirm dialog', async () => {
    render(<CustomerCreateRequestPage />)
    await screen.findByLabelText(/Địa chỉ\/khu vực/)
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
    expect(
      await screen.findByText('Nhập địa chỉ/khu vực cần giám sát.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Chọn dịch vụ giám sát.')).toBeInTheDocument()
    expect(screen.getByText('Nhập tiêu đề yêu cầu.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('posts a BE OrderCreateRequest through customerApi.createOrder', async () => {
    const createOrder = vi.spyOn(customerApi, 'createOrder')
    render(<CustomerCreateRequestPage />)
    await fillForm()

    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Đơn nhanh')
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }))

    expect(await screen.findByText('Đã tạo yêu cầu')).toBeInTheDocument()
    expect(createOrder).toHaveBeenCalledTimes(1)
    const payload = createOrder.mock.calls[0][0]
    expect(payload.checklistItems).toEqual([
      { sourceChecklistId: 'check-progress', expectedChecklistVersion: 1 },
    ])
    expect(payload).toMatchObject({
      title: 'Đơn nhanh',
      serviceId: 'svc-2',
      address: 'KCN Long Hậu',
      preferredTimeId: expect.any(String),
    })
    expect(payload.coverageArea.type).toBe('Polygon')
    expect(typeof payload.longitude).toBe('number')
    expect(typeof payload.latitude).toBe('number')
    expect(payload.deliverables[0]).toMatchObject({
      deliverableTypeId: 'dt-progress',
    })
    expect(payload.deliverables[0].requirement).toMatchObject({
      mediaType: 'IMAGE',
    })
    // Legacy orderApi.OrderCreatePayload fields must be gone.
    for (const legacy of ['point', 'preferredDate', 'mediaType', 'purpose']) {
      expect(payload).not.toHaveProperty(legacy)
    }
  })

  it('validates deliverable selection before opening confirmation', async () => {
    render(<CustomerCreateRequestPage />)
    await fillForm()
    await screen.findByLabelText('Nội dung giám sát 1')
    fireEvent.change(screen.getByLabelText(/Loại kết quả/), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Loại kết quả/)).toHaveValue('')
    expect(
      screen.getByLabelText(/Loại kết quả/).closest('section'),
    ).toHaveTextContent('Chọn kết quả bàn giao.')
  })

  it('submits edited template and custom requirements', async () => {
    const create = vi.spyOn(customerApi, 'createOrder')
    render(<CustomerCreateRequestPage />)
    await fillForm()
    fireEvent.change(await screen.findByLabelText('Nội dung giám sát 1'), {
      target: { value: 'Kiểm tra tầng 1–3' },
    })
    fireEvent.click(screen.getByRole('button', { name: '+ Thêm nội dung' }))
    fireEvent.change(screen.getByLabelText('Nội dung giám sát 2'), {
      target: { value: 'Kiểm tra mũ bảo hộ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }))
    await screen.findByText('Đã tạo yêu cầu')
    expect(create.mock.calls[0][0].checklistItems).toEqual([
      {
        sourceChecklistId: 'check-progress',
        expectedChecklistVersion: 1,
        contentOverride: 'Kiểm tra tầng 1–3',
      },
      { contentOverride: 'Kiểm tra mũ bảo hộ' },
    ])
  })

  it('submits [] after deselecting all requirements', async () => {
    const create = vi.spyOn(customerApi, 'createOrder')
    render(<CustomerCreateRequestPage />)
    await fillForm()
    fireEvent.click(await screen.findByLabelText('Chọn nội dung 1'))
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }))
    await screen.findByText('Đã tạo yêu cầu')
    expect(create.mock.calls[0][0].checklistItems).toEqual([])
  })

  it('shows stale recovery after creation fails, without auto retry', async () => {
    const create = vi.spyOn(customerApi, 'createOrder').mockRejectedValue(
      new ApiError('internal detail', {
        status: 409,
        code: 'ORDER_CHECKLIST_TEMPLATE_CHANGED',
        method: 'POST',
        path: '/api/orders',
      }),
    )
    render(<CustomerCreateRequestPage />)
    await fillForm()
    await screen.findByLabelText('Nội dung giám sát 1')
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }))
    expect(
      await screen.findByRole('button', {
        name: 'Tải lại danh sách (bỏ chỉnh sửa)',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gửi yêu cầu' })).toBeDisabled()
    expect(screen.queryByText('internal detail')).not.toBeInTheDocument()
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('does not clear the create-order wizard draft', async () => {
    window.localStorage.setItem(
      'odm.customer.createOrderDraft.v1',
      '{"step":2}',
    )
    render(<CustomerCreateRequestPage />)
    await fillForm()
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }))
    await screen.findByText('Đã tạo yêu cầu')
    expect(
      window.localStorage.getItem('odm.customer.createOrderDraft.v1'),
    ).toBe('{"step":2}')
  })

  it('shows the API error inside the dialog and stays on the form', async () => {
    vi.spyOn(customerApi, 'createOrder').mockRejectedValue(
      new Error('Vùng bị từ chối'),
    )
    render(<CustomerCreateRequestPage />)
    await fillForm()
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }))
    expect(
      await screen.findByText('Không thể gửi yêu cầu. Vui lòng thử lại.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Vùng bị từ chối')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
