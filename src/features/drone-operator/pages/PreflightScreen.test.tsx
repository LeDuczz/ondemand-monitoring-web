import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../shared/i18n'
import { PreflightScreen } from './PreflightScreen'

describe('PreflightScreen', () => {
  it('renders vietnamese chrome text', () => {
    render(<PreflightScreen />)
    expect(screen.getByText('Preflight checklist')).toBeTruthy()
    expect(screen.getByText('Thiết bị')).toBeTruthy()
    expect(screen.getByText('Bắt đầu kiểm tra')).toBeTruthy()
  })

  it('renders english chrome text when language is switched', () => {
    render(<PreflightScreen />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Device')).toBeTruthy()
  })
})
