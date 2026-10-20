import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { CreateUserModal } from '../components/CreateUserModal'
import { useMockTransport } from './helpers'

useMockTransport()

describe('CreateUserModal', () => {
  it('renders in vietnamese and english', () => {
    render(<CreateUserModal onClose={() => {}} onCreated={() => {}} />)
    expect(screen.getByText('Tạo tài khoản')).toBeTruthy()
    act(() => setLanguage('en'))
    expect(screen.getByText('Create account')).toBeTruthy()
    act(() => setLanguage('vi'))
  })

  it('validates required fields inline', () => {
    const onCreated = vi.fn()
    render(<CreateUserModal onClose={() => {}} onCreated={onCreated} />)
    fireEvent.click(screen.getByText('Tạo & gửi lời mời'))
    expect(screen.getAllByText('Bắt buộc').length).toBe(2)
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('submits and reports the created account', async () => {
    const onCreated = vi.fn()
    render(<CreateUserModal onClose={() => {}} onCreated={onCreated} />)
    fireEvent.change(screen.getByLabelText(/Họ và tên/), {
      target: { value: 'Nguyễn Test' },
    })
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: 'new.user@odms.vn' },
    })
    fireEvent.click(screen.getByText('Tạo & gửi lời mời'))
    await waitFor(() => expect(onCreated).toHaveBeenCalled())
    expect(onCreated.mock.calls[0][0].email).toBe('new.user@odms.vn')
  })

  it('shows the backend error for a duplicate email', async () => {
    render(<CreateUserModal onClose={() => {}} onCreated={() => {}} />)
    fireEvent.change(screen.getByLabelText(/Họ và tên/), {
      target: { value: 'Dup' },
    })
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: 'long.truong@odms.vn' },
    })
    fireEvent.click(screen.getByText('Tạo & gửi lời mời'))
    await screen.findByRole('alert')
  })
})
