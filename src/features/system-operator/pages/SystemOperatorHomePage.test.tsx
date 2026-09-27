import { act } from 'react'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { setLanguage } from '../../../shared/i18n'
import { SystemOperatorHomePage } from './SystemOperatorHomePage'

afterEach(() => {
  window.location.hash = ''
})

describe('SystemOperatorHomePage', () => {
  it('renders the Vietnamese devices screen title for the devices route', () => {
    window.location.hash = '#portal/system-operator/devices'
    render(<SystemOperatorHomePage />)
    expect(screen.getByText('Quản lý Trạng thái Thiết bị')).toBeInTheDocument()
  })

  it('renders the English devices screen title when language is switched', () => {
    window.location.hash = '#portal/system-operator/devices'
    render(<SystemOperatorHomePage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Device Status Management')).toBeInTheDocument()
  })
})
