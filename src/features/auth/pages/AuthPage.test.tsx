import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resetMockDb } from '../../../mocks/db'
import { setLanguage } from '../../../shared/i18n'
import { stubError, stubFetch } from '../../../test/stubApi'
import { authSession } from '../api/authApi'
import { AuthPage } from './AuthPage'

function fillLoginForm(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: email },
  })
  fireEvent.change(screen.getByLabelText('Mật khẩu'), {
    target: { value: password },
  })
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  window.location.hash = ''
  resetMockDb()
})

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  window.location.hash = ''
  resetMockDb()
  vi.restoreAllMocks()
})

// POST /api/auth/login is served by the real backend (no mock route), so the
// login tests stub `fetch` with the backend's responses.
const managerAuth = {
  accessToken: 'mock-staff-token',
  tokenType: 'Bearer',
  expiresIn: 3600,
  user: {
    id: 'usr-manager',
    fullName: 'Lê Thị Thanh Hằng',
    email: 'hang.le@odms.vn',
    emailVerified: true,
    role: 'MANAGER',
    isActive: true,
    linkedProviders: ['LOCAL'],
  },
}

describe('AuthPage - login', () => {
  it('signs in a known user and redirects to their role home', async () => {
    const stub = stubFetch([
      { method: 'POST', path: '/api/auth/login', respond: managerAuth },
    ])
    render(<AuthPage initialMode="login" />)
    fillLoginForm('hang.le@odms.vn', 'Demo@123')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    })

    await waitFor(() => expect(window.location.hash).toBe('#portal/manager'))
    expect(authSession.getAccessToken()).toBe('mock-staff-token')
    expect(stub.calls[0]).toMatchObject({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'hang.le@odms.vn', password: 'Demo@123' },
    })
  })

  it('shows the "Sai thông tin" alert for INVALID_CREDENTIALS', async () => {
    stubFetch([
      {
        method: 'POST',
        path: '/api/auth/login',
        respond: stubError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng'),
      },
    ])
    render(<AuthPage initialMode="login" />)
    fillLoginForm('hang.le@odms.vn', 'wrong-password')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    })

    expect(
      await screen.findByText('Email hoặc mật khẩu không đúng.'),
    ).toBeInTheDocument()
    expect(window.location.hash).toBe('')
  })

  it('shows the "Tài khoản khoá" alert for ACCOUNT_DISABLED', async () => {
    stubFetch([
      {
        method: 'POST',
        path: '/api/auth/login',
        respond: stubError(403, 'ACCOUNT_DISABLED', 'Tài khoản đã bị vô hiệu hóa'),
      },
    ])
    render(<AuthPage initialMode="login" />)
    fillLoginForm('locked.demo@odms.vn', 'Demo@123')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    })

    expect(await screen.findByText('Tài khoản đã bị khoá.')).toBeInTheDocument()
    expect(
      screen.getByText('Liên hệ quản trị viên qua support@odms.vn để mở lại.'),
    ).toBeInTheDocument()
  })

  it('shows the loading label and disables the button while submitting', async () => {
    stubFetch([
      { method: 'POST', path: '/api/auth/login', respond: managerAuth },
    ])
    render(<AuthPage initialMode="login" />)
    fillLoginForm('hang.le@odms.vn', 'Demo@123')

    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    // Assert synchronously, before the (0ms-latency) mock login promise
    // resolves and flips the button back to its idle label.
    const button = screen.getByRole('button', { name: 'Đang đăng nhập...' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')

    await waitFor(() => expect(window.location.hash).toBe('#portal/manager'))
  })

  it('sends the login request over the network', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: 'Not found' }), {
        status: 404,
      }),
    )

    render(<AuthPage initialMode="login" />)
    fillLoginForm('someone-real@example.com', 'whatever')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    })

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
  })
})

describe('AuthPage - register', () => {
  it('blocks submit and shows an error when passwords do not match', async () => {
    render(<AuthPage initialMode="register" />)

    fireEvent.change(screen.getByLabelText('Họ và tên'), {
      target: { value: 'Nguyễn Văn A' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Mật khẩu'), {
      target: { value: 'Password123' },
    })
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), {
      target: { value: 'Different123' },
    })
    fireEvent.click(
      screen.getByLabelText(
        'Tôi đồng ý với Điều khoản sử dụng và chính sách bay an toàn.',
      ),
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))
    })

    expect(await screen.findByText('Mật khẩu không khớp')).toBeInTheDocument()
  })

  it('requires the terms checkbox before the form can be submitted', () => {
    render(<AuthPage initialMode="register" />)
    const checkbox = screen.getByLabelText(
      'Tôi đồng ý với Điều khoản sử dụng và chính sách bay an toàn.',
    )
    expect(checkbox).toBeRequired()
  })
})

describe('AuthPage - language', () => {
  it('renders English titles and labels when language is switched', () => {
    render(<AuthPage initialMode="login" />)
    act(() => setLanguage('en'))

    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByText('Welcome back.')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
  })
})
