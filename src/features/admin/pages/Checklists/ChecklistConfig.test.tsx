import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { ChecklistCatalogPage } from './ChecklistCatalogPage'
import { ServiceChecklistPage } from './ServiceChecklistPage'
import {
  checklistsApi,
  type ChecklistAudit,
  type ChecklistDefinition,
  type ServiceChecklist,
} from '../../api/checklistsApi'
import { catalogApi } from '../../api/catalogApi'
import { checklistPricingApi } from '../../../../shared/api/checklistPricingApi'

const shared: ChecklistDefinition = {
  id: 'a',
  content: 'Kiểm tra mái nhà',
  description: 'Phạm vi kiểm tra mái',
  executionSteps: ['Bay lưới song song', 'Chụp cận'],
  isActive: true,
  version: 3,
  createdAt: '2026-10-05T00:00:00Z',
  updatedAt: null,
  basePrice: 200_000,
  includedImageCount: 10,
  includedVideoCount: 1,
  usedByServiceCount: 3,
  usedByOrderCount: 12,
}
const link = (patch: Partial<ServiceChecklist> = {}): ServiceChecklist => ({
  id: 'link',
  serviceId: 's',
  serviceName: 'Dịch vụ test',
  serviceActive: true,
  checklistId: 'a',
  content: shared.content,
  checklistActive: true,
  displayOrder: 0,
  version: 4,
  checklistVersion: 3,
  basePrice: 200_000,
  includedImageCount: 10,
  includedVideoCount: 1,
  checklistBasePrice: 200_000,
  checklistIncludedImageCount: 10,
  checklistIncludedVideoCount: 1,
  usedByServiceCount: 3,
  ...patch,
})
const page = (items = [shared]) => ({
  items,
  page: 0,
  totalItems: items.length,
  totalPages: 1,
  first: true,
  last: true,
})
const audit = (patch: Partial<ChecklistAudit> = {}): ChecklistAudit => ({
  id: 'e1',
  action: 'CHECKLIST_UPDATED',
  checklistId: 'a',
  checklistContent: shared.content,
  serviceId: null,
  serviceName: null,
  actorId: 'u1',
  actorName: 'Admin An',
  changes: [{ field: 'basePrice', from: '200000', to: '250000' }],
  createdAt: '2026-10-06T08:30:00Z',
  ...patch,
})

beforeEach(() => {
  vi.spyOn(checklistsApi, 'list').mockResolvedValue(page())
  vi.spyOn(checklistsApi, 'get').mockResolvedValue(shared)
  vi.spyOn(checklistsApi, 'update').mockResolvedValue(shared)
  vi.spyOn(checklistsApi, 'template').mockResolvedValue([link()])
  vi.spyOn(checklistsApi, 'fork').mockResolvedValue(link({ checklistId: 'a2' }))
  vi.spyOn(checklistsApi, 'audits').mockResolvedValue({
    items: [audit()],
    page: 0,
    totalItems: 1,
    totalPages: 1,
    first: true,
    last: true,
  })
  vi.spyOn(catalogApi, 'listServices').mockResolvedValue([
    { id: 's', name: 'Dịch vụ test', basePrice: 3_200_000, isActive: true },
  ])
  vi.spyOn(checklistPricingApi, 'defaultPrice').mockRejectedValue(
    new Error('n/a'),
  )
})
afterEach(() => {
  vi.restoreAllMocks()
  window.location.hash = ''
})

describe('Library page', () => {
  it('shows how many services and orders use each checklist', async () => {
    render(<ChecklistCatalogPage />)
    expect(
      await screen.findByRole('button', { name: '3 dịch vụ · 12 đơn' }),
    ).toBeInTheDocument()
  })

  it('makes the admin acknowledge a change to a checklist shared by several services', async () => {
    render(<ChecklistCatalogPage />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sửa checklist' }),
    )
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('note')).toHaveTextContent(
      'đang dùng ở 3 dịch vụ',
    )
    const save = within(dialog).getByRole('button', { name: 'Lưu' })
    expect(save).toBeDisabled()
    fireEvent.click(
      within(dialog).getByLabelText(
        'Tôi hiểu thay đổi này áp dụng cho 3 dịch vụ',
      ),
    )
    expect(save).toBeEnabled()
    fireEvent.click(save)
    await waitFor(() => expect(checklistsApi.update).toHaveBeenCalledTimes(1))
  })

  it('does not gate a checklist that only one service uses', async () => {
    vi.spyOn(checklistsApi, 'list').mockResolvedValue(
      page([{ ...shared, usedByServiceCount: 1 }]),
    )
    render(<ChecklistCatalogPage />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sửa checklist' }),
    )
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByRole('note')).toBeNull()
    expect(within(dialog).getByRole('button', { name: 'Lưu' })).toBeEnabled()
  })

  it('shows the change history in the same dialog', async () => {
    render(<ChecklistCatalogPage />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sửa checklist' }),
    )
    fireEvent.click(
      await screen.findByRole('tab', { name: 'Lịch sử thay đổi' }),
    )
    expect(
      await screen.findByText('Sửa nội dung dùng chung'),
    ).toBeInTheDocument()
    expect(screen.getByText(/bởi Admin An/)).toBeInTheDocument()
    expect(screen.getByText('Giá công việc')).toBeInTheDocument()
    expect(screen.getByText('200000')).toBeInTheDocument()
    expect(screen.getByText('250000')).toBeInTheDocument()
    expect(checklistsApi.audits).toHaveBeenCalledWith(
      { checklistId: 'a', page: 0 },
      expect.anything(),
    )
  })

  it('says so when there is no history yet', async () => {
    vi.spyOn(checklistsApi, 'audits').mockResolvedValue({
      items: [],
      page: 0,
      totalItems: 0,
      totalPages: 0,
      first: true,
      last: true,
    })
    render(<ChecklistCatalogPage />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sửa checklist' }),
    )
    fireEvent.click(
      await screen.findByRole('tab', { name: 'Lịch sử thay đổi' }),
    )
    expect(
      await screen.findByText('Chưa có thay đổi nào được ghi nhận.'),
    ).toBeInTheDocument()
  })
})

describe('Service configuration page', () => {
  it('marks checklists shared with other services', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    expect(await screen.findByText('Dùng ở 3 dịch vụ')).toBeInTheDocument()
  })

  it('opens one dialog with the per-service settings first and the shared content one tab away', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cấu hình' }))
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByRole('tab', {
        name: 'Áp dụng cho dịch vụ này',
        selected: true,
      }),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByLabelText(/Giá công việc kiểm tra/),
    ).toBeInTheDocument()
    fireEvent.click(
      within(dialog).getByRole('tab', { name: 'Nội dung dùng chung' }),
    )
    expect(await within(dialog).findByLabelText(/Mô tả chi tiết/)).toHaveValue(
      'Phạm vi kiểm tra mái',
    )
    expect(checklistsApi.get).toHaveBeenCalledWith('a', expect.anything())
  })

  it('offers a private copy of a shared checklist and moves only this service onto it', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cấu hình' }))
    fireEvent.click(
      await screen.findByRole('tab', { name: 'Nội dung dùng chung' }),
    )
    expect(
      await screen.findByText('Chỉ muốn đổi cho dịch vụ này?'),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Tạo bản sao riêng cho dịch vụ này' }),
    )
    // A confirmation step guards the action.
    expect(checklistsApi.fork).not.toHaveBeenCalled()
    fireEvent.click(
      within(
        screen.getByText(/Tạo bản sao riêng và chuyển/).parentElement!,
      ).getByRole('button', {
        name: 'Tạo bản sao riêng cho dịch vụ này',
      }),
    )
    await waitFor(() =>
      expect(checklistsApi.fork).toHaveBeenCalledWith('s', 'a'),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('does not offer a copy when only this service uses the checklist', async () => {
    vi.spyOn(checklistsApi, 'get').mockResolvedValue({
      ...shared,
      usedByServiceCount: 1,
    })
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cấu hình' }))
    fireEvent.click(
      await screen.findByRole('tab', { name: 'Nội dung dùng chung' }),
    )
    await screen.findByLabelText(/Mô tả chi tiết/)
    expect(screen.queryByText('Chỉ muốn đổi cho dịch vụ này?')).toBeNull()
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('shows this checklist history, including what other services did with it', async () => {
    vi.spyOn(checklistsApi, 'audits').mockResolvedValue({
      items: [
        audit({
          action: 'SERVICE_CHECKLIST_UPDATED',
          serviceId: 's2',
          serviceName: 'Dịch vụ khác',
          changes: [{ field: 'required', from: 'false', to: 'true' }],
        }),
      ],
      page: 0,
      totalItems: 1,
      totalPages: 1,
      first: true,
      last: true,
    })
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cấu hình' }))
    fireEvent.click(
      await screen.findByRole('tab', { name: 'Lịch sử thay đổi' }),
    )
    expect(
      await screen.findByText('Sửa cấu hình theo dịch vụ'),
    ).toBeInTheDocument()
    expect(screen.getByText('Dịch vụ: Dịch vụ khác')).toBeInTheDocument()
  })
})
