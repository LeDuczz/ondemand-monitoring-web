import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
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
  type ChecklistDefinition,
  type ServiceChecklist,
} from '../../api/checklistsApi'
import { catalogApi } from '../../api/catalogApi'
import { ApiError } from '../../../../shared/api/httpClient'
import { parseAdminRoute, adminHref } from '../../routes'

const definition: ChecklistDefinition = {
  id: 'a',
  content: 'Kiểm tra hàng rào',
  isActive: true,
  version: 0,
  createdAt: '2026-10-05T00:00:00Z',
  updatedAt: null,
}
const other: ChecklistDefinition = {
  ...definition,
  id: 'b',
  content: 'Kiểm tra hiện trường',
}
const rows: ServiceChecklist[] = [definition, other].map((row, i) => ({
  id: `link${i}`,
  serviceId: 's',
  serviceName: 'Dịch vụ test',
  serviceActive: true,
  checklistId: row.id,
  content: row.content,
  checklistActive: true,
  displayOrder: i,
  version: i + 2,
  checklistVersion: 0,
}))
const page = (items = [definition]) => ({
  items,
  page: 0,
  totalItems: items.length,
  totalPages: 1,
  first: true,
  last: true,
})

beforeEach(() => {
  vi.spyOn(checklistsApi, 'list').mockResolvedValue(page())
  vi.spyOn(checklistsApi, 'create').mockResolvedValue(definition)
  vi.spyOn(checklistsApi, 'update').mockResolvedValue(definition)
  vi.spyOn(checklistsApi, 'status').mockResolvedValue(definition)
  vi.spyOn(checklistsApi, 'services').mockResolvedValue(rows.slice(0, 1))
  vi.spyOn(checklistsApi, 'template').mockResolvedValue(rows)
  vi.spyOn(checklistsApi, 'assign').mockResolvedValue(rows[0])
  vi.spyOn(checklistsApi, 'remove').mockResolvedValue(undefined)
  vi.spyOn(checklistsApi, 'reorder').mockResolvedValue([...rows].reverse())
  vi.spyOn(catalogApi, 'listServices').mockResolvedValue([
    { id: 's', name: 'Dịch vụ test', basePrice: 3_200_000, isActive: true },
  ])
})
afterEach(() => {
  vi.restoreAllMocks()
  window.location.hash = ''
})

describe('Admin checklist catalog', () => {
  it('renders catalog and service usage on demand', async () => {
    render(<ChecklistCatalogPage />)
    await screen.findByText(definition.content)
    expect(checklistsApi.services).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Dịch vụ sử dụng' }))
    expect(
      await screen.findByRole('link', { name: 'Dịch vụ test' }),
    ).toHaveAttribute('href', '#portal/admin/services/s/checklists')
  })
  it('searches and filters with page reset', async () => {
    render(<ChecklistCatalogPage />)
    await screen.findByText(definition.content)
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'hàng rào' },
    })
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'false' },
    })
    await waitFor(() =>
      expect(checklistsApi.list).toHaveBeenLastCalledWith(
        'hàng rào',
        false,
        0,
        expect.any(AbortSignal),
      ),
    )
  })
  it('creates trimmed content without sending normalizedContent', async () => {
    render(<ChecklistCatalogPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Thêm checklist' }))
    fireEvent.change(screen.getByRole('textbox', { name: /Nội dung/ }), {
      target: { value: '  New checklist  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await waitFor(() =>
      expect(checklistsApi.create).toHaveBeenCalledWith('New checklist'),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
  it('shows duplicate error and retains form', async () => {
    vi.mocked(checklistsApi.create).mockRejectedValue(
      new ApiError('Duplicate', {
        method: 'POST',
        path: '/api/admin/checklists',
        status: 409,
        code: 'CHECKLIST_ALREADY_EXISTS',
      }),
    )
    render(<ChecklistCatalogPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Thêm checklist' }))
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: definition.content },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'nội dung tương đương',
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  it('rejects whitespace content locally', async () => {
    render(<ChecklistCatalogPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Thêm checklist' }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('1 đến 500')
    expect(checklistsApi.create).not.toHaveBeenCalled()
  })
  it('edits content and reloads catalog', async () => {
    render(<ChecklistCatalogPage />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sửa checklist' }),
    )
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Edited' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await waitFor(() =>
      expect(checklistsApi.update).toHaveBeenCalledWith('a', 'Edited'),
    )
    await waitFor(() => expect(checklistsApi.list).toHaveBeenCalledTimes(2))
  })
  it.each([true, false])(
    'toggles active=%s without hard delete',
    async (active) => {
      vi.mocked(checklistsApi.list).mockResolvedValue(
        page([{ ...definition, isActive: active }]),
      )
      render(<ChecklistCatalogPage />)
      fireEvent.click(
        await screen.findByRole('button', {
          name: active ? 'Ngừng hoạt động' : 'Kích hoạt lại',
        }),
      )
      await waitFor(() =>
        expect(checklistsApi.status).toHaveBeenCalledWith('a', !active),
      )
    },
  )
  it('binds pagination to backend page metadata', async () => {
    vi.mocked(checklistsApi.list).mockResolvedValue({
      ...page(),
      last: false,
      totalPages: 2,
    })
    render(<ChecklistCatalogPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Trang sau' }))
    await waitFor(() =>
      expect(checklistsApi.list).toHaveBeenLastCalledWith(
        '',
        undefined,
        1,
        expect.any(AbortSignal),
      ),
    )
  })
  it('does not show stale list after authorization error', async () => {
    vi.mocked(checklistsApi.list).mockRejectedValue(
      new ApiError('Forbidden', {
        status: 403,
        method: 'GET',
        path: '/api/admin/checklists',
      }),
    )
    render(<ChecklistCatalogPage />)
    await screen.findByText(/Forbidden/)
    expect(screen.queryByText(definition.content)).toBeNull()
  })
})

describe('Admin service template', () => {
  it('renders ordered template and excludes assigned/inactive picker items', async () => {
    vi.mocked(checklistsApi.template).mockResolvedValue([rows[0]])
    vi.mocked(checklistsApi.list).mockResolvedValue(
      page([
        definition,
        other,
        { ...definition, id: 'inactive', content: 'Inactive', isActive: false },
      ]),
    )
    render(<ServiceChecklistPage serviceId="s" />)
    await screen.findByText(definition.content)
    fireEvent.click(screen.getByRole('button', { name: 'Thêm checklist' }))
    const picker = await screen.findByRole('dialog')
    expect(await within(picker).findByText(other.content)).toBeInTheDocument()
    expect(within(picker).queryByText(definition.content)).toBeNull()
    expect(within(picker).queryByText('Inactive')).toBeNull()
    fireEvent.click(within(picker).getByRole('radio', { name: other.content }))
    fireEvent.click(
      within(picker).getByRole('button', { name: 'Thêm checklist' }),
    )
    await waitFor(() =>
      expect(checklistsApi.assign).toHaveBeenCalledWith('s', 'b', 1),
    )
  })
  it('confirms association removal and refreshes', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(
      await screen.findByRole('button', {
        name: `Gỡ checklist: ${definition.content}`,
      }),
    )
    expect(checklistsApi.remove).not.toHaveBeenCalled()
    const modal = screen.getByRole('dialog')
    expect(within(modal).getByText(/đơn hàng mới/)).toBeInTheDocument()
    fireEvent.click(within(modal).getByRole('button', { name: 'Gỡ checklist' }))
    await waitFor(() =>
      expect(checklistsApi.remove).toHaveBeenCalledWith('s', 'a'),
    )
    await waitFor(() => expect(checklistsApi.template).toHaveBeenCalledTimes(2))
  })
  it('reorders atomically using versions and preserves server order after reload', async () => {
    const reversed = [...rows]
      .reverse()
      .map((row, i) => ({ ...row, displayOrder: i, version: row.version + 1 }))
    vi.mocked(checklistsApi.template)
      .mockResolvedValueOnce(rows)
      .mockResolvedValue(reversed)
    const view = render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(
      await screen.findByRole('button', {
        name: `Di chuyển xuống: ${definition.content}`,
      }),
    )
    await waitFor(() =>
      expect(checklistsApi.reorder).toHaveBeenCalledWith(
        's',
        [...rows].reverse(),
      ),
    )
    await waitFor(() =>
      expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(
        other.content,
      ),
    )
    view.unmount()
    render(<ServiceChecklistPage serviceId="s" />)
    await waitFor(() =>
      expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(
        other.content,
      ),
    )
  })
  it('refreshes stale version errors without silently retrying', async () => {
    vi.mocked(checklistsApi.reorder).mockRejectedValue(
      new ApiError('Stale', {
        method: 'PUT',
        path: '/order',
        status: 409,
        code: 'CONCURRENT_UPDATE',
      }),
    )
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(
      await screen.findByRole('button', {
        name: `Di chuyển xuống: ${definition.content}`,
      }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Dữ liệu đã được thay đổi bởi phiên khác',
    )
    expect(checklistsApi.reorder).toHaveBeenCalledOnce()
  })
  it('searches active picker candidates', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Thêm checklist' }),
    )
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'khu vực' },
    })
    await waitFor(() =>
      expect(checklistsApi.list).toHaveBeenLastCalledWith(
        'khu vực',
        true,
        0,
        expect.any(AbortSignal),
      ),
    )
  })
  it('disables assignment to an inactive service', async () => {
    vi.mocked(catalogApi.listServices).mockResolvedValue([
      { id: 's', name: 'Dịch vụ test', basePrice: 3_200_000, isActive: false },
    ])
    render(<ServiceChecklistPage serviceId="s" />)
    expect(
      await screen.findByRole('button', { name: 'Thêm checklist' }),
    ).toBeDisabled()
  })
  it('surfaces service-not-found without template mutations', async () => {
    vi.mocked(checklistsApi.template).mockRejectedValue(
      new ApiError('Service not found', {
        method: 'GET',
        path: '/template',
        status: 404,
      }),
    )
    render(<ServiceChecklistPage serviceId="missing" />)
    await screen.findByText(/Service not found/)
    expect(screen.queryByRole('button', { name: 'Thêm checklist' })).toBeNull()
  })
  it('routes the selector to the chosen service', async () => {
    vi.mocked(catalogApi.listServices).mockResolvedValue([
      { id: 's', name: 'First', basePrice: 3_200_000, isActive: true },
      { id: 'second', name: 'Second', basePrice: 4_000_000, isActive: true },
    ])
    render(<ServiceChecklistPage serviceId="s" />)
    await screen.findByText(definition.content)
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'second' },
    })
    expect(window.location.hash).toBe(
      '#portal/admin/services/second/checklists',
    )
  })
})

describe('Admin checklist routes', () => {
  it('roundtrips catalog and encoded service IDs', () => {
    expect(parseAdminRoute(adminHref({ screen: 'checklists' }))).toEqual({
      screen: 'checklists',
    })
    expect(
      parseAdminRoute(
        adminHref({ screen: 'serviceChecklists', serviceId: 's/one' }),
      ),
    ).toEqual({ screen: 'serviceChecklists', serviceId: 's/one' })
    expect(parseAdminRoute('#portal/admin/services')).toEqual({
      screen: 'serviceChecklists',
    })
    expect(parseAdminRoute('#portal/admin/checklists/unknown')).toEqual({
      screen: 'notFound',
    })
  })
})

describe('Admin checklist visual structure and interaction', () => {
  it('groups service summary and template section with styled header navigation', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    expect(
      screen.getByRole('heading', { name: 'Checklist dịch vụ' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Mở danh mục checklist' }),
    ).toHaveClass('odm-btn')
    expect(
      await screen.findByRole('combobox', { name: 'Dịch vụ' }),
    ).toHaveValue('s')
    expect(await screen.findByText('2 checklist')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Checklist mặc định' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thêm checklist' })).toHaveClass(
      'odm-btn-p',
    )
  })
  it('exposes accessible tooltips and disables reorder boundaries', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    const firstUp = await screen.findByRole('button', {
      name: 'Di chuyển lên: ' + definition.content,
    })
    expect(firstUp).toBeDisabled()
    expect(firstUp).toHaveAttribute(
      'title',
      'Di chuyển lên: ' + definition.content,
    )
    expect(
      screen.getByRole('button', { name: 'Di chuyển xuống: ' + other.content }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', {
        name: 'Di chuyển xuống: ' + definition.content,
      }),
    ).toBeEnabled()
  })
  it('shows an empty-state CTA instead of a blank list', async () => {
    vi.mocked(checklistsApi.template).mockResolvedValue([])
    render(<ServiceChecklistPage serviceId="s" />)
    await screen.findByText('Chưa có checklist mặc định')
    expect(
      screen.getByText(
        'Dịch vụ này chưa có checklist áp dụng cho đơn hàng mới.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Thêm checklist' }),
    ).toHaveLength(1)
    expect(screen.queryByRole('list')).toBeNull()
  })
  it('shows a user-facing load error and recovers through retry', async () => {
    vi.mocked(checklistsApi.template)
      .mockRejectedValueOnce(
        new ApiError('Unavailable', {
          method: 'GET',
          path: '/api/admin/services/s/checklists',
          status: 500,
        }),
      )
      .mockResolvedValue(rows)
    render(<ServiceChecklistPage serviceId="s" />)
    await screen.findByText('Không thể tải checklist dịch vụ.')
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await screen.findByText(definition.content)
    expect(checklistsApi.template).toHaveBeenCalledTimes(2)
  })
  it('shows inactive linked items with a badge without permitting new inactive assignment', async () => {
    vi.mocked(checklistsApi.template).mockResolvedValue([
      { ...rows[0], checklistActive: false },
    ])
    render(<ServiceChecklistPage serviceId="s" />)
    const content = await screen.findByText(definition.content)
    expect(
      within(content.parentElement!).getByText('Ngừng hoạt động'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Gỡ checklist: ' + definition.content,
      }),
    ).toBeEnabled()
  })
  it('keeps picker confirmation disabled until an available item is selected', async () => {
    vi.mocked(checklistsApi.template).mockResolvedValue([rows[0]])
    vi.mocked(checklistsApi.list).mockResolvedValue(page([other]))
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Thêm checklist' }),
    )
    const modal = screen.getByRole('dialog')
    const confirm = within(modal).getByRole('button', {
      name: 'Thêm checklist',
    })
    expect(confirm).toBeDisabled()
    fireEvent.click(
      await within(modal).findByRole('radio', { name: other.content }),
    )
    expect(checklistsApi.assign).not.toHaveBeenCalled()
    expect(confirm).toBeEnabled()
    fireEvent.click(within(modal).getByRole('button', { name: 'Hủy' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('shows no available candidates without an enabled submit action', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Thêm checklist' }),
    )
    const modal = screen.getByRole('dialog')
    await within(modal).findByText(
      'Không còn checklist khả dụng để thêm trên trang này.',
    )
    expect(
      within(modal).getByRole('button', { name: 'Thêm checklist' }),
    ).toBeDisabled()
  })
  it('uses consistent catalog controls and form accessibility', async () => {
    render(<ChecklistCatalogPage />)
    await screen.findByText(definition.content)
    expect(
      screen.getByRole('navigation', { name: 'Phân trang checklist' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trang trước' })).toHaveClass(
      'odm-btn',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Thêm checklist' }))
    const textarea = screen.getByRole('textbox', { name: /Nội dung/ })
    expect(textarea).toHaveAttribute(
      'aria-describedby',
      'checklist-content-hint',
    )
    expect(screen.getByRole('button', { name: 'Lưu' })).toHaveClass('odm-btn-p')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
