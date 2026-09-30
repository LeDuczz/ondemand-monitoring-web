import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../shared/i18n'
import { PasswordField } from './PasswordField'

describe('PasswordField', () => {
  it('masks the value by default and toggles to visible on click', () => {
    render(<PasswordField id="password" value="secret123" onChange={vi.fn()} />)

    const input = screen.getByLabelText('Mật khẩu')
    expect(input).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }))
    expect(input).toHaveAttribute('type', 'text')
    expect(
      screen.getByRole('button', { name: 'Ẩn mật khẩu' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('calls onChange with the new value', () => {
    const onChange = vi.fn()
    render(<PasswordField id="password" value="" onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Mật khẩu'), {
      target: { value: 'abcdefgh' },
    })
    expect(onChange).toHaveBeenCalledWith('abcdefgh')
  })

  it('shows the error message when error is provided', () => {
    render(
      <PasswordField
        id="password"
        value=""
        onChange={vi.fn()}
        error="Mật khẩu không hợp lệ"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Mật khẩu không hợp lệ')
  })

  it('renders the English default label when language is switched', () => {
    render(<PasswordField id="password" value="" onChange={vi.fn()} />)
    act(() => setLanguage('en'))
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(
      screen.getByRole('button', { name: 'Hide password' }),
    ).toBeInTheDocument()
  })
})
