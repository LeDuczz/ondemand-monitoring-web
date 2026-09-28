import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../shared/i18n'
import { HandoverScreen } from './HandoverScreen'

describe('HandoverScreen', () => {
  it('renders vietnamese chrome text', () => {
    render(<HandoverScreen />)
    expect(screen.getByText('Bàn giao quyền điều khiển')).toBeTruthy()
    expect(
      screen.getByText('Cam kết an toàn trước khi nhận quyền điều khiển'),
    ).toBeTruthy()
  })

  it('renders english chrome text when language is switched', () => {
    render(<HandoverScreen />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Control handover')).toBeTruthy()
    expect(
      screen.getByText('Safety commitments before taking control'),
    ).toBeTruthy()
  })
})
