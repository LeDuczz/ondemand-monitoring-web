import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { missionApi } from '../../mission/api/missionApi'
import type { MissionPermissions } from '../../mission/types/permissions'
import { MissionActionGuard } from './MissionActionGuard'

const permissions: MissionPermissions = {
  canRespond: false,
  canControlFlight: false,
  canOperatePayload: false,
  canInspectDevice: true,
  canMaintainDevice: false,
  canUploadMedia: false,
}
afterEach(() => vi.restoreAllMocks())

describe('mission action guard', () => {
  it('does not render a flight screen for an inspector', async () => {
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue(permissions)
    render(
      <MissionActionGuard missionId="m1" action="flight">
        <div>Flight controls</div>
      </MissionActionGuard>,
    )
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByText('Flight controls')).toBeNull()
  })
  it('allows inspection independently of wizard progress', async () => {
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue(permissions)
    render(
      <MissionActionGuard missionId="m1" action="postflight">
        <div>Inspection form</div>
      </MissionActionGuard>,
    )
    expect(await screen.findByText('Inspection form')).toBeTruthy()
  })
  it('fails closed if the backend denies permission', async () => {
    vi.spyOn(missionApi, 'getPermissions').mockRejectedValue(
      new Error('Forbidden'),
    )
    render(
      <MissionActionGuard missionId="m1" action="upload">
        <div>Upload form</div>
      </MissionActionGuard>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('Forbidden')
    expect(screen.queryByText('Upload form')).toBeNull()
  })
})
