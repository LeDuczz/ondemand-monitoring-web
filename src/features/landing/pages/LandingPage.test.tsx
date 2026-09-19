import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { LandingPage } from './LandingPage'

function saveSession(role: 'CUSTOMER' | 'STAFF') {
  localStorage.setItem('fieldwise.accessToken', 'token.value-123')
  localStorage.setItem(
    'fieldwise.user',
    JSON.stringify({
      id: '1',
      fullName: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      role,
      isActive: true,
    }),
  )
}

describe('LandingPage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    document.documentElement.dataset.theme = 'light'
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('renders the hero heading and key sections', () => {
    render(<LandingPage />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Giám sát hiện trường bằng drone/,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Từ yêu cầu đến kết quả trong bốn bước',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Dành cho mọi nhu cầu quan sát từ trên cao',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Giải đáp nhanh' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('OnDemand Monitor').length).toBeGreaterThan(0)
  })

  it('sends a guest to registration from the create-request CTA', () => {
    render(<LandingPage />)
    const links = screen.getAllByRole('link', { name: 'Tạo yêu cầu giám sát' })
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).toHaveAttribute('href', '#auth/register')
    }
  })

  it('sends a logged-in CUSTOMER straight to the create-request screen', () => {
    saveSession('CUSTOMER')
    render(<LandingPage />)
    const links = screen.getAllByRole('link', { name: 'Tạo yêu cầu giám sát' })
    for (const link of links) {
      expect(link).toHaveAttribute('href', '#portal/customer/request')
    }
  })

  it('sends a logged-in STAFF user to their own role home', () => {
    saveSession('STAFF')
    render(<LandingPage />)
    const links = screen.getAllByRole('link', { name: 'Tạo yêu cầu giám sát' })
    for (const link of links) {
      expect(link).toHaveAttribute('href', '#portal/staff')
    }
  })

  it('sends "Đăng nhập" to the login screen', () => {
    render(<LandingPage />)
    const links = screen.getAllByRole('link', { name: 'Đăng nhập' })
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).toHaveAttribute('href', '#auth/login')
    }
  })

  it('opens the first FAQ item by default and toggles others on click', () => {
    render(<LandingPage />)
    const firstQuestion = screen.getByRole('button', {
      name: /Tôi cần chuẩn bị gì để tạo một yêu cầu giám sát\?/,
    })
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByText(/Bạn chỉ cần tài khoản khách hàng/),
    ).toBeInTheDocument()

    const secondQuestion = screen.getByRole('button', {
      name: /Bao lâu thì đơn được duyệt\?/,
    })
    expect(secondQuestion).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(secondQuestion)
    expect(secondQuestion).toHaveAttribute('aria-expanded', 'true')
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'false')
  })

  it('flips document.documentElement.dataset.theme when the theme toggle is clicked', () => {
    render(<LandingPage />)
    expect(document.documentElement.dataset.theme).toBe('light')
    const toggle = screen.getByRole('button', {
      name: /Đổi sang giao diện tối/,
    })
    fireEvent.click(toggle)
    expect(document.documentElement.dataset.theme).toBe('dark')
    fireEvent.click(
      screen.getByRole('button', { name: /Đổi sang giao diện sáng/ }),
    )
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('toggles the mobile navigation menu button', () => {
    render(<LandingPage />)
    const menuButton = screen.getByRole('button', { name: 'Mở menu' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(menuButton)
    expect(screen.getByRole('button', { name: 'Đóng menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('renders the footer with the OnDemand Monitor brand', () => {
    render(<LandingPage />)
    const footer = screen
      .getByText('© 2026 OnDemand Monitor. Đồ án FA26SE039.')
      .closest('footer') as HTMLElement
    expect(footer).not.toBeNull()
    expect(within(footer).getByText('support@odms.vn')).toBeInTheDocument()
  })
})
