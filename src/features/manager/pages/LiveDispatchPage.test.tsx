import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { missionApi } from '../../mission/api/missionApi'
import type { Mission } from '../../mission/types/mission'
import { droneApi } from '../../staff/api/droneApi'
import { operatorApi } from '../../staff/api/operatorApi'
import { LiveDispatchPage } from './LiveDispatchPage'

afterEach(() => vi.restoreAllMocks())

describe('LiveDispatchPage', () => {
  it('assigns real drone and operator IDs to the selected mission', async () => {
    const mission = { id: 'mission-1', missionCode: 'MS-1', status: 'RESOURCE_ASSIGNING', orderTitle: 'Chụp ảnh' } as Mission
    vi.spyOn(missionApi, 'getMissionById').mockResolvedValue(mission)
    vi.spyOn(droneApi, 'getAvailable').mockResolvedValue([{ id: 'drone-db-id', label: 'Drone 48' }])
    vi.spyOn(operatorApi, 'getAvailable').mockResolvedValue([{ id: 'operator-db-id', fullName: 'Pilot A', email: 'pilot@example.com' }])
    const assign = vi.spyOn(missionApi, 'assignResources').mockResolvedValue({ ...mission, status: 'WAITING_OPERATOR_ACCEPTANCE' })

    render(<LiveDispatchPage missionId="mission-1" />)
    await waitFor(() => screen.getByRole('button', { name: 'Phân công' }))
    fireEvent.change(screen.getByLabelText('Chọn drone'), { target: { value: 'drone-db-id' } })
    fireEvent.change(screen.getByLabelText('Chọn operator'), { target: { value: 'operator-db-id' } })
    fireEvent.click(screen.getByRole('button', { name: 'Phân công' }))
    await waitFor(() => expect(assign).toHaveBeenCalledWith('mission-1', 'drone-db-id', 'operator-db-id'))
  })
})
