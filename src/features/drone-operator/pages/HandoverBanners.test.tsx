import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../shared/i18n'
import { ConfirmedBanner, RevokedBanner } from './HandoverBanners'

describe('RevokedBanner', () => {
  it('renders vietnamese text', () => {
    render(<RevokedBanner onReconfirm={vi.fn()} />)
    expect(screen.getByText('Xác nhận lại')).toBeTruthy()
    expect(screen.getByText('Đã thu hồi')).toBeTruthy()
  })

  it('renders english text when language is switched', () => {
    render(<RevokedBanner onReconfirm={vi.fn()} />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Re-confirm')).toBeTruthy()
    expect(screen.getByText('Revoked')).toBeTruthy()
  })
})

describe('ConfirmedBanner', () => {
  it('renders vietnamese text', () => {
    render(<ConfirmedBanner missionId="MSN-1" onRevoke={vi.fn()} />)
    expect(screen.getByText('Tiếp tục tới buồng lái')).toBeTruthy()
  })

  it('renders english text when language is switched', () => {
    render(<ConfirmedBanner missionId="MSN-1" onRevoke={vi.fn()} />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Continue to cockpit')).toBeTruthy()
  })
})
