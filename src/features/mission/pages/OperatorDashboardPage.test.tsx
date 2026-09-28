import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { setLanguage } from '../../../shared/i18n'
import { missionApi } from '../api/missionApi'
import { OperatorDashboardPage } from './OperatorDashboardPage'
import type { Mission } from '../types/mission'

vi.mock('../api/missionApi', () => ({
  missionApi: {
    getMissionById: vi.fn(),
  },
}))

const baseMission: Mission = {
  id: 'M-001',
  missionCode: 'M-001',
  status: 'WAITING_OPERATOR_ACCEPTANCE',
  address: '123 Test St',
  operatorId: 'OP-001',
  deviceCode: 'DRONE-01',
} as Mission

afterEach(() => {
  vi.restoreAllMocks()
})

describe('OperatorDashboardPage', () => {
  it('renders vietnamese text after loading the mission', async () => {
    vi.mocked(missionApi.getMissionById).mockResolvedValue(baseMission)
    render(<OperatorDashboardPage />)
    await waitFor(() =>
      expect(
        screen.getByText('Xác nhận Tiếp nhận Nhiệm vụ Giám sát'),
      ).toBeTruthy(),
    )
  })

  it('renders english text when language is switched', async () => {
    vi.mocked(missionApi.getMissionById).mockResolvedValue(baseMission)
    render(<OperatorDashboardPage />)
    await waitFor(() =>
      expect(
        screen.getByText('Xác nhận Tiếp nhận Nhiệm vụ Giám sát'),
      ).toBeTruthy(),
    )
    act(() => setLanguage('en'))
    expect(
      screen.getByText('Confirm Acceptance of Monitoring Mission'),
    ).toBeTruthy()
  })
})
