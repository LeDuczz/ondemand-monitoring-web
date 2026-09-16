import type {
  FlightControllerMediaClient,
  CommandUpdateListener,
} from './flightControllerMediaClient'
import type { LocalMedia, MediaCommandAck } from '../types/media'

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds))

const commandId = () => crypto.randomUUID()

const makePreview = (label: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><rect width="960" height="540" fill="${color}"/><path d="M0 410 190 280l140 80 170-150 220 170 240-110v270H0z" fill="#ffffff" opacity=".18"/><circle cx="760" cy="140" r="54" fill="#ffffff" opacity=".22"/><text x="48" y="90" fill="#ffffff" font-family="Arial" font-size="24" font-weight="700">${label}</text><text x="48" y="126" fill="#ffffff" opacity=".8" font-family="Arial" font-size="16">Local operator preview</text></svg>`)}`

const initialMedia: LocalMedia[] = [
  {
    localMediaId: 'media-local-001',
    missionId: 'FLOW4-MISSION-001',
    droneId: 'DRONE-01',
    mediaType: 'IMAGE',
    status: 'REVIEW_PENDING',
    fileName: 'tower-north-001.jpg',
    localPath:
      '/tmp/forest3d_drone_media/FLOW4-MISSION-001/media-local-001.jpg',
    contentType: 'image/jpeg',
    fileSize: 2457600,
    checksumSha256: 'c8f10d9b4d92e1a2…',
    capturedAt: '2026-09-13T09:42:00Z',
    previewUrl: makePreview('TOWER NORTH / CAPTURE 001', '#075985'),
  },
  {
    localMediaId: 'media-local-002',
    missionId: 'FLOW4-MISSION-001',
    droneId: 'DRONE-01',
    mediaType: 'VIDEO',
    status: 'RETRY_REQUIRED',
    fileName: 'tower-inspection-pass-01.mp4',
    localPath:
      '/tmp/forest3d_drone_videos/FLOW4-MISSION-001/media-local-002.mp4',
    contentType: 'video/mp4',
    fileSize: 18432000,
    checksumSha256: '2b9b8cfe801a07d4…',
    capturedAt: '2026-09-13T09:36:00Z',
    backendMediaId: 'media-backend-002',
    errorCode: 'VALIDATION_FAILED',
    errorMessage: 'Validation timed out. The local file is safe to retry.',
    previewUrl: makePreview('TOWER SOUTH / VIDEO PASS 01', '#1e3a8a'),
  },
]

export class FakeFlightControllerMediaClient implements FlightControllerMediaClient {
  private media = [...initialMedia]
  private connected = false
  private listeners = new Map<string, Set<CommandUpdateListener>>()

  async connect() {
    await wait(250)
    this.connected = true
  }

  async disconnect() {
    this.connected = false
  }

  isConnected() {
    return this.connected
  }

  async captureImage(id: string, missionId: string, droneId: string) {
    await wait(400)
    const media = this.createMedia(
      'IMAGE',
      missionId,
      droneId,
      'capture-image.jpg',
    )
    this.media = [media, ...this.media]
    return this.ack(id, 'SUCCEEDED', media)
  }

  async startVideo(id: string, missionId: string, droneId: string) {
    await wait(250)
    return this.ack(
      id,
      'SUCCEEDED',
      undefined,
      undefined,
      `Recording started for ${droneId} on ${missionId}`,
    )
  }

  async stopVideo(id: string, missionId: string, droneId: string) {
    await wait(400)
    const media = this.createMedia(
      'VIDEO',
      missionId,
      droneId,
      'inspection-video.mp4',
    )
    this.media = [media, ...this.media]
    return this.ack(id, 'SUCCEEDED', media)
  }

  async listMedia(missionId: string) {
    await wait(180)
    return this.media.filter((media) => media.missionId === missionId)
  }

  async discardMedia(id: string, localMediaId: string) {
    await wait(240)
    const media = this.getMedia(localMediaId)
    const discarded = { ...media, status: 'DISCARDED' as const }
    this.replace(discarded)
    return this.ack(id, 'SUCCEEDED', discarded)
  }

  async uploadMedia(id: string, localMediaId: string) {
    const media = this.getMedia(localMediaId)
    const accepted = {
      ...media,
      status: 'UPLOAD_PENDING' as const,
      backendMediaId: `media-backend-${localMediaId.slice(-3)}`,
    }
    this.replace(accepted)
    this.publish(id, 'ACCEPTED', accepted)
    void this.runUpload(id, accepted)
    return this.ack(id, 'ACCEPTED', accepted)
  }

  watchCommand(id: string, listener: CommandUpdateListener) {
    const listeners = this.listeners.get(id) ?? new Set<CommandUpdateListener>()
    listeners.add(listener)
    this.listeners.set(id, listeners)
    return () => listeners.delete(listener)
  }

  async getPreviewUrl(media: LocalMedia) {
    return media.previewUrl ?? ''
  }

  releasePreviewUrl() {
    // Fake previews are data URLs and do not allocate object URLs.
  }

  private async runUpload(id: string, media: LocalMedia) {
    await wait(500)
    this.publish(id, 'RUNNING', { ...media, status: 'UPLOADING' })
    await wait(700)
    this.publish(id, 'RUNNING', { ...media, status: 'VALIDATING' })
    await wait(1000)
    const available = { ...media, status: 'AVAILABLE' as const }
    this.replace(available)
    this.publish(id, 'SUCCEEDED', available)
  }

  private publish(
    id: string,
    state: MediaCommandAck['state'],
    media: LocalMedia,
  ) {
    const update = this.ack(id, state, media)
    this.listeners.get(id)?.forEach((listener) => listener(update))
  }

  private createMedia(
    mediaType: LocalMedia['mediaType'],
    missionId: string,
    droneId: string,
    fileName: string,
  ): LocalMedia {
    const id = commandId()
    return {
      localMediaId: `media-${id.slice(0, 8)}`,
      missionId,
      droneId,
      mediaType,
      status: 'REVIEW_PENDING',
      fileName,
      localPath: `/tmp/forest3d_drone_media/${missionId}/${fileName}`,
      contentType: mediaType === 'IMAGE' ? 'image/jpeg' : 'video/mp4',
      fileSize: mediaType === 'IMAGE' ? 3145728 : 24576000,
      checksumSha256: `${id.replaceAll('-', '').slice(0, 16)}…`,
      capturedAt: new Date().toISOString(),
      previewUrl: makePreview(
        mediaType === 'IMAGE' ? 'NEW IMAGE CAPTURE' : 'NEW VIDEO CAPTURE',
        mediaType === 'IMAGE' ? '#0f766e' : '#4338ca',
      ),
    }
  }

  private getMedia(id: string) {
    const media = this.media.find((item) => item.localMediaId === id)
    if (!media) throw new Error('Local media does not exist')
    return media
  }

  private replace(media: LocalMedia) {
    this.media = this.media.map((item) =>
      item.localMediaId === media.localMediaId ? media : item,
    )
  }

  private ack(
    commandId: string,
    state: MediaCommandAck['state'],
    media?: LocalMedia,
    errorCode?: MediaCommandAck['errorCode'],
    errorMessage?: string,
  ): MediaCommandAck {
    return { commandId, state, media, errorCode, errorMessage }
  }
}
