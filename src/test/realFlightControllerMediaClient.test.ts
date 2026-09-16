import { afterEach, describe, expect, it, vi } from 'vitest'

import { authSession } from '../features/auth/api/authApi'
import { RealFlightControllerMediaClient } from '../features/media/api/realFlightControllerMediaClient'

describe('RealFlightControllerMediaClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('forwards the operator access token and mission context to the gateway', async () => {
    vi.spyOn(authSession, 'getAccessToken').mockReturnValue('operator-token')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          commandId: 'command-1',
          state: 'SUCCEEDED',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )
    const client = new RealFlightControllerMediaClient('http://gateway.local')

    await client.captureImage('command-1', 'MISSION / 1', 'DRONE-1')

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(
      'http://gateway.local/api/control/v1/missions/MISSION%20%2F%201/images',
    )
    expect(init?.method).toBe('POST')
    expect(new Headers(init?.headers).get('Authorization')).toBe(
      'Bearer operator-token',
    )
    expect(JSON.parse(String(init?.body))).toEqual({
      commandId: 'command-1',
      droneId: 'DRONE-1',
    })
  })

  it('maps gateway errors and marks a rejected session disconnected', async () => {
    vi.spyOn(authSession, 'getAccessToken').mockReturnValue('expired-token')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 'UNAUTHENTICATED',
          message: 'Access token expired',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )
    const client = new RealFlightControllerMediaClient('http://gateway.local')

    await expect(client.connect()).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      status: 401,
      message: 'Access token expired',
    })
    expect(client.isConnected()).toBe(false)
  })

  it('parses command updates from the SSE stream', async () => {
    vi.spyOn(authSession, 'getAccessToken').mockReturnValue('operator-token')
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'event: command-update\ndata: {"commandId":"command-1","state":"RUNNING"}\n\n',
          ),
        )
        controller.close()
      },
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    )
    const client = new RealFlightControllerMediaClient('http://gateway.local')
    const updates: string[] = []

    client.watchCommand('command-1', (update) => updates.push(update.state))
    await vi.waitFor(() => expect(updates).toEqual(['RUNNING']))
  })
})
