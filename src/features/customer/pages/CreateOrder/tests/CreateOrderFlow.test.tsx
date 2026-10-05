import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { CreateOrderPage } from '../CreateOrderPage'
import { customerApi } from '../../../api/customerApi'

beforeEach(() => {
  resetMockDb()
})
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

const next = (label: string) =>
  fireEvent.click(screen.getByRole('button', { name: `Tiếp tục: ${label}` }))

async function fillService() {
  fireEvent.click(
    await screen.findByRole('button', { name: /Giám sát Tiến độ Xây dựng/ }),
  )
  fireEvent.change(screen.getByLabelText(/Tiêu đề/), {
    target: { value: 'Đơn kiểm thử' },
  })
  next('Vị trí & vùng giám sát')
}

async function fillLocation() {
  fireEvent.change(await screen.findByLabelText(/Địa chỉ\/khu vực/), {
    target: { value: 'KCN Long Hậu' },
  })
  next('Thời gian')
}

describe('CreateOrderPage wizard', () => {
  it.each(['mixed', 'empty'] as const)(
    'submits the %s checklist through the complete wizard',
    async (selection) => {
      vi.spyOn(customerApi, 'getServiceChecklist').mockResolvedValue(
        ['Keep', 'Edit', 'Remove'].map((content, index) => ({
          id: `link-${index}`,
          serviceId: 'svc-2',
          checklistId: `catalog-${index}`,
          checklistVersion: index + 10,
          displayOrder: index,
          content,
          serviceActive: true,
          checklistActive: true,
        })),
      )
      const create = vi.spyOn(customerApi, 'createOrder')
      render(<CreateOrderPage />)
      await fillService()
      await fillLocation()
      next('Kết quả bàn giao & xác nhận')
      await waitFor(() =>
        expect(
          (screen.getByLabelText(/Loại kết quả/) as HTMLSelectElement).value,
        ).toBe('dt-progress'),
      )
      await screen.findByLabelText('Nội dung giám sát 1')
      if (selection === 'empty') {
        for (let index = 1; index <= 3; index++)
          fireEvent.click(screen.getByLabelText(`Chọn nội dung ${index}`))
      } else {
        fireEvent.change(screen.getByLabelText('Nội dung giám sát 2'), {
          target: { value: 'Edited requirement' },
        })
        fireEvent.click(screen.getByLabelText('Chọn nội dung 3'))
        fireEvent.click(screen.getByRole('button', { name: '+ Thêm nội dung' }))
        fireEvent.change(screen.getByLabelText('Nội dung giám sát 4'), {
          target: { value: 'Custom requirement' },
        })
      }
      fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
      await screen.findByRole('dialog')
      fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }))
      await screen.findByText('Đã tạo yêu cầu')
      expect(create).toHaveBeenCalledTimes(1)
      expect(create.mock.calls[0][0].checklistItems).toEqual(
        selection === 'empty'
          ? []
          : [
              { sourceChecklistId: 'catalog-0', expectedChecklistVersion: 10 },
              {
                sourceChecklistId: 'catalog-1',
                expectedChecklistVersion: 11,
                contentOverride: 'Edited requirement',
              },
              { contentOverride: 'Custom requirement' },
            ],
      )
    },
  )

  it('shows services and goal fields on step 1', async () => {
    render(<CreateOrderPage />)
    expect(
      await screen.findByText('Giám sát Tiến độ Xây dựng'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Tiêu đề/)).toBeInTheDocument()
  })

  it('blocks step 1 without a service and title', async () => {
    render(<CreateOrderPage />)
    await screen.findByText('Giám sát Tiến độ Xây dựng')
    next('Vị trí & vùng giám sát')
    expect(
      await screen.findByText('Chọn dịch vụ giám sát.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Nhập tiêu đề yêu cầu.')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Địa chỉ\/khu vực/)).not.toBeInTheDocument()
  })

  it('shows the real location map on step 2 and requires an address', async () => {
    render(<CreateOrderPage />)
    await fillService()
    expect(
      await screen.findByRole('application', {
        name: 'Bản đồ chọn vị trí giám sát',
      }),
    ).toBeInTheDocument()
    next('Thời gian')
    expect(
      await screen.findByText('Nhập địa chỉ/khu vực cần giám sát.'),
    ).toBeInTheDocument()
  })

  it('continues from location to schedule after a valid address', async () => {
    render(<CreateOrderPage />)
    await fillService()
    await fillLocation()
    expect(await screen.findByLabelText(/Ngày sớm nhất/)).toBeInTheDocument()
  })

  it('shows the pricing estimate for the chosen service', async () => {
    render(<CreateOrderPage />)
    fireEvent.click(
      await screen.findByRole('button', { name: /Giám sát Tiến độ Xây dựng/ }),
    )
    expect((await screen.findAllByText(/3\.200\.000/)).length).toBe(2)
    fireEvent.click(screen.getByLabelText(/AI phân tích hình ảnh/))
    expect(await screen.findByText(/^\+.*500\.000/)).toBeInTheDocument()
    expect(await screen.findByText(/3\.700\.000/)).toBeInTheDocument()
  })

  it('walks through all steps and submits via the confirm dialog', async () => {
    render(<CreateOrderPage />)
    await fillService()
    await fillLocation()

    next('Kết quả bàn giao & xác nhận')
    await waitFor(() =>
      expect(
        (screen.getByLabelText(/Loại kết quả/) as HTMLSelectElement).value,
      ).toBe('dt-progress'),
    )

    expect(await screen.findByText('Xác nhận yêu cầu')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Gửi yêu cầu giám sát?')
    expect(dialog).toHaveTextContent('Đơn kiểm thử')
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }))

    expect(await screen.findByText('Đã tạo yêu cầu')).toBeInTheDocument()
    expect(
      window.localStorage.getItem('odm.customer.createOrderDraft.v1'),
    ).toBeNull()
  })

  it('closes the confirm dialog with Escape without submitting', async () => {
    render(<CreateOrderPage />)
    await fillService()
    await fillLocation()
    next('Kết quả bàn giao & xác nhận')
    await waitFor(() =>
      expect(
        (screen.getByLabelText(/Loại kết quả/) as HTMLSelectElement).value,
      ).toBe('dt-progress'),
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Gửi yêu cầu' }))
    await screen.findByRole('dialog')
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('switches step labels to English', async () => {
    render(<CreateOrderPage />)
    await screen.findByText('Giám sát Tiến độ Xây dựng')
    act(() => setLanguage('en'))
    expect(
      await screen.findByRole('button', {
        name: 'Continue: Location & monitoring area',
      }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Title/)).toBeInTheDocument()
  })
})
