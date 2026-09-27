import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import {
  CheckBadge,
  DroneBadge,
  MissionBadge,
  PriorityBadge,
} from './StatusBadge'

describe('omss StatusBadge', () => {
  it('renders Vietnamese labels by default', () => {
    render(
      <>
        <MissionBadge state="IN_FLIGHT" />
        <DroneBadge state="ACTIVE_MISSION" />
        <CheckBadge status="PASS" />
        <PriorityBadge priority="CRITICAL" />
      </>,
    )
    expect(screen.getAllByText('Đang bay').length).toBe(2)
    expect(screen.getByText('Đạt')).toBeInTheDocument()
    expect(screen.getByText('Khẩn cấp')).toBeInTheDocument()
  })

  it('renders English labels after switching language', () => {
    render(
      <>
        <MissionBadge state="IN_FLIGHT" />
        <DroneBadge state="ACTIVE_MISSION" />
        <CheckBadge status="PASS" />
        <PriorityBadge priority="CRITICAL" />
      </>,
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('Passed')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })
})
