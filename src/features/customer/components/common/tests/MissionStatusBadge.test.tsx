import { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { MissionStatusBadge } from '../MissionStatusBadge'

afterEach(() => act(() => setLanguage('vi')))

describe('MissionStatusBadge', () => {
  it('shows the localized label with a tone', () => {
    render(<MissionStatusBadge status="FAILED" />)
    expect(screen.getByText('Thất bại').closest('.ui-badge')).toHaveClass('is-danger')
    act(() => setLanguage('en'))
    expect(screen.getByText('Failed')).toBeInTheDocument()
  })
})
