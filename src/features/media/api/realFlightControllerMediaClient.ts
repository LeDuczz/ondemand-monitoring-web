import { env } from '../../../config/env'
import { authSession } from '../../auth/api/authApi'
import type {
  CommandUpdateListener,
  FlightControllerMediaClient,
} from './flightControllerMediaClient'
import type {
  LocalMedia,
  MediaCommandAck,
  MediaCommandUpdate,
} from '../types/media'

type ErrorPayload = {
  code?: string
  message?: string
}

export class ControlGatewayError extends Error {
  readonly code?: string
  readonly status?: number

  constructor(
    message: string,
    code?: string,
    status?: number,
  ) {
    super(message)
    this.code = code
    this.status = status
  }
}

export class RealFlightControllerMediaClient
  implements FlightControllerMediaClient
{
  private connected = false
  private readonly baseUrl: string

  constructor(baseUrl = env.controlApiBaseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  async connect() {
    const health = await this.request<{ ready: boolean }>('/health')
    if (!health.ready) throw new ControlGatewayError('Flight Controller is not ready')
    this.connected = true
  }

  async disconnect() {
    this.connected = false
  }

  isConnected() {
    return this.connected
  }

  captureImage(commandId: string, missionId: string, droneId: string) {
    return this.command(`/missions/${segment(missionId)}/images`, {
      commandId,
      droneId,
    })
  }

  startVideo(commandId: string, missionId: string, droneId: string) {
    return this.command(`/missions/${segment(missionId)}/videos/start`, {
      commandId,
      droneId,
    })
  }

  stopVideo(commandId: string, missionId: string, droneId: string) {
    return this.command(`/missions/${segment(missionId)}/videos/stop`, {
      commandId,
      droneId,
    })
  }

  listMedia(missionId: string) {
    return this.request<LocalMedia[]>(`/missions/${segment(missionId)}/media`)
  }

  discardMedia(commandId: string, localMediaId: string) {
    return this.command(`/media/${segment(localMediaId)}/discard`, {
      commandId,
    })
  }

  uploadMedia(commandId: string, localMediaId: string) {
    return this.command(`/media/${segment(localMediaId)}/upload`, {
      commandId,
    })
  }

  watchCommand(commandId: string, listener: CommandUpdateListener) {
    const controller = new AbortController()
    void this.consumeCommandEvents(commandId, listener, controller.signal)
    return () => controller.abort()
  }

  async getPreviewUrl(media: LocalMedia) {
    const response = await this.fetch(
      `/media/${segment(media.localMediaId)}/preview`,
    )
    if (!response.ok) await this.throwResponse(response)
    return URL.createObjectURL(await response.blob())
  }

  releasePreviewUrl(url: string) {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url)
  }

  private command(path: string, payload: object) {
    return this.request<MediaCommandAck>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.fetch(path, init)
    if (!response.ok) await this.throwResponse(response)
    return (await response.json()) as T
  }

  private fetch(path: string, init: RequestInit = {}) {
    const token = authSession.getAccessToken()
    const headers = new Headers(init.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return fetch(`${this.baseUrl}/api/control/v1${path}`, {
      ...init,
      headers,
      credentials: 'include',
    })
  }

  private async consumeCommandEvents(
    commandId: string,
    listener: CommandUpdateListener,
    signal: AbortSignal,
  ) {
    try {
      const response = await this.fetch(`/commands/${segment(commandId)}/events`, {
        headers: { Accept: 'text/event-stream' },
        signal,
      })
      if (!response.ok) await this.throwResponse(response)
      if (!response.body) throw new ControlGatewayError('Command stream is unavailable')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (!signal.aborted) {
        const { done, value } = await reader.read()
        buffer += decoder.decode(value, { stream: !done })
        const events = buffer.split(/\r?\n\r?\n/)
        buffer = events.pop() ?? ''
        for (const event of events) {
          const data = event
            .split(/\r?\n/)
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trimStart())
            .join('\n')
          if (!data) continue
          listener(JSON.parse(data) as MediaCommandUpdate)
        }
        if (done) break
      }
    } catch (error) {
      if (!signal.aborted) {
        listener({
          commandId,
          state: 'FAILED',
          errorCode: 'GRPC_UNAVAILABLE',
          errorMessage:
            error instanceof Error ? error.message : 'Command stream failed',
        })
      }
    }
  }

  private async throwResponse(response: Response): Promise<never> {
    const payload = (await response.json().catch(() => undefined)) as
      | ErrorPayload
      | undefined
    if (response.status === 401) this.connected = false
    throw new ControlGatewayError(
      payload?.message ?? `Control Gateway request failed (${response.status})`,
      payload?.code,
      response.status,
    )
  }
}

const segment = (value: string) => encodeURIComponent(value)
