import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { StationsTab } from '../components/StationsTab'
import { useMockTransport } from './helpers'

useMockTransport()

describe('StationsTab', () => {
  it('lists mock stations with the sample-data badge', async () => {
    render(<StationsTab />)
    expect(await screen.findByText('Dữ liệu mẫu')).toBeTruthy()
    expect((await screen.findAllByLabelText(/^Sửa /)).length).toBeGreaterThan(0)
  })

  it('opens the station modal for creation', async () => {
    render(<StationsTab />)
    await screen.findAllByLabelText(/^Sửa /)
    fireEvent.click(screen.getByText('+ Thêm trạm'))
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Tạo trạm mới')).toBeTruthy()
  })
})
