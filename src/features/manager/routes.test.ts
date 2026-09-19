import { describe, expect, it } from 'vitest'

import { managerHref, parseManagerRoute, type ManagerRoute } from './routes'

describe('parseManagerRoute', () => {
  it('parses the dashboard route (MNG-01)', () => {
    expect(parseManagerRoute('#portal/staff')).toEqual({
      screen: 'dashboard',
    })
  })

  it('parses the order queue route (MNG-02)', () => {
    expect(parseManagerRoute('#portal/staff/orders')).toEqual({
      screen: 'orderQueue',
    })
  })

  it('parses the order review route (MNG-03)', () => {
    expect(parseManagerRoute('#portal/staff/orders/ORD-1')).toEqual({
      screen: 'orderReview',
      orderId: 'ORD-1',
    })
  })

  it('parses the create-mission route (MNG-04)', () => {
    expect(parseManagerRoute('#portal/staff/orders/ORD-1/mission')).toEqual({
      screen: 'missionCreate',
      orderId: 'ORD-1',
    })
  })

  it('parses the dispatch route (MNG-05)', () => {
    expect(parseManagerRoute('#portal/staff/missions/MSN-1/dispatch')).toEqual({
      screen: 'missionDispatch',
      missionId: 'MSN-1',
    })
  })

  it('parses the schedule route (MNG-06)', () => {
    expect(parseManagerRoute('#portal/staff/schedule')).toEqual({
      screen: 'schedule',
    })
  })

  it('parses the live-monitoring routes (MNG-07), with and without missionId', () => {
    expect(parseManagerRoute('#portal/staff/live')).toEqual({
      screen: 'live',
      missionId: undefined,
    })
    expect(parseManagerRoute('#portal/staff/live/MSN-1')).toEqual({
      screen: 'live',
      missionId: 'MSN-1',
    })
  })

  it('parses the mission list routes (MNG-08), with and without missionId', () => {
    expect(parseManagerRoute('#portal/staff/missions')).toEqual({
      screen: 'missions',
      missionId: undefined,
    })
    expect(parseManagerRoute('#portal/staff/missions/MSN-1')).toEqual({
      screen: 'missions',
      missionId: 'MSN-1',
    })
  })

  it('parses the fleet routes (MNG-09), with and without droneId', () => {
    expect(parseManagerRoute('#portal/staff/drones')).toEqual({
      screen: 'drones',
      droneId: undefined,
    })
    expect(parseManagerRoute('#portal/staff/drones/DRN-1')).toEqual({
      screen: 'drones',
      droneId: 'DRN-1',
    })
  })

  it('parses the maintenance route (MNG-10)', () => {
    expect(parseManagerRoute('#portal/staff/maintenance')).toEqual({
      screen: 'maintenance',
    })
  })

  it('parses the media route (MNG-11)', () => {
    expect(parseManagerRoute('#portal/staff/media')).toEqual({
      screen: 'media',
    })
  })

  it('parses the reports route (MNG-12)', () => {
    expect(parseManagerRoute('#portal/staff/reports')).toEqual({
      screen: 'reports',
    })
  })

  it('falls back to notFound for hashes outside the manager prefix', () => {
    expect(parseManagerRoute('#portal/customer')).toEqual({
      screen: 'notFound',
    })
    expect(parseManagerRoute('')).toEqual({ screen: 'notFound' })
  })

  it('falls back to notFound for unknown sub-paths and malformed segments', () => {
    expect(parseManagerRoute('#portal/staff/unknown')).toEqual({
      screen: 'notFound',
    })
    expect(parseManagerRoute('#portal/staff/orders/ORD-1/extra')).toEqual({
      screen: 'notFound',
    })
    expect(parseManagerRoute('#portal/staff/orders/ORD-1/not-mission')).toEqual(
      { screen: 'notFound' },
    )
    expect(parseManagerRoute('#portal/staff/missions/MSN-1/extra')).toEqual({
      screen: 'notFound',
    })
    expect(parseManagerRoute('#portal/staff/live/MSN-1/extra')).toEqual({
      screen: 'notFound',
    })
    expect(parseManagerRoute('#portal/staff/drones/DRN-1/extra')).toEqual({
      screen: 'notFound',
    })
    expect(parseManagerRoute('#portal/staff/schedule/extra')).toEqual({
      screen: 'notFound',
    })
    expect(parseManagerRoute('#portal/staff/maintenance/extra')).toEqual({
      screen: 'notFound',
    })
    expect(parseManagerRoute('#portal/staff/media/extra')).toEqual({
      screen: 'notFound',
    })
    expect(parseManagerRoute('#portal/staff/reports/extra')).toEqual({
      screen: 'notFound',
    })
  })
})

describe('managerHref', () => {
  const cases: Array<[ManagerRoute, string]> = [
    [{ screen: 'dashboard' }, '#portal/staff'],
    [{ screen: 'orderQueue' }, '#portal/staff/orders'],
    [{ screen: 'orderReview', orderId: 'ORD-1' }, '#portal/staff/orders/ORD-1'],
    [
      { screen: 'missionCreate', orderId: 'ORD-1' },
      '#portal/staff/orders/ORD-1/mission',
    ],
    [
      { screen: 'missionDispatch', missionId: 'MSN-1' },
      '#portal/staff/missions/MSN-1/dispatch',
    ],
    [{ screen: 'schedule' }, '#portal/staff/schedule'],
    [{ screen: 'live' }, '#portal/staff/live'],
    [{ screen: 'live', missionId: 'MSN-1' }, '#portal/staff/live/MSN-1'],
    [{ screen: 'missions' }, '#portal/staff/missions'],
    [
      { screen: 'missions', missionId: 'MSN-1' },
      '#portal/staff/missions/MSN-1',
    ],
    [{ screen: 'drones' }, '#portal/staff/drones'],
    [{ screen: 'drones', droneId: 'DRN-1' }, '#portal/staff/drones/DRN-1'],
    [{ screen: 'maintenance' }, '#portal/staff/maintenance'],
    [{ screen: 'media' }, '#portal/staff/media'],
    [{ screen: 'reports' }, '#portal/staff/reports'],
    [{ screen: 'notFound' }, '#portal/staff'],
  ]

  it.each(cases)('builds the href for %o', (route, expected) => {
    expect(managerHref(route)).toBe(expected)
  })

  it('round-trips every route through parseManagerRoute', () => {
    for (const [route] of cases) {
      if (route.screen === 'notFound') continue
      expect(parseManagerRoute(managerHref(route))).toEqual(route)
    }
  })
})
