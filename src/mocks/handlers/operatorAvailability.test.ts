import { afterEach, describe, it, expect, beforeEach } from 'vitest'
import {
  registerMockRoutes,
  resetMockRoutes,
  mockFetch,
  ok,
  fail,
} from '../mockServer'
import availabilityData from '../data/operator-availability.json'
import type { AvailabilitySlot, MissionOverlay } from '../../features/drone-operator/omss/types'

type Store = { week: string; slots: AvailabilitySlot[]; missionOverlays: MissionOverlay[] }

function setupRoutes() {
  const store: Record<string, Store> = {
    [availabilityData.week]: {
      week: availabilityData.week,
      slots: availabilityData.slots as AvailabilitySlot[],
      missionOverlays: availabilityData.missionOverlays as MissionOverlay[],
    },
  }

  registerMockRoutes([
    {
      method: 'GET',
      path: '/api/operator/availability',
      handler: ({ query }) => {
        const week = query.get('week')
        if (!week) return fail(400, 'BAD_REQUEST', 'Thiếu tham số week')
        const data = store[week] ?? { week, slots: [], missionOverlays: [] }
        return ok(data)
      },
    },
    {
      method: 'PUT',
      path: '/api/operator/availability',
      handler: ({ body }) => {
        const payload = body as { week?: string; slots?: AvailabilitySlot[] }
        if (!payload?.week) return fail(400, 'BAD_REQUEST', 'Thiếu trường week')
        const existing = store[payload.week] ?? { week: payload.week, slots: [], missionOverlays: [] }
        store[payload.week] = { ...existing, slots: payload.slots ?? existing.slots }
        return ok(store[payload.week])
      },
    },
  ])
}

describe('operatorAvailability mock handlers', () => {
  beforeEach(() => {
    setupRoutes()
  })

  afterEach(() => {
    resetMockRoutes()
  })

  it('GET with known week returns slots', async () => {
    const res = await mockFetch(
      'http://localhost/api/operator/availability?week=2026-W39',
    )
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.week).toBe('2026-W39')
    expect(Array.isArray(json.data.slots)).toBe(true)
    expect(json.data.slots.length).toBeGreaterThan(0)
  })

  it('GET with unknown week returns empty slots', async () => {
    const res = await mockFetch(
      'http://localhost/api/operator/availability?week=2026-W40',
    )
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.week).toBe('2026-W40')
    expect(json.data.slots).toEqual([])
  })

  it('GET without week param returns 400', async () => {
    const res = await mockFetch('http://localhost/api/operator/availability')
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.success).toBe(false)
  })

  it('PUT saves new slots and returns them', async () => {
    const body = {
      week: '2026-W40',
      slots: [{ date: '2026-09-28', hour: 8, minute: 0, status: 'AVAILABLE' }],
    }
    const res = await mockFetch('http://localhost/api/operator/availability', {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.week).toBe('2026-W40')
    expect(json.data.slots).toHaveLength(1)
    expect(json.data.slots[0].status).toBe('AVAILABLE')
  })

  it('PUT without week returns 400', async () => {
    const res = await mockFetch('http://localhost/api/operator/availability', {
      method: 'PUT',
      body: JSON.stringify({ slots: [] }),
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.success).toBe(false)
  })
})
