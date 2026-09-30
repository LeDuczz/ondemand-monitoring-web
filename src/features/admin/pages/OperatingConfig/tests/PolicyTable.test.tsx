import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { PolicyTable } from '../components/PolicyTable'
import { useMockTransport } from './helpers'

useMockTransport()

describe('PolicyTable', () => {
  it('saves an edited value', async () => {
    render(<PolicyTable />)
    const inputs = (await screen.findAllByRole('textbox')) as HTMLInputElement[]
    expect(screen.queryByText('Lưu')).toBeNull()
    fireEvent.change(inputs[0], { target: { value: '999' } })
    fireEvent.click(screen.getByText('Lưu'))
    await waitFor(() => expect(screen.queryByText('Lưu')).toBeNull())
    expect((screen.getAllByRole('textbox')[0] as HTMLInputElement).value).toBe('999')
  })

  it('shows an error state when the request fails', async () => {
    const { setHttpTransport } = await import('../../../../../shared/api/httpClient')
    setHttpTransport(async () => new Response('{}', { status: 500 }))
    render(<PolicyTable />)
    await screen.findByText('Thử lại')
  })
})
