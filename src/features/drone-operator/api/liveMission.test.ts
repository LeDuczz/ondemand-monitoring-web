import { describe, expect, it } from 'vitest'

import {
  toFlightDrone,
  toFlightMission,
  toOperatorMission,
} from './liveMission'

const mission = {
  id: '540c79a9-c987-4ea2-a46b-57a7ae967f93',
  missionCode: 'MS-8E897AE9',
  status: 'IN_FLIGHT',
  deviceId: '390b6b53-00a1-446c-abb2-93d8ffcd6454',
  droneCode: 'DRN-02',
  orderTitle: 'Giám sát khu vực',
  plan: {
    waypoints: [
      { id: '2', sequence: 2, simX: 2, simY: 3, altitudeM: 10 },
      { id: '1', sequence: 1, simX: 0, simY: 0, altitudeM: 5 },
    ],
  },
}

describe('live mission mapping', () => {
  it('keeps the backend ID for API calls and the code for display', () => {
    expect(toOperatorMission(mission).id).toBe(mission.id)
    expect(toOperatorMission(mission).missionCode).toBe(mission.missionCode)
    expect(toOperatorMission(mission).droneCode).toBe(mission.droneCode)
    expect(toFlightMission(mission).backendId).toBe(mission.id)
    expect(toFlightMission(mission).id).toBe(mission.missionCode)
    expect(toFlightDrone(mission).id).toBe(mission.deviceId)
    expect(toFlightDrone(mission).name).toBe(mission.droneCode)
  })

  it('uses only the assigned mission route in sequence order', () => {
    expect(
      toFlightMission(mission).routePoints?.map((point) => point.sequence),
    ).toEqual([1, 2])
  })

  it('shows an accepted crew assignment as accepted even while other crew are pending', () => {
    const mapped = toOperatorMission(
      {
        ...mission,
        status: 'WAITING_CREW_CONFIRMATION',
        staffAssignments: [
          { staffId: 'staff-1', responseStatus: 'ACCEPTED' },
          { staffId: 'staff-2', responseStatus: 'PENDING' },
        ],
      },
      'staff-1',
    )

    expect(mapped.myResponseStatus).toBe('ACCEPTED')
    expect(mapped.status).toBe('ACCEPTED')
  })
})
