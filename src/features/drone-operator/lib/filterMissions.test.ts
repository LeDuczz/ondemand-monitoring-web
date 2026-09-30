import { describe, expect, it } from 'vitest'

import { filterMissions, missionsByTab, tabOfMission } from './filterMissions'
import type { OperatorMission } from '../types/mission'

const missions: OperatorMission[] = [
  {
    id: 'MSN-2609-0152-1',
    status: 'PENDING',
    title: 'Kiểm tra nhiệt hệ thống điện KCN Hiệp Phước',
    location: 'KCN Hiệp Phước, H. Nhà Bè',
    date: '2026-09-24',
    startTime: '13:00',
    endTime: '14:30',
    serviceLabel: 'Kiểm tra nhiệt mái và tấm pin',
    droneCode: 'DRN-01',
    droneName: 'Đại Bàng',
  },
  {
    id: 'MSN-2609-0141-1',
    status: 'ACCEPTED',
    title: 'Kiểm tra nhiệt tủ điện tổng KCN Hiệp Phước',
    location: 'KCN Hiệp Phước, H. Nhà Bè',
    date: '2026-09-19',
    startTime: '16:15',
    endTime: '17:15',
    serviceLabel: 'Kiểm tra nhiệt mái và tấm pin',
    droneCode: 'DRN-04',
    droneName: 'Sếu Đầu Đỏ',
  },
  {
    id: 'MSN-2609-0118-1',
    status: 'COMPLETED',
    title: 'Kiểm tra nhiệt mái nhà xưởng KCN Long Hậu',
    location: 'KCN Long Hậu, H. Cần Giuộc',
    date: '2026-09-11',
    startTime: '08:00',
    endTime: '09:15',
    serviceLabel: 'Kiểm tra nhiệt mái và tấm pin',
    droneCode: 'DRN-01',
    droneName: 'Đại Bàng',
    completedAt: '2026-09-11T09:32:00+07:00',
  },
]

describe('tabOfMission / missionsByTab', () => {
  it('buckets PENDING into pending, ACCEPTED/IN_FLIGHT into upcoming, COMPLETED/REJECTED into history', () => {
    expect(tabOfMission(missions[0], new Date())).toBe('pending')
    expect(tabOfMission(missions[1], new Date())).toBe('upcoming')
    expect(tabOfMission(missions[2], new Date())).toBe('history')
  })

  it('filters a list down to one tab', () => {
    expect(missionsByTab(missions, 'pending', new Date())).toHaveLength(1)
    expect(missionsByTab(missions, 'upcoming', new Date())).toHaveLength(1)
    expect(missionsByTab(missions, 'history', new Date())).toHaveLength(1)
  })
})

describe('filterMissions', () => {
  it('returns everything for an empty query', () => {
    expect(filterMissions(missions, '')).toHaveLength(3)
  })

  it('matches by mission code, case-insensitively', () => {
    expect(filterMissions(missions, 'msn-2609-0141')).toEqual([missions[1]])
  })

  it('matches by title/location text, diacritics-insensitively', () => {
    expect(filterMissions(missions, 'nha be')).toHaveLength(2)
  })

  it('matches by drone code or name', () => {
    expect(filterMissions(missions, 'DRN-04')).toEqual([missions[1]])
    expect(filterMissions(missions, 'sếu')).toEqual([missions[1]])
  })

  it('returns no results for an unmatched query', () => {
    expect(filterMissions(missions, 'zzz-not-found')).toHaveLength(0)
  })
})
