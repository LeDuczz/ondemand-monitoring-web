import type {
  LocalMedia,
  MediaCommandAck,
  MediaCommandUpdate,
} from '../types/media'

export type CommandUpdateListener = (update: MediaCommandUpdate) => void

export interface FlightControllerMediaClient {
  connect(): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
  captureImage(
    commandId: string,
    missionId: string,
    droneId: string,
  ): Promise<MediaCommandAck>
  startVideo(
    commandId: string,
    missionId: string,
    droneId: string,
  ): Promise<MediaCommandAck>
  stopVideo(
    commandId: string,
    missionId: string,
    droneId: string,
  ): Promise<MediaCommandAck>
  listMedia(missionId: string): Promise<LocalMedia[]>
  discardMedia(
    commandId: string,
    localMediaId: string,
  ): Promise<MediaCommandAck>
  uploadMedia(commandId: string, localMediaId: string): Promise<MediaCommandAck>
  watchCommand(commandId: string, listener: CommandUpdateListener): () => void
  getPreviewUrl(media: LocalMedia): Promise<string>
  releasePreviewUrl(url: string): void
}
