import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../shared/i18n'
import { ModeSwitch } from './ModeSwitch'

describe('ModeSwitch', () => {
  it('shows the register prompt while in login mode and switches on click', () => {
    const onChange = vi.fn()
    render(<ModeSwitch mode="login" onChange={onChange} />)

    expect(screen.getByText('Chưa có tài khoản?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }))
    expect(onChange).toHaveBeenCalledWith('register')
  })

  it('shows the login prompt while in register mode and switches on click', () => {
    const onChange = vi.fn()
    render(<ModeSwitch mode="register" onChange={onChange} />)

    expect(screen.getByText('Đã có tài khoản?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(onChange).toHaveBeenCalledWith('login')
  })

  it('renders nothing for the non-login/register modes', () => {
    const { container } = render(
      <ModeSwitch mode="verify" onChange={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders English text when language is switched', () => {
    const onChange = vi.fn()
    render(<ModeSwitch mode="login" onChange={onChange} />)
    act(() => setLanguage('en'))

    expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }))
    expect(onChange).toHaveBeenCalledWith('register')
  })
})
