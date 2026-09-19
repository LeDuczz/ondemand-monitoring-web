import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { Router } from './router'

// jsdom does not fire `hashchange` automatically when `location.hash` is set
// programmatically (unlike a real browser), so tests that simulate the user
// navigating (back/forward, a pasted link) set the hash and dispatch the
// event by hand.
function navigateHash(hash: string) {
  window.location.hash = hash
  fireEvent(window, new HashChangeEvent('hashchange'))
}

beforeEach(() => {
  window.location.hash = ''
})

afterEach(() => {
  window.location.hash = ''
})

describe('Router - auth hash sync (regression)', () => {
  it('shows the login form for #auth/login and the register form for #auth/register', () => {
    window.location.hash = '#auth/login'
    render(<Router />)
    expect(
      screen.getByRole('heading', { name: 'Đăng nhập' }),
    ).toBeInTheDocument()

    navigateHash('#auth/register')
    expect(
      screen.getByRole('heading', { name: 'Tạo tài khoản khách hàng' }),
    ).toBeInTheDocument()

    navigateHash('#auth/login')
    expect(
      screen.getByRole('heading', { name: 'Đăng nhập' }),
    ).toBeInTheDocument()
  })

  it('keeps switching correctly across repeated register <-> login navigation', () => {
    window.location.hash = '#auth/register'
    render(<Router />)
    expect(
      screen.getByRole('heading', { name: 'Tạo tài khoản khách hàng' }),
    ).toBeInTheDocument()

    navigateHash('#auth/login')
    expect(
      screen.getByRole('heading', { name: 'Đăng nhập' }),
    ).toBeInTheDocument()

    navigateHash('#auth/register')
    expect(
      screen.getByRole('heading', { name: 'Tạo tài khoản khách hàng' }),
    ).toBeInTheDocument()
  })

  it('updates the hash when using the in-page mode switch buttons', () => {
    window.location.hash = '#auth/login'
    render(<Router />)

    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }))
    expect(window.location.hash).toBe('#auth/register')
    expect(
      screen.getByRole('heading', { name: 'Tạo tài khoản khách hàng' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(window.location.hash).toBe('#auth/login')
    expect(
      screen.getByRole('heading', { name: 'Đăng nhập' }),
    ).toBeInTheDocument()
  })
})
