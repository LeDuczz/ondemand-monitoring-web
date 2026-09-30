import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { ServicesTab } from '../components/ServicesTab'
import { useMockTransport } from './helpers'

useMockTransport()

describe('ServicesTab', () => {
  it('lists services from the BE-shaped mock', async () => {
    render(<ServicesTab />)
    expect(await screen.findByText('Kiểm tra Tháp viễn thông')).toBeTruthy()
    expect(screen.getByText('Giám sát Nông nghiệp / Cây trồng')).toBeTruthy()
  })

  it('shows an error state when the request fails', async () => {
    const { setHttpTransport } = await import('../../../../../shared/api/httpClient')
    setHttpTransport(async () => new Response('{}', { status: 500 }))
    render(<ServicesTab />)
    await screen.findByText('Thử lại')
  })

  it('creates a service through the modal', async () => {
    render(<ServicesTab />)
    await screen.findByText('Kiểm tra Tháp viễn thông')
    fireEvent.click(screen.getByText('+ Thêm dịch vụ'))
    fireEvent.change(screen.getByLabelText(/Tên dịch vụ/), {
      target: { value: 'Dịch vụ thử' },
    })
    fireEvent.click(screen.getByText('Lưu'))
    expect(await screen.findByText('Dịch vụ thử')).toBeTruthy()
  })

  it('validates the required name and shows BE errors inline', async () => {
    render(<ServicesTab />)
    await screen.findByText('Kiểm tra Tháp viễn thông')
    fireEvent.click(screen.getByText('+ Thêm dịch vụ'))
    fireEvent.click(screen.getByText('Lưu'))
    expect(screen.getByText('Bắt buộc')).toBeTruthy()
  })

  it('prefills the edit modal from the BE and saves', async () => {
    render(<ServicesTab />)
    await screen.findByText('Kiểm tra Tháp viễn thông')
    fireEvent.click(screen.getByLabelText('Sửa Kiểm tra Tháp viễn thông'))
    const name = (await screen.findByLabelText(/Tên dịch vụ/)) as HTMLInputElement
    expect(name.value).toBe('Kiểm tra Tháp viễn thông')
    expect(
      (screen.getByLabelText(/Mô tả/) as HTMLTextAreaElement).value,
    ).toContain('anten')
    fireEvent.change(name, { target: { value: 'Tên mới' } })
    fireEvent.click(screen.getByText('Lưu'))
    expect(await screen.findByText('Tên mới')).toBeTruthy()
  })

  it('deletes after a danger confirmation', async () => {
    render(<ServicesTab />)
    await screen.findByText('Giám sát Tiến độ Xây dựng')
    fireEvent.click(screen.getByLabelText('Xoá Giám sát Tiến độ Xây dựng'))
    expect(screen.getByText(/Bạn có chắc muốn xoá/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Xoá' }))
    await waitFor(() =>
      expect(screen.queryByText('Giám sát Tiến độ Xây dựng')).toBeNull(),
    )
  })
})
