import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { NoFlyZonesTab } from '../components/NoFlyZonesTab'
import { useMockTransport } from './helpers'

useMockTransport()

describe('NoFlyZonesTab', () => {
  it('lists zones', async () => {
    render(<NoFlyZonesTab />)
    expect((await screen.findAllByLabelText(/^Sửa /)).length).toBeGreaterThan(0)
  })

  it('validates the required name in the modal', async () => {
    render(<NoFlyZonesTab />)
    await screen.findAllByLabelText(/^Sửa /)
    fireEvent.click(screen.getByText('+ Thêm vùng cấm bay'))
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.click(screen.getByText('Lưu'))
    expect(screen.getByText('Bắt buộc')).toBeTruthy()
  })

  it('creates a zone through the modal', async () => {
    render(<NoFlyZonesTab />)
    await screen.findAllByLabelText(/^Sửa /)
    fireEvent.click(screen.getByText('+ Thêm vùng cấm bay'))
    fireEvent.change(screen.getByLabelText(/^Tên/), {
      target: { value: 'Vùng thử nghiệm' },
    })
    fireEvent.click(screen.getByText('Lưu'))
    expect(await screen.findByText('Vùng thử nghiệm')).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('prefills and saves the edit modal', async () => {
    render(<NoFlyZonesTab />)
    const edit = (await screen.findAllByLabelText(/^Sửa /))[0]
    fireEvent.click(edit)
    const name = screen.getByLabelText(/^Tên/) as HTMLInputElement
    expect(name.value.length).toBeGreaterThan(0)
    fireEvent.change(name, { target: { value: 'Tên mới' } })
    fireEvent.click(screen.getByText('Lưu'))
    await waitFor(() => expect(screen.getByText('Tên mới')).toBeTruthy())
  })
})
