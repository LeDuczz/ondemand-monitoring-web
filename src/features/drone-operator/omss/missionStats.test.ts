import { describe, expect, it } from 'vitest'
import { computeOperatorKpis } from './missionStats'
import type { OperatorMission, OperatorProfile } from './types'

const NOW = new Date('2026-09-20T08:00:00+07:00')

const profile: OperatorProfile = {
  id: 'OPR-HT',
  fullName: 'Hoàng Đức Thắng',
  licenseGrade: 'B',
  certExpiryDate: '2026-10-11',
  station: 'Trạm Bình Thạnh',
}

function mission(overrides: Partial<OperatorMission>): OperatorMission {
  return {
    id: 'MSN-1',
    orderRef: 'ORD-1',
    title: 'Kiểm tra',
    subtitle: '',
    state: 'SCHEDULED',
    scheduledAt: '2026-09-21T09:00:00+07:00',
    endAt: '2026-09-21T10:00:00+07:00',
    estimatedMinutes: 60,
    location: 'Q1',
    droneId: 'DRN-01',
    droneName: 'Đại Bàng',
    droneModel: 'M350',
    payload: 'RGB',
    stationName: 'Trạm A',
    stationDistanceKm: 1,
    droneBattery: 90,
    droneHoursFromMaintenance: 10,
    droneStatus: 'AVAILABLE',
    lat: 10,
    lng: 106,
    surveillanceRadiusM: 100,
    maxAltitudeM: 60,
    photoCount: 10,
    photoSpec: null,
    videoCount: 0,
    videoDurationSec: 0,
    videoResolution: null,
    managerNote: null,
    managerName: 'Manager',
    responseDeadline: null,
    ...overrides,
  }
}

describe('computeOperatorKpis', () => {
  it('counts pending missions and picks the earliest response deadline', () => {
    const missions = [
      mission({
        id: 'MSN-1',
        state: 'WAITING_OPERATOR_ACCEPTANCE',
        responseDeadline: '2026-09-24T09:00:00+07:00',
      }),
      mission({
        id: 'MSN-2',
        state: 'WAITING_OPERATOR_ACCEPTANCE',
        responseDeadline: '2026-09-22T09:00:00+07:00',
      }),
      mission({ id: 'MSN-3', state: 'SCHEDULED' }),
    ]
    const kpis = computeOperatorKpis(missions, profile, NOW)
    expect(kpis.pendingCount).toBe(2)
    expect(kpis.pendingDeadlineLabel).toBe('22/09')
  })

  it('counts missions scheduled today and how many are currently in flight', () => {
    const missions = [
      mission({
        id: 'MSN-1',
        scheduledAt: '2026-09-20T09:00:00+07:00',
        state: 'IN_FLIGHT',
      }),
      mission({
        id: 'MSN-2',
        scheduledAt: '2026-09-20T14:00:00+07:00',
        state: 'SCHEDULED',
      }),
      mission({
        id: 'MSN-3',
        scheduledAt: '2026-09-21T09:00:00+07:00',
        state: 'SCHEDULED',
      }),
    ]
    const kpis = computeOperatorKpis(missions, profile, NOW)
    expect(kpis.todayCount).toBe(2)
    expect(kpis.todayInFlightCount).toBe(1)
  })

  it('counts upcoming missions within the next 7 days, excluding closed states', () => {
    const missions = [
      mission({
        id: 'MSN-1',
        scheduledAt: '2026-09-22T09:00:00+07:00',
        state: 'SCHEDULED',
      }),
      mission({
        id: 'MSN-2',
        scheduledAt: '2026-09-30T09:00:00+07:00',
        state: 'SCHEDULED',
      }), // > 7 days
      mission({
        id: 'MSN-3',
        scheduledAt: '2026-09-23T09:00:00+07:00',
        state: 'CANCELLED',
      }),
    ]
    const kpis = computeOperatorKpis(missions, profile, NOW)
    expect(kpis.upcomingWeekCount).toBe(1)
  })

  it('computes days remaining until certificate expiry', () => {
    const kpis = computeOperatorKpis([], profile, NOW)
    expect(kpis.certDaysRemaining).toBe(20)
    expect(kpis.certExpiryLabel).toBe('11/10')
  })

  it('returns null cert fields when there is no profile', () => {
    const kpis = computeOperatorKpis([], null, NOW)
    expect(kpis.certDaysRemaining).toBeNull()
    expect(kpis.certExpiryLabel).toBeNull()
  })
})
