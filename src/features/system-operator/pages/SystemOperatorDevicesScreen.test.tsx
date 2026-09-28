import { act } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setLanguage } from '../../../shared/i18n'
import { SystemOperatorDevicesScreen } from './SystemOperatorDevicesScreen'

describe('SystemOperatorDevicesScreen', () => {
  it('renders Vietnamese labels', () => {
    render(<SystemOperatorDevicesScreen />)
    expect(
      screen.getByText('Quản lý Trạng thái Fleet & Thiết bị Drone'),
    ).toBeInTheDocument()
    expect(screen.getByText('AVAILABLE — Sẵn sàng bay')).toBeInTheDocument()
    expect(screen.getByText('Vừa xong', { exact: false })).toBeInTheDocument()
  })

  it('renders English labels when language is switched', () => {
    render(<SystemOperatorDevicesScreen />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Fleet & Drone Device Status')).toBeInTheDocument()
    expect(screen.getByText('AVAILABLE — Ready to fly')).toBeInTheDocument()
    expect(screen.getByText('Just now', { exact: false })).toBeInTheDocument()
  })
})
