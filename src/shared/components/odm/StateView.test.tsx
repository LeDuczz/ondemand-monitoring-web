import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../api/httpClient'
import { StateView } from './StateView'

describe('StateView', () => {
  it('renders the loading state with aria-busy', () => {
    render(<StateView state="loading" label="Đang tải danh sách" />)
    const busy = document.querySelector('[aria-busy="true"]')
    expect(busy).not.toBeNull()
    expect(screen.getByText('Đang tải danh sách')).toBeInTheDocument()
  })

  it('renders the empty state with title, description and action', () => {
    render(
      <StateView
        state="empty"
        title="Không còn đơn chờ duyệt"
        description="Khi khách gửi đơn mới, đơn sẽ xuất hiện ở đây."
        action={<button type="button">Làm mới</button>}
      />,
    )

    expect(screen.getByText('Không còn đơn chờ duyệt')).toBeInTheDocument()
    expect(
      screen.getByText('Khi khách gửi đơn mới, đơn sẽ xuất hiện ở đây.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Làm mới' })).toBeInTheDocument()
  })

  it('renders the error state with the METHOD /path · status debug line and retry button', () => {
    const onRetry = vi.fn()
    const error = new ApiError('Boom', {
      status: 500,
      method: 'GET',
      path: '/manager/dashboard',
    })

    render(<StateView state="error" error={error} onRetry={onRetry} />)

    expect(screen.getByText('GET /manager/dashboard · 500')).toBeInTheDocument()
    const retryButton = screen.getByRole('button', { name: 'Thử lại' })
    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('falls back to a generic message for a non-ApiError error', () => {
    render(<StateView state="error" error={new Error('boom')} />)
    expect(screen.getByText('boom')).toBeInTheDocument()
  })
})
