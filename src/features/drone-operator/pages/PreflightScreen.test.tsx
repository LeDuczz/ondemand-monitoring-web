import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../shared/i18n'
import { PreflightScreen } from './PreflightScreen'

describe('PreflightScreen', () => {
  it('renders vietnamese chrome text', () => {
    render(<PreflightScreen />)
    expect(screen.getByText('Kiểm tra trước chuyến bay')).toBeTruthy()
    expect(screen.getByText('1. Thiết bị bay')).toBeTruthy()
    expect(screen.getByText('Bắt đầu kiểm tra')).toBeTruthy()
  })

  it('keeps the pre-flight screen fully Vietnamese when language is switched', () => {
    render(<PreflightScreen />)
    act(() => setLanguage('en'))
    expect(screen.getByText('1. Thiết bị bay')).toBeTruthy()
    expect(screen.getByText('Kiểm tra trước chuyến bay')).toBeTruthy()
  })

  it('shows two result buttons for every check', () => {
    render(<PreflightScreen />)

    const passButtons = screen.getAllByRole('button', { name: '✓ Đạt' })
    const failButtons = screen.getAllByRole('button', {
      name: '✕ Không đạt',
    })
    expect(passButtons).toHaveLength(32)
    expect(failButtons).toHaveLength(32)
    expect(passButtons[0]).toBeDisabled()
    expect(failButtons[0]).toBeDisabled()
  })

})
